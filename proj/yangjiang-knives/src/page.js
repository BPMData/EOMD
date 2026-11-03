/* Knife Country: page behaviour. Every animation is a pure function of scroll progress (or of a click), never of
   frame rate. Reduced motion: marks are shown already struck, nothing travels. */
(() => {
"use strict";
const NS = "http://www.w3.org/2000/svg";
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeIn = t => t * t * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);
function el(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
let uid = 0;

/* ---------- the strike ---------- */
const CONTACT = .40, LIFT = .48, GONE = .74;
function buildStrike(svg) {
  const mode = svg.dataset.mode, mark = svg.dataset.mark, sub = svg.dataset.sub || "", han = svg.dataset.han === "1";
  const id = "s" + (uid++);
  const defs = el("defs", {}, svg);
  // deboss: dark inner shadow on top edge, light lip on the bottom edge
  const f = el("filter", { id: id + "d", x: "-5%", y: "-10%", width: "110%", height: "125%" }, defs);
  f.innerHTML = `<feOffset in="SourceAlpha" dy="5" result="dn"/><feGaussianBlur in="dn" stdDeviation="2.4" result="dnb"/>
    <feComposite in="SourceAlpha" in2="dnb" operator="out" result="inner"/><feFlood flood-color="#060707" flood-opacity=".92"/>
    <feComposite in2="inner" operator="in" result="shadow"/><feOffset in="SourceAlpha" dy="3" result="lo"/>
    <feComposite in="lo" in2="SourceAlpha" operator="out" result="lip"/><feFlood flood-color="#fff" flood-opacity=".38"/>
    <feComposite in2="lip" operator="in" result="hl"/>
    <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="shadow"/><feMergeNode in="hl"/></feMerge>`;
  const r = el("filter", { id: id + "r" }, defs);
  r.innerHTML = `<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="${7 + uid}"/>
    <feDisplacementMap in="SourceGraphic" scale="3.5"/>`;

  const world = el("g", {}, svg);           // shakes on impact
  const base = el("g", {}, world);          // paper sheet / label under an ink mark
  const markG = el("g", {}, world);
  const tool = el("g", {}, svg);            // the die or stamp, above everything
  let ink = "#4e5256";

  if (mode === "deboss") {
    markG.setAttribute("filter", `url(#${id}d)`);
    // the die: a hardened block with a bevelled face
    el("rect", { x: 140, y: -230, width: 720, height: 200, fill: "#1f2123" }, tool);
    el("rect", { x: 170, y: -30, width: 660, height: 22, fill: "#151618" }, tool);
    el("rect", { x: 140, y: -230, width: 720, height: 6, fill: "#3a3d40" }, tool);
  } else if (mode === "seal") {
    el("rect", { x: 250, y: 30, width: 500, height: 500, fill: "#F2EDE3" }, base);
    for (let i = 0; i < 6; i++) el("line", { x1: 300 + i * 80, y1: 60, x2: 300 + i * 80, y2: 500, stroke: "#d8cfbd", "stroke-width": 1.5 }, base);
    ink = "#C0281E";
    markG.setAttribute("filter", `url(#${id}r)`);
    // a carved stone seal
    el("rect", { x: 355, y: -330, width: 290, height: 300, fill: "#5b4a3a" }, tool);
    el("rect", { x: 345, y: -40, width: 310, height: 20, fill: "#3d3127" }, tool);
  } else { // label: a rubber stamp on a paper label
    el("rect", { x: 70, y: 150, width: 860, height: 260, fill: "#FBF8F1", stroke: "#cfc6b3", "stroke-width": 2 }, base);
    ink = "#22201c";
    markG.setAttribute("filter", `url(#${id}r)`);
    el("rect", { x: 130, y: -90, width: 740, height: 60, fill: "#7a5230" }, tool);
    el("rect", { x: 440, y: -330, width: 120, height: 250, fill: "#8d6038" }, tool);
    el("ellipse", { cx: 500, cy: -330, rx: 110, ry: 46, fill: "#9b6b3f" }, tool);
    el("rect", { x: 120, y: -32, width: 760, height: 16, fill: "#2a2723" }, tool);
  }

  if (mode === "seal") {
    // four characters, read top-right down, then the next column: 兵律 | 关津
    const chars = (sub + mark).split("");
    const pos = [[600, 200], [600, 400], [400, 200], [400, 400]];
    el("rect", { x: 280, y: 90, width: 440, height: 420, fill: "none", stroke: ink, "stroke-width": 16 }, markG);
    chars.forEach((c, i) => {
      const t = el("text", { x: pos[i][0], y: pos[i][1] + 70, "text-anchor": "middle", fill: ink,
        "font-size": 170, "font-family": "Han, serif", "font-weight": 900 }, markG);
      t.textContent = c;
    });
  } else {
    const t = el("text", { x: 500, y: 300, "text-anchor": "middle", fill: ink, class: "m" }, markG);
    t.textContent = mark;
    if (han) { t.setAttribute("font-family", "Han, serif"); t.setAttribute("font-weight", "900"); }
    else { t.setAttribute("font-family", "Arch, sans-serif"); t.setAttribute("font-weight", "900");
      t.setAttribute("style", "font-stretch:62%;letter-spacing:.02em"); }
    if (sub) {
      const s = el("text", { x: 500, y: 400, "text-anchor": "middle", fill: ink, "font-family": "Arch, sans-serif",
        "font-weight": 800, "font-size": 34, style: "letter-spacing:.42em;font-stretch:90%" }, markG);
      s.textContent = sub;
    }
  }
  const state = { svg, world, markG, tool, mode, fit: () => fitMark(svg, mode) };
  state.fit();
  return state;
}
function fitMark(svg, mode) {
  const t = svg.querySelector("text.m");
  if (!t) return;
  const maxW = mode === "label" ? 780 : 900, maxH = 290;
  t.setAttribute("font-size", 200);
  const b = t.getBBox();
  const k = Math.min(maxW / b.width, maxH / b.height);
  t.setAttribute("font-size", (200 * k).toFixed(1));
  // centre vertically on 280 (cap height ~ .72 of the font size)
  t.setAttribute("y", (280 + 200 * k * .36).toFixed(1));
  const s = t.nextElementSibling;
  if (s) s.setAttribute("y", (280 + 200 * k * .36 + 80).toFixed(1));
}
function renderStrike(s, p) {
  if (RM) p = 1;
  let y;                                   // die offset, in viewBox units
  const contactY = s.mode === "seal" ? 120 : s.mode === "label" ? 175 : 175;
  if (p < CONTACT) y = lerp(-240, contactY, easeIn(p / CONTACT));
  else if (p < LIFT) y = contactY - 6 * Math.sin((p - CONTACT) / (LIFT - CONTACT) * Math.PI); // a small recoil
  else y = lerp(contactY, -420, easeOut(smooth(LIFT, GONE, p)));
  s.tool.setAttribute("transform", `translate(0 ${y.toFixed(1)})`);
  s.tool.style.opacity = p > GONE ? 0 : 1;
  const struck = p >= CONTACT;
  s.markG.style.opacity = struck ? 1 : 0;
  // the metal (or paper) takes the blow: a short, damped jolt, as a function of progress
  const dt = p - CONTACT;
  const shake = struck && dt < .08 ? 7 * Math.exp(-dt * 55) * Math.sin(dt * 260) : 0;
  s.world.setAttribute("transform", `translate(0 ${shake.toFixed(2)})`);
}

/* ---------- custom scenes: the porcelain stamps (ch 6) and 李 → 十八子 (ch 7) ---------- */
function roughFilter(defs, id, seed) {
  el("filter", { id }, defs).innerHTML = `<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="3.5"/>`;
}
// a stamp landing: overshoot in scale and opacity over a short stretch of scroll, then rest
function landing(g, p, at, rot, cx, cy) {
  const t = smooth(at, at + .035, p);
  const k = p < at ? 1.25 : 1 + .25 * (1 - easeOut(clamp((p - at) / .035)));
  g.style.opacity = t.toFixed(2);
  g.setAttribute("transform", `rotate(${rot} ${cx} ${cy}) translate(${cx} ${cy}) scale(${k.toFixed(3)}) translate(${-cx} ${-cy})`);
}
const CUSTOM = {
  porcelain(svg) {
    const defs = el("defs", {}, svg);
    roughFilter(defs, "pr", 5);
    el("circle", { cx: 500, cy: 300, r: 290, fill: "#F6F2EA" }, svg);
    el("circle", { cx: 500, cy: 300, r: 175, fill: "none", stroke: "#d9d2c4", "stroke-width": 12 }, svg);
    el("circle", { cx: 500, cy: 300, r: 168, fill: "none", stroke: "#c9c1b1", "stroke-width": 2 }, svg);
    const ink = "#2F4AA0";
    const mk = (y, txt, size, sub) => {
      const g = el("g", { filter: "url(#pr)" }, svg);
      const t = el("text", { x: 500, y, "text-anchor": "middle", fill: ink, "font-family": "Arch,sans-serif", "font-weight": 900,
        "font-size": size, style: "font-stretch:80%;letter-spacing:.12em" }, g);
      t.textContent = txt;
      if (sub) { const s = el("text", { x: 500, y: y + 34, "text-anchor": "middle", fill: "#5C564C", "font-family": "Arch,sans-serif",
        "font-weight": 700, "font-size": 24, style: "letter-spacing:.2em" }, svg); s.textContent = sub; s.style.opacity = 0; g.sub = s; }
      return g;
    };
    const nip = mk(222, "NIPPON", 72, "1891–1921"), jap = mk(338, "JAPAN", 92, "FROM SEPT 1, 1921"), occ = mk(450, "MADE IN OCCUPIED JAPAN", 34, "1947–1952");
    const strike = el("line", { x1: 360, y1: 220, x2: 640, y2: 178, stroke: "#B3261E", "stroke-width": 9, "stroke-linecap": "square",
      pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1 }, svg);
    return p => {
      if (RM) p = 1;
      landing(nip, p, .14, -5, 500, 200); nip.sub.style.opacity = smooth(.17, .2, p);
      strike.setAttribute("stroke-dashoffset", (1 - smooth(.4, .46, p)).toFixed(3));
      landing(jap, p, .5, 2, 500, 310); jap.sub.style.opacity = smooth(.53, .56, p);
      landing(occ, p, .78, -2, 500, 440); occ.sub.style.opacity = smooth(.81, .84, p);
    };
  },
  splitname(svg) {
    const gold = "#E2B44B";
    const mk = (c, x, size) => {
      const t = el("text", { x, y: 340, "text-anchor": "middle", fill: gold, "font-family": "Han,serif", "font-weight": 900, "font-size": size }, svg);
      t.textContent = c; return t;
    };
    const li = mk("李", 500, 380);
    const parts = [["十", 230], ["八", 500], ["子", 770]].map(([c, x]) => ({ t: mk(c, 500, 240), x }));
    const labels = [["ten", 230], ["eight", 500], ["son", 770]].map(([w, x]) => {
      const t = el("text", { x, y: 420, "text-anchor": "middle", fill: "#F4EFE6", "font-family": "Arch,sans-serif", "font-weight": 700,
        "font-size": 30, style: "letter-spacing:.2em" }, svg); t.textContent = w.toUpperCase(); return t; });
    return p => {
      if (RM) p = 1;
      const k = easeOut(smooth(.3, .62, p));
      li.style.opacity = (smooth(.05, .14, p) * (1 - smooth(.3, .4, p))).toFixed(2);
      parts.forEach(({ t, x }) => {
        t.setAttribute("x", lerp(500, x, k).toFixed(1));
        t.style.opacity = smooth(.3, .42, p).toFixed(2);
      });
      labels.forEach(t => t.style.opacity = smooth(.6, .68, p).toFixed(2));
    };
  }
};

/* ---------- scenes: progress through a tall box with a sticky stage ---------- */
const scenes = [...document.querySelectorAll(".scene")].map(sc => ({
  sc,
  strikes: [...sc.querySelectorAll("svg.strike")].map(buildStrike),
  customs: [...sc.querySelectorAll("svg.porcelain, svg.splitname")].map(n => CUSTOM[n.getAttribute("class")](n)),
  reveals: [...sc.querySelectorAll("[data-at]")].map(n => ({ n, at: parseFloat(n.dataset.at) }))
}));
function sceneProgress(sc) {
  const r = sc.getBoundingClientRect();
  const total = sc.offsetHeight - innerHeight;
  return total > 0 ? clamp(-r.top / total) : 1;
}
function renderScenes() {
  for (const S of scenes) {
    const r = S.sc.getBoundingClientRect();
    if (r.bottom < -50 || r.top > innerHeight + 50) continue;
    const p = RM ? 1 : sceneProgress(S.sc);
    S.strikes.forEach(s => renderStrike(s, p));
    S.customs.forEach(c => c(p));
    for (const { n, at } of S.reveals) {
      const v = at < 0 ? 1 - smooth(0, .12, p) : smooth(at, at + .07, p);
      n.style.opacity = v.toFixed(3);
      n.style.transform = `translateY(${((1 - v) * 14).toFixed(1)}px)`;
    }
  }
}

/* ---------- the belt ---------- */
const BELT = {
  sheffield: { plates: [["KNIFE CHAMPION", "SHEFFIELD", "ENGLAND"]], name: "Sheffield",
    line: "Holds the title on crucible steel and the Cutlers’ marks, from the 1700s." },
  solingen: { plates: [["KNIFE CHAMPION", "SOLINGEN", "GERMANY"]], name: "Solingen",
    line: "Takes it in the late 1800s, on price, machines and a label meant to shame it." },
  split: { plates: [["HEAVYWEIGHT", "SOLINGEN", "GERMANY"], ["LIGHTWEIGHT", "JAPAN", "SEKI · SAKAI"]], name: "Split title",
    line: "By the 2000s the title splits: the heavy forged knives stay German, the light thin ones go Japanese." },
  volume: { plates: [["HEAVYWEIGHT", "SOLINGEN", "GERMANY"], ["LIGHTWEIGHT", "JAPAN", "SEKI · SAKAI"], ["VOLUME", "YANGJIANG", "CHINA"]], name: "Volume belt",
    line: "China takes a third belt, for tonnage: more than half the world’s knife exports by 2024." },
  vacant: { plates: [["KNIFE CHAMPION", "VACANT", "KNIFE BY KNIFE"]], name: "Vacated",
    line: "Vacated: from here on it’s judged knife by knife, not country by country." }
};
const beltBtn = document.getElementById("belt");
const beltSvg = beltBtn.querySelector("svg");
const reached = [];
let beltState = "none", beltTimer = 0;
function drawBelt(key) {
  const P = BELT[key].plates, n = P.length, W = 120 + n * 116;
  beltSvg.setAttribute("viewBox", `0 0 ${W} 120`);
  beltSvg.style.width = (W / 2) + "px";
  let s = `<rect x="0" y="40" width="${W}" height="40" fill="#4a2f18"/>
    <rect x="0" y="45" width="${W}" height="30" fill="none" stroke="#c9a463" stroke-width="1.2" stroke-dasharray="4 3"/>
    <rect x="18" y="34" width="34" height="52" fill="#c99a3b"/><rect x="${W - 52}" y="34" width="34" height="52" fill="#c99a3b"/>`;
  P.forEach(([top, big, small], i) => {
    const x = 62 + i * 116, vac = big === "VACANT";
    s += `<rect x="${x}" y="6" width="112" height="108" fill="${vac ? "#d8cfbd" : "#E2B44B"}"/>
      <rect x="${x + 8}" y="14" width="96" height="92" fill="none" stroke="${vac ? "#8d8574" : "#7a5a16"}" stroke-width="2"/>
      <text x="${x + 56}" y="38" text-anchor="middle" font-family="Arch,sans-serif" font-weight="800" font-size="9" letter-spacing="1.2" fill="#4a3608">${top}</text>
      <text x="${x + 56}" y="68" text-anchor="middle" font-family="Arch,sans-serif" font-weight="900" font-size="${big.length > 8 ? 16 : 19}" style="font-stretch:68%" fill="#2e2104">${big}</text>
      <text x="${x + 56}" y="88" text-anchor="middle" font-family="Arch,sans-serif" font-weight="700" font-size="8.5" letter-spacing="1.2" fill="#4a3608">${small}</text>`;
  });
  beltSvg.innerHTML = s;
}
function setBelt(key) {
  if (key === beltState) return;
  beltState = key;
  clearTimeout(beltTimer);
  // the lineage is everything up to the furthest holder reached, so skipping ahead never drops a name
  const ORDER = Object.keys(BELT), at = ORDER.indexOf(key);
  if (at >= 0) ORDER.slice(0, at + 1).forEach(k => { if (!reached.includes(k)) reached.push(k); });
  const show = () => {
    if (!BELT[key]) return;
    drawBelt(key); beltBtn.classList.add("on", "open");
    beltTimer = setTimeout(() => beltBtn.classList.remove("open"), 3200);   // retract to the strip so it never sits on text
  };
  if (beltBtn.classList.contains("on") && !RM) { beltBtn.classList.remove("on", "open"); beltTimer = setTimeout(show, 480); }
  else { beltBtn.classList.remove("on", "open"); show(); }
}
const chapters = [...document.querySelectorAll("section.ch[data-belt]")];
function currentChapter() {
  let cur = chapters[0];
  for (const c of chapters) if (c.getBoundingClientRect().top < innerHeight * .5) cur = c;
  return cur;
}
beltBtn.addEventListener("click", () => {
  const list = document.getElementById("linlist");
  list.innerHTML = reached.map(k => `<li><b>${BELT[k].name}</b><span>${BELT[k].line}</span></li>`).join("");
  document.getElementById("lineage").showModal();
});

/* ---------- 1: the 1,400-year stamp ---------- */
(function claim() {
  const svg = document.getElementById("claim");
  if (!svg) return;
  const defs = el("defs", {}, svg);
  el("filter", { id: "cr" }, defs).innerHTML = `<feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="3"/>`;
  const crack = "210,0 196,30 222,58 200,84 218,110 204,140";
  const halves = [`0,0 ${crack} 0,140`, `420,0 ${crack} 420,140`].map((pts, i) => {
    const cp = el("clipPath", { id: "h" + i }, defs);
    el("polygon", { points: pts }, cp);
    const g = el("g", { "clip-path": `url(#h${i})`, style: "transition:transform .9s cubic-bezier(.5,0,.8,.3), opacity .9s;transform-box:fill-box;transform-origin:center" }, svg);
    const s = el("g", { filter: "url(#cr)", transform: "rotate(-4 210 70)" }, g);
    el("rect", { x: 20, y: 18, width: 380, height: 104, fill: "none", stroke: "#B3261E", "stroke-width": 7 }, s);
    const t = el("text", { x: 210, y: 92, "text-anchor": "middle", fill: "#B3261E", "font-family": "Arch,sans-serif", "font-weight": 900, "font-size": 64, style: "font-stretch:70%;letter-spacing:.04em" }, s);
    t.textContent = "1,400 YEARS";
    return g;
  });
  const btn = document.getElementById("crack");
  btn.addEventListener("click", () => {
    halves[0].style.transform = "translate(-26px,40px) rotate(-14deg)";
    halves[1].style.transform = "translate(30px,58px) rotate(17deg)";
    halves.forEach(h => h.style.opacity = .25);
    btn.textContent = "One sword, in one tomb";
    btn.disabled = true;
  });
})();

/* ---------- 2: load a cleaver ---------- */
(function ship() {
  const svg = document.getElementById("ship");
  if (!svg) return;
  svg.innerHTML = `
    <defs><filter id="sr"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="9"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter></defs>
    <rect x="10" y="10" width="330" height="310" fill="#F2EDE3"/>
    <text x="34" y="52" font-family="Arch,sans-serif" font-weight="900" font-size="17" letter-spacing="1.5" fill="#1B1A17">OUTBOUND · PER CREWMAN</text>
    <line x1="34" y1="66" x2="316" y2="66" stroke="#1B1A17" stroke-width="2"/>
    <g font-family="Serif,serif" font-size="21" fill="#1B1A17">
      <text x="34" y="114">Cast-iron wok</text><text x="300" y="114" text-anchor="end">× 1</text>
      <text x="34" y="164">Axe</text><text x="300" y="164" text-anchor="end">× 1</text>
      <text x="34" y="214" fill="#5C564C">Cleaver</text><text x="300" y="214" text-anchor="end" fill="#5C564C">× 0</text>
    </g>
    <g stroke="#C9C0AE" stroke-width="1"><line x1="34" y1="130" x2="316" y2="130"/><line x1="34" y1="180" x2="316" y2="180"/><line x1="34" y1="230" x2="316" y2="230"/></g>
    <g id="seal" style="opacity:0;transition:opacity .12s" filter="url(#sr)" transform="rotate(-8 230 262)">
      <rect x="166" y="222" width="128" height="80" fill="none" stroke="#C0281E" stroke-width="6"/>
      <text x="230" y="282" text-anchor="middle" font-family="Han,serif" font-weight="900" font-size="50" fill="#C0281E">没收</text>
    </g>
    <g id="cleaver" style="transition:transform .7s cubic-bezier(.3,.9,.3,1)">
      <rect x="372" y="150" width="120" height="74" fill="#c5c9cd" stroke="#1B1A17" stroke-width="2"/>
      <rect x="352" y="174" width="22" height="26" fill="#4a2f18" stroke="#1B1A17" stroke-width="2"/>
      <rect x="322" y="178" width="34" height="18" fill="#4a2f18" stroke="#1B1A17" stroke-width="2"/>
      <line x1="372" y1="222" x2="492" y2="222" stroke="#f4f6f8" stroke-width="2"/>
    </g>
    <text x="430" y="262" text-anchor="middle" font-family="Arch,sans-serif" font-size="13" letter-spacing="1.5" fill="#F4EFE6">YOUR CLEAVER</text>`;
  const cl = svg.querySelector("#cleaver"), seal = svg.querySelector("#seal"), btn = document.getElementById("load");
  let busy = false;
  btn.addEventListener("click", () => {
    if (busy) return; busy = true;
    const step = RM ? 0 : 1;
    cl.style.transform = "translate(-250px, 24px) scale(.82)";
    setTimeout(() => { seal.style.opacity = 1; }, 750 * step);
    setTimeout(() => { cl.style.transform = ""; }, 1500 * step);
    setTimeout(() => { seal.style.opacity = 0; busy = false; btn.textContent = "Try again"; }, 2900 * step);
  });
})();

/* ---------- plate 1: carbon ---------- */
(function plate1() {
  const fig = document.getElementById("p1fig");
  if (!fig) return;
  const STEELS = [
    { name: "3Cr13", c: "0.26–0.45% carbon", hrc: [50, 54], out: "bend",
      say: "a cheap, soft stainless that shrugs off a whack against bone but goes dull fast, which is why it turns up in heavy cleavers." },
    { name: "X50CrMoV15", c: "about 0.5% carbon", hrc: [55, 58], out: "roll",
      say: "the German standard: tough and forgiving, with an edge that rolls over rather than breaking, so a few strokes on a honing steel stand it back up." },
    { name: "VG-10", c: "about 1% carbon", hrc: [60, 62], out: "hold",
      say: "the Japanese workhorse stainless: harder, so it holds a thin edge much longer, though twist it in something hard and it can chip." },
    { name: "Shirogami #1", c: "1.25–1.35% carbon", hrc: [63, 65], out: "chip",
      say: "Japanese “white paper” carbon steel: takes the keenest edge of the lot, chips the easiest, and rusts if you look at it wrong." }
  ];
  const seg = document.getElementById("p1seg"), out = document.getElementById("p1out");
  const WORD = { bend: "BENDS", roll: "ROLLS", hold: "HOLDS", chip: "CHIPS" };
  // static parts: bone and hardness scale; moving parts: the blade (with its load arrow), shards, the verdict
  fig.innerHTML = `
    <g id="p1blade"><g id="p1arrow"><line x1="170" y1="-6" x2="170" y2="14" stroke="#1B1A17" stroke-width="2.5"/>
      <path d="M 161 6 L 170 20 L 179 6 Z" fill="#1B1A17"/>
      <text x="188" y="12" font-family="Arch,sans-serif" font-size="14" letter-spacing="1.5" fill="#5C564C">LOAD</text></g>
      <path id="p1edge" fill="#c5c9cd" stroke="#1B1A17" stroke-width="2.2" stroke-linejoin="round"/></g>
    <rect x="80" y="194" width="200" height="34" fill="#e3dccd" stroke="#1B1A17" stroke-width="1.5"/>
    <text x="180" y="216" text-anchor="middle" font-family="Arch,sans-serif" font-size="13" letter-spacing="2.5" fill="#5C564C">BONE</text>
    <g id="p1shards"><path d="M -7 -4 l 13 -5 l 3 12 z" fill="#c5c9cd" stroke="#1B1A17" stroke-width="1.6"/>
      <path d="M -5 -3 l 10 -4 l 2 9 z" fill="#c5c9cd" stroke="#1B1A17" stroke-width="1.6"/></g>
    <text id="p1word" x="20" y="120" font-family="Arch,sans-serif" font-weight="900" font-size="28" style="font-stretch:72%" fill="#B3261E"></text>
    <text x="20" y="262" font-family="Arch,sans-serif" font-size="13" letter-spacing="1.5" fill="#5C564C">HARDNESS, ROCKWELL C</text>
    <line x1="20" y1="284" x2="340" y2="284" stroke="#C9C0AE" stroke-width="12"/>
    <line id="p1bar" y1="284" y2="284" stroke="#1E2A57" stroke-width="12" style="transition:all .4s cubic-bezier(.2,1,.3,1)"/>
    <text x="20" y="310" font-family="Arch,sans-serif" font-size="13" fill="#5C564C">48</text>
    <text x="340" y="310" text-anchor="end" font-family="Arch,sans-serif" font-size="13" fill="#5C564C">68</text>
    <text id="p1hrc" y="310" text-anchor="middle" font-family="Arch,sans-serif" font-weight="800" font-size="15" fill="#1B1A17"></text>`;
  const blade = fig.querySelector("#p1blade"), edge = fig.querySelector("#p1edge"), shards = [...fig.querySelectorAll("#p1shards path")],
    word = fig.querySelector("#p1word"), bar = fig.querySelector("#p1bar"), hrc = fig.querySelector("#p1hrc");
  const f1 = n => n.toFixed(1);
  // the edge outline; k bends the apex over to the left (0 = straight); chipped = a notch where the tip broke away
  function edgePath(k, chipped) {
    if (chipped) return "M 150 30 L 190 30 L 180 150 Q 177 168 175 177 L 168 181 L 171 186 L 165 186 Q 163 170 160 150 Z";
    const px = 170 - 26 * k, py = 194 - 7 * k;
    return `M 150 30 L 190 30 L ${f1(180 - 3 * k)} 150 Q ${f1(177 + 2 * k)} ${f1(172 + 16 * k)} ${f1(px)} ${f1(py)} ` +
      `Q ${f1(164 - 12 * k)} ${f1(172 + 8 * k)} ${f1(160 - 6 * k)} 150 Z`;
  }
  // one blow, as a pure function of milliseconds since the steel was picked
  const DROP = 650, BEND = 420, END = 1600;
  function pose(s, t) {
    let dy = t < DROP ? lerp(-95, 0, easeIn(t / DROP)) : 0, k = 0, chipped = false;
    const after = t - DROP;
    if (after > 0) {
      if (s.out === "bend") k = easeOut(clamp(after / BEND));
      if (s.out === "roll") k = .42 * easeOut(clamp(after / BEND));
      if (s.out === "hold") dy = after < 320 ? -7 * Math.sin(Math.PI * after / 320) : 0;   // a clean bounce
      if (s.out === "chip") chipped = after > 25;
      if (s.out !== "hold") dy = after < 160 ? 2.5 * Math.sin(Math.PI * after / 160) : 0;  // the edge bites in a touch
    }
    blade.setAttribute("transform", `translate(0 ${f1(dy)})`);
    edge.setAttribute("d", edgePath(k, chipped));
    // chips fly off the apex and fall past the bone's edge under a fixed gravity
    shards.forEach((p, i) => {
      if (s.out !== "chip" || after < 25) { p.style.opacity = 0; return; }
      const u = (after - 25) / 1000, vx = i ? 105 : 70, vy = i ? -120 : -170, g = 700;
      const x = 172 + vx * u, y = 188 + vy * u + .5 * g * u * u;
      p.setAttribute("transform", `translate(${f1(x)} ${f1(Math.min(y, 300))}) rotate(${f1((i ? -1 : 1) * 540 * u)})`);
      p.style.opacity = (1 - smooth(250, 300, y)).toFixed(2);
    });
    word.textContent = WORD[s.out];
    word.style.opacity = smooth(DROP + 150, DROP + 400, t).toFixed(2);
  }
  let cur = 1, t0 = 0, raf = 0;
  function play(i) {
    cur = i;
    const s = STEELS[i];
    const lo = 20 + (s.hrc[0] - 48) / 20 * 320, hi = 20 + (s.hrc[1] - 48) / 20 * 320;
    bar.setAttribute("x1", f1(lo)); bar.setAttribute("x2", f1(hi));
    hrc.setAttribute("x", f1((lo + hi) / 2)); hrc.textContent = `${s.hrc[0]}–${s.hrc[1]}`;
    out.innerHTML = `<b>${s.name}</b>, ${s.c}, ${s.hrc[0]}–${s.hrc[1]} HRC: ${s.say}`;
    [...seg.children].forEach((b, j) => b.setAttribute("aria-pressed", j === i));
    cancelAnimationFrame(raf);
    if (RM) { pose(s, END); return; }
    t0 = performance.now();
    const tick = now => { const t = now - t0; pose(s, Math.min(t, END)); if (t < END) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  }
  STEELS.forEach((s, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = s.name;
    b.addEventListener("click", () => play(i));   // picking the same steel again replays the blow
    seg.appendChild(b);
  });
  // ready and waiting above the bone; the first blow lands when the plate is properly on screen
  pose(STEELS[1], 0);
  [...seg.children].forEach((b, j) => b.setAttribute("aria-pressed", j === 1));
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); play(cur); } }, { threshold: .6 });
  io.observe(fig);
  if (RM) play(1);
})();

