// 실험실 캡처 세트: node tools/capture.mjs --url http://localhost:5181/ --out labs/hydraulic-ram/shots/r1 [--only hero,help]
// Playwright는 D:/marin/node_modules 것을 빌려 쓴다(브라우저: PLAYWRIGHT_BROWSERS_PATH).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ||= 'D:/devcache/ms-playwright';
const require = createRequire('D:/marin/package.json');
const { chromium } = require('playwright');

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const URL = arg('url', 'http://localhost:5181/');
const OUT = path.resolve(arg('out', 'shots/cap'));
const ONLY = arg('only', '') ? arg('only').split(',') : null;
fs.mkdirSync(OUT, { recursive: true });

// 각 상태: 페이지 안에서 실행할 준비 함수(__lab 사용) + 정착 시간
const STATES = [
  ['hero', `__lab.preset(0)`],
  ['preset-low', `__lab.preset(0)`],
  ['preset-high', `__lab.preset(1)`],
  ['preset-light', `__lab.preset(2)`],
  ['preset-heavy', `__lab.preset(3)`],
  ['extreme-min', `__lab.set('H',1);__lab.set('h',40);__lab.set('m',0.9)`],
  ['extreme-max', `__lab.set('H',4);__lab.set('h',5);__lab.set('m',0.1)`],
  ['explode', `__lab.preset(0);__lab.view('explode')`],
  ['studio', `__lab.preset(0);__lab.view('studio')`],
  ['overlays-off', `__lab.preset(0);['P','F','G'].forEach(k=>__lab.overlay(k,false))`],
  ['top', `__lab.preset(0);__lab.shot(3)`],
  ['console', `__lab.preset(0);__lab.shot(5)`],
  ['help', `__lab.preset(0);dispatchEvent(new KeyboardEvent('keydown',{key:'?'}))`],
  ['tour2', `__lab.tour.go(1)`],
];
const VIEWPORTS = [['d', 1440, 900], ['m', 375, 812]];

const browser = await chromium.launch({ headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const report = [];
// 뷰포트마다 페이지 하나를 재사용하고, 상태 사이에는 초기화한다(재로딩은 느리다).
const RESET = `__lab.preset(0);dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));__lab.tour.end();__lab.view('lab');['P','F','G'].forEach(k=>__lab.overlay(k,true));__lab.shot(0, innerWidth/innerHeight<0.9);`;
for (const [vk, w, h] of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: vk === 'm', hasTouch: vk === 'm' });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__lab && window.__lab.sim, null, { timeout: 60000 });
  await page.waitForTimeout(2500); // 자동 시동
  for (const [name, prep] of STATES) {
    if (ONLY && !ONLY.includes(name)) continue;
    const e0 = errors.length;
    await page.evaluate(`(()=>{${RESET}__lab.start();${prep}})()`);
    await page.waitForTimeout(name === 'tour2' || name === 'top' || name === 'console' ? 3500 : 2200);
    const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    const file = `${name}-${vk}.jpg`;
    await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 88 });
    const ne = errors.length - e0;
    report.push({ file, errors: ne, hscroll, ...(ne ? { first: errors[e0].slice(0, 200) } : {}) });
    console.log(file, ne, hscroll);
  }
  await page.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
