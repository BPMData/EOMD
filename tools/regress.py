# tools/regress.py: AUDIO REGRESSION CHECK. Run in Thonny. Needs Node.js on PATH.
# Renders a fixed set of sections from every score/*.json with the project audio files and hashes the samples.
#   SAVE BASELINE  -> writes tests/hashes.json (do this BEFORE changing audio code)
#   CHECK          -> renders again and lists every section whose hash changed (0 mismatches = nothing changed)
# Sections: comp4 + lounge indexes 0-7 at seed 1 + 0-2 at seed 42 | film24 index 0 | rounds 0, 1, 2 + the first drift section.
# Scores whose style isn't in AUDIO_LIB (e.g. the 'chip' cartridges until Stage 4) are skipped and listed.
import os, json, glob, queue, threading, subprocess, tempfile, time
 
# ===================== SETTINGS =====================
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # the repo root, with audio/*.js, engine/src/audio/dsp.js, score/*.json
HASH_FILE   = os.path.join(PROJECT_DIR, 'tests', 'hashes.json')
NODE_EXE    = '/opt/homebrew/bin/node'
SAMPLE_RATE = 48000
MODE        = 'ask'      # 'ask' = window with two buttons, 'save' = save baseline now, 'check' = check now (no window)
SCORES      = 'score/*.json'
COMP4       = [(1, 8), (42, 3)]   # (seed, how many sections from index 0); also used for 'lounge'
FILM24      = [0]
ROUNDS      = [0, 1, 2]           # the first drift section is always added
# dsp, instruments (+ film voices, + CD-ROM voices), arranger core, then one file per style (any order among the styles).
AUDIO_LIB   = ['engine/src/audio/dsp.js', 'audio/instruments.js', 'audio/instruments-film.js', 'audio/instruments-cdrom.js',
               'audio/chips.js', 'audio/arranger.js', 'audio/style-comp4.js', 'audio/style-film24.js', 'audio/style-rounds.js', 'audio/style-lounge.js', 'audio/style-chip.js']
# ====================================================
 
