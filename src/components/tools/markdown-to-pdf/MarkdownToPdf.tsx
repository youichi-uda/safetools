import { useState, useMemo, useCallback } from 'react';
import { parseMarkdown } from '@/lib/markdown-parser';

const SAMPLE_MD = `# Project Report

## Summary

This is a sample document to demonstrate **Markdown to PDF** conversion. It supports *italic*, **bold**, and \`inline code\`.

## Features

- Client-side PDF generation
- Customizable page size and margins
- Live preview before download

## Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Data Table

| Metric | Q1 | Q2 | Q3 |
|--------|-----|-----|-----|
| Revenue | $10K | $15K | $22K |
| Users | 100 | 250 | 500 |

> All processing happens in your browser. Your data never leaves your machine.

---

*Generated with SafeTools.dev*
`;

type PageSize = 'a4' | 'letter' | 'legal';

const PAGE_SIZES: { value: PageSize; label: string }[] = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
  { value: 'legal', label: 'Legal' },
];

export default function MarkdownToPdf() {
  const [input, setInput] = useState('');
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [margin, setMargin] = useState(10);
  const [fontSize, setFontSize] = useState(14);
  const [generating, setGenerating] = useState(false);
  const htmlOutput = useMemo(() => parseMarkdown(input), [input]);

  const handleSample = useCallback(() => setInput(SAMPLE_MD), []);
  const handleClear = useCallback(() => setInput(''), []);

  const handleGeneratePdf = useCallback(() => {
    if (!input.trim()) return;
    setGenerating(true);
    try {
      // Use a print-optimized iframe + window.print() to generate PDF
      // This avoids html2canvas oklch color parsing issues entirely
      const pageSizeCss: Record<PageSize, string> = {
        a4: '210mm 297mm',
        letter: '8.5in 11in',
        legal: '8.5in 14in',
      };

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.width = '0';
      iframe.style.height = '0';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument!;
      iframeDoc.open();
      iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Document</title>
  <style>
    @page { size: ${pageSizeCss[pageSize]}; margin: ${margin}mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: ${fontSize}px;
      line-height: 1.7;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
    }
    img { max-width: 100%; height: auto; }
    a { color: #3b82f6; }
  </style>
</head>
<body>${htmlOutput}</body>
</html>`);
      iframeDoc.close();

      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();

      // Clean up after a short delay to allow print dialog to open
      setTimeout(() => {
        document.body.removeChild(iframe);
        setGenerating(false);
      }, 1000);
    } catch (e) {
      console.error('PDF generation failed:', e);
      setGenerating(false);
    }
  }, [input, htmlOutput, pageSize, margin, fontSize]);

  return (
    <div>
      <div className="mb-6">
        <p className="text-muted-foreground">
          Convert Markdown to PDF with customizable page size, margins, and font size. Preview before downloading.
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
          <span className="text-muted-foreground">Page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value as PageSize)}
            className="px-2 py-1 rounded-md border border-border bg-background text-sm"
          >
            {PAGE_SIZES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Margin:</span>
          <select
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
            className="px-2 py-1 rounded-md border border-border bg-background text-sm"
          >
            <option value={5}>5mm</option>
            <option value={10}>10mm</option>
            <option value={15}>15mm</option>
            <option value={20}>20mm</option>
            <option value={25}>25mm</option>
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Font:</span>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="px-2 py-1 rounded-md border border-border bg-background text-sm"
          >
            <option value={12}>12px</option>
            <option value={14}>14px</option>
            <option value={16}>16px</option>
            <option value={18}>18px</option>
          </select>
        </label>

        <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

        <button
          onClick={handleGeneratePdf}
          disabled={!input.trim() || generating}
          className="px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate PDF'}
        </button>
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

        {/* Preview */}
        <div className="flex flex-col">
          <div className="text-sm font-medium text-muted-foreground mb-2">Preview</div>
          <div
            className="flex-1 min-h-[500px] p-4 rounded-lg border border-border overflow-auto bg-white text-black"
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: htmlOutput }}
          />
        </div>
      </div>
    </div>
  );
}
