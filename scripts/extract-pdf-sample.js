const fs = require('fs');
const { PDFParse } = require('pdf-parse');

(async () => {
  const path = 'CHEMA/BASES DE DATOS/_AreasAc-Espana_2021063063.pdf';
  const buf = fs.readFileSync(path);
  const parser = new PDFParse({ data: buf });
  const data = await parser.getText();
  console.log('pages', data.totalPages);
  console.log('chars', data.text.length);
  console.log('--- sample start ---');
  console.log(data.text.slice(0, 2000));
  console.log('--- sample end ---');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
