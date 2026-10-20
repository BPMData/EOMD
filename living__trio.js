/* living__trio.js: shared trilingual-trio code for the CS and Exploration variants. tools__build.py injects it right after
   `const CSCARDS=[...]` and before the variant file. The variant must define MONO (font stack for `code` spans), then TRIO, TICKET; it may define CARDSTYLE(tipIndex,langIndex)→style (else LANGS).
   Each bloom = three fiddleheads, three cards: EN top, ES middle, PT bottom, always the same colors and order. */
// ---- knobs ----
const TMAXW=1100,TMAXH=760,TGAP=20;        // the trio's footprint limit (one SSR card) and the gap between its cards
const TSZ={label:28,title:56,body:44};     // px at 1080p before fit-to-footprint shrink
const TSTAG=[0,52,18];                      // x stagger per card, so the trio reads like leaves on a stalk
const LANGS=[ // fixed per language: same color, same slot, every bloom (contrast ratios in the handoff)
 {key:'en',lab:'English',  fill:C.cream,   edge:C.charcoal,label:RUST,   title:C.charcoal,body:C.charcoal,code:RUST},
 {key:'es',lab:'Español',  fill:C.charcoal,edge:C.mustard, label:SUBC,   title:C.mustard, body:C.cream,   code:C.mustard},
 {key:'pt',lab:'Português',fill:C.mustard, edge:C.charcoal,label:C.charcoal,title:C.charcoal,body:C.charcoal,code:C.charcoal}];
// ---- rich text: `code` spans in monospace on a soft pill; punctuation glued to the word before it ----
function richTokens(text){const out=[];text.split('`').forEach((p,i)=>p.split(' ').forEach((w,j)=>{if(w)out.push({s:w,code:i%2===1,glue:j===0&&out.length>0})}));return out}
function richRows(m,text,f,fc,maxW){const g=[];for(const t of richTokens(text)){m.font=t.code?fc:f;t.w=m.measureText(t.s).width+(t.code?8:0);if(t.glue&&g.length)g[g.length-1].push(t);else g.push([t])}
 m.font=f;const sp=m.measureText(' ').width,rows=[];let row=[],rw=0;
 for(const grp of g){const gw=grp.reduce((a,t)=>a+t.w,0),add=gw+(row.length?sp:0);if(row.length&&rw+add>maxW){rows.push({grps:row,w:rw});row=[grp];rw=gw}else{row.push(grp);rw+=add}}
 rows.push({grps:row,w:rw});rows.sp=sp;return rows}
function buildCard(L,lang,k,maxW=980,sty){const V=sty||LANGS[lang],m=document.createElement('canvas').getContext('2d'),[title,body]=L,
 fl=`italic ${V.wl||600} ${Math.round(TSZ.label*k)}px ${SERIF}`,ft=`400 ${Math.round(TSZ.title*k)}px ${DISP}`,ftc=`600 ${Math.round(TSZ.title*k*.9)}px ${MONO}`,
 fb=`${V.wt||500} ${Math.round(TSZ.body*k)}px ${SERIF}`,fbc=`500 ${Math.round(TSZ.body*k*.88)}px ${MONO}`,
 blocks=[{rows:[{grps:[[{s:V.lab,code:false}]],w:(m.font=fl,m.measureText(V.lab).width)}],f:fl,size:TSZ.label*k,lh:1.15,col:V.label,gap:0},
         {rows:richRows(m,title,ft,ftc,maxW),f:ft,fc:ftc,size:TSZ.title*k,lh:1.04,col:V.title,gap:6*k},
         {rows:richRows(m,body,fb,fbc,maxW),f:fb,fc:fbc,size:TSZ.body*k,lh:1.16,col:V.body,gap:10*k}];
 blocks[0].rows.sp=0;let cw=0,ch=0;for(const b of blocks){ch+=b.gap;b.y=ch;for(const r of b.rows)cw=Math.max(cw,r.w);ch+=b.rows.length*b.size*b.lh}
 const px=40*k,py=26*k,bw=cw+px*2,bh=ch+py*2,MG=40,cv=document.createElement('canvas');cv.width=Math.ceil((bw+MG*2)*S);cv.height=Math.ceil((bh+MG*2)*S);
 const c=cv.getContext('2d');c.scale(S,S);c.translate(MG,MG);blobPath(c,bw,bh);c.fillStyle=V.fill;c.fill();c.lineWidth=7;c.strokeStyle=V.edge;c.stroke();c.textBaseline='alphabetic';c.textAlign='left';
 for(const b of blocks)b.rows.forEach((r,ri)=>{let x=bw/2-r.w/2;const y=py+b.y+ri*b.size*b.lh+b.size*.86,pos=[];
  r.grps.forEach((grp,gi)=>{if(gi)x+=b.rows.sp;for(const t of grp){pos.push({t,x,last:t===grp[grp.length-1]&&gi===r.grps.length-1});x+=t.w}});
  for(let i=0;i<pos.length;i++)if(pos[i].t.code&&!(i&&pos[i-1].t.code)){let j=i;while(j+1<pos.length&&pos[j+1].t.code)j++;// one pill per run of code
   const x0=pos[i].x,x1=pos[j].x+pos[j].t.w,h=b.size*1.0;c.globalAlpha=.15;c.fillStyle=V.code;c.beginPath();c.roundRect?c.roundRect(x0,y-h*.8,x1-x0,h,8):c.rect(x0,y-h*.8,x1-x0,h);c.fill();c.globalAlpha=1}
  for(const p of pos){c.font=p.t.code?b.fc:b.f;c.fillStyle=p.t.code?V.code:b.col;c.fillText(p.t.s,p.x+(p.t.code?4:0),y)}});
 return{cv,cw:bw+MG*2,ch:bh+MG*2,vw:bw,vh:bh}}
