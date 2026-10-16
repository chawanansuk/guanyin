# เขียน prompt สำหรับสร้างเพลงประจำปางด้วย AI (Magnific → Audio → Music Generator → ElevenLabs Music)
# ใช้ข้อมูลเดียวกับเพลงตัวอย่าง (โหมด คีย์ จังหวะ เครื่องดนตรี เสียงประกอบ ใน synth-pang-music.py)
# บวกอารมณ์ของแต่ละปาง แล้วเขียนเป็น docs/MUSIC-PROMPTS.md
#
# ใช้: python3 scripts/music-prompts.py
import importlib.util, json, math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('synth', ROOT / 'scripts' / 'synth-pang-music.py')
synth = importlib.util.module_from_spec(spec); spec.loader.exec_module(synth)
chants = json.loads((ROOT / 'src' / 'data' / 'pang-chant.json').read_text(encoding='utf8'))

# ปาง ๑ ไม่ได้อยู่ในตารางของ synth-pang-music.py (แต่งทำนองตายตัวไว้แยก) — ใส่ค่าเดียวกับเพลงเดิม
RECIPES = [(1, 'yang-liu', 'gong', 293.66, 60, 'zheng', ['drops'])] + list(synth.R)

MODE = {
    'gong': 'gong mode (major pentatonic, bright and settled)',
    'shang': 'shang mode (pentatonic on the 2nd degree, open and searching)',
    'zhi': 'zhi mode (pentatonic on the 5th degree, warm and hopeful)',
    'yu': 'yu mode (minor pentatonic, gentle and introspective)',
}
INST = {
    'zheng': 'solo guzheng (Chinese zither) carrying the melody, a soft xiao flute answering some phrases',
    'qin': 'guqin (seven-string zither) in the low register with long sustained notes, very sparse',
    'xiao': 'xiao (end-blown bamboo flute) carrying long breathy phrases over a soft guzheng accompaniment',
    'bell': 'small temple bells and a celesta-like plucked tone carrying the melody over a quiet drone',
    'harp': 'konghou (Chinese harp) playing rolling arpeggios with a simple melody on top',
}
ORN = {
    'drops': 'occasional high plucked notes like water drops',
    'waves': 'very soft ocean waves in the background',
    'chimes': 'a small wind chime now and then',
    'wind': 'a faint breeze in the background',
    'stream': 'a quiet flowing stream in the background',
}
# อารมณ์ของแต่ละปาง (จากแก่นของปาง) เป็นภาษาอังกฤษ เพราะโมเดลเพลงเข้าใจดีกว่า
MOOD = {
    'yang-liu': 'tender and healing, like a willow branch bending in a spring breeze',
    'long-tou': 'calm strength above powerful waves, steady and protective',
    'chi-jing': 'quiet study and devotion, patient and clear',
    'yuan-guang': 'luminous and clear, light slowly filling a dark room',
    'you-xi': 'light-hearted freedom, drifting clouds, unattached ease',
    'bai-yi': 'pure, gentle and motherly, soft white light',
    'lian-wo': 'peaceful lotus pond, supportive and serene',
    'long-jian': 'still mind beside a waterfall, deep listening',
    'shi-yao': 'warm, comforting, quietly healing, gentle rain on fields',
    'yu-lan': 'humble village market morning, kind and down-to-earth',
    'de-wang': 'dignified virtue, calm leadership, seated on a mountain rock',
    'shui-yue': 'moonlight reflected on still water, beautiful and unclinging',
    'yi-ye': 'a single lotus leaf crossing a wide sea, steady courage',
    'qing-jing': 'solemn compassion that absorbs pain, deep and grounded',
    'wei-de': 'gentle strength, firm but kind, protective dignity',
    'yan-ming': 'long flowing river of life, grateful and unhurried',
    'zhong-bao': 'generous and abundant, sharing treasures freely',
    'yan-hu': 'quiet cave by the water, inner peace before returning to the world',
    'neng-jing': 'waves slowly calming, settling a restless heart',
    'a-nou': 'cool mountain lake without heat, refreshing and clear',
    'a-mo-ti': 'fearless yet gentle, a harp played beside a white lion',
    'ye-yi': 'shade of a great tree, caring for the whole community',
    'liu-li': 'crystal clear and honest, like light through glass',
    'duo-luo': 'swift compassion arriving on clouds, uplifting and reassuring',
    'ge-li': 'simple everyday grace, finding the sacred in small things',
    'liu-shi': 'gentle watchfulness through day and night, a steady presence',
    'pu-bei': 'all-embracing compassion, quiet and humble, no one forgotten',
    'ma-lang-fu': 'tender love that turns toward wisdom, graceful and bittersweet',
    'he-zhang': 'joined palms, mutual respect, harmony and reconciliation',
    'yi-ru': 'moving clouds, seeing things as they are, calm acceptance',
    'bu-er': 'a lotus leaf floating on calm water, balance and non-duality',
    'chi-lian': 'cradling a lotus flower, tender and innocent love',
    'sa-shui': 'sprinkling cool water to all, refreshing and generous, a circle closing',
}
NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def note_name(hz):
    n = round(12 * math.log2(hz / 440)) + 69
    return NOTES[n % 12]


