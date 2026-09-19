import './style.css';
import { getSettings, saveSettings, TikTokUnhookSettings, DEFAULT_SETTINGS } from '@/utils/storage';
import { getT, Language } from '@/utils/i18n';

// --- SVG ICON HELPERS (Zero innerHTML, 100% safe DOM creation) ---
type SvgShape = {
  tag?: 'path' | 'line' | 'circle' | 'rect' | 'polygon' | 'polyline';
  d?: string;
  x1?: string;
  y1?: string;
  x2?: string;
  y2?: string;
  cx?: string;
  cy?: string;
  r?: string;
  x?: string;
  y?: string;
  width?: string;
  height?: string;
  rx?: string;
  points?: string;
  stroke?: string;
  fill?: string;
  strokeWidth?: string;
  strokeLinecap?: string;
  transform?: string;
};

function createSvg(shapes: SvgShape[], size = 15, strokeWidth = 2, viewBox = '0 0 24 24'): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', String(strokeWidth));
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  for (const s of shapes) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', s.tag || 'path');
    if (s.d) el.setAttribute('d', s.d);
    if (s.x1) el.setAttribute('x1', s.x1);
    if (s.y1) el.setAttribute('y1', s.y1);
    if (s.x2) el.setAttribute('x2', s.x2);
    if (s.y2) el.setAttribute('y2', s.y2);
    if (s.cx) el.setAttribute('cx', s.cx);
    if (s.cy) el.setAttribute('cy', s.cy);
    if (s.r) el.setAttribute('r', s.r);
    if (s.x) el.setAttribute('x', s.x);
    if (s.y) el.setAttribute('y', s.y);
    if (s.width) el.setAttribute('width', s.width);
    if (s.height) el.setAttribute('height', s.height);
    if (s.rx) el.setAttribute('rx', s.rx);
    if (s.points) el.setAttribute('points', s.points);
    if (s.stroke) el.setAttribute('stroke', s.stroke);
    if (s.fill) el.setAttribute('fill', s.fill);
    if (s.strokeWidth) el.setAttribute('stroke-width', s.strokeWidth);
    if (s.strokeLinecap) el.setAttribute('stroke-linecap', s.strokeLinecap);
    if (s.transform) el.setAttribute('transform', s.transform);
    svg.appendChild(el);
  }
  return svg;
}

function getAppLogo(): SVGSVGElement {
  const shapes: SvgShape[] = [
    {
      tag: 'path',
      d: 'M72 34 V74 A16 16 0 1 1 56 58 A16 16 0 0 1 62 59.2 V47 A30 30 0 0 0 86 54 V40 A18 18 0 0 1 72 34 Z',
      fill: '#FE2C55',
      stroke: 'none',
      transform: 'translate(2, 2)',
    },
    {
      tag: 'path',
      d: 'M72 34 V74 A16 16 0 1 1 56 58 A16 16 0 0 1 62 59.2 V47 A30 30 0 0 0 86 54 V40 A18 18 0 0 1 72 34 Z',
      fill: '#25F4EE',
      stroke: 'none',
      transform: 'translate(-2, -2)',
    },
    {
      tag: 'path',
      d: 'M72 34 V74 A16 16 0 1 1 56 58 A16 16 0 0 1 62 59.2 V47 A30 30 0 0 0 86 54 V40 A18 18 0 0 1 72 34 Z',
      fill: '#FFFFFF',
      stroke: 'none',
    },
    {
      tag: 'line',
      x1: '30',
      y1: '98',
      x2: '98',
      y2: '30',
      stroke: '#FE2C55',
      strokeWidth: '10',
      strokeLinecap: 'round',
    },
  ];
  return createSvg(shapes, 20, 2, '0 0 128 128');
}

