/* audio/chips.js: era sound-chip renderers for the CD-ROM screensaver (load after engine/src/audio/dsp.js).
   CHIPS.<chip>.render(events, N, sr, bpm) is a generator (yields while working) → mono Float32Array of N samples.
   Event: {t (s from section start), part, m (midi), d (s), v (0–1)}; parts: lead, lead2, bass, arp, pad, speech,
   kick, snare, hat, tom, crash. Each chip plays only what its hardware could:
     fm     = 2-op FM card, OPL2-style (feedback, 4 waveforms, vibrato/tremolo LFOs, rhythm-mode drums). Polyphonic, mono out.
     tia    = 2600-style TIA: 2 channels, 31.4 kHz dividers (pitches snap to the chip), 60 Hz frame registers, 4-bit volume.
              ch0 = lead (speech steals it); ch1 = bass (drums steal it). No arp/pad/lead2.
     beep   = 1-bit PC speaker: ONE 50% square, no volume. Per-sample priority: snare > kick/tom > speech > bass thump > lead > arp.
     snes   = 16-bit sampler (score field `lead` picks the melody sample), S-DSP-style: 8 voices at 32 kHz (stealing by priority), our own synthesized samples run through
              4-bit BRR compression, soft 4-point interpolation, ADSR, echo buffer (dotted-8th, filtered feedback).
     arcade = 4-op FM (YM2151-style algorithms 0/4/5/7, op1 feedback) + 3-square/noise PSG (10-bit dividers, 2 dB volume
              steps, 60 Hz software envelopes). PSG A = arp, B = arp echo (speech steals it), C = thin lead doubling.
   CHIPS.<chip>.range = registers the composer writes in; .post = gentle output EQ (hp, lp) applied by the style. */