/* ---------- chart: Sheffield's cutlery workforce ---------- */
(function sheffChart() {
  const box = document.getElementById("sheffchart");
  if (!box) return;
  const D = [[1881, 15500], [1891, 15000], [1901, 14500], [1911, 14200], [1951, 10500], [1971, 5500], [1981, 2500], [2022, 1000]];
  const W = Math.max(320, Math.min(560, box.clientWidth || 560)), H = Math.round(W * .62), L = 44, R = 14, T = 26, B = 40;
  const x = yr => L + (yr - 1875) / (2030 - 1875) * (W - L - R);
  const y = v => T + (1 - v / 16000) * (H - T - B);
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label": "Line chart: Sheffield's cutlery workforce fell from about 15,500 in 1881 to under 1,000 in the 2020s" }, box);
  for (const v of [0, 5000, 10000, 15000]) {
    el("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: "#C9C0AE", "stroke-width": 1 }, svg);
    el("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end", "font-family": "Arch,sans-serif", "font-size": 12, fill: "#5C564C" }, svg)
      .textContent = v ? (v / 1000) + "k" : "0";
  }
  for (const yr of [1881, 1911, 1951, 1981, 2022]) {
    el("text", { x: x(yr), y: H - 16, "text-anchor": "middle", "font-family": "Arch,sans-serif", "font-size": 12, fill: "#5C564C" }, svg)
      .textContent = yr === 2022 ? "2020s" : yr;
  }
  const pts = D.map(([a, b]) => [x(a), y(b)]);
  const seg = (i, j, dash) => el("path", { d: `M${pts[i]} L${pts[j]}`, fill: "none", stroke: "#1B1A17", "stroke-width": 2,
    "stroke-dasharray": dash || "none", "stroke-linecap": "round" }, svg);
  for (let i = 0; i < pts.length - 1; i++) seg(i, i + 1, (i === 3 || i === 6) ? "5 5" : "");

  const tip = document.createElement("div"); tip.className = "tip"; box.appendChild(tip);
  D.forEach(([yr, v], i) => {
    const last = i === D.length - 1;
    el("circle", { cx: pts[i][0], cy: pts[i][1], r: 5, fill: last ? "#E9E1CF" : "#1B1A17", stroke: "#1B1A17", "stroke-width": 2 }, svg);
    const hit = el("circle", { cx: pts[i][0], cy: pts[i][1], r: 18, fill: "transparent", tabindex: 0,
      "aria-label": `${last ? "2020s" : yr}: ${last ? "under 1,000" : "about " + v.toLocaleString("en-US")}` }, svg);
    const show = () => {
      tip.textContent = `${last ? "2020s" : yr}: ${last ? "under 1,000" : "~" + v.toLocaleString("en-US")} workers`;
      const r = svg.getBoundingClientRect(), k = r.width / W;
      tip.style.left = pts[i][0] * k + "px"; tip.style.top = pts[i][1] * k + "px"; tip.classList.add("on");
    };
    hit.addEventListener("pointerenter", show); hit.addEventListener("focus", show); hit.addEventListener("click", show);
    hit.addEventListener("pointerleave", () => tip.classList.remove("on")); hit.addEventListener("blur", () => tip.classList.remove("on"));
  });
  el("text", { x: pts[0][0] + 8, y: pts[0][1] - 10, "font-family": "Arch,sans-serif", "font-weight": 800, "font-size": 13, fill: "#1B1A17" }, svg).textContent = "~15,500";
  el("text", { x: pts[7][0] - 4, y: pts[7][1] + 24, "text-anchor": "end", "font-family": "Arch,sans-serif", "font-weight": 800, "font-size": 13, fill: "#1B1A17" }, svg).textContent = "under 1,000";
  const det = document.createElement("details"); det.className = "tbl";
  det.innerHTML = `<summary>Show as a table</summary><table><tr><th>Year</th><th>Workers</th></tr>${
    D.map(([a, b], i) => `<tr><td>${i === D.length - 1 ? "2020s" : a}</td><td>${i === D.length - 1 ? "under 1,000" : "~" + b.toLocaleString("en-US")}</td></tr>`).join("")}</table>`;
  box.appendChild(det);
})();

