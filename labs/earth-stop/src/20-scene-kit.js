const QS = new URLSearchParams(location.search);
const LANG = QS.get('lang') === 'en' ? 'en' : 'ko';
document.documentElement.lang = LANG;
const THEME = Object.freeze({ earth:0x8bbfc5, land:0x91ad82, velocity:0x64ead0, sea:0x246aa8, reference:0xd5e5ec,
  brass:0xb79859, graphite:0x303943, chrome:0xbcc7cc, warm:0xffb36b, cool:0x7dd3fc,
  red:0xe66b62, wood:0x644936, wall:0x62544b, navy:0x303e50, rubber:0x262a2c,
  background:0x30251f, fog:0x514137, screen:0x11232e, grid:0x385363,
  floor:0x674b38, floorA:0x70503a, floorB:0x795a43, grain:'#30201a13',
  skyTop:0x18233f, skyMid:0x476781, skyHorizon:0xd29d76, white:0xffffff,
  hemisphereSky:0xb8d7e4, hemisphereGround:0x6a432c, slot:0x34373b });
const CSS = Object.fromEntries(Object.entries(THEME).map(([key,value])=>[key,typeof value==='string'?value:`#${value.toString(16).padStart(6,'0')}`]));
const MODEL = PHYS.SCENE;
const V3 = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const E = V3(...MODEL.center), RV = MODEL.radius;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const pair = value => ({value,target:value});
const S = { phi:pair(PHYS.phiRailX(0)), period:pair(PHYS.periodRailX(PHYS.C.T0)),
  t:pair(0), spin:pair(0), sun:pair(0), playing:pair(1), sound:pair(0), ui:pair(1), mode:pair(0),
  run:null, runId:0, drag:null, snap:null, fly:null, shotIndex:1,
  vertical:innerWidth/innerHeight<0.9, quality:'', layers:{}, graphKeys:[],
  frames:0, ms:16, sampleMs:0, sampleFrames:0, lastTime:0, autoLevel:0 };
