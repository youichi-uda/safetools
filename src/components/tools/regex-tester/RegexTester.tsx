import { useState, useCallback, useMemo } from 'react';
import CopyButton from '@/components/shared/CopyButton';

interface MatchResult {
  value: string;
  index: number;
  groups: Record<string, string> | undefined;
  captures: string[];
}

const SAMPLE_PATTERN = '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}';
const SAMPLE_FLAGS = 'gi';
const SAMPLE_TEST_STRING = `Contact us at support@safetools.dev or sales@example.com.
Invalid emails: @missing.com, user@, plaintext
Another valid one: hello.world+test@sub.domain.org`;

const FLAG_OPTIONS = [
  { flag: 'g', label: 'g', description: 'Global' },
  { flag: 'i', label: 'i', description: 'Case Insensitive' },
  { flag: 'm', label: 'm', description: 'Multiline' },
  { flag: 's', label: 's', description: 'DotAll' },
  { flag: 'u', label: 'u', description: 'Unicode' },
] as const;

export default function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('');
  const [replacePattern, setReplacePattern] = useState('');

  const toggleFlag = useCallback((flag: string) => {
    setFlags((prev) =>
      prev.includes(flag) ? prev.replace(flag, '') : prev + flag
    );
  }, []);

  const regexString = useMemo(() => `/${pattern}/${flags}`, [pattern, flags]);

  const { regex, error } = useMemo(() => {
    if (!pattern) return { regex: null, error: null };
    try {
      const r = new RegExp(pattern, flags);
      return { regex: r, error: null };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid regular expression';
      return { regex: null, error: msg };
    }
  }, [pattern, flags]);

  const matches: MatchResult[] = useMemo(() => {
    if (!regex || !testString) return [];
    const results: MatchResult[] = [];
    const isGlobal = regex.flags.includes('g');
    const maxIterations = 10000;
    let count = 0;

    if (isGlobal) {
      let match: RegExpExecArray | null;
      regex.lastIndex = 0;
      while ((match = regex.exec(testString)) !== null) {
        results.push({
          value: match[0],
          index: match.index,
          groups: match.groups ? { ...match.groups } : undefined,
          captures: match.slice(1),
        });
        if (match[0].length === 0) {
          regex.lastIndex++;
        }
        count++;
        if (count >= maxIterations) break;
      }
    } else {
      const match = regex.exec(testString);
      if (match) {
        results.push({
          value: match[0],
          index: match.index,
          groups: match.groups ? { ...match.groups } : undefined,
          captures: match.slice(1),
        });
      }
    }

    return results;
  }, [regex, testString]);

  const highlightedText = useMemo(() => {
    if (!regex || !testString || matches.length === 0) return null;

    const parts: { text: string; isMatch: boolean }[] = [];
    let lastIndex = 0;

    const sortedMatches = [...matches].sort((a, b) => a.index - b.index);

    for (const m of sortedMatches) {
      if (m.index > lastIndex) {
        parts.push({ text: testString.slice(lastIndex, m.index), isMatch: false });
      }
      parts.push({ text: m.value, isMatch: true });
      lastIndex = m.index + m.value.length;
    }

    if (lastIndex < testString.length) {
      parts.push({ text: testString.slice(lastIndex), isMatch: false });
    }

    return parts;
  }, [regex, testString, matches]);

  const replacedResult = useMemo(() => {
    if (!regex || !testString) return '';
    try {
      return testString.replace(regex, replacePattern);
    } catch {
      return '';
    }
  }, [regex, testString, replacePattern]);

  const handleSample = useCallback(() => {
    setPattern(SAMPLE_PATTERN);
    setFlags(SAMPLE_FLAGS);
    setTestString(SAMPLE_TEST_STRING);
    setReplacePattern('[$&]');
  }, []);

  const handleClear = useCallback(() => {
    setPattern('');
    setFlags('g');
    setTestString('');
    setReplacePattern('');
  }, []);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSample}
          className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
        >
          Load Sample
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
        >
          Clear
        </button>
        <CopyButton text={regexString} label="Copy Regex" />
      </div>

      {/* Regex Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-muted-foreground">
          Regular Expression
        </label>
        <div className="flex items-center gap-0">
          <span className="px-2 py-2 text-lg font-mono text-muted-foreground bg-accent/50 border border-r-0 border-border rounded-l-md select-none">
            /
          </span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Enter regex pattern..."
            className="flex-1 px-3 py-2 font-mono text-sm border-y border-border bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
            spellCheck={false}
          />
          <span className="px-2 py-2 text-lg font-mono text-muted-foreground bg-accent/50 border border-l-0 border-border select-none">
            /
          </span>
          <span className="px-2 py-2 font-mono text-sm text-muted-foreground bg-accent/50 border border-l-0 border-border rounded-r-md min-w-[3ch]">
            {flags}
          </span>
        </div>

        {/* Flag Toggles */}
        <div className="flex flex-wrap gap-2">
          {FLAG_OPTIONS.map(({ flag, description }) => (
            <button
              key={flag}
              onClick={() => toggleFlag(flag)}
              title={description}
              className={`px-2.5 py-1 text-xs font-mono rounded-full border transition-colors ${
                flags.includes(flag)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              {flag}
              <span className="ml-1 font-sans text-[10px] opacity-70">
                {description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm font-mono">
          {error}
        </div>
      )}

      {/* Test String */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted-foreground">
          Test String
        </label>
        <textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="Enter test string..."
          rows={6}
          className="w-full px-3 py-2 font-mono text-sm border border-border rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-primary resize-y"
          spellCheck={false}
        />
      </div>

      {/* Highlighted Matches */}
      {highlightedText && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-muted-foreground">
              Highlighted Matches
            </label>
            <span className="text-sm bg-safe/10 text-safe px-2 py-0.5 rounded-md font-medium">
              {matches.length} match{matches.length !== 1 ? 'es' : ''}
            </span>
          </div>
          <div className="px-4 py-3 font-mono text-sm border border-border rounded-md whitespace-pre-wrap break-all">
            {highlightedText.map((part, i) =>
              part.isMatch ? (
                <mark
                  key={i}
                  className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5"
                >
                  {part.text}
                </mark>
              ) : (
                <span key={i}>{part.text}</span>
              )
            )}
          </div>
        </div>
      )}

      {/* Match Details */}
      {matches.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground">
            Match Details
          </label>
          <div className="border border-border rounded-md divide-y divide-border max-h-64 overflow-y-auto">
            {matches.map((m, i) => (
              <div key={i} className="px-4 py-2 text-sm font-mono">
                <div className="flex items-baseline gap-3">
                  <span className="text-muted-foreground text-xs">
                    #{i + 1}
                  </span>
                  <span className="font-semibold break-all">
                    &quot;{m.value}&quot;
                  </span>
                  <span className="text-muted-foreground text-xs ml-auto shrink-0">
                    index {m.index}
                  </span>
                </div>
                {m.captures.length > 0 && (
                  <div className="mt-1 ml-6 space-y-0.5">
                    {m.captures.map((cap, j) => (
                      <div key={j} className="text-xs text-muted-foreground">
                        Group {j + 1}:{' '}
                        <span className="text-foreground">
                          &quot;{cap ?? 'undefined'}&quot;
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {m.groups && Object.keys(m.groups).length > 0 && (
                  <div className="mt-1 ml-6 space-y-0.5">
                    {Object.entries(m.groups).map(([name, val]) => (
                      <div key={name} className="text-xs text-muted-foreground">
                        {name}:{' '}
                        <span className="text-foreground">
                          &quot;{val}&quot;
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Replace */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted-foreground">
          Replace Pattern
        </label>
        <input
          type="text"
          value={replacePattern}
          onChange={(e) => setReplacePattern(e.target.value)}
          placeholder="Replace with... (supports $1, $&, etc.)"
          className="w-full px-3 py-2 font-mono text-sm border border-border rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
          spellCheck={false}
        />
      </div>

      {replacePattern && regex && testString && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-muted-foreground">
              Replace Result
            </label>
            <CopyButton text={replacedResult} label="Copy Result" />
          </div>
          <div className="px-4 py-3 font-mono text-sm border border-border rounded-md whitespace-pre-wrap break-all bg-accent/30">
            {replacedResult}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!pattern && !testString && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Enter a regex pattern and test string to get started, or click{' '}
          <button
            onClick={handleSample}
            className="underline hover:text-foreground transition-colors"
          >
            Load Sample
          </button>{' '}
          to try an example.
        </div>
      )}
    </div>
  );
}
