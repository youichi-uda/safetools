import { useState, useCallback } from 'react';
import { json } from '@codemirror/lang-json';
import CodeEditor from '@/components/shared/CodeEditor';
import CopyButton from '@/components/shared/CopyButton';
import FileDropZone from '@/components/shared/FileDropZone';

const SAMPLE = `{"name":"SafeTools","version":"1.0.0","description":"Developer tools that respect your privacy","features":["JSON Formatter","Code Beautifier","Diff Checker"],"config":{"clientSide":true,"dataCollection":false}}`;

type IndentType = '2' | '4' | 'tab';

export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indent, setIndent] = useState<IndentType>('2');

  const getIndent = useCallback((t: IndentType) => {
    if (t === 'tab') return '\t';
    return Number(t);
  }, []);

  const format = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, getIndent(indent)));
      setError('');
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  }, [input, indent, getIndent]);

  const minify = useCallback(() => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError('');
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  }, [input]);

  const validate = useCallback(() => {
    if (!input.trim()) return;
    try {
      JSON.parse(input);
      setError('');
      setOutput('Valid JSON');
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  }, [input]);

  const clear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
  }, []);

  const loadSample = useCallback(() => {
    setInput(SAMPLE);
    setError('');
    try {
      setOutput(JSON.stringify(JSON.parse(SAMPLE), null, getIndent(indent)));
    } catch { /* ignore */ }
  }, [indent, getIndent]);

  const download = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">JSON Formatter & Validator</h1>
      <p className="text-muted-foreground text-sm mb-4">
        Format, validate, and minify JSON. All processing happens in your browser.
      </p>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={format} className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          Format
        </button>
        <button onClick={minify} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors">
          Minify
        </button>
        <button onClick={validate} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors">
          Validate
        </button>

        <div className="h-5 w-px bg-border mx-1" />

        <select
          value={indent}
          onChange={(e) => setIndent(e.target.value as IndentType)}
          className="px-2 py-1.5 text-sm rounded-md border border-border bg-background"
        >
          <option value="2">2 spaces</option>
          <option value="4">4 spaces</option>
          <option value="tab">Tabs</option>
        </select>

        <div className="h-5 w-px bg-border mx-1" />

        {output && <CopyButton text={output} />}
        {output && (
          <button onClick={download} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download
          </button>
        )}
        <button onClick={clear} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors text-muted-foreground">
          Clear
        </button>
        <button onClick={loadSample} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors text-muted-foreground">
          Sample
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Editor panels */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Input</label>
          <FileDropZone onFileContent={setInput} accept=".json,.txt">
            <CodeEditor
              value={input}
              onChange={setInput}
              language={json()}
              placeholder="Paste or drop JSON here..."
              minHeight="400px"
            />
          </FileDropZone>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Output</label>
          <CodeEditor
            value={output}
            language={json()}
            readOnly
            placeholder="Formatted output will appear here..."
            minHeight="400px"
          />
        </div>
      </div>
    </div>
  );
}
