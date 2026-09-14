#!/usr/bin/env node
/**
 * photos-src/*.{jpg,jpeg,png,tif,webp} → public/images/ + src/data/photos.json
 *
 * ย่อเป็น WebP ๓ ขนาด เพราะหน้ารวมมีภาพ ๓๓ องค์บนหน้าเดียว
 * ถ้าไม่บีบอัดหน้าจะหนักหลายสิบเมกะไบต์บน 4G
 *
 *   npm run images
 */
import { readdir, mkdir, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(root, 'photos-src');
const OUT = join(root, 'public', 'images', 'pang');
const MANIFEST = join(root, 'src', 'data', 'photos.json');
const SIZES = [480, 960, 1600];
const QUALITY = 78;
const EXT = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp']);

let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch {
  console.error('ไม่พบ sharp — ติดตั้งก่อนด้วย  npm install');
  process.exit(1);
}

if (!existsSync(SRC)) {
  console.error(`ไม่พบโฟลเดอร์ ${SRC}`);
  process.exit(1);
}

await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => EXT.has(extname(f).toLowerCase()));
if (files.length === 0) {
  console.log('ยังไม่มีภาพใน photos-src/ — เว็บจะใช้ภาพแท่นบูชาแทนไปก่อน');
}

const images = {};
let made = 0, skipped = 0;

for (const file of files.sort()) {
  const name = basename(file, extname(file));
  const input = join(SRC, file);
  const srcStat = await stat(input);
  const meta = await sharp(input).metadata();
  const widths = SIZES.filter((w) => w <= (meta.width ?? 0)).concat(
    SIZES.every((w) => w > (meta.width ?? 0)) ? [meta.width] : [],
  );

  for (const w of widths) {
    const out = join(OUT, `${name}-${w}.webp`);
    // ข้ามถ้าไฟล์ปลายทางใหม่กว่าต้นฉบับ — รันซ้ำจะได้เร็ว
    if (existsSync(out) && (await stat(out)).mtimeMs > srcStat.mtimeMs) { skipped++; continue; }
    await sharp(input)
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 5 })
      .toFile(out);
    made++;
  }

  images[name] = { widths, ext: 'webp', w: meta.width ?? null, h: meta.height ?? null };

  const ratio = (meta.width ?? 0) / (meta.height ?? 1);
  if (name.startsWith('pang-') && !name.endsWith('-detail') && Math.abs(ratio - 0.75) > 0.04) {
    console.warn(`  ! ${file} สัดส่วน ${ratio.toFixed(2)} ไม่ใช่ 3:4 — เรียงเป็นตารางแล้วจะไม่เท่ากัน`);
  }
}

await writeFile(
  MANIFEST,
  JSON.stringify({
    note: 'สร้างอัตโนมัติโดย scripts/build-images.mjs — อย่าแก้ด้วยมือ',
    generated: new Date().toISOString(),
    sizes: SIZES,
    images,
  }, null, 2) + '\n',
  'utf8',
);

console.log(`ภาพ: สร้างใหม่ ${made} ไฟล์, ข้าม ${skipped} ไฟล์, ต้นฉบับ ${files.length} ภาพ`);
console.log(`อัปเดต ${MANIFEST}`);
