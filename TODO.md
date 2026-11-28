# TODO: full-motion video essays (Q-Day, The Last Boring Slide)

_Written Nov 28, 2026. The goal is for EOMD to make pieces that work like the two reference files Bryan found:
"Q-Day" (a 12-minute film in chapters, about 19 GPU scenes, text over the picture, generative sound) and "The Last
Boring Slide" (a talk that plays itself or follows the presenter: 13 GPU scenes, 10 transitions, sound effects and
background beds, presenter tools). Take their mechanisms, never their look or music (`brief/taste/house.md`)._

**Already done** (branch `claude/html-tricks-eomd-aa1cb6`):
- `engine/src/fx/lens.js`: the filmed finish. It covers glow from 6 levels at halving sizes, halation, streak, edge
  fringe, ACES/AgX tone, a grade, vignette, grain, and anti-banding dither. It is off by default; try it with
  `?lens=1`.
- Engine audio renders in slices on the main thread (`P.steps`, `P.runAsync`, `DHS.audio.renderAsync`). A blocked
  worker now falls back to it instead of going silent.

Ordered by what unblocks the most. Each item says where it would live. "Essay player" means the player shell EOMD
builds for the kit (§0), which ProofEr uses for motion essays.

## 0. Where things live (decided Nov 28, 2026)
**The plan: sister repos, one-way.** EOMD is the motion and sound engine; ProofEr is the home of the video essay. A
Q-Day-style piece is a sourced essay that plays like a film. ProofEr already has what's hard about that: the research →
figures-checked gates, two independent sources per figure, honest-chart rules, a sources section, and a content policy.
EOMD has the picture and the sound.

Bryan: "Maybe we need to re-merge the projects at some point, especially as these new Q-Day / Last Boring Slide-style
videos blur the line between interactive scrollytelling and video." Not yet: see the merge triggers below.

- [ ] **The kit: EOMD exports its engine parts as one versioned folder** (`kit/`, with a version and a changelog):
  - the lens;
  - the GPU toolkit, scene host and shader scene cartridges (§1);
  - the DSP and sliced synthesis (`P.steps`, `P.runAsync`);
  - the beat model and essay player shell (§2, §5);
  - GPU type (§3) and sound hits and beds (§4).
  Every file is MIT and needs only the `DHS` namespace.
- [ ] **`kit/KIT.json`: the kit's manifest, agreed with ProofEr (Nov 28).** ProofEr's sync script is being written
  against this exact shape, so change it only together with ProofEr:
  ```json
  {
    "version": "0.1.0",
    "license": "MIT",
    "files": {
      "fx/lens.js": "<sha256 of the file, lowercase hex>"
    }
  }
  ```
  - `files` keys are paths under `kit/`, with forward slashes. Every file in `kit/` except `KIT.json` is listed, and
    nothing outside `kit/`.
  - `version` follows semver: bump the patch for fixes, the minor for new files or knobs, and the major for anything
    that breaks a piece built on an older kit. Each bump gets a line in `kit/CHANGELOG.md`.
  - Every kit file keeps an MIT header comment naming EOMD.
  - A Thonny-friendly `tools/build_kit.py` copies the parts into `kit/` and rewrites `KIT.json` (hashes and the
    file list; the version is set by hand). CI fails if `KIT.json` doesn't match the files.
  - ProofEr copies the files into `vendor/eomd-kit/`, checks every hash, and keeps its own copy of `KIT.json` there.
- [ ] **ProofEr brings in the kit with a sync script** (Thonny-friendly, `SETTINGS` block): it copies a pinned kit
  version into ProofEr. ProofEr's CI fails if a synced file was edited in place, because changes go upstream to EOMD
  first.
