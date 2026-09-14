#!/usr/bin/env node
/**
 * สร้างภาพพรีวิวตอนแชร์ (Open Graph) 1200×630 — หน้าปางละ ๑ ภาพ + ภาพรวมของเว็บ
 *
 * ไลน์คือช่องทางที่คนไทยส่งต่อกันมากที่สุด ถ้าไม่มีภาพพรีวิวเฉพาะหน้า
 * ลิงก์ที่ส่งไปจะขึ้นเป็นกล่องเปล่าหรือโลโก้ซ้ำ ๆ กันทุกหน้า
 *
 *   npm run og
 *
 * ต้องมีฟอนต์ไทยและฟอนต์จีนตัวเต็มติดตั้งในเครื่องที่รัน (ดู REQUIRED_FONTS)
 * ถ้าไม่มี ตัวอักษรจะกลายเป็นกล่องสี่เหลี่ยม — สคริปต์จะเตือนก่อน
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(root, 'public', 'og');
const W = 1200, H = 630;

// ชุดเดียวกับฮีโร่ของเว็บ: รักแดงเข้ม ตัวอักษรทองโลหะ
const C = {
  plaque: '#2A1015', plaque2: '#0F0608', line: 'rgba(242,220,166,.34)',
  ink: '#F7F3EC', ink2: '#C0A98D', gold: '#D8A93F', pale: '#F2DCA6',
};
// ระบุหลายตัวเพราะแต่ละเครื่อง/แต่ละ CI มีฟอนต์ไม่เหมือนกัน
const TH = 'Noto Serif Thai, Noto Sans Thai, Loma, Garuda, TH Sarabun New, sans-serif';
const ZH = 'Noto Serif TC, Noto Sans CJK TC, WenQuanYi Zen Hei, Source Han Serif TC, serif';

let sharp;
try { ({ default: sharp } = await import('sharp')); }
catch { console.error('ไม่พบ sharp — รัน npm install ก่อน'); process.exit(1); }

// เตือนล่วงหน้าถ้าเครื่องนี้ไม่มีฟอนต์ที่ต้องใช้
try {
  const fonts = execSync('fc-list : family', { encoding: 'utf8' });
  const hasTh = /Thai|Loma|Garuda|Sarabun/i.test(fonts);
  const hasZh = /CJK|WenQuanYi|Han|Hei|Ming/i.test(fonts);
  if (!hasTh) console.warn('! ไม่พบฟอนต์ไทยในเครื่องนี้ — ตัวหนังสือไทยจะขึ้นเป็นกล่อง');
  if (!hasZh) console.warn('! ไม่พบฟอนต์จีนในเครื่องนี้ — ตัวหนังสือจีนจะขึ้นเป็นกล่อง');
} catch { /* ไม่มี fc-list ก็ปล่อยผ่าน */ }

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const THAI_DIGITS = ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'];
const thaiNum = (n) => String(n).replace(/\d/g, (d) => THAI_DIGITS[+d]);

