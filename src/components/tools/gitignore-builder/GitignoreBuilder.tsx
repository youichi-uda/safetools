import { useState, useMemo } from 'react';
import CopyButton from '@/components/shared/CopyButton';
import { TEMPLATES, type GitignoreTemplate } from './templates';

const CATEGORIES = ['Languages', 'Frameworks', 'IDEs', 'OS'] as const;

export default function GitignoreBuilder() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [customRules, setCustomRules] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return TEMPLATES;
    const q = search.toLowerCase();
    return TEMPLATES.filter(
      (t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    );
  }, [search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const output = useMemo(() => {
    const sections: string[] = [];
    const seenRules = new Set<string>();

    for (const id of selected) {
      const template = TEMPLATES.find((t) => t.id === id);
      if (!template) continue;

      const uniqueRules = template.rules.filter((r) => {
        if (seenRules.has(r)) return false;
        seenRules.add(r);
        return true;
      });

      if (uniqueRules.length > 0) {
        sections.push(`# ${template.name}\n${uniqueRules.join('\n')}`);
      }
    }

    if (customRules.trim()) {
      sections.push(`# Custom rules\n${customRules.trim()}`);
    }

    return sections.join('\n\n');
  }, [selected, customRules]);

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.gitignore';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">.gitignore Builder</h1>
        <p className="mt-2 text-muted-foreground">
          Build .gitignore files by selecting templates for languages, frameworks, IDEs, and
          operating systems. All processing happens in your browser.
        </p>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates..."
          className="w-full rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Templates Grid */}
      {CATEGORIES.map((category) => {
        const items = filtered.filter((t) => t.category === category);
        if (items.length === 0) return null;

        return (
          <div key={category} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {category}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {items.map((template) => (
                <button
                  key={template.id}
                  onClick={() => toggle(template.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors text-left ${
                    selected.has(template.id)
                      ? 'bg-primary text-primary-foreground border-transparent'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <span className="text-xs font-mono w-6 shrink-0">{template.icon}</span>
                  <span className="truncate">{template.name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Custom Rules */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Custom Rules
        </h2>
        <textarea
          value={customRules}
          onChange={(e) => setCustomRules(e.target.value)}
          placeholder="Add custom ignore rules, one per line..."
          className="w-full h-24 rounded-lg border border-border bg-transparent px-4 py-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          spellCheck={false}
        />
      </div>

      {/* Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Preview ({selected.size} template{selected.size !== 1 ? 's' : ''} selected)
          </h2>
          <div className="flex gap-2">
            <CopyButton text={output} label="Copy" />
            <button
              onClick={handleDownload}
              disabled={!output}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-accent/20 overflow-hidden">
          <pre className="px-4 py-3 font-mono text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {output || '# Select templates above to generate .gitignore'}
          </pre>
        </div>
      </div>
    </div>
  );
}
