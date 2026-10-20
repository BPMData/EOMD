// Renders the 20-min study loop offline (Node) → build/audio/study.wav + loudness stats.
// Set WRITE_WAV = false to only measure (used to calibrate LF.GAIN_DB in src/audio/longform.js).
const WRITE_WAV = process.env.WAV !== "0";
const fs = require('fs'), path = require('path'), ROOT = path.resolve(__dirname, '..');
['config.js', 'src/audio/dsp.js', 'src/audio/music.js', 'src/audio/longform.js'].forEach((f) => require(path.join(ROOT, f)));
const LF = DHS.longform, s = LF.stream(), t0 = Date.now(), N = LF.samples;
let fd, off = 44;
if (WRITE_WAV) { fs.mkdirSync(path.join(ROOT, 'build/audio'), { recursive: true }); fd = fs.openSync(path.join(ROOT, 'build/audio/study.wav'), 'w');
  const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + N * 4, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
  h.writeUInt32LE(LF.SR, 24); h.writeUInt32LE(LF.SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(N * 4, 40); fs.writeSync(fd, h); }
s.warm();
for (let i = 0; i < LF.plan.length; i++) {
  const c = s.next(i);
  if (WRITE_WAV) { const b = Buffer.alloc(c.L.length * 4); for (let j = 0; j < c.L.length; j++) { b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, c.L[j])) * 32767), j * 4); b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, c.R[j])) * 32767), j * 4 + 2); } fs.writeSync(fd, b); }
  if (i % 7 === 0) console.log(`section ${i}/${LF.plan.length}  ${((Date.now() - t0) / 1000).toFixed(0)} s elapsed`);
}
if (fd) fs.closeSync(fd);
console.log(JSON.stringify({ ...s.stats(), renderSeconds: (Date.now() - t0) / 1000, gainDb: LF.GAIN_DB }));
