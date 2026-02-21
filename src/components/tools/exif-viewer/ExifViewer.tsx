import { useState, useCallback, useRef } from 'react';
import ExifReader from 'exifreader';

interface ExifCategory {
  label: string;
  fields: { key: string; label: string }[];
}

const EXIF_CATEGORIES: ExifCategory[] = [
  {
    label: 'Camera',
    fields: [
      { key: 'Make', label: 'Make' },
      { key: 'Model', label: 'Model' },
      { key: 'Software', label: 'Software' },
    ],
  },
  {
    label: 'Photo',
    fields: [
      { key: 'ExposureTime', label: 'Exposure Time' },
      { key: 'FNumber', label: 'F-Number' },
      { key: 'ISOSpeedRatings', label: 'ISO' },
      { key: 'FocalLength', label: 'Focal Length' },
      { key: 'Flash', label: 'Flash' },
    ],
  },
  {
    label: 'Date',
    fields: [
      { key: 'DateTimeOriginal', label: 'Date Taken' },
      { key: 'DateTimeDigitized', label: 'Date Digitized' },
    ],
  },
  {
    label: 'GPS',
    fields: [
      { key: 'GPSLatitude', label: 'Latitude' },
      { key: 'GPSLongitude', label: 'Longitude' },
    ],
  },
  {
    label: 'Image',
    fields: [
      { key: 'Image Width', label: 'Width' },
      { key: 'Image Height', label: 'Height' },
      { key: 'Orientation', label: 'Orientation' },
    ],
  },
];

function formatGpsCoordinate(
  tags: Record<string, any>,
  key: 'GPSLatitude' | 'GPSLongitude'
): string | null {
  const tag = tags[key];
  if (!tag) return null;

  // ExifReader may provide a description string directly
  if (tag.description) return `${tag.description}`;

  return null;
}

function getTagValue(tags: Record<string, any>, key: string): string | null {
  if (key === 'GPSLatitude' || key === 'GPSLongitude') {
    return formatGpsCoordinate(tags, key);
  }

  const tag = tags[key];
  if (!tag) return null;

  if (tag.description !== undefined && tag.description !== '') {
    return String(tag.description);
  }

  if (tag.value !== undefined) {
    return String(tag.value);
  }

  return null;
}

function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'bmp':
      return 'image/bmp';
    default:
      return 'image/jpeg';
  }
}

