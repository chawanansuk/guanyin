# Prompt เพลงประจำปาง สำหรับ AI สร้างเพลง

สร้างด้วย `python3 scripts/music-prompts.py` — ใช้โหมด คีย์ จังหวะ เครื่องดนตรี และเสียงประกอบเดียวกับเพลงตัวอย่าง บวกอารมณ์ของแต่ละปาง

## วิธีใช้กับ Magnific

1. Magnific → All tools → Audio → **Music Generator** เลือกโมเดล **ElevenLabs Music** (ยาวได้ถึง 3 นาที)
2. คัดลอก prompt ของปางนั้นไปวาง ถ้าช่องกำหนดความยาวแยก ตั้ง 90 วินาที
3. สร้าง 2–3 รอบแล้วเลือกเพลงที่ฟังสงบที่สุด ฟังให้จบว่าไม่มีเสียงร้องหรือกลองแทรก
4. ดาวน์โหลด (MP3 หรือ WAV) ตั้งชื่อไฟล์ตามเลขปาง เช่น `pang-01.mp3` แล้ววางใน `music-src/`
5. รัน `python3 scripts/import-music.py` สคริปต์จะย่อไฟล์ ใส่แทนเพลงตัวอย่าง และแก้ความยาวกับเครดิตบนหน้าปางให้

ใช้แผนเสียเงินของ Magnific เพื่อให้ใช้บนเว็บได้ และให้ตำหนักฟังก่อนเผยแพร่

## 01 · กิ่งหลิวลู่ลม (楊柳風) — `yang-liu`

```
Slow, meditative Chinese Buddhist temple instrumental. Solo guzheng (Chinese zither) carrying the melody, a soft xiao flute answering some phrases, pentatonic melody in D gong mode (major pentatonic, bright and settled), occasional high plucked notes like water drops. A single temple bell (qing) at the start and the end. Mood: tender and healing, like a willow branch bending in a spring breeze. Spacious natural hall reverb, unhurried phrasing with breathing space. 60 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 02 · มังกรเหนือคลื่น (龍浪) — `long-tou`

```
Slow, meditative Chinese Buddhist temple instrumental. Solo guzheng (Chinese zither) carrying the melody, a soft xiao flute answering some phrases, pentatonic melody in G shang mode (pentatonic on the 2nd degree, open and searching), very soft ocean waves in the background. A single temple bell (qing) at the start and the end. Mood: calm strength above powerful waves, steady and protective. Spacious natural hall reverb, unhurried phrasing with breathing space. 66 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 03 · ม้วนคัมภีร์ (持經) — `chi-jing`

```
Slow, meditative Chinese Buddhist temple instrumental. Guqin (seven-string zither) in the low register with long sustained notes, very sparse, pentatonic melody in F gong mode (major pentatonic, bright and settled). A single temple bell (qing) at the start and the end. Mood: quiet study and devotion, patient and clear. Spacious natural hall reverb, unhurried phrasing with breathing space. 58 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 04 · วงแสง (圓光) — `yuan-guang`

```
Slow, meditative Chinese Buddhist temple instrumental. Small temple bells and a celesta-like plucked tone carrying the melody over a quiet drone, pentatonic melody in C gong mode (major pentatonic, bright and settled), a small wind chime now and then. A single temple bell (qing) at the start and the end. Mood: luminous and clear, light slowly filling a dark room. Spacious natural hall reverb, unhurried phrasing with breathing space. 60 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 05 · เมฆลอยอิสระ (雲遊) — `you-xi`

```
Slow, meditative Chinese Buddhist temple instrumental. Xiao (end-blown bamboo flute) carrying long breathy phrases over a soft guzheng accompaniment, pentatonic melody in A zhi mode (pentatonic on the 5th degree, warm and hopeful), a faint breeze in the background. A single temple bell (qing) at the start and the end. Mood: light-hearted freedom, drifting clouds, unattached ease. Spacious natural hall reverb, unhurried phrasing with breathing space. 70 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 06 · ผ้าขาว (白衣) — `bai-yi`

```
Slow, meditative Chinese Buddhist temple instrumental. Solo guzheng (Chinese zither) carrying the melody, a soft xiao flute answering some phrases, pentatonic melody in A# gong mode (major pentatonic, bright and settled), a small wind chime now and then. A single temple bell (qing) at the start and the end. Mood: pure, gentle and motherly, soft white light. Spacious natural hall reverb, unhurried phrasing with breathing space. 60 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 07 · บัวในสระ (蓮池) — `lian-wo`

