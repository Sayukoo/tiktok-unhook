import { Language } from './i18n';

export interface TikTokUnhookSettings {
  // Master Switch & Appearance
  masterEnabled: boolean;
  theme: 'dark' | 'light';
  language: Language;

  // 1. Feeds & Navigation
  hideForYouFeed: boolean;
  hideExploreFeed: boolean;
  hideFollowingFeed: boolean;
  redirectToProfile: boolean;

  // 2. Sidebar & Accounts
  hideSuggestedAccounts: boolean;
  highlightFollowingAccounts: boolean;
  hideFriends: boolean;
  hideLiveSidebar: boolean;
  hidePlaylists: boolean;
  hideFundraisers: boolean;
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

  // 6. LIVE Streams
  hideLiveChat: boolean;
  hideLiveGifts: boolean;

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
}

export const DEFAULT_SETTINGS: TikTokUnhookSettings = {
  masterEnabled: true,
  theme: 'dark',
  language: 'en',

  hideForYouFeed: true,
  hideExploreFeed: true,
  hideFollowingFeed: false,
  redirectToProfile: true,

  hideSuggestedAccounts: true,
  highlightFollowingAccounts: true,
  hideFriends: true,
  hideLiveSidebar: true,
  hidePlaylists: true,
  hideFundraisers: true,
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

  hideLiveChat: true,
  hideLiveGifts: true,

  viralFilterEnabled: true,
  viralMinLikes: 1000,
  viralMinComments: 20,

  hideFollowingSidebarList: true,

  hideFollowers: true,

  searchUnlockChallenge: true,

  keepPlayingInBackground: true,
};

const STORAGE_KEY = 'tiktok_unhook_settings';
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

  return out;
}

export async function getSettings(): Promise<TikTokUnhookSettings> {
  const [syncRes, localRes] = await Promise.all([
    readArea('sync', [STORAGE_KEY]),
    readArea('local', [STORAGE_KEY]),
  ]);

  const stored = { ...(localRes?.[STORAGE_KEY] || {}), ...(syncRes?.[STORAGE_KEY] || {}) };
  const merged = sanitizeSettings(stored);

  if (!getSettings.syncMigrated && localRes?.[STORAGE_KEY] && !syncRes?.[STORAGE_KEY]) {
    getSettings.syncMigrated = true;
    void writeArea('sync', { [STORAGE_KEY]: merged });
  }

  return merged;
}
getSettings.syncMigrated = false;

export async function saveSettings(settings: TikTokUnhookSettings): Promise<void> {
  const payload = { [STORAGE_KEY]: sanitizeSettings(settings) };
  const okSync = await writeArea('sync', payload);
  if (!okSync) await writeArea('local', payload);
  else await writeArea('local', payload);
}

export function onSettingsChange(callback: (newSettings: TikTokUnhookSettings) => void): () => void {
  const listener = (
    changes: Record<string, any>,
    areaName: string
  ) => {
    if ((areaName === 'sync' || areaName === 'local') && changes[STORAGE_KEY]) {
      callback(sanitizeSettings(changes[STORAGE_KEY].newValue));
    }
  };

  const api = getApi();
  if (api?.storage?.onChanged?.addListener) {
    api.storage.onChanged.addListener(listener);
    return () => api.storage.onChanged.removeListener(listener);
  }
  return () => {};
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDailyStats(): Promise<DailyStats | null> {
  const res = await readArea('local', [DAILY_STATS_KEY]);
  const stats = res?.[DAILY_STATS_KEY] as DailyStats | undefined;
  return stats && typeof stats.date === 'string' ? stats : null;
}

export async function saveDailyStats(stats: DailyStats): Promise<void> {
  await writeArea('local', { [DAILY_STATS_KEY]: stats });
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
