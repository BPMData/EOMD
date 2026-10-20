/* proj/cdrom/addons.js (Oct 9): player add-ons. tools/build_cdrom.py injects this file right before the channel-surf section
   (after the channels, so it can use and extend them). Edit here; the build picks it up.
   1. Timer readout: while the session timer runs, the time left shows top-right in big hi-vis yellow VT323 on a dark terminal plate,
      in 10-second steps (a 20-minute timer shows 20:00, then 19:50 after 10 s, 19:40 ...), so students know how long is left
      without watching the seconds. It sits under the scanlines, above everything else; in D1/D2 it covers the wall clock.
      drawClock() is called from draw(). Knobs: CLK_*.
   2. Their Finest Duds words as structures: the three code words no longer bounce around the screen. Each stands on the
      contour map as a block-letter structure on a slab, drawn in the map's own Mode 7 perspective: it rises out of the ground
      as the camera approaches, grows, and passes beneath. Every few minutes (the old engineered corner hit) the next structure
      is lined up to pass right under the speaker's airship: Duds cheer, the ding plays, confetti bursts from the gondola.
      A passed structure comes back far ahead with a new word. Reduced motion: the structures stand still, fully grown. Knobs: ST_*.
   3. Their Finest Duds in the air (Oct 9): Duds fly fighter planes; the speaker rides an airship (see add-on 3).
   4. Starfield: the goggled Dud flies a little space fighter (see add-on 4). */
/* ================= add-on 1: timer readout ================= */
const CLK_FONT='88px VT',CLK_INK='#ffe14d',CLK_PLATE='rgba(16,13,2,.88)',CLK_EDGE='#8a7200',CLK_GLOW='rgba(255,225,77,.55)',CLK_STEP=10;   // Oct 9: hi-vis yellow (Bryan)
const CLK={s:'',img:null};
function clockImg(s){const m=M;m.font=CLK_FONT;const pad=18,tw=Math.ceil(Math.max(m.measureText(s).width,m.measureText('00:00').width)),w=tw+2*pad,h=96,b=buf(w,h),c=b.getContext('2d');
 c.fillStyle=CLK_PLATE;c.fillRect(0,0,w,h);c.strokeStyle=CLK_EDGE;c.lineWidth=3;c.strokeRect(1.5,1.5,w-3,h-3);
 c.font=CLK_FONT;c.textBaseline='alphabetic';c.textAlign='right';c.shadowColor=CLK_GLOW;c.shadowBlur=10;c.fillStyle=CLK_INK;c.fillText(s,w-pad,h-20);return b}
const clockText=()=>{const rem=tm.done?0:Math.max(0,tm.dur-(Date.now()-tm.start)/1000),q=Math.ceil(rem/CLK_STEP-1e-9)*CLK_STEP;   // rounded UP to the step
 return String(Math.floor(q/60)).padStart(2,'0')+':'+String(q%60).padStart(2,'0')};
function drawClock(c){if(!tm.on)return;const s=clockText();if(s!==CLK.s){CLK.s=s;CLK.img=clockImg(s)}
 const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(CLK.img,W-24-CLK.img.width,10);c.imageSmoothingEnabled=sm}

/* ================= add-on 2: Their Finest Duds words as structures on the contour map ================= */
// Ground maths mirror drawFlight(): camera at (stCX, stCY) in map texels; a ground point D texels ahead sits on screen row
// stY(D), where one texel spans 1/stK(y) px. Letters stand ST_H texels tall (the word image's 150 px height).
const ST_H=56,ST_FAR=2400,ST_GONE=-120,ST_RISE=[2200,1400],ST_OFF=[220,420],ST_DEPTH=16,ST_CHEER=60,ST_HIT=80,ST_GL=126;
const ST_C0=KB*RHO0*(H-YH)*(H-YH),stY=D=>YH+1/(D/ST_C0+1/(H-YH)),stK=y=>KB*(H-YH)/(y-YH);
const stCX=t=>TS/2+t*DRIFT+260*Math.sin(t*.011),stCY=t=>-t*FLY,stSm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
// place word w D texels ahead, lined up for where the camera will be when it arrives (side -1/+1, or centre)
function stPlace(w,t,D,side,center){const tA=FLY?t+Math.max(0,D-ST_CHEER/2)/FLY:t;
 w.mx=stCX(tA)+(center?0:side*(ST_OFF[0]+R()*(ST_OFF[1]-ST_OFF[0])));w.my=stCY(t)-D;w.side=side;w.center=!!center;w.cheered=false;w.hits=new Map()}
