export interface PatternCategory {
  id: string;
  label: string;
  patterns: { name: string; regex: RegExp }[];
}

export const PATTERN_CATEGORIES: PatternCategory[] = [
  {
    id: 'email',
    label: 'Email Addresses',
    patterns: [
      { name: 'Email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
    ],
  },
  {
    id: 'phone',
    label: 'Phone Numbers',
    patterns: [
      { name: 'Phone (US)', regex: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g },
      { name: 'Phone (Intl)', regex: /\+\d{1,3}[-.\s]?\d{4,14}/g },
    ],
  },
  {
    id: 'ssn',
    label: 'SSN',
    patterns: [
      { name: 'SSN', regex: /\b\d{3}-\d{2}-\d{4}\b/g },
    ],
  },
  {
    id: 'creditcard',
    label: 'Credit Cards',
    patterns: [
      { name: 'Credit Card', regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g },
    ],
  },
  {
    id: 'ipv4',
    label: 'IPv4 Addresses',
    patterns: [
      { name: 'IPv4', regex: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g },
    ],
  },
  {
    id: 'ipv6',
    label: 'IPv6 Addresses',
    patterns: [
      { name: 'IPv6', regex: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g },
    ],
  },
  {
    id: 'aws',
    label: 'AWS Keys',
    patterns: [
      { name: 'AWS Access Key', regex: /\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g },
      { name: 'AWS Secret Key', regex: /\b[0-9a-zA-Z/+]{40}\b/g },
    ],
  },
  {
    id: 'jwt',
    label: 'JWTs',
    patterns: [
      { name: 'JWT', regex: /\beyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]+\b/g },
    ],
  },
  {
    id: 'privatekey',
    label: 'Private Keys',
    patterns: [
      { name: 'Private Key Header', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g },
    ],
  },
];
