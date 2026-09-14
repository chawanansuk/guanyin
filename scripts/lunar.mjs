#!/usr/bin/env node
/**
 * แปลงวันจันทรคติจีน → วันที่สากล (เขตเวลา UTC+8 ตามปฏิทินจีน)
 * ใช้ *ร่าง* ปฏิทินวันสำคัญเท่านั้น ไม่ใช่ตัวตัดสิน
 *
 * ผลลัพธ์อาจคลาดเคลื่อน ๑ วันจากปฏิทินจีนฉบับพิมพ์ (通勝)
 * ก่อนขึ้นเว็บต้องให้ผู้รู้ของตำหนักเทียบและยืนยัน แล้วตั้ง approx: false
 * ในไฟล์ src/content/events/<ปี พ.ศ.>.yaml
 *
 *   npm run lunar -- 2027
 */

const PI = Math.PI;
const rad = (d) => (d * PI) / 180;

/** Julian Day Number จากวันที่สากล */
function jdFromDate(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  let jd = d + Math.floor((153 * mm + 2) / 5) + 365 * yy
    + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  if (jd < 2299161) {
    jd = d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - 32083;
  }
  return jd;
}

/** วันที่สากลจาก Julian Day Number */
function dateFromJd(jd) {
  let a, b, c;
  if (jd > 2299160) {
    a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: b * 100 + d - 4800 + Math.floor(m / 10),
  };
}

/** วันจันทร์ดับครั้งที่ k นับจาก 1900-01-01 (คืนค่าเป็น JD เศษส่วน, UT) */
function newMoon(k) {
  const T = k / 1236.85;
  const T2 = T * T, T3 = T2 * T;
  const dr = PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  let deltat;
  if (T < -11) {
    deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }
  return Jd1 + C1 - deltat;
}

/** ลองจิจูดสุริยะ (หน่วยเป็นช่วง 30° = 0..11) ณ JD ที่กำหนด */
function sunLongitude(jdn, tz = 8) {
  const T = (jdn - 2451545.5 - tz / 24) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L = L * dr;
  L = L - PI * 2 * Math.floor(L / (PI * 2));
  return Math.floor((L / PI) * 6);
}

const lunarMonth11 = (year, tz = 8) => {
  const off = jdFromDate(year, 12, 31) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = Math.floor(newMoon(k) + 0.5 + tz / 24);
  if (sunLongitude(nm, tz) >= 9) nm = Math.floor(newMoon(k - 1) + 0.5 + tz / 24);
  return nm;
};

function leapMonthOffset(a11, tz = 8) {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last, i = 1, arc = sunLongitude(Math.floor(newMoon(k + i) + 0.5 + tz / 24), tz);
  do {
    last = arc;
    i++;
    arc = sunLongitude(Math.floor(newMoon(k + i) + 0.5 + tz / 24), tz);
  } while (arc !== last && i < 14);
  return i - 1;
}

/** วันจันทรคติจีน (lunarMonth 1–12, lunarDay 1–30) → {year, month, day} สากล */
export function lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeap = false, tz = 8) {
  let a11, b11;
  if (lunarMonth < 11) {
    a11 = lunarMonth11(lunarYear - 1, tz);
    b11 = lunarMonth11(lunarYear, tz);
  } else {
    a11 = lunarMonth11(lunarYear, tz);
    b11 = lunarMonth11(lunarYear + 1, tz);
  }
  let off = lunarMonth - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const leapOff = leapMonthOffset(a11, tz);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (isLeap && lunarMonth !== leapMonth) return null;
    if (isLeap || off >= leapOff) off += 1;
  }
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  const monthStart = Math.floor(newMoon(k + off) + 0.5 + tz / 24);
  return dateFromJd(monthStart + lunarDay - 1);
}

/** วันสำคัญประจำปี ตามที่เว็บนี้ใช้ */
export function shrineEvents(gregorianYear) {
  const at = (m, d) => lunarToSolar(gregorianYear, m, d);
  return [
    { id: 'cny', title: 'ตรุษจีน', title_zh: '春節', lunar: '๑ ค่ำ เดือน ๑', ...at(1, 1) },
    { id: 'birth', title: 'วันประสูติเจ้าแม่กวนอิม', title_zh: '觀音誕辰', lunar: '๑๙ ค่ำ เดือน ๒', ...at(2, 19) },
    { id: 'enlighten', title: 'วันตรัสรู้เจ้าแม่กวนอิม', title_zh: '觀音成道', lunar: '๑๙ ค่ำ เดือน ๖', ...at(6, 19) },
    { id: 'vegetarian', title: 'เทศกาลกินเจ (วันแรก)', title_zh: '九皇齋', lunar: '๑ ค่ำ เดือน ๙', ...at(9, 1) },
    { id: 'vegetarian-end', title: 'เทศกาลกินเจ (วันสุดท้าย)', title_zh: '九皇齋', lunar: '๙ ค่ำ เดือน ๙', ...at(9, 9) },
    { id: 'ordain', title: 'วันออกบวชเจ้าแม่กวนอิม', title_zh: '觀音出家', lunar: '๑๙ ค่ำ เดือน ๙', ...at(9, 19) },
  ];
}

// ---- รันจากบรรทัดคำสั่ง ----
if (import.meta.url === `file://${process.argv[1]}`) {
  const year = Number(process.argv[2]) || new Date().getFullYear();
  const pad = (n) => String(n).padStart(2, '0');
  console.log(`# ร่างวันสำคัญ ค.ศ. ${year} (พ.ศ. ${year + 543}) — ต้องให้ตำหนักยืนยันก่อนใช้`);
  console.log('# approx: true ไว้ทุกรายการ เปลี่ยนเป็น false เมื่อเทียบปฏิทินจีนแล้ว\n');
  for (const e of shrineEvents(year)) {
    if (!e.year) { console.log(`# ${e.title}: คำนวณไม่ได้`); continue; }
    const iso = `${e.year}-${pad(e.month)}-${pad(e.day)}`;
    console.log(`- id: ${e.id}-${year + 543}`);
    console.log(`  title: ${e.title}`);
    console.log(`  title_zh: ${e.title_zh}`);
    console.log(`  lunar: ${e.lunar}`);
    console.log(`  date: ${iso}`);
    console.log('  approx: true');
    console.log('  kind: guanyin');
  }
}
