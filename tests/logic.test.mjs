// Testy czystej logiki zamka i blokad. Uruchamianie: npm test
// (Node 22.18+ sam zdejmuje typy z importowanych plików .ts).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  evaluateBlock,
  formatClock,
  isInQuietHours,
  isWeakening,
  minutesUntilQuietEnd,
  passCodeLength,
  quietWindowContains,
  ritualRounds,
} from '../utils/guard.ts';
import {
  DISARM_TYPO_REWIND,
  disarmApplyRewind,
  disarmClampTyped,
  disarmEstimateMinutes,
  disarmFrontier,
  disarmIsComplete,
  pickDisarmText,
} from '../utils/disarm.ts';
import { matchedPrefixLength } from '../utils/page-ui.ts';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../utils/storage.ts';
import { translations } from '../utils/i18n.ts';
import { BRAND } from '../utils/brand.ts';

const base = { ...DEFAULT_SETTINGS, masterEnabled: true };
const at = (hours, minutes = 0) => new Date(2026, 10, 23, hours, minutes, 0);

test('ciche godziny przechodzące przez północ', () => {
  const start = 22 * 60;
  const end = 7 * 60;
  assert.equal(isInQuietHours(start, end, 23 * 60), true);
  assert.equal(isInQuietHours(start, end, 0), true);
  assert.equal(isInQuietHours(start, end, 6 * 60 + 59), true);
  assert.equal(isInQuietHours(start, end, 7 * 60), false);
  assert.equal(isInQuietHours(start, end, 21 * 60 + 59), false);
  assert.equal(isInQuietHours(start, end, 22 * 60), true);
});

test('ciche godziny w ciągu jednego dnia i puste okno', () => {
  assert.equal(isInQuietHours(9 * 60, 17 * 60, 12 * 60), true);
  assert.equal(isInQuietHours(9 * 60, 17 * 60, 8 * 60), false);
  assert.equal(isInQuietHours(600, 600, 600), false);
  assert.equal(minutesUntilQuietEnd(7 * 60, 23 * 60), 8 * 60);
  assert.equal(formatClock(7 * 60), '07:00');
  assert.equal(formatClock(1440 + 30), '00:30');
});

test('zawieranie się okien', () => {
  assert.equal(quietWindowContains(1320, 420, 1380, 360), true);
  assert.equal(quietWindowContains(1380, 360, 1320, 420), false);
  assert.equal(quietWindowContains(1320, 420, 1320, 420), true);
  assert.equal(quietWindowContains(540, 1020, 1320, 420), false);
});

test('werdykt: wyłączone rozszerzenie i przepustka zdejmują blokadę', () => {
  const limited = { ...base, dailyLimitEnabled: true, dailyLimitMinutes: 30 };
  const ctx = { now: at(12), secondsToday: 30 * 60, passUntil: 0 };
  assert.deepEqual(evaluateBlock(limited, ctx), { kind: 'limit', limitMinutes: 30 });
  assert.deepEqual(evaluateBlock(limited, { ...ctx, secondsToday: 30 * 60 - 1 }), { kind: 'none' });
  assert.deepEqual(evaluateBlock({ ...limited, masterEnabled: false }, ctx), { kind: 'none' });
  assert.deepEqual(evaluateBlock(limited, { ...ctx, passUntil: at(12, 5).getTime() }), { kind: 'none' });
  assert.deepEqual(evaluateBlock(limited, { ...ctx, passUntil: at(11, 59).getTime() }), {
    kind: 'limit',
    limitMinutes: 30,
  });
});

test('werdykt: ciche godziny mają pierwszeństwo przed limitem', () => {
  const both = {
    ...base,
    dailyLimitEnabled: true,
    dailyLimitMinutes: 1,
    quietHoursEnabled: true,
    quietStart: 22 * 60,
    quietEnd: 7 * 60,
  };
  assert.deepEqual(evaluateBlock(both, { now: at(23), secondsToday: 9999, passUntil: 0 }), {
    kind: 'quiet',
    endsAt: 7 * 60,
  });
  assert.equal(evaluateBlock(both, { now: at(12), secondsToday: 9999, passUntil: 0 }).kind, 'limit');
});