// one structure's screen geometry at time t (null = not on screen)
function stGeom(w,t){const D=stCY(t)-w.my;if(D<ST_GONE||D>ST_FAR+50)return null;const y=stY(D);if(y<YG-2)return null;
 const k=stK(y),v=wordImg(w.s),sc=ST_H/k/150,tw=v[0].width*sc,X=W/2+(w.mx-stCX(t))/k,rise=RM?1:stSm((ST_RISE[0]-D)/(ST_RISE[0]-ST_RISE[1]));
 return{D,y,k,v,sc,tw,X,rise,fog:Math.min(1,(y-YG)/70)}}
Desk.prototype.stepWords=function(t){
 if(!this.stOn){this.stOn=1;const Ds=RM?[380,900,1700]:[450,1250,2100];this.words.forEach((w,i)=>stPlace(w,t,Ds[i],i%2?1:-1,false))}
 for(const w of this.words){const D=stCY(t)-w.my;
  if(D<ST_GONE){const center=!!this.seek&&!this.words.some(q=>q.center&&!q.cheered);   // passed: back far ahead with a new word
   w.s=pickWords(1,this.words.map(q=>q.s))[0];w.ci++;w.cT=t;stPlace(w,t,ST_FAR,-(w.side||1),center);continue}
  if(w.center&&!w.cheered&&D<ST_CHEER){w.cheered=true;this.flyCheer(t)}}};   // the airship passes right over it
// the airship flyover: cheer + ding (celebrate) and confetti from the gondola
Desk.prototype.flyCheer=function(t){const s=shipBox(t),cx=s.x+s.w/2,cy=s.y+s.h/2;
 if(!RM)for(let k=0;k<28;k++)this.conf.push({x:cx+(R()-.5)*240,y:cy,vx:(R()-.5)*700,vy:-(380+R()*420),c:WPAL[k%6],t0:t});
 celebrate(this,this.duds.map(d=>{const p=this.pos(d,t);return[d,Math.hypot(p.x+DW/2-cx,p.y+DH/2-cy)]}),900,t)};
function drawStructs(sim,c,t){const L=[];for(const w of sim.words){const g=stGeom(w,t);if(g&&g.rise>0&&g.X+g.tw/2>-40&&g.X-g.tw/2<W+40)L.push([g,w])}
 L.sort((a,b)=>b[0].D-a[0].D);   // far first
 for(const [g,w] of L){const {y,k,v,sc,tw,X,rise,fog}=g,ci=((w.ci%6)+6)%6,a=Math.min(1,(t-w.cT)/.45);
  // the slab: a block on the ground ST_DEPTH texels deep, a little wider than the word
  const hw=(tw/2)*k+8,y2=stY(g.D+ST_DEPTH),k2=stK(y2),X2=W/2+(w.mx-stCX(t))/k2,f=hw/k,b2=hw/k2;
  c.globalAlpha=fog*Math.min(1,rise*3);c.fillStyle='#202a47';c.beginPath();c.moveTo(X-f,y);c.lineTo(X+f,y);c.lineTo(X2+b2,y2);c.lineTo(X2-b2,y2);c.closePath();c.fill();
  c.strokeStyle='rgba(150,180,225,.7)';c.lineWidth=Math.max(1,2/k);c.stroke();c.fillStyle='#141a30';c.fillRect(X-f,y,2*f,Math.max(2,5/k));   // slab front face
  // the letters stand on the slab's front edge; while rising, only their top part is above ground
  const sh=ST_GL*rise;if(sh>=1){const dy=y-sh*sc,iw=v[0].width;
   c.globalAlpha=fog;c.drawImage(v[(ci+5)%6],0,0,iw,sh,X-tw/2,dy,tw,sh*sc);if(a<1)c.globalAlpha=fog*a;c.drawImage(v[ci],0,0,iw,sh,X-tw/2,dy,tw,sh*sc)}
  c.globalAlpha=1}}

