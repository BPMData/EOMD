# Rebuilds the real folder tree for the timeline (cut-based) engine from the flat engine__* files.
# engine__src__audio__dsp.js  ->  <DEST>/src/audio/dsp.js     ("__" means "/")
# Run in Thonny.
import os, glob, shutil

# ===================== SETTINGS =====================
SRC_DIR = os.path.dirname(os.path.abspath(__file__))
DEST    = os.path.join(SRC_DIR, 'engine_tree')
PREFIX  = 'engine__'
# ====================================================

n = 0
for f in sorted(glob.glob(os.path.join(SRC_DIR, PREFIX + '*'))):
    rel = os.path.basename(f)[len(PREFIX):].replace('__', '/')
    out = os.path.join(DEST, rel); os.makedirs(os.path.dirname(out), exist_ok=True); shutil.copy(f, out); n += 1
print('unpacked', n, 'files into', DEST)
