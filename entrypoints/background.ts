import { defineBackground } from 'wxt/sandbox';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '@/utils/storage';

export default defineBackground(() => {
  const migrateDefaults = () => {
    getSettings().then((current) => {
      saveSettings({ ...DEFAULT_SETTINGS, ...current });
    });
  };

  browser.runtime.onInstalled.addListener(migrateDefaults);
  browser.runtime.onStartup.addListener(migrateDefaults);
});