/* ---------- shared: a time-based clip, as a pure function of elapsed ms ---------- */
function clip(ms, f) {
  if (clip.raf) cancelAnimationFrame(clip.raf);
  if (RM) { f(ms); return; }
  const t0 = performance.now();
  const tick = now => { const t = Math.min(now - t0, ms); f(t); if (t < ms) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
function onFirstView(node, fn, threshold = .6) {
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); fn(); } }, { threshold });
  io.observe(node);
}
const T = (x, y, txt, o = {}) => `<text x="${x}" y="${y}" font-family="Arch,sans-serif" font-size="${o.s || 13}" font-weight="${o.w || 500}"` +
  ` ${o.a ? `text-anchor="${o.a}"` : ""} letter-spacing="${o.ls ?? 1.2}" fill="${o.c || "#5C564C"}"${o.st ? ` style="${o.st}"` : ""}>${txt}</text>`;

/* ---------- plate 2: the bolster ---------- */
(function plate2() {
  const fig = document.getElementById("p2fig"), r = document.getElementById("p2r"), v = document.getElementById("p2v"), out = document.getElementById("p2out");
  if (!fig) return;
  function draw(n) {
    const w = n * 2.1;                                   // steel ground off the edge, drawing units (illustration)
    const edgeY = 150 - w;
    // the edge rises toward the heel; the bolster (dark) still reaches the board
    const gap = w > 0 ? `<path d="M 96 ${edgeY} L 150 ${edgeY + w * .55} L 210 ${150} L 210 150 L 96 150 Z" fill="url(#hatch2)" stroke="#B3261E" stroke-width="1.2"/>` : "";
    fig.innerHTML = `<defs><pattern id="hatch2" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line y2="6" stroke="#B3261E" stroke-width="1.2"/></pattern></defs>
      <path d="M 96 26 L 350 26 L 350 140 Q 300 150 210 150 L 150 ${(edgeY + w * .55).toFixed(1)} L 96 ${edgeY.toFixed(1)} Z" fill="#c5c9cd" stroke="#1B1A17" stroke-width="2"/>
      <rect x="60" y="26" width="36" height="124" fill="#8c9095" stroke="#1B1A17" stroke-width="2"/>
      <rect x="8" y="40" width="52" height="70" fill="#4a2f18" stroke="#1B1A17" stroke-width="2"/>
      <line x1="0" y1="152" x2="360" y2="152" stroke="#1B1A17" stroke-width="3"/>
      <rect x="0" y="153" width="360" height="22" fill="#e3dccd"/>
      ${gap}
      ${T(62, 192, "BOLSTER", { c: "#1B1A17", w: 800 })}${T(230, 192, "CUTTING BOARD")}
      ${w > 6 ? T(110, edgeY - 8, "GAP", { c: "#B3261E", w: 800 }) : ""}`;
    v.textContent = n;
    out.textContent = n === 0 ? "New: heel to tip, the whole edge meets the board."
      : n < 6 ? "The edge is wearing back, the bolster isn’t; the heel is starting to lift off the board."
      : "The bolster now hits the board first, so the back of the edge never reaches it: a dead patch exactly where you’d want to rock a cut. The fix is to grind the bolster down, which is why many newer knives have half bolsters or none at all. (Illustration, not to scale.)";
  }
  r.addEventListener("input", () => draw(+r.value));
  draw(0);
})();

