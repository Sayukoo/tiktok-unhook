// Grafiki do sklepu: npm run build && npm run promo
//   node scripts/generate-store-assets.js [en|pl|all] [--skip-capture]
//
// 1. scripts/promo/capture.js robi zrzuty prawdziwego interfejsu rozszerzenia,
// 2. scripts/promo/layouts.js składa z nich plansze,
// 3. wynik trafia do promo/<język>/ jako 24-bitowe PNG bez kanału alfa
//    (takich wymaga Chrome Web Store).
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { captureRaw, RAW_DIR } from './promo/capture.js';
import { STORE_ASSETS } from './promo/layouts.js';
import { TEXTS } from './promo/texts.js';

const ORIGIN = 'https://promo.test';
const OUT_DIR = path.resolve('promo');

const args = process.argv.slice(2);
const skipCapture = args.includes('--skip-capture');
const requested = args.find((arg) => !arg.startsWith('--')) || 'all';
const langs = requested === 'all' ? ['en', 'pl'] : [requested];
for (const lang of langs) {
  if (!TEXTS[lang]) throw new Error(`Nieznany język: ${lang}`);
}

async function compose(lang) {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ deviceScaleFactor: 1 });
    const pages = new Map();

    await context.route(`${ORIGIN}/**`, (route) => {
      const { pathname } = new URL(route.request().url());
      if (pathname.startsWith('/raw/')) {
        const file = path.join(RAW_DIR, decodeURIComponent(pathname.slice('/raw/'.length)));
        if (file.startsWith(RAW_DIR) && fs.existsSync(file)) {
          return route.fulfill({ contentType: 'image/png', body: fs.readFileSync(file) });
        }
        return route.fulfill({ status: 404, body: 'missing' });
      }
      const html = pages.get(pathname);
      if (html) return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
      return route.fulfill({ status: 404, body: 'missing' });
    });

    const outDir = path.join(OUT_DIR, lang);
    fs.mkdirSync(outDir, { recursive: true });
    const page = await context.newPage();
    const missing = [];
    page.on('response', (response) => {
      if (response.status() === 404) missing.push(response.url());
    });

    for (const asset of STORE_ASSETS) {
      const route = `/page/${asset.name}.html`;
      pages.set(route, asset.build({ t: TEXTS[lang], raw: `/raw/${lang}`, lang }));
      await page.setViewportSize({ width: asset.width, height: asset.height });
      await page.goto(`${ORIGIN}${route}`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const shot = await page.screenshot({ type: 'png' });
      const file = path.join(outDir, `${asset.name}.png`);
      await sharp(shot).flatten({ background: '#0E0F13' }).png({ compressionLevel: 9 }).toFile(file);
      const meta = await sharp(file).metadata();
      if (meta.width !== asset.width || meta.height !== asset.height || meta.hasAlpha) {
        throw new Error(`${asset.name}: zły format (${meta.width}x${meta.height}, alfa: ${meta.hasAlpha})`);
      }
      console.log(`  ${path.relative(process.cwd(), file)}  ${meta.width}x${meta.height}`);
    }
    if (missing.length > 0) throw new Error(`Brakujące pliki: ${missing.join(', ')}`);
  } finally {
    await browser.close();
  }
}

for (const lang of langs) {
  console.log(`\n[${lang}]`);
  if (!skipCapture) {
    console.log('  zrzuty interfejsu...');
    await captureRaw(lang);
  }
  await compose(lang);
}
