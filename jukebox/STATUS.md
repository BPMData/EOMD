# Jukebox: status

_Moved from the root `STATUS.md` on Oct 25, 2026 (context plan step 2); the root file is now a short index. Update this file when working on the jukebox._

## Status
- **Jukebox cartridges (Oct 9h `tools/build.py`):** `ssr-tv-science`, `late-library`, `academies-hallway`, `corporate-calm`,
  `encyclopedia-lounge`, then `overclock-<chip>` and `lounge-chipped-<chip>` for tia, beep, arcade, snes, fm (15 in all). The plain
  `chip` cartridges are skipped (`JUKEBOX_SKIP_STYLES`).
- The CD-ROM cartridges (Overclock, Lounge (Chipped)) and how `tools/build.py` makes them: `proj/cdrom/STATUS.md`, Oct 9h.

## Known limits
- Jukebox: the Overclock cartridges play at the score's 142.5 BPM / −3 st (no tempo/key menu there); no Contour intro; the key label
  reads "D♭" for C♯ minor (the template's flat-only note names).

## Open taste questions
- Jukebox blurb says every cartridge "plays forever without repeating"; the two ports loop by design and ignore the seed.
- Jukebox: 10 CD-ROM cartridges may be a lot; trim `JUKEBOX_CHIPS` (e.g. Overclock on all five, Lounge (Chipped) on two)?
- **Jukebox look (Bryan, Oct 20: "I hate the way the Jukebox looks now that we have so many tracks"; pinned for later):** 15 cartridges in one long list of cards. Redesign the layout in `jukebox/template.html` (e.g. grouped by family, compact rows), then rebuild and copy into `players/`.
