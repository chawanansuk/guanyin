import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import site from './src/data/site.json' with { type: 'json' };

// ต้องตรงกับ src/lib/site.ts — ไฟล์นี้เป็น config ของ Astro จึง import
// โมดูล TypeScript ของเว็บเข้ามาใช้ซ้ำไม่ได้ ต้องเขียนลำดับเดียวกันไว้สองที่
const siteUrl = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : '') ||
  site.url
).replace(/\/+$/, '');

// บทสวดที่ยังไม่มีผู้รู้ตรวจ — หน้าเหล่านี้ตั้ง noindex ไว้ (ดู worship/prayers/[slug].astro)
// อ่านจากไฟล์เนื้อหาตรง ๆ เพราะตอนอ่าน config ยังเรียก content collection ไม่ได้
const unverifiedSlugs = (dir) =>
  readdirSync(new URL(`./src/content/${dir}/`, import.meta.url))
    .filter((f) => f.endsWith('.md'))
    .filter((f) => {
      const fm = readFileSync(new URL(`./src/content/${dir}/${f}`, import.meta.url), 'utf8').split('---')[1] ?? '';
      const v = (fm.match(/^verified_by:\s*"?(.*?)"?\s*$/m) ?? [])[1] ?? '';
      return v.trim() === '';
    })
    .map((f) => f.replace(/\.md$/, ''));
const NOINDEX_PRAYERS = unverifiedSlugs('prayers');
// บทความใช้กติกาเดียวกัน — รอผู้รู้ตรวจก่อนจึงส่งให้ Google (ดู articles/[slug].astro)
const NOINDEX_ARTICLES = unverifiedSlugs('articles');

// วันที่แก้ล่าสุดของบทความ (updated หรือ date ในไฟล์) ใส่เป็น lastmod ใน sitemap
// หน้าอื่นไม่มีวันที่ในเนื้อหา จึงไม่ใส่ — lastmod ที่ไม่จริง Google จะเลิกเชื่อทั้งไฟล์
const articleDates = Object.fromEntries(
  readdirSync(new URL('./src/content/articles/', import.meta.url))
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const fm = readFileSync(new URL(`./src/content/articles/${f}`, import.meta.url), 'utf8').split('---')[1] ?? '';
      const pick = (k) => (fm.match(new RegExp(`^${k}:\\s*"?(\\d{4}-\\d{2}-\\d{2})`, 'm')) ?? [])[1];
      return [f.replace(/\.md$/, ''), pick('updated') ?? pick('date')];
    })
    .filter(([, d]) => d),
);

export default defineConfig({
  site: siteUrl,
  trailingSlash: 'never',
  // หน้ากำหนดการพิธีเปิด (/opening) ถูกถอดออก — redirect อยู่ใน vercel.json เป็น 301 จริง
  // ไม่ใช้ redirects ของ Astro เพราะเว็บแบบ static จะได้หน้า meta refresh ที่ตอบ 200 แทน
  build: { format: 'file' },
  integrations: [
    sitemap({
      // หน้าที่ตั้ง noindex ต้องไม่อยู่ใน sitemap ไม่งั้น Search Console เตือนว่าสัญญาณขัดกัน
      // บทสวดยังรอผู้รู้ตรวจ (verified_by ว่าง) จึง noindex — ตรวจแล้วค่อยลบออกจากรายการนี้
      filter: (page) =>
        !page.includes('/admin') &&
        // หน้าให้ตำหนักตรวจร่างบทสวดและเพลง ไม่ใช่หน้าสำหรับผู้มาไหว้
        !page.includes('/review/') &&
        !NOINDEX_PRAYERS.some((s) => page.includes(`/worship/prayers/${s}`)) &&
        !NOINDEX_ARTICLES.some((s) => page.includes(`/articles/${s}`)),
      i18n: undefined,
      serialize(item) {
        const slug = (item.url.match(/\/articles\/([^/]+)$/) ?? [])[1];
        if (slug && articleDates[slug]) item.lastmod = articleDates[slug];
        return item;
      },
    }),
  ],
  image: { responsiveStyles: true },
  devToolbar: { enabled: false },
});
