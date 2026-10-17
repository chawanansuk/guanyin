# เพลงบรรเลงประจำปาง รุ่นที่ ๒ — ใช้เสียงเครื่องดนตรีจริงจาก soundfont แทนเสียงสังเคราะห์ล้วน
#
# ที่มาของวิธี (ค้นจาก GitHub และเอกสารดนตรีจีน):
#   · เสียง: เล่นตัวอย่างเสียงเครื่องดนตรีจริงผ่าน soundfont แบบไม่ต้องมีลำโพง ด้วย tinysoundfont (แนวเดียวกับ ambient-gen บน PyPI)
#     ใช้ FluidR3_GM (สัญญาอนุญาต MIT ใช้เชิงพาณิชย์ได้) — Koto แทนกู่เจิง (พิณตระกูลเดียวกัน) Shakuhachi แทนขลุ่ยเซียว (ขลุ่ยเป่าปลาย)
#   · โครงเพลงแบบจีน: นำด้วยช่วง 散板 (จังหวะอิสระ) แล้วสี่วรรคแบบ 起承转合 (ตั้ง–รับ–เปลี่ยน–รวบ)
#     วรรคถัดไปขึ้นต้นด้วยโน้ตที่วรรคก่อนจบ (魚咬尾 "ปลากัดหาง" เทคนิคต่อวรรคของเพลงพื้นบ้านจีน)
#   · ลูกเล่นของกู่เจิง: โน้ตประดับ (倚音) · กดสายให้เสียงไหลขึ้นลง (按滑) · สั่นสาย (揉弦) · กวาดสาย (刮奏) ก่อนเข้าวรรคเปลี่ยน
#     · รัวสาย (摇指) บนโน้ตสูงสุดของเพลง — ทำด้วย pitch bend และโน้ตถี่
#   · ความเป็นคนเล่น: เลื่อนจังหวะสุ่มเล็กน้อย ความดังโค้งตามวรรค ช้าลงตอนจบวรรค (ritardando) ขลุ่ยมีช่วงหายใจ
#   · ขลุ่ยตอบวรรคของพิณ (ถาม–ตอบ) ในวรรคหลัง ๆ เบสเป็นคู่ห้าเปล่า ไม่ใช้คอร์ด
#   · เสียงประกอบ: หยดน้ำ (โน้ตสูงห่าง ๆ) กระดิ่งลม (กลุ่มโน้ตเร็ว) คลื่น ลม น้ำไหล ตามสูตรของแต่ละปาง · คงโหวกระจายคอร์ดไล่ขึ้น
#   · มิกซ์: แยกแต่ละเครื่องแล้ววางซ้ายขวา ห้องก้องแบบ convolution ปรับความดังสุดท้ายที่ -18 LUFS (เบากว่าเพลงทั่วไป เหมาะฟังระหว่างไหว้)
#     แล้วจำกัดยอดเสียงไม่ให้แตกหลังแปลงเป็น AAC
#
# ใช้: pip install numpy && pip install --no-deps tinysoundfont
#      soundfont: apt-get download fluid-soundfont-gm แล้ว dpkg-deb -x ... วาง FluidR3_GM.sf2 ไว้ที่ .soundfonts/ (ไม่ commit)
#      python3 scripts/render-pang-music.py [slug ...]
import importlib.util, json, subprocess, sys, tempfile, wave, os
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
SF2 = ROOT / '.soundfonts' / 'FluidR3_GM.sf2'
OUT = ROOT / 'public' / 'audio'
DATA = ROOT / 'src' / 'data' / 'pang-chant.json'

try:
    import tinysoundfont
except ImportError:
    sys.exit('ต้องติดตั้งก่อน: pip install --no-deps tinysoundfont')

spec = importlib.util.spec_from_file_location('synth', ROOT / 'scripts' / 'synth-pang-music.py')
synth = importlib.util.module_from_spec(spec); spec.loader.exec_module(synth)
RECIPES = [(1, 'yang-liu', 'gong', 293.66, 60, 'zheng', ['drops'])] + list(synth.R)
MODES = synth.MODES

