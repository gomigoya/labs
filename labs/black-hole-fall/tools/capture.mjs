// node tools/capture.mjs [--url http://localhost:5184/] [--out shots/r1] [--only hero,preset-3] [--lite]
// With no --url, serve the lab and the capture POST endpoint locally for this run.
process.env.TEMP = process.env.TMP = 'D:/CodexWork/Temp';
process.env.PLAYWRIGHT_BROWSERS_PATH ||= 'D:/devcache/ms-playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (key, fallback) => { const i = process.argv.indexOf(`--${key}`); return i >= 0 ? process.argv[i + 1] : fallback; };
const output = path.resolve(root, arg('out', 'shots/r3'));
const selected = arg('only', '').split(',').filter(Boolean);
const lite = process.argv.includes('--lite');
fs.mkdirSync(output, { recursive: true });
let server, browser;
const report = [];
try {
  try { ({ chromium } = require('playwright')); }
  catch { ({ chromium } = createRequire('D:/marin/package.json')('playwright')); }
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
    await new Promise(resolve => server.listen(5184, '127.0.0.1', resolve)); url = 'http://127.0.0.1:5184/';
  }
  const states = [
    ...Array.from({length:6},(_,i)=>['intro','predict','act','event','confirm','card'].map(phase=>[`q${i+1}-${phase}`,i])).flat(),
    ['teacher-base',0],['teacher-play',0],['teacher-frame',0],['teacher-slow',0],['teacher-reset',0],['teacher-layers',0],['teacher-numbers',0],['teacher-ab',0],['teacher-predict',0],['teacher-spotlight',0],['teacher-laser',0],['teacher-recover',0],['attract-1',0],['attract-2',0],['attract-3',0],['touch-pulse',0],['thumb',0],
    ['hero',0], ...Array.from({length:8},(_,i)=>[`preset-${i}`,i]),
    ['shot-1',0],['shot-2',2],['shot-3',3],['shot-4',5],['shot-5',3],['console',0],
    ['extreme-far',6],['extreme-near',6],['cutaway',3],['horizon-records',4],
    ...Array.from({length:6},(_,i)=>[`layer-${i}`,i===5?7:3]),
    ['compare-pin',2],['shader-close',3],
    ...Array.from({length:3},(_,i)=>[`all-near-${i}`,i]),
    ...Array.from({length:3},(_,i)=>[`all-far-${i}`,i])
  ];
  browser = await chromium.launch({ headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
  for (const [viewportName, width, height] of [['teacher',1920,1080], ['compact',1280,720], ['desktop', 1440, 900], ['mobile', 375, 812]]) {
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
    const startupConsoleErrors=[...consoleErrors],startupPageErrors=[...pageErrors];
    for (const [name, preset] of states) {
      if (selected.length && !selected.includes(name)) continue;
      if(mobile&&/^q[1-6]-/.test(name)&&!/(predict|card)$/.test(name))continue;
      const c0 = consoleErrors.length, p0 = pageErrors.length, r0=requestErrors.length;
      const result = await page.evaluate(({ name, preset, mobile }) => {
        const lab = window.__lab;
        lab.attract.wake(false);
        if(/^(teacher-|attract-|touch-pulse$|thumb$)/.test(name)){
          lab.teacher.mode('teacher');lab.teacher.select(2);lab.step(1,0);
          if(name==='teacher-play'){lab.teacher.command('play');lab.step(120,1/30);}
          if(name==='teacher-frame')lab.teacher.command('frame');
          if(name==='teacher-slow'){lab.teacher.command('slow');lab.teacher.command('play');lab.step(120,1/30);}
          if(name==='teacher-reset'){lab.teacher.command('ab');lab.teacher.command('numbers');lab.teacher.reset();}
          if(name==='teacher-layers')for(let j=0;j<lab.teacher.config.layerOrder.length;j++)lab.teacher.stack();
          if(name==='teacher-numbers')lab.teacher.command('numbers');
          if(name==='teacher-ab'){lab.teacher.command('ab');lab.set('r',20);lab.step(120,1/30);}
          if(name==='teacher-predict')lab.teacher.command('predict');
          if(name==='teacher-spotlight')lab.teacher.command('spotlight');
          if(name==='teacher-laser')lab.teacher.command('laser');
          if(name==='teacher-recover')lab.attract.fail();
          if(name.startsWith('attract-')){lab.teacher.mode('free');lab.attract.start(Number(name.slice(-1))-1);lab.step(120,1/30);}
          if(name==='touch-pulse'){lab.teacher.mode('free');lab.attract.start();lab.attract.wake();}
          if(name==='thumb'){lab.teacher.mode('free');lab.teacher.config.ui(false);lab.shot(1,false);}
          lab.step(1,0);
          const strip=document.getElementById('teacher-strip'),r=strip.getBoundingClientRect();
          return {textAudit:lab.textAudit(),coverage:lab.heroCoverage(),perf:lab.perf(),horizontalScroll:document.documentElement.scrollWidth>innerWidth+1,
            teacherStrip:{x:r.x,y:r.y,right:r.right,bottom:r.bottom,scrollHeight:strip.scrollHeight,clientHeight:strip.clientHeight,clipped:!strip.hidden&&(strip.scrollHeight>strip.clientHeight+1||r.bottom>innerHeight||r.top<0)},
            touchTargets:[...strip.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return {width:r.width,height:r.height};})};
        }
        const questMatch=/^q([1-6])-(intro|predict|act|event|confirm|card)$/.exec(name);
        if(questMatch){
          const i=Number(questMatch[1])-1,phase=questMatch[2];
          if(['event','confirm','card'].includes(phase)){
            lab.quest.auto(i);
            if(phase==='event'){lab.quest.skip('event');lab.step(12,1/30);}
            if(phase==='confirm'){lab.quest.skip('confirm');lab.step(1,0);}
          }else{
            lab.quest.go(i);
            if(phase==='intro')lab.step(12,1/30);
            else{lab.step(90,1/30);if(phase==='act'){lab.quest.pick(i===4||i===5?1:2);lab.step(1,0);}}
          }
          const coverage=lab.heroCoverage(),pictures=document.getElementById('q-pictures'),rect=pictures.getBoundingClientRect(),b=coverage.bounds;
          return {quest:lab.quest.state(),textAudit:lab.textAudit(),coverage,perf:lab.perf(),
            horizontalScroll:document.documentElement.scrollWidth>innerWidth+1,
            pictureBounds:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},
            pictureOverlapsDevice:!!rect.height&&b.left<rect.right&&b.right>rect.left&&b.top<rect.bottom&&b.bottom>rect.top,
            smallTargets:[...document.querySelectorAll('button')].filter(el=>el.getClientRects().length).map(el=>({aria:el.getAttribute('aria-label'),r:el.getBoundingClientRect()})).filter(({r})=>r.width<55.9||r.height<55.9).map(({aria})=>aria)};
        }
        lab.quest.mode(true);lab.preset(preset);lab.set('playing',false);
        const grammar=window.GRAMMAR;grammar.unpin();grammar.set(grammar.defaults);
        if(name.startsWith('layer-')){grammar.set(Object.fromEntries(grammar.LAYERS.map((n,i)=>[n,i===Number(name.slice(-1))])));}
        if(name.startsWith('all-')){grammar.set(Object.fromEntries(grammar.LAYERS.map(n=>[n,true])));lab.set('massIndex',Number(name.slice(-1)));lab.set('r',name.includes('near')?0.0005:1000);}
        if(name==='compare-pin'){lab.step(120,1/30);grammar.pin();lab.set('r',20);grammar.set({[grammar.LAYERS[4]]:true});}
        if(name==='shader-close')grammar.set({[grammar.LAYERS[5]]:true});
        if(name==='extreme-far')lab.set('r',lab.PHYS.RANGE.r[1]);
        if(name==='extreme-near')lab.set('r',lab.PHYS.RANGE.r[0]);
        if(name==='cutaway')lab.set('cutaway',true);
        lab.step(120,1/30);
        if(name==='horizon-records'){lab.set('massIndex',1);lab.step(120,1/30);}
        const match=/^shot-(\d)$/.exec(name);
        if(name==='shader-close')lab.shot(mobile?0:4,mobile);
        else if(name==='console')lab.shot('console',mobile);
        else if(match){const i=Number(match[1]);lab.shot(mobile?(i<4?1:2):i,mobile);}
        else lab.shot(mobile?0:1,mobile);
        lab.step(1,0);
        return {textAudit:lab.textAudit(),coverage:lab.heroCoverage(),perf:lab.perf(),
          r:lab.PHYS.rFromRailX(lab.state.u.value),massIndex:Math.round(lab.state.massIndex.value),
          layers:{...grammar.enabled},pin:grammar.baseline,
          horizontalScroll:document.documentElement.scrollWidth>innerWidth+1};
      }, { name, preset, mobile });
      if(name==='thumb'&&server){await page.evaluate(()=>window.__lab.capture('thumb'));fs.copyFileSync(path.join(output,'thumb.jpg'),path.join(root,'thumb.jpg'));}
      if(['teacher-laser','teacher-spotlight'].includes(name))await page.mouse.move(width*.45,height*.45);
      const file = `${name}-${viewportName}.jpg`;
      if (server) await page.evaluate(name => window.__lab.capture(name), `${name}-${viewportName}-canvas`);
      await page.screenshot({ path: path.join(output, file), type: 'jpeg', quality: 92, animations: 'disabled' });
      const row = { file, ...result, consoleErrorCount: consoleErrors.length - c0, pageErrorCount: pageErrors.length - p0,
        textWordCount: result.textAudit.reduce((n, r) => n + r.words.length, 0), consoleErrors: consoleErrors.slice(c0), pageErrors: pageErrors.slice(p0),
        startupConsoleErrors,startupPageErrors,requestErrors:requestErrors.slice(r0) };
      report.push(row);
      console.log(`${file}: console.error=${row.consoleErrorCount}, pageerror=${row.pageErrorCount}, startup=${row.startupConsoleErrors.length + row.startupPageErrors.length}, hscroll=${row.horizontalScroll}, textWords=${row.textWordCount}, coverage=${JSON.stringify(row.coverage)}`);
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
