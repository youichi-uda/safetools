import { useState, useCallback, useMemo } from 'react';
import { format } from 'sql-formatter';
import { sql } from '@codemirror/lang-sql';
import CodeEditor from '@/components/shared/CodeEditor';
import CopyButton from '@/components/shared/CopyButton';

const SAMPLE_SQL = `select u.id, u.name, u.email, o.id as order_id, o.total, o.created_at from users u inner join orders o on u.id = o.user_id left join order_items oi on o.id = oi.order_id where u.status = 'active' and o.created_at >= '2024-01-01' and o.total > 100 group by u.id, u.name, u.email, o.id, o.total, o.created_at having count(oi.id) > 2 order by o.created_at desc limit 50 offset 10;`;

const DIALECTS = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'transactsql', label: 'SQL Server (T-SQL)' },
  { value: 'plsql', label: 'Oracle (PL/SQL)' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'spark', label: 'Spark SQL' },
  { value: 'redshift', label: 'Redshift' },
  { value: 'hive', label: 'Hive' },
  { value: 'singlestoredb', label: 'SingleStoreDB' },
] as const;

type Dialect = (typeof DIALECTS)[number]['value'];

const KEYWORD_CASES = [
  { value: 'preserve', label: 'Preserve' },
  { value: 'upper', label: 'UPPER' },
  { value: 'lower', label: 'lower' },
] as const;

type KeywordCase = (typeof KEYWORD_CASES)[number]['value'];

const sqlLang = sql();

export default function SqlFormatter() {
  const [input, setInput] = useState('');
  const [dialect, setDialect] = useState<Dialect>('sql');
  const [tabWidth, setTabWidth] = useState(2);
  const [keywordCase, setKeywordCase] = useState<KeywordCase>('upper');
  const [error, setError] = useState('');

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      setError('');
      return format(input, {
        language: dialect,
        tabWidth,
        keywordCase,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to format SQL');
      return input;
    }
  }, [input, dialect, tabWidth, keywordCase]);

  const handleSample = useCallback(() => setInput(SAMPLE_SQL), []);
  const handleClear = useCallback(() => { setInput(''); setError(''); }, []);

  return (
    <div>
      <div className="mb-6">
        <p className="text-muted-foreground">
          Format and beautify SQL queries with support for multiple dialects.
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

        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Dialect:</span>
          <select
            value={dialect}
            onChange={(e) => setDialect(e.target.value as Dialect)}
            className="px-2 py-1 rounded-md border border-border bg-background text-sm"
          >
            {DIALECTS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Indent:</span>
          <select
            value={tabWidth}
            onChange={(e) => setTabWidth(Number(e.target.value))}
            className="px-2 py-1 rounded-md border border-border bg-background text-sm"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Keywords:</span>
          <select
            value={keywordCase}
            onChange={(e) => setKeywordCase(e.target.value as KeywordCase)}
            className="px-2 py-1 rounded-md border border-border bg-background text-sm"
          >
            {KEYWORD_CASES.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Input</span>
          </div>
          <CodeEditor
            value={input}
            onChange={setInput}
            language={sqlLang}
            placeholder="Paste your SQL here..."
            minHeight="400px"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Formatted</span>
            <CopyButton text={output} label="Copy" />
          </div>
          <CodeEditor
            value={output}
            language={sqlLang}
            readOnly
            minHeight="400px"
          />
        </div>
      </div>
    </div>
  );
}
