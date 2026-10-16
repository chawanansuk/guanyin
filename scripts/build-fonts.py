# สร้างฟอนต์ของเว็บเอง แทนการโหลดจาก Google Fonts
#
# เหตุผล: Google Fonts ส่งฟอนต์ให้หน้าละ 1.1–1.8 MB (ครึ่งหนึ่งเป็น Noto Serif TC ที่ตัดเป็นชิ้นตามความถี่ทั่วไป
# ไม่ใช่ตามตัวอักษรที่เว็บนี้ใช้) และผู้ชมจากจีนแผ่นดินใหญ่เข้า Google Fonts ไม่ได้ จึงเห็นแต่ฟอนต์สำรอง
#
# วิธี: ฟอนต์ไทย/ละตินตัดให้เหลือเฉพาะช่วงอักษรที่ใช้ (เหลือ 14–29 KB ต่อน้ำหนัก)
# ส่วน Noto Serif TC แบ่งเป็นสองชั้น
#   ๑. ชุดกลาง = ตัวอักษรจีนที่ปรากฏในหลายหน้า (ชื่อเว็บ เมนู ชื่อคัมภีร์ในรายการอ้างอิง) อยู่ใน fonts.css ใช้ร่วมกันทุกหน้า
#   ๒. ชุดเฉพาะหน้า = ตัวอักษรที่เหลือของหน้านั้น BaseLayout ฝัง @font-face ให้เฉพาะหน้านั้น
#      แยกหน้าไทยกับหน้าจีน เพราะหน้าไทยใช้ตัวจีนไม่กี่สิบตัว (6 KB) ส่วนหน้าจีนใช้หลายร้อยตัว (90 KB) รวมไฟล์กันจะทำให้คนอ่านไทยโหลดเกินจำเป็น
#   แบ่งตามความถี่อย่างเดียวไม่ได้ผล เพราะตัวอักษร ๖๐ ตัวของหน้าหนึ่งกระจายอยู่ทุกชิ้น ทำให้ต้องโหลดเกือบทั้งหมดอยู่ดี
#   น้ำหนักตัวหนา (700) ทำเฉพาะตัวอักษรที่อยู่ในหัวข้อหรือตัวหนาจริง ส่วนน้ำหนัก 500 ไม่ทำ เบราว์เซอร์ใช้ 400 แทนเอง
#
# ใช้: pip install fonttools brotli && npm run build && npm run fonts  (แล้ว build อีกครั้ง)
#   ต้อง build ก่อน เพราะสคริปต์อ่านตัวอักษรจีนที่ใช้จริงจาก dist/ — เพิ่มเนื้อหาจีนใหม่แล้วให้รันซ้ำ
#   หน้าที่ยังไม่มีชุดเฉพาะหน้า ตัวอักษรหายากจะแสดงด้วยฟอนต์จีนของเครื่องแทน ไม่พัง
#   ไฟล์ต้นฉบับโหลดจาก github.com/google/fonts (สัญญาอนุญาต OFL) เก็บไว้ใน .fonts-src/ ซึ่งไม่ commit
#   ชื่อไฟล์มี hash ของเนื้อหา จึงตั้ง cache ยาวได้ (vercel.json)
import hashlib, io, json, re, sys, glob, collections, subprocess, html
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '.fonts-src'
OUT = ROOT / 'public' / 'fonts'
CSS = ROOT / 'src' / 'styles' / 'fonts.css'
MANIFEST = ROOT / 'src' / 'data' / 'fonts.json'  # ฟอนต์ที่ต้อง preload และชุดเฉพาะหน้า (BaseLayout อ่าน)
GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl'

try:
    from fontTools import subset
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
except ImportError:
    sys.exit('ต้องติดตั้งก่อน: pip install fonttools brotli')

