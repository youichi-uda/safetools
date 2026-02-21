import { useState, useCallback } from 'react';
import CopyButton from '@/components/shared/CopyButton';

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';

function generatePassword(
  length: number,
  options: {
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
    exclude: string;
  }
): string {
  let charset = '';
  if (options.uppercase) charset += UPPERCASE;
  if (options.lowercase) charset += LOWERCASE;
  if (options.numbers) charset += NUMBERS;
  if (options.symbols) charset += SYMBOLS;

  if (options.exclude) {
    const excludeSet = new Set(options.exclude.split(''));
    charset = charset
      .split('')
      .filter((c) => !excludeSet.has(c))
      .join('');
  }

  if (charset.length === 0) return '';

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (val) => charset[val % charset.length]).join('');
}

type Strength = 'weak' | 'fair' | 'good' | 'strong' | 'very strong';

function calculateStrength(
  length: number,
  options: { uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean }
): { label: Strength; score: number } {
  let score = 0;

  // Length score
  if (length >= 20) score += 3;
  else if (length >= 12) score += 2;
  else if (length >= 8) score += 1;

  // Charset variety score
  if (options.uppercase) score += 1;
  if (options.lowercase) score += 1;
  if (options.numbers) score += 1;
  if (options.symbols) score += 1;

  // Map to label (max score = 7)
  let label: Strength;
  if (score <= 2) label = 'weak';
  else if (score <= 3) label = 'fair';
  else if (score <= 4) label = 'good';
  else if (score <= 5) label = 'strong';
  else label = 'very strong';

  // Normalize to 0-100 for the bar
  const percent = Math.min(100, Math.round((score / 7) * 100));
  return { label, score: percent };
}

function getStrengthColor(label: Strength): string {
  switch (label) {
    case 'weak':
      return 'bg-red-500';
    case 'fair':
      return 'bg-orange-500';
    case 'good':
      return 'bg-yellow-500';
    case 'strong':
      return 'bg-lime-500';
    case 'very strong':
      return 'bg-green-500';
  }
}

function getStrengthTextColor(label: Strength): string {
  switch (label) {
    case 'weak':
      return 'text-red-500';
    case 'fair':
      return 'text-orange-500';
    case 'good':
      return 'text-yellow-500';
    case 'strong':
      return 'text-lime-500';
    case 'very strong':
      return 'text-green-500';
  }
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [exclude, setExclude] = useState('');
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkPasswords, setBulkPasswords] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const charOptions = { uppercase, lowercase, numbers, symbols };

  const [currentPassword, setCurrentPassword] = useState<string>(() =>
    generatePassword(16, { ...charOptions, exclude: '' })
  );

  const strength = calculateStrength(length, charOptions);

  const handleGenerate = useCallback(() => {
    const pw = generatePassword(length, { ...charOptions, exclude });
    setCurrentPassword(pw);
  }, [length, uppercase, lowercase, numbers, symbols, exclude]);

  const handleGenerateBulk = useCallback(() => {
    const passwords = Array.from({ length: bulkCount }, () =>
      generatePassword(length, { ...charOptions, exclude })
    );
    setBulkPasswords(passwords);
  }, [bulkCount, length, uppercase, lowercase, numbers, symbols, exclude]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API not available
    }
  }, []);

  const handleDownloadBulk = useCallback(() => {
    const content = bulkPasswords.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'passwords.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [bulkPasswords]);

  const noCharsetSelected = !uppercase && !lowercase && !numbers && !symbols;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="mt-2 text-muted-foreground">
          Generate cryptographically secure passwords using the Web Crypto API. All generation
          happens entirely in your browser — your data never leaves your device.
        </p>
      </div>

      {/* Main Password Display */}
      <div className="rounded-lg border border-border p-6 text-center space-y-4">
        <button
          onClick={() => copyToClipboard(currentPassword)}
          className="w-full group cursor-pointer rounded-md p-4 transition-colors hover:bg-accent"
          title="Click to copy"
        >
          <p className="font-mono text-2xl sm:text-3xl md:text-4xl break-all select-all tracking-wide">
            {noCharsetSelected ? '(select at least one character type)' : currentPassword}
          </p>
          <p
            className={`mt-2 text-sm transition-colors ${
              copied ? 'text-safe font-medium' : 'text-muted-foreground'
            }`}
          >
            {copied ? 'Copied to clipboard!' : 'Click to copy'}
          </p>
        </button>

        {/* Strength Meter */}
        {!noCharsetSelected && (
          <div className="space-y-1">
            <div className="w-full h-2 rounded-full bg-accent overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getStrengthColor(strength.label)}`}
                style={{ width: `${strength.score}%` }}
              />
            </div>
            <p className={`text-sm font-medium capitalize ${getStrengthTextColor(strength.label)}`}>
              {strength.label}
            </p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={noCharsetSelected}
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate Password
        </button>
      </div>

      {/* Options */}
      <div className="rounded-lg border border-border p-4 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Options
        </h2>

        {/* Length Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="pw-length" className="text-sm text-muted-foreground">
              Length
            </label>
            <span className="text-sm font-mono font-medium">{length}</span>
          </div>
          <input
            id="pw-length"
            type="range"
            min={8}
            max={128}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>8</span>
            <span>128</span>
          </div>
        </div>

        {/* Character Type Toggles */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setUppercase((v) => !v)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              uppercase
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'border-border hover:bg-accent'
            }`}
          >
            Uppercase (A-Z)
          </button>
          <button
            onClick={() => setLowercase((v) => !v)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              lowercase
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'border-border hover:bg-accent'
            }`}
          >
            Lowercase (a-z)
          </button>
          <button
            onClick={() => setNumbers((v) => !v)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              numbers
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'border-border hover:bg-accent'
            }`}
          >
            Numbers (0-9)
          </button>
          <button
            onClick={() => setSymbols((v) => !v)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              symbols
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'border-border hover:bg-accent'
            }`}
          >
            Symbols (!@#$...)
          </button>
        </div>

        {/* Exclude Characters */}
        <div className="space-y-1">
          <label htmlFor="exclude-chars" className="text-sm text-muted-foreground">
            Exclude Characters
          </label>
          <input
            id="exclude-chars"
            type="text"
            value={exclude}
            onChange={(e) => setExclude(e.target.value)}
            placeholder="e.g. 0OIl1"
            className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm font-mono"
          />
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
            max={10}
            value={bulkCount}
            onChange={(e) => {
              const val = Math.min(10, Math.max(1, Number(e.target.value) || 1));
              setBulkCount(val);
            }}
            className="w-24 rounded-md border border-border bg-transparent px-3 py-1.5 text-sm"
          />
          <button
            onClick={handleGenerateBulk}
            disabled={noCharsetSelected}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Bulk
          </button>
        </div>

        {bulkPasswords.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {bulkPasswords.length} password{bulkPasswords.length !== 1 ? 's' : ''} generated
              </span>
              <div className="flex items-center gap-2">
                <CopyButton text={bulkPasswords.join('\n')} />
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
                {bulkPasswords.join('\n')}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
