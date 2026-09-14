#!/usr/bin/env node
/**
 * ต้นฉบับหนังสือ → ข้อมูลเว็บ
 *
 *   content-src/guanyin-33-pang-th-v3.md
 *     ├→ src/content/pang/*.md       (frontmatter: ชื่อ ลักษณะเด่น แก่นของปาง)
 *     └→ src/content/pang-full/*.md  (บทเต็ม พร้อมเชิงอรรถของบทนั้น)
 *
 * รันซ้ำได้เสมอ — ทับเฉพาะช่องที่หนังสือเป็นเจ้าของ
 * ช่องที่ตำหนักเป็นเจ้าของ (name_th_shrine, enshrined, incense, wishes, verified_by)
 * ไม่ถูกแตะ เพราะหนังสือไม่ใช่ผู้รู้เรื่ององค์ที่ประดิษฐานอยู่จริงในตำหนักนี้
 *
 *   npm run import:book
 */
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const BOOK = join(root, 'content-src', 'guanyin-33-pang-th-v3.md');
const PANG = join(root, 'src', 'content', 'pang');
const FULL = join(root, 'src', 'content', 'pang-full');
const BOOK_REF = '«เจ้าแม่กวนอิม ๓๓ ปาง» ฉบับ v3 (14 ก.ย. 2569)';

const src = await readFile(BOOK, 'utf8');
const lines = src.split('\n');
const q = (s) => JSON.stringify(String(s ?? ''));

