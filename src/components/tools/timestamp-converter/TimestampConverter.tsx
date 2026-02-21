import { useState, useCallback, useEffect } from 'react';
import CopyButton from '@/components/shared/CopyButton';

type TimestampUnit = 'seconds' | 'milliseconds';

interface DateParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
}

const COMMON_TIMESTAMPS = [
  { label: 'Unix Epoch', timestamp: 0, description: 'Jan 1, 1970 00:00:00 UTC' },
  { label: 'Y2K', timestamp: 946684800, description: 'Jan 1, 2000 00:00:00 UTC' },
  { label: '2038 Problem', timestamp: 2147483647, description: 'Jan 19, 2038 03:14:07 UTC' },
];

function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = date.getTime() - now;
  const absDiff = Math.abs(diffMs);
  const isFuture = diffMs > 0;

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let value: string;
  if (seconds < 5) value = 'just now';
  else if (seconds < 60) value = `${seconds} second${seconds !== 1 ? 's' : ''}`;
  else if (minutes < 60) value = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  else if (hours < 24) value = `${hours} hour${hours !== 1 ? 's' : ''}`;
  else if (days < 30) value = `${days} day${days !== 1 ? 's' : ''}`;
  else if (months < 12) value = `${months} month${months !== 1 ? 's' : ''}`;
  else value = `${years} year${years !== 1 ? 's' : ''}`;

  if (value === 'just now') return value;
  return isFuture ? `in ${value}` : `${value} ago`;
}

