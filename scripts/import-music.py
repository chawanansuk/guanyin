# นำเพลงที่ได้จาก AI หรือจากนักดนตรีเข้าเว็บ แทนเพลงตัวอย่างที่สังเคราะห์ไว้
#
# วางไฟล์ใน music-src/ ตั้งชื่อขึ้นต้นด้วยเลขปาง เช่น pang-01.mp3 · pang-12-shui-yue.wav · 07.m4a
# แล้วรัน: python3 scripts/import-music.py [--credit "ข้อความเครดิต"] [--credit-zh "..."] [--kind ai|recorded]
#
# สิ่งที่ทำ: ตัดความเงียบหัวท้าย · ปรับความดังให้เท่ากันทุกเพลง (-18 LUFS เบากว่าเพลงทั่วไป เหมาะฟังขณะไหว้)
# ใส่ fade out ๓ วินาที · แปลงเป็น AAC 96 kbps stereo ลง public/audio/pang-NN-slug.m4a (ชื่อเดิม หน้าเว็บไม่ต้องแก้)
# แก้ src/data/pang-chant.json: ความยาว ชนิดเพลง (kind) และเครดิต
# ต้องมี ffmpeg — music-src/ ไม่ commit (ต้นฉบับใหญ่)
import argparse, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'music-src'
OUT = ROOT / 'public' / 'audio'
DATA = ROOT / 'src' / 'data' / 'pang-chant.json'
EXT = {'.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg', '.opus', '.webm'}

CREDIT = {
    'ai': ('เพลงเรียบเรียงด้วย AI ตามแนวทางของตำหนัก', '本曲以 AI 依本堂方向編配。'),
    'recorded': ('บรรเลงโดยนักดนตรี', '樂師演奏。'),
}


def duration(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--kind', choices=['ai', 'recorded'], default='ai')
    ap.add_argument('--credit'); ap.add_argument('--credit-zh')
    a = ap.parse_args()
    data = json.loads(DATA.read_text(encoding='utf8'))
    by_order = {}
    for slug, entry in data.items():
        if slug == '_note': continue
        m = re.search(r'pang-(\d+)-', entry.get('music', {}).get('src', ''))
        if m: by_order[int(m.group(1))] = slug
    files = sorted(p for p in SRC.glob('*') if p.suffix.lower() in EXT) if SRC.exists() else []
    if not files:
        sys.exit(f'ไม่พบไฟล์เพลงใน {SRC.relative_to(ROOT)}/ — ตั้งชื่อขึ้นต้นด้วยเลขปาง เช่น pang-01.mp3')
    done = 0
    for f in files:
        m = re.match(r'(?:pang-)?(\d{1,2})\b', f.stem)
        if not m or int(m.group(1)) not in by_order:
            print(f'ข้าม {f.name}: ไม่รู้ว่าเป็นปางไหน (ชื่อไฟล์ต้องขึ้นต้นด้วยเลข ๑–๓๓)'); continue
        order = int(m.group(1)); slug = by_order[order]
        dst = OUT / f'pang-{order:02d}-{slug}.m4a'
        # ตัดเงียบหัวท้าย → วัดความยาว → ปรับดัง + fade out ท้าย
        tmp = SRC / f'.tmp-{order:02d}.wav'
        subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', str(f), '-af',
                        'silenceremove=start_periods=1:start_threshold=-50dB,areverse,'
                        'silenceremove=start_periods=1:start_threshold=-50dB,areverse',
                        '-ar', '44100', '-ac', '2', str(tmp)], check=True)
        sec = duration(tmp)
        fade = max(0.0, sec - 3)
        subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', str(tmp), '-af',
                        f'loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=out:st={fade:.2f}:d=3',
                        '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', str(dst)], check=True)
        tmp.unlink()
        mus = data[slug]['music']
        mus['seconds'] = int(round(duration(dst)))
        mus['kind'] = a.kind
        mus['credit_th'] = a.credit or CREDIT[a.kind][0]
        mus['credit_zh'] = a.credit_zh or CREDIT[a.kind][1]
        print(f'{order:02d} {slug}: {mus["seconds"]} วินาที {dst.stat().st_size // 1024} KB')
        done += 1
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    print(f'นำเข้า {done} เพลง แก้ {DATA.relative_to(ROOT)} แล้ว — npm run build เพื่อดูผล')


if __name__ == '__main__':
    main()
