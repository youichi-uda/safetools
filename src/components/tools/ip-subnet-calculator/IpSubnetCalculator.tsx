import { useState, useCallback, useMemo } from 'react';
import CopyButton from '@/components/shared/CopyButton';

export function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function longToIp(long: number): string {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255,
  ].join('.');
}

export function isValidIp(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = Number(p);
    return /^\d{1,3}$/.test(p) && n >= 0 && n <= 255;
  });
}

export function getIpClass(ip: string): string {
  const first = parseInt(ip.split('.')[0], 10);
  if (first >= 0 && first <= 127) return 'A';
  if (first >= 128 && first <= 191) return 'B';
  if (first >= 192 && first <= 223) return 'C';
  if (first >= 224 && first <= 239) return 'D';
  return 'E';
}

export function getIpType(ip: string): string {
  const parts = ip.split('.').map(Number);
  if (parts[0] === 10) return 'Private';
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return 'Private';
  if (parts[0] === 192 && parts[1] === 168) return 'Private';
  if (parts[0] === 127) return 'Loopback';
  if (parts[0] === 169 && parts[1] === 254) return 'Link-Local';
  if (parts[0] >= 224 && parts[0] <= 239) return 'Multicast';
  if (parts[0] >= 240) return 'Reserved';
  return 'Public';
}

export function calculate(ip: string, prefix: number) {
  const ipLong = ipToLong(ip);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const network = (ipLong & mask) >>> 0;
  const broadcast = (network | ~mask) >>> 0;
  const firstHost = prefix <= 30 ? network + 1 : network;
  const lastHost = prefix <= 30 ? broadcast - 1 : broadcast;
  const totalAddresses = Math.pow(2, 32 - prefix);
  const usableHosts = prefix <= 30 ? totalAddresses - 2 : prefix === 31 ? 2 : 1;
  return {
    network: longToIp(network),
    broadcast: longToIp(broadcast),
    mask: longToIp(mask),
    wildcard: longToIp(~mask >>> 0),
    firstHost: longToIp(firstHost),
    lastHost: longToIp(lastHost),
    totalAddresses,
    usableHosts,
  };
}

const CHEAT_SHEET = Array.from({ length: 25 }, (_, i) => {
  const prefix = 8 + i;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const totalAddresses = Math.pow(2, 32 - prefix);
  const usableHosts = prefix <= 30 ? totalAddresses - 2 : prefix === 31 ? 2 : 1;
  return {
    prefix,
    mask: longToIp(mask),
    totalAddresses: totalAddresses.toLocaleString(),
    usableHosts: usableHosts.toLocaleString(),
  };
});

const PRESETS = [8, 16, 24, 28, 30, 32];

