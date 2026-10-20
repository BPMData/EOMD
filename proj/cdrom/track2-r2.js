/* proj/cdrom/track2-r2.js: Track 2, round 2. "Stage 1 · Overclock": an original fast action-stage theme written with late-80s
   arcade/console fusion techniques (line clichés, circle of fifths, secondary dominants, chromatic pivots, slap bass with octave
   pops and chromatic approaches, twin lead in 3rds/6ths with 16th runs and arpeggios, 16th hats with ghost snares). No quotes.
   Form: Intro (4 bars, plays once) + A (8, E minor) + B (8, modulates to F# minor and walks back) — A+B loop. 158–168 BPM.
   Oct 9e (option 3): bars 20–27 = C (half-time breakdown), 28–35 = D (a generated solo over A's chords, T.solo / T.setSolo).
   Piece 'overclock' still plays bars 0–19 (A+B loop, unchanged); piece 'overclock-long' plays the composed long form via `order`.
   Load after engine/src/audio/dsp.js and audio/chips.js.
     TRACK2R2.events(bpm, mask, order)     chip-neutral notes {t, k, m, d, v}; k = mel | har | bass | kick | snare | hat | crash
     TRACK2R2.chipEvents(chip, bpm, mask)  CHIPS events {t, part, m, d, v} for one chip
   mask = {mel, har, bass, drums} (1 = on). Per chip: the melody moves by whole octaves to the chip's lead register (beeper one
   octave down) without folding, so runs stay intact; the harmony line plays as a second 'lead' on fm, snes and arcade (pushed
   before the melody so the arcade's PSG doubling stays on the melody); tia and beep play the melody alone. Bass as in round 1
   (E2 to the chip's floor by octaves, a low bar lifts whole, sour TIA notes drop an octave). Ghost snares are left out on tia
   and beep (they would steal the bass channel / the only speaker). */
