# tools/porter.py: SCORE PORTER. Pulls a finished player's music into the score/jukebox system and proves it matches.
# Run in Thonny. Needs Node.js and ffmpeg on PATH. Keep this file in tools/ (the repo root, with audio/arranger.js, is its parent folder).
#   1 EXTRACT   player .html  -> its inline audio source (.js), without anyone opening the 370 KB file
#   2 ORIGINAL  audio source  -> original.wav (the finished player's own music, rendered by its own code)
#   3 PORT      score .json   -> port.wav     (rendered by the project's arranger, sections overlap-added, loops wrapped)
#   4 NULL TEST original vs port: correlation, residual, bit-identical check
#   5 CALIBRATE score .json   -> sets master_db for the target LUFS (writes it back) + MP3 preview
# Making the score itself (notes, a new audio/style-*.js for a new structure, added to AUDIO_LIB) is still the creative part; this does the checking.
import os, re, sys, json, time, queue, shutil, struct, threading, subprocess
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from pathlib import Path
 
# ===================== SETTINGS =====================
PROJECT_DIR     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # the repo root, with audio/*.js, engine/src/audio/dsp.js, score/*.json
WORK_DIR        = os.path.join(PROJECT_DIR, 'porter_work')    # extracted sources, renders, previews
NODE_EXE        = 'node'
FFMPEG_EXE      = 'ffmpeg'
SAMPLE_RATE     = 48000
TARGET_LUFS     = -23.0       # jukebox level (hallway films use -16)
MP3_KBPS        = 160
PREVIEW_SECONDS = 300         # MP3 preview length, 0 = whole piece
REPASS_TOL_DB   = 0.3         # scores with a soft clipper get one extra render if the first gain fix is bigger than this
FALLBACK_SECTIONS = 8         # sections to render when a score has no fixed loop length (comp4)
LONGFORM_MAX_SECTIONS = 0     # debug: render only the first N sections of an original long-form stream (0 = all)
DEFAULT_PLAYER_HTML = ''      # optional: pre-fill the player path
# ====================================================
 
COLOR_BG, COLOR_FG, COLOR_ACCENT, COLOR_ERROR = "#121212", "#FFD500", "#FF7F00", "#FF3333"
FONT_MONO, FONT_HEADER = ("Consolas", 10), ("Consolas", 11, "bold")
AUDIO_LIB = ['engine/src/audio/dsp.js', 'audio/instruments.js', 'audio/instruments-film.js', 'audio/instruments-cdrom.js', 'audio/chips.js', 'audio/arranger.js',   # core first, then one file per style
             'audio/style-comp4.js', 'audio/style-film24.js', 'audio/style-rounds.js', 'audio/style-lounge.js', 'audio/style-chip.js']
 