def prompt(slug, mode, base, bpm, inst, orn):
    key = note_name(base / 2 if inst == 'qin' else base)
    orn_txt = (', ' + ', '.join(ORN[o] for o in orn)) if orn else ''
    return (
        f'Slow, meditative Chinese Buddhist temple instrumental. {INST[inst][0].upper() + INST[inst][1:]}, '
        f'pentatonic melody in {key} {MODE[mode]}{orn_txt}. A single temple bell (qing) at the start and the end. '
        f'Mood: {MOOD[slug]}. Spacious natural hall reverb, unhurried phrasing with breathing space. '
        f'{bpm} BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. '
        f'Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.'
    )


def main():
    out = ['# Prompt เพลงประจำปาง สำหรับ AI สร้างเพลง', '',
           'สร้างด้วย `python3 scripts/music-prompts.py` — ใช้โหมด คีย์ จังหวะ เครื่องดนตรี และเสียงประกอบเดียวกับเพลงตัวอย่าง บวกอารมณ์ของแต่ละปาง', '',
           '## วิธีใช้กับ Magnific', '',
           '1. Magnific → All tools → Audio → **Music Generator** เลือกโมเดล **ElevenLabs Music** (ยาวได้ถึง 3 นาที)',
           '2. คัดลอก prompt ของปางนั้นไปวาง ถ้าช่องกำหนดความยาวแยก ตั้ง 90 วินาที',
           '3. สร้าง 2–3 รอบแล้วเลือกเพลงที่ฟังสงบที่สุด ฟังให้จบว่าไม่มีเสียงร้องหรือกลองแทรก',
           '4. ดาวน์โหลด (MP3 หรือ WAV) ตั้งชื่อไฟล์ตามเลขปาง เช่น `pang-01.mp3` แล้ววางใน `music-src/`',
           '5. รัน `python3 scripts/import-music.py` สคริปต์จะย่อไฟล์ ใส่แทนเพลงตัวอย่าง และแก้ความยาวกับเครดิตบนหน้าปางให้', '',
           'ใช้แผนเสียเงินของ Magnific เพื่อให้ใช้บนเว็บได้ และให้ตำหนักฟังก่อนเผยแพร่', '']
    for order, slug, mode, base, bpm, inst, orn in sorted(RECIPES):
        m = chants.get(slug, {}).get('music', {})
        out += [f'## {order:02d} · {m.get("title_th", slug)} ({m.get("title_zh", "")}) — `{slug}`', '',
                '```', prompt(slug, mode, base, bpm, inst, orn), '```', '']
    (ROOT / 'docs' / 'MUSIC-PROMPTS.md').write_text('\n'.join(out), encoding='utf8')
    print('เขียน docs/MUSIC-PROMPTS.md', len(RECIPES), 'ปาง')


if __name__ == '__main__':
    main()
