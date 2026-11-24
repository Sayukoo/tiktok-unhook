import { defineConfig } from 'wxt';
import { BRAND } from './utils/brand';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: ({ browser }) => ({
    // Nazwa i opis są tłumaczone (public/_locales), bo tylko wtedy sklep
    // pozwala dodać osobny polski opis i grafiki. Wersja angielska musi być
    // zgodna z BRAND.storeName / BRAND.storeSummary - pilnuje tego npm test.
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    // Wersja pochodzi z package.json - WXT wstawia ja sam. Wczesniej byla
    // tutaj wpisana recznie, przez co podbicie wersji w package.json
    // przepuszczalo sklep ze stara wersja w manifestcie.
    permissions: ['storage'],
    host_permissions: ['*://*.tiktok.com/*'],
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              // Identyfikator zostaje stary: zmiana odcielaby obecnych uzytkownikow
              // Firefoksa od aktualizacji. Trafia tylko do paczki dla Firefoksa
              // i nie pojawia sie w nazwie ani opisie dodatku.
              id: 'tiktok-unhook@custom.addon',
              strict_min_version: '140.0',
              data_collection_permissions: {
                required: ['none'],
              },
            } as any,
            gecko_android: {
              strict_min_version: '142.0',
            } as any,
          },
        }
      : {}),
    icons: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
    action: {
      default_title: BRAND.name,
      default_popup: 'popup/index.html',
      default_icon: {
        16: 'icon-16.png',
        32: 'icon-32.png',
        48: 'icon-48.png',
        128: 'icon-128.png',
      },
    },
  }),
  zip: {
    // Paczka źródeł dla AMO: grafiki i film promocyjny nie są do niczego
    // potrzebne przy budowaniu, a ważą kilkanaście MB.
    excludeSources: ['promo/**'],
  },
  runner: {
    startUrls: ['https://www.tiktok.com'],
  },
});
