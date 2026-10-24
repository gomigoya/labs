function update(dt){
 ATTRACT.update(dt);
 const physicalDt=DIRECTOR.time(dt);
 ENVIRONMENT.update(physicalDt);
 const k=1-Math.exp(-18*dt);
 for(const name of ['u','species','ground','playing','sound','ui','cassette']){const p=S[name];p.value+=(p.target-p.value)*k;if(Math.abs(p.target-p.value)<1e-8)p.value=p.target;}
 S.t.target+=physicalDt*S.playing.value*(Q.free?1.8:Math.PI/.9);S.t.value+=(S.t.target-S.t.value)*k;
 updateHero();drawGraphs();QUEST.update(dt);syncUI(true);GRAMMAR.update(physicalDt);
 if(S.fly){const f=S.fly;f.elapsed+=dt;const u=clamp(f.elapsed/f.duration,0,1),smooth=1-(1-u)**3;
  camera.position.lerpVectors(f.from,f.to.pos,smooth);controls.target.lerpVectors(f.fromTarget,f.to.target,smooth);camera.fov=THREE.MathUtils.lerp(f.fromFov,f.to.fov,smooth);camera.updateProjectionMatrix();
  const ox=THREE.MathUtils.lerp(f.fromView?.offsetX||0,f.to.view?.offsetX??-(f.to.offsetX||0),smooth),oy=THREE.MathUtils.lerp(f.fromView?.offsetY||0,f.to.view?.offsetY??-(f.to.offset||0),smooth);
  camera.setViewOffset(innerWidth,innerHeight,ox,oy,innerWidth,innerHeight);if(u===1)S.fly=null;}
 controls.update();camera.updateMatrixWorld();DIRECTOR.update(dt);camera.updateMatrixWorld();TEACHER.update(dt);if(T.mode==='teacher')TEACHER_CFG.frameViewport();renderFrame(dt);S.frames++;
}
function renderFrame(dt){styleDiagramPanels(scene);INK.convertMaterials(scene);composer.render(dt);}
function step(n=1,dt=1/60){if(!Number.isInteger(n)||n<0||n>120||!Number.isFinite(dt)||dt<0||dt>1)throw new RangeError('step');for(let i=0;i<n;i++)update(dt);return{kids:PHYS.kidsFromRailX(S.u.value),species:SPECIES_KEYS[Math.round(S.species.value)],mu:GROUND_VALUES[Math.round(S.ground.value)]};}
function layer(name,on){const layers={room:ROOM,console:CONSOLE,hero:HERO,capacities:CAPACITIES,track:TRACK};if(!(name in layers))throw new RangeError(name);S.layers[name]=!!on;layers[name].visible=!!on;}
async function capture(name='hero'){
 if(!/^[\w-]+$/.test(name))throw new TypeError('capture');
 if(name==='thumb'){
  const saved={ratio:renderer.getPixelRatio(),size:renderer.getSize(new THREE.Vector2()),camera:camera.clone(),state:Object.fromEntries(['u','species','ground','playing','t','cassette'].map(k=>[k,{...S[k]}])),visibility:[ROOM,CONSOLE,HERO,TRACK,...HERO.children].map(o=>[o,o.visible]),target:controls.target.clone(),fly:S.fly,mode:T.mode,ui:TEACHER_CFG.getUI()};
  let data;
  try{
   TEACHER_CFG.ui(false);T.mode='free';S.fly=null;
   const representative=PHYS.DRAMA.representative;
   S.u.value=S.u.target=PHYS.railX(representative.n);S.species.value=S.species.target=representative.speciesIndex;S.ground.value=S.ground.target=representative.groundIndex;
   S.playing.value=S.playing.target=0;S.t.value=S.t.target=representative.phase;S.cassette.value=S.cassette.target=0;
   ROOM.visible=CONSOLE.visible=HERO.visible=TRACK.visible=true;updateHero();
   camera.clearViewOffset();camera.aspect=1200/750;camera.position.copy(TEACHER_CFG.heroShot.pos);controls.target.copy(TEACHER_CFG.heroShot.target);camera.fov=TEACHER_CFG.heroShot.fov;camera.lookAt(controls.target);camera.updateProjectionMatrix();camera.setViewOffset(1200,750,-TEACHER_CFG.heroShot.offsetX,-TEACHER_CFG.heroShot.offset,1200,750);
   renderer.setPixelRatio(1);renderer.setSize(1200,750,false);composer.setPixelRatio(1);composer.setSize(1200,750);
   drawGraphs();GRAMMAR.update(0);
   // Grammar groups follow the base apparatus in HERO; the thumbnail isolates the tug.
   const end=HERO.children.indexOf(CAPACITIES);HERO.children.forEach((child,i)=>{if(i>=end)child.visible=false;});
   camera.updateMatrixWorld();renderFrame(0);data=canvas.toDataURL('image/jpeg',.94);
  }finally{
   renderer.setPixelRatio(saved.ratio);renderer.setSize(saved.size.x,saved.size.y,false);composer.setPixelRatio(saved.ratio);composer.setSize(saved.size.x,saved.size.y);
   camera.copy(saved.camera);controls.target.copy(saved.target);S.fly=saved.fly;T.mode=saved.mode;for(const [k,v]of Object.entries(saved.state))Object.assign(S[k],v);for(const [object,visible]of saved.visibility)object.visible=visible;TEACHER_CFG.ui(saved.ui);updateHero();
  }
  const response=await fetch('/__save/thumb.jpg',{method:'POST',headers:{'Content-Type':'text/plain'},body:data});if(!response.ok)throw new Error('capture '+response.status);return {name,width:1200,height:750};
 }
const size=renderer.getSize(new THREE.Vector2());
 if(!canvas.width||!canvas.height||size.x!==innerWidth||size.y!==innerHeight)resize(false);
 update(0);const data=canvas.toDataURL('image/jpeg',.94);const r=await fetch('/__save/'+name+'.jpg',{method:'POST',headers:{'Content-Type':'text/plain'},body:data});if(!r.ok)throw new Error('capture '+r.status);return{name,width:canvas.width,height:canvas.height};
}
function perf(){return{ms:S.ms,fps:1000/S.ms,frames:S.frames,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,quality:S.quality,ao:false,bokeh:false,pixelRatio:renderer.getPixelRatio(),geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures};}
window.__lab={state:S,PHYS,quest:QUEST,mode:m=>TEACHER.mode(m==='explore'?'free':m),SHOTS,SHOTS_VERTICAL,set,preset,shot,flyTo,layer,step,quality:setQuality,textAudit,heroCoverage,perf,capture};
function frame(now){requestAnimationFrame(frame);const elapsed=S.lastTime?now-S.lastTime:16.67;S.lastTime=now;if(document.hidden)return;ATTRACT.health(elapsed);S.ms+=(elapsed-S.ms)*.03;update(Math.min(elapsed/1000,.05));}
function boot(){
 // Bind the portable teacher controller to the same responsive stage lane as students.
 TEACHER_CFG.frameViewport=()=>{
  const region=stageRegion(),key=[innerWidth,innerHeight,S.species.value,...Object.values(region)].join(':');
  if(T.mode==='teacher'&&!S.fly&&!S.drag&&DIRECTOR.eventLeft<=0&&key!==TEACHER_CFG.stageKey){shot(S.vertical?0:1,S.vertical);TEACHER_CFG.stageKey=key;}
 };
 showTools('species');syncUI();setQuality(QS.get('lite')==='1'||window.__SITE__?.quality==='low'?'low':'high');updateHero();shot(S.vertical?0:1,S.vertical);QUEST.go(QUEST.first());TEACHER.mode(QS.get('teacher')==='1'?'teacher':'student');update(0);requestAnimationFrame(frame);}