/* ================= add-on 3: Their Finest Duds in the air: fighter planes + the speaker's airship (Oct 9, Bryan) ================= */
// The Duds no longer hop around the desk. The speaker rides an airship that floats forward at the bottom centre of the screen
// (the cards pop out of its gondola); every other Dud flies a fighter plane across the map on any heading: straight at the
// screen (heading 0), across, or away into the distance (180; the camera chases it, so it pulls away slowly). Planes are
// flat-shaded 2D sprites pre-rendered from a tiny 3D model at 16 headings (early flight-sim jank); the goggled pilots are drawn
// way oversized on purpose so you can see who's flying (PL_PILOT). The airship captain wears the old-school aviator goggles.
// No crashes: a new plane's whole route is checked against every plane in the air (and the airship) before it launches; a route
// that passes close but safe makes both pilots angry when they pass. When the airship passes right over a word structure (the
// lined-up one), the Duds cheer and the ding plays. Reduced motion: no planes; the airship holds still. Knobs: PL_*, SHIP_*.
const PL_PILOT=30,PL_PILOT_MIN=34,PL_MAX=2,PL_SEP=150,PL_NEAR=420,PL_V=[70,110],PL_ALT=[80,160],PL_N=16,PL_PX=.8,PL_EL=22*Math.PI/180;
const SHIP_SS=5,SHIP_W=120,SHIP_H=80,SHIP_CX=60,SHIP_CY=34,SHIP_Y=520,SHIP_D=60,SHIP_ALT=59,SHIP_R=140,SHIP_EL=52*Math.PI/180;
// --- tiny raster helpers (pixel-exact, no anti-aliasing: the chunky look comes from scaling these up without smoothing)
const rgb=c=>typeof c==='string'?hx(c):c,shadeC=(c,f)=>rgb(c).map(v=>Math.max(0,Math.min(255,Math.round(v*f))));
const img=(w,h)=>({w,h,d:new Uint8ClampedArray(w*h*4)});
function put(I,x,y,c,a=255){if(x<0||y<0||x>=I.w||y>=I.h)return;const i=(y*I.w+x)*4,q=rgb(c);I.d[i]=q[0];I.d[i+1]=q[1];I.d[i+2]=q[2];I.d[i+3]=a}
function fillPoly(I,pts,c){const ys=pts.map(p=>p[1]),y0=Math.max(0,Math.floor(Math.min(...ys))),y1=Math.min(I.h-1,Math.ceil(Math.max(...ys)));
 for(let y=y0;y<=y1;y++){const yc=y+.5,xs=[];for(let i=0;i<pts.length;i++){const [ax,ay]=pts[i],[bx,by]=pts[(i+1)%pts.length];if((ay<=yc&&by>yc)||(by<=yc&&ay>yc))xs.push(ax+(yc-ay)/(by-ay)*(bx-ax))}
  xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2)for(let x=Math.max(0,Math.ceil(xs[k]-.5));x<=Math.min(I.w-1,Math.floor(xs[k+1]-.5));x++)put(I,x,y,c)}}
function fillEll(I,cx,cy,rx,ry,c){for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){const u=(x+.5-cx)/rx,v=(y+.5-cy)/ry;if(u*u+v*v<=1)put(I,x,y,c)}}
function toCanvas(I){const b=buf(I.w,I.h),c=b.getContext('2d'),id=c.createImageData(I.w,I.h);id.data.set(I.d);c.putImageData(id,0,0);return b}

// --- fighter plane: a 3D model (nose +z, units = map texels) flat-shaded at 16 headings
const PLANE=(()=>{const R1=[30,1.5,-1.5,1.5],R2=[14,4,-3.5,3.5],R3=[-10,3.5,-3,3.5],R4=[-30,1.5,0,3],rings=[R1,R2,R3,R4],P=[];
 const ring=([z,hw,y0,y1])=>[[-hw,y0,z],[hw,y0,z],[hw,y1,z],[-hw,y1,z]];   // bottom-left, bottom-right, top-right, top-left
 for(let i=0;i<3;i++){const a=ring(rings[i]),b=ring(rings[i+1]);for(let s=0;s<4;s++)P.push(['body',[a[s],a[(s+1)%4],b[(s+1)%4],b[s]]])}
 P.push(['body',ring(R1)],['body',ring(R4)]);
 P.push(['wing',[[-30,0,2],[30,0,2],[30,0,-8],[-30,0,-8]]],['wing',[[-4,0,9],[4,0,9],[30,0,2],[-30,0,2]]]);   // swept wings
 P.push(['wing',[[-12,1,-23],[12,1,-23],[12,1,-31],[-12,1,-31]]],['body',[[0,1,-19],[0,13,-27],[0,13,-32],[0,1,-31]]]);   // tailplane + fin
 P.push(['glass',[[-2.6,3.6,13],[2.6,3.6,13],[2.6,3.6,2],[-2.6,3.6,2]]]);
 return P})();
const PLF=new Map();   // pal|frame -> {cv, cu, cv2 (cockpit in low-res px), w, h}
function planeFrame(pal,f){const key=pal+'|'+f;let F=PLF.get(key);if(F)return F;
 const th=f/PL_N*TAU,ps=Math.PI-th,cs=Math.cos(ps),sn=Math.sin(ps),ce=Math.cos(PL_EL),se=Math.sin(PL_EL),S=56,O=S/2,I=img(S,S);
 const tf=([x,y,z])=>{const x1=x*cs+z*sn,z1=-x*sn+z*cs;return[O+x1*PL_PX,O+(-y*ce-z1*se)*PL_PX,y*se-z1*ce]};   // u, v, depth (bigger = nearer)
 const body=hx(DUD.PAL[pal].Y),col={body,wing:shadeC(body,.72),glass:[40,70,100]},L=[-.4,.8,.45],ln=Math.hypot(...L);
 const polys=PLANE.map(([k,pts])=>{const q=pts.map(tf),a=q[0],b=q[1],c=q[2],ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
  const n=[uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx],nl=Math.hypot(...n)||1,lit=Math.abs((n[0]*L[0]-n[1]*L[1]+n[2]*L[2])/nl/ln);
  return{k,q,z:q.reduce((s,p)=>s+p[2],0)/q.length,f:.5+.55*lit}}).sort((a,b)=>a.z-b.z);
 for(const p of polys)fillPoly(I,p.q.map(x=>[x[0],x[1]]),shadeC(col[p.k],p.f));
 const ck=tf([0,4.2,7]);F={cv:toCanvas(I),cu:ck[0],cvv:ck[1],S};PLF.set(key,F);return F}

