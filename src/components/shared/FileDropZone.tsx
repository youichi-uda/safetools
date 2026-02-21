import { useState, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
  onFileContent: (content: string) => void;
  accept?: string;
  children: ReactNode;
  className?: string;
}

export default function FileDropZone({ onFileContent, accept, children, className }: FileDropZoneProps) {
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') onFileContent(text);
      };
      reader.readAsText(file);
    },
    [onFileContent],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn('relative', dragging && 'ring-2 ring-safe ring-offset-2 ring-offset-background rounded-lg', className)}
    >
      {children}
      {dragging && (
        <div className="absolute inset-0 bg-safe/10 rounded-lg flex items-center justify-center pointer-events-none z-10">
          <span className="text-safe font-medium text-sm">Drop file here</span>
        </div>
      )}
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
