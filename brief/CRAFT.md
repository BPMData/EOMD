# Craft: from approved brief to approved storyboard

Read this after the brief is approved and before the first concept. It is for the model, not the client, and no tool
is in view yet. The interview and the template are `INTERVIEW.md` and `TEMPLATE.md` (craft bar §14, checks §17). The
Academies brief (`example-academies.md`) shows the process (a full brief, one signature idea with seven variations, a
storyboard); it is never a style to copy. Nothing here assumes a format: where the brief's "How it's watched"
matters, the condition is stated.

## 1. From brief to concept
- **One sentence first.** The single-minded message: what a viewer who catches three seconds must take away. If it
  needs "and", cut. Every beat serves it or goes.
- **Viewing context before anything else.** Screen size, distance, light, sound, and whether people sit, walk past or
  scroll decide the pace, the type size and whether the story may depend on sound or on order.
- **Find the signature idea.** One visual thought grown from this subject (a brand shape, how the system works, a
  word made literal) that recurs and that a viewer could describe afterward in a sentence. Test: would it be wrong
  for any other client? If not, keep looking.
- **A system with variations.** Set the rules once (grid, palette roles, type scale, how things enter and leave, how
  the signature idea behaves), then let each beat vary them, so every beat is specific to its content yet plainly
  part of the whole. Variation lives in content and staging, not in switching styles.
- **The subject's clichés are off the table.** List them (gears for engineering, light bulbs for ideas, binary rain
  for computing) and avoid every one.

## 2. Pitching concepts
Offer 2–3 directions that differ in idea, not in color, each a few lines in everyday words: **the idea** in one
sentence; **what they'd see** (the opening, the signature idea at work, the ending or, if it repeats, how it comes
round); **how it feels** in three words and what it steers away from; **sound** in one sentence, described as sound,
not in technical terms; one still or sketch each where possible. Say which you recommend and why. The client picks or
mixes; the verdict goes into the brief's Decisions log in their words.

**Choice panels.** Whenever the client chooses between things (concepts, a look, a hero moment, a sound), show, don't
describe: one offline HTML page, up to six options in a 3 × 2 grid, each a still, a ~15-second clip or a sound
sample, with a short plain-words label and a letter to answer with ("B, but slower"). During design the options are
stills or sketches made for this piece; clips and sound samples come once the tools open. The page template is
`.claude/skills/toolbox/choice-panel.html` (open only that file, not the toolbox).

## 3. Storyboard and stills
**The storyboard** lives in `proj/<name>/storyboard.md`: one table, one row per beat.

| Time | On screen | Sound |
|---|---|---|
| 0:00–0:04 | What is where, what moves, what the viewer reads, how the beat enters and leaves | Music state; any synced sound |

Each row must prove: what the viewer reads, in what order; where the eye is; how the beat enters and leaves; what
changes now and why now. Above the table: total length, which beat carries the signature idea and, if it repeats,
which row is the seam and how it returns.

**Stills** (2–3 frames at the real aspect ratio) prove the look: type at its real size for the distance, the palette
with its roles (background, hero, support, accent), the signature idea at its best moment, and one supporting beat.
At 25% scale the hero line must still read. Nothing is lifted from earlier work.

**The sound concept** is written at the same stage, after the picture exists, so it is scored to the picture
(its parts are in `STORYBOARD.md`, the storyboard template).

## 4. Motion craft
- **Everything moves for a reason:** to lead the eye, to reveal in reading order, to show how things relate. Motion
  that only decorates is cut.
- **Weight.** Anticipation before a move, overshoot and settle after it, follow-through on the parts that trail.
  Things arriving decelerate into place; things leaving accelerate away.
- **Stagger.** Groups enter in sequence with short, uneven offsets, never all at once and never like a metronome.
- **Transitions carry meaning.** Match cuts on shape, position or color; shapes morph into the next beat's forms;
  camera-style pushes, pans and parallax move the viewer through the piece. Two or three kinds, used with intent; ten
  read as a demo.
- **Rhythm.** Cuts and hits land on the music's beats and phrases. Hold still long enough to read: time to say the
  line aloud twice, longer at a distance or for someone walking past.