/* ---------- plate 3: edge angle and bevel ---------- */
(function plate3() {
  const fig = document.getElementById("p3fig"), r = document.getElementById("p3r"), v = document.getElementById("p3v");
  const cut = document.getElementById("p3cut"), seg = document.getElementById("p3seg"), out = document.getElementById("p3out");
  if (!fig) return;
  const catra = a => a <= 34 ? lerp(800, 450, (a - 20) / 14) : lerp(450, 250, (a - 34) / 16);   // between the three tested angles
  const ax = a => 20 + (a - 20) / 30 * 320;
  function draw(a) {
    const h = a / 2 * Math.PI / 180, cx = 95, apex = 250, bevelTop = 150;
    const hw = (apex - bevelTop) * Math.tan(h);
    const mm = Math.round(catra(a) / 10) * 10;
    fig.innerHTML = `<defs><pattern id="hatch3" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line y2="6" stroke="#6d7277" stroke-width="1.2"/></pattern></defs>
      <polygon points="${cx - 30},20 ${cx + 30},20 ${cx + hw},${bevelTop} ${cx},${apex} ${cx - hw},${bevelTop}" fill="#c5c9cd" stroke="#1B1A17" stroke-width="1.8"/>
      <polygon points="${cx + hw},${bevelTop} ${cx},${apex} ${cx - hw},${bevelTop}" fill="url(#hatch3)" stroke="#1B1A17" stroke-width="1.8"/>
      <line x1="${cx}" y1="${apex}" x2="${cx - 80 * Math.sin(h)}" y2="${apex - 80 * Math.cos(h)}" stroke="#B3261E" stroke-dasharray="3 3"/>
      <line x1="${cx}" y1="${apex}" x2="${cx + 80 * Math.sin(h)}" y2="${apex - 80 * Math.cos(h)}" stroke="#B3261E" stroke-dasharray="3 3"/>
      ${T(cx, 278, a + "°", { a: "middle", s: 22, w: 900, c: "#B3261E", ls: 0 })}
      ${T(190, 40, "CARD CUT BEFORE DULL", { s: 11, w: 800 })}
      <rect x="190" y="52" width="150" height="14" fill="#e3dccd"/>
      <rect x="190" y="52" width="${(mm / 800 * 150).toFixed(1)}" height="14" fill="#1E2A57"/>
      ${T(340, 86, "about " + mm + " mm", { a: "end", s: 14, w: 800, c: "#1B1A17", ls: 0 })}
      ${T(190, 104, "tested at 20°, 34° and 50°;", { s: 10, ls: .3 })}${T(190, 118, "in between, interpolated", { s: 10, ls: .3 })}
      <g transform="translate(170,150)">
        <line x1="20" y1="40" x2="170" y2="40" stroke="#1B1A17" stroke-width="1.5" transform="scale(1,1)"/>
        ${[24, 30].map(d => `<line x1="${20 + (d - 20) / 30 * 150}" y1="34" x2="${20 + (d - 20) / 30 * 150}" y2="46" stroke="#1B1A17"/>`).join("")}
        <rect x="${20 + 4 / 30 * 150}" y="16" width="${6 / 30 * 150}" height="12" fill="#2F4AA0"/>
        <rect x="${20 + 10 / 30 * 150}" y="16" width="${10 / 30 * 150}" height="12" fill="#5C564C"/>
        ${T(20 + 7 / 30 * 150, 10, "JAPAN", { s: 10, w: 800, c: "#2F4AA0", a: "end" })}${T(20 + 10 / 30 * 150, 10, "GERMANY", { s: 10, w: 800, c: "#1B1A17" })}
        <path d="M ${20 + (a - 20) / 30 * 150} 48 l -6 10 h 12 z" fill="#B3261E"/>
        ${T(20, 74, "20°", { s: 10 })}${T(170, 74, "50°", { s: 10, a: "end" })}
      </g>`;
    v.textContent = a + "°";
  }
  r.addEventListener("input", () => draw(+r.value));
  draw(34);
  // the bevel: a cut down through a cucumber; the single bevel steers toward its flat side
  let mode = "double";
  function cutFrame(t) {
    const u = easeOut(clamp(t / 1200)), drift = mode === "single" ? 22 * u * u : 0, y = lerp(-10, 150, u);
    const kx = 180 + drift, half = mode === "single" ? [0, 12] : [6, 6];
    const blade = mode === "single"
      ? `M ${kx - 2} ${y - 110} L ${kx + 12} ${y - 110} L ${kx + 12} ${y - 30} L ${kx} ${y} L ${kx - 2} ${y - 30} Z`
      : `M ${kx - 6} ${y - 110} L ${kx + 6} ${y - 110} L ${kx + 6} ${y - 30} L ${kx} ${y} L ${kx - 6} ${y - 30} Z`;
    cut.innerHTML = `<rect x="0" y="176" width="360" height="22" fill="#e3dccd"/><line x1="0" y1="176" x2="360" y2="176" stroke="#1B1A17" stroke-width="2"/>
      <circle cx="180" cy="120" r="56" fill="#9bb27a" stroke="#1B1A17" stroke-width="2"/><circle cx="180" cy="120" r="42" fill="#d9e3b8"/>
      ${u > 0 ? `<path d="M 180 ${Math.max(64, Math.min(y, 176))} L ${180 + drift * clamp((y - 64) / 112)} ${Math.min(y, 176)}" stroke="#1B1A17" stroke-width="1.6"/>` : ""}
      <path d="${blade}" fill="#c5c9cd" stroke="#1B1A17" stroke-width="1.8"/>
      ${T(14, 24, mode === "single" ? "SINGLE BEVEL: STEERS TOWARD THE FLAT SIDE" : "DOUBLE BEVEL: STRAIGHT DOWN", { s: 11, w: 800 })}`;
    out.textContent = mode === "single"
      ? "Ground on one side only: pressure on the bevelled side pushes the blade toward the flat back, so a straight cut takes practice; the payoff is a clean release on thin slices of raw fish."
      : "Ground equally on both sides: the food pushes back evenly, and the knife goes where you aim it.";
  }
  [...seg.children].forEach(b => b.addEventListener("click", () => {
    mode = b.dataset.b;
    [...seg.children].forEach(x => x.setAttribute("aria-pressed", x === b));
    clip(1500, cutFrame);
  }));
  cutFrame(0);
  onFirstView(cut, () => clip(1500, cutFrame));
})();

