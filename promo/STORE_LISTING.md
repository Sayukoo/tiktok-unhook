# Offhook — teksty i pliki do sklepu

Wszystko poniżej jest gotowe do wklejenia w Chrome Web Store Developer Dashboard.
Nazwa i krótki opis biorą się z paczki (`public/_locales`), więc w panelu
wypełniasz tylko długi opis, grafiki i formularz prywatności.

## Zanim wgrasz

1. **Nowa pozycja, nie aktualizacja starej.** Google napisał, że przywrócenie
   jest możliwe tylko przez nową, nienaruszającą wersję pod nową nazwą paczki.
   W panelu: „New item” i wgranie `offhook-2.0.0-chrome.zip`. Nowa pozycja
   dostanie nowe ID, więc ustawienia użytkowników ze starej się nie przeniosą.
2. **Znak w nazwie i krótkim opisie jest raz, po własnej marce.** Paczka ma
   już `Offhook for TikTok` / `Offhook dla TikTok`. Nie dopisuj starej nazwy
   produktu i nie zaczynaj żadnego pola od cudzego znaku. Grafiki i film go
   nie zawierają — zostaw je tak. Słowo na obrazku nic nie daje wyszukiwarce,
   a skarga łatwo się o nie zaczepia.
3. **Link do repozytorium zostaw.** Adres na GitHubie nadal ma starą nazwę
   i właśnie po niej ludzie oraz czaty nadal trafiają na projekt. Możesz
   wkleić go jako stronę domową i jako politykę prywatności.

## Pliki

| Pole w panelu | Plik (EN) | Plik (PL) |
| --- | --- | --- |
| Paczka | `.output/offhook-2.0.0-chrome.zip` | ta sama |
| Ikona sklepu 128x128 | `public/icon-128.png` | ta sama |
| Zrzuty ekranu 1280x800 (w tej kolejności) | `promo/en/screenshot-1-hero-1280x800.png` … `screenshot-5-clean-1280x800.png` | `promo/pl/…` |
| Mały kafelek 440x280 | `promo/en/promo-small-440x280.png` | `promo/pl/promo-small-440x280.png` |
| Duży kafelek 1400x560 | `promo/en/promo-marquee-1400x560.png` | `promo/pl/promo-marquee-1400x560.png` |
| Film (link do YouTube) | `promo/en/offhook-promo-1920x1080.mp4` | `promo/pl/offhook-promo-1920x1080.mp4` |
| Miniatura filmu na YouTube | `promo/en/video-thumbnail-1280x720.png` | `promo/pl/video-thumbnail-1280x720.png` |

Film nie ma dźwięku i na klatkach nie ma cudzej nazwy. Proponowany tytuł na YouTube:
`Offhook for TikTok: focus mode` (PL: `Offhook dla TikTok: tryb skupienia`).

Polską wersję opisu i grafik dodasz w panelu po wybraniu języka „Polish”
(jest dostępny, bo paczka ma `_locales/pl`).

## Angielski (domyślny)

**Name** (z paczki)

```
Offhook for TikTok: Focus Mode
```

**Summary** (z paczki)

```
Distraction-free mode for TikTok. Hides the For You feed, comments and counters. Daily limit, quiet hours, hard-to-disable lock.
```

**Category:** Productivity → Tools (alternatywnie Lifestyle → Well-being)

**Description**

