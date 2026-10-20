// Offline audio render (Node): music, SFX and master stems + loudness report.
// Usage: node tools/render-audio.js   → build/audio/{music,sfx,master}.wav + report.json
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'build', 'audio');
['config.js', 'src/core/core.js', 'src/draw/draw.js', 'src/draw/icons.js', 'src/scenes/common.js', 'src/scenes/hub.js', 'src/scenes/motifs.js',
 'src/scenes/academy.js', 'src/scenes/exploration.js', 'src/film.js', 'src/audio/dsp.js', 'src/audio/music.js', 'src/audio/sfx.js', 'src/audio/master.js']
  .forEach((f) => require(path.join(ROOT, f)));
fs.mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const r = DHS.audio.render({ analyze: true, log: (m) => console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', m) });
for (const k of ['music', 'sfx', 'master']) fs.writeFileSync(path.join(OUT, k + '.wav'), Buffer.from(DHS.audio.wav(r[k], r.sr, 24)));
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(r.report, null, 2));
console.log(JSON.stringify(r.report, null, 1));