/* ---------- plate 4: the wenwudao ---------- */
(function plate4() {
  const fig = document.getElementById("p4fig"), seg = document.getElementById("p4seg"), out = document.getElementById("p4out");
  if (!fig) return;
  let mode = "";
  function frame(t) {
    let dx = 0, dy = 0;
    if (mode === "slice") { const u = clamp(t / 1300); dx = -60 * Math.sin(u * Math.PI); dy = 10 * Math.sin(u * Math.PI); }
    if (mode === "chop") { const u = clamp(t / 900); dy = u < .5 ? lerp(0, -40, easeOut(u / .5)) : lerp(-40, 14, easeIn((u - .5) / .5)); if (u >= 1) dy = 14; }
    const front = mode === "slice" ? "#E2B44B" : "#c5c9cd", heel = mode === "chop" ? "#E2B44B" : "#c5c9cd";
    fig.innerHTML = `
      <rect x="0" y="196" width="360" height="22" fill="#e3dccd"/><line x1="0" y1="196" x2="360" y2="196" stroke="#1B1A17" stroke-width="2"/>
      <rect x="70" y="170" width="120" height="26" fill="#d98f80" stroke="#1B1A17" stroke-width="1.5"/>${T(130, 188, "MEAT", { a: "middle", s: 11, c: "#1B1A17" })}
      <rect x="228" y="176" width="56" height="20" fill="#efe9da" stroke="#1B1A17" stroke-width="1.5"/>${T(256, 190, "BONE", { a: "middle", s: 10, c: "#1B1A17" })}
      <g transform="translate(${dx.toFixed(1)} ${dy.toFixed(1)})">
        <rect x="40" y="60" width="180" height="104" fill="${front}" stroke="#1B1A17" stroke-width="2"/>
        <rect x="220" y="60" width="90" height="104" fill="${heel}" stroke="#1B1A17" stroke-width="2"/>
        <rect x="310" y="92" width="44" height="28" fill="#4a2f18" stroke="#1B1A17" stroke-width="2"/>
        <line x1="220" y1="60" x2="220" y2="164" stroke="#1B1A17" stroke-dasharray="4 4"/>
        ${T(130, 52, "FRONT TWO-THIRDS: THIN", { a: "middle", s: 10, w: 800, c: "#1B1A17", ls: .6 })}
        ${T(265, 40, "BACK THIRD:", { a: "middle", s: 10, w: 800, c: "#1B1A17", ls: .6 })}${T(265, 52, "THICK", { a: "middle", s: 10, w: 800, c: "#1B1A17", ls: .6 })}
      </g>`;
  }
  [...seg.children].forEach(b => b.addEventListener("click", () => {
    mode = b.dataset.m;
    [...seg.children].forEach(x => x.setAttribute("aria-pressed", x === b));
    out.textContent = mode === "slice" ? "Slice: the thin front two-thirds draws through boneless meat and vegetables."
      : "Chop: the thick back third takes the blow when the cleaver comes down through poultry bone.";
    clip(mode === "slice" ? 1300 : 900, frame);
  }));
  frame(0);
})();

