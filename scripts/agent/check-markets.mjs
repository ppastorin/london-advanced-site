import fs from 'node:fs';
const required = ['content/markets.json', 'markets/engine.mjs', 'markets/app.mjs', 'markets/markets.css', 'scripts/build-markets.mjs', 'dist/markets/index.html', 'dist/it/strumenti/mercati/index.html'];
const missing = required.filter(file => !fs.existsSync(file));
for (const file of missing) console.error(`Missing ${file}`);
console.log(`Markets acceptance: ${missing.length} missing files.`);
process.exitCode = missing.length ? 1 : 0;
