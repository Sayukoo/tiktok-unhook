// Film promocyjny 1920x1080 (mp4, bez dźwięku): npm run build && npm run promo:video
//   node scripts/generate-promo-video.js [en|pl|all] [--skip-capture] [--frames=3.5,12]
//
// Strona z scripts/promo/video-page.js jest przewijana klatka po klatce
// (window.setTime), a zrzuty trafiają prosto do ffmpeg.
// --frames=... zamiast filmu zapisuje pojedyncze klatki do .output/promo-frames/.
import { chromium } from 'playwright-core';
import ffmpegPath from 'ffmpeg-static';
import sharp from 'sharp';
import { spawn } from 'child_process';
import { once } from 'events';
import fs from 'fs';
import path from 'path';
import { captureRaw, RAW_DIR } from './promo/capture.js';
import { TEXTS } from './promo/texts.js';
import { VIDEO, buildVideoPage } from './promo/video-page.js';

const ORIGIN = 'https://promo.test';
const OUT_DIR = path.resolve('promo');
const FRAMES_DIR = path.resolve('.output', 'promo-frames');

const args = process.argv.slice(2);
const skipCapture = args.includes('--skip-capture');
const framesArg = args.find((arg) => arg.startsWith('--frames='));
const sampleTimes = framesArg ? framesArg.slice('--frames='.length).split(',').map(Number) : null;
const requested = args.find((arg) => !arg.startsWith('--')) || 'all';
const langs = requested === 'all' ? ['en', 'pl'] : [requested];
for (const lang of langs) {
  if (!TEXTS[lang]) throw new Error(`Nieznany język: ${lang}`);
}

async function openStage(lang) {
  const rawDir = path.join(RAW_DIR, lang);
  const meta = JSON.parse(fs.readFileSync(path.join(rawDir, 'meta.json'), 'utf8'));
  if (!fs.existsSync(path.join(rawDir, 'ritual', '000.png'))) {
    throw new Error('Brak klatek rytuału. Uruchom bez --skip-capture.');
  }
  const html = buildVideoPage({ t: TEXTS[lang], raw: `/raw/${lang}`, phraseLength: meta.phraseLength });

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: VIDEO.width, height: VIDEO.height },
    deviceScaleFactor: 1,
  });
  await context.route(`${ORIGIN}/**`, (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === '/video.html') {
      return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
    }
    if (pathname.startsWith('/raw/')) {
      const file = path.join(RAW_DIR, decodeURIComponent(pathname.slice('/raw/'.length)));
      if (file.startsWith(RAW_DIR) && fs.existsSync(file)) {
        return route.fulfill({ contentType: 'image/png', body: fs.readFileSync(file) });
      }
    }
    return route.fulfill({ status: 404, body: 'missing' });
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => {
    throw error;
  });
  await page.goto(`${ORIGIN}/video.html`, { waitUntil: 'load' });
  await page.evaluate(() => window.ready);
  return { browser, page };
}

const frameAt = async (page, seconds, type = 'jpeg') => {
  await page.evaluate((t) => window.setTime(t), seconds);
  return page.screenshot(type === 'jpeg' ? { type: 'jpeg', quality: 94 } : { type: 'png' });
};

async function renderSamples(lang) {
  const { browser, page } = await openStage(lang);
  try {
    const dir = path.join(FRAMES_DIR, lang);
    fs.mkdirSync(dir, { recursive: true });
    for (const seconds of sampleTimes) {
      const file = path.join(dir, `t${seconds.toFixed(2).replace('.', '_')}.jpg`);
      fs.writeFileSync(file, await frameAt(page, seconds));
      console.log(`  ${path.relative(process.cwd(), file)}`);
    }
  } finally {
    await browser.close();
  }
}

async function renderVideo(lang) {
  const outDir = path.join(OUT_DIR, lang);
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'offhook-promo-1920x1080.mp4');
  const total = Math.round(VIDEO.duration * VIDEO.fps);
  const { browser, page } = await openStage(lang);

  const ffmpeg = spawn(
    ffmpegPath,
    [
      '-y',
      '-f', 'image2pipe',
      '-framerate', String(VIDEO.fps),
      '-c:v', 'mjpeg',
      '-i', '-',
      '-vf', 'scale=in_range=pc:out_range=tv,format=yuv420p',
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', '17',
      '-color_range', 'tv',
      '-movflags', '+faststart',
      '-an',
      outFile,
    ],
    { stdio: ['pipe', 'ignore', 'pipe'] }
  );
  let log = '';
  ffmpeg.stderr.on('data', (chunk) => {
    log = (log + chunk).slice(-4000);
  });
  const finished = once(ffmpeg, 'close');

  try {
    for (let index = 0; index < total; index += 1) {
      const frame = await frameAt(page, index / VIDEO.fps);
      if (!ffmpeg.stdin.write(frame)) await once(ffmpeg.stdin, 'drain');
      if (index % 150 === 0) console.log(`  klatka ${index}/${total}`);
    }
    ffmpeg.stdin.end();
    const [code] = await finished;
    if (code !== 0) throw new Error(`ffmpeg zakończył się kodem ${code}\n${log}`);

    // Miniatura do YouTube: plansza końcowa.
    const thumb = await frameAt(page, VIDEO.duration - 0.2, 'png');
    const thumbFile = path.join(outDir, 'video-thumbnail-1280x720.png');
    await sharp(thumb).resize(1280, 720).flatten({ background: '#0E0F13' }).png({ compressionLevel: 9 }).toFile(thumbFile);

    const size = (fs.statSync(outFile).size / (1024 * 1024)).toFixed(1);
    console.log(`  ${path.relative(process.cwd(), outFile)}  ${total} klatek, ${VIDEO.duration} s, ${size} MB`);
    console.log(`  ${path.relative(process.cwd(), thumbFile)}`);
  } finally {
    await browser.close();
    if (ffmpeg.exitCode === null) ffmpeg.kill();
  }
}

for (const lang of langs) {
  console.log(`\n[${lang}]`);
  if (!skipCapture) {
    console.log('  zrzuty interfejsu (z klatkami rytuału, ok. minuty)...');
    await captureRaw(lang, { ritualFrames: true });
  }
  if (sampleTimes) await renderSamples(lang);
  else await renderVideo(lang);
}
