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

export default defineConfig({
  site: siteUrl,
  trailingSlash: 'never',
  // หน้ากำหนดการพิธีเปิดถูกถอดออก (งานจัดเป็นการภายใน) ลิงก์ที่เคยแชร์ไปให้กลับหน้าแรก
  redirects: { '/opening': '/', '/zh/opening': '/zh' },
  build: { format: 'file' },
  integrations: [
    sitemap({
      // หน้าที่ตั้ง noindex ต้องไม่อยู่ใน sitemap ไม่งั้น Search Console เตือนว่าสัญญาณขัดกัน
      // บทสวดยังรอผู้รู้ตรวจ (verified_by ว่าง) จึง noindex — ตรวจแล้วค่อยลบออกจากรายการนี้
      filter: (page) =>
        !page.includes('/admin') &&
        !NOINDEX_PRAYERS.some((s) => page.includes(`/worship/prayers/${s}`)) &&
        !NOINDEX_ARTICLES.some((s) => page.includes(`/articles/${s}`)),
      i18n: undefined,
    }),
  ],
  image: { responsiveStyles: true },
  devToolbar: { enabled: false },
});
