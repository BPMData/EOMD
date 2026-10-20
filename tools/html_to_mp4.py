# tools__html_to_mp4.py: HTML → MP4. Pick a finished player .html, get an .mp4 (video + its music).
# Run in Thonny. Needs ffmpeg on PATH and Playwright for the Python Thonny runs:
#   Thonny > Tools > Manage packages > "playwright" > Install, then in Tools > Open system shell:  python -m playwright install chromium
# Two kinds of player, found automatically:
#   FILM     the Academies film (DHS.film): every frame rendered exactly at its time, music synthesized offline,
#            length = the film's own loop. Frame-perfect A/V.
#   STEPPED  anything with the ?manual capture hook (window.advance): CD-ROM screensaver, living posters,
#            the gen player (one cartridge: URL option cart=<name>). Video is stepped frame by frame (any length, never drops a frame);
#            the music is recorded from a second, real-time run of the page (it streams live), so it takes the
#            clip's length in real time and is not locked to the picture (fine for posters; CD-ROM channel switches
#            follow their own clock in ?manual, not the music's bar lines).
# A page with neither hook is refused (it would need a screen recorder).
import os, sys, time, queue, base64, shutil, threading, subprocess
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from pathlib import Path

# ===================== SETTINGS =====================
FFMPEG_EXE    = ''            # '' = find it (PATH, then the usual Homebrew / MacPorts / Windows spots); or a full path
FFMPEG_SPOTS  = ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/opt/local/bin/ffmpeg', '~/bin/ffmpeg',
                 r'C:\ffmpeg\bin\ffmpeg.exe', r'C:\Program Files\ffmpeg\bin\ffmpeg.exe']
DEFAULT_HTML  = ''            # optional: pre-fill the player path
OUT_DIR       = ''            # '' = save the .mp4 next to the .html
FPS           = 30
SIZES         = {'Landscape 1920×1080': (1920, 1080), 'Portrait 1080×1920': (1080, 1920), '4K 3840×2160': (3840, 2160), '720p 1280×720': (1280, 720)}
DEFAULT_SIZE  = 'Landscape 1920×1080'
SECONDS       = 60            # clip length for STEPPED players (FILM players use their own length × LOOPS)
LOOPS         = 1             # FILM players: how many times through the loop
URL_OPTIONS   = ''            # extra query options, e.g. 'cart=dust-type&nohud&shot=2' (gen), 'vseed=7' (living)
WITH_AUDIO    = True
AUDIO_LEAD_S  = 1.5           # STEPPED audio run: seconds to let the page load before pressing Start sound
JPEG_QUALITY  = 92            # frames travel to ffmpeg as JPEG
CRF           = 18            # x264 quality: lower = better and bigger (18 looks lossless)
AUDIO_KBPS    = 256
HIDE_UI_CSS   = '#ui, #bar, #start, #tapbox, #fps, #msg { display: none !important; } * { cursor: none !important; }'
SOUND_BUTTONS = ['#snd', '#start']   # tried in order; then any button whose text says "sound"
VOLUME_MAX    = True          # set the page's volume slider to full before recording (the players' levels are set at full)
# ====================================================

COLOR_BG, COLOR_FG, COLOR_ACCENT, COLOR_ERROR = "#121212", "#FFD500", "#FF7F00", "#FF3333"
FONT_MONO, FONT_HEADER = ("Consolas", 10), ("Consolas", 11, "bold")

