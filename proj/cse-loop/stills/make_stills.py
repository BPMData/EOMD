"""
make_stills.py -- the three storyboard stills for the CSE hallway loop (1920x1080 SVG, then PNG via Chrome).
Press Run in Thonny. Needs Bryan's local MakeCode/ folder (gitignored) for the block shapes.
All on-screen words are DRAFT (see ../storyboard.md).
"""
import os, sys, subprocess, math

# ============================ SETTINGS (edit these) ============================
BLOCK_SCALE = 1.8          # MakeCode blocks at 1.8x -> 34 px block text at 1080p (brief: body >= 32 px)
MAKE_PNGS   = True         # also save PNGs with headless Chrome (mock keychain, throwaway profile)
CHROME      = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# ===============================================================================

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "MakeCode"))
from makecode_blocks import hat, stmt, D, N, Icon, draw, BASIC, LOOPS, LOGIC, VAR, INPUT, _h  # noqa: E402

W, H = 1920, 1080
BLUE, RED, YELLOW = "#0033A0", "#D50032", "#FFD100"          # Danbury colors (brief section 7)
INK, WHITE, PLTW_BLUE = "#0e0318", "#ffffff", "#3e34d9"
SANS = "Poppins, 'Avenir Next', 'Helvetica Neue', Arial, sans-serif"   # Poppins at build; Avenir stands in


def stack(blocks, x, y, s=BLOCK_SCALE):
    """A locked MakeCode stack, drawn bottom-up, top-left at (x, y) in frame pixels."""
    ys, yy = [], 0
    for b in blocks:
        ys.append(yy); yy += _h(b)
    parts = [draw(b, 0, by)[0] for b, by in reversed(list(zip(blocks, ys)))]
    return (f'<g transform="translate({x},{y}) scale({s})" font-family="Menlo, Monaco, monospace">'
            + "".join(parts) + "</g>")


def text(x, y, s, size, fill, weight=800, anchor="start"):
    return (f'<text x="{x}" y="{y}" font-family="{SANS}" font-size="{size}" font-weight="{weight}" '
            f'fill="{fill}" text-anchor="{anchor}">{s}</text>')


def line(d, col, width=16, glow=None):
    """The signature line: one bright stroke with a soft glow and a round head."""
    return (f'<path d="{d}" fill="none" stroke="{glow or col}" stroke-opacity=".25" stroke-width="{width*2.6}" '
            f'stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{width}" stroke-linecap="round" '
            f'stroke-linejoin="round"/>')


def head(x, y, col):
    return f'<circle cx="{x}" cy="{y}" r="22" fill="{WHITE}" stroke="{col}" stroke-width="8"/>'


def pltw_lockup(x, y, col):
    # Placeholder for the official PLTW logo (file comes from pltw.org at build).
    return (text(x, y, "PLTW", 40, col, 900) +
            f'<path d="M{x+118},{y-38} h16 v16" fill="none" stroke="{col}" stroke-width="5"/>' +
            f'<line x1="{x+154}" y1="{y-34}" x2="{x+154}" y2="{y+4}" stroke="{col}" stroke-width="3" opacity=".6"/>' +
            text(x + 176, y, "Computer Science Essentials", 34, col, 700))


def sdv(x, y, s=1.0):
    """A yellow, Lego-like build-kit robot car (look reference only; not a copy of any kit)."""
    o = [f'<g transform="translate({x},{y}) scale({s})">']
    o.append('<ellipse cx="0" cy="118" rx="210" ry="22" fill="#000" opacity=".22"/>')
    for wx in (-140, 140):                                         # back wheels
        o.append(f'<circle cx="{wx}" cy="60" r="62" fill="#1b1b1f"/><circle cx="{wx}" cy="60" r="36" fill="{YELLOW}"/>')
        for k in range(6):
            a = k * math.pi / 3
            o.append(f'<circle cx="{wx+22*math.cos(a):.1f}" cy="{60+22*math.sin(a):.1f}" r="6" fill="#c9a400"/>')
    o.append(f'<rect x="-190" y="-10" width="380" height="54" rx="8" fill="{YELLOW}" stroke="#b89400" stroke-width="4"/>')
    for k in range(9):                                             # the beam's holes
        o.append(f'<circle cx="{-160+k*40}" cy="17" r="10" fill="#b89400"/>')
    o.append('<rect x="-95" y="-118" width="190" height="112" rx="14" fill="#16161a"/>')   # the brain
    o.append('<rect x="-70" y="-98" width="140" height="62" rx="6" fill="#2b6ef2"/>')
    o.append(f'<rect x="-120" y="-150" width="240" height="38" rx="8" fill="{YELLOW}" stroke="#b89400" stroke-width="4"/>')
    for k in range(5):
        o.append(f'<circle cx="{-96+k*48}" cy="-131" r="8" fill="#b89400"/>')
    o.append('<path d="M60,-118 C110,-200 170,-170 150,-120" fill="none" stroke="#e23b3b" stroke-width="6"/>')
    for wx in (-140, 140):                                         # front wheels
        o.append(f'<circle cx="{wx}" cy="70" r="66" fill="#26262b"/><circle cx="{wx}" cy="70" r="38" fill="{YELLOW}" stroke="#b89400" stroke-width="4"/>')
        o.append(f'<circle cx="{wx}" cy="70" r="9" fill="#26262b"/>')
    o.append("</g>")
    return "".join(o)


