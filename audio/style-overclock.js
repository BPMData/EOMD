/* audio__style-overclock.js: style "overclock" = Track 2, "Stage 1 · Overclock", as an endless stream of 8-bar sections.
   Load after audio__chips.js, audio__arranger.js and proj__cdrom__track2-r2.js (which holds the composition: TRACK2R2).
   The notes come from TRACK2R2 (the audition page's piece); this file arranges them into an endless song and voices each bar
   on the chip through TRACK2R2.chipEvents, so the chip rules (registers, twin lead only on fm/snes/arcade, sour TIA notes) stay
   in one place.
   Oct 9b, variations + energy (Bryan: at 142.5 BPM the 27-second A+B loop got repetitive):
   - The song after the 4-bar intro is a chain of PASSES. A pass plays a list of sections (today A then B, 16 bars) with a TYPE:
       full    the tune as written                       var    melodic variations (runs, turns, arpeggios, octave leaps)
       sparse  verse feel: lead + bass + light drums, the twin lead joins in B
       build   sparse A1-4, medium A5-8, full B          break  breakdown: half-time bass + lead, hats only, snare roll into B
       lift    key up a whole step for one pass (the pivot is the previous pass's last bar, a "truck driver" change)
   - Passes come in SETS: a plain 'full' statement, then 3-5 of the others shuffled, sometimes ending on a lift (~2.5-3.5 min).
     Every bar has an ENERGY level: 0 breakdown, 1 sparse, 2 medium (no ghost snares), 3 full. Var passes may also flip the
     twin lead between 3rds and 6ths. Everything is seeded by the session seed + pass, so each session plays a different chain,
     and a re-rendered section (for Dud speech) is identical.
   Oct 9e, the longer composed form (option 3, approved in the audition): the piece now has C (bars 20-27, a half-time
     breakdown) and D (28-35, a generated solo over A's chords). Every SET plays Bryan's approved order with the 9c variety
     woven in:  full (A B) · 1-2 bag passes · breakC (A C) · maybe one var/build · solo (A D) · liftB (B up a whole step;
     D8 pivots up, B8 drops home)  = 72-104 bars, about 2-3 min at 142.5. Each solo pass gets its own take
     (TRACK2R2.solo(pass seed, first note of the next bar)). Variations only touch A and B (C and D are already new).
     Bass approach notes at a bar's end now aim at the bar that really follows (fixes the old 'always aims at A1').
     The 9c 'lift' pass (A B up) is no longer drawn: liftB closes every set instead.
     Needs the Oct 9e proj__cdrom__track2-r2.js (T.solo, T.barLabel, T.approach, T.firstBass, events(…, order)).
   Score fields: style "overclock", chip, bpm, tr (semitones), bars (8), tail, lead (sampler melody sample), vary (1 = passes,
     0 = the plain A+B loop; the player's ?plain sets 0), master_db (number or {chip: dB}), clear (1 or a list of chips).
   Dud speech: o.speech = [{t, d}] is voiced by the same chip on the 32nd grid, from the chord tones of the bar it falls in.
   Debug: MUSIC.overclockPlan(seed, passes) lists the passes; MUSIC.overclockAt(sc, seed, bar) describes one bar. */
