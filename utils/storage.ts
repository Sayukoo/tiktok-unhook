import type { Language } from './i18n';

export interface TikTokUnhookSettings {
  // Master Switch & Appearance
  masterEnabled: boolean;
  theme: 'dark' | 'light';
  language: Language;

  // 1. Feeds & Navigation
  hideForYouFeed: boolean;
  hideExploreFeed: boolean;
  redirectToProfile: boolean;

  // 2. Sidebar & Accounts
  hideSuggestedAccounts: boolean;
  highlightFollowingAccounts: boolean;
  hideFriends: boolean;
  hideLiveSidebar: boolean;
  hideSidebarFooter: boolean;

  // 3. Video, Comments & Descriptions
  hideComments: boolean;
  hideDescriptions: boolean;
  hideActionButtons: boolean;

  // 4. Metrics & Counters
  hideLikeCount: boolean;
  hideShareCount: boolean;
  hideCommentCount: boolean;

  // 5. Commercials & Distractions
  hideShop: boolean;
  hideAds: boolean;
  hideHeaderPromos: boolean;
  hideGetCoinsApp: boolean;

  // 7. Viral Filter in Following
  viralFilterEnabled: boolean;
  viralMinLikes: number;
  viralMinComments: number;

  // 8. Sidebar "Following accounts" list (collapsed behind a "View all" toggle)
  hideFollowingSidebarList: boolean;

  // 9. Followers
  hideFollowers: boolean;

  // 10. Search focus mode
  searchUnlockChallenge: boolean;

  // 11. Background playback
  keepPlayingInBackground: boolean;

  // 12. Zamek: każde osłabienie blokady wymaga rytuału z popupu
  strictLock: boolean;

  // 13. Limity czasu. Godziny trzymamy jako minuty od północy (0-1439).
  entryGateEnabled: boolean;
  entryGateSeconds: number;
  dailyLimitEnabled: boolean;
  dailyLimitMinutes: number;
  quietHoursEnabled: boolean;
  quietStart: number;
  quietEnd: number;

  // 14. Skala szarości na całej stronie
  grayscale: boolean;
}

export const DEFAULT_SETTINGS: TikTokUnhookSettings = {
  masterEnabled: true,
  theme: 'dark',
  language: 'en',

  hideForYouFeed: true,
  hideExploreFeed: true,
  redirectToProfile: true,

  hideSuggestedAccounts: true,
  highlightFollowingAccounts: true,
  hideFriends: true,
  hideLiveSidebar: true,
  hideSidebarFooter: true,

  hideComments: true,
  hideDescriptions: false,
  hideActionButtons: false,

  hideLikeCount: false,
  hideShareCount: false,
  hideCommentCount: false,

  hideShop: true,
  hideAds: true,
  hideHeaderPromos: true,
  hideGetCoinsApp: true,

  viralFilterEnabled: true,
  viralMinLikes: 1000,
  viralMinComments: 20,

  hideFollowingSidebarList: true,

  hideFollowers: true,

  searchUnlockChallenge: true,

  keepPlayingInBackground: true,

  strictLock: true,

  entryGateEnabled: false,
  entryGateSeconds: 10,
  dailyLimitEnabled: false,
  dailyLimitMinutes: 30,
  quietHoursEnabled: false,
  quietStart: 22 * 60,
  quietEnd: 7 * 60,

  grayscale: false,
};

// Klucz zostaje ze starą nazwą celowo: to wewnętrzny identyfikator, którego
// użytkownik nigdy nie widzi, a jego zmiana skasowałaby ustawienia wszystkim,
// którzy mają już wtyczkę zainstalowaną.
const STORAGE_KEY = 'tiktok_unhook_settings';
/**
 * Kiedy zapisano ustawienia. Bez tego `sync` i `local` potrafią się rozjechać
 * (limit, wylogowanie z konta Google, sync wylaczony) i wtedy ten ostatni
 * zapis - ten, ktory nie trafil do `sync` - po prostu przepada.
 */
