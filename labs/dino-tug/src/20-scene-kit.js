const QS = new URLSearchParams(location.search);
const LANG = QS.get('lang') === 'en' ? 'en' : 'ko';
document.documentElement.lang = LANG;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pair = value => ({ value, target: value });
// Only independent simulation and interaction state lives here. Derived values use PHYS.
const S = { u: pair(PHYS.railX(1)), species: pair(0), ground: pair(2), playing: pair(1), t: pair(0), sound: pair(0), ui: pair(1), cassette: pair(0),
  drag: null, snap: null, fly: null, shotIndex: 1, vertical: innerWidth / innerHeight < 0.9, quality: '', layers: {},
  graphKeys: [], previousGround: 2, frames: 0, ms: 16.67, lastTime: 0 };
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rand = mulberry32(730219);
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
const BIOME = inkConfig().biome;
scene.background = new THREE.Color(INK_CFG.paper);
scene.fog = new THREE.Fog(INK_CFG.paper, ...INK_CFG.fog);
const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.03, 80);
const ROOM = new THREE.Group(), CONSOLE = new THREE.Group(), HERO = new THREE.Group();
scene.add(ROOM, CONSOLE, HERO);
const MAT = {};
for (const name of ['brass', 'graphite', 'chrome', 'bone']) {
  MAT[name] = new THREE.MeshStandardMaterial({ name, color: ['brass','chrome'].includes(name) ? INK_CFG.metal : THEME[name], flatShading: name === 'bone' });
}
MAT.stone = new THREE.MeshStandardMaterial({ color: BIOME.stone, flatShading: true });
MAT.bark = new THREE.MeshStandardMaterial({ color: BIOME.bark, flatShading: true });
MAT.glow = new THREE.MeshStandardMaterial({ color: INK_CFG.diagram.kids, emissive: INK_CFG.diagram.kids, emissiveIntensity: 1 });
MAT.rubber = new THREE.MeshStandardMaterial({ color: THEME.rubber });
const KIT = {
  mesh(g, material, parent, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(g, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  },
  roundedPanel(w, h, d, material, parent, x = 0, y = 0, z = 0, r = 0.018) {
    return this.mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 3, h / 3, d / 3)), material, parent, x, y, z);
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
    this.roundedPanel(w + 0.055, h + 0.05, 0.04, MAT.brass, parent, x, y, z - 0.015);
    const tex = this.canvasTex(768, 256, () => {});
    const material = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: INK_CFG.diagram.reference, emissiveIntensity: 1.3 });
    const mesh = this.mesh(new THREE.PlaneGeometry(w, h), material, parent, x, y, z + 0.009); mesh.castShadow = false;
    return { mesh, tex, ctx: tex.image.getContext('2d') };
  },
  knobWithArc(parent, x, y, z) {
    this.mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.045, 48).rotateX(Math.PI / 2), MAT.brass, parent, x, y, z);
    const knob = this.mesh(new THREE.CylinderGeometry(0.103, 0.11, 0.08, 32).rotateX(Math.PI / 2), MAT.graphite, parent, x, y, z + 0.04);
    const mark = this.roundedPanel(0.01, 0.065, 0.005, MAT.glow, knob, 0, 0.045, 0.044, 0.002);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; this.line([V3(x + Math.sin(a) * 0.15, y + Math.cos(a) * 0.15, z), V3(x + Math.sin(a) * 0.164, y + Math.cos(a) * 0.164, z)], THEME.chrome, parent); }
    const arc = this.mesh(new THREE.TorusGeometry(0.18, 0.008, 6, 96), MAT.glow.clone(), parent, x, y, z);
    arc.rotation.z = Math.PI / 2;
    return { knob, mark, arc };
  },
  ledSlider(parent, x, y, z, width) {
    this.roundedPanel(width + 0.1, 0.095, 0.028, MAT.rubber, parent, x, y, z);
    this.roundedPanel(width, 0.008, 0.008, MAT.glow, parent, x, y, z + 0.019, 0.002);
    const handle = this.roundedPanel(0.06, 0.10, 0.06, MAT.chrome, parent, x, y, z + 0.04);
    for (let i = 0; i < 22; i++) this.roundedPanel(0.005, i % 5 ? 0.008 : 0.016, 0.004, MAT.brass, parent, x - width / 2 + i / 21 * width, y - 0.068, z);
    const marker = this.mesh(new THREE.ConeGeometry(0.013, 0.02, 3).rotateX(Math.PI / 2), MAT.brass, handle, 0, -0.078, 0);
    return { handle, marker, x, y, z, width };
  },
  expansion(parent, x, y, z) {
    const t = this.canvasTex(128, 128, c => {
      c.strokeStyle = css(INK_CFG.diagram.reference); c.lineWidth = 8; c.lineCap = 'round'; c.beginPath();
      c.moveTo(32, 96); c.lineTo(96, 32); c.moveTo(32, 68); c.lineTo(32, 96); c.lineTo(60, 96);
      c.moveTo(68, 32); c.lineTo(96, 32); c.lineTo(96, 60); c.stroke();
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true }));
    s.position.set(x, y, z); s.scale.setScalar(0.075); parent.add(s); return s;
  }
};

// Initial character materials are adopted by INK after construction; no separate ramp.
KIT.toon = (color, opts = {}) => new THREE.MeshToonMaterial({color, ...opts});
// Attribute-only merge, without groups: exactly one draw per merged character mesh.
KIT.merge = function(parts) {
 const geometry=new THREE.BufferGeometry(),attributes=['position','normal','color','motion'];
 for(const name of attributes){
  if(!parts.every(g=>g.hasAttribute(name)))continue;
  const size=parts[0].getAttribute(name).itemSize,values=[];
  for(const g of parts){const a=g.getAttribute(name),index=g.index;
   for(let i=0;i<(index?index.count:a.count);i++){const k=index?index.getX(i):i;for(let j=0;j<size;j++)values.push(a.array[k*size+j]);}
  }
  geometry.setAttribute(name,new THREE.Float32BufferAttribute(values,size));
 }
 geometry.computeBoundingSphere();return geometry;
};

// Weld only normals at coincident UV seams/poles, preserving topology and colors.
KIT.smoothNormals = function(geometry) {
 geometry.computeVertexNormals();
 const p=geometry.attributes.position,n=geometry.attributes.normal,buckets=new Map(),keys=[];
 for(let i=0;i<p.count;i++){
  const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(':');keys.push(key);
  const sum=buckets.get(key)||V3(0,0,0);sum.add(V3(n.getX(i),n.getY(i),n.getZ(i)));buckets.set(key,sum);
 }
 for(const sum of buckets.values())sum.normalize();
 for(let i=0;i<p.count;i++){const v=buckets.get(keys[i]);n.setXYZ(i,v.x,v.y,v.z);}
 return geometry;
};
