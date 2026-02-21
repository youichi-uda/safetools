import { useState, useCallback } from 'react';
import { json } from '@codemirror/lang-json';
import CodeEditor from '@/components/shared/CodeEditor';
import CopyButton from '@/components/shared/CopyButton';
import Ajv from 'ajv';

type Mode = 'generate' | 'validate';

const SAMPLE_JSON = `{
  "id": 1,
  "name": "SafeTools",
  "version": "2.0.0",
  "active": true,
  "tags": ["privacy", "developer", "tools"],
  "config": {
    "clientSide": true,
    "analytics": false
  }
}`;

const SAMPLE_SCHEMA = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": { "type": "integer" },
    "name": { "type": "string" },
    "version": { "type": "string" },
    "active": { "type": "boolean" },
    "tags": {
      "type": "array",
      "items": { "type": "string" }
    },
    "config": {
      "type": "object",
      "properties": {
        "clientSide": { "type": "boolean" },
        "analytics": { "type": "boolean" }
      },
      "required": ["clientSide", "analytics"]
    }
  },
  "required": ["id", "name", "version", "active", "tags", "config"]
}`;

const SAMPLE_VALID_DATA = `{
  "id": 1,
  "name": "SafeTools",
  "version": "2.0.0",
  "active": true,
  "tags": ["privacy", "developer"],
  "config": {
    "clientSide": true,
    "analytics": false
  }
}`;

function generateSchema(value: unknown): Record<string, unknown> {
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'array', items: {} };
    return { type: 'array', items: generateSchema(value[0]) };
  }
  switch (typeof value) {
    case 'string':
      return { type: 'string' };
    case 'number':
      return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'object': {
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        properties[k] = generateSchema(v);
        required.push(k);
      }
      return { type: 'object', properties, required };
    }
    default:
      return {};
  }
}

export default function JsonSchemaGenerator() {
  const [mode, setMode] = useState<Mode>('generate');

  // Generate mode state
  const [genInput, setGenInput] = useState('');
  const [genOutput, setGenOutput] = useState('');
  const [genError, setGenError] = useState('');

  // Validate mode state
  const [valSchema, setValSchema] = useState('');
  const [valData, setValData] = useState('');
  const [valResult, setValResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [valError, setValError] = useState('');

  const handleGenerate = useCallback(() => {
    if (!genInput.trim()) {
      setGenOutput('');
      setGenError('');
      return;
    }
    try {
      const parsed = JSON.parse(genInput);
      const schema = {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        ...generateSchema(parsed),
      };
      setGenOutput(JSON.stringify(schema, null, 2));
      setGenError('');
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Invalid JSON input');
      setGenOutput('');
    }
  }, [genInput]);

  const handleValidate = useCallback(() => {
    setValResult(null);
    setValError('');

    if (!valSchema.trim() || !valData.trim()) {
      setValError('Both schema and data are required.');
      return;
    }

    let schema: unknown;
    let data: unknown;

    try {
      schema = JSON.parse(valSchema);
    } catch (e) {
      setValError(`Invalid JSON Schema: ${e instanceof Error ? e.message : 'Parse error'}`);
      return;
    }

    try {
      data = JSON.parse(valData);
    } catch (e) {
      setValError(`Invalid JSON Data: ${e instanceof Error ? e.message : 'Parse error'}`);
      return;
    }

    try {
      const ajv = new Ajv({ allErrors: true });
      const validate = ajv.compile(schema as Record<string, unknown>);
      const valid = validate(data);

      if (valid) {
        setValResult({ valid: true, errors: [] });
      } else {
        const errors = (validate.errors || []).map(
          (err) => `${err.instancePath || '/'} ${err.message}`
        );
        setValResult({ valid: false, errors });
      }
    } catch (e) {
      setValError(`Schema compilation error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }, [valSchema, valData]);

  const loadGenerateSample = useCallback(() => {
    setGenInput(SAMPLE_JSON);
    setGenOutput('');
    setGenError('');
  }, []);

  const loadValidateSample = useCallback(() => {
    setValSchema(SAMPLE_SCHEMA);
    setValData(SAMPLE_VALID_DATA);
    setValResult(null);
    setValError('');
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">JSON Schema Generator & Validator</h1>
        <p className="mt-2 text-muted-foreground">
          Generate JSON Schema from sample data or validate JSON against a schema. All processing
          happens entirely in your browser — your data never leaves your device.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-1 rounded-lg border border-border p-1 w-fit">
        <button
          onClick={() => setMode('generate')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === 'generate'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent text-muted-foreground'
          }`}
        >
          Generate Schema
        </button>
        <button
          onClick={() => setMode('validate')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === 'validate'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent text-muted-foreground'
          }`}
        >
          Validate JSON
        </button>
      </div>

      {/* Generate Mode */}
      {mode === 'generate' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              JSON Input
            </h2>
            <button
              onClick={loadGenerateSample}
              className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
            >
              Load Sample
            </button>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <CodeEditor
              value={genInput}
              onChange={setGenInput}
              language={json()}
              placeholder="Paste your JSON data here..."
              minHeight="200px"
            />
          </div>

          <button
            onClick={handleGenerate}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Generate Schema
          </button>

          {genError && (
            <div className="rounded-lg border border-border bg-destructive/10 p-4">
              <p className="text-sm text-destructive font-medium">{genError}</p>
            </div>
          )}

          {genOutput && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Generated Schema
                </h2>
                <CopyButton text={genOutput} />
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <CodeEditor
                  value={genOutput}
                  readOnly
                  language={json()}
                  minHeight="200px"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validate Mode */}
      {mode === 'validate' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              JSON Schema
            </h2>
            <button
              onClick={loadValidateSample}
              className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
            >
              Load Sample
            </button>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <CodeEditor
              value={valSchema}
              onChange={setValSchema}
              language={json()}
              placeholder="Paste your JSON Schema here..."
              minHeight="180px"
            />
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            JSON Data
          </h2>

          <div className="rounded-lg border border-border overflow-hidden">
            <CodeEditor
              value={valData}
              onChange={setValData}
              language={json()}
              placeholder="Paste your JSON data to validate..."
              minHeight="180px"
            />
          </div>

          <button
            onClick={handleValidate}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Validate
          </button>

          {valError && (
            <div className="rounded-lg border border-border bg-destructive/10 p-4">
              <p className="text-sm text-destructive font-medium">{valError}</p>
            </div>
          )}

          {valResult && (
            <div
              className={`rounded-lg border p-4 ${
                valResult.valid
                  ? 'border-safe/30 bg-safe/10'
                  : 'border-destructive/30 bg-destructive/10'
              }`}
            >
              {valResult.valid ? (
                <p className="text-sm font-medium text-safe">
                  Valid — JSON data matches the schema.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    Invalid — {valResult.errors.length} error
                    {valResult.errors.length !== 1 ? 's' : ''} found:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {valResult.errors.map((err, i) => (
                      <li key={i} className="text-sm text-destructive">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
