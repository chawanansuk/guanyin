/**
 * robots.txt สร้างตอน build เพื่อให้บรรทัด Sitemap ตรงกับโดเมนที่ใช้จริง
 * ถ้าเขียนเป็นไฟล์นิ่งใน public/ แล้ว deploy ไปอยู่คนละโดเมน
 * กูเกิลจะตามไปอ่าน sitemap ที่โดเมนอื่นซึ่งอาจยังไม่มีอยู่
 */
import type { APIRoute } from 'astro';
import { siteUrl } from '../lib/site';

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${siteUrl}/sitemap-index.xml
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