```
Slow, meditative Chinese Buddhist temple instrumental. Solo guzheng (Chinese zither) carrying the melody, a soft xiao flute answering some phrases, pentatonic melody in G# zhi mode (pentatonic on the 5th degree, warm and hopeful), occasional high plucked notes like water drops. A single temple bell (qing) at the start and the end. Mood: peaceful lotus pond, supportive and serene. Spacious natural hall reverb, unhurried phrasing with breathing space. 58 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 08 · เสียงน้ำตก (瀑聲) — `long-jian`

```
Slow, meditative Chinese Buddhist temple instrumental. Solo guzheng (Chinese zither) carrying the melody, a soft xiao flute answering some phrases, pentatonic melody in A shang mode (pentatonic on the 2nd degree, open and searching), a quiet flowing stream in the background. A single temple bell (qing) at the start and the end. Mood: still mind beside a waterfall, deep listening. Spacious natural hall reverb, unhurried phrasing with breathing space. 64 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 09 · ฝนหนึ่งสาย (一雨) — `shi-yao`

```
Slow, meditative Chinese Buddhist temple instrumental. Konghou (Chinese harp) playing rolling arpeggios with a simple melody on top, pentatonic melody in G gong mode (major pentatonic, bright and settled). A single temple bell (qing) at the start and the end. Mood: warm, comforting, quietly healing, gentle rain on fields. Spacious natural hall reverb, unhurried phrasing with breathing space. 60 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 10 · ตะกร้าไม้ไผ่ (竹籃) — `yu-lan`

```
Slow, meditative Chinese Buddhist temple instrumental. Solo guzheng (Chinese zither) carrying the melody, a soft xiao flute answering some phrases, pentatonic melody in B zhi mode (pentatonic on the 5th degree, warm and hopeful). A single temple bell (qing) at the start and the end. Mood: humble village market morning, kind and down-to-earth. Spacious natural hall reverb, unhurried phrasing with breathing space. 68 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 11 · ศิลากับกิ่งหลิว (石上柳) — `de-wang`

```
Slow, meditative Chinese Buddhist temple instrumental. Guqin (seven-string zither) in the low register with long sustained notes, very sparse, pentatonic melody in E gong mode (major pentatonic, bright and settled). A single temple bell (qing) at the start and the end. Mood: dignified virtue, calm leadership, seated on a mountain rock. Spacious natural hall reverb, unhurried phrasing with breathing space. 56 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 12 · จันทร์ในน้ำ (水中月) — `shui-yue`

```
Slow, meditative Chinese Buddhist temple instrumental. Solo guzheng (Chinese zither) carrying the melody, a soft xiao flute answering some phrases, pentatonic melody in A yu mode (minor pentatonic, gentle and introspective), occasional high plucked notes like water drops. A single temple bell (qing) at the start and the end. Mood: moonlight reflected on still water, beautiful and unclinging. Spacious natural hall reverb, unhurried phrasing with breathing space. 54 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 13 · ใบบัวข้ามทะเล (一葉渡) — `yi-ye`

```
Slow, meditative Chinese Buddhist temple instrumental. Solo guzheng (Chinese zither) carrying the melody, a soft xiao flute answering some phrases, pentatonic melody in G# shang mode (pentatonic on the 2nd degree, open and searching), very soft ocean waves in the background. A single temple bell (qing) at the start and the end. Mood: a single lotus leaf crossing a wide sea, steady courage. Spacious natural hall reverb, unhurried phrasing with breathing space. 62 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 14 · พระศอสีน้ำเงิน (青頸) — `qing-jing`

```
Slow, meditative Chinese Buddhist temple instrumental. Small temple bells and a celesta-like plucked tone carrying the melody over a quiet drone, pentatonic melody in F# yu mode (minor pentatonic, gentle and introspective). A single temple bell (qing) at the start and the end. Mood: solemn compassion that absorbs pain, deep and grounded. Spacious natural hall reverb, unhurried phrasing with breathing space. 56 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 15 · อ่อนโยนแต่มั่นคง (柔中威) — `wei-de`

```
Slow, meditative Chinese Buddhist temple instrumental. Guqin (seven-string zither) in the low register with long sustained notes, very sparse, pentatonic melody in F shang mode (pentatonic on the 2nd degree, open and searching), a small wind chime now and then. A single temple bell (qing) at the start and the end. Mood: gentle strength, firm but kind, protective dignity. Spacious natural hall reverb, unhurried phrasing with breathing space. 60 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 16 · ธารชีวิต (長流) — `yan-ming`

```
Slow, meditative Chinese Buddhist temple instrumental. Xiao (end-blown bamboo flute) carrying long breathy phrases over a soft guzheng accompaniment, pentatonic melody in G gong mode (major pentatonic, bright and settled), a quiet flowing stream in the background. A single temple bell (qing) at the start and the end. Mood: long flowing river of life, grateful and unhurried. Spacious natural hall reverb, unhurried phrasing with breathing space. 54 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 17 · สร้อยรัตนะ (瓔珞) — `zhong-bao`

