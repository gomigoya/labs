// All orbital scenery is built here; counts, extents and placement share one configuration.
function buildEnvironment() {
  const cfg = {
    seed: 730207,
    stars: [ // high / low counts, point size, opacity, shell radius
      [980, 320, 0.024, 0.46, 22], [360, 120, 0.052, 0.68, 21], [96, 32, 0.095, 0.92, 20]
    ],
    galaxy: { size: [29, 6], at: [0, -3, -17], tilt: -0.28, opacity: 0.2 },
    earth: { at: [-10.5, 3.2, -14], radius: 3.6, detail: 3, landCut: 0.82 },
    clouds: { size: [512, 256], patches: 12, lowPatches: 8, opacity: 0.6 },
    moon: { at: [1.0312, 2.674, -2.70], radius: 0.018, cap: 0.30 },
    sun: { at: [-8.8, 15.8, 16.5], size: 6, opacity: 0.68 }
  };
  const seed = mulberry32(cfg.seed);
  // Background-only materials cannot cast or receive contact shadows.
  const add = (geometry, material, parent, at = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...at); parent.add(mesh); return mesh;
  };
  scene.background = new THREE.Color(INK_CFG.paper);
  scene.environment = null;
  // 47 rejects silhouette samples against empty depth. A paper backing supplies real far
  // depth without touching the portable engine or using inverted object-outline shells.
  const paperBackdrop = add(new THREE.SphereGeometry(camera.far * .95, 32, 16).scale(-1,1,1),
    new THREE.MeshBasicMaterial({color:INK_CFG.paper,fog:false}),scene);
  // Inward winding also survives 47 replacing the material with front-sided normals.
  paperBackdrop.userData.inkInner=false;paperBackdrop.frustumCulled=false;paperBackdrop.renderOrder=-1000;
  paperBackdrop.onBeforeRender=(_renderer,_scene,viewCamera)=>{
    paperBackdrop.position.copy(viewCamera.position);paperBackdrop.updateMatrixWorld();
  };
  const starDot=KIT.canvasTex(16,16,(c)=>{c.fillStyle='white';c.beginPath();c.arc(8,8,7,0,Math.PI*2);c.fill();});
  const starLayers = cfg.stars.map(([high, low, size, opacity, radius]) => {
    const positions = [];
    for (let i = 0; i < high; i++) {
      const y = seed() * 2 - 1, a = seed() * Math.PI * 2, r = Math.sqrt(1 - y * y);
      positions.push(Math.cos(a) * r * radius, y * radius, Math.sin(a) * r * radius);
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: INK_CFG.space.stars, map:starDot, alphaTest:.1, size, transparent: true, opacity, fog: false, depthWrite: false });
    const points = new THREE.Points(geometry, material); ROOM.add(points);
    return { points, high, low, opacity };
  });
  // Three flat, translucent bands; the common depth pass excludes them.
  for (let i=0;i<3;i++) {
    const galaxy = add(new THREE.PlaneGeometry(cfg.galaxy.size[0], cfg.galaxy.size[1]*(1-i*.25)),
      new THREE.MeshBasicMaterial({color:INK_CFG.space.galaxy, transparent:true,
        opacity:cfg.galaxy.opacity/3,depthWrite:false,fog:false,side:THREE.DoubleSide}),ROOM,cfg.galaxy.at);
    galaxy.rotation.z=cfg.galaxy.tilt;
  }
  // World-space sunlight follows the existing key's direction from the apparatus.
  const globe = new THREE.Group(); globe.position.set(...cfg.earth.at); ROOM.add(globe);
  const planetMaterial = color => new THREE.MeshStandardMaterial({color,flatShading:true});
  add(new THREE.IcosahedronGeometry(cfg.earth.radius, cfg.earth.detail), planetMaterial(INK_CFG.space.ocean), globe);
  const landSource = new THREE.IcosahedronGeometry(cfg.earth.radius * 1.005, cfg.earth.detail), p = landSource.attributes.position;
  const centers = [V3(-.6,.5,1), V3(-.5,-.5,1), V3(.6,.5,.8), V3(.8,-.4,.5), V3(-.8,.1,-.8)].map(v => v.normalize());
  const triangles = [];
  for (let i = 0; i < p.count; i += 3) {
    const center = V3().fromBufferAttribute(p,i).add(V3().fromBufferAttribute(p,i+1)).add(V3().fromBufferAttribute(p,i+2)).normalize();
    if (centers.some(v => v.dot(center) > cfg.earth.landCut + seed() * 0.07))
      for (let k=0;k<3;k++) triangles.push(p.getX(i+k),p.getY(i+k),p.getZ(i+k));
  }
  const land = new THREE.BufferGeometry(); land.setAttribute('position',new THREE.Float32BufferAttribute(triangles,3)); land.computeVertexNormals();
  add(land, planetMaterial(INK_CFG.space.land), globe); landSource.dispose();
  const cloudPatches = Array.from({ length: cfg.clouds.patches }, () => [seed(), seed(), .025 + seed() * .06]);
  const cloudTex = KIT.canvasTex(...cfg.clouds.size, () => {});
  const cloud = add(new THREE.SphereGeometry(cfg.earth.radius * 1.018, 32, 20), new THREE.MeshBasicMaterial({ map: cloudTex,
    transparent: true, opacity: cfg.clouds.opacity, depthWrite: false, fog: false }), globe);
  // A constant cream ring replaces the atmosphere's luminous Fresnel shell.
  const atmosphere=add(new THREE.RingGeometry(cfg.earth.radius*1.004,cfg.earth.radius*1.018,96),
    new THREE.MeshBasicMaterial({color:INK_CFG.space.cloud,transparent:true,opacity:.65,
      depthWrite:false,fog:false,side:THREE.DoubleSide}),globe);
  const sunTex=KIT.canvasTex(256,256,(c,w,h)=>{
    c.globalAlpha=.18;c.fillStyle=new THREE.Color(INK_CFG.space.halo).getStyle();c.beginPath();c.arc(w/2,h/2,w*.48,0,Math.PI*2);c.fill();
    c.globalAlpha=1;c.fillStyle=new THREE.Color(INK_CFG.space.sun).getStyle();c.beginPath();c.arc(w/2,h/2,w*.30,0,Math.PI*2);c.fill();
  });
  const sun=new THREE.Sprite(new THREE.SpriteMaterial({map:sunTex,transparent:true,
    opacity:cfg.sun.opacity,depthWrite:false,fog:false}));
  sun.position.set(...cfg.sun.at);sun.scale.setScalar(cfg.sun.size);ROOM.add(sun);
  // The existing grammar owns this transparent, unframed observation surface.
  const skyTexture = KIT.canvasTex(1024,1024,() => {});
  add(new THREE.PlaneGeometry(1.84,1.84),new THREE.MeshBasicMaterial({ map:skyTexture,transparent:true,depthWrite:false,fog:false }),ROOM,[.7,2.49,-2.69]);
  const moon = add(new THREE.IcosahedronGeometry(cfg.moon.radius,2),new THREE.MeshBasicMaterial({ color: INK_CFG.space.moon, fog: false }),ROOM,cfg.moon.at);
  let clock=0, tier='';
  return { skyTexture, update(dt) {
    clock+=dt;
    atmosphere.quaternion.copy(camera.quaternion);
    const low=S.quality==='low'||S.autoLevel>0;
    if(tier!==String(low)) {
      tier=String(low);
      starLayers.forEach(d=>d.points.geometry.setDrawRange(0,low?d.low:d.high));
      const c=cloudTex.image.getContext('2d'),[w,h]=cfg.clouds.size;c.clearRect(0,0,w,h);c.fillStyle=new THREE.Color(INK_CFG.space.cloud).getStyle();
      cloudPatches.slice(0,low?cfg.clouds.lowPatches:cfg.clouds.patches).forEach(([x,y,r])=>{c.beginPath();c.ellipse(x*w,y*h,r*w,r*h*.24,-.2,0,Math.PI*2);c.fill();});cloudTex.needsUpdate=true;
    }
    starLayers.forEach((d,i)=>{d.points.material.opacity=d.opacity*(.93+.07*Math.sin(clock*(.25+i*.09)+i));});
    cloud.rotation.y=clock*.003;
    moon.visible=!S.layers.sky;
    const closer=closerAt(S.u.value), scale=Math.min(cfg.moon.cap/cfg.moon.radius,PHYS.angularSizeDeg(closer)/PHYS.angularSizeDeg(0));
    moon.scale.setScalar(scale);
    moon.position.x=cfg.moon.at[0]-.06*PHYS.railX(closer);
  } };
}
const { skyTexture, update: updateEnvironment } = buildEnvironment();

