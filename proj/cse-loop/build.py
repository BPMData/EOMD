"""
build.py -- builds the CSE hallway loop player: ONE offline HTML file (scripts, fonts, images and the music code
inlined; nothing loads from the internet). Press Run in Thonny.
Keys in the player: space = pause, F = fullscreen, left/right = jump 2 s (for checking). ?t=12 starts at 12 s; add &pause=1 to hold that frame.
"""
import os, base64

# ============================ SETTINGS (edit these) ============================
OUT_HTML   = "cse-loop.html"        # written next to this script
WITH_SOUND = True                   # True: music.js synthesized in the browser at Start sound (False: picture only)
TITLE      = "Computer Science Essentials"
# ===============================================================================

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
VIS = ["src/core.js", "src/blocks.js", "src/line.js", "src/art.js", "src/film.js", "src/runtime.js"]
FONTS = {"poppins800": "fonts/Poppins-ExtraBold.ttf", "poppins700": "fonts/Poppins-Bold.ttf",
         "poppins600": "fonts/Poppins-SemiBold.ttf", "mono": "fonts/SourceCodePro-wght.ttf"}
IMAGES = {"badge": "assets/itc-academy-badge-512.png"}

# loudness to the hallway target and a true-peak limiter, the same two passes as tools/render_piece.py
AUDIO_MASTER = """DHS.audio = { render: () => { const P = DHS.dsp, sr = 48000, LUFS = -16, CEIL = P.db(-1.5);
  const scale = (b, g) => { const o = P.bus(b.N); for (let i = 0; i < b.N; i++) { o.L[i] = b.L[i] * g; o.R[i] = b.R[i] * g; } return o; };
  const bus = PIECE.render(sr); let out = P.limit(scale(bus, P.db(LUFS - P.lufs(bus, sr))), sr, CEIL).bus;
  out = P.limit(scale(out, P.db(LUFS - P.lufs(out, sr))), sr, CEIL).bus; return { master: out, sr }; } };"""

def read(p): return open(os.path.join(HERE, p), encoding="utf-8").read()
def b64(p): return base64.b64encode(open(os.path.join(HERE, p), "rb").read()).decode()
def esc(s): return s.replace("</script", "<\\/script")

def main():
    assets = "globalThis.DHS = globalThis.DHS || {}; DHS.ASSETS = {" + ",".join(f'"{k}":"{b64(v)}"' for k, v in FONTS.items())
    assets += ',"images":{' + ",".join(f'"{k}":"data:image/png;base64,{b64(v)}"' for k, v in IMAGES.items()) + "}};"
    audio = ""
    if WITH_SOUND:
        audio = (read(os.path.join("..", "..", "engine", "src", "audio", "dsp.js")) + "\n;\n" + read("music.js") +
                 "\n;\n" + AUDIO_MASTER)
    html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>{TITLE}</title>
<style>
html,body{{margin:0;height:100%;background:#0033A0;overflow:hidden}}
body{{display:flex;align-items:center;justify-content:center}}
canvas{{max-width:100vw;max-height:100vh;width:auto;height:auto;display:block}}
body.idle{{cursor:none}}
#bar{{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;gap:10px;align-items:center;
  background:rgba(14,3,24,.82);color:#fff;font:600 16px system-ui,sans-serif;padding:10px 14px;border-radius:12px;transition:opacity .5s}}
body.idle #bar{{opacity:0;pointer-events:none}}
#bar button{{background:#fff;color:#0e0318;border:0;border-radius:8px;padding:9px 15px;font:inherit;cursor:pointer}}
#bar button.go{{background:#FFD100}}
</style></head><body><canvas id="c"></canvas>
<div id="bar"><button id="snd" class="go" {'' if WITH_SOUND else 'hidden'}>Start sound</button><button id="pp">Pause</button><button id="fs">Fullscreen</button><span id="st"></span></div>
{('<script type="text/plain" id="dhs-audio-src">' + esc(audio) + '</script>') if WITH_SOUND else ''}
<script>{esc(assets)}</script>
{chr(10).join('<script>' + esc(read(f)) + '</script>' for f in VIS)}
<script>
(async()=>{{const q=new URLSearchParams(location.search),$=(i)=>document.getElementById(i);
await DHS.type.load();DHS.film.build();
const P=DHS.runtime.create($('c'),{{orientation:'landscape',fps:+(q.get('fps')||60),maxScale:+(q.get('scale')||2),muted:{'false' if WITH_SOUND else 'true'}}});
if(q.get('t'))P.seek(+q.get('t'));if(q.get('pause'))P.pause();
P.onStatus(s=>{{$('st').textContent={{synth:'Preparing sound…',ready:'',blocked:'',playing:''}}[s]??'';if(s==='playing')$('snd').hidden=true;}});
P.start();
{'P.enableAudio();' if WITH_SOUND else ''}   // make the music now (in the background); it plays once a click allows it
$('snd').onclick=()=>{{P.enableAudio();}};
let idle;const wake=()=>{{document.body.classList.remove('idle');clearTimeout(idle);idle=setTimeout(()=>document.body.classList.add('idle'),3000);}};
document.body.classList.add('idle');addEventListener('mousemove',wake);addEventListener('pointerdown',wake);
$('pp').onclick=()=>{{P.toggle();$('pp').textContent=P.st.playing?'Pause':'Play';}};
$('fs').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(()=>{{}});
addEventListener('dblclick',()=>$('fs').onclick());
addEventListener('keydown',e=>{{if(e.key==='f')$('fs').onclick();if(e.code==='Space'){{e.preventDefault();$('pp').onclick();}}
  if(e.key==='ArrowRight')P.seek(P.time()+2);if(e.key==='ArrowLeft')P.seek(P.time()-2);}});
window.__cse=P;}})();
</script></body></html>"""
    out = os.path.join(HERE, OUT_HTML)
    open(out, "w", encoding="utf-8").write(html)
    print(out, f"{len(html) / 1024:.0f} KB", "(with sound)" if WITH_SOUND else "(picture only)")
    for bad in ("http://", "https://"):
        n = sum(1 for f in VIS if bad in read(f).split("*/", 1)[-1])
        if n: print("WARNING: a source mentions", bad, "- check nothing loads from the internet")

if __name__ == "__main__":
    main()
