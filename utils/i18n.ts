export type Language = 'en' | 'pl';

export interface TranslationStrings {
  appName: string;
  distractionFree: string;
  themeDark: string;
  themeLight: string;
  extensionEnabled: string;
  extensionDisabled: string;
  toggleMasterOn: string;
  toggleMasterOff: string;
  blockingDisabledBanner: string;
  creatorPresetTitle: string;
  creatorPresetAction: string;
  creatorPresetToast: string;
  langSwitchedToast: string;
  donateText: string;
  donateTooltip: string;
  donateUrl: string;
  footerText: string;
  version: string;

  // Toggle titles & descriptions
  hideForYouTitle: string;
  hideForYouDesc: string;

  redirectToProfileTitle: string;
  redirectToProfileDesc: string;

  hideSuggestedTitle: string;
  hideSuggestedDesc: string;

  hideCommentsTitle: string;
  hideCommentsDesc: string;

  hideMetricsTitle: string;
  hideMetricsDesc: string;

  hideLiveTitle: string;
  hideLiveDesc: string;

  hideShopTitle: string;
  hideShopDesc: string;

  hideExploreTitle: string;
  hideExploreDesc: string;

  hideDescriptionsTitle: string;
  hideDescriptionsDesc: string;

  showAllFollowingTitle: string;
  showAllFollowingDesc: string;

  hideFollowersTitle: string;
  hideFollowersDesc: string;

  sessionSummaryPrefix: string;
  sessionVideosLabel: (n: number) => string;
  sessionMinutesLabel: (n: number) => string;

  viralFilterTitle: string;
  viralFilterDesc: (likes: number) => string;
  viralLikesLabel: string;
  viralCommentsLabel: string;

  hideFooterTitle: string;
  hideFooterDesc: string;
}

