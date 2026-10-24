const QS = new URLSearchParams(location.search);
const LANG = QS.get('lang') === 'en' ? 'en' : 'ko';
document.documentElement.lang = LANG;
const THEME = inkConfig().apparatus;
const MODEL = Object.freeze({ Rv: 0.30, moonRatio: 0.2727, E: Object.freeze([-0.55, 1.30, 0]), top: 0.84 });
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const E = V3(...MODEL.E), RV = MODEL.Rv;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const closerAt = u => u < 0 ? 0 : PHYS.closerFromRailX(u);
const railAt = u => E.x + PHYS.moonVisDist(closerAt(u)) * RV;
const pair = value => ({ value, target: value });
// Only independent simulation and interaction state lives here. Derived values use PHYS.
const S = { u: pair(-0.05), lon0: pair(0.45), t: pair(0), playing: pair(1), speed: pair(1),
  sound: pair(0), lens: pair(0), ui: pair(1), drag: null, snap: null, fly: null,
  shotIndex: 1, vertical: innerWidth / innerHeight < 0.9, quality: '', layers: {},
  graphKeys: [], frames: 0, ms: 16, sampleMs: 0, sampleFrames: 0, lastTime: 0, autoLevel: 0 };
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// Independent apparatus seed preserves its existing land, craters and fragments.
const rand = mulberry32(4033857812);
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(INK_CFG.paper);
scene.fog = new THREE.Fog(INK_CFG.paper, ...INK_CFG.fog);
const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.03, 40);
const ROOM = new THREE.Group(), CONSOLE = new THREE.Group(), HERO = new THREE.Group();
scene.add(ROOM, CONSOLE, HERO);
const MAT = {};
for (const name of ['brass', 'graphite', 'chrome', 'moon']) {
  MAT[name] = new THREE.MeshStandardMaterial({ name, color: THEME[name], flatShading: name === 'moon' });
}
MAT.glow = new THREE.MeshStandardMaterial({ color: INK_CFG.diagram.tide, emissive: INK_CFG.diagram.tide, emissiveIntensity: .25 });
MAT.rubber = new THREE.MeshStandardMaterial({ color: INK_CFG.diagram.ink });
MAT.hologram = new THREE.MeshBasicMaterial({ color: INK_CFG.diagram.ink, toneMapped: false });
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
    this.roundedPanel(w, h, .012, new THREE.MeshBasicMaterial({color:INK_CFG.diagram.screen,toneMapped:false}), parent, x, y, z + .002);
    this.line([V3(x-w/2,y-h/2,z),V3(x+w/2,y-h/2,z),V3(x+w/2,y+h/2,z),V3(x-w/2,y+h/2,z),V3(x-w/2,y-h/2,z)], INK_CFG.diagram.ink, parent);
    const tex = this.canvasTex(768, 256, () => {});
    const material = new THREE.MeshBasicMaterial({ map: tex, color: INK_CFG.diagram.screen, toneMapped: false });
    const mesh = this.mesh(new THREE.PlaneGeometry(w, h), material, parent, x, y, z + 0.009); mesh.castShadow = false;
    return { mesh, tex, ctx: tex.image.getContext('2d') };
  },
  knobWithArc(parent, x, y, z, radius) {
    this.mesh(new THREE.TorusGeometry(0.135, 0.004, 6, 48), MAT.hologram, parent, x, y, z);
    const knob = this.mesh(new THREE.CylinderGeometry(0.103, 0.11, 0.08, 32).rotateX(Math.PI / 2), MAT.graphite, parent, x, y, z + 0.04);
    const mark = this.roundedPanel(0.01, 0.065, 0.005, MAT.glow, knob, 0, 0.045, 0.044, 0.002);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; this.line([V3(x + Math.sin(a) * 0.15, y + Math.cos(a) * 0.15, z), V3(x + Math.sin(a) * 0.164, y + Math.cos(a) * 0.164, z)], THEME.chrome, parent); }
    const arc = this.mesh(new THREE.TorusGeometry(radius, 0.008, 6, 96), MAT.glow.clone(), parent, x, y, z);
    arc.rotation.z = Math.PI / 2;
    return { knob, mark, arc };
  },
  ledSlider(parent, x, y, z, width) {
    this.roundedPanel(width + 0.1, 0.095, 0.028, MAT.rubber, parent, x, y, z);
    this.roundedPanel(width, 0.008, 0.008, MAT.glow, parent, x, y, z + 0.019, 0.002);
    const handle = this.roundedPanel(0.06, 0.10, 0.06, MAT.chrome, parent, x, y, z + 0.04);
    for (let i = 0; i < 22; i++) this.roundedPanel(0.005, i % 5 ? 0.008 : 0.016, 0.004, MAT.hologram, parent, x - width / 2 + i / 21 * width, y - 0.068, z);
    const marker = this.mesh(new THREE.ConeGeometry(0.013, 0.02, 3).rotateX(Math.PI / 2), MAT.brass, handle, 0, -0.078, 0);
    return { handle, marker, x, y, z, width };
  },
  expansion(parent, x, y, z, color = THEME.reference) {
    const t = this.canvasTex(128, 128, c => {
      c.strokeStyle = new THREE.Color(color).getStyle(); c.lineWidth = 8; c.lineCap = 'round'; c.beginPath();
      c.moveTo(32, 96); c.lineTo(96, 32); c.moveTo(32, 68); c.lineTo(32, 96); c.lineTo(60, 96);
      c.moveTo(68, 32); c.lineTo(96, 32); c.lineTo(96, 60); c.stroke();
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true }));
    s.position.set(x, y, z); s.scale.setScalar(0.075); parent.add(s); return s;
  }
};
// Grammar primitives share one unit in world space, with countable cross cuts.
KIT.breakMark = function(parent, color, x = 0, y = 0, z = 0) {
  const group = new THREE.Group(); group.position.set(x, y, z); parent.add(group);
  for (const offset of [-0.009, 0.009]) this.line(Array.from({ length: 25 }, (_, i) => {
    const t = i / 24; return V3((t - 0.5) * 0.064, offset + Math.sin(t * Math.PI * 3) * 0.007, 0);
  }), color, group);
  return group;
};
KIT.quantityArrow = function(parent, color, unit, width) {
  const group = new THREE.Group(); parent.add(group);
  const material = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uUnits: { value: 1 }, uStyle: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform vec3 uColor; uniform float uUnits; uniform float uStyle; varying vec2 vUv;
      void main(){float cut=step(0.075,fract(vUv.x*uUnits));
      float edge=step(0.7,abs(vUv.y-0.5)*2.0);float dash=step(0.4,fract(vUv.x*uUnits*2.0));
      gl_FragColor=vec4(uColor, mix(0.24+0.76*cut,edge*dash,uStyle));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
    transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false
  });
  const shaft = this.mesh(new THREE.PlaneGeometry(1, width).translate(0.5, 0, 0), material, group);
  const shape = new THREE.Shape(); shape.moveTo(0, -width * 1.8); shape.lineTo(width * 2.8, 0); shape.lineTo(0, width * 1.8); shape.closePath();
  const head = this.mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, side: THREE.DoubleSide }), group);
  const overflow = this.breakMark(group, color);
  group.traverse(o => { o.renderOrder = 12; o.castShadow = false; });
  group.userData = { shaft, head, overflow, material, unit };
  return group;
};
