# Interviewing the client

Every new piece starts with an interview and doesn't leave it without an approved brief
(`proj/<name>/brief.md`, made from `TEMPLATE.md`). First requests are short ("make a promo for PLTW"), and a
piece built from one sentence gets assembled from whatever parts are lying around. The repo's best piece, the
Academies film, came from an 1,800-word brief (`example-academies.md`). The interview gets any client to a brief
like that without making them write it.

It works in any chat, not only in this repo: paste this file and `TEMPLATE.md` into a new conversation.

## When
- Every NEW piece made for an audience: a video, poster, player, screensaver, promo, or a cartridge made for a purpose.
- Not for a change to an existing piece (log the change in its brief's Decisions log), and not for a tool demo with no audience.

## How to run it
- **Look before you ask.** Read what the repo already holds (`proj/<name>/`, brand files, copy files, an older brief)
  and ask the client to confirm it, not to re-type it.
- **Small rounds.** 2–3 questions per message, tops, most important first; the client may answer in shorthand. Add
  an example answer only when a question could be misread. Suggested order: sections 1–2, then 3–5, then 6–13, then
  16–18; skip what's already answered.
- **Confirm instead of asking** whatever the repo or earlier answers already imply: one line of assumptions and
  "right?" covers several ★ questions at once.
- **Ask about the problem, not the solution:** who, where, why, what should change. Not "which effects do you want?"
- **Talk to a non-technical client.** Picture someone organizing a church tag sale who has never made a video: short
  sentences, no jargon ("cartridge", "layer", "LUFS", "hex", "mode", "WCAG" stay in the brief, never in the
  questions). The questions below are what to find out; put them in everyday words.
- **Ask in experience terms.** Not "which easing?" but "snappy or floaty?"; not "what LUFS?" but "who hears it
  200 times a day?"
- **Turn vague words into choices.** "Modern", "clean", "fun", "pop" mean nothing until pinned down: offer contrasts
  (calm or punchy? flat or 3D? type-led or picture-led?) or ask for one reference they love and one they hate, and why.
- **Ask why, and keep the reason.** A rule with a reason lets the designer handle cases the brief didn't foresee
  ("hallways are loud, so the film must make complete sense with the sound drowned out").
- **Hunt the landmines:** words the piece must never say, promises it must never make, things it must never rank.
  (Academies: never "choose" or "pick" an academy, never promise placement, no academy above another.)
- **Facts come from the client, with a source.** Never fill a gap yourself; keep a running list of what's missing.
- **Reflect back** in one sentence per round ("So: a 30-s loop for the cafeteria TV, sound off, for 9th graders
  who've never heard of PLTW."). Misreadings surface while they're cheap.
- **Delegation must be explicit.** "You decide" is a fine answer for concept, design and music ("Concept, script,
  design system ... are all yours"). It is never an answer for the facts, the message, the audience or the landmines.
- **Closed questions as buttons** where the tool allows (Claude Code: `AskUserQuestion`, up to 4 questions with
  2–4 options each); open questions in plain text.
- **"Just make something."** Explain once that ten minutes of questions cost less than a rebuild. Then ask only the
  ★ questions; whatever is still unanswered goes into the brief as a flagged assumption, shown at approval.

## Questions
★ = every piece, both modes. The rest: full creative pieces, where they apply. Numbers = sections of `TEMPLATE.md`.

**1. The ask**
- ★ What is it, where will it be seen, and by when? *"A 90-second video for the robotics club's open-house night,
  shown once on a projector, by Nov 15."*
- ★ How to build it, in Claude-usage terms (numbers from "Usage estimates" below; say they are rough):
  "There are two good ways to make your video:
  1. **Ready-made styles (quicker).** Built mostly from designs this kit already has. It uses a small part of your
     Claude usage: roughly 5–20% of one 5-hour limit.
  2. **From scratch (most original).** Designed only for your video. It uses a lot: roughly half to all of one 5-hour
     limit. It's best to start it just before your limit resets, or before you step away for a few hours (overnight,
     or before work), and check back later.
  Either way there's no surprise bill: if you hit your limit, Claude stops (unless you've switched on paid extra
  usage), and you pick up where you left off after it resets. Which would you like?"
  (Ready-made styles = efficient mode; from scratch = full creative mode. The numbers assume a Pro plan and the
  recommended setting, Opus 5.5 at medium effort; a bigger plan uses a smaller share.)

**2. Purpose and tone**
- ★ After watching, what should a viewer know, feel and do? One line each.
- What do they believe now, and what should they believe after?
- ★ Three words for the tone, and what it must NOT feel like. *"Confident, warm, a little playful. No 'the future',
  no stock-corporate energy."*

**3. How it's watched** (this drives every design decision)
- ★ Which screen: size, landscape or portrait, how far away, how bright the room, what speakers?
- ★ Do people sit and watch, or walk past and catch three seconds? Will anyone see it from the start?
- ★ Does it play once, or repeat (a loop on a screen, a playlist, a social feed)? If it repeats, who sees and hears it
  over and over? Never assume either until the client says.
- ★ Is the sound on, off, or unreliable (a noisy room, a feed that autoplays muted)?
- What plays it (a laptop, a TV, a phone, a projector, a video upload), and who presses start?

**4. How the subject works**
- What's the system or story behind it that the piece must get right? *(Academies: every 9th grader starts in
  Exploration, ranks pathways, and placement is by lottery.)*
