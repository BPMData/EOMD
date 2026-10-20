/* layer "tree": a recursive branching fractal that grows in, then sways in a noise breeze.
   arms = 1: one tree from the bottom. arms > 1: a radial mandala from the center. */
(function (G) {
  'use strict';
  const C = G.core, D2R = Math.PI / 180;

  G.layers.tree = {
    about: 'Recursive branching fractal; grows in once, then sways. arms > 1 makes a radial mandala.',
    knobs: {
      depth: [10, 3, 13, 1],
      arms: [1, 1, 12, 1],
      spread: [24, 2, 90, 1],
      ratio: [0.76, 0.5, 0.9, 0.01],
      length: [0.24, 0.05, 0.6, 0.01],
      asym: [0.15, 0, 0.6, 0.01],
      sway: [7, 0, 40, 0.5],
      swaySpeed: [0.3, 0, 2, 0.01],
      spin: [0, -30, 30, 0.5],
      grow: [6, 0, 30, 0.5],
      width: [7, 0.5, 20, 0.1],
      leaves: [0.5, 0, 1, 0.01],
      pulse: [0.4, 0, 1.5, 0.01],
      trail: [0, 0, 0.9, 0.01],
      seed: [0, 0, 999, 1],
    },
    // plain-English explanation of each knob, shown under it in the KNOBS panel (common ones: GEN.knobHelp)
    help: {
      depth: "Branching levels. Each level doubles the branches; 11 and up gets very dense.",
      arms: "1 = one tree growing from the bottom. 2 or more = a radial snowflake/mandala from the center.",
      spread: "Angle between branches. Small = tall and narrow; big = wide and bushy.",
      ratio: "How long each branch is compared to its parent. Higher = bigger, fuller tree.",
      length: "Trunk length.",
      asym: "Randomness, so the branches aren't perfectly symmetrical.",
      sway: "How far the branches move in the breeze.",
      swaySpeed: "How fast the breeze is.",
      spin: "Rotation speed of the mandala (arms 2+), in degrees per second.",
      grow: "Seconds it takes to grow in at the start of the shot. 0 = already fully grown.",
      width: "Trunk thickness; the branches thin out from there.",
      leaves: "Chance of an accent-colored bud at each branch tip.",
    },
    init(P, E) {
      let depth = Math.round(P.depth), arms = Math.round(P.arms);
      while (arms * Math.pow(2, depth) > 24000 && depth > 3) depth--;   // keep it fast
      return { P, depth, arms, segs: 0 };
    },
    frame(ctx, S, t, dt, E) {
      const P = S.P, D = S.depth, s = E.s, pal = E.pal;
      E.fade(ctx, dt, P.trail);
      const g = P.grow > 0 ? C.clamp(t / P.grow) * (D + 1) : D + 1;
      const per = []; for (let d = 0; d <= D; d++) per.push([]);
      const buds = [];
      const sp = P.spread * D2R;
      const branch = (x, y, ang, len, d, id) => {
        const gd = C.clamp(g - d); if (gd <= 0) return;
        const w = P.sway * D2R * (0.25 + d / D) * C.noise3(id * 0.173, t * P.swaySpeed, d * 1.7, E.seed);
        const a = ang + w, L = len * C.smooth(gd);
        const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L;
        per[d].push(x, y, x2, y2);
        if (d === D) { if (gd >= 1 && C.hash(id, d, 1, E.seed) < P.leaves) buds.push(x2, y2); return; }
        const u = (C.hash(id, d, 2, E.seed) - 0.5) * 2 * P.asym;
        branch(x2, y2, a - sp * (1 + u), len * P.ratio * (1 - u * 0.3), d + 1, id * 2);
        branch(x2, y2, a + sp * (1 - u), len * P.ratio * (1 + u * 0.3), d + 1, id * 2 + 1);
      };
      const len = P.length * E.h * (S.arms > 1 ? 0.55 : 1), spin = P.spin * D2R * t;
      for (let k = 0; k < S.arms; k++) {
        if (S.arms === 1) branch(E.cx, E.h * 0.96, -Math.PI / 2, len, 0, 1);
        else branch(E.cx, E.cy, spin + k * C.TAU / S.arms - Math.PI / 2, len, 0, 1 + k * 7919);
      }
      ctx.lineCap = 'round';
      let n = 0;
      for (let d = 0; d <= D; d++) {
        const p = per[d]; if (!p.length) continue; n += p.length / 4;
        ctx.strokeStyle = C.mix(pal.ink, pal.dim, d / D * 0.6);
        ctx.lineWidth = Math.max(0.5, P.width * s * Math.pow(P.ratio, d * 0.9));
        ctx.beginPath();
        for (let q = 0; q < p.length; q += 4) { ctx.moveTo(p[q], p[q + 1]); ctx.lineTo(p[q + 2], p[q + 3]); }
        ctx.stroke();
      }
      if (buds.length) {
        const r = Math.max(1, 2.6 * s * (1 + P.pulse * E.beat().pulse));
        ctx.fillStyle = pal.accent; ctx.beginPath();
        for (let q = 0; q < buds.length; q += 2) { ctx.moveTo(buds[q] + r, buds[q + 1]); ctx.arc(buds[q], buds[q + 1], r, 0, C.TAU); }
        ctx.fill();
      }
      S.segs = n;
    },
    stats(S) { return 'DEPTH ' + S.depth + '  ·  BRANCHES ' + S.segs + '  ·  SPREAD ' + Math.round(S.P.spread) + '°'; },
  };
})(globalThis.GEN = globalThis.GEN || {});