(function(G){'use strict';
const P=G.DHS.dsp,M=G.MUSIC,C=G.CHIPS,T=G.TRACK2R2;
const H=(a,b)=>((Math.imul(a^0x9e3779b9,0x85ebca6b)^Math.imul((b+0x632be5ab)|0,0xc2b2ae35))>>>0);
const u=r=>(r()+1)/2,pc=n=>((n%12)+12)%12;
const NOTE={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
const Q={'':[0,4,7],m:[0,3,7],m7:[0,3,7,10],mMaj7:[0,3,7,11],m6:[0,3,7,9],m9:[0,3,7,10,2],maj7:[0,4,7,11],'7':[0,4,7,10],'7b9':[0,4,7,10,1],m7b5:[0,3,6,10],'7sus4':[0,5,7,10]};
const piece=()=>{if(T.piece!=='overclock')T.use('overclock');return T};

/* ---------- the form: sections, pass types, sets ---------- */
const FORM={
 secs:['A','B'],                      // default sections of a pass
 sections:{A:[4,12],B:[12,20],C:[20,28],D:[28,36]},   // piece bars [from, to)
 // lv(j, len) = energy of bar j of the pass; vary = chance a bar gets a melodic variation; flip = chance the pass swaps 3rds/6ths;
 // roll = bars (j) that end in a snare roll; fills = chance of a tom fill at bars 4 and 12; lift = semitones for the whole pass;
 // secs = sections (default FORM.secs)
 types:{
  full:  {lv:()=>3},
  var:   {lv:()=>3,vary:.6,flip:.35,fills:.5},
  sparse:{lv:j=>j<8?1:2,vary:.2,roll:[7]},
  build: {lv:j=>j<4?1:j<8?2:3,roll:[7]},
  break: {lv:j=>j<6?0:j<8?1:3,vary:.4,roll:[7]},
  lift:  {lv:()=>3,vary:.5,fills:.5,lift:2},      // (9c; not drawn since Oct 9e)
  breakC:{secs:['A','C'],lv:()=>3,vary:.3,flip:.2},           // A, then the half-time breakdown
  solo:  {secs:['A','D'],lv:()=>3,vary:.3,fills:.4},          // A, then a generated solo (a new take every pass)
  liftB: {secs:['B'],lv:()=>3,vary:.5,fills:.5,lift:2}},      // B up a whole step (the solo's last bar is the pivot)
 bag:['var','var','var','sparse','build','break'],   // variety passes drawn into each set (no repeats of a bag slot per set)
 midChance:.5};                                      // chance of one var/build pass between breakC and solo
const secLen=s=>FORM.sections[s][1]-FORM.sections[s][0];
const PLANS=new Map();   // seed -> {r, passes:[{type, secs, len, seed, lift}], start:[first bar after the intro of each pass]}
function addSet(PL){const r=PL.r,bag=FORM.bag.slice(),seq=['full'],quiet=x=>x==='sparse'||x==='break';
 const draw=ok=>{const c=bag.filter(ok);if(!c.length)return null;const x=c[Math.floor(u(r)*c.length)%c.length];bag.splice(bag.indexOf(x),1);return x};
 for(let k=0,n=1+Math.floor(u(r)*2);k<n;k++){const prev=seq[seq.length-1],x=draw(y=>!(quiet(y)&&quiet(prev)));if(x)seq.push(x)}   // no two quiet passes in a row
 seq.push('breakC');
 if(u(r)<FORM.midChance){const x=draw(y=>y==='var'||y==='build');if(x)seq.push(x)}
 seq.push('solo','liftB');
 for(const ty of seq){const ft=FORM.types[ty],secs=ft.secs||FORM.secs,len=secs.reduce((a,s)=>a+secLen(s),0);
  PL.passes.push({type:ty,secs,len,seed:H(PL.seed,PL.passes.length),lift:ft.lift||0});PL.start.push(PL.start[PL.start.length-1]+len)}}
function plan(seed){let PL=PLANS.get(seed);if(!PL){if(PLANS.size>8)PLANS.clear();PL={seed,r:P.rng(H(seed,0x5e7)),passes:[],start:[0]};PLANS.set(seed,PL)}return PL}
function passOf(PL,k){while(PL.start[PL.start.length-1]<=k+16)addSet(PL);   // (k = bars after the intro; keep one pass of look-ahead)
 let lo=0,hi=PL.passes.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(PL.start[m]<=k)lo=m;else hi=m-1}return lo}
// bar n of the endless song -> {bi (piece bar), p, j, pass, lv, lift, roll, vary, flip}
function barInfo(seed,n){const pz=piece();if(n<pz.intro)return{bi:n,lv:3,lift:0,intro:1};
 const PL=plan(seed),k=n-pz.intro,p=passOf(PL,k),ps=PL.passes[p],j=k-PL.start[p],ft=FORM.types[ps.type];
 let o=j,bi=0;for(const s of ps.secs){const L=secLen(s);if(o<L){bi=FORM.sections[s][0]+o;break}o-=L}
 const nx=PL.passes[p+1],r=P.rng(H(ps.seed,0xf11));
 return{bi,p,j,pass:ps,type:ps.type,lv:ft.lv(j,ps.len),lift:j===ps.len-1?(nx?nx.lift:0):ps.lift,roll:(ft.roll||[]).includes(j),vary:ft.vary||0,flip:u(r)<(ft.flip||0),
  fill:!!ft.fills&&j%4===3&&j%8!==7&&u(P.rng(H(ps.seed,j+0x7f)))<ft.fills}}
M.overclockPlan=(seed,n=12)=>{const PL=plan(seed);while(PL.passes.length<n)addSet(PL);return PL.passes.slice(0,n).map((x,i)=>x.type+(i&&PL.passes[i].lift?'+'+PL.passes[i].lift:''))};
M.overclockAt=(sc,seed,n)=>{const b=barInfo(seed,n);return b.intro?{bar:n,intro:1}:{bar:n,pass:b.p,type:b.type,barInPass:b.j+1,energy:b.lv,lift:b.lift,section:T.barLabel(b.bi,b.lift)}};

/* ---------- harmony helpers (copied from proj__cdrom__track2-r2.js so varied melodies get their twin) ---------- */
const chName=(bi,st)=>{const ch=piece().bars[bi].ch;let n=ch[0][1];for(const [s,c] of ch)if(s<=st)n=c;return n};
const chord=s=>{const r=s.match(/^[A-G]#?/)[0];return{root:NOTE[r],tones:new Set(Q[s.slice(r.length)].map(i=>pc(NOTE[r]+i)))}};
const scaleOf=(key,ch)=>{const sc=new Set(T.KEYS[key]);for(const t of ch.tones)if(!sc.has(t)){const a=pc(t-1),b=pc(t+1),x=sc.has(a)&&!ch.tones.has(a)?a:sc.has(b)&&!ch.tones.has(b)?b:null;if(x!==null)sc.delete(x);sc.add(t)}return sc};
const below=(m,n,sc)=>{while(n>0){m--;if(sc.has(pc(m)))n--}return m};
const stepIn=(m,dir,sc)=>{do m+=dir;while(!sc.has(pc(m)));return m};
const chordAt=(bi,st,tr)=>{const c=chord(chName(bi,st)),root=pc(c.root+tr);return{root,tones:new Set([...c.tones].map(x=>pc(x+tr)))}};

/* ---------- one bar of chip-neutral events, arranged ---------- */
const NB=new Map();   // bpm -> piece bars of neutral events {t (s from bar start), k, m, d, v, root}
function neutral(bpm){let b=NB.get(bpm);if(b)return b;const pz=piece(),bl=16*60/bpm/4,nb=pz.bars.length;b=Array.from({length:nb},()=>[]);
 for(const e of pz.events(bpm,{mel:1,har:1,bass:1,drums:1},pz.bars.map((_,i)=>i))){const k=Math.min(nb-1,Math.floor(e.t/bl+1e-6));b[k].push({...e,t:e.t-k*bl})}   // every bar once (incl. C, D)
 if(NB.size>6)NB.clear();NB.set(bpm,b);return b}
// melodic variations on [step, midi, length] notes (16th steps); r = the bar's rng; sc(st) = scale at a step; ch(st) = chord tones
const VARS={
 run(N,i,sc){const [st,m,l]=N[i];if(l<6)return 0;const to=N[i+1]?N[i+1][1]:m-5,out=[[st,m,2]];let x=m;   // a long note becomes a 16th run toward the next note
  for(let s=2;s<l;s++){const d=to>x?1:to<x?-1:(s%2?1:-1);x=stepIn(x,d,sc(st+s));out.push([st+s,x,1])}N.splice(i,1,...out);return 1},
 turn(N,i,sc){const [st,m,l]=N[i];if(l<3)return 0;N.splice(i,1,[st,m,1],[st+1,stepIn(m,1,sc(st)),1],[st+2,m,l-2]);return 1},   // upper-neighbour turn
 arp(N,i,sc,ch){const [st,m,l]=N[i];if(l<8)return 0;const out=[[st,m,2]];let x=m;   // second half of a held note becomes a rising chord arpeggio
  for(let s=2;s<l;s++){const t=ch(st+s);let y=x+1;while(!t.has(pc(y)))y++;if(y>m+12)y=m;x=y;out.push([st+s,x,1])}N.splice(i,1,...out);return 1},
 leap(N,i){const [st,m,l]=N[i];if(l<4||m+12>93)return 0;N[i]=[st,m+12,l];return 1}};   // octave leap on a long note
// the solo for a D bar: one take per pass, ending with a run into the first note of the bar that follows D
const SOLO=new Map();
function soloMel(seed,n,info,B){const k=B.solo,last=barInfo(seed,n-k+7),nb=barInfo(seed,n-k+8),nm=piece().bars[nb.bi].mel;
 const to=(nm.length?nm[0][1]:85)+(nb.lift||0)-(last.lift||0),key=info.pass.seed+'|'+to;let s=SOLO.get(key);
 if(!s){if(SOLO.size>16)SOLO.clear();s=T.solo(info.pass.seed,to);SOLO.set(key,s)}return s[k].map(x=>x.slice())}
function barEvents(seed,n,bpm){const info=barInfo(seed,n),pz=piece(),B=pz.bars[info.bi],base=neutral(bpm)[info.bi],s16=60/bpm/4;
 if(info.intro)return{info,ev:base};
 const L=info.lv,r=P.rng(H(info.pass.seed,info.j+1)),ev=[];
 // melody (+ variations) and its twin
 const solo=B.solo!=null;
 let N=solo?soloMel(seed,n,info,B):base.filter(e=>e.k==='mel').map(e=>[Math.round(e.t/s16),e.m,Math.max(1,Math.round(e.d/(s16*0.92)))]);
 const sc=st=>scaleOf(B.key,chord(chName(info.bi,st))),ct=st=>chord(chName(info.bi,st)).tones;
 if(info.vary&&(B.sec==='A'||B.sec==='B')&&u(r)<info.vary&&N.length){const names=Object.keys(VARS);for(let tries=0;tries<6;tries++){const f=VARS[names[Math.floor(u(r)*names.length)%names.length]],i=Math.floor(u(r)*N.length)%N.length;if(f(N,i,sc,ct))break}}
 const hn=(B.h===6)!==info.flip?5:2;
 if(L>=2&&B.h)for(const [st,m,l] of N)ev.push({t:st*s16,k:'har',m:below(m,hn,sc(st)),d:l*s16*0.92,v:0.78});
 for(const [st,m,l] of N)ev.push({t:st*s16,k:'mel',m,d:l*s16*0.92,v:0.92});
 // bass
 const bass=base.filter(e=>e.k==='bass'),nx=e=>{if(!e.nx)return e;const b=barInfo(seed,n+1);   // approach note: aim at the bar that really follows
  return{...e,m:T.approach(e.root,T.firstBass(b.bi)+(b.lift||0)-(info.lift||0))}};
 if(L===0){const at=st=>bass.filter(e=>e.t<=st*s16+1e-6).pop()||bass[0];for(const st of [0,8]){const e=at(st);if(e)ev.push({t:st*s16,k:'bass',m:e.root,root:e.root,d:7.5*s16*0.85,v:0.95})}}
 else for(const e of bass)if(L>=2||e.v>=0.6)ev.push(nx(e));
 // drums
 const d=(k,st,v)=>ev.push({t:st*s16,k,m:0,d:0,v});
 if(L===3)for(const e of base)if(e.k==='kick'||e.k==='snare'||e.k==='hat'||e.k==='crash')ev.push(e);
 if(L===2)for(const e of base)if(e.k==='kick'||e.k==='hat'||e.k==='crash'||(e.k==='snare'&&e.v>=0.4))ev.push(e);
 if(L===1){d('kick',0,1);d('kick',8,0.9);d('snare',4,0.7);d('snare',12,0.7);for(let st=0;st<16;st+=2)d('hat',st,st%4?0.4:0.55)}
 if(L===0)for(const st of [0,4,8,12])d('hat',st,0.35);
 if(info.fill){for(let q=ev.length-1;q>=0;q--){const e=ev[q];if((e.k==='snare'||e.k==='hat')&&e.t>=12*s16-1e-6)ev.splice(q,1)}   // tom fill at a mid-phrase bar end
  [[12,55],[13,50],[14,46],[15,41]].forEach(([st,m])=>ev.push({t:st*s16,k:'tom',m,d:0,v:1}))}
 if(info.roll){for(let q=ev.length-1;q>=0;q--){const e=ev[q];if((e.k==='snare'||e.k==='hat')&&e.t>=8*s16-1e-6)ev.splice(q,1)}   // snare roll into the next bar
  for(let st=8;st<16;st++)d('snare',st,0.3+0.7*(st-8)/7)}
 // copies (the piece's cached events stay untouched), key lift, twin ahead of the melody at equal times
 const out=ev.map(e=>({...e})),K={har:0,mel:1},VL=[0.7,0.82,0.92,1][L];   // lower energy plays softer (every chip but the 1-bit beeper has volume)
 if(VL<1)for(const e of out)if(e.k==='mel'||e.k==='har'||e.k==='bass')e.v*=VL;
 if(info.lift)for(const e of out)if(e.k==='mel'||e.k==='har'||e.k==='bass'){e.m+=info.lift;if(e.root!=null)e.root+=info.lift}
 const q=e=>Math.round(e.t/s16*8);   // order by 32nd (float noise must not reorder)
 return{info,ev:out.sort((a,b)=>q(a)-q(b)||(K[a.k]??2)-(K[b.k]??2))}}
// voice one bar on the chip through TRACK2R2's own chip mapping
function chipBar(chip,bpm,tr,ev){const pz=piece(),ce=pz.chipEvents,orig=pz.events;pz.events=()=>ev;try{return ce(chip,bpm,null,tr)}finally{pz.events=orig}}

/* ---------- the plain loop (vary 0): the Oct 9 behaviour ---------- */
M.overclockBar=n=>{const p=piece(),loop=p.total-p.intro;return n<p.intro?n:p.intro+(n-p.intro)%loop};
const cache=new Map();
function plainBars(chip,bpm,tr){const key=chip+'|'+bpm+'|'+tr;let b=cache.get(key);if(b)return b;
 const p=piece(),bl=16*60/bpm/4;b=Array.from({length:p.total},()=>[]);
 for(const e of p.chipEvents(chip,bpm,{mel:1,har:1,bass:1,drums:1},tr)){const k=Math.min(p.total-1,Math.floor(e.t/bl+1e-6));b[k].push({...e,t:e.t-k*bl})}
 if(cache.size>12)cache.clear();cache.set(key,b);return b}

M.overclockEvents=(sc,seed,i,speech)=>{const bpm=sc.bpm,tr=sc.tr||0,bl=16*60/bpm/4,s16=bl/16,nb=sc.bars||8,vary=sc.vary!==0,ev=[],lifts=[],bis=[];
 for(let j=0;j<nb;j++){const n=i*nb+j;
  if(vary){const {info,ev:ne}=barEvents(seed,n,bpm);bis.push(info.bi);lifts.push(info.lift||0);for(const e of chipBar(sc.chip,bpm,tr,ne))ev.push({...e,t:e.t+j*bl})}
  else{const bi=M.overclockBar(n);bis.push(bi);lifts.push(0);for(const e of plainBars(sc.chip,bpm,tr)[bi])ev.push({...e,t:e.t+j*bl})}}
 const [,hi]=C[sc.chip].range.lead,r=P.rng(H(seed^0x0c10c,i));
 for(const sp of (speech||[])){const d32=s16/2,n=Math.round(sp.d/d32),b=Math.min(nb-1,Math.floor(sp.t/bl)),
   c=chordAt(bis[b],Math.floor((sp.t-b*bl)/s16),tr+lifts[b]),pool=[];
  for(let x=hi-12;x<=hi;x++)if(c.tones.has(pc(x))||pc(x-c.root)===2)pool.push(x);let k=pool.length>>1;
  for(let j=0;j<n;j++){if(j<n-3)k=Math.max(0,Math.min(pool.length-1,k+Math.round(r()*2.2)));else k=Math.max(0,k-1);if(j<n-3&&u(r)>0.9)continue;
   const t=Math.round(sp.t/d32)*d32+j*d32;ev.push({t,part:'speech',m:pool[k],d:d32*0.8,v:1})}}
 const q=e=>Math.round(e.t/s16*8);return ev.sort((a,b)=>q(a)-q(b))};   // stable, by 32nd: float noise must not reorder equal times
M.styles.overclock=function*(sc,o){const sr=o.sr||48000,seed=o.seed||sc.seed||1,i=o.index||0,len=M.sectionLen(sc),N=Math.round((len+sc.tail)*sr),ch=C[sc.chip];
 const clear=Array.isArray(sc.clear)?sc.clear.includes(sc.chip):!!sc.clear,mdb=typeof sc.master_db==='object'?(sc.master_db[sc.chip]||0):(sc.master_db||0);
 const mono=yield* ch.render(M.overclockEvents(sc,seed,i,o.speech),N,sr,sc.bpm,{lead:sc.lead,clear:clear?1:0});
 const pe=(clear&&ch.postClear)||ch.post,hp=P.rbjHighpass(pe.hp,0.7,sr),lp=P.svf(),g=P.db(mdb),L=new Float32Array(N);
 for(let j=0;j<N;j++)L[j]=g*lp(hp(mono[j]),pe.lp,0.7,sr);
 const f=Math.round(0.005*sr);for(let j=0;j<f;j++){L[j]*=j/f;L[N-1-j]*=j/f}   // de-click the section edges
 return{index:i,sr,len,L,R:Float32Array.from(L)}};
})(globalThis);
