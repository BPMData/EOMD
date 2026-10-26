/* proj/cse-loop/music.js: the CSE hallway loop score (Oct 2026, full creative mode). Written for this piece only, on
   DHS.dsp (engine/src/audio/dsp.js); no shared instruments.
   120 BPM, one bar = 2 s, so every row of storyboard.md turns on a bar line and every block snap lands on a beat.
   Three directions for Bryan to pick by ear (storyboard.md, "Sound concept"):
     S1 Snap Groove  - bouncy: round plucked bass, FM electric piano, mallet melody doubled by the piano, light kit
     S2 Glass Lobby  - smooth late-80s fusion pop: slap-style bass, lush keys, clean guitar chops and hook, airy pad
     S3 Maker Bench  - interlocking mallets and plucked strings; the picture's own sounds tuned into the rhythm
   Style: globalThis.CSE_STYLE ('S1' | 'S2' | 'S3'). Sample mode (globalThis.CSE_SAMPLE): bars 1-8 only (0:00-0:16).
   Bryan picked S2 + mallet snaps + tight snare (Oct 25); S2 is written for all 24 bars (48 s). S1 and S3 are still the
   8-bar samples (S3 gets its full version last, as a second player).
   Render: proj/cse-loop/render_samples.py (uses tools/render_piece.py). */
