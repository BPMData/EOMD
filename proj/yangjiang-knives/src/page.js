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

/* ---------- scenes: progress through a tall box with a sticky stage ---------- */
const scenes = [...document.querySelectorAll(".scene")].map(sc => ({
  sc,
  strikes: [...sc.querySelectorAll("svg.strike")].map(buildStrike),
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
    for (const { n, at } of S.reveals) {
      const v = at < 0 ? 1 - smooth(0, .12, p) : smooth(at, at + .07, p);
      n.style.opacity = v.toFixed(3);
      n.style.transform = `translateY(${((1 - v) * 14).toFixed(1)}px)`;
    }
  }
}

/* ---------- the belt ---------- */
const BELT = {
  sheffield: { a: "SHEFFIELD", b: "ENGLAND", line: "Holds the title on crucible steel and the Cutlers’ marks, from the 1700s." },
  solingen: { a: "SOLINGEN", b: "GERMANY", line: "Takes it in the late 1800s, on price, machines and a label meant to shame it." }
};
const beltBtn = document.getElementById("belt");
const beltSvg = beltBtn.querySelector("svg");
const reached = [];
let beltState = "none", beltTimer = 0;
function drawBelt(key) {
  const d = BELT[key];
  beltSvg.innerHTML = `
    <rect x="0" y="40" width="236" height="40" fill="#4a2f18"/>
    <rect x="0" y="45" width="236" height="30" fill="none" stroke="#c9a463" stroke-width="1.2" stroke-dasharray="4 3"/>
    <rect x="18" y="34" width="34" height="52" fill="#c99a3b"/><rect x="184" y="34" width="34" height="52" fill="#c99a3b"/>
    <rect x="62" y="6" width="112" height="108" fill="#E2B44B"/>
    <rect x="70" y="14" width="96" height="92" fill="none" stroke="#7a5a16" stroke-width="2"/>
    <text x="118" y="38" text-anchor="middle" font-family="Arch,sans-serif" font-weight="800" font-size="9" letter-spacing="1.5" fill="#4a3608">KNIFE CHAMPION</text>
    <text x="118" y="68" text-anchor="middle" font-family="Arch,sans-serif" font-weight="900" font-size="${d.a.length > 8 ? 17 : 20}" style="font-stretch:70%" fill="#2e2104">${d.a}</text>
    <text x="118" y="88" text-anchor="middle" font-family="Arch,sans-serif" font-weight="700" font-size="10" letter-spacing="2" fill="#4a3608">${d.b}</text>`;
}
function setBelt(key) {
  if (key === beltState) return;
  beltState = key;
  clearTimeout(beltTimer);
  if (BELT[key] && !reached.includes(key)) reached.push(key);
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
  list.innerHTML = reached.map(k => `<li><b>${BELT[k].a}</b><span>${BELT[k].line}</span></li>`).join("");
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
