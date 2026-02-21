import { useState, useMemo, useCallback } from 'react';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import CodeEditor from '@/components/shared/CodeEditor';
import CopyButton from '@/components/shared/CopyButton';
import { html } from '@codemirror/lang-html';

const SAMPLE_HTML = `<h1>Hello World</h1>
<p>This is a <strong>bold</strong> and <em>italic</em> paragraph with <code>inline code</code>.</p>

<h2>Features</h2>
<ul>
  <li>Bullet list item 1</li>
  <li>Bullet list item 2</li>
</ul>

<blockquote>
  <p>A blockquote with <strong>bold</strong> text.</p>
</blockquote>

<pre><code>console.log("Hello!");</code></pre>

<table>
  <thead>
    <tr><th>Column A</th><th>Column B</th></tr>
  </thead>
  <tbody>
    <tr><td>Cell 1</td><td>Cell 2</td></tr>
    <tr><td>Cell 3</td><td>Cell 4</td></tr>
  </tbody>
</table>

<p>This has a <a href="https://example.com">link</a> and an image:</p>
<img src="https://via.placeholder.com/200" alt="Placeholder" />

<p>Some <del>strikethrough</del> text.</p>`;

type HeadingStyle = 'atx' | 'setext';
type CodeBlockStyle = 'fenced' | 'indented';
type BulletChar = '-' | '*' | '+';

const htmlLang = html();

export default function HtmlToMarkdown() {
  const [input, setInput] = useState('');
  const [headingStyle, setHeadingStyle] = useState<HeadingStyle>('atx');
  const [codeBlockStyle, setCodeBlockStyle] = useState<CodeBlockStyle>('fenced');
  const [bulletChar, setBulletChar] = useState<BulletChar>('-');
  const [useGfm, setUseGfm] = useState(true);
  const [error, setError] = useState('');

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      setError('');
      const td = new TurndownService({
        headingStyle,
        codeBlockStyle,
        bulletListMarker: bulletChar,
      });
      if (useGfm) {
        td.use(gfm);
      }
      return td.turndown(input);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to convert HTML');
      return '';
    }
  }, [input, headingStyle, codeBlockStyle, bulletChar, useGfm]);

  const handleSample = useCallback(() => setInput(SAMPLE_HTML), []);
  const handleClear = useCallback(() => { setInput(''); setError(''); }, []);

  return (
    <div>
      <div className="mb-6">
        <p className="text-muted-foreground">
          Convert HTML to Markdown with configurable heading style, code blocks, and GFM support.
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
          <span className="text-muted-foreground">Headings:</span>
          <select
            value={headingStyle}
            onChange={(e) => setHeadingStyle(e.target.value as HeadingStyle)}
            className="px-2 py-1 rounded-md border border-border bg-background text-sm"
          >
            <option value="atx">ATX (# Heading)</option>
            <option value="setext">Setext (underline)</option>
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Code:</span>
          <select
            value={codeBlockStyle}
            onChange={(e) => setCodeBlockStyle(e.target.value as CodeBlockStyle)}
            className="px-2 py-1 rounded-md border border-border bg-background text-sm"
          >
            <option value="fenced">Fenced (```)</option>
            <option value="indented">Indented</option>
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Bullets:</span>
          <select
            value={bulletChar}
            onChange={(e) => setBulletChar(e.target.value as BulletChar)}
            className="px-2 py-1 rounded-md border border-border bg-background text-sm"
          >
            <option value="-">- (dash)</option>
            <option value="*">* (asterisk)</option>
            <option value="+">+ (plus)</option>
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={useGfm}
            onChange={(e) => setUseGfm(e.target.checked)}
            className="rounded"
          />
          <span className="text-muted-foreground">GFM (tables, strikethrough)</span>
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
          <div className="text-sm font-medium text-muted-foreground mb-2">HTML Input</div>
          <CodeEditor
            value={input}
            onChange={setInput}
            language={htmlLang}
            placeholder="Paste your HTML here..."
            minHeight="500px"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Markdown Output</span>
            <CopyButton text={output} label="Copy" />
          </div>
          <pre className="flex-1 min-h-[500px] p-4 rounded-lg border border-border bg-muted/30 overflow-auto text-sm font-mono whitespace-pre-wrap">
            {output || 'Paste HTML to see converted Markdown...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
