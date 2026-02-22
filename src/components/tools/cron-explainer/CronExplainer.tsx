import { useState, useMemo } from 'react';
import CopyButton from '@/components/shared/CopyButton';
import { FIELD_CONFIGS, generateDescription, getNextRuns, getFieldDescription } from '@/lib/cron-utils';

const PRESETS = [
  { label: 'Every minute', expression: '* * * * *' },
  { label: 'Every 5 minutes', expression: '*/5 * * * *' },
  { label: 'Hourly', expression: '0 * * * *' },
  { label: 'Daily at midnight', expression: '0 0 * * *' },
  { label: 'Weekdays at 9 AM', expression: '0 9 * * 1-5' },
  { label: 'Every Monday at 9 AM', expression: '0 9 * * 1' },
  { label: 'Monthly on the 1st', expression: '0 0 1 * *' },
  { label: 'Every Sunday at 3 AM', expression: '0 3 * * 0' },
  { label: 'Every 15 minutes', expression: '*/15 * * * *' },
  { label: 'Twice daily (9 AM, 5 PM)', expression: '0 9,17 * * *' },
];

export default function CronExplainer() {
  const [expression, setExpression] = useState('0 9 * * 1-5');

  const parts = useMemo(() => expression.trim().split(/\s+/), [expression]);
  const isValid = parts.length === 5;
  const description = useMemo(() => generateDescription(expression), [expression]);
  const nextRuns = useMemo(() => getNextRuns(expression, 10), [expression]);

  const fieldBreakdown = useMemo(() => {
    if (!isValid) return [];
    return parts.map((token, i) => ({
      label: FIELD_CONFIGS[i].label,
      token,
      description: getFieldDescription(i, token),
    }));
  }, [parts, isValid]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cron Explainer</h1>
        <p className="mt-2 text-muted-foreground">
          Paste a cron expression to get a human-readable explanation, field-by-field breakdown, and
          next scheduled run times.
        </p>
      </div>

      {/* Input */}
      <div className="rounded-lg border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="* * * * *"
            className="flex-1 font-mono text-2xl sm:text-3xl text-center rounded-md border border-border bg-transparent px-4 py-3"
            spellCheck={false}
          />
          <CopyButton text={expression} label="Copy" />
        </div>
        <div className="flex gap-2 text-xs font-mono text-muted-foreground justify-center">
          <span>minute</span>
          <span>hour</span>
          <span>day(month)</span>
          <span>month</span>
          <span>day(week)</span>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-lg border border-border p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Description
        </h2>
        <p className={`text-lg font-medium ${isValid ? '' : 'text-destructive'}`}>
          {description}
        </p>
      </div>

      {/* Presets */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Common Expressions
        </h2>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.expression}
              onClick={() => setExpression(preset.expression)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                expression === preset.expression
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'border-border hover:bg-accent'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Field Breakdown */}
      {isValid && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Field-by-Field Breakdown
          </h2>
          <div className="grid gap-2">
            {fieldBreakdown.map((field) => (
              <div
                key={field.label}
                className="flex items-center gap-4 rounded-md px-4 py-3 bg-accent/30"
              >
                <span className="text-sm font-medium w-28 shrink-0">{field.label}</span>
                <code className="font-mono text-sm bg-background px-2 py-0.5 rounded border border-border min-w-[60px] text-center">
                  {field.token}
                </code>
                <span className="text-sm text-muted-foreground">{field.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Run Times */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Next 10 Run Times
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
            {isValid
              ? 'No upcoming runs found within the next year. Check your expression.'
              : 'Enter a valid 5-field cron expression to see run times.'}
          </p>
        )}
      </div>
    </div>
  );
}
