import { getCollection, type CollectionEntry } from 'astro:content';
import site from './site';

export type Pang = CollectionEntry<'pang'>;

/** ปางทั้งหมด เรียงตามลำดับ ๑–๓๓ */
export async function allPang(): Promise<Pang[]> {
  const list = await getCollection('pang');
  return list.sort((a, b) => a.data.order - b.data.order);
}

/** ชื่อที่ควรแสดง — ถ้าป้ายในตำหนักใช้ชื่ออื่น ให้ชื่อของตำหนักเป็นหลัก */
export const displayName = (p: Pang) => p.data.name_th_shrine || p.data.name_th;

/**
 * ชื่ออื่นที่พบ — แสดงท้ายหน้าเพื่อให้คนค้นด้วยชื่อสายไหนก็เจอ
 * ชื่อไทยของ ๓๓ ปางในไทยมีสองสาย: สายแปลความ (ปางกิ่งหลิว) ที่ใช้ตามป้ายศาลเจ้า
 * และสายแปลศัพท์ธรรม (นีลกัณฐอวโลกิเตศวร) ที่เชื่อกลับไปหาคัมภีร์ได้
 */
export function altNames(p: Pang): string[] {
  const names = new Set<string>();
  if (p.data.name_th_shrine && p.data.name_th_shrine !== p.data.name_th) names.add(p.data.name_th);
  if (p.data.name_th_scholarly) names.add(p.data.name_th_scholarly);
  if (p.data.name_thai_reading) names.add(p.data.name_thai_reading);
  if (p.data.name_sanskrit) names.add(p.data.name_sanskrit);
  for (const v of p.data.name_zh_variants) names.add(v);
  return [...names];
}

/**
 * ผู้รู้ของตำหนักตรวจแล้วหรือยัง
 * เนื้อหายาวเผยแพร่ได้เมื่อมีอย่างใดอย่างหนึ่ง: ผู้รู้ของตำหนักตรวจแล้ว (verified_by)
 * หรือมาจากเอกสารต้นทางที่อ้างอิงได้ (source_doc)
 * ถ้าไม่มีทั้งคู่ หน้ายังอยู่ (QR ที่พิมพ์ไปแล้วต้องใช้ได้) แต่แสดงเฉพาะ
 * ชื่อ ภาพ ลักษณะเด่น และหมวดพร พร้อมป้ายแจ้ง และไม่ให้ Google เก็บดัชนี
 */
export const isVerified = (p: Pang) =>
  !site.content.require_verified ||
  p.data.verified_by.trim() !== '' ||
  p.data.source_doc.trim() !== '';

export const prevPang = (list: Pang[], i: number) => list[(i - 1 + list.length) % list.length]!;
export const nextPang = (list: Pang[], i: number) => list[(i + 1) % list.length]!;

/** นับองค์ที่ประดิษฐานแล้ว / ที่ยังรออัญเชิญ */
export function enshrinedCount(list: Pang[]) {
  const yes = list.filter((p) => p.data.enshrined).length;
  return { enshrined: yes, pending: list.length - yes, total: list.length };
}
