import { chromium } from 'playwright';
const out = '/tmp/claude-0/-home-user-guanyin/9545b1f0-0a51-5626-8a33-a6943e59bd8f/scratchpad/shots';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [name, url, w, h] of [
  ['v2-mobile', '/index.html', 390, 844],
  ['v2-desktop', '/index.html', 1440, 900],
  ['v2-tablet', '/index.html', 800, 900],
  ['v2-zh-mobile', '/zh.html', 390, 844],
]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:4321' + url, { waitUntil: 'networkidle' });
  await p.screenshot({ path: `${out}/${name}.png` });
  await p.close();
}
await b.close();
console.log('done');
