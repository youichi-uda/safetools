import { useState, useCallback, useMemo } from 'react';
import * as Diff from 'diff';
import { cn } from '@/lib/utils';
import CopyButton from '@/components/shared/CopyButton';

type DiffMode = 'chars' | 'words' | 'lines';
type ViewMode = 'split' | 'unified';

export default function DiffChecker() {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [diffMode, setDiffMode] = useState<DiffMode>('words');
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  const diffs = useMemo(() => {
    if (!left && !right) return [];
    switch (diffMode) {
      case 'chars': return Diff.diffChars(left, right);
      case 'words': return Diff.diffWords(left, right);
      case 'lines': return Diff.diffLines(left, right);
    }
  }, [left, right, diffMode]);

  const stats = useMemo(() => {
    const added = diffs.filter(d => d.added).reduce((sum, d) => sum + (d.count || 0), 0);
    const removed = diffs.filter(d => d.removed).reduce((sum, d) => sum + (d.count || 0), 0);
    const unchanged = diffs.filter(d => !d.added && !d.removed).reduce((sum, d) => sum + (d.count || 0), 0);
    return { added, removed, unchanged };
  }, [diffs]);

  const clear = useCallback(() => {
    setLeft('');
    setRight('');
  }, []);

  const swap = useCallback(() => {
    setLeft(right);
    setRight(left);
  }, [left, right]);

  const loadSample = useCallback(() => {
    setLeft(`function greet(name) {
  console.log("Hello, " + name);
  return true;
}

const result = greet("World");`);
    setRight(`function greet(name, greeting = "Hello") {
  console.log(greeting + ", " + name + "!");
  return greeting;
}

const message = greet("World", "Hi");`);
  }, []);

  const diffText = useMemo(() => {
    return diffs.map(d => {
      if (d.added) return `+ ${d.value}`;
      if (d.removed) return `- ${d.value}`;
      return `  ${d.value}`;
    }).join('');
  }, [diffs]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Diff Checker</h1>
      <p className="text-muted-foreground text-sm mb-4">
        Compare two texts and see differences. All processing happens in your browser.
      </p>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={diffMode}
          onChange={(e) => setDiffMode(e.target.value as DiffMode)}
          className="px-2 py-1.5 text-sm rounded-md border border-border bg-background"
        >
          <option value="chars">Characters</option>
          <option value="words">Words</option>
          <option value="lines">Lines</option>
        </select>

        <div className="flex rounded-md border border-border overflow-hidden">
          <button
            onClick={() => setViewMode('split')}
            className={cn('px-3 py-1.5 text-sm transition-colors', viewMode === 'split' ? 'bg-accent font-medium' : 'hover:bg-accent/50')}
          >
            Split
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={cn('px-3 py-1.5 text-sm transition-colors border-l border-border', viewMode === 'unified' ? 'bg-accent font-medium' : 'hover:bg-accent/50')}
          >
            Unified
          </button>
        </div>

        <div className="h-5 w-px bg-border mx-1" />

        <button onClick={swap} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors">
          Swap
        </button>
        <button onClick={clear} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors text-muted-foreground">
          Clear
        </button>
        <button onClick={loadSample} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors text-muted-foreground">
          Sample
        </button>
        {diffs.length > 0 && <CopyButton text={diffText} label="Copy Diff" />}
      </div>

      {/* Input panels */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Original</label>
          <textarea
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            placeholder="Paste original text here..."
            className="w-full h-48 p-3 rounded-lg border border-border bg-background font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Modified</label>
          <textarea
            value={right}
            onChange={(e) => setRight(e.target.value)}
            placeholder="Paste modified text here..."
            className="w-full h-48 p-3 rounded-lg border border-border bg-background font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Stats */}
      {diffs.length > 0 && (
        <div className="flex items-center gap-4 mb-4 text-sm">
          <span className="text-safe">+{stats.added} added</span>
          <span className="text-destructive">-{stats.removed} removed</span>
          <span className="text-muted-foreground">{stats.unchanged} unchanged</span>
        </div>
      )}

      {/* Diff output */}
      {diffs.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="p-4 overflow-x-auto">
            <pre className="font-mono text-sm whitespace-pre-wrap">
              {viewMode === 'unified' ? (
                diffs.map((part, i) => (
                  <span
                    key={i}
                    className={cn(
                      part.added && 'bg-safe/15 text-safe-foreground',
                      part.removed && 'bg-destructive/15 text-destructive line-through',
                    )}
                  >{part.value}</span>
                ))
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {diffs.filter(d => !d.added).map((part, i) => (
                      <span
                        key={i}
                        className={cn(
                          part.removed && 'bg-destructive/15 text-destructive',
                        )}
                      >{part.value}</span>
                    ))}
                  </div>
                  <div className="border-l border-border pl-4">
                    {diffs.filter(d => !d.removed).map((part, i) => (
                      <span
                        key={i}
                        className={cn(
                          part.added && 'bg-safe/15 text-safe-foreground',
                        )}
                      >{part.value}</span>
                    ))}
                  </div>
                </div>
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
