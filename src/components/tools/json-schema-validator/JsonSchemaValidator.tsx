import { useState, useMemo, useCallback } from 'react';
import CopyButton from '@/components/shared/CopyButton';

const SAMPLE_SCHEMA = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "age", "email"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "roles": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["admin", "editor", "viewer"]
      }
    }
  }
}`;

const SAMPLE_DATA = `{
  "name": "Alice",
  "age": 30,
  "email": "alice@example.com",
  "roles": ["admin", "editor"]
}`;

const SCHEMA_PRESETS: { label: string; schema: string; data: string }[] = [
  {
    label: 'User Profile',
    schema: SAMPLE_SCHEMA,
    data: SAMPLE_DATA,
  },
  {
    label: 'Package.json',
    schema: `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "version"],
  "properties": {
    "name": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "version": { "type": "string", "pattern": "^\\\\d+\\\\.\\\\d+\\\\.\\\\d+$" },
    "description": { "type": "string" },
    "main": { "type": "string" },
    "scripts": { "type": "object", "additionalProperties": { "type": "string" } },
    "dependencies": { "type": "object", "additionalProperties": { "type": "string" } }
  }
}`,
    data: `{
  "name": "my-package",
  "version": "1.0.0",
  "description": "A sample package",
  "main": "index.js",
  "scripts": { "test": "jest" },
  "dependencies": { "lodash": "^4.17.21" }
}`,
  },
  {
    label: 'API Response',
    schema: `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["status", "data"],
  "properties": {
    "status": { "type": "string", "enum": ["success", "error"] },
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "title"],
        "properties": {
          "id": { "type": "integer" },
          "title": { "type": "string" },
          "completed": { "type": "boolean" }
        }
      }
    },
    "meta": {
      "type": "object",
      "properties": {
        "total": { "type": "integer" },
        "page": { "type": "integer" }
      }
    }
  }
}`,
    data: `{
  "status": "success",
  "data": [
    { "id": 1, "title": "Task 1", "completed": true },
    { "id": 2, "title": "Task 2", "completed": false }
  ],
  "meta": { "total": 2, "page": 1 }
}`,
  },
];

interface ValidationError {
  path: string;
  message: string;
  keyword: string;
}

export default function JsonSchemaValidator() {
  const [schemaStr, setSchemaStr] = useState(SAMPLE_SCHEMA);
  const [dataStr, setDataStr] = useState(SAMPLE_DATA);
  const [draft, setDraft] = useState<'draft-07' | '2020-12'>('draft-07');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid' | 'error'>('idle');
  const [parseError, setParseError] = useState<string | null>(null);

  const validate = useCallback(async () => {
    setParseError(null);

    let schema: unknown;
    let data: unknown;

    try {
      schema = JSON.parse(schemaStr);
    } catch (e) {
      setParseError(`Schema JSON error: ${(e as Error).message}`);
      setValidationState('error');
      setErrors([]);
      return;
    }

    try {
      data = JSON.parse(dataStr);
    } catch (e) {
      setParseError(`Data JSON error: ${(e as Error).message}`);
      setValidationState('error');
      setErrors([]);
      return;
    }

    try {
      const Ajv = (await import('ajv')).default;
      const addFormats = (await import('ajv-formats')).default;

      const ajv = new Ajv({ allErrors: true, strict: false });
      addFormats(ajv);

      const validateFn = ajv.compile(schema as object);
      const valid = validateFn(data);

      if (valid) {
        setValidationState('valid');
        setErrors([]);
      } else {
        setValidationState('invalid');
        setErrors(
          (validateFn.errors || []).map((err) => ({
            path: err.instancePath || '/',
            message: err.message || 'Unknown error',
            keyword: err.keyword,
          }))
        );
      }
    } catch (e) {
      setParseError(`Validation error: ${(e as Error).message}`);
      setValidationState('error');
      setErrors([]);
    }
  }, [schemaStr, dataStr, draft]);

  const loadPreset = (preset: typeof SCHEMA_PRESETS[0]) => {
    setSchemaStr(preset.schema);
    setDataStr(preset.data);
    setValidationState('idle');
    setErrors([]);
    setParseError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">JSON Schema Validator</h1>
        <p className="mt-2 text-muted-foreground">
          Validate JSON data against a JSON Schema with detailed error reporting. All processing
          happens in your browser.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {SCHEMA_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => loadPreset(preset)}
              className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm text-muted-foreground">Draft:</label>
          <select
            value={draft}
            onChange={(e) => setDraft(e.target.value as typeof draft)}
            className="rounded-md border border-border bg-transparent px-2 py-1 text-sm"
          >
            <option value="draft-07">Draft 7</option>
            <option value="2020-12">2020-12</option>
          </select>
        </div>
      </div>

      {/* Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            JSON Schema
          </h2>
          <textarea
            value={schemaStr}
            onChange={(e) => { setSchemaStr(e.target.value); setValidationState('idle'); }}
            className="w-full h-72 rounded-lg border border-border bg-transparent px-4 py-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            JSON Data
          </h2>
          <textarea
            value={dataStr}
            onChange={(e) => { setDataStr(e.target.value); setValidationState('idle'); }}
            className="w-full h-72 rounded-lg border border-border bg-transparent px-4 py-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Validate Button */}
      <button
        onClick={validate}
        className="w-full py-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Validate
      </button>

      {/* Results */}
      {parseError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {parseError}
        </div>
      )}

      {validationState === 'valid' && (
        <div className="rounded-lg border border-safe/50 bg-safe/10 p-4 text-sm text-safe flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Valid — JSON data matches the schema.
        </div>
      )}

      {validationState === 'invalid' && (
        <div className="space-y-3">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            Invalid — {errors.length} error{errors.length !== 1 ? 's' : ''} found.
          </div>
          <div className="space-y-2">
            {errors.map((err, i) => (
              <div
                key={i}
                className="rounded-md border border-border px-4 py-3 flex items-start gap-3 text-sm"
              >
                <span className="font-mono text-destructive shrink-0">{err.path || '/'}</span>
                <span className="text-muted-foreground">{err.message}</span>
                <span className="ml-auto text-xs font-mono bg-accent px-1.5 py-0.5 rounded shrink-0">
                  {err.keyword}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
