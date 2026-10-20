/* MUSIC — one cohesive 24-bar loop, 96 BPM, D major.
   Chords cycle every 4 bars: Dmaj7 · Bm11 · Gmaj9 · A7sus4. 24 bars = 6 cycles, so
   the loop point is just another bar line (no cadence, no drop, no silence).
   A constant bed (kick, soft snap, shaker, bass, pad) runs through every section
   so loudness stays even; each section adds one lead "color":
     each section picks a lead instrument in config.js:
     tine, marimba, pluck, pulse, keys, mallet, voice, whistle, chime
   Every note is written into circular buffers, so tails wrap across the seam. */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const P = DHS.dsp;
  const M = (DHS.music = {});
  const TAU = Math.PI * 2;

  // ------------------------------------------------------------ harmony
  const CHORDS = [ // per bar, cycle of 4
    { name: 'Dmaj7', bass: 38, pad: [54, 57, 61, 64], keys: [61, 64, 66, 69] },
    { name: 'Bm11', bass: 35, pad: [54, 57, 62, 64], keys: [62, 64, 66, 69] },
    { name: 'Gmaj9', bass: 43, pad: [54, 57, 59, 62], keys: [59, 62, 66, 69] },
    { name: 'A7sus4', bass: 45, pad: [55, 57, 62, 64], keys: [62, 64, 67, 69] },
  ];
  M.chordAt = (bar) => CHORDS[((bar % 4) + 4) % 4];

  // ------------------------------------------------------------ instruments (mono note → Float32Array)
  const osc = (n, fn) => { const b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = fn(i); return b; };
  const I = (M.instruments = {});
  I.kick = (sr, v = 1) => { const n = Math.round(0.45 * sr), r = P.rng(7), lp = P.onepole(); let ph = 0;
    return osc(n, (i) => { const t = i / sr; ph += (48 + 95 * Math.exp(-t / 0.035)) / sr; const a = Math.min(1, i / (0.0015 * sr)) * Math.exp(-t / 0.2);
      return v * (Math.sin(TAU * ph) * a + lp(r(), 1800, sr) * 0.25 * Math.exp(-t / 0.004)); }); };
  I.snap = (sr, v = 1) => { const n = Math.round(0.3 * sr), r = P.rng(11), bp = P.svf(), lp = P.onepole();
    return osc(n, (i) => { const t = i / sr; const burst = [0, 0.008, 0.017].reduce((s, o) => s + (t >= o ? Math.exp(-(t - o) / 0.006) : 0), 0) * 0.55 + Math.exp(-t / 0.075);
      return v * lp(bp(r(), 1350, 1.1, sr, 'bp'), 4200, sr) * burst * Math.min(1, i / 40); }); };
  I.shaker = (sr, v = 1, seed = 3) => { const n = Math.round(0.12 * sr), r = P.rng(seed), bp = P.svf(), lp = P.onepole();
    return osc(n, (i) => { const t = i / sr; const a = (t < 0.01 ? t / 0.01 : Math.exp(-(t - 0.01) / 0.035));
      return v * lp(bp(r(), 5200, 0.8, sr, 'bp'), 7500, sr) * a; }); };
  I.bass = (sr, m, dur, v = 1) => { const f = P.mtof(m), n = Math.round((dur + 0.12) * sr), g = Math.round(dur * sr), e = P.adsr(n, sr, 0.006, 0.22, 0.6, 0.09, g), lp = P.svf(); let ph = 0;
    return osc(n, (i) => { ph = (ph + f / sr) % 1; const t = i / sr; const x = Math.sin(TAU * ph) + 0.32 * P.saw(ph, f / sr);
      return v * e[i] * lp(x, 380 + 700 * Math.exp(-t / 0.08), 0.9, sr); }); };
  // Pad: 2 detuned saws per side, gentle breathing lowpass. Returns [L, R].
  I.pad = (sr, m, dur, t0, v = 1) => { const f = P.mtof(m), n = Math.round((dur + 0.9) * sr), e = P.adsr(n, sr, 0.35, 0.6, 0.82, 0.8, Math.round(dur * sr));
    const side = (d1, d2, seed) => { const lp = P.svf(); let p1 = seed * 0.37 % 1, p2 = seed * 0.61 % 1; const f1 = f * Math.pow(2, d1 / 1200), f2 = f * Math.pow(2, d2 / 1200);
      return osc(n, (i) => { p1 = (p1 + f1 / sr) % 1; p2 = (p2 + f2 / sr) % 1; const tt = t0 + i / sr; const fc = 900 + 350 * Math.sin(TAU * tt / 10);
        return v * e[i] * lp(P.saw(p1, f1 / sr) + P.saw(p2, f2 / sr), fc, 0.75, sr) * 0.5; }); };
    return [side(-9, 4, m), side(8, -3, m + 1)]; };

  // Leads (the per-section color)
  const fm = (sr, f, n, ratio, idx0, idx1, idxDec, amp) => { let pc = 0, pm = 0;
    return osc(n, (i) => { const t = i / sr; pm = (pm + f * ratio / sr) % 1; const ix = idx1 + (idx0 - idx1) * Math.exp(-t / idxDec); pc = (pc + f / sr) % 1; return Math.sin(TAU * pc + ix * Math.sin(TAU * pm)) * amp[i]; }); };
  I.tine = (sr, m, dur, v = 1) => { const f = P.mtof(m), n = Math.round((dur + 0.9) * sr), a = P.perc(n, sr, 0.003, 0.42); const b = fm(sr, f, n, 1, 1.8, 0.25, 0.18, a); for (let i = 0; i < n; i++) b[i] *= v; return b; };
  I.marimba = (sr, m, dur, v = 1) => { const f = P.mtof(m - 12), n = Math.round(0.8 * sr); let p1 = 0, p2 = 0;
    return osc(n, (i) => { const t = i / sr; p1 = (p1 + f / sr) % 1; p2 = (p2 + 3.93 * f / sr) % 1; const a = Math.min(1, i / (0.002 * sr));
      return v * a * (Math.sin(TAU * p1) * Math.exp(-t / 0.28) + 0.35 * Math.sin(TAU * p2) * Math.exp(-t / 0.035)); }); };
  I.pluck = (sr, m, dur, v = 1, seed = 1) => { // Karplus-Strong with allpass fine-tuning
    const f = P.mtof(m), per = sr / f - 0.5, L = Math.floor(per), fr = per - L, c = (1 - fr) / (1 + fr), n = Math.round(1.6 * sr);
    const r = P.rng(seed + m), line = new Float32Array(L), lp = P.onepole(); for (let i = 0; i < L; i++) line[i] = lp(r(), 2600, sr);
    let idx = 0, apx = 0, apy = 0, prev = 0; const out = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = line[idx]; const y = 0.5 * (x + prev) * 0.9965; prev = x; const ap = c * y + apx - c * apy; apx = y; apy = ap; line[idx] = ap; if (++idx >= L) idx = 0; out[i] = v * x * (i < 64 ? i / 64 : 1); }
    return out; };
  I.pulse = (sr, m, dur, v = 1) => { const f = P.mtof(m), n = Math.round((dur + 0.25) * sr), e = P.adsr(n, sr, 0.004, 0.12, 0.35, 0.12, Math.round(dur * sr)), lp = P.svf(); let ph = 0;
    return osc(n, (i) => { const t = i / sr; ph = (ph + f / sr) % 1; return v * e[i] * lp(P.square(ph, f / sr, 0.36), 700 + 1500 * Math.exp(-t / 0.07), 1.1, sr) * 0.6; }); };
  I.keys = (sr, m, dur, v = 1) => { const f = P.mtof(m), n = Math.round((dur + 0.8) * sr), a = P.adsr(n, sr, 0.004, 0.9, 0.25, 0.35, Math.round(dur * sr)); const b = fm(sr, f, n, 1, 1.4, 0.2, 0.12, a); for (let i = 0; i < n; i++) b[i] *= v * (1 + 0.12 * Math.sin(TAU * 4.5 * i / sr)); return b; };
  I.mallet = (sr, m, dur, v = 1) => { const f = P.mtof(m), n = Math.round(1.3 * sr); let p1 = 0, p2 = 0;
    return osc(n, (i) => { const t = i / sr; p1 = (p1 + f / sr) % 1; p2 = (p2 + 4 * f / sr) % 1; const a = Math.min(1, i / (0.003 * sr));
      return v * a * (Math.sin(TAU * p1) * Math.exp(-t / 0.55) * (1 + 0.18 * Math.sin(TAU * 5.2 * t)) + 0.18 * Math.sin(TAU * p2) * Math.exp(-t / 0.05)); }); };
  I.woodblock = (sr, v = 1) => { const n = Math.round(0.09 * sr); let ph = 0; return osc(n, (i) => { const t = i / sr; ph = (ph + (820 - 120 * t / 0.09) / sr) % 1; return v * Math.sin(TAU * ph) * Math.exp(-t / 0.018) * Math.min(1, i / 30); }); };
  I.voice = (sr, m, dur, v = 1) => { const f = P.mtof(m), n = Math.round((dur + 0.4) * sr), e = P.adsr(n, sr, 0.12, 0.3, 0.85, 0.3, Math.round(dur * sr)), f1 = P.svf(), f2 = P.svf(), lp = P.svf(); let ph = 0;
    return osc(n, (i) => { const t = i / sr; const vib = 1 + 0.0045 * Math.sin(TAU * 5 * t) * Math.min(1, t / 0.35); ph = (ph + f * vib / sr) % 1; const s = P.saw(ph, f / sr);
      return v * e[i] * (f1(s, 330, 5, sr, 'bp') * 1.0 + f2(s, 780, 7, sr, 'bp') * 0.55 + lp(s, 500, 0.7, sr) * 0.25); }); };
  I.whistle = (sr, m, dur, v = 1, seed = 5) => { const f = P.mtof(m), n = Math.round((dur + 0.25) * sr), e = P.adsr(n, sr, 0.04, 0.2, 0.8, 0.16, Math.round(dur * sr)), r = P.rng(seed), bp = P.svf(); let ph = 0;
    return osc(n, (i) => { const t = i / sr; const vib = 1 + 0.006 * Math.sin(TAU * 5.5 * t) * Math.min(1, t / 0.25); ph = (ph + f * vib / sr) % 1;
      return v * e[i] * (Math.sin(TAU * ph) + 0.08 * bp(r(), f, 4, sr, 'bp')); }); };
  I.chime = (sr, m, dur, v = 1) => { const f = P.mtof(m), n = Math.round(1.4 * sr); let p = 0;
    return osc(n, (i) => { const t = i / sr; p = (p + f / sr) % 1; const a = Math.min(1, i / (0.004 * sr));
      return v * a * (Math.sin(TAU * p) * Math.exp(-t / 0.5) + 0.3 * Math.sin(2 * TAU * p) * Math.exp(-t / 0.18) + 0.08 * Math.sin(3 * TAU * p) * Math.exp(-t / 0.08)); }); };

  // ------------------------------------------------------------ lead phrases
  // Notes: [step16, midi, lenSteps, vel]; step 0 = section start. Sections starting on
  // Bm/G bars use 'a' variants; sections starting on A/D bars use 'b' variants.
  const PH = (M.phrases = {
    tine: { a: [[0, 71, 2, 1], [3, 74, 2, .8], [6, 78, 2, .9], [8, 76, 1, .7], [10, 74, 2, .8], [14, 71, 2, .7], [16, 74, 2, 1], [19, 78, 2, .8], [22, 79, 2, .9], [24, 78, 1, .7], [26, 74, 2, .8], [28, 71, 4, .8]] },
    marimba: { b: [[0, 69, 1, 1], [1, 69, 1, .5], [4, 74, 2, .8], [6, 76, 2, .8], [8, 69, 1, 1], [9, 69, 1, .5], [12, 78, 2, .8], [14, 76, 2, .7], [16, 74, 1, 1], [17, 74, 1, .5], [20, 78, 2, .8], [22, 81, 2, .9], [24, 78, 1, 1], [25, 78, 1, .5], [28, 76, 2, .8], [30, 74, 2, .7]] },
    pluck: { a: [59, 62, 66, 69, 71, 69, 66, 62, 55, 59, 62, 66, 67, 66, 62, 59].map((m, k) => [k * 2, m + 12, 2, k % 4 === 0 ? 1 : .75]) },
    pulse: { b: Array.from({ length: 32 }, (_, k) => [k, (k < 16 ? [57, 62, 64, 69] : [57, 62, 66, 69])[k % 4] + 12, 1, [0, 3, 6, 8, 11, 14].includes(k % 16) ? 1 : .55]) },
    keys: { a: [2, 6, 11, 14, 18, 22, 27, 30].map((s, k) => ({ s, bar: k < 4 ? 1 : 2, len: k % 4 === 2 ? 2 : 1, v: k % 4 === 0 ? 1 : .8 })) },
    mallet: { b: [[0, 69, 2, 1], [2, 71, 2, .8], [4, 74, 3, .9], [7, 76, 3, .8], [10, 74, 2, .8], [12, 71, 4, .8], [16, 74, 2, 1], [18, 76, 2, .8], [20, 78, 3, .9], [23, 81, 3, .9], [26, 78, 2, .8], [28, 74, 4, .8]] },
    voice: { a: [[0, 74, 6, 1], [6, 76, 2, .8], [8, 78, 8, .95], [16, 78, 4, .9], [20, 74, 4, .85], [24, 71, 8, .9]] },
    whistle: [[0, 74, 2, .9], [2, 76, 2, .8], [4, 78, 4, 1], [8, 81, 6, .9], [14, 78, 2, .7], [16, 76, 4, .9], [20, 74, 2, .8], [22, 76, 2, .8], [24, 69, 7, .9], [32, 74, 2, .9], [34, 78, 2, .8], [36, 76, 4, .9], [40, 74, 8, 1]],
    chime: null,
    chimeBar: { 0: [81, 78, 76, 74, 76, 78], 1: [78, 74, 71, 69, 71, 74], 2: [78, 74, 71, 67, 71, 74], 3: [76, 74, 69, 67, 69, 74] },
  });

  PH.chime = [0, 1].flatMap((b) => [0, 2, 4, 6, 10, 12].map((st, j) => [st + 16 * b, PH.chimeBar[b][j], 2, j ? 0.8 : 1]));

  // ------------------------------------------------------------ arrangement
  M.render = (opts = {}) => {
    const c = DHS.config, sr = opts.sr || c.film.sampleRate;
    const beat = 60 / c.film.bpm, barS = beat * c.film.beatsPerBar, bars = c.film.bars, N = Math.round(bars * barS * sr);
    const stepN = Math.round((beat / 4) * sr), barN = stepN * 16; // 7500 / 120000 samples @ 48 kHz
    const at = (bar, step) => bar * barN + Math.round(step * stepN);
    const stepS = beat / 4;
    const B = { drums: P.bus(N), bass: P.bus(N), pad: P.bus(N), lead: P.bus(N), wet: P.bus(N) };
    const hr = P.rng(99);

    // --- bed: identical every bar (steadiness = not grating on repeat)
    const kick = I.kick(sr), snap = I.snap(sr), shk = [I.shaker(sr, 1, 3), I.shaker(sr, 1, 4)];
    for (let b = 0; b < bars; b++) {
      P.write(B.drums, kick, at(b, 0), 0.6); P.write(B.drums, kick, at(b, 8), 0.54);
      if (b % 2 === 1) P.write(B.drums, kick, at(b, 14), 0.28);
      P.write(B.drums, snap, at(b, 4), 0.34, 0.05); P.write(B.drums, snap, at(b, 12), 0.34, 0.05);
      P.write(B.wet, snap, at(b, 4), 0.1); P.write(B.wet, snap, at(b, 12), 0.1);
      for (let s = 0; s < 16; s++) P.write(B.drums, shk[s % 2], at(b, s) + Math.round(hr() * 0.002 * sr), (s % 4 === 2 ? 0.2 : s % 2 ? 0.08 : 0.11) * (1 + 0.15 * hr()), 0.35);
      const ch = M.chordAt(b);
      [[0, 0, 3, 1], [3, 0, 1, .55], [6, 12, 2, .8], [8, 0, 3, .95], [11, 0, 1, .5], [14, 7, 2, .7]].forEach(([s, iv, len, v]) =>
        P.write(B.bass, I.bass(sr, ch.bass + iv, len * stepS * 0.9, v), at(b, s), 0.4));
      ch.pad.forEach((m) => { const [l, r] = I.pad(sr, m, barS, b * barS); P.write(B.pad, l, at(b, 0), 0.11, -0.7); P.write(B.pad, r, at(b, 0), 0.11, 0.7); });
    }

    // --- leads, each rendered alone then level-matched so no section jumps out
    const sec = c.sections, leadTarget = opts.leadTarget || -18; // K-weighted dBFS-ish RMS target per section
    const sections = [];
    const addSection = (id, bar0, nBars, fillFn, pan = 0, send = 0.25, echo = 0.2) => { const bus = P.bus(N); fillFn(bus, bar0); sections.push({ id, bar0, nBars, bus, pan, send, echo }); };
    const notes = (inst, list, bar0) => (bus) => list.forEach(([s, m, len, v]) => P.write(bus, I[inst](sr, m, len * stepS * 0.92, v), at(bar0, s), 1));

    // one lead per section, from config.sections[i].instrument (2-bar phrase repeated)
    let barPos = 0;
    c.sections.forEach((sd, i) => {
      const b0 = barPos; barPos += sd.bars; const inst = sd.instrument; if (!inst || !PH[inst]) return;
      const ph = PH[inst], v = Array.isArray(ph) ? ph : (ph.a || ph.b), pan = i % 2 ? 0.2 : -0.2;
      addSection(sd.id, b0, sd.bars, (bus) => { for (let r = 0; r < sd.bars; r += 2) { const bb = b0 + r;
        if (inst === 'keys') v.forEach(({ s: st, bar, len, v: vel }) => M.chordAt(bb + bar - 1).keys.forEach((m, q) => P.write(bus, I.keys(sr, m, len * stepS * 0.9, vel * (q === 3 ? 1 : 0.7)), at(bb, st), 0.5)));
        else if (inst === 'pluck') v.forEach(([st, m, len, vel], k) => P.write(bus, I.pluck(sr, m, 0, vel, k), at(bb, st), 1));
        else { v.filter((n) => n[0] < 32).forEach(([st, m, len, vel]) => P.write(bus, I[inst](sr, m, len * stepS * 0.92, vel), at(bb, st), 1));
          if (inst === 'mallet') for (let q = 2; q < 32; q += 4) P.write(bus, I.woodblock(sr), at(bb, q), 0.35, 0.4); } } }, pan, inst === 'voice' ? 0.35 : 0.25, 0.2);
    });

    // level-match on K-weighted power inside each section's own span
    const kw = (bus, bar0, nBars) => { const kl = P.kweight(sr); let s = 0, cnt = 0; for (let k = 0; k < nBars * barN; k++) { const i = (bar0 * barN + k) % N; const x = kl((bus.L[i] + bus.R[i]) * 0.5); s += x * x; cnt++; } return 10 * Math.log10(s / cnt + 1e-20); };
    M.leadLevels = {};
    for (const S of sections) {
      const lvl = kw(S.bus, S.bar0, S.nBars), g = P.db(leadTarget - lvl) * (S.id === 'itc' ? 0.9 : 1);
      M.leadLevels[S.id] = { before: +lvl.toFixed(1), gainDb: +P.todb(g).toFixed(1) };
      // re-pan: collapse the section's stereo then place it
      const pl = Math.cos((S.pan + 1) * Math.PI / 4) * Math.SQRT2, pr = Math.sin((S.pan + 1) * Math.PI / 4) * Math.SQRT2;
      for (let i = 0; i < N; i++) { const x = (S.bus.L[i] + S.bus.R[i]) * 0.5 * g; B.lead.L[i] += x * pl; B.lead.R[i] += x * pr; B.wet.L[i] += x * S.send; B.wet.R[i] += x * S.send; }
      S.echoGain = S.echo * g;
    }
    // echo send: per-section amount
    const echoIn = P.bus(N); for (const S of sections) for (let i = 0; i < N; i++) { const x = (S.bus.L[i] + S.bus.R[i]) * 0.5 * S.echoGain; echoIn.L[i] += x; echoIn.R[i] += x; }

    // --- effects, processed circularly
    const echo = P.circular(echoIn, P.delay({ sr, time: beat * 0.75, fb: 0.3, lp: 2800 }));
    P.mixInto(B.wet, echo, 0.35);
    const verb = P.circular(B.wet, P.reverb({ sr, size: 0.84, damp: 0.5, width: 1, hp: 200, lp: 5500 }));

    // --- sum music (gentle bus EQ: low-cut 30 Hz, soft high-shelf cut above 7 kHz → never harsh)
    const mix = P.bus(N);
    P.mixInto(mix, B.drums, 1); P.mixInto(mix, B.bass, 1); P.mixInto(mix, B.pad, 1); P.mixInto(mix, B.lead, 1); P.mixInto(mix, echo, 0.55); P.mixInto(mix, verb, 1.1);
    const music = P.circular(mix, () => { const hl = P.rbjHighpass(30, 0.7, sr), hr2 = P.rbjHighpass(30, 0.7, sr), sl = P.rbjShelfHi(9000, -2, sr), sr2 = P.rbjShelfHi(9000, -2, sr); return (l, r) => [sl(hl(l)), sr2(hr2(r))]; });
    return { sr, N, music, buses: B, sections: sections.map(({ id, bar0, nBars }) => ({ id, bar0, nBars })) };
  };
})(globalThis);