const SAVED_AT_KEY = 'tiktok_unhook_settings_saved_at';
const DAILY_STATS_KEY = 'unhook_daily_stats_v1';
const LAST_SESSION_KEY = 'unhook_last_session_v1';

/** Keys written by older versions that are no longer read by anything. */
const LEGACY_LOCAL_KEYS = ['unhook_following_cache_v1'];

export interface DailyStats {
  date: string;
  seconds: number;
  videos: number;
}

export interface SessionSummary {
  endedAt: number;
  minutes: number;
  videos: number;
}

type AnyApi = any;

function getApi(): AnyApi | null {
  try {
    if (typeof browser !== 'undefined' && (browser as AnyApi)?.storage) return browser;
    if (typeof chrome !== 'undefined' && (chrome as AnyApi)?.storage) return chrome;
  } catch {
    /* noop */
  }
  return null;
}

async function readArea(area: 'sync' | 'local', keys: string[]): Promise<Record<string, any> | null> {
  const api = getApi();
  const store = api?.storage?.[area];
  if (!store?.get) return null;
  try {
    return (await store.get(keys)) || {};
  } catch {
    return null;
  }
}

async function writeArea(area: 'sync' | 'local', values: Record<string, unknown>): Promise<boolean> {
  const api = getApi();
  const store = api?.storage?.[area];
  if (!store?.set) return false;
  try {
    await store.set(values);
    return true;
  } catch {
    return false;
  }
}

/**
 * Keeps only keys that still exist in DEFAULT_SETTINGS and whose type matches,
 * so settings removed in a newer version (or corrupt values) can never come back.
 */
export function sanitizeSettings(raw: unknown): TikTokUnhookSettings {
  const out: TikTokUnhookSettings = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== 'object') return out;

  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof TikTokUnhookSettings)[]) {
    const value = (raw as Record<string, unknown>)[key];
    if (value === undefined || value === null) continue;
    if (typeof value !== typeof DEFAULT_SETTINGS[key]) continue;
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    (out as unknown as Record<string, unknown>)[key] = value;
  }

  if (out.theme !== 'dark' && out.theme !== 'light') out.theme = DEFAULT_SETTINGS.theme;
  if (out.language !== 'en' && out.language !== 'pl') out.language = DEFAULT_SETTINGS.language;
  out.viralMinLikes = Math.max(0, Math.round(out.viralMinLikes));
  out.viralMinComments = Math.max(0, Math.round(out.viralMinComments));
  out.entryGateSeconds = clampInt(out.entryGateSeconds, 3, 120);
  out.dailyLimitMinutes = clampInt(out.dailyLimitMinutes, 1, 24 * 60);
  out.quietStart = clampInt(out.quietStart, 0, 24 * 60 - 1);
  out.quietEnd = clampInt(out.quietEnd, 0, 24 * 60 - 1);

  return out;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export async function getSettings(): Promise<TikTokUnhookSettings> {
  const [syncRes, localRes] = await Promise.all([
    readArea('sync', [STORAGE_KEY, SAVED_AT_KEY]),
    readArea('local', [STORAGE_KEY, SAVED_AT_KEY]),
  ]);

  const syncSavedAt = pickTimestamp(syncRes?.[SAVED_AT_KEY]);
  const localSavedAt = pickTimestamp(localRes?.[SAVED_AT_KEY]);

  // Wygrywa NOWSZY zapis, a nie zawsze `sync`. Gdy zapis do `sync` zawodzi
  // (limit, wylogowanie z konta, sync wylaczony), `local` trzyma ostatnia
  // decyzje uzytkownika i wlasnie ona musi byc widoczna - inaczej ostatnia
  // zmiana cicho cofa sie po kazdym odswiezeniu.
  // Dane bez znacznika czasu (stare wersje wtyczki) dostaja 0 i wtedy
  // zachowanie zostaje takie jak wczesniej: wygrywa `sync`.
  const localWins = localSavedAt > syncSavedAt;
  const stored = localWins
    ? { ...(syncRes?.[STORAGE_KEY] || {}), ...(localRes?.[STORAGE_KEY] || {}) }
    : { ...(localRes?.[STORAGE_KEY] || {}), ...(syncRes?.[STORAGE_KEY] || {}) };
  const merged = sanitizeSettings(stored);

  if (!getSettings.syncMigrated && localRes?.[STORAGE_KEY] && !syncRes?.[STORAGE_KEY]) {
    getSettings.syncMigrated = true;
    // Znacznik czasu jedzie razem z ustawieniami, wiec oba obszary
    // pozostaja porownywalne.
    void writeArea('sync', {
      [STORAGE_KEY]: merged,
      [SAVED_AT_KEY]: localSavedAt || Date.now(),
    });
  }

  return merged;
}
getSettings.syncMigrated = false;

