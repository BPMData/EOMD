/* living/variant-ex.js: Exploration Seminar variant of the living poster. Needs living/trio.js (injected before this file).
   CSCARDS here = the 24 cards of proj/ex/copy.md (17 tips + 7 academy cards; the name is shared with the CS build). Same trio and timer as CS, no end card; academy colors via CARDSTYLE. */
document.title='Mr. Murphy’s Exploration Seminar';
document.getElementById('cv').setAttribute('aria-label','Mr. Murphy’s Exploration Seminar: a slowly growing, living poster with academy and pathway tips in English, Spanish and Portuguese');
const MONO='monospace'; // this copy has no `code` spans, so no mono font is embedded
// ---- academy colors (proj/academies/brand.md; f = fill, t = text on it). Edit CMAP to recolor a card: [fill] or [fill, edge] ----
const INK='#0A1633',WHITE='#FFFFFF';
const AC={blue:{f:'#0033A0',t:WHITE},teal:{f:'#009CA6',t:INK},slate:{f:'#527A8A',t:WHITE},orange:{f:'#DC4405',t:WHITE,bold:1},green:{f:'#006341',t:WHITE},
          red:{f:'#D50032',t:WHITE},yellow:{f:'#FFD100',t:INK},purple:{f:'#5C068C',t:WHITE}};
// blue = Danbury Blue (rule + campus cards, and Art, Engineering & Design), teal = Exploration Academy (class cards); pair cards: fill = first academy named, edge = second
// academy cards 18-24: slate = Emerging Tech, orange = Scientific Innovation, green = Clean Energy, red = IT & Cyber, yellow = Professional & Public Service, blue = Art, Engineering & Design, purple = Communication & Design
const CMAP={'1':['blue'],'2':['blue'],'3':['teal'],'4':['teal'],'5':['blue'],'6':['blue'],'7':['teal'],
 '8':['orange','red'],'9':['purple','blue'],'10':['slate','yellow'],'11':['orange','yellow'],'12':['blue'],'13':['blue'],'14':['teal'],'15':['teal'],'16':['teal'],'17':['teal'],
 '18':['slate'],'19':['orange'],'20':['green'],'21':['red'],'22':['yellow'],'23':['blue'],'24':['purple']};
function CARDSTYLE(i,j){const m=CMAP[CSCARDS[i].id]||['teal'],A=AC[m[0]],E=m[1]?AC[m[1]].f:A.t;   // orange allows large bold text only, so it gets weight 700
 return{lab:LANGS[j].lab,fill:A.f,edge:E,label:A.t,title:A.t,body:A.t,code:A.t,wt:A.bold?700:500,wl:A.bold?700:600}}
TRIO=CSCARDS.map(c=>LANGS.map(L=>c[L.key]));
// shuffled deck (Bryan, Oct 9): every pass through the cards is a fresh random order (seeded by the poster's R, so ?vseed repeats it).
// No card repeats until all 24 have played. The academy cards (ACAD) are dropped into random gaps between the shuffled tips,
// one per gap, so two academy cards never play back to back; a new pass never opens with the card that just closed the last one.
const ACAD=new Set(['18','19','20','21','22','23','24']);
const exShuf=a=>{for(let k=a.length-1;k>0;k--){const j=Math.floor(R()*(k+1));[a[k],a[j]]=[a[j],a[k]]}return a};
const exStart=startTrio;
startTrio=function(){if(msgI===0){const all=CSCARDS.map((c,k)=>[c,TRIO[k]]),tips=exShuf(all.filter(x=>!ACAD.has(x[0].id))),acs=exShuf(all.filter(x=>ACAD.has(x[0].id)));
  const gaps=new Set(exShuf([...Array(tips.length+1).keys()]).slice(0,acs.length)),ord=[];let a=0;   // tips.length+1 gaps (before, between, after the tips)
  for(let g=0;g<=tips.length;g++){if(gaps.has(g)&&a<acs.length)ord.push(acs[a++]);if(g<tips.length)ord.push(tips[g])}
  while(a<acs.length)ord.push(acs[a++]);
  if(exLast&&ord[0][0]===exLast)ord.push(ord.shift());
  ord.forEach(([c,t],k)=>{CSCARDS[k]=c;TRIO[k]=t});for(const key in cache)if(key[0]==='t')delete cache[key]}
 exLast=CSCARDS[msgI];return exStart()};
let exLast=null;
// end-of-timer card (approved by Bryan, Oct 6; keep the timer in the CS version)
TICKET=null; // no end card: when the timer ends the poster stays up and only the chime plays (Bryan, Oct 7)
