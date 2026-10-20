/* audio__style-rounds.js: style "rounds" (load after audio__arranger.js). See score__corporate-calm.json. */
(function(G){'use strict';
const P=G.DHS.dsp,I=G.INSTR,M=G.MUSIC;
// ---------------------------------------------------------------- style "rounds"
// The 20-min study loop: 12 rounds x 9 "airs" x 4 bars, each air developed by a variation (o, s1, s-1, inv, retro, disp, oct, thin, aug),
// a 6-bar drift after every blockEvery rounds, block keys cycling. The original streams with persistent effect state; here every
// 2-bar section (score.bars) is stateless: the plan section holding it is rendered with FRESH effects plus a ring-out tail, and the
// section returns its own slice (the last slice of a plan section also carries the ring-out). Reverb/echo/EQ are linear, so players that
// overlap-add sections reproduce the stream. A one-entry cache keeps neighbouring sections from re-rendering the same plan section.
const RC={sc:null,sr:0,p:-1,db:0,y:null};
const roundsPlan=sc=>{const plan=[],A=sc.airs;let bar=0;
 sc.rounds.forEach((lead,r)=>{const calm=lead[0]===sc.calmLead,mx=calm?sc.mix.calm:sc.mix.normal,key=sc.blockKey[Math.floor(r/sc.blockEvery)],prog=sc.progOrder[r%sc.progOrder.length];
  A.forEach((air,mi)=>{plan.push({mi,round:r,air,key,prog,bar0:bar,bars:sc.airBars,sec:{kick:mx.kick,snap:mx.snap,shk:mx.shk,bass:mx.bass,lead,lvl:mx.lvl}});bar+=sc.airBars});
  if(r%sc.blockEvery===sc.blockEvery-1){const d=sc.drift;plan.push({mi:0,round:r,air:A.find(a=>a.id===d.air),key,prog:d.prog,bar0:bar,bars:d.bars,sec:{kick:d.mix.kick,snap:d.mix.snap,shk:d.mix.shk,bass:d.mix.bass,lead:d.lead,lvl:d.mix.lvl}});bar+=d.bars}});
 return plan};
const roundsSection=function*(sc,plan,idx,sr){
 const S=plan[idx],s=S.sec,air=S.air,key=S.key,bd=sc.bed,fx=sc.fx,rg=sc.ranges,stepN=Math.round(sr*60/sc.bpm/4),STEP=stepN,BAR=stepN*16,stepS=STEP/sr,barS=BAR/sr;
 const n=S.bars*BAR,TAIL=Math.round(fx.srcTail*sr),N=n+TAIL,drums=P.bus(N),bass=P.bus(N),pad=P.bus(N),lead=P.bus(N),wet=P.bus(N);
 const at=(b,st)=>b*BAR+Math.round(st*STEP),hr=P.rng(bd.rngSeed+idx),odd=S.round%2===1;
 const CH=sc.chords,chordAt=b=>CH[sc.progs[S.prog][b%4]],tr=(m,k,lo,hi)=>{m+=k;while(m>hi)m-=12;while(m<lo)m+=12;return m};
 const PC=sc.scale.pc,R0=sc.scale.root,toDeg=m=>{const o=Math.floor((m-R0)/12),r=(((m-R0)%12)+12)%12;let k=0;PC.forEach((v,j)=>{if(r>=v)k=j});return o*5+k},fromDeg=d=>R0+Math.floor(d/5)*12+PC[((d%5)+5)%5];
 const X={o:n=>n,s1:n=>n.map(([s,m,l,v])=>[s,fromDeg(toDeg(m)+1),l,v]),'s-1':n=>n.map(([s,m,l,v])=>[s,fromDeg(toDeg(m)-1),l,v]),
  inv:n=>{const p=toDeg(n[0][1]);return n.map(([s,m,l,v])=>[s,fromDeg(2*p-toDeg(m)),l,v])},
  retro:n=>{const ms=n.map(x=>x[1]).reverse();return n.map(([s,,l,v],i)=>[s,ms[i],l,v])},
  disp:n=>n.map(([s,m,l,v])=>[(s+3)%32,m,l,v]),oct:n=>n.map(([s,m,l,v],i)=>[s,m+(i%3===1?12:0),l,v]),
  thin:n=>n.filter((_,i)=>i%2===0).map(([s,m,l,v])=>[s,m,Math.max(l,4),v*0.85]),aug:n=>n.map(([s,m,l,v])=>[s*2,m,l*2,v])};
 const fit=(notes,k0,lo,hi)=>{let k=k0;const ms=notes.map(x=>x[1]);while(Math.max(...ms)+k>hi)k-=12;while(Math.min(...ms)+k<lo)k+=12;return notes.map(([s,m,l,v])=>[s,m+k,l,v])};
 const kick=yield* I.kick(sr),snap=yield* I.snap(sr),shk=[];for(const sd of bd.shaker.seeds)shk.push(yield* I.shaker(sr,1,sd));
 const bassPat=odd?bd.bass.oddRound:bd.bass.evenRound,sh=bd.shaker;
 for(let b=0;b<S.bars;b++){const ch=chordAt(b);
  if(s.kick){for(const[st,g]of bd.kick.hits)P.write(drums,kick,at(b,st),g*s.kick);if(odd&&b%2)P.write(drums,kick,at(b,bd.kick.oddRound[0]),bd.kick.oddRound[1]*s.kick)}
  if(s.snap){for(const st of bd.snap.steps){P.write(drums,snap,at(b,st),bd.snap.gain*s.snap,bd.snap.pan);P.write(wet,snap,at(b,st),bd.snap.wet*s.snap)}}
  for(let st=0;st<16;st++)P.write(drums,shk[st%shk.length],at(b,st)+Math.round(hr()*sh.jitter*sr),s.shk*sh.mul*sh.pattern[st%sh.pattern.length]*(1+sh.vary*hr()),sh.pan);
  if(s.bass)for(const[st,iv,len,v]of bassPat)P.write(bass,yield* I.filmBass(sr,tr(ch.b,key,rg.bass[0],rg.bass[1])+iv,len*stepS*bd.bass.durMul,v),at(b,st),bd.bass.gain*s.bass);
  for(const m of ch.pad){const[l,r]=yield* I.filmPad(sr,tr(m,key,rg.pad[0],rg.pad[1]),barS,(S.bar0+b)*barS);P.write(pad,l,at(b,0),bd.pad.gain,-bd.pad.pan);P.write(pad,r,at(b,0),bd.pad.gain,bd.pad.pan)}
  yield}
 // lead: the air, developed
 let off=0;const inst=air.inst;
 for(let pi=0;pi<s.lead.length;pi++){const t=s.lead[pi],span=t==='aug'?64:32;
  if(inst==='pluck'||inst==='pulse'){const pat=sc.arp[t],every=inst==='pluck'?2:1;
   for(let st=0;st<span;st+=every){const k=pat[(st/every)%8];if(k<0)continue;const b=Math.floor((off+st)/16),ch=chordAt(b),m=tr(ch.pad[k]+12,key,rg.arp[0],rg.arp[1]),v=(st%8===0?1:0.75)*(1+0.08*hr());
    P.write(lead,inst==='pluck'?yield* I.pluck(sr,m,0,v,idx*64+st):yield* I.pulse(sr,m,stepS*0.9,v),at(0,off+st),1)}}
  else if(inst==='keys'){for(let k=0;k<air.stabs.length;k++){const[st,len,v]=air.stabs[k];
   if(t==='thin'&&k%2)continue;if(t==='aug'&&k%4)continue;
   const s2=(t==='aug'?st*2:st)+(t==='disp'?1:0),b=Math.floor((off+s2)/16),ch=chordAt(b);
   let vo=ch.pad.map(m=>tr(m+12,key,rg.keys[0],rg.keys[1]));if(t!=='o'&&t!=='thin'&&t!=='aug')vo=vo.slice(1).concat([vo[0]+12]);
   for(let q=0;q<vo.length;q++)P.write(lead,yield* I.keys(sr,vo[q],(t==='aug'?6:len)*stepS*0.9,v*(q===3?1:0.7)),at(0,off+s2),0.5)}}
  else{const nn=fit(X[t](air.notes),key,rg.fit[0],rg.fit[1]);
   for(const[st,m,len,v]of nn)P.write(lead,yield* I[inst](sr,m,len*stepS*0.92,v*(1+0.06*hr())*(t==='thin'?1-pi*0.12:1)),at(0,off+st),1)}
  if(inst==='mallet')for(let st=2;st<span;st+=4)P.write(lead,yield* I.woodblock(sr),at(0,off+st),0.3,0.4);
  off+=span;yield}
 {const k=P.kweight(sr);let e=0;for(let i=0;i<n;i++){const x=k((lead.L[i]+lead.R[i])*0.5);e+=x*x;if((i&65535)===65535)yield}
  const g=P.db((sc.leadTarget===undefined?-18:sc.leadTarget)+(s.lvl||0)-10*Math.log10(e/n+1e-20));for(let i=0;i<N;i++){lead.L[i]*=g;lead.R[i]*=g}}
 // sums: dry, reverb send, echo send
 const dry=P.bus(N),echo=P.bus(N),ld=fx.lead,pn=ld.pan[S.mi%2];[drums,bass,pad].forEach(b=>P.mixInto(dry,b));
 const cl=Math.cos((pn+1)*Math.PI/4),cr=Math.sin((pn+1)*Math.PI/4);
 for(let i=0;i<N;i++){const l=(lead.L[i]+lead.R[i])*0.5;dry.L[i]+=l*cl*Math.SQRT2;dry.R[i]+=l*cr*Math.SQRT2;wet.L[i]+=l*ld.send;wet.R[i]+=l*ld.send;echo.L[i]+=l*ld.echo;echo.R[i]+=l*ld.echo;if((i&65535)===65535)yield}
 // effects on a fresh state, run on past the end of the sources so the ring-out is kept; output = this plan section alone
 const M2=N+Math.round((sc.tail-fx.srcTail)*sr),Lo=new Float32Array(M2),Ro=new Float32Array(M2),gm=P.db(sc.master_db||0),e=fx.echo,rv=fx.reverb,eqc=fx.bus,cp=fx.clip;
 const dly=P.delay({sr,time:(60/sc.bpm)*e.time,fb:e.fb,lp:e.lp})(),rev=P.reverb({sr,size:rv.size,damp:rv.damp,hp:rv.hp,lp:rv.lp})();
 const eq=[P.rbjHighpass(eqc.hp,0.7,sr),P.rbjHighpass(eqc.hp,0.7,sr),P.rbjShelfHi(eqc.shelfHz,eqc.shelfDb,sr),P.rbjShelfHi(eqc.shelfHz,eqc.shelfDb,sr)];
 const clip=x=>{if(!cp)return x;const a=Math.abs(x);return a<=cp.th?x:Math.sign(x)*(cp.th+(cp.c-cp.th)*Math.tanh((a-cp.th)/(cp.c-cp.th)))};
 for(let i=0;i<M2;i++){const inn=i<N;
  const[el,er]=dly(inn?echo.L[i]:0,inn?echo.R[i]:0),[rl,rr]=rev((inn?wet.L[i]:0)+el*e.toReverb,(inn?wet.R[i]:0)+er*e.toReverb);
  Lo[i]=clip(eq[2](eq[0]((inn?dry.L[i]:0)+el*e.toMix+rl*rv.mix))*gm);Ro[i]=clip(eq[3](eq[1]((inn?dry.R[i]:0)+er*e.toMix+rr*rv.mix))*gm);if((i&16383)===16383)yield}
 return{L:Lo,R:Ro}};
const rounds=function*(sc,o){
 const sr=o.sr||48000,hb=sc.bars,plan=roundsPlan(sc),last=plan[plan.length-1],chunks=(last.bar0+last.bars)/hb,k=(((o.index||0)%chunks)+chunks)%chunks,bar=k*hb;
 const p=plan.findIndex(S=>bar>=S.bar0&&bar<S.bar0+S.bars),S=plan[p],BAR=Math.round(sr*60/sc.bpm/4)*16;
 if(!(RC.sc===sc&&RC.sr===sr&&RC.p===p&&RC.db===sc.master_db&&RC.y)){RC.y=null;const y=yield* roundsSection(sc,plan,p,sr);RC.sc=sc;RC.sr=sr;RC.p=p;RC.db=sc.master_db;RC.y=y}
 const y=RC.y,a=(bar-S.bar0)*BAR,b=(bar+hb>=S.bar0+S.bars)?y.L.length:a+hb*BAR;
 return{index:o.index||0,sr,len:hb*BAR/sr,L:y.L.slice(a,b),R:y.R.slice(a,b)}};
rounds.loopSections=sc=>{const pl=roundsPlan(sc),l=pl[pl.length-1];return(l.bar0+l.bars)/sc.bars};
M.styles.rounds=rounds;
})(globalThis);