export default function IpSubnetCalculator() {
  const [ipInput, setIpInput] = useState('192.168.1.0');
  const [prefix, setPrefix] = useState(24);
  const [error, setError] = useState<string | null>(null);

  const parseInput = useCallback(
    (rawIp: string, rawPrefix: number) => {
      let ip = rawIp.trim();
      let cidr = rawPrefix;

      if (ip.includes('/')) {
        const parts = ip.split('/');
        ip = parts[0];
        const parsedCidr = parseInt(parts[1], 10);
        if (!isNaN(parsedCidr) && parsedCidr >= 0 && parsedCidr <= 32) {
          cidr = parsedCidr;
        }
      }

      return { ip, cidr };
    },
    []
  );

  const result = useMemo(() => {
    const { ip, cidr } = parseInput(ipInput, prefix);

    if (!ip) {
      setError(null);
      return null;
    }

    if (!isValidIp(ip)) {
      setError('Invalid IPv4 address. Use format like 192.168.1.0');
      return null;
    }

    setError(null);
    const calc = calculate(ip, cidr);
    return {
      ...calc,
      cidrNotation: `${calc.network}/${cidr}`,
      ipClass: getIpClass(ip),
      ipType: getIpType(ip),
      prefix: cidr,
    };
  }, [ipInput, prefix, parseInput]);

  const handleIpChange = useCallback(
    (value: string) => {
      setIpInput(value);
      if (value.includes('/')) {
        const parts = value.split('/');
        const parsedCidr = parseInt(parts[1], 10);
        if (!isNaN(parsedCidr) && parsedCidr >= 0 && parsedCidr <= 32) {
          setPrefix(parsedCidr);
        }
      }
    },
    []
  );

  const handlePreset = useCallback(
    (p: number) => {
      setPrefix(p);
    },
    []
  );

  const allResultsText = result
    ? [
        `Network Address: ${result.network}`,
        `Broadcast Address: ${result.broadcast}`,
        `Subnet Mask: ${result.mask}`,
        `Wildcard Mask: ${result.wildcard}`,
        `First Host: ${result.firstHost}`,
        `Last Host: ${result.lastHost}`,
        `Total Hosts: ${result.usableHosts.toLocaleString()}`,
        `Total Addresses: ${result.totalAddresses.toLocaleString()}`,
        `CIDR Notation: ${result.cidrNotation}`,
        `IP Class: ${result.ipClass}`,
        `IP Type: ${result.ipType}`,
      ].join('\n')
    : '';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">IP / Subnet Calculator</h1>
        <p className="mt-2 text-muted-foreground">
          Calculate network details from an IPv4 address and CIDR prefix. All processing happens
          entirely in your browser — your data never leaves your device.
        </p>
      </div>

      {/* Input */}
      <div className="rounded-lg border border-border p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="ip-input" className="block text-sm font-medium mb-1.5">
              IPv4 Address
            </label>
            <input
              id="ip-input"
              type="text"
              value={ipInput}
              onChange={(e) => handleIpChange(e.target.value)}
              placeholder="192.168.1.0 or 192.168.1.0/24"
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="w-full sm:w-32">
            <label htmlFor="prefix-input" className="block text-sm font-medium mb-1.5">
              CIDR Prefix
            </label>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">/</span>
              <input
                id="prefix-input"
                type="number"
                min={0}
                max={32}
                value={prefix}
                onChange={(e) => {
                  const val = Math.min(32, Math.max(0, Number(e.target.value) || 0));
                  setPrefix(val);
                }}
                className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Presets:</span>
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => handlePreset(p)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                prefix === p
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'border-border hover:bg-accent'
              }`}
            >
              /{p}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="rounded-lg border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Calculation Results
            </h2>
            <CopyButton text={allResultsText} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ResultRow label="Network Address" value={result.network} />
            <ResultRow label="Broadcast Address" value={result.broadcast} />
            <ResultRow label="Subnet Mask" value={result.mask} />
            <ResultRow label="Wildcard Mask" value={result.wildcard} />
            <ResultRow label="First Host" value={result.firstHost} />
            <ResultRow label="Last Host" value={result.lastHost} />
            <ResultRow label="Total Hosts" value={result.usableHosts.toLocaleString()} />
            <ResultRow label="Total Addresses" value={result.totalAddresses.toLocaleString()} />
            <ResultRow label="CIDR Notation" value={result.cidrNotation} />
            <ResultRow label="IP Class" value={result.ipClass} />
            <ResultRow label="IP Type" value={result.ipType} />
          </div>
        </div>
      )}

      {/* Cheat Sheet */}
      <div className="rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Subnet Cheat Sheet
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 font-medium text-muted-foreground">CIDR</th>
                <th className="py-2 pr-4 font-medium text-muted-foreground">Subnet Mask</th>
                <th className="py-2 pr-4 font-medium text-muted-foreground">Total Addresses</th>
                <th className="py-2 font-medium text-muted-foreground">Usable Hosts</th>
              </tr>
            </thead>
            <tbody>
              {CHEAT_SHEET.map((row) => (
                <tr
                  key={row.prefix}
                  className={`border-b border-border/50 ${
                    result && result.prefix === row.prefix ? 'bg-accent' : ''
                  }`}
                >
                  <td className="py-1.5 pr-4 font-mono">/{row.prefix}</td>
                  <td className="py-1.5 pr-4 font-mono">{row.mask}</td>
                  <td className="py-1.5 pr-4 font-mono">{row.totalAddresses}</td>
                  <td className="py-1.5 font-mono">{row.usableHosts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-accent/30 px-4 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-medium">{value}</span>
        <CopyButton text={value} />
      </div>
    </div>
  );
}
