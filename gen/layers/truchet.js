/* layer "truchet": quarter-circle Truchet tiles. Each tile has 2 orientations; random orientations make
   connected loops. Travelling waves turn each tile 90 degrees and recolor it as they pass, so the pattern
   rewires itself. Mid-turn the arcs stop meeting, which gives the broken, shimmering band. */
(function (G) {
  'use strict';
  const C = G.core, BUCKETS = 24;

  G.layers.truchet = {
    about: 'Truchet tiles rewired by travelling waves; tiles turn 90 degrees and change color as a wave passes.',
    knobs: {
      cell: [96, 30, 240, 1],
      width: [0.17, 0.02, 0.45, 0.01],
      waves: [3, 1, 6, 1],
      wavelength: [9, 2, 40, 0.5],
      speed: [1.2, 0, 6, 0.05],
      sharp: [5, 1, 20, 0.5],
      drift: [0.05, 0, 0.5, 0.01],
      gapA: [0, 0, 1, 0.01],
      gapB: [0.35, 0, 1, 0.01],
      spin: [1, 0, 1, 1],
      breathe: [0.15, 0, 1, 0.01],
      trail: [0, 0, 0.9, 0.01],
      seed: [0, 0, 999, 1],
    },
    // plain-English explanation of each knob, shown under it in the KNOBS panel (common ones: GEN.knobHelp)
    help: {
      cell: "Size of each tile. Smaller = more, finer tiles.",
      width: "Thickness of the curved lines.",
      waves: "How many wave centers ripple across the tiles.",
      wavelength: "Distance between wave crests, in tiles. Bigger = broader bands of color.",
      speed: "How fast the waves travel across the screen.",
      sharp: "How suddenly a tile flips as a wave passes. Low = soft shimmer; high = crisp bands.",
      drift: "How fast the wave centers wander around the screen.",
      gapA: "Gaps in the lines in the resting color. 0 = solid unbroken loops; higher = short dashes.",
      gapB: "Gaps in the lines in the flipped (accent) color.",
      spin: "On: tiles turn as a wave passes, rewiring the maze. Off: they only change color.",
      breathe: "Lines get thicker on each beat.",
    },
    init(P, E) {
      const cell = P.cell * E.s, cols = Math.ceil(E.w / cell) + 1, rows = Math.ceil(E.h / cell) + 1;
      const base = new Uint8Array(cols * rows);
      for (let k = 0; k < base.length; k++) base[k] = C.hash(k, 11, 5, E.seed) < 0.5 ? 0 : 1;
      const src = [];
      for (let i = 0; i < Math.round(P.waves); i++) src.push({ ox: E.rng(), oy: E.rng(), ph: E.rng() * C.TAU });
      return { P, cell, cols, rows, base, src, x0: (E.w - (cols - 1) * cell) / 2, y0: (E.h - (rows - 1) * cell) / 2 };
    },
    frame(ctx, S, t, dt, E) {
      const P = S.P, cell = S.cell, pal = E.pal, n = S.src.length;
      E.fade(ctx, dt, P.trail);
      // wave sources wander slowly (positions in tiles)
      const sx = [], sy = [];
      for (let i = 0; i < n; i++) {
        const s = S.src[i];
        sx.push((s.ox + 0.25 * C.noise3(i * 3.1, t * P.drift, 0, E.seed)) * S.cols);
        sy.push((s.oy + 0.25 * C.noise3(i * 3.1, t * P.drift, 9, E.seed)) * S.rows);
      }
      const buckets = []; for (let b = 0; b <= BUCKETS; b++) buckets.push([]);
      const k = C.TAU / P.wavelength, w = P.speed * t * k;
      for (let j = 0; j < S.rows; j++) for (let i = 0; i < S.cols; i++) {
        let W = 0;
        for (let q = 0; q < n; q++) W += Math.cos(Math.hypot(i - sx[q], j - sy[q]) * k - w + S.src[q].ph);
        const p = 0.5 + 0.5 * Math.tanh(P.sharp * W / n);
        buckets[Math.round(p * BUCKETS)].push(j * S.cols + i);
      }
      const r = cell / 2, beat = E.beat().pulse;
      ctx.lineCap = 'butt';
      ctx.lineWidth = Math.max(1, P.width * cell * (1 + P.breathe * beat));
      for (let b = 0; b <= BUCKETS; b++) {
        const list = buckets[b]; if (!list.length) continue;
        const p = b / BUCKETS, rot = P.spin ? p * Math.PI / 2 : 0, g = C.lerp(P.gapA, P.gapB, p) * Math.PI / 4;
        // orientation 1 = orientation 0 turned 90 degrees, so a tile is just a total rotation
        const cs = [Math.cos(rot), Math.cos(rot + Math.PI / 2)], sn = [Math.sin(rot), Math.sin(rot + Math.PI / 2)];
        ctx.strokeStyle = C.mix(pal.ink, pal.accent, p);
        ctx.beginPath();
        for (const q of list) {
          const i = q % S.cols, j = (q / S.cols) | 0, cx = S.x0 + i * cell, cy = S.y0 + j * cell;
          const o = S.base[q], c = cs[o], s = sn[o], a0 = rot + o * Math.PI / 2;
          // two arcs, centered on the tile's top-left and bottom-right corners (turned with the tile)
          for (const sg of [-1, 1]) {
            const dx = sg * r, dy = sg * r;
            const ox = cx + dx * c - dy * s, oy = cy + dx * s + dy * c;
            const st = a0 + (sg < 0 ? 0 : Math.PI) + g, en = a0 + (sg < 0 ? Math.PI / 2 : Math.PI * 1.5) - g;
            if (en <= st) continue;
            ctx.moveTo(ox + r * Math.cos(st), oy + r * Math.sin(st));
            ctx.arc(ox, oy, r, st, en);
          }
        }
        ctx.stroke();
      }
      S.lastT = t;
    },
    stats(S) {
      return 'TRUCHET × ' + (S.cols * S.rows) + '  ·  ' + S.src.length + ' WAVES  ·  SEED 0x' + ((S.P.seed | 0) + 42).toString(16).toUpperCase();
    },
  };
})(globalThis.GEN = globalThis.GEN || {});