test('osłabienie blokady: wyłączenie przełącznika i poluzowanie liczb', () => {
  assert.equal(isWeakening(base, { ...base, hideComments: false }), true);
  assert.equal(isWeakening(base, { ...base, masterEnabled: false }), true);
  assert.equal(isWeakening(base, { ...base, strictLock: false }), true);
  assert.equal(isWeakening({ ...base, hideComments: false }, { ...base, hideComments: true }), false);
  assert.equal(isWeakening(base, { ...base, theme: base.theme === 'dark' ? 'light' : 'dark' }), false);
  assert.equal(isWeakening(base, { ...base, language: 'pl' }), false);

  const limit = { ...base, dailyLimitEnabled: true, dailyLimitMinutes: 30 };
  assert.equal(isWeakening(limit, { ...limit, dailyLimitMinutes: 45 }), true);
  assert.equal(isWeakening(limit, { ...limit, dailyLimitMinutes: 15 }), false);
  assert.equal(isWeakening(limit, { ...limit, dailyLimitEnabled: false }), true);
  // Dopóki limit jest wyłączony, jego wartość niczego nie pilnuje.
  assert.equal(isWeakening(base, { ...base, dailyLimitMinutes: 600 }), false);

  const gate = { ...base, entryGateEnabled: true, entryGateSeconds: 20 };
  assert.equal(isWeakening(gate, { ...gate, entryGateSeconds: 10 }), true);
  assert.equal(isWeakening(gate, { ...gate, entryGateSeconds: 30 }), false);

  const quiet = { ...base, quietHoursEnabled: true, quietStart: 1320, quietEnd: 420 };
  assert.equal(isWeakening(quiet, { ...quiet, quietStart: 1380 }), true);
  assert.equal(isWeakening(quiet, { ...quiet, quietEnd: 360 }), true);
  assert.equal(isWeakening(quiet, { ...quiet, quietStart: 1260 }), false);
  assert.equal(isWeakening(quiet, { ...quiet, quietEnd: 480 }), false);
});

test('eskalacja: kolejne rytuały i przepustki są dłuższe', () => {
  assert.deepEqual([0, 1, 2, 3, 9].map(ritualRounds), [1, 2, 3, 3, 3]);
  assert.deepEqual([0, 1, 2, 4, 5, 20].map(passCodeLength), [30, 45, 60, 90, 90, 90]);
});

test('rytuał: litery odblokowują się po jednej na sekundę', () => {
  const session = { phrase: 'abcdefghij', startedAt: 0, rewind: 0 };
  assert.equal(disarmFrontier(session, 0), 1);
  assert.equal(disarmFrontier(session, 4500), 5);
  assert.equal(disarmFrontier(session, 60000), 10);
  // Wpisane szybciej niż wolno: nadmiar jest obcinany.
  assert.equal(disarmClampTyped(session, 'abcdef', 2000), 'abc');
  // Literówka: zostaje tylko zgodny początek.
  assert.equal(disarmClampTyped(session, 'abXd', 9000), 'ab');
  assert.equal(disarmIsComplete(session, 'abcdefghij', 8000), false);
  assert.equal(disarmIsComplete(session, 'abcdefghij', 9000), true);
  assert.equal(disarmIsComplete(session, 'abcdefghiJ', 9000), false);

  const rewound = disarmApplyRewind(session);
  assert.equal(rewound.rewind, DISARM_TYPO_REWIND);
  assert.equal(disarmFrontier(rewound, 9000), 10 - DISARM_TYPO_REWIND);
});

