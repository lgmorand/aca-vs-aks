import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

export function styleReferenceDoc(buffer) {
  const files = unzipSync(buffer);
  if (!files['word/styles.xml']) throw new Error('Pandoc reference DOCX is missing word/styles.xml.');
  let styles = strFromU8(files['word/styles.xml']);
  const colors = {
    Title: ['17243D', '56'],
    Subtitle: ['52637D', '26'],
    Heading1: ['0067C8', '36'],
    Heading2: ['0067C8', '30'],
    Heading3: ['7045DE', '25']
  };
  for (const [id, [color, size]] of Object.entries(colors)) {
    const pattern = new RegExp(`(<w:style\\b[^>]*w:styleId="${id}"[\\s\\S]*?)(</w:style>)`);
    if (!pattern.test(styles)) throw new Error(`Missing reference DOCX style: ${id}`);
    styles = styles.replace(pattern, (_, open, close) => {
      let updated = open.replace(/<w:rPr>[\s\S]*?<\/w:rPr>/, '');
      updated += `<w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:color w:val="${color}"/><w:sz w:val="${size}"/><w:b/></w:rPr>`;
      return updated + close;
    });
  }
  files['word/styles.xml'] = strToU8(styles);
  return zipSync(files);
}
