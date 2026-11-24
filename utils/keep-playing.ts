// Wspólne dla content scriptu (zapisuje) i skryptu w świecie strony (czyta).
// Skrypt w świecie strony nie ma dostępu do storage rozszerzenia, więc
// ustawienie trafia do niego przez localStorage strony.
export const KEEP_PLAYING_CACHE_KEY = 'unhook_keep_playing_v1';

export function readKeepPlayingCache(): boolean {
  try {
    const value = localStorage.getItem(KEEP_PLAYING_CACHE_KEY);
    // Brak wpisu = pierwsza wizyta, a domyślnie opcja jest włączona.
    return value === null ? true : value === '1';
  } catch {
    return true;
  }
}
