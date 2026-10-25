# PLTW CSE promo: status

_Moved from the root `STATUS.md` on Oct 25, 2026 (context plan step 2); the root file is now a short index. Update this file when working on the PLTW promo._

## Status
- **PLTW CSE promo r2 (Oct 20, full creative mode; UNSEEN and UNHEARD by Bryan): `gen/carts/pltw-cse.json`, 60 s, 120 BPM.**
  r1 (captions over unrelated cartridges + the hallway film's music) was rejected: "words on top of unconnected visuals ...
  looks bad", and the seven-academy music made no sense for CS. r2 makes the visuals FORM the words:
  - BOOT 0-10: `swarm` warp (hyperspace streaks) → sphere → the dots fly into PLTW → burst through the camera.
  - TUNNEL 10-24: `tunnel` checker; COMPUTER / SCIENCE / ESSENTIALS made of dots park in front of you, then fly through the
    camera and burst (14, 16, 18); CODE / BUILD / DRIVE fly through on 20, 21, 22.
  - DRIVE 24-36: `swarm` floor + a wireframe self-driving car with a lidar sweep; sky dots fly down into VEXcode VR,
    VEXcode EXP, self-driving vehicles, then back up.
  - TILES 36-48: `truchet` tiles flip left to right to spell "MIT App / Inventor", then "Python".
  - FINALE 48-60: `swarm` knot → PLTW → COMPUTER / SCIENCE / ESSENTIALS, held to the end.
  New code: `gen/layers/swarm.js` (new layer), `words` on `tunnel` and `truchet`, `GEN.core.textPoints`. All cuts, on the beat.
  Music: `proj/pltw/music.js` ("PLTW CSE", own synths on the DSP, scored to `CUES` = the cartridge's moments; boot data
  chatter + blip clouds as dots assemble, four-on-the-floor drop with crash/stab per word burst, stop-time CODE/BUILD/DRIVE,
  motorik drive with a lidar ping per sweep, chiptune lead + tile-flip tick runs, finale). Rendered by the new
  `tools/render_piece.py`: -16 LUFS, -1.5 dBTP (checked with ffmpeg), only seen as a spectrogram, never heard.
  Colors: PLTW brand page (Dark Blue `#0e0318`, Cream `#f7f4f1`, PLTW Blue `#3e34d9`, Deep Blue `#141e8a`, CS Purple `#461c5d`);
  dots/accents use the tint `#6f68e6` (PLTW Blue on Dark Blue is ~2.3:1). Course name = PLTW's "Computer Science Essentials";
  tool names: VEXcode VR, VEXcode EXP, MIT App Inventor, Python (Trinket is also on PLTW's list; left out, Bryan didn't name it).
- **PLTW promo r2 seen by Bryan (Oct 20):** "looks cheesy as hell, but it's exactly what I asked for". Published as
  `players/pltw-cse.html` on GitHub Pages (index.html card) for his Zoom class. Bryan: the standalone must NOT carry the
  gen gallery UI, so standalone builds are now presentation mode (`GEN.PRESENT`, set by `gen/build.py`). Bryan asked why
  the r2 session took ~30 min wall-clock (cheap in tokens): mostly build + headless frame-grab rounds and two 2-min MP4
  renders; a lighter check loop is a possible later improvement.