- [ ] **ProofEr gets a "motion essay" format.** It uses its own interview and research and figures gates, plus the
  kit's player. Its brief adds:
  - running time;
  - whether it plays by itself or a presenter drives it;
  - speaker notes;
  - sound;
  - per-scene budget.
  (This takes over §8's interview item, which moves to ProofEr.)
- [ ] **Drift check for the duplicated process files.** These are copies in both repos: `stage_gate.py`,
  `check_stage_reads.py`, `eval_new_piece.py`, the `auto-piece` skill, fresh-eyes review and the interview core. A
  script reports where the two copies differ, instead of finding out by hand (as PR #14 did).
- [ ] **Licences.** EOMD is MIT and ProofEr is AGPLv3, so the one-way direction works today: MIT code can be included
  in an AGPL project. Nothing moves from ProofEr into EOMD without Bryan deciding to relicense it.
- [ ] **Write the boundary into both `CLAUDE.md` files ("Where to go").**
  - **EOMD:** motion pieces for screens: hallway loops, posters, promos, screensavers, players. Also the engine and
    the kit.
  - **ProofEr:** anything sourced: infographics, scrolling data essays, and motion essays.
  - **Test:** if a piece's claims need sources, it's ProofEr, however much it moves.
- [ ] **No three.js.** The Last Boring Slide bundles it. Rebuild everything below in plain WebGL2, as the lens is.
  Confirm this rule and add it to `engine/CLAUDE.md`.

**Merge triggers.** Re-merge into one repo with two front doors ("motion piece", "sourced piece") sharing one method
folder and one engine when any of these happens:
- most new pieces need both ProofEr's research gates and EOMD's engine;
- kit or process sync PRs become routine rather than occasional;
- requests keep landing in the wrong repo (Knife Country already did once).

Merging means choosing one licence, and keeping each front door's first-question context small (EOMD's is 7.7k
tokens today).

## 1. The picture: GPU scenes and how they join
- [ ] **Shader scenes.** Each scene is one fragment shader over the whole screen:
  - it gets time, a smoothed beat value, the mouse, and one or two data values;
  - a shared GLSL preamble gives hash, value noise, fbm, distance-field shapes (box, capsule, torus, smooth min) and
    a fake studio light for reflections;
  - this is the "real object under studio light" look with no image files.
  Both files do this. Lives in: `engine/src/gl/` (new), with a fallback scene when a shader won't build.
- [ ] **Render-to-texture compositor.** Draw the outgoing and incoming scenes into two buffers, run a transition
  shader between them, then the lens.
  - The lens gets an entry point that takes a GPU texture, so GPU scenes skip the 2D upload and keep their full
    floating-point range (AgX and halation work properly on real highlights).
  - Canvas 2D scenes keep working through the upload path.
- [ ] **Transition library**, with timing as a function of transition progress:
  - from Q-Day: collapse (cell dissolve), ripple, tile flip, zoom-blur warp, slices. Q-Day also lists lens, glass,
    liquid, cube and burn, but never wrote them;
  - from The Last Boring Slide: fold, wash, flaps, slam (paper fibres), daybreak, line, tear, portal-in and
    portal-out.
  Check every one against the 3-flashes-a-second rule (Q-Day's collapse flickers its cells 28 times a second).
- [ ] **Transitions the scene decides.**
  - `portal`: the incoming scene returns the four corners the old picture flies into.
  - Linked transitions: both scenes get enter/exit progress, so each animates its own way in or out.
  - A 640×360 snapshot of each scene as you leave it, which later scenes can show.
  This fits CRAFT.md's "no transition just because it exists".
- [ ] **Precomputed data textures:** maths done once on the CPU and passed to a shader as a float texture (Q-Day's
  zeta-function grid).
- [ ] **Text as a distance field:** text rasterized and turned into a distance field, for type effects inside
  shaders.

## 2. Time, beats and pacing
- [ ] **Beat model.** A scene is a list of beats, each with `dur`, `delay` and `hold`.
  - Each beat has its own 0→1 progress that eases forward and runs back 2.4× faster when you go back.
  - `s.k(beat, t0, t1, ease)` times a move inside a beat.
  - It plays by itself (dur + hold, then next) or follows clicks.
  Lives in: the essay player.
- [ ] **Reading-time pacing.** A beat's hold comes from its word count (Q-Day: 2.6 s + 0.31 s a word, kept between
  5.2 and 16 s). Client copy stays word for word; only the timing comes from the words.
- [ ] **A pure function of time where possible.** Both files build up progress from frame to frame. For an MP4 and a
  seamless loop, the essay player needs a fixed-step clock (1/60 s) that seek and export can replay exactly, and a
  seeded random generator in place of `Math.random`.

## 3. Type
- [ ] **GPU letter-by-letter type** (The Last Boring Slide's `TextBlock`):
  - each letter is its own small rectangle on the GPU, drawn from a letter sheet the browser renders sharp at the
    screen's pixel density;
  - per letter: move, scale, rotate, skew, fade, blur (a 28-tap disc), colour and clip;
  - arrival styles: rise, blur, type, fade, scatter, track, drop, by letter, word or line, with stagger;
  - it can also sit inside a 3D scene.
  Lives in: `engine/src/gl/type.js`; later the gen `type` layer.
- [ ] **HTML text over the picture** (Q-Day's way, for long copy and sources):
  - named positions (corners, centre, quote, chapter card, giant number);
  - a soft dark patch behind the text instead of glows;
  - words fading in one by one, and headlines that arrive scrambled and resolve;
  - mobile sizes.
  Check WCAG contrast against the darkest and brightest frames under the text.

## 4. Sound
- [ ] **A library of sound hits.**
  - Named hits, synthesized once at 48 kHz in chunks.
  - Each has a priority, a minimum gap before it repeats, slight random pitch and level, an optional snap to the
    scale, and room/hall sends.
  - A global cap of 26 hits per 120 ms.
  Lives in: `audio/` as instruments, under the regression rule.
- [ ] **Background beds that know the cut.** Each scene has a bed. A slam cuts the old bed at the moment of impact;
  a line stops it fast; others crossfade over the transition. This carries over to offline scores, where crossfade
  length follows the cut type.
- [ ] **Ambience driven by the viewer** (wind, water, hum, tension, speed): the level follows how actively the viewer
  interacts. Only for interactive pieces.
- [ ] **Loudness for a live mix.** House rules: the brief's LUFS target, true peak ≤ −1.5 dBTP, checked with ffmpeg.
  A mix put together while it plays can't be measured ahead of time. Plan:
  - render the play-by-itself path offline, from its event log, with the same synth code;
  - calibrate the bed and hit gains from that render;
  - put a true-peak limiter on the live master;
  - verify the offline render with ffmpeg.
- [ ] Main-thread synthesis: the longest remaining stall is about 113 ms (one bar of pad notes, or a GC pause).
  Yield inside long instrument notes if it shows on a slow machine.

## 5. Player, presenter and performance
- [ ] **Essay player shell:**
  - start screen with Begin with sound / Begin silently;
  - controls hidden until the mouse moves, fading after 3 s (both files use less);
  - progress bar with gaps between chapters;
  - keyboard, swipe and right-click to go back; plays by itself (A); black screen (.); help card (?);
  - `#scene-beat` links that work with the back button.
- [ ] **Presenter tools:** notes for every beat (N), notes in a second window kept in step (P), a grid of all scenes
  with thumbnails (O), and a talk timer.
- [ ] **Fill the screen without black bars:** lay out in 1920×1080 design units and widen the view to the screen's
  shape (`engine/src/player/runtime.js` letterboxes today).
- [ ] **Quality that adapts.**
  - Render-scale steps 1 / 0.84 / 0.70 / 0.58: drop a step after about 1.2 s of slow frames, climb back only after
    about 5 s of good ones, at most 3 tries.
  - Pixel cap 2560×1600, and pixel density capped at 2.
  Lives in: the runtime, which helps every WebGL piece.
- [ ] **Warm-up:** a loading bar that runs every scene and transition once, off-screen, before the show (no stutter
  at the first cut). Scenes far from the current one shrink their buffers to 2×2 pixels; the next two scenes warm up
  ahead.
- [ ] **No WebGL2:** the text and sound still play, with a plain note on screen (both files do this).

## 6. Export and QA
- [ ] **Test hooks for stepped and essay players:** `seek(scene, beat, t)`, `trans(scene, p)` and `perf(scene)`,
  returning repeatable stills of any beat or any point in a transition. Used by fresh-eyes review
  (`brief/CRAFT.md` §11) and by `tools/html_to_mp4.py`.
- [ ] **MP4 of an essay:** play by itself at a fixed step, capture frames, and lay in the offline render of the
  event log, frame-exact. Extends `tools/html_to_mp4.py`.
- [ ] **Fresh-eyes review of transitions:** stills at 0.25, 0.5 and 0.75 of every transition, plus a flash-rate
  check.

## 7. Roll out what's already built
- [ ] Watch the lens on a real hallway TV (glow on type, vignette against footer contrast, dither against banding).
- [ ] Inline `engine/src/fx/lens.js` into the CD-ROM, living-poster and gen builds (each its own change; off by
  default).
- [ ] **Likely the same bug in the Academies film:** `academies-film/source/src/player/runtime.js` keeps the audio
  code only as worker text, so its main-thread fallback can't find `DHS.audio`. Port the fix (load the code into the
  page, then `renderAsync`) and re-run `tools/build_academies_clock.py`.

## 8. Process (how a client gets one)
- [ ] **In ProofEr, not here (§0): `/new-piece` interview and `brief/TEMPLATE.md` for motion essays.** Ask about:
  - running time;
  - whether it plays by itself or a presenter drives it;
  - whether it needs speaker notes;
  - sources and who checks the facts ("never invent facts": an essay is research-heavy, as Q-Day's 15 sources show);
  - chapter structure;
  - languages.
- [ ] **CRAFT.md:** add scene-aware transitions, reading-time pacing, and "type in the picture glows: check
  legibility".
- [ ] **Narration:** neither reference file has a voice. Decide whether essays need voice-over (recorded or
  synthesized). That would be a new audio stage and a new loudness case (speech against music).
