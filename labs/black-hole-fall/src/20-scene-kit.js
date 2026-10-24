const QS = new URLSearchParams(location.search);
const LANG = QS.get('lang') === 'en' ? 'en' : 'ko';
document.documentElement.lang = LANG;
const THEME = Object.freeze({...inkConfig().space,void:INK_CFG.space.hole,screen:INK_CFG.diagram.screen,grid:INK_CFG.diagram.grid,space:INK_CFG.paper,surface2:0xffffff,surface3:INK_CFG.space.star});
const MODEL = PHYS.SCENE;
const V3 = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const E = V3(...MODEL.center);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const pair = value => ({value,target:value});
const S = { u:pair(0), massIndex:pair(0), orientation:pair(0), playing:pair(0),
  t:pair(0), sound:pair(0), ui:pair(1), cutaway:pair(0), drag:null, snap:null, fly:null,
  shotIndex:1, vertical:innerWidth/innerHeight<0.9, quality:'high', layers:{},
  graphKeys:[], records:[], frames:0, ms:16.67, lastTime:0 };
const massIndex = () => Math.round(S.massIndex.value);
const orientation = () => S.orientation.value < 0.5 ? 'radial' : 'transverse';
const currentR = () => PHYS.rFromRailX(S.u.value);
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(THEME.space);
scene.fog = new THREE.Fog(INK_CFG.paper, ...INK_CFG.fog);
const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.03, 70);
const ROOM = new THREE.Group(), CONSOLE = new THREE.Group(), HERO = new THREE.Group();
scene.add(ROOM, CONSOLE, HERO);

const MAT = {};
for (const name of ['brass', 'graphite', 'chrome']) {
  MAT[name] = new THREE.MeshStandardMaterial({ name, color: THEME[name] });
}
MAT.glow = new THREE.MeshStandardMaterial({ color: THEME.tide, emissive: THEME.tide, emissiveIntensity: .35 });
MAT.hologram = new THREE.MeshBasicMaterial({color:INK_CFG.diagram.screen,side:THREE.DoubleSide});
const KIT = {
  mesh(g, material, parent, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(g, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  },
  roundedPanel(w, h, d, material, parent, x = 0, y = 0, z = 0, r = 0.018) {
    const mesh=this.mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/3,h/3,d/3)),material,parent,x,y,z);
    if(material===MAT.hologram)mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry,30),new THREE.LineBasicMaterial({color:INK_CFG.diagram.ink})));
    return mesh;
  },
  ball(r, material, parent, x = 0, y = 0, z = 0, detail = 2) {
    return this.mesh(new THREE.IcosahedronGeometry(r, detail), material, parent, x, y, z);
  },
  rod(a, b, r, material, parent) {
    const d = b.clone().sub(a), m = this.mesh(new THREE.CylinderGeometry(r, r, d.length(), 12), material, parent);
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); return m;
  },
  line(points, color, parent, dashed = false, opacity = 1) {
    const material = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.018, gapSize: 0.012, transparent: true, opacity })
      : new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
    if (dashed) l.computeLineDistances(); parent.add(l); return l;
  },
  canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  },
  graphScreen(parent, x, y, z, w, h) {
    this.roundedPanel(w + 0.055, h + 0.05, 0.012, MAT.hologram, parent, x, y, z - 0.015);
    const tex = this.canvasTex(768, 256, () => {});
    const material = new THREE.MeshBasicMaterial({map:tex,color:INK_CFG.diagram.screen,toneMapped:false});
    const mesh = this.mesh(new THREE.PlaneGeometry(w, h), material, parent, x, y, z + 0.009); mesh.castShadow = false;
    return { mesh, tex, ctx: tex.image.getContext('2d') };
  },
  knobWithArc(parent, x, y, z) {
    this.mesh(new THREE.RingGeometry(0.115, 0.135, 32), MAT.hologram, parent, x, y, z);
    const knob = this.mesh(new THREE.CylinderGeometry(0.103, 0.11, 0.08, 32).rotateX(Math.PI / 2), MAT.graphite, parent, x, y, z + 0.04);
    const mark = this.roundedPanel(0.01, 0.065, 0.005, MAT.glow, knob, 0, 0.045, 0.044, 0.002);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; this.line([V3(x + Math.sin(a) * 0.15, y + Math.cos(a) * 0.15, z), V3(x + Math.sin(a) * 0.164, y + Math.cos(a) * 0.164, z)], THEME.chrome, parent); }
    const arc = this.mesh(new THREE.TorusGeometry(0.18, 0.008, 6, 96), MAT.glow.clone(), parent, x, y, z);
    arc.rotation.z = Math.PI / 2;
    return { knob, mark, arc };
  },
  ledSlider(parent, x, y, z, width) {
    this.roundedPanel(width + 0.1, 0.095, 0.012, MAT.hologram, parent, x, y, z);
    this.roundedPanel(width, 0.008, 0.008, MAT.glow, parent, x, y, z + 0.019, 0.002);
    const handle = this.roundedPanel(0.06, 0.10, 0.06, MAT.chrome, parent, x, y, z + 0.04);
    for (let i = 0; i < 22; i++) this.roundedPanel(0.005, i % 5 ? 0.008 : 0.016, 0.004, MAT.brass, parent, x - width / 2 + i / 21 * width, y - 0.068, z);
    const marker = this.mesh(new THREE.ConeGeometry(0.013, 0.02, 3).rotateX(Math.PI / 2), MAT.brass, handle, 0, -0.078, 0);
    return { handle, marker, x, y, z, width };
  },
  expansion(parent, x, y, z) {
    const t = this.canvasTex(128, 128, c => {
      c.strokeStyle = THEME.surface3; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath();
      c.moveTo(32, 96); c.lineTo(96, 32); c.moveTo(32, 68); c.lineTo(32, 96); c.lineTo(60, 96);
      c.moveTo(68, 32); c.lineTo(96, 32); c.lineTo(96, 60); c.stroke();
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true }));
    s.position.set(x, y, z); s.scale.setScalar(0.075); parent.add(s); return s;
  }
};

// Mutable grammar strokes: fixed buffers, no per-frame geometry allocation.
KIT.stroke = function(parent,color,dashed=false,capacity=256){
 const line=this.line(Array.from({length:capacity},()=>V3()),color,parent,dashed);
 line.geometry.setDrawRange(0,0);line.frustumCulled=false;line.material.depthWrite=false;
 line.userData.capacity=capacity;return line;
};
KIT.plot = function(line,points){
 const a=line.geometry.attributes.position;
 points.forEach((p,i)=>a.setXYZ(i,...p));a.needsUpdate=true;
 line.geometry.setDrawRange(0,points.length);if(line.isLine&&line.material.isLineDashedMaterial)line.computeLineDistances();
};
KIT.breakMark = function(parent,color){
 return this.line([V3(-0.025,-0.015,0),V3(-0.008,0.015,0),V3(0.008,-0.015,0),V3(0.025,0.015,0)],color,parent);
};

