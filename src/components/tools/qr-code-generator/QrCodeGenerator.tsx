import { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export default function QrCodeGenerator() {
  const [text, setText] = useState('https://safetools.dev');
  const [errorLevel, setErrorLevel] = useState<ErrorCorrectionLevel>('M');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderQR = useCallback(async () => {
    if (!canvasRef.current || !text.trim()) {
      setError(null);
      return;
    }
    try {
      await QRCode.toCanvas(canvasRef.current, text, {
        errorCorrectionLevel: errorLevel,
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
    }
  }, [text, errorLevel, size, fgColor, bgColor]);

  useEffect(() => {
    renderQR();
  }, [renderQR]);

  const handleDownloadPNG = useCallback(() => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrcode.png';
    a.click();
  }, []);

  const handleDownloadSVG = useCallback(async () => {
    if (!text.trim()) return;
    try {
      const svgString = await QRCode.toString(text, {
        type: 'svg',
        errorCorrectionLevel: errorLevel,
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qrcode.svg';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // SVG generation failed
    }
  }, [text, errorLevel, size, fgColor, bgColor]);

  const errorLevels: { value: ErrorCorrectionLevel; label: string }[] = [
    { value: 'L', label: 'L — Low (7%)' },
    { value: 'M', label: 'M — Medium (15%)' },
    { value: 'Q', label: 'Q — Quartile (25%)' },
    { value: 'H', label: 'H — High (30%)' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="mt-2 text-muted-foreground">
          Generate QR codes from any text or URL. All processing happens entirely in your browser
          — your data never leaves your device.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input & Options */}
        <div className="space-y-6">
          {/* Text Input */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Content
            </h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text or URL..."
              rows={4}
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Error Correction Level */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Error Correction Level
            </h2>
            <div className="flex flex-wrap gap-2">
              {errorLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setErrorLevel(level.value)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    errorLevel === level.value
                      ? 'bg-primary text-primary-foreground border-transparent'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size Slider */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Size
            </h2>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={128}
                max={512}
                step={8}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-16 text-right">{size}px</span>
            </div>
          </div>

          {/* Colors */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Colors
            </h2>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <label htmlFor="fg-color" className="text-sm text-muted-foreground">
                  Foreground
                </label>
                <input
                  id="fg-color"
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
                />
                <span className="text-sm font-mono text-muted-foreground">{fgColor}</span>
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="bg-color" className="text-sm text-muted-foreground">
                  Background
                </label>
                <input
                  id="bg-color"
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
                />
                <span className="text-sm font-mono text-muted-foreground">{bgColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Preview & Downloads */}
        <div className="space-y-6">
          <div className="rounded-lg border border-border p-6 flex flex-col items-center space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground self-start">
              Preview
            </h2>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : !text.trim() ? (
              <p className="text-sm text-muted-foreground py-12">
                Enter text or a URL to generate a QR code.
              </p>
            ) : (
              <canvas
                ref={canvasRef}
                className="rounded-md"
                style={{ imageRendering: 'pixelated' }}
              />
            )}
          </div>

          {/* Download Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadPNG}
              disabled={!text.trim() || !!error}
              className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download PNG
            </button>
            <button
              onClick={handleDownloadSVG}
              disabled={!text.trim() || !!error}
              className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
