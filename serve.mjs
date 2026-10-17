import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const base=path.dirname(fileURLToPath(import.meta.url)),root=path.join(base,'dist'),port=Number(process.argv[2]||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.md':'text/plain; charset=utf-8','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(req.method==='POST'&&url.pathname.startsWith('/__save/')){
  const filename=decodeURIComponent(url.pathname.slice(8));
  if(!/^[a-zA-Z0-9_-]+\.(jpg|json)$/.test(filename)){res.writeHead(400);return res.end('Invalid name')}
  let body='';for await(const chunk of req){body+=chunk;if(body.length>20_000_000){res.writeHead(413);return res.end()}}
  const folder=path.join(base,filename.endsWith('.json')?'work':'shots');fs.mkdirSync(folder,{recursive:true});
  const target=path.join(folder,filename);
  if(filename.endsWith('.jpg')){if(!/^data:image\/jpeg;base64,/.test(body)){res.writeHead(400);return res.end()}fs.writeFileSync(target,Buffer.from(body.split(',')[1],'base64'));if(filename==='thumb.jpg')fs.copyFileSync(target,path.join(root,'labs/force-equilibrium/thumb.jpg'))}
  else fs.writeFileSync(target,body);
  res.writeHead(200,{'Content-Type':'text/plain'});return res.end(target);
 }
 // Test-only iframe media fixture. Does not alter the user's browser or shipped assets.
 if(url.pathname==='/__motion_qa_frame'){
  const html=fs.readFileSync(path.join(root,'labs/force-equilibrium/index.html'),'utf8').replace('<head>','<head><base href="/labs/force-equilibrium/"><script>const nativeMedia=window.matchMedia.bind(window);window.matchMedia=q=>{const m=nativeMedia(q);if(q==="(prefers-reduced-motion: reduce)")Object.defineProperty(m,"matches",{value:false});return m;};</script>');
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(html);
 }
 let file=url.pathname==='/__student_audit'?path.join(base,'verification/student-audit.html'):url.pathname==='/__qa'?path.join(base,'verification/qa.html'):url.pathname==='/__curriculum_qa'?path.join(base,'verification/curriculum-qa.html'):url.pathname==='/__teaching_qa'?path.join(base,'verification/teaching-qa.html'):path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(!['/__qa','/__curriculum_qa','/__teaching_qa','/__student_audit'].includes(url.pathname)&&!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end()}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)){res.writeHead(404);return res.end('Not found')}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/labs/force-equilibrium/`));
