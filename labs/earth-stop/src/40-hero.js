// A faceted globe, physical meridian carriage, inertial bead, orbital sun lamp.
const EARTH_SPIN=new THREE.Group();EARTH_SPIN.position.copy(E);HERO.add(EARTH_SPIN);
KIT.mesh(new THREE.CylinderGeometry(.38,.43,.06,48),MAT.brass,HERO,0,MODEL.top+.045,0);
KIT.mesh(new THREE.CylinderGeometry(.31,.36,.05,48),MAT.graphite,HERO,0,MODEL.top+.10,0);
KIT.rod(V3(0,MODEL.top+.12,0),V3(0,E.y-RV*.9,0),.025,MAT.brass,HERO);
KIT.rod(V3(0,E.y-RV*1.2,0),V3(0,E.y+RV*1.2,0),.012,MAT.brass,HERO);
const earthGeometry=new THREE.SphereGeometry(RV,96,64);
const earthMaterial=new THREE.ShaderMaterial({
 uniforms:{uSun:{value:V3(1,0,0)},uTime:{value:0},uEdge:{value:new THREE.Color(THEME.cool)}},
 vertexShader:`varying vec3 vLocal;varying vec3 vNormal;varying vec3 vWorld;
 void main(){vLocal=normalize(position);vNormal=normalize(mat3(modelMatrix)*normal);
 vWorld=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.0);}`,
 fragmentShader:`uniform vec3 uSun;uniform vec3 uEdge;uniform float uTime;
 varying vec3 vLocal;varying vec3 vNormal;varying vec3 vWorld;
 float terrain(vec3 p){return sin(p.x*7.0+p.z*3.0)*.42+sin(p.z*9.0-p.y*5.0)*.32+cos(p.y*13.0+p.x*4.0)*.19+sin(p.x*29.0+p.z*21.0)*.07;}
 float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 void main(){vec3 n=normalize(vNormal),p=normalize(vLocal);float h=terrain(p);
 float land=smoothstep(.12,.16,h),coast=smoothstep(.08,.13,h)*(1.0-smoothstep(.16,.21,h));
 float depth=smoothstep(-.65,.13,h);vec3 sea=mix(vec3(.018,.055,.105),vec3(.075,.29,.36),depth);
 vec3 soil=mix(vec3(.16,.27,.13),vec3(.44,.48,.26),smoothstep(.15,.7,h));
 vec3 col=mix(sea,soil,land);col=mix(col,vec3(.61,.51,.31),coast*.7);
 float d=dot(n,normalize(uSun)),day=smoothstep(-.045,.045,d);
 float cloud=smoothstep(.87,.96,sin(p.y*48.0+sin(p.x*13.0+p.z*9.0)+uTime*.025));
 col=mix(col,vec3(.65,.71,.73),cloud*.25);
 vec3 viewDir=normalize(cameraPosition-vWorld);float spec=pow(max(0.0,dot(reflect(-normalize(uSun),n),viewDir)),48.0)*(1.0-land);
 float city=step(.986,hash(floor(p*230.0)))*land*(1.0-day);
 float rim=exp(-abs(d)*75.0);
 gl_FragColor=vec4(col*(.12+day*.9)+spec*.18+city*vec3(1.8,1.0,.35)+uEdge*rim*1.6,1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`
});
const EARTH=KIT.mesh(earthGeometry,earthMaterial,EARTH_SPIN);EARTH.castShadow=false;
// Thin meridians and parallels are etched into the globe; no reference overlays.
for(let j=0;j<12;j++){
 const a=j/12*Math.PI*2;
 KIT.line(Array.from({length:65},(_,i)=>{const p=i/64*Math.PI*2;return V3(Math.sin(a)*Math.cos(p),Math.sin(p),Math.cos(a)*Math.cos(p)).multiplyScalar(RV*1.003);}),THEME.earth,EARTH_SPIN,false,.18);
}
for(const phi of PHYS.C.phiDetents.slice(1,-1)){
 KIT.line(Array.from({length:65},(_,i)=>{const p=PHYS.scenePoint(phi,i/64*Math.PI*2,RV*1.003);return V3(...p).sub(E);}),THEME.earth,EARTH_SPIN,false,.24);
}
const MERIDIAN=new THREE.Group();MERIDIAN.position.copy(E);HERO.add(MERIDIAN);
const meridianPoints=Array.from({length:65},(_,i)=>V3(0,Math.sin((i/64-.5)*Math.PI)*MODEL.pinReach,Math.cos((i/64-.5)*Math.PI)*MODEL.pinReach));
for(let i=1;i<meridianPoints.length;i++)KIT.rod(meridianPoints[i-1],meridianPoints[i],.008,MAT.brass,MERIDIAN);
for(const d of PHYS.DETENTS.phi){const p=V3(...PHYS.scenePoint(d.phi,0,MODEL.pinReach)).sub(E);KIT.rod(p.clone().add(V3(-.024,0,0)),p.clone().add(V3(.024,0,0)),.005,MAT.chrome,MERIDIAN);}
const PIN=new THREE.Group();HERO.add(PIN);
const PIN_STEM=KIT.rod(V3(0,-.035,0),V3(0,.035,0),.012,MAT.brass,PIN);
const PIN_HEAD=KIT.ball(.046,MAT.glow,PIN);
const BODY=KIT.ball(MODEL.ball*PHYS.GRAMMAR.ballScale,MAT.chrome,HERO);
const HIT_MAT=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
const PIN_HIT=KIT.ball(.11,HIT_MAT,PIN);PIN_HIT.castShadow=false;
// The tangent indicator is a basic physical magnitude, without R2 grammar layers.
const SPEED=new THREE.Group();HERO.add(SPEED);
const speedMaterial=new THREE.ShaderMaterial({
 uniforms:{uColor:{value:new THREE.Color(THEME.velocity)},uSpeed:{value:0},uUnit:{value:1},uStyle:{value:0},uTime:{value:0},uOpacity:{value:1}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`uniform vec3 uColor;uniform float uSpeed,uUnit,uStyle,uTime,uOpacity;varying vec2 vUv;
 void main(){float edge=1.0-smoothstep(.72,1.0,abs(vUv.y-.5)*2.0);
 float dash=step(.38,fract(vUv.x*max(uUnit,1.0)*12.0));if(uStyle>.5&&dash<.5)discard;
 float mark=1.0-smoothstep(.025,.055,abs(fract(vUv.x*uUnit+.5)-.5));
 float streak=pow(max(0.0,sin(vUv.x*32.0-uTime*4.0)),12.0)*.12;
 gl_FragColor=vec4(uColor*(.7+mark*.7+streak),edge*.85*uOpacity);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,transparent:true,depthWrite:false,side:THREE.DoubleSide
});
const SPEED_SHAFT=KIT.mesh(new THREE.PlaneGeometry(1,PHYS.GRAMMAR.lineWidth).translate(.5,0,0),speedMaterial,SPEED);
const arrowShape=new THREE.Shape();arrowShape.moveTo(0,-.044);arrowShape.lineTo(MODEL.arrowHead,0);arrowShape.lineTo(0,.044);arrowShape.closePath();
const SPEED_TIP=KIT.mesh(new THREE.ShapeGeometry(arrowShape),MAT.glow,SPEED);
SPEED_SHAFT.castShadow=SPEED_TIP.castShadow=false;
KIT.expansion(HERO,-.22,2.79,.05);KIT.expansion(HERO,.95,1.55,.3);
const SUN_ORBIT=new THREE.Group();SUN_ORBIT.position.copy(E);HERO.add(SUN_ORBIT);
KIT.mesh(new THREE.TorusGeometry(MODEL.sunRadius,.009,8,96).rotateX(Math.PI/2),MAT.brass,SUN_ORBIT,0,-.50,0);
const SUN_CARRIAGE=new THREE.Group();SUN_ORBIT.add(SUN_CARRIAGE);
const sunGlow=new THREE.MeshStandardMaterial({color:THEME.warm,emissive:THEME.warm,emissiveIntensity:2.5,roughness:.5});
KIT.mesh(new THREE.CylinderGeometry(.16,.19,.035,32),MAT.graphite,SUN_CARRIAGE,MODEL.sunRadius,-.5,0);
KIT.rod(V3(MODEL.sunRadius,-.49,0),V3(MODEL.sunRadius,.18,0),.015,MAT.brass,SUN_CARRIAGE);
KIT.ball(MODEL.sunBall,sunGlow,SUN_CARRIAGE,MODEL.sunRadius,.18,0,2);
const sunGuard=KIT.mesh(new THREE.TorusGeometry(.17,.009,8,48).rotateY(Math.PI/2),MAT.brass,SUN_CARRIAGE,MODEL.sunRadius,.18,0);
const SUN_LIGHT=new THREE.PointLight(THEME.warm,1.8,5,2);SUN_LIGHT.position.set(MODEL.sunRadius,.18,0);SUN_CARRIAGE.add(SUN_LIGHT);
// Countable benchmark beads occupy a common linear speed axis on a fixed rack.
const BENCHMARK=new THREE.Group();BENCHMARK.position.set(-.68,1.14,.55);HERO.add(BENCHMARK);
function updateHero(){
 const phi=currentPhi(),P=currentPeriod(),run=S.run;
 const angle=run?run.angle:S.spin.value;
 EARTH_SPIN.rotation.y=angle;MERIDIAN.rotation.y=angle;
 const pin=V3(...PHYS.scenePoint(phi,angle,MODEL.pinReach));PIN.position.copy(pin);
 PIN.quaternion.setFromUnitVectors(V3(0,1,0),pin.clone().sub(E).normalize());
 const velocity=run?run.measurement.relativeSpeed:PHYS.v(phi,P);
 BODY.position.copy(run?V3(...PHYS.tangentPoint(run.phi,run.angle,velocity,run.elapsed.value/MODEL.tangentSeconds)):pin);
 BODY.visible=!run||run.phi===phi;
 SPEED.position.copy(pin);SPEED.rotation.y=angle;
 const length=PHYS.quantity(velocity).length;SPEED_SHAFT.scale.x=Math.max(length,1e-6);SPEED_TIP.position.x=length;
 SPEED.visible=length>1e-6;speedMaterial.uniforms.uSpeed.value=PHYS.mach(velocity);
 speedMaterial.uniforms.uUnit.value=PHYS.mach(velocity);speedMaterial.uniforms.uTime.value=S.t.value;
 earthMaterial.uniforms.uTime.value=S.t.value;
 SUN_ORBIT.rotation.y=S.sun.value;
 SUN_ORBIT.updateMatrixWorld(true);
 const sunPos=V3();SUN_LIGHT.getWorldPosition(sunPos);earthMaterial.uniforms.uSun.value.copy(sunPos.sub(E).normalize());
 SLIDER.handle.position.x=SLIDER.x+(S.phi.value-.5)*SLIDER.width;
 const periodU=PHYS.periodRailX(P);
 DIAL.knob.rotation.z=-periodU*Math.PI*1.5;
 // Angular fill on static torus geometry, no per-frame allocation.
 DIAL.arc.material.uniforms.uFill.value=Math.max(.005,periodU);
 SWITCH_LEVER.position.x=1.18+S.mode.value*.12;
 PLAY_BUTTON.position.z=.82+(S.run?-.012:0);
}
