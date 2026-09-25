/*
 * CLAUDE — MOTION REEL 2026
 * 15 s · 1920×1080 · 128 BPM (exactly 32 beats)
 *
 * Every frame is a pure function of time: REEL.seek(t) paints the frame at t seconds.
 * The same code plays live in a browser and renders frame-exact, motion-blurred
 * video through tools/render.js. The soundtrack (tools/soundtrack.py) is written
 * against the same beat grid, so every hit lands on a cut.
 */
(() => {
'use strict';

/* ───────────────────────── constants ───────────────────────── */

const W = 1920, H = 1080, CX = W / 2, CY = H / 2;
const BPM = 128, B = 60 / BPM, DUR = 15, FPS = 60;
const T = b => b * B;                       // beats → seconds
const TAU = Math.PI * 2, GOLD = Math.PI * (3 - Math.sqrt(5));

const COL = { ink: '#0C0C10', paper: '#F2EDE4', verm: '#FF4A1C', ultra: '#3A33FF', acid: '#D8FF3D' };
const RGB = { ink: [12, 12, 16], paper: [242, 237, 228], verm: [255, 74, 28], ultra: [58, 51, 255], acid: [216, 255, 61] };
const rgba = (c, a) => `rgba(${RGB[c][0]},${RGB[c][1]},${RGB[c][2]},${a})`;
const mixRGB = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

/* ───────────────────────── math & easing ───────────────────────── */

const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const fract = x => x - Math.floor(x);
const hash = n => fract(Math.sin(n * 91.3458 + 47.853) * 43758.5453);

const E = {
  linear: t => t,
  inQuad: t => t * t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inCubic: t => t * t * t,
  outCubic: t => 1 - (1 - t) ** 3,
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,
  inQuart: t => t ** 4,
  inOutQuart: t => t < .5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2,
  inExpo: t => t <= 0 ? 0 : 2 ** (10 * t - 10),
  outExpo: t => t >= 1 ? 1 : 1 - 2 ** (-10 * t),
  inOutExpo: t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2,
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: t => { const s = 1.70158; return 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2; },
  inBack: t => { const s = 1.70158; return (s + 1) * t ** 3 - s * t * t; },
  outElastic: t => t <= 0 ? 0 : t >= 1 ? 1 : 2 ** (-10 * t) * Math.sin((t * 10 - .75) * (TAU / 3)) + 1,
};

// damped harmonic oscillator stepping 0 → 1 (t in seconds)
function spring(t, k = 170, c = 14) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(k), z = c / (2 * Math.sqrt(k));
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>[]{}#*+=';
function scramble(str, p, t, seed = 0) {
  let out = '';
  const n = str.length;
  for (let i = 0; i < n; i++) {
    const ch = str[i], a = (i / n) * 0.55;
    if (ch === ' ' || ch === '\n' || p >= a + 0.45) out += ch;
    else if (p > a) out += GLYPHS[Math.floor(hash(i * 13.1 + seed + Math.floor(t * 24) * 7.7) * GLYPHS.length)];
    else out += ' ';
  }
  return out;
}

const pad = n => String(n).padStart(2, '0');

/* ───────────────────────── DOM plumbing ───────────────────────── */

const $ = id => document.getElementById(id);
function el(tag, cls, parent, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

const stage = $('stage'), shakeEl = $('shake'), flashEl = $('flash'), vignette = $('vignette');
const cv = $('cv'), ctx = cv.getContext('2d');
const hud = $('hud'), hx = hud.getContext('2d');

function makeWord(parent, text, cls) {
  const w = el('div', 'word ' + cls, parent);
  const letters = [...text].map(ch => el('span', 'ch', w, ch === ' ' ? ' ' : ch));
  const base = el('span', 'base', w);
  return { el: w, letters, base };
}
const setVar = (e, wdth, wght) => { e.style.fontVariationSettings = `'wdth' ${wdth.toFixed(2)}, 'wght' ${wght.toFixed(1)}`; };

// per-letter inline-blocks drop the font's kerning; measure each pair and put it back
function kern(word, variation) {
  const probe = el('span', '', word.el);
  probe.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:pre';
  if (variation) probe.style.fontVariationSettings = variation;
  const m = s => { probe.textContent = s; return probe.getBoundingClientRect().width; };
  const fs = parseFloat(getComputedStyle(word.el).fontSize);
  const L = word.letters;
  for (let i = 0; i < L.length - 1; i++) {
    const a = L[i].textContent, b = L[i + 1].textContent;
    L[i].style.marginRight = ((m(a + b) - m(a) - m(b)) / fs).toFixed(4) + 'em';
  }
  probe.remove();
}
// place a word so its baseline sits at y
function place(word, x, y) {
  word.el.style.left = x + 'px';
  word.el.style.top = (y - word.base.offsetTop) + 'px';
}
function capRatio(weight = 900, stretch = 'expanded') {
  ctx.font = `${weight} 100px Archivo`; ctx.fontStretch = stretch;
  const m = ctx.measureText('H');
  return m.actualBoundingBoxAscent / 100;
}

let NOW = 0, BQ = 0;   // BQ = beat at the start of the output frame (hard cuts snap to it)

/* ═════════════════════════ 00 · IGNITION  (beats 0–4) ═════════════════════════
   A point. A radius. A circle — drawn like a compass would. Rings spin up and
   implode back to a point on the downbeat. */

const S0R = 230;
function dotPos(b) {
  if (b < 1) return [CX + S0R * E.inOutCubic(inv(0.5, 1.0, b)), CY];
  const a = -E.inOutQuart(inv(1.0, 2.0, b)) * TAU;
  return [CX + S0R * Math.cos(a), CY + S0R * Math.sin(a)];
}

function drawS0(t, b) {
  const g = ctx, R = S0R;
  g.fillStyle = COL.ink; g.fillRect(0, 0, W, H);
  const collapse = E.inExpo(inv(3.45, 3.93, b));
  const k = 1 - collapse;

  // dotted construction grid, revealed as a radial wave
  const gridOut = 1 - E.inQuad(inv(3.3, 3.85, b));
  if (gridOut > 0) {
    const front = b * 780;
    for (let y = 30; y < H; y += 48) for (let x = 24; x < W; x += 48) {
      const d = Math.hypot(x - CX, y - CY);
      const a = clamp((front - d) / 260) * gridOut * 0.17;
      if (a > 0.004) { g.fillStyle = rgba('paper', a); g.fillRect(x - 1, y - 1, 2, 2); }
    }
  }

  // crosshair
  const cross = E.outExpo(inv(0.2, 1.4, b)) * k;
  if (cross > 0) {
    g.strokeStyle = rgba('paper', 0.2); g.lineWidth = 1;
    g.beginPath();
    g.moveTo(CX - cross * CX, CY + 0.5); g.lineTo(CX + cross * CX, CY + 0.5);
    g.moveTo(CX + 0.5, CY - cross * CY); g.lineTo(CX + 0.5, CY + cross * CY);
    g.stroke();
  }

  g.lineCap = 'round';
  if (b < 2) {
    // radius arm, then the compass sweep
    const arm = inv(0.5, 1.0, b), retract = E.inOutCubic(inv(1.0, 1.6, b));
    const [dx, dy] = dotPos(b);
    if (arm > 0 && retract < 1) {
      const ang = b < 1 ? 0 : -E.inOutQuart(inv(1.0, 2.0, b)) * TAU;
      const r0 = R * retract, r1 = b < 1 ? dx - CX : R;
      g.strokeStyle = rgba('paper', 0.55); g.lineWidth = 2;
      g.beginPath(); g.moveTo(CX + r0 * Math.cos(ang), CY + r0 * Math.sin(ang)); g.lineTo(CX + r1 * Math.cos(ang), CY + r1 * Math.sin(ang)); g.stroke();
      if (b < 1.3) {
        g.font = '500 15px "JetBrains Mono"'; g.letterSpacing = '1px';
        g.fillStyle = rgba('paper', 0.6 * (1 - inv(1.0, 1.3, b)) * inv(0.6, 0.8, b));
        g.fillText('r = 230', CX + 70, CY - 16);
      }
    }
    const sweep = E.inOutQuart(inv(1.0, 2.0, b)) * TAU;
    if (sweep > 0) {
      g.strokeStyle = rgba('paper', 0.12); g.lineWidth = 20;
      g.beginPath(); g.arc(CX, CY, R, 0, -sweep, true); g.stroke();
      g.strokeStyle = COL.paper; g.lineWidth = 5;
      g.beginPath(); g.arc(CX, CY, R, 0, -sweep, true); g.stroke();
    }
    // the point itself — squash & stretch along its velocity
    const [ax, ay] = dotPos(b - 0.012), [bx, by] = dotPos(b + 0.012);
    const vx = (bx - ax) / 0.024, vy = (by - ay) / 0.024, sp = Math.hypot(vx, vy);
    const st = clamp(1 + sp / 1600, 1, 3.2);
    const pop = spring(t + 0.02, 420, 14);
    g.save(); g.translate(dx, dy); g.rotate(Math.atan2(vy, vx)); g.scale(st, 1 / Math.sqrt(st));
    g.fillStyle = rgba('paper', 0.18); g.beginPath(); g.arc(0, 0, 24 * pop, 0, TAU); g.fill();
    g.fillStyle = COL.paper; g.beginPath(); g.arc(0, 0, 10 * pop, 0, TAU); g.fill();
    g.restore();
    // degree marks tick in as the sweep passes them
    g.font = '500 15px "JetBrains Mono"'; g.letterSpacing = '1px'; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['090°', '180°', '270°', '360°'].forEach((s, i) => {
      const a = (i + 1) * Math.PI / 2, on = clamp((sweep - a + 0.35) / 0.35);
      if (on <= 0) return;
      g.fillStyle = rgba('paper', 0.65 * on);
      g.fillText(s, CX + (R + 44) * Math.cos(-a), CY + (R + 44) * Math.sin(-a));
    });
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  } else {
    const spin = t * 0.5 + 2.2 * E.inCubic(inv(2.9, 3.9, b));
    // shock ring when the circle closes
    const sh = inv(2.0, 2.7, b);
    if (sh < 1) {
      g.strokeStyle = rgba('paper', (1 - sh) ** 2 * 0.9); g.lineWidth = 2;
      g.beginPath(); g.arc(CX, CY, R + E.outExpo(sh) * 520, 0, TAU); g.stroke();
    }
    // ring C — acid ticks
    const sc = spring(t - T(2.2), 160, 11), rC = (R + 172 * sc) * k;
    if (rC > 1) {
      g.strokeStyle = COL.acid; g.lineCap = 'butt';
      for (let i = 0; i < 96; i++) {
        const a = i / 96 * TAU - spin * 0.9, len = (i % 8 === 0 ? 30 : 13) * sc * k;
        g.lineWidth = i % 8 === 0 ? 3 : 2;
        g.beginPath(); g.moveTo(CX + rC * Math.cos(a), CY + rC * Math.sin(a)); g.lineTo(CX + (rC - len) * Math.cos(a), CY + (rC - len) * Math.sin(a)); g.stroke();
      }
    }
    // ring B — ultramarine dashes
    const sb = spring(t - T(2.1), 180, 12), rB = (R + 104 * sb) * k;
    if (rB > 1) {
      g.strokeStyle = COL.ultra; g.lineWidth = 10 * sb; g.setLineDash([28, 16]); g.lineDashOffset = -spin * 260;
      g.beginPath(); g.arc(CX, CY, rB, 0, TAU); g.stroke(); g.setLineDash([]);
    }
    // ring A — vermilion
    const sa = spring(t - T(2.0), 220, 13), rA = (R + 46 * sa) * k;
    if (rA > 1) { g.strokeStyle = COL.verm; g.lineWidth = 16 * sa * (0.4 + 0.6 * k); g.beginPath(); g.arc(CX, CY, rA, 0, TAU); g.stroke(); }
    // the drawn circle
    if (R * k > 1) { g.strokeStyle = COL.paper; g.lineWidth = 5; g.beginPath(); g.arc(CX, CY, R * k, 0, TAU); g.stroke(); }

    // badge type inside the circle
    const tin = inv(2.25, 2.85, b), tout = inv(3.3, 3.55, b);
    if (tin > 0 && tout < 1) {
      const p = tout > 0 ? 1 - tout : tin;
      g.textAlign = 'center'; g.fillStyle = COL.paper;
      g.font = '800 34px "JetBrains Mono"'; g.letterSpacing = '8px';
      g.fillText(scramble('CLAUDE', p, t, 1), CX + 4, CY + 4);
      g.font = '500 14px "JetBrains Mono"'; g.letterSpacing = '4px'; g.fillStyle = rgba('paper', 0.7);
      g.fillText(scramble('MOTION DESIGN', p, t, 2), CX + 2, CY - 44);
      g.fillText(scramble('REEL — 2026', p, t, 3), CX + 2, CY + 50);
      g.textAlign = 'left';
    }
    // everything imploded: one bright point waits for the drop
    if (collapse > 0.9) {
      const q = inv(3.9, 4.0, b);
      g.fillStyle = rgba('paper', 0.25); g.beginPath(); g.arc(CX, CY, 18 + 30 * q, 0, TAU); g.fill();
      g.fillStyle = COL.paper; g.beginPath(); g.arc(CX, CY, 7, 0, TAU); g.fill();
    }
  }
  g.lineCap = 'butt';
}

/* ═════════════════════════ 01 · KINETIC TYPE  (beats 4–10) ═════════════════════════
   A virtual camera whips across a typographic layout, one word per beat.
   Variable axes (wdth 62–125, wght 100–900) do the acting. Then we dive into
   the full stop — and it becomes the next scene. */

const S1 = { root: $('s1') };

function buildS1() {
  const r = S1.root;
  r.style.display = 'block';
  const world = S1.world = el('div', 'world', r);
  S1.I = makeWord(world, 'I', 'arch');
  S1.make = makeWord(world, 'make', 'serif');
  S1.things = makeWord(world, 'THINGS', 'arch');
  S1.move = makeWord(world, 'MOVE.', 'arch');
  S1.move.letters[4].style.color = COL.verm;

  const X0 = 150, TW = W - 2 * X0;
  const fit = w => {
    w.el.style.fontSize = '100px'; kern(w);
    return 100 * TW / w.el.getBoundingClientRect().width;
  };
  const fsT = fit(S1.things), fsM = fit(S1.move);
  S1.things.el.style.fontSize = fsT + 'px';
  S1.move.el.style.fontSize = fsM + 'px';
  S1.I.el.style.fontSize = fsT + 'px';
  S1.make.el.style.fontSize = (fsT * 1.22) + 'px';
  kern(S1.make);

  const cap = capRatio(), gap = fsT * 0.17;
  const hT = cap * fsT, hM = cap * fsM;
  const top = (H - (hT * 2 + hM + gap * 2)) / 2 + 6;
  const y1 = top + hT, y2 = y1 + gap + hT, y3 = y2 + gap + hM;
  place(S1.I, X0, y1);
  const iW = S1.I.el.getBoundingClientRect().width;
  const makeX = X0 + iW + fsT * 0.16;
  place(S1.make, makeX, y1);
  place(S1.things, X0, y2);
  place(S1.move, X0, y3);
  const makeW = S1.make.el.getBoundingClientRect().width;

  // the full stop: its ink centre, measured from the font itself
  ctx.font = `900 100px Archivo`; ctx.fontStretch = 'expanded';
  const pm = ctx.measureText('.');
  const dot = S1.move.letters[4];
  const inkCx = (pm.actualBoundingBoxRight - pm.actualBoundingBoxLeft) / 2 * fsM / 100;
  const inkH = pm.actualBoundingBoxAscent * fsM / 100;
  S1.dot = { x: X0 + dot.offsetLeft + inkCx, y: y3 - inkH / 2, h: inkH };
  dot.style.transformOrigin = `${inkCx}px ${S1.move.base.offsetTop - inkH / 2}px`;

  S1.focus = {
    I: { x: X0 + iW / 2, y: y1 - hT / 2 },
    make: { x: makeX + makeW / 2, y: y1 - hT * 0.36 },
    things: { x: X0 + TW / 2, y: y2 - hT / 2 },
    move: { x: X0 + TW / 2, y: y3 - hM / 2 },
    all: { x: CX, y: (top + y3) / 2 },
  };
  S1.keys = [
    { b: 4.0, f: S1.focus.I, z: 3.2 },
    { b: 5.0, f: S1.focus.make, z: 2.25 },
    { b: 6.0, f: S1.focus.things, z: 1.1 },
    { b: 7.0, f: S1.focus.move, z: 1.12 },
    { b: 8.0, f: S1.focus.all, z: 0.88 },
  ];

  // specimen annotations + baseline rules (world space: tiny when wide, legible when zoomed)
  const anno = (text, x, y, right) => {
    const a = el('div', 'abs mono', world, text);
    a.style.top = y + 'px';
    if (right) { a.style.right = (W - x) + 'px'; a.style.textAlign = 'right'; } else a.style.left = x + 'px';
    return a;
  };
  S1.annos = [
    anno('(01)  KINETIC TYPE — SPECIMEN', X0, top - 38),
    anno('ARCHIVO VARIABLE\nwdth 62 → 125  ·  wght 100 → 900', X0 + TW, top - 2, true),
    anno('INSTRUMENT SERIF ITALIC', makeX + fsT * 0.1, y1 + 14),
    anno('↘ 128 BPM  ·  ONE WORD PER BEAT', X0, y3 + 22),
  ];
  S1.readout = anno('', X0 + TW, y2 - hT - 30, true);
  S1.annos.push(S1.readout);
  S1.rules = [y1, y2, y3].map(y => {
    const d = el('div', 'rule', world);
    d.style.cssText += `left:${X0}px;top:${y + 6}px;width:${TW}px;background:rgba(12,12,16,.22)`;
    return d;
  });
  S1.safety = el('div', 'layer', r);
  S1.safety.style.background = COL.verm;
  r.style.display = 'none';
}

function s1Camera(b) {
  const K = S1.keys, WHIP = 0.42;
  let x = K[0].f.x, y = K[0].f.y, lz = Math.log(K[0].z);
  for (let k = 0; k < K.length - 1; k++) {
    const a = K[k], n = K[k + 1];
    const e = E.inOutExpo(inv(n.b - WHIP, n.b, b));
    if (e <= 0) break;
    x = lerp(a.f.x, n.f.x, e); y = lerp(a.f.y, n.f.y, e);
    lz = lerp(Math.log(a.z), Math.log(n.z), e);
  }
  lz += 0.03 * Math.max(0, b - 4);               // constant slow push-in keeps holds alive
  return { sx: CX, sy: CY, px: x, py: y, z: Math.exp(lz), r: 0 };
}

function drawS1(t, b) {
  S1.root.style.display = 'block';
  const amp = Math.sin(Math.PI * inv(8.0, 9.2, b));
  const wave = (i, L) => amp * (0.5 - 0.5 * Math.cos(TAU * (b - 8) * 1.2 - i * 0.75 - L * 1.4));

  // I — grows out of its baseline on the drop
  {
    const s = spring(t - T(4) + 0.06, 260, 12), w = wave(0, 0);
    const e = S1.I.letters[0];
    setVar(e, 125 - 63 * w, 900 - 600 * w);
    const sx = clamp(1 / Math.sqrt(Math.max(s, 0.2)), 0.85, 1.6);
    e.style.transform = `scale(${sx.toFixed(4)}, ${s.toFixed(4)})`;
  }
  // make — italic letters rise and settle
  S1.make.letters.forEach((e, i) => {
    const a = 4.78 + 0.07 * i, p = E.outExpo(inv(T(a), T(a + 0.7), t));
    e.style.opacity = clamp(p * 4).toFixed(3);
    e.style.transform = `translateY(${((1 - p) * 0.75).toFixed(4)}em) rotate(${((1 - p) * 18).toFixed(2)}deg)`;
  });
  // THINGS — hairline condensed → black expanded, letter by letter
  let rd = null;
  S1.things.letters.forEach((e, i) => {
    const s = spring(t - T(5.76 + 0.045 * i), 150, 11), w = wave(i, 1);
    const wd = clamp(lerp(62, 125, s), 62, 125) - 63 * w;
    const wg = clamp(lerp(100, 900, s), 100, 900) - 650 * w;
    setVar(e, wd, wg);
    const over = Math.max(0, s - 1);
    e.style.transform = `scale(${(1 + over * 0.5).toFixed(4)}, ${(1 - over * 0.35).toFixed(4)})`;
    if (i === 0) rd = [wd, wg];
  });
  S1.readout.textContent = `T  →  wdth ${rd[0].toFixed(1).padStart(5, ' ')}  ·  wght ${String(Math.round(rd[1])).padStart(3, ' ')}`;
  // MOVE. — letters punch in from alternating sides; the full stop pops last
  S1.move.letters.forEach((e, i) => {
    if (i === 4) {
      const s = spring(t - T(7.12), 320, 13);
      e.style.transform = `scale(${s.toFixed(4)})`;
      return;
    }
    const a = 6.8 + 0.05 * i, p = E.outExpo(inv(T(a), T(a + 0.6), t)), dir = i % 2 ? 1 : -1;
    e.style.opacity = p > 0 ? 1 : 0;
    e.style.transform = `translateY(${(dir * (1 - p) * 1.1).toFixed(4)}em)`;
    const w = wave(i, 2);
    setVar(e, 125 - 63 * w, 900 - 650 * w);
  });

  const an = E.outCubic(inv(7.55, 8.2, b));
  S1.annos.forEach((a, i) => {
    const p = E.outCubic(inv(7.55 + i * 0.05, 8.2 + i * 0.05, b));
    a.style.opacity = p.toFixed(3);
    a.style.transform = `translateY(${((1 - p) * 10).toFixed(2)}px)`;
  });
  S1.rules.forEach((r, i) => { r.style.transform = `scaleX(${E.outExpo(inv(7.7 + i * 0.08, 8.6 + i * 0.08, b)).toFixed(4)})`; });
  void an;

  // camera — whips between words, then dives into the full stop
  let c = s1Camera(b);
  const dive = inv(9.25, 10.0, b);
  if (dive > 0) {
    const c0 = s1Camera(9.25), D = S1.dot;
    const s0x = CX + (D.x - c0.px) * c0.z, s0y = CY + (D.y - c0.py) * c0.z;
    const e = E.inCubic(dive), m = E.inOutCubic(dive);
    c = { sx: lerp(s0x, CX, m), sy: lerp(s0y, CY, m), px: D.x, py: D.y, z: c0.z * Math.exp(Math.log(160 / c0.z) * e), r: 14 * E.inCubic(dive) };
  }
  S1.world.style.transform = `translate(${c.sx.toFixed(3)}px, ${c.sy.toFixed(3)}px) rotate(${c.r.toFixed(3)}deg) scale(${c.z.toFixed(5)}) translate(${(-c.px).toFixed(3)}px, ${(-c.py).toFixed(3)}px)`;
  S1.safety.style.opacity = inv(9.9, 9.99, b).toFixed(3);
}

/* ═════════════════════════ 02 · SHAPE & RHYTHM  (beats 10–16) ═════════════════════════
   Out of the full stop: a 16×9 grid. Dots → squares → card-flip into Truchet
   tiles, which re-route themselves in waves. Then every tile lets go and the
   dots spiral into a phyllotaxis disc. */

const S2 = { s: 120, cols: 16, rows: 9, cells: [] };
const P = { N: 2000 };
const SR = 330;   // on-screen radius of the unit sphere / disc

function buildS2() {
  const { s, cols, rows } = S2;
  const maxD = Math.hypot(CX, CY);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = s / 2 + i * s, y = s / 2 + j * s;
    S2.cells.push({
      i, j, x, y,
      dc: Math.hypot(x - CX, y - CY) / maxD,
      diag: (i + j) / (cols + rows - 2),
      o: hash(i * 7.1 + j * 13.3) < 0.5 ? 0 : 1,
      h1: hash(i * 3.1 + j * 5.7 + 1), h2: hash(i * 9.2 + j * 1.3 + 2),
    });
  }
  [...S2.cells].sort((a, b) => a.dc - b.dc).forEach((c, k) => { c.k = k; });
  S2.byK = [...S2.cells].sort((a, b) => a.k - b.k);
}

const S2WAVES = [
  { b: 13.0, delay: c => c.dc * 0.45, on: c => c.h1 < 0.55 },
  { b: 13.5, delay: c => c.diag * 0.45, on: c => c.h2 < 0.55 },
  { b: 14.0, delay: c => (1 - c.dc) * 0.4, on: () => true },
];

function drawCell(c, t, b) {
  const g = ctx, s = S2.s;
  const flyA = 15.0 + c.k / 144 * 0.35;
  if (b >= flyA) return;
  const flipA = 11.95 + c.diag * 0.55, flipP = E.inOutCubic(inv(flipA, flipA + 0.32, b));
  const retA = 14.55 + c.dc * 0.3, retP = E.inOutCubic(inv(retA, retA + 0.35, b));
  g.save(); g.translate(c.x, c.y);
  g.fillStyle = COL.ink; g.strokeStyle = COL.ink;
  if (flipP < 0.5) {
    const pop = spring(t - T(10 + c.dc * 0.55), 280, 15);
    if (pop <= 0) { g.restore(); return; }
    const m = spring(t - T(11 + c.diag * 0.5), 200, 15), mc = clamp(m);
    const h = lerp(s * 0.3, s * 0.36, mc) * pop;
    const rad = clamp(lerp(h, s * 0.06, mc), 0, h);
    g.scale(Math.cos(flipP * Math.PI), 1);
    g.rotate(m * Math.PI / 2);
    g.beginPath(); g.roundRect(-h, -h, 2 * h, 2 * h, rad); g.fill();
  } else {
    let q = c.o;
    for (const w of S2WAVES) if (w.on(c)) q += spring(t - T(w.b + w.delay(c)), 240, 17);
    g.scale(flipP < 1 ? -Math.cos(flipP * Math.PI) : 1, 1);
    g.rotate(q * Math.PI / 2);
    g.lineWidth = s * 0.22 * (1 - retP * 0.35);
    const hs = (Math.PI / 4) * (1 - retP);
    if (hs > 0.002) {
      g.beginPath(); g.arc(-s / 2, -s / 2, s / 2, Math.PI / 4 - hs, Math.PI / 4 + hs); g.stroke();
      g.beginPath(); g.arc(s / 2, s / 2, s / 2, 5 * Math.PI / 4 - hs, 5 * Math.PI / 4 + hs); g.stroke();
    }
    if (retP > 0) { g.beginPath(); g.arc(0, 0, s * 0.1 * E.outBack(retP), 0, TAU); g.fill(); }
  }
  g.restore();
}

function irisRadius(b) {
  if (b < 15.0) return 1e4;
  if (b < 16.0) return lerp(1150, SR * 1.22, E.inOutExpo(inv(15.0, 15.85, b)));
  return SR * 1.22 * (1 - E.inOutCubic(inv(16.0, 16.35, b)));
}

function drawS2(t, b) {
  const g = ctx;
  const iris = irisRadius(b);
  if (iris > 1200) { g.fillStyle = COL.verm; g.fillRect(0, 0, W, H); }
  else {
    g.fillStyle = COL.ink; g.fillRect(0, 0, W, H);
    g.fillStyle = COL.verm; g.beginPath(); g.arc(CX, CY, iris, 0, TAU); g.fill();
  }
  if (b < 15.5) for (const c of S2.cells) drawCell(c, t, b);
  if (b >= 14.95) drawParticles(t, b);
}

/* ═════════════════════════ 03 · PARTICLES IN 3D  (beats 16–21) ═════════════════════════
   The flat disc was a sphere seen head-on: it folds closed, spins up, re-forms
   as a (2,3) torus knot, then the camera flies straight through it. */

function buildParticles() {
  const N = P.N;
  P.disk = new Float32Array(N * 2); P.sph = new Float32Array(N * 3); P.knot = new Float32Array(N * 3);
  P.jit = new Float32Array(N * 3); P.h = new Float32Array(N);
  P.sx = new Float32Array(N); P.sy = new Float32Array(N); P.z = new Float32Array(N);
  P.rad = new Float32Array(N); P.streak = new Float32Array(N);
  P.order = new Uint16Array(N);
  const knot = phi => {
    const r = 2 + Math.cos(3 * phi);
    return [r * Math.cos(2 * phi) * 0.34, r * Math.sin(2 * phi) * 0.34, Math.sin(3 * phi) * 0.34];
  };
  for (let k = 0; k < N; k++) {
    const th = k * GOLD, rd = Math.sqrt((k + 0.5) / N);
    P.disk[k * 2] = rd * Math.cos(th); P.disk[k * 2 + 1] = rd * Math.sin(th);
    const z = 1 - 2 * (k + 0.5) / N, rr = Math.sqrt(1 - z * z);
    P.sph[k * 3] = rr * Math.cos(th); P.sph[k * 3 + 1] = rr * Math.sin(th); P.sph[k * 3 + 2] = z;
    // torus-knot tube with a proper frame
    const phi = (k / N) * TAU, p0 = knot(phi), p1 = knot(phi + 1e-3);
    let tx = p1[0] - p0[0], ty = p1[1] - p0[1], tz = p1[2] - p0[2];
    const tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
    let nx = ty, ny = -tx, nz = 0; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
    const psi = k * 2.399963 * 7, tr = 0.075;
    P.knot[k * 3] = p0[0] + tr * (Math.cos(psi) * nx + Math.sin(psi) * bx);
    P.knot[k * 3 + 1] = p0[1] + tr * (Math.cos(psi) * ny + Math.sin(psi) * by);
    P.knot[k * 3 + 2] = p0[2] + tr * (Math.cos(psi) * nz + Math.sin(psi) * bz);
    const u = hash(k * 1.7) * TAU, v = Math.acos(2 * hash(k * 2.3 + 5) - 1);
    P.jit[k * 3] = Math.sin(v) * Math.cos(u); P.jit[k * 3 + 1] = Math.sin(v) * Math.sin(u); P.jit[k * 3 + 2] = Math.cos(v);
    P.h[k] = hash(k * 0.77 + 3);
  }
}

function camYaw(b) {
  const x = Math.max(0, b - 16), w = 1.15;          // constant angular acceleration for 1 beat, then cruise
  return x < 1 ? w * x * x / 2 : w * 0.5 + w * (x - 1);
}
const dollyAt = b => 3.45 * E.inCubic(inv(19.9, 21.0, b));

function drawParticles(t, b) {
  const g = ctx, N = P.N;
  const iris = irisRadius(b);
  const ms = b < 16 ? 0 : spring(t - T(16), 70, 11);
  const yaw = camYaw(b), pitch = 0.38 * E.inOutSine(inv(16, 17.5, b)) + 0.1 * Math.sin((b - 16) * 1.3) * inv(16, 17, b);
  const Dc = 3.5, f = SR * Dc;
  const D = Dc - dollyAt(b), dPrev = Dc - dollyAt(b - 0.06);
  const pulse = b >= 16.5 ? 0.045 * Math.exp(-7 * fract(b)) : 0;
  const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const ink = RGB.ink, paper = RGB.paper, ultra = RGB.ultra, acid = RGB.acid;
  let n = 0;

  for (let k = 0; k < N; k++) {
    let sx, sy, z2 = 0, rad, streak = 0;
    if (k < 144 && b < 16) {
      // grid dots in flight towards their seat in the spiral
      const c = S2.byK[k], a = 15.0 + k / 144 * 0.35, e = E.inOutCubic(inv(a, a + 0.55, b));
      if (b < a) continue;
      const tx = CX + P.disk[k * 2] * SR, ty = CY + P.disk[k * 2 + 1] * SR;
      const bend = Math.sin(Math.PI * e) * 60 * (hash(k) - 0.5);
      sx = lerp(c.x, tx, e) + bend; sy = lerp(c.y, ty, e) - bend * 0.5;
      rad = lerp(S2.s * 0.1, 3, e);
    } else {
      let pop = 1;
      if (b < 16.2 && k >= 144) {
        const a = 15.25 + 0.62 * (k - 144) / (N - 144);
        pop = clamp(spring(t - T(a), 400, 18), 0, 1.4);
        if (pop <= 0) continue;
      }
      let x = lerp(P.disk[k * 2], P.sph[k * 3], ms), y = lerp(P.disk[k * 2 + 1], P.sph[k * 3 + 1], ms), z = P.sph[k * 3 + 2] * ms;
      if (b > 18) {
        const a = 18 + P.h[k] * 0.55, mk = E.inOutCubic(inv(a, a + 0.9, b));
        if (mk > 0) {
          const sw = Math.sin(Math.PI * mk) * 0.32;
          x = lerp(x, P.knot[k * 3], mk) + sw * P.jit[k * 3];
          y = lerp(y, P.knot[k * 3 + 1], mk) + sw * P.jit[k * 3 + 1];
          z = lerp(z, P.knot[k * 3 + 2], mk) + sw * P.jit[k * 3 + 2];
        }
      }
      const s = 1 + pulse; x *= s; y *= s; z *= s;
      const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw;
      const y1 = y * cp - z1 * sp; z2 = y * sp + z1 * cp;
      const dz = D - z2;
      if (dz < 0.1) continue;
      const pr = f / dz;
      sx = CX + x1 * pr; sy = CY + y1 * pr;
      rad = 3 * pr / SR * pop;
      streak = (D - dPrev) / dz;            // screen-space streak while the camera dollies
    }
    P.sx[n] = sx; P.sy[n] = sy; P.z[n] = z2; P.order[n] = k; P.rad[n] = rad; P.streak[n] = streak;
    n++;
  }
  // painter's order
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, c) => P.z[a] - P.z[c]);
  g.lineCap = 'round';
  for (const i of idx) {
    const k = P.order[i], sx = P.sx[i], sy = P.sy[i], rad = P.rad[i];
    if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) continue;
    const inside = Math.hypot(sx - CX, sy - CY) < iris;
    const flat = inside ? ink : paper;
    const d01 = clamp((P.z[i] + 1) / 2);
    let col = mixRGB(ultra, paper, d01 ** 1.3);
    if (k % 31 === 0) col = acid;
    col = mixRGB(flat, col, ms);
    const a = lerp(1, 0.3 + 0.7 * d01, ms);
    const st = P.streak[i];
    if (st > 0.004) {
      const lx = (sx - CX) * st, ly = (sy - CY) * st;
      g.strokeStyle = css(col, a); g.lineWidth = rad * 1.6;
      g.beginPath(); g.moveTo(sx - lx, sy - ly); g.lineTo(sx, sy); g.stroke();
    } else {
      g.fillStyle = css(col, a);
      if (rad < 1.6) g.fillRect(sx - rad, sy - rad, rad * 2, rad * 2);
      else { g.beginPath(); g.arc(sx, sy, rad, 0, TAU); g.fill(); }
    }
  }
  g.lineCap = 'butt';

  // viewport furniture: an orbit ring and a live readout
  const furn = inv(16.4, 17.0, b) * (1 - inv(19.8, 20.3, b));
  if (furn > 0) {
    g.strokeStyle = rgba('paper', 0.28 * furn); g.lineWidth = 1.2;
    g.beginPath();
    for (let i = 0; i <= 120; i++) {
      const a = i / 120 * TAU, R = 1.42;
      const x = R * Math.cos(a), z = R * Math.sin(a), y = 0;
      const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw;
      const y1 = y * cp - z1 * sp, zz = y * sp + z1 * cp;
      const pr = f / (D - zz);
      i ? g.lineTo(CX + x1 * pr, CY + y1 * pr) : g.moveTo(CX + x1 * pr, CY + y1 * pr);
    }
    g.stroke();
    g.font = '500 14px "JetBrains Mono"'; g.letterSpacing = '2px'; g.fillStyle = rgba('paper', 0.75 * furn);
    const form = b < 18.55 ? 'FIBONACCI SPHERE' : 'TORUS KNOT (2,3)';
    const deg = ((yaw * 180 / Math.PI) % 360).toFixed(1).padStart(5, '0');
    const lx = CX + 520, ly = CY - 40;
    g.fillText(form, lx, ly);
    g.fillStyle = rgba('paper', 0.5 * furn);
    g.fillText(`n = ${N}`, lx, ly + 26);
    g.fillText(`yaw ${deg}°`, lx, ly + 52);
    g.fillText(`pitch ${(pitch * 180 / Math.PI).toFixed(1)}°`, lx, ly + 78);
    g.strokeStyle = rgba('paper', 0.35 * furn); g.lineWidth = 1;
    g.beginPath(); g.moveTo(lx - 16, ly - 5); g.lineTo(lx - 150, ly - 5); g.stroke();
  }
}

