"""
render_samples.py -- renders 16-second sound samples (any style, with an optional snap sound) for the CSE hallway loop and
builds a choice panel with the samples inlined, so it works offline. Set VARIANTS and PANEL_FILE below.
Press Run in Thonny. Needs Node.js and ffmpeg. Uses tools/render_piece.py for loudness and true-peak limiting.
"""
import os, sys, json, base64

# ============================ SETTINGS (edit these) ============================
VARIANTS    = [("S2", "mallet", "stick"), ("S2", "mallet", "tight")]   # (style, snap or None, snare or None)
PANEL_FILE  = "choices-sound-snare.html"
PANEL_TITLE = "CSE hallway loop: which drum on beats 2 and 4?"
PANEL_ASK   = ("Glass Lobby with the mallet snaps, and the brushy drum replaced. Same 16 seconds, same loudness. "
               "Answer with a letter.")
TARGET_LUFS = -16.0          # hallway level (brief section 11)
CEILING     = -1.5           # dBTP
# ===============================================================================

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import render_piece as rp  # noqa: E402

LABELS = {
    "S1": ("Snap Groove", "Bright and bouncy: round bass, electric piano, a wooden click on every block snap."),
    "S2": ("Glass Lobby", "Smooth late-80s fusion pop: slap-style bass, lush keys, clean guitar, finger snaps."),
    "S3": ("Maker Bench", "Interlocking mallets and plucked strings; the snaps, clicks and the car's tick become the beat."),
}

SNAPS = {
    "wood": ("wooden clicks", "The block snaps use A's wooden click, tuned to B's key."),
    "mallet": ("mallet hits", "The block snaps use C's mallet, tuned to B's key."),
    "finger": ("finger snaps", "The original B."),
}

SNARES = {
    "gated": ("brushy snare", "The original (rejected): a noisy, gated snare."),
    "stick": ("cross-stick", "A woody knock on beats 2 and 4 (the stick laid across the drum), very little noise."),
    "tight": ("tight snare", "A short, punchy snare: more drum, a quick crack, no hiss tail, little reverb."),
}

def main():
    os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
    os.makedirs(os.path.join(HERE, "samples"), exist_ok=True)
    music = os.path.join(HERE, "music.js")
    opts = []
    for s, snap, snare in VARIANTS:
        tag = s + ("-" + snap if snap else "") + ("-" + snare if snare else "")
        wrapper = os.path.join(ROOT, "dist", f"cse-loop-{tag}.js")      # dist/ is git-ignored
        open(wrapper, "w").write(f"globalThis.CSE_STYLE = {json.dumps(s)}; globalThis.CSE_SAMPLE = true; "
                                 f"globalThis.CSE_SNAP = {json.dumps(snap)}; globalThis.CSE_SNARE = {json.dumps(snare)};\n"
                                 f"eval(fs.readFileSync({json.dumps(music)}, 'utf8'));\n")
        rp.PIECE = os.path.relpath(wrapper, ROOT)
        rp.OUT_WAV = os.path.join(ROOT, "dist", f"cse-loop-{tag}.wav")
        rp.OUT_MP3 = os.path.join(HERE, "samples", f"{tag}.mp3")          # *.mp3 is git-ignored; the panel inlines them
        rp.TARGET_LUFS, rp.CEILING_DBTP = TARGET_LUFS, CEILING
        rp.main()
        data = base64.b64encode(open(rp.OUT_MP3, "rb").read()).decode()
        label, note = LABELS[s]
        if snap: label, note = f"{label} + {SNAPS[snap][0]}", SNAPS[snap][1]
        if snare: label, note = f"{label}, {SNARES[snare][0]}", SNARES[snare][1]
        opts.append({"label": label, "note": note, "audio": "data:audio/mpeg;base64," + data})
    # the choice panel: the toolbox template with PANEL filled in
    tpl = open(os.path.join(ROOT, ".claude", "skills", "toolbox", "choice-panel.html")).read()
    a = tpl.index("// ===================== PANEL"); b = tpl.index("// ================================================================\n")
    panel = ("// ===================== PANEL (filled by render_samples.py) =====================\n"
             "const PANEL = " + json.dumps({
                 "title": PANEL_TITLE, "ask": PANEL_ASK,
                 "options": opts}) + ";\n")
    open(os.path.join(HERE, PANEL_FILE), "w").write(tpl[:a] + panel + tpl[b:])
    print("panel:", os.path.join(HERE, PANEL_FILE))

if __name__ == "__main__":
    main()
