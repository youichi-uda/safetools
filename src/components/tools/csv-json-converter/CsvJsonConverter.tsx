import { useState, useCallback } from 'react';
import CodeEditor from '@/components/shared/CodeEditor';
import CopyButton from '@/components/shared/CopyButton';
import { json } from '@codemirror/lang-json';

type Direction = 'csv-to-json' | 'json-to-csv';
type Delimiter = ',' | '\t' | ';';

function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === delimiter) { row.push(field); field = ''; }
      else if (ch === '\r' && next === '\n') { row.push(field); field = ''; rows.push(row); row = []; i++; }
      else if (ch === '\n') { row.push(field); field = ''; rows.push(row); row = []; }
      else { field += ch; }
    }
  }
  if (field || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function escapeCsvField(field: string, delimiter: string): string {
  const needsQuoting = field.includes(delimiter) || field.includes('"') || field.includes('\n') || field.includes('\r');
  if (needsQuoting) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}

function jsonToCsv(jsonStr: string, delimiter: string): string {
  const data = JSON.parse(jsonStr);
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('JSON must be an array of objects');
  }
  const headers = Object.keys(data[0]);
  const rows = data.map((obj: Record<string, unknown>) =>
    headers.map((h) => escapeCsvField(String(obj[h] ?? ''), delimiter)).join(delimiter)
  );
  return [headers.map((h) => escapeCsvField(h, delimiter)).join(delimiter), ...rows].join('\n');
}

function csvToJson(csvStr: string, delimiter: string, hasHeader: boolean): string {
  const rows = parseCsv(csvStr, delimiter);
  if (rows.length === 0) return '[]';

  let headers: string[];
  let dataRows: string[][];

  if (hasHeader) {
    headers = rows[0];
    dataRows = rows.slice(1);
  } else {
    const maxCols = Math.max(...rows.map((r) => r.length));
    headers = Array.from({ length: maxCols }, (_, i) => `col${i + 1}`);
    dataRows = rows;
  }

  const result = dataRows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? '';
    });
    return obj;
  });

  return JSON.stringify(result, null, 2);
}

const SAMPLE_CSV = `name,age,city,bio
Alice,30,New York,"Software engineer, loves coding"
Bob,25,San Francisco,"Data scientist
working on ML"
Charlie,35,Chicago,"Has a ""great"" sense of humor"`;

const SAMPLE_JSON = `[
  { "name": "Alice", "age": 30, "city": "New York", "bio": "Software engineer, loves coding" },
  { "name": "Bob", "age": 25, "city": "San Francisco", "bio": "Data scientist\\nworking on ML" },
  { "name": "Charlie", "age": 35, "city": "Chicago", "bio": "Has a \\"great\\" sense of humor" }
]`;

export default function CsvJsonConverter() {
  const [csvValue, setCsvValue] = useState('');
  const [jsonValue, setJsonValue] = useState('');
  const [direction, setDirection] = useState<Direction>('csv-to-json');
  const [hasHeader, setHasHeader] = useState(true);
  const [delimiter, setDelimiter] = useState<Delimiter>(',');
  const [error, setError] = useState('');

  const handleConvert = useCallback(() => {
    setError('');
    try {
      if (direction === 'csv-to-json') {
        if (!csvValue.trim()) {
          setError('Please enter CSV data to convert.');
          return;
        }
        const result = csvToJson(csvValue, delimiter, hasHeader);
        setJsonValue(result);
      } else {
        if (!jsonValue.trim()) {
          setError('Please enter JSON data to convert.');
          return;
        }
        const result = jsonToCsv(jsonValue, delimiter);
        setCsvValue(result);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed.');
    }
  }, [direction, csvValue, jsonValue, delimiter, hasHeader]);

  const handleLoadSample = useCallback(() => {
    setError('');
    if (direction === 'csv-to-json') {
      setCsvValue(SAMPLE_CSV);
      setJsonValue('');
    } else {
      setJsonValue(SAMPLE_JSON);
      setCsvValue('');
    }
  }, [direction]);

  const handleClear = useCallback(() => {
    setCsvValue('');
    setJsonValue('');
    setError('');
  }, []);

  const delimiterLabel = (d: Delimiter) => {
    switch (d) {
      case ',': return 'Comma';
      case '\t': return 'Tab';
      case ';': return 'Semicolon';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CSV &harr; JSON Converter</h1>
        <p className="mt-2 text-muted-foreground">
          Convert between CSV and JSON formats. RFC 4180 compliant parsing with support for
          quoted fields, embedded commas, and newlines. All processing happens in your browser.
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-lg border border-border p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Direction Toggle */}
          <button
            onClick={() => setDirection(direction === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json')}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {direction === 'csv-to-json' ? 'CSV \u2192 JSON' : 'JSON \u2192 CSV'}
          </button>

          {/* Delimiter Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Delimiter:</span>
            {([',', '\t', ';'] as Delimiter[]).map((d) => (
              <button
                key={d}
                onClick={() => setDelimiter(d)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  delimiter === d
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {delimiterLabel(d)}
              </button>
            ))}
          </div>

          {/* Header Row Toggle */}
          <button
            onClick={() => setHasHeader((v) => !v)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              hasHeader
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'border-border hover:bg-accent'
            }`}
          >
            {hasHeader ? 'Header Row: On' : 'Header Row: Off'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleConvert}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
          >
            Convert
          </button>
          <button
            onClick={handleLoadSample}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
          >
            Load Sample Data
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors text-destructive"
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CSV Panel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              CSV
            </h2>
            <CopyButton text={csvValue} />
          </div>
          <CodeEditor
            value={csvValue}
            onChange={setCsvValue}
            placeholder="Paste your CSV data here..."
            minHeight="350px"
          />
        </div>

        {/* JSON Panel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              JSON
            </h2>
            <CopyButton text={jsonValue} />
          </div>
          <CodeEditor
            value={jsonValue}
            onChange={setJsonValue}
            language={json()}
            placeholder="Paste your JSON data here..."
            minHeight="350px"
          />
        </div>
      </div>
    </div>
  );
}
