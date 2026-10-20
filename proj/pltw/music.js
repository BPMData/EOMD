/* proj/pltw/music.js: "PLTW CSE", the one-off 60-second score for the gen cartridge pltw-cse (Oct 2026, full creative mode).
   Written to picture, 120 BPM, A minor: every hit lands on a moment in gen/carts/pltw-cse.json (CUES below; keep them in step).
     0-10  BOOT     data chatter over a rising drone; blip clouds as the dots fly into a sphere, then into PLTW; impact; riser
    10-24  TUNNEL   four-on-the-floor drop, rolling bass, arp; crash + stab each time a word bursts past the camera;
                    stop-time stabs on CODE / BUILD / DRIVE
    24-36  DRIVE    motorik groove, pulsing bass; a lidar ping on every sweep; blip clouds as words lift off the floor
    36-48  TILES    chiptune: square-wave lead and bass, a broken beat, tile-flip tick runs when the maze spells a word
    48-60  FINALE   blip cloud into PLTW, full drop, blip cloud into the title, last chord rings out
   Self-contained synths on DHS.dsp (engine/src/audio/dsp.js) only: no shared instruments, so nothing here can change another
   piece. Render with tools/render_piece.py (PIECE = 'proj/pltw/music.js') -> gen/audio/pltw-cse.mp3, -16 LUFS, -1.5 dBTP. */
