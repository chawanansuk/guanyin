import site from './site';

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

const TH_DAY = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const ZH_DAY = ['日', '一', '二', '三', '四', '五', '六'];

/** วันที่ตำหนักปิด — ต้องบอกให้ชัด ไม่ใช่ให้คนเดาจากวันที่หายไปในตาราง
 *  คนที่ขับรถมาแล้วเจอประตูปิดจะไม่กลับมาอีก */
export function closedDays(): number[] {
  const open = new Set((site.hours.weekly as Slot[]).map((s) => s.day));
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => !open.has(d));
}

/** เช่น "ปิดวันจันทร์" — คืนค่าว่างถ้าเปิดทุกวัน */
export function closedLabel(lang: 'th' | 'zh' = 'th'): string {
  const days = closedDays();
  if (days.length === 0) return '';
  if (lang === 'zh') return `每週${days.map((d) => ZH_DAY[d]).join('、')}休堂`;
  const TH_FULL = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  return `ปิดวัน${days.map((d) => TH_FULL[d]).join(' และวัน')}`;
}

/** ข้อความสำรองเมื่อผู้ใช้ปิด JavaScript — ต้องอ่านรู้เรื่องโดยไม่ต้องรู้ว่าวันนี้วันอะไร */
export function hoursSummary(lang: 'th' | 'zh' = 'th'): string {
  const days = lang === 'zh' ? ZH_DAY : TH_DAY;
  const sep = lang === 'zh' ? '、' : '·';
  const open = groupedHours()
    .map((g) => `${g.days.map((d) => days[d]).join(sep)} ${g.open}–${g.close}`)
    .join(' · ');
  const shut = closedLabel(lang);
  return shut ? `${open} · ${shut}` : open;
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