# (ครอบครัว, น้ำหนัก, ไฟล์ต้นฉบับ, แกนของฟอนต์แปรผัน)
FONTS = [
    ('Trirong', 300, 'trirong/Trirong-Light.ttf', None),
    ('Trirong', 400, 'trirong/Trirong-Regular.ttf', None),
    ('Trirong', 500, 'trirong/Trirong-Medium.ttf', None),
    ('Trirong', 600, 'trirong/Trirong-SemiBold.ttf', None),
    ('Noto Serif Thai', 400, 'notoserifthai/NotoSerifThai[wdth,wght].ttf', {'wdth': 100, 'wght': 400}),
    ('Noto Serif Thai', 600, 'notoserifthai/NotoSerifThai[wdth,wght].ttf', {'wdth': 100, 'wght': 600}),
    ('Noto Serif Thai', 700, 'notoserifthai/NotoSerifThai[wdth,wght].ttf', {'wdth': 100, 'wght': 700}),
    ('IBM Plex Sans Thai', 400, 'ibmplexsansthai/IBMPlexSansThai-Regular.ttf', None),
    ('IBM Plex Sans Thai', 500, 'ibmplexsansthai/IBMPlexSansThai-Medium.ttf', None),
    ('IBM Plex Sans Thai', 600, 'ibmplexsansthai/IBMPlexSansThai-SemiBold.ttf', None),
    ('IBM Plex Mono', 400, 'ibmplexmono/IBMPlexMono-Regular.ttf', None),
    ('IBM Plex Mono', 500, 'ibmplexmono/IBMPlexMono-Medium.ttf', None),
]
PRELOAD = {('IBM Plex Sans Thai', 400), ('Trirong', 600)}  # ตัวเนื้อความกับหัวข้อ ทุกหน้าใช้แน่
TC_FAMILY, TC_SRC = 'Noto Serif TC', 'notoseriftc/NotoSerifTC[wght].ttf'
COMMON_MIN = 60       # ตัวอักษรที่อยู่ในหน้าอย่างน้อยเท่านี้ → ชุดกลาง
COMMON_BOLD_MIN = 30

# ตัวอักษรไทย ละติน เครื่องหมายวรรคตอน และอักษรถอดเสียงสันสกฤต/พินอิน (ā ś ṃ ǎ ฯลฯ)
LATIN_THAI = 'U+0000-00FF,U+0100-024F,U+0E00-0E7F,U+1E00-1EFF,U+2000-206F,U+20AC,U+2122,U+2190-2199,U+2248,U+2260,U+2264,U+2265,U+25A0-25FF,U+2713,U+2E3A,U+2E3B,U+FEFF,U+FFFD'

BOLD_TAGS = {'h1', 'h2', 'h3', 'h4', 'strong', 'b', 'th', 'dt'}
BOLD_CLASS = re.compile(r'brand__zh|site-foot__zh|pang__zh|(^|\s)zh(\s|$)|zh-big|pang-case__zh|couplet|pang__nav-name|pang-card__zh|qr__|chant__closing|chant__name')


def is_cjk(ch):
    """ตัวอักษรที่ให้ Noto Serif TC แสดง: ตัวจีน วรรคตอนจีน คานะ (คำกำกับภาพจาก仏像図彙 เป็นภาษาญี่ปุ่น) อักษรเต็มความกว้าง"""
    o = ord(ch)
    return (0x4E00 <= o <= 0x9FFF or 0x3400 <= o <= 0x4DBF or 0x20000 <= o <= 0x2FA1F
            or 0x3000 <= o <= 0x30FF or 0xFF00 <= o <= 0xFFEF or 0x2E80 <= o <= 0x2FDF)


class PageChars(HTMLParser):
    """ตัวอักษรจีนในหน้า แยกชุดที่อยู่ในหัวข้อ/ตัวหนา (ต้องมีน้ำหนัก 700)"""
    def __init__(self):
        super().__init__(); self.stack = []; self.all = set(); self.bold = set(); self.skip = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('script', 'style'): self.skip += 1
        self.stack.append(tag in BOLD_TAGS or bool(BOLD_CLASS.search(a.get('class') or '')))
        for k in ('content', 'alt', 'aria-label', 'title'):
            if a.get(k): self.all |= {c for c in a[k] if is_cjk(c)}
    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self.skip = max(0, self.skip - 1)
        if self.stack: self.stack.pop()
    def handle_data(self, d):
        if self.skip: return
        cs = {c for c in d if is_cjk(c)}
        self.all |= cs
        if any(self.stack): self.bold |= cs


