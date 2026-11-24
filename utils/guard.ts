import type { TikTokUnhookSettings } from './storage';

/** Po ukończonym rytuale ustawienia można zmieniać swobodnie przez tyle czasu. */
export const EDIT_WINDOW_MS = 3 * 60 * 1000;
/** Tyle samo swobody dostaje świeża instalacja, żeby dało się wszystko ustawić. */
export const SETUP_WINDOW_MS = 10 * 60 * 1000;
/** Przepustka zdejmuje blokadę limitu i cichych godzin na tyle czasu. */
export const PASS_MS = 5 * 60 * 1000;

const MINUTES_PER_DAY = 24 * 60;

/**
 * Przełączniki, których wyłączenie osłabia blokadę. Celowo nie ma tu motywu,
 * języka, stopki menu ani grania w tle: one niczego nie pilnują.
 */
const PROTECTIVE_SWITCHES = [
  'masterEnabled',
  'strictLock',
  'hideForYouFeed',
  'hideExploreFeed',
  'redirectToProfile',
  'hideSuggestedAccounts',
  'hideFriends',
  'hideLiveSidebar',
  'hideComments',
  'hideDescriptions',
  'hideActionButtons',
  'hideLikeCount',
  'hideShareCount',
  'hideCommentCount',
  'hideShop',
  'hideAds',
  'hideHeaderPromos',
  'hideGetCoinsApp',
  'viralFilterEnabled',
  'hideFollowingSidebarList',
  'hideFollowers',
  'searchUnlockChallenge',
  'entryGateEnabled',
  'dailyLimitEnabled',
  'quietHoursEnabled',
  'grayscale',
] as const satisfies readonly (keyof TikTokUnhookSettings)[];

/** Czy przejście `prev` -> `next` zdejmuje albo luzuje którąkolwiek blokadę. */
export function isWeakening(prev: TikTokUnhookSettings, next: TikTokUnhookSettings): boolean {
  for (const key of PROTECTIVE_SWITCHES) {
    if (prev[key] && !next[key]) return true;
  }
  if (prev.entryGateEnabled && next.entryGateEnabled && next.entryGateSeconds < prev.entryGateSeconds) {
    return true;
  }
  if (prev.dailyLimitEnabled && next.dailyLimitEnabled && next.dailyLimitMinutes > prev.dailyLimitMinutes) {
    return true;
  }
  if (
    prev.quietHoursEnabled &&
    next.quietHoursEnabled &&
    !quietWindowContains(next.quietStart, next.quietEnd, prev.quietStart, prev.quietEnd)
  ) {
    return true;
  }
  return false;
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function wrapMinutes(value: number): number {
  return ((Math.round(value) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/** Długość okna w minutach. Początek równy końcowi oznacza puste okno. */
export function quietWindowLength(start: number, end: number): number {
  return wrapMinutes(end - start);
}

/** Okno może przechodzić przez północ (22:00-07:00). */
export function isInQuietHours(start: number, end: number, nowMinutes: number): boolean {
  const length = quietWindowLength(start, end);
  if (length === 0) return false;
  return wrapMinutes(nowMinutes - start) < length;
}

export function minutesUntilQuietEnd(end: number, nowMinutes: number): number {
  const left = wrapMinutes(end - nowMinutes);
  return left === 0 ? MINUTES_PER_DAY : left;
}

/** Czy okno `outer` obejmuje w całości okno `inner`. */
export function quietWindowContains(
  outerStart: number,
  outerEnd: number,
  innerStart: number,
  innerEnd: number
): boolean {
  const innerLength = quietWindowLength(innerStart, innerEnd);
  if (innerLength === 0) return true;
  const outerLength = quietWindowLength(outerStart, outerEnd);
  const offset = wrapMinutes(innerStart - outerStart);
  return offset + innerLength <= outerLength;
}

export function formatClock(minutes: number): string {
  const value = wrapMinutes(minutes);
  const hours = `${Math.floor(value / 60)}`.padStart(2, '0');
  const mins = `${value % 60}`.padStart(2, '0');
  return `${hours}:${mins}`;
}

/** Każdy kolejny rytuał tego samego dnia to o jedno zdanie więcej, do trzech. */
export function ritualRounds(completedToday: number): number {
  return Math.min(3, 1 + Math.max(0, Math.floor(completedToday)));
}

/** Każda kolejna przepustka tego samego dnia to dłuższy kod, do 90 znaków. */
export function passCodeLength(takenToday: number): number {
  return Math.min(90, 30 + 15 * Math.max(0, Math.floor(takenToday)));
}

export type BlockVerdict =
  | { kind: 'none' }
  | { kind: 'limit'; limitMinutes: number }
  | { kind: 'quiet'; endsAt: number };

/**
 * Czy strona ma być teraz zasłonięta. Ciche godziny mają pierwszeństwo przed
 * limitem, bo kończą się o znanej godzinie i to ją pokazujemy na nakładce.
 */
export function evaluateBlock(
  settings: TikTokUnhookSettings,
  context: { now: Date; secondsToday: number; passUntil: number }
): BlockVerdict {
  if (!settings.masterEnabled) return { kind: 'none' };
  if (context.passUntil > context.now.getTime()) return { kind: 'none' };

  if (
    settings.quietHoursEnabled &&
    isInQuietHours(settings.quietStart, settings.quietEnd, minutesOfDay(context.now))
  ) {
    return { kind: 'quiet', endsAt: settings.quietEnd };
  }
  if (settings.dailyLimitEnabled && context.secondsToday >= settings.dailyLimitMinutes * 60) {
    return { kind: 'limit', limitMinutes: settings.dailyLimitMinutes };
  }
  return { kind: 'none' };
}