def phone(x, y, w, h):
    o = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="46" fill="{INK}"/>',
         f'<rect x="{x+18}" y="{y+40}" width="{w-36}" height="{h-80}" rx="18" fill="{WHITE}"/>',
         f'<rect x="{x+38}" y="{y+70}" width="{w-76}" height="70" rx="12" fill="{BASIC}"/>',
         text(x + w / 2, y + 118, "Tap me!", 34, WHITE, 800, "middle"),
         f'<circle cx="{x+w/2}" cy="{y+h*0.62}" r="72" fill="{RED}"/>',
         f'<circle cx="{x+w/2-24}" cy="{y+h*0.62-26}" r="18" fill="#fff" opacity=".45"/>']
    return "".join(o)


def microbit(x, y, s=1.0):
    o = [f'<g transform="translate({x},{y}) scale({s})">',
         '<rect x="-150" y="-120" width="300" height="240" rx="26" fill="#1d1d22"/>',
         '<rect x="-150" y="96" width="300" height="24" fill="#c8a24a"/>']
    heart = "0101011111111110111000100"
    for i, c in enumerate(heart):
        cx, cy = -64 + (i % 5) * 32, -80 + (i // 5) * 32
        o.append(f'<rect x="{cx-7}" y="{cy-11}" width="14" height="22" rx="3" fill="{"#ff3b3b" if c == "1" else "#3a3a40"}"/>')
        if c == "1":
            o.append(f'<circle cx="{cx}" cy="{cy}" r="16" fill="#ff3b3b" opacity=".25"/>')
    o.append('<circle cx="-118" cy="0" r="18" fill="#3a3a40"/><circle cx="118" cy="0" r="18" fill="#3a3a40"/>')
    o.append(text(-118, 52, "A", 24, WHITE, 800, "middle") + text(118, 52, "B", 24, WHITE, 800, "middle"))
    o.append("</g>")
    return "".join(o)


def drone(x, y, s=1.0, tilt=-8):
    o = [f'<g transform="translate({x},{y}) rotate({tilt}) scale({s})">',
         '<ellipse cx="0" cy="210" rx="150" ry="18" fill="#000" opacity=".18"/>']
    for dx in (-130, 130):
        o.append(f'<line x1="0" y1="0" x2="{dx}" y2="-20" stroke="#f4f4f6" stroke-width="22" stroke-linecap="round"/>')
        o.append(f'<ellipse cx="{dx}" cy="-34" rx="92" ry="20" fill="none" stroke="{WHITE}" stroke-width="10"/>')
        o.append(f'<ellipse cx="{dx}" cy="-34" rx="84" ry="10" fill="#ffffff" opacity=".35"/>')
        o.append(f'<rect x="{dx-10}" y="-38" width="20" height="26" rx="5" fill="#2a2a30"/>')
    o.append('<rect x="-72" y="-30" width="144" height="70" rx="22" fill="#f4f4f6"/>')
    o.append('<rect x="-40" y="-14" width="80" height="20" rx="8" fill="#2a2a30"/>')
    o.append('<circle cx="0" cy="26" r="8" fill="#38d9ff"/>')
    o.append("</g>")
    return "".join(o)


def frame(bg, body, name):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
           f'width="{W}" height="{H}" viewBox="0 0 {W} {H}"><rect width="{W}" height="{H}" fill="{bg}"/>{body}</svg>')
    path = os.path.join(HERE, name + ".svg")
    open(path, "w").write(svg)
    return path


