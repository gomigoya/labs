// Dynamic floating diagrams use unlit cream and a CSS-pixel ink border.
const diagramMaterials=new WeakSet();
function styleDiagramPanels(root){
 const screen=new THREE.Color(INK_CFG.diagram.screen);
 root.traverse(o=>{
  if(!o.isMesh||!['PlaneGeometry','CircleGeometry'].includes(o.geometry?.type)||!o.material?.isMeshBasicMaterial||!o.material.color.equals(screen))return;
  const circle=o.geometry.type==='CircleGeometry';
  const m=o.material;if(diagramMaterials.has(m))return;diagramMaterials.add(m);
  m.fog=false;m.toneMapped=false;
  const border={value:INK_CFG.diagram.borderPx*renderer.getPixelRatio()};
  m.onBeforeCompile=shader=>{
   shader.uniforms.diagramBorder=border;shader.uniforms.diagramInk={value:new THREE.Color(INK_CFG.diagram.ink)};
   shader.vertexShader='varying vec2 diagramUv;\n'+shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\ndiagramUv=uv;');
   shader.fragmentShader='varying vec2 diagramUv;uniform float diagramBorder;uniform vec3 diagramInk;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
    (circle?'float diagramEdge=1.0-smoothstep(diagramBorder-.5,diagramBorder+.5,(0.5-length(diagramUv-0.5))/max(fwidth(length(diagramUv-0.5)),0.000001));\noutgoingLight=mix(outgoingLight,diagramInk,diagramEdge);\n#include <opaque_fragment>':'vec2 diagramPixels=min(diagramUv,1.0-diagramUv)/max(fwidth(diagramUv),vec2(0.000001));\nfloat diagramEdge=1.0-smoothstep(diagramBorder-.5,diagramBorder+.5,min(diagramPixels.x,diagramPixels.y));\noutgoingLight=mix(outgoingLight,diagramInk,diagramEdge);\n#include <opaque_fragment>'));
  };
  m.customProgramCacheKey=()=> 'cream-diagram-border-v1-'+circle;m.needsUpdate=true;
  o.onBeforeRender=()=>{border.value=INK_CFG.diagram.borderPx*renderer.getPixelRatio();};
 });
}
// One adoption point after scene construction. Keep animated material handles in sync.
KIT.toon=INK.toon;
for(const name of Object.keys(MAT))MAT[name]=INK.convert(MAT[name]);
INK.convertMaterials(scene);
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
controls.enableDamping = true; controls.dampingFactor = 0.10; controls.minDistance = 0.5; controls.maxDistance = 14;
controls.maxPolarAngle = Math.PI * 0.49; controls.enablePan = false;
const SHOTS = [
  {name:'room',pos:V3(4.2,3.4,7.6),target:V3(0,1.65,-0.6),fov:38},
  {name:'hero',pos:V3(2.0,3.3,5.7),target:V3(0,1.90,0),fov:34},
  {name:'spring-section',pos:V3(0.52,2.65,2.3),target:V3(-0.22,2.20,0),fov:34},
  {name:'balance',pos:V3(-0.45,2.34,2.5),target:V3(-1.12,1.54,0),fov:34},
  {name:'jump',pos:V3(1.85,2.62,3.0),target:V3(1.12,1.94,0),fov:36},
  {name:'limit',pos:V3(0.45,2.30,3.4),target:V3(-0.22,1.87,0),fov:34}
];
const SHOTS_VERTICAL = [
  {name:'hero-v',pos:V3(3.3,5.2,8.5),target:V3(0.02,2.32,0),fov:38},
  {name:'balance-rail-v',pos:V3(0.55,2.25,3.9),target:V3(-0.25,1.38,0.1),fov:38},
  {name:'jump-apex-v',pos:V3(1.35,3.35,3.8),target:V3(0.67,2.73,0),fov:38}
];
const CONSOLE_SHOT={name:'console',pos:V3(0,1.18,4.2),target:V3(-0.03,0.54,0.65),fov:34};
function heroBox(){
  const b=S.vertical?PHYS.VIEW.verticalBounds:PHYS.VIEW.bounds;
  return new THREE.Box3(V3(...b.min),V3(...b.max)).union(GRAMMAR.bounds()).union(new THREE.Box3().setFromObject(CONSOLE));
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
    overlaps: overlaps('quests') || overlaps('tools'), overlapsTop: overlaps('quests'), overlapsTools: overlaps('tools'), clipped: b.left < 0 || b.right > innerWidth || b.top < 0 || b.bottom > innerHeight || b.behind, bounds: b };
}
function fitHero(portrait) {
  // The fixed box already contains every body/count extreme. No render in this search.
  const box = heroBox(), target = box.getCenter(V3());
  const top = document.getElementById('quests').getBoundingClientRect().bottom + 14;
  const bottom = document.getElementById('tools').getBoundingClientRect().top - 14;
  const cam = camera.clone(); cam.fov = portrait ? 38 : 34; cam.aspect = innerWidth / innerHeight;
  cam.clearViewOffset(); cam.updateProjectionMatrix();
  let best = null;
  for (const azimuth of portrait ? [15, 20, 25] : [18, 24, 30]) for (const elevation of [15, 20, 25]) {
    const az = THREE.MathUtils.degToRad(azimuth), el = THREE.MathUtils.degToRad(elevation);
    const direction = V3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    for (let distance = 1.8; distance <= 16; distance += 0.04) {
      cam.position.copy(target).addScaledVector(direction, distance); cam.lookAt(target); cam.updateMatrixWorld();
      const b = projectedBox(box, cam), width = (b.right - b.left) / innerWidth;
      const available = bottom - top, centerShift = ((top + bottom) / 2 - (b.top + b.bottom) / 2);
      if (width > 0.75 || width < 0.60 || b.bottom - b.top > available || b.behind) continue;
      if (b.left < 8 || b.right > innerWidth - 8 || b.top + centerShift < top || b.bottom + centerShift > bottom) continue;
      const score = Math.abs(width - (portrait ? 0.74 : 0.69));
      if (!best || score < best.score) best = { score, pos: cam.position.clone(), target: target.clone(), fov: cam.fov, offset: centerShift };
    }
  }
  return best;
}
function shot(index = 1, vertical = innerWidth / innerHeight < 0.9) {
  const list = vertical ? SHOTS_VERTICAL : SHOTS;
  if (typeof index !== 'object' && index !== 'console' && (!Number.isInteger(index) || index < 0 || index >= list.length)) throw new RangeError('shot');
  const spec = typeof index === 'object' ? index : index === 'console' ? CONSOLE_SHOT : list[clamp(Math.trunc(index), 0, list.length - 1)];
  S.fly = null; S.shotIndex = index; S.vertical = vertical;
  layoutHero(vertical);
  camera.clearViewOffset();
  let chosen = spec;
  if (index === 'console' && vertical) chosen = { ...CONSOLE_SHOT, pos: V3(-0.03, 1.50, 12.3), fov: 38 };
  if ((!vertical && index === 1) || (vertical && typeof index==='number')) chosen = fitHero(vertical) || spec;
  camera.position.copy(chosen.pos); camera.fov = chosen.fov;
  controls.target.copy(chosen.target); camera.lookAt(chosen.target); camera.updateProjectionMatrix();
  if (chosen.offset) camera.setViewOffset(innerWidth, innerHeight, 0, -chosen.offset, innerWidth, innerHeight);
  controls.update(); camera.updateMatrixWorld();
}
function flyTo(index, duration = 1.4) {
  if (!Number.isFinite(duration) || duration <= 0 || (typeof index !== 'object' && (!Number.isInteger(index) || index < 0 || index >= SHOTS.length))) throw new RangeError('flyTo');
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
