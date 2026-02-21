import { useState, useCallback, useRef, useEffect } from 'react';

type OutputFormat = 'png' | 'jpeg' | 'webp';

interface ImageInfo {
  name: string;
  size: number;
  width: number;
  height: number;
  dataUrl: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageConverter() {
  const [original, setOriginal] = useState<ImageInfo | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number>(0);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('webp');
  const [quality, setQuality] = useState<number>(0.92);
  const [resizeWidth, setResizeWidth] = useState<number>(0);
  const [resizeHeight, setResizeHeight] = useState<number>(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aspectRatioRef = useRef<number>(1);

  const loadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const info: ImageInfo = {
          name: file.name,
          size: file.size,
          width: img.width,
          height: img.height,
          dataUrl,
        };
        setOriginal(info);
        setResizeWidth(img.width);
        setResizeHeight(img.height);
        aspectRatioRef.current = img.width / img.height;
        setConvertedUrl(null);
        setConvertedSize(0);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadImage(file);
    },
    [loadImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        loadImage(file);
      }
    },
    [loadImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleWidthChange = useCallback(
    (value: number) => {
      setResizeWidth(value);
      if (maintainAspectRatio && value > 0) {
        setResizeHeight(Math.round(value / aspectRatioRef.current));
      }
    },
    [maintainAspectRatio]
  );

  const handleHeightChange = useCallback(
    (value: number) => {
      setResizeHeight(value);
      if (maintainAspectRatio && value > 0) {
        setResizeWidth(Math.round(value * aspectRatioRef.current));
      }
    },
    [maintainAspectRatio]
  );

  const handleConvert = useCallback(() => {
    if (!original) return;
    setIsConverting(true);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const targetWidth = resizeWidth || original.width;
      const targetHeight = resizeHeight || original.height;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // For JPEG, fill with white background (no alpha support)
      if (outputFormat === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const mimeType = `image/${outputFormat}`;
      const useQuality = outputFormat === 'png' ? undefined : quality;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Revoke previous URL
            if (convertedUrl) {
              URL.revokeObjectURL(convertedUrl);
            }
            const url = URL.createObjectURL(blob);
            setConvertedUrl(url);
            setConvertedSize(blob.size);
          }
          setIsConverting(false);
        },
        mimeType,
        useQuality
      );
    };
    img.src = original.dataUrl;
  }, [original, resizeWidth, resizeHeight, outputFormat, quality, convertedUrl]);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (convertedUrl) {
        URL.revokeObjectURL(convertedUrl);
      }
    };
  }, [convertedUrl]);

  const handleDownload = useCallback(() => {
    if (!convertedUrl || !original) return;
    const ext = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
    const baseName = original.name.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = convertedUrl;
    a.download = `${baseName}.${ext}`;
    a.click();
  }, [convertedUrl, original, outputFormat]);

  const handleReset = useCallback(() => {
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
    }
    setOriginal(null);
    setConvertedUrl(null);
    setConvertedSize(0);
    setResizeWidth(0);
    setResizeHeight(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [convertedUrl]);

  const showQualitySlider = outputFormat === 'jpeg' || outputFormat === 'webp';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="mt-2 text-muted-foreground">
          Convert images between PNG, JPEG, and WebP formats with optional resizing.
          All processing happens entirely in your browser using the Canvas API — your
          images never leave your device.
        </p>
      </div>

      {/* Hidden canvas for conversion */}
      <canvas ref={canvasRef} className="hidden" />

      {/* File Drop Area */}
      {!original && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-accent/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
            <p className="text-lg font-medium">
              Drop an image here or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              Supports PNG, JPEG, WebP, GIF, BMP, SVG, and more
            </p>
          </div>
        </div>
      )}

      {/* Conversion Options */}
      {original && (
        <>
          {/* Options Panel */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Conversion Options
            </h2>

            {/* Output Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Output Format</label>
              <div className="flex flex-wrap gap-2">
                {(['png', 'jpeg', 'webp'] as OutputFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setOutputFormat(fmt)}
                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      outputFormat === fmt
                        ? 'bg-primary text-primary-foreground border-transparent'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider */}
            {showQualitySlider && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Quality: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.01"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10%</span>
                  <span>100%</span>
                </div>
              </div>
            )}

            {/* Resize Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Resize</label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="resize-width" className="text-sm text-muted-foreground">
                    W:
                  </label>
                  <input
                    id="resize-width"
                    type="number"
                    min={1}
                    value={resizeWidth}
                    onChange={(e) =>
                      handleWidthChange(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-24 rounded-md border border-border bg-transparent px-3 py-1.5 text-sm"
                  />
                </div>
                <span className="text-muted-foreground">&times;</span>
                <div className="flex items-center gap-2">
                  <label htmlFor="resize-height" className="text-sm text-muted-foreground">
                    H:
                  </label>
                  <input
                    id="resize-height"
                    type="number"
                    min={1}
                    value={resizeHeight}
                    onChange={(e) =>
                      handleHeightChange(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-24 rounded-md border border-border bg-transparent px-3 py-1.5 text-sm"
                  />
                </div>
                <span className="text-xs text-muted-foreground">px</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintainAspectRatio}
                  onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                  className="accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  Maintain aspect ratio
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleConvert}
              disabled={isConverting}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isConverting ? 'Converting...' : 'Convert'}
            </button>
            {convertedUrl && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors"
              >
                Download
              </button>
            )}
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors text-destructive"
            >
              Reset
            </button>
          </div>

          {/* File Size Comparison */}
          {convertedUrl && (
            <div className="rounded-lg border border-border p-4 space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                File Size Comparison
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Original: </span>
                  <span className="font-medium">{formatFileSize(original.size)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Converted: </span>
                  <span className="font-medium">{formatFileSize(convertedSize)}</span>
                </div>
              </div>
              {convertedSize < original.size ? (
                <p className="text-sm text-safe font-medium">
                  {Math.round((1 - convertedSize / original.size) * 100)}% smaller
                </p>
              ) : convertedSize > original.size ? (
                <p className="text-sm text-destructive font-medium">
                  {Math.round((convertedSize / original.size - 1) * 100)}% larger
                </p>
              ) : null}
            </div>
          )}

          {/* Image Previews */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Preview */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Original
              </h2>
              <div className="overflow-hidden rounded-md bg-accent/30 flex items-center justify-center min-h-[200px]">
                <img
                  src={original.dataUrl}
                  alt="Original"
                  className="max-w-full max-h-[400px] object-contain"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {original.name} &mdash; {original.width} &times; {original.height} &mdash;{' '}
                {formatFileSize(original.size)}
              </p>
            </div>

            {/* Converted Preview */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Converted
              </h2>
              <div className="overflow-hidden rounded-md bg-accent/30 flex items-center justify-center min-h-[200px]">
                {convertedUrl ? (
                  <img
                    src={convertedUrl}
                    alt="Converted"
                    className="max-w-full max-h-[400px] object-contain"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click Convert to see the result
                  </p>
                )}
              </div>
              {convertedUrl && (
                <p className="text-xs text-muted-foreground">
                  {outputFormat.toUpperCase()} &mdash; {resizeWidth} &times; {resizeHeight}{' '}
                  &mdash; {formatFileSize(convertedSize)}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