const currentPhi = () => PHYS.phiFromRailX(S.phi.value);
const currentPeriod = () => PHYS.periodFromRailX(S.period.value);
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
scene.background = new THREE.Color(THEME.background);
scene.fog = new THREE.Fog(THEME.fog, 16, 35);
const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.03, 40);
const ROOM = new THREE.Group(), CONSOLE = new THREE.Group(), HERO = new THREE.Group();
scene.add(ROOM, CONSOLE, HERO);
const pmrem = new THREE.PMREMGenerator(renderer);
const environmentRoom = new RoomEnvironment();
scene.environment = pmrem.fromScene(environmentRoom, 0.04).texture;
scene.environmentIntensity = 0.40;
environmentRoom.dispose(); pmrem.dispose();
RectAreaLightUniformsLib.init();
const MAT = {};
for (const name of ['brass', 'graphite', 'chrome', 'wood', 'wall', 'navy', 'earth']) {
  MAT[name] = new THREE.MeshStandardMaterial({ color: THEME[name], roughness: name === 'brass' ? 0.34 : 0.65,
    metalness: ['brass', 'chrome'].includes(name) ? 1 : 0.12, flatShading: name === 'earth' });
}
MAT.glow = new THREE.MeshStandardMaterial({ color: THEME.velocity, emissive: THEME.velocity, emissiveIntensity: 2.2 });
MAT.rubber = new THREE.MeshStandardMaterial({ color: THEME.rubber, roughness: 0.95 });
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
    this.line([V3(x - 0.006, y, z + 0.004), V3(x + 0.006, y, z + 0.004)], THEME.slot, parent);
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
    const material = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: THEME.white, emissiveIntensity: 1.3, roughness: 0.55 });
    const mesh = this.mesh(new THREE.PlaneGeometry(w, h), material, parent, x, y, z + 0.009); mesh.castShadow = false;
    const light = new THREE.RectAreaLight(THEME.cool, 0.6, w, h); light.position.set(x, y, z + 0.035); light.rotation.y = Math.PI; parent.add(light);
    return { mesh, tex, ctx: tex.image.getContext('2d') };
  },
  knobWithArc(parent, x, y, z) {
    this.mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.045, 48).rotateX(Math.PI / 2), MAT.brass, parent, x, y, z);
    const knob = this.mesh(new THREE.CylinderGeometry(0.103, 0.11, 0.08, 32).rotateX(Math.PI / 2), MAT.graphite, parent, x, y, z + 0.04);
    const mark = this.roundedPanel(0.01, 0.065, 0.005, MAT.glow, knob, 0, 0.045, 0.044, 0.002);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; this.line([V3(x + Math.sin(a) * 0.15, y + Math.cos(a) * 0.15, z), V3(x + Math.sin(a) * 0.164, y + Math.cos(a) * 0.164, z)], THEME.chrome, parent); }
    this.mesh(new THREE.TorusGeometry(.18,.008,6,96),MAT.graphite,parent,x,y,z-.002);
    const arcMaterial=new THREE.ShaderMaterial({
      uniforms:{uFill:{value:0},uColor:{value:new THREE.Color(THEME.velocity)}},
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`uniform float uFill;uniform vec3 uColor;varying vec2 vUv;void main(){if(vUv.x>uFill)discard;gl_FragColor=vec4(uColor*2.0,1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`
    });
    const arc=this.mesh(new THREE.TorusGeometry(.18,.008,6,96),arcMaterial,parent,x,y,z);
    arc.rotation.z = Math.PI / 2;
    const light = new THREE.PointLight(THEME.velocity, 0.16, 1); light.position.set(x, y, z + 0.1); parent.add(light);
    return { knob, mark, arc };
  },
  ledSlider(parent, x, y, z, width) {
    this.roundedPanel(width + 0.1, 0.095, 0.028, MAT.rubber, parent, x, y, z);
    this.roundedPanel(width, 0.008, 0.008, MAT.glow, parent, x, y, z + 0.019, 0.002);
    const handle = this.roundedPanel(0.06, 0.10, 0.06, MAT.chrome, parent, x, y, z + 0.04);
    for (let i = 0; i < 22; i++) this.roundedPanel(0.005, i % 5 ? 0.008 : 0.016, 0.004, MAT.brass, parent, x - width / 2 + i / 21 * width, y - 0.068, z);
    const marker = this.mesh(new THREE.ConeGeometry(0.013, 0.02, 3).rotateX(Math.PI / 2), MAT.brass, handle, 0, -0.078, 0);
    const light = new THREE.PointLight(THEME.velocity, 0.12, 1); light.position.set(x, y, z + 0.1); parent.add(light);
    return { handle, marker, x, y, z, width };
  },
  expansion(parent, x, y, z) {
    const t = this.canvasTex(128, 128, c => {
      c.strokeStyle = CSS.white; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath();
      c.moveTo(32, 96); c.lineTo(96, 32); c.moveTo(32, 68); c.lineTo(32, 96); c.lineTo(60, 96);
      c.moveTo(68, 32); c.lineTo(96, 32); c.lineTo(96, 60); c.stroke();
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true }));
    s.position.set(x, y, z); s.scale.setScalar(0.075); parent.add(s); return s;
  }
};

KIT.brassTrim = function(parent,w,h,x,y,z) {
  for(const sign of [-1,1]) { this.roundedPanel(w,.016,.012,MAT.brass,parent,x,y+sign*h/2,z); this.roundedPanel(.016,h,.012,MAT.brass,parent,x+sign*w/2,y,z); }
};
KIT.ventSlits = function(parent,x,y,z,count=12) {
  for(let i=0;i<count;i++) this.roundedPanel(.018,.065,.012,MAT.rubber,parent,x+i*.055,y,z,.004);
};
KIT.shelf = function(parent,x,y,z,w) {
  this.roundedPanel(w,.055,.36,MAT.wood,parent,x,y,z);
  for(const sign of [-1,1]) this.rod(V3(x+sign*w*.36,y-.22,z-.12),V3(x+sign*w*.36,y-.035,z+.12),.012,MAT.brass,parent);
};
KIT.bigButton = function(parent,x,y,z) {
  this.mesh(new THREE.CylinderGeometry(.115,.115,.04,40).rotateX(Math.PI/2),MAT.brass,parent,x,y,z);
  const m=this.mesh(new THREE.CylinderGeometry(.085,.085,.055,32).rotateX(Math.PI/2),MAT.graphite,parent,x,y,z+.03);
  this.roundedPanel(.05,.05,.006,MAT.glow,m,0,0,.031,.005); return m;
};