(function(G){'use strict';
const T=(G.TRACK2R2={}),PC=x=>((x%12)+12)%12;
const NOTE={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
const Q={'':[0,4,7],m:[0,3,7],m7:[0,3,7,10],mMaj7:[0,3,7,11],m6:[0,3,7,9],m9:[0,3,7,10,2],maj7:[0,4,7,11],'7':[0,4,7,10],'7b9':[0,4,7,10,1],m7b5:[0,3,6,10],'7sus4':[0,5,7,10]};
const KEYS={E:[4,6,7,9,11,0,2],'F#':[6,8,9,11,1,2,4],B:[11,1,2,4,6,7,9]};   // natural minor; chord tones swap in per chord (harmonic/melodic minor colours)
const chord=s=>{const r=s.match(/^[A-G]#?/)[0];return{name:s,root:NOTE[r],tones:new Set(Q[s.slice(r.length)].map(i=>PC(NOTE[r]+i)))}};
const scaleOf=(key,ch)=>{const sc=new Set(KEYS[key]);for(const t of ch.tones)if(!sc.has(t)){const a=PC(t-1),b=PC(t+1),x=sc.has(a)&&!ch.tones.has(a)?a:sc.has(b)&&!ch.tones.has(b)?b:null;if(x!==null)sc.delete(x);sc.add(t)}return sc};
const below=(m,n,sc)=>{while(n>0){m--;if(sc.has(PC(m)))n--}return m};   // n scale steps down (2 = a 3rd, 5 = a 6th)
const run=(st,ns)=>ns.map((m,k)=>[st+k,m,1]);   // 16th-note run
// One entry per bar. ch: [[step, chord]]; br: bass pitch classes per chord (slash chords); mel: [[16th step, midi, length]];
// h: harmony a 3rd (3) or 6th (6) below; bass: X (one chord) | Y (two) | hits | pedal; dr: groove | fill | hits | run | roll
const OVERCLOCK=[
 {sec:'Intro',key:'E',ch:[[0,'Cmaj7']],h:3,bass:'hits',dr:'hits',mel:[[0,79,3],[3,79,3],[6,79,2],[10,81,2],[12,83,4]],
  why:'♭VI hit: 3+3+2 syncopated unison stabs; twin lead in 3rds climbs G–A–B.'},
 {sec:'Intro',key:'E',ch:[[0,'D']],h:3,bass:'hits',dr:'hits',mel:[[0,81,3],[3,81,3],[6,81,2],[10,83,2],[12,84,2],[14,86,2]],
  why:'♭VII hit, one step higher; the lead keeps rising A–B–C–D.'},
 {sec:'Intro',key:'E',ch:[[0,'Em9']],h:3,bass:'X',dr:'run',mel:run(0,[76,79,83,86,83,79,78,83,86,83,79,76,78,79,81,83]),
  why:'Baroque 16th arpeggio of Em9 (E G B D F♯), both leads in 3rds.'},
 {sec:'Intro',key:'E',ch:[[0,'B7b9']],h:3,bass:'pedal',dr:'roll',mel:[[0,84,4],[4,83,8],...run(12,[75,78,81,84])],
  why:'Dominant B7♭9: C (♭9) sinks to B, then a D♯–F♯–A–C arpeggio; snare roll; bass pumps B and slides D♯→E.'},
 {sec:'A',key:'E',ch:[[0,'Em']],br:[4],h:3,bass:'X',dr:'groove',mel:[[0,83,6],[6,81,2],[8,83,4],[12,86,4]],
  why:'Minor line cliché begins over E; melody pushes off the 5th (B).'},
 {sec:'A',key:'E',ch:[[0,'EmMaj7']],br:[3],h:3,bass:'X',dr:'groove',mel:[[0,84,6],[6,83,2],[8,81,2],[10,79,2],[12,78,4]],
  why:'Bass D♯ = the major 7th (harmonic minor); melody steps down from C.'},
 {sec:'A',key:'E',ch:[[0,'Em7']],br:[2],h:3,bass:'X',dr:'groove',mel:[[0,79,4],[4,74,2],[6,79,2],[8,83,8]],
  why:'Bass D = ♭7; melody touches D5 to echo it.'},
 {sec:'A',key:'E',ch:[[0,'Em6']],br:[1],h:3,bass:'X',dr:'groove',mel:[[0,85,6],[6,83,2],[8,81,4],[12,79,2],[14,81,2]],
  why:'Bass C♯ = the 6th (Dorian / melodic-minor colour); melody sings C♯6.'},
 {sec:'A',key:'E',ch:[[0,'Am7'],[8,'D7']],h:6,bass:'Y',dr:'groove',mel:[[0,84,3],[3,81,3],[6,76,2],...run(8,[78,81,84,86]),[12,84,2],[14,81,2]],
  why:'Circle of fifths starts (A→D); 16th run spells D7; twin lead opens to 6ths.'},
 {sec:'A',key:'E',ch:[[0,'Gmaj7'],[8,'Cmaj7']],h:6,bass:'Y',dr:'groove',mel:[[0,83,6],[6,81,2],[8,79,4],[12,76,2],[14,79,2]],
  why:'Circle continues G→C (relative major, then ♭VI).'},
 {sec:'A',key:'E',ch:[[0,'F#m7b5'],[8,'B7']],h:6,bass:'Y',dr:'groove',mel:[[0,81,4],[4,84,4],[8,81,2],[10,78,2],[12,75,4]],
  why:'Minor ii–V; melody lands on D♯, the harmonic-minor leading tone.'},
 {sec:'A',key:'E',ch:[[0,'Cmaj7'],[8,'C#7']],h:6,bass:'Y',dr:'fill',mel:[[0,76,4],[4,79,4],[8,77,2],[10,80,2],[12,83,2],[14,85,2]],
  why:'Chromatic pivot: bass C→C♯; C♯7 (V of F♯ minor) arpeggiates up into the modulation.'},
 {sec:'B',key:'F#',ch:[[0,'F#m7']],h:6,bass:'X',dr:'groove',mel:[[0,85,8],[8,83,2],[10,81,2],[12,80,2],[14,81,2]],
  why:'Up a whole step to F♯ minor; long C♯ then a turn, twin lead in 6ths.'},
 {sec:'B',key:'F#',ch:[[0,'Bm7'],[8,'E7']],h:6,bass:'Y',dr:'groove',mel:[[0,78,6],[6,81,2],[8,80,4],[12,83,4]],
  why:'ii–V of A major (F♯ minor\'s relative); melody hits G♯, the 3rd of E7.'},
 {sec:'B',key:'F#',ch:[[0,'Amaj7'],[8,'Dmaj7']],h:6,bass:'Y',dr:'groove',mel:[[0,85,6],[6,83,2],[8,81,8]],
  why:'I–IV of A; long notes give the bass room before the run.'},
 {sec:'B',key:'F#',ch:[[0,'G#m7b5'],[8,'C#7']],h:6,bass:'Y',dr:'groove',mel:[...run(0,[86,85,83,81]),[4,80,2],[6,78,2],[8,77,2],[10,80,2],[12,83,2],[14,85,2]],
  why:'Minor ii–V home to F♯m: a falling 16th run, then a C♯7 arpeggio.'},
 {sec:'B',key:'F#',ch:[[0,'F#m'],[8,'F#mMaj7']],br:[6,5],h:3,bass:'Y',dr:'groove',mel:[[0,81,6],[6,78,2],[8,85,4],[12,83,4]],
  why:'Line cliché moves to the bass at double speed: F♯→F (E♯); leads back in 3rds.'},
 {sec:'B',key:'F#',ch:[[0,'F#m7'],[8,'F#m6']],br:[4,3],h:3,bass:'Y',dr:'groove',mel:[[0,81,8],[8,85,6],[14,83,2]],
  why:'…→E→D♯; the bass keeps falling a half step every two beats.'},
 {sec:'B',key:'E',ch:[[0,'Dmaj7'],[8,'Cmaj7']],h:3,bass:'Y',dr:'groove',mel:[[0,81,6],[6,85,2],[8,79,4],[12,83,4]],
  why:'Planing major-7th chords (D→C) borrow from E minor and steer home; bass still descending.'},
 {sec:'B',key:'E',ch:[[0,'B7sus4'],[8,'B7b9']],h:3,bass:'Y',dr:'fill',mel:[...run(0,[86,84,83,81,79,78,76,75]),[8,78,2],[10,81,2],[12,84,4]],
  why:'Harmonic-minor 16th run down to D♯, a B7♭9 arpeggio up to C, which falls to B at the top of A.'}];
// pieces: T.add(id, {title, blurb, bars, intro, bpms, bpm, order}); T.use(id) makes one current (events/chipEvents/label follow it).
// order (optional, Oct 9e) = the bars to play: bar indices or {bi, tr} (tr = a key lift in semitones); default = every bar once.
// Playback loops back to order entry `intro`. A bass approach note at a bar's end aims at the next bar IN THE ORDER (flag nx).
let BARS,INTRO,ORDER;T.pieces={};T.KEYS=KEYS;T.run=run;
const ordOf=p=>(p.order||p.bars.map((_,i)=>i)).map(x=>typeof x==='number'?{bi:x,tr:0}:{bi:x.bi,tr:x.tr||0});
T.use=id=>{const p=T.pieces[id];BARS=p.bars;INTRO=p.intro;ORDER=ordOf(p);Object.assign(T,{piece:id,bars:BARS,intro:INTRO,order:ORDER,total:ORDER.length,bpms:p.bpms,bpm:p.bpm,tr:p.tr||0,title:p.title,blurb:p.blurb})};
T.add=(id,p)=>{T.pieces[id]=p;if(!BARS)T.use(id)};
T.add('overclock',{title:'Stage 1 · Overclock',bars:OVERCLOCK,intro:4,order:[...Array(20).keys()],bpms:[116,120,124,128,132,134.5,140,142.5,144,158,160,164,168],bpm:142.5,tr:-3,vinyl:[[-2,142.5],[-3,134.5],[-5,120]],
 blurb:'Round 2. Fast fusion stage theme: 4-bar intro once, then A (E minor) and B (up to F♯ minor and back) loop.'});
// slap bass, per chord segment: [step, interval | 'C' (chromatic approach to the next root), length, velocity]
const X=[[0,0,2,1],[2,0,1,.5],[3,12,1,.9],[5,0,1,.5],[6,12,1,1],[8,0,2,.95],[10,7,1,.6],[11,0,1,.5],[13,0,1,.55],[14,12,1,1],[15,'C',1,.8]];
const Y1=[[0,0,2,1],[2,0,1,.5],[3,12,1,.9],[5,0,1,.5],[6,12,1,1],[7,'C',1,.8]],Y2=[[8,0,2,.95],[10,7,1,.6],[11,0,1,.5],[13,0,1,.55],[14,12,1,1],[15,'C',1,.8]];
const bm=pc=>35+PC(pc-11);   // bass roots B1 (35) … A♯2 (46): the descending lines stay smooth
const segsOf=B=>B.ch.map(([st,n],k)=>{const c=chord(n),v=B.br?B.br[k]:c.root;return{st,...c,bass:v>11?v:bm(v)}});   // br: a pitch class, or an exact midi note (> 11)
/* ---- Oct 9e, option 3 (the longer composed form): C = a half-time breakdown, D = a generated solo over A's chords. ---- */
const HB=[[0,0,6,1],[6,12,1,.7],[8,7,6,.85],[14,12,1,.75],[15,'C',1,.8]];   // half-time bass: long root, octave pop, long 5th, pop, approach
const HB1=[[0,0,6,1],[6,12,1,.7],[7,'C',1,.75]],HB2=[[8,0,6,.9],[14,12,1,.75],[15,'C',1,.8]];
const HT={kick:[[0,1],[10,.7]],snare:[[8,1],[15,.3]],hat:[0,2,4,6,8,10,12,14].map(st=>[st,st%4?.4:.6])};   // half-time: backbeat on beat 3, 8th hats
const HT2={kick:[[0,1],[3,.7],[8,.9],[10,.7]],snare:[[4,.9],[12,.9],[14,.4],[15,.5]],hat:[...Array(16).keys()].map(st=>[st,st%2?.4:.6])};   // the groove creeping back
OVERCLOCK.push(
 {sec:'C',key:'E',ch:[[0,'Cmaj7']],br:[36],h:6,bass:[HB],dr:HT,mel:[[0,79,8],[8,83,6],[14,81,2]],
  why:'Half-time breakdown: the backbeat moves to beat 3; ♭VI, the lead holds G, then the major 7th (B).'},
 {sec:'C',key:'E',ch:[[0,'Bm7']],br:[35],h:6,bass:[HB],dr:HT,mel:[[0,78,8],[8,74,4],[12,76,2],[14,78,2]],
  why:'Minor v (Bm7, no leading tone yet): F♯ held, then D–E–F♯ walks back up; the bass steps down C→B.'},
 {sec:'C',key:'E',ch:[[0,'Am9']],br:[33],h:6,bass:[HB],dr:HT,mel:[[0,83,12],[12,81,2],[14,79,2]],
  why:'Am9, the bass still falling (→A): the lead sits on the 9th (B) for three beats.'},
 {sec:'C',key:'E',ch:[[0,'D7sus4'],[8,'D7']],h:6,bass:[HB1,HB2],dr:HT,mel:[[0,79,6],[6,81,2],[8,78,4],[12,84,4]],
  why:'Sus4 resolves to D7 (V of G): G falls to F♯, then C, the 7th.'},
 {sec:'C',key:'E',ch:[[0,'Gmaj7']],h:6,bass:[HB],dr:HT,mel:[[0,83,8],[8,86,6],[14,84,2]],
  why:'G major arrives (the relative major): B, then D, with C as the pickup.'},
 {sec:'C',key:'E',ch:[[0,'F#m7b5'],[8,'B7']],h:6,bass:[HB1,HB2],dr:HT,mel:[[0,84,8],[8,81,4],[12,75,4]],
  why:'The minor ii–V again at half speed: C, A, then D♯, the leading tone.'},
 {sec:'C',key:'E',ch:[[0,'Em9']],h:3,bass:'X',dr:HT2,mel:[[0,76,2],[2,78,2],[4,79,2],[6,83,2],[8,86,4],[12,83,4]],
  why:'Em9: slap bass and 16th hats come back; the lead climbs in 8ths, leads in 3rds.'},
 {sec:'C',key:'E',ch:[[0,'B7sus4'],[8,'B7b9']],h:3,bass:'Y',dr:'fill',mel:[[0,83,4],[4,81,2],[6,78,2],...run(8,[75,78,81,84,87,84,81,84])],
  why:'Back to full time: snare fill, a B7♭9 arpeggio up to D♯6 and back to C, which falls to B at the top of A.'});
// D: A's chords, bass and drums bar for bar; the melody is generated (T.solo). The twin lead sits out D1–D6 (a solo is one voice)
// and joins in 3rds for the climb. Phrases: 2 bars each, a held chord tone + a breath at the end of D2/D4/D6, busier every phrase.
OVERCLOCK.slice(4,12).forEach((A,k)=>OVERCLOCK.push({sec:'D',key:A.key,ch:A.ch,br:A.br,h:k<6?0:3,bass:A.bass,dr:A.dr,solo:k,mel:[],
 why:['Generated solo over A\'s line cliché (Em): mostly 8ths and quarters, room to breathe.','…EmMaj7: the phrase ends on a held chord tone, then a breath.',
  '…Em7: second phrase, 16th cells start to appear.','…Em6: phrase ends; breath.','Circle of fifths (Am7→D7): busier, chord-tone arpeggios.',
  '…G→C: busier still; phrase ends.','Minor ii–V: the twin lead joins in 3rds; mostly 16ths.','Chromatic pivot (C→C♯7): the last beat is a scale run up into the next section\'s first note.'][k]}));
// T.solo(seed, to) -> 8 bars of mel for D (to = the first melody note after D; B1's C♯6 = 85). T.setSolo(seed) puts a take into the piece.
const rng=s=>{let x=(s|0)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}};
const DEN=[.15,.3,.35,.5,.55,.7,.85,1];   // chance of a busy (16th) cell per solo bar
const CALM=[[[0,4]],[[0,2],[2,2]],[[0,3],[3,1]],[[2,2]],[[0,2],[2,1],[3,1]]];   // one beat: quarter | 8ths | dotted 8th + 16th | rest + 8th | 8th + two 16ths
const BUSY=[[[0,1],[1,1],[2,1],[3,1]],[[0,1],[1,1],[2,2]],[[0,1],[1,2],[3,1]]];   // four 16ths | two 16ths + 8th | syncopated 16th-8th-16th
T.solo=(seed=1,to=85)=>{const r=rng(Math.imul(seed,2654435761)^0x50105),pk=a=>a[Math.floor(r()*a.length)],LO=74,HI=91;
 const D=OVERCLOCK.filter(B=>B.solo!=null).sort((a,b)=>a.solo-b.solo);let m=78+Math.floor(r()*5),dir=1;
 return D.map((B,b)=>{const segs=segsOf(B),seg=st=>segs.filter(x=>x.st<=st).pop(),sc=st=>scaleOf(B.key,seg(st)),mel=[];
  const step=(x,d,s)=>{do x+=d;while(!s.has(PC(x)));return x};
  const tone=(x,d,st)=>{const t=seg(st).tones;for(let k=1;k<=6;k++)if(t.has(PC(x+d*k)))return x+d*k;return step(x,d,sc(st))};   // nearest chord tone that way
  const end=b===D.length-1,breath=b%2===1&&!end;
  for(let beat=0;beat<4;beat++){const s0=beat*4;
   if(m>=HI-2)dir=-1;else if(m<=LO+2)dir=1;
   if(breath&&beat===2){m=tone(m,m>84?-1:m<78?1:r()<.5?1:-1,s0);mel.push([s0,m,6]);break}   // phrase end: a chord tone held 1½ beats, then a breath
   if(end&&beat===3){let x=to;const rn=[];for(let k=0;k<4;k++){x=step(x,-1,sc(s0+3));rn.unshift(x)}rn.forEach((x,k)=>mel.push([s0+k,x,1]));m=x;break}
   const busy=r()<DEN[b],cell=busy?pk(BUSY):pk(CALM),arp=busy&&r()<.35;   // arp: a 16th cell of chord tones only
   if(r()<(busy?.15:.3))dir=-dir;
   cell.forEach(([o,l],k)=>{const st=s0+o;m=k===0||arp?tone(m,dir,st):step(m,dir,sc(st));if(m>HI){m=tone(m,-1,st);dir=-1}if(m<LO){m=tone(m,1,st);dir=1}mel.push([st,m,l])})}
  return mel})};
T.setSolo=(seed=1)=>{const s=T.solo(seed);for(const B of OVERCLOCK)if(B.solo!=null)B.mel=s[B.solo];T.soloSeed=seed};
T.setSolo(1);
const span=(a,b,tr=0)=>Array.from({length:b-a},(_,k)=>({bi:a+k,tr}));
T.add('overclock-long',{...T.pieces.overclock,title:'Stage 1 · Overclock (long form)',
 order:[...span(0,4),...span(4,12),...span(12,20),...span(4,12),...span(20,28),...span(4,12),...span(28,35),{bi:35,tr:2},...span(12,19,2),{bi:19,tr:0}],
 blurb:'Option 3. Intro once, then A · B · A · C (half-time breakdown) · A · D (generated solo over A) · B up a whole step (D8 pivots up, B8 drops home), about 1½ minutes before it comes round.'});
T.approach=(r,n)=>n===r?r-1:n>r?n-1:n+1;   // chromatic approach from root r toward the next root n
T.firstBass=bi=>segsOf(BARS[bi])[0].bass;
T.events=(bpm=T.bpm,mask={mel:1,har:1,bass:1,drums:1},order=ORDER)=>{const s16=60/bpm/4,ev=[];if(order!==ORDER)order=ordOf({order,bars:BARS});   // order: bar indices or {bi, tr}
 order.forEach(({bi,tr},i)=>{const B=BARS[bi],e0=ev.length,t0=i*16*s16,at=st=>t0+st*s16,segs=segsOf(B),segAt=st=>segs.filter(x=>x.st<=st).pop();
  const nx=order[i+1<order.length?i+1:INTRO],nextRoot=k=>k+1<segs.length?segs[k+1].bass:segsOf(BARS[nx.bi])[0].bass+nx.tr-tr;
  if(mask.har&&B.h)for(const[st,m,l]of B.mel)ev.push({t:at(st),k:'har',m:below(m,B.h===6?5:2,scaleOf(B.key,segAt(st))),d:l*s16*0.92,v:0.78});   // h 0 = no twin
  if(mask.mel)for(const[st,m,l]of B.mel)ev.push({t:at(st),k:'mel',m,d:l*s16*0.92,v:0.92});
  if(mask.bass){const put=(st,m,l,v,n)=>ev.push(n?{t:at(st),k:'bass',m,root:segAt(st).bass,d:l*s16*0.85,v,nx:1}:{t:at(st),k:'bass',m,root:segAt(st).bass,d:l*s16*0.85,v});
   const app=(k)=>T.approach(segs[k].bass,nextRoot(k)),last=k=>k===segs.length-1;   // nx: aims at the next bar
   if(B.bass==='hits'){B.mel.forEach(([st,,l],j)=>{const r=segAt(st).bass;put(st,j===B.mel.length-1?r+12:r,Math.min(l,3),1)})}
   else if(B.bass==='pedal'){const r=segs[0].bass;for(let st=0;st<15;st++)put(st,st%2?r+12:r,1,st%2?.55:.95);put(15,app(0),1,.8,last(0))}
   else(Array.isArray(B.bass)?B.bass:B.bass==='X'?[X]:[Y1,Y2]).forEach((P,k)=>{for(const[st,iv,l,v]of P)iv==='C'?put(st,app(k),l,v,last(k)):put(st,segs[k].bass+iv,l,v)})}
  if(tr)for(let q=e0;q<ev.length;q++){const e=ev[q];e.m+=tr;if(e.root!=null)e.root+=tr}   // key lift
  if(mask.drums){const d=(k,st,v)=>ev.push({t:at(st),k,m:0,d:0,v}),dr=B.dr;
   if(i===0||i===INTRO||B.sec!==BARS[order[i-1].bi].sec)d('crash',0,0.8);
   if(typeof dr==='object'){for(const k of['kick','snare','hat'])for(const[st,v]of dr[k]||[])d(k,st,v)}   // a piece's own pattern: {kick:[[step,v]],…}
   else if(dr==='hits'){B.mel.forEach(([st])=>{d('kick',st,1);d('snare',st,0.7)})}
   else if(dr==='roll'){d('kick',0,1);d('kick',8,0.9);for(let st=0;st<16;st++)d('snare',st,0.3+0.7*st/15)}
   else{const fill=dr==='fill';
    for(const[st,v]of fill?[[0,1],[3,.8],[8,.95]]:dr==='run'?[[0,1],[8,.95]]:[[0,1],[3,.8],[8,.95],[10,.8]])d('kick',st,v);
    d('snare',4,0.95);if(fill)for(let st=8;st<16;st++)d('snare',st,0.45+0.55*(st-8)/7);else{d('snare',12,0.95);if(dr==='groove')for(const st of[7,9,15])d('snare',st,0.3)}
    for(let st=0;st<(fill?8:16);st++)d('hat',st,st%2?0.4:st%4?0.55:0.75)}}});
 return ev.sort((a,b)=>a.t-b.t)};   // stable: at equal times the harmony stays ahead of the melody
const tiaCents=(m,div=6)=>{let b=1e9;for(let n=0;n<32;n++){const c=1200*Math.log2(31440/div/(n+1)/(440*Math.pow(2,(m-69)/12)));if(Math.abs(c)<Math.abs(b))b=c}return b};   // div 6 = bass (c=12), 2 = lead (c=4)
T.chipEvents=(chip,bpm,mask,tr=0)=>{   // tr = transpose in semitones (the vinyl-style slow-down lowers the pitch)
 const R=G.CHIPS[chip].range,[lo,hi]=R.lead,SH=12*Math.round(((lo+hi)/2-79)/12),blo=R.bass[0],BS=12*Math.ceil((blo-40)/12);
 const twin=['fm','snes','arcade'].includes(chip),thin=chip==='tia'||chip==='beep',out=[];
 for(const e of T.events(bpm,mask))switch(e.k){
  case 'mel':{let m=e.m+SH+tr;if(chip==='tia')while(m<lo)m+=12;if(chip==='tia'&&Math.abs(tiaCents(m,2))>45&&m-12>=lo)m-=12;   // TIA D6 is 50¢ sharp: that note drops to D5
   out.push({t:e.t,part:'lead',m,d:e.d,v:e.v});break}
  case 'har':if(twin)out.push({t:e.t,part:'lead',m:e.m+SH+tr,d:e.d,v:e.v});break;
  case 'bass':{let m=e.m+BS+tr,r=e.root+BS+tr;while(r<blo){r+=12;m+=12}while(m<blo)m+=12;   // an approach note below the floor goes up an octave
   if(chip==='tia'&&Math.abs(tiaCents(m))>35&&m-12>=blo)m-=12;
   out.push({t:e.t,part:'bass',m,d:e.d,v:e.v});break}
  case 'snare':if(!(thin&&e.v<0.4))out.push({t:e.t,part:'snare',m:0,d:0,v:e.v});break;
  default:out.push({t:e.t,part:e.k,m:e.m,d:e.d,v:e.v})}
 return out};
T.barLabel=(bi,tr=0)=>{const B=BARS[bi],n=bi-BARS.findIndex(x=>x.sec===B.sec)+1;return B.sec+n+' · '+B.ch.map(c=>c[1]).join(' | ').replace(/b9/g,'♭9').replace(/b5/g,'♭5').replace(/#/g,'♯')+(tr?' (+'+tr+')':'')};
T.label=i=>{const o=ORDER[i];return T.barLabel(o.bi,o.tr)};   // i = position in the order (= the bar index when there is no order)
})(globalThis);
