# living__README.md: Kells growth engine
One continuous, generative composition, not a timeline of cuts. Vines grow along a curl-noise field, branch, and curl into spirals. A fiddlehead blooms text cards, and vines write cursive words. Built for the SSR poster (see proj__ssr__brief.md). Build it with `tools__build.py`. The music comes from a `score__*.json` via `MUSIC.bind(score)`, exposed as `SSRM` for `living__sound-timer.js`.

## Where to change things (all in template.html)
- **Copy:** `MSGS` holds one array per text card, cycled in order. `TICKET` is the end-of-timer card. Roles: `mr title accent kicker body sub item small tl`. `tl` is the drawn "0 MIN ⟶ ~15–20 MIN" row.
- **Variants:** `/*__VARIANT__*/` (right after `TICKET`) is where `tools__build.py` injects a variant script, e.g. `living__variant-cs.js`. A variant can replace `MSGS`/`TICKET`, add fonts to `VFONTS`, and set `TRIO` (sets of cards that bloom together, one fiddlehead each). Fiddleheads and cards live in lists (`FS`, `CLS`), so several can be up at once; SSR uses one.
- **Card colors:** `VAR[0]` is cream with charcoal; `VAR[1]` is charcoal with mustard. Cards alternate.
- **Look:** `K` holds vine colors and widths (w), outline (ow), speed (sp), max roots (cap), spawn rate, branch and leaf rates, length range (L), and the share of interior sprouts (`inner`). `KIND` holds the pop shapes. The background is in `draw()`.
- **Pace:** DRIFT (7 px/s stream), GAP (vine spacing), WSPEED (writing speed). Cluster timings are in stepCluster (2.6 s in, 13 s hold, 2.6 s out). Pre-grow is in init.

## Architecture (why it's cheap enough for Chromebooks)
- **Incremental growth layer.** Vines are stamped into an offscreen canvas as they grow. They are never redrawn. Only live things are drawn each frame: shapes still scaling in, the fiddlehead tip, the text card, and the timer.
- **Stream drift.** The layer is shifted by whole device pixels (no blur buildup), and a fractional offset is applied at draw time. Everything drifts left and off-screen, so the frame never fills up.
- **Occupancy grid (no piling).** This is a ring buffer in world coordinates that scrolls with the layer. Vines mark cells about 44 px behind their tip (so they don't block themselves) and look ahead before each step. They veer up to ±1.3 rad or curl off when blocked. Branches, leaves, roundels and words claim space before they appear. Each vine has its own ID, so a curl can wrap without hitting itself.
- **Interlace look.** Only the newest segment gets an outline. The fill is repainted over the last ~20 px, so crossings read like Celtic knotwork.
- **Fiddlehead.** The tip is a clothoid (curvature grows with arc length), drawn live while it curls, holds and unfurls, then baked into the layer. The text card scales out from the tip and later shrinks back into it.
- **Cursive.** Real Hershey polylines, resampled to 3 px steps and drawn in stroke order by a moving tip. Strokes closer than 10 units are joined; i-dots become eye-buds. There is no mask or fade.
- **Time-based and uncapped.** Frame rate never changes speed. `?manual` + `advance(sec)` steps at 60 Hz for frame-perfect capture. `?fps` shows a live counter. `?vseed` and `?seed` fix the growth and music.

## Lessons learned (read before changing things)
- **Don't double-pad the grid.** Pad either the marks or the checks by half a cell, never both. Padding both doubled the spacing and turned the vines into confetti.
- **Scale-ins.** A thin, elongated shape scaling up from a stub reads as phallic; it killed the Matisse sketch. Use round things (buds, teardrop leaves, roundels) or grow tip-first along a path.
- **Bud eyes.** Circle buds with a dark center read as eyes. They were a hit; keep them.
- **Text over words.** Text cards are big (up to ~1100×760) and will cover fresh words. Fix: start words only while a card is open, beside it, and have the next fiddlehead steer its card away from the last word. The CS trio fills too much of the board for words beside it, so with `TRIO` set, words also start between blooms and the next trio steers clear.
- **Not a bug.** Six messages × ~30 s means the same card returns at the same clamped spot every ~3 min. Don't debug that as "stuck."
- **Performance.** ~16 ms/frame in the sandbox's software renderer. Real GPUs should be faster, but verify on the target machine with `?fps`.

## Cost habits (also in 00_CLAUDE.md)
- For continuous "living" pieces, start from `living/` instead of the scene timeline. For cut-based films, use the main engine.
- **Cost control.**
  - Start each stage in a fresh chat, with the latest file in project knowledge and a 5-line handoff note.
  - Patch instead of regenerating whole files.
  - Run sandbox tests and screenshots only when asked or when debugging; Bryan previews on his own devices.
