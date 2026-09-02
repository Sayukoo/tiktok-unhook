import { defineContentScript } from 'wxt/sandbox';
import {
  getSettings,
  onSettingsChange,
  saveDailyStats,
  getDailyStats,
  getLastSession,
  saveLastSession,
  getFollowingCache,
  saveFollowingCache,
  todayKey,
  TikTokUnhookSettings,
  FollowingAccount,
} from '@/utils/storage';
import { generateStyles } from '@/utils/selectors';
import { getT } from '@/utils/i18n';

export default defineContentScript({
  matches: ['*://*.tiktok.com/*'],
  runAt: 'document_start',
  main() {
    console.log('[TikTok Unhook] Content script initialized.');

    const STYLE_ID = 'tiktok-unhook-injected-css';
    const REDIRECT_GUARD_KEY = 'unhook_redirect_guard_v1';
    const SUMMARY_SEEN_KEY = 'unhook_summary_seen_v1';
    const HIDDEN_MARK = 'data-unhook-hidden';
    const VIRAL_CHECKED_MARK = 'data-unhook-viral-checked';

    let currentSettings: TikTokUnhookSettings | null = null;

    const whenBodyReady = (): Promise<void> =>
      new Promise((resolve) => {
        if (document.body) return resolve();
        window.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
      });

    // --- Ochrona przed petla redirectow (przezywa pelne reloady przez sessionStorage) ---
    type GuardState = { count: number; ts: number };

    const canRedirect = (): boolean => {
      try {
        const now = Date.now();
        const raw = sessionStorage.getItem(REDIRECT_GUARD_KEY);
        let state: GuardState = raw ? JSON.parse(raw) : { count: 0, ts: now };
        if (now - state.ts > 30000) state = { count: 0, ts: now };
        state.count += 1;
        state.ts = now;
        sessionStorage.setItem(REDIRECT_GUARD_KEY, JSON.stringify(state));
        return state.count <= 3;
      } catch {
        return true;
      }
    };

    const clearRedirectGuard = () => {
      try {
        sessionStorage.removeItem(REDIRECT_GUARD_KEY);
      } catch {
        /* noop */
      }
    };

    const redirectToFollowing = () => {
      console.log('[TikTok Unhook] Redirecting to /following...');
      window.location.replace('/following');
    };

    // Profil wyglada jak "/@username". Pusty placeholder "/@" oznacza brak zalogowania.
    const getProfileHref = (): string | null => {
      const link = document.querySelector('[data-e2e="nav-profile"]');
      const href = link?.getAttribute('href') || null;
      return href && href.startsWith('/@') && href.length > 2 ? href : null;
    };

    const redirectToProfile = () => {
      if (!canRedirect()) {
        console.warn('[TikTok Unhook] Redirect budget exhausted - staying on current page.');
        return;
      }
      const href = getProfileHref();
      if (href) {
        console.log(`[TikTok Unhook] Redirecting to profile ${href}...`);
        window.location.replace(href);
        return;
      }

      let attempts = 0;
      const MAX_ATTEMPTS = 40; // ~20s co 500ms

      let intervalId = window.setInterval(() => {
        if (window.location.pathname !== '/') {
          window.clearInterval(intervalId);
          intervalId = 0;
          return;
        }

        attempts++;
        const foundHref = getProfileHref();
        if (foundHref) {
          window.clearInterval(intervalId);
          intervalId = 0;
          console.log(`[TikTok Unhook] Redirecting to profile ${foundHref}...`);
          window.location.replace(foundHref);
          return;
        }

        if (attempts >= MAX_ATTEMPTS) {
          window.clearInterval(intervalId);
          intervalId = 0;
          console.warn(
            '[TikTok Unhook] Profile link (data-e2e="nav-profile") not found after 20s. Staying on current page.'
          );
        }
      }, 500);
    };

    // 1. Auto-redirect z "For You" i "Explore"
    const HOME_PATHS = ['/', '/foryou'];

    const handleAutoRedirect = (settings: TikTokUnhookSettings) => {
      if (!settings.masterEnabled) return;

      const path = window.location.pathname;

      if (!HOME_PATHS.includes(path)) {
        clearRedirectGuard();
        return;
      }

      if (settings.hideForYouFeed) {
        if (!canRedirect()) {
          console.warn('[TikTok Unhook] Redirect loop detected - aborting redirect.');
          return;
        }
        if (settings.redirectToProfile) {
          redirectToProfile();
        } else {
          redirectToFollowing();
        }
        return;
      }

      if (settings.hideExploreFeed && path === '/explore') {
        if (!canRedirect()) return;
        redirectToFollowing();
      }
    };

    // 1b. Ukrywanie reklam i zakladki "You may like"
    const AD_LABELS = ['Ad', 'Sponsored', 'Reklama', 'Sponsorowane'];
    const RECOMMEND_TAB_LABELS = ['You may like', 'Może ci się spodobać', 'Możesz polubić'];
    const COMMENTS_TAB_LABELS = ['Comments', 'Komentarze'];

    const hideAdCardNear = (labelEl: Element) => {
      let node: Element | null = labelEl;
      for (let i = 0; i < 6 && node; i++) {
        if (node !== labelEl && node.querySelector('a, button')) {
          if (!node.hasAttribute(HIDDEN_MARK)) {
            (node as HTMLElement).style.display = 'none';
            node.setAttribute(HIDDEN_MARK, '1');
            console.log('[TikTok Unhook] Hidden ad block.');
          }
          return;
        }
        node = node.parentElement;
      }
    };

    const hideRecommendTab = (labelEl: Element) => {
      let tabButton: Element | null = labelEl;
      for (let i = 0; i < 3 && tabButton; i++) {
        if (tabButton.tagName === 'BUTTON' || tabButton.getAttribute('role') === 'tab') break;
        tabButton = tabButton.parentElement;
      }
      if (!tabButton || tabButton.hasAttribute(HIDDEN_MARK)) return;

      const siblings = tabButton.parentElement ? Array.from(tabButton.parentElement.children) : [];
      const commentsTab = siblings.find(
        (el) => el !== tabButton && COMMENTS_TAB_LABELS.includes((el.textContent || '').trim())
      );
      if (commentsTab instanceof HTMLElement) {
        commentsTab.click();
      }

      (tabButton as HTMLElement).style.display = 'none';
      tabButton.setAttribute(HIDDEN_MARK, '1');
      console.log('[TikTok Unhook] Hidden "You may like" tab.');
    };

    const MAX_SCAN_NODES = 4000;

    const scanForTextDistractions = (settings: TikTokUnhookSettings) => {
      if (!settings.masterEnabled || !settings.hideAds) return;
      if (!document.body || document.hidden) return;

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (el) =>
          (el as Element).children.length === 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP,
      });

      let node: Node | null;
      let visited = 0;
      while ((node = walker.nextNode()) && visited < MAX_SCAN_NODES) {
        visited++;
        const el = node as Element;
        if (el.hasAttribute(HIDDEN_MARK)) continue;
        const text = (el.textContent || '').trim();
        if (!text || text.length > 20) continue;

        if (AD_LABELS.includes(text)) {
          hideAdCardNear(el);
        } else if (RECOMMEND_TAB_LABELS.includes(text)) {
          hideRecommendTab(el);
        }
      }
    };

    // 1c. Filtr "Viral Only" dla /following
    const parseFormattedCount = (raw: string): number | null => {
      const text = raw.trim().toUpperCase().replace(/\s+/g, '');
      if (!text) return null;
      const match = text.match(/^([\d.,]+)([KMB]?)$/);
      if (!match) return null;

      let numStr = match[1];
      if (match[2]) {
        numStr = numStr.replace(/,/g, '.');
      } else {
        numStr = numStr.replace(/,/g, '');
      }
      const num = parseFloat(numStr);
      if (Number.isNaN(num)) return null;

      const multiplier =
        match[2] === 'K' ? 1_000 : match[2] === 'M' ? 1_000_000 : match[2] === 'B' ? 1_000_000_000 : 1;
      return Math.round(num * multiplier);
    };

    const getActiveFeedCard = (): Element | null => {
      const cards = document.querySelectorAll('[data-e2e="recommend-list-item-container"]');
      let best: Element | null = null;
      let bestVisible = 0;
      cards.forEach((card) => {
        const rect = (card as HTMLElement).getBoundingClientRect();
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        if (visibleHeight > bestVisible) {
          bestVisible = visibleHeight;
          best = card;
        }
      });
      return bestVisible > window.innerHeight * 0.5 ? best : null;
    };

    const SKIP_COOLDOWN_MS = 1200;
    const MAX_CONSECUTIVE_SKIPS = 25;
    let lastSkipAt = 0;
    let consecutiveSkips = 0;

    const scanViralFilter = (settings: TikTokUnhookSettings) => {
      if (!settings.masterEnabled || !settings.viralFilterEnabled) return;
      if (!window.location.pathname.startsWith('/following')) return;
      if (document.hidden) return;
      if (Date.now() - lastSkipAt < SKIP_COOLDOWN_MS) return;

      const card = getActiveFeedCard();
      if (!card || card.hasAttribute(VIRAL_CHECKED_MARK)) return;

      const likeEl = card.querySelector('[data-e2e$="like-count"]');
      const likes = likeEl ? parseFormattedCount(likeEl.textContent || '') : null;
      if (likes === null) return;

      const commentEl = card.querySelector('[data-e2e$="comment-count"]');
      const comments = commentEl ? parseFormattedCount(commentEl.textContent || '') ?? 0 : 0;

      card.setAttribute(VIRAL_CHECKED_MARK, '1');

      if (likes < settings.viralMinLikes && comments < settings.viralMinComments) {
        if (consecutiveSkips >= MAX_CONSECUTIVE_SKIPS) return;
        const nextBtn = document.querySelector('[data-e2e="feed-navigation-next"]') as HTMLElement | null;
        if (nextBtn) {
          consecutiveSkips++;
          lastSkipAt = Date.now();
          console.log(`[TikTok Unhook] Skipping non-viral video (${likes} likes, ${comments} comments).`);
          nextBtn.click();
        }
      } else {
        consecutiveSkips = 0;
      }
    };

    // --- Statystyki sesji (czas + filmy) ---
    const SESSION_MIN_SECONDS = 30;
    let sessionSeconds = 0;
    let sessionVideos = 0;
    let dailyStats = { date: todayKey(), seconds: 0, videos: 0 };
    let statsLastWrite = 0;
    let statsStarted = false;
    const seenCards = new WeakSet<Element>();

    const flushStats = async (force = false) => {
      const now = Date.now();
      if (!force && now - statsLastWrite < 60000) return;
      statsLastWrite = now;
      await saveDailyStats(dailyStats);
    };

    const countActiveVideo = () => {
      if (document.hidden || !document.body) return;
      const card = getActiveFeedCard();
      if (!card || seenCards.has(card)) return;
      seenCards.add(card);
      sessionVideos++;
      dailyStats.videos++;
    };

    const startStatsTracking = async () => {
      if (statsStarted) return;
      statsStarted = true;

      const existing = await getDailyStats();
      if (existing && existing.date === todayKey()) dailyStats = existing;
      else dailyStats = { date: todayKey(), seconds: 0, videos: 0 };

      window.setInterval(() => {
        if (document.hidden || !document.body) return;
        if (dailyStats.date !== todayKey()) dailyStats = { date: todayKey(), seconds: 0, videos: 0 };
        sessionSeconds += 15;
        dailyStats.seconds += 15;
        void flushStats(false);
      }, 15000);

      window.addEventListener('visibilitychange', () => {
        if (document.hidden) void flushStats(true);
      });

      window.addEventListener('pagehide', () => {
        if (sessionSeconds >= SESSION_MIN_SECONDS || sessionVideos > 0) {
          const minutes = Math.max(sessionVideos > 0 ? 1 : 0, Math.round(sessionSeconds / 60));
          void saveLastSession({ endedAt: Date.now(), minutes, videos: sessionVideos });
        }
        void flushStats(true);
      });
    };

    const maybeShowSessionSummary = async (language: 'en' | 'pl') => {
      try {
        if (sessionStorage.getItem(SUMMARY_SEEN_KEY)) return;
      } catch {
        /* noop */
      }

      const summary = await getLastSession();
      if (!summary) return;
      if (Date.now() - summary.endedAt > 36 * 60 * 60 * 1000) return;
      if (summary.minutes <= 0 && summary.videos <= 0) return;

      try {
        sessionStorage.setItem(SUMMARY_SEEN_KEY, '1');
      } catch {
        /* noop */
      }

      await whenBodyReady();

      const t = getT(language);
      const banner = document.createElement('div');
      banner.style.cssText =
        'position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
        'background:#161616;color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:999px;' +
        'padding:8px 14px;font-size:12.5px;font-family:inherit;display:flex;align-items:center;gap:10px;' +
        'box-shadow:0 8px 28px rgba(0,0,0,.35);max-width:90vw;white-space:nowrap;';

      const text = document.createElement('span');
      text.textContent = `${t.sessionSummaryPrefix} ${t.sessionVideosLabel(summary.videos)} • ${t.sessionMinutesLabel(summary.minutes)}`;

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.textContent = '\u00D7';
      closeBtn.style.cssText =
        'background:none;border:none;color:rgba(255,255,255,.6);font-size:16px;line-height:1;' +
        'cursor:pointer;padding:0;margin:0;';
      closeBtn.onclick = () => banner.remove();

      banner.appendChild(text);
      banner.appendChild(closeBtn);
      document.body.appendChild(banner);

      window.setTimeout(() => banner.remove(), 10000);
    };

    // --- Compact Grid v2: cache + szukajka + sortowanie ---
    const FOLLOWING_PANEL_ID = 'tiktok-unhook-following-panel';
    const FOLLOWING_HEADING_LABELS = [
      'Following accounts',
      'Obserwowane konta',
      'Konta obserwowane',
      'Obserwowani',
    ];
    const VIEW_ALL_LABELS = ['View all', 'Zobacz wszystkie', 'Zobacz wszystkich'];
    const DIALOG_SELECTOR = '[role="dialog"], [aria-modal="true"], [role="alertdialog"]';
    const FOLLOWING_TTL_MS = 6 * 60 * 60 * 1000;
    const MAX_AUTO_ATTEMPTS = 2;
    const AUTO_COOLDOWN_MS = 20000;
    const MANUAL_COOLDOWN_MS = 10000;

    type SortMode = 'default' | 'az' | 'za';

    let followingAccounts: FollowingAccount[] = [];
    let followingCacheFetchedAt = 0;
    let followingCacheLoaded = false;
    let followingFilter = '';
    let followingSort: SortMode = 'default';
    let followingGridDirty = true;
    let followingScraping = false;
    let autoScrapeAttempts = 0;
    let autoScrapeLastAttempt = 0;
    let manualScrapeLastAttempt = 0;
    let gridEl: HTMLElement | null = null;
    let gridCountEl: HTMLElement | null = null;

    const findSidebar = (): Element | null =>
      document.querySelector('[class*="DivSideNavContainer"]') ||
      document.querySelector('[data-e2e="nav-following"]')?.closest('nav') ||
      null;

    const waitFor = (check: () => boolean, timeoutMs: number, stepMs = 150): Promise<boolean> =>
      new Promise((resolve) => {
        const start = Date.now();
        const tick = () => {
          if (check()) return resolve(true);
          if (Date.now() - start > timeoutMs) return resolve(false);
          window.setTimeout(tick, stepMs);
        };
        tick();
      });

    const findByExactText = (labels: string[]): HTMLElement | null => {
      const candidates = document.querySelectorAll('button, div[role="button"], a');
      for (const el of Array.from(candidates)) {
        if (labels.includes((el.textContent || '').trim())) return el as HTMLElement;
      }
      return null;
    };

    const applyFilterSort = (): FollowingAccount[] => {
      const q = followingFilter.trim().toLowerCase();
      let list = followingAccounts;
      if (q) {
        list = list.filter(
          (a) => a.name.toLowerCase().includes(q) || a.href.toLowerCase().includes(q)
        );
      }
      if (followingSort === 'az' || followingSort === 'za') {
        list = [...list].sort((x, y) =>
          x.name.localeCompare(y.name, undefined, { sensitivity: 'base' })
        );
        if (followingSort === 'za') list.reverse();
      }
      return list;
    };

    const renderFollowingGrid = (lang: 'en' | 'pl') => {
      const grid = gridEl;
      const countTarget = gridCountEl;
      if (!grid || !countTarget || !followingGridDirty) return;
      followingGridDirty = false;

      while (grid.firstChild) grid.removeChild(grid.firstChild);

      const list = applyFilterSort();

      list.forEach(({ href, name, avatar }) => {
        const link = document.createElement('a');
        link.href = href;
        link.title = name;
        link.style.cssText =
          'display:block;width:34px;height:34px;border-radius:50%;overflow:hidden;flex-shrink:0;background:#333;';
        if (avatar) {
          const img = document.createElement('img');
          img.src = avatar;
          img.alt = name;
          img.loading = 'lazy';
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
          link.appendChild(img);
        }
        grid.appendChild(link);
      });

      if (list.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'grid-column:1/-1;font-size:11px;opacity:.55;padding:4px 2px;';
        empty.textContent = lang === 'pl' ? 'Brak wyników' : 'No results';
        grid.appendChild(empty);
      }

      countTarget.textContent = `${list.length}/${followingAccounts.length}`;
    };

    const ensureFollowingHost = (heading: Element, lang: 'en' | 'pl'): HTMLElement | null => {
      const existing = document.getElementById(FOLLOWING_PANEL_ID);
      if (existing) return existing;

      let sibling = heading.nextElementSibling;
      while (sibling) {
        const next = sibling.nextElementSibling;
        (sibling as HTMLElement).style.display = 'none';
        sibling.setAttribute(HIDDEN_MARK, '1');
        sibling = next;
      }

      const host = document.createElement('div');
      host.id = FOLLOWING_PANEL_ID;
      host.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:8px 4px;';

      const searchRow = document.createElement('div');
      searchRow.style.cssText = 'display:flex;align-items:center;gap:6px;';

      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = lang === 'pl' ? 'Szukaj twórc\u00f3w\u2026' : 'Search creators\u2026';
      input.style.cssText =
        'flex:1;min-width:0;padding:4px 8px;border-radius:8px;font-size:11px;outline:none;color:inherit;' +
        'border:1px solid rgba(128,128,128,.35);background:rgba(128,128,128,.08);';
      input.addEventListener('input', () => {
        followingFilter = input.value;
        followingGridDirty = true;
        renderFollowingGrid(lang);
      });

      const refreshBtn = document.createElement('button');
      refreshBtn.type = 'button';
      refreshBtn.textContent = '\u27F3';
      refreshBtn.title = lang === 'pl' ? 'Odśwież listę' : 'Refresh list';
      refreshBtn.style.cssText =
        'flex-shrink:0;width:24px;height:24px;border-radius:8px;border:1px solid rgba(128,128,128,.35);' +
        'background:rgba(128,128,128,.08);color:inherit;font-size:13px;line-height:1;cursor:pointer;' +
        'display:flex;align-items:center;justify-content:center;';
      refreshBtn.onclick = () => void manualScrape();

      searchRow.appendChild(input);
      searchRow.appendChild(refreshBtn);

      const sortRow = document.createElement('div');
      sortRow.style.cssText = 'display:flex;align-items:center;gap:4px;';

      const modes: { mode: SortMode; label: string }[] = [
        { mode: 'default', label: lang === 'pl' ? 'Domyślnie' : 'Recent' },
        { mode: 'az', label: 'A\u2013Z' },
        { mode: 'za', label: 'Z\u2013A' },
      ];

      const paintSortButtons = (buttons: HTMLElement[]) => {
        buttons.forEach((btn) => {
          const active = btn.dataset.mode === followingSort;
          btn.style.background = active ? 'rgba(37,244,238,.18)' : 'rgba(128,128,128,.08)';
        });
      };

      const sortButtons: HTMLElement[] = [];
      modes.forEach(({ mode, label }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.dataset.mode = mode;
        btn.style.cssText =
          'flex:1;padding:3px 6px;border-radius:7px;border:1px solid rgba(128,128,128,.28);' +
          'background:rgba(128,128,128,.08);color:inherit;font-size:10px;cursor:pointer;text-align:center;';
        btn.onclick = () => {
          followingSort = mode;
          followingGridDirty = true;
          paintSortButtons(sortButtons);
          renderFollowingGrid(lang);
        };
        sortRow.appendChild(btn);
        sortButtons.push(btn);
      });

      gridEl = document.createElement('div');
      gridEl.style.cssText =
        'display:grid;grid-template-columns:repeat(auto-fill,minmax(34px,34px));gap:8px;max-height:260px;overflow-y:auto;';

      gridCountEl = document.createElement('span');
      gridCountEl.style.cssText = 'font-size:9.5px;opacity:.5;';

      const caption = document.createElement('div');
      caption.style.cssText =
        'font-size:9.5px;font-weight:600;color:#25F4EE;text-transform:uppercase;letter-spacing:.4px;';
      caption.textContent =
        lang === 'pl' ? '\u2713 Konta, kt\u00f3re TY obserwujesz' : '\u2713 Accounts YOU follow';

      host.appendChild(caption);
      host.appendChild(searchRow);
      host.appendChild(sortRow);
      host.appendChild(gridEl);
      host.appendChild(gridCountEl);
      heading.insertAdjacentElement('afterend', host);

      paintSortButtons(sortButtons);
      followingGridDirty = true;
      renderFollowingGrid(lang);

      return host;
    };

    const dispatchEscape = () => {
      const evt = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true,
      });
      document.dispatchEvent(evt);
      document.activeElement?.dispatchEvent(evt);
    };

    const doScrape = async (): Promise<FollowingAccount[] | null> => {
      if (followingScraping) return null;
      followingScraping = true;
      console.log('[TikTok Unhook] Fetching full following list...');

      try {
        const viewAllBtn = findByExactText(VIEW_ALL_LABELS);
        if (!viewAllBtn) return null;

        viewAllBtn.click();
        await waitFor(() => document.querySelectorAll(`${DIALOG_SELECTOR} a[href^="/@"]`).length > 0, 4000);
        await new Promise((r) => window.setTimeout(r, 300));

        const dialog = document.querySelector(DIALOG_SELECTOR);
        const links = Array.from(
          (dialog || document).querySelectorAll('a[href^="/@"]')
        ) as HTMLAnchorElement[];

        const seen = new Set<string>();
        const accounts: FollowingAccount[] = [];
        links.forEach((a) => {
          const href = a.getAttribute('href') || '';
          if (!href.startsWith('/@') || href.length <= 2 || seen.has(href)) return;
          seen.add(href);
          const img = a.querySelector('img');
          const name = (a.textContent || href.slice(2)).trim().slice(0, 40) || href.slice(2);
          accounts.push({ href, name, avatar: img?.getAttribute('src') || null });
        });

        dispatchEscape();
        await new Promise((r) => window.setTimeout(r, 250));

        if (dialog && dialog.isConnected) {
          const closeBtn = Array.from(dialog.querySelectorAll('button, [role="button"]')).find(
            (el) => el.querySelector('svg') && !(el.textContent || '').trim()
          );
          if (closeBtn instanceof HTMLElement) closeBtn.click();
          await new Promise((r) => window.setTimeout(r, 250));
        }

        if (accounts.length > 0) {
          followingAccounts = accounts;
          followingCacheFetchedAt = Date.now();
          followingGridDirty = true;
          void saveFollowingCache({ fetchedAt: followingCacheFetchedAt, accounts });
          console.log(`[TikTok Unhook] Following list ready (${accounts.length} accounts).`);
          return accounts;
        }
        return null;
      } finally {
        followingScraping = false;
      }
    };

    const manualScrape = async () => {
      const now = Date.now();
      if (now - manualScrapeLastAttempt < MANUAL_COOLDOWN_MS) return;
      manualScrapeLastAttempt = now;
      await doScrape();
      if (currentSettings && followingGridDirty) renderFollowingGrid(currentSettings.language);
    };

    const maybeAutoScrape = () => {
      if (followingScraping) return;
      const now = Date.now();
      if (autoScrapeAttempts >= MAX_AUTO_ATTEMPTS) return;
      if (now - autoScrapeLastAttempt < AUTO_COOLDOWN_MS) return;
      autoScrapeAttempts++;
      autoScrapeLastAttempt = now;
      void doScrape().then(() => {
        if (currentSettings && followingGridDirty) renderFollowingGrid(currentSettings.language);
      });
    };

    const buildCompactFollowingPanel = async (settings: TikTokUnhookSettings) => {
      if (!settings.masterEnabled || !settings.showAllFollowingInSidebar) return;
      if (document.hidden) return;

      const sidebar = findSidebar();
      if (!sidebar) return;

      const heading = Array.from(sidebar.querySelectorAll('*')).find(
        (el) =>
          el.children.length === 0 &&
          FOLLOWING_HEADING_LABELS.includes((el.textContent || '').trim())
      );
      if (!heading) return;

      ensureFollowingHost(heading, settings.language);

      if (!followingCacheLoaded) {
        followingCacheLoaded = true;
        const cache = await getFollowingCache();
        if (cache?.accounts.length) {
          followingAccounts = cache.accounts;
          followingCacheFetchedAt = cache.fetchedAt;
          followingGridDirty = true;
          renderFollowingGrid(settings.language);
        }
      }

      const fresh =
        followingCacheFetchedAt > 0 && Date.now() - followingCacheFetchedAt < FOLLOWING_TTL_MS;
      if (!fresh) maybeAutoScrape();
    };

    let scanTimer: number | null = null;
    const scheduleTextScan = () => {
      if (scanTimer !== null || !currentSettings) return;
      scanTimer = window.setTimeout(() => {
        scanTimer = null;
        const s = currentSettings;
        if (!s) return;
        countActiveVideo();
        scanForTextDistractions(s);
        scanViralFilter(s);
        void buildCompactFollowingPanel(s);
      }, 600);
    };

    // 2. Wstrzykniecie CSS do DOM
    const applyCSS = (settings: TikTokUnhookSettings) => {
      currentSettings = settings;

      let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        (document.head || document.documentElement).appendChild(styleEl);
      }

      styleEl.textContent = generateStyles(settings);

      if (settings.masterEnabled) {
        document.documentElement.classList.add('unhook-active');
        if (HOME_PATHS.includes(window.location.pathname)) {
          document.documentElement.classList.add('unhook-home-feed');
        } else {
          document.documentElement.classList.remove('unhook-home-feed');
        }
      } else {
        document.documentElement.classList.remove('unhook-active', 'unhook-home-feed');
      }

      handleAutoRedirect(settings);
      scheduleTextScan();
    };

    // 3. Poczatkowe ustawienia
    getSettings().then((settings) => {
      applyCSS(settings);
      void maybeShowSessionSummary(settings.language);
      void startStatsTracking();
    });

    onSettingsChange((newSettings) => {
      applyCSS(newSettings);
    });

    // 4. Detekcja zmiany trasy SPA (polling - izolowany swiat nie widzi pushState strony)
    const onLocationChange = () => {
      consecutiveSkips = 0;
      if (currentSettings) {
        applyCSS(currentSettings);
      }
    };

    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);

    let lastHref = window.location.href;
    window.setInterval(() => {
      if (window.location.href !== lastHref) {
        lastHref = window.location.href;
        onLocationChange();
      }
    }, 300);

    // 5. Mutation Observer
    const observer = new MutationObserver(() => {
      if (!currentSettings) return;
      if (!document.getElementById(STYLE_ID)) {
        applyCSS(currentSettings);
      }
      scheduleTextScan();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  },
});