// --- the airship: an ellipsoid envelope ray-cast per pixel, dithered to a 16-bit palette, seen from behind and above
const ENV=['#323849','#555e78','#7f88a2','#aeb6c8','#dde2ec'].map(hx),BAND=['#6e1f1c','#a8352d','#d0503f'].map(hx);
let SHIPIMG=null;const PROP_R=5,PROP_FPS=8;   // propeller blade length (sprite px) and frame rate (4 frames = a quarter turn)
function shipSprites(){if(SHIPIMG)return SHIPIMG;const A=40,Bx=16,Cy=15,ce=Math.cos(SHIP_EL),se=Math.sin(SHIP_EL),I=img(SHIP_W,SHIP_H),F=img(SHIP_W,SHIP_H);
 const Lv=[-.45,.75,-.5],ll=Math.hypot(...Lv),pr=(x,y,z)=>[SHIP_CX+x,SHIP_CY-y*ce-z*se],SB=new Float32Array(SHIP_W*SHIP_H).fill(-1e9);   // SB: envelope depth per pixel
 for(let py=0;py<SHIP_H;py++)for(let px=0;px<SHIP_W;px++){const u=px+.5-SHIP_CX,v=py+.5-SHIP_CY,x=u,y0=-v*ce,z0=-v*se;   // ray: (x, y0+s*se, z0-s*ce)
  const qa=se*se/(Cy*Cy)+ce*ce/(A*A),qb=2*(y0*se/(Cy*Cy)-z0*ce/(A*A)),qc=x*x/(Bx*Bx)+y0*y0/(Cy*Cy)+z0*z0/(A*A)-1,disc=qb*qb-4*qa*qc;if(disc<0)continue;
  const s=(-qb+Math.sqrt(disc))/(2*qa),y=(SB[py*SHIP_W+px]=s,y0+s*se),z=z0-s*ce,n=[x/(Bx*Bx),y/(Cy*Cy),z/(A*A)],nl=Math.hypot(...n);
  let sh=.18+.82*Math.max(0,(n[0]*Lv[0]+n[1]*Lv[1]+n[2]*Lv[2])/nl/ll);const th=(BAY4[(py&3)*4+(px&3)]+.5)/16;
  if(Math.abs(z)<2.6){put(I,px,py,BAND[Math.min(2,Math.floor(sh*2.2+th))]);continue}   // the red belly band
  let k=Math.min(4,Math.floor(sh*4+th));if(Math.abs(Math.sin(4*Math.atan2(y,x)))<.13||Math.abs(Math.abs(z)-A*.62)<.7)k=Math.max(0,k-1);   // seams + rings
  put(I,px,py,ENV[k])}
 const fin=(pts,c)=>fillPoly(I,pts.map(p=>pr(...p)),c),zt=-A+3,zt2=-A+13;   // tail fins (the tail is the near end)
 // Oct 9f: fins lit per pixel like the envelope and dithered into ENV (darker toward the tip, a rib down the middle, a darker rim)
 const sfin=(P3,root,tip)=>{const q=P3.map(p=>pr(...p)),Mk=img(SHIP_W,SHIP_H);fillPoly(Mk,q,[255,255,255]);
  const [a,b,c]=P3,n=[(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]),(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]),(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])],nl=Math.hypot(...n)||1;
  const lit=Math.abs(n[0]*Lv[0]+n[1]*Lv[1]+n[2]*Lv[2])/nl/ll,den=n[1]*se-n[2]*ce,dd=n[0]*a[0]+n[1]*a[1]+n[2]*a[2];
  const R0=pr(...root),T0=pr(...tip),gx=T0[0]-R0[0],gy=T0[1]-R0[1],gl=gx*gx+gy*gy||1,in_=(x,y)=>x>=0&&y>=0&&x<SHIP_W&&y<SHIP_H&&Mk.d[(y*SHIP_W+x)*4+3]>0;
  for(let py=0;py<SHIP_H;py++)for(let px=0;px<SHIP_W;px++){if(!in_(px,py))continue;const u=px+.5-SHIP_CX,v=py+.5-SHIP_CY;
   if(Math.abs(den)>1e-6&&(dd-n[0]*u+n[1]*v*ce+n[2]*v*se)/den<SB[py*SHIP_W+px])continue;   // the envelope is in front
   const ex=px+.5-R0[0],ey=py+.5-R0[1],g=Math.max(0,Math.min(1,(ex*gx+ey*gy)/gl)),w=Math.abs(ex*gy-ey*gx)/Math.sqrt(gl),th=(BAY4[(py&3)*4+(px&3)]+.5)/16;
   let k=Math.floor((.3+.7*lit)*(1-.45*g)*4+th);if(!in_(px-1,py)||!in_(px+1,py)||!in_(px,py-1)||!in_(px,py+1))k--;if(w<.6&&g>.1&&g<.9)k--;
   put(I,px,py,ENV[Math.max(0,Math.min(4,k))])}};
 sfin([[Bx-6,0,zt2],[Bx+9,0,zt+2],[Bx+9,0,zt],[Bx-6,0,zt]],[Bx-2,0,zt+5],[Bx+9,0,zt+1]);sfin([[-Bx+6,0,zt2],[-Bx-9,0,zt+2],[-Bx-9,0,zt],[-Bx+6,0,zt]],[-Bx+2,0,zt+5],[-Bx-9,0,zt+1]);
 fin([[0,Cy-5,zt2],[0,Cy+9,zt+2],[0,Cy+9,zt],[0,Cy-5,zt]],'#9aa3b8');fin([[0,-Cy+5,zt2],[0,-Cy-8,zt+2],[0,-Cy-8,zt],[0,-Cy+5,zt]],'#7a839a');
 // the speaker's open deck on top of the envelope's rear third (seen from above, a hanging gondola would be hidden), a railing in
 // front of the Dud (layer F), and an engine pod on each side
 const zd=-.42*A,yt=Cy*Math.sqrt(1-(zd/A)**2)+.3,box=(pts,c,T=I)=>fillPoly(T,pts.map(p=>pr(...p)),c);
 box([[-7,yt,zd+5],[7,yt,zd+5],[7,yt,zd-5],[-7,yt,zd-5]],'#6b4a2b');box([[-7,yt,zd+5],[7,yt,zd+5],[7,yt+.6,zd+5.6],[-7,yt+.6,zd+5.6]],'#3e2a17');
 box([[-8,yt+4,zd-5],[8,yt+4,zd-5],[8,yt,zd-5],[-8,yt,zd-5]],'#8a6136',F);box([[-8,yt+4,zd-5],[8,yt+4,zd-5],[8,yt+3.3,zd-5],[-8,yt+3.3,zd-5]],'#c08a52',F);
 for(const x of [-7.5,-2.5,2.5,7.5])box([[x-.5,yt+4,zd-5],[x+.5,yt+4,zd-5],[x+.5,yt,zd-5],[x-.5,yt,zd-5]],'#5a3a1e',F);
 const pz=-8,pods=[-1,1].map(s=>pr(s*(Bx+2.5),-1,pz));for(const [u,v] of pods)for(let y=Math.floor(v-3.4);y<=Math.ceil(v+3.4);y++)for(let x=Math.floor(u-2.6);x<=Math.ceil(u+2.6);x++){   // Oct 9f: dithered pods
  const a=(x+.5-u)/2.6,b=(y+.5-v)/3.4,r2=a*a+b*b;if(r2>1)continue;const lit=Math.max(0,-.55*a-.6*b+.58*Math.sqrt(1-r2)),th=(BAY4[(y&3)*4+(x&3)]+.5)/16;
  put(I,x,y,ENV[Math.max(0,Math.min(2,Math.floor((.1+.6*lit)*4+th)-(r2>.72?1:0)))])}
 const deck=pr(0,yt,zd),props=pods.map(([u,v])=>[u,v+3]);
 const PW=2*PROP_R+3,PH=2*Math.ceil(PROP_R*.62)+3,pc=[PW/2,PH/2],propF=[];   // Oct 9f: propellers as pixel sprites
 for(let f=0;f<4;f++){const P=img(PW,PH);for(let bl=0;bl<4;bl++){const an=Math.PI/4+bl*Math.PI/2+f*Math.PI/8,ca=Math.cos(an),sa=Math.sin(an),lit=Math.max(0,Math.cos(an+2.3));
  for(let r=.5;r<=PROP_R;r+=.25)put(P,Math.floor(pc[0]+ca*r),Math.floor(pc[1]+sa*r*.62),ENV[r>PROP_R-1.2?2:3+(lit>.5?1:0)])}
  put(P,Math.floor(pc[0]),Math.floor(pc[1]),ENV[0]);propF.push(toCanvas(P))}
 return SHIPIMG={back:toCanvas(I),front:toCanvas(F),deck,props,propF,pc}}
