import { useState, useMemo, useEffect, useCallback } from 'react';
import CopyButton from '@/components/shared/CopyButton';

const SAMPLE_TEMPLATES = [
  {
    name: 'Code Review',
    template:
      'Review the following {{language}} code for bugs, performance issues, and best practices:\n\n```{{language}}\n{{code}}\n```\n\nFocus on: {{focus_areas}}',
  },
  {
    name: 'Translation',
    template:
      'Translate the following text from {{source_language}} to {{target_language}}. Maintain the original tone and style.\n\nText: {{text}}',
  },
  {
    name: 'Summary',
    template:
      'Summarize the following {{content_type}} in {{word_count}} words or less. Focus on key points and actionable insights.\n\n{{content}}',
  },
];

const STORAGE_KEY = 'prompt-formatter-templates';

interface SavedTemplate {
  name: string;
  template: string;
}

function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

function fillTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
}

function loadSavedTemplates(): SavedTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSavedTemplates(templates: SavedTemplate[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // localStorage not available
  }
}

function formatVariableName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PromptFormatter() {
  const [template, setTemplate] = useState(SAMPLE_TEMPLATES[0].template);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);

  useEffect(() => {
    setSavedTemplates(loadSavedTemplates());
  }, []);

  const detectedVars = useMemo(() => extractVariables(template), [template]);
  const filledResult = useMemo(() => fillTemplate(template, variables), [template, variables]);

  const wordCount = useMemo(() => {
    const trimmed = filledResult.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [filledResult]);

  const charCount = filledResult.length;

  const handleVariableChange = useCallback((key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSampleSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = SAMPLE_TEMPLATES.find((t) => t.name === e.target.value);
    if (selected) {
      setTemplate(selected.template);
      setVariables({});
    }
  }, []);

  const handleClear = useCallback(() => {
    setTemplate('');
    setVariables({});
  }, []);

  const handleSaveTemplate = useCallback(() => {
    const name = prompt('Enter a name for this template:');
    if (!name || !name.trim()) return;
    const updated = [...savedTemplates, { name: name.trim(), template }];
    setSavedTemplates(updated);
    saveSavedTemplates(updated);
  }, [template, savedTemplates]);

  const handleLoadTemplate = useCallback(
    (saved: SavedTemplate) => {
      setTemplate(saved.template);
      setVariables({});
    },
    []
  );

  const handleDeleteTemplate = useCallback(
    (index: number) => {
      const updated = savedTemplates.filter((_, i) => i !== index);
      setSavedTemplates(updated);
      saveSavedTemplates(updated);
    },
    [savedTemplates]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prompt Template Formatter</h1>
        <p className="mt-2 text-muted-foreground">
          Create reusable prompt templates with {'{{variables}}'} and fill them in dynamically.
          Everything stays in your browser — your prompts never leave your device.
        </p>
      </div>

      {/* Sample Templates & Actions */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quick Start
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            onChange={handleSampleSelect}
            defaultValue=""
            className="rounded-md border border-border bg-transparent px-3 py-1.5 text-sm"
          >
            <option value="" disabled>
              Load a sample template...
            </option>
            {SAMPLE_TEMPLATES.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleSaveTemplate}
            disabled={!template.trim()}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Template
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Editor */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Template
            </h2>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder={'Write your template here using {{variable_name}} for dynamic parts...'}
              className="w-full h-64 rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              spellCheck={false}
            />
          </div>

          {/* Variables Panel */}
          {detectedVars.length > 0 && (
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Variables ({detectedVars.length})
              </h2>
              <div className="space-y-3">
                {detectedVars.map((varName) => (
                  <div key={varName}>
                    <label
                      htmlFor={`var-${varName}`}
                      className="block text-sm font-medium mb-1"
                    >
                      {formatVariableName(varName)}
                      <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                        {`{{${varName}}}`}
                      </span>
                    </label>
                    <textarea
                      id={`var-${varName}`}
                      value={variables[varName] || ''}
                      onChange={(e) => handleVariableChange(varName, e.target.value)}
                      placeholder={`Enter ${formatVariableName(varName).toLowerCase()}...`}
                      rows={2}
                      className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Live Preview
              </h2>
              <CopyButton text={filledResult} />
            </div>
            <div className="min-h-64 rounded-md border border-border bg-accent/30 p-3">
              <pre className="font-mono text-sm whitespace-pre-wrap break-words">
                {filledResult || 'Your filled template will appear here...'}
              </pre>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{charCount} characters</span>
              <span>{wordCount} words</span>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Templates */}
      {savedTemplates.length > 0 && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Saved Templates ({savedTemplates.length})
          </h2>
          <ul className="space-y-2">
            {savedTemplates.map((saved, i) => (
              <li
                key={`${saved.name}-${i}`}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-sm font-medium truncate">{saved.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{saved.template}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleLoadTemplate(saved)}
                    className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(i)}
                    className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors text-destructive"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
