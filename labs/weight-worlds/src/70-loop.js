function update(dt){
  ATTRACT.update(dt);
  const physicalDt=DIRECTOR.time(dt);
  const k=1-Math.exp(-18*dt);
  for(const name of ['body','nWeights','playing','sound','ui']){
    const p=S[name];p.value+=(p.target-p.value)*k;if(Math.abs(p.target-p.value)<1e-8)p.value=p.target;
  }
  if(S.trial)S.t.target+=physicalDt*S.playing.value;
  S.t.value+=(S.t.target-S.t.value)*k;if(Math.abs(S.t.target-S.t.value)<1e-8)S.t.value=S.t.target;
  updateHero();drawGraphs();
  QUEST.update(dt);GRAMMAR.update(physicalDt);
  ENVIRONMENT.update(physicalDt);
  if(S.fly){
    const f=S.fly;f.elapsed+=dt;const u=clamp(f.elapsed/f.duration,0,1),smooth=1-(1-u)**3;
    camera.position.lerpVectors(f.from,f.to.pos,smooth);controls.target.lerpVectors(f.fromTarget,f.to.target,smooth);
    camera.fov=THREE.MathUtils.lerp(f.fromFov,f.to.fov,smooth);camera.updateProjectionMatrix();if(u===1)S.fly=null;
  }
  controls.update();DIRECTOR.update(dt);TEACHER.update(dt);
  if(T.mode==='teacher')TEACHER_CFG.frameViewport();
  styleDiagramPanels(scene);composer.render(dt);S.frames++;
}
function step(n=1,dt=1/60){
  if(!Number.isInteger(n)||n<0||n>120||!Number.isFinite(dt)||dt<0||dt>1)throw new RangeError('step');
  for(let i=0;i<n;i++)update(dt);
  return {body:Math.round(S.body.value),nWeights:Math.round(S.nWeights.value),t:S.t.value};
}
function layer(name,on){
  const layers={room:ROOM,console:CONSOLE,hero:HERO,force:FORCE,spring:SPRING_RIG,shelf:SHELF_RIG,balance:BALANCE_RIG,jump:JUMP_RIG};
  if(!(name in layers))throw new RangeError(name);S.layers[name]=!!on;layers[name].visible=!!on;
}
async function capture(name='hero'){
  if(!/^[\w-]+$/.test(name))throw new TypeError('capture');
  if (name === 'thumb') {
    const saved = { ratio: renderer.getPixelRatio(), size: renderer.getSize(new THREE.Vector2()),
      camera: camera.clone(), target: controls.target.clone(), fly: S.fly, shotIndex: S.shotIndex,
      vertical: S.vertical, ui: !!S.ui.target };
    let data;
    try {
      TEACHER_CFG.ui(false); S.fly = null;
      camera.clearViewOffset(); camera.aspect = 1200 / 750;
      camera.position.copy(TEACHER_CFG.heroShot.pos); controls.target.copy(TEACHER_CFG.heroShot.target);
      camera.fov = TEACHER_CFG.heroShot.fov; camera.lookAt(controls.target); camera.updateProjectionMatrix();
      renderer.setPixelRatio(1); renderer.setSize(1200, 750, false);
      composer.setPixelRatio(1); composer.setSize(1200, 750); composer.render(0);
      data = canvas.toDataURL('image/jpeg', .94);
    } finally {
      renderer.setPixelRatio(saved.ratio); renderer.setSize(saved.size.x, saved.size.y, false);
      composer.setPixelRatio(saved.ratio); composer.setSize(saved.size.x, saved.size.y);
      camera.copy(saved.camera); controls.target.copy(saved.target); S.fly = saved.fly;
      S.shotIndex = saved.shotIndex; S.vertical = saved.vertical; TEACHER_CFG.ui(saved.ui);
      composer.render(0);
    }
    const response = await fetch('/__save/thumb.jpg', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: data });
    if (!response.ok) throw new Error(`capture ${response.status}`);
    return { name, width: 1200, height: 750 };
  }
  const size=renderer.getSize(new THREE.Vector2());
  if(!canvas.width||!canvas.height||size.x!==innerWidth||size.y!==innerHeight)resize(false);
  update(0);const data=canvas.toDataURL('image/jpeg',0.94);
  const response=await fetch(`/__save/${name}.jpg`,{method:'POST',headers:{'Content-Type':'text/plain'},body:data});
  if(!response.ok)throw new Error(`capture ${response.status}`);return {name,width:canvas.width,height:canvas.height};
}
function perf(){
  return {ms:S.ms,fps:1000/S.ms,frames:S.frames,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
    quality:S.quality,ao:false,bokeh:false,pixelRatio:renderer.getPixelRatio(),
    geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures};
}
window.__lab={state:S,PHYS,quest:QUEST,SHOTS,SHOTS_VERTICAL,set,preset,shot,flyTo,layer,step,quality:setQuality,textAudit,heroCoverage,perf,capture,run:runTrial};
function boot(){
  syncUI();setQuality(QS.get('lite')==='1'||window.__SITE__?.quality==='low'?'low':'high');
  layoutHero(S.vertical);updateHero();shot(S.vertical?0:1,S.vertical);QUEST.go(0);TEACHER.mode(QS.get('teacher')==='1'?'teacher':'student');update(0);requestAnimationFrame(frame);
}
function frame(now){
  requestAnimationFrame(frame);const elapsed=S.lastTime?now-S.lastTime:16.67;S.lastTime=now;if(document.hidden)return;
  ATTRACT.health(elapsed);
  S.ms+=(elapsed-S.ms)*0.03;
  update(Math.min(elapsed/1000,0.05));
}
