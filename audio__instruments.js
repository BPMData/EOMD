/* audio__instruments.js: shared instrument library on DHS.dsp (engine__src__audio__dsp.js).
   Every instrument is a generator: (sr, midi, durSeconds, velocity, ...) → yields every 8k samples, returns Float32Array
   (pad returns [L, R]). Use with `yield*` inside a generator, or INSTR.now(gen) to run one to completion.
   Soft attacks and dark tops throughout: these were tuned for silent-reading rooms.
   Second family at the bottom ("film" voices, ported 1:1 from the Academies hallway film): drums + leads + filmBass/filmPad/filmChime.
   Drums take (sr, v[, seed]) with no pitch; filmPad takes (sr, midi, dur, t0, v) where t0 = absolute seconds (drives the filter breathing). */
(function(G){'use strict';
const P=G.DHS.dsp,TAU=Math.PI*2,I=(G.INSTR={});
const arr=function*(n,fn){const b=new Float32Array(n);for(let i=0;i<n;i++){b[i]=fn(i);if((i&8191)===8191)yield}return b};
const rel=(i,g,sr,sec)=>{if(i<=g)return 1;const k=(i-g)/(sec*sr);return k>=1?0:(1-k)*(1-k)};
I.now=g=>{let x;while(!(x=g.next()).done);return x.value};
// Rhodes-style FM electric piano
I.rhodes=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round((dur+0.6)*sr),g=Math.round(dur*sr),tau=Math.min(3.2,Math.max(1.2,2.6*Math.pow(220/f,0.35))),lp=P.onepole();let pc=0,pm=0;
 return yield* arr(n,i=>{const t=i/sr;pc=(pc+f/sr)%1;pm=(pm+f/sr)%1;const ix=0.12+(0.5+0.8*v)*Math.exp(-t/0.25);
  const a=Math.min(1,t/0.006)*(0.75*Math.exp(-t/tau)+0.25*Math.exp(-t/(tau*0.25)))*rel(i,g,sr,0.35);
  return v*a*(1+0.08*Math.sin(TAU*4.2*t))*lp(Math.sin(TAU*pc+ix*Math.sin(TAU*pm)),2600,sr)})};
// vibraphone: sine + soft 4th partial, slow motor tremolo
I.vibes=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round((dur+0.6)*sr),g=Math.round(dur*sr),lp=P.onepole();let p1=0,p2=0;
 return yield* arr(n,i=>{const t=i/sr;p1=(p1+f/sr)%1;p2=(p2+4*f/sr)%1;
  const x=Math.sin(TAU*p1)*Math.exp(-t/2.4)+0.07*Math.sin(TAU*p2)*Math.exp(-t/0.18);
  return v*Math.min(1,t/0.008)*rel(i,g,sr,0.5)*(1+0.22*Math.sin(TAU*3.2*t))*lp(x,3000,sr)})};
// warm detuned-saw pad, stereo [L,R], slow 1.6 s attack
I.pad=function*(sr,m,dur,v=1,cut=700){const f=P.mtof(m),n=Math.round((dur+2.5)*sr),e=P.adsr(n,sr,1.6,1,0.85,2.2,Math.round(dur*sr));
 const side=function*(d1,d2,s){const lp=P.svf();let p1=s*.37%1,p2=s*.61%1;const f1=f*Math.pow(2,d1/1200),f2=f*Math.pow(2,d2/1200);
  return yield* arr(n,i=>{p1=(p1+f1/sr)%1;p2=(p2+f2/sr)%1;const t=i/sr;return v*e[i]*lp(P.saw(p1,f1/sr)+P.saw(p2,f2/sr),cut*(1+0.15*Math.sin(TAU*t/9+s)),0.6,sr)*0.5})};
 return[yield* side(-7,5,m),yield* side(6,-4,m+1)]};
// soft sine bass with a little saw, lowpassed
I.bass=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round((dur+0.6)*sr),e=P.adsr(n,sr,0.03,0.8,0.7,0.4,Math.round(dur*sr)),lp=P.svf();let ph=0;
 return yield* arr(n,i=>{ph=(ph+f/sr)%1;return v*e[i]*lp(Math.sin(TAU*ph)+0.18*P.saw(ph,f/sr),320,0.7,sr)})};
