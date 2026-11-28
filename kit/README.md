# The EOMD kit

EOMD's engine parts, packaged for other projects. ProofEr copies a pinned version into `vendor/eomd-kit/` with its
sync script. Every file runs in a browser with no libraries. Each one needs only the shared `DHS` namespace
(`globalThis.DHS`), which it creates if it isn't there.

**Don't edit these copies.** Each JavaScript file is generated from an engine source named in its header. Change the
source in EOMD, then run `tools/build_kit.py`. CI fails if a copy and its source differ, or if `KIT.json` doesn't
match the files.

## What's in it

| File | What it does | Source in EOMD |
|---|---|---|
| `fx/lens.js` | `DHS.lens`: a WebGL2 finish over any 2D canvas. Glow, halation, streak, colour fringe, tone curve (none, ACES, AgX) and grade, vignette, grain, anti-banding dither. A pure function of the frame and `t`. Without WebGL2 it reports `ok: false` and the caller shows the plain canvas. | `engine/src/fx/lens.js` |
| `audio/dsp.js` | `DHS.dsp`: sample-by-sample synthesis and mixing on circular buffers (oscillators, filters, envelopes, reverb, delay), BS.1770 loudness, true peak, a true-peak limiter, and WAV-ready buses. `P.steps.*` are the same steps as generators; `P.runAsync` runs a generator in ~8 ms slices, so a page making sound on its main thread keeps drawing. | `engine/src/audio/dsp.js` |

## Using it

Inline the files into the page, as every EOMD player is a single offline HTML file. Load `audio/dsp.js` before any
code that uses `DHS.dsp`; `fx/lens.js` stands alone.

```js
// Lens over a 2D canvas: knobs from DHS.lens.DEFAULTS; null when it's off or can't start
const L = DHS.lens.attach(canvas, { bloom: 0.25, tone: 'none' });
function frame(t) {
  drawScene(ctx, t);
  if (L && L.ok) L.draw(canvas, t);
}

// Sound made on the main thread without freezing the page: write the render as a generator of P.steps
const P = DHS.dsp;
const song = function* () {
  const bus = P.bus(48000 * 10);
  /* ...write notes into bus... */
  return yield* P.steps.circular(bus, P.reverb({ sr: 48000 }));
};
P.runAsync(song(), { budgetMs: 8 }).then((out) => play(out));
```

The full knob list is `DHS.lens.DEFAULTS`, with a comment on every knob at the top of `fx/lens.js`. The engine's own
README (`engine/README.md`, "Lens") lists what to watch for: glow on white type, vignette against footer contrast,
and the tone curves shifting brand colours.

## Versions

`KIT.json` lists every file with its sha256, the version and the licence. Versions follow semver:

- **patch:** fixes;
- **minor:** new files or knobs;
- **major:** anything that breaks a piece built on an older kit.

`CHANGELOG.md` has a section for every version.

## Licence

Copyright (C) 2026 Bryan Patrick Murphy. GNU Affero General Public License v3.0 (`AGPL-3.0-only`), the same as EOMD
and ProofEr. See EOMD's `LICENSE`.
