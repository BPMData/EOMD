/* Sound + session-timer controls + wake lock for living-poster players.
   Needs in scope before it: Q (URLSearchParams), tm {on,start,dur,done,doneAt}, and the #snd #vol #tmr #tmin elements.
   Needs SSRM (ssr-music.js) loaded in <script id="audiolib"> so it can also start a Web Worker from that text. */
/* ---------- sound: generative, streamed in ~29 s sections; independent of the 80 s visual loop ---------- */
const snd={ctx:null,gain:null,started:false,playing:false,muted:false,vol:.7,seed:(+Q.get('seed'))||((Date.now()/1000)|0),next:0,nextT:0,ready:new Map(),pending:new Set(),mode:'none',worker:null,mq:[],job:null,pumping:false,firstAt:0};
window.SND=snd;
const sb=document.getElementById('snd'),vs=document.getElementById('vol');
function useMain(){if(snd.mode==='main')return;snd.mode='main';if(snd.worker){snd.worker.terminate();snd.worker=null}for(const i of snd.pending)snd.mq.push(i);pump()}
function setupRenderer(){
 if(!Q.has('noworker')){try{
  const src=document.getElementById('audiolib').textContent+'\nself.onmessage=e=>{const d=e.data;const s=SSRM.run(d);self.postMessage({index:d.index,L:s.L,R:s.R},[s.L.buffer,s.R.buffer])};self.postMessage({hello:1});';
  const w=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));snd.worker=w;
  w.onmessage=e=>{if(e.data.hello){snd.mode='worker';for(const i of snd.pending)w.postMessage({sr:48000,seed:snd.seed,index:i});return}got(e.data)};
  w.onerror=()=>{if(snd.mode!=='worker')useMain()};
  setTimeout(()=>{if(snd.mode==='none')useMain()},3000);return}catch(e){}}
 useMain()}
function request(i){if(snd.ready.has(i)||snd.pending.has(i))return;snd.pending.add(i);
 if(snd.mode==='worker')snd.worker.postMessage({sr:48000,seed:snd.seed,index:i});else if(snd.mode==='main'){snd.mq.push(i);pump()}}
// main-thread fallback: render in ~6 ms slices so the visuals keep running
function pump(){if(snd.pumping)return;snd.pumping=true;const step=()=>{
 if(!snd.job&&snd.mq.length){const i=snd.mq.shift();snd.job={i,g:SSRM.section({sr:48000,seed:snd.seed,index:i})}}
 if(!snd.job){snd.pumping=false;return}
 const end=performance.now()+6;while(performance.now()<end){const x=snd.job.g.next();if(x.done){const v=x.value;snd.job=null;got({index:v.index,L:v.L,R:v.R});break}}
 setTimeout(step,10)};step()}
function got(d){snd.pending.delete(d.index);snd.ready.set(d.index,d);schedule()}
function target(){return snd.muted?0:snd.vol*snd.vol}
function schedule(){if(!snd.started)return;const c=snd.ctx,len=SSRM.sectionLen();
 while(snd.ready.has(snd.next)&&snd.nextT<c.currentTime+40){const d=snd.ready.get(snd.next);snd.ready.delete(snd.next);
  const b=c.createBuffer(2,d.L.length,48000);b.getChannelData(0).set(d.L);b.getChannelData(1).set(d.R);
  const s=c.createBufferSource();s.buffer=b;s.connect(snd.gain);const at=Math.max(snd.nextT,c.currentTime+.05);s.start(at);
  if(!snd.playing){snd.playing=true;snd.firstAt=at;const g=snd.gain.gain;g.setValueAtTime(0,at);g.linearRampToValueAtTime(target(),at+4);sb.textContent='Mute'}
  snd.nextT=at+len;snd.next++}
 for(let k=snd.next;k<snd.next+2;k++)request(k)}
function setGain(){if(!snd.playing)return;const g=snd.gain.gain,now=snd.ctx.currentTime;g.cancelScheduledValues(now);g.setTargetAtTime(target(),now,.12)}
async function soundButton(){
 if(!snd.started){const AC=window.AudioContext||window.webkitAudioContext;if(!AC){sb.textContent='No sound here';return}
  snd.ctx=new AC();snd.gain=snd.ctx.createGain();snd.gain.gain.value=0;snd.gain.connect(snd.ctx.destination);
  try{await snd.ctx.resume()}catch(e){}
  snd.started=true;snd.nextT=snd.ctx.currentTime+.1;if(!snd.playing)sb.textContent='Preparing sound…';
  if(snd.mode==='none'&&!snd.worker)setupRenderer();request(0);request(1);schedule();return}
 if(!snd.playing)return;snd.muted=!snd.muted;sb.textContent=snd.muted?'Unmute':'Mute';setGain()}
sb.onclick=soundButton;
vs.oninput=()=>{snd.vol=vs.value/100;setGain()};
addEventListener('keydown',e=>{if(e.key==='m'||e.key==='M')soundButton()});
setInterval(schedule,1000);
// start rendering the first section in the background so "Start sound" is quick
setTimeout(()=>{setupRenderer();request(0)},1500);
/* ---------- session timer controls ---------- */
const tb=document.getElementById('tmr'),ts=document.getElementById('tmin');
if(Q.get('min')){const m=String(Math.max(1,Math.min(120,+Q.get('min')||20)));if(![...ts.options].some(o=>o.value===m))ts.add(new Option(m,m));ts.value=m}
function chimeCtx(){if(snd.ctx)return snd.ctx;if(!snd.cctx){const AC=window.AudioContext||window.webkitAudioContext;if(AC)snd.cctx=new AC()}return snd.cctx}
// one soft two-note chime (A4 then F5, sine + faint octave, lowpassed); plays even if the music is muted
function chime(){const c=chimeCtx();if(!c)return;if(c.resume)c.resume();const t=c.currentTime+.05,lvl=.16*Math.max(.4,snd.vol);
 [[69,0],[77,.9]].forEach(([m,dt])=>{const f=440*Math.pow(2,(m-69)/12);for(const [mul,a] of [[1,1],[2,.12]]){const o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2500;o.frequency.value=f*mul;
  g.gain.setValueAtTime(0,t+dt);g.gain.linearRampToValueAtTime(lvl*a,t+dt+.03);g.gain.exponentialRampToValueAtTime(.0001,t+dt+3.2);o.connect(lp);lp.connect(g);g.connect(c.destination);o.start(t+dt);o.stop(t+dt+3.3)}})}
function timerButton(){if(tm.on){tm.on=false;tm.done=false;tb.textContent='Start timer';ts.disabled=false;return}
 tm.dur=(+ts.value||20)*60;tm.start=Date.now();tm.on=true;tm.done=false;tb.textContent='Reset timer';ts.disabled=true;const c=chimeCtx();if(c&&c.resume)c.resume()}
tb.onclick=timerButton;addEventListener('keydown',e=>{if(e.key==='t'||e.key==='T')timerButton()});
// a clicked button drops focus, so a later Enter or Space can't press it again (a refocused "Reset timer" would switch the timer off; Bryan, Oct 9)
document.querySelectorAll('#ui button').forEach(b=>b.addEventListener('click',()=>b.blur()));
window.TM=tm;
/* keep the board awake where supported */
let lock=null;async function wake(){try{if('wakeLock' in navigator&&!lock){lock=await navigator.wakeLock.request('screen');lock.addEventListener('release',()=>{lock=null})}}catch(e){}}
wake();addEventListener('pointerdown',wake);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')wake()});
