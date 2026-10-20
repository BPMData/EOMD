/* DSP primitives. Pure JS, no Web Audio nodes — the same code renders the
   offline export in Node and the live buffer in the browser, sample-identical.
   Everything writes into circular buffers of loop length N so note tails and
   effect tails wrap across the loop point (no seam). */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const P = (DHS.dsp = {});
  const TAU = Math.PI * 2;
 
  P.mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  P.db = (d) => Math.pow(10, d / 20);
  P.todb = (g) => 20 * Math.log10(Math.max(g, 1e-12));
  P.rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1; }; };
 
  // Stereo circular bus
  P.bus = (N) => ({ N, L: new Float32Array(N), R: new Float32Array(N) });
  // Equal-power pan write of a mono voice rendered into `buf` (Float32Array) at sample offset `at`
  P.write = (bus, buf, at, gain = 1, pan = 0) => {
    const N = bus.N, gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
    let j = ((at % N) + N) % N;
    for (let i = 0; i < buf.length; i++) { bus.L[j] += buf[i] * gl; bus.R[j] += buf[i] * gr; if (++j === N) j = 0; }
  };
  P.mixInto = (dst, src, g = 1) => { for (let i = 0; i < dst.N; i++) { dst.L[i] += src.L[i] * g; dst.R[i] += src.R[i] * g; } };
 
  // ---- envelopes
  // ADSR sampled into array of length n (gate = sustain duration in samples)
  P.adsr = (n, sr, a, d, s, r, gate) => {
    const e = new Float32Array(n), A = Math.max(1, a * sr), Dd = Math.max(1, d * sr), R = Math.max(1, r * sr);
    const lv = (i) => i < A ? Math.sin((i / A) * Math.PI / 2) : i < A + Dd ? 1 - (1 - s) * ((i - A) / Dd) : s;
    const g0 = lv(Math.max(0, gate - 1));
    for (let i = 0; i < n; i++) { if (i < gate) e[i] = lv(i); else { const k = (i - gate) / R; e[i] = k >= 1 ? 0 : g0 * (1 - k) * (1 - k); } }
    return e;
  };
  // Exponential decay with smooth attack
  P.perc = (n, sr, att, dec) => { const e = new Float32Array(n), A = Math.max(1, att * sr), k = 1 / (dec * sr); for (let i = 0; i < n; i++) e[i] = (i < A ? Math.sin((i / A) * Math.PI / 2) : Math.exp(-(i - A) * k)) * (i > n - 64 ? (n - i) / 64 : 1); return e; };
 
  // ---- oscillators (phase accumulators, band-limited where it matters)
  const blep = (t, dt) => { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; };
  P.saw = (ph, dt) => 2 * ph - 1 - blep(ph, dt);
  P.square = (ph, dt, pw = 0.5) => { let v = ph < pw ? 1 : -1; v += blep(ph, dt); v -= blep((ph + 1 - pw) % 1, dt); return v; };
 
  // ---- filters
  // State-variable (TPT/Zavalishin) — stable under fast modulation. mode: 'lp'|'bp'|'hp'
  P.svf = () => { let ic1 = 0, ic2 = 0; return (x, fc, q, sr, mode = 'lp') => {
    const g = Math.tan(Math.PI * Math.min(fc, sr * 0.45) / sr), k = 1 / q, a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2;
    const v3 = x - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2;
    return mode === 'lp' ? v2 : mode === 'bp' ? v1 : x - k * v1 - v2; }; };
  P.onepole = () => { let z = 0; return (x, fc, sr) => { const a = 1 - Math.exp(-TAU * fc / sr); z += a * (x - z); return z; }; };
  // Biquad (direct form I) from coefficients
  P.biquad = (b0, b1, b2, a1, a2) => { let x1 = 0, x2 = 0, y1 = 0, y2 = 0; return (x) => { const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; }; };
  P.rbjHighpass = (fc, q, sr) => { const w = TAU * fc / sr, al = Math.sin(w) / (2 * q), c = Math.cos(w), a0 = 1 + al; return P.biquad((1 + c) / 2 / a0, -(1 + c) / a0, (1 + c) / 2 / a0, -2 * c / a0, (1 - al) / a0); };
  P.rbjLowpass = (fc, q, sr) => { const w = TAU * fc / sr, al = Math.sin(w) / (2 * q), c = Math.cos(w), a0 = 1 + al; return P.biquad((1 - c) / 2 / a0, (1 - c) / a0, (1 - c) / 2 / a0, -2 * c / a0, (1 - al) / a0); };
  P.rbjShelfHi = (fc, gainDb, sr) => { const A = Math.pow(10, gainDb / 40), w = TAU * fc / sr, c = Math.cos(w), s = Math.sin(w), al = s / 2 * Math.SQRT2, sq = 2 * Math.sqrt(A) * al, a0 = (A + 1) - (A - 1) * c + sq;
    return P.biquad(A * ((A + 1) + (A - 1) * c + sq) / a0, -2 * A * ((A - 1) + (A + 1) * c) / a0, A * ((A + 1) + (A - 1) * c - sq) / a0, 2 * ((A - 1) - (A + 1) * c) / a0, ((A + 1) - (A - 1) * c - sq) / a0); };
 
  // ---- circular processing: run a stateful stereo process over the loop twice
  // and keep the second pass, so filter/effect state at the seam is continuous.
  P.circular = (bus, makeProc) => {
    const N = bus.N, out = P.bus(N), proc = makeProc();
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < N; i++) { const [l, r] = proc(bus.L[i], bus.R[i]); if (pass) { out.L[i] = l; out.R[i] = r; } }
    return out;
  };
 
  // ---- effects
  // Freeverb-style stereo reverb (8 combs + 4 allpasses per side), damped, darkish.
  P.reverb = ({ sr, size = 0.82, damp = 0.45, width = 1, pre = 0.012, hp = 180, lp = 6500 }) => () => {
    const sc = sr / 44100, combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], apT = [556, 441, 341, 225], spread = 23;
    const mk = (n) => ({ b: new Float32Array(Math.round(n * sc)), i: 0, f: 0 });
    const side = (off) => ({ c: combT.map((n) => mk(n + off)), a: apT.map((n) => mk(n + off)) });
    const Ls = side(0), Rs = side(spread), pd = new Float32Array(Math.max(1, Math.round(pre * sr))); let pi = 0;
    const hpf = P.rbjHighpass(hp, 0.7, sr), lpf = P.rbjLowpass(lp, 0.7, sr);
    const run = (S, x) => { let o = 0; for (const c of S.c) { const y = c.b[c.i]; c.f = y * (1 - damp) + c.f * damp; c.b[c.i] = x + c.f * size; if (++c.i >= c.b.length) c.i = 0; o += y; }
      for (const a of S.a) { const y = a.b[a.i]; a.b[a.i] = o + y * 0.5; if (++a.i >= a.b.length) a.i = 0; o = y - o; } return o; };
    return (l, r) => { const x = lpf(hpf((l + r) * 0.5)); const d = pd[pi]; pd[pi] = x; if (++pi >= pd.length) pi = 0;
      const ol = run(Ls, d * 0.015), or = run(Rs, d * 0.015); const w1 = (1 + width) / 2, w2 = (1 - width) / 2; return [ol * w1 + or * w2, or * w1 + ol * w2]; };
  };
  // Ping-pong delay with lowpassed feedback
  P.delay = ({ sr, time, fb = 0.32, lp = 3200 }) => () => {
    const n = Math.round(time * sr), bl = new Float32Array(n), br = new Float32Array(n); let i = 0; const fl = P.onepole(), fr = P.onepole();
    return (l, r) => { const yl = bl[i], yr = br[i]; bl[i] = fl((l + r) * 0.5 + yr * fb, lp, sr); br[i] = fr(yl * fb, lp, sr); if (++i >= n) i = 0; return [yl, yr]; };
  };
 
  // ---- K-weighting + BS.1770-4 loudness (48 kHz coefficients, recomputed for other rates)
  P.kweight = (sr) => {
    // Pre-filter (high shelf ~+4 dB @ 1.68 kHz) and RLB high-pass (38 Hz), per BS.1770 derivation
    let f0 = 1681.974450955533, Gd = 3.999843853973347, Q = 0.7071752369554196, K = Math.tan(Math.PI * f0 / sr), Vh = Math.pow(10, Gd / 20), Vb = Math.pow(Vh, 0.4996667741545416), a0 = 1 + K / Q + K * K;
    const pre = P.biquad((Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0);
    f0 = 38.13547087602444; Q = 0.5003270373238773; K = Math.tan(Math.PI * f0 / sr); a0 = 1 + K / Q + K * K;
    const rlb = P.biquad(1, -2, 1, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0);
    return (x) => rlb(pre(x));
  };
  // Mean-square K-weighted power per 100 ms hop over the (circular) loop
  P.kPower = (bus, sr) => {
    const N = bus.N, kl = P.kweight(sr), kr = P.kweight(sr), hop = Math.round(sr * 0.1), nh = Math.floor(N / hop), pw = new Float64Array(nh);
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < nh * hop; i++) { const l = kl(bus.L[i]), r = kr(bus.R[i]); if (pass) pw[(i / hop) | 0] += (l * l + r * r) / hop; }
    return pw;
  };
  const lk = (p) => -0.691 + 10 * Math.log10(Math.max(p, 1e-20));
  // Integrated loudness of the loop played continuously (400 ms blocks, 75% overlap, gated)
  P.lufs = (bus, sr) => {
    const pw = P.kPower(bus, sr), nh = pw.length, blocks = [];
    for (let i = 0; i < nh; i++) { let s = 0; for (let k = 0; k < 4; k++) s += pw[(i + k) % nh]; blocks.push(s / 4); }
    const g1 = blocks.filter((b) => lk(b) > -70); const m1 = g1.reduce((a, b) => a + b, 0) / g1.length;
    const g2 = g1.filter((b) => lk(b) > lk(m1) - 10); return lk(g2.reduce((a, b) => a + b, 0) / g2.length);
  };
  // Short-term (3 s) loudness curve, one value per 100 ms (circular)
  P.shortTerm = (bus, sr) => { const pw = P.kPower(bus, sr), nh = pw.length, out = []; for (let i = 0; i < nh; i++) { let s = 0; for (let k = 0; k < 30; k++) s += pw[(i - k + nh) % nh]; out.push(lk(s / 30)); } return out; };
 
  // ---- true-peak (4x polyphase windowed-sinc interpolation, circular)
  const TP_TAPS = 12, OS = 4;
  const tpKernel = (() => { const k = []; for (let p = 0; p < OS; p++) { const row = []; for (let j = -TP_TAPS + 1; j <= TP_TAPS; j++) { const x = j - p / OS; const w = 0.5 + 0.5 * Math.cos(Math.PI * x / TP_TAPS); row.push((x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x)) * w); } k.push(row); } return k; })();
  P.truePeakEnv = (ch) => { // per-sample max |interpolated| between sample i-1 and i
    const N = ch.length, out = new Float32Array(N);
    for (let i = 0; i < N; i++) { let m = Math.abs(ch[i]); for (let p = 1; p < OS; p++) { const row = tpKernel[p]; let s = 0; for (let j = 0; j < row.length; j++) { let idx = i - TP_TAPS + j; if (idx < 0) idx += N; else if (idx >= N) idx -= N; s += ch[idx] * row[j]; } const a = Math.abs(s); if (a > m) m = a; } out[i] = m; }
    return out;
  };
  P.truePeak = (bus) => { let m = 0; for (const ch of [bus.L, bus.R]) { const e = P.truePeakEnv(ch); for (let i = 0; i < e.length; i++) if (e[i] > m) m = e[i]; } return m; };
 
  // Look-ahead true-peak limiter (circular). No overshoot by construction: the
  // gain applied at sample i is an average of gains that are all <= required(i).
  P.limit = (bus, sr, ceiling, { look = 0.002, release = 0.12 } = {}) => {
    const N = bus.N, eL = P.truePeakEnv(bus.L), eR = P.truePeakEnv(bus.R), La = Math.max(2, Math.round(look * sr));
    const req = new Float32Array(N); let hits = 0;
    for (let i = 0; i < N; i++) { const m = Math.max(eL[i], eR[i]); req[i] = m > ceiling ? ceiling / m : 1; if (m > ceiling) hits++; }
    if (!hits) return { bus, maxGR: 0, hits };
    // forward-looking min over [i, i+La] (circular; O(N*La) is fine at La≈96)
    const mn = new Float32Array(N); for (let i = 0; i < N; i++) { let m = 1; for (let k = 0; k <= La; k++) { const v = req[(i + k) % N]; if (v < m) m = v; } mn[i] = m; }
    // instant attack to mn, exponential release; two passes for circular continuity
    const rel = 1 - Math.exp(-1 / (release * sr)), r = new Float32Array(N); let g = 1;
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < N; i++) { g = Math.min(mn[i], g + (1 - g) * rel); r[i] = g; }
    // trailing box average over La+1 samples
    const out = P.bus(N); let acc = 0; for (let k = 0; k <= La; k++) acc += r[(N - k) % N]; let maxGR = 0;
    for (let i = 0; i < N; i++) { if (i > 0) acc += r[i] - r[(i - La - 1 + N) % N]; const gg = acc / (La + 1); out.L[i] = bus.L[i] * gg; out.R[i] = bus.R[i] * gg; if (1 - gg > maxGR) maxGR = 1 - gg; }
    return { bus: out, maxGR: P.todb(1 - maxGR), hits };
  };
})(globalThis);