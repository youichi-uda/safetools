import { useState, useCallback } from 'react';
import yaml from 'js-yaml';
import CodeEditor from '@/components/shared/CodeEditor';
import CopyButton from '@/components/shared/CopyButton';
import { json } from '@codemirror/lang-json';

type Direction = 'json-to-yaml' | 'yaml-to-json';

const SAMPLE_JSON = `{
  "apiVersion": "apps/v1",
  "kind": "Deployment",
  "metadata": {
    "name": "nginx-deployment",
    "labels": {
      "app": "nginx"
    }
  },
  "spec": {
    "replicas": 3,
    "selector": {
      "matchLabels": {
        "app": "nginx"
      }
    },
    "template": {
      "metadata": {
        "labels": {
          "app": "nginx"
        }
      },
      "spec": {
        "containers": [
          {
            "name": "nginx",
            "image": "nginx:1.25",
            "ports": [
              {
                "containerPort": 80
              }
            ],
            "resources": {
              "requests": {
                "cpu": "100m",
                "memory": "128Mi"
              },
              "limits": {
                "cpu": "250m",
                "memory": "256Mi"
              }
            }
          }
        ]
      }
    }
  }
}`;

const SAMPLE_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.25
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 250m
              memory: 256Mi`;

export default function YamlJsonConverter() {
  const [jsonValue, setJsonValue] = useState('');
  const [yamlValue, setYamlValue] = useState('');
  const [direction, setDirection] = useState<Direction>('json-to-yaml');
  const [indent, setIndent] = useState<number>(2);
  const [flowLevel, setFlowLevel] = useState<number>(-1);
  const [error, setError] = useState('');

  const handleConvert = useCallback(() => {
    setError('');
    try {
      if (direction === 'json-to-yaml') {
        if (!jsonValue.trim()) {
          setError('Please enter JSON data to convert.');
          return;
        }
        const parsed = JSON.parse(jsonValue);
        const result = yaml.dump(parsed, { indent, flowLevel });
        setYamlValue(result);
      } else {
        if (!yamlValue.trim()) {
          setError('Please enter YAML data to convert.');
          return;
        }
        const parsed = yaml.load(yamlValue);
        const result = JSON.stringify(parsed, null, 2);
        setJsonValue(result);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed.');
    }
  }, [direction, jsonValue, yamlValue, indent, flowLevel]);

  const handleLoadSample = useCallback(() => {
    setError('');
    if (direction === 'json-to-yaml') {
      setJsonValue(SAMPLE_JSON);
      setYamlValue('');
    } else {
      setYamlValue(SAMPLE_YAML);
      setJsonValue('');
    }
  }, [direction]);

  const handleClear = useCallback(() => {
    setJsonValue('');
    setYamlValue('');
    setError('');
  }, []);

  const flowLevelLabel = (level: number) => {
    switch (level) {
      case -1: return 'Block (default)';
      case 0: return 'Flow: Root';
      case 1: return 'Flow: Nested';
      default: return String(level);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">JSON &harr; YAML Converter</h1>
        <p className="mt-2 text-muted-foreground">
          Convert between JSON and YAML formats bidirectionally. Perfect for Kubernetes manifests,
          Docker Compose files, and CI/CD pipelines. All processing happens in your browser.
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-lg border border-border p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Direction Toggle */}
          <button
            onClick={() => setDirection(direction === 'json-to-yaml' ? 'yaml-to-json' : 'json-to-yaml')}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {direction === 'json-to-yaml' ? 'JSON \u2192 YAML' : 'YAML \u2192 JSON'}
          </button>

          {/* Indent Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Indent:</span>
            {([2, 4] as const).map((n) => (
              <button
                key={n}
                onClick={() => setIndent(n)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  indent === n
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {n} spaces
              </button>
            ))}
          </div>

          {/* Flow Level Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Style:</span>
            {([-1, 0, 1] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFlowLevel(level)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  flowLevel === level
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {flowLevelLabel(level)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

        {/* YAML Panel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              YAML
            </h2>
            <CopyButton text={yamlValue} />
          </div>
          <CodeEditor
            value={yamlValue}
            onChange={setYamlValue}
            placeholder="Paste your YAML data here..."
            minHeight="350px"
          />
        </div>
      </div>
    </div>
  );
}
