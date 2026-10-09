import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const WISH_IDS = [
  'health', 'children', 'career', 'trade',
  'love', 'travel', 'protection', 'peace',
] as const;

const pang = defineCollection({
  loader: glob({ base: './src/content/pang', pattern: '**/*.md' }),
  schema: z.object({
    order: z.number().int().min(1).max(33),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'slug ต้องเป็น a-z 0-9 และ - เท่านั้น'),
    name_th: z.string(),
    /** ชื่อที่ป้ายในตำหนักใช้จริง ถ้าต่างจากชื่อทั่วไป — ถ้ามี จะถูกใช้แทน name_th */
    name_th_shrine: z.string().default(''),
    name_zh: z.string(),
    name_pinyin: z.string(),
    name_thai_reading: z.string(),
    /** ชื่ออ่านแบบญี่ปุ่น เช่น โยริว คันนง — ชุดภาพ ๓๓ ปางแพร่หลายในญี่ปุ่นด้วย */
    name_japanese: z.string().default(''),
    name_sanskrit: z.string().default(''),
    /** ชื่อไทยสายแปลศัพท์ธรรม (นีลกัณฐอวโลกิเตศวร ฯลฯ) — ใช้เป็น "ชื่ออื่นที่พบ" */
    name_th_scholarly: z.string().default(''),
    /** รูปอักษรจีนทางเลือกที่พบตามป้ายและเอกสาร เช่น 巖戶觀音 */
    name_zh_variants: z.array(z.string()).default([]),
    /** วลีสั้นบอกแก่นของปาง ใช้บนการ์ดในหน้ารวม ให้กวาดสายตาหาปางที่ตรงกับเรื่องที่จะขอได้ */
    tagline: z.string().default(''),
    /** ประโยคเปิดบท — เป็นคำอธิบายเชิงตีความ ไม่ใช่ถ้อยคำจากพระสูตร */
    essence: z.string().default(''),
    /** ข้อสรุปสั้นของปาง อ่านจบใน ๑๐ วินาที สำหรับคนที่ไม่อ่านบทเต็ม */
    keypoints: z.array(z.string()).default([]),
    /** เอกสารต้นทางของเนื้อหา — ต่างจาก verified_by ที่เป็นผู้รู้ของตำหนัก */
    source_doc: z.string().default(''),
    has_full: z.boolean().default(false),
    /** false = ยังไม่ได้อัญเชิญมาประดิษฐาน แสดงในหน้ารวมเป็น "กำลังอัญเชิญ" */
    enshrined: z.boolean().default(true),
    shrine_point: z.number().int().nullable().default(null),
    attributes: z.string(),
    wishes: z.array(z.enum(WISH_IDS)).min(1).max(3),
    short_prayer: z.string(),
    photo: z.string().default(''),
    photo_detail: z.string().default(''),
    prayer: z.string().default(''),
    sources: z.array(z.string()).default([]),
    /** ว่าง = ผู้รู้ของตำหนักยังไม่ได้ตรวจ → ไม่เผยแพร่เนื้อหายาว และไม่ให้ Google เก็บดัชนี */
    verified_by: z.string().default(''),

    // ---------- องค์จริงในตำหนัก — ตำหนักเป็นเจ้าของ กรอกผ่าน Google Sheet (npm run import:sheet) ----------
    // หนังสือบอกว่าปางนี้ "ควร" เป็นอย่างไร ช่องชุดนี้บอกว่าองค์ที่ตั้งอยู่จริง "เป็น" อย่างไร
    // คนที่สแกน QR มององค์จริงอยู่ ถ้าสองอย่างไม่ตรงกัน ต้องเชื่อองค์จริง
    /** ท่า เช่น ยืน · นั่ง · นั่งห้อยพระบาท */
    posture: z.string().default(''),
    /** สิ่งที่ทรงถือในแต่ละพระหัตถ์ */
    holds: z.string().default(''),
    /** ฐานหรือสัตว์ที่รองรับ เช่น บัว ศิลา มังกร คลื่น */
    base: z.string().default(''),
    material: z.string().default(''),
    height_cm: z.number().positive().nullable().default(null),
    /** ที่มาขององค์ — โรงงานหรือช่าง ปีที่สร้าง */
    maker: z.string().default(''),
    /** ผู้ถวาย — ใส่เมื่อผู้ถวายอนุญาตให้เปิดเผยเท่านั้น */
    donor: z.string().default(''),
    /** คำบรรยายองค์จริงเป็นร้อยแก้ว ย่อหน้าคั่นด้วยบรรทัดว่าง */
    shrine_statue: z.string().default(''),
    /** สิ่งที่ตำหนักอยากให้คนสังเกตบนองค์นี้ */
    shrine_highlight: z.string().default(''),
    /** ภาพองค์ในที่ตั้งจริง เห็นองค์ข้างเคียง — ชื่อไฟล์ เช่น pang-01-place */
    photo_place: z.string().default(''),
    /** คำแนะนำการขอพรกับปางนี้ ย่อหน้าคั่นด้วยบรรทัดว่าง */
    how_to_ask: z.string().default(''),

    // ---------- เรียบเรียงจากหนังสือ ----------
    /** ปางที่หน้าตาคล้ายกันจนคนสับสน และจุดที่ใช้แยก */
    confused_with: z.array(z.object({ slug: z.string(), note: z.string() })).default([]),
    /** กราบปางนี้แล้ว ปางที่ควรไปกราบต่อ (slug) */
    see_also: z.array(z.string()).default([]),
    /** คำถามที่คนค้นจริง — ส่งเป็น FAQPage ให้ Google ด้วย */
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }),
});

