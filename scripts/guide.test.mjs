import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { escapeHtml, markdown, parseGuide, renderDocument, slugify } from './guide.mjs';
import { styleReferenceDoc } from './reference-doc.mjs';

const source = await readFile(new URL('../src/comparison.md', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/guide.css', import.meta.url), 'utf8');

test('guide has a baseline, fourteen unique navigable sections, and scoped source links', () => {
  const guide = parseGuide(source);
  assert.ok(Number.isFinite(Date.parse(guide.date)));
  assert.equal(guide.headings.length, 14);
  assert.equal(new Set(guide.headings.map(heading => heading.id)).size, 14);
  for (const heading of guide.headings) assert.ok(guide.html.includes(`id="${heading.id}"`));
  const sections = source.split(/^## /m).slice(1);
  for (const section of sections.slice(0, 12)) {
    assert.match(section, /https:\/\/(?:learn\.microsoft\.com|azure\.microsoft\.com|www\.microsoft\.com)/);
  }
});

test('comparison tables consistently have three columns and contain substantive coverage', () => {
  const tokens = markdown.parse(source, {});
  assert.equal(tokens.filter(token => token.type === 'table_open').length, 11);
  let rows = 0;
  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index].type !== 'tr_open') continue;
    let columns = 0;
    while (tokens[++index].type !== 'tr_close') {
      if (['th_open', 'td_open'].includes(tokens[index].type)) columns++;
    }
    assert.equal(columns, 3);
    rows++;
  }
  assert.ok(rows >= 100, `Expected at least 100 table rows, found ${rows}.`);
});

test('invalid or ambiguous source metadata fails explicitly', () => {
  assert.throws(() => parseGuide('# No date'), /Research baseline/);
  assert.throws(() => parseGuide('**Research baseline: 5 November 2026.**\n## Same\n## Same'), /Duplicate heading/);
});

test('HTML is self-contained, semantic, linked, and escapes source markup', () => {
  const guide = parseGuide(source);
  const html = renderDocument(guide, css);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /aria-label="Table of contents"/);
  assert.match(html, /linear-gradient/);
  assert.match(html, /@media print/);
  assert.match(html, /<thead>/);
  assert.doesNotMatch(html, /<script|<link[^>]+stylesheet|@import|<img[^>]+https:/);
  for (const heading of guide.headings) assert.ok(html.includes(`href="#${heading.id}"`));
  assert.equal(slugify('11. Retirement and migration watchlist'), '11-retirement-and-migration-watchlist');
  assert.equal(escapeHtml('<a & "b">'), '&lt;a &amp; &quot;b&quot;&gt;');
  assert.doesNotMatch(markdown.render('<script>alert(1)</script>'), /<script>/);
});

test('DOCX reference styling changes intended headings and preserves other ZIP entries', () => {
  const names = ['Title', 'Subtitle', 'Heading1', 'Heading2', 'Heading3'];
  const styles = `<w:styles>${names.map(name =>
    `<w:style w:styleId="${name}"><w:pPr><w:keepNext/></w:pPr><w:rPr><w:color w:val="000000"/></w:rPr></w:style>`
  ).join('')}</w:styles>`;
  const result = unzipSync(styleReferenceDoc(zipSync({
    'word/styles.xml': strToU8(styles), 'word/document.xml': strToU8('untouched')
  })));
  const updated = strFromU8(result['word/styles.xml']);
  assert.match(updated, /0067C8/);
  assert.match(updated, /7045DE/);
  assert.equal((updated.match(/<w:keepNext\/>/g) || []).length, 5);
  assert.equal(strFromU8(result['word/document.xml']), 'untouched');
  assert.throws(() => styleReferenceDoc(zipSync({})), /missing word\/styles.xml/);
  assert.throws(() => styleReferenceDoc(zipSync({ 'word/styles.xml': strToU8('<w:styles/>') })), /Missing reference DOCX style/);
});
