// สร้างไฟล์เนื้อหาตั้งต้นจาก scripts/_pang-seed.mjs
// รันครั้งเดียวตอนตั้งโปรเจกต์ — หลังจากนี้แก้ไฟล์ใน src/content/ โดยตรง หรือผ่าน /admin
// ไฟล์ที่มีอยู่แล้วจะไม่ถูกเขียนทับ (ใส่ --force เพื่อเขียนทับ)
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { PANG } from './_pang-seed.mjs';

const force = process.argv.includes('--force');
const dir = new URL('../src/content/pang/', import.meta.url);
mkdirSync(dir, { recursive: true });

const q = (s) => JSON.stringify(s);
let written = 0, skipped = 0;

for (const p of PANG) {
  const pad = String(p.n).padStart(2, '0');
  const file = new URL(`${pad}-${p.slug}.md`, dir);
  if (existsSync(file) && !force) { skipped++; continue; }

  const body = `---
order: ${p.n}
slug: ${p.slug}
name_th: ${q(p.th)}
name_th_shrine: ""
name_zh: ${q(p.zh)}
name_pinyin: ${q(p.py)}
name_thai_reading: ${q(p.tr)}
name_sanskrit: ${q(p.sa)}
enshrined: true
shrine_point: ${p.n}
attributes: ${q(p.attr)}
wishes: [${p.w.join(', ')}]
incense: 3
short_prayer: ${q(p.pray)}
photo: pang-${pad}
photo_detail: pang-${pad}-detail
prayer: ""
sources: ["สัทธรรมปุณฑรีกสูตร บทสมันตมุขปริวรรต"]
verified_by: ""
---

<!-- ความหมายและเรื่องเล่า 150–300 คำ — เขียนตามที่ตำหนักถือปฏิบัติ ไม่คัดลอกจากเว็บอื่น
     เมื่อผู้รู้ของตำหนักตรวจแล้ว ให้ใส่ชื่อและวันที่ในฟิลด์ verified_by ด้านบน
     หน้าที่ verified_by ยังว่าง จะแสดงเฉพาะชื่อ ภาพ ลักษณะเด่น และหมวดพร
     พร้อมป้ายแจ้งว่ายังรอการตรวจสอบ และไม่ถูกส่งให้ Google เก็บดัชนี -->
`;
  writeFileSync(file, body, 'utf8');
  written++;
}
console.log(`ปาง: เขียนใหม่ ${written} ไฟล์, ข้ามของเดิม ${skipped} ไฟล์`);
