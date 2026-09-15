#!/usr/bin/env node
/**
 * นำเนื้อหาจากต้นฉบับหนังสือเข้าคอลเลกชันของเว็บ
 *
 *   npm run import:book
 *
 * ต้นฉบับ: content-src/guanyin-33-pang-th-v4.md — ฉบับเรียบเรียงใหม่ให้อ่านง่าย
 * โครงของทุกบทเหมือนกันหมด สคริปต์จึงอ่านตามหัวข้อได้ตรง ๆ
 *
 *   ## ปางที่ N · ชื่อไทย
 *   **漢字** · จีนกลาง: … · ญี่ปุ่น: …
 *   > *ประโยคเปิดบท*
 *   **รูปลักษณ์:** …
 *   ### เรื่องราวความเป็นมา
 *   ### ความหมายในชีวิตวันนี้
 *   ### คีย์พอยท์   (รายการ bullet)
 *
 * สำคัญ: สคริปต์เขียนทับเฉพาะ "ช่องที่เป็นของหนังสือ" เท่านั้น
 * ช่องที่เป็นของตำหนัก — name_th_shrine, enshrined, shrine_point, incense,
 * wishes, short_prayer, photo, verified_by — ไม่แตะเด็ดขาด
 * เพราะเป็นข้อมูลที่ตำหนักยืนยันเอง ไม่ได้มาจากหนังสือ
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const BOOK = join(root, 'content-src', 'guanyin-33-pang-th-v4.md');
const PANG = join(root, 'src', 'content', 'pang');
const FULL = join(root, 'src', 'content', 'pang-full');
const BOOK_REF = '«ประวัติเจ้าแม่กวนอิม ๓๓ ปาง» ฉบับเรียบเรียงใหม่';

const src = await readFile(BOOK, 'utf8');
const q = (s) => JSON.stringify(String(s ?? ''));

// ---------- สารบัญ: ลำดับ | ชื่อไทย | ชื่อจีน | แก่นความหมายสั้น ----------
const toc = new Map();
{
  const table = src.slice(src.indexOf('## สารบัญ 33 ปาง'), src.indexOf('## ปางที่ 1 '));
  for (const line of table.split('\n')) {
    const m = line.match(/^\|\s*(\d{1,2})\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/);
    if (m) toc.set(Number(m[1]), { name_th: m[2], name_zh: m[3], tagline: m[4] });
  }
}
if (toc.size !== 33) throw new Error(`สารบัญอ่านได้ ${toc.size} แถว ควรเป็น 33`);

// ---------- ตัดบททั้ง ๓๓ ----------
const lines = src.split('\n');
const starts = [];
lines.forEach((l, i) => { if (/^## ปางที่ \d+ · /.test(l)) starts.push(i); });
const endOfChapters = lines.findIndex((l) => l.startsWith('## บทส่งท้าย'));

/** ตัดเส้นคั่น --- ท้ายบท และช่องว่างส่วนเกิน */
const tidy = (s) => s.replace(/\n---\s*$/, '').replace(/\n{3,}/g, '\n\n').trim();

