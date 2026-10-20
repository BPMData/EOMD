/* layer "swarm": one 3D cloud of dots that flies between formations on a timeline (`keys`):
   a warp starfield, any m3d surface (sphere, knot ...), WORDS built out of the dots, an endless floor
   (optionally with a self-driving car sweeping it with a lidar beam), or a burst through the camera.
   A key can split the dots between parts, e.g. 60% floor + 40% a word that rises out of it.
   Each dot flies its own curved path, staggered left to right, so formations assemble rather than fade.
   Pure function of time: every position is computed from t (seeking is free). */
(function (G) {
  'use strict';
  const C = G.core, M = G.m3d, TAU = C.TAU, D2R = Math.PI / 180;
  const SW = () => G.layers.swarm;
  const FLOOR_W = 9, FLOOR_L = 14, FLOOR_NEAR = -3, WARP_L = 32;

  G.layers.swarm = {
    about: 'One 3D dot cloud flying between formations on a timeline: warp, 3D shapes, words made of dots, a floor with a self-driving car.',
    knobs: {
      keys: [{ t: 0, shape: 'warp' }, { t: 2, shape: 'sphere' }, { t: 5, shape: 'word', text: 'GEN' }],
      n: [2400, 200, 6000, 100],
      morph: [1.4, 0.1, 6, 0.05],
      stagger: [0.5, 0, 3, 0.05],
      sweep: [0.7, 0, 1, 0.05],
      arc: [0.6, 0, 3, 0.05],
      size: [0.8, 0.1, 3, 0.01],
      depth: [0.12, 0, 1, 0.01],
      yaw: [0, -180, 180, 1],
      pitch: [0, -89, 89, 1],
      dist: [3.2, 0.5, 12, 0.05],
      focal: [1.3, 0.3, 4, 0.05],
      orbit: [0, -90, 90, 0.5],
      sway: [5, 0, 45, 0.5],
      warpSpeed: [6, 0, 30, 0.5],
      fly: [1.2, 0, 8, 0.05],
      spin: [10, -120, 120, 1],
      dot: [2.4, 0.5, 10, 0.1],
      fog: [0.6, 0, 1, 0.01],
      accent: [0.12, 0, 1, 0.01],
      links: [0, 0, 1, 0.01],
      linkDist: [22, 4, 120, 1],
      car: [0, 0, 1, 1],
      scan: [0.5, 0, 4, 0.05],
      pulse: [0.3, 0, 1.5, 0.01],
      streak: [0.06, 0, 0.5, 0.01],
      trail: [0.2, 0, 0.95, 0.01],
      seed: [0, 0, 999, 1],
    },
    // plain-English explanation of each knob, shown under it in the KNOBS panel (common ones: GEN.knobHelp)
    help: {
      keys: "The timeline, one formation per key: { t, shape, text, ... }. Shapes: warp, cloud, burst, floor, word, or a depth shape (sphere, torus, knot, vase, cylinder, sheet, curl). A key may have parts: [{ shape, share, text, size, x, y, z, color, accent, dot }] to split the dots, and cam: { yaw, pitch, dist, x, y } to move the camera. Per key: morph, stagger, arc, sweep.",
      n: "How many dots. More = crisper words, slower drawing.",
      morph: "Seconds each dot takes to fly to its new spot (a key's own morph wins).",
      stagger: "Seconds between the first and last dot setting off, so formations build up instead of jumping.",
      sweep: "1 = dots set off left to right across the new formation; 0 = in random order.",
      arc: "How curved the flight paths are. 0 = straight lines.",
      size: "Height of a word's letters (3D units; a sphere is 1 across its radius). Long words shrink to fit.",
      depth: "Thickness of the letters front to back, so they look solid when the camera turns.",
      yaw: "Camera angle around the formation, in degrees.",
      pitch: "Camera tilt: + looks down (at a floor), - looks up.",
      dist: "Camera distance.",
      focal: "Lens: lower = wide-angle, dramatic depth; higher = flatter.",
      orbit: "Camera circles the formation at this many degrees per second.",
      sway: "A slow side-to-side drift of the camera, in degrees.",
      warpSpeed: "How fast the warp starfield streams at the camera.",
      fly: "How fast a floor slides toward the camera.",
      spin: "Turning speed of 3D shapes, in degrees per second.",
      dot: "Dot size.",
      fog: "Far dots fade into the background.",
      accent: "Share of dots drawn in the accent color (a part's accent wins).",
      links: "Thin lines between neighboring dots, like a network. 0 = none.",
      linkDist: "Longest link in pixels (at 1080p).",
      car: "On: a self-driving car drives across the floor, sweeping it with a lidar beam.",
      scan: "Lidar sweeps per second.",
      streak: "Motion-blur tails: each dot draws a line back to where it was this many seconds ago. Warp becomes hyperspace."
    },
    init(P, E) {
      const n = Math.round(P.n), seed = E.seed;
      const keys = (Array.isArray(P.keys) && P.keys.length ? P.keys : [{ t: 0, shape: 'sphere' }]).map((k) => Object.assign({}, k)).sort((a, b) => (a.t || 0) - (b.t || 0));
      // per-dot random numbers, fixed for the whole shot
      const h = [0, 1, 2, 3, 4, 5].map((c) => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = C.hash(i, c, 7, seed); return a; });
      keys.forEach((k, ki) => {
        k.t = k.t || 0;
        const parts = (k.parts && k.parts.length ? k.parts : [k]).map((p) => Object.assign({}, p));
        const tot = parts.reduce((s, p) => s + (p.share == null ? 1 : +p.share), 0) || 1;
        let acc = 0;
        parts.forEach((p, pi) => {
          p.i0 = Math.round(acc / tot * n); acc += (p.share == null ? 1 : +p.share); p.i1 = Math.round(acc / tot * n); p.cnt = Math.max(1, p.i1 - p.i0);
          p.shape = p.shape || 'sphere';
          if (p.shape === 'word') {
            p.tp = C.textPoints(E.make, p.text || 'GEN', p.cnt, seed * 31 + ki * 7 + pi + 1, p.font, p.weight);
            p.sc = Math.min(p.size || P.size, (p.maxw || 3.4) / Math.max(0.1, p.tp.w));
          }
          if (M.surfaces[p.shape]) { p.nu = Math.max(2, Math.ceil(Math.sqrt(p.cnt))); p.nv = Math.max(2, Math.ceil(p.cnt / p.nu)); }
          if (p.shape === 'floor') { p.nu = Math.max(2, Math.round(Math.sqrt(p.cnt * FLOOR_W / FLOOR_L))); p.nv = Math.max(2, Math.ceil(p.cnt / p.nu)); }
        });
        k.parts = parts;
        k.owner = new Uint16Array(n); parts.forEach((p, pi) => { for (let i = p.i0; i < p.i1; i++) k.owner[i] = pi; });
      });
      const S = { P, n, keys, h, px: new Float32Array(n), py: new Float32Array(n), pr: new Float32Array(n), pa: new Float32Array(n),
        pc: new Uint8Array(n), vis: new Uint8Array(n), qx: new Float32Array(n), qy: new Float32Array(n), sv: new Uint8Array(n),
        o: [0, 0, 0], q: [0, 0, 0], q2: [0, 0, 0], r: [0, 0, 0] };
      // the order each dot sets off in, per key: left to right across the new formation (sweep) mixed with random
      keys.forEach((k) => {
        const xs = new Float32Array(n); let lo = Infinity, hi = -Infinity;
        for (let i = 0; i < n; i++) { SW().pos(S, k, i, k.t, S.o); xs[i] = S.o[0]; if (S.o[0] < lo) lo = S.o[0]; if (S.o[0] > hi) hi = S.o[0]; }
        const sw = k.sweep == null ? P.sweep : k.sweep, span = (hi - lo) || 1;
        for (let i = 0; i < n; i++) xs[i] = sw * (xs[i] - lo) / span + (1 - sw) * h[4][i];
        k.order = xs;
      });
      return S;
    },
    // world position of dot i in key k's formation at time t -> o (y points down, z away from the camera)
    pos(S, k, i, t, o) {
      const P = S.P, p = k.parts[k.owner[i]], j = i - p.i0, h = S.h, sz = p.size || 1;
      const sh = p.shape, x0 = p.x || 0, y0 = p.y || 0, z0 = p.z || 0;
      if (sh === 'word') {
        const sc = p.sc, d = (p.depth == null ? P.depth : p.depth) * sc, face = h[2][i] < 0.5 ? -1 : 1;
        o[0] = x0 + p.tp.x[j] * sc; o[1] = y0 + p.tp.y[j] * sc + 0.012 * Math.sin(t * 1.7 + i);
        o[2] = z0 + face * d * 0.5 + (h[3][i] - 0.5) * d * 0.35;
      } else if (sh === 'warp') {
        const a = h[0][i] * TAU, rr = 0.25 + 3.2 * Math.sqrt(h[1][i]);
        o[0] = x0 + Math.cos(a) * rr * 1.5; o[1] = y0 + Math.sin(a) * rr;
        o[2] = z0 + WARP_L * 0.7 - C.fract(h[2][i] + t * (p.speed || P.warpSpeed) / WARP_L) * WARP_L;
      } else if (sh === 'cloud') {
        o[0] = x0 + (h[0][i] - 0.5) * 7 * sz + 0.2 * Math.sin(t * 0.3 + i); o[1] = y0 + (h[1][i] - 0.5) * 4 * sz + 0.2 * Math.cos(t * 0.27 + i * 1.3);
        o[2] = z0 + (h[2][i] - 0.5) * 7 * sz;
      } else if (sh === 'burst') {
        const u = h[0][i] * 2 - 1, a = h[1][i] * TAU, s = Math.sqrt(1 - u * u), rr = (p.r || 0.3) + Math.max(0, t - k.t) * (p.grow || 5) * (0.6 + 0.8 * h[3][i]);
        o[0] = x0 + s * Math.cos(a) * rr; o[1] = y0 + u * rr; o[2] = z0 + s * Math.sin(a) * rr - Math.max(0, t - k.t) * (p.grow || 5) * 0.6;
      } else if (sh === 'floor') {
        const col = j % p.nu, row = Math.floor(j / p.nu), dz = FLOOR_L / p.nv;
        o[0] = x0 + (col / (p.nu - 1) - 0.5) * FLOOR_W;
        o[2] = z0 + FLOOR_NEAR + C.fract((row * dz - t * (p.fly == null ? P.fly : p.fly)) / FLOOR_L) * FLOOR_L;
        o[1] = (p.y == null ? 0.9 : p.y) + 0.05 * Math.sin(o[2] * 1.3 - t * 1.6) * Math.cos(o[0] * 0.7);
      } else {
        const sf = M.surfaces[sh] || M.surfaces.sphere, u = (j % p.nu) / p.nu, v = Math.floor(j / p.nu) / (sf.wrapV ? p.nv : p.nv - 1);
        sf.f(u, Math.min(1, v), t, P, S.q);
        const sp = ((p.spin == null ? P.spin : p.spin) * t) * D2R, c = Math.cos(sp), s = Math.sin(sp);
        o[0] = x0 + (S.q[0] * c + S.q[2] * s) * sz; o[1] = y0 + S.q[1] * sz; o[2] = z0 + (-S.q[0] * s + S.q[2] * c) * sz;
      }
      return o;
    },
    // dot i at time t: its formation, or a curved flight from the previous formation into it
    place(S, t, i, o) {
      const P = S.P, keys = S.keys, h = S.h;
      let ki = 0; while (ki < keys.length - 1 && keys[ki + 1].t <= t) ki++;
      const K = keys[ki]; SW().pos(S, K, i, t, o);
      if (ki === 0 || t < K.t) return o;
      const mo = K.morph == null ? P.morph : K.morph, st = K.stagger == null ? P.stagger : K.stagger, arc = K.arc == null ? P.arc : K.arc;
      const e = C.inOut((t - K.t - K.order[i] * st) / mo);
      if (e >= 1) return o;
      const q = S.q2; SW().pos(S, keys[ki - 1], i, t, q);
      const b = Math.sin(Math.PI * e) * arc;
      o[0] = C.lerp(q[0], o[0], e) + b * (h[0][i] - 0.5) * 1.6;
      o[1] = C.lerp(q[1], o[1], e) + b * (h[1][i] - 0.5) * 1.6;
      o[2] = C.lerp(q[2], o[2], e) + b * (h[5][i] - 0.5) * 1.6;
      return o;
    },
    frame(ctx, S, t, dt, E) {
      const P = S.P, n = S.n, keys = S.keys, pal = E.pal, h = S.h;
      E.fade(ctx, dt, P.trail);
      let ki = 0; while (ki < keys.length - 1 && keys[ki + 1].t <= t) ki++;
      const K = keys[ki];
      // camera: knob values, eased toward each key's cam as that key comes in
      const cam = { yaw: P.yaw, pitch: P.pitch, dist: P.dist, x: 0, y: 0 };
      for (const k of keys) {
        if (!k.cam || t < k.t) continue;
        const e = C.inOut((t - k.t) / Math.max(0.01, k.camTime || (k.morph == null ? P.morph : k.morph) + (k.stagger == null ? P.stagger : k.stagger)));
        for (const c in cam) if (k.cam[c] != null) cam[c] = C.lerp(cam[c], k.cam[c], e);
      }
      const yaw = (cam.yaw + P.orbit * t + P.sway * Math.sin(t * 0.31)) * D2R, pitch = (cam.pitch + P.sway * 0.35 * Math.sin(t * 0.23 + 1)) * D2R;
      const F = P.focal * E.h, beat = E.beat().pulse, o = S.o, r = S.r, sw = SW();
      const car = P.car ? sw.carAt(t) : null, scanA = t * P.scan * TAU, tq = t - P.streak;
      const project = (x, y, z) => { M.rot(x - cam.x, y - cam.y, z, pitch, yaw, 0, r); return r[2] + cam.dist; };
      let lit = 0;
      for (let i = 0; i < n; i++) {
        sw.place(S, t, i, o);
        const part = K.parts[K.owner[i]];
        // lidar: floor dots inside the car's sweeping beam light up
        let glow = 0;
        if (car && o[1] > 0.6) {
          const dx = o[0] - car[0], dz = o[2] - car[2], dd = Math.hypot(dx, dz);
          if (dd < 3.6 && dd > 0.25) { const da = C.fract((scanA - Math.atan2(dz, dx)) / TAU); glow = Math.exp(-da * 14) * (1 - dd / 3.6); }
        }
        const zc = project(o[0], o[1], o[2]);
        if (zc < 0.12) { S.vis[i] = 0; continue; }
        const s = F / zc, near = C.clamp(1 - Math.max(0, zc - cam.dist * 0.8) / 9);
        S.vis[i] = 1; S.px[i] = E.cx + r[0] * s; S.py[i] = E.cy + r[1] * s;
        const acc = h[3][i] < (part.accent == null ? P.accent : part.accent);
        S.pr[i] = Math.min(14 * E.s, P.dot * (part.dot || 1) * E.s * cam.dist / zc * (acc ? 1 + P.pulse * beat : 1) * (1 + glow * 0.8));
        S.pa[i] = (1 - P.fog * (1 - near)) * Math.min(1, zc / 0.6);
        S.pc[i] = glow > 0.15 ? 2 : (part.color === 'accent' || acc) ? 1 : part.color === 'dim' ? 3 : 0;
        if (glow > 0.15) { S.pa[i] = Math.min(1, S.pa[i] + glow); lit++; }
        // motion streak: where the dot was a moment ago
        S.sv[i] = 0;
        if (P.streak > 0) {
          sw.place(S, tq, i, o); const z2 = project(o[0], o[1], o[2]);
          if (z2 > 0.12) { S.qx[i] = E.cx + r[0] * F / z2; S.qy[i] = E.cy + r[1] * F / z2; const d = Math.hypot(S.qx[i] - S.px[i], S.qy[i] - S.py[i]); S.sv[i] = d > 1.5 && d < E.w * 0.5 ? 1 : 0; }
        }
      }
      if (P.streak > 0) {
        const cols = [pal.ink, pal.accent, pal.accent, pal.dim];
        ctx.lineCap = 'round'; ctx.lineWidth = Math.max(0.6, P.dot * E.s * 0.9);
        for (let c = 0; c < 4; c++) for (let a = 1; a <= 3; a++) {
          ctx.beginPath(); let any = false;
          for (let i = 0; i < n; i++) {
            if (!S.vis[i] || !S.sv[i] || S.pc[i] !== c || Math.min(3, Math.max(1, Math.ceil(S.pa[i] * 3))) !== a) continue;
            ctx.moveTo(S.qx[i], S.qy[i]); ctx.lineTo(S.px[i], S.py[i]); any = true;
          }
          if (any) { ctx.strokeStyle = C.rgba(cols[c], a / 3 * 0.75); ctx.stroke(); }
        }
      }
      // links: neighbours in the same part, close on screen
      if (P.links > 0) {
        const L = P.linkDist * E.s, L2 = L * L;
        ctx.lineWidth = Math.max(0.5, 0.7 * E.s); ctx.strokeStyle = C.rgba(pal.ink, P.links * 0.5); ctx.beginPath();
        for (let i = 0; i < n - 1; i++) {
          if (!S.vis[i] || !S.vis[i + 1] || K.owner[i] !== K.owner[i + 1]) continue;
          const dx = S.px[i + 1] - S.px[i], dy = S.py[i + 1] - S.py[i];
          if (dx * dx + dy * dy < L2) { ctx.moveTo(S.px[i], S.py[i]); ctx.lineTo(S.px[i + 1], S.py[i + 1]); }
        }
        ctx.stroke();
      }
      // dots, batched by color and 6 alpha levels
      const cols = [pal.ink, pal.accent, pal.accent, pal.dim];
      for (let c = 0; c < 4; c++) for (let a = 1; a <= 6; a++) {
        ctx.beginPath(); let any = false;
        for (let i = 0; i < n; i++) {
          if (!S.vis[i] || S.pc[i] !== c || Math.min(6, Math.max(1, Math.ceil(S.pa[i] * 6))) !== a) continue;
          const rr = Math.max(0.4, S.pr[i]); ctx.moveTo(S.px[i] + rr, S.py[i]); ctx.arc(S.px[i], S.py[i], rr, 0, TAU); any = true;
        }
        if (any) { ctx.fillStyle = C.rgba(cols[c], c === 2 ? Math.min(1, a / 6 + 0.2) : a / 6); ctx.fill(); }
      }
      if (car) SW().drawCar(ctx, car, scanA, cam, yaw, pitch, F, E, t, P);
      S.info = { key: ki + 1, keys: keys.length, shape: K.parts.map((p) => p.shape === 'word' ? '"' + p.text + '"' : p.shape).join('+'), lit };
    },
    // the car's position on the floor (x, y, z) at time t: weaving gently, a little ahead of the camera
    carAt(t) { return [0.9 * Math.sin(t * 0.55) + 0.25 * Math.sin(t * 1.3), 0.9, 0.7 + 0.2 * Math.sin(t * 0.4)]; },
    drawCar(ctx, car, scanA, cam, yaw, pitch, F, E, t, P) {
      // heading follows the weave: sideways speed against the floor's speed toward the camera
      const pal = E.pal, r = [0, 0, 0], heading = Math.atan2(0.495 * Math.cos(t * 0.55) + 0.325 * Math.cos(t * 1.3), Math.max(0.3, P.fly));
      const proj = (x, y, z) => { M.rot(x - cam.x, y - cam.y, z, pitch, yaw, 0, r); const zc = r[2] + cam.dist; return zc < 0.12 ? null : [E.cx + r[0] * F / zc, E.cy + r[1] * F / zc]; };
      const body = (dx, dy, dz) => { const c = Math.cos(heading), s = Math.sin(heading); return proj(car[0] + dx * c + dz * s, car[1] + dy, car[2] - dx * s + dz * c); };
      // lidar beam
      const b0 = proj(car[0], car[1] - 0.12, car[2]), b1 = proj(car[0] + Math.cos(scanA) * 3.6, car[1], car[2] + Math.sin(scanA) * 3.6);
      if (b0 && b1) { ctx.strokeStyle = C.rgba(pal.accent, 0.55); ctx.lineWidth = Math.max(1, 1.4 * E.s); ctx.beginPath(); ctx.moveTo(b0[0], b0[1]); ctx.lineTo(b1[0], b1[1]); ctx.stroke(); }
      // low-poly body: a wedge with a cabin, edges only
      const W = 0.28, H = 0.12, L = 0.55, V = [[-W, 0, -L], [W, 0, -L], [W, 0, L], [-W, 0, L], [-W, -H, -L * 0.8], [W, -H, -L * 0.8], [W, -H * 0.8, L], [-W, -H * 0.8, L],
        [-W * 0.7, -H * 1.9, -L * 0.15], [W * 0.7, -H * 1.9, -L * 0.15], [W * 0.7, -H * 1.9, L * 0.45], [-W * 0.7, -H * 1.9, L * 0.45]].map((v) => body(v[0], v[1], v[2]));
      if (V.some((v) => !v)) return;
      const Ed = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7], [8, 9], [9, 10], [10, 11], [11, 8], [4, 8], [5, 9], [6, 10], [7, 11]];
      ctx.strokeStyle = pal.ink; ctx.lineWidth = Math.max(1, 1.8 * E.s); ctx.beginPath();
      for (const e of Ed) { ctx.moveTo(V[e[0]][0], V[e[0]][1]); ctx.lineTo(V[e[1]][0], V[e[1]][1]); }
      ctx.stroke();
      // wheels: dark discs with an ink rim at the four bottom corners
      ctx.lineWidth = Math.max(1, 1.4 * E.s);
      for (const [wx, wz] of [[-W, -L * 0.62], [W, -L * 0.62], [-W, L * 0.62], [W, L * 0.62]]) {
        const c = body(wx * 1.08, 0.02, wz); if (!c) continue;
        M.rot(car[0] - cam.x, car[1] - cam.y, car[2], pitch, yaw, 0, r); const rad = Math.max(2, 0.085 * F / Math.max(0.3, r[2] + cam.dist));
        ctx.beginPath(); ctx.ellipse(c[0], c[1], rad * 0.45, rad, 0, 0, TAU); ctx.fillStyle = pal.bg; ctx.fill(); ctx.strokeStyle = pal.ink; ctx.stroke();
      }
      // the car drives away from the camera, so we see its tail lights (the near top corners)
      ctx.fillStyle = pal.accent; ctx.beginPath();
      for (const k of [4, 5]) { ctx.moveTo(V[k][0] + 4 * E.s, V[k][1]); ctx.arc(V[k][0], V[k][1], 4 * E.s, 0, TAU); }
      ctx.fill();
    },
    stats(S) { const i = S.info || {}; return 'DOTS ' + S.n + '  ·  KEY ' + (i.key || 1) + '/' + (i.keys || 1) + '  ·  ' + String(i.shape || '').toUpperCase() + (i.lit ? '  ·  LIDAR ' + i.lit : ''); },
  };
})(globalThis.GEN = globalThis.GEN || {});