```
Slow, meditative Chinese Buddhist temple instrumental. Konghou (Chinese harp) playing rolling arpeggios with a simple melody on top, pentatonic melody in B gong mode (major pentatonic, bright and settled), a small wind chime now and then. A single temple bell (qing) at the start and the end. Mood: generous and abundant, sharing treasures freely. Spacious natural hall reverb, unhurried phrasing with breathing space. 64 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 18 · ปากถ้ำ (巖前) — `yan-hu`

```
Slow, meditative Chinese Buddhist temple instrumental. Guqin (seven-string zither) in the low register with long sustained notes, very sparse, pentatonic melody in E yu mode (minor pentatonic, gentle and introspective), occasional high plucked notes like water drops. A single temple bell (qing) at the start and the end. Mood: quiet cave by the water, inner peace before returning to the world. Spacious natural hall reverb, unhurried phrasing with breathing space. 54 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 19 · คลื่นสงบ (浪靜) — `neng-jing`

```
Slow, meditative Chinese Buddhist temple instrumental. Solo guzheng (Chinese zither) carrying the melody, a soft xiao flute answering some phrases, pentatonic melody in G shang mode (pentatonic on the 2nd degree, open and searching), very soft ocean waves in the background. A single temple bell (qing) at the start and the end. Mood: waves slowly calming, settling a restless heart. Spacious natural hall reverb, unhurried phrasing with breathing space. 56 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 20 · สระอโนดาต (無熱池) — `a-nou`

```
Slow, meditative Chinese Buddhist temple instrumental. Small temple bells and a celesta-like plucked tone carrying the melody over a quiet drone, pentatonic melody in A# zhi mode (pentatonic on the 5th degree, warm and hopeful), a quiet flowing stream in the background. A single temple bell (qing) at the start and the end. Mood: cool mountain lake without heat, refreshing and clear. Spacious natural hall reverb, unhurried phrasing with breathing space. 58 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 21 · พิณกับราชสีห์ (獅琴) — `a-mo-ti`

```
Slow, meditative Chinese Buddhist temple instrumental. Konghou (Chinese harp) playing rolling arpeggios with a simple melody on top, pentatonic melody in A shang mode (pentatonic on the 2nd degree, open and searching). A single temple bell (qing) at the start and the end. Mood: fearless yet gentle, a harp played beside a white lion. Spacious natural hall reverb, unhurried phrasing with breathing space. 64 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 22 · ร่มใบไม้ (葉蔭) — `ye-yi`

```
Slow, meditative Chinese Buddhist temple instrumental. Xiao (end-blown bamboo flute) carrying long breathy phrases over a soft guzheng accompaniment, pentatonic melody in G zhi mode (pentatonic on the 5th degree, warm and hopeful), a faint breeze in the background. A single temple bell (qing) at the start and the end. Mood: shade of a great tree, caring for the whole community. Spacious natural hall reverb, unhurried phrasing with breathing space. 62 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 23 · ใจใสดุจแก้ว (琉璃心) — `liu-li`

```
Slow, meditative Chinese Buddhist temple instrumental. Small temple bells and a celesta-like plucked tone carrying the melody over a quiet drone, pentatonic melody in C# gong mode (major pentatonic, bright and settled), occasional high plucked notes like water drops. A single temple bell (qing) at the start and the end. Mood: crystal clear and honest, like light through glass. Spacious natural hall reverb, unhurried phrasing with breathing space. 56 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 24 · เมฆที่มาถึง (雲來) — `duo-luo`

```
Slow, meditative Chinese Buddhist temple instrumental. Xiao (end-blown bamboo flute) carrying long breathy phrases over a soft guzheng accompaniment, pentatonic melody in B zhi mode (pentatonic on the 5th degree, warm and hopeful), a small wind chime now and then. A single temple bell (qing) at the start and the end. Mood: swift compassion arriving on clouds, uplifting and reassuring. Spacious natural hall reverb, unhurried phrasing with breathing space. 70 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 25 · หอยกาบ (蛤蜊) — `ge-li`

