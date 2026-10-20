# Score format (style "comp4")
A score is a small JSON recipe; `audio__arranger.js` performs it forever without repeating. The same seed always gives the same performance.

| Field | Meaning |
|---|---|
| `id`, `title`, `notes` | Name and description (shown in the jukebox) |
| `style` | `"comp4"` (default), `"film24"`, `"rounds"`, `"lounge"` (see below) |
| `bpm`, `bars`, `tail` | Tempo; bars per section (8); seconds of ring-out carried into the next section |
| `master_db` | Loudness trim. Never hand-edit; `tools__calibrate.py` sets it for −23 LUFS |
| `progressions` | List of progressions; each is 4 chords of `[bassMidi, [4 voicing midis]]`, 2 bars each. Sections rotate through them |
| `pad` | `cut` (lowpass Hz), `gain`, `send` (reverb) |
| `bass` | `gain` (root, held), `gain2` (fifth on beat 3 of bar 2), `send` |
| `comp` | `inst` (any `audio__instruments.js` name), `gain`, `stabGain` (answering stab), `send`, `prob` [base, extra] = chance of the answering stab |
| `melody` | `root` (midi of scale degree 0), `scale` (semitones), `start` (first degree), `range` [lo, hi] degrees; `lead`/`gain`/`send`; `alt`/`altGain`/`altSend` (used every `altEvery`-th section); `themeEvery` (new motif every N sections); `restEvery` (every Nth section has no melody) |
| `reverb` | `size` (0–1), `wet` |

## Rules of thumb for reading rooms
- Keep everything under ~3 kHz: no drums, no vocals, nothing bell-like.
- Use pentatonic scales over maj7/9 chords.
- A motif returns varied every section. Shift `themeEvery`/`restEvery` to taste.

# Style "film24" (fixed seamless loop; see `score__academies-hallway.json`)
A ported film soundtrack, not a generative piece: every section is the same `bars`-bar loop on circular buffers (`tail` 0), so sections join with no gap. `seed` is ignored. Use it when a piece must stay note-for-note identical.

| Field | Meaning |
|---|---|
| `bpm`, `bars`, `tail`, `master_db`, `tonic` | As comp4; `tonic` = MIDI root, only used by the jukebox to show the key |
| `leadTarget` | K-weighted dB each lead is level-matched to before mixing (−18) |
| `chords` | One entry per bar, cycling: `bass`, `pad` (4 midis), `keys` (4 midis) |
| `bed` | Constant groove: `kick.hits` `[step,gain,"odd"?]`; `snap`; `shaker` (`seeds`, 4-step `pattern`, `vary`, `jitter`, `pan`); `bass.notes` `[step,interval,lenSteps,vel]`; `pad`; `seed` (shaker humanising) |
| `leads` | In mix order. Each: `id`, `bar0`, `bars` (span used for level-matching), `inst` (any instrument), `pan`, `send` (reverb), `echo`, `durMul` (note length × this), optional `gain`, `trim`, `seeded` (passes the note index as seed), `hits` (extra percussion `{inst,steps,gain,pan}`) |
| lead `notes` | `[step16, midi, lenSteps, vel, gain?, pan?]`, steps counted from the lead's `bar0` (16 steps per bar) |
| `fx` | `echo` (`time` in beats, `fb`, `lp`, `toWet`, `toMix`), `reverb` (`size`, `damp`, `width`, `hp`, `lp`, `mix`), `bus` (`hp`, `shelfHz`, `shelfDb`) |

# Style "rounds" (20-min study loop; see `score__corporate-calm.json`)
Form: `rounds.length` rounds, each = every air in `airs` for `airBars` bars, led by that round's variation list; a `drift` section after every `blockEvery` rounds. Fully deterministic (seed ignored); the loop is seamless. `bars` is the **section** size (2), not the form length: sections overlap-add by their ring-out (`tail`, seconds: 4 s note tails + effect decay), and index wraps at the end of the form.