// soft-hammer additive piano (8 inharmonic partials, 2 detuned strings, two-stage decay)
I.piano=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round((dur+0.4)*sr),g=Math.round(dur*sr),B=0.00035,tau1=Math.min(6,Math.max(1.2,4*Math.pow(261.6/f,0.5))),out=new Float32Array(n);
 for(let k=1;k<=8;k++){const fk=k*f*Math.sqrt(1+B*k*k);if(fk>sr*0.4)break;const a=Math.pow(k,-1.6)*(k===1?1:0.35+0.65*v),tau=tau1/(1+0.55*(k-1)),d1=fk/sr,d2=fk*Math.pow(2,(0.7+0.1*k)/1200)/sr;let p1=0,p2=0;
  for(let i=0;i<n;i++){const t=i/sr;p1+=d1;p2+=d2;out[i]+=a*(0.7*Math.exp(-t/tau)+0.3*Math.exp(-t/(tau*3)))*(Math.sin(TAU*p1)+Math.sin(TAU*p2))*0.5}yield}
 const lp=P.onepole(),att=0.004+0.01*(1-v);for(let i=0;i<n;i++){const t=i/sr;out[i]=v*Math.min(1,t/att)*rel(i,g,sr,0.3)*lp(out[i],1800+2200*v,sr)}
 return out};
// breathy pan flute (Bryan found it distracting for SSR; kept for other moods)
I.flute=function*(sr,m,dur,v=1,seed=5){const f=P.mtof(m),n=Math.round((dur+0.6)*sr),e=P.adsr(n,sr,0.2,0.3,0.85,0.45,Math.round(dur*sr)),r=P.rng(seed*31+m),bp=P.svf(),lp=P.svf(),hp=P.svf();let ph=0;
 return yield* arr(n,i=>{const t=i/sr,vib=1+0.004*Math.sin(TAU*4.6*t)*Math.min(1,Math.max(0,(t-0.4)/0.6));ph=(ph+f*vib/sr)%1;const nz=r();
  const breath=bp(nz,f,5,sr,'bp')*0.35+hp(nz,2500,0.7,sr,'hp')*0.03*Math.exp(-t/0.08);
  return v*e[i]*lp(Math.sin(TAU*ph)+0.12*Math.sin(2*TAU*ph)+0.05*Math.sin(3*TAU*ph)+breath,3200,0.7,sr)})};
// very soft sine chime (dur ignored; 5 s ring)
I.chime=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round(5*sr);let p1=0,p2=0;
 return yield* arr(n,i=>{const t=i/sr;p1=(p1+f/sr)%1;p2=(p2+2.01*f/sr)%1;return v*Math.min(1,t/0.006)*(Math.sin(TAU*p1)*Math.exp(-t/1.8)+0.18*Math.sin(TAU*p2)*Math.exp(-t/0.6))*(i>n-480?(n-i)/480:1)})};
// filtered-noise stream/wind bed (seconds long, not a note)
I.stream=function*(sr,seconds,seed=11){const r=P.rng(seed),b1=P.svf(),b2=P.svf();
 return yield* arr(Math.round(seconds*sr),i=>{const t=i/sr,x=r(),m=0.6+0.25*Math.sin(TAU*0.071*t+seed)+0.15*Math.sin(TAU*0.13*t+2*seed);return m*(b1(x,520,0.8,sr,'bp')+0.35*b2(x,1500,1.4,sr,'bp'))*0.5})};