// the airship's screen box for the speaker Dud (bobbing + a slow sideways drift) and its geometry
function shipPose(t){const x=W/2+(RM?0:18*Math.sin(t*.07)),y=SHIP_Y+(RM?0:6*Math.sin(t*.8));return{x,y}}
function shipBox(t){const S=shipSprites(),p=shipPose(t),dw=17*SHIP_SS,dh=16*SHIP_SS,dx=p.x-SHIP_W*SHIP_SS/2+S.deck[0]*SHIP_SS-dw/2,dy=SHIP_Y+(p.y-SHIP_Y)+S.deck[1]*SHIP_SS-dh+2*SHIP_SS;
 return{x:dx,y:dy,w:dw,h:dh}}
function drawShip(sim,c,t,d){const S=shipSprites(),p=shipPose(t),ox=p.x-SHIP_W*SHIP_SS/2,oy=p.y,sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
 c.drawImage(S.back,ox,oy,SHIP_W*SHIP_SS,SHIP_H*SHIP_SS);
 if(d){const b=shipBox(t);c.drawImage(dudSpr(DUD.make(face(d,t)),d.tr.pal,true),Math.round(b.x),Math.round(b.y),b.w,b.h)}   // the captain wears the aviator goggles
 c.drawImage(S.front,ox,oy,SHIP_W*SHIP_SS,SHIP_H*SHIP_SS);
 S.props.forEach(([u,v],j)=>{const f=RM?0:Math.floor(t*PROP_FPS)%4,P=S.propF[j?f:(4-f)%4];   // Oct 9f: pixel propellers, counter-rotating, stepped
  c.drawImage(P,ox+Math.round(u-S.pc[0])*SHIP_SS,oy+Math.round(v-S.pc[1])*SHIP_SS,P.width*SHIP_SS,P.height*SHIP_SS)});
  
  
 c.imageSmoothingEnabled=sm}

