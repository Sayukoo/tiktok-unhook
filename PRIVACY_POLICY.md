# Privacy Policy — TikTok Unhook

**Effective date:** September 28, 2026

TikTok Unhook is an independent, open-source browser extension that provides a
distraction-free focus mode for TikTok. It hides feeds, comments, metrics,
promotions, and other interface elements selected by the user.

The extension does not operate an analytics, advertising, or data-collection
server. The developer does not receive data from the extension.

## Data the extension handles

The extension handles the following information only to provide its focus-mode
features:

* **Settings:** Feature toggles, theme, language, and viral-filter thresholds
  are stored through the browser extension storage API. The extension writes a
  local copy using `storage.local` and may also use `storage.sync` when the
  browser provides it. If browser sync is enabled, the browser may synchronize
  these settings through its own sync service. The developer does not receive
  or control that browser-managed synchronization.
* **Local focus statistics:** The extension may store a date, total viewing
  seconds, video count, and the time and length of the last session in
  `storage.local` so the focus UI can show session information. These values
  remain local to the browser.
* **Interface state:** A few non-personal interface and playback preferences
  are stored in browser `localStorage`. A temporary search-unlock expiry time
  is stored in `sessionStorage`.
* **TikTok page content:** The content script reads the current TikTok URL and
  page DOM to hide or modify the interface requested by the user. This
  processing happens in the browser. The extension does not build a browsing
  history, retain page content, or send TikTok page data to the developer.
* **Search challenge input:** When the optional search challenge is enabled,
  the challenge text is checked locally in the page. The entered text is not
  stored, recorded, or transmitted by the extension.

The extension does not collect or retain names, email addresses, passwords,
authentication data, payment data, private communications, precise location,
or a history of the user's searches. It does not record keystrokes.

## Permissions

* **`storage`** — Stores the settings and local focus statistics described
  above.
* **`*://*.tiktok.com/*`** — Runs the content script only on TikTok pages so
  it can apply CSS and DOM changes selected by the user. The extension does
  not run on unrelated websites.

## Sharing, tracking, and third-party services

The extension contains no analytics, tracking pixels, telemetry, or
advertising network. It does not sell, share, or transmit extension data to
the developer or other third parties, and it does not use data for
personalized advertising or profiling.

The popup may contain an optional link to a third-party donation website. If
the user follows that link, the third party processes the visit under its own
privacy policy. TikTok separately processes activity on TikTok under TikTok's
own terms and privacy policy.

## Retention and deletion

Settings and focus statistics remain in browser storage until the user changes
or removes them. Uninstalling the extension normally removes its extension
storage. The small page-local values used for playback and interface state may
remain in TikTok or extension site storage until the user clears that
website's data through the browser.

## Open-source code

The source code is publicly available for inspection at:
[https://github.com/Sayukoo/tiktok-unhook](https://github.com/Sayukoo/tiktok-unhook)

## Contact

For questions about this policy, open an issue at:
[https://github.com/Sayukoo/tiktok-unhook/issues](https://github.com/Sayukoo/tiktok-unhook/issues)

TikTok Unhook is an independent project and is not affiliated with, endorsed
by, or sponsored by TikTok or ByteDance Ltd.
