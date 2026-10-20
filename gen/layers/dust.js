/* layer "dust": packed-powder letters burst into coloured dust (a top-down slow-motion drop) and, played
   backward, dust coalesces into crisp letters (the reversed-footage trick from the ALT VFX / Semi-Permanent
   title cards). One physics sim per letter is baked in init: warped-Voronoi fracture -> chunk impulse ->
   splash toward the camera, drag, gravity on height, Brownian jostle, curl-noise swirl, wind.
   Playback is a pure function of t (forward = burst, backward = coalesce), so seeking is free.
   Cost: init bakes grains x 30 fps x burst seconds (about 0.1-0.3 s at 3000 grains); every knob change re-bakes.
   Font: the `font` knob (default GenDisplay = build.py's DISPLAY_FONT, e.g. Montserrat Bold). */
(function (G) {
  'use strict';
  const C = G.core;
  const SHADES = [0.42, 0.58, 0.72, 0.86, 1.0, 1.12], NSOFT = 5, NSH = SHADES.length, NB = 16, STAGES = 6;
  const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
  const sm = (a, b, x) => { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const mulberry = (seed) => { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const hex = (h) => {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(h).trim());
    if (!m) { const a = C.rgb(h); return [a[0], a[1], a[2]]; }
    let s = m[1]; if (s.length === 3) s = s.replace(/./g, '$&$&');
    return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
  };
  const mixA = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const css = (c, a) => `rgba(${c.map((v) => Math.round(clamp(v, 0, 255))).join(',')},${a})`;
  // easing at the turn-around: linear, then slows to a stop (forward) / starts gently (backward)
  const HA = 0.8, hk = (u) => u < HA ? u : HA + (u - HA) - (u - HA) * (u - HA) / (2 * (1 - HA)), HPK = hk(1);
  const fwd = (u) => hk(clamp(u, 0, 1)) / HPK, rev = (u) => hk(1 - clamp(u, 0, 1)) / HPK;

  G.layers.dust = {
    about: 'Letters burst into coloured powder (top-down slow motion) and dust coalesces back into crisp letters.',
    knobs: {
      word: 'DUST',
      mode: { options: ['both', 'explode', 'assemble'], value: 'both' },
      grains: [3000, 500, 6000, 100],
      size: [340, 80, 600, 5],
      font: "GenDisplay, 'Helvetica Neue', Arial, sans-serif",
      weight: [700, 100, 900, 100],
      track: [0.03, -0.1, 0.4, 0.01],
      colors: '',
      hold: [1.8, 0, 6, 0.1],
      crack: [0.45, 0, 2, 0.05],
      stagger: [0.16, 0, 1, 0.01],
      burst: [3.8, 1, 8, 0.1],
      slow: [1.35, 0.5, 3, 0.05],
      chunks: [13, 3, 30, 1],
      impulse: [330, 0, 900, 10],
      fan: [1.3, 0, 3.1, 0.05],
      spread: [1.3, 0, 4, 0.05],
      jitter: [80, 0, 300, 5],
      diffuse: [110, 0, 400, 5],
      splash: [520, 0, 1500, 10],
      gravity: [900, 0, 3000, 50],
      drag: [1.15, 0.1, 5, 0.05],
      floor: [0.45, 0, 4, 0.05],
      swirl: [230, 0, 800, 10],
      swirlScale: [0.0045, 0.001, 0.02, 0.0005],
      swirlSpeed: [0.45, 0, 2, 0.05],
      windX: [30, -200, 200, 5],
      windY: [-12, -200, 200, 5],
      grow: [8, 0, 20, 0.5],
      growRate: [1.1, 0.2, 4, 0.05],
      mix: [0.38, 0.05, 1, 0.01],
      persp: [0.0009, 0, 0.004, 0.0001],
      grit: [0.03, 0, 0.2, 0.005],
      res: [0.5, 0.25, 1, 0.05],
      glow: [0.24, 0, 1, 0.01],
      bokeh: [7, 0, 20, 1],
      vignette: [0.6, 0, 1, 0.05],
      trail: [0, 0, 0.95, 0.01],
      seed: [0, 0, 999, 1],
    },
    help: {
      word: "The word that bursts and re-forms (up to 14 characters; spaces leave gaps).",
      mode: "both = letters burst, then dust re-forms them; explode = burst only; assemble = dust re-forms only.",
      grains: "How many dust grains. More = finer powder but slower; 3000 runs well, 6000 needs a fast machine.",
      size: "Letter size in pixels at 1080p. Long words shrink to fit the screen.",
      font: "Font family list for the letters. GenDisplay is the font build.py embeds (DISPLAY_FONT).",
      weight: "Font weight. Heavier letters hold more powder and read better as dust.",
      track: "Space between letters, as a share of the letter size.",
      colors: "Dust colours as hex codes separated by commas (2 to 6). Empty = taken from the palette.",
      hold: "Seconds the clean letters stay on screen at the start and end of each loop.",
      crack: "Seconds for the cracks to spread across a letter before it bursts (and to heal after it re-forms).",
      stagger: "Seconds between one letter and the next, left to right, in both directions.",
      burst: "Seconds of simulated burst. Longer = the cloud travels further before it turns around.",
      slow: "How much slower the re-forming plays than the burst. 1 = same speed; higher = slow-motion coalesce.",
      chunks: "How many pieces each letter cracks into. Few = big clumps; many = finer break-up.",
      impulse: "How hard the pieces are thrown outward across the floor when a letter lands.",
      fan: "How much each piece's direction is randomised. Higher = pieces cross paths and the colours mix.",
      spread: "How fast each piece loses its own shape. Higher = clumps melt into haze sooner.",
      jitter: "Random speed each grain gets at impact. Higher = fuzzier edges from the start.",
      diffuse: "Ongoing random jostle of every grain. Higher = blob edges dissolve; 0 = clumps stay crisp.",
      splash: "How hard powder is thrown up toward the camera. Higher = bigger, closer puffs at the centre.",
      gravity: "Pulls the splashed powder back down to the floor. Lower = puffs hang in the air longer.",
      drag: "Air drag. Lower = the cloud keeps travelling across the screen; higher = it stops close to the letter.",
      floor: "Extra friction for powder sliding on the floor.",
      swirl: "Strength of the swirling air that makes the dust billow. 0 = straight lines outward.",
      swirlScale: "Size of the swirls. Lower = big lazy eddies; higher = small tight curls.",
      swirlSpeed: "How fast the swirl pattern changes over time.",
      windX: "Steady sideways drift of the whole cloud (pixels per second; negative = to the left).",
      windY: "Steady up/down drift of the whole cloud (pixels per second; negative = up).",
      grow: "How large each puff grows as it spreads. Higher = puffs merge into one soft cloud.",
      growRate: "How quickly the puffs reach full size.",
      mix: "Puff opacity once fully spread. Lower = puffs melt together and the colours blend.",
      persp: "Depth effect: powder thrown toward the camera looks bigger and drifts outward.",
      grit: "Share of grains that are fast, tiny bright specks flying off the cloud.",
      res: "Resolution of the dust layer (share of the screen). Lower = faster and softer.",
      glow: "Soft spotlight behind the letters.",
      bokeh: "How many large out-of-focus light discs drift in the background.",
      vignette: "How dark the corners get.",
    },

    init(P, E) {
      const S = { P, vw: E.w / E.s, vh: E.h / E.s, nextCheck: 0 };
      S.font = (sz) => `${Math.round(P.weight)} ${sz}px ${P.font}`;
      S.word = [...String(P.word == null ? 'DUST' : P.word)].slice(0, 14).join('') || 'DUST';
      const D = typeof document !== 'undefined' ? document : null;
      S.fontWait = !!(D && D.fonts && D.fonts.check && !D.fonts.check(S.font(100), S.word));
      this.build(S, E);
      return S;
    },

    build(S, E) {
      const P = S.P, vw = S.vw, vh = S.vh, W = Math.max(1, Math.round(vw)), H = Math.max(1, Math.round(vh));
      const R = mulberry(E.seed * 31 + 5);
      // colours
      let cols = String(P.colors || '').split(',').map((s) => s.trim()).filter((s) => /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)).slice(0, 6).map(hex);
      if (cols.length < 2) { const ink = hex(E.pal.ink), ac = hex(E.pal.accent), dm = hex(E.pal.dim); cols = [ink, ac, mixA(ac, ink, 0.45), mixA(ac, dm, 0.5)]; }
      S.cols = cols; S.nc = cols.length;
      // sprites: colour x softness (0 packed ball .. 4 loose smoke) x shade
      const SZ = 64; S.spr = [];
      cols.forEach((c) => { for (let q = 0; q < NSOFT; q++) { const m = q / (NSOFT - 1); SHADES.forEach((s0) => {
        const s = s0 + (0.8 - s0) * 0.45 * m, cv = E.make(SZ, SZ), g = cv.getContext('2d');
        const hx = SZ * (0.4 + 0.1 * m), gr = g.createRadialGradient(hx, hx, 0, SZ / 2, SZ / 2, SZ / 2);
        gr.addColorStop(0, css(c.map((v) => v * s * (1.12 - 0.1 * m)), 1)); gr.addColorStop(0.45 - 0.15 * m, css(c.map((v) => v * s), 0.92 - 0.2 * m));
        gr.addColorStop(0.75 - 0.1 * m, css(c.map((v) => v * s * (0.82 + 0.1 * m)), 0.45 - 0.15 * m)); gr.addColorStop(1, css(c.map((v) => v * s * 0.75), 0));
        g.fillStyle = gr; g.fillRect(0, 0, SZ, SZ); S.spr.push(cv); }); } });
      S.shadow = E.make(SZ, SZ); { const g = S.shadow.getContext('2d'), gr = g.createRadialGradient(SZ / 2, SZ / 2, 0, SZ / 2, SZ / 2, SZ / 2), b = hex(E.pal.bg).map((v) => v * 0.3);
        gr.addColorStop(0, css(b, 0.75)); gr.addColorStop(0.6, css(b, 0.35)); gr.addColorStop(1, css(b, 0)); g.fillStyle = gr; g.fillRect(0, 0, SZ, SZ); }
      S.bok = E.make(128, 128); { const g = S.bok.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64), a = mixA(hex(E.pal.accent), hex(E.pal.bg), 0.35);
        gr.addColorStop(0, css(a, 0.55)); gr.addColorStop(0.82, css(a, 0.7)); gr.addColorStop(0.93, css(a, 0.45)); gr.addColorStop(1, css(a, 0)); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }

      // layout + mask
      const m = E.make(W, H), g = m.getContext('2d', { willReadFrequently: true });
      const chars = [...S.word]; let size = P.size, ws = [], total = 0;
      const measure = () => { g.font = S.font(size); ws = chars.map((c) => g.measureText(c).width || 0); total = ws.reduce((a, b) => a + b, 0) + P.track * size * (chars.length - 1); };
      measure(); if (total > vw * 0.86) { size *= vw * 0.86 / total; measure(); }
      const capM = g.measureText('H'), capH = (capM && capM.actualBoundingBoxAscent) || size * 0.7, base = vh / 2 + capH / 2;
      let x = vw / 2 - total / 2;
      let LET = chars.map((c, i) => { const L = { c, i, x, adv: ws[i], base, size }; x += ws[i] + P.track * size; return L; });
      g.fillStyle = '#fff'; g.textBaseline = 'alphabetic'; g.font = S.font(size);
      LET.forEach((L) => g.fillText(L.c, L.x, L.base));
      let im = null; try { im = g.getImageData(0, 0, W, H).data; } catch (e) { im = null; }
      const N = W * H, mask = new Uint8Array(N), own = new Int8Array(N).fill(-1), chunk = new Int8Array(N).fill(-1), colOwn = new Int8Array(W);
      for (let px = 0; px < W; px++) { let o = 0; for (let i = 0; i < LET.length - 1; i++) { const b = (LET[i].x + LET[i].adv + LET[i + 1].x) / 2; if (px > b) o = i + 1; } colOwn[px] = o; }
      LET.forEach((L) => { L.x0 = 1e9; L.y0 = 1e9; L.x1 = -1; L.y1 = -1; });
      if (im && im.length >= N * 4) for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) { const k = y * W + xx; if (im[k * 4 + 3] > 127) { mask[k] = 1; const o = colOwn[xx]; own[k] = o; const L = LET[o];
        if (xx < L.x0) L.x0 = xx; if (xx > L.x1) L.x1 = xx; if (y < L.y0) L.y0 = y; if (y > L.y1) L.y1 = y; } }
      LET = LET.filter((L) => L.x1 >= 0);
      const remap = new Int8Array(Math.max(1, chars.length)).fill(-1); LET.forEach((L, i) => { remap[L.i] = i; L.i = i; });
      for (let k = 0; k < N; k++) if (own[k] >= 0) own[k] = remap[own[k]];
      const CH_N = Math.max(1, Math.round(P.chunks)); let area = 0;
      LET.forEach((L) => {
        L.w = L.x1 - L.x0 + 1; L.h = L.y1 - L.y0 + 1;
        L.orient = R() < 0.55 ? 1 : 0; L.split = 0.3 + 0.4 * R();
        L.cA = Math.floor(R() * S.nc); do { L.cB = Math.floor(R() * S.nc); } while (L.cB === L.cA);
        const seeds = []; let guard = 0;
        while (seeds.length < CH_N && guard++ < 20000) { const sx = L.x0 + Math.floor(R() * L.w), sy = L.y0 + Math.floor(R() * L.h), k = sy * W + sx; if (mask[k] && own[k] === L.i) seeds.push([sx, sy]); }
        if (!seeds.length) seeds.push([L.x0, L.y0]);
        const p1 = R() * 6.28, p2 = R() * 6.28, p3 = R() * 6.28, p4 = R() * 6.28;
        for (let y = L.y0; y <= L.y1; y++) for (let xx = L.x0; xx <= L.x1; xx++) { const k = y * W + xx; if (!mask[k] || own[k] !== L.i) continue; area++;
          const wx = xx + 7 * Math.sin(y * 0.11 + p1) + 3 * Math.sin(y * 0.37 + p2), wy = y + 7 * Math.sin(xx * 0.1 + p3) + 3 * Math.sin(xx * 0.41 + p4);
          let best = 0, bd = 1e18; for (let s = 0; s < seeds.length; s++) { const dx = wx - seeds[s][0], dy = wy - seeds[s][1], d = dx * dx + dy * dy; if (d < bd) { bd = d; best = s; } }
          chunk[k] = best; }
      });
      // grains on a jittered grid, grouped by letter
      const sp = Math.max(1.5, Math.sqrt(Math.max(1, area) / Math.max(100, P.grains)));
      const hx = [], hy = [], ci = [], sh = [], rr = [], gr = [], ch = [];
      LET.forEach((L) => { L.p0 = hx.length;
        for (let gy = L.y0; gy <= L.y1; gy += sp) for (let gx = L.x0; gx <= L.x1; gx += sp) {
          const px = gx + (R() - 0.5) * sp * 0.9, py = gy + (R() - 0.5) * sp * 0.9, xi = Math.round(px), yi = Math.round(py);
          if (xi < 0 || yi < 0 || xi >= W || yi >= H) continue; const k = yi * W + xi; if (!mask[k] || own[k] !== L.i) continue;
          const t = L.orient ? (py - L.y0) / L.h : (px - L.x0) / L.w;
          hx.push(px); hy.push(py); ci.push(t < L.split ? L.cA : L.cB); sh.push(R()); rr.push(R()); gr.push(R() < P.grit ? 1 : 0); ch.push(L.i * CH_N + chunk[k]); }
        L.p1 = hx.length;
        let sx = 0, sy = 0; for (let i = L.p0; i < L.p1; i++) { sx += hx[i]; sy += hy[i]; } const n = Math.max(1, L.p1 - L.p0); L.cx = sx / n; L.cy = sy / n;
        let r = 1; for (let i = L.p0; i < L.p1; i++) r = Math.max(r, Math.hypot(hx[i] - L.cx, hy[i] - L.cy)); L.R = r;
      });
      const M = hx.length;
      Object.assign(S, { LET, M, sp, CH_N, HX: Float32Array.from(hx), HY: Float32Array.from(hy), CI: Uint8Array.from(ci), SH: Float32Array.from(sh), RR: Float32Array.from(rr), GR: Uint8Array.from(gr), CH: Int16Array.from(ch) });
      // crack overlays: chunk borders, revealed outward from the impact point
      LET.forEach((L) => {
        L.cracks = [];
        const pts = [];
        for (let y = L.y0; y <= L.y1; y++) for (let xx = L.x0; xx <= L.x1; xx++) { const k = y * W + xx; if (!mask[k] || own[k] !== L.i) continue; const c = chunk[k];
          const a = xx + 1 < W && mask[k + 1] && own[k + 1] === L.i && chunk[k + 1] !== c, b = y + 1 < H && mask[k + W] && own[k + W] === L.i && chunk[k + W] !== c;
          if (a || b) { const h = Math.sin(xx * 12.9898 + y * 78.233) * 43758.5453; pts.push(xx - L.x0, y - L.y0, Math.hypot(xx - L.cx, y - L.cy) / L.R * (0.85 + 0.3 * (h - Math.floor(h)))); } }
        try {
          for (let s = 0; s < STAGES; s++) { const c = E.make(L.w, L.h), g2 = c.getContext('2d'), id = g2.createImageData(L.w, L.h), Dd = id.data, lim = (s + 1) / STAGES * 1.05;
            for (let j = 0; j < pts.length; j += 3) { if (pts[j + 2] > lim) continue; const px = pts[j], py = pts[j + 1];
              const o = (py * L.w + px) * 4; Dd[o] = 3; Dd[o + 1] = 9; Dd[o + 2] = 11; Dd[o + 3] = 235;
              if (px > 0 && py > 0) { const o2 = ((py - 1) * L.w + px - 1) * 4; if (Dd[o2 + 3] === 0) { Dd[o2] = 255; Dd[o2 + 1] = 255; Dd[o2 + 2] = 255; Dd[o2 + 3] = 60; } } }
            g2.putImageData(id, 0, 0); L.cracks.push(c); }
        } catch (e) { L.cracks = []; }
        // the clean letter at screen resolution, two colour bands
        const A = E.s, pad = 2, c = E.make(Math.ceil(L.w * A) + pad * 2, Math.ceil(L.h * A) + pad * 2), g3 = c.getContext('2d');
        g3.translate(pad, pad); g3.scale(A, A); g3.translate(-L.x0, -L.y0);
        if (L.orient) { const yS = L.y0 + L.h * L.split; g3.fillStyle = css(cols[L.cA], 1); g3.fillRect(L.x0 - 4, L.y0 - 4, L.w + 8, yS - L.y0 + 4); g3.fillStyle = css(cols[L.cB], 1); g3.fillRect(L.x0 - 4, yS, L.w + 8, L.y1 - yS + 5); }
        else { const xS = L.x0 + L.w * L.split; g3.fillStyle = css(cols[L.cA], 1); g3.fillRect(L.x0 - 4, L.y0 - 4, xS - L.x0 + 4, L.h + 8); g3.fillStyle = css(cols[L.cB], 1); g3.fillRect(xS, L.y0 - 4, L.x1 - xS + 5, L.h + 8); }
        g3.globalCompositeOperation = 'destination-in'; g3.fillStyle = '#fff'; g3.font = S.font(L.size); g3.textBaseline = 'alphabetic'; g3.fillText(L.c, L.x, L.base);
        L.art = c; L.pad = pad / A;
      });
      const RB = mulberry(E.seed * 7 + 3);
      S.bokehs = Array.from({ length: Math.round(P.bokeh) }, () => ({ x: RB() * vw, y: RB() * vh, r: 50 + RB() * 100, a: 0.05 + RB() * 0.08, ax: 20 + RB() * 40, ay: 10 + RB() * 25, w: 0.05 + RB() * 0.08, ph: RB() * 6.28 }));
      this.bake(S, E);
      S.dcv = E.make(Math.max(2, Math.round(vw * P.res)), Math.max(2, Math.round(vh * P.res))); S.dctx = S.dcv.getContext('2d');
      S.KX = new Float32Array(M); S.KY = new Float32Array(M); S.KR = new Float32Array(M); S.KA = new Float32Array(M); S.KH = new Float32Array(M);
      S.KB = new Uint8Array(M); S.KS = new Uint8Array(M); S.IDX = new Uint32Array(M); S.BC = new Uint32Array(NB + 1);
    },

    bake(S, E) {
      const P = S.P, M = S.M, R = mulberry(E.seed * 977 + 13), FPS = 30, SUB = 2, dt = 1 / (FPS * SUB);
      const F = S.F = Math.ceil(P.burst * FPS) + 1;
      const BX = S.BX = new Float32Array(F * M), BY = S.BY = new Float32Array(F * M), BZ = S.BZ = new Float32Array(F * M);
      const HX = S.HX, HY = S.HY, CH = S.CH, GR = S.GR, nC = Math.max(1, S.LET.length * S.CH_N);
      const CX = new Float32Array(nC), CY = new Float32Array(nC), CN = new Float32Array(nC), VX = new Float32Array(nC), VY = new Float32Array(nC), VZ = new Float32Array(nC);
      for (let i = 0; i < M; i++) { const c = CH[i]; CX[c] += HX[i]; CY[c] += HY[i]; CN[c]++; }
      S.LET.forEach((L) => { for (let k = 0; k < S.CH_N; k++) { const c = L.i * S.CH_N + k; if (!CN[c]) continue; CX[c] /= CN[c]; CY[c] /= CN[c];
        const dx = CX[c] - L.cx, dy = CY[c] - L.cy, d = Math.hypot(dx, dy), a = d < 1 ? R() * 6.283 : Math.atan2(dy, dx) + (R() - 0.5) * P.fan;
        const mag = P.impulse * (0.5 + 0.9 * R()) * (0.55 + 0.9 * d / L.R);
        VX[c] = Math.cos(a) * mag; VY[c] = Math.sin(a) * mag; VZ[c] = P.splash * (0.35 + 0.65 * R()) * (1 - 0.6 * clamp(d / L.R, 0, 1)); } });
      // curl noise from 5 plane waves: divergence-free, analytic, cheap
      const FR = [1, 1.7, 2.9, 4.6, 7.4], WT = [1, 0.85, 0.7, 0.55, 0.45], ws = WT.reduce((a, b) => a + b, 0) * 0.6;
      const T = FR.map((f, k) => { const th = R() * 6.283; return [Math.cos(th), Math.sin(th), P.swirlScale * f, WT[k] / ws, R() * 6.283, P.swirlSpeed * (0.6 + 0.8 * R()) * (k + 1) * 2]; });
      const gauss = () => (R() + R() + R() - 1.5) * 1.4;
      for (let i = 0; i < M; i++) {
        const c = CH[i], g = GR[i]; let x = HX[i], y = HY[i], z = 0;
        let vx = VX[c] + (x - CX[c]) * P.spread + gauss() * P.jitter, vy = VY[c] + (y - CY[c]) * P.spread + gauss() * P.jitter, vz = VZ[c] * (0.85 + 0.3 * R());
        if (g) { vx = vx * 2.4 + (R() - 0.5) * 300; vy = vy * 2.4 + (R() - 0.5) * 300; vz *= 0.6; }
        const drag = g ? 0.7 : P.drag, tu = g ? 0.3 : 1, dk = g ? 0 : P.diffuse * Math.sqrt(dt);
        for (let f = 0; f < F; f++) {
          const o = f * M + i; BX[o] = x; BY[o] = y; BZ[o] = z;
          for (let s = 0; s < SUB; s++) {
            const tau = (f * SUB + s) * dt, rw = sm(0.04, 0.6, tau), ramp = rw * P.swirl * tu;
            let ux = 0, uy = 0; for (let k = 0; k < 5; k++) { const w = T[k], cw = w[3] * Math.cos(w[2] * (w[0] * x + w[1] * y) + w[5] * tau + w[4]); ux += cw * w[1]; uy -= cw * w[0]; }
            vx += gauss() * dk * rw; vy += gauss() * dk * rw;
            x += (vx + ux * ramp + P.windX * rw) * dt; y += (vy + uy * ramp + P.windY * rw) * dt;
            z += vz * dt; vz -= P.gravity * dt; if (z < 0) { z = 0; vz = 0; }
            const dd = Math.exp(-(drag + (z <= 0 ? P.floor : 0)) * dt); vx *= dd; vy *= dd;
          }
        }
      }
    },

    period(S) {
      const P = S.P, span = Math.max(0, S.LET.length - 1) * P.stagger, md = P.mode && P.mode.value ? P.mode.value : P.mode;
      if (md === 'explode') return P.hold + P.crack + span + P.burst + 0.5 + 2.4 + P.hold * 0.5;
      if (md === 'assemble') return 0.2 + span + P.burst * P.slow + P.crack + P.hold + 1.2;
      return P.hold + P.crack + span + P.burst * (1 + P.slow) + P.crack + P.hold;
    },

    timeline(S, T) {
      const P = S.P, md = P.mode && P.mode.value ? P.mode.value : P.mode, Pd = Math.max(0.1, this.period(S)), t = ((T % Pd) + Pd) % Pd;
      const span = Math.max(0, S.LET.length - 1) * P.stagger, out = { L: [], dustA: 1, artA: 1, label: 'LETTERS' };
      const E1 = P.hold + P.crack + span + P.burst + 0.5, Z = 0.2 + span + P.burst * P.slow + P.crack + P.hold;
      if (md === 'explode') { out.dustA = 1 - sm(E1, E1 + 1.2, t); if (t > E1) out.artA = sm(E1 + 1.6, E1 + 2.4, t); }
      if (md === 'assemble') { out.dustA = sm(0, 0.6, t); out.artA = 1 - sm(Z, Z + 0.8, t); }
      let fwdOn = false, revOn = false, cr = false;
      S.LET.forEach((L, i) => { let p = 0, crack = 0; const o = i * P.stagger;
        if (md === 'explode') { const b = P.hold + P.crack + o; crack = sm(b - P.crack, b, t); if (t >= b) { p = fwd((t - b) / P.burst); fwdOn = true; } if (t > E1 + 1.2) { p = 0; crack = 0; fwdOn = false; } }
        else if (md === 'assemble') { const a = 0.2 + o, e = a + P.burst * P.slow; p = rev((t - a) / (P.burst * P.slow)); crack = t < e ? 1 : 1 - sm(e, e + P.crack, t); if (p > 0) revOn = true; }
        else { const b = P.hold + P.crack + o, tp = b + P.burst, te = tp + P.burst * P.slow; crack = sm(b - P.crack, b, t);
          if (t >= b) { if (t < tp) { p = fwd((t - b) / P.burst); fwdOn = true; } else { p = rev((t - tp) / (P.burst * P.slow)); if (p > 0) revOn = true; if (t >= te) crack = 1 - sm(te, te + P.crack, t); } } }
        if (crack > 0 && p === 0) cr = true;
        out.L.push({ p, crack }); });
      out.label = revOn ? 'COALESCE' : fwdOn ? 'BURST' : cr ? 'CRACK' : 'LETTERS';
      return out;
    },

    drawDust(S, st) {
      const P = S.P, d = S.dctx, M = S.M; let n = 0;
      d.setTransform(1, 0, 0, 1, 0, 0); d.globalAlpha = 1; d.clearRect(0, 0, S.dcv.width, S.dcv.height);
      const BC = S.BC; BC.fill(0);
      S.LET.forEach((L, li) => { const p = st.L[li].p; if (p <= 0) return;
        const fp = p * (S.F - 1), f0 = Math.floor(fp), f1 = Math.min(f0 + 1, S.F - 1), fr = fp - f0, tau = p * P.burst, gw = 1 - Math.exp(-tau * P.growRate), pa = sm(0, 0.02, p);
        const softF = Math.pow(gw, 0.8) * (NSOFT - 1), sha = pa * 0.55 * (1 - sm(0, 0.35, gw));
        for (let i = L.p0; i < L.p1; i++) {
          const o0 = f0 * M + i, o1 = f1 * M + i, x = S.BX[o0] + (S.BX[o1] - S.BX[o0]) * fr, y = S.BY[o0] + (S.BY[o1] - S.BY[o0]) * fr, z = S.BZ[o0] + (S.BZ[o1] - S.BZ[o0]) * fr, ps = 1 + z * P.persp;
          S.KX[n] = S.vw / 2 + (x - S.vw / 2) * ps; S.KY[n] = S.vh / 2 + (y - S.vh / 2) * ps;
          const b = Math.min(NB - 1, (z * 0.06) | 0); S.KB[n] = b; BC[b + 1]++;
          if (S.GR[i]) { S.KR[n] = 2.2 * ps; S.KA[n] = pa * 0.9 * (1 - sm(0.3, 1, p)); S.KS[n] = ((S.nc - 1) * NSOFT) * NSH + NSH - 1; S.KH[n] = 0; }
          else { S.KR[n] = S.sp * (1.05 + P.grow * gw * (0.5 + S.RR[i])) * ps; S.KA[n] = pa * (0.95 - (0.95 - P.mix) * gw);
            const l = clamp(0.45 + 0.4 * S.SH[i] + z * 0.002 - 0.12 * gw * (1 - S.SH[i]), 0, 0.999), soft = clamp(Math.floor(softF + S.RR[i]), 0, NSOFT - 1);
            S.KS[n] = (S.CI[i] * NSOFT + soft) * NSH + Math.floor(l * NSH); S.KH[n] = sha; }
          n++; }
      });
      if (!n) return false;
      for (let b = 1; b <= NB; b++) BC[b] += BC[b - 1];            // bucket sort by height: floor dust first, nearest last
      for (let k = 0; k < n; k++) S.IDX[BC[S.KB[k]]++] = k;
      const s = S.dcv.width / S.vw;
      for (let j = 0; j < n; j++) { const k = S.IDX[j], r = S.KR[k] * s, X = S.KX[k] * s, Y = S.KY[k] * s;
        if (S.KH[k] > 0.01) { d.globalAlpha = S.KH[k]; const rs = r * 1.05; d.drawImage(S.shadow, X - rs + r * 0.22, Y - rs + r * 0.28, rs * 2, rs * 2); }
        d.globalAlpha = S.KA[k]; d.drawImage(S.spr[S.KS[k]], X - r, Y - r, r * 2, r * 2); }
      d.globalAlpha = 1;
      return true;
    },

    frame(ctx, S, t, dt, E) {
      const P = S.P;
      if (S.fontWait && t >= S.nextCheck) { S.nextCheck = t + 0.25; if (document.fonts.check(S.font(100), S.word)) { S.fontWait = false; this.build(S, E); } }
      E.fade(ctx, dt, P.trail);
      const st = this.timeline(S, t); S.label = st.label;
      ctx.save();
      ctx.setTransform(E.s, 0, 0, E.s, 0, 0);
      if (P.glow > 0) { const gx = S.vw * 0.46, gy = S.vh * 0.47, gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, S.vw * 0.55), c = mixA(hex(E.pal.bg), hex(E.pal.accent), 0.3);
        gr.addColorStop(0, css(c, P.glow)); gr.addColorStop(1, css(c, 0)); ctx.fillStyle = gr; ctx.fillRect(0, 0, S.vw, S.vh); }
      for (const b of S.bokehs) { const x = b.x + Math.sin(t * b.w + b.ph) * b.ax, y = b.y + Math.cos(t * b.w * 0.8 + b.ph) * b.ay;
        ctx.globalAlpha = b.a * (0.75 + 0.25 * Math.sin(t * 0.3 + b.ph)); ctx.drawImage(S.bok, x - b.r, y - b.r, b.r * 2, b.r * 2); }
      S.LET.forEach((L, i) => { const s = st.L[i], a = (1 - sm(0, 0.06, s.p)) * st.artA; if (a <= 0.001) return;
        ctx.globalAlpha = a; ctx.drawImage(L.art, L.x0 - L.pad, L.y0 - L.pad, L.art.width / E.s, L.art.height / E.s);
        if (s.crack > 0 && L.cracks.length) { const v = s.crack * STAGES, s0 = Math.floor(v), fr = v - s0;
          if (s0 >= 1) ctx.drawImage(L.cracks[Math.min(s0 - 1, STAGES - 1)], L.x0, L.y0);
          if (s0 < STAGES && fr > 0) { ctx.globalAlpha = a * fr; ctx.drawImage(L.cracks[s0], L.x0, L.y0); } } });
      ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (st.dustA > 0.001 && this.drawDust(S, st)) { ctx.globalAlpha = st.dustA; ctx.drawImage(S.dcv, 0, 0, E.w, E.h); ctx.globalAlpha = 1; }
      if (P.vignette > 0) { const vg = ctx.createRadialGradient(E.w / 2, E.h / 2, Math.min(E.w, E.h) * 0.35, E.w / 2, E.h / 2, Math.max(E.w, E.h) * 0.75);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${P.vignette})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, E.w, E.h); }
      ctx.restore();
    },

    stats(S) { return 'DUST ' + S.M + ' GRAINS  ·  ' + S.LET.length + ' LETTERS  ·  ' + (S.label || 'LETTERS'); },
  };
})(globalThis.GEN = globalThis.GEN || {});
