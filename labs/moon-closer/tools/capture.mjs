// node tools/capture.mjs [--url http://localhost:5181/] [--out shots/m2] [--only hero,ring] [--lite]
// With no --url, serve the lab and the capture POST endpoint locally for this run.
process.env.TEMP = process.env.TMP = 'D:/CodexWork/Temp';
process.env.PLAYWRIGHT_BROWSERS_PATH ||= 'D:/devcache/ms-playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('D:/marin/package.json');
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (key, fallback) => { const i = process.argv.indexOf(`--${key}`); return i >= 0 ? process.argv[i + 1] : fallback; };
const output = path.resolve(root, arg('out', 'shots/m2'));
const selected = arg('only', '').split(',').filter(Boolean);
const lite = process.argv.includes('--lite');
fs.mkdirSync(output, { recursive: true });
let server, browser;
const report = [];
try {
  let url = arg('url', '');
  if (!url) {
    server = http.createServer(async (req, res) => {
      try {
        const route = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        if (req.method === 'POST' && /^\/__save\/[\w-]+\.jpg$/.test(route)) {
          let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 32 * 1024 * 1024) throw new Error('size'); }
          if (!body.startsWith('data:image/jpeg;base64,')) { res.writeHead(400).end(); return; }
          fs.writeFileSync(path.join(output, path.basename(route)), Buffer.from(body.slice(body.indexOf(',') + 1), 'base64'));
          res.writeHead(200).end(); return;
        }
        const file = path.resolve(root, `.${route === '/' ? '/index.html' : route}`);
        if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
        if (route === '/favicon.ico') { res.writeHead(204).end(); return; }
        const content = fs.readFileSync(file);
        res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'); res.end(content);
      } catch { res.writeHead(404).end(); }
    });
    await new Promise(resolve => server.listen(5181, '127.0.0.1', resolve)); url = 'http://127.0.0.1:5181/';
  }
  const states = [ ['hero', 0], ['tenCm', 1], ['half', 2], ['tenth', 3], ['twentieth', 4], ['ring', 5], ['rail-close', 0], ['console', 0], ['lens', 0], ['lens-half', 2], ['marks-half', 2], ['field-twentieth', 4], ['person', 4], ['sky', 0], ['sky-twentieth', 4], ['crack', 0] ];
  for (let i = 1; i <= 8; i++) for (const phase of ['intro', 'predict', 'act', 'event', 'confirm', 'card']) states.push([`q${i}-${phase}`, 0]);
  for (const name of ['teacher-strip', 'teacher-layers', 'teacher-ab', 'teacher-spot', 'teacher-laser', 'teacher-numbers', 'teacher-class-predict', 'attract-1', 'attract-2', 'attract-3', 'touch-pulse', 'thumb']) states.push([name, 0]);
  for (const mode of ['student', 'free', 'teacher', 'attract']) for (let i = 0; i < 3; i++) states.push([`vertical-${mode}-${i + 1}`, 0]);
  states.push(['environment-wide', 0], ['environment-low', 0]);
  browser = await chromium.launch({ headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
  for (const [viewportName, width, height] of [['desktop', 1440, 900], ['laptop', 1280, 720], ['mobile', 375, 812], ['projector', 1920, 1080]]) {
    const mobile = viewportName === 'mobile';
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    const consoleErrors = [], pageErrors = [], requestErrors = [];
    page.on('requestfailed', request => requestErrors.push({ url: request.url(), error: request.failure()?.errorText }));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', error => pageErrors.push(String(error)));
    const parsed = new URL(url); if (lite) parsed.searchParams.set('lite', '1');
    await page.goto(parsed.href, { waitUntil: 'load' });
    try { await page.waitForFunction(() => !!window.__lab, null, { timeout: 60000 }); }
    catch (error) { report.push({ viewportName, startupConsoleErrors: consoleErrors, startupPageErrors: pageErrors, requestErrors }); console.error(JSON.stringify(report.at(-1))); throw error; }
    // Requirements, independent of MISSION's implementation: every visible phase,
    // short Korean copy, changed instructions, free exploration, teacher exclusion.
    const missionChecks = await page.evaluate(() => {
      const lab = window.__lab, mission = document.getElementById('mission');
      let checks = 0;
      const check = (ok, reason) => { if (!ok) throw new Error(`mission: ${reason}`); checks++; };
      const visible = el => el.getClientRects().length && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
      const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      lab.attract.wake(false); lab.teacher.mode('student');
      check(mission.getAttribute('role') === 'status' && mission.getAttribute('aria-live') === 'polite', 'live status');
      check(getComputedStyle(mission).pointerEvents === 'none', 'must not intercept controls');
      check(parseFloat(getComputedStyle(mission).fontSize) >= 15, 'minimum font size');
      for (let i = 0; i < 8; i++) {
        lab.quest.go(i); let previous = '';
        for (const phase of ['intro', 'predict', 'act', 'observe', 'confirm', 'card']) {
          lab.quest.skip(phase);
          const text = mission.textContent.trim();
          check(visible(mission) && /[가-힣]/u.test(text) && [...text].length <= 32, `Q${i + 1} ${phase} copy`);
          if (previous && phase !== 'card') check(text !== previous, `Q${i + 1} ${phase} changed`);
          previous = text;
          const bounds = mission.getBoundingClientRect();
          check(bounds.left >= 0 && bounds.right <= innerWidth && bounds.height <= 2 * parseFloat(getComputedStyle(mission).lineHeight) + 20, 'fits two lines');
          for (const el of document.querySelectorAll('#quests,#tools,#q-extra,#q-pictures,#person-card'))
            if (visible(el)) check(!overlaps(bounds, el.getBoundingClientRect()), `${phase} overlaps ${el.id}`);
          check(lab.textAudit().length === 0, 'no other visible words');
        }
      }
      lab.teacher.mode('free'); check(visible(mission) && mission.textContent === '마음대로 만져 보세요', 'free copy');
      lab.teacher.mode('teacher'); check(!visible(mission), 'hidden in teacher mode');
      lab.teacher.mode('student'); check(visible(mission), 'restored in student mode');
      return { checks, failures: 0 };
    });
    report.push({ viewportName, missionChecks });
    for (const [name, preset] of states) {
      if (selected.length && !selected.includes(name)) continue;
      if (['projector', 'laptop'].includes(viewportName) && name !== 'teacher-strip') continue;
      if (name.startsWith('vertical-') && !mobile) continue;
      if (name === 'thumb' && viewportName !== 'desktop') continue;
      const c0 = consoleErrors.length, p0 = pageErrors.length;
      const result = await page.evaluate(({ name, preset, mobile }) => {
        const lab = window.__lab;
        lab.attract.wake(false);
        const special = /^(teacher-|attract-|touch-pulse|thumb|vertical-)/.test(name);
        if (special) {
          const vertical = /^vertical-(student|free|teacher|attract)-(\d)$/.exec(name);
          if (name.startsWith('teacher-') || vertical?.[1] === 'teacher') lab.teacher.mode('teacher');
          else if (name === 'thumb' || vertical?.[1] === 'free') lab.teacher.mode('free');
          if (name === 'thumb') {
            lab.preset(2); lab.set('playing', false); lab.set('t', 0);
            for (const layer of ['ocean', 'reference', 'marks']) lab.layer(layer, true);
            for (const layer of ['field', 'lens', 'person', 'sky', 'limit', 'ring']) lab.layer(layer, false);
            // capture('thumb') consumes heroShot, so use a dedicated close composition.
            const hero = lab.teacher.config.heroShot; lab.__thumbHero = hero;
            lab.teacher.config.heroShot = { ...hero, pos: hero.pos.clone().set(.38, 1.86, 1.65),
              target: hero.target.clone().set(-.23, 1.32, 0), fov: 34 };
          }
          if (name === 'teacher-layers') for (let i = 0; i < 3; i++) lab.teacher.stack();
          if (name === 'teacher-ab') { lab.teacher.command('ab'); lab.preset(2); }
          if (name === 'teacher-spot') lab.teacher.command('spotlight');
          if (name === 'teacher-laser') lab.teacher.command('laser');
          if (name === 'teacher-numbers') { lab.preset(2); lab.teacher.command('numbers'); }
          if (name === 'teacher-class-predict') { lab.teacher.select(2); lab.teacher.command('predict'); }
          if (name.startsWith('attract-')) { lab.attract.start(Number(name.at(-1))); for (let i = 0; i < 3; i++) lab.step(120, 1 / 30); }
          if (name === 'touch-pulse') { lab.attract.start(); lab.attract.wake(); }
          if (vertical?.[1] === 'attract') lab.attract.start();
          if (vertical) { lab.shot(Number(vertical[2]) - 1, true); lab.state.fly = null; }
          if (!name.startsWith('attract-') && name !== 'touch-pulse') lab.step(100, 1 / 30);
          lab.step(1, 0);
          return { textAudit: lab.textAudit(), coverage: lab.heroCoverage(), perf: lab.perf(),
            occlusion: [...document.querySelectorAll('#mission,#quests,#teacher-strip,#teacher-numbers,#q-pictures,#person-card')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden').map(el => {
              const r = el.getBoundingClientRect(), b = lab.heroCoverage().bounds;
              return { id: el.id, overlaps: b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top };
            }),
            teacher: { ...lab.teacher.state }, attract: { ...lab.attract.state },
            touchTargets: [...document.querySelectorAll('button')].filter(b => b.getClientRects().length && getComputedStyle(b).visibility !== 'hidden').map(b => ({ label: b.getAttribute('aria-label'), width: b.getBoundingClientRect().width, height: b.getBoundingClientRect().height })),
            horizontalScroll: document.documentElement.scrollWidth > innerWidth + 1 };
        }
        const questMatch = /^q(\d+)-(\w+)$/.exec(name);
        if (questMatch) {
          const i = Number(questMatch[1]) - 1, phase = questMatch[2];
          lab.quest.go(i);
          if (phase === 'intro') lab.step(15, 1 / 30);
          if (phase === 'predict' || phase === 'act') { lab.step(90, 1 / 30); if (phase === 'act') lab.quest.pick(i === 7 ? 0 : 2); }
          else if (phase !== 'intro') { lab.quest.auto(i); lab.quest.skip(phase); if (phase === 'event') lab.step(15, 1 / 30); }
          lab.step(1, 0);
          return { quest: lab.quest.state(), textAudit: lab.textAudit(), coverage: lab.heroCoverage(), perf: lab.perf(), horizontalScroll: document.documentElement.scrollWidth > innerWidth + 1 };
        }
        lab.quest.mode(true);
        lab.layer('lens', false); lab.layer('person', false); lab.layer('sky', false);
        lab.set('playing', false); lab.set('t', 0); lab.set('lon0', 0.45); lab.preset(preset);
        if (name === 'crack') lab.set('closer', lab.PHYS.C.d0 - 17000e3);
        if (name.startsWith('lens')) lab.layer('lens', true);
        if (name === 'person') lab.layer('person', true);
        if (name.startsWith('sky')) lab.layer('sky', true);
        lab.step(120, 1 / 30);
        if (name.startsWith('sky')) lab.shot(mobile ? 2 : 5, mobile);
        else if (name.startsWith('lens')) lab.shot(mobile ? 0 : 1, mobile);
        else if (name === 'console') lab.shot('console', mobile);
        else if (name === 'rail-close') lab.shot(mobile ? 1 : 2, mobile);
        else lab.shot(mobile ? 0 : 1, mobile);
        if (name === 'environment-wide') lab.shot(0, false);
        if (name === 'environment-low') lab.quality('low');
        lab.step(1, 0);
        return { textAudit: lab.textAudit(), coverage: lab.heroCoverage(), perf: lab.perf(),
          closer: lab.state.u.value < 0 ? 0 : lab.PHYS.closerFromRailX(lab.state.u.value), horizontalScroll: document.documentElement.scrollWidth > innerWidth + 1 };
      }, { name, preset, mobile });
      const file = `${name}-${viewportName}.jpg`;
      if (name === 'teacher-spot' || name === 'teacher-laser') {
        await page.mouse.move(width * .44, height * .45); await page.mouse.move(width * .48, height * .48, { steps: 8 });
      }
      if (name === 'touch-pulse') await page.evaluate(() => { const pulse = document.getElementById('touch-pulse'); pulse.style.animation = 'none'; pulse.style.opacity = '1'; pulse.style.transform = 'scale(1)'; });
      if (name === 'thumb') {
        if (!server) throw new Error('thumb needs the local capture POST endpoint (omit --url)');
        const thumbnail = await page.evaluate(async () => { const lab = window.__lab; try { return await lab.capture('thumb'); } finally { lab.teacher.config.heroShot = lab.__thumbHero; delete lab.__thumbHero; } });
        fs.copyFileSync(path.join(output, 'thumb.jpg'), path.join(root, 'thumb.jpg')); // labs/moon-closer/thumb.jpg
        report.push({ file: 'thumb.jpg', ...thumbnail }); console.log(`thumb.jpg: ${thumbnail.width}x${thumbnail.height}`); continue;
      }
      if (server) await page.evaluate(name => window.__lab.capture(name), `${name}-${viewportName}-canvas`);
      await page.screenshot({ path: path.join(output, file), type: 'jpeg', quality: 92, animations: 'disabled' });
      const row = { file, ...result, consoleErrorCount: consoleErrors.length - c0, pageErrorCount: pageErrors.length - p0,
        textWordCount: result.textAudit.reduce((n, r) => n + r.words.length, 0), consoleErrors: consoleErrors.slice(c0), pageErrors: pageErrors.slice(p0),
        startupConsoleErrors: consoleErrors.slice(0, c0), startupPageErrors: pageErrors.slice(0, p0) };
      report.push(row);
      console.log(`${file}: console.error=${row.consoleErrorCount}, pageerror=${row.pageErrorCount}, startup=${row.startupConsoleErrors.length + row.startupPageErrors.length}, hscroll=${row.horizontalScroll}, textWords=${row.textWordCount}`);
    }
    await page.close();
  }
} catch (error) {
  report.push({ fatal: String(error) }); process.exitCode = 1; console.error(error);
} finally {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
}
