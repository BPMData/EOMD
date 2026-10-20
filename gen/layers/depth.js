/* layer "depth": a dot-and-wire 3D mesh that morphs between surfaces (sphere, vase, torus, sheet ...).
   Every surface shares one nu x nv grid, so morphing = sliding each vertex from shape A to shape B. */
(function (G) {
  'use strict';
  const C = G.core, M = G.m3d, D2R = Math.PI / 180;

  G.layers.depth = {
    about: 'Dot + wire 3D surfaces that morph into each other; perspective projection, depth-sorted dots, motion trails.',
    knobs: {
      shapes: ['vase', 'sheet', 'torus', 'sphere'],
      hold: [6, 1, 30, 0.5],
      morph: [2.5, 0.3, 10, 0.1],
      nu: [24, 6, 64, 1],
      nv: [24, 6, 64, 1],
      size: [0.34, 0.1, 1.2, 0.01],
      focal: [1400, 300, 4000, 10],
      camZ: [0, -1.5, 4, 0.05],
      camY: [0, -2, 2, 0.01],
      lift: [0, -1, 1, 0.01],
      fly: [0, -3, 3, 0.05],
      spinY: [14, -90, 90, 1],
      tiltX: [-16, -89, 89, 1],
      wobble: [7, 0, 45, 1],
      dot: [3.0, 0.5, 12, 0.1],
      lines: [0.16, 0, 1, 0.01],
      fog: [0, 0, 1, 0.01],
      accent: [0.12, 0, 1, 0.01],
      pulse: [0.35, 0, 1.5, 0.01],
      trail: [0.55, 0, 0.97, 0.01],
      seed: [0, 0, 999, 1],
    },
    // plain-English explanation of each knob, shown under it in the KNOBS panel (common ones: GEN.knobHelp)
    help: {
      shapes: "Shapes to morph through, in order, separated by commas: sphere, vase, torus, sheet, curl, plane, cylinder, knot.",
      hold: "Seconds each shape stays before it starts morphing.",
      morph: "Seconds the morph from one shape into the next takes.",
      nu: "Dots going around (columns). More = a denser mesh.",
      nv: "Dots going top to bottom (rows). More = a denser mesh.",
      size: "How big the shape is on screen.",
      focal: "Perspective strength. Low = dramatic fisheye depth; high = flat, like a diagram.",
      camZ: "Pushes the shape away from you (+) or toward you (-).",
      camY: "Camera height. + puts the shape below eye level, like looking out over a floor.",
      lift: "Slides the whole picture up (-) or down (+). On a floor this moves the horizon.",
      fly: "Floor (plane) shape only: how fast the floor slides toward you, for an endless flyover.",
      spinY: "Turning speed around the vertical axis, in degrees per second. Negative turns the other way.",
      tiltX: "Tips the shape toward or away from you, in degrees.",
      wobble: "A slow rocking motion on top of the tilt.",
      dot: "Dot size.",
      lines: "How visible the wireframe lines are. 0 = dots only.",
      fog: "Far dots fade into the background. 1 = the farthest ones vanish completely.",
    },
    init(P, E) {
      const nu = Math.round(P.nu), nv = Math.round(P.nv), n = nu * nv;
      const S = { P, nu, nv, n, sx: new Float32Array(n), sy: new Float32Array(n), sz: new Float32Array(n),
                  sr: new Float32Array(n), acc: new Uint8Array(n), order: new Uint32Array(n), rotY: 0 };
      for (let k = 0; k < n; k++) { S.acc[k] = C.hash(k, 7, 3, E.seed) < P.accent ? 1 : 0; S.order[k] = k; }
      S.shapes = (Array.isArray(P.shapes) && P.shapes.length ? P.shapes : ['sphere']).filter((x) => M.surfaces[x]);
      if (!S.shapes.length) S.shapes = ['sphere'];
      return S;
    },
    frame(ctx, S, t, dt, E) {
      const P = S.P, nu = S.nu, nv = S.nv, pal = E.pal, s = E.s;
      E.fade(ctx, dt, P.trail);
      // which two shapes, and how far between them
      const cyc = P.hold + P.morph, k = Math.floor(t / cyc), f = t - k * cyc, ns = S.shapes.length;
      const A = M.surfaces[S.shapes[((k % ns) + ns) % ns]], B = M.surfaces[S.shapes[(((k + 1) % ns) + ns) % ns]];
      const e = f > P.hold ? C.inOut((f - P.hold) / P.morph) : 0;
      const wrapU = C.lerp(A.wrapU, B.wrapU, e), wrapV = C.lerp(A.wrapV, B.wrapV, e);
      S.rotY = (P.spinY * t) * D2R;
      const ax = (P.tiltX + P.wobble * Math.sin(t * 0.23)) * D2R, az = P.wobble * 0.4 * Math.sin(t * 0.17 + 1) * D2R;
      const R = P.size * E.h, foc = P.focal * s, oa = [0, 0, 0], ob = [0, 0, 0], r = [0, 0, 0];
      const beat = E.beat().pulse;
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const q = j * nu + i;
        A.f(A.wrapU ? i / nu : i / (nu - 1), A.wrapV ? j / nv : j / (nv - 1), t, P, oa);
        if (e > 0) B.f(B.wrapU ? i / nu : i / (nu - 1), B.wrapV ? j / nv : j / (nv - 1), t, P, ob);
        else { ob[0] = oa[0]; ob[1] = oa[1]; ob[2] = oa[2]; }
        M.rot(C.lerp(oa[0], ob[0], e), C.lerp(oa[1], ob[1], e), C.lerp(oa[2], ob[2], e), ax, S.rotY, az, r);
        const z = (r[2] + P.camZ) * R, sc = M.persp(z, foc);
        S.sx[q] = E.cx + r[0] * R * sc; S.sy[q] = E.cy + P.lift * E.h + (r[1] + P.camY) * R * sc; S.sz[q] = z; S.sr[q] = sc;
      }
      // wires
      if (P.lines > 0) {
        ctx.lineWidth = Math.max(0.6, s); ctx.strokeStyle = C.rgba(pal.ink, P.lines);
        ctx.beginPath();
        for (let j = 0; j < nv; j++) { const b = j * nu; ctx.moveTo(S.sx[b], S.sy[b]); for (let i = 1; i < nu; i++) ctx.lineTo(S.sx[b + i], S.sy[b + i]); }
        for (let i = 0; i < nu; i++) { ctx.moveTo(S.sx[i], S.sy[i]); for (let j = 1; j < nv; j++) ctx.lineTo(S.sx[j * nu + i], S.sy[j * nu + i]); }
        ctx.stroke();
        if (wrapU > 0.01 || wrapV > 0.01) {          // closing seams fade in/out with the morph
          ctx.beginPath();
          if (wrapU > 0.01) for (let j = 0; j < nv; j++) { const b = j * nu; ctx.moveTo(S.sx[b + nu - 1], S.sy[b + nu - 1]); ctx.lineTo(S.sx[b], S.sy[b]); }
          if (wrapV > 0.01) for (let i = 0; i < nu; i++) { const a = (nv - 1) * nu + i; ctx.moveTo(S.sx[a], S.sy[a]); ctx.lineTo(S.sx[i], S.sy[i]); }
          ctx.strokeStyle = C.rgba(pal.ink, P.lines * Math.max(wrapU, wrapV)); ctx.stroke();
        }
      }
      // dots, far to near
      const ord = Array.from(S.order).sort((a, b) => S.sz[b] - S.sz[a]);
      let zmin = Infinity, zmax = -Infinity;
      for (let q = 0; q < S.n; q++) { if (S.sz[q] < zmin) zmin = S.sz[q]; if (S.sz[q] > zmax) zmax = S.sz[q]; }
      const zr = (zmax - zmin) || 1;
      for (const q of ord) {
        if (S.sr[q] <= 0) continue;
        const near = 1 - (S.sz[q] - zmin) / zr, a = (0.28 + 0.72 * near) * (1 - P.fog * (1 - near) * (1 - near));
        const rad = Math.max(0.4, P.dot * s * S.sr[q] * (S.acc[q] ? 1 + P.pulse * beat : 1));
        ctx.fillStyle = S.acc[q] ? C.rgba(pal.accent, Math.min(1, a + 0.15)) : C.rgba(pal.ink, a);
        ctx.beginPath(); ctx.arc(S.sx[q], S.sy[q], rad, 0, C.TAU); ctx.fill();
      }
    },
    stats(S) {
      const deg = ((S.rotY / D2R) % 360 + 360) % 360;
      return 'VERTICES ' + S.n + '  ·  FOCAL ' + Math.round(S.P.focal) + '  ·  ROT.Y ' + C.pad(deg, 3) + '.' + Math.floor((deg % 1) * 10) + '°';
    },
  };
})(globalThis.GEN = globalThis.GEN || {});
