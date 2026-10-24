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
// Laboratory integration stays outside the portable style engine.
KIT.toon=INK.toon;
for(const name of Object.keys(MAT))MAT[name]=INK.convert(MAT[name]);
INK.convertMaterials(scene);for(const cassette of CASSETTES)INK.convertMaterials(cassette);
kidShadowMat.color.set(INK_CFG.shadow);kidShadowMat.opacity=INK_CFG.shadowOpacity;
scene.background=new THREE.Color(INK_CFG.paper);scene.fog=new THREE.Fog(INK_CFG.paper,...INK_CFG.fog);
// One hard key and one cool ambient source; all style values live in INK_CFG.
scene.add(new THREE.AmbientLight(INK_CFG.ambient, INK_CFG.ambientIntensity));
const keyLight = new THREE.SpotLight(INK_CFG.key, INK_CFG.keyIntensity, 30, .65, 0, 1.5);
keyLight.position.set(...INK_CFG.keyPosition);keyLight.target.position.set(0,1.5,0);keyLight.castShadow=true;
keyLight.shadow.mapSize.setScalar(INK_CFG.shadowMap[0]);keyLight.shadow.bias=INK_CFG.shadowBias;keyLight.shadow.normalBias=INK_CFG.shadowNormalBias;
scene.add(keyLight,keyLight.target);
const composer=new EffectComposer(renderer);
const renderPass=new RenderPass(scene,camera);composer.addPass(renderPass);
const inkPass=INK.makeOutlinePass(scene,camera,{wobble:QS.get('wobble')??.5,lowQuality:()=>S.quality==='low'});composer.addPass(inkPass);
composer.addPass(new OutputPass());
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.10; controls.minDistance = 0.5; controls.maxDistance = 40;
controls.maxPolarAngle = Math.PI * 0.49; controls.enablePan = false;
const heroComposition=PHYS.dramaFrame(1200,750,SPECIES_KEYS[PHYS.DRAMA.representative.speciesIndex],{left:24,right:1176,top:45,bottom:705});
const SHOTS = [
 {name:'room',pos:V3(9,6,15),target:V3(0,2,-.8),fov:38},
 {name:'hero',pos:V3(...heroComposition.pos),target:V3(...heroComposition.target),fov:heroComposition.fov,offsetX:heroComposition.offsetX,offset:heroComposition.offset},
 {name:'queue',pos:V3(-1.8,2.5,4.1),target:V3(-1.6,1.3,.1),fov:34},
 {name:'contact',pos:V3(2.4,1.9,3.3),target:V3(1.3,1.35,0),fov:32},
 {name:'capacity',pos:V3(.2,2.6,8.1),target:V3(0,1.62,.58),fov:34},
 {name:'ratio',pos:V3(.9,1.6,4.2),target:V3(.34,.93,1.13),fov:34}
];
const SHOTS_VERTICAL = [
 {name:'hero-v',pos:V3(17,8,6),target:V3(0,1.6,0),fov:38},
 {name:'rail-v',pos:V3(-.2,3.5,7.7),target:V3(-1.7,1.25,.4),fov:38},
 {name:'ground-v',pos:V3(4.2,3.4,7.2),target:V3(1.5,1.4,0),fov:38}
];
const CONSOLE_SHOT={name:'console',pos:V3(0,2.1,11.4),target:V3(0,.68,1.12),fov:34};
function heroBox(){const b=S.stageBounds||PHYS.dramaBounds(SPECIES_KEYS[Math.round(S.species.value)],S.rivalN);return new THREE.Box3(V3(...b.min),V3(...b.max));}
function projectedBox(box, cam = camera) {
  const points = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) points.push(V3(x, y, z).project(cam));
  const xs = points.map(p => (p.x + 1) * innerWidth / 2), ys = points.map(p => (1 - p.y) * innerHeight / 2);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys), behind: points.some(p => p.z < -1 || p.z > 1) };
}
function heroCoverage() {
  camera.updateMatrixWorld(); const b = projectedBox(heroBox());
  const overlaps = id => {
    const el = document.getElementById(id); if (!el || !el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') return false;
    const r = el.getBoundingClientRect(); return b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top;
  };
  return { width: (b.right - b.left) / innerWidth, height: (b.bottom - b.top) / innerHeight,
    overlaps: overlaps('lab-header')||overlaps('control-panel')||overlaps('q-pictures')||overlaps('mission')||overlaps('teacher-strip'), overlapsTop: overlaps('lab-header')||overlaps('mission'), overlapsTools: overlaps('control-panel')||overlaps('q-pictures')||overlaps('teacher-strip'), clipped: b.left < 0 || b.right > innerWidth || b.top < 0 || b.bottom > innerHeight || b.behind, bounds: b };
}
// CSS inset contract shared with the DOM HUD. Read afresh so font/layout changes refit.
function stageRect(){
 const css=getComputedStyle(document.documentElement),vertical=S.vertical;
 const read=(name,fallback)=>{const raw=css.getPropertyValue(name).trim(),n=parseFloat(raw);return raw&&Number.isFinite(n)?Math.max(0,n):fallback;};
 const top=read('--hud-top',vertical?150:130),bottom=read('--hud-bottom',vertical?260:190),right=read('--hud-right',0);
 return {left:12,right:Math.max(13,innerWidth-right-12),top,bottom:Math.max(top+1,innerHeight-bottom),stageOnly:true};
}
// Retained for teacher integrations; all lane arithmetic lives in stageRect.
function stageRegion(){return stageRect();}
function fitHero(eventX=null,region=stageRect()) {
 const species=typeof A!=='undefined'&&A.active?SPECIES_KEYS.at(-1):SPECIES_KEYS[Math.round(S.species.value)];
 const fit=PHYS.dramaFrame(innerWidth,innerHeight,species,region,eventX,S.rivalN);
 S.stageBounds=fit?.stageBounds;
 return fit?{...fit,pos:V3(...fit.pos),target:V3(...fit.target)}:null;
}
function shot(index = 1, vertical = innerWidth / innerHeight < 0.9) {
  const list = vertical ? SHOTS_VERTICAL : SHOTS;
  const spec = typeof index === 'object' ? index : index === 'console' ? CONSOLE_SHOT : list[clamp(Math.trunc(index), 0, list.length - 1)];
  S.fly = null; S.shotIndex = index; S.vertical = vertical;
  camera.clearViewOffset();
  let chosen = spec;
  if (index === 'console' && vertical) chosen = { ...CONSOLE_SHOT, pos: V3(0, 2.0, 25), fov: 38 };
  if ((!vertical && index === 1) || vertical) chosen = fitHero() || spec;
  camera.position.copy(chosen.pos); camera.fov = chosen.fov;
  controls.target.copy(chosen.target); camera.lookAt(chosen.target); camera.updateProjectionMatrix();
  if (chosen.offset||chosen.offsetX) camera.setViewOffset(innerWidth, innerHeight, -(chosen.offsetX||0), -(chosen.offset||0), innerWidth, innerHeight);
  controls.update(); camera.updateMatrixWorld();
  if(typeof DIRECTOR!=='undefined')DIRECTOR.fitKey='';
}
function flyTo(index, duration = 1.4) {
  let to = typeof index === 'object' ? index : SHOTS[clamp(Math.trunc(index), 0, SHOTS.length - 1)];
  if(to===SHOTS[1]||to===SHOTS_VERTICAL[0]||(typeof A!=='undefined'&&A.active))to=fitHero()||to;
  const fromView=camera.view?{...camera.view}:null;
  S.fly = { fromView, from: camera.position.clone(), fromTarget: controls.target.clone(), fromFov: camera.fov, to, elapsed: 0, duration };
}
function resize(refit = true) {
  const low = S.quality === 'low';
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, low ? 1 : 1.6));
  renderer.setSize(innerWidth, innerHeight, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; if(refit) camera.clearViewOffset(); camera.updateProjectionMatrix();
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

// Registered before the physical-control listener, including its enlarged pixel targets.
canvas.addEventListener('pointerdown',()=>syncConsoleLayer(),{capture:true});
