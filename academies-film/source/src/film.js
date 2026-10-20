/* Film assembly. Everything is derived from config: bar grid → scene times →
   audio cues. render(ctx, t) is a pure function of t (seekable, reproducible). */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const F = (DHS.film = {});

  F.build = () => {
    const c = DHS.config;
    const bar = (60 / c.film.bpm) * c.film.beatsPerBar;
    const L = bar * c.film.bars;
    const tl = new DHS.Timeline(L);
    const sec = c.sections;
    const add = (scene) => { tl.add(scene); scene.cues && scene.cues((tau, type, p) => tl.cue(scene.start + tau, type, p)); };
    add(DHS.hub.scene(sec.hub.startBar * bar));
    add(DHS.explorationScene.scene(sec.exploration.startBar * bar, sec.exploration.bars * bar));
    c.academies.forEach((a, i) => {
      const start = (sec.academies.startBar + i * sec.academies.barsEach) * bar;
      add(DHS.academyScene.scene(a, i, start, sec.academies.barsEach * bar));
    });
    tl.cues.sort((a, b) => a.t - b.t);
    F.tl = tl; F.length = L; F.bar = bar; F.beat = bar / c.film.beatsPerBar;
    return tl;
  };

  // Section map (for dev UI + audio arrangement)
  F.sections = () => {
    const c = DHS.config, bar = F.bar, s = c.sections;
    const out = [{ id: 'hub-title', label: 'Title (spiral)', t0: 0, t1: 2 * bar }, { id: 'exploration', label: 'Exploration Academy', t0: s.exploration.startBar * bar, t1: (s.exploration.startBar + s.exploration.bars) * bar }];
    c.academies.forEach((a, i) => out.push({ id: a.id, label: a.name, t0: (s.academies.startBar + i * 2) * bar, t1: (s.academies.startBar + i * 2 + 2) * bar }));
    out.push({ id: 'end', label: 'End card', t0: s.hub.startBar * bar, t1: (s.hub.startBar + 3) * bar }, { id: 'rewind', label: 'Rewind → title', t0: (s.hub.startBar + 3) * bar, t1: F.length });
    return out;
  };

  // W,H = design size (1920×1080 or 1080×1920); scale = device pixels per design pixel
  F.render = (ctx, t, W, H, scale = 1) => {
    if (!F.tl) F.build();
    t = DHS.math.mod(t, F.length);
    const env = { W, H, t };
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillStyle = DHS.config.colors.danburyBlue; ctx.fillRect(0, 0, W, H);
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
