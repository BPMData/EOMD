# Plan: context that follows the stage (progressive disclosure)

Status: DESIGN, approved in direction by Bryan (Oct 25); not yet implemented. Written to be handed to the model
that implements it.

## The goal, in Bryan's words
"Let the AI approach a task in an environment and context primed for creativity and professionalism, and as choices
are made and questions answered, gradually reveal the tools and prior context needed to make their work more
efficient." Avoid reinventing the wheel, and avoid getting stuck reusing prior art's wheel designs. "Frontloading all
that context is how you get endless repetitive demoscene videos."

## The problem today
A session opens with ~8,900 words: CLAUDE.md (~3,400, mostly per-piece file maps, builds and the CD-ROM's music
routing) plus STATUS.md (~5,500, mostly CD-ROM history), which CLAUDE.md says to read every session. Before the
client has said a word, the model has read about cartridges, chips, Overclock and the jukebox. Whatever is in context
first becomes the answer: that's the rut. The Academies film came from a session holding only the brief.

## The principle: context follows the stage
Each stage loads only what its decisions need. Earlier stages get **craft and the client**; later stages get
**tools and prior art**. The files written at each gate (brief, storyboard, build plan) are the handoff: any model
can pick up from them, so a strong model can run stages 0–1 and a cheaper one the build.

| Tier | Loaded | Holds | Must NOT hold |
|---|---|---|---|
| 0 Always | Session start | Who the client is, the non-negotiable rules, design constraints (offline, legibility, loudness, flashing), the stage gates, a routing table | File maps, tool names beyond one line, piece history |
| 1 Creative | Stage 0–1 (interview → brief → concepts → storyboard + stills) | `brief/` (interview, template, Academies example), a craft primer, the medium's envelope, the client's taste notes | Cartridges, layers, scores, other pieces' code or looks |
| 2 Toolbox | Gate: brief approved (efficient mode) or storyboard approved (full creative) | A one-page index of what exists, by **capability**, not by look; the build-plan step | Implementation detail |
| 3 Detail | When a folder is touched | Per-folder docs: API sheets, knobs, build steps, gotchas, the regression rule | — |
| Piece | When working on an existing piece | That piece's brief, decisions log, status, file map | Other pieces |

**The mode question decides when the toolbox opens.** Efficient mode: right after the brief, so concepts are built
from what exists. Full creative mode: only after the storyboard and stills are approved, so the design is made for the
subject and the tools are then fitted to it.

## Mechanisms (all native to Claude Code; nothing custom)
- **Root `CLAUDE.md`** is always loaded: keep it to tier 0.
- **Nested `CLAUDE.md` files load lazily:** a `CLAUDE.md` inside a subfolder is pulled in only when the session reads
  files in that folder. This is the tier-3 and per-piece mechanism: `gen/CLAUDE.md`, `audio/CLAUDE.md`,
  `proj/cdrom/CLAUDE.md` ... appear exactly when that work starts, and never during a new piece's design.
- **Skills:** only the one-line description is always in context; the body loads when invoked. `/new-piece`
  (tier 1, exists) and a new `/toolbox` (tier 2; its description says when it may be used).
- **Pointers, not copies:** every fact lives in one file; the tiers above link to it. (Bryan dislikes redundant
  instruction sets.)
- Optional, not recommended yet: a PreToolUse hook that blocks reads of `gen/`, `score/`, `audio/` while a piece's
  brief says `Stage: design`. Try the instructions alone first; add the hook only if the model keeps peeking.

## Changes, in order (each one a commit)
1. **Slim root `CLAUDE.md` to tier 0 (target ≤ 900 words).** Keep: the intro, Bryan's rules, "New pieces" as a short
   gate (details live in `brief/INTERVIEW.md`), Defaults (they are design constraints), Process, a routing table:
   - new piece → `/new-piece`;
   - change to an existing piece → its folder (`proj/<piece>/`, `academies-film/`, `living/`), whose CLAUDE.md loads itself;
   - library or tool work → that folder;
   - commit/STATUS rules.
   Move everything else to the folder it describes (step 3). Acceptance: a fresh session's start-up context names no
   cartridge, layer, chip or score.
2. **Split `STATUS.md`.** Root STATUS.md becomes a short index (≤ 400 words): one line per piece (state + next step,
   linking to its folder), cross-cutting items (CI, regression baseline, open repo-wide questions). Each piece's
   history, known limits and open taste questions move to its folder (`proj/<piece>/STATUS.md`, or the brief's
   Decisions log where the item is a decision). Change the rule to "read the root STATUS index at session start; read
   a piece's status when working on it." Nothing is deleted, only moved.
