// Krok 1 grafik promocyjnych: zrzuty PRAWDZIWEGO interfejsu rozszerzenia
// (popup, zasłony, okno z kodem) na lokalnej makiecie strony.
// Wynik trafia do .output/promo-raw/<język>/ i jest składany w planszach
// (scripts/promo/layouts.js) oraz w filmie.
import fs from 'fs';
import path from 'path';
import { createHarness } from '../lib/harness.js';

export const RAW_DIR = path.resolve('.output', 'promo-raw');

const BASE = {
  masterEnabled: true,
  strictLock: true,
  theme: 'dark',
  hideForYouFeed: true,
  hideExploreFeed: true,
  hideFriends: true,
  hideLiveSidebar: true,
  hideShop: true,
  hideComments: true,
  hideLikeCount: true,
  hideCommentCount: true,
  hideShareCount: true,
  hideAds: true,
  hideGetCoinsApp: true,
  hideHeaderPromos: true,
  hideSuggestedAccounts: true,
  hideFollowingSidebarList: true,
  hideSidebarFooter: true,
  hideDescriptions: false,
  highlightFollowingAccounts: false,
  viralFilterEnabled: false,
  searchUnlockChallenge: true,
  redirectToProfile: false,
  entryGateEnabled: false,
  entryGateSeconds: 10,
  dailyLimitEnabled: false,
  dailyLimitMinutes: 30,
  quietHoursEnabled: false,
  quietStart: 22 * 60,
  quietEnd: 7 * 60,
  grayscale: false,
};

const settle = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));

const readCode = (page, id) =>
  page.evaluate(
    (modalId) => Array.from(document.querySelectorAll(`#${modalId} span span`), (s) => s.textContent).join(''),
    id
  );

async function captureSite(lang, dir) {
  const h = await createHarness({ width: 1280, height: 800, scale: 2 });
  const save = (page, name) => page.screenshot({ path: path.join(dir, `${name}.png`) });
  // Sama karta okna z kodem, bez przyciemnionego tła.
  const saveCard = (page, modalId, name) =>
    page.locator(`#${modalId} > div`).first().screenshot({ path: path.join(dir, `${name}-card.png`) });
  try {
    // Przed: rozszerzenie wyłączone.
    await h.setSettings({ ...BASE, language: lang, masterEnabled: false });
    let page = await h.openSite('/following');
    await settle();
    await save(page, 'site-before');
    await page.close();

    // Po: wszystkie blokady treści.
    await h.setSettings({ ...BASE, language: lang });
    page = await h.openSite('/following');
    await page.waitForSelector('#unhook-following-toggle');
    await settle(1600);
    await save(page, 'site-after');

    // Okno z kodem do szukajki, kod przepisany w połowie.
    await page.locator('input[data-e2e="search-user-input"]').click();
    await page.waitForSelector('#unhook-search-unlock-modal');
    const searchCode = await readCode(page, 'unhook-search-unlock-modal');
    await page.locator('#unhook-search-unlock-modal input').click();
    await page.keyboard.type(searchCode.slice(0, 17));
    await settle(400);
    await save(page, 'search-code');
    await saveCard(page, 'unhook-search-unlock-modal', 'search-code');
    await page.close();

    // Pauza na wejściu, w trakcie odliczania.
    await h.setSettings({ ...BASE, language: lang, entryGateEnabled: true });
    page = await h.openSite('/following', { clock: new Date() });
    await page.waitForSelector('#unhook-guard-screen');
    await page.clock.runFor(3000);
    await settle(300);
    await save(page, 'gate');
    await page.close();

    // Limit dzienny wyczerpany.
    await h.setSettings({ ...BASE, language: lang, dailyLimitEnabled: true });
    await h.setStats(30 * 60 + 12, 41);
    page = await h.openSite('/following');
    await page.waitForSelector('#unhook-guard-screen');
    await settle(400);
    await save(page, 'limit');

    // Przepustka: pierwszy kod (30 znaków), przepisany w większości.
    const passButton = page.locator('#unhook-guard-screen button').nth(1);
    await passButton.click();
    await page.waitForSelector('#unhook-pass-modal');
    let code = await readCode(page, 'unhook-pass-modal');
    await page.locator('#unhook-pass-modal input').click();
    await page.keyboard.type(code.slice(0, 21));
    await settle(400);
    await save(page, 'pass-30');
    await saveCard(page, 'unhook-pass-modal', 'pass-30');
    await page.keyboard.type(code.slice(21));
    await page.keyboard.press('Enter');
    await page.waitForSelector('#unhook-pass-pill');
    await settle(500);
    await save(page, 'pass-active');

    // Druga przepustka tego samego dnia: kod 45 znaków.
    await page.locator('#unhook-pass-pill button').click();
    await page.waitForSelector('#unhook-guard-screen');
    await page.locator('#unhook-guard-screen button').nth(1).click();
    await page.waitForSelector('#unhook-pass-modal');
    code = await readCode(page, 'unhook-pass-modal');
    await page.locator('#unhook-pass-modal input').click();
    await page.keyboard.type(code.slice(0, 9));
    await settle(400);
    await save(page, 'pass-45');
    await saveCard(page, 'unhook-pass-modal', 'pass-45');
    await page.close();

    // Ciche godziny: zegar strony ustawiony na 23:10.
    await h.setGuard({ passUntil: 0, passCount: 0 });
    await h.setSettings({ ...BASE, language: lang, quietHoursEnabled: true });
    page = await h.openSite('/following', { clock: new Date(2026, 0, 12, 23, 10, 0) });
    await page.waitForSelector('#unhook-guard-screen');
    await settle(400);
    await save(page, 'quiet');
    await page.close();
  } finally {
    await h.close();
  }
}

