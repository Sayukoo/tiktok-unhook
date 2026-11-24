// Testy zachowania na ZBUDOWANYM rozszerzeniu: npm run build && npm run e2e
// Popup i content script działają w przeglądarce, na lokalnej makiecie strony,
// z atrapą chrome.storage (patrz scripts/lib/harness.js).
import { createHarness, todayKey } from './lib/harness.js';

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: Boolean(ok) });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `  -> ${detail}`}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Czeka, aż warunek w stronie będzie prawdziwy; zwraca false po czasie. */
async function until(page, fn, arg, timeout = 4000) {
  try {
    await page.waitForFunction(fn, arg, { timeout });
    return true;
  } catch {
    return false;
  }
}

const shown = (page, selector) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return !!el && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
  }, selector);

const readCode = (page, id) =>
  page.evaluate((modalId) => Array.from(document.querySelectorAll(`#${modalId} span span`), (s) => s.textContent).join(''), id);

const text = (page, selector) => page.evaluate((sel) => document.querySelector(sel)?.textContent ?? null, selector);

const STRICT = {
  masterEnabled: true,
  strictLock: true,
  language: 'en',
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
  searchUnlockChallenge: true,
  redirectToProfile: false,
  entryGateEnabled: false,
  dailyLimitEnabled: false,
  quietHoursEnabled: false,
  grayscale: false,
  keepPlayingInBackground: true,
};

async function testHiding(h) {
  console.log('\n# Ukrywanie elementów');
  await h.setSettings(STRICT);
  const page = await h.openSite('/following');
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await until(page, () => document.querySelector('[data-e2e="nav-foryou"]')?.closest('li')?.hasAttribute('data-unhook-hide'));

  check('przycisk "For You" ukryty', !(await shown(page, '[data-e2e="nav-foryou"]')));
  check('opakowanie pozycji menu zwinięte', await page.evaluate(() => document.querySelector('[data-e2e="nav-foryou"]').closest('li').getAttribute('data-unhook-hide') === '1'));
  check('"Explore", "LIVE", "Shop" ukryte', !(await shown(page, '[data-e2e="nav-explore"]')) && !(await shown(page, '[data-e2e="nav-live"]')) && !(await shown(page, '[data-e2e="nav-shop"]')));
  check('"Following" i "Profile" zostają', (await shown(page, '[data-e2e="nav-following"]')) && (await shown(page, '[data-e2e="nav-profile"]')));
  check('komentarze ukryte', !(await shown(page, '[data-e2e="comment-list"]')));
  check('liczniki ukryte', !(await shown(page, '[data-e2e="like-count"]')) && !(await shown(page, '[data-e2e="share-count"]')));
  check('sugerowane konta i stopka ukryte', !(await shown(page, '[data-e2e="suggest-accounts"]')) && !(await shown(page, '[data-e2e="footer-container"]')));
  check('"Get coins" ukryte', !(await shown(page, '[data-e2e="get-coins-button"]')));
  await until(page, () => document.querySelector('.promo-btn')?.hasAttribute('data-unhook-promo'));
  check('"Get app" rozpoznane po treści i ukryte', !(await shown(page, '.promo-btn')));
  check('lista obserwowanych zwinięta za przyciskiem', (await shown(page, '#unhook-following-toggle')) && !(await shown(page, '[data-e2e="following-user-button"]')));
  check('blok "Sponsored" rozpoznany po treści i ukryty', await until(page, () => getComputedStyle(document.querySelector('.ad')).display === 'none'));
  check('film zostaje widoczny', await shown(page, '[data-e2e="feed-video"]'));

  await h.setSettings({ grayscale: true });
  check('skala szarości włącza filtr na <html>', await until(page, () => getComputedStyle(document.documentElement).filter.includes('grayscale')));
  await h.setSettings({ grayscale: false, hideComments: false });
  check('wyłączenie opcji odsłania element bez przeładowania', await until(page, () => getComputedStyle(document.querySelector('[data-e2e="comment-list"]')).display !== 'none'));

  await h.setSettings({ masterEnabled: false });
  check('wyłączenie całości odsłania wszystko', await until(page, () => {
    const el = document.querySelector('[data-e2e="nav-foryou"]');
    return getComputedStyle(el).display !== 'none' && !el.closest('li').hasAttribute('data-unhook-hide');
  }));
  check('po wyłączeniu nie zostaje żaden nasz element', await page.evaluate(() => document.querySelectorAll('[data-unhook-ui]').length === 0));
  check('bez błędów JS na stronie', errors.length === 0, errors.join(' | '));
  await page.close();
}

