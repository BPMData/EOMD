
'use strict';
const W=1920,H=1080,TAU=Math.PI*2,Q=new URLSearchParams(location.search),SOLO=Q.get('d');
const buf=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
function rng(s){return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const BAY4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const INK='#1C2433',FACE='#CFC8B8',LT='#F7F2E6',DK='#6F6A5E',DD='#36332D',PAPER='#F7F1E1';
function bevel(c,x,y,w,h,inset){c.fillStyle=inset?DK:LT;c.fillRect(x,y,w,4);c.fillRect(x,y,4,h);c.fillStyle=inset?LT:DK;c.fillRect(x,y+h-4,w,4);c.fillRect(x+w-4,y,4,h)}
/* the original Dud, exact */
const SPR=['..K.........K...','...K.......K....','....K.....K.....','..KKKKKKKKKKKK..','..KYYYYYYYYYYK..','..KYWEYYYYWEYK..','..KYWWYYYYWWYK..','..KYYYYYYYYYYK..','..KYYYKKKKYYYK..','..KYYYYYYYYYCK..','..KYYYYYYYYCKK..','..KyyyyyyyyKK...','..KKKKKKKKKK....','...K..K..K..K...','..K..K....K..K..'];
const SPAL={K:'#1B1B2A',Y:'#F5D547',y:'#D4AE35',W:'#FFFFFF',E:'#1B1B2A',C:'#FFF3B0'};
function sprite(c,x,y,px){for(let r=0;r<SPR.length;r++)for(let q=0;q<16;q++){const ch=SPR[r][q];if(ch!=='.'){c.fillStyle=SPAL[ch];c.fillRect(x+q*px,y+r*px,px+.5,px+.5)}}}

/* ---------- card (copy word for word, proj__cs__copy.md card 5) ---------- */
const CARD={tip:'Tip 5 of 14',en:['One Change at a Time','Change one thing. Test. Repeat.'],es:['Un cambio a la vez','Cambia una cosa. Prueba. Repite.'],pt:['Uma mudança por vez','Mude uma coisa. Teste. Repita.']};
function wrapL(c,t,mw){const o=[];let cur='';for(const w of t.split(' ')){const n=cur?cur+' '+w:w;if(c.measureText(n).width<=mw||!cur)cur=n;else{o.push(cur);cur=w}}return o.concat(cur)}
const PAD=46,TB=64;
function layout(c,iw,draw){let y=6+TB+30;const x0=6+PAD;c.textBaseline='alphabetic';c.textAlign='left';
 c.font='700 100px Pix';if(draw){c.fillStyle='#c9c2f0';c.fillText(CARD.en[0],x0+4,y+90);c.fillStyle=INK;c.fillText(CARD.en[0],x0,y+86)}y+=120;
 c.font='52px Atk';for(const l of wrapL(c,CARD.en[1],iw)){if(draw){c.fillStyle=INK;c.fillText(l,x0,y+40)}y+=66}y+=24;
 for(const [tag,[ti,bo],bg,tc,bc] of [['ES',CARD.es,'#2a2840','#f2c14e','#f3efe0'],['PT',CARD.pt,'#f2c14e','#2a2840','#2a2840']]){
  c.font='46px Atk';const ls=wrapL(c,bo,iw-138),bh=24+58*(1+ls.length)+16;
  if(draw){c.fillStyle=bg;c.fillRect(x0-14,y,iw+28,bh);c.font='700 48px Pix';c.fillStyle=tc;c.fillText(tag,x0+6,y+70);c.font='700 46px Atk';c.fillText(ti,x0+110,y+66);c.font='46px Atk';c.fillStyle=bc;ls.forEach((l,k)=>c.fillText(l,x0+110,y+66+58*(k+1)))}
  y+=bh+12}
 y+=14;const prog={x:x0-14,y,w:iw+28,h:40};if(draw){c.fillStyle='#e9e7df';c.fillRect(prog.x,prog.y,prog.w,prog.h);bevel(c,prog.x,prog.y,prog.w,prog.h,1)}
 return{h:y+40+PAD-10,prog}}
let CARDIMG;
function makeCard(){const m=buf(8,8).getContext('2d');m.font='700 100px Pix';let iw=m.measureText(CARD.en[0]).width;m.font='52px Atk';iw=Math.max(iw,m.measureText(CARD.en[1]).width);
 m.font='46px Atk';for(const L of[CARD.es,CARD.pt])iw=Math.max(iw,m.measureText(L[1]).width+138);m.font='700 46px Atk';for(const L of[CARD.es,CARD.pt])iw=Math.max(iw,m.measureText(L[0]).width+138);
 iw=Math.ceil(Math.min(1500,iw));const L=layout(m,iw,false),w=iw+2*PAD+12,h=L.h,b=buf(w,h),c=b.getContext('2d');
 c.fillStyle=FACE;c.fillRect(0,0,w,h);bevel(c,0,0,w,h,0);
 const bw=w-12,A=[15,76,92],B2=[62,156,143],cell=4;for(let yy=0;yy<TB;yy+=cell)for(let xx=0;xx<bw;xx+=cell){const lvl=xx/bw*4,lo=Math.floor(lvl),th=(BAY4[((yy/cell)&3)*4+((xx/cell)&3)]+.5)/16,k=Math.min(4,lo+(lvl-lo>th?1:0))/4;c.fillStyle=`rgb(${A.map((a,i)=>Math.round(a+(B2[i]-a)*k))})`;c.fillRect(6+xx,6+yy,cell,cell)}
 c.font='44px Pix';c.fillStyle='#0E2A30';c.fillText(CARD.tip,30,6+TB/2+17);c.fillStyle='#fff';c.fillText(CARD.tip,28,6+TB/2+15);
 for(const i of[0,1]){const bx=w-6-58-i*60,by=14;c.fillStyle=FACE;c.fillRect(bx,by,48,48);bevel(c,bx,by,48,48,0);c.fillStyle=DD;if(i===0)c.fillRect(bx+13,by+30,22,6);else{c.strokeStyle=DD;c.lineWidth=4;c.strokeRect(bx+13,by+13,22,20)}}
 c.fillStyle=PAPER;c.fillRect(6,6+TB,w-12,h-12-TB);c.fillStyle='rgba(120,160,205,.22)';for(let y=6+TB+58;y<h-8;y+=58)c.fillRect(6,y,w-12,2);
 layout(c,iw,true);CARDIMG={img:b,w,h,prog:L.prog}}
function drawCard(c,t){const T=t%11.5;let p;if(T<.35)p=T/.35;else if(T<6.5)p=1;else if(T<6.8)p=1-(T-6.5)/.3;else return;
 const e=1-Math.pow(1-p,3),s=.55+.45*e,C=CARDIMG,cx=W/2,cy=H/2-20,w=C.w*s,h=C.h*s,x=cx-w/2,y=cy-h/2;
 if(p<1){c.strokeStyle='#fff';c.lineWidth=3;c.globalAlpha=.55;for(let k=1;k<=3;k++){const q=Math.max(0,e-k*.2),ww=C.w*(.15+.85*q),hh=C.h*(.15+.85*q);c.strokeRect(cx-ww/2,cy-hh/2,ww,hh)}}
 c.globalAlpha=Math.min(1,p*2.5);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x+14*s,y+14*s,w,h);c.fillStyle='#0c0b1c';c.fillRect(x-3,y-3,w+6,h+6);c.drawImage(C.img,x,y,w,h);c.globalAlpha=1;
 if(p===1){const P=C.prog,n=14,seg=(P.w-16)/n,f=Math.floor(Math.min(1,(T-.35)/6.15)*n+.999);for(let i=0;i<f;i++){c.fillStyle='#2E5FA8';c.fillRect(x+P.x+8+i*seg+2,y+P.y+8,seg-4,P.h-16)}}}