/* ---- film voices (Academies hallway film, 96 BPM). Same maths as the film's music.js; the generator wrapper only adds yields. ---- */
const fm=function*(sr,f,n,ratio,idx0,idx1,idxDec,amp){let pc=0,pm=0;return yield* arr(n,i=>{const t=i/sr;pm=(pm+f*ratio/sr)%1;const ix=idx1+(idx0-idx1)*Math.exp(-t/idxDec);pc=(pc+f/sr)%1;return Math.sin(TAU*pc+ix*Math.sin(TAU*pm))*amp[i]})};
// drums (no pitch): kick (sr,v), snap (sr,v), shaker (sr,v,seed), woodblock (sr,v)
I.kick=function*(sr,v=1){const n=Math.round(0.45*sr),r=P.rng(7),lp=P.onepole();let ph=0;
 return yield* arr(n,i=>{const t=i/sr;ph+=(48+95*Math.exp(-t/0.035))/sr;const a=Math.min(1,i/(0.0015*sr))*Math.exp(-t/0.2);
  return v*(Math.sin(TAU*ph)*a+lp(r(),1800,sr)*0.25*Math.exp(-t/0.004))})};
I.snap=function*(sr,v=1){const n=Math.round(0.3*sr),r=P.rng(11),bp=P.svf(),lp=P.onepole();
 return yield* arr(n,i=>{const t=i/sr;const burst=[0,0.008,0.017].reduce((s,o)=>s+(t>=o?Math.exp(-(t-o)/0.006):0),0)*0.55+Math.exp(-t/0.075);
  return v*lp(bp(r(),1350,1.1,sr,'bp'),4200,sr)*burst*Math.min(1,i/40)})};
I.shaker=function*(sr,v=1,seed=3){const n=Math.round(0.12*sr),r=P.rng(seed),bp=P.svf(),lp=P.onepole();
 return yield* arr(n,i=>{const t=i/sr;const a=(t<0.01?t/0.01:Math.exp(-(t-0.01)/0.035));return v*lp(bp(r(),5200,0.8,sr,'bp'),7500,sr)*a})};
I.woodblock=function*(sr,v=1){const n=Math.round(0.09*sr);let ph=0;return yield* arr(n,i=>{const t=i/sr;ph=(ph+(820-120*t/0.09)/sr)%1;return v*Math.sin(TAU*ph)*Math.exp(-t/0.018)*Math.min(1,i/30)})};
// film bed (named so the silent-reading bass/pad/chime above are untouched)
I.filmBass=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round((dur+0.12)*sr),g=Math.round(dur*sr),e=P.adsr(n,sr,0.006,0.22,0.6,0.09,g),lp=P.svf();let ph=0;
 return yield* arr(n,i=>{ph=(ph+f/sr)%1;const t=i/sr;const x=Math.sin(TAU*ph)+0.32*P.saw(ph,f/sr);return v*e[i]*lp(x,380+700*Math.exp(-t/0.08),0.9,sr)})};
I.filmPad=function*(sr,m,dur,t0,v=1){const f=P.mtof(m),n=Math.round((dur+0.9)*sr),e=P.adsr(n,sr,0.35,0.6,0.82,0.8,Math.round(dur*sr));
 const side=function*(d1,d2,seed){const lp=P.svf();let p1=seed*0.37%1,p2=seed*0.61%1;const f1=f*Math.pow(2,d1/1200),f2=f*Math.pow(2,d2/1200);
  return yield* arr(n,i=>{p1=(p1+f1/sr)%1;p2=(p2+f2/sr)%1;const tt=t0+i/sr;const fc=900+350*Math.sin(TAU*tt/10);return v*e[i]*lp(P.saw(p1,f1/sr)+P.saw(p2,f2/sr),fc,0.75,sr)*0.5})};
 return[yield* side(-9,4,m),yield* side(8,-3,m+1)]};
I.filmChime=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round(1.4*sr);let p=0;
 return yield* arr(n,i=>{const t=i/sr;p=(p+f/sr)%1;const a=Math.min(1,i/(0.004*sr));
  return v*a*(Math.sin(TAU*p)*Math.exp(-t/0.5)+0.3*Math.sin(2*TAU*p)*Math.exp(-t/0.18)+0.08*Math.sin(3*TAU*p)*Math.exp(-t/0.08))})};
