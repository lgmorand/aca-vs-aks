import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';

// PDF.js needs browser geometry types when running its renderer in Node.
globalThis.DOMMatrix = DOMMatrix;
globalThis.ImageData = ImageData;
globalThis.Path2D = Path2D;
const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');

export async function inspectPdf(root, headings) {
  const file = path.join(root, 'output', 'ACA-vs-AKS-comparison-guide.pdf');
  const task = getDocument({
    data: new Uint8Array(await readFile(file)),
    useSystemFonts: true,
    isEvalSupported: false
  });
  const document = await task.promise;
  try {
    const pages = [];
    let comparisonPage;
    let linkCount = 0;
    for (let index = 1; index <= document.numPages; index++) {
      const page = await document.getPage(index);
      const content = await page.getTextContent();
      const annotations = await page.getAnnotations();
      linkCount += annotations.filter(annotation => annotation.subtype === 'Link').length;
      const text = content.items.filter(item => 'str' in item).map(item => item.str).join(' ');
      const body = content.items.filter(item =>
        'str' in item && item.str.trim() && item.transform[5] > 45 && item.transform[5] < 795
      );
      if (!body.length) throw new Error(`PDF page ${index} has no body content.`);
      const viewport = page.getViewport({ scale: 1 });
      const outOfBounds = content.items.filter(item =>
        'str' in item && item.str.trim() &&
        (item.transform[4] < -1 || item.transform[4] + item.width > viewport.width + 2 ||
         item.transform[5] < 0 || item.transform[5] > viewport.height)
      );
      if (outOfBounds.length) throw new Error(`PDF page ${index} contains text outside the page.`);
      pages.push({ page: index, characters: text.length, text });
      if (!comparisonPage && index > 2 && /5\. Networking, ingress/.test(text)) comparisonPage = index;
    }
    const text = pages.map(page => page.text).join('\n');
    for (const required of ['Executive decision', 'Production acceptance checklist', 'Retirement and migration watchlist', '1,000']) {
      if (!text.includes(required)) throw new Error(`PDF missing required content: ${required}`);
    }
    const bookmarks = await document.getOutline();
    if (!bookmarks?.length) throw new Error('PDF is missing document bookmarks.');
    const bookmarkTitles = [];
    function collectBookmarks(nodes) {
      for (const node of nodes) {
        bookmarkTitles.push(node.title);
        collectBookmarks(node.items);
      }
    }
    collectBookmarks(bookmarks);
    for (const heading of headings) {
      if (!bookmarkTitles.includes(heading.text)) throw new Error(`PDF missing section bookmark: ${heading.text}`);
    }
    const markInfo = await document.getMarkInfo();
    if (markInfo?.get('Marked') !== true) throw new Error('PDF is missing structural tagging.');
    if (linkCount < headings.length) throw new Error('PDF is missing expected clickable links.');
    if (!comparisonPage) throw new Error('PDF is missing the networking comparison section.');
    for (const [pageNumber, name] of [[1, 'guide-preview.png'], [comparisonPage, 'comparison-preview.png']]) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      await writeFile(path.join(root, 'media', name), canvas.toBuffer('image/png'));
    }
    await writeFile(path.join(root, 'output', 'pdf-report.json'), JSON.stringify({
      pages: document.numPages, comparisonPage, bookmarks: bookmarkTitles.length,
      tagged: markInfo.get('Marked'), links: linkCount, content: pages
    }, null, 2));
    console.log(`Validated ${document.numPages} PDF pages, boundaries, section bookmarks, tagging, and ${linkCount} clickable links. Rendered real PDF screenshots.`);
  } finally {
    await task.destroy();
  }
}
