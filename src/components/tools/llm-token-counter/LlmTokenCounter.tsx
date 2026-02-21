import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { encode, decode } from 'gpt-tokenizer';
import CopyButton from '@/components/shared/CopyButton';

interface ModelInfo {
  label: string;
  costPerMillionTokens: number;
  contextWindow: number;
}

const MODELS: Record<string, ModelInfo> = {
  'gpt-4o': { label: 'GPT-4o', costPerMillionTokens: 2.5, contextWindow: 128_000 },
  'gpt-4': { label: 'GPT-4', costPerMillionTokens: 30, contextWindow: 8_000 },
  'gpt-3.5-turbo': { label: 'GPT-3.5-Turbo', costPerMillionTokens: 0.5, contextWindow: 16_000 },
  'claude-sonnet': { label: 'Claude Sonnet', costPerMillionTokens: 3, contextWindow: 200_000 },
};

const SAMPLE_TEXT = `Large language models (LLMs) are a type of artificial intelligence that can understand and generate human-like text. They are trained on massive datasets of text from the internet, books, and other sources. These models use a transformer architecture with attention mechanisms that allow them to capture long-range dependencies in text.

Tokenization is the process of breaking text into smaller units called tokens. A token can be a word, part of a word, or even a single character. For example, the word "tokenization" might be split into "token", "ization". Understanding how text is tokenized is crucial for working with LLMs because:

1. API costs are calculated per token, not per word or character
2. Each model has a maximum context window measured in tokens
3. The way text is tokenized affects how the model interprets and generates responses

Different models use different tokenization schemes. GPT-4 and GPT-4o use the cl100k_base tokenizer, which has a vocabulary of about 100,000 tokens. This tokenizer is efficient at handling common English words, code, and multilingual text.`;

