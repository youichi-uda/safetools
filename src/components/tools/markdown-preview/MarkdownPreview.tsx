import { useState, useMemo, useCallback } from 'react';
import CopyButton from '@/components/shared/CopyButton';

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseMarkdown(md: string): string {
  // Escape HTML entities first
  let html = escapeHtml(md);

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const langLabel = lang ? `<div style="font-size:0.75rem;color:#888;padding:0.25rem 0.75rem;border-bottom:1px solid rgba(128,128,128,0.2);">${lang}</div>` : '';
    return `<pre style="background:rgba(128,128,128,0.1);border-radius:0.5rem;overflow-x:auto;margin:1rem 0;">${langLabel}<code style="display:block;padding:0.75rem;font-size:0.875rem;line-height:1.6;white-space:pre;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;">${code.trim()}</code></pre>`;
  });

  // Tables
  html = html.replace(/((?:\|.*\|\n)+)/g, (tableBlock) => {
    const rows = tableBlock.trim().split('\n').filter(r => r.trim());
    if (rows.length < 2) return tableBlock;

    // Check if second row is a separator
    const sepRow = rows[1];
    if (!/^\|[\s\-:|]+\|$/.test(sepRow.trim())) return tableBlock;

    const parseRow = (row: string) =>
      row.split('|').slice(1, -1).map(cell => cell.trim());

    const headers = parseRow(rows[0]);
    const bodyRows = rows.slice(2);

    let tableHtml = '<table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:0.875rem;">';
    tableHtml += '<thead><tr>';
    for (const h of headers) {
      tableHtml += `<th style="border:1px solid rgba(128,128,128,0.3);padding:0.5rem 0.75rem;text-align:left;font-weight:600;background:rgba(128,128,128,0.1);">${parseInline(h)}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';
    for (const row of bodyRows) {
      const cells = parseRow(row);
      tableHtml += '<tr>';
      for (const cell of cells) {
        tableHtml += `<td style="border:1px solid rgba(128,128,128,0.3);padding:0.5rem 0.75rem;">${parseInline(cell)}</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table>';
    return tableHtml;
  });

  // Process block-level elements line by line
  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;
  let listType = '';
  let inBlockquote = false;
  let blockquoteLines: string[] = [];

  const flushBlockquote = () => {
    if (inBlockquote && blockquoteLines.length > 0) {
      result.push(
        `<blockquote style="border-left:4px solid rgba(128,128,128,0.4);padding:0.5rem 1rem;margin:1rem 0;color:inherit;opacity:0.85;">${blockquoteLines.map(l => parseInline(l)).join('<br/>')}</blockquote>`
      );
      blockquoteLines = [];
      inBlockquote = false;
    }
  };

  const flushList = () => {
    if (inList) {
      result.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
      listType = '';
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip lines that are part of pre/code/table blocks (already processed)
    if (line.startsWith('<pre') || line.startsWith('<table') || line.startsWith('</')) {
      flushBlockquote();
      flushList();
      result.push(line);
      continue;
    }

    // Horizontal rule
    if (/^(\-{3,}|\*{3,})$/.test(line.trim())) {
      flushBlockquote();
      flushList();
      result.push('<hr style="border:none;border-top:1px solid rgba(128,128,128,0.3);margin:1.5rem 0;" />');
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushBlockquote();
      flushList();
      const level = headingMatch[1].length;
      const sizes: Record<number, string> = {
        1: 'font-size:2rem;font-weight:800;margin:1.5rem 0 1rem;line-height:1.2;',
        2: 'font-size:1.5rem;font-weight:700;margin:1.25rem 0 0.75rem;line-height:1.3;',
        3: 'font-size:1.25rem;font-weight:600;margin:1rem 0 0.5rem;line-height:1.4;',
        4: 'font-size:1.125rem;font-weight:600;margin:1rem 0 0.5rem;',
        5: 'font-size:1rem;font-weight:600;margin:0.75rem 0 0.5rem;',
        6: 'font-size:0.875rem;font-weight:600;margin:0.75rem 0 0.5rem;',
      };
      result.push(`<h${level} style="${sizes[level]}">${parseInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Blockquotes
    if (line.startsWith('&gt; ') || line === '&gt;') {
      flushList();
      inBlockquote = true;
      blockquoteLines.push(line.replace(/^&gt;\s?/, ''));
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // Task list items
    const taskMatch = line.match(/^- \[([ xX])\]\s+(.+)$/);
    if (taskMatch) {
      if (!inList || listType !== 'ul-task') {
        flushList();
        result.push('<ul style="list-style:none;padding-left:0.25rem;margin:0.5rem 0;">');
        inList = true;
        listType = 'ul-task';
      }
      const checked = taskMatch[1] !== ' ';
      const checkboxStyle = checked
        ? 'display:inline-block;width:1rem;height:1rem;border:2px solid #22c55e;border-radius:3px;margin-right:0.5rem;vertical-align:middle;background:#22c55e;position:relative;'
        : 'display:inline-block;width:1rem;height:1rem;border:2px solid rgba(128,128,128,0.4);border-radius:3px;margin-right:0.5rem;vertical-align:middle;';
      const checkmark = checked ? '<span style="position:absolute;top:-1px;left:2px;color:white;font-size:0.7rem;">&#10003;</span>' : '';
      result.push(`<li style="padding:0.2rem 0;"><span style="${checkboxStyle}">${checkmark}</span>${parseInline(taskMatch[2])}</li>`);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      flushBlockquote();
      if (!inList || listType !== 'ul') {
        flushList();
        result.push('<ul style="list-style-type:disc;padding-left:1.5rem;margin:0.5rem 0;">');
        inList = true;
        listType = 'ul';
      }
      result.push(`<li style="padding:0.15rem 0;">${parseInline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      flushBlockquote();
      if (!inList || listType !== 'ol') {
        flushList();
        result.push('<ol style="list-style-type:decimal;padding-left:1.5rem;margin:0.5rem 0;">');
        inList = true;
        listType = 'ol';
      }
      result.push(`<li style="padding:0.15rem 0;">${parseInline(olMatch[1])}</li>`);
      continue;
    }

    // Close list if we hit a non-list line
    flushList();

    // Empty line
    if (line.trim() === '') {
      result.push('');
      continue;
    }

    // Paragraph
    result.push(`<p style="margin:0.5rem 0;line-height:1.7;">${parseInline(line)}</p>`);
  }

  flushBlockquote();
  flushList();

  return result.join('\n');
}

function parseInline(text: string): string {
  // Images: ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:0.5rem;margin:0.5rem 0;" />');

  // Links: [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#3b82f6;text-decoration:underline;" target="_blank" rel="noopener noreferrer">$1</a>');

  // Bold + italic: ***text***
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');

  // Bold: **text**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Strikethrough: ~~text~~
  text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Inline code: `code`
  text = text.replace(/`([^`]+)`/g, '<code style="background:rgba(128,128,128,0.15);padding:0.15rem 0.4rem;border-radius:0.25rem;font-size:0.875em;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;">$1</code>');

  return text;
}

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

function generateHtmlDocument(htmlBody: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Preview</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      max-width: 48rem;
      margin: 2rem auto;
      padding: 0 1rem;
      line-height: 1.7;
      color: #1a1a1a;
    }
    img { max-width: 100%; height: auto; }
    a { color: #3b82f6; }
  </style>
</head>
<body>
${htmlBody}
</body>
</html>`;
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
        <h1 className="text-2xl font-bold mb-2">Markdown Preview</h1>
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
