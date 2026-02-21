import { useState } from 'react';
import CopyButton from '@/components/shared/CopyButton';

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, ch) => ch.toUpperCase())
    .replace(/^[a-z]/, (ch) => ch.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

interface ConvertOptions {
  rootName: string;
  useType: boolean;
  exportInterfaces: boolean;
  allOptional: boolean;
}

function inferType(
  value: unknown,
  name: string,
  interfaces: Map<string, string>,
  options: ConvertOptions,
): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]';

    const elementTypes: string[] = [];
    const objectItems: Record<string, unknown>[] = [];

    for (const item of value) {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        objectItems.push(item as Record<string, unknown>);
      } else {
        const t = inferType(item, name, interfaces, options);
        if (!elementTypes.includes(t)) elementTypes.push(t);
      }
    }

    if (objectItems.length > 0) {
      const merged = mergeObjectShapes(objectItems);
      const interfaceName = toPascalCase(name) || 'Item';
      generateInterface(merged, interfaceName, interfaces, options);
      if (!elementTypes.includes(interfaceName)) elementTypes.push(interfaceName);
    }

    if (elementTypes.length === 0) return 'unknown[]';
    if (elementTypes.length === 1) return `${elementTypes[0]}[]`;
    return `(${elementTypes.join(' | ')})[]`;
  }

  if (typeof value === 'object') {
    const interfaceName = toPascalCase(name) || 'Unknown';
    generateInterface(value as Record<string, unknown>, interfaceName, interfaces, options);
    return interfaceName;
  }

  return 'unknown';
}

function mergeObjectShapes(
  objects: Record<string, unknown>[],
): { keys: Map<string, { types: string[]; required: boolean }> } {
  const allKeys = new Map<string, { values: unknown[]; count: number }>();

  for (const obj of objects) {
    for (const [key, val] of Object.entries(obj)) {
      const existing = allKeys.get(key);
      if (existing) {
        existing.values.push(val);
        existing.count++;
      } else {
        allKeys.set(key, { values: [val], count: 1 });
      }
    }
  }

  const result = new Map<string, { types: string[]; required: boolean }>();
  for (const [key, { values, count }] of allKeys) {
    result.set(key, {
      types: values,
      required: count === objects.length,
    });
  }

  return { keys: result };
}

function generateInterface(
  obj: Record<string, unknown> | { keys: Map<string, { types: string[]; required: boolean }> },
  name: string,
  interfaces: Map<string, string>,
  options: ConvertOptions,
): void {
  const keyword = options.useType ? 'type' : 'interface';
  const exportPrefix = options.exportInterfaces ? 'export ' : '';
  const lines: string[] = [];

  if ('keys' in obj && obj.keys instanceof Map) {
    const merged = obj.keys;
    const assign = options.useType ? ' = ' : ' ';
    lines.push(`${exportPrefix}${keyword} ${name}${assign}{`);

    for (const [key, { types, required }] of merged) {
      const memberTypes: string[] = [];
      for (const val of types) {
        const t = inferType(val, key, interfaces, options);
        if (!memberTypes.includes(t)) memberTypes.push(t);
      }
      const typeStr = memberTypes.length === 1 ? memberTypes[0] : memberTypes.join(' | ');
      const opt = options.allOptional || !required ? '?' : '';
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
      lines.push(`  ${safeKey}${opt}: ${typeStr};`);
    }

    lines.push('}');
  } else {
    const record = obj as Record<string, unknown>;
    const entries = Object.entries(record);

    if (entries.length === 0) {
      if (options.useType) {
        lines.push(`${exportPrefix}type ${name} = Record<string, unknown>;`);
      } else {
        lines.push(`${exportPrefix}interface ${name} {}`);
      }
    } else {
      const assign = options.useType ? ' = ' : ' ';
      lines.push(`${exportPrefix}${keyword} ${name}${assign}{`);

      for (const [key, value] of entries) {
        const t = inferType(value, key, interfaces, options);
        const opt = options.allOptional ? '?' : '';
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
        lines.push(`  ${safeKey}${opt}: ${t};`);
      }

      lines.push('}');
    }
  }

  interfaces.set(name, lines.join('\n'));
}

