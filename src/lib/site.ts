/**
 * ข้อมูลตำหนัก พร้อม "โดเมนจริง" ที่ตัดสินตอน build
 *
 * `url` ใน site.json คือโดเมนที่ตำหนักตั้งใจจะใช้ แต่ระหว่างที่ยังไม่ได้จดโดเมน
 * เว็บจะอยู่บนลิงก์ของโฮสต์ไปก่อน ถ้าปล่อยให้ canonical / hreflang / ภาพพรีวิว
 * ตอนแชร์ ชี้ไปโดเมนที่ยังไม่มีอยู่จริง ลิงก์ที่ส่งในไลน์จะขึ้นเป็นกล่องเปล่า
 * และกูเกิลจะเก็บหน้าไปผิดที่อยู่
 *
 * ลำดับความสำคัญ
 *   1. SITE_URL                          ตั้งเองที่โฮสต์ ชนะทุกอย่าง
 *   2. VERCEL_PROJECT_PRODUCTION_URL     Vercel ตั้งให้เอง
 *   3. url ใน site.json                  ค่าตั้งต้น = โดเมนจริงของตำหนัก
 *
 * พอจดโดเมนและต่อเข้ากับโฮสต์แล้ว ให้ลบ SITE_URL ทิ้ง — ข้อ 2 จะกลายเป็น
 * โดเมนจริงเอง หรือจะปล่อยให้ตกมาที่ข้อ 3 ก็ได้ ผลเหมือนกัน
 */
import raw from '../data/site.json';

const clean = (u: string) => u.replace(/\/+$/, '');

const fromEnv =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : '');

export const siteUrl = clean(fromEnv || raw.url);

export default { ...raw, url: siteUrl };
