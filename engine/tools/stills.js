// Render still frames at given times → PNGs (QA). Usage: node tools/stills.js out_dir W H t1 t2 ...
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const [,, outDir, W, H, ...times] = process.argv; fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: +W, height: +H } });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message)); p.on('console', m => m.type() === 'error' && console.log('console', m.text()));
  await p.goto('file://' + path.resolve(__dirname, '..', 'render.html') + `?w=${W}&h=${H}`);
  await p.waitForFunction('window.ready', null, { timeout: 30000 });
  for (const t of times) { await p.evaluate(t => window.renderAt(t), +t); await p.screenshot({ path: path.join(outDir, `t${(+t).toFixed(2).padStart(6, '0')}.png`) }); }
  await b.close();
})();