def fetch(rel):
    dst = SRC / rel.split('/')[-1]
    if dst.exists():
        return dst
    SRC.mkdir(exist_ok=True)
    url = f"{GF}/{rel.replace('[', '%5B').replace(']', '%5D').replace(',', '%2C')}"
    print('โหลด', rel)
    subprocess.run(['curl', '-sSf', '-m', '600', '-o', str(dst), url], check=True)
    return dst


def route_of(path):
    """dist/zh/33-pang/yang-liu.html → /zh/33-pang/yang-liu (เหมือน cleanPath ใน BaseLayout)"""
    p = '/' + str(Path(path).relative_to(ROOT / 'dist'))
    p = re.sub(r'\.html$', '', p); p = re.sub(r'/index$', '', p)
    return p or '/'


def read_pages():
    pages, bold = {}, {}
    for f in glob.glob(str(ROOT / 'dist' / '**' / '*.html'), recursive=True):
        h = open(f, encoding='utf8').read()
        if 'http-equiv="refresh"' in h or '/admin/' in f:
            continue
        p = PageChars(); p.feed(h)
        pages[route_of(f)] = p.all; bold[route_of(f)] = p.bold
    if not pages:
        sys.exit('ไม่พบหน้าใน dist/ — รัน npm run build ก่อน')
    return pages, bold


def parse_unicodes(spec):
    out = []
    for part in spec.split(','):
        a, _, b = part[2:].partition('-')
        out.extend(range(int(a, 16), int(b or a, 16) + 1))
    return out


def to_range(codes):
    """รวมรหัสที่ติดกันเป็นช่วง ให้ unicode-range สั้นลง"""
    codes = sorted(set(codes)); out = []; i = 0
    while i < len(codes):
        j = i
        while j + 1 < len(codes) and codes[j + 1] == codes[j] + 1: j += 1
        out.append(f'U+{codes[i]:04X}' if i == j else f'U+{codes[i]:04X}-{codes[j]:04X}')
        i = j + 1
    return ','.join(out)


# ฟอนต์จีนเก็บเฉพาะฟีเจอร์ที่ใช้ตอนเขียนแนวนอน — ถ้าเก็บทั้งหมด (*) จะลากรูปแปร vert/fwid/hwid ของทุกตัวมาด้วย ไฟล์โตสามเท่า
TC_FEATURES = ['ccmp', 'locl', 'liga', 'kern', 'mark', 'mkmk', 'palt']


def subset_woff2(font_path, unicodes, features=('*',)):
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = list(features)  # ฟอนต์ไทยต้องคงไว้ทั้งหมด ไม่งั้นสระบน/ล่างและวรรณยุกต์ลอยผิดที่
    opts.hinting = False
    opts.desubroutinize = True
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    opts.drop_tables += ['DSIG']
    font = TTFont(font_path)
    s = subset.Subsetter(opts); s.populate(unicodes=unicodes); s.subset(font)
    buf = io.BytesIO(); font.flavor = 'woff2'; font.save(buf)
    return buf.getvalue()


def write(data, stem, sub=''):
    d = OUT / sub if sub else OUT
    d.mkdir(parents=True, exist_ok=True)
    h = hashlib.sha1(data).hexdigest()[:8]
    name = f'{stem}.{h}.woff2'
    (d / name).write_bytes(data)
    return f"/fonts/{sub + '/' if sub else ''}{name}"


def face(family, weight, url, unicode_range):
    return (f"@font-face{{font-family:'{family}';font-style:normal;font-weight:{weight};font-display:swap;"
            f"src:url({url}) format('woff2');unicode-range:{unicode_range}}}")


