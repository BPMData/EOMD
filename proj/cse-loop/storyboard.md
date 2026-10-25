# Storyboard: CSE hallway loop

Stage: storyboard · DRAFT (waiting for Bryan's approval)

Concept: **Snap + One Line** (Bryan: "a combo of A and C"). Written from the brief alone; no tool folders opened.
All on-screen words and block labels are **DRAFT**.

**Length:** 48 s, looping (24 bars at 120 beats a minute; one bar = 2 s).
**Signature idea:** one bright line runs the whole loop. Wherever it stops, MakeCode-style blocks snap onto it, and
the stack turns into the thing it runs; the line carries on out of that thing (a phone's outline, a road, a cursor
under Python, a micro:bit's wire, a drone's flight path) into the next beat. Each field color change rides the line
as a wipe, so there are no plain cuts.
**Seam:** in row 7's last bar, the line sweeps in from the left and wipes yellow over blue. The loop point (0:48 =
0:00) falls in the middle of that sweep, so the picture is mid-motion and the music is mid-phrase.

**Two worlds:** rows 1–4 and 7 are the PLTW course (PLTW lockup bottom-left). Rows 5–6 are the Danbury Academy extras
(Academy red, Academy badge and name bottom-left; no PLTW logo on screen).

| Time | On screen | Sound |
|---|---|---|
| 0:00–0:04 (bars 1–2) | **Yellow** field (#FFD100), half-wiped over blue: the line (Danbury Blue, white glow) finishes its sweep from the left and stops center-left. Hero, dark ink, 96 px: **"Never coded? Start here."** A blue event block, `when Button1 .Click`, drops onto the line's end, overshoots and settles. Bottom-left: PLTW lockup + "Computer Science Essentials". | Groove already running (the seam is inside it). A soft wooden click as the event block lands, on beat 1 of bar 2. |
| 0:04–0:10 (bars 3–5) | Two blocks fly in and snap into the event's mouth on the beat (`set Ball1 .PaintColor to red`, `call Sound1 .Play`). The line leaves the stack to the right and draws a phone's outline, smoothly, its round head leading. The screen fills white; a "Tap me!" button presses itself; a ball turns red and bounces, exactly as the blocks say. Hero changes to **"Build your own apps."** Tag bottom-right: **MIT App Inventor** (the bee small beside it, optional). **Still 1.** | Two clicks for the two snaps. A light, gliding tone follows the line's head (soft, filtered, never a riser). A short bright chord stab when the ball turns red. |
| 0:10–0:18 (bars 6–9) | The line drops out of the phone's bottom and sweeps right to left; **Danbury Blue** (#0033A0) wipes in behind it, and the line lies down as a white road. A VEXcode stack snaps: `when started`, `drive forward for 200 mm`, `turn right for 90 degrees`. A yellow, Lego-like robot car rolls in and drives the road: forward, then a right turn, matching the blocks. Hero, white: **"Program self-driving cars."** Tag, yellow: **VEXcode VR · VEXcode EXP**. **Still 2.** | Bass starts walking; drums add a rim click. Three clicks for the stack. A soft, low motor-like hum under the car, mixed far back. |
| 0:18–0:24 (bars 10–12) | The car drives off right; **PLTW Blue** (#3e34d9) wipes in. The same VEXcode stack slides left, and beside it the same program types in as Python, one line per block, each block lighting up as its line appears: `drivetrain.drive_for(FORWARD, 200, MM)` / `drivetrain.turn_for(RIGHT, 90, DEGREES)`. The line becomes a cursor underline. The blocks fade; the Python stays. Hero, white: **"Then write it in Python."** Tag: **Python**. | A counter-melody enters. Soft typing ticks on the beat (not every letter). |
| 0:24–0:30 (bars 13–15) | The cursor line drops off the last Python line; **Academy Red** (#D50032) rises from the bottom. The PLTW lockup slides out; the Academy badge and **"Information Technology & Cybersecurity Academy · Danbury High School"** slide in. A micro:bit slides up; a stack snaps: `on button A pressed`, `show icon ♥`. Button A presses; the 5×5 lights fill in a heart, one row at a time (2.5 rows a second, no flashing). Hero, white: **"Code things you can hold."** Tag: **BBC micro:bit**. | Key lift (up a step) as the red rises. Click, click. A soft pop per lit row. |
| 0:30–0:38 (bars 16–19) | The line climbs out of the micro:bit's edge connector. A stack snaps: `on start`, `take off`, `move forward 50 cm`, `land`. A CoDrone EDU lifts off and flies the line's path up and right; the line grows ahead of it as its flight path. Hero, white: **"Code things that fly."** Tag: **CoDrone EDU**. **Still 3.** | Drums drop to half-time as the drone lifts (contrast), then return. A soft whir under the drone, mixed far back. |
| 0:38–0:48 (bars 20–24) | The drone flies out top-right; its path curves back down and wipes **Danbury Blue** in. End card, held about 7 s: hero **"Computer Science Essentials"** (110 px), the official **PLTW** logo, then **"No coding experience needed."** The word *experience* morphs to *experiencia* and *experiência* (ES/PT lines **DRAFT**: "No necesitas experiencia previa." / "Não precisa de experiência prévia."), then **"Ask your counselor about Computer Science Essentials."** In bar 24 the card slides away right and the line sweeps in from the left, wiping yellow (the seam). | A breather: drums thin to shaker, chords and bass only, so the message has room. The last bar's bass fill leads straight back into bar 1, with no ending chord. |

**Core message more than once per loop:** "Never coded? Start here." (row 1) and "No coding experience needed." (row 7).
**Course name:** the lockup through rows 1–4, and the end-card hero in row 7.
**Walk-up test:** every row has one hero line and one picture that show the same thing.

## Stills
Made by `stills/make_stills.py` (Run in Thonny; uses Bryan's local `MakeCode/` block shapes). 1920×1080. Type is
Avenir standing in for Poppins; "PLTW" is a stand-in for the official logo.
- `stills/still-1-apps.png` (row 2, 0:08): proves the yellow field with dark type, real-looking MakeCode blocks at a
  readable size (34 px text), and the line drawing the phone.
- `stills/still-2-cars.png` (row 3, 0:17): proves the signature idea at its best (line → road; blocks → a car that
  does what they say), the yellow Lego-like car, and white and yellow type on Danbury Blue.
- `stills/still-3-fly.png` (row 6, 0:35): proves the Academy world (red, badge, Academy name, no PLTW logo), the
  micro:bit and the drone on the line.

**Contrast (computed):** dark ink on yellow 13.8; white on Danbury Blue 10.6; yellow on Danbury Blue 7.3; white on
PLTW Blue 7.8; white on Academy Red 5.4. Block text, white at 34 px (large text): on MakeCode blue 3.2, green 3.1,
teal 3.0, red 5.2, purple 4.7. The blue, green and teal blocks only just pass the large-text minimum (3.0); that's
the editors' own coloring, kept so the blocks look real.

## Sound concept
- **What sound does here:** music with a few soft sound effects tied to the snaps. The halls are loud and the sound
  may be muted, so the picture never depends on it; the music adds bounce for whoever can hear it.
- **Pulse:** 120 beats a minute, one bar every 2 seconds. Every snap lands on a beat, and each beat change (rows)
  falls on a 2-bar or 4-bar phrase, so the cuts feel locked to the music.
- **Instruments and textures:** a round, warm plucked bass; bright, clean electric piano chords; a soft wooden mallet
  line doubled by the piano (so it doesn't vanish on small speakers); a light, dry drum kit (soft kick, rim click,
  shaker); a wooden click for every snap; a soft gliding tone that follows the line's head.
- **Meeting the picture:** row 1–2, the groove and the snap clicks; row 3, the bass starts walking under the road;
  row 4, a counter-melody arrives with the Python; row 5, a key lift as the red rises; row 6, half-time drums as the
  drone lifts off, then back; row 7, a breather under the end card.
- **The ending:** no ending. The last bar's bass fill leads straight into bar 1, mid-phrase, so the loop point
  can't be found by ear.
- **Taste items:** T07 (the end-card breather thins out and comes back), T08 (key lift and half-time passage), T09
  (no bells, alarms, piercing tones, risers or drops), T10 (nothing tinny or buzzy; never opens on a harsh sound),
  T11 (checked on laptop speakers; the mallet is doubled), T13 (real chord changes and a counter-melody, not one
  riff). Loudness −16 LUFS, true peak ≤ −1.5 dBTP.
- **For the client:** a bright, bouncy groove with a little wooden click every time a block snaps in. It changes key
  for the Academy part and relaxes under the end card, then rolls back into the start without a bump.

## Open before the build
- Poppins and the official PLTW logo files need downloading from Google Fonts and pltw.org (asked at the build).
- Block labels are drafts written to look like each editor; the CoDrone EDU blocks especially need Bryan's check.
