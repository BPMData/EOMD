/* blocks.js: MakeCode-style blocks on Canvas. A port of the geometry in Bryan's MakeCode/makecode_blocks.py
   (measured from real MakeCode; see MakeCode/makecode-svg-blocks-technique.md, kept local): same numbers, same shared
   notch/tab shape, stacked by height only, drawn bottom-up so every tab lands on the notch below.
   Units are MakeCode screenshot pixels at ~2x zoom; draw with a scale (the film uses 1.8 for 34-px text at 1080p). */
(function (G) {
  'use strict';
  const DHS = (G.DHS = G.DHS || {});
  const K = { H_MIN: 56, R: 4, TAB_OFF: 15, TAB_SLOPE: 9, TAB_FLAT: 20, TAB_DEPTH: 9, BAR: 20, FOOT_H: 36, HAT_FOOT_H: 37, HAT_MIN_W: 190,
    MOUTH_EMPTY: 46, PAD_X: 10, GAP: 11, STROKE_W: 1.5, FS: 19, CW: 11.4, DD_H: 42, SLOT_H: 36, SLOT_MIN_W: 47, REP_H: 48, HEX_H: 57, FIELD_R: 7 };
  K.TAB_W = K.TAB_SLOPE * 2 + K.TAB_FLAT;
  const COL = { BASIC: '#458ef7', INPUT: '#c229cd', VAR: '#ca3142', RADIO: '#d02c89', LOGIC: '#49a2a5', MATH: '#8d25ce', LOOPS: '#4ca730', PYTHON: '#717171' };
  const SLOT_TEXT = '#575e75', SELECT = '#fdf251';
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const dark = (h, k = 0.75) => hex(rgb(h).map((v) => v * k));
  const light = (h, t = 0.35) => hex(rgb(h).map((v) => v + (255 - v) * t));

  // parts: a plain string = label; D(text) dropdown; N(text) number slot; S(text) string slot; or a nested block
  const D = (text, border = true) => ({ k: 'D', text: String(text), border });
  const N = (text) => ({ k: 'N', text: String(text) });
  const S = (text) => ({ k: 'S', text: String(text) });
  const mk = (kind) => (color, ...parts) => {
    let o = {}; if (parts.length && parts[parts.length - 1] && parts[parts.length - 1].opts) o = parts.pop().opts;
    return { kind, color, parts, stack: o.stack || [], top: o.top ?? (kind === 'stmt' || kind === 'c'), bottom: o.bottom ?? (kind === 'stmt' || kind === 'c'), selected: !!o.selected, k: 'B' };
  };
  const stmt = mk('stmt'), hat = mk('hat'), cblock = mk('c'), rep = mk('rep'), bool = mk('bool');
  const opts = (o) => ({ opts: o });

  // ---- measuring (identical rules to the Python)
  const tw = (s) => s.length * K.CW;
  const partWH = (p) => {
    if (typeof p === 'string') return [tw(p), 0];
    if (p.k === 'D') return [tw(p.text) + (p.border ? 44 : 26), K.DD_H];
    if (p.k === 'N' || p.k === 'S') return [Math.max(K.SLOT_MIN_W, tw(p.text) + 27), K.SLOT_H];
    if (p.k === 'B') { lay(p); return [p.L.w, p.L.h]; }
    return [0, 0];
  };
  const vpad = (p, ctx) => {
    if (typeof p === 'string') return 0;
    const t = { stmt: { D: 18, N: 20, S: 20, B: 9 }, rep: { D: 6, N: 12, S: 12, B: 9 }, bool: { D: 15, N: 21, S: 21, B: 9 } }[ctx === 'hat' || ctx === 'c' ? 'stmt' : ctx];
    return t[p.k];
  };
  const rowWH = (parts, ctx) => { const ws = [], hs = []; for (const p of parts) { const [w, h] = partWH(p); ws.push(w); hs.push(h + vpad(p, ctx)); }
    return [ws.reduce((a, b) => a + b, 0) + K.GAP * Math.max(0, ws.length - 1), Math.max(0, ...hs), ws]; };
  const hOf = (b) => { lay(b); return b.L.h; };
  function lay(b) {
    if (b.L) return;
    if (b.kind === 'rep' || b.kind === 'bool') {
      const [inner, ph, ws] = rowWH(b.parts, b.kind);
      if (b.kind === 'rep') { const h = Math.max(K.REP_H, ph), pl = b.parts[0] && b.parts[0].k === 'B' ? 6 : 12, pr = b.parts[b.parts.length - 1] && b.parts[b.parts.length - 1].k === 'B' ? 6 : 12; b.L = { w: pl + inner + pr, h, pl, ws }; }
      else { const h = Math.max(K.HEX_H, ph); b.L = { w: h + inner, h, pl: h / 2, ws }; }
      return;
    }
    const [inner, ph, ws] = rowWH(b.parts, b.kind), hh = Math.max(K.H_MIN, ph);
    const mh = (b.kind === 'hat' || b.kind === 'c') ? (b.stack.reduce((a, k) => a + hOf(k), 0) || K.MOUTH_EMPTY) : 0;
    let w = inner + 2 * K.PAD_X; if (b.kind === 'hat') w = Math.max(w, K.HAT_MIN_W);
    const foot = b.kind === 'c' ? K.FOOT_H : b.kind === 'hat' ? K.HAT_FOOT_H : 0;
    b.L = { w, h: hh + mh + foot, bar: K.BAR, hh, mh, ws, foot };
  }

  // ---- the shared tab shape (female notch walking east on a top edge; male tab walking west on a bottom edge)
  const f = (v) => +v.toFixed(2);
  const tabE = (x0 = 0) => `H${f(x0 + K.TAB_OFF)} l${K.TAB_SLOPE},${K.TAB_DEPTH} h${K.TAB_FLAT} l${K.TAB_SLOPE},${-K.TAB_DEPTH}`;
  const tabW = (x0 = 0) => `H${f(x0 + K.TAB_OFF + K.TAB_W)} l${-K.TAB_SLOPE},${K.TAB_DEPTH} h${-K.TAB_FLAT} l${-K.TAB_SLOPE},${-K.TAB_DEPTH}`;
  const R = K.R;
  function shapePath(b) {
    const { w, hh, mh, foot } = b.L;
    let d = `M${R},0 ` + (b.top ? tabE() + ' ' : '') + `H${f(w - R)} a${R},${R} 0 0 1 ${R},${R} `;
    if (b.kind === 'hat' || b.kind === 'c') d += `V${f(hh - R)} a${R},${R} 0 0 1 ${-R},${R} ` + tabW(K.BAR) + ` H${f(K.BAR + R)} a${R},${R} 0 0 0 ${-R},${R} V${f(hh + mh - R)} a${R},${R} 0 0 0 ${R},${R} H${f(w - R)} a${R},${R} 0 0 1 ${R},${R} `;
    const total = hh + mh + foot;
    d += `V${f(total - R)} a${R},${R} 0 0 1 ${-R},${R} ` + (b.bottom ? tabW() + ' ' : '') + `H${R} a${R},${R} 0 0 1 ${-R},${-R} V${R} a${R},${R} 0 0 1 ${R},${-R} Z`;
    return new Path2D(d);
  }

  // ---- drawing
  function text(ctx, x, cy, s, fill = '#fff') {
    if (!s) return; ctx.save(); ctx.fillStyle = fill; ctx.font = `500 ${K.FS}px ${DHS.type.MONO}`; ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(s).width || 1; ctx.translate(x, cy + K.FS * 0.35); ctx.scale(tw(s) / m, 1); ctx.fillText(s, 0, 0); ctx.restore();
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function drawPart(ctx, p, x, cy, color) {
    if (typeof p === 'string') return text(ctx, x, cy, p);
    const [w, h] = partWH(p);
    if (p.k === 'D') {
      if (p.border) { rr(ctx, x, cy - K.DD_H / 2, w, K.DD_H, K.FIELD_R); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = dark(color); ctx.lineWidth = K.STROKE_W; ctx.stroke(); }
      const tx = x + (p.border ? 12 : 3); text(ctx, tx, cy, p.text);
      const ax = tx + tw(p.text) + 8; ctx.beginPath(); ctx.moveTo(ax, cy - 3); ctx.lineTo(ax + 12, cy - 3); ctx.lineTo(ax + 6, cy + 4); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); return;
    }
    if (p.k === 'N' || p.k === 'S') { rr(ctx, x, cy - h / 2, w, h, p.k === 'N' ? h / 2 : 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = dark(color); ctx.lineWidth = K.STROKE_W; ctx.stroke();
      return text(ctx, x + (w - tw(p.text)) / 2, cy, p.text, SLOT_TEXT); }
    if (p.k === 'B') return drawBlock(ctx, p, x, cy - p.L.h / 2, color);
  }
  function drawRow(ctx, parts, ws, x0, cy, color) { let x = x0; parts.forEach((p, i) => { drawPart(ctx, p, x, cy, color); x += ws[i] + K.GAP; }); }
  // draws block b with its top-left at (x, y) in block units; returns nothing
  function drawBlock(ctx, b, x, y, nestedIn = null) {
    lay(b); const L = b.L, col = b.color, stroke = nestedIn === col ? light(col) : dark(col);
    ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round';
    if (b.kind === 'rep') { rr(ctx, 0, 0, L.w, L.h, L.h / 2); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = K.STROKE_W; ctx.stroke(); drawRow(ctx, b.parts, L.ws, L.pl, L.h / 2, col); }
    else if (b.kind === 'bool') { const k = L.h / 2; ctx.beginPath(); ctx.moveTo(0, k); ctx.lineTo(k, 0); ctx.lineTo(L.w - k, 0); ctx.lineTo(L.w, k); ctx.lineTo(L.w - k, L.h); ctx.lineTo(k, L.h); ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = K.STROKE_W; ctx.stroke(); drawRow(ctx, b.parts, L.ws, k, L.h / 2, col); }
    else {
      const path = shapePath(b); ctx.fillStyle = col; ctx.fill(path); ctx.strokeStyle = stroke; ctx.lineWidth = K.STROKE_W; ctx.stroke(path);
      drawRow(ctx, b.parts, L.ws, K.PAD_X, L.hh / 2, col);
      if (b.kind === 'hat' || b.kind === 'c') { let yy = L.hh; const kids = b.stack.map((k) => { const r = [k, yy]; yy += hOf(k); return r; });
        for (let i = kids.length - 1; i >= 0; i--) drawBlock(ctx, kids[i][0], L.bar, kids[i][1]); }
      if (b.selected) { ctx.strokeStyle = SELECT; ctx.lineWidth = 4; ctx.stroke(path); }
    }
    ctx.restore();
  }
  // a locked stack of blocks (top-left at x, y in frame px; s = scale); bottom-up so tabs land on top
  function drawStack(ctx, blocks, x, y, s = 1.8) {
    const ys = []; let yy = 0; for (const b of blocks) { ys.push(yy); yy += hOf(b); }
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (let i = blocks.length - 1; i >= 0; i--) drawBlock(ctx, blocks[i], 0, ys[i]);
    ctx.restore();
  }
  const size = (b) => { lay(b); return [b.L.w, b.L.h]; };
  DHS.blocks = { K, COL, D, N, S, stmt, hat, cblock, rep, bool, opts, drawBlock, drawStack, size, hOf };
})(globalThis);
