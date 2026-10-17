# ตารางสูตรเพลงประจำปาง (R: โหมด คีย์ จังหวะ เครื่องดนตรี เสียงประกอบ) และเครื่องสังเคราะห์เสียงรุ่นแรก
# เพลงบนเว็บตอนนี้ทำด้วย scripts/render-pang-music.py ซึ่งอ่านตาราง R จากไฟล์นี้ — แก้สูตรของปางที่นี่
# รันไฟล์นี้ตรง ๆ จะได้เพลงรุ่นแรกทับเพลงบนเว็บ จึงต้องใส่ --v1 กำกับ
# ทุกปางใช้บันไดเสียงห้าเสียง ต่างกันที่โหมด คีย์ จังหวะ เสียงเครื่องดนตรี และเสียงประกอบตามความหมายของปาง
# ทำนองสุ่มจากเลขปาง จึงได้ผลเดิมทุกครั้งที่รัน
#
# ใช้: pip install numpy && python3 scripts/synth-pang-music.py [slug ...]
#   ต้องมี ffmpeg — เขียนไฟล์ public/audio/pang-NN-slug.m4a และพิมพ์ความยาวเป็นวินาที
import numpy as np, subprocess, sys, json, os, tempfile, wave

SR = 44100
MODES = {  # ระยะครึ่งเสียงจากโน้ตหลัก
    'gong': [0, 2, 4, 7, 9],    # 宮
    'shang': [0, 2, 5, 7, 10],  # 商
    'zhi': [0, 2, 5, 7, 9],     # 徵
    'yu': [0, 3, 5, 7, 10],     # 羽
}
# order, slug, โหมด, โน้ตหลัก (Hz ของขั้นที่ 0), bpm, เครื่องดนตรี, เสียงประกอบ
R = [
    (2, 'long-tou', 'shang', 196.00, 66, 'zheng', ['waves']),
    (3, 'chi-jing', 'gong', 174.61, 58, 'qin', []),
    (4, 'yuan-guang', 'gong', 261.63, 60, 'bell', ['chimes']),
    (5, 'you-xi', 'zhi', 220.00, 70, 'xiao', ['wind']),
    (6, 'bai-yi', 'gong', 233.08, 60, 'zheng', ['chimes']),
    (7, 'lian-wo', 'zhi', 207.65, 58, 'zheng', ['drops']),
    (8, 'long-jian', 'shang', 220.00, 64, 'zheng', ['stream']),
    (9, 'shi-yao', 'gong', 196.00, 60, 'harp', []),
    (10, 'yu-lan', 'zhi', 246.94, 68, 'zheng', []),
    (11, 'de-wang', 'gong', 164.81, 56, 'qin', []),
    (12, 'shui-yue', 'yu', 220.00, 54, 'zheng', ['drops']),
    (13, 'yi-ye', 'shang', 207.65, 62, 'zheng', ['waves']),
    (14, 'qing-jing', 'yu', 185.00, 56, 'bell', []),
    (15, 'wei-de', 'shang', 174.61, 60, 'qin', ['chimes']),
    (16, 'yan-ming', 'gong', 196.00, 54, 'xiao', ['stream']),
    (17, 'zhong-bao', 'gong', 246.94, 64, 'harp', ['chimes']),
    (18, 'yan-hu', 'yu', 164.81, 54, 'qin', ['drops']),
    (19, 'neng-jing', 'shang', 196.00, 56, 'zheng', ['waves']),
    (20, 'a-nou', 'zhi', 233.08, 58, 'bell', ['stream']),
    (21, 'a-mo-ti', 'shang', 220.00, 64, 'harp', []),
    (22, 'ye-yi', 'zhi', 196.00, 62, 'xiao', ['wind']),
    (23, 'liu-li', 'gong', 277.18, 56, 'bell', ['drops']),
    (24, 'duo-luo', 'zhi', 246.94, 70, 'xiao', ['chimes']),
    (25, 'ge-li', 'gong', 220.00, 66, 'zheng', ['waves']),
    (26, 'liu-shi', 'shang', 185.00, 60, 'qin', ['chimes']),
    (27, 'pu-bei', 'yu', 196.00, 54, 'xiao', []),
    (28, 'ma-lang-fu', 'yu', 233.08, 62, 'zheng', []),
    (29, 'he-zhang', 'gong', 207.65, 56, 'bell', []),
    (30, 'yi-ru', 'shang', 233.08, 64, 'xiao', ['wind']),
    (31, 'bu-er', 'yu', 207.65, 54, 'zheng', ['drops']),
    (32, 'chi-lian', 'zhi', 261.63, 62, 'harp', ['drops']),
    (33, 'sa-shui', 'gong', 293.66, 60, 'zheng', ['drops', 'stream']),
]