3. **Nested `CLAUDE.md` per folder** (tier 3 / piece), built from today's CLAUDE.md sections:
   | New file | Takes from today's CLAUDE.md |
   |---|---|
   | `proj/cdrom/CLAUDE.md` | CD-ROM files, its music, build_cdrom / cdrom_ambient, font licenses |
   | `academies-film/CLAUDE.md` | "academies-film/" (master, both config copies, don't rebuild from `source/`), its music files |
   | `living/CLAUDE.md` | Living-poster files, variants, `tools/build.py` living targets, Hershey words |
   | `gen/CLAUDE.md` | "gen/" section, gen build + smoke, gen_export, presentation mode, `ONLY_CART` |
   | `audio/CLAUDE.md` (+ a pointer in `score/`) | Audio file map rows, load order, new arranger style steps, the regression rule, porter/calibrate/midi |
   | `jukebox/CLAUDE.md` | Jukebox rows, `JUKEBOX_*` settings, the look redesign note |
   | `tools/CLAUDE.md` | Thonny rules for scripts, html_to_mp4, render_piece, "Tools on the Mac", publishing to `players/` |
   | `proj/pltw/CLAUDE.md` | PLTW cartridge + score files |
   Human-facing `README.md` files stay as they are; CLAUDE.md files are for the model.
4. **Tier 1 craft context: `brief/CRAFT.md`** (≤ 1,500 words; the most important new writing; best written by the
   strongest model, from the Academies prompt's "Creative expectations" outward). Contents:
   - How a designer gets from brief to concept: the single-minded message, the signature idea, a system with
     variations, designing for the viewing context first.
   - Storyboard and style-frame formats (the Academies `SCRIPT.md` table as the model), what a still must prove.
   - Motion craft: anticipation, overshoot, follow-through, stagger, match cuts and shape morphs, camera moves,
     rhythm locked to music, holds long enough to read, loops that breathe.
   - Type for screens at distance; hierarchy; contrast in bright rooms; bilingual lines.
   - Sound for repeated public playback.
   - A vocabulary of directions to choose from deliberately (Swiss/editorial type, flat illustration, 2.5D paper,
     isometric, collage, data-graphic, generative, retro-computing ...), so the default isn't whatever the toolkit
     happens to draw.
   - Anti-patterns with Bryan's verdicts: captions over unrelated wallpaper ("looks bad"); effects chosen because
     they exist ("cheesy as hell"); slideshow logic; default easings; template feel.
   - **The medium's envelope** (what's possible, without naming tools): anything drawn procedurally on Canvas 2D in
     real time; synthesized audio; no photos, footage or remote assets; OFL fonts embedded; school PCs and smart
     boards as the slowest target; MP4 export exists. This lets concepts be ambitious *and* buildable before the
     toolbox is opened.
5. **Client taste notes: `brief/TASTE.md`** (Bryan's; ≤ 400 words, one section per client if others arrive):
   distilled verdicts across pieces (what landed, what didn't, in his words), e.g. breathers beat repetition,
   strings over flute/horn, the Kells look, "cheesy" demoscene. Tier 1: lessons, not looks. Kept up to date from
   briefs' Decisions logs.
6. **Tier 2 `/toolbox` skill** (`.claude/skills/toolbox/SKILL.md`). Description: "Use only after the brief is
   approved (efficient mode) or the storyboard and stills are approved (full creative mode)." Body: a one-page index
   **by need**, describing mechanisms, not looks:
   - timeline film with cuts and choreography → `engine/`;
   - generative layers → `gen/` (each layer as a mechanism, e.g. "swarm: N points tweened between point sets");
   - scored one-off music → `proj/<name>/music.js` + `tools/render_piece.py`;
   - endless or streaming music → the arranger;
   - MP4 → `tools/html_to_mp4.py` / `tools/gen_export.py`;
   - fonts, DSP, loudness checks, publishing.
   Then the **build-plan step**: for each storyboard element, write "reuse plumbing / adapt a mechanism / build new"
   into the brief, and show the client the plan with its rough cost. Rule: prior pieces are consulted for mechanisms
   and lessons, never as the look.
7. **Update `/new-piece` and `brief/INTERVIEW.md`** to name the gates: after the brief → (efficient) `/toolbox`;
   after storyboard + stills → (full creative) `/toolbox`. Add `Stage:` to the brief's status line (interview / brief
   / concepts / storyboard / build) so any session or model knows which tier it is in.
8. **Check it:** start a fresh session, ask for a new piece in one sentence, and record what's in context at the
   start (should be tier 0 + skill descriptions only) and which files it opens before the storyboard is approved
   (should be only `brief/` and the brand/copy files). Then the real test: brief the PLTW promo properly and rebuild
   it in full creative mode; compare with r2.

## Open questions for Bryan
- Per-piece status: a separate `proj/<piece>/STATUS.md`, or fold it into the piece's `CLAUDE.md`? (Recommended:
  separate. The CLAUDE.md loads on every file touch in the folder; the history only needs reading when the work
  depends on it.)
- Should `brief/TASTE.md` be public? It's his taste, in his words; the Academies prompt set the precedent.
- Enforce the gates with a hook, or trust the instructions first? (Recommended: instructions first.)