- ★ What must it never say or imply?

**5. Content and facts**
- ★ Every name, date, number, program and place that must appear, and where each one comes from.
- ★ Is any copy fixed word for word? Where's the file?
- Real details we may show (verified), and areas where we must not invent any?

**6. Structure and hierarchy**
- One message or several beats? What's the hero of each, and what's supporting?
- Must every beat make sense on its own? How often must the name or message be readable? Minimum hold for a message card?
- How long is the attention window, and how long the whole piece?

**7. Brand and contrast**
- ★ Colors, fonts, logos, any brand rules (a logo file or a website to match is enough; find exact color codes from
  it). Which are must-haves? Then check contrast yourself (yellow and light teal are the usual traps).

**8. Visual language**
- Brand shapes, symbols, nicknames or motifs that could become the signature idea? *(Academies: badge = circle
  holding three hexes; the spiral logo; the Hatters.)*
- Anything to build from but never copy (logos, badges)?
- An idea for the spine already? (Optional; the designer may beat it.)

**9. Language**
- ★ Who reads it? English learners: which languages, which lines, cognate flourishes or full translations, and who
  checks the translations?

**10. Call to action**
- ★ Is there a next step for the viewer? What is it? (Never invent URLs, deadlines, QR codes or contacts.)

**11. Music and sound**
- What should it sound like? If it repeats: what would drive people mad on the 200th play (bells, alarms, piercing
  tones, big drops)?
- Sound effects synced to the motion, or music only?

**12. Hard limits**
- Claims we can't make (statistics, awards, rankings), people we can't show (photos, faces, names), anything admin
  or legal won't allow?

**13. Taste references**
- ★ One thing they love and one they hate (any medium), and why.
- Past verdicts that apply? (PLTW r1, Oct 20: captions over unrelated visuals "looks bad"; more in STATUS.md and the
  briefs' Decisions logs.)

**14, 15, 17. Craft bar, technical, QA:** the template has defaults; ask only "anything to add or relax?"

**16. Deliverables**
- ★ Which files: HTML player, MP4 (with and without sound), a portrait version, a ZIP? Where does it get published?

**18. Approval and success**
- ★ Who else signs off (principal, department, brand office)? Bring them in now, not at the end.
- What would make them say "that's it"? How will we know it worked?

## After the interview
1. **Reflect back** the whole piece in one paragraph, plus the open questions.
2. **Draft the brief:** copy `TEMPLATE.md` to `proj/<name>/brief.md` and fill it in, in the client's words where
   possible, with the reasons kept. Mark gaps **ASK** and Claude's drafts (translations, suggested copy) **DRAFT**. Commit.
3. **Approval.** The client reads it and approves or edits it. No design work before this.
4. **Concepts:** read `brief/CRAFT.md` first (brief to concept, how to pitch, storyboard and still formats, the
   self-check). Then 2–3 distinct directions, a few lines each (signature idea, structure, look, sound). The client
   picks or mixes. In efficient mode the directions come from what the existing tools can do.
5. **Design before tools (full creative mode):** a storyboard (a table: time | on screen | sound;
   `brief/CRAFT.md` has the format), 2–3 still frames and a written sound concept (what sound does, pulse,
   instruments and textures as sounds, how it meets the key moments, how it ends), made from the brief alone. Don't open `gen/`, the
   cartridges or other pieces' code until the client has seen them. Then pick tools: reuse the plumbing (the DSP,
   `tools/render_piece.py`, `tools/html_to_mp4.py`, `tools/gen_export.py`, the loudness checks), never a look
   borrowed from another piece.
6. **Build** in the stages of CLAUDE.md's Process. Every verdict ("approved", "looks cheesy") goes into the
   brief's Decisions log, in the client's words.

## Usage estimates
Written for the people this kit is for: someone with a Pro plan ($20/month) who has never made a video, not a
developer on pay-per-use. The ranges in the mode question are rough: no piece here has had its usage recorded yet.
Every brief now logs it (the status line's `Usage:` line: model, effort, and the share of a 5-hour limit each stage
used, as the Claude app or Claude Code shows it). After three pieces in a mode, replace that mode's range with what
was measured. Usage grows with how much new design and code a piece needs, not with its length: an extra minute
built on the same design costs far less than the first one.