def pluck(rng, f, dur, vel=1.0, bright=1.0, decay=1.0):
    n = int(SR * dur); t = np.arange(n) / SR; y = np.zeros(n); p = 0.18
    for k in range(1, 16):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        if fk > 12000: break
        a = abs(np.sin(np.pi * k * p)) / k ** (1.35 / bright)
        t60 = decay * 3.2 / (k ** 0.75) * (220 / f) ** 0.25
        y += a * np.exp(-6.9 * t / t60) * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28))
    y *= np.minimum(1, t / 0.004)
    m = min(n, int(SR * 0.012))
    y[:m] += rng.standard_normal(m) * np.linspace(0.25, 0, m) * 0.15
    return y * vel

def flute(rng, f, dur, vel=1.0):
    # เสียงคล้ายขลุ่ยเซียว: ฮาร์มอนิกน้อย หายใจเข้าช้า สั่นเสียงเบา ๆ มีเสียงลม
    n = int(SR * dur); t = np.arange(n) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 4.8 * t) * np.minimum(1, t / 0.6)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    y = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
    env = np.minimum(1, t / 0.12) * np.minimum(1, (dur - t) / 0.35).clip(0, 1)
    env *= np.exp(-t / (dur * 2.2))
    breath = np.convolve(rng.standard_normal(n), np.ones(30) / 30, 'same') * 0.05
    return (y * 0.55 + breath) * env * vel

def bell(f, dur, vel=1.0, soft=False):
    n = int(SR * dur); t = np.arange(n) / SR; y = np.zeros(n)
    parts = ([(1, 1, 2.6), (2.0, .35, 1.4), (3.0, .12, .8), (4.2, .05, .5)] if soft else
             [(0.5, .5, 9), (1, 1, 7), (1.183, .45, 5), (1.506, .35, 4), (2, .4, 3.5), (2.514, .2, 2.5),
              (2.662, .18, 2.2), (3.011, .12, 1.8), (4.166, .06, 1.2)])
    for r, a, t60 in parts:
        y += a * np.exp(-6.9 * t / t60) * np.sin(2 * np.pi * f * r * t)
    y *= np.minimum(1, t / 0.002)
    return y * vel * (0.55 if soft else 0.35)

def noise_swell(rng, dur, period, level, cutoff):
    n = int(SR * dur); t = np.arange(n) / SR
    w = max(2, int(SR / cutoff))
    x = rng.standard_normal(n)
    x = np.convolve(x, np.ones(w) / w, 'same'); x = np.convolve(x, np.ones(w) / w, 'same')
    x /= np.abs(x).max() + 1e-9
    env = (0.5 - 0.5 * np.cos(2 * np.pi * t / period)) ** 1.5
    return x * env * level