GM = {'koto': 107, 'shakuhachi': 77, 'harp': 46, 'celesta': 8, 'glock': 9, 'bells': 14, 'pad': 89, 'tinkle': 112}
# เครื่องนำ / เครื่องตอบ / เบส / ช่วงเสียงของทำนอง (เลื่อนออกเทฟ)
ORCH = {
    'zheng': dict(lead='koto', answer='shakuhachi', bass='koto', lead_oct=0, legato=False),
    'qin':   dict(lead='koto', answer=None, bass=None, lead_oct=-1, legato=False),
    'xiao':  dict(lead='shakuhachi', answer=None, bass='koto', lead_oct=0, legato=True),
    'bell':  dict(lead='celesta', answer='shakuhachi', bass='pad', lead_oct=0, legato=False),
    'harp':  dict(lead='harp', answer='shakuhachi', bass='harp', lead_oct=0, legato=False),
}
PAN = {'lead': 54, 'answer': 84, 'bass': 44, 'bells': 64, 'grace': 54, 'drops': 88, 'chimes': 30}  # 0 ซ้าย 64 กลาง 127 ขวา


def midi_of(hz):
    return int(round(69 + 12 * np.log2(hz / 440)))


class Song:
    """ลำดับเหตุการณ์ของเพลง แยกตามเครื่อง เวลาเป็นวินาที"""
    def __init__(self, rng, bpm):
        self.rng = rng; self.beat = 60 / bpm; self.t = 0.0
        self.parts = {}

    def ev(self, part, t, kind, *data):
        self.parts.setdefault(part, []).append((max(0.0, t), kind, data))

    def note(self, part, t, key, dur, vel, jitter=0.012):
        t += self.rng.normal(0, jitter)
        vel = int(np.clip(vel + self.rng.normal(0, 6), 12, 120))
        self.ev(part, t, 'on', key, vel); self.ev(part, t + dur, 'off', key)


