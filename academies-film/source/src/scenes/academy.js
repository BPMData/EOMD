/* ACADEMY BEAT (5 s each, 2 bars). One system, seven variations.
   Badge = academy (white circle) holding three pathway hexes. Pathways branch
   out along drawn paths into subordinate label chips. The name is the hero.
   Alternates badge left/right. Enters with a hex iris from its own badge. */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const { clamp, inv, lerp, TAU } = DHS.math;
  const E = DHS.ease, T = DHS.type, D = DHS.draw, C = DHS.color, S = DHS.common;
  const cfg = () => DHS.config;
  const A = (DHS.academyScene = {});
  const BEAT = 0.625;
  const HEX_T = [BEAT, BEAT * 1.5, BEAT * 2];            // hex pops on the beat grid
  const CHIP_T = [BEAT * 2.5, BEAT * 3, BEAT * 3.5];     // pathway paths branch out
  const IRIS = 0.62;

  A.layout = (W, H, idx) => {
    const V = H > W;
    if (V) return { V, side: 'top', c: { x: W / 2, y: 530 }, r: 276, col: { x: 90, w: W - 180, top: 944 }, footY: H - 64 };
    const left = idx % 2 === 0;
    return { V, side: left ? 'left' : 'right', c: { x: left ? 500 : 1420, y: 492 }, r: 285, col: left ? { x: 900, w: 920, top: 176 } : { x: 110, w: 900, top: 176 }, footY: 1034 };
  };
  const hexOffsets = (r) => { const h = r * 0.335, g = r * 0.05, d = (Math.sqrt(3) * h + g) / Math.sqrt(3); return { h, pos: [[0, -d], [-d * 0.866, d / 2], [d * 0.866, d / 2]].map(([x, y]) => [x, y + d * 0.2]) }; };

  A.scene = (a, idx, start, dur) => ({
    name: 'academy:' + a.id, start, dur, tail: IRIS + 0.02, layer: 1, transIn: IRIS,
    clip(ctx, tau, env) { const L = A.layout(env.W, env.H, idx); S.irisHex(ctx, L.c.x, L.c.y, DHS.tw(tau, 0, IRIS, E.bezier(0.55, 0, 0.2, 1)), env.W, env.H, idx % 2 ? -1 : 1); },
    ring(ctx, tau, env) { const L = A.layout(env.W, env.H, idx); S.irisRing(ctx, L.c.x, L.c.y, DHS.tw(tau, 0, IRIS, E.bezier(0.55, 0, 0.2, 1)), env.W, env.H, idx % 2 ? -1 : 1, C.textOn(a.color) === cfg().colors.ink ? cfg().colors.ink : '#ffffff'); },
    draw(ctx, tau, env) { A.draw(ctx, a, idx, tau, env, dur); },
    cues(add) {
      add(-0.2, 'whoosh', { dur: 0.72, pan: idx % 2 ? 0.35 : -0.35 });
      HEX_T.forEach((t, j) => add(t, 'pop', { note: (idx + j * 2) % 7, gain: 0.55 }));
      CHIP_T.forEach((t, j) => add(t + 0.22, 'tick', { gain: 0.5, pitch: j }));
    },
  });

  A.draw = (ctx, a, idx, tau, env, dur) => {
    const c = cfg(); const { W, H } = env; const L = A.layout(W, H, idx);
    const fg = C.textOn(a.color); const isInk = fg === c.colors.ink;
    const white = c.colors.white;
    // Outgoing push (anticipation into the next iris)
    const out = E.inCubic(inv(dur, dur + IRIS, tau));
    ctx.save();
    if (out > 0) { const s = 1 + 0.08 * out; ctx.translate(L.c.x, L.c.y); ctx.scale(s, s); ctx.translate(-L.c.x, -L.c.y); }

    S.wash(ctx, W, H, a.color, L.c.x, L.c.y);
    DHS.motifs[a.motif](ctx, env, L, tau, fg, a);

    // ---- badge
    const bp = inv(0.06, 0.8, tau);
    const br = L.r * E.spring(bp);
    // orbit ring draws on
    const ringP = E.glide(inv(0.3, 1.5, tau));
    if (ringP > 0) {
      ctx.save(); ctx.strokeStyle = C.rgba(fg, 0.55); ctx.lineWidth = 4; ctx.lineCap = 'round';
      const dirn = idx % 2 ? -1 : 1, gapA = 0.3, a0 = -Math.PI / 2 + dirn * gapA; // gap sits under the hat
      ctx.beginPath(); ctx.arc(L.c.x, L.c.y, L.r + 26, a0, a0 + dirn * (TAU - 2 * gapA) * ringP, dirn < 0); ctx.stroke(); ctx.restore();
    }
    if (br > 0) { D.circle(ctx, L.c.x, L.c.y, br); ctx.fillStyle = white; ctx.fill(); }
    // hat emblem above
    const hp = E.spring(inv(0.35, 1.0, tau));
    if (hp > 0) D.hat(ctx, L.c.x, L.c.y - L.r - (L.V ? 44 : 52), 46 * hp, fg, a.color);
    // three pathway hexes
    const ho = hexOffsets(L.r);
    const iconCol = isInk ? c.colors.ink : white;
    ho.pos.forEach(([dx, dy], j) => {
      const q = inv(HEX_T[j] - 0.12, HEX_T[j] + 0.6, tau);
      if (q <= 0) return;
      const s = E.spring(q);
      const bob = Math.sin(tau * 1.6 + j * 2.1) * 4 * inv(1.2, 2, tau);
      const x = L.c.x + dx, y = L.c.y + dy + bob;
      D.hexPath(ctx, x, y, ho.h * s, -Math.PI / 2 + (1 - s) * (j % 2 ? 1 : -1) * 1.1);
      ctx.fillStyle = a.color; ctx.fill();
      DHS.icons.draw(ctx, a.pathways[j].icon, x, y, ho.h * 0.5 * s, iconCol, inv(HEX_T[j] + 0.05, HEX_T[j] + 0.9, tau), tau);
    });

    // ---- campus cue under badge
    const cv = S.vis(tau, 1.0, null);
    if (cv.on) {
      const campus = c.campuses[a.campus].label;
      T.set(ctx, 'text', 32); const tw = ctx.measureText(campus).width;
      const cy = L.c.y + L.r + (L.V ? 64 : 76), cx0 = L.c.x - (tw + 44) / 2;
      ctx.save(); ctx.globalAlpha = E.outCubic(cv.pin); ctx.translate(0, (1 - cv.pin) * 18);
      D.pin(ctx, cx0 + 14, cy - 12, 17, fg, a.color);
      ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.fillText(campus, cx0 + 44, cy);
      ctx.restore();
    }

    // ---- kicker + hero name
    const spec = { x: L.col.x, y: L.col.top, maxW: L.col.w, lead: c.copy.academyKicker, leadSize: 34, lines: a.nameLines, maxSize: L.V ? 118 : 118, color: fg, tIn: 0.2, lh: 0.97, stagger: 0.07 };
    const m = S.stack(ctx, spec, tau);
    if (a.flourish) {
      const fv = S.vis(tau, 0.55, null);
      if (fv.on) {
        T.set(ctx, 'text', m.leadSize); const kw = ctx.measureText(spec.lead).width;
        T.roll(ctx, a.flourish, L.col.x + kw + 24, L.col.top + m.leadSize * 0.66, 30, Math.max(0, tau - 0.55), 1.25, fg, C.rgba(fg, 0.9), E.outCubic(fv.pin));
      }
    }

    // ---- pathway chips (subordinate), attached to the badge by drawn paths
    const nameBottom = L.col.top + m.leadH + m.heroH + m.size * 0.1;
    const chipH = L.V ? 76 : 80, gap = L.V ? 14 : 18;
    const chip0 = Math.max(L.V ? nameBottom + 50 : 646, nameBottom + (L.V ? 50 : 62));
    const fs = Math.min(38, T.fit(ctx, a.pathways.map((p) => p.name), 'text', L.col.w - 118, 38));
    T.set(ctx, 'text', fs);
    const cw = Math.max(...a.pathways.map((p) => ctx.measureText(p.name).width)) + 124; // uniform chip width → tidy column
    const rows = a.pathways.map((p, j) => ({ p, j, t0: CHIP_T[j], cy: chip0 + j * (chipH + gap) + chipH / 2 }));
    const cx = L.col.x;
    // 1) branching paths (under the chips)
    if (!L.V) rows.forEach(({ j, t0, cy }) => {
      const anchor = L.side === 'right' ? [cx + cw + 10, cy] : [cx - 10, cy];
      const dir = Math.atan2(anchor[1] - L.c.y, anchor[0] - L.c.x);
      const rim = [L.c.x + Math.cos(dir) * (L.r + 26), L.c.y + Math.sin(dir) * (L.r + 26)];
      const lp = E.outCubic(inv(t0 - 0.05, t0 + 0.42, tau));
      if (lp <= 0) return;
      const k = L.side === 'right' ? 1 : -1;
      const pts = D.bezierPts(rim, [rim[0] + Math.cos(dir) * 90, rim[1] + Math.sin(dir) * 90], [anchor[0] + k * 150, anchor[1]], anchor, 36);
      ctx.save(); ctx.strokeStyle = C.rgba(fg, 0.85); ctx.lineWidth = 5; ctx.lineCap = 'round'; D.strokePartial(ctx, pts, lp); ctx.restore();
      D.circle(ctx, rim[0], rim[1], 8 * E.spring(inv(t0 - 0.1, t0 + 0.3, tau))); ctx.fillStyle = fg; ctx.fill();
    });
    // 2) chips grow out of their hex bullets
    rows.forEach(({ p, t0, cy }) => {
      const q = inv(t0 + 0.2, t0 + 0.75, tau);
      if (q <= 0) return;
      const grow = E.swift(q);
      const w = lerp(chipH, cw, grow);
      const x = cx;
      ctx.save();
      D.pill(ctx, x, cy - chipH / 2, w, chipH); ctx.fillStyle = white; ctx.fill(); ctx.clip();
      ctx.fillStyle = c.colors.ink; ctx.textAlign = 'left';
      T.set(ctx, 'text', fs); ctx.fillText(p.name, cx + 92 + (1 - grow) * -40, cy + fs * 0.36);
      ctx.restore();
      const bs = E.spring(inv(t0 + 0.15, t0 + 0.7, tau));
      D.hexPath(ctx, cx + chipH / 2, cy, 31 * bs); ctx.fillStyle = a.color; ctx.fill();
      DHS.icons.draw(ctx, p.icon, cx + chipH / 2, cy, 16 * bs, iconCol, 1, tau, 0.15);
    });
    ctx.restore(); // end push

    A.footer(ctx, env, a, idx, fg, tau);
  };

  // Persistent footer: school + core message + 7-step progress
  A.footer = (ctx, env, a, idx, fg, tau) => {
    const c = cfg(); const { W, H } = env; const V = H > W;
    const n = c.academies.length;
    const fv = DHS.tw(tau, 0.15, 0.7, E.outCubic);
    ctx.save();
    T.set(ctx, 'text', 30); ctx.fillStyle = fg;
    const y = V ? H - 60 : 1034;
    if (V) {
      ctx.textAlign = 'center'; ctx.fillText(c.copy.footerLeft, W / 2, y - 48); ctx.fillText(c.copy.footerRight, W / 2, y);
    } else {
      ctx.textAlign = 'left'; ctx.fillText(c.copy.footerLeft, 110, y);
      ctx.textAlign = 'right'; ctx.fillText(c.copy.footerRight, W - 110, y);
    }
    // progress: seven dots, current one grows into a small hex
    const cx = W / 2, dy = V ? y - 100 : y - 11, sp = 34;
    for (let i = 0; i < n; i++) {
      const x = cx + (i - (n - 1) / 2) * sp;
      if (i === idx) { D.hexPath(ctx, x, dy, lerp(6, 13, fv)); ctx.fillStyle = fg; ctx.fill(); }
      else { D.circle(ctx, x, dy, 5.5); ctx.fillStyle = C.rgba(fg, 0.5); ctx.fill(); }
    }
    ctx.restore();
  };
})(globalThis);
