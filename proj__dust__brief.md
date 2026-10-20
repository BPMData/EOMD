# Dust Type: brief (study piece, Oct 15, 2026)

**What:** a motion-design study of the packed-powder letter trick seen in the ALT VFX / Semi-Permanent (Sydney 2014) title
cards: letters drop and burst into coloured dust (filmed from above), and the footage played backward makes dust coalesce
into crisp letters. Not a classroom piece yet; no copy, no music.

**Files:** `claude/proj__dust__player-src.html` (source; `/*__FONT__*/` placeholder in the `@font-face`),
`claude/fonts__OFL-Montserrat.txt` (licence). Build = subset Montserrat-Bold.ttf (github.com/JulietaUla/Montserrat,
fonts/ttf) with `pyftsubset --text="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-!?& " --layout-features=kern` (~13 KB) and base64 it into
the placeholder → `dust-type.html` (~40 KB). The word box only accepts those characters, so the subset is safe.

**How it works:** per letter, a warped-Voronoi fracture (`CHUNKS`) gives the crack lines (revealed outward in `STAGES` steps) and
the chunk each grain belongs to. One sim is baked at load (30 fps, 2 substeps): chunk impulse outward (`IMPULSE`, `FAN`), chunk
self-expansion (`SPREAD`), per-grain jitter + Brownian jostle (`JIT`, `DIFF`), splash toward the camera with gravity on height
(`SPLASH`, `GRAV`, `PERSP` parallax), drag + floor friction, analytic curl noise (5 plane waves; `TURB*`), `WIND` drift.
Playback is a pure function of time: forward = letters → dust, backward = dust → letters (the reversed-footage trick), staggered
left to right both ways (`STAG`), slow-motion reverse (`ASM_SLOW`). Puffs grow (`GROW`) and fade (`MIX_A`) while their sprite
dithers per grain from shaded "packed ball" (with drop shadow) to soft smoke. Dust is drawn into a fixed 960×540 buffer
(`DUST_RES`) with a 16-bucket height sort. Modes: Both / Letters → Dust / Dust → Letters; `?word ?mode ?n ?seed ?speed ?manual`.

**Status:** r2 seen and approved (Bryan: "looks sick now"). 3k grains default; 5k "kinda works" on his machine; r1's 7k/12k
were unplayable before the r2 renderer changes. r1 lesson: puffs stayed as coherent, clearly separated balls; more fan,
shear, Brownian jostle, bigger and softer puffs fixed it.

**Possible next steps (Bryan's call):** use it in a real piece (a title card, an end card, a gen-library cartridge),
colours/palette from a brand file, render capture via `?manual`, sound (impact thud + whoosh).
