import { useState, useCallback } from 'react';
import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { markdown } from '@codemirror/lang-markdown';
import { yaml } from '@codemirror/lang-yaml';
import type { Extension } from '@codemirror/state';
import CodeEditor from '@/components/shared/CodeEditor';
import CopyButton from '@/components/shared/CopyButton';
import FileDropZone from '@/components/shared/FileDropZone';

type Language = 'javascript' | 'typescript' | 'css' | 'html' | 'json' | 'yaml' | 'markdown' | 'graphql';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'css', label: 'CSS' },
  { value: 'html', label: 'HTML' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'graphql', label: 'GraphQL' },
];

function getCodemirrorLang(lang: Language): Extension {
  switch (lang) {
    case 'javascript': return javascript();
    case 'typescript': return javascript({ typescript: true });
    case 'css': return css();
    case 'html': return html();
    case 'json': return json();
    case 'yaml': return yaml();
    case 'markdown': return markdown();
    case 'graphql': return javascript(); // fallback
  }
}

async function getPrettierParser(lang: Language) {
  const prettier = await import('prettier/standalone');

  let plugin;
  let parser: string;

  switch (lang) {
    case 'javascript':
    case 'typescript':
      plugin = await import('prettier/plugins/babel');
      // Babel parser needs estree plugin too
      const estree = await import('prettier/plugins/estree');
      parser = lang === 'typescript' ? 'babel-ts' : 'babel';
      return { prettier, plugins: [plugin, estree], parser };
    case 'css':
      plugin = await import('prettier/plugins/postcss');
      parser = 'css';
      return { prettier, plugins: [plugin], parser };
    case 'html':
      plugin = await import('prettier/plugins/html');
      parser = 'html';
      return { prettier, plugins: [plugin], parser };
    case 'json':
      plugin = await import('prettier/plugins/babel');
      const estree2 = await import('prettier/plugins/estree');
      parser = 'json';
      return { prettier, plugins: [plugin, estree2], parser };
    case 'yaml':
      plugin = await import('prettier/plugins/yaml');
      parser = 'yaml';
      return { prettier, plugins: [plugin], parser };
    case 'markdown':
      plugin = await import('prettier/plugins/markdown');
      parser = 'markdown';
      return { prettier, plugins: [plugin], parser };
    case 'graphql':
      plugin = await import('prettier/plugins/graphql');
      parser = 'graphql';
      return { prettier, plugins: [plugin], parser };
  }
}

export default function CodeBeautifier() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [lang, setLang] = useState<Language>('javascript');
  const [loading, setLoading] = useState(false);

  const format = useCallback(async () => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }
    setLoading(true);
    try {
      const { prettier, plugins, parser } = await getPrettierParser(lang);
      const result = await prettier.format(input, {
        parser,
        plugins,
        tabWidth: 2,
        singleQuote: true,
        trailingComma: 'all',
      });
      setOutput(result);
      setError('');
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    } finally {
      setLoading(false);
    }
  }, [input, lang]);

  const clear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
  }, []);

  const download = useCallback(() => {
    if (!output) return;
    const extensions: Record<Language, string> = {
      javascript: '.js', typescript: '.ts', css: '.css', html: '.html',
      json: '.json', yaml: '.yaml', markdown: '.md', graphql: '.graphql',
    };
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted${extensions[lang]}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [output, lang]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Code Beautifier</h1>
      <p className="text-muted-foreground text-sm mb-4">
        Format code using Prettier. Supports JS, TS, CSS, HTML, JSON, YAML, Markdown, and GraphQL.
      </p>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Language)}
          className="px-2 py-1.5 text-sm rounded-md border border-border bg-background"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>

        <button
          onClick={format}
          disabled={loading}
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Formatting...' : 'Beautify'}
        </button>

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
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 whitespace-pre-wrap font-mono">
          {error}
        </div>
      )}

      {/* Editor panels */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Input</label>
          <FileDropZone onFileContent={setInput}>
            <CodeEditor
              value={input}
              onChange={setInput}
              language={getCodemirrorLang(lang)}
              placeholder="Paste or drop code here..."
              minHeight="400px"
            />
          </FileDropZone>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Output</label>
          <CodeEditor
            value={output}
            language={getCodemirrorLang(lang)}
            readOnly
            placeholder="Formatted output will appear here..."
            minHeight="400px"
          />
        </div>
      </div>
    </div>
  );
}