// leads (the film's per-academy colours)
I.tine=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round((dur+0.9)*sr),a=P.perc(n,sr,0.003,0.42);const b=yield* fm(sr,f,n,1,1.8,0.25,0.18,a);for(let i=0;i<n;i++)b[i]*=v;return b};
I.marimba=function*(sr,m,dur,v=1){const f=P.mtof(m-12),n=Math.round(0.8*sr);let p1=0,p2=0;
 return yield* arr(n,i=>{const t=i/sr;p1=(p1+f/sr)%1;p2=(p2+3.93*f/sr)%1;const a=Math.min(1,i/(0.002*sr));
  return v*a*(Math.sin(TAU*p1)*Math.exp(-t/0.28)+0.35*Math.sin(TAU*p2)*Math.exp(-t/0.035))})};
I.pluck=function*(sr,m,dur,v=1,seed=1){ // Karplus-Strong with allpass fine-tuning (dur ignored)
 const f=P.mtof(m),per=sr/f-0.5,L=Math.floor(per),fr=per-L,c=(1-fr)/(1+fr),n=Math.round(1.6*sr);
 const r=P.rng(seed+m),line=new Float32Array(L),lp=P.onepole();for(let i=0;i<L;i++)line[i]=lp(r(),2600,sr);
 let idx=0,apx=0,apy=0,prev=0;const out=new Float32Array(n);
 for(let i=0;i<n;i++){const x=line[idx];const y=0.5*(x+prev)*0.9965;prev=x;const ap=c*y+apx-c*apy;apx=y;apy=ap;line[idx]=ap;if(++idx>=L)idx=0;out[i]=v*x*(i<64?i/64:1);if((i&8191)===8191)yield}
 return out};
I.pulse=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round((dur+0.25)*sr),e=P.adsr(n,sr,0.004,0.12,0.35,0.12,Math.round(dur*sr)),lp=P.svf();let ph=0;
 return yield* arr(n,i=>{const t=i/sr;ph=(ph+f/sr)%1;return v*e[i]*lp(P.square(ph,f/sr,0.36),700+1500*Math.exp(-t/0.07),1.1,sr)*0.6})};
I.keys=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round((dur+0.8)*sr),a=P.adsr(n,sr,0.004,0.9,0.25,0.35,Math.round(dur*sr));const b=yield* fm(sr,f,n,1,1.4,0.2,0.12,a);for(let i=0;i<n;i++)b[i]*=v*(1+0.12*Math.sin(TAU*4.5*i/sr));return b};
I.mallet=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round(1.3*sr);let p1=0,p2=0;
 return yield* arr(n,i=>{const t=i/sr;p1=(p1+f/sr)%1;p2=(p2+4*f/sr)%1;const a=Math.min(1,i/(0.003*sr));
  return v*a*(Math.sin(TAU*p1)*Math.exp(-t/0.55)*(1+0.18*Math.sin(TAU*5.2*t))+0.18*Math.sin(TAU*p2)*Math.exp(-t/0.05))})};
I.voice=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round((dur+0.4)*sr),e=P.adsr(n,sr,0.12,0.3,0.85,0.3,Math.round(dur*sr)),f1=P.svf(),f2=P.svf(),lp=P.svf();let ph=0;
 return yield* arr(n,i=>{const t=i/sr;const vib=1+0.0045*Math.sin(TAU*5*t)*Math.min(1,t/0.35);ph=(ph+f*vib/sr)%1;const s=P.saw(ph,f/sr);
  return v*e[i]*(f1(s,330,5,sr,'bp')*1.0+f2(s,780,7,sr,'bp')*0.55+lp(s,500,0.7,sr)*0.25)})};
I.whistle=function*(sr,m,dur,v=1,seed=5){const f=P.mtof(m),n=Math.round((dur+0.25)*sr),e=P.adsr(n,sr,0.04,0.2,0.8,0.16,Math.round(dur*sr)),r=P.rng(seed),bp=P.svf();let ph=0;
 return yield* arr(n,i=>{const t=i/sr;const vib=1+0.006*Math.sin(TAU*5.5*t)*Math.min(1,t/0.25);ph=(ph+f*vib/sr)%1;
  return v*e[i]*(Math.sin(TAU*ph)+0.08*bp(r(),f,4,sr,'bp'))})};
})(globalThis);