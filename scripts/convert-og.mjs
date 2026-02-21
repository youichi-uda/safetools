import { createRequire } from 'node:module';
import { readdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharpPath = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'node_modules', '.pnpm', 'sharp@0.34.5', 'node_modules', 'sharp');
const sharp = require(sharpPath);

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ogDir = join(__dirname, '..', 'public', 'og');

async function main() {
  const files = await readdir(ogDir);
  const svgFiles = files.filter((f) => f.endsWith('.svg'));

  console.log(`Found ${svgFiles.length} SVG files in ${ogDir}`);

  for (const file of svgFiles) {
    const inputPath = join(ogDir, file);
    const outputName = basename(file, '.svg') + '.png';
    const outputPath = join(ogDir, outputName);

    console.log(`Converting ${file} -> ${outputName}...`);

    await sharp(inputPath)
      .resize(1200, 630)
      .png()
      .toFile(outputPath);

    console.log(`  Done: ${outputPath}`);
  }

  console.log(`\nAll ${svgFiles.length} SVGs converted to PNG.`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