export default function LlmTokenCounter() {
  const [text, setText] = useState('');
  const [model, setModel] = useState('gpt-4o');
  const [tokenCount, setTokenCount] = useState(0);
  const [tokens, setTokens] = useState<number[]>([]);
  const [counting, setCounting] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const modelInfo = MODELS[model];

  // Debounced token counting
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!text) {
      setTokenCount(0);
      setTokens([]);
      setCounting(false);
      return;
    }

    setCounting(true);
    debounceRef.current = setTimeout(() => {
      try {
        const encoded = encode(text);
        setTokens(encoded);
        setTokenCount(encoded.length);
      } catch {
        setTokenCount(0);
        setTokens([]);
      }
      setCounting(false);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [text]);

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lineCount = text ? text.split('\n').length : 0;

  const estimatedCost = (tokenCount / 1_000_000) * modelInfo.costPerMillionTokens;
  const contextUsage = tokenCount / modelInfo.contextWindow;
  const contextPercent = Math.min(contextUsage * 100, 100);

  const handleLoadSample = useCallback(() => {
    setText(SAMPLE_TEXT);
  }, []);

  const handleClear = useCallback(() => {
    setText('');
  }, []);

  // Token visualization: map token IDs back to text segments
  const tokenSegments = useMemo(() => {
    if (!showVisualization || text.length > 5000 || tokens.length === 0) return null;
    try {
      return tokens.map((tokenId) => decode([tokenId]));
    } catch {
      return null;
    }
  }, [showVisualization, text, tokens]);

  const TOKEN_COLORS = [
    'bg-blue-200 dark:bg-blue-800/60',
    'bg-green-200 dark:bg-green-800/60',
    'bg-yellow-200 dark:bg-yellow-800/60',
    'bg-pink-200 dark:bg-pink-800/60',
    'bg-purple-200 dark:bg-purple-800/60',
    'bg-orange-200 dark:bg-orange-800/60',
    'bg-teal-200 dark:bg-teal-800/60',
    'bg-red-200 dark:bg-red-800/60',
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">LLM Token Counter</h1>
        <p className="mt-2 text-muted-foreground">
          Count tokens using the cl100k_base tokenizer. See real-time costs and context window
          usage — all processing happens entirely in your browser.
        </p>
      </div>

      {/* Model Selector + Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="model-select" className="text-sm font-medium text-muted-foreground">
          Model:
        </label>
        <select
          id="model-select"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="rounded-md border border-border bg-transparent px-3 py-1.5 text-sm"
        >
          {Object.entries(MODELS).map(([key, m]) => (
            <option key={key} value={key}>
              {m.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleLoadSample}
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
        <CopyButton text={text} />
      </div>

      {/* Text Input */}
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type your text here to count tokens..."
          className="w-full min-h-[200px] rounded-lg border border-border bg-transparent px-4 py-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
          spellCheck={false}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Token Count */}
        <div className="rounded-lg border border-border p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Tokens
          </p>
          <p className="text-3xl font-bold tabular-nums">
            {counting ? (
              <span className="text-muted-foreground text-lg">Counting...</span>
            ) : (
              tokenCount.toLocaleString()
            )}
          </p>
        </div>

        {/* Character Count */}
        <div className="rounded-lg border border-border p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Characters
          </p>
          <p className="text-3xl font-bold tabular-nums">{charCount.toLocaleString()}</p>
        </div>

        {/* Word Count */}
        <div className="rounded-lg border border-border p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Words
          </p>
          <p className="text-3xl font-bold tabular-nums">{wordCount.toLocaleString()}</p>
        </div>

        {/* Line Count */}
        <div className="rounded-lg border border-border p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Lines
          </p>
          <p className="text-3xl font-bold tabular-nums">{lineCount.toLocaleString()}</p>
        </div>

        {/* Estimated Cost */}
        <div className="rounded-lg border border-border p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Est. Cost (Input)
          </p>
          <p className="text-3xl font-bold tabular-nums">
            ${estimatedCost < 0.01 && estimatedCost > 0 ? estimatedCost.toFixed(6) : estimatedCost.toFixed(4)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ${modelInfo.costPerMillionTokens} / 1M tokens
          </p>
        </div>
      </div>

      {/* Context Window Usage */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Context Window Usage ({modelInfo.label})
          </h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {tokenCount.toLocaleString()} / {modelInfo.contextWindow.toLocaleString()} tokens
          </span>
        </div>
        <div className="w-full h-4 rounded-full bg-accent overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              contextPercent > 90
                ? 'bg-red-500'
                : contextPercent > 70
                  ? 'bg-yellow-500'
                  : 'bg-primary'
            }`}
            style={{ width: `${contextPercent}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {contextPercent.toFixed(2)}% of {(modelInfo.contextWindow / 1000).toFixed(0)}K context
          window used
        </p>
      </div>

      {/* Token Visualization */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Token Visualization
          </h2>
          <button
            onClick={() => setShowVisualization((v) => !v)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              showVisualization
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'border-border hover:bg-accent'
            }`}
          >
            {showVisualization ? 'Hide Tokens' : 'Show Tokens'}
          </button>
        </div>

        {showVisualization && text.length > 5000 && (
          <p className="text-sm text-muted-foreground">
            Token visualization is disabled for texts over 5,000 characters for performance reasons.
          </p>
        )}

        {showVisualization && text.length <= 5000 && tokenSegments && tokenSegments.length > 0 && (
          <div className="rounded-md border border-border bg-accent/30 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all">
            {tokenSegments.map((segment, i) => (
              <span
                key={i}
                className={`${TOKEN_COLORS[i % TOKEN_COLORS.length]} rounded-sm px-[1px] border border-border/30`}
                title={`Token ${i + 1}: "${segment}" (ID: ${tokens[i]})`}
              >
                {segment}
              </span>
            ))}
          </div>
        )}

        {showVisualization && text.length <= 5000 && (!tokenSegments || tokenSegments.length === 0) && text.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Type or paste text above to see token boundaries.
          </p>
        )}
      </div>
    </div>
  );
}
