import { TikTokUnhookSettings } from './storage';

/**
 * Ukrywa element RAZEM z kontenerem, zeby po usunieciu pozycji z menu
 * nie zostawala pusta dziura w layoucie.
 */
const HIDE_HARD = `
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  overflow: hidden !important;
`;

/** Atrybut, ktorym content script oznacza bezpieczne opakowanie ukrytej pozycji. */
export const WRAPPER_HIDE_ATTR = 'data-unhook-hide';

export interface WrappedHideRule {
  selector: string;
  isEnabled: (s: TikTokUnhookSettings) => boolean;
}

/**
 * Pozycje, po ktorych zostaje pusta dziura, jesli ukryjemy sam element.
 * Opakowanie wyznacza content script (markHiddenWrappers) - sprawdza,
 * ze kontener nie zawiera NICZEGO poza ukrywana pozycja.
 *
 * Tego kroku NIGDY nie robimy w CSS przez `div:has(...)`. Poprzednia wersja
 * generowala tu m.in.
 *   div:has(> div[class*="DivSideNavContainer"] a[href="/"])
 * co trafialo w DivSideNavPlaceholderContainer, czyli w CALY lewy pasek -
 * wlaczenie "ukryj Dla Ciebie" kasowalo z ekranu cale menu.
 */
export const WRAPPED_HIDE_RULES: WrappedHideRule[] = [
  {
    // href="/" to obecny link "Dla Ciebie"; :not() chroni logo TikToka,
    // ktore siedzi w tym samym kontenerze i ma dokladnie ten sam href.
    selector:
      '[data-e2e="nav-foryou"], a[href="/foryou"], ' +
      '[class*="DivSideNavContainer"] a[href="/"]:not([data-e2e="tiktok-logo"]):not([class*="LinkLogo"])',
    isEnabled: (s) => s.hideForYouFeed,
  },
  {
    selector: '[data-e2e="nav-explore"], a[href="/explore"], a[href^="/explore?"]',
    isEnabled: (s) => s.hideExploreFeed,
  },
  {
    selector: '[data-e2e="nav-friends"], a[href="/friends"], a[href^="/friends?"]',
    isEnabled: (s) => s.hideFriends,
  },
  {
    selector: '[data-e2e="nav-live"], a[href="/live"], a[href^="/live/"], a[href^="/live?"]',
    isEnabled: (s) => s.hideLiveSidebar,
  },
  {
    selector: '[data-e2e="nav-shop"], a[href="/shop"], a[href^="/shop/"], a[href^="/shop?"]',
    isEnabled: (s) => s.hideShop,
  },
  {
    // "Zdobadz Monety" ma stabilne id/data-e2e, "Zdobadz aplikacje" juz nie -
    // ten drugi content script oznacza po tresci przycisku (data-unhook-promo).
    selector:
      '[data-e2e="top-right-action-bar-get-coin"], #top-right-get-coins-button, ' +
      '[data-e2e="get-coins-button"], [data-e2e="get-app-button"], ' +
      '[data-e2e="nav-get-coins"], [data-e2e="nav-get-app"], ' +
      'a[href*="/coin"], a[href*="coin_wallet"], a[href*="/app-download"], ' +
      'a[href*="/mobile-app"], a[href*="tiktok.com/download"], ' +
      '[data-unhook-promo="1"]',
    isEnabled: (s) => s.hideGetCoinsApp || s.hideHeaderPromos,
  },
];

/**
 * Generuje reguly CSS usuwajace rozpraszacze z TikToka.
 */
