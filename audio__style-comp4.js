/* audio__style-comp4.js: style "comp4" (load after audio__arranger.js).
   Every 2 bars one chord. Pad (3 notes), bass (root + fifth),
   4-note comping stab with an optional answering stab, and a pentatonic lead motif in theme-and-variations form.
   Each section = score.bars bars + score.tail seconds of ring-out; play section k at k*sectionLen and let tails overlap.
 */
(function(G){'use strict';
const P=G.DHS.dsp,I=G.INSTR,M=G.MUSIC;
const u01=r=>(r()+1)/2;
const H=(a,b)=>((Math.imul(a^0x9e3779b9,0x85ebca6b)^Math.imul((b+0x632be5ab)|0,0xc2b2ae35))>>>0);
const CELLS=[[[0,3],[3,1],[4,4]],[[1,2],[3,2],[5,3]],[[0,2],[2,2],[4,1.5],[6,2]],[[0,1.5],[1.5,2.5],[4,4]],[[2,2],[4,1],[5,3]],[[0,4],[4,2],[6,2]]];
const note=(sc,deg)=>{const s=sc.melody.scale,n=s.length,o=Math.floor(deg/n),d=((deg%n)+n)%n;return sc.melody.root+12*o+s[d]};
function theme(sc,r){const cell=CELLS[Math.floor(u01(r)*CELLS.length)%CELLS.length],[lo,hi]=sc.melody.range;let deg=sc.melody.start+Math.round(u01(r)*3);
 return cell.map(([b,d])=>{deg=Math.max(lo,Math.min(hi,deg+[-2,-1,-1,1,1,2,0][Math.floor(u01(r)*7)%7]));return{beat:b,len:d,deg}})}
function vary(sc,th,r){const op=Math.floor(u01(r)*4)%4;let out=th.map(n=>({...n}));
 if(op===0){const s=u01(r)<.5?-1:1;out.forEach(n=>n.deg+=s)}                        // shift a scale step
 else if(op===1){const piv=out[0].deg;out.forEach(n=>n.deg=piv-(n.deg-piv))}       // invert
 else if(op===2)out=out.filter((n,k)=>k===0||k===out.length-1||u01(r)>.4)           // thin out
 else{out.forEach(n=>{n.beat=Math.min(7,n.beat+1)});out[out.length-1].len+=1}       // displace a beat
 const[lo,hi]=sc.melody.range;out.forEach(n=>n.deg=Math.max(lo-1,Math.min(hi+1,n.deg)));return out}
M.params=(sc,seed,i)=>{const m=sc.melody,r=P.rng(H(seed,i)),te=m.themeEvery,k=i%te,tr=P.rng(H(seed^0x51ed,Math.floor(i/te)));let th=theme(sc,tr);for(let j=0;j<k;j++)th=vary(sc,th,r);
 return{r,theme:th,themeNo:Math.floor(i/te),k,prog:(i+Math.floor(i/te))%sc.progressions.length,mel:i%2?[2,6]:[0,4],
  lead:(m.altEvery&&i%m.altEvery===m.altEvery-1)?'alt':'main',rest:!!(m.restEvery&&i%m.restEvery===m.restEvery-1),comp:sc.comp.prob[0]+sc.comp.prob[1]*u01(r)}};
const comp4=function*(sc,o){const sr=o.sr||48000,seed=o.seed||1,i=o.index||0,beat=60/sc.bpm,bars=sc.bars,len=bars*4*beat,N=Math.round((len+sc.tail)*sr);
 const p=M.params(sc,seed,i),r=p.r,prog=sc.progressions[p.prog],dry=P.bus(N),wet=P.bus(N),pd=sc.pad,bs=sc.bass,cp=sc.comp,m=sc.melody;
 const put=(buf,pos,g,pan=0,send=.3)=>{const a=Math.round(pos*beat*sr);P.write(dry,buf,a,g,pan);if(send)P.write(wet,buf,a,g*send,pan)};
 let mi=0;
 for(let b=0;b<bars;b+=2){const[root,v]=prog[(b/2)%prog.length],p0=b*4;
  for(const n of[root+12,v[0],v[2]]){const[l,rr]=yield* I.pad(sr,n,8*beat,1,pd.cut);put(l,p0,pd.gain,-.6,pd.send);put(rr,p0,pd.gain,.6,pd.send);yield}
  put(yield* I.bass(sr,root,6*beat,.8),p0,bs.gain,0,bs.send);put(yield* I.bass(sr,root+7>45?root-5:root+7,1.8*beat,.5),p0+6,bs.gain2,0,bs.send);
  for(let q=0;q<4;q++)put(yield* I[cp.inst](sr,v[q],5.5*beat,.5+.12*u01(r)),p0+q*.025/beat,cp.gain,-.25+q*.15,cp.send);
  if(u01(r)<p.comp)for(let q=0;q<3;q++)put(yield* I[cp.inst](sr,v[q+1],2*beat,.38),p0+5.5+q*.02/beat,cp.stabGain,-.1+q*.15,cp.send);
  if(!p.rest&&p.mel.includes(b)){const ph=mi++?vary(sc,p.theme,r):p.theme;
   for(const n of ph){const mm=note(sc,n.deg);
    if(p.lead==='main')put(yield* I[m.lead](sr,mm,n.len*beat*.95,.5+.15*u01(r)),p0+n.beat,m.gain,.2,m.send);
    else put(yield* I[m.alt](sr,mm,n.len*beat*.95,.45),p0+n.beat,m.altGain,.2,m.altSend);yield}}}
 const rv=P.reverb({sr,size:sc.reverb.size,damp:.6,width:1,pre:.02,hp:220,lp:4200})(),g=P.db(sc.master_db),wg=sc.reverb.wet;
 const hl=P.rbjHighpass(35,.7,sr),hr=P.rbjHighpass(35,.7,sr),sl=P.rbjShelfHi(5000,-5,sr),sr2=P.rbjShelfHi(5000,-5,sr),L=new Float32Array(N),R=new Float32Array(N);
 for(let j=0;j<N;j++){const w=rv(wet.L[j],wet.R[j]);L[j]=g*sl(hl(dry.L[j]+w[0]*wg));R[j]=g*sr2(hr(dry.R[j]+w[1]*wg));if((j&4095)===4095)yield}
 return{index:i,sr,len,L,R}};
M.styles.comp4=comp4;
})(globalThis);