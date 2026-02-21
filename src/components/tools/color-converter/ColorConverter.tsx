import { useState, useCallback, useMemo } from 'react';
import CopyButton from '@/components/shared/CopyButton';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface OKLCH {
  l: number;
  c: number;
  h: number;
}

// --- Color math utilities ---

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): RGB | null {
  const cleaned = hex.replace(/^#/, '');
  let fullHex = cleaned;
  if (fullHex.length === 3) {
    fullHex = fullHex[0] + fullHex[0] + fullHex[1] + fullHex[1] + fullHex[2] + fullHex[2];
  }
  if (!/^[0-9a-fA-F]{6}$/.test(fullHex)) return null;
  return {
    r: parseInt(fullHex.slice(0, 2), 16),
    g: parseInt(fullHex.slice(2, 4), 16),
    b: parseInt(fullHex.slice(4, 6), 16),
  };
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

// Approximate RGB to OKLCH conversion
function rgbToOklch(rgb: RGB): OKLCH {
  // Linear sRGB
  const toLinear = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lr = toLinear(rgb.r);
  const lg = toLinear(rgb.g);
  const lb = toLinear(rgb.b);

  // Linear sRGB to LMS (using OKLab matrix)
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_c = Math.cbrt(l_);
  const m_c = Math.cbrt(m_);
  const s_c = Math.cbrt(s_);

  const L = 0.2104542553 * l_c + 0.7936177850 * m_c - 0.0040720468 * s_c;
  const a = 1.9779984951 * l_c - 2.4285922050 * m_c + 0.4505937099 * s_c;
  const b = 0.0259040371 * l_c + 0.7827717662 * m_c - 0.8086757660 * s_c;

  const C = Math.sqrt(a * a + b * b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return {
    l: parseFloat(L.toFixed(4)),
    c: parseFloat(C.toFixed(4)),
    h: parseFloat(H.toFixed(1)),
  };
}

// Approximate OKLCH to RGB conversion
function oklchToRgb(oklch: OKLCH): RGB {
  const L = oklch.l;
  const C = oklch.c;
  const H = (oklch.h * Math.PI) / 180;

  const a = C * Math.cos(H);
  const b = C * Math.sin(H);

  const l_c = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_c = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_c = L - 0.0894841775 * a - 1.2914855480 * b;

  const l_ = l_c * l_c * l_c;
  const m_ = m_c * m_c * m_c;
  const s_ = s_c * s_c * s_c;

  // LMS to linear sRGB
  const lr = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const lg = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const lb = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;

  const fromLinear = (c: number) => {
    const clamped = clamp(c, 0, 1);
    return clamped <= 0.0031308
      ? clamped * 12.92
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  return {
    r: Math.round(clamp(fromLinear(lr) * 255, 0, 255)),
    g: Math.round(clamp(fromLinear(lg) * 255, 0, 255)),
    b: Math.round(clamp(fromLinear(lb) * 255, 0, 255)),
  };
}

// Relative luminance for WCAG contrast
function relativeLuminance(rgb: RGB): number {
  const toLinear = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

function contrastRatio(rgb1: RGB, rgb2: RGB): number {
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#000000',
  '#ffffff',
];

export default function ColorConverter() {
  const [rgb, setRgb] = useState<RGB>({ r: 255, g: 107, b: 53 });

  const hex = useMemo(() => rgbToHex(rgb), [rgb]);
  const hsl = useMemo(() => rgbToHsl(rgb), [rgb]);
  const oklch = useMemo(() => rgbToOklch(rgb), [rgb]);

  const hexStr = hex;
  const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  const oklchStr = `oklch(${oklch.l} ${oklch.c} ${oklch.h})`;

  const updateFromHex = useCallback((value: string) => {
    const parsed = hexToRgb(value);
    if (parsed) setRgb(parsed);
  }, []);

  const updateFromRgb = useCallback((channel: 'r' | 'g' | 'b', value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    setRgb((prev) => ({ ...prev, [channel]: clamp(num, 0, 255) }));
  }, []);

  const updateFromHsl = useCallback((channel: 'h' | 's' | 'l', value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    const maxVal = channel === 'h' ? 360 : 100;
    const newHsl = { ...rgbToHsl(rgb), [channel]: clamp(num, 0, maxVal) };
    // We need current HSL to update, but we recalculate from current rgb
    setRgb(hslToRgb(newHsl));
  }, [rgb]);

  const updateFromOklch = useCallback((channel: 'l' | 'c' | 'h', value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const currentOklch = rgbToOklch(rgb);
    const maxVal = channel === 'l' ? 1 : channel === 'c' ? 0.4 : 360;
    const newOklch = { ...currentOklch, [channel]: clamp(num, 0, maxVal) };
    setRgb(oklchToRgb(newOklch));
  }, [rgb]);

  const randomColor = useCallback(() => {
    setRgb({
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256),
    });
  }, []);

  const contrastWhite = useMemo(() => contrastRatio(rgb, { r: 255, g: 255, b: 255 }), [rgb]);
  const contrastBlack = useMemo(() => contrastRatio(rgb, { r: 0, g: 0, b: 0 }), [rgb]);

  const wcagLabel = (ratio: number) => {
    if (ratio >= 7) return { level: 'AAA', pass: true };
    if (ratio >= 4.5) return { level: 'AA', pass: true };
    return { level: 'Fail', pass: false };
  };

  const wcagWhite = wcagLabel(contrastWhite);
  const wcagBlack = wcagLabel(contrastBlack);

  const inputClass =
    'w-full px-2 py-1.5 text-sm rounded-md border border-border bg-transparent focus:outline-none focus:ring-1 focus:ring-primary';
  const numberInputClass =
    'w-full px-2 py-1.5 text-sm rounded-md border border-border bg-transparent focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
  const labelClass = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Color Converter</h1>
        <p className="text-muted-foreground text-sm mb-4">
          Convert colors between HEX, RGB, HSL, and OKLCH. All processing happens in your browser.
        </p>
      </div>

      {/* Color preview swatch */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-full rounded-xl border border-border shadow-sm"
          style={{ backgroundColor: hex, minHeight: 120 }}
        />
        <div className="flex items-center gap-2">
          <label className="relative cursor-pointer">
            <input
              type="color"
              value={hex}
              onChange={(e) => updateFromHex(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
            <span className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors inline-block">
              Pick Color
            </span>
          </label>
          <button
            onClick={randomColor}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Random
          </button>
        </div>
      </div>

      {/* Preset colors */}
      <div>
        <p className={`${labelClass} mb-2`}>Presets</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => updateFromHex(color)}
              className="w-8 h-8 rounded-md border border-border hover:scale-110 transition-transform shadow-sm"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* HEX input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={labelClass}>HEX</label>
          <CopyButton text={hexStr} />
        </div>
        <input
          type="text"
          value={hex}
          onChange={(e) => updateFromHex(e.target.value)}
          placeholder="#ff6b35"
          className={inputClass}
        />
      </div>

      {/* RGB inputs */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={labelClass}>RGB</label>
          <CopyButton text={rgbStr} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-xs text-muted-foreground">R</span>
            <input
              type="number"
              min={0}
              max={255}
              value={rgb.r}
              onChange={(e) => updateFromRgb('r', e.target.value)}
              className={numberInputClass}
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">G</span>
            <input
              type="number"
              min={0}
              max={255}
              value={rgb.g}
              onChange={(e) => updateFromRgb('g', e.target.value)}
              className={numberInputClass}
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">B</span>
            <input
              type="number"
              min={0}
              max={255}
              value={rgb.b}
              onChange={(e) => updateFromRgb('b', e.target.value)}
              className={numberInputClass}
            />
          </div>
        </div>
      </div>

      {/* HSL inputs */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={labelClass}>HSL</label>
          <CopyButton text={hslStr} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-xs text-muted-foreground">H</span>
            <input
              type="number"
              min={0}
              max={360}
              value={hsl.h}
              onChange={(e) => updateFromHsl('h', e.target.value)}
              className={numberInputClass}
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">S%</span>
            <input
              type="number"
              min={0}
              max={100}
              value={hsl.s}
              onChange={(e) => updateFromHsl('s', e.target.value)}
              className={numberInputClass}
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">L%</span>
            <input
              type="number"
              min={0}
              max={100}
              value={hsl.l}
              onChange={(e) => updateFromHsl('l', e.target.value)}
              className={numberInputClass}
            />
          </div>
        </div>
      </div>

      {/* OKLCH inputs */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={labelClass}>OKLCH</label>
          <CopyButton text={oklchStr} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-xs text-muted-foreground">L</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={oklch.l}
              onChange={(e) => updateFromOklch('l', e.target.value)}
              className={numberInputClass}
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">C</span>
            <input
              type="number"
              min={0}
              max={0.4}
              step={0.001}
              value={oklch.c}
              onChange={(e) => updateFromOklch('c', e.target.value)}
              className={numberInputClass}
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">H</span>
            <input
              type="number"
              min={0}
              max={360}
              step={0.1}
              value={oklch.h}
              onChange={(e) => updateFromOklch('h', e.target.value)}
              className={numberInputClass}
            />
          </div>
        </div>
      </div>

      {/* Contrast checker */}
      <div className="space-y-1.5">
        <p className={`${labelClass} mb-2`}>Contrast Checker</p>
        <div className="grid grid-cols-2 gap-3">
          {/* White text on color */}
          <div
            className="rounded-lg p-4 text-center border border-border"
            style={{ backgroundColor: hex }}
          >
            <p className="font-semibold text-white text-sm">White Text</p>
            <p className="text-white text-xs mt-1">{contrastWhite.toFixed(2)}:1</p>
            <span
              className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${
                wcagWhite.pass
                  ? 'bg-safe/10 text-safe'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {wcagWhite.level}
            </span>
          </div>
          {/* Black text on color */}
          <div
            className="rounded-lg p-4 text-center border border-border"
            style={{ backgroundColor: hex }}
          >
            <p className="font-semibold text-black text-sm">Black Text</p>
            <p className="text-black text-xs mt-1">{contrastBlack.toFixed(2)}:1</p>
            <span
              className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${
                wcagBlack.pass
                  ? 'bg-safe/10 text-safe'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {wcagBlack.level}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
