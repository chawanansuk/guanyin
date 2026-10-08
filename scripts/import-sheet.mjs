#!/usr/bin/env node
/**
 * Google Sheet → src/content/pang/*.md
 *
 * ผู้รู้ของตำหนักกรอกข้อมูลใน Google Sheet (คุ้นมือกว่าการแก้ไฟล์)
 * สคริปต์นี้ตรวจความถูกต้องแล้วเขียนลงไฟล์เนื้อหา ทับเฉพาะฟิลด์ที่กรอกมา
 * ส่วนคำอธิบายยาว (เนื้อหาใต้ frontmatter) ไม่แตะ เพราะเขียนในไฟล์โดยตรง
 *
 * วิธีใช้ — ใน Sheet เลือก ไฟล์ › แชร์ › เผยแพร่ไปยังเว็บ › CSV แล้วคัดลอกลิงก์
 *   npm run import:sheet -- "https://docs.google.com/.../pub?output=csv"
 *   npm run import:sheet -- ./pang.csv          # หรือไฟล์ CSV ในเครื่อง
 *   npm run import:sheet -- ./pang.csv --dry    # ดูว่าจะเปลี่ยนอะไรบ้าง โดยยังไม่เขียน
 *
 * หัวคอลัมน์ (แถวแรก) เขียนเป็นภาษาไทยได้ ขอให้มีชื่อช่องในวงเล็บท้าย เช่น
 *   "ความสูง เซนติเมตร (height_cm)"  — สคริปต์อ่านเฉพาะชื่อในวงเล็บ
 * หัวคอลัมน์ที่ขึ้นต้น ref_ หรือเป็น notes / filled_by เป็นช่องอ้างอิง ไม่ถูกนำเข้า
 *
 * คอลัมน์ที่รองรับ:
 *   ข้อมูลปาง   order, slug, name_th, name_th_shrine, name_zh, name_pinyin,
 *               name_thai_reading, name_sanskrit, attributes, sources, verified_by
 *   องค์จริง    enshrined, shrine_point, base_label, posture, holds, base, material,
 *               height_cm, maker, donor, shrine_statue, shrine_highlight
 *   การขอพร    wishes (ชื่อไทยหรือรหัส), short_prayer, how_to_ask, prayer (ชื่อบทสวดหรือรหัส)
 *
 * แบบฟอร์มสำหรับตำหนักกรอก: ดู docs/CONTENT.md หัวข้อ "แบบฟอร์มข้อมูลองค์จริง"
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(root, 'src', 'content', 'pang');
const WISH_IDS = ['health','children','career','trade','love','travel','protection','peace'];
// ตำหนักกรอกเป็นชื่อไทยตามที่เห็นบนเว็บ ไม่ต้องจำรหัส
const WISH_TH = {
  'สุขภาพ': 'health', 'หายป่วย': 'health',
  'ขอบุตร': 'children', 'ครอบครัว': 'children',
  'การงาน': 'career', 'การศึกษา': 'career',
  'ค้าขาย': 'trade', 'โชคลาภ': 'trade',
  'ความรัก': 'love', 'คู่ครอง': 'love',
  'เดินทาง': 'travel', 'เดินทางปลอดภัย': 'travel',
  'คุ้มครอง': 'protection', 'แคล้วคลาด': 'protection',
  'คลายทุกข์': 'peace', 'จิตใจสงบ': 'peace', 'ใจสงบ': 'peace',
};
// บทสวดเลือกจากชื่อไทยในแบบฟอร์ม → รหัสหน้าในเว็บ
const PRAYER_TH = {
  'มหากรุณาธารณี': 'da-bei-zhou', '大悲咒': 'da-bei-zhou',
  'สมันตมุขปริวรรต': 'pu-men-pin', 'ผู่เหมินผิ่น': 'pu-men-pin', '普門品': 'pu-men-pin',
  'หกพยางค์': 'liu-zi-da-ming-zhou', 'โอม มณี ปัทเม หูม': 'liu-zi-da-ming-zhou', '六字大明咒': 'liu-zi-da-ming-zhou',
};
const PRAYER_IDS = new Set(Object.values(PRAYER_TH));
const NONE = /^(ไม่มี|ไม่มีเฉพาะ|-|—)$/;

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const source = args.find((a) => !a.startsWith('--'));
if (!source) {
  console.error('ต้องระบุลิงก์ CSV หรือไฟล์ CSV\n  npm run import:sheet -- "<url หรือ path>"');
  process.exit(1);
}

/** CSV ที่รองรับเครื่องหมายคำพูดและตัวขึ้นบรรทัดใหม่ในเซลล์ */
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  const src = text.replace(/\r\n?/g, '\n');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

const text = /^https?:/.test(source)
  ? await (await fetch(source)).text()
  : await readFile(source, 'utf8');

const rows = parseCsv(text);
// "ความสูง เซนติเมตร (height_cm)" → height_cm · "order" → order
const head = rows.shift().map((h) => {
  const m = h.match(/\(([a-z_]+)\)\s*$/i);
  return (m ? m[1] : h).trim().toLowerCase();
});
const idx = (k) => head.indexOf(k);

