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
      words: [],
      wordRows: [7, 3, 20, 1],
      wordWidth: [0.3, 0.05, 0.5, 0.01],
      wordFill: [0.12, 0, 1, 0.01],
      wordDim: [0.6, 0, 1, 0.01],
      rest: [0, 0, 1, 0.01],
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
      words: "Words spelled out in tiles: [{ text, t, out, reveal }]. From shot second t the tiles inside the letters flip over, left to right across `reveal` seconds, and turn bright; at `out` they flip back. '/' breaks lines.",
      wordRows: "Letter height in tiles. Bigger = smoother letters (needs small cells).",
      wordWidth: "Line thickness inside the letters.",
      wordFill: "A soft glow filling the letter tiles, so the word reads from far away.",
      wordDim: "How much the rest of the maze darkens while a word is up.",
      rest: "How dark the maze is when no word is up (0 = full brightness). Set it near wordDim so the maze never flares between words.",
    },
    init(P, E) {
      const cell = P.cell * E.s, cols = Math.ceil(E.w / cell) + 1, rows = Math.ceil(E.h / cell) + 1;
      const base = new Uint8Array(cols * rows);
      for (let k = 0; k < base.length; k++) base[k] = C.hash(k, 11, 5, E.seed) < 0.5 ? 0 : 1;
      const src = [];
      for (let i = 0; i < Math.round(P.waves); i++) src.push({ ox: E.rng(), oy: E.rng(), ph: E.rng() * C.TAU });
      // words: which tiles each word covers, and when each tile flips (left to right)
      const words = (Array.isArray(P.words) ? P.words : []).map((w, k) => {
        const np = 9000, tp = C.textPoints(E.make, w.text || '', np, E.seed + k + 1), R = Math.max(1, P.wordRows);
        const sc = Math.min(R, (cols - 3) / Math.max(0.1, tp.w)), hit = new Float32Array(cols * rows);
        for (let i = 0; i < np; i++) {
          const c = Math.round(tp.x[i] * sc + (cols - 1) / 2), r = Math.round(tp.y[i] * sc + (rows - 1) / 2);
          if (c >= 0 && c < cols && r >= 0 && r < rows) hit[r * cols + c]++;
        }
        let tot = 0, lit = 0; for (const v of hit) if (v) { tot += v; lit++; }
        const need = 0.4 * tot / Math.max(1, lit), cells = [];
        let lo = cols, hi = 0;
        for (let q = 0; q < hit.length; q++) if (hit[q] >= need) { cells.push(q); lo = Math.min(lo, q % cols); hi = Math.max(hi, q % cols); }
        return { t: w.t || 0, out: w.out == null ? Infinity : w.out, reveal: w.reveal == null ? 0.8 : w.reveal, cells, lo, span: Math.max(1, hi - lo) };
      });
      return { P, cell, cols, rows, base, src, words, x0: (E.w - (cols - 1) * cell) / 2, y0: (E.h - (rows - 1) * cell) / 2 };
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
      // word tiles: how far each has flipped (0..1); half-flipped tiles leave the maze for the word
      const wa = S.wa || (S.wa = new Float32Array(S.cols * S.rows)); wa.fill(0);
      let presence = 0;
      for (const w of S.words) {
        presence = Math.max(presence, C.smooth((t - w.t + 0.3) / 0.6) * (1 - C.smooth((t - w.out - w.reveal - 0.3) / 0.8)));
        if (t < w.t || t > w.out + w.reveal + 0.4) continue;
        for (const q of w.cells) {
          const d = (q % S.cols - w.lo) / w.span * w.reveal;
          wa[q] = Math.max(wa[q], C.smooth((t - w.t - d) / 0.25) * (1 - C.smooth((t - w.out - d) / 0.25)));
        }
      }
      const buckets = []; for (let b = 0; b <= BUCKETS; b++) buckets.push([]);
      const wordTiles = [];
      const k = C.TAU / P.wavelength, w = P.speed * t * k;
      for (let j = 0; j < S.rows; j++) for (let i = 0; i < S.cols; i++) {
        let W = 0;
        for (let q = 0; q < n; q++) W += Math.cos(Math.hypot(i - sx[q], j - sy[q]) * k - w + S.src[q].ph);
        const p = 0.5 + 0.5 * Math.tanh(P.sharp * W / n), q = j * S.cols + i;
        if (wa[q] > 0.5) wordTiles.push(q); else buckets[Math.round(p * BUCKETS)].push(q);
      }
      const r = cell / 2, beat = E.beat().pulse;
      ctx.lineCap = 'butt';
      ctx.lineWidth = Math.max(1, P.width * cell * (1 + P.breathe * beat));
      for (let b = 0; b <= BUCKETS; b++) {
        const list = buckets[b]; if (!list.length) continue;
        const p = b / BUCKETS, rot = P.spin ? p * Math.PI / 2 : 0, g = C.lerp(P.gapA, P.gapB, p) * Math.PI / 4;
        // orientation 1 = orientation 0 turned 90 degrees, so a tile is just a total rotation
        const cs = [Math.cos(rot), Math.cos(rot + Math.PI / 2)], sn = [Math.sin(rot), Math.sin(rot + Math.PI / 2)];
        const k = Math.max(P.rest, P.wordDim * presence);
        if (k > 0) { const c = C.mixArr(pal.ink, pal.accent, p), g = C.rgb(pal.bg);
          ctx.strokeStyle = 'rgb(' + c.map((v, m) => Math.round(v + (g[m] - v) * k)).join(',') + ')'; }
        else ctx.strokeStyle = C.mix(pal.ink, pal.accent, p);
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
      if (wordTiles.length) {
        // letter tiles: a soft fill, then thick bright arcs, turned by how far each tile has flipped
        if (P.wordFill > 0) { ctx.fillStyle = C.rgba(pal.ink, P.wordFill); for (const q of wordTiles) ctx.fillRect(S.x0 + (q % S.cols) * cell - r, S.y0 + ((q / S.cols) | 0) * cell - r, cell, cell); }
        ctx.lineWidth = Math.max(1, P.wordWidth * cell * (1 + P.breathe * beat)); ctx.strokeStyle = pal.ink; ctx.beginPath();
        for (const q of wordTiles) {
          const i = q % S.cols, j = (q / S.cols) | 0, cx = S.x0 + i * cell, cy = S.y0 + j * cell;
          const o = S.base[q], rot = (wa[q] - 0.5) * Math.PI, a0 = rot + o * Math.PI / 2, c = Math.cos(a0), s = Math.sin(a0);
          for (const sg of [-1, 1]) {
            const ox = cx + sg * r * (c - s), oy = cy + sg * r * (s + c), st = a0 + (sg < 0 ? 0 : Math.PI);
            ctx.moveTo(ox + r * Math.cos(st), oy + r * Math.sin(st)); ctx.arc(ox, oy, r, st, st + Math.PI / 2);
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
