// Builds dist/study.html: 20-min generative study loop (streams live + "Download WAV").
// Usage: node tools/build-study.js
const fs = require('fs'), path = require('path'); const R = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const esc = (s) => s.replace(/<\/script/gi, '<\\/script');
const vis = ['config.js','src/core/core.js','src/core/fontdata.js','src/draw/draw.js','src/draw/icons.js','src/scenes/common.js','src/scenes/hub.js','src/audio/dsp.js','src/audio/music.js','src/audio/longform.js'];
const aud = ['config.js','src/audio/dsp.js','src/audio/music.js','src/audio/longform.js'];
const worker = `
let S=null, idx=0;
self.onmessage=(e)=>{const d=e.data,LF=DHS.longform,n=LF.plan.length;
 if(d.cmd==='live'){S=LF.stream();idx=d.from||0;}
 if(d.cmd==='live'||d.cmd==='more'){const c=S.next(idx);self.postMessage({type:'chunk',idx,L:c.L,R:c.R},[c.L.buffer,c.R.buffer]);idx=(idx+1)%n;}
 if(d.cmd==='export'){const s=LF.stream();s.warm();for(let i=0;i<n;i++){const c=s.next(i),p=new Int16Array(c.L.length*2);
  for(let j=0;j<c.L.length;j++){p[2*j]=Math.round(Math.max(-1,Math.min(1,c.L[j]))*32767);p[2*j+1]=Math.round(Math.max(-1,Math.min(1,c.R[j]))*32767);}
  self.postMessage({type:'pcm',i,total:n,pcm:p},[p.buffer]);}self.postMessage({type:'done',stats:s.stats()});}};`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sanctioned Corporate Calm: Hatters Study Loop</title>
