const EARTH_SPIN = new THREE.Group(); EARTH_SPIN.position.copy(E); HERO.add(EARTH_SPIN);
KIT.mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.025, 48), MAT.graphite, HERO, E.x, MODEL.top + 0.035, E.z);
KIT.rod(V3(E.x, MODEL.top + 0.0475, 0), V3(E.x, E.y - RV * 0.8, 0), 0.025, MAT.brass, HERO);
// Two glass hemispheres keep the near cross section readable.
for (const [phi, opacity] of [[0, 0.10], [Math.PI, 0.24]]) {
  const material = new THREE.MeshStandardMaterial({ color: INK_CFG.space.ocean, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false });
  const half = KIT.mesh(new THREE.SphereGeometry(RV * 0.985, 48, 32, phi, Math.PI), material, EARTH_SPIN);
  half.castShadow = false;
}
const gridMaterial = new THREE.LineBasicMaterial({ color: INK_CFG.space.grid, transparent: true, opacity: 0.42 });
for (let j = 0; j < 12; j++) {
  const a = j / 12 * Math.PI * 2;
  const p = Array.from({ length: 97 }, (_, i) => { const t = i / 96 * Math.PI * 2; return V3(Math.cos(t) * Math.cos(a), Math.sin(t), Math.cos(t) * Math.sin(a)).multiplyScalar(RV * 0.973); });
  EARTH_SPIN.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), gridMaterial));
}
for (let j = -3; j <= 3; j++) {
  const a = j * Math.PI / 8;
  const p = Array.from({ length: 97 }, (_, i) => { const t = i / 96 * Math.PI * 2; return V3(Math.cos(t) * Math.cos(a), Math.sin(a), Math.sin(t) * Math.cos(a)).multiplyScalar(RV * 0.973); });
  EARTH_SPIN.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), gridMaterial));
}
// Seeded clustered facets: abstract land, no bitmap map and no geographic illustration.
const landMat = new THREE.MeshStandardMaterial({ color: INK_CFG.space.land, flatShading: true });
const continentCenters = Array.from({ length: 7 }, () => V3(rand() * 2 - 1, rand() * 1.6 - 0.8, rand() * 2 - 1).normalize());
const landGeo = new THREE.IcosahedronGeometry(RV * 0.944, 3);
const lp = landGeo.attributes.position, landTriangles = [];
for (let i = 0; i < lp.count; i += 3) {
  const center = V3().fromBufferAttribute(lp, i).add(V3().fromBufferAttribute(lp, i + 1)).add(V3().fromBufferAttribute(lp, i + 2)).normalize();
  if (continentCenters.some(p => p.dot(center) > 0.86 + rand() * 0.07)) {
    for (let k = 0; k < 3; k++) landTriangles.push(lp.getX(i + k), lp.getY(i + k), lp.getZ(i + k));
  }
}
const continentGeo = new THREE.BufferGeometry(); continentGeo.setAttribute('position', new THREE.Float32BufferAttribute(landTriangles, 3)); continentGeo.computeVertexNormals();
KIT.mesh(continentGeo, landMat, EARTH_SPIN); landGeo.dispose();
KIT.ball(RV * 0.73, new THREE.MeshStandardMaterial({ color: INK_CFG.space.core, flatShading: true }), EARTH_SPIN);
KIT.rod(V3(0, -RV * 1.23, 0), V3(0, RV * 1.23, 0), 0.008, MAT.brass, EARTH_SPIN);
for (const y of [-1, 1]) KIT.ball(0.018, MAT.brass, EARTH_SPIN, 0, RV * 1.24 * y, 0);
const HARBOR = new THREE.Group(); HARBOR.position.set(RV * 0.99, 0, 0); EARTH_SPIN.add(HARBOR);
KIT.rod(V3(0, 0, 0), V3(0.079, 0, 0), 0.008, MAT.brass, HARBOR);
KIT.ball(0.023, MAT.glow, HARBOR, 0.077, 0, 0);
const PIN_HIT = KIT.ball(0.065, new THREE.MeshBasicMaterial({ visible: false }), HARBOR, 0.072, 0, 0);
PIN_HIT.visible = false;