function formatDate(date: Date, timezone: 'utc' | 'local'): string {
  if (timezone === 'utc') {
    return date.toUTCString();
  }
  return date.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

function formatIso(date: Date): string {
  return date.toISOString();
}

export default function TimestampConverter() {
  const [timestampInput, setTimestampInput] = useState('');
  const [unit, setUnit] = useState<TimestampUnit>('seconds');
  const [parsedDate, setParsedDate] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dateParts, setDateParts] = useState<DateParts>({
    year: '',
    month: '',
    day: '',
    hour: '',
    minute: '',
    second: '',
  });
  const [dateTimezone, setDateTimezone] = useState<'utc' | 'local'>('utc');

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Parse timestamp input
  const parseTimestamp = useCallback(
    (value: string, currentUnit: TimestampUnit) => {
      if (!value.trim()) {
        setParsedDate(null);
        setError('');
        setDateParts({ year: '', month: '', day: '', hour: '', minute: '', second: '' });
        return;
      }
      const num = Number(value);
      if (isNaN(num)) {
        setError('Invalid timestamp. Please enter a number.');
        setParsedDate(null);
        return;
      }
      const ms = currentUnit === 'seconds' ? num * 1000 : num;
      const date = new Date(ms);
      if (isNaN(date.getTime())) {
        setError('Timestamp out of range.');
        setParsedDate(null);
        return;
      }
      setError('');
      setParsedDate(date);
      setDateParts({
        year: String(date.getUTCFullYear()),
        month: String(date.getUTCMonth() + 1),
        day: String(date.getUTCDate()),
        hour: String(date.getUTCHours()),
        minute: String(date.getUTCMinutes()),
        second: String(date.getUTCSeconds()),
      });
    },
    [],
  );

  const handleTimestampChange = useCallback(
    (value: string) => {
      setTimestampInput(value);
      parseTimestamp(value, unit);
    },
    [unit, parseTimestamp],
  );

  const handleUnitChange = useCallback(
    (newUnit: TimestampUnit) => {
      setUnit(newUnit);
      parseTimestamp(timestampInput, newUnit);
    },
    [timestampInput, parseTimestamp],
  );

  const fillNow = useCallback(() => {
    const now = Date.now();
    const value = unit === 'seconds' ? String(Math.floor(now / 1000)) : String(now);
    setTimestampInput(value);
    parseTimestamp(value, unit);
  }, [unit, parseTimestamp]);

  const clear = useCallback(() => {
    setTimestampInput('');
    setParsedDate(null);
    setError('');
    setDateParts({ year: '', month: '', day: '', hour: '', minute: '', second: '' });
  }, []);

  // Convert date parts back to timestamp
  const handleDatePartChange = useCallback(
    (part: keyof DateParts, value: string) => {
      const newParts = { ...dateParts, [part]: value };
      setDateParts(newParts);

      const y = parseInt(newParts.year) || 0;
      const mo = parseInt(newParts.month) || 1;
      const d = parseInt(newParts.day) || 1;
      const h = parseInt(newParts.hour) || 0;
      const mi = parseInt(newParts.minute) || 0;
      const s = parseInt(newParts.second) || 0;

      let date: Date;
      if (dateTimezone === 'utc') {
        date = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
      } else {
        date = new Date(y, mo - 1, d, h, mi, s);
      }

      if (isNaN(date.getTime())) {
        setError('Invalid date values.');
        setParsedDate(null);
        return;
      }

      setError('');
      setParsedDate(date);
      const ts = unit === 'seconds' ? Math.floor(date.getTime() / 1000) : date.getTime();
      setTimestampInput(String(ts));
    },
    [dateParts, unit, dateTimezone],
  );

  const handleQuickTimestamp = useCallback(
    (ts: number) => {
      const value = unit === 'seconds' ? String(ts) : String(ts * 1000);
      setTimestampInput(value);
      parseTimestamp(value, unit);
    },
    [unit, parseTimestamp],
  );

  const currentTimestampSeconds = Math.floor(currentTime.getTime() / 1000);
  const currentTimestampMs = currentTime.getTime();

  const inputClass =
    'w-full px-3 py-1.5 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring';
  const smallInputClass =
    'w-20 px-2 py-1.5 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-center';
  const labelClass = 'text-xs text-muted-foreground';
  const primaryBtn =
    'px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity';
  const secondaryBtn =
    'px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Timestamp Converter</h1>
      <p className="text-muted-foreground text-sm mb-4">
        Convert between Unix timestamps and human-readable dates. All processing happens in your browser.
      </p>

      {/* Live current time */}
      <div className="mb-4 p-3 rounded-lg border border-border bg-accent/30">
        <div className="text-sm font-medium mb-1">Current Time</div>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Unix (s): </span>
            <span className="font-mono">{currentTimestampSeconds}</span>
            <CopyButton text={String(currentTimestampSeconds)} label="Copy" className="ml-2 px-2 py-0.5 text-xs" />
          </div>
          <div>
            <span className="text-muted-foreground">Unix (ms): </span>
            <span className="font-mono">{currentTimestampMs}</span>
            <CopyButton text={String(currentTimestampMs)} label="Copy" className="ml-2 px-2 py-0.5 text-xs" />
          </div>
          <div className="sm:col-span-2">
            <span className="text-muted-foreground">UTC: </span>
            <span className="font-mono">{currentTime.toUTCString()}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-muted-foreground">Local: </span>
            <span className="font-mono">{formatDate(currentTime, 'local')}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={fillNow} className={primaryBtn}>
          Now
        </button>
        <button onClick={clear} className={`${secondaryBtn} text-muted-foreground`}>
          Clear
        </button>
        <div className="h-5 w-px bg-border mx-1" />
        <div className="flex items-center gap-1 text-sm">
          <span className="text-muted-foreground">Unit:</span>
          <button
            onClick={() => handleUnitChange('seconds')}
            className={unit === 'seconds' ? primaryBtn : secondaryBtn}
          >
            Seconds
          </button>
          <button
            onClick={() => handleUnitChange('milliseconds')}
            className={unit === 'milliseconds' ? primaryBtn : secondaryBtn}
          >
            Milliseconds
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Timestamp input */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            Unix Timestamp ({unit === 'seconds' ? 'seconds' : 'milliseconds'})
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={timestampInput}
              onChange={(e) => handleTimestampChange(e.target.value)}
              placeholder={unit === 'seconds' ? 'e.g. 1700000000' : 'e.g. 1700000000000'}
              className={inputClass}
            />
            {timestampInput && <CopyButton text={timestampInput} />}
          </div>
        </div>

        {/* Date parts input */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
            <select
              value={dateTimezone}
              onChange={(e) => setDateTimezone(e.target.value as 'utc' | 'local')}
              className="px-2 py-0.5 text-xs rounded border border-border bg-background"
            >
              <option value="utc">UTC</option>
              <option value="local">Local</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-col items-center">
              <label className={labelClass}>Year</label>
              <input
                type="number"
                value={dateParts.year}
                onChange={(e) => handleDatePartChange('year', e.target.value)}
                placeholder="YYYY"
                className={smallInputClass}
              />
            </div>
            <div className="flex flex-col items-center">
              <label className={labelClass}>Month</label>
              <input
                type="number"
                min="1"
                max="12"
                value={dateParts.month}
                onChange={(e) => handleDatePartChange('month', e.target.value)}
                placeholder="MM"
                className={smallInputClass}
              />
            </div>
            <div className="flex flex-col items-center">
              <label className={labelClass}>Day</label>
              <input
                type="number"
                min="1"
                max="31"
                value={dateParts.day}
                onChange={(e) => handleDatePartChange('day', e.target.value)}
                placeholder="DD"
                className={smallInputClass}
              />
            </div>
            <div className="flex flex-col items-center">
              <label className={labelClass}>Hour</label>
              <input
                type="number"
                min="0"
                max="23"
                value={dateParts.hour}
                onChange={(e) => handleDatePartChange('hour', e.target.value)}
                placeholder="HH"
                className={smallInputClass}
              />
            </div>
            <div className="flex flex-col items-center">
              <label className={labelClass}>Min</label>
              <input
                type="number"
                min="0"
                max="59"
                value={dateParts.minute}
                onChange={(e) => handleDatePartChange('minute', e.target.value)}
                placeholder="mm"
                className={smallInputClass}
              />
            </div>
            <div className="flex flex-col items-center">
              <label className={labelClass}>Sec</label>
              <input
                type="number"
                min="0"
                max="59"
                value={dateParts.second}
                onChange={(e) => handleDatePartChange('second', e.target.value)}
                placeholder="ss"
                className={smallInputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {parsedDate && (
        <div className="mb-6 p-4 rounded-lg border border-border bg-accent/20">
          <h2 className="text-sm font-semibold mb-3">Converted Result</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground w-28 shrink-0">UTC:</span>
              <span className="font-mono break-all">{formatDate(parsedDate, 'utc')}</span>
              <CopyButton text={formatDate(parsedDate, 'utc')} label="Copy" className="ml-auto shrink-0 px-2 py-0.5 text-xs" />
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground w-28 shrink-0">Local:</span>
              <span className="font-mono break-all">{formatDate(parsedDate, 'local')}</span>
              <CopyButton text={formatDate(parsedDate, 'local')} label="Copy" className="ml-auto shrink-0 px-2 py-0.5 text-xs" />
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground w-28 shrink-0">ISO 8601:</span>
              <span className="font-mono break-all">{formatIso(parsedDate)}</span>
              <CopyButton text={formatIso(parsedDate)} label="Copy" className="ml-auto shrink-0 px-2 py-0.5 text-xs" />
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground w-28 shrink-0">Timestamp (s):</span>
              <span className="font-mono">{Math.floor(parsedDate.getTime() / 1000)}</span>
              <CopyButton text={String(Math.floor(parsedDate.getTime() / 1000))} label="Copy" className="ml-auto shrink-0 px-2 py-0.5 text-xs" />
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground w-28 shrink-0">Timestamp (ms):</span>
              <span className="font-mono">{parsedDate.getTime()}</span>
              <CopyButton text={String(parsedDate.getTime())} label="Copy" className="ml-auto shrink-0 px-2 py-0.5 text-xs" />
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground w-28 shrink-0">Relative:</span>
              <span className="font-mono bg-safe/10 text-safe px-2 py-0.5 rounded">
                {getRelativeTime(parsedDate)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Common timestamps */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Common Timestamps</h2>
        <div className="grid sm:grid-cols-3 gap-2">
          {COMMON_TIMESTAMPS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleQuickTimestamp(item.timestamp)}
              className="p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
            >
              <div className="text-sm font-medium">{item.label}</div>
              <div className="text-xs text-muted-foreground font-mono">{item.timestamp}</div>
              <div className="text-xs text-muted-foreground">{item.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
