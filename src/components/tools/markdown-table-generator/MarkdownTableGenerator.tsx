import { useState, useMemo, useCallback } from 'react';
import CopyButton from '@/components/shared/CopyButton';

type Alignment = 'left' | 'center' | 'right';

interface TableState {
  rows: number;
  cols: number;
  cells: string[][];
  alignments: Alignment[];
}

function createInitialState(rows: number, cols: number): TableState {
  return {
    rows,
    cols,
    cells: Array.from({ length: rows }, () => Array.from({ length: cols }, () => '')),
    alignments: Array.from({ length: cols }, () => 'left' as Alignment),
  };
}

function generateMarkdown(state: TableState): string {
  const { cells, alignments, rows, cols } = state;
  if (rows === 0 || cols === 0) return '';

  // Calculate column widths
  const widths = Array.from({ length: cols }, (_, c) => {
    let max = 3; // minimum width
    for (let r = 0; r < rows; r++) {
      max = Math.max(max, (cells[r]?.[c] || '').length);
    }
    return max;
  });

  const pad = (text: string, width: number, align: Alignment) => {
    const diff = width - text.length;
    if (diff <= 0) return text;
    if (align === 'center') {
      const left = Math.floor(diff / 2);
      return ' '.repeat(left) + text + ' '.repeat(diff - left);
    }
    if (align === 'right') return ' '.repeat(diff) + text;
    return text + ' '.repeat(diff);
  };

  const lines: string[] = [];

  // Header row (first row)
  const headerCells = Array.from({ length: cols }, (_, c) =>
    ` ${pad(cells[0]?.[c] || '', widths[c], alignments[c])} `
  );
  lines.push(`|${headerCells.join('|')}|`);

  // Separator row
  const sepCells = Array.from({ length: cols }, (_, c) => {
    const w = widths[c];
    const a = alignments[c];
    if (a === 'center') return `:${'-'.repeat(w)}:`;
    if (a === 'right') return `${'-'.repeat(w + 1)}:`;
    return `:${'-'.repeat(w + 1)}`;
  });
  lines.push(`|${sepCells.join('|')}|`);

  // Body rows
  for (let r = 1; r < rows; r++) {
    const rowCells = Array.from({ length: cols }, (_, c) =>
      ` ${pad(cells[r]?.[c] || '', widths[c], alignments[c])} `
    );
    lines.push(`|${rowCells.join('|')}|`);
  }

  return lines.join('\n');
}

export default function MarkdownTableGenerator() {
  const [table, setTable] = useState<TableState>(() => createInitialState(4, 3));

  const markdown = useMemo(() => generateMarkdown(table), [table]);

  const updateCell = useCallback((row: number, col: number, value: string) => {
    setTable((prev) => {
      const newCells = prev.cells.map((r) => [...r]);
      newCells[row][col] = value;
      return { ...prev, cells: newCells };
    });
  }, []);

  const toggleAlignment = useCallback((col: number) => {
    setTable((prev) => {
      const newAlignments = [...prev.alignments];
      const cycle: Alignment[] = ['left', 'center', 'right'];
      const idx = cycle.indexOf(newAlignments[col]);
      newAlignments[col] = cycle[(idx + 1) % 3];
      return { ...prev, alignments: newAlignments };
    });
  }, []);

  const addRow = useCallback(() => {
    setTable((prev) => ({
      ...prev,
      rows: prev.rows + 1,
      cells: [...prev.cells, Array.from({ length: prev.cols }, () => '')],
    }));
  }, []);

  const removeRow = useCallback(() => {
    setTable((prev) => {
      if (prev.rows <= 2) return prev; // Need at least header + 1 row
      return { ...prev, rows: prev.rows - 1, cells: prev.cells.slice(0, -1) };
    });
  }, []);

  const addCol = useCallback(() => {
    setTable((prev) => ({
      ...prev,
      cols: prev.cols + 1,
      cells: prev.cells.map((r) => [...r, '']),
      alignments: [...prev.alignments, 'left' as Alignment],
    }));
  }, []);

  const removeCol = useCallback(() => {
    setTable((prev) => {
      if (prev.cols <= 1) return prev;
      return {
        ...prev,
        cols: prev.cols - 1,
        cells: prev.cells.map((r) => r.slice(0, -1)),
        alignments: prev.alignments.slice(0, -1),
      };
    });
  }, []);

  const handleSample = useCallback(() => {
    setTable({
      rows: 4,
      cols: 3,
      cells: [
        ['Feature', 'Status', 'Notes'],
        ['Dark mode', 'Done', 'Supports system preference'],
        ['Export', 'In Progress', 'PDF and HTML'],
        ['Search', 'Planned', 'Full-text search'],
      ],
      alignments: ['left', 'center', 'left'],
    });
  }, []);

  const handleClear = useCallback(() => {
    setTable(createInitialState(4, 3));
  }, []);

  const alignmentIcon = (a: Alignment) => {
    if (a === 'center') return '↔';
    if (a === 'right') return '→';
    return '←';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Markdown Table Generator</h1>
        <p className="text-muted-foreground">
          Create Markdown tables visually. Edit cells, adjust column alignment, and copy the generated Markdown.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={handleSample}
          className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
        >
          Sample
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
        >
          Clear
        </button>

        <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

        <button onClick={addRow} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors">+ Row</button>
        <button onClick={removeRow} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors" disabled={table.rows <= 2}>- Row</button>
        <button onClick={addCol} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors">+ Column</button>
        <button onClick={removeCol} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors" disabled={table.cols <= 1}>- Column</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Table Editor */}
        <div className="flex flex-col">
          <div className="text-sm font-medium text-muted-foreground mb-2">Table Editor</div>
          <div className="border border-border rounded-lg overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {Array.from({ length: table.cols }, (_, c) => (
                    <th key={c} className="border border-border p-0">
                      <div className="flex flex-col">
                        <button
                          onClick={() => toggleAlignment(c)}
                          className="px-2 py-1 text-xs text-muted-foreground hover:bg-accent transition-colors border-b border-border"
                          title={`Alignment: ${table.alignments[c]}`}
                        >
                          {alignmentIcon(table.alignments[c])} {table.alignments[c]}
                        </button>
                        <input
                          type="text"
                          value={table.cells[0]?.[c] || ''}
                          onChange={(e) => updateCell(0, c, e.target.value)}
                          className="px-2 py-1.5 bg-accent/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 w-full min-w-[80px]"
                          placeholder={`Header ${c + 1}`}
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: table.rows - 1 }, (_, r) => (
                  <tr key={r + 1}>
                    {Array.from({ length: table.cols }, (_, c) => (
                      <td key={c} className="border border-border p-0">
                        <input
                          type="text"
                          value={table.cells[r + 1]?.[c] || ''}
                          onChange={(e) => updateCell(r + 1, c, e.target.value)}
                          className="px-2 py-1.5 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-full min-w-[80px]"
                          placeholder={`Row ${r + 1}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generated Markdown */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Generated Markdown</span>
            <CopyButton text={markdown} label="Copy" />
          </div>
          <pre className="flex-1 p-4 rounded-lg border border-border bg-muted/30 overflow-auto text-sm font-mono whitespace-pre min-h-[300px]">
            {markdown || 'Fill in the table to generate Markdown...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
