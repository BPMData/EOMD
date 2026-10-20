/* CARD SCENE — the starter's one scene type: full-bleed color, a badge with three
   icon hexes popping on the beat, a kicker/headline/sub text stack, hex-iris transition.
   Copy this file to make new scene types. Everything is a function of tau (scene time). */
(function (G) {
  'use strict';
  const DHS = G.DHS, S = DHS.common, E = DHS.ease, D = DHS.draw, C = DHS.color, TAU = Math.PI * 2;
  const IRIS = 0.62, irisE = E.bezier(0.55, 0, 0.2, 1);
  const layout = (W, H, i) => H > W
    ? { c: { x: W / 2, y: H * 0.3 }, r: W * 0.27, text: { x: 90, y: H * 0.64, maxW: W - 180, anchor: 'center' } }
    : { c: { x: i % 2 ? W * 0.74 : W * 0.26, y: H * 0.47 }, r: H * 0.26, text: { x: i % 2 ? 130 : W * 0.5, y: H * 0.47, maxW: W * 0.42, anchor: 'center' } };
  DHS.cardScene = { scene(sec, i, start, dur) {
    const beat = DHS.film.beat, HEX_T = [beat, beat * 1.5, beat * 2];
    return { name: 'card:' + sec.id, start, dur, tail: IRIS + 0.02, layer: 1, transIn: IRIS,
      clip(ctx, tau, env) { const L = layout(env.W, env.H, i); S.irisHex(ctx, L.c.x, L.c.y, DHS.tw(tau, 0, IRIS, irisE), env.W, env.H, i % 2 ? -1 : 1); },
      ring(ctx, tau, env) { const L = layout(env.W, env.H, i); S.irisRing(ctx, L.c.x, L.c.y, DHS.tw(tau, 0, IRIS, irisE), env.W, env.H, i % 2 ? -1 : 1, '#FFFFFF'); },
      cues(cue) { cue(0, 'whoosh', { dur: 0.7 }); HEX_T.forEach((t, k) => cue(t, 'pop', { note: (i + k) % 7 })); },
      draw(ctx, tau, env) {
        const { W, H } = env, L = layout(W, H, i), fg = C.textOn(sec.color), push = 1 + 0.08 * DHS.tw(tau, dur - 0.1, dur + IRIS, E.swift);
        S.wash(ctx, W, H, sec.color, L.c.x, L.c.y);
        ctx.save(); ctx.translate(L.c.x, L.c.y); ctx.scale(push, push); ctx.translate(-L.c.x, -L.c.y);
        const pd = E.spring(DHS.tw(tau, 0.15, 0.9, (x) => x));
        D.circle(ctx, L.c.x, L.c.y, L.r * pd); ctx.fillStyle = '#FFFFFF'; ctx.fill();
        const hr = L.r * 0.34;
        [-90, 150, 30].forEach((deg, k) => {
          const p = E.spring(DHS.tw(tau, HEX_T[k], HEX_T[k] + 0.6, (x) => x)); if (p <= 0) return;
          const a = (deg * TAU) / 360, x = L.c.x + Math.cos(a) * hr * 1.02, y = L.c.y + Math.sin(a) * hr * 1.02;
          D.hexPath(ctx, x, y, hr * p); ctx.fillStyle = sec.color; ctx.fill();
          if (sec.icons && sec.icons[k]) DHS.icons.draw(ctx, sec.icons[k], x, y, hr * 0.5 * p, fg, DHS.math.inv(HEX_T[k] + 0.05, HEX_T[k] + 0.9, tau), tau);
        });
        ctx.restore();
        S.stack(ctx, { x: L.text.x, y: L.text.y, maxW: L.text.maxW, lead: sec.kicker, leadSize: 40, lines: sec.lines, maxSize: 120, sub: sec.sub, subSize: 38,
          color: fg, anchor: 'center', tIn: 0.35, tOut: dur - 0.45 }, tau);
        // footer
        ctx.save(); DHS.type.set(ctx, 'text', 30); ctx.fillStyle = fg; ctx.textBaseline = 'alphabetic';
        const f = DHS.config.footer; ctx.textAlign = 'left'; ctx.fillText(f.left, 90, H - 60); ctx.textAlign = 'right'; ctx.fillText(f.right, W - 90, H - 60); ctx.restore();
      },
    };
  } };
})(globalThis);
