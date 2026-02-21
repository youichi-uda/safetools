import { useState, useCallback, useMemo } from 'react';
import CopyButton from '@/components/shared/CopyButton';

type FieldMode = 'every' | 'specific' | 'range' | 'interval';

interface FieldState {
  mode: FieldMode;
  specific: number[];
  rangeStart: number;
  rangeEnd: number;
  interval: number;
}

interface FieldConfig {
  label: string;
  min: number;
  max: number;
  names?: string[];
}

const FIELD_CONFIGS: FieldConfig[] = [
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

const PRESETS: { label: string; expression: string }[] = [
  { label: 'Every minute', expression: '* * * * *' },
  { label: 'Every 5 minutes', expression: '*/5 * * * *' },
  { label: 'Every hour', expression: '0 * * * *' },
  { label: 'Daily at midnight', expression: '0 0 * * *' },
  { label: 'Every Monday at 9 AM', expression: '0 9 * * 1' },
  { label: 'Monthly on the 1st', expression: '0 0 1 * *' },
];

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function defaultField(config: FieldConfig): FieldState {
  return {
    mode: 'every',
    specific: [config.min],
    rangeStart: config.min,
    rangeEnd: config.max,
    interval: config.label === 'Minute' ? 5 : 1,
  };
}

function fieldToExpression(field: FieldState, config: FieldConfig): string {
  switch (field.mode) {
    case 'every':
      return '*';
    case 'specific':
      return field.specific.length > 0 ? field.specific.sort((a, b) => a - b).join(',') : '*';
    case 'range':
      return `${field.rangeStart}-${field.rangeEnd}`;
    case 'interval':
      return `*/${field.interval}`;
    default:
      return '*';
  }
}

function parseFieldFromExpression(token: string, config: FieldConfig): FieldState {
  const field = defaultField(config);

  if (token === '*') {
    field.mode = 'every';
    return field;
  }

  // Interval: */N
  if (token.startsWith('*/')) {
    const n = parseInt(token.slice(2), 10);
    if (!isNaN(n) && n > 0) {
      field.mode = 'interval';
      field.interval = n;
      return field;
    }
  }

  // Range: A-B
  if (token.includes('-') && !token.includes(',')) {
    const [a, b] = token.split('-').map(Number);
    if (!isNaN(a) && !isNaN(b)) {
      field.mode = 'range';
      field.rangeStart = a;
      field.rangeEnd = b;
      return field;
    }
  }

  // Specific: 1,2,3
  if (token.includes(',') || /^\d+$/.test(token)) {
    const values = token.split(',').map(Number).filter((n) => !isNaN(n));
    if (values.length > 0) {
      field.mode = 'specific';
      field.specific = values;
      return field;
    }
  }

  return field;
}

function generateDescription(expression: string): string {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return 'Invalid cron expression';

  const [minute, hour, dom, month, dow] = parts;

  // Every minute
  if (minute === '*' && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return 'Every minute';
  }

  // Interval on minutes only
  if (minute.startsWith('*/') && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    const n = parseInt(minute.slice(2), 10);
    return `Every ${n} minute${n !== 1 ? 's' : ''}`;
  }

  const segments: string[] = [];

  // Time part
  if (minute !== '*' && hour !== '*') {
    segments.push(`at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`);
  } else if (minute !== '*' && hour === '*') {
    segments.push(`every hour at minute ${minute}`);
  } else if (minute === '*' && hour !== '*') {
    segments.push(`every minute during hour ${hour}`);
  }

  // Day of week
  if (dow !== '*') {
    const dayValues = dow.split(',').map(Number);
    const dayStr = dayValues.map((d) => DAY_NAMES[d] || `day ${d}`).join(', ');
    segments.unshift(`Every ${dayStr}`);
  }

  // Day of month
  if (dom !== '*') {
    if (dow === '*') {
      segments.unshift(`On day ${dom} of the month`);
    } else {
      segments.push(`and day ${dom} of the month`);
    }
  }

  // Month
  if (month !== '*') {
    const monthValues = month.split(',').map(Number);
    const monthStr = monthValues.map((m) => MONTH_NAMES[m] || `month ${m}`).join(', ');
    segments.push(`in ${monthStr}`);
  }

  // Fallback: if only minute is set (e.g. "0 * * * *")
  if (segments.length === 0) {
    if (minute !== '*') {
      return `Every hour at minute ${minute}`;
    }
    return 'Every minute';
  }

  // If no day context was added and it's daily
  if (dow === '*' && dom === '*' && month === '*' && segments.length > 0) {
    // Prepend "Every day" if we only have a time segment
    if (!segments[0].startsWith('Every') && !segments[0].startsWith('On')) {
      segments.unshift('Every day');
    }
  }

  // Monthly shortcut
  if (dom !== '*' && dow === '*' && month === '*' && hour !== '*' && minute !== '*') {
    return `Monthly on day ${dom} at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }

  let result = segments.join(' ');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function matchesCronField(value: number, token: string): boolean {
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

function getNextRuns(expression: string, count: number): Date[] {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const [minToken, hourToken, domToken, monthToken, dowToken] = parts;
  const runs: Date[] = [];
  const now = new Date();
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);

  const maxIterations = 525600; // 1 year of minutes

  for (let i = 0; i < maxIterations && runs.length < count; i++) {
    const candidate = new Date(current.getTime() + i * 60000);
    const min = candidate.getMinutes();
    const hr = candidate.getHours();
    const dom = candidate.getDate();
    const mon = candidate.getMonth() + 1; // 1-12
    const dow = candidate.getDay(); // 0-6

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

function FieldEditor({
  index,
  field,
  config,
  onChange,
}: {
  index: number;
  field: FieldState;
  config: FieldConfig;
  onChange: (index: number, field: FieldState) => void;
}) {
  const updateMode = (mode: FieldMode) => {
    onChange(index, { ...field, mode });
  };

  const optionValues = [];
  for (let i = config.min; i <= config.max; i++) {
    optionValues.push(i);
  }

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">{config.label}</h3>

      <div className="flex flex-wrap gap-2">
        {(['every', 'specific', 'range', 'interval'] as FieldMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => updateMode(mode)}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
              field.mode === mode
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'border-border hover:bg-accent'
            }`}
          >
            {mode === 'every' ? 'Every' : mode === 'specific' ? 'Specific' : mode === 'range' ? 'Range' : 'Interval'}
          </button>
        ))}
      </div>

      {field.mode === 'specific' && (
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
          {optionValues.map((v) => {
            const selected = field.specific.includes(v);
            const displayLabel = config.names ? config.names[v - config.min] || String(v) : String(v);
            return (
              <button
                key={v}
                onClick={() => {
                  const next = selected
                    ? field.specific.filter((x) => x !== v)
                    : [...field.specific, v];
                  onChange(index, { ...field, specific: next.length > 0 ? next : [config.min] });
                }}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  selected
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {displayLabel}
              </button>
            );
          })}
        </div>
      )}

      {field.mode === 'range' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">From</label>
          <select
            value={field.rangeStart}
            onChange={(e) => onChange(index, { ...field, rangeStart: Number(e.target.value) })}
            className="rounded-md border border-border bg-transparent px-2 py-1 text-sm"
          >
            {optionValues.map((v) => (
              <option key={v} value={v}>
                {config.names ? config.names[v - config.min] || v : v}
              </option>
            ))}
          </select>
          <label className="text-xs text-muted-foreground">to</label>
          <select
            value={field.rangeEnd}
            onChange={(e) => onChange(index, { ...field, rangeEnd: Number(e.target.value) })}
            className="rounded-md border border-border bg-transparent px-2 py-1 text-sm"
          >
            {optionValues.map((v) => (
              <option key={v} value={v}>
                {config.names ? config.names[v - config.min] || v : v}
              </option>
            ))}
          </select>
        </div>
      )}

      {field.mode === 'interval' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Every</label>
          <input
            type="number"
            min={1}
            max={config.max}
            value={field.interval}
            onChange={(e) => {
              const val = Math.min(config.max, Math.max(1, Number(e.target.value) || 1));
              onChange(index, { ...field, interval: val });
            }}
            className="w-20 rounded-md border border-border bg-transparent px-2 py-1 text-sm"
          />
          <span className="text-xs text-muted-foreground">{config.label.toLowerCase()}(s)</span>
        </div>
      )}
    </div>
  );
}

