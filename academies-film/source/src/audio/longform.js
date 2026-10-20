/* LONG-FORM STUDY LOOP — "Sanctioned Corporate Calm". 20:00 exactly, loops seamlessly.
   9 movements × 50 bars at 90 BPM (16th note = 8000 samples @ 48 kHz; 450 bars = 1200 s).
   Each movement treats one of the film's short tunes as an "air" and develops it:
     intro (pad) → A statement → B sequence/inversion/retrograde → C half-speed breakdown
     → D restatement with the previous movement's air as a soft counter-melody → E variations → outro.
   Rendered one section (4–8 bars) at a time so memory stays small: note tails and effect
   state carry across sections, and a warm-up pass of the last section makes the file's
   end flow into its start (seamless loop). Reuses the film's instruments (music.js). */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const P = DHS.dsp, I = DHS.music.instruments, PH = DHS.music.phrases;
  const LF = (DHS.longform = {});
  const SR = 48000, STEP = 8000, BAR = STEP * 16, TAIL = SR * 4, stepS = STEP / SR, barS = BAR / SR;
  LF.SR = SR; LF.BPM = 90;
  LF.GAIN_DB = -2.3; // master trim → -16 LUFS integrated (calibrated by tools/render-study.js)

  // ---- harmony (voiced in D; each movement transposes)
  const CH = { I: { b: 38, pad: [54, 57, 61, 64] }, ii: { b: 40, pad: [55, 59, 62, 66] }, iii: { b: 42, pad: [57, 61, 64, 66] },
    IV: { b: 43, pad: [54, 57, 59, 62] }, V: { b: 45, pad: [55, 57, 62, 64] }, vi: { b: 35, pad: [54, 57, 62, 64] } };
  const PROG = { a: ['I', 'vi', 'IV', 'V'], b: ['vi', 'IV', 'I', 'V'], c: ['IV', 'V', 'iii', 'vi'], d: ['I', 'iii', 'IV', 'ii'] };

  // ---- the airs
  const cfg = DHS.config;
  const chime = [0, 1].flatMap((b) => [0, 2, 4, 6, 10, 12].map((s, j) => [s + 16 * b, PH.chimeBar[b][j], 2, j ? 0.8 : 1]));
  LF.movements = [
    { id: 'prelude', name: 'Prelude: The Spiral', color: cfg.colors.danburyBlue, inst: 'chime', theme: chime, key: 0, prog: 'a' },
    { id: 'exploration', name: 'Exploration Academy', color: cfg.exploration.color, inst: 'whistle', theme: PH.whistle.filter((n) => n[0] < 32), key: 5, prog: 'b' },
    ...cfg.academies.map((a, i) => ({ id: a.id, name: a.name, color: a.color, inst: a.instrument, theme: (PH[a.instrument] || {}).a || (PH[a.instrument] || {}).b,
      key: [0, -2, 3, 0, -5, 2, 0][i % 7], prog: ['c', 'a', 'd', 'b', 'a', 'c', 'd'][i % 7] })),
  ];
  // Round-robin form: 12 rounds × 9 airs × 4 bars (each air ≈ 11 s, then the next one),
  // with a 6-bar drift after every 4 rounds. 12·36 + 3·6 = 450 bars = 20:00.
  const ROUNDS = [['o', 's1'], ['inv', 'o'], ['aug'], ['retro', 'disp'], ['o', 'oct'], ['s-1', 'inv'], ['aug'], ['disp', 'o'], ['s1', 'retro'], ['oct', 'thin'], ['aug'], ['o', 'thin']];
  const BLOCK_KEY = [0, 3, -5], PROGS = ['a', 'b', 'c', 'd'];
  const DRIFT = { id: 'drift', name: 'Drift', color: cfg.colors.danburyBlue, inst: 'chime', theme: chime };
  LF.plan = []; let bar = 0;
  ROUNDS.forEach((lead, r) => {
    const calm = lead[0] === 'aug', key = BLOCK_KEY[Math.floor(r / 4)], prog = PROGS[r % 4];
    LF.movements.forEach((mov, mi) => { LF.plan.push({ mi, round: r, mov, key, prog, lb0: 0, bar0: bar, bars: 4, t0: (bar * BAR) / SR, label: `${mov.name}  ·  round ${r + 1}/12`,
      sec: { kick: calm ? 0 : 1, snap: calm ? 0.5 : 1, shk: calm ? 0.7 : 1, bass: calm ? 0.7 : 1, lead, lvl: calm ? -1.5 : 0 } }); bar += 4; });
    if (r % 4 === 3) { LF.plan.push({ mi: 0, round: r, mov: DRIFT, key, prog: 'a', lb0: 0, bar0: bar, bars: 6, t0: (bar * BAR) / SR, label: 'Drift',
      sec: { kick: 0, snap: 0, shk: 0.5, bass: 0.5, lead: ['thin', 'thin', 'thin'], lvl: -4 } }); bar += 6; }
  });
  LF.bars = bar; LF.samples = bar * BAR; LF.seconds = LF.samples / SR;

  // ---- derivations in pentatonic-degree space (D major pentatonic)
  const PC = [0, 2, 4, 7, 9];
  const toDeg = (m) => { const o = Math.floor((m - 2) / 12), r = (((m - 2) % 12) + 12) % 12; let k = 0; PC.forEach((v, j) => { if (r >= v) k = j; }); return o * 5 + k; };
  const fromDeg = (d) => 2 + Math.floor(d / 5) * 12 + PC[((d % 5) + 5) % 5];
  const X = {
    o: (n) => n,
    s1: (n) => n.map(([s, m, l, v]) => [s, fromDeg(toDeg(m) + 1), l, v]),
    's-1': (n) => n.map(([s, m, l, v]) => [s, fromDeg(toDeg(m) - 1), l, v]),
    inv: (n) => { const p = toDeg(n[0][1]); return n.map(([s, m, l, v]) => [s, fromDeg(2 * p - toDeg(m)), l, v]); },
    retro: (n) => { const ms = n.map((x) => x[1]).reverse(); return n.map(([s, , l, v], i) => [s, ms[i], l, v]); },
    disp: (n) => n.map(([s, m, l, v]) => [(s + 3) % 32, m, l, v]),
    oct: (n) => n.map(([s, m, l, v], i) => [s, m + (i % 3 === 1 ? 12 : 0), l, v]),
    thin: (n) => n.filter((_, i) => i % 2 === 0).map(([s, m, l, v]) => [s, m, Math.max(l, 4), v * 0.85]),
    aug: (n) => n.map(([s, m, l, v]) => [s * 2, m, l * 2, v]),
  };
  const fit = (notes, key, lo, hi) => { let k = key; const ms = notes.map((x) => x[1]); while (Math.max(...ms) + k > hi) k -= 12; while (Math.min(...ms) + k < lo) k += 12; return notes.map(([s, m, l, v]) => [s, m + k, l, v]); };
  const ARP = { o: [0, 1, 2, 3, 2, 1, 0, 1], s1: [1, 2, 3, 2, 1, 2, 3, 0], 's-1': [3, 2, 1, 0, 1, 2, 1, 0], inv: [3, 2, 1, 0, 1, 2, 3, 2], retro: [1, 0, 1, 2, 3, 2, 1, 0],
    disp: [0, 2, 1, 3, 0, 2, 1, 3], oct: [0, 1, 2, 3, 3, 2, 1, 0], thin: [0, -1, 2, -1, 0, -1, 2, -1], aug: [0, -1, 1, -1, 2, -1, 3, -1] };
  const chordAt = (S, b) => CH[PROG[S.prog][(S.lb0 + b) % 4]];
  const tr = (m, key, lo, hi) => { m += key; while (m > hi) m -= 12; while (m < lo) m += 12; return m; };

  // ---- render one section's dry signals (length n + TAIL)
  const kweightMS = (bus, n) => { const k = P.kweight(SR); let s = 0; for (let i = 0; i < n; i++) { const x = k((bus.L[i] + bus.R[i]) * 0.5); s += x * x; } return 10 * Math.log10(s / n + 1e-20); };
  const renderSection = (idx) => {
    const S = LF.plan[idx], s = S.sec, mov = S.mov, key = S.key, n = S.bars * BAR, N = n + TAIL;
    const drums = P.bus(N), bass = P.bus(N), pad = P.bus(N), lead = P.bus(N), counter = P.bus(N), wet = P.bus(N);
    const at = (b, st) => b * BAR + Math.round(st * STEP), hr = P.rng(1000 + idx);
    const kick = I.kick(SR), snap = I.snap(SR), shk = [I.shaker(SR, 1, 3), I.shaker(SR, 1, 4)];
    const bassPat = S.round % 2 ? [[0, 0, 6, 1], [6, 7, 2, 0.7], [8, 0, 4, 0.9], [12, 12, 2, 0.6], [14, 7, 2, 0.6]]
                             : [[0, 0, 3, 1], [3, 0, 1, 0.55], [6, 12, 2, 0.8], [8, 0, 3, 0.95], [11, 0, 1, 0.5], [14, 7, 2, 0.7]];
    for (let b = 0; b < S.bars; b++) {
      const ch = chordAt(S, b);
      if (s.kick) { P.write(drums, kick, at(b, 0), 0.52 * s.kick); P.write(drums, kick, at(b, 8), 0.46 * s.kick); if (S.round % 2 && b % 2) P.write(drums, kick, at(b, 14), 0.22 * s.kick); }
      if (s.snap) [4, 12].forEach((st) => { P.write(drums, snap, at(b, st), 0.26 * s.snap, 0.05); P.write(wet, snap, at(b, st), 0.09 * s.snap); });
      for (let st = 0; st < 16; st++) P.write(drums, shk[st % 2], at(b, st) + Math.round(hr() * 0.002 * SR), s.shk * 0.85 * (st % 4 === 2 ? 0.2 : st % 2 ? 0.08 : 0.11) * (1 + 0.15 * hr()), 0.35);
      if (s.bass) bassPat.forEach(([st, iv, len, v]) => P.write(bass, I.bass(SR, tr(ch.b, key, 31, 47) + iv, len * stepS * 0.9, v), at(b, st), 0.4 * s.bass));
      ch.pad.forEach((m) => { const [l, r] = I.pad(SR, tr(m, key, 50, 71), barS, (S.bar0 + b) * barS); P.write(pad, l, at(b, 0), 0.11, -0.7); P.write(pad, r, at(b, 0), 0.11, 0.7); });
    }
    // lead: the movement's air, developed
    if (s.lead) {
      let off = 0; const inst = mov.inst;
      s.lead.forEach((t, pi) => {
        const span = t === 'aug' ? 64 : 32;
        if (inst === 'pluck' || inst === 'pulse') { // arpeggiated airs follow the chords
          const pat = ARP[t], every = inst === 'pluck' ? 2 : 1;
          for (let st = 0; st < span; st += every) { const k = pat[(st / every) % 8]; if (k < 0) continue; const b = Math.floor((off + st) / 16), ch = chordAt(S, b);
            const m = tr(ch.pad[k] + 12, key, 62, 84), v = (st % 8 === 0 ? 1 : 0.75) * (1 + 0.08 * hr());
            P.write(lead, inst === 'pluck' ? I.pluck(SR, m, 0, v, idx * 64 + st) : I.pulse(SR, m, stepS * 0.9, v), at(0, off + st), 1); }
        } else if (inst === 'keys') { // chord stabs; derivations change rhythm and voicing
          PH.keys.a.forEach(({ s: st, len, v }, k) => {
            if (t === 'thin' && k % 2) return; if (t === 'aug' && k % 4) return;
            const s2 = (t === 'aug' ? st * 2 : st) + (t === 'disp' ? 1 : 0), b = Math.floor((off + s2) / 16), ch = chordAt(S, b);
            let vo = ch.pad.map((m) => tr(m + 12, key, 57, 79)); if (t !== 'o' && t !== 'thin' && t !== 'aug') vo = vo.slice(1).concat([vo[0] + 12]);
            vo.forEach((m, q) => P.write(lead, I.keys(SR, m, (t === 'aug' ? 6 : len) * stepS * 0.9, v * (q === 3 ? 1 : 0.7)), at(0, off + s2), 0.5));
          });
        } else fit(X[t](mov.theme), key, 57, 86).forEach(([st, m, len, v]) =>
          P.write(lead, I[inst](SR, m, len * stepS * 0.92, v * (1 + 0.06 * hr()) * (t === 'thin' ? 1 - pi * 0.12 : 1)), at(0, off + st), 1));
        if (inst === 'mallet') for (let st = 2; st < span; st += 4) P.write(lead, I.woodblock(SR), at(0, off + st), 0.3, 0.4);
        off += span;
      });
      const g = P.db(-18 + (s.lvl || 0) - kweightMS(lead, n)); for (let i = 0; i < N; i++) { lead.L[i] *= g; lead.R[i] *= g; }
    }
    // counter-melody: the previous movement's air, half speed, soft "ooh" (chime under the voice movement)
    if (s.counter) {
      const prev = LF.movements[(S.mi + LF.movements.length - 1) % LF.movements.length], air = Array.isArray(prev.theme) && prev.theme[0] && Array.isArray(prev.theme[0]) && !['pluck', 'pulse'].includes(prev.inst) ? prev.theme : chime;
      const cinst = mov.inst === 'voice' ? 'chime' : 'voice';
      [0, 64].forEach((off) => fit(X.aug(air), key, 55, 74).forEach(([st, m, len, v]) => P.write(counter, I[cinst](SR, m, len * stepS * 0.9, v * 0.8), at(0, off + st), 1)));
      const g = P.db(-26 - kweightMS(counter, n)); for (let i = 0; i < N; i++) { counter.L[i] *= g; counter.R[i] *= g; }
    }
    // sums: dry, reverb send, echo send
    const dry = P.bus(N), echo = P.bus(N);
    [drums, bass, pad].forEach((b) => P.mixInto(dry, b));
    for (let i = 0; i < N; i++) {
      const l = (lead.L[i] + lead.R[i]) * 0.5, c = (counter.L[i] + counter.R[i]) * 0.5, pn = S.mi % 2 ? 0.2 : -0.2;
      dry.L[i] += l * Math.cos((pn + 1) * Math.PI / 4) * Math.SQRT2 + c * 0.9; dry.R[i] += l * Math.sin((pn + 1) * Math.PI / 4) * Math.SQRT2 + c * 1.1;
      wet.L[i] += l * 0.28 + c * 0.4; wet.R[i] += l * 0.28 + c * 0.4; echo.L[i] += l * 0.22; echo.R[i] += l * 0.22;
    }
    return { n, dry, wet, echo };
  };

  // ---- streaming renderer (persistent FX state + tail carry-over)
  LF.stream = () => {
    const rev = P.reverb({ sr: SR, size: 0.86, damp: 0.5, hp: 200, lp: 5500 })(), dly = P.delay({ sr: SR, time: (60 / LF.BPM) * 0.75, fb: 0.3, lp: 2800 })();
    const eq = [P.rbjHighpass(30, 0.7, SR), P.rbjHighpass(30, 0.7, SR), P.rbjShelfHi(9000, -2, SR), P.rbjShelfHi(9000, -2, SR)];
    const kL = P.kweight(SR), kR = P.kweight(SR), hop = SR / 10; let hopAcc = 0, hopN = 0, hops = [], peak = 0;
    let carry = null;
    const clip = (x) => { const a = Math.abs(x), th = 0.6, c = 0.84; return a <= th ? x : Math.sign(x) * (th + (c - th) * Math.tanh((a - th) / (c - th))); };
    const api = {
      next(idx) {
        const { n, dry, wet, echo } = renderSection(idx), g = P.db(LF.GAIN_DB);
        if (carry) for (const k of ['dry', 'wet', 'echo']) { const d = { dry, wet, echo }[k]; for (let i = 0; i < TAIL; i++) { d.L[i] += carry[k].L[i]; d.R[i] += carry[k].R[i]; } }
        carry = {}; for (const [k, d] of Object.entries({ dry, wet, echo })) carry[k] = { L: d.L.slice(n), R: d.R.slice(n) };
        const L = new Float32Array(n), R = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const [el, er] = dly(echo.L[i], echo.R[i]); const [rl, rr] = rev(wet.L[i] + el * 0.35, wet.R[i] + er * 0.35);
          const l = eq[2](eq[0](dry.L[i] + el * 0.55 + rl * 1.1)) * g, r = eq[3](eq[1](dry.R[i] + er * 0.55 + rr * 1.1)) * g;
          L[i] = clip(l); R[i] = clip(r); const a = Math.max(Math.abs(l), Math.abs(r)); if (a > peak) peak = a;
          const kl = kL(L[i]), kr = kR(R[i]); hopAcc += kl * kl + kr * kr; if (++hopN === hop) { hops.push(hopAcc / hop); hopAcc = 0; hopN = 0; }
        }
        return { idx, L, R, t0: LF.plan[idx].t0 };
      },
      warm() { api.next(LF.plan.length - 1); hops = []; hopAcc = 0; hopN = 0; peak = 0; }, // end → start continuity
      stats() { const lk = (p) => -0.691 + 10 * Math.log10(Math.max(p, 1e-20)), bl = [];
        for (let i = 0; i + 4 <= hops.length; i++) bl.push((hops[i] + hops[i + 1] + hops[i + 2] + hops[i + 3]) / 4);
        const g1 = bl.filter((b) => lk(b) > -70), m1 = g1.reduce((a, b) => a + b, 0) / g1.length, g2 = g1.filter((b) => lk(b) > lk(m1) - 10);
        return { lufs: +lk(g2.reduce((a, b) => a + b, 0) / g2.length).toFixed(2), preClipPeakDb: +P.todb(peak).toFixed(2), seconds: (hops.length / 10) }; },
    };
    return api;
  };
})(globalThis);
