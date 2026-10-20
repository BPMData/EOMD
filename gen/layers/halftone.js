/* layer "halftone": a print dot-screen whose dots swell and shrink with a moving field (ripples, noise,
   rings) or with a word, set huge and screened like a risograph poster. Two screens at different angles
   overprint (multiply on light paper, screen on dark), so misregistered color moiré comes for free. */
(function (G) {
  'use strict';
  const C = G.core, TAU = C.TAU, D2R = Math.PI / 180;

  G.layers.halftone = {
    about: 'Halftone dot screens driven by ripples, noise, rings or a big word; two overprinted screens like a riso print.',
    knobs: {
      field: { options: ['ripples', 'noise', 'rings', 'text'], value: 'ripples' },
      text: 'COLOR',
      font: 'GenDisplay, "Arial Black", Impact, sans-serif',
      cell: [22, 8, 60, 1],
      angleA: [45, 0, 90, 1],
      angleB: [15, 0, 90, 1],
      offset: [0.35, 0, 2, 0.01],
      screens: [2, 1, 2, 1],
      scale: [3, 0.5, 12, 0.1],
      speed: [0.5, 0, 3, 0.01],
      gamma: [0.9, 0.3, 3, 0.05],
      square: [0, 0, 1, 1],
      trail: [0, 0, 0.9, 0.01],
      seed: [0, 0, 999, 1],
    },
    // plain-English explanation of each knob, shown under it in the KNOBS panel (common ones: GEN.knobHelp)
    help: {
      field: "What shapes the dots: ripples, noise (clouds), rings (pulse on the beat), or text (a big word).",
      text: "The word, when field is \"text\".",
      font: "Font for the word.",
      cell: "Dot spacing. Smaller = finer print (and slower).",
      angleA: "Angle of the first dot grid, in degrees.",
      angleB: "Angle of the second (accent) grid. A different angle from the first makes moiré patterns.",
      offset: "Misregistration: how far the two inks are shifted from each other, like a cheap print job.",
      screens: "1 = one ink. 2 = two inks printed over each other.",
      scale: "Size of the ripples or clouds. Higher = smaller and busier.",
      speed: "Motion speed.",
      gamma: "Dot growth curve. Higher = more small dots and punchier contrast.",
      square: "On = square dots.",
    },
    init(P, E) {
      const S = { P, mask: null, grids: [] };
      // dot centres for each screen, worked out once (only those on screen)
      const cell = P.cell * E.s, reach = Math.hypot(E.w, E.h) / 2 + cell, n = Math.ceil(reach / cell);
      [[P.angleA, 0], [P.angleB, P.offset]].slice(0, Math.round(P.screens)).forEach(([ang, off]) => {
        const a = ang * D2R, ca = Math.cos(a), sa = Math.sin(a), o = off * cell, xs = [], ys = [];
        for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
          const x = E.cx + (i * cell) * ca - (j * cell) * sa + o, y = E.cy + (i * cell) * sa + (j * cell) * ca + o * 0.5;
          if (x < -cell || y < -cell || x > E.w + cell || y > E.h + cell) continue;
          xs.push(x); ys.push(y);
        }
        S.grids.push({ xs: Float32Array.from(xs), ys: Float32Array.from(ys) });
      });
      if (P.field === 'text') {
        const mw = Math.round(E.w / (P.cell * E.s) * 2), mh = Math.round(E.h / (P.cell * E.s) * 2);
        S.mw = Math.max(16, mw); S.mh = Math.max(9, mh);
        S.mcv = E.make(S.mw, S.mh); S.mc = S.mcv.getContext('2d');
        S.maskAt = -1;
      }
      return S;
    },
    makeMask(S, E) {                           // render the word small, read it back as dot sizes
      const P = S.P, c = S.mc, w = S.mw, h = S.mh;
      c.clearRect(0, 0, w, h); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const txt = String(P.text || '').toUpperCase();
      c.font = '900 100px ' + P.font;
      const m = c.measureText(txt).width || 1, px = Math.min(h * 0.8, (w * 0.88) / m * 100);
      c.font = '900 ' + px + 'px ' + P.font; c.fillText(txt, w / 2, h / 2 + px * 0.04);
      const d = c.getImageData(0, 0, w, h).data, out = new Float32Array(w * h);
      for (let i = 0; i < out.length; i++) out[i] = d[i * 4 + 3] / 255;
      S.mask = out;
    },
    field(S, x, y, t, E) {
      const P = S.P, f = P.scale / E.h;
      switch (P.field) {
        case 'noise': return 0.5 + 0.6 * C.fbm(x * f, y * f, t * P.speed * 0.3, 3, E.seed);
        case 'rings': { const d = Math.hypot(x - E.cx, y - E.cy) * f; return 0.5 + 0.5 * Math.sin(d * 2.2 - t * P.speed * 3 + E.beat().pulse * 0.6); }
        case 'text': {
          const mx = Math.floor(x / E.w * S.mw), my = Math.floor(y / E.h * S.mh);
          const m = (mx >= 0 && my >= 0 && mx < S.mw && my < S.mh) ? S.mask[my * S.mw + mx] : 0;
          const rip = 0.5 + 0.5 * Math.sin(Math.hypot(x - E.cx, y - E.cy) * f * 2 - t * P.speed * 3);
          return 0.12 + 0.78 * m + 0.18 * rip;
        }
        default: {                             // ripples from two drifting sources
          const ax = E.cx + Math.cos(t * 0.13 + 1) * E.w * 0.3, ay = E.cy + Math.sin(t * 0.17) * E.h * 0.3;
          const bx = E.cx + Math.cos(t * 0.11 + 4) * E.w * 0.3, by = E.cy + Math.sin(t * 0.19 + 2) * E.h * 0.3;
          return 0.5 + 0.25 * Math.sin(Math.hypot(x - ax, y - ay) * f * 2.4 - t * P.speed * 3) + 0.25 * Math.sin(Math.hypot(x - bx, y - by) * f * 2.4 - t * P.speed * 2.3);
        }
      }
    },
    frame(ctx, S, t, dt, E) {
      const P = S.P, pal = E.pal, cell = P.cell * E.s;
      E.fade(ctx, dt, P.trail);
      if (P.field === 'text' && (S.maskAt < 0 || (S.maskAt < 3 && t - S.maskAt > 1))) { this.makeMask(S, E); S.maskAt = S.maskAt < 0 ? 0 : S.maskAt + 1; }
      const dark = C.rgb(pal.bg).reduce((a, b) => a + b, 0) < 384;
      const cols = [pal.ink, pal.accent], rmax = cell * (P.square ? 0.5 : 0.62);
      S.grids.forEach((g, si) => {
        ctx.globalCompositeOperation = si === 0 ? 'source-over' : (dark ? 'screen' : 'multiply');
        ctx.fillStyle = cols[si]; ctx.beginPath();
        for (let q = 0; q < g.xs.length; q++) {
          const x = g.xs[q], y = g.ys[q];
          let v = this.field(S, x, y, t + si * 0.6, E);
          v = Math.pow(C.clamp(v), P.gamma);
          const r = v * rmax;
          if (r < 0.35) continue;
          if (P.square) ctx.rect(x - r, y - r, r * 2, r * 2); else { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
        }
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    },
    stats(S) { return 'HALFTONE ' + S.P.field.toUpperCase() + '  ·  ' + Math.round(S.P.angleA) + '° / ' + Math.round(S.P.angleB) + '°  ·  CELL ' + S.P.cell; },
  };
})(globalThis.GEN = globalThis.GEN || {});
