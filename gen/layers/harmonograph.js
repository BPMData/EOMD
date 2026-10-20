/* layer "harmonograph": damped pendulums drive a pen across turning paper. Each figure draws itself
   over `period` seconds with a glowing pen head, then fades and a new seeded figure begins.
   Near-whole-number frequency ratios with a little detune give the classic spirograph-rose look.
   Pure function of time. */
(function (G) {
  'use strict';
  const C = G.core, TAU = C.TAU;
  const RATIOS = [[1, 1], [1, 2], [2, 3], [3, 4], [1, 3], [2, 5], [3, 5], [1, 4], [4, 5]];

  G.layers.harmonograph = {
    about: 'Damped-pendulum pen drawings (harmonograph): each figure draws itself with a glowing pen, then fades.',
    knobs: {
      period: [16, 5, 60, 0.5],
      fade: [2.5, 0.5, 10, 0.1],
      damp: [0.011, 0.002, 0.05, 0.001],
      detune: [0.012, 0, 0.06, 0.001],
      rotary: [0.8, 0, 4, 0.05],
      size: [0.42, 0.1, 0.6, 0.01],
      points: [3600, 500, 12000, 100],
      width: [1.3, 0.3, 5, 0.1],
      alpha: [0.85, 0.1, 1, 0.01],
      head: [3.2, 0, 10, 0.1],
      trail: [0, 0, 0.9, 0.01],
      seed: [0, 0, 999, 1],
    },
    // plain-English explanation of each knob, shown under it in the KNOBS panel (common ones: GEN.knobHelp)
    help: {
      period: "Seconds per drawing before a new one starts.",
      fade: "Seconds of crossfade between one drawing and the next.",
      damp: "How fast the swinging dies down. Higher = shorter, tighter drawings.",
      detune: "How far off perfect the pendulums are. 0 = one closed loop; more = lacy drifting layers.",
      rotary: "How far the paper turns while it draws (the spirograph twist).",
      size: "Drawing size.",
      points: "Smoothness of the line.",
      width: "Pen thickness.",
      head: "Size of the glowing pen dot. 0 = none.",
    },
    init(P, E) { return { P, cache: new Map() }; },
    figure(S, k, E) {
      let f = S.cache.get(k);
      if (f) return f;
      const P = S.P, h = (a) => C.hash(k, a, 13, E.seed);
      const r = RATIOS[Math.floor(h(1) * RATIOS.length)];
      const pend = [];
      for (let i = 0; i < 4; i++) {
        const base = i < 2 ? r[0] : r[1];
        pend.push({ A: 0.35 + 0.65 * h(10 + i), f: base * (1 + (h(20 + i) - 0.5) * 2 * P.detune), p: h(30 + i) * TAU, d: P.damp * (0.6 + 0.8 * h(40 + i)) });
      }
      const S_end = Math.log(12) / P.damp, N = Math.round(P.points), xs = new Float32Array(N), ys = new Float32Array(N);
      const nx = 1 / (pend[0].A + pend[1].A), ny = 1 / (pend[2].A + pend[3].A), spin = (h(5) < 0.5 ? -1 : 1) * P.rotary * Math.PI;
      for (let q = 0; q < N; q++) {
        const s = q / (N - 1) * S_end;
        const x = (pend[0].A * Math.sin(pend[0].f * s + pend[0].p) * Math.exp(-pend[0].d * s) + pend[1].A * Math.sin(pend[1].f * s + pend[1].p) * Math.exp(-pend[1].d * s)) * nx;
        const y = (pend[2].A * Math.sin(pend[2].f * s + pend[2].p) * Math.exp(-pend[2].d * s) + pend[3].A * Math.sin(pend[3].f * s + pend[3].p) * Math.exp(-pend[3].d * s)) * ny;
        const a = spin * q / N, c = Math.cos(a), sn = Math.sin(a);
        xs[q] = x * c - y * sn; ys[q] = x * sn + y * c;
      }
      f = { xs, ys, N, ratio: r };
      S.cache.set(k, f); if (S.cache.size > 4) S.cache.delete(S.cache.keys().next().value);
      return f;
    },
    draw(ctx, S, k, u, alpha, E) {
      const P = S.P, f = this.figure(S, k, E), R = P.size * E.h, pal = E.pal;
      const upto = Math.max(2, Math.floor(f.N * C.clamp(1 - Math.pow(1 - C.clamp(u), 1.6))));
      const CH = 90, chunks = Math.ceil(upto / CH);
      ctx.lineWidth = Math.max(0.5, P.width * E.s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (let c = 0; c < chunks; c++) {
        const a0 = c * CH, a1 = Math.min(upto - 1, a0 + CH), rec = (c + 1) / chunks;
        ctx.strokeStyle = C.mix(pal.ink, pal.accent, Math.pow(rec, 3), alpha * P.alpha * (0.25 + 0.75 * rec));
        ctx.beginPath(); ctx.moveTo(E.cx + f.xs[a0] * R, E.cy + f.ys[a0] * R);
        for (let q = a0 + 1; q <= a1; q++) ctx.lineTo(E.cx + f.xs[q] * R, E.cy + f.ys[q] * R);
        ctx.stroke();
      }
      if (P.head > 0 && u < 1) {
        const q = upto - 1, rr = P.head * E.s * (1 + 0.4 * E.beat().pulse);
        ctx.fillStyle = C.rgba(pal.accent, alpha); ctx.beginPath(); ctx.arc(E.cx + f.xs[q] * R, E.cy + f.ys[q] * R, rr, 0, TAU); ctx.fill();
        ctx.fillStyle = C.rgba(pal.accent, alpha * 0.18); ctx.beginPath(); ctx.arc(E.cx + f.xs[q] * R, E.cy + f.ys[q] * R, rr * 3.2, 0, TAU); ctx.fill();
      }
      return f;
    },
    frame(ctx, S, t, dt, E) {
      const P = S.P;
      E.fade(ctx, dt, P.trail);
      const k = Math.floor(t / P.period), u = (t - k * P.period) / (P.period - P.fade);
      const fadeIn = C.smooth((t - k * P.period) / P.fade);
      if (k > 0 && t - k * P.period < P.fade) this.draw(ctx, S, k - 1, 1, 1 - fadeIn, E);     // previous figure fading out
      const f = this.draw(ctx, S, k, u, k > 0 ? fadeIn : 1, E);
      S.k = k; S.ratio = f.ratio;
    },
    stats(S) { return 'HARMONOGRAPH ' + C.pad((S.k || 0) + 1, 3) + '  ·  RATIO ' + (S.ratio ? S.ratio.join(':') : '-') + '  ·  DAMP ' + S.P.damp; },
  };
})(globalThis.GEN = globalThis.GEN || {});
