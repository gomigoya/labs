const QS = new URLSearchParams(location.search);
const LANG = QS.get('lang') === 'en' ? 'en' : 'ko';
document.documentElement.lang = LANG;
const THEME = Object.freeze({ tide:0x64ead0, reference:0xe5edf2, brass:0xb79859,
  graphite:0x303943, chrome:0xbcc7cc, warm:0xffb36b, cool:0x7dd3fc,
  red:0xe66b62, wood:0x644936, wall:0x62544b, navy:0x303e50, void:0x101a25,
  paper:0xd5d8df, screen:0x11232e, grid:0x385363,
  surface0:0x262a2c, surface1:0x34373b, surface2:0xffffff, surface3:'#ffffff', surface4:'#674b38', surface5:'#70503a', surface6:'#795a43', surface7:'#30201a13', surface8:'#30251f', surface9:'#18233f', surface10:'#354d67', surface11:'#b17c62', surface12:'#273c4b', surface13:'#1c3040', surface14:'#477083', surface15:'#9dd5df', surface16:'#ffcc8c', surface17:'#d5ecf5', surface18:0xb8d7e4, surface19:0x6a432c });
const MODEL = PHYS.SCENE;
const V3 = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const E = V3(...MODEL.center);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const pair = value => ({value,target:value});
const S = { u:pair(0), massIndex:pair(0), orientation:pair(0), playing:pair(0),
  t:pair(0), sound:pair(0), ui:pair(1), cutaway:pair(0), drag:null, snap:null, fly:null,
  shotIndex:1, vertical:innerWidth/innerHeight<0.9, quality:'high', layers:{},
  graphKeys:[], records:[], frames:0, ms:16.67, lastTime:0, sampleMs:0, sampleFrames:0, autoLevel:0 };
const massIndex = () => Math.round(S.massIndex.value);
const orientation = () => S.orientation.value < 0.5 ? 'radial' : 'transverse';
const currentR = () => PHYS.rFromRailX(S.u.value);
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rand = mulberry32(730219);
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.86;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(THEME.wood);
scene.fog = new THREE.Fog(THEME.wall, 18, 45);
const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.03, 70);
const ROOM = new THREE.Group(), CONSOLE = new THREE.Group(), HERO = new THREE.Group();
scene.add(ROOM, CONSOLE, HERO);
const pmrem = new THREE.PMREMGenerator(renderer);
const environmentRoom = new RoomEnvironment();
scene.environment = pmrem.fromScene(environmentRoom, 0.04).texture;
scene.environmentIntensity = 0.40;
environmentRoom.dispose(); pmrem.dispose();
RectAreaLightUniformsLib.init();
const MAT = {};
for (const name of ['brass', 'graphite', 'chrome', 'wood', 'wall', 'navy', 'paper']) {
  MAT[name] = new THREE.MeshStandardMaterial({ color: THEME[name], roughness: name === 'brass' ? 0.34 : 0.65,
    metalness: ['brass', 'chrome'].includes(name) ? 1 : 0.12, flatShading: name === 'paper' });
}
MAT.glow = new THREE.MeshStandardMaterial({ color: THEME.tide, emissive: THEME.tide, emissiveIntensity: 2.2 });
MAT.rubber = new THREE.MeshStandardMaterial({ color: THEME.surface0, roughness: 0.95 });
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
  screw(parent, x, y, z) {
    const m = this.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.006, 12), MAT.chrome, parent, x, y, z);
    m.rotation.x = Math.PI / 2;
    this.line([V3(x - 0.006, y, z + 0.004), V3(x + 0.006, y, z + 0.004)], THEME.surface1, parent);
  },
  lampWithBulb(parent, x, y, z) {
    this.mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.035, 24), MAT.graphite, parent, x, y, z);
    this.rod(V3(x, y, z), V3(x, y + 0.66, z), 0.016, MAT.brass, parent);
    this.rod(V3(x, y + 0.66, z), V3(x + 0.23, y + 0.86, z), 0.02, MAT.brass, parent);
    this.mesh(new THREE.ConeGeometry(0.19, 0.20, 24, 1, true), MAT.graphite, parent, x + 0.23, y + 0.79, z);
    const glow = new THREE.MeshStandardMaterial({ color: THEME.warm, emissive: THEME.warm, emissiveIntensity: 3 });
    this.ball(0.055, glow, parent, x + 0.23, y + 0.73, z);
    const light = new THREE.PointLight(THEME.warm, 2.5, 4, 2); light.position.set(x + 0.23, y + 0.69, z); parent.add(light);
  },
  graphScreen(parent, x, y, z, w, h) {
    this.roundedPanel(w + 0.055, h + 0.05, 0.04, MAT.brass, parent, x, y, z - 0.015);
    const tex = this.canvasTex(768, 256, () => {});
    const material = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: THEME.surface2, emissiveIntensity: 1.3, roughness: 0.55 });
    const mesh = this.mesh(new THREE.PlaneGeometry(w, h), material, parent, x, y, z + 0.009); mesh.castShadow = false;
    const light = new THREE.RectAreaLight(THEME.cool, 0.6, w, h); light.position.set(x, y, z + 0.035); light.rotation.y = Math.PI; parent.add(light);
    return { mesh, tex, ctx: tex.image.getContext('2d') };
  },
  knobWithArc(parent, x, y, z) {
    this.mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.045, 48).rotateX(Math.PI / 2), MAT.brass, parent, x, y, z);
    const knob = this.mesh(new THREE.CylinderGeometry(0.103, 0.11, 0.08, 32).rotateX(Math.PI / 2), MAT.graphite, parent, x, y, z + 0.04);
    const mark = this.roundedPanel(0.01, 0.065, 0.005, MAT.glow, knob, 0, 0.045, 0.044, 0.002);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; this.line([V3(x + Math.sin(a) * 0.15, y + Math.cos(a) * 0.15, z), V3(x + Math.sin(a) * 0.164, y + Math.cos(a) * 0.164, z)], THEME.chrome, parent); }
    const arc = this.mesh(new THREE.TorusGeometry(0.18, 0.008, 6, 96), MAT.glow.clone(), parent, x, y, z);
    arc.rotation.z = Math.PI / 2;
    const light = new THREE.PointLight(THEME.tide, 0.16, 1); light.position.set(x, y, z + 0.1); parent.add(light);
    return { knob, mark, arc };
  },
  ledSlider(parent, x, y, z, width) {
    this.roundedPanel(width + 0.1, 0.095, 0.028, MAT.rubber, parent, x, y, z);
    this.roundedPanel(width, 0.008, 0.008, MAT.glow, parent, x, y, z + 0.019, 0.002);
    const handle = this.roundedPanel(0.06, 0.10, 0.06, MAT.chrome, parent, x, y, z + 0.04);
    for (let i = 0; i < 22; i++) this.roundedPanel(0.005, i % 5 ? 0.008 : 0.016, 0.004, MAT.brass, parent, x - width / 2 + i / 21 * width, y - 0.068, z);
    const marker = this.mesh(new THREE.ConeGeometry(0.013, 0.02, 3).rotateX(Math.PI / 2), MAT.brass, handle, 0, -0.078, 0);
    const light = new THREE.PointLight(THEME.tide, 0.12, 1); light.position.set(x, y, z + 0.1); parent.add(light);
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