// --- flight paths: camera-relative, straight lines (D ahead, x across, a = altitude, all in texels)
const plAt=(p,t)=>{const s=t-p.tp;return[p.D+p.rD*s,p.x+p.rX*s,p.a]};
function plScreen(D,x,a){if(D<-240||D>2700)return null;const yg=stY(D),k=stK(yg);return{X:W/2+x/k,Y:yg-a/k,yg,k}}
const plVis=(D,x,a)=>{const s=plScreen(D,x,a);return!!s&&s.X>-220&&s.X<W+220&&s.Y>-160&&s.Y<H+160};
function plRoute(sim,t){const planes=sim.duds.filter(d=>d.plane&&!d.gone).map(d=>d.plane);
 for(let tries=0;tries<14;tries++){const th=R()*TAU,V=PL_V[0]+R()*(PL_V[1]-PL_V[0]),a=PL_ALT[0]+R()*(PL_ALT[1]-PL_ALT[0]),D=220+R()*1000,k=stK(stY(D)),x=(R()*2-1)*W/2*k*.6;
  const p={D,x,a,rD:-FLY-V*Math.cos(th),rX:V*Math.sin(th),tp:0,th};if(!plVis(D,x,a))continue;
  let s0=0,s1=0;while(s0>-200&&plVis(...plAt(p,s0-.1)))s0-=.1;while(s1<200&&plVis(...plAt(p,s1+.1)))s1+=.1;if(s1-s0<4)continue;
  p.tp=t-s0;p.t0=t;p.t1=p.tp+s1;p.nm=[];let ok=true;
  for(let tt=p.t0;tt<=p.t1&&ok;tt+=.1){const [D1,x1,a1]=plAt(p,tt);if(Math.hypot(D1-SHIP_D,x1,a1-SHIP_ALT)<SHIP_R)ok=false}   // never through the airship
  for(const q of planes){if(!ok)break;let best=1e9,bt=0;for(let tt=Math.max(p.t0,q.t0);tt<=Math.min(p.t1,q.t1);tt+=.1){const A=plAt(p,tt),B=plAt(q,tt),dd=Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2]);if(dd<best){best=dd;bt=tt}}
   if(best<PL_SEP)ok=false;else if(best<PL_NEAR){p.nm.push({t:bt,q});q.nm.push({t:bt,q:p})}}   // close but safe: both pilots get angry as they pass
  if(!ok){for(const q of planes)q.nm=q.nm.filter(n=>n.q!==p);continue}
  p.f=((Math.round(th/TAU*PL_N)%PL_N)+PL_N)%PL_N;return p}
 return null}

// --- the Desk's Duds: one airship pilot (the speaker) + up to PL_MAX planes
Desk.prototype.spawnPlane=function(d,t){if(RM)return null;const p=plRoute(this,t);if(!p)return null;d=d||mkDud();Object.assign(d,{state:'roam',hop:null,ship:0,plane:p,gone:0});p.d=d;this.duds.push(d);return d};
Desk.prototype.spawn=function(tr){if(!this.duds.some(d=>d.ship&&!d.gone)){const d=mkDud(tr);Object.assign(d,{state:'roam',hop:null,ship:1});this.duds.push(d);return d}
 return this.spawnPlane(mkDud(tr),T)};
