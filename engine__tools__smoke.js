// Headless smoke test of dist/player.html: errors, audio synth in worker, frame rate, screenshots.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  for (const [w, h, tag] of [[1920, 1080, 'land'], [1080, 1920, 'vert']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    const t0 = Date.now(); await p.goto('file://' + path.resolve(__dirname, '../dist/player.html'));
    await p.waitForFunction('window.__dhsStatus==="playing"||window.__dhsStatus==="audio-error"||window.__dhsStatus==="no-audio"', null, { timeout: 90000 }).catch(() => {});
    const st = await p.evaluate(() => ({ s: window.__dhsStatus, t: window.__dhs.time(), fps: window.__dhs.fps, run: window.__dhs.audioRunning }));
    await p.waitForTimeout(1500); const t2 = await p.evaluate(() => window.__dhs.time());
    await p.screenshot({ path: path.resolve(__dirname, `../build/qa/player_${tag}.png`) });
    console.log(tag, JSON.stringify(st), 'advance', (t2 - st.t).toFixed(2), 'synth+load s', ((Date.now() - t0) / 1000).toFixed(1), 'errors', errs);
    await p.close();
  }
  await b.close();
})();
