// Elementy, które content script wstrzykuje w stronę: okno z kodem do
// przepisania, pełnoekranowe zasłony, pigułki z odliczaniem i toasty.
// Wszystko budowane przez createElement, bez innerHTML.
import { BRAND } from './brand';

export const UI = {
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  ink: BRAND.colors.ink,
  surface: BRAND.colors.surface,
  soft: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.12)',
  accent: BRAND.colors.volt,
  onAccent: BRAND.colors.ink,
  warn: BRAND.colors.ember,
  muted: 'rgba(255,255,255,0.62)',
  faint: 'rgba(255,255,255,0.4)',
} as const;

/**
 * Znacznik na korzeniu każdego naszego elementu. Obserwator mutacji w content
 * scripcie pomija zmiany wewnątrz takich korzeni - inaczej odliczanie na
 * pigułce budziłoby co sekundę pełny skan strony.
 */
export const OWN_UI_ATTR = 'data-unhook-ui';

const SVG_NS = 'http://www.w3.org/2000/svg';

type GlyphShape = { tag: 'path' | 'rect' | 'circle' | 'line'; attrs: Record<string, string> };

const GLYPHS = {
  lock: [
    { tag: 'rect', attrs: { x: '3', y: '11', width: '18', height: '11', rx: '2' } },
    { tag: 'path', attrs: { d: 'M7 11V7a5 5 0 0 1 10 0v4' } },
  ],
  hourglass: [
    { tag: 'path', attrs: { d: 'M5 22h14' } },
    { tag: 'path', attrs: { d: 'M5 2h14' } },
    { tag: 'path', attrs: { d: 'M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22' } },
    { tag: 'path', attrs: { d: 'M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2' } },
  ],
  timer: [
    { tag: 'line', attrs: { x1: '10', y1: '2', x2: '14', y2: '2' } },
    { tag: 'line', attrs: { x1: '12', y1: '14', x2: '15', y2: '11' } },
    { tag: 'circle', attrs: { cx: '12', cy: '14', r: '8' } },
  ],
  moon: [{ tag: 'path', attrs: { d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' } }],
} as const satisfies Record<string, readonly GlyphShape[]>;

export type GlyphName = keyof typeof GLYPHS;

export function buildGlyph(name: GlyphName, size = 22): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  for (const shape of GLYPHS[name]) {
    const el = document.createElementNS(SVG_NS, shape.tag);
    for (const [key, value] of Object.entries(shape.attrs)) el.setAttribute(key, value);
    svg.appendChild(el);
  }
  return svg;
}

/** Znaki bez par łatwych do pomylenia (0/O, 1/l/I). */
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';

export function randomCode(length: number): string {
  let code = '';
  for (let index = 0; index < length; index += 1) {
    code += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
  }
  return code;
}

/** Ile początkowych znaków `typed` zgadza się z `code`. */
export function matchedPrefixLength(code: string, typed: string): number {
  const limit = Math.min(code.length, typed.length);
  let index = 0;
  while (index < limit && code[index] === typed[index]) index += 1;
  return index;
}

function mountPoint(): HTMLElement {
  return document.body || document.documentElement;
}

function badge(glyph: GlyphName, size: number): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText =
    `width:${size}px;height:${size}px;border-radius:50%;background:${UI.accent};color:${UI.onAccent};` +
    'display:flex;align-items:center;justify-content:center;flex-shrink:0;' +
    'box-shadow:0 0 0 7px rgba(212,255,58,0.12);';
  el.appendChild(buildGlyph(glyph, Math.round(size * 0.46)));
  return el;
}

function stylePrimary(btn: HTMLButtonElement, enabled: boolean): void {
  btn.disabled = !enabled;
  btn.style.cssText =
    `width:100%;padding:13px 18px;border-radius:10px;font-family:${UI.font};font-size:15px;` +
    'font-weight:700;border:none;transition:filter .15s,background-color .2s,color .2s;' +
    (enabled
      ? `background:${UI.accent};color:${UI.onAccent};cursor:pointer;`
      : 'background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.32);cursor:not-allowed;');
}

function primaryButton(label: string, enabled = true): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  stylePrimary(btn, enabled);
  btn.onmouseover = () => {
    if (!btn.disabled) btn.style.filter = 'brightness(1.08)';
  };
  btn.onmouseout = () => {
    btn.style.filter = 'none';
  };
  return btn;
}

