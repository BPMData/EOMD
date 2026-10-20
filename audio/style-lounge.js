/* audio/style-lounge.js: style "lounge" = Encyclopedia Lounge, CD-ROM edutainment bossa (load after audio/arranger.js).
   Needs INSTR voices from audio/instruments.js (+ -film) and audio/instruments-cdrom.js (rim, bleep, loungeVibes).
   One section = score.bars (8) bars + score.tail s of ring-out; play section k at k*sectionLen and let tails overlap (as comp4).
   Form (head and choruses, like a jazz tune):
   - HEAD on every headEvery-th section: the authored tune in score.head (C() in proj__cdrom__audition.js) on marimba;
     every other head is doubled by the vibraphone.
   - CHORUS otherwise: a motif melody over score.progs[chorusProgs[c % n]]. The motif (2 rhythm cells taken from the head,
     plus a contour) changes every themeEvery choruses and is varied each chorus. Strong notes walk chord tones, weak notes
     walk the chord scale. Bars in melody.split are answered by loungeVibes; every altEvery-th chorus the vibes take the
     whole lead; every restEvery-th chorus is a breather (no lead; vibes arpeggiate softly).
   - Key: score.keys[floor(i/keyEvery) % keys.length] semitones above G. The last bar's turnaround re-aims at the next key.
   Bed: bossa bass (root/fifth, sometimes a chromatic walk-up), soft kick under it, nylon pluck comping, rim clave,
   16th shaker, CD-ROM chime-bleep pickups into bars 5 and 1. */
