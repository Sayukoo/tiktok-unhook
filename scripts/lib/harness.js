// Uruchamia ZBUDOWANE rozszerzenie (.output/chrome-mv3) w zwykłej karcie:
// popup i content script dostają atrapę chrome.storage, a strona docelowa to
// lokalna makieta (scripts/lib/mock-site.html). Nic nie łączy się z siecią.
//
// Służy do dwóch rzeczy: testów zachowania (scripts/e2e.js) i renderowania
// grafik promocyjnych z prawdziwego interfejsu rozszerzenia.
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const BUILD = path.join(ROOT, '.output', 'chrome-mv3');

export const ORIGIN = 'https://shortvideo.test';
export const SETTINGS_KEY = 'tiktok_unhook_settings';
export const SETTINGS_SAVED_AT_KEY = 'tiktok_unhook_settings_saved_at';
export const GUARD_KEY = 'unhook_guard_v1';
export const STATS_KEY = 'unhook_daily_stats_v1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

// Atrapa API rozszerzenia. Dane trzyma proces Node (jedna kopia dla wszystkich
// kart), więc popup i content script widzą nawzajem swoje zapisy tak jak
// w prawdziwej przeglądarce.
const STUB = `(() => {
  const listeners = new Set();
  const done = (promise, callback) => {
    if (typeof callback === 'function') { promise.then(callback); return undefined; }
    return promise;
  };
  const area = (name) => ({
    get: (keys, callback) => done(window.__offhookStoreGet(name, keys ?? null), callback),
    set: (values, callback) => done(window.__offhookStoreSet(name, values), callback),
    remove: (keys, callback) => done(window.__offhookStoreRemove(name, [].concat(keys)), callback),
  });
  window.__offhookFire = (changes, areaName) => {
    listeners.forEach((listener) => listener(changes, areaName));
  };
  window.chrome = {
    runtime: {
      id: 'offhook-harness',
      getManifest: () => ({ version: '__VERSION__' }),
      getURL: (file) => '/' + String(file).replace(/^\\//, ''),
      onInstalled: { addListener() {} },
    },
    storage: {
      sync: area('sync'),
      local: area('local'),
      onChanged: {
        addListener: (listener) => listeners.add(listener),
        removeListener: (listener) => listeners.delete(listener),
      },
    },
  };
})();`;

export function todayKey(date = new Date()) {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export async function createHarness({ width = 1280, height = 800, scale = 1 } = {}) {
  if (!fs.existsSync(path.join(BUILD, 'manifest.json'))) {
    throw new Error('Brak .output/chrome-mv3. Najpierw: npm run build');
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(BUILD, 'manifest.json'), 'utf8'));
  const mock = fs.readFileSync(path.join(HERE, 'mock-site.html'), 'utf8');
  const stub = STUB.replace('__VERSION__', manifest.version);

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    colorScheme: 'dark',
  });

  const store = { sync: {}, local: {} };
  const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

  const broadcast = async (changes, areaName) => {
    if (Object.keys(changes).length === 0) return;
    await Promise.all(
      context.pages().map((page) =>
        page
          .evaluate(([c, a]) => window.__offhookFire && window.__offhookFire(c, a), [changes, areaName])
          .catch(() => {})
      )
    );
  };

  const write = async (areaName, values) => {
    const changes = {};
    for (const [key, value] of Object.entries(values)) {
      const oldValue = store[areaName][key];
      if (JSON.stringify(oldValue) === JSON.stringify(value)) continue;
      store[areaName][key] = clone(value);
      changes[key] = { oldValue: clone(oldValue), newValue: clone(value) };
    }
    await broadcast(changes, areaName);
  };

  await context.exposeBinding('__offhookStoreGet', (_source, areaName, keys) => {
    const data = store[areaName];
    if (keys === null) return clone(data);
    const out = {};
    for (const key of [].concat(keys)) if (key in data) out[key] = clone(data[key]);
    return out;
  });
  await context.exposeBinding('__offhookStoreSet', (_source, areaName, values) => write(areaName, values));
  await context.exposeBinding('__offhookStoreRemove', async (_source, areaName, keys) => {
    const changes = {};
    for (const key of keys) {
      if (!(key in store[areaName])) continue;
      changes[key] = { oldValue: clone(store[areaName][key]) };
      delete store[areaName][key];
    }
    await broadcast(changes, areaName);
  });

  // Makieta strony: atrapa API i content script idą jako pierwsze skrypty
  // w <head>, czyli w tym samym momencie co document_start w rozszerzeniu.
  const siteHtml = ({ keepPlaying }) =>
    mock.replace(
      '<!--HARNESS-->',
      [
        '<script src="/__stub.js"></script>',
        keepPlaying ? '<script src="/content-scripts/keep-playing.js"></script>' : '',
        '<script src="/content-scripts/content.js"></script>',
      ].join('')
    );

  let keepPlaying = false;

  await context.route(`${ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/__stub.js') {
      return route.fulfill({ contentType: MIME['.js'], body: stub });
    }
    const file = path.join(BUILD, decodeURIComponent(url.pathname));
    if (file.startsWith(BUILD) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      let body = fs.readFileSync(file);
      if (url.pathname === '/popup.html') {
        body = body.toString('utf8').replace('<head>', '<head><script src="/__stub.js"></script>');
      }
      return route.fulfill({ contentType: MIME[path.extname(file)] || 'application/octet-stream', body });
    }
    return route.fulfill({ contentType: MIME['.html'], body: siteHtml({ keepPlaying }) });
  });

  return {
    browser,
    context,
    store,
    version: manifest.version,

    /** Wstrzykuje też skrypt "graj dalej w tle" (w makiecie dzieli świat JS z content scriptem). */
    setKeepPlayingScript(enabled) {
      keepPlaying = enabled;
    },

    async setSettings(patch) {
      const current = store.sync[SETTINGS_KEY] || {};
      const payload = { [SETTINGS_KEY]: { ...current, ...patch }, [SETTINGS_SAVED_AT_KEY]: Date.now() };
      await write('sync', payload);
      await write('local', payload);
    },
    settings: () => clone(store.sync[SETTINGS_KEY] || {}),

    async setGuard(patch, date = todayKey()) {
      const current = store.local[GUARD_KEY] || { editUntil: 0, ritualCount: 0, passUntil: 0, passCount: 0 };
      await write('local', { [GUARD_KEY]: { ...current, ...patch, date } });
    },
    guard: () => clone(store.local[GUARD_KEY] || {}),

    async setStats(seconds, videos = 0, date = todayKey()) {
      await write('local', { [STATS_KEY]: { date, seconds, videos } });
    },
    stats: () => clone(store.local[STATS_KEY] || null),

    async openSite(pathname = '/following', { clock } = {}) {
      const page = await context.newPage();
      if (clock) await page.clock.install({ time: clock });
      await page.goto(`${ORIGIN}${pathname}`);
      return page;
    },

    async openPopup({ clock, width: popupWidth = 360, height: popupHeight = 600 } = {}) {
      const page = await context.newPage();
      await page.setViewportSize({ width: popupWidth, height: popupHeight });
      if (clock) await page.clock.install({ time: clock });
      await page.goto(`${ORIGIN}/popup.html`);
      await page.waitForSelector('#root > *');
      return page;
    },

    async close() {
      await context.close();
      await browser.close();
    },
  };
}
