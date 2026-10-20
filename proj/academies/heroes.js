/* Academy HERO marks (the symbol above each academy's logo circle), animated.
   DHS.heroes.draw(ctx, id, x, y, s, fg, bg, t, lw)
     x,y = centre; s = half-size (px); fg = mark color; bg = background color (used for
     knockouts, e.g. ruler ticks); t = seconds since the splash started; lw = line weight
     as a fraction of s.
   Every hero plays its move once, then holds; the gears keep turning slowly.
   Geometry is in a unit box (about -1..1, y down). Pure function of t. */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const rad = Math.PI / 180, TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const out = (x) => 1 - (1 - x) ** 3;
  const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
  const back = (x, k = 1.7) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + (k + 1) * (x - 1) ** 3 + k * (x - 1) ** 2);

  const arc = (cx, cy, r, a0, a1, n = 32) => { const p = []; for (let i = 0; i <= n; i++) { const a = (a0 + ((a1 - a0) * i) / n) * rad; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return p; };
  const circ = (cx, cy, r, n = 40) => arc(cx, cy, r, 0, 360, n);
  const bez = (a, b, c, d, n = 20) => { const p = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; p.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]); } return p; };
  const join = (...ps) => ps.reduce((acc, p) => acc.concat(acc.length ? p.slice(1) : p), []);
  const poly = (...a) => { const p = []; for (let i = 0; i < a.length; i += 2) p.push([a[i], a[i + 1]]); return p; };
  const rrect = (x, y, w, h, r) => { const p = [].concat(arc(x + w - r, y + r, r, -90, 0, 6), arc(x + w - r, y + h - r, r, 0, 90, 6), arc(x + r, y + h - r, r, 90, 180, 6), arc(x + r, y + r, r, 180, 270, 6)); return p.concat([p[0]]); };
  const xf = (pts, f) => pts.map(f);
  const rotAbout = (pts, a, cx, cy) => { const c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]); };
  const scaleAbout = (pts, k, cx, cy, ky = k) => pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * ky]);
  const gearPts = (cx, cy, r, n, a0, depth = 0.24) => { const p = [], ri = r * (1 - depth), w = Math.PI / n; for (let i = 0; i < n; i++) { const a = a0 + (i * TAU) / n; for (const [g, rr] of [[a - w * 0.62, ri], [a - w * 0.36, r], [a + w * 0.36, r], [a + w * 0.62, ri]]) p.push([cx + rr * Math.cos(g), cy + rr * Math.sin(g)]); } return p.concat([p[0]]); };
  const chaikin = (p, it = 2, closedPath = false) => { for (let k = 0; k < it; k++) { const q = []; const n = p.length; for (let i = 0; i < n - 1; i++) { const a = p[i], b = p[i + 1]; q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } p = closedPath ? q.concat([q[0]]) : [p[0]].concat(q, [p[n - 1]]); } return p; };

  // drawing primitives (ctx is already in unit space)
  const path = (c, p) => { c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); };
  const stroke = (c, p, f = 1) => {
    if (f <= 0 || p.length < 2) return;
    if (f >= 1) { path(c, p); c.stroke(); return; }
    let L = 0; const d = []; for (let i = 1; i < p.length; i++) { const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); d.push(l); L += l; }
    let left = L * f; c.beginPath(); c.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length && left > 0; i++) { if (d[i - 1] <= left) { c.lineTo(p[i][0], p[i][1]); left -= d[i - 1]; } else { const k = left / d[i - 1]; c.lineTo(p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k); left = 0; } }
    c.stroke();
  };
  const fill = (c, p, color) => { c.fillStyle = color; path(c, p); c.closePath(); c.fill(); };
  const disc = (c, x, y, r, color) => { c.fillStyle = color; c.beginPath(); c.arc(x, y, Math.max(0, r), 0, TAU); c.fill(); };

  const H = {};

  // ---- Information Technology & Cybersecurity: laptop. Lid flips open, screen turns on.
  //      Closed, the lid lies over the keyboard deck in the same perspective (a trapezoid);
  //      it straightens into a rectangle as it swings up.
  H.laptop = (c, t, fg, bg) => {
    const hinge = 0.2, LH = 0.96, o0 = -(0.64 - hinge) / LH;          // o0: lid lies exactly on the deck
    const o = o0 + (1 - o0) * back(seg(t, 0.35, 1.3), 1.2), cl = clamp(-o / -o0);
    const lid = (p) => xf(p, ([x, y]) => { const f = (hinge - y) / LH; return [x * (1 + (0.8 / 0.6 - 1) * f * cl), hinge + (y - hinge) * o]; });
    const baseP = poly(-0.58, 0.24, 0.58, 0.24, 0.8, 0.64, -0.8, 0.64); baseP.push(baseP[0]);
    stroke(c, baseP);
    stroke(c, poly(-0.86, 0.64, 0.86, 0.64));
    if (o > 0.05) {
      c.fillStyle = fg;
      for (let r = 0; r < 3; r++) { const y = 0.33 + r * 0.075, w = 0.46 + r * 0.04; for (let x = -w; x <= w + 1e-6; x += (2 * w) / 12) c.fillRect(x - 0.02, y - 0.016, 0.04, 0.032); }
      const tp = poly(-0.12, 0.525, 0.12, 0.525, 0.145, 0.595, -0.145, 0.595); tp.push(tp[0]); c.save(); c.lineWidth *= 0.5; stroke(c, tp); c.restore(); // thin, clear of the keys
    }
    const outer = lid(rrect(-0.6, -0.76, 1.2, LH, 0.06)), inner = lid(rrect(-0.49, -0.65, 0.98, 0.74, 0.02));
    fill(c, outer, bg); stroke(c, outer);
    if (o > 0) stroke(c, inner);
    const on = io(seg(t, 1.5, 2.1));
    if (on > 0) { c.save(); c.globalAlpha = on; fill(c, inner, fg); c.restore(); }
  };

  // ---- Communication & Design: both bubbles draw in together, then talk at the same time:
  //      the dots pulse while the reply's lines write in, one by one, left to right.
  H.bubbles = (c, t, fg, bg) => {
    const cx = -0.3, cy = -0.22, cl = [];
    for (let i = 0; i <= 160; i++) { const a = (i / 160) * TAU, r = 1 + 0.12 * Math.abs(Math.sin(3 * a + 0.6)); cl.push([cx + 0.58 * r * Math.cos(a), cy + 0.4 * r * Math.sin(a)]); }
    const d = out(seg(t, 0, 1.0));
    const tail = poly(-0.36, 0.14, -0.3, 0.42, -0.14, 0.14);
    if (d > 0.6) { fill(c, tail, bg); stroke(c, tail, seg(d, 0.6, 1)); }
    fill(c, cl, bg); stroke(c, cl, d);
    for (let i = 0; i < 3; i++) {
      const pop = back(seg(t, 0.9 + i * 0.08, 1.2 + i * 0.08));
      const typing = t > 1.2 && t < 3.6 ? Math.max(0, Math.sin(TAU * 1.5 * (t - 1.2) - i * 1.1)) : 0;
      disc(c, -0.62 + i * 0.19, -0.2, 0.065 * pop * (1 + 0.4 * typing), fg);
    }
    const bx = 0.32, by = 0.16, br = 0.44;
    const b = join(arc(bx, by, br, 72, 398, 48), [[0.74, 0.68], [bx + br * Math.cos(72 * rad), by + br * Math.sin(72 * rad)]]);
    if (t > 0) { fill(c, b, bg); stroke(c, b, d); }
    c.save(); c.lineWidth *= 1.7;
    [[0.04, 1.2], [0.16, 1.75], [0.28, 2.3]].forEach(([y, s0]) => stroke(c, poly(0.08, by + y - 0.12, 0.56, by + y - 0.12), io(seg(t, s0, s0 + 0.35))));
    c.restore();
  };

  // ---- Scientific Innovation & Medicine: caduceus. Snakes climb the staff, wings flap.
  H.caduceus = (c, t, fg, bg) => {
    stroke(c, poly(0, 0.95, 0, -0.62), out(seg(t, 0, 0.45)));
    const kn = back(seg(t, 0.35, 0.6)); if (kn > 0) { c.save(); c.translate(0, -0.72); c.scale(kn, kn); stroke(c, circ(0, 0, 0.075)); c.restore(); }
    const snake = (s) => { const p = []; for (let i = 0; i <= 90; i++) { const u = i / 90, y = 0.74 - u * 1.18, amp = 0.06 + 0.15 * u; p.push([s * amp * Math.sin(u * Math.PI * 4.5), y]); } return p; };
    const sp = io(seg(t, 0.3, 1.9));
    stroke(c, snake(1), sp); stroke(c, snake(-1), sp);
    const hd = back(seg(t, 1.85, 2.1));
    if (hd > 0) for (const s of [1, -1]) { c.save(); c.translate(s * 0.21, -0.46); c.rotate(s * -0.5); c.scale(hd, hd); fill(c, circ(0, 0, 0.07), fg); fill(c, poly(0, -0.05, -s * 0.13, -0.01, 0, 0.05), fg); c.restore(); }
    const wd = out(seg(t, 1.6, 2.3)), tt = Math.max(0, t - 2.3);
    const flap = 0.3 * Math.sin(TAU * 0.8 * tt) * Math.exp(-0.9 * tt) + 0.05 * Math.sin(TAU * 0.3 * tt) * (1 - Math.exp(-tt));
    for (const s of [1, -1]) {
      const W = (p) => rotAbout(xf(p, ([x, y]) => [s * x, y]), -s * flap, s * 0.05, -0.6);
      const edge = join(bez([0.05, -0.6], [0.22, -0.82], [0.55, -0.93], [0.94, -0.84]), poly(0.94, -0.84, 0.76, -0.73, 0.82, -0.65, 0.6, -0.61, 0.64, -0.53, 0.42, -0.52, 0.44, -0.44, 0.22, -0.47, 0.05, -0.54));
      stroke(c, W(chaikin(edge, 2)), wd);
      stroke(c, W(bez([0.18, -0.66], [0.38, -0.75], [0.6, -0.78], [0.82, -0.76])), seg(wd, 0.5, 1));
    }
  };

  // ---- Emerging Technology & Entrepreneurship: three people over a turning gear.
  H.team = (c, t, fg, bg) => {
    c.save(); c.beginPath(); c.rect(-1.2, 0.05, 2.4, 1.2); c.clip();
    stroke(c, gearPts(0, 0.26, 0.54, 9, t * 0.35), out(seg(t, 0, 0.9)));
    stroke(c, circ(0, 0.26, 0.2), out(seg(t, 0.3, 0.9)));
    c.restore();
    stroke(c, poly(-0.78, 0, 0.78, 0), out(seg(t, 0, 0.45)));
    const person = (px, hy, hr, sh, k) => { if (k <= 0) return; const P = (p) => scaleAbout(p, k, px, -0.2); stroke(c, P(circ(px, hy, hr))); for (const s of sh) stroke(c, P(s)); };
    for (const s of [-1, 1]) {
      const px = s * 0.46, a0 = s < 0 ? 180 : 360, a1 = s < 0 ? 238 : 302;
      person(px, -0.66, 0.13, [join([[px + s * 0.24, -0.04]], arc(px, -0.22, 0.24, a0, a1, 10))], back(seg(t, s < 0 ? 0.45 : 0.65, s < 0 ? 0.8 : 1.0)));
    }
    person(0, -0.74, 0.16, [join([[-0.3, -0.04]], arc(0, -0.24, 0.3, 180, 360, 20), [[0.3, -0.04]])], back(seg(t, 0.9, 1.3)));
  };

  // ---- Professional & Public Service: scales. Pans teeter, then settle level.
  H.scales = (c, t, fg, bg) => {
    const d = out(seg(t, 0, 0.9)), tt = Math.max(0, t - 0.9);
    const a = 0.2 * Math.exp(-0.55 * tt) * Math.cos(TAU * 0.5 * tt);
    stroke(c, poly(0, 0.6, 0, -0.62), d);
    if (d > 0.5) stroke(c, circ(0, -0.74, 0.08));
    for (const [y, w] of [[0.6, 0.12], [0.66, 0.26], [0.72, 0.44]]) stroke(c, poly(-w, y + 0.06, -w, y, w, y, w, y + 0.06), d);
    const beam = rotAbout(join(bez([-0.66, -0.42], [-0.42, -0.52], [-0.18, -0.36], [0, -0.44]), bez([0, -0.44], [0.18, -0.36], [0.42, -0.52], [0.66, -0.42])), a, 0, -0.44);
    stroke(c, beam, d);
    const ends = rotAbout([[-0.66, -0.42], [0.66, -0.42]], a, 0, -0.44);
    const pd = seg(d, 0.4, 1);
    for (const [ex, ey] of ends) {
      stroke(c, circ(ex + (ex < 0 ? -0.05 : 0.05), ey - 0.02, 0.045), pd);
      const py = ey + 0.58;
      stroke(c, poly(ex - 0.2, py, ex, ey, ex + 0.2, py), pd);
      stroke(c, join(poly(ex - 0.25, py, ex + 0.25, py), xf(arc(0, 0, 0.25, 0, 180, 16), ([x, y]) => [ex + x, py + y * 0.55]).reverse().slice(0).concat([[ex - 0.25, py]])), pd);
    }
  };

  // ---- Art, Engineering & Design: gear rises and turns; pencil slides along the ruler,
  //      the tick marks appear as it passes, then it drops into its slot.
  H.workbench = (c, t, fg, bg) => {
    c.save(); c.beginPath(); c.rect(-1.06, -1.2, 2.12, 2.4); c.clip();
    const rise = 0.5 * (1 - out(seg(t, 0, 0.8)));
    c.save(); c.beginPath(); c.rect(-1.2, -1.2, 2.4, 1.2); c.clip();
    fill(c, gearPts(0, 0.02 + rise, 0.56, 10, t * 0.3, 0.26), fg); disc(c, 0, 0.02 + rise, 0.18, bg);
    c.restore();
    const rw = out(seg(t, 0, 0.35));
    if (rw > 0) {
      c.save(); c.beginPath(); c.rect(-0.75, -0.05, 1.5 * rw, 0.4); c.clip();
      fill(c, rrect(-0.72, 0.0, 1.44, 0.26, 0.03), fg); disc(c, -0.6, 0.12, 0.045, bg);
      c.restore();
    }
    // pencil pose: tip position; body extends to the right
    const tx = 1.08 - 1.8 * io(seg(t, 0.45, 2.0)), ty = 0.33 + 0.13 * back(seg(t, 2.0, 2.45), 1.4);
    c.fillStyle = bg;
    for (let i = 0; i < 11; i++) { const x = -0.47 + i * 0.1; if (tx < x) c.fillRect(x - 0.018, 0.12, 0.036, 0.16); }
    if (t > 0.45) {
      fill(c, poly(tx, ty, tx + 0.2, ty - 0.065, tx + 0.2, ty + 0.065), fg);
      fill(c, rrect(tx + 0.22, ty - 0.065, 1.22, 0.13, 0.065), fg);
    }
    c.restore();
  };

  // Shared parts for the two "held pencil" versions: gear + ruler (ticks drawn left of tickX), and a pencil drawn at any pose.
  const bench = (c, t, fg, bg, tickX = 9) => {
    const rise = 0.5 * (1 - out(seg(t, 0, 0.8)));
    c.save(); c.beginPath(); c.rect(-1.2, -1.2, 2.4, 1.2); c.clip();
    fill(c, gearPts(0, 0.02 + rise, 0.56, 10, t * 0.3, 0.26), fg); disc(c, 0, 0.02 + rise, 0.18, bg);
    c.restore();
    const rw = out(seg(t, 0, 0.35));
    if (rw > 0) {
      c.save(); c.beginPath(); c.rect(-0.75, -0.05, 1.5 * rw, 0.4); c.clip();
      fill(c, rrect(-0.72, 0.0, 1.44, 0.26, 0.03), fg); disc(c, -0.6, 0.12, 0.045, bg);
      c.fillStyle = bg; for (let i = 0; i < 11; i++) { const x = -0.47 + i * 0.1; if (x < tickX) c.fillRect(x - 0.018, 0.12, 0.036, 0.16); }
      c.restore();
    }
  };
  // tip at (x, y); the body runs from the tip along angle a (0 = flat, eraser to the right)
  const pencil = (c, x, y, a, fg, bg) => {
    c.save(); c.translate(x, y); c.rotate(a);
    const shape = poly(0, 0, 0.2, -0.065).concat(arc(1.375, 0, 0.065, -90, 90, 8), poly(0.2, 0.065, 0, 0));
    c.save(); c.strokeStyle = bg; c.lineWidth = 0.07; path(c, shape); c.closePath(); c.stroke(); c.restore(); // halo: reads over the gear
    fill(c, shape, fg);
    c.strokeStyle = bg; c.lineWidth = 0.022; stroke(c, poly(0.215, -0.07, 0.215, 0.07));                      // the tip/body seam
    c.restore();
  };
  const bounceOut = (x) => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; };
  const L45 = 0.72, A45 = -Math.PI / 4, cx45 = Math.cos(A45) * L45, cy45 = Math.sin(A45) * L45; // tip -> pencil centre at 45 deg
  const dropTo = (c, t, t0, from, fg, bg) => { // from = tip at 45 deg; falls flat into the slot, tip at (-0.72, 0.46)
    const u = seg(t, t0, t0 + 0.75), f = bounceOut(u), fa = Math.min(1, u * 1.6) ** 2;
    const c0 = [from[0] + cx45, from[1] + cy45], c1 = [0, 0.46];
    const cx = c0[0] + (c1[0] - c0[0]) * io(Math.min(1, u * 1.4)), cy = c0[1] + (c1[1] - c0[1]) * f, a = A45 * (1 - fa);
    pencil(c, cx - Math.cos(a) * L45, cy - Math.sin(a) * L45, a, fg, bg);
  };
  // A (Bryan's pick): enters from the LEFT held at 45 deg, draws the ruler's ticks as its tip passes them, then is dropped
  //   and slides into its slot
  H.workbenchA = (c, t, fg, bg) => {
    c.save(); c.beginPath(); c.rect(-1.06, -1.2, 2.12, 2.4); c.clip();
    const tip = [-1.3 + 1.92 * io(seg(t, 0.4, 2.2)), 0.33];
    bench(c, t, fg, bg, t < 2.2 ? tip[0] : 9);
    if (t < 2.2) { if (t > 0.4) pencil(c, tip[0], tip[1], A45, fg, bg); } else dropTo(c, t, 2.2, [0.62, 0.33], fg, bg);
    c.restore();
  };
  // B: enters from the RIGHT held at 45 deg, traces right to left under the ruler, then drops straight down into its slot
  H.workbenchB = (c, t, fg, bg) => {
    c.save(); c.beginPath(); c.rect(-1.06, -1.2, 2.12, 2.4); c.clip();
    bench(c, t, fg, bg);
    const tip = [1.2 - 1.71 * io(seg(t, 0.4, 2.2)), 0.33];
    if (t < 2.2) { if (t > 0.4) pencil(c, tip[0], tip[1], A45, fg, bg); } else dropTo(c, t, 2.2, [-0.51, 0.33], fg, bg);
    c.restore();
  };

  // ---- Clean Energy & Green Design: globe turns into place, the sprig unfurls.
  const LAND = [
    [[-17, 15], [-16, 21], [-13, 27], [-6, 35], [10, 37], [11, 33], [20, 31], [32, 31], [34, 28], [43, 12], [51, 12], [41, -2], [40, -15], [35, -25], [27, -34], [20, -35], [18, -29], [12, -17], [13, -5], [9, 4], [4, 6], [-8, 4], [-13, 8], [-17, 15]],
    [[-9, 37], [-9, 43], [-1, 44], [-4, 48], [2, 51], [6, 53], [12, 55], [20, 55], [28, 58], [30, 46], [28, 41], [22, 40], [20, 42], [16, 38], [12, 44], [8, 44], [3, 43], [-1, 37], [-9, 37]],
    [[34, 28], [35, 31], [48, 30], [56, 25], [59, 22], [52, 16], [43, 12], [39, 21], [34, 28]],
    [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17], [44, -25]],
  ];
  H.globe = (c, t, fg, bg) => {
    const gx = 0.16, gy = 0, R = 0.66, lat0 = 12 * rad, lon0 = (10 - 55 * (1 - out(seg(t, 0, 3.2)))) * rad;
    stroke(c, arc(gx, gy, R, 150, 488, 60), out(seg(t, 0, 0.8)));
    const show = seg(t, 0.4, 0.9);
    if (show > 0) {
      c.save(); c.globalAlpha = show;
      for (const shape of LAND) {
        const dense = []; for (let i = 0; i < shape.length - 1; i++) for (let k = 0; k < 4; k++) { const u = k / 4; dense.push([shape[i][0] + (shape[i + 1][0] - shape[i][0]) * u, shape[i][1] + (shape[i + 1][1] - shape[i][1]) * u]); }
        dense.push(shape[shape.length - 1]);
        let run = [];
        const flush = () => { if (run.length > 2) stroke(c, chaikin(run, 2)); run = []; };
        for (const [lo, la] of dense) {
          const L = lo * rad, B = la * rad, dl = L - lon0;
          const vis = Math.sin(lat0) * Math.sin(B) + Math.cos(lat0) * Math.cos(B) * Math.cos(dl);
          if (vis <= 0.05) { flush(); continue; }
          run.push([gx + R * Math.cos(B) * Math.sin(dl), gy - R * (Math.cos(lat0) * Math.sin(B) - Math.sin(lat0) * Math.cos(B) * Math.cos(dl))]);
        }
        flush();
      }
      c.restore();
    }
    stroke(c, bez([-0.28, 0.44], [-0.52, 0.3], [-0.64, 0.04], [-0.6, -0.3]), out(seg(t, 0.5, 1.2)));
    const leaf = (ax, ay, tx, ty, w, k, curl) => {
      if (k <= 0) return;
      const dx = tx - ax, dy = ty - ay, nx = -dy * w, ny = dx * w;
      const p = join(bez([ax, ay], [ax + dx * 0.3 + nx, ay + dy * 0.3 + ny], [ax + dx * 0.75 + nx * 0.8, ay + dy * 0.75 + ny * 0.8], [tx, ty]), bez([tx, ty], [ax + dx * 0.75 - nx * 0.8, ay + dy * 0.75 - ny * 0.8], [ax + dx * 0.3 - nx, ay + dy * 0.3 - ny], [ax, ay]));
      const mid = bez([ax, ay], [ax + dx * 0.4 + nx * 0.15, ay + dy * 0.4 + ny * 0.15], [ax + dx * 0.7, ay + dy * 0.7], [ax + dx * 0.85, ay + dy * 0.85]);
      const T = (q) => rotAbout(scaleAbout(q, k, ax, ay), curl * (1 - k), ax, ay);
      fill(c, T(p), bg); stroke(c, T(p)); stroke(c, T(mid));
    };
    leaf(-0.6, -0.3, -0.42, -0.9, 0.42, back(seg(t, 1.0, 1.7), 1.2), -0.9);
    leaf(-0.62, -0.06, -1.02, -0.06, 0.4, back(seg(t, 1.3, 2.0), 1.2), 0.9);
  };

  // ---- Exploration Academy: compass rose. Needle swings and settles on north, dots ping in.
  H.compass = (c, t, fg, bg) => {
    c.save(); c.translate(0, 0.2);
    const O = [0, 0.42], w = out(seg(t, 0, 0.4));
    fill(c, poly(-1.05 * w, 0.42, -0.25 * w, 0.355, 0.25 * w, 0.355, 1.05 * w, 0.42, 1.05 * w, 0.44, -1.05 * w, 0.44), fg);
    const kite = (deg, R, hw) => {
      const a = deg * rad, ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
      const tip = [O[0] + ux * R, O[1] + uy * R], sd = (s) => [O[0] + ux * R * 0.24 + s * px * hw, O[1] + uy * R * 0.24 + s * py * hw];
      fill(c, [O, sd(1), tip], fg);
      c.save(); c.globalAlpha = 0.62; fill(c, [O, tip, sd(-1)], fg); c.restore();
    };
    c.save(); c.lineWidth *= 0.3; const rd = out(seg(t, 0.6, 1.4));
    for (const d of [-11, -34, -56, -79, -101, -124, -146, -169]) { const a = d * rad; stroke(c, [[O[0] + 0.3 * Math.cos(a), O[1] + 0.3 * Math.sin(a)], [O[0] + 0.66 * Math.cos(a), O[1] + 0.66 * Math.sin(a)]], rd); }
    stroke(c, arc(O[0], O[1], 0.74, 192, 348, 40), out(seg(t, 0.9, 1.6)));
    c.restore();
    [[-45, 0.84, 0.075], [-135, 0.84, 0.075], [-67.5, 0.62, 0.05], [-112.5, 0.62, 0.05], [-22.5, 0.6, 0.045], [-157.5, 0.6, 0.045]].forEach(([d, R, hw], i) => { const g = back(seg(t, 0.2 + i * 0.07, 0.7 + i * 0.07)); if (g > 0) kite(d, R * g, hw); });
    for (let i = 0; i < 11; i++) { const a = (197 + i * 14.6) * rad, g = back(seg(t, 1.3 + i * 0.09, 1.55 + i * 0.09), 2.4); if (g > 0) disc(c, O[0] + 0.74 * Math.cos(a), O[1] + 0.74 * Math.sin(a), 0.036 * g, fg); }
    if (t > 0.3) { const tt = Math.max(0, t - 0.55); kite(-90 + 62 * Math.exp(-1.0 * tt) * Math.cos(TAU * 0.75 * tt), 1.2, 0.085); }
    fill(c, arc(O[0], O[1] + 0.005, 0.15, 180, 360, 20), bg);
    c.restore();
  };

  DHS.heroes = {
    ids: Object.keys(H),
    draw(ctx, id, x, y, s, fg, bg, t = 99, lw = 0.055) {
      if (!H[id]) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.strokeStyle = fg; ctx.fillStyle = fg; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      H[id](ctx, t, fg, bg);
      ctx.restore();
    },
  };
})(globalThis);
