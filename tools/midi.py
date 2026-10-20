# tools/midi.py: MIDI EXPORT. Run in Thonny. Needs Node.js on PATH (same as tools/regress.py).
# Turns a score/*.json (+ seed) into a Type-1 .mid: one track per instrument, drums on channel 10.
# How: the real arranger runs in Node with every instrument swapped for a silent stub that logs (inst, midi, length, velocity)
# and P.write logs where each note lands. Nothing is re-implemented, so the notes are exactly what the player plays.
#   comp4  -> SECONDS of music from section 0 (endless; same seed = same performance)
#   film24 -> LOOPS x the loop          rounds -> LOOPS x the full 20-min form (seed ignored by both)
import os, json, struct, subprocess, tempfile, time
 
# ===================== SETTINGS =====================
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # the repo root, with audio/*.js, engine/src/audio/dsp.js, score/*.json
SCORE       = 'score/late-library.json'
SEED        = 1            # comp4 only
SECONDS     = 20 * 60      # comp4 only: how much to export (rounded up to whole sections)
LOOPS       = 1            # film24 / rounds only
OUT_DIR     = os.path.join(PROJECT_DIR, 'midi')
NODE_EXE    = 'node'
PPQ         = 480          # ticks per quarter note
QUANTIZE    = 0            # 0 = keep the exact timing (strums, shaker jitter); 4 = snap starts to 16ths, 2 = 8ths
AUDIO_LIB   = ['engine/src/audio/dsp.js', 'audio/instruments.js', 'audio/instruments-film.js', 'audio/instruments-cdrom.js', 'audio/chips.js', 'audio/arranger.js',
               'audio/style-comp4.js', 'audio/style-film24.js', 'audio/style-rounds.js', 'audio/style-lounge.js', 'audio/style-chip.js']
# Voices with no set length (pluck in rounds) get half a beat.
# General MIDI programs (0-based) as a starting point in a DAW; drums use the note numbers in DRUMS on channel 10.
PROGRAMS    = dict(rhodes=4, keys=4, piano=0, vibes=11, marimba=12, mallet=13, tine=10, chime=14, filmChime=14,
                   pad=89, filmPad=89, bass=33, filmBass=38, flute=73, whistle=78, voice=53, pluck=24, pulse=80,
                   fmEP=4, slap=36, brass=61, bleep=80, fmBell=14, fretless=35, lyricon=71, triBass=38, loungeVibes=11,   # lounge voices
                   lead=80, lead2=81, arp=46, speech=85)   # chip parts
DRUMS       = dict(kick=36, snap=39, shaker=82, woodblock=76, snare=38, hat=42, clap=39, rim=37, chipKick=36, chipNoise=46, crash=49, tom=45)
# ====================================================
 
NODE = r"""
const fs=require('fs'),path=require('path');const CFG=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
globalThis.DHS={};for(const f of CFG.lib)(0,eval)(fs.readFileSync(path.join(CFG.project,f),'utf8'));
const P=DHS.dsp,I=INSTR,sc=JSON.parse(fs.readFileSync(path.join(CFG.project,CFG.score),'utf8')),SR=48000;
// effects only shape sound, not notes: make them free
P.reverb=P.delay=()=>()=>()=>[0,0];P.rbjHighpass=P.rbjShelfHi=()=>x=>x;P.kweight=()=>x=>x;
// stub every voice: a 1-sample silent buffer tagged with what was asked for
const tag=new WeakMap(),drums=new Set(['kick','snap','shaker','woodblock','snare','hat','clap','rim','chipKick','chipNoise']);let nid=0;
for(const k of Object.keys(I)){if(k==='now'||typeof I[k]!=='function')continue;
 I[k]=function*(sr,...a){const e={id:nid++,inst:k};
  if(drums.has(k)){e.drum=1}else{e.m=a[0];e.dur=a[1];e.v=k==='filmPad'?(a[3]===undefined?1:a[3]):(a[2]===undefined?1:a[2])}
  if(k==='pad'||k==='filmPad'){const L=new Float32Array(1),R=new Float32Array(1);tag.set(L,e);tag.set(R,e);return[L,R]}
  const b=new Float32Array(1);tag.set(b,e);return b}}
// log where each voice is written; the same voice at the same spot (stereo halves, reverb sends) counts once
let base=0;const out=[],seen=new Set(),w0=P.write;
P.write=(bus,buf,at,g=1,pan=0)=>{const e=tag.get(buf);if(!e||!g)return;const s=((at%bus.N)+bus.N)%bus.N,key=e.id+'@'+s;if(seen.has(key))return;seen.add(key);
 out.push([e.inst,base+s/SR*sc.bpm/60,e.drum?-1:e.m,e.drum?-1:e.dur*sc.bpm/60,e.drum?g:e.v])};
const style=sc.style||'comp4',secBeats=sc.bars*4,loop=MUSIC.loopSections(sc);
const n=loop?loop*CFG.loops:Math.ceil(CFG.seconds/MUSIC.sectionLen(sc));
const t=Date.now();
for(let i=0;i<n;i++){base=i*secBeats;seen.clear();
 if(style==='chip'){for(const e of MUSIC.chipEvents(sc,CFG.seed,i)){const dr=['kick','snare','hat','crash','tom'].includes(e.part);out.push([e.part,base+e.t*sc.bpm/60,dr?-1:e.m,dr?-1:e.d*sc.bpm/60,dr?e.v:e.v])}}
 else MUSIC.run(sc,{sr:SR,seed:CFG.seed,index:loop?i%loop:i})}
console.log(`  ${n} section(s), ${out.length} notes, ${((Date.now()-t)/1000).toFixed(1)} s`);
fs.writeFileSync(process.argv[3],JSON.stringify({style,bpm:sc.bpm,title:sc.title||sc.id,beats:n*secBeats,notes:out}));
"""
 
 
def vlq(n):
    b = [n & 0x7F]; n >>= 7
    while n: b.append((n & 0x7F) | 0x80); n >>= 7
    return bytes(reversed(b))
 
 
