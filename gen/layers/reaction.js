/* layer "reaction": Gray-Scott reaction-diffusion (Turing patterns): coral, mitosis, mazes, worms.
   Two chemicals on a low-res grid feed and kill each other; the pattern grows itself. Computed on the
   CPU and smoothly upscaled. Stateful (it's a simulation), so it declares a warm-up for seeks. */
(function (G) {
  'use strict';
  const C = G.core;
  const PRESETS = { coral: [0.0545, 0.062], mitosis: [0.0367, 0.0649], maze: [0.029, 0.057], worms: [0.078, 0.061],
                    spots: [0.03, 0.062], waves: [0.014, 0.054], fingerprint: [0.055, 0.0625] };

  G.layers.reaction = {
    about: 'Gray-Scott reaction-diffusion: self-growing Turing patterns (coral, mitosis, maze, worms ...).',
    warm: 4,
    knobs: {
      pattern: { options: Object.keys(PRESETS), value: 'coral' },
      feedShift: [0, -0.01, 0.01, 0.0005],
      killShift: [0, -0.005, 0.005, 0.0002],
      sweep: [0.004, 0, 0.02, 0.0005],
      res: [220, 80, 480, 10],
      rate: [540, 60, 1800, 10],
      seeds: [14, 1, 80, 1],
      drops: [5, 0, 30, 0.5],
      prerun: [400, 0, 4000, 50],
      contrast: [2.6, 1, 6, 0.1],
      pixel: [0, 0, 1, 1],
      seed: [0, 0, 999, 1],
    },
    // plain-English explanation of each knob, shown under it in the KNOBS panel (common ones: GEN.knobHelp)
    help: {
      pattern: "Which pattern grows: coral, mitosis (dividing cells), maze, worms, spots, waves, fingerprint.",
      feedShift: "Fine-tunes the pattern. Small moves change the look a lot; drag slowly.",
      killShift: "Fine-tunes the pattern the other way. Small moves change the look a lot.",
      sweep: "Makes the left and right sides of the screen grow slightly different patterns.",
      res: "Grid detail. Higher = finer pattern, but much slower.",
      rate: "Growth speed.",
      seeds: "Number of starting spots the pattern grows from.",
      drops: "Seconds between new spots dropped in, so it never settles. 0 = none.",
      prerun: "How far grown it already is when the shot starts.",
      contrast: "Color strength.",
      pixel: "On = hard pixels. Off = smooth.",
    },
    init(P, E) {
      const w = Math.round(P.res), h = Math.max(8, Math.round(w * E.h / E.w)), n = w * h;
      const S = { P, w, h, U: new Float32Array(n).fill(1), V: new Float32Array(n), U2: new Float32Array(n), V2: new Float32Array(n),
                  acc: 0, steps: 0, drop: 0, rng: E.rng, seed: E.seed };
      const fk = PRESETS[P.pattern] || PRESETS.coral;
      S.F = fk[0] + P.feedShift; S.K = fk[1] + P.killShift;
      for (let i = 0; i < Math.round(P.seeds); i++) this.blob(S, E.rng() * w, E.rng() * h, 2 + E.rng() * 4);
      S.cv = E.make(w, h); S.c = S.cv.getContext('2d'); S.img = S.c.createImageData(w, h);
      this.sim(S, Math.round(P.prerun));
      return S;
    },
    blob(S, cx, cy, r) {
      for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) > r * r) continue;
        const q = ((y + S.h) % S.h) * S.w + ((x + S.w) % S.w);
        S.U[q] = 0.5; S.V[q] = 0.25 + 0.05 * S.rng();
      }
    },
    sim(S, steps) {
      const w = S.w, h = S.h, sw = S.P.sweep;
      for (let s = 0; s < steps; s++) {
        const U = S.U, V = S.V, U2 = S.U2, V2 = S.V2;
        for (let y = 0; y < h; y++) {
          const ym = ((y - 1 + h) % h) * w, y0 = y * w, yp = ((y + 1) % h) * w;
          for (let x = 0; x < w; x++) {
            const xm = (x - 1 + w) % w, xp = (x + 1) % w, q = y0 + x;
            const u = U[q], v = V[q];
            const lu = 0.2 * (U[y0 + xm] + U[y0 + xp] + U[ym + x] + U[yp + x]) + 0.05 * (U[ym + xm] + U[ym + xp] + U[yp + xm] + U[yp + xp]) - u;
            const lv = 0.2 * (V[y0 + xm] + V[y0 + xp] + V[ym + x] + V[yp + x]) + 0.05 * (V[ym + xm] + V[ym + xp] + V[yp + xm] + V[yp + xp]) - v;
            const F = S.F + sw * (x / w - 0.5), uvv = u * v * v;
            U2[q] = u + (lu - uvv + F * (1 - u));
            V2[q] = v + (0.5 * lv + uvv - (F + S.K) * v);
          }
        }
        S.U = U2; S.U2 = U; S.V = V2; S.V2 = V;
      }
      S.steps += steps;
    },
    frame(ctx, S, t, dt, E) {
      const P = S.P;
      // fixed-size steps from an accumulator: same total steps for the same time, whatever the frame rate
      S.acc += dt * P.rate;
      const n = Math.min(60, Math.floor(S.acc)); S.acc -= n;
      if (P.drops > 0) while (t >= (S.drop + 1) * P.drops) { S.drop++; this.blob(S, C.hash(S.drop, 1, 2, S.seed) * S.w, C.hash(S.drop, 3, 4, S.seed) * S.h, 3 + C.hash(S.drop, 5, 6, S.seed) * 3); }
      this.sim(S, n);
      const d = S.img.data, V = S.V, pal = E.pal, k = P.contrast;
      const stops = [pal.bg, pal.dim, pal.accent, pal.ink], lut = [];
      for (let i = 0; i < 256; i++) { const f = i / 256 * 3, j = Math.floor(f); lut.push(C.mixArr(stops[j], stops[Math.min(3, j + 1)], f - j)); }
      for (let q = 0, p = 0; q < V.length; q++, p += 4) {
        const c = lut[Math.min(255, Math.max(0, (V[q] * k * 255) | 0))];
        d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255;
      }
      S.c.putImageData(S.img, 0, 0);
      ctx.imageSmoothingEnabled = !P.pixel; ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(S.cv, 0, 0, E.w, E.h);
    },
    stats(S) { return 'GRAY-SCOTT F ' + S.F.toFixed(4) + '  ·  K ' + S.K.toFixed(4) + '  ·  STEPS ' + S.steps; },
  };
})(globalThis.GEN = globalThis.GEN || {});
