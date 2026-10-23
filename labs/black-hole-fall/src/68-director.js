// Presentation consumes evidence; it never decides completion.
const questLight=new THREE.PointLight(THEME.cool,0,1,2);scene.add(questLight);
const DIRECTOR={
 clock:0,eventLeft:0,eventReturn:null,snapshot:null,tone:null,previewAt:-1,
 clear(){this.eventLeft=0;this.eventReturn=null;this.snapshot=null;qOverlay.innerHTML='';document.body.classList.remove('q-event','q-bars');},
 intro(){document.body.classList.add('q-bars');shot(S.vertical?SHOTS_VERTICAL[0]:SHOTS[0],S.vertical);},
 push(){
  document.body.classList.remove('q-bars');
  const from=camera.position.clone(),fromTarget=controls.target.clone(),fromFov=camera.fov;
  shot(S.vertical?0:1,S.vertical);camera.clearViewOffset();
  const target=heroBox().getCenter(V3()),available=this.viewport();controls.target.copy(target);camera.lookAt(target);camera.updateMatrixWorld();
  for(let n=0;n<40;n++){
   const b=projectedBox(heroBox());if(b.bottom-b.top<=available.bottom-available.top&&b.right-b.left<=innerWidth*.86)break;
   camera.position.sub(target).multiplyScalar(1.06).add(target);camera.lookAt(target);camera.updateMatrixWorld();
  }
  const to={pos:camera.position.clone(),target:target.clone(),fov:camera.fov};
  camera.position.copy(from);controls.target.copy(fromTarget);camera.fov=fromFov;flyTo(to,1.8);
 },
 viewport(){return {top:document.getElementById('quests').getBoundingClientRect().bottom+12,bottom:toolbar.getBoundingClientRect().top-(innerWidth<=980?150:190)};},
 event(s){this.eventReturn={pos:camera.position.clone(),target:controls.target.clone(),fov:camera.fov};this.snapshot=structuredClone(s);this.eventLeft=.8;S.fly=null;camera.clearViewOffset();document.body.classList.add('q-event');this.sound([220,330],.45);},
 time(dt){return dt*(this.eventLeft>0?.18:1)*(T.slow ? 0.25 : 1);},
 sound(notes,duration=.35){
  if(!S.sound.target)return;
  audioContext ||= new (window.AudioContext||window.webkitAudioContext)();void audioContext.resume();const now=audioContext.currentTime;
  notes.forEach(freq=>{const o=audioContext.createOscillator(),g=audioContext.createGain();o.frequency.value=freq;g.gain.setValueAtTime(.025/notes.length,now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g).connect(audioContext.destination);o.start();o.stop(now+duration);});
 },
 chord(){this.sound([523.25,659.25,783.99],.7);},
 update(dt){
  this.clock+=dt;this.eventLeft=Math.max(0,this.eventLeft-dt);document.body.classList.toggle('q-event',this.eventLeft>0);
  if(this.eventLeft===0&&this.eventReturn){flyTo(this.eventReturn,1);this.eventReturn=null;}
  if(S.drag&&S.sound.target){
   if(!this.tone){audioContext ||= new (window.AudioContext||window.webkitAudioContext)();void audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();g.gain.value=.012;o.connect(g).connect(audioContext.destination);o.start();this.tone={o,g};}
   this.tone.o.frequency.setTargetAtTime(140+PHYS.graphY(PHYS.dA(massIndex(),currentR(),orientation()))*600,audioContext.currentTime,.05);
  }else if(this.tone){this.tone.o.stop();this.tone=null;}
  if(Math.floor(this.clock*12)!==this.previewAt){this.previewAt=Math.floor(this.clock*12);qPictures.querySelectorAll('[data-candidate]').forEach(b=>{const d=QUESTS[Q.i];b.innerHTML=CARDS.picture(d.id,d.candidates[+b.dataset.candidate],this.clock);});}
  const d=QUESTS[Q.i],f=Q.flags,focus=Q.i===3?GRAPHS[1].mesh.getWorldPosition(V3()):RAIL_HANDLE.getWorldPosition(V3());
  questLight.position.copy(focus).add(V3(0,.12,.10));questLight.intensity=Q.free?0:.32;
  if(!Q.free&&f.pushed&&!S.fly&&!S.drag&&this.eventLeft<=0){
   camera.clearViewOffset();camera.updateMatrixWorld();const b=projectedBox(heroBox()),v=this.viewport(),offset=(v.top+v.bottom-b.top-b.bottom)/2;
   camera.setViewOffset(innerWidth,innerHeight,0,-offset,innerWidth,innerHeight);camera.updateMatrixWorld();
  }
  const project=p=>{const v=p.clone().project(camera);return [(v.x+1)*innerWidth/2,(1-v.y)*innerHeight/2];};
  let body='';
  if(!Q.free&&Q.phase==='intro'&&f.elapsed<.9)body=`<g transform="translate(${innerWidth/2-42} ${innerHeight/2-42}) scale(3.5)"><defs><clipPath id="q-wipe"><rect width="${Math.min(24,f.elapsed/.65*24)}" height="24"/></clipPath></defs><g clip-path="url(#q-wipe)">${icon(d.icon).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g></g>`;
  if(!Q.free&&Q.phase==='act'){
   for(const r of d.goalMarks){const [x,y]=project(V3(railStart+(railEnd-railStart)*PHYS.railX(r),railY,railZ));body+=`<circle cx="${x}" cy="${y}" r="20" stroke-dasharray="5 5"/>`;}
   if(f.demoLeft>0&&!S.drag){
    const massGoal=d.handles.includes('mass')&&massIndex()===0;
    let a,b;
    if(massGoal){const r=document.getElementById('tool-mass1').getBoundingClientRect();a=[r.x+r.width/2,r.y+r.height/2];b=a;}
    else if(d.handles.includes('compare')&&(Q.i===3||currentR()===20)){const r=document.getElementById('tool-compare').getBoundingClientRect();a=[r.x+r.width/2,r.y+r.height/2];b=a;}
    else{a=project(RAIL_HANDLE.getWorldPosition(V3()));b=project(V3(railStart+(railEnd-railStart)*PHYS.railX(d.goalMarks.at(-1)),railY,railZ));}
    const p=(2.2-f.demoLeft)/2.2,x=a[0]+(b[0]-a[0])*p,y=a[1]+(b[1]-a[1])*p;
    body+=`<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke-dasharray="5 5"/><g transform="translate(${x-12} ${y-10})">${icon('hand').replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g>`;
   }
  }
  if(!Q.free&&this.eventLeft>0&&this.snapshot){
   const focus=PROBE.getWorldPosition(V3());
   controls.target.lerp(focus,Math.min(1,dt*12));
   const offset=S.vertical?V3(.65,1.25,2.65):V3(.45,.65,1.85);
   camera.position.lerp(focus.clone().add(offset),Math.min(1,dt*8));camera.lookAt(controls.target);
   camera.clearViewOffset();camera.updateMatrixWorld();
   const [x,y]=project(focus);
   body=PHYS.state(this.snapshot.i,this.snapshot.r).intact?`<circle cx="${x}" cy="${y}" r="32" stroke-dasharray="6 6"/>`:`<path d="M${x-50} ${y-36}l24 24-16 24 26 24m32-72-24 24 16 24-26 24"/>`;

  }
  qOverlay.innerHTML=body?`<svg viewBox="0 0 ${innerWidth} ${innerHeight}">${body}</svg>`:'';
 }
};
