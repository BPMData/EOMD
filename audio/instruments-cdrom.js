/* audio/instruments-cdrom.js: CD-ROM screensaver voices added to INSTR (Encyclopedia Lounge + Stage 3 auditions).
   Load after audio/instruments.js + audio/instruments-film.js. Same generator contract (yield every 8k samples).
   Adds only new names, so loading it never changes an existing score's sound (regress-safe).
   Pitched: fmEP, slap(…,pop), brass, bleep(…,pw), fmBell, fretless(…,fromMidi), lyricon, triBass, loungeVibes.
   Unpitched (sr, v, …): hat(open,seed), snare, clap, rim, chipKick, chipNoise(dec,rate,seed). */
(function(G){'use strict';
const P=G.DHS.dsp,TAU=Math.PI*2,I=G.INSTR;
const arr=function*(n,fn){const b=new Float32Array(n);for(let i=0;i<n;i++){b[i]=fn(i);if((i&8191)===8191)yield}return b};
const rel=(i,g,sr,sec)=>{if(i<=g)return 1;const k=(i-g)/(sec*sr);return k>=1?0:(1-k)*(1-k)};
const tri16=ph=>Math.round((1-4*Math.abs(ph-0.5))*7.5)/7.5;   // 4-bit stepped triangle
// DX-style FM electric piano: detuned 1:1 body + 14:1 tine "ding"
I.fmEP=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round((dur+0.5)*sr),g=Math.round(dur*sr),tau=Math.min(2.6,Math.max(0.8,2*Math.pow(260/f,0.4))),lp=P.onepole();let a=0,b=0,d=0;
 return yield* arr(n,i=>{const t=i/sr;a=(a+f/sr)%1;b=(b+f*1.0035/sr)%1;d=(d+14*f/sr)%1;
  const body=Math.sin(TAU*a+(0.35+1.3*v*Math.exp(-t/0.35))*Math.sin(TAU*b));
  const tine=Math.sin(TAU*a+1.6*v*Math.sin(TAU*d))*Math.exp(-t/0.045)*0.4*v;
  const env=Math.min(1,t/0.003)*(0.7*Math.exp(-t/tau)+0.3*Math.exp(-t/(tau*0.2)))*rel(i,g,sr,0.22);
  return v*env*lp(body+tine,5500,sr)*(1+0.06*Math.sin(TAU*5.5*t))})};
// synth slap bass: saw/pulse through a snapping filter + sine body + pick click (pop=1 brighter)
I.slap=function*(sr,m,dur,v=1,pop=0){const f=P.mtof(m),n=Math.round((dur+0.15)*sr),g=Math.round(dur*sr),e=P.adsr(n,sr,0.002,0.18,0.5,0.06,g),lp=P.svf(),bp=P.svf(),r=P.rng(m*7+3),top=900+(pop?3800:2200)*v;let ph=0;
 return yield* arr(n,i=>{const t=i/sr;ph=(ph+f/sr)%1;const x=0.6*P.saw(ph,f/sr)+0.4*P.square(ph,f/sr,0.3);
  const click=bp(r(),pop?2600:1400,1.2,sr,'bp')*Math.exp(-t/0.004)*(pop?1.2:0.7);
  return v*e[i]*(0.7*lp(x,180+top*Math.exp(-t/(pop?0.06:0.035)),1.6,sr)+0.5*Math.sin(TAU*ph)+click)})};
// synth brass: 3 detuned saws, pitch scoop, filter swell
I.brass=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round((dur+0.25)*sr),g=Math.round(dur*sr),e=P.adsr(n,sr,0.012,0.18,0.75,0.14,g),lp=P.svf(),det=[-9,0,8].map(c=>Math.pow(2,c/1200)),ph=[0.1,0.5,0.8];
 return yield* arr(n,i=>{const t=i/sr,sc=Math.pow(2,-35*Math.exp(-t/0.03)/1200);let x=0;for(let k=0;k<3;k++){const fk=f*det[k]*sc;ph[k]=(ph[k]+fk/sr)%1;x+=P.saw(ph[k],fk/sr)}
  return v*e[i]*lp(x/3,500+(1800+1400*v)*Math.min(1,t/0.04)*(0.55+0.45*Math.exp(-t/0.25)),0.9,sr)})};
// bleep: pulse wave with delayed vibrato (pw 0.5 square, 0.25/0.125 thinner)
I.bleep=function*(sr,m,dur,v=1,pw=0.25){const f=P.mtof(m),n=Math.round((dur+0.12)*sr),g=Math.round(dur*sr),e=P.adsr(n,sr,0.002,0.08,0.55,0.08,g),lp=P.onepole();let ph=0;
 return yield* arr(n,i=>{const t=i/sr,ff=f*(1+0.012*Math.sin(TAU*5.8*t)*Math.min(1,Math.max(0,(t-0.18)/0.2)));ph=(ph+ff/sr)%1;return v*e[i]*lp(P.square(ph,ff/sr,pw),4200,sr)*0.5})};
// FM bell (3.5:1), for octave doubling
I.fmBell=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round(1.6*sr),lp=P.onepole();let a=0,b=0;
 return yield* arr(n,i=>{const t=i/sr;a=(a+f/sr)%1;b=(b+3.5*f/sr)%1;return v*Math.min(1,t/0.002)*Math.exp(-t/0.5)*lp(Math.sin(TAU*a+2*Math.exp(-t/0.3)*Math.sin(TAU*b)),5000,sr)})};