# ---------------------------------------------------------------- Node scripts (config arrives as a JSON file)
NODE_COMMON = r"""
const fs=require('fs'),path=require('path');const CFG=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const PROG=p=>console.log('@@P '+Math.round(p)),RES=o=>console.log('@@R '+JSON.stringify(o));
const writeWav=(file,L,R,sr)=>{const n=L.length,fd=fs.openSync(file,'w'),h=Buffer.alloc(44);
 h.write('RIFF',0);h.writeUInt32LE(36+n*8,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(3,20);h.writeUInt16LE(2,22);
 h.writeUInt32LE(sr,24);h.writeUInt32LE(sr*8,28);h.writeUInt16LE(8,32);h.writeUInt16LE(32,34);h.write('data',36);h.writeUInt32LE(n*8,40);
 fs.writeSync(fd,h);const B=1<<18,buf=Buffer.alloc(B*8);
 for(let o=0;o<n;o+=B){const m=Math.min(B,n-o);for(let i=0;i<m;i++){buf.writeFloatLE(L[o+i],i*8);buf.writeFloatLE(R[o+i],i*8+4)}fs.writeSync(fd,buf,0,m*8)}fs.closeSync(fd)};
"""
NODE_ORIGINAL = NODE_COMMON + r"""
// Loads the extracted player source, trying shorter and shorter prefixes (SFX/master/worker glue may not run in Node), until the needed API exists.
let src=fs.readFileSync(CFG.src,'utf8');const LONG=CFG.mode==='longform';
if(CFG.noclip){if(src.includes('th = 0.6'))src=src.replace('th = 0.6','th = 1e9');else console.log('note: no soft clipper found in this source (nothing to bypass)')}
const need=()=>globalThis.DHS&&(LONG?(DHS.longform&&DHS.longform.stream):(DHS.music&&DHS.music.render));
const ends=[...src.matchAll(/\}\)\(globalThis\);/g)].map(m=>m.index+m[0].length);let ok=false;
for(let k=ends.length-1;k>=0&&!ok;k--){globalThis.DHS={};try{(0,eval)(src.slice(0,ends[k]));ok=!!need()}catch(e){ok=false}}
if(!ok)throw new Error('could not load the original: no '+(LONG?'DHS.longform.stream':'DHS.music.render')+' found in '+CFG.src);
const SR=CFG.sr;let L,R;
if(!LONG){const r=DHS.music.render({sr:SR});L=r.music.L;R=r.music.R;PROG(90)}
else{const LF=DHS.longform,n=CFG.maxSections>0?Math.min(CFG.maxSections,LF.plan.length):LF.plan.length,s=LF.stream();s.warm();
 const parts=[];let tot=0;for(let i=0;i<n;i++){const c=s.next(i);parts.push(c);tot+=c.L.length;PROG(5+85*(i+1)/n)}
 L=new Float32Array(tot);R=new Float32Array(tot);let o=0;for(const c of parts){L.set(c.L,o);R.set(c.R,o);o+=c.L.length}}
writeWav(CFG.out,L,R,SR);PROG(100);RES({samples:L.length,seconds:L.length/SR,out:CFG.out});
"""
NODE_PORT = NODE_COMMON + r"""
globalThis.DHS={};for(const f of CFG.lib)(0,eval)(fs.readFileSync(path.join(CFG.project,f),'utf8'));
const sc=JSON.parse(fs.readFileSync(CFG.score,'utf8'));if(CFG.master_db!==null&&CFG.master_db!==undefined)sc.master_db=CFG.master_db;
if(CFG.noclip&&sc.fx&&sc.fx.clip)sc.fx.clip=null;
const SR=CFG.sr,hop=Math.round(MUSIC.sectionLen(sc)*SR),loop=MUSIC.loopSections?MUSIC.loopSections(sc):null;
const n=CFG.sections>0?CFG.sections:(loop||CFG.fallback),wrap=loop!=null&&n===loop,T=wrap?hop*n:Math.round(hop*n+(sc.tail||0)*SR);
const L=new Float32Array(T),R=new Float32Array(T);
for(let i=0;i<n;i++){const s=MUSIC.run(sc,{sr:SR,seed:1,index:i}),o=i*hop;
 for(let j=0;j<s.L.length;j++){let p=o+j;if(p>=T){if(!wrap)break;p%=T}L[p]+=s.L[j];R[p]+=s.R[j]}PROG(95*(i+1)/n)}
const lufs=DHS.dsp.lufs({N:T,L,R},SR);let pk=0;for(let i=0;i<T;i++){const a=Math.max(Math.abs(L[i]),Math.abs(R[i]));if(a>pk)pk=a}
writeWav(CFG.out,L,R,SR);PROG(100);
RES({lufs,peak_db:20*Math.log10(Math.max(pk,1e-12)),seconds:T/SR,sections:n,loop:loop,loop_wrapped:wrap,style:sc.style,master_db:sc.master_db,out:CFG.out});
"""
NODE_NULL = NODE_COMMON + r"""
// raw float32 interleaved stereo; a = original, b = port. Residual is measured after the best single gain (the port carries master_db).
const rd=(f,off)=>({fd:fs.openSync(f,'r'),off,len:Math.floor((fs.statSync(f).size-off)/4)});
const A=rd(CFG.a,CFG.offA),B=rd(CFG.b,CFG.offB),n=Math.min(A.len,B.len),CH=1<<20,ba=Buffer.alloc(CH*4),bb=Buffer.alloc(CH*4);
let exact=0,sa=0,sb=0,sab=0,maxd=0,sd=0;
for(let o=0;o<n;o+=CH){const m=Math.min(CH,n-o);fs.readSync(A.fd,ba,0,m*4,A.off+o*4);fs.readSync(B.fd,bb,0,m*4,B.off+o*4);
 const x=new Float32Array(ba.buffer,ba.byteOffset,m),y=new Float32Array(bb.buffer,bb.byteOffset,m);
 for(let i=0;i<m;i++){if(x[i]===y[i])exact++;sa+=x[i]*x[i];sb+=y[i]*y[i];sab+=x[i]*y[i]}PROG(45*(o+m)/n)}
const g=sab/sb;
for(let o=0;o<n;o+=CH){const m=Math.min(CH,n-o);fs.readSync(A.fd,ba,0,m*4,A.off+o*4);fs.readSync(B.fd,bb,0,m*4,B.off+o*4);
 const x=new Float32Array(ba.buffer,ba.byteOffset,m),y=new Float32Array(bb.buffer,bb.byteOffset,m);
 for(let i=0;i<m;i++){const e=x[i]-g*y[i],d=Math.abs(e);sd+=e*e;if(d>maxd)maxd=d}PROG(45+50*(o+m)/n)}
RES({samples:n,seconds:n/(2*CFG.sr),lenA:A.len,lenB:B.len,exact_frac:exact/n,correlation:sab/Math.sqrt(sa*sb),ls_gain:g,
 ls_gain_db:20*Math.log10(Math.abs(g)),residual_db:10*Math.log10(sd/sa+1e-30),max_abs_diff:maxd});PROG(100);
"""
 