function ghostButton(label: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.style.cssText =
    'width:100%;padding:11px 12px;margin-top:8px;border-radius:10px;background:none;border:none;' +
    `color:${UI.muted};font-family:${UI.font};font-size:14px;font-weight:600;cursor:pointer;transition:color .15s;`;
  btn.onmouseover = () => {
    btn.style.color = '#fff';
  };
  btn.onmouseout = () => {
    btn.style.color = UI.muted;
  };
  return btn;
}

// --- Toast ---

const toastTimers = new Map<string, number>();

export function showPageToast(id: string, message: string): void {
  let toast = document.getElementById(id);
  if (!toast) {
    toast = document.createElement('div');
    toast.id = id;
    toast.setAttribute(OWN_UI_ATTR, '1');
    toast.style.cssText =
      'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
      `background:${UI.surface};color:#fff;border:1px solid ${UI.border};border-radius:10px;` +
      `padding:11px 18px;font-size:14px;font-weight:600;font-family:${UI.font};` +
      'box-shadow:0 8px 28px rgba(0,0,0,0.5);';
    mountPoint().appendChild(toast);
  }
  toast.textContent = message;
  const previous = toastTimers.get(id);
  if (previous) window.clearTimeout(previous);
  toastTimers.set(
    id,
    window.setTimeout(() => {
      toastTimers.delete(id);
      document.getElementById(id)?.remove();
    }, 3500)
  );
}

export function removePageToast(id: string): void {
  const timer = toastTimers.get(id);
  if (timer) window.clearTimeout(timer);
  toastTimers.delete(id);
  document.getElementById(id)?.remove();
}

// --- Pigułka z odliczaniem ---

export type PillOptions = {
  id: string;
  top: number;
  text: string;
  buttonLabel: string;
  onButton: () => void;
};

/** Tworzy pigułkę albo aktualizuje istniejącą. Zapisuje tylko to, co się zmieniło. */
export function renderPill(options: PillOptions): void {
  let pill = document.getElementById(options.id);
  if (!pill) {
    pill = document.createElement('div');
    pill.id = options.id;
    pill.setAttribute(OWN_UI_ATTR, '1');
    pill.style.cssText =
      `position:fixed;top:${options.top}px;right:20px;z-index:2147483640;` +
      `background:${UI.surface};border:1px solid ${UI.border};border-radius:999px;` +
      'padding:7px 8px 7px 14px;box-shadow:0 6px 20px rgba(0,0,0,0.4);' +
      `display:flex;align-items:center;gap:10px;font-family:${UI.font};font-size:13px;color:#fff;`;

    const label = document.createElement('span');
    label.setAttribute('data-unhook-pill-label', '1');
    label.style.cssText = `color:${UI.accent};font-weight:600;font-variant-numeric:tabular-nums;`;

    const button = document.createElement('button');
    button.type = 'button';
    button.style.cssText =
      `background:${UI.soft};border:1px solid ${UI.border};color:#fff;font-family:${UI.font};` +
      'font-size:12px;font-weight:600;padding:5px 12px;border-radius:999px;cursor:pointer;';

    pill.appendChild(label);
    pill.appendChild(button);
    mountPoint().appendChild(pill);
  }

  const label = pill.querySelector<HTMLElement>('[data-unhook-pill-label]');
  if (label && label.textContent !== options.text) label.textContent = options.text;

  const button = pill.querySelector('button');
  if (button) {
    if (button.textContent !== options.buttonLabel) button.textContent = options.buttonLabel;
    button.onclick = (event) => {
      event.preventDefault();
      options.onButton();
    };
  }
}

// --- Okno z kodem do przepisania ---

