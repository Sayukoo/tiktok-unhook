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

  // 6. LIVE Streams
  hideLiveChat: boolean;
  hideLiveGifts: boolean;

  // 7. Viral Filter in Following
  viralFilterEnabled: boolean;
  viralMinLikes: number;
  viralMinComments: number;

  // 8. Compact Following Grid in Sidebar
  showAllFollowingInSidebar: boolean;

  // 9. Followers
  hideFollowers: boolean;
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

  hideLiveChat: true,
  hideLiveGifts: true,

  viralFilterEnabled: true,
  viralMinLikes: 1000,
  viralMinComments: 20,

  showAllFollowingInSidebar: true,

  hideFollowers: true,
};

const STORAGE_KEY = 'tiktok_unhook_settings';
const DAILY_STATS_KEY = 'unhook_daily_stats_v1';
const LAST_SESSION_KEY = 'unhook_last_session_v1';
const FOLLOWING_CACHE_KEY = 'unhook_following_cache_v1';

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

export interface FollowingAccount {
  href: string;
  name: string;
  avatar: string | null;
}

export interface FollowingCache {
  fetchedAt: number;
  accounts: FollowingAccount[];
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

export async function getSettings(): Promise<TikTokUnhookSettings> {
  const merged: TikTokUnhookSettings = { ...DEFAULT_SETTINGS };

  const [syncRes, localRes] = await Promise.all([
    readArea('sync', [STORAGE_KEY]),
    readArea('local', [STORAGE_KEY]),
  ]);

  if (localRes?.[STORAGE_KEY]) Object.assign(merged, localRes[STORAGE_KEY]);
  if (syncRes?.[STORAGE_KEY]) Object.assign(merged, syncRes[STORAGE_KEY]);

  if (!getSettings.syncMigrated && localRes?.[STORAGE_KEY] && !syncRes?.[STORAGE_KEY]) {
    getSettings.syncMigrated = true;
    void writeArea('sync', { [STORAGE_KEY]: merged });
  }

  return merged;
}
getSettings.syncMigrated = false;

export async function saveSettings(settings: TikTokUnhookSettings): Promise<void> {
  const payload = { [STORAGE_KEY]: settings };
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
      const newSettings = { ...DEFAULT_SETTINGS, ...changes[STORAGE_KEY].newValue };
      callback(newSettings);
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

export async function getFollowingCache(): Promise<FollowingCache | null> {
  const res = await readArea('local', [FOLLOWING_CACHE_KEY]);
  const c = res?.[FOLLOWING_CACHE_KEY] as FollowingCache | undefined;
  return c && Array.isArray(c.accounts) ? c : null;
}

export async function saveFollowingCache(cache: FollowingCache): Promise<void> {
  await writeArea('local', { [FOLLOWING_CACHE_KEY]: cache });
}
