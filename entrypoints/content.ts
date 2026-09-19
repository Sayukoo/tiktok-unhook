import { defineContentScript } from 'wxt/sandbox';
import {
  getSettings,
  onSettingsChange,
  saveDailyStats,
  getDailyStats,
  getLastSession,
  saveLastSession,
  clearLegacyStorage,
  todayKey,
  TikTokUnhookSettings,
} from '@/utils/storage';
import { generateStyles, WRAPPED_HIDE_RULES, WRAPPER_HIDE_ATTR } from '@/utils/selectors';
import { getT } from '@/utils/i18n';

export default defineContentScript({
  matches: ['*://*.tiktok.com/*'],
  runAt: 'document_start',
  main() {
    console.log('[TikTok Unhook] Content script initialized.');

    // --- Background playback: stop TikTok's own JS from pausing video on tab switch/minimize ---
    // TikTok voluntarily pauses via the Page Visibility API (document.hidden/visibilitychange),
    // not because browsers force it. We spoof that API for the PAGE's own scripts by injecting
    // a <script> tag (isolated content-script world can't override it for the page itself).
    // Settings load async, but this must run at document_start before TikTok's bundle attaches
    // its listeners - so we read a synchronous localStorage cache written on every settings save.
    const KEEP_PLAYING_CACHE_KEY = 'unhook_keep_playing_v1';
    const readKeepPlayingCache = (): boolean => {
      try {
        const v = localStorage.getItem(KEEP_PLAYING_CACHE_KEY);
        return v === null ? true : v === '1'; // default true = matches DEFAULT_SETTINGS
      } catch {
        return true;
      }
    };
    const writeKeepPlayingCache = (enabled: boolean) => {
      try {
        localStorage.setItem(KEEP_PLAYING_CACHE_KEY, enabled ? '1' : '0');
      } catch {
        /* noop */
      }
    };

    if (readKeepPlayingCache()) {
      try {
        const script = document.createElement('script');
        script.textContent = `(${String(function () {
          try {
            Object.defineProperty(Document.prototype, 'hidden', { get: () => false, configurable: true });
            Object.defineProperty(Document.prototype, 'visibilityState', {
              get: () => 'visible',
              configurable: true,
            });
            document.hasFocus = () => true;

            const block = (e: Event) => e.stopImmediatePropagation();
            document.addEventListener('visibilitychange', block, true);
            document.addEventListener('webkitvisibilitychange', block, true);
            window.addEventListener('blur', block, true);
          } catch (err) {
            console.error('[TikTok Unhook] Background playback override failed:', err);
          }
        })})();`;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
      } catch (err) {
        console.error('[TikTok Unhook] Could not inject background playback override:', err);
      }
    }

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

    // Budzet przekierowan jest sprawdzany przez wywolujacego (handleAutoRedirect),
    // wiec ta funkcja go juz NIE konsumuje po raz drugi.
    const redirectToProfile = () => {
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
      const isHome = HOME_PATHS.includes(path);
      const isExplore = path === '/explore' || path.startsWith('/explore/');

      if (!isHome && !isExplore) {
        clearRedirectGuard();
        return;
      }

      if (isHome && settings.redirectToProfile) {
        if (!canRedirect()) {
          console.warn('[TikTok Unhook] Redirect loop detected - aborting redirect.');
          return;
        }
        redirectToProfile();
        return;
      }

      if (isExplore && settings.hideExploreFeed) {
        if (!canRedirect()) {
          console.warn('[TikTok Unhook] Redirect loop detected - aborting redirect.');
          return;
        }
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
    // Po dluzszej serii pomijanych filmow robimy krotka przerwe zamiast trwale
    // wylaczac filtr do zmiany strony - poprzednia wersja z twardym limitem 25
    // po prostu przestawala dzialac na dobre, gdy w Obserwowanych trafilo sie
    // wiecej niewiralowych filmow z rzedu (bardzo czeste przy mniejszych kontach).
    const STUCK_STREAK_THRESHOLD = 15;
    const STUCK_BACKOFF_MS = 8000;
    let lastSkipAt = 0;
    let consecutiveSkips = 0;
    let backoffUntil = 0;

    const scanViralFilter = (settings: TikTokUnhookSettings) => {
      if (!settings.masterEnabled || !settings.viralFilterEnabled) return;
      if (!window.location.pathname.startsWith('/following')) return;
      if (document.hidden) return;
      const now = Date.now();
      if (now < backoffUntil) return;
      if (now - lastSkipAt < SKIP_COOLDOWN_MS) return;

      const card = getActiveFeedCard();
      if (!card || card.hasAttribute(VIRAL_CHECKED_MARK)) return;

      const likeEl = card.querySelector('[data-e2e$="like-count"]');
      const likes = likeEl ? parseFormattedCount(likeEl.textContent || '') : null;
      if (likes === null) return;

      const commentEl = card.querySelector('[data-e2e$="comment-count"]');
      const comments = commentEl ? parseFormattedCount(commentEl.textContent || '') ?? 0 : 0;

      card.setAttribute(VIRAL_CHECKED_MARK, '1');

      if (likes < settings.viralMinLikes && comments < settings.viralMinComments) {
        const nextBtn = document.querySelector('[data-e2e="feed-navigation-next"]') as HTMLElement | null;
        if (nextBtn) {
          consecutiveSkips++;
          lastSkipAt = now;
          console.log(`[TikTok Unhook] Skipping non-viral video (${likes} likes, ${comments} comments).`);
          nextBtn.click();
          if (consecutiveSkips >= STUCK_STREAK_THRESHOLD) {
            backoffUntil = now + STUCK_BACKOFF_MS;
            consecutiveSkips = 0;
            console.log('[TikTok Unhook] Many non-viral videos in a row - pausing skip briefly.');
          }
        }
      } else {
        consecutiveSkips = 0;
      }
    };

    const SEARCH_INPUT_ATTR = 'data-unhook-search-intercepted';
    const SEARCH_UNLOCKED_UNTIL_KEY = 'unhook_search_unlocked_until_v1';
    const SEARCH_UNLOCK_MODAL_ID = 'tiktok-unhook-search-unlock-modal';
    const SEARCH_LOCK_OVERLAY_ID = 'tiktok-unhook-search-lock-overlay';
    const SEARCH_PILL_ID = 'tiktok-unhook-search-pill';
    const SEARCH_TOAST_ID = 'tiktok-unhook-unlock-toast';
    const UNLOCK_DURATION_MS = 5 * 60 * 1000;
    const TARGET_CHARS_COUNT = 30;

    const isSearchUnlocked = (): boolean => {
      try {
        const raw = sessionStorage.getItem(SEARCH_UNLOCKED_UNTIL_KEY);
        if (!raw) return false;
        const until = parseInt(raw, 10);
        return !Number.isNaN(until) && Date.now() < until;
      } catch {
        return false;
      }
    };

    const getSearchRemainingMs = (): number => {
      try {
        const raw = sessionStorage.getItem(SEARCH_UNLOCKED_UNTIL_KEY);
        if (!raw) return 0;
        const until = parseInt(raw, 10);
        return Math.max(0, until - Date.now());
      } catch {
        return 0;
      }
    };

    const setUnlockedSession = () => {
      try {
        sessionStorage.setItem(SEARCH_UNLOCKED_UNTIL_KEY, String(Date.now() + UNLOCK_DURATION_MS));
      } catch {
        /* noop */
      }
    };

    const clearUnlockedSession = () => {
      try {
        sessionStorage.removeItem(SEARCH_UNLOCKED_UNTIL_KEY);
      } catch {
        /* noop */
      }
    };

    const generateRandomChallenge = (length = 30): string => {
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
      let res = '';
      for (let i = 0; i < length; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return res;
    };

    // --- Wyglad w stylu TikToka ---
    const TT_FONT =
      '"TikTokFont", "TikTokDisplayFont", ProximaNova, -apple-system, BlinkMacSystemFont, ' +
      '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    const TT_RED = '#FE2C55';
    const TT_CYAN = '#25F4EE';
    const TT_SURFACE = '#1F1F23';
    const TT_SURFACE_SOFT = 'rgba(255,255,255,0.06)';
    const TT_BORDER = 'rgba(255,255,255,0.12)';

    let searchPillTimer: number | null = null;
    let sessionToastTimer: number | null = null;

    const showSessionToast = (msg: string) => {
      let toast = document.getElementById(SEARCH_TOAST_ID);
      if (!toast) {
        toast = document.createElement('div');
        toast.id = SEARCH_TOAST_ID;
        toast.style.cssText =
          'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
          `background:${TT_SURFACE};color:#fff;border:1px solid ${TT_BORDER};border-radius:8px;` +
          `padding:11px 18px;font-size:14px;font-weight:600;font-family:${TT_FONT};` +
          'box-shadow:0 8px 28px rgba(0,0,0,0.5);';
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      if (sessionToastTimer) window.clearTimeout(sessionToastTimer);
      sessionToastTimer = window.setTimeout(() => {
        sessionToastTimer = null;
        document.getElementById(SEARCH_TOAST_ID)?.remove();
      }, 3500);
    };

    const updateSearchPill = (lang: 'en' | 'pl') => {
      const existing = document.getElementById(SEARCH_PILL_ID);
      if (!currentSettings?.masterEnabled || !currentSettings?.searchUnlockChallenge || !isSearchUnlocked()) {
        if (existing) existing.remove();
        if (searchPillTimer) {
          window.clearInterval(searchPillTimer);
          searchPillTimer = null;
        }
        return;
      }

      const t = getT(lang);
      let pill = existing;
      if (!pill) {
        pill = document.createElement('div');
        pill.id = SEARCH_PILL_ID;
        pill.style.cssText =
          'position:fixed;top:70px;right:20px;z-index:2147483640;' +
          `background:${TT_SURFACE};border:1px solid ${TT_BORDER};border-radius:999px;` +
          'padding:7px 8px 7px 14px;box-shadow:0 6px 20px rgba(0,0,0,0.4);' +
          `display:flex;align-items:center;gap:10px;font-family:${TT_FONT};font-size:13px;color:#fff;`;
        document.body.appendChild(pill);
      }

      const renderPillContent = () => {
        const remainingMs = getSearchRemainingMs();
        if (remainingMs <= 0) {
          clearUnlockedSession();
          if (pill) pill.remove();
          if (searchPillTimer) {
            window.clearInterval(searchPillTimer);
            searchPillTimer = null;
          }
          if (currentSettings) {
            handleSearchInterception(currentSettings);
            handleSearchPageGuard(currentSettings);
          }
          return;
        }

        const totalSecs = Math.ceil(remainingMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;

        while (pill?.firstChild) pill.removeChild(pill.firstChild);

        const timeSpan = document.createElement('span');
        timeSpan.style.cssText = `color:${TT_CYAN};font-weight:600;`;
        timeSpan.textContent = t.searchUnlockStatusUnlocked(mins, secs);

        const lockBtn = document.createElement('button');
        lockBtn.type = 'button';
        lockBtn.textContent = t.searchUnlockLockNow;
        lockBtn.style.cssText =
          `background:${TT_RED};border:none;color:#fff;font-family:${TT_FONT};` +
          'font-size:12px;font-weight:600;padding:5px 12px;border-radius:999px;cursor:pointer;transition:filter .15s;';
        lockBtn.onmouseover = () => {
          lockBtn.style.filter = 'brightness(1.12)';
        };
        lockBtn.onmouseout = () => {
          lockBtn.style.filter = 'none';
        };
        lockBtn.onclick = (e) => {
          e.preventDefault();
          clearUnlockedSession();
          if (pill) pill.remove();
          if (searchPillTimer) {
            window.clearInterval(searchPillTimer);
            searchPillTimer = null;
          }
          if (currentSettings) {
            handleSearchInterception(currentSettings);
            handleSearchPageGuard(currentSettings);
          }
        };

        pill?.appendChild(timeSpan);
        pill?.appendChild(lockBtn);
      };

      renderPillContent();

      if (!searchPillTimer) {
        searchPillTimer = window.setInterval(renderPillContent, 1000);
      }
    };

    /** Ikonka kluczyka rysowana jako SVG - bez emoji, zeby trzymac styl TikToka. */
    const buildLockGlyph = (size = 22): SVGSVGElement => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', String(size));
      svg.setAttribute('height', String(size));
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '3');
      rect.setAttribute('y', '11');
      rect.setAttribute('width', '18');
      rect.setAttribute('height', '11');
      rect.setAttribute('rx', '2');

      const shackle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      shackle.setAttribute('d', 'M7 11V7a5 5 0 0 1 10 0v4');

      svg.appendChild(rect);
      svg.appendChild(shackle);
      return svg;
    };

    const openSearchUnlockModal = (lang: 'en' | 'pl' = currentSettings?.language || 'en') => {
      if (document.getElementById(SEARCH_UNLOCK_MODAL_ID)) {
        document.querySelector<HTMLInputElement>(`#${SEARCH_UNLOCK_MODAL_ID} input`)?.focus();
        return;
      }

      const t = getT(lang);
      let challengeCode = generateRandomChallenge(TARGET_CHARS_COUNT);

      const backdrop = document.createElement('div');
      backdrop.id = SEARCH_UNLOCK_MODAL_ID;
      backdrop.style.cssText =
        'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,0.72);' +
        'backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;' +
        `font-family:${TT_FONT};color:#fff;`;

      const card = document.createElement('div');
      card.style.cssText =
        `background:${TT_SURFACE};border-radius:12px;padding:28px;max-width:420px;width:100%;` +
        'box-shadow:0 16px 48px rgba(0,0,0,0.6);display:flex;flex-direction:column;gap:0;' +
        'position:relative;animation:unhookFadeIn 0.18s ease-out;box-sizing:border-box;';

      const closeModal = () => {
        backdrop.remove();
        window.removeEventListener('keydown', onKeyDownEsc);
      };

      const onKeyDownEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeModal();
      };
      window.addEventListener('keydown', onKeyDownEsc);
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
      });

      // --- Zamkniecie ---
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.textContent = '✕';
      closeBtn.style.cssText =
        'position:absolute;top:16px;right:16px;background:none;border:none;color:rgba(255,255,255,0.45);' +
        `font-size:16px;line-height:1;cursor:pointer;padding:6px;border-radius:6px;font-family:${TT_FONT};transition:color .15s;`;
      closeBtn.onmouseover = () => {
        closeBtn.style.color = '#fff';
      };
      closeBtn.onmouseout = () => {
        closeBtn.style.color = 'rgba(255,255,255,0.45)';
      };
      closeBtn.onclick = closeModal;

      // --- Naglowek ---
      const lockBadge = document.createElement('div');
      lockBadge.style.cssText =
        `width:52px;height:52px;border-radius:50%;background:${TT_RED};color:#fff;` +
        'display:flex;align-items:center;justify-content:center;margin:0 auto 16px auto;' +
        `box-shadow:0 0 0 6px rgba(254,44,85,0.14);`;
      lockBadge.appendChild(buildLockGlyph(24));

      const titleEl = document.createElement('h2');
      titleEl.style.cssText =
        `margin:0 0 6px 0;font-family:${TT_FONT};font-size:22px;font-weight:700;` +
        'line-height:1.25;color:#fff;text-align:center;letter-spacing:-0.02em;';
      titleEl.textContent = t.searchUnlockModalTitle;

      const subtitleEl = document.createElement('p');
      subtitleEl.style.cssText =
        'margin:0 0 20px 0;font-size:14px;line-height:1.45;color:rgba(255,255,255,0.6);text-align:center;';
      subtitleEl.textContent = t.searchUnlockModalSubtitle;

      // --- Kod do przepisania ---
      const codeBox = document.createElement('div');
      codeBox.style.cssText =
        `background:${TT_SURFACE_SOFT};border-radius:8px;padding:14px 16px;margin-bottom:12px;` +
        'display:flex;flex-direction:column;gap:10px;';

      const codeLabelRow = document.createElement('div');
      codeLabelRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;';

      const codeLabel = document.createElement('span');
      codeLabel.style.cssText =
        'font-size:11px;font-weight:600;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.08em;';
      codeLabel.textContent = t.searchUnlockCodeLabel;

      const refreshCodeBtn = document.createElement('button');
      refreshCodeBtn.type = 'button';
      refreshCodeBtn.textContent = t.searchUnlockNewCode;
      refreshCodeBtn.style.cssText =
        `background:none;border:none;color:${TT_CYAN};font-family:${TT_FONT};font-size:12px;` +
        'font-weight:600;cursor:pointer;padding:2px 4px;transition:opacity .15s;';
      refreshCodeBtn.onmouseover = () => {
        refreshCodeBtn.style.opacity = '0.7';
      };
      refreshCodeBtn.onmouseout = () => {
        refreshCodeBtn.style.opacity = '1';
      };

      codeLabelRow.appendChild(codeLabel);
      codeLabelRow.appendChild(refreshCodeBtn);

      // Kod rysujemy jako osobne 5-znakowe bloki, zeby zawijal sie MIEDZY nimi,
      // a nie w srodku bloku - inaczej ostatnia grupa pekala na dwie linie.
      const codeDisplay = document.createElement('div');
      codeDisplay.style.cssText =
        'display:flex;flex-wrap:wrap;justify-content:center;gap:8px 16px;user-select:none;' +
        'max-width:220px;margin:0 auto;';

      const renderCode = (code: string) => {
        while (codeDisplay.firstChild) codeDisplay.removeChild(codeDisplay.firstChild);
        (code.match(/.{1,5}/g) || [code]).forEach((chunk) => {
          const span = document.createElement('span');
          span.style.cssText =
            'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:16px;' +
            'font-weight:600;letter-spacing:0.1em;color:#fff;white-space:nowrap;';
          span.textContent = chunk;
          codeDisplay.appendChild(span);
        });
      };
      renderCode(challengeCode);

      refreshCodeBtn.onclick = () => {
        challengeCode = generateRandomChallenge(TARGET_CHARS_COUNT);
        renderCode(challengeCode);
      };

      codeBox.appendChild(codeLabelRow);
      codeBox.appendChild(codeDisplay);

      // --- Ostrzezenie o wklejaniu ---
      const pasteWarning = document.createElement('div');
      pasteWarning.style.cssText =
        `display:none;background:rgba(254,44,85,0.12);border-radius:6px;padding:8px 12px;margin-bottom:10px;` +
        `font-size:12.5px;color:${TT_RED};font-weight:600;text-align:center;`;
      pasteWarning.textContent = t.searchUnlockPasteBlocked;

      let pasteWarningTimer: number | null = null;
      const showPasteWarning = () => {
        pasteWarning.style.display = 'block';
        if (pasteWarningTimer) window.clearTimeout(pasteWarningTimer);
        pasteWarningTimer = window.setTimeout(() => {
          pasteWarning.style.display = 'none';
        }, 3000);
      };

      // --- Pole tekstowe ---
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = t.searchUnlockInputPlaceholder;
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.style.cssText =
        'width:100%;box-sizing:border-box;padding:13px 14px;border-radius:8px;' +
        `background:${TT_SURFACE_SOFT};border:1px solid transparent;color:#fff;font-size:14px;` +
        'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:0.06em;' +
        'outline:none;transition:border-color .15s,background-color .15s;';
      input.onfocus = () => {
        input.style.borderColor = TT_RED;
      };
      input.onblur = () => {
        input.style.borderColor = 'transparent';
      };
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        showPasteWarning();
      });

      // --- Postep ---
      const progressRow = document.createElement('div');
      progressRow.style.cssText = 'display:flex;align-items:center;gap:12px;margin:12px 0 18px 0;';

      const progressBarTrack = document.createElement('div');
      progressBarTrack.style.cssText =
        'flex:1;height:3px;background:rgba(255,255,255,0.12);border-radius:999px;overflow:hidden;';

      const progressBarFill = document.createElement('div');
      progressBarFill.style.cssText =
        `height:100%;width:0%;background:${TT_RED};border-radius:999px;transition:width .15s ease,background-color .2s ease;`;
      progressBarTrack.appendChild(progressBarFill);

      const countSpan = document.createElement('span');
      countSpan.style.cssText =
        'font-size:12.5px;font-weight:600;color:rgba(255,255,255,0.5);font-variant-numeric:tabular-nums;white-space:nowrap;';
      countSpan.textContent = t.searchUnlockCharsCount(0, TARGET_CHARS_COUNT);

      progressRow.appendChild(progressBarTrack);
      progressRow.appendChild(countSpan);

      // --- Przyciski ---
      const unlockBtn = document.createElement('button');
      unlockBtn.type = 'button';
      unlockBtn.textContent = t.searchUnlockBtn;
      unlockBtn.disabled = true;

      const setUnlockBtnState = (enabled: boolean) => {
        unlockBtn.disabled = !enabled;
        unlockBtn.style.cssText =
          `width:100%;padding:12px 18px;border-radius:8px;font-family:${TT_FONT};font-size:15px;` +
          'font-weight:700;border:none;transition:filter .15s,background-color .2s,color .2s;' +
          (enabled
            ? `background:${TT_RED};color:#fff;cursor:pointer;`
            : 'background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.3);cursor:not-allowed;');
      };
      setUnlockBtnState(false);
      unlockBtn.onmouseover = () => {
        if (!unlockBtn.disabled) unlockBtn.style.filter = 'brightness(1.1)';
      };
      unlockBtn.onmouseout = () => {
        unlockBtn.style.filter = 'none';
      };

      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.textContent = t.searchUnlockBackBtn;
      backBtn.style.cssText =
        `width:100%;padding:11px 12px;margin-top:8px;border-radius:8px;background:none;border:none;` +
        `color:rgba(255,255,255,0.5);font-family:${TT_FONT};font-size:14px;font-weight:600;cursor:pointer;transition:color .15s;`;
      backBtn.onmouseover = () => {
        backBtn.style.color = '#fff';
      };
      backBtn.onmouseout = () => {
        backBtn.style.color = 'rgba(255,255,255,0.5)';
      };
      backBtn.onclick = () => {
        closeModal();
        if (window.location.pathname.startsWith('/search')) {
          window.location.href = '/following';
        }
      };

      const checkAndUnlock = () => {
        const val = input.value;
        if (val.length < TARGET_CHARS_COUNT || new Set(val.split('')).size < 4) return;

        setUnlockedSession();
        closeModal();

        if (currentSettings) {
          handleSearchInterception(currentSettings);
          handleSearchPageGuard(currentSettings);
          updateSearchPill(currentSettings.language);
        }

        showSessionToast(t.searchUnlockSuccessToast);

        window.setTimeout(() => {
          const realInput = document.querySelector<HTMLInputElement>(
            'input[data-e2e="search-user-input"], input[type="search"], form[action*="/search"] input'
          );
          if (realInput) {
            realInput.focus();
            realInput.select();
          }
        }, 150);
      };

      input.addEventListener('input', () => {
        const len = input.value.length;
        const pct = Math.min(100, Math.round((len / TARGET_CHARS_COUNT) * 100));
        const isValid = len >= TARGET_CHARS_COUNT && new Set(input.value.split('')).size >= 4;

        progressBarFill.style.width = `${pct}%`;
        progressBarFill.style.backgroundColor = isValid ? TT_CYAN : TT_RED;
        countSpan.textContent = t.searchUnlockCharsCount(len, TARGET_CHARS_COUNT);
        countSpan.style.color = isValid ? TT_CYAN : 'rgba(255,255,255,0.5)';
        setUnlockBtnState(isValid);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          checkAndUnlock();
        }
      });

      unlockBtn.onclick = checkAndUnlock;

      card.appendChild(closeBtn);
      card.appendChild(lockBadge);
      card.appendChild(titleEl);
      card.appendChild(subtitleEl);
      card.appendChild(codeBox);
      card.appendChild(pasteWarning);
      card.appendChild(input);
      card.appendChild(progressRow);
      card.appendChild(unlockBtn);
      card.appendChild(backBtn);
      backdrop.appendChild(card);
      document.body.appendChild(backdrop);

      window.setTimeout(() => input.focus(), 60);
    };

    const handleSearchInterception = (settings: TikTokUnhookSettings) => {
      const searchLocked = settings.masterEnabled && settings.searchUnlockChallenge && !isSearchUnlocked();

      if (!settings.masterEnabled || !settings.searchUnlockChallenge) {
        updateSearchPill(settings.language);

        const inputs = document.querySelectorAll<HTMLInputElement>(
          'input[data-e2e="search-user-input"], input[type="search"], form[action*="/search"] input'
        );
        inputs.forEach((input) => {
          const orig = input.getAttribute('data-unhook-orig-placeholder');
          if (orig !== null) input.placeholder = orig;
        });
        return;
      }

      updateSearchPill(settings.language);

      const inputs = document.querySelectorAll<HTMLInputElement>(
        'input[data-e2e="search-user-input"], input[type="search"], form[action*="/search"] input'
      );

      const t = getT(settings.language);

      inputs.forEach((input) => {
        if (!input.hasAttribute(SEARCH_INPUT_ATTR)) {
          input.setAttribute(SEARCH_INPUT_ATTR, '1');
          input.setAttribute('data-unhook-orig-placeholder', input.placeholder || '');
        }

        if (searchLocked) {
          input.placeholder = t.searchUnlockPlaceholderLocked;
        } else {
          const orig = input.getAttribute('data-unhook-orig-placeholder');
          if (orig !== null) input.placeholder = orig;
        }

        if (!(input as any)._unhookLockFocusHandler) {
          const focusHandler = (e: Event) => {
            if (currentSettings?.masterEnabled && currentSettings?.searchUnlockChallenge && !isSearchUnlocked()) {
              e.preventDefault();
              e.stopPropagation();
              input.blur();
              openSearchUnlockModal(currentSettings.language);
            }
          };
          (input as any)._unhookLockFocusHandler = focusHandler;
          input.addEventListener('focus', focusHandler, true);
          input.addEventListener('click', focusHandler, true);
        }

        const validateAndBlock = (e: Event): boolean => {
          if (!currentSettings?.masterEnabled) return true;

          if (currentSettings.searchUnlockChallenge && !isSearchUnlocked()) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            input.blur();
            openSearchUnlockModal(currentSettings.language);
            return false;
          }

          return true;
        };

        if (!(input as any)._unhookKeydownHandler) {
          const keydownHandler = (e: KeyboardEvent) => {
            if (currentSettings?.masterEnabled && currentSettings?.searchUnlockChallenge && !isSearchUnlocked()) {
              e.preventDefault();
              e.stopPropagation();
              input.blur();
              openSearchUnlockModal(currentSettings.language);
              return;
            }
            if (e.key === 'Enter') {
              validateAndBlock(e);
            }
          };
          (input as any)._unhookKeydownHandler = keydownHandler;
          input.addEventListener('keydown', keydownHandler, true);
        }

        const form = input.closest('form');
        if (form && !(form as any)._unhookSubmitHandler) {
          const submitHandler = (e: Event) => {
            validateAndBlock(e);
          };
          (form as any)._unhookSubmitHandler = submitHandler;
          form.addEventListener('submit', submitHandler, true);

          const submitBtn = form.querySelector('button[type="submit"], [data-e2e="search-box-button"]');
          if (submitBtn && !(submitBtn as any)._unhookClickHandler) {
            const clickHandler = (e: Event) => {
              validateAndBlock(e);
            };
            (submitBtn as any)._unhookClickHandler = clickHandler;
            submitBtn.addEventListener('click', clickHandler, true);
          }
        }
      });

      const standaloneSearchBtns = document.querySelectorAll<HTMLElement>(
        'button[data-e2e="search-box-button"], [data-e2e="nav-search"], a[href*="/search"]'
      );
      standaloneSearchBtns.forEach((btn) => {
        if (!(btn as any)._unhookStandaloneSearchHandler) {
          const clickHandler = (e: Event) => {
            if (currentSettings?.masterEnabled && currentSettings?.searchUnlockChallenge && !isSearchUnlocked()) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              openSearchUnlockModal(currentSettings.language);
            }
          };
          (btn as any)._unhookStandaloneSearchHandler = clickHandler;
          btn.addEventListener('click', clickHandler, true);
        }
      });
    };

    const handleSearchPageGuard = (settings: TikTokUnhookSettings) => {
      const existingLockOverlay = document.getElementById(SEARCH_LOCK_OVERLAY_ID);

      const shouldBlock =
        settings.masterEnabled &&
        settings.searchUnlockChallenge &&
        !isSearchUnlocked() &&
        window.location.pathname.startsWith('/search');

      if (!shouldBlock) {
        existingLockOverlay?.remove();
        return;
      }

      if (existingLockOverlay) return;

      const t = getT(settings.language);

      const overlay = document.createElement('div');
      overlay.id = SEARCH_LOCK_OVERLAY_ID;
      overlay.style.cssText =
        'position:fixed;top:60px;left:0;right:0;bottom:0;z-index:999999;' +
        'background:rgba(18,18,18,0.97);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;' +
        `padding:20px;font-family:${TT_FONT};color:#fff;`;

      const card = document.createElement('div');
      card.style.cssText =
        'max-width:400px;width:100%;text-align:center;display:flex;flex-direction:column;align-items:center;gap:0;';

      const badge = document.createElement('div');
      badge.style.cssText =
        `width:56px;height:56px;border-radius:50%;background:${TT_RED};color:#fff;` +
        'display:flex;align-items:center;justify-content:center;margin-bottom:18px;' +
        'box-shadow:0 0 0 7px rgba(254,44,85,0.14);';
      badge.appendChild(buildLockGlyph(26));

      const titleEl = document.createElement('h2');
      titleEl.style.cssText =
        'margin:0 0 8px 0;font-size:24px;font-weight:700;color:#fff;letter-spacing:-0.02em;';
      titleEl.textContent = t.searchUnlockPageBlockedTitle;

      const descEl = document.createElement('p');
      descEl.style.cssText =
        'margin:0 0 24px 0;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.5;';
      descEl.textContent = t.searchUnlockPageBlockedDesc;

      const unlockActionBtn = document.createElement('button');
      unlockActionBtn.type = 'button';
      unlockActionBtn.style.cssText =
        `width:100%;padding:12px 18px;border-radius:8px;background:${TT_RED};color:#fff;` +
        `font-family:${TT_FONT};font-weight:700;font-size:15px;border:none;cursor:pointer;transition:filter .15s;`;
      unlockActionBtn.textContent = t.searchUnlockBtn;
      unlockActionBtn.onmouseover = () => {
        unlockActionBtn.style.filter = 'brightness(1.1)';
      };
      unlockActionBtn.onmouseout = () => {
        unlockActionBtn.style.filter = 'none';
      };
      unlockActionBtn.onclick = () => openSearchUnlockModal(settings.language);

      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.style.cssText =
        'width:100%;padding:11px 16px;margin-top:8px;border-radius:8px;background:none;border:none;' +
        `color:rgba(255,255,255,0.5);font-family:${TT_FONT};font-weight:600;font-size:14px;cursor:pointer;transition:color .15s;`;
      backBtn.textContent = t.searchUnlockBackBtn;
      backBtn.onmouseover = () => {
        backBtn.style.color = '#fff';
      };
      backBtn.onmouseout = () => {
        backBtn.style.color = 'rgba(255,255,255,0.5)';
      };
      backBtn.onclick = () => {
        window.location.href = '/following';
      };

      card.appendChild(badge);
      card.appendChild(titleEl);
      card.appendChild(descEl);
      card.appendChild(unlockActionBtn);
      card.appendChild(backBtn);

      overlay.appendChild(card);
      document.body.appendChild(overlay);
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

      document.addEventListener('visibilitychange', () => {
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

    // --- Lewe menu: sekcja "Following accounts" zwinieta za przyciskiem "View all" ---
    const FOLLOWING_BLOCK_ATTR = 'data-unhook-following-block';
    const FOLLOWING_KEEP_ATTR = 'data-unhook-following-keep';
    const FOLLOWING_EXPANDED_ATTR = 'data-unhook-following-expanded';
    const FOLLOWING_TOGGLE_ID = 'unhook-following-toggle';

    const FOLLOWING_SECTION_LABELS = [
      'following accounts',
      'accounts you follow',
      'obserwowane konta',
      'konta obserwowane',
      'konta, ktore obserwujesz',
      'konta ktore obserwujesz',
      'twoi obserwowani',
    ];

    /** Pozycje menu, ktorych sekcja Following NIGDY nie moze objac. */
    const MAIN_NAV_MARKERS =
      '[data-e2e="nav-foryou"], [data-e2e="nav-following"], [data-e2e="nav-profile"], [data-e2e="nav-upload"]';

    let followingExpanded = false;

    const findSidebar = (): Element | null =>
      document.querySelector('[class*="DivSideNavContainer"]') ||
      document.querySelector('[data-e2e="nav-following"]')?.closest('nav') ||
      document.querySelector('aside') ||
      null;

    const normalizeLabel = (text: string): string =>
      text
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\u0142/g, 'l')
        .replace(/\s+/g, ' ');

    /** Pierwszy element-liscie w `root`, ktorego CALY tekst rowna sie jednej z etykiet. */
    const findLeafByExactText = (root: Element, labels: string[]): HTMLElement | null => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (el) =>
          (el as Element).children.length === 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP,
      });
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const el = node as HTMLElement;
        if (labels.includes(normalizeLabel(el.textContent || ''))) return el;
      }
      return null;
    };

    /**
     * Kontener trzymajacy naglowek sekcji + wiersze z kontami.
     * Nigdy nie zwraca samego sidebara ani bloku glownej nawigacji - to wlasnie
     * ten brak zabezpieczenia powodowal, ze panel wchodzil w srodek menu
     * i dublowal liste obserwowanych.
     */
    const resolveFollowingBlock = (heading: HTMLElement, sidebar: Element): HTMLElement | null => {
      let node: HTMLElement | null = heading.parentElement;
      for (let i = 0; i < 5 && node && node !== sidebar; i++) {
        const hasAccounts =
          node.querySelector('[data-e2e="following-user-button"]') || node.querySelector('a[href^="/@"]');
        if (!node.querySelector(MAIN_NAV_MARKERS) && hasAccounts) {
          return node;
        }
        node = node.parentElement;
      }

      const fallback = heading.parentElement;
      if (!fallback || fallback === sidebar) return null;
      if (fallback.querySelector(MAIN_NAV_MARKERS)) return null;
      return fallback;
    };

    const setFollowingExpanded = (expanded: boolean) => {
      followingExpanded = expanded;
      const block = document.querySelector<HTMLElement>(`[${FOLLOWING_BLOCK_ATTR}="1"]`);
      if (block) block.setAttribute(FOLLOWING_EXPANDED_ATTR, expanded ? '1' : '0');
      syncFollowingToggle();
    };

    const syncFollowingToggle = () => {
      const toggle = document.getElementById(FOLLOWING_TOGGLE_ID);
      if (!toggle) return;
      const lang = currentSettings?.language || 'en';
      const t = getT(lang);
      const label = toggle.querySelector<HTMLElement>('[data-unhook-toggle-label]');
      const chevron = toggle.querySelector<HTMLElement>('[data-unhook-toggle-chevron]');
      if (label) label.textContent = followingExpanded ? t.followingHide : t.followingViewAll;
      if (chevron) chevron.style.transform = followingExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
      toggle.setAttribute('aria-expanded', followingExpanded ? 'true' : 'false');
    };

    const buildFollowingToggle = (): HTMLElement => {
      const t = getT(currentSettings?.language || 'en');

      const btn = document.createElement('button');
      btn.id = FOLLOWING_TOGGLE_ID;
      btn.type = 'button';
      btn.setAttribute(FOLLOWING_KEEP_ATTR, '1');
      btn.setAttribute('aria-expanded', 'false');
      btn.style.cssText = [
        'display:flex',
        'align-items:center',
        'justify-content:space-between',
        'gap:8px',
        'width:100%',
        'box-sizing:border-box',
        'margin:2px 0',
        'padding:7px 10px',
        'border:none',
        'border-radius:8px',
        'background:transparent',
        'color:inherit',
        'font:inherit',
        'font-size:13px',
        'font-weight:600',
        'line-height:1.2',
        'text-align:left',
        'opacity:0.62',
        'cursor:pointer',
        'transition:opacity .15s ease, background-color .15s ease',
      ].join(';');

      const label = document.createElement('span');
      label.setAttribute('data-unhook-toggle-label', '1');
      label.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      label.textContent = t.followingViewAll;

      const chevron = document.createElement('span');
      chevron.setAttribute('data-unhook-toggle-chevron', '1');
      chevron.textContent = '⌄';
      chevron.style.cssText =
        'flex-shrink:0;font-size:14px;line-height:1;transform-origin:center;transition:transform .18s ease;';

      btn.appendChild(label);
      btn.appendChild(chevron);

      btn.addEventListener('mouseenter', () => {
        btn.style.opacity = '1';
        btn.style.backgroundColor = 'rgba(127,127,127,0.14)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.opacity = followingExpanded ? '1' : '0.62';
        btn.style.backgroundColor = 'transparent';
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setFollowingExpanded(!followingExpanded);
      });

      return btn;
    };

    /**
     * @param resetState false przy przebudowie po przerysowaniu menu przez TikToka -
     *        inaczej rozwinieta lista zwijalaby sie sama pod uzytkownikiem.
     */
    const clearFollowingSectionCollapse = (resetState = true) => {
      document.getElementById(FOLLOWING_TOGGLE_ID)?.remove();
      document.querySelectorAll<HTMLElement>(`[${FOLLOWING_BLOCK_ATTR}="1"]`).forEach((block) => {
        block.removeAttribute(FOLLOWING_BLOCK_ATTR);
        block.removeAttribute(FOLLOWING_EXPANDED_ATTR);
      });
      if (resetState) followingExpanded = false;
    };

    const applyFollowingSectionCollapse = (settings: TikTokUnhookSettings) => {
      if (!settings.masterEnabled || !settings.hideFollowingSidebarList) {
        clearFollowingSectionCollapse();
        return;
      }

      const existing = document.querySelector<HTMLElement>(`[${FOLLOWING_BLOCK_ATTR}="1"]`);
      const toggle = document.getElementById(FOLLOWING_TOGGLE_ID);
      if (existing?.isConnected && toggle?.isConnected && toggle.parentElement === existing) {
        syncFollowingToggle();
        return;
      }

      // TikTok przerysowal menu - odbuduj znaczniki, ale zachowaj stan rozwiniecia.
      clearFollowingSectionCollapse(false);

      const sidebar = findSidebar();
      if (!sidebar) return;

      // TikTok daje sekcji stabilny znacznik; tekst zostaje jako zapasowy
      // wariant dla starszych ukladow i innych jezykow.
      const heading =
        sidebar.querySelector<HTMLElement>('[data-e2e="following-accounts"]') ||
        findLeafByExactText(sidebar, FOLLOWING_SECTION_LABELS);
      if (!heading) return;

      const block = resolveFollowingBlock(heading, sidebar);
      if (!block) return;

      block.setAttribute(FOLLOWING_BLOCK_ATTR, '1');
      block.setAttribute(FOLLOWING_EXPANDED_ATTR, followingExpanded ? '1' : '0');
      block.insertBefore(buildFollowingToggle(), block.firstChild);
      syncFollowingToggle();
    };

    // --- Ukrywanie "Get Coins" / "Get App" po tresci przycisku ---
    // TikTok nie daje dla nich stabilnego data-e2e, wiec dopinamy marker,
    // a samo ukrycie robi CSS z generateStyles().
    const PROMO_LABELS = [
      'get coins',
      'get coin',
      'coins',
      'get app',
      'get the app',
      'download app',
      'zdobadz monety',
      'kup monety',
      'monety',
      'pobierz aplikacje',
      'pobierz apke',
      'doladuj monety',
      'zdobadz aplikacje',
      'zdobadz apke',
      'zdobadz monety',
    ];

    const PROMO_CLICKABLE = 'a, button, [role="button"], [role="menuitem"]';

    /** Miejsca, ktorych skan promocji nie moze dotknac (opisy filmow, komentarze). */
    const PROMO_SAFE_ZONES =
      '[data-e2e="feed-video"], [data-e2e="recommend-list-item-container"], ' +
      '[data-e2e="video-desc"], [data-e2e="comment-list"], [data-e2e="browse-video-desc"]';

    const markPromoElements = (settings: TikTokUnhookSettings) => {
      if (!document.body) return;

      if (!settings.masterEnabled || (!settings.hideGetCoinsApp && !settings.hideHeaderPromos)) {
        // Bez tego wylaczenie opcji zostawialo elementy ukryte az do przeladowania.
        document
          .querySelectorAll('[data-unhook-promo]')
          .forEach((el) => el.removeAttribute('data-unhook-promo'));
        return;
      }

      document.querySelectorAll<HTMLElement>(PROMO_CLICKABLE).forEach((el) => {
        if (el.hasAttribute('data-unhook-promo')) return;

        const label = normalizeLabel(el.textContent || '');
        if (!label || label.length > 24) return;
        if (!PROMO_LABELS.includes(label)) return;
        if (el.closest(PROMO_SAFE_ZONES)) return;

        el.setAttribute('data-unhook-promo', '1');
        console.log('[TikTok Unhook] Hidden promo item:', label);
      });
    };

    // 10. Ukrywanie opakowan pozycji menu (dziury po usunietych elementach).
    //
    //     Poprzednie wersje robily to w CSS przez `div:has(> ...)`. Przy obecnym
    //     ukladzie TikToka regula dla "Dla Ciebie" trafiala w
    //     DivSideNavPlaceholderContainer - czyli w CALY lewy pasek - i wlaczenie
    //     jednej opcji kasowalo z ekranu cale menu. CSS nie potrafi sprawdzic,
    //     czy kontener zawiera cos jeszcze, wiec robimy to tutaj.

    /** Elementow tego typu nigdy nie traktujemy jako "opakowanie". */
    const WRAPPER_STOP_TAGS = new Set([
      'BODY',
      'HTML',
      'MAIN',
      'NAV',
      'ASIDE',
      'HEADER',
      'FOOTER',
      'UL',
      'OL',
      'FORM',
    ]);

    const MAX_WRAPPER_DEPTH = 4;

    const hasOwnText = (el: Element): boolean =>
      Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim() !== ''
      );

    /**
     * Najdalszy przodek, ktory zawiera WYLACZNIE `el`: na kazdym poziomie
     * dokladnie jedno dziecko i zaden wlasny tekst. Taki kontener mozna ukryc
     * bezpiecznie, bo nie ma w nim nic poza ukrywana pozycja. Zatrzymujemy sie
     * takze na elementach z id (#app, #top-right-action-bar, #main-content-*).
     */
    const soleWrapperOf = (el: Element): Element => {
      let node: Element = el;
      for (let i = 0; i < MAX_WRAPPER_DEPTH; i++) {
        const parent = node.parentElement;
        if (!parent) break;
        if (WRAPPER_STOP_TAGS.has(parent.tagName)) break;
        if (parent.id) break;
        if (parent.children.length !== 1) break;
        if (hasOwnText(parent)) break;
        node = parent;
      }
      return node;
    };

    /**
     * Oznacza opakowania aktualnie ukrytych pozycji i - co wazne - zdejmuje
     * znaczniki z pozycji, ktore juz nie sa ukryte. Dzieki temu wylaczenie
     * suwaka od razu przywraca element, bez przeladowania strony.
     */
    const markHiddenWrappers = (settings: TikTokUnhookSettings) => {
      if (!document.body) return;

      const wanted = new Set<Element>();

      if (settings.masterEnabled) {
        for (const rule of WRAPPED_HIDE_RULES) {
          if (!rule.isEnabled(settings)) continue;
          let matches: NodeListOf<Element>;
          try {
            matches = document.querySelectorAll(rule.selector);
          } catch {
            continue;
          }
          matches.forEach((el) => wanted.add(soleWrapperOf(el)));
        }
      }

      document.querySelectorAll(`[${WRAPPER_HIDE_ATTR}]`).forEach((el) => {
        if (!wanted.has(el)) el.removeAttribute(WRAPPER_HIDE_ATTR);
      });

      wanted.forEach((el) => {
        if (el.getAttribute(WRAPPER_HIDE_ATTR) !== '1') {
          el.setAttribute(WRAPPER_HIDE_ATTR, '1');
        }
      });
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
        applyFollowingSectionCollapse(s);
        markPromoElements(s);
        // Po markPromoElements - "Zdobadz aplikacje" rozpoznajemy dopiero po tresci.
        markHiddenWrappers(s);
        handleSearchInterception(s);
        handleSearchPageGuard(s);
      }, 600);
    };

    // 2. Wstrzykniecie CSS do DOM
    const applyCSS = (settings: TikTokUnhookSettings) => {
      currentSettings = settings;
      writeKeepPlayingCache(settings.masterEnabled && settings.keepPlayingInBackground);

      let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        (document.head || document.documentElement).appendChild(styleEl);
      }

      styleEl.textContent = generateStyles(settings);

      if (settings.masterEnabled) {
        document.documentElement.classList.add('unhook-active');
        const awaitingRedirect =
          settings.redirectToProfile && HOME_PATHS.includes(window.location.pathname);
        document.documentElement.classList.toggle('unhook-home-feed', awaitingRedirect);
      } else {
        document.documentElement.classList.remove('unhook-active', 'unhook-home-feed');
      }

      applyFollowingSectionCollapse(settings);
      markPromoElements(settings);
      markHiddenWrappers(settings);
      handleAutoRedirect(settings);
      handleSearchInterception(settings);
      handleSearchPageGuard(settings);
      scheduleTextScan();
    };

    // 3. Poczatkowe ustawienia
    getSettings().then((settings) => {
      applyCSS(settings);
      void maybeShowSessionSummary(settings.language);
      void startStatsTracking();
      // Wyczysc cache obserwowanych z poprzednich wersji (funkcja juz nie istnieje).
      void clearLegacyStorage();
    });

    onSettingsChange((newSettings) => {
      applyCSS(newSettings);
    });

    // 4. Detekcja zmiany trasy SPA (polling - izolowany swiat nie widzi pushState strony)
    const onLocationChange = () => {
      consecutiveSkips = 0;
      if (currentSettings) {
        applyCSS(currentSettings);
        handleSearchPageGuard(currentSettings);
        handleSearchInterception(currentSettings);
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