Desk.prototype.adopt=function(o){for(const od of carry(o,this.maxD)){const d=Object.assign({},od,{state:'roam',hop:null,next:T+.3,ship:0,plane:null});   // the speaker (carried first) takes the airship
 if(!this.duds.some(q=>q.ship)){d.ship=1;this.duds.push(d)}else this.spawnPlane(d,T)}};
Desk.prototype.pickSpeaker=function(){return this.duds.find(d=>d.ship&&!d.gone)||null};
Desk.prototype.spkRect=function(){const d=this.duds.find(d=>d.ship&&!d.gone);return d?shipBox(T):null};
Desk.prototype.pos=function(d,t){if(d.ship){const b=shipBox(t);return{x:b.x+b.w/2-DW/2,y:b.y+b.h/2-DH/2}}   // top-left of a DW x DH box around the Dud
 if(d.plane){const s=plScreen(...plAt(d.plane,t));if(s)return{x:s.X-DW/2,y:s.Y-DH/2}}return{x:-999,y:-999}};
Desk.prototype.norm=function(d){const p=this.pos(d,this.t);return[Math.max(.05,Math.min(.95,(p.x+DW/2)/W)),Math.max(.1,Math.min(.9,(p.y+DH/2)/H))]};
Desk.prototype.step=function(t){const dt=Math.max(0,t-this.t);this.t=t;
 if(!this.duds.some(d=>d.ship&&!d.gone))this.spawn();
 if(!RM&&t>=(this.nextPlane||0)&&this.duds.filter(d=>d.plane&&!d.gone).length<Math.min(PL_MAX,this.maxD-1)){this.spawnPlane(null,t);this.nextPlane=t+3+R()*8}
 for(const d of this.duds)if(d.plane){const p=d.plane;if(t>p.t1&&!isSpk(d))d.gone=1;for(const n of p.nm)if(!n.done&&t>=n.t){n.done=1;d.angry=t+1.2}}
 this.duds=this.duds.filter(d=>!d.gone);
 if(!this.seek&&t>this.nextCorner)this.seek=this.words[Math.floor(R()*this.words.length)];
 this.stepWords(t,dt);for(const p of this.conf){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=520*dt}this.conf=this.conf.filter(p=>t-p.t0<1.4)};
function drawPlane(c,d,t){const s=plScreen(...plAt(d.plane,t));if(!s)return;const F=planeFrame(d.tr.pal,d.plane.f),sc=1/s.k/PL_PX,sz=F.S*sc,x0=s.X-sz/2,y0=s.Y-sz/2;
 c.drawImage(F.cv,x0,y0,sz,sz);const dw=Math.max(PL_PILOT_MIN,PL_PILOT/s.k),dh=dw*11/17;   // the goggled pilot's head, way oversized (early-90s jank)
 c.drawImage(dudSpr(DUD.make(face(d,t)),d.tr.pal,true),0,0,17,11,x0+F.cu*sc-dw/2,y0+F.cvv*sc-dh*.85,dw,dh)}
Desk.prototype.draw=function(c,t){drawFlight(c,t);drawStructs(this,c,t);
 const ship=this.duds.find(d=>d.ship),planes=this.duds.filter(d=>d.plane);
 c.fillStyle='rgba(0,0,0,.22)';for(const d of planes){const [D,x]=plAt(d.plane,t);const s=plScreen(D,x,0);if(s&&s.yg<H+40){c.beginPath();c.ellipse(s.X,s.yg,26/s.k,6/s.k,0,0,TAU);c.fill()}}   // shadows on the map
 {const p=shipPose(t);c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.ellipse(p.x,stY(SHIP_D),120,22,0,0,TAU);c.fill()}
 const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
 const L=planes.map(d=>[plAt(d.plane,t)[0],d]);L.push([SHIP_D,ship||null,1]);L.sort((a,b)=>b[0]-a[0]);   // far to near; the airship sits at SHIP_D
 for(const [,d,isShip] of L){if(isShip)drawShip(this,c,t,d);else drawPlane(c,d,t)}
 c.imageSmoothingEnabled=sm;for(const p of this.conf){c.fillStyle=p.c;c.fillRect(Math.round(p.x/4)*4,Math.round(p.y/4)*4,12,12)}
 deskCards(c,this);deskTimer(c);deskSave(c)};