```
Offhook is a distraction-free focus mode for TikTok on desktop (tiktok.com).

The feed is built to hook you. Offhook is how you unhook from TikTok.

It strips out the parts of the site that are designed to keep you scrolling, and adds limits that are deliberately hard to talk your way out of. Offhook is not made by TikTok and is not endorsed by TikTok.

A LOCK THAT FIGHTS BACK
Most blockers are one click away from being off. Offhook is not.
• To turn it off, or to loosen any limit, you type a sentence by hand. One letter unlocks per second, a typo rewinds eight letters, and pasting does not work.
• Then you hold a button for three seconds. One last chance to change your mind.
• Each attempt on the same day adds another sentence.
It takes about a minute. That is usually enough for the urge to pass.

THREE WAYS TO CLOSE THE DOOR
• Pause before entering: a short countdown before the site opens, once per tab.
• Daily limit: when your minutes are used up, the site is covered until midnight. Time is counted across all tabs.
• Quiet hours: the site is closed between the hours you choose, every day.

FIVE MORE MINUTES? EARN THEM
Need to get in anyway? Type a random code for a 5-minute pass. The first code has 30 characters. Every pass you take that day makes the next one longer, up to 90.

SAME SITE, LESS BAIT
Switch off what pulls you in, one toggle at a time:
• the home feed button, Explore, Friends and LIVE
• comments, like and share counters, or the action buttons altogether
• suggested accounts and follower counts
• shop, sponsored blocks, coin and "get the app" prompts
• red notification dots and the sidebar footer
• search, behind a 30-character code
• grayscale mode, so the whole site pulls less
• optional: open your own profile instead of the home feed, skip videos below your own like and comment thresholds

PRIVATE BY DESIGN
• No account, no analytics, no ads, no server.
• Settings and your daily minutes are kept in your browser's own storage. Nothing is sent to the developer.
• Open source.

GOOD TO KNOW
• Made for tiktok.com on a computer. The install prompt names that site; Offhook does nothing anywhere else.
• Like any extension, it can still be removed from the browser's extensions page. Offhook makes switching off slow and deliberate; it is not parental control.
• English and Polish.

TikTok is a trademark of its owner. Offhook is an independent project and is not affiliated with, endorsed by, or sponsored by TikTok.
```

## Polski

**Nazwa** (z paczki)

```
Offhook dla TikTok: tryb skupienia
```

**Krótki opis** (z paczki)

```
Tryb skupienia na TikToku. Ukrywa feed Dla Ciebie, komentarze i liczniki. Limit dzienny, ciche godziny i zamek trudny do wyłączenia.
```

**Opis**

```
Offhook to tryb skupienia na TikToku na komputerze (tiktok.com).

Feed ma cię złapać na haczyk. Offhook pomaga odhaczyć się od TikToka.

Zdejmuje ze strony to, co ma cię trzymać przy przewijaniu, i dodaje limity, z których celowo trudno się wykręcić. Offhooka nie zrobił TikTok i TikTok go nie poleca.

ZAMEK, KTÓRY STAWIA OPÓR
Większość blokad wyłącza się jednym kliknięciem. Offhooka nie.
• Żeby go wyłączyć albo poluzować limit, przepisujesz ręcznie zdanie. Co sekundę odblokowuje się jedna litera, literówka cofa o osiem liter, a wklejanie nie działa.
• Potem trzymasz przycisk przez trzy sekundy. Ostatnia chwila, żeby zmienić zdanie.
• Każda kolejna próba tego samego dnia to dodatkowe zdanie.
Zajmuje to około minuty. Zwykle tyle wystarcza, żeby chęć minęła.

TRZY SPOSOBY, ŻEBY ZAMKNĄĆ DRZWI
• Pauza na wejściu: krótkie odliczanie, zanim strona się otworzy, raz na kartę.
• Limit dzienny: gdy minuty się skończą, strona jest zasłonięta do północy. Czas liczy się łącznie ze wszystkich kart.
• Ciche godziny: strona jest zamknięta w wybranych godzinach, codziennie.

JESZCZE PIĘĆ MINUT? ZAPRACUJ NA NIE
Musisz wejść mimo wszystko? Przepisz losowy kod i dostajesz przepustkę na 5 minut. Pierwszy kod ma 30 znaków. Każda przepustka tego dnia wydłuża następny, aż do 90.

TA SAMA STRONA, MNIEJ PRZYNĘTY
Wyłączasz to, co cię wciąga, przełącznik po przełączniku:
• przycisk głównego feedu, Odkrywaj, Znajomi i LIVE
• komentarze, liczniki polubień i udostępnień albo całe przyciski akcji
• sugerowane konta i liczbę obserwujących
• sklep, bloki sponsorowane, zachęty do kupna monet i pobrania aplikacji
• czerwone kropki powiadomień i stopkę w panelu bocznym
• wyszukiwarkę, za kodem z 30 znaków
• skalę szarości, żeby cała strona mniej ciągnęła
• opcjonalnie: otwieranie własnego profilu zamiast feedu, pomijanie filmów poniżej ustawionych progów polubień i komentarzy

PRYWATNOŚĆ
• Bez konta, bez analityki, bez reklam, bez serwera.
• Ustawienia i dzienne minuty są trzymane w pamięci twojej przeglądarki. Nic nie trafia do autora.
• Otwarty kod.

WARTO WIEDZIEĆ
• Zrobiony pod tiktok.com na komputer. Okno instalacji podaje tę stronę; nigdzie indziej Offhook nic nie robi.
• Jak każde rozszerzenie, da się go usunąć ze strony rozszerzeń przeglądarki. Offhook sprawia, że wyłączenie jest powolne i świadome; to nie jest kontrola rodzicielska.
• Po polsku i po angielsku.

TikTok jest znakiem towarowym swojego właściciela. Offhook to niezależny projekt. Nie jest powiązany z TikTokiem, ani przez niego wspierany czy sponsorowany.
```

