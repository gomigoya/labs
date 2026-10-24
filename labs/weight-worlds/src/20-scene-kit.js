const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(inkConfig().paper);
scene.fog = new THREE.Fog(inkConfig().paper, ...inkConfig().fog);
const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.03, 40);
const ROOM = new THREE.Group(), CONSOLE = new THREE.Group(), HERO = new THREE.Group();
scene.add(ROOM, CONSOLE, HERO);
const MAT = {};
for (const name of ['brass', 'graphite', 'chrome', 'navy', 'reference']) {
  MAT[name] = new THREE.MeshStandardMaterial({ name, color: ['brass','chrome'].includes(name)?inkConfig().metal:name==='navy'?inkConfig().diagram.screen:name==='graphite'?inkConfig().apparatus.graphite:inkConfig().diagram.reference, flatShading: name === 'reference' });
}
MAT.navy=new THREE.MeshBasicMaterial({color:inkConfig().diagram.screen,fog:false,toneMapped:false});
MAT.glow = new THREE.MeshStandardMaterial({ color: inkConfig().diagram.mint, emissive: inkConfig().diagram.mint, emissiveIntensity: .25 });
MAT.rubber = new THREE.MeshStandardMaterial({ color: inkConfig().apparatus.rubber,  });
const glassMat = new THREE.MeshPhysicalMaterial({color:inkConfig().diagram.cool,transparent:true,opacity:0.3,depthWrite:false});
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
    this.line([V3(x - 0.006, y, z + 0.004), V3(x + 0.006, y, z + 0.004)], THEME.screwInk, parent);
  },
  graphScreen(parent, x, y, z, w, h) {
    this.roundedPanel(w + 0.055, h + 0.05, 0.04, MAT.brass, parent, x, y, z - 0.015);
    const tex = this.canvasTex(768, 256, () => {});
    const material = new THREE.MeshBasicMaterial({ map:tex, toneMapped:false, fog:false });
    const mesh = this.mesh(new THREE.PlaneGeometry(w, h), material, parent, x, y, z + 0.009); mesh.castShadow = false;
    return { mesh, tex, ctx: tex.image.getContext('2d') };
  },
  knobWithArc(parent, x, y, z) {
    this.mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.045, 48).rotateX(Math.PI / 2), MAT.brass, parent, x, y, z);
    const knob = this.mesh(new THREE.CylinderGeometry(0.103, 0.11, 0.08, 32).rotateX(Math.PI / 2), MAT.graphite, parent, x, y, z + 0.04);
    const mark = this.roundedPanel(0.01, 0.065, 0.005, MAT.glow, knob, 0, 0.045, 0.044, 0.002);
    for (const detent of PHYS.DETENTS.body) { const a = detent.x * Math.PI * 1.7; this.line([V3(x + Math.sin(a) * 0.15, y + Math.cos(a) * 0.15, z), V3(x + Math.sin(a) * 0.164, y + Math.cos(a) * 0.164, z)], inkConfig().diagram.ink, parent); }
    const arc = this.mesh(new THREE.TorusGeometry(0.18, 0.008, 6, 96), MAT.glow.clone(), parent, x, y, z);
    arc.rotation.z = Math.PI / 2;
    arc.scale.y = -1;
    return { knob, mark, arc };
  },
  ledSlider(parent, x, y, z, width) {
    this.roundedPanel(width + 0.1, 0.095, 0.028, MAT.rubber, parent, x, y, z);
    this.roundedPanel(width, 0.008, 0.008, MAT.glow, parent, x, y, z + 0.019, 0.002);
    const handle = this.roundedPanel(0.06, 0.10, 0.06, MAT.chrome, parent, x, y, z + 0.04);
    for (const detent of PHYS.DETENTS.nWeights) this.roundedPanel(0.005, 0.016, 0.004, MAT.brass, parent, x - width / 2 + detent.x * width, y - 0.068, z);
    const marker = this.mesh(new THREE.ConeGeometry(0.013, 0.02, 3).rotateX(Math.PI / 2), MAT.brass, handle, 0, -0.078, 0);
    return { handle, marker, x, y, z, width };
  },
  breakMark(parent, color) {
    const g = new THREE.Group(); parent.add(g);
    const m = new THREE.MeshBasicMaterial({ color, transparent: true });
    for (const x of [-0.035, 0.035]) this.rod(V3(x - 0.035, -0.022, 0), V3(x + 0.035, 0.022, 0), 0.008, m, g);
    return g;
  },
  quantityArrow(parent, dashed = false) {
    const material = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uColor: { value: new THREE.Color(dashed ? inkConfig().diagram.reference : inkConfig().diagram.force) },
        uLevel: { value: 0 }, uLength: { value: 0 }, uUnit: { value: PHYS.VIEW.markUnit },
        uStyle: { value: dashed ? 1 : 0 }, uOpacity: { value: 1 }, uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform vec3 uColor;uniform float uLevel,uLength,uUnit,uStyle,uOpacity,uTime;varying vec2 vUv;
        void main(){float y=vUv.y*uLength;float cell=step(0.18,fract(y/uUnit));
          float edge=step(0.35,abs(vUv.x-0.5));float dash=step(0.4,fract(y/(uUnit*1.7)));
          float a=mix((0.28+0.62*cell),edge*dash,uStyle)*uOpacity;
          vec3 color=uColor*mix(0.8+0.2*uLevel,0.85,uStyle);
          gl_FragColor=vec4(color,a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` });
    const g = new THREE.Group(); parent.add(g);
    const shaft = this.mesh(new THREE.PlaneGeometry(PHYS.GRAMMAR_VIEW.arrowWidth, 1).translate(0,-0.5,0),material,g);
    const head = this.line([V3(-0.065,0.065,0),V3(0,0,0),V3(0.065,0.065,0)],dashed?inkConfig().diagram.reference:inkConfig().diagram.force,g,dashed);
    return { group:g,shaft,head,material };
  },
  expansion(parent, x, y, z) {
    const t = this.canvasTex(128, 128, c => {
      c.strokeStyle = '#'+new THREE.Color(inkConfig().diagram.ink).getHexString(); c.lineWidth = 8; c.lineCap = 'round'; c.beginPath();
      c.moveTo(32, 96); c.lineTo(96, 32); c.moveTo(32, 68); c.lineTo(32, 96); c.lineTo(60, 96);
      c.moveTo(68, 32); c.lineTo(96, 32); c.lineTo(96, 60); c.stroke();
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true }));
    s.position.set(x, y, z); s.scale.setScalar(0.075); parent.add(s); return s;
  }
};

// Adopted by the shared engine once all initial scene objects exist.
KIT.toon=(color,opts={})=>new THREE.MeshToonMaterial({color,...opts});
