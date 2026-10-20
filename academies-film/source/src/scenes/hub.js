/* SIGNATURE ELEMENT: the Pathway Spiral.
   Seven academy-colored arms wind around a hat (Danbury = Hat City). They
   unwind into seven straight paths that end in seven academy circles (the
   "hub diagram"), and wind back again. The hub scene spans the loop point:
     τ 0.0–7.5   end card on Danbury Blue (hub diagram + "Explore. Find your fit.")
     τ 7.5–10    paths rewind into the spiral
     τ 10–16     title card (seam at τ 12.5 = t 0.0)  greeting: Hello/Hola/Olá
     τ 16–17.5   spiral unwinds into the hub diagram → Exploration Academy */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const { clamp, inv, lerp, TAU } = DHS.math;
  const E = DHS.ease, T = DHS.type, D = DHS.draw, C = DHS.color, S = DHS.common;
  const cfg = () => DHS.config;
  const H = (DHS.hub = {});

  H.geom = (W, Hh) => {
    const V = Hh > W;
    const s = V ? 1.0 : 1.0;
    return { V, cx: V ? W / 2 : 560, cy: V ? 620 : 540, s, r0: 142 * s, R: 400 * s, ringR: 342 * s, cR: 54 * s, hubR: 108 * s, turns: 0.5, w0: 22 * s, w1: 54 * s, wRay: 20 * s, key: 7 * s };
  };

  // Rotation of the diagram over the hub scene (continuous; also seeds Exploration)
  H.rotAt = (tau) => -0.35 + 0.045 * tau - 0.95 * E.inOutCubic(inv(7.4, 9.9, tau)) + 1.1 * E.inOutCubic(inv(15.9, 17.4, tau));

  // st: {u, rot, grow, hub, circ[7], hex[7], disk}
  H.draw = (ctx, g, st) => {
    const A = cfg().academies, n = A.length, white = cfg().colors.white;
    const u = st.u;
    // White badge disk behind the wound spiral
    const diskR = lerp(g.R + 40 * g.s, g.hubR, E.inOutCubic(clamp(u * 1.25))) * (st.disk ?? 1);
    if (diskR > g.hubR + 1) { D.circle(ctx, g.cx, g.cy, diskR); ctx.fillStyle = white; ctx.fill(); }
    // Arms
    const N = 56;
    for (let i = 0; i < n; i++) {
      const base = st.rot + (i * TAU) / n;
      const pts = [], w = [];
      const sMax = clamp(st.grow ?? 1);
      if (sMax <= 0.001) continue;
      for (let k = 0; k <= N; k++) {
        const s = (k / N) * sMax;
        const th = base + (1 - u) * g.turns * TAU * s;
        const r = lerp(g.r0 + (g.R - g.r0) * s, g.r0 + (g.ringR - g.r0) * s, u);
        pts.push([g.cx + r * Math.cos(th), g.cy + r * Math.sin(th)]);
        w.push(lerp(lerp(g.w0, g.w1, s), g.wRay, u));
      }
      D.ribbon(ctx, pts, w); ctx.lineWidth = g.key; ctx.strokeStyle = white; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.fillStyle = A[i].color; ctx.fill();
    }
    // Academy circles on the ring, each with its three pathway hexes
    for (let i = 0; i < n; i++) {
      const p = st.circ ? st.circ[i] : 0; if (p <= 0.001) continue;
      const base = st.rot + (i * TAU) / n;
      const x = g.cx + g.ringR * Math.cos(base), y = g.cy + g.ringR * Math.sin(base);
      const r = g.cR * E.spring(p);
      D.circle(ctx, x, y, r + g.key * 0.5); ctx.fillStyle = white; ctx.fill();
      D.circle(ctx, x, y, r - g.key * 0.5); ctx.fillStyle = A[i].color; ctx.fill();
      const hp = st.hex ? st.hex[i] : 0;
      if (hp > 0) {
        const hr = 15 * g.s, d = (Math.sqrt(3) * hr + 4 * g.s) / Math.sqrt(3);
        const hc = C.textOn(A[i].color);
        [[0, -d], [-d * 0.866, d / 2], [d * 0.866, d / 2]].forEach(([dx, dy], j) => {
          const q = E.spring(inv(j * 0.18, j * 0.18 + 0.6, hp));
          if (q > 0) { D.hexPath(ctx, x + dx, y + dy + 3 * g.s, hr * q); ctx.fillStyle = hc; ctx.fill(); }
        });
      }
    }
    // Hub: white disk with the hat
    const hp = st.hub ?? 1;
    if (hp > 0) {
      const r = g.hubR * E.spring(hp);
      D.circle(ctx, g.cx, g.cy, r); ctx.fillStyle = white; ctx.fill();
      D.hat(ctx, g.cx, g.cy + 8 * g.s * hp, 74 * g.s * E.spring(inv(0.15, 1, hp)), cfg().colors.danburyBlue, cfg().colors.exploration);
    }
  };

  // Text column geometry
  H.col = (W, Hh) => (Hh > W ? { x: 90, y: 1165, w: W - 180, V: true } : { x: 1010, y: 540, w: 820, V: false });

  // ------------------------------------------------------------------ scene
  H.scene = (start) => ({
    name: 'hub', start, dur: 17.5, tail: 0.8, layer: 0,
    transIn: 0.62,
    clip(ctx, tau, env) { const g = H.geom(env.W, env.H); S.irisHex(ctx, g.cx, g.cy, DHS.tw(tau, 0, 0.62, E.bezier(0.55, 0, 0.2, 1)), env.W, env.H, -1); },
    ring(ctx, tau, env) { const g = H.geom(env.W, env.H); S.irisRing(ctx, g.cx, g.cy, DHS.tw(tau, 0, 0.62, E.bezier(0.55, 0, 0.2, 1)), env.W, env.H, -1, '#fff'); },
    draw(ctx, tau, env) {
      const { W, H: Hh } = env; const c = cfg(); const g = H.geom(W, Hh); const col = H.col(W, Hh);
      const white = c.colors.white;
      S.wash(ctx, W, Hh, c.colors.danburyBlue, g.cx, g.cy);
      H.backdrop(ctx, g, tau, W, Hh);

      // ---- diagram state machine
      const n = c.academies.length;
      const st = { rot: H.rotAt(tau), u: 1, grow: 1, hub: 1, disk: 1, circ: [], hex: [] };
      if (tau < 7.5) { // end card build
        st.hub = inv(0.05, 0.75, tau);
        st.grow = E.outCubic(inv(0.25, 1.05, tau));
        for (let i = 0; i < n; i++) { st.circ[i] = inv(0.62 + i * 0.078, 1.22 + i * 0.078, tau); st.hex[i] = inv(1.1 + i * 0.078, 1.9 + i * 0.078, tau); }
      }
      if (tau >= 7.3 && tau < 15.9) { // rewind, then hold as spiral
        st.u = 1 - E.inOutCubic(inv(7.45, 9.9, tau));
        for (let i = 0; i < n; i++) { st.circ[i] = 1 - E.inCubic(inv(7.3 + i * 0.04, 7.95 + i * 0.04, tau)); st.hex[i] = 1 - inv(7.3, 7.6, tau); }
      }
      if (tau >= 15.9) { // unwind
        st.u = E.inOutCubic(inv(15.9, 17.25, tau));
        for (let i = 0; i < n; i++) { st.circ[i] = inv(16.75 + i * 0.05, 17.3 + i * 0.05, tau); st.hex[i] = 0; }
      }
      // gentle breathing scale on the spiral while it holds
      const breath = 1 + 0.012 * Math.sin((tau - 10) * (TAU / 5)) * inv(9.6, 10.4, tau) * (1 - inv(15.4, 15.9, tau));
      ctx.save(); ctx.translate(g.cx, g.cy); ctx.scale(breath, breath); ctx.translate(-g.cx, -g.cy);
      H.draw(ctx, g, st);
      ctx.restore();

      // ---- end card text (τ 0.45 → 7.0)
      const e = c.copy.end;
      const endSpec = { x: col.x, y: col.V ? col.y - 30 : col.y - 70, maxW: col.w, lead: e.kicker, leadSize: 40, lines: e.lines, maxSize: col.V ? 124 : 120,
        sub: e.body, subSize: 38, color: white, anchor: col.V ? 'top' : 'center', tIn: 0.45, tOut: 7.0 };
      S.stack(ctx, endSpec, tau);
      H.lockup(ctx, env, col, tau, 1.5, 7.0);

      // ---- title card (τ 9.7 → 15.6), seam inside at τ 12.5
      const tIn = 9.75, tOut = 15.55;
      const titleSpec = { x: col.x, y: col.V ? col.y + 95 : col.y + 40, maxW: col.w, lines: c.school.nameLines, maxSize: 122,
        sub: [c.copy.introSub], subSize: 40, color: white, anchor: col.V ? 'top' : 'center', tIn: tIn + 0.1, tOut };
      S.stack(ctx, titleSpec, tau);
      // greeting morph pill
      const gv = S.vis(tau, tIn, tOut + 0.05);
      if (gv.on) {
        const m = S.stackMetrics(ctx, titleSpec);
        const gy = col.V ? col.y + 10 : titleSpec.y - m.total / 2 - 62;
        ctx.save();
        const a = gv.pout > 0 ? 1 - gv.pout : gv.pin;
        ctx.translate(0, (1 - a) * 30);
        T.roll(ctx, c.copy.greeting, col.x, gy, 50, Math.max(0, tau - tIn), 1.25, white, white, a);
        ctx.restore();
      }
    },
    cues(add) {
      const n = cfg().academies.length;
      add(0.0 - 0.18, 'whoosh', { dur: 0.7, pan: -0.3 });
      for (let i = 0; i < n; i++) add(0.62 + i * 0.078, 'pop', { note: i, gain: 0.6 });
      add(0.55, 'thump', {});
      add(7.35, 'rewind', { dur: 2.6 });
      add(9.85, 'thump', { gain: 0.8 });
      add(15.85, 'unwind', { dur: 1.6 });
      for (let i = 0; i < n; i++) add(16.75 + i * 0.05, 'pop', { note: n - 1 - i, gain: 0.45 });
    },
  });

  // Faint concentric "contour" rings: the Hat City hub radiating outward
  H.backdrop = (ctx, g, tau, W, Hh) => {
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2;
    for (let k = 0; k < 9; k++) { const r = 470 + ((k * 130 + tau * 22) % 1170); D.circle(ctx, g.cx, g.cy, r); ctx.globalAlpha = clamp(1 - (r - 470) / 1170) ; ctx.stroke(); }
    ctx.restore();
  };

  // School lockup under the end card: hat + name + nickname
  H.lockup = (ctx, env, col, tau, tIn, tOut) => {
    const c = cfg(); const v = S.vis(tau, tIn, tOut);
    if (!v.on) return;
    const a = v.pout > 0 ? 1 - v.pout : E.outCubic(v.pin);
    const y = col.V ? env.H - 150 : env.H - 118;
    const x = col.x;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * 24);
    D.hat(ctx, x + 38, y - 2, 38, c.colors.white, c.colors.danburyBlue);
    T.set(ctx, 'text', 32); ctx.fillStyle = c.colors.white; ctx.textAlign = 'left';
    ctx.fillText(c.school.name, x + 96, y - 6);
    T.set(ctx, 'text', 30); ctx.globalAlpha = a * 1; ctx.fillText(c.copy.end.lockupSub, x + 96, y + 34);
    ctx.restore();
  };
})(globalThis);