const wishes = defineCollection({
  loader: file('./src/content/wishes/wishes.yaml'),
  schema: z.object({
    id: z.enum(WISH_IDS),
    order: z.number().int(),
    title: z.string(),
    short: z.string(),
    lede: z.string(),
    intro: z.string(),
    keywords: z.array(z.string()).default([]),
  }),
});

const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  title_zh: z.string().default(''),
  lunar: z.string().default(''),
  date: z.coerce.date(),
  end_date: z.coerce.date().optional(),
  /** true = วันที่คำนวณจากรอบจันทรคติ ยังไม่ได้เทียบปฏิทินจีนฉบับพิมพ์ */
  approx: z.boolean().default(true),
  kind: z.enum(['guanyin', 'festival', 'shrine', 'other']).default('other'),
  featured: z.boolean().default(false),
  note: z.string().default(''),
});

// รวมไฟล์รายปีใน src/content/events/*.yaml ให้เป็นคอลเลกชันเดียว
// (แยกไฟล์ตามปีเพื่อให้ตำหนักแก้ทีละปีผ่าน /admin ได้โดยไม่ชนกัน)
const events = defineCollection({
  loader: {
    name: 'events-by-year',
    load: async ({ store, parseData, logger, watcher }) => {
      const { readdir, readFile } = await import('node:fs/promises');
      const { load: parseYaml } = await import('js-yaml');
      const dir = new URL('./content/events/', import.meta.url);
      const dirPath = fileURLToPath(dir);
      const files = (await readdir(dirPath)).filter((f) => f.endsWith('.yaml'));
      store.clear();
      for (const f of files.sort()) {
        const full = join(dirPath, f);
        const rel = `src/content/events/${f}`; // store ต้องการ path เทียบรากโปรเจกต์
        watcher?.add(full);
        const rows = (parseYaml(await readFile(full, 'utf8')) as any[]) ?? [];
        for (const row of rows) {
          const data = await parseData({ id: row.id, data: row, filePath: rel });
          store.set({ id: row.id, data, filePath: rel });
        }
      }
      logger.info(`ปฏิทิน: อ่าน ${files.length} ไฟล์ปี, รวม ${store.keys().length} วันสำคัญ`);
    },
  },
  schema: eventSchema,
});

const news = defineCollection({
  loader: glob({ base: './src/content/news', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().default(''),
    cover: z.string().default(''),
    pinned: z.boolean().default(false),
  }),
});

