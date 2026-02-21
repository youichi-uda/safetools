import { useState, useCallback } from 'react';
import CopyButton from '@/components/shared/CopyButton';

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) {
    base64 += '='.repeat(4 - pad);
  }
  return atob(base64);
}

function tryParseJwt(token: string) {
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return { error: 'Invalid JWT: must have 3 dot-separated parts' };
  }

  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const signature = parts[2];
    return { header, payload, signature, parts };
  } catch {
    return { error: 'Invalid JWT: unable to decode base64url content' };
  }
}

function formatExpiration(exp: number) {
  const now = Math.floor(Date.now() / 1000);
  const diff = exp - now;
  const expDate = new Date(exp * 1000);

  if (diff <= 0) {
    const elapsed = Math.abs(diff);
    const days = Math.floor(elapsed / 86400);
    const hours = Math.floor((elapsed % 86400) / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    let ago = '';
    if (days > 0) ago += `${days}d `;
    if (hours > 0) ago += `${hours}h `;
    ago += `${minutes}m ago`;
    return { expired: true, text: `Expired ${ago}`, date: expDate.toUTCString() };
  } else {
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    let remaining = '';
    if (days > 0) remaining += `${days}d `;
    if (hours > 0) remaining += `${hours}h `;
    remaining += `${minutes}m remaining`;
    return { expired: false, text: `Valid — ${remaining}`, date: expDate.toUTCString() };
  }
}

function formatTimestamp(ts: number) {
  return new Date(ts * 1000).toUTCString();
}

const SAMPLE_JWT = (() => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: '1234567890',
    name: 'Jane Developer',
    iat: now,
    exp: now + 3600,
    role: 'admin',
  };
  const encode = (obj: object) => {
    const json = JSON.stringify(obj);
    return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  return `${encode(header)}.${encode(payload)}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
})();

export default function JwtDecoder() {
  const [input, setInput] = useState('');

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSample = useCallback(() => {
    setInput(SAMPLE_JWT);
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
  }, []);

  const result = input.trim() ? tryParseJwt(input) : null;

  const headerJson = result && !result.error ? JSON.stringify(result.header, null, 2) : '';
  const payloadJson = result && !result.error ? JSON.stringify(result.payload, null, 2) : '';

  const expInfo =
    result && !result.error && typeof result.payload?.exp === 'number'
      ? formatExpiration(result.payload.exp)
      : null;

  const iatDate =
    result && !result.error && typeof result.payload?.iat === 'number'
      ? formatTimestamp(result.payload.iat)
      : null;

  // Color-coded JWT rendering
  const renderColoredJwt = () => {
    if (!input.trim()) return null;
    const parts = input.trim().split('.');
    if (parts.length !== 3) return null;
    return (
      <div className="font-mono text-sm break-all">
        <span className="text-blue-500">{parts[0]}</span>
        <span className="text-muted-foreground">.</span>
        <span className="text-purple-500">{parts[1]}</span>
        <span className="text-muted-foreground">.</span>
        <span className="text-orange-500">{parts[2]}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">JWT Decoder</h1>
        <p className="text-muted-foreground text-sm mb-4">
          Decode and inspect JSON Web Tokens. All processing happens in your browser.
        </p>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Encoded JWT</label>
          <div className="flex gap-2">
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
        </div>
        <textarea
          value={input}
          onChange={handleChange}
          placeholder="Paste your JWT token here..."
          rows={5}
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {input.trim() && renderColoredJwt()}
      </div>

      {/* Error */}
      {result && result.error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm font-medium">
          {result.error}
        </div>
      )}

      {/* Decoded sections */}
      {result && !result.error && (
        <div className="space-y-4">
          {/* Expiration status */}
          {expInfo && (
            <div
              className={`rounded-md px-4 py-3 text-sm font-medium ${
                expInfo.expired ? 'bg-destructive/10 text-destructive' : 'bg-safe/10 text-safe'
              }`}
            >
              <div>{expInfo.text}</div>
              <div className="opacity-75 text-xs mt-1">Expires: {expInfo.date}</div>
            </div>
          )}

          {/* Issued at */}
          {iatDate && (
            <div className="text-sm text-muted-foreground">
              Issued at: <span className="font-mono">{iatDate}</span>
            </div>
          )}

          {/* Header */}
          <div className="rounded-md border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-blue-500/10">
              <span className="text-sm font-semibold text-blue-500">Header</span>
              <CopyButton text={headerJson} />
            </div>
            <pre className="px-4 py-3 text-sm font-mono overflow-x-auto">{headerJson}</pre>
          </div>

          {/* Payload */}
          <div className="rounded-md border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-purple-500/10">
              <span className="text-sm font-semibold text-purple-500">Payload</span>
              <CopyButton text={payloadJson} />
            </div>
            <pre className="px-4 py-3 text-sm font-mono overflow-x-auto">{payloadJson}</pre>
          </div>

          {/* Signature */}
          <div className="rounded-md border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-orange-500/10">
              <span className="text-sm font-semibold text-orange-500">Signature</span>
              <CopyButton text={result.signature} />
            </div>
            <pre className="px-4 py-3 text-sm font-mono overflow-x-auto break-all">
              {result.signature}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
