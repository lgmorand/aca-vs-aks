import MarkdownIt from 'markdown-it';

export const markdown = new MarkdownIt({ html: false, typographer: true });

export function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
}

export function parseGuide(source) {
  const date = source.match(/\*\*Research baseline: (\d{1,2} \w+ \d{4})\.\*\*/)?.[1];
  if (!date) throw new Error('The guide must declare a Research baseline date.');
  const tokens = markdown.parse(source, {});
  const headings = [];
  const ids = new Set();
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.type !== 'heading_open') continue;
    const text = tokens[index + 1].content;
    const id = slugify(text);
    if (ids.has(id)) throw new Error(`Duplicate heading ID: ${id}`);
    ids.add(id);
    token.attrSet('id', id);
    if (token.tag === 'h2') headings.push({ text, id });
  }
  const html = markdown.renderer.render(tokens, markdown.options, {});
  const sections = html.split(/(?=<h2\b)/);
  return {
    date,
    headings,
    html: sections.map((section, index) =>
      `<section class="${index === 0 ? 'introduction' : 'guide-section'}">${section}</section>`
    ).join('\n')
  };
}

export function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function renderDocument(guide, css) {
  const toc = guide.headings.map(({ text, id }) =>
    `<a href="#${id}">${escapeHtml(text)}</a>`
  ).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="An evidence-led architecture guide to Azure Container Apps and Azure Kubernetes Service.">
  <title>ACA vs AKS | Azure architecture field guide</title>
  <style>${css}</style>
</head>
<body>
  <header class="cover" aria-label="Guide cover">
    <div class="cover-top"><span class="brand-mark">AZ</span> ARCHITECTURE / FIELD GUIDE <span class="edition">${escapeHtml(guide.date.slice(-4))} EDITION</span></div>
    <div class="cover-orbit orbit-one"></div><div class="cover-orbit orbit-two"></div>
    <div class="cover-content">
      <p class="eyebrow">THE RIGHT PLATFORM. THE RIGHT REASONS.</p>
      <h1>Containers.<br>Two paths.<br><span>One informed choice.</span></h1>
      <p class="cover-subtitle">Azure Container Apps <b>vs</b><br>Azure Kubernetes Service</p>
      <p class="cover-description">An evidence-led guide to platform fit, operational ownership, reliability, security, and total cost.</p>
      <div class="platform-cards">
        <div class="platform-card aca"><span class="card-label">ACA</span><strong>Focus on the app.</strong><p>Managed platform<br>Event-driven scale<br>Less infrastructure ownership</p></div>
        <div class="platform-card aks"><span class="card-label">AKS</span><strong>Shape the platform.</strong><p>Kubernetes ecosystem<br>Automatic or Standard<br>Control where it matters</p></div>
      </div>
      <div class="cover-tags"><span>DECISION MATRIX</span><span>RETIREMENT WATCHLIST</span><span>PRODUCTION CHECKLIST</span></div>
    </div>
    <div class="cover-bottom"><span>Independent community architecture guide</span><span>RESEARCHED ${escapeHtml(guide.date.toUpperCase())}</span></div>
  </header>
  <nav class="contents" aria-label="Table of contents">
    <p class="eyebrow">YOUR ROUTE THROUGH THE DECISION</p>
    <h2>Inside the guide</h2>
    <div class="contents-grid">${toc}</div>
    <aside><strong>Read the constraints, not just the checkmarks.</strong><p>Capabilities depend on region, plan, configuration, and feature maturity. Source links accompany every comparison topic.</p></aside>
  </nav>
  <main>${guide.html}</main>
  <footer class="web-footer">ACA vs AKS / Research baseline: ${escapeHtml(guide.date)} / Community guide, not a product commitment.</footer>
</body>
</html>`;
}