<style>html,body{margin:0;height:100%;background:#0033A0;overflow:hidden;font:600 16px system-ui,sans-serif;color:#fff}
body{display:flex;align-items:center;justify-content:center}canvas{max-width:100vw;max-height:100vh;display:block}body.idle{cursor:none}
#bar{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);display:flex;gap:10px;align-items:center;background:rgba(10,22,51,.85);padding:10px 14px;border-radius:12px;transition:opacity .4s}
body.idle #bar{opacity:0;pointer-events:none}button{background:#fff;color:#0A1633;border:0;border-radius:8px;padding:8px 14px;font:inherit;cursor:pointer}
#now{position:fixed;left:24px;top:22px;display:none;align-items:center;gap:10px;background:rgba(10,22,51,.6);padding:8px 14px;border-radius:999px}
#dot{width:14px;height:14px;border-radius:50%}#go{position:fixed;font-size:26px;padding:18px 34px;border-radius:14px}</style></head>
<body><canvas id="c" width="1920" height="1080"></canvas>
<button id="go">▶ Start the loop</button>
<div id="now"><span id="dot"></span><span id="np"></span></div>
<div id="bar"><button id="pp">Pause</button><button id="nx">Next round</button><button id="dl">Download 20-min WAV</button><span id="st"></span></div>
<script type="text/plain" id="wsrc">${esc(aud.map(R).join('\n;\n') + worker)}</script>
${vis.map((f) => `<script>${esc(R(f))}</script>`).join('\n')}
<script>
(async()=>{const $=(i)=>document.getElementById(i),q=new URLSearchParams(location.search),LF=DHS.longform,A=DHS.config.academies,TAU=Math.PI*2;
await DHS.type.load();
// ---- visual: 120 s seamless loop (spiral slowly unwinds into the hub and winds back)
const H=DHS.hub,S=DHS.common,E=DHS.ease,inv=DHS.math.inv,g=H.geom(1920,1080);
DHS.film={length:120,render(ctx,t,W=1920,Hh=1080,s=1){t=DHS.math.mod(t,120);ctx.setTransform(s,0,0,s,0,0);
 ctx.fillStyle='#0033A0';ctx.fillRect(0,0,W,Hh);S.wash(ctx,W,Hh,'#0033A0',g.cx,g.cy);H.backdrop(ctx,g,t*9.75/22,W,Hh);
 const u=E.inOutCubic(0.5-0.5*Math.cos(TAU*t/120)),st={rot:-0.35+TAU*t/120,u,grow:1,hub:1,disk:1,circ:[],hex:[]};
 for(let i=0;i<A.length;i++){st.circ[i]=inv(0.82+i*0.02,0.95+i*0.005,u);st.hex[i]=inv(0.93,1,u);}
 const b=1+0.012*Math.sin(TAU*t/10);ctx.save();ctx.translate(g.cx,g.cy);ctx.scale(b,b);ctx.translate(-g.cx,-g.cy);H.draw(ctx,g,st);ctx.restore();
 S.stack(ctx,{x:1010,y:540,maxW:820,lead:'Hatters Study Loop',leadSize:40,lines:['Sanctioned','Corporate Calm'],maxSize:130,
  sub:['20 minutes of music built from the','academy themes.'],subSize:38,color:'#fff',anchor:'center',tIn:0},50);}};
const cv=$('c'),cx=cv.getContext('2d',{alpha:false});let last=0;
const frame=(n)=>{requestAnimationFrame(frame);if(n-last<30)return;last=n;DHS.film.render(cx,ac?ac.currentTime:n/1000);};
// ---- live streaming audio: chunks scheduled back-to-back at 48 kHz (no resampling → no seams)
let ac=null,gain,w=null,nextT=0,pending=false,sched=[];
const mkW=()=>new Worker(URL.createObjectURL(new Blob([$('wsrc').textContent],{type:'text/javascript'})));
const startLive=(from=0)=>{if(w)w.terminate();sched.forEach(x=>{try{x.src.stop()}catch(e){}});sched=[];nextT=0;pending=true;
 w=mkW();w.onmessage=(e)=>{const d=e.data;if(d.type!=='chunk')return;const b=ac.createBuffer(2,d.L.length,48000);b.copyToChannel(d.L,0);b.copyToChannel(d.R,1);
  const s=ac.createBufferSource();s.buffer=b;s.connect(gain);if(!nextT)nextT=ac.currentTime+0.15;s.start(nextT);sched.push({t:nextT,idx:d.idx,src:s});nextT+=b.duration;pending=false;
  sched=sched.filter(x=>x.t+30>ac.currentTime);};w.postMessage({cmd:'live',from});$('st').textContent='';};
setInterval(()=>{if(!ac)return;if(w&&!pending&&nextT-ac.currentTime<30){pending=true;w.postMessage({cmd:'more'});}
 const cur=[...sched].reverse().find(x=>x.t<=ac.currentTime);if(cur){const p=LF.plan[cur.idx],el=p.t0+(ac.currentTime-cur.t),mm=(x)=>Math.floor(x/60)+':'+String(Math.floor(x%60)).padStart(2,'0');
  $('now').style.display='flex';$('dot').style.background=p.mov.color;$('np').textContent=p.label+'   '+mm(el)+' / 20:00';}},250);
$('go').onclick=async()=>{$('go').remove();ac=new AudioContext({sampleRate:48000,latencyHint:'playback'});gain=ac.createGain();gain.connect(ac.destination);await ac.resume();startLive(0);};
$('pp').onclick=()=>{if(!ac)return;ac.state==='running'?(ac.suspend(),$('pp').textContent='Play'):(ac.resume(),$('pp').textContent='Pause');};
$('nx').onclick=()=>{if(!ac)return;const cur=[...sched].reverse().find(x=>x.t<=ac.currentTime),r=cur?LF.plan[cur.idx].round:-1,nx=LF.plan.findIndex(p=>p.round>r&&p.mov.id!=='drift');startLive(nx<0?0:nx);};
// ---- export: full 20:00 WAV, rendered in chunks (end flows into start)
$('dl').onclick=()=>{$('dl').disabled=true;const N=LF.samples,h=new DataView(new ArrayBuffer(44)),ws=(o,s)=>[...s].forEach((c,i)=>h.setUint8(o+i,c.charCodeAt(0)));
 ws(0,'RIFF');h.setUint32(4,36+N*4,true);ws(8,'WAVEfmt ');h.setUint32(16,16,true);h.setUint16(20,1,true);h.setUint16(22,2,true);h.setUint32(24,48000,true);h.setUint32(28,192000,true);h.setUint16(32,4,true);h.setUint16(34,16,true);ws(36,'data');h.setUint32(40,N*4,true);
 const parts=[h.buffer],x=mkW();x.onmessage=(e)=>{const d=e.data;if(d.type==='pcm'){parts.push(d.pcm.buffer);$('st').textContent='Rendering WAV… '+Math.round(100*(d.i+1)/d.total)+'%';}
  if(d.type==='done'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(parts,{type:'audio/wav'}));a.download='sanctioned-corporate-calm-20min.wav';document.body.append(a);a.click();
   $('st').textContent='WAV saved ('+d.stats.lufs+' LUFS)';$('dl').disabled=false;x.terminate();window.__exportDone=true;}};x.postMessage({cmd:'export'});};
let idle;addEventListener('mousemove',()=>{document.body.classList.remove('idle');clearTimeout(idle);idle=setTimeout(()=>document.body.classList.add('idle'),2500);});
document.body.classList.add('idle');addEventListener('dblclick',()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen());
requestAnimationFrame(frame);window.__st=()=>({state:ac&&ac.state,t:ac&&ac.currentTime,n:sched.length,nextT,pending});window.__ready=true;})();
</script></body></html>`;
fs.writeFileSync(path.join(__dirname, '..', 'dist', 'study.html'), html); console.log('dist/study.html', (html.length / 1024).toFixed(0) + ' KB');
