@echo off
title Blokada TikToka - Chrome Runner (Wersja Rozszerzenia)
color 0b
echo =======================================================
echo          BUDOWANIE WTYCZKI DLA GOOGLE CHROME
echo =======================================================
echo.
echo Budowanie czystej wersji produkcyjnej oraz paczki ZIP...
echo.
call npm run zip
echo.
echo =======================================================
echo Gotowe! Jak zainstalowac lokalnie w Google Chrome:
echo   1. Otworz Chrome i wejdz na strone: chrome://extensions
echo   2. Wlacz "Tryb programisty" (Developer mode) w prawym gornym rogu.
echo   3. Kliknij przycisk "Zaladuj rozpakowane" (Load unpacked).
echo   4. Wybierz folder: .output\chrome-mv3
echo.
echo Wersja do Google Web Store (ZIP) znajduje sie w:
echo   .output\tiktokunhook-1.3.5-chrome.zip
echo =======================================================
pause
