import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdown, slugify } from './guide.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = ['README.md', path.join('src', 'comparison.md')];
const links = new Map();
let failures = 0;

function collectLinks(tokens, file) {
  for (const token of tokens) {
    const url = token.type === 'link_open' ? token.attrGet('href') :
      token.type === 'image' ? token.attrGet('src') : null;
    if (url) {
      if (!links.has(url)) links.set(url, new Set());
      links.get(url).add(file);
    }
    if (token.children) collectLinks(token.children, file);
  }
}

for (const file of files) {
  collectLinks(markdown.parse(await readFile(path.join(root, file), 'utf8'), {}), file);
}

const results = [];
for (const [url, sources] of links) {
  if (/^https?:\/\//.test(url)) continue;
  for (const source of sources) {
    try {
      const [relative, fragment] = url.split('#');
      const target = path.resolve(root, path.dirname(source), decodeURIComponent(relative || path.basename(source)));
      const info = await stat(target);
      if (fragment && target.endsWith('.md')) {
        const content = await readFile(target);
        const tokens = markdown.parse(content.toString(), {});
        const headings = tokens.flatMap((token, index) =>
          token.type === 'heading_open' ? [slugify(tokens[index + 1].content)] : []
        );
        if (!headings.includes(decodeURIComponent(fragment))) throw new Error(`Missing anchor #${fragment}`);
      }
      if (fragment && info.isDirectory()) throw new Error('A directory link cannot have a heading anchor.');
      results.push({ url, source, status: 'ok', kind: 'local' });
    } catch (error) {
      failures++;
      results.push({ url, source, status: 'failed', error: error.message, kind: 'local' });
      console.error(`FAIL ${source}: ${url}: ${error.message}`);
    }
  }
}

const queue = [...links].filter(([url]) => /^https?:\/\//.test(url));
async function checkRemote(url, sources) {
  let error;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'aca-vs-aks-documentation-link-check/2.0' },
        signal: AbortSignal.timeout(30000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.text();
      const fragment = new URL(url).hash.slice(1);
      if (fragment && response.headers.get('content-type')?.includes('text/html')) {
        const ids = [...body.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)].map(match => match[1]);
        if (!ids.includes(decodeURIComponent(fragment))) throw new Error(`Missing anchor #${fragment}`);
      }
      const result = {
        url, sources: [...sources], status: 'ok', httpStatus: response.status,
        finalUrl: response.url, redirected: response.redirected, kind: 'remote'
      };
      results.push(result);
      console.log(`${response.redirected ? 'REDIRECT' : 'OK'} ${url}${response.redirected ? ` -> ${response.url}` : ''}`);
      return;
    } catch (failure) {
      error = failure;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  failures++;
  results.push({ url, sources: [...sources], status: 'failed', error: error.message, kind: 'remote' });
  console.error(`FAIL ${url}: ${error.message}`);
}

await Promise.all(Array.from({ length: 5 }, async () => {
  while (queue.length) {
    const [url, sources] = queue.shift();
    await checkRemote(url, sources);
  }
}));
await mkdir(path.join(root, 'output'), { recursive: true });
await writeFile(path.join(root, 'output', 'link-report.json'), JSON.stringify({
  checkedAt: new Date().toISOString(), failures, results
}, null, 2));
console.log(`Checked ${results.length} links; ${failures} failures. Report: output/link-report.json`);
if (failures) process.exitCode = 1;