## Co tu jest świadomie, a czego nie ma

Skarga dotyczyła tego, że produkt nazywał się cudzą marką (`TikTok Unhook`)
w tytule, podtytule, opisie i treści. Wyszukiwarka sklepu, Google i czaty
czytają głównie tytuł i krótki opis, więc znak jest tam z powrotem, ale:

* własna nazwa jest pierwsza (`Offhook for TikTok`, nie `TikTok …`),
* w długim opisie znak pada kilka razy, tam gdzie mówi, dla jakiej strony
  wtyczka jest, plus jedno zdanie, że to nie jest produkt właściciela,
* interfejs, ikona, zrzuty i film go nie pokazują.

To nie usuwa ryzyka kolejnej skargi i nie jest poradą prawną. Pełnomocnik
może zgłosić samo „for TikTok” w tytule. Zostawione jest to, bez czego
wtyczki nie da się znaleźć, i zdjęte jest to, co wyglądało jak cudza marka.

## Zakładka „Privacy practices”

**Single purpose**

```
Offhook has one purpose: helping the user limit distraction on TikTok (tiktok.com, desktop). It hides interface elements the user chooses (the For You feed, comments, counters, promotions) and enforces limits the user sets (daily time limit, quiet hours, entry pause), protected by a typing challenge so they are not switched off on impulse. Offhook is not affiliated with TikTok.
```

**Justification: storage**

```
Stores the user's settings, today's usage counter for the daily limit, and the lock state (until when settings may be edited, until when a 5-minute pass is valid). Nothing leaves the browser.
```

**Justification: host permission**

```
The content scripts run only on tiktok.com. They hide the page elements the user selected, cover the page when a user-set limit applies, and count the time the site is open in a visible tab so the daily limit can be enforced. No page content is stored or transmitted.
```

**Remote code:** No, I am not using remote code. (Cały kod jest w paczce.)

**Data usage:** nie zaznaczaj żadnej kategorii danych; zaznacz wszystkie trzy
oświadczenia (brak sprzedaży danych, brak użycia poza głównym celem, brak
oceny zdolności kredytowej).

**Privacy policy URL:** adres pliku `PRIVACY_POLICY.md` w obecnym repozytorium.
Nazwy repozytorium nie zmieniaj — stary adres nadal zbiera wyszukiwania.

## Firefox (AMO)

Paczka: `.output/offhook-2.0.0-firefox.zip` oraz źródła `.output/offhook-2.0.0-sources.zip`.
Tu możesz zaktualizować istniejący dodatek (identyfikator w paczce został
ten sam, więc użytkownicy dostaną aktualizację). W panelu AMO wklej nową
nazwę i opis z tej strony. Adres (slug) dodatku zostaw stary: właśnie po nim
dalej znajduje go wyszukiwarka i stare linki. Grafik nie wymieniaj na takie,
które zawierają cudzą nazwę.
