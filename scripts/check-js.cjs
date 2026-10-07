const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const root = path.resolve(__dirname, '..');
let checked = 0;
const checkDirectory = (directory) => {
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    if (['node_modules', '.git', '.expo', 'dist', 'preview', 'assets'].includes(entry.name)) return;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { checkDirectory(file); return; }
    if (/\.tsx?$/.test(file)) throw new Error(`Unexpected TypeScript source: ${file}`);
    if (!/\.(jsx?|cjs|mjs)$/.test(file)) return;
    parser.parse(fs.readFileSync(file, 'utf8'), { sourceType: 'unambiguous', plugins: ['jsx'] });
    checked += 1;
  });
};
checkDirectory(root);
console.log(`Checked ${checked} JavaScript/JSX files; no TypeScript source remains.`);
