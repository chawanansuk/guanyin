# ขึ้นเว็บจริง

เว็บนี้เป็น HTML คงที่ล้วน ไม่มีเซิร์ฟเวอร์ ไม่มีฐานข้อมูล
โฮสต์ได้ฟรีบน Vercel, Cloudflare Pages หรือ Netlify

## ตั้งค่าที่โฮสต์

| ช่อง | ค่า |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | `22` (ล็อกไว้ที่ `engines` ใน package.json แล้ว) |
| Install command | `npm ci` |

`vercel.json` ตั้ง `cleanUrls` ไว้แล้ว — ลิงก์จะเป็น `/about` ไม่ใช่ `/about.html`
ตรงกับ canonical และ sitemap ถ้าย้ายไปโฮสต์อื่นต้องตั้งแบบเดียวกัน

## โดเมนระหว่างที่ยังไม่ได้จด

ตั้ง environment variable ชื่อ **`SITE_URL`** ที่โฮสต์ ให้เป็นลิงก์ที่ใช้อยู่จริง
เช่น `https://guanyin.vercel.app` แล้ว canonical, hreflang, sitemap, robots.txt
และ URL ของภาพพรีวิวตอนแชร์ จะตามไปทั้งหมด

ถ้าไม่ตั้ง ระบบจะใช้ลำดับนี้

1. `SITE_URL`
2. `VERCEL_PROJECT_PRODUCTION_URL` (Vercel ตั้งให้เอง)
3. `url` ใน `src/data/site.json`

**พอต่อโดเมนจริงเข้ากับโฮสต์แล้ว ให้ลบ `SITE_URL` ทิ้ง** เพื่อให้กลับไปใช้โดเมนจริง

`npm run build` จะสร้างภาพพรีวิวตอนแชร์ให้เองก่อน (ผ่าน `prebuild`)
ถ้ามีภาพต้นฉบับอยู่ในเครื่องที่ build ด้วย ให้ใช้ `npm run images && npm run build`

## ก่อนขึ้นเว็บจริง — ตรวจ ๗ ข้อ

1. **แก้ `url` ใน `src/data/site.json`** ให้เป็นโดเมนจริง
   (มีผลกับ canonical, sitemap, ภาพพรีวิวตอนแชร์ และ QR ทุกชิ้น)
   แล้วลบ `SITE_URL` ที่โฮสต์ทิ้ง ถ้าเคยตั้งไว้
2. ~~แก้ robots.txt~~ — สร้างเองตอน build จาก `src/pages/robots.txt.ts` แล้ว
3. แก้ `repo:` ใน `public/admin/config.yml`
4. **ทดสอบส่งลิงก์หน้าปางในไลน์บนมือถือจริง** ต้องเห็นภาพองค์ ไม่ใช่กล่องเปล่า
5. เปิดเว็บบนมือถือจริงอย่างน้อย ๓ เครื่อง (Android ราคาถูก · iPhone รุ่นเก่า · แท็บเล็ต)
6. ส่ง `sitemap-index.xml` เข้า Google Search Console
7. ใส่ลิงก์เว็บใน Google Business Profile

## เรื่องโดเมน

`.or.th` ให้ความน่าเชื่อถือแบบองค์กรไม่แสวงกำไร แต่ต้องใช้เอกสารจดทะเบียน
และใช้เวลา ๑–๒ สัปดาห์ ปีแรกใช้ `.com` ไปก่อนได้ แล้วค่อย redirect ทีหลัง

## สถิติผู้เข้าชม

ตั้งค่าที่ `analytics` ใน `src/data/site.json`

```json
{ "analytics": { "provider": "plausible", "domain": "putuoguanyin.com" } }
```

รองรับ `plausible` และ `umami` ทั้งสองตัวไม่ใช้คุกกี้
จึงไม่ต้องขึ้นแบนเนอร์ขอความยินยอม เว้นว่างไว้ = ไม่ติดตั้งอะไรเลย

## งบประสิทธิภาพที่ต้องรักษาไว้

ทดสอบบนมือถือราคาประหยัดผ่าน 4G ไม่ใช่บนคอมพิวเตอร์ผ่าน WiFi

- หน้าแรกโหลดเสร็จ (LCP) ไม่เกิน ๒.๕ วินาที · น้ำหนักรวมไม่เกิน ๖๐๐ KB
- ภาพย่อบนหน้ารวม ไม่เกิน ๒๕ KB ต่อองค์
- ไม่ฝัง iframe แผนที่ (iframe ตัวเดียวหนักกว่าทั้งหน้ารวมกัน)
- ตัวอักษรเนื้อหาไม่เล็กกว่า ๑๗px · ปุ่มกดสูงไม่ต่ำกว่า ๔๔px
