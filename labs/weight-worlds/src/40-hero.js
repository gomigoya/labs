// Mechanical parents and displaced covers are kept separate from physical travel.
const SPRING_RIG=new THREE.Group(), BALANCE_RIG=new THREE.Group(), JUMP_RIG=new THREE.Group(), SHELF_RIG=new THREE.Group();
HERO.add(SPRING_RIG,BALANCE_RIG,JUMP_RIG,SHELF_RIG);
const apparatusMat=new THREE.MeshStandardMaterial({color:inkConfig().diagram.mint});
const weightMaterial=new THREE.MeshStandardMaterial({color:inkConfig().diagram.mint});
const forceMaterial=new THREE.ShaderMaterial({
  uniforms:{uOpacity:{value:1},uTime:{value:0},uLevel:{value:0},uColor:{value:new THREE.Color(inkConfig().diagram.force)}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform float uOpacity,uTime,uLevel;uniform vec3 uColor;varying vec2 vUv;
    void main(){float edge=pow(1.0-abs(vUv.x-0.5)*2.0,1.4);gl_FragColor=vec4(uColor*(1.0+uLevel*0.6),edge*0.32*uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`,transparent:true,depthWrite:false,side:THREE.DoubleSide});

for(const x of [-0.30,0.30])KIT.rod(V3(x,0.94,-0.22),V3(x,2.84,-0.22),0.025,MAT.brass,SPRING_RIG);
KIT.roundedPanel(0.76,0.08,0.32,MAT.graphite,SPRING_RIG,0,2.85,-0.12);
KIT.roundedPanel(0.49,1.30,0.035,MAT.navy,SPRING_RIG,0,2.10,-0.25);
for(let k=0;k<=PHYS.C.springLimit;k++){
  const y=PHYS.VIEW.springTop-PHYS.VIEW.springRest-k*PHYS.VIEW.markUnit;
  KIT.rod(V3(0.18,y,-0.21),V3(k%5?0.24:0.28,y,-0.21),k%5?0.004:0.007,MAT.reference,SPRING_RIG);
}
const COVER_OFFSET=new THREE.Group();COVER_OFFSET.position.set(0.46,0.02,0.06);SPRING_RIG.add(COVER_OFFSET);
KIT.roundedPanel(0.10,1.18,0.09,glassMat,COVER_OFFSET,0,2.10,0.02);
for(const y of [1.55,2.65])KIT.screw(COVER_OFFSET,0,y,0.075);
const SPRING_PHYSICAL=new THREE.Group();SPRING_RIG.add(SPRING_PHYSICAL);
const coilPoints=Array.from({length:321},(_,k)=>{const u=k/320,a=u*Math.PI*24;return V3(Math.cos(a)*0.085,-u,Math.sin(a)*0.085);});
const COIL=KIT.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPoints),320,0.010,6,false),MAT.reference,SPRING_PHYSICAL,0,PHYS.VIEW.springTop,0);
const HANGING=new THREE.Group();SPRING_PHYSICAL.add(HANGING);
KIT.mesh(new THREE.TorusGeometry(0.045,0.010,6,20,Math.PI*1.65),MAT.brass,HANGING,0,-0.035,0.01).rotation.z=0.4;
const HANGING_WEIGHTS=[];
for(let k=0;k<PHYS.RANGE.nWeights[1];k++){
  const m=KIT.mesh(new THREE.CylinderGeometry(0.09,0.10,0.045,16),weightMaterial,HANGING,0,-0.10-k*0.05,0);
  KIT.ball(0.009,MAT.reference,m,0,0,0.096,0);HANGING_WEIGHTS.push(m);
}
const FORCE=KIT.mesh(new THREE.PlaneGeometry(0.28,1).translate(0,-0.5,0),forceMaterial,SPRING_PHYSICAL,0,PHYS.VIEW.springTop,0.12);FORCE.castShadow=false;
const BREAK_SIGN=new THREE.Group();SPRING_RIG.add(BREAK_SIGN);
for(const x of [-0.035,0.035])KIT.line([V3(x-0.04,1.64,0.16),V3(x+0.04,1.70,0.16)],inkConfig().diagram.force,BREAK_SIGN);
const SPRING_SIGN=KIT.expansion(SPRING_RIG,0.31,2.92,0.10);
const THROUGH=KIT.mesh(new THREE.PlaneGeometry(0.10,0.25),forceMaterial,SPRING_RIG,0,0.99,0.33);THROUGH.castShadow=false;

function specimen(parent,i,r,x,y,z){
  const material=new THREE.ShaderMaterial({
    uniforms:{uColor:{value:new THREE.Color(THEME.bodies[i])},uKind:{value:i},uLevel:{value:0},uTime:{value:0}},
    vertexShader:`varying vec3 vP;varying vec3 vN;void main(){vP=position;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform vec3 uColor;uniform float uKind,uLevel,uTime;varying vec3 vP;varying vec3 vN;
      void main(){vec3 p=normalize(vP);vec3 col=uColor;
        if(uKind>4.5&&uKind<6.5){float bands=step(0.1,sin(p.y*17.0+sin(p.x*4.0)));
          col=mix(uColor*0.82,vec3(0.86,0.77,0.63),bands);}
        if(uKind>0.5&&uKind<1.5){float crater=step(0.6,sin(p.x*9.0)*sin(p.z*11.0));col=mix(uColor,uColor*0.78,crater);}
        float facing=dot(normalize(vN),normalize(vec3(-0.4,0.7,1.0)));
        col*=facing<0.0?vec3(${inkConfig().dark.join(',')}):(facing<0.55?vec3(${inkConfig().mid.join(',')}):vec3(${inkConfig().light.join(',')}));
        gl_FragColor=vec4(col,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);
  const ball=KIT.ball(r,material,g,0,0,0,1);ball.geometry.computeVertexNormals();
  if(i===PHYS.C.ids.space){ball.visible=false;KIT.mesh(new THREE.TorusGeometry(r*0.8,r*0.035,4,24),MAT.chrome,g);}
  if(i===PHYS.C.ids.saturn){for(let k=0;k<5;k++){const ring=KIT.mesh(new THREE.TorusGeometry(r*(1.26+k*0.085),r*0.023,4,64),k%2?MAT.chrome:MAT.brass,g);ring.rotation.x=1.08;}}
  if(i===PHYS.C.ids.earth){
    for(let k=0;k<5;k++){const a=k*2.4;const p=V3(Math.cos(a),Math.sin(a*1.7)*0.6,Math.sin(a)).normalize().multiplyScalar(r*0.90);const land=KIT.ball(r*0.16,apparatusMat,g,...p.toArray(),0);land.scale.set(1,0.7,0.35);land.lookAt(V3());}
  }
  const effects=new THREE.Group();g.add(effects);
  if(i===PHYS.C.ids.neutron){
    const fieldMaterial=new THREE.MeshBasicMaterial({color:inkConfig().diagram.cool,transparent:true,opacity:0.42});
    for(let k=0;k<6;k++){
      const points=Array.from({length:65},(_,j)=>{const a=j/64*Math.PI*2,theta=k/6*Math.PI;return V3(Math.sin(a)*Math.cos(theta)*r*1.35,Math.cos(a)*r*1.4,Math.sin(a)*Math.sin(theta)*r*1.35);});
      KIT.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,r*0.009,4,false),fieldMaterial,effects);
    }
  }
  if(i===PHYS.C.ids.sun){
    const seeded=mulberry32(407731),positions=Array.from({length:PHYS.GRAMMAR_VIEW.fieldCount},()=>{const a=seeded()*Math.PI*2,z=seeded()*2-1,t=Math.sqrt(1-z*z);return [t*Math.cos(a),z,t*Math.sin(a)];}).flat();
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    const coronaMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.NormalBlending,
      uniforms:{uTime:{value:0},uRadius:{value:r},uOpacity:{value:1}},
      vertexShader:`uniform float uTime,uRadius;varying float vPulse;void main(){float phase=fract(position.y*13.0+uTime*0.17);vPulse=sin(phase*3.14159);vec3 p=position*uRadius*(1.04+phase*0.32);vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(19.0*uRadius/-mv.z,1.5,5.0);}`,
      fragmentShader:`uniform float uOpacity;varying float vPulse;void main(){float a=(1.0-smoothstep(0.1,0.5,length(gl_PointCoord-0.5)));gl_FragColor=vec4(0.86,0.59,0.25,step(0.2,a)*0.35*vPulse*uOpacity);}`});
    const corona=new THREE.Points(geo,coronaMaterial);effects.add(corona);effects.userData.corona=corona;
  }
  return {group:g,ball,material,effects};
}

KIT.mesh(new THREE.CylinderGeometry(SCENERY.stakeRadius,SCENERY.stakeRadius,SCENERY.spindleHeight,8),MAT.chrome,SHELF_RIG,0,0.91+SCENERY.spindleHeight/2,0);
const CAROUSEL=new THREE.Group();CAROUSEL.position.y=0.99;SHELF_RIG.add(CAROUSEL);
const SPECIMENS=PHYS.BODIES.map((_,i)=>{
  const a=i/PHYS.BODIES.length*Math.PI*2;
  const s=specimen(CAROUSEL,i,0.065,Math.sin(a)*PHYS.VIEW.carouselRadius,0,Math.cos(a)*PHYS.VIEW.carouselRadius);
  s.group.userData.body=i;return s;
});
const specimenView=PHYS.specimenVisual();
const SELECTED=PHYS.BODIES.map((_,i)=>specimen(SHELF_RIG,i,PHYS.GRAMMAR_VIEW.specimenRadius,...specimenView.center));
const SPECIMEN_SIGN=KIT.expansion(SHELF_RIG,-specimenView.radius-0.03,specimenView.center[1]+specimenView.radius*0.8,specimenView.front);SPECIMEN_SIGN.scale.setScalar(0.14);
SELECTED.forEach(s=>s.group.scale.setScalar(specimenView.scale));
const SHELF_HANDLE=KIT.ball(0.07,MAT.brass,SHELF_RIG,0,0.98,0.49,1);


KIT.rod(V3(0,0.94,0),V3(0,1.91,0),0.025,MAT.brass,BALANCE_RIG);
KIT.mesh(new THREE.ConeGeometry(0.065,0.12,3),MAT.brass,BALANCE_RIG,0,1.94,0);
const BALANCE_ARM=new THREE.Group();BALANCE_ARM.position.y=1.97;BALANCE_RIG.add(BALANCE_ARM);
KIT.rod(V3(-0.40,0,0),V3(0.40,0,0),0.018,MAT.chrome,BALANCE_ARM);
const BALANCE_WEIGHTS=[];
for(const side of [-1,1]){
  const pan=new THREE.Group();pan.position.set(side*0.39,-0.42,0);BALANCE_ARM.add(pan);
  for(const z of [-0.09,0.09])KIT.rod(V3(-0.10,0,z),V3(0,0.42,0),0.005,MAT.brass,pan);
  KIT.mesh(new THREE.CylinderGeometry(0.17,0.12,0.035,20),MAT.brass,pan);
  const weights=[];
  for(let k=0;k<PHYS.RANGE.nWeights[1];k++)weights.push(KIT.mesh(new THREE.CylinderGeometry(0.073,0.08,0.045,12),side<0?weightMaterial:MAT.chrome,pan,0,0.045+k*0.05,0));
  BALANCE_WEIGHTS.push(weights);
}
const MASS_RAIL=KIT.ledSlider(BALANCE_RIG,0,1.15,0.27,0.75);
PHYS.DETENTS.nWeights.forEach(d=>{for(let k=0;k<d.nWeights;k++)KIT.ball(0.007,MAT.brass,BALANCE_RIG,-0.375+d.x*0.75+(k-(d.nWeights-1)/2)*0.013,1.05,0.28,0);});


for(const x of [-0.19,0.19])KIT.rod(V3(x,1.0,-0.12),V3(x,2.86,-0.12),0.016,MAT.chrome,JUMP_RIG);
KIT.roundedPanel(0.48,0.05,0.27,MAT.graphite,JUMP_RIG,0,2.86,-0.06);
for(let k=0;k<=12;k++){const y=PHYS.VIEW.jumpBase+k/12*PHYS.C.jumpViewMax*PHYS.VIEW.jumpScale;KIT.line([V3(-0.18,y,0),V3(k%4?-0.12:-0.08,y,0)],THEME.chrome,JUMP_RIG);}
const JUMP_BALL=KIT.ball(PHYS.GRAMMAR_VIEW.jumpBallRadius,MAT.glow,JUMP_RIG,0,PHYS.VIEW.jumpBase,0,2);
const APEX=KIT.mesh(new THREE.TorusGeometry(PHYS.GRAMMAR_VIEW.apexRadius,0.012,6,32),MAT.glow,JUMP_RIG,0,PHYS.VIEW.jumpBase,0);APEX.rotation.x=Math.PI/2;
const JUMP_SIGN=KIT.expansion(JUMP_RIG,0.23,2.92,0.06);
const OPEN_ARROW=new THREE.Group();JUMP_RIG.add(OPEN_ARROW);
KIT.line([V3(-0.05,2.63,0.02),V3(0,2.71,0.02),V3(0.05,2.63,0.02)],inkConfig().diagram.mint,OPEN_ARROW);
const LEVER=KIT.rod(V3(0.15,0.98,0.18),V3(0.24,1.16,0.27),0.018,MAT.brass,JUMP_RIG);
const LEVER_GRIP=KIT.ball(0.065,MAT.graphite,JUMP_RIG,0.24,1.16,0.27,1);

// Device feet replace their former broad mounting plates. Portrait lifts keep
// their existing coordinates; telescopic stakes extend down to the same terrain.
const APPARATUS_CONTACTS=Object.entries({spring:SPRING_RIG,shelf:SHELF_RIG,balance:BALANCE_RIG,jump:JUMP_RIG}).map(([key,rig])=>{
  const c=SCENERY.contacts[key];
  const feet=c.xs.map(x=>{
    const stone=KIT.ball(SCENERY.anchorRadius,contactMaterial,rig,x,0,c.z,0);stone.scale.set(...SCENERY.stoneScale);
    const stake=KIT.mesh(new THREE.CylinderGeometry(SCENERY.stakeRadius,SCENERY.stakeRadius,1,8),MAT.chrome,rig,x,0,c.z);
    GROUND_HARDWARE.push(stone,stake);return {stone,stake};
  });
  const rail=KIT.mesh(new THREE.BoxGeometry(c.width,SCENERY.railThickness,SCENERY.railDepth),MAT.chrome,rig,0,c.y-SCENERY.railThickness/2,c.z);
  SPACE_HARDWARE.push(rail);return {rig,c,feet};
});
function layoutHero(portrait){
  SPRING_RIG.position.set(PHYS.VIEW.springX,portrait?0.85:0,0);
  SHELF_RIG.position.set(PHYS.VIEW.springX,portrait?0.85:0,0);
  BALANCE_RIG.position.set(portrait?-0.25:PHYS.VIEW.balanceX,portrait?-0.05:0,portrait?0.20:0);
  if(portrait){BALANCE_RIG.scale.setScalar(0.82);BALANCE_RIG.position.y=0.14;}else BALANCE_RIG.scale.setScalar(1);
  JUMP_RIG.position.set(portrait?0.67:PHYS.VIEW.jumpX,portrait?0.85:0,0);
  for(const {rig,c,feet} of APPARATUS_CONTACTS){
    const floor=(SCENERY.groundY-rig.position.y)/rig.scale.y;
    for(const {stone,stake} of feet){
      stone.position.y=floor+SCENERY.anchorRadius*SCENERY.stoneLift;
      stake.position.y=(floor+c.y)/2;stake.scale.y=c.y-floor;
    }
  }
}
function updateHero(){
  const i=Math.round(S.body.value),n=Math.round(S.nWeights.value),d=PHYS.sceneState(i,n),spring=PHYS.springState(i,n),jump=PHYS.jumpVisual(i);
  COIL.scale.y=d.springLength;HANGING.position.y=d.springEnd;
  COIL.visible=!spring.broken;
  SPRING_SIGN.scale.setScalar(spring.broken?0.17:0.12);
  HANGING_WEIGHTS.forEach((m,k)=>m.visible=k<n);
  BALANCE_WEIGHTS.forEach(weights=>weights.forEach((m,k)=>m.visible=k<n));
  BALANCE_ARM.rotation.z=0;BALANCE_ARM.position.y=d.unloaded?2.01:1.97;
  FORCE.scale.y=d.springLength-PHYS.VIEW.springRest;FORCE.position.y=PHYS.VIEW.springTop-PHYS.VIEW.springRest;forceMaterial.uniforms.uLevel.value=d.forceLevel;
  FORCE.visible=d.forceLevel>0&&S.layers.force!==false;THROUGH.visible=i===PHYS.C.ids.neutron&&S.layers.force!==false;
  BREAK_SIGN.visible=spring.broken;SPRING_SIGN.visible=spring.exaggerated;JUMP_SIGN.visible=jump.exaggerated;
  CAROUSEL.rotation.y=PHYS.bodySceneAngle(S.body.value);
  SELECTED.forEach((s,k)=>{s.group.visible=k===i;s.material.uniforms.uLevel.value=k===i?d.forceLevel:0;});
  const trial=S.trial;
  const same=trial&&trial.i===i&&trial.nWeights===n;
  JUMP_BALL.position.y=same?PHYS.jumpSceneY(trial.i,S.t.value):PHYS.VIEW.jumpBase;
  APEX.visible=!!same&&d.jumpApex!==null;APEX.position.y=d.jumpApex??PHYS.VIEW.jumpBase;
  OPEN_ARROW.visible=!!same&&jump.event==='no-apex';
  SLIDER.handle.position.x=SLIDER.x-SLIDER.width/2+PHYS.railX(n)*SLIDER.width;
  MASS_RAIL.handle.position.x=MASS_RAIL.x-MASS_RAIL.width/2+PHYS.railX(n)*MASS_RAIL.width;
  DIAL.knob.rotation.z=-PHYS.bodyRailX(i)*Math.PI*1.7;
  if(DIAL.arc.userData.body!==i){
    const u=PHYS.bodyRailX(i);DIAL.arc.geometry.dispose();
    DIAL.arc.geometry=new THREE.TorusGeometry(0.18,0.008,6,Math.max(6,Math.ceil(u*96)),Math.max(0.02,u*Math.PI*1.7));
    DIAL.arc.userData.body=i;
  }
  SOUND_SWITCH.rotation.z=S.sound.target?-0.35:0.35;
  syncUI();
}
