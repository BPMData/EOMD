# Tools: status

_Moved from the root `STATUS.md` on Oct 25, 2026 (context plan step 2); the root file is now a short index. Update this file when working on the tools in `tools/`._

## Status
- **Video export (NEW Oct 20): `tools/html_to_mp4.py`** (Tk GUI). Bryan ran it on the Academies master: "Worked perfectly". Also tested on the CD-ROM build (20 s with music), the old Dust Type standalone and the gen player. Not tested: CANCEL, portrait, a living poster (none built in `dist/` at the time).
- **Tools:** Node v26 via Homebrew on the Mac; Thonny may need `NODE_EXE` set to the full path (`which node`).
- **Regression check: SETTLED for Node 22 (Oct 20, cloud).** CHECK on the untouched clone under Node 22.22 (Linux) matched the Oct 5
  baseline 27/27, so the Mac's 16 mismatches come from (a) Node 26 / the Mac, not from the files. SAVE BASELINE then extended
  `tests/hashes.json` to all 93 sections (the 27 old hashes unchanged); CI checks it on Node 22. On the Mac, CHECK needs Node 22
  (`brew install node@22`, `NODE_EXE` = `/opt/homebrew/opt/node@22/bin/node`) or just let CI check. Earlier notes: First CHECK on the Mac (Node v26) against the Oct 5 baseline (Node v22,
  Linux): `ssr-tv-science` 11/11 match; **16 mismatches** = all of `late-library` (11), `academies-hallway` (1), `corporate-calm` (4).
  Causes not yet separated: (a) Node 26 / Apple-silicon math in the piano + film voices; (b) a copy-paste slip in
  `audio/instruments.js` or `audio/instruments-film.js`; (c) the baseline came from different copies of those scores. Test (a):
  `brew install node@22`, point `NODE_EXE` in `tools/regress.py` at `/opt/homebrew/opt/node@22/bin/node`, CHECK. The CD-ROM player
  doesn't use those scores; no Overclock work changed an existing shared audio file.

## Known limits
- `tools/html_to_mp4.py`: for STEPPED players the music is recorded from a separate real-time run, so it takes the clip's length in
  real time and isn't locked to the picture; CD-ROM channel switches in `?manual` follow their own clock, not the music's bar lines.
  A stepped render takes roughly the clip's length (music) plus about the same again (frames).

## Next
- **Regression baseline: settled for Node 22** (see the Regression bullet); CI runs CHECK. Optional: install node@22 on the Mac.
