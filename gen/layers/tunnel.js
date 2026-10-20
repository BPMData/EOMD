/* layer "tunnel": a demoscene wormhole. Rings of points fly at the camera along a bending path;
   wireframe, dots, or checkerboard panels. Pure function of time. */
(function (G) {
  'use strict';
  const C = G.core, TAU = C.TAU;

  G.layers.tunnel = {
    about: 'Demoscene wormhole: rings fly at the camera along a bending path; wire, dots or checkerboard panels.',
    knobs: {
      style: { options: ['wire', 'dots', 'checker'], value: 'wire' },
      sides: [24, 3, 64, 1],
      rings: [46, 8, 120, 1],
      spacing: [0.45, 0.1, 2, 0.01],
      size: [0.5, 0.1, 1.5, 0.01],
      speed: [2.2, -8, 12, 0.05],
      twist: [0.12, -1, 1, 0.01],
      spin: [0.15, -2, 2, 0.01],
      bend: [0.9, 0, 4, 0.05],
      bendSpeed: [0.06, 0, 0.5, 0.005],
      fog: [0.9, 0, 1, 0.01],
      lines: [0.55, 0, 1, 0.01],
      dot: [2.4, 0.5, 10, 0.1],
      fill: [0.5, 0, 1, 0.01],
      accentEvery: [6, 0, 20, 1],
      words: [],
      wordDots: [1600, 200, 5000, 100],
      wordSize: [0.5, 0.1, 1.5, 0.01],
      wordNear: [0.95, 0.3, 4, 0.05],
      pulse: [0.6, 0, 2, 0.01],
      trail: [0, 0, 0.9, 0.01],
      seed: [0, 0, 999, 1],
    },
    // plain-English explanation of each knob, shown under it in the KNOBS panel (common ones: GEN.knobHelp)
    help: {
      style: "wire = ring outlines, dots = points only, checker = filled panels.",
      sides: "Corners on each ring: 3 = triangle tunnel, 6 = hexagon, 24+ = round.",
      rings: "Rings on screen at once, i.e. how far down the tunnel you can see.",
      spacing: "Gap between rings.",
      size: "How wide the tunnel is on screen.",
      speed: "Flying speed. Negative flies backwards.",
      twist: "How much each ring is turned from the last. Makes spirals.",
      spin: "Rotation speed of the whole tunnel.",
      bend: "How much the tunnel curves.",
      bendSpeed: "How quickly the curves come at you.",
      fog: "Far rings fade into the background.",
      lines: "Brightness of the ring lines.",
      dot: "Dot size (wire and dots styles).",
      fill: "Panel brightness (checker style).",
      accentEvery: "Every Nth ring is in the accent color. 0 = none.",
      words: "Words made of dots that fly down the tunnel at you: [{ text, t, hold, approach, pass, size }]. t = shot second the word arrives and parks in front of you; it holds for `hold` seconds while the tunnel streams past, then flies through the camera in `pass` seconds and bursts. '/' breaks lines.",
      wordDots: "Dots in each word. More = crisper letters.",
      wordNear: "How close a parked word sits. Lower = bigger on screen.",
      wordSize: "Letter height of the words (the tunnel is 1 across its radius). Long words shrink to fit.",
    },
    init(P, E) {
      const words = (Array.isArray(P.words) ? P.words : []).map((w, k) => {
        const nd = Math.round(P.wordDots), tp = C.textPoints(E.make, w.text || '', nd, E.seed * 13 + k + 1), h = new Float32Array(nd * 2);
        for (let i = 0; i < nd * 2; i++) h[i] = C.hash(i, k, 3, E.seed);
        return { t: w.t || 0, hold: w.hold == null ? 1.2 : w.hold, app: w.approach || 1.6, pass: w.pass || 0.5, tp, h, nd,
                 ws: Math.min(w.size || P.wordSize, 1.7 / Math.max(0.1, tp.w)) };
      });
      return { P, n: Math.round(P.sides), m: Math.round(P.rings), ph: (E.seed % 1000) * 0.37, words };
    },
    frame(ctx, S, t, dt, E) {
      const P = S.P, n = S.n, m = S.m, pal = E.pal, sp = P.spacing, depth = m * sp;
      E.fade(ctx, dt, P.trail);
      const zc = t * P.speed, F = P.size * E.h;
      const path = (z) => [P.bend * (Math.sin(z * P.bendSpeed * 2.1 + S.ph) + 0.5 * Math.sin(z * P.bendSpeed * 4.3 + 1)),
                           P.bend * 0.7 * (Math.cos(z * P.bendSpeed * 1.7 + S.ph * 2) + 0.4 * Math.sin(z * P.bendSpeed * 3.1))];
      const cam = path(zc), look = path(zc + 3);
      // rings, far to near
      const R = [];
      const k0 = Math.floor(zc / sp) + 1;
      for (let k = k0; k < k0 + m; k++) {
        const rel = k * sp - zc;
        if (rel < 0.12) continue;
        const pc = path(k * sp), lean = rel / 3;
        const ox = pc[0] - cam[0] - (look[0] - cam[0]) * lean * 0.6, oy = pc[1] - cam[1] - (look[1] - cam[1]) * lean * 0.6;
        const sc = F / rel, cx = E.cx + ox * sc, cy = E.cy + oy * sc;
        const pts = [];
        for (let j = 0; j < n; j++) {
          const a = j * TAU / n + k * P.twist + t * P.spin;
          pts.push(cx + Math.cos(a) * sc, cy + Math.sin(a) * sc);
        }
        const fogA = 1 - P.fog * C.smooth(rel / depth);
        R.push({ k, rel, sc, pts, a: fogA * C.smooth(Math.min(1, (depth - rel) / (sp * 3))), acc: P.accentEvery > 0 && k % Math.round(P.accentEvery) === 0 });
      }
      R.sort((a, b) => b.rel - a.rel);
      const beat = E.beat().pulse, lw = Math.max(0.6, E.s * 1.2);
      for (let q = 0; q < R.length; q++) {
        const r = R[q], nx = R[q + 1] && R[q + 1].k === r.k - 1 ? R[q + 1] : null;
        if (P.style === 'checker' && nx) {
          for (let j = 0; j < n; j++) {
            if ((j + r.k) % 2) continue;
            const j2 = (j + 1) % n;
            ctx.beginPath();
            ctx.moveTo(r.pts[2 * j], r.pts[2 * j + 1]); ctx.lineTo(r.pts[2 * j2], r.pts[2 * j2 + 1]);
            ctx.lineTo(nx.pts[2 * j2], nx.pts[2 * j2 + 1]); ctx.lineTo(nx.pts[2 * j], nx.pts[2 * j + 1]); ctx.closePath();
            ctx.fillStyle = C.rgba(r.acc ? pal.accent : (j % 4 === 0 ? pal.ink : pal.dim), P.fill * r.a);
            ctx.fill();
          }
        }
        if (P.style !== 'dots' && P.lines > 0) {
          ctx.lineWidth = r.acc ? lw * (1.6 + P.pulse * beat * 2) : lw;
          ctx.strokeStyle = C.rgba(r.acc ? pal.accent : pal.ink, P.lines * r.a * (r.acc ? 1.4 : 1));
          ctx.beginPath(); ctx.moveTo(r.pts[0], r.pts[1]);
          for (let j = 1; j < n; j++) ctx.lineTo(r.pts[2 * j], r.pts[2 * j + 1]);
          ctx.closePath(); ctx.stroke();
          if (nx && P.style === 'wire') {
            ctx.lineWidth = lw * 0.7; ctx.strokeStyle = C.rgba(pal.ink, P.lines * r.a * 0.5);
            ctx.beginPath();
            for (let j = 0; j < n; j++) { ctx.moveTo(r.pts[2 * j], r.pts[2 * j + 1]); ctx.lineTo(nx.pts[2 * j], nx.pts[2 * j + 1]); }
            ctx.stroke();
          }
        }
        if (P.style === 'dots' || P.dot > 0 && P.style === 'wire') {
          const rad = Math.min(14 * E.s, P.dot * E.s * r.sc / F * 1.6) * (r.acc ? 1 + P.pulse * beat : 1);
          if (rad < 0.3) continue;
          ctx.fillStyle = C.rgba(r.acc ? pal.accent : pal.ink, r.a);
          ctx.beginPath();
          for (let j = 0; j < n; j++) { ctx.moveTo(r.pts[2 * j] + rad, r.pts[2 * j + 1]); ctx.arc(r.pts[2 * j], r.pts[2 * j + 1], rad, 0, TAU); }
          ctx.fill();
        }
      }
      // words: dots parked in front of the camera while the rings stream past, then flown through
      const far = Math.min(depth, 16), HOLD = P.wordNear;
      for (const w of S.words) {
        const t0 = w.t - w.app, t2 = w.t + w.hold, t3 = t2 + w.pass;
        if (t < t0 || t > t3) continue;
        let rel, burst = 0, a = 1;
        if (t < w.t) { const u = (w.t - t) / w.app; rel = HOLD + (far - HOLD) * u * u; a = C.smooth(1 - u) * 0.6 + 0.4 * (1 - u); }
        else if (t < t2) rel = HOLD - 0.2 * (t - w.t) / Math.max(0.01, w.hold);
        else { const u = (t - t2) / w.pass; rel = (HOLD - 0.2) * (1 - u) * (1 - u) + 0.08; burst = u * u; a = 1 - u * u * 0.6; }
        const pc = path(zc + rel), lean = rel / 3, sc = F / rel;
        const ox = pc[0] - cam[0] - (look[0] - cam[0]) * lean * 0.6, oy = pc[1] - cam[1] - (look[1] - cam[1]) * lean * 0.6;
        const cx = E.cx + ox * sc, cy = E.cy + oy * sc, rad = Math.min(9 * E.s, P.dot * E.s * 1.1 * HOLD / rel);
        a *= 1 - P.fog * C.smooth(rel / depth);
        for (const acc of [0, 1]) {
          ctx.beginPath();
          for (let i = 0; i < w.nd; i++) {
            if ((w.h[i] < 0.1) !== !!acc) continue;
            const sp = 1 + burst * (1.5 + 4 * w.h[w.nd + i]);
            const x = cx + w.tp.x[i] * w.ws * sp * sc, y = cy + w.tp.y[i] * w.ws * sp * sc;
            ctx.moveTo(x + rad, y); ctx.arc(x, y, rad, 0, TAU);
          }
          ctx.fillStyle = C.rgba(acc ? pal.accent : pal.ink, a); ctx.fill();
        }
      }
      S.z = zc;
    },
    stats(S) { return 'RINGS ' + S.m + '  ·  SIDES ' + S.n + '  ·  Z ' + (S.z || 0).toFixed(1); },
  };
})(globalThis.GEN = globalThis.GEN || {});
