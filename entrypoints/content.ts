import { defineContentScript } from 'wxt/sandbox';
import {
  getSettings,
  onSettingsChange,
  addToDailyStats,
  onDailyStatsChange,
  getGuardState,
  updateGuardState,
  onGuardChange,
  getLastSession,
  saveLastSession,
  todayKey,
  GuardState,
  TikTokUnhookSettings,
} from '@/utils/storage';
import {
  generateStyles,
  WRAPPED_HIDE_RULES,
  WRAPPER_HIDE_ATTR,
  AD_BLOCK_ATTR,
  RECOMMEND_TAB_ATTR,
  TEXT_HIDE_ATTRS,
} from '@/utils/selectors';
import { getT, TranslationStrings } from '@/utils/i18n';
import { BRAND } from '@/utils/brand';
import { KEEP_PLAYING_CACHE_KEY } from '@/utils/keep-playing';
import { PASS_MS, BlockVerdict, evaluateBlock, formatClock, passCodeLength } from '@/utils/guard';
import {
  OWN_UI_ATTR,
  UI,
  BlockScreen,
  closeCodeChallenge,
  mountBlockScreen,
  openCodeChallenge,
  removePageToast,
  renderPill,
  showPageToast,
} from '@/utils/page-ui';

export default defineContentScript({
  matches: ['*://*.tiktok.com/*'],
  runAt: 'document_start',
  main() {
    const LOG = BRAND.logPrefix;
    console.log(LOG, 'Content script initialized.');

    // "Graj dalej w tle" dziala w swiecie strony (keep-playing.content.ts), ktory
    // nie ma dostepu do storage rozszerzenia. Ustawienie przekazujemy mu przez
    // localStorage strony, zapisywany przy kazdej zmianie ustawien.
    const writeKeepPlayingCache = (enabled: boolean) => {
      try {
        localStorage.setItem(KEEP_PLAYING_CACHE_KEY, enabled ? '1' : '0');
      } catch {
        /* noop */
      }
    };

    const STYLE_ID = 'unhook-injected-css';
    const REDIRECT_GUARD_KEY = 'unhook_redirect_guard_v1';
    const SUMMARY_SEEN_KEY = 'unhook_summary_seen_v1';
    const HIDDEN_MARK = 'data-unhook-hidden';
    const VIRAL_CHECKED_MARK = 'data-unhook-viral-checked';
    const SESSION_BANNER_ID = 'unhook-session-banner';

    let currentSettings: TikTokUnhookSettings | null = null;

    const whenBodyReady = (): Promise<void> =>
      new Promise((resolve) => {
        if (document.body) return resolve();
        window.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
      });

    // --- Ochrona przed petla redirectow (przezywa pelne reloady przez sessionStorage) ---
    type RedirectGuard = { count: number; ts: number };

    const readGuard = (): RedirectGuard => {
      const now = Date.now();
      try {
        const raw = sessionStorage.getItem(REDIRECT_GUARD_KEY);
        const state: RedirectGuard = raw ? JSON.parse(raw) : { count: 0, ts: now };
        if (!state || typeof state.count !== 'number') return { count: 0, ts: now };
        if (now - state.ts > 30000) return { count: 0, ts: now };
        return state;
      } catch {
        return { count: 0, ts: now };
      }
    };

    /**
     * Sprawdza budzet przekierowan. NIE liczy samo - wazne, bo applyCSS odpala
     * handleAutoRedirect przy kazdej zmianie ustawien i kazdej zmianie trasy,
     * wiec liczenie w miejscu pytania wyczerpywalo budzet bez przekierowania.
     */
    const canRedirect = (): boolean => readGuard().count < 3;

    /** Rejestruje faktycznie wykonane przekierowanie. Wolane RAZ, tuz przed nim. */
    const consumeRedirect = () => {
      try {
        const state = readGuard();
        state.count += 1;
        state.ts = Date.now();
        sessionStorage.setItem(REDIRECT_GUARD_KEY, JSON.stringify(state));
      } catch {
        /* noop */
      }
    };

    const clearRedirectGuard = () => {
      try {
        sessionStorage.removeItem(REDIRECT_GUARD_KEY);
      } catch {
        /* noop */
      }
    };

    /**
     * `unhook-home-feed` wygasza feed na czas skoku na profil. Jesli przekierowanie
     * nie wyszlo (limit petli, wylogowany uzytkownik, brak linku po 20s), klasa
     * musi zejsc - inaczej strona glowna zostaje czarna do przeladowania.
     */
    const showFeedIfStuck = () => {
      document.documentElement.classList.remove('unhook-home-feed');
    };

    const redirectToFollowing = () => {
      console.log(LOG, 'Redirecting to /following...');
      window.location.replace('/following');
    };

    // Ścieżki, z których wtyczka przekierowuje na profil / Obserwowanych.
    const HOME_PATHS = ['/', '/foryou'];

    // Profil wyglada jak "/@username". Pusty placeholder "/@" oznacza brak zalogowania.
    const getProfileHref = (): string | null => {
      const link = document.querySelector('[data-e2e="nav-profile"]');
      const href = link?.getAttribute('href') || null;
      return href && href.startsWith('/@') && href.length > 2 ? href : null;
    };

    // Budzet przekierowan jest sprawdzany przez wywolujacego (handleAutoRedirect),
    // wiec ta funkcja go juz NIE konsumuje po raz drugi.
    let profilePollId: number | null = null;

    const redirectToProfile = () => {
      const href = getProfileHref();
      if (href) {
        console.log(LOG, `Redirecting to profile ${href}...`);
        window.location.replace(href);
        return;
      }

      // applyCSS jest wolane wielokrotnie (obserwator, zmiana ustawien), wiec
      // bez tego zabezpieczenia startowalo kilka odpytywaczy profilu naraz.
      if (profilePollId !== null) return;

      let attempts = 0;
      const MAX_ATTEMPTS = 40; // ~20s co 500ms

      const stopPolling = () => {
        if (profilePollId === null) return;
        window.clearInterval(profilePollId);
        profilePollId = null;
      };

      profilePollId = window.setInterval(() => {
        // Musi byc "wyszedlismy ze strony glownej", a nie "to nie jest /".
        // Przy samym `pathname !== '/'` odpytywacz natychmiast gasl sie na
        // /foryou (ktore tez jest w HOME_PATHS) i zostawial wygaszony feed.
        if (!HOME_PATHS.includes(window.location.pathname)) {
          stopPolling();
          return;
        }

        attempts++;
        const foundHref = getProfileHref();
        if (foundHref) {
          stopPolling();
          console.log(LOG, `Redirecting to profile ${foundHref}...`);
          window.location.replace(foundHref);
          return;
        }

        if (attempts >= MAX_ATTEMPTS) {
          stopPolling();
          showFeedIfStuck();
          console.warn(
            LOG, 'Profile link (data-e2e="nav-profile") not found after 20s. Staying on current page.'
          );
        }
      }, 500);
    };

    // 1. Auto-redirect z "For You" i "Explore"
    const handleAutoRedirect = (settings: TikTokUnhookSettings) => {
      if (!settings.masterEnabled) return;

      const path = window.location.pathname;
      const isHome = HOME_PATHS.includes(path);
      const isExplore = path === '/explore' || path.startsWith('/explore/');
      // Strony zbiorcze LIVE i sklepu. Pojedyncza transmisja obserwowanej osoby
      // ma adres /@nazwa/live i zostaje dostepna.
      const isLiveHub = path === '/live' || path.startsWith('/live/');
      const isShopHub = path === '/shop' || path.startsWith('/shop/');

      if (!isHome && !isExplore && !isLiveHub && !isShopHub) {
        clearRedirectGuard();
        return;
      }

      if ((isLiveHub && settings.hideLiveSidebar) || (isShopHub && settings.hideShop)) {
        if (!canRedirect()) {
          console.warn(LOG, 'Redirect loop detected - aborting redirect.');
          return;
        }
        consumeRedirect();
        redirectToFollowing();
        return;
      }

      if (isHome && settings.redirectToProfile) {
        if (!canRedirect()) {
          console.warn(LOG, 'Redirect loop detected - aborting redirect.');
          showFeedIfStuck();
          return;
        }
        consumeRedirect();
        redirectToProfile();
        return;
      }

      if (isExplore && settings.hideExploreFeed) {
        if (!canRedirect()) {
          console.warn(LOG, 'Redirect loop detected - aborting redirect.');
          showFeedIfStuck();
          return;
        }
        consumeRedirect();
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
            // Tylko znakacznik - samo ukrycie robi CSS, inaczej wylaczenie
            // "Ukryj sklep i reklamy" zostawiloby karty czarne do reloadu.
            node.setAttribute(AD_BLOCK_ATTR, '1');
            node.setAttribute(HIDDEN_MARK, '1');
            console.log(LOG, 'Hidden ad block.');
          }
          return;
        }
        node = node.parentElement;
      }
    };

    /**
     * Czy zakladka wyglada na wybrana? TikTok oznacza aktywny zakladek przez
     * `aria-selected` (i klase CSS-modulow z "active"). Sprawdzamy wszystkie
     * trzy, bo wersje ukladu sie roznia.
     */
    const looksSelected = (el: Element): boolean => {
      if (el.getAttribute('aria-selected') === 'true') return true;
      if (el.getAttribute('aria-current') === 'true') return true;
      if (el.getAttribute('data-selected') === 'true') return true;
      const cls = (el.getAttribute('class') || '').toLowerCase();
      return cls.includes('active') || cls.includes('selected');
    };

    const findCommentsTab = (tabButton: Element): HTMLElement | null => {
      const siblings = tabButton.parentElement ? Array.from(tabButton.parentElement.children) : [];
      const found = siblings.find(
        (el) => el !== tabButton && COMMENTS_TAB_LABELS.includes((el.textContent || '').trim())
      );
      return found instanceof HTMLElement ? found : null;
    };

    /**
     * Po ukryciu zakladki "You may like" nie wolno zostawic jej w stanie
     * "wybrana, ale niewidoczna". TikTok wraca do niej sam - np. przy
     * kazdej zmianie filmu, bez przebudowy paska zakladek - i wtedy
     * uzytkownik czyta polecane komentarze, nie widzi zadnego zakladka
     * i nie ma jak wrocic do prawdziwych. Dlatego wyboru "Komentarze"
     * nie robimy raz: przypominamy go, ile razy ukryta zakladka wyglada
     * na aktywna.
     *
     * Throttle chroni przed klikaniem w petli, a backoff przed sytuacja,
     * w ktorej klik nie dziala (zly wykrywacz stanu) - wtedy kolejne
     * probby odsuwaja sie maksymalnie do minuty.
     */
    const COMMENTS_SELECT_MIN_MS = 1500;
    const COMMENTS_SELECT_MAX_MS = 60000;
    let commentsSelectAt = 0;
    let commentsSelectWait = COMMENTS_SELECT_MIN_MS;

    const hideRecommendTab = (labelEl: Element) => {
      let tabButton: Element | null = labelEl;
      for (let i = 0; i < 3 && tabButton; i++) {
        if (tabButton.tagName === 'BUTTON' || tabButton.getAttribute('role') === 'tab') break;
        tabButton = tabButton.parentElement;
      }
      if (!tabButton) return;

      const commentsTab = findCommentsTab(tabButton);
      const alreadyHidden = tabButton.hasAttribute(RECOMMEND_TAB_ATTR);
      const isSelected = looksSelected(tabButton);

      // Nie chowamy zakladki, gdy nie mamy gdzie przeniesc uzytkownika.
      // Lepiej zostawic "You may like" na ekranie niz uwiezic go w sekcji,
      // ktorej nie da sie wybrac.
      if (commentsTab && (!alreadyHidden || isSelected)) {
        if (!alreadyHidden) console.log(LOG, 'Hidden "You may like" tab.');
        tabButton.setAttribute(RECOMMEND_TAB_ATTR, '1');
        tabButton.setAttribute(HIDDEN_MARK, '1');
      }

      if (!commentsTab) return;

      const now = Date.now();
      // Przy pierwszym wykryciu klikamy od razu (tak bylo wczesniej).
      // Później tylko wtedy, gdy ukryta zakladka jest aktywna.
      const due = !alreadyHidden || isSelected;
      if (!due || now - commentsSelectAt < commentsSelectWait) return;

      commentsSelectAt = now;
      commentsTab.click();

      // Klik nie pomogl -> odsuwamy kolejne proby. Pomogl -> wracamy do min.
      commentsSelectWait =
        isSelected
          ? Math.min(COMMENTS_SELECT_MAX_MS, commentsSelectWait * 3)
          : COMMENTS_SELECT_MIN_MS;
    };

    /**
     * Zdejmuje znaczniki ukrycia nadawane po tresci. Bez tego wylaczenie
     * "Ukryj sklep i reklamy" nie odslanialoby ich az do przeladowania strony.
     * HIDDEN_MARK czyscimy tylko na tych samych elementach, bo jest wspoldzielony
     * wylacznie z tym skanem.
     */
    const clearTextHiddenMarks = () => {
      document.querySelectorAll(TEXT_HIDE_ATTRS).forEach((el) => {
        el.removeAttribute(AD_BLOCK_ATTR);
        el.removeAttribute(RECOMMEND_TAB_ATTR);
        el.removeAttribute(HIDDEN_MARK);
      });
    };

    const MAX_SCAN_NODES = 4000;

    const scanForTextDistractions = (settings: TikTokUnhookSettings) => {
      if (!settings.masterEnabled || !settings.hideAds) {
        // Wylaczona opcja musi natychmiast odslanic to, co ostatnio ukrylo sie
        // po tresci - inaczej efekt zostalby do momentu przeladowania strony.
        if (document.querySelector(TEXT_HIDE_ATTRS)) clearTextHiddenMarks();
        return;
      }
      if (!document.body || document.hidden) return;

      // Chodzimy po wezlach TEKSTOWYCH, a nie po elementach. Przy ~15k
      // elementow (tylek ma tyle) wersja SHOW_ELEMENT + FILTER_SKIP odwiedzila
      // kazdy wezel i sklejala textContent - 3.4 ms na przebieg. SHOW_TEXT
      // daje ten sam wynik za ~1.0 ms: interesuja nas tylko liscie, czyli
      // wezly tekstowe bez dzieci-elementow.
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

      let node: Node | null;
      let visited = 0;
      while ((node = walker.nextNode()) && visited < MAX_SCAN_NODES) {
        visited++;
        const el = (node as Text).parentElement;
        if (!el || el.children.length !== 0) continue;
        if (el.hasAttribute(HIDDEN_MARK)) continue;
        const text = (node.nodeValue || '').trim();
        if (!text || text.length > 20) continue;

        if (AD_LABELS.includes(text)) {
          hideAdCardNear(el);
        } else if (RECOMMEND_TAB_LABELS.includes(text)) {
          hideRecommendTab(el);
        }
      }
    };

    // 1c. Filtr "Viral Only" dla /following

    /** Mnozniki skrotow, ktore TikTok uzywa w roznych jezykach interfejsu. */
    const COUNT_SUFFIXES: Record<string, number> = {
      k: 1_000, // 1.2K
      tys: 1_000, // 1,2 tys.  (PL)
      ty: 1_000,
      m: 1_000_000,
      mln: 1_000_000, // 1,2 mln  (PL)
      mio: 1_000_000, // 1,2 Mio. (DE)
      mil: 1_000_000,
      b: 1_000_000_000,
      bn: 1_000_000_000,
      mld: 1_000_000_000, // 1,2 mld  (PL)
      mrd: 1_000_000_000, // 1,2 Mrd. (DE)
    };

    /**
     * Liczniki TikToka sa zalezne od jezyka: "1.2K" (EN), "1,2 tys." (PL),
     * "1 234" (separator tysiecy). Poprzednia wersja rozumiała wylacznie
     * K/M/B, wiec dla polskiego konta filtr wiralowy nigdy nie zadzialal -
     * parse zwracalo null i karta byla pomijana.
     */
    const parseFormattedCount = (raw: string): number | null => {
      const text = (raw || '')
        .toLowerCase()
        .replace(/[\s\u00a0\u202f\u2009]+/g, '');
      if (!text) return null;

      const match = text.match(/^([\d.,]+)([a-z]{0,4})\.?$/);
      if (!match) return null;

      const digits = match[1];
      const suffix = match[2];

      if (!suffix) {
        // Pelna liczba - kropki i przecinki sa tu separatorami tysiecy.
        const plain = digits.replace(/[.,]/g, '');
        if (!plain) return null;
        const value = parseInt(plain, 10);
        return Number.isFinite(value) ? value : null;
      }

      const multiplier = COUNT_SUFFIXES[suffix];
      if (!multiplier) return null;

      // Przy skrocie separator dziesietny to ostatni z wystapionych znakow,
      // a poprzedzajace go sa separatorami tysiecy ("1.234,5 tys.").
      const lastSep = Math.max(digits.lastIndexOf('.'), digits.lastIndexOf(','));
      const normalized =
        lastSep === -1
          ? digits
          : `${digits.slice(0, lastSep).replace(/[.,]/g, '')}.${digits.slice(lastSep + 1).replace(/[.,]/g, '')}`;

      const value = parseFloat(normalized);
      if (!Number.isFinite(value)) return null;
      return Math.round(value * multiplier);
    };

    /**
     * Karta zajmujaca najwieksza czesc ekranu. Jedna przebieg skanu woła to
     * dwa razy (licznik filmow + filtr wiralny), a kazde wywolanie robi
     * getBoundingClientRect dla kazdej karty - czyli wymuszony layout na
     * ~380 elementach. Cache na 250 ms daje ten sam wynik za jedno liczenie.
     */
    const ACTIVE_CARD_TTL_MS = 250;
    let activeCardAt = 0;
    let activeCardValue: Element | null = null;

    const getActiveFeedCard = (): Element | null => {
      const now = Date.now();
      if (now - activeCardAt < ACTIVE_CARD_TTL_MS) return activeCardValue;
      activeCardAt = now;

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
      activeCardValue = bestVisible > window.innerHeight * 0.5 ? best : null;
      return activeCardValue;
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
      // Filtr dziala tylko w strumieniu filmow - bez tego
      // [data-e2e="recommend-list-item-container"] na stronie profilu
      // moglby zostac uznany za film i przeskakiwany.
      if (!document.querySelector('[data-e2e="feed-navigation-next"]')) return;
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
          console.log(LOG, `Skipping non-viral video (${likes} likes, ${comments} comments).`);
          nextBtn.click();
          if (consecutiveSkips >= STUCK_STREAK_THRESHOLD) {
            backoffUntil = now + STUCK_BACKOFF_MS;
            consecutiveSkips = 0;
            console.log(LOG, 'Many non-viral videos in a row - pausing skip briefly.');
          }
        }
      } else {
        consecutiveSkips = 0;
      }
    };

    const SEARCH_INPUT_ATTR = 'data-unhook-search-intercepted';
    const SEARCH_UNLOCKED_UNTIL_KEY = 'unhook_search_unlocked_until_v1';
    const SEARCH_UNLOCK_MODAL_ID = 'unhook-search-unlock-modal';
    const SEARCH_LOCK_OVERLAY_ID = 'unhook-search-lock-overlay';
    const SEARCH_PILL_ID = 'unhook-search-pill';
    const SEARCH_TOAST_ID = 'unhook-unlock-toast';
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

    let searchPillTimer: number | null = null;

    const showSessionToast = (msg: string) => showPageToast(SEARCH_TOAST_ID, msg);

    const codeStrings = (t: TranslationStrings) => ({
      codeLabel: t.codeLabel,
      codeNew: t.codeNew,
      placeholder: t.codeInputPlaceholder,
      pasteBlocked: t.codePasteBlocked,
      mismatch: t.codeMismatch,
      count: t.codeCharsCount,
      close: t.codeCloseLabel,
    });

    const stopSearchPill = () => {
      document.getElementById(SEARCH_PILL_ID)?.remove();
      if (searchPillTimer) {
        window.clearInterval(searchPillTimer);
        searchPillTimer = null;
      }
    };

    const relockSearch = () => {
      clearUnlockedSession();
      stopSearchPill();
      if (currentSettings) {
        handleSearchInterception(currentSettings);
        handleSearchPageGuard(currentSettings);
      }
    };

    const updateSearchPill = () => {
      if (
        !currentSettings?.masterEnabled ||
        !currentSettings?.searchUnlockChallenge ||
        !isSearchUnlocked()
      ) {
        stopSearchPill();
        return;
      }

      const paintPill = () => {
        const remainingMs = getSearchRemainingMs();
        if (remainingMs <= 0) {
          relockSearch();
          return;
        }
        // Język czytamy przy każdym odświeżeniu: pigułka żyje 5 minut
        // i w tym czasie użytkownik może go przełączyć w popupie.
        const t = getT(currentSettings?.language || 'en');
        const totalSecs = Math.ceil(remainingMs / 1000);
        renderPill({
          id: SEARCH_PILL_ID,
          top: 70,
          text: t.searchUnlockStatusUnlocked(Math.floor(totalSecs / 60), totalSecs % 60),
          buttonLabel: t.searchUnlockLockNow,
          onButton: relockSearch,
        });
      };

      paintPill();
      if (!searchPillTimer) searchPillTimer = window.setInterval(paintPill, 1000);
    };

    const openSearchUnlockModal = (lang: 'en' | 'pl' = currentSettings?.language || 'en') => {
      const t = getT(lang);
      openCodeChallenge({
        id: SEARCH_UNLOCK_MODAL_ID,
        length: TARGET_CHARS_COUNT,
        title: t.searchUnlockModalTitle,
        subtitle: t.searchUnlockModalSubtitle(TARGET_CHARS_COUNT),
        confirmLabel: t.searchUnlockBtn,
        secondaryLabel: t.searchUnlockBackBtn,
        onSecondary: () => {
          if (window.location.pathname.startsWith('/search')) {
            window.location.href = '/following';
          }
        },
        strings: codeStrings(t),
        onSuccess: () => {
          setUnlockedSession();

          if (currentSettings) {
            handleSearchInterception(currentSettings);
            handleSearchPageGuard(currentSettings);
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
        },
      });
    };

    const handleSearchInterception = (settings: TikTokUnhookSettings) => {
      const lockActive = settings.masterEnabled && settings.searchUnlockChallenge;
      const searchLocked = lockActive && !isSearchUnlocked();

      if (!lockActive) {
        updateSearchPill();

        // Placeholder przywracamy tylko tam, gdzie go kiedys ustawilismy.
        // Bez tego skasowana blokada przepisywala dwa selektory na calym
        // dokumencie przy kazdym skanie, mimo ze nie ma czego przywracać.
        if (!document.querySelector(`[${SEARCH_INPUT_ATTR}]`)) return;

        const inputs = document.querySelectorAll<HTMLInputElement>(
          `input[data-e2e="search-user-input"], input[type="search"], form[action*="/search"] input`
        );
        inputs.forEach((input) => {
          const orig = input.getAttribute('data-unhook-orig-placeholder');
          if (orig !== null) input.placeholder = orig;
          // Znacznik zdejmujemy razem z przywroceniem placeholdera - inaczej
          // szybka sciezka wyzej nigdy nie zadzialalaby, a wtyczka pamietalaby
          // o polu, ktore juz nie blokuje.
          input.removeAttribute(SEARCH_INPUT_ATTR);
          input.removeAttribute('data-unhook-orig-placeholder');
        });
        return;
      }

      updateSearchPill();

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
          const lockedPlaceholder = t.searchUnlockPlaceholderLocked;
          if (input.placeholder !== lockedPlaceholder) input.placeholder = lockedPlaceholder;
        } else {
          const orig = input.getAttribute('data-unhook-orig-placeholder');
          if (orig !== null && input.placeholder !== orig) input.placeholder = orig;
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

    let searchLockScreen: BlockScreen | null = null;

    const handleSearchPageGuard = (settings: TikTokUnhookSettings) => {
      const shouldBlock =
        settings.masterEnabled &&
        settings.searchUnlockChallenge &&
        !isSearchUnlocked() &&
        window.location.pathname.startsWith('/search');

      if (!shouldBlock) {
        searchLockScreen?.remove();
        searchLockScreen = null;
        return;
      }

      // document.body nie istnieje jeszcze na document_start przy wejsciu
      // prosto na /search (skan ponowi probe przy pierwszej mutacji DOM).
      if (!document.body) return;

      if (searchLockScreen && document.getElementById(SEARCH_LOCK_OVERLAY_ID)) return;

      const t = getT(settings.language);
      searchLockScreen = mountBlockScreen({
        id: SEARCH_LOCK_OVERLAY_ID,
        glyph: 'lock',
        // Pasek nawigacji strony zostaje odsloniety, zeby dalo sie wyjsc z wynikow.
        top: 60,
        title: t.searchUnlockPageBlockedTitle,
        text: t.searchUnlockPageBlockedDesc,
        primary: {
          label: t.searchUnlockBtn,
          enabled: true,
          onClick: () => openSearchUnlockModal(currentSettings?.language),
        },
        secondary: {
          label: t.searchUnlockBackBtn,
          onClick: () => {
            window.location.href = '/following';
          },
        },
      });
    };

    // --- Zasłony: pauza na wejściu, limit dzienny, ciche godziny ---
    const GUARD_SCREEN_ID = 'unhook-guard-screen';
    const VEIL_ID = 'unhook-veil';
    const PASS_MODAL_ID = 'unhook-pass-modal';
    const PASS_PILL_ID = 'unhook-pass-pill';
    const PASS_TOAST_ID = 'unhook-pass-toast';
    const GATE_PASSED_KEY = 'unhook_gate_passed_v1';
    const GUARD_CACHE_KEY = 'unhook_guard_cache_v1';
    const PASS_MINUTES = Math.round(PASS_MS / 60000);

    let guardState: GuardState = { editUntil: 0, ritualCount: 0, passUntil: 0, passCount: 0 };
    let guardReady = false;
    let guardScreen: BlockScreen | null = null;
    let guardSignature = '';
    let gateTimer: number | null = null;
    let secondsToday = 0;

    // Pauza na wejściu pokazuje się raz na kartę. Bez dostępu do sessionStorage
    // nie da się tego zapamiętać, więc wtedy nie pokazujemy jej wcale: lepsze to
    // niż odliczanie przy każdym przeładowaniu.
    const gatePassed = (): boolean => {
      try {
        return sessionStorage.getItem(GATE_PASSED_KEY) === '1';
      } catch {
        return true;
      }
    };

    const markGatePassed = () => {
      try {
        sessionStorage.setItem(GATE_PASSED_KEY, '1');
      } catch {
        /* noop */
      }
    };

    // Ustawienia przychodzą asynchronicznie, a strona zaczyna grać od razu.
    // Poprzedni werdykt trzymamy więc w localStorage strony i na jego podstawie
    // zasłaniamy ekran już na document_start, zanim storage odpowie.
    let guardCacheWritten = '';
    const writeGuardCache = (gate: boolean, block: boolean) => {
      const value = JSON.stringify({ gate, block });
      if (value === guardCacheWritten) return;
      guardCacheWritten = value;
      try {
        localStorage.setItem(GUARD_CACHE_KEY, value);
      } catch {
        /* noop */
      }
    };

    const liftVeil = () => {
      document.getElementById(VEIL_ID)?.remove();
    };

    const raiseVeilIfExpected = () => {
      let cached: { gate?: unknown; block?: unknown } | null = null;
      try {
        cached = JSON.parse(localStorage.getItem(GUARD_CACHE_KEY) || 'null');
      } catch {
        return;
      }
      if (!cached) return;
      if (cached.block !== true && !(cached.gate === true && !gatePassed())) return;

      const veil = document.createElement('div');
      veil.id = VEIL_ID;
      veil.setAttribute(OWN_UI_ATTR, '1');
      veil.style.cssText = `position:fixed;inset:0;z-index:2147483645;background:${UI.ink};`;
      document.documentElement.appendChild(veil);
      // Gdyby storage nie odpowiedział, strona nie może zostać czarna.
      window.setTimeout(liftVeil, 3000);
    };
    raiseVeilIfExpected();

    const leaveSite = () => {
      window.location.replace('about:blank');
    };

    const clearGuardScreen = () => {
      if (gateTimer !== null) {
        window.clearInterval(gateTimer);
        gateTimer = null;
      }
      guardScreen?.remove();
      guardScreen = null;
      guardSignature = '';
      closeCodeChallenge(PASS_MODAL_ID);
    };

    const guardScreenIsUp = (signature: string): boolean =>
      guardScreen !== null &&
      guardSignature === signature &&
      document.getElementById(GUARD_SCREEN_ID) !== null;

    const endPass = () => {
      guardState = { ...guardState, passUntil: 0 };
      void updateGuardState({ passUntil: 0 });
      evaluateGuard();
    };

    const openPassChallenge = () => {
      const t = getT(currentSettings?.language || 'en');
      const length = passCodeLength(guardState.passCount);
      openCodeChallenge({
        id: PASS_MODAL_ID,
        length,
        title: t.passModalTitle(PASS_MINUTES),
        subtitle: t.passModalSubtitle(length),
        confirmLabel: t.passConfirmBtn,
        strings: codeStrings(t),
        onSuccess: () => {
          guardState = {
            ...guardState,
            passUntil: Date.now() + PASS_MS,
            passCount: guardState.passCount + 1,
          };
          void updateGuardState({ passUntil: guardState.passUntil, passCount: guardState.passCount });
          evaluateGuard();
          showPageToast(PASS_TOAST_ID, t.passGrantedToast(PASS_MINUTES));
        },
      });
    };

    const showBlockVerdict = (
      verdict: Exclude<BlockVerdict, { kind: 'none' }>,
      settings: TikTokUnhookSettings
    ) => {
      const signature =
        verdict.kind === 'quiet'
          ? `quiet:${verdict.endsAt}:${settings.language}`
          : `limit:${verdict.limitMinutes}:${settings.language}`;
      if (guardScreenIsUp(signature)) return;

      clearGuardScreen();
      guardSignature = signature;
      const t = getT(settings.language);
      guardScreen = mountBlockScreen({
        id: GUARD_SCREEN_ID,
        shield: true,
        glyph: verdict.kind === 'quiet' ? 'moon' : 'timer',
        title: verdict.kind === 'quiet' ? t.quietTitle : t.limitTitle,
        text:
          verdict.kind === 'quiet'
            ? t.quietDesc(formatClock(verdict.endsAt))
            : t.limitDesc(verdict.limitMinutes),
        // Wyjście jest głównym przyciskiem, przepustka tym mniej widocznym.
        primary: { label: t.blockLeave, enabled: true, onClick: leaveSite },
        secondary: { label: t.passBtn(PASS_MINUTES), onClick: openPassChallenge },
      });
    };

    const showGate = (settings: TikTokUnhookSettings) => {
      const signature = `gate:${settings.language}:${settings.entryGateSeconds}`;
      if (guardScreenIsUp(signature)) return;

      clearGuardScreen();
      guardSignature = signature;
      const t = getT(settings.language);

      let remainingMs = settings.entryGateSeconds * 1000;
      let lastAt = Date.now();
      const secondsLeft = () => Math.ceil(remainingMs / 1000);

      const screen = mountBlockScreen({
        id: GUARD_SCREEN_ID,
        shield: true,
        glyph: 'hourglass',
        bigNumber: String(secondsLeft()),
        title: t.gateTitle,
        text: t.gateSubtitle,
        primary: {
          label: t.gateCountdown(secondsLeft()),
          enabled: false,
          onClick: () => {
            markGatePassed();
            evaluateGuard();
          },
        },
        secondary: { label: t.blockLeave, onClick: leaveSite },
      });
      guardScreen = screen;

      gateTimer = window.setInterval(() => {
        const now = Date.now();
        // Odliczanie stoi, gdy karta jest w tle: pauzy nie da się "przeczekać"
        // w innej karcie.
        if (!document.hidden) remainingMs = Math.max(0, remainingMs - (now - lastAt));
        lastAt = now;

        if (remainingMs > 0) {
          screen.setBigNumber(String(secondsLeft()));
          screen.setPrimary(t.gateCountdown(secondsLeft()), false);
          return;
        }
        if (gateTimer !== null) {
          window.clearInterval(gateTimer);
          gateTimer = null;
        }
        screen.setBigNumber('0');
        screen.setPrimary(t.gateContinue, true);
      }, 250);
    };

    const paintPassPill = (settings: TikTokUnhookSettings) => {
      const leftMs = guardState.passUntil - Date.now();
      // Pigułka ma sens tylko wtedy, gdy przepustka faktycznie coś zdejmuje.
      const wouldBlock =
        evaluateBlock(settings, { now: new Date(), secondsToday, passUntil: 0 }).kind !== 'none';
      if (leftMs <= 0 || !wouldBlock) {
        document.getElementById(PASS_PILL_ID)?.remove();
        return;
      }
      const t = getT(settings.language);
      const totalSecs = Math.ceil(leftMs / 1000);
      renderPill({
        id: PASS_PILL_ID,
        top: 112,
        text: t.passPill(Math.floor(totalSecs / 60), totalSecs % 60),
        buttonLabel: t.passEndNow,
        onButton: endPass,
      });
    };

    /**
     * Decyduje, czy strona ma być zasłonięta, i doprowadza ekran do tego stanu.
     * Wołane po każdej zmianie ustawień, licznika czasu i przepustki oraz co
     * sekundę (początek cichych godzin i koniec przepustki nie dają zdarzenia).
     */
    const evaluateGuard = () => {
      const settings = currentSettings;
      if (!settings || !guardReady) return;

      const verdict = evaluateBlock(settings, {
        now: new Date(),
        secondsToday,
        passUntil: guardState.passUntil,
      });
      const gateOn = settings.masterEnabled && settings.entryGateEnabled;

      if (verdict.kind !== 'none') showBlockVerdict(verdict, settings);
      else if (gateOn && !gatePassed()) showGate(settings);
      else clearGuardScreen();

      paintPassPill(settings);
      writeGuardCache(gateOn, verdict.kind !== 'none');
      liftVeil();
    };

    // --- Statystyki sesji (czas + filmy) ---
    const SESSION_MIN_SECONDS = 30;
    let sessionSeconds = 0;
    let sessionVideos = 0;
    let unsavedVideos = 0;
    let statsStarted = false;
    const seenCards = new WeakSet<Element>();

    const countActiveVideo = () => {
      if (document.hidden || !document.body) return;
      if (!currentSettings?.masterEnabled) return;
      const card = getActiveFeedCard();
      if (!card || seenCards.has(card)) return;
      seenCards.add(card);
      sessionVideos++;
      unsavedVideos++;
    };

    const startStatsTracking = async () => {
      if (statsStarted) return;
      statsStarted = true;

      const [stats, guard] = await Promise.all([addToDailyStats(0, 0), getGuardState()]);
      secondsToday = stats.seconds;
      guardState = guard;
      guardReady = true;
      evaluateGuard();
      window.setInterval(evaluateGuard, 1000);

      onGuardChange((next) => {
        guardState = next;
        evaluateGuard();
      });
      // Czas naliczony w innych kartach liczy się do tego samego limitu.
      onDailyStatsChange((next) => {
        secondsToday = next && next.date === todayKey() ? next.seconds : 0;
        evaluateGuard();
      });

      // Liczymy REALNY uplyw czasu, a nie "15s na tick". Przegladarka throttluje
      // timery w tle, wiec stare podejscie zanizalo czas przy dluzszych sesjach.
      let lastTickAt = Date.now();
      let wasVisible = !document.hidden;

      const runTick = async () => {
        const now = Date.now();
        const elapsed = Math.min(60, Math.max(0, Math.round((now - lastTickAt) / 1000)));
        lastTickAt = now;

        // Odcinek liczy sie, gdy karta byla widoczna przez caly czas od
        // poprzedniego ticku, ochrona jest wlaczona i strona nie jest zaslonieta.
        const counts = wasVisible && !document.hidden && !!currentSettings?.masterEnabled && !guardScreen;
        wasVisible = !document.hidden;

        const seconds = counts ? elapsed : 0;
        const videos = unsavedVideos;
        unsavedVideos = 0;
        sessionSeconds += seconds;

        // Dopisujemy do tego, co jest w storage, zamiast nadpisywac wlasna kopia:
        // inaczej karta otwarta rano cofala licznik naliczony w innych kartach.
        // Wolane takze z zerami, bo zwraca licznik nowego dnia po polnocy.
        secondsToday = (await addToDailyStats(seconds, videos)).seconds;
        evaluateGuard();
      };

      // Jeden zapis naraz: tick z zegara i tick ze zmiany widocznosci moga
      // wypasc razem, a dwa rownolegle "odczytaj i dopisz" zgubilyby jeden z nich.
      let tickQueue: Promise<void> = Promise.resolve();
      const tick = (): Promise<void> => {
        tickQueue = tickQueue.then(runTick, runTick);
        return tickQueue;
      };

      window.setInterval(() => void tick(), 15000);

      // Nasluch na `window` w fazie przechwycenia: skrypt "graj dalej w tle"
      // zatrzymuje to zdarzenie na `document`, wiec nasluch tam by nie zadzialal.
      window.addEventListener('visibilitychange', () => void tick(), true);

      // bfcache: strona moze zostac przywrocona pozniej, a pagehide w oknie
      // zamknietym nie zdazy zapisac sesji. Bez tego baner podsumowania ginal.
      window.addEventListener('pagehide', () => {
        if (currentSettings?.masterEnabled && (sessionSeconds >= SESSION_MIN_SECONDS || sessionVideos > 0)) {
          const minutes = Math.max(sessionVideos > 0 ? 1 : 0, Math.round(sessionSeconds / 60));
          void saveLastSession({ endedAt: Date.now(), minutes, videos: sessionVideos });
        }
        void tick();
      });
    };

    const maybeShowSessionSummary = async (language: 'en' | 'pl') => {
      // Wylaczona wtyczka nie powinna wstrzykiwac nic w strone.
      if (currentSettings && !currentSettings.masterEnabled) return;

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
      banner.id = SESSION_BANNER_ID;
      banner.setAttribute(OWN_UI_ATTR, '1');
      banner.style.cssText =
        'position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
        'background:#161616;color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:999px;' +
        'padding:8px 14px;font-size:12.5px;font-family:inherit;display:flex;align-items:center;gap:10px;' +
        'box-shadow:0 8px 28px rgba(0,0,0,.35);max-width:90vw;white-space:nowrap;';

      const text = document.createElement('span');
      text.textContent = `${t.sessionSummaryPrefix} ${t.sessionVideosLabel(summary.videos)} • ${t.sessionMinutesLabel(summary.minutes)}`;

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', t.closeLabel);
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

      // Kazdy zapis do DOM-u musi byc warunkowy. Bez tego `textContent = ...`
      // podmienial wezel tekstowy, nawet gdy etykieta sie nie zmienila - czyli
      // generowalismy mutacje DOM przy kazdym skanie, a obserwator mutacji
      // budzil wlasnie ten skan. Petla feedback zjadajaca CPU na kazdej karcie.
      const labelText = followingExpanded ? t.followingHide : t.followingViewAll;
      if (label && label.textContent !== labelText) label.textContent = labelText;

      const chevronTransform = followingExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
      if (chevron && chevron.style.transform !== chevronTransform) {
        chevron.style.transform = chevronTransform;
      }

      const expanded = followingExpanded ? 'true' : 'false';
      if (toggle.getAttribute('aria-expanded') !== expanded) {
        toggle.setAttribute('aria-expanded', expanded);
      }
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

      if (!document.body) return;

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
    //
    // WAZNE: tu sa WYLACZNIE wezwania do dzialania ("get coins", "kup monety").
    // Swiadomie nie ma tu gołych rzeczownikow "coins" / "monety" - one trafialy
    // w kazdy element, ktorego caly tekst brzmial tak samo, czyli niszczyly
    // wskaznik salda, zakladke "Monety" w menu i zwykla nawigacje do sklepu.
    // Niewykluczona reklama to drobnostka; ukryty portfel to zepsuta funkcja.
    const PROMO_LABELS = [
      'get coins',
      'get coin',
      'get app',
      'get the app',
      'download app',
      'zdobadz monety',
      'kup monety',
      'pobierz aplikacje',
      'pobierz apke',
      'doladuj monety',
      'zdobadz aplikacje',
      'zdobadz apke',
    ];

    const PROMO_CLICKABLE = 'a, button, [role="button"], [role="menuitem"]';

    /**
     * Surowa dlugosc tekstu, powyzej ktorej nie ma sensu w ogole normalizowac.
     * Najdluzsza etykieta promocyjna to ~16 znakow; 40 zostawia zapas na
     * polskie znaki diakrytyczne (rozkladane na znaki laczace) i whitespace.
     */
    const PROMO_MAX_RAW_LEN = 40;

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

        // normalizeLabel() to String.normalize('NFD') + trzy regexy - na dlugich
        // opisach filmow to najdrozsza czesc tego skanu. Surowa dlugosc odrzuca
        // kandydatow zanim w ogole zaczniemy normalizowac.
        const raw = el.textContent || '';
        if (!raw || raw.length > PROMO_MAX_RAW_LEN) return;

        const label = normalizeLabel(raw);
        if (!label || label.length > 24) return;
        if (!PROMO_LABELS.includes(label)) return;
        if (el.closest(PROMO_SAFE_ZONES)) return;

        el.setAttribute('data-unhook-promo', '1');
        console.log(LOG, 'Hidden promo item:', label);
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

    /**
     * Opakowania pochodzace z reguly oznaczonej jako `slow` (regula monet/apki).
     * Szybkie przebiegi jej nie odpytuja, wiec musza dodac do `wanted` to, co
     * ostatnio dopasowala - inaczej zostawiaja dziure w menu na czas do
     * kolejnego wolnego przebiegu.
     */
    const slowRuleWrappers = new Set<Element>();

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
     *
     * @param includeSlow uruchom takze kosztowne reguly legacy (patrz
     *        `slow` w WrappedHideRule). Zmiana ustawien i nawigacja ida przez
     *        `true`, zeby wszystko bylo natychmiastowe; cykliczne skany
     *        odpalaja je raz na kilka sekund.
     */
    const markHiddenWrappers = (settings: TikTokUnhookSettings, includeSlow: boolean) => {
      if (!document.body) return;

      const wanted = new Set<Element>();
      const collect = (selector: string, into: Set<Element>) => {
        let matches: NodeListOf<Element>;
        try {
          matches = document.querySelectorAll(selector);
        } catch {
          return;
        }
        matches.forEach((el) => into.add(soleWrapperOf(el)));
      };

      for (const rule of WRAPPED_HIDE_RULES) {
        if (rule.slow) {
          if (includeSlow) {
            // Pelny przebieg reguly wolnej: cache od nowa, a przy wylaczonej
            // regule (albo glownym wylaczniku) czysto.
            slowRuleWrappers.clear();
            if (settings.masterEnabled && rule.isEnabled(settings)) {
              collect(rule.selector, slowRuleWrappers);
            }
          }
          // Szybki przebieg NIE pyta o te regule, ale nie wolno mu tez zdjac tego,
          // co ona ostatnio oznaczyła. Bez tego opakowanie reklamy gubiło
          // atrybut i w pasku pojawiała się pusta dziura na czas do
          // następnego wolnego przebiegu.
          if (settings.masterEnabled) slowRuleWrappers.forEach((el) => wanted.add(el));
          continue;
        }
        if (!settings.masterEnabled || !rule.isEnabled(settings)) continue;
        collect(rule.selector, wanted);
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

    /**
     * Zdejmuje wszystkie wstrzykniete przez nas elementy UI. Wywolywane przy
     * wylaczeniu glownego przełącznika - uzytkownik ma zobaczyc czysty TikTok.
     */
    const removeUnhookUi = () => {
      [
        SEARCH_TOAST_ID,
        SEARCH_PILL_ID,
        SEARCH_LOCK_OVERLAY_ID,
        SEARCH_UNLOCK_MODAL_ID,
        SESSION_BANNER_ID,
        PASS_PILL_ID,
      ].forEach((id) => document.getElementById(id)?.remove());

      searchLockScreen = null;
      stopSearchPill();
      removePageToast(SEARCH_TOAST_ID);
      removePageToast(PASS_TOAST_ID);
      clearGuardScreen();
      clearTextHiddenMarks();
    };

    /**
     * Ciezskanie pracy: obserwator mutacji odpala skan nie rzadziej niz co
     * 600 ms, ale czesc zadan nie musi chodzic z ta czestotliwoscia.
     *
     * - markHiddenWrappers: 7 selektorow na calym dokumencie (~9.5 ms przy
     *   15k elementow). Reguly CSS z WRAPPED_HIDE_RULES ukrywaja same pozycje
     *   juz na document_start, a ten krok dokladnie tylko zwija dziure w menu -
     *   opoznienie 1.2 s jest niewidoczne.
     * - markPromoElements: skan ~1150 klikalnych elementow; nowy przycisk
     *   promocyjny pojawia sie raz na jakis czas, 1.2 s zwloki jest bez znaczenia.
     */
    const SLOW_SCAN_INTERVAL_MS = 1200;

    /**
     * Najdrozsza regula (atrybuty href z `*=`). W spokojnym DOM-ie ~2 ms,
     * ale na aktywnej stronie 20-90 ms - przy ciagle mutowanym TikToku to
     * byl glowny zlodziej czasu. 6 s wystarczy: lapie tylko stare uklady.
     */
    const SLOW_RULE_INTERVAL_MS = 6000;
    const slowScanAt = new Map<string, number>();

    const shouldRunSlowScan = (key: string, intervalMs = SLOW_SCAN_INTERVAL_MS): boolean => {
      const now = Date.now();
      const last = slowScanAt.get(key) ?? 0;
      if (now - last < intervalMs) return false;
      slowScanAt.set(key, now);
      return true;
    };

    /** Czeka, az przestaniemy throttlowac dany skan (cos wlasnie sie zmienilo). */
    const forceSlowScan = (key: string) => {
      slowScanAt.set(key, 0);
    };

    /**
     * Oznaczanie opakowan menu jest najdrozszym cyklicznym skanem, ale jego
     * wynik zmienia sie wlasciwie tylko przy przerysowaniu lewego paska.
     * Dlatego zwykle throttlujemy je do 2.5 s, a w chwili, gdy obserwator
     * zobaczy mutacje wokol sidebara, odpalamy je natychmiast.
     */
    const WRAPPER_SCAN_INTERVAL_MS = 2500;
    const SIDEBAR_MARKERS =
      '[class*="DivSideNavContainer"], [class*="DivMainNavContainer"], ' +
      '[class*="DivSideNavPlaceholderContainer"]';

    const touchesSidebar = (mutations: MutationRecord[]): boolean => {
      for (const m of mutations) {
        if (m.target instanceof Element && m.target.closest(SIDEBAR_MARKERS)) return true;
        for (const n of m.addedNodes) {
          if (!(n instanceof Element)) continue;
          if (n.matches(SIDEBAR_MARKERS) || n.closest(SIDEBAR_MARKERS)) return true;
        }
      }
      return false;
    };

    let scanTimer: number | null = null;
    const scheduleTextScan = () => {
      if (scanTimer !== null || !currentSettings) return;
      scanTimer = window.setTimeout(() => {
        scanTimer = null;
        const s = currentSettings;
        if (!s) return;
        // TikTok usuwa i wstawia cale sekcje przy nawigacji SPA; bez tego
        // zabezpieczenia <style> mogl zniknac i style wrocily dopiero
        // po nastepnym kliknieciu w popupie.
        if (!document.getElementById(STYLE_ID)) {
          applyCSS(s);
          return;
        }
        countActiveVideo();
        scanForTextDistractions(s);
        scanViralFilter(s);
        applyFollowingSectionCollapse(s);
        if (shouldRunSlowScan('promo')) markPromoElements(s);
        // Po markPromoElements - "Zdobadz aplikacje" rozpoznajemy dopiero po tresci.
        if (shouldRunSlowScan('wrappers', WRAPPER_SCAN_INTERVAL_MS)) {
          markHiddenWrappers(s, shouldRunSlowScan('wrappers-slow', SLOW_RULE_INTERVAL_MS));
        }
        // Szukajka zostaje na krotszym interwale niz menu - nowe pole
        // wyszukiwania pojawia sie w reakcji na klikniecie uzytkownika
        // i musi zablokowac sie, zanim zdazy w cos wpisac.
        if (shouldRunSlowScan('search')) handleSearchInterception(s);
        handleSearchPageGuard(s);
      }, 600);
    };

    // 2. Wstrzykniecie CSS do DOM
    const applyCSS = (settings: TikTokUnhookSettings) => {
      const wasEnabled = currentSettings ? currentSettings.masterEnabled : settings.masterEnabled;
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

      // Przelaczenie glownego wylacznika musi natychmiast zdjac wszystko, co
      // wstrzykneliismy - inaczej TikTok zostalby z naszymi elementami UI
      // (pigułka odblokowania, banner sesji, nakladka blokady szukajki).
      if (wasEnabled && !settings.masterEnabled) {
        removeUnhookUi();
      }

      applyFollowingSectionCollapse(settings);
      markPromoElements(settings);
      // Ustawienia zmienil uzytkownik - wszystko musi zadzialac natychmiast,
      // wiec i najwolniejsza regula leci w tym samym obrocie.
      markHiddenWrappers(settings, true);
      handleAutoRedirect(settings);
      handleSearchInterception(settings);
      handleSearchPageGuard(settings);
      evaluateGuard();
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
      // Nieuzywany odpytywacz profilu dotyczy starej sciezki.
      if (profilePollId !== null) {
        window.clearInterval(profilePollId);
        profilePollId = null;
      }
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
    // Obserwujemy `subtree`, bo TikTok przerysowuje cale sekcje w srodku drzewa.
    // Koszt jest wciaz ograniczony: samo scheduleTextScan jest zdeduplikowane
    // timerem 600ms, a skan dopiero wtedy robi kosztowne querySelectorAll.
    const OWN_UI_SELECTOR = `[${OWN_UI_ATTR}]`;
    const isOwnNode = (node: Node): boolean => node instanceof Element && node.hasAttribute(OWN_UI_ATTR);

    /** Zmiana w calosci wewnatrz naszych elementow albo ich wpiecie/zdjecie. */
    const isOwnMutation = (m: MutationRecord): boolean => {
      if (m.target instanceof Element && m.target.closest(OWN_UI_SELECTOR)) return true;
      if (m.addedNodes.length + m.removedNodes.length === 0) return false;
      for (const node of m.addedNodes) if (!isOwnNode(node)) return false;
      for (const node of m.removedNodes) if (!isOwnNode(node)) return false;
      return true;
    };

    const observer = new MutationObserver((mutations) => {
      // Odliczanie na naszej pigulce zmienia DOM co sekunde. Bez tego filtra
      // kazda taka zmiana budzila pelny skan strony.
      if (mutations.every(isOwnMutation)) return;
      // Przerysowanie lewego pasku to jedyny moment, w ktorym wynik
      // markHiddenWrappers realnie sie zmienia - wtedy nie czekamy na throttle.
      if (touchesSidebar(mutations)) forceSlowScan('wrappers');
      scheduleTextScan();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  },
});
