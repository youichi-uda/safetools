import { useState, useCallback } from 'react';
import yaml from 'js-yaml';
import CodeEditor from '@/components/shared/CodeEditor';
import { json } from '@codemirror/lang-json';

const SAMPLE_SPEC = `openapi: "3.0.3"
info:
  title: Pet Store API
  version: "1.0.0"
  description: A sample API for a pet store
servers:
  - url: https://api.petstore.example.com/v1
paths:
  /pets:
    get:
      summary: List all pets
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        "200":
          description: A list of pets
    post:
      summary: Create a pet
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                tag:
                  type: string
      responses:
        "201":
          description: Pet created
  /pets/{petId}:
    get:
      summary: Get a pet by ID
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: A pet
        "404":
          description: Pet not found`;

const METHOD_COLORS: Record<string, string> = {
  get: 'bg-green-500/15 text-green-700 dark:text-green-400',
  post: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  put: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  delete: 'bg-red-500/15 text-red-700 dark:text-red-400',
  patch: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
};

interface Endpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: Record<string, any>;
  tags?: string[];
}

function parseSpec(input: string): { spec: any; error: string | null } {
  if (!input.trim()) {
    return { spec: null, error: 'Please enter an OpenAPI specification.' };
  }
  let spec: any;
  try {
    spec = JSON.parse(input);
  } catch {
    try {
      spec = yaml.load(input);
    } catch (e: any) {
      return { spec: null, error: `Failed to parse input: ${e.message}` };
    }
  }
  if (!spec || typeof spec !== 'object') {
    return { spec: null, error: 'Invalid specification: parsed result is not an object.' };
  }
  if (!spec.openapi && !spec.swagger) {
    return { spec: null, error: 'Invalid specification: missing "openapi" or "swagger" field.' };
  }
  return { spec, error: null };
}

function extractEndpoints(spec: any): Endpoint[] {
  const paths = spec.paths || {};
  const endpoints: Endpoint[] = [];
  const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];

  for (const [path, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== 'object') continue;
    for (const [method, details] of Object.entries(methods as Record<string, any>)) {
      if (!httpMethods.includes(method)) continue;
      endpoints.push({
        path,
        method,
        summary: details.summary,
        description: details.description,
        parameters: details.parameters,
        requestBody: details.requestBody,
        responses: details.responses,
        tags: details.tags,
      });
    }
  }
  return endpoints;
}

