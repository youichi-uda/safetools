import { useState, useCallback } from 'react';
import * as TOML from 'smol-toml';
import CodeEditor from '@/components/shared/CodeEditor';
import CopyButton from '@/components/shared/CopyButton';
import { json } from '@codemirror/lang-json';

type Direction = 'toml-to-json' | 'json-to-toml';

const SAMPLE_TOML = `[package]
name = "my-project"
version = "0.1.0"
edition = "2021"
authors = ["Developer <dev@example.com>"]

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }

[dev-dependencies]
criterion = "0.5"`;

export default function TomlJsonConverter() {
  const [tomlValue, setTomlValue] = useState('');
  const [jsonValue, setJsonValue] = useState('');
  const [direction, setDirection] = useState<Direction>('toml-to-json');
  const [error, setError] = useState('');

  const handleConvert = useCallback(() => {
    setError('');
    try {
      if (direction === 'toml-to-json') {
        if (!tomlValue.trim()) {
          setError('Please enter TOML data to convert.');
          return;
        }
        const parsed = TOML.parse(tomlValue);
        const result = JSON.stringify(parsed, null, 2);
        setJsonValue(result);
      } else {
        if (!jsonValue.trim()) {
          setError('Please enter JSON data to convert.');
          return;
        }
        const parsed = JSON.parse(jsonValue);
        const result = TOML.stringify(parsed);
        setTomlValue(result);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed.');
    }
  }, [direction, tomlValue, jsonValue]);

  const handleLoadSample = useCallback(() => {
    setError('');
    if (direction === 'toml-to-json') {
      setTomlValue(SAMPLE_TOML);
      setJsonValue('');
    } else {
      const parsed = TOML.parse(SAMPLE_TOML);
      setJsonValue(JSON.stringify(parsed, null, 2));
      setTomlValue('');
    }
  }, [direction]);

  const handleClear = useCallback(() => {
    setTomlValue('');
    setJsonValue('');
    setError('');
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">TOML &harr; JSON Converter</h1>
        <p className="mt-2 text-muted-foreground">
          Convert between TOML and JSON formats. Essential for Rust (Cargo.toml), Python (pyproject.toml),
          and other modern tool configurations. All processing happens in your browser.
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-lg border border-border p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Direction Toggle */}
          <button
            onClick={() => setDirection(direction === 'toml-to-json' ? 'json-to-toml' : 'toml-to-json')}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {direction === 'toml-to-json' ? 'TOML \u2192 JSON' : 'JSON \u2192 TOML'}
          </button>

          <button
            onClick={handleConvert}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
          >
            Convert
          </button>
          <button
            onClick={handleLoadSample}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
          >
            Load Sample Data
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors text-destructive"
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TOML Panel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              TOML
            </h2>
            <CopyButton text={tomlValue} />
          </div>
          <CodeEditor
            value={tomlValue}
            onChange={setTomlValue}
            placeholder="Paste your TOML data here..."
            minHeight="350px"
          />
        </div>

        {/* JSON Panel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              JSON
            </h2>
            <CopyButton text={jsonValue} />
          </div>
          <CodeEditor
            value={jsonValue}
            onChange={setJsonValue}
            language={json()}
            placeholder="Paste your JSON data here..."
            minHeight="350px"
          />
        </div>
      </div>
    </div>
  );
}
