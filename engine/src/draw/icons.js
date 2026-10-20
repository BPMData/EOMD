/* Procedural line icons — one per pathway. Each builds stroke polylines in a
   free coordinate space; they're auto-fitted into a unit box and drawn with a
   length-based draw-on. Some are animated (turbine, gear, scales, robot arm). */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const D = DHS.draw;
  const rad = Math.PI / 180;

  const arc = (cx, cy, r, a0, a1, n = 28) => { const p = []; for (let i = 0; i <= n; i++) { const a = (a0 + ((a1 - a0) * i) / n) * rad; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return p; };
  const circ = (cx, cy, r) => arc(cx, cy, r, 0, 360, 40);
  const line = (x1, y1, x2, y2) => [[x1, y1], [x2, y2]];
  const poly = (...a) => { const p = []; for (let i = 0; i < a.length; i += 2) p.push([a[i], a[i + 1]]); return p; };
  const closed = (p) => p.concat([p[0]]);
  const rrect = (x, y, w, h, r) => closed([].concat(arc(x + w - r, y + r, r, -90, 0, 6), arc(x + w - r, y + h - r, r, 0, 90, 6), arc(x + r, y + h - r, r, 90, 180, 6), arc(x + r, y + r, r, 180, 270, 6)));
  const bez = (a, b, c, d, n = 30) => D.bezierPts(a, b, c, d, n);
  const rot = (pts, a, cx = 0, cy = 0) => pts.map(([x, y]) => { const c = Math.cos(a), s = Math.sin(a); return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]; });

  const defs = {
    bulb: () => [
      [[-0.25, 0.42]].concat(arc(0, -0.2, 0.56, 135, 405, 40)).concat([[0.25, 0.42]]),
      line(-0.27, 0.58, 0.27, 0.58), line(-0.18, 0.76, 0.18, 0.76),
      poly(-0.14, 0.3, -0.14, 0.05, 0, -0.08, 0.14, 0.05, 0.14, 0.3),
    ],
    chart: () => [
      poly(-0.85, -0.8, -0.85, 0.75, 0.85, 0.75),
      poly(-0.6, 0.35, -0.22, -0.02, 0.08, 0.22, 0.62, -0.42),
      poly(0.28, -0.44, 0.62, -0.42, 0.6, -0.08),
    ],
    heartPulse: () => {
      const h = []; for (let i = 0; i <= 60; i++) { const t = (i / 60) * Math.PI * 2; h.push([16 * Math.sin(t) ** 3 / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17]); }
      return [h, poly(-0.62, -0.05, -0.28, -0.05, -0.14, -0.32, 0.04, 0.3, 0.18, -0.05, 0.62, -0.05)];
    },
    dna: () => {
      const a = [], b = [], rungs = [];
      for (let i = 0; i <= 40; i++) { const y = -0.9 + (1.8 * i) / 40, ph = y * Math.PI * 1.25; a.push([0.42 * Math.sin(ph), y]); b.push([-0.42 * Math.sin(ph), y]); }
      for (let k = 0; k < 6; k++) { const y = -0.72 + k * 0.29, ph = y * Math.PI * 1.25, x = 0.42 * Math.sin(ph); if (Math.abs(x) > 0.14) rungs.push(line(-x * 0.78, y, x * 0.78, y)); }
      return [a, b, ...rungs];
    },
    stopwatch: (t) => [
      circ(0, 0.12, 0.72), line(0, -0.6, 0, -0.84), line(-0.2, -0.86, 0.2, -0.86), line(0.52, -0.4, 0.66, -0.54),
      rot(line(0, 0.12, 0, -0.34), t * 2.6, 0, 0.12),
    ],
    cross: () => [closed(poly(-0.26, -0.8, 0.26, -0.8, 0.26, -0.26, 0.8, -0.26, 0.8, 0.26, 0.26, 0.26, 0.26, 0.8, -0.26, 0.8, -0.26, 0.26, -0.8, 0.26, -0.8, -0.26, -0.26, -0.26))],
    turbine: (t) => {
      const hub = [0, -0.12], out = [poly(-0.08, 0.95, 0, -0.04, 0.08, 0.95)];
      for (let k = 0; k < 3; k++) {
        const a = t * 2.2 + (k * Math.PI * 2) / 3 - Math.PI / 2;
        const dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx;
        out.push(poly(hub[0], hub[1], hub[0] + dx * 0.36 + px * 0.15, hub[1] + dy * 0.36 + py * 0.15, hub[0] + dx * 0.95, hub[1] + dy * 0.95, hub[0] + dx * 0.34 - px * 0.04, hub[1] + dy * 0.34 - py * 0.04, hub[0], hub[1]));
      }
      return out;
    },
    leafHouse: () => [
      closed(poly(-0.78, 0.86, -0.78, -0.12, 0, -0.84, 0.78, -0.12, 0.78, 0.86)),
      bez([-0.34, 0.56], [-0.42, 0.02], [0.02, -0.14], [0.36, -0.14]).concat(bez([0.36, -0.14], [0.4, 0.28], [0.02, 0.6], [-0.34, 0.56]).slice(1)),
      line(-0.34, 0.56, 0.12, 0.14),
    ],
    sprout: () => [
      line(-0.72, 0.8, 0.72, 0.8),
      bez([0, 0.8], [0, 0.5], [-0.04, 0.2], [0, -0.05]),
      bez([-0.02, 0.2], [-0.2, -0.28], [-0.6, -0.34], [-0.66, -0.3]).concat(bez([-0.66, -0.3], [-0.6, 0.06], [-0.3, 0.26], [-0.02, 0.2]).slice(1)),
      bez([0, -0.05], [0.12, -0.5], [0.46, -0.72], [0.62, -0.7]).concat(bez([0.62, -0.7], [0.62, -0.34], [0.3, -0.06], [0, -0.05]).slice(1)),
    ],
    network: () => {
      const nodes = [[-0.66, -0.56], [0.66, -0.56], [-0.66, 0.6], [0.66, 0.6]];
      const out = [circ(0, 0.02, 0.2)];
      for (const [x, y] of nodes) { out.push(circ(x, y, 0.15)); const d = Math.hypot(x, y - 0.02); out.push(line((x * 0.2) / d, 0.02 + ((y - 0.02) * 0.2) / d, x - (x * 0.15) / d, y - ((y - 0.02) * 0.15) / d)); }
      out.push(line(-0.5, -0.56, 0.5, -0.56));
      return out;
    },
    code: () => [poly(-0.34, -0.52, -0.84, 0, -0.34, 0.52), poly(0.34, -0.52, 0.84, 0, 0.34, 0.52), line(0.16, -0.72, -0.16, 0.72)],
    shield: () => [
      [[0, -0.88], [0.7, -0.62], [0.7, -0.02]].concat(bez([0.7, -0.02], [0.7, 0.42], [0.36, 0.72], [0, 0.9]).slice(1)).concat(bez([0, 0.9], [-0.36, 0.72], [-0.7, 0.42], [-0.7, -0.02]).slice(1)).concat([[-0.7, -0.62], [0, -0.88]]),
      circ(0, -0.08, 0.16), line(0, 0.08, 0, 0.4),
    ],
    scales: (t) => {
      const a = Math.sin(t * 2.4) * 0.07, L = [-0.7, -0.52], R = [0.7, -0.52];
      const [l, r] = rot([L, R], a, 0, -0.52);
      const pan = (p) => [poly(p[0], p[1], p[0] - 0.24, p[1] + 0.52), poly(p[0], p[1], p[0] + 0.24, p[1] + 0.52), arc(p[0], p[1] + 0.52, 0.26, 0, 180, 16)];
      return [line(0, -0.8, 0, 0.78), line(-0.36, 0.78, 0.36, 0.78), [l, r], ...pan(l), ...pan(r)];
    },
    book: () => [
      poly(0, -0.48, -0.36, -0.64, -0.86, -0.56, -0.86, 0.6, -0.36, 0.5, 0, 0.66),
      poly(0, -0.48, 0.36, -0.64, 0.86, -0.56, 0.86, 0.6, 0.36, 0.5, 0, 0.66),
      line(0, -0.48, 0, 0.66),
    ],
    toque: () => [
      [[-0.5, 0.2]].concat(arc(-0.42, -0.14, 0.34, 110, 290, 18)).concat(arc(0, -0.42, 0.4, 200, 340, 18)).concat(arc(0.42, -0.14, 0.34, 250, 430, 18)).concat([[0.5, 0.2], [0.5, 0.78], [-0.5, 0.78], [-0.5, 0.2]]),
      line(-0.5, 0.44, 0.5, 0.44),
    ],
    bridge: () => [
      line(-0.95, 0.12, 0.95, 0.12), Array.from({ length: 31 }, (_, i) => { const a = Math.PI * (1 + i / 30); return [0.72 * Math.cos(a), 0.12 + 0.46 * Math.sin(a)]; }),
      line(-0.36, -0.28, -0.36, 0.12), line(0, -0.34, 0, 0.12), line(0.36, -0.28, 0.36, 0.12),
      line(-0.72, 0.12, -0.72, 0.62), line(0.72, 0.12, 0.72, 0.62), line(-0.95, 0.62, 0.95, 0.62),
    ],
    robotArm: (t) => {
      const a = Math.sin(t * 1.9) * 0.12;
      const j1 = [-0.28, 0.52], j2 = rot([[-0.4, -0.2]], a * 0.6, j1[0], j1[1])[0];
      const j3 = rot([[j2[0] + 0.78, j2[1] - 0.28]], -a, j2[0], j2[1])[0];
      return [line(-0.78, 0.86, 0.22, 0.86), rrect(-0.5, 0.52, 0.44, 0.34, 0.06), [j1, j2, j3], circ(j2[0], j2[1], 0.1),
        poly(j3[0] - 0.02, j3[1] - 0.22, j3[0] + 0.2, j3[1] - 0.08, j3[0] + 0.24, j3[1] + 0.16), circ(j3[0], j3[1], 0.09)];
    },
    gear: (t) => {
      const p = [], teeth = 8, a0 = t * 0.9;
      for (let i = 0; i < teeth; i++) {
        const a = a0 + (i * Math.PI * 2) / teeth, w = Math.PI / teeth;
        for (const [ang, r] of [[a - w * 0.62, 0.62], [a - w * 0.38, 0.86], [a + w * 0.38, 0.86], [a + w * 0.62, 0.62]]) p.push([r * Math.cos(ang), r * Math.sin(ang)]);
      }
      return [closed(p), circ(0, 0, 0.26)];
    },
    tower: () => [poly(-0.42, 0.88, 0, -0.26, 0.42, 0.88), line(-0.24, 0.38, 0.24, 0.38), circ(0, -0.4, 0.1),
      arc(0, -0.4, 0.36, 205, 245, 8), arc(0, -0.4, 0.36, 295, 335, 8), arc(0, -0.4, 0.64, 208, 242, 8), arc(0, -0.4, 0.64, 298, 332, 8)],
    headphones: () => [arc(0, 0.12, 0.72, 180, 360, 30), rrect(-0.9, 0.08, 0.3, 0.62, 0.1), rrect(0.6, 0.08, 0.3, 0.62, 0.1)],
    bezier: () => [
      bez([-0.8, 0.52], [-0.36, -0.86], [0.36, 0.86], [0.8, -0.52]),
      line(-0.8, 0.52, -0.36, -0.62), line(0.8, -0.52, 0.36, 0.62),
      rrect(-0.92, 0.4, 0.24, 0.24, 0.02), rrect(0.68, -0.64, 0.24, 0.24, 0.02), circ(-0.36, -0.62, 0.08), circ(0.36, 0.62, 0.08),
    ],
  };
  const animated = { turbine: 1, gear: 1, scales: 1, robotArm: 1, stopwatch: 1 };

  // Fit transform computed once per icon from its t=0 pose
  const fitCache = {};
  const fitOf = (id) => {
    if (fitCache[id]) return fitCache[id];
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const s of defs[id](0)) for (const [x, y] of s) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const sc = 1.64 / Math.max(x1 - x0, y1 - y0);
    return (fitCache[id] = { sc, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 });
  };

  DHS.icons = {
    ids: Object.keys(defs),
    // draw icon centered at (x,y) with half-size s. p: draw-on progress 0..1. t: time for animated icons
    draw(ctx, id, x, y, s, color, p = 1, t = 0, lw = 0.13) {
      if (!defs[id] || p <= 0) return;
      const f = fitOf(id);
      const strokes = defs[id](animated[id] ? t : 0).map((st) => st.map(([px, py]) => [x + (px - f.cx) * f.sc * s, y + (py - f.cy) * f.sc * s]));
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = s * lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const n = strokes.length;
      strokes.forEach((st, i) => { const a = i / n * 0.55, b = a + 0.45; D.strokePartial(ctx, st, DHS.math.inv(a, b, p)); });
      ctx.restore();
    },
  };
})(globalThis);
