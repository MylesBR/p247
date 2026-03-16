const puppeteer = require('/home/james/.npm-global/lib/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
  });
  const page = await browser.newPage();
  
  const html = fs.readFileSync(path.resolve(__dirname, 'P247_Investor_Pitch_v2.html'), 'utf8');
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: path.resolve(__dirname, 'P247_Investor_Pitch_v2.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  
  console.log('PDF generated successfully');
  await browser.close();
})();
