import { describe, it, expect } from 'vitest';
import {
  toWords,
  toUpperCase,
  toLowerCase,
  toTitleCase,
  toSentenceCase,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toScreamingSnakeCase,
  toKebabCase,
  toDotCase,
  toPathCase,
  toReverseCase,
} from '@/components/tools/text-case-converter/TextCaseConverter';

describe('toWords', () => {
  it('splits camelCase', () => {
    expect(toWords('helloWorld')).toEqual(['hello', 'World']);
  });

  it('splits snake_case', () => {
    expect(toWords('hello_world')).toEqual(['hello', 'world']);
  });

  it('splits kebab-case', () => {
    expect(toWords('hello-world')).toEqual(['hello', 'world']);
  });

  it('splits PascalCase', () => {
    expect(toWords('HelloWorld')).toEqual(['Hello', 'World']);
  });

  it('handles empty string', () => {
    expect(toWords('')).toEqual([]);
  });

  it('handles multiple spaces', () => {
    expect(toWords('hello   world')).toEqual(['hello', 'world']);
  });
});

describe('toCamelCase', () => {
  it('converts "hello world" to "helloWorld"', () => {
    expect(toCamelCase('hello world')).toBe('helloWorld');
  });

  it('converts "Hello World" to "helloWorld"', () => {
    expect(toCamelCase('Hello World')).toBe('helloWorld');
  });

  it('converts "hello_world" to "helloWorld"', () => {
    expect(toCamelCase('hello_world')).toBe('helloWorld');
  });
});

describe('toPascalCase', () => {
  it('converts "hello world" to "HelloWorld"', () => {
    expect(toPascalCase('hello world')).toBe('HelloWorld');
  });
});

describe('toSnakeCase', () => {
  it('converts "helloWorld" to "hello_world"', () => {
    expect(toSnakeCase('helloWorld')).toBe('hello_world');
  });

  it('converts "Hello World" to "hello_world"', () => {
    expect(toSnakeCase('Hello World')).toBe('hello_world');
  });
});

describe('toScreamingSnakeCase', () => {
  it('converts "helloWorld" to "HELLO_WORLD"', () => {
    expect(toScreamingSnakeCase('helloWorld')).toBe('HELLO_WORLD');
  });
});

describe('toKebabCase', () => {
  it('converts "helloWorld" to "hello-world"', () => {
    expect(toKebabCase('helloWorld')).toBe('hello-world');
  });
});

describe('toDotCase', () => {
  it('converts "helloWorld" to "hello.world"', () => {
    expect(toDotCase('helloWorld')).toBe('hello.world');
  });
});

describe('toPathCase', () => {
  it('converts "helloWorld" to "hello/world"', () => {
    expect(toPathCase('helloWorld')).toBe('hello/world');
  });
});

describe('toTitleCase', () => {
  it('converts "hello world" to "Hello World"', () => {
    expect(toTitleCase('hello world')).toBe('Hello World');
  });
});

describe('toSentenceCase', () => {
  it('converts "hello world. bye world" to "Hello world. Bye world"', () => {
    expect(toSentenceCase('hello world. bye world')).toBe('Hello world. Bye world');
  });
});

describe('toReverseCase', () => {
  it('converts "Hello" to "hELLO"', () => {
    expect(toReverseCase('Hello')).toBe('hELLO');
  });
});

describe('toUpperCase', () => {
  it('converts to upper case', () => {
    expect(toUpperCase('hello')).toBe('HELLO');
  });
});

describe('toLowerCase', () => {
  it('converts to lower case', () => {
    expect(toLowerCase('HELLO')).toBe('hello');
  });
});