function card({ no, th, zh, py, footer, accent = C.gold }) {
  const hasArt = Boolean(zh);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.plaque}"/><stop offset="100%" stop-color="${C.plaque2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="24%" cy="10%" r="62%">
      <stop offset="0%" stop-color="rgba(216,169,63,.20)"/><stop offset="100%" stop-color="rgba(216,169,63,0)"/>
    </radialGradient>
    <!-- ทองโลหะเจ็ดจุดสี ชุดเดียวกับที่ใช้ในเว็บ -->
    <linearGradient id="foil" x1="0" y1="0" x2="1" y2="0.25">
      <stop offset="0%" stop-color="#8A6A1E"/>
      <stop offset="22%" stop-color="#D8A93F"/>
      <stop offset="38%" stop-color="#FBF3C4"/>
      <stop offset="52%" stop-color="#C99B34"/>
      <stop offset="68%" stop-color="#F2DCA6"/>
      <stop offset="85%" stop-color="#A87F22"/>
      <stop offset="100%" stop-color="#D8A93F"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${hasArt ? `<g opacity=".10"><text x="${W - 76}" y="452" text-anchor="end" font-family="${ZH}" font-size="330" font-weight="700" fill="${C.gold}">${esc(zh[0])}</text></g>` : ''}
  <rect x="30" y="30" width="${W - 60}" height="${H - 60}" fill="none" stroke="${C.line}" stroke-width="1.5"/>
  <rect x="39" y="39" width="${W - 78}" height="${H - 78}" fill="none" stroke="${C.line}" stroke-width="0.8" opacity=".55"/>
  ${no ? `<text x="84" y="136" font-family="${TH}" font-size="26" letter-spacing="7" fill="${C.gold}">${esc(no)}</text>` : ''}
  <text x="84" y="${no ? 278 : 262}" font-family="${TH}" font-size="74" font-weight="600" fill="${C.ink}">${esc(th)}</text>
  ${zh ? `<text x="84" y="${no ? 372 : 356}" font-family="${ZH}" font-size="58" font-weight="700" fill="url(#foil)">${esc(zh)}</text>` : ''}
  ${py ? `<text x="84" y="${no ? 424 : 408}" font-family="serif" font-size="28" font-style="italic" fill="${C.ink2}">${esc(py)}</text>` : ''}
  <line x1="84" y1="${H - 134}" x2="${W - 84}" y2="${H - 134}" stroke="${C.line}" stroke-width="1"/>
  <text x="84" y="${H - 88}" font-family="${ZH}" font-size="30" font-weight="700" letter-spacing="7" fill="url(#foil)">普陀觀音堂</text>
  <text x="84" y="${H - 48}" font-family="${TH}" font-size="24" fill="${C.ink2}">${esc(footer)}</text>
</svg>`;
}

await mkdir(OUT, { recursive: true });
const render = async (svg, file) => {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(join(OUT, file));
};

// ภาพรวมของเว็บ
await render(card({
  th: 'ตำหนักผู่โถวเจ้าแม่กวนอิม',
  zh: '普陀觀音堂',
  py: 'Putuo Guanyin Shrine',
  footer: 'เจ้าแม่กวนอิม ๓๓ ปาง · ถนนพุทธมณฑลสาย ๒',
}), 'default.png');

// หน้าปางละหนึ่งภาพ
const pangDir = join(root, 'src', 'content', 'pang');
const { readdir } = await import('node:fs/promises');
const files = existsSync(pangDir)
  ? (await readdir(pangDir)).filter((f) => f.endsWith('.md')).sort()
  : [];

let made = 0;
for (const f of files) {
  const raw = await readFile(join(pangDir, f), 'utf8');
  const fm = raw.split('---')[1] ?? '';
  const get = (k) => (fm.match(new RegExp(`^${k}:\\s*"?(.*?)"?\\s*$`, 'm')) ?? [])[1] ?? '';
  const order = Number(get('order'));
  if (!order) continue;
  const shrine = get('name_th_shrine');
  await render(card({
    no: `${thaiNum(String(order).padStart(2, '0'))} / ๓๓`,
    th: shrine || get('name_th'),
    zh: get('name_zh'),
    py: get('name_pinyin'),
    footer: 'ตำหนักผู่โถวเจ้าแม่กวนอิม · พุทธมณฑลสาย ๒',
    accent: get('enshrined') === 'false' ? C.ink2 : C.gold,
  }), `pang-${String(order).padStart(2, '0')}.png`);
  made++;
}

// ภาพปกวิดีโอ — ใช้การ์ดชุดเดียวกัน จะได้กลมกลืนกับทั้งเว็บ
const VID = join(root, 'public', 'video');
await mkdir(VID, { recursive: true });
await sharp(Buffer.from(card({
  th: 'ตำหนักผู่โถวเจ้าแม่กวนอิม',
  zh: '普陀觀音堂',
  py: 'กดเพื่อเล่นวิดีโอ',
  footer: 'ถนนพุทธมณฑลสาย ๒',
})))
  .resize(1280, 720, { fit: 'cover' })
  .png({ compressionLevel: 9 })
  .toFile(join(VID, 'poster.png'));

await writeFile(join(OUT, '.gitkeep'), '', 'utf8');
console.log(`ภาพแชร์: สร้าง ${made + 1} ไฟล์ที่ public/og/`);
console.log('ก่อนขึ้นเว็บจริง — ส่งลิงก์หน้าปางในไลน์บนมือถือ ต้องเห็นภาพนี้ ไม่ใช่กล่องเปล่า');