/* ---------- plate 5: the sandwich ---------- */
(function plate5() {
  const fig = document.getElementById("p5fig"), r = document.getElementById("p5r"), v = document.getElementById("p5v");
  if (!fig) return;
  const section = (x, core, soft, label, sub) => `
    <polygon points="${x - 22},20 ${x + 22},20 ${x + 14},170 ${x},214 ${x - 14},170" fill="${soft}" stroke="#1B1A17" stroke-width="1.8"/>
    <polygon points="${x - 4},20 ${x + 4},20 ${x + 4},170 ${x},214 ${x - 4},170" fill="${core}" stroke="#1B1A17" stroke-width="1"/>
    ${T(x, 236, label, { a: "middle", s: 12, w: 800, c: "#1B1A17" })}${T(x, 252, sub, { a: "middle", s: 10.5 })}`;
  function draw(n) {
    const k = easeOut(n / 100), jx = lerp(270, 90, k);
    fig.innerHTML = `${section(90, "#3b4046", "#b9bfc6", "YANGJIANG 夹钢", "hard core, soft iron cheeks")}
      <g style="opacity:${(1 - .45 * k).toFixed(2)}">${section(jx, "#1E2A57", "#c9d1e6", k > .9 ? "" : "JAPAN SAN-MAI", k > .9 ? "" : "hagane core, jigane cheeks")}</g>
      ${T(200, 112, "HARD STEEL CORE", { s: 11, w: 800, c: "#1B1A17" })}<line x1="196" y1="108" x2="${(98 + (jx > 120 ? 0 : 0)).toFixed(0)}" y2="108" stroke="#1B1A17"/>
      ${T(200, 64, "SOFT CHEEKS", { s: 11, w: 800, c: "#1B1A17" })}<line x1="196" y1="60" x2="110" y2="60" stroke="#1B1A17"/>
      ${k > .9 ? T(270, 160, "SAME DRAWING", { a: "middle", s: 20, w: 900, c: "#B3261E", ls: 0, st: "font-stretch:72%" }) : ""}`;
    v.textContent = n >= 92 ? "the same drawing" : "";
  }
  r.addEventListener("input", () => draw(+r.value));
  draw(0);
})();

