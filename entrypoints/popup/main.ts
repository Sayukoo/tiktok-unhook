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
      15
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
        { tag: 'polyline', d: 'm17 2-5 5-5-5' },
      ],
      15
    ),
  userCircle: () =>
    createSvg(
      [
        { tag: 'circle', cx: '12', cy: '12', r: '10' },
        { tag: 'circle', cx: '12', cy: '10', r: '3' },
        { tag: 'path', d: 'M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662' },
      ],
      15
    ),
  users: () =>
    createSvg(
      [
        { tag: 'path', d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' },
        { tag: 'circle', cx: '9', cy: '7', r: '4' },
        { tag: 'path', d: 'M22 21v-2a4 4 0 0 0-3-3.87' },
        { tag: 'path', d: 'M16 3.13a4 4 0 0 1 0 7.75' },
      ],
      15
    ),
  usersOff: () =>
    createSvg(
      [
        { tag: 'path', d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' },
        { tag: 'circle', cx: '9', cy: '7', r: '4' },
        { tag: 'path', d: 'M22 21v-2a4 4 0 0 0-3-3.87' },
        { tag: 'line', x1: '2', y1: '2', x2: '22', y2: '22' },
      ],
      15
    ),
  messageSquare: () =>
    createSvg(
      [{ tag: 'path', d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }],
      15
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
      15
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
      15
    ),
  shoppingBag: () =>
    createSvg(
      [
        { tag: 'path', d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z' },
        { tag: 'path', d: 'M3 6h18' },
        { tag: 'path', d: 'M16 10a4 4 0 0 1-8 0' },
      ],
      15
    ),
  compass: () =>
    createSvg(
      [
        { tag: 'circle', cx: '12', cy: '12', r: '10' },
        { tag: 'polygon', points: '16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76' },
      ],
      15
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
      15
    ),
  layoutGrid: () =>
    createSvg(
      [
        { tag: 'rect', x: '3', y: '3', width: '7', height: '7', rx: '1' },
        { tag: 'rect', x: '14', y: '3', width: '7', height: '7', rx: '1' },
        { tag: 'rect', x: '14', y: '14', width: '7', height: '7', rx: '1' },
        { tag: 'rect', x: '3', y: '14', width: '7', height: '7', rx: '1' },
      ],
      15
    ),
  flame: () =>
    createSvg(
      [
        {
          tag: 'path',
          d: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
        },
      ],
      15
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
      15
    ),
};

// --- APP STATE & UI CREATION ---
let currentSettings: TikTokUnhookSettings = DEFAULT_SETTINGS;
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
  btn.title = desc;
  btn.className = `w-full flex items-center justify-between py-2 px-3 rounded-xl text-left transition-all ${
    disabled
      ? 'opacity-40 cursor-not-allowed'
      : 'hover:bg-gray-100 dark:hover:bg-[#202020] active:scale-[0.99] cursor-pointer'
  }`;

  if (!disabled) {
    btn.onclick = onToggle;
  }

  const leftContainer = document.createElement('div');
  leftContainer.className = 'flex items-center gap-3 flex-1 min-w-0 pr-2';

  const iconWrapper = document.createElement('div');
  iconWrapper.className = `p-1.5 rounded-lg flex-shrink-0 ${
    checked
      ? 'text-[#007aff] bg-blue-50 dark:bg-blue-500/15'
      : 'text-gray-400 bg-gray-100 dark:bg-[#222]'
  }`;
  iconWrapper.appendChild(iconEl);

  const textContainer = document.createElement('div');
  textContainer.className = 'flex flex-col min-w-0';

  const titleEl = document.createElement('span');
  titleEl.className = `text-[13px] font-medium leading-tight truncate ${
    checked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
  }`;
  titleEl.textContent = title;

  const descEl = document.createElement('span');
  descEl.className = 'text-[10.5px] text-gray-400 dark:text-gray-500 truncate';
  descEl.textContent = desc;

  textContainer.appendChild(titleEl);
  textContainer.appendChild(descEl);

  leftContainer.appendChild(iconWrapper);
  leftContainer.appendChild(textContainer);

  // Switcher
  const switchTrack = document.createElement('div');
  switchTrack.className = `relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out pointer-events-none ${
    checked ? 'bg-[#007aff]' : 'bg-gray-300 dark:bg-gray-600'
  }`;

  const switchThumb = document.createElement('span');
  switchThumb.className = `pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
    checked ? 'translate-x-4' : 'translate-x-0'
  }`;
  switchTrack.appendChild(switchThumb);

  btn.appendChild(leftContainer);
  btn.appendChild(switchTrack);

  return btn;
}

function render() {
  const root = document.getElementById('root');
  if (!root) return;

  const isDark = currentSettings.theme === 'dark';
  const isMasterOn = currentSettings.masterEnabled;
  const lang: Language = currentSettings.language || 'en';
  const t = getT(lang);

  // Apply dark class
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Clear existing content
  while (root.firstChild) {
    root.removeChild(root.firstChild);
  }

  const container = document.createElement('div');
  container.className = `${
    isDark ? 'dark' : ''
  } w-[340px] max-h-[600px] bg-white dark:bg-[#141414] text-gray-900 dark:text-gray-100 flex flex-col font-sans select-none antialiased min-h-[500px]`;

  const inner = document.createElement('div');
  inner.className = 'w-[340px] flex-1 flex flex-col bg-white dark:bg-[#141414]';

  // --- HEADER ---
  const header = document.createElement('header');
  header.className =
    'px-3.5 py-2.5 border-b border-gray-200 dark:border-[#222222] flex items-center justify-between bg-gray-50/90 dark:bg-[#181818] sticky top-0 z-20';

  const brand = document.createElement('div');
  brand.className = 'flex items-center gap-2';

  const logoWrap = document.createElement('div');
  logoWrap.className =
    'w-6 h-6 rounded-md bg-[#121212] flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0';
  logoWrap.appendChild(getAppLogo());

  const titlesWrap = document.createElement('div');
  titlesWrap.className = 'flex flex-col';

  const mainTitle = document.createElement('span');
  mainTitle.className = 'text-[13.5px] font-bold tracking-tight text-gray-900 dark:text-white leading-tight';
  mainTitle.textContent = t.appName;

  const subTitle = document.createElement('span');
  subTitle.className = 'text-[9.5px] text-gray-400 font-medium leading-none';
  subTitle.textContent = t.distractionFree;

  titlesWrap.appendChild(mainTitle);
  titlesWrap.appendChild(subTitle);

  brand.appendChild(logoWrap);
  brand.appendChild(titlesWrap);

  // Actions in Header
  const actions = document.createElement('div');
  actions.className = 'flex items-center gap-1';

  // Language Button
  const langBtn = document.createElement('button');
  langBtn.type = 'button';
  langBtn.title = 'Change Language / Zmień język';
  langBtn.className =
    'px-2 py-1 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-[#242424] transition-all flex items-center gap-1 border border-gray-200 dark:border-gray-700/60';
  const langIcon = icons.languages();
  langIcon.classList.add('text-[#007aff]');
  langBtn.appendChild(langIcon);

  const langText = document.createElement('span');
  langText.className = 'tracking-wide uppercase text-[11px]';
  langText.textContent = lang;
  langBtn.appendChild(langText);

  langBtn.onclick = () => {
    const nextLang: Language = lang === 'en' ? 'pl' : 'en';
    const nextT = getT(nextLang);
    updateSettings({ language: nextLang });
    showToast(nextT.langSwitchedToast);
  };

  // Theme Button
  const themeBtn = document.createElement('button');
  themeBtn.type = 'button';
  themeBtn.title = isDark ? t.themeLight : t.themeDark;
  themeBtn.className =
    'p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-[#242424] transition-colors';
  themeBtn.appendChild(isDark ? icons.sun() : icons.moon());
  themeBtn.onclick = () => {
    const nextTheme: 'dark' | 'light' = isDark ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
  };

  // Power Master Button
  const powerBtn = document.createElement('button');
  powerBtn.type = 'button';
  powerBtn.title = isMasterOn ? t.toggleMasterOff : t.toggleMasterOn;
  powerBtn.className = `p-1.5 rounded-lg transition-colors ${
    isMasterOn
      ? 'text-[#007aff] bg-blue-500/10 hover:bg-blue-500/20'
      : 'text-gray-400 hover:bg-gray-200/50 dark:hover:bg-[#242424]'
  }`;
  powerBtn.appendChild(icons.power(isMasterOn));
  powerBtn.onclick = () => {
    const next = !isMasterOn;
    updateSettings({ masterEnabled: next });
    showToast(next ? t.extensionEnabled : t.extensionDisabled);
  };

  actions.appendChild(langBtn);
  actions.appendChild(themeBtn);
  actions.appendChild(powerBtn);

  header.appendChild(brand);
  header.appendChild(actions);

  // --- PRESET BANNER ---
  const bannerWrap = document.createElement('div');
  bannerWrap.className = 'px-3 pt-2 pb-1';

  const banner = document.createElement('div');
  banner.className =
    'py-2 px-2.5 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-between';

  const bannerLeft = document.createElement('div');
  bannerLeft.className = 'flex items-center gap-2';

  const sparkleIcon = icons.sparkles();
  sparkleIcon.classList.add('text-blue-500', 'flex-shrink-0');
  bannerLeft.appendChild(sparkleIcon);

  const bannerTitle = document.createElement('div');
  bannerTitle.className = 'text-[11.5px] font-semibold text-blue-600 dark:text-blue-400';
  bannerTitle.textContent = t.creatorPresetTitle;
  bannerLeft.appendChild(bannerTitle);

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'text-[10.5px] font-medium text-blue-600 dark:text-blue-400 hover:underline px-1.5 py-0.5';
  resetBtn.textContent = t.creatorPresetAction;
  resetBtn.onclick = () => {
    const preservedLanguage = currentSettings.language;
    const preservedTheme = currentSettings.theme;
    updateSettings({ ...DEFAULT_SETTINGS, language: preservedLanguage, theme: preservedTheme });
    showToast(t.creatorPresetToast);
  };

  banner.appendChild(bannerLeft);
  banner.appendChild(resetBtn);
  bannerWrap.appendChild(banner);

  // --- MAIN TOGGLES ---
  const main = document.createElement('main');
  main.className = 'flex-1 px-2 py-1 space-y-0.5 overflow-y-auto';

  if (!isMasterOn) {
    const warning = document.createElement('div');
    warning.className =
      'my-1.5 mx-1 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-2';
    const shieldIcon = icons.shieldOff();
    shieldIcon.classList.add('flex-shrink-0');
    warning.appendChild(shieldIcon);

    const warnText = document.createElement('span');
    warnText.textContent = t.blockingDisabledBanner;
    warning.appendChild(warnText);

    main.appendChild(warning);
  }

  // 1. Hide For You
  main.appendChild(
    createToggleRow(
      icons.tv(),
      t.hideForYouTitle,
      t.hideForYouDesc,
      currentSettings.hideForYouFeed,
      () => updateSettings({ hideForYouFeed: !currentSettings.hideForYouFeed }),
      !isMasterOn
    )
  );

  // 1b. Redirect to profile
  main.appendChild(
    createToggleRow(
      icons.userCircle(),
      t.redirectToProfileTitle,
      t.redirectToProfileDesc,
      currentSettings.redirectToProfile,
      () => updateSettings({ redirectToProfile: !currentSettings.redirectToProfile }),
      !isMasterOn || !currentSettings.hideForYouFeed
    )
  );

  // 2. Suggested accounts
  main.appendChild(
    createToggleRow(
      icons.users(),
      t.hideSuggestedTitle,
      t.hideSuggestedDesc,
      currentSettings.hideSuggestedAccounts,
      () => updateSettings({ hideSuggestedAccounts: !currentSettings.hideSuggestedAccounts }),
      !isMasterOn
    )
  );

  // 2b. Hide followers
  main.appendChild(
    createToggleRow(
      icons.usersOff(),
      t.hideFollowersTitle,
      t.hideFollowersDesc,
      currentSettings.hideFollowers,
      () => updateSettings({ hideFollowers: !currentSettings.hideFollowers }),
      !isMasterOn
    )
  );

  // 3. Comments
  main.appendChild(
    createToggleRow(
      icons.messageSquare(),
      t.hideCommentsTitle,
      t.hideCommentsDesc,
      currentSettings.hideComments,
      () => updateSettings({ hideComments: !currentSettings.hideComments }),
      !isMasterOn
    )
  );

  // 4. Like counts / metrics
  main.appendChild(
    createToggleRow(
      icons.heartOff(),
      t.hideMetricsTitle,
      t.hideMetricsDesc,
      currentSettings.hideLikeCount,
      () => {
        const next = !currentSettings.hideLikeCount;
        updateSettings({
          hideLikeCount: next,
          hideShareCount: next,
          hideCommentCount: next,
        });
      },
      !isMasterOn
    )
  );

  // 5. LIVE & Chat
  main.appendChild(
    createToggleRow(
      icons.radio(),
      t.hideLiveTitle,
      t.hideLiveDesc,
      currentSettings.hideLiveSidebar,
      () => {
        const next = !currentSettings.hideLiveSidebar;
        updateSettings({
          hideLiveSidebar: next,
          hideLiveChat: next,
        });
      },
      !isMasterOn
    )
  );

  // 6. Shop & Ads
  main.appendChild(
    createToggleRow(
      icons.shoppingBag(),
      t.hideShopTitle,
      t.hideShopDesc,
      currentSettings.hideShop,
      () => {
        const next = !currentSettings.hideShop;
        updateSettings({
          hideShop: next,
          hideAds: next,
          hideHeaderPromos: next,
        });
      },
      !isMasterOn
    )
  );

  // 7. Explore Tab
  main.appendChild(
    createToggleRow(
      icons.compass(),
      t.hideExploreTitle,
      t.hideExploreDesc,
      currentSettings.hideExploreFeed,
      () => updateSettings({ hideExploreFeed: !currentSettings.hideExploreFeed }),
      !isMasterOn
    )
  );

  // 8. Descriptions & Sound
  main.appendChild(
    createToggleRow(
      icons.fileText(),
      t.hideDescriptionsTitle,
      t.hideDescriptionsDesc,
      currentSettings.hideDescriptions,
      () => updateSettings({ hideDescriptions: !currentSettings.hideDescriptions }),
      !isMasterOn
    )
  );

  // 9a. Full following in sidebar
  main.appendChild(
    createToggleRow(
      icons.layoutGrid(),
      t.showAllFollowingTitle,
      t.showAllFollowingDesc,
      currentSettings.showAllFollowingInSidebar,
      () => updateSettings({ showAllFollowingInSidebar: !currentSettings.showAllFollowingInSidebar }),
      !isMasterOn
    )
  );

  // 9b. Viral filter in Following
  main.appendChild(
    createToggleRow(
      icons.flame(),
      t.viralFilterTitle,
      t.viralFilterDesc(currentSettings.viralMinLikes),
      currentSettings.viralFilterEnabled,
      () => updateSettings({ viralFilterEnabled: !currentSettings.viralFilterEnabled }),
      !isMasterOn
    )
  );

  // 9b-extra. Viral threshold steppers (likes / comments)
  if (isMasterOn && currentSettings.viralFilterEnabled) {
    const likeStep = (v: number) => (v >= 20000 ? 10000 : v >= 5000 ? 2500 : v >= 1000 ? 500 : 100);

    const createStepper = (
      label: string,
      getVal: () => number,
      step: number | ((v: number) => number),
      min: number,
      apply: (next: number) => void
    ): HTMLElement => {
      const wrap = document.createElement('div');
      wrap.className =
        'flex items-center gap-1.5 bg-gray-100 dark:bg-[#1c1c1c] rounded-lg px-1.5 py-1';

      const lab = document.createElement('span');
      lab.className = 'text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap';
      lab.textContent = label;

      const valSpan = document.createElement('span');
      valSpan.className =
        'text-[10.5px] font-semibold text-gray-700 dark:text-gray-200 min-w-[46px] text-center tabular-nums';
      valSpan.textContent = getVal().toLocaleString();

      const btnCls =
        'w-5 h-5 rounded-full bg-white dark:bg-[#2a2a2a] shadow-sm text-gray-600 dark:text-gray-300 text-[13px] leading-none flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#333] active:scale-95 transition-all cursor-pointer';

      const minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '\u2212';
      minus.className = btnCls;
      minus.onclick = () =>
        apply(Math.max(min, getVal() - (typeof step === 'function' ? step(getVal()) : step)));

      const plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.className = btnCls;
      plus.onclick = () =>
        apply(getVal() + (typeof step === 'function' ? step(getVal()) : step));

      wrap.appendChild(lab);
      wrap.appendChild(minus);
      wrap.appendChild(valSpan);
      wrap.appendChild(plus);
      return wrap;
    };

    const stepperRow = document.createElement('div');
    stepperRow.className = 'flex flex-wrap items-center gap-2 pl-11 pr-3 pb-1.5 pt-0.5';
    stepperRow.appendChild(
      createStepper(t.viralLikesLabel, () => currentSettings.viralMinLikes, likeStep, 0, (v) =>
        updateSettings({ viralMinLikes: v })
      )
    );
    stepperRow.appendChild(
      createStepper(
        t.viralCommentsLabel,
        () => currentSettings.viralMinComments,
        5,
        0,
        (v) => updateSettings({ viralMinComments: v })
      )
    );
    main.appendChild(stepperRow);
  }

  // 9c. Sidebar footer
  main.appendChild(
    createToggleRow(
      icons.layoutList(),
      t.hideFooterTitle,
      t.hideFooterDesc,
      currentSettings.hideSidebarFooter,
      () => updateSettings({ hideSidebarFooter: !currentSettings.hideSidebarFooter }),
      !isMasterOn
    )
  );

  // --- DONATE / SUPPORT BUTTON ---
  const donateWrap = document.createElement('div');
  donateWrap.className = 'px-3 pt-1.5 pb-0.5';

  const donateBtn = document.createElement('a');
  donateBtn.href = t.donateUrl;
  donateBtn.target = '_blank';
  donateBtn.rel = 'noopener noreferrer';
  donateBtn.title = t.donateTooltip;
  donateBtn.className =
    'w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-pink-500/10 hover:from-amber-500/20 hover:to-pink-500/20 border border-amber-500/20 text-amber-600 dark:text-amber-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer';

  const coffeeIcon = createSvg(
    [
      { tag: 'path', d: 'M18 8h1a4 4 0 0 1 0 8h-1' },
      { tag: 'path', d: 'M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z' },
      { tag: 'line', x1: '6', y1: '1', x2: '6', y2: '4' },
      { tag: 'line', x1: '10', y1: '1', x2: '10', y2: '4' },
      { tag: 'line', x1: '14', y1: '1', x2: '14', y2: '4' },
    ],
    13
  );
  donateBtn.appendChild(coffeeIcon);

  const donateLabel = document.createElement('span');
  donateLabel.textContent = t.donateText;
  donateBtn.appendChild(donateLabel);

  donateWrap.appendChild(donateBtn);

  // --- FOOTER ---
  const footer = document.createElement('div');
  footer.className =
    'py-2 px-3 border-t border-gray-100 dark:border-[#1e1e1e] flex items-center justify-between text-[10.5px] text-gray-400';

  const footerLeft = document.createElement('span');
  footerLeft.textContent = t.footerText;

  const footerRight = document.createElement('span');
  footerRight.className = 'text-gray-500';
  footerRight.textContent = t.version;

  footer.appendChild(footerLeft);
  footer.appendChild(footerRight);

  inner.appendChild(header);
  inner.appendChild(bannerWrap);
  inner.appendChild(main);
  inner.appendChild(donateWrap);
  inner.appendChild(footer);

  container.appendChild(inner);
  root.appendChild(container);
}

// Initial start
getSettings().then((data) => {
  if (data) currentSettings = data;
  render();
});