# ---------------------------------------------------------------- core (no GUI in here, so it can be tested alone)
class Ctx:
    """log(msg, tag) and prog(percent) callbacks; the GUI replaces these."""
    def __init__(self, log=None, prog=None):
        self.log = log or (lambda m, t='INFO': print(m))
        self.prog = prog or (lambda p: None)
 
 
def run_node(ctx, name, script, cfg):
    os.makedirs(WORK_DIR, exist_ok=True)
    js, cj = os.path.join(WORK_DIR, f'_porter_{name}.js'), os.path.join(WORK_DIR, f'_porter_{name}.json')
    open(js, 'w', encoding='utf-8').write(script)
    json.dump(cfg, open(cj, 'w', encoding='utf-8'))
    p = subprocess.Popen([NODE_EXE, js, cj], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8',
                         errors='replace', creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    result, tail = None, []
    for line in p.stdout:
        line = line.rstrip()
        if line.startswith('@@P '):
            try: ctx.prog(float(line[4:]))
            except ValueError: pass
        elif line.startswith('@@R '): result = json.loads(line[4:])
        elif line:
            ctx.log(line, 'INFO'); tail.append(line)
    if p.wait() != 0:
        raise RuntimeError('Node stopped: ' + ' | '.join(tail[-5:]))
    return result
 
 
def check_tools(ctx):
    ok = True
    for exe in (NODE_EXE, FFMPEG_EXE):
        if shutil.which(exe): ctx.log(f'✅ {exe} found.', 'SUCCESS')
        else: ctx.log(f'❌ {exe} not found on PATH.', 'ERROR'); ok = False
    miss = [f for f in AUDIO_LIB if not os.path.exists(os.path.join(PROJECT_DIR, f))]
    if miss: ctx.log('⚠️ Project folder is missing: ' + ', '.join(miss), 'WARN')
    else: ctx.log('✅ Project audio files found.', 'SUCCESS')
    return ok
 
 
def scan_html(path):
    """Inline <script> blocks big enough to hold music code. Returns [(id, type, chars, looks_like_audio)]."""
    html = open(path, encoding='utf-8', errors='replace').read()
    out = []
    for k, m in enumerate(re.finditer(r'<script\b([^>]*)>(.*?)</script>', html, re.S | re.I)):
        attrs, body = m.group(1), m.group(2)
        if re.search(r'\bsrc\s*=', attrs) or len(body) < 3000: continue
        sid = re.search(r'\bid\s*=\s*["\']([^"\']+)', attrs)
        typ = re.search(r'\btype\s*=\s*["\']([^"\']+)', attrs)
        audio = any(t in body for t in ('DHS.dsp', 'P.reverb', 'mtof', 'AudioContext')) and 'base64' not in body[:200]
        out.append((sid.group(1) if sid else f'inline-{k}', typ.group(1) if typ else 'script', len(body), audio, body))
    out.sort(key=lambda r: (not r[3], -r[2]))   # likely-audio first, then biggest
    return out
 
 
def extract_source(ctx, html_path, script_id):
    for sid, typ, n, audio, body in scan_html(html_path):
        if sid == script_id:
            os.makedirs(WORK_DIR, exist_ok=True)
            out = os.path.join(WORK_DIR, re.sub(r'[^\w.-]', '_', sid) + '.js')
            open(out, 'w', encoding='utf-8').write(body)
            ctx.log(f'✅ Extracted "{sid}" ({n/1024:.0f} KB) -> {out}', 'SUCCESS')
            return out, ('longform' if 'DHS.longform' in body else 'film')
    raise RuntimeError(f'script "{script_id}" not found in {html_path}')
 
 
def render_original(ctx, src, mode, noclip, out):
    ctx.log(f'Rendering the ORIGINAL ({mode}) with its own code...', 'CMD')
    r = run_node(ctx, 'original', NODE_ORIGINAL, dict(src=src, mode=mode, noclip=noclip, out=out, sr=SAMPLE_RATE, maxSections=LONGFORM_MAX_SECTIONS))
    ctx.log(f"✅ original: {r['seconds']:.1f} s -> {out}", 'SUCCESS')
    return r
 
 
def render_port(ctx, score_path, sections, noclip, out, master_db=None):
    ctx.log(f'Rendering the PORT from {os.path.basename(score_path)}...', 'CMD')
    r = run_node(ctx, 'port', NODE_PORT, dict(project=PROJECT_DIR, lib=AUDIO_LIB, score=score_path, sections=sections, noclip=noclip, out=out,
                                              sr=SAMPLE_RATE, fallback=FALLBACK_SECTIONS, master_db=master_db))
    ctx.log(f"✅ port: {r['seconds']:.1f} s, {r['sections']} section(s){' (loop wrapped)' if r['loop_wrapped'] else ''}, "
            f"{r['lufs']:.2f} LUFS, peak {r['peak_db']:.1f} dBFS -> {out}", 'SUCCESS')
    if r.get('loop') and not r['loop_wrapped']:
        ctx.log(f"⚠️ Partial loop ({r['sections']} of {r['loop']} sections): the first seconds lack the previous loop's ring-out, so they will not null against a seamless original. Use 0 sections for the full loop.", 'WARN')
    return r
 
 
def _raw_f32(ctx, path):
    """(file, byte offset) of raw float32 stereo for any audio file. Our own float WAVs are read in place; anything else goes through ffmpeg."""
    with open(path, 'rb') as f: h = f.read(44)
    if len(h) == 44 and h[:4] == b'RIFF' and struct.unpack('<HHIIHH', h[20:36]) == (3, 2, SAMPLE_RATE, SAMPLE_RATE * 8, 8, 32) and h[36:40] == b'data':
        return path, 44
    tmp = os.path.join(WORK_DIR, '_tmp_' + re.sub(r'\W', '_', os.path.basename(path)) + '.f32')
    ctx.log(f'Converting {os.path.basename(path)} with ffmpeg...', 'INFO')
    subprocess.run([FFMPEG_EXE, '-y', '-loglevel', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SAMPLE_RATE), tmp], check=True,
                   creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    return tmp, 0
 
 
def null_test(ctx, a_path, b_path):
    ctx.log('Null test: original (A) vs port (B)...', 'CMD')
    a, oa = _raw_f32(ctx, a_path); b, ob = _raw_f32(ctx, b_path)
    r = run_node(ctx, 'null', NODE_NULL, dict(a=a, b=b, offA=oa, offB=ob, sr=SAMPLE_RATE))
    if r['lenA'] != r['lenB']:
        ctx.log(f"⚠️ Lengths differ (A {r['lenA']/2/SAMPLE_RATE:.2f} s, B {r['lenB']/2/SAMPLE_RATE:.2f} s). Compared the shorter. The tails or loop point may differ.", 'WARN')
    res = r['residual_db']
    verdict = ('BIT-IDENTICAL' if r['exact_frac'] == 1 else 'NULLS: identical for all practical purposes (float rounding only)' if res < -120
               else 'VERY CLOSE: inaudible difference' if res < -60 else 'DIFFERENT: listen, something is not ported faithfully')
    ctx.log(f"   compared {r['seconds']:.1f} s | bit-identical samples {100*r['exact_frac']:.2f}% | correlation {r['correlation']:.12f}", 'INFO')
    ctx.log(f"   best gain {r['ls_gain_db']:+.2f} dB | residual {res:.1f} dB | max difference {r['max_abs_diff']:.2e}", 'INFO')
    ctx.log(f'✅ VERDICT: {verdict}', 'SUCCESS' if res < -60 else 'ERROR')
    return r
 
 
def dump_score(path, sc):
    """Write a score with every numeric array on one line (keeps a note per row instead of one number per line)."""
    txt = json.dumps(sc, indent=1, ensure_ascii=False)
    txt = re.sub(r'\[\s*(-?[0-9][0-9eE+.,\s-]*?)\s*\]', lambda m: '[' + re.sub(r'\s+', '', m.group(1)) + ']', txt)
    open(path, 'w', encoding='utf-8').write(txt + '\n')
 
 
def calibrate(ctx, score_path, sections, target, mp3, preview_s):
    sc = json.load(open(score_path, encoding='utf-8')); master = float(sc.get('master_db', 0))
    nonlinear = bool((sc.get('fx') or {}).get('clip'))
    wav = os.path.join(WORK_DIR, f"calibrate_{sc['id']}.wav")
    for attempt in (1, 2):
        r = render_port(ctx, score_path, sections, False, wav, master_db=master)
        fix = target - r['lufs']
        ctx.log(f"   measured {r['lufs']:.2f} LUFS at master_db {master:.2f} -> needs {fix:+.2f} dB", 'INFO')
        if attempt == 1 and nonlinear and abs(fix) > REPASS_TOL_DB:
            ctx.log('   this score has a soft clipper: re-rendering once at the corrected level so the clipper is not skewing the measurement', 'WARN')
            master = round(master + fix, 2)
        else:
            break
    new_db = round(master + fix, 2)
    sc['master_db'] = new_db; dump_score(score_path, sc)
    ctx.log(f'✅ master_db {new_db} written back to {os.path.basename(score_path)}', 'SUCCESS')
    flags = getattr(subprocess, 'CREATE_NO_WINDOW', 0)
    chk = subprocess.run([FFMPEG_EXE, '-hide_banner', '-nostats', '-i', wav, '-af', f'volume={fix}dB,ebur128=peak=true:framelog=quiet', '-f', 'null', '-'],
                         capture_output=True, text=True, creationflags=flags)
    ctx.log('ffmpeg check: ' + ' | '.join(l.strip() for l in chk.stderr.splitlines() if l.strip().startswith(('I:', 'LRA:', 'Peak:'))), 'SUCCESS')
    if mp3:
        out = os.path.join(WORK_DIR, f"preview_{sc['id']}.mp3")
        cmd = [FFMPEG_EXE, '-y', '-loglevel', 'error', '-i', wav, '-af', f'volume={fix}dB', '-b:a', f'{MP3_KBPS}k'] + (['-t', str(preview_s)] if preview_s else []) + [out]
        subprocess.run(cmd, check=True, creationflags=flags)
        ctx.log(f'✅ MP3 preview: {out}', 'SUCCESS')
    return new_db
 
 
# ---------------------------------------------------------------- GUI
class PorterApp:
    def __init__(self, root):
        self.root = root
        root.title('/// S C O R E   P O R T E R ///'); root.geometry('900x960'); root.configure(bg=COLOR_BG)
        self.project = tk.StringVar(value=PROJECT_DIR); self.work = tk.StringVar(value=WORK_DIR)
        self.html = tk.StringVar(value=DEFAULT_PLAYER_HTML); self.src = tk.StringVar(); self.mode = tk.StringVar(value='film')
        self.orig_noclip = tk.BooleanVar(value=False); self.score = tk.StringVar(); self.sections = tk.StringVar(value='0')
        self.port_noclip = tk.BooleanVar(value=False); self.wav_a = tk.StringVar(); self.wav_b = tk.StringVar()
        self.target = tk.StringVar(value=str(TARGET_LUFS)); self.mp3 = tk.BooleanVar(value=True); self.preview = tk.StringVar(value=str(PREVIEW_SECONDS))
        self.prog = tk.DoubleVar(value=0); self.q = queue.Queue(); self.busy = False; self.buttons = []; self.scan = []
        self._styles(); self._build()
        root.after(100, self._pump)
        self._apply_dirs(); self._refresh_scores()
        self.log('Terminal online. Pick a player .html to begin, or jump to any step.', 'SUCCESS')
        check_tools(self.ctx())
 
    # ---- plumbing
    def ctx(self): return Ctx(self.log, lambda p: self.root.after(0, lambda: self.prog.set(p)))
    def log(self, msg, tag='INFO'): self.q.put((msg, tag))
    def _pump(self):
        while not self.q.empty():
            msg, tag = self.q.get(); self.txt.config(state='normal'); self.txt.insert('end', msg + '\n', tag); self.txt.see('end'); self.txt.config(state='disabled')
        self.root.after(100, self._pump)
 
    def _apply_dirs(self):
        global PROJECT_DIR, WORK_DIR
        PROJECT_DIR, WORK_DIR = self.project.get(), self.work.get()
        self.wav_a.set(self.wav_a.get() or os.path.join(WORK_DIR, 'original.wav')); self.wav_b.set(self.wav_b.get() or os.path.join(WORK_DIR, 'port.wav'))
 
    def _refresh_scores(self):
        names = sorted(Path(self.project.get()).glob('score/*.json'))
        self.cb['values'] = [p.name for p in names]
        if names and not self.score.get(): self.score.set(names[0].name)
 
    def _run(self, fn):
        if self.busy: return
        try: self._apply_dirs(); os.makedirs(WORK_DIR, exist_ok=True)
        except Exception as e: messagebox.showerror('Folder error', str(e)); return
        self.busy = True; self.prog.set(0)
        for b in self.buttons: b.config(state='disabled')
        def work():
            try: fn()
            except Exception as e: self.log(f'❌ {e}', 'ERROR')
            finally:
                self.busy = False
                self.root.after(0, lambda: [b.config(state='normal') for b in self.buttons])
        threading.Thread(target=work, daemon=True).start()
 
    def _score_path(self): return os.path.join(self.project.get(), 'score', self.score.get())   # the picker lists the names inside score/
    def _sections(self):
        try: return max(0, int(self.sections.get()))
        except ValueError: return 0
    def _pick(self, var, kinds, folder=False):
        p = filedialog.askdirectory() if folder else filedialog.askopenfilename(filetypes=kinds)
        if p: var.set(str(Path(p)))
 
    # ---- step actions
    def do_scan(self):
        path = self.html.get().strip()
        if not os.path.exists(path): self.log('⚠️ Choose the player .html first.', 'WARN'); return
        self.lb.delete(0, 'end'); self.scan = scan_html(path)
        for sid, typ, n, audio, _ in self.scan: self.lb.insert('end', f"{'★' if audio else ' '} {sid:<28} {n/1024:7.0f} KB  {typ}")
        starred = [i for i, s in enumerate(self.scan) if s[3]]
        if starred: self.lb.selection_set(starred[0])
        self.log(f'Found {len(self.scan)} candidate script(s). ★ = looks like synth/audio code.', 'SUCCESS' if self.scan else 'WARN')
 
    def do_extract(self):
        sel = self.lb.curselection()
        if not sel: self.log('⚠️ Scan, then pick a script in the list.', 'WARN'); return
        sid, html = self.scan[sel[0]][0], self.html.get().strip()
        def job():
            out, mode = extract_source(self.ctx(), html, sid)
            self.root.after(0, lambda: (self.src.set(out), self.mode.set(mode)))
            self.log(f'Source set; original mode guessed as {mode.upper()}.', 'INFO')
        self._run(job)
 
    def do_original(self):
        src, mode, nc, out = self.src.get(), self.mode.get(), self.orig_noclip.get(), self.wav_a.get()
        self._run(lambda: render_original(self.ctx(), src, mode, nc, out))
 
    def do_port(self):
        sp, secs, nc, out = self._score_path(), self._sections(), self.port_noclip.get(), self.wav_b.get()
        self._run(lambda: render_port(self.ctx(), sp, secs, nc, out))
 
    def do_null(self):
        a, b = self.wav_a.get(), self.wav_b.get()
        self._run(lambda: null_test(self.ctx(), a, b))
 
    def do_calibrate(self):
        sp, secs, mp3 = self._score_path(), self._sections(), self.mp3.get()
        try: target, prev = float(self.target.get()), int(float(self.preview.get()))
        except ValueError: self.log('⚠️ Target LUFS / preview seconds must be numbers.', 'WARN'); return
        self._run(lambda: calibrate(self.ctx(), sp, secs, target, mp3, prev))
 
    def export_log(self):
        txt = self.txt.get(1.0, 'end-1c').strip()
        if not txt: return
        f = os.path.join(self.work.get(), f"Porter_Log_{time.strftime('%Y%m%d-%H%M%S')}.txt"); os.makedirs(self.work.get(), exist_ok=True)
        open(f, 'w', encoding='utf-8').write(txt); self.log(f'💾 Log saved: {f}', 'SUCCESS')
 
    def open_work(self):
        p = self.work.get(); os.makedirs(p, exist_ok=True)
        try:
            if sys.platform == 'win32': os.startfile(p)
            elif sys.platform == 'darwin': subprocess.Popen(['open', p])
            else: subprocess.Popen(['xdg-open', p])
        except Exception as e: self.log(f'❌ {e}', 'ERROR')
 
    # ---- layout
    def _styles(self):
        s = ttk.Style(); s.theme_use('clam')
        s.configure('TFrame', background=COLOR_BG); s.configure('TLabel', background=COLOR_BG, foreground=COLOR_FG, font=FONT_MONO)
        s.configure('TButton', background='#333', foreground=COLOR_FG, borderwidth=3, relief='raised', font=FONT_HEADER)
        s.map('TButton', background=[('active', COLOR_ACCENT), ('pressed', COLOR_FG)], foreground=[('active', '#000'), ('pressed', '#000')])
        s.configure('Horizontal.TProgressbar', troughcolor='#333', background=COLOR_ACCENT, bordercolor=COLOR_BG, lightcolor=COLOR_ACCENT, darkcolor=COLOR_ACCENT)
        s.configure('TCombobox', fieldbackground='#222', foreground='#FFF', background='#333')
 
    def _entry(self, parent, var, width=None, **kw):
        e = tk.Entry(parent, textvariable=var, bg='#222', fg='#FFF', insertbackground=COLOR_FG, relief='sunken', bd=2, font=FONT_MONO, **({'width': width} if width else {}), **kw)
        return e
 
    def _btn(self, parent, text, cmd, tracked=True):
        b = ttk.Button(parent, text=text, command=cmd)
        if tracked: self.buttons.append(b)
        return b
 
    def _step(self, title):
        f = tk.LabelFrame(self.root, text=f' {title} ', bg=COLOR_BG, fg=COLOR_ACCENT, bd=2, relief='groove', font=FONT_HEADER)
        f.pack(fill='x', padx=10, pady=4); return f
 
    def _row(self, parent):
        r = tk.Frame(parent, bg=COLOR_BG); r.pack(fill='x', padx=5, pady=2); return r
 
    def _check(self, parent, text, var):
        return tk.Checkbutton(parent, text=text, variable=var, bg=COLOR_BG, fg=COLOR_FG, selectcolor='#333', activebackground=COLOR_BG, activeforeground=COLOR_ACCENT, font=FONT_MONO)
 
    def _build(self):
        tk.Label(self.root, text='/// SCORE PORTER ///', bg=COLOR_BG, fg=COLOR_ACCENT, font=('Consolas', 16, 'bold')).pack(pady=(8, 2))
        top = tk.Frame(self.root, bg=COLOR_BG); top.pack(fill='x', padx=10)
        for label, var, folder in (('PROJECT DIR', self.project, True), ('WORK DIR', self.work, True)):
            r = self._row(top); tk.Label(r, text=f'{label:<12}', bg=COLOR_BG, fg=COLOR_FG, font=FONT_HEADER).pack(side='left')
            self._entry(r, var).pack(side='left', fill='x', expand=True, padx=4); self._btn(r, '[ SET ]', lambda v=var: (self._pick(v, None, True), self._apply_dirs(), self._refresh_scores()), False).pack(side='left')
        self._btn(r, '[ OPEN WORK DIR ]', self.open_work, False).pack(side='left', padx=(4, 0))
 
        s1 = self._step('1 · EXTRACT audio code from a finished player')
        r = self._row(s1); tk.Label(r, text='Player .html', bg=COLOR_BG, fg=COLOR_FG, font=FONT_MONO).pack(side='left')
        self._entry(r, self.html).pack(side='left', fill='x', expand=True, padx=4)
        self._btn(r, '[ BROWSE ]', lambda: self._pick(self.html, [('HTML', '*.html')]), False).pack(side='left'); self._btn(r, '[ SCAN ]', self.do_scan).pack(side='left', padx=(4, 0))
        self.lb = tk.Listbox(s1, bg='#111', fg=COLOR_FG, selectbackground=COLOR_ACCENT, selectforeground='#000', font=FONT_MONO, height=3, relief='sunken', bd=2, exportselection=False)
        self.lb.pack(fill='x', padx=5, pady=2); self._btn(s1, '[ EXTRACT SELECTED ]', self.do_extract).pack(anchor='e', padx=5, pady=(0, 3))
 
        s2 = self._step('2 · ORIGINAL: render the finished player\'s own music')
        r = self._row(s2); tk.Label(r, text='Source .js', bg=COLOR_BG, fg=COLOR_FG, font=FONT_MONO).pack(side='left')
        self._entry(r, self.src).pack(side='left', fill='x', expand=True, padx=4); self._btn(r, '[ BROWSE ]', lambda: self._pick(self.src, [('JS', '*.js')]), False).pack(side='left')
        r = self._row(s2)
        for text, val in (('FILM loop (DHS.music.render)', 'film'), ('LONGFORM stream (DHS.longform)', 'longform')):
            tk.Radiobutton(r, text=text, variable=self.mode, value=val, bg=COLOR_BG, fg=COLOR_FG, selectcolor='#333', activebackground=COLOR_BG, activeforeground=COLOR_ACCENT, font=FONT_MONO).pack(side='left', padx=(0, 8))
        r = self._row(s2); self._check(r, 'bypass its soft clipper (so the test is not skewed by a nonlinear stage)', self.orig_noclip).pack(side='left')
        self._btn(r, '[ RENDER ORIGINAL ]', self.do_original).pack(side='right')
 
        s3 = self._step('3 · PORT: render the score with the project arranger')
        r = self._row(s3); tk.Label(r, text='Score', bg=COLOR_BG, fg=COLOR_FG, font=FONT_MONO).pack(side='left')
        self.cb = ttk.Combobox(r, textvariable=self.score, width=40, font=FONT_MONO); self.cb.pack(side='left', padx=4)
        self._btn(r, '[ ↻ ]', self._refresh_scores, False).pack(side='left')
        r = self._row(s3); tk.Label(r, text='Sections (0 = full loop)', bg=COLOR_BG, fg=COLOR_FG, font=FONT_MONO).pack(side='left'); self._entry(r, self.sections, 5).pack(side='left', padx=4)
        self._check(r, 'bypass clipper', self.port_noclip).pack(side='left', padx=(10, 0)); self._btn(r, '[ RENDER PORT ]', self.do_port).pack(side='right')
 
        s4 = self._step('4 · NULL TEST: original vs port')
        for label, var in (('A original', self.wav_a), ('B port', self.wav_b)):
            r = self._row(s4); tk.Label(r, text=f'{label:<11}', bg=COLOR_BG, fg=COLOR_FG, font=FONT_MONO).pack(side='left')
            self._entry(r, var).pack(side='left', fill='x', expand=True, padx=4); self._btn(r, '[ BROWSE ]', lambda v=var: self._pick(v, [('Audio', '*.wav *.mp3 *.flac *.ogg *.opus')]), False).pack(side='left')
        self._btn(s4, '[ RUN NULL TEST ]', self.do_null).pack(anchor='e', padx=5, pady=(0, 3))
 
        s5 = self._step('5 · CALIBRATE the score to the target loudness + MP3 preview')
        r = self._row(s5); tk.Label(r, text='Target LUFS', bg=COLOR_BG, fg=COLOR_FG, font=FONT_MONO).pack(side='left'); self._entry(r, self.target, 6).pack(side='left', padx=4)
        self._check(r, 'MP3 preview, seconds (0 = all):', self.mp3).pack(side='left', padx=(10, 0)); self._entry(r, self.preview, 6).pack(side='left', padx=4)
        self._btn(r, '[ CALIBRATE ]', self.do_calibrate).pack(side='right')
 
        ttk.Progressbar(self.root, variable=self.prog, maximum=100, orient='horizontal').pack(fill='x', padx=10, pady=(8, 0))
        lc = tk.Frame(self.root, bg=COLOR_BG); lc.pack(fill='x', padx=10, pady=(6, 0))
        tk.Label(lc, text='TERMINAL OUTPUT:', bg=COLOR_BG, fg=COLOR_FG, font=FONT_HEADER).pack(side='left'); self._btn(lc, '[ EXPORT LOG ]', self.export_log, False).pack(side='right')
        lf = tk.Frame(self.root, bg=COLOR_BG); lf.pack(fill='both', expand=True, padx=10, pady=5)
        self.txt = tk.Text(lf, bg='#000', fg='#AAA', font=FONT_MONO, state='disabled', relief='sunken', bd=2, height=8); self.txt.pack(side='left', fill='both', expand=True)
        sb = ttk.Scrollbar(lf, orient='vertical', command=self.txt.yview); sb.pack(side='right', fill='y'); self.txt.config(yscrollcommand=sb.set)
        for tag, col in (('INFO', '#AAA'), ('SUCCESS', COLOR_FG), ('WARN', COLOR_ACCENT), ('ERROR', COLOR_ERROR), ('CMD', '#00AA00')): self.txt.tag_config(tag, foreground=col)
 
 
if __name__ == '__main__':
    root = tk.Tk()
    PorterApp(root)
    root.mainloop()
 