export interface Tool {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: string;
  icon: string;
  metaTitle: string;
  metaDescription: string;
}

export const tools: Tool[] = [
  {
    slug: 'json-formatter',
    name: 'JSON Formatter & Validator',
    shortName: 'JSON Formatter',
    description: 'Format, validate, and minify JSON with syntax highlighting. All processing happens in your browser.',
    category: 'Formatters',
    icon: '{ }',
    metaTitle: 'JSON Formatter & Validator - SafeTools.dev',
    metaDescription: 'Format, validate, and minify JSON online. Your data never leaves your browser. Free, private, and secure.',
  },
  {
    slug: 'code-beautifier',
    name: 'Code Beautifier',
    shortName: 'Code Beautifier',
    description: 'Beautify and format code in JS, TS, CSS, HTML, JSON, YAML, Markdown, and GraphQL using Prettier.',
    category: 'Formatters',
    icon: '</>',
    metaTitle: 'Code Beautifier - SafeTools.dev',
    metaDescription: 'Beautify and format code in 8+ languages using Prettier. Your data never leaves your browser.',
  },
  {
    slug: 'diff-checker',
    name: 'Diff Checker',
    shortName: 'Diff Checker',
    description: 'Compare two texts side-by-side or unified. Highlights additions, deletions, and changes at character, word, or line level.',
    category: 'Comparison',
    icon: '±',
    metaTitle: 'Diff Checker - SafeTools.dev',
    metaDescription: 'Compare text and code differences online. Split or unified view. Your data never leaves your browser.',
  },
];

export const categories = [...new Set(tools.map((t) => t.category))];

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