def main():
    for old in OUT.rglob('*.woff2'):
        old.unlink()
    css = ['/* สร้างโดย scripts/build-fonts.py — อย่าแก้มือ */']
    manifest = {'preload': [], 'pages': {}}
    total = 0

    uni = parse_unicodes(LATIN_THAI)
    for family, weight, rel, axes in FONTS:
        src = fetch(rel)
        if axes:  # ฟอนต์แปรผัน → ตัดเป็นน้ำหนักคงที่ก่อน
            inst = instancer.instantiateVariableFont(TTFont(src), axes, inplace=False, updateFontNames=False)
            tmp = SRC / f'_inst-{family}-{weight}.ttf'.replace(' ', '-'); inst.save(tmp); src = tmp
        data = subset_woff2(src, uni)
        url = write(data, f"{family.lower().replace(' ', '-')}-{weight}")
        css.append(face(family, weight, url, LATIN_THAI))
        if (family, weight) in PRELOAD:
            manifest['preload'].append(url)
        total += len(data)
        print(f'{family} {weight}: {len(data) // 1024} KB')

    # ---------- Noto Serif TC ----------
    pages, bold = read_pages()
    df = collections.Counter(c for s in pages.values() for c in s)
    dfb = collections.Counter(c for s in bold.values() for c in s)
    common = {c for c, n in df.items() if n >= COMMON_MIN}
    common_bold = {c for c, n in dfb.items() if n >= COMMON_BOLD_MIN}

    # ตัดฟอนต์แปรผัน 17 MB ให้เหลือตัวที่ใช้ก่อน แล้วค่อยแยกน้ำหนัก จะเร็วกว่ามาก
    all_codes = sorted({ord(c) for c in df})
    base = TTFont(fetch(TC_SRC))
    opts = subset.Options(); opts.layout_features = TC_FEATURES; opts.hinting = False; opts.name_IDs = ['*']; opts.notdef_outline = True
    s = subset.Subsetter(opts); s.populate(unicodes=all_codes); s.subset(base)
    inst_path = {}
    for weight in (400, 700):
        buf = io.BytesIO(); base.save(buf); buf.seek(0)
        inst = instancer.instantiateVariableFont(TTFont(buf), {'wght': weight}, inplace=False, updateFontNames=False)
        inst_path[weight] = SRC / f'_inst-tc-{weight}.ttf'; inst.save(inst_path[weight])

    def tc(weight, chars, stem, sub=''):
        codes = sorted({ord(c) for c in chars})
        data = subset_woff2(inst_path[weight], codes, TC_FEATURES)
        return write(data, stem, sub), to_range(codes), len(data)

    url, rng, n = tc(400, common, 'noto-serif-tc-400-common'); css.append(face(TC_FAMILY, 400, url, rng)); total += n
    print(f'{TC_FAMILY} 400 ชุดกลาง: {len(common)} ตัวอักษร {n // 1024} KB')
    url, rng, n = tc(700, common_bold, 'noto-serif-tc-700-common'); css.append(face(TC_FAMILY, 700, url, rng)); total += n
    print(f'{TC_FAMILY} 700 ชุดกลาง: {len(common_bold)} ตัวอักษร {n // 1024} KB')

    per_page = {route: {'all': chars - common, 'bold': bold[route] - common_bold} for route, chars in pages.items()}
    cache = {}
    for key, sets in sorted(per_page.items()):
        faces = []
        for weight, chars in ((400, sets['all']), (700, sets['bold'])):
            if not chars:
                continue
            sig = (weight, frozenset(chars))
            if sig not in cache:  # หลายหน้าใช้ชุดเดียวกัน (เช่นหน้าบทความที่ใช้แต่ชื่อคัมภีร์เดียวกัน) ใช้ไฟล์เดียวกัน
                stem = 'p-' + (re.sub(r'[^a-z0-9]+', '-', key.strip('/')) or 'home') + f'-{weight}'
                cache[sig] = tc(weight, chars, stem, 'p')
            url, rng, n = cache[sig]
            faces.append({'w': weight, 'url': url, 'range': rng})
        if faces:
            manifest['pages'][key] = faces
    page_bytes = sum(v[2] for v in cache.values())
    total += page_bytes
    print(f'{TC_FAMILY} ชุดเฉพาะหน้า: {len(cache)} ไฟล์ {page_bytes // 1024} KB สำหรับ {len(manifest["pages"])} หน้า')

    CSS.write_text('\n'.join(css) + '\n', encoding='utf8')
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n', encoding='utf8')
    print(f'รวม {total // 1024} KB ใน {OUT.relative_to(ROOT)}/ และเขียน {CSS.relative_to(ROOT)} {MANIFEST.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
