import type { TranslationStrings } from '@/utils/i18n';
import {
  DISARM_HOLD_MS,
  DISARM_TYPO_REWIND,
  type DisarmSession,
  disarmApplyRewind,
  disarmClampTyped,
  disarmFrontier,
  disarmIsComplete,
  disarmEstimateMinutes,
  disarmMatchedPrefix,
  pickDisarmText,
} from '@/utils/disarm';
import { EDIT_WINDOW_MS } from '@/utils/guard';

/** Co rytuał ma odblokować: całkowite wyłączenie czy pojedyncze poluzowanie. */
export type DisarmMeta = {
  kind: 'off' | 'loosen';
  /** Ile zdań trzeba przepisać. Rośnie z każdym rytuałem tego samego dnia. */
  rounds: number;
};

// Stan żyje tylko w pamięci okienka. Zamknięcie popupu niszczy stronę,
// więc próba wyłączenia nie da się dokończyć "na raty".
let session: DisarmSession | null = null;
let meta: DisarmMeta = { kind: 'off', rounds: 1 };
let generation = 0;
let tickId: number | null = null;
let holdRaf: number | null = null;

const TYPO_DEBOUNCE_MS = 700;

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7c0f]/60 dark:focus-visible:ring-[#d4ff3a]/60 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#141416]';

export function isDisarmOpen(): boolean {
  return session !== null;
}

export function openDisarm(phrase: string, nextMeta: DisarmMeta): void {
  if (phrase.length === 0) return;
  meta = nextMeta;
  session = { phrase, startedAt: Date.now(), rewind: 0 };
}

export function closeDisarm(): void {
  generation += 1;
  session = null;
  clearTimers();
}

function clearTimers(): void {
  if (tickId !== null) {
    window.clearInterval(tickId);
    tickId = null;
  }
  if (holdRaf !== null) {
    window.cancelAnimationFrame(holdRaf);
    holdRaf = null;
  }
}

export type DisarmMountDeps = {
  isDark: boolean;
  t: TranslationStrings;
  onCancel: () => void;
  onConfirm: () => void;
  requestRender: () => void;
};

export function mountDisarm(root: HTMLElement, deps: DisarmMountDeps): void {
  clearTimers();
  const gen = ++generation;
  const active = () => generation === gen && session !== null;
  const phrase = session?.phrase ?? '';

  document.documentElement.classList.toggle('dark', deps.isDark);
  const pageBg = deps.isDark ? '#141416' : '#ffffff';
  document.documentElement.style.backgroundColor = pageBg;
  document.body.style.backgroundColor = pageBg;

  while (root.firstChild) root.removeChild(root.firstChild);

  const holdSeconds = DISARM_HOLD_MS / 1000;
  const t = deps.t;

  const container = document.createElement('div');
  container.className =
    'w-[360px] min-h-[480px] max-h-[580px] overflow-y-auto bg-white dark:bg-[#141416] text-gray-900 dark:text-gray-100 flex flex-col font-sans select-none antialiased px-3 py-3 gap-3';

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = `self-start text-[11.5px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white cursor-pointer rounded ${FOCUS_RING}`;
  backBtn.textContent = `← ${t.disarmBack}`;
  backBtn.onclick = () => {
    if (!active()) return;
    deps.onCancel();
  };

  const title = document.createElement('h1');
  title.className = 'text-[15px] font-bold tracking-tight leading-tight';
  title.textContent = meta.kind === 'off' ? t.disarmTitleOff : t.disarmTitleLoosen;

  const reasonParts = [
    meta.kind === 'off' ? t.disarmReasonOff : t.disarmReasonLoosen(Math.round(EDIT_WINDOW_MS / 60000)),
  ];
  if (meta.rounds > 1) reasonParts.push(t.disarmRound(meta.rounds));

  const reason = document.createElement('p');
  reason.className = 'text-[11.5px] leading-snug font-medium text-gray-700 dark:text-gray-200 -mt-1.5';
  reason.textContent = reasonParts.join(' ');

  const subtitle = document.createElement('p');
  subtitle.className = 'text-[11px] leading-snug text-gray-500 dark:text-gray-400 -mt-1.5';
  subtitle.textContent = t.disarmSubtitle(DISARM_TYPO_REWIND);

  const phraseBox = document.createElement('div');
  phraseBox.className =
    'rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-3 pt-2.5 pb-2';
  phraseBox.addEventListener('copy', (event) => event.preventDefault());
  phraseBox.addEventListener('dragstart', (event) => event.preventDefault());

  const phraseEl = document.createElement('p');
  phraseEl.className = 'text-[15px] leading-7 whitespace-pre-wrap break-words font-medium';
  const phraseChars: HTMLSpanElement[] = [];
  for (let index = 0; index < phrase.length; index += 1) {
    const span = document.createElement('span');
    span.textContent = phrase[index] ?? '';
    phraseEl.appendChild(span);
    phraseChars.push(span);
  }
  phraseBox.appendChild(phraseEl);

  const progressRow = document.createElement('div');
  progressRow.className = 'flex items-center gap-2';

  const track = document.createElement('div');
  track.className = 'h-1 flex-1 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden';
  track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', String(phrase.length));
  track.setAttribute('aria-label', t.disarmProgressLabel);

  const bar = document.createElement('div');
  bar.className = 'h-full rounded-full bg-[#4d7c0f] dark:bg-[#d4ff3a] transition-[width] duration-300 ease-linear';
  bar.style.width = '0%';
  track.appendChild(bar);

  const count = document.createElement('span');
  count.className = 'text-[10px] tabular-nums text-gray-400 dark:text-gray-500 flex-shrink-0';

  progressRow.appendChild(track);
  progressRow.appendChild(count);

  const input = document.createElement('input');
  input.type = 'text';
  input.spellcheck = false;
  input.autocomplete = 'off';
  input.readOnly = true;
  input.maxLength = phrase.length;
  input.placeholder = t.disarmPlaceholder;
  input.setAttribute('aria-label', t.disarmPlaceholder);
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('autocapitalize', 'none');
  input.className =
    'w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-2.5 py-2 text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 select-text caret-[#4d7c0f] dark:caret-[#d4ff3a]';
  input.style.setProperty('user-select', 'text');
  input.style.setProperty('-webkit-user-select', 'text');
  input.addEventListener('focus', () => {
    input.readOnly = false;
  });

  const status = document.createElement('p');
  status.className = 'text-[11px] min-h-[16px] text-gray-400 dark:text-gray-500 -mt-1';

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.disabled = true;
  confirmBtn.className = waitButtonClass();

  const fill = document.createElement('span');
  fill.className = 'absolute inset-y-0 left-0 bg-black/15 dark:bg-black/20 pointer-events-none';
  fill.style.width = '0%';

  const confirmLabel = document.createElement('span');
  confirmLabel.className = 'relative z-10';
  confirmLabel.textContent = t.disarmWait;

  confirmBtn.appendChild(fill);
  confirmBtn.appendChild(confirmLabel);

  const newPhraseBtn = document.createElement('button');
  newPhraseBtn.type = 'button';
  newPhraseBtn.className = `self-center text-[11px] font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer rounded ${FOCUS_RING}`;
  newPhraseBtn.textContent = t.disarmNewPhrase;
  newPhraseBtn.onclick = () => {
    if (!active() || !session) return;
    const next = pickDisarmText(t.disarmPhrases, meta.rounds, session.phrase);
    session = { phrase: next, startedAt: Date.now(), rewind: 0 };
    deps.requestRender();
  };

  const hint = document.createElement('p');
  hint.className = 'mt-auto pt-1 text-[10px] leading-snug text-gray-400 dark:text-gray-500';
  hint.textContent = t.disarmHint(disarmEstimateMinutes(phrase));

  container.appendChild(backBtn);
  container.appendChild(title);
  container.appendChild(reason);
  container.appendChild(subtitle);
  container.appendChild(phraseBox);
  container.appendChild(progressRow);
  container.appendChild(input);
  container.appendChild(status);
  container.appendChild(confirmBtn);
  container.appendChild(newPhraseBtn);
  container.appendChild(hint);
  root.appendChild(container);

  let holdStartedAt: number | null = null;
  let lastTypoAt = 0;
  let typoUntil = 0;
  let pasteUntil = 0;
  let confirmed = false;

  function setTyped(value: string): void {
    if (input.value === value) return;
    input.value = value;
    const end = value.length;
    input.setSelectionRange(end, end);
  }

  function paint(): void {
    if (!active() || !session) return;
    const now = Date.now();
    const frontier = disarmFrontier(session, now);
    const typed = input.value;
    const matched = disarmMatchedPrefix(session.phrase, typed);
    const complete = disarmIsComplete(session, typed, now);

    for (let index = 0; index < phraseChars.length; index += 1) {
      const span = phraseChars[index];
      if (!span) continue;
      let className = 'transition-colors duration-150';
      if (index < matched) className += ' text-[#4d7c0f] dark:text-[#d4ff3a]';
      else if (index < frontier) className += ' text-gray-900 dark:text-white';
      else className += ' text-gray-400 dark:text-gray-500';
      if (index === matched && index < phrase.length) {
        className +=
          index < frontier
            ? ' underline decoration-[#4d7c0f] dark:decoration-[#d4ff3a] decoration-2 underline-offset-4'
            : ' underline decoration-gray-300 dark:decoration-white/25 decoration-2 underline-offset-4';
      }
      span.className = className;
    }

    const total = phrase.length;
    const pct = total === 0 ? 0 : Math.round((frontier / total) * 100);
    bar.style.width = `${pct}%`;
    track.setAttribute('aria-valuenow', String(frontier));
    count.textContent = t.disarmProgress(frontier, total);

    const nextDisabled = !complete;
    if (confirmBtn.disabled !== nextDisabled) confirmBtn.disabled = nextDisabled;
    const nextClass = complete ? readyButtonClass() : waitButtonClass();
    if (confirmBtn.className !== nextClass) confirmBtn.className = nextClass;
    if (!complete && holdStartedAt !== null) {
      holdStartedAt = null;
      if (holdRaf !== null) {
        window.cancelAnimationFrame(holdRaf);
        holdRaf = null;
      }
      fill.style.width = '0%';
    }
    if (holdStartedAt === null) confirmLabel.textContent = complete ? t.disarmHold(holdSeconds) : t.disarmWait;

    if (now < typoUntil) setStatus(t.disarmTypo(DISARM_TYPO_REWIND), 'warn');
    else if (now < pasteUntil) setStatus(t.disarmPasteBlocked, 'warn');
    else if (complete) setStatus(t.disarmReady, 'good');
    else if (matched < frontier) setStatus(t.disarmTypeAlong, 'muted');
    else setStatus(t.disarmUnlocking, 'muted');
  }

  function setStatus(text: string, tone: 'muted' | 'warn' | 'good'): void {
    status.textContent = text;
    status.className =
      tone === 'warn'
        ? 'text-[11px] min-h-[16px] text-amber-600 dark:text-amber-400 -mt-1'
        : tone === 'good'
          ? 'text-[11px] min-h-[16px] text-[#4d7c0f] dark:text-[#d4ff3a] -mt-1'
          : 'text-[11px] min-h-[16px] text-gray-400 dark:text-gray-500 -mt-1';
  }

  function cancelHold(): void {
    const wasHolding = holdStartedAt !== null;
    holdStartedAt = null;
    if (holdRaf !== null) {
      window.cancelAnimationFrame(holdRaf);
      holdRaf = null;
    }
    if (!active()) return;
    fill.style.width = '0%';
    if (wasHolding) paint();
  }

  function succeed(): void {
    if (confirmed || !active()) return;
    confirmed = true;
    holdStartedAt = null;
    deps.onConfirm();
  }

  function holdFrame(): void {
    holdRaf = null;
    if (!active() || holdStartedAt === null || !session) return;
    const elapsed = Date.now() - holdStartedAt;
    const ratio = Math.min(1, elapsed / DISARM_HOLD_MS);
    fill.style.width = `${ratio * 100}%`;
    confirmLabel.textContent = t.disarmHolding;
    if (ratio >= 1) {
      holdStartedAt = null;
      succeed();
      return;
    }
    holdRaf = window.requestAnimationFrame(holdFrame);
  }

  function startHold(): void {
    if (!active() || !session || confirmBtn.disabled || holdStartedAt !== null) return;
    if (!disarmIsComplete(session, input.value, Date.now())) return;
    holdStartedAt = Date.now();
    holdRaf = window.requestAnimationFrame(holdFrame);
  }

  function onTypo(): void {
    if (!session || !active()) return;
    const now = Date.now();
    if (now - lastTypoAt >= TYPO_DEBOUNCE_MS) {
      lastTypoAt = now;
      session = disarmApplyRewind(session);
      typoUntil = now + 1400;
    }
    setTyped(disarmClampTyped(session, input.value, now));
    cancelHold();
    paint();
  }

  function showPaste(): void {
    pasteUntil = Date.now() + 1600;
    paint();
  }

  input.addEventListener('paste', (event) => {
    event.preventDefault();
    showPaste();
  });
  input.addEventListener('drop', (event) => {
    event.preventDefault();
    showPaste();
  });
  input.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
      event.preventDefault();
      showPaste();
    }
  });
  input.addEventListener('beforeinput', (event) => {
    if (!session || !active()) return;
    const type = event.inputType;
    if (
      type === 'insertFromPaste' ||
      type === 'insertFromDrop' ||
      type === 'insertFromYank' ||
      type === 'insertReplacementText' ||
      type === 'insertFromPasteAsQuotation'
    ) {
      event.preventDefault();
      showPaste();
      return;
    }
    if (type.startsWith('delete')) {
      const end = input.selectionEnd ?? 0;
      if (end !== input.value.length) {
        event.preventDefault();
        input.setSelectionRange(input.value.length, input.value.length);
      }
      return;
    }
    if (type !== 'insertText') return;

    const data = event.data ?? '';
    const frontier = disarmFrontier(session, Date.now());
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    if (start !== input.value.length || end !== input.value.length) {
      event.preventDefault();
      input.setSelectionRange(input.value.length, input.value.length);
      return;
    }
    if (data.length === 0 || input.value.length >= frontier || data.length > frontier - input.value.length) {
      event.preventDefault();
      return;
    }
    const expected = session.phrase.slice(input.value.length, input.value.length + data.length);
    if (data !== expected) {
      event.preventDefault();
      onTypo();
    }
  });
  input.addEventListener('input', () => {
    if (!session || !active()) return;
    const mismatched = disarmMatchedPrefix(session.phrase, input.value) < input.value.length;
    if (mismatched) {
      onTypo();
      return;
    }
    setTyped(disarmClampTyped(session, input.value, Date.now()));
    paint();
  });

  confirmBtn.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || confirmBtn.disabled) return;
    try {
      confirmBtn.setPointerCapture(event.pointerId);
    } catch {
      // Bez przechwycenia przycisk i tak kończy gest, dopóki kursor na nim zostaje.
    }
    event.preventDefault();
    startHold();
  });
  confirmBtn.addEventListener('pointerup', () => cancelHold());
  confirmBtn.addEventListener('pointercancel', () => cancelHold());
  confirmBtn.addEventListener('pointerleave', (event) => {
    if (!confirmBtn.hasPointerCapture(event.pointerId)) cancelHold();
  });
  confirmBtn.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (event.repeat) return;
    startHold();
  });
  confirmBtn.addEventListener('keyup', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    cancelHold();
  });

  paint();
  tickId = window.setInterval(() => {
    if (!active()) return;
    paint();
  }, 100);
  input.focus();
}

function waitButtonClass(): string {
  return `relative overflow-hidden w-full h-10 rounded-lg text-[12.5px] font-semibold select-none touch-none bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 cursor-not-allowed ${FOCUS_RING}`;
}

function readyButtonClass(): string {
  return `relative overflow-hidden w-full h-10 rounded-lg text-[12.5px] font-semibold select-none touch-none bg-[#4d7c0f] dark:bg-[#d4ff3a] text-white dark:text-[#0f0f11] cursor-pointer ${FOCUS_RING}`;
}