function drawS3(t, b) {
  ctx.fillStyle = COL.ink; ctx.fillRect(0, 0, W, H);
  if (b < 16.42) {
    const iris = irisRadius(b);
    ctx.fillStyle = COL.verm; ctx.beginPath(); ctx.arc(CX, CY, Math.max(0, iris), 0, TAU); ctx.fill();
  }
  drawParticles(t, b);
  if (b >= 20.7) drawGL(t, b);
}

/* ═════════════════════════ 04 · REAL-TIME SHADERS  (beats 21–25) ═════════════════════════
   Domain-warped fBm in the reel's palette, lit via screen-space derivatives.
   The type is refracted through the liquid, channel by channel. */

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uFlow, uReveal, uTextAmt, uTextScale, uTextWipe, uShock1, uShock2, uSwirl, uZoom, uPulse;
uniform sampler2D uText;
out vec4 o;
const vec3 INK = vec3(12., 12., 16.) / 255.;
const vec3 PAPER = vec3(242., 237., 228.) / 255.;
const vec3 VERM = vec3(255., 74., 28.) / 255.;
const vec3 ULTRA = vec3(58., 51., 255.) / 255.;
const vec3 ACID = vec3(216., 255., 61.) / 255.;
vec2 hash2(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash2(i), f), dot(hash2(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
             mix(dot(hash2(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash2(i + vec2(1, 1)), f - vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { s += a * noise(p); p = m * p; a *= 0.5; }
  return s;
}
float shock(float d, float st) {
  if (st < 0.0 || st > 1.6) return 0.0;
  float r = st * 1.5;
  return exp(-pow((d - r) * 9.0, 2.0)) * exp(-st * 2.4);
}
void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 uv = fc / uRes;
  vec2 p = (fc - 0.5 * uRes) / uRes.y;
  float d = length(p);
  vec2 dir = p / max(d, 1e-4);
  float sw = shock(d, uShock1) + shock(d, uShock2);
  vec2 w = p - dir * sw * 0.06;
  float ang = uSwirl / (d + 0.22);
  float cs = cos(ang), sn = sin(ang);
  w = mat2(cs, -sn, sn, cs) * w;
  vec2 q0 = w * 1.3 / uZoom;
  float t = uFlow;
  vec2 q = vec2(fbm(q0 + t * 0.30), fbm(q0 + vec2(5.2, 1.3) - t * 0.25));
  vec2 r = vec2(fbm(q0 + 3.0 * q + vec2(1.7, 9.2) + t * 0.22), fbm(q0 + 3.0 * q + vec2(8.3, 2.8) - t * 0.18));
  float f = fbm(q0 + 3.2 * r);
  // banded palette ramp: ink → ultramarine → vermilion → acid → paper
  float v = f * 1.7 + 0.5 + 0.35 * r.x;
  vec3 col = mix(INK, ULTRA, smoothstep(0.02, 0.32, v));
  col = mix(col, VERM, smoothstep(0.5, 0.6, v));
  col = mix(col, ACID, smoothstep(0.72, 0.8, v));
  col = mix(col, PAPER, smoothstep(0.86, 0.95, v));
  col = mix(col, INK, smoothstep(0.35, 0.6, length(q)) * 0.55);
  // cheap lighting from screen-space derivatives
  vec3 n = normalize(vec3(dFdx(v) * -28.0, dFdy(v) * -28.0, 1.0));
  vec3 L = normalize(vec3(-0.5, 0.6, 0.8));
  float diff = 0.78 + 0.22 * dot(n, L);
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 28.0);
  col = col * diff + vec3(spec) * 0.35 + sw * 0.18;
  // type refracted through the low-frequency warp field, split per channel
  vec2 tuv = vec2(uv.x, 1.0 - uv.y);
  tuv = (tuv - 0.5) / uTextScale + 0.5;
  vec2 off = r * vec2(0.05, -0.08) + dir * sw * 0.03;
  float tr = texture(uText, tuv + off).a;
  float tg = texture(uText, tuv + off * 1.25).a;
  float tb = texture(uText, tuv + off * 1.5).a;
  float wipe = smoothstep(uTextWipe, uTextWipe - 0.03, tuv.x + 0.05 * noise(vec2(tuv.y * 7.0, t)));
  col = mix(col, PAPER, vec3(tr, tg, tb) * uTextAmt * wipe);
  col *= 1.0 - 0.3 * d * d;
  col *= 1.0 + uPulse * 0.07;
  float edge = uReveal + 0.06 * noise(p * 5.0 + t) + 0.02 * noise(p * 17.0 - t);
  float m = 1.0 - smoothstep(edge - 0.005, edge, d);
  o = vec4(col * m, m);
}`;

const GLR = (() => {
  const canvas = $('gl');
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true });
  if (!gl) return null;
  const sh = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, '#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  for (const n of ['uRes', 'uFlow', 'uReveal', 'uTextAmt', 'uTextScale', 'uTextWipe', 'uShock1', 'uShock2', 'uSwirl', 'uZoom', 'uPulse', 'uText']) U[n] = gl.getUniformLocation(prog, n);
  const tex = gl.createTexture();
  return {
    canvas,
    setText(src) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    },
    draw(u) {
      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uRes, W, H);
      for (const k in u) gl.uniform1f(U[k], u[k]);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U.uText, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
})();

function buildGLText() {
  if (!GLR) return;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.font = '900 100px Archivo'; g.fontStretch = 'expanded';
  const w = g.measureText('FLOW').width, fs = 100 * 1560 / w;
  g.font = `900 ${fs}px Archivo`; g.fontStretch = 'expanded';
  const m = g.measureText('FLOW');
  g.fillStyle = '#fff'; g.textAlign = 'center';
  g.fillText('FLOW', CX, CY + m.actualBoundingBoxAscent / 2);
  GLR.setText(c);
}

function drawGL(t, b) {
  if (!GLR) return;
  GLR.canvas.style.display = 'block';
  const sh = x => (x < 0 ? -1 : x);
  GLR.draw({
    uFlow: 0.9 * (t - T(20.5)) + 2.2 * E.inCubic(inv(24.2, 25, b)),
    uReveal: 1.35 * E.inOutCubic(inv(20.72, 21.4, b)),
    uTextAmt: E.outCubic(inv(21.55, 21.9, b)) * (1 - E.inCubic(inv(24.25, 24.65, b))),
    uTextWipe: lerp(-0.1, 1.15, E.inOutCubic(inv(21.5, 22.2, b))),
    uTextScale: 1 + 0.035 * Math.max(0, b - 21.5) + 5 * E.inExpo(inv(24.1, 24.7, b)),
    uShock1: sh(t - T(23)), uShock2: sh(t - T(24)),
    uSwirl: 2.4 * E.inCubic(inv(24.3, 25, b)),
    uZoom: 1 + 0.03 * Math.max(0, b - 21) + 0.8 * E.inCubic(inv(24.3, 25, b)),
    uPulse: b >= 21 ? Math.exp(-6 * fract(b)) : 0,
  });
}

function drawS4(t, b) {
  ctx.fillStyle = COL.ink; ctx.fillRect(0, 0, W, H);
  drawGL(t, b);
}

/* ═════════════════════════ 05 · EDIT & PACING  (beats 25–28) ═════════════════════════
   A twisting tunnel that keeps accelerating; a recap on eighth notes, the name
   on thirty-seconds, then one frame of silence before the hit. */

const S5WORDS = [
  { b: 25.0, txt: 'TYPE', n: '01', bg: null, fg: 'paper' },
  { b: 25.5, txt: 'SHAPE', n: '02', bg: 'acid', fg: 'ink' },
  { b: 26.0, txt: 'SPACE', n: '03', bg: null, fg: 'paper' },
  { b: 26.5, txt: 'LIGHT', n: '04', bg: 'ultra', fg: 'paper' },
];
const S5LETTERS = [['verm', 'ink'], ['paper', 'ink'], ['ultra', 'paper'], ['acid', 'ink'], ['ink', 'paper'], ['verm', 'paper']];
const S5PAL = ['verm', 'ink', 'ultra', 'ink', 'acid', 'ink', 'paper', 'ink'];
const fitCache = {};
function archFit(txt, width) {
  const key = txt + width;
  if (!fitCache[key]) {
    ctx.font = '900 100px Archivo'; ctx.fontStretch = 'expanded';
    const m = ctx.measureText(txt);
    fitCache[key] = { fs: 100 * width / m.width, asc: m.actualBoundingBoxAscent / m.width * width };
  }
  return fitCache[key];
}

function drawTunnel(t, b) {
  const g = ctx, x = Math.max(0, b - 24.6);
  const phi = 2.4 * x + 1.15 * x * x * x;
  g.fillStyle = COL.ink; g.fillRect(0, 0, W, H);
  const K = 34, base = 560;
  for (let k = 0; k < K; k++) {
    const z = k + 1 - fract(phi) + 0.12;
    const id = k + Math.floor(phi);
    const size = base / z;
    const next = base / (z + 1);
    if (next > 2400) continue;                     // fully hidden behind the next ring in
    const fog = clamp(z / (K - 4)) ** 0.7;
    const col = mixRGB(RGB[S5PAL[id % S5PAL.length]], RGB.ink, fog);
    g.save();
    g.translate(CX + Math.sin(t * 2.1 + z * 0.3) * 30 / z, CY + Math.cos(t * 1.7 + z * 0.3) * 20 / z);
    g.rotate(id * 0.21 + t * 0.9 + x * x * 0.5);
    g.fillStyle = css(col);
    g.beginPath(); g.roundRect(-size, -size, size * 2, size * 2, size * 0.14); g.fill();
    g.restore();
  }
}

function drawS5(t, b) {
  const g = ctx, bq = BQ;
  if (bq >= 27.75) {
    // the breath: a single point, like the very first frame
    g.fillStyle = COL.ink; g.fillRect(0, 0, W, H);
    const p = inv(27.75, 27.95, b);
    g.fillStyle = rgba('paper', 0.2); g.beginPath(); g.arc(CX, CY, 16 + 20 * p, 0, TAU); g.fill();
    g.fillStyle = COL.paper; g.beginPath(); g.arc(CX, CY, 7, 0, TAU); g.fill();
    return;
  }
  if (bq >= 27.0) {
    const i = Math.min(5, Math.floor((bq - 27.0) / 0.125));
    const [bg, fg] = S5LETTERS[i];
    g.fillStyle = COL[bg]; g.fillRect(0, 0, W, H);
    const L = 'CLAUDE'[i], fit = archFit('M', 620);
    g.font = `900 ${fit.fs}px Archivo`; g.fontStretch = 'expanded';
    g.fillStyle = COL[fg]; g.textAlign = 'center';
    const pop = 1 + 0.08 * (1 - inv(27.0 + i * 0.125, 27.0 + i * 0.125 + 0.1, b));
    g.save(); g.translate(CX, CY); g.scale(pop, pop);
    g.fillText(L, 0, fit.asc / 2);
    g.restore(); g.textAlign = 'left';
    g.font = '700 22px "JetBrains Mono"'; g.letterSpacing = '4px'; g.fillStyle = COL[fg];
    g.fillText(`${i + 1}/6`, 120, 150);
    return;
  }
  drawTunnel(t, b);
  let wi = -1;
  for (let i = 0; i < S5WORDS.length; i++) if (bq >= S5WORDS[i].b) wi = i;
  if (wi < 0) return;
  const w = S5WORDS[wi];
  if (w.bg) { g.fillStyle = COL[w.bg]; g.fillRect(0, 0, W, H); }
  const fit = archFit(w.txt, 1380);
  const pop = 1 + 0.14 * (1 - E.outExpo(inv(w.b, w.b + 0.3, b)));
  g.save(); g.translate(CX, CY); g.scale(pop, pop);
  g.font = `900 ${fit.fs}px Archivo`; g.fontStretch = 'expanded';
  g.fillStyle = COL[w.fg]; g.textAlign = 'center';
  g.fillText(w.txt, 0, fit.asc / 2);
  g.textAlign = 'left';
  g.font = '700 24px "JetBrains Mono"'; g.letterSpacing = '4px';
  g.fillText(w.n, -690, -fit.asc / 2 - 30);
  g.restore();
}

/* ═════════════════════════ 06 · SIGN-OFF  (beats 28–32) ═════════════════════════
   The point bursts into the name. Everything breathes for two bars, then
   folds back into the point we started from. */

const S6 = { root: $('s6') };
const S6BASE = 112;

function buildS6() {
  const r = S6.root;
  r.style.display = 'block';
  const name = S6.name = makeWord(r, 'CLAUDE', 'arch');
  name.letters.forEach(e => setVar(e, S6BASE, 900));
  name.el.style.fontSize = '100px';
  kern(name, `'wdth' ${S6BASE}, 'wght' 900`);
  const NW = 1480;
  const fs = 100 * NW / name.el.getBoundingClientRect().width;
  name.el.style.fontSize = fs + 'px';
  const cap = capRatio(900, 'expanded') * fs * 0.985;
  const L = (W - NW) / 2, R = L + NW, base = 580;
  place(name, L, base);
  S6.centers = name.letters.map(e => L + e.offsetLeft + e.offsetWidth / 2);

  S6.bar = el('div', 'abs', r);
  S6.bar.style.cssText += `left:${L}px;top:${base + 30}px;width:${NW}px;height:12px;background:${COL.verm};transform-origin:0 50%`;

  S6.role = makeWord(r, 'Motion Designer', 'serif');
  S6.role.el.style.fontSize = '104px';
  kern(S6.role);
  place(S6.role, L - 4, base + 168);

  const mono = (text, x, y, right) => {
    const a = el('div', 'abs mono', r, text);
    a.style.top = y + 'px';
    if (right) { a.style.right = (W - x) + 'px'; a.style.textAlign = 'right'; } else a.style.left = x + 'px';
    return a;
  };
  S6.meta = [
    { el: mono('', L, base - cap - 58), txt: '(06)  SHOWREEL — 2026' },
    { el: mono('', R, base - cap - 58, true), txt: '15 SEC · 1920×1080 · 60 FPS · 128 BPM' },
    { el: mono('', R, base + 66, true), txt: 'KINETIC TYPE\n2D / 3D / PARTICLES\nREAL-TIME SHADERS\nSOUND DESIGN' },
  ];
  S6.meta[2].el.style.lineHeight = '1.75';

  S6.tag = makeWord(r, 'let’s make something move.', 'serif');
  S6.tag.el.style.fontSize = '46px';
  S6.tag.el.style.color = COL.acid;
  kern(S6.tag);
  S6.tagW = S6.tag.el.getBoundingClientRect().width;
  place(S6.tag, R - S6.tagW, base + 300);

  S6.dot = el('div', 'abs', r);
  S6.dot.style.cssText += `left:${CX - 10}px;top:${CY - 10}px;width:20px;height:20px;border-radius:50%;background:${COL.paper}`;
  r.style.display = 'none';
}

function drawS6(t, b) {
  S6.root.style.display = 'block';
  const fold = E.inExpo(inv(31.2, 31.68, b));
  const fade = 1 - E.outCubic(inv(31.1, 31.4, b));
  const s = spring(t - T(28), 210, 15), s2 = spring(t - T(28), 90, 11);
  const breathe = inv(29, 29.8, b);
  S6.name.letters.forEach((e, i) => {
    const cx = S6.centers[i];
    const burst = (CX - cx) * (1 - s);
    const wd = clamp(S6BASE + 13 * (1 - s2) + 7 * breathe * Math.sin(TAU * (b - 29) / 2.2 - i * 0.7), 62, 125);
    setVar(e, lerp(wd, 62, fold), 900);
    const tx = burst + (CX - cx) * fold;
    const sc = lerp(0.15, 1, clamp(s, 0, 1.3)) * (1 - fold);
    e.style.transform = `translateX(${tx.toFixed(2)}px) scale(${Math.max(sc, 0).toFixed(4)}, ${Math.max(lerp(0.15, 1, clamp(s, 0, 1.3)), 0).toFixed(4)})`;
    e.style.opacity = s > 0 ? 1 : 0;
  });
  const bar = E.outExpo(inv(28.2, 28.9, b));
  S6.bar.style.transformOrigin = fold > 0 ? '50% 50%' : '0 50%';
  S6.bar.style.transform = `scaleX(${(bar * (1 - fold)).toFixed(4)})`;

  S6.role.letters.forEach((e, i) => {
    const a = 28.45 + i * 0.035, p = E.outExpo(inv(a, a + 0.7, b));
    e.style.opacity = (clamp(p * 3) * fade).toFixed(3);
    e.style.transform = `translateY(${((1 - p) * 0.6).toFixed(3)}em)`;
  });
  S6.meta.forEach((m, i) => {
    const p = inv(28.7 + i * 0.2, 29.4 + i * 0.2, b);
    m.el.textContent = scramble(m.txt, p, t, i * 5);
    m.el.style.opacity = fade.toFixed(3);
  });
  S6.tag.letters.forEach((e, i) => {
    const a = 29.6 + i * 0.022, p = E.outExpo(inv(a, a + 0.6, b));
    e.style.opacity = (clamp(p * 3) * fade).toFixed(3);
    e.style.transform = `translateY(${((1 - p) * 0.5).toFixed(3)}em)`;
  });
  // back to the point, then nothing
  const dIn = spring(t - T(31.58), 380, 16), dOut = E.inBack(inv(31.78, 31.96, b));
  const ds = b < 31.58 ? 0 : Math.max(0, dIn * (1 - dOut));
  S6.dot.style.transform = `scale(${ds.toFixed(4)})`;
}

/* ───────────────────────── HUD ───────────────────────── */

const SCENES = [
  { id: 0, to: 4, label: 'IGNITION', ease: ['back.out(1.7)', E.outBack], hud: () => 'paper', draw: drawS0 },
  { id: 1, to: 10, label: 'KINETIC TYPE', ease: ['expo.inOut', E.inOutExpo], hud: () => 'ink', draw: drawS1 },
  { id: 2, to: 16, label: 'SHAPE & RHYTHM', ease: ['spring(240, 17)', x => spring(x * 0.5, 240, 17)], hud: b => b < 15.4 ? 'ink' : 'paper', draw: drawS2 },
  { id: 3, to: 21, label: 'PARTICLES IN 3D', ease: ['sine.inOut', E.inOutSine], hud: () => 'paper', draw: drawS3 },
  { id: 4, to: 25, label: 'REAL-TIME SHADERS', ease: ['fbm(p + fbm(p))', x => 0.5 - 0.5 * Math.cos(x * Math.PI) + 0.08 * Math.sin(x * 19)], hud: () => 'paper', draw: drawS4 },
  { id: 5, to: 28, label: 'EDIT & PACING', ease: ['expo.in', E.inExpo], hud: b => {
    if (b >= 27.75) return 'paper';
    if (b >= 27) return S5LETTERS[Math.min(5, Math.floor((b - 27) / 0.125))][1];
    if (b >= 25.5 && b < 26) return 'ink';
    return 'paper';
  }, draw: drawS5 },
  { id: 6, to: 32, label: 'SIGN-OFF', ease: ['elastic.out', E.outElastic], hud: () => 'paper', draw: drawS6 },
];

function drawHUD(t, b, sc) {
  const g = hx;
  g.clearRect(0, 0, W, H);
  const alpha = E.outCubic(inv(0.35, 1.3, b)) * (1 - E.outCubic(inv(31.1, 31.4, b)));
  if (alpha <= 0) return;
  const c = sc.hud(BQ);
  g.globalAlpha = alpha;
  const full = rgba(c, 0.92), dim = rgba(c, sc.id === 4 ? 0.7 : 0.45);
  g.fillStyle = full; g.strokeStyle = full;
  // over the liquid the HUD needs a little separation
  g.shadowColor = sc.id === 4 ? 'rgba(12,12,16,0.55)' : 'transparent';
  g.shadowBlur = sc.id === 4 ? 12 : 0;

  // crop marks
  const m = 36, arm = 22 * E.outExpo(inv(0.35, 1.2, b));
  g.lineWidth = 1.5; g.beginPath();
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
    g.moveTo(x, y + sy * arm); g.lineTo(x, y); g.lineTo(x + sx * arm, y);
  }
  g.stroke();

  g.textBaseline = 'alphabetic';
  g.font = '800 14px "JetBrains Mono"'; g.letterSpacing = '3px'; g.textAlign = 'left';
  g.fillText('CLAUDE', 64, 72);
  const cw = g.measureText('CLAUDE ').width;
  g.font = '500 14px "JetBrains Mono"'; g.fillStyle = dim;
  g.fillText('/ MOTION REEL 2026', 64 + cw + 6, 72);

  // timecode + a REC light that blinks on the beat
  const f = Math.floor(NOW * FPS + 1e-6), ss = Math.floor(f / FPS), ff = f % FPS;
  g.textAlign = 'right'; g.fillStyle = full; g.font = '600 14px "JetBrains Mono"';
  g.fillText(`TC 00:00:${pad(ss)}:${pad(ff)}`, W - 64, 72);
  const tcw = g.measureText(`TC 00:00:${pad(ss)}:${pad(ff)}`).width;
  g.fillStyle = dim; g.fillText('REC', W - 64 - tcw - 26, 72);
  if (fract(BQ) < 0.5) { g.fillStyle = COL.verm; g.beginPath(); g.arc(W - 64 - tcw - 26 - g.measureText('REC').width - 14, 67, 5, 0, TAU); g.fill(); }

  // scene index
  g.textAlign = 'left'; g.fillStyle = full; g.font = '800 14px "JetBrains Mono"';
  g.fillText(`${pad(sc.id)}/06`, 64, H - 64);
  g.font = '500 14px "JetBrains Mono"'; g.fillStyle = dim;
  g.fillText(sc.label, 64 + g.measureText(`${pad(sc.id)}/06`).width + 18, H - 64);

  // beat ruler: 32 beats = 8 bars
  const x0 = 760, x1 = 1160, y = H - 68;
  for (let i = 0; i <= 32; i++) {
    const x = x0 + (x1 - x0) * i / 32, big = i % 4 === 0, past = i <= BQ;
    g.fillStyle = past ? full : dim;
    g.fillRect(x - 0.75, y - (big ? 12 : 6), 1.5, big ? 12 : 6);
  }
  const px = x0 + (x1 - x0) * clamp(b / 32);
  g.fillStyle = COL.verm; g.fillRect(px - 1, y - 18, 2, 24);
  g.font = '500 12px "JetBrains Mono"'; g.letterSpacing = '2px'; g.fillStyle = dim; g.textAlign = 'center';
  const bar = Math.floor(BQ / 4) + 1, beat = Math.floor(BQ % 4) + 1;
  g.fillText(`BAR ${Math.min(bar, 8)}.${beat}  ·  128 BPM`, (x0 + x1) / 2, y + 22);

  // the easing this scene is built on, with the beat running through it
  const bw = 112, bh = 56, bx = W - 64 - bw, by = H - 64 - bh;
  g.strokeStyle = dim; g.lineWidth = 1;
  g.beginPath(); g.moveTo(bx, by); g.lineTo(bx, by + bh); g.lineTo(bx + bw, by + bh); g.stroke();
  const fn = sc.ease[1];
  g.strokeStyle = full; g.lineWidth = 1.6; g.beginPath();
  for (let i = 0; i <= 48; i++) { const u = i / 48, v = fn(u); const X = bx + u * bw, Y = by + bh - v * bh; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }
  g.stroke();
  const u = fract(BQ), v = fn(u);
  g.fillStyle = COL.verm; g.beginPath(); g.arc(bx + u * bw, by + bh - v * bh, 4, 0, TAU); g.fill();
  g.textAlign = 'right'; g.font = '500 12px "JetBrains Mono"'; g.fillStyle = dim;
  g.fillText(sc.ease[0], bx - 16, by + bh);
  g.fillText('EASE', bx - 16, by + bh - 18);
  g.textAlign = 'left';
  g.globalAlpha = 1;
  g.shadowBlur = 0; g.shadowColor = 'transparent';
}

/* ───────────────────────── camera shake & flashes ───────────────────────── */

const IMPULSES = [{ b: 4, a: 16 }, { b: 10, a: 9 }, { b: 16, a: 9 }, { b: 21, a: 8 }, { b: 25, a: 10 }, { b: 28, a: 30 }];
const FLASHES = [{ b: 2, a: 0.35, d: 0.3 }, { b: 28, a: 1, d: 0.3 }];

function applyShake(t) {
  let x = 0, y = 0, r = 0, amp = 0;
  for (const im of IMPULSES) {
    const dt = t - T(im.b);
    if (dt < 0 || dt > 0.9) continue;
    const env = im.a * Math.exp(-dt * 7);
    amp += env;
    x += env * Math.sin(dt * 83 + im.b);
    y += env * 0.8 * Math.sin(dt * 71 + im.b * 2.3);
    r += env * 0.0009 * Math.sin(dt * 57 + im.b);
  }
  const s = 1 + amp * 2.4 / W;
  shakeEl.style.transform = amp > 0.01 ? `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(5)}rad) scale(${s.toFixed(5)})` : '';
}
function applyFlash(b) {
  let a = 0;
  for (const f of FLASHES) if (b >= f.b) a += f.a * (1 - inv(0, f.d, b - f.b)) ** 3;
  flashEl.style.opacity = clamp(a).toFixed(3);
}

/* ───────────────────────── the clock ───────────────────────── */

function seek(t, tFrame = t) {
  t = clamp(t, 0, DUR - 1e-6);
  NOW = tFrame; BQ = tFrame / B;
  const b = t / B;
  const sc = SCENES.find(s => BQ < s.to) || SCENES[SCENES.length - 1];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.letterSpacing = '0px';
  S1.root.style.display = 'none';
  S6.root.style.display = 'none';
  if (GLR) GLR.canvas.style.display = 'none';
  vignette.style.opacity = sc.id === 1 ? 0.3 : 1;
  sc.draw(t, b);
  drawHUD(t, b, sc);
  applyShake(t);
  applyFlash(b);
}

const ready = (async () => {
  await Promise.all([
    document.fonts.load('900 100px "Archivo"'),
    document.fonts.load('italic 400 100px "Instrument Serif"'),
    document.fonts.load('500 16px "JetBrains Mono"'),
    document.fonts.load('800 16px "JetBrains Mono"'),
  ]);
  await document.fonts.ready;
  buildS1(); buildS2(); buildParticles(); buildS6(); buildGLText();
  seek(0);
})();

window.REEL = { seek, ready, DUR, FPS, BPM };

/* ───────────────────────── live player ───────────────────────── */

const RENDER = new URLSearchParams(location.search).has('render');
if (RENDER) document.body.classList.add('render');
else ready.then(() => {
  const audio = $('music'), btn = $('play'), scrub = $('scrub'), tcEl = $('tc'), loopBtn = $('loop'), start = $('start');
  // at rest, show the end card rather than the black first frame
  let playing = false, loop = true, pos = T(30.3), clock0 = 0, audioOK = true, started = false;
  audio.addEventListener('error', () => { audioOK = false; });
  const fit = () => {
    const s = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`;
  };
  addEventListener('resize', fit); fit();
  const now = () => {
    if (!playing) return pos;
    if (audioOK && !audio.paused && audio.readyState >= 2) return audio.currentTime;
    return (performance.now() - clock0) / 1000;
  };
  const play = () => {
    if (!started) { started = true; pos = 0; }
    if (pos >= DUR - 0.01) pos = 0;
    playing = true; clock0 = performance.now() - pos * 1000;
    if (audioOK) { audio.currentTime = pos; audio.play().catch(() => { audioOK = false; }); }
    btn.textContent = 'PAUSE'; start.style.display = 'none';
  };
  const pause = () => { pos = now(); playing = false; audio.pause(); btn.textContent = 'PLAY'; };
  const toggle = () => (playing ? pause() : play());
  start.addEventListener('click', play);
  start.addEventListener('keydown', e => { if (e.code === 'Enter') play(); });
  btn.addEventListener('click', toggle);
  loopBtn.addEventListener('click', () => { loop = !loop; loopBtn.textContent = `LOOP: ${loop ? 'ON' : 'OFF'}`; });
  scrub.addEventListener('input', () => { started = true; pos = +scrub.value; if (playing) play(); });
  addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
      started = true;
      pos = clamp(now() + (e.code === 'ArrowRight' ? 1 : -1) / FPS * (e.shiftKey ? 30 : 1), 0, DUR);
      if (playing) play(); else seek(pos);
    }
  });
  (function frame() {
    let t = now();
    if (t >= DUR) {
      if (loop && playing) { pos = 0; play(); t = 0; } else { pause(); pos = t = DUR - 1e-3; }
    }
    seek(t);
    scrub.value = t;
    const f = Math.floor(t * FPS);
    tcEl.textContent = `00:00:${pad(Math.floor(f / FPS))}:${pad(f % FPS)}`;
    requestAnimationFrame(frame);
  })();
});

})();
