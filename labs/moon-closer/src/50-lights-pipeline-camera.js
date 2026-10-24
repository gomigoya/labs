// Dynamic floating diagrams use unlit cream and a CSS-pixel ink border.
const diagramMaterials=new WeakSet();
function styleDiagramPanels(root){
 const screen=new THREE.Color(INK_CFG.diagram.screen);
 root.traverse(o=>{
  if(!o.isMesh||o.geometry?.type!=='PlaneGeometry'||!o.material?.isMeshBasicMaterial||!o.material.color.equals(screen))return;
  const m=o.material;if(diagramMaterials.has(m))return;diagramMaterials.add(m);
  m.fog=false;m.toneMapped=false;
  const border={value:INK_CFG.diagram.borderPx*renderer.getPixelRatio()};
  m.onBeforeCompile=shader=>{
   shader.uniforms.diagramBorder=border;shader.uniforms.diagramInk={value:new THREE.Color(INK_CFG.diagram.ink)};
   shader.vertexShader='varying vec2 diagramUv;\n'+shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\ndiagramUv=uv;');
   shader.fragmentShader='varying vec2 diagramUv;uniform float diagramBorder;uniform vec3 diagramInk;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
    'vec2 diagramPixels=min(diagramUv,1.0-diagramUv)/max(fwidth(diagramUv),vec2(0.000001));\nfloat diagramEdge=1.0-smoothstep(diagramBorder-.5,diagramBorder+.5,min(diagramPixels.x,diagramPixels.y));\noutgoingLight=mix(outgoingLight,diagramInk,diagramEdge);\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey=()=> 'cream-diagram-border-v1';m.needsUpdate=true;
  o.onBeforeRender=()=>{border.value=INK_CFG.diagram.borderPx*renderer.getPixelRatio();};
 });
}
KIT.toon=INK.toon;
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
controls.enableDamping = true; controls.dampingFactor = 0.10; controls.minDistance = 0.5; controls.maxDistance = 14;
controls.maxPolarAngle = Math.PI * 0.49; controls.enablePan = false;
const SHOTS = [
  { name: 'room', pos: V3(4.0, 3.2, 6.5), target: V3(-0.2, 1.5, -0.7), fov: 38 },
  { name: 'hero', pos: V3(1.1, 2.2, 3.1), target: V3(-0.12, 1.30, 0), fov: 34 },
  { name: 'moon', pos: V3(1.20, 1.63, 0.92), target: V3(0.65, 1.28, 0), fov: 34 },
  { name: 'ocean', pos: V3(0.13, 1.66, 1.47), target: E.clone(), fov: 34 },
  { name: 'harbor', pos: V3(-0.14, 1.49, 0.81), target: E.clone(), fov: 32 },
  { name: 'sky', pos: V3(0.7, 2.50, 0.45), target: V3(0.7, 2.50, -2.65), fov: 36 }
];
const SHOTS_VERTICAL = [
  { name: 'hero-v', pos: V3(1.8, 2.8, 5.2), target: V3(-0.13, 1.20, 0), fov: 38 },
  { name: 'rail-v', pos: V3(1.0, 2.4, 3.2), target: V3(0.2, 1.23, 0), fov: 38 },
  { name: 'sky-v', pos: V3(0.7, 2.45, 1.8), target: V3(0.7, 2.45, -2.65), fov: 38 }
];
const CONSOLE_SHOT = { name: 'console', pos: V3(0, 1.10, 3.8), target: V3(-0.1, 0.57, 0.64), fov: 34 };
function heroBox(maximum = false) {
  const closer = closerAt(S.u.value), b = maximum ? PHYS.oceanBulge(PHYS.C.closerMax).bulge : PHYS.oceanBulge(closer).bulge;
  const r = RV * (1 + b), moonX = E.x + PHYS.moonVisDist(closer) * RV;
  const ringR = RV * 1.83;
  const ring = maximum || PHYS.fractureState(closer).state === 'ring';
  return new THREE.Box3(V3(E.x - (ring ? ringR : r), MODEL.top, -(ring ? ringR : r)),
    V3(Math.max(railEnd + 0.08, moonX + RV * MODEL.moonRatio), E.y + Math.max(r, RV * 1.45), ring ? ringR : r)).union(GRAMMAR.bounds());
}
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
    overlapsTop: overlaps('quests'), overlapsTools: overlaps('tools'), clipped: b.left < 0 || b.right > innerWidth || b.top < 0 || b.bottom > innerHeight || b.behind, bounds: b };
}
function fitHero(portrait) {
  // Projection-only candidate search; no render in this loop. Fit the maximum extent as well.
  const box = heroBox(), maximumBox = heroBox(true), target = box.getCenter(V3());
  const top = document.getElementById('quests').getBoundingClientRect().bottom + 14;
  const bottom = document.getElementById('tools').getBoundingClientRect().top - 14;
  const cam = camera.clone(); cam.fov = portrait ? 38 : 34; cam.aspect = innerWidth / innerHeight;
  cam.clearViewOffset(); cam.updateProjectionMatrix();
  let best = null;
  for (const azimuth of portrait ? [22, 30, 38] : [18, 24, 30]) for (const elevation of [15, 20, 25]) {
    const az = THREE.MathUtils.degToRad(azimuth), el = THREE.MathUtils.degToRad(elevation);
    const direction = V3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    for (let distance = 1.8; distance <= 9; distance += 0.04) {
      cam.position.copy(target).addScaledVector(direction, distance); cam.lookAt(target); cam.updateMatrixWorld();
      const b = projectedBox(box, cam), maximum = projectedBox(maximumBox, cam), width = (b.right - b.left) / innerWidth;
      const available = bottom - top, centerShift = ((top + bottom) / 2 - (b.top + b.bottom) / 2);
      if (width > (portrait ? 0.86 : 0.75) || width < (portrait ? 0.64 : 0.60) || b.bottom - b.top > available || b.behind) continue;
      if (maximum.left < 8 || maximum.right > innerWidth - 8 || maximum.top + centerShift < top || maximum.bottom + centerShift > bottom || maximum.behind) continue;
      const score = Math.abs(width - (portrait ? 0.82 : 0.69));
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
  if (index === 'console' && vertical) chosen = { ...CONSOLE_SHOT, pos: V3(-0.1, 1.50, 12.3), fov: 38 };
  if ((!vertical && index === 1) || (vertical && index === 0)) chosen = fitHero(vertical) || spec;
  camera.position.copy(chosen.pos); camera.fov = chosen.fov;
  controls.target.copy(chosen.target); camera.lookAt(chosen.target); camera.updateProjectionMatrix();
  if (chosen.offset) camera.setViewOffset(innerWidth, innerHeight, 0, -chosen.offset, innerWidth, innerHeight);
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
  SHARDS.count = low ? 90 : 180; resize(false);
  return level;
}
window.addEventListener('resize', () => resize());