/* ---------- bouncing marquee words (≤40 px/s, soft color swap on each wall hit) ---------- */
const WCOL=[['#ff5fa2','#7a1f55'],['#ffd23f','#7a5a10'],['#3fe0c5','#0f5e56'],['#a98bff','#3d2a7a'],['#ff8a3d','#7a3510'],['#8be04e','#2f5a12']];
let WIMG;function makeWords(){WIMG=['loop','debug','syntax'].map(t=>{const m=buf(8,8).getContext('2d');m.font='700 110px Pix';const tw=Math.ceil(m.measureText(t).width)+36;
 return WCOL.map(([f,d])=>{const b=buf(tw,150),c=b.getContext('2d');c.font='700 110px Pix';c.textBaseline='alphabetic';for(let k=9;k>0;k--){c.fillStyle=d;c.fillText(t,6+k*1.6,110+k*1.6)}c.lineWidth=4;c.strokeStyle='#1b1a33';c.strokeText(t,6,110);c.fillStyle=f;c.fillText(t,6,110);return b})})}
function tri(u,R){const n=Math.floor(u/R),f=u-n*R;return[((n%2)+2)%2?R-f:f,n,f]}
function drawWords(c,t){for(const [wi,x0,y0,vx,vy] of [[0,150,420,34,-26],[1,1100,760,-31,23],[2,700,90,28,32]]){const im=WIMG[wi],RX=W-im[0].width,RY=H-im[0].height;
 const [x,nx,fx]=tri(x0+vx*t,RX),[y,ny,fy]=tri(y0+vy*t,RY),sx=vx>0?fx/vx:(RX-fx)/-vx,sy=vy>0?fy/vy:(RY-fy)/-vy,k=(((nx+ny)%6)+6)%6,a=Math.min(1,Math.min(sx,sy)/.45);
 c.drawImage(im[(k+5)%6],x,y);if(a<1)c.globalAlpha=a;c.drawImage(im[k],x,y);c.globalAlpha=1}}