```
Slow, meditative Chinese Buddhist temple instrumental. Solo guzheng (Chinese zither) carrying the melody, a soft xiao flute answering some phrases, pentatonic melody in A gong mode (major pentatonic, bright and settled), very soft ocean waves in the background. A single temple bell (qing) at the start and the end. Mood: simple everyday grace, finding the sacred in small things. Spacious natural hall reverb, unhurried phrasing with breathing space. 66 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 26 · หกยาม (六時) — `liu-shi`

```
Slow, meditative Chinese Buddhist temple instrumental. Guqin (seven-string zither) in the low register with long sustained notes, very sparse, pentatonic melody in F# shang mode (pentatonic on the 2nd degree, open and searching), a small wind chime now and then. A single temple bell (qing) at the start and the end. Mood: gentle watchfulness through day and night, a steady presence. Spacious natural hall reverb, unhurried phrasing with breathing space. 60 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 27 · เสียงที่ทรงสดับ (聞聲) — `pu-bei`

```
Slow, meditative Chinese Buddhist temple instrumental. Xiao (end-blown bamboo flute) carrying long breathy phrases over a soft guzheng accompaniment, pentatonic melody in G yu mode (minor pentatonic, gentle and introspective). A single temple bell (qing) at the start and the end. Mood: all-embracing compassion, quiet and humble, no one forgotten. Spacious natural hall reverb, unhurried phrasing with breathing space. 54 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 28 · วันวิวาห์ (馬郎) — `ma-lang-fu`

```
Slow, meditative Chinese Buddhist temple instrumental. Solo guzheng (Chinese zither) carrying the melody, a soft xiao flute answering some phrases, pentatonic melody in A# yu mode (minor pentatonic, gentle and introspective). A single temple bell (qing) at the start and the end. Mood: tender love that turns toward wisdom, graceful and bittersweet. Spacious natural hall reverb, unhurried phrasing with breathing space. 62 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 29 · บัวตูม (合掌) — `he-zhang`

```
Slow, meditative Chinese Buddhist temple instrumental. Small temple bells and a celesta-like plucked tone carrying the melody over a quiet drone, pentatonic melody in G# gong mode (major pentatonic, bright and settled). A single temple bell (qing) at the start and the end. Mood: joined palms, mutual respect, harmony and reconciliation. Spacious natural hall reverb, unhurried phrasing with breathing space. 56 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 30 · เมฆเคลื่อน (如雲) — `yi-ru`

```
Slow, meditative Chinese Buddhist temple instrumental. Xiao (end-blown bamboo flute) carrying long breathy phrases over a soft guzheng accompaniment, pentatonic melody in A# shang mode (pentatonic on the 2nd degree, open and searching), a faint breeze in the background. A single temple bell (qing) at the start and the end. Mood: moving clouds, seeing things as they are, calm acceptance. Spacious natural hall reverb, unhurried phrasing with breathing space. 64 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 31 · ใบบัวกลางน้ำ (不二) — `bu-er`

```
Slow, meditative Chinese Buddhist temple instrumental. Solo guzheng (Chinese zither) carrying the melody, a soft xiao flute answering some phrases, pentatonic melody in G# yu mode (minor pentatonic, gentle and introspective), occasional high plucked notes like water drops. A single temple bell (qing) at the start and the end. Mood: a lotus leaf floating on calm water, balance and non-duality. Spacious natural hall reverb, unhurried phrasing with breathing space. 54 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 32 · บัวในพระหัตถ์ (持蓮) — `chi-lian`

```
Slow, meditative Chinese Buddhist temple instrumental. Konghou (Chinese harp) playing rolling arpeggios with a simple melody on top, pentatonic melody in C zhi mode (pentatonic on the 5th degree, warm and hopeful), occasional high plucked notes like water drops. A single temple bell (qing) at the start and the end. Mood: cradling a lotus flower, tender and innocent love. Spacious natural hall reverb, unhurried phrasing with breathing space. 62 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```

## 33 · หยดน้ำ (灑水) — `sa-shui`

```
Slow, meditative Chinese Buddhist temple instrumental. Solo guzheng (Chinese zither) carrying the melody, a soft xiao flute answering some phrases, pentatonic melody in D gong mode (major pentatonic, bright and settled), occasional high plucked notes like water drops, a quiet flowing stream in the background. A single temple bell (qing) at the start and the end. Mood: sprinkling cool water to all, refreshing and generous, a circle closing. Spacious natural hall reverb, unhurried phrasing with breathing space. 60 BPM. No drums, no percussion loop, no vocals, no chanting, no lyrics. Background music for quiet prayer at a Guanyin shrine. Length 90 seconds, gentle fade out.
```