NODE = r"""
const fs=require('fs'),path=require('path'),crypto=require('crypto');const CFG=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
globalThis.DHS={};for(const f of CFG.lib)(0,eval)(fs.readFileSync(path.join(CFG.project,f),'utf8'));
const hashes={};
for(const file of CFG.scores){const sc=JSON.parse(fs.readFileSync(path.join(CFG.project,file),'utf8')),style=sc.style||'comp4',jobs=[];
 if(!MUSIC.styles[style]){console.log(`  skipped ${file} (style "${style}" is not in AUDIO_LIB)`);continue}
 if(style==='film24')for(const i of CFG.film24)jobs.push([1,i]);
 else if(style==='rounds'){const drift=sc.blockEvery*sc.airs.length*sc.airBars/sc.bars;for(const i of CFG.rounds.concat([drift]))jobs.push([1,i])}
 else for(const[seed,n]of CFG.comp4)for(let i=0;i<n;i++)jobs.push([seed,i]);
 for(const[seed,i]of jobs){const t=Date.now(),s=MUSIC.run(sc,{sr:CFG.sr,seed,index:i}),h=crypto.createHash('sha256');
  h.update(`${s.sr}|${s.len}|${s.L.length}|${s.R.length}|`);
  h.update(Buffer.from(s.L.buffer,s.L.byteOffset,s.L.byteLength));h.update(Buffer.from(s.R.buffer,s.R.byteOffset,s.R.byteLength));
  const key=`${file} | ${style} | seed ${seed} | index ${i}`;hashes[key]=h.digest('hex').slice(0,24);
  console.log(`  ${key}  (${((Date.now()-t)/1000).toFixed(1)} s)`)}}
console.log('@@R '+JSON.stringify({node:process.version,hashes}));
"""
 
 
def render(log):
    """Render every section and return {'node': version, 'hashes': {key: hash}}."""
    miss = [f for f in AUDIO_LIB if not os.path.exists(os.path.join(PROJECT_DIR, f))]
    if miss: raise RuntimeError('missing audio files: ' + ', '.join(miss))
    scores = sorted(os.path.relpath(p, PROJECT_DIR).replace(os.sep, '/') for p in glob.glob(os.path.join(PROJECT_DIR, SCORES)))   # e.g. 'score/late-library.json'
    if not scores: raise RuntimeError('no ' + SCORES + ' in ' + PROJECT_DIR)
    tmp = tempfile.mkdtemp(prefix='regress_')
    js, cj = os.path.join(tmp, 'regress.js'), os.path.join(tmp, 'regress.json')
    open(js, 'w', encoding='utf-8').write(NODE)
    json.dump(dict(project=PROJECT_DIR, lib=AUDIO_LIB, scores=scores, sr=SAMPLE_RATE, comp4=COMP4, film24=FILM24, rounds=ROUNDS),
              open(cj, 'w', encoding='utf-8'))
    log(f'Rendering {len(scores)} score(s) with: ' + ', '.join(AUDIO_LIB))
    p = subprocess.Popen([NODE_EXE, js, cj], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8',
                         errors='replace', creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    result, tail = None, []
    for line in p.stdout:
        line = line.rstrip()
        if line.startswith('@@R '): result = json.loads(line[4:])
        elif line: log(line); tail.append(line)
    if p.wait() != 0 or result is None: raise RuntimeError('Node stopped: ' + ' | '.join(tail[-5:]))
    return result
 
 
def save_baseline(log=print):
    t = time.time(); r = render(log)
    r['saved'] = time.strftime('%Y-%m-%d %H:%M'); r['lib'] = AUDIO_LIB
    json.dump(r, open(HASH_FILE, 'w', encoding='utf-8'), indent=1)
    log(f"✅ Baseline saved: {len(r['hashes'])} sections -> {HASH_FILE} ({time.time() - t:.0f} s)")
 
 
def check(log=print):
    if not os.path.exists(HASH_FILE): raise RuntimeError('no baseline yet: run SAVE BASELINE first')
    base = json.load(open(HASH_FILE, encoding='utf-8')); t = time.time(); r = render(log); now = r['hashes']
    if base.get('node') != r['node']:
        log(f"⚠️ Baseline was made with Node {base.get('node')}, this is {r['node']}. Math can differ between versions: "
            "if everything mismatches, save a new baseline on this machine BEFORE changing code.")
    bad = [k for k in base['hashes'] if k in now and now[k] != base['hashes'][k]]
    gone = [k for k in base['hashes'] if k not in now]
    new = [k for k in now if k not in base['hashes']]
    for k in bad: log('❌ MISMATCH  ' + k)
    for k in gone: log('⚠️ NOT RENDERED (in baseline only)  ' + k)
    for k in new: log('ℹ️ NEW (no baseline)  ' + k)
    log(f"{'✅' if not bad else '❌'} {len(bad)} mismatch(es) of {len(now) - len(new)} compared"
        f"{f', {len(gone)} missing' if gone else ''}{f', {len(new)} new' if new else ''} ({time.time() - t:.0f} s)")
    return bad
 
 
def gui():
    import tkinter as tk
    root = tk.Tk(); root.title('Audio regression'); root.configure(bg='#121212')
    q = queue.Queue(); busy = [False]
    bar = tk.Frame(root, bg='#121212'); bar.pack(fill='x', padx=8, pady=8)
    out = tk.Text(root, width=100, height=30, bg='#000', fg='#FFD500', font=('Consolas', 10)); out.pack(fill='both', expand=True, padx=8, pady=(0, 8))
 
    def go(fn):
        if busy[0]: return
        busy[0] = True; out.delete('1.0', 'end')
        def work():
            try: fn(lambda m: q.put(m))
            except Exception as e: q.put(f'❌ {e}')
            busy[0] = False
        threading.Thread(target=work, daemon=True).start()
 
    def pump():
        while not q.empty(): out.insert('end', q.get() + '\n'); out.see('end')
        root.after(100, pump)
    for text, fn in (('SAVE BASELINE', save_baseline), ('CHECK', check)):
        tk.Button(bar, text=text, command=lambda f=fn: go(f), bg='#333', fg='#FFD500', font=('Consolas', 11, 'bold'), padx=12).pack(side='left', padx=(0, 8))
    pump(); root.mainloop()
 
 
if __name__ == '__main__':
    if MODE == 'save': save_baseline()
    elif MODE == 'check': check()
    else: gui()