import { defineBackground } from 'wxt/sandbox';
import { getSettings, saveSettings, clearLegacyStorage, updateGuardState } from '@/utils/storage';
import { SETUP_WINDOW_MS } from '@/utils/guard';
import { BRAND } from '@/utils/brand';

export default defineBackground(() => {
  /**
   * Po instalacji/aktualizacji zapisujemy scalone ustawienia, zeby nowe
   * opcje dodane w nowszej wersji od razu maja zapisana wartosc domyslna.
   * getSettings() samo w sobie wypelnia brakujace klucze, wiec ten zapis jest
   * bezpieczny i nie nadpisuje zadnego wyboru uzytkownika.
   */
  const migrateDefaults = async () => {
    try {
      await saveSettings(await getSettings());
    } catch (err) {
      console.error(`${BRAND.logPrefix} Settings migration failed:`, err);
    }
  };

  browser.runtime.onInstalled.addListener((details) => {
    void migrateDefaults();
    // Cache z poprzednich wersji czyscimy RAZ przy instalacji/aktualizacji.
    // Wczesniej robil to content script, czyli na kazdym zaladowaniu karty.
    void clearLegacyStorage();

    // Zamek jest domyślnie włączony. Bez tego okna nowy użytkownik musiałby
    // przepisywać zdanie już przy pierwszym dopasowywaniu ustawień do siebie.
    if (details.reason === 'install') {
      void updateGuardState({ editUntil: Date.now() + SETUP_WINDOW_MS });
    }
  });

  // Przy starcie przegladarki migracja nie jest potrzebna - storage juz jest
  // spojne, a zapisywanie przy kazdym uruchomieniu tylko mnozylo operacje I/O.
});
