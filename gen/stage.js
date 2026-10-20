/* gen/stage.js: plays a cartridge. Shots in a loop, transitions, HUD.
   Time-based: frame rate never changes speed. Each active shot draws into its own offscreen
   canvas (so trails work), the stage composites them and draws the HUD on top.

   const st = GEN.stage(canvas, cart, { makeCanvas, reduced, hud })
   st.advance(dt)   step the clock by dt seconds and draw     (live loop / ?manual capture)
   st.renderAt(T)   jump to time T and draw (stateful layers re-simulate a short warm-up)
   st.resize(w, h)  device pixels
   st.setCart(cart, keepTime)   st.goto(i)   st.refresh()   st.info()                       */
(function (G) {
  'use strict';
  const C = G.core;
  G.layers = G.layers || {};

  // ---------- cartridge defaults ----------
  const PALETTE = { bg: '#101012', ink: '#efece4', accent: '#ff6b4a', dim: '#5a5a62' };
  const HUD = { on: true, corners: true, title: true, label: true, timecode: true, beat: true, stats: true, progress: true,
                font: 'GenMono, ui-monospace, "SF Mono", Menlo, Consolas, monospace', size: 13, margin: 26 };
  G.cartDefaults = { name: 'untitled', title: 'GEN', subtitle: '', seed: 1, bpm: 120, perBar: 4, bars: 8,
                     palette: PALETTE, hud: HUD, transition: { type: 'fade', dur: 1.2 }, shots: [] };

  // fill every missing field; never mutates the input
  G.normalize = function (cart) {
    const c = C.merge(G.cartDefaults, cart || {});
    c.palette = C.merge(PALETTE, c.palette);
    c.hud = C.merge(HUD, c.hud === false ? { on: false } : c.hud);
    c.transition = C.merge({ type: 'fade', dur: 1.2 }, c.transition);
    c.shots = (c.shots || []).filter((s) => s && G.layers[s.layer]).map((s, i) => {
      const L = G.layers[s.layer];
      return { layer: s.layer, dur: Math.max(1, +s.dur || 12), label: s.label || s.layer.toUpperCase(),
               params: C.merge(G.knobDefaults(L), s.params), palette: C.merge(c.palette, s.palette),
               transition: s.transition ? C.merge(c.transition, s.transition) : null, index: i };
    });
    if (!c.shots.length) c.shots.push({ layer: 'depth', dur: 20, label: 'DEPTH', params: G.knobDefaults(G.layers.depth || {}),
                                         palette: c.palette, transition: null, index: 0 });
    return c;
  };

  // explanations for knobs many layers share (a layer's own help wins)
  G.knobHelp = {
    trail: "Motion streaks. 0 = every frame starts clean; higher = moving things leave fading trails.",
    seed: "Reshuffles this layer's random choices (layout, timing). Same seed = same result.",
    pulse: "How much things swell on each beat (the cartridge's BPM).",
    accent: "Share of items drawn in the accent color.",
    alpha: "Opacity. Lower = fainter.",
  };
  G.helpFor = (L, k) => (L && L.help && L.help[k]) || G.knobHelp[k] || '';

  // knobs: { name: [default, min, max, step] | default }  ->  { name: default }
  G.knobDefaults = function (L) {
    const o = {};
    for (const k in (L.knobs || {})) {
      const v = L.knobs[k];
      o[k] = Array.isArray(v) && typeof v[0] === 'number' ? v[0] : (v && v.options ? v.value : v);
    }
    return o;
  };

  // ---------- text with letter spacing (works everywhere, unlike ctx.letterSpacing) ----------
  G.text = function (ctx, str, x, y, size, opt) {
    opt = opt || {};
    ctx.font = (opt.weight || 400) + ' ' + size + 'px ' + (opt.font || HUD.font);
    ctx.fillStyle = opt.color || '#fff';
    ctx.textBaseline = opt.base || 'middle';
    const tr = size * (opt.track == null ? 0.18 : opt.track);
    let w = 0; const ws = [];
    for (const ch of str) { const cw = ctx.measureText(ch).width; ws.push(cw); w += cw + tr; }
    w -= tr;
    let px = opt.align === 'right' ? x - w : opt.align === 'center' ? x - w / 2 : x;
    let i = 0;
    for (const ch of str) { ctx.fillText(ch, px, y); px += ws[i++] + tr; }
    return w;
  };

  G.stage = function (canvas, cartIn, opts) {
    opts = opts || {};
    const mk = opts.makeCanvas || ((w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; });
    const ctx = canvas.getContext('2d');
    let cart, starts, total, T = 0, fps = 60, live = {};
    const reduced = !!opts.reduced, tscale = reduced ? 0.4 : 1;

    function setCart(c, keep) {
      cart = G.normalize(c);
      starts = []; total = 0;
      for (const s of cart.shots) { starts.push(total); total += s.dur; }
      live = {};
      if (!keep) T = 0;
    }

    function env(shot, inst) {
      const w = canvas.width, h = canvas.height, s = Math.min(w / 1920, h / 1080);
      const E = { w, h, s, cx: w / 2, cy: h / 2, pal: shot.palette, cart, shot, make: mk, T: T,
               seed: (cart.seed * 7919 + shot.index * 104729 + (shot.params.seed | 0)) >>> 0,
               // beat clock on the stage's global time (in step with the HUD), or at time t if given
               beat: (t) => C.beat(t == null ? E.T : t, cart.bpm, cart.perBar, cart.bars),
               // fade the previous frame toward bg: trail 0 = clear, 0.9 = long streaks. Frame-rate independent.
               fade(c, dt, trail) {
                 const a = trail <= 0 ? 1 : 1 - Math.pow(C.clamp(trail, 0, 0.995), dt * 60);
                 c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
                 c.fillStyle = a >= 1 ? shot.palette.bg : C.rgba(shot.palette.bg, a); c.fillRect(0, 0, w, h);
               } };
      return E;
    }

    // seconds shot j starts early (overlapping the end of the shot before it)
    function overlap(j) {
      const n = cart.shots.length; if (n < 2) return 0;
      const i = (j - 1 + n) % n;
      return Math.min(transOf(j).dur, cart.shots[i].dur * 0.5, cart.shots[j].dur * 0.5);
    }

    function transOf(j) { const s = cart.shots[j]; return reduced ? { type: 'fade', dur: Math.max(0.8, (s.transition || cart.transition).dur) } : (s.transition || cart.transition); }

    // which shots are on screen at time Tm (looped). returns [{j, local, key}], plus transition progress
    function active(Tabs) {
      const loop = Math.floor(Tabs / total), Tm = Tabs - loop * total, n = cart.shots.length;
      let i = 0; while (i < n - 1 && Tm >= starts[i + 1]) i++;
      const end = starts[i] + cart.shots[i].dur, j = (i + 1) % n;
      const tr = overlap(j), trIn = overlap(i);
      const out = [{ j: i, local: Tm - starts[i] + trIn, key: loop + ':' + i }];
      let p = -1;
      if (tr > 0 && Tm >= end - tr) {
        p = (Tm - (end - tr)) / tr;
        out.push({ j, local: Tm - (end - tr), key: (j === 0 ? loop + 1 : loop) + ':' + j });
      }
      return { list: out, p, i, Tm };
    }

    function instance(a, dt) {
      const shot = cart.shots[a.j], L = G.layers[shot.layer];
      let I = live[a.key];
      const w = canvas.width, h = canvas.height;
      const jumped = I && (a.local < I.local - 1e-6 || a.local - I.local > 0.5);
      if (!I || jumped || I.w !== w || I.h !== h) {
        const cv = (I && I.w === w && I.h === h) ? I.cv : mk(w, h);
        const c2 = cv.getContext('2d');
        const E = env(shot, null);
        I = live[a.key] = { cv, c: c2, E, L, shot, w, h, local: 0, state: null };
        E.rng = C.rng(E.seed);
        c2.fillStyle = shot.palette.bg; c2.fillRect(0, 0, w, h);
        I.state = L.init ? L.init(shot.params, E) : {};
        // warm-up: stateful layers re-simulate a little history so a seek looks like the live stream
        const warm = L.warm || 0;
        let t0 = warm > 0 ? Math.max(0, a.local - warm) : a.local;
        while (t0 < a.local - 1e-9) { const st = Math.min(1 / 30, a.local - t0); E.T = T - (a.local - t0); L.frame(c2, I.state, t0, st, E); t0 += st; }
        I.local = a.local; I.fresh = true;
      }
      const step = I.fresh ? 0 : Math.max(0, a.local - I.local);
      I.fresh = false; I.local = a.local; I.E.T = T;
      I.c.save(); L.frame(I.c, I.state, a.local, step || dt || 1 / 60, I.E); I.c.restore();
      return I;
    }

    function composite(A, B, p, tr) {
      const w = canvas.width, h = canvas.height;
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = A.shot.palette.bg; ctx.fillRect(0, 0, w, h);      // under any transparent pixels
      ctx.drawImage(A.cv, 0, 0);
      if (!B) return;
      const e = C.inOut(p), type = tr.type;
      if (type === 'cut') { if (p >= 0.5) ctx.drawImage(B.cv, 0, 0); return; }
      if (type === 'fade') { ctx.globalAlpha = e; ctx.drawImage(B.cv, 0, 0); ctx.globalAlpha = 1; return; }
      ctx.save(); ctx.beginPath();
      let edge = null;
      if (type === 'iris') {
        const r = e * Math.hypot(w, h) * 0.52; ctx.arc(w / 2, h / 2, Math.max(0.1, r), 0, C.TAU); edge = () => { ctx.beginPath(); ctx.arc(w / 2, h / 2, Math.max(0.1, r), 0, C.TAU); };
      } else {                                    // wipe: a slanted edge sweeping left to right
        const sl = h * 0.18, x = -sl + e * (w + 2 * sl);
        ctx.moveTo(0, 0); ctx.lineTo(x + sl, 0); ctx.lineTo(x - sl, h); ctx.lineTo(0, h); ctx.closePath();
        edge = () => { ctx.beginPath(); ctx.moveTo(x + sl, 0); ctx.lineTo(x - sl, h); };
      }
      ctx.clip(); ctx.drawImage(B.cv, 0, 0); ctx.restore();
      if (edge && p > 0 && p < 1) {
        edge(); ctx.strokeStyle = C.rgba(B.shot.palette.ink, 0.85 * Math.sin(p * Math.PI)); ctx.lineWidth = Math.max(1, 2 * Math.min(w / 1920, h / 1080)); ctx.stroke();
      }
    }

    function hud(cur, nxt, p) {
      const H = cart.hud; if (!H.on) return;
      const w = canvas.width, h = canvas.height, s = Math.min(w / 1920, h / 1080) * 1.4, m = H.margin * s;
      const shot = (p > 0.5 && nxt) ? nxt.shot : cur.shot, pal = shot.palette, fs = H.size * s;
      const o = { font: H.font, color: pal.ink };
      ctx.save(); ctx.globalAlpha = 1;
      if (H.corners) {
        ctx.strokeStyle = C.rgba(pal.ink, 0.9); ctx.lineWidth = Math.max(1, 1.4 * s); const L = 14 * s;
        for (const [x, y, dx, dy] of [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]]) {
          ctx.beginPath(); ctx.moveTo(x, y + dy * L); ctx.lineTo(x, y); ctx.lineTo(x + dx * L, y); ctx.stroke();
        }
      }
      const tx = m + 20 * s, ty = m + 16 * s, by = h - m - 14 * s;
      if (H.title) {
        const wt = G.text(ctx, String(cart.title).toUpperCase(), tx, ty, fs, Object.assign({}, o, { weight: 700 }));
        if (cart.subtitle) G.text(ctx, String(cart.subtitle).toUpperCase(), tx + wt + 26 * s, ty, fs, Object.assign({}, o, { color: C.rgba(pal.ink, 0.55) }));
      }
      if (H.label) {
        const n = (p > 0.5 && nxt) ? nxt : cur;
        G.text(ctx, C.pad(n.shot.index + 1, 2) + ' — ' + String(n.shot.label).toUpperCase(), w - tx, ty, fs, Object.assign({}, o, { align: 'right', weight: 700 }));
      }
      if (H.timecode) {
        const fr = Math.floor(C.fract(T) * 60), tc = C.pad(T / 3600, 2) + ':' + C.pad((T / 60) % 60, 2) + ':' + C.pad(T % 60, 2) + ':' + C.pad(fr, 2);
        const wt = G.text(ctx, tc, tx, by, fs, Object.assign({}, o, { weight: 700 }));
        G.text(ctx, Math.round(fps) + ' FPS', tx + wt + 26 * s, by, fs, Object.assign({}, o, { color: C.rgba(pal.ink, 0.55) }));
      }
      if (H.beat) {
        const b = C.beat(T, cart.bpm, cart.perBar, cart.bars);
        const wb = G.text(ctx, 'BAR ' + b.bar + '/' + b.bars, w - tx, by, fs, Object.assign({}, o, { align: 'right', weight: 700 }));
        const bx = 9 * s, gap = 4 * s; let x0 = w - tx - wb - 16 * s - b.perBar * (bx + gap);
        ctx.lineWidth = Math.max(1, s);
        for (let k = 0; k < b.perBar; k++) {
          const x = x0 + k * (bx + gap);
          if (k === b.inBar) { ctx.fillStyle = pal.ink; ctx.fillRect(x, by - bx / 2, bx, bx); }
          else { ctx.strokeStyle = C.rgba(pal.ink, 0.8); ctx.strokeRect(x + 0.5, by - bx / 2 + 0.5, bx - 1, bx - 1); }
        }
        G.text(ctx, cart.bpm + ' BPM', x0 - 22 * s, by, fs, Object.assign({}, o, { align: 'right', color: C.rgba(pal.ink, 0.55) }));
      }
      if (H.stats) {
        const draw = (I, a) => { if (!I || !I.L.stats) return; ctx.globalAlpha = a;
          G.text(ctx, String(I.L.stats(I.state, I.local, I.E)).toUpperCase(), w / 2, h - m - 54 * s, fs * 0.92, Object.assign({}, o, { align: 'center', color: C.rgba(pal.ink, 0.7) })); };
        if (nxt) { draw(cur, 1 - C.smooth(p * 2)); draw(nxt, C.smooth(p * 2 - 1)); } else draw(cur, 1);
        ctx.globalAlpha = 1;
      }
      if (H.progress) {
        const I = (p > 0.5 && nxt) ? nxt : cur, f = C.clamp(I.local / (I.shot.dur + 1e-9));
        ctx.fillStyle = C.rgba(pal.ink, 0.8); ctx.fillRect(m, h - m + 6 * s, (w - 2 * m) * f, Math.max(1, s));
      }
      ctx.restore();
    }

    function draw(dt) {
      const A = active(T);
      const keep = {};
      const insts = A.list.map((a) => { keep[a.key] = 1; return instance(a, dt); });
      for (const k in live) if (!keep[k]) delete live[k];
      composite(insts[0], insts[1], A.p, insts[1] ? transOf(insts[1].shot.index) : null);
      hud(insts[0], insts[1], A.p);
    }

    const api = {
      get cart() { return cart; },
      advance(dt) {
        dt = Math.max(0, Math.min(dt, 0.25));
        if (dt > 0) fps = fps * 0.92 + (1 / dt) * 0.08;
        T += dt * tscale; draw(dt * tscale);
      },
      // follow an outside clock exactly (an audio track): small steps advance, jumps re-render. No reduced-motion scaling.
      advanceTo(t) {
        const d = t - T;
        if (d < -1e-4 || d > 0.5) { this.renderAt(t); return; }
        if (d > 0) fps = fps * 0.92 + (1 / Math.max(d, 1 / 240)) * 0.08;
        T = t; draw(Math.max(d, 1e-4));
      },
      renderAt(t) { T = Math.max(0, t); for (const k in live) live[k].local = -1e9; draw(1 / 60); },
      resize(w, h) { canvas.width = Math.max(2, w | 0); canvas.height = Math.max(2, h | 0); live = {}; },
      setCart(c, keepTime) { setCart(c, keepTime); },
      goto(i) { i = ((i % cart.shots.length) + cart.shots.length) % cart.shots.length;
        const loop = Math.floor(T / total); T = loop * total + starts[i] + 0.001; live = {}; draw(1 / 60); },
      refresh() { live = {}; },
      setFps(f) { fps = f; },
      info() { const A = active(T), a = A.list[A.list.length > 1 && A.p > 0.5 ? 1 : 0];
        return { T, total, shot: a.j, local: a.local, label: cart.shots[a.j].label, layer: cart.shots[a.j].layer, transition: A.p }; },
    };
    setCart(cartIn);
    return api;
  };
})(globalThis.GEN = globalThis.GEN || {});