function convertJsonToTs(json: string, options: ConvertOptions): string {
  const parsed = JSON.parse(json);

  const interfaces = new Map<string, string>();

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      const exportPrefix = options.exportInterfaces ? 'export ' : '';
      return `${exportPrefix}type ${options.rootName} = unknown[];`;
    }

    const objectItems = parsed.filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object' && !Array.isArray(item),
    );

    if (objectItems.length > 0) {
      const merged = mergeObjectShapes(objectItems);
      generateInterface(merged, options.rootName, interfaces, options);
    } else {
      const types: string[] = [];
      for (const item of parsed) {
        const t = inferType(item, options.rootName, interfaces, options);
        if (!types.includes(t)) types.push(t);
      }
      const exportPrefix = options.exportInterfaces ? 'export ' : '';
      const typeStr = types.length === 1 ? types[0] : types.join(' | ');
      return `${exportPrefix}type ${options.rootName} = ${typeStr}[];`;
    }
  } else if (parsed !== null && typeof parsed === 'object') {
    generateInterface(parsed as Record<string, unknown>, options.rootName, interfaces, options);
  } else {
    const t = inferType(parsed, options.rootName, interfaces, options);
    const exportPrefix = options.exportInterfaces ? 'export ' : '';
    return `${exportPrefix}type ${options.rootName} = ${t};`;
  }

  const result: string[] = [];
  const rootInterface = interfaces.get(options.rootName);
  const otherInterfaces: string[] = [];

  for (const [key, value] of interfaces) {
    if (key === options.rootName) continue;
    otherInterfaces.push(value);
  }

  if (otherInterfaces.length > 0) {
    result.push(...otherInterfaces);
    result.push('');
  }

  if (rootInterface) {
    result.push(rootInterface);
  }

  return result.join('\n');
}

const SAMPLE_JSON = JSON.stringify(
  {
    id: 1,
    name: 'SafeTools',
    version: '2.0.0',
    isActive: true,
    metadata: null,
    tags: ['privacy', 'developer', 'tools'],
    contributors: [
      {
        username: 'alice',
        email: 'alice@example.com',
        roles: ['admin', 'developer'],
        profile: {
          bio: 'Loves open source',
          links: [{ url: 'https://github.com', label: 'GitHub' }],
        },
      },
      {
        username: 'bob',
        roles: ['developer'],
        profile: {
          bio: 'Backend engineer',
          links: [],
        },
      },
    ],
    config: {
      theme: 'dark',
      notifications: {
        email: true,
        push: false,
        frequency: 'daily',
      },
    },
    scores: [98, 87, 92],
    mixed: [1, 'two', true, null],
  },
  null,
  2,
);

export default function JsonToTypescript() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [rootName, setRootName] = useState('Root');
  const [useType, setUseType] = useState(false);
  const [exportInterfaces, setExportInterfaces] = useState(false);
  const [allOptional, setAllOptional] = useState(false);

  function handleConvert() {
    setError('');
    setOutput('');

    const trimmed = input.trim();
    if (!trimmed) {
      setError('Please enter some JSON to convert.');
      return;
    }

    try {
      const result = convertJsonToTs(trimmed, {
        rootName: rootName.trim() || 'Root',
        useType,
        exportInterfaces,
        allOptional,
      });
      setOutput(result);
    } catch (e) {
      setError(e instanceof SyntaxError ? `Invalid JSON: ${e.message}` : `Error: ${String(e)}`);
    }
  }

  function handleClear() {
    setInput('');
    setOutput('');
    setError('');
  }

  function handleSample() {
    setInput(SAMPLE_JSON);
    setError('');
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rootName.trim() || 'Root'}.ts`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-muted-foreground">
          Convert JSON data into TypeScript interfaces or type aliases. Handles nested objects,
          arrays, optional fields, and mixed types. All processing happens in your browser.
        </p>
      </div>

      {/* Options */}
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Root Name</label>
          <input
            type="text"
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            placeholder="Root"
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-transparent focus:outline-none focus:ring-1 focus:ring-primary w-36"
          />
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={useType}
            onChange={(e) => setUseType(e.target.checked)}
            className="accent-primary"
          />
          Use <code className="text-xs bg-accent px-1 py-0.5 rounded">type</code> instead of{' '}
          <code className="text-xs bg-accent px-1 py-0.5 rounded">interface</code>
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={exportInterfaces}
            onChange={(e) => setExportInterfaces(e.target.checked)}
            className="accent-primary"
          />
          Export interfaces
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allOptional}
            onChange={(e) => setAllOptional(e.target.checked)}
            className="accent-primary"
          />
          All properties optional
        </label>
      </div>

      {/* Action buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={handleConvert}
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Convert
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
        {output && (
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
          >
            Download .ts
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-3 py-2 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Input / Output panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">JSON Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Paste your JSON here...'
            spellCheck={false}
            className="w-full h-96 px-3 py-2 text-sm font-mono rounded-md border border-border bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">TypeScript Output</label>
            {output && <CopyButton text={output} />}
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="TypeScript interfaces will appear here..."
            spellCheck={false}
            className="w-full h-96 px-3 py-2 text-sm font-mono rounded-md border border-border bg-transparent resize-none focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
