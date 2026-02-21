import { useState, useCallback, useMemo } from 'react';
import CopyButton from '@/components/shared/CopyButton';

type GenerationType = 'paragraphs' | 'sentences' | 'words';

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'at', 'vero', 'eos',
  'accusamus', 'iusto', 'odio', 'dignissimos', 'ducimus', 'blanditiis',
  'praesentium', 'voluptatum', 'deleniti', 'atque', 'corrupti', 'quos', 'dolores',
  'quas', 'molestias', 'excepturi', 'obcaecati', 'cupiditate', 'provident',
  'similique', 'mollitia', 'animi', 'minima', 'quasi', 'architecto', 'beatae',
  'vitae', 'dicta', 'explicabo', 'nemo', 'ipsam', 'voluptatem', 'quia', 'voluptas',
  'aspernatur', 'aut', 'odit', 'fugit', 'consequuntur', 'magni', 'ratione',
  'voluptatibus', 'maiores', 'alias', 'perferendis', 'doloribus', 'asperiores',
  'repellat', 'temporibus', 'quibusdam', 'illum', 'fugiat', 'quo', 'voluptas',
  'nulla', 'recusandae', 'itaque', 'earum', 'rerum', 'hic', 'tenetur',
  'sapiente', 'delectus', 'reiciendis', 'voluptatibus', 'maiores', 'doloremque',
  'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo',
  'inventore', 'veritatis', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta',
  'explicabo', 'aspernatur', 'odit', 'fugit', 'harum', 'quidem', 'rerum',
  'facilis', 'expedita', 'distinctio', 'nam', 'libero', 'tempore', 'cum',
  'soluta', 'nobis', 'eligendi', 'optio', 'cumque', 'nihil', 'impedit',
  'minus', 'quod', 'maxime', 'placeat', 'facere', 'possimus', 'omnis',
  'voluptas', 'assumenda', 'repellendus', 'corporis', 'suscipit', 'laboriosam',
  'natus', 'error', 'consequatur', 'perspiciatis', 'unde', 'nesciunt',
  'neque', 'porro', 'quisquam', 'dolorem', 'numquam', 'eius', 'modi',
  'tempora', 'incidunt', 'magnam', 'aliquam', 'quaerat', 'autem', 'vel',
  'eum', 'iure', 'quam', 'elementum', 'pulvinar', 'etiam', 'faucibus',
  'turpis', 'massa', 'tincidunt', 'dui', 'sapien', 'nec', 'tortor',
  'condimentum', 'lacinia', 'quis', 'vel', 'eros', 'donec', 'ac',
];

const CLASSIC_START = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateSentence(rand: () => number): string {
  const wordCount = Math.floor(rand() * 11) + 5; // 5-15 words
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(LOREM_WORDS[Math.floor(rand() * LOREM_WORDS.length)]);
  }
  return capitalize(words.join(' ')) + '.';
}

function generateParagraph(rand: () => number): string {
  const sentenceCount = Math.floor(rand() * 5) + 3; // 3-7 sentences
  const sentences: string[] = [];
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(generateSentence(rand));
  }
  return sentences.join(' ');
}

function generate(
  type: GenerationType,
  count: number,
  startWithLorem: boolean,
  includeHtmlTags: boolean,
): string {
  const rand = seededRandom(42);
  const results: string[] = [];

  if (type === 'words') {
    const words: string[] = [];
    if (startWithLorem) {
      const loremStart = CLASSIC_START.replace('.', '').split(/[\s,]+/).filter(Boolean);
      for (let i = 0; i < Math.min(count, loremStart.length); i++) {
        words.push(loremStart[i].toLowerCase());
      }
    }
    while (words.length < count) {
      words.push(LOREM_WORDS[Math.floor(rand() * LOREM_WORDS.length)]);
    }
    words[0] = capitalize(words[0]);
    return words.slice(0, count).join(' ') + '.';
  }

  if (type === 'sentences') {
    if (startWithLorem) {
      results.push(CLASSIC_START);
    }
    while (results.length < count) {
      results.push(generateSentence(rand));
    }
    return results.slice(0, count).join(' ');
  }

  // paragraphs
  if (startWithLorem) {
    const firstPara = CLASSIC_START + ' ' + Array.from(
      { length: Math.floor(rand() * 4) + 2 },
      () => generateSentence(rand),
    ).join(' ');
    results.push(firstPara);
  }

  while (results.length < count) {
    results.push(generateParagraph(rand));
  }

  const paragraphs = results.slice(0, count);

  if (includeHtmlTags) {
    return paragraphs.map((p) => `<p>${p}</p>`).join('\n\n');
  }

  return paragraphs.join('\n\n');
}

export default function LoremIpsumGenerator() {
  const [type, setType] = useState<GenerationType>('paragraphs');
  const [count, setCount] = useState(5);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [includeHtmlTags, setIncludeHtmlTags] = useState(false);
  const [output, setOutput] = useState('');

  const handleGenerate = useCallback(() => {
    const clamped = Math.max(1, Math.min(100, count));
    setOutput(generate(type, clamped, startWithLorem, includeHtmlTags));
  }, [type, count, startWithLorem, includeHtmlTags]);

  const stats = useMemo(() => {
    if (!output) return { chars: 0, words: 0, paragraphs: 0 };
    const plainText = output.replace(/<\/?p>/g, '');
    const words = plainText.trim().split(/\s+/).filter(Boolean).length;
    const paragraphs = plainText.trim().split(/\n\n+/).filter(Boolean).length;
    return { chars: plainText.length, words, paragraphs };
  }, [output]);

  const download = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lorem-ipsum.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  return (
    <div>
      <p className="text-muted-foreground text-sm mb-4">
        Generate placeholder text for your designs and layouts. All processing happens in your browser.
      </p>

      {/* Options */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Type:</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as GenerationType)}
            className="px-2 py-1.5 text-sm rounded-md border border-border bg-background"
          >
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
            <option value="words">Words</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Count:</label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-20 px-2 py-1.5 text-sm rounded-md border border-border bg-background"
          />
        </div>

        <div className="h-5 w-px bg-border mx-1" />

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={startWithLorem}
            onChange={(e) => setStartWithLorem(e.target.checked)}
            className="rounded border-border"
          />
          <span className="text-muted-foreground">Start with "Lorem ipsum..."</span>
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={includeHtmlTags}
            onChange={(e) => setIncludeHtmlTags(e.target.checked)}
            className="rounded border-border"
          />
          <span className="text-muted-foreground">
            Include HTML {'<p>'} tags
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={handleGenerate}
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Generate
        </button>

        {output && (
          <>
            <CopyButton text={output} />
            <button
              onClick={download}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download .txt
            </button>
          </>
        )}
      </div>

      {/* Stats */}
      {output && (
        <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
          <span>{stats.chars.toLocaleString()} characters</span>
          <span>{stats.words.toLocaleString()} words</span>
          <span>{stats.paragraphs.toLocaleString()} {stats.paragraphs === 1 ? 'paragraph' : 'paragraphs'}</span>
        </div>
      )}

      {/* Output */}
      {output && (
        <div className="rounded-lg border border-border bg-card p-4 min-h-[200px] max-h-[600px] overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{output}</pre>
        </div>
      )}
    </div>
  );
}
