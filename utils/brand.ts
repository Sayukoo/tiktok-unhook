// Jedno miejsce na nazwę i kolory. Manifest, popup, nakładki na stronie
// i generator grafik sklepowych czytają stąd, więc zmiana nazwy to edycja
// tego pliku i ponowne `npm run build` / `npm run promo`.
// Wyjątek: nazwa i krótki opis w sklepie leżą też w public/_locales/*/messages.json
// (wymóg przeglądarki); `npm test` sprawdza, że angielska wersja zgadza się z tym plikiem.
//
// Nazwa w interfejsie (name) nie zawiera cudzego znaku. Nazwa i krótki opis
// w sklepie zawierają go raz, w formule „for / dla” — po to, żeby dało się
// wtyczkę znaleźć. Nie zaczynają się od niego i nie wracają do starej nazwy.
export const BRAND = {
  name: 'Offhook',
  storeName: 'Offhook for TikTok: Focus Mode',
  storeSummary:
    'Distraction-free mode for TikTok. Hides the For You feed, comments and counters. Daily limit, quiet hours, hard-to-disable lock.',
  logPrefix: '[Offhook]',
  colors: {
    ink: '#0E0F13',
    surface: '#1A1C22',
    volt: '#D4FF3A',
    voltDeep: '#4D7C0F',
    ember: '#FF5A36',
  },
} as const;
