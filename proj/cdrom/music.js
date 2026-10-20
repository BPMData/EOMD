/* proj/cdrom/music.js: STAGE 4 sound block of the CD-ROM player (Oct 9: the 14 MUSIC_PATCHES are folded in; Overclock added).
   tools/build_cdrom.py swaps this file in for the Stage 2a sound code in proj/cdrom/player-src.html (everything between the
   "sound:" comment and the "session timer" comment), so edit the music here, not there.
   Needs in scope: Q, POP, SPEECH, DIS, CUR/NXT (read at click time), ORDER, LOCK, rng(), and the #snd #vol #mus buttons.
   The audio library (<script id="audiolib">) supplies MUSIC, CHIPS and CDM_SCORES {fm, tia, beep, snes, arcade, lounge,
   lc_<chip> (Lounge (Chipped), derived at build), overclock}.
   Music modes (the Music button / L cycles them; ?music=overclock|chips|lounge|chipped):
     Overclock (default) -> Chips -> Lounge -> Lounge (Chipped).
   How it works:
   - The grid: sections are 8 bars. GRID is a list of segments {t, i, bpm, len}: section i starts at seg.t + (i - seg.i)*seg.len
     on the audio clock. Chips and Lounge run at 116 BPM; Overclock at its own tempo. A mode change, an Overclock tempo or key
     change, or Overclock's restart after the Contour intro adds a segment at a section boundary (addSeg).
   - Chips: each channel has an era chip (CH). All five chips play the SAME composition (one session seed), so a channel
     dissolve is the same tune re-voiced: the new chip's section is scheduled on the grid and the two streams crossfade
     (equal power, DIS seconds) starting on a bar line. The visual dissolve starts on that bar line too (MUS.want / MUS.poll).
     The Contour Desk airship passage exists only on the snes chip, so a crossfade that would touch it waits for a section boundary.
   - Overclock (Oct 9): Track 2 on the channel's chip (stream key oc_<chip>@<bpm>/<tr>), clear sampler on Contour Desk. Channel
     dissolves work as in Chips. Entering Overclock starts it at its head; a tempo/key change (menu next to the Music button,
     or ?bpm= / ?tr=) crossfades at the next section boundary and keeps the place in the tune. On Contour Desk the Their Finest
     Duds intro plays first, then Overclock restarts at its head right where the intro ends.
   - Lounge: the Music button crossfades (1.5 s) at the next section boundary to Encyclopedia Lounge, which restarts at its head
     and then plays on every channel. Dud speech in Lounge is the soft WebAudio blip voice from Stage 2a. Lounge (Chipped) plays
     Lounge's notes on each channel's chip; Lounge <-> Lounge (Chipped) keeps the place in the tune.
   - Chip speech: the chip's own render voices it (voice stealing / ducking exactly as approved in Stage 3c). That is baked into the
     section, so prepCard() picks a start time a few seconds ahead, re-renders the one or two sections it touches with {speech} and
     splices them in (30 ms crossfade; the music before the first blip is identical). cardGo() releases the card when the audio
     clock reaches that time.
   - Rendering: Web Worker (blob) with a main-thread fallback in 6 ms slices. Section 0 is prefetched 1.5 s after load.
   Knobs: CH (channel -> chip), AHEAD (s of music kept scheduled), lead() (how far ahead a card's speech is lined up),
   TR_MENU (keys offered in the Overclock menu; tempos come from the score's bpms). Debug: MUS.info(). */