/* ---------- A: contour desk (the #3 look) ---------- */
let CONT;function makeContour(){const r=rng(3),b=buf(W,H),c=b.getContext('2d');c.fillStyle='#14223B';c.fillRect(0,0,W,H);c.strokeStyle='rgba(120,160,210,.07)';c.lineWidth=1;
 for(let x=0;x<=W;x+=120){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke()}for(let y=0;y<=H;y+=120){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke()}
 c.save();c.translate(1800,970);c.strokeStyle=c.fillStyle='rgba(200,215,235,.5)';c.lineWidth=2;c.beginPath();c.arc(0,0,70,0,TAU);c.stroke();for(let i=0;i<8;i++){c.save();c.rotate(i*TAU/8);const l=i%2?50:90;c.beginPath();c.moveTo(0,-l);c.lineTo(10,0);c.lineTo(-10,0);c.closePath();i%2?c.stroke():c.fill();c.restore()}c.restore();
 CONT={img:b,src:[[260,220],[1700,840],[1500,180],[380,900]].map(o=>[o[0],o[1],r()*TAU,r()*TAU])}}
function bgContour(c,t){c.drawImage(CONT.img,0,0,W,H);c.strokeStyle='rgba(95,135,185,.28)';c.lineWidth=2;
 for(const [ox,oy,a1,a2] of CONT.src)for(let k=1;k<=9;k++){c.beginPath();for(let i=0;i<=96;i++){const th=i/96*TAU,rad=k*48+16*Math.sin(3*th+a1+k*.3+t*.06)+10*Math.sin(5*th+a2-t*.04),X=ox+rad*Math.cos(th),Y=oy+rad*.8*Math.sin(th);i?c.lineTo(X,Y):c.moveTo(X,Y)}c.closePath();c.stroke()}}

