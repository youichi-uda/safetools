import { useState, useCallback } from 'react';
import CopyButton from '@/components/shared/CopyButton';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: manual v4 UUID using crypto.getRandomValues()
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

function formatUUID(
  uuid: string,
  options: { uppercase: boolean; hyphens: boolean; braces: boolean }
): string {
  let result = uuid;
  if (!options.hyphens) {
    result = result.replace(/-/g, '');
  }
  if (options.uppercase) {
    result = result.toUpperCase();
  }
  if (options.braces) {
    result = `{${result}}`;
  }
  return result;
}

export default function UuidGenerator() {
  const [currentUUID, setCurrentUUID] = useState<string>(generateUUID());
  const [bulkCount, setBulkCount] = useState<number>(5);
  const [bulkUUIDs, setBulkUUIDs] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [braces, setBraces] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const formatOptions = { uppercase, hyphens, braces };

  const addToHistory = useCallback(
    (uuid: string) => {
      setHistory((prev) => {
        const next = [uuid, ...prev.filter((u) => u !== uuid)];
        return next.slice(0, 10);
      });
    },
    []
  );

  const handleGenerate = useCallback(() => {
    const raw = generateUUID();
    setCurrentUUID(raw);
    addToHistory(raw);
  }, [addToHistory]);

  const handleGenerateBulk = useCallback(() => {
    const uuids = Array.from({ length: bulkCount }, () => generateUUID());
    setBulkUUIDs(uuids);
    uuids.forEach((u) => addToHistory(u));
  }, [bulkCount, addToHistory]);

  const copyToClipboard = useCallback(
    async (text: string, index?: number) => {
      try {
        await navigator.clipboard.writeText(text);
        if (index !== undefined) {
          setCopiedIndex(index);
          setTimeout(() => setCopiedIndex(null), 1500);
        } else {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      } catch {
        // Clipboard API not available
      }
    },
    []
  );

  const handleDownloadBulk = useCallback(() => {
    const formatted = bulkUUIDs.map((u) => formatUUID(u, formatOptions)).join('\n');
    const blob = new Blob([formatted], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uuids.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [bulkUUIDs, formatOptions]);

  const displayUUID = formatUUID(currentUUID, formatOptions);
  const bulkFormatted = bulkUUIDs.map((u) => formatUUID(u, formatOptions));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">UUID Generator</h1>
        <p className="mt-2 text-muted-foreground">
          Generate RFC 4122 version 4 UUIDs. All generation happens entirely in your browser
          using the Web Crypto API — your data never leaves your device.
        </p>
      </div>

      {/* Main UUID Display */}
      <div className="rounded-lg border border-border p-6 text-center space-y-4">
        <button
          onClick={() => copyToClipboard(displayUUID)}
          className="w-full group cursor-pointer rounded-md p-4 transition-colors hover:bg-accent"
          title="Click to copy"
        >
          <p className="font-mono text-2xl sm:text-3xl md:text-4xl break-all select-all tracking-wide">
            {displayUUID}
          </p>
          <p
            className={`mt-2 text-sm transition-colors ${
              copied ? 'text-safe font-medium' : 'text-muted-foreground'
            }`}
          >
            {copied ? 'Copied to clipboard!' : 'Click to copy'}
          </p>
        </button>

        <button
          onClick={handleGenerate}
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Generate New UUID
        </button>
      </div>

      {/* Format Options */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Format Options
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setUppercase((v) => !v)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              uppercase
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'border-border hover:bg-accent'
            }`}
          >
            {uppercase ? 'UPPERCASE' : 'lowercase'}
          </button>
          <button
            onClick={() => setHyphens((v) => !v)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              hyphens
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'border-border hover:bg-accent'
            }`}
          >
            {hyphens ? 'With Hyphens' : 'No Hyphens'}
          </button>
          <button
            onClick={() => setBraces((v) => !v)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              braces
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'border-border hover:bg-accent'
            }`}
          >
            {braces ? '{Braces}' : 'No Braces'}
          </button>
        </div>
      </div>

      {/* Bulk Generation */}
      <div className="rounded-lg border border-border p-4 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Bulk Generation
        </h2>
        <div className="flex items-center gap-3">
          <label htmlFor="bulk-count" className="text-sm text-muted-foreground">
            Count:
          </label>
          <input
            id="bulk-count"
            type="number"
            min={1}
            max={1000}
            value={bulkCount}
            onChange={(e) => {
              const val = Math.min(1000, Math.max(1, Number(e.target.value) || 1));
              setBulkCount(val);
            }}
            className="w-24 rounded-md border border-border bg-transparent px-3 py-1.5 text-sm"
          />
          <button
            onClick={handleGenerateBulk}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Generate Bulk
          </button>
        </div>

        {bulkUUIDs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {bulkUUIDs.length} UUID{bulkUUIDs.length !== 1 ? 's' : ''} generated
              </span>
              <div className="flex items-center gap-2">
                <CopyButton text={bulkFormatted.join('\n')} />
                <button
                  onClick={handleDownloadBulk}
                  className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
                >
                  Download .txt
                </button>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-accent/30 p-3">
              <pre className="font-mono text-sm whitespace-pre-wrap break-all">
                {bulkFormatted.join('\n')}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              History (last {history.length})
            </h2>
            <button
              onClick={() => setHistory([])}
              className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors text-destructive"
            >
              Clear History
            </button>
          </div>
          <ul className="space-y-1">
            {history.map((uuid, i) => {
              const formatted = formatUUID(uuid, formatOptions);
              return (
                <li key={uuid + i}>
                  <button
                    onClick={() => copyToClipboard(formatted, i)}
                    className="w-full text-left rounded px-2 py-1 font-mono text-sm hover:bg-accent transition-colors group"
                    title="Click to copy"
                  >
                    <span className="break-all">{formatted}</span>
                    {copiedIndex === i && (
                      <span className="ml-2 text-xs text-safe font-medium">Copied!</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
