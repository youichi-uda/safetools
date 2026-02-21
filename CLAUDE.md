# SafeTools.dev

## Overview
Privacy-first developer tools suite. "Your data never leaves your browser."
All processing is 100% client-side JavaScript/WASM.

## Tech Stack
- **Framework**: Astro 5 + React (islands architecture)
- **Styling**: Tailwind CSS v4 (CSS-based config, `@tailwindcss/vite`)
- **Hosting target**: Cloudflare Pages (static site)
- **Package manager**: pnpm

## Development
```bash
pnpm dev      # Start dev server at localhost:4321
pnpm build    # Production build to dist/
pnpm preview  # Preview production build
```

## Project Structure
```
src/
├── lib/
│   ├── tools-registry.ts  # Single source of truth for all tools
│   ├── seo.ts             # SEO/JSON-LD helpers
│   └── utils.ts           # cn() utility
├── components/
│   ├── layout/            # Navbar, Footer, ToolSidebar (Astro)
│   ├── shared/            # CopyButton, FileDropZone, CodeEditor, ThemeToggle, PrivacyBadge
│   └── tools/             # One folder per tool (React components)
├── layouts/
│   ├── BaseLayout.astro   # HTML shell + SEO + dark mode
│   ├── ToolLayout.astro   # Sidebar + tool area
│   └── LandingLayout.astro
├── pages/
│   ├── index.astro        # Landing page
│   ├── privacy.astro
│   └── tools/             # One .astro file per tool
└── styles/globals.css     # Tailwind v4 theme tokens
```

## Adding a New Tool (3 steps)
1. Add metadata to `src/lib/tools-registry.ts`
2. Create React component in `src/components/tools/<slug>/`
3. Create page at `src/pages/tools/<slug>.astro` using ToolLayout

## Current Tools
- **JSON Formatter** - Format, validate, minify JSON
- **Code Beautifier** - Prettier-powered (JS, TS, CSS, HTML, JSON, YAML, MD, GraphQL)
- **Diff Checker** - Character/word/line diff with split/unified views

## Key Design Decisions
- Tailwind v4 uses CSS `@theme` directive (not JS config)
- No `@astrojs/tailwind` — using `@tailwindcss/vite` plugin directly
- CSP headers in `public/_headers` block all external connections
- Dark mode via `class` strategy (localStorage + system preference)
- CodeMirror 6 for code editing with syntax highlighting
- Prettier plugins loaded lazily via dynamic import

## Privacy Architecture
- `connect-src: 'self'` CSP header proves no external data transmission
- Zero analytics, zero cookies, zero tracking
- Only localStorage used (theme preference)
