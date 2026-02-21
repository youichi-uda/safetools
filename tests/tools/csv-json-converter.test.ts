import { describe, it, expect } from 'vitest';
import {
  parseCsv,
  escapeCsvField,
  jsonToCsv,
  csvToJson,
} from '@/components/tools/csv-json-converter/CsvJsonConverter';

describe('parseCsv', () => {
  it('parses simple CSV', () => {
    expect(parseCsv('a,b,c\n1,2,3', ',')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('handles quoted fields with commas', () => {
    expect(parseCsv('a,"b,c",d', ',')).toEqual([['a', 'b,c', 'd']]);
  });

  it('handles escaped quotes (doubled)', () => {
    expect(parseCsv('a,"he said ""hi""",c', ',')).toEqual([
      ['a', 'he said "hi"', 'c'],
    ]);
  });

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\nc,d', ',')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('handles custom delimiter (tab)', () => {
    expect(parseCsv('a\tb\tc', '\t')).toEqual([['a', 'b', 'c']]);
  });
});

describe('escapeCsvField', () => {
  it('returns field unchanged when no escaping needed', () => {
    expect(escapeCsvField('hello', ',')).toBe('hello');
  });

  it('quotes field containing comma', () => {
    expect(escapeCsvField('hello,world', ',')).toBe('"hello,world"');
  });

  it('quotes and escapes field containing quotes', () => {
    expect(escapeCsvField('say "hi"', ',')).toBe('"say ""hi"""');
  });

  it('quotes field containing newline', () => {
    expect(escapeCsvField('line1\nline2', ',')).toBe('"line1\nline2"');
  });
});

describe('csvToJson', () => {
  it('converts CSV with header row', () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    const result = JSON.parse(csvToJson(csv, ',', true));
    expect(result).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' },
    ]);
  });

  it('converts CSV without header row (generates col1, col2...)', () => {
    const csv = 'Alice,30\nBob,25';
    const result = JSON.parse(csvToJson(csv, ',', false));
    expect(result).toEqual([
      { col1: 'Alice', col2: '30' },
      { col1: 'Bob', col2: '25' },
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(csvToJson('', ',', true)).toBe('[]');
  });
});

describe('jsonToCsv', () => {
  it('converts array of objects to CSV', () => {
    const json = JSON.stringify([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]);
    const result = jsonToCsv(json, ',');
    expect(result).toBe('name,age\nAlice,30\nBob,25');
  });

  it('handles special characters in fields', () => {
    const json = JSON.stringify([{ name: 'Alice, Jr.', bio: 'says "hello"' }]);
    const result = jsonToCsv(json, ',');
    expect(result).toContain('"Alice, Jr."');
    expect(result).toContain('"says ""hello"""');
  });
});

describe('Roundtrip', () => {
  it('csvToJson then jsonToCsv preserves data', () => {
    const originalCsv = 'name,age,city\nAlice,30,NYC\nBob,25,LA';
    const jsonStr = csvToJson(originalCsv, ',', true);
    const backToCsv = jsonToCsv(jsonStr, ',');
    expect(backToCsv).toBe(originalCsv);
  });
});