export type CodeChallengeOptions = {
  id: string;
  length: number;
  title: string;
  subtitle: string;
  confirmLabel: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onSuccess: () => void;
  strings: {
    codeLabel: string;
    codeNew: string;
    placeholder: string;
    pasteBlocked: string;
    mismatch: string;
    count: (current: number, target: number) => string;
    close: string;
  };
};

export function closeCodeChallenge(id: string): void {
  const el = document.getElementById(id) as (HTMLElement & { unhookClose?: () => void }) | null;
  if (el?.unhookClose) el.unhookClose();
  else el?.remove();
}

/**
 * Kod trzeba przepisać DOKŁADNIE. Poprzednia wersja sprawdzała tylko długość
 * i liczbę różnych znaków, więc "abcdabcdabcd..." otwierało blokadę bez
 * patrzenia na kod.
 */
export function openCodeChallenge(options: CodeChallengeOptions): void {
  const existing = document.getElementById(options.id);
  if (existing) {
    existing.querySelector('input')?.focus();
    return;
  }

  const { strings } = options;
  let code = randomCode(options.length);

  const backdrop = document.createElement('div') as HTMLDivElement & { unhookClose?: () => void };
  backdrop.id = options.id;
  backdrop.setAttribute(OWN_UI_ATTR, '1');
  backdrop.style.cssText =
    'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,0.76);' +
    'backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;' +
    `font-family:${UI.font};color:#fff;`;

  const card = document.createElement('div');
  card.style.cssText =
    `background:${UI.surface};border:1px solid ${UI.border};border-radius:16px;padding:28px;` +
    'max-width:440px;width:100%;max-height:calc(100vh - 40px);overflow-y:auto;' +
    'box-shadow:0 16px 48px rgba(0,0,0,0.6);display:flex;flex-direction:column;gap:0;' +
    'position:relative;animation:unhookFadeIn 0.18s ease-out;box-sizing:border-box;';

  const onEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
  };
  const close = () => {
    backdrop.remove();
    window.removeEventListener('keydown', onEscape, true);
  };
  backdrop.unhookClose = close;
  // Faza przechwycenia: strona łapie Escape we własnych handlerach
  // i bez tego okno zostawało otwarte.
  window.addEventListener('keydown', onEscape, true);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  // Litery wpisywane w pole nie mogą dojść do skrótów klawiszowych strony.
  for (const type of ['keydown', 'keyup', 'keypress'] as const) {
    backdrop.addEventListener(type, (event) => event.stopPropagation());
  }

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', strings.close);
  closeBtn.textContent = '✕';
  closeBtn.style.cssText =
    `position:absolute;top:16px;right:16px;background:none;border:none;color:${UI.faint};` +
    `font-size:16px;line-height:1;cursor:pointer;padding:6px;border-radius:6px;font-family:${UI.font};`;
  closeBtn.onclick = close;

  const lockBadge = badge('lock', 52);
  lockBadge.style.margin = '0 auto 16px auto';

  const titleEl = document.createElement('h2');
  titleEl.style.cssText =
    `margin:0 0 6px 0;font-family:${UI.font};font-size:22px;font-weight:700;` +
    'line-height:1.25;color:#fff;text-align:center;letter-spacing:-0.02em;';
  titleEl.textContent = options.title;

  const subtitleEl = document.createElement('p');
  subtitleEl.style.cssText = `margin:0 0 20px 0;font-size:14px;line-height:1.45;color:${UI.muted};text-align:center;`;
  subtitleEl.textContent = options.subtitle;

  const codeBox = document.createElement('div');
  codeBox.style.cssText =
    `background:${UI.soft};border-radius:10px;padding:14px 16px;margin-bottom:12px;` +
    'display:flex;flex-direction:column;gap:10px;';

  const codeLabelRow = document.createElement('div');
  codeLabelRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;';

  const codeLabel = document.createElement('span');
  codeLabel.style.cssText = `font-size:11px;font-weight:600;color:${UI.faint};text-transform:uppercase;letter-spacing:0.08em;`;
  codeLabel.textContent = strings.codeLabel;

  const refreshBtn = document.createElement('button');
  refreshBtn.type = 'button';
  refreshBtn.textContent = strings.codeNew;
  refreshBtn.style.cssText =
    `background:none;border:none;color:${UI.accent};font-family:${UI.font};font-size:12px;` +
    'font-weight:600;cursor:pointer;padding:2px 4px;';

  codeLabelRow.appendChild(codeLabel);
  codeLabelRow.appendChild(refreshBtn);

  // Kod w blokach po 5 znaków: zawija się między blokami, nigdy w środku.
  const codeDisplay = document.createElement('div');
  codeDisplay.style.cssText =
    'display:flex;flex-wrap:wrap;justify-content:center;gap:8px 16px;user-select:none;max-width:300px;margin:0 auto;';
  codeDisplay.addEventListener('copy', (event) => event.preventDefault());

  let codeChars: HTMLSpanElement[] = [];
  const renderCode = () => {
    while (codeDisplay.firstChild) codeDisplay.removeChild(codeDisplay.firstChild);
    codeChars = [];
    for (let start = 0; start < code.length; start += 5) {
      const chunk = document.createElement('span');
      chunk.style.cssText =
        `font-family:${UI.mono};font-size:16px;font-weight:600;letter-spacing:0.1em;white-space:nowrap;`;
      for (const char of code.slice(start, start + 5)) {
        const span = document.createElement('span');
        span.textContent = char;
        chunk.appendChild(span);
        codeChars.push(span);
      }
      codeDisplay.appendChild(chunk);
    }
  };

  codeBox.appendChild(codeLabelRow);
  codeBox.appendChild(codeDisplay);

  const notice = document.createElement('div');
  notice.style.cssText =
    'visibility:hidden;min-height:18px;margin-bottom:8px;font-size:12.5px;font-weight:600;' +
    `text-align:center;color:${UI.warn};`;

  let pasteNoticeUntil = 0;
  let pasteTimer: number | null = null;
  const showPasteNotice = () => {
    pasteNoticeUntil = Date.now() + 3000;
    if (pasteTimer) window.clearTimeout(pasteTimer);
    pasteTimer = window.setTimeout(paint, 3050);
    paint();
  };

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = strings.placeholder;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.maxLength = options.length;
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('autocapitalize', 'none');
  input.style.cssText =
    'width:100%;box-sizing:border-box;padding:13px 14px;border-radius:10px;' +
    `background:${UI.soft};border:1px solid transparent;color:#fff;font-size:14px;` +
    `font-family:${UI.mono};letter-spacing:0.06em;outline:none;transition:border-color .15s;`;
  input.onfocus = () => {
    input.style.borderColor = UI.accent;
  };
  input.onblur = () => {
    input.style.borderColor = 'transparent';
  };
  input.addEventListener('paste', (event) => {
    event.preventDefault();
    showPasteNotice();
  });
  input.addEventListener('drop', (event) => {
    event.preventDefault();
    showPasteNotice();
  });
  input.addEventListener('beforeinput', (event) => {
    if (event.inputType === 'insertFromPaste' || event.inputType === 'insertFromDrop') {
      event.preventDefault();
      showPasteNotice();
    }
  });

  const progressRow = document.createElement('div');
  progressRow.style.cssText = 'display:flex;align-items:center;gap:12px;margin:12px 0 18px 0;';

  const track = document.createElement('div');
  track.style.cssText = 'flex:1;height:3px;background:rgba(255,255,255,0.12);border-radius:999px;overflow:hidden;';
  const fill = document.createElement('div');
  fill.style.cssText = `height:100%;width:0%;background:${UI.accent};border-radius:999px;transition:width .15s ease;`;
  track.appendChild(fill);

  const countEl = document.createElement('span');
  countEl.style.cssText =
    `font-size:12.5px;font-weight:600;color:${UI.faint};font-variant-numeric:tabular-nums;white-space:nowrap;`;

  progressRow.appendChild(track);
  progressRow.appendChild(countEl);

  const confirmBtn = primaryButton(options.confirmLabel, false);

  function paint(): void {
    const typed = input.value;
    const matched = matchedPrefixLength(code, typed);
    const mismatch = typed.length > matched;
    const complete = typed === code;

    codeChars.forEach((span, index) => {
      const color = index < matched ? UI.accent : mismatch && index === matched ? UI.warn : '#fff';
      if (span.style.color !== color) span.style.color = color;
      const underline = mismatch && index === matched ? 'underline' : 'none';
      if (span.style.textDecoration !== underline) span.style.textDecoration = underline;
    });

    fill.style.width = `${Math.round((matched / code.length) * 100)}%`;
    countEl.textContent = strings.count(matched, code.length);
    countEl.style.color = complete ? UI.accent : UI.faint;
    stylePrimary(confirmBtn, complete);

    const pasteActive = Date.now() < pasteNoticeUntil;
    const message = pasteActive ? strings.pasteBlocked : mismatch ? strings.mismatch : '';
    notice.textContent = message;
    notice.style.visibility = message ? 'visible' : 'hidden';
  }

  const succeed = () => {
    if (input.value !== code) return;
    close();
    options.onSuccess();
  };

  refreshBtn.onclick = () => {
    code = randomCode(options.length);
    input.value = '';
    renderCode();
    paint();
    input.focus();
  };
  input.addEventListener('input', paint);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      succeed();
    }
  });
  confirmBtn.onclick = succeed;

  card.appendChild(closeBtn);
  card.appendChild(lockBadge);
  card.appendChild(titleEl);
  card.appendChild(subtitleEl);
  card.appendChild(codeBox);
  card.appendChild(notice);
  card.appendChild(input);
  card.appendChild(progressRow);
  card.appendChild(confirmBtn);

  if (options.secondaryLabel) {
    const secondary = ghostButton(options.secondaryLabel);
    secondary.onclick = () => {
      close();
      options.onSecondary?.();
    };
    card.appendChild(secondary);
  }

  backdrop.appendChild(card);
  renderCode();
  paint();
  mountPoint().appendChild(backdrop);
  window.setTimeout(() => input.focus(), 60);
}

