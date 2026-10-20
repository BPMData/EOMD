# tools__gen_export.py: GEN → HTML / MP4. Pick a gen cartridge, pick a folder, press a button.
# Run in Thonny (Run button). No settings to edit for normal use; the folder you pick is remembered.
#   MAKE HTML  a standalone player with only that cartridge (opens straight into it, works offline, double-click to play)
#   MAKE MP4   a video of one full run of the cartridge, frame by frame, with the cartridge's own music track laid in
#              exactly in sync (the track is the file named by the cartridge's "audio", from gen/audio/)
#   MAKE BOTH  both, side by side
# Needs: ffmpeg + Playwright (only for MP4; same setup as tools__html_to_mp4.py, which does the frame-by-frame rendering).
import os, io, sys, json, queue, threading, subprocess, contextlib, importlib.util
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from pathlib import Path

# ===================== SETTINGS =====================
SRC_DIR       = os.path.dirname(os.path.abspath(__file__))
DEFAULT_OUT   = os.path.expanduser('~/Desktop')         # first-run folder; after that, the last folder you picked
REMEMBER_FILE = os.path.expanduser('~/.eomd_gen_export.json')
DEFAULT_SIZE  = 'Landscape 1920×1080'
FPS           = 30
# ====================================================

sys.path.insert(0, SRC_DIR)
import tools__html_to_mp4 as h2m                          # the renderer (its GUI only starts when it's run directly)

GEN_DIR = os.path.join(SRC_DIR, 'gen')
COLOR_BG, COLOR_FG, COLOR_ACCENT, COLOR_ERROR = h2m.COLOR_BG, h2m.COLOR_FG, h2m.COLOR_ACCENT, h2m.COLOR_ERROR
FONT_MONO, FONT_HEADER = h2m.FONT_MONO, h2m.FONT_HEADER


