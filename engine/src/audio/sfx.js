/* SOUND DESIGN — synthesized from the film's timeline cues (DHS.film.tl.cues),
   so every whoosh/pop/tick lands exactly on its motion. All sounds are soft,
   band-limited and pitched to D major pentatonic: nothing bright, nothing
   alarm- or bell-like. Mixed well under the music in master.js. */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const P = DHS.dsp;
  const X = (DHS.sfx = {});
  const TAU = Math.PI * 2;
  const PENT = [74, 76, 78, 81, 83, 86, 88]; // D5 E5 F#5 A5 B5 D6 E6

  const buf = (n, fn) => { const b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = fn(i); return b; };
  // Filtered-noise sweep: f(t) goes a→b→c (log), envelope rises to peak at `pk` (0..1)
  const sweep = (sr, dur, fa, fb, fc, pk, q, seed) => { const n = Math.round(dur * sr), r = P.rng(seed), bp = P.svf(), lp = P.onepole();
    return buf(n, (i) => { const u = i / n, f = u < pk ? fa * Math.pow(fb / fa, u / pk) : fb * Math.pow(fc / fb, (u - pk) / (1 - pk));
      const e = u < pk ? Math.pow(Math.sin((u / pk) * Math.PI / 2), 2) : Math.pow(1 - (u - pk) / (1 - pk), 2);
      return lp(bp(r(), f, q, sr, 'bp'), 4000, sr) * e; }); };

  const S = (X.sounds = {
    whoosh: (sr, p) => sweep(sr, p.dur || 0.7, 260, 1500, 500, 0.6, 1.2, 21),
    swell: (sr, p) => { const n = Math.round((p.dur || 0.9) * sr), w = sweep(sr, p.dur || 0.9, 200, 1100, 700, 0.8, 0.9, 5); let a = 0, b = 0;
      return buf(n, (i) => { const u = i / n, e = Math.sin(Math.min(1, u / 0.8) * Math.PI / 2) * (u > 0.8 ? 1 - (u - 0.8) / 0.2 : 1); a = (a + P.mtof(62) / sr) % 1; b = (b + P.mtof(69) / sr) % 1; return w[i] * 0.8 + 0.25 * e * (Math.sin(TAU * a) + Math.sin(TAU * b)); }); },
    slide: (sr) => sweep(sr, 0.28, 700, 1400, 900, 0.35, 1.5, 9),
    pop: (sr, p) => { const f = P.mtof(PENT[((p.note || 0) % 7 + 7) % 7] - 12), n = Math.round(0.16 * sr); let ph = 0;
      return buf(n, (i) => { const t = i / sr; ph = (ph + f * (1 + 0.5 * Math.exp(-t / 0.012)) / sr) % 1; return Math.sin(TAU * ph) * Math.min(1, i / (0.0015 * sr)) * Math.exp(-t / 0.04); }); },
    tick: (sr, p) => { const f = 1100 + 180 * (p.pitch || 0), n = Math.round(0.05 * sr), r = P.rng(3), bp = P.svf(); let ph = 0;
      return buf(n, (i) => { const t = i / sr; ph = (ph + f / sr) % 1; return (0.7 * Math.sin(TAU * ph) + 0.5 * bp(r(), f, 3, sr, 'bp')) * Math.exp(-t / 0.009) * Math.min(1, i / 20); }); },
    thump: (sr) => { const n = Math.round(0.4 * sr); let ph = 0; return buf(n, (i) => { const t = i / sr; ph = (ph + (44 + 40 * Math.exp(-t / 0.05)) / sr) % 1; return Math.sin(TAU * ph) * Math.exp(-t / 0.16) * Math.min(1, i / (0.003 * sr)); }); },
    // Rewind: a downward sweep with a soft accelerating "winding" pulse
    rewind: (sr, p) => { const dur = p.dur || 2.6, n = Math.round(dur * sr), w = sweep(sr, dur, 1300, 900, 240, 0.5, 1.4, 17); let ph = 0, rate = 0;
      return buf(n, (i) => { const u = i / n; rate += (4 + 14 * u * u) / sr; const pulse = 0.55 + 0.45 * Math.cos(TAU * rate); ph = (ph + P.mtof(69 - 12 * u) / sr) % 1;
        const e = Math.sin(Math.min(1, u / 0.3) * Math.PI / 2) * Math.pow(1 - u, 0.8); return w[i] * pulse + 0.12 * e * Math.sin(TAU * ph) * pulse; }); },
    unwind: (sr, p) => sweep(sr, p.dur || 1.6, 220, 1600, 800, 0.7, 1.1, 33),
  });

  X.gains = { whoosh: 0.5, swell: 0.4, slide: 0.35, pop: 0.3, tick: 0.14, thump: 0.55, rewind: 0.45, unwind: 0.45 };

  X.render = (cues, sr, N) => {
    const bus = P.bus(N), wet = P.bus(N);
    for (const c of cues) { const f = S[c.type]; if (!f) continue; const b = f(sr, c), g = X.gains[c.type] * (c.gain ?? 1), pan = c.pan || 0;
      P.write(bus, b, Math.round(c.t * sr), g, pan); P.write(wet, b, Math.round(c.t * sr), g * 0.25, pan); }
    const verb = P.circular(wet, P.reverb({ sr, size: 0.7, damp: 0.6, hp: 250, lp: 4500 }));
    P.mixInto(bus, verb, 1);
    return bus;
  };
})(globalThis);
