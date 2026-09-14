# ตั้งค่าหน้าจอ /admin

หน้าจอนี้คือ [Decap CMS](https://decapcms.org) ป้ายทุกช่องเป็นภาษาไทย
เจ้าหน้าที่ตำหนักใช้ลงข่าวและแก้ปฏิทินได้เองโดยไม่ต้องแตะโค้ด

## ตอนพัฒนา (ไม่ต้องตั้ง OAuth)

```bash
npx decap-server      # หน้าต่างที่ ๑
npm run dev           # หน้าต่างที่ ๒
```

เปิด <http://localhost:4321/admin> แล้วกด “Login” ได้เลย
การแก้ทุกอย่างจะเขียนลงไฟล์ในเครื่อง ไม่ส่งขึ้น GitHub

## ตอนใช้งานจริง

Decap ต้องการตัวช่วยยืนยันตัวตนกับ GitHub หนึ่งตัว เลือกทางใดทางหนึ่ง

### ทางที่ ๑ — Netlify (ง่ายที่สุด)

ถ้าโฮสต์บน Netlify เปิด Identity + Git Gateway ในหน้าตั้งค่าเว็บไซต์
แล้วเปลี่ยน `backend` ใน `public/admin/config.yml` เป็น

```yaml
backend:
  name: git-gateway
  branch: main
```

### ทางที่ ๒ — GitHub OAuth (ใช้ได้กับทุกโฮสต์ รวม Vercel)

1. GitHub › Settings › Developer settings › **OAuth Apps** › New OAuth App
   - Homepage URL: `https://<โดเมนของตำหนัก>`
   - Authorization callback URL: `https://<โดเมน oauth helper>/callback`
2. ติดตั้งตัวช่วย OAuth (เช่น `decap-server`, `netlify-cms-oauth-provider`
   หรือ Cloudflare Worker) แล้วใส่ Client ID / Secret ที่ได้
3. เพิ่ม `base_url` และ `auth_endpoint` ใน `config.yml`

```yaml
backend:
  name: github
  repo: chawanansuk/guanyin
  branch: main
  base_url: https://<โดเมน oauth helper>
  auth_endpoint: auth
```

## บัญชีผู้ใช้

ผู้ที่จะลงข่าวต้องมีบัญชี GitHub และถูกเชิญเป็น collaborator ของ repo
**ขอชื่อและอีเมลของผู้รับผิดชอบ ๑ คนจากทางตำหนัก** แล้วตั้งบัญชีให้

## หลังจากแก้แล้วเกิดอะไรขึ้น

การกด Publish ใน `/admin` คือการ commit ลง GitHub
GitHub Actions จะสร้างเว็บใหม่และขึ้นให้เองภายในประมาณ ๑–๒ นาที
ไม่มีฐานข้อมูล ไม่มีเซิร์ฟเวอร์ให้ดูแล และทุกการแก้มีประวัติย้อนดูได้
