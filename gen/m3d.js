/* gen/m3d.js: tiny 3D. Rotation, perspective projection, and parametric surfaces
   on a shared (u,v) grid so any surface can morph into any other.
   A "fake 3D" look needs nothing more: rotate points, then x*s, y*s with s = f/(f+z). */
(function (G) {
  'use strict';
  const C = G.core, TAU = C.TAU, PI = Math.PI;
  const M = G.m3d = {};

  // rotate (x,y,z) by Euler angles (radians), order Y then X then Z; writes into out[0..2]
  M.rot = function (x, y, z, ax, ay, az, out) {
    let c = Math.cos(ay), s = Math.sin(ay);
    let x1 = x * c + z * s, z1 = -x * s + z * c;
    c = Math.cos(ax); s = Math.sin(ax);
    let y1 = y * c - z1 * s, z2 = y * s + z1 * c;
    c = Math.cos(az); s = Math.sin(az);
    out[0] = x1 * c - y1 * s; out[1] = x1 * s + y1 * c; out[2] = z2;
    return out;
  };

  // perspective: returns scale s (0 when behind the camera). screen = (cx + x*s, cy + y*s)
  M.persp = function (z, focal) {
    const d = focal + z;
    return d > 1 ? focal / d : 0;
  };

  /* Surfaces. Each: f(u, v, t, k, out) with u, v in [0,1], radius 1, t = time, k = shape knobs.
     Writes x,y,z into out. wrapU / wrapV say whether the grid closes on itself (for drawing lines). */
  M.surfaces = {
    sphere: { wrapU: 1, wrapV: 0, f(u, v, t, k, o) {
      const th = u * TAU, ph = 0.02 + v * (PI - 0.04);
      o[0] = Math.sin(ph) * Math.cos(th); o[1] = -Math.cos(ph); o[2] = Math.sin(ph) * Math.sin(th);
    } },
    vase: { wrapU: 1, wrapV: 0, f(u, v, t, k, o) {       // open top and bottom rings, a waist that breathes
      const th = u * TAU, ph = 0.22 + v * (PI - 0.44);
      const r = 0.9 + 0.16 * Math.sin(ph * 3 - 0.5 + Math.sin(t * 0.4) * 0.6);
      o[0] = r * Math.sin(ph) * Math.cos(th); o[1] = -1.1 * Math.cos(ph); o[2] = r * Math.sin(ph) * Math.sin(th);
    } },
    torus: { wrapU: 1, wrapV: 1, f(u, v, t, k, o) {
      const th = u * TAU, ph = v * TAU, R = 0.78, r = 0.34;
      o[0] = (R + r * Math.cos(ph)) * Math.cos(th); o[1] = r * Math.sin(ph); o[2] = (R + r * Math.cos(ph)) * Math.sin(th);
    } },
    sheet: { wrapU: 0, wrapV: 0, f(u, v, t, k, o) {      // a cloth with travelling waves
      const x = (u - 0.5) * 2.6, z = (v - 0.5) * 2.6;
      o[0] = x; o[2] = z;
      o[1] = 0.32 * Math.sin(x * 2.2 + t * 1.3) * Math.cos(z * 1.6 - t * 0.9) - 0.18 * Math.sin((x + z) * 1.4 - t);
    } },
    curl: { wrapU: 0, wrapV: 0, f(u, v, t, k, o) {       // a sheet rolling up at one edge
      const x = (u - 0.5) * 2.6, z = (v - 0.5) * 2.6;
      const roll = C.smooth((-x + 0.4) / 1.7) * (1.6 + 0.5 * Math.sin(t * 0.5));
      const r = 0.55;
      o[0] = x + (roll > 0 ? r * Math.sin(roll) - r * roll * 0.15 : 0);
      o[1] = 0.25 - r * (1 - Math.cos(roll)) * 1.4;
      o[2] = z;
    } },
    plane: { wrapU: 0, wrapV: 0, f(u, v, t, k, o) {      // big flat floor for fly-overs; a soft swell rolls through
      // k.fly (grid rows per second) slides the whole grid by under one row, then repeats: an endless floor
      const cell = 5.0 / Math.max(1, (k.nv || 24) - 1), off = C.fract(t * (k.fly || 0)) * cell;
      const x = (u - 0.5) * 5.0, z = (v - 0.5) * 5.0 - off;
      o[0] = x; o[2] = z; o[1] = 0.12 * Math.sin(z * 1.3 - t * 1.6) * Math.cos(x * 0.7);
    } },
    cylinder: { wrapU: 1, wrapV: 0, f(u, v, t, k, o) {   // a twisting tube
      const tw = Math.sin(t * 0.5) * 1.2 * (v - 0.5), th = u * TAU + tw;
      o[0] = 0.62 * Math.cos(th); o[1] = (v - 0.5) * 2.2; o[2] = 0.62 * Math.sin(th);
    } },
    knot: { wrapU: 1, wrapV: 1, f(u, v, t, k, o) {       // (2,3) torus knot tube
      const a = u * TAU, p = 2, q = 3, R = 0.62, r = 0.16;
      const cx = (R + 0.25 * Math.cos(q * a)) * Math.cos(p * a), cy = 0.25 * Math.sin(q * a), cz = (R + 0.25 * Math.cos(q * a)) * Math.sin(p * a);
      const b = v * TAU;
      // cheap tube: offset along the radial direction and the y axis
      const rl = Math.hypot(cx, cz) || 1;
      o[0] = cx + r * Math.cos(b) * cx / rl; o[1] = cy + r * Math.sin(b); o[2] = cz + r * Math.cos(b) * cz / rl;
    } },
  };
  M.surfaceNames = Object.keys(M.surfaces);
})(globalThis.GEN = globalThis.GEN || {});
