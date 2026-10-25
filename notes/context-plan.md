# Plan: context that follows the stage (progressive disclosure)

Status: IMPLEMENTED Oct 25 (steps 1–10; step 8's PLTW rebuild waits for Bryan, see `notes/context-check.md`). Approved in direction by Bryan (Oct 25), open questions decided the same day. Written to be handed to the model
that implements it.

## The goal, in Bryan's words
"Let the AI approach a task in an environment and context primed for creativity and professionalism, and as choices
are made and questions answered, gradually reveal the tools and prior context needed to make their work more
efficient." Avoid reinventing the wheel, and avoid getting stuck reusing prior art's wheel designs. "Frontloading all
that context is how you get endless repetitive demoscene videos."

**Who it's for:** non-technical people who want a video made, on a Pro plan. Technical users already get good
results. Test every change against someone organizing a church tag sale: could they follow it?

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
- **Lazy by default (Bryan, Oct 25):** anything not needed on every touch of a folder lives in a separate file that
  the folder's CLAUDE.md links to (history, status, decisions, long references). Two reasons: it saves context (the
  "Efficient" in EOMD), and it keeps the model unbiased until it has made its own first top-level design.
- **Pointers, not copies:** every fact lives in one file; the tiers above link to it. (Bryan dislikes redundant
  instruction sets.)
- Optional, not recommended yet: a PreToolUse hook that blocks reads of the restricted list (below) while a piece's
  brief says `Stage: design`. Try the instructions alone first; add the hook only if the model keeps peeking.

## The restricted list (design stages)
One list, used by the craft writing brief, the peeking audit, the first-question eval and any future hook. During
the design stages these paths stay closed; they open at the toolbox gate (efficient mode: brief approved; full
creative: storyboard, stills and sound concept approved). Picture and sound are treated the same.
- **Picture:** `gen/`, `living/`, `engine/`, `academies-film/`, `players/`, `dist/`, `media/`.
- **Sound and music:** `audio/`, `score/`, `jukebox/`, `engine/src/audio/` and `gen/audio/` (inside the folders
  above), `tests/hashes.json`, `notes/audio-ports.md`, every `proj/*/music.js`, `proj/cdrom/track2-r2.js`,
  `proj/cdrom/intro-motif.md`. (MIDI export is `tools/midi.py`, which logs the arranger's notes through Node; there
  is no other MIDI code in the repo.)
- **Tools:** `tools/` (builds, renderers, calibrate, midi, porter, regress, MP4 export).
- **Other pieces:** every `proj/<piece>/` except the new piece's own, and the per-piece STATUS files.
- **Open during design:** root `CLAUDE.md`, the root STATUS index, `brief/`, `.claude/skills/new-piece/`, the new
  piece's `proj/<name>/`, and files the client supplied (logo, copy, brand guide).

## Changes, in order (each one a commit)
1. **Slim root `CLAUDE.md` to tier 0 (target ≤ 900 words).** Keep: the intro, Bryan's rules, "New pieces" as a short
   gate (details live in `brief/INTERVIEW.md`), Defaults (they are design constraints), Process, a routing table:
   - new piece → `/new-piece`;
   - change to an existing piece → its folder (`proj/<piece>/`, `academies-film/`, `living/`), whose CLAUDE.md loads itself;
   - library or tool work → that folder;
   - commit/STATUS rules.
   Move everything else to the folder it describes (step 3). Acceptance: a fresh session's start-up context names no
   cartridge, layer, chip or score.
   **Tier 0 is client-neutral.** The repo is for anyone who wants a video made, not only Bryan, and most clients
   don't assume a loop, a hallway or a school. Bryan's own context (Danbury HS, English learners, hallway and
   classroom screens, −16/−23 LUFS by room, 44/90 px for 20 ft) moves to `brief/clients/bryan.md`, read once the
   interview shows the client is Bryan. Tier 0 keeps only what holds for every piece (offline single file, time-based
   motion, flashing limit, never invent facts) and says that legibility and loudness targets come from the brief's
   "How it's watched". The maintainer rules for the repo itself (Thonny-friendly scripts, edit in place, commit per
   stage) stay in tier 0, labeled as such.
