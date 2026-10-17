// Execute only inside cua_repl, with its documented Tab API. No simulation APIs.
export async function createStudentRunner({tab,fs,root,manifest,surface=tab.playwright,offset=[0,0],capture=()=>tab.screenshot({fullPage:false})}){
 let runs=[];try{runs=JSON.parse(await fs.readFile(root+'/student-runs.json','utf8'));}catch{}
 const save=()=>fs.writeFile(root+'/student-runs.json',JSON.stringify(runs,null,2));
 const state=()=>surface.locator('body').evaluate(element=>{const document=element.ownerDocument;return {activity:document.querySelector('#course-activity')?.value,title:document.querySelector('.lesson-action')?.textContent,progress:document.querySelector('.lesson-trial-progress')?.textContent,values:document.querySelector('#course-direct-values')?.textContent,outcome:document.querySelector('#course-output')?.innerText,next:!!document.querySelector('#course-next-frame')&&!document.querySelector('#course-next-frame').disabled,notice:document.querySelector('.course-message')?.textContent,notebook:document.querySelector('#course-notebook>summary')?.innerText,primary:document.querySelector('.scene-primary:not([hidden])')?.id};});
 async function action(){
  const g=await surface.locator('body').evaluate(element=>{const document=element.ownerDocument,e=document.querySelector('.scene-primary:not([hidden])'),r=e?.getBoundingClientRect(),path=document.querySelector('.gesture-path'),n=path?.getAttribute('d')?.match(/-?\d+(?:\.\d+)?/g)?.map(Number);return {id:e?.id,gesture:e?.dataset.gesture,from:r?[r.x+r.width/2,r.y+r.height/2]:null,to:n?.slice(-2),visible:!!path&&path.style.display!=='none',cue:document.querySelector('.scene-gesture-prompt')?.textContent};});
  if(!g.id||!g.from)throw Error('No visible grab marker');
  if(g.gesture==='tap')await surface.locator('#'+g.id).click();else{if(!g.to||!g.visible)throw Error('No visible drag arrow');await tab.drag(g.from.map((v,i)=>v+offset[i]),g.to.map((v,i)=>v+offset[i]));}
  await surface.locator('#course-activity:not([disabled])').waitFor({state:'visible'});await tab.getAXState({emit:false});return g;
 }
 async function start(cid,id){
  const a=manifest.find(x=>x.course===cid&&x.id===id),run={course:cid,id,title:a.title,pass:false,frames:[]};runs.push(run);
  await surface.locator('#course-band-'+(['physics','mechanics'].includes(cid)?'high':cid)).click();
  if(['physics','mechanics'].includes(cid))await surface.locator('#course-high').selectOption({label:cid==='physics'?'물리학':'역학과 에너지'});
  await surface.locator('#course-activity').selectOption({value:id});await surface.locator('#course-notebook>summary').click();await surface.locator('#course-reset').click();await surface.locator('#course-notebook>summary').click();await tab.getAXState({emit:false});
  for(const input of ['course-prediction','course-plan'])if(await surface.locator('#'+input).count())await surface.locator('#'+input).fill('바뀐 조건과 관찰 결과를 비교하겠다.');
  if(offset[0]&&await surface.locator('#course-return-scene').isVisible()){await surface.locator('#course-return-scene').click();await tab.getAXState({emit:false});}
  for(let j=0;j<4;j++){if(!await surface.locator('.scene-primary:not([hidden])').count())break;await action();}
  await surface.locator('#course-begin').click();await tab.getAXState({emit:false});await save();return run;
 }
 async function run(cid,id,{fresh=false,maxFrames=3}={}){
  const a=manifest.find(x=>x.course===cid&&x.id===id);let run=runs.at(-1);
  if(fresh||!run||run.course!==cid||run.id!==id||run.error||run.pass)run=await start(cid,id);
  try{const from=run.frames.filter(f=>f.pass).length;for(let i=from;i<Math.min(a.lesson.frames.length,from+maxFrames);i++){
   if(i&&await surface.locator('#course-next-frame').isEnabled()){await surface.locator('#course-next-frame').click();await tab.getAXState({emit:false});}
   const f=a.lesson.frames[i],item={id:f.id,title:f.title[0],pass:false,actions:[]};run.frames[i]=item;
   if(await surface.locator('#course-frame-prediction').count())await surface.locator('#course-frame-prediction').fill('조건을 바꾸면 힘이나 움직임이 달라질 것 같다.');
   if(offset[0]&&await surface.locator('#course-return-scene').isVisible()){await surface.locator('#course-return-scene').click();await tab.getAXState({emit:false});}else await tab.getAXState({emit:false});if(i===0)await fs.writeFile(root+'/'+cid+'-'+id+'-before.png',await capture());
   let stagnant=0;
   for(let attempt=0;attempt<14;attempt++){
    let before=await state();if(before.next){item.pass=true;item.result=before;break;}
    if(await surface.locator('#course-student-reading').count()){await surface.locator('#course-student-reading').fill(String(a.readings[i]));await surface.locator('#course-record-reading').click();await tab.getAXState({emit:false});before=await state();if(before.next){item.pass=true;item.result=before;break;}}
    item.actions.push(await action());const after=await state();await save();if(JSON.stringify(before)===JSON.stringify(after))stagnant++;else stagnant=0;if(stagnant>=2)throw Error('Arrow gesture did not change the scene or record');
   }
   if(!item.pass)throw Error('Guided condition not reached: '+f.id);await save();
  }
  run.pass=run.frames.length===a.lesson.frames.length&&run.frames.every(f=>f.pass);if(run.pass)await fs.writeFile(root+'/'+cid+'-'+id+'-after.png',await capture());
  }catch(e){run.error=String(e);run.state=await state();await fs.writeFile(root+'/'+cid+'-'+id+'-failure.png',await capture());}
  await save();return {course:cid,id,pass:run.pass,frames:run.frames.filter(f=>f.pass).length,total:a.lesson.frames.length,error:run.error,state:run.error?run.state:undefined};
 }
 return {run,state,action,runs};
}