/* ================= add-on 4: Starfield's goggled Dud flies a little space fighter (Oct 9, Bryan) ================= */
// The pilot (starfighter helmet) sits in the canopy of an original twin-engine fighter seen from behind (2D pixels, faux 3D). It glides instead of
// hopping and banks with the starfield's roll (the existing lean). Engines glow, brighter in hyperspace. Done by wrapping
// Stars.prototype.draw: while it runs, its one DUD.draw call (the pilot) draws the fighter + pilot instead.
let FIGHTER=null,FTR=null;
// starfighter helmet (Oct 9, Bryan: space pilots get a flight helmet; the aviator goggles moved to the zeppelin captain): a white
// dome with an orange centre stripe over the antennae, a raised tinted visor just above the eyes (so faces still read), ear guards.
// Same 16-column grid as the Dud, drawn straight on top of it.
const HELMET=['.....KKKKKK.....','...KKHHOOHHKK...','..KHHHHOOHHHHK..','.KHHHHHOOHHHHHK.','.KVVvVVVVVVvVVK.','.KHK........KHK.','.KHK........KHK.','.KHK........KHK.','..KK........KK..'];
const HPAL={K:'#1B1B2A',H:'#F2F4F8',O:'#FF8A3D',V:'#2a3550',v:'#8fb4ff'};
function drawHelmet(c,x,y,px){for(let r=0;r<HELMET.length;r++)for(let q=0;q<16;q++){const ch=HELMET[r][q];if(ch!=='.'){c.fillStyle=HPAL[ch];c.fillRect(x+q*px,y+r*px,px+.5,px+.5)}}}
function fighterSprites(){if(FTR)return FTR;const B=img(72,32),Fr=img(72,32),hull='#d6d9e2',shade='#8d93a3',wing='#b9bfcc';
 for(const s of [-1,1]){const m=([x,y])=>[36+s*(x-36),y];
  fillPoly(B,[[28,15],[2,19],[1,23],[28,22]].map(m),wing);fillPoly(B,[[24,17],[5,20],[5,21],[24,19]].map(m),'#ff5fa2');fillPoly(B,[[1,13],[4,13],[4,24],[1,24]].map(m),shade)}
 fillEll(B,36,9,6.5,4.5,'#2b6f99');fillEll(B,34.5,7.5,2.2,1.4,'#8fd3ff');   // canopy
 fillPoly(Fr,[[29,11],[43,11],[46,24],[26,24]],hull);fillPoly(Fr,[[27,20],[45,20],[46,24],[26,24]],shade);fillPoly(Fr,[[29,11],[43,11],[43,12],[29,12]],'#f2f4f8');
 for(const x of [31,41]){fillEll(Fr,x,25,4.2,4.2,'#3a3f4c');fillEll(Fr,x,25,2.4,2.4,'#14161c')}
 return FTR={back:toCanvas(B),front:toCanvas(Fr)}}
function drawFighter(c,px,rows,pal,sim){const F=fighterSprites(),S=4,w=72*S,h=32*S,x0=-w/2,y0=-h+8,sm=c.imageSmoothingEnabled,t=sim.t||0;c.imageSmoothingEnabled=false;
 c.drawImage(F.back,x0,y0,w,h);DUD_DRAW(c,-34,y0+13*S-60,4,rows,pal,false);drawHelmet(c,-34,y0+13*S-60,4);c.drawImage(F.front,x0,y0,w,h);   // helmeted pilot between canopy and hull
 const e=sim.e||0,pulse=RM?1:1+.12*Math.sin(t*TAU*1.5);   // engine glow (slow pulse; longer in hyperspace)
 for(const x of [31,41]){const gx=x0+x*S,gy=y0+25*S,r=(14+30*e)*pulse,g=c.createRadialGradient(gx,gy,0,gx,gy,r);g.addColorStop(0,'rgba(255,240,200,.95)');g.addColorStop(.35,'rgba(255,150,60,.75)');g.addColorStop(1,'rgba(255,90,30,0)');
  c.fillStyle=g;c.beginPath();c.ellipse(gx,gy+r*.25*e,r*.6,r*(1+e),0,0,TAU);c.fill()}
 c.imageSmoothingEnabled=sm}
const DUD_DRAW=DUD.draw;
DUD.draw=function(c,x,y,px,rows,pal,gog){if(FIGHTER){const s=FIGHTER;FIGHTER=null;try{drawFighter(c,px,rows,pal,s)}finally{FIGHTER=s}return}return DUD_DRAW.apply(this,arguments)};
const STARS_DRAW=Stars.prototype.draw;
Stars.prototype.draw=function(c,t){const h=this.hop,gx=this.gx,tg=h?h.x1:gx;   // glide toward where the hop would land
 if(this.sx==null)this.sx=tg;const dt=Math.min(.1,Math.max(0,t-(this.sxT??t)));this.sxT=t;this.sx+=(tg-this.sx)*Math.min(1,dt*2);
 this.hop=null;this.gx=this.sx;FIGHTER=this;try{STARS_DRAW.call(this,c,t)}finally{FIGHTER=null;this.hop=h;this.gx=gx}};

