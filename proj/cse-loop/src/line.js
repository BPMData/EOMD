/* line.js: the signature line. A path is sampled densely, then resampled to even steps along its length, so
   drawing "the first p of it" is smooth at any frame rate: the end point is interpolated inside a step, never
   snapped to a corner (sketch C's stutter came from growing one whole segment at a time). */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const STEP = 4;   // px between resampled points

  // spec: array of ['M',x,y] ['L',x,y] ['Q',cx,cy,x,y] ['C',c1x,c1y,c2x,c2y,x,y]
  function build(spec) {
    const raw = []; let px = 0, py = 0;
    for (const c of spec) {
      if (c[0] === 'M' || c[0] === 'L') {
        if (c[0] === 'L') { const n = Math.max(1, Math.ceil(Math.hypot(c[1] - px, c[2] - py) / 2)); for (let i = 1; i <= n; i++) raw.push([px + (c[1] - px) * i / n, py + (c[2] - py) * i / n]); }
        else raw.push([c[1], c[2]]);
        px = c[1]; py = c[2];
      } else if (c[0] === 'Q') { for (let i = 1; i <= 80; i++) { const u = i / 80, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u; raw.push([a * px + b * c[1] + d * c[3], a * py + b * c[2] + d * c[4]]); } px = c[3]; py = c[4]; }
      else if (c[0] === 'C') { for (let i = 1; i <= 120; i++) { const u = i / 120, a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, d = 3 * u * u * (1 - u), e = u ** 3;
        raw.push([a * px + b * c[1] + d * c[3] + e * c[5], a * py + b * c[2] + d * c[4] + e * c[6]]); } px = c[5]; py = c[6]; }
    }
    // cumulative length, then even resampling
    const cum = [0]; for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
    const len = cum[cum.length - 1], n = Math.max(2, Math.ceil(len / STEP) + 1), xs = new Float32Array(n), ys = new Float32Array(n);
    let j = 0;
    for (let i = 0; i < n; i++) { const d = len * i / (n - 1); while (j < raw.length - 2 && cum[j + 1] < d) j++;
      const seg = cum[j + 1] - cum[j] || 1, u = (d - cum[j]) / seg; xs[i] = raw[j][0] + (raw[j + 1][0] - raw[j][0]) * u; ys[i] = raw[j][1] + (raw[j + 1][1] - raw[j][1]) * u; }
    return { xs, ys, n, len };
  }
  // the point at fraction u of the length (interpolated) and its direction
  function at(P, u) {
    const f = Math.max(0, Math.min(1, u)) * (P.n - 1), i = Math.min(P.n - 2, Math.floor(f)), r = f - i;
    return { x: P.xs[i] + (P.xs[i + 1] - P.xs[i]) * r, y: P.ys[i] + (P.ys[i + 1] - P.ys[i]) * r, a: Math.atan2(P.ys[i + 1] - P.ys[i], P.xs[i + 1] - P.xs[i]) };
  }
  function trace(ctx, P, u0, u1) {
    const f0 = Math.max(0, Math.min(1, u0)) * (P.n - 1), f1 = Math.max(0, Math.min(1, u1)) * (P.n - 1); if (f1 <= f0) return false;
    const a = at(P, u0); ctx.beginPath(); ctx.moveTo(a.x, a.y);
    for (let i = Math.ceil(f0); i <= Math.floor(f1); i++) ctx.lineTo(P.xs[i], P.ys[i]);
    const b = at(P, u1); ctx.lineTo(b.x, b.y); return true;
  }
  // draw the part of the line between u0 and u1; o: color, glow, width, head (bool), headFill
  function draw(ctx, P, u0, u1, o = {}) {
    const w = o.width || 16; ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (trace(ctx, P, u0, u1)) {
      ctx.strokeStyle = o.glow || o.color; ctx.globalAlpha = o.glowAlpha ?? 0.28; ctx.lineWidth = w * 2.6; ctx.stroke();
      ctx.globalAlpha = 1; ctx.strokeStyle = o.color; ctx.lineWidth = w; ctx.stroke();
    }
    if (o.head && u1 > u0 && u1 < 1.0001) { const h = at(P, u1); ctx.beginPath(); ctx.arc(h.x, h.y, w * 1.4, 0, Math.PI * 2); ctx.fillStyle = o.headFill || '#fff'; ctx.fill(); ctx.lineWidth = w * 0.5; ctx.strokeStyle = o.color; ctx.stroke(); }
    ctx.restore();
  }
  const cache = new Map();
  const get = (key, spec) => { if (!cache.has(key)) cache.set(key, build(spec)); return cache.get(key); };
  DHS.line = { build, at, draw, get };
})(globalThis);