async function testSearchLock(h) {
  console.log('\n# Blokada szukajki');
  await h.setSettings(STRICT);
  const page = await h.openSite('/following');
  const input = page.locator('input[data-e2e="search-user-input"]');
  check('pole szukania dostaje opis blokady', await until(page, () => document.querySelector('input[data-e2e="search-user-input"]').placeholder.startsWith('Locked')));

  await input.click();
  check('klik w pole otwiera okno z kodem', await until(page, () => !!document.getElementById('unhook-search-unlock-modal')));
  const code = await readCode(page, 'unhook-search-unlock-modal');
  check('kod ma 30 znaków', code.length === 30, code);

  const modalInput = page.locator('#unhook-search-unlock-modal input');
  const confirm = page.locator('#unhook-search-unlock-modal button', { hasText: 'Unlock search' });

  // Stary błąd: dowolne 30 znaków z co najmniej 4 różnymi otwierało blokadę.
  await modalInput.click();
  await page.keyboard.type('abcdabcdabcdabcdabcdabcdabcdab');
  check('dowolne 30 znaków NIE odblokowuje (przycisk nieaktywny)', await confirm.isDisabled());
  await page.keyboard.press('Enter');
  await sleep(200);
  check('Enter z błędnym kodem nic nie robi', (await page.evaluate(() => !!document.getElementById('unhook-search-unlock-modal'))) && !(await page.evaluate(() => sessionStorage.getItem('unhook_search_unlocked_until_v1'))));
  check('komunikat o niezgodności widoczny', (await page.locator('#unhook-search-unlock-modal').innerText()).includes('does not match'));

  const pasteBlocked = await page.evaluate(() => {
    const el = document.querySelector('#unhook-search-unlock-modal input');
    return !el.dispatchEvent(new ClipboardEvent('paste', { cancelable: true, bubbles: true }));
  });
  check('wklejanie zablokowane', pasteBlocked);

  await modalInput.fill('');
  await page.keyboard.type(code.slice(0, 29));
  check('niepełny kod nie odblokowuje', await confirm.isDisabled());
  await page.keyboard.type(code.slice(29));
  check('dokładnie przepisany kod aktywuje przycisk', await confirm.isEnabled());
  await page.keyboard.press('Enter');
  check('okno znika po poprawnym kodzie', await until(page, () => !document.getElementById('unhook-search-unlock-modal')));
  check('pigułka z odliczaniem widoczna', await until(page, () => /Search open · [45]:\d\d/.test(document.getElementById('unhook-search-pill')?.textContent || '')));
  check('pole szukania odzyskuje swój opis', await until(page, () => document.querySelector('input[data-e2e="search-user-input"]').placeholder === 'Search'));

  // Odliczanie na pigułce nie może budzić pełnego skanu strony.
  await sleep(1500);
  await page.evaluate(() => {
    const original = document.createTreeWalker.bind(document);
    window.__scans = 0;
    document.createTreeWalker = (...args) => {
      window.__scans += 1;
      return original(...args);
    };
  });
  await sleep(4200);
  const idleScans = await page.evaluate(() => window.__scans);
  check('odliczanie pigułki nie uruchamia skanów strony', idleScans === 0, `skany: ${idleScans}`);
  await page.evaluate(() => document.querySelector('.main').appendChild(document.createElement('div')));
  check('zmiana na stronie nadal uruchamia skan', await until(page, () => window.__scans > 0));

  await page.locator('#unhook-search-pill button').click();
  check('"Lock now" zdejmuje pigułkę i blokuje ponownie', await until(page, () => !document.getElementById('unhook-search-pill') && document.querySelector('input[data-e2e="search-user-input"]').placeholder.startsWith('Locked')));
  await page.close();

  const results = await h.openSite('/search?q=test');
  check('strona wyników zasłonięta', await until(results, () => (document.getElementById('unhook-search-lock-overlay')?.textContent || '').includes('Search is locked')));
  await results.locator('#unhook-search-lock-overlay button', { hasText: 'Unlock search' }).click();
  check('przycisk na zasłonie otwiera okno z kodem', await until(results, () => !!document.getElementById('unhook-search-unlock-modal')));
  await results.close();
}

