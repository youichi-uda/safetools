import { describe, it, expect } from 'vitest';
import {
  ipToLong,
  longToIp,
  isValidIp,
  getIpClass,
  getIpType,
  calculate,
} from '@/components/tools/ip-subnet-calculator/IpSubnetCalculator';

describe('ipToLong / longToIp', () => {
  it('roundtrips "192.168.1.1"', () => {
    const long = ipToLong('192.168.1.1');
    expect(longToIp(long)).toBe('192.168.1.1');
  });

  it('roundtrips "0.0.0.0"', () => {
    const long = ipToLong('0.0.0.0');
    expect(long).toBe(0);
    expect(longToIp(long)).toBe('0.0.0.0');
  });

  it('roundtrips "255.255.255.255"', () => {
    const long = ipToLong('255.255.255.255');
    expect(long).toBe(4294967295);
    expect(longToIp(long)).toBe('255.255.255.255');
  });
});

describe('isValidIp', () => {
  it('returns true for valid IPs', () => {
    expect(isValidIp('192.168.1.1')).toBe(true);
    expect(isValidIp('0.0.0.0')).toBe(true);
    expect(isValidIp('255.255.255.255')).toBe(true);
  });

  it('returns false for "256.1.1.1"', () => {
    expect(isValidIp('256.1.1.1')).toBe(false);
  });

  it('returns false for "1.2.3"', () => {
    expect(isValidIp('1.2.3')).toBe(false);
  });

  it('returns false for "abc"', () => {
    expect(isValidIp('abc')).toBe(false);
  });
});

describe('getIpClass', () => {
  it('returns class A for 10.x', () => {
    expect(getIpClass('10.0.0.1')).toBe('A');
  });

  it('returns class B for 172.16.x', () => {
    expect(getIpClass('172.16.0.1')).toBe('B');
  });

  it('returns class C for 192.168.x', () => {
    expect(getIpClass('192.168.1.1')).toBe('C');
  });

  it('returns class D for 224.x', () => {
    expect(getIpClass('224.0.0.1')).toBe('D');
  });

  it('returns class E for 240.x', () => {
    expect(getIpClass('240.0.0.1')).toBe('E');
  });
});

describe('getIpType', () => {
  it('returns Private for 10.0.0.1', () => {
    expect(getIpType('10.0.0.1')).toBe('Private');
  });

  it('returns Private for 172.16.0.1', () => {
    expect(getIpType('172.16.0.1')).toBe('Private');
  });

  it('returns Private for 192.168.1.1', () => {
    expect(getIpType('192.168.1.1')).toBe('Private');
  });

  it('returns Loopback for 127.0.0.1', () => {
    expect(getIpType('127.0.0.1')).toBe('Loopback');
  });

  it('returns Link-Local for 169.254.1.1', () => {
    expect(getIpType('169.254.1.1')).toBe('Link-Local');
  });

  it('returns Multicast for 224.0.0.1', () => {
    expect(getIpType('224.0.0.1')).toBe('Multicast');
  });

  it('returns Public for 8.8.8.8', () => {
    expect(getIpType('8.8.8.8')).toBe('Public');
  });
});

describe('calculate', () => {
  it('/24 network gives correct results', () => {
    const result = calculate('192.168.1.0', 24);
    expect(result.mask).toBe('255.255.255.0');
    expect(result.totalAddresses).toBe(256);
    expect(result.usableHosts).toBe(254);
    expect(result.network).toBe('192.168.1.0');
    expect(result.broadcast).toBe('192.168.1.255');
  });

  it('/32 gives 1 total, 1 usable', () => {
    const result = calculate('192.168.1.1', 32);
    expect(result.totalAddresses).toBe(1);
    expect(result.usableHosts).toBe(1);
  });

  it('/16 gives 65536 total, 65534 usable', () => {
    const result = calculate('10.0.0.0', 16);
    expect(result.totalAddresses).toBe(65536);
    expect(result.usableHosts).toBe(65534);
  });
});
