// หลัง build: ภาพที่มาจากบทความ markdown ไม่มี loading และขนาดภาพ (ตัวประมวลผล markdown ของ Astro 7
// ใส่ปลั๊กอินไม่ได้ถ้าไม่ลงแพ็กเกจเพิ่ม) — ไล่แก้ใน dist/ ให้โหลดเมื่อเลื่อนมาถึง และใส่ความกว้างสูงจริง
// หน้าจึงไม่กระโดดตอนภาพโหลดเสร็จ · ภาพที่คอมโพเนนต์ใส่ loading ไว้แล้ว (เช่นภาพแรกของหน้า) ไม่แตะ
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const DIST = 'dist', PUBLIC = 'public';
const sizes = new Map();
const sizeOf = (src) => {
  if (!sizes.has(src)) {
    const file = join(PUBLIC, decodeURI(src.split('?')[0]));
    sizes.set(src, existsSync(file) ? sharp(file).metadata().catch(() => null) : Promise.resolve(null));
  }
  return sizes.get(src);
};
const walk = (dir) => readdirSync(dir, { withFileTypes: true })
  .flatMap((d) => d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith('.html') ? [join(dir, d.name)] : []);

let pages = 0, imgs = 0;
for (const file of walk(DIST)) {
  const html = readFileSync(file, 'utf8');
  const tags = html.match(/<img\b[^>]*>/g)?.filter((t) => !/\sloading=/.test(t)) ?? [];
  if (!tags.length) continue;
  let out = html;
  for (const tag of new Set(tags)) {
    let add = ' loading="lazy" decoding="async"';
    const src = tag.match(/\ssrc="([^"]+)"/)?.[1] ?? '';
    if (src.startsWith('/') && !/\swidth=/.test(tag)) {
      const m = await sizeOf(src);
      if (m?.width && m?.height) add += ` width="${m.width}" height="${m.height}"`;
    }
    out = out.split(tag).join(tag.replace(/^<img\b/, '<img' + add));
    imgs++;
  }
  writeFileSync(file, out); pages++;
}
console.log(`ภาพในบทความ: ใส่ lazy และขนาดภาพ ${imgs} ภาพ ใน ${pages} หน้า`);
