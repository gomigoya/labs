// node tools/capture.mjs [--url http://localhost:5182/] [--out shots/r1] [--only hero,stop] [--lite]
// Run on the review machine with Playwright/Chromium and CDN/GPU access.
process.env.TEMP=process.env.TMP='D:/CodexWork/Temp';
process.env.PLAYWRIGHT_BROWSERS_PATH ||= 'D:/devcache/ms-playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=(key,fallback)=>{const i=process.argv.indexOf(`--${key}`);return i>=0?process.argv[i+1]:fallback;};
const output=path.resolve(root,arg('out','shots/r4'));
if(!output.startsWith(root+path.sep))throw new Error('Output must stay inside the lab');
const selected=arg('only','').split(',').filter(Boolean),lite=process.argv.includes('--lite');
const grammarNames=[...fs.readFileSync(path.join(root,'src/45-grammar.js'),'utf8').match(/const LAYERS=Object.freeze\(\[([^\]]+)\]/)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
const states=[
 {name:'r9-panels-sudden',preset:0,shot:'console'},
 {name:'r9-panels-stopped',preset:5,shot:'console'},
 {name:'r9-orbital-wide',preset:0,shot:0},
 ...['base','numbers','stack','ab','spotlight','laser','predict','result','reset'].map(teacher=>({name:`teacher-${teacher}`,teacher,preset:0})),
 ...[0,1,2].map(stage=>({name:`attract-${stage+1}`,stage,preset:0})),
 {name:'touch-pulse',wake:true,preset:0},{name:'thumb',thumb:true,preset:0},
 ...Array.from({length:6},(_,i)=>['intro','predict','act','event','confirm','card'].map(phase=>({name:`q${i+1}-${phase}`,quest:i,phase}))).flat(),
 ...grammarNames.map((layer,i)=>({name:`layer-${i+1}`,preset:i===3||i===7?3:i===5?4:0,layer})),
 {name:'baseline-pin',preset:0,pinned:true,phi:60},
 {name:'extreme-south-stop',preset:5,phi:-90,layer:grammarNames[5]},
 {name:'extreme-north-fast',preset:2,layer:grammarNames[2]},
 {name:'shader-close',preset:0,shot:2},
 {name:'record-history',preset:3,layer:grammarNames[7],history:true},
 {name:'hero',preset:0},{name:'latitude-60',preset:1},{name:'north-pole',preset:2},
 {name:'sudden-stop',preset:3},{name:'period-30-days',preset:4},{name:'stop',preset:5},
 {name:'period-365-days',preset:6},{name:'design-latitude',preset:7},
 ...['room','hero-shot','equator','polar','tangent','solar'].map((name,shot)=>({name,preset:shot===4?3:0,shot})),
 {name:'console',preset:0,shot:'console'},
 {name:'south-pole',preset:0,phi:-90},{name:'south-slow',preset:6,phi:-90},
 {name:'north-stop',preset:5,phi:90}
];
fs.mkdirSync(output,{recursive:true});
let server,browser;const report=[];
try{
 let chromium;
 try{({chromium}=require(process.env.LAB_PLAYWRIGHT_PACKAGE||'playwright'));}
 catch(error){
  if(process.env.LAB_PLAYWRIGHT_PACKAGE)throw error;
  ({chromium}=createRequire('D:/marin/package.json')('playwright'));
 }
 let url=arg('url','');
 if(!url){
  server=http.createServer(async(req,res)=>{
   try{
    const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(req.method==='POST'&&/^\/__save\/[\w-]+\.jpg$/.test(route)){
     let body='';for await(const chunk of req){body+=chunk;if(body.length>32*1024*1024)throw new Error('size');}
     if(!body.startsWith('data:image/jpeg;base64,')){res.writeHead(400).end();return;}
     fs.writeFileSync(path.join(output,path.basename(route)),Buffer.from(body.slice(body.indexOf(',')+1),'base64'));res.writeHead(200).end();return;
    }
    if(req.method!=='GET'){res.writeHead(405).end();return;}
    if(route==='/favicon.ico'){res.writeHead(204).end();return;}
    const file=path.resolve(root,`.${route==='/'?'/index.html':route}`);
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(fs.readFileSync(file));
   }catch{res.writeHead(404).end();}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(5182,'127.0.0.1',resolve);});url='http://127.0.0.1:5182/';
 }
 browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
 for(const [viewportName,width,height] of [['desktop',1440,900],['wide',1920,1080],['compact',1280,720],['mobile',375,812]]){
  const mobile=viewportName==='mobile',page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
  const consoleErrors=[],pageErrors=[],requestErrors=[];
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('requestfailed',r=>requestErrors.push({url:r.url(),error:r.failure()?.errorText}));
  const parsed=new URL(url);parsed.searchParams.set('capture','1');if(lite)parsed.searchParams.set('lite','1');
  await page.goto(parsed.href,{waitUntil:'load'});
  try{await page.waitForFunction(()=>!!window.__lab,null,{timeout:60000});}
  catch(error){report.push({viewportName,startupConsoleErrors:consoleErrors,startupPageErrors:pageErrors,requestErrors});throw error;}
  const startupConsoleErrors=[...consoleErrors],startupPageErrors=[...pageErrors];
  for(const state of states){
   if(['wide','compact'].includes(viewportName)&&!state.teacher)continue;
   if(mobile&&state.quest!==undefined&&!['predict','card'].includes(state.phase))continue;
   if(selected.length&&!selected.includes(state.name))continue;
   const c0=consoleErrors.length,p0=pageErrors.length,r0=requestErrors.length;
   const result=await page.evaluate(({state,mobile})=>{
    const lab=window.__lab;
    if(lab.attract.state.active)lab.attract.wake(false);
    if(lab.teacher.state.mode==='teacher')lab.teacher.mode('free');
    lab.teacher.config.ui(true);
    if(state.teacher){
      lab.teacher.mode('teacher');lab.teacher.select(0);lab.step(1,0);
      if(state.teacher==='numbers')lab.teacher.command('numbers');
      if(state.teacher==='stack'){lab.teacher.stack();lab.teacher.stack();lab.teacher.stack();}
      if(state.teacher==='ab'){lab.teacher.command('ab');lab.set('phi',60);lab.step(120,1/30);}
      if(['spotlight','laser'].includes(state.teacher)){lab.teacher.command(state.teacher);window.dispatchEvent(new PointerEvent('pointermove',{clientX:innerWidth*.4,clientY:innerHeight*.5}));}
      if(['predict','result'].includes(state.teacher))lab.teacher.command('predict');
      if(state.teacher==='result'){lab.teacher.config.predict(false,0);TEACHER.prediction();lab.step(90,1/30);}
      if(state.teacher==='reset')lab.teacher.reset();
      lab.step(1,0);
    }else if(state.stage!==undefined||state.wake){
      lab.teacher.mode('free');lab.preset(0);lab.attract.start(state.stage??0);
      const row=lab.teacher.config.attract[state.stage??0];lab.teacher.config.setCloser(row.closer,true);lab.step(120,1/30);
      if(state.wake)lab.attract.wake();lab.step(1,0);
    }else if(state.thumb){lab.teacher.mode('free');lab.teacher.reset();lab.teacher.config.ui(false);lab.shot(1,false);lab.step(1,0);
    }else
    if(state.quest!==undefined){
     if(['event','confirm','card'].includes(state.phase)){
      const auto=lab.quest.auto(state.quest);if(!auto.passed)throw new Error(JSON.stringify(auto));
      lab.quest.skip(state.phase);lab.step(state.phase==='event'?15:1,state.phase==='event'?1/30:0);
     }else{
      lab.quest.go(state.quest);
      if(state.phase!=='intro')lab.step(90,1/30);
      if(state.phase==='act')lab.quest.pick(QUESTS[state.quest].candidates.findIndex(c=>c.key===QUESTS[state.quest].answerKey));
      lab.step(state.phase==='intro'?15:1,state.phase==='intro'?1/30:0);
     }
    }else{
    QUEST.mode(true);GRAMMAR.unpin();GRAMMAR.set(GRAMMAR.defaults);lab.preset(state.preset);
    if(state.pinned){lab.set('playing',false);lab.step(120,1/30);GRAMMAR.pin();}
    if(state.layer)GRAMMAR.set(Object.fromEntries(GRAMMAR.LAYERS.map(n=>[n,n===state.layer])));
    if(state.history){for(const phi of [0,30,60,90]){lab.set('phi',phi);lab.step(120,1/30);lab.set('execute',true);lab.step(60,1/30);}}
    if(state.phi!==undefined)lab.set('phi',state.phi);
    if(state.preset!==3&&state.preset!==5)lab.set('playing',false);
    lab.step(120,1/30);lab.set('playing',false);lab.step(120,1/30);
    const verticalShot=state.shot===2||state.shot===3||state.shot===4?1:state.shot===5?2:0;
    lab.shot(state.shot==='console'?'console':mobile?verticalShot:state.shot??1,mobile);lab.step(1,0);
    }
    return {quest:lab.quest.state(),textAudit:lab.textAudit(),heroCoverage:lab.heroCoverage(),perf:lab.perf(),
     touchTargets:[...document.querySelectorAll('button')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>{const r=el.getBoundingClientRect();return {label:el.getAttribute('aria-label'),width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom}}),
     uiBounds:Object.fromEntries(['quests','tools','q-pictures','teacher-strip'].map(id=>{const el=document.getElementById(id),r=el.getBoundingClientRect();return [id,{left:r.left,right:r.right,top:r.top,bottom:r.bottom,hidden:el.hidden}]})),
     cardOverlapsHero:(()=>{const el=document.getElementById('q-pictures'),r=el.getBoundingClientRect(),b=lab.heroCoverage().bounds;return !el.hidden&&!!el.children.length&&b.left<r.right&&b.right>r.left&&b.top<r.bottom&&b.bottom>r.top;})(),
     horizontalScroll:document.documentElement.scrollWidth>innerWidth+1,
     grammar:{enabled:{...GRAMMAR.enabled},pinned:!!GRAMMAR.baseline},
     input:{phi:lab.PHYS.phiFromRailX(lab.state.phi.value),P:lab.PHYS.periodFromRailX(lab.state.period.value)===Infinity?'stop':lab.PHYS.periodFromRailX(lab.state.period.value)}};
   },{state,mobile});
   const file=`${state.name}-${viewportName}.jpg`;
   if(server&&state.thumb){await page.evaluate(()=>window.__lab.capture('thumb'));fs.copyFileSync(path.join(output,'thumb.jpg'),path.join(root,'thumb.jpg'));}
   if(server&&!state.thumb)await page.evaluate(name=>window.__lab.capture(name),`${state.name}-${viewportName}-canvas`);
   await page.screenshot({path:path.join(output,file),type:'jpeg',quality:92,animations:'disabled'});
   const strip=result.uiBounds['teacher-strip'];
   const teacherStripClipped=!!state.teacher&&(strip.top<0||strip.bottom>height||strip.left<0||strip.right>width||result.touchTargets.some(t=>t.top<0||t.bottom>height||t.left<0||t.right>width));
   const row={file,teacherStripClipped,...result,textWordCount:result.textAudit.reduce((n,r)=>n+r.words.length,0),
    consoleErrors:consoleErrors.slice(c0),pageErrors:pageErrors.slice(p0),requestErrors:requestErrors.slice(r0),startupConsoleErrors,startupPageErrors};
   row.touchTargetFailures=row.touchTargets.filter(t=>!t.label||t.width<(state.teacher&&mobile?20:state.teacher?71.9:55.9)||t.height<(state.teacher&&mobile?20:state.teacher?71.9:55.9));
   row.consoleErrorCount=row.consoleErrors.length;row.pageErrorCount=row.pageErrors.length;
   report.push(row);
   console.log(`${file}: console.error=${row.consoleErrorCount}, pageerror=${row.pageErrorCount}, hscroll=${row.horizontalScroll}, textWords=${row.textWordCount}, heroCoverage=${JSON.stringify(row.heroCoverage)}`);
   if(teacherStripClipped||row.touchTargetFailures.length||row.cardOverlapsHero||row.consoleErrorCount||row.pageErrorCount||row.horizontalScroll||row.textWordCount||(mobile&&!state.teacher&&!state.wake&&state.stage===undefined&&!state.thumb&&state.shot!=='console'&&(row.heroCoverage.clipped||row.heroCoverage.overlaps||row.heroCoverage.width>.75))||startupConsoleErrors.length||startupPageErrors.length||row.requestErrors.length)process.exitCode=1;
  }await page.close();
 }
}catch(error){report.push({fatal:String(error)});process.exitCode=1;console.error(error);}
finally{
 if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,(_key,value)=>value===Infinity?'stop':value,2));
}
