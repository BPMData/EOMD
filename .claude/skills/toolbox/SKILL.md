---
name: toolbox
description: Opens the EOMD toolbox (what already exists to build a piece with, by need). Use only after the brief is approved (efficient mode) or the storyboard, stills and sound concept are approved (full creative mode). Never during the interview, concepts or storyboard of a full creative piece.
---
# Toolbox: what exists, by need

**Check the gate first.** Read the piece's `proj/<name>/brief.md` status line. Efficient mode: `Stage:` is past
`brief` (brief APPROVED). Full creative mode: `storyboard.md` is APPROVED (table, stills and sound concept). If not,
stop and go back to `/new-piece`. When the gate is open, set `Stage: build` once the build plan below is approved.

**The rule:** earlier pieces are consulted for mechanisms and lessons, never for their look or music. The entries
below describe what a tool *does*, not what a past piece looked like. In efficient mode, pick and tune what suits
this piece's subject and audience; in full creative mode, new layers, new music, the timeline engine or a player
written from scratch are all fair game: spend the tokens. Reuse the plumbing, never another piece's look.

## Picture
| Need | Mechanism | Where (its `CLAUDE.md` loads when you open it) |
|---|---|---|
| A film with cuts, scenes and choreography on a timeline; seekable, frame-exact, seamless loop | Timeline engine: scenes as pure functions of time, easing, a kiosk player and a dev player with a scrubber | `engine/` (`engine/README.md`) |
| Shots that run from a small JSON file, with knobs tuned live | gen: a cartridge = a list of shots, each one layer + params, with transitions, palette, a beat clock and an optional audio track | `gen/` (`gen/API.md`, `gen/KNOBS.md`) |
| A field of points that flies between formations (shapes, 3D surfaces, words spelled in dots) | gen layer `swarm`: N points tweened between point sets on a timeline | `gen/layers/swarm.js` via `gen/API.md` |
| Words built from points, tiles or particles | `GEN.core.textPoints` (n points spread over the letters); `tunnel` and `truchet` take `words`; `dust` bakes a particle sim that bursts letters and reassembles them | `gen/API.md` |
| Kinetic type cued to a soundtrack | gen layer `type`: a timed script of cues with delivery effects; Whisper word-timestamp import | `gen/API.md` |
| Procedural fields and textures | gen layers: `field` (flow-field streaks), `contour` (isolines over noise), `reaction` (reaction-diffusion), `truchet` (tiles rewired by waves), `halftone` (overprinted dot screens), `julia` (fractal), `harmonograph` (pendulum drawings), `tree` (recursive branching), `depth` (3D dot-and-wire meshes morphing), `tunnel` (rings flown through) | `gen/API.md` |
| Layers combined with blend modes | gen layer `stack` | `gen/API.md` |
| Something that grows forever without a timeline (a screen that lives all day) | Living engine: vines on a curl-noise field, text cards that bloom, cursive words written by a pen, a session timer | `living/` (`living/README.md`) |
| Anything none of these does | Write it: a new gen layer, a new engine scene, or a player from scratch on Canvas 2D | — |

## Sound
| Need | Mechanism | Where |
|---|---|---|
| Fixed-length music scored to the picture (one-off piece) | Write `proj/<name>/music.js` that sets `PIECE.render(sr)` with its own synths on the DSP, hits on a `CUES` list taken from the picture; render with `tools/render_piece.py` (set `PIECE`, `OUT_*`, `TARGET_LUFS`) to WAV + MP3, true-peak limited. Worked example of the mechanism (not a sound to reuse): `proj/pltw/music.js` | `tools/render_piece.py` |
| Endless or long streamed music (screens that play all day) | The arranger: a score JSON picks a style that writes 8-bar sections forever from a seed | `audio/` + `score/` (`score/FORMAT.md`) |
| A new kind of stream | A new arranger style file | `audio/CLAUDE.md` |
| DSP building blocks (oscillators, filters, envelopes, reverb, buses, limiter) | `DHS.dsp` | `engine/src/audio/dsp.js` |
| Loudness to target | `tools/calibrate.py` (streams), `tools/render_piece.py` (one-offs); check with ffmpeg `ebur128=peak=true:framelog=quiet` | `tools/CLAUDE.md` |
| MIDI of a stream | `tools/midi.py` | `audio/CLAUDE.md` |

## Output
| Need | Mechanism | Where |
|---|---|---|
| MP4 of a gen cartridge, music frame-exact | `tools/gen_export.py` (also the standalone HTML, presentation mode) | `gen/CLAUDE.md` |
| MP4 of any other player | `tools/html_to_mp4.py` (frame-exact for timeline films; stepped + real-time music for others) | `tools/CLAUDE.md` |
| Fonts | Open-licensed TTFs embedded at build (licenses in `fonts/OFL-*.txt`, `gen/fonts/`, `engine/fonts/`); a new font needs its OFL file too | the build script of the chosen route |
| Publishing | Copy the build into `players/`, link it from `index.html`, keep `README.md` true | `tools/CLAUDE.md` |
| A choice for the client between finished options | `choice-panel.html` in this folder (below) | — |

## The build plan (do this before building)
1. For every row of the storyboard (or, in efficient mode, every beat of the chosen concept), write one line in the
   brief under a new heading **Build plan**: the element, then **reuse plumbing** (an export, the DSP, a font
   pipeline), **adapt a mechanism** (which one, and what changes), or **build new** (what, roughly).
2. In efficient mode, now write the sound concept (`brief/STORYBOARD.md`, "Sound concept"): a choice among the
   existing sound mechanisms, made for this piece; never another piece's score.
3. Show the client the plan in everyday words with its rough cost in Claude usage (share of a 5-hour limit, as in
   `brief/INTERVIEW.md`), and what they'll see first. Their answer goes into the Decisions log.
4. Then build in the stages of `CLAUDE.md`'s Process, committing at the end of each.

## Choice panels
When the client chooses between things (a look, a hero moment, a sound, a cut), copy `choice-panel.html` to
`proj/<name>/choices-<topic>.html`, fill in `PANEL` at the top (up to six options: a still, a ~15-s clip, a sound
sample, or a drawing function), and send it. They answer with a letter ("B, but slower"); the answer goes into the
Decisions log. Keep media files beside it in `proj/<name>/` (or inline as data URIs) so it works offline. During the
design stages the options are stills or sketches made for this piece (`draw` functions or images); clips and sound
samples come once the tools are open.
