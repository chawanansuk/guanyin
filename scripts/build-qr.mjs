#!/usr/bin/env node
/**
 * แผ่นพิมพ์ป้าย QR สำหรับติดที่ฐานองค์ ๓๓ ปาง + ป้ายทางเข้าและป้ายประกาศ
 *
 * QR ชี้ที่ slug ไม่ใช่เลขลำดับ — ถ้าตำหนักเปลี่ยนลำดับปางภายหลัง
 * ป้ายที่พิมพ์ไปแล้วจึงยังใช้ได้ ไม่ต้องพิมพ์ใหม่
 *
 *   npm run qr            → dist-qr/qr-sheet.html  แล้วเปิดในเบราว์เซอร์ › สั่งพิมพ์ › บันทึกเป็น PDF
 *   npm run qr -- --svg   → แยกเป็นไฟล์ SVG รายชิ้นสำหรับส่งโรงพิมพ์
 *   npm run qr -- --plaque → dist-qr/qr-plaques.html ป้ายตั้งขนาด A6 หน้าละหนึ่งองค์
 *                            ตัวใหญ่ อ่านได้จากระยะยืนไหว้ › สั่งพิมพ์ › บันทึกเป็น PDF
 */
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const root = fileURLToPath(new URL('..', import.meta.url));
const site = JSON.parse(await readFile(join(root, 'src', 'data', 'site.json'), 'utf8'));
const OUT = join(root, 'dist-qr');
const svgMode = process.argv.includes('--svg');
const plaqueMode = process.argv.includes('--plaque');

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
    kind: 'pang',
  });
}
tags.push(
  { label: 'ทางเข้า', th: 'วิธีไหว้', zh: '參拜方式', url: `${site.url}/worship/how-to?src=qr`, kind: 'sign',
    lead: 'สแกนดูวิธีไหว้และลำดับจุดไหว้', leadZh: '掃描查看參拜方式與順序' },
  { label: 'ป้ายประกาศ', th: 'ปฏิทินวันสำคัญ', zh: '節日曆', url: `${site.url}/calendar?src=qr`, kind: 'sign',
    lead: 'สแกนดูวันสำคัญของเจ้าแม่กวนอิม', leadZh: '掃描查看觀音節日' },
);

await mkdir(OUT, { recursive: true });

const svgFor = (t) =>
  QRCode.toString(t.url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', width: 256 });

if (plaqueMode) {
  // ป้ายตั้งหน้าองค์ — ผู้สูงวัยต้องอ่านชื่อปางได้จากระยะยืนไหว้ราวหนึ่งเมตร
  // QR ใหญ่ 52 มม. สแกนได้จากระยะเอื้อมแขนแม้แสงในตำหนักไม่มาก
  // พื้นขาว ขอบชาดขลิบทอง — QR ต้องดำบนขาวเสมอ ห้ามกลับสีหรือวางบนพื้นแดง กล้องบางรุ่นอ่านไม่ออก
  const pages = [];
  for (const t of tags) {
    const isPang = t.kind === 'pang';
    pages.push(`<section class="plaque">
  <div class="plaque__frame">
    <p class="plaque__no">${isPang ? `ปางที่ ${t.label}` : t.label}</p>
    <h1 class="plaque__zh">${t.zh}</h1>
    <p class="plaque__th">${t.th}</p>
    <div class="plaque__qr">${await svgFor(t)}</div>
    <p class="plaque__lead">${isPang ? 'สแกนเพื่ออ่านความหมายของปางนี้' : t.lead}</p>
    <p class="plaque__lead plaque__lead--zh">${isPang ? '掃描閱讀本尊法相介紹' : t.leadZh}</p>
    <p class="plaque__foot"><span>${site.name_zh}</span> · <span>${site.name_th}</span></p>
  </div>
</section>`);
  }
  const html = `<!doctype html>
<html lang="th"><head><meta charset="utf-8">
<title>ป้าย QR A6 — ${site.name_th}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@400;600;700&family=Noto+Serif+TC:wght@500;700&display=swap">
<style>
  @page { size: 105mm 148mm; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: "Noto Serif Thai", "Loma", serif; color: #241813;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .plaque { width: 105mm; height: 148mm; padding: 5mm; page-break-after: always; break-after: page; }
  .plaque:last-child { page-break-after: auto; break-after: auto; }
  .plaque__frame {
    height: 100%;
    border: 1.6mm solid #8E1C18;
    outline: 0.35mm solid #C9A04A; outline-offset: -2.6mm;
    border-radius: 1.2mm;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 6mm 7mm 5mm;
  }
  .plaque__no { margin: 0; font-size: 11pt; font-weight: 600; color: #8A6C28; letter-spacing: .04em; }
  .plaque__zh { margin: 2mm 0 0; font-family: "Noto Serif TC", "WenQuanYi Zen Hei", serif; font-weight: 700;
                font-size: 30pt; line-height: 1.15; letter-spacing: .08em; padding-left: .08em; color: #8E1C18; }
  .plaque__th { margin: 2mm 0 0; font-size: 17pt; font-weight: 700; line-height: 1.4; }
  .plaque__qr { width: 52mm; height: 52mm; margin: 5mm 0 4mm; padding: 2.5mm; background: #fff; }
  .plaque__qr svg { width: 100%; height: 100%; display: block; }
  .plaque__lead { margin: 0; font-size: 11.5pt; font-weight: 600; line-height: 1.5; }
  .plaque__lead--zh { font-family: "Noto Serif TC", "WenQuanYi Zen Hei", serif; font-weight: 500; font-size: 10pt; color: #5E4D3C; margin-top: .6mm; }
  .plaque__foot { margin: auto 0 0; padding-top: 3mm; font-size: 8.5pt; color: #7A6650; }
  .plaque__foot span:first-child { font-family: "Noto Serif TC", "WenQuanYi Zen Hei", serif; letter-spacing: .12em; }
  @media screen { body { background: #e9e2d6; } .plaque { margin: 8mm auto; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,.15); } }
</style></head>
<body>
${pages.join('\n')}
</body></html>`;
  await writeFile(join(OUT, 'qr-plaques.html'), html, 'utf8');
  console.log(`QR: เขียน dist-qr/qr-plaques.html (${tags.length} ป้าย ขนาด A6)`);
  console.log('เปิดในเบราว์เซอร์ › สั่งพิมพ์ › ขนาดกระดาษ A6 ไม่มีขอบ › บันทึกเป็น PDF แล้วส่งโรงพิมพ์');
  process.exit(0);
}

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
