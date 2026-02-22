import { useState, useCallback, useRef } from 'react';

interface FileEntry {
  id: string;
  file: File;
  thumbnail: string;
  originalSize: number;
  strippedBlob: Blob | null;
  strippedSize: number | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  metaSummary: string;
  error?: string;
}

async function readExifSummary(file: File): Promise<string> {
  try {
    const ExifReader = await import('exifreader');
    const buffer = await file.arrayBuffer();
    const tags = ExifReader.load(buffer, { expanded: true });
    const parts: string[] = [];

    if (tags.exif) {
      const model = tags.exif.Model?.description;
      if (model) parts.push(`Camera: ${model}`);
      const date = tags.exif.DateTimeOriginal?.description;
      if (date) parts.push(`Date: ${date}`);
    }
    if (tags.gps?.Latitude && tags.gps?.Longitude) {
      parts.push(`GPS: ${tags.gps.Latitude.toFixed(4)}, ${tags.gps.Longitude.toFixed(4)}`);
    }

    const tagCount = Object.keys(tags.exif || {}).length +
      Object.keys(tags.gps || {}).length +
      Object.keys(tags.iptc || {}).length;

    if (tagCount > 0) {
      parts.push(`${tagCount} metadata tags`);
    }

    return parts.length > 0 ? parts.join(' | ') : 'No metadata found';
  } catch {
    return 'Could not read metadata';
  }
}

async function stripMetadata(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = file.type === 'image/png' ? undefined : 0.92;

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let idCounter = 0;

export default function MetadataStripper() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (fileList: FileList) => {
    const newEntries: FileEntry[] = [];

    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith('image/')) continue;

      const id = `file-${++idCounter}`;
      const thumbnail = URL.createObjectURL(file);
      const metaSummary = await readExifSummary(file);

      newEntries.push({
        id,
        file,
        thumbnail,
        originalSize: file.size,
        strippedBlob: null,
        strippedSize: null,
        status: 'pending',
        metaSummary,
      });
    }

    setFiles((prev) => [...prev, ...newEntries]);
  }, []);

  const filesRef = useRef(files);
  filesRef.current = files;

  const processFile = useCallback(async (id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'processing' as const } : f))
    );

    try {
      const currentEntry = filesRef.current.find((f) => f.id === id);
      if (!currentEntry) return;

      const blob = await stripMetadata(currentEntry.file);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, strippedBlob: blob, strippedSize: blob.size, status: 'done' as const }
            : f
        )
      );
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status: 'error' as const, error: (err as Error).message }
            : f
        )
      );
    }
  }, []);

  const processAll = useCallback(async () => {
    const pending = filesRef.current.filter((f) => f.status === 'pending');
    for (const file of pending) {
      await processFile(file.id);
    }
  }, [processFile]);

  const downloadFile = useCallback((entry: FileEntry) => {
    if (!entry.strippedBlob) return;
    const url = URL.createObjectURL(entry.strippedBlob);
    const a = document.createElement('a');
    a.href = url;
    const ext = entry.file.name.split('.').pop() || 'jpg';
    const baseName = entry.file.name.replace(/\.[^.]+$/, '');
    a.download = `${baseName}_clean.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadAll = useCallback(() => {
    files.filter((f) => f.status === 'done' && f.strippedBlob).forEach(downloadFile);
  }, [files, downloadFile]);

  const clearAll = useCallback(() => {
    files.forEach((f) => URL.revokeObjectURL(f.thumbnail));
    setFiles([]);
  }, [files]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const doneCount = files.filter((f) => f.status === 'done').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Image Metadata Stripper</h1>
        <p className="mt-2 text-muted-foreground">
          Batch strip EXIF and metadata from multiple images. All processing happens in your browser
          using the Canvas API.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border-2 border-dashed border-border hover:border-primary/50 p-12 text-center cursor-pointer transition-colors"
      >
        <div className="text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <p className="text-sm font-medium">Drop images here or click to select</p>
          <p className="text-xs mt-1">Supports JPEG, PNG, WebP — multiple files allowed</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={processAll}
            disabled={files.every((f) => f.status !== 'pending')}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Strip All ({files.filter((f) => f.status === 'pending').length} pending)
          </button>
          {doneCount > 0 && (
            <button
              onClick={downloadAll}
              className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors"
            >
              Download All ({doneCount})
            </button>
          )}
          <button
            onClick={clearAll}
            className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors ml-auto"
          >
            Clear
          </button>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-border p-4 flex items-center gap-4"
            >
              {/* Thumbnail */}
              <img
                src={entry.thumbnail}
                alt={entry.file.name}
                className="w-16 h-16 object-cover rounded-md border border-border shrink-0"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{entry.file.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatSize(entry.originalSize)}
                  {entry.strippedSize !== null && (
                    <> → {formatSize(entry.strippedSize)}{entry.strippedSize <= entry.originalSize
                      ? ` (${Math.round((1 - entry.strippedSize / entry.originalSize) * 100)}% smaller)`
                      : ''}</>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {entry.metaSummary}
                </p>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {entry.status === 'pending' && (
                  <button
                    onClick={() => processFile(entry.id)}
                    className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Strip
                  </button>
                )}
                {entry.status === 'processing' && (
                  <span className="text-xs text-muted-foreground animate-pulse">Processing...</span>
                )}
                {entry.status === 'done' && (
                  <>
                    <span className="text-xs text-safe">Cleaned</span>
                    <button
                      onClick={() => downloadFile(entry)}
                      className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-accent transition-colors"
                    >
                      Download
                    </button>
                  </>
                )}
                {entry.status === 'error' && (
                  <span className="text-xs text-destructive">{entry.error}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