// three cards, shrunk together until the trio fits TMAXW×TMAXH; cached per tip (in the template's cache, which init() clears on resize)
function buildTrio(i){if(cache['t'+i])return cache['t'+i];let k=1,cards;
 for(let n=0;n<4;n++){cards=TRIO[i].map((L,j)=>buildCard(L,j,k,980,typeof CARDSTYLE==='function'?CARDSTYLE(i,j):undefined));const h=cards.reduce((a,c)=>a+c.vh+44,0)+TGAP*2,w=Math.max(...cards.map((c,j)=>c.vw+44+TSTAG[j])),f=Math.min(1,TMAXH/h,TMAXW/w);if(f>.995)break;k*=f*.995}
 return cache['t'+i]={cards,k}}
// three fiddleheads come up from the lower left (outer one tallest, so stems never cross), each curls and blooms its own card
function startTrio(){const mi=msgI;msgI=(msgI+1)%TRIO.length;const{cards}=buildTrio(mi),hs=cards.map(c=>c.vh+44),th=hs.reduce((a,b)=>a+b,0)+TGAP*2,
 tw=Math.max(...cards.map((c,j)=>c.vw+44+TSTAG[j])),y0=Math.max(30,(H-40)/2-th/2);let best=null;
 for(const fx of[.16,.21,.26,.31,.36]){const tx=Math.min(W*fx,W-tw-40);let occ=R()*.5;for(let y=y0+th;y<H;y+=CELL)if(!freeL(tx-40,y,8))occ++;
  if(LWB){const wx=LWB.x-SH-70,ox=Math.max(0,Math.min(tx+tw,wx+LWB.w)-Math.max(tx,wx)),oy=Math.max(0,Math.min(y0+th,LWB.y+LWB.h)-Math.max(y0,LWB.y));occ+=100*ox*oy/(LWB.w*LWB.h)}
  if(!best||occ<best.occ)best={tx,occ}}
 const V=K.vine,base=V.sp*SPEED*1.9;let y=y0,t0=0;
 cards.forEach((card,j)=>{const cy=y+hs[j]/2;y+=hs[j]+TGAP;const left=best.tx+TSTAG[j],tipx=left-14,tipy=cy+16,sx0=best.tx-90*(3-j)+R()*24,sy0=H+40,
  d=Math.hypot(tipx-sx0,tipy-sy0);if(!j)t0=d/base;const fs=d/(base*(t0+.8*j)); // arrive in reading order, ~0.8 s apart
  const v=newVine(sx0,sy0,-Math.PI/2+.25,{fiddle:true,tx:tipx,ty:tipy,w0:V.w[1]+1,L:1e9,col:K.fcol,turn:1.6,fs});vines.push(v);
  FS.push(v.F={phase:'stem',v,card,sx:left+card.vw/2+8,sy:cy})})}
