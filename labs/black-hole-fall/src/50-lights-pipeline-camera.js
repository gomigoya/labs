scene.add(new THREE.HemisphereLight(THEME.surface18, THEME.surface19, 1.25));
const keyLight = new THREE.SpotLight(THEME.warm, 26, 12, 0.65, 0.7, 1.5);
keyLight.position.set(-2.2, 4.2, 3.3); keyLight.target.position.copy(E); keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048); keyLight.shadow.bias = -0.0003; keyLight.shadow.normalBias = 0.02;
scene.add(keyLight, keyLight.target);
const fillLight = new THREE.RectAreaLight(THEME.cool, 2.8, 2.4, 2.0);
fillLight.position.set(2.3, 2.8, 0.8); fillLight.lookAt(E); scene.add(fillLight);
const rimLight = new THREE.PointLight(THEME.cool, 1.1, 4.5, 2);
rimLight.position.set(-0.4, 2.3, -1.1); scene.add(rimLight);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera); composer.addPass(renderPass);
const aoPass = new GTAOPass(scene, camera, innerWidth, innerHeight);
aoPass.blendIntensity = 0.75; aoPass.updateGtaoMaterial({ radius: 0.18, samples: 8, distanceFallOff: 1, screenSpaceRadius: false }); composer.addPass(aoPass);
const bokehPass = new BokehPass(scene, camera, { focus: 3.2, aperture: 0.0013, maxblur: 0.006 }); composer.addPass(bokehPass);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.30, 0.45, 1.1); composer.addPass(bloomPass);
composer.addPass(new OutputPass());
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.10; controls.minDistance = 0.5; controls.maxDistance = 32;
controls.maxPolarAngle = Math.PI * 0.49; controls.enablePan = false;
const SHOTS = [
 {name:'room',pos:V3(5,4.0,8.5),target:V3(0,1.5,-0.6),fov:38},
 {name:'hero',pos:V3(2.2,3.6,6.5),target:V3(0,1.43,0),fov:34},
 {name:'rail',pos:V3(-1.6,2.8,3.7),target:V3(-0.95,1.54,0.3),fov:34},
 {name:'ends',pos:V3(-1.3,2.1,2.8),target:V3(-1.0,1.63,-0.1),fov:32},
 {name:'horizon-compare',pos:V3(1.6,2.8,4.4),target:E.clone(),fov:34},
 {name:'disruption',pos:V3(-1.5,2.1,2.4),target:V3(-1.35,1.63,-0.1),fov:34}
];
const SHOTS_VERTICAL = [
 {name:'hero-v',pos:V3(4,6.1,13.5),target:V3(0,1.43,0),fov:38},
 {name:'rail-v',pos:V3(-2.3,4.0,7.4),target:V3(-0.95,1.54,0.3),fov:38},
 {name:'inside-v',pos:V3(0.8,3.4,6.2),target:E.clone(),fov:38}
];
const CONSOLE_SHOT={name:'console',pos:V3(0,1.40,5.6),target:V3(0,0.70,1.10),fov:34};
function heroBox(){const b=MODEL.bounds;return new THREE.Box3(V3(...b.slice(0,3)),V3(...b.slice(3))).union(GRAMMAR.bounds());}
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
  const box = heroBox(), target = box.getCenter(V3());
  const top = document.getElementById('quests').getBoundingClientRect().bottom + 14;
  const bottom = document.getElementById('tools').getBoundingClientRect().top - 14;
  const cam = camera.clone(); cam.fov = portrait ? 38 : 34; cam.aspect = innerWidth / innerHeight;
  cam.clearViewOffset(); cam.updateProjectionMatrix();
  let best = null;
  for (const azimuth of portrait ? [22, 30, 38] : [18, 24, 30]) for (const elevation of [15, 20, 25]) {
    const az = THREE.MathUtils.degToRad(azimuth), el = THREE.MathUtils.degToRad(elevation);
    const direction = V3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    for (let distance = 3; distance <= 24; distance += 0.04) {
      cam.position.copy(target).addScaledVector(direction, distance); cam.lookAt(target); cam.updateMatrixWorld();
      const b = projectedBox(box, cam), width = (b.right - b.left) / innerWidth;
      const available = bottom - top, centerShift = ((top + bottom) / 2 - (b.top + b.bottom) / 2);
      if (width > 0.75 || width < 0.60 || b.bottom - b.top > available || b.behind) continue;
      if (b.left < 8 || b.right > innerWidth - 8 || b.top + centerShift < top || b.bottom + centerShift > bottom || b.behind) continue;
      const score = Math.abs(width - (portrait ? 0.72 : 0.69));
      if (!best || score < best.score) best = { score, pos: cam.position.clone(), target: target.clone(), fov: cam.fov, offset: centerShift };
    }
  }
  return best;
}
function shot(index = 1, vertical = innerWidth / innerHeight < 0.9) {
  const list = vertical ? SHOTS_VERTICAL : SHOTS;
  if(typeof index!=='object' && index!=='console' && (!Number.isInteger(index)||index<0||index>=list.length)) throw new RangeError('shot');
  const spec = typeof index === 'object' ? index : index === 'console' ? CONSOLE_SHOT : list[clamp(Math.trunc(index), 0, list.length - 1)];
  S.fly = null; S.shotIndex = index; S.vertical = vertical;
  camera.clearViewOffset();
  let chosen = spec;
  if (index === 'console' && vertical) chosen = { ...CONSOLE_SHOT, pos: V3(0, 2.80, 16.3), fov: 38 };
  if ((!vertical && index === 1) || (vertical && Number.isInteger(index))) chosen = fitHero(vertical) || spec;
  camera.position.copy(chosen.pos); camera.fov = chosen.fov;
  controls.target.copy(chosen.target); camera.lookAt(chosen.target); camera.updateProjectionMatrix();
  if (!vertical && [4,5].includes(index)) chosen={...chosen,offset:-innerHeight*0.09};
  if (chosen.offset) camera.setViewOffset(innerWidth, innerHeight, 0, -chosen.offset, innerWidth, innerHeight);
  controls.update(); camera.updateMatrixWorld();
  bokehPass.uniforms.focus.value = camera.position.distanceTo(controls.target);
}
function flyTo(index, duration = 1.4) {
  if(typeof index!=='object' && (!Number.isInteger(index)||!SHOTS[index]))throw new RangeError('flyTo');
  if(!Number.isFinite(duration)||duration<=0)throw new RangeError('duration');
  const to = typeof index === 'object' ? index : SHOTS[index];
  camera.clearViewOffset();
  S.fly = { from: camera.position.clone(), fromTarget: controls.target.clone(), fromFov: camera.fov, to, elapsed: 0, duration };
}
function resize(refit = true) {
  const low = S.quality === 'low';
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, low ? 1 : 1.6));
  renderer.setSize(innerWidth, innerHeight, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(innerWidth, innerHeight);
  const size = renderer.getDrawingBufferSize(new THREE.Vector2()); bloomPass.setSize(size.x * (low ? 0.5 : 1), size.y * (low ? 0.5 : 1));
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
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
