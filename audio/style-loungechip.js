/* audio__style-loungechip.js: style "loungechip" = Encyclopedia Lounge played by an era chip ("Lounge (Chipped)").
   Load after audio__chips.js and audio__style-lounge.js (which supplies MUSIC.loungePlan).
   The notes are Lounge's own: MUSIC.loungeEvents mirrors audio__style-lounge.js call for call (same seed + section = same
   melody, vibes answers, bass, comping chords, clave, shaker and bleep pickups; only the humanize jitter is dropped, chips
   sit on the grid). MUSIC.loungeChipEvents then gives each line to a part the chip really has, in its registers:
     fm     marimba line → FM lead; vibes answers + breather arps + bleeps → glass bell; guitar comping → organ stabs;
            clave → FM rim (snare, soft); shaker → FM hats.
     tia    2 channels: the whole tune (marimba + vibes) on ch0, bass on ch1; clave as a noise tick; no comping, no shaker.
     beep   tune on the speaker (lead), comping as a quick 3-note broken chord in the gaps (arp), clave as a blip.
     snes   tune on the score's lead sample (split: strings, the mallet answers in bars 5–6, exactly Lounge's split bars),
            comping → harp chords, breathers + bleeps → harp, clave → soft snare, shaker → hats.
     arcade tune on 4-op brass (+ PSG doubling), vibes answers + bleeps on the PSG (with its delayed echo), comping → FM
            electric piano chords, clave → soft snare, shaker → noise hats.
   The marimba line moves by whole octaves toward the chip's lead register, then single notes fold in where the chip can't reach.
   Dud speech: o.speech = [{t, d}] is voiced by the chip from Lounge's chord tones (as the chip style does).
   Score: the lounge score + chip, tail, master_db (+ lead for snes); tools__build_cdrom.py derives one per chip (lc_<chip>). */
