# gen: status

_Moved from the root `STATUS.md` on Oct 25, 2026 (context plan step 2); the root file is now a short index. Update this file when working on gen._

## Status
- **`tools/gen_export.py` (NEW Oct 20, Bryan: "that CANNOT be how we generate the final video"):** Tk GUI, pick a gen cartridge
  + folder (Desktop first, then remembered in `~/.eomd_gen_export.json`) → MAKE HTML / MP4 / BOTH. MP4 reuses
  `tools/html_to_mp4.py`'s stepped renderer but lays in the cartridge's `"audio"` file (frame-exact) instead of recording live.
  Engine tested headless (HTML + 1080p MP4 of pltw-cse); the window itself not yet clicked through. `ONLY_CART` reset to ''.
- **Dust Type = the gen `dust` layer + cartridge `dust-type` (a cartridge only; the Oct 15 standalone player was dropped Oct 20,
  Bryan: "it was never meant to be a standalone anything").** Letters burst into coloured powder and dust coalesces back into crisp
  letters (the ALT VFX / Semi-Permanent packed-powder trick; one baked physics sim played forward and backward). Look approved Oct 15
  ("looks sick now"); in gen Oct 20: "works fine, looks good". `gen/layers/dust.js` (39 knobs, each with a help line; modes both /
  explode / assemble; how it works and the r1 look lesson are in its header), `gen/carts/dust-type.json` (3 shots: DUST both ways
  27.8 s = 2 loops, GEN burst 10.2 s, TYPE coalesce 9.3 s), `gen/fonts/Montserrat-Bold.ttf` + OFL, which is `DISPLAY_FONT` in
  `gen/build.py` (so the `type` and `halftone` layers use Montserrat Bold too). `gen/tests/smoke.js`'s stub canvas returns gradients
  (dust is the first layer to use them). **Palette fix (Oct 20):** the cartridge no longer pins a `colors` list, so `color
  ink/accent/dim` change the dust live (fallback = dim-ink blend, dim, accent, ink). Not yet checked: every knob on every setting.

## Known limits
- Dust Type: above ~5k grains it drops frames on Bryan's machine (fill rate + per-grain bake memory); the bake runs on the main
  thread, and every knob change re-bakes (~0.1–0.4 s).

## Next
9. **Dust Type:** check the gen knobs across their ranges. Then Bryan's call: use it in a real piece (a title or end-card shot in
   another cartridge), a brand palette, impact/whoosh sound. Ideas not yet tried: a bake in a Web Worker (no hitch on knob changes),
   a per-letter colour palette from a brand file.