(function (G) {
  'use strict';
  const P = G.DHS.dsp, TAU = Math.PI * 2, ex = Math.exp;
  const BPM = 120, BEAT = 60 / BPM, BAR = 4 * BEAT, S16 = BEAT / 4, LEN = 60;
  // picture cues, seconds from the start of the video (from the cartridge's shot starts + key/word times)
  const CUES = {
    sphere: [2.0, 3.6], pltw: [4.6, 6.0], burst: 8.8, tunnel: 10, wordBursts: [14, 16, 18], codeBuildDrive: [20, 21, 22],
    floor: 24, floorWords: [[25.0, 26.5], [28.5, 30.0], [32.0, 33.5]], floorOff: [35.0, 36.0],
    tiles: 36, flips: [[36.6, 37.4, 1], [41.2, 42.0, -1], [42.0, 42.6, 1]], tilesOff: 47.3,
    finale: 48, finalWords: [[48.8, 50.0], [52.6, 54.0]],
  };
  G.PIECE = { title: 'PLTW CSE', length: LEN, bpm: BPM, cues: CUES, render };

  function render(sr) {
    const N = Math.round((LEN + 4) * sr), at = (t) => Math.round(t * sr), rnd = P.rng(2026), r01 = () => rnd() * 0.5 + 0.5;
    const dry = P.bus(N), side = P.bus(N), rv = P.bus(N), dl = P.bus(N), kicks = [];
    // place a mono (Float32Array) or stereo ([L, R]) sound at time t. duck = on the bus the kick pumps; rv / dl = send levels
    const put = (x, t, g = 1, pan = 0, o = {}) => {
      if (t < 0 || t >= LEN + 2) return;
      const b = o.duck ? side : dry;
      const w = (buf, p) => { P.write(b, buf, at(t), g, p); if (o.rv) P.write(rv, buf, at(t), g * o.rv, p); if (o.dl) P.write(dl, buf, at(t), g * o.dl, p); };
      if (Array.isArray(x)) { w(x[0], -1); w(x[1], 1); } else w(x, pan);
    };
    const gen = (dur, fn) => { const n = Math.max(1, at(dur)), b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = fn(i / sr); return b; };

    // ---------------- voices ----------------
    const kick = (v = 1) => { let ph = 0; return gen(0.5, (t) => { ph += (44 + 120 * ex(-t / 0.03)) / sr; return v * (Math.sin(TAU * ph) * ex(-t / 0.3) * Math.min(1, t / 0.0015) + (t < 0.005 ? rnd() * 0.25 * (1 - t / 0.005) : 0)); }); };
    const clap = () => { const bp = P.svf(); return gen(0.4, (t) => { let e = 0.7 * ex(-t / 0.13); for (const o of [0, 0.010, 0.021]) if (t >= o) e += ex(-(t - o) / 0.007); return 1.6 * bp(rnd(), 1250, 1.3, sr, 'bp') * e; }); };
    const snare = () => { const bp = P.svf(); let ph = 0; return gen(0.3, (t) => { ph += (175 + 60 * ex(-t / 0.02)) / sr; return 0.55 * Math.sin(TAU * ph) * ex(-t / 0.06) + 0.9 * bp(rnd(), 2200, 0.7, sr, 'bp') * ex(-t / 0.1); }); };
    const hat = (open) => { const hp = P.svf(), d = open ? 0.2 : 0.035; return gen(d * 5, (t) => hp(rnd(), 8000, 0.8, sr, 'hp') * ex(-t / d)); };
    const crash = () => { const hp = P.svf(), bp = P.svf(); return gen(3, (t) => (hp(rnd(), 5000, 0.6, sr, 'hp') * 0.8 + bp(rnd(), 3200, 3, sr, 'bp') * 0.4) * ex(-t / 1.0) * Math.min(1, t / 0.002)); };
    const tick = (f) => { const bp = P.svf(); return gen(0.06, (t) => bp(rnd(), f, 6, sr, 'bp') * ex(-t / 0.01) * 3); };
    const subdrop = () => { let ph = 0; return gen(2.0, (t) => { ph += (28 + 50 * ex(-t / 0.35)) / sr; return Math.sin(TAU * ph) * ex(-t / 0.8) * Math.min(1, t / 0.004); }); };
    // noise through a band-pass gliding f0 -> f1; shape 'up' = reverse-cymbal swell, 'down', 'hump'
    const sweep = (dur, f0, f1, shape = 'up', q = 1.2) => { const bp = P.svf(); return gen(dur, (t) => { const u = t / dur, a = shape === 'up' ? u * u : shape === 'down' ? (1 - u) * (1 - u) : Math.sin(Math.PI * u); return a * bp(rnd(), f0 * Math.pow(f1 / f0, u), q, sr, 'bp') * 1.5; }); };
    // bass: saw through a resonant low-pass with a pluck envelope, plus a sine sub
    const bass = (m, dur, cut = 700, res = 1.4) => { const f = P.mtof(m), lp = P.svf(); let ph = 0; return gen(dur + 0.03, (t) => { ph = (ph + f / sr) % 1; const a = Math.min(1, t / 0.003) * (t < dur ? 1 : ex(-(t - dur) / 0.008)); return a * (0.7 * lp(P.saw(ph, f / sr), 90 + cut * (0.3 + 0.7 * ex(-t / 0.08)), res, sr) + 0.5 * Math.sin(TAU * ph)); }); };
    // supersaw: 5 detuned saws per note per side, low-pass cut0 -> cut1 over the note (dec = an extra pluck on the cutoff); [L, R]
    const saws = (ms, dur, o = {}) => {
      const att = o.att || 0.005, rel = o.rel || 0.5, c0 = o.cut0 || 2400, c1 = o.cut1 || c0, dec = o.dec || 0, det = o.det || 14, k = 1 / Math.sqrt(5 * ms.length);
      const side = (sd) => { const lp = P.svf(), osc = []; for (const m of ms) for (let j = 0; j < 5; j++) osc.push({ f: P.mtof(m) * Math.pow(2, ((j - 2) * det + sd * 4) / 1200), ph: r01() });
        return gen(dur + rel * 3, (t) => { let s = 0; for (const q of osc) { q.ph = (q.ph + q.f / sr) % 1; s += P.saw(q.ph, q.f / sr); }
          const a = Math.min(1, t / att) * (t < dur ? 1 : ex(-(t - dur) / rel)), c = c0 * Math.pow(c1 / c0, Math.min(1, t / dur)) * (dec ? 0.35 + 0.65 * ex(-t / dec) : 1);
          return a * k * lp(s, c, 0.9, sr); }); };
      return [side(-1), side(1)];
    };
    const pluck = (m, dec = 0.14, cut = 3000) => { const f = P.mtof(m), lp = P.svf(); let ph = 0; return gen(dec * 5, (t) => { ph = (ph + f / sr) % 1; return ex(-t / dec) * Math.min(1, t / 0.002) * lp(P.square(ph, f / sr, 0.3 + 0.15 * Math.sin(t * 9)), 200 + cut * ex(-t / (dec * 0.6)), 1.1, sr); }); };
    // chip voice: band-limited pulse, delayed vibrato, a little bite at the start, gentle top cut
    const chip = (m, dur, duty = 0.25) => { const f = P.mtof(m), lp = P.onepole(); let ph = 0; return gen(dur + 0.03, (t) => { const vib = 1 + (t > 0.14 ? 0.006 * Math.sin(TAU * 6 * t) : 0); ph = (ph + f * vib / sr) % 1;
      const a = (t < dur ? 1 : Math.max(0, 1 - (t - dur) / 0.03)) * (0.7 + 0.3 * ex(-t / 0.12)); return a * lp(P.square(ph, f * vib / sr, duty), 7000, sr); }); };
    const blip = (m, dur) => { const f = P.mtof(m); let ph = 0; return gen(dur + 0.02, (t) => { ph = (ph + f * (1 + 0.5 * ex(-t / 0.01)) / sr) % 1; return Math.sin(TAU * ph) * ex(-t / (dur * 0.45)) * Math.min(1, t / 0.001); }); };
    const ping = (m) => { const f = P.mtof(m); let a = 0, b = 0; return gen(1.6, (t) => { a = (a + f / sr) % 1; b = (b + f * 2.76 / sr) % 1; return (Math.sin(TAU * a) * ex(-t / 0.45) + 0.25 * Math.sin(TAU * b) * ex(-t / 0.08)) * Math.min(1, t / 0.002); }); };

    // pre-rendered drum hits (reused; noise drums vary little enough that copies sound fine)
    const K = kick(), CL = clap(), SN = snare(), HC = [hat(0), hat(0), hat(0)], HO = hat(1), CR = crash(), SUB = subdrop();
    const kickAt = (t, v = 1) => { put(K, t, 0.95 * v); kicks.push(t); };

    // ---------------- harmony ----------------
    const CH = { Am: [57, 60, 64, 71], F: [53, 57, 60, 67], C: [55, 60, 64, 67], G: [55, 59, 62, 67], E: [56, 59, 64, 68], Em: [55, 59, 64, 67] };
    const ROOT = { Am: 33, F: 29, C: 36, G: 31, E: 28, Em: 28 };
    const PENTA = [0, 3, 5, 7, 10], penta = (k) => 57 + 12 * Math.floor(k / 5) + PENTA[((k % 5) + 5) % 5];

    // ---------------- building blocks ----------------
    // dots flying into a formation: a cloud of blips spread over [t0, t1], climbing (dir 1) or falling (-1)
    const cloud = (t0, t1, count, dir = 1, v = 0.2, lo = 5, hi = 17) => {
      for (let i = 0; i < count; i++) { const u = i / count, tt = t0 + (t1 - t0) * Math.pow(u, 0.85) + r01() * 0.03;
        const k = Math.round((dir > 0 ? lo + (hi - lo) * u : hi - (hi - lo) * u) + rnd() * 1.5);
        put(blip(penta(k), 0.04 + 0.03 * r01()), tt, v * (0.55 + 0.45 * u), rnd() * 0.8, { rv: 0.35, dl: 0.25 }); }
    };
    // the formation locks: a short bright chord + a ping
    const lock = (t, ch, v = 0.22) => { put(saws(CH[ch].map((m) => m + 12), 0.12, { cut0: 6000, dec: 0.08, rel: 0.25 }), t, v, 0, { rv: 0.4, dl: 0.2 }); put(ping(81), t, v * 0.5, 0.3, { rv: 0.3, dl: 0.3 }); };
    const impact = (t, ch, v = 1) => {
      kickAt(t, 1.05); put(SUB, t, 0.55 * v); put(CR, t, 0.32 * v, 0, { rv: 0.3 }); put(CL, t, 0.4 * v, 0, { rv: 0.4 });
      put(saws([ROOT[ch] + 12].concat(CH[ch]), 0.35, { cut0: 7000, dec: 0.25, rel: 0.9 }), t, 0.55 * v, 0, { rv: 0.5 });
    };
    const riser = (t0, t1, v = 0.35) => { put(sweep(t1 - t0, 400, 9000, 'up', 1.5), t0, v, 0, { rv: 0.3 }); };
    // snare roll speeding up: 8ths, then 16ths, then 32nds, getting louder
    const roll = (t0, t1, v0 = 0.08, v1 = 0.4) => { let t = t0; while (t < t1 - 1e-6) { const u = (t - t0) / (t1 - t0), step = u < 0.5 ? BEAT / 2 : u < 0.8 ? S16 : S16 / 2; put(SN, t, v0 + (v1 - v0) * u * u, rnd() * 0.15, { rv: 0.15 }); t += step; } };
    const four = (t0, bars, o = {}) => {             // four on the floor: kick, clap on 2 and 4, open hat on the off-beat, 16th hats
      for (let b = 0; b < bars * 4; b++) { const t = t0 + b * BEAT; kickAt(t);
        if (b % 2) put(CL, t, 0.42, 0.05, { rv: 0.15 });
        put(HO, t + BEAT / 2, 0.13, 0.25);
        for (let s = 0; s < 4; s++) put(HC[s % 3], t + s * S16, (s % 2 ? 0.06 : 0.1) * (o.hat || 1), -0.3); }
    };
    const rolling = (t0, bars, chords, o = {}) => {   // 16th bass, resting on each beat (the kick's spot)
      for (let b = 0; b < bars; b++) { const r = ROOT[chords[b % chords.length]];
        for (let s = 0; s < 16; s++) { if (s % 4 === 0) continue; put(bass(r + (s % 4 === 2 ? 12 : 0) + 12, S16 * 0.7, o.cut || 900), t0 + b * BAR + s * S16, 0.32, 0, { duck: true }); } }
    };
    const pad = (t0, bars, chords, o = {}) => { for (let b = 0; b < bars; b++) put(saws(CH[chords[b % chords.length]], BAR, { att: 0.08, rel: 0.6, cut0: o.cut0 || 900, cut1: o.cut1 || 1500 }), t0 + b * BAR, o.v || 0.2, 0, { duck: true, rv: 0.25 }); };
    const arp = (t0, bars, chords, o = {}) => {
      const pat = [0, 1, 2, 3, 2, 1, 0, 2, 1, 3, 2, 0, 3, 2, 1, 2], c0 = o.cut0 || 1500, c1 = o.cut1 || 3500;
      for (let b = 0; b < bars; b++) { const ch = CH[chords[b % chords.length]];
        for (let s = 0; s < 16; s++) { const u = (b * 16 + s) / (bars * 16);
          put(pluck(ch[pat[s]] + 12, 0.13, c0 + (c1 - c0) * u), t0 + b * BAR + s * S16, (o.v || 0.13) * (s % 4 === 0 ? 1 : 0.7), s % 2 ? 0.35 : -0.35, { duck: true, dl: 0.3, rv: 0.1 }); } }
    };
    const stab = (t, ch, v = 0.4) => put(saws([ROOT[ch] + 24].concat(CH[ch]), 0.18, { cut0: 6500, dec: 0.12, rel: 0.5 }), t, v, 0, { rv: 0.45, dl: 0.15 });

    // ================= 0-10  BOOT =================
    put(saws([45, 52, 57], 10.5, { att: 2.5, rel: 1, cut0: 260, cut1: 1800, det: 9 }), 0, 0.34, 0, { rv: 0.3 });       // drone opening up
    put(sweep(2.4, 300, 5000, 'hump', 0.8), 0, 0.22, 0, { rv: 0.4 });                                               // the warp rushing past
    for (let s = 0; s < 4.6 / S16; s++) { const t = s * S16, dens = 0.15 + 0.6 * t / 4.6;                            // data chatter, thickening
      if (r01() < dens) put(blip(penta(15 + Math.floor(r01() * 10)), 0.025), t, 0.09, rnd() * 0.9, { dl: 0.35 }); }
    cloud(CUES.sphere[0], CUES.sphere[1], 36, 1, 0.16, 3, 12);
    lock(CUES.sphere[1], 'Am', 0.16);
    cloud(CUES.pltw[0], CUES.pltw[1], 72, 1, 0.2, 5, 19);
    put(sweep(1.0, 600, 8000, 'up'), CUES.pltw[1] - 1.0, 0.3, 0, { rv: 0.3 });
    impact(CUES.pltw[1], 'Am');
    arp(6, 2, ['Am', 'F'], { cut0: 700, cut1: 2600, v: 0.12 });
    pad(6, 2, ['Am', 'F'], { cut0: 600, cut1: 1400, v: 0.16 });
    kickAt(6 + BAR, 0.8);
    riser(8, 9.75); roll(8, 9.75);
    put(sweep(0.9, 9000, 500, 'down', 0.8), CUES.burst, 0.3, 0, { rv: 0.3 });                                     // the burst through the camera

    // ================= 10-24  TUNNEL =================
    const T = CUES.tunnel, tunnelCh = ['Am', 'F', 'C', 'G', 'Am'];
    four(T, 5); rolling(T, 5, tunnelCh); pad(T, 5, tunnelCh, { v: 0.17 }); arp(T, 5, tunnelCh, { cut0: 1800, cut1: 4200 });
    impact(T, 'Am', 0.9);
    for (const tb of CUES.wordBursts) { put(sweep(0.5, 800, 9000, 'up', 1.4), tb - 0.5, 0.28, 0, { rv: 0.2 }); put(CR, tb, 0.24, 0, { rv: 0.2 }); stab(tb, tb === 16 ? 'G' : 'Am', 0.3); }
    const cbd = CUES.codeBuildDrive, cbdCh = ['Am', 'C', 'E'];
    cbd.forEach((t, k) => { kickAt(t, 1); put(SUB, t, 0.35); stab(t, cbdCh[k], 0.5); put(CR, t, 0.2, 0, { rv: 0.3 }); put(sweep(0.4, 1000, 7000, 'up'), t - 0.4, 0.2); });
    arp(20, 2, ['E'], { cut0: 900, cut1: 4000, v: 0.1 });
    riser(22, 23.75, 0.4); roll(22, 23.75, 0.1, 0.45);

    // ================= 24-36  DRIVE =================
    const D = CUES.floor, driveCh = ['F', 'G', 'Am', 'Am', 'F', 'G'];
    impact(D, 'F', 0.85);
    for (let b = 0; b < 6; b++) { const t0 = D + b * BAR, ch = driveCh[b];
      kickAt(t0); kickAt(t0 + 2 * BEAT); if (b % 2) kickAt(t0 + 3.5 * BEAT, 0.6);
      put(CL, t0 + BEAT, 0.3, 0, { rv: 0.2 }); put(CL, t0 + 3 * BEAT, 0.3, 0, { rv: 0.2 });
      for (let e = 0; e < 8; e++) put(HC[e % 3], t0 + e * BEAT / 2, e % 2 ? 0.1 : 0.06, 0.3);
      for (let e = 0; e < 8; e++) put(bass(ROOT[ch] + 12, BEAT / 2 * 0.8, 500 + 450 * Math.sin(TAU * (b * 8 + e) / 16) + 450, 2.0), t0 + e * BEAT / 2, 0.36, 0, { duck: true });
      put(saws(CH[ch], BAR, { att: 0.2, rel: 0.8, cut0: 700, cut1: 1200 }), t0, 0.15, 0, { duck: true, rv: 0.3 });
      put(ping(93), t0, 0.08, -0.4 + 0.16 * b, { dl: 0.6, rv: 0.3 });                                            // the lidar sweep (one per bar)
      put(sweep(BAR * 0.9, 2000, 6000, 'hump', 3), t0, 0.05, 0, { dl: 0.3 }); }
    arp(D + 2 * BAR, 4, ['Am', 'Am', 'F', 'G'], { cut0: 1200, cut1: 2800, v: 0.09 });
    CUES.floorWords.forEach(([a, b], k) => { cloud(a, b, 48, 1, 0.17, 4 + k * 2, 16 + k * 2); lock(b, ['Am', 'Am', 'G'][k], 0.2); });
    cloud(CUES.floorOff[0], CUES.floorOff[1] - 0.1, 36, -1, 0.14, 4, 16);
    riser(34.5, 35.75, 0.3); roll(35, 35.75, 0.08, 0.35);

    // ================= 36-48  TILES (App Inventor / Python) =================
    const TL = CUES.tiles, tileCh = ['Am', 'F', 'C', 'G', 'Am', 'E'];
    impact(TL, 'Am', 0.8);
    // lead: [beat in bar, midi, length in beats] per bar
    const MEL = [
      [[0, 69, 0.5], [0.5, 72, 0.5], [1, 76, 0.75], [1.75, 74, 0.25], [2, 72, 0.5], [2.5, 71, 0.5], [3, 69, 1]],
      [[0, 72, 0.5], [0.5, 69, 0.5], [1, 72, 0.5], [1.5, 77, 0.5], [2, 76, 0.75], [2.75, 74, 0.25], [3, 72, 1]],
      [[0, 67, 0.5], [0.5, 72, 0.5], [1, 76, 0.5], [1.5, 79, 0.5], [2, 76, 0.5], [2.5, 74, 0.5], [3, 72, 0.5], [3.5, 74, 0.5]],
      [[0, 71, 0.75], [0.75, 74, 0.25], [1, 79, 1], [2, 74, 0.5], [2.5, 71, 0.5], [3, 67, 1]],
      [[0, 81, 0.5], [0.5, 79, 0.5], [1, 76, 0.5], [1.5, 79, 0.5], [2, 81, 1], [3, 84, 1]],
      [[0, 83, 0.5], [0.5, 80, 0.5], [1, 76, 0.5], [1.5, 80, 0.5], [2, 83, 1], [3, 80, 1]],
    ];
    const BREAK = { k: [0, 6, 10], s: [4, 12], g: [7, 15] };                                                         // 16th steps
    for (let b = 0; b < 6; b++) { const t0 = TL + b * BAR, ch = tileCh[b];
      for (const s of BREAK.k) kickAt(t0 + s * S16, 0.9);
      for (const s of BREAK.s) put(SN, t0 + s * S16, 0.42, 0.05, { rv: 0.2 });
      for (const s of BREAK.g) put(SN, t0 + s * S16, 0.07, -0.1);
      for (let e = 0; e < 8; e++) put(HC[e % 3], t0 + e * BEAT / 2, e % 2 ? 0.05 : 0.09, 0.3);
      for (let e = 0; e < 8; e++) put(chip(ROOT[ch] + 12 + (e % 2 ? 12 : 0), BEAT / 2 * 0.6, 0.5), t0 + e * BEAT / 2, 0.11, 0, { duck: true });
      for (const [bt, m, len] of MEL[b]) put(chip(m, len * BEAT * 0.85, 0.25), t0 + bt * BEAT, 0.085, 0.15, { dl: 0.18, rv: 0.1 });
      for (let s = 0; s < 16; s++) if (r01() < 0.45) put(tick(2500 + 2500 * r01()), t0 + s * S16, 0.035 + 0.03 * r01(), rnd() * 0.9);  // the maze shimmering
    }
    for (const [a, b, dir] of CUES.flips) { const n = Math.round((b - a) / (S16 / 2));                                // a word's tiles flipping left to right
      for (let i = 0; i < n; i++) put(tick(dir > 0 ? 1800 + 4000 * i / n : 5800 - 4000 * i / n), a + i * (b - a) / n, 0.12, -0.8 + 1.6 * i / n, { rv: 0.15 });
      if (dir > 0) stab(b, b > 40 ? 'C' : 'Am', 0.25); }
    riser(46, 47.75, 0.38); roll(46, 47.75, 0.1, 0.45);

    // ================= 48-60  FINALE =================
    const FN = CUES.finale;
    put(saws([33, 45, 52], 2.2, { att: 0.3, rel: 0.5, cut0: 400, cut1: 2000 }), FN, 0.3, 0, { rv: 0.3 });
    kickAt(FN, 0.7); arp(FN, 1, ['Am'], { cut0: 600, cut1: 2500, v: 0.1 });
    cloud(CUES.finalWords[0][0], CUES.finalWords[0][1], 56, 1, 0.2, 6, 19);
    impact(50, 'Am', 1);
    const finCh = ['Am', 'F'];
    four(50, 2); rolling(50, 2, finCh); pad(50, 2, finCh, { v: 0.18 }); arp(50, 2, finCh, { cut0: 2200, cut1: 4500 });
    cloud(CUES.finalWords[1][0], CUES.finalWords[1][1], 72, 1, 0.22, 6, 21);
    put(sweep(1.2, 500, 9000, 'up'), 52.8, 0.35, 0, { rv: 0.3 });
    impact(54, 'Am', 1.1);
    four(54, 2, { hat: 0.8 }); rolling(54, 2, ['F', 'G']); pad(54, 2, ['F', 'G'], { v: 0.18, cut1: 2200 }); arp(54, 2, ['F', 'G'], { cut0: 3500, cut1: 2000 });
    kickAt(58, 1.05); put(SUB, 58, 0.5); put(CR, 58, 0.3, 0, { rv: 0.4 });
    put(saws([45, 57, 60, 64, 71, 76], 1.0, { att: 0.005, rel: 1.4, cut0: 5000, cut1: 1200 }), 58, 0.55, 0, { rv: 0.6, dl: 0.2 });
    put(ping(81), 58, 0.12, 0.3, { dl: 0.5, rv: 0.4 });

    // ---------------- mix ----------------
    const duck = new Float32Array(N).fill(1), dn = at(0.4);
    for (const tk of kicks) { const i0 = at(tk); for (let i = 0; i < dn && i0 + i < N; i++) { const t = i / sr, g = 1 - 0.6 * (t < 0.004 ? t / 0.004 : ex(-(t - 0.004) / 0.12)); if (g < duck[i0 + i]) duck[i0 + i] = g; } }
    const rvp = P.reverb({ sr, size: 0.86, damp: 0.4, width: 1, pre: 0.02, hp: 250, lp: 7000 })(), dlp = P.delay({ sr, time: BEAT * 0.75, fb: 0.38, lp: 4000 })();
    const hpL = P.rbjHighpass(30, 0.7, sr), hpR = P.rbjHighpass(30, 0.7, sr), M = at(LEN), out = P.bus(M);
    for (let i = 0; i < M; i++) {
      const r = rvp(rv.L[i], rv.R[i]), d = dlp(dl.L[i], dl.R[i]);
      out.L[i] = hpL(dry.L[i] + side.L[i] * duck[i] + r[0] + d[0] * 0.5);
      out.R[i] = hpR(dry.R[i] + side.R[i] * duck[i] + r[1] + d[1] * 0.5);
    }
    const fade = at(1.2); for (let i = 0; i < fade; i++) { const g = Math.cos((i / fade) * Math.PI / 2); out.L[M - fade + i] *= g; out.R[M - fade + i] *= g; }
    return out;   // P.bus at LEN seconds; loudness and the true-peak limit are applied by the renderer
  }
})(globalThis);
