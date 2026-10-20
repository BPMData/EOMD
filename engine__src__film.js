/* Film assembly. Everything is derived from config: bar grid → scene times →
   audio cues. render(ctx, t) is a pure function of t (seekable, reproducible). */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const F = (DHS.film = {});

  F.build = () => {
    const c = DHS.config, bar = (60 / c.film.bpm) * c.film.beatsPerBar, L = bar * c.film.bars, tl = new DHS.Timeline(L);
    F.tl = tl; F.length = L; F.bar = bar; F.beat = bar / c.film.beatsPerBar;
    let b0 = 0;
    c.sections.forEach((sec, i) => { const sc = DHS.cardScene.scene(sec, i, b0 * bar, sec.bars * bar); tl.add(sc); sc.cues && sc.cues((tau, type, p) => tl.cue(sc.start + tau, type, p)); b0 += sec.bars; });
    tl.cues.sort((x, y) => x.t - y.t);
    return tl;
  };
  F.sections = () => { let b0 = 0; return DHS.config.sections.map((s) => { const o = { id: s.id, label: s.id, t0: b0 * F.bar, t1: (b0 + s.bars) * F.bar }; b0 += s.bars; return o; }); };

  // W,H = design size (1920×1080 or 1080×1920); scale = device pixels per design pixel
  F.render = (ctx, t, W, H, scale = 1) => {
    if (!F.tl) F.build();
    t = DHS.math.mod(t, F.length);
    const env = { W, H, t };
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillStyle = DHS.config.colors.bg; ctx.fillRect(0, 0, W, H);
    for (const { s, tau } of F.tl.active(t)) {
      if (s.transIn && tau < s.transIn && s.clip) {
        ctx.save(); s.clip(ctx, tau, env); ctx.clip(); s.draw(ctx, tau, env); ctx.restore();
        if (s.ring) s.ring(ctx, tau, env);
      } else {
        ctx.save(); s.draw(ctx, tau, env); ctx.restore();
      }
    }
    ctx.restore();
  };
})(globalThis);
