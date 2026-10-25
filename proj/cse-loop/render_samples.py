"""
render_samples.py -- renders the three 16-second sound samples (S1, S2, S3) for the CSE hallway loop and builds the
choice panel (choices-sound.html) with the samples inlined, so it works offline.
Press Run in Thonny. Needs Node.js and ffmpeg. Uses tools/render_piece.py for loudness and true-peak limiting.
"""
import os, sys, json, base64

# ============================ SETTINGS (edit these) ============================
STYLES      = ["S1", "S2", "S3"]
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

def main():
    os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
    os.makedirs(os.path.join(HERE, "samples"), exist_ok=True)
    music = os.path.join(HERE, "music.js")
    opts = []
    for s in STYLES:
        wrapper = os.path.join(ROOT, "dist", f"cse-loop-{s}.js")      # dist/ is git-ignored
        open(wrapper, "w").write(f"globalThis.CSE_STYLE = {json.dumps(s)}; globalThis.CSE_SAMPLE = true;\n"
                                 f"eval(fs.readFileSync({json.dumps(music)}, 'utf8'));\n")
        rp.PIECE = os.path.relpath(wrapper, ROOT)
        rp.OUT_WAV = os.path.join(ROOT, "dist", f"cse-loop-{s}.wav")
        rp.OUT_MP3 = os.path.join(HERE, "samples", f"{s}.mp3")          # *.mp3 is git-ignored; the panel inlines them
        rp.TARGET_LUFS, rp.CEILING_DBTP = TARGET_LUFS, CEILING
        rp.main()
        data = base64.b64encode(open(rp.OUT_MP3, "rb").read()).decode()
        label, note = LABELS[s]
        opts.append({"label": f"{s}. {label}", "note": note, "audio": "data:audio/mpeg;base64," + data})
    # the choice panel: the toolbox template with PANEL filled in
    tpl = open(os.path.join(ROOT, ".claude", "skills", "toolbox", "choice-panel.html")).read()
    a = tpl.index("// ===================== PANEL"); b = tpl.index("// ================================================================\n")
    panel = ("// ===================== PANEL (filled by render_samples.py) =====================\n"
             "const PANEL = " + json.dumps({
                 "title": "CSE hallway loop: which sound?",
                 "ask": "Three 16-second samples of the video's opening (the first app, then the robot car). Each one loops, so "
                        "play it a few times. They're the same speed and loudness. Answer with a letter, or mix "
                        "(\"B, with C's clicks\").",
                 "options": opts}) + ";\n")
    open(os.path.join(HERE, "choices-sound.html"), "w").write(tpl[:a] + panel + tpl[b:])
    print("panel:", os.path.join(HERE, "choices-sound.html"))

if __name__ == "__main__":
    main()
