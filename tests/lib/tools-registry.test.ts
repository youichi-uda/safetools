import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { tools, categories, getToolBySlug } from '@/lib/tools-registry';

// Resolve the public/og directory relative to the project root.
// vitest.config.ts sets __dirname to the project root via path.resolve.
const OG_DIR = path.resolve(__dirname, '../../public/og');

describe('tools array', () => {
  describe('slug uniqueness and format', () => {
    it('has no duplicate slugs', () => {
      const slugs = tools.map((t) => t.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    it('all slugs match the pattern /^[a-z0-9-]+$/', () => {
      const pattern = /^[a-z0-9-]+$/;
      for (const tool of tools) {
        expect(
          tool.slug,
          `Slug "${tool.slug}" does not match the required pattern`
        ).toMatch(pattern);
      }
    });
  });

  describe('required fields are non-empty', () => {
    it('all tools have a non-empty name', () => {
      for (const tool of tools) {
        expect(tool.name.trim(), `Tool with slug "${tool.slug}" has an empty name`).not.toBe('');
      }
    });

    it('all tools have a non-empty shortName', () => {
      for (const tool of tools) {
        expect(
          tool.shortName.trim(),
          `Tool with slug "${tool.slug}" has an empty shortName`
        ).not.toBe('');
      }
    });

    it('all tools have a non-empty description', () => {
      for (const tool of tools) {
        expect(
          tool.description.trim(),
          `Tool with slug "${tool.slug}" has an empty description`
        ).not.toBe('');
      }
    });

    it('all tools have a non-empty metaTitle', () => {
      for (const tool of tools) {
        expect(
          tool.metaTitle.trim(),
          `Tool with slug "${tool.slug}" has an empty metaTitle`
        ).not.toBe('');
      }
    });

    it('all tools have a non-empty metaDescription', () => {
      for (const tool of tools) {
        expect(
          tool.metaDescription.trim(),
          `Tool with slug "${tool.slug}" has an empty metaDescription`
        ).not.toBe('');
      }
    });
  });

  describe('metaTitle format', () => {
    it('all metaTitles end with " - SafeTools.dev"', () => {
      for (const tool of tools) {
        expect(
          tool.metaTitle,
          `metaTitle for "${tool.slug}" does not end with " - SafeTools.dev"`
        ).toMatch(/- SafeTools\.dev$/);
      }
    });
  });

  describe('metaDescription length', () => {
    it('all metaDescriptions are between 50 and 200 characters', () => {
      for (const tool of tools) {
        const len = tool.metaDescription.length;
        expect(
          len,
          `metaDescription for "${tool.slug}" is ${len} chars (expected 50–200)`
        ).toBeGreaterThanOrEqual(50);
        expect(
          len,
          `metaDescription for "${tool.slug}" is ${len} chars (expected 50–200)`
        ).toBeLessThanOrEqual(200);
      }
    });
  });

  describe('privacy promise in metaDescription', () => {
    it('all metaDescriptions contain "Your data never leaves your browser"', () => {
      const privacyPhrase = 'Your data never leaves your browser';
      for (const tool of tools) {
        expect(
          tool.metaDescription,
          `metaDescription for "${tool.slug}" is missing the privacy promise`
        ).toContain(privacyPhrase);
      }
    });
  });
});

describe('categories', () => {
  it('is non-empty', () => {
    expect(categories.length).toBeGreaterThan(0);
  });

  it('has no duplicate categories', () => {
    const unique = new Set(categories);
    expect(unique.size).toBe(categories.length);
  });

  it('contains every category referenced by a tool', () => {
    const toolCategories = new Set(tools.map((t) => t.category));
    for (const cat of toolCategories) {
      expect(categories).toContain(cat);
    }
  });
});

describe('getToolBySlug', () => {
  it('returns the correct tool for a known slug', () => {
    const tool = getToolBySlug('json-formatter');
    expect(tool).toBeDefined();
    expect(tool?.slug).toBe('json-formatter');
    expect(tool?.name).toBe('JSON Formatter & Validator');
  });

  it('returns the correct tool for another known slug', () => {
    const tool = getToolBySlug('uuid-generator');
    expect(tool).toBeDefined();
    expect(tool?.slug).toBe('uuid-generator');
  });

  it('returns undefined for an unknown slug', () => {
    const tool = getToolBySlug('this-tool-does-not-exist');
    expect(tool).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    const tool = getToolBySlug('');
    expect(tool).toBeUndefined();
  });

  it('is case-sensitive (uppercase slug returns undefined)', () => {
    const tool = getToolBySlug('JSON-Formatter');
    expect(tool).toBeUndefined();
  });
});

describe('OG image files', () => {
  it('OG PNG exists for every tool slug', () => {
    const missingImages: string[] = [];

    for (const tool of tools) {
      const imagePath = path.join(OG_DIR, `${tool.slug}.png`);
      if (!fs.existsSync(imagePath)) {
        missingImages.push(tool.slug);
      }
    }

    expect(
      missingImages,
      `Missing OG PNG images for slugs: ${missingImages.join(', ')}`
    ).toHaveLength(0);
  });
});
