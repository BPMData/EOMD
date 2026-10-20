/* layer "julia": an animated Julia set, computed on the CPU at low resolution and scaled up
   (pixelated by default, which suits a retro look; set pixel 0 for smooth). c travels a circle,
   so the shape keeps folding. Cost ~ res x res*9/16 x iter per frame: keep res modest on old PCs. */
(function (G) {
  'use strict';
  const C = G.core;

  G.layers.julia = {
    about: 'Animated Julia set fractal at low resolution, upscaled; c orbits a circle so the shape keeps folding.',
    knobs: {
      res: [300, 80, 720, 10],
      iter: [64, 16, 220, 1],
      radius: [0.7885, 0.3, 1, 0.0005],
      speed: [0.05, 0, 0.5, 0.005],
      zoom: [1, 0.3, 6, 0.01],
      breathe: [0.12, 0, 0.6, 0.01],
      glow: [0.55, 0.15, 1.5, 0.01],
      bands: [4, 1, 16, 0.5],
      flow: [0.15, 0, 2, 0.01],
      pixel: [1, 0, 1, 1],
      seed: [0, 0, 999, 1],
    },
    // plain-English explanation of each knob, shown under it in the KNOBS panel (common ones: GEN.knobHelp)
    help: {
      res: "Pixel resolution. Lower = chunkier pixels and faster.",
      iter: "Detail at the edge of the shape. Higher = finer filaments (and slower).",
      radius: "Which fractal you get. Tiny changes give very different shapes; 0.7885 is a classic.",
      speed: "How fast the shape folds and changes.",
      zoom: "Zooms in on the center.",
      breathe: "Slow zooming in and out.",
      glow: "Lower = the glow spreads further out from the shape.",
      bands: "Number of color ripples around the shape.",
      flow: "How fast the ripples move outward.",
      pixel: "On = hard retro pixels. Off = smoothed.",
    },
    init(P, E) {
      const rw = Math.round(P.res), rh = Math.max(2, Math.round(rw * E.h / E.w));
      const cv = E.make(rw, rh), c = cv.getContext('2d');
      return { P, rw, rh, cv, c, img: c.createImageData(rw, rh), ph: (P.seed | 0) * 0.37 };
    },
    frame(ctx, S, t, dt, E) {
      const P = S.P, rw = S.rw, rh = S.rh, d = S.img.data, N = Math.round(P.iter);
      const a = S.ph + t * P.speed, cr = P.radius * Math.cos(a), ci = P.radius * Math.sin(a);
      const zoom = P.zoom * (1 + P.breathe * Math.sin(t * 0.21)), sc = 3.2 / (zoom * rh);
      const bg = C.rgb(E.pal.bg), stops = [E.pal.bg, E.pal.dim, E.pal.accent, E.pal.ink];
      const lut = [];                                 // 256-step gradient through the palette
      for (let k = 0; k < 256; k++) { const f = k / 256 * (stops.length - 1), i = Math.floor(f); lut.push(C.mixArr(stops[i], stops[Math.min(i + 1, stops.length - 1)], f - i)); }
      const shift = t * P.flow, LN2 = Math.log(2);
      let p = 0, inside = 0;
      for (let y = 0; y < rh; y++) {
        const y0 = (y - rh / 2) * sc;
        for (let x = 0; x < rw; x++) {
          let zr = (x - rw / 2) * sc, zi = y0, n = 0, r2 = zr * zr + zi * zi;
          while (r2 < 16 && n < N) { const tr = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = tr; r2 = zr * zr + zi * zi; n++; }
          let col;
          if (n >= N) { col = bg; inside++; }
          else {
            const nu = Math.max(0, n + 1 - Math.log(Math.log(r2) / 2 / LN2) / LN2);   // smooth escape count
            // far from the set = background, close to it = bright; bands ripple outward
            const g = Math.pow(nu / N, P.glow) * (1 + 0.18 * Math.sin(C.TAU * (nu / N * P.bands - shift)));
            col = lut[Math.min(255, (g * 255) | 0)];
          }
          d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2]; d[p + 3] = 255; p += 4;
        }
      }
      S.c.putImageData(S.img, 0, 0);
      ctx.imageSmoothingEnabled = !P.pixel;
      ctx.drawImage(S.cv, 0, 0, E.w, E.h);
      S.cr = cr; S.ci = ci; S.inside = inside;
    },
    stats(S) {
      const im = S.ci || 0;
      return 'JULIA C = ' + (S.cr || 0).toFixed(3) + (im < 0 ? ' − ' : ' + ') + Math.abs(im).toFixed(3) + 'I  ·  ITER ' + Math.round(S.P.iter) + '  ·  ' + S.rw + '×' + S.rh;
    },
  };
})(globalThis.GEN = globalThis.GEN || {});