- **Contrast of pace.** Fast passages need slow ones. A piece at one speed is wallpaper.
- **Endings.** A single showing lands: a resolved frame, a held message, a final sound. If it repeats, the loop is a
  breath, not a restart: the last beat returns to the opening state inside the motion, mid-shot, with no fade to
  black and no bump in the music.
- **Never** more than three flashes a second.

## 5. Type for the screen
- **Sizes from the brief, not from habit.** A phone in hand, a laptop at arm's length and a TV across a hall are
  three different pieces. Far screens want heavy weights, generous tracking and short lines; thin weights and small
  text vanish there.
- **Hierarchy at a glance:** one hero, one level of support, nothing between. Two type families at most.
- **Contrast.** Every text/background pair meets at least WCAG AA, stronger in bright rooms; dark text on light
  brights (yellow, pale teal), never white.
- **Kinetic type where it earns it.** Words move when the movement says something about the word; otherwise they
  arrive, hold, leave.
- **Copy is sacred.** Fixed copy appears word for word; nothing is invented to fill a layout.
- **More than one language** when the audience needs it: a flourish (a cognate morphing across languages) or full
  translations, as the brief says, with the checker named. Fit the layout to the longest version.

## 6. Sound for where it plays
- **Plays once, sound on** (a screening, a projector): music may carry structure, build and resolve; effects synced
  to the key moves, mixed under.
- **Sound off or unreliable** (a muted feed, a loud room): the picture tells the whole story. Design it that way from
  the storyboard, not as a fix.
- **Repeats, heard by the same people** (a screen in a shared room): steady and warm; no big drops, no piercing
  tones, nothing like a bell or an alarm; sections that thin out and come back, so the 200th play is bearable; a loop
  point nobody can find by ear.
- **Silence is a choice.** Some pieces are better with none, or with sound at one moment only.
- Loudness and peak targets come from the brief, §11 and §15.

## 7. Directions to choose from
Choose deliberately, for the subject and the viewer; mix two at most. Among many: Swiss / editorial type · flat
vector illustration · 2.5D paper and cut-outs · isometric · collage and torn paper · data-graphic and diagrammatic ·
generative and procedural · kinetic typography · line drawing and blueprint · chalk and hand-drawn · retro-computing
and pixel · brutalist and raw · liquid and organic · architectural and monumental · comic panels · stop-motion feel ·
neon and night · analog film and print texture · geometric abstraction. Each serves some subjects (diagrammatic for
how a system works, cut-out paper for warmth) and cheapens others. Name the direction in the concept so the client
can react to it.

## 8. Anti-patterns (the client's verdicts)
- Captions over unrelated wallpaper: a text track and a picture track that don't know about each other. "Looks bad."
- Effects chosen because they exist, not because the beat needs them. "Cheesy as hell."
- Slideshow logic: card, transition, card, transition.
- Default easings and uniform timing: everything arriving the same way.
- Template feel: a look that could belong to any client.
- The subject's clichés; stock-corporate energy; "the future".
- A loop that fades out and starts over.

## 9. The medium's envelope
What is possible here:
- Anything drawn procedurally in real time on an HTML canvas: vector shapes, type, particles, fields, projected 3D,
  procedural texture.
- Music and sound effects synthesized in code, to a loudness target.
- No photos, footage, stock, remote assets or narration; fonts embedded from open-licensed files.
- One self-contained offline HTML file; an ordinary laptop or office PC is the slowest target.
- Export to MP4 exists.

## 10. Self-check before the client sees anything
- Could someone who caught three seconds say what it's about?
- Can I state the signature idea in a sentence, and would it be wrong for another client?
- Does every beat share the system and still feel specific?
- Is each move there for a reason? Any transition chosen because it exists?
- Is anything a caption over wallpaper? Any slideshow?
- Is the hero line readable at 25% scale?
- If the sound may be off, does the picture carry it? If it repeats, could I bear the 200th hearing?
- Does the ending land, or the loop breathe?
- Is every fact and word from the brief, nothing invented?
- Is it free of the subject's clichés?