(function(G){'use strict';
const P=G.DHS.dsp,TAU=Math.PI*2,C=(G.CHIPS={});
const gen=function*(n,fn){const b=new Float32Array(n);for(let i=0;i<n;i++){b[i]=fn(i);if((i&8191)===8191)yield}return b};
const addAt=(out,b,t,g,sr)=>{const at=Math.round(t*sr),N=out.length;for(let i=Math.max(0,-at);i<b.length&&at+i<N;i++)out[at+i]+=b[i]*g};
 
/* ---------------- FM card ---------------- */
const WAV=[x=>Math.sin(TAU*x),x=>{x-=Math.floor(x);return x<0.5?Math.sin(TAU*x):0},x=>Math.abs(Math.sin(TAU*x)),x=>{x-=Math.floor(x);return (x%0.5)<0.25?Math.abs(Math.sin(TAU*x)):0}];
function env(n,g,sr,{a,d,s,r,perc}){const e=new Float32Array(n),A=Math.max(1,a*sr);let cur=0;   // attack curve, then dB-linear decay/release
  for(let i=0;i<n;i++){if(i<A&&i<g){e[i]=1-Math.pow(1-i/A,3);continue}
    if(i<g)cur=perc?cur-d/sr:Math.max(s,cur-d/sr);else cur-=r/sr;e[i]=cur<-90?0:P.db(cur)}return e}
const opl=function*(sr,m,dur,v,p){const f=P.mtof(m),n=Math.round((dur+p.tail)*sr),g=Math.round(dur*sr),eM=env(n,g,sr,p.em),eC=env(n,g,sr,p.ec);let pm=0,pc=0,o1=0,o2=0;
  return yield* gen(n,i=>{const t=i/sr,vb=p.vib?1+0.004*Math.sin(TAU*6.1*t):1;pm=(pm+f*p.mm*vb/sr)%1;pc=(pc+f*p.mc*vb/sr)%1;
    const mr=WAV[p.wm](pm+p.fb*(o1+o2)/2)*eM[i];o2=o1;o1=mr;
    return v*WAV[p.wc](pc+p.idx*mr)*eC[i]*(p.trem?1-0.11*(0.5+0.5*Math.sin(TAU*3.7*t)):1)})};
const PATCH={
  bass:{mm:1,mc:1,wm:0,wc:0,fb:0.15,idx:0.9,em:{a:0.001,d:30,s:-12,r:60},ec:{a:0.002,d:8,s:-4,r:80},tail:0.1},
  lead:{mm:1,mc:1,wm:1,wc:0,fb:0.22,idx:0.75,em:{a:0.02,d:4,s:-3,r:40},ec:{a:0.008,d:2,s:-2,r:45},vib:1,tail:0.2},
  glass:{mm:7,mc:1,wm:0,wc:0,fb:0,idx:0.45,em:{a:0.001,d:40,perc:1,r:80},ec:{a:0.001,d:16,perc:1,r:60},tail:0.05},
  organ:{mm:2,mc:1,wm:0,wc:1,fb:0,idx:0.3,em:{a:0.08,d:1,s:-3,r:20},ec:{a:0.08,d:1,s:-3,r:20},vib:1,trem:1,tail:0.3},
  blip:{mm:2,mc:1,wm:0,wc:0,fb:0.05,idx:0.7,em:{a:0.001,d:300,perc:1,r:700},ec:{a:0.002,d:140,perc:1,r:700},tail:0.05}};   // round, plucky 'boop'; dies within the 32nd so speech stays rhythmic
const fmDrum={
  kick:function*(sr){let pm=0,pc=0;return yield* gen(Math.round(0.35*sr),i=>{const t=i/sr;pm=(pm+55/sr)%1;pc=(pc+55/sr)%1;return Math.sin(TAU*(pc+0.6*Math.exp(-t/0.03)*Math.sin(TAU*pm)))*Math.exp(-t/0.11)})},
  snare:function*(sr,seed){const r=P.rng(seed);let p=0,nb=1;return yield* gen(Math.round(0.25*sr),i=>{const t=i/sr;p=(p+220/sr)%1;if(i%3===0)nb=r()>0?1:-1;return (0.45*Math.sin(TAU*p)+0.55*nb*Math.abs(Math.sin(TAU*p*2.3)))*Math.exp(-t/0.07)})},
  hat:function*(sr,seed,dec){const r=P.rng(seed),hp=P.svf();let a=0,b=0;return yield* gen(Math.round(dec*6*sr),i=>{a=(a+4900/sr)%1;b=(b+7310/sr)%1;const x=((a<0.5)^(b<0.5)?1:-1)*0.6+r()*0.4;return hp(x,5000,0.7,sr,'hp')*Math.exp(-i/(dec*sr))})},
  tom:function*(sr,f){let p=0;return yield* gen(Math.round(0.3*sr),i=>{const t=i/sr;p=(p+f/sr)%1;return Math.sin(TAU*p)*Math.exp(-t/0.15)})}};
const SPG=0.65,DUCK=0.56;   // FM speech level and music duck (0.56 = −5 dB) while the Dud talks
C.fm={range:{lead:[67,86],bass:[31,45],arp:[57,72]},post:{hp:35,lp:9000},
  render:function*(ev,N,sr){const out=new Float32Array(N),sp=new Float32Array(N),win=[];let k=0;
    for(const e of ev){let b,g;k++;
      switch(e.part){
        case 'lead':b=yield* opl(sr,e.m,e.d,e.v,PATCH.lead);g=0.32;break;
        case 'lead2':b=yield* opl(sr,e.m,e.d,e.v*0.9,PATCH.lead);g=0.2;break;
        case 'bass':b=yield* opl(sr,e.m,e.d,e.v,PATCH.bass);g=0.42;break;
        case 'arp':b=yield* opl(sr,e.m+12,e.d,e.v,PATCH.glass);g=0.09;break;
        case 'pad':b=yield* opl(sr,e.m,e.d,0.6,PATCH.organ);g=0.07;break;
        case 'speech':b=yield* opl(sr,e.m,e.d*0.55,0.9,PATCH.blip);addAt(sp,b,e.t,SPG,sr);win.push([e.t,e.t+e.d]);continue;
        case 'kick':b=yield* fmDrum.kick(sr);g=0.6*e.v;break;
        case 'snare':b=yield* fmDrum.snare(sr,k);g=0.3*e.v;break;
        case 'hat':b=yield* fmDrum.hat(sr,k,e.v>0.7?0.06:0.03);g=e.v>0.7?0.16:0.11;break;
        case 'crash':b=yield* fmDrum.hat(sr,k,0.4);g=0.12;break;
        case 'tom':b=yield* fmDrum.tom(sr,P.mtof(e.m));g=0.35;break;
        default:continue}
      addAt(out,b,e.t,g,sr)}
    // speech steals the spotlight (like ch0 on the TIA): the music ducks under the Dud (DUCK), 30 ms ramps, 60 ms hold
    if(win.length){const dk=new Float32Array(N).fill(1),ramp=0.03*sr;for(const [a,z] of win){const i0=Math.round(a*sr),i1=Math.round((z+0.06)*sr);
        for(let i=Math.max(0,i0-ramp);i<Math.min(N,i1+ramp);i++){const x=i<i0?(i0-i)/ramp:i>i1?(i-i1)/ramp:0;dk[i]=Math.min(dk[i],DUCK+(1-DUCK)*Math.min(1,x))}}
      for(let i=0;i<N;i++)out[i]=out[i]*dk[i]+sp[i]}
    return out}};
 
/* ---------------- 2600-style TIA ---------------- */
const TCK=31440,TPF=524,DIV={4:2,12:6,6:31};
const tiaN=(m,c)=>{const want=P.mtof(m);let best=0,be=1e9;for(let n=0;n<32;n++){const e=Math.abs(Math.log2(TCK/DIV[c]/(n+1)/want));if(e<be){be=e;best=n}}return best};
C.tia={range:{lead:[72,86],bass:[52,62]},post:{hp:90,lp:6500},
  render:function*(ev,N,sr){const frames=Math.ceil(N/sr*60)+2,R=Array.from({length:frames},()=>[null,null]);
    const set=(fr,ch,c,f,v,pri)=>{if(fr<0||fr>=frames)return;const cur=R[fr][ch];if(!cur||cur.pri<pri)R[fr][ch]={c,f,v,pri}};
    const tone=(ch,c,e,v0,vmin,pri)=>{const n=tiaN(e.m,c),f0=Math.round(e.t*60),len=Math.max(1,Math.round(e.d*60));
      for(let k=0;k<len;k++)set(f0+k,ch,c,n,k===len-1&&len>2?0:Math.max(vmin,Math.round(v0*e.v)-k),pri)};
    const hit=(e,c,f,vs,pri)=>{const f0=Math.round(e.t*60);vs.forEach((v,k)=>set(f0+k,1,c,Array.isArray(f)?f[k]:f,v,pri))};
    for(const e of ev)switch(e.part){
      case 'lead':tone(0,4,e,11,6,1);break;
      case 'speech':tone(0,4,e,12,12,3);break;
      case 'bass':tone(1,12,e,10,6,1);break;
      case 'kick':hit(e,6,[10,20,31],[15,12,8],2);break;
      case 'snare':hit(e,8,2,[14,11,8,5,2],2);break;
      case 'hat':hit(e,8,0,[6,3],0);break;
      case 'tom':hit(e,6,tiaN(e.m,6),[12,9,6,3],2);break;
      case 'crash':hit(e,8,1,[10,9,8,7,6,5,5,4,4,3,3,2,2,1],0);break}
    const nT=frames*TPF,raw=new Float32Array(nT),st=[0,1].map(()=>({d:0,o:0,c6:0,c31:0,p5:1,p9:1}));
    for(let t=0;t<nT;t++){const F=R[(t/TPF)|0];let s=0;
      for(let c=0;c<2;c++){const g=F[c];if(!g)continue;const q=st[c];
        if(++q.d>g.f){q.d=0;switch(g.c){case 4:q.o^=1;break;case 12:q.c6=(q.c6+1)%6;q.o=q.c6<3?1:0;break;case 6:q.c31=(q.c31+1)%31;q.o=q.c31<18?1:0;break;
          case 8:q.p9=((q.p9<<1)|(((q.p9>>8)^(q.p9>>4))&1))&511;q.o=q.p9&1;break;default:q.o=1}}
        s+=q.o*g.v/15}
      raw[t]=s/2;if((t&65535)===65535)yield}
    const out=new Float32Array(N);for(let i=0;i<N;i++){const x=i*TCK/sr,a=Math.floor(x),fr=x-a;out[i]=(raw[a]||0)*(1-fr)+(raw[a+1]||0)*fr}
    return out}};
 
/* ---------------- 1-bit PC beeper ---------------- */
C.beep={range:{lead:[60,76],bass:[43,55],arp:[60,72]},post:{hp:250,lp:3800},
  render:function*(ev,N,sr){const F=new Float32Array(N),pri=new Uint8Array(N),nz=new Uint8Array(N);
    const fill=(t,d,f,p)=>{const a=Math.max(0,Math.round(t*sr)),b=Math.min(N,Math.round((t+d)*sr));for(let i=a;i<b;i++)if(p>=pri[i]){F[i]=typeof f==='function'?f((i-a)/sr):f;pri[i]=p}};
    for(const e of ev)switch(e.part){
      case 'arp':fill(e.t,e.d*0.85,P.mtof(e.m),1);break;
      case 'lead':fill(e.t,Math.max(0.03,e.d-0.012),P.mtof(e.m),2);break;
      case 'bass':fill(e.t,0.032,P.mtof(e.m+12),3);break;
      case 'speech':fill(e.t,e.d,P.mtof(e.m),4);break;
      case 'kick':fill(e.t,0.03,t=>60+240*Math.exp(-t/0.008),5);break;
      case 'tom':fill(e.t,0.025,t=>P.mtof(e.m+12)*(1-3*t),5);break;
      case 'snare':{const a=Math.round(e.t*sr),b=Math.min(N,a+Math.round(0.022*sr));for(let i=Math.max(0,a);i<b;i++){nz[i]=1;pri[i]=6}}break}
    const r=P.rng(3),out=new Float32Array(N);let ph=0,h=1;
    for(let i=0;i<N;i++){if(nz[i]){if(r()>0.7)h=-h;out[i]=h*0.5}else if(F[i]){ph=(ph+F[i]/sr)%1;out[i]=ph<0.5?0.5:-0.5}else out[i]=0;if((i&65535)===65535)yield}
    return out}};
 
/* ---------------- 16-bit sampler (S-DSP-style) ---------------- */
const S32=32000;
function brr(x){   // 16-sample blocks, 4 prediction filters, 4-bit nibbles + shift: encode, then decode (the S-DSP's grit)
  const y=new Float32Array(x.length),F=[()=>0,a=>a*15/16,(a,b)=>a*61/32-b*15/16,(a,b)=>a*115/64-b*13/16];let p1=0,p2=0;
  for(let b0=0;b0<x.length;b0+=16){let best=null;
    for(let f=0;f<4;f++)for(let sh=0;sh<=12;sh++){const step=Math.pow(2,sh)/32768,o=[];let q1=p1,q2=p2,err=0;
      for(let j=b0;j<Math.min(b0+16,x.length);j++){const pr=F[f](q1,q2),n=Math.max(-8,Math.min(7,Math.round((x[j]-pr)/step)));
        const v=Math.max(-1,Math.min(1,pr+n*step));err+=(v-x[j])*(v-x[j]);o.push(v);q2=q1;q1=v}
      if(!best||err<best.err)best={err,o,q1,q2}}
    best.o.forEach((v,k)=>y[b0+k]=v);p1=best.q1;p2=best.q2}
  return y}
const SMP={},SMPC={};let TBL=SMP,EMPH=0;   // SMPC = clear-mode samples
const emph=raw=>{if(!EMPH)return raw;const y=new Float32Array(raw.length),k=EMPH;for(let i=0;i<raw.length;i++){const a=raw[i-1]||0,b=raw[i+1]||0;y[i]=(1+2*k)*raw[i]-k*(a+b)}return y};   // clear mode: 3-tap treble lift before BRR
   // name → {d (BRR-decoded data at 32 kHz), base (float midi of the sample's pitch), loop}
const mkS=(name,f,loop,raw)=>{raw=emph(raw);let pk=0;for(const v of raw)pk=Math.max(pk,Math.abs(v));for(let i=0;i<raw.length;i++)raw[i]*=0.9/pk;
  TBL[name]={d:brr(raw),base:69+12*Math.log2(f/440),loop:!!loop,ls:loop>1?loop:0}};   // loop: 0 | 1 (whole buffer) | start index
const additive=(n,cyc,H,w)=>{const raw=new Float32Array(n);   // loops hold whole cycles of every oscillator, so they wrap seamlessly
  for(const c of cyc)for(let h=1;h<=H;h++){const a=w(h),ph=h*7.31%1;if(!a)continue;for(let i=0;i<n;i++)raw[i]+=a*Math.sin(TAU*(h*c*i/n+ph))}return raw};
const oneshot=(sec,fn)=>{const n=Math.round(sec*S32),raw=new Float32Array(n);for(let i=0;i<n;i++)raw[i]=fn(i/S32,i);return raw};
function build(tbl,em){TBL=tbl;EMPH=em;const r=P.rng(1601);
  mkS('strings',64*S32/7680,1,additive(7680,[64,65],24,h=>Math.exp(-h/7)/h));          // two detuned saws: ensemble strings
  mkS('brass',32*S32/1960,1,additive(1960,[32,33],28,h=>Math.pow(h,-1.05)*(h>14?0.6:1)));// bright detuned saw: synth brass
  mkS('horn',32*S32/1960,1,additive(1960,[32,33],12,h=>Math.exp(-h/2.2)/h));               // warm horn: few, fast-falling harmonics
  mkS('flute',32*S32/1960,1,additive(1960,[32,33],5,h=>[1,0.22,0.1,0.04,0.02][h-1]));       // flute/ocarina: nearly pure, gentle chorus
  mkS('reed',32*S32/1960,1,additive(1960,[32,33],15,h=>h%2?Math.exp(-h/4)/h:0.08/h));        // soft clarinet: odd harmonics, rolled off
  {const w=additive(1960,[32,33],15,h=>h%2?Math.exp(-h/4)/h:0.08/h),raw=new Float32Array(3920);   // reed with a breathy 'chiff' attack, then loops
    for(let i=0;i<3920;i++)raw[i]=w[i%1960]*(i<1960?0.6+0.4*i/1960:1)+(i<1960?0.35*r()*Math.exp(-i/300):0);mkS('reed2',32*S32/1960,1960,raw)}
  mkS('vibes',523.25,0,oneshot(1.6,t=>(Math.sin(TAU*523.25*t)+0.25*Math.sin(TAU*2093*t)*Math.exp(-t/0.15)+0.08*Math.sin(TAU*5232.5*t)*Math.exp(-t/0.05))*Math.exp(-t/0.9)*(1+0.1*Math.sin(TAU*5*t))));   // soft vibraphone
  mkS('bass',16*S32/7829,1,additive(7829,[16],18,h=>Math.pow(h,-1.5)));               // fingered bass
  {const L=61,buf=new Float32Array(L),lp=P.onepole();for(let i=0;i<L;i++)buf[i]=lp(r(),6000,S32);let k=0;   // plucked harp (Karplus-Strong)
    mkS('harp',S32/(L+0.5),0,oneshot(0.7,()=>{const a=buf[k],b=buf[(k+1)%L];buf[k]=0.996*(a+b)/2;k=(k+1)%L;return a}))}
  mkS('pip',1046.5,0,oneshot(0.12,t=>(Math.sin(TAU*1046.5*t)+0.3*Math.sin(TAU*3139.5*t))*Math.exp(-t/0.04)));
  {let ph=0;mkS('kick',261.63,0,oneshot(0.3,t=>{ph+=(45+105*Math.exp(-t/0.025))/S32;return Math.sin(TAU*ph)*Math.exp(-t/0.16)}))}
  {const lp=P.onepole();let ph=0;mkS('snare',261.63,0,oneshot(0.25,t=>{ph+=190/S32;return 0.6*lp(r(),7000,S32)*Math.exp(-t/0.06)+0.5*Math.sin(TAU*ph)*Math.exp(-t/0.035)}))}
  {let z=0;mkS('hat',261.63,0,oneshot(0.2,t=>{const x=r(),y=x-z;z=x;return y*Math.exp(-t/0.035)}))}
  {let z=0;mkS('crash',261.63,0,oneshot(1.5,t=>{const x=r(),y=x-0.7*z;z=x;return y*Math.exp(-t/0.55)}))}
  {let ph=0;mkS('tom',110,0,oneshot(0.4,t=>{ph+=110*(1+0.4*Math.exp(-t/0.03))/S32;return Math.sin(TAU*ph)*Math.exp(-t/0.2)}))}
  if(em){const w=additive(7829,[16],32,h=>Math.pow(h,-1.05)),raw=new Float32Array(15658);   // clear mode: slap bass
    for(let i=0;i<15658;i++)raw[i]=w[i%7829]*(i<7829?1+1.6*Math.exp(-i/500):1)+(i<400?0.6*r()*Math.exp(-i/60):0);mkS('slap',16*S32/7829,7829,raw)}
  mkS('pulse',6*S32/1960,1,additive(1960,[6],100,h=>(h%2?1:0.45)/h));   // Oct 9: bright low pulse for the Contour intro (base G2, 100 harmonics)
  TBL=SMP;EMPH=0}
const makeSamples=()=>{if(!SMP.harp)build(SMP,0)},clearSamples=()=>{if(!SMPC.harp)build(SMPC,0.35)};
const play=function*(s,m,on,off,vol,e,vib){   // one S-DSP voice at 32 kHz: pitch by resampling, 4-point soft interpolation, ADSR
  const n=Math.max(2,Math.round(off*S32)),E=env(n,Math.round(on*S32),S32,e),d=s.d,L=d.length,r0=Math.pow(2,(m-s.base)/12),fade=Math.round(0.002*S32);let pos=0;
  return yield* gen(n,i=>{const a=Math.floor(pos),f=pos-a;let x0,x1,x2,x3;
    if(s.loop){const W=j=>d[j<L?j:s.ls+(j-s.ls)%(L-s.ls)];x0=a?W(a-1):0;x1=W(a);x2=W(a+1);x3=W(a+2)}else{if(a>=L)return 0;x0=d[a-1]||0;x1=d[a];x2=d[a+1]||0;x3=d[a+2]||0}
    pos+=vib&&i>0.2*S32?r0*(1+0.005*Math.sin(TAU*5.5*i/S32)):r0;if(s.loop&&pos>=L)pos-=L-s.ls;
    const f2=f*f,f3=f2*f,y=((1-f)*(1-f)*(1-f)*x0+(3*f3-6*f2+4)*x1+(-3*f3+3*f2+3*f+1)*x2+f3*x3)/6;   // cubic B-spline: smooth like the S-DSP's gaussian
    return vol*y*E[i]*(i>n-fade?(n-i)/fade:1)})};
const Z={a:0,d:0,s:0,r:4000},SNSP=0.5;
const LEADS={flute:{s:'flute'},horn:{s:'horn'},reed:{s:'reed'},brass:{s:'brass'},   // melody voice per score `lead` (overrides SNP.lead)
  strings:{s:'strings',g:0.28,fx:0.5,e:{a:0.06,d:2,s:-3,r:3000}},
  reed2:{s:'reed2',g:0.24,oct:-12,fx:0.6,e:{a:0.01,d:3,s:-5,r:3000}},
  vibes:{s:'vibes',g:0.3,fx:0.55,vib:0,e:{a:0.001,d:0,s:0,r:1500}}};
LEADS.pulse={s:'pulse',g:0.3,oct:-12,fx:0.3,e:{a:0.002,d:6,s:-6,r:3000}};   // Oct 9: the intro's octave pulse (sounds an octave down, like reed2)
LEADS.blend={...LEADS.strings,layer:'vibes',lg:0.5};          // strings + mallet doubling every note (2 voices per note)
LEADS.split={...LEADS.strings,alt:'vibes',altBars:[4,5]};      // strings sing; the mallet answers in bars 5–6 (the answer phrase)   // SNSP = Dud speech level on the sampler
const SNP={   // part → sample, gain, voice priority, echo send, envelope (dB/s), one-shot (rings to its end), fixed pitch, vibrato
  lead:{s:'brass',g:0.34,p:4,fx:0.45,e:{a:0.03,d:3,s:-4,r:4000},vib:1},
  lead2:{s:'strings',g:0.3,p:3,fx:0.35,e:{a:0.004,d:14,s:-9,r:4000}},   // airship hits: string stabs
  bass:{s:'bass',g:0.5,p:4,fx:0,e:{a:0.002,d:14,s:-14,r:4000}},
  arp:{s:'harp',g:0.22,p:1,fx:0.6,one:1,e:Z},
  pad:{s:'strings',g:0.11,p:2,fx:0.4,e:{a:0.12,d:1,s:-3,r:3000}},
  speech:{s:'pip',g:SNSP,p:6,fx:0.15,e:Z},
  kick:{s:'kick',g:0.75,p:5,fx:0,one:1,fix:1,e:Z},
  snare:{s:'snare',g:0.42,p:5,fx:0.2,one:1,fix:1,e:Z},
  hat:{s:'hat',g:0.16,p:2,fx:0.1,fix:1,e:Z},
  crash:{s:'crash',g:0.16,p:3,fx:0.25,one:1,fix:1,e:Z},
  tom:{s:'tom',g:0.45,p:5,fx:0.2,one:1,e:Z}};
C.snes={leads:Object.keys(LEADS),range:{lead:[64,84],bass:[33,48],arp:[55,79]},post:{hp:30,lp:11000},postClear:{hp:30,lp:16000},
  render:function*(ev,N,sr,bpm,sc){const CL=sc&&sc.clear;CL?clearSamples():makeSamples();const TB=CL?SMPC:SMP;const LD=LEADS[(sc&&sc.lead)||'split']||{},LQ={...SNP.lead,...LD},s16=60/(bpm||116)/4;
    const VQ={...SNP.lead,...LEADS.vibes},LYQ={...VQ,g:VQ.g*(LD.lg||0.5)},EV=[];   // expand lead events into voices
    for(const e of ev){if(e.part!=='lead'){EV.push([e,SNP[e.part]]);continue}const bar=Math.floor(e.t/(16*s16)+1e-6)%8;
      EV.push([e,LD.alt&&LD.altBars.includes(bar)?VQ:LQ]);if(LD.layer)EV.push([e,LYQ])}/* score field `lead`: a LEADS key */const N32=Math.ceil(N*S32/sr)+4,dry=new Float32Array(N32),send=new Float32Array(N32);
    // 8 voices: a new note takes a free voice, else steals the lowest-priority (then oldest) one; ties never steal up
    const vo=new Array(8).fill(null),keep=[];
    for(const [e,q] of EV){if(!q)continue;const s=TB[CL&&q.s==='bass'?'slap':q.s],m=q.fix?s.base:e.m+(q.oct||0),rate=Math.pow(2,(m-s.base)/12);
      const on=q.one?s.d.length/rate/S32:e.part==='hat'?(e.v>0.7?0.09:0.035):e.part==='speech'?e.d*0.55:e.d;
      const x={e,q,s,m,on,end:e.t+on+(q.one?0:0.02),cut:Infinity};
      let k=vo.findIndex(v=>!v||Math.min(v.end,v.cut)<=e.t+1e-6);
      if(k<0){k=-1;vo.forEach((v,j)=>{if(v.q.p<=q.p&&(k<0||v.q.p<vo[k].q.p||(v.q.p===vo[k].q.p&&v.e.t<vo[k].e.t)))k=j});if(k<0)continue;vo[k].cut=e.t}
      vo[k]=x;keep.push(x)}
    for(const x of keep){const len=Math.min(x.end,x.cut)-x.e.t;if(len<=0.002)continue;
      const b=yield* play(x.s,x.m,Math.min(x.on,len),len,x.q.g*(x.e.part==='speech'?0.9:x.e.v),x.q.e,x.q.vib);
      addAt(dry,b,x.e.t,1,S32);if(x.q.fx)addAt(send,b,x.e.t,x.q.fx,S32)}
    const D=Math.round(Math.min(0.48,3*15/(bpm||116))*S32),eb=new Float32Array(N32),lp=P.onepole();   // echo: dotted 8th (S-DSP max 240 ms × 2 lines)
    for(let i=0;i<N32;i++){const y=lp(i>=D?eb[i-D]:0,4200,S32);eb[i]=send[i]+(CL?0.3:0.42)*y;dry[i]+=(CL?0.25:0.5)*y;if((i&65535)===65535)yield}
    const out=new Float32Array(N);for(let i=0;i<N;i++){const x=i*S32/sr,a=Math.floor(x),f=x-a;out[i]=dry[a]*(1-f)+dry[a+1]*f}
    return out}};
 
/* ---------------- Arcade board: 4-op FM + PSG ---------------- */
const op4=function*(sr,m,dur,v,p){   // YM2151-style: 4 sine operators, algorithm 0 (serial), 4 (two pairs), 5 (1 → three), 7 (all carriers)
  const f=P.mtof(m),n=Math.round((dur+p.tail)*sr),g=Math.round(dur*sr),O=p.ops,E=O.map(o=>env(n,g,sr,o.e)),ph=[0,0,0,0];let f1=0,f2=0;
  return yield* gen(n,i=>{const vb=p.vib&&i>0.15*sr?1+0.005*Math.sin(TAU*5.6*i/sr):1;for(let k=0;k<4;k++)ph[k]=(ph[k]+f*O[k].r*vb/sr)%1;
    const s=(k,mod)=>Math.sin(TAU*(ph[k]+mod))*E[k][i]*O[k].l,o1=s(0,p.fb*(f1+f2)/2);f2=f1;f1=o1;let y;
    switch(p.alg){case 0:y=s(3,s(2,s(1,o1)));break;case 4:y=s(1,o1)+s(3,s(2,0));break;case 5:y=s(1,o1)+s(2,o1)+s(3,o1);break;default:y=o1+s(1,0)+s(2,0)+s(3,0)}
    return v*y})};
const AP={
  brass:{alg:4,fb:0.2,vib:1,tail:0.15,ops:[{r:1,l:0.9,e:{a:0.06,d:4,s:-5,r:400}},{r:1,l:0.55,e:{a:0.025,d:2,s:-2,r:400}},{r:1.004,l:0.7,e:{a:0.07,d:4,s:-6,r:400}},{r:0.996,l:0.45,e:{a:0.025,d:2,s:-2,r:400}}]},
  bass:{alg:4,fb:0.35,tail:0.1,ops:[{r:1,l:1.3,e:{a:0.001,d:45,s:-24,r:600}},{r:1,l:0.6,e:{a:0.001,d:9,s:-8,r:600}},{r:0.5,l:0.6,e:{a:0.001,d:20,s:-12,r:600}},{r:1,l:0.4,e:{a:0.001,d:9,s:-8,r:600}}]},
  ep:{alg:4,fb:0,tail:0.2,ops:[{r:1,l:0.5,e:{a:0.001,d:10,s:-12,r:300}},{r:1,l:0.6,e:{a:0.001,d:6,s:-10,r:300}},{r:14,l:0.35,e:{a:0.001,d:60,perc:1,r:300}},{r:1,l:0.3,e:{a:0.001,d:30,perc:1,r:300}}]},
  pad:{alg:5,fb:0.1,vib:1,tail:0.4,ops:[{r:1,l:0.35,e:{a:0.25,d:1,s:-4,r:150}},{r:1,l:0.33,e:{a:0.2,d:0.5,s:-2,r:150}},{r:1.006,l:0.33,e:{a:0.2,d:0.5,s:-2,r:150}},{r:2.003,l:0.2,e:{a:0.3,d:0.5,s:-3,r:150}}]}};
const PCLK=3579545/32,pF=m=>PCLK/Math.max(1,Math.min(1023,Math.round(PCLK/P.mtof(m))));   // PSG 10-bit dividers: pitches snap
const AT=a=>a>=15?0:Math.pow(10,-a/10),ARSP=0;   // attenuation 0–15 in 2 dB steps (15 = off); ARSP = Dud speech attenuation
C.arcade={range:{lead:[67,86],bass:[31,45],arp:[62,81]},post:{hp:40,lp:10500},
  render:function*(ev,N,sr,bpm){const out=new Float32Array(N),fr=sr/60,s16=60/(bpm||116)/4;let k=0;
    const F=[0,1,2].map(()=>new Float32Array(N)),V=[0,1,2].map(()=>new Float32Array(N)),PR=[0,1,2].map(()=>new Uint8Array(N)),NR=new Float32Array(N),NV=new Float32Array(N);
    const tone=(c,t,d,m,a0,dk,p)=>{const f=pF(m),a=Math.max(0,Math.round(t*sr)),b=Math.min(N,Math.round((t+d)*sr));   // 60 Hz software envelope: +dk attenuation per frame
      for(let i=a;i<b;i++)if(p>=PR[c][i]){F[c][i]=f;V[c][i]=AT(Math.min(15,a0+Math.floor((i-a)/fr*dk)));PR[c][i]=p}};
    const noise=(t,d,rate,a0,dk)=>{const a=Math.max(0,Math.round(t*sr)),b=Math.min(N,Math.round((t+d)*sr));for(let i=a;i<b;i++){NR[i]=rate;NV[i]=AT(Math.min(15,a0+Math.floor((i-a)/fr*dk)))}};
    for(const e of ev){let b,g;k++;
      switch(e.part){
        case 'lead':b=yield* op4(sr,e.m,e.d,e.v,AP.brass);g=0.3;tone(2,e.t,e.d,e.m+12,10,0,1);break;
        case 'lead2':b=yield* op4(sr,e.m,e.d,e.v,AP.ep);g=0.2;break;
        case 'bass':b=yield* op4(sr,e.m,e.d,e.v,AP.bass);g=0.4;break;
        case 'pad':b=yield* op4(sr,e.m,e.d,0.6,AP.pad);g=0.06;break;
        case 'arp':tone(0,e.t,e.d,e.m,4,0.5,1);tone(1,e.t+3*s16,e.d,e.m,8,0.5,1);continue;   // B = the classic delayed PSG "echo"
        case 'speech':tone(1,e.t,e.d*0.55,e.m,ARSP,0,3);tone(0,e.t,e.d*0.55,e.m+12,ARSP+4,0,3);continue;   // steals B, doubled an octave up on A
        case 'kick':b=yield* fmDrum.kick(sr);g=0.6*e.v;break;
        case 'snare':b=yield* fmDrum.tom(sr,185);g=0.18*e.v;noise(e.t,0.2,15000,e.v>0.8?1:3,1.5);break;
        case 'hat':noise(e.t,e.v>0.7?0.08:0.035,30000,e.v>0.7?5:7,3);continue;
        case 'crash':noise(e.t,1.2,22000,3,0.35);continue;
        case 'tom':b=yield* fmDrum.tom(sr,P.mtof(e.m));g=0.35;break;
        default:continue}
      addAt(out,b,e.t,g,sr)}
    const ph=[0,0,0];let lf=1<<14,np=0,nb=1;
    for(let i=0;i<N;i++){let s=0;
      for(let o=0;o<2;o++){for(let c=0;c<3;c++){if(!V[c][i])continue;ph[c]=(ph[c]+F[c][i]/(2*sr))%1;s+=(ph[c]<0.5?1:-1)*V[c][i]}   // 2× oversampled squares
        if(NV[i]){np+=NR[i]/(2*sr);while(np>=1){np-=1;const bit=(lf^(lf>>1))&1;lf=(lf>>1)|(bit<<14);nb=lf&1?1:-1}s+=nb*NV[i]}}   // 15-bit LFSR white noise
      out[i]+=s*0.085;if((i&65535)===65535)yield}
    return out}};
})(globalThis);