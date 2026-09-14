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
    name_sanskrit: z.string().default(''),
    /** false = ยังไม่ได้อัญเชิญมาประดิษฐาน แสดงในหน้ารวมเป็น "กำลังอัญเชิญ" */
    enshrined: z.boolean().default(true),
    shrine_point: z.number().int().nullable().default(null),
    attributes: z.string(),
    wishes: z.array(z.enum(WISH_IDS)).min(1).max(3),
    incense: z.number().int().min(1).max(9).default(3),
    short_prayer: z.string(),
    photo: z.string().default(''),
    photo_detail: z.string().default(''),
    prayer: z.string().default(''),
    sources: z.array(z.string()).default([]),
    /** ว่าง = ผู้รู้ของตำหนักยังไม่ได้ตรวจ → ไม่เผยแพร่เนื้อหายาว และไม่ให้ Google เก็บดัชนี */
    verified_by: z.string().default(''),
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

export const collections = { pang, wishes, events, news, prayers };