export default function CronExpressionGenerator() {
  const [fields, setFields] = useState<FieldState[]>(
    FIELD_CONFIGS.map((c) => defaultField(c))
  );
  const [manualInput, setManualInput] = useState('* * * * *');
  const [isManualEdit, setIsManualEdit] = useState(false);

  const expression = useMemo(() => {
    if (isManualEdit) return manualInput;
    return fields.map((f, i) => fieldToExpression(f, FIELD_CONFIGS[i])).join(' ');
  }, [fields, manualInput, isManualEdit]);

  const description = useMemo(() => generateDescription(expression), [expression]);
  const nextRuns = useMemo(() => getNextRuns(expression, 5), [expression]);

  const handleFieldChange = useCallback((index: number, field: FieldState) => {
    setFields((prev) => {
      const next = [...prev];
      next[index] = field;
      return next;
    });
    setIsManualEdit(false);
  }, []);

  const handleManualChange = useCallback((value: string) => {
    setManualInput(value);
    setIsManualEdit(true);

    const parts = value.trim().split(/\s+/);
    if (parts.length === 5) {
      const newFields = parts.map((token, i) => parseFieldFromExpression(token, FIELD_CONFIGS[i]));
      setFields(newFields);
    }
  }, []);

  const handlePreset = useCallback((expr: string) => {
    setManualInput(expr);
    setIsManualEdit(false);
    const parts = expr.trim().split(/\s+/);
    if (parts.length === 5) {
      const newFields = parts.map((token, i) => parseFieldFromExpression(token, FIELD_CONFIGS[i]));
      setFields(newFields);
    }
  }, []);

  // Keep manualInput in sync when building from visual editor
  const displayExpression = isManualEdit ? manualInput : expression;
  if (!isManualEdit && manualInput !== expression) {
    // Sync without causing re-render loop by using the computed value directly
  }

  const effectiveExpression = isManualEdit ? manualInput : expression;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cron Expression Generator</h1>
        <p className="mt-2 text-muted-foreground">
          Build and test cron scheduling expressions visually. All processing happens entirely in
          your browser — your data never leaves your device.
        </p>
      </div>

      {/* Expression Display */}
      <div className="rounded-lg border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={displayExpression}
            onChange={(e) => handleManualChange(e.target.value)}
            onFocus={() => {
              if (!isManualEdit) {
                setManualInput(expression);
              }
            }}
            className="flex-1 font-mono text-2xl sm:text-3xl text-center rounded-md border border-border bg-transparent px-4 py-3"
            spellCheck={false}
          />
          <CopyButton text={effectiveExpression} label="Copy" />
        </div>
        <p className="text-center text-muted-foreground text-sm">{description}</p>
      </div>

      {/* Presets */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Common Presets
        </h2>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.expression}
              onClick={() => handlePreset(preset.expression)}
              className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Builder */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Visual Builder
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FIELD_CONFIGS.map((config, i) => (
            <FieldEditor
              key={config.label}
              index={i}
              field={fields[i]}
              config={config}
              onChange={handleFieldChange}
            />
          ))}
        </div>
      </div>

      {/* Next Run Times */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Next 5 Run Times
        </h2>
        {nextRuns.length > 0 ? (
          <ul className="space-y-2">
            {nextRuns.map((date, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-md px-3 py-2 bg-accent/30 font-mono text-sm"
              >
                <span className="text-muted-foreground w-6 text-right">{i + 1}.</span>
                <span>
                  {date.toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  {date.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No upcoming runs found within the next year. Check your expression.
          </p>
        )}
      </div>
    </div>
  );
}
