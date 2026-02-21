import { useState, useMemo, useCallback } from 'react';
import CodeEditor from '@/components/shared/CodeEditor';
import CopyButton from '@/components/shared/CopyButton';
import { parseMarkdown, generateHtmlDocument } from '@/lib/markdown-parser';

const SAMPLE_MD = `# Hello World

This is a **Markdown** document with *italic text* and \`inline code\`.

## Features

- Bullet list item 1
- Bullet list item 2

> A blockquote with **bold** text.

\`\`\`javascript
console.log("Hello!");
\`\`\`

| Column A | Column B |
|----------|----------|
| Cell 1   | Cell 2   |
`;

type OutputMode = 'fragment' | 'full';
type ViewTab = 'html' | 'preview';

export default function MarkdownToHtml() {
  const [input, setInput] = useState('');
  const [outputMode, setOutputMode] = useState<OutputMode>('fragment');
  const [minify, setMinify] = useState(false);
  const [viewTab, setViewTab] = useState<ViewTab>('html');

  const htmlFragment = useMemo(() => parseMarkdown(input), [input]);

  const output = useMemo(() => {
    let html = outputMode === 'full' ? generateHtmlDocument(htmlFragment, 'Converted Document') : htmlFragment;
    if (minify) {
      html = html.replace(/\n\s*/g, '').replace(/>\s+</g, '><').trim();
    }
    return html;
  }, [htmlFragment, outputMode, minify]);

  const handleSample = useCallback(() => setInput(SAMPLE_MD), []);
  const handleClear = useCallback(() => setInput(''), []);

  return (
    <div>
      <div className="mb-6">
        <p className="text-muted-foreground">
          Convert Markdown to HTML with live preview. Choose between full document or fragment output.
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
          <span className="text-muted-foreground">Output:</span>
          <select
            value={outputMode}
            onChange={(e) => setOutputMode(e.target.value as OutputMode)}
            className="px-2 py-1 rounded-md border border-border bg-background text-sm"
          >
            <option value="fragment">Fragment</option>
            <option value="full">Full Document</option>
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={minify}
            onChange={(e) => setMinify(e.target.checked)}
            className="rounded"
          />
          <span className="text-muted-foreground">Minify</span>
        </label>
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="flex flex-col">
          <div className="text-sm font-medium text-muted-foreground mb-2">Markdown Input</div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste your Markdown here..."
            spellCheck={false}
            className="flex-1 min-h-[500px] p-4 rounded-lg border border-border bg-transparent font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Output */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewTab('html')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${viewTab === 'html' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
              >
                HTML
              </button>
              <button
                onClick={() => setViewTab('preview')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${viewTab === 'preview' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
              >
                Preview
              </button>
            </div>
            <CopyButton text={output} label="Copy HTML" />
          </div>

          {viewTab === 'html' ? (
            <CodeEditor
              value={output}
              readOnly
              minHeight="500px"
            />
          ) : (
            <div
              className="flex-1 min-h-[500px] p-4 rounded-lg border border-border overflow-auto"
              dangerouslySetInnerHTML={{ __html: htmlFragment }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
