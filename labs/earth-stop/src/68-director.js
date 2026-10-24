// Presentation consumes saved PHYS results; it never awards completion.
const questEnvelope=PHYS.sceneEnvelope();
const questLight=new THREE.PointLight(THEME.cool,0,.8,2);scene.add(questLight);
const DIRECTOR={
 clock:0,eventLeft:0,snapshot:null,tone:null,previewAt:-1,layoutDirty:true,
 clear(){this.eventLeft=0;this.snapshot=null;document.body.classList.remove('q-event','q-bars');},
 intro(){document.body.classList.add('q-bars');if(!S.vertical)shot(0,false);},
 push(){
  document.body.classList.remove('q-bars');
  const from=camera.position.clone(),target=controls.target.clone(),fov=camera.fov;
  shot(S.vertical?0:1,S.vertical);this.fit();
  const to={pos:camera.position.clone(),target:controls.target.clone(),fov:camera.fov};
  camera.position.copy(from);controls.target.copy(target);camera.fov=fov;S.fly={from,fromTarget:target,fromFov:fov,to,elapsed:0,duration:1.8};
 },
 fit(){
  if(S.drag||S.fly||typeof T!=='undefined'&&T.mode==='teacher')return;
  const chosen=fitHero(S.vertical);camera.clearViewOffset();camera.position.copy(chosen.pos);controls.target.copy(chosen.target);camera.fov=chosen.fov;
  camera.lookAt(controls.target);camera.updateProjectionMatrix();
  camera.setViewOffset(innerWidth,innerHeight,-chosen.offsetX,-chosen.offset,innerWidth,innerHeight);camera.updateMatrixWorld();this.layoutDirty=false;
 },
 event(s){this.eventLeft=1.4;this.snapshot={...s};if(Q.i===2){flyTo(S.vertical?SHOTS_VERTICAL[1]:SHOTS[4],.3);}document.body.classList.add('q-event');this.sound([220,330],.45);},
 time(dt){return dt*(this.eventLeft>0?.18:1)*(T.slow ? 0.25 : 1);},
 sound(notes,duration=.35){
  if(!S.sound.target)return;
  audioContext ||= new (window.AudioContext||window.webkitAudioContext)();void audioContext.resume();const now=audioContext.currentTime;
  for(const frequency of notes){const o=audioContext.createOscillator(),g=audioContext.createGain();o.frequency.value=frequency;g.gain.setValueAtTime(.025/notes.length,now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g).connect(audioContext.destination);o.start();o.stop(now+duration);}
 },
 chord(){this.sound([523.25,659.25,783.99],.7);},
 update(dt){
  this.clock+=dt;this.eventLeft=Math.max(0,this.eventLeft-dt);document.body.classList.toggle('q-event',this.eventLeft>0);
  const f=Q.flags,d=QUESTS[Q.i];
  if(this.eventLeft>0&&Q.i===2&&S.run&&!S.vertical){controls.target.copy(E).lerp(BODY.position,.30);camera.lookAt(controls.target);camera.updateMatrixWorld();}
  if(this.eventLeft===0&&this.snapshot){this.snapshot=null;this.layoutDirty=true;}
  document.body.classList.toggle('q-lens',!!f.lens);
  if((!Q.free||f.lens)&&Q.phase!=='intro'&&!S.fly&&this.layoutDirty&&this.eventLeft<=0)this.fit();
  if(S.drag&&S.sound.target){
   if(!this.tone){audioContext ||= new (window.AudioContext||window.webkitAudioContext)();void audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();g.gain.value=.012;o.connect(g).connect(audioContext.destination);o.start();this.tone={o,g};}
   this.tone.o.frequency.setTargetAtTime(140+PHYS.mach(PHYS.v(currentPhi(),currentPeriod()))*130,audioContext.currentTime,.05);
  }else if(this.tone){this.tone.o.stop();this.tone=null;}
  if(Math.floor(this.clock*12)!==this.previewAt){this.previewAt=Math.floor(this.clock*12);qPictures.querySelectorAll('[data-candidate]').forEach(b=>b.innerHTML=CARDS.picture(d.id,d.candidates[+b.dataset.candidate],this.clock));}
  const project=p=>{const v=p.clone().project(camera);return [(v.x+1)*innerWidth/2,(1-v.y)*innerHeight/2];};
  const line=(p,dash=false)=>`<path d="${p}" ${dash?'stroke-dasharray="6 6"':''}/>`;
  const symbol=name=>icon(name).replace(/^<svg[^>]*>|<\/svg>$/g,'');
  const focus=Q.i===0?PIN.position:Q.i===1||Q.i===5?SLIDER.handle.getWorldPosition(V3()):Q.i===2?PLAY_BUTTON.getWorldPosition(V3()):DIAL.knob.getWorldPosition(V3());
  questLight.position.copy(focus).add(V3(0,.12,.18));questLight.intensity=Q.free?0:.5;
  let body='';
  if(!Q.free&&Q.phase==='intro'&&f.elapsed<.9)body=`<g transform="translate(${innerWidth/2-42} ${innerHeight/2-42}) scale(3.5)"><defs><clipPath id="q-wipe"><rect width="${Math.min(24,f.elapsed/.65*24)}" height="24"/></clipPath></defs><g clip-path="url(#q-wipe)">${symbol(d.icon)}</g></g>`;
  if(Q.free&&f.lens)body+=`<svg x="${innerWidth/2-120}" y="${innerWidth<=980?202:110}" width="240" height="${innerWidth<=980?56:112}" viewBox="0 0 300 140">${CARDS.micro(f.lens==='day'?4:1,QUEST.sample()).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg>`;
  if(!Q.free&&Q.phase==='act'){
   for(const value of d.goalMarks){
    const point=Q.i===0?V3(...PHYS.scenePoint(value,S.spin.value,MODEL.pinReach)):Q.i===3||Q.i===4?DIAL.knob.getWorldPosition(V3()).add(V3(Math.sin(-PHYS.periodRailX(value)*Math.PI*1.5)*CONTROL_LAYOUT.dial.cueRadius,Math.cos(-PHYS.periodRailX(value)*Math.PI*1.5)*CONTROL_LAYOUT.dial.cueRadius,CONTROL_LAYOUT.dial.cueDepth)):V3(SLIDER.x+(PHYS.phiRailX(value)-.5)*SLIDER.width,SLIDER.y,SLIDER.z+CONTROL_LAYOUT.slider.cueDepth);
    const [x,y]=project(point);body+=line(`M${x-10} ${y+12}v-24h20v24z`,true);
   }
   if(f.demoLeft>0&&!S.drag){
    const view=Q.i===0?qViews.querySelector('button')?.getBoundingClientRect():null;
    const [x,y]=view?[view.left+view.width/2,view.top+view.height/2]:project(focus),u=Math.min(1,(2.2-f.demoLeft)/1.7);
    const dx=Q.i===1||Q.i===5?65:Q.i===3||Q.i===4?-40:0,dy=dx?-25:-12;
    body+=line(`M${x} ${y}l${dx} ${dy}`,true)+`<g transform="translate(${x+dx*u-12} ${y+dy*u})">${symbol('hand')}</g>`;
   }
   if(f.lens){const actual=QUEST.sample();body+=`<svg x="${innerWidth/2-120}" y="${innerWidth<=980?202:110}" width="240" height="${innerWidth<=980?56:112}" viewBox="0 0 300 140">${CARDS.micro(d.id,actual).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg>`;}
  }
  if(this.eventLeft>0){
   const [x,y]=project(E),age=1.4-this.eventLeft,u=Math.min(1,age/.45),cx=innerWidth/2,cy=innerWidth<=980?220:164;
   body=`<circle cx="${x}" cy="${y}" r="5" fill="#37795d"/>`+line(`M${x} ${y}L${x+(cx-x)*u} ${y+(cy-y)*u}`)+(age>.45?`<svg x="${cx-120}" y="${cy-(innerWidth<=980?28:56)}" width="240" height="${innerWidth<=980?56:112}" viewBox="0 0 300 140"><rect x="1" y="1" width="298" height="138" rx="16" fill="#f4efe3" stroke="#221d18" stroke-width="1.5"/>${d.card(this.snapshot).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg>`:'');
  }
  qOverlay.innerHTML=`<svg viewBox="0 0 ${innerWidth} ${innerHeight}">${body}</svg>`;
 }
};
