# notes/audio-ports.md: proof details for the ported music (open only when porting or debugging audio)

## Academies hallway (`score/academies-hallway.json`, style `film24`)
- 60 s loop, 96 BPM. Null test vs the film's `music.render()`: bit-identical; calibrated copy −152 dB.
- `master_db` −10.07 = −23 LUFS (jukebox). For hallway level (−16 LUFS) use about −3.07.
- After the Oct 4 split: porter null test, port before vs after at `master_db` 0, bit-identical (100%, −300 dB). The film-HTML-vs-port test needs the finished player HTML (not in the Project; `engine/config.js` is the generic 40 s template, not the Academies film).

## Corporate Calm (`score/corporate-calm.json`, style `rounds`)
- 1200 s, 90 BPM, 12 rounds × 9 airs × 4 bars, a 6-bar drift every 4 rounds, block keys D→F→A. Score (5.5 KB): chords, airs (notes lifted from the film's own tables), round variations, bed, fx.
- **How `rounds` works.** Sections are 2 bars (225 per loop) and stateless. The original streams with persistent reverb/echo state; here each 4- or 6-bar plan section is rendered with fresh effects plus an 8 s ring-out, and each section returns its slice (the last slice carries the ring-out). Effects are linear, so overlap-adding sections equals the stream. A one-entry cache stops neighbouring slices re-rendering the same plan section.
- **Proof.** Full 20-min null test vs `longform.js` (its export path: warm, then all 111 sections), soft clipper off in both, sections overlap-added circularly so the loop seam is included: 115.2 M samples, correlation 0.99999999999917, residual **−150.3 dB**, max difference 8e-8 (one float32 step), 77% of samples bit-identical.
- **Ring-out check:** 4 s total tail −111 dB, 5 s −140 dB, 6 s and up −150 dB (8 s has a 2× margin).
- **Clipper caveat.** The original has a soft clipper (above 0.6 FS), active at its −16 LUFS level (pre-clip peak +0.7 dB). A nonlinear stage can't be exactly overlap-added, so with it on at that level the residual is −68 dB (max 0.12 on a few samples). At −23 LUFS (peak −6.4 dBFS) it never triggers, so the jukebox version is exact.
- `master_db` −9.44 = −23.0 LUFS (ffmpeg ebur128, LRA 3.3 LU). For hallway level (−16 LUFS) use about −2.4 (the film's own trim is −2.3).
- **Not ported:** the film's counter-melody code (no section in the shipped plan sets it, so it never ran); per-air `key`/`prog` fields (the plan uses block key and round progression instead).

## Tooling notes
- `tools/porter.py`: tested end to end on both players in the sandbox (GUI under a virtual display), not yet on Bryan's Windows/Thonny. It doesn't write the score; notes and any new style file are the creative step. `MUSIC.loopSections(score)` (1 for film24, 225 for corporate-calm, null for comp4) makes "0 sections" mean one full loop.
- `tools/regress.py` baseline: saved from the pre-split code (27 sections: comp4 idx 0–7 seed 1 + 0–2 seed 42 for both comp4 scores; film24 idx 0; rounds idx 0, 1, 2 + first drift = idx 72). Arranger split and film-voice split both CHECK 0 mismatches; a planted `master_db` change was caught.
- `tools/calibrate.py` writes numeric arrays on one line; `jukebox/template.html` `keyName` falls back to `score.tonic`.
