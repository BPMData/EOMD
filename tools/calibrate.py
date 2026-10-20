# Renders a score offline, measures loudness, writes the corrected master_db back into the score,
# and saves a listening preview (WAV, plus MP3 if ffmpeg is installed). This is how audio builds get "saved".
# Run in Thonny. Needs Node.js installed (the DSP is JavaScript); ffmpeg optional.
import os, re, json, shutil, subprocess, tempfile
 
# ===================== SETTINGS =====================
SRC_DIR     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # the repo root (this script sits in tools/)
SCORE       = 'score/late-library.json'
SECTIONS    = 8          # ~4 min of music at 60-66 BPM
SEED        = 1
TARGET_LUFS = -23.0
WRITE_BACK  = True       # update master_db inside the score file
OUT_DIR     = os.path.join(SRC_DIR, 'dist')
MAKE_MP3    = True
# ====================================================
 
score_path = os.path.join(SRC_DIR, SCORE); score = json.load(open(score_path, encoding='utf-8'))
os.makedirs(OUT_DIR, exist_ok=True); wav = os.path.join(OUT_DIR, f"preview_{score['id']}_seed{SEED}.wav")
js = r"""
const fs=require('fs');globalThis.DHS={};const D=%(dir)s;
for(const f of ['engine/src/audio/dsp.js','audio/instruments.js','audio/instruments-film.js','audio/instruments-cdrom.js','audio/chips.js','audio/arranger.js','audio/style-comp4.js','audio/style-film24.js','audio/style-rounds.js','audio/style-lounge.js','audio/style-chip.js'])eval(fs.readFileSync(D+'/'+f,'utf8'));
const P=DHS.dsp,sc=%(score)s,SR=48000,N=%(n)d,hop=MUSIC.sectionLen(sc)*SR,tot=Math.round(hop*N),L=new Float32Array(tot),R=new Float32Array(tot);
for(let i=0;i<N;i++){const s=MUSIC.run(sc,{sr:SR,seed:%(seed)d,index:i}),o=Math.round(i*hop);for(let j=0;j<s.L.length&&o+j<tot;j++){L[o+j]+=s.L[j];R[o+j]+=s.R[j]}}
const lu=P.lufs({N:tot,L,R},SR),g=P.db(%(target)f-lu),b=Buffer.alloc(44+tot*4);
b.write('RIFF',0);b.writeUInt32LE(36+tot*4,4);b.write('WAVE',8);b.write('fmt ',12);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(SR,24);b.writeUInt32LE(SR*4,28);b.writeUInt16LE(4,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(tot*4,40);
for(let i=0,o=44;i<tot;i++,o+=4){b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,L[i]*g))*32767),o);b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,R[i]*g))*32767),o+2)}
fs.writeFileSync(%(wav)s,b);console.log(JSON.stringify({lufs:lu,peak_db:20*Math.log10(Math.max(...[L,R].map(a=>a.reduce((m,x)=>Math.max(m,Math.abs(x)),0)))*g)}));
""" % {'dir': json.dumps(SRC_DIR), 'score': json.dumps(score), 'n': SECTIONS, 'seed': SEED, 'target': TARGET_LUFS, 'wav': json.dumps(wav)}
tmp = os.path.join(tempfile.gettempdir(), 'calibrate_score.js'); open(tmp, 'w').write(js)
print('rendering', SECTIONS, 'sections of', score['title'], '...')
res = json.loads(subprocess.run(['node', tmp], capture_output=True, text=True, check=True).stdout.strip().splitlines()[-1])
fix = TARGET_LUFS - res['lufs']
print(f"measured {res['lufs']:.2f} LUFS -> master_db {score['master_db']:.2f} + {fix:.2f}; preview peak {res['peak_db']:.1f} dBFS")
if WRITE_BACK:
    score['master_db'] = round(score['master_db'] + fix, 2)
    txt = json.dumps(score, indent=1, ensure_ascii=False)
    txt = re.sub(r'\[\s*(-?[0-9][0-9eE+.,\s-]*?)\s*\]', lambda m: '[' + re.sub(r'\s+', '', m.group(1)) + ']', txt)  # numeric arrays stay on one line
    open(score_path, 'w', encoding='utf-8').write(txt + '\n'); print('updated', SCORE)
print('preview:', wav)
if shutil.which('ffmpeg'):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', wav, '-filter_complex', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True)
    print('ffmpeg check:', ' | '.join(l.strip() for l in r.stderr.splitlines() if l.strip().startswith(('I:', 'LRA:', 'Peak:'))))
    if MAKE_MP3:
        mp3 = wav[:-4] + '.mp3'; subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-b:a', '160k', mp3]); print('mp3:', mp3)