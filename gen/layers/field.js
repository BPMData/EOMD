/* layer "field": particles steered by a slowly changing noise flow field, drawn as fading streaks.
   Stateful (particles move frame by frame), so it declares a warm-up for seeks. */
(function (G) {
  'use strict';
  const C = G.core;

  G.layers.field = {
    about: 'Flow-field particles: noise sets a direction at every point, particles follow it and leave streaks.',
    warm: 3,
    knobs: {
      count: [1400, 100, 6000, 50],
      speed: [90, 5, 400, 1],
      scale: [2.2, 0.3, 10, 0.1],
      swirl: [2.2, 0.5, 6, 0.1],
      evolve: [0.06, 0, 0.5, 0.005],
      life: [7, 1, 20, 0.5],
      width: [1.3, 0.3, 6, 0.1],
      alpha: [0.55, 0.05, 1, 0.01],
      accent: [0.08, 0, 1, 0.01],
      trail: [0.94, 0.5, 0.995, 0.001],
      seed: [0, 0, 999, 1],
    },
    // plain-English explanation of each knob, shown under it in the KNOBS panel (common ones: GEN.knobHelp)
    help: {
      count: "Number of particles. More = denser streams (and slower).",
      speed: "How fast the particles move.",
      scale: "Size of the swirls. Higher = smaller, busier swirls.",
      swirl: "How twisty the currents are.",
      evolve: "How fast the currents themselves change shape.",
      life: "Seconds before a particle disappears and starts again somewhere else.",
      width: "Line thickness.",
    },
    init(P, E) {
      const n = Math.round(P.count), S = { P, n, x: new Float32Array(n), y: new Float32Array(n),
        age: new Float32Array(n), life: new Float32Array(n), acc: new Uint8Array(n), rng: E.rng };
      for (let i = 0; i < n; i++) { this.spawn(S, i, E); S.age[i] = E.rng() * S.life[i]; S.acc[i] = E.rng() < P.accent ? 1 : 0; }
      return S;
    },
    spawn(S, i, E) {
      S.x[i] = S.rng() * E.w; S.y[i] = S.rng() * E.h; S.age[i] = 0; S.life[i] = S.P.life * (0.5 + S.rng());
    },
    frame(ctx, S, t, dt, E) {
      const P = S.P, f = P.scale / E.h, v = P.speed * E.s * dt, z = t * P.evolve;
      E.fade(ctx, dt, P.trail);
      ctx.lineWidth = Math.max(0.5, P.width * E.s); ctx.lineCap = 'round';
      const paths = [[], []];
      for (let i = 0; i < S.n; i++) {
        const x = S.x[i], y = S.y[i];
        const a = C.fbm(x * f, y * f, z, 2, E.seed) * P.swirl * Math.PI;
        const nx = x + Math.cos(a) * v, ny = y + Math.sin(a) * v;
        S.age[i] += dt;
        if (S.age[i] > S.life[i] || nx < -5 || ny < -5 || nx > E.w + 5 || ny > E.h + 5) { this.spawn(S, i, E); continue; }
        paths[S.acc[i]].push(x, y, nx, ny);
        S.x[i] = nx; S.y[i] = ny;
      }
      for (let k = 0; k < 2; k++) {
        const p = paths[k]; if (!p.length) continue;
        ctx.strokeStyle = C.rgba(k ? E.pal.accent : E.pal.ink, P.alpha);
        ctx.beginPath();
        for (let q = 0; q < p.length; q += 4) { ctx.moveTo(p[q], p[q + 1]); ctx.lineTo(p[q + 2], p[q + 3]); }
        ctx.stroke();
      }
      S.z = z;
    },
    stats(S) { return 'PARTICLES ' + S.n + '  ·  SWIRL ' + S.P.swirl.toFixed(1) + '  ·  FIELD Z ' + (S.z || 0).toFixed(3); },
  };
})(globalThis.GEN = globalThis.GEN || {});
