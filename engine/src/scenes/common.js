/* Shared scene helpers: text stacks, background washes, iris transitions. */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const { clamp, inv, lerp, TAU } = DHS.math;
  const E = DHS.ease, T = DHS.type, D = DHS.draw, C = DHS.color;
  const S = (DHS.common = {});

  // Visibility of a revealed element: rises in from below at tIn, lifts out upward at tOut
  S.vis = (t, tIn, tOut, dIn = 0.6, dOut = 0.42) => {
    const pin = DHS.tw(t, tIn, tIn + dIn, E.swift);
    const pout = tOut == null ? 0 : DHS.tw(t, tOut, tOut + dOut, E.lift);
    return { pin, pout, on: pin > 0 && pout < 1 };
  };
  const drawEl = (ctx, str, x, y, size, v, o) => {
    if (!v.on) return;
    if (v.pout > 0) T.line(ctx, str, x, y, size, 1 - v.pout, { ...o, from: 'top' });
    else T.line(ctx, str, x, y, size, v.pin, o);
  };

  // A typographic stack: optional lead line, hero lines, optional sub lines.
  // spec: {x, y, maxW, lead, leadSize, lines, maxSize, sub, subSize, color, align, anchor:'top'|'center', tIn, tOut, lh}
  S.stackMetrics = (ctx, spec) => {
    const size = Math.min(spec.maxSize, T.fit(ctx, spec.lines, 'display', spec.maxW, spec.maxSize));
    const lh = size * (spec.lh || 0.98);
    const leadSize = spec.lead ? Math.min(spec.leadSize, T.fit(ctx, [spec.lead], 'text', spec.maxW, spec.leadSize)) : 0;
    const subSize = spec.sub ? Math.min(spec.subSize, T.fit(ctx, spec.sub, 'text', spec.maxW, spec.subSize)) : 0;
    const leadH = spec.lead ? leadSize * 1.55 : 0;
    const subH = spec.sub ? size * 0.42 + spec.sub.length * subSize * 1.3 : 0;
    const heroH = size * 0.74 + (spec.lines.length - 1) * lh; // cap-height to last baseline
    return { size, lh, leadSize, subSize, leadH, subH, heroH, total: leadH + heroH + subH + size * 0.18 };
  };
  S.stack = (ctx, spec, t) => {
    const m = S.stackMetrics(ctx, spec);
    let y = spec.anchor === 'center' ? spec.y - m.total / 2 : spec.y;
    const o = { color: spec.color, align: spec.align || 'left' };
    let k = 0; const st = spec.stagger || 0.085;
    if (spec.lead) { y += m.leadSize; drawEl(ctx, spec.lead, spec.x, y, m.leadSize, S.vis(t, spec.tIn, spec.tOut), { ...o, role: 'text' }); y += m.leadSize * 0.55; k++; }
    y += m.size * 0.8;
    spec.lines.forEach((ln, i) => {
      drawEl(ctx, ln, spec.x, y, m.size, S.vis(t, spec.tIn + k * st, spec.tOut == null ? null : spec.tOut + k * 0.04), { ...o, role: 'display' });
      if (i < spec.lines.length - 1) y += m.lh; k++;
    });
    if (spec.sub) {
      y += m.size * 0.42;
      spec.sub.forEach((ln) => {
        y += m.subSize * 1.3;
        drawEl(ctx, ln, spec.x, y, m.subSize, S.vis(t, spec.tIn + 0.12 + k * st, spec.tOut == null ? null : spec.tOut + k * 0.03), { ...o, role: 'text' });
        k++;
      });
    }
    return m;
  };

  // Background: flat brand color with a soft, low-contrast light falloff (keeps brand hue true)
  S.wash = (ctx, W, H, color, lx, ly) => {
    ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.hypot(W, H) * 0.75);
    g.addColorStop(0, 'rgba(255,255,255,0.055)'); g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.10)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };

  // Hex iris clip (used for academy + end-card entrances)
  S.irisHex = (ctx, cx, cy, p, W, H, spin = 1) => {
    const R = (Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) / Math.cos(Math.PI / 6)) * 1.04;
    const r = R * p;
    D.hexPath(ctx, cx, cy, r, -Math.PI / 2 + spin * (1 - p) * 0.9, 0.1);
  };
  S.irisRing = (ctx, cx, cy, p, W, H, spin, color) => {
    if (p <= 0 || p >= 1) return;
    const R = (Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) / Math.cos(Math.PI / 6)) * 1.04;
    const lag = DHS.ease.outCubic(clamp(p * 1.08));
    ctx.save(); ctx.globalAlpha = 0.9 * (1 - p);
    D.hexPath(ctx, cx, cy, R * lag + 14, -Math.PI / 2 + spin * (1 - p) * 0.9, 0.1);
    ctx.lineWidth = 8; ctx.strokeStyle = color; ctx.stroke(); ctx.restore();
  };
})(globalThis);
