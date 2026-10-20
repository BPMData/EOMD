/* EXPLORATION ACADEMY (7.5 s, 3 bars). Teal floods out from the hub:
   every 9th grader starts here. A: starts here. B: 7 academies / 21 pathways
   sprout. C: the diagram folds into a personal ranking list whose items get
   thoughtfully reordered — "Explore. Rank carefully." */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const { clamp, inv, lerp, TAU } = DHS.math;
  const E = DHS.ease, T = DHS.type, D = DHS.draw, C = DHS.color, S = DHS.common, Hb = DHS.hub;
  const cfg = () => DHS.config;
  const X = (DHS.explorationScene = {});
  const IRIS = 0.72;

  X.scene = (start, dur) => ({
    name: 'exploration', start, dur, tail: 0.66, layer: 1, transIn: IRIS,
    clip(ctx, tau, env) { const g = Hb.geom(env.W, env.H); const p = DHS.tw(tau, 0, IRIS, E.bezier(0.5, 0, 0.2, 1)); D.circle(ctx, g.cx, g.cy, p * Math.hypot(env.W, env.H)); },
    ring(ctx, tau, env) {
      const g = Hb.geom(env.W, env.H); const p = DHS.tw(tau, 0, IRIS, E.bezier(0.5, 0, 0.2, 1)); if (p <= 0 || p >= 1) return;
      ctx.save(); ctx.globalAlpha = 0.9 * (1 - p); ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; D.circle(ctx, g.cx, g.cy, p * Math.hypot(env.W, env.H) + 12); ctx.stroke(); ctx.restore();
    },
    draw(ctx, tau, env) { X.draw(ctx, tau, env, dur); },
    cues(add) {
      add(-0.12, 'swell', { dur: 0.9 });
      add(0.6, 'thump', { gain: 0.7 });
      for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) add(2.6 + i * 0.22 + j * 0.108, 'pop', { note: (i + j * 2) % 7, gain: 0.32 });
      add(4.85, 'whoosh', { dur: 0.6, pan: 0 });
      add(5.95, 'slide', {}); add(6.55, 'slide', {});
      add(7.08, 'tick', { gain: 0.6, pitch: 2 });
    },
  });

  X.draw = (ctx, tau, env, dur) => {
    const c = cfg(); const { W, H } = env; const g = Hb.geom(W, H); const col = Hb.col(W, H);
    const teal = c.exploration.color, ink = C.textOn(teal); // audited: ink on teal ≈ 5.1:1 (white is only ≈3.3:1)
    const out = E.inCubic(inv(dur, dur + 0.66, tau));
    ctx.save();
    if (out > 0) { const s = 1 + 0.07 * out; ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2); }
    S.wash(ctx, W, H, teal, g.cx, g.cy);
    // topographic contour rings around the hub ("explore")
    ctx.save(); ctx.strokeStyle = C.rgba(ink, 0.08); ctx.lineWidth = 3;
    for (let k = 0; k < 8; k++) {
      const r0 = 420 + ((k * 150 + tau * 26) % 1200);
      ctx.beginPath();
      for (let i = 0; i <= 90; i++) { const a = (i / 90) * TAU; const r = r0 + DHS.noise1(i / 9 + k * 3.7, 5) * 26; const x = g.cx + r * Math.cos(a), y = g.cy + r * Math.sin(a) * 0.92; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.globalAlpha = clamp(1 - (r0 - 420) / 1200); ctx.stroke();
    }
    ctx.restore();

    // ---- diagram (continues seamlessly from the hub scene's unwind)
    const n = c.academies.length;
    const fold = E.inOutCubic(inv(4.8, 5.5, tau));
    if (fold < 1) {
      const st = { rot: Hb.rotAt(17.5) + 0.045 * tau, u: 1, grow: 1, hub: 1, disk: 1, circ: [], hex: [] };
      for (let i = 0; i < n; i++) { st.circ[i] = 1; st.hex[i] = inv(2.6 + i * 0.22, 3.2 + i * 0.22, tau); }
      ctx.save(); const s = 1 - fold; ctx.translate(g.cx, g.cy); ctx.scale(s, s); ctx.rotate(fold * -0.8); ctx.translate(-g.cx, -g.cy);
      Hb.draw(ctx, g, st); ctx.restore();
    }
    // ---- ranking list (C)
    X.ranking(ctx, g, tau, ink, teal);

    // ---- copy
    const e = c.copy.exploration;
    const base = { x: col.x, y: col.V ? col.y : col.y, maxW: col.w, color: ink, anchor: col.V ? 'top' : 'center', leadSize: 42 };
    S.stack(ctx, { ...base, lead: e.a.lead, lines: e.a.lines, maxSize: 150, tIn: 0.55, tOut: 2.3 }, tau);
    S.stack(ctx, { ...base, lead: e.b.lead, lines: e.b.lines, maxSize: 124, tIn: 2.55, tOut: 4.72 }, tau);
    S.stack(ctx, { ...base, lines: e.c.lines, maxSize: 132, sub: e.c.sub, subSize: 38, tIn: 5.0 }, tau);
    ctx.restore();
  };

  // A personal ranking list. Rows (numbered) stay put; the choices inside get reordered.
  X.ranking = (ctx, g, tau, ink, teal) => {
    const c = cfg();
    const appear = inv(5.1, 5.75, tau); if (appear <= 0) return;
    const rows = 3, rh = 104, rw = g.V ? 640 : 600, gap = 22;
    const x0 = g.cx - rw / 2, y0 = g.cy - ((rows * rh + (rows - 1) * gap) / 2) + 34;
    // label
    const lv = S.vis(tau, 5.15, null);
    if (lv.on) T.line(ctx, c.copy.exploration.rankLabel, x0 + 6, y0 - 34, 40, lv.pin, { role: 'text', color: ink });
    // item positions after swaps: [0,1,2] → [1,0,2] → [1,2,0]
    const s1 = E.inOutCubic(inv(5.95, 6.45, tau)), s2 = E.inOutCubic(inv(6.55, 7.05, tau));
    const slotOf = (item) => {
      const p1 = [1, 0, 2][item], p0 = item; let pos = lerp(p0, p1, s1);
      const p2 = [2, 0, 1][item]; if (s2 > 0) pos = lerp(p1, p2, s2);
      return pos;
    };
    const arcOf = (item) => { const a = Math.sin(Math.PI * s1) * (item === 0 ? 1 : item === 1 ? -1 : 0) + Math.sin(Math.PI * s2) * (item === 0 ? 1 : item === 2 ? -1 : 0); return a * 46; };
    for (let r = 0; r < rows; r++) {
      const q = E.spring(inv(5.12 + r * 0.1, 5.75 + r * 0.1, tau)); if (q <= 0) continue;
      const y = y0 + r * (rh + gap);
      ctx.save(); ctx.translate(x0 + rw / 2, y + rh / 2); ctx.scale(q, q); ctx.translate(-(x0 + rw / 2), -(y + rh / 2));
      D.pill(ctx, x0, y, rw, rh); ctx.fillStyle = C.rgba('#ffffff', 0.34); ctx.fill();
      D.circle(ctx, x0 + rh / 2, y + rh / 2, rh / 2 - 12); ctx.fillStyle = ink; ctx.fill();
      T.set(ctx, 'display', 46); ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.fillText(String(r + 1), x0 + rh / 2, y + rh / 2 + 16);
      ctx.restore();
    }
    const icons = ['bulb', 'leafHouse', 'headphones'], bars = [[250, 150], [300, 110], [210, 170]];
    for (let item = 0; item < 3; item++) {
      const q = E.spring(inv(5.35 + item * 0.1, 5.95 + item * 0.1, tau)); if (q <= 0) continue;
      const pos = slotOf(item), y = y0 + pos * (rh + gap), dx = arcOf(item);
      const x = x0 + rh + 8 + dx;
      ctx.save(); ctx.globalAlpha = clamp(q);
      D.pill(ctx, x, y + 10, rw - rh - 18, rh - 20); ctx.fillStyle = '#ffffff'; ctx.fill();
      D.hexPath(ctx, x + 44, y + rh / 2, 30 * q); ctx.fillStyle = teal; ctx.fill();
      DHS.icons.draw(ctx, icons[item], x + 44, y + rh / 2, 16 * q, ink, 1, tau, 0.15);
      ctx.fillStyle = C.rgba(ink, 0.22);
      D.pill(ctx, x + 90, y + rh / 2 - 17, bars[item][0] * q, 14); ctx.fill();
      D.pill(ctx, x + 90, y + rh / 2 + 5, bars[item][1] * q, 14); ctx.fill();
      ctx.restore();
    }
    // settled: a check draws on beside the label
    const ck = E.outCubic(inv(7.05, 7.4, tau));
    if (ck > 0) { ctx.save(); ctx.strokeStyle = ink; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; D.strokePartial(ctx, [[x0 + rw - 60, y0 - 50], [x0 + rw - 44, y0 - 34], [x0 + rw - 14, y0 - 66]], ck); ctx.restore(); }
  };
})(globalThis);