/* ---------- B: lab maze (original raycaster, 320x180 upscaled) ---------- */
const MAP=['############','#..........#','#.###.####.#','#.###.####.#','#.########.#','#.######...#','#...######.#','#.########.#','#.###.####.#','#.###.####.#','#..........#','############'];
const RW=320,RH=180,TS=64;let RC,RCX,RCD,RC32,TX;
function tex(fn){const b=buf(TS,TS),c=b.getContext('2d');fn(c);return new Uint32Array(c.getImageData(0,0,TS,TS).data.buffer.slice(0))}
function makeMaze(){RC=buf(RW,RH);RCX=RC.getContext('2d');RCD=RCX.createImageData(RW,RH);RC32=new Uint32Array(RCD.data.buffer);const r=rng(11);
 const pcb=c=>{c.fillStyle='#1d5e3f';c.fillRect(0,0,TS,TS);for(let i=0;i<260;i++){c.fillStyle=r()<.5?'#18533a':'#236b48';c.fillRect(r()*TS|0,r()*TS|0,2,2)}
  c.fillStyle='#3fa66a';for(const y of[10,22,44,54])c.fillRect(0,y,TS,2);for(const x of[8,30,50])c.fillRect(x,22,2,22);c.fillRect(30,44,2,10);
  c.fillStyle='#111a16';c.fillRect(14,28,22,12);c.fillStyle='#9aa5a0';for(let i=0;i<5;i++){c.fillRect(16+i*4,26,2,2);c.fillRect(16+i*4,40,2,2)}
  c.fillStyle='#e0b94e';for(const [x,y] of[[6,8],[48,20],[28,52],[56,42],[4,52]])c.fillRect(x,y,5,5);c.fillStyle='#0d3324';c.fillRect(0,0,TS,2);c.fillRect(0,0,2,TS)};
 TX={wall:tex(pcb),dud:tex(c=>{pcb(c);c.fillStyle='#0d3324';c.fillRect(9,7,46,46);c.fillStyle='#d8d2c0';c.fillRect(11,9,42,42);c.fillStyle='#e3eef2';c.fillRect(14,12,36,36);sprite(c,16,14,2)}),
  floor:tex(c=>{for(let q=0;q<4;q++){c.fillStyle=(q===0||q===3)?'#b9c6cc':'#5f9ea0';c.fillRect((q&1)*32,(q>>1)*32,32,32)}for(let i=0;i<500;i++){c.fillStyle=r()<.5?'rgba(40,50,60,.35)':'rgba(255,255,255,.35)';c.fillRect(r()*TS|0,r()*TS|0,1,1)}c.fillStyle='#4a5a62';c.fillRect(0,0,TS,1);c.fillRect(0,32,TS,1);c.fillRect(0,0,1,TS);c.fillRect(32,0,1,TS)}),
  ceil:tex(c=>{c.fillStyle='#d9d2bf';c.fillRect(0,0,TS,TS);for(let i=0;i<220;i++){c.fillStyle='#a8a08c';c.fillRect(r()*TS|0,r()*TS|0,1,1)}c.fillStyle='#8f887a';c.fillRect(0,0,TS,2);c.fillRect(0,0,2,TS)}),
  lamp:tex(c=>{c.fillStyle='#8f887a';c.fillRect(0,0,TS,TS);c.fillStyle='#fbf8ee';c.fillRect(4,4,56,56);c.fillStyle='#e6e0cc';for(const x of[18,32,46])c.fillRect(x,4,2,56)})}}
const SEGC=[[1.5,1.5],[10.5,1.5],[10.5,10.5],[1.5,10.5]],SEGD=[[1,0],[0,1],[-1,0],[0,-1]],RAD=.5,STR=8,ARC=Math.PI/2*RAD,PER=4*(STR+ARC);
function pose(s){s=((s%PER)+PER)%PER;const i=Math.floor(s/(STR+ARC)),u=s-i*(STR+ARC),d=SEGD[i],n=SEGD[(i+1)%4],a0=Math.atan2(d[1],d[0]);
 if(u<STR){const C=SEGC[i];return[C[0]+d[0]*(RAD+u),C[1]+d[1]*(RAD+u),a0]}const th=(u-STR)/RAD,N=SEGC[(i+1)%4],cx=N[0]-RAD*d[0]+RAD*n[0],cy=N[1]-RAD*d[1]+RAD*n[1];
 return[cx-RAD*n[0]*Math.cos(th)+RAD*d[0]*Math.sin(th),cy-RAD*n[1]*Math.cos(th)+RAD*d[1]*Math.sin(th),a0+th]}
function shade(p,f){return 0xff000000|((((p>>16)&255)*f)<<16)|((((p>>8)&255)*f)<<8)|((p&255)*f)}
function bgMaze(c,t){const [px,py,a]=pose(t*.55),dx=Math.cos(a),dy=Math.sin(a),plx=-dy*.66,ply=dx*.66,B=RC32,h2=RH/2;
 for(let y=h2+1;y<RH;y++){const rd=h2/(y-h2),f=1/(1+rd*.22),sx=rd*2*plx/RW,sy=rd*2*ply/RW;let fx=px+rd*(dx-plx),fy=py+rd*(dy-ply);
  for(let x=0;x<RW;x++){const cx=Math.floor(fx),cy=Math.floor(fy),tx=(TS*(fx-cx))&63,ty=(TS*(fy-cy))&63,o=ty*TS+tx;B[y*RW+x]=shade(TX.floor[o],f);B[(RH-y-1)*RW+x]=shade(((cx*5+cy*3)%4===0?TX.lamp:TX.ceil)[o],f);fx+=sx;fy+=sy}}
 for(let x=0;x<RW;x++){B[h2*RW+x]=0xff202020;const k=2*x/RW-1,rx=dx+plx*k,ry=dy+ply*k,ddx=Math.abs(1/rx),ddy=Math.abs(1/ry);let mx=Math.floor(px),my=Math.floor(py),stx,sty,sdx,sdy,side=0;
  if(rx<0){stx=-1;sdx=(px-mx)*ddx}else{stx=1;sdx=(mx+1-px)*ddx}if(ry<0){sty=-1;sdy=(py-my)*ddy}else{sty=1;sdy=(my+1-py)*ddy}
  for(let g=0;g<64;g++){if(sdx<sdy){sdx+=ddx;mx+=stx;side=0}else{sdy+=ddy;my+=sty;side=1}if(MAP[my][mx]==='#')break}
  const pd=side?sdy-ddy:sdx-ddx,lh=RH/pd,y0=Math.max(0,Math.floor(h2-lh/2)),y1=Math.min(RH-1,Math.floor(h2+lh/2));let wx=side?px+pd*rx:py+pd*ry;wx-=Math.floor(wx);
  let tx=(wx*TS)|0;if((!side&&rx>0)||(side&&ry<0))tx=63-tx;const T=((mx*7+my*13)%11===0)?TX.dud:TX.wall,f=(side?.78:1)/(1+pd*.22);
  for(let y=y0;y<=y1;y++){const ty=Math.floor((y-h2+lh/2)*TS/lh)&63;B[y*RW+x]=shade(T[ty*TS+tx],f)}}
 RCX.putImageData(RCD,0,0);const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(RC,0,0,W,H);c.imageSmoothingEnabled=sm}

