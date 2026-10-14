# สังเคราะห์เพลงตัวอย่างสำหรับทดสอบตัวเล่นเพลงบนหน้าปาง (ไม่ใช่เพลงจริง)
# ใช้: pip install numpy && python3 scripts/synth-demo-music.py แล้วแปลงเป็น m4a ด้วย
#   ffmpeg -i demo.wav -c:a aac -b:a 96k -movflags +faststart public/audio/pang-01-yang-liu.m4a
# เพลงตัวอย่างปางกิ่งหลิว: พิณดีดสังเคราะห์ (additive) บันไดเสียงเพนทาโทนิก D 宮 + ระฆังเปิด/ปิด + reverb
import numpy as np, wave, sys
SR = 44100
rng = np.random.default_rng(1)
BEAT = 0.95
N = {'A2':110.0,'B2':123.47,'D3':146.83,'E3':164.81,'F#3':185.0,'A3':220.0,'B3':246.94,
     'D4':293.66,'E4':329.63,'F#4':369.99,'A4':440.0,'B4':493.88,'D5':587.33,'E5':659.26,'F#5':739.99,'A5':880.0,'D6':1174.66}

def pluck(f, dur, vel=1.0, bright=1.0):
    n = int(SR*dur); t = np.arange(n)/SR
    y = np.zeros(n); p = 0.18
    for k in range(1, 16):
        fk = f*k*np.sqrt(1+0.0004*k*k)          # inharmonicity เล็กน้อยแบบสายโลหะ
        if fk > 12000: break
        a = abs(np.sin(np.pi*k*p))/k**(1.35/bright)
        t60 = 3.2/(k**0.75) * (220/f)**0.25
        y += a*np.exp(-6.9*t/t60)*np.sin(2*np.pi*fk*t + rng.uniform(0,6.28))
    att = np.minimum(1, t/0.004); y *= att
    nz = rng.standard_normal(min(n, int(SR*0.012))) * np.linspace(0.25,0,min(n, int(SR*0.012)))
    y[:len(nz)] += nz*0.15
    return y*vel

def bell(f, dur, vel=1.0):
    n = int(SR*dur); t = np.arange(n)/SR; y = np.zeros(n)
    for r, a, t60 in [(0.5,.5,9),(1,1,7),(1.183,.45,5),(1.506,.35,4),(2,.4,3.5),(2.514,.2,2.5),(2.662,.18,2.2),(3.011,.12,1.8),(4.166,.06,1.2)]:
        y += a*np.exp(-6.9*t/t60)*np.sin(2*np.pi*f*r*t)
    y *= np.minimum(1, t/0.002)
    return y*vel*0.35

total = 0
events = []  # (time, kind, note, dur, vel)
def melody(start, seq, vel=0.8, octave_shadow=False):
    t = start
    for nm, b in seq:
        if nm != '-':
            events.append((t, 'p', nm, b*BEAT+2.5, vel*(0.9+0.2*rng.random())))
        t += b*BEAT
    return t

A  = [('A4',1),('B4',.5),('A4',.5),('F#4',1),('E4',1), ('D4',1.5),('E4',.5),('F#4',2),
      ('A4',1),('F#4',.5),('E4',.5),('D4',1),('B3',1), ('A3',2),('D4',2)]
A2 = [('A4',1),('B4',.5),('A4',.5),('F#4',1),('E4',1), ('D4',1.5),('E4',.5),('F#4',2),
      ('E4',1),('F#4',.5),('E4',.5),('D4',1),('B3',1), ('D4',4)]
B  = [('D5',1),('B4',.5),('D5',.5),('E5',2), ('D5',1),('B4',1),('A4',2),
      ('B4',.5),('A4',.5),('F#4',1),('A4',1),('B4',1), ('A4',4)]
END= [('A4',1),('F#4',1),('E4',1),('D4',1), ('B3',2),('A3',2), ('D4',6)]

t = 0.6
events.append((t,'b',293.66,10,1.0)); t += 4*BEAT
sections = [A, A2, B, A, END]
for s in sections:
    st = t
    t = melody(t, s)
    beats = sum(b for _, b in s); bars = int(np.ceil(beats/4))
    for i in range(bars):   # เบสดีดต้นห้อง สลับ D/A
        root = ['D3','A2','B2','A2'][i % 4] if s is not B else ['D3','E3','B2','A2'][i % 4]
        events.append((st+i*4*BEAT, 'p', root, 4*BEAT+3, 0.55))
        events.append((st+i*4*BEAT+2*BEAT, 'p', 'A3' if root!='A2' else 'E3', 2*BEAT+2, 0.28))
    # หยดน้ำ: โน้ตสูงเบา ๆ แทรกห้องละหนึ่ง
    for i in range(bars):
        if rng.random() < 0.6:
            events.append((st+i*4*BEAT+rng.choice([1.5,2.5,3.5])*BEAT, 'p', rng.choice(['D6','A5','F#5']), 3, 0.18))
end_t = t + 1.0
events.append((end_t,'b',293.66,12,0.9))
L = int(SR*(end_t+12))
mix = np.zeros(L)
for (st, k, nm, du, v) in events:
    y = pluck(N[nm], du, v, bright=1.2 if N[nm] > 600 else 1.0) if k=='p' else bell(nm, du, v)
    i = int(st*SR); mix[i:i+len(y)] += y[:L-i]
# reverb ห้องโถง
irl = int(SR*2.8); ti = np.arange(irl)/SR
ir = rng.standard_normal(irl)*np.exp(-6.9*ti/2.8)
ir = np.convolve(ir, np.ones(8)/8, 'same'); ir[0] = 0; ir /= np.sqrt((ir**2).sum())
nfft = 1 << int(np.ceil(np.log2(L+irl)))
wet = np.fft.irfft(np.fft.rfft(mix, nfft)*np.fft.rfft(ir, nfft), nfft)[:L]
out = mix*0.75 + wet*0.32
# fade out ท้าย
fo = int(SR*4); out[-fo:] *= np.linspace(1,0,fo)
out /= np.abs(out).max()/0.85
# stereo กว้างเล็กน้อย
dl = int(SR*0.011)
left = out; right = np.concatenate([np.zeros(dl), out[:-dl]])*0.96 + out*0.04
st = np.stack([left, right], 1)
with wave.open('demo.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st*32767).astype('<i2').tobytes())
print('length', L/SR)
