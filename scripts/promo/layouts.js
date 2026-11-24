// Szablony HTML grafik sklepowych. Każda funkcja zwraca kompletną stronę
// o podanym rozmiarze; zrzuty interfejsu są wstawiane jako obrazki z /raw/.
import { BRAND } from '../../utils/brand.ts';

const C = BRAND.colors;

const esc = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Znak: haczyk z oczkiem (te same kształty co public/icon.svg). */
export const hookMark = (size, color = C.volt) => `
  <svg width="${size}" height="${size}" viewBox="0 0 128 128" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="76" cy="30" r="9" stroke-width="9"/>
    <path d="M76 41 V78 a24 24 0 0 1 -48 0 V64" stroke-width="13"/>
    <path d="M28 64 l13 13" stroke-width="11"/>
  </svg>`;

export const logoBadge = (size) => `
  <span class="badge" style="width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.24)}px">${hookMark(Math.round(size * 0.8))}</span>`;

export const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: ${C.ink}; }
  body {
    position: relative; overflow: hidden; color: #fff;
    font-family: "Segoe UI Variable Display", "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .grid { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1.2px); background-size: 26px 26px; }
  .glow { position: absolute; border-radius: 50%; filter: blur(90px); pointer-events: none; }
  .badge { display: inline-flex; align-items: center; justify-content: center; background: #050608; border: 1px solid rgba(212,255,58,0.28); flex-shrink: 0; }
  .brand { display: flex; align-items: center; gap: 12px; font-weight: 800; letter-spacing: -0.02em; }
  .kicker { font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: ${C.volt}; }
  h1 { font-weight: 800; letter-spacing: -0.035em; line-height: 1.02; }
  .hl { color: ${C.volt}; }
  .sub { color: #aab0bf; line-height: 1.45; font-weight: 500; }
  .chip { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.05); border-radius: 999px; font-weight: 650; white-space: nowrap; }
  .chip i { width: 7px; height: 7px; border-radius: 50%; background: ${C.volt}; display: block; }
  .shot { position: absolute; overflow: hidden; border: 1px solid rgba(255,255,255,0.14); background: ${C.ink}; box-shadow: 0 34px 90px rgba(0,0,0,0.66), 0 4px 14px rgba(0,0,0,0.5); }
  .shot img { display: block; position: absolute; left: 0; top: 0; max-width: none; }
  .pill { position: absolute; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; border-radius: 999px; }
  .note { position: absolute; color: #6c7283; font-weight: 500; }
`;

const page = (width, height, css, body) => `<!doctype html>
<html><head><meta charset="utf-8"><style>${BASE_CSS}
  body { width: ${width}px; height: ${height}px; }
  ${css}
</style></head><body>${body}</body></html>`;

const lines = (parts) => parts.map(esc).join('<br>');

/** Wycinek zrzutu strony (zrzuty mają 1280x800 punktów). */
const crop = ({ src, x, y, w, h, scale, style = '', radius = 18 }) => `
  <div class="shot" style="width:${Math.round(w * scale)}px;height:${Math.round(h * scale)}px;border-radius:${radius}px;${style}">
    <img src="${src}" style="width:${1280 * scale}px;left:${-x * scale}px;top:${-y * scale}px">
  </div>`;

/** Zrzut popupu (360 punktów szerokości). */
const popup = ({ src, width, height, style = '' }) => `
  <div class="shot" style="width:${width}px;height:${height}px;border-radius:${Math.round(width * 0.045)}px;${style}">
    <img src="${src}" style="width:${width}px">
  </div>`;

/** Karta okna z kodem (zrzut samego elementu, 440 punktów szerokości). */
const card = ({ src, width, style = '' }) => `
  <div class="shot" style="width:${width}px;border-radius:${Math.round((width * 16) / 440)}px;${style}">
    <img src="${src}" style="position:relative;width:100%;height:auto">
  </div>`;

/** Rama "przed / po" przecięta ukośnie. */
const split = ({ raw, t, width, style = '', labelSize = 12 }) => {
  const height = Math.round(width * 0.625);
  return `
  <div class="shot" style="width:${width}px;height:${height}px;border-radius:16px;${style}">
    <img src="${raw}/site-before.png" style="width:${width}px">
    <img src="${raw}/site-after.png" style="width:${width}px;clip-path:polygon(53% 0,100% 0,100% 100%,43% 100%)">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%">
      <line x1="53" y1="0" x2="43" y2="100" stroke="${C.volt}" stroke-width="3" vector-effect="non-scaling-stroke"/>
    </svg>
    <span class="pill" style="left:14px;bottom:14px;padding:6px 12px;font-size:${labelSize}px;background:${C.ember};color:#fff">${esc(t.before)}</span>
    <span class="pill" style="right:14px;top:14px;padding:6px 12px;font-size:${labelSize}px;background:${C.volt};color:${C.ink}">${esc(t.after)}</span>
  </div>`;
};

const header = (size = 24) => `<div class="brand" style="font-size:${size}px">${logoBadge(Math.round(size * 1.6))}${esc(BRAND.name)}</div>`;

export function hero({ t, raw }) {
  return page(
    1280,
    800,
    `
    .left { position: absolute; left: 72px; top: 60px; width: 560px; }
    h1 { font-size: ${t.heroSize || 66}px; margin-top: 54px; }
    .sub { font-size: 20px; margin-top: 24px; max-width: 500px; }
    .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 30px; max-width: 520px; }
    .chip { font-size: 15px; padding: 9px 15px; }
    .kicker { font-size: 13px; margin-top: 62px; }
    `,
    `
    <div class="grid"></div>
    <div class="glow" style="width:620px;height:620px;right:-140px;top:-180px;background:rgba(212,255,58,0.16)"></div>
    <div class="glow" style="width:520px;height:520px;left:-200px;bottom:-260px;background:rgba(255,90,54,0.14)"></div>
    <div class="left">
      ${header(24)}
      <div class="kicker">${esc(t.kicker)}</div>
      <h1 style="margin-top:16px">${lines(t.heroTitle)}<br><span class="hl">${esc(t.heroAccent)}</span></h1>
      <p class="sub">${esc(t.heroSub)}</p>
      <div class="chips">${t.chips.map((chip) => `<span class="chip"><i></i>${esc(chip)}</span>`).join('')}</div>
    </div>
    ${split({ raw, t, width: 640, style: 'left:610px;top:112px;transform:rotate(-2deg)' })}
    ${popup({ src: `${raw}/popup-main.png`, width: 258, height: 416, style: 'left:984px;top:330px;transform:rotate(4deg)' })}
    <div class="note" style="left:72px;bottom:28px;font-size:12px">${esc(t.mockNote)}</div>
    `
  );
}

export function lock({ t, raw }) {
  const steps = t.lockSteps
    .map(
      ([title, text], index) => `
      <div class="step">
        <span class="num">${index + 1}</span>
        <div><b>${esc(title)}</b><p>${esc(text)}</p></div>
      </div>`
    )
    .join('');
  return page(
    1280,
    800,
    `
    .top { position: absolute; left: 72px; top: 52px; right: 72px; }
    h1 { font-size: 60px; margin-top: 26px; }
    .tail { color: #7f8597; }
    .steps { position: absolute; left: 740px; top: 322px; width: 480px; display: flex; flex-direction: column; gap: 24px; }
    .step { display: flex; gap: 18px; align-items: flex-start; }
    .num { width: 44px; height: 44px; border-radius: 14px; background: ${C.volt}; color: ${C.ink}; font-weight: 800; font-size: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .step b { font-size: 23px; font-weight: 750; letter-spacing: -0.015em; }
    .step p { font-size: 16.5px; color: #9ea4b3; margin-top: 3px; line-height: 1.35; font-weight: 500; }
    `,
    `
    <div class="grid"></div>
    <div class="glow" style="width:560px;height:560px;left:60px;top:240px;background:rgba(212,255,58,0.13)"></div>
    <div class="top">
      ${header(22)}
      <h1>${lines(t.lockTitle)}<br><span class="hl">${esc(t.lockAccent)}</span> <span class="tail">${esc(t.lockTail)}</span></h1>
    </div>
    ${popup({ src: `${raw}/popup-hold.png`, width: 318, height: 424, style: 'left:384px;top:338px;transform:rotate(5deg)' })}
    ${popup({ src: `${raw}/popup-ritual.png`, width: 356, height: 474, style: 'left:84px;top:292px;transform:rotate(-3deg)' })}
    <div class="steps">${steps}</div>
    `
  );
}

export function limits({ t, raw }) {
  const shots = ['gate', 'limit', 'quiet'];
  const tilt = [-2.5, 0, 2.5];
  const lift = [18, 0, 18];
  const cards = t.limitCards
    .map(
      ([title, text], index) => `
      <div class="card" style="left:${72 + index * 382}px;top:${236 + lift[index]}px">
        ${crop({ src: `${raw}/${shots[index]}.png`, x: 380, y: 170, w: 520, h: 460, scale: 0.715, style: `position:relative;transform:rotate(${tilt[index]}deg)`, radius: 18 })}
        <b>${esc(title)}</b>
        <p>${esc(text)}</p>
      </div>`
    )
    .join('');
  return page(
    1280,
    800,
    `
    .top { position: absolute; left: 72px; top: 52px; right: 72px; }
    h1 { font-size: 62px; margin-top: 26px; }
    .card { position: absolute; width: 372px; }
    .card .shot { box-shadow: 0 26px 70px rgba(0,0,0,0.7); border-color: rgba(212,255,58,0.22); }
    .card b { display: block; margin-top: 34px; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
    .card p { margin-top: 6px; font-size: 17px; color: #9ea4b3; line-height: 1.35; font-weight: 500; }
    `,
    `
    <div class="grid"></div>
    <div class="glow" style="width:700px;height:420px;left:290px;top:300px;background:rgba(212,255,58,0.11)"></div>
    <div class="top">
      ${header(22)}
      <h1>${lines(t.limitsTitle)} <span class="hl">${esc(t.limitsAccent)}</span></h1>
    </div>
    ${cards}
    `
  );
}

export function pass({ t, raw }) {
  return page(
    1280,
    800,
    `
    .left { position: absolute; left: 72px; top: 52px; width: 470px; }
    h1 { font-size: 60px; margin-top: 150px; }
    .sub { font-size: 20px; margin-top: 24px; max-width: 430px; }
    .more { margin-top: 30px; display: inline-flex; padding: 10px 16px; border-radius: 12px; background: rgba(255,90,54,0.14); border: 1px solid rgba(255,90,54,0.5); color: #ffb8a6; font-weight: 700; font-size: 16px; }
    .tag { position: absolute; font-size: 15px; font-weight: 800; padding: 8px 14px; border-radius: 999px; background: ${C.volt}; color: ${C.ink}; white-space: nowrap; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    `,
    `
    <div class="grid"></div>
    <div class="glow" style="width:640px;height:640px;right:-80px;top:80px;background:rgba(212,255,58,0.12)"></div>
    <div class="left">
      ${header(22)}
      <h1>${lines(t.passTitle)}<br><span class="hl">${esc(t.passAccent)}</span></h1>
      <p class="sub">${esc(t.passSub)}</p>
      <span class="more">${esc(t.passMore)}</span>
    </div>
    ${card({ src: `${raw}/pass-30-card.png`, width: 340, style: 'left:546px;top:150px;transform:rotate(-3deg)' })}
    ${card({ src: `${raw}/pass-45-card.png`, width: 360, style: 'left:880px;top:262px;transform:rotate(3deg)' })}
    <span class="tag" style="left:566px;top:120px;transform:rotate(-3deg)">${esc(t.passLabels[0])}</span>
    <span class="tag" style="left:990px;top:238px;transform:rotate(3deg)">${esc(t.passLabels[1])}</span>
    `
  );
}

export function clean({ t, raw }) {
  const width = 556;
  const k = width / 1280;
  // Obszary makiety (w punktach zrzutu 1280x800), które rozszerzenie chowa.
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
  const frame = (name, left, label, color, text, extra = '') => `
    <div class="shot" style="left:${left}px;top:266px;width:${width}px;height:${Math.round(width * 0.625)}px;border-radius:14px">
      <img src="${raw}/${name}.png" style="width:${width}px">
      ${extra}
    </div>
    <span class="pill" style="left:${left + 16}px;top:250px;padding:7px 14px;font-size:13px;background:${color};color:${text}">${esc(label)}</span>`;
  return page(
    1280,
    800,
    `
    .top { position: absolute; left: 72px; top: 52px; right: 72px; }
    h1 { font-size: 66px; margin-top: 26px; }
    .mark { position: absolute; display: block; border: 2px solid ${C.ember}; background: rgba(255,90,54,0.16); border-radius: 8px; }
    .row { position: absolute; left: 72px; right: 60px; top: 660px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .row em { font-style: normal; font-weight: 800; font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; color: ${C.ember}; margin-right: 6px; }
    .chip { font-size: 14.5px; padding: 8px 12px; text-decoration: line-through; text-decoration-color: ${C.ember}; text-decoration-thickness: 2px; color: #c9cedb; }
    `,
    `
    <div class="grid"></div>
    <div class="glow" style="width:520px;height:420px;right:40px;top:200px;background:rgba(212,255,58,0.12)"></div>
    <div class="glow" style="width:480px;height:400px;left:20px;top:220px;background:rgba(255,90,54,0.12)"></div>
    <div class="top">
      ${header(22)}
      <h1>${lines(t.cleanTitle)} <span class="hl">${esc(t.cleanAccent)}</span></h1>
    </div>
    ${frame('site-before', 72, t.before, C.ember, '#fff', marks)}
    ${frame('site-after', 652, t.after, C.volt, C.ink)}
    <div class="row"><em>${esc(t.cleanChipsLabel)}</em>${t.cleanChips.map((chip) => `<span class="chip">${esc(chip)}</span>`).join('')}</div>
    <div class="note" style="left:72px;bottom:24px;font-size:12px">${esc(t.mockNote)}</div>
    `
  );
}

export function tile({ t }) {
  return page(
    440,
    280,
    `
    .wrap { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: 0 0 0 40px; }
    .name { font-size: 62px; font-weight: 800; letter-spacing: -0.045em; line-height: 1; margin-top: 18px; }
    .tag { font-size: 19px; font-weight: 650; color: #c3c8d6; margin-top: 10px; max-width: 200px; line-height: 1.25; }
    .big { position: absolute; right: -78px; top: 4px; opacity: 0.95; transform: rotate(8deg); }
    `,
    `
    <div class="grid"></div>
    <div class="glow" style="width:300px;height:300px;right:-80px;top:-20px;background:rgba(212,255,58,0.24)"></div>
    <div class="big">${hookMark(272)}</div>
    <div class="wrap">
      ${logoBadge(54)}
      <div class="name">${esc(BRAND.name)}</div>
      <div class="tag">${esc(t.tagline)}</div>
    </div>
    `
  );
}

export function marquee({ t, raw }) {
  return page(
    1400,
    560,
    `
    .left { position: absolute; left: 80px; top: 64px; width: 620px; }
    h1 { font-size: 68px; margin-top: 14px; }
    .kicker { font-size: 14px; margin-top: 56px; }
    .facts { display: flex; gap: 10px; margin-top: 34px; }
    .chip { font-size: 17px; padding: 10px 18px; }
    `,
    `
    <div class="grid"></div>
    <div class="glow" style="width:700px;height:700px;right:-120px;top:-200px;background:rgba(212,255,58,0.17)"></div>
    <div class="glow" style="width:460px;height:460px;left:-160px;bottom:-260px;background:rgba(255,90,54,0.13)"></div>
    <div class="left">
      ${header(28)}
      <div class="kicker">${esc(t.kicker)}</div>
      <h1>${lines(t.taglineLines)}</h1>
      <div class="facts">${t.facts.map((fact) => `<span class="chip"><i></i>${esc(fact)}</span>`).join('')}</div>
    </div>
    ${crop({ src: `${raw}/limit.png`, x: 380, y: 190, w: 520, h: 420, scale: 0.86, style: 'left:646px;top:100px;transform:rotate(-4deg)', radius: 20 })}
    ${popup({ src: `${raw}/popup-main.png`, width: 262, height: 424, style: 'left:1082px;top:92px;transform:rotate(5deg)' })}
    `
  );
}

export const STORE_ASSETS = [
  { name: 'screenshot-1-hero-1280x800', build: hero, width: 1280, height: 800 },
  { name: 'screenshot-2-lock-1280x800', build: lock, width: 1280, height: 800 },
  { name: 'screenshot-3-limits-1280x800', build: limits, width: 1280, height: 800 },
  { name: 'screenshot-4-pass-1280x800', build: pass, width: 1280, height: 800 },
  { name: 'screenshot-5-clean-1280x800', build: clean, width: 1280, height: 800 },
  { name: 'promo-small-440x280', build: tile, width: 440, height: 280 },
  { name: 'promo-marquee-1400x560', build: marquee, width: 1400, height: 560 },
];