const files = (await readdir(DIR)).filter((f) => f.endsWith('.md'));
const byOrder = new Map();
for (const f of files) {
  const m = f.match(/^(\d{2})-/);
  if (m) byOrder.set(Number(m[1]), f);
}

const q = (s) => JSON.stringify(String(s ?? ''));
const problems = [];
let updated = 0;

for (const [n, row] of rows.entries()) {
  const get = (k) => { const i = idx(k); return i < 0 ? undefined : (row[i] ?? '').trim(); };
  const order = Number(get('order'));
  const line = n + 2;

  if (!order || order < 1 || order > 33) { problems.push(`แถว ${line}: order "${get('order')}" ไม่ถูกต้อง`); continue; }
  const file = byOrder.get(order);
  if (!file) { problems.push(`แถว ${line}: ไม่พบไฟล์ของปางที่ ${order}`); continue; }

  const path = join(DIR, file);
  const raw = await readFile(path, 'utf8');
  const parts = raw.split(/^---$/m);
  if (parts.length < 3) { problems.push(`${file}: รูปแบบ frontmatter ผิด`); continue; }
  let fm = parts[1];
  const body = parts.slice(2).join('---');

  const setLine = (key, value) => {
    const re = new RegExp(`^${key}:.*$`, 'm');
    if (re.test(fm)) fm = fm.replace(re, `${key}: ${value}`);
    else fm = fm.trimEnd() + `\n${key}: ${value}\n`;
  };

  for (const key of ['slug','name_th','name_th_shrine','name_zh','name_pinyin',
                     'name_thai_reading','name_sanskrit','attributes','short_prayer',
                     'verified_by',
                     // องค์จริงในตำหนัก
                     'posture','holds','base','material','maker','donor',
                     'shrine_statue','shrine_highlight','how_to_ask']) {
    const v = get(key);
    if (v === undefined || v === '') continue;
    setLine(key, q(v));
  }

  const enshrined = get('enshrined');
  if (enshrined) setLine('enshrined', /^(true|1|ใช่|มีแล้ว|y|yes)$/i.test(enshrined) ? 'true' : 'false');

  const height = get('height_cm');
  if (height) {
    const v = Number(height.replace(/[^\d.]/g, ''));
    if (!v || v > 1000) problems.push(`${file}: ความสูง "${height}" ต้องเป็นตัวเลขเซนติเมตร`);
    else setLine('height_cm', String(v));
  }

  // อักษรจีนที่ฐานองค์จริง ถ้าต่างจากชื่อจีนในตำรา เก็บเป็นชื่ออื่นที่พบ เพื่อให้ค้นด้วยชื่อบนฐานก็เจอ
  const label = get('base_label');
  if (label) {
    const zh = (fm.match(/^name_zh:\s*"?(.*?)"?\s*$/m) ?? [])[1] ?? '';
    const cur = JSON.parse((fm.match(/^name_zh_variants:\s*(\[.*\])\s*$/m) ?? [])[1] ?? '[]');
    if (label !== zh && !cur.includes(label)) setLine('name_zh_variants', JSON.stringify([...cur, label]));
  }

  const prayer = get('prayer');
  if (prayer) {
    const id = NONE.test(prayer) ? '' : (PRAYER_TH[prayer] ?? prayer);
    if (id && !PRAYER_IDS.has(id)) problems.push(`${file}: ไม่รู้จักบทสวด "${prayer}"`);
    else setLine('prayer', q(id));
  }

  const point = get('shrine_point');
  if (point) setLine('shrine_point', Number(point) || 'null');

  const incense = get('incense');
  if (incense) {
    const v = Number(incense);
    if (!v || v < 1 || v > 9) problems.push(`${file}: incense "${incense}" ต้องเป็น 1–9`);
    else setLine('incense', String(v));
  }

  const wishes = get('wishes');
  if (wishes) {
    const list = [...new Set(wishes.split(/[,\s·、]+/).map((w) => w.trim()).filter(Boolean)
      .map((w) => WISH_TH[w] ?? w))];
    const bad = list.filter((w) => !WISH_IDS.includes(w));
    if (bad.length) problems.push(`${file}: หมวดพรไม่รู้จัก — ${bad.join(', ')}`);
    else if (list.length < 1 || list.length > 3) problems.push(`${file}: หมวดพรต้องมี 1–3 หมวด (ได้ ${list.length})`);
    else setLine('wishes', `[${list.join(', ')}]`);
  }

  const sources = get('sources');
  if (sources) {
    const list = sources.split('|').map((s) => s.trim()).filter(Boolean);
    setLine('sources', `[${list.map(q).join(', ')}]`);
  }

  const next = `---${fm}---${body}`;
  if (next !== raw) {
    if (!dry) await writeFile(path, next, 'utf8');
    updated++;
    console.log(`${dry ? '[ดูเฉย ๆ] ' : ''}อัปเดต ${file}`);
  }
}

if (problems.length) {
  console.error('\nพบปัญหา — ไม่ได้แก้แถวเหล่านี้:');
  for (const p of problems) console.error('  ! ' + p);
}
console.log(`\nอ่าน ${rows.length} แถว, เปลี่ยน ${updated} ไฟล์${dry ? ' (ยังไม่เขียนจริง)' : ''}`);
if (problems.length) process.exit(1);
