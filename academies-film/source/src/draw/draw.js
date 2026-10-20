/* Drawing primitives + typography. Canvas 2D only. */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const { TAU, clamp, lerp } = DHS.math;
  const D = (DHS.draw = {});

  // ------------------------------------------------------------ geometry
  D.hexPts = (cx, cy, r, rot = -Math.PI / 2) => {
    const p = [];
    for (let k = 0; k < 6; k++) { const a = rot + (k * TAU) / 6; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return p;
  };
  // Rounded polygon path (corner radius rad)
  D.roundPoly = (ctx, pts, rad) => {
    const n = pts.length;
    ctx.beginPath();
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const s = mid(pts[n - 1], pts[0]);
    ctx.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; ctx.arcTo(p[0], p[1], q[0], q[1], rad); }
    ctx.closePath();
  };
  D.hexPath = (ctx, cx, cy, r, rot = -Math.PI / 2, round = 0.14) => D.roundPoly(ctx, D.hexPts(cx, cy, r, rot), r * round);
  D.pill = (ctx, x, y, w, h) => { const r = h / 2; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  D.circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); };

  // Variable-width ribbon along a polyline, round caps. pts:[[x,y]], w:[width]
  D.ribbon = (ctx, pts, w) => {
    const n = pts.length; if (n < 2) return;
    const L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const h = w[i] / 2;
      L.push([pts[i][0] - dy * h, pts[i][1] + dx * h]); R.push([pts[i][0] + dy * h, pts[i][1] - dx * h]);
    }
    ctx.beginPath();
    ctx.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
    // end cap
    const e = pts[n - 1], ea = Math.atan2(L[n - 1][1] - e[1], L[n - 1][0] - e[0]);
    ctx.arc(e[0], e[1], w[n - 1] / 2, ea, ea - Math.PI, true);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    const s = pts[0], sa = Math.atan2(R[0][1] - s[1], R[0][0] - s[0]);
    ctx.arc(s[0], s[1], w[0] / 2, sa, sa - Math.PI, true);
    ctx.closePath();
  };

  // Partial polyline by arc length (for draw-on strokes)
  D.polyLen = (pts) => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
  D.strokePartial = (ctx, pts, p) => {
    if (p <= 0 || pts.length < 2) return;
    const total = D.polyLen(pts); let rem = total * clamp(p);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && rem > 0; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const seg = Math.hypot(x1 - x0, y1 - y0);
      if (seg <= rem) { ctx.lineTo(x1, y1); rem -= seg; } else { const f = rem / seg; ctx.lineTo(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f); rem = 0; }
    }
    ctx.stroke();
  };
  D.bezierPts = (p0, p1, p2, p3, n = 40) => {
    const out = [];
    for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); }
    return out;
  };

  // ---------------------------------------------------------- hat emblem
  // A fedora silhouette (Danbury = "Hat City", home of the Hatters). Unit ~ ±1.
  // DHS top hat (simplified from the school's Hatters logo): crown with the "D" as
  // negative space, band, curled brim. Drawn in pixel space of the source art, then
  // mapped to the old hat's units (height ≈ 1.4·s, centered at y − 0.14·s).
  const HAT = { crown: 'M123 250 L107 104 Q106 99 112 97 Q201 30 340 102 Q347 106 345 112 L311 250 Z', d: 'M195.8 110.0 L243.8 110.0 L261.1 129.2 L255.3 186.8 L234.2 206.0 L186.2 206.0 L187.4 194.5 L197.2 191.6 L204.0 124.4 L194.6 121.5 Z M219.6 131.1 L236.9 131.1 L242.0 137.8 L237.3 184.9 L214.2 184.9 Z', brim: 'M44 272 C52 250 92 242 126 244 L311 250 C322 258 334 252 344 242 C352 238 357 250 357 262 C356 282 342 300 318 314 C286 330 240 332 200 331 C140 330 80 316 56 294 C47 286 42 280 44 272 Z' }, HAT_K = 1.4 / 262;
  let hatP = null;
  D.hat = (ctx, x, y, s, color, band) => {
    if (!hatP) hatP = { crown: new Path2D(HAT.crown), crownD: new Path2D(HAT.crown + ' ' + HAT.d), brim: new Path2D(HAT.brim) };
    ctx.save(); ctx.translate(x, y - 0.14 * s); ctx.scale(s * HAT_K, s * HAT_K); ctx.translate(-200, -200);
    ctx.fillStyle = color; ctx.fill(hatP.crownD, 'evenodd');
    if (band) { ctx.save(); ctx.clip(hatP.crown); ctx.fillStyle = band; ctx.fillRect(90, 218, 280, 22); ctx.restore(); }
    ctx.fillStyle = color; ctx.fill(hatP.brim);
    ctx.restore();
  };

  // Map pin (campus cue)
  D.pin = (ctx, x, y, s, color, hole) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 1); ctx.bezierCurveTo(-0.25, 0.55, -0.72, 0.15, -0.72, -0.28); ctx.arc(0, -0.28, 0.72, Math.PI, 0); ctx.bezierCurveTo(0.72, 0.15, 0.25, 0.55, 0, 1); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    D.circle(ctx, 0, -0.28, 0.28); ctx.fillStyle = hole; ctx.fill();
    ctx.restore();
  };

  // ------------------------------------------------------------- type
  const T = (DHS.type = {});
  T.families = { display: 'DHSDisplay', text: 'DHSText' };
  T.font = (role, size) => `${Math.round(size * 10) / 10}px ${T.families[role]}, 'Liberation Sans', sans-serif`;
  T.set = (ctx, role, size, tracking = role === 'display' ? -0.02 : -0.005) => {
    ctx.font = T.font(role, size);
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${(tracking * size).toFixed(2)}px`;
    ctx.textBaseline = 'alphabetic';
  };
  T.width = (ctx, str, role, size) => { T.set(ctx, role, size); return ctx.measureText(str).width; };
  // Largest size ≤ max such that every line fits maxW
  T.fit = (ctx, lines, role, maxW, max, min = 10) => {
    let s = max;
    for (const l of lines) { const w = T.width(ctx, l, role, 100); s = Math.min(s, (100 * maxW) / w); }
    return Math.max(min, Math.floor(s));
  };
  // Load embedded fonts (browser). Resolves when ready.
  T.load = async () => {
    if (typeof FontFace === 'undefined' || !DHS.fontData) return;
    const b64 = (s) => { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
    for (const [role, fam] of Object.entries(T.families)) {
      const ff = new FontFace(fam, b64(DHS.fontData[fam]));
      await ff.load(); document.fonts.add(ff);
    }
  };

  // Kinetic line: masked slide. p: 0..1 in, dir +1 (rises in from below) or -1 (exits upward, p=1 visible)
  T.line = (ctx, str, x, y, size, p, opt = {}) => {
    if (p <= 0) return;
    const role = opt.role || 'display';
    T.set(ctx, role, size, opt.tracking);
    ctx.textAlign = opt.align || 'left';
    ctx.fillStyle = opt.color || '#fff';
    const w = ctx.measureText(str).width;
    const x0 = opt.align === 'center' ? x - w / 2 : opt.align === 'right' ? x - w : x;
    const off = (1 - p) * size * 1.12 * (opt.from === 'top' ? -1 : 1);
    if (p >= 1 || opt.noMask) { ctx.fillText(str, x, y + off); return; }
    ctx.save();
    ctx.beginPath(); ctx.rect(x0 - size * 0.2, y - size * 1.0, w + size * 0.4, size * 1.3); ctx.clip();
    ctx.fillText(str, x, y + off);
    ctx.restore();
  };
  // Word-staggered reveal (in and out). t = local time.
  T.words = (ctx, str, x, y, size, t, o) => {
    const role = o.role || 'display';
    T.set(ctx, role, size, o.tracking);
    ctx.textAlign = 'left';
    const words = str.split(' ');
    const full = ctx.measureText(str).width;
    let xs = o.align === 'center' ? x - full / 2 : o.align === 'right' ? x - full : x;
    let prefix = '';
    words.forEach((wd, i) => {
      const wx = xs + (prefix ? ctx.measureText(prefix + ' ').width : 0);
      prefix = prefix ? prefix + ' ' + wd : wd;
      const pin = DHS.tw(t, o.t0 + i * (o.stagger || 0.06), o.t0 + i * (o.stagger || 0.06) + (o.dur || 0.55), o.ease || DHS.ease.swift);
      const pout = o.out != null ? DHS.tw(t, o.out + i * 0.035, o.out + i * 0.035 + 0.4, DHS.ease.lift) : 0;
      if (pin <= 0 || pout >= 1) return;
      ctx.save();
      const w = ctx.measureText(wd).width;
      ctx.beginPath(); ctx.rect(wx - size * 0.15, y - size * 1.0, w + size * 0.3, size * 1.32); ctx.clip();
      const off = (1 - pin) * size * 1.12 - pout * size * 1.12;
      ctx.fillStyle = o.color; ctx.fillText(wd, wx, y + off);
      ctx.restore();
    });
  };
  // Rolling word (slot-machine morph) inside a pill. Returns pill width.
  T.roll = (ctx, words, x, y, size, t, period, color, stroke, alpha = 1) => {
    const n = words.length; const k = Math.floor(t / period); const f = t / period - k;
    const cur = words[((k % n) + n) % n], nxt = words[(((k + 1) % n) + n) % n];
    const m = DHS.ease.swift(DHS.math.inv(0.72, 1, f));
    T.set(ctx, 'text', size, 0);
    const wc = ctx.measureText(cur).width, wn = ctx.measureText(nxt).width;
    const w = lerp(wc, wn, m) + size * 1.2, h = size * 1.55;
    ctx.save(); ctx.globalAlpha = alpha;
    D.pill(ctx, x, y - h / 2, w, h); ctx.lineWidth = Math.max(3, size * 0.1); ctx.strokeStyle = stroke; ctx.stroke();
    ctx.clip();
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(cur, x + w / 2, y + size * 0.04 - m * h);
    ctx.fillText(nxt, x + w / 2, y + size * 0.04 + (1 - m) * h);
    ctx.restore(); ctx.textBaseline = 'alphabetic';
    return w;
  };
})(globalThis);