async function testEntryGate(h) {
  console.log('\n# Pauza na wejściu');
  await h.setSettings({ ...STRICT, entryGateEnabled: true, entryGateSeconds: 5 });
  const page = await h.openSite('/following', { clock: new Date() });
  check('zasłona z odliczaniem', await until(page, () => (document.getElementById('unhook-guard-screen')?.textContent || '').includes('Hold on a moment')));
  const primary = page.locator('#unhook-guard-screen button').first();
  check('przycisk wejścia nieaktywny w trakcie odliczania', (await primary.isDisabled()) && /Opens in [45] s/.test(await primary.innerText()));
  await page.clock.runFor(2000);
  check('odliczanie biegnie', /Opens in [23] s/.test(await primary.innerText()), await primary.innerText());
  await page.clock.runFor(3500);
  check('po czasie przycisk "Go in" aktywny', (await primary.isEnabled()) && (await primary.innerText()) === 'Go in');
  await primary.click();
  check('wejście zdejmuje zasłonę', await until(page, () => !document.getElementById('unhook-guard-screen')));
  check('zapamiętany werdykt dla wczesnej zasłony', (await page.evaluate(() => localStorage.getItem('unhook_guard_cache_v1'))) === '{"gate":true,"block":false}');

  await page.reload();
  await sleep(800);
  check('ta sama karta po przeładowaniu: bez pauzy', !(await page.evaluate(() => !!document.getElementById('unhook-guard-screen'))));
  await page.close();

  const fresh = await h.context.newPage();
  // Odpowiedź storage wstrzymana: widać, czy strona jest zasłonięta, zanim przyjdą ustawienia.
  await fresh.addInitScript(() => {
    window.__veilAtStart = null;
    document.addEventListener('DOMContentLoaded', () => {
      window.__veilAtStart = !!document.getElementById('unhook-veil') || !!document.getElementById('unhook-guard-screen');
    });
  });
  await fresh.goto('https://shortvideo.test/following');
  check('nowa karta: strona zasłonięta od pierwszej chwili', await fresh.evaluate(() => window.__veilAtStart === true));
  check('nowa karta: pauza pokazuje się ponownie', await until(fresh, () => (document.getElementById('unhook-guard-screen')?.textContent || '').includes('Hold on a moment')));
  check('wczesna zasłona zdjęta po pojawieniu się właściwej', !(await fresh.evaluate(() => !!document.getElementById('unhook-veil'))));
  await fresh.locator('#unhook-guard-screen button', { hasText: 'Leave the site' }).click();
  check('"Leave the site" opuszcza stronę', await until(fresh, () => location.href === 'about:blank'));
  await fresh.close();
}

