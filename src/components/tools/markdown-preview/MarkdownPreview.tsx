import { useState, useMemo, useCallback } from 'react';
import CopyButton from '@/components/shared/CopyButton';
import { parseMarkdown, generateHtmlDocument } from '@/lib/markdown-parser';

const SAMPLE_MARKDOWN = `# Markdown Preview Demo

## Features Showcase

This is a **bold text**, this is *italic text*, and this is ***bold and italic***.

You can also use ~~strikethrough~~ text.

### Links and Images

Visit [SafeTools.dev](https://safetools.dev) for privacy-first developer tools.

![Placeholder Image](https://via.placeholder.com/600x200?text=Markdown+Preview)

### Code

Inline code: \`const greeting = "Hello, world!";\`

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
\`\`\`

### Lists

Unordered list:
- First item
- Second item
- Third item

Ordered list:
1. Step one
2. Step two
3. Step three

### Task List

- [x] Implement markdown parser
- [x] Add live preview
- [ ] Add more features
- [ ] Write documentation

### Blockquote

> Your data never leaves your browser.
> All processing is 100% client-side.

### Table

| Feature | Status | Notes |
|---------|--------|-------|
| Headings | Done | h1 through h6 |
| Bold/Italic | Done | Single, double, triple asterisks |
| Code Blocks | Done | With syntax label |
| Tables | Done | With headers |
| Task Lists | Done | Checkboxes |

### Horizontal Rule

---

### Nested Content

> **Note:** You can combine *formatting* inside blockquotes and even add \`inline code\`.

That's it! Start editing to see the **live preview** in action.
`;


function getWordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function MarkdownPreview() {
  const [markdown, setMarkdown] = useState('');

  const htmlOutput = useMemo(() => parseMarkdown(markdown), [markdown]);

  const wordCount = useMemo(() => getWordCount(markdown), [markdown]);
  const charCount = markdown.length;

  const handleClear = useCallback(() => setMarkdown(''), []);
  const handleSample = useCallback(() => setMarkdown(SAMPLE_MARKDOWN), []);

  const handleDownloadMd = useCallback(() => {
    downloadFile(markdown, 'document.md', 'text/markdown');
  }, [markdown]);

  const handleDownloadHtml = useCallback(() => {
    downloadFile(generateHtmlDocument(htmlOutput), 'document.html', 'text/html');
  }, [htmlOutput]);

  return (
    <div>
      <div className="mb-6">
        <p className="text-muted-foreground">
          Write or paste Markdown and see a live preview. Supports headings, lists, tables, code blocks, task lists, and more.
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

        <CopyButton text={markdown} label="Copy Markdown" />
        <CopyButton text={htmlOutput} label="Copy HTML" />

        <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

        <button
          onClick={handleDownloadMd}
          disabled={!markdown}
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Download .md
        </button>
        <button
          onClick={handleDownloadHtml}
          disabled={!markdown}
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Download .html
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground mb-4">
        <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        <span>{charCount} {charCount === 1 ? 'character' : 'characters'}</span>
      </div>

      {/* Editor + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="flex flex-col">
          <div className="text-sm font-medium text-muted-foreground mb-2">Editor</div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Type or paste your Markdown here..."
            spellCheck={false}
            className="flex-1 min-h-[500px] p-4 rounded-lg border border-border bg-transparent font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Preview */}
        <div className="flex flex-col">
          <div className="text-sm font-medium text-muted-foreground mb-2">Preview</div>
          <div
            className="flex-1 min-h-[500px] p-4 rounded-lg border border-border overflow-auto"
            dangerouslySetInnerHTML={{ __html: htmlOutput }}
          />
        </div>
      </div>
    </div>
  );
}
