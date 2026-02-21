import { useState, useCallback } from 'react';
import CopyButton from '@/components/shared/CopyButton';

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptText(text: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(text)
  );
  const combined = new Uint8Array(salt.length + iv.length + new Uint8Array(encrypted).length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptText(encoded: string, password: string): Promise<string> {
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

type Mode = 'encrypt' | 'decrypt';

export default function TextEncryptDecrypt() {
  const [mode, setMode] = useState<Mode>('encrypt');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleProcess = useCallback(async () => {
    setError('');
    setOutput('');

    if (!password) {
      setError('Please enter a password.');
      return;
    }

    if (!input) {
      setError(`Please enter text to ${mode}.`);
      return;
    }

    setProcessing(true);

    try {
      if (mode === 'encrypt') {
        const result = await encryptText(input, password);
        setOutput(result);
      } else {
        const result = await decryptText(input, password);
        setOutput(result);
      }
    } catch {
      if (mode === 'decrypt') {
        setError('Decryption failed. Check that the password is correct and the ciphertext is valid.');
      } else {
        setError('Encryption failed. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  }, [mode, password, input]);

  const handleModeSwitch = useCallback(
    (newMode: Mode) => {
      if (newMode !== mode) {
        setMode(newMode);
        setInput('');
        setOutput('');
        setError('');
      }
    },
    [mode]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Text Encrypt / Decrypt</h1>
        <p className="mt-2 text-muted-foreground">
          Encrypt and decrypt text using AES-256-GCM — entirely in your browser via the Web Crypto
          API. Your password and plaintext never leave your device.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden w-fit">
        <button
          onClick={() => handleModeSwitch('encrypt')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'encrypt'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent text-muted-foreground'
          }`}
        >
          Encrypt
        </button>
        <button
          onClick={() => handleModeSwitch('decrypt')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'decrypt'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent text-muted-foreground'
          }`}
        >
          Decrypt
        </button>
      </div>

      {/* Password Input */}
      <div className="rounded-lg border border-border p-4 space-y-2">
        <label htmlFor="password" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter encryption password..."
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm pr-20"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs rounded border border-border hover:bg-accent transition-colors text-muted-foreground"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {/* Input Textarea */}
      <div className="rounded-lg border border-border p-4 space-y-2">
        <label htmlFor="input-text" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {mode === 'encrypt' ? 'Plaintext' : 'Encrypted Text (Base64)'}
        </label>
        <textarea
          id="input-text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === 'encrypt'
              ? 'Enter text to encrypt...'
              : 'Paste Base64-encoded ciphertext...'
          }
          rows={6}
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono resize-y"
        />
      </div>

      {/* Action Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleProcess}
          disabled={processing}
          className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {processing
            ? mode === 'encrypt'
              ? 'Encrypting...'
              : 'Decrypting...'
            : mode === 'encrypt'
              ? 'Encrypt'
              : 'Decrypt'}
        </button>
        <span className="text-xs text-muted-foreground">
          AES-256-GCM &bull; PBKDF2 (100k iterations) &bull; Random salt &amp; IV
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Output Textarea */}
      {output && (
        <div className="rounded-lg border border-border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {mode === 'encrypt' ? 'Encrypted Output (Base64)' : 'Decrypted Plaintext'}
            </label>
            <CopyButton text={output} />
          </div>
          <textarea
            readOnly
            value={output}
            rows={6}
            className="w-full rounded-md border border-border bg-accent/30 px-3 py-2 text-sm font-mono resize-y"
          />
        </div>
      )}
    </div>
  );
}
