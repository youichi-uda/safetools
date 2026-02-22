import { useState, useRef, useCallback, useMemo } from 'react';
import CopyButton from '@/components/shared/CopyButton';
import { parsePath, commandsToPath, getAllPoints } from './path-parser';

const EXAMPLE_PATHS = [
  { label: 'Triangle', path: 'M 150 50 L 250 200 L 50 200 Z' },
  { label: 'Heart', path: 'M 150 80 C 150 30 50 30 50 100 C 50 170 150 230 150 230 C 150 230 250 170 250 100 C 250 30 150 30 150 80 Z' },
  { label: 'Star', path: 'M 150 20 L 180 100 L 270 100 L 195 150 L 220 230 L 150 180 L 80 230 L 105 150 L 30 100 L 120 100 Z' },
  { label: 'Arrow', path: 'M 50 150 L 200 150 L 200 100 L 270 160 L 200 220 L 200 170 L 50 170 Z' },
];

const CANVAS_SIZE = 300;

export default function SvgPathEditor() {
  const [pathData, setPathData] = useState(EXAMPLE_PATHS[0].path);
  const [showGrid, setShowGrid] = useState(true);
  const [strokeColor, setStrokeColor] = useState('#3b82f6');
  const [fillColor, setFillColor] = useState('none');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [dragging, setDragging] = useState<{ cmdIdx: number; ptIdx: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const commands = useMemo(() => parsePath(pathData), [pathData]);
  const points = useMemo(() => getAllPoints(commands), [commands]);

  const getSvgPoint = useCallback(
    (e: React.MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * CANVAS_SIZE);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * CANVAS_SIZE);
      return { x, y };
    },
    []
  );

  const handleMouseDown = useCallback((cmdIdx: number, ptIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    setDragging({ cmdIdx, ptIdx });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const { x, y } = getSvgPoint(e);
      const newCommands = commands.map((cmd, ci) => {
        if (ci !== dragging.cmdIdx) return cmd;
        return {
          ...cmd,
          points: cmd.points.map((pt, pi) =>
            pi === dragging.ptIdx ? { x, y } : pt
          ),
        };
      });
      setPathData(commandsToPath(newCommands));
    },
    [dragging, commands, getSvgPoint]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SVG Path Editor</h1>
        <p className="mt-2 text-muted-foreground">
          Edit SVG path data visually with draggable control points. All processing happens in your
          browser.
        </p>
      </div>

      {/* Example Paths */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PATHS.map((ex) => (
          <button
            key={ex.label}
            onClick={() => setPathData(ex.path)}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Canvas */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Canvas
          </h2>
          <div className="rounded-lg border border-border overflow-hidden bg-white dark:bg-zinc-900">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
              className="w-full aspect-square cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Grid */}
              {showGrid && (
                <g opacity="0.15">
                  {Array.from({ length: Math.floor(CANVAS_SIZE / 30) + 1 }, (_, i) => (
                    <g key={i}>
                      <line x1={i * 30} y1={0} x2={i * 30} y2={CANVAS_SIZE} stroke="currentColor" strokeWidth="0.5" />
                      <line x1={0} y1={i * 30} x2={CANVAS_SIZE} y2={i * 30} stroke="currentColor" strokeWidth="0.5" />
                    </g>
                  ))}
                </g>
              )}

              {/* Path */}
              <path
                d={pathData}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Control Points */}
              {points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={5}
                  fill={strokeColor}
                  stroke="white"
                  strokeWidth={2}
                  className="cursor-grab active:cursor-grabbing"
                  onMouseDown={(e) => handleMouseDown(pt.cmdIdx, pt.ptIdx, e)}
                />
              ))}
            </svg>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded border-border"
              />
              Grid
            </label>
            <label className="flex items-center gap-2 text-sm">
              Stroke:
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              Fill:
              <select
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="rounded-md border border-border bg-transparent px-2 py-1 text-sm"
              >
                <option value="none">None</option>
                <option value={strokeColor}>Stroke color</option>
                <option value="rgba(59,130,246,0.2)">Light blue</option>
                <option value="rgba(239,68,68,0.2)">Light red</option>
                <option value="rgba(34,197,94,0.2)">Light green</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              Width:
              <input
                type="range"
                min={1}
                max={8}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-20"
              />
              <span className="font-mono text-xs w-4">{strokeWidth}</span>
            </label>
          </div>
        </div>

        {/* Path Data */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Path Data
            </h2>
            <CopyButton text={pathData} label="Copy" />
          </div>
          <textarea
            value={pathData}
            onChange={(e) => setPathData(e.target.value)}
            className="w-full h-32 rounded-lg border border-border bg-transparent px-4 py-3 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false}
          />

          {/* Command Breakdown */}
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Commands ({commands.length})
          </h2>
          <div className="space-y-1 max-h-80 overflow-auto">
            {commands.map((cmd, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md px-3 py-2 bg-accent/30 font-mono text-sm"
              >
                <span className="font-bold text-primary w-6">{cmd.type}</span>
                <span className="text-muted-foreground">
                  {cmd.type.toUpperCase() === 'Z'
                    ? 'Close path'
                    : cmd.points.map((p) => `(${p.x}, ${p.y})`).join(' → ')}
                </span>
              </div>
            ))}
          </div>

          {/* SVG Output */}
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            SVG Output
          </h2>
          <div className="relative">
            <pre className="rounded-lg border border-border bg-accent/20 px-4 py-3 font-mono text-xs overflow-auto">
              {`<svg viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">\n  <path d="${pathData}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />\n</svg>`}
            </pre>
            <div className="absolute top-2 right-2">
              <CopyButton
                text={`<svg viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">\n  <path d="${pathData}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />\n</svg>`}
                label="Copy SVG"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