export default function ExifViewer() {
  const [tags, setTags] = useState<Record<string, any> | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [strippedUrl, setStrippedUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isStripping, setIsStripping] = useState(false);
  const [hasExif, setHasExif] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (strippedUrl) URL.revokeObjectURL(strippedUrl);
    setTags(null);
    setPreviewUrl(null);
    setStrippedUrl(null);
    setFileName('');
    setError(null);
    setHasExif(false);
    setIsStripping(false);
  }, [previewUrl, strippedUrl]);

  const processFile = useCallback(
    async (file: File) => {
      reset();
      setFileName(file.name);
      setMimeType(getMimeType(file.name));

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const exifTags = ExifReader.load(arrayBuffer);

        // Check if there is any meaningful EXIF data
        const meaningfulKeys = Object.keys(exifTags).filter(
          (k) => k !== 'MakerNote' && k !== 'UserComment'
        );

        if (meaningfulKeys.length === 0) {
          setHasExif(false);
          setTags(null);
        } else {
          setHasExif(true);
          setTags(exifTags);
        }

        setError(null);
      } catch {
        setTags(null);
        setHasExif(false);
        setError(null); // Not an error — just no EXIF data
      }
    },
    [reset]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleStripExif = useCallback(() => {
    if (!previewUrl) return;
    setIsStripping(true);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setStrippedUrl(url);
          }
          setIsStripping(false);
        },
        mimeType,
        mimeType === 'image/jpeg' ? 0.95 : undefined
      );
    };
    img.onerror = () => {
      setError('Failed to process image for EXIF stripping.');
      setIsStripping(false);
    };
    img.src = previewUrl;
  }, [previewUrl, mimeType]);

  const handleDownloadStripped = useCallback(() => {
    if (!strippedUrl) return;
    const ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
    const baseName = fileName.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = strippedUrl;
    a.download = `${baseName}-stripped.${ext}`;
    a.click();
  }, [strippedUrl, fileName, mimeType]);

  const hasGps =
    tags && (getTagValue(tags, 'GPSLatitude') || getTagValue(tags, 'GPSLongitude'));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="mt-2 text-muted-foreground">
          View hidden metadata in your photos and strip it before sharing. All processing
          happens entirely in your browser — your images never leave your device.
        </p>
      </div>

      {/* File Drop Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-accent/50'
            : 'border-border hover:border-primary/50 hover:bg-accent/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="space-y-2">
          <div className="text-4xl text-muted-foreground">📷</div>
          <p className="text-sm font-medium">Drop an image here or click to select</p>
          <p className="text-xs text-muted-foreground">
            Supports JPEG, PNG, WebP, TIFF, and other image formats
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {previewUrl && (
        <>
          {/* Image Preview + Actions */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <div className="flex items-start gap-6 flex-col sm:flex-row">
              <div className="shrink-0">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 max-w-48 rounded-md border border-border object-contain"
                />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {hasExif ? (
                      <span className="text-safe">EXIF data found</span>
                    ) : (
                      'No EXIF data found'
                    )}
                  </p>
                  {hasGps && (
                    <p className="text-xs text-destructive mt-1 font-medium">
                      Warning: This image contains GPS location data
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleStripExif}
                    disabled={isStripping || !!strippedUrl}
                    className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isStripping
                      ? 'Stripping...'
                      : strippedUrl
                        ? 'EXIF Stripped'
                        : 'Strip EXIF & Download'}
                  </button>
                  {strippedUrl && (
                    <button
                      onClick={handleDownloadStripped}
                      className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
                    >
                      Download Stripped Image
                    </button>
                  )}
                  <button
                    onClick={reset}
                    className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors text-destructive"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* EXIF Data Table */}
          {hasExif && tags && (
            <div className="space-y-4">
              {EXIF_CATEGORIES.map((category) => {
                const rows = category.fields
                  .map((field) => ({
                    label: field.label,
                    value: getTagValue(tags, field.key),
                  }))
                  .filter((row) => row.value !== null);

                if (rows.length === 0) return null;

                return (
                  <div key={category.label} className="rounded-lg border border-border overflow-hidden">
                    <div className="bg-accent px-4 py-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {category.label}
                      </h3>
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        {rows.map((row, i) => (
                          <tr
                            key={row.label}
                            className={i % 2 === 0 ? 'bg-transparent' : 'bg-accent/30'}
                          >
                            <td className="px-4 py-2 font-medium text-muted-foreground w-1/3">
                              {row.label}
                            </td>
                            <td
                              className={`px-4 py-2 font-mono ${
                                category.label === 'GPS' ? 'text-destructive' : ''
                              }`}
                            >
                              {row.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}

              {/* All Tags (collapsed) */}
              <details className="rounded-lg border border-border">
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:bg-accent transition-colors">
                  All Metadata Tags ({Object.keys(tags).length})
                </summary>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {Object.entries(tags)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([key, tag], i) => {
                          const value =
                            (tag as any)?.description !== undefined
                              ? String((tag as any).description)
                              : (tag as any)?.value !== undefined
                                ? String((tag as any).value)
                                : '—';
                          // Skip very long binary values
                          if (value.length > 200) return null;
                          return (
                            <tr
                              key={key}
                              className={i % 2 === 0 ? 'bg-transparent' : 'bg-accent/30'}
                            >
                              <td className="px-4 py-1.5 font-medium text-muted-foreground w-1/3 text-xs">
                                {key}
                              </td>
                              <td className="px-4 py-1.5 font-mono text-xs break-all">
                                {value}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          )}

          {/* No EXIF Data Message */}
          {!hasExif && (
            <div className="rounded-lg border border-border p-6 text-center">
              <p className="text-muted-foreground">
                No EXIF metadata found in this image. The image may have been previously
                stripped or saved without metadata.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
