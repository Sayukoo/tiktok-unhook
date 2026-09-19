# 🛡️ TikTok Unhook - Distraction-Free Focus Mode

A modern browser extension for **Firefox** & **Chrome** built with **WXT (React + TypeScript + Tailwind CSS)**. It removes addictive algorithmic feeds, vanity metrics, comments, and distractions from TikTok, allowing you to regain control over your attention and browse intentionally.

Available in **English (Default)** and **Polish**.

---

## ✨ Features

* 🚫 **Hide "For You"** – Removes only the For You button from the sidebar; the feed itself stays reachable.
* 👤 **Direct Profile Landing** – Opening tiktok.com takes you straight to your profile instead of the For You feed.
* 🔒 **Search Lock** – Requires typing 30 random characters before search opens, for 5 minutes at a time.
* 👥 **Hide Suggested Accounts** – Keeps only your followed creators in the sidebar.
* 💬 **Hide Comments Section** – Blocks comment threads and comment loading.
* ❤️ **Hide Likes & Vanity Metrics** – Removes heart counts, shares, and metric anxiety.
* 🛍️ **Hide Shop & Ads** – Eliminates TikTok Shop badges and promoted videos.
* 🪙 **Hide "Get Coins" & "Get App"** – Removes coin top-up prompts and mobile app download nags.
* 🧭 **Hide "Explore" Tab** – Hides the Explore button and trending page.
* 📝 **Hide Descriptions & Sounds** – Reveals descriptions only when hovering over a video.
* 👥 **Collapse "Following accounts" List** – The sidebar shows only a "View all" button; the list of followed creators stays hidden until you click it.
* 🚫 **Hide "Friends" Tab** – Removes the Friends feed and its sidebar button.
* 🔥 **Viral Only Filter** – Automatically skips non-viral videos in your Following feed.
* ⚡ **Master Power Toggle (ON/OFF)** – Quickly toggle all protections on or off with a single click.
* 🌐 **Bilingual (EN / PL)** – Full English and Polish localization with instant toggle.
* 🌓 **Dark & Light Mode** – Beautiful UI matching your preference.

---

## 🚀 Development & Build

### 1. Dev Mode (Firefox):
```bash
npm run dev:firefox
```

### 2. Build for Firefox:
```bash
npm run build:firefox
```

### 3. Package ZIP for addons.mozilla.org (AMO):
```bash
npm run zip:firefox
```
The output zip archive will be generated in `.output/`.
