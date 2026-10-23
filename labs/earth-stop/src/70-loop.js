function update(dt){
 if(typeof ATTRACT!=='undefined')ATTRACT.update(dt);
 const k=1-Math.exp(-18*dt);
 for(const name of ['phi','period','playing','mode','sound','ui']){
  const p=S[name];p.value+=(p.target-p.value)*k;if(Math.abs(p.target-p.value)<1e-8)p.value=p.target;
 }
 const physicalDt=DIRECTOR.time(dt);
 const elapsed=physicalDt*S.playing.value;
 S.spin.target+=S.run?0:PHYS.spinAngle(elapsed,currentPeriod());
 S.sun.target+=PHYS.sunAngle(elapsed,currentPeriod());
 for(const name of ['spin','sun'])S[name].value+=(S[name].target-S[name].value)*k;
 S.t.target+=elapsed;
 S.t.value+=(S.t.target-S.t.value)*k;
 if(S.run){const p=S.run.elapsed;p.target=Math.min(MODEL.tangentSeconds,p.target+physicalDt*S.playing.value);p.value+=(p.target-p.value)*k;}
 updateHero();
 QUEST.update(dt);
 GRAMMAR.update(dt);
 for(const [name,on] of Object.entries(S.layers))if(!on)LAYERS[name].visible=false;
 drawGraphs();
 if(S.fly){
  const f=S.fly;f.elapsed+=dt;const u=clamp(f.elapsed/f.duration,0,1),smooth=1-(1-u)**3;
  camera.position.lerpVectors(f.from,f.to.pos,smooth);controls.target.lerpVectors(f.fromTarget,f.to.target,smooth);
  camera.fov=THREE.MathUtils.lerp(f.fromFov,f.to.fov,smooth);camera.updateProjectionMatrix();if(u===1)S.fly=null;
 }
 controls.update();DIRECTOR.update(dt);
 if(typeof TEACHER!=='undefined'){TEACHER.update(dt);if(T.mode==='teacher')TEACHER_CFG.frameViewport();}bokehPass.uniforms.focus.value=camera.position.distanceTo(controls.target);composer.render(dt);S.frames++;
}
function step(n=1,dt=1/60){
 if(!Number.isInteger(n)||n<0||n>120||!Number.isFinite(dt)||dt<0||dt>1)throw new RangeError('step');
 for(let i=0;i<n;i++)update(dt);
 return {phi:currentPhi(),P:currentPeriod()===Infinity?'stop':currentPeriod(),t:S.t.value};
}
const LAYERS={room:ROOM,console:CONSOLE,hero:HERO,globe:EARTH_SPIN,pin:PIN,body:BODY,speed:SPEED,sun:SUN_ORBIT,benchmark:BENCHMARK};
function layer(name,on){
 if(!(name in LAYERS))throw new RangeError(name);S.layers[name]=!!on;LAYERS[name].visible=!!on;
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
      const buffer = renderer.getDrawingBufferSize(new THREE.Vector2()), bloomScale = S.quality === 'low' ? .5 : 1;
      bloomPass.setSize(buffer.x * bloomScale, buffer.y * bloomScale);
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
 update(0);const data=canvas.toDataURL('image/jpeg',.94);
 const response=await fetch(`/__save/${name}.jpg`,{method:'POST',headers:{'Content-Type':'text/plain'},body:data});
 if(!response.ok)throw new Error(`capture ${response.status}`);return {name,width:canvas.width,height:canvas.height};
}
function perf(){return {ms:S.ms,fps:1000/S.ms,frames:S.frames,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
 quality:S.quality,ao:aoPass.enabled,bokeh:bokehPass.enabled,pixelRatio:renderer.getPixelRatio(),geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures};}
window.__lab={quest:QUEST,state:S,PHYS,SHOTS,SHOTS_VERTICAL,PRESETS,set,preset,shot,flyTo,layer,step,quality:setQuality,textAudit,heroCoverage,perf,capture};
function frame(now){
 requestAnimationFrame(frame);const elapsed=S.lastTime?now-S.lastTime:16.67;S.lastTime=now;if(document.hidden)return;
 ATTRACT.health(elapsed);
 S.ms+=(elapsed-S.ms)*.03;S.sampleMs+=Math.min(elapsed,100);S.sampleFrames++;
 if(S.sampleMs>=2000){
  if(S.sampleMs/S.sampleFrames>32&&S.quality!=='low'){
   if(S.autoLevel===0)aoPass.enabled=false;
   else if(S.autoLevel===1){renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight,false);composer.setPixelRatio(1);composer.setSize(innerWidth,innerHeight);}
   else setQuality('low');S.autoLevel++;
  }S.sampleMs=0;S.sampleFrames=0;
 }
 update(Math.min(elapsed/1000,.05));
}
function boot(){
 syncUI();setQuality(QS.get('lite')==='1'||window.__SITE__?.quality==='low'?'low':'high');
 updateHero();shot(S.vertical?0:1,S.vertical);QUEST.go(0);TEACHER.mode(QS.get('teacher')==='1'?'teacher':'student');update(0);if(QS.get('capture')!=='1')requestAnimationFrame(frame);
}
