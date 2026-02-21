import { useState, useCallback, useMemo } from 'react';
import CopyButton from '@/components/shared/CopyButton';

const SAMPLE = `The quick brown fox jumps over the lazy dog. Hello World! this is a sample text for case conversion.`;

function toWords(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_\-./]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function toUpperCase(text: string): string {
  return text.toUpperCase();
}

function toLowerCase(text: string): string {
  return text.toLowerCase();
}

function toTitleCase(text: string): string {
  return text.replace(/\w\S*/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}

function toSentenceCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, prefix, letter) =>
      prefix + letter.toUpperCase()
    );
}

function toCamelCase(text: string): string {
  const words = toWords(text);
  if (words.length === 0) return '';
  return words
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join('');
}

function toPascalCase(text: string): string {
  const words = toWords(text);
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function toSnakeCase(text: string): string {
  return toWords(text)
    .map((w) => w.toLowerCase())
    .join('_');
}

function toScreamingSnakeCase(text: string): string {
  return toWords(text)
    .map((w) => w.toUpperCase())
    .join('_');
}

function toKebabCase(text: string): string {
  return toWords(text)
    .map((w) => w.toLowerCase())
    .join('-');
}

function toDotCase(text: string): string {
  return toWords(text)
    .map((w) => w.toLowerCase())
    .join('.');
}

function toPathCase(text: string): string {
  return toWords(text)
    .map((w) => w.toLowerCase())
    .join('/');
}

function toReverseCase(text: string): string {
  return text
    .split('')
    .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
    .join('');
}

interface Conversion {
  label: string;
  fn: (text: string) => string;
}

const conversions: Conversion[] = [
  { label: 'UPPER CASE', fn: toUpperCase },
  { label: 'lower case', fn: toLowerCase },
  { label: 'Title Case', fn: toTitleCase },
  { label: 'Sentence case', fn: toSentenceCase },
  { label: 'camelCase', fn: toCamelCase },
  { label: 'PascalCase', fn: toPascalCase },
  { label: 'snake_case', fn: toSnakeCase },
  { label: 'SCREAMING_SNAKE', fn: toScreamingSnakeCase },
  { label: 'kebab-case', fn: toKebabCase },
  { label: 'dot.case', fn: toDotCase },
  { label: 'path/case', fn: toPathCase },
  { label: 'rEVERSE cASE', fn: toReverseCase },
];

export default function TextCaseConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [activeLabel, setActiveLabel] = useState('');

  const charCount = input.length;
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;

  const previews = useMemo(() => {
    if (!input.trim()) return {};
    const previewText = input.slice(0, 40);
    const result: Record<string, string> = {};
    for (const c of conversions) {
      result[c.label] = c.fn(previewText);
    }
    return result;
  }, [input]);

  const convert = useCallback(
    (conversion: Conversion) => {
      setOutput(conversion.fn(input));
      setActiveLabel(conversion.label);
    },
    [input],
  );

  const clear = useCallback(() => {
    setInput('');
    setOutput('');
    setActiveLabel('');
  }, []);

  const loadSample = useCallback(() => {
    setInput(SAMPLE);
    setOutput('');
    setActiveLabel('');
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Text Case Converter</h1>
        <p className="text-muted-foreground mt-1">
          Convert text between UPPER, lower, Title, camelCase, snake_case, kebab-case, and more. All processing happens in your browser.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Input</label>
            <span className="text-xs text-muted-foreground">
              {charCount} character{charCount !== 1 ? 's' : ''} · {wordCount} word{wordCount !== 1 ? 's' : ''}
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setOutput('');
              setActiveLabel('');
            }}
            placeholder="Type or paste your text here..."
            className="w-full h-36 p-3 rounded-md border border-border bg-background text-foreground font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={loadSample}
              className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
            >
              Sample
            </button>
            <button
              onClick={clear}
              className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Conversions</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {conversions.map((c) => (
              <button
                key={c.label}
                onClick={() => convert(c)}
                disabled={!input.trim()}
                className={`flex flex-col items-start p-2.5 rounded-md border text-left transition-colors ${
                  activeLabel === c.label
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-accent'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <span className="text-sm font-medium">{c.label}</span>
                {previews[c.label] && (
                  <span className="text-xs text-muted-foreground mt-1 truncate w-full">
                    {previews[c.label]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {output && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">
                Output{activeLabel ? ` — ${activeLabel}` : ''}
              </label>
              <CopyButton text={output} />
            </div>
            <textarea
              value={output}
              readOnly
              className="w-full h-36 p-3 rounded-md border border-border bg-muted text-foreground font-mono text-sm resize-y focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
