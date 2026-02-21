import { describe, it, expect } from 'vitest';
import { SITE_URL, getJsonLdWebApplication, getJsonLdWebSite, getJsonLdBreadcrumb } from '@/lib/seo';

describe('SITE_URL', () => {
  it('is https://safetools.dev', () => {
    expect(SITE_URL).toBe('https://safetools.dev');
  });
});

describe('getJsonLdWebApplication', () => {
  const tool = {
    name: 'JSON Formatter & Validator',
    description: 'Format, validate, and minify JSON with syntax highlighting.',
    slug: 'json-formatter',
  };

  let parsed: unknown[];

  it('returns valid JSON', () => {
    const result = getJsonLdWebApplication(tool);
    expect(() => JSON.parse(result)).not.toThrow();
    parsed = JSON.parse(result);
  });

  it('returns an array with two schema objects', () => {
    parsed = JSON.parse(getJsonLdWebApplication(tool));
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
  });

  it('first element has @type WebApplication', () => {
    parsed = JSON.parse(getJsonLdWebApplication(tool));
    const webApp = parsed[0] as Record<string, unknown>;
    expect(webApp['@type']).toBe('WebApplication');
  });

  it('second element has @type BreadcrumbList', () => {
    parsed = JSON.parse(getJsonLdWebApplication(tool));
    const breadcrumb = parsed[1] as Record<string, unknown>;
    expect(breadcrumb['@type']).toBe('BreadcrumbList');
  });

  it('WebApplication has correct tool URL', () => {
    parsed = JSON.parse(getJsonLdWebApplication(tool));
    const webApp = parsed[0] as Record<string, unknown>;
    expect(webApp['url']).toBe(`${SITE_URL}/tools/json-formatter`);
  });

  it('WebApplication contains required field: name', () => {
    parsed = JSON.parse(getJsonLdWebApplication(tool));
    const webApp = parsed[0] as Record<string, unknown>;
    expect(webApp['name']).toBe(tool.name);
  });

  it('WebApplication contains required field: description', () => {
    parsed = JSON.parse(getJsonLdWebApplication(tool));
    const webApp = parsed[0] as Record<string, unknown>;
    expect(webApp['description']).toBe(tool.description);
  });

  it('WebApplication contains required field: applicationCategory', () => {
    parsed = JSON.parse(getJsonLdWebApplication(tool));
    const webApp = parsed[0] as Record<string, unknown>;
    expect(webApp['applicationCategory']).toBeDefined();
    expect(typeof webApp['applicationCategory']).toBe('string');
  });

  it('WebApplication contains required field: offers', () => {
    parsed = JSON.parse(getJsonLdWebApplication(tool));
    const webApp = parsed[0] as Record<string, unknown>;
    expect(webApp['offers']).toBeDefined();
    expect(typeof webApp['offers']).toBe('object');
  });

  it('BreadcrumbList has correct tool URL in item list', () => {
    parsed = JSON.parse(getJsonLdWebApplication(tool));
    const breadcrumb = parsed[1] as Record<string, unknown>;
    const items = breadcrumb['itemListElement'] as Array<Record<string, unknown>>;
    const toolItem = items.find((i) => i['position'] === 2);
    expect(toolItem?.['item']).toBe(`${SITE_URL}/tools/json-formatter`);
  });

  it('reflects the slug correctly when a different slug is provided', () => {
    const anotherTool = { name: 'Diff Checker', description: 'Compare texts.', slug: 'diff-checker' };
    const result = JSON.parse(getJsonLdWebApplication(anotherTool));
    const webApp = result[0] as Record<string, unknown>;
    expect(webApp['url']).toBe(`${SITE_URL}/tools/diff-checker`);
  });
});

describe('getJsonLdWebSite', () => {
  it('returns valid JSON', () => {
    const result = getJsonLdWebSite();
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('has @type WebSite', () => {
    const parsed = JSON.parse(getJsonLdWebSite()) as Record<string, unknown>;
    expect(parsed['@type']).toBe('WebSite');
  });

  it('has the correct site name', () => {
    const parsed = JSON.parse(getJsonLdWebSite()) as Record<string, unknown>;
    expect(parsed['name']).toBe('SafeTools.dev');
  });

  it('has the correct site URL', () => {
    const parsed = JSON.parse(getJsonLdWebSite()) as Record<string, unknown>;
    expect(parsed['url']).toBe(SITE_URL);
  });

  it('has @context https://schema.org', () => {
    const parsed = JSON.parse(getJsonLdWebSite()) as Record<string, unknown>;
    expect(parsed['@context']).toBe('https://schema.org');
  });
});

describe('getJsonLdBreadcrumb', () => {
  const tool = { name: 'Hash Generator', slug: 'hash-generator' };

  it('returns valid JSON', () => {
    const result = getJsonLdBreadcrumb(tool);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('has @type BreadcrumbList', () => {
    const parsed = JSON.parse(getJsonLdBreadcrumb(tool)) as Record<string, unknown>;
    expect(parsed['@type']).toBe('BreadcrumbList');
  });

  it('has exactly 2 list items', () => {
    const parsed = JSON.parse(getJsonLdBreadcrumb(tool)) as Record<string, unknown>;
    const items = parsed['itemListElement'] as unknown[];
    expect(items).toHaveLength(2);
  });

  it('first item is Home at position 1', () => {
    const parsed = JSON.parse(getJsonLdBreadcrumb(tool)) as Record<string, unknown>;
    const items = parsed['itemListElement'] as Array<Record<string, unknown>>;
    expect(items[0]['position']).toBe(1);
    expect(items[0]['name']).toBe('Home');
    expect(items[0]['item']).toBe(SITE_URL);
  });

  it('second item is the tool at position 2', () => {
    const parsed = JSON.parse(getJsonLdBreadcrumb(tool)) as Record<string, unknown>;
    const items = parsed['itemListElement'] as Array<Record<string, unknown>>;
    expect(items[1]['position']).toBe(2);
    expect(items[1]['name']).toBe(tool.name);
    expect(items[1]['item']).toBe(`${SITE_URL}/tools/${tool.slug}`);
  });

  it('item URLs use SITE_URL as the base', () => {
    const parsed = JSON.parse(getJsonLdBreadcrumb(tool)) as Record<string, unknown>;
    const items = parsed['itemListElement'] as Array<Record<string, unknown>>;
    expect((items[0]['item'] as string).startsWith(SITE_URL)).toBe(true);
    expect((items[1]['item'] as string).startsWith(SITE_URL)).toBe(true);
  });

  it('reflects a different tool slug correctly', () => {
    const anotherTool = { name: 'UUID Generator', slug: 'uuid-generator' };
    const parsed = JSON.parse(getJsonLdBreadcrumb(anotherTool)) as Record<string, unknown>;
    const items = parsed['itemListElement'] as Array<Record<string, unknown>>;
    expect(items[1]['item']).toBe(`${SITE_URL}/tools/uuid-generator`);
    expect(items[1]['name']).toBe('UUID Generator');
  });
});
