// Spacetime grid and probe float directly in space, at their original coordinates.
const GRID=new THREE.Group(), FRONT_GRID=new THREE.Group();HERO.add(GRID,FRONT_GRID);
const gridMaterial=new THREE.ShaderMaterial({
 uniforms:{uField:{value:0},uDepth:{value:0.1},uCenter:{value:new THREE.Vector2(E.x,-E.z)},uColor:{value:new THREE.Color(THEME.cool)},uCream:{value:new THREE.Color(INK_CFG.space.star)}},
 vertexShader:`uniform float uDepth;uniform vec2 uCenter;varying vec2 vGrid;varying float vWell;
 void main(){vec3 p=position;float d=length(p.xy-uCenter);vGrid=p.xy;vWell=exp(-d*d/0.45);p.z=-uDepth*vWell;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
 fragmentShader:`uniform float uField;uniform vec3 uColor,uCream;varying vec2 vGrid;varying float vWell;
 void main(){vec2 g=abs(fract((vGrid+0.075)/0.15)-0.5)/fwidth(vGrid/0.15);float line=1.0-min(min(g.x,g.y),1.0);
 vec3 col=mix(uCream,uColor,step(0.5,vWell));gl_FragColor=vec4(col,line*0.85);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,transparent:true,side:THREE.DoubleSide,depthWrite:false
});
for(const [group,z] of [[GRID,-0.55],[FRONT_GRID,0.55]]){
 const geo=new THREE.PlaneGeometry(3.5,1.1,100,40).translate(0,-z,0);
 const mesh=KIT.mesh(geo,gridMaterial,group,0,E.y,0);mesh.rotation.x=-Math.PI/2;mesh.castShadow=false;
}
const holeMaterial=new THREE.MeshStandardMaterial({color:THEME.void,flatShading:true});
const HOLE=KIT.ball(1,holeMaterial,HERO,E.x,E.y-0.17,E.z,3);HOLE.scale.set(MODEL.horizon,0.105,MODEL.horizon);
const horizonMaterial=new THREE.MeshStandardMaterial({color:THEME.red,emissive:THEME.red,emissiveIntensity:.35});
const HORIZON=KIT.mesh(new THREE.TorusGeometry(MODEL.horizon,0.012,8,120).rotateX(Math.PI/2),horizonMaterial,HERO,E.x,E.y+0.015,E.z);
const diskMaterial=new THREE.ShaderMaterial({
 uniforms:{uT:{value:0},uGlow:{value:1.6},uInner:{value:MODEL.horizon*1.02},uOuter:{value:MODEL.horizon*1.26},uWarm:{value:new THREE.Color(THEME.warm)},uCool:{value:new THREE.Color(THEME.tide)},uBands:{value:INK_CFG.space.disk.map(c=>new THREE.Color(c))},uInk:{value:new THREE.Color(INK_CFG.ink)}},
 vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`uniform float uT;uniform float uGlow;uniform float uInner;uniform float uOuter;uniform vec3 uWarm;uniform vec3 uCool;uniform vec3 uBands[3];uniform vec3 uInk;varying vec3 vP;
 void main(){float a=atan(vP.y,vP.x);float r=length(vP.xy);float flow=0.5+0.5*sin(a*14.0-r*80.0-uT);
 float band=floor(clamp((r-uInner)/(uOuter-uInner),0.0,.999)*3.0);
 vec3 col=band<1.0?uBands[0]:(band<2.0?uBands[1]:uBands[2]);
 float inkEdge=step(.965,fract((r-uInner)/(uOuter-uInner)*3.0));
 gl_FragColor=vec4(mix(col,uInk,inkEdge),.85);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,transparent:true,side:THREE.DoubleSide,depthWrite:false
});
const DISK=KIT.mesh(new THREE.RingGeometry(MODEL.horizon*1.02,MODEL.horizon*1.26,128),diskMaterial,HERO,E.x,E.y+0.005,E.z);DISK.rotation.x=-Math.PI/2;DISK.castShadow=false;
// Exaggerated lensed arcs, with rotating displaced bands and a dark central cutout.
const lensMaterial=new THREE.ShaderMaterial({uniforms:{uCream:{value:new THREE.Color(INK_CFG.space.star)},uT:{value:0},uField:{value:0}},
 vertexShader:`varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`uniform vec3 uCream;uniform float uT;uniform float uField;varying vec2 vP;void main(){float a=atan(vP.y,vP.x);float r=length(vP);float arcs=step(.91,cos(r*95.0));float envelope=step(.75,r)*(1.0-step(1.06,r));gl_FragColor=vec4(uCream,envelope*arcs*.45);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,transparent:true,side:THREE.DoubleSide,depthWrite:false});
const LENS_RING=KIT.mesh(new THREE.RingGeometry(MODEL.horizon*1.07,MODEL.horizon*1.58,128),lensMaterial,HERO,E.x,E.y+0.025,E.z);LENS_RING.rotation.x=-Math.PI/2;LENS_RING.castShadow=false;
const railY=E.y+0.10,railStart=E.x-PHYS.visualRadius(PHYS.RANGE.r[1])*MODEL.scale,railEnd=E.x-PHYS.visualRadius(PHYS.RANGE.r[0])*MODEL.scale,railZ=0.91;
for(const z of [railZ-0.025,railZ+0.025]) KIT.rod(V3(railStart,railY,z),V3(railEnd,railY,z),0.009,MAT.brass,HERO);
PHYS.DETENTS.forEach((d,j)=>{
 const x=railStart+(railEnd-railStart)*d.x;
 KIT.rod(V3(x,railY,railZ+0.04),V3(x,railY,railZ+0.09),0.005,MAT.chrome,HERO);
 for(let k=0;k<=j;k++) KIT.ball(0.006,MAT.brass,HERO,x,railY,railZ+0.11+k*0.016);
});
const CARRIAGE=new THREE.Group();HERO.add(CARRIAGE);
const RAIL_HANDLE=KIT.ball(0.065,MAT.chrome,CARRIAGE,0,railY+0.045,railZ,2);
KIT.rod(V3(0,railY,railZ),V3(0,E.y+0.19,E.z),0.007,MAT.chrome,CARRIAGE);
const PROBE=new THREE.Group();PROBE.position.set(0,E.y+0.20,E.z);CARRIAGE.add(PROBE);
const probeMaterial=new THREE.ShaderMaterial({uniforms:{uSize:{value:V3(0.1,0.05,0.06)},uTint:{value:new THREE.Color(THEME.tide)},uDark:{value:new THREE.Vector3(...INK_CFG.dark)},uMid:{value:new THREE.Vector3(...INK_CFG.mid)},uLight:{value:new THREE.Vector3(...INK_CFG.light)},uT:{value:0}},
 vertexShader:`uniform vec3 uSize;varying vec3 vNormal;varying vec3 vP;void main(){vP=position;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position*uSize,1.0);}`,
 fragmentShader:`uniform vec3 uTint,uDark,uMid,uLight;uniform float uT;varying vec3 vNormal;varying vec3 vP;void main(){float seams=smoothstep(0.46,0.49,abs(vP.x));float band=abs(vNormal.z);vec3 tone=band<.33?uDark:(band<.67?uMid:uLight);gl_FragColor=vec4(uTint*tone*(1.0-0.55*seams),1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
const HALVES=[-1,1].map(sign=>{
 const group=new THREE.Group();PROBE.add(group);
 const body=KIT.roundedPanel(1,1,1,probeMaterial,group,0,0,0,0.08);
 const marker=KIT.ball(PHYS.GRAMMAR.marker,MAT.chrome,group,0,0,0,1);
 return {group,body,marker,sign};
});
const TURN_HANDLE=KIT.mesh(new THREE.TorusGeometry(0.075,0.015,6,24),MAT.brass,PROBE,0,0.075,0);TURN_HANDLE.rotation.x=Math.PI/2;
for(const z of [-0.11,0.11])KIT.ball(0.012,MAT.glow,PROBE,0,0,z);
const SCALE_SIGNS=[KIT.expansion(HERO,1.55,E.y+0.08,0.85),KIT.expansion(PROBE,0,0.16,0),KIT.expansion(CONSOLE,...CONTROL_LAYOUT.expansion)];
const INNER_SIGN=new THREE.Group();HERO.add(INNER_SIGN);INNER_SIGN.position.set(E.x,E.y+0.12,E.z);
KIT.line([V3(0,0.08,0),V3(0.06,0,0),V3(0,-0.08,0),V3(-0.06,0,0),V3(0,0.08,0)],THEME.reference,INNER_SIGN);
// Broad, invisible raycast volumes; screen-space minimum radius is updated per frame.
const hitMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
const RAIL_HIT=KIT.ball(0.12,hitMaterial,CARRIAGE,0,railY+0.045,railZ);
const TURN_HIT=KIT.ball(0.10,hitMaterial,PROBE,0,0.08,0);
for(const hit of [RAIL_HIT,TURN_HIT])hit.castShadow=hit.receiveShadow=false;
function updateHero(){
 const i=massIndex(),r=currentR(),o=orientation(),v=PHYS.presentationState(i,r,o);
 CARRIAGE.position.x=E.x-v.radius;
 PROBE.rotation.y=o==='radial'?0:Math.PI/2;
 for(const h of HALVES){
  h.group.position.x=h.sign*(v.body.length/4+v.gap/2);
  probeMaterial.uniforms.uSize.value.set(v.body.length/2,v.body.height,v.body.width);
  h.marker.scale.setScalar(1.3);
  h.marker.position.x=h.sign*v.body.length/4;
 }
 probeMaterial.uniforms.uTint.value.setHex(v.intact?THEME.tide:THEME.red);probeMaterial.uniforms.uT.value=S.t.value;
 lensMaterial.uniforms.uT.value=S.t.value; lensMaterial.uniforms.uField.value=v.field;
 gridMaterial.uniforms.uField.value=v.field;gridMaterial.uniforms.uDepth.value=v.depth;
 diskMaterial.uniforms.uGlow.value=v.glow;diskMaterial.uniforms.uT.value=S.t.value*v.flow;
 FRONT_GRID.position.set(0,S.cutaway.value*0.13,S.cutaway.value*0.23);
 INNER_SIGN.visible=v.crossedHorizon;
 SLIDER.handle.position.x=SLIDER.x-SLIDER.width/2+S.u.value*SLIDER.width;
 DIAL.knob.rotation.z=o==='radial'?0:Math.PI/2;
 DIAL.arc.geometry.setDrawRange(0,o==='radial'?1728:3456);
 PLAY_GLYPH.visible=!!S.playing.target;PLAY_TRIANGLE.visible=!S.playing.target;
 SWITCH.rotation.z=S.cutaway.value*0.6;
 // Keep the actual visible handle small while enlarging its invisible touch volume.
 for(const hit of [RAIL_HIT,TURN_HIT]){
  const world=hit.getWorldPosition(V3()),distance=camera.position.distanceTo(world);
  const radius=distance*Math.tan(camera.fov*Math.PI/360)*56*(S.lineScale||1)/innerHeight;
  hit.scale.setScalar(Math.max(1,radius/hit.geometry.parameters.radius));
 }
}
