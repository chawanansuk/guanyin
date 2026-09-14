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

const C = {
  plaque: '#2B1714', line: 'rgba(241,227,196,.28)',
  ink: '#F1E3C4', ink2: '#B79A6E', gold: '#D3AC61', lacquer: '#E8796A',
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
  <rect width="${W}" height="${H}" fill="${C.plaque}"/>
  <rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="${C.line}" stroke-width="2"/>
  ${hasArt ? `<g opacity=".17"><text x="${W - 96}" y="430" text-anchor="end" font-family="${ZH}" font-size="300" font-weight="700" fill="${accent}">${esc(zh[0])}</text></g>` : ''}
  ${no ? `<text x="86" y="132" font-family="monospace" font-size="34" letter-spacing="10" fill="${C.ink2}">${esc(no)}</text>` : ''}
  <text x="86" y="${no ? 268 : 250}" font-family="${TH}" font-size="76" font-weight="700" fill="${C.ink}">${esc(th)}</text>
  ${zh ? `<text x="86" y="${no ? 356 : 338}" font-family="${ZH}" font-size="54" font-weight="700" fill="${accent}">${esc(zh)}</text>` : ''}
  ${py ? `<text x="86" y="${no ? 410 : 392}" font-family="serif" font-size="30" font-style="italic" fill="${C.ink2}">${esc(py)}</text>` : ''}
  <line x1="86" y1="${H - 132}" x2="${W - 86}" y2="${H - 132}" stroke="${C.line}" stroke-width="1.5"/>
  <text x="86" y="${H - 86}" font-family="${ZH}" font-size="30" font-weight="700" letter-spacing="6" fill="${C.ink}">普陀觀音堂</text>
  <text x="86" y="${H - 48}" font-family="${TH}" font-size="25" fill="${C.ink2}">${esc(footer)}</text>
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

await writeFile(join(OUT, '.gitkeep'), '', 'utf8');
console.log(`ภาพแชร์: สร้าง ${made + 1} ไฟล์ที่ public/og/`);
console.log('ก่อนขึ้นเว็บจริง — ส่งลิงก์หน้าปางในไลน์บนมือถือ ต้องเห็นภาพนี้ ไม่ใช่กล่องเปล่า');
