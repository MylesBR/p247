const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  const htmlPath = path.resolve(__dirname, 'P247-Investor-Pitch.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Wait for fonts to load
  await page.evaluateHandle('document.fonts.ready');
  
  await page.pdf({
    path: path.resolve(__dirname, 'P247-Investor-Pitch.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: true
  });
  
  await browser.close();
  console.log('PDF generated: P247-Investor-Pitch.pdf');
})();