async function testDailyLimit(h) {
  console.log('\n# Limit dzienny i przepustka');
  await h.setSettings({ ...STRICT, dailyLimitEnabled: true, dailyLimitMinutes: 30 });
  await h.setGuard({ editUntil: 0, ritualCount: 0, passUntil: 0, passCount: 0 });
  await h.setStats(30 * 60 - 20);
  const page = await h.openSite('/following', { clock: new Date() });
  await sleep(500);
  check('poniżej limitu strona otwarta', !(await page.evaluate(() => !!document.getElementById('unhook-guard-screen'))));

  await page.clock.runFor(31000);
  check('przekroczenie limitu w trakcie oglądania zasłania stronę', await until(page, () => (document.getElementById('unhook-guard-screen')?.textContent || '').includes('That is it for today')));
  const atBlock = h.stats().seconds;
  check('czas doliczony do wspólnego licznika', atBlock >= 30 * 60 && atBlock <= 30 * 60 + 15, String(atBlock));

  await page.clock.runFor(45000);
  await sleep(300);
  check('czas pod zasłoną nie jest liczony', h.stats().seconds === atBlock, `${atBlock} -> ${h.stats().seconds}`);

  await page.locator('#unhook-guard-screen button', { hasText: 'I need 5 more minutes' }).click();
  check('przepustka otwiera okno z kodem', await until(page, () => !!document.getElementById('unhook-pass-modal')));
  let code = await readCode(page, 'unhook-pass-modal');
  check('pierwsza przepustka: kod 30 znaków', code.length === 30, String(code.length));
  await page.locator('#unhook-pass-modal input').click();
  await page.keyboard.type(code);
  await page.keyboard.press('Enter');
  check('poprawny kod zdejmuje zasłonę', await until(page, () => !document.getElementById('unhook-guard-screen')));
  check('pigułka przepustki z odliczaniem', await until(page, () => /Pass · [45]:\d\d/.test(document.getElementById('unhook-pass-pill')?.textContent || '')));
  check('stan przepustki zapisany', h.guard().passCount === 1 && h.guard().passUntil > Date.now());

  await page.locator('#unhook-pass-pill button').click();
  check('"End now" od razu zasłania stronę', await until(page, () => !!document.getElementById('unhook-guard-screen') && !document.getElementById('unhook-pass-pill')));

  await page.locator('#unhook-guard-screen button', { hasText: 'I need 5 more minutes' }).click();
  await until(page, () => !!document.getElementById('unhook-pass-modal'));
  code = await readCode(page, 'unhook-pass-modal');
  check('druga przepustka tego dnia: kod 45 znaków', code.length === 45, String(code.length));
  await page.locator('#unhook-pass-modal input').click();
  await page.keyboard.type(code);
  await page.keyboard.press('Enter');
  await until(page, () => !document.getElementById('unhook-guard-screen'));
  await page.clock.runFor(5 * 60 * 1000 + 2000);
  check('po 5 minutach przepustka wygasa i zasłona wraca', await until(page, () => !!document.getElementById('unhook-guard-screen')));

  await h.setSettings({ dailyLimitMinutes: 120 });
  check('podniesienie limitu odsłania stronę na żywo', await until(page, () => !document.getElementById('unhook-guard-screen')));
  await page.close();
}

