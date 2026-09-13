import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateDigest } from './validate-events.mjs';

const input = process.argv[2];
if (!input) {
  console.error('Usage: npm run stage:events -- <candidate.json>');
  process.exit(2);
}

const source = resolve(input);
const target = resolve('dist/data/events.json');
const temporary = resolve('dist/data/events.json.tmp');

let data;
try {
  data = JSON.parse(await readFile(source, 'utf8'));
} catch (error) {
  console.error(`Candidate JSON cannot be read: ${error.message}`);
  process.exit(1);
}

const errors = validateDigest(data);
if (errors.length) {
  console.error('Candidate was not staged:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

await mkdir(resolve('dist/data'), { recursive: true });
await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
await rename(temporary, target);
console.log(`Staged ${data.events.length} validated events in dist/data/events.json`);
