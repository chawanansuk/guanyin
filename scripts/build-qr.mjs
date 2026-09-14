#!/usr/bin/env node
/**
 * แผ่นพิมพ์ป้าย QR สำหรับติดที่ฐานองค์ ๓๓ ปาง + ป้ายทางเข้าและป้ายประกาศ
 *
 * QR ชี้ที่ slug ไม่ใช่เลขลำดับ — ถ้าตำหนักเปลี่ยนลำดับปางภายหลัง
 * ป้ายที่พิมพ์ไปแล้วจึงยังใช้ได้ ไม่ต้องพิมพ์ใหม่
 *
 *   npm run qr            → dist-qr/qr-sheet.html  แล้วเปิดในเบราว์เซอร์ › สั่งพิมพ์ › บันทึกเป็น PDF
 *   npm run qr -- --svg   → แยกเป็นไฟล์ SVG รายชิ้นสำหรับส่งโรงพิมพ์
 */
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const root = fileURLToPath(new URL('..', import.meta.url));
const site = JSON.parse(await readFile(join(root, 'src', 'data', 'site.json'), 'utf8'));
const OUT = join(root, 'dist-qr');
const svgMode = process.argv.includes('--svg');

const THAI_DIGITS = ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'];
const thaiNum = (n) => String(n).replace(/\d/g, (d) => THAI_DIGITS[+d]);

const dir = join(root, 'src', 'content', 'pang');
const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort();

const tags = [];
for (const f of files) {
  const raw = await readFile(join(dir, f), 'utf8');
  const fm = raw.split('---')[1] ?? '';
  const get = (k) => (fm.match(new RegExp(`^${k}:\\s*"?(.*?)"?\\s*$`, 'm')) ?? [])[1] ?? '';
  const order = Number(get('order'));
  if (!order) continue;
  tags.push({
    label: `${thaiNum(String(order).padStart(2, '0'))}`,
    th: get('name_th_shrine') || get('name_th'),
    zh: get('name_zh'),
    // ?src=qr ไว้นับว่าทราฟฟิกมาจากป้ายในตำหนักจริงเท่าไร
    url: `${site.url}/33-pang/${get('slug')}?src=qr`,
  });
}
tags.push(
  { label: 'ทางเข้า', th: 'วิธีไหว้', zh: '參拜方式', url: `${site.url}/worship/how-to?src=qr` },
  { label: 'ป้ายประกาศ', th: 'ปฏิทินวันสำคัญ', zh: '節日曆', url: `${site.url}/calendar?src=qr` },
);

await mkdir(OUT, { recursive: true });

const svgFor = (t) =>
  QRCode.toString(t.url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', width: 256 });

if (svgMode) {
  for (const [i, t] of tags.entries()) {
    const name = i < files.length ? `qr-pang-${String(i + 1).padStart(2, '0')}.svg` : `qr-${t.th}.svg`;
    await writeFile(join(OUT, name), await svgFor(t), 'utf8');
  }
  console.log(`QR: เขียน ${tags.length} ไฟล์ SVG ที่ dist-qr/`);
} else {
  const cards = [];
  for (const t of tags) {
    cards.push(`  <figure class="tag">
    <div class="tag__qr">${await svgFor(t)}</div>
    <figcaption>
      <span class="tag__no">${t.label}</span>
      <span class="tag__th">${t.th}</span>
      <span class="tag__zh">${t.zh}</span>
    </figcaption>
  </figure>`);
  }
  const html = `<!doctype html>
<html lang="th"><head><meta charset="utf-8">
<title>ป้าย QR ตำหนักผู่โถวเจ้าแม่กวนอิม</title>
<style>
  @page { size: A4; margin: 12mm; }
  body { font-family: "Noto Serif Thai", "Loma", serif; margin: 0; color: #1F1A16; background: #fff; }
  h1 { font-size: 15pt; margin: 0 0 2mm; }
  .hint { font-size: 9pt; color: #5A4D44; margin: 0 0 6mm; max-width: 150mm; line-height: 1.6; }
  .sheet { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6mm; }
  .tag { margin: 0; border: 0.4mm solid #C2B29B; border-radius: 1mm; padding: 4mm 3mm 3mm;
         display: flex; flex-direction: column; align-items: center; gap: 2mm; break-inside: avoid; }
  .tag__qr { width: 30mm; height: 30mm; }
  .tag__qr svg { width: 100%; height: 100%; display: block; }
  .tag figcaption { display: flex; flex-direction: column; align-items: center; gap: 0.6mm; text-align: center; }
  .tag__no { font-family: monospace; font-size: 8pt; color: #8A6C28; letter-spacing: 0.08em; }
  .tag__th { font-size: 9.5pt; font-weight: 600; line-height: 1.25; }
  .tag__zh { font-size: 8pt; color: #5A4D44; }
  @media print { .hint, h1 { display: none; } }
</style></head>
<body>
<h1>ป้าย QR — ตำหนักผู่โถวเจ้าแม่กวนอิม</h1>
<p class="hint">ติดที่ฐานองค์แต่ละปาง ระดับสายตา ขนาดจริงอย่างน้อย ๓×๓ ซม.
พิมพ์บนอะคริลิกหรือสติกเกอร์ทองแดง · หัวเรื่องนี้จะไม่ติดไปกับงานพิมพ์
· ทดสอบสแกนทุกชิ้นก่อนติดจริง</p>
<div class="sheet">
${cards.join('\n')}
</div>
</body></html>`;
  await writeFile(join(OUT, 'qr-sheet.html'), html, 'utf8');
  console.log(`QR: เขียน dist-qr/qr-sheet.html (${tags.length} ชิ้น)`);
  console.log('เปิดในเบราว์เซอร์ › สั่งพิมพ์ › บันทึกเป็น PDF แล้วส่งโรงพิมพ์');
}
