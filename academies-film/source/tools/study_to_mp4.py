# Makes a 20-minute MP4 from dist/study.html. Run in Thonny (edit the settings below).
# 1) clicks "Download 20-min WAV" in headless Chrome and saves the WAV
# 2) renders the 120 s visual loop (3,600 frames at 30 fps) to loop.mp4
# 3) repeats that loop 10x under the audio -> final MP4 (video is copied, not re-encoded)
# Needs: pip install playwright && playwright install chromium ; ffmpeg on PATH
import base64, os, subprocess
from playwright.sync_api import sync_playwright

HTML_PATH = r"C:\path\to\study.html"          # <-- edit
OUT_DIR   = r"C:\path\to\output"              # <-- edit
FPS, LOOP_SECONDS, W, H = 30, 120, 1920, 1080

os.makedirs(OUT_DIR, exist_ok=True)
wav, loop, final = (os.path.join(OUT_DIR, f) for f in ("study_audio.wav", "study_loop.mp4", "sanctioned_corporate_calm_20min.mp4"))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(accept_downloads=True)
    page.goto("file:///" + os.path.abspath(HTML_PATH).replace("\\", "/"))
    page.wait_for_function("window.__ready === true")

    print("Rendering 20-min audio (a few minutes)...")
    with page.expect_download(timeout=0) as dl:
        page.click("#dl")
    dl.value.save_as(wav)

    print("Rendering visual loop...")
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-vcodec", "mjpeg", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium", loop], stdin=subprocess.PIPE)
    for f in range(FPS * LOOP_SECONDS):
        data = page.evaluate("""(t) => { const c = window.__cap || (window.__cap = Object.assign(document.createElement('canvas'), {width: %d, height: %d}));
                                DHS.film.render(c.getContext('2d'), t); return c.toDataURL('image/jpeg', 0.92); }""" % (W, H), f / FPS)
        ff.stdin.write(base64.b64decode(data.split(",")[1]))
        if f % 300 == 0:
            print(f"  frame {f}/{FPS * LOOP_SECONDS}")
    ff.stdin.close(); ff.wait()
    browser.close()

print("Muxing 20-min MP4...")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-stream_loop", "-1", "-i", loop, "-i", wav, "-map", "0:v", "-map", "1:a",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", final], check=True)
print("Done:", final)
