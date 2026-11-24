// Strona filmu promocyjnego: jedna plansza 1920x1080, której wygląd zależy
// wyłącznie od window.setTime(sekundy). Bez animacji CSS, więc każda klatka
// jest powtarzalna i można ją zrzucić w dowolnym tempie.
import { BRAND } from '../../utils/brand.ts';
import { BASE_CSS, hookMark, logoBadge } from './layouts.js';

const C = BRAND.colors;

export const VIDEO = { width: 1920, height: 1080, fps: 30, duration: 31.5 };

/** Ile sekund filmu zajmuje przepisywanie zdania (scena 4). */
const RITUAL_SECONDS = 5.4;

const esc = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pad = (n) => String(n).padStart(3, '0');

/** Oś czasu. Funkcja jest wstawiana do strony jako tekst i tam uruchamiana. */
function timeline(cfg) {
  const $ = (id) => document.getElementById(id);
  const all = (selector) => Array.from(document.querySelectorAll(selector));
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const out = (p) => 1 - Math.pow(1 - p, 3);
  const inOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

  const show = (el, opacity) => {
    el.style.opacity = String(opacity);
    el.style.visibility = opacity > 0.001 ? 'visible' : 'hidden';
  };
  /** Widoczność sceny: wejście od a, wyjście przed b. */
  const span = (t, a, b, fade = 0.45) => Math.min(seg(t, a, a + fade), 1 - seg(t, b - fade, b));
  /** Wjazd elementu od dołu. */
  const rise = (el, t, at, dist = 40, dur = 0.7) => {
    const p = out(seg(t, at, at + dur));
    el.style.opacity = String(p);
    el.style.transform = `translateY(${(1 - p) * dist}px)`;
  };
  const pop = (el, t, at, dur = 0.4) => {
    const p = out(seg(t, at, at + dur));
    el.style.opacity = String(p);
    el.style.transform = `scale(${0.86 + 0.14 * p})`;
  };

  const marks = all('#beforeLayer .mark');
  const hiddenChips = all('#t2 .chip');
  const limitCards = all('#s3 .lcard');
  const ritualImgs = all('#ritual img');
  const lockLines = all('#s4 .line');
  const facts = all('#s6 .chip');
  let ritualShown = -1;

  window.setTime = (t) => {
    // Nagłówek z logo: sceny 1-5.
    show($('brand'), span(t, 0.2, 27.2));

    // Sceny 1 i 2: ta sama rama, najpierw "przed", potem przejście na "po".
    show($('stageA'), span(t, 0, 9.3));
    const zoom = 1 + 0.035 * seg(t, 0, 9.3);
    $('frame').style.transform = `scale(${zoom})`;
    marks.forEach((mark, index) => pop(mark, t, 1.0 + index * 0.38));
    const wipe = inOut(seg(t, 5.1, 7.1));
    const x = -14 + wipe * 128;
    $('afterImg').style.clipPath = `polygon(0 0, ${x + 10}% 0, ${x}% 100%, 0 100%)`;
    $('wipeLine').setAttribute('x1', String(x + 10));
    $('wipeLine').setAttribute('x2', String(x));
    show($('lblBefore'), Math.min(seg(t, 0.5, 0.9), 1 - seg(t, 5.3, 5.8)));
    show($('lblAfter'), seg(t, 6.9, 7.3));

    show($('t1'), span(t, 0.3, 4.9, 0.4));
    rise($('t1a'), t, 0.35);
    rise($('t1b'), t, 0.75);
    show($('t2'), span(t, 5.0, 9.3, 0.4));
    rise($('t2a'), t, 5.1);
    rise($('t2b'), t, 5.5);
    hiddenChips.forEach((chip, index) => rise(chip, t, 6.2 + index * 0.22, 18, 0.45));

    // Scena 3: trzy zasłony.
    show($('s3'), span(t, 9.1, 14.7));
    rise($('s3h'), t, 9.3);
    limitCards.forEach((card, index) => rise(card, t, 9.8 + index * 0.75, 60, 0.8));

    // Scena 4: rytuał wyłączania.
    show($('s4'), span(t, 14.5, 22.7));
    rise($('s4pop'), t, 14.7, 50, 0.8);
    rise($('s4h'), t, 14.9);
    lockLines.forEach((line, index) => rise(line, t, 16.0 + index * 1.45, 24, 0.55));
    const typing = seg(t, 15.4, 15.4 + cfg.ritualSeconds);
    const holding = t >= 15.4 + cfg.ritualSeconds + 0.25;
    const frameIndex = holding ? cfg.phraseLength + 1 : Math.min(cfg.phraseLength, Math.floor(typing * (cfg.phraseLength + 1)));
    if (frameIndex !== ritualShown) {
      ritualImgs.forEach((img, index) => {
        img.style.visibility = index === frameIndex ? 'visible' : 'hidden';
      });
      ritualShown = frameIndex;
    }
    show($('speed'), Math.min(seg(t, 15.4, 15.8), 1 - seg(t, 15.4 + cfg.ritualSeconds, 15.4 + cfg.ritualSeconds + 0.3)));

    // Scena 5: przepustka.
    show($('s5'), span(t, 22.5, 27.3));
    rise($('s5a'), t, 22.7);
    rise($('s5b'), t, 23.1);
    rise($('s5sub'), t, 23.6, 24);
    rise($('pass1'), t, 22.9, 60, 0.8);
    rise($('pass2'), t, 24.5, 60, 0.8);
    rise($('s5more'), t, 25.4, 20);

    // Scena 6: plansza końcowa.
    show($('s6'), seg(t, 27.1, 27.6));
    const draw = inOut(seg(t, 27.4, 28.8));
    all('#endMark [pathLength]').forEach((shape) => {
      shape.style.strokeDashoffset = String(1 - draw);
      shape.style.opacity = draw > 0 ? '1' : '0';
    });
    pop($('endBadge'), t, 27.2, 0.6);
    rise($('endName'), t, 28.0);
    rise($('endTag'), t, 28.5);
    facts.forEach((chip, index) => rise(chip, t, 29.1 + index * 0.25, 20, 0.5));
  };

  window.ready = Promise.all([
    document.fonts.ready,
    ...Array.from(document.images, (img) => (img.complete ? null : new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error(`Nie wczytano: ${img.src}`));
    }))),
  ]).then(() => true);
}

