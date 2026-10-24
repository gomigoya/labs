// Single scene conversion after environment, apparatus and grammar construction.
KIT.toon=INK.toon;
for(const name of Object.keys(MAT))MAT[name]=INK.convert(MAT[name]);
INK.convertMaterials(scene);
scene.fog=new THREE.Fog(INK_CFG.paper,...INK_CFG.fog);
// One hard key and one cool ambient source; all style values live in INK_CFG.
scene.add(new THREE.AmbientLight(INK_CFG.ambient, INK_CFG.ambientIntensity));
const keyLight = new THREE.SpotLight(INK_CFG.key, INK_CFG.keyIntensity, 30, .65, 0, 1.5);
keyLight.position.set(...INK_CFG.keyPosition);keyLight.target.position.set(...INK_CFG.keyTarget);keyLight.castShadow=true;
keyLight.shadow.mapSize.setScalar(INK_CFG.shadowMap[0]);keyLight.shadow.bias=INK_CFG.shadowBias;keyLight.shadow.normalBias=INK_CFG.shadowNormalBias;
scene.add(keyLight,keyLight.target);
const composer=new EffectComposer(renderer);
const renderPass=new RenderPass(scene,camera);composer.addPass(renderPass);
const inkPass=INK.makeOutlinePass(scene,camera,{wobble:QS.get('wobble')??.5,lowQuality:()=>S.quality==='low'});composer.addPass(inkPass);
composer.addPass(new OutputPass());
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.10; controls.minDistance = 0.5; controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI * 0.49; controls.enablePan = false;
const SHOTS=[
 {name:'room',pos:V3(5.0,4.0,8.5),target:V3(0,1.7,-.8),fov:38},
 {name:'hero',pos:V3(1.5,2.8,5.2),target:V3(0,1.98,0),fov:34},
 {name:'nozzles',pos:V3(.40,1.48,1.8),target:V3(-.28,1.10,.03),fov:34},
 {name:'tank',pos:V3(.90,2.4,2.6),target:V3(-.20,1.65,0),fov:34},
 {name:'cargo',pos:V3(2.3,2.4,3.0),target:V3(.9,1.35,0),fov:34},
 {name:'height',pos:V3(2.2,3.0,4.4),target:V3(.45,2.0,0),fov:36},
];
const SHOTS_VERTICAL=[
 {name:'launch-v',pos:V3(3.5,4.0,9.0),target:V3(0,1.98,0),fov:38},
 {name:'section-v',pos:V3(.7,2.2,4.8),target:V3(-.18,1.75,0),fov:38},
 {name:'gravity-v',pos:V3(2.2,2.1,5.8),target:V3(.60,1.45,0),fov:38},
];
const CONSOLE_SHOT={name:'console',pos:V3(.15,1.40,4.6),target:V3(0,.52,.65),fov:34};
function heroBox(){return new THREE.Box3(V3(...M.boundsMin),V3(...M.boundsMax));}
function projectedBox(box, cam = camera) {
  const points = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) points.push(V3(x, y, z).project(cam));
  const xs = points.map(p => (p.x + 1) * innerWidth / 2), ys = points.map(p => (1 - p.y) * innerHeight / 2);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys), behind: points.some(p => p.z < -1 || p.z > 1) };
}
function heroCoverage() {
  camera.updateMatrixWorld(); const b = projectedBox(heroBox());
  const overlaps = id => {
    const el = document.getElementById(id); if (!el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') return false;
    const r = el.getBoundingClientRect(); return b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top;
  };
  return { width: (b.right - b.left) / innerWidth, height: (b.bottom - b.top) / innerHeight,
    overlaps: overlaps('quests') || overlaps('mission') || overlaps('tools'), overlapsTop: overlaps('quests') || overlaps('mission'), overlapsTools: overlaps('tools'), clipped: b.left < 0 || b.right > innerWidth || b.top < 0 || b.bottom > innerHeight || b.behind, bounds: b };
}
function fitHero(portrait) {
  // Projection-only candidate search; no render in this loop. Fit the maximum extent as well.
  const box = heroBox(), maximumBox = box.clone(), target = box.getCenter(V3());
  const stripBottom=document.getElementById('quests').getBoundingClientRect().bottom,mission=document.getElementById('mission');
  const top = stripBottom + (mission.getClientRects().length ? 10+mission.getBoundingClientRect().height : 0) + 14;
  const tools=document.getElementById('tools').getBoundingClientRect(),pictures=document.getElementById('q-pictures').getBoundingClientRect();
  const bottom=(tools.height?tools.top:innerHeight)-12;
  const pictureTop=portrait?(pictures.height?pictures.top:bottom-112):bottom;
  const cam = camera.clone(); cam.fov = portrait ? 38 : 34; cam.aspect = innerWidth / innerHeight;
  cam.clearViewOffset(); cam.updateProjectionMatrix();
  let best = null;
  for (const azimuth of portrait ? [22, 30, 38] : [18, 24, 30]) for (const elevation of [8, 12, 16]) {
    const az = THREE.MathUtils.degToRad(azimuth), el = THREE.MathUtils.degToRad(elevation);
    const direction = V3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    for (let distance = 2.0; distance <= 20; distance += 0.04) {
      cam.position.copy(target).addScaledVector(direction, distance); cam.lookAt(target); cam.updateMatrixWorld();
      const b = projectedBox(box, cam), maximum = projectedBox(maximumBox, cam), width = (b.right - b.left) / innerWidth;
      const available = pictureTop - top, centerShift = ((top + pictureTop) / 2 - (maximum.top + maximum.bottom) / 2);
      if (width > 0.75 || width < (portrait ? 0.64 : 0.60) || maximum.bottom - maximum.top > available || b.behind) continue;
      if (maximum.left < 8 || maximum.right > innerWidth - 8 || maximum.top + centerShift < top || maximum.bottom + centerShift > pictureTop || maximum.behind) continue;
      const score = Math.abs(width - (portrait ? 0.74 : 0.69));
      if (!best || score < best.score) best = { score, pos: cam.position.clone(), target: target.clone(), fov: cam.fov, offset: centerShift };
    }
  }
  return best;
}
function shot(index = 1, vertical = innerWidth / innerHeight < 0.9) {
  const list = vertical ? SHOTS_VERTICAL : SHOTS;
  const spec = typeof index === 'object' ? index : index === 'console' ? CONSOLE_SHOT : list[clamp(Math.trunc(index), 0, list.length - 1)];
  S.fly = null; S.shotIndex = index; S.vertical = vertical;
  camera.clearViewOffset();
  let chosen = spec;
  if (index === 'console' && vertical) chosen = { ...CONSOLE_SHOT, pos: V3(0, 2.15, 14.0), fov: 38 };
  if ((!vertical && index === 1) || (vertical && typeof index === 'number')) chosen = fitHero(vertical) || spec;
  camera.position.copy(chosen.pos); camera.fov = chosen.fov;
  controls.target.copy(chosen.target); camera.lookAt(chosen.target); camera.updateProjectionMatrix();
  S.heroOffset=chosen.offset||0;
  if(chosen.offset||!vertical)camera.setViewOffset(innerWidth,innerHeight,!vertical?innerWidth*.12:0,-(chosen.offset||0),innerWidth,innerHeight);
  controls.update(); camera.updateMatrixWorld();
}
function flyTo(index, duration = 1.4) {
  const to = typeof index === 'object' ? index : SHOTS[clamp(Math.trunc(index), 0, SHOTS.length - 1)];
  camera.clearViewOffset();
  S.fly = { from: camera.position.clone(), fromTarget: controls.target.clone(), fromFov: camera.fov, to, elapsed: 0, duration };
}
function resize(refit = true) {
  const low = S.quality === 'low';
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, low ? 1 : 1.6));
  renderer.setSize(innerWidth, innerHeight, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  if (refit) shot(innerWidth / innerHeight < 0.9 ? 0 : 1, innerWidth / innerHeight < 0.9);
}
function setQuality(level) {
  if (!['high', 'low'].includes(level)) throw new RangeError('quality');
  S.quality = level; const low = level === 'low';
  keyLight.shadow.mapSize.setScalar(INK_CFG.shadowMap[low ? 1 : 0]);
  if (keyLight.shadow.map) { keyLight.shadow.map.dispose(); keyLight.shadow.map = null; }
  resize(false);
  return level;
}
window.addEventListener('resize', () => resize());