// Analytic sea/crack shaders keep their geometry and animation, sharing 46's tone palette.
const inkShaderUniforms = {
  inkDark:{value:new THREE.Vector3(...INK_CFG.dark)}, inkMid:{value:new THREE.Vector3(...INK_CFG.mid)},
  inkLight:{value:new THREE.Vector3(...INK_CFG.light)}, inkColor:{value:new THREE.Color(INK_CFG.ink)},
  moonColor:{value:new THREE.Color(INK_CFG.space.moon)}
};
const oceanMaterial = new THREE.ShaderMaterial({
  uniforms: { ...inkShaderUniforms, uBulge: { value: PHYS.oceanBulge(0).bulge }, uRv: { value: RV },
    uSea: { value: new THREE.Color(THEME.sea) }, uTide: { value: new THREE.Color(THEME.tide) } },
  vertexShader: `uniform float uBulge; uniform float uRv; varying float vHeight; varying vec3 vNormal; varying vec3 vView;
    void main(){ vec3 dir=normalize(position); float p=(3.0*dir.x*dir.x-1.0)*0.5;
      vHeight=p; vec3 pos=dir*uRv*(1.0+uBulge*p); vec4 mv=modelViewMatrix*vec4(pos,1.0);
      vNormal=normalize(normalMatrix*dir); vView=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 inkDark,inkMid,inkLight,inkColor; uniform vec3 uSea; uniform vec3 uTide; varying float vHeight; varying vec3 vNormal; varying vec3 vView;
    void main(){
      float facing=dot(normalize(vNormal),normalize(vec3(-.5,.8,1.0)));
      vec3 band=facing<-.1?inkDark:(facing<.5?inkMid:inkLight);
      float level=(vHeight+0.5)/1.5;
      vec3 col=level<.33?uSea:(level<.67?mix(uSea,uTide,.5):uTide);
      float contour=step(.10,abs(dot(normalize(vNormal),normalize(vView))));
      gl_FragColor=vec4(mix(inkColor,col*band,contour),.42);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  transparent: true, depthWrite: false, side: THREE.DoubleSide
});
const OCEAN = KIT.mesh(new THREE.SphereGeometry(RV, 96, 64), oceanMaterial, HERO, ...MODEL.E);
OCEAN.castShadow = false; OCEAN.renderOrder = 3;
const REFERENCE = new THREE.Group(); REFERENCE.position.copy(E); HERO.add(REFERENCE);
const baseline = PHYS.oceanBulge(0).bulge;
function referencePoint(x, y, z) {
  const d = V3(x, y, z).normalize(); return d.multiplyScalar(RV * (1 + baseline * (3 * d.x * d.x - 1) / 2) + 0.001);
}
for (let j = 0; j < 8; j++) {
  const a = j / 8 * Math.PI;
  KIT.line(Array.from({ length: 181 }, (_, i) => { const t = i / 180 * Math.PI * 2; return referencePoint(Math.cos(t), Math.sin(t) * Math.cos(a), Math.sin(t) * Math.sin(a)); }), THEME.reference, REFERENCE, true, 0.62);
}
for (const x of [-0.7, 0, 0.7]) {
  KIT.line(Array.from({ length: 181 }, (_, i) => { const t = i / 180 * Math.PI * 2, r = Math.sqrt(1 - x * x); return referencePoint(x, Math.cos(t) * r, Math.sin(t) * r); }), THEME.reference, REFERENCE, true, 0.5);
}
const SATURATION_SIGN = KIT.expansion(HERO, E.x - RV * 0.55, E.y + RV * 1.28, 0.02);

// Floating apparatus truss: two thin chords and cross braces, without a shared platform.
const railY = E.y - RV * 0.65, railStart = railAt(1), railEnd = railAt(0);
for (const z of [-0.033, 0.033]) KIT.rod(V3(railStart - 0.045, railY, z), V3(railEnd + 0.07, railY, z), 0.011, MAT.brass, HERO);
for (let i = 0; i < 8; i++) {
  const x = THREE.MathUtils.lerp(railStart - 0.045, railEnd + 0.07, i / 8);
  const next = THREE.MathUtils.lerp(railStart - 0.045, railEnd + 0.07, (i + 1) / 8);
  KIT.rod(V3(x, railY, -0.033), V3(next, railY, 0.033), 0.004, MAT.chrome, HERO);
}
for (const n of PHYS.RAIL_NOTCHES) KIT.rod(V3(railAt(n.x), railY, 0.035), V3(railAt(n.x), railY, 0.069), 0.004, MAT.brass, HERO);
PHYS.DETENTS.forEach((n, i) => {
  KIT.rod(V3(railAt(n.x), railY, 0.035), V3(railAt(n.x), railY, 0.105 + i * 0.012), 0.007, MAT.brass, HERO);
  for (let k = 0; k <= i; k++) KIT.ball(0.006, MAT.brass, HERO, railAt(n.x), railY + 0.007, 0.065 + k * 0.014);
});
// Separate grip recess at the outer stop represents the negative-u current detent.
KIT.line([V3(railEnd + 0.015, railY + 0.012, -0.025), V3(railEnd + 0.055, railY + 0.012, 0.025)], THEME.reference, HERO);
const MOON_CARRIAGE = new THREE.Group(); HERO.add(MOON_CARRIAGE);
KIT.roundedPanel(0.09, 0.035, 0.10, MAT.chrome, MOON_CARRIAGE, 0, railY, 0);
KIT.rod(V3(0, railY, 0), V3(0, E.y - RV * MODEL.moonRatio, 0), 0.009, MAT.brass, MOON_CARRIAGE);
const MOON_SHAKE = new THREE.Group(); MOON_SHAKE.position.y = E.y; MOON_CARRIAGE.add(MOON_SHAKE);
const moonCrackMaterial = new THREE.ShaderMaterial({
  uniforms: { ...inkShaderUniforms, uProgress: { value: 0 }, uOpacity: { value: 1 } },
  vertexShader: `varying vec3 vPosition; varying vec3 vNormal; varying vec3 vView;
    void main(){vPosition=position;vec4 mv=modelViewMatrix*vec4(position,1.0);
      vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `uniform vec3 inkDark,inkMid,inkLight,inkColor,moonColor; uniform float uProgress; uniform float uOpacity;
    varying vec3 vPosition; varying vec3 vNormal; varying vec3 vView;
    vec3 hash(vec3 p){return fract(sin(vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6))))*43758.5453);}
    void main(){vec3 p=normalize(vPosition)*5.0;vec3 cell=floor(p);vec3 f=fract(p);float f1=10.0;float f2=10.0;
      for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)for(int z=-1;z<=1;z++){
        vec3 o=vec3(float(x),float(y),float(z));float d=length(o+hash(cell+o)-f);
        if(d<f1){f2=f1;f1=d;}else if(d<f2){f2=d;}}
      float edge=1.0-smoothstep(0.025,0.095,f2-f1);
      float reveal=smoothstep(0.02,0.30,uProgress)*(0.65+0.35*smoothstep(hash(cell).x-0.15,hash(cell).x+0.15,uProgress));
      float facing=dot(normalize(vNormal),normalize(vec3(-.5,.8,1.0)));
      vec3 band=facing<-.1?inkDark:(facing<.5?inkMid:inkLight);
      vec3 silver=moonColor*band;
      float contour=step(.13,abs(dot(normalize(vNormal),normalize(vView))));
      gl_FragColor=vec4(mix(inkColor,mix(silver,inkColor,step(.5,edge)*reveal),contour),uOpacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`, transparent: true
});
const MOON = KIT.ball(RV * MODEL.moonRatio, moonCrackMaterial, MOON_SHAKE, 0, 0, 0, 3);
for (let i = 0; i < 15; i++) {
  const d = V3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
  const crater = KIT.mesh(new THREE.TorusGeometry(0.007 + rand() * 0.009, 0.0014, 4, 10), MAT.chrome, MOON, ...d.clone().multiplyScalar(RV * MODEL.moonRatio * 0.985).toArray());
  crater.quaternion.setFromUnitVectors(V3(0, 0, 1), d);
}
const CRACKS = new THREE.Group(); MOON_SHAKE.add(CRACKS);
const MOON_HIT = KIT.ball(0.15, new THREE.MeshBasicMaterial({ visible: false }), MOON_CARRIAGE, 0, E.y, 0);
MOON_HIT.visible = false;
const BEADS = new THREE.InstancedMesh(new THREE.SphereGeometry(0.008, 8, 6), MAT.moon, 31); HERO.add(BEADS);
const BEAD_SIGN = KIT.expansion(HERO, 0, E.y - 0.07, 0.14);
const SHARDS = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), MAT.moon, 180);
SHARDS.position.copy(E); SHARDS.rotation.z = 0.12; HERO.add(SHARDS);
const shardData = Array.from({ length: 180 }, (_, i) => ({ a: i / 180 * Math.PI * 2 + rand() * 0.025, r: RV * (1.58 + rand() * 0.25), y: (rand() - 0.5) * 0.035, s: 0.006 + rand() * 0.010, phase: rand() * 6 }));
const dummy = new THREE.Object3D();
function updateHero() {
  const closer = closerAt(S.u.value), { bulge, saturated } = PHYS.oceanBulge(closer), fracture = PHYS.fractureState(closer);
  const moonX = E.x + PHYS.moonVisDist(closer) * RV;
  MOON_CARRIAGE.position.x = moonX;
  EARTH_SPIN.rotation.y = S.lon0.value + PHYS.relRate(closer) * S.t.value;
  oceanMaterial.uniforms.uBulge.value = bulge;
  OCEAN.visible = !saturated && S.layers.ocean !== false;
  SATURATION_SIGN.visible = saturated && S.layers.reference !== false;
  const cracking = fracture.state === 'cracking';
  MOON.visible = fracture.state !== 'ring'; CRACKS.visible = cracking;
  CRACKS.children.forEach((line, i) => { line.visible = i < Math.ceil(fracture.progress * 5); });
  MOON_SHAKE.position.x = cracking ? Math.sin(S.t.value * 0.013) * 0.004 * fracture.progress : 0;
  MOON_SHAKE.position.z = cracking ? Math.cos(S.t.value * 0.019) * 0.003 * fracture.progress : 0;
  SHARDS.visible = fracture.state === 'ring' && S.layers.ring !== false;
  if (SHARDS.visible) {
    for (let i = 0; i < SHARDS.count; i++) {
      const d = shardData[Math.floor(i * shardData.length / SHARDS.count)], a = d.a + S.t.value * 0.0001;
      dummy.position.set(Math.cos(a) * d.r, d.y, Math.sin(a) * d.r); dummy.rotation.set(d.phase, a, d.phase);
      dummy.scale.set(d.s, d.s * 0.65, d.s * 1.4); dummy.updateMatrix(); SHARDS.setMatrixAt(i, dummy.matrix);
    }
    SHARDS.instanceMatrix.needsUpdate = true; SHARDS.computeBoundingSphere();
  }
  const count = Math.max(1, Math.round(PHYS.beads(closer)));
  BEADS.count = count;
  for (let i = 0; i < count; i++) {
    const x = THREE.MathUtils.lerp(E.x + RV, moonX - RV * MODEL.moonRatio, (i + 1) / (count + 1));
    dummy.position.set(x, E.y - 0.065, 0.12); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); BEADS.setMatrixAt(i, dummy.matrix);
  }
  BEADS.instanceMatrix.needsUpdate = true; BEADS.computeBoundingSphere();
  BEAD_SIGN.position.x = (E.x + RV + moonX - RV * MODEL.moonRatio) / 2;
  SLIDER.handle.position.x = SLIDER.x - SLIDER.width / 2 + (S.u.value + 0.05) / 1.05 * SLIDER.width;
  DIAL.knob.rotation.z = -S.t.value / 86400 * Math.PI * 2;
  const arcValue = ((S.t.value % 86400) + 86400) % 86400 / 86400;
  DIAL.arc.geometry.setDrawRange(0, Math.max(36, Math.floor(arcValue * 96) * 36));
  DIAL.arc.material.emissiveIntensity = .15 + arcValue * .1;
  PLAY_GLYPH.visible = !!S.playing.target; PLAY_TRIANGLE.visible = !S.playing.target;
}
