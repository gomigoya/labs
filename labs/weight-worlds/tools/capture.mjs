// node tools/capture.mjs [--url http://localhost:5182/] [--out shots/r1] [--only hero,moon] [--lite]
// With no --url, serve the lab and the capture POST endpoint locally for this run.
process.env.TEMP = process.env.TMP = 'D:/CodexWork/Temp';
process.env.PLAYWRIGHT_BROWSERS_PATH ||= 'D:/devcache/ms-playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (key, fallback) => { const i = process.argv.indexOf(`--${key}`); return i >= 0 ? process.argv[i + 1] : fallback; };
const output = path.resolve(root, arg('out', 'shots/r3'));
const selected = arg('only', '').split(',').filter(Boolean);
const lite = process.argv.includes('--lite');
fs.mkdirSync(output, { recursive: true });
let server, browser;
const report = [];
try {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch { ({ chromium } = createRequire(process.env.PLAYWRIGHT_REQUIRE_FROM || 'D:/marin/package.json')('playwright')); }
  
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
    await new Promise(resolve => server.listen(5182, '127.0.0.1', resolve)); url = 'http://127.0.0.1:5182/';
  }
  const states = [
    ...[0,1,3,9].map(body=>({name:`r9-ground-${body}`,preset:0,body})),
    {name:'r9-stand',preset:0}, {name:'r9-hologram',preset:6},
    ...Array.from({length:10},(_,body)=>({name:`scenery-${body}`,preset:0,body})),
    {name:'hero',preset:0}, {name:'moon',preset:1}, {name:'jupiter',preset:2},
    {name:'sun',preset:3}, {name:'neutron',preset:4}, {name:'venus',preset:5}, {name:'space',preset:6},
    {name:'room',preset:0,shot:0,vshot:0}, {name:'spring-section',preset:1,shot:2,vshot:0},
    {name:'balance',preset:1,shot:3,vshot:1}, {name:'jump',preset:1,shot:4,vshot:2,run:true},
    {name:'limit',preset:4,shot:5,vshot:0}, {name:'console',preset:0,shot:'console',vshot:'console'},
    {name:'earth-jump',preset:0,run:true}, {name:'moon-jump',preset:1,run:true},
    {name:'pluto-min',preset:0,body:2,nWeights:1,run:true},
    {name:'sun-min',preset:3,nWeights:1}, {name:'saturn',preset:0,body:5}, {name:'mars-min',preset:0,body:3,nWeights:1}
  ];
  const layerNames = [...fs.readFileSync(path.join(root,'docs/theory-card.md'),'utf8').split('## g.')[1].split('## h.')[0].matchAll(/^\| ([^|]+) \|/gm)].slice(1).map(m=>m[1].trim());
  for(let i=0;i<7;i++)for(const phase of ['intro','predict','act','event','confirm','card'])states.push({name:`q${i+1}-${phase}`,quest:i,phase});
  states.push({name:'q3-confirm-wrong',quest:2,phase:'wrong-confirm'});
  states.push(...layerNames.map((layer,k)=>({name:`layer-${k+1}`,preset:k===4?3:k===6?4:1,layer,run:k===5||k===7})),
    {name:'baseline-pin',preset:0,pin:true,body:1,run:true,allLayers:true},
    {name:'extreme-neutron-all',preset:4,nWeights:1,allLayers:true,run:true},
    {name:'extreme-space-all',preset:6,allLayers:true,run:true},
    {name:'extreme-pluto-all',preset:0,body:2,allLayers:true,run:true},
    ...[1,5,6,7,8].map(body=>({name:`shader-${body}`,preset:0,body,shader:true,shot:5,vshot:0})));
  for(const name of ['teacher-strip','teacher-layers','teacher-ab','teacher-spot','teacher-laser','teacher-numbers','teacher-class-predict','teacher-class-result','teacher-reset','kiosk-recover','attract-1','attract-2','attract-3','touch-pulse','thumb'])states.push({name,preset:0,special:true});
  for(const mode of ['student','free','teacher','attract'])for(let i=0;i<3;i++)states.push({name:`vertical-${mode}-${i+1}`,mode,stage:i,special:true});
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
    const startupConsoleErrors=consoleErrors.slice(),startupPageErrors=pageErrors.slice(),startupRequestErrors=requestErrors.slice();
    for (const state of states) {
      const {name}=state;
      if (selected.length && !selected.includes(name)) continue;
      if(['projector','compact'].includes(viewportName)&&name!=='teacher-strip')continue;
      if(name==='thumb'&&viewportName!=='desktop')continue;
      if(name.startsWith('vertical-')&&!mobile)continue;
      if(mobile&&state.quest!==undefined&&!['predict','card'].includes(state.phase))continue;
      const c0=consoleErrors.length,p0=pageErrors.length,r0=requestErrors.length;
      const result=await page.evaluate(({state,mobile})=>{
        const {name}=state;
        const lab=window.__lab;
        const grammar=window.GRAMMAR;
        lab.attract.wake(false);
        if(state.special){
          if(name.startsWith('teacher-')||state.mode==='teacher')lab.teacher.mode('teacher');
          else if(name==='thumb'||state.mode==='free')lab.teacher.mode('free');
          if(name==='teacher-layers')for(let k=0;k<lab.teacher.config.layerOrder.length;k++)lab.teacher.stack();
          if(name==='teacher-ab'){lab.teacher.command('ab');lab.set('body',lab.PHYS.C.ids.moon);}
          if(name==='teacher-spot')lab.teacher.command('spotlight');
          if(name==='teacher-laser')lab.teacher.command('laser');
          if(name==='teacher-numbers')lab.teacher.command('numbers');
          if(name.startsWith('teacher-class')){lab.teacher.command('predict');if(name.endsWith('result')){lab.teacher.config.predict(false,1);lab.teacher.prediction();}}
          if(name==='teacher-reset'){lab.teacher.command('numbers');lab.teacher.reset();}
          const match=/^attract-(\d)$/.exec(name);
          if(match||state.mode==='attract'){const stage=match?+match[1]-1:state.stage;lab.attract.start(stage);let left=Math.floor((lab.teacher.config.attract[stage].seconds-.1)*30);while(left>0){const n=Math.min(120,left);lab.step(n,1/30);left-=n;}}
          if(name==='touch-pulse'){lab.attract.start();lab.attract.wake();}
          if(name==='kiosk-recover')lab.attract.fail();
          if(state.mode==='student'){lab.quest.go(state.stage);lab.step(90,1/30);}
          if(state.mode==='free'){lab.preset(state.stage);lab.shot(state.stage,true);}
          if(name==='thumb'){lab.preset(1);lab.step(120,1/30);lab.teacher.config.ui(false);lab.shot(lab.teacher.config.heroShot,false);}
          lab.step(1,0);
          const strip=document.getElementById('teacher-strip'),r=strip.getBoundingClientRect();
          const buttons=[...document.querySelectorAll('#teacher-strip button')].filter(el=>el.getClientRects().length).map(el=>{const b=el.getBoundingClientRect();return {label:el.getAttribute('aria-label'),width:b.width,height:b.height,bottom:b.bottom,right:b.right};});
          return {textAudit:lab.textAudit(),coverage:lab.heroCoverage(),perf:lab.perf(),mode:lab.teacher.state.mode,attract:{...lab.attract.state},
            stripClipped:!strip.hidden&&(r.top<0||r.bottom>innerHeight||r.right>innerWidth||strip.scrollHeight>strip.clientHeight+1||buttons.some(b=>b.bottom>innerHeight||b.right>innerWidth)),
            teacherTargets:buttons,horizontalScroll:document.documentElement.scrollWidth>innerWidth+1};
        }

        if(state.quest!==undefined){
          lab.quest.go(state.quest);
          if(state.phase==='intro')lab.step(15,1/30);
          else if(['predict','act'].includes(state.phase)){lab.step(90,1/30);if(state.phase==='act')lab.quest.pick(state.quest===5?2:1);}
          else {
            if(state.phase==='wrong-confirm'){lab.step(90,1/30);lab.quest.pick(0);lab.quest.solve();lab.quest.skip('confirm');}
            else {lab.quest.auto(state.quest);lab.quest.skip(state.phase);if(state.phase==='event')lab.step(15,1/30);}
          }
          lab.step(1,0);
          const b=lab.heroCoverage().bounds;
          const occlusion=[...document.querySelectorAll('#quests,#tools,#q-pictures')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>{
            const r=el.getBoundingClientRect();return {id:el.id,overlaps:b.left<r.right&&b.right>r.left&&b.top<r.bottom&&b.bottom>r.top};
          });
          return {quest:lab.quest.state(),textAudit:lab.textAudit(),coverage:lab.heroCoverage(),perf:lab.perf(),occlusion,
            touchTargets:[...document.querySelectorAll('button')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>({label:el.getAttribute('aria-label'),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})),
            horizontalScroll:document.documentElement.scrollWidth>innerWidth+1};
        }
        lab.quest.mode(true);
        grammar.unpin();grammar.set({...grammar.defaults});
        lab.preset(state.preset);lab.step(1,0);
        if(state.pin)grammar.pin();
        if(state.layer)grammar.set(Object.fromEntries(grammar.LAYERS.map(name=>[name,name===state.layer])));
        if(state.allLayers)grammar.set(Object.fromEntries(grammar.LAYERS.map(name=>[name,true])));
        if(state.body!==undefined)lab.set('body',state.body);
        if(state.nWeights!==undefined)lab.set('nWeights',state.nWeights);
        lab.step(120,1/30);
        if(state.run){lab.run();lab.set('playing',false);lab.set('t',state.body===9?1.2:lab.PHYS.timeDots(Math.round(lab.state.body.value)).at(-1).time);lab.step(120,1/30);}
        lab.shot(mobile?(state.vshot??0):(state.shot??1),mobile);
        if(state.shader){
          const y=mobile?1.97:1.12;
          lab.shot({pos:lab.SHOTS[5].pos.clone().set(0.12,y+0.35,1.8),target:lab.SHOTS[5].target.clone().set(-0.22,y,0),fov:34},mobile);
        }
        lab.step(12,1/30);
        return {layers:{...grammar.enabled},baseline:grammar.baseline,textAudit:lab.textAudit(),coverage:lab.heroCoverage(),perf:lab.perf(),
          body:Math.round(lab.state.body.value),nWeights:Math.round(lab.state.nWeights.value),
          spring:lab.PHYS.springState(Math.round(lab.state.body.value),Math.round(lab.state.nWeights.value)),
          jump:lab.PHYS.jumpVisual(Math.round(lab.state.body.value)),trial:lab.state.trial,
          horizontalScroll:document.documentElement.scrollWidth>innerWidth+1};
      },{state,mobile});
      const file = `${name}-${viewportName}.jpg`;
      if(name==='teacher-spot'||name==='teacher-laser'){await page.mouse.move(width*.44,height*.45);await page.mouse.move(width*.48,height*.48,{steps:8});}
      if(name==='touch-pulse')await page.evaluate(()=>{const p=document.getElementById('touch-pulse');p.style.animation='none';p.style.opacity='1';p.style.transform='scale(1)';});
      if(name==='thumb'){
        if(!server)throw new Error('thumb requires local POST endpoint: omit --url');
        const thumbnail=await page.evaluate(()=>window.__lab.capture('thumb'));
        fs.copyFileSync(path.join(output,'thumb.jpg'),path.join(root,'thumb.jpg'));
        report.push({file:'thumb.jpg',...thumbnail});console.log(`thumb.jpg: ${thumbnail.width}x${thumbnail.height}`);continue;
      }
      if (server) await page.evaluate(name => window.__lab.capture(name), `${name}-${viewportName}-canvas`);
      await page.screenshot({ path: path.join(output, file), type: 'jpeg', quality: 92, animations: 'disabled' });
      const row = { file, ...result, consoleErrorCount: consoleErrors.length - c0, pageErrorCount: pageErrors.length - p0,
        textWordCount: result.textAudit.reduce((n, r) => n + r.words.length, 0), consoleErrors: consoleErrors.slice(c0), pageErrors: pageErrors.slice(p0),
        startupConsoleErrors, startupPageErrors, startupRequestErrors, requestErrors: requestErrors.slice(r0) };
      report.push(row);
      const questLayout=state.quest!==undefined&&state.phase!=='intro';
      if(row.stripClipped||(questLayout&&(row.coverage.clipped||row.occlusion.some(o=>o.overlaps)))||row.touchTargets?.some(t=>t.width<55.9||t.height<55.9||!t.label)||(!state.special&&state.quest===undefined&&!state.shader&&(mobile?state.vshot!=='console':state.shot===undefined||state.shot===1)&& (row.coverage.clipped||row.coverage.overlaps))||row.consoleErrorCount||row.pageErrorCount||row.startupConsoleErrors.length||row.startupPageErrors.length||row.horizontalScroll||row.textWordCount)process.exitCode=1;
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
