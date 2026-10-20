// Builds dist/player.html: ONE self-contained kiosk file (scripts, font, audio synth inlined).
// Usage: node tools/build-player.js   (re-run after editing config.js or any src file)
const fs = require('fs'), path = require('path'); const R = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const vis = ['config.js','src/core/core.js','src/core/fontdata.js','src/draw/draw.js','src/draw/icons.js','src/scenes/common.js','src/scenes/hub.js','src/scenes/motifs.js','src/scenes/academy.js','src/scenes/exploration.js','src/film.js','src/player/runtime.js'];
const aud = ['config.js','src/audio/dsp.js','src/audio/music.js','src/audio/sfx.js','src/audio/master.js'];
const esc = (s) => s.replace(/<\/script/gi, '<\\/script');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Academies of Danbury High School</title>
<style>html,body{margin:0;height:100%;background:#0033A0;overflow:hidden}body{display:flex;align-items:center;justify-content:center}
canvas{max-width:100vw;max-height:100vh;width:auto;height:auto;display:block}body.idle{cursor:none}
#bar{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);display:flex;gap:10px;align-items:center;background:rgba(10,22,51,.82);color:#fff;font:600 16px system-ui,sans-serif;padding:10px 14px;border-radius:12px;transition:opacity .4s}
body.idle #bar{opacity:0;pointer-events:none}#bar button{background:#fff;color:#0A1633;border:0;border-radius:8px;padding:8px 14px;font:inherit;cursor:pointer}</style></head>
<body><canvas id="c"></canvas><div id="bar"><button id="pp">Pause</button><button id="mu">Sound on</button><button id="fs">Fullscreen</button><span id="st"></span></div>
<script type="text/plain" id="dhs-audio-src">${esc(aud.map(R).join('\n;\n'))}</script>
${vis.map((f) => `<script>${esc(R(f))}</script>`).join('\n')}
<script>
(async()=>{const q=new URLSearchParams(location.search),$=(i)=>document.getElementById(i);
await DHS.type.load();DHS.film.build();
const P=DHS.runtime.create($('c'),{orientation:q.get('orient')||'auto',fps:+(q.get('fps')||30),maxScale:+(q.get('scale')||1),muted:q.get('mute')==='1'});
P.onStatus(s=>{window.__dhsStatus=s;$('st').textContent={synth:'Preparing sound…',blocked:'Click for sound',playing:''}[s]??'';});
P.start();P.enableAudio();
const gesture=()=>{if(!P.st.muted)P.enableAudio();};addEventListener('pointerdown',gesture);addEventListener('keydown',gesture);
let idle;const wake=()=>{document.body.classList.remove('idle');clearTimeout(idle);idle=setTimeout(()=>document.body.classList.add('idle'),2500);};
document.body.classList.add('idle');addEventListener('mousemove',wake);
$('pp').onclick=()=>{P.toggle();$('pp').textContent=P.st.playing?'Pause':'Play';};
$('mu').onclick=()=>{P.mute();$('mu').textContent=P.st.muted?'Sound on':'Sound off';};
$('fs').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
addEventListener('dblclick',()=>$('fs').onclick());addEventListener('keydown',e=>{if(e.key==='f')$('fs').onclick();if(e.code==='Space'){e.preventDefault();$('pp').onclick();}});
window.__dhs=P;})();
</script></body></html>`;
fs.writeFileSync(path.join(__dirname, '..', 'dist', 'player.html'), html);
console.log('dist/player.html', (html.length / 1024).toFixed(0) + ' KB');
