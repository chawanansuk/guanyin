// ตรวจเว็บที่สร้างแล้วใน dist/ ก่อนขึ้นเว็บจริง — CI รันหลัง npm run build ถ้าพบปัญหาจะหยุดไม่ให้ผ่าน
//   ๑. ลิงก์ภายในที่ไปหน้าที่ไม่มีอยู่
//   ๒. ภาพ วิดีโอ เสียง ฟอนต์ ที่หน้าเรียกแต่ไม่มีไฟล์
//   ๓. id ซ้ำในหน้าเดียวกัน (ลิงก์ #… และ aria-labelledby จะชี้ผิด)
//   ๔. หน้าที่ไม่มี h1 หรือมีมากกว่าหนึ่ง
//   ๕. หน้าที่ตั้ง noindex แต่ยังอยู่ใน sitemap (Search Console เตือนว่าสัญญาณขัดกัน)
// ใช้: npm run build && npm run check:site
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
if (!existsSync(DIST)) {
  console.error('ไม่พบ dist/ — รัน npm run build ก่อน');
  process.exit(1);
}

const walk = (dir) => readdirSync(dir, { withFileTypes: true })
  .flatMap((d) => (d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)]));
const files = walk(DIST);
const routeOf = (f) => ('/' + relative(DIST, f)).replace(/\.html$/, '').replace(/\/index$/, '') || '/';
const pages = files.filter((f) => f.endsWith('.html'));
const routes = new Set(pages.map(routeOf));
const assets = new Set(files.map((f) => '/' + relative(DIST, f)));
// redirect ที่ตั้งไว้ใน vercel.json นับเป็นปลายทางที่มีอยู่
// (ไม่นับ redirect ที่มีเงื่อนไข has เช่นย้ายโดเมนเก่า ซึ่งรับทุก path)
const redirects = (JSON.parse(readFileSync('vercel.json', 'utf8')).redirects ?? []).filter((r) => !r.has).map((r) => r.source);
const isRedirect = (u) => redirects.some((s) => new RegExp('^' + s.replace(/:[a-z]+/g, '[^/]+').replace(/\(\.\*\)/g, '.*') + '$').test(u));

const problems = [];
const add = (kind, page, detail) => problems.push(`${kind}  ${page}  ${detail}`);
const sitemap = existsSync(join(DIST, 'sitemap-0.xml')) ? readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8') : '';

for (const f of pages) {
  const page = routeOf(f);
  const body = readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');

  // ๑ + ๒ ลิงก์และไฟล์ที่หน้าเรียก
  const refs = [...body.matchAll(/\s(?:href|src|poster)="([^"]+)"/g)].map((m) => m[1])
    .concat([...body.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0])));
  for (const ref of refs) {
    if (!ref.startsWith('/') || ref.startsWith('//')) continue;
    const path = decodeURI(ref.split('#')[0].split('?')[0]);
    if (!path) continue;
    const clean = path.replace(/\/$/, '') || '/';
    if (routes.has(clean) || assets.has(path) || isRedirect(clean)) continue;
    if (existsSync(join(DIST, path)) && statSync(join(DIST, path)).isDirectory()) continue;
    if (page.startsWith('/admin')) continue;
    add(/\.[a-z0-9]{2,5}$/i.test(path) ? 'ไฟล์หาย' : 'ลิงก์เสีย', page, ref);
  }

  // ๓ id ซ้ำ
  const seen = new Map();
  for (const m of body.matchAll(/\sid="([^"]+)"/g)) seen.set(m[1], (seen.get(m[1]) ?? 0) + 1);
  for (const [id, n] of seen) if (n > 1) add('id ซ้ำ', page, `#${id} × ${n}`);

  // ๔ h1
  if (!page.startsWith('/admin')) {
    const h1 = (body.match(/<h1[\s>]/g) ?? []).length;
    if (h1 !== 1) add('h1', page, `มี ${h1} ตัว`);
  }
}
// ๕ ทุก URL ใน sitemap ต้องมีหน้าจริงและไม่ได้ตั้ง noindex (เทียบเฉพาะ path ไม่ขึ้นกับโดเมน)
for (const loc of [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/$/, '') || '/')) {
  const f = pages.find((p) => routeOf(p) === loc);
  if (!f) { add('sitemap ชี้หน้าที่ไม่มี', loc, ''); continue; }
  if (/<meta name="robots" content="noindex/.test(readFileSync(f, 'utf8'))) add('noindex แต่อยู่ใน sitemap', loc, '');
}

const uniq = [...new Set(problems)];
if (uniq.length) {
  console.error(`พบปัญหา ${uniq.length} จุด:`);
  for (const p of uniq.slice(0, 80)) console.error('  ' + p);
  process.exit(1);
}
console.log(`ตรวจเว็บผ่าน: ${pages.length} หน้า ไม่มีลิงก์เสีย ไฟล์หาย id ซ้ำ และ h1 ครบ`);