const chapters = starts.map((start, i) => {
  const end = i + 1 < starts.length ? starts[i + 1] : endOfChapters;
  const block = lines.slice(start, end);
  const order = Number(block[0].match(/^## ปางที่ (\d+)/)[1]);

  const head = block.find((l) => /^\*\*[一-鿿]+\*\* · จีนกลาง:/.test(l)) ?? '';
  const name_zh = (head.match(/^\*\*([一-鿿]+)\*\*/) ?? [])[1] ?? '';
  const reading = (head.match(/จีนกลาง:\s*([^·]+)/) ?? [])[1]?.trim() ?? '';
  const japanese = (head.match(/ญี่ปุ่น:\s*(.+)$/) ?? [])[1]?.trim() ?? '';

  const epigraph = (block.find((l) => /^> \*/.test(l)) ?? '').replace(/^> \*|\*$/g, '').trim();
  const attributes = (block.find((l) => l.startsWith('**รูปลักษณ์:**')) ?? '')
    .replace('**รูปลักษณ์:**', '').trim();

  const at = (h) => block.findIndex((l) => l.trim() === h);
  const iStory = at('### เรื่องราวความเป็นมา');
  const iToday = at('### ความหมายในชีวิตวันนี้');
  const iKeys = at('### คีย์พอยท์');
  if (iStory < 0 || iToday < 0 || iKeys < 0) throw new Error(`ปางที่ ${order}: หัวข้อไม่ครบ`);

  const story = tidy(block.slice(iStory + 1, iToday).join('\n'));
  const today = tidy(block.slice(iToday + 1, iKeys).join('\n'));
  const keypoints = block.slice(iKeys + 1)
    .filter((l) => l.startsWith('- '))
    .map((l) => l.slice(2).trim())
    .filter(Boolean);

  return { order, name_zh, reading, japanese, epigraph, attributes, story, today, keypoints };
});

// ---------- จับคู่ลำดับกับ slug จากไฟล์ที่มีอยู่ ----------
const files = (await readdir(PANG)).filter((f) => f.endsWith('.md')).sort();
const byOrder = new Map();
for (const f of files) {
  const raw = await readFile(join(PANG, f), 'utf8');
  const order = Number((raw.match(/^order:\s*(\d+)/m) ?? [])[1]);
  const slug = (raw.match(/^slug:\s*"?([a-z0-9-]+)"?/m) ?? [])[1];
  if (order && slug) byOrder.set(order, { file: f, slug, raw });
}

const problems = [];
let wrote = 0;

for (const ch of chapters) {
  const target = byOrder.get(ch.order);
  const t = toc.get(ch.order);
  if (!target) { problems.push(`ปางที่ ${ch.order}: ไม่มีไฟล์ในคอลเลกชัน`); continue; }
  if (t && t.name_zh !== ch.name_zh) {
    problems.push(`ปางที่ ${ch.order}: ชื่อจีนในสารบัญ (${t.name_zh}) ไม่ตรงกับในบท (${ch.name_zh})`);
  }

  // ----- ช่องที่เป็นของหนังสือ -----
  const own = {
    name_th: t?.name_th ?? '',
    name_zh: ch.name_zh,
    name_thai_reading: ch.reading,
    name_japanese: ch.japanese,
    tagline: t?.tagline ?? '',
    essence: ch.epigraph,
    attributes: ch.attributes,
    keypoints: ch.keypoints,
    source_doc: BOOK_REF,
    has_full: true,
  };

  // แก้เฉพาะในบล็อก frontmatter เท่านั้น — ถ้าปล่อยให้ regex วิ่งทั้งไฟล์
  // เส้นคั่น --- ของ frontmatter กับของ Markdown ในเนื้อความจะปนกัน
  const fm = target.raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) { problems.push(`ปางที่ ${ch.order}: อ่าน frontmatter ไม่ได้`); continue; }
  const keep = fm[1].split('\n');

  /** ลบคีย์เดิมออกทั้งบล็อก รวมบรรทัดลูกของรายการ (ขึ้นต้นด้วยช่องว่าง) */
  const dropKey = (arr, key) => {
    const out = [];
    let skipping = false;
    for (const line of arr) {
      if (new RegExp(`^${key}:`).test(line)) { skipping = true; continue; }
      if (skipping && /^\s+\S/.test(line)) continue;
      skipping = false;
      out.push(line);
    }
    return out;
  };

  let head = keep;
  const added = [];
  for (const [key, val] of Object.entries(own)) {
    head = dropKey(head, key);
    added.push(Array.isArray(val)
      ? (val.length ? `${key}:\n${val.map((v) => `  - ${q(v)}`).join('\n')}` : `${key}: []`)
      : `${key}: ${typeof val === 'boolean' ? val : q(val)}`);
  }

  // เนื้อความย่อบนหน้าปาง = สองย่อหน้าแรกของเรื่องราวความเป็นมา
  const teaser = ch.story.split('\n\n').slice(0, 2).join('\n\n');
  const raw = `---\n${[...head.filter((l) => l.trim()), ...added].join('\n')}\n---\n\n${teaser}\n`;
  await writeFile(join(PANG, target.file), raw, 'utf8');

  // ----- บทเต็ม -----
  // ภาษาไทยไม่เว้นวรรคระหว่างคำ นับคำด้วยการตัดช่องว่างจึงได้ตัวเลขที่ผิด
  // ใช้จำนวนอักษรแล้วหารด้วยความยาวคำไทยโดยเฉลี่ย (~5 อักษร) เป็นค่าประมาณ
  const chars = `${ch.story}\n${ch.today}`.replace(/\s+/g, '').length;
  const words = Math.round(chars / 5);
  const full = `---
order: ${ch.order}
slug: ${target.slug}
title: ${q(`${own.name_th} ${ch.name_zh}`)}
source: ${q(BOOK_REF)}
words: ${words}
---

### เรื่องราวความเป็นมา

${ch.story}

### ความหมายในชีวิตวันนี้

${ch.today}

### คีย์พอยท์

${ch.keypoints.map((k) => `- ${k}`).join('\n')}
`;
  await writeFile(join(FULL, `${String(ch.order).padStart(2, '0')}-${target.slug}.md`), full, 'utf8');
  wrote++;
}

console.log(`เขียนแล้ว ${wrote} ปาง`);
if (problems.length) {
  console.log('\nต้องตรวจด้วยตา');
  for (const p of problems) console.log('  ! ' + p);
}