/* ---------- plate 6: heat treatment ---------- */
(function plate6() {
  const fig = document.getElementById("p6fig"), seg = document.getElementById("p6seg"), out = document.getElementById("p6out");
  if (!fig) return;
  // schematic temperature-time schedules (no numbers but the deep freeze, which the sources give)
  const GOOD = "M 10 160 L 50 40 L 110 40 L 125 150 L 150 150 L 160 205 L 185 205 L 195 150 L 215 128 L 240 128 L 250 150 L 270 128 L 295 128 L 305 150 L 350 150";
  const BAD = "M 10 160 L 50 40 L 75 40 L 90 150 L 120 150 L 140 128 L 165 128 L 175 150 L 350 150";
  function frame(which, t) {
    const u = clamp(t / 1400), good = which === "good";
    fig.innerHTML = `
      <line x1="10" y1="150" x2="350" y2="150" stroke="#C9C0AE"/>${T(352, 146, "ROOM", { a: "end", s: 9 })}
      <path d="${good ? GOOD : BAD}" fill="none" stroke="#1B1A17" stroke-width="2.2" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${(1 - u).toFixed(3)}"/>
      ${T(52, 32, "HEAT", { s: 10, w: 800 })}${T(good ? 150 : 92, good ? 222 : 168, good ? "DEEP FREEZE, −196°C" : "QUENCH", { s: 10, w: 800, c: good ? "#2F4AA0" : "#5C564C" })}
      ${T(good ? 208 : 134, 120, good ? "TEMPER ×2" : "TEMPER ×1", { s: 10, w: 800 })}
      ${T(10, 14, "TEMPERATURE OVER TIME (SCHEMATIC)", { s: 9.5 })}
      <g style="opacity:${smooth(.75, 1, u).toFixed(2)}">
        ${T(10, 244, good ? "≈ 61 HRC" : "≈ 57 HRC", { s: 16, w: 900, c: "#1B1A17", ls: 0 })}
        <rect x="100" y="232" width="250" height="14" fill="#e3dccd"/>
        <rect x="100" y="232" width="${good ? 250 : 150}" height="14" fill="#1E2A57"/>
        ${good ? "" : `<rect x="250" y="232" width="50" height="14" fill="#8d97c2"/>`}
      </g>`;
  }
  [...seg.children].forEach(b => b.addEventListener("click", () => {
    const h = b.dataset.h;
    [...seg.children].forEach(x => x.setAttribute("aria-pressed", x === b));
    out.textContent = h === "good"
      ? "Careful: a long, controlled heat, a deep freeze to finish the hardening, and two tempers; full hardness and full edge life."
      : "Rushed: a short heat and a single temper leave it around four points softer; at roughly 5–10% of edge life per point, that’s a fifth to two-fifths gone (the pale band), and badly treated samples of this steel also rusted where VG-10 didn’t.";
    clip(1400, t => frame(h, t));
  }));
  frame("good", 1400);
  seg.children[0].setAttribute("aria-pressed", "true");
  out.textContent = "Pick a furnace.";
})();

/* ---------- plate 7: the garlic smash ---------- */
(function plate7() {
  const fig = document.getElementById("p7fig"), r = document.getElementById("p7r"), v = document.getElementById("p7v"),
    go = document.getElementById("p7go"), out = document.getElementById("p7out");
  if (!fig) return;
  function frame(hrc, t) {
    const u = clamp(t / 1100), drop = u < .35 ? lerp(-30, 0, easeIn(u / .35)) : 0, hit = u >= .35;
    const snaps = hrc >= 61, after = clamp((u - .35) / .65);
    const squash = hit && !snaps ? easeOut(after) : 0;
    const crack = hit && snaps;
    const rotL = crack ? -10 * easeOut(after) : 0, rotR = crack ? 14 * easeOut(after) : 0, sep = crack ? 10 * easeOut(after) : 0;
    const blade = (x0, x1) => `<rect x="${x0}" y="${96 + drop}" width="${x1 - x0}" height="16" fill="#c5c9cd" stroke="#1B1A17" stroke-width="2"/>`;
    fig.innerHTML = `
      <rect x="0" y="150" width="360" height="24" fill="#e3dccd"/><line x1="0" y1="150" x2="360" y2="150" stroke="#1B1A17" stroke-width="2"/>
      <ellipse cx="170" cy="${(132 + 12 * squash).toFixed(1)}" rx="${(22 + 20 * squash).toFixed(1)}" ry="${(18 - 12 * squash).toFixed(1)}" fill="#f3ead0" stroke="#1B1A17" stroke-width="1.8"/>
      ${crack ? `<g transform="rotate(${rotL.toFixed(1)} 40 104) translate(${-sep} 0)">${blade(20, 172)}</g>
                 <g transform="rotate(${rotR.toFixed(1)} 300 104) translate(${sep} 0)">${blade(172, 300)}<rect x="300" y="${94 + drop}" width="44" height="20" fill="#4a2f18" stroke="#1B1A17" stroke-width="2"/></g>`
        : `${blade(20, 300)}<rect x="300" y="${94 + drop}" width="44" height="20" fill="#4a2f18" stroke="#1B1A17" stroke-width="2"/>`}
      <path d="M 158 ${42 + drop} l 0 34 m -10 -12 l 10 14 l 10 -14" fill="none" stroke="#1B1A17" stroke-width="2.5"/>
      ${T(176, 54 + drop, "SLAP", { s: 12, w: 800 })}
      ${hit ? T(20, 200, snaps ? "SNAPS" : hrc >= 59 ? "SURVIVES, JUST" : "GARLIC CRUSHED", { s: 18, w: 900, c: snaps ? "#B3261E" : "#1B1A17", ls: 0, st: "font-stretch:72%" }) : ""}`;
    if (t >= 1100) out.textContent = snaps
      ? "Too hard for a blade this thin and too little toughness to go with it: the flat of the cleaver cracks before the garlic does."
      : hrc >= 59 ? "It survives this time; a harder, thinner blade is holding a longer edge in exchange for less margin when you slap it."
      : "Softer steel flexes and comes back: the garlic loses, the cleaver doesn’t, and you’ll sharpen it a bit more often.";
  }
  r.addEventListener("input", () => { v.textContent = r.value; frame(+r.value, 0); out.textContent = ""; });
  go.addEventListener("click", () => clip(1100, t => frame(+r.value, t)));
  frame(56, 0);
})();