(function(G){'use strict';
const P=G.DHS.dsp,I=G.INSTR,M=G.MUSIC;
const u=r=>(r()+1)/2,pick=(r,a)=>a[Math.floor(u(r)*a.length)%a.length];
const H=(a,b)=>((Math.imul(a^0x9e3779b9,0x85ebca6b)^Math.imul((b+0x632be5ab)|0,0xc2b2ae35))>>>0);
const MAJ=[0,2,4,5,7,9,11],pc=n=>((n%12)+12)%12,fold=k=>{k=pc(k);return k>6?k-12:k};
const keyAt=(sc,i)=>{const k=sc.keys||[0],e=sc.keyEvery||1;return k[Math.floor(i/e)%k.length]};
// What section i is: head or chorus, chorus number c, progression, breather/alt flags. Exposed for players and tests.
M.loungePlan=(sc,i)=>{const he=sc.headEvery||6,m=sc.melody,head=!!sc.head&&i%he===0,c=head?-1:i-Math.floor(i/he)-1,cp=sc.chorusProgs||[0];
 const rest=!head&&!!m.restEvery&&c%m.restEvery===m.restEvery-1,alt=!head&&!rest&&!!m.altEvery&&c%m.altEvery===m.altEvery-1;
 return{head,headNo:Math.floor(i/he),c,prog:head?sc.head.prog:cp[c%cp.length],rest,alt,key:keyAt(sc,i),next:keyAt(sc,i+1)}};
// pitch helpers: walk n steps through a pitch-class set; nearest member of a set
const walk=(p,s,set)=>{const d=Math.sign(s);let n=Math.abs(s);while(n>0){p+=d;if(set.has(pc(p)))n--}return p};
const near=(p,set)=>{for(let k=0;k<12;k++){if(set.has(pc(p-k)))return p-k;if(set.has(pc(p+k)))return p+k}return p};
function harmony(ch,kb){const tones=new Set([pc(ch[0]+kb),...ch[1].map(n=>pc(n+kb))]),sc=new Set(MAJ.map(x=>pc(x+7+kb)));
 for(const t of tones)if(!sc.has(t)){const a=pc(t-1),b=pc(t+1),x=sc.has(a)&&!tones.has(a)?a:sc.has(b)&&!tones.has(b)?b:null;if(x!==null)sc.delete(x);sc.add(t)}
 return{tones,scale:sc}}
const rhythms=sc=>sc.head.mel.map(bar=>bar.map(([st,,len])=>[st,len]));
function theme(sc,r){const RH=rhythms(sc);return{a:pick(r,RH),b:pick(r,RH),c:pick(r,RH),cad:pick(r,sc.melody.cadences),
 steps:Array.from({length:8},()=>pick(r,[-2,-1,-1,1,1,2,0,3,-3])),start:Math.round(u(r)*4)-2,thin:0}}
function vary(th,r){const t={...th,steps:th.steps.slice()},op=Math.floor(u(r)*4)%4;
 if(op===0)t.steps.push(t.steps.shift());                       // rotate the contour
 else if(op===1)t.steps=t.steps.map(s=>-s);                      // invert
 else if(op===2)t.thin=0.35;                                     // drop some weak notes
 else{t.start+=u(r)<.5?-2:2;[t.a,t.b]=[t.b,t.a]}                 // new start, swap cells
 return t}
const lounge=function*(sc,o){const sr=o.sr||48000,seed=o.seed||1,i=o.index||0,beat=60/sc.bpm,s16=beat/4,bars=sc.bars,len=bars*4*beat,N=Math.round((len+sc.tail)*sr);
 const pl=M.loungePlan(sc,i),mx=sc.mix,mm=sc.melody,fx=sc.fx,r=P.rng(H(seed,i)),hr=P.rng(H(seed^0x77,i));
 const dry=P.bus(N),rev=P.bus(N),dly=P.bus(N),kf=fold(pl.key),kl=fold(pl.key+fold(pl.next-pl.key));
 const prog=sc.progs[pl.prog],kb=b=>b===bars-1?kl:kf;
 const T=(b,st)=>(b*16+st)*s16+u(hr)*sc.human;
 const put=(buf,t,q,pan,gm=1)=>{const a=Math.round(t*sr),pn=pan==null?(q.pan||0):pan;P.write(dry,buf,a,q.g*gm,pn);if(q.rev)P.write(rev,buf,a,q.g*gm*q.rev,pn);if(q.dly)P.write(dly,buf,a,q.g*gm*q.dly,pn)};
 const chordAt=(b,st)=>{const a=prog[Math.min(b,prog.length-1)];return a.length>1&&st>=8?a[1]:a[0]};
 const bassOf=(ch,b)=>{let x=ch[0]+kb(b);while(x>45)x-=12;while(x<28)x+=12;return x};
 const voice=(ch,b)=>ch[1].map(n=>n+kb(b));
 // ---- melody: list of [bar, step, midi, lenSteps, vel, who]  who: 'lead' | 'vibes'
 const notes=[];
 if(pl.head){for(let b=0;b<bars;b++)for(const[st,mi,l,v=0.9]of sc.head.mel[b%sc.head.mel.length])notes.push([b,st,mi+kb(b),l,v,'lead'])}
 else if(!pl.rest){const te=mm.themeEvery||3,tn=Math.floor(pl.c/te),k=pl.c%te;let th=theme(sc,P.rng(H(seed^0x51ed,tn)));for(let j=0;j<k;j++)th=vary(th,r);
  const plan=[th.a,th.b,th.a,th.c,th.a,th.b,th.c,th.cad],[lo,hi]=mm.range.map(x=>x+kf);
  let p=near(mm.home+kf+th.start*2,harmony(chordAt(0,0),kf).tones),j=0;
  for(let b=0;b<bars;b++){if(b%2===0)j=0;const cell=plan[b];
   cell.forEach(([st,l],q)=>{const h=harmony(chordAt(b,st),kb(b)),strong=st===0||st===8||l>=4,s=th.steps[j++%th.steps.length];
    if(!strong&&th.thin&&q>0&&q<cell.length-1&&u(r)<th.thin)return;
    let np=strong?(s?walk(near(p,h.tones),Math.sign(s)*Math.max(1,Math.ceil(Math.abs(s)/2)),h.tones):near(p,h.tones)):(s?walk(p,s,h.scale):near(p,h.scale));
    if(np>hi)np=walk(p,-Math.max(1,Math.abs(s)),strong?h.tones:h.scale);if(np<lo)np=walk(p,Math.max(1,Math.abs(s)),strong?h.tones:h.scale);
    p=np;notes.push([b,st,p,l,(q===0?0.95:0.82)+0.12*u(r),pl.alt||(mm.split||[]).includes(b)?'vibes':'lead'])})}}
 for(const[b,st,mi,l,v,who]of notes){const t=T(b,st);
  if(who==='lead')put(yield* I[mm.lead](sr,mi+12,l*s16,v),t,mx.lead);       // marimba sounds an octave below its argument
  else put(yield* I.loungeVibes(sr,mi,l*s16*0.9,v),t,mx.vibes);
  if(pl.head&&pl.headNo%2===1)put(yield* I.loungeVibes(sr,mi,l*s16*0.9,v*0.8),t,mx.double)}
 if(pl.rest)for(let b=0;b<bars;b++){const v=voice(chordAt(b,0),b).map(n=>n+12),ord=b%2?[3,1,2,0]:[0,2,1,3];   // breather: soft vibes arpeggio
  for(const[q,st]of[[0,0],[1,3],[2,6],[3,10]])put(yield* I.loungeVibes(sr,v[ord[q]],3*s16,0.7),T(b,st),mx.arp,-0.3+0.2*q)}
 // ---- bed
 for(let b=0;b<bars;b++){const two=prog[b].length>1,pat=two?[[0,0,6],[6,7,2],[8,0,6],[14,7,2]]:[[0,0,6],[6,7,2],[8,7,6],[14,0,2]];
  const walkUp=!two&&b<bars-1&&u(r)<(sc.bed.walkUp||0);
  for(const[st,iv,l]of pat){const rt=bassOf(chordAt(b,st),b);let m=rt+iv;if(m>47)m-=12;if(st===14&&walkUp)m=bassOf(chordAt(b+1,0),b+1)-1;
   put(yield* I.bass(sr,m,l*s16*0.9,0.95),T(b,st),mx.bass);put(yield* I.kick(sr,mx.kick.v),T(b,st),mx.kick)}
  for(const st of(b%2?[2,6,8,12,14]:[0,3,6,10,12])){const v=voice(chordAt(b,st),b);
   for(let k=0;k<v.length;k++)put(yield* I.pluck(sr,v[k],0,0.7,b*16+st+k),T(b,st)+k*0.009,mx.gtr,-0.3+0.15*k)}
  for(const st of(b%2?[4,10]:[0,6,12]))put(yield* I.rim(sr,0.9),T(b,st),mx.rim);
  if(b===bars-1&&!pl.head&&u(r)<(sc.bed.fill||0))for(const st of[13,15])put(yield* I.rim(sr,0.6),T(b,st),mx.rim,-0.2);
  for(let st=0;st<16;st++)put(yield* I.shaker(sr,st%2?1:0.6,i*128+b*16+st),T(b,st),mx.shaker);
  if((b===3||b===bars-1)&&u(r)<mx.bleep.prob){const tg=b===3?harmony(chordAt(4,0),kf).tones:new Set([7,11,2].map(x=>pc(x+fold(pl.next))));
   let p=near(85+kf,tg);for(const st of[13,14,15]){put(yield* I.bleep(sr,p,0.06,0.8,0.25),T(b,st),mx.bleep);p=walk(p,1,tg)}}
  if(i%2===1&&b%2===0)yield}
 // ---- reverb + ping-pong delay, skin (HP + soft lowpass), master trim
 const rv=P.reverb({sr,...fx.reverb})(),dl=P.delay({sr,time:fx.delay.beats*beat,fb:fx.delay.fb,lp:fx.delay.lp})(),g=P.db(sc.master_db);
 const hl=P.rbjHighpass(fx.post.hp,.7,sr),hr2=P.rbjHighpass(fx.post.hp,.7,sr),ll=P.onepole(),lr=P.onepole(),L=new Float32Array(N),R=new Float32Array(N);
 for(let j=0;j<N;j++){const w=rv(rev.L[j],rev.R[j]),e=dl(dly.L[j],dly.R[j]);
  L[j]=g*ll(hl(dry.L[j]+w[0]*fx.reverb.wet+e[0]*fx.delay.wet),fx.post.lp,sr);R[j]=g*lr(hr2(dry.R[j]+w[1]*fx.reverb.wet+e[1]*fx.delay.wet),fx.post.lp,sr);if((j&4095)===4095)yield}
 return{index:i,sr,len,L,R}};
M.styles.lounge=lounge;
})(globalThis);