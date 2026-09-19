import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'TikTok Unhook - Distraction-Free Focus Mode',
    description: 'Remove addictive feeds, explore tab, comments, and vanity metrics from TikTok to regain focus and browse intentionally.',
    version: '1.3.5',
    permissions: ['storage'],
    host_permissions: ['*://*.tiktok.com/*'],
    browser_specific_settings: {
      gecko: {
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
    icons: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
    action: {
      default_title: 'TikTok Unhook',
      default_popup: 'popup/index.html',
      default_icon: {
        16: 'icon-16.png',
        32: 'icon-32.png',
        48: 'icon-48.png',
        128: 'icon-128.png',
      },
    },
  },
  runner: {
    startUrls: ['https://www.tiktok.com'],
  },
});