/* ---------- C: pixel starfield ---------- */
const STARS=(()=>{const r=rng(9),P=['#ffffff','#ffffff','#ffffff','#ff5fa2','#ffd23f','#3fe0c5','#a98bff'];return Array.from({length:420},()=>({x:(r()*2-1)*1.8,y:(r()*2-1)*1.1,z:r(),c:P[Math.floor(r()*P.length)]}))})();
function bgStars(c,t){c.fillStyle='#07061a';c.fillRect(0,0,W,H);for(const s of STARS){const z=((s.z-t*.028)%1+1)%1;if(z<.06)continue;const X=W/2+s.x/z*480,Y=H/2+s.y/z*480;if(X<-10||X>W+10||Y<-10||Y>H+10)continue;
 const sz=Math.max(3,Math.round((1-z)*9/3)*3);c.globalAlpha=Math.min(1,(1-z)*1.5);c.fillStyle=s.c;c.fillRect(Math.round(X/3)*3,Math.round(Y/3)*3,sz,sz)}c.globalAlpha=1}

/* ---------- D: tiled desktop ---------- */
let TILE;function makeTile(){const t=buf(32,32),x=t.getContext('2d');x.fillStyle='#241e5c';x.fillRect(0,0,32,32);x.fillStyle='#2b2470';for(let i=0;i<8;i++)for(let j=0;j<8;j++)if((i+j)%2===0&&(i*j)%3!==1)x.fillRect(i*4,j*4,4,4);
 x.fillStyle='#3d3494';x.fillRect(12,8,4,12);x.fillRect(8,12,12,4);x.fillStyle='#5a4fc0';x.fillRect(28,28,4,4);const b=buf(W,H),c=b.getContext('2d');c.fillStyle=c.createPattern(t,'repeat');c.fillRect(0,0,W,H);TILE=b}
function bgTile(c){c.drawImage(TILE,0,0,W,H)}

/* ---------- overlays ---------- */
let SCAN;function makeScan(){const b=buf(W,H),c=b.getContext('2d');c.fillStyle='rgba(0,0,0,.13)';for(let y=0;y<H;y+=4)c.fillRect(0,y,W,1);const g=c.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,W*.62);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.38)');c.fillStyle=g;c.fillRect(0,0,W,H);SCAN=b}
function overlays(c,t){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(80,1040,150,10);sprite(c,60,860-(Math.floor(t)%2)*10,10);drawCard(c,t);c.drawImage(SCAN,0,0,W,H)}

