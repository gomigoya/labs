scene.fog.near=30;scene.fog.far=70;
scene.add(new THREE.HemisphereLight(THEME.cool, THEME.wood, 1.25));
const keyLight = new THREE.SpotLight(THEME.warm, 70, 30, 0.65, 0.7, 1.5);
keyLight.position.set(-4, 7, 5); keyLight.target.position.set(0,1.5,0); keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048); keyLight.shadow.bias = -0.0003; keyLight.shadow.normalBias = 0.02;
scene.add(keyLight, keyLight.target);
const fillLight = new THREE.RectAreaLight(THEME.cool, 3.5, 4, 3);
fillLight.position.set(4, 5, 1); fillLight.lookAt(V3(0,1.5,0)); scene.add(fillLight);
const rimLight = new THREE.PointLight(THEME.cool, 3, 10, 2);
rimLight.position.set(0,4,-2); scene.add(rimLight);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera); composer.addPass(renderPass);
const aoPass = new GTAOPass(scene, camera, innerWidth, innerHeight);
aoPass.blendIntensity = 0.75; aoPass.updateGtaoMaterial({ radius: 0.18, samples: 8, distanceFallOff: 1, screenSpaceRadius: false }); composer.addPass(aoPass);
const bokehPass = new BokehPass(scene, camera, { focus: 3.2, aperture: 0.00035, maxblur: 0.0022 }); composer.addPass(bokehPass);
// A black material mask makes bloom exclusive to emissive instruments and the force shader.
const bloomComposer = new EffectComposer(renderer); bloomComposer.renderToScreen = false;
bloomComposer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.36, 0.45, 1.1); bloomComposer.addPass(bloomPass);
const bloomMix = new ShaderPass({ uniforms: { tDiffuse: { value: null }, tBloom: { value: bloomComposer.renderTarget2.texture } },
 vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
 fragmentShader: 'uniform sampler2D tDiffuse;uniform sampler2D tBloom;varying vec2 vUv;void main(){gl_FragColor=texture2D(tDiffuse,vUv)+texture2D(tBloom,vUv);}' });
composer.addPass(bloomMix);
// Surface programs remain procedural but contribute black to the emissive pass.
for(const cassette of CASSETTES)for(const mesh of cassette.children){
 if(mesh.material===cassette.userData.surface)mesh.onBeforeRender=()=>{
  const target=renderer.getRenderTarget(),material=mesh.material;
  material.uniforms.uBloom.value=target===bloomComposer.readBuffer||target===bloomComposer.writeBuffer?0:1;
  material.uniformsNeedUpdate=true;
 };
}
const bloomBlack = new THREE.Color(0), blackMesh = new THREE.MeshBasicMaterial({color:0}), blackLine = new THREE.LineBasicMaterial({color:0}), blackSprite = new THREE.SpriteMaterial({color:0});
const bloomMaterials = new Map();
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
function heroBox(){const b=PHYS.dramaBounds(SPECIES_KEYS[Math.round(S.species.value)]);return new THREE.Box3(V3(...b.min),V3(...b.max));}
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
    overlaps: overlaps('quests')||overlaps('tools'), overlapsTop: overlaps('quests'), overlapsTools: overlaps('tools'), clipped: b.left < 0 || b.right > innerWidth || b.top < 0 || b.bottom > innerHeight || b.behind, bounds: b };
}
function stageRegion(event=false){
 const region={left:12,right:innerWidth-12,top:12,bottom:innerHeight-12};
 const visible=id=>{const e=document.getElementById(id);return e&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'?e.getBoundingClientRect():null;};
 const top=visible('quests'),tools=visible('tools'),picture=visible('q-pictures'),strip=visible('teacher-strip'),numbers=visible('teacher-numbers'),classPanel=visible('teacher-class');
 if(top)region.top=top.bottom+12;
 if(tools)region.bottom=Math.min(region.bottom,tools.top-12);
 if(picture&&!event&&picture.height>0)region.bottom=Math.min(region.bottom,picture.top-12);
 if(strip){if(strip.width>strip.height)region.bottom=Math.min(region.bottom,strip.top-12);else region.right=Math.min(region.right,strip.left-12);}
 if(numbers)region.top=Math.max(region.top,numbers.bottom+12);
 if(classPanel)region.bottom=Math.min(region.bottom,classPanel.top-12);
 if(event)region.top=Math.max(region.top,innerWidth/innerHeight<.9?94:122);
 return region;
}
function fitHero(eventX=null,region=stageRegion(eventX!==null)) {
 const species=typeof A!=='undefined'&&A.active?SPECIES_KEYS.at(-1):SPECIES_KEYS[Math.round(S.species.value)];
 const fit=PHYS.dramaFrame(innerWidth,innerHeight,species,region,eventX);
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
  bokehPass.uniforms.focus.value = camera.position.distanceTo(controls.target);
}
function flyTo(index, duration = 1.4) {
  let to = typeof index === 'object' ? index : SHOTS[clamp(Math.trunc(index), 0, SHOTS.length - 1)];
  if(to===SHOTS[1]||to===SHOTS_VERTICAL[0]||(typeof A!=='undefined'&&A.active))to=fitHero()||to;
  const fromView=camera.view?{...camera.view}:null;
  S.fly = { fromView, from: camera.position.clone(), fromTarget: controls.target.clone(), fromFov: camera.fov, to, elapsed: 0, duration };
}
function resize(refit = true) {
  const low = S.quality === 'low';
  bokehPass.enabled=!low&&innerWidth/innerHeight>=.9;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, low ? 1 : 1.6));
  renderer.setSize(innerWidth, innerHeight, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(innerWidth, innerHeight);
  bloomComposer.setPixelRatio(renderer.getPixelRatio()); bloomComposer.setSize(innerWidth, innerHeight);
  const size = renderer.getDrawingBufferSize(new THREE.Vector2()); bloomPass.setSize(size.x * (low ? 0.5 : 1), size.y * (low ? 0.5 : 1));
  camera.aspect = innerWidth / innerHeight; if(refit) camera.clearViewOffset(); camera.updateProjectionMatrix();
  if (refit) shot(innerWidth / innerHeight < 0.9 ? 0 : 1, innerWidth / innerHeight < 0.9);
}
function setQuality(level) {
  if (!['high', 'low'].includes(level)) throw new RangeError('quality');
  S.quality = level; const low = level === 'low';
  aoPass.enabled = !low; bokehPass.enabled = !low;
  keyLight.shadow.mapSize.setScalar(low ? 1024 : 2048);
  if (keyLight.shadow.map) { keyLight.shadow.map.dispose(); keyLight.shadow.map = null; }
  resize(false);
  return level;
}
window.addEventListener('resize', () => resize());