function renderSchema(schema: any, depth = 0): string {
  if (!schema) return 'any';
  if (schema.type === 'object' && schema.properties) {
    const props = Object.entries(schema.properties)
      .map(([key, val]: [string, any]) => `${'  '.repeat(depth + 1)}${key}: ${renderSchema(val, depth + 1)}`)
      .join('\n');
    return `object {\n${props}\n${'  '.repeat(depth)}}`;
  }
  if (schema.type === 'array' && schema.items) {
    return `array<${renderSchema(schema.items, depth)}>`;
  }
  return schema.type || 'any';
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [expanded, setExpanded] = useState(false);
  const methodColor = METHOD_COLORS[endpoint.method] || 'bg-accent text-muted-foreground';

  const requestBodySchema = endpoint.requestBody?.content?.['application/json']?.schema;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors cursor-pointer"
      >
        <span
          className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${methodColor}`}
        >
          {endpoint.method}
        </span>
        <span className="font-mono text-sm font-medium">{endpoint.path}</span>
        {endpoint.summary && (
          <span className="text-sm text-muted-foreground ml-auto hidden sm:inline truncate max-w-xs">
            {endpoint.summary}
          </span>
        )}
        <svg
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border space-y-4">
          {endpoint.description && (
            <p className="text-sm text-muted-foreground">{endpoint.description}</p>
          )}

          {/* Parameters */}
          {endpoint.parameters && endpoint.parameters.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Parameters</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-md">
                  <thead>
                    <tr className="bg-accent/50">
                      <th className="text-left px-3 py-2 font-medium">Name</th>
                      <th className="text-left px-3 py-2 font-medium">In</th>
                      <th className="text-left px-3 py-2 font-medium">Type</th>
                      <th className="text-left px-3 py-2 font-medium">Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.parameters.map((param: any, i: number) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 font-mono text-xs">{param.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{param.in}</td>
                        <td className="px-3 py-2 text-muted-foreground">{param.schema?.type || 'any'}</td>
                        <td className="px-3 py-2">
                          {param.required ? (
                            <span className="text-red-600 dark:text-red-400 font-medium text-xs">required</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">optional</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Request Body */}
          {requestBodySchema && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Request Body</h4>
              <pre className="rounded-md bg-accent/30 border border-border p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {renderSchema(requestBodySchema)}
              </pre>
            </div>
          )}

          {/* Responses */}
          {endpoint.responses && Object.keys(endpoint.responses).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Responses</h4>
              <div className="space-y-1">
                {Object.entries(endpoint.responses).map(([code, details]: [string, any]) => (
                  <div key={code} className="flex items-start gap-3 text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        code.startsWith('2')
                          ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                          : code.startsWith('4') || code.startsWith('5')
                            ? 'bg-red-500/15 text-red-700 dark:text-red-400'
                            : 'bg-accent text-muted-foreground'
                      }`}
                    >
                      {code}
                    </span>
                    <span className="text-muted-foreground">{details.description || 'No description'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OpenapiViewer() {
  const [input, setInput] = useState('');
  const [spec, setSpec] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = useCallback(() => {
    const { spec: parsed, error: err } = parseSpec(input);
    setSpec(parsed);
    setError(err);
  }, [input]);

  const handleLoadSample = useCallback(() => {
    setInput(SAMPLE_SPEC);
    setSpec(null);
    setError(null);
  }, []);

  const endpoints = spec ? extractEndpoints(spec) : [];

  // Group by tags
  const grouped: Record<string, Endpoint[]> = {};
  const untagged: Endpoint[] = [];
  for (const ep of endpoints) {
    if (ep.tags && ep.tags.length > 0) {
      for (const tag of ep.tags) {
        if (!grouped[tag]) grouped[tag] = [];
        grouped[tag].push(ep);
      }
    } else {
      untagged.push(ep);
    }
  }
  const hasGroups = Object.keys(grouped).length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">OpenAPI / Swagger Viewer</h1>
        <p className="mt-2 text-muted-foreground">
          Paste an OpenAPI 3.x specification in YAML or JSON and view interactive API documentation.
          All processing happens entirely in your browser — your data never leaves your device.
        </p>
      </div>

      {/* Input */}
      <div className="rounded-lg border border-border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            OpenAPI Specification
          </h2>
          <button
            onClick={handleLoadSample}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
          >
            Load Sample
          </button>
        </div>
        <CodeEditor
          value={input}
          onChange={setInput}
          language={json()}
          placeholder="Paste your OpenAPI spec here (YAML or JSON)..."
          minHeight="200px"
        />
        <button
          onClick={handleParse}
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Parse & View
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Parsed Output */}
      {spec && (
        <div className="space-y-6">
          {/* API Info */}
          <div className="rounded-lg border border-border p-6 space-y-2">
            <h2 className="text-2xl font-bold">{spec.info?.title || 'Untitled API'}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {spec.info?.version && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent text-xs font-medium">
                  v{spec.info.version}
                </span>
              )}
              {spec.servers?.[0]?.url && (
                <span className="font-mono text-xs">{spec.servers[0].url}</span>
              )}
            </div>
            {spec.info?.description && (
              <p className="text-sm text-muted-foreground mt-2">{spec.info.description}</p>
            )}
          </div>

          {/* Endpoints */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Endpoints ({endpoints.length})
            </h2>

            {hasGroups ? (
              <>
                {Object.entries(grouped).map(([tag, eps]) => (
                  <div key={tag} className="space-y-2">
                    <h3 className="text-sm font-semibold capitalize">{tag}</h3>
                    <div className="space-y-2">
                      {eps.map((ep, i) => (
                        <EndpointCard key={`${ep.method}-${ep.path}-${i}`} endpoint={ep} />
                      ))}
                    </div>
                  </div>
                ))}
                {untagged.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Other</h3>
                    <div className="space-y-2">
                      {untagged.map((ep, i) => (
                        <EndpointCard key={`${ep.method}-${ep.path}-${i}`} endpoint={ep} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                {endpoints.map((ep, i) => (
                  <EndpointCard key={`${ep.method}-${ep.path}-${i}`} endpoint={ep} />
                ))}
              </div>
            )}

            {endpoints.length === 0 && (
              <p className="text-sm text-muted-foreground">No endpoints found in this specification.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
