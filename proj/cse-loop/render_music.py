"""
render_music.py -- renders the full 48-second CSE hallway loop music (music.js, S2 Glass Lobby + mallet snaps +
tight snare) to WAV + MP3 at the hallway level, true-peak limited, and checks it with ffmpeg. Press Run in Thonny.
(The player synthesizes the same music in the browser; this file is for listening and for the loudness check.)
"""
import os, sys

# ============================ SETTINGS (edit these) ============================
TARGET_LUFS = -16.0          # hallway level (brief section 11)
CEILING     = -1.5           # dBTP
# ===============================================================================

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import render_piece as rp  # noqa: E402

if __name__ == "__main__":
    rp.PIECE = "proj/cse-loop/music.js"
    rp.OUT_WAV = os.path.join(ROOT, "dist", "cse-loop.wav")          # dist/ is git-ignored
    rp.OUT_MP3 = os.path.join(HERE, "cse-loop-music.mp3")             # *.mp3 is git-ignored
    rp.TARGET_LUFS, rp.CEILING_DBTP = TARGET_LUFS, CEILING
    rp.main()
