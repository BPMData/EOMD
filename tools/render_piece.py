# tools__render_piece.py: renders a one-off, fixed-length piece of music (a proj__<name>__music.js that sets PIECE.render)
# to WAV + MP3: loudness to TARGET_LUFS, true peak limited to CEILING_DBTP, then checked with ffmpeg.
# Run in Thonny (Run button). Needs Node.js; ffmpeg for the MP3 and the check.
# One-off pieces are scored to picture (e.g. proj__pltw__music.js for the gen cartridge pltw-cse); endless scores use
# score__*.json + tools__calibrate.py instead.
import os, json, shutil, subprocess, tempfile

# ===================== SETTINGS =====================
SRC_DIR      = os.path.dirname(os.path.abspath(__file__))
PIECE        = 'proj__pltw__music.js'
OUT_MP3      = os.path.join(SRC_DIR, 'gen', 'audio', 'pltw-cse.mp3')   # where the player build looks for the cartridge's "audio"
OUT_WAV      = os.path.join(SRC_DIR, 'dist', 'pltw-cse.wav')            # full-quality copy (dist/ is git-ignored)
SAMPLE_RATE  = 48000
TARGET_LUFS  = -16.0         # hallway / video level (classroom reading music is -23)
CEILING_DBTP = -1.5
MP3_KBPS     = 192
NODE_EXE     = shutil.which('node') or '/opt/homebrew/bin/node'      # Thonny starts without Homebrew on PATH
FFMPEG_EXE   = shutil.which('ffmpeg') or '/opt/homebrew/bin/ffmpeg'
# ====================================================

JS = r"""
const fs = require('fs'); globalThis.DHS = {};
eval(fs.readFileSync(%(dir)s + '/engine__src__audio__dsp.js', 'utf8'));
eval(fs.readFileSync(%(dir)s + '/' + %(piece)s, 'utf8'));
const P = DHS.dsp, SR = %(sr)d, t0 = Date.now();
let bus = PIECE.render(SR);
const raw = P.lufs(bus, SR);
// loudness, then the true-peak limiter (which costs a little loudness), then one correction pass
const scale = (b, g) => { const o = P.bus(b.N); for (let i = 0; i < b.N; i++) { o.L[i] = b.L[i] * g; o.R[i] = b.R[i] * g; } return o; };
let out = P.limit(scale(bus, P.db(%(lufs)f - raw)), SR, P.db(%(ceil)f)).bus;
const l1 = P.lufs(out, SR);
out = P.limit(scale(out, P.db(%(lufs)f - l1)), SR, P.db(%(ceil)f)).bus;
const lufs = P.lufs(out, SR), tp = P.todb(P.truePeak(out)), st = P.shortTerm(out, SR);
// 16-bit WAV
const n = out.N, b = Buffer.alloc(44 + n * 4);
b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
for (let i = 0, o = 44; i < n; i++, o += 4) { b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out.L[i])) * 32767), o); b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out.R[i])) * 32767), o + 2); }
fs.writeFileSync(%(wav)s, b);
// loudness per 5 s, to see the shape of the piece
const per5 = []; for (let s = 0; s < n / SR; s += 5) per5.push(Math.round(Math.max(...st.slice(s * 10 + 10, s * 10 + 50)) * 10) / 10);
console.log(JSON.stringify({ title: PIECE.title, seconds: n / SR, raw, lufs, tp, per5, secs: (Date.now() - t0) / 1000 }));
"""

def main():
    os.makedirs(os.path.dirname(OUT_WAV), exist_ok=True); os.makedirs(os.path.dirname(OUT_MP3), exist_ok=True)
    js = JS % {'dir': json.dumps(SRC_DIR), 'piece': json.dumps(PIECE), 'sr': SAMPLE_RATE, 'lufs': TARGET_LUFS, 'ceil': CEILING_DBTP, 'wav': json.dumps(OUT_WAV)}
    tmp = os.path.join(tempfile.gettempdir(), 'render_piece.js'); open(tmp, 'w').write(js)
    print('rendering', PIECE, '...')
    p = subprocess.run([NODE_EXE, tmp], capture_output=True, text=True)
    if p.returncode: print(p.stderr[-2000:]); raise SystemExit('render failed')
    r = json.loads(p.stdout.strip().splitlines()[-1])
    print(f"{r['title']}: {r['seconds']:.1f} s, rendered in {r['secs']:.0f} s. Raw {r['raw']:.1f} LUFS -> {r['lufs']:.2f} LUFS, true peak {r['tp']:.2f} dBTP")
    print('short-term loudness (max) per 5 s:', r['per5'])
    print('wav:', OUT_WAV)
    if os.path.exists(FFMPEG_EXE):
        subprocess.run([FFMPEG_EXE, '-y', '-loglevel', 'error', '-i', OUT_WAV, '-b:a', f'{MP3_KBPS}k', OUT_MP3], check=True)
        c = subprocess.run([FFMPEG_EXE, '-hide_banner', '-nostats', '-i', OUT_MP3, '-filter_complex', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True)
        print('mp3:', OUT_MP3)
        print('ffmpeg check:', ' | '.join(l.strip() for l in c.stderr.splitlines() if l.strip().startswith(('I:', 'LRA:', 'Peak:'))))
    else:
        print('ffmpeg not found: no MP3 (set FFMPEG_EXE)')

if __name__ == '__main__':
    main()