(function (G) {
  'use strict';
  const P = G.DHS.dsp, TAU = Math.PI * 2, ex = Math.exp, sin = Math.sin;
  const STYLE = G.CSE_STYLE || 'S2', SAMPLE = G.CSE_SAMPLE === true, SNAP = G.CSE_SNAP || 'mallet', SNARE = G.CSE_SNARE || 'tight';   // defaults = Bryan's pick (Oct 25): S2 + mallet snaps + tight snare   // SNARE (S2): 'gated' (brushy; rejected) | 'stick' | 'tight'   // SNAP: 'wood' | 'mallet' | 'finger' overrides a style's snap sound
  const BPM = 120, BEAT = 60 / BPM, BAR = 4 * BEAT, BARS = SAMPLE ? 8 : 24, LEN = BARS * BAR;
  const tb = (bar, beat = 0) => (bar * 4 + beat) * BEAT;
  // picture cues from storyboard.md (seconds): block snaps, the ball turning red, where the line is drawing
  // picture cues (seconds), from src/film.js: keep them in step when the film's timing changes
  const CUES = {
    snaps: [2.0, 4.0, 5.0, 12.0, 12.6, 15.6, 16.0, 25.4, 25.9, 26.4, 31.0, 32.3, 32.6, 33.8],  // every block or code strip that snaps in
    snapGroups: [2.0, 12.0, 25.4, 31.0],                                                        // first snap of each scene
    pyLines: [19.4, 20.5, 21.6],                                                                // each Python line starts typing
    // tap = the ring on "Tap me!"
    tap: 7.85, ballRed: 8.0, carRolls: 13.2, stall: [15.0, 16.0], carOff: [17.6, 18.9], typing: [19.4, 22.7], redRise: 24.0,
    drips: [27.4, 29.4], smile: [29.0, 29.6], takeoff: 31.0, burst: 38.75, settle: 41.0, cardOut: 46.0,
    lineDraws: [[5.2, 7.4], [9.6, 11.2], [18.0, 18.8], [25.2, 26.0], [30.5, 31.0], [46.8, 49.2]],
  };
  const TITLES = { S1: 'CSE loop: S1 Snap Groove', S2: 'CSE loop: S2 Glass Lobby', S3: 'CSE loop: S3 Maker Bench' };
  G.PIECE = { title: TITLES[STYLE] + (SNAP ? ' + ' + SNAP + ' snaps' : '') + (G.CSE_SNARE ? ' + ' + SNARE + ' snare' : '') + (SAMPLE ? ' (sample)' : ''), length: LEN, bpm: BPM, cues: CUES, render };

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
    // cross-stick: a woody knock, almost no noise (fits the mallet snaps)
    const crossStick = () => { const bp = P.svf(); let a = 0, b = 0; return gen(0.15, (t) => { a += 540 / sr; b += 1620 / sr;
      return (0.8 * sin(TAU * a) * ex(-t / 0.025) + 0.35 * sin(TAU * b) * ex(-t / 0.01) + 0.5 * bp(rnd(), 3200, 2.5, sr, 'bp') * ex(-t / 0.003)) * Math.min(1, t / 0.0004); }); };
    // tight snare: more drum body, a short bright crack, no long noise tail
    const tightSnare = () => { const bp = P.svf(); let ph = 0; return gen(0.2, (t) => { ph += (210 + 70 * ex(-t / 0.012)) / sr;
      return (0.85 * sin(TAU * ph) * ex(-t / 0.07) + 0.55 * bp(rnd(), 3600, 1.1, sr, 'bp') * ex(-t / 0.028)) * Math.min(1, t / 0.0006); }); };
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
      return a * (0.45 * sin(TAU * ph) + 0.55 * lp(P.saw(ph, f / sr), cut, 1.2, sr) + (t < 0.003 ? 0.3 * rnd() : 0)); })); };   // sub trimmed for TV speakers (Oct 25)
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
      CUES.snaps.forEach((t, i) => { if (t < LEN) put(woodClick([79, 84, 81, 79, 84, 86][i % 6]), t, 0.32, -0.1, { rv: 0.1 }); });
      epChord([69, 72, 76, 79], CUES.ballRed, 0.2, 0.45, 1, { bright: 1.4 }); put(mallet(84), CUES.ballRed, 0.25, 0.3);
      glide(...CUES.lineDraws[0], [69, 72, 74, 77, 76, 72], 0.05); glide(...CUES.lineDraws[1], [77, 74, 72, 69], 0.05);
    }

    if (STYLE === 'S2') {
      // D major, laid back; lifts to E for the Academy part (bars 12-18), back to D for the end card.
      const P8 = [[59, 62, 66, 69], [57, 61, 64, 68], [55, 59, 62, 66], [[55, 59, 62, 66], [55, 59, 61, 66]], [54, 57, 61, 64], [57, 61, 62, 66], [55, 57, 62, 66], [55, 59, 62, 64]];
      const R8 = [31, 30, 28, 33, 38, 35, 28, 33];
      const tr = (c, k) => Array.isArray(c[0]) ? c.map((h) => h.map((m) => m + k)) : c.map((m) => m + k);
      const PIVOT_B = [[57, 61, 64, 66], [57, 61, 63, 68]], A9SUS = [55, 59, 62, 64];
      const CH = [...P8, P8[0], P8[1], P8[2], PIVOT_B, ...P8.slice(0, 6).map((c) => tr(c, 2)), A9SUS, P8[0], P8[1], P8[2], P8[3], P8[7]];
      const ROOT = [...R8, R8[0], R8[1], R8[2], 35, ...R8.slice(0, 6).map((r) => r + 2), 33, R8[0], R8[1], R8[2], R8[3], R8[7]];
      // per bar: drums 'full' | 'stall' | 'half' | 'breath' | 'fill'
      const DR = (b) => b === 7 ? 'stall' : b === 15 || b === 16 ? 'half' : b >= 19 && b <= 22 ? 'breath' : b === 23 ? 'fill' : 'full';
      const HOOK = [[0, 2.5, 69, .5], [0, 3, 71, .5], [0, 3.5, 74, .5],
        [1, 0, 73, 1.5], [1, 1.5, 71, .5], [1, 2, 69, 1], [1, 3, 66, 1],
        [2, 0, 67, .5], [2, .5, 71, .5], [2, 1, 74, 1], [2, 2, 76, .75], [2, 2.75, 74, .75], [2, 3.5, 71, .5],
        [3, 0, 73, 2], [3, 2, 71, .5], [3, 2.5, 69, .5], [3, 3, 73, .5], [3, 3.5, 76, .5],
        [4, 0, 78, 1.5], [4, 1.5, 76, .5], [4, 2, 73, 1], [4, 3, 69, .5], [4, 3.5, 71, .5],
        [5, 0, 74, .75], [5, .75, 73, .75], [5, 1.5, 69, 1], [5, 2.5, 66, .5], [5, 3, 69, 1],
        [6, 0, 71, .5], [6, .5, 74, .5], [6, 1, 76, .5], [6, 1.5, 79, 1], [6, 2.5, 78, .5], [6, 3, 76, 1],
        [7, 0, 74, 1], [7, 1, 76, .5]];                                   // bar 7 stops short: the car stalls
      const COUNTER = [[8, 0, 62, 1], [8, 1, 64, .5], [8, 1.5, 66, 1], [8, 2.5, 69, 1.5], [9, 0, 68, 1], [9, 1, 66, .5], [9, 1.5, 64, 1], [9, 2.5, 61, 1.5],
        [10, 0, 62, .5], [10, .5, 64, .5], [10, 1, 67, 1], [10, 2, 66, .5], [10, 2.5, 64, .5], [10, 3, 62, 1], [11, 0, 63, 1.5], [11, 1.5, 64, .5]];
      const LIFT = HOOK.filter((n) => n[0] <= 3).map(([b, bt, m, d]) => [b + 12, bt, m + 2, d]);   // the hook again, a step up
      const SOLO = [[16, 0, 76], [16, .25, 78], [16, .5, 80], [16, .75, 83], [16, 1, 85], [16, 1.25, 88], [16, 1.5, 85], [16, 1.75, 83],
        [16, 2, 80], [16, 2.25, 83], [16, 2.5, 85], [16, 2.75, 88], [16, 3, 90], [16, 3.25, 88], [16, 3.5, 85], [16, 3.75, 83]].map((n) => [...n, 0.3])
        .concat([[17, 0, 85, 1], [17, 1, 83, .5], [17, 1.5, 80, .5], [17, 2, 78, 1], [17, 3, 76, 1]]);
      const K = kick(1.1, 46), SN = SNARE === 'stick' ? crossStick() : SNARE === 'tight' ? tightSnare() : snare(), SNRV = SNARE === 'gated' ? 0.55 : 0.18, HH = [hat(1), hat(0.45)], SNAPF = fingerSnap();
      const inStall = (t) => t >= 15.0 && t < 16.0;
      for (let bar = 0; bar < BARS; bar++) {
        const ch = CH[bar], r = ROOT[bar], v2 = Array.isArray(ch[0]) ? ch : [ch, ch], dr = DR(bar), breath = dr === 'breath';
        const keep = (t) => !inStall(t);
        // keys and pad
        if (keep(tb(bar, 0))) epChord(v2[0], tb(bar, 0), (bar === 7 ? 3 : 1.75) * BEAT, breath ? 0.36 : 0.42, 0.75, { strum: 0.012, bright: 0.8 });
        if (keep(tb(bar, 2.5))) epChord(v2[1], tb(bar, 2.5), 1.3 * BEAT, breath ? 0.3 : 0.34, 0.65, { strum: 0.012, bright: 0.8 });
        put(pad(v2[0].map((m) => m + 12), BAR), tb(bar), breath || bar === 7 ? 0.17 : 0.09, 0, { rv: 0.5 });
        // clean guitar chops (out for the breather)
        if (!breath) for (const b of [0.5, 1.75, 2.5, 3.5]) { if (!keep(tb(bar, b))) continue; const top = (b < 2 ? v2[0] : v2[1]).slice(1).map((m) => m + 12);
          top.forEach((m, k) => put(ks(m, 0.1, { bright: 4500, fb: 0.995, rel: 0.03 }), tb(bar, b) + k * 0.006, 0.13, 0.55 - k * 0.1, { rv: 0.15, dl: 0.12 })); }
        // bass: the groove; held through the stall; simple in the breather
        const BASS = breath ? [[0, r, 1.8, 0], [2, r + 7, 1.8, 0]] : bar === 7 ? [[0, r, .7, 0], [.75, r, .15, 0], [1.5, r + 12, .3, 1], [2, r, 2, 0]]
          : [[0, r, .7, 0], [.75, r, .15, 0], [1.5, r + 12, .3, 1], [2, r, .5, 0], [2.75, r + 7, .3, 0], [3.5, r + 12, .3, 1]];
        for (const [b, m, d, p] of BASS) put(slap(m, d * BEAT, !!p), tb(bar, b), p ? 0.42 : 0.62, 0);
        // drums
        const kicks = dr === 'half' ? [0] : dr === 'breath' ? [] : dr === 'fill' ? [0, 1.75, 2.5, 3, 3.5] : [0, 1.75, 2.5];
        const snares = dr === 'half' ? [2] : dr === 'breath' ? [] : dr === 'fill' ? [1, 3, 3.25, 3.5, 3.75] : [1, 3];
        for (const b of kicks) if (keep(tb(bar, b))) put(K, tb(bar, b), b ? 0.7 : 0.95);
        for (const b of snares) if (keep(tb(bar, b))) put(SN, tb(bar, b), b % 1 ? 0.28 : 0.4, 0.05, { rv: SNRV });
        for (let s = 0; s < 16; s++) { const tt = tb(bar, s / 4); if (!keep(tt)) continue; if (dr === 'half' && s % 2) continue; if (breath && s % 2) continue;
          put(HH[s % 2 ? 1 : 0], tt + (s % 2 ? 0.012 : 0), breath ? 0.06 : 0.09, -0.3); }
      }
      // the stall's way out: a short fill into bar 9 as the velocity block snaps
      for (const [b, g] of [[3.0, 0.22], [3.25, 0.26], [3.5, 0.3], [3.75, 0.34]]) put(SN, tb(7, b), g, 0.1, { rv: SNRV });
      // melodies: hook (guitar + soft keys an octave down), counter-line, the hook a step up, a short solo
      const lead = (list, gGtr, gKeys, bright = 6500) => { for (const [bar, b, m, d] of list) { if (bar >= BARS) continue;
        put(ks(m + 12, d * BEAT, { bright, fb: 0.998, rel: 0.12 }), tb(bar, b), gGtr, 0.2, { rv: 0.3, dl: 0.2 });
        if (gKeys) put([ep(m, d * BEAT, 0.7, -5, 0.9), ep(m, d * BEAT, 0.7, 5, 0.9)], tb(bar, b), gKeys, 0, { rv: 0.3, width: 0.5 }); } };
      lead(HOOK, 0.3, 0.14); lead(COUNTER, 0.24, 0.16, 4500); lead(LIFT, 0.3, 0.14); lead(SOLO, 0.26, 0, 7000);
      // ---- the picture's moments ----
      const chordAt = (t) => { const bar = Math.floor(t / BAR) % BARS, c = CH[bar]; return Array.isArray(c[0]) ? c[(t % BAR) < BAR / 2 ? 0 : 1] : c; };
      // snaps climb the pentatonic within each scene (Bryan: "always ... ascending"); scenes start where CUES.snapGroups says
      const PENT = (t) => (t >= 24 && t < 38 ? [76, 78, 80, 83, 85, 88] : [74, 76, 78, 81, 83, 86]);   // E section / D
      CUES.snaps.forEach((t, i) => { if (t >= LEN) return; const g = CUES.snapGroups.filter((s0) => s0 <= t).pop(), k = CUES.snaps.filter((s) => s >= g && s < t).length, m = PENT(t)[k];
        if (SNAP === 'wood') put(woodClick(m), t, 0.34, 0.15, { rv: 0.15 });
        else if (SNAP === 'mallet') { put(mallet(m, 1), t, 0.4, 0.2, { rv: 0.25 }); put(mallet(m + 12, 0.5), t + 0.004, 0.12, 0.3); }
        else put(SNAPF, t, 0.35, 0.3, { rv: 0.35 }); });
      // the Python lines: the mirror of the snaps, a mallet stepping down the scale for each line (Bryan, Oct 25)
      CUES.pyLines.forEach((t, i) => { if (t >= LEN) return; const m = [85, 83, 81][i]; /* C#, B, A: fit F#m9 then Em9 */ put(mallet(m, 1), t, 0.4, -0.2, { rv: 0.25 }); put(mallet(m + 12, 0.5), t + 0.004, 0.12, -0.3); });
      // the tap on "Tap me!": a quiet wooden click, not a mallet (Bryan, Oct 25)
      if (CUES.tap < LEN) put(woodClick(81), CUES.tap, 0.18, 0.25, { rv: 0.12 });
      if (CUES.ballRed < LEN) epChord([66, 69, 73, 76], CUES.ballRed, 0.5, 0.35, 0.9, { strum: 0.02 });
      // the car: a low hum far back, straining a little in the stall
      if (!SAMPLE) {
        const hum = (() => { const n = at(CUES.carOff[1] - CUES.carRolls), b = new Float32Array(n), lp = P.onepole(); let ph = 0;
          for (let i = 0; i < n; i++) { const t = CUES.carRolls + i / sr, strain = t > 14.8 && t < 16.0 ? 1 + 0.12 * Math.sin((t - 14.8) * 22) : t >= 16.0 ? 1.25 : 1;
            ph = (ph + 62 * strain / sr) % 1; const env = Math.min(1, i / (0.4 * sr)) * Math.min(1, (n - i) / (0.6 * sr));
            b[i] = env * lp(Math.sin(TAU * ph) + 0.35 * Math.sin(2 * TAU * ph) + 0.15 * Math.sin(3 * TAU * ph), 600, sr); } return b; })();
        put(hum, CUES.carRolls, 0.07, -0.1);
        // typing: soft ticks on the eighths while the Python types
        for (let t = CUES.typing[0]; t < CUES.typing[1]; t += BEAT / 2) put(tick(91 + (Math.round(t * 4) % 3) * 2), Math.round(t / (BEAT / 2)) * (BEAT / 2), 0.06, 0.4);
        // the pump: water-drop plucks on the eighths, falling
        let k = 0; for (let t = CUES.drips[0]; t < CUES.drips[1]; t += BEAT / 2, k++) { const m = [88, 85, 83, 80][k % 4];
          put(ks(m, 0.15, { bright: 6000, fb: 0.99, rel: 0.05 }), Math.round(t / (BEAT / 2)) * (BEAT / 2), 0.12, 0.3, { rv: 0.3 }); }
        // the smile: one soft pop per row of lights
        for (let i = 0; i < 5; i++) put(mallet(76 + [0, 2, 4, 7, 9][i] + 2, 0.5), CUES.smile[0] + i * 0.12, 0.14, 0.35, { rv: 0.3 });
        // the drone: a soft whir that rises at takeoff and fades as it bursts
        const whir = (() => { const t0 = CUES.takeoff, n = at(CUES.burst - t0 + 0.3), b = new Float32Array(n), bp = P.svf(); let ph = 0;
          for (let i = 0; i < n; i++) { const t = t0 + i / sr, rise = 0.85 + 0.3 * Math.min(1, (t - t0) / 1.2);
            ph = (ph + 31 * rise / sr) % 1; const am = 0.75 + 0.25 * Math.sin(TAU * ph), env = Math.min(1, i / (0.5 * sr)) * (t > CUES.burst ? Math.max(0, 1 - (t - CUES.burst) / 0.3) : 1);
            b[i] = env * am * bp(rnd(), 420 * rise, 2.2, sr, 'bp'); } return b; })();
        put(whir, CUES.takeoff, 0.22, 0.25);
        // the burst: a wide soft chord, then mallets swirling down as the dots swirl, landing as the title settles
        epChord([62, 66, 69, 73, 76], CUES.burst, 1.4, 0.4, 0.8, { strum: 0.03, rv: 0.5 });
        const swirl = [86, 83, 81, 78, 76, 74, 71, 69, 66, 69, 71, 74, 76, 78, 81];
        swirl.forEach((m, i) => put(mallet(m, 0.7 - i * 0.02), CUES.burst + 0.1 + i * (CUES.settle - CUES.burst - 0.2) / swirl.length, 0.16, (i % 2 ? 0.5 : -0.5), { rv: 0.35, dl: 0.2 }));
        epChord([59, 62, 66, 69, 74], CUES.settle, 1.6, 0.42, 0.85, { strum: 0.02, rv: 0.4 }); put(mallet(81, 0.9), CUES.settle, 0.22, 0, { rv: 0.4 });
      }
      // the line's voice while it draws
      for (const [a, b] of CUES.lineDraws) if (a < LEN) { const c = chordAt(a).map((m) => m + 12); glide(a, b, [c[1], c[3], c[2], c[0] + 12].slice(0, 2 + Math.round((b - a) / 1.2)), 0.04); }
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
      CUES.snaps.filter((t) => t < LEN).slice(0, 6).forEach((t, i) => { put(woodClick(CLICK[i]), t, 0.34, -0.15 + i * 0.06, { rv: 0.1 });
        for (let tt = t + 2; tt < LEN; tt += 2) put(woodClick(CLICK[i]), Math.floor(tt / BAR) * BAR + 3.5 * BEAT * (i % 2 ? 0.5 : 1) + (i > 2 ? BEAT * 0.25 : 0), 0.12, -0.15 + i * 0.06); });
      put(mallet(83, 1), CUES.ballRed, 0.3, 0.3); put(mallet(88, 0.8), CUES.ballRed + 0.125, 0.2, 0.4);
      // the car: a tuned sixteenth tick that follows it once it rolls
      for (let t = CUES.carRolls; t < LEN; t += BEAT / 4) put(tick([86, 79, 83, 79][Math.round(t / (BEAT / 4)) % 4]), t, 0.1, 0.5);
    }

    // ---------------- mix: reverb + delay sends, run circularly so tails cross the loop point ----------------
    const R = P.circular(rv, P.reverb({ sr, size: 0.8, damp: 0.5, lp: 7000 }));
    const D = P.circular(dl, P.delay({ sr, time: BEAT * 0.75, fb: 0.3, lp: 3500 }));
    const mix = P.bus(N);
    for (let i = 0; i < N; i++) { mix.L[i] = dry.L[i] + R.L[i] * 0.9 + D.L[i] * 0.5; mix.R[i] = dry.R[i] + R.R[i] * 0.9 + D.R[i] * 0.5; }
    // low cut, run round the loop too (a one-pass filter starts from silence and clicks at the loop point)
    return P.circular(mix, () => { const a = P.rbjHighpass(32, 0.7, sr), b = P.rbjHighpass(32, 0.7, sr); return (l, r) => [a(l), b(r)]; });
  }
})(globalThis);
