// Presentation consumes model snapshots and never decides completion.
const questLight=new THREE.PointLight(THEME.cool,0,.8,2);scene.add(questLight);
const DIRECTOR={
 fitKey:'',clock:0,eventLeft:0,snapshot:null,previewAt:-1,tone:null,eventFrame:null,wasPlaying:false,
 clear(){this.fitKey='';this.eventLeft=0;this.snapshot=null;this.eventFrame=null;this.wasPlaying=false;document.body.classList.remove('q-bars','q-event');},
 intro(){document.body.classList.add('q-bars');shot(0,S.vertical);},
 push(){
  document.body.classList.remove('q-bars');const from=camera.position.clone(),target=controls.target.clone(),fov=camera.fov;
  this.fit();const to={pos:camera.position.clone(),target:controls.target.clone(),fov:camera.fov,view:camera.view?{...camera.view}:null};
  camera.position.copy(from);controls.target.copy(target);camera.fov=fov;camera.updateProjectionMatrix();flyTo(to,1.8);
 },
 fit(){shot(S.vertical?0:1,S.vertical);},
 event(s){
  this.snapshot=structuredClone(s);this.eventLeft=1.4;this.sound([220,330],.4);
  document.body.classList.add('q-event');
  const chosen=fitHero(FLAG.position.x);
  if(chosen){this.eventFrame=chosen;flyTo(chosen,.32);}
 },
 time(dt){return dt*(this.eventLeft>0?.18:1)*(T.slow ? 0.25 : 1);},
 sound(notes,duration=.35){if(!S.sound.target)return;audioContext ||= new(window.AudioContext||window.webkitAudioContext)();void audioContext.resume();const now=audioContext.currentTime;for(const freq of notes){const o=audioContext.createOscillator(),g=audioContext.createGain();o.frequency.value=freq;g.gain.setValueAtTime(.025/notes.length,now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g).connect(audioContext.destination);o.start();o.stop(now+duration);}},
 chord(){this.sound([523.25,659.25,783.99],.7);},
 update(dt){
  this.clock+=dt;this.eventLeft=Math.max(0,this.eventLeft-dt);document.body.classList.toggle('q-event',this.eventLeft>0);
  const s=QUEST.sample(),d=QUESTS[Q.i],f=Q.flags;
  const playing=S.playing.target>0;
  if(Q.free&&playing&&!this.wasPlaying&&!A.active)this.event(s);
  this.wasPlaying=playing;
  const region=stageRegion(this.eventLeft>0),fitKey=[innerWidth,innerHeight,Q.free,Q.phase,s.species,T.mode,...Object.values(region)].join(':');
  if(this.eventLeft>0&&this.eventFrame){
   // Keep the complete device inside its lane while following the moving center flag.
   if(!S.fly){
    const focus=FLAG.getWorldPosition(V3()),target=this.eventFrame.target.clone();target.x+=focus.x*.045;
    controls.target.lerp(target,1-Math.exp(-2*dt));camera.lookAt(controls.target);camera.updateMatrixWorld();
    const b=projectedBox(heroBox());
    const dx=Math.max(region.left-b.left,Math.min(region.right-b.right,0)),dy=Math.max(region.top-b.top,Math.min(region.bottom-b.bottom,0));
    if(dx||dy){const view=camera.view;camera.setViewOffset(innerWidth,innerHeight,(view?.offsetX||0)-dx,(view?.offsetY||0)-dy,innerWidth,innerHeight);}
   }
  }else if(this.eventFrame){this.eventFrame=null;this.snapshot=null;this.fitKey='';}
  const autoFrame=!Q.free||T.mode==='teacher'||S.shotIndex===(S.vertical?0:1);
  if(autoFrame&&!S.fly&&!S.drag&&!A.active&&(Q.free||Q.phase!=='intro')&&this.eventLeft<=0&&fitKey!==this.fitKey){this.fit();this.fitKey=fitKey;}

  if(S.drag&&S.sound.target){
   audioContext ||= new(window.AudioContext||window.webkitAudioContext)();
   if(!this.tone){void audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();g.gain.value=.012;o.connect(g).connect(audioContext.destination);o.start();this.tone={o,g};}
   this.tone.o.frequency.setTargetAtTime(140+PHYS.forceVisual(PHYS.kidCap(s.n,s.mu)).length*12,audioContext.currentTime,.05);
  }else if(this.tone){this.tone.o.stop();this.tone=null;}
  if(Math.floor(this.clock*12)!==this.previewAt){this.previewAt=Math.floor(this.clock*12);qPictures.querySelectorAll('[data-candidate]').forEach(b=>b.innerHTML=CARDS.picture(d.id,d.candidates[+b.dataset.candidate],this.clock,s));}
  const project=p=>{const v=p.clone().project(camera);return [(v.x+1)*innerWidth/2,(1-v.y)*innerHeight/2];};
  const line=(p,dash=false)=>CARDS.path(p,'#ffce8b',dash);
  let body='';
  const actionFocus=QUEST.focus();document.body.dataset.focus=actionFocus;
  const focus=['rail','pull','slip'].includes(actionFocus)?RAIL_HANDLE:actionFocus==='play'?PLAY_BUTTON:actionFocus==='ground'?CASSETTES[Math.round(S.ground.value)]:actionFocus==='compare'?GRAPHS[1].mesh:DINO_MODELS[Math.round(S.species.value)];
  questLight.position.copy(focus.getWorldPosition(V3())).add(V3(0,.18,.15));questLight.intensity=Q.free?0:.4;
  if(!Q.free&&Q.phase==='intro'&&f.elapsed<.9)body=`<defs><clipPath id="q-wipe"><rect x="${innerWidth/2-42}" y="${innerHeight/2-42}" width="${84*Math.min(1,f.elapsed/.65)}" height="84"/></clipPath></defs><g clip-path="url(#q-wipe)"><svg x="${innerWidth/2-42}" y="${innerHeight/2-42}" width="84" height="84" viewBox="0 0 24 24"><path d="${ICONS[d.icon]}"/></svg></g>`;
  if(!Q.free&&Q.phase==='act'){
   const goals=Q.i===4?[Math.min(100,(f.before?.n||s.n)+PHYS.C.increaseQ5)]:d.goalMarks;
   for(const n of goals){const [x,y]=project(V3(PHYS.railWorldX(PHYS.railX(n)),PHYS.SCENE.railY,PHYS.SCENE.railZ));body+=line(`M${x-10} ${y+10}v-25h20v25z`,true);}
   // Palette controls and the physical handle both identify the current action.
   const sampleId=Q.i===5?(f.visited.includes(SPECIES_KEYS[0])?'tool-s5':'tool-s0'):'tool-s1';
   const target=actionFocus==='ground'?document.getElementById('tool-g0'):actionFocus==='compare'?document.getElementById('tool-compare'):actionFocus==='species'?(document.getElementById(sampleId)||paletteNext):null;
   let [x,y]=project(focus.getWorldPosition(V3()));if(target){const r=target.getBoundingClientRect();x=r.x+r.width/2;y=r.y+r.height/2;}
   if(f.demoLeft>0&&!S.drag){const direction=['rail','pull','slip'].includes(actionFocus)?1:0,shift=(1-f.demoLeft/2.2)*45*direction;body+=line(`M${x} ${y}h${direction?45:1}`,true)+`<svg x="${x+shift-12}" y="${y-12}" width="30" height="30" viewBox="0 0 24 24"><path d="${ICONS.hand}"/></svg>`;}
  }
  if(this.eventLeft>0&&s.rivalN===0){
   const [x,y]=project(FLAG.getWorldPosition(V3())),age=1.4-this.eventLeft;
   const sample=this.snapshot,slip=PHYS.outcome(sample.n,sample.species,sample.mu).limiter==='friction';
   const explanation=slip?CARDS.micro(sample):CARDS.principle(Q.free?3:d.id,sample);
   const content=explanation.replace(/^<svg[^>]*>|<\/svg>$/g,'');
   // Draw a single filled explanation only after the actual diagram is ready.
   const usable=content.includes('<path')||content.includes('<circle');
   const mission=document.getElementById('mission');
   const cy=mission.getClientRects().length?mission.getBoundingClientRect().bottom+8:12,w=S.vertical?150:210,h=S.vertical?70:98;
   body=age>.45&&usable?`<circle cx="${x}" cy="${y}" r="5"/>`+line(`M${x} ${y}L${innerWidth/2} ${cy+h}`)+`<svg x="${innerWidth/2-w/2}" y="${cy}" width="${w}" height="${h}" viewBox="0 0 300 140"><rect x="1" y="1" width="298" height="138" rx="12" fill="#f4efe3" stroke="#221d18" stroke-width="3"/>${content}</svg>`:'';
  }
  qOverlay.innerHTML=body?`<svg viewBox="0 0 ${innerWidth} ${innerHeight}">${body}</svg>`:'';
 }
};
