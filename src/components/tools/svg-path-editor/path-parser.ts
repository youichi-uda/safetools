export interface PathCommand {
  type: string;
  points: { x: number; y: number }[];
}

export function parsePath(d: string): PathCommand[] {
  const commands: PathCommand[] = [];
  const regex = /([MmLlHhVvCcSsQqTtAaZz])\s*([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(d)) !== null) {
    const type = match[1];
    const argsStr = match[2].trim();
    const nums = argsStr.match(/-?\d+\.?\d*(?:e[+-]?\d+)?/gi)?.map(Number) || [];

    const points: { x: number; y: number }[] = [];

    switch (type.toUpperCase()) {
      case 'M':
      case 'L':
      case 'T':
        for (let i = 0; i < nums.length; i += 2) {
          points.push({ x: nums[i] ?? 0, y: nums[i + 1] ?? 0 });
        }
        break;
      case 'H':
        for (const n of nums) points.push({ x: n, y: 0 });
        break;
      case 'V':
        for (const n of nums) points.push({ x: 0, y: n });
        break;
      case 'C':
        for (let i = 0; i < nums.length; i += 2) {
          points.push({ x: nums[i] ?? 0, y: nums[i + 1] ?? 0 });
        }
        break;
      case 'S':
      case 'Q':
        for (let i = 0; i < nums.length; i += 2) {
          points.push({ x: nums[i] ?? 0, y: nums[i + 1] ?? 0 });
        }
        break;
      case 'A':
        // Arc: rx ry rotation large-arc sweep x y
        for (let i = 0; i < nums.length; i += 7) {
          points.push({ x: nums[i + 5] ?? 0, y: nums[i + 6] ?? 0 });
        }
        break;
      case 'Z':
        break;
    }

    commands.push({ type, points });
  }

  return commands;
}

export function commandsToPath(commands: PathCommand[]): string {
  return commands
    .map((cmd) => {
      if (cmd.type.toUpperCase() === 'Z') return cmd.type;
      if (cmd.type.toUpperCase() === 'H') {
        return `${cmd.type} ${cmd.points.map((p) => p.x).join(' ')}`;
      }
      if (cmd.type.toUpperCase() === 'V') {
        return `${cmd.type} ${cmd.points.map((p) => p.y).join(' ')}`;
      }
      const coords = cmd.points.map((p) => `${p.x} ${p.y}`).join(' ');
      return `${cmd.type} ${coords}`;
    })
    .join(' ');
}

export function getAllPoints(commands: PathCommand[]): { cmdIdx: number; ptIdx: number; x: number; y: number }[] {
  const result: { cmdIdx: number; ptIdx: number; x: number; y: number }[] = [];
  commands.forEach((cmd, cmdIdx) => {
    cmd.points.forEach((pt, ptIdx) => {
      if (cmd.type.toUpperCase() !== 'H' && cmd.type.toUpperCase() !== 'V') {
        result.push({ cmdIdx, ptIdx, x: pt.x, y: pt.y });
      }
    });
  });
  return result;
}
