import { useState, useCallback, useMemo } from 'react';
import CopyButton from '@/components/shared/CopyButton';
import { FIELD_CONFIGS, generateDescription, getNextRuns } from '@/lib/cron-utils';
import type { FieldConfig } from '@/lib/cron-utils';

type FieldMode = 'every' | 'specific' | 'range' | 'interval';

interface FieldState {
  mode: FieldMode;
  specific: number[];
  rangeStart: number;
  rangeEnd: number;
  interval: number;
}

const PRESETS: { label: string; expression: string }[] = [
  { label: 'Every minute', expression: '* * * * *' },
  { label: 'Every 5 minutes', expression: '*/5 * * * *' },
  { label: 'Every hour', expression: '0 * * * *' },
  { label: 'Daily at midnight', expression: '0 0 * * *' },
  { label: 'Every Monday at 9 AM', expression: '0 9 * * 1' },
  { label: 'Monthly on the 1st', expression: '0 0 1 * *' },
];

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

  if (token.startsWith('*/')) {
    const n = parseInt(token.slice(2), 10);
    if (!isNaN(n) && n > 0) {
      field.mode = 'interval';
      field.interval = n;
      return field;
    }
  }

  if (token.includes('-') && !token.includes(',')) {
    const [a, b] = token.split('-').map(Number);
    if (!isNaN(a) && !isNaN(b)) {
      field.mode = 'range';
      field.rangeStart = a;
      field.rangeEnd = b;
      return field;
    }
  }

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
