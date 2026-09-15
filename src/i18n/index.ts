/**
 * สองภาษา: ไทย (หลัก, ไม่มี prefix) และจีนตัวเต็ม (/zh)
 *
 * ภาษาจีนแปลเฉพาะหน้าที่ผู้มาเยือนชาวจีนต้องใช้จริง — ข้อมูลตำหนัก เวลา การเดินทาง
 * ๓๓ ปาง และวิธีไหว้ ส่วนบทความฉบับเต็มและข่าวยังเป็นภาษาไทยเท่านั้น
 * หน้าจีนที่ยังไม่มีคู่แปล จะไม่หลอกผู้อ่านว่ามี แต่บอกตรง ๆ พร้อมลิงก์ไปฉบับไทย
 */
export const LANGS = ['th', 'zh'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'th';

export const LANG_META: Record<Lang, { label: string; htmlLang: string; ogLocale: string; dir: string }> = {
  th: { label: 'ไทย', htmlLang: 'th', ogLocale: 'th_TH', dir: 'ltr' },
  zh: { label: '中文', htmlLang: 'zh-Hant', ogLocale: 'zh_TW', dir: 'ltr' },
};

/** หน้าที่มีทั้งสองภาษา — path ฝั่งไทยเป็นกุญแจ */
export const TRANSLATED_ROUTES = [
  '/',
  '/33-pang',
  '/about',
  '/visit',
  '/calendar',
  '/worship/how-to',
  '/opening',
  '/faq',
  '/contact',
] as const;

export function langFromUrl(url: URL): Lang {
  return url.pathname.startsWith('/zh') ? 'zh' : 'th';
}

/**
 * ตัด prefix ภาษาออก เหลือ path กลางที่ใช้เทียบสองฝั่ง
 * รองรับทั้ง /a/b, /a/b/, /a/b.html และ /index.html
 * เพราะ build.format: 'file' ทำให้ pathname ที่เห็นตอน build ไม่ได้อยู่ในรูปเดียวเสมอ
 */
/** path ที่ผู้ใช้เห็นบนแถบที่อยู่ — ตัด .html และสแลชท้ายออก
 *  ตอน build แบบ format:'file' ค่า Astro.url.pathname จะลงท้าย .html
 *  ถ้าเอาไปทำ canonical ตรง ๆ กูเกิลจะเห็นสองที่อยู่สำหรับหน้าเดียวกัน
 *  (ตัวที่มี .html จาก canonical และตัวไม่มีจาก sitemap) */
export function cleanPath(pathname: string): string {
  const p = pathname.replace(/index\.html$/, '').replace(/\.html$/, '');
  return p.replace(/\/+$/, '') || '/';
}

export function basePath(pathname: string): string {
  const p = cleanPath(pathname);
  if (p === '/zh') return '/';
  return p.startsWith('/zh/') ? p.slice(3) : p;
}

/** path ของหน้าเดียวกันในอีกภาษา — คืน null ถ้ายังไม่มีคู่แปล */
export function altPath(pathname: string, to: Lang): string | null {
  const base = basePath(pathname);
  const isPang = /^\/33-pang\/[a-z0-9-]+$/.test(base);
  const known = (TRANSLATED_ROUTES as readonly string[]).includes(base) || isPang;
  if (!known) return null;
  if (to === 'th') return base;
  return base === '/' ? '/zh' : `/zh${base}`;
}

/** ใส่ prefix ภาษาให้ path ภายในภาษานั้น */
export function withLang(path: string, lang: Lang): string {
  if (lang === 'th') return path;
  return path === '/' ? '/zh' : `/zh${path}`;
}

// ---------------------------------------------------------------- ข้อความ UI
const TH = {
  'nav.about': 'เกี่ยวกับตำหนัก',
  'nav.pang': '๓๓ ปาง',
  'nav.worship': 'การบูชา',
  'nav.calendar': 'ปฏิทิน',
  'nav.visit': 'การเดินทาง',
  'nav.menu': 'เมนูหลัก',
  'cta.directions': 'นำทางไปตำหนัก',
  'cta.directionsShort': 'นำทาง',
  'cta.viewAll': 'ดูครบทั้ง ๓๓ ปาง',
  'cta.howTo': 'วิธีไหว้',
  'cta.maps': 'เปิดใน Google Maps',
  'cta.visitDetail': 'รายละเอียดการเดินทาง',
  'hours.label': 'เวลาทำการ',
  'hours.openNow': 'เปิดอยู่ตอนนี้',
  'hours.opensToday': 'วันนี้เปิด',
  'hours.closedNow': 'ปิดแล้ววันนี้ · พรุ่งนี้เปิด',
  'hours.closedToday': 'วันนี้ปิด',
  'hours.caption': 'เวลาทำการ',
  'lang.switch': 'เปลี่ยนภาษา',
  'lang.noTranslation': 'หน้านี้ยังไม่มีฉบับภาษาจีน',
  'skip': 'ข้ามไปยังเนื้อหา',
  'foot.place': 'ที่ตั้งและเวลา',
  'foot.links': 'ทางลัด',
  'foot.notice': 'เนื้อหาเรื่อง ๓๓ ปางบนเว็บนี้ ตรวจสอบโดยผู้รู้ของตำหนักก่อนเผยแพร่ หากพบข้อผิดพลาดโปรดแจ้งทางหน้าติดต่อ เพื่อจะได้แก้ไขให้ถูกต้อง',
  'pang.essence': 'แก่นของปาง',
  'pang.marks': 'ลักษณะเด่น',
  'pang.meaning': 'ความหมายและเรื่องเล่า',
  'pang.location': 'ตำแหน่งในตำหนัก',
  'pang.altNames': 'ชื่ออื่นที่พบ',
  'pang.pending': 'กำลังอัญเชิญ',
  'pang.readFull': 'อ่านฉบับเต็มของปางนี้ ›',
  'pang.qrHead': 'ยืนอยู่หน้าองค์นี้ใช่ไหม',
} as const;

const ZH: Record<keyof typeof TH, string> = {
  'nav.about': '關於本堂',
  'nav.pang': '三十三觀音',
  'nav.worship': '參拜',
  'nav.calendar': '節日曆',
  'nav.visit': '交通與開放時間',
  'nav.menu': '主選單',
  'cta.directions': '導航前往本堂',
  'cta.directionsShort': '導航',
  'cta.viewAll': '瀏覽三十三觀音',
  'cta.howTo': '參拜方式',
  'cta.maps': '在 Google 地圖開啟',
  'cta.visitDetail': '交通詳情',
  'hours.label': '開放時間',
  'hours.openNow': '現正開放',
  'hours.opensToday': '今日開放',
  'hours.closedNow': '今日已閉堂 · 明日開放',
  'hours.closedToday': '今日休堂',
  'hours.caption': '開放時間',
  'lang.switch': '切換語言',
  'lang.noTranslation': '本頁尚無中文版',
  'skip': '跳至內容',
  'foot.place': '地址與時間',
  'foot.links': '快速連結',
  'foot.notice': '本站三十三觀音的內容，經本堂執事校訂後才公開。若發現錯誤，敬請由聯絡頁告知，以便更正。',
  'pang.essence': '本願要旨',
  'pang.marks': '辨識標記',
  'pang.meaning': '源流與釋義',
  'pang.location': '堂內位置',
  'pang.altNames': '其他名稱',
  'pang.pending': '尚待迎請',
  'pang.readFull': '閱讀本尊全文（泰文）›',
  'pang.qrHead': '您正站在這尊前嗎',
};

const DICT: Record<Lang, Record<string, string>> = { th: TH, zh: ZH };

export function useT(lang: Lang) {
  return (key: keyof typeof TH): string => DICT[lang][key] ?? DICT.th[key] ?? String(key);
}
