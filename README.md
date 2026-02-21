# SafeTools.dev

**Privacy-first developer tools that run entirely in your browser.**

Your data never leaves your machine. Ever.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fsafetools.dev)](https://safetools.dev)
[![Build](https://img.shields.io/github/actions/workflow/status/youichi-uda/safetools/deploy.yml?branch=main)](https://github.com/youichi-uda/safetools/actions)

<!-- TODO: Add hero screenshot of the landing page -->

---

## Key Features

- **100% client-side** -- all processing happens in your browser via JavaScript and WebAssembly
- **CSP verified** -- `connect-src: 'self'` Content Security Policy header proves no data is sent externally
- **Zero tracking** -- no analytics, no cookies, no fingerprinting
- **Dark mode** -- system preference detection with manual toggle
- **Fast & lightweight** -- static site with islands architecture for minimal JavaScript
- **Open source** -- MIT licensed, fully auditable

## Tools

| Tool | Description |
|------|-------------|
| **JSON Formatter & Validator** | Format, validate, and minify JSON with syntax highlighting |
| **Code Beautifier** | Prettier-powered formatting for 8 languages (JS, TS, CSS, HTML, JSON, YAML, Markdown, GraphQL) |
| **Diff Checker** | Character, word, and line-level diffs with split and unified views |
| **Base64 Encoder/Decoder** | Encode and decode text and files to/from Base64 |
| **URL Encoder/Decoder** | `encodeURIComponent` and `encodeURI` with auto-detection |
| **Hash Generator** | MD5, SHA-1, SHA-256, and SHA-512 hashing via the Web Crypto API |
| **JWT Decoder** | Decode header, payload, and signature with expiration validation |
| **Color Converter** | Convert between HEX, RGB, HSL, and OKLCH with WCAG contrast checker |
| **Regex Tester** | Real-time pattern matching, capture groups, and find-and-replace |

## Tech Stack

- **Framework** -- [Astro 5](https://astro.build) with React 19 islands
- **Styling** -- [Tailwind CSS v4](https://tailwindcss.com) (CSS-based config via `@tailwindcss/vite`)
- **Code Editor** -- CodeMirror 6 with syntax highlighting and dark mode
- **Formatting** -- Prettier with lazily-loaded language plugins
- **Hashing** -- Web Crypto API (no external dependencies)
- **Hosting** -- [Cloudflare Pages](https://pages.cloudflare.com) (static site)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/youichi-uda/safetools.git
cd safetools

# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

The dev server runs at [localhost:4321](http://localhost:4321).

```bash
pnpm build     # Production build to dist/
pnpm preview   # Preview the production build locally
```

## Project Structure

```
src/
├── lib/
│   ├── tools-registry.ts    # Single source of truth for all tools
│   ├── seo.ts               # SEO and JSON-LD helpers
│   └── utils.ts             # cn() utility
├── components/
│   ├── layout/              # Navbar, Footer, ToolSidebar
│   ├── shared/              # CopyButton, FileDropZone, CodeEditor, ThemeToggle, PrivacyBadge
│   └── tools/               # One folder per tool (React components)
├── layouts/
│   ├── BaseLayout.astro     # HTML shell, SEO, dark mode
│   ├── ToolLayout.astro     # Sidebar + tool area
│   └── LandingLayout.astro
├── pages/
│   ├── index.astro          # Landing page
│   ├── privacy.astro        # Privacy policy
│   └── tools/               # One .astro page per tool
└── styles/globals.css       # Tailwind v4 theme tokens
```

## Adding a New Tool

1. **Register** -- add tool metadata to `src/lib/tools-registry.ts`
2. **Build** -- create a React component in `src/components/tools/<slug>/`
3. **Route** -- create a page at `src/pages/tools/<slug>.astro` using `ToolLayout`

That's it. The sidebar, SEO tags, and landing page grid update automatically from the registry.

## Privacy & Security

SafeTools enforces privacy at the infrastructure level, not just by promise:

- **Content Security Policy** -- the `connect-src: 'self'` header in `public/_headers` blocks all outbound network requests to external origins. This is verifiable in your browser's DevTools.
- **No server-side processing** -- the site is fully static. There is no backend, no API, and no database.
- **No external scripts** -- zero third-party analytics, ads, or tracking scripts.
- **Minimal storage** -- only `localStorage` is used, solely for your theme preference.

You can audit the CSP headers yourself by inspecting any network response from the site.

## Contributing

Contributions are welcome. Please open an issue to discuss your idea before submitting a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-tool`)
3. Follow the [Adding a New Tool](#adding-a-new-tool) pattern
4. Submit a pull request

## License

This project is licensed under the [MIT License](LICENSE).