def compose(order, slug, mode, base, bpm, inst, orn):
    rng = np.random.default_rng(7000 + order)
    o = ORCH[inst]
    S = Song(rng, bpm); beat = S.beat
    root = midi_of(base) + 12 * o['lead_oct']
    sc = MODES[mode]
    key = lambda d: root + sc[d % 5] + 12 * (d // 5)

    # ---------- โมทีฟหลัก ๒ ห้อง: เดินทีละขั้นเป็นส่วนใหญ่ จบโน้ตยาว ----------
    CELLS = [[2, 1, 1], [1.5, .5, 2], [1, 1, 2], [3, 1], [2, 2], [1, .5, .5, 2]]
    def phrase(start, end, bars=4, lo=2, hi=10, climax=False):
        seq = []; d = start
        cells = [CELLS[rng.integers(len(CELLS))] for _ in range(bars - 1)] + [[2, 2] if rng.random() < .5 else [4]]
        flat = [b for c in cells for b in c]
        peak = int(len(flat) * 0.6)
        for i, b in enumerate(flat):
            if i == len(flat) - 1: d = end
            elif i == len(flat) - 2: d = end + int(rng.choice([1, -1]))
            elif i > 0:
                step = int(rng.choice([-2, -1, -1, 1, 1, 2, 0], p=[.08, .27, .1, .27, .1, .08, .1]))
                if climax and i < peak: step = abs(step)          # วรรคเปลี่ยนไต่ขึ้นหาจุดสูงสุด
                d += step
            d = int(np.clip(d, lo, hi)); seq.append([d, b])
        return seq

    A = phrase(6, 4)                       # 起 ตั้ง — จบค้างที่ขั้นที่ ๔ (ยังไม่จบ)
    A2 = phrase(A[-1][0], 5)               # 承 รับ — ปลากัดหาง ขึ้นต้นด้วยโน้ตที่ A จบ แล้วลงโน้ตหลัก
    B = phrase(A2[-1][0] + 2, 7, lo=4, hi=12, climax=True)  # 转 เปลี่ยน — ยกขึ้นสูง
    A3 = [x[:] for x in A]; A3[0][0] = B[-1][0]              # 合 รวบ — กลับทำนองแรก ขึ้นต้นด้วยหางของ B
    A3[-2:] = [[6, A3[-2][1]], [5, max(3, A3[-1][1])]]       # จบที่โน้ตหลัก ยาว

    lead, ans, bass = 'lead', 'answer', 'bass'
    t = 0.8
    # ระฆังเปิด
    S.note('bells', t, root - 12 if root > 60 else root, 6.0, 70, 0)
    t += 2.2 * beat

    # ---------- 散板 ช่วงจังหวะอิสระ: โน้ตห่าง ๆ ไล่ขึ้น ปล่อยให้เสียงค้าง ----------
    for d, gap in [(0, 1.6), (2, 1.1), (3, 1.4), (5, 2.6)]:
        S.note(lead, t, key(d), gap * beat * 1.5, 58)
        t += gap * beat * (0.9 + 0.25 * rng.random())
    t += 0.6 * beat

    biggest = {'t': None}

    def play(seq, vel0, section):
        nonlocal t
        start = t
        n = len(seq); total = sum(b for _, b in seq)
        acc = 0.0
        for i, (d, b) in enumerate(seq):
            # ritardando: ช่วง ๒ จังหวะสุดท้ายของวรรคช้าลงถึง ๓๐%
            stretch = 1 + 0.3 * max(0.0, (acc + b / 2 - (total - 2)) / 2)
            dur = b * beat * stretch
            arch = np.sin(np.pi * (acc + b / 2) / total)          # ดังกลางวรรค เบาหัวท้าย
            vel = vel0 + 16 * arch
            k = key(d)
            long_note = b >= 2
            if o['legato']:
                # ขลุ่ย: ต่อโน้ตกัน เว้นหายใจท้ายวรรค
                gap = 0.18 * beat if i == n - 1 else -0.03
                S.note(lead, t, k, dur - gap, vel)
                if long_note:  # 揉 สั่นเสียงช้า ๆ หลังโน้ตเริ่ม
                    for j in range(int(dur / 0.09)):
                        tt = t + 0.35 + j * 0.09
                        if tt > t + dur - 0.1: break
                        S.ev(lead, tt, 'bend', int(8192 + 260 * np.sin(2 * np.pi * 4.6 * (tt - t - 0.35))))
                    S.ev(lead, t + dur - 0.05, 'bend', 8192)
                if i > 0 and rng.random() < 0.22:   # 打音 โน้ตประดับเร็ว
                    S.note('grace', t - 0.07, k + 2, 0.06, vel - 18, 0)
            else:
                if long_note and rng.random() < 0.35:  # 倚音 โน้ตประดับก่อนโน้ตยาว
                    S.note('grace', t - 0.09, key(d + 1), 0.12, vel - 22, 0.004)
                S.note(lead, t, k, dur + 1.6, vel)
                if long_note and rng.random() < 0.55:
                    # 按滑 กดสายให้เสียงไหลขึ้นแล้วคืน หรือ 揉弦 สั่นสาย
                    if rng.random() < 0.5:
                        up = 2 if (d % 5) in (1, 4) else 1   # ขึ้นทีละเต็มเสียงหรือครึ่งเสียงตามระยะไปขั้นถัดไป
                        t0 = t + dur * 0.35
                        for j in range(8):
                            S.ev(lead, t0 + j * 0.03, 'bend', int(8192 + 4096 * up / 2 * (j + 1) / 8))
                        for j in range(8):
                            S.ev(lead, t0 + 0.5 + j * 0.035, 'bend', int(8192 + 4096 * up / 2 * (7 - j) / 8))
                    else:
                        for j in range(int(dur / 0.08)):
                            tt = t + 0.25 + j * 0.08
                            if tt > t + dur: break
                            S.ev(lead, tt, 'bend', int(8192 + 330 * np.sin(2 * np.pi * 5.2 * (tt - t))))
                        S.ev(lead, t + dur, 'bend', 8192)
            if section == 'B' and biggest['t'] is None and d == max(x[0] for x in B) and not o['legato']:
                biggest['t'] = t
                # 摇指 รัวสายบนโน้ตสูงสุด
                for j in range(int(1.5 * beat * 11)):
                    S.note(lead, t + dur * 0.15 + j / 11, k, 0.2, 28 + 20 * np.sin(np.pi * j / (1.5 * beat * 11)), 0.003)
            t += dur; acc += b
        return start

    def glissando(t0, d_from, d_to, span=0.55):
        """刮奏 กวาดสายผ่านทุกขั้นของบันไดเสียง"""
        steps = list(range(d_from, d_to + 1)) if d_to > d_from else list(range(d_from, d_to - 1, -1))
        for j, d in enumerate(steps):
            S.note('grace', t0 + span * j / len(steps), key(d), 0.9, 34 + 30 * j / len(steps), 0.002)

    def accompany(t0, t1, roots):
        if not o['bass']: return
        bar = 4 * beat; i = 0; tt = t0
        while tt < t1 - 0.5 * beat:
            r = roots[i % len(roots)]
            low = key(r) - 24
            v = 46 if o['bass'] != 'pad' else 34
            if o['bass'] == 'pad':
                S.note(bass, tt, low, bar * 0.98, v, 0); S.note(bass, tt, low + 7, bar * 0.98, v - 8, 0)
            elif o['bass'] == 'harp':
                # กระจายคอร์ดไล่ขึ้น (คงโหว): ราก ห้า แปด และขั้นถัดไปในบันไดเสียง ครึ่งจังหวะต่อโน้ต
                for j, k in enumerate([low, low + 7, low + 12, key(r + 2) - 12]):
                    S.note(bass, tt + j * 0.5 * beat, k, bar - j * 0.5 * beat, v - 4 * j)
                S.note(bass, tt + 2.5 * beat, low + 7, 1.5 * beat, v - 14)
            else:
                S.note(bass, tt, low, 3 * beat, v); S.note(bass, tt + 2 * beat, low + 7, 2 * beat, v - 10)
            tt += bar; i += 1

    def answer(seq, t_end):
        """ขลุ่ยตอบท้ายวรรค: เลียนโน้ตสามตัวสุดท้ายต่ำลงหนึ่งออกเทฟ"""
        if not o['answer']: return t_end
        tail = seq[-3:]; tt = t_end + 0.2 * beat
        for d, b in tail:
            dur = b * beat * 0.9
            S.note(ans, tt, key(d) - (12 if o['answer'] == 'shakuhachi' and key(d) > 76 else 0), dur, 54)
            tt += dur
        return tt

    s1 = play(A, 66, 'A'); accompany(s1, t, [0, 0, 3, 0])
    s2 = play(A2, 70, 'A2'); accompany(s2, t, [3, 0, 4, 0])
    if o['answer']: t = answer(A2, t)
    if not o['legato']: glissando(t - 0.6, 2, 9)
    s3 = play(B, 76, 'B'); accompany(s3, t, [3, 4, 3, 0])
    if o['answer']: t = answer(B, t)
    s4 = play(A3, 64, 'A3'); accompany(s4, t, [0, 3, 0, 0])
    # ท้ายเพลง: โน้ตหลักยาว ระฆังปิด
    S.note(lead, t, key(5), 5 * beat, 52)
    if o['bass']: S.note(bass, t, key(0) - 24, 6 * beat, 40, 0)
    S.note('bells', t + 1.2 * beat, root - 12 if root > 60 else root, 7.0, 60, 0)
    end = t + 9.0

    if 'drops' in orn:
        # หยดน้ำ: โน้ตสูงเบา ๆ ห่าง ๆ บางทีหยดซ้ำเป็นคู่ ไม่ตรงจังหวะเพลง
        tt = 5.0 + 3 * rng.random()
        while tt < end - 10:
            d = int(rng.integers(10, 15))
            S.note('drops', tt, key(d), 1.2, int(rng.integers(30, 46)), 0)
            if rng.random() < 0.4: S.note('drops', tt + 0.16 + 0.06 * rng.random(), key(d - 1), 1.0, 26, 0)
            tt += 5 + 6 * rng.random()
    if 'chimes' in orn:
        # กระดิ่งลม: กลุ่มโน้ตเร็ว ๔–๗ ตัว นาน ๆ ครั้ง
        tt = 8.0 + 4 * rng.random()
        while tt < end - 10:
            for j in range(int(rng.integers(4, 8))):
                S.note('chimes', tt + j * (0.07 + 0.12 * rng.random()), key(int(rng.integers(10, 16))), 1.8, int(rng.integers(22, 38)), 0)
            tt += 13 + 8 * rng.random()
    return S, end, o


def render_part(sf_path, events, program, pan, end, gain=0.0):
    s = tinysoundfont.Synth(gain=gain, samplerate=SR)
    sfid = s.sfload(str(sf_path))
    s.program_select(0, sfid, 0, program)
    s.pitchbend_range(0, 2.0)
    s.control_change(0, 10, pan)
    s.control_change(0, 91, 0)
    events = sorted(events, key=lambda e: (e[0], 0 if e[1] == 'off' else 1))
    total = int(end * SR); out = np.zeros((total, 2), dtype=np.float32); pos = 0
    for t, kind, data in events + [(end, 'end', ())]:
        n = min(total, int(t * SR)) - pos
        if n > 0:
            out[pos:pos + n] = np.frombuffer(s.generate(n), dtype=np.float32).reshape(-1, 2)[:n]; pos += n  # generate() คืนไบต์ float32 สลับซ้ายขวา
        if kind == 'on': s.noteon(0, data[0], data[1])
        elif kind == 'off': s.noteoff(0, data[0])
        elif kind == 'bend': s.pitchbend(0, int(np.clip(data[0], 0, 16383)))
    return out


def reverb(x, rng, seconds=3.4, pre=0.022):
    n = int(SR * seconds); t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    for c in range(2):
        noise = rng.standard_normal(n)
        k = 12; noise = np.convolve(noise, np.ones(k) / k, 'same')  # หางเสียงนุ่ม ไม่แหลม
        ir[:, c] = noise * np.exp(-6.9 * t / seconds)
    ir[:int(pre * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum(0))
    L = len(x) + n; nfft = 1 << int(np.ceil(np.log2(L)))
    wet = np.stack([np.fft.irfft(np.fft.rfft(x[:, c], nfft) * np.fft.rfft(ir[:, c], nfft), nfft)[:len(x)] for c in range(2)], 1)
    return wet


def mix(order, slug, mode, base, bpm, inst, orn):
    S, end, o = compose(order, slug, mode, base, bpm, inst, orn)
    rng = np.random.default_rng(9000 + order)
    prog = {'lead': GM[o['lead']], 'grace': GM[o['lead']], 'answer': GM[o['answer']] if o['answer'] else None,
            'bass': GM[o['bass']] if o['bass'] else None, 'bells': GM['bells'],
            'drops': GM['glock' if o['lead'] == 'celesta' else 'celesta'], 'chimes': GM['tinkle']}
    level = {'lead': 1.0, 'grace': 0.55, 'answer': 0.5, 'bass': 0.55 if o['bass'] != 'pad' else 0.4, 'bells': 0.55,
             'drops': 1.0, 'chimes': 0.8}
    send = {'lead': 0.4, 'grace': 0.4, 'answer': 0.45, 'bass': 0.25, 'bells': 0.6, 'drops': 0.7, 'chimes': 0.6}
    dry = np.zeros((int(end * SR), 2)); bus = np.zeros_like(dry)
    for part, evs in S.parts.items():
        if prog.get(part) is None: continue
        y = render_part(SF2, evs, prog[part], PAN.get(part, 64), end).astype(np.float64) * level[part]
        dry += y; bus += y * send[part]
    wet = reverb(bus, rng)
    out = dry * 0.8 + wet
    dur = len(out) / SR
    amb = np.zeros(len(out))
    if 'waves' in orn: amb += synth.noise_swell(rng, dur, 4 * S.beat * 2, 0.05, 500)[:len(out)]
    if 'stream' in orn: amb += synth.noise_swell(rng, dur, 3.0, 0.02, 2500)[:len(out)]
    if 'wind' in orn: amb += synth.noise_swell(rng, dur, 4 * S.beat * 4, 0.03, 900)[:len(out)]
    out += amb[:, None] * np.abs(out).max() * 0.6
    fi = int(SR * 0.05); out[:fi] *= np.linspace(0, 1, fi)[:, None]
    fo = int(SR * 4); out[-fo:] *= np.linspace(1, 0, fo)[:, None]
    out /= np.abs(out).max() / 0.9
    return out


def write(order, slug, out):
    dst = OUT / f'pang-{order:02d}-{slug}.m4a'
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tf: tmp = tf.name
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())
    trim = 0.0
    for _ in range(3):
        af = f'highpass=f=45,loudnorm=I=-18:TP=-2:LRA=11,alimiter=limit=0.75:level=0,volume={trim:.1f}dB'
        subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', tmp, '-af', af, '-ar', '44100',
                        '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', str(dst)], check=True)
        peak = true_peak(dst)
        if peak <= -1.0: break
        trim -= peak + 1.5          # AAC ยังทำยอดเสียงเกินได้ ลดทั้งเพลงแล้วแปลงใหม่
    os.unlink(tmp)
    return dst


def true_peak(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(path), '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True)
    return float(r.stderr.rsplit('Peak:', 1)[1].split()[0])


if __name__ == '__main__':
    if not SF2.exists():
        sys.exit(f'ไม่พบ {SF2.relative_to(ROOT)} — ดูวิธีโหลดที่หัวไฟล์')
    want = set(sys.argv[1:])
    data = json.loads(DATA.read_text(encoding='utf8'))
    for r in RECIPES:
        if want and r[1] not in want: continue
        out = mix(*r)
        dst = write(r[0], r[1], out)
        m = data[r[1]]['music']
        m['seconds'] = int(round(len(out) / SR)); m['kind'] = 'sampled'
        print(f'{r[0]:02d} {r[1]}: {m["seconds"]} วินาที {dst.stat().st_size // 1024} KB', flush=True)
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
