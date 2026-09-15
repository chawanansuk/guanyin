import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
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

export default defineConfig({
  site: siteUrl,
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin'),
      i18n: undefined,
    }),
  ],
  image: { responsiveStyles: true },
  devToolbar: { enabled: false },
});
