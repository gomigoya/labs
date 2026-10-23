// Spacetime tabletop: a cut front half, physical carriage and two-marker probe.
KIT.roundedPanel(PHYS.GRAMMAR.tableWidth,0.10,2.4,MAT.brass,HERO,0,MODEL.top+0.02,0,0.04);
const GRID=new THREE.Group(), FRONT_GRID=new THREE.Group();HERO.add(GRID,FRONT_GRID);
const gridMaterial=new THREE.ShaderMaterial({
 uniforms:{uField:{value:0},uDepth:{value:0.1},uCenter:{value:new THREE.Vector2(E.x,-E.z)},uColor:{value:new THREE.Color(THEME.cool)}},
 vertexShader:`uniform float uDepth;uniform vec2 uCenter;varying vec2 vGrid;varying float vWell;
 void main(){vec3 p=position;float d=length(p.xy-uCenter);vGrid=p.xy;vWell=exp(-d*d/0.45);p.z=-uDepth*vWell;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
 fragmentShader:`uniform float uField;uniform vec3 uColor;varying vec2 vGrid;varying float vWell;
 void main(){vec2 g=abs(fract((vGrid+0.075)/0.15)-0.5)/fwidth(vGrid/0.15);float line=1.0-min(min(g.x,g.y),1.0);
 vec3 col=uColor*(0.23+line*(0.8+uField*0.8));gl_FragColor=vec4(col,0.15+line*0.7);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,transparent:true,side:THREE.DoubleSide,depthWrite:false
});
for(const [group,z] of [[GRID,-0.55],[FRONT_GRID,0.55]]){
 const geo=new THREE.PlaneGeometry(3.5,1.1,100,40).translate(0,-z,0);
 const mesh=KIT.mesh(geo,gridMaterial,group,0,E.y,0);mesh.rotation.x=-Math.PI/2;mesh.castShadow=false;
}
const holeMaterial=new THREE.MeshStandardMaterial({color:THEME.void,roughness:0.95,flatShading:true});
const HOLE=KIT.ball(1,holeMaterial,HERO,E.x,E.y-0.17,E.z,3);HOLE.scale.set(MODEL.horizon,0.105,MODEL.horizon);
const horizonMaterial=new THREE.MeshStandardMaterial({color:THEME.red,emissive:THEME.red,emissiveIntensity:2.1});
const HORIZON=KIT.mesh(new THREE.TorusGeometry(MODEL.horizon,0.012,8,120).rotateX(Math.PI/2),horizonMaterial,HERO,E.x,E.y+0.015,E.z);
const diskMaterial=new THREE.ShaderMaterial({
 uniforms:{uT:{value:0},uGlow:{value:1.6},uInner:{value:MODEL.horizon*1.02},uOuter:{value:MODEL.horizon*1.26},uWarm:{value:new THREE.Color(THEME.warm)},uCool:{value:new THREE.Color(THEME.tide)}},
 vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`uniform float uT;uniform float uGlow;uniform float uInner;uniform float uOuter;uniform vec3 uWarm;uniform vec3 uCool;varying vec3 vP;
 void main(){float a=atan(vP.y,vP.x);float r=length(vP.xy);float flow=0.5+0.5*sin(a*14.0-r*80.0-uT);
 float rim=smoothstep(uInner,uInner+0.025,r)*(1.0-smoothstep(uOuter-0.04,uOuter,r));
 vec3 col=mix(uWarm,uCool,flow*0.35)*uGlow*(0.45+0.55*flow)*(0.62+0.38*cos(a-0.6));
 gl_FragColor=vec4(col,rim*0.72);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,transparent:true,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending
});
const DISK=KIT.mesh(new THREE.RingGeometry(MODEL.horizon*1.02,MODEL.horizon*1.26,128),diskMaterial,HERO,E.x,E.y+0.005,E.z);DISK.rotation.x=-Math.PI/2;DISK.castShadow=false;
// Exaggerated lensed arcs, with rotating displaced bands and a dark central cutout.
const lensMaterial=new THREE.ShaderMaterial({uniforms:{uT:{value:0},uField:{value:0}},
 vertexShader:`varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`uniform float uT;uniform float uField;varying vec2 vP;void main(){float a=atan(vP.y,vP.x);float r=length(vP);float bent=r+0.017*sin(a*2.0+uT*0.18);float arcs=pow(0.5+0.5*cos(bent*190.0-a*2.0-uT*0.3),12.0);float envelope=smoothstep(0.73,0.77,r)*(1.0-smoothstep(1.03,1.08,r));gl_FragColor=vec4(vec3(0.42,0.68,0.79)*(0.3+arcs*1.0)*(0.7+0.3*uField),envelope*(0.08+arcs*0.25));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,transparent:true,side:THREE.DoubleSide,depthWrite:false});
const LENS_RING=KIT.mesh(new THREE.RingGeometry(MODEL.horizon*1.07,MODEL.horizon*1.58,128),lensMaterial,HERO,E.x,E.y+0.025,E.z);LENS_RING.rotation.x=-Math.PI/2;LENS_RING.castShadow=false;
const phenomenonLight=new THREE.PointLight(THEME.cool,0.5,3);phenomenonLight.position.set(E.x,E.y+0.3,E.z);HERO.add(phenomenonLight);
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
const probeMaterial=new THREE.ShaderMaterial({uniforms:{uSize:{value:V3(0.1,0.05,0.06)},uTint:{value:new THREE.Color(THEME.tide)},uT:{value:0}},
 vertexShader:`uniform vec3 uSize;varying vec3 vNormal;varying vec3 vP;void main(){vP=position;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position*uSize,1.0);}`,
 fragmentShader:`uniform vec3 uTint;uniform float uT;varying vec3 vNormal;varying vec3 vP;void main(){float seams=smoothstep(0.46,0.49,abs(vP.x));float grain=0.93+0.07*sin(vP.x*90.0+uT*0.3);gl_FragColor=vec4(uTint*(0.48+0.4*abs(vNormal.z))*grain*(1.0-0.55*seams),1.0);
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
const SCALE_SIGNS=[KIT.expansion(HERO,1.55,E.y+0.08,0.85),KIT.expansion(PROBE,0,0.16,0),KIT.expansion(CONSOLE,-1.18,0.98,1.15)];
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
 phenomenonLight.intensity=v.light;
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

// Functional, unlettered mass specimen rack and linear engraving fill the spare tabletop.
KIT.roundedPanel(.62,.045,.75,MAT.graphite,HERO,1.58,MODEL.top+.105,.35);
for(let i=0;i<3;i++){
 const z=.10+i*.24;
 KIT.mesh(new THREE.CylinderGeometry(.09,.10,.025,24),MAT.brass,HERO,1.58,MODEL.top+.14,z);
 const specimen=KIT.ball(PHYS.cardPrediction(6,{i}).size/500,MAT.chrome,HERO,1.58,MODEL.top+.22,z,1);
 for(let j=0;j<=i;j++)KIT.ball(.012,MAT.glow,HERO,1.40+j*.045,MODEL.top+.16,z);
}
for(let i=0;i<=20;i++)KIT.rod(V3(.75+i*.045,MODEL.top+.08,.92),V3(.75+i*.045,MODEL.top+.08,i%5?.97:1.04),.004,MAT.chrome,HERO);

// R5: inset instrument plate, illuminated divisions and a routed cable on the spare brass.
KIT.roundedPanel(.78,.045,.44,MAT.graphite,HERO,.83,MODEL.top+.115,.63);
KIT.roundedPanel(.68,.012,.32,MAT.navy,HERO,.83,MODEL.top+.145,.63);
for(let j=0;j<9;j++){
 const x=.54+j*.072;
 KIT.rod(V3(x,MODEL.top+.158,.52),V3(x,MODEL.top+.158,j%4?.66:.73),.006,j%4?MAT.chrome:MAT.glow,HERO);
}
KIT.rod(V3(.51,MODEL.top+.158,.75),V3(1.15,MODEL.top+.158,.75),.008,MAT.glow,HERO);
const plateCable=[V3(1.21,MODEL.top+.14,.65),V3(1.28,MODEL.top+.08,.76),V3(1.38,MODEL.top+.08,.85),V3(1.78,MODEL.top+.08,.85),V3(1.89,MODEL.top+.08,.68),V3(1.89,MODEL.top+.08,.18)];
for(let j=1;j<plateCable.length;j++)KIT.rod(plateCable[j-1],plateCable[j],.014,MAT.rubber,HERO);
for(const x of [.49,1.17])for(const z of [.46,.80])KIT.mesh(new THREE.CylinderGeometry(.018,.018,.01,12),MAT.brass,HERO,x,MODEL.top+.145,z);
