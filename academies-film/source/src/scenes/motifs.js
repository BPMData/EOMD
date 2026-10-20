/* Background motifs: one per academy, tone-on-tone, low contrast, kept to the
   badge side and the top edge so they never sit behind hero text.
   Only the EmTech ticker and the Clean Energy skylight reference verified
   West-campus details (stock ticker display; greenhouse-style skylight lab). */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const { clamp, inv, lerp, TAU } = DHS.math;
  const E = DHS.ease, D = DHS.draw, C = DHS.color;
  const BEAT = 0.625;
  const Mo = (DHS.motifs = {});
  // Region on the badge side of the frame
  const zone = (env, L) => L.V ? { x0: 0, x1: env.W, y0: 0, y1: 900 } : L.side === 'left' ? { x0: 0, x1: 860, y0: 0, y1: env.H } : { x0: 1070, x1: env.W, y0: 0, y1: env.H };

  // Emerging Tech: scrolling ticker of candlesticks along the top edge + a rising line
  Mo.ticker = (ctx, env, L, t, fg) => {
    const r = DHS.rng(11); const sp = 46, n = Math.ceil(env.W / sp) + 3; const off = (t * 70) % sp;
    ctx.save();
    const bars = []; for (let i = 0; i < 64; i++) bars.push([r() * 0.8 + 0.2, r() > 0.42]);
    for (let i = 0; i < n; i++) {
      const k = (i + Math.floor(t * 70 / sp)) % 64, [h, up] = bars[k];
      const x = i * sp - off, yb = 88, bh = 18 + h * 34;
      ctx.fillStyle = C.rgba(fg, up ? 0.26 : 0.14); ctx.fillRect(x, yb - bh, 16, bh);
      ctx.fillStyle = C.rgba(fg, 0.18); ctx.fillRect(x + 7, yb - bh - 10, 2, bh + 20);
    }
    const z = zone(env, L); const p = E.glide(inv(0.3, 2.6, t));
    const pts = []; for (let i = 0; i <= 40; i++) { const f = i / 40; pts.push([lerp(z.x0 + 30, z.x1 - 30, f), lerp(env.H * 0.9, env.H * 0.3, f) + DHS.noise1(f * 9, 3) * 60]); }
    ctx.strokeStyle = C.rgba(fg, 0.13); ctx.lineWidth = 6; ctx.lineJoin = 'round'; D.strokePartial(ctx, pts, p);
    ctx.restore();
  };

  // Scientific Innovation & Medicine: a heartbeat trace that beats on the music
  Mo.ecg = (ctx, env, L, t, fg) => {
    const y0 = 104, W = env.W; const speed = 520; const head = (t * speed) % (W + 300);
    const wave = (x) => { const ph = ((x / speed) % (2 * BEAT)) / (2 * BEAT); const s = ph * 20; return s > 9 && s < 12 ? [0, -10, 44, -62, 18, 0][Math.floor((s - 9) * 2)] ?? 0 : 0; };
    ctx.save(); ctx.lineWidth = 5; ctx.lineJoin = 'round';
    for (let x = 0; x < Math.min(head, W); x += 6) {
      const age = (head - x) / (W * 0.9); const a = clamp(1 - age) * 0.32; if (a <= 0.01) continue;
      ctx.strokeStyle = C.rgba(fg, a); ctx.beginPath(); ctx.moveTo(x, y0 + wave(x)); ctx.lineTo(x + 6, y0 + wave(x + 6)); ctx.stroke();
    }
    const r = DHS.rng(21); const z = zone(env, L);
    ctx.strokeStyle = C.rgba(fg, 0.12); ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const x = lerp(z.x0 + 40, z.x1 - 40, r()), y = lerp(200, env.H - 140, r()) - t * 10, s = 10 + r() * 10; ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke(); }
    ctx.restore();
  };

  // Clean Energy & Green Design: skylight light shafts + drifting seeds
  Mo.skylight = (ctx, env, L, t, fg) => {
    const z = zone(env, L);
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const sway = Math.sin(t * 0.6 + i) * 20; const x = lerp(z.x0 + 60, z.x1 - 60, i / 3) + sway; const w = 70 + i * 14;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w + 260, env.H); ctx.lineTo(x + 260, env.H); ctx.closePath();
      ctx.fillStyle = C.rgba('#ffffff', 0.045); ctx.fill();
    }
    const r = DHS.rng(31);
    for (let i = 0; i < 26; i++) {
      const bx = lerp(z.x0, z.x1, r()), by = r() * env.H, sp = 18 + r() * 26, s = 3 + r() * 4;
      const y = ((by - t * sp) % env.H + env.H) % env.H, x = bx + Math.sin(t * 0.8 + i) * 18;
      D.circle(ctx, x, y, s); ctx.fillStyle = C.rgba(fg, 0.2); ctx.fill();
    }
    ctx.restore();
  };

  // IT & Cybersecurity: a network with data pulses on the beat
  Mo.network = (ctx, env, L, t, fg) => {
    const z = zone(env, L); const r = DHS.rng(41); const nodes = [];
    for (let i = 0; i < 22; i++) nodes.push([lerp(z.x0 + 30, z.x1 - 30, r()) + Math.sin(t * 0.5 + i) * 8, lerp(40, env.H - 60, r()) + Math.cos(t * 0.4 + i) * 8]);
    ctx.save(); ctx.lineWidth = 2.5;
    const edges = [];
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const d = Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]); if (d < 250) edges.push([i, j]); }
    ctx.strokeStyle = C.rgba(fg, 0.12);
    for (const [i, j] of edges) { ctx.beginPath(); ctx.moveTo(...nodes[i]); ctx.lineTo(...nodes[j]); ctx.stroke(); }
    edges.forEach(([i, j], k) => { if (k % 3) return; const f = ((t / (BEAT * 2)) + k * 0.37) % 1; const x = lerp(nodes[i][0], nodes[j][0], f), y = lerp(nodes[i][1], nodes[j][1], f); D.circle(ctx, x, y, 4.5); ctx.fillStyle = C.rgba(fg, 0.4); ctx.fill(); });
    for (const [x, y] of nodes) { D.circle(ctx, x, y, 6); ctx.fillStyle = C.rgba(fg, 0.26); ctx.fill(); }
    ctx.restore();
  };

  // Professional & Public Service: warm rising steam curls + a circle of community dots
  Mo.steam = (ctx, env, L, t, fg) => {
    const z = zone(env, L);
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const x0 = lerp(z.x0 + 80, z.x1 - 80, i / 5); const ph = t * 0.35 + i * 0.23; const f = ph % 1;
      const y = env.H + 40 - f * (env.H + 200);
      const pts = []; for (let k = 0; k <= 24; k++) { const s = k / 24; pts.push([x0 + Math.sin(s * 5 + t * 1.3 + i) * 34, y + s * 220]); }
      ctx.strokeStyle = C.rgba(fg, 0.1 * Math.sin(f * Math.PI)); ctx.lineWidth = 7; D.strokePartial(ctx, pts, 1);
    }
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU + t * 0.15; D.circle(ctx, L.c.x + Math.cos(a) * (L.r + 70), L.c.y + Math.sin(a) * (L.r + 70), 5 + (i % 2) * 2); ctx.fillStyle = C.rgba(fg, 0.22); ctx.fill(); }
    ctx.restore();
  };

  // Art, Engineering & Design: blueprint grid + a slow drafting gear
  Mo.blueprint = (ctx, env, L, t, fg) => {
    ctx.save(); ctx.strokeStyle = C.rgba(fg, 0.07); ctx.lineWidth = 1.5;
    const off = (t * 10) % 64;
    ctx.beginPath();
    for (let x = -64 + off; x < env.W; x += 64) { ctx.moveTo(x, 0); ctx.lineTo(x, env.H); }
    for (let y = -64 + off; y < env.H; y += 64) { ctx.moveTo(0, y); ctx.lineTo(env.W, y); }
    ctx.stroke();
    const gx = L.V ? env.W * 0.85 : L.side === 'left' ? 120 : env.W - 120, gy = L.V ? 820 : env.H - 120;
    const teeth = 14, a0 = t * 0.25, p = [];
    for (let i = 0; i < teeth; i++) { const a = a0 + (i * TAU) / teeth, w = Math.PI / teeth; for (const [ang, rr] of [[a - w * 0.6, 250], [a - w * 0.35, 300], [a + w * 0.35, 300], [a + w * 0.6, 250]]) p.push([gx + rr * Math.cos(ang), gy + rr * Math.sin(ang)]); }
    ctx.strokeStyle = C.rgba(fg, 0.12); ctx.lineWidth = 4; ctx.beginPath(); p.forEach((q, i) => (i ? ctx.lineTo(...q) : ctx.moveTo(...q))); ctx.closePath(); ctx.stroke();
    D.circle(ctx, gx, gy, 90); ctx.stroke();
    ctx.restore();
  };

  // Communication & Design: broadcast rings on the beat + a level-meter strip on top
  Mo.waves = (ctx, env, L, t, fg) => {
    ctx.save(); ctx.lineWidth = 4;
    for (let k = 0; k < 4; k++) {
      const f = ((t / (BEAT * 2)) + k / 4) % 1; const r = L.r + 40 + f * 520;
      ctx.strokeStyle = C.rgba(fg, 0.2 * (1 - f)); D.circle(ctx, L.c.x, L.c.y, r); ctx.stroke();
    }
    const n = 48, w = env.W / n;
    for (let i = 0; i < n; i++) {
      const beatPh = (t % BEAT) / BEAT; const env1 = Math.exp(-beatPh * 3.2);
      const h = 10 + 46 * Math.abs(Math.sin(i * 0.7 + t * 2.1)) * (0.45 + 0.55 * env1);
      ctx.fillStyle = C.rgba(fg, 0.14); ctx.fillRect(i * w + 3, 0, w - 6, h);
    }
    ctx.restore();
  };
})(globalThis);