async function capturePopup(lang, dir, { ritualFrames }) {
  const h = await createHarness({ scale: 3 });
  const shell = (page) => page.locator('#root > div').first();
  try {
    await h.setSettings({
      ...BASE,
      language: lang,
      entryGateEnabled: true,
      dailyLimitEnabled: true,
      quietHoursEnabled: true,
    });
    await h.setStats(12 * 60 + 20, 9);
    await h.setGuard({ editUntil: 0, ritualCount: 0, passUntil: 0, passCount: 0 });

    let popup = await h.openPopup({ height: 620 });
    await settle(500);
    await shell(popup).screenshot({ path: path.join(dir, 'popup-main.png') });
    await popup.close();

    // Rytuał wyłączania: klatka po każdej przepisanej literze.
    popup = await h.openPopup({ clock: new Date(), height: 620 });
    await popup.locator('header button').last().click();
    await popup.waitForSelector('p.whitespace-pre-wrap');
    const phrase = await popup.evaluate(() =>
      Array.from(document.querySelectorAll('p.whitespace-pre-wrap span'), (s) => s.textContent).join('')
    );
    const ritualDir = path.join(dir, 'ritual');
    fs.mkdirSync(ritualDir, { recursive: true });
    const frame = async (name) => {
      await settle(170);
      await shell(popup).screenshot({ path: path.join(ritualDir, `${name}.png`) });
    };

    await popup.locator('input[type="text"]').click();
    if (ritualFrames) await frame('000');
    for (let index = 0; index < phrase.length; index += 1) {
      await popup.keyboard.type(phrase[index]);
      await popup.clock.runFor(1000);
      const typed = index + 1;
      if (ritualFrames) await frame(String(typed).padStart(3, '0'));
      if (typed === Math.round(phrase.length * 0.62)) {
        await settle(170);
        await shell(popup).screenshot({ path: path.join(dir, 'popup-ritual.png') });
      }
    }

    // Przytrzymanie przycisku w połowie.
    const confirm = popup.locator('button.h-10');
    const box = await confirm.boundingBox();
    await popup.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await popup.mouse.down();
    await popup.clock.runFor(1700);
    await settle(170);
    await shell(popup).screenshot({ path: path.join(dir, 'popup-hold.png') });
    await popup.mouse.up();
    await popup.close();

    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ phraseLength: phrase.length }, null, 2));
  } finally {
    await h.close();
  }
}

export async function captureRaw(lang, { ritualFrames = false } = {}) {
  const dir = path.join(RAW_DIR, lang);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  await captureSite(lang, dir);
  await capturePopup(lang, dir, { ritualFrames });
  return dir;
}

// Uruchomienie bezpośrednie: node scripts/promo/capture.js [en|pl] [--ritual]
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('scripts/promo/capture.js')) {
  const lang = process.argv[2] === 'pl' ? 'pl' : 'en';
  const dir = await captureRaw(lang, { ritualFrames: process.argv.includes('--ritual') });
  console.log('Zrzuty w', dir);
}
