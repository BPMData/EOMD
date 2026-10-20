/* Core: math, easing, color, RNG, timeline. Shared by browser + Node. */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});

  // ---------------------------------------------------------------- math
  const M = (DHS.math = {});
  M.TAU = Math.PI * 2;
  M.clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  M.lerp = (a, b, t) => a + (b - a) * t;
  M.inv = (a, b, x) => M.clamp((x - a) / (b - a)); // 0..1 progress of x through [a,b]
  M.mod = (a, n) => ((a % n) + n) % n;
  M.smooth = (t) => t * t * (3 - 2 * t);
  M.map = (x, a, b, c, d) => c + (d - c) * M.clamp((x - a) / (b - a));

  // --------------------------------------------------------------- easing
  // Hand-tuned curves. No default "ease" anywhere in the film.
  const E = (DHS.ease = {});
  E.linear = (t) => t;
  E.outCubic = (t) => 1 - Math.pow(1 - t, 3);
  E.inCubic = (t) => t * t * t;
  E.inOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  E.outQuint = (t) => 1 - Math.pow(1 - t, 5);
  E.inQuint = (t) => t * t * t * t * t;
  E.inOutQuint = (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
  E.outExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  E.inExpo = (t) => (t <= 0 ? 0 : Math.pow(2, 10 * (t - 1)));
  E.inOutExpo = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2);
  E.inOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
  // Overshoot with follow-through
  E.outBack = (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  // Anticipation: small pull-back, then a committed move
  E.anticipate = (t) => (t <= 0 ? 0 : t < 0.22 ? -0.07 * Math.sin((Math.PI * t) / 0.22) : E.outBack((t - 0.22) / 0.78, 1.25));
  // Damped spring that lands exactly at 1 (≈10% overshoot, settles by t=1)
  E.spring = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.exp(-6.2 * t) * Math.cos(9.4 * t) * (1 - t * 0.02));
  E.softSpring = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.exp(-7.5 * t) * Math.cos(7 * t));
  // CSS-style cubic-bezier for bespoke curves
  E.bezier = (x1, y1, x2, y2) => {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) { const e = sx(t) - x; const d = dx(t); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; t -= e / d; }
      return sy(M.clamp(t));
    };
  };
  E.swift = E.bezier(0.7, 0, 0.12, 1);   // decisive "snap" move
  E.glide = E.bezier(0.33, 0, 0.1, 1);   // long settle
  E.lift = E.bezier(0.5, 0, 0.75, 0);    // exits: accelerate away
  // Tween helper: eased progress of t within [t0,t1]
  DHS.tw = (t, t0, t1, ease = E.outCubic) => ease(M.inv(t0, t1, t));

  // ---------------------------------------------------------------- color
  const C = (DHS.color = {});
  C.rgb = (hex) => { const h = hex.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  C.hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(M.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  C.mix = (a, b, t) => { const A = C.rgb(a), B = C.rgb(b); return C.hex(M.lerp(A[0], B[0], t), M.lerp(A[1], B[1], t), M.lerp(A[2], B[2], t)); };
  C.rgba = (hex, a) => { const [r, g, b] = C.rgb(hex); return `rgba(${r},${g},${b},${a})`; };
  C.lum = (hex) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const [r, g, b] = C.rgb(hex); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  C.contrast = (a, b) => { const la = C.lum(a), lb = C.lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  // Text color for a background: white unless white fails 4.5:1 and ink does better
  C.textOn = (bg) => { const cfg = DHS.config.colors; const w = C.contrast(bg, cfg.white), k = C.contrast(bg, cfg.ink); return w >= 4.5 || w >= k ? cfg.white : cfg.ink; };

  // ----------------------------------------------------------------- RNG
  DHS.rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // Smooth deterministic 1D noise
  DHS.noise1 = (x, seed = 1) => { const i = Math.floor(x), f = x - i; const h = (n) => { const s = Math.sin((n + seed * 57.13) * 127.1) * 43758.5453; return s - Math.floor(s); }; return M.lerp(h(i), h(i + 1), M.smooth(f)) * 2 - 1; };

  // ------------------------------------------------------------- timeline
  // Deterministic, seekable, time-driven. A frame is a pure function of t.
  // Scenes live in loop-space [0, L) and may wrap across the loop point.
  DHS.Timeline = class {
    constructor(length) { this.length = length; this.scenes = []; this.cues = []; }
    add(scene) { this.scenes.push(scene); return scene; }
    cue(t, type, params = {}) { this.cues.push({ t: M.mod(t, this.length), type, ...params }); }
    // local time of scene at global t (handles wrap). Returns null if not active.
    local(scene, t) {
      const tau = M.mod(t - scene.start, this.length);
      const end = scene.dur + (scene.tail || 0);
      return tau < end ? tau : null;
    }
    active(t) {
      const out = [];
      for (const s of this.scenes) { const tau = this.local(s, t); if (tau !== null) out.push({ s, tau }); }
      // Order: scenes past their duration (outgoing) first, then incoming ones by start
      out.sort((a, b) => (b.tau > b.s.dur) - (a.tau > a.s.dur) || (a.s.layer || 0) - (b.s.layer || 0));
      return out;
    }
  };
})(globalThis);