def deg_freq(base, mode, d):
    sc = MODES[mode]
    return base * 2 ** ((sc[d % 5] + 12 * (d // 5)) / 12)

CELLS = [[2, 2], [1, 1, 2], [1.5, .5, 2], [1, 1, 1, 1], [2, 1, 1], [3, 1], [1, .5, .5, 2]]
END_CELLS = [[2, 2], [3, 1], [4]]

def phrase(rng, start, end, lo=2, hi=11):
    seq = []; d = start
    for bar in range(4):
        cell = list(END_CELLS[rng.integers(len(END_CELLS))] if bar == 3 else CELLS[rng.integers(len(CELLS))])
        for i, b in enumerate(cell):
            last = bar == 3 and i == len(cell) - 1
            if last:
                d = end
            elif bar == 3 and i == len(cell) - 2:
                d = end + rng.choice([-1, 1])
            elif seq:
                d += int(rng.choice([-2, -1, -1, -1, 0, 1, 1, 1, 2], p=None))
            d = int(np.clip(d, lo, hi))
            seq.append((d, b))
    return seq

def compose(order, slug, mode, base, bpm, inst, orn):
    rng = np.random.default_rng(1000 + order)
    beat = 60 / bpm
    if inst == 'qin': base /= 2
    A = phrase(rng, 6, 4)
    # ซ้ำวรรคแรก แต่จบลงที่โน้ตหลัก
    A2 = A[:-2] + [(int(rng.choice([4, 6])), A[-2][1]), (5, A[-1][1])]
    B = phrase(rng, 8, 7, lo=4, hi=12)
    END = [(7, 1), (6, 1), (5, 2), (4, 1), (3, 1), (2, 2), (5, 6)]
    sections = [A, A2, B, A, END]

    ev = []  # (เวลา, ชนิด, ความถี่, ยาว, ความดัง)
    t = 0.6
    ev.append((t, 'bell', base * (2 if base < 200 else 1), 10, 0.9)); t += 4 * beat
    roots = [0, -2, -1, -2]
    for si, s in enumerate(sections):
        st = t
        for d, b in s:
            f = deg_freq(base, mode, d)
            if inst == 'xiao':
                ev.append((t, 'flute', f, b * beat * 0.98 + 0.25, 0.7))
            elif inst == 'bell':
                ev.append((t, 'soft', f, b * beat + 2.6, 0.75))
            else:
                ev.append((t, inst, f, b * beat + 2.6, 0.8 * (0.9 + 0.2 * rng.random())))
            t += b * beat
        bars = int(np.ceil(sum(b for _, b in s) / 4))
        for i in range(bars):
            r = roots[i % 4] if si != 2 else [1, -1, -2, 0][i % 4]
            f0 = deg_freq(base, mode, r + 5) / 2
            bt = st + i * 4 * beat
            if inst == 'harp':  # พิณกงโหว: กระจายคอร์ดขึ้น
                for j, dd in enumerate([0, 3, 5]):
                    ev.append((bt + j * beat * 0.5, 'harp', deg_freq(base, mode, r + 5 + dd) / 2, 3 * beat, 0.35))
            else:
                bass_inst = 'qin' if inst in ('qin', 'xiao', 'bell') else 'zheng'
                ev.append((bt, bass_inst, f0, 4 * beat + 3, 0.5))
                ev.append((bt + 2 * beat, bass_inst, f0 * 1.5, 2 * beat + 2, 0.24))
            if 'drops' in orn and rng.random() < 0.6:
                ev.append((bt + rng.choice([1.5, 2.5, 3.5]) * beat, 'zheng',
                           deg_freq(base, mode, int(rng.choice([10, 12, 13]))), 3, 0.16))
            if 'chimes' in orn and i % 2 == 1:
                ev.append((bt + 3 * beat, 'soft', deg_freq(base, mode, 15), 3, 0.12))
    end_t = t - 3 * beat  # ระฆังปิดตีทับท้ายโน้ตยาว ไม่ทิ้งช่วงเงียบ
    ev.append((end_t, 'bell', base * (2 if base < 200 else 1), 12, 0.9))

    L = int(SR * (end_t + 11))
    mix = np.zeros(L)
    for (st, k, f, du, v) in ev:
        if k == 'bell': y = bell(f, du, v)
        elif k == 'soft': y = bell(f, du, v, soft=True)
        elif k == 'flute': y = flute(rng, f, du, v)
        elif k == 'qin': y = pluck(rng, f, du, v, bright=0.7, decay=1.6)
        elif k == 'harp': y = pluck(rng, f, du, v, bright=1.25, decay=1.3)
        else: y = pluck(rng, f, du, v, bright=1.2 if f > 600 else 1.0)
        i = int(st * SR); mix[i:i + len(y)] += y[:L - i]
    dur = L / SR
    if 'waves' in orn: mix += noise_swell(rng, dur, 4 * beat * 2, 0.10, 500)
    if 'stream' in orn: mix += noise_swell(rng, dur, 3.0, 0.035, 2500)
    if 'wind' in orn: mix += noise_swell(rng, dur, 4 * beat * 4, 0.06, 900)
    # reverb ห้องโถง
    irl = int(SR * 2.8); ti = np.arange(irl) / SR
    ir = rng.standard_normal(irl) * np.exp(-6.9 * ti / 2.8)
    ir = np.convolve(ir, np.ones(8) / 8, 'same'); ir[0] = 0; ir /= np.sqrt((ir ** 2).sum())
    nfft = 1 << int(np.ceil(np.log2(L + irl)))
    wet = np.fft.irfft(np.fft.rfft(mix, nfft) * np.fft.rfft(ir, nfft), nfft)[:L]
    out = mix * 0.75 + wet * 0.32
    fi = int(SR * 0.05); out[:fi] *= np.linspace(0, 1, fi)
    fo = int(SR * 4); out[-fo:] *= np.linspace(1, 0, fo)
    out /= np.abs(out).max() / 0.85
    return out

def write(slug, order, out):
    root = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
    dst = os.path.join(root, f'pang-{order:02d}-{slug}.m4a')
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tf:
        tmp = tf.name
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', tmp, '-c:a', 'aac',
                    '-b:a', '64k', '-movflags', '+faststart', dst], check=True)
    os.unlink(tmp)
    return dst

if __name__ == '__main__':
    if '--v1' not in sys.argv:
        sys.exit('เพลงบนเว็บใช้ scripts/render-pang-music.py แล้ว — ถ้าตั้งใจทำเพลงรุ่นแรกทับ ให้ใส่ --v1')
    want = set(sys.argv[1:]) - {'--v1'}
    lengths = {}
    for r in R:
        if want and r[1] not in want: continue
        out = compose(*r)
        write(r[1], r[0], out)
        lengths[r[1]] = int(round(len(out) / SR))
        print(r[1], lengths[r[1]], file=sys.stderr)
    print(json.dumps(lengths))