// --- Pełnoekranowa zasłona ---

export type BlockScreenOptions = {
  id: string;
  glyph: GlyphName;
  title: string;
  text: string;
  /** Duża liczba nad tytułem (odliczanie przy pauzie na wejściu). */
  bigNumber?: string;
  primary?: { label: string; enabled: boolean; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
  /** Zostawia odsłonięty pasek o tej wysokości u góry (nagłówek strony). */
  top?: number;
  /**
   * Pełna zasłona: zatrzymuje filmy pod spodem i nie przepuszcza do strony
   * klawiszy ani kółka myszy, żeby feed nie przewijał się za zasłoną.
   */
  shield?: boolean;
};

export type BlockScreen = {
  setBigNumber: (value: string) => void;
  setText: (value: string) => void;
  setPrimary: (label: string, enabled: boolean) => void;
  remove: () => void;
};

const SHIELD_KEYS = new Set([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End']);

export function mountBlockScreen(options: BlockScreenOptions): BlockScreen {
  document.getElementById(options.id)?.remove();

  const root = document.createElement('div');
  root.id = options.id;
  root.setAttribute(OWN_UI_ATTR, '1');
  root.style.cssText =
    `position:fixed;top:${options.top ?? 0}px;left:0;right:0;bottom:0;` +
    `z-index:${options.shield ? 2147483646 : 999999};` +
    `background:${options.shield ? UI.ink : 'rgba(14,15,19,0.97)'};` +
    'display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;' +
    `font-family:${UI.font};color:#fff;`;

  const card = document.createElement('div');
  card.style.cssText =
    'max-width:420px;width:100%;text-align:center;display:flex;flex-direction:column;align-items:center;gap:0;';

  const mark = badge(options.glyph, 60);
  mark.style.marginBottom = '20px';

  const bigNumber = document.createElement('div');
  bigNumber.style.cssText =
    `display:${options.bigNumber === undefined ? 'none' : 'block'};font-size:72px;line-height:1;font-weight:800;` +
    `letter-spacing:-0.04em;color:${UI.accent};font-variant-numeric:tabular-nums;margin-bottom:14px;`;
  bigNumber.textContent = options.bigNumber ?? '';

  const titleEl = document.createElement('h2');
  titleEl.style.cssText =
    `margin:0 0 10px 0;font-family:${UI.font};font-size:30px;line-height:1.15;font-weight:800;` +
    'color:#fff;letter-spacing:-0.025em;';
  titleEl.textContent = options.title;

  const textEl = document.createElement('p');
  textEl.style.cssText = `margin:0 0 26px 0;font-size:16px;color:${UI.muted};line-height:1.5;`;
  textEl.textContent = options.text;

  card.appendChild(mark);
  card.appendChild(bigNumber);
  card.appendChild(titleEl);
  card.appendChild(textEl);

  let primaryBtn: HTMLButtonElement | null = null;
  if (options.primary) {
    const { onClick } = options.primary;
    primaryBtn = primaryButton(options.primary.label, options.primary.enabled);
    primaryBtn.onclick = () => {
      if (!primaryBtn?.disabled) onClick();
    };
    card.appendChild(primaryBtn);
  }
  if (options.secondary) {
    const secondary = ghostButton(options.secondary.label);
    secondary.onclick = options.secondary.onClick;
    card.appendChild(secondary);
  }

  const brand = document.createElement('div');
  brand.style.cssText = `margin-top:26px;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${UI.faint};`;
  brand.textContent = BRAND.name;
  card.appendChild(brand);

  root.appendChild(card);

  let shieldTimer: number | null = null;
  const mutedByUs = new Set<HTMLMediaElement>();
  const quietMedia = () => {
    document.querySelectorAll<HTMLMediaElement>('video, audio').forEach((media) => {
      if (!media.paused) media.pause();
      if (!media.muted) {
        media.muted = true;
        mutedByUs.add(media);
      }
    });
  };
  const swallowKey = (event: KeyboardEvent) => {
    const target = event.target;
    if (target instanceof Element && target.closest(`[${OWN_UI_ATTR}]`)) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (/^F\d+$/.test(event.key) || event.key === 'Tab') return;
    event.stopImmediatePropagation();
    if (SHIELD_KEYS.has(event.key)) event.preventDefault();
  };
  const swallowScroll = (event: Event) => event.stopPropagation();

  if (options.shield) {
    quietMedia();
    shieldTimer = window.setInterval(quietMedia, 400);
    window.addEventListener('keydown', swallowKey, true);
    window.addEventListener('keyup', swallowKey, true);
    root.addEventListener('wheel', swallowScroll);
    root.addEventListener('touchmove', swallowScroll);
    // Przed <body> nie ma jeszcze gdzie wpiąć zasłony, a ma zakryć stronę
    // od pierwszej klatki - dlatego trafia bezpośrednio do <html>.
    document.documentElement.appendChild(root);
  } else {
    mountPoint().appendChild(root);
  }

  return {
    setBigNumber: (value) => {
      if (bigNumber.textContent !== value) bigNumber.textContent = value;
    },
    setText: (value) => {
      if (textEl.textContent !== value) textEl.textContent = value;
    },
    setPrimary: (label, enabled) => {
      if (!primaryBtn) return;
      if (primaryBtn.textContent !== label) primaryBtn.textContent = label;
      if (primaryBtn.disabled === enabled) stylePrimary(primaryBtn, enabled);
    },
    remove: () => {
      if (shieldTimer !== null) window.clearInterval(shieldTimer);
      window.removeEventListener('keydown', swallowKey, true);
      window.removeEventListener('keyup', swallowKey, true);
      mutedByUs.forEach((media) => {
        media.muted = false;
      });
      mutedByUs.clear();
      root.remove();
    },
  };
}
