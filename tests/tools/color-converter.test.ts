import { describe, it, expect } from 'vitest';
import {
  clamp,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToOklch,
  oklchToRgb,
  relativeLuminance,
  contrastRatio,
} from '@/components/tools/color-converter/ColorConverter';

describe('clamp', () => {
  it('clamps value below min', () => {
    expect(clamp(-5, 0, 255)).toBe(0);
  });

  it('clamps value above max', () => {
    expect(clamp(300, 0, 255)).toBe(255);
  });

  it('returns value within range unchanged', () => {
    expect(clamp(128, 0, 255)).toBe(128);
  });
});

describe('hexToRgb', () => {
  it('converts "#ff0000" to red RGB', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('converts "#000" (3-digit shorthand) to black RGB', () => {
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('converts "abc" (3-digit without hash) correctly', () => {
    expect(hexToRgb('abc')).toEqual({ r: 170, g: 187, b: 204 });
  });

  it('returns null for invalid hex', () => {
    expect(hexToRgb('xyz')).toBeNull();
  });

  it('returns null for too-short hex', () => {
    expect(hexToRgb('#zz')).toBeNull();
  });
});

describe('rgbToHex', () => {
  it('converts red RGB to "#ff0000"', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
  });

  it('converts black RGB to "#000000"', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
  });

  it('converts white RGB to "#ffffff"', () => {
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
  });
});

describe('rgbToHsl', () => {
  it('converts red to {h:0, s:100, l:50}', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('converts white to {h:0, s:0, l:100}', () => {
    expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 });
  });

  it('converts black to {h:0, s:0, l:0}', () => {
    expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 });
  });
});

describe('hslToRgb', () => {
  it('converts {h:0, s:100, l:50} to red', () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('converts grayscale (s=0) correctly', () => {
    const result = hslToRgb({ h: 0, s: 0, l: 50 });
    expect(result.r).toBe(result.g);
    expect(result.g).toBe(result.b);
    expect(result.r).toBe(128);
  });
});

describe('Roundtrip conversions', () => {
  it('hex -> rgb -> hex roundtrip', () => {
    const hex = '#3b82f6';
    const rgb = hexToRgb(hex)!;
    expect(rgbToHex(rgb)).toBe(hex);
  });

  it('rgb -> hsl -> rgb roundtrip', () => {
    const rgb = { r: 100, g: 150, b: 200 };
    const hsl = rgbToHsl(rgb);
    const back = hslToRgb(hsl);
    // Allow rounding tolerance of 1
    expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(1);
    expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(1);
    expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(1);
  });
});

describe('relativeLuminance', () => {
  it('returns ~1.0 for white', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1.0, 2);
  });

  it('returns 0 for black', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });
});

describe('contrastRatio', () => {
  it('returns 21 for black and white', () => {
    const black = { r: 0, g: 0, b: 0 };
    const white = { r: 255, g: 255, b: 255 };
    expect(contrastRatio(black, white)).toBeCloseTo(21, 0);
  });

  it('returns 1 for same color', () => {
    const color = { r: 128, g: 128, b: 128 };
    expect(contrastRatio(color, color)).toBeCloseTo(1, 2);
  });
});