// ---------- ตารางเทียบชื่อ: ลำดับ | จีน | ไทยในเล่ม | ไทยสายแปลศัพท์ธรรม ----------
const names = new Map();
let inNames = false;
for (const l of lines) {
  // อ่านเฉพาะตารางใต้หัวข้อนี้ — ในเล่มมีตารางอื่นที่หน้าตาใกล้เคียงกัน
  if (l.startsWith('### ชื่อไทยมาจากสองสำนัก')) { inNames = true; continue; }
  if (inNames && /^#{2,3} /.test(l)) break;
  if (!inNames) continue;
  const m = l.match(/^\|\s*(\d{1,2})\s*\|\s*([^|]*觀音[^|]*)\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/);
  if (!m) continue;
  const [, n, zhRaw, th, scholarly] = m;
  const zhAll = zhRaw.trim().split('／').map((z) => z.trim()).filter(Boolean);
  names.set(Number(n), { zh: zhAll[0], zhVariants: zhAll.slice(1), th: th.trim(), scholarly: scholarly.trim() });
}

// ---------- ตารางสรุป: ลำดับ | ปาง | เครื่องหมายที่ใช้จำ | แก่นของปาง ----------
const summary = new Map();
let inSummary = false;
for (const l of lines) {
  if (l.startsWith('## ตารางสรุป')) { inSummary = true; continue; }
  if (inSummary && l.startsWith('## ')) break;
  if (!inSummary) continue;
  const m = l.match(/^\|\s*(\d{1,2})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/);
  if (m) summary.set(Number(m[1]), { marks: m[3].trim(), essence: m[4].trim() });
}

// ---------- นิยามเชิงอรรถท้ายเล่ม ----------
const footnotes = new Map();
for (const m of src.matchAll(/^\[\^([a-zA-Z0-9_-]+)\]:\s*([\s\S]*?)(?=\n\n|\n\[\^|$)/gm)) {
  footnotes.set(m[1], m[2].trim().replace(/\n\s+/g, ' '));
}

// ---------- ตัดบททั้ง ๓๓ ----------
const chapterStarts = [];
lines.forEach((l, i) => {
  const m = l.match(/^## (\d{2}) (.+?) — (.+)$/);
  if (m) chapterStarts.push({ i, order: Number(m[1]), heading: l });
});
const endOfChapters = lines.findIndex((l) => l.startsWith('## ภาคผนวก ก'));

// ---------- จับคู่ลำดับกับ slug จากไฟล์ที่มีอยู่ ----------
const files = (await readdir(PANG)).filter((f) => f.endsWith('.md')).sort();
const slugByOrder = new Map();
for (const f of files) {
  const m = f.match(/^(\d{2})-(.+)\.md$/);
  if (m) slugByOrder.set(Number(m[1]), m[2]);
}

await mkdir(FULL, { recursive: true });
let wroteFull = 0, patched = 0;
const problems = [];

for (const [idx, ch] of chapterStarts.entries()) {
  const order = ch.order;
  const slug = slugByOrder.get(order);
  const name = names.get(order);
  const sum = summary.get(order);
  if (!slug) { problems.push(`ปางที่ ${order}: ไม่พบไฟล์ใน src/content/pang`); continue; }
  if (!name) { problems.push(`ปางที่ ${order}: ไม่พบในตารางเทียบชื่อ`); continue; }
  if (!sum) { problems.push(`ปางที่ ${order}: ไม่พบในตารางสรุป`); continue; }

  // หัวบทบางบทระบุรูปอักษรทางเลือกไว้ด้วย (เช่น 岩戶／巖戶) เก็บรวมกับที่ได้จากตารางเทียบชื่อ
  const headZh = (ch.heading.split(' — ')[1] ?? '').split('／').map((z) => z.trim()).filter(Boolean);
  const zhVariants = [...new Set([...name.zhVariants, ...headZh.filter((z) => z !== name.zh)])];

  const stop = idx + 1 < chapterStarts.length ? chapterStarts[idx + 1].i : endOfChapters;
  const body = lines.slice(ch.i + 1, stop).join('\n').trim();

  // เชิงอรรถที่บทนี้ใช้จริง ยกนิยามมาท้ายบท เพื่อให้หน้าเว็บอ้างอิงได้ครบในตัวเอง
  const used = [...new Set([...body.matchAll(/\[\^([a-zA-Z0-9_-]+)\]/g)].map((m) => m[1]))];
  const notes = used.filter((k) => footnotes.has(k))
    .map((k) => `[^${k}]: ${footnotes.get(k)}`).join('\n\n');

  const pad = String(order).padStart(2, '0');

  // ---- บทเต็ม ----
  await writeFile(join(FULL, `${pad}-${slug}.md`), `---
order: ${order}
slug: ${slug}
title: ${q(`${name.th} ${name.zh}`)}
source: ${q(BOOK_REF)}
words: ${body.split(/\s+/).length}
---

${body}

${notes ? `\n---\n\n### แหล่งอ้างอิงของบทนี้\n\n${notes}\n` : ''}`, 'utf8');
  wroteFull++;

  // ---- อัปเดต frontmatter ของหน้าปางย่อ ----
  const path = join(PANG, `${pad}-${slug}.md`);
  const raw = await readFile(path, 'utf8');
  const parts = raw.split(/^---$/m);
  if (parts.length < 3) { problems.push(`${pad}-${slug}.md: frontmatter ผิดรูป`); continue; }
  let fm = parts[1];
  const set = (k, v) => {
    const re = new RegExp(`^${k}:.*$`, 'm');
    fm = re.test(fm) ? fm.replace(re, `${k}: ${v}`) : fm.trimEnd() + `\n${k}: ${v}\n`;
  };

  set('name_th', q(name.th));
  set('name_th_scholarly', q(name.scholarly));
  set('name_zh', q(name.zh));
  set('name_zh_variants', `[${zhVariants.map(q).join(', ')}]`);
  set('attributes', q(sum.marks));
  set('essence', q(sum.essence));
  set('source_doc', q(BOOK_REF));
  set('has_full', 'true');
  // อ้างอิงจริงอยู่ท้ายบทเต็ม หน้าย่อจึงไม่อ้างพระสูตรเจาะจง เพื่อไม่ให้เป็นการอ้างเกินหลักฐาน
  set('sources', '[]');

  // เนื้อหาย่อ: ย่อหน้าแรกที่มีสาระของบท ตัดเชิงอรรถออกเพราะหน้าย่อไม่แสดงอ้างอิง
  const firstParas = body
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#') && !l.startsWith('|') && !l.startsWith('**แก่นของปาง'))
    .slice(0, 2)
    .join('\n\n')
    .replace(/\[\^[a-zA-Z0-9_-]+\]/g, '');

  await writeFile(path, `---${fm}---\n\n${firstParas}\n`, 'utf8');
  patched++;
}

console.log(`บทเต็ม: เขียน ${wroteFull} ไฟล์`);
console.log(`หน้าปางย่อ: อัปเดต ${patched} ไฟล์`);
console.log(`เชิงอรรถที่อ่านได้จากท้ายเล่ม: ${footnotes.size} รายการ`);
if (problems.length) {
  console.error('\nพบปัญหา:');
  for (const p of problems) console.error('  ! ' + p);
  process.exit(1);
}
