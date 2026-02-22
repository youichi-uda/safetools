import { useState, useMemo } from 'react';
import CopyButton from '@/components/shared/CopyButton';
import { PATTERN_CATEGORIES } from './patterns';

type MaskStyle = 'asterisk' | 'x' | 'redacted';

const MASK_LABELS: Record<MaskStyle, string> = {
  asterisk: '****',
  x: 'XXXX',
  redacted: '[REDACTED]',
};

function getMask(match: string, style: MaskStyle): string {
  switch (style) {
    case 'asterisk':
      return '*'.repeat(match.length);
    case 'x':
      return 'X'.repeat(match.length);
    case 'redacted':
      return '[REDACTED]';
  }
}

const SAMPLE_TEXT = `Contact: john.doe@example.com or jane@company.org
Phone: (555) 123-4567 or +1-800-555-0199
SSN: 123-45-6789
Card: 4111 1111 1111 1111
Server: 192.168.1.100
AWS Key: AKIAIOSFODNN7EXAMPLE
JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U`;

export default function SensitiveDataRedactor() {
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [enabledCategories, setEnabledCategories] = useState<Set<string>>(
    new Set(PATTERN_CATEGORIES.map((c) => c.id))
  );
  const [maskStyle, setMaskStyle] = useState<MaskStyle>('asterisk');

  const toggleCategory = (id: string) => {
    setEnabledCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { redacted, counts } = useMemo(() => {
    let result = input;
    const counts: Record<string, number> = {};

    for (const cat of PATTERN_CATEGORIES) {
      counts[cat.id] = 0;
      if (!enabledCategories.has(cat.id)) continue;
      for (const p of cat.patterns) {
        const regex = new RegExp(p.regex.source, p.regex.flags);
        const matches = input.match(regex);
        if (matches) {
          counts[cat.id] += matches.length;
          result = result.replace(regex, (m) => getMask(m, maskStyle));
        }
      }
    }

    return { redacted: result, counts };
  }, [input, enabledCategories, maskStyle]);

  const totalDetections = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sensitive Data Redactor</h1>
        <p className="mt-2 text-muted-foreground">
          Detect and redact emails, phone numbers, SSNs, credit cards, API keys, and other sensitive
          data from text. All processing happens in your browser.
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pattern Categories */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Pattern Categories
          </h2>
          <div className="space-y-2">
            {PATTERN_CATEGORIES.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabledCategories.has(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="rounded border-border"
                />
                <span className="flex-1">{cat.label}</span>
                {counts[cat.id] > 0 && (
                  <span className="text-xs font-mono bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                    {counts[cat.id]}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Mask Style */}
        <div className="rounded-lg border border-border p-4 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Mask Style
            </h2>
            <span className="text-sm text-muted-foreground">
              {totalDetections} detection{totalDetections !== 1 ? 's' : ''} found
            </span>
          </div>
          <div className="flex gap-2">
            {(Object.keys(MASK_LABELS) as MaskStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => setMaskStyle(style)}
                className={`px-4 py-2 text-sm rounded-md border transition-colors font-mono ${
                  maskStyle === style
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {MASK_LABELS[style]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input / Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Input
            </h2>
            <button
              onClick={() => setInput('')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste text containing sensitive data..."
            className="w-full h-64 rounded-lg border border-border bg-transparent px-4 py-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Redacted Output
            </h2>
            <CopyButton text={redacted} label="Copy" />
          </div>
          <div className="w-full h-64 rounded-lg border border-border bg-accent/20 px-4 py-3 font-mono text-sm overflow-auto whitespace-pre-wrap">
            {redacted}
          </div>
        </div>
      </div>
    </div>
  );
}
