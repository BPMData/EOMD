/* proj/cdrom/dud.js: the Dud (Bryan's original 16x15 sprite, exact) + failed-evolution parts.
   Rows are 16 chars. K outline, Y body, y shade, C highlight, W eye white, E pupil, '.' empty.
   A mutation = base rows with part rows swapped in. Same parts drive Dud 2D (flat) and Dud 3D (voxels). */
const DUD=(()=>{
const BASE=['..K.........K...','...K.......K....','....K.....K.....','..KKKKKKKKKKKK..','..KYYYYYYYYYYK..','..KYWEYYYYWEYK..','..KYWWYYYYWWYK..','..KYYYYYYYYYYK..','..KYYYKKKKYYYK..','..KYYYYYYYYYCK..','..KYYYYYYYYCKK..','..KyyyyyyyyKK...','..KKKKKKKKKK....','...K..K..K..K...','..K..K....K..K..'];
const PARTS={ // each option: {row: replacement string}
 ant:{V:{},bent:{0:'..K.............',1:'...K.......KK...',2:'....K.....K..K..'},single:{0:'......KKK.......',1:'.......K........',2:'.......K........'},
      curl:{0:'..KK........KK..',1:'.K..K......K..K.',2:'....K......K....'},bald:{0:'................',1:'................',2:'................'}},
 eyes:{normal:{},sleepy:{5:'..KYYYYYYYYYYK..',6:'..KYKKYYYYKKYK..'},mismatch:{5:'..KWWWYYYYYYYK..',6:'..KWWEYYYYYEYK..'},
       three:{5:'..KYWYYWYYYWYK..',6:'..KYEYYEYYYEYK..'},happy:{5:'..KYYKYYYYKYYK..',6:'..KYKYKYYKYKYK..'},
       angry:{4:'..KYKYYYYYYKYK..',5:'..KYWKYYYYKWYK..',6:'..KYWEYYYYEWYK..'},squint:{4:'..KYKYYYYYYKYK..',5:'..KYYKYYYYKYYK..',6:'..KYKYYYYYYKYK..'}},
 mouth:{flat:{},wobble:{8:'..KYYKYKYKYYYK..'},O:{8:'..KYYYYKKYYYYK..',9:'..KYYYYKKYYYCK..'},grin:{8:'..KYKYYYYYYKYK..',9:'..KYYKKKKKKYCK..'},
        grimace:{8:'..KYKKKKKKKKYK..',9:'..KYKWKWKWKKCK..'},frown:{8:'..KYYYYKKYYYYK..',9:'..KYYYKYYKYYCK..'}},
 legs:{spider:{},two:{13:'....K......K....',14:'...KK......KK...'},peg:{13:'......KKKK......',14:'.....KKKKKK.....'},
       tentacle:{13:'...K...K...K....',14:'....K.K...K.K...'},tuck:{13:'....K.K..K.K....',14:'................'}}};
const PAL={yellow:{Y:'#F5D547',y:'#D4AE35',C:'#FFF3B0'},green:{Y:'#A8C94A',y:'#7F9A2F',C:'#D9EF8E'},lilac:{Y:'#C6A8E6',y:'#9A7CC0',C:'#ECDCFF'},
           salmon:{Y:'#FF9C86',y:'#D9705C',C:'#FFD0C4'},sickly:{Y:'#C9C7A0',y:'#9C9A74',C:'#EEEDD2'}};
const INK={K:'#1B1B2A',W:'#FFFFFF',E:'#1B1B2A'};
/* goggles (Starfield): drawn 1 cell off-center on purpose; Tama clothes never fit */
const GOGGLES=['................','................','................','................','....GGGG..GGGG..','..SGLLGSSGLLGSS.','....GGGG..GGGG..'];
const GPAL={G:'#3A2A1A',L:'#7FD6FF',S:'#8A5A2A'};
function make(t={}){const r=BASE.slice();for(const k of['ant','eyes','mouth','legs']){const o=PARTS[k][t[k]||Object.keys(PARTS[k])[0]];for(const i in o)r[i]=o[i]}return r}
function random(rng){const pick=o=>{const ks=Object.keys(o);return ks[Math.floor(rng()*ks.length)]};
 return{ant:pick(PARTS.ant),eyes:['normal','sleepy','mismatch','three'][Math.floor(rng()*4)],mouth:['flat','wobble','O','grin'][Math.floor(rng()*4)],legs:['spider','two','peg','tentacle'][Math.floor(rng()*4)],pal:pick(PAL)}}
function draw(c,x,y,px,rows,pal='yellow',goggles=false){const P=Object.assign({},INK,PAL[pal]);
 for(let r=0;r<rows.length;r++)for(let q=0;q<16;q++){const ch=rows[r][q];if(ch!=='.'){c.fillStyle=P[ch];c.fillRect(x+q*px,y+r*px,px+.5,px+.5)}}
 if(goggles)for(let r=0;r<GOGGLES.length;r++)for(let q=0;q<16;q++){const ch=GOGGLES[r][q];if(ch!=='.'){c.fillStyle=GPAL[ch];c.fillRect(x+(q+1)*px,y+(r-1)*px,px+.5,px+.5)}}}
return{BASE,PARTS,PAL,INK,GOGGLES,GPAL,make,random,draw};})();
if(typeof module!=='undefined')module.exports=DUD;
 