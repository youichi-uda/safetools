import { useState, useCallback } from 'react';
import CopyButton from '@/components/shared/CopyButton';

// Lightweight MD5 implementation (Web Crypto doesn't support MD5)
function md5(input: Uint8Array): string {
  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
    0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
    0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
    0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
    0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
    0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ];
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23,
    4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
    6, 10, 15, 21,
  ];

  const bitLen = input.length * 8;
  const padLen = input.length % 64 < 56 ? 56 - (input.length % 64) : 120 - (input.length % 64);
  const padded = new Uint8Array(input.length + padLen + 8);
  padded.set(input);
  padded[input.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, bitLen >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor(bitLen / 0x100000000), true);

  let a0 = 0x67452301 >>> 0;
  let b0 = 0xefcdab89 >>> 0;
  let c0 = 0x98badcfe >>> 0;
  let d0 = 0x10325476 >>> 0;

  for (let i = 0; i < padded.length; i += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(i + j * 4, true);
    }

    let A = a0, B = b0, C = c0, D = d0;

    for (let j = 0; j < 64; j++) {
      let F: number, g: number;
      if (j < 16) {
        F = (B & C) | (~B & D);
        g = j;
      } else if (j < 32) {
        F = (D & B) | (~D & C);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        F = B ^ C ^ D;
        g = (3 * j + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * j) % 16;
      }
      F = (F + A + K[j] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + ((F << S[j]) | (F >>> (32 - S[j])))) >>> 0;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const result = new DataView(new ArrayBuffer(16));
  result.setUint32(0, a0, true);
  result.setUint32(4, b0, true);
  result.setUint32(8, c0, true);
  result.setUint32(12, d0, true);
  return Array.from(new Uint8Array(result.buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha(algorithm: string, data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface HashResult {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
}

const SAMPLE_TEXT = 'Hello, World! This is a sample text for hashing.';

export default function HashGenerator() {
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState<Uint8Array | null>(null);
  const [hashes, setHashes] = useState<HashResult | null>(null);
  const [uppercase, setUppercase] = useState(false);
  const [isHashing, setIsHashing] = useState(false);
  const [inputSize, setInputSize] = useState(0);

  const updateInputSize = useCallback((data: Uint8Array | string) => {
    if (typeof data === 'string') {
      setInputSize(new TextEncoder().encode(data).length);
    } else {
      setInputSize(data.length);
    }
  }, []);

  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);
      updateInputSize(value);
      setHashes(null);
    },
    [updateInputSize]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        setFileData(data);
        updateInputSize(data);
        setHashes(null);
      };
      reader.readAsArrayBuffer(file);
    },
    [updateInputSize]
  );

  const generateHashes = useCallback(async () => {
    const data =
      inputMode === 'text' ? new TextEncoder().encode(text) : fileData;
    if (!data || data.length === 0) return;

    setIsHashing(true);
    try {
      const [md5Hash, sha1Hash, sha256Hash, sha512Hash] = await Promise.all([
        Promise.resolve(md5(data)),
        sha('SHA-1', data),
        sha('SHA-256', data),
        sha('SHA-512', data),
      ]);
      setHashes({
        md5: md5Hash,
        sha1: sha1Hash,
        sha256: sha256Hash,
        sha512: sha512Hash,
      });
    } finally {
      setIsHashing(false);
    }
  }, [inputMode, text, fileData]);

  const handleClear = useCallback(() => {
    setText('');
    setFileName('');
    setFileData(null);
    setHashes(null);
    setInputSize(0);
  }, []);

  const handleSample = useCallback(() => {
    setText(SAMPLE_TEXT);
    updateInputSize(SAMPLE_TEXT);
    setHashes(null);
    setInputMode('text');
  }, [updateInputSize]);

  const formatHash = useCallback(
    (hash: string) => (uppercase ? hash.toUpperCase() : hash),
    [uppercase]
  );

  const hasInput =
    inputMode === 'text' ? text.length > 0 : fileData !== null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Hash Generator</h1>
        <p className="text-muted-foreground text-sm mb-4">
          Generate MD5, SHA-1, SHA-256, and SHA-512 hashes. All processing happens in your browser.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setInputMode('text')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            inputMode === 'text'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border hover:bg-accent'
          }`}
        >
          Text Input
        </button>
        <button
          onClick={() => setInputMode('file')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            inputMode === 'file'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border hover:bg-accent'
          }`}
        >
          File Input
        </button>
      </div>

      {/* Input area */}
      {inputMode === 'text' ? (
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Enter text to hash..."
          className="w-full h-40 p-3 rounded-md border border-border bg-transparent text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border file:border-border file:text-sm file:bg-transparent file:hover:bg-accent file:transition-colors file:cursor-pointer"
          />
          {fileName && (
            <p className="text-sm text-muted-foreground">
              Selected: <span className="font-medium">{fileName}</span>
            </p>
          )}
        </div>
      )}

      {/* Input size */}
      {inputSize > 0 && (
        <p className="text-xs text-muted-foreground">
          Input size: <span className="font-mono">{inputSize.toLocaleString()} bytes</span>
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={generateHashes}
          disabled={!hasInput || isHashing}
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isHashing ? 'Hashing...' : 'Generate Hashes'}
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
        <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(e) => setUppercase(e.target.checked)}
            className="rounded"
          />
          Uppercase
        </label>
      </div>

      {/* Hash results */}
      {hashes && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Results</h3>
          {([
            { label: 'MD5', value: hashes.md5 },
            { label: 'SHA-1', value: hashes.sha1 },
            { label: 'SHA-256', value: hashes.sha256 },
            { label: 'SHA-512', value: hashes.sha512 },
          ] as const).map(({ label, value }) => (
            <div
              key={label}
              className="flex items-start gap-3 p-3 rounded-md border border-border"
            >
              <span className="shrink-0 w-16 text-xs font-semibold text-muted-foreground pt-0.5">
                {label}
              </span>
              <code className="flex-1 text-xs font-mono break-all select-all">
                {formatHash(value)}
              </code>
              <CopyButton text={formatHash(value)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