def track(events, name):
    """events: (tick, order, bytes); order 0 = note-off before 1 = note-on at the same tick."""
    data, last = bytearray(b'\x00\xFF\x03' + vlq(len(name)) + name.encode('ascii', 'replace')), 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        data += vlq(tick - last) + msg; last = tick
    data += b'\x00\xFF\x2F\x00'
    return b'MTrk' + struct.pack('>I', len(data)) + data
 
 
def export(log=print):
    t0 = time.time()
    miss = [f for f in AUDIO_LIB + [SCORE] if not os.path.exists(os.path.join(PROJECT_DIR, f))]
    if miss: raise RuntimeError('missing: ' + ', '.join(miss))
    tmp = tempfile.mkdtemp(prefix='midi_')
    js, cj, oj = (os.path.join(tmp, f) for f in ('midi.js', 'cfg.json', 'notes.json'))
    open(js, 'w', encoding='utf-8').write(NODE)
    json.dump(dict(project=PROJECT_DIR, lib=AUDIO_LIB, score=SCORE, seed=SEED, seconds=SECONDS, loops=LOOPS), open(cj, 'w', encoding='utf-8'))
    log(f'Logging notes from {SCORE} ...')
    p = subprocess.run([NODE_EXE, js, cj, oj], capture_output=True, text=True, encoding='utf-8', errors='replace',
                       creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    if p.stdout.strip(): log(p.stdout.rstrip())
    if p.returncode != 0: raise RuntimeError('Node stopped: ' + p.stderr.strip()[-600:])
    r = json.load(open(oj, encoding='utf-8'))
 
    q = PPQ * 4 // QUANTIZE if QUANTIZE else 0
    tick = lambda beats: int(round(beats * PPQ / q) * q) if q else int(round(beats * PPQ))
    insts = sorted({n[0] for n in r['notes']}, key=lambda k: (k in DRUMS, k))
    tracks, chan = [], 0
    for inst in insts:
        notes = [n for n in r['notes'] if n[0] == inst]
        if inst in DRUMS:
            ch, top = 9, max(n[4] for n in notes) or 1
            ev = [(tick(n[1]), n[4] / top * 110, DRUMS[inst], PPQ // 8) for n in notes]
            pre = []
        else:
            if chan == 9: chan = 10                     # skip channel 10 (drums)
            ch = chan; chan += 1
            if ch > 15: log(f'⚠️ more than 15 pitched instruments; {inst} shares channel 16'); ch = 15
            ev = [(tick(n[1]), n[4] * 127, int(n[2]), max(1, tick(n[1] + (n[3] if n[3] > 0 else 0.5)) - tick(n[1]))) for n in notes]
            pre = [(0, 0, bytes([0xC0 | ch, PROGRAMS.get(inst, 0)]))]
        # same pitch overlapping itself on one channel: end the earlier note where the next one starts
        ev.sort(key=lambda e: (e[2], e[0])); msgs = list(pre)
        for k, (st, vel, m, ln) in enumerate(ev):
            if k + 1 < len(ev) and ev[k + 1][2] == m and ev[k + 1][0] < st + ln: ln = max(1, ev[k + 1][0] - st)
            vel = max(1, min(127, int(round(vel))))
            msgs.append((st, 1, bytes([0x90 | ch, m, vel]))); msgs.append((st + ln, 0, bytes([0x80 | ch, m, 0])))
        tracks.append(track(msgs, inst))
        log(f'  {inst:<10} ch {ch + 1:>2}  {len(notes):>6} notes')
 
    us = int(round(60_000_000 / r['bpm']))
    meta = [(0, 0, b'\xFF\x51\x03' + us.to_bytes(3, 'big')), (0, 0, b'\xFF\x58\x04\x04\x02\x18\x08')]
    tracks.insert(0, track(meta, r['title']))
    os.makedirs(OUT_DIR, exist_ok=True)
    stem = os.path.splitext(os.path.basename(SCORE))[0]
    out = os.path.join(OUT_DIR, f"{stem}{'_seed' + str(SEED) if r['style'] in ('comp4', 'chip', 'lounge') else ''}.mid")
    with open(out, 'wb') as f:
        f.write(b'MThd' + struct.pack('>IHHH', 6, 1, len(tracks), PPQ)); [f.write(t) for t in tracks]
    mins = r['beats'] * 60 / r['bpm'] / 60
    log(f"✅ {out}  ({len(r['notes'])} notes, {r['bpm']} BPM, {mins:.1f} min, {time.time() - t0:.0f} s)")
    return out
 
 
if __name__ == '__main__':
    export()