import { TikTokUnhookSettings } from './storage';

/**
 * Generuje niezawodne reguły CSS trwale usuwające "For You", "Eksploruj", komentarze i liczniki
 */
export function generateStyles(settings: TikTokUnhookSettings): string {
  if (!settings.masterEnabled) {
    return '/* TikTok Unhook: Wyłączony */';
  }

  const rules: string[] = [];

  // 1. CAŁKOWITE USUNIĘCIE PRZYCISKU I KANAŁU "FOR YOU" (Dla Ciebie)
  if (settings.hideForYouFeed) {
    rules.push(`
      /* Ukryj 'For You' w menu bocznym (logo zostaje - kliknięcie i tak przekierowuje) */
      [data-e2e="nav-foryou"],
      a[href="/foryou"],
      div[class*="DivSideNavContainer"] a[href="/"] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }

      /* Jeśli strona to feed główny - wygaś wideo */
      html.unhook-home-feed [data-e2e="feed-video"],
      html.unhook-home-feed [data-e2e="feed-container"],
      html.unhook-home-feed [data-e2e="recommend-list-item-container"],
      html.unhook-home-feed div[class*="DivFeedContainer"],
      html.unhook-home-feed #main-content-homepage_hot {
        display: none !important;
      }
    `);
  }

  // 2. CAŁKOWITE USUNIĘCIE ZAKŁADKI "EKSPLORUJ"
  if (settings.hideExploreFeed) {
    rules.push(`
      a[href*="/explore"],
      [data-e2e="nav-explore"],
      #main-content-explore {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }
    `);
  }

  // 3. WIDOCZNOŚĆ DLA "FOLLOWING" (Obserwowani na samej górze!)
  rules.push(`
    /* Podkreślenie przycisku Following w menu */
    a[href*="/following"],
    [data-e2e="nav-following"] {
      font-weight: 700 !important;
      color: #25F4EE !important;
    }
  `);

  // 4. USUNIĘCIE LICZNIKÓW (precyzyjnie per typ - nie rusza ikon, followerów ani profili)
  if (settings.hideLikeCount) {
    rules.push(`
      [data-e2e$="like-count"] {
        display: none !important;
      }
    `);
  }

  if (settings.hideCommentCount) {
    rules.push(`
      [data-e2e$="comment-count"] {
        display: none !important;
      }
    `);
  }

  if (settings.hideShareCount) {
    rules.push(`
      [data-e2e$="share-count"] {
        display: none !important;
      }
    `);
  }

  /* Fallback klasowy tylko gdy ukrywamy WSZYSTKIE liczniki akcji */
  if (settings.hideLikeCount && settings.hideCommentCount && settings.hideShareCount) {
    rules.push(`
      div[class*="DivActionItemContainer"] strong[class*="StrongText"] {
        display: none !important;
      }
    `);
  }

  // 5. CAŁKOWITE USUNIĘCIE KOMENTARZY
  if (settings.hideComments) {
    rules.push(`
      [data-e2e="comment-list"],
      [data-e2e="search-comment-container"],
      [data-e2e="comment-level-1"],
      [data-e2e="browse-comment-list"],
      div[class*="DivCommentListContainer"],
      div[class*="DivCommentContainer"],
      div[class*="DivCommentTray"],
      div[class*="DivCommentWrapper"],
      div[class*="DivCommentDrawer"] {
        display: none !important;
      }
    `);
  }

  // 6. USUNIĘCIE SKLEPU, REKLAM, "GET COINS" I "GET APP"
  if (settings.hideShop) {
    rules.push(`
      a[href*="/shop"],
      [data-e2e="nav-shop"],
      div[class*="ShopAnchor"] {
        display: none !important;
      }
    `);
  }

  if (settings.hideAds || settings.hideHeaderPromos) {
    rules.push(`
      a[href*="/coin"],
      a[href*="/coins"],
      [data-e2e="get-coins-button"],
      [data-e2e="get-app-button"],
      [data-e2e="ad-badge"],
      [data-e2e="sponsored-badge"],
      div[class*="DivHeaderRight"] a[href*="coin"],
      div[class*="DivHeaderRight"] button[class*="Button"] {
        display: none !important;
      }
    `);
  }

  // 7. USUNIĘCIE TRANSMISJI LIVE Z MENU BOCZNEGO
  if (settings.hideLiveSidebar) {
    rules.push(`
      a[href*="/live"],
      [data-e2e="nav-live"],
      div[class*="DivLiveItem"] {
        display: none !important;
      }
    `);
  }

  // 8. USUNIĘCIE SUGEROWANYCH OBCYCH KONT (Zostają TYLKO Twoje Following!)
  if (settings.hideSuggestedAccounts) {
    rules.push(`
      [data-e2e="suggest-accounts"],
      [data-e2e="suggested-accounts"],
      div[class*="DivSuggestedAccountsContainer"] {
        display: none !important;
      }
    `);
  }

  // 8b. UKRYCIE OBSERWUJĄCYCH (licznik + zakładka na profilu)
  if (settings.hideFollowers) {
    rules.push(`
      [data-e2e="followers-count"],
      a[href$="/followers"] {
        display: none !important;
      }
    `);
  }

  // 9. OPISY I STOPKA PRAWNA
  if (settings.hideDescriptions) {
    rules.push(`
      [data-e2e="video-desc"],
      [data-e2e="video-music"] {
        opacity: 0 !important;
      }
      [data-e2e="feed-video"]:hover [data-e2e="video-desc"],
      [data-e2e="feed-video"]:hover [data-e2e="video-music"] {
        opacity: 0.85 !important;
      }
    `);
  }

  if (settings.hideSidebarFooter) {
    rules.push(`
      [data-e2e="footer-container"],
      div[class*="DivFooterContainer"],
      div[class*="DivSideNavContainer"] footer {
        display: none !important;
      }
    `);
  }

  return rules.join('\n');
}