/** Znacznik czasu zapisu; cokolwiek nie-numeryczne traktujemy jak brak. */
function pickTimestamp(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Zapisuje do `sync` (rozsynchronizowane miedzy urzadzeniami) i do `local`
 * jako zapas. Wczesniejsza wersja miala `if (!okSync) ... else ...` z tym samym
 * wywolaniem w obu galeziach - czyli zapis do `local` byl bezwarunkowy, a
 * `okSync` niczego nie wnosil. Ta wersja robi dokladnie to, co tamta robila,
 * tylko bez Mylacego warunku.
 *
 * Znacznik czasu leci w TYM SAMYM wywolaniu `set`, dzieki czemu oba obszary
 * zawsze da sie porownac - osobne zapisy moglyby sie rozejsc.
 */
export async function saveSettings(settings: TikTokUnhookSettings): Promise<void> {
  const payload = {
    [STORAGE_KEY]: sanitizeSettings(settings),
    [SAVED_AT_KEY]: Date.now(),
  };
  await writeArea('sync', payload);
  await writeArea('local', payload);
}

export function onSettingsChange(callback: (newSettings: TikTokUnhookSettings) => void): () => void {
  // Zapis idzie do `sync` i do `local`, wiec storage.onChanged odpala sie
  // DWUKROTNIE dla jednego klikniecia. Bez tego kazda otwarta karta TikToka
  // przebudowywala CSS i przemierzala DOM dwa razy.
  let lastSignature: string | null = null;

  const listener = (changes: Record<string, any>, areaName: string) => {
    if (areaName !== 'sync' && areaName !== 'local') return;
    const change = changes?.[STORAGE_KEY];
    if (!change) return;

    const next = sanitizeSettings(change.newValue);
    const signature = JSON.stringify(next);
    if (signature === lastSignature) return;
    lastSignature = signature;

    callback(next);
  };

  const api = getApi();
  if (api?.storage?.onChanged?.addListener) {
    api.storage.onChanged.addListener(listener);
    return () => api.storage.onChanged.removeListener(listener);
  }
  return () => {};
}

/**
 * Dzien w strefie czasowej uzytkownika, nie UTC. `toISOString()` przesuwalo
 * "dzisiaj" o jeden dzien dla wszystkich na wschodzie od Greenwich - statystyki
 * resetowaly sie wieczorem i przypisywaly do wczorajszego dnia.
 */
export function todayKey(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export async function getDailyStats(): Promise<DailyStats | null> {
  const res = await readArea('local', [DAILY_STATS_KEY]);
  const stats = res?.[DAILY_STATS_KEY] as DailyStats | undefined;
  return stats && typeof stats.date === 'string' ? stats : null;
}

export async function saveDailyStats(stats: DailyStats): Promise<void> {
  await writeArea('local', { [DAILY_STATS_KEY]: stats });
}

/**
 * Dolicza czas i filmy do dzisiejszego licznika, czytając go najpierw ze
 * storage. Każda karta trzymała wcześniej własną kopię i zapisywała ją w
 * całości: karta otwarta rano nadpisywała po powrocie do niej wszystko, co
 * w międzyczasie naliczyła inna. Przy limicie dziennym oznaczałoby to cofanie
 * licznika samym przełączeniem karty.
 */
export async function addToDailyStats(seconds: number, videos: number): Promise<DailyStats> {
  const today = todayKey();
  const stored = await getDailyStats();
  const base = stored && stored.date === today ? stored : { date: today, seconds: 0, videos: 0 };
  const next: DailyStats = {
    date: today,
    seconds: Math.max(0, Math.round((Number(base.seconds) || 0) + seconds)),
    videos: Math.max(0, Math.round((Number(base.videos) || 0) + videos)),
  };
  if (seconds !== 0 || videos !== 0 || !stored || stored.date !== today) {
    await saveDailyStats(next);
  }
  return next;
}

// --- Stan zamka i przepustek (tylko `local`: dotyczy tego urządzenia) ---

const GUARD_KEY = 'unhook_guard_v1';

export interface GuardState {
  /** Do kiedy ustawienia można zmieniać bez rytuału. */
  editUntil: number;
  /** Ile rytuałów ukończono dzisiaj: od tego zależy długość kolejnego. */
  ritualCount: number;
  /** Do kiedy działa przepustka zdejmująca blokadę limitu i cichych godzin. */
  passUntil: number;
  /** Ile przepustek wzięto dzisiaj: od tego zależy długość kodu. */
  passCount: number;
}

type StoredGuard = Partial<GuardState> & { date?: string };

function normalizeGuard(raw: unknown): GuardState {
  const stored = (raw && typeof raw === 'object' ? raw : {}) as StoredGuard;
  const sameDay = stored.date === todayKey();
  return {
    editUntil: pickTimestamp(stored.editUntil),
    ritualCount: sameDay ? Math.max(0, Math.round(pickTimestamp(stored.ritualCount))) : 0,
    passUntil: pickTimestamp(stored.passUntil),
    passCount: sameDay ? Math.max(0, Math.round(pickTimestamp(stored.passCount))) : 0,
  };
}

export async function getGuardState(): Promise<GuardState> {
  const res = await readArea('local', [GUARD_KEY]);
  return normalizeGuard(res?.[GUARD_KEY]);
}

export async function updateGuardState(patch: Partial<GuardState>): Promise<GuardState> {
  const next = { ...(await getGuardState()), ...patch };
  await writeArea('local', { [GUARD_KEY]: { ...next, date: todayKey() } });
  return next;
}

export function onGuardChange(callback: (state: GuardState) => void): () => void {
  return onLocalKeyChange(GUARD_KEY, (value) => callback(normalizeGuard(value)));
}

export function onDailyStatsChange(callback: (stats: DailyStats | null) => void): () => void {
  return onLocalKeyChange(DAILY_STATS_KEY, (value) => {
    const stats = value as DailyStats | undefined;
    callback(stats && typeof stats.date === 'string' ? stats : null);
  });
}

function onLocalKeyChange(key: string, callback: (value: unknown) => void): () => void {
  const listener = (changes: Record<string, any>, areaName: string) => {
    if (areaName !== 'local' || !changes?.[key]) return;
    callback(changes[key].newValue);
  };
  const api = getApi();
  if (api?.storage?.onChanged?.addListener) {
    api.storage.onChanged.addListener(listener);
    return () => api.storage.onChanged.removeListener(listener);
  }
  return () => {};
}

export async function getLastSession(): Promise<SessionSummary | null> {
  const res = await readArea('local', [LAST_SESSION_KEY]);
  const s = res?.[LAST_SESSION_KEY] as SessionSummary | undefined;
  return s && typeof s.endedAt === 'number' ? s : null;
}

export async function saveLastSession(summary: SessionSummary): Promise<void> {
  await writeArea('local', { [LAST_SESSION_KEY]: summary });
}

export async function clearLegacyStorage(): Promise<void> {
  const api = getApi();
  const store = api?.storage?.local;
  if (!store?.remove) return;
  try {
    await store.remove(LEGACY_LOCAL_KEYS);
  } catch {
    /* noop */
  }
}
