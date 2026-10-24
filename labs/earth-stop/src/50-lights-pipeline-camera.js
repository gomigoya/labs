// The reference rejects empty background neighbors. Supply a colorless inward
// depth shell so objects against orbital paper still have silhouette neighbors.
// It follows the camera without changing any shot, world object or color pixel.
const inkBackdropGeometry=new THREE.SphereGeometry(camera.far*INK_CFG.depthBackdropRatio,32,16);
const inkBackdropIndex=inkBackdropGeometry.index;
for(let i=0;i<inkBackdropIndex.count;i+=3){const a=inkBackdropIndex.getX(i+1);inkBackdropIndex.setX(i+1,inkBackdropIndex.getX(i+2));inkBackdropIndex.setX(i+2,a);}
inkBackdropGeometry.computeVertexNormals();
const inkBackdrop=new THREE.Mesh(inkBackdropGeometry,new THREE.MeshBasicMaterial({colorWrite:false}));
inkBackdrop.userData.inkInner=false;inkBackdrop.frustumCulled=false;camera.add(inkBackdrop);scene.add(camera);
// One conversion site, after all scene/grammar construction and before lighting.
KIT.toon=INK.toon;
for(const name of Object.keys(MAT))MAT[name]=INK.convert(MAT[name]);
INK.convertMaterials(scene);
scene.background=new THREE.Color(INK_CFG.paper);scene.fog=new THREE.Fog(INK_CFG.paper,...INK_CFG.fog);
scene.add(new THREE.AmbientLight(INK_CFG.ambient,INK_CFG.ambientIntensity));
const keyLight=new THREE.SpotLight(INK_CFG.key,INK_CFG.keyIntensity,30,.65,0,1.5);
keyLight.position.set(...INK_CFG.keyPosition);keyLight.target.position.set(...INK_CFG.keyTarget);keyLight.castShadow=true;
keyLight.shadow.mapSize.setScalar(INK_CFG.shadowMap[0]);keyLight.shadow.bias=INK_CFG.shadowBias;keyLight.shadow.normalBias=INK_CFG.shadowNormalBias;
scene.add(keyLight,keyLight.target);
const composer=new EffectComposer(renderer);
const renderPass=new RenderPass(scene,camera);composer.addPass(renderPass);
const inkPass=INK.makeOutlinePass(scene,camera,{wobble:QS.get('wobble')??.5,lowQuality:()=>S.quality==='low'});composer.addPass(inkPass);
composer.addPass(new OutputPass());
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.10; controls.minDistance = 0.5; controls.maxDistance = 24;
controls.maxPolarAngle = Math.PI * 0.49; controls.enablePan = false;
// Fixed camera presets are seeds; hero shots are fitted by projection only.
const SHOTS = [
 {name:'room',pos:V3(5,4,9),target:V3(0,1.65,-.6),fov:38},
 {name:'hero',pos:V3(.6,2.5,4.6),target:E.clone(),fov:34},
 {name:'equator',pos:V3(1.6,2.7,4.6),target:V3(.25,1.95,.15),fov:34},
 {name:'polar',pos:V3(1.2,3.1,3.8),target:V3(-.25,2.35,.1),fov:34},
 {name:'tangent',pos:V3(.9,2.4,3.6),target:V3(.4,1.95,.3),fov:34},
 {name:'solar',pos:V3(3,4,5.7),target:E.clone(),fov:36}
];
const SHOTS_VERTICAL = [
 {name:'hero-v',pos:V3(4,4,12),target:V3(0,1.9,0),fov:38},
 {name:'pin-v',pos:V3(1.3,2.9,7.5),target:V3(0,2.05,.15),fov:38},
 {name:'solar-v',pos:V3(3,4,11),target:E.clone(),fov:38}
];
const CONSOLE_SHOT = {name:'console',pos:V3(0,1.35,4.7),target:V3(0,.62,.7),fov:34};
function projectedBundle(points,cam=camera){
  const projected=points.map(p=>V3(...p).project(cam));
  const xs=projected.map(p=>(p.x+1)*innerWidth/2),ys=projected.map(p=>(1-p.y)*innerHeight/2);
  return {left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys),behind:projected.some(p=>p.z < -1 || p.z>1)};
}
function heroCoverage() {
  camera.updateMatrixWorld(); const b = projectedBundle(PHYS.sceneEnvelope());
  const overlaps = id => {
    const el = document.getElementById(id); if (!el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') return false;
    const r = el.getBoundingClientRect(); return b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top;
  };
  return { width: (b.right - b.left) / innerWidth, height: (b.bottom - b.top) / innerHeight,
    overlaps: overlaps('quests') || overlaps('tools') || overlaps('mission'), overlapsTop: overlaps('quests'), overlapsTools: overlaps('tools'), overlapsMission: overlaps('mission'), clipped: b.left < 0 || b.right > innerWidth || b.top < 0 || b.bottom > innerHeight || b.behind, bounds: b };
}
function fitHero(portrait) {
  const envelope=PHYS.sceneEnvelope(),target=E.clone();
  const deck=document.getElementById('q-pictures'),dr=deck.getBoundingClientRect();
  const deckOn=!deck.hidden&&!!deck.children.length&&getComputedStyle(deck).display!=='none';
  const banner=document.getElementById('mission'),mr=banner.getBoundingClientRect();
  const top=Math.max(document.getElementById('quests').getBoundingClientRect().bottom+14,
    banner.getClientRects().length?mr.bottom+14:0,deckOn&&(portrait||Q.phase!=='predict')?dr.bottom+12:0);
  const tools=document.getElementById('tools');
  const bottom=getComputedStyle(tools).display==='none'?innerHeight-12:tools.getBoundingClientRect().top-14;
  const left=!portrait&&deckOn&&Q.phase==='predict'?dr.right+16:12;
  const right=innerWidth-12,available=Math.max(100,bottom-top);
  const cam=camera.clone();cam.fov=portrait?38:34;cam.aspect=innerWidth/innerHeight;cam.clearViewOffset();cam.updateProjectionMatrix();
  const az=THREE.MathUtils.degToRad(8),el=THREE.MathUtils.degToRad(10);
  const direction=V3(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el));
  let lo=1,hi=24;
  for(let i=0;i<24;i++){
    const distance=(lo+hi)/2;cam.position.copy(target).addScaledVector(direction,distance);cam.lookAt(target);cam.updateMatrixWorld();
    const b=projectedBundle(envelope,cam),w=b.right-b.left,h=b.bottom-b.top;
    if(b.behind||w>Math.min(innerWidth*.70,right-left)||h>available)lo=distance;else hi=distance;
  }
  cam.position.copy(target).addScaledVector(direction,hi);cam.lookAt(target);cam.updateMatrixWorld();
  const b=projectedBundle(envelope,cam);
  return {pos:cam.position.clone(),target,fov:cam.fov,offset:(top+bottom-b.top-b.bottom)/2,offsetX:(left+right-b.left-b.right)/2};
}
function shot(index = 1, vertical = innerWidth / innerHeight < 0.9) {
  const list = vertical ? SHOTS_VERTICAL : SHOTS;
  const spec = typeof index === 'object' ? index : index === 'console' ? CONSOLE_SHOT : list[clamp(Math.trunc(index), 0, list.length - 1)];
  S.fly = null; S.shotIndex = index; S.vertical = vertical;
  camera.clearViewOffset();
  let chosen = spec;
  if (index === 'console' && vertical) chosen = { ...CONSOLE_SHOT, pos: V3(0, 1.70, 14.2), fov: 38 };
  if ((!vertical && (index === 1 || index === SHOTS[1])) || (vertical && index !== 'console')) chosen = fitHero(vertical) || spec;
  camera.position.copy(chosen.pos); camera.fov = chosen.fov;
  controls.target.copy(chosen.target); camera.lookAt(chosen.target); camera.updateProjectionMatrix();
  if(chosen.offset||chosen.offsetX)camera.setViewOffset(innerWidth,innerHeight,-(chosen.offsetX||0),-(chosen.offset||0),innerWidth,innerHeight);
  controls.update(); camera.updateMatrixWorld();
}
function flyTo(index, duration = 1.4) {
  const list = S.vertical ? SHOTS_VERTICAL : SHOTS;
  const seed = typeof index === 'object' ? index : list[clamp(Math.trunc(index),0,list.length-1)];
  const to = S.vertical ? fitHero(true) || seed : seed;
  camera.clearViewOffset();
  S.fly = { from: camera.position.clone(), fromTarget: controls.target.clone(), fromFov: camera.fov, to, elapsed: 0, duration };
}
function resize(refit = true) {
  const low = S.quality === 'low';
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, low ? 1 : 1.6));
  renderer.setSize(innerWidth, innerHeight, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  if (refit) { syncMission();const vertical=innerWidth/innerHeight<0.9; shot(vertical ? 0 : 1,vertical); }
}
function setQuality(level) {
  if (!['high', 'low'].includes(level)) throw new RangeError('quality');
  S.quality = level; const low = level === 'low';
  keyLight.shadow.mapSize.setScalar(INK_CFG.shadowMap[low?1:0]);
  if (keyLight.shadow.map) { keyLight.shadow.map.dispose(); keyLight.shadow.map = null; }
  resize(false);
  return level;
}
window.addEventListener('resize', () => resize());
