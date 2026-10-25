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
| 0:24–0:30 (bars 13–15) | The cursor line drops off the last Python line; **Academy Red** (#D50032) rises from the bottom. The PLTW lockup slides out; the Academy badge and **"Information Technology & Cybersecurity Academy · Danbury High School"** slide in. The line becomes a wire from a micro:bit to a soil sensor in a potted plant. The soil dries and the plant droops; a stack snaps: `forever` holding `if analog read pin P0 < 300 then` / `digital write pin P1 to 1`. A small pump drips water, the plant lifts, and the micro:bit's lights make a smile. Hero, white, two lines: **"Build things that sense the world around them."** Tag: **BBC micro:bit**. | Key lift (up a step) as the red rises. Clicks for the snaps. A soft water-drop pluck on the beat as the pump runs. |
| 0:30–0:38 (bars 16–19) | The line climbs out of the micro:bit's edge connector and lifts a CoDrone EDU. Now it's Python, not blocks: each line arrives on a dark code strip that snaps into place like a block (`drone.takeoff()`, `drone.set_roll(50)`, `drone.move(1)`, `drone.hover(2)`, `drone.land()`), and the drone does each one as it lands: lifts, slides right, holds, settles. The line grows ahead of it as its flight path. Hero, white: **"Code things that fly."** Tag: **CoDrone EDU · Python**. **Still 3.** | Drums drop to half-time as the drone lifts (contrast), then return. A soft whir under the drone, mixed far back. |
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
- `stills/still-3-fly.png` (row 6, 0:35): proves the Academy world (red, badge, Academy name, no PLTW logo), Python
  lines snapping like blocks, and the drone flying the line.

**Contrast (computed):** dark ink on yellow 13.8; white on Danbury Blue 10.6; yellow on Danbury Blue 7.3; white on
PLTW Blue 7.8; white on Academy Red 5.4. Block text, white at 34 px (large text): on MakeCode blue 3.2, green 3.1,
teal 3.0, red 5.2, purple 4.7. The blue, green and teal blocks only just pass the large-text minimum (3.0); that's
the editors' own coloring, kept so the blocks look real.

## Sound concept: three directions (Bryan picks one)
All three share the same rules: the picture never depends on the sound (loud halls, maybe muted); 120 beats a
minute so snaps land on beats and each row turns on a 2- or 4-bar phrase; no ending, so the last bar leads straight
into bar 1; a breather under the end card (T07); a change of pace in the Academy part (T08); no bells, alarms,
piercing tones, risers or drops (T09); nothing tinny or buzzy (T10); checked on laptop speakers (T11); real chord
changes and a counter-line, not one riff (T13). Loudness −16 LUFS, true peak ≤ −1.5 dBTP. Samples (about 15 s each)
come right after the toolbox opens, so the final pick is made by ear (T04).

### S1. Snap Groove (the current idea)
- **Sound:** a bright, bouncy groove. Round plucked bass, clean electric piano chords, a soft wooden mallet line
  doubled by the piano, a light dry drum kit, and a wooden click every time a block snaps in. 120 beats a minute.
- **Meeting the picture:** the clicks are the snaps; the bass starts walking on the road (row 3); a counter-melody
  arrives with Python (row 4); a key lift as the red rises (row 5); half-time drums as the drone lifts (row 6).
- **Feels:** playful, clicky, friendly. **Risk:** the most "kids' edtech" of the three.

### S2. Glass Lobby
- **Sound:** the music playing in your Neo-New York glass lobby. Smooth, sleek late-80s fusion pop: a warm, slightly
  slapped bass, lush jazzy chords on a soft electric piano and a clean chorused guitar, airy pads, a crisp but gentle
  drum machine, finger snaps for the block snaps. 120 beats a minute but laid back, with real chord changes and a melodic hook.
- **Meeting the picture:** the hook enters with the first app; a guitar fill answers each tool name; a key lift and a
  short guitar or string solo in the Academy part; the end card thins to pads, bass and snaps.
- **Feels:** confident, polished, utopian. **Risk:** the slickest; it has to stay bright so it doesn't go "corporate".

### S3. Maker Bench
- **Sound:** music built from the sounds of making things. Interlocking wooden mallet and plucked-string patterns,
  hand claps, and percussion made from the picture's own events: block clicks, the car's tick, the pump's drip, the
  drone's soft whir, each tuned and placed on the beat, so the rhythm grows as things get built. 120 beats a minute.
- **Meeting the picture:** each row adds its object's sound to the beat (clicks, then the car, then typing, then the
  drip, then the whir), so the music literally gets built as the loop goes; the end card strips back to the
  mallets alone, then the clicks rebuild it.
- **Feels:** hands-on, clever, warm. **Risk:** the least "futuristic"; it leans "maker" over "glass tower".

**For the client:** S1 is bouncy and clicky; S2 is the smooth, sleek music of a glass-tower lobby; S3 is a beat built
out of the sounds of the things being made.

## Open before the build
- Poppins and the official PLTW logo files need downloading from Google Fonts and pltw.org (asked at the build).
- Block labels are drafts written to look like each editor. The drone code is Robolink's own example (Bryan's paste).
