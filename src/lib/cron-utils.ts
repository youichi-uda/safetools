export interface FieldConfig {
  label: string;
  min: number;
  max: number;
  names?: string[];
}

export const FIELD_CONFIGS: FieldConfig[] = [
  { label: 'Minute', min: 0, max: 59 },
  { label: 'Hour', min: 0, max: 23 },
  { label: 'Day of Month', min: 1, max: 31 },
  {
    label: 'Month',
    min: 1,
    max: 12,
    names: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  {
    label: 'Day of Week',
    min: 0,
    max: 6,
    names: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
];

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function generateDescription(expression: string): string {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return 'Invalid cron expression';

  const [minute, hour, dom, month, dow] = parts;

  if (minute === '*' && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return 'Every minute';
  }

  if (minute.startsWith('*/') && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    const n = parseInt(minute.slice(2), 10);
    return `Every ${n} minute${n !== 1 ? 's' : ''}`;
  }

  const segments: string[] = [];

  if (minute !== '*' && hour !== '*') {
    segments.push(`at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`);
  } else if (minute !== '*' && hour === '*') {
    segments.push(`every hour at minute ${minute}`);
  } else if (minute === '*' && hour !== '*') {
    segments.push(`every minute during hour ${hour}`);
  }

  if (dow !== '*') {
    let dayStr: string;
    if (dow.includes('-')) {
      const [start, end] = dow.split('-').map(Number);
      dayStr = `${DAY_NAMES[start] || `day ${start}`} through ${DAY_NAMES[end] || `day ${end}`}`;
    } else if (dow.startsWith('*/')) {
      const n = parseInt(dow.slice(2), 10);
      dayStr = `every ${n} day(s) of the week`;
    } else {
      const dayValues = dow.split(',').map(Number);
      dayStr = dayValues.map((d) => DAY_NAMES[d] || `day ${d}`).join(', ');
    }
    segments.unshift(`Every ${dayStr}`);
  }

  if (dom !== '*') {
    if (dow === '*') {
      segments.unshift(`On day ${dom} of the month`);
    } else {
      segments.push(`and day ${dom} of the month`);
    }
  }

  if (month !== '*') {
    let monthStr: string;
    if (month.includes('-')) {
      const [start, end] = month.split('-').map(Number);
      monthStr = `${MONTH_NAMES[start] || `month ${start}`} through ${MONTH_NAMES[end] || `month ${end}`}`;
    } else if (month.startsWith('*/')) {
      const n = parseInt(month.slice(2), 10);
      monthStr = `every ${n} month(s)`;
    } else {
      const monthValues = month.split(',').map(Number);
      monthStr = monthValues.map((m) => MONTH_NAMES[m] || `month ${m}`).join(', ');
    }
    segments.push(`in ${monthStr}`);
  }

  if (segments.length === 0) {
    if (minute !== '*') {
      return `Every hour at minute ${minute}`;
    }
    return 'Every minute';
  }

  if (dow === '*' && dom === '*' && month === '*' && segments.length > 0) {
    if (!segments[0].startsWith('Every') && !segments[0].startsWith('On')) {
      segments.unshift('Every day');
    }
  }

  if (dom !== '*' && dow === '*' && month === '*' && hour !== '*' && minute !== '*') {
    return `Monthly on day ${dom} at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }

  let result = segments.join(' ');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function matchesCronField(value: number, token: string): boolean {
  if (token === '*') return true;

  if (token.startsWith('*/')) {
    const interval = parseInt(token.slice(2), 10);
    return value % interval === 0;
  }

  if (token.includes('-')) {
    const [start, end] = token.split('-').map(Number);
    return value >= start && value <= end;
  }

  if (token.includes(',')) {
    return token.split(',').map(Number).includes(value);
  }

  return value === parseInt(token, 10);
}

export function getNextRuns(expression: string, count: number): Date[] {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const [minToken, hourToken, domToken, monthToken, dowToken] = parts;
  const runs: Date[] = [];
  const now = new Date();
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);

  const maxIterations = 525600;

  for (let i = 0; i < maxIterations && runs.length < count; i++) {
    const candidate = new Date(current.getTime() + i * 60000);
    const min = candidate.getMinutes();
    const hr = candidate.getHours();
    const dom = candidate.getDate();
    const mon = candidate.getMonth() + 1;
    const dow = candidate.getDay();

    if (
      matchesCronField(min, minToken) &&
      matchesCronField(hr, hourToken) &&
      matchesCronField(dom, domToken) &&
      matchesCronField(mon, monthToken) &&
      matchesCronField(dow, dowToken)
    ) {
      runs.push(candidate);
    }
  }

  return runs;
}

const SYSTEMD_DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function convertDowToken(token: string): string {
  if (token === '*') return '';
  if (token.includes('-')) {
    const [start, end] = token.split('-').map(Number);
    return `${SYSTEMD_DOW[start]}..${SYSTEMD_DOW[end]}`;
  }
  if (token.includes(',')) {
    return token.split(',').map((v) => SYSTEMD_DOW[parseInt(v, 10)]).join(',');
  }
  if (token.startsWith('*/')) {
    // systemd doesn't support */N for dow directly; expand it
    const interval = parseInt(token.slice(2), 10);
    const days: string[] = [];
    for (let i = 0; i <= 6; i += interval) {
      days.push(SYSTEMD_DOW[i]);
    }
    return days.join(',');
  }
  return SYSTEMD_DOW[parseInt(token, 10)] || token;
}

function convertTimeToken(token: string, isMinuteOrHour: boolean): string {
  if (token === '*') return '*';
  if (token.startsWith('*/')) {
    const interval = token.slice(2);
    return isMinuteOrHour ? `00/${interval}` : `*/${interval}`;
  }
  if (token.includes('-')) {
    const [start, end] = token.split('-');
    return `${start}..${end}`;
  }
  if (token.includes(',')) return token;
  // Single value — zero-pad for minute/hour
  if (isMinuteOrHour) return token.padStart(2, '0');
  return token;
}

export function cronToOnCalendar(expression: string): string | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const [minToken, hourToken, domToken, monthToken, dowToken] = parts;

  const dow = convertDowToken(dowToken);
  const month = convertTimeToken(monthToken, false);
  const dom = convertTimeToken(domToken, false);
  const hour = convertTimeToken(hourToken, true);
  const minute = convertTimeToken(minToken, true);

  const datePart = `${month === '*' ? '*' : month}-${dom === '*' ? '*' : dom}`;
  const timePart = `${hour}:${minute}:00`;

  if (dow) {
    return `${dow} *-${datePart} ${timePart}`;
  }
  return `*-${datePart} ${timePart}`;
}

export function getFieldDescription(index: number, token: string): string {
  const config = FIELD_CONFIGS[index];
  if (token === '*') return `Every ${config.label.toLowerCase()}`;

  if (token.startsWith('*/')) {
    const n = parseInt(token.slice(2), 10);
    return `Every ${n} ${config.label.toLowerCase()}${n !== 1 ? 's' : ''}`;
  }

  if (token.includes('-')) {
    const [start, end] = token.split('-');
    const startLabel = config.names ? config.names[parseInt(start, 10) - config.min] || start : start;
    const endLabel = config.names ? config.names[parseInt(end, 10) - config.min] || end : end;
    return `${startLabel} through ${endLabel}`;
  }

  if (token.includes(',')) {
    const values = token.split(',');
    const labels = values.map((v) => {
      const num = parseInt(v, 10);
      return config.names ? config.names[num - config.min] || v : v;
    });
    return labels.join(', ');
  }

  const num = parseInt(token, 10);
  if (config.names) {
    return config.names[num - config.min] || token;
  }
  return token;
}