2. **Split `STATUS.md`.** Root STATUS.md becomes a short index (≤ 400 words): one line per piece (state + next step,
   linking to its folder), cross-cutting items (CI, regression baseline, open repo-wide questions). Each piece's
   history, known limits and open taste questions move to a separate `STATUS.md` in its folder (never inside the
   folder's CLAUDE.md, which loads on every file touch), or to the brief's Decisions log where the item is a decision. Change the rule to "read the root STATUS index at session start; read
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
   - Storyboard and style-frame formats (a time | on screen | sound table, one row per beat), what a still must prove.
   - Motion craft: anticipation, overshoot, follow-through, stagger, match cuts and shape morphs, camera moves,
     rhythm locked to music, holds long enough to read, endings that land (or, if it repeats, loops that breathe).
   - Type for the actual screen and distance (a phone in hand to a TV across a hall); hierarchy; contrast; more than
     one language when the audience needs it.
   - Sound for where it plays: a single showing, a feed that may be muted, or repeated public playback.
   - A vocabulary of directions to choose from deliberately (Swiss/editorial type, flat illustration, 2.5D paper,
     isometric, collage, data-graphic, generative, retro-computing ...), so the default isn't whatever the toolkit
     happens to draw.
   - Anti-patterns with Bryan's verdicts: captions over unrelated wallpaper ("looks bad"); effects chosen because
     they exist ("cheesy as hell"); slideshow logic; default easings; template feel.
   - **The medium's envelope** (what's possible, without naming tools): anything drawn procedurally on Canvas 2D in
     real time; synthesized audio; no photos, footage or remote assets; OFL fonts embedded; an ordinary laptop or
     office PC as the slowest target; MP4 export exists. This lets concepts be ambitious *and* buildable before the
     toolbox is opened.
   **Writing brief for `brief/CRAFT.md`** (for the session that writes it):
   - **Job:** make the model a good creative director for the stretch from the approved brief to approved
     storyboard and stills, before any tool is in view. It's read by the model, not the client.
   - **Read only:** `brief/INTERVIEW.md`, `brief/TEMPLATE.md` (§14 craft bar, §17 QA), `brief/example-academies.md`,
     and this file (the tiers, "Who it's for", this step). Don't open STATUS.md or anything on the restricted list (above): CRAFT.md must
     not know what the toolbox holds.
     Ignore CLAUDE.md's file maps.
   - **Draw on your own expertise** in motion design, graphic design, typography, editing and sound. That's why the
     strongest model writes it. Be specific and opinionated where craft is settled; give choices where it isn't.
   - **Stay general:** any subject, client and format. Nothing assumes a loop, a school, a hallway or Bryan; where the
     format matters, say "if it repeats", "if the sound may be off", etc. (the conditions in step 5).
   - **No looks from this repo:** don't name its tools, layers, cartridges, scores, or the look of any past piece. The
     Academies film may be cited for its process (brief, storyboard table, a signature idea with variations), never
     as a style to copy. The direction vocabulary must reach well beyond what the repo already draws.
   - **Not in it:** a textbook, history, tutorials, easing math, code, tool advice, the client's taste (that's
     `brief/taste/`), or anything already in INTERVIEW.md or TEMPLATE.md (link to it instead).
   - **Must include:** the outline above, plus how to pitch 2–3 concepts to a non-technical client in everyday words
     (each a few lines: the idea, what they'd see, how it feels; one still or sketch each when possible), choice
     panels (below), what a
     storyboard row and a still frame must prove, and a short self-check to run before showing the client anything
     (the anti-patterns as questions).
   - **Form:** ≤ 1,500 words; headings and tight bullets; plain English, so a later, cheaper model can follow it.
   - **Wire it in:** in `brief/INTERVIEW.md` "After the interview", read `brief/CRAFT.md` before step 4 (concepts);
     add it to CLAUDE.md's file map row for `brief/`. Commit on a branch, open a PR, show Bryan the full text.
4b. **Choice panels** (Bryan, Oct 25: the demo-sheet pickers from the Academies hero marks "were a great
   methodology"). Whenever the client has to choose (concepts, a look, a hero moment, a sound), show one simple
   offline HTML page: up to six options in a 3 × 2 grid, each a still, a ~15-second clip or a sound sample, with a
   short plain-words label and a letter to answer with ("B, but slower"). A non-technical client picks by looking and
   listening, not by reading descriptions. The options follow the stage rules: during design they're stills or
   sketches made for this piece; clips and sound samples come once the tools are open. CRAFT.md says when to use one;
   the toolbox gets a small template for building them.
5. **Taste as a profile with IDs, not prose** (tier 1; public). Most first prompts carry weak taste, so the house
   taste applies by default; a project may change it, but only item by item, with a reason.
   - `brief/taste/house.md`: the default profile, Bryan's, distilled from STATUS.md and the briefs' verdicts. One
     line per item, so it's cheap to load and easy to parse:
     `T07 · strong · music · Breathers beat repetition: long pieces need sections that drop out and come back. — CD-ROM 9c: "the breather periods really do break up the samey-sameyness"`
     Fields: ID (never reused) · strength (`strong` = default, an override needs a reason; `soft` = a lean) · area
     (motion, type, color, music, sound, structure, process) · the preference · the verdict it came from. Hard rules
     stay in CLAUDE.md, not here. Target ≤ 40 items.
   - **Nothing about the format is assumed.** Items that depend on how a piece is seen carry a condition, and they
     apply only once the interview has answered it. Conditions come from the brief's "How it's watched" answers:
     `plays once | repeats`, `sound on | off | unreliable`, `walk-up | seated | scrolling`, `short (< 30 s) | medium
     | long (> 5 min)`, `distance far | near`. Example:
     `T07 · strong · music · when long or repeats · Breathers beat repetition ...`
     Items with no condition hold for every piece. No named presets ("hallway loop"): a preset is a format guessed
     in advance, which is exactly what the interview is for.
   - In the brief, §13 becomes `Taste: house. Applies: T01–T05, T07 (repeats), T12 (sound unreliable). Overrides:
     T09 off (the client wants a hard-cut ending).` §17 QA adds: every applicable `strong` item is honored or
     overridden in §13.
   - Why a file and not a database (the IndexedDB idea): browser storage lives in one viewer's browser and never
     reaches Claude, a cloud session or another user. A line-per-item file in git is the shared database: versioned,
     readable by any model, parseable by a script (`^T\d+ · (strong|soft) ·`). A settings page could be generated
     from it later if one is ever wanted.
   - New verdicts flow in: when a brief's Decisions log records a verdict that generalizes, add or adjust an item.
5b. **A written sound concept before any audio code** (full creative mode; part of the storyboard stage). Written
   from a blank slate, in the piece's `proj/<name>/storyboard.md`, before anything on the restricted list opens:
   what sound does for this piece (music, effects, silence, or none); pulse or tempo and why it suits the edit; the
   instruments and textures, described as sound, not as patch names; how it meets the picture's key moments; how it
   ends (or, if it repeats, how it loops and stays bearable); which taste items apply (brief §13). The client hears
   about it in everyday words with the concepts. In efficient mode it's written right after the toolbox opens, as
   a choice among existing sounds made for this piece's fit (still never another piece's score).
6. **Tier 2 `/toolbox` skill** (`.claude/skills/toolbox/SKILL.md`). Description: "Use only after the brief is
   approved (efficient mode) or the storyboard and stills are approved (full creative mode)." Body: a one-page index
   **by need**, describing mechanisms, not looks:
   - timeline film with cuts and choreography → `engine/`;
   - generative layers → `gen/` (each layer as a mechanism, e.g. "swarm: N points tweened between point sets");
   - scored one-off music → `proj/<name>/music.js` + `tools/render_piece.py` (`proj/pltw/music.js` as the worked
     example: today CLAUDE.md names it in always-loaded rules; step 1 moves that pointer here);
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

9. **Measure peeking before deciding on a blocking hook.**
   - **Record:** a non-blocking `PostToolUse` hook in `.claude/settings.json` (it runs in cloud sessions too, since it
     lives in the repo). After every Read, Grep, Glob or Bash call it reads the `Stage:` line of the piece in progress
     (the newest `proj/*/brief.md` whose stage isn't `build`) and, while that stage is interview, brief, concepts or
     storyboard, appends one JSON line to `proj/<name>/access.jsonl`: time, stage, tool, paths touched. It never
     blocks anything. The log is committed with each stage commit.
   - **Check on push:** `tools/check_stage_reads.py`, run by CI. For every piece, it lists reads of paths on the restricted
     list (picture, sound and music, tools, other pieces) made before the toolbox
     gate (efficient mode: brief approved; full creative: storyboard approved). It reports them as a warning
     annotation, never a failure, so it can't block a push. Bash calls are matched by path substrings in the command.
   - **Decision rule:** if peeks show up in 2 of the next 3 new pieces, or once in a way that shaped the design (a
     concept or storyboard echoing a cartridge's look), make it a blocking `PreToolUse` hook on those paths during
     design stages. Record the count and the call in STATUS.md.
10. **First-question eval, with a cost guard** (measured Oct 25 before any of this plan was built).
   - **What it does:** `tools/eval_new_piece.py` runs `claude -p "Make a promo video for the robotics club."` in the
     repo with Sonnet (the model most clients use), read-only tools, `--max-turns 15` and `--max-budget-usd 0.50`, and
     `--output-format stream-json`. From the stream it reports: the files opened before the first question; whether it
     asked questions instead of designing; the context size at the first question; the run's cost.
   - **Measured baseline (Claude Code 2.1.310, Sonnet, this cloud container):**
     | Run | Context at start | Context at first question | Cost | Behavior |
     |---|---|---|---|---|
     | Empty folder (control) | 32.1k tokens | ~50k | $0.28 | Designed a promo at once, planned slides around facts it didn't have |
     | Repo today | 42.8k | 63.4k | $0.28 | `/new-piece`, read STATUS.md (all ~5,500 words), INTERVIEW.md, grep; then 3 questions |
     Claude Code's own overhead (~32k here, less without this container's extra tools) is fixed and isn't ours to
     cut. The repo's share is ~31k: ~11k at start (CLAUDE.md) plus ~20k read before the first question, mostly
     STATUS.md. After steps 1–2 the expected share is ~6–8k (CLAUDE.md ≤ 900 words, a 400-word STATUS index,
     INTERVIEW.md). The run also showed the mode question was jargon to a client; it's now in plain words.
   - **So it's cheap only if the slimming works:** ~$0.25 per run with Sonnet, more with Opus. Not "a few tokens",
     but fine when it runs only on pushes that change `CLAUDE.md`, any nested `CLAUDE.md`, `.claude/`, `brief/` or
     `STATUS.md`, plus a manual button.
   - **Pass/fail budget** (checked against the control's context, re-measured whenever the Claude Code version
     changes, so harness growth isn't blamed on the repo):
     - repo share of context at the first question ≤ 12k tokens;
     - files opened before the first question only from `brief/`, `.claude/skills/`, the root STATUS index, and the new
       piece's own `proj/<name>/`;
     - it asks before it designs (no Write or Edit attempts, ends on a question);
     - cost ≤ $0.35.
   - **When it fails, it switches itself off:** the workflow opens a GitHub issue labeled `eval-over-budget` with the
     numbers, the files it opened and the first 200 lines of the stream (the full log attached to the run as an
     artifact). Its first step on every later run is "is an `eval-over-budget` issue open?"; if so, it skips. Closing
     the issue after a fix turns it back on. No repo writes, no settings to flip.
   - **Who pays:** CI needs an `ANTHROPIC_API_KEY` repo secret (API billing, separate from a Claude subscription).
     Without one, the same script runs locally on the subscription and prints the same verdict; Bryan's call.
   - The empty-folder run is also the best argument for the interview: with no repo rules, the model started
     designing and filled the gaps with guesses.

## Decisions (Bryan, Oct 25)
- Per-piece status: a separate `STATUS.md` in each folder, never inside the folder's CLAUDE.md. General rule: lazy by
  default (Mechanisms), to save context and to keep the model unbiased until its first top-level design.
- Taste: public and on by default for everyone, since most first prompts carry weak taste; a project overrides it
  item by item, with a reason (step 5).
- Hooks: record and measure first (step 9); block only if the numbers say so.
- No format is assumed: no loop, hallway or school until the client says so; taste items carry conditions instead of
  named presets (step 5), and tier 0 is client-neutral, with Bryan's context in `brief/clients/bryan.md` (step 1).
- Sound gets the same lockout as picture (Gemini's suggestion, adopted with two changes): it follows the mode gate,
  so in efficient mode sound opens with the toolbox like everything else; and the sound concept is written at the
  storyboard stage, after the picture's concept exists, so the sound is scored to it.
- The first-question eval runs only if it stays cheap, and it switches itself off with an issue when it doesn't (step 10).
