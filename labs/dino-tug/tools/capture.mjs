// node tools/capture.mjs [--url http://localhost:5181/] [--out shots/r1] [--only hero,capacity] [--lite]
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
try { ({chromium}=require('playwright')); }
catch { ({chromium}=createRequire(process.env.LAB_NODE_PACKAGE || 'D:/marin/package.json')('playwright')); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (key, fallback) => { const i = process.argv.indexOf(`--${key}`); return i >= 0 ? process.argv[i + 1] : fallback; };
const output = path.resolve(root, arg('out', 'shots/r4'));
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
  const states = [ ['hero',0],['triceratops-threshold',1],['tyrannosaurus-gravel',2],['tyrannosaurus-glass',3],['tyrannosaurus-sand',4],['design-team',5],['largest-max-team',6],['queue',0],['contact',2],['free-event',3],['capacity',2],['ratio',6],['console',0], ...Array.from({length:8},(_,i)=>['layer-'+i,2]), ['comparison-pin',2],['extreme-min',0],['extreme-max',6],['layers-together',6],['force-shader-close',2],['surface-glass',3],['surface-sand',4],['surface-gravel',2],['surface-asphalt',6] ];
  for(let i=1;i<=7;i++)for(const phase of ['intro','predict','act','event','confirm','card'])states.push([`q${i}-${phase}`,0]);
  for(const name of ['teacher-strip','teacher-layers','teacher-ab','teacher-spot','teacher-laser','teacher-numbers','teacher-class-predict','teacher-class-result','attract-1','attract-2','attract-3','touch-pulse','thumb'])states.push([name,name==='thumb'?2:0]);
  for(const mode of ['student','free','teacher','attract'])for(let i=1;i<=3;i++)states.push([`vertical-${mode}-${i}`,0]);
  browser = await chromium.launch({ headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
  for (const [viewportName, width, height] of [['desktop', 1440, 900], ['mobile', 375, 812], ['projector',1920,1080], ['compact',1280,720]]) {
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
    for (const [name, preset] of states) {
      if(['projector','compact'].includes(viewportName)&&name!=='teacher-strip')continue;
      if(name==='thumb'&&viewportName!=='desktop')continue;
      if(name.startsWith('vertical-')&&!mobile)continue;
      if (selected.length && !selected.includes(name)) continue;
      const c0 = consoleErrors.length, p0 = pageErrors.length;
      const result = await page.evaluate(({ name, preset, mobile }) => {
        const lab = window.__lab;
        lab.attract.wake(false);
        const special = /^(teacher-|attract-|touch-pulse|thumb|vertical-)/.test(name);
        if (special) {
          const vertical = /^vertical-(student|free|teacher|attract)-(\d)$/.exec(name);
          if (name.startsWith('teacher-') || vertical?.[1] === 'teacher') lab.teacher.mode('teacher');
          else if (name === 'thumb' || vertical?.[1] === 'free') lab.teacher.mode('free');
          if (name === 'thumb') { const r=lab.PHYS.DRAMA.representative;lab.set('kids',r.n);lab.set('species',r.speciesIndex);lab.set('ground',r.groundIndex);lab.set('t',r.phase);lab.set('playing',false); }
          if (name === 'teacher-layers') for (let i = 0; i < 3; i++) lab.teacher.stack();
          if (name === 'teacher-ab') { lab.teacher.command('ab'); lab.preset(2); }
          if (name === 'teacher-spot') lab.teacher.command('spotlight');
          if (name === 'teacher-laser') lab.teacher.command('laser');
          if (name === 'teacher-numbers') { lab.preset(2); lab.teacher.command('numbers'); }
          if (name === 'teacher-class-predict'||name === 'teacher-class-result') { lab.teacher.select(2); lab.teacher.command('predict'); }
          if(name==='teacher-class-result'){lab.teacher.config.predict(false,0);lab.teacher.prediction();}
          if (name.startsWith('attract-')) { lab.attract.start(Number(name.at(-1))-1); lab.step(90,1/30); }
          if (name === 'touch-pulse') { lab.attract.start(); lab.attract.wake(); }
          if (vertical?.[1] === 'attract') lab.attract.start();
          if (vertical) { lab.shot(Number(vertical[2]) - 1, true); lab.state.fly = null; }
          if (!name.startsWith('attract-') && name !== 'touch-pulse') lab.step(100, 1 / 30);
          lab.step(1, 0);
          return { textAudit: lab.textAudit(), coverage: lab.heroCoverage(), perf: lab.perf(),
            occlusion: [...document.querySelectorAll('#quests,#teacher-strip,#teacher-numbers,#q-pictures')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden').map(el => {
              const r = el.getBoundingClientRect(), b = lab.heroCoverage().bounds;
              return { id: el.id, intentional: !document.getElementById('teacher-class').hidden, overlaps: b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top };
            }),
            toolbarBounds:(()=>{const e=document.getElementById('teacher-strip'),r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,clipped:r.bottom>innerHeight||r.top<0||(!mobile&&e.scrollHeight>e.clientHeight+1)};})(),
            teacher: { ...lab.teacher.state }, attract: { ...lab.attract.state },
            touchTargets: [...document.querySelectorAll('button')].filter(b => b.getClientRects().length && getComputedStyle(b).visibility !== 'hidden').map(b => ({ label: b.getAttribute('aria-label'), width: b.getBoundingClientRect().width, height: b.getBoundingClientRect().height })),
            horizontalScroll: document.documentElement.scrollWidth > innerWidth + 1 };
        }

        const questMatch=/^q(\d+)-(\w+)$/.exec(name);
        if(questMatch){
          const i=Number(questMatch[1])-1,phase=questMatch[2];
          lab.quest.go(i);
          if(phase==='intro')lab.step(15,1/30);
          else if(phase==='predict'||phase==='act'){lab.step(90,1/30);if(phase==='act')lab.quest.pick(0);}
          else{lab.quest.auto(i);lab.quest.skip(phase);if(phase==='event')lab.step(15,1/30);}
          lab.step(1,0);
          const bounds=lab.heroCoverage().bounds;
          return {quest:lab.quest.state(),textAudit:lab.textAudit(),coverage:lab.heroCoverage(),perf:lab.perf(),
            occlusion:[...document.querySelectorAll('#quests,#tools,#q-pictures')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>{const r=el.getBoundingClientRect();return {id:el.id,overlaps:bounds.left<r.right&&bounds.right>r.left&&bounds.top<r.bottom&&bounds.bottom>r.top};}),
            touchTargets:[...document.querySelectorAll('button')].filter(b=>b.getClientRects().length).map(b=>({label:b.getAttribute('aria-label'),width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height})),
            horizontalScroll:document.documentElement.scrollWidth>innerWidth+1};
        }
        lab.quest.mode(true);
        lab.GRAMMAR.unpin();lab.GRAMMAR.set({...lab.GRAMMAR.defaults});
        lab.preset(preset);lab.step(90,1/60);
        if(name.startsWith('layer-')){const index=Number(name.slice(6));lab.GRAMMAR.set(Object.fromEntries(lab.GRAMMAR.LAYERS.map((n,i)=>[n,i===index])));if(index===3){lab.GRAMMAR.pin();lab.set('ground',0);}if(index===7)lab.GRAMMAR.record();}
        if(name==='comparison-pin'){lab.step(90,1/60);lab.GRAMMAR.pin();lab.set('ground',0);}
        if(name==='layers-together'){lab.GRAMMAR.set(Object.fromEntries(lab.GRAMMAR.LAYERS.map(n=>[n,true])));lab.GRAMMAR.pin();lab.GRAMMAR.record();}
        if(name.startsWith('surface-'))lab.GRAMMAR.set({[lab.GRAMMAR.LAYERS[4]]:true});
        if(name==='free-event'){lab.set('playing',true);lab.step(24,1/60);return {textAudit:lab.textAudit(),coverage:lab.heroCoverage(),perf:lab.perf()};}
        lab.set('playing',true);lab.step(60,1/60);lab.set('playing',false);lab.step(60,1/60);
        const horizontal={queue:2,contact:3,capacity:4,ratio:5,'force-shader-close':4,'surface-glass':3,'surface-sand':3,'surface-gravel':3,'surface-asphalt':3};
        const vertical={queue:1,contact:2,capacity:1,ratio:2,'force-shader-close':1,'surface-glass':2,'surface-sand':2,'surface-gravel':2,'surface-asphalt':2};
        lab.shot(name==='console'?'console':mobile?(vertical[name]??0):(horizontal[name]??1),mobile);
        lab.step(24,1/60);
        if(name.startsWith('surface-')){lab.set('ground',1);lab.step(1,0);lab.set('ground',preset===6?3:preset===3?0:preset===4?1:2);lab.step(12,1/60);}
        return {textAudit:lab.textAudit(),coverage:lab.heroCoverage(),perf:lab.perf(),state:lab.step(0),layers:lab.GRAMMAR.enabled,pinned:!!lab.GRAMMAR.baseline,horizontalScroll:document.documentElement.scrollWidth>innerWidth+1};
      }, { name, preset, mobile });
      const file = `${name}-${viewportName}.jpg`;
      if(name==='teacher-spot'||name==='teacher-laser'){await page.mouse.move(width*.44,height*.45);await page.mouse.move(width*.48,height*.48,{steps:8});}
      if(name==='touch-pulse')await page.evaluate(()=>{const p=document.getElementById('touch-pulse');p.style.animation='none';p.style.opacity='1';});
      if(name==='thumb'){if(!server)throw new Error('thumb requires local capture endpoint');const r=await page.evaluate(()=>window.__lab.capture('thumb'));if(r.width!==1200||r.height!==750)throw new Error('thumb size');fs.copyFileSync(path.join(output,'thumb.jpg'),path.join(root,'thumb.jpg'));continue;}
      if (server) await page.evaluate(name => window.__lab.capture(name), `${name}-${viewportName}-canvas`);
      await page.screenshot({ path: path.join(output, file), type: 'jpeg', quality: 92, animations: 'disabled' });
      const row = { file, ...result, consoleErrorCount: consoleErrors.length - c0, pageErrorCount: pageErrors.length - p0,
        textWordCount: result.textAudit.reduce((n, r) => n + r.words.length, 0), consoleErrors: consoleErrors.slice(c0), pageErrors: pageErrors.slice(p0),
        startupConsoleErrors: consoleErrors.slice(0, c0), startupPageErrors: pageErrors.slice(0, p0), requestErrors: [...requestErrors] };
      report.push(row);
      const fullHero=!['queue','contact','capacity','ratio','console','force-shader-close'].includes(name)&&!name.startsWith('surface-')&&!/^(teacher-|attract-|touch-pulse|vertical-)/.test(name)&&!/^q\d+-intro$/.test(name);
      if(row.toolbarBounds?.clipped||row.touchTargets?.some(b=>!b.label||b.width<(row.teacher?.mode==='teacher'?72:56)||b.height<(row.teacher?.mode==='teacher'?72:56))||row.occlusion?.some(o=>o.overlaps&&!o.intentional)||((fullHero&&(row.coverage.clipped||row.coverage.overlaps||row.coverage.width<.6))||row.consoleErrorCount||row.pageErrorCount||row.startupConsoleErrors.length||row.startupPageErrors.length||row.horizontalScroll||row.textWordCount||requestErrors.length))process.exitCode=1;
      console.log(`${file}: console.error=${row.consoleErrorCount}, pageerror=${row.pageErrorCount}, startup=${row.startupConsoleErrors.length + row.startupPageErrors.length}, hscroll=${row.horizontalScroll}, textWords=${row.textWordCount}, heroCoverage=${JSON.stringify(row.coverage)}`);
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
