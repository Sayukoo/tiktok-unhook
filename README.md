# 🛡️ TikTok Unhook - Distraction-Free Focus Mode

[![Firefox Add-on](https://img.shields.io/amo/v/tiktok-unhook-distraction-free?label=Firefox%20Add-on&logo=firefox-browser&color=orange)](https://addons.mozilla.org/en-US/firefox/addon/tiktok-unhook-distraction-free/)
[![Users](https://img.shields.io/amo/users/tiktok-unhook-distraction-free?color=blue)](https://addons.mozilla.org/en-US/firefox/addon/tiktok-unhook-distraction-free/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#)

> 🦊 **Install for Firefox (Desktop & Android):**  
> 👉 **[Download from Mozilla Add-ons (AMO)](https://addons.mozilla.org/en-US/firefox/addon/tiktok-unhook-distraction-free/)**

> 📄 **[Privacy Policy](PRIVACY_POLICY.md)**

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

### Google Chrome (Manifest V3)
* **Dev Mode (hot-reload):**
  ```bash
  npm run dev
  ```
  *(or double-click `URUCHOM_DEV_CHROME.bat`)*
* **Build (unpacked extension):**
  ```bash
  npm run build
  ```
  Output folder: `.output/chrome-mv3` (load into `chrome://extensions`).
* **Package ZIP for Chrome Web Store:**
  ```bash
  npm run zip
  ```
  *(or double-click `URUCHOM_WTYCZKE_CHROME.bat`)*
  Generates ready-to-upload archive in `.output/tiktokunhook-*-chrome.zip`.

---

### Mozilla Firefox (Manifest V2)
* **Dev Mode:**
  ```bash
  npm run dev:firefox
  ```
  *(or double-click `URUCHOM_DEV_FIREFOX.bat`)*
* **Build:**
  ```bash
  npm run build:firefox
  ```
  *(or double-click `URUCHOM_WTYCZKE_FIREFOX.bat`)*
* **Package ZIP for addons.mozilla.org (AMO):**
  ```bash
  npm run zip:firefox
  ```
  Output archive in `.output/`.
