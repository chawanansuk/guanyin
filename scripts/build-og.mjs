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

// ชุดเดียวกับเว็บ: ผนังปูนขาว ป้ายชาด ตัวอักษรทอง
const C = {
  bg: '#FDFAF4', bg2: '#F3E7D0',
  line: 'rgba(134,99,18,.34)', rule: 'rgba(134,99,18,.22)',
  ink: '#241813', ink2: '#7A6650',
  gold: '#866312', goldBright: '#D8A93F', pale: '#F6E3B0',
  plaque: '#A0201C', plaque2: '#7C1512',
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

/** ความกว้างโดยประมาณของข้อความต่อ ๑ หน่วย font-size
 *  ใช้กะขนาดให้พอดีช่อง ไม่ใช่ค่าที่แม่นยำ — แค่กันไม่ให้ชื่อยาวล้นไปทับภาพ
 *  (วัดจากการเรนเดอร์จริงด้วยฟอนต์ Noto Serif Thai / Noto Serif TC) */
const advance = (ch) => {
  const c = ch.codePointAt(0);
  if (c >= 0x0e30 && c <= 0x0e4e && ![0x0e30, 0x0e32, 0x0e33, 0x0e40, 0x0e41, 0x0e42, 0x0e43, 0x0e44].includes(c)) return 0; // สระบน–ล่าง วรรณยุกต์ ไม่กินความกว้าง
  if (c >= 0x0e00 && c <= 0x0e7f) return 0.52;   // ไทย
  if (c >= 0x3000) return 1.05;                   // จีน
  return 0.5;                                     // ละติน
};
const fitSize = (text, maxW, base) => {
  const units = [...String(text)].reduce((a, ch) => a + advance(ch), 0) || 1;
  return Math.min(base, Math.floor((maxW / units) * 10) / 10);
};

function card({ no, th, zh, py, footer, accent = C.gold, photo = null, photoNote = null }) {
  // มีภาพจริงเมื่อไร ให้ภาพทำหน้าที่แทนตัวอักษรจีนจาง ๆ ที่เคยใช้เป็นลาย
  const hasArt = Boolean(zh) && !photo;
  const PW = 470;              // ความกว้างช่องภาพด้านขวา
  const PX = W - PW;           // ขอบซ้ายของช่องภาพ
  const textRight = photo ? PX - 44 : W - 84;
  const textW = textRight - 84;
  const thSize = fitSize(th, textW, 74);
  const zhSize = fitSize(zh, textW, 58);
  const pySize = fitSize(py, textW, 28);
  const ftSize = fitSize(footer, textW, 24);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="${C.bg}"/><stop offset="100%" stop-color="${C.bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="22%" cy="8%" r="64%">
      <stop offset="0%" stop-color="rgba(255,255,255,.85)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <linearGradient id="plaque" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.plaque}"/><stop offset="100%" stop-color="${C.plaque2}"/>
    </linearGradient>
    <!-- ทองโลหะเจ็ดจุดสี ชุดเดียวกับที่ใช้ในเว็บ -->
    <!-- ทองบนป้ายชาด ทุกจุดสีต้องสว่าง จุดสีเข้มจะจมหายไปกับพื้นแดง -->
    <linearGradient id="foil" x1="0" y1="0" x2="1" y2="0.25">
      <stop offset="0%" stop-color="#D8A93F"/>
      <stop offset="18%" stop-color="#F2DCA6"/>
      <stop offset="34%" stop-color="#FFF8DE"/>
      <stop offset="50%" stop-color="#E4C070"/>
      <stop offset="66%" stop-color="#FBF3C4"/>
      <stop offset="84%" stop-color="#D2A340"/>
      <stop offset="100%" stop-color="#F2DCA6"/>
    </linearGradient>
    <!-- ขอบซ้ายของภาพต้องจมเข้าพื้นผนัง ไม่งั้นจะเห็นเป็นภาพแปะทับการ์ด -->
    <linearGradient id="seam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.bg2}"/>
      <stop offset="100%" stop-color="rgba(243,231,208,0)"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${hasArt ? `<g opacity=".07"><text x="${W - 76}" y="452" text-anchor="end" font-family="${ZH}" font-size="330" font-weight="700" fill="${C.plaque}">${esc(zh[0])}</text></g>` : ''}
  ${photo ? `<clipPath id="pane"><rect x="${PX}" y="0" width="${PW}" height="${H}"/></clipPath>
  <image clip-path="url(#pane)" x="${PX}" y="0" width="${PW}" height="${H}"
         preserveAspectRatio="xMidYMid slice" href="${photo}"/>
  <rect x="${PX}" y="0" width="180" height="${H}" fill="url(#seam)"/>
  <rect x="${PX}" y="0" width="1.5" height="${H}" fill="${C.line}"/>
  ${photoNote ? `<rect x="${PX}" y="${H - 52}" width="${PW}" height="52" fill="rgba(11,7,8,.84)"/>
  <text x="${PX + PW / 2}" y="${H - 20}" text-anchor="middle" font-family="${TH}" font-size="21" fill="${C.pale}">${esc(photoNote)}</text>` : ''}` : ''}
  <rect x="30" y="30" width="${W - 60}" height="${H - 60}" fill="none" stroke="${C.line}" stroke-width="1.5"/>
  <rect x="39" y="39" width="${W - 78}" height="${H - 78}" fill="none" stroke="${C.line}" stroke-width="0.8" opacity=".55"/>
  ${no ? `<text x="84" y="136" font-family="${TH}" font-size="26" letter-spacing="7" fill="${C.gold}">${esc(no)}</text>` : ''}
  <text x="84" y="${no ? 278 : 262}" font-family="${TH}" font-size="${thSize}" font-weight="600" fill="${C.ink}">${esc(th)}</text>
  ${zh ? `<text x="84" y="${no ? 372 : 356}" font-family="${ZH}" font-size="${zhSize}" font-weight="700" fill="${C.plaque}">${esc(zh)}</text>` : ''}
  ${py ? `<text x="84" y="${no ? 424 : 408}" font-family="serif" font-size="${pySize}" font-style="italic" fill="${C.ink2}">${esc(py)}</text>` : ''}
  <!-- ชื่อตำหนักอยู่บนป้ายชาดเล็ก ๆ แทนตัวหนังสือลอย
       เป็นที่เดียวในการ์ดที่ทองอ่านออก และซ้ำรูปป้ายจริงบนอาคาร -->
  <rect x="84" y="${H - 132}" width="248" height="60" rx="2" fill="url(#plaque)" stroke="${C.goldBright}" stroke-width="1.5"/>
  <rect x="89" y="${H - 127}" width="238" height="50" rx="1" fill="none" stroke="rgba(246,227,176,.38)" stroke-width="0.8"/>
  <text x="208" y="${H - 92}" text-anchor="middle" font-family="${ZH}" font-size="27" font-weight="700" letter-spacing="6" fill="url(#foil)">普陀觀音堂</text>
  <text x="352" y="${H - 95}" font-family="${TH}" font-size="${Math.min(ftSize, 22)}" fill="${C.ink2}">${esc(footer)}</text>
</svg>`;
}

await mkdir(OUT, { recursive: true });

// ภาพหน้าอาคาร ถ้ามีในคลังจะถูกฝังลงการ์ดแชร์และภาพปกวิดีโอ
// ไลน์กับเฟซบุ๊กดึงเฉพาะภาพนี้ไปแสดง คนส่วนใหญ่เห็นภาพนี้ก่อนเห็นเว็บ
const FACADE = join(root, 'public', 'images', 'pang', 'shrine-exterior-1086.webp');
let facadeUri = null;
if (existsSync(FACADE)) {
  const jpg = await sharp(FACADE).jpeg({ quality: 86 }).toBuffer();
  facadeUri = `data:image/jpeg;base64,${jpg.toString('base64')}`;
} else {
  console.warn('! ยังไม่มีภาพหน้าอาคาร — การ์ดแชร์จะใช้ลายตัวอักษรจีนแทน (รัน npm run images ก่อน)');
}

const render = async (svg, file) => {
  const img = sharp(Buffer.from(svg));
  // การ์ดที่มีภาพถ่ายอยู่ข้างในเก็บเป็น PNG แล้วจะโตเป็นเมกะไบต์
  // ไลน์กับเฟซบุ๊กข้ามภาพพรีวิวที่ใหญ่เกินไป — หน้านั้นจะกลายเป็นกล่องเปล่า
  await (file.endsWith('.jpg')
    ? img.jpeg({ quality: 84, chromaSubsampling: '4:4:4' })
    : img.png({ compressionLevel: 9 })
  ).toFile(join(OUT, file));
};

// ภาพรวมของเว็บ
await render(card({
  th: 'ตำหนักผู่โถวเจ้าแม่กวนอิม',
  zh: '普陀觀音堂',
  py: 'Putuo Guanyin Shrine',
  footer: 'เจ้าแม่กวนอิม ๓๓ ปาง · ถนนพุทธมณฑลสาย ๒',
  photo: facadeUri,
}), 'default.jpg');

// หน้าปางละหนึ่งภาพ
const pangDir = join(root, 'src', 'content', 'pang');
const { readdir } = await import('node:fs/promises');
const files = existsSync(pangDir)
  ? (await readdir(pangDir)).filter((f) => f.endsWith('.md')).sort()
  : [];

const photoW = Object.fromEntries(Object.entries(JSON.parse(await readFile(join(root, 'src', 'data', 'photos.json'), 'utf8')).images).map(([k, v]) => [k, v.widths]));
const ART = JSON.parse(await readFile(join(root, 'src', 'data', 'photo-meta.json'), 'utf8')).illustrations;

let made = 0;
for (const f of files) {
  const raw = await readFile(join(pangDir, f), 'utf8');
  const fm = raw.split('---')[1] ?? '';
  const get = (k) => (fm.match(new RegExp(`^${k}:\\s*"?(.*?)"?\\s*$`, 'm')) ?? [])[1] ?? '';
  const order = Number(get('order'));
  if (!order) continue;
  const shrine = get('name_th_shrine');
  // ภาพองค์ในการ์ดแชร์ — ถ้าเป็นภาพประกอบต้องเขียนกำกับไว้ในภาพด้วย
  // เพราะการ์ดที่ส่งต่อในไลน์จะหลุดจากหน้าเว็บที่มีคำอธิบายอยู่
  const key = get('photo') || `pang-${String(order).padStart(2, '0')}`;
  const src = join(root, 'public', 'images', 'pang', `${key}-${(photoW[key] ?? [])[(photoW[key] ?? []).length - 1]}.webp`);
  let pangUri = null;
  if (photoW[key] && existsSync(src)) {
    const jpg = await sharp(src).jpeg({ quality: 88 }).toBuffer();
    pangUri = `data:image/jpeg;base64,${jpg.toString('base64')}`;
  }
  await render(card({
    no: `${thaiNum(String(order).padStart(2, '0'))} / ๓๓`,
    th: shrine || get('name_th'),
    zh: get('name_zh'),
    py: get('name_pinyin'),
    footer: 'ตำหนักผู่โถวเจ้าแม่กวนอิม · พุทธมณฑลสาย ๒',
    accent: get('enshrined') === 'false' ? C.ink2 : C.gold,
    photo: pangUri,
    photoNote: pangUri && ART.includes(key) ? 'ภาพประกอบ ไม่ใช่องค์จริงในตำหนัก' : null,
  }), `pang-${String(order).padStart(2, '0')}.jpg`);
  made++;
}

// ภาพปกวิดีโอไม่ได้สร้างที่นี่แล้ว — build-video.mjs ตัดเฟรมแรกของคลิปจริงมาใช้
// ซึ่งตรงสัดส่วนกับวิดีโอเสมอ ต่างจากการ์ดที่เคยใช้ซึ่งเป็น 16:9 ตายตัว

// ไอคอนสำหรับ "เพิ่มลงหน้าจอโฮม" บนไอโฟน — ซาฟารีไม่รับ favicon.svg
// ถ้าไม่มีไฟล์นี้ ไอคอนบนหน้าจอโฮมจะกลายเป็นภาพหน้าจอของเว็บ
const favicon = join(root, 'public', 'favicon.svg');
if (existsSync(favicon)) {
  await sharp(await readFile(favicon), { density: 384 })
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toFile(join(root, 'public', 'apple-touch-icon.png'));
}

await writeFile(join(OUT, '.gitkeep'), '', 'utf8');
console.log(`ภาพแชร์: สร้าง ${made + 1} ไฟล์ที่ public/og/`);
console.log('ก่อนขึ้นเว็บจริง — ส่งลิงก์หน้าปางในไลน์บนมือถือ ต้องเห็นภาพนี้ ไม่ใช่กล่องเปล่า');
