/* film.js: the CSE hallway loop, 48 s, 1920x1080 design. Every frame is a pure function of t (seconds).
   Scenes follow storyboard.md rows; each colored field comes in as a wipe whose edge is the line.
   The loop seam (48 = 0) falls inside the yellow wipe of scene A, so it is mid-motion.
   All words are DRAFT (storyboard.md); facts come from brief.md section 5. */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const M = DHS.math, A = DHS.art, B = DHS.blocks, LN = DHS.line, C = DHS.C;
  const LEN = 48, W = 1920, H = 1080;
  const { prog, smooth, outCubic, inOut, outBack, lerp, clamp } = M;

  // ---------------- small helpers ----------------
  const T = (ctx, s, x, y, px, color, a = 1, wt = 800, align = 'left') => { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); ctx.fillStyle = color; ctx.font = DHS.type.font(px, wt); ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y); ctx.restore(); };
  const enter = (t, t0, d = 0.5) => outCubic(prog(t, t0, t0 + d));            // 0 -> 1 arrival
  const rise = (ctx, s, x, y, px, color, t, t0, wt = 800, align) => { const e = enter(t, t0, 0.55); T(ctx, s, x, y + 34 * (1 - e), px, color, e, wt, align); };
  const mono = (ctx, s, x, y, px, color, a = 1) => { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = color; ctx.font = `500 ${px}px ${DHS.type.MONO}`; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y); ctx.restore(); };
  function pltwLock(ctx, color, a = 1) {
    ctx.save(); ctx.globalAlpha *= a; const w = A.pltwLogo(ctx, 96, 976, 40, color);
    ctx.fillStyle = color; ctx.globalAlpha *= 0.6; ctx.fillRect(96 + w + 22, 974, 3, 44); ctx.restore();
    T(ctx, 'Computer Science Essentials', 96 + w + 46, 1012, 34, color, a, 700);
  }
  function academyLock(ctx, a = 1) {
    ctx.save(); ctx.globalAlpha *= a; A.badge(ctx, 150, 990, 58); ctx.restore();
    T(ctx, 'Information Technology & Cybersecurity Academy', 232, 980, 34, C.WHITE, a, 700);
    T(ctx, 'Danbury High School', 232, 1022, 28, C.WHITE, a * 0.92, 600);
  }
  // a block flying in from (dx, dy) away and landing at (x, y) exactly at tSnap
  const flyIn = (t, tSnap, dur = 0.55) => { const u = prog(t, tSnap - dur, tSnap); return t >= tSnap ? 0 : 1 - outCubic(u); };
  const snapBump = (t, tSnap) => (t >= tSnap && t < tSnap + 0.25 ? Math.sin(Math.PI * (t - tSnap) / 0.25) * 6 : 0);
  // a hat block whose children arrive one by one (each snaps at its time); returns the hat's drawn height
  function snapStack(ctx, t, x, y, s, hatMake, kids, snaps, from = [1400, 0]) {
    const k = snaps.slice(1).filter((ts) => t >= ts).length;
    if (t < snaps[0] - 0.55) return;
    const hy = y - flyIn(t, snaps[0], 0.45) * 260;
    const hat = hatMake(kids.slice(0, k).map((f) => f()));
    ctx.save(); ctx.globalAlpha *= clamp(prog(t, snaps[0] - 0.55, snaps[0] - 0.35)); B.drawStack(ctx, [hat], x, hy + snapBump(t, snaps[0]), s); ctx.restore();
    // the next child, in flight
    if (k < kids.length) { const ts = snaps[k + 1], f = flyIn(t, ts, 0.55);
      if (t > ts - 0.55) { const placed = kids.slice(0, k).reduce((a, mk) => a + B.hOf(mk()), 0);
        const cx = x + B.K.BAR * s + f * from[0], cy = y + (56 + placed) * s + f * from[1];
        ctx.save(); ctx.globalAlpha *= clamp(1 - f * 0.6); B.drawStack(ctx, [kids[k]()], cx, cy, s); ctx.restore(); } }
  }
  // wipes: an edge line sweeps across and the new scene shows on one side of it
  function edgeLine(ctx, x0, y0, x1, y1, color) { ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = color; ctx.globalAlpha = 0.28; ctx.lineWidth = 42; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.globalAlpha = 1; ctx.lineWidth = 16; ctx.stroke(); ctx.restore(); }

  // ---------------- block programs (MakeCode look for every tool; labels DRAFT) ----------------
  const { D, N, stmt, hat, cblock, rep, bool, opts, COL } = B;
  const appHat = (kids) => hat(COL.BASIC, 'when', D('Button1'), '.Click', opts({ stack: kids }));
  const appKids = [() => stmt(COL.VAR, 'set', D('Ball1'), '.PaintColor to', D('red')), () => stmt(COL.INPUT, 'call', D('Sound1'), '.Play')];
  const vexHat = (kids) => hat(COL.BASIC, 'when started', opts({ stack: kids }));
  const vexKids = (sel = -1) => [() => stmt(COL.LOOPS, 'drive', D('forward'), 'for', N('200'), D('mm'), opts({ selected: sel === 0 })),
    () => stmt(COL.LOOPS, 'set drive velocity to', N('100'), '%', opts({ selected: sel === 1 })),
    () => stmt(COL.LOOPS, 'drive', D('forward'), 'for', N('400'), D('mm'), opts({ selected: sel === 2 }))];
  const PINS = '#b5292c';   // MakeCode's Pins category is a deep red (approximate)
  const bitHat = (kids) => hat(COL.BASIC, 'forever', opts({ stack: kids }));
  // water for 2 s when the soil is dry, then check again in 5 minutes (Bryan: "you don't sample 60 times a second")
  const bitKids = [() => cblock(COL.LOGIC, 'if', bool(COL.LOGIC, rep(PINS, 'analog read pin', D('P0')), D('<'), N('300')), 'then', opts({ stack: [
      stmt(PINS, 'digital write pin', D('P1'), 'to', N('1')), stmt(COL.BASIC, 'pause (ms)', N('2000')), stmt(PINS, 'digital write pin', D('P1'), 'to', N('0'))] })),
    () => stmt(COL.BASIC, 'pause (ms)', N('300000'))];

  // ---------------- paths ----------------
  const ROAD = [['M', -40, 900], ['C', 400, 900, 600, 760, 900, 760], ['C', 1250, 760, 1350, 620, 1560, 560], ['C', 1700, 520, 1800, 520, 1980, 540]];
  const TO_PHONE = [['M', 930, 470], ['L', 1150, 470], ['Q', 1180, 470, 1180, 440], ['L', 1180, 330], ['Q', 1180, 300, 1210, 300],
    ['L', 1564, 300], ['Q', 1610, 300, 1610, 346], ['L', 1610, 954], ['Q', 1610, 1000, 1564, 1000], ['L', 1256, 1000], ['Q', 1210, 1000, 1210, 954], ['L', 1210, 346], ['Q', 1210, 300, 1256, 300]];
  const TO_PLANT = [['M', 1408, 640], ['C', 1480, 640, 1520, 580, 1600, 610], ['C', 1680, 640, 1740, 660, 1793, 732]];

  // ---------------- scenes ----------------
  const scenes = [];
  const S = (o) => scenes.push(o);

  // A. apps on yellow (rows 1-2). Comes in with the seam wipe (46.8 -> 49.2 = -1.2 -> 1.2).
  S({ t0: -1.2, t1: 11.4, bg: C.YELLOW, wipe: { t0: -1.2, t1: 1.2, dir: 'right', line: '#fff' },
    draw(ctx, t) {
      // hero: "Never coded? Start here." shrinks into the support line as "Build your own apps." arrives
      const sw = inOut(prog(t, 4.0, 4.6));
      const e0 = enter(t, 0.5);
      T(ctx, 'Never coded? Start here.', lerp(96, 100, sw), lerp(170, 236, sw) + 34 * (1 - e0), lerp(96, 44, sw), C.INK, e0, sw > 0.5 ? 600 : 800);
      rise(ctx, 'Build your own apps.', 96, 170, 96, C.INK, t, 4.15);
      // blocks
      snapStack(ctx, t, 120, 330, 1.8, appHat, appKids, [2.0, 4.0, 5.0]);
      // the line draws the phone
      const P = LN.get('toPhone', TO_PHONE), u = smooth(prog(t, 5.2, 7.4));
      const ph = { fill: smooth(prog(t, 7.4, 7.9)), press: t > 7.85 && t < 8.15 ? 1 : 0, red: t >= 8.0 ? 1 : 0, bounce: t >= 8.0 ? Math.abs(Math.sin((t - 8.0) * 5.2)) * 90 * Math.exp(-(t - 8.0) * 1.1) : 0 };
      if (t > 7.1) { ctx.save(); ctx.globalAlpha = smooth(prog(t, 7.1, 7.5)); A.phone(ctx, 1210, 300, 400, 700, ph); ctx.restore(); }
      if (u > 0) LN.draw(ctx, P, 0, u, { color: C.BLUE, glow: '#fff', glowAlpha: 0.5, head: u < 1 });
      rise(ctx, 'MIT App Inventor', 1610, 1050, 36, C.INK, t, 6.0, 700, 'right');
      pltwLock(ctx, C.INK, enter(t, 0.9));
    } });

  // B. self-driving cars on Danbury Blue (row 3). The line comes back along the road, right to left.
  // The car runs the blocks: drives, stalls on the hill (wheels spin), a velocity block snaps in, it climbs.
  const carU = (t) => t < 13.2 ? -0.2 : t < 14.8 ? lerp(-0.05, 0.5, inOut(prog(t, 13.2, 14.8))) : t < 16.0 ? lerp(0.5, 0.58, outCubic(prog(t, 14.8, 15.5)))
    : t < 17.6 ? lerp(0.58, 0.86, inOut(prog(t, 16.0, 17.4))) : lerp(0.86, 1.15, M.inCubic(prog(t, 17.6, 18.9)));
  const carSel = (t) => t >= 13.2 && t < 15.6 ? 0 : t >= 15.6 && t < 16.0 ? 1 : t >= 16.0 && t < 17.6 ? 2 : -1;
  S({ t0: 9.6, t1: 19.0, bg: C.BLUE, wipe: { t0: 9.6, t1: 11.2, dir: 'road' },
    draw(ctx, t) {
      const P = LN.get('road', ROAD);
      ctx.save(); ctx.strokeStyle = C.ROAD; ctx.lineWidth = 150; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(P.xs[0], P.ys[0]); for (let i = 1; i < P.n; i++) ctx.lineTo(P.xs[i], P.ys[i]); ctx.stroke(); ctx.restore();
      const back = smooth(prog(t, 9.6, 11.2)); LN.draw(ctx, P, 1 - back, 1, { color: '#fff', head: back < 1 });
      rise(ctx, 'Program self-driving cars.', 96, 170, 96, C.WHITE, t, 10.9);
      rise(ctx, 'VEXcode VR  ·  VEXcode EXP', 100, 236, 44, C.YELLOW, t, 11.3, 700);
      snapStack(ctx, t, 120, 290, 1.6, vexHat, vexKids(carSel(t)), [12.0, 12.6, 15.6, 16.0]);
      const u = carU(t);
      if (u > -0.15 && u < 1.15) { const p = LN.at(P, clamp(u, 0, 1)), ext = u < 0 ? u * P.len : u > 1 ? (u - 1) * P.len : 0, s = 0.95;
        const stallSpin = t > 14.8 ? (Math.min(t, 16.0) - 14.8) * 9 : 0;     // wheels keep turning while the car barely moves
        const shake = t > 15.1 && t < 16.0 ? Math.sin(t * 60) * 1.5 : 0;
        ctx.save(); ctx.translate(p.x + Math.cos(p.a) * ext, p.y + Math.sin(p.a) * ext + shake); ctx.rotate(p.a); A.sdv(ctx, 0, -128 * s, s, u * P.len / 60 + stallSpin); ctx.restore(); }
      pltwLock(ctx, C.WHITE);
    } });

  // C. the same program as Python, on PLTW Blue (row 4)
  const PY = ['drivetrain.drive_for(FORWARD, 200, MM)', 'drivetrain.set_drive_velocity(100, PERCENT)', 'drivetrain.drive_for(FORWARD, 400, MM)'];
  S({ t0: 18.0, t1: 24.9, bg: C.PLTW_BLUE, wipe: { t0: 18.0, t1: 18.8, dir: 'right', line: '#fff' },
    draw(ctx, t) {
      rise(ctx, 'Then write it in Python.', 96, 170, 96, C.WHITE, t, 18.7);
      rise(ctx, 'Python', 100, 236, 44, C.YELLOW, t, 19.1, 700);
      const typing = (i) => [19.4 + i * 1.1, 19.4 + i * 1.1 + 1.0];
      let sel = -1; PY.forEach((s, i) => { const [a, b] = typing(i); if (t >= a && t < b + 0.1) sel = i; });
      const fade = 1 - smooth(prog(t, 22.6, 23.3));
      if (fade > 0) { ctx.save(); ctx.globalAlpha = fade; B.drawStack(ctx, [vexHat(vexKids(sel).map((f) => f()))], 120, 290, 1.6); ctx.restore(); }
      const slide = inOut(prog(t, 22.9, 23.7)), px = lerp(910, 120, slide);
      PY.forEach((s, i) => { const [a, b] = typing(i), n = Math.floor(s.length * prog(t, a, b)); if (n <= 0) return;
        const y = 440 + i * 70; mono(ctx, s.slice(0, n), px, y, 36, C.WHITE);
        if (t < b + 0.1 || (i === PY.length - 1 && t < 24.2)) { ctx.font = `500 36px ${DHS.type.MONO}`; const w = ctx.measureText(s.slice(0, n)).width; edgeLine(ctx, px, y + 16, px + w, y + 16, '#fff'); } });
      pltwLock(ctx, C.WHITE);
    } });

  // D. Academy red: sensing (row 5), then flying (row 6). Red rises from the bottom.
  const SMILE = '0000001010000001000101110';
  const CENTER = [960, 470];
  const dronePos = (t) => {   // the drone does each line of code as it lands, then flies into the middle of the end card
    let x = t < 32.6 ? 1350 : t < 33.6 ? lerp(1350, 1650, inOut(prog(t, 32.6, 33.6))) : 1650;
    let y = lerp(860, 420, inOut(prog(t, 31.0, 32.2))) + (t > 33.8 && t < 35.8 ? Math.sin((t - 33.8) * 4) * 6 : 0);
    let tilt = t > 32.3 && t < 33.6 ? 0.12 * Math.sin(Math.PI * prog(t, 32.3, 33.6)) : 0, s = 0.8;
    if (t > 36.2) { const u = inOut(prog(t, 36.2, 38.6)); x = lerp(1650, CENTER[0], u); y = lerp(420, CENTER[1], u) - Math.sin(Math.PI * u) * 60; tilt = -0.16 * Math.sin(Math.PI * u); s = lerp(0.8, 1.0, u); }
    return { x, y, tilt, s };
  };
  const TO_DRONE = [['M', 690, 369], ['C', 940, 369, 1000, 900, 1350, 892]];
  S({ t0: 24.0, t1: 38.6, bg: C.RED, wipe: { t0: 24.0, t1: 24.8, dir: 'up', line: '#fff' },
    draw(ctx, t) {
      const row6 = smooth(prog(t, 29.9, 30.5));
      if (row6 < 1) { const a = 1 - row6;
        ctx.save(); ctx.globalAlpha = a; rise(ctx, 'Build things that sense', 96, 150, 88, C.WHITE, t, 24.6); rise(ctx, 'the world around them.', 96, 246, 88, C.WHITE, t, 24.8);
        rise(ctx, 'BBC micro:bit', 100, 306, 40, C.WHITE, t, 25.1, 600);
        snapStack(ctx, t, 96, 335, 1.35, bitHat, bitKids, [25.4, 25.9, 26.4]);
        ctx.restore(); }
      // micro:bit, wire and plant: in for row 5, out (down) for row 6, so nothing suggests the micro:bit flies the drone
      const mbIn = outCubic(prog(t, 24.6, 25.2)), drop = M.inCubic(row6) * 700, my = 640 + (1 - mbIn) * 500 + drop;
      const rows = Math.floor(prog(t, 29.0, 29.6) * 5 + 1e-6), pat = SMILE.split('').map((c, i) => (Math.floor(i / 5) < rows ? c : '0')).join('');
      if (row6 < 1) {
        const P = LN.get('toPlant', TO_PLANT), u = smooth(prog(t, 25.2, 26.0));
        ctx.save(); ctx.translate(0, drop); if (u > 0) LN.draw(ctx, P, 0, u, { color: '#fff', head: u < 1, width: 10 });
        const dry = smooth(prog(t, 26.4, 27.2)) * (1 - smooth(prog(t, 28.4, 29.2)));
        const drops = []; if (t > 27.4 && t < 29.4) for (let k = 0; k < 3; k++) drops.push(M.mod((t - 27.4) * 2.5 + k / 3, 1));
        A.plant(ctx, 1720, 800, 1.0, dry, drops); ctx.restore();
        A.microbit(ctx, 1280, my, 0.85, pat);
      }
      // row 6: Python strips snap like blocks, and the drone does each one
      if (row6 > 0) {
        rise(ctx, 'Code things that fly.', 96, 170, 96, C.WHITE, t, 30.2);
        rise(ctx, 'CoDrone EDU  ·  Python', 100, 236, 44, C.WHITE, t, 30.5, 600);
        const code = ['drone.takeoff()', 'drone.set_roll(50)', 'drone.move(1)', 'drone.hover(2)'], ts = [31.0, 32.3, 32.6, 33.8];
        code.forEach((s, i) => { const f = flyIn(t, ts[i], 0.45); if (t < ts[i] - 0.45) return; const x = 120 - f * 700, y = 330 + i * 92;
          ctx.save(); ctx.globalAlpha = clamp(1 - f); A.rr(ctx, x, y, 560, 78, 10); ctx.fillStyle = C.INK; ctx.fill(); ctx.fillStyle = C.YELLOW; ctx.fillRect(x, y, 12, 78);
          const on = t >= ts[i] && t < (ts[i + 1] || 36.0); if (on) { ctx.strokeStyle = C.YELLOW; ctx.lineWidth = 4; A.rr(ctx, x, y, 560, 78, 10); ctx.stroke(); }
          ctx.font = `500 34px ${DHS.type.MONO}`; ctx.fillStyle = C.YELLOW; ctx.fillText('drone', x + 36, y + 51); const w = ctx.measureText('drone').width; ctx.fillStyle = '#fff'; ctx.fillText(s.slice(5), x + 36 + w, y + 51); ctx.restore(); });
        // the line runs from the code to the drone, then becomes its flight path
        const L0 = LN.get('toDrone', TO_DRONE), lead = smooth(prog(t, 30.5, 31.0));
        if (lead > 0) LN.draw(ctx, L0, 0, lead, { color: '#fff', head: lead < 1, width: 13 });
        if (t > 31.0) { ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(1350, 892);
          for (let tt = 31.0; tt < t; tt += 1 / 30) { const q = dronePos(tt); ctx.lineTo(q.x, q.y + 30 * q.s); } const q = dronePos(t); ctx.lineTo(q.x, q.y + 30 * q.s);
          ctx.strokeStyle = '#fff'; ctx.globalAlpha = 0.28; ctx.lineWidth = 34; ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 13; ctx.stroke(); ctx.restore(); }
        const p = dronePos(t); ctx.save(); ctx.globalAlpha = row6; A.drone(ctx, p.x, p.y, p.s, p.tilt, t * 30); ctx.restore();
      }
      academyLock(ctx, enter(t, 24.7));
    } });

  // E. end card on Danbury Blue (row 7): the drone flies in, bursts into dots, they swirl and form the course name
  let DOTS = null;
  function makeDots() {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = 300; const c = cv.getContext('2d');
    c.fillStyle = '#fff'; c.font = DHS.type.font(110, 800); c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('Computer Science Essentials', W / 2, 200);
    const d = c.getImageData(0, 0, W, 300).data, pts = [];
    for (let y = 0; y < 300; y += 7) for (let x = 0; x < W; x += 7) if (d[(y * W + x) * 4 + 3] > 128) pts.push([x, y + 430 - 200]);
    let s = 7; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    DOTS = pts.map(([x, y]) => ({ x, y, th: rnd() * 6.283, R: 120 + rnd() * 520, z: rnd(), d: rnd() * 0.45, spin: 1.4 + rnd() * 1.2 }));
  }
  const BURST = 38.7, GATHER = 39.6, SETTLE = 40.9;
  S({ t0: 37.4, t1: 49.3, bg: C.BLUE, wipe: { t0: 37.4, t1: 38.4, dir: 'left', line: '#fff' },
    draw(ctx, t) {
      if (!DOTS) makeDots();
      if (t < BURST) { const p = dronePos(t), k = 1 - M.inCubic(prog(t, BURST - 0.15, BURST)); A.drone(ctx, p.x, p.y, p.s * k, p.tilt, t * 30); }
      const out = smooth(prog(t, 46.0, 46.8)), oa = 1 - out;
      ctx.save(); ctx.translate(out * 600, 0); ctx.globalAlpha = oa;
      // a soft ring where the drone was (one gentle pulse, no flash)
      const rp = prog(t, BURST, BURST + 0.6); if (rp > 0 && rp < 1) { ctx.save(); ctx.globalAlpha = 0.45 * (1 - rp); ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(CENTER[0], CENTER[1], 40 + rp * 360, 0, 6.283); ctx.stroke(); ctx.restore(); }
      const typeIn = smooth(prog(t, SETTLE - 0.1, SETTLE + 0.35));
      if (t > BURST && typeIn < 1) { ctx.fillStyle = '#fff';
        for (const p of DOTS) {
          const b = outCubic(prog(t, BURST, BURST + 1.0)), g = inOut(prog(t, GATHER + p.d, SETTLE)), ang = p.th + p.spin * (b + 1.2 * g);
          const r = p.R * b, bx = CENTER[0] + Math.cos(ang) * r, by = CENTER[1] + Math.sin(ang) * r * 0.55;
          const x = lerp(bx, p.x, g), y = lerp(by, p.y, g), rad = lerp(1.6 + p.z * 3.6, 3.4, g);
          ctx.globalAlpha = oa * (1 - typeIn); ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.283); ctx.fill(); } }
      ctx.globalAlpha = oa; T(ctx, 'Computer Science Essentials', W / 2, 430, 110, C.WHITE, typeIn, 800, 'center');
      ctx.globalAlpha = oa * enter(t, 41.1); A.pltwLogo(ctx, W / 2 - 400.36 * 70 / 99.89 / 2, 220, 70, '#fff'); ctx.globalAlpha = oa;
      rise(ctx, 'No coding experience needed.', W / 2, 560, 64, C.YELLOW, t, 41.5, 800, 'center');
      rise(ctx, 'No necesitas experiencia previa.', W / 2, 628, 40, C.WHITE, t, 42.0, 600, 'center');
      rise(ctx, 'Não precisa de experiência prévia.', W / 2, 682, 40, C.WHITE, t, 42.4, 600, 'center');
      rise(ctx, 'Ask your counselor about Computer Science Essentials.', W / 2, 840, 44, C.WHITE, t, 43.1, 700, 'center');
      ctx.restore();
    } });

  // ---------------- render ----------------
  function clipFor(ctx, w, t) {
    const u = inOut(prog(t, w.t0, w.t1));
    if (w.dir === 'right') { const x = lerp(-60, W + 60, u); ctx.beginPath(); ctx.rect(-10, -10, x + 10, H + 20); ctx.clip(); return () => edgeLine(ctx, x, -40, x, H + 40, w.line); }
    if (w.dir === 'left') { const x = lerp(W + 60, -60, u); ctx.beginPath(); ctx.rect(x, -10, W - x + 10, H + 20); ctx.clip(); return () => edgeLine(ctx, x, -40, x, H + 40, w.line); }
    if (w.dir === 'up') { const y = lerp(H + 60, -60, u); ctx.beginPath(); ctx.rect(-10, y, W + 20, H - y + 10); ctx.clip(); return () => edgeLine(ctx, -40, y, W + 40, y, w.line); }
    if (w.dir === 'road') { const P = LN.get('road', ROAD), h = LN.at(P, 1 - smooth(prog(t, w.t0, w.t1))); ctx.beginPath(); ctx.rect(h.x - 4, -10, W - h.x + 14, H + 20); ctx.clip(); return null; }
  }
  function render(ctx, t, w, h, s) {
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.fillStyle = C.BLUE; ctx.fillRect(0, 0, W, H);
    // which scenes are on screen (checking t and t +- LEN so the seam wraps), in start order
    const on = [];
    for (const sc of scenes) for (const k of [-LEN, 0, LEN]) { const tt = t + k; if (tt >= sc.t0 && tt <= sc.t1) on.push([sc, tt]); }
    on.sort((a, b) => (a[1] - a[0].t0) > (b[1] - b[0].t0) ? -1 : 1);   // the newest scene (smallest local time) draws last
    const edges = [];
    for (const [sc, tt] of on) {
      ctx.save();
      const wiping = sc.wipe && tt < sc.wipe.t1;
      if (wiping) { const e = clipFor(ctx, sc.wipe, tt); if (e) edges.push(e); }
      ctx.fillStyle = sc.bg; ctx.fillRect(0, 0, W, H);
      sc.draw(ctx, tt);
      ctx.restore();
    }
    for (const e of edges) e();
  }
  DHS.film = { length: LEN, render, scenes, build() { this.tl = { cues: {} }; return this.tl; } };
})(globalThis);
