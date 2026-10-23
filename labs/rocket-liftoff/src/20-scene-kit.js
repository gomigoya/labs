const MAT = {};
for (const name of ['brass', 'graphite', 'chrome', 'wood', 'wall', 'navy', 'ceramic']) {
  MAT[name] = new THREE.MeshStandardMaterial({ color: THEME[name], roughness: name === 'brass' ? 0.34 : 0.65,
    metalness: ['brass', 'chrome'].includes(name) ? 1 : 0.12, flatShading: name === 'ceramic' });
}
MAT.glow = new THREE.MeshStandardMaterial({ color: THEME.speed, emissive: THEME.speed, emissiveIntensity: 2.2 });
MAT.rubber = new THREE.MeshStandardMaterial({ color: THEME.rubber, roughness: 0.95 });
MAT.control = new THREE.MeshStandardMaterial({color:THEME.thrust,emissive:THEME.thrust,emissiveIntensity:2.2});
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
    this.line([V3(x - 0.006, y, z + 0.004), V3(x + 0.006, y, z + 0.004)], THEME.graphite, parent);
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
    const tex = this.canvasTex(PHYS.SCENE.graph.width, PHYS.SCENE.graph.height, () => {});
    const material = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: THEME.ceramic, emissiveIntensity: 1.3, roughness: 0.55 });
    const mesh = this.mesh(new THREE.PlaneGeometry(w, h), material, parent, x, y, z + 0.009); mesh.castShadow = false;
    const light = new THREE.RectAreaLight(THEME.cool, 0.6, w, h); light.position.set(x, y, z + 0.035); light.rotation.y = Math.PI; parent.add(light);
    return { mesh, tex, ctx: tex.image.getContext('2d') };
  },
  knobWithArc(parent, x, y, z) {
    this.mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.045, 48).rotateX(Math.PI / 2), MAT.brass, parent, x, y, z);
    const knob = this.mesh(new THREE.CylinderGeometry(0.103, 0.11, 0.08, 32).rotateX(Math.PI / 2), MAT.graphite, parent, x, y, z + 0.04);
    const mark = this.roundedPanel(0.01, 0.065, 0.005, MAT.control, knob, 0, 0.045, 0.044, 0.002);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; this.line([V3(x + Math.sin(a) * 0.15, y + Math.cos(a) * 0.15, z), V3(x + Math.sin(a) * 0.164, y + Math.cos(a) * 0.164, z)], THEME.chrome, parent); }
    const arcMaterial = new THREE.ShaderMaterial({
      uniforms:{uFill:{value:.2},uColor:{value:new THREE.Color(THEME.thrust)}},
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`uniform float uFill;uniform vec3 uColor;varying vec2 vUv;void main(){if(vUv.x>uFill)discard;gl_FragColor=vec4(uColor*2.2,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
    });
    const arc = this.mesh(new THREE.TorusGeometry(0.18, 0.008, 6, 96), arcMaterial, parent, x, y, z);
    arc.rotation.z = Math.PI / 2;
    const light = new THREE.PointLight(THEME.thrust, 0.16, 1); light.position.set(x, y, z + 0.1); parent.add(light);
    return { knob, mark, arc };
  },
  ledSlider(parent, x, y, z, width) {
    this.roundedPanel(width + 0.1, 0.095, 0.028, MAT.rubber, parent, x, y, z);
    this.roundedPanel(width, 0.008, 0.008, MAT.control, parent, x, y, z + 0.019, 0.002);
    const handle = this.roundedPanel(0.06, 0.10, 0.06, MAT.chrome, parent, x, y, z + 0.04);
    for (let i = 0; i < 22; i++) this.roundedPanel(0.005, i % 5 ? 0.008 : 0.016, 0.004, MAT.brass, parent, x - width / 2 + i / 21 * width, y - 0.068, z);
    const marker = this.mesh(new THREE.ConeGeometry(0.013, 0.02, 3).rotateX(Math.PI / 2), MAT.brass, handle, 0, -0.078, 0);
    const light = new THREE.PointLight(THEME.thrust, 0.12, 1); light.position.set(x, y, z + 0.1); parent.add(light);
    return { handle, marker, x, y, z, width };
  },
  expansion(parent, x, y, z) {
    const t = this.canvasTex(128, 128, c => {
      c.strokeStyle = '#ffffff'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath();
      c.moveTo(32, 96); c.lineTo(96, 32); c.moveTo(32, 68); c.lineTo(32, 96); c.lineTo(60, 96);
      c.moveTo(68, 32); c.lineTo(96, 32); c.lineTo(96, 60); c.stroke();
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true }));
    s.position.set(x, y, z); s.scale.setScalar(0.075); parent.add(s); return s;
  }
};

// Shared linework primitives; layer placement and policy belong to GRAMMAR.
KIT.breakMark=function(parent,color){
 const g=new THREE.Group();parent.add(g);
 for(const y of [0,.035])this.line([V3(-.035,y,0),V3(-.012,y+.016,0),V3(.012,y-.016,0),V3(.035,y,0)],color,g);
 return g;
};
KIT.quantityArrow=function(parent,color,pattern=0,dashed=false){
 const g=new THREE.Group();parent.add(g);
 const material=new THREE.ShaderMaterial({uniforms:{uColor:{value:new THREE.Color(color)},uLength:{value:0},
  uUnit:{value:PHYS.DISPLAY.forceUnit},uStyle:{value:dashed?1:0},uPattern:{value:pattern},uOpacity:{value:1}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform vec3 uColor;uniform float uLength,uUnit,uStyle,uPattern,uOpacity;varying vec2 vUv;
 void main(){float y=vUv.y*uLength;float edge=step(.36,abs(vUv.x-.5));
 if(uStyle>.5){if(edge<.5&&vUv.y>.02&&vUv.y<.98)discard;if(mod(y,.055)>.031)discard;}
 else{if(fract(y/uUnit)<.10)discard;}
 float hatch=uPattern<.5?1.:(uPattern<1.5?.72+.28*step(.45,fract(vUv.x*5.)): .62+.38*step(.5,fract((vUv.x+vUv.y)*8.)));
 gl_FragColor=vec4(uColor*hatch,uOpacity);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 const shaft=this.mesh(new THREE.PlaneGeometry(.065,1).translate(0,.5,0),material,g);
 const shape=new THREE.Shape();shape.moveTo(-.055,0);shape.lineTo(0,.065);shape.lineTo(.055,0);shape.closePath();
 const head=this.mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color,transparent:true}),g);
 const overflow=this.breakMark(g,color);
 g.userData={shaft,head,overflow,material};return g;
};