async function testQuietHours(h) {
  console.log('\n# Ciche godziny');
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const wrap = (value) => ((value % 1440) + 1440) % 1440;
  const end = wrap(minutes + 90);
  await h.setStats(0);
  await h.setGuard({ passUntil: 0, passCount: 0 });
  await h.setSettings({ ...STRICT, quietHoursEnabled: true, quietStart: wrap(minutes - 60), quietEnd: end });
  const page = await h.openSite('/following');
  const clock = `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
  check('zasłona cichych godzin z godziną końca', await until(page, (c) => (document.getElementById('unhook-guard-screen')?.textContent || '').includes(`closed until ${c}`), clock));

  const scrolled = await page.evaluate(() => {
    let reached = false;
    document.body.addEventListener('keydown', () => { reached = true; });
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    return reached;
  });
  check('klawisze przewijania nie docierają do strony pod zasłoną', scrolled === false);

  await h.setSettings({ quietStart: wrap(minutes + 30), quietEnd: wrap(minutes + 90) });
  check('poza oknem strona się odsłania', await until(page, () => !document.getElementById('unhook-guard-screen')));
  await page.close();
}

async function testStatsAcrossTabs(h) {
  console.log('\n# Licznik czasu w kilku kartach');
  await h.setSettings(STRICT);
  await h.setStats(600, 3);
  const first = await h.openSite('/following', { clock: new Date() });
  const second = await h.openSite('/following', { clock: new Date() });
  await sleep(400);
  await first.clock.runFor(30000);
  await sleep(200);
  const afterFirst = h.stats().seconds;
  await second.clock.runFor(30000);
  await sleep(200);
  const afterSecond = h.stats().seconds;
  // Stary kod: druga karta zapisywała własną kopię (600 + 30) i kasowała czas pierwszej.
  check('pierwsza karta dolicza swój czas', afterFirst === 630, String(afterFirst));
  // Zegar drugiej karty biegł też w czasie testu pierwszej, stąd zapas 2 s.
  check('druga karta DOPISUJE, a nie nadpisuje', afterSecond >= 659 && afterSecond <= 662, String(afterSecond));
  check('liczba filmów zachowana', h.stats().videos >= 3, String(h.stats().videos));

  await h.setStats(40, 0, '2000-01-01');
  await first.clock.runFor(15000);
  await sleep(200);
  check('wpis z innego dnia jest zerowany, a nie doliczany', h.stats().date === todayKey() && h.stats().seconds <= 15, JSON.stringify(h.stats()));
  await first.close();
  await second.close();
}

async function testRedirects(h) {
  console.log('\n# Strony LIVE i sklepu');
  await h.setSettings(STRICT);
  const go = async (pathname) => {
    const page = await h.openSite(pathname);
    await sleep(900);
    const result = new URL(page.url()).pathname;
    await page.close();
    return result;
  };
  check('/live przenosi na /following', (await go('/live')) === '/following');
  check('/shop/deals przenosi na /following', (await go('/shop/deals')) === '/following');
  check('/explore przenosi na /following', (await go('/explore')) === '/following');
  check('transmisja obserwowanej osoby (/@mira/live) zostaje', (await go('/@mira/live')) === '/@mira/live');
  await h.setSettings({ hideLiveSidebar: false, hideShop: false });
  check('przy wyłączonych opcjach /live i /shop zostają', (await go('/live')) === '/live' && (await go('/shop')) === '/shop');
}

async function testKeepPlaying(h) {
  console.log('\n# Granie w tle (skrypt w świecie strony)');
  await h.setSettings(STRICT);
  h.setKeepPlayingScript(true);
  const page = await h.openSite('/following');
  const probe = () =>
    page.evaluate(() => {
      const native = /\[native code\]/.test(String(Object.getOwnPropertyDescriptor(Document.prototype, 'hidden').get));
      let pageListener = false;
      let ownListener = false;
      const onDocument = () => { pageListener = true; };
      const onWindow = () => { ownListener = true; };
      document.addEventListener('visibilitychange', onDocument);
      window.addEventListener('visibilitychange', onWindow, true);
      document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
      document.removeEventListener('visibilitychange', onDocument);
      window.removeEventListener('visibilitychange', onWindow, true);

      let inputBlur = false;
      const field = document.querySelector('.promo-btn');
      field.addEventListener('blur', () => { inputBlur = true; }, { once: true });
      field.dispatchEvent(new FocusEvent('blur'));
      return { native, pageListener, ownListener, inputBlur, hidden: document.hidden, state: document.visibilityState };
    });

  const on = await probe();
  check('strona widzi kartę jako zawsze widoczną', on.native === false && on.hidden === false && on.state === 'visible');
  check('nasłuch strony na zmianę widoczności jest wyciszony', on.pageListener === false);
  check('licznik czasu rozszerzenia nadal dostaje zdarzenie', on.ownListener === true);
  check('zdarzenia blur pól formularzy docierają do strony', on.inputBlur === true);

  await h.setSettings({ keepPlayingInBackground: false });
  await until(page, () => localStorage.getItem('unhook_keep_playing_v1') === '0');
  await page.reload();
  const off = await probe();
  check('po wyłączeniu opcji API widoczności jest nietknięte', off.native === true && off.pageListener === true);
  h.setKeepPlayingScript(false);
  await page.close();
}

async function typeRitual(popup) {
  const phrase = await popup.evaluate(() => Array.from(document.querySelectorAll('p.whitespace-pre-wrap span'), (s) => s.textContent).join(''));
  const input = popup.locator('input[type="text"]');
  await input.click();
  for (const char of phrase) {
    await popup.keyboard.type(char);
    await popup.clock.runFor(1000);
  }
  return { phrase, typed: await input.inputValue() };
}

async function testPopupLock(h) {
  console.log('\n# Popup: zamek i rytuał');
  await h.setSettings(STRICT);
  await h.setStats(17 * 60);
  await h.setGuard({ editUntil: Date.now() + 10 * 60 * 1000, ritualCount: 0, passUntil: 0, passCount: 0 });
  const popup = await h.openPopup({ clock: new Date() });
  const errors = [];
  popup.on('pageerror', (error) => errors.push(error.message));
  const body = () => popup.locator('#root').innerText();
  const row = (name) => popup.getByRole('switch', { name, exact: true });
  const power = popup.locator('header button').last();
  const inRitual = async () => /Before you (loosen this|turn this off)/.test(await body());

  check('nazwa i wersja w popupie', (await body()).includes('Offhook') && (await body()).includes(`v${h.version}`));
  check('popup nie pokazuje cudzej nazwy', !/tik\s*tok/i.test(await popup.content()));
  check('dzisiejszy czas z licznika', (await body()).includes('Today 17 min'));
  check('świeża instalacja: okno ustawień otwarte', /Settings open · (9:5\d|10:00)/.test(await body()));

  await popup.getByText('Expand all').click();
  await row('Hide comments').click();
  check('w otwartym oknie przełącznik działa od razu', h.settings().hideComments === false && !(await inRitual()));
  await row('Hide comments').click();

  await popup.getByText('Lock now').click();
  check('"Lock now" zamyka okno ustawień', h.guard().editUntil === 0 && !(await body()).includes('Settings open'));

  await row('Grayscale').click();
  check('WZMOCNIENIE blokady nie wymaga rytuału', h.settings().grayscale === true && !(await inRitual()));
  await popup.locator('header button').nth(2).click();
  check('zmiana motywu nie wymaga rytuału', h.settings().theme === 'light' && !(await inRitual()));
  await popup.locator('header button').nth(2).click();

  await row('Hide comments').click();
  check('OSŁABIENIE blokady otwiera rytuał', (await body()).includes('Before you loosen this') && h.settings().hideComments === true);
  await popup.getByText('Keep it on').click();
  check('"Keep it on" wraca bez zmiany', h.settings().hideComments === true && !(await inRitual()));

  await row('Lock my settings').click();
  check('wyłączenie samego zamka też wymaga rytuału', (await inRitual()) && h.settings().strictLock === true);
  await popup.getByText('Keep it on').click();

  await row('Daily limit').click();
  check('włączenie limitu od razu', h.settings().dailyLimitEnabled === true && !(await inRitual()));
  const before = h.settings().dailyLimitMinutes;
  await popup.getByLabel('Minutes per day -').click();
  check('zmniejszenie limitu od razu', h.settings().dailyLimitMinutes < before && !(await inRitual()));
  const lowered = h.settings().dailyLimitMinutes;
  await popup.getByLabel('Minutes per day +').click();
  check('zwiększenie limitu wymaga rytuału', (await inRitual()) && h.settings().dailyLimitMinutes === lowered);
  await popup.getByText('Keep it on').click();

  await power.click();
  check('wyłącznik główny otwiera rytuał', (await body()).includes('Before you turn this off') && h.settings().masterEnabled === true);

  const input = popup.locator('input[type="text"]');
  await input.click();
  await popup.keyboard.type('abcdefgh');
  check('pisanie szybciej niż litera na sekundę jest obcinane', (await input.inputValue()).length <= 1, await input.inputValue());
  await popup.getByText('Different text, from the start').click();

  const confirm = popup.locator('button', { hasText: /Type the whole text|Hold for 3 seconds/ });
  check('przycisk potwierdzenia nieaktywny przed przepisaniem', await confirm.isDisabled());
  const { phrase, typed } = await typeRitual(popup);
  check('pierwszy rytuał dnia: jedno zdanie', phrase.length > 40 && phrase.length < 70, String(phrase.length));
  check('zdanie przepisane w całości', typed === phrase, `${typed.length}/${phrase.length}`);
  check('po przepisaniu przycisk czeka na przytrzymanie', (await confirm.isEnabled()) && (await confirm.innerText()).includes('Hold for 3 seconds'));

  const box = await confirm.boundingBox();
  await popup.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await popup.mouse.down();
  await popup.clock.runFor(1500);
  await popup.mouse.up();
  check('zbyt krótkie przytrzymanie nie wyłącza', h.settings().masterEnabled === true);
  await popup.mouse.down();
  await popup.clock.runFor(3300);
  await popup.mouse.up();
  check('pełny rytuał wyłącza ochronę', await until(popup, () => document.getElementById('root').innerText.includes('Protection off')) && h.settings().masterEnabled === false);
  check('rytuał policzony, okno 3 minut otwarte', h.guard().ritualCount === 1 && h.guard().editUntil > Date.now() + 170000);

  await power.click();
  check('włączenie z powrotem bez rytuału', h.settings().masterEnabled === true && !(await inRitual()));
  await popup.clock.runFor(3 * 60 * 1000 + 1500);
  check('okno ustawień samo się zamyka po 3 minutach', !(await body()).includes('Settings open'));

  await power.click();
  const second = await popup.evaluate(() => Array.from(document.querySelectorAll('p.whitespace-pre-wrap span'), (s) => s.textContent).join(''));
  check('drugi rytuał tego dnia: dwa zdania', second.length > 100 && (await body()).includes('Round 2 today'), String(second.length));
  await popup.getByText('Keep it on').click();
  await popup.close();

  await h.setGuard({ ritualCount: 5, editUntil: 0 }, '2000-01-01');
  const nextDay = await h.openPopup({ clock: new Date() });
  await nextDay.locator('header button').last().click();
  const reset = await nextDay.evaluate(() => Array.from(document.querySelectorAll('p.whitespace-pre-wrap span'), (s) => s.textContent).join(''));
  check('następnego dnia eskalacja zaczyna od nowa', reset.length < 70, String(reset.length));
  await nextDay.close();

  await h.setSettings({ strictLock: false });
  const loose = await h.openPopup({ clock: new Date() });
  await loose.getByText('Expand all').click().catch(() => {});
  await loose.getByRole('switch', { name: 'Grayscale', exact: true }).click();
  check('bez zamka pojedyncze przełączniki są swobodne', h.settings().grayscale === false && !/Before you/.test(await loose.locator('#root').innerText()));
  await loose.locator('header button').last().click();
  check('bez zamka wyłącznik główny NADAL wymaga rytuału', (await loose.locator('#root').innerText()).includes('Before you turn this off'));
  await loose.close();
  check('bez błędów JS w popupie', errors.length === 0, errors.join(' | '));

  await h.setSettings({ ...STRICT, language: 'pl' });
  const polish = await h.openPopup();
  const plText = await polish.locator('#root').innerText();
  check('polski interfejs bez cudzej nazwy', plText.includes('Offhook') && !/tik\s*tok/i.test(plText));
  await polish.close();
}

const only = process.argv[2];
const suites = {
  hiding: testHiding,
  search: testSearchLock,
  gate: testEntryGate,
  limit: testDailyLimit,
  quiet: testQuietHours,
  stats: testStatsAcrossTabs,
  redirects: testRedirects,
  keepPlaying: testKeepPlaying,
  popup: testPopupLock,
};

const harness = await createHarness();
try {
  for (const [name, suite] of Object.entries(suites)) {
    if (only && only !== name) continue;
    try {
      await suite(harness);
    } catch (error) {
      check(`${name}: test przerwany`, false, String(error?.message || error).split('\n').slice(0, 8).join(' / '));
    }
    await Promise.all(harness.context.pages().map((page) => page.close().catch(() => {})));
  }
} finally {
  await harness.close();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} przeszło`);
if (failed.length > 0) {
  console.log('Nie przeszły:');
  for (const result of failed) console.log(`  - ${result.name}`);
  process.exitCode = 1;
}
