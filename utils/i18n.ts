import { BRAND } from './brand';

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
  langSwitchTitle: string;
  langSwitchToEn: string;
  langSwitchToPl: string;

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

  hideActionsTitle: string;
  hideActionsDesc: string;

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
  closeLabel: string;

  viralFilterTitle: string;
  viralFilterDesc: (likes: number, comments: number) => string;
  viralLikesLabel: string;
  viralCommentsLabel: string;

  hideFooterTitle: string;
  hideFooterDesc: string;

  // Status strip
  protectionActive: string;
  protectionPaused: string;
  usageToday: (minutes: number) => string;
  usageTodayOfLimit: (minutes: number, limit: number) => string;

  // Cluster headers
  clusterLimits: string;
  clusterFeeds: string;
  clusterContent: string;
  clusterFollowing: string;
  clusterAds: string;

  // Accordion controls
  expandAll: string;
  collapseAll: string;
  activeItemsCount: (active: number, total: number) => string;

  // Zamek i limity
  strictLockTitle: string;
  strictLockDesc: string;
  entryGateTitle: string;
  entryGateDesc: string;
  entryGateSecondsLabel: string;
  dailyLimitTitle: string;
  dailyLimitDesc: string;
  dailyLimitMinutesLabel: string;
  quietHoursTitle: string;
  quietHoursDesc: string;
  quietFromLabel: string;
  quietToLabel: string;
  grayscaleTitle: string;
  grayscaleDesc: string;
  editWindowOpen: (mins: number, secs: number) => string;
  editWindowLockNow: string;
  editWindowToast: string;
  setupWindowHint: string;

  // Blokada wyszukiwarki
  searchUnlockTitle: string;
  searchUnlockDesc: string;
  searchUnlockPlaceholderLocked: string;
  searchUnlockModalTitle: string;
  searchUnlockModalSubtitle: (length: number) => string;
  searchUnlockBtn: string;
  searchUnlockSuccessToast: string;
  searchUnlockStatusUnlocked: (mins: number, secs: number) => string;
  searchUnlockLockNow: string;
  searchUnlockPageBlockedTitle: string;
  searchUnlockPageBlockedDesc: string;
  searchUnlockBackBtn: string;

  // Wspólne okno z kodem do przepisania
  codeLabel: string;
  codeNew: string;
  codeInputPlaceholder: string;
  codePasteBlocked: string;
  codeMismatch: string;
  codeCharsCount: (current: number, target: number) => string;
  codeCloseLabel: string;

  // Nakładki zasłaniające stronę
  gateTitle: string;
  gateSubtitle: string;
  gateCountdown: (seconds: number) => string;
  gateContinue: string;
  blockLeave: string;
  limitTitle: string;
  limitDesc: (minutes: number) => string;
  quietTitle: string;
  quietDesc: (until: string) => string;
  passBtn: (minutes: number) => string;
  passModalTitle: (minutes: number) => string;
  passModalSubtitle: (length: number) => string;
  passConfirmBtn: string;
  passGrantedToast: (minutes: number) => string;
  passPill: (mins: number, secs: number) => string;
  passEndNow: string;

  // Following sidebar controls
  followingViewAll: string;
  followingHide: string;

  // Background playback
  keepPlayingTitle: string;
  keepPlayingDesc: string;

  // Rytuał przed osłabieniem blokady
  disarmTitleOff: string;
  disarmTitleLoosen: string;
  disarmReasonOff: string;
  disarmReasonLoosen: (minutes: number) => string;
  disarmRound: (round: number) => string;
  disarmSubtitle: (rewind: number) => string;
  disarmBack: string;
  disarmNewPhrase: string;
  disarmPlaceholder: string;
  disarmPasteBlocked: string;
  disarmTypo: (rewind: number) => string;
  disarmProgress: (ready: number, total: number) => string;
  disarmProgressLabel: string;
  disarmWait: string;
  disarmHold: (seconds: number) => string;
  disarmHolding: string;
  disarmReady: string;
  disarmTypeAlong: string;
  disarmUnlocking: string;
  disarmHint: (minutes: number) => string;
  disarmPowerHint: string;
  disarmPhrases: readonly [string, string, string, ...string[]];
}

const clock = (mins: number, secs: number) => `${mins}:${secs.toString().padStart(2, '0')}`;

