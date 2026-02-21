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
  {
    slug: 'base64-encoder-decoder',
    name: 'Base64 Encoder / Decoder',
    shortName: 'Base64',
    description: 'Encode and decode Base64 strings and files. Supports text and binary file conversion.',
    category: 'Encoders',
    icon: 'B64',
    metaTitle: 'Base64 Encoder / Decoder - SafeTools.dev',
    metaDescription: 'Encode and decode Base64 online. Supports text and file conversion. Your data never leaves your browser.',
  },
  {
    slug: 'url-encoder-decoder',
    name: 'URL Encoder / Decoder',
    shortName: 'URL Encoder',
    description: 'Encode and decode URL components. Handles special characters, query strings, and full URLs.',
    category: 'Encoders',
    icon: '%20',
    metaTitle: 'URL Encoder / Decoder - SafeTools.dev',
    metaDescription: 'Encode and decode URLs and query strings online. Your data never leaves your browser.',
  },
  {
    slug: 'hash-generator',
    name: 'Hash Generator',
    shortName: 'Hash Generator',
    description: 'Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text or files using the Web Crypto API.',
    category: 'Crypto',
    icon: '#',
    metaTitle: 'Hash Generator - SafeTools.dev',
    metaDescription: 'Generate MD5, SHA-1, SHA-256, SHA-512 hashes online. Uses Web Crypto API. Your data never leaves your browser.',
  },
  {
    slug: 'jwt-decoder',
    name: 'JWT Decoder',
    shortName: 'JWT Decoder',
    description: 'Decode and inspect JSON Web Tokens. View header, payload, and signature with syntax highlighting.',
    category: 'Crypto',
    icon: 'JWT',
    metaTitle: 'JWT Decoder - SafeTools.dev',
    metaDescription: 'Decode and inspect JWT tokens online. View header, payload, and signature. Your data never leaves your browser.',
  },
  {
    slug: 'color-converter',
    name: 'Color Converter',
    shortName: 'Color Converter',
    description: 'Convert colors between HEX, RGB, HSL, and OKLCH formats with a live preview.',
    category: 'Converters',
    icon: '',
    metaTitle: 'Color Converter - SafeTools.dev',
    metaDescription: 'Convert colors between HEX, RGB, HSL, and OKLCH online. Live preview. Your data never leaves your browser.',
  },
  {
    slug: 'regex-tester',
    name: 'Regex Tester',
    shortName: 'Regex Tester',
    description: 'Test regular expressions with real-time matching, capture group highlighting, and flag options.',
    category: 'Testing',
    icon: '.*',
    metaTitle: 'Regex Tester - SafeTools.dev',
    metaDescription: 'Test and debug regular expressions online with real-time matching. Your data never leaves your browser.',
  },
  {
    slug: 'markdown-preview',
    name: 'Markdown Preview',
    shortName: 'Markdown Preview',
    description: 'Write and preview GitHub Flavored Markdown in real-time with syntax highlighting and export.',
    category: 'Formatters',
    icon: 'MD',
    metaTitle: 'Markdown Preview - SafeTools.dev',
    metaDescription: 'Write and preview Markdown online with real-time rendering. GFM support. Your data never leaves your browser.',
  },
  {
    slug: 'json-to-typescript',
    name: 'JSON to TypeScript',
    shortName: 'JSON → TS',
    description: 'Generate TypeScript interfaces and types from JSON data automatically.',
    category: 'Converters',
    icon: 'TS',
    metaTitle: 'JSON to TypeScript - SafeTools.dev',
    metaDescription: 'Convert JSON to TypeScript interfaces online. Auto-generate types. Your data never leaves your browser.',
  },
  {
    slug: 'uuid-generator',
    name: 'UUID Generator',
    shortName: 'UUID Generator',
    description: 'Generate random UUIDs (v4) with bulk generation, formatting options, and one-click copy.',
    category: 'Generators',
    icon: 'ID',
    metaTitle: 'UUID Generator - SafeTools.dev',
    metaDescription: 'Generate random UUID v4 online. Bulk generation and formatting. Your data never leaves your browser.',
  },
];

export const categories = [...new Set(tools.map((t) => t.category))];

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
