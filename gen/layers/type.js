/* layer "type": kinetic typography driven by a timed script (a music video for spoken word).
   A script is a list of cues: { t, dur?, text, fx, color?, bg?, size?, x?, y?, words? }.
   Write it in the plain-text format (one cue per line, parsed by GEN.typeScript.parse):

     @12.40~13.10 ORANGE | shout orange bg=black
     @13.10 is the loudest color | line
     THE/COLOR/OF/NOISE | stack yellow          (no time = 1.5 s after the previous cue; tap-time it later)

   Tokens after "|": an effect (or a delivery word that maps to one: shout, whisper, drawn, fast ...),
   a color (#hex or a name: red, orange, ochre ...), bg=<color|none> (floods the screen), size=1.4,
   pos=x,y (-1..1), dur=2, words=0,0.3,0.7 (per-word start offsets for "line"), caps / lower.
   Whisper word-timestamp JSON imports straight into this format (GEN.typeScript.fromWhisper).
   Pure function of time: seek anywhere and it looks the same. */
(function (G) {
  'use strict';
  const C = G.core, TAU = C.TAU;

  // ---------- script format ----------
  const FX = ['slam', 'whisper', 'stretch', 'cascade', 'scatter', 'type', 'wave', 'spin', 'zoom', 'stack', 'orbit', 'shake', 'line', 'outline', 'drip'];
  const ALIAS = {
    shout: 'slam', loud: 'slam', punch: 'slam', yell: 'slam', hit: 'slam',
    soft: 'whisper', quiet: 'whisper', hush: 'whisper', breathy: 'whisper', murmur: 'whisper',
    long: 'stretch', drawn: 'stretch', slow: 'stretch', held: 'stretch', drawl: 'stretch',
    tumble: 'cascade', fall: 'cascade', rain: 'cascade',
    burst: 'scatter', explode: 'scatter', pop: 'scatter',
    typewriter: 'type', flat: 'type', deadpan: 'type', dry: 'type',
    sing: 'wave', lilt: 'wave', float: 'wave', sway: 'wave', smooth: 'wave',
    flip: 'spin', turn: 'spin',
    rush: 'zoom', fly: 'zoom', fast: 'zoom', quick: 'zoom',
    block: 'stack', list: 'stack',
    circle: 'orbit', swirl: 'orbit', dizzy: 'orbit', round: 'orbit',
    tremble: 'shake', nervous: 'shake', shiver: 'shake', jitter: 'shake', cold: 'shake',
    phrase: 'line', say: 'line', speak: 'line', read: 'line', plain: 'line',
    ghost: 'outline', echo: 'outline', hollow: 'outline',
    melt: 'drip', sink: 'drip', sad: 'drip', droop: 'drip', heavy: 'drip',
  };
  const COLORS = {
    red: '#e8322b', orange: '#ff7a1a', yellow: '#ffd100', green: '#2fbf5b', blue: '#2d5bff', purple: '#8a3ffc',
    violet: '#7f3fbf', magenta: '#e0218a', pink: '#ff8fb8', brown: '#7a4a2a', beige: '#e8d8b8', black: '#0b0b0d',
    white: '#f5f2ea', gray: '#8a8a90', grey: '#8a8a90', gold: '#d4a017', silver: '#c0c4c8', maroon: '#6e1423',
    olive: '#7c8a2a', turquoise: '#2ec4b6', lavender: '#b9a6ff', amber: '#ffbf00', chartreuse: '#a6e22e',
    crimson: '#c1121f', azure: '#2e9cff', cream: '#f3ead3', coral: '#ff6f61', indigo: '#3a2fb3', ochre: '#cc7722',
    teal: '#1f8a8a', rust: '#b7410e', burgundy: '#800020', lime: '#b5e61d', mauve: '#b784a7', sepia: '#704214',
    flamingo: '#fc8eac', khaki: '#c3b091', tan: '#d2b48c', navy: '#1b2a6b', cyan: '#19d3f3', scarlet: '#ff2400',
  };
  const colorOf = (s) => (s == null ? null : /^#[0-9a-f]{3,6}$/i.test(s) ? s : COLORS[String(s).toLowerCase()] || null);

  const TS = G.typeScript = { FX, ALIAS, COLORS, colorOf };

  TS.parse = function (text) {
    const cues = []; let prevEnd = 0;
    for (let line of String(text || '').split(/\r?\n/)) {
      line = line.replace(/\s\/\/.*$/, '').replace(/^\/\/.*$/, '').trim();
      if (!line) continue;
      const bar = line.indexOf('|');
      let head = (bar < 0 ? line : line.slice(0, bar)).trim();
      const tail = bar < 0 ? '' : line.slice(bar + 1);
      const cue = {};
      const tm = head.match(/^@\s*([\d.]+)(?:\s*~\s*([\d.]+))?\s*/);
      if (tm) { cue.t = +tm[1]; if (tm[2]) cue.dur = Math.max(0.05, +tm[2] - cue.t); head = head.slice(tm[0].length); }
      else cue.t = +(prevEnd).toFixed(2);
      cue.text = head;
      for (const tok of tail.split(/[\s|]+/).filter(Boolean)) {
        const lo = tok.toLowerCase();
        const kv = lo.match(/^(\w+)=(.*)$/);
        if (kv) {
          const k = kv[1], v = tok.slice(k.length + 1);
          if (k === 'bg') cue.bg = v.toLowerCase() === 'none' ? 'none' : colorOf(v) || cue.bg;
          else if (k === 'color' || k === 'ink') cue.color = colorOf(v) || cue.color;
          else if (k === 'size') cue.size = +v || 1;
          else if (k === 'dur') cue.dur = Math.max(0.05, +v || 1);
          else if (k === 'pos') { const p = v.split(',').map(Number); cue.x = p[0] || 0; cue.y = p[1] || 0; }
          else if (k === 'words') cue.words = v.split(',').map(Number).filter((n) => Number.isFinite(n));
          else if (k === 'fx') cue.fx = ALIAS[v.toLowerCase()] || (FX.includes(v.toLowerCase()) ? v.toLowerCase() : cue.fx);
        } else if (FX.includes(lo)) cue.fx = lo;
        else if (ALIAS[lo]) cue.fx = ALIAS[lo];
        else if (lo === 'caps' || lo === 'lower') cue.caseMode = lo;
        else if (colorOf(tok)) cue.color = colorOf(tok);
      }
      cues.push(cue);
      prevEnd = cue.t + (cue.dur || 1.5);
    }
    return cues;
  };

  const f2 = (n) => (Math.round(n * 100) / 100).toString();
  TS.format = function (cues) {
    const nameOf = (hex) => { for (const k in COLORS) if (COLORS[k] === hex) return k; return hex; };
    return (cues || []).map((c) => {
      let s = '@' + f2(c.t || 0) + (c.dur ? '~' + f2((c.t || 0) + c.dur) : '') + ' ' + (c.text || '');
      const tk = [];
      if (c.fx) tk.push(c.fx);
      if (c.color) tk.push(nameOf(c.color));
      if (c.bg) tk.push('bg=' + (c.bg === 'none' ? 'none' : nameOf(c.bg)));
      if (c.size && c.size !== 1) tk.push('size=' + f2(c.size));
      if (c.x || c.y) tk.push('pos=' + f2(c.x || 0) + ',' + f2(c.y || 0));
      if (c.caseMode) tk.push(c.caseMode);
      if (c.words && c.words.length) tk.push('words=' + c.words.map(f2).join(','));
      return tk.length ? s + ' | ' + tk.join(' ') : s;
    }).join('\n');
  };

  // Whisper / WhisperX / faster-whisper JSON (segments[].words[] with word/start/end), a flat word list,
  // or segments without words. mode 'phrases' groups words at pauses; 'words' = one cue per word.
  TS.fromWhisper = function (json, opt) {
    opt = Object.assign({ mode: 'phrases', gap: 0.35, maxWords: 6 }, opt);
    let words = [];
    const take = (w) => {
      const text = String(w.word != null ? w.word : w.text != null ? w.text : '').trim();
      const s = +(w.start != null ? w.start : w.from), e = +(w.end != null ? w.end : w.to);
      if (text && Number.isFinite(s)) words.push({ text, s, e: Number.isFinite(e) ? e : s + 0.3 });
    };
    if (Array.isArray(json)) json.forEach(take);
    else if (json && Array.isArray(json.word_segments)) json.word_segments.forEach(take);
    else if (json && Array.isArray(json.words)) json.words.forEach(take);
    else if (json && Array.isArray(json.segments)) {
      for (const seg of json.segments) {
        if (Array.isArray(seg.words) && seg.words.length) seg.words.forEach(take);
        else take({ text: seg.text, start: seg.start, end: seg.end });
      }
    }
    words.sort((a, b) => a.s - b.s);
    if (!words.length) return [];
    if (opt.mode === 'words') {
      return words.map((w, i) => ({ t: +w.s.toFixed(2), dur: +Math.max(0.2, (words[i + 1] ? Math.min(words[i + 1].s, w.e + 0.6) : w.e + 0.8) - w.s).toFixed(2), text: w.text.replace(/^[^\w']+|[^\w'!?]+$/g, '') || w.text, fx: 'slam' }));
    }
    const cues = []; let cur = null;
    for (let i = 0; i < words.length; i++) {
      const w = words[i], prev = words[i - 1];
      const brk = !cur || (prev && w.s - prev.e > opt.gap) || cur.ws.length >= opt.maxWords || (prev && /[.!?;:]$/.test(prev.text));
      if (brk) { cur = { ws: [] }; cues.push(cur); }
      cur.ws.push(w);
    }
    return cues.map((c, i) => {
      const t = c.ws[0].s, last = c.ws[c.ws.length - 1], next = cues[i + 1];
      const end = next ? Math.min(next.ws[0].s, last.e + 0.8) : last.e + 1.2;
      return { t: +t.toFixed(2), dur: +Math.max(0.3, end - t).toFixed(2), text: c.ws.map((w) => w.text).join(' '), fx: 'line',
               words: c.ws.map((w) => +(w.s - t).toFixed(2)) };
    });
  };

  // relative luminance, for picking a readable text color over a flood
  const lum = (hex) => { const c = C.rgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.04045) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

  // ---------- the layer ----------
  G.layers.type = {
    about: 'Kinetic typography from a timed script: 15 effects named like delivery directions, color floods, Whisper import.',
    knobs: {
      script: [],
      font: 'GenDisplay, "Arial Black", "Helvetica Neue", Impact, sans-serif',
      weight: [800, 100, 900, 100],
      size: [0.26, 0.05, 0.6, 0.01],
      maxw: [0.88, 0.3, 1, 0.01],
      tracking: [0.02, -0.1, 0.4, 0.01],
      caps: [1, 0, 1, 1],
      fx: { options: FX, value: 'slam' },
      exit: [0.3, 0.05, 1.5, 0.05],
      flood: { options: ['iris', 'wipe', 'fade'], value: 'iris' },
      floodTime: [0.45, 0.15, 2, 0.05],
      backdrop: [1, 0, 1, 1],
      karaoke: [1, 0, 1, 1],
      pulse: [0.3, 0, 1, 0.01],
      trail: [0, 0, 0.9, 0.01],
      seed: [0, 0, 999, 1],
    },
    // plain-English explanation of each knob, shown under it in the KNOBS panel (common ones: GEN.knobHelp)
    help: {
      script: "The words and their timing. Edit them in the SCRIPT box below.",
      font: "Font for the words. Set DISPLAY_FONT in build.py to make sure every computer has it.",
      weight: "How bold the letters are.",
      size: "Base word size. Long words are shrunk to fit the screen anyway.",
      maxw: "The widest a line may get, as a share of the screen width.",
      tracking: "Space between letters.",
      caps: "On = ALL CAPS. A line's \"lower\" direction overrides it.",
      fx: "The effect for script lines that don't name one.",
      exit: "Seconds each line takes to leave the screen.",
      flood: "How a bg= color fills the screen: iris (a circle growing from the word), wipe, or fade.",
      floodTime: "Seconds a color flood takes. Kept slow enough that it can never flash.",
      backdrop: "On = solid background. Off = transparent, for text over another layer in a stack.",
      karaoke: "In phrase lines, the word being said lights up in the accent color.",
    },
    init(P, E) {
      const raw = Array.isArray(P.script) ? P.script : typeof P.script === 'string' ? TS.parse(P.script) : [];
      const cues = raw.map((c, i) => Object.assign({}, c, { i, t: +c.t || 0 })).sort((a, b) => a.t - b.t);
      cues.forEach((c, k) => {
        const nx = cues[k + 1];
        c.dur = c.dur || Math.max(0.25, Math.min(8, nx ? nx.t - c.t : 3));
        c.fx = c.fx || P.fx;
      });
      const floods = cues.filter((c) => c.bg);
      return { P, cues, floods, lay: new Map(), now: -1 };
    },

    frame(ctx, S, t, dt, E) {
      const P = S.P, pal = E.pal;
      // background: base color plus the latest flood(s), a pure function of t
      const bgAt = (tt) => { let b = P.backdrop ? pal.bg : 'none'; for (const f of S.floods) if (f.t <= tt) b = f.bg; else break; return b; };
      // flood: the latest bg cue washes in over whatever was there before it
      const base = P.backdrop ? pal.bg : 'none';
      let last = null, before = base;
      for (const f of S.floods) { if (f.t > t) break; before = last ? last.bg : base; last = f; }
      const paint = (col, alpha) => {
        if (col === 'none') { if (alpha >= 1) ctx.clearRect(0, 0, E.w, E.h); return; }
        ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.fillRect(0, 0, E.w, E.h); ctx.globalAlpha = 1;
      };
      const keep = P.trail > 0 ? 1 - Math.pow(P.trail, dt * 60) : 1;     // trail: old frames fade instead of clearing
      ctx.save();
      paint(last ? before : base, keep);
      if (last) {
        const p = C.inOut((t - last.t) / P.floodTime);
        if (p > 0) {
          const ax = E.cx + (last.x || 0) * E.w * 0.4, ay = E.cy + (last.y || 0) * E.h * 0.4;
          ctx.beginPath();
          if (P.flood === 'wipe') ctx.rect(0, 0, E.w * p, E.h);
          else if (P.flood === 'fade') ctx.rect(0, 0, E.w, E.h);
          else ctx.arc(ax, ay, Math.max(0.1, p * Math.hypot(E.w, E.h)), 0, TAU);
          ctx.globalAlpha = P.flood === 'fade' ? p * keep : keep;
          if (last.bg === 'none') { ctx.globalCompositeOperation = 'destination-out'; ctx.fill(); }
          else { ctx.fillStyle = last.bg; ctx.fill(); }
        }
      }
      ctx.restore();

      // cues on screen now (entering, holding or leaving)
      const beat = E.beat().pulse;
      S.now = -1;
      for (const c of S.cues) {
        const lt = t - c.t;
        if (lt < -0.05 || lt > c.dur + P.exit) continue;
        if (lt >= 0 && lt <= c.dur) S.now = c.i;
        const L = this.layout(ctx, S, c, P, E);
        const bgNow = bgAt(t);
        const ink = c.color || (bgNow === 'none' ? pal.ink : (contrast(pal.ink, bgNow) >= contrast(pal.bg, bgNow) ? pal.ink : pal.bg));
        const ex = C.clamp((lt - c.dur) / P.exit);
        const env = { ctx, c, L, lt, D: c.dur, ex, ink, accent: pal.accent, E, P, beat,
                      ax: E.cx + (c.x || 0) * E.w * 0.4, ay: E.cy + (c.y || 0) * E.h * 0.4,
                      r: (i, k) => C.hash(c.i * 131 + i, k, 77, E.seed) };
        ctx.save();
        ctx.font = P.weight + ' ' + L.px + 'px ' + P.font;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        (FXDRAW[c.fx] || FXDRAW.slam)(env);
        ctx.restore();
      }
    },

    // measure once per cue (per size): letters with x offsets, lines for stack/line/orbit
    layout(ctx, S, c, P, E) {
      const key = c.i + ':' + E.w + 'x' + E.h;
      let L = S.lay.get(key);
      if (L) return L;
      const caps = c.caseMode ? c.caseMode === 'caps' : !!P.caps;
      let text = String(c.text || ''); if (caps) text = text.toUpperCase();
      const base = P.size * E.h * (c.size || 1), maxW = P.maxw * E.w, tr = P.tracking;
      const font = (px) => P.weight + ' ' + px + 'px ' + P.font;
      ctx.save();
      const measure = (str, px) => { ctx.font = font(px); const ws = []; let w = 0; for (const ch of str) { const cw = ctx.measureText(ch).width; ws.push(cw); w += cw + tr * px; } return { ws, w: Math.max(1, w - tr * px) }; };
      const place = (str, px, y, line) => {
        const m = measure(str, px), out = []; let x = -m.w / 2, k = 0, word = 0;
        for (const ch of str) { if (ch === ' ') word++; out.push({ ch, x: x + m.ws[k] / 2, w: m.ws[k], y, line, word, px }); x += m.ws[k] + tr * px; k++; }
        return { letters: out, w: m.w };
      };
      L = { letters: [], lines: [], px: base };
      if (c.fx === 'stack') {
        const lines = text.split('/').map((s) => s.trim()).filter(Boolean);
        const W = maxW * 0.82, pxs = lines.map((s) => Math.min(base * 1.7, W * 100 / measure(s, 100).w));
        let H = pxs.reduce((a, b) => a + b * 0.9, 0); const k = H > E.h * 0.64 ? E.h * 0.64 / H : 1;
        let y = -H * k / 2;
        lines.forEach((s, j) => { const px = pxs[j] * k; y += px * 0.45; const pl = place(s, px, y, j); L.letters.push(...pl.letters); L.lines.push({ px, y, w: pl.w }); y += px * 0.45; });
        L.px = 100;                                       // per-letter px is used instead
      } else if (c.fx === 'line') {
        let px = base * 0.42, rows;
        for (let tries = 0; tries < 8; tries++) {
          rows = []; let cur = '';
          for (const w of text.split(/\s+/)) { const tst = cur ? cur + ' ' + w : w; if (cur && measure(tst, px).w > maxW) { rows.push(cur); cur = w; } else cur = tst; }
          if (cur) rows.push(cur);
          if (rows.length <= 3) break; px *= 0.85;
        }
        let word0 = 0;
        rows.forEach((s, j) => { const y = (j - (rows.length - 1) / 2) * px * 1.15; const pl = place(s, px, y, j); pl.letters.forEach((l) => { l.word += word0; }); word0 = pl.letters.length ? pl.letters[pl.letters.length - 1].word + 1 : word0; L.letters.push(...pl.letters); L.lines.push({ px, y, w: pl.w }); });
        L.px = px; L.nwords = word0;
      } else if (c.fx === 'orbit') {
        const R = E.h * 0.3, m = measure(text + '   ', 100);
        const px = Math.min(base * 0.55, 0.92 * TAU * R * 100 / m.w), mm = measure(text + '   ', px);
        let a = 0; const out = []; let k = 0;
        for (const ch of text + '   ') { const ang = (a + mm.ws[k] / 2) / R; out.push({ ch, ang, w: mm.ws[k], px, y: 0, x: 0, line: 0, word: 0 }); a += mm.ws[k] + tr * px; k++; }
        L.letters = out; L.px = px; L.R = R; L.span = a / R;
      } else {
        const extra = c.fx === 'stretch' ? 0.55 : 0, sx = c.fx === 'stretch' ? 1.15 : 1;
        const m = measure(text, 100), fit = maxW * 100 / ((m.w + extra * 100 * Math.max(0, [...text].length - 1)) * sx);
        const px = Math.min(c.fx === 'whisper' ? base * 0.5 : base, fit);
        const pl = place(text, px, 0, 0); L.letters = pl.letters; L.px = px; L.w = pl.w;
      }
      ctx.restore();
      S.lay.set(key, L);
      return L;
    },

    stats(S, t) {
      const c = S.now >= 0 ? S.cues.find((q) => q.i === S.now) : null;
      return 'CUES ' + S.cues.length + '  ·  ' + (c ? 'NOW ' + C.pad(S.cues.indexOf(c) + 1, 2) + '  ·  FX ' + c.fx.toUpperCase() : 'WAITING');
    },
  };

  // ---------- effects: each draws one cue ----------
  function letter(ctx, l, x, y, o) {
    if (l.ch === ' ' || o.a <= 0.003) return;
    ctx.save();
    ctx.globalAlpha = C.clamp(o.a);
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale((o.s || 1) * (o.sx == null ? 1 : o.sx), (o.s || 1) * (o.sy == null ? 1 : o.sy));
    if (o.px && o.px !== o.basePx) ctx.font = ctx.font.replace(/\d+(\.\d+)?px/, o.px + 'px');
    if (o.stroke) { ctx.strokeStyle = o.col; ctx.lineWidth = o.lw || 2; if (o.dash) ctx.setLineDash(o.dash); ctx.strokeText(l.ch, 0, 0); }
    else { ctx.fillStyle = o.col; ctx.fillText(l.ch, 0, 0); }
    ctx.restore();
  }
  const EXIT_FADE = (ex) => 1 - C.smooth(ex);
  const breathe = (V) => 1 + V.P.pulse * 0.05 * V.beat;

  const FXDRAW = {
    slam(V) {                                    // big hit: drops in from 2.6x with overshoot, settles, tiny tremor
      const e = C.clamp(V.lt / 0.2), s = C.lerp(2.6, 1, C.outBack(e)) * (1 + 0.15 * V.ex) * breathe(V);
      const sh = (1 - C.clamp((V.lt - 0.2) / 0.35)) * V.L.px * 0.025;
      const dx = sh * C.noise3(V.lt * 9, 1, V.c.i, 3), dy = sh * C.noise3(V.lt * 9, 2, V.c.i, 3);
      for (const l of V.L.letters) letter(V.ctx, l, V.ax + dx + l.x * s, V.ay + dy, { s, a: e * EXIT_FADE(V.ex), col: V.ink });
    },
    whisper(V) {                                 // small, airy, wide tracking, drifting up
      const n = V.L.letters.length;
      V.L.letters.forEach((l, i) => {
        const e = C.smooth((V.lt - i * 0.03) / 0.7), spread = 1 + 0.25 * C.smooth(V.lt / Math.max(0.5, V.D));
        const y = V.ay - V.lt * V.E.h * 0.012 + C.noise3(i, V.lt * 0.8, V.c.i, 9) * V.L.px * 0.12;
        letter(V.ctx, l, V.ax + l.x * spread, y, { a: 0.62 * e * EXIT_FADE(V.ex), col: V.ink });
      });
      void n;
    },
    stretch(V) {                                 // the held word: letters pull apart and widen for as long as it's said
      const g = C.smooth(V.lt / Math.max(0.3, V.D)), e = C.clamp(V.lt / 0.15);
      const extra = 0.55 * g * V.L.px, n = V.L.letters.length;
      V.L.letters.forEach((l, i) => {
        const off = (i - (n - 1) / 2) * extra;
        letter(V.ctx, l, V.ax + l.x * C.lerp(0.75, 1.15, g) + off, V.ay, { sx: C.lerp(0.75, 1.15, g), sy: C.lerp(1, 0.9, g), a: e * EXIT_FADE(V.ex), col: V.ink });
      });
    },
    cascade(V) {                                 // letters tumble in from above, one after another, then fall away
      V.L.letters.forEach((l, i) => {
        const e = C.clamp((V.lt - i * 0.045) / 0.45), xo = C.clamp((V.ex * 1.6) - i / V.L.letters.length * 0.6);
        const y = V.ay - (1 - C.outBack(e)) * V.E.h * 0.55 + xo * xo * V.E.h * 0.9;
        const rot = (1 - e) * (V.r(i, 1) - 0.5) * 1.4 + xo * (V.r(i, 2) - 0.5) * 2;
        letter(V.ctx, l, V.ax + l.x, y, { rot, a: C.clamp(e * 3) * (1 - xo), col: V.ink, s: breathe(V) });
      });
    },
    scatter(V) {                                 // letters fly in from everywhere and lock together, then burst outward
      V.L.letters.forEach((l, i) => {
        const e = C.inOut((V.lt - i * 0.02) / 0.55);
        const sx = (V.r(i, 3) - 0.5) * V.E.w * 1.2, sy = (V.r(i, 4) - 0.5) * V.E.h * 1.2;
        const ang = Math.atan2(0.3 + l.x * 0.01, l.x || 0.01), burst = V.ex * V.ex * V.E.w * 0.6;
        const x = C.lerp(V.ax + sx, V.ax + l.x, e) + Math.cos(ang + (V.r(i, 5) - 0.5)) * burst * Math.sign(l.x || 1);
        const y = C.lerp(V.ay + sy, V.ay, e) + Math.sin(V.r(i, 6) * TAU) * burst * 0.6;
        letter(V.ctx, l, x, y, { rot: (1 - e) * (V.r(i, 7) - 0.5) * 6 + V.ex * (V.r(i, 8) - 0.5) * 4, s: C.lerp(0.4, 1, e), a: C.clamp(e * 2) * EXIT_FADE(V.ex), col: V.ink });
      });
    },
    type(V) {                                    // typewriter with a block cursor; deletes itself on the way out
      const n = V.L.letters.length, step = Math.min(0.06, 0.6 * V.D / Math.max(1, n));
      const shown = Math.floor(V.lt / step) + 1, gone = Math.floor(V.ex * n);
      const vis = Math.max(0, Math.min(n, shown) - gone);
      for (let i = 0; i < vis; i++) letter(V.ctx, V.L.letters[i], V.ax + V.L.letters[i].x, V.ay, { a: 1, col: V.ink });
      if (V.ex < 1 && Math.floor(V.lt * 2) % 2 === 0) {          // 1 blink per second
        const lst = V.L.letters[Math.max(0, vis - 1)], x = vis ? V.ax + lst.x + lst.w / 2 + V.L.px * 0.08 : V.ax + (V.L.letters[0] ? V.L.letters[0].x - V.L.letters[0].w / 2 : 0);
        V.ctx.fillStyle = V.accent; V.ctx.fillRect(x, V.ay - V.L.px * 0.36, V.L.px * 0.07, V.L.px * 0.72);
      }
    },
    wave(V) {                                    // letters ride a slow swell
      V.L.letters.forEach((l, i) => {
        const e = C.smooth((V.lt - i * 0.04) / 0.5);
        const y = V.ay + Math.sin(i * 0.55 - V.lt * 3.2) * V.L.px * 0.16 + (1 - e) * V.L.px * 0.5;
        letter(V.ctx, l, V.ax + l.x, y, { rot: Math.cos(i * 0.55 - V.lt * 3.2) * 0.08, a: e * EXIT_FADE(V.ex), col: V.ink, s: breathe(V) });
      });
    },
    spin(V) {                                    // split-flap: each letter flips into place
      V.L.letters.forEach((l, i) => {
        const e = C.clamp((V.lt - i * 0.05) / 0.35), x = C.clamp(V.ex * 1.5 - i * 0.03);
        const sy = Math.sin(e * Math.PI / 2) * Math.cos(x * Math.PI / 2);
        letter(V.ctx, l, V.ax + l.x, V.ay, { sy: Math.max(0.001, sy), a: e > 0 ? 1 : 0, col: V.ink });
      });
    },
    zoom(V) {                                    // rushes in from far away, then flies past the camera
      const e = C.clamp((V.lt + 0.05) / 0.32), s = Math.pow(e, 2.2) * (1 + V.ex * V.ex * 7);
      for (const l of V.L.letters) letter(V.ctx, l, V.ax + l.x * s, V.ay, { s: Math.max(0.01, s), a: C.clamp(e * 3) * (1 - C.smooth((V.ex - 0.3) / 0.7)), col: V.ink });
    },
    stack(V) {                                   // justified block: lines slide in from alternating sides
      for (const l of V.L.letters) {
        const j = l.line, e = C.inOut((V.lt - j * 0.12) / 0.4), x = C.inOut((V.ex * 1.4) - j * 0.1);
        const side = j % 2 ? 1 : -1, off = (1 - e) * side * V.E.w + x * -side * V.E.w;
        letter(V.ctx, l, V.ax + l.x + off, V.ay + l.y, { a: 1, col: j % 3 === 2 ? V.accent : V.ink, px: l.px, basePx: V.L.px });
      }
    },
    orbit(V) {                                   // text on a turning ring
      const L = V.L, rot = V.lt * 0.7 - L.span / 2 - Math.PI / 2, n = L.letters.length;
      L.letters.forEach((l, i) => {
        const e = C.clamp((V.lt - i * 0.03) / 0.3), a = rot + l.ang;
        letter(V.ctx, l, V.ax + Math.cos(a) * L.R * (1 + V.ex * 0.4), V.ay + Math.sin(a) * L.R * (1 + V.ex * 0.4), { rot: a + Math.PI / 2, a: e * EXIT_FADE(V.ex), col: i % 2 ? V.ink : V.ink });
      });
      void n;
    },
    shake(V) {                                   // trembling letters (smooth noise, never strobing)
      const e = C.clamp(V.lt / 0.15), amp = V.L.px * 0.05;
      V.L.letters.forEach((l, i) => {
        const dx = C.noise3(i * 3.3, V.lt * 7, 1, V.c.i) * amp, dy = C.noise3(i * 3.3, V.lt * 7, 2, V.c.i) * amp;
        letter(V.ctx, l, V.ax + l.x + dx, V.ay + dy, { rot: C.noise3(i, V.lt * 6, 3, V.c.i) * 0.09, a: e * EXIT_FADE(V.ex), col: V.ink });
      });
    },
    line(V) {                                    // a phrase: each word pops in when it's said (Whisper timing)
      const nw = V.L.nwords || 1, offs = V.c.words && V.c.words.length ? V.c.words : null;
      const at = (w) => (offs ? offs[Math.min(w, offs.length - 1)] : (w / nw) * V.D * 0.7);
      let cur = 0; for (let w = 0; w < nw; w++) if (V.lt >= at(w)) cur = w;
      for (const l of V.L.letters) {
        const e = C.clamp((V.lt - at(l.word)) / 0.22);
        const col = V.P.karaoke && l.word === cur && V.lt < V.D ? V.accent : V.ink;
        letter(V.ctx, l, V.ax + l.x, V.ay + l.y + (1 - C.outBack(e)) * l.px * 0.35, { s: C.lerp(0.7, 1, C.outBack(e)), a: C.clamp(e * 2) * EXIT_FADE(V.ex), col, px: l.px, basePx: V.L.px });
      }
    },
    outline(V) {                                 // hollow letters drawn stroke by stroke, with echoes drifting out
      const e = C.clamp(V.lt / Math.min(0.9, V.D * 0.8)), lw = Math.max(1, V.L.px * 0.025), len = V.L.px * 3;
      for (let k = 3; k >= 1; k--) {
        const s = 1 + k * 0.06 * C.smooth(V.lt / 1.2);
        for (const l of V.L.letters) letter(V.ctx, l, V.ax + l.x * s, V.ay, { s, a: 0.18 * e / k * EXIT_FADE(V.ex), col: V.ink, stroke: 1, lw });
      }
      for (const l of V.L.letters) letter(V.ctx, l, V.ax + l.x, V.ay, { a: EXIT_FADE(V.ex), col: V.ink, stroke: 1, lw, dash: [len * e, len] });
    },
    drip(V) {                                    // letters sag, stretch and slide down
      V.L.letters.forEach((l, i) => {
        const e = C.clamp(V.lt / 0.25), sag = C.smooth(V.lt / Math.max(0.5, V.D)) * (0.3 + V.r(i, 9) * 0.7);
        const y = V.ay + sag * V.L.px * 0.5 + V.ex * V.ex * V.E.h * (0.6 + V.r(i, 10));
        letter(V.ctx, l, V.ax + l.x, y, { sy: 1 + sag * 0.7, a: e * (1 - C.smooth((V.ex - 0.5) / 0.5)), col: V.ink });
      });
    },
  };
  TS.draw = FXDRAW;
})(globalThis.GEN = globalThis.GEN || {});
