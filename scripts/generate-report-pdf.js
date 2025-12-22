/* eslint-disable no-console */

const path = require('path');

async function main() {
  const inputArg = process.argv[2];
  const outputArg = process.argv[3];

  const inputHtml = inputArg
    ? path.resolve(process.cwd(), inputArg)
    : path.resolve(process.cwd(), 'CHEMA/ANALISIS/INFORME_MUTACION_CONTROL_COSTES_Y_CATEGORIAS_2025-12-21.html');

  const outputPdf = outputArg
    ? path.resolve(process.cwd(), outputArg)
    : path.resolve(process.cwd(), 'CHEMA/ANALISIS/INFORME_MUTACION_CONTROL_COSTES_Y_CATEGORIAS_2025-12-21.pdf');

  // Lazy require so the script fails with a clear message if puppeteer isn't installed.
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    console.error('Missing dependency: puppeteer. Run: npm i -D puppeteer');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
  });

  try {
    const page = await browser.newPage();

    // Ensure local file loading works.
    const fileUrl = `file://${inputHtml.replace(/\\/g, '/')}`;

    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: outputPdf,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });

    console.log(`PDF generated: ${outputPdf}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
