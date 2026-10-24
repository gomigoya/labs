// All scene paint comes from 46; legacy semantic constants remain available to host APIs.
const PAINT=Object.freeze({...THEME,...inkConfig().apparatus,...inkConfig().diagram});
renderer.toneMapping=THREE.NoToneMapping;renderer.toneMappingExposure=1.02;
renderer.shadowMap.type=THREE.PCFShadowMap;
const MAT = {};
for (const name of ['brass', 'graphite', 'chrome', 'navy', 'ceramic']) {
  MAT[name] = new THREE.MeshToonMaterial({name,color:['brass','chrome'].includes(name)?inkConfig().metal:THEME[name],flatShading:name==='ceramic'});
}
MAT.glow = new THREE.MeshToonMaterial({ color: PAINT.speed, emissive: PAINT.speed, emissiveIntensity: 2.2 });
MAT.rubber = new THREE.MeshToonMaterial({ color: PAINT.rubber });
MAT.control = new THREE.MeshToonMaterial({color:PAINT.thrust,emissive:PAINT.thrust,emissiveIntensity:2.2});
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
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); m.userData.inkInner=false; return m;
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
    const tex = this.canvasTex(PHYS.SCENE.graph.width, PHYS.SCENE.graph.height, () => {});
    const material = new THREE.MeshBasicMaterial({map:tex,fog:false,toneMapped:false});
    const border={value:inkConfig().diagram.borderPx*renderer.getPixelRatio()};
    material.onBeforeCompile=shader=>{
      shader.uniforms.diagramBorder=border;shader.uniforms.diagramInk={value:new THREE.Color(INK_CFG.diagram.ink)};
      shader.vertexShader='varying vec2 diagramUv;\n'+shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\ndiagramUv=uv;');
      shader.fragmentShader='varying vec2 diagramUv;uniform float diagramBorder;uniform vec3 diagramInk;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
       'vec2 diagramPixels=min(diagramUv,1.0-diagramUv)/max(fwidth(diagramUv),vec2(0.000001));\nfloat diagramEdge=1.0-smoothstep(diagramBorder-.5,diagramBorder+.5,min(diagramPixels.x,diagramPixels.y));\noutgoingLight=mix(outgoingLight,diagramInk,diagramEdge);\n#include <opaque_fragment>');
    };
    material.customProgramCacheKey=()=> 'cream-diagram-border-v1';
    const mesh = this.mesh(new THREE.PlaneGeometry(w, h), material, parent, x, y, z + 0.009); mesh.castShadow = false;
    mesh.onBeforeRender=()=>{border.value=INK_CFG.diagram.borderPx*renderer.getPixelRatio();};
    return { mesh, tex, ctx: tex.image.getContext('2d') };
  },
  knobWithArc(parent, x, y, z) {
    this.mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.045, 48).rotateX(Math.PI / 2), MAT.brass, parent, x, y, z);
    const knob = this.mesh(new THREE.CylinderGeometry(0.103, 0.11, 0.08, 32).rotateX(Math.PI / 2), MAT.graphite, parent, x, y, z + 0.04);
    const mark = this.roundedPanel(0.01, 0.065, 0.005, MAT.control, knob, 0, 0.045, 0.044, 0.002);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; this.line([V3(x + Math.sin(a) * 0.15, y + Math.cos(a) * 0.15, z), V3(x + Math.sin(a) * 0.164, y + Math.cos(a) * 0.164, z)], PAINT.chrome, parent); }
    const arcMaterial = new THREE.ShaderMaterial({
      uniforms:{uFill:{value:.2},uColor:{value:new THREE.Color(PAINT.thrust)}},
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`uniform float uFill;uniform vec3 uColor;varying vec2 vUv;void main(){if(vUv.x>uFill)discard;gl_FragColor=vec4(uColor,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
    });
    const arc = this.mesh(new THREE.TorusGeometry(0.18, 0.008, 6, 96), arcMaterial, parent, x, y, z);
    arc.rotation.z = Math.PI / 2;
    return { knob, mark, arc };
  },
  ledSlider(parent, x, y, z, width) {
    this.roundedPanel(width + 0.1, 0.095, 0.028, MAT.rubber, parent, x, y, z);
    this.roundedPanel(width, 0.008, 0.008, MAT.control, parent, x, y, z + 0.019, 0.002);
    const handle = this.roundedPanel(0.06, 0.10, 0.06, MAT.chrome, parent, x, y, z + 0.04);
    for (let i = 0; i < 22; i++) this.roundedPanel(0.005, i % 5 ? 0.008 : 0.016, 0.004, MAT.brass, parent, x - width / 2 + i / 21 * width, y - 0.068, z);
    const marker = this.mesh(new THREE.ConeGeometry(0.013, 0.02, 3).rotateX(Math.PI / 2), MAT.brass, handle, 0, -0.078, 0);
    return { handle, marker, x, y, z, width };
  },
  expansion(parent, x, y, z) {
    const t = this.canvasTex(128, 128, c => {
      c.strokeStyle = inkConfig().ink; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath();
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

// Coastal colors belong to the environment; scientific quantity roles share the configured diagram palette.
const COAST=inkConfig().coast;
MAT.concrete=new THREE.MeshToonMaterial({color:COAST.concrete,flatShading:true});
MAT.steel=new THREE.MeshToonMaterial({color:COAST.steel});
const css=color=>`#${new THREE.Color(color).getHexString()}`;
scene.fog=new THREE.Fog(INK_CFG.paper,...INK_CFG.fog);
const dawn=KIT.canvasTex(512,256,(c,w,h)=>{
 for(const [i,color]of COAST.sky.entries()){c.fillStyle=color;c.fillRect(0,h*[0,.30,.47,.58][i],w,h);}
 // Flat baked cloud bands never enter the geometry depth/normal pass.
 c.fillStyle=COAST.cloud;
 for(let i=0;i<12;i++){const x=(i*97+31)%w,y=h*(.18+.19*((i*53)%11)/11);c.fillRect(x-35,y,70+(i%3)*18,3+(i%2)*2);}
});
dawn.mapping=THREE.EquirectangularReflectionMapping;scene.background=dawn;
