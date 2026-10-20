# Exports dist/player.html to MP4 (video + synthesized audio). Run in Thonny; edit settings below.
# Needs: pip install playwright && playwright install chromium ; ffmpeg on PATH
import base64, os, subprocess
from playwright.sync_api import sync_playwright

HTML_PATH = r"C:\path\to\dist\player.html"   # <-- edit
OUT_MP4   = r"C:\path\to\output\loop.mp4"     # <-- edit
FPS, W, H = 30, 1920, 1080                     # use 1080, 1920 for vertical

wav = os.path.splitext(OUT_MP4)[0] + "_audio.wav"
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("file:///" + os.path.abspath(HTML_PATH).replace("\\", "/") + "?mute=1")
    page.wait_for_function("window.DHS && DHS.film && DHS.film.tl && window.__dhs")
    length = page.evaluate("DHS.film.length")
    print("Synthesizing audio...")
    b64 = page.evaluate("""() => { eval(document.getElementById('dhs-audio-src').textContent);
        const r = DHS.audio.render(), b = new Uint8Array(DHS.audio.wav(r.master, r.sr, 16)); let s = '';
        for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }""")
    open(wav, "wb").write(base64.b64decode(b64))
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-vcodec", "mjpeg", "-r", str(FPS), "-i", "-", "-i", wav,
                           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", OUT_MP4],
                          stdin=subprocess.PIPE)
    frames = round(length * FPS)
    for f in range(frames):
        data = page.evaluate("""(t) => { const c = window.__cap || (window.__cap = Object.assign(document.createElement('canvas'), {width: %d, height: %d}));
                                DHS.film.render(c.getContext('2d'), t, %d, %d, 1); return c.toDataURL('image/jpeg', 0.92); }""" % (W, H, W, H), f / FPS)
        ff.stdin.write(base64.b64decode(data.split(",")[1]))
        if f % 150 == 0: print(f"  frame {f}/{frames}")
    ff.stdin.close(); ff.wait(); browser.close()
os.remove(wav)
print("Done:", OUT_MP4)