def load_build():
    spec = importlib.util.spec_from_file_location('gen_build', os.path.join(GEN_DIR, 'build.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m


def list_carts():
    out = []
    for d, pre in ((os.path.join(GEN_DIR, 'carts'), ''), (os.path.join(GEN_DIR, 'carts', 'private'), 'private/')):
        if not os.path.isdir(d): continue
        for f in sorted(os.listdir(d)):
            if not f.endswith('.json') or f.startswith('_'): continue
            try: c = json.load(open(os.path.join(d, f), encoding='utf-8'))
            except Exception: continue
            name = f[:-5]
            out.append({'name': name, 'label': pre + name, 'title': ' · '.join(x for x in (c.get('title'), c.get('subtitle')) if x),
                        'seconds': sum(s.get('dur', 30) for s in c.get('shots', [])), 'audio': c.get('audio')})
    return out


class GenJob(h2m.Job):
    """The MP4 renderer, with the cartridge's own track laid in instead of a live recording (frame-exact sync)."""
    def __init__(self, *a, track=None, **k):
        super().__init__(*a, **k); self.track = track
    def _record_audio(self, browser, dur):
        self.log(f'  music: {os.path.basename(self.track)} (laid in from the file, in sync with frame 1)')
        return self.track


class App:
    def __init__(self, root):
        self.root = root; root.title('/// G E N → V I D E O ///'); root.geometry('860x700'); root.configure(bg=COLOR_BG)
        mem = {}
        try: mem = json.load(open(REMEMBER_FILE))
        except Exception: pass
        self.out = tk.StringVar(value=mem.get('out') if mem.get('out') and os.path.isdir(mem.get('out')) else DEFAULT_OUT)
        self.size = tk.StringVar(value=mem.get('size', DEFAULT_SIZE)); self.fps = tk.StringVar(value=str(FPS))
        self.nohud = tk.BooleanVar(value=mem.get('nohud', False)); self.music = tk.BooleanVar(value=True)
        self.prog = tk.DoubleVar(value=0); self.q = queue.Queue(); self.busy = False; self.buttons = []; self.cancel = threading.Event()
        self.carts = list_carts(); self.last = mem.get('cart')
        self._styles(); self._build(); root.after(100, self._pump)
        self.log('Pick a cartridge and a folder, then MAKE HTML, MAKE MP4 or MAKE BOTH.', 'SUCCESS')
        self.ff = h2m.find_ffmpeg(h2m.FFMPEG_EXE)
        if not self.ff: self.log('ffmpeg not found: MP4 won\'t work until it\'s installed (brew install ffmpeg). HTML works without it.', 'WARN')

    # ---- plumbing (h2m.Job calls log / progress / cancel on its app)
    def log(self, msg, tag='INFO'): self.q.put((msg, tag))
    def progress(self, p): self.root.after(0, lambda: self.prog.set(p))
    def _pump(self):
        while not self.q.empty():
            msg, tag = self.q.get(); self.txt.config(state='normal'); self.txt.insert('end', msg + '\n', tag); self.txt.see('end'); self.txt.config(state='disabled')
        self.root.after(100, self._pump)
    def remember(self, cart):
        try: json.dump({'out': self.out.get(), 'size': self.size.get(), 'nohud': self.nohud.get(), 'cart': cart}, open(REMEMBER_FILE, 'w'))
        except Exception: pass

    def chosen(self):
        sel = self.list.curselection()
        if not sel: raise ValueError('Pick a cartridge in the list first.')
        return self.carts[sel[0]]

    def make(self, html, mp4):
        if self.busy: return
        try:
            c = self.chosen(); folder = self.out.get().strip()
            if not folder: raise ValueError('Pick a folder to save into.')
            os.makedirs(folder, exist_ok=True)
            fps = int(self.fps.get()); w, h = h2m.SIZES[self.size.get()]
            if mp4 and not self.ff: raise ValueError('ffmpeg not found, so no MP4. Install it (brew install ffmpeg) or use MAKE HTML.')
            track = None
            if mp4 and self.music.get() and c['audio']:
                track = os.path.join(GEN_DIR, 'audio', c['audio'])
                if not os.path.isfile(track): self.log(f'⚠ {c["audio"]} isn\'t in gen/audio, so the MP4 will be silent (render the music first).', 'WARN'); track = None
        except (ValueError, KeyError) as e:
            messagebox.showerror('Check the settings', str(e)); return
        stem = c['label'].replace('/', '-'); html_path = os.path.join(folder, stem + '.html'); mp4_path = os.path.join(folder, stem + '.mp4')
        targets = [p for p, on in ((html_path, html), (mp4_path, mp4)) if on and os.path.exists(p)]
        if targets and not messagebox.askyesno('Replace?', 'Already there:\n' + '\n'.join(targets) + '\n\nReplace?'): return
        self.remember(c['name'])
        self.busy = True; self.cancel.clear(); self.prog.set(0)
        for b in self.buttons: b.config(state='disabled')
        self.cancel_btn.config(state='normal')

        def work():
            try:
                self.log(f'▶ {c["label"]}  ({c["seconds"]:g} s)', 'CMD')
                # the standalone player: kept if asked for, otherwise a temporary file for the video
                tmp_html = html_path if html else os.path.join(folder, '.' + stem + '_render.html')
                buf = io.StringIO()
                with contextlib.redirect_stdout(buf): load_build().main(only_cart=c['name'], out_path=tmp_html)
                for line in buf.getvalue().splitlines():
                    if line.startswith(('Wrote', 'Embedded audio', 'Note', 'Problems', '  -')): self.log('  ' + line.replace(tmp_html, os.path.basename(tmp_html)))
                if html: self.log(f'✅ HTML: {html_path}', 'SUCCESS')
                if mp4:
                    try:
                        job = GenJob(self, self.ff, tmp_html, mp4_path, w, h, fps, c['seconds'], 1, 'nohud' if self.nohud.get() else '', bool(track), track=track)
                        job.run()
                    finally:
                        if not html and os.path.exists(tmp_html): os.remove(tmp_html)
                self.progress(100)
            except h2m.Cancelled: self.log('Cancelled; the unfinished MP4 was removed.', 'WARN')
            except SystemExit as e: self.log(f'❌ build stopped: {e}', 'ERROR')
            except Exception as e: self.log(f'❌ {e}', 'ERROR')
            finally:
                self.busy = False
                self.root.after(0, lambda: ([b.config(state='normal') for b in self.buttons], self.cancel_btn.config(state='disabled')))
        threading.Thread(target=work, daemon=True).start()

    def pick_out(self):
        p = filedialog.askdirectory(initialdir=self.out.get() or DEFAULT_OUT, title='Save into which folder?')
        if p: self.out.set(str(Path(p)))
    def show(self):
        d = self.out.get()
        if d and os.path.isdir(d): subprocess.run(['open' if sys.platform == 'darwin' else 'explorer', d])

    # ---- UI (same look as tools__html_to_mp4.py)
    def _styles(self):
        s = ttk.Style(); s.theme_use('clam')
        s.configure('TButton', background='#333', foreground=COLOR_FG, borderwidth=3, relief='raised', font=FONT_HEADER)
        s.map('TButton', background=[('active', COLOR_ACCENT), ('pressed', COLOR_FG)], foreground=[('active', '#000'), ('pressed', '#000')])
        s.configure('Horizontal.TProgressbar', troughcolor='#333', background=COLOR_ACCENT, bordercolor=COLOR_BG, lightcolor=COLOR_ACCENT, darkcolor=COLOR_ACCENT)
    def _btn(self, parent, text, cmd, tracked=True):
        b = ttk.Button(parent, text=text, command=cmd)
        if tracked: self.buttons.append(b)
        return b
    def _label(self, parent, text): return tk.Label(parent, text=text, bg=COLOR_BG, fg=COLOR_FG, font=FONT_MONO)
    def _frame(self, text):
        f = tk.LabelFrame(self.root, text=text, bg=COLOR_BG, fg=COLOR_ACCENT, bd=2, relief='groove', font=FONT_HEADER); f.pack(fill='x', padx=10, pady=4); return f

    def _build(self):
        tk.Label(self.root, text='/// GEN → VIDEO ///', bg=COLOR_BG, fg=COLOR_ACCENT, font=('Consolas', 16, 'bold')).pack(pady=(8, 2))
        f = self._frame(' 1. CARTRIDGE ')
        self.list = tk.Listbox(f, height=9, bg='#222', fg='#FFF', selectbackground=COLOR_ACCENT, selectforeground='#000', font=FONT_MONO, activestyle='none', exportselection=False)
        self.list.pack(fill='x', padx=5, pady=4)
        for k, c in enumerate(self.carts):
            self.list.insert('end', f"{c['label']:<24} {c['seconds']:>5g} s  {'♪' if c['audio'] else ' '}  {c['title']}")
            if c['name'] == self.last: self.list.selection_set(k); self.list.see(k)
        f = self._frame(' 2. SAVE INTO ')
        r = tk.Frame(f, bg=COLOR_BG); r.pack(fill='x', padx=5, pady=2)
        tk.Entry(r, textvariable=self.out, bg='#222', fg='#FFF', insertbackground=COLOR_FG, relief='sunken', bd=2, font=FONT_MONO).pack(side='left', fill='x', expand=True, padx=4)
        self._btn(r, '[ BROWSE ]', self.pick_out).pack(side='left')
        f = self._frame(' 3. VIDEO OPTIONS ')
        r = tk.Frame(f, bg=COLOR_BG); r.pack(fill='x', padx=5, pady=2)
        self._label(r, 'Size').pack(side='left')
        ttk.Combobox(r, textvariable=self.size, values=list(h2m.SIZES), width=22, state='readonly', font=FONT_MONO).pack(side='left', padx=4)
        self._label(r, '  FPS').pack(side='left')
        tk.Entry(r, textvariable=self.fps, width=4, bg='#222', fg='#FFF', insertbackground=COLOR_FG, font=FONT_MONO).pack(side='left', padx=4)
        for text, var in (('music', self.music), ('hide corner text', self.nohud)):
            tk.Checkbutton(r, text=text, variable=var, bg=COLOR_BG, fg=COLOR_FG, selectcolor='#333', activebackground=COLOR_BG, activeforeground=COLOR_ACCENT, font=FONT_MONO).pack(side='left', padx=(12, 0))
        r = tk.Frame(self.root, bg=COLOR_BG); r.pack(fill='x', padx=10, pady=(6, 0))
        self._btn(r, '[ MAKE HTML ]', lambda: self.make(True, False)).pack(side='left')
        self._btn(r, '[ MAKE MP4 ]', lambda: self.make(False, True)).pack(side='left', padx=6)
        self._btn(r, '[ MAKE BOTH ]', lambda: self.make(True, True)).pack(side='left')
        self.cancel_btn = ttk.Button(r, text='[ CANCEL ]', command=self.cancel.set, state='disabled'); self.cancel_btn.pack(side='left', padx=6)
        self._btn(r, '[ SHOW IN FINDER ]', self.show, False).pack(side='right')
        ttk.Progressbar(self.root, variable=self.prog, maximum=100, orient='horizontal').pack(fill='x', padx=10, pady=(8, 0))
        lf = tk.Frame(self.root, bg=COLOR_BG); lf.pack(fill='both', expand=True, padx=10, pady=6)
        self.txt = tk.Text(lf, bg='#000', fg='#AAA', font=FONT_MONO, state='disabled', relief='sunken', bd=2, height=10); self.txt.pack(side='left', fill='both', expand=True)
        sb = ttk.Scrollbar(lf, orient='vertical', command=self.txt.yview); sb.pack(side='right', fill='y'); self.txt.config(yscrollcommand=sb.set)
        for tag, col in (('INFO', '#AAA'), ('SUCCESS', COLOR_FG), ('WARN', COLOR_ACCENT), ('ERROR', COLOR_ERROR), ('CMD', '#00AA00')): self.txt.tag_config(tag, foreground=col)


if __name__ == '__main__':
    root = tk.Tk()
    App(root)
    root.mainloop()
