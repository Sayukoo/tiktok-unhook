@echo off
title Blokada TikToka - Firefox Runner
color 0b
echo =======================================================
echo          URUCHAMIANIE WTYCZKI BLOKADA TIKTOKA
echo =======================================================
echo.
echo Budowanie czystej wersji produkcyjnej wtyczki...
echo.
call npm run build:firefox
echo.
echo =======================================================
echo Gotowe! Wtyczke wgraj recznie w Firefoksie:
echo   1. Wpisz w pasku adresu: about:debugging#/runtime/this-firefox
echo   2. Kliknij "Load Temporary Add-on..."
echo   3. Wskaz plik: .output\firefox-mv2\manifest.json
echo =======================================================
pause
