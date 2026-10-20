/* audio/style-film24.js: style "film24" (load after audio/arranger.js).
   Style "film24": a fixed, seamless loop (score.bars bars, tail 0) played on circular buffers, ported from the Academies hallway film.
   Constant bed (kick/snap/shaker/bass/pad) + one lead per section, each level-matched, then echo + reverb. Fully deterministic: seed is ignored,
   every section is the same loop, and consecutive sections join with no gap or overlap. Score fields: see score/academies-hallway.json. */
(function(G){'use strict';
const P=G.DHS.dsp,I=G.INSTR,M=G.MUSIC;
// ---------------------------------------------------------------- style "film24"
// Circular stereo process: run twice, keep pass 2 (same as P.circular, but yields so the main-thread fallback stays responsive).
const circ=function*(bus,make){const N=bus.N,out=P.bus(N),proc=make();for(let pass=0;pass<2;pass++)for(let i=0;i<N;i++){const[l,r]=proc(bus.L[i],bus.R[i]);if(pass){out.L[i]=l;out.R[i]=r}if((i&32767)===32767)yield}return out};
const film24=function*(sc,o){
 const sr=o.sr||48000,beat=60/sc.bpm,barS=beat*4,bars=sc.bars,N=Math.round(bars*barS*sr),stepN=Math.round((beat/4)*sr),barN=stepN*16,stepS=beat/4,at=(bar,step)=>bar*barN+Math.round(step*stepN);
 const bd=sc.bed,fx=sc.fx,B={drums:P.bus(N),bass:P.bus(N),pad:P.bus(N),lead:P.bus(N),wet:P.bus(N)},hr=P.rng(bd.seed);
 // --- bed: identical every bar
 const kick=yield* I.kick(sr),snap=yield* I.snap(sr),shk=[];for(const sd of bd.shaker.seeds)shk.push(yield* I.shaker(sr,1,sd));
 const pat=bd.shaker.pattern,sh=bd.shaker;
 for(let b=0;b<bars;b++){
  for(const[s,g,odd]of bd.kick.hits)if(!odd||b%2===1)P.write(B.drums,kick,at(b,s),g);
  for(const s of bd.snap.steps)P.write(B.drums,snap,at(b,s),bd.snap.gain,bd.snap.pan);
  for(const s of bd.snap.steps)P.write(B.wet,snap,at(b,s),bd.snap.wet);
  for(let s=0;s<16;s++)P.write(B.drums,shk[s%shk.length],at(b,s)+Math.round(hr()*sh.jitter*sr),pat[s%pat.length]*(1+sh.vary*hr()),sh.pan);
  const ch=sc.chords[b%sc.chords.length];
  for(const[s,iv,len,v]of bd.bass.notes)P.write(B.bass,yield* I.filmBass(sr,ch.bass+iv,len*stepS*bd.bass.durMul,v),at(b,s),bd.bass.gain);
  for(const m of ch.pad){const[l,r]=yield* I.filmPad(sr,m,barS,b*barS);P.write(B.pad,l,at(b,0),bd.pad.gain,-bd.pad.pan);P.write(B.pad,r,at(b,0),bd.pad.gain,bd.pad.pan)}
  yield}
 // --- leads: each rendered alone, level-matched on K-weighted power inside its own span, then panned + sent
 const lt=o.leadTarget||sc.leadTarget||-18,levels={},echoIn=P.bus(N);
 const kw=function*(bus,bar0,nBars){const kl=P.kweight(sr);let s=0,cnt=0;for(let k=0;k<nBars*barN;k++){const i=(bar0*barN+k)%N;const x=kl((bus.L[i]+bus.R[i])*0.5);s+=x*x;cnt++;if((k&65535)===65535)yield}return 10*Math.log10(s/cnt+1e-20)};
 for(const ld of sc.leads){const bus=P.bus(N);
  for(let k=0;k<ld.notes.length;k++){const n=ld.notes[k],dur=n[2]*stepS*ld.durMul;
   const buf=ld.seeded?yield* I[ld.inst](sr,n[1],dur,n[3],k):yield* I[ld.inst](sr,n[1],dur,n[3]);
   P.write(bus,buf,at(ld.bar0,n[0]),n[4]!==undefined?n[4]:(ld.gain!==undefined?ld.gain:1),n[5]||0)}
  if(ld.hits)for(const s of ld.hits.steps)P.write(bus,yield* I[ld.hits.inst](sr),at(ld.bar0,s),ld.hits.gain,ld.hits.pan);
  const lvl=yield* kw(bus,ld.bar0,ld.bars),g=P.db(lt-lvl)*(ld.trim||1),eg=ld.echo*g;
  levels[ld.id]={before:+lvl.toFixed(1),gainDb:+P.todb(g).toFixed(1)};
  const pl=Math.cos((ld.pan+1)*Math.PI/4)*Math.SQRT2,pr=Math.sin((ld.pan+1)*Math.PI/4)*Math.SQRT2;
  for(let i=0;i<N;i++){const x=(bus.L[i]+bus.R[i])*0.5*g;B.lead.L[i]+=x*pl;B.lead.R[i]+=x*pr;B.wet.L[i]+=x*ld.send;B.wet.R[i]+=x*ld.send;
   const e=(bus.L[i]+bus.R[i])*0.5*eg;echoIn.L[i]+=e;echoIn.R[i]+=e;if((i&65535)===65535)yield}}
 // --- stems into the music bus (same add order as the film), then free them
 const mix=P.bus(N);P.mixInto(mix,B.drums,1);P.mixInto(mix,B.bass,1);P.mixInto(mix,B.pad,1);P.mixInto(mix,B.lead,1);B.drums=B.bass=B.pad=B.lead=null;yield;
 // --- effects, processed circularly
 const echo=yield* circ(echoIn,P.delay({sr,time:beat*fx.echo.time,fb:fx.echo.fb,lp:fx.echo.lp}));P.mixInto(B.wet,echo,fx.echo.toWet);
 const rv=fx.reverb,verb=yield* circ(B.wet,P.reverb({sr,size:rv.size,damp:rv.damp,width:rv.width,hp:rv.hp,lp:rv.lp}));
 P.mixInto(mix,echo,fx.echo.toMix);P.mixInto(mix,verb,rv.mix);yield;
 const eq=fx.bus,music=yield* circ(mix,()=>{const hl=P.rbjHighpass(eq.hp,0.7,sr),hr2=P.rbjHighpass(eq.hp,0.7,sr),sl=P.rbjShelfHi(eq.shelfHz,eq.shelfDb,sr),sr2=P.rbjShelfHi(eq.shelfHz,eq.shelfDb,sr);return(l,r)=>[sl(hl(l)),sr2(hr2(r))]});
 const gm=P.db(sc.master_db||0),L=new Float32Array(N),R=new Float32Array(N);for(let i=0;i<N;i++){L[i]=gm*music.L[i];R[i]=gm*music.R[i]}
 return{index:o.index||0,sr,len:bars*4*beat,L,R,levels}};
film24.loopSections=()=>1;
M.styles.film24=film24;
})(globalThis);