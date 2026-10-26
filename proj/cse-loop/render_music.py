"""
render_music.py -- renders the full 48-second CSE hallway loop music (music.js) to WAV + MP3 at the hallway level, true-peak limited, and checks it with ffmpeg. Press Run in Thonny.
(The player synthesizes the same music in the browser; this file is for listening and for the loudness check.)
"""
import os, sys

# ============================ SETTINGS (edit these) ============================
STYLE       = "S2"           # "S2" Glass Lobby (the published player) or "S3" Maker Bench (the second player)
TARGET_LUFS = -16.0          # hallway level (brief section 11)
CEILING     = -1.5           # dBTP
# ===============================================================================

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import render_piece as rp  # noqa: E402

if __name__ == "__main__":
    import json
    tag = "" if STYLE == "S2" else "-" + STYLE
    wrapper = os.path.join(ROOT, "dist", f"cse-loop-full{tag}.js")      # dist/ is git-ignored
    os.makedirs(os.path.dirname(wrapper), exist_ok=True)
    open(wrapper, "w").write(f"globalThis.CSE_STYLE = {json.dumps(STYLE)};\n"
                             f"eval(fs.readFileSync({json.dumps(os.path.join(HERE, 'music.js'))}, 'utf8'));\n")
    rp.PIECE = os.path.relpath(wrapper, ROOT)
    rp.OUT_WAV = os.path.join(ROOT, "dist", f"cse-loop{tag}.wav")
    rp.OUT_MP3 = os.path.join(HERE, f"cse-loop-music{tag}.mp3")         # *.mp3 is git-ignored
    rp.TARGET_LUFS, rp.CEILING_DBTP = TARGET_LUFS, CEILING
    rp.main()