// fretless bass: sine + 2nd harmonic, slides in from `from` (or a little below)
I.fretless=function*(sr,m,dur,v=1,from=null){const f=P.mtof(m),f0=from==null?f*Math.pow(2,-0.6/12):P.mtof(from),n=Math.round((dur+0.25)*sr),g=Math.round(dur*sr),e=P.adsr(n,sr,0.02,0.4,0.75,0.18,g),lp=P.svf();let ph=0;
 return yield* arr(n,i=>{const t=i/sr,ff=f*Math.pow(f0/f,Math.exp(-t/0.06))*(1+0.004*Math.sin(TAU*5*t)*Math.min(1,t/0.4));ph=(ph+ff/sr)%1;
  return v*e[i]*lp(Math.sin(TAU*ph)+0.35*Math.sin(2*TAU*ph)+0.12*P.saw(ph,ff/sr),700+500*v*Math.exp(-t/0.15),0.8,sr)})};
// lyricon-style soft lead: two saws + sine, scoop, delayed vibrato, a little breath
I.lyricon=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round((dur+0.3)*sr),g=Math.round(dur*sr),e=P.adsr(n,sr,0.04,0.2,0.85,0.22,g),lp=P.svf(),r=P.rng(m+17),bn=P.svf();let p1=0,p2=0;
 return yield* arr(n,i=>{const t=i/sr,ff=f*Math.pow(2,-45*Math.exp(-t/0.05)/1200)*(1+0.005*Math.sin(TAU*5.2*t)*Math.min(1,Math.max(0,(t-0.25)/0.3)));p1=(p1+ff/sr)%1;p2=(p2+ff*1.004/sr)%1;
  const x=0.5*P.saw(p1,ff/sr)+0.3*P.saw(p2,ff/sr)+0.3*Math.sin(TAU*p1);
  return v*e[i]*(lp(x,900+1600*e[i]*v,1.2,sr)+0.04*bn(r(),2*f,3,sr,'bp'))})};
// 4-bit triangle bass (chip)
I.triBass=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round((dur+0.03)*sr),g=Math.round(dur*sr),lp=P.onepole();let ph=0;
 return yield* arr(n,i=>{ph=(ph+f/sr)%1;return v*lp(tri16(ph),9000,sr)*(i<g?1:Math.max(0,1-(i-g)/(0.03*sr)))*Math.min(1,i/48)})};
// lounge vibraphone (Encyclopedia Lounge answers): brighter strike than INSTR.vibes, faster 5.6 Hz motor, 1.6 s ring.
// After the snes chip's vibes lead Bryan loved; synthesized directly (no BRR/32 kHz pass).
I.loungeVibes=function*(sr,m,dur,v=1){const f=P.mtof(m),n=Math.round((dur+1.4)*sr),g=Math.round(dur*sr),lp=P.onepole();let p1=0,p2=0,p3=0;
 return yield* arr(n,i=>{const t=i/sr;p1=(p1+f/sr)%1;p2=(p2+4*f/sr)%1;p3=(p3+9.9*f/sr)%1;
  const x=Math.sin(TAU*p1)*Math.exp(-t/1.6)+0.22*Math.sin(TAU*p2)*Math.exp(-t/0.25)+0.06*Math.sin(TAU*p3)*Math.exp(-t/0.02);
  return v*Math.min(1,t/0.0015)*rel(i,g,sr,0.6)*(1+0.28*Math.sin(TAU*5.6*t))*lp(x,4500,sr)})};
// ---- drums
I.hat=function*(sr,v=1,open=0,seed=5){const d=open?0.18:0.035,n=Math.round(d*4*sr),r=P.rng(seed),hp=P.svf(),bp=P.svf();
 return yield* arr(n,i=>{const x=r();return v*(0.8*hp(x,7000,0.7,sr,'hp')+0.4*bp(x,10000,2,sr,'bp'))*Math.exp(-i/(d*sr))*Math.min(1,i/20)})};
I.snare=function*(sr,v=1,seed=13){const n=Math.round(0.35*sr),r=P.rng(seed),bp=P.svf(),lp=P.onepole();let ph=0;
 return yield* arr(n,i=>{const t=i/sr;ph=(ph+(185+60*Math.exp(-t/0.01))/sr)%1;return v*(0.55*Math.sin(TAU*ph)*Math.exp(-t/0.07)+0.7*lp(bp(r(),2400,0.8,sr,'bp'),7000,sr)*Math.exp(-t/0.12))*Math.min(1,i/24)})};
I.clap=function*(sr,v=1,seed=21){const n=Math.round(0.3*sr),r=P.rng(seed),bp=P.svf();
 return yield* arr(n,i=>{const t=i/sr,env=[0,0.009,0.019].reduce((s,o)=>s+(t>=o&&t<o+0.009?Math.exp(-(t-o)/0.004):0),0)+(t>=0.019?Math.exp(-(t-0.019)/0.09):0);return v*bp(r(),1200,1.3,sr,'bp')*env})};
I.rim=function*(sr,v=1){const n=Math.round(0.08*sr),r=P.rng(4),bp=P.svf();let ph=0;
 return yield* arr(n,i=>{const t=i/sr;ph=(ph+420/sr)%1;return v*(0.6*bp(r(),1700,6,sr,'bp')*Math.exp(-t/0.012)+0.5*Math.sin(TAU*ph)*Math.exp(-t/0.02))})};
I.chipKick=function*(sr,v=1){const n=Math.round(0.18*sr);let ph=0;
 return yield* arr(n,i=>{const t=i/sr;ph=(ph+(45+160*Math.exp(-t/0.025))/sr)%1;return v*tri16(ph)*Math.exp(-t/0.09)})};
I.chipNoise=function*(sr,v=1,dec=0.04,rate=16000,seed=9){const n=Math.round(dec*5*sr),r=P.rng(seed);let h=0,acc=1;
 return yield* arr(n,i=>{acc+=rate/sr;if(acc>=1){acc-=1;h=r()>0?1:-1}return v*h*Math.exp(-i/(dec*sr))*0.5})};
})(globalThis);