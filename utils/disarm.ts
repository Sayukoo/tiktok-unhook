// Teksty w utils/i18n.ts zakładają te trzy liczby: litera co sekundę,
// cofnięcie o 8 znaków, przytrzymanie przez 3 sekundy.
export const DISARM_DRIP_MS = 1000;
export const DISARM_TYPO_REWIND = 8;
export const DISARM_HOLD_MS = 3000;

export type DisarmSession = {
  phrase: string;
  startedAt: number;
  rewind: number;
};

// Pierwsza litera jest dostępna od razu, każda kolejna po DISARM_DRIP_MS.
// Dzięki temu rytuał da się zrozumieć bez czekania w ciemno, a i tak
// zajmuje około minuty: (długość zdania - 1) sekund plus przytrzymanie.
export function disarmFrontier(session: DisarmSession, now: number): number {
  const elapsed = Math.max(0, now - session.startedAt);
  const unlocked = Math.floor(elapsed / DISARM_DRIP_MS) + 1 - session.rewind;
  if (unlocked <= 0) return 0;
  if (unlocked >= session.phrase.length) return session.phrase.length;
  return unlocked;
}

export function disarmMatchedPrefix(phrase: string, typed: string): number {
  const limit = Math.min(phrase.length, typed.length);
  let index = 0;
  while (index < limit && phrase[index] === typed[index]) index += 1;
  return index;
}

export function disarmClampTyped(session: DisarmSession, typed: string, now: number): string {
  const keep = Math.min(disarmMatchedPrefix(session.phrase, typed), disarmFrontier(session, now));
  return session.phrase.slice(0, keep);
}

export function disarmIsComplete(session: DisarmSession, typed: string, now: number): boolean {
  return (
    session.phrase.length > 0 &&
    typed === session.phrase &&
    disarmFrontier(session, now) === session.phrase.length
  );
}

export function disarmApplyRewind(session: DisarmSession): DisarmSession {
  return { ...session, rewind: session.rewind + DISARM_TYPO_REWIND };
}

// Tekst rytuału to `rounds` różnych zdań pod rząd. `avoid` to poprzedni tekst:
// przycisk "inny tekst" nie może wylosować tego samego początku.
export function pickDisarmText(
  phrases: readonly [string, ...string[]],
  rounds: number,
  avoid?: string
): string {
  const count = Math.max(1, Math.min(phrases.length, Math.floor(rounds)));
  const pool = [...phrases];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap]!, pool[index]!];
  }
  if (avoid && pool.length > 1 && avoid.startsWith(pool[0]!)) {
    pool.push(pool.shift()!);
  }
  return pool.slice(0, count).join(' ');
}

export function disarmEstimateMinutes(text: string): number {
  const totalMs = Math.max(0, text.length - 1) * DISARM_DRIP_MS + DISARM_HOLD_MS;
  return Math.max(1, Math.round(totalMs / 60000));
}
