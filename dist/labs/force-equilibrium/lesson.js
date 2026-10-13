import {newLesson,STAGES,report,validateReport,representationResult,trialCoverage,addTrial,explanationResult,transferResult,direction} from './lesson-model.js';

const STORAGE='force-lab-lesson-v2';
const colors=['#208f89','#ba722f'];
export function createLesson(a){
  let s=newLesson(),active=false,selected=0,voice=false,timer=0,feedback='',saved=true,drag=null;
  const params=new URLSearchParams(location.search),readable=params.get('wordless')!=='1';
  let full=params.get('course')==='lesson';
  const root=document.getElementById('ui');
  const el=(tag,id,parent=root)=>{const e=document.createElement(tag);e.id=id;parent.append(e);return e};
  const nav=el('nav','lesson-nav'),tools=el('nav','lesson-tools'),panel=el('section','lesson-panel');
  nav.className=tools.className=panel.className='glass';
  nav.setAttribute('aria-label',a.label('lessonSequence'));panel.setAttribute('aria-label',a.label('lessonActivity'));
  const instructions=el('aside','lesson-instructions');instructions.className='glass';
  const title=el('h1','lesson-title',instructions),instruction=el('p','lesson-instruction',instructions);
  const legend=el('div','lesson-legend',panel),prompt=el('p','lesson-prompt',panel);
  const cue=el('canvas','lesson-cue',panel);cue.width=640;cue.height=110;
  const choices=el('div','lesson-choices',panel),records=el('div','lesson-records',panel),actions=el('div','lesson-actions',panel);
  const menu=el('div','lesson-menu');menu.className='glass';menu.setAttribute('role','dialog');menu.setAttribute('aria-modal','true');menu.setAttribute('aria-label',a.label('learnLevels'));
  const response=el('p','lesson-response',panel);panel.insertBefore(response,actions);
  const forceControls=el('div','lesson-force-controls',panel);panel.insertBefore(forceControls,prompt);
  let empty,recordCount,sceneState;
  if(readable){
    const header=el('header','studio-header');
    const brand=el('div','studio-brand',header);brand.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 11h21m-5-5 5 5-5 5M28 23H7m5-5-5 5 5 5"/></svg><span></span>';brand.lastChild.textContent=a.label('studioTitle');
    header.append(nav,tools);instructions.className='';panel.prepend(instructions);
    const sceneHeading=el('div','studio-scene-heading');sceneHeading.textContent=a.label('studioObject');
    sceneState=el('span','studio-scene-state',sceneHeading);
    const notebook=el('section','studio-notebook');notebook.setAttribute('aria-label',a.label('studioRecords'));
    const nh=el('div','studio-notebook-heading',notebook);const h=el('h2','studio-record-title',nh);h.textContent=a.label('studioRecords');recordCount=el('span','studio-record-count',nh);
    empty=el('p','studio-empty-records',notebook);empty.textContent=a.label('studioEmptyRecords');notebook.append(records);
    const footer=el('footer','studio-footer');footer.textContent=a.label('studioModel');
  }
  const live=el('div','lesson-announcement');Object.assign(live.style,{position:'absolute',width:'1px',height:'1px',overflow:'hidden',clipPath:'inset(50%)'});live.setAttribute('aria-live','polite');
  function caption(b,key){if(!readable)return;const span=document.createElement('span');span.className='lesson-label';span.textContent=a.label('ui'+key[0].toUpperCase()+key.slice(1));b.append(span)}
  function button(parent,key,ic,fn,id){const b=a.button(parent,key,ic,fn,id);caption(b,key);return b}
  function save(){try{localStorage.setItem(STORAGE,JSON.stringify(report(s)));saved=true}catch{saved=false}}
  function utter(text){live.textContent=text;if(voice&&'speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=document.documentElement.lang==='en'?'en-US':'ko-KR';u.rate=.88;speechSynthesis.speak(u)}}
  function say(key){utter(a.label(key))}
  function describe(){utter([title.textContent,instruction.textContent,prompt.textContent,response.textContent].filter(Boolean).join(' '))}
  function prepare(){a.prepare(s.stage===5?{cyan:3,amber:s.transfer.magnitude,angle:s.transfer.direction===1?0:180,crate:true}:{cyan:s.stage<2?1:s.magnitude,amber:2,angle:180,crate:false,observation:s.stage===3&&s.phase==='result'?s.trials.at(-1):null});}
  function changed(){save();render()}
  function start(fresh=false){
    a.practice();active=true;selected=0;document.body.classList.add('lesson');document.body.classList.toggle('lesson-readable',readable);
    if(fresh)s=newLesson(crypto.randomUUID());else try{const raw=localStorage.getItem(STORAGE);if(raw)s=validateReport(JSON.parse(raw)).session}catch{s=newLesson(crypto.randomUUID())}
    if(!params.has('course')&&!fresh&&s.activityRoute==='lesson')full=true;
    if(['release','watch'].includes(s.phase))s.phase='ready';
    if(!full&&s.stage<2){s.stage=2;s.unlockedStage=Math.max(2,s.unlockedStage)}
    s.activityRoute=full?'lesson':'quick';
    timer=0;feedback='';prepare();changed();say('lessonSay'+s.stage);return s;
  }
  function deactivate(){active=false;live.textContent='';document.body.classList.remove('lesson','lesson-readable');menu.classList.remove('open');a.stop();a.restore?.();if('speechSynthesis'in window)speechSynthesis.cancel()}
  function stage(n){if(!active)return;s.stage=n;s.unlockedStage=Math.max(s.unlockedStage,n);s.phase='ready';feedback='';timer=0;prepare();changed();say('lessonSay'+n)}
  function target(value){if(s.stage!==0)return;s.targetAttempts.push(value);feedback=value==='cart'?'good':'revise';changed();say(value==='cart'?'lessonTargetGood':'lessonTargetRetry')}
  function representation(index,value){if(s.stage!==1||![0,1].includes(index))return;selected=index;s.representations[index]={onBody:!!value.onBody,direction:value.direction<0?-1:1,magnitude:Math.max(1,Math.min(4,Math.round(value.magnitude)))};feedback='';changed()}
  function checkRepresentation(){if(!s.representations.every(Boolean))return;const correct=representationResult(s.representations);s.representationAttempts.push({representations:structuredClone(s.representations),correct});feedback=correct.every(Boolean)?'good':'revise';changed();say(feedback==='good'?'lessonArrowsGood':'lessonArrowsRetry')}
  function canEdit(){return active&&[2,5].includes(s.stage)&&!['release','watch'].includes(s.phase)}
  function setMagnitude(value){if(!canEdit())return;s.completed=false;const mag=Math.max(1,Math.min(4,Math.round(value)));if(s.stage===5){s.transfer.magnitude=mag;s.transfer.prediction=null}else{s.magnitude=mag;s.prediction=null}s.phase='ready';feedback='';prepare();changed()}
  function setDirection(value){if(!canEdit()||s.stage!==5)return;s.completed=false;s.transfer.direction=value<0?-1:1;s.transfer.prediction=null;s.phase='ready';feedback='';prepare();changed()}
  function predict(value){if(![-1,0,1].includes(value)||![2,5].includes(s.stage))return;if(s.stage===5){s.completed=false;s.transfer.prediction=value}else s.prediction=value;changed()}
  function release(){if(!active||s.stage!==3||s.prediction===null||['release','watch'].includes(s.phase)||s.trials.length>=12)return;prepare();s.phase='release';timer=0;changed();say('lessonRelease')}
  function experiment(){if(!canEdit()||s.stage!==2||s.prediction===null)return;stage(3);release();if(readable&&innerWidth<=980)window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
  function chooseEvidence(id){if(s.stage!==4||!s.trials.some(t=>t.id===id))return;s.evidenceId=id;feedback='';changed()}
  function chooseReason(value){if(s.stage!==4||!['equal-opposite','unequal-opposite','no-forces'].includes(value))return;s.reason=value;feedback='';changed()}
  function explain(){if(s.evidenceId===null||s.reason===null)return;const result=explanationResult(s);s.explanationAttempts.push({evidenceId:s.evidenceId,reason:s.reason,correct:result});feedback=result.evidence&&result.reason?'good':'revise';changed();say(feedback==='good'?'lessonExplanationGood':'lessonExplanationRetry')}
  function transfer(){if(s.stage!==5||s.transfer.prediction===null)return;const result=transferResult(s.transfer);s.transferAttempts.push({...s.transfer,...result});s.completed=true;s.phase='result';feedback=result.balanced&&result.predictionCorrect?'good':'revise';changed();say(feedback==='good'?'lessonTransferGood':'lessonTransferRetry')}
  function download(){const blob=new Blob([JSON.stringify(report(s),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='force-lab-record.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  function openMenu(){menu.replaceChildren();menu.classList.add('open');for(const [key,ic,fn]of [
    ['lessonContinue','note',()=>{menu.classList.remove('open')}],
    ['lessonQuick','play',()=>{full=false;s.activityRoute='quick';menu.classList.remove('open');stage(2)}],
    ['lessonFull','guide',()=>{full=true;s.activityRoute='lesson';menu.classList.remove('open');stage(0)}],
    ['lessonDownload','note',download],
    ['lessonRestart','reset',()=>{menu.classList.remove('open');start(true)}],
    ['lessonPractice','cart',()=>{deactivate();a.practice()}],
    ['lessonAdvanced','q4',()=>{deactivate();a.advanced()}],
    ['guide','guide',()=>window.open('guide.html'+location.search,'_blank','noopener')],
    ['lessonClose','check',()=>menu.classList.remove('open')]])button(menu,key,ic,fn);
    menu.querySelector('button').focus();
  }
  document.addEventListener('keydown',e=>{if(!active)return;if(e.key==='Escape')menu.classList.remove('open');if(e.key==='Tab'&&menu.classList.contains('open')){const b=[...menu.querySelectorAll('button')];if(e.shiftKey&&document.activeElement===b[0]){e.preventDefault();b.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===b.at(-1)){e.preventDefault();b[0].focus()}}});
  function picture(parent,key,draw,fn,pressed=false,id){const b=button(parent,key,'cart',fn,id);b.replaceChildren();b.setAttribute('aria-pressed',String(pressed));const c=document.createElement('canvas');c.width=248;c.height=150;c.setAttribute('aria-hidden','true');b.append(c);draw(c.getContext('2d'),248,150);caption(b,key);return b}
  function motion(c,x,y,dir,dashed=false){a.cart(c,x,y,.78,s.stage===5?'#8da7b4':'#eabb55');c.save();c.strokeStyle=dashed?'#a6af9c':'#597b51';c.lineWidth=4;if(dashed)c.setLineDash([5,5]);if(dir)a.arrow(c,x-dir*30,y+38,dir*60,0,c.strokeStyle,4,dashed);else{c.beginPath();c.arc(x,y,36,0,Math.PI*2);c.stroke()}c.restore()}
  function force(c,x,y,mag,dir,color,locked=false){a.arrow(c,x,y,dir*mag*24,0,color,7);c.strokeStyle=color;c.lineWidth=3;for(let i=1;i<=mag;i++){c.beginPath();c.moveTo(x+dir*(i-.5)*24,y-9);c.lineTo(x+dir*(i-.5)*24,y+9);c.stroke()}if(locked){c.strokeStyle='#74816c';c.lineWidth=3;c.strokeRect(x-9,y+18,18,14);c.beginPath();c.arc(x,y+18,7,Math.PI,0);c.stroke()}}
  function reasonPicture(c,w,h,reason){a.cart(c,w/2,h*.48,.8);if(reason!=='no-forces'){force(c,w/2-40,h*.38,2,-1,colors[1]);force(c,w/2+40,h*.62,reason==='equal-opposite'?2:3,1,colors[0])}}
  function recordPicture(c,w,h,t){force(c,w*.55,35,t.magnitude,1,colors[0]);force(c,w*.45,62,2,-1,colors[1]);motion(c,w/2,105,t.observedDirection)}
  function render(){if(!active)return;const focus=document.activeElement?.id;panel.className='glass'+(feedback?' feedback-'+feedback:'');nav.replaceChildren();tools.replaceChildren();choices.replaceChildren();records.replaceChildren();actions.replaceChildren();forceControls.replaceChildren();
    nav.setAttribute('aria-label',a.label(full?'lessonSequence':'uiQuickSequence'));
    const stageIcons=['cart','force0','retry','play','note','q4'];
    STAGES.forEach((name,i)=>{if(!full&&i<2)return;const b=button(nav,'lessonStage'+i,stageIcons[i],()=>{if(i<=s.unlockedStage&&!['release','watch'].includes(s.phase))stage(i)},'lesson-stage-'+i);b.classList.toggle('current',i===s.stage);b.classList.toggle('done',i<s.stage);b.disabled=i>s.unlockedStage||['release','watch'].includes(s.phase);b.setAttribute('aria-current',i===s.stage?'step':'false');if(!full)b.setAttribute('aria-label',a.label('uiLessonStage'+i))});
    button(tools,'learnLevels','learnLevels',openMenu,'lesson-levels');const help=button(tools,'learnHelp','sound',()=>{voice=!voice;help.setAttribute('aria-pressed',String(voice));if(voice){if(readable)describe();else say('lessonSay'+s.stage)}else window.speechSynthesis?.cancel()},'lesson-help');help.setAttribute('aria-pressed',String(voice));
    button(tools,'lessonTeacher','guide',()=>window.open('teacher.html'+(document.documentElement.lang==='en'?'?lang=en':''),'_blank','noopener'),'lesson-teacher');
    const primary=(key,ic,fn,disabled=false,id='lesson-next')=>{const b=button(actions,key,ic,fn,id);b.className='primary';b.disabled=disabled;return b};
    const magnitudeControls=()=>{for(const d of [-1,1]){const b=button(readable?forceControls:actions,d<0?'minus':'plus',d<0?'minus':'plus',()=>setMagnitude((s.stage===5?s.transfer.magnitude:s.magnitude)+d),d<0?'lesson-minus':'lesson-plus');b.className=s.stage===5?'amber':'cyan';b.disabled=(s.stage===5?s.transfer.magnitude:s.magnitude)===(d<0?1:4)}};
    const predictionChoices=()=>{const selectedPrediction=s.stage===5?s.transfer.prediction:s.prediction;for(const d of [-1,0,1])picture(choices,d<0?'learnLeft':d>0?'learnMoving':'learnStill',(c,w,h)=>motion(c,w/2,h*.43,d),()=>predict(d),selectedPrediction===d,'lesson-predict-'+(d+1)).setAttribute('aria-label',a.label(s.stage===5?(d<0?'lessonCrateLeft':d>0?'lessonCrateRight':'lessonCrateStill'):(d<0?'learnLeft':d>0?'learnMoving':'learnStill')))};
    if(s.stage===0){picture(choices,'lessonChooseCart',(c,w,h)=>a.cart(c,w/2,h/2,1.4),()=>target('cart'),s.targetAttempts.at(-1)==='cart','lesson-object-cart');picture(choices,'lessonChooseArrow',(c,w,h)=>force(c,70,h/2,4,1,colors[0]),()=>target('arrow'),s.targetAttempts.at(-1)==='arrow','lesson-object-arrow');primary('next','next',()=>stage(1),s.targetAttempts.at(-1)!=='cart')}
    if(s.stage===1){
      for(let i=0;i<2;i++){const b=button(actions,'force'+i,'force'+i,()=>{selected=i;render()},'lesson-force-'+i);b.className=i===0?'cyan':'amber';b.setAttribute('aria-pressed',String(i===selected))}
      const r=s.representations[selected]||{onBody:false,direction:1,magnitude:1};
      button(actions,'lessonOrigin','cart',()=>representation(selected,{...r,onBody:!r.onBody}),'lesson-origin').setAttribute('aria-pressed',String(r.onBody));
      for(const d of [-1,1]){const b=button(actions,d<0?'lessonArrowLeft':'lessonArrowRight','next',()=>representation(selected,{...r,direction:d}),'lesson-arrow-'+(d<0?'left':'right'));if(d<0)b.querySelector('svg').style.transform='rotate(180deg)'}
      for(const d of [-1,1])button(actions,d<0?'minus':'plus',d<0?'minus':'plus',()=>representation(selected,{...r,magnitude:r.magnitude+d}),'lesson-rep-'+(d<0?'minus':'plus'));
      primary('lessonCheckArrows','check',checkRepresentation,!s.representations.every(Boolean),'lesson-check-arrows');
      if(s.representationAttempts.length)primary('next','next',()=>stage(2),false);
      button(actions,'lessonSkipDrawing','next',()=>stage(2),'lesson-skip-drawing');
    }
    if(s.stage===2){predictionChoices();magnitudeControls();primary('lessonRun','play',experiment,s.prediction===null||s.trials.length>=12,'lesson-run');if(s.trials.length>=12)button(actions,'lessonNewTrials','reset',()=>{s.trials=[];s.evidenceId=null;s.reason=null;s.explanationAttempts=[];s.transferAttempts=[];s.completed=false;s.prediction=null;stage(2)},'lesson-new-trials')}
    if(s.stage===3){
      if(!readable)s.trials.slice(-6).forEach(t=>trialCard(records,t,false));
      if(s.phase==='result'){button(actions,'lessonAnotherTrial','retry',()=>{s.prediction=null;stage(2)},'lesson-another').className='primary';primary('lessonUseEvidence','next',()=>stage(4),!(full?trialCoverage(s.trials).every(Boolean):s.trials.some(t=>t.resultant===0)));}
      else primary('lessonRelease','play',release,s.prediction===null||['release','watch'].includes(s.phase)||s.trials.length>=12,'lesson-release');
      if(s.trials.length>=12)button(actions,'lessonNewTrials','reset',()=>{s.trials=[];s.prediction=null;s.evidenceId=null;s.reason=null;s.explanationAttempts=[];s.transferAttempts=[];s.completed=false;s.unlockedStage=2;stage(2)},'lesson-new-trials');
    }
    if(s.stage===4){if(!readable)s.trials.forEach(t=>trialCard(records,t,true));for(const reason of ['equal-opposite','unequal-opposite','no-forces'])picture(choices,'lessonReason-'+reason,(c,w,h)=>reasonPicture(c,w,h,reason),()=>chooseReason(reason),s.reason===reason,'lesson-reason-'+reason);primary('lessonExplain','check',explain,s.evidenceId===null||s.reason===null,'lesson-explain');if(s.explanationAttempts.length)primary('next','next',()=>stage(5));}
    if(s.stage===5){predictionChoices();magnitudeControls();const b=button(actions,'lessonReverse','angle',()=>setDirection(-s.transfer.direction),'lesson-reverse');b.className='amber';primary('lessonCheckTransfer','check',transfer,s.transfer.prediction===null,'lesson-transfer');if(s.completed){button(actions,'lessonDownload','note',download,'lesson-download');primary('lessonTeacher','guide',()=>window.open('teacher.html'+(document.documentElement.lang==='en'?'?lang=en':''),'_blank','noopener'),false,'lesson-results')}}
    if(readable){s.trials.forEach(t=>trialCard(records,t,s.stage===4));empty.hidden=s.trials.length>0;recordCount.textContent=s.trials.length+' / 12';document.querySelector('#studio-scene-heading').firstChild.textContent=a.label(s.stage===5?'studioCrate':'studioObject');sceneState.textContent=a.label(['release','watch'].includes(s.phase)?'studioObserving':s.phase==='result'?'studioRecorded':'studioAtRest');}
    cue.setAttribute('aria-label',a.label(s.stage===1?'lessonDrawArrows':'lessonSay'+s.stage));cue.setAttribute('role','img');cue.hidden=readable&&[2,3,5].includes(s.stage);renderInstructions();drawCue();
    if(focus){const b=document.getElementById(focus);if(b&&!b.disabled)b.focus({preventScroll:true})}
  }
  const motionLabel=d=>a.label(d<0?'uiLearnLeft':d>0?'uiLearnMoving':'uiLearnStill');
  function trialCard(parent,t,selectable){const b=picture(parent,selectable?'lessonSelectTrial':'lessonTrial',(c,w,h)=>recordPicture(c,w,h,t),()=>{if(selectable)chooseEvidence(t.id)},selectable&&s.evidenceId===t.id,'lesson-'+(selectable?'evidence-':'trial-')+t.id);if(readable){b.querySelector('.lesson-label').textContent=a.label('uiTrial')+' '+t.id+' · '+motionLabel(t.observedDirection);b.setAttribute('aria-label',a.label(selectable?'lessonSelectTrial':'lessonTrial')+' '+t.id+' · '+motionLabel(t.observedDirection))}return b}
  function renderInstructions(){
    title.textContent=a.label('uiTitle'+s.stage);instruction.textContent=a.label('uiInstruction'+s.stage);
    legend.replaceChildren();prompt.textContent='';response.textContent='';
    if([2,3,5].includes(s.stage)){const cyan=s.stage===5?3:s.magnitude,amber=s.stage===5?s.transfer.magnitude:2,dir=s.stage===5?s.transfer.direction:-1;const orange=document.createElement('span'),green=document.createElement('span');orange.className='amber';green.className='cyan';orange.textContent=a.label('uiAmber')+' '+(dir<0?'← ':'')+amber+a.label('uiUnit')+(dir>0?' →':'')+(s.stage===5?'':a.label('uiFixed'));green.textContent=a.label('uiCyan')+' '+cyan+a.label('uiUnit')+' →'+(s.stage===5?a.label('uiFixed'):'');if(readable){for(const [row,name,mag,d,fixed]of [[orange,'uiAmber',amber,dir,s.stage!==5],[green,'uiCyan',cyan,1,s.stage===5]]){row.replaceChildren();const info=document.createElement('span');info.className='force-info';const n=document.createElement('span');n.textContent=a.label(name)+a.label('studioForce');const sub=document.createElement('small');sub.textContent=a.label(fixed?'studioFixed':'studioAdjustable');info.append(n,sub);const value=document.createElement('strong');value.textContent=(d<0?'← ':'')+mag+' N'+(d>0?' →':'');row.append(info,value);}}legend.append(orange,green);prompt.textContent=a.label(s.stage===5?'uiCratePrompt':'uiPredictPrompt');}
    if(s.stage===2)response.textContent=a.label(s.prediction===null?'uiBeforePrediction':'uiReadyExperiment');
    if(s.stage===3){if(['release','watch'].includes(s.phase)){title.textContent=a.label('uiWatching');prompt.textContent=a.label('uiWatchPrompt');response.textContent=''}else if(s.phase==='result'){const t=s.trials.at(-1);title.textContent=a.label('uiResult')+' '+motionLabel(t.observedDirection);instruction.textContent=a.label(t.resultant===0?'uiBalancedReason':t.resultant<0?'uiLeftReason':'uiRightReason');prompt.textContent=a.label('uiYourPrediction')+' '+motionLabel(t.prediction)+' → '+a.label('uiObserved')+' '+motionLabel(t.observedDirection);const missing=[-1,0,1].filter((d,i)=>!trialCoverage(s.trials)[i]);response.textContent=!full&&t.resultant===0?a.label('uiGoalReached'):missing.length?a.label('uiTryRemaining')+' '+missing.map(motionLabel).join(' · '):a.label('uiAllCollected');}}
    if(s.stage===4){prompt.textContent=a.label('uiEvidencePrompt');if(feedback)response.textContent=a.label(feedback==='good'?'lessonExplanationGood':'lessonExplanationRetry');}
    if(s.stage===1&&feedback)response.textContent=a.label(feedback==='good'?'lessonArrowsGood':'lessonArrowsRetry');
    if(s.stage===5&&feedback)response.textContent=a.label(feedback==='good'?'lessonTransferGood':'lessonTransferRetry');
    document.body.dataset.lessonStage=String(s.stage);panel.dataset.stage=String(s.stage);panel.dataset.phase=s.phase;
  }
  function drawCue(){if(!active)return;const c=cue.getContext('2d');c.clearRect(0,0,640,110);const st=s.stage;
    if(st===0){a.cart(c,100,55,1.2);a.arrow(c,165,55,90,0,'#859b79',5,true);a.cart(c,360,55,1.2);c.strokeStyle='#66825c';c.lineWidth=4;c.beginPath();c.arc(360,55,49,0,Math.PI*2);c.stroke();c.font='45px sans-serif';c.fillStyle='#68825c';c.fillText('?',470,70)}
    if(st===1){a.cart(c,320,55,1);c.strokeStyle='#9caf92';c.setLineDash([5,5]);c.strokeRect(274,19,92,72);c.setLineDash([]);for(let i=0;i<2;i++){const r=s.representations[i];if(r)force(c,r.onBody?320:140,35+i*35,r.magnitude,r.direction,colors[i]);else{c.strokeStyle=colors[i];c.lineWidth=3;c.beginPath();c.arc(320,35+i*35,8,0,Math.PI*2);c.stroke()}}if(!s.representations.some(Boolean)){a.arrow(c,320,55,100,0,'#b1b9a6',4,true);c.strokeStyle='#8a9b80';c.beginPath();c.arc(420,55,15,0,Math.PI*2);c.stroke()}}
    if([2,3,5].includes(st)){const t=st===5?s.transfer:{magnitude:s.magnitude,direction:1};a.cart(c,320,51,.95,st===5?'#8da7b4':'#eabb55');force(c,265,42,st===5?t.magnitude:2,st===5?t.direction:-1,colors[1],st!==5);force(c,375,70,st===5?3:s.magnitude,1,colors[0],st===5);
      if(st===3&&s.phase==='result'){const last=s.trials.at(-1);motion(c,90,45,last.prediction,true);motion(c,550,45,last.observedDirection);}
      if(st===3){const covered=trialCoverage(s.trials);[-1,0,1].forEach((d,i)=>{c.save();c.globalAlpha=covered[i]?1:.2;const x=295+i*25;c.fillStyle='#4c8054';c.beginPath();c.arc(x,103,5,0,Math.PI*2);c.fill();c.restore()})}}
    if(st===4){c.strokeStyle='#92a985';c.lineWidth=3;c.strokeRect(94,15,100,78);a.cart(c,144,53,.7);a.arrow(c,218,54,58,0,'#809c70',3);reasonPicture(c,640,110,s.reason||'equal-opposite');}
    if(feedback){c.strokeStyle=feedback==='good'?'#568448':'#b78a43';c.lineWidth=5;c.beginPath();if(feedback==='good'){c.moveTo(591,52);c.lineTo(602,65);c.lineTo(625,35)}else{c.arc(606,51,18,.5,5.2);c.moveTo(613,28);c.lineTo(622,37);c.lineTo(610,39)}c.stroke()}}
  cue.addEventListener('pointerdown',e=>{if(!active||s.stage!==1)return;const r=cue.getBoundingClientRect(),x=(e.clientX-r.left)*640/r.width,y=(e.clientY-r.top)*110/r.height;drag={x,y,onBody:x>=274&&x<=366&&y>=19&&y<=91};cue.setPointerCapture(e.pointerId)});
  cue.addEventListener('pointerup',e=>{if(!drag)return;const r=cue.getBoundingClientRect(),x=(e.clientX-r.left)*640/r.width,dx=x-drag.x;representation(selected,{onBody:drag.onBody,direction:dx<0?-1:1,magnitude:Math.max(1,Math.round(Math.abs(dx)/24))});drag=null});cue.addEventListener('pointercancel',()=>drag=null);
  function tick(dt){if(!active)return;if(s.phase==='release'){timer+=dt;if(timer>=.8){timer=0;s.phase='watch';a.run();render()}}
    else if(s.phase==='watch'){if(a.observation().time>=1.2-1e-8){a.stop();const t=addTrial(s,a.observation());feedback='';changed();if(readable)describe();else say(t.observedDirection===t.prediction?'lessonPredictionMatched':'lessonPredictionChanged')}}
    a.view({stage:s.stage,phase:s.phase,timer,editing:canEdit(),editable:s.stage===5?1:0,showArrows:s.stage!==0});
  }
  return {start,deactivate,stage,target,representation,checkRepresentation,setMagnitude,setDirection,predict,release,experiment,chooseEvidence,chooseReason,explain,transfer,download,tick,canEdit,report:()=>report(s),get active(){return active},get state(){return s},get editable(){return s.stage===5?1:0},get saved(){return saved}};
}
