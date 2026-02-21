import { useState, useCallback } from 'react';
import CodeEditor from '@/components/shared/CodeEditor';
import CopyButton from '@/components/shared/CopyButton';

interface EnvEntry {
  key: string;
  value: string;
  comment?: string;
}

function parseEnv(text: string): EnvEntry[] {
  const entries: EnvEntry[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Handle quoted values
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries.push({ key, value });
  }
  return entries;
}

function isSensitiveKey(key: string): boolean {
  const upper = key.toUpperCase();
  return ['PASSWORD', 'SECRET', 'KEY', 'TOKEN'].some((s) => upper.includes(s));
}

function entriesToEnvString(entries: EnvEntry[]): string {
  return entries.map((e) => `${e.key}=${e.value}`).join('\n');
}

function findDuplicateKeys(entries: EnvEntry[]): Set<string> {
  const seen = new Map<string, number>();
  const duplicates = new Set<string>();
  for (const entry of entries) {
    const count = (seen.get(entry.key) || 0) + 1;
    seen.set(entry.key, count);
    if (count > 1) duplicates.add(entry.key);
  }
  return duplicates;
}

const SAMPLE_ENV = `# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_PASSWORD=s3cretP@ssw0rd!

# API Keys
OPENAI_API_KEY=sk-example-abc123def456ghi789jkl
STRIPE_SECRET_KEY=sk_test_example_4eC39HqLyjWDarjtT1zdp
AWS_ACCESS_KEY_ID=AKIAEXAMPLE12345EXAM
AWS_SECRET_ACCESS_KEY=ExAmPlEKeY/K7MDENG/bPxRfiCYEXAMPLEKEY

# App
NODE_ENV=production
PORT=3000
DEBUG=false`;

// SVG Icons as inline components
function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function WarningBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      Sensitive
    </span>
  );
}

export default function EnvEditor() {
  const [input, setInput] = useState('');
  const [entries, setEntries] = useState<EnvEntry[]>([]);
  const [parsed, setParsed] = useState(false);
  const [revealedRows, setRevealedRows] = useState<Set<number>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; field: 'key' | 'value' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleParse = useCallback(() => {
    const result = parseEnv(input);
    setEntries(result);
    setParsed(true);
    setRevealedRows(new Set());
    setShowAll(false);
    setEditingCell(null);
  }, [input]);

  const handleSample = useCallback(() => {
    setInput(SAMPLE_ENV);
    setParsed(false);
    setEntries([]);
  }, []);

  const toggleReveal = useCallback(
    (index: number) => {
      setRevealedRows((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return next;
      });
    },
    []
  );

  const handleShowAll = useCallback(() => {
    if (showAll) {
      setRevealedRows(new Set());
      setShowAll(false);
    } else {
      setRevealedRows(new Set(entries.map((_, i) => i)));
      setShowAll(true);
    }
  }, [showAll, entries]);

  const startEdit = useCallback(
    (row: number, field: 'key' | 'value') => {
      setEditingCell({ row, field });
      setEditValue(entries[row][field]);
    },
    [entries]
  );

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    setEntries((prev) => {
      const next = [...prev];
      next[editingCell.row] = {
        ...next[editingCell.row],
        [editingCell.field]: editValue,
      };
      return next;
    });
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const addRow = useCallback(() => {
    setEntries((prev) => [...prev, { key: 'NEW_VAR', value: '' }]);
  }, []);

  const deleteRow = useCallback((index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setRevealedRows((prev) => {
      const next = new Set<number>();
      for (const r of prev) {
        if (r < index) next.add(r);
        else if (r > index) next.add(r - 1);
      }
      return next;
    });
  }, []);

  const handleExport = useCallback(() => {
    const content = entriesToEnvString(entries);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  const duplicateKeys = parsed ? findDuplicateKeys(entries) : new Set<string>();
  const lineCount = input.split('\n').length;
  const envString = entriesToEnvString(entries);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">.env File Viewer & Editor</h1>
        <p className="mt-2 text-muted-foreground">
          Parse, view, and edit environment variable files with built-in secret masking.
          All processing happens entirely in your browser — your data never leaves your device.
        </p>
      </div>

      {/* Input Section */}
      <div className="rounded-lg border border-border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            .env Input
          </h2>
          <span className="text-xs text-muted-foreground">
            {lineCount} line{lineCount !== 1 ? 's' : ''}
          </span>
        </div>

        <CodeEditor
          value={input}
          onChange={(val) => setInput(val)}
          placeholder="Paste your .env file content here..."
          minHeight="200px"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handleParse}
            disabled={!input.trim()}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Parse
          </button>
          <button
            onClick={handleSample}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
          >
            Load Sample
          </button>
          {input.trim() && <CopyButton text={input} label="Copy Input" />}
        </div>
      </div>

      {/* Parsed Table */}
      {parsed && entries.length > 0 && (
        <div className="rounded-lg border border-border p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Parsed Variables ({entries.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShowAll}
                className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
              >
                {showAll ? 'Hide All' : 'Show All'}
              </button>
              <button
                onClick={addRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
              >
                <PlusIcon />
                Add Variable
              </button>
              <CopyButton text={envString} label="Copy .env" />
              <button
                onClick={handleExport}
                className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Export .env
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">#</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Key</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Value</th>
                  <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const isRevealed = revealedRows.has(index);
                  const sensitive = isSensitiveKey(entry.key);
                  const isDuplicate = duplicateKeys.has(entry.key);
                  const isEmpty = !entry.value;
                  const isEditingKey =
                    editingCell?.row === index && editingCell.field === 'key';
                  const isEditingValue =
                    editingCell?.row === index && editingCell.field === 'value';

                  return (
                    <tr
                      key={index}
                      className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                    >
                      {/* Row number */}
                      <td className="py-2 px-3 text-muted-foreground font-mono text-xs">
                        {index + 1}
                      </td>

                      {/* Key */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          {isEditingKey ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEdit();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              autoFocus
                              className="w-full rounded border border-border bg-transparent px-2 py-1 font-mono text-sm"
                            />
                          ) : (
                            <button
                              onClick={() => startEdit(index, 'key')}
                              className="font-mono text-sm text-left hover:underline cursor-pointer"
                              title="Click to edit"
                            >
                              {entry.key}
                            </button>
                          )}
                          {sensitive && <WarningBadge />}
                          {isDuplicate && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-red-500/15 text-destructive">
                              Duplicate
                            </span>
                          )}
                          {isEmpty && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">
                              Empty
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Value */}
                      <td className="py-2 px-3">
                        {isEditingValue ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                            className="w-full rounded border border-border bg-transparent px-2 py-1 font-mono text-sm"
                          />
                        ) : (
                          <button
                            onClick={() => startEdit(index, 'value')}
                            className="font-mono text-sm text-left hover:underline cursor-pointer break-all"
                            title="Click to edit"
                          >
                            {isRevealed ? entry.value || '\u00A0' : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleReveal(index)}
                            className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                            title={isRevealed ? 'Hide value' : 'Reveal value'}
                          >
                            {isRevealed ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                          <button
                            onClick={() => deleteRow(index)}
                            className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
                            title="Delete variable"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state after parsing */}
      {parsed && entries.length === 0 && (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">
            No valid environment variables found. Make sure each line follows the{' '}
            <code className="px-1.5 py-0.5 rounded bg-accent font-mono text-sm">KEY=value</code>{' '}
            format.
          </p>
        </div>
      )}
    </div>
  );
}
