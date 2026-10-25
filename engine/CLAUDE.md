# engine/: the timeline (cut-based) starter engine

The stripped-down base the Academies film grew from: time-driven canvas scenes with cuts and choreography,
synthesized music and SFX, a kiosk player and a dev player. How to use it: `engine/README.md` (run its Node tools from
inside `engine/`, e.g. `node tools/build-player.js`).

- `engine/src/audio/dsp.js` is the DSP every player uses: a change to it follows the regression rule in
  `audio/CLAUDE.md`.
- `engine/tools/html_to_mp4.py` is the original MP4 script; use `tools/html_to_mp4.py` instead.
- Don't open `engine/` for living-poster or jukebox work (only `dsp.js`, for DSP internals).