// บทความ — ตอบคำถามที่คนค้นหา แยกจากข่าวเพราะอายุต่างกัน (ข่าวหมดอายุใน ๖ เดือน บทความอยู่หลายปี)
// แผนบทความทั้ง ๒๔ เรื่องอยู่ใน docs/ARTICLES.md
const ARTICLE_CATEGORIES = ['worship', 'days', 'pang', 'shrine'] as const;
const articles = defineCollection({
  loader: glob({ base: './src/content/articles', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    /** ย่อหน้าแรก = คำตอบสั้น ใช้เป็น description และบนหน้ารวม */
    summary: z.string(),
    category: z.enum(ARTICLE_CATEGORIES),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    /** slug ของปางที่เกี่ยว — แสดงเป็นลิงก์ท้ายบทความ */
    pang: z.array(z.string()).default([]),
    /** หมวดพรที่เกี่ยว — ลิงก์ไปหน้า /wish/{id} */
    wishes: z.array(z.enum(WISH_IDS)).default([]),
    /** ช่วงที่บทความนี้ควรขึ้นหน้ารวมก่อน เช่น "กินเจ" "ตรุษจีน" — ว่างคือทั้งปี */
    season: z.string().default(''),
    cover: z.string().default(''),
    /** คำถามท้ายบทความ — ส่งเป็น FAQPage ให้ Google ด้วย */
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    sources: z.array(z.string()).default([]),
    /** ว่าง = ผู้รู้ของตำหนักยังไม่ได้ตรวจ → แสดงป้าย "รอตรวจสอบ" และไม่ให้ Google เก็บดัชนี */
    verified_by: z.string().default(''),
  }),
});

const prayers = defineCollection({
  loader: glob({ base: './src/content/prayers', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    title_zh: z.string().default(''),
    subtitle: z.string().default(''),
    order: z.number().int().default(99),
    audio: z.string().default(''),
    verified_by: z.string().default(''),
  }),
});

// บทเต็มจากต้นฉบับหนังสือ — หนึ่งบทต่อหนึ่งปาง สร้างด้วย npm run import:book
const pangFull = defineCollection({
  loader: glob({ base: './src/content/pang-full', pattern: '**/*.md' }),
  schema: z.object({
    order: z.number().int().min(1).max(33),
    slug: z.string(),
    title: z.string(),
    source: z.string(),
    words: z.number().int(),
    /** true = เรียบเรียงขยายด้วยมือแล้ว npm run import:book จะไม่เขียนทับไฟล์นี้ */
    edited: z.boolean().default(false),
  }),
});

// ข้อความภาษาจีนของแต่ละปาง — แยกไฟล์เพื่อให้ผู้แปลแก้ได้โดยไม่ชนกับ import:book
// ฉบับภาษาจีนตัวเต็มของ ๓๓ ปาง — แปลจากฉบับไทย หนึ่งไฟล์ต่อปาง ชื่อไฟล์เดียวกับฝั่งไทย
// เนื้อบทคือบทเต็ม ส่วน frontmatter คือช่องที่หน้าไทยแสดง (ลักษณะ แก่น สรุป วิธีขอพร ถามตอบ อ้างอิง)
const pangZh = defineCollection({
  loader: glob({ base: './src/content/pang-zh', pattern: '**/*.md' }),
  schema: z.object({
    order: z.number().int().min(1).max(33),
    slug: z.string(),
    marks: z.string(),
    essence: z.string(),
    tagline: z.string().default(''),
    short_prayer: z.string().default(''),
    keypoints: z.array(z.string()).default([]),
    how_to_ask: z.string().default(''),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    confused_with: z.array(z.object({ slug: z.string(), note: z.string() })).default([]),
    sources: z.array(z.string()).default([]),
    /** จำนวนอักษรของเนื้อบท ไม่นับช่องว่าง */
    words: z.number().int(),
  }),
});

export const collections = { pang, wishes, events, news, articles, prayers, pangFull, pangZh };
