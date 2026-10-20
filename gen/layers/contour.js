/* layer "contour": topographic isolines of drifting noise terrain (marching squares).
   Every Nth line is an index line: accent color, thicker. Pure function of time. */
(function (G) {
  'use strict';
  const C = G.core;

  G.layers.contour = {
    about: 'Topographic contour lines (marching squares) over drifting noise terrain; index lines in accent.',
    knobs: {
      cols: [110, 30, 240, 1],
      levels: [16, 3, 40, 1],
      scale: [2.4, 0.5, 8, 0.1],
      octaves: [3, 1, 5, 1],
      speed: [0.05, 0, 0.5, 0.005],
      drift: [0.03, 0, 0.3, 0.005],
      width: [1.2, 0.3, 5, 0.1],
      index: [5, 0, 10, 1],
      alpha: [0.75, 0.1, 1, 0.01],
      trail: [0, 0, 0.9, 0.01],
      seed: [0, 0, 999, 1],
    },
    // plain-English explanation of each knob, shown under it in the KNOBS panel (common ones: GEN.knobHelp)
    help: {
      cols: "Smoothness of the lines. Higher = smoother curves (and slower).",
      levels: "Number of contour lines, like the elevation lines on a hiking map.",
      scale: "Size of the hills. Higher = more, smaller hills.",
      octaves: "Roughness of the terrain. 1 = smooth blobs; 5 = craggy detail.",
      speed: "How fast the terrain changes shape.",
      drift: "How fast the map slides sideways.",
      width: "Line thickness.",
      index: "Every Nth line is a thicker accent line, like a map's index contours. 0 = none.",
    },
    init(P, E) {
      const cols = Math.round(P.cols), rows = Math.max(4, Math.round(cols * E.h / E.w));
      return { P, cols, rows, v: new Float32Array((cols + 1) * (rows + 1)) };
    },
    frame(ctx, S, t, dt, E) {
      const P = S.P, cols = S.cols, rows = S.rows, W = cols + 1, cw = E.w / cols, ch = E.h / rows;
      E.fade(ctx, dt, P.trail);
      const f = P.scale / E.h, z = t * P.speed, ox = t * P.drift * E.h;
      let lo = Infinity, hi = -Infinity;
      for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
        const v = C.fbm((i * cw + ox) * f, j * ch * f, z, Math.round(P.octaves), E.seed);
        S.v[j * W + i] = v; if (v < lo) lo = v; if (v > hi) hi = v;
      }
      const L = Math.round(P.levels), span = 1.2;
      ctx.lineJoin = 'round';
      for (let k = 0; k < L; k++) {
        const iso = -span / 2 + span * (k + 0.5) / L;
        if (iso < lo || iso > hi) continue;
        const idx = P.index > 0 && k % Math.round(P.index) === 0;
        ctx.strokeStyle = C.rgba(idx ? E.pal.accent : E.pal.ink, P.alpha * (idx ? 1 : 0.45 + 0.55 * k / L));
        ctx.lineWidth = Math.max(0.6, P.width * E.s * (idx ? 1.9 : 1));
        ctx.beginPath();
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
          const a = S.v[j * W + i], b = S.v[j * W + i + 1], c = S.v[(j + 1) * W + i + 1], d = S.v[(j + 1) * W + i];
          const cs = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
          if (cs === 0 || cs === 15) continue;
          const x = i * cw, y = j * ch;
          // edge crossing points: top, right, bottom, left
          const T = () => [x + cw * (iso - a) / (b - a), y], R = () => [x + cw, y + ch * (iso - b) / (c - b)];
          const B = () => [x + cw * (iso - d) / (c - d), y + ch], Lf = () => [x, y + ch * (iso - a) / (d - a)];
          const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
          switch (cs) {
            case 1: case 14: seg(Lf(), B()); break;
            case 2: case 13: seg(B(), R()); break;
            case 3: case 12: seg(Lf(), R()); break;
            case 4: case 11: seg(T(), R()); break;
            case 6: case 9: seg(T(), B()); break;
            case 7: case 8: seg(Lf(), T()); break;
            case 5: seg(Lf(), T()); seg(B(), R()); break;
            case 10: seg(T(), R()); seg(Lf(), B()); break;
          }
        }
        ctx.stroke();
      }
      S.z = z;
    },
    stats(S) { return 'ISOLINES ' + Math.round(S.P.levels) + '  ·  GRID ' + S.cols + '×' + S.rows + '  ·  Z ' + (S.z || 0).toFixed(3); },
  };
})(globalThis.GEN = globalThis.GEN || {});
