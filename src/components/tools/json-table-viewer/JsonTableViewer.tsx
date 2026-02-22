import { useState, useMemo } from 'react';
import CopyButton from '@/components/shared/CopyButton';

const SAMPLE_JSON = `[
  { "id": 1, "name": "Alice Johnson", "email": "alice@example.com", "role": "Admin", "active": true },
  { "id": 2, "name": "Bob Smith", "email": "bob@example.com", "role": "Editor", "active": true },
  { "id": 3, "name": "Charlie Brown", "email": "charlie@example.com", "role": "Viewer", "active": false },
  { "id": 4, "name": "Diana Prince", "email": "diana@example.com", "role": "Admin", "active": true },
  { "id": 5, "name": "Eve Wilson", "email": "eve@example.com", "role": "Editor", "active": false }
]`;

const PAGE_SIZES = [10, 25, 50, 100];

type SortDir = 'asc' | 'desc' | null;

function flattenValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function exportToCsv(columns: string[], rows: Record<string, unknown>[]) {
  const escape = (s: string) => {
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const header = columns.map(escape).join(',');
  const body = rows.map((row) => columns.map((col) => escape(flattenValue(row[col]))).join(',')).join('\n');
  const csv = header + '\n' + body;

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function JsonTableViewer() {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [filter, setFilter] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, columns, error } = useMemo(() => {
    try {
      const parsed = JSON.parse(input);
      if (!Array.isArray(parsed)) return { data: [], columns: [], error: 'JSON must be an array' };
      if (parsed.length === 0) return { data: [], columns: [], error: null };

      const colSet = new Set<string>();
      for (const item of parsed) {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach((k) => colSet.add(k));
        }
      }
      return { data: parsed, columns: [...colSet], error: null };
    } catch (e) {
      return { data: [], columns: [], error: (e as Error).message };
    }
  }, [input]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return data;
    const q = filter.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => flattenValue(row[col]).toLowerCase().includes(q))
    );
  }, [data, filter, columns]);

  const sorted = useMemo(() => {
    if (!sortCol || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const va = flattenValue(a[sortCol]);
      const vb = flattenValue(b[sortCol]);
      const numA = Number(va);
      const numB = Number(vb);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDir === 'asc' ? numA - numB : numB - numA;
      }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const onHeaderClick = (col: string) => {
    if (sortCol === col) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else if (sortDir === 'desc') {
        setSortCol(null);
        setSortDir(null);
      }
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">JSON Table Viewer</h1>
        <p className="mt-2 text-muted-foreground">
          Visualize JSON arrays as sortable, filterable tables. All processing happens in your
          browser.
        </p>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            JSON Input
          </h2>
          <button
            onClick={() => setInput(SAMPLE_JSON)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Load Sample
          </button>
        </div>
        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setPage(0); }}
          placeholder='Paste a JSON array, e.g. [{"name": "Alice"}, ...]'
          className="w-full h-40 rounded-lg border border-border bg-transparent px-4 py-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          spellCheck={false}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {columns.length > 0 && !error && (
        <>
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(0); }}
              placeholder="Filter rows..."
              className="flex-1 min-w-[200px] rounded-md border border-border bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                className="rounded-md border border-border bg-transparent px-2 py-1 text-sm"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => exportToCsv(columns, sorted)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
            >
              Export CSV
            </button>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  {columns.map((col) => (
                    <th
                      key={col}
                      onClick={() => onHeaderClick(col)}
                      className="px-4 py-2.5 text-left font-medium cursor-pointer hover:bg-accent transition-colors select-none whitespace-nowrap"
                    >
                      <span className="inline-flex items-center gap-1">
                        {col}
                        {sortCol === col && sortDir === 'asc' && ' ↑'}
                        {sortCol === col && sortDir === 'desc' && ' ↓'}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col} className="px-4 py-2 font-mono whitespace-nowrap max-w-xs truncate">
                        {flattenValue(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of{' '}
              {sorted.length} row{sorted.length !== 1 ? 's' : ''}
              {filter && ` (filtered from ${data.length})`}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 rounded-md border border-border hover:bg-accent transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 rounded-md border border-border hover:bg-accent transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