# Taps every AudioContext's speakers into one recorder. Injected before the page's own scripts (audio run only).
AUDIO_TAP_JS = r"""
(() => {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const connect = AudioNode.prototype.connect, taps = new Map();
  const R = window.__rec = { chunks: [], mix: null, dest: null, rec: null, contexts: 0 };
  function mixer() {
    if (!R.mix) { R.mix = new AC({ sampleRate: 48000 }); R.dest = R.mix.createMediaStreamDestination(); }
    return R.mix;
  }
  function tap(ctx) {
    if (taps.has(ctx)) return taps.get(ctx);
    const d = ctx.createMediaStreamDestination(); taps.set(ctx, d); R.contexts++;
    const m = mixer(); connect.call(m.createMediaStreamSource(d.stream), R.dest);
    return d;
  }
  AudioNode.prototype.connect = function (dest, ...rest) {
    const out = connect.call(this, dest, ...rest);
    if (dest instanceof AudioDestinationNode && dest.context !== R.mix) connect.call(this, tap(dest.context));
    return out;
  };
  window.__recStart = async () => {
    const m = mixer(); try { await m.resume(); } catch (e) {}
    R.rec = new MediaRecorder(R.dest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: %d });
    R.rec.ondataavailable = (e) => { if (e.data && e.data.size) R.chunks.push(e.data); };
    R.rec.start(1000);
  };
  window.__recStop = () => new Promise((res) => { if (!R.rec) return res(); R.rec.onstop = () => res(); R.rec.stop(); });
  window.__recDrain = async () => {
    const b = new Blob(R.chunks.splice(0)), u = new Uint8Array(await b.arrayBuffer()); let s = '';
    for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(s);
  };
})();
""" % (AUDIO_KBPS * 1000)

PRESS_SOUND_JS = r"""
([sels, volMax]) => {
  if (volMax) for (const v of document.querySelectorAll('input[type=range]')) if (/vol/i.test(v.id + v.name)) {
    v.value = v.max || 1; v.dispatchEvent(new Event('input', { bubbles: true })); v.dispatchEvent(new Event('change', { bubbles: true })); }
  let b = sels.map((s) => document.querySelector(s)).find(Boolean);
  if (!b) b = [...document.querySelectorAll('button')].find((x) => /sound/i.test(x.textContent));
  if (b) { b.click(); return b.id || b.textContent.trim(); }
  document.body.click(); return '';
}
"""

FILM_AUDIO_JS = r"""
() => { eval(document.getElementById('dhs-audio-src').textContent);
  const r = DHS.audio.render(), b = new Uint8Array(DHS.audio.wav(r.master, r.sr, 16)); let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
"""

FILM_FRAME_JS = r"""
([t, w, h, q]) => { const c = window.__cap || (window.__cap = Object.assign(document.createElement('canvas'), { width: w, height: h }));
  DHS.film.render(c.getContext('2d'), t, w, h, 1); return c.toDataURL('image/jpeg', q); }
"""


class Cancelled(Exception): pass


def find_ffmpeg(hint=''):
    """Full path to ffmpeg, or ''. Thonny starts without Homebrew on PATH, so a bare 'ffmpeg' often isn't found."""
    for c in ([hint] if hint else []) + ['ffmpeg'] + FFMPEG_SPOTS:
        p = shutil.which(os.path.expanduser(c))
        if p: return p
    return ''


def file_url(path, query):
    return Path(path).resolve().as_uri() + ('?' + query if query else '')


def detect(page):
    """'film', 'stepped' or None, for a page loaded with ?manual&mute=1."""
    deadline = time.time() + 20
    while time.time() < deadline:
        kind = page.evaluate("""() => (window.DHS && DHS.film && DHS.film.length && document.getElementById('dhs-audio-src')) ? 'film'
                                 : (typeof window.advance === 'function' ? 'stepped' : null)""")
        if kind: return kind
        time.sleep(0.25)
    return None


