# gen: API sheet (read this, not the sources)

`gen/` makes generative motion graphics on a 2D canvas: Truchet tiles, dot-and-wire 3D surfaces,
flow fields, contour maps, branching fractals, Julia sets, wormhole tunnels, reaction-diffusion,
harmonographs, halftone screens, and kinetic typography synced to a track. A piece is a **cartridge**:
a small JSON file.
Making a new piece means writing or editing one cartridge, not code.

**Before a new piece, interview the client and get a brief approved (`brief/INTERVIEW.md`; the "efficient or full creative mode?" question is in round 1).** The cartridges in
`carts/` are examples, not templates to reuse; a new piece may need new layers.

**Make the words part of the picture** (swarm / tunnel / truchet / dust words), not captions over a background; see `carts/pltw-cse.json`.

**Cheapest workflow for Claude:** read this file and `KNOBS.md` (generated, lists every knob with range).
Write `carts/<name>.json`. Run `python3 gen/build.py` then `node gen/tests/smoke.js`. Bryan tunes by eye in
the player's KNOBS panel and pastes back the JSON from COPY JSON. Do not read `layers/*.js` unless adding or
fixing a layer.

## Cartridge format
```json
{
 "name": "depth-morph",            // = file name (build.py sets it)
 "title": "GEN", "subtitle": "DEPTH STUDY",   // HUD top-left
 "seed": 7,                        // changes every random choice
 "bpm": 128, "perBar": 4, "bars": 8,   // HUD beat counter; layers pulse on the beat
 "palette": { "bg": "#101012", "ink": "#efece4", "accent": "#ff6b4a", "dim": "#5a5a62" },
 "hud": { "on": true, "corners": true, "title": true, "label": true, "timecode": true,
          "beat": true, "stats": true, "progress": true, "font": "...", "size": 13, "margin": 26 },
 "transition": { "type": "fade", "dur": 1.2 },   // fade | wipe | iris | cut  (default between shots)
 "shots": [
  { "layer": "depth", "dur": 30, "label": "DEPTH",
    "params": { "shapes": ["vase", "torus"], "hold": 6 },   // only what differs from the defaults
    "palette": { "bg": "#f1ece1" },                          // optional, per shot
    "transition": { "type": "iris", "dur": 1.6 } }            // optional: how THIS shot comes in
 ]
}
```
Every field is optional except `shots[].layer`. Shots loop forever in order. A transition overlaps the end
of one shot with the start of the next (capped at half of either shot).

## Layers
| layer | what it draws | stateful? |
|---|---|---|
| `truchet` | quarter-circle tiles rewired by travelling waves (turn 90°, recolor, arcs break mid-turn); `words` = tiles spell words, flipping in left to right | no |
| `swarm` | ONE 3D dot cloud flying between formations on a timeline (`keys`): warp, cloud, burst, floor, any `m3d` surface, **words made of the dots**; parts split the dots (floor + a word rising out of it); `car` = self-driving car with a lidar sweep; `streak` = motion tails | no |
| `depth` | 3D dot + wire mesh morphing between `m3d` surfaces; perspective, depth-sorted, trails; `plane` + `fly` = endless floor | trails only |
| `contour` | topographic isolines (marching squares) over drifting noise; index lines in accent | no |
| `tree` | recursive branching fractal; grows in, sways; `arms` > 1 = radial mandala | no |
| `field` | flow-field particle streaks | yes (3 s warm-up) |
| `julia` | Julia set at low res, upscaled (pixelated); `c` orbits a circle | no |
| `tunnel` | demoscene wormhole: rings fly at the camera along a bending path; `style` wire / dots / checker; `words` = dot-words that park in front of you, then fly through the camera and burst | no |
| `reaction` | Gray-Scott reaction-diffusion; `pattern` coral / mitosis / maze / worms / spots / waves / fingerprint | yes (4 s) |
| `harmonograph` | damped-pendulum pen drawings on turning paper; a new seeded figure every `period` | no |
| `halftone` | two overprinted dot screens driven by `field` ripples / noise / rings / text (a big word) | no |
| `type` | kinetic typography from a timed script; color floods; Whisper import (below) | no |
| `stack` | several layers in one shot with blend modes (text over visuals) | children |

Common knobs: `trail` (0 = clear each frame, higher = motion streaks), `seed`, `accent` (share drawn in accent).
Sizes are at 1080p and scale with the screen. Full list: `KNOBS.md`.

## Kinetic type (`type`) and music videos
A shot's `params.script` is a list of cues `{ t, dur?, text, fx, color?, bg?, size?, x?, y?, words? }`
(`t` in shot seconds; `dur` defaults to "until the next cue"). In the KNOBS panel it's edited as text,
one cue per line, and that's the cheapest form for Claude to write too:
```
@12.40~13.10 ORANGE | shout orange bg=black
@13.10 is the loudest color | phrase words=0,0.31,0.62,0.9
THE/COLOR/OF/NOISE | block yellow size=1.2        (no @time: 1.5 s after the previous cue)
```
Tokens after `|`, any order: an effect or a delivery word that maps to one
(`slam` shout/loud/punch · `whisper` soft/quiet/hush · `stretch` drawn/long/slow/held · `cascade` tumble/fall ·
`scatter` burst/explode/pop · `type` typewriter/flat/deadpan · `wave` sing/lilt/float · `spin` flip ·
`zoom` rush/fly/fast · `stack` block (`/` breaks lines; justified) · `orbit` circle/swirl/dizzy ·
`shake` tremble/nervous/shiver · `line` phrase/say (words pop in at `words=` offsets, karaoke accent) ·
`outline` ghost/echo · `drip` melt/sink/sad), a color (`#hex` or a name: red, ochre, chartreuse, mauve ...),
`bg=<color|none>` (floods the screen from the word; text auto-picks ink or bg for contrast), `size=`,
`pos=x,y` (-1..1), `dur=`, `caps`/`lower`. Parser: `GEN.typeScript.parse / format / fromWhisper`.
- **Whisper:** KNOBS → WHISPER JSON (or drop the JSON on the page) imports openai-whisper / WhisperX /
  faster-whisper word timestamps as phrases (split at pauses > 0.35 s or sentence ends) or one cue per word.
