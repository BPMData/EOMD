/* MASTER — music + SFX → -16 LUFS integrated, true peak ≤ -1 dBTP (limiter
   ceiling -1.5 dBTP for margin after AAC encoding). Loudness is measured on the
   loop as it actually plays (circularly), so the seam is part of the measurement.
   Stems are returned at the same gain used for the master (they sum to the
   pre-limiter master). Used by tools/render-audio.js and by the browser players. */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const P = DHS.dsp;
  const A = (DHS.audio = {});

  A.TARGET_LUFS = -16;
  A.CEILING_DBTP = -1.5;
  A.SFX_DB = -3; // SFX bus trim relative to music (sounds are already quiet by design)

  A.render = (opts = {}) => {
    const log = opts.log || (() => {});
    const sr = opts.sr || DHS.config.film.sampleRate;
    const cues = opts.cues || (DHS.film.tl || DHS.film.build()).cues;
    log('music…'); const m = DHS.music.render({ sr });
    log('sfx…'); const sfx = DHS.sfx.render(cues, sr, m.N);
    const N = m.N, sg = P.db(A.SFX_DB);
    const mix = P.bus(N); P.mixInto(mix, m.music, 1); P.mixInto(mix, sfx, sg);
    log('master…');
    let g = P.db(A.TARGET_LUFS - P.lufs(mix, sr)), lim, lufs;
    for (let it = 0; it < 4; it++) {
      const pre = P.bus(N); P.mixInto(pre, mix, g);
      lim = P.limit(pre, sr, P.db(A.CEILING_DBTP));
      lufs = P.lufs(lim.bus, sr);
      if (Math.abs(lufs - A.TARGET_LUFS) < 0.05) break;
      g *= P.db(A.TARGET_LUFS - lufs);
    }
    const music = P.bus(N), sfxOut = P.bus(N); P.mixInto(music, m.music, g); P.mixInto(sfxOut, sfx, g * sg);
    const master = lim.bus;
    const report = { sr, samples: N, seconds: N / sr, lufs: +lufs.toFixed(2), gainDb: +P.todb(g).toFixed(2), limiterMaxGRdB: lim.maxGR, limiterHits: lim.hits, leadLevels: DHS.music.leadLevels };
    if (opts.analyze) {
      report.truePeakDb = +P.todb(P.truePeak(master)).toFixed(2);
      const st = P.shortTerm(master, sr); report.shortTerm = { min: +Math.min(...st).toFixed(2), max: +Math.max(...st).toFixed(2) };
      // per-section mean short-term loudness (measured at each section's end, i.e. over its last 3 s)
      const bar = N / sr / DHS.config.film.bars;
      report.sections = m.sections.map((s) => ({ id: s.id, stEnd: +st[Math.round(((s.bar0 + s.nBars) * bar * 10)) % st.length].toFixed(2) }));
      // seam: sample-to-sample step across the loop point vs. typical step
      let mx = 0; for (let i = 1; i < N; i++) mx = Math.max(mx, Math.abs(master.L[i] - master.L[i - 1]));
      report.seam = { stepL: +Math.abs(master.L[0] - master.L[N - 1]).toFixed(5), stepR: +Math.abs(master.R[0] - master.R[N - 1]).toFixed(5), maxStepAnywhere: +mx.toFixed(5) };
    }
    return { sr, N, music, sfx: sfxOut, master, report };
  };

  // Interleave to 16-bit (or float) WAV bytes — Node export helper (also usable in-browser)
  A.wav = (bus, sr, bits = 24) => {
    const N = bus.N, bps = bits / 8, data = N * 2 * bps, b = new ArrayBuffer(44 + data), v = new DataView(b);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + data, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2 * bps, true); v.setUint16(32, 2 * bps, true); v.setUint16(34, bits, true); w(36, 'data'); v.setUint32(40, data, true);
    // TPDF dither for 16-bit only
    const r1 = P.rng(1), r2 = P.rng(2), max = Math.pow(2, bits - 1) - 1; let o = 44;
    for (let i = 0; i < N; i++) for (const ch of [bus.L, bus.R]) {
      let x = ch[i] * max; if (bits === 16) x += (r1() + r2()) * 0.5; x = Math.max(-max - 1, Math.min(max, Math.round(x)));
      if (bits === 16) v.setInt16(o, x, true); else { v.setUint8(o, x & 255); v.setUint8(o + 1, (x >> 8) & 255); v.setUint8(o + 2, (x >> 16) & 255); } o += bps;
    }
    return b;
  };
})(globalThis);