export const translations: Record<Language, TranslationStrings> = {
  en: {
    appName: BRAND.name,
    distractionFree: 'Focus mode for short videos',
    themeDark: 'Dark mode',
    themeLight: 'Light mode',
    extensionEnabled: 'Protection on',
    extensionDisabled: 'Protection off',
    toggleMasterOn: 'Turn protection on',
    toggleMasterOff: 'Turn protection off',
    blockingDisabledBanner: 'Protection is off. Click the power button above to turn it back on.',
    creatorPresetTitle: 'Focus preset',
    creatorPresetAction: 'Reset to default',
    creatorPresetToast: 'Default focus preset restored',
    langSwitchedToast: 'Language switched to English',
    donateText: '☕ Buy me a coffee',
    donateTooltip: 'Support free development & new features',
    donateUrl: 'https://buymeacoffee.com',
    langSwitchTitle: 'Language / Język',
    langSwitchToEn: 'Switch to English (EN)',
    langSwitchToPl: 'Przełącz na polski (PL)',

    hideForYouTitle: 'Hide "For You"',
    hideForYouDesc: 'Removes only the For You button from the sidebar. The feed itself stays reachable.',

    redirectToProfileTitle: 'Open my profile',
    redirectToProfileDesc: 'Opening the home page takes you straight to your profile instead of the For You feed',

    hideSuggestedTitle: 'Hide suggested',
    hideSuggestedDesc: 'Keeps only the creators you follow in the sidebar',

    hideCommentsTitle: 'Hide comments',
    hideCommentsDesc: 'Blocks all comments under videos',

    hideMetricsTitle: 'Hide counters',
    hideMetricsDesc: 'Removes like, comment and share counts',

    hideActionsTitle: 'Hide action buttons',
    hideActionsDesc: 'Removes the like, comment and share buttons next to the video',

    hideLiveTitle: 'Hide LIVE',
    hideLiveDesc: 'Removes live broadcasts from the sidebar and closes the LIVE page',

    hideShopTitle: 'Hide shop & ads',
    hideShopDesc: 'Removes the shop tab, closes the shop page and hides sponsored blocks',

    hideExploreTitle: 'Hide "Explore"',
    hideExploreDesc: 'Removes the Explore page and its menu button',

    hideDescriptionsTitle: 'Hide descriptions',
    hideDescriptionsDesc:
      'Descriptions appear only when hovering over video (on touch screens they stay visible — there is no hover to reveal them)',

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
    closeLabel: 'Close',

    viralFilterTitle: 'Viral only',
    viralFilterDesc: (likes: number, comments: number) =>
      `Auto-skips videos with under ${likes.toLocaleString()} likes and under ${comments.toLocaleString()} comments`,
    viralLikesLabel: 'Min. likes',
    viralCommentsLabel: 'Min. comments',

    hideFooterTitle: 'Hide footer',
    hideFooterDesc: 'Removes legal links and copyright from sidebar',

    protectionActive: 'Protection active',
    protectionPaused: 'Protection off',
    usageToday: (minutes) => `Today ${minutes} min`,
    usageTodayOfLimit: (minutes, limit) => `Today ${minutes} / ${limit} min`,

    clusterLimits: 'Limits & Lock',
    clusterFeeds: 'Focus & Navigation',
    clusterContent: 'Content & Distractions',
    clusterFollowing: 'Creators & Following',
    clusterAds: 'Ads & Promotions',

    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
    activeItemsCount: (active, total) => `${active}/${total} active`,

    strictLockTitle: 'Lock my settings',
    strictLockDesc:
      'Switching any protection off, or loosening a limit, first requires typing a sentence by hand. Then settings stay open for 3 minutes.',
    entryGateTitle: 'Pause before entering',
    entryGateDesc: 'A short countdown before the site opens, once per tab. Time to decide if you really want in.',
    entryGateSecondsLabel: 'Seconds to wait',
    dailyLimitTitle: 'Daily limit',
    dailyLimitDesc: 'After this many minutes in one day the site is covered until midnight',
    dailyLimitMinutesLabel: 'Minutes per day',
    quietHoursTitle: 'Quiet hours',
    quietHoursDesc: 'The site is covered between these hours, every day',
    quietFromLabel: 'From',
    quietToLabel: 'To',
    grayscaleTitle: 'Grayscale',
    grayscaleDesc: 'Shows the whole site in black and white, so the feed pulls less',
    editWindowOpen: (mins, secs) => `Settings open · ${clock(mins, secs)}`,
    editWindowLockNow: 'Lock now',
    editWindowToast: 'Settings open for 3 minutes',
    setupWindowHint: 'Fresh install: settings stay open for the first 10 minutes.',

    searchUnlockTitle: 'Search lock',
    searchUnlockDesc: 'Requires typing a 30-character code before search opens for 5 minutes',
    searchUnlockPlaceholderLocked: 'Locked. Type a 30-character code to search…',
    searchUnlockModalTitle: 'Unlock search',
    searchUnlockModalSubtitle: (length) =>
      `A moment of friction. Type the ${length} characters below to open search.`,
    searchUnlockBtn: 'Unlock search',
    searchUnlockSuccessToast: 'Search unlocked for 5 minutes',
    searchUnlockStatusUnlocked: (mins, secs) => `Search open · ${clock(mins, secs)}`,
    searchUnlockLockNow: 'Lock now',
    searchUnlockPageBlockedTitle: 'Search is locked',
    searchUnlockPageBlockedDesc: 'Type the 30-character code to see search results.',
    searchUnlockBackBtn: 'Back to Following',

    codeLabel: 'Type this code',
    codeNew: 'New code',
    codeInputPlaceholder: 'Type the code here by hand',
    codePasteBlocked: 'Pasting is blocked — type it out by hand',
    codeMismatch: 'That does not match the code. Fix the marked character.',
    codeCharsCount: (current, target) => `${current} / ${target}`,
    codeCloseLabel: 'Close',

    gateTitle: 'Hold on a moment',
    gateSubtitle: 'What did you come here for?',
    gateCountdown: (seconds) => `Opens in ${seconds} s`,
    gateContinue: 'Go in',
    blockLeave: 'Leave the site',
    limitTitle: 'That is it for today',
    limitDesc: (minutes) =>
      `You have used your ${minutes} minutes for today. The site opens again after midnight.`,
    quietTitle: 'Quiet hours',
    quietDesc: (until) => `The site is closed until ${until}.`,
    passBtn: (minutes) => `I need ${minutes} more minutes`,
    passModalTitle: (minutes) => `${minutes} more minutes`,
    passModalSubtitle: (length) =>
      `Type the ${length} characters below. Every pass you take today makes the next code longer.`,
    passConfirmBtn: 'Open the site',
    passGrantedToast: (minutes) => `Open for ${minutes} minutes`,
    passPill: (mins, secs) => `Pass · ${clock(mins, secs)}`,
    passEndNow: 'End now',

    followingViewAll: 'View all following',
    followingHide: 'Hide following list',

    keepPlayingTitle: 'Keep playing in background',
    keepPlayingDesc:
      'Video keeps playing when you switch tabs or minimize the window (takes effect after refreshing the tab)',

    disarmTitleOff: 'Before you turn this off',
    disarmTitleLoosen: 'Before you loosen this',
    disarmReasonOff: 'You are about to switch all protection off.',
    disarmReasonLoosen: (minutes) =>
      `You are about to loosen a protection. Afterwards settings stay open for ${minutes} minutes.`,
    disarmRound: (round) => `Round ${round} today, so the text is longer.`,
    disarmSubtitle: (rewind) =>
      `The first letter is ready now. Each next one waits a second. Type the text by hand. A mistake rewinds ${rewind} letters.`,
    disarmBack: 'Keep it on',
    disarmNewPhrase: 'Different text, from the start',
    disarmPlaceholder: 'Type it here',
    disarmPasteBlocked: "Pasting won't work. Every letter has to come from the keyboard.",
    disarmTypo: (rewind) => `Rewound by ${rewind} letters.`,
    disarmProgress: (ready, total) => `unlocked ${ready}/${total}`,
    disarmProgressLabel: 'Unlocked letters',
    disarmWait: 'Type the whole text',
    disarmHold: (seconds) => `Hold for ${seconds} seconds`,
    disarmHolding: 'Keep holding…',
    disarmReady: 'Text complete. Hold the button.',
    disarmTypeAlong: 'Keep typing.',
    disarmUnlocking: 'Next letter in a moment.',
    disarmHint: (minutes) => `About ${minutes} min. Closing the window cancels the attempt.`,
    disarmPowerHint: 'Asks you to type a sentence first',
    disarmPhrases: [
      'I want the endless feed back, just for today, nothing else.',
      'I am turning this off so I can scroll instead of stopping.',
      'One more video is only an excuse, and it is not my plan.',
      'I am giving my attention back to the feed, and I know it.',
    ],
  },
  pl: {
    appName: BRAND.name,
    distractionFree: 'Tryb skupienia na krótkie filmy',
    themeDark: 'Ciemny motyw',
    themeLight: 'Jasny motyw',
    extensionEnabled: 'Ochrona włączona',
    extensionDisabled: 'Ochrona wyłączona',
    toggleMasterOn: 'Włącz ochronę',
    toggleMasterOff: 'Wyłącz całą ochronę',
    blockingDisabledBanner: 'Ochrona jest wyłączona. Kliknij ikonę zasilania u góry, aby ją włączyć.',
    creatorPresetTitle: 'Zestaw skupienia',
    creatorPresetAction: 'Przywróć domyślne',
    creatorPresetToast: 'Przywrócono domyślny zestaw skupienia',
    langSwitchedToast: 'Przełączono język na polski',
    donateText: '☕ Postaw kawę / Wesprzyj',
    donateTooltip: 'Wesprzyj darmowy rozwój i nowe funkcje',
    donateUrl: 'https://buycoffee.to',
    langSwitchTitle: 'Language / Język',
    langSwitchToEn: 'Switch to English (EN)',
    langSwitchToPl: 'Przełącz na polski (PL)',

    hideForYouTitle: 'Ukryj "Dla Ciebie"',
    hideForYouDesc: 'Usuwa wyłącznie przycisk Dla Ciebie z menu. Sam feed zostaje dostępny.',

    redirectToProfileTitle: 'Otwieraj mój profil',
    redirectToProfileDesc: 'Wejście na stronę główną od razu przenosi na Twój profil zamiast na feed Dla Ciebie',

    hideSuggestedTitle: 'Ukryj sugerowanych',
    hideSuggestedDesc: 'Zostawia w menu bocznym wyłącznie konta, które obserwujesz',

    hideCommentsTitle: 'Ukryj komentarze',
    hideCommentsDesc: 'Blokuje całą sekcję komentarzy pod filmami',

    hideMetricsTitle: 'Ukryj liczniki',
    hideMetricsDesc: 'Usuwa liczby polubień, komentarzy i udostępnień',

    hideActionsTitle: 'Ukryj przyciski akcji',
    hideActionsDesc: 'Usuwa przyciski polubienia, komentarza i udostępnienia obok filmu',

    hideLiveTitle: 'Ukryj LIVE',
    hideLiveDesc: 'Usuwa relacje na żywo z lewego paska i zamyka stronę LIVE',

    hideShopTitle: 'Ukryj sklep i reklamy',
    hideShopDesc: 'Usuwa zakładkę sklepu, zamyka stronę sklepu i chowa bloki sponsorowane',

    hideExploreTitle: 'Ukryj "Odkrywaj"',
    hideExploreDesc: 'Usuwa stronę Odkrywaj i jej przycisk w menu',

    hideDescriptionsTitle: 'Ukryj opisy',
    hideDescriptionsDesc:
      'Odsłaniają się po najechaniu myszką na wideo (na ekranach dotykowych zostają widoczne — nie ma najechania, które je odsłoni)',

    hideFollowingListTitle: 'Zwiń listę obserwowanych',
    hideFollowingListDesc: 'W menu zostaje sam przycisk "Zobacz wszystkich" — lista obserwowanych pokazuje się dopiero po kliknięciu',

    hideFriendsTitle: 'Ukryj "Znajomi"',
    hideFriendsDesc: 'Usuwa feed Znajomi i jego przycisk z lewego menu',

    hideGetCoinsAppTitle: 'Ukryj monety i apkę',
    hideGetCoinsAppDesc: 'Usuwa doładowania monet i namawianie na aplikację mobilną',

    hideFollowersTitle: 'Ukryj obserwujących',
    hideFollowersDesc: 'Usuwa licznik i listę osób obserwujących Ciebie – skupiasz się tylko na obserwowanych',

    sessionSummaryPrefix: 'Poprzednia sesja:',
    closeLabel: 'Zamknij',
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
    viralFilterDesc: (likes: number, comments: number) =>
      `Pomija filmy poniżej ${likes.toLocaleString()} polubień i poniżej ${comments.toLocaleString()} komentarzy`,
    viralLikesLabel: 'Min. polubień',
    viralCommentsLabel: 'Min. komentarzy',

    hideFooterTitle: 'Ukryj stopkę',
    hideFooterDesc: 'Usuwa informacje prawne z lewego panelu',

    protectionActive: 'Ochrona aktywna',
    protectionPaused: 'Ochrona wyłączona',
    usageToday: (minutes) => `Dziś ${minutes} min`,
    usageTodayOfLimit: (minutes, limit) => `Dziś ${minutes} / ${limit} min`,

    clusterLimits: 'Limity i zamek',
    clusterFeeds: 'Fokus i nawigacja',
    clusterContent: 'Treści i interakcja',
    clusterFollowing: 'Twórcy i obserwowani',
    clusterAds: 'Reklamy i promocje',

    expandAll: 'Rozwiń',
    collapseAll: 'Zwiń',
    activeItemsCount: (active, total) => `${active}/${total} włączone`,

    strictLockTitle: 'Zamek na ustawienia',
    strictLockDesc:
      'Wyłączenie dowolnej blokady albo poluzowanie limitu wymaga najpierw ręcznego przepisania zdania. Potem ustawienia są otwarte przez 3 minuty.',
    entryGateTitle: 'Pauza na wejściu',
    entryGateDesc: 'Krótkie odliczanie, zanim strona się otworzy, raz na kartę. Czas, żeby zdecydować, czy naprawdę chcesz wejść.',
    entryGateSecondsLabel: 'Sekundy czekania',
    dailyLimitTitle: 'Limit dzienny',
    dailyLimitDesc: 'Po tylu minutach jednego dnia strona jest zasłonięta do północy',
    dailyLimitMinutesLabel: 'Minuty na dzień',
    quietHoursTitle: 'Ciche godziny',
    quietHoursDesc: 'Strona jest zasłonięta między tymi godzinami, codziennie',
    quietFromLabel: 'Od',
    quietToLabel: 'Do',
    grayscaleTitle: 'Skala szarości',
    grayscaleDesc: 'Pokazuje całą stronę w czerni i bieli, przez co feed mniej wciąga',
    editWindowOpen: (mins, secs) => `Ustawienia otwarte · ${clock(mins, secs)}`,
    editWindowLockNow: 'Zamknij teraz',
    editWindowToast: 'Ustawienia otwarte na 3 minuty',
    setupWindowHint: 'Świeża instalacja: przez pierwsze 10 minut ustawienia są otwarte.',

    searchUnlockTitle: 'Blokada szukajki',
    searchUnlockDesc: 'Wymaga przepisania kodu z 30 znaków, zanim wyszukiwarka otworzy się na 5 minut',
    searchUnlockPlaceholderLocked: 'Zablokowane. Przepisz kod z 30 znaków, aby szukać…',
    searchUnlockModalTitle: 'Odblokuj wyszukiwarkę',
    searchUnlockModalSubtitle: (length) =>
      `Chwila na uważność. Przepisz ${length} znaków poniżej, aby otworzyć wyszukiwarkę.`,
    searchUnlockBtn: 'Odblokuj wyszukiwarkę',
    searchUnlockSuccessToast: 'Wyszukiwarka odblokowana na 5 minut',
    searchUnlockStatusUnlocked: (mins, secs) => `Szukajka otwarta · ${clock(mins, secs)}`,
    searchUnlockLockNow: 'Zablokuj teraz',
    searchUnlockPageBlockedTitle: 'Wyszukiwarka jest zablokowana',
    searchUnlockPageBlockedDesc: 'Przepisz kod z 30 znaków, aby zobaczyć wyniki.',
    searchUnlockBackBtn: 'Wróć do Obserwowanych',

    codeLabel: 'Przepisz ten kod',
    codeNew: 'Nowy kod',
    codeInputPlaceholder: 'Przepisuj kod tutaj, ręcznie',
    codePasteBlocked: 'Wklejanie zablokowane — przepisz znaki ręcznie',
    codeMismatch: 'To nie zgadza się z kodem. Popraw zaznaczony znak.',
    codeCharsCount: (current, target) => `${current} / ${target}`,
    codeCloseLabel: 'Zamknij',

    gateTitle: 'Chwila',
    gateSubtitle: 'Po co tu wchodzisz?',
    gateCountdown: (seconds) => `Otworzy się za ${seconds} s`,
    gateContinue: 'Wchodzę',
    blockLeave: 'Wyjdź ze strony',
    limitTitle: 'Na dziś wystarczy',
    limitDesc: (minutes) =>
      `Dzisiejszy limit ${minutes} min jest już wykorzystany. Strona otworzy się ponownie po północy.`,
    quietTitle: 'Ciche godziny',
    quietDesc: (until) => `Strona jest zamknięta do ${until}.`,
    passBtn: (minutes) => `Potrzebuję jeszcze ${minutes} minut`,
    passModalTitle: (minutes) => `Jeszcze ${minutes} minut`,
    passModalSubtitle: (length) =>
      `Przepisz ${length} znaków poniżej. Każda przepustka wzięta dzisiaj wydłuża następny kod.`,
    passConfirmBtn: 'Otwórz stronę',
    passGrantedToast: (minutes) => `Otwarte na ${minutes} minut`,
    passPill: (mins, secs) => `Przepustka · ${clock(mins, secs)}`,
    passEndNow: 'Zakończ teraz',

    followingViewAll: 'Zobacz wszystkich obserwowanych',
    followingHide: 'Ukryj listę obserwowanych',

    keepPlayingTitle: 'Graj dalej w tle',
    keepPlayingDesc: 'Film gra dalej po zmianie karty lub zminimalizowaniu okna (zadziała po odświeżeniu karty)',

    disarmTitleOff: 'Zanim wyłączysz',
    disarmTitleLoosen: 'Zanim poluzujesz',
    disarmReasonOff: 'Za chwilę wyłączysz całą ochronę.',
    disarmReasonLoosen: (minutes) =>
      `Za chwilę poluzujesz blokadę. Potem ustawienia będą otwarte przez ${minutes} minuty.`,
    disarmRound: (round) => `To ${round}. raz dzisiaj, więc tekst jest dłuższy.`,
    disarmSubtitle: (rewind) =>
      `Pierwsza litera jest od razu, każda następna co sekundę. Przepisz tekst ręcznie. Pomyłka cofa ${rewind} liter.`,
    disarmBack: 'Zostaw włączone',
    disarmNewPhrase: 'Inny tekst, od nowa',
    disarmPlaceholder: 'Przepisuj tutaj',
    disarmPasteBlocked: 'Wklejanie nic nie da. Każda litera ma przyjść z klawiatury.',
    disarmTypo: (rewind) => `Cofnięte o ${rewind} liter.`,
    disarmProgress: (ready, total) => `odsłonięte ${ready}/${total}`,
    disarmProgressLabel: 'Odsłonięte litery',
    disarmWait: 'Najpierw cały tekst',
    disarmHold: (seconds) => `Przytrzymaj ${seconds} sekundy`,
    disarmHolding: 'Trzymaj…',
    disarmReady: 'Tekst gotowy. Przytrzymaj przycisk.',
    disarmTypeAlong: 'Możesz pisać dalej.',
    disarmUnlocking: 'Następna litera za moment.',
    disarmHint: (minutes) => `Około ${minutes} min. Zamknięcie okna kasuje próbę.`,
    disarmPowerHint: 'Najpierw poprosi o przepisanie zdania',
    disarmPhrases: [
      'Chcę z powrotem nieskończony feed, chociaż tylko na dziś.',
      'Wyłączam tę blokadę, bo wolę teraz po prostu scrollować.',
      'Jeszcze jeden film jest tylko wymówką, a nie moim planem.',
      'Oddaję uwagę algorytmowi i dobrze wiem, że właśnie to robię.',
    ],
  },
};

export function getT(lang: Language = 'en'): TranslationStrings {
  return translations[lang] || translations.en;
}