- **Tap timing:** KNOBS → TAP TIMING plays from the shot's start; press T (or Enter) as each cue is said.
- **Audio:** a cartridge with `"audio": "track.mp3"` plays it and the picture follows the track's clock.
  Source: embedded by `build.py` from `gen/audio/`, a file dropped on the page, or `gen/audio/<name>` beside
  `player.html`. START button (browsers block autoplay); `[` and `]` skip 5 s.
- Text over visuals: a `stack` shot with the visual first and `{ "layer": "type", "params": { "backdrop": 0, ... } }` last.
- Copyright: the words of a commercial record go in `carts/private/` (built like any cartridge, kept out of
  a public repo). Claude never types them; Bryan pastes his own transcript or Whisper output.

## Player (`player.html`, built to `dist/gen-player.html`)
- **Standalone / video:** `tools/gen_export.py` (in the repo-root `tools/` folder, Thonny GUI): pick a cartridge + folder → MAKE HTML (only that cartridge, opens straight into it, presentation mode `GEN.PRESENT`: no gallery/knobs/menu) / MAKE MP4 (cartridge's `"audio"` laid in frame-exact) / BOTH. Scripted: `build.main(only_cart='<name>', out_path=...)` or `ONLY_CART` in `build.py`.
- URL: `?cart=reel` · `?shot=2` · `?seed=9` · `?nohud` · `?gallery` · `?scale=0.75` (render resolution, for slow boards;
  `halftone` and `reaction` are the heaviest, then `contour`)
  · `?manual&t=12` (no clock; `advance(dt)` and `renderAt(t)` in the console, for frame capture).
- Keys: Space pause · ←/→ shots · K knobs · G gallery · F fullscreen · H HUD on/off · [ ] skip 5 s (audio) · T tap.
- KNOBS panel: sliders for every knob (double-click = default), JSON boxes for structured knobs (`stack`
  layers), the SCRIPT box for `type`, COPY JSON (changed knobs only), DOWNLOAD, PASTE JSON, RESET.
  Dropping a cartridge `.json` loads it; a Whisper `.json` imports into the current shot; an audio file plays.
- Controls hide after 3 s; prefers-reduced-motion slows time to 0.4× and forces fades.

## JavaScript (only for new layers or embedding in another player)
Load order: `core.js`, `m3d.js`, `stage.js`, `layers/*.js` (the list in `player.html` is the source of truth).
```js
const st = GEN.stage(canvas, cart, { reduced, makeCanvas });  // makeCanvas(w,h) only needed outside a browser
st.advance(dt); st.advanceTo(T) /* follow an audio clock */; st.renderAt(T); st.resize(w, h);
st.goto(i); st.setCart(cart, keepTime); st.refresh(); st.info();
```
**A layer** registers `GEN.layers.<name> = { about, knobs, help, warm?, init(P, E) -> state, frame(ctx, S, t, dt, E), stats?(S, t, E) -> string }`.
- `help`: `{ knob: "plain-English sentence" }`, shown under each knob in the panel and copied into KNOBS.md.
  Every new knob needs one (shared ones like `trail`, `seed`, `pulse` come from `GEN.knobHelp`).
- `knobs`: `{ name: [default, min, max, step] }` for numbers; `{ options: [...], value }` for a menu; any other
  value (string, array, object) is a plain default (strings get a text box, objects a JSON box).
- `t` = seconds since the shot started (pure function of `t` where possible); `dt` = step.
- `E`: `w h s cx cy` (s = scale vs 1080p), `pal` (`bg ink accent dim`), `seed`, `rng` (seeded; use it only in
  `init`), `beat()` (`{pulse, phase, bar, inBar}` on the global clock), `fade(ctx, dt, trail)`, `make(w,h)` (canvas).
- Each shot draws into its own canvas; start `frame` with `E.fade(ctx, dt, P.trail)`.
- `warm: seconds` if the layer keeps state between frames; the stage re-simulates that much after a seek.
- After adding a layer: add its `<script>` to `player.html`, a cartridge that uses it, run build + smoke.

**Words as visuals:** `C.textPoints(E.make, 'LINE ONE/LINE TWO', n, seed)` → `{x, y, w, h}`: n points spread evenly over the letters (font units, centered, reading order). Every word-forming layer uses it; prefer it to drawing text on top.

**Helpers** (`GEN.core`): `rng(seed)` (`.range .int .pick .chance`), `hash(x,y,z,seed)`, `noise3(x,y,z,seed)`,
`fbm(x,y,z,oct,seed)`, `lerp clamp fract smooth inOut outBack`, `rgb rgba mix mixArr`, `beat(t,bpm,perBar,bars)`,
`pad`, `merge`. **3D** (`GEN.m3d`): `rot(x,y,z,ax,ay,az,out)`, `persp(z,focal)` (screen = c + p·s),
`surfaces.<name> = { wrapU, wrapV, f(u,v,t,P,out) }` (radius 1; add one and every `depth` cart can morph into it).

## Rules
- Offline: no CDNs or remote fonts. `build.py` refuses to write a build that references an outside file.
- Time-based motion; nothing flashes faster than 3 times a second.
- `carts/_bundle.js` and `KNOBS.md` are generated by `build.py`; never edit them by hand.