/* ================= sound: chip streams per channel, Overclock/Chips/Lounge modes, chip-voiced Dud speech ================= */
const snd={ctx:null,cctx:null,started:false,muted:false,vol:.7,seed:(+Q.get('seed'))||((Date.now()/1000)|0)};window.SND=snd;
const sb=document.getElementById('snd'),vs=document.getElementById('vol'),mb=document.getElementById('mus');
const mf=m=>440*Math.pow(2,(m-69)/12);
const MUS=(()=>{
const SC=globalThis.CDM_SCORES||{},CH={desk:'snes',maze:'fm',stars:'arcade',dos:'beep',ascii:'tia'},SR=48000,AHEAD=34;
const sc0=SC.snes||SC.fm||{bpm:116,bars:8},AIR=(SC.snes&&SC.snes.airship)||0,OC=SC.overclock||null,TR_MENU=[2,1,0,-1,-2,-3,-4,-5,-6];
let pdir=1,ctx=null,bus=null,skin=null,playing=false,began=false,mode={overclock:'overclock',chips:'chips',lounge:'lounge',chipped:'chipped'}[Q.get('music')]||(OC?'overclock':'chips'),active=null,chan='desk',pend=null,mp=null,plan=null,fadeEnd=0,tmr=0,INT=null,introRaw=null,introBuf=null,introReq=false;
const INTRO_ON=!Q.has('nointro'),ILEN=24*60/123;
const S={},raw=new Map();
// the grid: segments {t, i, bpm, len} (see the header); idx(t) = section at time t, secT(i) = start time of section i
const segOf=sc=>({bpm:sc.bpm,len:sc.bars*4*60/sc.bpm});
let GRID=[{t:0,i:0,...segOf(sc0)}];
const segT=t=>{let g=GRID[0];for(const s of GRID)if(s.t<=t+1e-6)g=s;return g},segI=i=>{let g=GRID[0];for(const s of GRID)if(s.i<=i)g=s;return g};
const idx=t=>{const g=segT(t),n=GRID[GRID.indexOf(g)+1];let i=g.i+Math.floor((t-g.t)/g.len+1e-9);if(n&&i>=n.i)i=n.i-1;return i};
const secT=i=>{const g=segI(i);return g.t+(i-g.i)*g.len};
// next grid line at or after t: k = 'sec' (section), 'bar', or 'step' (32nd note); a later segment's start is a line of every kind
const ceilG=(t,k)=>{const g=segT(t),n=GRID[GRID.indexOf(g)+1],u=k==='sec'?g.len:k==='bar'?g.len/8:60/g.bpm/8,r=g.t+Math.ceil((t-g.t)/u-1e-6)*u;return n&&r>n.t?n.t:r};
const ceil32=t=>ceilG(t,'step'),barLen=t=>segT(t).len/8;
function addSeg(t,i,sc){GRID=GRID.filter(s=>s.t<t-1e-6&&s.i<i);GRID.push({t,i,...segOf(sc)})}
// streams: chips 'fm' 'tia' 'beep' 'snes' 'arcade'; 'lounge'; Lounge (Chipped) 'lc_<chip>'; Overclock 'oc_<chip>@<bpm>/<tr>'
let OCS={bpm:142.5,tr:-3};   // Overclock tempo + transpose in effect (set from the score and ?bpm= / ?tr= below)
const isL=k=>k==='lounge'||k.slice(0,3)==='lc_',isOC=k=>k.slice(0,3)==='oc_',ocKey=(chip,o)=>'oc_'+chip+'@'+o.bpm+'/'+o.tr;
const keyFor=(m,c,o=OCS)=>m==='lounge'?'lounge':m==='chipped'?'lc_'+(CH[c]||'snes'):m==='overclock'?ocKey(CH[c]||'snes',o):(CH[c]||'snes');
const MLAB={overclock:'Overclock',chips:'Chips',lounge:'Lounge',chipped:'Lounge (Chipped)'};
const SCC=new Map();   // score per stream key (Overclock scores are made on demand from the overclock score)
function scOf(k){if(!k||k==='overclock')return null;if(SC[k])return SC[k];if(!OC||!isOC(k))return null;let s=SCC.get(k);
 if(!s){const [chip,r]=k.slice(3).split('@'),[b,tr]=r.split('/').map(Number);s={...OC,chip,bpm:b,tr,...(Q.has('plain')?{vary:0}:{})};SCC.set(k,s)}return s}   // ?plain = the bare A+B loop (no variations/energy)
let lbase=0,obase=0;const loc=(k,i)=>isL(k)?i-lbase:isOC(k)?i-obase:i;
const now=()=>ctx?ctx.currentTime:0;
const label=()=>{const m=mp?mp.m:mode;mb.textContent='Music: '+MLAB[m];
 if(ocUI){const o=(mp&&mp.oc)||OCS;ocUI.box.style.display=m==='overclock'?'flex':'none';ocUI.b.value=String(o.bpm);ocUI.t.value=String(o.tr)}};

/* ---------- Overclock tempo + key menu (Oct 9): shown in Overclock only; a change lands at the next section boundary ---------- */
const NOTES=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'],qnum=(k,d,lo,hi)=>{const x=parseFloat(Q.get(k));return isFinite(x)?Math.max(lo,Math.min(hi,x)):d};
if(OC)OCS={bpm:qnum('bpm',OC.bpm,60,220),tr:Math.round(qnum('tr',OC.tr||0,-12,12))};
const ocUI=(()=>{if(!OC||!mb||!mb.parentNode)return null;try{
 const box=document.createElement('span'),b=document.createElement('select'),t=document.createElement('select'),txt=s=>{const e=document.createElement('span');e.textContent=s;return e};
 box.style.cssText='display:none;align-items:center;gap:8px;padding:0 4px';b.setAttribute('aria-label','Overclock tempo');t.setAttribute('aria-label','Overclock key');
 for(const v of [...new Set([...(OC.bpms||[OC.bpm]),OCS.bpm])].sort((x,y)=>x-y))b.add(new Option(v+' BPM',String(v)));
 for(const v of [...new Set([...TR_MENU,OCS.tr])].sort((x,y)=>y-x))t.add(new Option(NOTES[(((4+v)%12)+12)%12]+' minor'+(v?' ('+(v>0?'+':'−')+Math.abs(v)+')':' (original)'),String(v)));
 b.onchange=t.onchange=()=>setOC({bpm:+b.value,tr:+t.value});
 box.append(txt('Tempo'),b,txt('Key'),t);mb.after(box);return{box,b,t}}catch(e){return null}})();
function setOC(o){if(!OC)return;const m=mp?mp.m:mode;if(!began||m!=='overclock'){OCS=o;label();return}
 if(mp){mp.oc=o;mp.tb=null}else mp={m:'overclock',oc:o};label()}
const target=()=>snd.muted?0:snd.vol*snd.vol;

/* ---------- Their Finest Duds intro (Oct 8): an original 8-bar motif by Bryan's friend, played on the 16-bit sampler ----------
   3/4, 123 BPM, G Lydian / B minor. Harp 16th runs (bars 1-8), saw drone cluster on B (bar 4), then the drop (bars 5-8):
   crash, timpani + bass G -> C# tritone, octave pulse with a stepwise decrescendo. Mapped to the sampler's own samples:
   harp = arp (harp), saw = lead2 (strings), bass = bass (slap when clear), timpani = tom, crash = crash, pulse = lead ('pulse';
   reed2 with chiff before Oct 9).
   Plays when Contour World starts in Chips mode (the regular snes stream fades in on the next bar line after bar 8) and in
   Overclock mode (Oct 9: Overclock restarts at its head right after bar 8; the drop's C# is Overclock's key at -3 st).
   Knobs: INTRO_DB (level vs the chip music), ?nointro turns it off. */
function* cdmIntro(sr){const b=60/123,B3=3*b,T=(bar,beat)=>(bar-1)*B3+(beat-1)*b,V=x=>x/127,ev=[],INTRO_DB=0,INTRO_BRIGHT_DB=2.9;   // INTRO_BRIGHT_DB: keeps the bright version as loud as the approved Oct 8 one
 const UP=[55,59,61,62,67,71,73,74,79,83,85,86],DN=[91,86,85,83,79,74,73,71,67,62,61,59];   // G3 B3 C#4 D4 G4 ... D6 | G6 D6 C#6 ... B3
 for(let bar=1;bar<=8;bar++)(bar%2?UP:DN).forEach((m,j)=>ev.push({t:T(bar,1+j*0.25),part:'arp',m,d:0.25*b,v:V(100)}));
 for(const m of [47,71])ev.push({t:T(4,1),part:'lead2',m,d:3*b,v:V(100)});                       // saw B2 + B4, held, cut at bar 5
 for(let k=0;k<2;k++)ev.push({t:T(4,1),part:'bass',m:47,d:3*b,v:V(100)});                        // acoustic + synth bass B2
 ev.push({t:T(5,1),part:'crash',m:0,d:0,v:V(100)});
 for(const bar of [5,6,7,8]){const four=bar%2===1,hits=four?[1,1.38,1.75,2.12]:[1,1.38],res=four?2.5:1.75;
  for(const bt of hits)ev.push({t:T(bar,bt),part:'tom',m:55,d:0.3*b,v:V(100)},{t:T(bar,bt),part:'bass',m:43,d:0.3*b,v:V(100)});
  ev.push({t:T(bar,res),part:'tom',m:49,d:0.75*b,v:V(110)},{t:T(bar,res),part:'bass',m:37,d:0.75*b,v:V(110)});
  const vel=V([100,80,60,40][bar-5]);[1,1.38,1.75,2.12,2.5,2.88,3.25,3.62].forEach((bt,j)=>ev.push({t:T(bar,bt),part:'lead',m:[43,55,43,31,67,55,43,31][j]+12,d:0.3*b,v:vel}))}   // +12: the reed2 sample sounds an octave down
 ev.sort((x,y)=>x.t-y.t);const P=DHS.dsp,ch=CHIPS.snes,N=Math.round((8*B3+2.6)*sr);
 // Oct 9 (Bryan: the drop bars sounded underwater): clear sampler (light echo, pre-emphasis, slap bass, 16 kHz EQ) and a bright
 // low 'pulse' sample for the octave pulse, when audio/chips.js has them (tools__patch_oct9b.py); otherwise the Oct 8 sound
 const cl=!!ch.postClear,pul=!!(ch.leads&&ch.leads.includes('pulse')),pe=(cl&&ch.postClear)||ch.post;
 const mono=yield* ch.render(ev,N,sr,123,{lead:pul?'pulse':'reed2',clear:cl?1:0});
 const hp=P.rbjHighpass(pe.hp,0.7,sr),lp=P.svf(),g=P.db(((CDM_SCORES.snes&&CDM_SCORES.snes.master_db)||0)+INTRO_DB+(cl?(pul?INTRO_BRIGHT_DB:3.8):0)),L=new Float32Array(N);
 for(let j=0;j<N;j++)L[j]=g*lp(hp(mono[j]),pe.lp,0.7,sr);const f=Math.round(0.005*sr);for(let j=0;j<f;j++){L[j]*=j/f;L[N-1-j]*=j/f}
 return{L,R:Float32Array.from(L),len:8*B3}}

/* ---------- renderer: Web Worker with a main-thread fallback (blob workers can be blocked) ---------- */
// a job carries its score (Overclock scores are made per tempo/key), so the worker needs no lookup
const jobs=[];let wk=null,rmode='none',busy=null,mjob=null,pumping=false,seq=0,avg=2.2,setupDone=false;
function submit(key,index,speech,urgent,cb){const nm=key+'|'+index+(speech?'|'+JSON.stringify(speech):'');   // the same render asked twice: one job, every callback runs
 const ex=jobs.find(j=>j.nm===nm)||(busy&&busy.nm===nm?busy:null);if(ex){if(cb)ex.cbs.push(cb);if(urgent&&ex!==busy){jobs.splice(jobs.indexOf(ex),1);jobs.unshift(ex)}return}
 const j={id:++seq,nm,key,index,speech,cbs:cb?[cb]:[],t0:0};urgent?jobs.unshift(j):jobs.push(j);kick()}
function setup(){if(setupDone)return;setupDone=true;
 if(!Q.has('noworker')){try{const lib=document.getElementById('audiolib').textContent;
  const src=lib+'\n'+cdmIntro.toString()+'\nself.onmessage=e=>{const d=e.data,s=d.key==="intro"?(()=>{const g=cdmIntro(48000);let x;while(!(x=g.next()).done);return x.value})():MUSIC.run(d.sc,{sr:48000,seed:d.seed,index:d.index,speech:d.speech});self.postMessage({id:d.id,L:s.L,R:s.R},[s.L.buffer,s.R.buffer])};self.postMessage({hello:1});';
  wk=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
  wk.onmessage=e=>{const d=e.data;if(d.hello){rmode='worker';kick();return}fin(d.id,d.L,d.R)};
  wk.onerror=()=>{if(rmode!=='worker')toMain()};setTimeout(()=>{if(rmode==='none')toMain()},3000);return}catch(e){}}
 toMain()}
function toMain(){if(rmode==='main')return;rmode='main';if(wk){wk.terminate();wk=null}if(busy){jobs.unshift(busy);busy=null}kick()}
function kick(){if(busy||mjob)return;if(rmode==='none'){setup();return}if(!jobs.length)return;const j=jobs.shift();busy=j;j.t0=performance.now();
 if(rmode==='worker')wk.postMessage({id:j.id,key:j.key,sc:j.key==='intro'?null:scOf(j.key),index:j.index,seed:snd.seed,speech:j.speech});
 else{mjob=j.key==='intro'?cdmIntro(SR):MUSIC.section(scOf(j.key),{sr:SR,seed:snd.seed,index:j.index,speech:j.speech});pumpMain()}}
function pumpMain(){if(pumping)return;pumping=true;const step=()=>{if(!mjob){pumping=false;return}const end=performance.now()+6;
 while(performance.now()<end){const x=mjob.next();if(x.done){mjob=null;fin(busy.id,x.value.L,x.value.R);break}}setTimeout(step,10)};step()}
const busyJob=()=>!!(busy||mjob);
function fin(id,L,R){const j=busy;if(!j||j.id!==id)return;busy=null;avg=avg*.6+(performance.now()-j.t0)/1000*.4;for(const f of j.cbs)f(L,R);kick()}

/* ---------- streams: one gain node per stream key; sections sit on the grid ---------- */
// minI = first section a stream may play (set when it takes over, so a mode change never sounds the section before tb)
const toBuf=(L,R)=>{const b=ctx.createBuffer(2,L.length,SR);b.getChannelData(0).set(L);b.getChannelData(1).set(R);return b};
function mk(k){const g=ctx.createGain();g.gain.value=0;g.connect(bus);return S[k]={k,g,buf:new Map(),req:new Set(),srcs:new Map(),want:false,gen:0,minI:0,retireAt:0}}
const st=k=>S[k]||mk(k);
function need(k,i,urgent){const s=st(k),l=loc(k,i);if(l<0)return null;const b=s.buf.get(i);if(b)return b;
 const r=raw.get(k+'|'+l);if(r){raw.delete(k+'|'+l);const nb=toBuf(r[0],r[1]);s.buf.set(i,nb);return nb}
 const nm=''+l;if(!s.req.has(nm)){s.req.add(nm);const gen=s.gen;submit(k,l,null,urgent,(L,R)=>{if(gen===s.gen)s.buf.set(i,toBuf(L,R));s.req.delete(nm)})}
 else if(urgent)submit(k,l,null,true,null);return null}
function addSrc(s,i,b,at,when){const g=ctx.createGain(),src=ctx.createBufferSource();src.buffer=b;src.connect(g);g.connect(s.g);
 src.start(when,Math.max(0,when-at));const o={src,g,at};s.srcs.set(i,o);src.onended=()=>{try{g.disconnect()}catch(e){}if(s.srcs.get(i)===o)s.srcs.delete(i)};return o}
function retire(k){const s=S[k];if(!s||k===active)return;s.want=false;s.retireAt=0;s.minI=0;for(const o of s.srcs.values()){try{o.src.stop()}catch(e){}}s.srcs.clear();s.buf.clear();s.req.clear();s.gen++;s.g.gain.cancelScheduledValues(0);s.g.gain.value=0}
// take over stream k from section i (a stream that was fading out loses its old sources: they may sit on an old grid)
function take(k,i){const s=st(k);if(s.retireAt||!s.want){for(const o of s.srcs.values()){try{o.src.stop()}catch(e){}}s.srcs.clear()}s.want=true;s.retireAt=0;s.minI=i;return s}
const drop=f=>{for(const q in S)if(f(q)){const s=S[q];s.gen++;s.buf.clear();s.req.clear()}};   // forget rendered sections (the tune's position moved)
const deskKey=()=>keyFor(mode,'desk'),introFor=k=>INTRO_ON&&(mode==='chips'||mode==='overclock')&&k===deskKey();
function tick(){if(!ctx)return;const t=ctx.currentTime;
 if(began&&!playing){if(!need(active,0,true))return;const t0=t+.12;GRID=[{t:t0,i:0,...segOf(scOf(active))}];playing=true;
  if(introFor(active)){const ib=needIntro();if(ib)startIntro(null,t0,ib)}sb.textContent=snd.muted?'Unmute':'Mute';
  bus.gain.cancelScheduledValues(t);bus.gain.setValueAtTime(0,t);bus.gain.linearRampToValueAtTime(target(),t+2.5)}
 if(!playing)return;const i0=idx(t);while(GRID.length>1&&GRID[1].t<t-120)GRID.shift();
 for(const k in S){const s=S[k];if(s.retireAt&&t>=s.retireAt)retire(k);if(!s.want)continue;
  for(let i=Math.max(0,i0,s.minI);i<=idx(t+AHEAD);i++){if(s.srcs.has(i))continue;const at=secT(i);if(s.retireAt&&at>=s.retireAt)break;
   const b=need(k,i,i===i0);if(!b)continue;if(at+b.duration<t+.02)continue;addSrc(s,i,b,at,Math.max(at,t+.03))}
  for(const j of s.buf.keys())if(j<i0-1)s.buf.delete(j)}
 if(pend&&pend.late&&!(plan&&t<plan.end)&&t>=fadeEnd)go();
 const idle=!mp&&!pend&&!jobs.length&&!busyJob();
 if((mode==='chips'||mode==='overclock')&&idle&&INTRO_ON&&!introReq)needIntro();
 let nk=null;if(mode!=='lounge'){try{nk=keyFor(mode,ORDER[(ORDER.indexOf(chan)+pdir+ORDER.length)%ORDER.length])}catch(e){}}   // next (or previous) channel's stream, rendered ahead
 if(idle&&nk&&nk!==active&&scOf(nk)&&!(mode==='overclock'&&introFor(nk)&&(introBuf||introRaw))){const s=st(nk);if(!s.want){need(nk,i0,false)&&need(nk,i0+1,false);for(const j of s.buf.keys())if(j<i0-1)s.buf.delete(j)}}   // (Overclock restarts after the Contour intro: nothing to render ahead there)
 const keep=new Set([active,nk,pend&&pend.to,mp&&mp.to]);   // free the sections of streams nobody will play (old tempos, old modes)
 for(const k in S){const s=S[k];if(!s.want&&!s.retireAt&&!keep.has(k)&&(s.buf.size||s.req.size)){s.gen++;s.buf.clear();s.req.clear()}}
 stepMode()}
function needIntro(){if(introBuf)return introBuf;if(introRaw&&ctx){introBuf=toBuf(introRaw[0],introRaw[1]);introRaw=null;return introBuf}
 if(!introReq&&INTRO_ON){introReq=true;submit('intro',0,null,false,(L,R)=>{introRaw=[L,R]})}return null}
const curves=()=>{const up=new Float32Array(64),dn=new Float32Array(64);for(let i=0;i<64;i++){const p=i/63;up[i]=Math.sin(p*Math.PI/2);dn[i]=Math.cos(p*Math.PI/2)}return{up,dn}};
// the intro plays from tx. Chips: the snes stream stays silent under it and fades in over 2 bars from the first bar line after
// bar 8. Overclock (Oct 9): Overclock restarts at its head exactly where the intro ends (a new grid segment at tIn); the intro
// always plays to its end, even if the channel changes while it plays (the next chip then starts Overclock at tIn).
function startIntro(from,tx,ib){const t=ctx.currentTime,{up,dn}=curves(),k=deskKey(),s=st(k),gs=s.g.gain,oc=isOC(k);
 if(from&&from!==k){const ga=S[from].g.gain;ga.cancelScheduledValues(t);ga.setValueAtTime(1,t);ga.setValueCurveAtTime(dn,tx,1.5);S[from].retireAt=tx+1.8}
 const g=ctx.createGain(),src=ctx.createBufferSource();src.buffer=ib;src.connect(g);g.connect(bus);src.start(Math.max(tx,t+.02));
 let I;
 if(oc){const tIn=tx+ILEN,i=idx(tx)+1;addSeg(tIn,i,scOf(k));obase=i;drop(isOC);take(k,i);gs.cancelScheduledValues(t);gs.setValueAtTime(1,t);I={src,g,tIn,end:tIn,k,oc:1}}
 else{const tIn=ceilG(tx+ILEN-.02,'bar'),fd=2*barLen(tIn);gs.cancelScheduledValues(t);gs.setValueAtTime(0,t);gs.setValueCurveAtTime(up,tIn,fd);I={src,g,tIn,end:tIn+fd,fd,k}}
 INT=I;src.onended=()=>{try{g.disconnect()}catch(e){}if(INT===I)INT=null};
 s.want=true;s.retireAt=0;active=k}
const inIntro=()=>!!(INT&&ctx&&ctx.currentTime<INT.tIn);
function xfade(a,b,tx,dur){const {up,dn}=curves(),t=ctx.currentTime,ga=S[a].g.gain,gb=S[b].g.gain;
 if(INT&&!INT.oc&&a===INT.k&&t<INT.end){const I=INT,gi=I.g.gain;INT=null;gi.cancelScheduledValues(t);gi.setValueAtTime(1,t);gi.setValueAtTime(1,tx);gi.linearRampToValueAtTime(0,tx+dur);try{I.src.stop(tx+dur+.05)}catch(e){}
  const v=t<I.tIn?0:Math.min(1,Math.sin(Math.min(1,(t-I.tIn)/I.fd)*Math.PI/2));ga.cancelScheduledValues(t);ga.setValueAtTime(v,t);ga.setValueAtTime(v,tx);ga.linearRampToValueAtTime(0,tx+dur)}
 else{ga.cancelScheduledValues(t);ga.setValueAtTime(1,t);ga.setValueCurveAtTime(dn,tx,dur)}
 gb.cancelScheduledValues(t);gb.setValueAtTime(0,t);gb.setValueCurveAtTime(up,tx,dur);S[a].retireAt=tx+dur+.3}

/* ---------- start / volume / pause ---------- */
function start(key){const AC=window.AudioContext||window.webkitAudioContext;if(!AC||!globalThis.MUSIC||!SC.snes){sb.textContent='No sound here';return false}
 ctx=snd.ctx=new AC();bus=ctx.createGain();bus.gain.value=0;const lim=ctx.createDynamicsCompressor();lim.threshold.value=-6;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.002;lim.release.value=.12;bus.connect(lim);lim.connect(ctx.destination);
 const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=6000;lp.Q.value=.7;const dl=ctx.createDelay(1);dl.delayTime.value=.135;const fb=ctx.createGain();fb.gain.value=.28;const wet=ctx.createGain();wet.gain.value=.3;   // soft skin for the Lounge blips and the corner ding
 lp.connect(bus);lp.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(wet);wet.connect(bus);skin=lp;
 try{ctx.resume()}catch(e){}
 for(const k in SC)if(k!=='overclock')mk(k);lbase=0;obase=0;chan=key;active=keyFor(mode,key);if(!scOf(active)){mode='chips';active=CH[key]||'snes';label()}const s=st(active);s.want=true;s.g.gain.value=1;
 began=true;snd.started=true;sb.textContent='Preparing sound…';setup();need(active,0,true);clearInterval(tmr);tmr=setInterval(tick,400);return true}
function gain(){if(!bus)return;const g=bus.gain,t=ctx.currentTime;g.cancelScheduledValues(t);g.setTargetAtTime(target(),t,.12)}
function pause(p){if(!ctx)return;try{p?ctx.suspend():ctx.resume()}catch(e){}}
function prefetch(key){const k=keyFor(mode,key);if(!k||!scOf(k)||ctx)return;setup();submit(k,0,null,false,(L,R)=>{if(!ctx)raw.set(k+'|0',[L,R])});if(introFor(k))needIntro()}

/* ---------- channel switches: crossfade on a bar line ---------- */
function want(key){chan=key;if(!playing||mode==='lounge'||mp){pend=null;return}const to=keyFor(mode,key);if(!to||to===active){pend=null;return}pend={to,from:active,key,t0:performance.now()}}
const mism=(a,b,tx)=>{if(!AIR||(a!=='snes'&&b!=='snes'))return false;return idx(tx)%AIR===2||idx(tx+DIS)%AIR===2};
// go(): schedule the music crossfade (tx = next bar, or the next section boundary if the airship is involved; in Overclock,
// while the Contour intro plays, the moment Overclock restarts); null = not ready
function go(){const t=ctx.currentTime,{to,from,key}=pend;
 if(introFor(to)){const ib=needIntro();if(ib){const tx=ceilG(t+.3,'bar');pend=null;chan=key;startIntro(from,tx,ib);fadeEnd=tx+1.8;tick();return tx}}
 let tx=ceilG(t+.3,'bar');if(INT&&INT.oc&&tx<INT.tIn)tx=INT.tIn;for(let n=0;n<6&&mism(from,to,tx);n++)tx=secT(idx(tx)+1);
 const i=idx(tx),a=need(to,i,true),b=(tx+DIS>secT(i+1))?need(to,i+1,true):1;if(!a||!b)return null;
 pend=null;take(to,i);active=to;chan=key;xfade(from,to,tx,DIS);fadeEnd=tx+DIS+.3;tick();return tx}
// poll(): when the picture may dissolve. Oct 8 fix: the picture waits at most ~1 bar; a card more than 1.5 s from speaking is
// dropped (it shows without speech); the airship or a slow render only delays the MUSIC crossfade (pend.late), never the picture.
function poll(){if(!pend||pend.late)return{tx:now()};const t=ctx.currentTime;
 if(plan&&t<plan.end){if(t<plan.ts-1.5){cardCancel(plan);plan=null}else return null}
 if(t<fadeEnd)return null;
 const bar=ceilG(t+.3,'bar'),tx=go();if(tx!=null)return{tx:Math.min(tx,bar)};
 if(performance.now()-pend.t0>2500){pend.late=true;return{tx:t}}return null}
const cardBusy=()=>!!(playing&&plan&&ctx.currentTime<plan.end);   // auto switches wait for the card speech to finish

/* ---------- mode changes (and Overclock tempo/key changes): crossfade at the next section boundary ----------
   Entering Lounge or Overclock from another mode starts it at its head; Lounge <-> Lounge (Chipped) and a tempo/key change keep
   the place in the tune. A different tempo starts a new grid segment at that boundary. */
function setMode(m){if(m===(mp?mp.m:mode))return;if(!began){mode=m;label();return}mp={m};label()}
function stepMode(){if(!mp||pend||(plan&&ctx.currentTime<plan.end)||ctx.currentTime<fadeEnd)return;const t=ctx.currentTime,oc=mp.oc||OCS,to=keyFor(mp.m,chan,oc);mp.to=to;
 if(!scOf(to)){mp=null;label();return}
 if(to===active){mode=mp.m;OCS=oc;mp=null;label();return}
 const tb=ceilG(t+.4,'sec');if(mp.tb!==tb){mp.tb=tb;const ib=idx(tb);
  if(isL(to)&&!isL(active)){lbase=ib;drop(isL)}
  if(isOC(to)&&!isOC(active)){obase=ib;drop(isOC)}}
 const i=idx(tb);if(!need(to,i,true))return;
 const from=active,m=mp.m,sc=scOf(to);mp=null;mode=m;OCS=oc;if(Math.abs(segI(i).bpm-sc.bpm)>1e-9)addSeg(tb,i,sc);
 take(to,i);active=to;xfade(from,to,tb,1.5);fadeEnd=tb+1.8;label();tick()}

/* ---------- chip speech: line a card's three phrases up on the grid and splice the re-rendered sections ---------- */
const lead=()=>Math.min(10,Math.max(3,avg*3+.8));
function cardOK(){return !(playing&&(pend||mp||ctx.currentTime<fadeEnd||inIntro()))}
function prepCard(){if(!playing||mode==='lounge'||pend||mp||ctx.currentTime<fadeEnd||inIntro()||!scOf(active)||active==='lounge')return null;
 const ts=ceil32(ctx.currentTime+lead()),k=active,groups=new Map();
 for(let n=0;n<3;n++){const at=ceil32(ts+POP[n]),i=idx(at);if(!groups.has(i))groups.set(i,[]);groups.get(i).push({t:at-secT(i),d:SPEECH[n]})}
 for(const i of groups.keys())if(loc(k,i)<0||i<S[k].minI)return null;   // the stream doesn't play there yet
 const pr={left:groups.size,ready:false,dead:false},pl={ts,pr,end:ts+POP[2]+SPEECH[2]+.4};plan=pl;
 for(const [i,sp] of groups)submit(k,loc(k,i),sp,true,(L,R)=>{if(pr.dead||ctx.currentTime>ts-.12){pr.dead=true;return}splice(k,i,toBuf(L,R));if(--pr.left===0)pr.ready=true});   // too late to splice before the first blip: the card goes without chip speech
 return pl}
function splice(k,i,nb){const s=S[k],t=ctx.currentTime,at=secT(i),old=s.srcs.get(i),xf=.03;s.buf.set(i,nb);if(!old)return;
 const w=Math.max(t+.08,at);if(at>t+.05){old.g.gain.cancelScheduledValues(0);old.g.gain.setValueAtTime(0,t);try{old.src.stop(t)}catch(e){}s.srcs.delete(i);addSrc(s,i,nb,at,at);return}   // section not started yet: just swap it
 const n=addSrc(s,i,nb,at,w);n.g.gain.setValueAtTime(0,w);n.g.gain.linearRampToValueAtTime(1,w+xf);
 old.g.gain.setValueAtTime(1,w);old.g.gain.linearRampToValueAtTime(0,w+xf);try{old.src.stop(w+xf+.01)}catch(e){}}
// null = not yet; {stale:1} = the speaker wasn't ready in time, the phrases already played (caller re-plans); {lag} = show the card now
function cardGo(pl){const t=ctx.currentTime;if(pl.cut)return{lag:0};if(t>pl.ts+.35){pl.pr.dead=true;pl.end=t;return{stale:1}}
 if(pl.pr.ready)return t>=pl.ts-.02?{lag:Math.max(0,t-pl.ts)}:null;
 if(t>pl.ts-.12){pl.pr.dead=true;pl.end=t;return{lag:0}}return null}
function cardCancel(pl){pl.pr.dead=true;pl.cut=true;pl.end=now();if(plan===pl)plan=null}

/* ---------- Lounge speech (soft blips) and the corner ding, on the grid (32nd = STEP of the segment playing now) ---------- */
const SCALE=[0,2,4,7,9],VOICE={yellow:{oct:1,wave:'square',vol:.07},green:{oct:0,wave:'sawtooth',vol:.05},lilac:{oct:2,wave:'triangle',vol:.12},salmon:{oct:1,wave:'triangle',vol:.1},sickly:{oct:0,wave:'square',vol:.06}};
const STEPn=()=>60/segT(ctx.currentTime).bpm/8,grid=n=>{const g=segT(ctx.currentTime),st=60/g.bpm/8*n;return g.t+Math.ceil((ctx.currentTime+.03-g.t)/st)*st};
function blip(t,f,len,v,f2){const o=ctx.createOscillator(),g=ctx.createGain(),z=t+len;o.type=v.wave;o.frequency.setValueAtTime(f,t);o.frequency.linearRampToValueAtTime(f2||f,z);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v.vol,t+.004);g.gain.exponentialRampToValueAtTime(.001,z);o.connect(g);g.connect(skin);o.start(t);o.stop(z+.02)}
function speak(dur,v,seed){const r=rng(seed),root=60+12*v.oct,STEP=STEPn();let t=grid(1);const t0=t,end=t+dur;let deg=Math.floor(r()*5);
 while(t<end){const len=r()<.25?2:1;if(r()<.14){t+=STEP*len;continue}deg=Math.max(0,Math.min(9,deg+[-1,0,1,1,2,-2][Math.floor(r()*6)]));
  const d=(t-t0)/dur>.8?Math.max(0,deg-2):deg,f=mf(root+SCALE[d%5]+12*Math.floor(d/5));blip(t,f,STEP*len*.68,v,f*(1+(r()-.5)*.06));t+=STEP*len}}
const LOUNGE_SPK=1.4;function speakLounge(k,pal,seed){if(!playing||mode!=='lounge')return;const v=VOICE[pal]||VOICE.yellow;speak(SPEECH[k],{...v,vol:v.vol*LOUNGE_SPK},seed)}
function ding(){if(!playing)return;const t=grid(2),STEP=STEPn(),v={wave:'sine',vol:.09};blip(t,mf(79),.45,v);blip(t+STEP*4,mf(84),.6,v);blip(t,mf(91),.25,{wave:'triangle',vol:.025});blip(t+STEP*4,mf(96),.3,{wave:'triangle',vol:.025})}

label();
// where Overclock is now (pass type, energy, section): MUS.info().overclock.now
function ocNow(){if(!playing||!active||!isOC(active)||!MUSIC.overclockAt)return null;const t=ctx.currentTime,i=idx(t),l=loc(active,i);if(l<0)return null;
 try{return MUSIC.overclockAt(scOf(active),snd.seed,l*8+Math.max(0,Math.floor((t-secT(i))/barLen(t))))}catch(e){return null}}
const CYCLE=['overclock','chips','lounge','chipped'].filter(m=>m==='overclock'?!!OC:m==='chipped'?!!SC.lc_snes:true);   // the Music button's order
return{start,gain,pause,prefetch,want,dir:d=>{pdir=d<0?-1:1},poll,now,setMode,setOC,toggle:()=>{const c=mp?mp.m:mode;setMode(CYCLE[(CYCLE.indexOf(c)+1)%CYCLE.length])},cardOK,prepCard,cardGo,cardCancel,busy:cardBusy,speakLounge,ding,
 playing:()=>playing,info:()=>({mode:mp?mp.m:mode,active,playing,overclock:{...OCS,now:ocNow()},intro:INT&&ctx.currentTime<INT.end?'playing':introBuf||introRaw?'ready':introReq?'rendering':'none',
  section:playing?idx(ctx.currentTime):null,grid:GRID.map(g=>({t:+g.t.toFixed(2),i:g.i,bpm:g.bpm})),held:Object.keys(S).filter(k=>S[k].buf.size),render:rmode,avg:+avg.toFixed(2),queue:jobs.length})}})();
function speakCard(k){const d=CM.spk!=null&&(CUR.sim.find(CM.spk)||(NXT&&NXT.sim.find(CM.spk)));MUS.speakLounge(k,d?d.tr.pal:'yellow',(CM.card.id.charCodeAt(0)*31+k*7+3)|0)}
const ding=()=>MUS.ding();window.MUS=MUS;
function setGain(){MUS.gain()}
async function soundButton(){if(!snd.started){MUS.start((NXT||CUR).key);return}if(!MUS.playing())return;snd.muted=!snd.muted;sb.textContent=snd.muted?'Unmute':'Mute';setGain()}
sb.onclick=soundButton;vs.oninput=()=>{snd.vol=vs.value/100;setGain()};mb.onclick=()=>MUS.toggle();
addEventListener('keydown',e=>{if(e.key==='l'||e.key==='L')MUS.toggle()});
setTimeout(()=>MUS.prefetch((typeof CUR!=='undefined'&&CUR&&CUR.key)||LOCK||ORDER[0]),1500);