| Field | Meaning |
|---|---|
| `bpm`, `bars`, `tail`, `master_db`, `tonic`, `leadTarget` | As film24 (`bars` = 2 per section) |
| `chords`, `progs`, `progOrder` | Chords `{bass midi, pad midis}`; named 4-chord progressions; round r uses `progOrder[r % 4]` |
| `blockKey`, `blockEvery` | Transposition (semitones) per block of `blockEvery` rounds (D → F → A) |
| `airs` | `id`, `inst`, and either `notes` `[step16, midi, lenSteps, vel]` (32 steps = 2 bars), `stabs` (keys: rhythm only), or nothing (pluck/pulse: arpeggio follows the chords) |
| `rounds` | One list of variations per round, played back to back over 32 steps each (`aug` = 64). Variations: `o` original, `s1`/`s-1` scale step, `inv` invert, `retro` reverse pitches, `disp` shift 3 steps, `oct` octave jumps, `thin` every other note, `aug` half speed |
| `calmLead`, `mix` | A round led by `calmLead` uses `mix.calm` (kick/snap/shaker/bass levels, `lvl` dB for the lead) |
| `drift` | `air` to use, `bars`, `prog`, `lead` variations, `mix` |
| `scale`, `ranges`, `arp` | Pentatonic degrees for the variations; allowed midi range per voice; arpeggio patterns per variation |
| `bed` | Kick, snap, shaker, bass (patterns for even/odd rounds), pad levels |
| `fx` | `srcTail`, `lead` (pan by air parity, reverb/echo sends), `echo`, `reverb`, `bus`, `clip` (soft clipper; only acts above 0.6 FS, i.e. never at −23 LUFS) |

# Style "lounge" (Encyclopedia Lounge bossa; see `score__encyclopedia-lounge.json`)
Endless and seeded, like comp4: 8-bar sections + `tail` s of ring-out, overlap-added. A jazz-tune form: the **head** (the authored tune) every `headEvery` sections, generative **choruses** in between. Needs `audio__instruments-cdrom.js` (rim, bleep, loungeVibes). Written for the CD-ROM screensaver's work-time music, not reading rooms: it has drums and bells on purpose.

| Field | Meaning |
|---|---|
| `bpm`, `bars`, `tail`, `master_db`, `tonic` | As comp4; `tonic` (MIDI) is only for the jukebox's key label. `human` = random late-timing in seconds (0.003) |
| `keys`, `keyEvery` | Semitones above G, one per block of `keyEvery` sections (`[0, 3, 0, -4]` = G, B♭, G, E♭). The last bar of a section re-aims its turnaround at the next block's key |
| `headEvery` | Section i is the head when `i % headEvery === 0`; every other head adds the vibraphone double |
| `progs` | 8-bar progressions. One entry per bar: `[[bass, [voicing]]]`, or two chords `[[…],[…]]` for half-bar changes. Written in G; the key moves them |
| `chorusProgs` | Which `progs` the choruses cycle through |
| `head` | `prog` (index into `progs`) and `mel`: 8 bars of `[step16, midi, lenSteps, vel?]`. Its bar rhythms are also the rhythm cells the choruses build motifs from |
| `melody` | `lead` (instrument for the main voice; `marimba` sounds an octave below its argument, the style compensates), `home` (starting pitch, MIDI), `range` [lo, hi] MIDI in G; `themeEvery` (new motif every N choruses), `altEvery` (every Nth chorus the vibes lead), `restEvery` (every Nth chorus is a breather: no lead, soft vibes arpeggio), `split` (bars answered by the vibes, 0-based), `cadences` (rhythm cells `[step, lenSteps]` for bar 8) |
| `bed` | `walkUp` (chance of a chromatic bass walk-up into the next bar), `fill` (chance of a rim pickup at the end of a chorus) |
| `mix` | Per part `{g, pan, rev, dly}`: `lead`, `vibes` (answers / alt lead), `double` (head double), `arp` (breather), `bass`, `kick` (+ `v` velocity), `gtr`, `rim`, `shaker`, `bleep` (+ `prob` per pickup) |
| `fx` | `reverb` (`size`, `damp`, `lp`, `wet`), `delay` (`beats`, `fb`, `lp`, `wet`), `post` (`hp`, `lp` Hz; the C() "SNES skin") |
