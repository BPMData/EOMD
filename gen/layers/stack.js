/* layer "stack": several layers in one shot, each on its own canvas, composited bottom to top with a
   blend mode. This is how text goes over visuals:
     { "layer": "stack", "params": { "layers": [
         { "layer": "tunnel" },
         { "layer": "type", "blend": "source-over", "params": { "backdrop": 0, "script": [...] } } ] } }
   Child fields: layer, params, blend (any canvas composite: source-over, screen, multiply, overlay,
   difference, lighter ...), alpha (0..1), palette (overrides). */
(function (G) {
  'use strict';
  const C = G.core;

  G.layers.stack = {
    about: 'Composites several layers in one shot (bottom first) with blend modes; e.g. kinetic type over a tunnel.',
    warm: 3,
    knobs: {
      layers: [{ layer: 'contour' }, { layer: 'type', blend: 'source-over', params: { backdrop: 0 } }],
    },
    // plain-English explanation of each knob, shown under it in the KNOBS panel (common ones: GEN.knobHelp)
    help: {
      layers: "The layers in this shot, bottom first. Each one: layer, params, blend (screen, multiply, overlay ...), alpha.",
    },
    init(P, E) {
      const kids = [];
      (Array.isArray(P.layers) ? P.layers : []).forEach((k, i) => {
        const L = G.layers[k && k.layer];
        if (!L || L === G.layers.stack) return;
        const pal = C.merge(E.pal, k.palette);
        const KE = Object.create(E);                     // inherits the clock, beat and helpers
        KE.pal = pal; KE.seed = (E.seed + (i + 1) * 977) >>> 0; KE.rng = C.rng(KE.seed);
        KE.fade = (c, dt, trail) => {
          const a = trail <= 0 ? 1 : 1 - Math.pow(C.clamp(trail, 0, 0.995), dt * 60);
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
          c.fillStyle = a >= 1 ? pal.bg : C.rgba(pal.bg, a); c.fillRect(0, 0, E.w, E.h);
        };
        const cv = E.make(E.w, E.h), c = cv.getContext('2d');
        const params = C.merge(G.knobDefaults(L), k.params);
        kids.push({ L, KE, cv, c, state: L.init ? L.init(params, KE) : {}, blend: k.blend || 'source-over', alpha: k.alpha == null ? 1 : +k.alpha });
      });
      return { kids };
    },
    frame(ctx, S, t, dt, E) {
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.fillStyle = E.pal.bg; ctx.fillRect(0, 0, E.w, E.h);
      for (const k of S.kids) {
        k.c.save(); k.L.frame(k.c, k.state, t, dt, k.KE); k.c.restore();
        ctx.globalCompositeOperation = k.blend; ctx.globalAlpha = C.clamp(k.alpha);
        ctx.drawImage(k.cv, 0, 0);
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    },
    stats(S, t, E) {
      for (let i = S.kids.length - 1; i >= 0; i--) { const k = S.kids[i]; if (k.L.stats) return k.L.stats(k.state, t, k.KE); }
      return 'STACK ' + S.kids.length;
    },
  };
})(globalThis.GEN = globalThis.GEN || {});
