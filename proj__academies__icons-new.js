/* NEW pathway icons, traced from the official academy logos and simplified for the
   film's thick, rounded strokes. Same format as engine src/draw/icons.js: each def
   returns an array of polylines in a free space (y down); the engine auto-fits them.
   Keys are the SAME ids the hallway film's config already uses, so this can replace
   the old `defs` without touching the config. */
(function (G) {
  'use strict';
  const rad = Math.PI / 180;
  const arc = (cx, cy, r, a0, a1, n = 28) => { const p = []; for (let i = 0; i <= n; i++) { const a = (a0 + ((a1 - a0) * i) / n) * rad; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return p; };
  const circ = (cx, cy, r) => arc(cx, cy, r, 0, 360, 40);
  const line = (x1, y1, x2, y2) => [[x1, y1], [x2, y2]];
  const poly = (...a) => { const p = []; for (let i = 0; i < a.length; i += 2) p.push([a[i], a[i + 1]]); return p; };
  const closed = (p) => p.concat([p[0]]);
  const rrect = (x, y, w, h, r) => closed([].concat(arc(x + w - r, y + r, r, -90, 0, 6), arc(x + w - r, y + h - r, r, 0, 90, 6), arc(x + r, y + h - r, r, 90, 180, 6), arc(x + r, y + r, r, 180, 270, 6)));
  const bezierPts = (a, b, c, d, n) => { const p = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; p.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]); } return p; };
  const bez = (a, b, c, d, n = 24) => bezierPts(a, b, c, d, n);
  const join = (...parts) => parts.reduce((acc, p) => acc.concat(acc.length ? p.slice(1) : p), []);
  const rot = (pts, a, cx = 0, cy = 0) => pts.map(([x, y]) => { const c = Math.cos(a), s = Math.sin(a); return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]; });
  const dot = (x, y) => [[x, y], [x + 0.001, y]]; // round cap turns this into a dot
  // gear outline; from/to (deg) keep only teeth inside that range (for half-hidden gears)
  const gear = (cx, cy, r, n, a0 = 0, depth = 0.24, from = null, to = null) => {
    const p = [], ri = r * (1 - depth), w = Math.PI / n, step = (2 * Math.PI) / n;
    const pts = (a) => [[a - w * 0.6, ri], [a - w * 0.34, r], [a + w * 0.34, r], [a + w * 0.6, ri]].map(([g, rr]) => [cx + rr * Math.cos(g), cy + rr * Math.sin(g)]);
    if (from === null) { for (let i = 0; i < n; i++) p.push(...pts(a0 + i * step)); return closed(p); }
    // partial: teeth whose centre falls in [from, to] degrees, in order, root arc at both ends
    const f = from * rad, e = to * rad, k0 = Math.ceil((f + w - a0) / step), k1 = Math.floor((e - w - a0) / step);
    p.push([cx + ri * Math.cos(f), cy + ri * Math.sin(f)]);
    for (let k = k0; k <= k1; k++) p.push(...pts(a0 + k * step));
    p.push([cx + ri * Math.cos(e), cy + ri * Math.sin(e)]);
    return p;
  };
  // arrowhead at the end of an arc (deg), pointing along increasing angle
  const arcHead = (cx, cy, r, a, L = 0.2) => {
    const t = a * rad, tip = [cx + r * Math.cos(t), cy + r * Math.sin(t)], d = [-Math.sin(t), Math.cos(t)];
    const back = (s) => { const c = Math.cos(s), n = Math.sin(s); return [tip[0] - L * (d[0] * c - d[1] * n), tip[1] - L * (d[0] * n + d[1] * c)]; };
    return [back(0.6), tip, back(-0.6)];
  };
  const head = (x, y, dx, dy, L = 0.24) => { const m = Math.hypot(dx, dy); dx /= m; dy /= m; const b = (s) => [x - L * (dx * Math.cos(s) - dy * Math.sin(s)), y - L * (dx * Math.sin(s) + dy * Math.cos(s))]; return [b(0.65), [x, y], b(-0.65)]; };
  const blades = (hx, hy, len, a0) => { const out = []; for (let k = 0; k < 3; k++) { const a = a0 + (k * Math.PI * 2) / 3 - Math.PI / 2, dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx; out.push(poly(hx, hy, hx + dx * len * 0.38 + px * len * 0.16, hy + dy * len * 0.38 + py * len * 0.16, hx + dx * len, hy + dy * len, hx + dx * len * 0.36 - px * len * 0.04, hy + dy * len * 0.36 - py * len * 0.04, hx, hy)); } return out; };
  const heart = (sx, sy, ox, oy) => { const h = []; for (let i = 0; i <= 64; i++) { const t = (i / 64) * Math.PI * 2; h.push([ox + sx * 16 * Math.sin(t) ** 3 / 17, oy - sy * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17]); } return h; };

  const defs = {
    // ---- Emerging Technology & Entrepreneurship
    bulb: () => [ // Business & Entrepreneurship: person on a rising arrow
      circ(-0.36, -0.6, 0.22),
      join([[-0.74, 0.5]], [[-0.74, -0.04]], arc(-0.6, -0.04, 0.14, 180, 270, 6), arc(-0.12, -0.04, 0.14, 270, 360, 6), [[0.02, 0.02]]),
      line(-0.95, 0.92, 0.72, -0.34), head(0.72, -0.34, 1.67, -1.26, 0.32),
    ],
    chart: () => [ // Investment & Finance: coin, rising bars, trend arrow
      line(-0.95, 0.82, 0.95, 0.82),
      circ(-0.56, 0.42, 0.34),
      join(bez([-0.44, 0.28], [-0.5, 0.2], [-0.7, 0.24], [-0.66, 0.36]), bez([-0.66, 0.36], [-0.62, 0.46], [-0.46, 0.4], [-0.44, 0.52]), bez([-0.44, 0.52], [-0.44, 0.64], [-0.64, 0.64], [-0.68, 0.56])),
      line(-0.56, 0.16, -0.56, 0.68),
      poly(-0.02, 0.82, -0.02, 0.34, 0.2, 0.34, 0.2, 0.82), poly(0.36, 0.82, 0.36, 0.1, 0.58, 0.1, 0.58, 0.82), poly(0.74, 0.82, 0.74, -0.16, 0.96, -0.16, 0.96, 0.82),
      poly(-0.3, -0.06, 0.06, -0.42, 0.34, -0.16, 0.86, -0.68), head(0.86, -0.68, 1, -1, 0.26),
    ],
    heartPulse: (t) => [ // Medical Technology & Engineering: circuit bulb with a gear inside
      arc(0, -0.12, 0.74, 212, 328, 22),
      gear(0, -0.12, 0.34, 8, t * 0.6), circ(0, -0.12, 0.12),
      line(-0.44, -0.12, -0.78, -0.12), circ(-0.9, -0.12, 0.1), line(0.44, -0.12, 0.78, -0.12), circ(0.9, -0.12, 0.1),
      join(bez([-0.6, 0.2], [-0.4, 0.32], [-0.26, 0.4], [-0.24, 0.56])), join(bez([0.6, 0.2], [0.4, 0.32], [0.26, 0.4], [0.24, 0.56])),
      line(-0.3, 0.62, 0.3, 0.62), line(-0.24, 0.78, 0.24, 0.78), arc(0, 0.84, 0.14, 0, 180, 10),
    ],
    // ---- Scientific Innovation & Medicine
    dna: (t) => { // Biomedical: double helix between two half-hidden gears
      const a = [], b = [], out = [];
      for (let i = 0; i <= 40; i++) { const y = -0.95 + (1.9 * i) / 40, ph = y * Math.PI * 1.05; a.push([0.3 * Math.sin(ph), y]); b.push([-0.3 * Math.sin(ph), y]); }
      out.push(a, b);
      for (let k = 0; k < 7; k++) { const y = -0.8 + k * 0.267, x = 0.3 * Math.sin(y * Math.PI * 1.05); if (Math.abs(x) > 0.12) out.push(line(-x * 0.72, y, x * 0.72, y)); }
      out.push(gear(-0.64, 0, 0.46, 8, t * 0.7, 0.26, 118, 242), circ(-0.64, 0, 0.14));
      out.push(gear(0.64, 0, 0.46, 8, -t * 0.7 + 0.2, 0.26, 298, 422), circ(0.64, 0, 0.14));
      return out;
    },
    stopwatch: () => [ // Sports & Human Performance: heart with a pulse line
      heart(1, 1, 0, -0.04),
      poly(-0.56, 0.06, -0.3, 0.06, -0.18, -0.22, 0.02, 0.4, 0.14, -0.02, 0.24, 0.14, 0.34, -0.38, 0.44, 0.02, 0.56, 0.02),
    ],
    cross: () => [ // Allied Health Services: plus in a circle
      circ(0, 0, 0.92),
      closed(poly(-0.2, -0.56, 0.2, -0.56, 0.2, -0.2, 0.56, -0.2, 0.56, 0.2, 0.2, 0.2, 0.2, 0.56, -0.2, 0.56, -0.2, 0.2, -0.56, 0.2, -0.56, -0.2, -0.2, -0.2)),
    ],
    // ---- Clean Energy & Green Design
    turbine: (t) => [ // Clean & Renewable Energy: two turbines and a solar panel
      poly(-0.26, 0.92, -0.22, -0.4, -0.18, 0.92), ...blades(-0.22, -0.46, 0.56, t * 2.2),
      line(-0.86, 0.92, -0.86, 0.3), ...blades(-0.86, 0.26, 0.3, t * 2.6 + 0.5),
      closed(poly(0.06, 0.92, 0.8, 0.92, 1.02, 0.1, 0.28, 0.1)), line(0.17, 0.51, 0.91, 0.51), line(0.31, 0.92, 0.53, 0.1), line(0.55, 0.92, 0.77, 0.1),
    ],
    leafHouse: () => [ // Green Design & Environmental Stewardship: green building, recycle arrows
      line(-0.92, 0.88, 0.92, 0.88),
      poly(-0.56, 0.88, -0.56, -0.34, 0.06, -0.34, 0.06, 0.88),
      dot(-0.38, -0.12), dot(-0.12, -0.12), dot(-0.38, 0.14), dot(-0.12, 0.14), dot(-0.38, 0.4), dot(-0.12, 0.4), dot(-0.38, 0.66), dot(-0.12, 0.66),
      line(0.36, 0.88, 0.36, 0.0),
      join(bez([0.36, 0.5], [0.42, 0.28], [0.62, 0.24], [0.74, 0.28]), bez([0.74, 0.28], [0.7, 0.48], [0.52, 0.56], [0.36, 0.5])),
      join(bez([0.36, 0.14], [0.42, -0.08], [0.62, -0.12], [0.74, -0.08]), bez([0.74, -0.08], [0.7, 0.12], [0.52, 0.2], [0.36, 0.14])),
      arc(0, 0.04, 0.94, 170, 244, 16), arcHead(0, 0.04, 0.94, 244),
      arc(0, 0.04, 0.94, 280, 384, 20), arcHead(0, 0.04, 0.94, 384),
    ],
    sprout: () => [ // Sustainable Food & Living Systems: hands holding a sprouting globe
      circ(0, 0.06, 0.42),
      join(bez([-0.32, -0.22], [-0.16, -0.16], [-0.24, 0.04], [-0.12, 0.12]), bez([-0.12, 0.12], [-0.02, 0.2], [-0.16, 0.32], [-0.1, 0.42])),
      join(bez([0.38, -0.08], [0.24, -0.08], [0.16, 0.06], [0.24, 0.16]), bez([0.24, 0.16], [0.3, 0.24], [0.18, 0.3], [0.24, 0.36])),
      line(0, -0.36, 0, -0.9),
      join(bez([0, -0.5], [-0.06, -0.74], [-0.28, -0.8], [-0.44, -0.8]), bez([-0.44, -0.8], [-0.42, -0.6], [-0.22, -0.48], [0, -0.5])),
      join(bez([0, -0.64], [0.06, -0.86], [0.28, -0.94], [0.44, -0.94]), bez([0.44, -0.94], [0.42, -0.74], [0.22, -0.62], [0, -0.64])),
      join([[-0.3, 0.96], [-0.3, 0.76], [-0.74, 0.32], [-0.74, -0.12]], arc(-0.64, -0.12, 0.1, 180, 360, 6), [[-0.54, 0.24], [-0.36, 0.44]]),
      join([[0.3, 0.96], [0.3, 0.76], [0.74, 0.32], [0.74, -0.12]], arc(0.64, -0.12, 0.1, 0, -180, 6), [[0.54, 0.24], [0.36, 0.44]]),
    ],
    // ---- Information Technology & Cybersecurity
    network: () => [ // Networking: cloud wired to devices
      join(arc(-0.42, 0.04, 0.2, 90, 270, 10), arc(0, -0.12, 0.38, 200, 340, 16), arc(0.42, 0.04, 0.2, 270, 450, 10), [[-0.42, 0.24]]),
      line(-0.62, 0.04, -0.78, 0.04), circ(-0.9, 0.04, 0.12), line(0.62, 0.04, 0.78, 0.04), circ(0.9, 0.04, 0.12),
      line(0, -0.5, 0, -0.66), circ(0, -0.8, 0.13),
      poly(-0.2, 0.24, -0.2, 0.36, -0.56, 0.36, -0.56, 0.48), rrect(-0.88, 0.48, 0.64, 0.36, 0.05), line(-0.56, 0.84, -0.56, 0.96), line(-0.72, 0.96, -0.4, 0.96),
      poly(0.2, 0.24, 0.2, 0.36, 0.56, 0.36, 0.56, 0.48), rrect(0.3, 0.48, 0.52, 0.48, 0.05), line(0.3, 0.72, 0.82, 0.72),
    ],
    code: (t) => [ // Computer Programming & Gaming: code on a monitor, gear
      poly(0.12, -0.62, -0.92, -0.62, -0.92, 0.46, 0.56, 0.46, 0.56, -0.16), line(-0.92, 0.26, 0.56, 0.26),
      line(-0.3, 0.46, -0.36, 0.72), line(0.0, 0.46, 0.06, 0.72), line(-0.52, 0.74, 0.22, 0.74),
      poly(-0.5, -0.46, -0.7, -0.3, -0.5, -0.14), line(-0.22, -0.1, -0.1, -0.5), poly(0.1, -0.46, 0.3, -0.3, 0.1, -0.14),
      line(-0.7, 0.04, -0.26, 0.04), line(-0.08, 0.04, 0.22, 0.04),
      gear(0.56, -0.62, 0.38, 8, t * 0.8), circ(0.56, -0.62, 0.13),
    ],
    shield: () => [ // Cybersecurity: padlock inside a circuit ring
      circ(0, 0, 0.56),
      rrect(-0.27, -0.06, 0.54, 0.4, 0.06), join([[-0.17, -0.06]], arc(0, -0.2, 0.17, 180, 360, 12), [[0.17, -0.06]]),
      dot(0, 0.1), line(0, 0.1, 0, 0.22),
      line(0, -0.56, 0, -0.74), circ(0, -0.86, 0.11), line(0, 0.56, 0, 0.74), circ(0, 0.86, 0.11),
      line(-0.74, -0.3, -0.74, 0.3), line(-0.94, -0.16, -0.94, 0.16), line(0.74, -0.3, 0.74, 0.3), line(0.94, -0.16, 0.94, 0.16),
    ],
    // ---- Professional & Public Service
    scales: () => [ // Justice & Law: the hex shows a public-safety helmet with a badge
      join(bez([-0.94, 0.4], [-0.3, 0.5], [0.3, 0.5], [0.94, 0.4]), arc(0.94, 0.48, 0.08, -90, 90, 6), bez([0.94, 0.56], [0.3, 0.68], [-0.3, 0.68], [-0.94, 0.56]), arc(-0.94, 0.48, 0.08, 90, 270, 6)),
      arc(0, 0.42, 0.76, 186, 244, 12), arc(0, 0.42, 0.76, 296, 354, 12),
      closed(poly(-0.3, -0.3, -0.12, -0.42, 0.12, -0.42, 0.3, -0.3, 0.24, 0.06, 0, 0.18, -0.24, 0.06)),
      poly(-0.1, -0.42, -0.08, -0.58, 0.08, -0.58, 0.1, -0.42),
      circ(0, -0.1, 0.12), line(0, 0.18, 0, 0.42),
    ],
    book: (t) => { // Education & Human Development: graduation cap; the tassel sways in a light breeze
      const a = 0.13 * Math.sin(t * 1.7) + 0.04 * Math.sin(t * 3.1 + 1), P = [0.7, -0.2];
      const sw = (pts) => rot(pts, a, P[0], P[1]);
      return [
        closed(poly(-0.96, -0.3, 0, -0.7, 0.96, -0.3, 0, 0.1)),
        join([[-0.56, -0.08], [-0.56, 0.36]], bez([-0.56, 0.36], [-0.3, 0.62], [0.3, 0.62], [0.56, 0.36]), [[0.56, -0.08]]),
        dot(0.04, -0.36), line(0.04, -0.36, 0.7, -0.2),
        sw(line(0.7, -0.2, 0.7, 0.5)), sw(circ(0.7, 0.6, 0.1)), sw(line(0.64, 0.7, 0.58, 0.92)), sw(line(0.76, 0.7, 0.82, 0.92)),
      ];
    },
    toque: () => [ // Culinary Arts & Hospitality Management: puffed chef's hat
      join([[-0.46, 0.4]], arc(-0.48, -0.1, 0.32, 95, 262, 14), arc(-0.04, -0.46, 0.36, 188, 338, 16), arc(0.44, -0.16, 0.34, 252, 445, 16), [[0.48, 0.4]]),
      join(bez([-0.5, 0.4], [-0.2, 0.52], [0.2, 0.52], [0.5, 0.4]), [[0.5, 0.74]], bez([0.5, 0.74], [0.2, 0.9], [-0.2, 0.9], [-0.5, 0.74]), [[-0.5, 0.4]]),
      bez([-0.16, 0.26], [-0.2, 0.08], [-0.12, -0.06], [-0.18, -0.18]), bez([0.2, 0.26], [0.18, 0.1], [0.26, 0.0], [0.22, -0.12]),
    ],
    // ---- Art, Engineering & Design
    bridge: () => [ // Art, Architecture & Civil Engineering: blueprint, compass, set square
      join([[0.3, -0.3], [-0.44, -0.38]], bez([-0.44, -0.38], [-0.62, -0.2], [-0.82, 0.16], [-0.9, 0.36]), arc(-0.78, 0.44, 0.14, 210, 400, 10)),
      line(-0.68, 0.58, 0.04, 0.68),
      line(-0.42, -0.06, 0.24, 0.02), line(-0.56, 0.24, 0.1, 0.32),
      circ(0.6, -0.76, 0.11), line(0.55, -0.65, 0.38, -0.06), line(0.65, -0.65, 0.82, -0.06), line(0.42, -0.36, 0.78, -0.36),
      closed(poly(0.08, 0.56, 0.98, 0.18, 0.78, 0.96)), closed(poly(0.43, 0.56, 0.75, 0.42, 0.68, 0.7)),
    ],
    robotArm: (t) => { // Computer Integrated Manufacturing: robot arm and gear
      const a = Math.sin(t * 1.9) * 0.1, j1 = [-0.6, 0.12];
      const j2 = rot([[-0.14, -0.66]], a * 0.7, j1[0], j1[1])[0];
      const j3 = rot([[j2[0] + 0.48, j2[1] + 0.5]], -a * 1.3, j2[0], j2[1])[0];
      const ang = Math.atan2(j3[1] - j2[1], j3[0] - j2[0]);
      const claw = (s) => rot([[j3[0], j3[1]], [j3[0] + 0.16, j3[1] + s * 0.14], [j3[0] + 0.3, j3[1] + s * 0.04]], ang, j3[0], j3[1]);
      return [
        rrect(-0.98, 0.74, 0.76, 0.2, 0.04), rrect(-0.84, 0.56, 0.48, 0.18, 0.03),
        line(-0.6, 0.56, j1[0], j1[1] + 0.13), circ(j1[0], j1[1], 0.13),
        line(j1[0], j1[1], j2[0], j2[1]), circ(j2[0], j2[1], 0.12), line(j2[0], j2[1], j3[0], j3[1]),
        claw(1), claw(-1),
        gear(0.48, 0.5, 0.36, 8, t * 0.9), circ(0.48, 0.5, 0.13),
      ];
    },
    gear: () => { // Applied Engineering: brain inside a light bulb, with rays
      const out = [
        join([[-0.24, 0.44], [-0.32, 0.16]], arc(0, -0.2, 0.48, 132, 408, 36), [[0.32, 0.16], [0.24, 0.44]]),
        line(-0.26, 0.56, 0.26, 0.56), line(-0.22, 0.7, 0.22, 0.7), arc(0, 0.78, 0.13, 0, 180, 10),
        line(0, -0.62, 0, 0.36),
        arc(-0.2, -0.36, 0.12, 160, 400, 14), arc(-0.24, 0.0, 0.12, 60, 300, 14),
        arc(0.2, -0.36, 0.12, 140, 380, 14), arc(0.24, 0.0, 0.12, -120, 120, 14),
      ];
      for (let k = 0; k < 9; k++) { const a = (160 + k * 27.5) * rad; out.push(line(0.66 * Math.cos(a), -0.2 + 0.66 * Math.sin(a), 0.86 * Math.cos(a), -0.2 + 0.86 * Math.sin(a))); }
      return out;
    },
    // ---- Communication & Design
    tower: (t) => { // Broadcasting & Multimedia: waves pulse out of the tower head, one slot per pulse, outer ring fades away
      const R = [0.13, 0.34, 0.56, 0.78, 1.0], A0 = [132, 132, 140, 148, 154], A1 = [408, 408, 400, 392, 386];
      const ph = ((t / 1.6) % 1 + 1) % 1, e = t === 0 ? 0 : (ph < 0.45 ? (ph / 0.45 < 0.5 ? 4 * (ph / 0.45) ** 3 : 1 - (-2 * ph / 0.45 + 2) ** 3 / 2) : 1);
      const L = (k, f) => R[k] + (R[k + 1] - R[k]) * f, out = [circ(0, -0.4, 0.13)];
      for (let k = 0; k < 4; k++) {
        const r = L(k, e), a0 = A0[k] + (A0[k + 1] - A0[k]) * e, a1 = A1[k] + (A1[k + 1] - A1[k]) * e;
        const ring = arc(0, -0.4, r, a0, a1, 28);
        ring.a = k === 0 ? e : k === 3 ? 1 - e : 1;          // new wave fades in leaving the head; the outer one fades out
        if (ring.a > 0.01) out.push(ring);
      }
      const thin = (p) => Object.assign(p, { w: 0.55 });    // lattice girders: lighter than the legs
      out.push(line(-0.07, -0.26, -0.36, 0.96), line(0.07, -0.26, 0.36, 0.96),
        thin(line(-0.15, 0.1, 0.15, 0.1)), thin(line(-0.23, 0.44, 0.23, 0.44)), thin(line(-0.31, 0.78, 0.31, 0.78)),
        thin(line(-0.15, 0.1, 0.23, 0.44)), thin(line(0.15, 0.1, -0.23, 0.44)), thin(line(-0.23, 0.44, 0.31, 0.78)), thin(line(0.23, 0.44, -0.31, 0.78)));
      return out;
    },
    headphones: () => [ // Audio Engineering & Design: media circle (play, note, image, text)
      circ(0, 0, 0.94), line(0, -0.94, 0, 0.94), line(-0.94, 0, 0.94, 0),
      closed(poly(-0.56, -0.66, -0.56, -0.22, -0.24, -0.44)),
      line(0.34, -0.22, 0.34, -0.66), line(0.34, -0.66, 0.64, -0.66), line(0.64, -0.66, 0.64, -0.3), dot(0.28, -0.2), dot(0.58, -0.28),
      rrect(-0.72, 0.18, 0.54, 0.4, 0.03), poly(-0.72, 0.5, -0.56, 0.34, -0.42, 0.48, -0.32, 0.38, -0.18, 0.52), dot(-0.3, 0.28),
      line(0.2, 0.22, 0.7, 0.22), line(0.2, 0.42, 0.64, 0.42), line(0.2, 0.62, 0.5, 0.62),
    ],
    bezier: () => [ // Graphic & Digital Design: pen-tool handles, pencil, picture
      circ(0, 0.06, 0.88),
      line(-0.52, -0.74, 0.52, -0.74), rrect(-0.74, -0.86, 0.24, 0.24, 0.03), rrect(-0.12, -0.86, 0.24, 0.24, 0.03), rrect(0.5, -0.86, 0.24, 0.24, 0.03),
      closed(poly(-0.54, 0.82, -0.54, -0.1, -0.42, -0.36, -0.3, -0.1, -0.3, 0.82)),
      poly(-0.08, 0.92, -0.08, -0.16, 0.76, -0.16),
      poly(-0.08, 0.66, 0.24, 0.32, 0.46, 0.54, 0.6, 0.4, 0.86, 0.62), circ(0.46, 0.08, 0.12),
    ],
  };
  const animated = { turbine: 1, robotArm: 1, heartPulse: 1, dna: 1, code: 1, book: 1, tower: 1 };
  G.ICONS_NEW = { defs, animated };
})(globalThis);
