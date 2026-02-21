import { useState, useCallback } from 'react';
import CopyButton from '@/components/shared/CopyButton';

type Mode = 'text' | 'file';

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function Base64EncoderDecoder() {
  const [mode, setMode] = useState<Mode>('text');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');

  const inputBytes = new TextEncoder().encode(input).length;
  const outputBytes = new TextEncoder().encode(output).length;

  const handleEncode = useCallback(() => {
    setError('');
    if (!input) {
      setOutput('');
      return;
    }
    try {
      setOutput(utf8ToBase64(input));
    } catch {
      setError('Failed to encode input.');
      setOutput('');
    }
  }, [input]);

  const handleDecode = useCallback(() => {
    setError('');
    if (!input) {
      setOutput('');
      return;
    }
    try {
      setOutput(base64ToUtf8(input));
    } catch {
      setError('Invalid Base64 string. Please check your input and try again.');
      setOutput('');
    }
  }, [input]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
    setFileName('');
  }, []);

  const handleFileRead = useCallback((file: File) => {
    setError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setOutput(dataUri);
      setInput('');
    };
    reader.onerror = () => {
      setError('Failed to read file.');
      setOutput('');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileRead(file);
    },
    [handleFileRead],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileRead(file);
    },
    [handleFileRead],
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-muted-foreground text-sm mb-4">
          Encode and decode Base64 strings and files. All processing happens in your browser.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setMode('text');
            handleClear();
          }}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            mode === 'text'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border hover:bg-accent'
          }`}
        >
          Text
        </button>
        <button
          onClick={() => {
            setMode('file');
            handleClear();
          }}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            mode === 'file'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border hover:bg-accent'
          }`}
        >
          File
        </button>
      </div>

      {/* Input area */}
      {mode === 'text' ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Input</label>
            {input && (
              <span className="text-xs text-muted-foreground">
                {formatBytes(inputBytes)}
              </span>
            )}
          </div>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError('');
            }}
            placeholder="Enter text to encode or Base64 string to decode..."
            className="w-full h-48 p-3 rounded-md border border-border bg-transparent font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false}
          />
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex flex-col items-center justify-center gap-3 h-48 rounded-md border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          {fileName ? (
            <p className="text-sm text-muted-foreground">
              Loaded: <span className="font-medium">{fileName}</span>
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Drop a file here or click to browse
              </p>
              <label className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors cursor-pointer">
                Choose File
                <input
                  type="file"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </>
          )}
        </div>
      )}

      {/* Action buttons */}
      {mode === 'text' && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleEncode}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Encode
          </button>
          <button
            onClick={handleDecode}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Decode
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="px-3 py-2 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Output area */}
      {output && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Output</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatBytes(outputBytes)}
              </span>
              <CopyButton text={output} />
            </div>
          </div>
          <textarea
            value={output}
            readOnly
            className="w-full h-48 p-3 rounded-md border border-border bg-transparent font-mono text-sm resize-y focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
