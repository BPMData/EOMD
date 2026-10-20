/* audio/arranger.js: CORE. Turns a score (score/*.json) into audio sections; the music itself lives in one file per style.
   Load order: engine/src/audio/dsp.js, audio/instruments.js, this file, then the style files (audio/style-*.js) in any order.
   Each style file registers itself: MUSIC.styles.<name> = generator (sc,o) → {index,sr,len,L,R}; optional .loopSections(sc) = sections per loop.
   Styles: comp4 (endless, generative; also the default for unknown styles), film24 (fixed seamless loop), rounds (20-min study loop).
   API: MUSIC.section(score,{sr,seed,index}) generator; MUSIC.run(...) runs it; MUSIC.sectionLen(score); MUSIC.loopSections(score); MUSIC.bind(score). */
(function(G){'use strict';
const I=G.INSTR,M=(G.MUSIC={});
M.styles={};
M.sectionLen=sc=>sc.bars*4*60/sc.bpm;
M.section=function*(sc,o){return yield* (M.styles[sc.style]||M.styles.comp4)(sc,o||{})};
// Sections in one full loop for fixed-form styles (film24, rounds); null for open-ended comp4. Used by tools/porter.py.
M.loopSections=sc=>{const f=M.styles[sc.style];return f&&f.loopSections?f.loopSections(sc):null};
M.run=(sc,o)=>I.now(M.section(sc,o));
// Compatibility for players written against the old single-song API (living/sound-timer.js uses SSRM)
M.bind=sc=>({section:o=>M.section(sc,o),run:o=>M.run(sc,o),sectionLen:()=>M.sectionLen(sc)});
})(globalThis);
 