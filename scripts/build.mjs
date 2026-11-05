import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import { escapeHtml, parseGuide, renderDocument } from './guide.mjs';
import { styleReferenceDoc } from './reference-doc.mjs';
import { inspectPdf } from './inspect-pdf.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'output');
const previewOnly = process.argv.includes('--preview');
const pandoc = process.env.PANDOC_PATH || 'pandoc';

function runPandoc(args, options = {}) {
  const result = spawnSync(pandoc, args, { cwd: root, encoding: 'utf8', ...options });
  if (result.error) throw new Error(`Pandoc is required for DOCX. Install it or set PANDOC_PATH. ${result.error.message}`);
  if (result.status !== 0) throw new Error(`Pandoc failed:\n${result.stderr}`);
}

if (!previewOnly) runPandoc(['--version']);
const [source, css] = await Promise.all([
  readFile(path.join(root, 'src', 'comparison.md'), 'utf8'),
  readFile(path.join(root, 'assets', 'guide.css'), 'utf8')
]);
const guide = parseGuide(source);
await mkdir(output, { recursive: true });
const htmlPath = path.join(output, 'ACA-vs-AKS-comparison-guide.html');
await writeFile(htmlPath, renderDocument(guide, css));

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1100 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.locator('table').evaluateAll(tables =>
    tables.filter(table => table.scrollWidth > table.clientWidth + 2).length
  );
  if (overflow) throw new Error(`${overflow} comparison tables overflow the page.`);
  await page.locator('.cover').screenshot({ path: path.join(output, 'cover-preview.png') });
  await page.pdf({
    path: path.join(output, 'ACA-vs-AKS-comparison-guide.pdf'),
    preferCSSPageSize: true,
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="width:100%;margin:0 14mm;font:8px Arial;color:#52637d;letter-spacing:1px">AZURE ARCHITECTURE / ACA vs AKS</div>',
    footerTemplate: `<div style="display:flex;justify-content:space-between;width:100%;margin:0 14mm;font:8px Arial;color:#52637d"><span>RESEARCH BASELINE ${escapeHtml(guide.date.toUpperCase())}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    tagged: true,
    outline: true
  });
  console.log('Built HTML and tagged PDF with bookmarks.');
} finally {
  await browser.close();
}
await inspectPdf(root, guide.headings);

if (!previewOnly) {
  const reference = path.join(output, 'reference.docx');
  const defaultReference = spawnSync(pandoc, ['--print-default-data-file=reference.docx'], { cwd: root });
  if (defaultReference.error || defaultReference.status !== 0) {
    throw new Error(`Cannot create Pandoc reference DOCX: ${defaultReference.error?.message || defaultReference.stderr}`);
  }
  await writeFile(reference, styleReferenceDoc(defaultReference.stdout));
  runPandoc([
    path.join('src', 'comparison.md'), '--from=gfm', '--standalone', '--toc',
    `--reference-doc=${reference}`,
    '--metadata=title:Azure Container Apps vs Azure Kubernetes Service',
    `--metadata=date:Research baseline: ${guide.date}`,
    '--metadata=lang:en-US',
    `--output=${path.join(output, 'ACA-vs-AKS-comparison-guide.docx')}`
  ]);
  console.log('Built editable DOCX with table of contents.');
}