// World-space control layout: construction, dragging and graph mapping share this source.
// CONSOLE remains the public layer, containing only independent floating controls.
const CONTROL_LAYOUT = Object.freeze({
  dial: { at: [-0.86, 0.83, 0.48], radius: 0.18 },
  graphs: [{ at: [-0.39, 0.90, 0.48], size: [0.43, 0.16] },
    { at: [0.13, 0.90, 0.48], size: [0.43, 0.16] }],
  slider: { at: [-0.12, 0.68, 0.48], width: 0.95 },
  play: { at: [0.55, 0.82, 0.48], radius: 0.115 },
  rings: { tube: 0.004, segments: 48 }
});
const DIAL = KIT.knobWithArc(CONSOLE, ...CONTROL_LAYOUT.dial.at, CONTROL_LAYOUT.dial.radius);
const GRAPHS = CONTROL_LAYOUT.graphs.map(({ at, size }) => KIT.graphScreen(CONSOLE, ...at, ...size));
const SLIDER = KIT.ledSlider(CONSOLE, ...CONTROL_LAYOUT.slider.at, CONTROL_LAYOUT.slider.width);
KIT.mesh(new THREE.TorusGeometry(CONTROL_LAYOUT.play.radius, CONTROL_LAYOUT.rings.tube, 6, CONTROL_LAYOUT.rings.segments), MAT.hologram, CONSOLE, ...CONTROL_LAYOUT.play.at);
const PLAY_BUTTON = KIT.mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.055, 32).rotateX(Math.PI / 2), MAT.graphite, CONSOLE, ...CONTROL_LAYOUT.play.at);
const PLAY_GLYPH = new THREE.Group(); PLAY_BUTTON.add(PLAY_GLYPH);
for (const x of [-0.023, 0.023]) KIT.roundedPanel(0.012, 0.065, 0.005, MAT.glow, PLAY_GLYPH, x, 0, 0.031, 0.002);
const playShape = new THREE.Shape(); playShape.moveTo(-0.025, -0.035); playShape.lineTo(0.04, 0); playShape.lineTo(-0.025, 0.035); playShape.closePath();
const PLAY_TRIANGLE = KIT.mesh(new THREE.ShapeGeometry(playShape), MAT.glow, PLAY_BUTTON, 0, 0, 0.032);
CONSOLE.traverse(o => { o.castShadow = o.receiveShadow = false; });

