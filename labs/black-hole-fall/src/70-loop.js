function update(dt){
 ATTRACT.update(dt);
 const physicalDt=DIRECTOR.time(dt);
 ENVIRONMENT.update(physicalDt);
 const k=1-Math.exp(-18*physicalDt);
 if(S.playing.target&&!A.active){
  S.u.target=Math.min(1,S.u.target+physicalDt/MODEL.scanSeconds);
  if(S.u.target===1){S.playing.target=0;syncUI();}
 }
 S.t.target+=physicalDt;
 for(const name of ['u','massIndex','orientation','playing','t','sound','ui','cutaway']){
  const p=S[name];p.value+=(p.target-p.value)*k;if(Math.abs(p.value-p.target)<1e-9)p.value=p.target;
 }
 // A graph record contains independent measured inputs only. No fake comparison data.
 if(orientation()==='radial'&&Math.abs(currentR()-1)<1e-7&&S.u.target===PHYS.railX(1)&&!S.records.some(s=>s.i===massIndex()))S.records.push({i:massIndex(),r:1});
 if(S.fly){
  const f=S.fly;f.elapsed+=dt;const u=clamp(f.elapsed/f.duration,0,1),ease=1-(1-u)**3;
  camera.position.lerpVectors(f.from,f.to.pos,ease);controls.target.lerpVectors(f.fromTarget,f.to.target,ease);
  camera.fov=THREE.MathUtils.lerp(f.fromFov,f.to.fov,ease);camera.updateProjectionMatrix();if(u===1)S.fly=null;
 }
 controls.update();scene.updateMatrixWorld(true);updateHero();QUEST.update(dt);GRAMMAR.update(physicalDt);drawGraphs();DIRECTOR.update(dt);TEACHER.update(dt);
 if(T.mode==='teacher')TEACHER_CFG.frameViewport();
 composer.render(dt);S.frames++;
}
function step(n=1,dt=1/60){
 if(!Number.isInteger(n)||n<0||n>120||!Number.isFinite(dt)||dt<0||dt>1)throw new RangeError('step');
 for(let i=0;i<n;i++)update(dt);
 return {r:currentR(),massIndex:massIndex(),orientation:orientation()};
}
function layer(name,on){
 const layers={room:ROOM,console:CONSOLE,hero:HERO,grid:GRID,front:FRONT_GRID,disk:DISK,horizon:HORIZON,probe:PROBE};
 if(!(name in layers))throw new RangeError(name);S.layers[name]=!!on;layers[name].visible=!!on;
}
async function capture(name = 'hero') {
  if (!/^[\w-]+$/.test(name)) throw new TypeError('capture');
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
  const size = renderer.getSize(new THREE.Vector2());
  if (!canvas.width || !canvas.height || size.x !== innerWidth || size.y !== innerHeight) resize(false);
  update(0);
  const data = canvas.toDataURL('image/jpeg', 0.94);
  const response = await fetch(`/__save/${name}.jpg`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: data });
  if (!response.ok) throw new Error(`capture ${response.status}`);
  return { name, width: canvas.width, height: canvas.height };
}
function perf() {
  return { ms: S.ms, fps: 1000 / S.ms, frames: S.frames, calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles, quality: S.quality, ao:false, bokeh:false,
    pixelRatio: renderer.getPixelRatio(), geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures };
}
window.__lab={state:S,PHYS,quest:QUEST,SHOTS,SHOTS_VERTICAL,PRESETS,set,preset,shot,flyTo,layer,step,quality:setQuality,textAudit,heroCoverage,perf,capture};
function boot(){
 questLight.removeFromParent();
 syncUI();setQuality(QS.get('lite')==='1'||window.__SITE__?.quality==='low'?'low':'high');
 updateHero();shot(S.vertical?0:1,S.vertical);QUEST.go(0);TEACHER.mode(QS.get('teacher')==='1'?'teacher':'student');update(0);requestAnimationFrame(frame);
}
function frame(now){
 requestAnimationFrame(frame);const elapsed=S.lastTime?now-S.lastTime:16.67;S.lastTime=now;if(document.hidden)return;
 ATTRACT.health(elapsed);
 S.ms+=(elapsed-S.ms)*0.03;
 update(Math.min(elapsed/1000,0.05));
}

