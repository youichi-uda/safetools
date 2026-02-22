import { useState } from 'react';
import { generateDescription, cronToOnCalendar } from '@/lib/cron-utils';

const PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Weekdays 9 AM', value: '0 9 * * 1-5' },
  { label: '1st & 15th at 4:30 AM', value: '30 4 1,15 * *' },
  { label: 'Weekly Sunday midnight', value: '0 0 * * 0' },
  { label: 'Monthly 1st midnight', value: '0 0 1 * *' },
];

function generateTimerUnit(
  onCalendar: string,
  timerName: string,
  persistent: boolean,
): string {
  return `[Unit]
Description=Timer for ${timerName}

[Timer]
OnCalendar=${onCalendar}
${persistent ? 'Persistent=true\n' : ''}
[Install]
WantedBy=timers.target`;
}

function generateServiceUnit(timerName: string): string {
  return `[Unit]
Description=Service for ${timerName}

[Service]
Type=oneshot
ExecStart=/path/to/your/command`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function CronToSystemd() {
  const [cronExpr, setCronExpr] = useState('0 9 * * 1-5');
  const [timerName, setTimerName] = useState('my-task');
  const [persistent, setPersistent] = useState(true);

  const description = generateDescription(cronExpr);
  const onCalendar = cronToOnCalendar(cronExpr);
  const isValid = onCalendar !== null;

  const timerUnit = isValid ? generateTimerUnit(onCalendar, timerName, persistent) : '';
  const serviceUnit = isValid ? generateServiceUnit(timerName) : '';

  const usageCommands = isValid
    ? `# Copy the files
sudo cp ${timerName}.timer /etc/systemd/system/
sudo cp ${timerName}.service /etc/systemd/system/

# Reload systemd and enable the timer
sudo systemctl daemon-reload
sudo systemctl enable --now ${timerName}.timer

# Check status
systemctl status ${timerName}.timer
systemctl list-timers --all | grep ${timerName}`
    : '';

  return (
    <div className="space-y-6">
      {/* Cron Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Cron Expression</label>
        <input
          type="text"
          value={cronExpr}
          onChange={(e) => setCronExpr(e.target.value)}
          placeholder="* * * * *"
          className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          spellCheck={false}
        />
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setCronExpr(p.value)}
              className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      {isValid && (
        <div className="p-3 rounded-md bg-muted text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Schedule:</span> {description}
        </div>
      )}

      {!isValid && cronExpr.trim() && (
        <div className="p-3 rounded-md bg-destructive/10 text-sm text-destructive">
          Invalid cron expression. Use 5 fields: minute hour day month weekday
        </div>
      )}

      {isValid && (
        <>
          {/* OnCalendar Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">OnCalendar Value</label>
              <CopyButton text={onCalendar} />
            </div>
            <div className="px-3 py-2 rounded-md border border-border bg-muted font-mono text-sm text-foreground">
              {onCalendar}
            </div>
          </div>

          {/* Timer Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Timer / Service Name</label>
              <input
                type="text"
                value={timerName}
                onChange={(e) => setTimerName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') || 'my-task')}
                className="w-full px-3 py-2 rounded-md border border-border bg-input text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                spellCheck={false}
              />
            </div>
            <div className="flex items-end space-x-2 pb-1">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={persistent}
                  onChange={(e) => setPersistent(e.target.checked)}
                  className="rounded border-border"
                />
                <span>Persistent</span>
              </label>
              <span className="text-xs text-muted-foreground">(catch up missed runs)</span>
            </div>
          </div>

          {/* Timer Unit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">{timerName}.timer</label>
              <CopyButton text={timerUnit} />
            </div>
            <pre className="p-3 rounded-md border border-border bg-muted font-mono text-xs text-foreground overflow-x-auto whitespace-pre">
              {timerUnit}
            </pre>
          </div>

          {/* Service Unit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">{timerName}.service</label>
              <CopyButton text={serviceUnit} />
            </div>
            <pre className="p-3 rounded-md border border-border bg-muted font-mono text-xs text-foreground overflow-x-auto whitespace-pre">
              {serviceUnit}
            </pre>
          </div>

          {/* Usage Commands */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Usage Commands</label>
              <CopyButton text={usageCommands} />
            </div>
            <pre className="p-3 rounded-md border border-border bg-muted font-mono text-xs text-foreground overflow-x-auto whitespace-pre">
              {usageCommands}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