class Job:
    def __init__(self, app, ffmpeg, html, out, w, h, fps, seconds, loops, query, audio):
        self.ffmpeg, self.app, self.html, self.out, self.w, self.h, self.fps = ffmpeg, app, html, out, w, h, fps
        self.seconds, self.loops, self.query, self.audio = seconds, loops, query, audio
        self.tmp = os.path.splitext(out)[0] + '_tmp'

    def log(self, m, tag='INFO'): self.app.log(m, tag)
    def check(self):
        if self.app.cancel.is_set(): raise Cancelled()

    def run(self):
        from playwright.sync_api import sync_playwright
        os.makedirs(self.tmp, exist_ok=True)
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True, args=['--autoplay-policy=no-user-gesture-required'])
                try: self._run(browser)
                finally: browser.close()
        finally:
            shutil.rmtree(self.tmp, ignore_errors=True)

    def _page(self, browser, query):
        page = browser.new_page(viewport={'width': self.w, 'height': self.h}, device_scale_factor=1)
        page.goto(file_url(self.html, query)); return page

    def _run(self, browser):
        q = '&'.join(x for x in ('manual', 'mute=1', self.query) if x)
        page = self._page(browser, q)
        kind = detect(page)
        if not kind: raise RuntimeError('No capture hook on this page (no DHS.film, no ?manual advance()). It needs a screen recorder instead.')
        if kind == 'film':
            length = page.evaluate('DHS.film.length'); dur = length * self.loops
            self.log(f'FILM player: loop {length:.2f} s × {self.loops} = {dur:.1f} s, frames rendered exactly.', 'SUCCESS')
            wav = None
            if self.audio:
                self.log('Synthesizing the music offline...'); t0 = time.time()
                wav = os.path.join(self.tmp, 'audio.wav'); open(wav, 'wb').write(base64.b64decode(page.evaluate(FILM_AUDIO_JS)))
                self.log(f'  music ready ({time.time() - t0:.0f} s)')
            frame = lambda t: base64.b64decode(page.evaluate(FILM_FRAME_JS, [t % length, self.w, self.h, JPEG_QUALITY / 100]).split(',', 1)[1])
            self._encode(frame, dur, wav, loop_audio=self.loops > 1)
        else:
            dur = self.seconds
            self.log(f'STEPPED player: {dur:.0f} s at {self.fps} fps.', 'SUCCESS')
            page.close()
            audio = self._record_audio(browser, dur) if self.audio else None
            page = self._page(browser, q)
            detect(page)
            page.add_style_tag(content=HIDE_UI_CSS)
            page.evaluate('async () => { try { await document.fonts.ready; } catch (e) {} if (window.dustReady) await window.dustReady; }')
            time.sleep(0.5)
            page.evaluate('() => { if (window.renderAt) window.renderAt(0); }')
            hz = self.fps * max(1, -(-60 // self.fps))   # step the sim at >= 60 Hz, a whole number of steps per frame
            state = {'first': True}
            def frame(t):
                if not state['first']: page.evaluate('([d, hz]) => window.advance(d, hz)', [1 / self.fps, hz])
                state['first'] = False
                return page.screenshot(type='jpeg', quality=JPEG_QUALITY)
            self._encode(frame, dur, audio, base=30 if audio else 0)

    def _record_audio(self, browser, dur):
        self.log(f'Recording the music in real time ({dur:.0f} s)...')
        page = browser.new_page(viewport={'width': self.w, 'height': self.h})
        page.add_init_script(AUDIO_TAP_JS)
        page.goto(file_url(self.html, self.query))
        time.sleep(AUDIO_LEAD_S)
        pressed = page.evaluate(PRESS_SOUND_JS, [SOUND_BUTTONS, VOLUME_MAX])
        page.evaluate('window.__recStart()')
        self.log(f'  pressed {pressed!r}' if pressed else '  no Start sound button found; clicked the page', 'INFO' if pressed else 'WARN')
        webm = os.path.join(self.tmp, 'audio.webm'); f = open(webm, 'wb'); t0 = time.time()
        try:
            while time.time() - t0 < dur + 0.5:
                self.check(); time.sleep(min(2, max(0.05, dur + 0.5 - (time.time() - t0))))
                f.write(base64.b64decode(page.evaluate('window.__recDrain()')))
                self.app.progress(100 * min(1, (time.time() - t0) / dur) * 0.3)
            page.evaluate('window.__recStop()'); f.write(base64.b64decode(page.evaluate('window.__recDrain()')))
        finally:
            f.close(); page.close()
        if os.path.getsize(webm) < 2000:
            self.log('  the page made no sound: rendering the picture only (no audio track)', 'WARN')
            return None
        return webm

    def _encode(self, frame, dur, audio, loop_audio=False, base=0):
        n = max(1, round(dur * self.fps))
        cmd = [self.ffmpeg, '-y', '-loglevel', 'error', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', str(self.fps), '-i', '-']
        if audio: cmd += (['-stream_loop', '-1'] if loop_audio else []) + ['-i', audio]
        cmd += ['-t', f'{n / self.fps:.3f}', '-c:v', 'libx264', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-crf', str(CRF)]
        cmd += (['-c:a', 'aac', '-b:a', f'{AUDIO_KBPS}k', '-ar', '48000'] if audio else ['-an']) + ['-movflags', '+faststart', self.out]
        ff = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
        t0 = time.time()
        try:
            for i in range(n):
                self.check()
                ff.stdin.write(frame(i / self.fps))
                if i % 30 == 0 or i == n - 1:
                    done = (i + 1) / n; el = time.time() - t0
                    self.app.progress(base + (100 - base) * done)
                    if i % (self.fps * 10) == 0 and i: self.log(f'  frame {i}/{n}  ·  {el / done - el:.0f} s left')
            ff.stdin.close()
        except (Cancelled, BrokenPipeError):
            ff.kill(); ff.wait()
            if os.path.exists(self.out): os.remove(self.out)
            err = ff.stderr.read().decode(errors='replace').strip()
            if err: raise RuntimeError('ffmpeg: ' + err.splitlines()[-1])
            raise
        if ff.wait(): raise RuntimeError('ffmpeg: ' + ff.stderr.read().decode(errors='replace').strip()[-300:])
        mb = os.path.getsize(self.out) / 1e6
        self.log(f'✅ Wrote {self.out}  ({n} frames, {n / self.fps:.1f} s, {mb:.1f} MB, {time.time() - t0:.0f} s)', 'SUCCESS')


class App:
    def __init__(self, root):
        self.root = root
        root.title('/// H T M L → M P 4 ///'); root.geometry('820x620'); root.configure(bg=COLOR_BG)
        self.html = tk.StringVar(value=DEFAULT_HTML); self.out = tk.StringVar(); self.ffmpeg = tk.StringVar(value=find_ffmpeg(FFMPEG_EXE))
        self.size = tk.StringVar(value=DEFAULT_SIZE); self.fps = tk.StringVar(value=str(FPS))
        self.seconds = tk.StringVar(value=str(SECONDS)); self.loops = tk.StringVar(value=str(LOOPS))
        self.query = tk.StringVar(value=URL_OPTIONS); self.audio = tk.BooleanVar(value=WITH_AUDIO)
        self.prog = tk.DoubleVar(value=0); self.q = queue.Queue(); self.busy = False; self.buttons = []; self.cancel = threading.Event()
        self._styles(); self._build()
        root.after(100, self._pump)
        if DEFAULT_HTML: self._auto_out()
        self.log('Pick a player .html, check the settings, press RENDER.', 'SUCCESS')
        self.check_tools()

    # ---- plumbing
    def log(self, msg, tag='INFO'): self.q.put((msg, tag))
    def progress(self, p): self.root.after(0, lambda: self.prog.set(p))
    def _pump(self):
        while not self.q.empty():
            msg, tag = self.q.get(); self.txt.config(state='normal'); self.txt.insert('end', msg + '\n', tag); self.txt.see('end'); self.txt.config(state='disabled')
        self.root.after(100, self._pump)

    def check_tools(self):
        if self.ffmpeg.get(): self.log(f'ffmpeg: {self.ffmpeg.get()}')
        else: self.log('❌ ffmpeg not found. Press BROWSE on the ffmpeg row (Mac: Cmd+Shift+G, then /opt/homebrew/bin), or install it: brew install ffmpeg', 'ERROR')
        try: import playwright  # noqa: F401
        except ImportError:
            self.log(f'❌ Playwright is not installed for this Python ({sys.executable}).', 'ERROR')
            self.log('   Thonny > Tools > Manage packages > playwright > Install; then Tools > Open system shell: python -m playwright install chromium', 'WARN')

    def _auto_out(self):
        h = self.html.get().strip()
        if h: self.out.set(str(Path(OUT_DIR or os.path.dirname(h)) / (Path(h).stem + '.mp4')))

    def pick_html(self):
        p = filedialog.askopenfilename(filetypes=[('HTML player', '*.html *.htm')], initialdir=os.path.dirname(self.html.get()) or os.path.dirname(os.path.abspath(__file__)))
        if p: self.html.set(str(Path(p))); self._auto_out()

    def pick_out(self):
        h = self.out.get()
        p = filedialog.asksaveasfilename(defaultextension='.mp4', filetypes=[('MP4', '*.mp4')], initialdir=os.path.dirname(h) or None, initialfile=os.path.basename(h) or None)
        if p: self.out.set(str(Path(p)))

    def pick_ffmpeg(self):
        p = filedialog.askopenfilename(title='Find ffmpeg (Mac: Cmd+Shift+G, then /opt/homebrew/bin)', initialdir='/opt/homebrew/bin' if os.path.isdir('/opt/homebrew/bin') else None)
        if p:
            if find_ffmpeg(p) == '': messagebox.showerror('Not a program', f'{p}\nisn\'t a runnable file.'); return
            self.ffmpeg.set(str(Path(p))); self.log(f'ffmpeg: {p}  (set FFMPEG_EXE at the top to keep it)', 'SUCCESS')

    def _num(self, var, name, kind=float, lo=0):
        try: v = kind(var.get())
        except ValueError: raise ValueError(f'{name} must be a number')
        if v <= lo: raise ValueError(f'{name} must be more than {lo}')
        return v

    def render(self):
        if self.busy: return
        try:
            html = self.html.get().strip(); out = self.out.get().strip()
            if not os.path.isfile(html): raise ValueError('Choose the player .html first.')
            if not out: raise ValueError('Choose where to save the .mp4.')
            ff = find_ffmpeg(self.ffmpeg.get().strip())
            if not ff: raise ValueError('ffmpeg not found: press BROWSE on the ffmpeg row.')
            w, h = SIZES[self.size.get()]
            job = Job(self, ff, html, out, w, h, self._num(self.fps, 'FPS', int), self._num(self.seconds, 'Seconds'),
                      self._num(self.loops, 'Loops', int), self.query.get().strip().lstrip('?'), self.audio.get())
        except (ValueError, KeyError) as e:
            messagebox.showerror('Check the settings', str(e)); return
        if os.path.exists(out) and not messagebox.askyesno('Overwrite?', f'{out}\nalready exists. Replace it?'): return
        self.busy = True; self.cancel.clear(); self.prog.set(0)
        for b in self.buttons: b.config(state='disabled')
        self.cancel_btn.config(state='normal')
        self.log(f'▶ {os.path.basename(html)} → {out}  ({w}×{h}, {job.fps} fps)', 'CMD')
        def work():
            try: job.run()
            except Cancelled: self.log('Cancelled; no file written.', 'WARN')
            except Exception as e: self.log(f'❌ {e}', 'ERROR')
            finally:
                self.busy = False
                self.root.after(0, lambda: ([b.config(state='normal') for b in self.buttons], self.cancel_btn.config(state='disabled')))
        threading.Thread(target=work, daemon=True).start()

    def open_folder(self):
        d = os.path.dirname(self.out.get()) or os.path.dirname(self.html.get())
        if d and os.path.isdir(d): subprocess.run(['open' if sys.platform == 'darwin' else 'explorer', d])

    # ---- UI
    def _styles(self):
        s = ttk.Style(); s.theme_use('clam')
        s.configure('TButton', background='#333', foreground=COLOR_FG, borderwidth=3, relief='raised', font=FONT_HEADER)
        s.map('TButton', background=[('active', COLOR_ACCENT), ('pressed', COLOR_FG)], foreground=[('active', '#000'), ('pressed', '#000')])
        s.configure('Horizontal.TProgressbar', troughcolor='#333', background=COLOR_ACCENT, bordercolor=COLOR_BG, lightcolor=COLOR_ACCENT, darkcolor=COLOR_ACCENT)
        s.configure('TCombobox', fieldbackground='#222', foreground='#FFF', background='#333')

    def _entry(self, parent, var, width=None):
        return tk.Entry(parent, textvariable=var, bg='#222', fg='#FFF', insertbackground=COLOR_FG, relief='sunken', bd=2, font=FONT_MONO, **({'width': width} if width else {}))
    def _btn(self, parent, text, cmd, tracked=True):
        b = ttk.Button(parent, text=text, command=cmd)
        if tracked: self.buttons.append(b)
        return b
    def _row(self, parent):
        r = tk.Frame(parent, bg=COLOR_BG); r.pack(fill='x', padx=5, pady=2); return r
    def _label(self, parent, text): return tk.Label(parent, text=text, bg=COLOR_BG, fg=COLOR_FG, font=FONT_MONO)

    def _build(self):
        tk.Label(self.root, text='/// HTML → MP4 ///', bg=COLOR_BG, fg=COLOR_ACCENT, font=('Consolas', 16, 'bold')).pack(pady=(8, 2))
        f = tk.LabelFrame(self.root, text=' FILES ', bg=COLOR_BG, fg=COLOR_ACCENT, bd=2, relief='groove', font=FONT_HEADER); f.pack(fill='x', padx=10, pady=4)
        r = self._row(f); self._label(r, 'Player .html').pack(side='left'); self._entry(r, self.html).pack(side='left', fill='x', expand=True, padx=4)
        self._btn(r, '[ BROWSE ]', self.pick_html).pack(side='left')
        r = self._row(f); self._label(r, 'Save .mp4   ').pack(side='left'); self._entry(r, self.out).pack(side='left', fill='x', expand=True, padx=4)
        self._btn(r, '[ BROWSE ]', self.pick_out).pack(side='left')
        r = self._row(f); self._label(r, 'ffmpeg      ').pack(side='left'); self._entry(r, self.ffmpeg).pack(side='left', fill='x', expand=True, padx=4)
        self._btn(r, '[ BROWSE ]', self.pick_ffmpeg).pack(side='left')

        s = tk.LabelFrame(self.root, text=' SETTINGS ', bg=COLOR_BG, fg=COLOR_ACCENT, bd=2, relief='groove', font=FONT_HEADER); s.pack(fill='x', padx=10, pady=4)
        r = self._row(s); self._label(r, 'Size').pack(side='left')
        ttk.Combobox(r, textvariable=self.size, values=list(SIZES), width=22, state='readonly', font=FONT_MONO).pack(side='left', padx=4)
        self._label(r, '  FPS').pack(side='left'); self._entry(r, self.fps, 4).pack(side='left', padx=4)
        tk.Checkbutton(r, text='with music', variable=self.audio, bg=COLOR_BG, fg=COLOR_FG, selectcolor='#333', activebackground=COLOR_BG, activeforeground=COLOR_ACCENT, font=FONT_MONO).pack(side='left', padx=(12, 0))
        r = self._row(s); self._label(r, 'Seconds (stepped players)').pack(side='left'); self._entry(r, self.seconds, 7).pack(side='left', padx=4)
        self._label(r, '  Loops (film)').pack(side='left'); self._entry(r, self.loops, 4).pack(side='left', padx=4)
        r = self._row(s); self._label(r, 'URL options').pack(side='left'); self._entry(r, self.query).pack(side='left', fill='x', expand=True, padx=4)
        self._label(s, 'e.g. cart=dust-type&nohud&shot=2 (gen), vseed=7 (living), noboot (CD-ROM)').pack(anchor='w', padx=5)

        r = tk.Frame(self.root, bg=COLOR_BG); r.pack(fill='x', padx=10, pady=(6, 0))
        self._btn(r, '[ RENDER ]', self.render).pack(side='left')
        self.cancel_btn = ttk.Button(r, text='[ CANCEL ]', command=self.cancel.set, state='disabled'); self.cancel_btn.pack(side='left', padx=6)
        self._btn(r, '[ OPEN FOLDER ]', self.open_folder, False).pack(side='right')
        ttk.Progressbar(self.root, variable=self.prog, maximum=100, orient='horizontal').pack(fill='x', padx=10, pady=(8, 0))
        lf = tk.Frame(self.root, bg=COLOR_BG); lf.pack(fill='both', expand=True, padx=10, pady=6)
        self.txt = tk.Text(lf, bg='#000', fg='#AAA', font=FONT_MONO, state='disabled', relief='sunken', bd=2, height=10); self.txt.pack(side='left', fill='both', expand=True)
        sb = ttk.Scrollbar(lf, orient='vertical', command=self.txt.yview); sb.pack(side='right', fill='y'); self.txt.config(yscrollcommand=sb.set)
        for tag, col in (('INFO', '#AAA'), ('SUCCESS', COLOR_FG), ('WARN', COLOR_ACCENT), ('ERROR', COLOR_ERROR), ('CMD', '#00AA00')): self.txt.tag_config(tag, foreground=col)


if __name__ == '__main__':
    root = tk.Tk()
    App(root)
    root.mainloop()
