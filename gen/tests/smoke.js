/* gen/tests/smoke.js: headless check of every cartridge, no browser needed.
   Run:  node gen/tests/smoke.js        (from the repo root, or anywhere)
   Checks: no exceptions; every coordinate passed to the canvas is a finite number; two runs of the
   same cartridge produce identical drawing calls (deterministic); seeking works. Prints ms/frame
   (CPU math only: the stub canvas draws nothing, so real frames cost more). */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const GEN_DIR = path.join(__dirname, '..');

// load the library in the order player.html lists it (one source of truth)
const html = fs.readFileSync(path.join(GEN_DIR, 'player.html'), 'utf8');
const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]).filter((s) => !s.startsWith('carts/'));
// runInThisContext, not a sandboxed context: contextified globals make the noise math ~30x slower
for (const s of srcs) vm.runInThisContext(fs.readFileSync(path.join(GEN_DIR, s), 'utf8'), { filename: s });
const GEN = globalThis.GEN;

let bad = 0, log = null;
function stubCanvas(w, h) {
  const cv = { width: w, height: h };
  const check = (name, args) => {
    for (const a of args) if (typeof a === 'number' && !Number.isFinite(a)) { bad++; if (bad < 6) console.log('  non-finite arg in', name, args); }
    if (log) log.update(name + args.map((a) => (typeof a === 'number' ? a.toFixed(2) : typeof a === 'string' ? a : '')).join(','));
  };
  const c2 = new Proxy({ canvas: cv }, {
    get(o, k) {
      if (k in o) return o[k];
      if (k === 'measureText') return (s) => ({ width: String(s).length * 7 });
      if (k === 'createImageData') return (iw, ih) => ({ width: iw, height: ih, data: new Uint8ClampedArray(iw * ih * 4) });
      if (k === 'getImageData') return (x, y, iw, ih) => ({ width: iw, height: ih, data: new Uint8ClampedArray(iw * ih * 4).map((_, i) => (i % 4 === 3 && (i >> 2) % 7 < 3 ? 255 : 0)) });
      return (...a) => check(String(k), a);
    },
    set(o, k, v) { o[k] = v; if (log && typeof v !== 'object') log.update(String(k) + '=' + v); return true; },
  });
  cv.getContext = () => c2;
  return cv;
}

const carts = fs.readdirSync(path.join(GEN_DIR, 'carts')).filter((f) => f.endsWith('.json')).sort();
let fail = 0;
for (const f of carts) {
  const cart = JSON.parse(fs.readFileSync(path.join(GEN_DIR, 'carts', f), 'utf8'));
  const run = (frames, hash) => {
    log = hash ? crypto.createHash('sha1') : null;
    const st = GEN.stage(stubCanvas(960, 540), cart, { makeCanvas: stubCanvas });
    const t0 = Date.now();
    for (let i = 0; i < frames; i++) st.advance(1 / 30);
    const ms = (Date.now() - t0) / frames;
    const out = { st, ms, digest: log ? log.digest('hex').slice(0, 12) : '' };
    log = null; return out;
  };
  try {
    bad = 0;
    const a = run(150, true), b = run(150, true);
    const total = a.st.info().total;
    // play across every shot boundary at 10 fps (covers all transitions), then a few seeks
    const c = GEN.stage(stubCanvas(640, 360), cart, { makeCanvas: stubCanvas });
    for (let t = 0; t < total + 5; t += 0.1) c.advance(0.1);
    for (const t of [0, total * 0.37, total * 0.99, total * 1.5, 3]) c.renderAt(t);
    c.goto(1); c.goto(-1);
    const ok = a.digest === b.digest && bad === 0;
    if (!ok) fail++;
    console.log((ok ? 'PASS ' : 'FAIL ') + f.padEnd(28) + (a.digest === b.digest ? 'deterministic' : 'NOT deterministic') +
      '  shots ' + cart.shots.length + '  loop ' + total + ' s  ~' + a.ms.toFixed(1) + ' ms/frame' + (bad ? '  non-finite: ' + bad : ''));
  } catch (e) { fail++; console.log('FAIL ' + f + '  ' + (e.stack || e)); }
}
console.log(fail ? fail + ' cartridge(s) failed' : 'All ' + carts.length + ' cartridges passed.');
process.exitCode = fail ? 1 : 0;
