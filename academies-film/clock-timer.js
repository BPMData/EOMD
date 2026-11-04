/* Academies hallway film: classroom add-on (Nov 4, 2026). Injected by tools/build_academies_clock.py into a copy of the
   master; the master itself stays clock-free (its MP4 renders are unchanged).
   1. Wall clock, always on, top-right: h:mm (12-hour, no AM/PM, like the CD-ROM's status-bar clock).
   2. Session timer, from the CD-ROM screensaver (living/sound-timer.js): Start timer + Minutes (5-30, Other... 1-240),
      key T, ?min=. While it runs: the time left just left of the wall clock in 10-s steps rounded up (20:00, 19:50 ... 00:00)
      and a progress bar along the bottom edge in minute segments. At the end: one soft two-note chime (plays even when the
      sound is off); the readout holds 00:00 until Reset timer. No end card (no approved copy; same as the Exploration poster).
   Drawn on top of DHS.film.render in design pixels, so it scales with the film in both orientations.
   ?noclock hides the wall clock; ?notimer hides the timer controls. Knobs: CT below. */
(function (G) {
  'use strict';
  const DHS = G.DHS, Q = new URLSearchParams(location.search), $ = (i) => document.getElementById(i);
  const CT = {
    margin: 28,              // from the frame's top/right edge (design px)
    plate: 'rgba(10,22,51,.88)', edge: 'rgba(255,255,255,.22)',   // ink #0A1633 plate
    clockSize: 60, clockInk: '#FFFFFF',
    timerSize: 84, timerInk: '#FFD100',                           // Danbury yellow on ink: 12.23:1 (brand.md)
    step: 10,                // readout step in seconds, rounded up
    barH: 16, barGap: 3,     // bottom progress bar height; gap between minute segments
    padX: 22, padY: 14, gap: 12,
  };
  const showClock = !Q.has('noclock');
  const tm = { on: false, start: 0, dur: 0, done: false, doneAt: 0 };
  G.TM = tm;

  /* ---------- text ---------- */
  const two = (n) => String(n).padStart(2, '0');
  const wallText = () => { const d = new Date(); return (d.getHours() % 12 || 12) + ':' + two(d.getMinutes()); };
  const left = () => tm.done ? 0 : Math.max(0, tm.dur - (Date.now() - tm.start) / 1000);
  const timerText = () => { const q = Math.ceil(left() / CT.step - 1e-9) * CT.step; return two(Math.floor(q / 60)) + ':' + two(q % 60); };
  const frac = () => Math.min(1, (Date.now() - tm.start) / 1000 / tm.dur);

  /* ---------- drawing (design px; ctx already scaled by the caller) ---------- */
  // a right-aligned readout on a plate of height h, text centred in it; width fits the widest of str and a template so the
  // plate doesn't jitter as digits change. Returns the plate's left edge.
  function plate(ctx, str, tmpl, size, ink, right, top, h) {
    DHS.type.set(ctx, 'display', size, 0);
    const tw = Math.max(ctx.measureText(str).width, ctx.measureText(tmpl).width);
    const w = Math.ceil(tw + 2 * CT.padX), x = right - w;
    ctx.fillStyle = CT.plate; ctx.fillRect(x, top, w, h);
    ctx.strokeStyle = CT.edge; ctx.lineWidth = 2; ctx.strokeRect(x + 1, top + 1, w - 2, h - 2);
    ctx.fillStyle = ink; ctx.textAlign = 'right'; ctx.fillText(str, right - CT.padX, top + h / 2 + size * 0.36);
    return x;
  }
  function bar(ctx, W, H) {
    const f = frac(), mins = Math.max(1, Math.round(tm.dur / 60)), y = H - CT.barH, x0 = 0, w = W;
    ctx.fillStyle = CT.plate; ctx.fillRect(x0, y, w, CT.barH);
    ctx.fillStyle = CT.timerInk;
    if (mins > 60) { ctx.fillRect(x0, y + 3, w * f, CT.barH - 6); return; }   // too many minutes for visible segments
    const seg = w / mins, fill = f * mins;
    for (let i = 0; i < Math.ceil(fill); i++) {
      const part = Math.min(1, fill - i);
      ctx.fillRect(x0 + i * seg + CT.barGap / 2, y + 3, (seg - CT.barGap) * part, CT.barH - 6);
    }
  }
  function overlay(ctx, W, H, scale) {
    if (!showClock && !tm.on) return;
    ctx.save(); ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    // one row along the top edge: [time left] [wall clock]; both plates share the taller one's height
    const h = Math.round((tm.on ? CT.timerSize : CT.clockSize) * 0.78 + 2 * CT.padY);
    let right = W - CT.margin;
    if (showClock) right = plate(ctx, wallText(), '12:00', CT.clockSize, CT.clockInk, right, CT.margin, h) - CT.gap;
    if (tm.on) { plate(ctx, timerText(), '00:00', CT.timerSize, CT.timerInk, right, CT.margin, h); bar(ctx, W, H); }
    ctx.restore();
  }

  // draw on top of every frame; the film itself is still a pure function of t
  const render = DHS.film.render;
  DHS.film.render = (ctx, t, W, H, scale = 1) => { render(ctx, t, W, H, scale); checkDone(); overlay(ctx, W, H, scale); };

  /* ---------- the chime (from living/sound-timer.js) ---------- */
  let cctx = null;
  function chimeCtx() {
    const P = G.__dhs; if (P && P.st.audio) return P.st.audio;
    if (!cctx) { const AC = G.AudioContext || G.webkitAudioContext; if (AC) cctx = new AC(); }
    return cctx;
  }
  // one soft two-note chime (A4 then F5, sine + faint octave, lowpassed)
  function chime() {
    const c = chimeCtx(); if (!c) return; if (c.resume) c.resume();
    const t = c.currentTime + 0.05, lvl = 0.16;
    [[69, 0], [77, 0.9]].forEach(([m, dt]) => {
      const f = 440 * Math.pow(2, (m - 69) / 12);
      for (const [mul, a] of [[1, 1], [2, 0.12]]) {
        const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 2500; o.frequency.value = f * mul;
        g.gain.setValueAtTime(0, t + dt); g.gain.linearRampToValueAtTime(lvl * a, t + dt + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 3.2);
        o.connect(lp); lp.connect(g); g.connect(c.destination); o.start(t + dt); o.stop(t + dt + 3.3);
      }
    });
  }
  function checkDone() { if (tm.on && !tm.done && frac() >= 1) { tm.done = true; tm.doneAt = Date.now(); chime(); } }
  setInterval(checkDone, 1000);   // still chimes if the tab's frames are throttled

  /* ---------- controls ---------- */
  // a tap shows the control bar too (the master listens for mousemove only)
  addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') dispatchEvent(new Event('mousemove')); });
  const tb = $('tmr'), ts = $('tmin'), tc = $('tcus');
  if (Q.has('notimer')) { $('tbox').hidden = true; return; }
  ts.onchange = () => { tc.hidden = ts.value !== 'c'; };
  if (Q.get('min')) { const m = String(Math.max(1, Math.min(240, Math.round(+Q.get('min')) || 20))); if (![...ts.options].some((o) => o.value === m)) ts.add(new Option(m, m)); ts.value = m; }
  function timerButton() {
    if (tm.on) { tm.on = false; tm.done = false; tb.textContent = 'Start timer'; ts.disabled = tc.disabled = false; return; }
    tm.dur = (ts.value === 'c' ? Math.max(1, Math.min(240, Math.round(+tc.value) || 20)) : (+ts.value || 20)) * 60;
    tm.start = Date.now(); tm.on = true; tm.done = false; tb.textContent = 'Reset timer'; ts.disabled = tc.disabled = true;
    const c = chimeCtx(); if (c && c.resume) c.resume();   // unlock audio now, so the chime can play later
  }
  tb.onclick = timerButton;
  addEventListener('keydown', (e) => { if ((e.key === 't' || e.key === 'T') && !(e.target instanceof HTMLInputElement)) timerButton(); });
  // a clicked button drops focus, so a later Space (pause) can't press "Reset timer" by accident (Bryan, Oct 9, CD-ROM)
  document.querySelectorAll('#bar button').forEach((b) => b.addEventListener('click', () => b.blur()));

  /* keep the screen awake where supported (a timer on a sleeping screen is no use) */
  let lock = null;
  async function wake() { try { if ('wakeLock' in navigator && !lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch (e) {} }
  wake(); addEventListener('pointerdown', wake);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') wake(); });
})(globalThis);