# ---------------- Still 1: row 2 (0:08) -- apps, on yellow ----------------
s1 = []
s1.append(text(96, 170, "Build your own apps.", 96, INK))
s1.append(text(100, 236, "Never coded? Start here.", 44, INK, 600))
apps = [hat(BASIC, "when", D("Button1"), ".Click", stack=[
        stmt(VAR, "set", D("Ball1"), ".PaintColor to", D("red")),
        stmt(INPUT, "call", D("Sound1"), ".Play")])]
s1.append(stack(apps, 120, 330))
s1.append(line("M 960 470 L 1150 470 Q 1180 470 1180 440 L 1180 310 Q 1180 280 1210 280 L 1580 280", BLUE, glow=WHITE))
s1.append(head(1580, 280, BLUE))
s1.append(phone(1210, 300, 400, 700))
s1.append(text(1610, 1050, "MIT App Inventor", 36, INK, 700, "end"))
s1.append(pltw_lockup(96, 1010, INK))
p1 = frame(YELLOW, "".join(s1), "still-1-apps")

# ---------------- Still 2: row 3 (0:17) -- self-driving cars, on blue ----------------
s2 = []
s2.append(text(96, 170, "Program self-driving cars.", 96, WHITE))
s2.append(text(100, 236, "VEXcode VR  ·  VEXcode EXP", 44, YELLOW, 700))
cars = [hat(BASIC, "when started", stack=[
        stmt(LOOPS, "drive", D("forward"), "for", N("200"), D("mm")),
        stmt(LOOPS, "turn", D("right"), "for", N("90"), "degrees")])]
road = "M -40 900 C 400 900 600 760 900 760 C 1250 760 1350 620 1560 560 C 1700 520 1800 520 1960 540"
s2.append(f'<path d="{road}" fill="none" stroke="#002a85" stroke-width="150" stroke-linecap="round"/>')
s2.append(line(road, WHITE))
s2.append(stack(cars, 120, 320))
s2.append(sdv(1180, 560, 0.95))
s2.append(pltw_lockup(96, 1010, WHITE))
p2 = frame(BLUE, "".join(s2), "still-2-cars")

# ---------------- Still 3: row 5 (0:35) -- drones, Academy red ----------------
s3 = []
s3.append(text(96, 170, "Code things that fly.", 96, WHITE))
s3.append(text(100, 236, "CoDrone EDU  ·  Python", 44, WHITE, 600))
# Python on dark strips that snap like blocks (Robolink's own example code, from Bryan)
code = ["drone.takeoff()", "drone.set_roll(50)", "drone.move(1)", "drone.hover(2)", "drone.land()"]
for i, ln in enumerate(code):
    y = 330 + i * 92
    s3.append(f'<rect x="120" y="{y}" width="560" height="78" rx="10" fill="{INK}"/>')
    s3.append(f'<rect x="120" y="{y}" width="12" height="78" rx="4" fill="{YELLOW}"/>')
    s3.append(f'<text x="156" y="{y+51}" font-family="Menlo, Monaco, monospace" font-size="34" fill="{WHITE}">'
              f'<tspan fill="{YELLOW}">drone</tspan>{ln[5:]}</text>')
path = "M 1000 640 C 1060 520 1180 560 1260 470 C 1340 380 1360 310 1480 300 C 1700 280 1800 420 1960 380"
s3.append(line(path, WHITE))
s3.append(microbit(940, 720, 0.75))
s3.append(drone(1480, 300, 1.0))
s3.append(f'<circle cx="150" cy="985" r="64" fill="{WHITE}"/>')
s3.append(f'<image href="../sources/itc-academy-badge.webp" x="90" y="925" width="120" height="120"/>')
s3.append(text(236, 975, "Information Technology &amp; Cybersecurity Academy", 34, WHITE, 700))
s3.append(text(236, 1020, "Danbury High School", 30, WHITE, 500))
p3 = frame(RED, "".join(s3), "still-3-fly")

print("wrote", p1, p2, p3, sep="\n")
if MAKE_PNGS and os.path.exists(CHROME):
    import tempfile
    profile = tempfile.mkdtemp(prefix="stills-chrome-")   # throwaway profile; mock keychain avoids macOS prompts
    for p in (p1, p2, p3):
        out = p[:-4] + ".png"
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--use-mock-keychain",
                        "--password-store=basic", "--no-first-run", "--no-default-browser-check",
                        f"--user-data-dir={profile}", f"--window-size={W},{H}", f"--screenshot={out}",
                        "--allow-file-access-from-files", "file://" + p], capture_output=True, timeout=60)
        print("png:", out, os.path.exists(out))
