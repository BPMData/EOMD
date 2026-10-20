/* audio/style-chip.js: style "chip" (load after audio/arranger.js and audio/chips.js).
   One shared, endless, generative composer; the score's `chip` ('fm' | 'tia' | 'beep' | 'snes' | 'arcade') decides which
   era chip plays it and which registers the parts are written in. Every channel shares the grid (116 BPM, 8-bar sections),
   so channel dissolves cross on the beat. Same seed + index = same section.
   Score fields: style "chip", chip, bpm, bars (8), tail, master_db, seed (optional default),
     airship (optional N): section i with i % N === 2 is an "airship" passage (Contour Desk): relative minor, held
     tonic+fifth drone, sweeping 32nd-note arps over two octaves, driving octave-jump bass and brass hits, soaring lead.
   Form per section: theme (2 bars) → sequenced up → answer → cadence. A theme lives 2 sections; every 4th section is a
   "breather" (no lead). Keys move in a related family (G, C, D, F, Bb...) every 2 sections.
   Dud speech: pass o.speech = [{t, d}] (seconds into the section) and it is voiced by the same chip, on the 32nd grid. */
(function(G){'use strict';
const P=G.DHS.dsp,M=G.MUSIC,C=G.CHIPS;
const H=(a,b)=>((Math.imul(a^0x9e3779b9,0x85ebca6b)^Math.imul((b+0x632be5ab)|0,0xc2b2ae35))>>>0);
const u=r=>(r()+1)/2,pick=(r,a)=>a[Math.floor(u(r)*a.length)%a.length];
const Q={M7:[0,4,7,11],m7:[0,3,7,10],D7:[0,4,7,10],h7:[0,3,6,10],s7:[0,5,7,10],M:[0,4,7],m:[0,3,7]};
const PROGS=[   // [semitones from tonic, quality], one chord per bar
  [[5,'M7'],[7,'D7'],[4,'m7'],[9,'m7'],[2,'m7'],[7,'D7'],[0,'M7'],[7,'s7']],
  [[2,'m7'],[7,'D7'],[0,'M7'],[5,'M7'],[11,'h7'],[4,'D7'],[9,'m7'],[7,'s7']],
  [[0,'M7'],[9,'m7'],[2,'m7'],[7,'D7'],[4,'m7'],[9,'D7'],[2,'m7'],[7,'D7']],
  [[9,'m7'],[5,'M7'],[7,'D7'],[0,'M7'],[9,'m7'],[5,'M7'],[2,'m7'],[7,'s7']],
  [[0,'M7'],[5,'M7'],[4,'m7'],[9,'D7'],[2,'m7'],[7,'D7'],[10,'D7'],[7,'s7']]];
const AIRPROG=[[0,'m'],[0,'m'],[8,'M'],[10,'M'],[0,'m'],[5,'m'],[8,'M'],[10,'M']];   // i i bVI bVII i iv bVI bVII (ends on V of the next major key)
const KEYS=[7,0,2,7,5,10];
const RHY=[ // 2-bar rhythm cells [step16, len]
  [[0,2],[2,2],[4,4],[8,2],[10,2],[12,4],[16,4],[20,2],[22,2],[24,8]],
  [[0,3],[3,3],[6,2],[8,4],[12,2],[14,2],[16,6],[24,2],[26,2],[28,4]],
  [[2,2],[4,2],[6,4],[10,2],[12,4],[16,2],[18,2],[20,4],[26,6]],
  [[0,4],[4,2],[6,2],[8,2],[10,6],[16,3],[19,3],[22,2],[24,4],[28,4]],
  [[0,1],[1,1],[2,2],[4,2],[6,2],[8,4],[12,4],[16,2],[18,2],[20,2],[22,2],[24,8]]];
const BASS=[
  [[0,0,2],[3,0,1],[4,12,2],[6,0,2],[8,0,2],[10,12,1],[11,0,1],[12,12,2],[14,7,2]],
  [[0,0,2],[2,12,2],[4,0,2],[6,12,2],[8,0,2],[10,12,2],[12,0,2],[14,12,2]],
  [[0,0,6],[6,7,2],[8,7,6],[14,0,2]],
  [[0,0,3],[3,0,3],[6,7,2],[8,0,3],[11,0,3],[14,'a',2]]];
const DRUM=[{k:[0,8],k2:[10],s:[4,12],h:2},{k:[0,6,8],k2:[],s:[4,12],h:1},{k:[0,10],k2:[],s:[8],h:2},{k:[0,8],k2:[3,11],s:[4,12],h:2}];
const SCALE=[0,2,4,5,7,9,11];
const inRange=(pc,lo)=>lo+(((pc-lo)%12)+12)%12;   // pitch class → first midi ≥ lo
function plan(sc,seed,i){const r=P.rng(H(seed,i)),tr=P.rng(H(seed^0x5eed,i>>1)),k0=H(seed,7)%KEYS.length;
  const th=[pick(tr,RHY),pick(tr,RHY)],walk=[];let d=0;for(let n=0;n<16;n++){d=Math.max(-4,Math.min(5,d+[-2,-1,-1,1,1,2,0,3][Math.floor(u(tr)*8)%8]));walk.push(d)}
  const air=!!sc.airship&&i%sc.airship===2,key=KEYS[((i>>1)+k0)%KEYS.length];
  return{r,key:air?(key+9)%12:key,prog:air?AIRPROG:PROGS[H(seed^0xabc,i)%PROGS.length],theme:th,walk,k:i%2,inv:u(tr)<0.5,
    bass:pick(r,BASS),drum:pick(r,DRUM),arp:pick(r,['up','updown','skip']),breather:!air&&i%4===3,air}}
// Airship passage: drone, sweeping arps, octave-jump drive, brass hits, soaring long-note lead (all original, all generated)
function airship(p,ev,T,s16,R,chord,lo,hi){const r=p.r,dl=inRange(p.key,48);
  ev.push({t:0,part:'pad',m:dl,d:128*s16*0.99,v:0.7},{t:0,part:'pad',m:dl+7,d:128*s16*0.99,v:0.6});
  const tops=[];for(let b=0;b<8;b++){const c=chord(b),ct=[];for(let x=lo;x<=hi;x++)if(c.iv.includes(((x-c.pc)%12+12)%12))ct.push(x);tops.push(ct)}
  let li=Math.floor(tops[0].length*0.45);
  for(let b=0;b<8;b++){const c=chord(b),nx=chord(b+1),t0=inRange(c.pc,R.arp?R.arp[0]:R.lead[0]-12),rt=inRange(c.pc,R.bass[0]);
    const up=[...c.iv.map(x=>t0+x),...c.iv.map(x=>t0+x+12),t0+24],seq=[...up,...up.slice(1,-1).reverse()];
    if(R.arp)for(let j=0;j<32;j++){const n=j%seq.length;ev.push({t:T(b,j/2),part:'arp',m:seq[n],d:s16*0.45,v:0.55+0.45*(seq[n]-t0)/24})}
    for(let st=0;st<16;st+=2)ev.push({t:T(b,st),part:'bass',m:st%4===2?rt+12:rt,d:s16*1.6,v:st%8===0?1:0.85});
    if(b%2){const h=inRange(nx.pc,lo);ev.push({t:T(b,12),part:'lead2',m:h,d:s16*1.5,v:0.9},{t:T(b,14),part:'lead2',m:h+12>hi?h:h+12,d:s16*1.5,v:1})}
    const ct=tops[b];li=Math.max(0,Math.min(ct.length-1,li+(b===4?3:b%4===3?0:Math.round(u(r)*2))));   // climbs, leaps at bar 4
    if(b%4===3)ev.push({t:T(b,0),part:'lead',m:ct[li],d:16*s16*0.95,v:0.95});
    else{ev.push({t:T(b,0),part:'lead',m:ct[li],d:10*s16*0.95,v:0.95});ev.push({t:T(b,10),part:'lead',m:ct[Math.max(0,li-1)],d:6*s16*0.95,v:0.85})}
    for(const st of [0,8,...(b%2?[6]:[])])ev.push({t:T(b,st),part:'kick',m:0,d:0,v:1});
    for(const st of (b===7?[4]:[4,12]))ev.push({t:T(b,st),part:'snare',m:0,d:0,v:1});
    for(let st=0;st<16;st+=2)ev.push({t:T(b,st),part:'hat',m:0,d:0,v:st%4===2?0.8:0.5});
    if(b===0||b===4)ev.push({t:T(b,0),part:'crash',m:0,d:0,v:1});
    if(b===7)[[8,55],[10,52],[12,48],[13,45],[14,43],[15,40]].forEach(([st,m])=>ev.push({t:T(b,st),part:'tom',m,d:0,v:1}))}}
M.chipEvents=(sc,seed,i,speech)=>{const p=plan(sc,seed,i),R=C[sc.chip].range,s16=60/sc.bpm/4,T=(b,st)=>(b*16+st)*s16,ev=[],r=p.r;
  const chord=b=>{const[o,q]=p.prog[b%8];return{pc:(p.key+o)%12,iv:Q[q]}};
  const [lo,hi]=R.lead,base=inRange(p.key,Math.round((lo+hi)/2)-12);
  const deg2m=dg=>{const o=Math.floor(dg/7),d=((dg%7)+7)%7;return base+12*o+SCALE[d]};
  const snapCT=(m,b)=>{const c=chord(b);let best=m,bd=99;for(let x=m-6;x<=m+6;x++)if(c.iv.includes(((x-c.pc)%12+12)%12)&&Math.abs(x-m)<bd){bd=Math.abs(x-m);best=x}return best};
  const fold=m=>{while(m>hi)m-=12;while(m<lo)m+=12;return m};
  if(p.air)airship(p,ev,T,s16,R,chord,lo,hi);else{
  // lead: theme, sequenced theme, answer (other rhythm, inverted walk), cadence
  if(!p.breather){const parts=[[0,p.theme[0],0,1],[2,p.theme[0],2,1],[4,p.theme[1],1,p.inv?-1:1],[6,p.theme[0],p.k,1]];
    for(const [b0,rhy,shift,sgn] of parts)rhy.forEach(([st,len],n)=>{const b=b0+(st>>4),s=st%16;let m=deg2m(3+shift+sgn*p.walk[n%16]+(p.k&&b0===0?1:0));
      if(s%4===0)m=snapCT(m,b);m=fold(m);const last=b0===6&&n===rhy.length-1,dur=(last?(32-st):len)*s16;
      ev.push({t:T(b0,st),part:'lead',m:last?fold(snapCT(m,7)):m,d:dur*0.95,v:0.8+0.2*u(r)});
      if(p.k===1&&(sc.chip==='fm'||sc.chip==='arcade'))ev.push({t:T(b0,st)+0.002,part:'lead2',m:fold(snapCT(m-4,b)),d:dur*0.95,v:0.8})})}
  for(let b=0;b<8;b++){const c=chord(b),rt=inRange(c.pc,R.bass[0]),nx=inRange(chord(b+1).pc,R.bass[0]);
    for(const [st,iv,len] of p.bass)ev.push({t:T(b,st),part:'bass',m:iv==='a'?nx-1:rt+iv,d:len*s16*0.88,v:1});
    if(R.arp){const t0=inRange(c.pc,R.arp[0]),tones=[...c.iv.map(x=>t0+x),...c.iv.map(x=>t0+x+12)],seq=p.arp==='up'?tones:p.arp==='updown'?[...tones,...tones.slice(1,-1).reverse()]:tones.filter((x,j)=>j%2===0).concat(tones.filter((x,j)=>j%2));
      for(let st=0;st<16;st++)ev.push({t:T(b,st),part:'arp',m:seq[(b*16+st)%seq.length],d:s16*0.7,v:0.8});
      c.iv.slice(0,3).forEach(x=>ev.push({t:T(b,0),part:'pad',m:t0+x-12,d:16*s16*0.98,v:0.6}))}
    const D=p.drum,fillBar=b===7;
    for(const st of [...D.k,...(b%2?D.k2:[])])if(!(fillBar&&st>=12))ev.push({t:T(b,st),part:'kick',m:0,d:0,v:1});
    for(const st of D.s)if(!(fillBar&&st>=12))ev.push({t:T(b,st),part:'snare',m:0,d:0,v:p.breather?0.6:1});
    for(let st=0;st<16;st+=D.h)ev.push({t:T(b,st),part:'hat',m:0,d:0,v:st%4===2?0.8:0.5});
    if(fillBar&&!p.breather)[[12,55],[13,50],[14,46],[15,41]].forEach(([st,m])=>ev.push({t:T(b,st),part:'tom',m,d:0,v:1}))}
  if(i%2===0)ev.push({t:0,part:'crash',m:0,d:0,v:1})}
  // Dud speech on the 32nd grid, from chord tones near the top of the lead range; the last three notes fall
  for(const sp of (speech||[])){const d32=s16/2,n=Math.round(sp.d/d32),b=Math.min(7,Math.floor(sp.t/(16*s16)));const c=chord(b),pool=[];
    for(let x=hi-12;x<=hi;x++)if([...c.iv,2,9].includes(((x-c.pc)%12+12)%12))pool.push(x);let k=pool.length>>1;
    for(let j=0;j<n;j++){if(j<n-3)k=Math.max(0,Math.min(pool.length-1,k+Math.round(r()*2.2)));else k=Math.max(0,k-1);if(j<n-3&&u(r)>0.9)continue;
      const t=Math.round(sp.t/d32)*d32+j*d32;ev.push({t,part:'speech',m:pool[k],d:d32*0.8,v:1})}}
  return ev.sort((a,b)=>a.t-b.t)};
M.styles.chip=function*(sc,o){const sr=o.sr||48000,seed=o.seed||sc.seed||1,i=o.index||0,len=M.sectionLen(sc),N=Math.round((len+sc.tail)*sr),ch=C[sc.chip];
  const mono=yield* ch.render(M.chipEvents(sc,seed,i,o.speech),N,sr,sc.bpm,sc);
  const hp=P.rbjHighpass(ch.post.hp,0.7,sr),lp=P.svf(),g=P.db(sc.master_db||0),L=new Float32Array(N);
  for(let j=0;j<N;j++)L[j]=g*lp(hp(mono[j]),ch.post.lp,0.7,sr);
  const f=Math.round(0.005*sr);for(let j=0;j<f;j++){L[j]*=j/f;L[N-1-j]*=j/f}   // de-click the section edges
  return{index:i,sr,len,L,R:Float32Array.from(L)}};
})(globalThis);