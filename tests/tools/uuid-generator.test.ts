import { describe, it, expect } from 'vitest';
import {
  generateUUID,
  formatUUID,
} from '@/components/tools/uuid-generator/UuidGenerator';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('generateUUID', () => {
  it('returns a string matching UUID v4 pattern', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(UUID_V4_REGEX);
  });

  it('generates unique values (100 UUIDs, no duplicates)', () => {
    const uuids = Array.from({ length: 100 }, () => generateUUID());
    const unique = new Set(uuids);
    expect(unique.size).toBe(100);
  });
});

describe('formatUUID', () => {
  const sampleUuid = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

  it('uppercase option works', () => {
    const result = formatUUID(sampleUuid, { uppercase: true, hyphens: true, braces: false });
    expect(result).toBe('A1B2C3D4-E5F6-4A7B-8C9D-0E1F2A3B4C5D');
  });

  it('hyphens=false removes hyphens', () => {
    const result = formatUUID(sampleUuid, { uppercase: false, hyphens: false, braces: false });
    expect(result).toBe('a1b2c3d4e5f64a7b8c9d0e1f2a3b4c5d');
    expect(result).not.toContain('-');
  });

  it('braces=true wraps in {}', () => {
    const result = formatUUID(sampleUuid, { uppercase: false, hyphens: true, braces: true });
    expect(result).toBe(`{${sampleUuid}}`);
  });

  it('all options combined', () => {
    const result = formatUUID(sampleUuid, { uppercase: true, hyphens: false, braces: true });
    expect(result).toBe('{A1B2C3D4E5F64A7B8C9D0E1F2A3B4C5D}');
  });
});