/* ---------- charts ---------- */
function hbar(box, rows, o) {
  if (!box) return;
  const W = Math.max(300, Math.min(520, box.clientWidth || 520)), rowH = o.rowH || 46, L = o.L || 96, R = 16;
  const H = rows.length * rowH + 30, max = o.max || Math.max(...rows.map(r => r[1]));
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": o.label }, box);
  rows.forEach(([name, val, txt, hi], i) => {
    const y = 10 + i * rowH, w = (W - L - R - 70) * val / max;
    el("text", { x: L - 10, y: y + 20, "text-anchor": "end", "font-family": "Arch,sans-serif", "font-weight": 800, "font-size": 14, fill: o.ink }, svg).textContent = name;
    el("rect", { x: L, y: y + 6, width: Math.max(2, w), height: 20, fill: hi ? o.hi : o.bar }, svg);
    el("text", { x: L + w + 8, y: y + 21, "font-family": "Arch,sans-serif", "font-weight": 700, "font-size": 14, fill: o.ink }, svg).textContent = txt;
  });
  const det = document.createElement("details"); det.className = "tbl";
  det.innerHTML = `<summary>Show as a table</summary><table>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[2]}</td></tr>`).join("")}</table>`;
  box.appendChild(det);
}
hbar(document.getElementById("expchart"), [["China", 1660, "$1.66 bn", 1], ["Germany", 292, "$292 m"], ["Japan", 167, "$167 m"]],
  { label: "Knife exports by value, 2024: China $1.66 billion, Germany $292 million, Japan $167 million", ink: "#F4EFE6", bar: "#D9D2C4", hi: "#E2B44B" });
(function oemChart() {
  const box = document.getElementById("oemchart"); if (!box) return;
  const W = Math.max(300, Math.min(520, box.clientWidth || 520)), parts = [["Made to a foreign brand’s design", 70, "#1B1A17"], ["Factory design, someone else’s name", 25, "#5C564C"], ["Its own brand", 5, "#B3261E"]];
  const svg = el("svg", { viewBox: `0 0 ${W} 150`, role: "img", "aria-label": "Yangjiang output: about 70% OEM, 25% ODM, 5% own brands" }, box);
  let x = 0;
  parts.forEach(([name, pc, c], i) => {
    const w = W * pc / 100 - (i < 2 ? 2 : 0);
    el("rect", { x, y: 20, width: w, height: 36, fill: c }, svg);
    el("text", { x: i === 2 ? W : x, y: 82 + i * 22, "text-anchor": i === 2 ? "end" : "start", "font-family": "Arch,sans-serif", "font-weight": 800, "font-size": 14, fill: "#1B1A17" }, svg)
      .textContent = `${pc}% · ${name}`;
    x += W * pc / 100;
  });
  const det = document.createElement("details"); det.className = "tbl";
  det.innerHTML = `<summary>Show as a table</summary><table>${parts.map(p => `<tr><td>${p[0]}</td><td>${p[1]}%</td></tr>`).join("")}</table>`;
  box.appendChild(det);
})();
(function steelChart() {
  const box = document.getElementById("steelchart"); if (!box) return;
  const rows = [["Carbon", .95, 1.05, 1.05, 1.5], ["Chromium", 14.5, 15.5, 15.0, 20], ["Molybdenum", .9, 1.2, 1.2, 1.6], ["Vanadium", .1, .3, .3, .5], ["Cobalt", 1.3, 1.5, 1.5, 2]];
  const W = Math.max(300, Math.min(520, box.clientWidth || 520)), L = 104, R = 40, rowH = 44;
  const svg = el("svg", { viewBox: `0 0 ${W} ${rows.length * rowH + 40}`, role: "img", "aria-label": "Composition of VG-10 (ranges) and 10Cr15CoMoV (points): every 10Cr15CoMoV value falls inside the VG-10 range" }, box);
  rows.forEach(([n, lo, hi, cn, max], i) => {
    const y = 16 + i * rowH, sx = v => L + v / max * (W - L - R);
    el("text", { x: L - 10, y: y + 15, "text-anchor": "end", "font-family": "Arch,sans-serif", "font-weight": 800, "font-size": 13, fill: "#F4EFE6" }, svg).textContent = n;
    el("line", { x1: L, x2: W - R, y1: y + 10, y2: y + 10, stroke: "rgba(244,239,230,.3)" }, svg);
    el("rect", { x: sx(lo), y: y + 2, width: Math.max(4, sx(hi) - sx(lo)), height: 16, fill: "#8d97c2" }, svg);
    el("circle", { cx: sx(cn), cy: y + 10, r: 6, fill: "#E2B44B", stroke: "#33383D", "stroke-width": 2 }, svg);
    el("text", { x: W - R + 6, y: y + 15, "font-family": "Arch,sans-serif", "font-size": 12, fill: "#D9D2C4" }, svg).textContent = cn + "%";
  });
  const ly = rows.length * rowH + 26;
  el("rect", { x: L, y: ly - 10, width: 18, height: 12, fill: "#8d97c2" }, svg);
  el("text", { x: L + 24, y: ly, "font-family": "Arch,sans-serif", "font-size": 12, fill: "#F4EFE6" }, svg).textContent = "VG-10 range";
  el("circle", { cx: L + 140, cy: ly - 4, r: 6, fill: "#E2B44B" }, svg);
  el("text", { x: L + 152, y: ly, "font-family": "Arch,sans-serif", "font-size": 12, fill: "#F4EFE6" }, svg).textContent = "10Cr15CoMoV";
  const det = document.createElement("details"); det.className = "tbl"; det.style.color = "#F4EFE6";
  det.innerHTML = `<summary style="color:#D9D2C4">Show as a table</summary><table><tr><th>Element</th><th>VG-10</th><th>10Cr15CoMoV</th></tr>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}–${r[2]}%</td><td>${r[3]}%</td></tr>`).join("")}</table>`;
  box.appendChild(det);
})();

/* ---------- the scorecard ---------- */
(function score() {
  const list = document.getElementById("checks"), out = document.getElementById("scoreout");
  if (!list) return;
  const bs = [...list.querySelectorAll("button")];
  const upd = () => {
    const n = bs.filter(b => b.getAttribute("aria-pressed") === "true").length;
    out.textContent = `Tick what your knife has: ${n} of 5.` + (n === 5 ? " A good knife, wherever it was made." : n === 0 ? "" : " The flag on the box doesn’t move this number.");
  };
  bs.forEach(b => b.addEventListener("click", () => { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); upd(); }));
})();

/* ---------- 11: the label decoder ---------- */
(function decoder() {
  const svg = document.getElementById("decoder"), box = document.getElementById("phrases"), out = document.getElementById("decout");
  if (!svg) return;
  const P = [
    ["SOLINGEN", "Protected by law", "German law since 1938, now the decree of 1994: every essential stage was done in Solingen or neighbouring Haan."],
    ["SHEFFIELD", "Protected", "A certification mark held by the Company of Cutlers in Hallamshire: the major processes were done in the Hallamshire district."],
    ["日本製 · MADE IN JAPAN", "Means it", "The forging, hardening and grinding that make it a knife happened in Japan."],
    ["GERMAN STEEL", "Says little", "Where the raw steel came from; the knife itself can be cut, hardened and ground anywhere, Yangjiang included."],
    ["DESIGNED IN GERMANY", "Says little", "Where somebody drew it; nothing at all about where it was made."],
    ["JAPANESE STEEL CORE", "Says little", "The core steel came from a Japanese mill; the blanking, heat treatment and grinding can happen anywhere."],
    ["MADE IN CHINA", "Means it", "Under US rules it’s marked with the country of its last substantial transformation: it was made, or at least finished, in China."]
  ];
  const defs = `<defs><filter id="dr"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="11"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter></defs>`;
  const blank = `${defs}<path d="M 10 40 L 290 40 L 290 110 L 60 110 Q 22 104 10 80 Z" fill="#c5c9cd" stroke="#F4EFE6" stroke-width="2"/>
    <rect x="290" y="56" width="66" height="34" fill="#4a2f18" stroke="#F4EFE6" stroke-width="2"/>`;
  svg.innerHTML = blank;
  P.forEach(([txt, tag, say], i) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = txt; b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      [...box.children].forEach(x => x.setAttribute("aria-pressed", x === b));
      const han = /[⺀-鿿]/.test(txt), size = txt.length > 16 ? 15 : 19;
      const draw = t => {
        const u = clamp(t / 260), k = 1.25 - .25 * easeOut(u);
        svg.innerHTML = blank + `<g filter="url(#dr)" style="opacity:${u.toFixed(2)}" transform="translate(150 78) scale(${k.toFixed(3)}) translate(-150 -78)">
          <text x="150" y="84" text-anchor="middle" font-family="${han ? "Han,Arch" : "Arch"},sans-serif" font-weight="900" font-size="${size}" style="font-stretch:75%;letter-spacing:.08em" fill="#1B1A17">${txt}</text></g>
          <text x="150" y="138" text-anchor="middle" font-family="Arch,sans-serif" font-weight="800" font-size="12" letter-spacing="2" fill="${tag === "Says little" ? "#E2B44B" : "#F4EFE6"}">${tag.toUpperCase()}</text>`;
      };
      clip(260, draw);
      out.textContent = say;
    });
    box.appendChild(b);
  });
})();

/* ---------- the loop: scroll drives everything ---------- */
let ticking = false;
function frame() {
  ticking = false;
  renderScenes();
  setBelt(currentChapter().dataset.belt);
}
function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  scenes.forEach(S => S.strikes.forEach(s => s.fit()));
  frame();
});
frame();
})();