const CH=[{bg:bgContour,words:1},{bg:bgMaze,words:0},{bg:bgStars,words:0},{bg:bgTile,words:1}];
const MW=160,MH=90,mC=buf(MW,MH),mX=mC.getContext('2d'),mD=mX.createImageData(MW,MH);
function ditherMask(p){const d=mD.data;for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const v=.55*(BAY4[(y&3)*4+(x&3)]+.5)/16+.45*x/MW;d[(y*MW+x)*4+3]=v<p?255:0}mX.putImageData(mD,0,0);return mC}
function chan(c,i,t){CH[i].bg(c,t);if(CH[i].words)drawWords(c,t)}
const SK=[
 {id:'A',name:'Contour Desk',pitch:'Your sketch #3 desktop: navy contour map, faint grid, compass rose, with the contour lines slowly breathing. DVD-bounce words drift over it.',draw(c,t){chan(c,0,t)}},
 {id:'B',name:'Lab Maze',pitch:'A slow first-person glide through an original computer-lab maze: circuit-board walls, school floor tiles, drop ceiling with light panels, and a framed Dud hung on a few walls. The corridor is the motion, so no bouncing words.',draw(c,t){chan(c,1,t)}},
 {id:'C',name:'Pixel Starfield',pitch:'Chunky square stars drifting toward you in the word palette. Calm speed, no streaks.',draw(c,t){chan(c,2,t)}},
 {id:'D',name:'Tiled Desktop',pitch:'The Stage 1 still, moving: dithered tile wallpaper plus DVD-bounce words that swap color on every wall hit.',draw(c,t){chan(c,3,t)}},
 {id:'E',name:'Channel Surf',pitch:'Don’t pick: the screensaver switches module on its own (every few minutes for real; every 10 s here) with an ordered-dither dissolve, like a CD-ROM rotating through its savers.',
  draw(c,t,I){const T=t%40,i=Math.floor(T/10),u=T-i*10;if(u<9){chan(c,i,t);return}const j=(i+1)%4,s=I.cv.width/W;
   for(const [b,k] of[[I.b1,i],[I.b2,j]]){if(b.width!==I.cv.width){b.width=I.cv.width;b.height=I.cv.height}const x=b.getContext('2d');x.setTransform(s,0,0,s,0,0);chan(x,k,t)}
   const x=I.b2.getContext('2d');x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='destination-in';x.imageSmoothingEnabled=false;x.drawImage(ditherMask(u-9),0,0,I.b2.width,I.b2.height);x.globalCompositeOperation='source-over';x.imageSmoothingEnabled=true;
   c.setTransform(1,0,0,1,0,0);c.drawImage(I.b1,0,0);c.drawImage(I.b2,0,0);c.setTransform(s,0,0,s,0,0)}}];

const INST=[];
function size(I){const w=Math.min(1920,Math.round(I.cv.clientWidth*(devicePixelRatio||1)));if(I.cv.width!==w){I.cv.width=w;I.cv.height=Math.round(w*9/16)}}
async function boot(){await document.fonts.load('700 100px Pix');await document.fonts.load('46px Atk');await document.fonts.load('700 46px Atk');await document.fonts.load('44px Pix');
 makeCard();makeWords();makeContour();makeMaze();makeTile();makeScan();
 const root=document.getElementById('sk');if(SOLO)document.body.classList.add('solo');
 for(const sk of SK){if(SOLO&&SOLO!==sk.id)continue;const sec=document.createElement('section');
  sec.innerHTML=`<h2>${sk.id}. ${sk.name}</h2><p class="pitch">${sk.pitch}</p><canvas role="img" aria-label="${sk.name} sketch"></canvas><div class="row"><button type="button">Fullscreen</button><a href="?d=${sk.id}">Open alone</a></div>`;
  root.appendChild(sec);const cv=sec.querySelector('canvas'),I={sk,cv,ctx:cv.getContext('2d'),vis:!!SOLO,b1:buf(2,2),b2:buf(2,2)};INST.push(I);
  const fs=()=>{(cv.requestFullscreen||cv.webkitRequestFullscreen).call(cv)};sec.querySelector('button').onclick=fs;cv.onclick=fs}
 const io=new IntersectionObserver(es=>es.forEach(e=>{const I=INST.find(i=>i.cv===e.target);if(I)I.vis=e.isIntersecting}));INST.forEach(I=>io.observe(I.cv));
 const t0=performance.now();(function loop(now){const t=(now-t0)/1000;for(const I of INST){if(!I.vis&&!document.fullscreenElement)continue;if(document.fullscreenElement&&document.fullscreenElement!==I.cv)continue;
  if(document.fullscreenElement===I.cv){const w=Math.min(1920,Math.round(screen.width*(devicePixelRatio||1)));if(I.cv.width!==w){I.cv.width=w;I.cv.height=Math.round(w*9/16)}}else size(I);
  const c=I.ctx,s=I.cv.width/W;c.setTransform(s,0,0,s,0,0);c.globalAlpha=1;c.imageSmoothingEnabled=true;I.sk.draw(c,t,I);c.setTransform(s,0,0,s,0,0);overlays(c,t)}requestAnimationFrame(loop)})(t0)}
boot();
