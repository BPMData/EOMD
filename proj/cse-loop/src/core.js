/* core.js: math, easing, fonts and images for the CSE hallway loop. Fonts and images arrive as base64 in
   DHS.ASSETS (written by build.py), so the player needs no files and no internet. */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const M = (DHS.math = {});
  M.mod = (a, n) => ((a % n) + n) % n;
  M.clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  M.lerp = (a, b, u) => a + (b - a) * u;
  M.prog = (t, t0, t1) => M.clamp((t - t0) / (t1 - t0));          // 0..1 progress of t through [t0, t1]
  M.smooth = (u) => { u = M.clamp(u); return u * u * (3 - 2 * u); };
  M.outCubic = (u) => 1 - Math.pow(1 - M.clamp(u), 3);
  M.inCubic = (u) => Math.pow(M.clamp(u), 3);
  M.inOut = (u) => { u = M.clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  M.outBack = (u, s = 1.6) => { u = M.clamp(u); const c = s + 1; return 1 + c * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };
  // a damped settle: overshoots once, then rests (for things that land)
  M.land = (u) => { u = M.clamp(u); return 1 - Math.exp(-6 * u) * Math.cos(9 * u) * (1 - u); };

  // ---- fonts: FontFace from embedded base64 (falls back to system fonts if anything fails)
  const T = (DHS.type = {});
  T.SANS = 'Poppins, "Avenir Next", "Helvetica Neue", Arial, sans-serif';
  T.MONO = '"Source Code Pro", Menlo, Consolas, monospace';
  T.load = async () => {
    const A = DHS.ASSETS || {}, faces = [
      ['Poppins', A.poppins800, '800'], ['Poppins', A.poppins700, '700'], ['Poppins', A.poppins600, '600'],
      ['Source Code Pro', A.mono, '200 900']];
    for (const [fam, b64, wt] of faces) {
      if (!b64 || !G.FontFace) continue;
      try { const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer; const f = new FontFace(fam, buf, { weight: wt }); await f.load(); document.fonts.add(f); }
      catch (e) { console.warn('font', fam, e); }
    }
    // images
    DHS.IMG = {};
    for (const [k, src] of Object.entries(A.images || {})) {
      const im = new Image(); im.src = src; DHS.IMG[k] = im;
      try { await im.decode(); } catch (e) { console.warn('image', k, e); }
    }
  };
  T.font = (px, wt = 800, fam = T.SANS) => `${wt} ${px}px ${fam}`;
})(globalThis);