function drawGraphs() {
  const closer = closerAt(S.u.value), ratio = PHYS.ratio(closer);
  const keys = [`${S.u.value.toFixed(6)}:${S.lon0.value.toFixed(5)}:${Math.floor(S.t.value / 120)}`, S.u.value.toFixed(6)];
  GRAPHS.forEach((g, index) => {
    if (S.graphKeys[index] === keys[index]) return;
    S.graphKeys[index] = keys[index];
    const c = g.ctx, w = 768, h = 256, left = 52, right = 724, top = 22, bottom = 216;
    c.fillStyle = '#f4efe3'; c.fillRect(0, 0, w, h); c.lineWidth = 1.5; c.strokeStyle = '#b6b5ab';
    for (let i = 0; i <= 12; i++) { const x = left + (right - left) * i / 12; c.beginPath(); c.moveTo(x, top); c.lineTo(x, bottom); c.stroke(); }
    for (let i = 0; i <= 4; i++) { const y = top + (bottom - top) * i / 4; c.beginPath(); c.moveTo(left, y); c.lineTo(right, y); c.stroke(); }
    const scale = index ? 1 : Math.max(PHYS.tideHeight(closer), PHYS.tideH0());
    const xy = (u, v) => [left + u * (right - left), index ? bottom - v * (bottom - top) : 94 - v / scale * 66];
    const curve = (reference) => {
      c.setLineDash(reference ? [10, 8] : []); c.strokeStyle = reference ? '#393e42' : `#${new THREE.Color(index ? INK_CFG.diagram.tide : INK_CFG.diagram.sea).getHexString()}`; c.lineWidth = reference ? 2 : 4;
      c.beginPath();
      for (let i = 0; i <= 320; i++) {
        const u = i / 320;
        const v = index ? Math.log(PHYS.ratio(PHYS.closerFromRailX(u))) / Math.log(PHYS.ratio(PHYS.C.closerMax)) : PHYS.harborLevel(u * 86400, S.lon0.value, reference ? 0 : closer);
        const [x, y] = xy(u, v); i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke(); c.setLineDash([]);
    };
    if (!index) curve(true); curve(false);
    const u = index ? PHYS.railX(closer) : ((S.t.value % 86400) + 86400) % 86400 / 86400;
    const v = index ? Math.log(ratio) / Math.log(PHYS.ratio(PHYS.C.closerMax)) : PHYS.harborLevel(S.t.value, S.lon0.value, closer);
    const [x, y] = xy(u, v);
    c.strokeStyle = '#b57924'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, top); c.lineTo(x, bottom); c.stroke();
    c.fillStyle = '#b57924'; c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill();
    // Axis end icons: wave at y, crescent at x; deliberately no text drawing API.
    c.strokeStyle = '#221d18'; c.lineWidth = 3; c.beginPath();
    for (let i = 0; i <= 28; i++) { const xx = 10 + i; const yy = 24 + Math.sin(i / 28 * Math.PI * 3) * 5; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke();
    c.beginPath(); c.arc(743, 234, 10, 0.6, Math.PI * 1.8); c.stroke(); c.beginPath(); c.arc(749, 231, 8, 1.5, 4.3); c.stroke();
    g.tex.needsUpdate = true;
  });
}
