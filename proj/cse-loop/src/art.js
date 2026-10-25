/* art.js: the things students make, drawn as vectors (from the approved stills), plus the two brand marks.
   Every function draws in frame pixels (1920x1080 design) and takes its animation state as plain numbers. */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const TAU = Math.PI * 2;
  const C = (DHS.C = { BLUE: '#0033A0', RED: '#D50032', YELLOW: '#FFD100', PLTW_BLUE: '#3e34d9', INK: '#0e0318', WHITE: '#ffffff', ROAD: '#00287f', BEAM: '#b89400' });
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  const circ = (ctx, x, y, r, fill) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill(); };

  // ---- phone with the app: a button that presses itself and a ball that turns red and bounces
  // o: fill 0..1 (screen fill), press 0..1, red 0..1, bounce (px)
  function phone(ctx, x, y, w, h, o = {}) {
    rr(ctx, x, y, w, h, 46); ctx.fillStyle = C.INK; ctx.fill();
    const f = o.fill ?? 1; if (f <= 0) return;
    ctx.save(); rr(ctx, x + 18, y + 40, w - 36, (h - 80) * f, 18); ctx.clip();
    rr(ctx, x + 18, y + 40, w - 36, h - 80, 18); ctx.fillStyle = '#fff'; ctx.fill();
    const pr = o.press || 0, by = y + 70 + pr * 4;
    rr(ctx, x + 38, by, w - 76, 70, 12); ctx.fillStyle = pr > 0.01 ? '#2f6fe0' : '#458ef7'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = DHS.type.font(34, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Tap me!', x + w / 2, by + 36); ctx.textAlign = 'left';
    const red = o.red || 0, bx = x + w / 2, bcy = y + h * 0.62 - (o.bounce || 0);
    circ(ctx, bx, bcy, 72, red > 0.5 ? C.RED : '#8a8f99');
    ctx.globalAlpha = 0.45; circ(ctx, bx - 24, bcy - 26, 18, '#fff'); ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ---- the self-driving car: a yellow, Lego-like build (look reference only; not a copy of any kit). spin = wheel angle
  function sdv(ctx, x, y, s = 1, spin = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.globalAlpha = 0.22; ctx.beginPath(); ctx.ellipse(0, 118, 210, 22, 0, 0, TAU); ctx.fillStyle = '#000'; ctx.fill(); ctx.globalAlpha = 1;
    const wheel = (wx, wy, r, hub) => { circ(ctx, wx, wy, r, '#1b1b1f'); circ(ctx, wx, wy, hub, C.YELLOW);
      for (let k = 0; k < 6; k++) { const a = spin + k * Math.PI / 3; circ(ctx, wx + hub * 0.6 * Math.cos(a), wy + hub * 0.6 * Math.sin(a), 6, '#c9a400'); } circ(ctx, wx, wy, 8, '#26262b'); };
    wheel(-140, 60, 62, 36); wheel(140, 60, 62, 36);
    rr(ctx, -190, -10, 380, 54, 8); ctx.fillStyle = C.YELLOW; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.BEAM; ctx.stroke();
    for (let k = 0; k < 9; k++) circ(ctx, -160 + k * 40, 17, 10, C.BEAM);
    rr(ctx, -95, -118, 190, 112, 14); ctx.fillStyle = '#16161a'; ctx.fill();
    rr(ctx, -70, -98, 140, 62, 6); ctx.fillStyle = '#2b6ef2'; ctx.fill();
    rr(ctx, -120, -150, 240, 38, 8); ctx.fillStyle = C.YELLOW; ctx.fill(); ctx.stroke();
    for (let k = 0; k < 5; k++) circ(ctx, -96 + k * 48, -131, 8, C.BEAM);
    ctx.beginPath(); ctx.moveTo(60, -118); ctx.bezierCurveTo(110, -200, 170, -170, 150, -120); ctx.lineWidth = 6; ctx.strokeStyle = '#e23b3b'; ctx.stroke();
    wheel(-140, 70, 66, 38); wheel(140, 70, 66, 38);
    ctx.restore();
  }

  // ---- micro:bit: 25 LEDs from a 25-char pattern ('1' on), buttons A and B, gold edge connector
  function microbit(ctx, x, y, s = 1, pattern = '0'.repeat(25), pressA = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    rr(ctx, -150, -120, 300, 240, 26); ctx.fillStyle = '#1d1d22'; ctx.fill();
    ctx.fillStyle = '#c8a24a'; ctx.fillRect(-150, 96, 300, 24);
    for (let i = 0; i < 25; i++) { const cx = -64 + (i % 5) * 32, cy = -80 + Math.floor(i / 5) * 32, on = pattern[i] === '1';
      if (on) { ctx.globalAlpha = 0.25; circ(ctx, cx, cy, 16, '#ff3b3b'); ctx.globalAlpha = 1; }
      rr(ctx, cx - 7, cy - 11, 14, 22, 3); ctx.fillStyle = on ? '#ff3b3b' : '#3a3a40'; ctx.fill(); }
    circ(ctx, -118, 0, 18 - pressA * 3, pressA > 0.01 ? '#55555c' : '#3a3a40'); circ(ctx, 118, 0, 18, '#3a3a40');
    ctx.fillStyle = '#fff'; ctx.font = DHS.type.font(24, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A', -118, 52); ctx.fillText('B', 118, 52); ctx.textAlign = 'left';
    ctx.restore();
  }

  // ---- a potted plant with a soil sensor: dry 0..1 (soil lightens, leaves droop), water 0..1 (drips falling)
  function plant(ctx, x, y, s = 1, dry = 0, drops = []) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    // leaves (droop with dryness)
    const droop = dry * 0.9;
    const leaf = (ang, len) => { ctx.save(); ctx.translate(0, -110); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.45, len, 0); ctx.quadraticCurveTo(len * 0.5, len * 0.25, 0, 0);
      ctx.fillStyle = '#3fb34f'; ctx.fill(); ctx.restore(); };
    ctx.strokeStyle = '#2f8a3c'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(droop * 40, -60, droop * 30, -110 + droop * 20); ctx.stroke();
    ctx.save(); ctx.translate(droop * 30, droop * 20);
    leaf(-Math.PI * 0.85 + droop * 0.9, 110); leaf(-Math.PI * 0.15 + droop * 0.9, 120); leaf(-Math.PI * 0.5 + droop * 1.2, 100);
    ctx.restore();
    // pot and soil
    ctx.beginPath(); ctx.moveTo(-110, -10); ctx.lineTo(110, -10); ctx.lineTo(85, 150); ctx.lineTo(-85, 150); ctx.closePath(); ctx.fillStyle = '#f2f2f2'; ctx.fill();
    rr(ctx, -120, -30, 240, 34, 8); ctx.fillStyle = '#ffffff'; ctx.fill();
    const soil = dry > 0 ? `rgb(${Math.round(92 + dry * 80)},${Math.round(62 + dry * 60)},${Math.round(40 + dry * 40)})` : '#5c3e28';
    rr(ctx, -104, -24, 208, 18, 6); ctx.fillStyle = soil; ctx.fill();
    // the sensor fork
    ctx.fillStyle = '#2a2a30'; ctx.fillRect(60, -70, 26, 40); ctx.fillRect(62, -30, 6, 40); ctx.fillRect(78, -30, 6, 40);
    // drips from the pump spout above
    ctx.fillStyle = '#5ec8ff'; for (const d of drops) { ctx.beginPath(); ctx.ellipse(-40, -260 + d * 230, 9, 13, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#d9dde3'; rr(ctx, -70, -300, 70, 30, 8); ctx.fill(); ctx.fillRect(-48, -272, 16, 18);
    ctx.restore();
  }

  // ---- the CoDrone EDU: a small quadcopter seen from the side-front; spin = propeller phase
  function drone(ctx, x, y, s = 1, tilt = 0, spin = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s);
    for (const dx of [-130, 130]) {
      ctx.strokeStyle = '#f4f4f6'; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(dx, -20); ctx.stroke();
      const sq = 0.6 + 0.4 * Math.abs(Math.cos(spin + dx));
      ctx.beginPath(); ctx.ellipse(dx, -34, 92, 20, 0, 0, TAU); ctx.lineWidth = 10; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.ellipse(dx, -34, 84 * sq, 10, 0, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.globalAlpha = 1;
      rr(ctx, dx - 10, -38, 20, 26, 5); ctx.fillStyle = '#2a2a30'; ctx.fill();
    }
    rr(ctx, -72, -30, 144, 70, 22); ctx.fillStyle = '#f4f4f6'; ctx.fill();
    rr(ctx, -40, -14, 80, 20, 8); ctx.fillStyle = '#2a2a30'; ctx.fill();
    circ(ctx, 0, 26, 8, '#38d9ff');
    ctx.restore();
  }

  // ---- PLTW logo: the official wordmark shapes from pltw.org (BMS_br26_pltw-logo), drawn in one color.
  // Source box: x 53.37..453.73, y 76.42..176.31 (400 x 100 units). h = drawn height in px.
  const PLTW_PATHS = [
    'M99.75,145.89c7.74,0,9.99-1.68,9.99-7.56,0-7.47-1.87-9.15-9.99-9.15h-27.53v16.7h27.53ZM53.37,114.07h47.59c12.04,0,15.12.37,19.04,2.33,6.25,3.08,8.59,8.77,8.59,20.53s-2.15,18.01-7.28,21.18c-3.64,2.24-7.84,2.89-18.67,2.89h-30.42v15.31h-18.85v-62.24Z',
    'M142.02 114.07 L160.97 114.07 L160.97 160.91 L203.8 160.91 L203.8 176.31 L142.02 176.31 Z',
    'M226.67 129.47 L198.95 129.47 L198.95 114.07 L273.33 114.07 L273.33 129.47 L245.61 129.47 L245.61 176.31 L226.67 176.31 Z',
    'M301.69 114.07 L319.8 161.48 L335.85 114.07 L358.71 114.07 L374.3 161.48 L392.96 114.07 L412.19 114.07 L386.43 176.31 L361.04 176.31 L347.23 131.52 L332.77 176.31 L307.57 176.31 L282.47 114.07 Z',
    'M453.73 76.42 L453.73 117.16 L439.95 131.51 L439.95 90.19 L398.63 90.19 L412.98 76.42 Z'];
  let P2D = null;
  function pltwLogo(ctx, x, y, h, color = '#fff') {   // (x, y) = top-left of the logo box
    if (!P2D) P2D = PLTW_PATHS.map((d) => new Path2D(d));
    const k = h / 99.89; ctx.save(); ctx.translate(x - 53.37 * k, y - 76.42 * k); ctx.scale(k, k); ctx.fillStyle = color; for (const p of P2D) ctx.fill(p); ctx.restore();
    return 400.36 * k;   // width
  }
  // the Academy badge from Bryan's file, on its own white disc
  function badge(ctx, cx, cy, r) {
    circ(ctx, cx, cy, r, '#fff');
    const im = DHS.IMG && DHS.IMG.badge; if (im && im.complete && im.naturalWidth) ctx.drawImage(im, cx - r * 0.95, cy - r * 0.95, r * 1.9, r * 1.9);
  }
  DHS.art = { phone, sdv, microbit, plant, drone, pltwLogo, badge, rr, circ };
})(globalThis);
