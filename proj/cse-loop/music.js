/* proj/cse-loop/music.js: the CSE hallway loop score (Oct 2026, full creative mode). Written for this piece only, on
   DHS.dsp (engine/src/audio/dsp.js); no shared instruments.
   120 BPM, one bar = 2 s, so every row of storyboard.md turns on a bar line and every block snap lands on a beat.
   Three directions for Bryan to pick by ear (storyboard.md, "Sound concept"):
     S1 Snap Groove  - bouncy: round plucked bass, FM electric piano, mallet melody doubled by the piano, light kit
     S2 Glass Lobby  - smooth late-80s fusion pop: slap-style bass, lush keys, clean guitar chops and hook, airy pad
     S3 Maker Bench  - interlocking mallets and plucked strings; the picture's own sounds tuned into the rhythm
   Style: globalThis.CSE_STYLE ('S1' | 'S2' | 'S3'). Sample mode (globalThis.CSE_SAMPLE): bars 1-8 only (0:00-0:16),
   rendered as a seamless 16-s loop. The full 48-s loop is written once Bryan picks a direction.
   Render: proj/cse-loop/render_samples.py (uses tools/render_piece.py). */
(function (G) {
  'use strict';
  const P = G.DHS.dsp, TAU = Math.PI * 2, ex = Math.exp, sin = Math.sin;
  const STYLE = G.CSE_STYLE || 'S1', SAMPLE = G.CSE_SAMPLE !== false, SNAP = G.CSE_SNAP || null;   // SNAP: 'wood' | 'mallet' | 'finger' overrides a style's snap sound
  const BPM = 120, BEAT = 60 / BPM, BAR = 4 * BEAT, BARS = SAMPLE ? 8 : 24, LEN = BARS * BAR;
  const tb = (bar, beat = 0) => (bar * 4 + beat) * BEAT;
  // picture cues from storyboard.md (seconds): block snaps, the ball turning red, where the line is drawing
  const CUES = {
    snaps: [2.0, 4.0, 5.0, 12.0, 12.5, 13.0],   // event block lands; two app blocks; three VEXcode blocks
    ballRed: 8.0, roadWipe: 10.0, carRolls: 13.5,
    lineDraws: [[0.0, 1.6], [5.2, 8.0], [9.6, 11.2]],
  };
  const TITLES = { S1: 'CSE loop: S1 Snap Groove', S2: 'CSE loop: S2 Glass Lobby', S3: 'CSE loop: S3 Maker Bench' };
  G.PIECE = { title: TITLES[STYLE] + (SNAP ? ' + ' + SNAP + ' snaps' : '') + (SAMPLE ? ' (sample)' : ''), length: LEN, bpm: BPM, cues: CUES, render };

  function render(sr) {
    const N = Math.round(LEN * sr), at = (t) => Math.round(t * sr), rnd = P.rng(4810), r01 = () => rnd() * 0.5 + 0.5;
    const dry = P.bus(N), rv = P.bus(N), dl = P.bus(N);
    // place a mono buffer or a stereo [L, R] pair at time t (circular: tails wrap round the loop point)
    const put = (x, t, g = 1, pan = 0, o = {}) => {
      const w = (buf, p) => { P.write(dry, buf, at(t), g, p); if (o.rv) P.write(rv, buf, at(t), g * o.rv, p); if (o.dl) P.write(dl, buf, at(t), g * o.dl, p); };
      if (Array.isArray(x)) { w(x[0], -1 * (o.width ?? 1)); w(x[1], 1 * (o.width ?? 1)); } else w(x, pan);
    };
    const gen = (dur, fn) => { const n = Math.max(1, at(dur)), b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = fn(i / sr); return b; };
    const fadeTail = (b) => { const k = Math.min(256, b.length); for (let i = 0; i < k; i++) b[b.length - 1 - i] *= i / k; return b; };

    // ---------------- drums ----------------
    const kick = (v = 1, low = 48) => { let ph = 0; return gen(0.45, (t) => { ph += (low + 110 * ex(-t / 0.025)) / sr; return v * sin(TAU * ph) * ex(-t / 0.22) * Math.min(1, t / 0.001); }); };
    const rim = () => { const bp = P.svf(); let ph = 0; return gen(0.12, (t) => { ph += 1650 / sr; return (0.5 * sin(TAU * ph) * ex(-t / 0.012) + bp(rnd(), 2400, 3, sr, 'bp') * ex(-t / 0.008)) * Math.min(1, t / 0.0005); }); };
    const shaker = (v = 1) => { const hp = P.svf(); return gen(0.12, (t) => v * hp(rnd(), 6500, 0.9, sr, 'hp') * Math.min(1, t / 0.008) * ex(-t / 0.035)); };
    const hat = (v = 1, d = 0.03) => { const hp = P.svf(); return gen(d * 6, (t) => v * hp(rnd(), 9000, 0.8, sr, 'hp') * ex(-t / d)); };
    const snare = () => { const bp = P.svf(); let ph = 0; return gen(0.26, (t) => { ph += (190 + 40 * ex(-t / 0.02)) / sr; const gate = t < 0.2 ? 1 : ex(-(t - 0.2) / 0.008);
      return gate * (0.5 * sin(TAU * ph) * ex(-t / 0.05) + 0.8 * bp(rnd(), 1900, 0.8, sr, 'bp') * (0.35 + 0.65 * ex(-t / 0.05))); }); };
    const clap = () => { const bp = P.svf(); return gen(0.3, (t) => { let e = 0.5 * ex(-t / 0.09); for (const o of [0, 0.011, 0.023]) if (t >= o) e += ex(-(t - o) / 0.006); return 1.3 * bp(rnd(), 1300, 1.4, sr, 'bp') * e; }); };
    // the block-snap sounds
    const woodClick = (m = 79) => { const f = P.mtof(m), bp = P.svf(); let a = 0, b = 0; return gen(0.18, (t) => { a += f / sr; b += f * 2.72 / sr;
      return (sin(TAU * a) * ex(-t / 0.028) + 0.35 * sin(TAU * b) * ex(-t / 0.009) + 0.4 * bp(rnd(), 3000, 2, sr, 'bp') * ex(-t / 0.002)) * Math.min(1, t / 0.0004); }); };
    const fingerSnap = () => { const bp = P.svf(), bp2 = P.svf(); return gen(0.2, (t) => (bp(rnd(), 2700, 1.8, sr, 'bp') * ex(-t / 0.014) + 0.4 * bp2(rnd(), 1200, 2, sr, 'bp') * ex(-t / 0.03)) * Math.min(1, t / 0.0006) * 1.6); };
    const tick = (m) => { const f = P.mtof(m); let a = 0; return gen(0.06, (t) => { a += f / sr; return sin(TAU * a) * ex(-t / 0.008) * Math.min(1, t / 0.0004); }); };

    // ---------------- pitched voices ----------------
    // FM electric piano: a soft bell-free tine (ratio 1 body, short ratio-14 tine), decaying brightness
    const ep = (m, dur, vel = 1, det = 0, bright = 1) => { const f = P.mtof(m) * Math.pow(2, det / 1200); let pc = 0, pm = 0, pt = 0;
      return fadeTail(gen(dur + 0.9, (t) => { pm += f / sr; pc += f / sr; pt += f * 14 / sr; const I = bright * vel * (1.1 * ex(-t / 0.3) + 0.22);
        const env = Math.min(1, t / 0.002) * ex(-t / 2.2) * (t < dur ? 1 : ex(-(t - dur) / 0.12));
        return env * vel * (sin(TAU * pc + I * sin(TAU * pm)) + 0.05 * bright * sin(TAU * pt) * ex(-t / 0.025)); })); };
    const epChord = (ms, t, dur, g, vel = 1, o = {}) => { for (const m of ms) put([ep(m, dur, vel, -4, o.bright ?? 1), ep(m, dur, vel, 4, o.bright ?? 1)], t + (o.strum || 0) * ms.indexOf(m), g / ms.length, 0, { rv: o.rv ?? 0.25, width: 0.7 }); };
    // marimba-like mallet: fundamental + the bar's 3.93x and 9.2x modes, decaying faster up high
    const mallet = (m, vel = 1) => { const f = P.mtof(m), d = Math.max(0.18, Math.min(0.7, 0.45 + (64 - m) * 0.02)); let a = 0, b = 0, c = 0;
      return fadeTail(gen(d * 4, (t) => { a += f / sr; b += f * 3.93 / sr; c += f * 9.2 / sr;
        return vel * Math.min(1, t / 0.0008) * (sin(TAU * a) * ex(-t / d) + 0.3 * sin(TAU * b) * ex(-t / (d * 0.16)) + 0.06 * sin(TAU * c) * ex(-t / 0.012)); })); };
    // round plucked bass (S1): sine body + low-passed saw for definition on small speakers
    const pluckBass = (m, dur) => { const f = P.mtof(m), lp = P.svf(); let ph = 0; return fadeTail(gen(dur + 0.08, (t) => { ph = (ph + f / sr) % 1;
      const a = Math.min(1, t / 0.003) * ex(-t / 0.5) * (t < dur ? 1 : ex(-(t - dur) / 0.02)); return a * (0.8 * sin(TAU * ph) + 0.45 * lp(P.saw(ph, f / sr), 180 + 900 * ex(-t / 0.06), 0.9, sr)); })); };
    // slap-style bass (S2): thumb (dark, punchy) or pop (an octave up, brighter)
    const slap = (m, dur, pop = false) => { const f = P.mtof(m), lp = P.svf(); let ph = 0; return fadeTail(gen(dur + 0.06, (t) => { ph = (ph + f / sr) % 1;
      const a = Math.min(1, t / 0.0015) * ex(-t / (pop ? 0.25 : 0.4)) * (t < dur ? 1 : ex(-(t - dur) / 0.02));
      const cut = pop ? 400 + 3800 * ex(-t / 0.05) : 200 + 2400 * ex(-t / 0.035);
      return a * (0.6 * sin(TAU * ph) + 0.55 * lp(P.saw(ph, f / sr), cut, 1.2, sr) + (t < 0.003 ? 0.3 * rnd() : 0)); })); };
    // plucked string (Karplus-Strong with a fractional delay): clean guitar, pizzicato
    const ks = (m, dur, o = {}) => { const f = P.mtof(m), L = sr / f, size = Math.ceil(L) + 4, b = new Float32Array(size), exc = P.onepole(), damp = P.onepole();
      const fb = o.fb ?? 0.997, bright = o.bright ?? 5000, rel = o.rel ?? 0.06, dc = P.rbjHighpass(40, 0.7, sr); let w = 0;
      return fadeTail(gen(dur + rel * 5, (t) => { const i = Math.round(t * sr), x = i < L ? exc(rnd(), bright, sr) : 0;
        let r = w - L; while (r < 0) r += size; const i0 = Math.floor(r), fr = r - i0, y0 = b[i0 % size], y1 = b[(i0 + 1) % size];
        const y = x + fb * damp(y0 + (y1 - y0) * fr, o.damp ?? 7000, sr) * (t < dur ? 1 : ex(-1 / (rel * sr)) ** 40);
        b[w] = y; w = (w + 1) % size; return dc(y) * (t < dur ? 1 : ex(-(t - dur) / rel)); })); };
    // airy pad: three detuned saws per note, dark low-pass, slow swell
    const pad = (ms, dur) => { const side = (sd) => { const lp = P.svf(), osc = []; for (const m of ms) for (let j = 0; j < 3; j++) osc.push({ f: P.mtof(m) * Math.pow(2, ((j - 1) * 9 + sd * 3) / 1200), ph: r01() });
      return fadeTail(gen(dur + 0.8, (t) => { let s = 0; for (const q of osc) { q.ph = (q.ph + q.f / sr) % 1; s += P.saw(q.ph, q.f / sr); }
        return Math.min(1, t / 0.45) * (t < dur ? 1 : ex(-(t - dur) / 0.35)) * lp(s, 1000 + 250 * sin(t * 1.3), 0.7, sr) / Math.sqrt(osc.length); })); };
      return [side(-1), side(1)]; };
    // the line's voice: a soft sine that glides through the points while the line draws (no riser: it wanders, never builds)
    const glide = (t0, t1, notes, g) => { const n = at(t1 - t0), b = new Float32Array(n), lp = P.onepole(); let ph = 0;
      for (let i = 0; i < n; i++) { const u = i / n * (notes.length - 1), k = Math.min(notes.length - 2, Math.floor(u)), fr = u - k, s = fr * fr * (3 - 2 * fr);
        const m = notes[k] + (notes[k + 1] - notes[k]) * s; ph = (ph + P.mtof(m) / sr) % 1; const env = sin(Math.PI * i / n) ** 1.5;
        b[i] = env * lp(sin(TAU * ph) + 0.12 * sin(2 * TAU * ph), 2400, sr); }
      put(b, t0, g, 0.15, { rv: 0.45, dl: 0.25 }); };

    // ================= the three directions (bars 1-8 = storyboard rows 1-3) =================
    if (STYLE === 'S1') {
      // F major. Fmaj9 | Dm9 | Bbmaj7 | C7sus C7 | F/A | Bb6/9 | Gm9 | C9
      const CH = [[57, 60, 64, 67], [53, 57, 60, 64], [58, 62, 65, 69], [[58, 60, 65, 67], [58, 60, 64, 67]], [57, 60, 64, 67], [58, 60, 62, 67], [58, 62, 65, 69], [58, 62, 64, 67]];
      const ROOT = [41, 38, 34, 36, 33, 34, 43, 36];
      const MEL = [[0, 2.5, 72, .5], [0, 3, 74, .5], [0, 3.5, 77, .5],
        [1, 0, 76, 1], [1, 1.5, 74, .5], [1, 2, 72, .5], [1, 2.5, 69, 1], [1, 3.5, 72, .5],
        [2, 0, 74, .75], [2, .75, 77, .75], [2, 1.5, 81, 1], [2, 2.5, 79, .5], [2, 3, 77, .5], [2, 3.5, 74, .5],
        [3, 0, 77, 1], [3, 1, 79, .5], [3, 1.5, 77, .5], [3, 2, 76, 1.5], [3, 3.5, 72, .5],
        [4, 0, 77, .5], [4, .5, 81, .5], [4, 1, 84, 1], [4, 2, 81, .5], [4, 2.5, 79, .5], [4, 3, 77, 1],
        [5, 0, 74, .5], [5, .5, 77, .5], [5, 1, 79, .75], [5, 1.75, 77, .75], [5, 2.5, 74, .5], [5, 3, 72, 1],
        [6, 0, 70, .5], [6, .5, 72, .5], [6, 1, 74, .5], [6, 1.5, 77, 1], [6, 2.5, 74, .5], [6, 3, 72, .5], [6, 3.5, 70, .5],
        [7, 0, 72, 1.5], [7, 1.5, 74, .5], [7, 2, 76, .5], [7, 2.5, 79, .5], [7, 3, 76, .5], [7, 3.5, 74, .5]];
      const COMP = [[0, .75], [1.5, .4], [2.5, .4], [3.25, .6]];
      const K = kick(1), RIM = rim(), SH = [shaker(1), shaker(0.55)];
      for (let bar = 0; bar < BARS; bar++) {
        const ch = CH[bar], r = ROOT[bar], next = ROOT[(bar + 1) % BARS];
        for (const [b, d] of COMP) { const v = Array.isArray(ch[0]) ? ch[b < 2 ? 0 : 1] : ch; epChord(v, tb(bar, b), d * BEAT, 0.5, b === 0 ? 0.9 : 0.7); }
        for (const [b, m, d, g] of [[0, r, .6, 1], [.75, r + 12, .2, .6], [1.5, r, .5, .85], [2.5, r + 7, .4, .8], [3, r + 12, .2, .55], [3.5, next + (next > r ? -1 : 1), .4, .7]])
          put(pluckBass(m, d * BEAT), tb(bar, b), 0.75 * g);
        for (const b of [0, 2]) put(K, tb(bar, b), 0.9); if (bar % 2) put(K, tb(bar, 3.5), 0.5);
        for (const b of [1, 3]) put(RIM, tb(bar, b), 0.35, -0.2, { rv: 0.15 });
        for (let s = 0; s < 16; s++) put(SH[s % 2], tb(bar, s / 4), 0.16, 0.35);
      }
      for (const [bar, b, m, d] of MEL) { put(mallet(m, 0.9), tb(bar, b), 0.32, 0.25, { rv: 0.2 }); put([ep(m - 12, d * BEAT, 0.6, -3), ep(m - 12, d * BEAT, 0.6, 3)], tb(bar, b), 0.1, 0, { rv: 0.2, width: 0.4 }); }
      CUES.snaps.forEach((t, i) => put(woodClick([79, 84, 81, 79, 84, 86][i]), t, 0.32, -0.1, { rv: 0.1 }));
      epChord([69, 72, 76, 79], CUES.ballRed, 0.2, 0.45, 1, { bright: 1.4 }); put(mallet(84), CUES.ballRed, 0.25, 0.3);
      glide(...CUES.lineDraws[0], [72, 77, 74], 0.05); glide(...CUES.lineDraws[1], [69, 72, 74, 77, 76, 72], 0.05); glide(...CUES.lineDraws[2], [77, 74, 72, 69], 0.05);
    }

    if (STYLE === 'S2') {
      // D major, laid back. Gmaj9 | F#m9 | Em9 | A13sus A13 | Dmaj9 | Bm9 | Em11 | A9sus
      const CH = [[59, 62, 66, 69], [57, 61, 64, 68], [55, 59, 62, 66], [[55, 59, 62, 66], [55, 59, 61, 66]], [54, 57, 61, 64], [57, 61, 62, 66], [55, 57, 62, 66], [55, 59, 62, 64]];
      const ROOT = [31, 30, 28, 33, 38, 35, 28, 33];
      const HOOK = [[0, 2.5, 69, .5], [0, 3, 71, .5], [0, 3.5, 74, .5],
        [1, 0, 73, 1.5], [1, 1.5, 71, .5], [1, 2, 69, 1], [1, 3, 66, 1],
        [2, 0, 67, .5], [2, .5, 71, .5], [2, 1, 74, 1], [2, 2, 76, .75], [2, 2.75, 74, .75], [2, 3.5, 71, .5],
        [3, 0, 73, 2], [3, 2, 71, .5], [3, 2.5, 69, .5], [3, 3, 73, .5], [3, 3.5, 76, .5],
        [4, 0, 78, 1.5], [4, 1.5, 76, .5], [4, 2, 73, 1], [4, 3, 69, .5], [4, 3.5, 71, .5],
        [5, 0, 74, .75], [5, .75, 73, .75], [5, 1.5, 69, 1], [5, 2.5, 66, .5], [5, 3, 69, 1],
        [6, 0, 71, .5], [6, .5, 74, .5], [6, 1, 76, .5], [6, 1.5, 79, 1], [6, 2.5, 78, .5], [6, 3, 76, 1],
        [7, 0, 74, 1], [7, 1, 76, .5], [7, 1.5, 73, 1], [7, 2.5, 71, .5], [7, 3, 69, 1]];
      const K = kick(1.1, 46), SN = snare(), HH = [hat(1), hat(0.45)], SNAPF = fingerSnap();
      for (let bar = 0; bar < BARS; bar++) {
        const ch = CH[bar], r = ROOT[bar], v2 = Array.isArray(ch[0]) ? ch : [ch, ch];
        epChord(v2[0], tb(bar, 0), 1.75 * BEAT, 0.42, 0.75, { strum: 0.012, bright: 0.8 }); epChord(v2[1], tb(bar, 2.5), 1.3 * BEAT, 0.34, 0.65, { strum: 0.012, bright: 0.8 });
        put(pad(v2[0].map((m) => m + 12), BAR), tb(bar), 0.09, 0, { rv: 0.5 });
        for (const b of [0.5, 1.75, 2.5, 3.5]) { const top = (b < 2 ? v2[0] : v2[1]).slice(1).map((m) => m + 12);
          top.forEach((m, k) => put(ks(m, 0.1, { bright: 4500, fb: 0.995, rel: 0.03 }), tb(bar, b) + k * 0.006, 0.13, 0.55 - k * 0.1, { rv: 0.15, dl: 0.12 })); }
        for (const [b, m, d, p] of [[0, r, .7, 0], [.75, r, .15, 0], [1.5, r + 12, .3, 1], [2, r, .5, 0], [2.75, r + 7, .3, 0], [3.5, r + 12, .3, 1]])
          put(slap(m, d * BEAT, !!p), tb(bar, b), p ? 0.42 : 0.62, 0);
        for (const b of [0, 1.75, 2.5]) put(K, tb(bar, b), b ? 0.7 : 0.95);
        for (const b of [1, 3]) put(SN, tb(bar, b), 0.4, 0.05, { rv: 0.55 });
        for (let s = 0; s < 16; s++) put(HH[s % 2 ? 1 : 0], tb(bar, s / 4) + (s % 2 ? 0.012 : 0), 0.09, -0.3);
      }
      for (const [bar, b, m, d] of HOOK) {
        put(ks(m + 12, d * BEAT, { bright: 6500, fb: 0.998, rel: 0.12 }), tb(bar, b), 0.3, 0.2, { rv: 0.3, dl: 0.2 });
        put([ep(m, d * BEAT, 0.7, -5, 0.9), ep(m, d * BEAT, 0.7, 5, 0.9)], tb(bar, b), 0.14, 0, { rv: 0.3, width: 0.5 });
      }
      // the snap sound: finger snap (original), or Bryan's Oct 25 asks: S1's wooden click or S3's mallet, tuned to D major
      const SNAPNOTES = [81, 83, 86, 81, 83, 86];
      CUES.snaps.forEach((t, i) => {
        if (SNAP === 'wood') put(woodClick(SNAPNOTES[i]), t, 0.34, 0.15, { rv: 0.15 });
        else if (SNAP === 'mallet') { put(mallet(SNAPNOTES[i], 1), t, 0.4, 0.2, { rv: 0.25 }); put(mallet(SNAPNOTES[i] + 12, 0.5), t + 0.004, 0.12, 0.3); }
        else put(SNAPF, t, 0.35, 0.3, { rv: 0.35 }); });
      epChord([66, 69, 73, 76], CUES.ballRed, 0.5, 0.35, 0.9, { strum: 0.02 });
      glide(...CUES.lineDraws[0], [74, 78, 76], 0.04); glide(...CUES.lineDraws[1], [69, 73, 76, 78, 74], 0.04); glide(...CUES.lineDraws[2], [76, 73, 71, 69], 0.04);
    }

    if (STYLE === 'S3') {
      // G major, interlocking. Em9 | Cmaj7 | G/B | Am7 D9 | Em9 | Cmaj7#11 | Am9 | Bsus4 B7
      const CH = [[64, 67, 71, 74, 78], [60, 64, 67, 71, 74], [59, 62, 67, 71, 74], [[57, 60, 64, 67, 72], [57, 60, 62, 66, 69]],
        [64, 67, 71, 74, 78], [60, 64, 66, 67, 71], [57, 60, 64, 67, 71], [[59, 64, 66, 69, 71], [59, 63, 66, 69, 71]]];
      const ROOT = [40, 36, 35, 33, 40, 36, 33, 35], ROOT2 = [40, 36, 35, 38, 40, 36, 33, 35];
      const K = kick(0.8, 52), CL = clap();
      for (let bar = 0; bar < BARS; bar++) {
        const ch = CH[bar], half = (b) => (Array.isArray(ch[0]) ? ch[b < 2 ? 0 : 1] : ch);
        // mallet A: a 3-note cell every dotted eighth (3 against 4), always on
        for (let k = 0; k < 6; k++) { const b = k * 0.75; if (b >= 4) break; const c = half(b); put(mallet(c[[0, 2, 4][k % 3]] + 0, 0.85), tb(bar, b), 0.3, -0.45, { rv: 0.18 }); }
        // mallet B: eighths in another order, from bar 3 (after the first app blocks snap)
        if (bar >= 2) for (let k = 0; k < 8; k++) { const c = half(k / 2); put(mallet(c[[1, 3, 2, 4, 1, 3, 0, 2][k]] + 12, 0.6), tb(bar, k / 2), 0.22, 0.45, { rv: 0.18 }); }
        // plucked-string bass from bar 3
        if (bar >= 2) for (const [b, d] of [[0, .9], [1.5, .5], [3, .7]]) put(ks((b < 2 ? ROOT : ROOT2)[bar], d * BEAT, { bright: 1800, fb: 0.994, rel: 0.05 }), tb(bar, b), 0.75, 0);
        // pizzicato chord answers on the off-beats from bar 5
        if (bar >= 4) for (const b of [1.5, 3.5]) half(b).slice(1, 4).forEach((m, k) => put(ks(m, 0.12, { bright: 3000, fb: 0.99, rel: 0.03 }), tb(bar, b) + k * 0.008, 0.16, 0.2 - k * 0.2, { rv: 0.2 }));
        // claps and a soft kick join when the road appears (bar 6)
        if (bar >= 5) { for (const b of [1, 3]) put(CL, tb(bar, b), 0.32, 0.1, { rv: 0.25 }); for (const b of [0, 2.5]) put(K, tb(bar, b), 0.8); }
      }
      // the picture's sounds, tuned and kept: each snap's click comes back on beat 3.5 from then on (the beat gets built)
      const CLICK = [79, 83, 86, 79, 83, 86];
      CUES.snaps.forEach((t, i) => { put(woodClick(CLICK[i]), t, 0.34, -0.15 + i * 0.06, { rv: 0.1 });
        for (let tt = t + 2; tt < LEN; tt += 2) put(woodClick(CLICK[i]), Math.floor(tt / BAR) * BAR + 3.5 * BEAT * (i % 2 ? 0.5 : 1) + (i > 2 ? BEAT * 0.25 : 0), 0.12, -0.15 + i * 0.06); });
      put(mallet(83, 1), CUES.ballRed, 0.3, 0.3); put(mallet(88, 0.8), CUES.ballRed + 0.125, 0.2, 0.4);
      // the car: a tuned sixteenth tick that follows it once it rolls
      for (let t = CUES.carRolls; t < LEN; t += BEAT / 4) put(tick([86, 79, 83, 79][Math.round(t / (BEAT / 4)) % 4]), t, 0.1, 0.5);
    }

    // ---------------- mix: reverb + delay sends, run circularly so tails cross the loop point ----------------
    const R = P.circular(rv, P.reverb({ sr, size: 0.8, damp: 0.5, lp: 7000 }));
    const D = P.circular(dl, P.delay({ sr, time: BEAT * 0.75, fb: 0.3, lp: 3500 }));
    const out = P.bus(N), hp = P.rbjHighpass(32, 0.7, sr), hp2 = P.rbjHighpass(32, 0.7, sr);
    for (let i = 0; i < N; i++) { out.L[i] = hp(dry.L[i] + R.L[i] * 0.9 + D.L[i] * 0.5); out.R[i] = hp2(dry.R[i] + R.R[i] * 0.9 + D.R[i] * 0.5); }
    return out;
  }
})(globalThis);
