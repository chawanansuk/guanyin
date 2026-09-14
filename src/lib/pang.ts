import { getCollection, type CollectionEntry } from 'astro:content';
import site from '../data/site.json';

export type Pang = CollectionEntry<'pang'>;

/** ปางทั้งหมด เรียงตามลำดับ ๑–๓๓ */
export async function allPang(): Promise<Pang[]> {
  const list = await getCollection('pang');
  return list.sort((a, b) => a.data.order - b.data.order);
}

/** ชื่อที่ควรแสดง — ถ้าป้ายในตำหนักใช้ชื่ออื่น ให้ชื่อของตำหนักเป็นหลัก */
export const displayName = (p: Pang) => p.data.name_th_shrine || p.data.name_th;

/** ชื่ออื่นที่พบ (แสดงท้ายหน้าเพื่อให้ค้นเจอทั้งสองแบบ) */
export function altNames(p: Pang): string[] {
  const names = new Set<string>();
  if (p.data.name_th_shrine && p.data.name_th_shrine !== p.data.name_th) names.add(p.data.name_th);
  if (p.data.name_thai_reading) names.add(p.data.name_thai_reading);
  if (p.data.name_sanskrit) names.add(p.data.name_sanskrit);
  return [...names];
}

/**
 * ผู้รู้ของตำหนักตรวจแล้วหรือยัง
 * ยังไม่ตรวจ → หน้ายังอยู่ (QR ที่พิมพ์ไปแล้วต้องใช้ได้) แต่แสดงเฉพาะ
 * ชื่อ ภาพ ลักษณะเด่น และหมวดพร พร้อมป้ายแจ้ง และไม่ให้ Google เก็บดัชนี
 */
export const isVerified = (p: Pang) =>
  !site.content.require_verified || p.data.verified_by.trim() !== '';

export const prevPang = (list: Pang[], i: number) => list[(i - 1 + list.length) % list.length]!;
export const nextPang = (list: Pang[], i: number) => list[(i + 1) % list.length]!;

/** นับองค์ที่ประดิษฐานแล้ว / ที่ยังรออัญเชิญ */
export function enshrinedCount(list: Pang[]) {
  const yes = list.filter((p) => p.data.enshrined).length;
  return { enshrined: yes, pending: list.length - yes, total: list.length };
}
