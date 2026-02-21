import { describe, it, expect } from 'vitest';
import {
  base64UrlDecode,
  tryParseJwt,
  formatExpiration,
  formatTimestamp,
} from '@/components/tools/jwt-decoder/JwtDecoder';

function base64UrlEncode(obj: object): string {
  const json = JSON.stringify(obj);
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeJwt(header: object, payload: object): string {
  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.test-signature`;
}

describe('base64UrlDecode', () => {
  it('decodes base64url with - and _ chars', () => {
    // Encode a string that would produce + and / in standard base64
    const original = JSON.stringify({ sub: '1234567890', name: 'Jane' });
    const encoded = btoa(original).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(base64UrlDecode(encoded)).toBe(original);
  });

  it('handles padding correctly', () => {
    // "a" in base64 is "YQ==" which in base64url is "YQ"
    expect(base64UrlDecode('YQ')).toBe('a');
  });
});

describe('tryParseJwt', () => {
  it('parses a valid JWT with 3 parts', () => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { sub: '1234567890', name: 'Test User', iat: 1700000000 };
    const token = makeJwt(header, payload);

    const result = tryParseJwt(token);
    expect(result.error).toBeUndefined();
    expect(result.header).toEqual(header);
    expect(result.payload).toEqual(payload);
    expect(result.signature).toBe('test-signature');
  });

  it('returns error for token with only 2 parts', () => {
    const result = tryParseJwt('part1.part2');
    expect(result.error).toBe('Invalid JWT: must have 3 dot-separated parts');
  });

  it('returns error for invalid base64 content', () => {
    const result = tryParseJwt('!!!.@@@.###');
    expect(result.error).toBe('Invalid JWT: unable to decode base64url content');
  });
});

describe('formatTimestamp', () => {
  it('converts unix timestamp to UTC string', () => {
    // 1700000000 = Tue, 14 Nov 2023 22:13:20 GMT
    const result = formatTimestamp(1700000000);
    expect(result).toContain('2023');
    expect(result).toContain('Nov');
  });
});

describe('formatExpiration', () => {
  it('reports expired token', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const result = formatExpiration(pastExp);
    expect(result.expired).toBe(true);
    expect(result.text).toContain('Expired');
  });

  it('reports valid token', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const result = formatExpiration(futureExp);
    expect(result.expired).toBe(false);
    expect(result.text).toContain('Valid');
  });
});
