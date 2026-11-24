import { defineContentScript } from 'wxt/sandbox';
import { readKeepPlayingCache } from '@/utils/keep-playing';

/**
 * Strona sama zatrzymuje film, gdy karta traci widoczność (Page Visibility API).
 * Żeby to wyłączyć, trzeba podmienić to API dla skryptów STRONY, a te działają
 * w innym świecie JS niż zwykły content script.
 *
 * Poprzednia wersja wstrzykiwała w tym celu <script> z kodem w treści. Polityka
 * CSP strony nie dopuszcza skryptów inline, więc przeglądarka go odrzucała
 * i opcja nie działała. Content script zadeklarowany w świecie MAIN nie
 * podlega CSP strony.
 */
export default defineContentScript({
  matches: ['*://*.tiktok.com/*'],
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    if (!readKeepPlayingCache()) return;

    Object.defineProperty(Document.prototype, 'hidden', { get: () => false, configurable: true });
    Object.defineProperty(Document.prototype, 'visibilityState', {
      get: () => 'visible',
      configurable: true,
    });
    document.hasFocus = () => true;

    const block = (event: Event) => event.stopImmediatePropagation();
    document.addEventListener('visibilitychange', block, true);
    document.addEventListener('webkitvisibilitychange', block, true);
    // Tylko utrata fokusu przez okno. Zdarzenia blur pól formularzy też
    // przechodzą tędy w fazie przechwycenia i muszą dotrzeć do strony.
    window.addEventListener(
      'blur',
      (event) => {
        if (event.target === window) event.stopImmediatePropagation();
      },
      true
    );
  },
});