(function(G){'use strict';
const P=G.DHS.dsp,M=G.MUSIC,C=G.CHIPS;
const u=r=>(r()+1)/2,pick=(r,a)=>a[Math.floor(u(r)*a.length)%a.length];
const H=(a,b)=>((Math.imul(a^0x9e3779b9,0x85ebca6b)^Math.imul((b+0x632be5ab)|0,0xc2b2ae35))>>>0);
const MAJ=[0,2,4,5,7,9,11],pc=n=>((n%12)+12)%12,fold=k=>{k=pc(k);return k>6?k-12:k};
// ---- copied from audio__style-lounge.js (keep in step with it)
const walk=(p,s,set)=>{const d=Math.sign(s);let n=Math.abs(s);while(n>0){p+=d;if(set.has(pc(p)))n--}return p};
const near=(p,set)=>{for(let k=0;k<12;k++){if(set.has(pc(p-k)))return p-k;if(set.has(pc(p+k)))return p+k}return p};
function harmony(ch,kb){const tones=new Set([pc(ch[0]+kb),...ch[1].map(n=>pc(n+kb))]),sc=new Set(MAJ.map(x=>pc(x+7+kb)));
 for(const t of tones)if(!sc.has(t)){const a=pc(t-1),b=pc(t+1),x=sc.has(a)&&!tones.has(a)?a:sc.has(b)&&!tones.has(b)?b:null;if(x!==null)sc.delete(x);sc.add(t)}
 return{tones,scale:sc}}
const rhythms=sc=>sc.head.mel.map(bar=>bar.map(([st,,len])=>[st,len]));
function theme(sc,r){const RH=rhythms(sc);return{a:pick(r,RH),b:pick(r,RH),c:pick(r,RH),cad:pick(r,sc.melody.cadences),
 steps:Array.from({length:8},()=>pick(r,[-2,-1,-1,1,1,2,0,3,-3])),start:Math.round(u(r)*4)-2,thin:0}}
function vary(th,r){const t={...th,steps:th.steps.slice()},op=Math.floor(u(r)*4)%4;
 if(op===0)t.steps.push(t.steps.shift());
 else if(op===1)t.steps=t.steps.map(s=>-s);
 else if(op===2)t.thin=0.35;
 else{t.start+=u(r)<.5?-2:2;[t.a,t.b]=[t.b,t.a]}
 return t}
// ---- Lounge's notes, chip-neutral: {t, k, m, d, v} with k = mel | vib | brk | bass | kick | comp (ms = chord) | rim | shk | bleep
M.loungeEvents=(sc,seed,i)=>{const s16=60/sc.bpm/4,bars=sc.bars,pl=M.loungePlan(sc,i),mm=sc.melody,mx=sc.mix,r=P.rng(H(seed,i)),ev=[];
 const kf=fold(pl.key),kl=fold(pl.key+fold(pl.next-pl.key)),prog=sc.progs[pl.prog],kb=b=>b===bars-1?kl:kf,T=(b,st)=>(b*16+st)*s16;
 const chordAt=(b,st)=>{const a=prog[Math.min(b,prog.length-1)];return a.length>1&&st>=8?a[1]:a[0]};
 const bassOf=(ch,b)=>{let x=ch[0]+kb(b);while(x>45)x-=12;while(x<28)x+=12;return x};
 const voice=(ch,b)=>ch[1].map(n=>n+kb(b));
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
 for(const[b,st,mi,l,v,who]of notes)ev.push({t:T(b,st),k:who==='lead'?'mel':'vib',m:mi,d:l*s16,v});   // (the head's vibes double is left out: no voices to spare)
 if(pl.rest)for(let b=0;b<bars;b++){const v=voice(chordAt(b,0),b).map(n=>n+12),ord=b%2?[3,1,2,0]:[0,2,1,3];
  for(const[q,st]of[[0,0],[1,3],[2,6],[3,10]])ev.push({t:T(b,st),k:'brk',m:v[ord[q]],d:3*s16,v:0.7})}
 for(let b=0;b<bars;b++){const two=prog[b].length>1,pat=two?[[0,0,6],[6,7,2],[8,0,6],[14,7,2]]:[[0,0,6],[6,7,2],[8,7,6],[14,0,2]];
  const walkUp=!two&&b<bars-1&&u(r)<(sc.bed.walkUp||0);
  for(const[st,iv,l]of pat){const rt=bassOf(chordAt(b,st),b);let m=rt+iv;if(m>47)m-=12;if(st===14&&walkUp)m=bassOf(chordAt(b+1,0),b+1)-1;
   ev.push({t:T(b,st),k:'bass',m,d:l*s16*0.9,v:0.95},{t:T(b,st),k:'kick',m:0,d:0,v:st%8===0?1:0.6})}
  for(const st of(b%2?[2,6,8,12,14]:[0,3,6,10,12]))ev.push({t:T(b,st),k:'comp',m:0,ms:voice(chordAt(b,st),b),d:2*s16,v:0.7});
  for(const st of(b%2?[4,10]:[0,6,12]))ev.push({t:T(b,st),k:'rim',m:0,d:0,v:0.9});
  if(b===bars-1&&!pl.head&&u(r)<(sc.bed.fill||0))for(const st of[13,15])ev.push({t:T(b,st),k:'rim',m:0,d:0,v:0.6});
  for(let st=0;st<16;st++)ev.push({t:T(b,st),k:'shk',m:0,d:0,v:st%2?1:0.6});
  if((b===3||b===bars-1)&&u(r)<mx.bleep.prob){const tg=b===3?harmony(chordAt(4,0),kf).tones:new Set([7,11,2].map(x=>pc(x+fold(pl.next))));
   let p=near(85+kf,tg);for(const st of[13,14,15]){ev.push({t:T(b,st),k:'bleep',m:p,d:0.06,v:0.8});p=walk(p,1,tg)}}}
 const chord=b=>{const ch=chordAt(b,0);return{root:pc(ch[0]+kb(b)),tones:harmony(ch,kb(b)).tones}};
 return{ev,plan:pl,chord}};
// ---- the same notes on one chip
const into=(m,[lo,hi])=>{while(m>hi)m-=12;while(m<lo)m+=12;return m};
M.loungeChipEvents=(sc,seed,i,speech)=>{const L=M.loungeEvents(sc,seed,i),R=C[sc.chip].range,s16=60/sc.bpm/4,ev=[],[lo,hi]=R.lead,AR=R.arp||R.lead;
 const SH=12*Math.round(((lo+hi)/2-77.5)/12);   // the tune moves by whole octaves toward the chip's lead register (Lounge's sits around 69–86)
 const put=(e,part,rg,o=0)=>ev.push({t:e.t,part,m:into(e.m+SH,rg)+o,d:e.d*0.95,v:Math.min(1,e.v)});
 const chord=(e,part,rg,d,v)=>e.ms.forEach(m=>ev.push({t:e.t,part,m:rg?into(m,rg):m,d,v}));
 const lead=e=>put(e,'lead',R.lead);
 const X={   // where each Lounge line goes on this chip (missing = the chip can't play it)
  fm:    {mel:lead,vib:e=>put(e,'arp',R.lead,-12),brk:e=>put(e,'arp',R.lead,-12),bleep:e=>put(e,'arp',R.lead,-12),comp:e=>chord(e,'pad',null,3*s16,0.6),rim:'snare',shk:1},   // the glass bell sounds an octave up
  tia:   {mel:lead,vib:lead,rim:'hat'},
  beep:  {mel:lead,vib:lead,brk:e=>put(e,'arp',AR),comp:e=>e.ms.slice(-3).forEach((m,k)=>ev.push({t:e.t+k*s16/2,part:'arp',m:into(m,AR),d:s16/2,v:0.6})),rim:'tom'},
  snes:  {mel:lead,vib:lead,brk:e=>put(e,'arp',AR),bleep:e=>put(e,'arp',AR),comp:e=>chord(e,'arp',AR,2*s16,0.55),rim:'snare',shk:1},
  arcade:{mel:lead,vib:e=>put(e,'arp',AR),brk:e=>put(e,'arp',AR),bleep:e=>put(e,'arp',AR),comp:e=>chord(e,'lead2',null,2*s16,0.5),rim:'snare',shk:1}}[sc.chip]||{mel:lead,vib:lead};
 for(const e of L.ev)switch(e.k){
  case 'bass':ev.push({t:e.t,part:'bass',m:into(e.m,R.bass),d:e.d,v:1});break;
  case 'kick':if(e.v===1)ev.push({t:e.t,part:'kick',m:0,d:0,v:0.7});break;     // beats 1 and 3 only (Lounge's soft kick follows every bass note)
  case 'rim':if(X.rim)ev.push({t:e.t,part:X.rim,m:84,d:0,v:0.39*e.v});break;    // clave: a soft rim / tick / blip
  case 'shk':if(X.shk)ev.push({t:e.t,part:'hat',m:0,d:0,v:e.v===1?0.5:0.35});break;
  default:if(X[e.k])X[e.k](e)}
 // Dud speech on the 32nd grid from Lounge's chord tones near the top of the lead range; the last three notes fall (as the chip style)
 const r=P.rng(H(seed^0x5bee,i));
 for(const sp of (speech||[])){const d32=s16/2,n=Math.round(sp.d/d32),b=Math.min(7,Math.floor(sp.t/(16*s16))),c=L.chord(b),pool=[];
  for(let x=hi-12;x<=hi;x++){const q=pc(x-c.root);if(c.tones.has(pc(x))||q===2||q===9)pool.push(x)}let k=pool.length>>1;
  for(let j=0;j<n;j++){if(j<n-3)k=Math.max(0,Math.min(pool.length-1,k+Math.round(r()*2.2)));else k=Math.max(0,k-1);if(j<n-3&&u(r)>0.9)continue;
   const t=Math.round(sp.t/d32)*d32+j*d32;ev.push({t,part:'speech',m:pool[k],d:d32*0.8,v:1})}}
 return ev.sort((a,b)=>a.t-b.t)};
M.styles.loungechip=function*(sc,o){const sr=o.sr||48000,seed=o.seed||sc.seed||1,i=o.index||0,len=M.sectionLen(sc),N=Math.round((len+sc.tail)*sr),ch=C[sc.chip];
 const mono=yield* ch.render(M.loungeChipEvents(sc,seed,i,o.speech),N,sr,sc.bpm,sc);
 const hp=P.rbjHighpass(ch.post.hp,0.7,sr),lp=P.svf(),g=P.db(sc.master_db||0),L=new Float32Array(N);
 for(let j=0;j<N;j++)L[j]=g*lp(hp(mono[j]),ch.post.lp,0.7,sr);
 const f=Math.round(0.005*sr);for(let j=0;j<f;j++){L[j]*=j/f;L[N-1-j]*=j/f}   // de-click the section edges
 return{index:i,sr,len,L,R:Float32Array.from(L)}};
})(globalThis);
