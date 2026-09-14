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
 * คอลัมน์ที่รองรับ (แถวแรกของ Sheet ต้องเป็นชื่อคอลัมน์เหล่านี้):
 *   order, slug, name_th, name_th_shrine, name_zh, name_pinyin, name_thai_reading,
 *   name_sanskrit, enshrined, shrine_point, attributes, wishes, incense,
 *   short_prayer, prayer, sources, verified_by
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(root, 'src', 'content', 'pang');
const WISH_IDS = ['health','children','career','trade','love','travel','protection','peace'];

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
const head = rows.shift().map((h) => h.trim().toLowerCase());
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
                     'prayer','verified_by']) {
    const v = get(key);
    if (v === undefined || v === '') continue;
    setLine(key, q(v));
  }

  const enshrined = get('enshrined');
  if (enshrined) setLine('enshrined', /^(true|1|ใช่|y|yes)$/i.test(enshrined) ? 'true' : 'false');

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
    const list = wishes.split(/[,\s]+/).map((w) => w.trim()).filter(Boolean);
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
