"""
build.py -- builds "Knife Country" (the Yangjiang knives scrolling page) into ONE offline HTML file:
fonts (subset, inlined), styles, script and the numbered source list all go inside.

Run it with Thonny's Run button. Needs: pip install fonttools brotli
The first run downloads the three open-licensed fonts into font_cache/ (licenses are in fonts/OFL-*.txt).
"""
# ============================ SETTINGS (edit these) ============================
OUT = "knife-country.html"            # written next to this file
PUBLISH_TO = ""   # set to "../../players/yangjiang-knives.html" once it is ready to publish
FONT_CACHE = "../../font_cache"
GF = "https://raw.githubusercontent.com/google/fonts/main/ofl/"
FONTS = {   # css name -> (cache file, download path)
    "Serif": ("sourceserif4__SourceSerif4[opsz,wght].ttf", "sourceserif4/SourceSerif4%5Bopsz,wght%5D.ttf"),
    "SerifItalic": ("sourceserif4__SourceSerif4-Italic[opsz,wght].ttf", "sourceserif4/SourceSerif4-Italic%5Bopsz,wght%5D.ttf"),
    "Arch": ("archivo__Archivo[wdth,wght].ttf", "archivo/Archivo%5Bwdth,wght%5D.ttf"),
    "Han": ("notoserifsc__NotoSerifSC[wght].ttf", "notoserifsc/NotoSerifSC%5Bwght%5D.ttf"),
}
# ===============================================================================
import base64, io, json, os, re, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src")


def path(p):
    return os.path.normpath(os.path.join(HERE, p))


def get_font(name):
    fn, url = FONTS[name]
    local = os.path.join(path(FONT_CACHE), fn)
    if not os.path.exists(local):
        os.makedirs(path(FONT_CACHE), exist_ok=True)
        print("downloading", fn)
        urllib.request.urlretrieve(GF + url, local)
    return local


def subset(font_file, text=None, unicodes=None):
    from fontTools import subset as fts
    from fontTools.ttLib import TTFont
    opts = fts.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    f = TTFont(font_file)
    s = fts.Subsetter(opts)
    s.populate(text=text or "", unicodes=unicodes or [])
    s.subset(f)
    buf = io.BytesIO()
    f.flavor = "woff2"
    f.save(buf)
    return buf.getvalue()


def main():
    html = open(os.path.join(SRC, "page.html"), encoding="utf-8").read()
    css = open(os.path.join(SRC, "page.css"), encoding="utf-8").read()
    js = open(os.path.join(SRC, "page.js"), encoding="utf-8").read()
    sources = json.load(open(os.path.join(SRC, "sources.json"), encoding="utf-8"))
    by_id = {s["id"]: s for s in sources}

    # citations: [[id]] -> a numbered superscript link, numbered in order of first use
    order = []
    def cite(m):
        sid = m.group(1)
        if sid not in by_id:
            sys.exit(f"unknown source id: {sid}")
        if sid not in order:
            order.append(sid)
        n = order.index(sid) + 1
        return f'<sup class="fn"><a href="#src-{n}" aria-label="source {n}">{n}</a></sup>'
    html = re.sub(r"\[\[([\w-]+)\]\]", cite, html)
    unused = [s["id"] for s in sources if s["id"] not in order]
    if unused:
        print("note: sources not cited yet:", ", ".join(unused))

    items = []
    for i, sid in enumerate(order, 1):
        s = by_id[sid]
        items.append(f'<li id="src-{i}">{esc(s["text"])}<small><a href="{esc(s["url"])}" rel="noopener">{esc(s["url"])}</a>'
                     f' · via {esc(s["via"])} · confidence: {esc(s["conf"])}</small></li>')
    src_list = "<ol>" + "".join(items) + "</ol>"
    src_json = json.dumps([{"n": i + 1, **by_id[sid]} for i, sid in enumerate(order)], ensure_ascii=False)

    # fonts: Latin subsets keep their variable axes; the Chinese font keeps only the characters used
    latin = list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + list(range(0x2000, 0x2070)) + \
        [0x2190, 0x2192, 0x2193, 0x2191, 0x2212, 0x00D7, 0x2026, 0x20AC, 0x00B0]
    everything = html + js
    han_chars = "".join(sorted({c for c in everything if ord(c) >= 0x2E80}))
    faces = []
    for name, fam, style in [("Serif", "Serif", "normal"), ("SerifItalic", "Serif", "italic"), ("Arch", "Arch", "normal")]:
        data = subset(get_font(name), unicodes=latin)
        extra = "font-stretch:62% 125%;" if name == "Arch" else ""
        faces.append(f'@font-face{{font-family:"{fam}";font-style:{style};font-weight:100 900;{extra}font-display:swap;'
                     f'src:url(data:font/woff2;base64,{base64.b64encode(data).decode()}) format("woff2")}}')
        print(f"{name}: {len(data)//1024} KB")
    data = subset(get_font("Han"), text=han_chars + "·，。：；“”")
    faces.append(f'@font-face{{font-family:"Han";font-weight:200 900;font-display:swap;'
                 f'src:url(data:font/woff2;base64,{base64.b64encode(data).decode()}) format("woff2")}}')
    print(f"Han: {len(data)//1024} KB for {len(han_chars)} characters")

    out = (html.replace("{{FONTFACES}}", "\n".join(faces)).replace("{{CSS}}", css).replace("{{JS}}", js)
           .replace("{{SOURCES_LIST}}", src_list).replace("{{SOURCES_JSON}}", src_json.replace("</", "<\\/")))

    # offline check: nothing may be loaded from the internet (links in the source list are fine)
    for m in re.finditer(r'(?:src=|url\()\s*["\']?(https?://[^"\')\s]+)', out):
        sys.exit(f"remote load found: {m.group(1)}")

    dest = os.path.join(HERE, OUT)
    open(dest, "w", encoding="utf-8").write(out)
    print(f"wrote {OUT}: {len(out.encode())//1024} KB")
    if PUBLISH_TO:
        pub = path(PUBLISH_TO)
        open(pub, "w", encoding="utf-8").write(out)
        print("published to", os.path.relpath(pub, path("../..")))


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))


if __name__ == "__main__":
    main()
