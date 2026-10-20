/* gen/core.js: seeded random, hash, value noise, easing, color, beat clock.
   No dependencies. Everything hangs off globalThis.GEN (browser and Node). */
(function (G) {
  'use strict';
  const C = G.core = {};
  const TAU = C.TAU = Math.PI * 2;

  // ---- seeded random (mulberry32): r() in [0,1), plus helpers ----
  C.rng = function (seed) {
    let a = (seed >>> 0) || 0x9e3779b9;
    const r = function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.range = (lo, hi) => lo + (hi - lo) * r();
    r.int = (lo, hi) => lo + Math.floor((hi - lo + 1) * r());
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.chance = (p) => r() < p;
    return r;
  };

  // ---- integer hash -> [0,1). Pure: same inputs, same output ----
  C.hash = function (x, y, z, s) {
    let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^
            Math.imul(z | 0, 0x1b873593) ^ Math.imul(s | 0, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
    h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  };

  // ---- 3D value noise in [-1,1], smooth (quintic fade) ----
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  C.noise3 = function (x, y, z, seed) {
    const h = C.hash, s = seed | 0;
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const u = fade(x - xi), v = fade(y - yi), w = fade(z - zi);
    const l = (a, b, t) => a + (b - a) * t;
    const x00 = l(h(xi, yi, zi, s), h(xi + 1, yi, zi, s), u);
    const x10 = l(h(xi, yi + 1, zi, s), h(xi + 1, yi + 1, zi, s), u);
    const x01 = l(h(xi, yi, zi + 1, s), h(xi + 1, yi, zi + 1, s), u);
    const x11 = l(h(xi, yi + 1, zi + 1, s), h(xi + 1, yi + 1, zi + 1, s), u);
    return l(l(x00, x10, v), l(x01, x11, v), w) * 2 - 1;
  };
  // fractal sum of noise3, still roughly in [-1,1]
  C.fbm = function (x, y, z, oct, seed) {
    let a = 0.5, f = 1, sum = 0, norm = 0;
    for (let i = 0; i < (oct || 3); i++) {
      sum += a * C.noise3(x * f, y * f, z * f, (seed | 0) + i * 101);
      norm += a; a *= 0.5; f *= 2;
    }
    return sum / norm;
  };

  // ---- easing ----
  C.clamp = (x, lo = 0, hi = 1) => (x < lo ? lo : x > hi ? hi : x);
  C.lerp = (a, b, t) => a + (b - a) * t;
  C.fract = (x) => x - Math.floor(x);
  C.smooth = (t) => { t = C.clamp(t); return t * t * (3 - 2 * t); };
  C.inOut = (t) => { t = C.clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  C.outBack = (t) => { t = C.clamp(t); const k = 1.70158; return 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2); };

  // ---- color: '#rgb' / '#rrggbb' ----
  const cache = {};
  C.rgb = function (hex) {
    if (cache[hex]) return cache[hex];
    let s = String(hex || '#000').replace('#', '');
    if (s.length === 3) s = s.split('').map((c) => c + c).join('');
    const n = parseInt(s, 16) || 0;
    return (cache[hex] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
  };
  C.rgba = (hex, a) => { const c = C.rgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
  C.mix = function (a, b, t, alpha) {
    const A = C.rgb(a), B = C.rgb(b); t = C.clamp(t);
    const r = Math.round(A[0] + (B[0] - A[0]) * t), g = Math.round(A[1] + (B[1] - A[1]) * t),
          bl = Math.round(A[2] + (B[2] - A[2]) * t);
    return alpha == null ? 'rgb(' + r + ',' + g + ',' + bl + ')' : 'rgba(' + r + ',' + g + ',' + bl + ',' + alpha + ')';
  };
  C.mixArr = function (a, b, t) {
    const A = C.rgb(a), B = C.rgb(b); t = C.clamp(t);
    return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t];
  };

  // ---- beat clock: pure function of time ----
  C.beat = function (t, bpm, perBar, bars) {
    const pb = perBar || 4, nb = bars || 8, b = Math.max(0, t) * (bpm || 120) / 60;
    const ph = C.fract(b);
    return { beat: b, phase: ph, pulse: Math.exp(-ph * 5), inBar: Math.floor(b) % pb, perBar: pb,
             bar: (Math.floor(b / pb) % nb) + 1, bars: nb };
  };

  // ---- text -> points: n points spread evenly over the letters of `text` ('/' breaks lines) ----
  // make(w,h) = E.make. Coordinates in font units (1 = the font size), centered on (0,0); points come in
  // reading order (top to bottom, left to right), so a sweep by index sweeps across the word.
  // Returns { x, y, w, h } (Float32Arrays; w,h = the block's size in font units). A blank canvas (font not
  // loaded, or a stub in tests) still gives n finite points, in a box.
  C.DISPLAY_FONT = "GenDisplay, 'Helvetica Neue', Arial, sans-serif";
  C.textPoints = function (make, text, n, seed, font, weight) {
    const lines = String(text || ' ').split('/'), FS = 160, LH = FS * 1.05, PAD = Math.round(FS * 0.2);
    const f = (weight || 700) + ' ' + FS + 'px ' + (font || C.DISPLAY_FONT);
    const probe = make(8, 8).getContext('2d'); probe.font = f;
    const ws = lines.map((l) => (probe.measureText(l).width || l.length * FS * 0.6));
    const W = Math.ceil(Math.max.apply(null, ws)) + PAD * 2, H = Math.ceil(LH * lines.length) + PAD * 2;
    const g = make(W, H).getContext('2d', { willReadFrequently: true });
    g.font = f; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((l, k) => g.fillText(l, W / 2, PAD + LH * (k + 0.5)));
    let d = null; try { d = g.getImageData(0, 0, W, H).data; } catch (e) { d = null; }
    const lit = [];
    if (d) for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 127) lit.push(x, y);
    const r = C.rng(seed || 1), X = new Float32Array(n), Y = new Float32Array(n), m = lit.length / 2;
    for (let i = 0; i < n; i++) {
      if (m) { const j = Math.min(m - 1, Math.floor((i + r()) * m / n)); X[i] = (lit[2 * j] + r() * 2 - W / 2) / FS; Y[i] = (lit[2 * j + 1] + r() * 2 - H / 2) / FS; }
      else { X[i] = (r() - 0.5) * (W - PAD * 2) / FS; Y[i] = (r() - 0.5) * (H - PAD * 2) / FS; }
    }
    return { x: X, y: Y, w: (W - PAD * 2) / FS, h: (H - PAD * 2) / FS };
  };

  // ---- small helpers ----
  C.pad = (n, w) => String(Math.floor(n)).padStart(w, '0');
  C.merge = function (defs, over) {          // shallow merge; arrays and objects in `over` replace
    const o = {};
    for (const k in defs) o[k] = defs[k];
    for (const k in (over || {})) o[k] = over[k];
    return o;
  };
})(globalThis.GEN = globalThis.GEN || {});