export function buildVideoPage({ t, raw, phraseLength }) {
  const v = t.video;
  const frameWidth = 1080;
  const k = frameWidth / 1280;
  const marks = [
    [12, 114, 226, 84],
    [12, 240, 226, 126],
    [12, 578, 226, 216],
    [758, 10, 100, 44],
    [765, 505, 68, 260],
    [942, 6, 334, 480],
  ]
    .map(
      ([x, y, w, h]) =>
        `<i class="mark" style="left:${x * k}px;top:${y * k}px;width:${w * k}px;height:${h * k}px"></i>`
    )
    .join('');

  const speed = Math.round(phraseLength / RITUAL_SECONDS);
  const ritualImgs = [
    ...Array.from({ length: phraseLength + 1 }, (_, index) => `${raw}/ritual/${pad(index)}.png`),
    `${raw}/popup-hold.png`,
  ]
    .map((src) => `<img src="${src}" style="width:560px;visibility:hidden">`)
    .join('');

  const limitShots = ['gate', 'limit', 'quiet'];
  const limitCards = v.s3cards
    .map(
      (label, index) => `
      <div class="lcard" style="left:${130 + index * 570}px">
        <div class="shot" style="position:relative;width:520px;height:460px;border-radius:26px;border-color:rgba(212,255,58,0.24)">
          <img src="${raw}/${limitShots[index]}.png" style="width:1280px;left:-380px;top:-170px">
        </div>
        <b>${esc(label)}</b>
      </div>`
    )
    .join('');

  const endMark = hookMark(170).replace(/<(circle|path) /g, '<$1 pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1" ');

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>${BASE_CSS}
  body { width: 1920px; height: 1080px; }
  .scene { position: absolute; inset: 0; visibility: hidden; }
  .copy { position: absolute; left: 100px; }
  .big { font-size: 74px; font-weight: 800; letter-spacing: -0.035em; line-height: 1.05; white-space: nowrap; }
  .ember { color: ${C.ember}; }
  .mark { position: absolute; display: block; border: 3px solid ${C.ember}; background: rgba(255,90,54,0.2); border-radius: 12px; transform-origin: center; }
  .chips { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 40px; max-width: 600px; }
  .chip { font-size: 24px; padding: 12px 20px; }
  .strike { text-decoration: line-through; text-decoration-color: ${C.ember}; text-decoration-thickness: 3px; color: #c9cedb; }
  .lcard { position: absolute; top: 330px; width: 520px; }
  .lcard b { display: block; margin-top: 30px; font-size: 38px; font-weight: 800; letter-spacing: -0.02em; text-align: center; }
  .line { display: flex; align-items: center; gap: 20px; font-size: 40px; font-weight: 700; letter-spacing: -0.015em; margin-top: 30px; }
  .line i { width: 14px; height: 14px; border-radius: 50%; background: ${C.volt}; display: block; flex-shrink: 0; }
  .tagp { position: absolute; font-size: 22px; font-weight: 800; padding: 10px 18px; border-radius: 999px; background: ${C.volt}; color: ${C.ink}; white-space: nowrap; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  .more { display: inline-flex; margin-top: 40px; padding: 14px 22px; border-radius: 16px; background: rgba(255,90,54,0.14); border: 1px solid rgba(255,90,54,0.5); color: #ffb8a6; font-weight: 700; font-size: 26px; }
  #s6 { display: flex; flex-direction: column; align-items: center; justify-content: center; }
</style></head><body>
  <div class="grid" style="background-size:34px 34px"></div>
  <div class="glow" style="width:900px;height:900px;right:-200px;top:-280px;background:rgba(212,255,58,0.14)"></div>
  <div class="glow" style="width:760px;height:760px;left:-280px;bottom:-380px;background:rgba(255,90,54,0.12)"></div>

  <div id="brand" class="brand" style="position:absolute;left:100px;top:72px;font-size:34px;visibility:hidden">${logoBadge(56)}${esc(BRAND.name)}</div>

  <div id="stageA" class="scene">
    <div id="frame" class="shot" style="left:760px;top:202px;width:${frameWidth}px;height:${frameWidth * 0.625}px;border-radius:22px;transform-origin:center">
      <div id="beforeLayer" style="position:absolute;inset:0">
        <img src="${raw}/site-before.png" style="width:${frameWidth}px">
        ${marks}
      </div>
      <img id="afterImg" src="${raw}/site-after.png" style="width:${frameWidth}px">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%">
        <line id="wipeLine" x1="0" y1="0" x2="0" y2="100" stroke="${C.volt}" stroke-width="5" vector-effect="non-scaling-stroke"/>
      </svg>
      <span id="lblBefore" class="pill" style="left:22px;bottom:22px;padding:10px 18px;font-size:18px;background:${C.ember};color:#fff">${esc(t.before)}</span>
      <span id="lblAfter" class="pill" style="right:22px;bottom:22px;padding:10px 18px;font-size:18px;background:${C.volt};color:${C.ink}">${esc(t.after)}</span>
    </div>
    <div id="t1" class="copy" style="top:400px">
      <div id="t1a" class="big">${esc(v.s1[0])}</div>
      <div id="t1b" class="big ember">${esc(v.s1[1])}</div>
    </div>
    <div id="t2" class="copy" style="top:330px">
      <div id="t2a" class="big">${esc(v.s2[0])}</div>
      <div id="t2b" class="big hl">${esc(v.s2[1])}</div>
      <div class="chips">${t.cleanChips.map((chip) => `<span class="chip strike">${esc(chip)}</span>`).join('')}</div>
    </div>
  </div>

  <div id="s3" class="scene">
    <div id="s3h" class="copy big" style="top:176px;font-size:66px">${esc(v.s3)}</div>
    ${limitCards}
  </div>

  <div id="s4" class="scene">
    <div id="s4pop" style="position:absolute;left:190px;top:178px">
      <div id="ritual" class="shot" style="position:relative;width:560px;height:760px;border-radius:26px;transform:rotate(-2deg)">${ritualImgs}</div>
      <span id="speed" class="pill" style="left:24px;top:-22px;padding:9px 16px;font-size:17px;background:#fff;color:${C.ink}">${esc(v.s4speed.replace('{n}', String(speed)))}</span>
    </div>
    <div class="copy" style="left:900px;top:300px">
      <div id="s4h" class="big" style="font-size:84px">${esc(v.s4[0])}</div>
      <div style="margin-top:28px">${v.s4sub.map((line) => `<div class="line"><i></i>${esc(line)}</div>`).join('')}</div>
    </div>
  </div>

  <div id="s5" class="scene">
    <div class="copy" style="top:330px">
      <div id="s5a" class="big" style="font-size:80px">${esc(v.s5[0])}</div>
      <div id="s5b" class="big hl" style="font-size:80px">${esc(v.s5[1])}</div>
      <div id="s5sub" class="sub" style="font-size:34px;margin-top:34px;max-width:720px">${esc(v.s5sub)}</div>
      <div id="s5more" class="more">${esc(t.passMore)}</div>
    </div>
    <div id="pass1" style="position:absolute;left:930px;top:210px">
      <div class="shot" style="position:relative;width:440px;border-radius:16px;transform:rotate(-3deg)"><img src="${raw}/pass-30-card.png" style="position:relative;width:100%;height:auto"></div>
      <span class="tagp" style="left:20px;top:-34px;transform:rotate(-3deg)">${esc(t.passLabels[0])}</span>
    </div>
    <div id="pass2" style="position:absolute;left:1370px;top:340px">
      <div class="shot" style="position:relative;width:460px;border-radius:17px;transform:rotate(3deg)"><img src="${raw}/pass-45-card.png" style="position:relative;width:100%;height:auto"></div>
      <span class="tagp" style="left:150px;top:-30px;transform:rotate(3deg)">${esc(t.passLabels[1])}</span>
    </div>
  </div>

  <div id="s6" class="scene">
    <span id="endBadge" class="badge" style="width:220px;height:220px;border-radius:54px"><span id="endMark" style="display:flex">${endMark}</span></span>
    <div id="endName" style="font-size:150px;font-weight:800;letter-spacing:-0.03em;line-height:1;margin-top:34px">${esc(BRAND.name)}</div>
    <div id="endTag" style="font-size:46px;font-weight:650;color:#c9cedb;margin-top:22px">${esc(v.end)}</div>
    <div style="display:flex;gap:18px;margin-top:50px">${t.facts.map((fact) => `<span class="chip" style="font-size:30px;padding:14px 26px;gap:12px"><i style="width:10px;height:10px"></i>${esc(fact)}</span>`).join('')}</div>
  </div>

  <script>(${timeline.toString()})(${JSON.stringify({ phraseLength, ritualSeconds: RITUAL_SECONDS })});</script>
</body></html>`;
}
