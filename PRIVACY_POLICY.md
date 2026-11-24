# Privacy Policy — Offhook

**Effective date:** November 23, 2026

Offhook is an independent, open-source browser extension that provides a focus
mode for TikTok on desktop (tiktok.com). It hides feeds, comments, counters,
promotions and other interface elements selected by the user, and can limit
the time spent on the site. It is not affiliated with, endorsed by, or
sponsored by TikTok.

The extension does not operate an analytics, advertising, or data-collection
server. The developer does not receive any data from the extension.

## Data the extension handles

The extension handles the following information only to provide its features.
All of it stays in the user's browser.

* **Settings:** Feature toggles, limits (daily minutes, quiet hours, entry
  pause), theme, language, and filter thresholds are stored through the
  browser extension storage API. The extension writes a local copy using
  `storage.local` and also uses `storage.sync` when the browser provides it.
  If browser sync is enabled, the browser may synchronize these settings
  through its own sync service. The developer does not receive or control
  that browser-managed synchronization.
* **Local usage counters:** To enforce the daily limit and show today's usage,
  the extension stores the current date, the number of seconds the supported
  site was open in a visible tab, a video count, and the time and length of
  the last session in `storage.local`.
* **Lock state:** The extension stores in `storage.local` until when settings
  may be edited, until when a "5 more minutes" pass is valid, and how many
  unlock rituals and passes were completed on the current day. These are
  timestamps and small counters.
* **Page-local flags:** A few non-personal values are stored in the supported
  website's `localStorage` (whether background playback is enabled; whether
  the site was covered on the previous visit, so the cover can appear before
  the page loads) and `sessionStorage` (search-unlock expiry time; whether the
  entry pause was already passed in this tab; whether the session summary was
  shown; a short-lived redirect-loop guard). The popup stores which settings
  sections are expanded in its own `localStorage`.
* **Page content:** The content script reads the current URL and page
  structure of the supported website to hide or modify the interface as
  requested by the user. This processing happens in the browser. The
  extension does not build a browsing history, retain page content, or send
  page data anywhere.
* **Typed codes and sentences:** The codes and sentences the user types to
  unlock search, take a pass, or change protected settings are compared
  locally with the text shown on screen. The typed text is not stored,
  recorded, or transmitted.

The extension does not collect or retain names, email addresses, passwords,
authentication data, payment data, private communications, precise location,
or a history of the user's searches. It does not record keystrokes.

## Permissions

* **`storage`** — Stores the settings, usage counters and lock state
  described above.
* **Host access to one website** (listed in the browser's install prompt) —
  Runs the content scripts only on that website so they can apply the changes
  selected by the user. The extension does not run on any other website.

## Sharing, tracking, and third-party services

The extension contains no analytics, tracking pixels, telemetry, or
advertising network, and makes no network requests of its own. It does not
sell, share, or transmit data to the developer or other third parties, and it
does not use data for personalized advertising or profiling.

The popup may contain an optional link to a third-party donation website. If
the user follows that link, the third party processes the visit under its own
privacy policy. The supported website separately processes the user's
activity there under its own terms and privacy policy.

## Retention and deletion

Settings, usage counters and lock state remain in browser storage until the
user changes or removes them. The usage counters and daily lock counters reset
each day. Uninstalling the extension removes its extension storage. The small
page-local flags may remain in the supported website's storage until the user
clears that website's data through the browser.

## Open-source code

The source code is publicly available for inspection at:
[https://github.com/Sayukoo/tiktok-unhook](https://github.com/Sayukoo/tiktok-unhook)

## Contact

For questions about this policy, open an issue at:
[https://github.com/Sayukoo/tiktok-unhook/issues](https://github.com/Sayukoo/tiktok-unhook/issues)

Offhook is an independent project and is not affiliated with, endorsed by, or
sponsored by the operator of any website it runs on. All trademarks belong to
their respective owners.