export function generateStyles(settings: TikTokUnhookSettings): string {
  if (!settings.masterEnabled) {
    return '/* TikTok Unhook: wylaczony */';
  }

  const rules: string[] = [];

  // Animacja uzywana przez modale wstrzykiwane przez content script.
  rules.push(`
    @keyframes unhookFadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
  `);

  // 0. Opakowania wskazane przez content script - jedyny bezpieczny sposob
  //    na zwiniecie dziury po usunietej pozycji menu.
  rules.push(`
    [${WRAPPER_HIDE_ATTR}="1"] {
      ${HIDE_HARD}
    }
  `);

  // 1. Same pozycje z WRAPPED_HIDE_RULES - CSS dziala juz przy document_start,
  //    zanim content script zdazy oznaczyc opakowania.
  for (const rule of WRAPPED_HIDE_RULES) {
    if (rule.isEnabled(settings)) {
      rules.push(`${rule.selector} { ${HIDE_HARD} }`);
    }
  }

  // 1b. Wygaszenie feedu WYLACZNIE na czas oczekiwania na przekierowanie,
  //     zeby strona glowna nie mrugnela filmem przed skokiem na profil.
  if (settings.redirectToProfile) {
    rules.push(`
      html.unhook-home-feed [data-e2e="feed-video"],
      html.unhook-home-feed [data-e2e="feed-container"],
      html.unhook-home-feed [data-e2e="recommend-list-item-container"],
      html.unhook-home-feed [id^="main-content-homepage_hot"] {
        display: none !important;
      }
    `);
  }

  // 2. ZAWARTOSC STRONY "EKSPLORUJ"
  //    Uwaga: TikTok uzywa id "main-content-explore_page", nie "main-content-explore".
  if (settings.hideExploreFeed) {
    rules.push(`[id^="main-content-explore"] { ${HIDE_HARD} }`);
  }

  // 3. ZAWARTOSC STRONY "ZNAJOMI" (id: "main-content-friends_page")
  if (settings.hideFriends) {
    rules.push(`[id^="main-content-friends"] { ${HIDE_HARD} }`);
  }

  // 4. PODKRESLENIE "OBSERWOWANI" W MENU
  if (settings.highlightFollowingAccounts) {
    rules.push(`
      [data-e2e="nav-following"],
      [class*="DivSideNavContainer"] a[href="/following"] {
        font-weight: 700 !important;
        color: #25F4EE !important;
      }
    `);
  }

  // 5. ZWARTE LEWE MENU - tylko wewnatrz wlasciwej nawigacji.
  //    Wczesniej regula lapala tez [class*="DivSideNavContainer"] ul,
  //    czyli liste obserwowanych kont.
  rules.push(`
    [class*="DivMainNavContainer"] ul,
    [class*="DivMainNavContainer"] li {
      gap: 2px !important;
      row-gap: 2px !important;
    }
  `);

  // 6. LICZNIKI (osobno per typ - nie ruszaja ikon ani profili)
  if (settings.hideLikeCount) {
    rules.push(`[data-e2e$="like-count"] { display: none !important; }`);
  }
  if (settings.hideCommentCount) {
    rules.push(`[data-e2e$="comment-count"] { display: none !important; }`);
  }
  if (settings.hideShareCount) {
    rules.push(`[data-e2e$="share-count"] { display: none !important; }`);
  }
  if (settings.hideLikeCount && settings.hideCommentCount && settings.hideShareCount) {
    rules.push(`
      [class*="SectionActionBarContainer"] strong[class*="StrongText"],
      [class*="DivActionItemContainer"] strong[class*="StrongText"] {
        display: none !important;
      }
    `);
  }

  // 6b. PRZYCISKI AKCJI PRZY FILMIE (lajk / komentarz / udostepnij)
  if (settings.hideActionButtons) {
    rules.push(`
      [class*="SectionActionBarContainer"],
      [class*="DivActionBarWrapper"] {
        display: none !important;
      }
    `);
  }

  // 7. KOMENTARZE
  //    Sam [class*="DivCommentListContainer"] zostawial naglowek panelu
  //    i pole "dodaj komentarz" - trzeba ukryc caly panel boczny.
  if (settings.hideComments) {
    rules.push(`
      [data-e2e="comment-list"],
      [data-e2e="search-comment-container"],
      [data-e2e="comment-level-1"],
      [data-e2e="browse-comment-list"],
      [class*="DivCommentSidebarTransitionWrapper"],
      [class*="SectionCommentSidebarContainer"],
      [class*="DivCommentListContainer"],
      [class*="DivCommentContainer"],
      [class*="DivCommentTray"],
      [class*="DivCommentWrapper"],
      [class*="DivCommentDrawer"] {
        display: none !important;
      }
    `);
  }

  // 8. SKLEP (pozycja menu jest w WRAPPED_HIDE_RULES)
  if (settings.hideShop) {
    rules.push(`[class*="ShopAnchor"] { ${HIDE_HARD} }`);
  }

  // 9. REKLAMY
  if (settings.hideAds) {
    rules.push(`
      [data-e2e="ad-badge"],
      [data-e2e="sponsored-badge"],
      [class*="DivAdvertiserContainer"] {
        display: none !important;
      }
    `);
  }

  // 10. "GET COINS" I "GET APP" - kontenery ze starszych ukladow.
  //     Same przyciski obsluguje WRAPPED_HIDE_RULES.
  if (settings.hideGetCoinsApp || settings.hideHeaderPromos) {
    rules.push(`
      [class*="DivGetCoins"],
      [class*="DivGetAppContainer"],
      [class*="DivDownloadAppContainer"],
      [class*="DivCoinsContainer"] {
        ${HIDE_HARD}
      }
    `);
  }

  // 11. TRANSMISJE LIVE W MENU (pozycja jest w WRAPPED_HIDE_RULES)
  if (settings.hideLiveSidebar) {
    rules.push(`[class*="DivLiveItem"] { ${HIDE_HARD} }`);
  }

  // 12. SUGEROWANE (OBCE) KONTA
  if (settings.hideSuggestedAccounts) {
    rules.push(`
      [data-e2e="suggest-accounts"],
      [data-e2e="suggested-accounts"],
      [class*="DivSuggestedAccountsContainer"],
      [class*="DivSuggestedAccountContainer"] {
        display: none !important;
      }
    `);
  }

  // 13. LISTA "FOLLOWING ACCOUNTS" W LEWYM MENU
  //     Domyslnie zwinieta - odslania sie dopiero po kliknieciu "View all".
  //     Atrybuty ustawia content script (applyFollowingSectionCollapse).
  if (settings.hideFollowingSidebarList) {
    rules.push(`
      [data-unhook-following-block="1"]:not([data-unhook-following-expanded="1"])
        > *:not([data-unhook-following-keep="1"]) {
        display: none !important;
      }
    `);
  }

  // 14. OBSERWUJACY (licznik + zakladka na profilu)
  if (settings.hideFollowers) {
    rules.push(`
      [data-e2e="followers-count"],
      a[href$="/followers"] {
        display: none !important;
      }
    `);
  }

  // 15. OPISY I DZWIEKI
  if (settings.hideDescriptions) {
    rules.push(`
      [data-e2e="video-desc"],
      [data-e2e="video-music"] {
        opacity: 0 !important;
        transition: opacity 0.15s ease !important;
      }
      [data-e2e="feed-video"]:hover [data-e2e="video-desc"],
      [data-e2e="feed-video"]:hover [data-e2e="video-music"] {
        opacity: 0.85 !important;
      }
    `);
  }

  // 16. STOPKA MENU
  if (settings.hideSidebarFooter) {
    rules.push(`
      [data-e2e="footer-container"],
      [class*="DivFooterContainer"],
      [class*="SubMainNavFooterContainer"],
      [class*="DivSideNavContainer"] footer {
        display: none !important;
      }
    `);
  }

  return rules.join('\n');
}