test('rytuał: tekst składa się z różnych zdań i unika poprzedniego początku', () => {
  for (const lang of ['en', 'pl']) {
    const phrases = translations[lang].disarmPhrases;
    assert.ok(phrases.length >= 3);
    for (let run = 0; run < 50; run += 1) {
      const three = pickDisarmText(phrases, 3);
      const used = phrases.filter((phrase) => three.includes(phrase));
      assert.equal(used.length, 3);
      assert.equal(three.length, used.reduce((sum, phrase) => sum + phrase.length, 0) + 2);

      const first = pickDisarmText(phrases, 1);
      const second = pickDisarmText(phrases, 1, first);
      assert.notEqual(second, first);
    }
    // Zdania muszą dać się wpisać z klawiatury bez znaków specjalnych.
    for (const phrase of phrases) assert.match(phrase, /^[\p{L}\p{N} .,'-]+$/u);
  }
  assert.equal(disarmEstimateMinutes('x'.repeat(58)), 1);
  assert.equal(disarmEstimateMinutes('x'.repeat(178)), 3);
});

test('kod: liczy się tylko dokładnie przepisany początek', () => {
  assert.equal(matchedPrefixLength('AbC123', 'AbC'), 3);
  assert.equal(matchedPrefixLength('AbC123', 'Abc'), 2);
  assert.equal(matchedPrefixLength('AbC123', 'AbC123x'), 6);
  assert.equal(matchedPrefixLength('AbC123', ''), 0);
});

test('ustawienia: śmieci z magazynu są przycinane do zakresów', () => {
  const dirty = sanitizeSettings({
    entryGateSeconds: 0,
    dailyLimitMinutes: 99999,
    quietStart: -5,
    quietEnd: 5000,
    hideLiveChat: true,
    strictLock: 'yes',
  });
  assert.equal(dirty.entryGateSeconds, 3);
  assert.equal(dirty.dailyLimitMinutes, 1440);
  assert.equal(dirty.quietStart, 0);
  assert.equal(dirty.quietEnd, 1439);
  assert.equal('hideLiveChat' in dirty, false);
  assert.equal(dirty.strictLock, DEFAULT_SETTINGS.strictLock);
});

test('marka: interfejs bez cudzego znaku, sklep tylko w formule zgodności', () => {
  const banned = /tik\s*tok|bytedance|douyin/i;
  const collect = (value) => {
    if (typeof value === 'string') return [value];
    if (typeof value === 'function') return [String(value(3, 7))];
    if (Array.isArray(value)) return value.flatMap(collect);
    return [];
  };
  for (const lang of ['en', 'pl']) {
    for (const [key, value] of Object.entries(translations[lang])) {
      for (const text of collect(value)) {
        assert.equal(banned.test(text), false, `${lang}.${key}: ${text}`);
      }
    }
  }
  // Własna nazwa w popupie zostaje czysta. Nazwa i krótki opis w sklepie
  // muszą zawierać znak (inaczej nie ma czego znaleźć), ale nie mogą się
  // od niego zaczynać ani składać starej nazwy produktu.
  assert.equal(banned.test(BRAND.name), false, BRAND.name);
  const listing = (text) => {
    assert.equal(/^tik\s*tok/i.test(text), false, text);
    assert.equal(/tik\s*tok[\s-]*unhook/i.test(text), false, text);
    assert.match(text, /tiktok/i, text);
  };
  listing(BRAND.storeName);
  listing(BRAND.storeSummary);
  assert.ok(BRAND.storeName.length <= 45, 'limit nazwy w Chrome Web Store');
  assert.ok(BRAND.storeSummary.length <= 132, 'limit krótkiego opisu w Chrome Web Store');

  // Nazwa i opis w manifeście pochodzą z public/_locales.
  const locale = (lang) =>
    JSON.parse(readFileSync(new URL(`../public/_locales/${lang}/messages.json`, import.meta.url), 'utf8'));
  const en = locale('en');
  assert.equal(en.extName.message, BRAND.storeName);
  assert.equal(en.extDescription.message, BRAND.storeSummary);
  for (const lang of ['en', 'pl']) {
    const messages = locale(lang);
    listing(messages.extName.message);
    listing(messages.extDescription.message);
    assert.ok(messages.extName.message.length <= 45, `${lang}: limit nazwy`);
    assert.ok(messages.extDescription.message.length <= 132, `${lang}: limit krótkiego opisu`);
  }
});
