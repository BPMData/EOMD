# The Academies of Danbury High School — hallway loop

A 60-second seamless loop (96 BPM, 24 bars). The picture is drawn live on a canvas and the music is synthesized live. There are no video, image, or audio files, and nothing loads from the internet.

## Play it
- **Kiosk / hallway TV:** open `dist/player.html` in Chrome. It loops forever, fills the window, and hides controls and cursor until the mouse moves. Controls: Pause, Sound, Fullscreen; double-click or press F for fullscreen, Space to pause.
  - Unattended sound needs Chrome flags, because browsers block autoplay audio:
    `chrome --kiosk --autoplay-policy=no-user-gesture-required "file:///path/to/player.html"`
    Without the flag, the loop plays silently until someone clicks.
  - URL options: `?fps=60`, `?orient=vertical` (1080×1920), `?mute=1`, `?scale=2` (sharper on 4K, more CPU).
  - Sound takes roughly 10–25 s to synthesize on first load, depending on the PC. The picture plays during that time and the audio joins in sync.
- **Editing / review:** open `dev.html`. It has a scrubber with section bands, frame step, play/pause, restart, mute, and orientation.
- **Video file:** screen-record the player at 30 fps.

## Edit
All names, colors, pathways, campuses, and copy live in **`config.js`**. Section lengths are also there, in bars.

After editing, rebuild the kiosk file:
```
node tools/build-player.js
```
To re-export the audio stems (`build/audio/music.wav`, `sfx.wav`, `master.wav`, `report.json`):
```
node tools/render-audio.js
```

## Layout
- `src/core`: math, easing, color and contrast, timeline engine, embedded font.
- `src/draw`: shapes and the 21 icons.
- `src/scenes`: hub/spiral, exploration, academy beats, and motifs.
- `src/film.js`: scene assembly.
- `src/audio`: DSP, music, SFX, and master (−16 LUFS, −1.5 dBTP ceiling).
- `src/player/runtime.js`: clock, audio, and screen fitting.
- `tools`: build, audio render, stills, smoke test.

## Study loop (20 min): `dist/study.html`
This is a long-form piece built from the film's tunes, 90 BPM, 20:00 exactly, seamless loop. It runs 12 rounds; each round plays all 9 tunes for about 11 s each (the title chime, Exploration, and the 7 academies), with a new variation every round. The drums drop out every 4th round, and a short drift section follows every 4 rounds. It measures −16 LUFS integrated with a −1.6 dBTP peak.
- **Listen:** open `dist/study.html` and click Start. It streams: music is synthesized about 30 s ahead of playback, and it loops forever. Controls appear when the mouse moves: Pause, Next round, Download 20-min WAV.
- **WAV file:** use the Download button in the page, or run `node tools/render-study.js` to write `build/audio/study.wav` (takes about 3 minutes).
- **MP4 file:** run `tools/study_to_mp4.py` in Thonny after editing the paths at the top.
- **Editing:** the composition is in `src/audio/longform.js` (`ROUNDS` = the variation list per round, `BLOCK_KEY` = keys, `PROGS` = chord progressions). After editing, run `node tools/build-study.js`. If you change levels, re-check loudness with `WAV=0 node tools/render-study.js` and adjust `GAIN_DB`.
