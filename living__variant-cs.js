/* living__variant-cs.js: CS-class variant of the living poster. Needs living__trio.js (injected before this file); CS-only parts: title,
   Source Code Pro for `code` spans, TRIO from CSCARDS (parsed from proj__cs__copy.md at build; Python/skipped cards already filtered), end card. */
document.title='Mr. Murphy’s Computer Science';
document.getElementById('cv').setAttribute('aria-label','Mr. Murphy’s Computer Science: a slowly growing, living poster with coding tips in English, Spanish and Portuguese');
{const st=document.createElement('style');st.textContent='@font-face{font-family:"Source Code Pro";src:url(data:font/woff2;base64,__MONO__) format("woff2");font-weight:400 700;font-display:block}';document.head.appendChild(st)}
VFONTS.push('600 48px "Source Code Pro"','500 48px "Source Code Pro"');
const MONO='"Source Code Pro",Consolas,monospace';
TRIO=CSCARDS.map(c=>LANGS.map(L=>c[L.key]));
// end-of-timer card (approved by Bryan, Oct 6; keep the timer in the CS version)
TICKET=[{r:'title',t:'SAVE YOUR WORK!',size:150},{r:'sub',t:'¡Guarda tu trabajo!',size:56,gap:20},{r:'sub',t:'Salve seu trabalho!',size:56}];
