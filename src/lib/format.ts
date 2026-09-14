/**
 * วันที่ทั้งเว็บอ่านค่าด้วย getUTC* เสมอ
 *
 * เหตุผล: วันที่ในไฟล์เนื้อหาเขียนเป็น "2026-10-25" ซึ่ง JavaScript แปลงเป็น
 * เที่ยงคืน UTC ถ้าอ่านด้วย getDate() ธรรมดา เครื่องที่ build อยู่คนละเขตเวลา
 * จะได้วันเคลื่อนไปหนึ่งวัน (เคยทำให้วันพิธีเปิดขึ้นเป็น ๒๔ ต.ค. แทน ๒๕)
 * การอ่านด้วย UTC ทำให้ผลลัพธ์เหมือนกันไม่ว่า build ที่ไหน
 * ส่วนคำว่า "วันนี้" ใช้วันตามเวลาไทยเสมอ (ดู todayBangkok)
 */

const THAI_DIGITS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];

/** แปลงเลขอารบิกเป็นเลขไทย — ใช้กับลำดับปางและจำนวนธูป ให้เข้ากับป้ายในตำหนัก */
export function thaiNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) => THAI_DIGITS[Number(d)]!);
}

/** ลำดับปางแบบสองหลักเลขไทย: 1 → ๐๑ */
export function pangNo(order: number): string {
  return thaiNum(String(order).padStart(2, '0'));
}

/** "2026-10-25" → Date ที่เที่ยงคืน UTC (ใช้กับวันที่ในไฟล์ตั้งค่า) */
export function parseDay(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

/** วันนี้ตามเวลาไทย คืนค่าเป็นเที่ยงคืน UTC ของวันนั้น เพื่อเทียบกับวันอื่นได้ตรง ๆ */
export function todayBangkok(now = new Date()): Date {
  const bkk = new Date(now.getTime() + 7 * 3_600_000);
  return new Date(Date.UTC(bkk.getUTCFullYear(), bkk.getUTCMonth(), bkk.getUTCDate()));
}

const MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const DAYS_FULL = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export const dayNameFull = (d: number) => DAYS_FULL[d]!;
export const dayNameShort = (d: number) => DAYS_SHORT[d]!;
/** ชื่อวันในสัปดาห์ของวันที่นั้น */
export const dayOfWeek = (d: Date) => d.getUTCDay();

/** วันที่ไทย เลขอารบิก ปี พ.ศ. — "25 ตุลาคม 2569" */
export function thaiDate(d: Date, style: 'full' | 'short' = 'full'): string {
  const m = style === 'full' ? MONTHS_FULL : MONTHS_SHORT;
  return `${d.getUTCDate()} ${m[d.getUTCMonth()]} ${d.getUTCFullYear() + 543}`;
}

/** ช่วงวัน — ยุบเดือนซ้ำ: "10–18 ต.ค. 2569" */
export function thaiDateRange(start: Date, end?: Date, style: 'full' | 'short' = 'short'): string {
  if (!end) return thaiDate(start, style);
  const m = style === 'full' ? MONTHS_FULL : MONTHS_SHORT;
  if (start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear()) {
    return `${start.getUTCDate()}–${end.getUTCDate()} ${m[start.getUTCMonth()]} ${start.getUTCFullYear() + 543}`;
  }
  return `${thaiDate(start, style)} – ${thaiDate(end, style)}`;
}

/** ค.ศ. → พ.ศ. */
export const beYear = (d: Date) => d.getUTCFullYear() + 543;

/** วันที่รูปแบบ ISO สำหรับ <time datetime> และ JSON-LD */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** จำนวนวันจาก "วันนี้ตามเวลาไทย" — ลบคือผ่านไปแล้ว */
export function daysFromToday(d: Date, today = todayBangkok()): number {
  const a = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((a - today.getTime()) / 86_400_000);
}