const icons = {
  power: (active: boolean) =>
    createSvg(
      [
        { tag: 'path', d: 'M18.36 6.64a9 9 0 1 1-12.73 0' },
        { tag: 'line', x1: '12', y1: '2', x2: '12', y2: '12' },
      ],
      16,
      active ? 2.5 : 1.75
    ),
  sun: () =>
    createSvg(
      [
        { tag: 'circle', cx: '12', cy: '12', r: '4' },
        { tag: 'path', d: 'M12 2v2' },
        { tag: 'path', d: 'M12 20v2' },
        { tag: 'path', d: 'm4.93 4.93 1.41 1.41' },
        { tag: 'path', d: 'm17.66 17.66 1.41 1.41' },
        { tag: 'path', d: 'M2 12h2' },
        { tag: 'path', d: 'M20 12h2' },
        { tag: 'path', d: 'm6.34 17.66-1.41 1.41' },
        { tag: 'path', d: 'm19.07 4.93-1.41 1.41' },
      ],
      14
    ),
  moon: () => createSvg([{ tag: 'path', d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' }], 15),
  languages: () =>
    createSvg(
      [
        { tag: 'path', d: 'm5 8 6 6' },
        { tag: 'path', d: 'm4 14 6-6 2-3' },
        { tag: 'path', d: 'M2 5h12' },
        { tag: 'path', d: 'M7 2h1' },
        { tag: 'path', d: 'm22 22-5-10-5 10' },
        { tag: 'path', d: 'M14 18h6' },
      ],
      13
    ),
  sparkles: () =>
    createSvg(
      [
        {
          tag: 'path',
          d: 'm12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z',
        },
      ],
      14
    ),
  shieldCheck: () =>
    createSvg(
      [
        { tag: 'path', d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' },
        { tag: 'path', d: 'm9 12 2 2 4-4' },
      ],
      14
    ),
  shieldOff: () =>
    createSvg(
      [
        { tag: 'path', d: 'M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18' },
        { tag: 'path', d: 'M4.73 4.73 4 5v7c0 6 8 10 8 10a20.3 20.3 0 0 0 5.62-4.38' },
        { tag: 'line', x1: '2', y1: '2', x2: '22', y2: '22' },
      ],
      14
    ),
  tv: () =>
    createSvg(
      [
        { tag: 'rect', x: '2', y: '7', width: '20', height: '15', rx: '2' },
        { tag: 'polyline', points: '17 2 12 7 7 2' },
      ],
      14
    ),
  userCircle: () =>
    createSvg(
      [
        { tag: 'circle', cx: '12', cy: '12', r: '10' },
        { tag: 'circle', cx: '12', cy: '10', r: '3' },
        { tag: 'path', d: 'M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662' },
      ],
      14
    ),
  users: () =>
    createSvg(
      [
        { tag: 'path', d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' },
        { tag: 'circle', cx: '9', cy: '7', r: '4' },
        { tag: 'path', d: 'M22 21v-2a4 4 0 0 0-3-3.87' },
        { tag: 'path', d: 'M16 3.13a4 4 0 0 1 0 7.75' },
      ],
      14
    ),
  usersOff: () =>
    createSvg(
      [
        { tag: 'path', d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' },
        { tag: 'circle', cx: '9', cy: '7', r: '4' },
        { tag: 'path', d: 'M22 21v-2a4 4 0 0 0-3-3.87' },
        { tag: 'line', x1: '2', y1: '2', x2: '22', y2: '22' },
      ],
      14
    ),
  userMinus: () =>
    createSvg(
      [
        { tag: 'path', d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' },
        { tag: 'circle', cx: '9', cy: '7', r: '4' },
        { tag: 'line', x1: '17', y1: '11', x2: '23', y2: '11' },
      ],
      14
    ),
  coins: () =>
    createSvg(
      [
        { tag: 'circle', cx: '8', cy: '8', r: '6' },
        { tag: 'path', d: 'M18.09 10.37A6 6 0 1 1 10.34 18' },
        { tag: 'path', d: 'M7 6h1v4' },
        { tag: 'path', d: 'm16.71 13.88.7.71-2.82 2.82' },
      ],
      14
    ),
  messageSquare: () =>
    createSvg(
      [{ tag: 'path', d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }],
      14
    ),
  heartOff: () =>
    createSvg(
      [
        { tag: 'line', x1: '2', y1: '2', x2: '22', y2: '22' },
        { tag: 'path', d: 'M16.5 16.5 12 21l-7-7c-1.5-1.45-2-3.2-2-5 0-.9.2-1.7.5-2.5' },
        {
          tag: 'path',
          d: 'M8.5 3.5C9.6 3.5 10.7 4 12 5c1.3-1 2.4-1.5 3.5-1.5 3 0 5.5 2.5 5.5 5.5 0 1.8-.7 3.5-2 5l-2.5 2.5',
        },
      ],
      14
    ),
  radio: () =>
    createSvg(
      [
        { tag: 'circle', cx: '12', cy: '12', r: '2' },
        { tag: 'path', d: 'M16.24 7.76a6 6 0 0 1 0 8.49' },
        { tag: 'path', d: 'M7.76 16.24a6 6 0 0 1 0-8.49' },
        { tag: 'path', d: 'M19.07 4.93a10 10 0 0 1 0 14.14' },
        { tag: 'path', d: 'M4.93 19.07a10 10 0 0 1 0-14.14' },
      ],
      14
    ),
  shoppingBag: () =>
    createSvg(
      [
        { tag: 'path', d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z' },
        { tag: 'path', d: 'M3 6h18' },
        { tag: 'path', d: 'M16 10a4 4 0 0 1-8 0' },
      ],
      14
    ),
  compass: () =>
    createSvg(
      [
        { tag: 'circle', cx: '12', cy: '12', r: '10' },
        { tag: 'polygon', points: '16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76' },
      ],
      14
    ),
  fileText: () =>
    createSvg(
      [
        { tag: 'path', d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' },
        { tag: 'path', d: 'M14 2v4a2 2 0 0 0 2 2h4' },
        { tag: 'path', d: 'M10 9H8' },
        { tag: 'path', d: 'M16 13H8' },
        { tag: 'path', d: 'M16 17H8' },
      ],
      14
    ),
  layoutGrid: () =>
    createSvg(
      [
        { tag: 'rect', x: '3', y: '3', width: '7', height: '7', rx: '1' },
        { tag: 'rect', x: '14', y: '3', width: '7', height: '7', rx: '1' },
        { tag: 'rect', x: '14', y: '14', width: '7', height: '7', rx: '1' },
        { tag: 'rect', x: '3', y: '14', width: '7', height: '7', rx: '1' },
      ],
      14
    ),
  flame: () =>
    createSvg(
      [
        {
          tag: 'path',
          d: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
        },
      ],
      14
    ),
  layoutList: () =>
    createSvg(
      [
        { tag: 'rect', x: '3', y: '14', width: '7', height: '7', rx: '1' },
        { tag: 'path', d: 'M14 4h7' },
        { tag: 'path', d: 'M14 9h7' },
        { tag: 'path', d: 'M14 15h7' },
        { tag: 'path', d: 'M14 20h7' },
        { tag: 'rect', x: '3', y: '3', width: '7', height: '7', rx: '1' },
      ],
      14
    ),
  brain: () =>
    createSvg(
      [
        {
          tag: 'path',
          d: 'M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z',
        },
        {
          tag: 'path',
          d: 'M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z',
        },
      ],
      14
    ),
  lock: () =>
    createSvg(
      [
        { tag: 'rect', x: '3', y: '11', width: '18', height: '11', rx: '2' },
        { tag: 'path', d: 'M7 11V7a5 5 0 0 1 10 0v4' },
      ],
      14
    ),
  chevronDown: (rotated = false) => {
    const svg = createSvg([{ tag: 'polyline', points: '6 9 12 15 18 9' }], 13, 2.2);
    svg.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
    svg.style.transform = rotated ? 'rotate(180deg)' : 'rotate(0deg)';
    return svg;
  },
  playCircle: () =>
    createSvg(
      [
        { tag: 'circle', cx: '12', cy: '12', r: '10' },
        { tag: 'polygon', points: '10 8 16 12 10 16 10 8', fill: 'currentColor', stroke: 'none' },
      ],
      14
    ),
  chevronsUpDown: () =>
    createSvg(
      [
        { tag: 'path', d: 'm7 15 5 5 5-5' },
        { tag: 'path', d: 'm7 9 5-5 5 5' },
      ],
      12
    ),
};

// --- APP STATE & UI CREATION ---
function getExtensionVersion(): string {
  try {
    const api: any =
      typeof browser !== 'undefined' && (browser as any)?.runtime
        ? browser
        : typeof chrome !== 'undefined'
          ? chrome
          : null;
    const version = api?.runtime?.getManifest?.()?.version;
    return version ? `v${version}` : '';
  } catch {
    return '';
  }
}

let currentSettings: TikTokUnhookSettings = DEFAULT_SETTINGS;
let savedScrollTop = 0;
let toastTimeout: number | null = null;

function showToast(msg: string) {
  let toast = document.getElementById('unhook-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'unhook-toast';
    toast.className =
      'absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-950/90 text-white text-[11px] px-3 py-1 rounded-full shadow-lg border border-gray-700/50 backdrop-blur-sm pointer-events-none transition-all z-30 opacity-0 transform translate-y-2';
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.classList.remove('opacity-0', 'translate-y-2');
  toast.classList.add('opacity-100', 'translate-y-0');

  if (toastTimeout) window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    if (toast) {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-2');
    }
  }, 2500);
}

function updateSettings(newSettings: Partial<TikTokUnhookSettings>) {
  currentSettings = { ...currentSettings, ...newSettings };
  saveSettings(currentSettings);
  render();
}

// --- FLOATING TOOLTIP HELPER ---
let floatingTooltipEl: HTMLElement | null = null;
let tooltipTimeout: number | null = null;

function getOrCreateFloatingTooltip(): HTMLElement {
  if (!floatingTooltipEl) {
    floatingTooltipEl = document.createElement('div');
    floatingTooltipEl.id = 'unhook-floating-tooltip';
    document.body.appendChild(floatingTooltipEl);
  }
  return floatingTooltipEl;
}

function showFloatingTooltip(target: HTMLElement, titleText: string, descText?: string) {
  if (tooltipTimeout) {
    window.clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }

  const el = getOrCreateFloatingTooltip();
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }

  if (titleText && descText && titleText !== descText) {
    const titleSpan = document.createElement('span');
    titleSpan.className = 'tooltip-title';
    titleSpan.textContent = titleText;
    el.appendChild(titleSpan);

    const descSpan = document.createElement('span');
    descSpan.className = 'tooltip-desc';
    descSpan.textContent = descText;
    el.appendChild(descSpan);
  } else {
    const textSpan = document.createElement('span');
    textSpan.className = 'tooltip-desc';
    textSpan.textContent = descText || titleText;
    el.appendChild(textSpan);
  }

  const rect = target.getBoundingClientRect();
  const tooltipWidth = 260;

  let left = rect.left + rect.width / 2 - tooltipWidth / 2;
  if (left < 10) left = 10;
  if (left + tooltipWidth > window.innerWidth - 10) {
    left = window.innerWidth - tooltipWidth - 10;
  }

  el.style.left = `${Math.round(left)}px`;

  const placeBelow = rect.top < 65;
  if (placeBelow) {
    el.style.top = `${Math.round(rect.bottom + 6)}px`;
  } else {
    el.style.top = `${Math.max(4, Math.round(rect.top - 50))}px`;
  }

  requestAnimationFrame(() => {
    if (!placeBelow) {
      el.style.top = `${Math.max(4, Math.round(rect.top - el.offsetHeight - 6))}px`;
    }
    el.classList.add('visible');
  });
}

function hideFloatingTooltip() {
  if (tooltipTimeout) {
    window.clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
  if (floatingTooltipEl) {
    floatingTooltipEl.classList.remove('visible');
  }
}

function attachTooltip(element: HTMLElement, titleText: string, descText?: string) {
  // Celowo bez atrybutu title - natywny dymek nakladal sie na wlasny tooltip.
  // aria-label tylko dla przyciskow bez widocznego tekstu, zeby nie nadpisac nazwy.
  if (!(element.textContent || '').trim()) {
    element.setAttribute('aria-label', descText || titleText);
  }
  element.addEventListener('mouseenter', () => {
    tooltipTimeout = window.setTimeout(() => {
      showFloatingTooltip(element, titleText, descText);
    }, 100);
  });
  element.addEventListener('mouseleave', () => {
    hideFloatingTooltip();
  });
}

window.addEventListener('scroll', hideFloatingTooltip, true);
document.addEventListener('click', hideFloatingTooltip);

// --- WSPOLNE KLASY ---
const ACCENT_TEXT = 'text-[#007aff] dark:text-[#25f4ee]';
const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]/60 dark:focus-visible:ring-[#25f4ee]/60 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#141416]';

function createSwitch(checked: boolean): HTMLElement {
  const track = document.createElement('span');
  track.className = `relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-out pointer-events-none ${
    checked ? 'bg-[#007aff] dark:bg-[#25f4ee]' : 'bg-gray-300 dark:bg-white/15'
  }`;

  const thumb = document.createElement('span');
  thumb.className = `pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-sm transition-transform duration-200 ease-out ${
    checked ? 'translate-x-4 bg-white dark:bg-[#0f0f11]' : 'translate-x-0 bg-white'
  }`;

  track.appendChild(thumb);
  return track;
}

/**
 * Wiersz przelacznika: ikona + tytul + switch.
 * Opis nie jest drukowany w menu - pokazuje sie w dymku po najechaniu,
 * zeby lista zostala krotka i czytelna.
 */
function createToggleRow(
  iconEl: SVGSVGElement,
  title: string,
  desc: string,
  checked: boolean,
  onToggle: () => void,
  disabled = false
): HTMLElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('role', 'switch');
  btn.setAttribute('aria-checked', checked ? 'true' : 'false');
  if (disabled) {
    btn.disabled = true;
    btn.setAttribute('aria-disabled', 'true');
  }

  btn.className = `w-full flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-lg text-left transition-colors ${FOCUS_RING} ${
    disabled
      ? 'opacity-40 cursor-not-allowed'
      : 'cursor-pointer hover:bg-gray-100/80 dark:hover:bg-white/[0.05] active:bg-gray-200/70 dark:active:bg-white/[0.08]'
  }`;

  if (!disabled) btn.onclick = onToggle;
  attachTooltip(btn, title, desc);

  const iconWrap = document.createElement('span');
  iconWrap.className = `flex items-center justify-center flex-shrink-0 w-4 h-4 transition-colors ${
    checked ? ACCENT_TEXT : 'text-gray-400 dark:text-gray-600'
  }`;
  iconWrap.appendChild(iconEl);

  const titleEl = document.createElement('span');
  titleEl.className = `flex-1 min-w-0 truncate text-[12.5px] font-medium leading-none ${
    checked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
  }`;
  titleEl.textContent = title;

  btn.appendChild(iconWrap);
  btn.appendChild(titleEl);
  btn.appendChild(createSwitch(checked));

  return btn;
}

// --- ACCORDION ---
const ALL_CLUSTER_IDS = ['feeds', 'content', 'following', 'ads'];
let openClusters: Set<string> = new Set(['feeds', 'following']);
try {
  const savedClusters = localStorage.getItem('unhook_open_clusters_v2');
  if (savedClusters) openClusters = new Set(JSON.parse(savedClusters));
} catch {
  /* noop */
}

function saveOpenClusters(set: Set<string>) {
  try {
    localStorage.setItem('unhook_open_clusters_v2', JSON.stringify(Array.from(set)));
  } catch {
    /* noop */
  }
}

function createAccordionCluster(
  id: string,
  iconEl: SVGSVGElement,
  title: string,
  activeCount: number,
  totalCount: number,
  children: HTMLElement[],
  isOpen: boolean,
  onToggle: () => void,
  t: ReturnType<typeof getT>
): HTMLElement {
  const section = document.createElement('section');
  section.className = 'border-b border-gray-100 dark:border-white/[0.06] last:border-b-0 py-0.5';

  const headerBtn = document.createElement('button');
  headerBtn.type = 'button';
  headerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  headerBtn.className = `w-full flex items-center justify-between gap-2 py-1.5 px-1.5 rounded-lg text-left transition-colors cursor-pointer select-none group ${FOCUS_RING} hover:bg-gray-100/70 dark:hover:bg-white/[0.04]`;
  headerBtn.onclick = onToggle;

  const left = document.createElement('span');
  left.className = 'flex items-center gap-2 min-w-0';

  const iconWrap = document.createElement('span');
  iconWrap.className = `flex items-center justify-center flex-shrink-0 transition-colors ${
    activeCount > 0 ? ACCENT_TEXT : 'text-gray-400 dark:text-gray-600'
  }`;
  iconWrap.appendChild(iconEl);

  const titleSpan = document.createElement('span');
  titleSpan.className =
    'text-[10.5px] font-bold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 truncate transition-colors';
  titleSpan.textContent = title;

  left.appendChild(iconWrap);
  left.appendChild(titleSpan);

  const right = document.createElement('span');
  right.className = 'flex items-center gap-1.5 flex-shrink-0';

  const badge = document.createElement('span');
  badge.className = `text-[9.5px] leading-none px-1.5 py-[3px] rounded-full font-semibold tabular-nums transition-colors ${
    activeCount > 0
      ? `bg-[#007aff]/10 dark:bg-[#25f4ee]/10 ${ACCENT_TEXT}`
      : 'bg-gray-100 text-gray-400 dark:bg-white/[0.06] dark:text-gray-500'
  }`;
  badge.textContent = `${activeCount}/${totalCount}`;
  badge.title = t.activeItemsCount(activeCount, totalCount);

  const chevron = icons.chevronDown(isOpen);
  chevron.classList.add(
    'text-gray-400',
    'group-hover:text-gray-600',
    'dark:group-hover:text-gray-300',
    'transition-colors',
    'flex-shrink-0'
  );

  right.appendChild(badge);
  right.appendChild(chevron);

  headerBtn.appendChild(left);
  headerBtn.appendChild(right);
  section.appendChild(headerBtn);

  if (isOpen) {
    const body = document.createElement('div');
    body.className = 'pb-1 space-y-0.5 unhook-reveal';
    children.forEach((child) => body.appendChild(child));
    section.appendChild(body);
  }

  return section;
}

/** Pelnej szerokosci wiersz licznika - dwa steppery obok siebie nie miescily sie w popupie. */
function createStepperRow(
  label: string,
  value: number,
  min: number,
  step: number | ((v: number) => number),
  apply: (next: number) => void
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'flex items-center justify-between gap-2 py-0.5';

  const lab = document.createElement('span');
  lab.className = 'text-[10.5px] text-gray-500 dark:text-gray-400 truncate';
  lab.textContent = label;

  const controls = document.createElement('div');
  controls.className = 'flex items-center gap-1 flex-shrink-0';

  const btnCls = `w-6 h-6 rounded-md bg-white dark:bg-white/[0.08] border border-gray-200 dark:border-white/[0.06] text-gray-600 dark:text-gray-300 text-[13px] leading-none flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/[0.14] active:scale-95 transition-all cursor-pointer ${FOCUS_RING}`;
  const stepFor = (v: number) => (typeof step === 'function' ? step(v) : step);

  const minus = document.createElement('button');
  minus.type = 'button';
  minus.textContent = '−';
  minus.setAttribute('aria-label', `${label} -`);
  minus.className = btnCls;
  minus.onclick = () => apply(Math.max(min, value - stepFor(value)));

  const valSpan = document.createElement('span');
  valSpan.className =
    'text-[11px] font-semibold text-gray-800 dark:text-gray-100 min-w-[46px] text-center tabular-nums';
  valSpan.textContent = value.toLocaleString();

  const plus = document.createElement('button');
  plus.type = 'button';
  plus.textContent = '+';
  plus.setAttribute('aria-label', `${label} +`);
  plus.className = btnCls;
  plus.onclick = () => apply(value + stepFor(value));

  controls.appendChild(minus);
  controls.appendChild(valSpan);
  controls.appendChild(plus);

  row.appendChild(lab);
  row.appendChild(controls);
  return row;
}

function createHeaderButton(
  content: SVGSVGElement | HTMLElement,
  tipTitle: string,
  tipDesc: string | undefined,
  onClick: () => void,
  extraClass = ''
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `p-1.5 rounded-lg transition-colors cursor-pointer ${FOCUS_RING} ${extraClass}`;
  btn.appendChild(content);
  attachTooltip(btn, tipTitle, tipDesc);
  btn.onclick = onClick;
  return btn;
}

function render() {
  hideFloatingTooltip();
  const root = document.getElementById('root');
  if (!root) return;

  // Kazde przelaczenie przerysowuje cale drzewo - bez tego lista skakala na gore.
  const previousMain = root.querySelector('main');
  if (previousMain) savedScrollTop = previousMain.scrollTop;

  const isDark = currentSettings.theme === 'dark';
  const isMasterOn = currentSettings.masterEnabled;
  const lang: Language = currentSettings.language || 'en';
  const t = getT(lang);

  document.documentElement.classList.toggle('dark', isDark);

  while (root.firstChild) root.removeChild(root.firstChild);

  const container = document.createElement('div');
  container.className =
    'w-[360px] max-h-[580px] bg-white dark:bg-[#141416] text-gray-900 dark:text-gray-100 flex flex-col font-sans select-none antialiased';

  // --- HEADER ---
  const header = document.createElement('header');
  header.className =
    'px-3 py-2 border-b border-gray-200/80 dark:border-white/[0.07] flex items-center justify-between gap-2 bg-gray-50/90 dark:bg-[#18181b] flex-shrink-0';

  const brand = document.createElement('div');
  brand.className = 'flex items-center gap-2 min-w-0';

  const logoWrap = document.createElement('div');
  logoWrap.className =
    'w-7 h-7 rounded-lg bg-[#121212] flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0';
  logoWrap.appendChild(getAppLogo());

  const titlesWrap = document.createElement('div');
  titlesWrap.className = 'flex flex-col min-w-0';

  const mainTitle = document.createElement('span');
  mainTitle.className =
    'text-[13px] font-bold tracking-tight text-gray-900 dark:text-white leading-tight truncate';
  mainTitle.textContent = t.appName;

  const subTitle = document.createElement('span');
  subTitle.className = 'text-[9.5px] text-gray-400 dark:text-gray-500 font-medium leading-tight truncate';
  subTitle.textContent = t.distractionFree;

  titlesWrap.appendChild(mainTitle);
  titlesWrap.appendChild(subTitle);
  brand.appendChild(logoWrap);
  brand.appendChild(titlesWrap);

  const actions = document.createElement('div');
  actions.className = 'flex items-center gap-0.5 flex-shrink-0';

  const presetBtn = createHeaderButton(
    icons.sparkles(),
    t.creatorPresetTitle,
    t.creatorPresetAction,
    () => {
      updateSettings({
        ...DEFAULT_SETTINGS,
        language: currentSettings.language,
        theme: currentSettings.theme,
      });
      showToast(t.creatorPresetToast);
    },
    'text-gray-400 hover:text-[#007aff] dark:hover:text-[#25f4ee] hover:bg-gray-200/60 dark:hover:bg-white/[0.08]'
  );

  const langInner = document.createElement('span');
  langInner.className = 'flex items-center gap-1';
  const langIcon = icons.languages();
  langIcon.classList.add('text-[#007aff]', 'dark:text-[#25f4ee]');
  const langText = document.createElement('span');
  langText.className = 'tracking-wide uppercase text-[10.5px] font-bold';
  langText.textContent = lang;
  langInner.appendChild(langIcon);
  langInner.appendChild(langText);

  const langBtn = createHeaderButton(
    langInner,
    'Language / Jezyk',
    lang === 'pl' ? 'Switch to English (EN)' : 'Przelacz na polski (PL)',
    () => {
      const nextLang: Language = lang === 'en' ? 'pl' : 'en';
      updateSettings({ language: nextLang });
      showToast(getT(nextLang).langSwitchedToast);
    },
    'px-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-white/[0.08] border border-gray-200/80 dark:border-white/[0.08]'
  );

  const themeBtn = createHeaderButton(
    isDark ? icons.sun() : icons.moon(),
    isDark ? t.themeLight : t.themeDark,
    undefined,
    () => updateSettings({ theme: isDark ? 'light' : 'dark' }),
    'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-white/[0.08]'
  );

  const powerBtn = createHeaderButton(
    icons.power(isMasterOn),
    isMasterOn ? t.toggleMasterOff : t.toggleMasterOn,
    undefined,
    () => {
      const next = !isMasterOn;
      updateSettings({ masterEnabled: next });
      showToast(next ? t.extensionEnabled : t.extensionDisabled);
    },
    isMasterOn
      ? 'text-[#007aff] dark:text-[#25f4ee] bg-[#007aff]/10 dark:bg-[#25f4ee]/10 hover:bg-[#007aff]/20 dark:hover:bg-[#25f4ee]/20'
      : 'text-gray-400 hover:bg-gray-200/60 dark:hover:bg-white/[0.08]'
  );

  actions.appendChild(presetBtn);
  actions.appendChild(langBtn);
  actions.appendChild(themeBtn);
  actions.appendChild(powerBtn);

  header.appendChild(brand);
  header.appendChild(actions);

  // --- PASEK STANU ---
  let totalActive = 0;
  let totalItems = 0;

  const statusBar = document.createElement('div');
  statusBar.className =
    'px-3 pt-2 pb-2 flex flex-col gap-1.5 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0';

  const statusTop = document.createElement('div');
  statusTop.className = 'flex items-center justify-between gap-2';

  const statusLeft = document.createElement('div');
  statusLeft.className = 'flex items-center gap-1.5 min-w-0';

  const statusIcon = isMasterOn ? icons.shieldCheck() : icons.shieldOff();
  statusIcon.classList.add('flex-shrink-0');
  const statusIconWrap = document.createElement('span');
  statusIconWrap.className = isMasterOn
    ? ACCENT_TEXT
    : 'text-amber-500 dark:text-amber-400';
  statusIconWrap.appendChild(statusIcon);

  const statusText = document.createElement('span');
  statusText.className = `text-[11px] font-semibold truncate ${
    isMasterOn ? 'text-gray-700 dark:text-gray-200' : 'text-amber-600 dark:text-amber-400'
  }`;
  statusText.textContent = isMasterOn ? t.protectionActive : t.protectionPaused;

  const statusCount = document.createElement('span');
  statusCount.className = 'text-[10.5px] text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0';

  statusLeft.appendChild(statusIconWrap);
  statusLeft.appendChild(statusText);
  statusLeft.appendChild(statusCount);

  const isAllOpen = ALL_CLUSTER_IDS.every((id) => openClusters.has(id));
  const toggleAllBtn = document.createElement('button');
  toggleAllBtn.type = 'button';
  toggleAllBtn.className = `flex items-center gap-1 text-[10.5px] font-semibold ${ACCENT_TEXT} hover:underline cursor-pointer flex-shrink-0 rounded ${FOCUS_RING}`;
  toggleAllBtn.appendChild(icons.chevronsUpDown());
  const toggleAllText = document.createElement('span');
  toggleAllText.textContent = isAllOpen ? t.collapseAll : t.expandAll;
  toggleAllBtn.appendChild(toggleAllText);
  toggleAllBtn.onclick = () => {
    if (isAllOpen) openClusters.clear();
    else ALL_CLUSTER_IDS.forEach((id) => openClusters.add(id));
    saveOpenClusters(openClusters);
    render();
  };

  statusTop.appendChild(statusLeft);
  statusTop.appendChild(toggleAllBtn);

  const progressTrack = document.createElement('div');
  progressTrack.className = 'h-1 w-full rounded-full bg-gray-200 dark:bg-white/[0.08] overflow-hidden';
  const progressFill = document.createElement('div');
  progressFill.className = `h-full rounded-full transition-[width] duration-300 ease-out ${
    isMasterOn ? 'bg-[#007aff] dark:bg-[#25f4ee]' : 'bg-amber-400'
  }`;
  progressFill.style.width = '0%';
  progressTrack.appendChild(progressFill);

  statusBar.appendChild(statusTop);
  statusBar.appendChild(progressTrack);

  // --- KLASTRY ---
  const main = document.createElement('main');
  main.className = 'flex-1 min-h-0 px-2 py-0.5 overflow-y-auto overscroll-contain';

  if (!isMasterOn) {
    const warning = document.createElement('div');
    warning.className =
      'mt-1.5 mb-1 mx-1 p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-[10.5px] leading-snug flex items-start gap-2';
    const shieldIcon = icons.shieldOff();
    shieldIcon.classList.add('flex-shrink-0', 'mt-px');
    warning.appendChild(shieldIcon);
    const warnText = document.createElement('span');
    warnText.textContent = t.blockingDisabledBanner;
    warning.appendChild(warnText);
    main.appendChild(warning);
  }

  const handleToggleCluster = (id: string) => {
    if (openClusters.has(id)) openClusters.delete(id);
    else openClusters.add(id);
    saveOpenClusters(openClusters);
    render();
  };

  const addCluster = (
    id: string,
    iconEl: SVGSVGElement,
    title: string,
    activeCount: number,
    toggleCount: number,
    items: HTMLElement[]
  ) => {
    totalActive += activeCount;
    totalItems += toggleCount;
    main.appendChild(
      createAccordionCluster(
        id,
        iconEl,
        title,
        activeCount,
        toggleCount,
        items,
        openClusters.has(id),
        () => handleToggleCluster(id),
        t
      )
    );
  };

  // 1. FOKUS & NAWIGACJA
  const feedItems: HTMLElement[] = [
    createToggleRow(
      icons.lock(),
      t.searchUnlockTitle,
      t.searchUnlockDesc,
      currentSettings.searchUnlockChallenge,
      () => updateSettings({ searchUnlockChallenge: !currentSettings.searchUnlockChallenge }),
      !isMasterOn
    ),
    createToggleRow(
      icons.tv(),
      t.hideForYouTitle,
      t.hideForYouDesc,
      currentSettings.hideForYouFeed,
      () => updateSettings({ hideForYouFeed: !currentSettings.hideForYouFeed }),
      !isMasterOn
    ),
    createToggleRow(
      icons.userCircle(),
      t.redirectToProfileTitle,
      t.redirectToProfileDesc,
      currentSettings.redirectToProfile,
      () => updateSettings({ redirectToProfile: !currentSettings.redirectToProfile }),
      !isMasterOn
    ),
    createToggleRow(
      icons.compass(),
      t.hideExploreTitle,
      t.hideExploreDesc,
      currentSettings.hideExploreFeed,
      () => updateSettings({ hideExploreFeed: !currentSettings.hideExploreFeed }),
      !isMasterOn
    ),
    createToggleRow(
      icons.userMinus(),
      t.hideFriendsTitle,
      t.hideFriendsDesc,
      currentSettings.hideFriends,
      () => updateSettings({ hideFriends: !currentSettings.hideFriends }),
      !isMasterOn
    ),
    createToggleRow(
      icons.playCircle(),
      t.keepPlayingTitle,
      t.keepPlayingDesc,
      currentSettings.keepPlayingInBackground,
      () => updateSettings({ keepPlayingInBackground: !currentSettings.keepPlayingInBackground }),
      !isMasterOn
    ),
  ];
  const feedActive =
    (currentSettings.searchUnlockChallenge ? 1 : 0) +
    (currentSettings.hideForYouFeed ? 1 : 0) +
    (currentSettings.redirectToProfile ? 1 : 0) +
    (currentSettings.hideExploreFeed ? 1 : 0) +
    (currentSettings.hideFriends ? 1 : 0) +
    (currentSettings.keepPlayingInBackground ? 1 : 0);
  addCluster('feeds', icons.compass(), t.clusterFeeds, feedActive, 6, feedItems);

  // 2. TRESCI & INTERAKCJA
  const contentItems: HTMLElement[] = [
    createToggleRow(
      icons.messageSquare(),
      t.hideCommentsTitle,
      t.hideCommentsDesc,
      currentSettings.hideComments,
      () => updateSettings({ hideComments: !currentSettings.hideComments }),
      !isMasterOn
    ),
    createToggleRow(
      icons.heartOff(),
      t.hideMetricsTitle,
      t.hideMetricsDesc,
      currentSettings.hideLikeCount,
      () => {
        const next = !currentSettings.hideLikeCount;
        updateSettings({ hideLikeCount: next, hideShareCount: next, hideCommentCount: next });
      },
      !isMasterOn
    ),
    createToggleRow(
      icons.fileText(),
      t.hideDescriptionsTitle,
      t.hideDescriptionsDesc,
      currentSettings.hideDescriptions,
      () => updateSettings({ hideDescriptions: !currentSettings.hideDescriptions }),
      !isMasterOn
    ),
  ];
  const contentActive =
    (currentSettings.hideComments ? 1 : 0) +
    (currentSettings.hideLikeCount ? 1 : 0) +
    (currentSettings.hideDescriptions ? 1 : 0);
  addCluster('content', icons.messageSquare(), t.clusterContent, contentActive, 3, contentItems);

  // 3. TWORCY & OBSERWOWANI
  const likeStep = (v: number) => (v >= 20000 ? 10000 : v >= 5000 ? 2500 : v >= 1000 ? 500 : 100);

  const followingItems: HTMLElement[] = [
    createToggleRow(
      icons.layoutGrid(),
      t.hideFollowingListTitle,
      t.hideFollowingListDesc,
      currentSettings.hideFollowingSidebarList,
      () => updateSettings({ hideFollowingSidebarList: !currentSettings.hideFollowingSidebarList }),
      !isMasterOn
    ),
    createToggleRow(
      icons.flame(),
      t.viralFilterTitle,
      t.viralFilterDesc(currentSettings.viralMinLikes),
      currentSettings.viralFilterEnabled,
      () => updateSettings({ viralFilterEnabled: !currentSettings.viralFilterEnabled }),
      !isMasterOn
    ),
  ];

  if (isMasterOn && currentSettings.viralFilterEnabled) {
    const stepperBox = document.createElement('div');
    stepperBox.className =
      'ml-[34px] mr-2 mb-1 px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/[0.06]';
    stepperBox.appendChild(
      createStepperRow(t.viralLikesLabel, currentSettings.viralMinLikes, 0, likeStep, (v) =>
        updateSettings({ viralMinLikes: v })
      )
    );
    stepperBox.appendChild(
      createStepperRow(t.viralCommentsLabel, currentSettings.viralMinComments, 0, 5, (v) =>
        updateSettings({ viralMinComments: v })
      )
    );
    followingItems.push(stepperBox);
  }

  followingItems.push(
    createToggleRow(
      icons.users(),
      t.hideSuggestedTitle,
      t.hideSuggestedDesc,
      currentSettings.hideSuggestedAccounts,
      () => updateSettings({ hideSuggestedAccounts: !currentSettings.hideSuggestedAccounts }),
      !isMasterOn
    ),
    createToggleRow(
      icons.usersOff(),
      t.hideFollowersTitle,
      t.hideFollowersDesc,
      currentSettings.hideFollowers,
      () => updateSettings({ hideFollowers: !currentSettings.hideFollowers }),
      !isMasterOn
    )
  );

  const followingActive =
    (currentSettings.hideFollowingSidebarList ? 1 : 0) +
    (currentSettings.viralFilterEnabled ? 1 : 0) +
    (currentSettings.hideSuggestedAccounts ? 1 : 0) +
    (currentSettings.hideFollowers ? 1 : 0);
  addCluster('following', icons.users(), t.clusterFollowing, followingActive, 4, followingItems);

  // 4. REKLAMY & PROMOCJE
  const adsItems: HTMLElement[] = [
    createToggleRow(
      icons.shoppingBag(),
      t.hideShopTitle,
      t.hideShopDesc,
      currentSettings.hideShop,
      () => {
        const next = !currentSettings.hideShop;
        updateSettings({ hideShop: next, hideAds: next });
      },
      !isMasterOn
    ),
    createToggleRow(
      icons.coins(),
      t.hideGetCoinsAppTitle,
      t.hideGetCoinsAppDesc,
      currentSettings.hideGetCoinsApp,
      () => {
        const next = !currentSettings.hideGetCoinsApp;
        updateSettings({ hideGetCoinsApp: next, hideHeaderPromos: next });
      },
      !isMasterOn
    ),
    createToggleRow(
      icons.radio(),
      t.hideLiveTitle,
      t.hideLiveDesc,
      currentSettings.hideLiveSidebar,
      () => {
        const next = !currentSettings.hideLiveSidebar;
        updateSettings({ hideLiveSidebar: next, hideLiveChat: next });
      },
      !isMasterOn
    ),
    createToggleRow(
      icons.layoutList(),
      t.hideFooterTitle,
      t.hideFooterDesc,
      currentSettings.hideSidebarFooter,
      () => updateSettings({ hideSidebarFooter: !currentSettings.hideSidebarFooter }),
      !isMasterOn
    ),
  ];
  const adsActive =
    (currentSettings.hideShop ? 1 : 0) +
    (currentSettings.hideGetCoinsApp ? 1 : 0) +
    (currentSettings.hideLiveSidebar ? 1 : 0) +
    (currentSettings.hideSidebarFooter ? 1 : 0);
  addCluster('ads', icons.shoppingBag(), t.clusterAds, adsActive, 4, adsItems);

  // Licznik i pasek postepu wypelniane po zbudowaniu klastrow.
  statusCount.textContent = `· ${t.activeItemsCount(totalActive, totalItems)}`;
  const progressPct = isMasterOn && totalItems > 0 ? Math.round((totalActive / totalItems) * 100) : 0;
  progressFill.style.width = `${progressPct}%`;

  // --- STOPKA ---
  const footer = document.createElement('div');
  footer.className =
    'flex-shrink-0 border-t border-gray-100 dark:border-white/[0.06] px-3 py-1.5 flex items-center justify-between gap-2 bg-gray-50/70 dark:bg-[#161618]';

  const donateBtn = document.createElement('a');
  donateBtn.href = t.donateUrl;
  donateBtn.target = '_blank';
  donateBtn.rel = 'noopener noreferrer';
  donateBtn.className = `text-[10.5px] font-medium text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer rounded px-1 py-0.5 ${FOCUS_RING}`;
  const coffeeIcon = createSvg(
    [
      { tag: 'path', d: 'M18 8h1a4 4 0 0 1 0 8h-1' },
      { tag: 'path', d: 'M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z' },
      { tag: 'line', x1: '6', y1: '1', x2: '6', y2: '4' },
      { tag: 'line', x1: '10', y1: '1', x2: '10', y2: '4' },
      { tag: 'line', x1: '14', y1: '1', x2: '14', y2: '4' },
    ],
    12
  );
  donateBtn.appendChild(coffeeIcon);
  const donateLabel = document.createElement('span');
  donateLabel.textContent = t.donateText;
  donateBtn.appendChild(donateLabel);
  attachTooltip(donateBtn, t.donateText, t.donateTooltip);

  const versionEl = document.createElement('span');
  versionEl.className = 'text-[9.5px] text-gray-400 dark:text-gray-600 tabular-nums flex-shrink-0';
  versionEl.textContent = getExtensionVersion();

  footer.appendChild(donateBtn);
  footer.appendChild(versionEl);

  container.appendChild(header);
  container.appendChild(statusBar);
  container.appendChild(main);
  container.appendChild(footer);
  root.appendChild(container);

  if (savedScrollTop > 0) main.scrollTop = savedScrollTop;

  // Tlo okna popupu musi isc za motywem, inaczej w trybie jasnym
  // dookola jasnej karty zostawala czarna ramka.
  const pageBg = isDark ? '#141416' : '#ffffff';
  document.documentElement.style.backgroundColor = pageBg;
  document.body.style.backgroundColor = pageBg;
}

// Initial start
getSettings().then((data) => {
  if (data) currentSettings = data;
  render();
});
