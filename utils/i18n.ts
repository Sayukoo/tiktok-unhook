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

  hideFollowingListTitle: string;
  hideFollowingListDesc: string;

  hideFriendsTitle: string;
  hideFriendsDesc: string;

  hideGetCoinsAppTitle: string;
  hideGetCoinsAppDesc: string;

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

  // Status strip
  protectionActive: string;
  protectionPaused: string;

  // Cluster headers
  clusterFeeds: string;
  clusterContent: string;
  clusterFollowing: string;
  clusterAds: string;

  // Accordion controls
  expandAll: string;
  collapseAll: string;
  activeItemsCount: (active: number, total: number) => string;

  // 30-char friction search lock
  searchUnlockTitle: string;
  searchUnlockDesc: string;
  searchUnlockPlaceholderLocked: string;
  searchUnlockModalTitle: string;
  searchUnlockModalSubtitle: string;
  searchUnlockCodeLabel: string;
  searchUnlockNewCode: string;
  searchUnlockInputPlaceholder: string;
  searchUnlockPasteBlocked: string;
  searchUnlockCharsCount: (current: number, target: number) => string;
  searchUnlockBtn: string;
  searchUnlockSuccessToast: string;
  searchUnlockStatusUnlocked: (mins: number, secs: number) => string;
  searchUnlockLockNow: string;
  searchUnlockPageBlockedTitle: string;
  searchUnlockPageBlockedDesc: string;
  searchUnlockBackBtn: string;

  // Following sidebar controls
  followingViewAll: string;
  followingHide: string;

  // Background playback
  keepPlayingTitle: string;
  keepPlayingDesc: string;
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

    hideForYouTitle: 'Hide "For You"',
    hideForYouDesc: 'Removes only the For You button from the sidebar. The feed itself stays reachable.',

    redirectToProfileTitle: 'Open my profile',
    redirectToProfileDesc: 'Opening tiktok.com takes you straight to your profile instead of the For You feed',

    hideSuggestedTitle: 'Hide suggested',
    hideSuggestedDesc: 'Keeps only your Following creators in sidebar',

    hideCommentsTitle: 'Hide comments',
    hideCommentsDesc: 'Blocks all comments under videos',

    hideMetricsTitle: 'Hide counters',
    hideMetricsDesc: 'Removes heart counters, shares, and metrics pressure',

    hideLiveTitle: 'Hide LIVE',
    hideLiveDesc: 'Removes live broadcasts and live stream chat',

    hideShopTitle: 'Hide shop & ads',
    hideShopDesc: 'Removes TikTok Shop and sponsored ad blocks',

    hideExploreTitle: 'Hide "Explore"',
    hideExploreDesc: 'Removes Explore page and navigation button',

    hideDescriptionsTitle: 'Hide descriptions',
    hideDescriptionsDesc: 'Descriptions appear only when hovering over video',

    hideFollowingListTitle: 'Collapse following list',
    hideFollowingListDesc: 'Sidebar shows only a "View all" button — the list of followed creators stays hidden until you click it',

    hideFriendsTitle: 'Hide "Friends"',
    hideFriendsDesc: 'Removes the Friends feed and its sidebar button',

    hideGetCoinsAppTitle: 'Hide coins & app',
    hideGetCoinsAppDesc: 'Removes coin top-up prompts and mobile app download nags',

    hideFollowersTitle: 'Hide followers',
    hideFollowersDesc: 'Removes followers count & tab – you only see creators you follow',

    sessionSummaryPrefix: 'Previous session:',
    sessionVideosLabel: (n) => (n === 1 ? '1 video' : `${n} videos`),
    sessionMinutesLabel: (n) => (n === 1 ? '1 min' : `${n} min`),

    viralFilterTitle: 'Viral only',
    viralFilterDesc: (likes: number) => `Auto-skips videos with under ${likes.toLocaleString()} likes`,
    viralLikesLabel: 'Min. likes',
    viralCommentsLabel: 'Min. comments',

    hideFooterTitle: 'Hide footer',
    hideFooterDesc: 'Removes legal links and copyright from sidebar',

    protectionActive: 'Protection active',
    protectionPaused: 'Protection off',

    clusterFeeds: 'Focus & Navigation',
    clusterContent: 'Content & Distractions',
    clusterFollowing: 'Creators & Following',
    clusterAds: 'Ads & Promotions',

    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
    activeItemsCount: (active, total) => `${active}/${total} active`,

    searchUnlockTitle: 'Search lock',
    searchUnlockDesc: 'Requires typing 30 random characters to unlock search bar & button',
    searchUnlockPlaceholderLocked: '🔒 Locked: Type 30 chars to unlock search...',
    searchUnlockModalTitle: 'Unlock TikTok Search',
    searchUnlockModalSubtitle: 'A moment of friction. Type the 30 characters below to open search.',
    searchUnlockCodeLabel: 'Type this code',
    searchUnlockNewCode: 'New code',
    searchUnlockInputPlaceholder: 'Type 30 characters manually here...',
    searchUnlockPasteBlocked: 'Pasting is blocked — type it out manually',
    searchUnlockCharsCount: (current, target) => `${current} / ${target} characters`,
    searchUnlockBtn: 'Unlock Search',
    searchUnlockSuccessToast: 'Search unlocked for 5 minutes!',
    searchUnlockStatusUnlocked: (mins, secs) => `Search open · ${mins}:${secs.toString().padStart(2, '0')}`,
    searchUnlockLockNow: 'Lock now',
    searchUnlockPageBlockedTitle: 'Search is Locked',
    searchUnlockPageBlockedDesc: 'Complete the 30-character typing challenge to unlock search results.',
    searchUnlockBackBtn: 'Back to Following',

    followingViewAll: 'View all following',
    followingHide: 'Hide following list',

    keepPlayingTitle: 'Keep playing in background',
    keepPlayingDesc: 'Video keeps playing when you switch tabs or minimize the window (takes effect after refreshing the TikTok tab)',
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

    hideForYouTitle: 'Ukryj "Dla Ciebie"',
    hideForYouDesc: 'Usuwa wyłącznie przycisk Dla Ciebie z menu. Sam feed zostaje dostępny.',

    redirectToProfileTitle: 'Otwieraj mój profil',
    redirectToProfileDesc: 'Wejście na tiktok.com od razu przenosi na Twój profil zamiast na feed Dla Ciebie',

    hideSuggestedTitle: 'Ukryj sugerowanych',
    hideSuggestedDesc: 'Zostawia wyłącznie Twoje Following accounts w menu bocznym',

    hideCommentsTitle: 'Ukryj komentarze',
    hideCommentsDesc: 'Blokuje całą sekcję komentarzy pod filmami',

    hideMetricsTitle: 'Ukryj liczniki',
    hideMetricsDesc: 'Usuwa liczby serduszek, udostępnień i presję cyfr',

    hideLiveTitle: 'Ukryj LIVE',
    hideLiveDesc: 'Usuwa relacje na żywo z lewego paska i czaty',

    hideShopTitle: 'Ukryj sklep i reklamy',
    hideShopDesc: 'Usuwa TikTok Shop i bloki reklam sponsorowanych',

    hideExploreTitle: 'Ukryj "Eksploruj"',
    hideExploreDesc: 'Usuwa przycisk Odkrywaj z menu',

    hideDescriptionsTitle: 'Ukryj opisy',
    hideDescriptionsDesc: 'Odsłaniają się po najechaniu myszką na wideo',

    hideFollowingListTitle: 'Zwiń listę obserwowanych',
    hideFollowingListDesc: 'W menu zostaje sam przycisk "Zobacz wszystkich" — lista obserwowanych pokazuje się dopiero po kliknięciu',

    hideFriendsTitle: 'Ukryj "Znajomi"',
    hideFriendsDesc: 'Usuwa feed Znajomi i jego przycisk z lewego menu',

    hideGetCoinsAppTitle: 'Ukryj monety i apkę',
    hideGetCoinsAppDesc: 'Usuwa doładowania monet i namawianie na aplikację mobilną',

    hideFollowersTitle: 'Ukryj obserwujących',
    hideFollowersDesc: 'Usuwa licznik i listę osób obserwujących Ciebie – skupiasz się tylko na obserwowanych',

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

    viralFilterTitle: 'Tylko viral',
    viralFilterDesc: (likes: number) => `Ukrywa filmy poniżej ${likes.toLocaleString()} polubień`,
    viralLikesLabel: 'Min. polubień',
    viralCommentsLabel: 'Min. komentarzy',

    hideFooterTitle: 'Ukryj stopkę',
    hideFooterDesc: 'Usuwa informacje prawne z lewego panelu',

    protectionActive: 'Ochrona aktywna',
    protectionPaused: 'Ochrona wyłączona',

    clusterFeeds: 'Fokus & Nawigacja',
    clusterContent: 'Treści & Interakcja',
    clusterFollowing: 'Twórcy & Obserwowani',
    clusterAds: 'Reklamy & Promocje',

    expandAll: 'Rozwiń',
    collapseAll: 'Zwiń',
    activeItemsCount: (active, total) => `${active}/${total} włączone`,

    searchUnlockTitle: 'Blokada szukajki',
    searchUnlockDesc: 'Wymaga wpisania 30 losowych znaków, aby odblokować wyszukiwarkę',
    searchUnlockPlaceholderLocked: '🔒 Zablokowane: Wpisz 30 znaków, aby odblokować...',
    searchUnlockModalTitle: 'Odblokuj wyszukiwarkę',
    searchUnlockModalSubtitle: 'Chwila na uważność. Przepisz 30 znaków poniżej, aby otworzyć wyszukiwarkę.',
    searchUnlockCodeLabel: 'Przepisz ten kod',
    searchUnlockNewCode: 'Nowy kod',
    searchUnlockInputPlaceholder: 'Wpisz 30 znaków ręcznie na klawiaturze...',
    searchUnlockPasteBlocked: 'Wklejanie zablokowane — wpisz znaki ręcznie',
    searchUnlockCharsCount: (current, target) => `${current} / ${target} znaków`,
    searchUnlockBtn: 'Odblokuj wyszukiwarkę',
    searchUnlockSuccessToast: 'Wyszukiwarka odblokowana na 5 minut!',
    searchUnlockStatusUnlocked: (mins, secs) => `Szukajka otwarta · ${mins}:${secs.toString().padStart(2, '0')}`,
    searchUnlockLockNow: 'Zablokuj teraz',
    searchUnlockPageBlockedTitle: 'Wyszukiwarka jest zablokowana',
    searchUnlockPageBlockedDesc: 'Wpisz 30 znaków w wyzwaniu odblokowującym, aby przeglądać wyniki.',
    searchUnlockBackBtn: 'Wróć do Obserwowanych',

    followingViewAll: 'Zobacz wszystkich obserwowanych',
    followingHide: 'Ukryj listę obserwowanych',

    keepPlayingTitle: 'Graj dalej w tle',
    keepPlayingDesc: 'Film gra dalej po zmianie karty lub zminimalizowaniu okna (zadziała po odświeżeniu karty TikToka)',
  },
};

export function getT(lang: Language = 'en'): TranslationStrings {
  return translations[lang] || translations.en;
}
