// node tools/capture.mjs [--url http://localhost:5181/] [--out shots/r1] [--only hero,console] [--lite]
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
try { ({ chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')); }
catch (error) {
  try { ({ chromium } = createRequire('D:/marin/package.json')('playwright')); }
  catch { throw new Error('Install playwright on D: or set PLAYWRIGHT_MODULE to its absolute D: module path', { cause: error }); }
}
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
  const states = [
    ['coastal-site',0,0],['coastal-liftoff',3,1],['coastal-platform',0,'console'],
    ['hero',0,1],['burnout-stays',1,1],['delayed-lift',2,1],['five-engines',3,1],
    ['medium-cargo',4,1],['large-cargo',5,1],['lunar-single',6,1],
    ...Array.from({length:6},(_,i)=>[`shot-${i}`,3,i]),['console',3,'console'],
    ...Array.from({length:8},(_,i)=>[`layer-${i}`,3,1,{layerIndex:i}]),
    ['comparison-pin',5,1,{pin:true}],['extreme-low',1,1,{extreme:'low'}],
    ['extreme-high',6,1,{extreme:'high'}],['shader-close',3,2,{shader:true}],
    ['all-layers',3,1,{all:true}],
  ];
  for(let i=1;i<=6;i++)for(const phase of ['intro','predict','act','event','confirm','card'])states.push([`q${i}-${phase}`,0,1]);
  for(const name of ['teacher-strip','teacher-layers','teacher-ab','teacher-spot','teacher-laser','teacher-numbers','teacher-class-predict','teacher-class-result','attract-1','attract-2','attract-3','touch-pulse','thumb'])states.push([name,3,1]);
  for(const mode of ['student','free','teacher','attract'])for(let i=0;i<3;i++)states.push([`vertical-${mode}-${i+1}`,3,i]);
  browser = await chromium.launch({ headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
  for (const [viewportName, width, height] of [['desktop', 1440, 900], ['mobile', 375, 812], ['projector',1920,1080], ['small-desktop',1280,720]]) {
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
    // Browser contract: visible language follows every real phase; teacher mode hides it.
    const missionChecks=await page.evaluate(()=>{
      const lab=window.__lab,failures=[],banner=document.getElementById('mission');
      lab.teacher.mode('student');
      if(banner.getAttribute('role')!=='status'||banner.getAttribute('aria-live')!=='polite')failures.push('mission accessibility');
      for(let i=0;i<6;i++){
        let previous='';
        for(const phase of ['intro','predict','act','observe','confirm','card']){
          lab.quest.go(i);lab.quest.phase(phase);
          const text=banner.textContent;
          if(!text.trim()||[...text].length>32||text===previous||!banner.getClientRects().length)failures.push(`Q${i+1}/${phase}`);
          previous=text;
          if(lab.textAudit().length)failures.push(`Q${i+1}/${phase}: unexpected text`);
        }
      }
      lab.teacher.mode('free');
      if(banner.textContent!=='마음대로 만져 보세요'||!banner.getClientRects().length)failures.push('free mission');
      lab.teacher.mode('teacher');
      if(banner.getClientRects().length)failures.push('teacher mission visible');
      lab.teacher.mode('student');
      return{viewportName,missionContract:true,failures};
    });
    report.push(missionChecks);if(missionChecks.failures.length)process.exitCode=1;
    for (const [name, preset, shotIndex, config = {}] of states) {
      if((viewportName==='projector'||viewportName==='small-desktop')&&name!=='teacher-strip')continue;
      if(name==='thumb'&&viewportName!=='desktop')continue;
      if(name.startsWith('vertical-')&&!mobile)continue;
      if (selected.length && !selected.includes(name)) continue;
      if(mobile&&/^q\d+-(intro|act|event|confirm)$/.test(name))continue;
      const c0 = consoleErrors.length, p0 = pageErrors.length, r0 = requestErrors.length;
      const result = await page.evaluate(({ name, preset, mobile, shotIndex, config }) => {
        const lab = window.__lab;
        lab.attract.wake(false);
        const special=/^(teacher-|attract-|touch-pulse|thumb|vertical-)/.test(name);
        if(special){
          const vertical=/^vertical-(student|free|teacher|attract)-(\d)$/.exec(name);
          lab.teacher.mode(name.startsWith('teacher-')||vertical?.[1]==='teacher'?'teacher':vertical?.[1]==='student'?'student':'free');
          if(name.startsWith('teacher-'))lab.teacher.select(1);
          if(name==='teacher-layers')for(let i=0;i<7;i++)lab.teacher.stack();
          if(name==='teacher-ab'){lab.preset(4);lab.teacher.command('ab');lab.preset(5);}
          if(name==='teacher-spot')lab.teacher.command('spotlight');
          if(name==='teacher-laser')lab.teacher.command('laser');
          if(name==='teacher-numbers'){lab.preset(3);lab.teacher.command('numbers');}
          if(name.startsWith('teacher-class-')){lab.teacher.select(2);lab.teacher.command('predict');if(name.endsWith('result')){lab.teacher.config.predict(false,1);lab.teacher.prediction();}}
          if(name.startsWith('attract-')){lab.attract.start(Number(name.at(-1))-1);lab.step(120,1/30);}
          if(name==='touch-pulse'){lab.attract.start();lab.attract.wake();}
          if(vertical?.[1]==='attract')lab.attract.start(Number(vertical[2])-1);
          if(vertical){lab.shot(Number(vertical[2])-1,true);lab.state.fly=null;}
          if(!name.startsWith('attract-')&&name!=='touch-pulse')lab.step(100,1/30);
          lab.step(1,0);
          return {textAudit:lab.textAudit(),coverage:lab.heroCoverage(),perf:lab.perf(),teacher:{...lab.teacher.state},attract:{...lab.attract.state},
            stripBounds:(()=>{const r=document.getElementById('teacher-strip').getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right,scrollHeight:document.getElementById('teacher-strip').scrollHeight,clientHeight:document.getElementById('teacher-strip').clientHeight};})(),
            touchTargets:[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{const r=e.getBoundingClientRect();return{label:e.getAttribute('aria-label'),width:r.width,height:r.height};}),
            horizontalScroll:document.documentElement.scrollWidth>innerWidth+1};
        }

        const match=/^q(\d+)-(\w+)$/.exec(name);
        if(match){
          const i=Number(match[1])-1,phase=match[2];lab.quest.go(i);
          if(phase==='intro')lab.step(15,1/30);
          else if(phase==='predict'||phase==='act'){lab.step(90,1/30);if(phase==='act')lab.quest.pick([2,2,1,1,1,2][i]);}
          else{lab.quest.auto(i);lab.quest.skip(phase);if(phase==='event')lab.step(15,1/30);}
          lab.step(1,0);
          const bounds=lab.heroCoverage().bounds;
          return {quest:lab.quest.state(),textAudit:lab.textAudit(),coverage:lab.heroCoverage(),perf:lab.perf(),
            occlusion:[...document.querySelectorAll('#quests,#mission,#tools,#q-pictures')].filter(e=>!e.hidden&&getComputedStyle(e).visibility!=='hidden').map(e=>{const r=e.getBoundingClientRect();return{id:e.id,overlaps:bounds.left<r.right&&bounds.right>r.left&&bounds.top<r.bottom&&bounds.bottom>r.top};}),
            touchTargets:[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return{label:e.getAttribute('aria-label'),width:r.width,height:r.height};}),
            horizontalScroll:document.documentElement.scrollWidth>innerWidth+1};
        }
        lab.quest.mode(true);
        const grammar=window.GRAMMAR;grammar.unpin();grammar.set(grammar.defaults);
        lab.preset(preset);
        if(config.layerIndex!==undefined)grammar.set(Object.fromEntries(grammar.LAYERS.map((n,i)=>[n,i===config.layerIndex])));
        if(config.all)grammar.set(Object.fromEntries(grammar.LAYERS.map(n=>[n,true])));
        if(config.layerIndex===6){grammar.pin();lab.preset(4);}
        if(config.pin){lab.preset(4);lab.step(120,1/30);grammar.pin();lab.preset(5);grammar.set(Object.fromEntries(grammar.LAYERS.map(n=>[n,true])));}
        if(config.extreme==='high'){lab.set('engines',5);lab.set('load',500000);lab.set('g',1.62);lab.step(120,1/30);lab.set('ignited',1);lab.set('t',lab.PHYS.burnTime(5));grammar.set(Object.fromEntries(grammar.LAYERS.map(n=>[n,true])));}
        if(config.shader){lab.set('t',0);lab.set('ignited',1);}

        lab.set('playing',0);
        lab.step(120,1/30);
        // Desktop follows the six theory-card shots. Portrait uses its own three-shot vocabulary.
        const portraitMap=[0,0,1,1,2,0];
        lab.shot(shotIndex==='console'?'console':mobile?portraitMap[shotIndex]:shotIndex,mobile);
        lab.step(1,0);
        const {engines,load,g,t,ignited}=lab.state;
        const input=lab.PHYS.sceneSelection(engines.value,load.value,g.value);
        return {layers:{...grammar.enabled},baseline:grammar.baseline,textAudit:lab.textAudit(),coverage:lab.heroCoverage(),perf:lab.perf(),
          input:{...input,t:t.value,ignited:!!ignited.target},
          horizontalScroll:document.documentElement.scrollWidth>innerWidth+1};
      }, { name, preset, mobile, shotIndex, config });
      // Let responsive strip measurement settle before checking the banner geometry.
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      result.mission=await page.evaluate(()=>{
        const e=document.getElementById('mission'),r=e.getBoundingClientRect(),visible=!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
        const overlaps=visible?[...document.querySelectorAll('#quests,#tools,#q-pictures')].filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden').filter(n=>{const b=n.getBoundingClientRect();return r.left<b.right&&r.right>b.left&&r.top<b.bottom&&r.bottom>b.top;}).map(n=>n.id):[];
        return{text:e.textContent,visible,overlaps,fontSize:parseFloat(getComputedStyle(e).fontSize),inViewport:!visible||(r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight),teacher:document.body.dataset.mode==='teacher'};
      });
      if(result.mission.overlaps.length||!result.mission.inViewport||result.mission.visible&&result.mission.fontSize<15||result.mission.teacher&&result.mission.visible)process.exitCode=1;
      if(name==='teacher-spot'||name==='teacher-laser'){await page.mouse.move(width*.4,height*.4);await page.mouse.move(width*.5,height*.5,{steps:8});}
      if(name==='touch-pulse')await page.evaluate(()=>{const e=document.getElementById('touch-pulse');e.hidden=false;e.style.animation='none';e.style.opacity='1';});
      if(name==='thumb'){
        if(!server)throw new Error('thumb requires the local capture POST endpoint; omit --url');
        const thumbnail=await page.evaluate(()=>window.__lab.capture('thumb'));
        fs.copyFileSync(path.join(output,'thumb.jpg'),path.join(root,'thumb.jpg'));
        report.push({file:'thumb.jpg',...thumbnail});console.log(`thumb.jpg: ${thumbnail.width}x${thumbnail.height}`);continue;
      }
      const file = `${name}-${viewportName}.jpg`;
      if (server) await page.evaluate(name => window.__lab.capture(name), `${name}-${viewportName}-canvas`);
      await page.screenshot({ path: path.join(output, file), type: 'jpeg', quality: 92, animations: 'disabled' });
      const row = { file, ...result, consoleErrorCount: consoleErrors.length - c0, pageErrorCount: pageErrors.length - p0,
        textWordCount: result.textAudit.reduce((n, r) => n + r.words.length, 0), consoleErrors: consoleErrors.slice(c0), pageErrors: pageErrors.slice(p0),
        startupConsoleErrors: consoleErrors.slice(0, c0), startupPageErrors: pageErrors.slice(0, p0),
        requestErrors: requestErrors.slice(r0), startupRequestErrors: requestErrors.slice(0,r0) };
      const fullHero=shotIndex===1 || (mobile && shotIndex!=='console');
      row.coveragePass=name==='teacher-strip'?(!row.coverage.clipped&&row.coverage.width>=.60&&row.coverage.width<=.75):name==='q2-event'?null:/^(teacher-|attract-|touch-pulse|vertical-)/.test(name)?null:/^q\d+-intro$/.test(name) ? null : (name.startsWith('q')||fullHero) ? !row.coverage.clipped && !row.coverage.overlapsTop && !row.coverage.overlapsTools && row.coverage.width >= .60 && row.coverage.width <= .75 : null;
      if(!mobile&&name==='teacher-strip'){row.stripPass=row.stripBounds.top>=0&&row.stripBounds.bottom<=height&&row.stripBounds.scrollHeight<=row.stripBounds.clientHeight+1;if(!row.stripPass)process.exitCode=1;}
      report.push(row);
      console.log(`${file}: console.error=${row.consoleErrorCount}, pageerror=${row.pageErrorCount}, startup=${row.startupConsoleErrors.length + row.startupPageErrors.length}, hscroll=${row.horizontalScroll}, textWords=${row.textWordCount}, coverage=${JSON.stringify(row.coverage)}`);
      if(row.consoleErrorCount || row.pageErrorCount || row.startupConsoleErrors.length || row.startupPageErrors.length || row.horizontalScroll || row.textWordCount || row.coveragePass===false || row.occlusion?.some(o=>o.overlaps) || row.touchTargets?.some(b=>!b.label||b.width<56||b.height<56)) process.exitCode=1;
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
