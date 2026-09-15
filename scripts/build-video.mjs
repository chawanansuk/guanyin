#!/usr/bin/env node
/**
 * video-src/*.mp4 → public/video/  (ไฟล์เว็บ + ภาพปก)
 *
 *   npm run video
 *
 * ทำสามอย่างที่ไฟล์จากกล้องหรือจากเครื่องมือ AI มักไม่ได้ทำมาให้
 *
 * ๑ ย้าย moov ไปหน้าไฟล์ (faststart)
 *   ไฟล์ตั้งต้นเก็บตารางดัชนีไว้ท้ายไฟล์ เบราว์เซอร์จึงต้องโหลดครบทั้งไฟล์
 *   ก่อนถึงจะเริ่มเล่นได้และเลื่อนไม่ได้เลย คนบน 4G กดแล้วจะเห็นจอนิ่ง ๆ
 *
 * ๒ บีบใหม่ด้วย CRF
 *   ไฟล์ตั้งต้นใช้บิตเรตสูงกว่าที่ความละเอียดระดับนี้ต้องการหลายเท่า
 *
 * ๓ ตัดเสียงที่เงียบทิ้ง
 *   แทร็กเสียงที่ความดังเฉลี่ยต่ำกว่า -40 dB คือความเงียบ ไม่ใช่เสียงบรรยากาศ
 *   เก็บไว้ก็มีแต่ทำให้ไฟล์ใหญ่ขึ้นโดยไม่มีใครได้ยินอะไร
 *   ถ้าคลิปมีเสียงจริง สคริปต์จะเก็บไว้ให้เอง
 */
