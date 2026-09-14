import site from '../data/site.json';

export type Slot = { day: number; open: string; close: string };

/** จัดกลุ่มวันที่มีเวลาเปิดปิดเหมือนกัน เพื่อแสดงเป็นตารางสั้น ๆ */
export function groupedHours(): { days: number[]; open: string; close: string }[] {
  const order = [1, 2, 3, 4, 5, 6, 0]; // เริ่มวันจันทร์ตามที่คนไทยอ่านตาราง
  const out: { days: number[]; open: string; close: string }[] = [];
  for (const d of order) {
    const slot = (site.hours.weekly as Slot[]).find((s) => s.day === d);
    if (!slot) continue;
    const last = out[out.length - 1];
    if (last && last.open === slot.open && last.close === slot.close) last.days.push(d);
    else out.push({ days: [d], open: slot.open, close: slot.close });
  }
  return out;
}

/** ข้อความสำรองเมื่อผู้ใช้ปิด JavaScript — ต้องอ่านรู้เรื่องโดยไม่ต้องรู้ว่าวันนี้วันอะไร */
export function hoursSummary(): string {
  return groupedHours()
    .map((g) => `${g.days.map((d) => ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'][d]).join('·')} ${g.open}–${g.close}`)
    .join(' · ');
}

/** รูปแบบ schema.org openingHours: "Mo-Fr 07:00-18:00" */
export function schemaOpeningHours(): { dayOfWeek: string[]; opens: string; closes: string }[] {
  const SC = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return groupedHours().map((g) => ({
    dayOfWeek: g.days.map((d) => SC[d]!),
    opens: g.open,
    closes: g.close,
  }));
}