export const translations: Record<Language, TranslationStrings> = {
  en: {
    appName: 'TikTok Unhook',
    distractionFree: 'Distraction-Free TikTok',
    themeDark: 'Dark mode',
    themeLight: 'Light mode',
    extensionEnabled: 'Extension enabled',
    extensionDisabled: 'Extension disabled',
    toggleMasterOn: 'Enable blocker',
    toggleMasterOff: 'Disable blocker',
    blockingDisabledBanner: 'Distraction blocking is disabled. Click the power button above to enable.',
    creatorPresetTitle: 'Creator & Focus Mode',
    creatorPresetAction: 'Reset to default',
    creatorPresetToast: 'Default focus preset enabled',
    langSwitchedToast: 'Language switched to English',
    donateText: '☕ Buy me a coffee',
    donateTooltip: 'Support free development & new features',
    donateUrl: 'https://buymeacoffee.com',
    footerText: 'Following • Profile • Focus',
    version: 'v1.2.0',

    hideForYouTitle: 'Hide "For You" Feed',
    hideForYouDesc: 'Removes algorithmic feed and auto-redirects',

    redirectToProfileTitle: 'Open My Profile by Default',
    redirectToProfileDesc: 'Go straight to your profile instead of Following',

    hideSuggestedTitle: 'Hide Suggested Accounts',
    hideSuggestedDesc: 'Keeps only your Following creators in sidebar',

    hideCommentsTitle: 'Hide Comments Section',
    hideCommentsDesc: 'Blocks all comments under videos',

    hideMetricsTitle: 'Hide Likes & Vanity Metrics',
    hideMetricsDesc: 'Removes heart counters, shares, and metrics pressure',

    hideLiveTitle: 'Hide LIVE Streams & Chat',
    hideLiveDesc: 'Removes live broadcasts and live stream chat',

    hideShopTitle: 'Hide Shop, Ads & Coin Promos',
    hideShopDesc: 'Removes TikTok Shop, sponsored ads, and Get App prompts',

    hideExploreTitle: 'Hide "Explore" Tab',
    hideExploreDesc: 'Removes Explore page and navigation button',

    hideDescriptionsTitle: 'Hide Descriptions & Sounds',
    hideDescriptionsDesc: 'Descriptions appear only when hovering over video',

    showAllFollowingTitle: 'Compact Following in Sidebar',
    showAllFollowingDesc: 'Shows all followed creators in a compact avatar grid',

    hideFollowersTitle: 'Hide My Followers',
    hideFollowersDesc: 'Removes followers list & count from your profile',

    sessionSummaryPrefix: 'Previous session:',
    sessionVideosLabel: (n) => (n === 1 ? '1 video' : `${n} videos`),
    sessionMinutesLabel: (n) => (n === 1 ? '1 min' : `${n} min`),

    viralFilterTitle: 'Only Viral Videos in Following',
    viralFilterDesc: (likes: number) => `Auto-skips videos with under ${likes.toLocaleString()} likes`,
    viralLikesLabel: 'Min. likes',
    viralCommentsLabel: 'Min. comments',

    hideFooterTitle: 'Hide Sidebar Footer',
    hideFooterDesc: 'Removes legal links and copyright from sidebar',
  },
  pl: {
    appName: 'TikTok Unhook',
    distractionFree: 'Blokada rozpraszaczy TikTok',
    themeDark: 'Ciemny motyw',
    themeLight: 'Jasny motyw',
    extensionEnabled: 'Wtyczka włączona',
    extensionDisabled: 'Wtyczka wyłączona',
    toggleMasterOn: 'Włącz blokadę',
    toggleMasterOff: 'Wyłącz całkowicie blokadę',
    blockingDisabledBanner: 'Blokowanie wyłączone. Kliknij ikonę zasilania u góry, aby włączyć.',
    creatorPresetTitle: 'Tryb Twórcy & Focus',
    creatorPresetAction: 'Włącz domyślne',
    creatorPresetToast: 'Włączono domyślny tryb skupienia',
    langSwitchedToast: 'Przełączono język na Polski',
    donateText: '☕ Postaw kawę / Wesprzyj',
    donateTooltip: 'Wesprzyj darmowy rozwój i nowe funkcje',
    donateUrl: 'https://buycoffee.to',
    footerText: 'Obserwowani • Profil • Focus',
    version: 'v1.2.0',

    hideForYouTitle: 'Ukryj feed "Dla Ciebie"',
    hideForYouDesc: 'Automatycznie otwiera /following i usuwa feed algorytmiczny',

    redirectToProfileTitle: 'Otwieraj od razu mój profil',
    redirectToProfileDesc: 'Zamiast Obserwowanych, po wejściu trafiasz na profil',

    hideSuggestedTitle: 'Ukryj sugerowanych twórców',
    hideSuggestedDesc: 'Zostawia wyłącznie Twoje Following accounts w menu bocznym',

    hideCommentsTitle: 'Ukryj komentarze',
    hideCommentsDesc: 'Blokuje całą sekcję komentarzy pod filmami',

    hideMetricsTitle: 'Ukryj liczniki polubień',
    hideMetricsDesc: 'Usuwa liczby serduszek, udostępnień i presję cyfr',

    hideLiveTitle: 'Ukryj LIVE & Czat',
    hideLiveDesc: 'Usuwa relacje na żywo z lewego paska i czaty',

    hideShopTitle: 'Ukryj Sklep, Reklamy & Monety',
    hideShopDesc: 'Usuwa promocje monet, Get Coins, reklamy i TikTok Shop',

    hideExploreTitle: 'Ukryj kartę "Eksploruj"',
    hideExploreDesc: 'Usuwa przycisk Odkrywaj z menu',

    hideDescriptionsTitle: 'Ukryj opisy i dźwięki',
    hideDescriptionsDesc: 'Odsłaniają się po najechaniu myszką na wideo',

    showAllFollowingTitle: 'Pełna lista obserwowanych z boku',
    showAllFollowingDesc: 'Zamiast 5 + "View all" - wszyscy od razu w siatce',

    hideFollowersTitle: 'Ukryj moich obserwujących',
    hideFollowersDesc: 'Usuwa listę i licznik obserwujących z Twojego profilu',

    sessionSummaryPrefix: 'Poprzednia sesja:',
    sessionVideosLabel: (n) => {
      const m10 = n % 10;
      const m100 = n % 100;
      const word =
        n === 1
          ? 'film'
          : m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)
            ? 'filmy'
            : 'filmów';
      return `${n} ${word}`;
    },
    sessionMinutesLabel: (n) => {
      if (n === 1) return '1 min';
      const m10 = n % 10;
      const m100 = n % 100;
      const word = m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14) ? 'minuty' : 'minut';
      return `${n} ${word}`;
    },

    viralFilterTitle: 'Tylko viral w Obserwowanych',
    viralFilterDesc: (likes: number) => `Ukrywa filmy poniżej ${likes.toLocaleString()} polubień`,
    viralLikesLabel: 'Min. polubień',
    viralCommentsLabel: 'Min. komentarzy',

    hideFooterTitle: 'Ukryj stopkę menu',
    hideFooterDesc: 'Usuwa informacje prawne z lewego panelu',
  },
};

export function getT(lang: Language = 'en'): TranslationStrings {
  return translations[lang] || translations.en;
}
