// Real-time presentation clock; only physical time is slowed at scientific events.
const questLight=new THREE.PointLight(THEME.warm,0,1.25,2);scene.add(questLight);
const DIRECTOR={
 clock:0,eventLeft:0,snapshot:null,previewAt:-1,tone:null,
 clear(){this.eventLeft=0;this.snapshot=null;document.body.classList.remove('q-event','q-bars');qOverlay.innerHTML='';},
 intro(){document.body.classList.add('q-bars');shot(0,S.vertical);},
 push(){
  document.body.classList.remove('q-bars');
  const from=camera.position.clone(),fromTarget=controls.target.clone(),fromFov=camera.fov;
  shot(S.vertical?0:1,S.vertical);
  // fitHero already reserves the picture lane; do not fit the low console a second time.
  this.offset=S.heroOffset||0;
  const to={pos:camera.position.clone(),target:controls.target.clone(),fov:camera.fov};camera.position.copy(from);controls.target.copy(fromTarget);camera.fov=fromFov;flyTo(to,1.8);
 },
 event(s){this.snapshot=structuredClone(s);this.eventLeft=1.4;this.eventLift=ROCKET.position.y;if(Q.i===1){flyTo(S.vertical?SHOTS_VERTICAL[1]:SHOTS[3],.6);}this.sound([220,330],.45);},
 time(dt){return dt*(this.eventLeft>0?.18:1)*(T.slow ? 0.25 : 1);},
 sound(notes,duration=.35){
  if(!S.sound.target)return;audioContext ||= new(window.AudioContext||window.webkitAudioContext)();void audioContext.resume();const now=audioContext.currentTime;
  notes.forEach(freq=>{const o=audioContext.createOscillator(),g=audioContext.createGain();o.frequency.value=freq;g.gain.setValueAtTime(.025/notes.length,now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g).connect(audioContext.destination);o.start();o.stop(now+duration);});
 },
 chord(){this.sound([523.25,659.25,783.99],.7);},
 update(dt){
  this.clock+=dt;this.eventLeft=Math.max(0,this.eventLeft-dt);document.body.classList.toggle('q-event',this.eventLeft>0);
  if(!Q.free&&Q.flags.pushed&&!S.drag&&!S.fly){camera.setViewOffset(innerWidth,innerHeight,S.vertical?0:innerWidth*.12,-(this.offset||0),innerWidth,innerHeight);camera.updateMatrixWorld();}
  if(S.drag&&S.sound.target){
   if(!this.tone){audioContext ||= new(window.AudioContext||window.webkitAudioContext)();const o=audioContext.createOscillator(),g=audioContext.createGain();g.gain.value=.012;o.connect(g).connect(audioContext.destination);o.start();this.tone={o,g};}
   this.tone.o.frequency.setTargetAtTime(140+selection().n*45,audioContext.currentTime,.05);
  }else if(this.tone){this.tone.o.stop();this.tone=null;}
  if(Math.floor(this.clock*12)!==this.previewAt){this.previewAt=Math.floor(this.clock*12);qPictures.querySelectorAll('[data-candidate]').forEach(b=>{const d=QUESTS[Q.i];b.innerHTML=CARDS.picture(d.id,d.candidates[+b.dataset.candidate],this.clock);});}
  const d=QUESTS[Q.i],f=Q.flags,project=p=>{const v=p.clone().project(camera);return[(v.x+1)*innerWidth/2,(1-v.y)*innerHeight/2];};
  const focus=name=>name==='engines'?ENGINE_HANDLE.getWorldPosition(V3()):name==='load'?LOAD_SAMPLES[2].getWorldPosition(V3()):name==='pin'||name==='inspect'?V3(1.25,2.4,.3):PLAY_BUTTON.getWorldPosition(V3());
  let body='';questLight.intensity=0;
  if(!Q.free&&Q.phase==='intro'&&f.elapsed<.9)body=`<g transform="translate(${innerWidth/2-42} ${innerHeight/2-42}) scale(3.5)"><defs><clipPath id="q-wipe"><rect width="${Math.min(24,f.elapsed/.65*24)}" height="24"/></clipPath></defs><g clip-path="url(#q-wipe)">${icon(d.icon).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g></g>`;
  if(!Q.free&&Q.phase==='act'){
   const goal=d.goalMarks.find(g=>g.control==='pin'&&!f.before)||d.goalMarks.find(g=>g.control==='load'&&selection().load!==g.value)||d.goalMarks.find(g=>g.control==='engines'&&selection().n!==g.value)||d.goalMarks.find(g=>g.control==='inspect'&&S.ignited.target)||d.goalMarks[0];
   const point=focus(goal.control);questLight.position.copy(point).add(V3(0,.12,.15));questLight.intensity=.28;if(goal.control==='engines'&&goal.value)point.x=-1.60+PHYS.engineRailX(goal.value)*.75;
   const [x,y]=project(point);body=CARDS.path(`M${x-17} ${y-22}h34v44h-34z`,'#ffce8b',true);
   if(f.demoLeft>0&&!S.drag){const move=(2.2-f.demoLeft)/2.2*45;body+=CARDS.path(`M${x-45} ${y+30}h45m-7-6 7 6-7 6`,'#ffce8b',true)+`<g transform="translate(${x-55+move} ${y+34})">${icon('hand').replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g>`;}
   // Only the current control receives the extra focus ring; other handles retain their material.
   const [cx,cy]=project(focus(goal.control));body+=`<circle cx="${cx}" cy="${cy}" r="24" stroke="#ffce8b" opacity=".65"/>`;
  }
  if(this.eventLeft>0&&!Q.free&&Q.i===1&&!S.fly){const dy=(ROCKET.position.y-this.eventLift)*.2;camera.position.y+=dy;controls.target.y+=dy;this.eventLift+=dy;}
  if(this.eventLeft>0&&!Q.free){
   const [x,y]=project(ROCKET.getWorldPosition(V3())),age=1.4-this.eventLeft,w=Math.min(1,age/.45)*60;
   const bx=Math.max(6,Math.min(innerWidth-196,x+40)),by=Math.max(160,Math.min(innerHeight-300,y-110));
   const explanation=d.card(this.snapshot);
   body=explanation?`<circle cx="${x}" cy="${y}" r="4" fill="#64ead0"/>`+CARDS.path(`M${x} ${y}l${w} -45`,'#64ead0')+(age>.45?`<svg x="${bx}" y="${by}" width="190" height="90">${explanation.replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg>`:''):'';
  }
  qOverlay.innerHTML=body?`<svg viewBox="0 0 ${innerWidth} ${innerHeight}">${body}</svg>`:'';
 }
};

window.addEventListener('resize',()=>{if(!Q.free&&Q.phase!=='intro'){DIRECTOR.push();S.fly=null;}});
