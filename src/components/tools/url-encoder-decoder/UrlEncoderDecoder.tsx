import { useState, useCallback } from 'react';
import CopyButton from '@/components/shared/CopyButton';

type EncodingMode = 'component' | 'full';

const SAMPLE_URL = 'https://example.com/search?q=hello world&lang=en&tags=foo bar&redirect=https://other.com/path?key=val#section';

export default function UrlEncoderDecoder() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<EncodingMode>('component');
  const [realTime, setRealTime] = useState(false);
  const [error, setError] = useState('');

  const encode = useCallback(
    (value: string) => {
      try {
        setError('');
        const result =
          mode === 'component'
            ? encodeURIComponent(value)
            : encodeURI(value);
        setOutput(result);
      } catch (e) {
        setError(`Encoding error: ${(e as Error).message}`);
        setOutput('');
      }
    },
    [mode],
  );

  const decode = useCallback(
    (value: string) => {
      try {
        setError('');
        const result =
          mode === 'component'
            ? decodeURIComponent(value)
            : decodeURI(value);
        setOutput(result);
      } catch (e) {
        setError(`Decoding error: ${(e as Error).message}`);
        setOutput('');
      }
    },
    [mode],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      if (realTime) {
        encode(value);
      }
    },
    [realTime, encode],
  );

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
  }, []);

  const handleSample = useCallback(() => {
    setInput(SAMPLE_URL);
    setError('');
    if (realTime) {
      encode(SAMPLE_URL);
    }
  }, [realTime, encode]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-muted-foreground text-sm mb-4">
          Encode and decode URL components. All processing happens in your browser.
        </p>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Mode selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            Mode:
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as EncodingMode)}
            className="px-2 py-1.5 text-sm rounded-md border border-border bg-transparent hover:bg-accent transition-colors"
          >
            <option value="component">Component (encodeURIComponent)</option>
            <option value="full">Full URL (encodeURI)</option>
          </select>
        </div>

        {/* Real-time toggle */}
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={realTime}
            onChange={(e) => setRealTime(e.target.checked)}
            className="rounded"
          />
          Real-time encode
        </label>
      </div>

      {/* Input */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-muted-foreground">
          Input
        </label>
        <textarea
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Paste a URL or text to encode/decode..."
          rows={6}
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          spellCheck={false}
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => encode(input)}
          disabled={!input}
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Encode
        </button>
        <button
          onClick={() => decode(input)}
          disabled={!input}
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Decode
        </button>
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
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md px-3 py-2 text-sm bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {/* Output */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-muted-foreground">
            Output
          </label>
          {output && <CopyButton text={output} />}
        </div>
        <textarea
          value={output}
          readOnly
          placeholder="Result will appear here..."
          rows={6}
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          spellCheck={false}
        />
      </div>

      {/* Info badge */}
      <div className="rounded-md px-3 py-2 text-sm bg-safe/10 text-safe">
        {mode === 'component'
          ? 'encodeURIComponent encodes all special characters including : / ? # & = — best for encoding individual query parameter values.'
          : 'encodeURI preserves URL-safe characters like : / ? # & = — best for encoding a full URL while keeping its structure.'}
      </div>
    </div>
  );
}