import { readdir, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(root, 'video-src');
const OUT = join(root, 'public', 'video');

const CRF = 31;            // คลิปสั้นวนซ้ำเป็นฉากหลัง ไม่ใช่งานที่คนจ้องดูรายละเอียด
/** ลดจุดรบกวนเบา ๆ ก่อนบีบ
 *  คลิปที่สร้างด้วย AI มีจุดรบกวนละเอียดทั่วภาพซึ่งตาแทบไม่เห็น
 *  แต่ตัวบีบต้องใช้บิตไปเก็บมันทุกเฟรม ลดจุดรบกวนก่อนจึงเล็กลงมาก
 *  โดยที่ภาพดูเหมือนเดิม */
const DENOISE = 'hqdn3d=4:3:8:6';
const SILENCE_DB = -40;    // ต่ำกว่านี้ถือว่าเงียบ

/** หา ffmpeg ตามลำดับนี้
 *
 *  ffmpeg ไม่ได้อยู่ใน dependencies ของโครงการโดยตั้งใจ — แพ็กเกจ ffmpeg-static
 *  จะดาวน์โหลดไฟล์ไบนารีเกือบ ๘๐ MB ทุกครั้งที่ติดตั้ง ซึ่งเครื่องที่ deploy
 *  ไม่เคยได้ใช้เลย เพราะไฟล์วิดีโอที่แปลงแล้ว commit ไว้ในโครงการอยู่แล้ว
 *  งานแปลงวิดีโอเป็นงานที่ทำนาน ๆ ครั้งบนเครื่องของคนทำเว็บเท่านั้น */
const which = (cmd) => {
  try { return execFileSync('sh', ['-c', `command -v ${cmd}`], { encoding: 'utf8' }).trim() || null; }
  catch { return null; }
};
let ffmpeg = process.env.FFMPEG_PATH || null;
if (!ffmpeg) { try { ffmpeg = (await import('ffmpeg-static')).default; } catch { /* ไม่ได้ติดตั้งไว้ */ } }
if (!ffmpeg) ffmpeg = which('ffmpeg');
if (!ffmpeg || !existsSync(ffmpeg)) {
  console.error('ไม่พบ ffmpeg — เลือกอย่างใดอย่างหนึ่ง');
  console.error('  npm install --no-save ffmpeg-static      (ง่ายที่สุด ไม่ค้างอยู่ในโครงการ)');
  console.error('  brew install ffmpeg  /  apt install ffmpeg');
  console.error('  FFMPEG_PATH=/path/to/ffmpeg npm run video');
  process.exit(1);
}

const run = (args) => execFileSync(ffmpeg, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
/** ffmpeg รายงานข้อมูลไฟล์และผลวิเคราะห์ทาง stderr เสมอ ไม่ว่าจะจบด้วยรหัสอะไร
 *  ถ้าอ่านเฉพาะตอนที่มันคืนรหัสผิดพลาด จะพลาดผลของคำสั่งที่ทำงานสำเร็จไปทั้งหมด */
const stderrOf = (args) => String(spawnSync(ffmpeg, args, { encoding: 'utf8' }).stderr ?? '');
const probe = (file) => stderrOf(['-hide_banner', '-i', file]);

if (!existsSync(SRC)) { console.error(`ไม่พบโฟลเดอร์ ${SRC}`); process.exit(1); }
await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => ['.mp4', '.mov', '.m4v', '.webm'].includes(extname(f).toLowerCase()));
if (files.length === 0) console.log('ยังไม่มีวิดีโอใน video-src/');

for (const file of files.sort()) {
  const name = basename(file, extname(file));
  const input = join(SRC, file);
  const outMp4 = join(OUT, `${name}.mp4`);
  const outPoster = join(OUT, `${name}-poster.jpg`);
  const info = probe(input);

  const size = info.match(/,\s(\d{2,5})x(\d{2,5})[\s,]/);
  const dur = info.match(/Duration:\s(\d+):(\d+):(\d+\.\d+)/);
  const seconds = dur ? +dur[1] * 3600 + +dur[2] * 60 + +dur[3] : 0;

  let keepAudio = /Stream .*: Audio:/.test(info);
  if (keepAudio) {
    const vol = stderrOf(['-hide_banner', '-i', input, '-af', 'volumedetect', '-f', 'null', '-']);
    const mean = vol.match(/mean_volume:\s(-?[\d.]+) dB/);
    if (mean && Number(mean[1]) < SILENCE_DB) {
      keepAudio = false;
      console.log(`  · ${file}: เสียงเฉลี่ย ${mean[1]} dB ถือว่าเงียบ — ตัดแทร็กเสียงทิ้ง`);
    }
  }

  run([
    '-y', '-hide_banner', '-loglevel', 'error', '-i', input,
    '-vf', DENOISE,
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', String(CRF),
    '-pix_fmt', 'yuv420p',
    // คีย์เฟรมทุก 2 วินาที ทำให้เลื่อนดูแล้วกระโดดไปตรงจุดได้เร็ว
    '-g', '48', '-keyint_min', '48', '-sc_threshold', '0',
    ...(keepAudio ? ['-c:a', 'aac', '-b:a', '96k'] : ['-an']),
    '-movflags', '+faststart',
    outMp4,
  ]);

  // ภาพปกต้องเป็นเฟรมแรกของคลิปเอง ไม่ใช่ภาพอื่นที่สัดส่วนไม่ตรง
  // ไม่งั้นตอนกดเล่นภาพจะกระตุกเปลี่ยนสัดส่วนต่อหน้าคนดู
  run(['-y', '-hide_banner', '-loglevel', 'error', '-i', input, '-frames:v', '1', '-q:v', '3', outPoster]);

  const before = (await stat(input)).size;
  const after = (await stat(outMp4)).size;
  console.log(
    `${file}: ${size ? `${size[1]}×${size[2]}` : '?'} · ${seconds.toFixed(1)} วินาที · ` +
    `${(before / 1e6).toFixed(1)} → ${(after / 1e6).toFixed(1)} MB (${Math.round((1 - after / before) * 100)}% เล็กลง)`,
  );
  console.log(`  ใส่ค่านี้ใน src/data/site.json → video: { file: "${name}.mp4", bytes: ${after}, width: ${size?.[1]}, height: ${size?.[2]} }`);
}
