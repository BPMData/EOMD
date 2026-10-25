/* PLAYER RUNTIME, adapted for the CSE hallway loop from engine/src/player/runtime.js (Oct 2026):
   default 60 fps cap and canvas up to 2x the 1920x1080 design (sharp on 4K sets). Otherwise unchanged.
   Visual time is a pure function of a clock; the clock is the AudioContext once
   the synthesized loop is playing (sample-accurate A/V lock, seamless loop via
   AudioBufferSourceNode.loop), and performance.now() before that / when muted.
   Audio is synthesized in the browser with the same DSP code as the offline
   export (in a Web Worker when the sources are embedded, else on the main thread). */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const R = (DHS.runtime = {});

  R.create = (canvas, opts = {}) => {
    const ctx = canvas.getContext('2d', { alpha: false });
    const st = { playing: true, muted: !!opts.muted, orient: opts.orientation || 'auto', maxScale: opts.maxScale || 2,
      base: 0, t0: performance.now() / 1000, audio: null, src: null, aBase: 0, aT0: 0, status: '', listeners: [] };
    const L = () => DHS.film.length;
    const emit = (s) => { st.status = s; st.listeners.forEach((f) => f(s)); };

    // ---- clock
    const clockNow = () => {
      if (st.src && st.audio && st.audio.state === 'running') return st.aBase + (st.audio.currentTime - st.aT0) - (st.audio.outputLatency || st.audio.baseLatency || 0);
      return st.playing ? st.base + (performance.now() / 1000 - st.t0) : st.base;
    };
    const time = () => DHS.math.mod(clockNow(), L());

    // ---- layout: design size by orientation, fit into the window (letterboxed)
    const design = () => { const o = st.orient === 'auto' ? (innerWidth >= innerHeight ? 'landscape' : 'vertical') : st.orient; return o === 'vertical' ? [1080, 1920] : [1920, 1080]; };
    let dims = [0, 0, 1];
    const fit = () => {
      const [W, H] = design(), dpr = devicePixelRatio || 1;
      const s = Math.min((innerWidth * dpr) / W, (innerHeight * dpr) / H, st.maxScale);
      const cw = Math.round(W * s), ch = Math.round(H * s);
      if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
      dims = [W, H, s];
    };
    addEventListener('resize', fit); fit();

    // ---- render loop (rAF only schedules; the frame content depends on time only)
    let raf = 0, frames = 0, fpsT = performance.now(), fps = 0, last = 0; const cap = opts.fps || 60;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (now && now - last < 1000 / cap - 3) return; last = now || 0; // frame cap (opts.fps)
      DHS.film.render(ctx, time(), dims[0], dims[1], dims[2]);
      frames++; const n = performance.now(); if (n - fpsT > 1000) { fps = (frames * 1000) / (n - fpsT); frames = 0; fpsT = n; }
    };

    // ---- audio
    const synth = () => new Promise((resolve, reject) => {
      const cues = (DHS.film.tl || DHS.film.build()).cues;
      const srcEl = document.getElementById('dhs-audio-src');
      if (srcEl && G.Worker && G.Blob) {
        const code = srcEl.textContent + '\nself.onmessage=(e)=>{const r=DHS.audio.render({cues:e.data.cues});self.postMessage({L:r.master.L,R:r.master.R,sr:r.sr},[r.master.L.buffer,r.master.R.buffer]);};';
        const w = new Worker(URL.createObjectURL(new Blob([code], { type: 'text/javascript' })));
        w.onmessage = (e) => { resolve(e.data); w.terminate(); }; w.onerror = (e) => reject(e);
        w.postMessage({ cues });
      } else setTimeout(() => { try { const r = DHS.audio.render({ cues }); resolve({ L: r.master.L, R: r.master.R, sr: r.sr }); } catch (e) { reject(e); } }, 30);
    });
    let buffer = null, synthP = null;
    const startSource = () => {
      if (!buffer || !st.audio || st.muted || !st.playing) return;
      stopSource();
      const t = time(), src = st.audio.createBufferSource(), g = st.audio.createGain();
      src.buffer = buffer; src.loop = true; src.connect(g).connect(st.audio.destination);
      g.gain.setValueAtTime(0, st.audio.currentTime); g.gain.linearRampToValueAtTime(1, st.audio.currentTime + 0.25); // no click on start
      const when = st.audio.currentTime + 0.05;
      src.start(when, DHS.math.mod(t + 0.05, L()));
      st.src = src; st.gain = g; st.aT0 = when; st.aBase = t + 0.05 + (st.audio.outputLatency || st.audio.baseLatency || 0);
    };
    const stopSource = () => { if (st.src) { try { st.src.stop(); } catch (e) {} st.src.disconnect(); st.src = null; } };
    const freezeClock = () => { st.base = clockNow(); st.t0 = performance.now() / 1000; };

    const api = {
      ctx, st, time, fit, get fps() { return fps; }, get audioReady() { return !!buffer; },
      get audioRunning() { return !!(st.audio && st.audio.state === 'running' && st.src); },
      onStatus(f) { st.listeners.push(f); },
      start() { if (!raf) frame(); },
      async enableAudio() { // safe to call repeatedly (e.g. on every user gesture)
        if (st.muted) return;
        if (!st.audio) { const AC = G.AudioContext || G.webkitAudioContext; if (!AC) return emit('no-audio'); st.audio = new AC({ latencyHint: 'playback' }); }
        if (!synthP) { emit('synth'); synthP = synth().then((d) => { buffer = st.audio.createBuffer(2, d.L.length, d.sr); buffer.copyToChannel(d.L, 0); buffer.copyToChannel(d.R, 1); emit('ready'); }).catch((e) => { console.error(e); emit('audio-error'); }); }
        try { await st.audio.resume(); } catch (e) {}
        await synthP;
        if (st.audio.state !== 'running') return emit('blocked');
        if (!st.src) { freezeClock(); startSource(); }
        emit(st.src ? 'playing' : st.status);
      },
      play() { if (st.playing) return; st.t0 = performance.now() / 1000; st.playing = true; startSource(); },
      pause() { if (!st.playing) return; freezeClock(); st.playing = false; stopSource(); },
      toggle() { st.playing ? api.pause() : api.play(); },
      seek(t) { st.base = DHS.math.mod(t, L()); st.t0 = performance.now() / 1000; if (st.src) { stopSource(); startSource(); } },
      mute(m = !st.muted) { freezeClock(); st.muted = m; if (m) stopSource(); else api.enableAudio(); },
      orient(o) { st.orient = o; fit(); },
    };
    return api;
  };
})(globalThis);
