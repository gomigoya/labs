const SPECIES_KEYS=Object.keys(PHYS.SPECIES), GROUND_VALUES=Object.values(PHYS.GROUNDS);
const TRACK=new THREE.Group();HERO.add(TRACK);
KIT.roundedPanel(PHYS.DRAMA.width,.32,PHYS.DRAMA.depth,MAT.brass,TRACK,0,PHYS.SCENE.top-.07,0,.03);
const groundColors=[THEME.glass,THEME.sand,THEME.gravel,THEME.asphalt];
const CASSETTES=GROUND_VALUES.map((mu,i)=>{
 const g=new THREE.Group();TRACK.add(g);
 const m=new THREE.MeshPhysicalMaterial({color:groundColors[i],roughness:i===0?.08:.95,metalness:i===0?.15:0,transparent:i===0,opacity:i===0?.65:1});
 KIT.roundedPanel(PHYS.DRAMA.width-.14,.07,PHYS.DRAMA.depth-.14,m,g,0,PHYS.SCENE.top+.106,0,.018);
 const surface=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uMu:{value:mu},uKind:{value:i},uBloom:{value:1},uColor:{value:new THREE.Color(groundColors[i])}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform float uTime,uMu,uKind,uBloom;uniform vec3 uColor;varying vec2 vUv;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){vec2 p=vUv*vec2(140.,26.);float n=hash(floor(p));float pattern;
 if(uKind<.5){pattern=.76+.24*pow(max(0.,sin(vUv.x*32.+vUv.y*17.+uTime*.5)),24.);}
 else if(uKind<1.5){pattern=.65+.25*sin(p.y+sin(p.x*.2)*2.)+.1*n;}
 else if(uKind<2.5){pattern=.42+.58*step(.35,n)*smoothstep(.1,.4,length(fract(p*.45)-.5));}
 else{pattern=.38+.45*n+.17*hash(floor(p*3.));}
 gl_FragColor=vec4(uColor*pattern*(1.+uMu*.1)*uBloom,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,side:THREE.DoubleSide});surface.userData.bloom=false;
 const surf=KIT.mesh(new THREE.PlaneGeometry(PHYS.DRAMA.width-.14,PHYS.DRAMA.depth-.14).rotateX(-Math.PI/2),surface,g,0,PHYS.SCENE.top+.126,0);surf.castShadow=false;g.userData.surface=surface;
 // Fixed seeded grains; surface is a schematic material sample, not a microphysical model.
 if(i){const grains=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(i===2?.028:.012,0),MAT[i===2?'bone':'rubber'],PHYS.VIS.grains),dummy=new THREE.Object3D();
  for(let j=0;j<PHYS.VIS.grains;j++){dummy.position.set((rand()-.5)*(PHYS.DRAMA.width-.3),PHYS.SCENE.top+.13,(rand()-.5)*(PHYS.DRAMA.depth-.3));dummy.scale.set(1,i===2?.5:.25,1);dummy.updateMatrix();grains.setMatrixAt(j,dummy.matrix);}grains.castShadow=true;grains.receiveShadow=true;g.add(grains);g.userData.grains=grains;}
 KIT.roundedPanel(.26,.09,.30,MAT.chrome,g,PHYS.DRAMA.width/2,PHYS.SCENE.top+.10,.26);
 return g;
});
for(const x of [-PHYS.DRAMA.width/2+.1,PHYS.DRAMA.width/2-.1])KIT.rod(V3(x,PHYS.SCENE.top+.14,-1),V3(x,PHYS.SCENE.top+.14,1),.025,MAT.brass,TRACK);
// Shared instanced anatomy: a child's profile stays legible even at the maximum team.
const kidMat=new THREE.MeshStandardMaterial({color:THEME.kids,roughness:.72,flatShading:true});
const skinMat=new THREE.MeshStandardMaterial({color:THEME.bone,roughness:.85,flatShading:true});
const bandMat=new THREE.MeshStandardMaterial({color:THEME.brass,roughness:.4});
const kidParts=[];
const kidShadowMat=new THREE.MeshBasicMaterial({color:0x171e21,transparent:true,opacity:.32,depthWrite:false});
for(const [geometry,material] of [
 [new THREE.CapsuleGeometry(.045,.16,3,6).rotateZ(.18).translate(-.026,.255,0),kidMat],
 [new THREE.IcosahedronGeometry(.055,1).translate(-.058,PHYS.DRAMA.kidHeight-.055,0),skinMat],
 [new THREE.CylinderGeometry(.048,.048,.025,6).rotateZ(.18).translate(-.026,.29,0),bandMat],
 [new THREE.CircleGeometry(.105,12).rotateX(-Math.PI/2).translate(0,.003,0),kidShadowMat]]){
 const mesh=new THREE.InstancedMesh(geometry,material,PHYS.C.kidsMax);mesh.castShadow=material!==kidShadowMat;mesh.receiveShadow=true;mesh.frustumCulled=false;HERO.add(mesh);kidParts.push(mesh);
}
// Bent elbows and split feet, with both hands reaching towards the horizontal rope.
for(const z of [-.044,.044])for(const [a,b,r] of [
 [V3(-.045,.34,z),V3(.055,.27,z),.018],[V3(.055,.27,z),V3(.13,.29,0),.016],
 [V3(-.01,.17,z),V3(-.065,.035,z),.021],[V3(-.065,.035,z),V3(.015,.025,z),.023]]){
 const delta=b.clone().sub(a),geometry=new THREE.CylinderGeometry(r,r,delta.length(),6);
 geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0,1,0),delta.normalize()));geometry.translate(...a.clone().add(b).multiplyScalar(.5).toArray());
 const mesh=new THREE.InstancedMesh(geometry,kidMat,PHYS.C.kidsMax);mesh.castShadow=true;mesh.frustumCulled=false;HERO.add(mesh);kidParts.push(mesh);
}
const kidDummy=new THREE.Object3D();
for(const z of [.72,.80])KIT.rod(V3(PHYS.SCENE.railStart,PHYS.SCENE.railY,z),V3(PHYS.railWorldX(1),PHYS.SCENE.railY,z),.012,MAT.brass,HERO);
for(const d of PHYS.DETENTS)KIT.rod(V3(PHYS.railWorldX(d.x),PHYS.SCENE.railY,.80),V3(PHYS.railWorldX(d.x),PHYS.SCENE.railY,.86),.006,MAT.glow,HERO);
const RAIL_HANDLE=KIT.roundedPanel(.14,.14,.17,MAT.chrome,HERO,PHYS.railWorldX(PHYS.railX(1)),PHYS.SCENE.railY,.76,.035);
KIT.ball(.038,MAT.glow,RAIL_HANDLE,0,.09,0,1);
// Estimated exhibition anatomy, in the original PHYS form units; no size mapping changes.
// All species decisions live here. Unchanged quadruped axial anatomy retains the R5 forms.
const DINO_SHAPES=[
 {name:'velociraptor',biped:true,body:[1,.82,.72],head:[.36,.15,.15],neckRadius:.09,tail:1.2,tailRadius:.13,stance:.13,spread:.21,thigh:.095,shin:.042,foot:[.27,.08,.14],arm:[.23,.026]},
 {name:'dilophosaurus',biped:true,body:[1,.88,.82],head:[.38,.17,.17],neckRadius:.11,tail:1.2,tailRadius:.15,stance:.14,spread:.22,thigh:.12,shin:.048,foot:[.29,.09,.16],arm:[.23,.026],crest:true},
 {name:'stegosaurus',body:[1,1,1],legX:[-.32,.32],stance:.09,spread:.22,thigh:.075,shin:.075,foot:[.27,.12,.14],plates:7},
 {name:'triceratops',body:[1,1,1],legX:[-.32,.32],stance:.09,spread:.22,thigh:.075,shin:.075,foot:[.27,.12,.14],horns:true},
 {name:'tyrannosaurus',biped:true,body:[1,.64,1],head:[.38,.23,.27],neckRadius:.15,tail:1.2,tailRadius:.22,stance:.18,spread:.25,thigh:.17,shin:.065,foot:[.36,.10,.20],arm:[.12,.028]},
 {name:'argentinosaurus',body:[1,1,1],legX:[-.32,.32],stance:0,spread:.19,thigh:.075,shin:.075,foot:[.27,.12,.14],longNeck:true}
];
// Faceted rectangular wedge: broad rear skull, shallower/narrower muzzle at negative X.
function dinoWedge(length,height,width,material,parent,x,y,z,name){
 const vertices=[];
 for(const [xx,hh,ww] of [[-length/2,height*.68,width*.72],[length/2,height,width]])
  for(const [yy,zz] of [[-1,-1],[-1,1],[1,-1],[1,1]])vertices.push(xx,yy*hh/2,zz*ww/2);
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setIndex([0,2,1,1,2,3,4,5,6,5,7,6,0,1,4,1,5,4,2,6,3,3,6,7,0,4,2,2,4,6,1,3,5,3,7,5].reverse());
 const flat=geometry.toNonIndexed();geometry.dispose();flat.computeVertexNormals();
 const mesh=KIT.mesh(flat,material,parent,x,y,z);mesh.name=name;return mesh;
}
function dinoSegment(a,b,r0,r1,material,parent,name){
 const mesh=KIT.mesh(new THREE.CylinderGeometry(r1,r0,1,7),material,parent);mesh.name=name;
 fitDinoSegment(mesh,a,b);return mesh;
}
function fitDinoSegment(mesh,a,b){
 const delta=b.clone().sub(a);mesh.position.copy(a).add(b).multiplyScalar(.5);
 mesh.scale.y=delta.length();mesh.quaternion.setFromUnitVectors(V3(0,1,0),delta.normalize());
}
const DINO_MODELS=SPECIES_KEYS.map((s,i)=>{
 const scale=PHYS.dramaState(59,s,GROUND_VALUES[2]).scale,f=PHYS.SCENE.forms[i],shape=DINO_SHAPES[i];
 const g=new THREE.Group();g.name=shape.name;g.position.set(PHYS.DRAMA.dinoX,PHYS.DRAMA.ground,PHYS.DRAMA.dinoZ);g.scale.set(scale*PHYS.DRAMA.dinoStretch,scale,scale);HERO.add(g);
 const torso=new THREE.Group();torso.name='torso-pivot';g.add(torso);
 const m=new THREE.MeshStandardMaterial({color:THEME.dino,roughness:.72,flatShading:true});
 const ell=(x,y,z,a,b,c,name)=>{const o=KIT.ball(1,m,torso,x,y,z,1);o.scale.set(a,b,c);o.name=name;return o;};
 const [length,height,leg,neck,head,tail]=f,bodyY=leg+height/2;
 const body=ell(0,bodyY,0,length*shape.body[0]/2,height*shape.body[1]/2,.25*shape.body[2],'body');
 if(shape.biped)body.rotation.z=.06; // Facing -X: chest slightly below hips.
 let neckTop;
 if(shape.biped){
  const points=[V3(-length*.30,bodyY+.01,0),V3(-length*.43,bodyY+neck*.36,0),V3(-length*.42,bodyY+neck*.82,0),V3(-length*.55,bodyY+neck,0)];
  points.slice(1).forEach((p,j)=>dinoSegment(points[j],p,shape.neckRadius*(1-j*.10),shape.neckRadius*(.9-j*.10),m,torso,`neck-${j}`));
  neckTop=points.at(-1);
  const [hl,hh,hw]=shape.head.map(v=>v*length),hx=neckTop.x-hl*.34,hy=neckTop.y+.07;
  dinoWedge(hl,hh*.70,hw,m,torso,hx,hy+hh*.12,0,'skull-wedge');
  dinoWedge(hl*.94,hh*.32,hw*.94,m,torso,hx-.008,hy-hh*.40,0,'lower-jaw');
  const start=V3(length*.30,bodyY,0),span=length*shape.tail;
  const pointsTail=[start,V3(start.x+span*.34,bodyY-.015,0),V3(start.x+span*.72,bodyY-.045,0),V3(start.x+span,bodyY-.08,0)];
  const radii=[shape.tailRadius,shape.tailRadius*.64,shape.tailRadius*.28,.012];
  pointsTail.slice(1).forEach((p,j)=>dinoSegment(pointsTail[j],p,radii[j],radii[j+1],m,torso,`tail-${j}`));
 }else{
  const tailA=V3(length*.34,bodyY,0),tailB=V3(length*.45+tail,leg+.12,0);
  dinoSegment(tailA,tailB,shape.longNeck?.14:.10,.012,m,torso,'tail');
  const neckBase=V3(-length*.35,bodyY+.02,0);neckTop=V3(-length*.49-.16,bodyY+neck,0);
  KIT.rod(neckBase,neckTop,shape.longNeck?.10:.13,m,torso).name='neck';
  ell(neckTop.x-head*.33,neckTop.y+.07,0,head*.6,.13,.14,'head');
 }
 // Feet/shadows are siblings of the leaning torso. Staggering reveals both sides in profile.
 const limbs=[];
 for(const x of shape.legX||[.15])for(const side of [-1,1]){
  const z=side*shape.spread,offset=side*shape.stance,hip=V3(x+offset,bodyY-.08,z);
  const ankle=V3(x+.06+offset,shape.foot[1],z),footX=x-.03+offset;
  const label=`leg-${x}-${side}`,knee=V3(hip.x-.13,leg*.53,z);
  if(shape.biped){
   const upper=dinoSegment(hip,knee,shape.thigh,shape.thigh*.67,m,g,label+'-thigh');
   const lower=dinoSegment(knee,ankle,shape.shin,shape.shin*.8,m,g,label+'-shin');
   limbs.push({hip,ankle,knee,upper,lower});
   KIT.mesh(new THREE.BoxGeometry(shape.foot[0]*.40,shape.foot[1],shape.foot[2]),m,g,footX+.03,shape.foot[1]/2,z).name=label+'-heel';
   for(const toe of [-1,0,1]){
    const t=KIT.mesh(new THREE.BoxGeometry(shape.foot[0]*.75,shape.foot[1]*.55,shape.foot[2]*.22),m,g,footX-shape.foot[0]*.25,shape.foot[1]*.275,z+toe*shape.foot[2]*.38);
    t.rotation.y=toe*.14;t.name=label+`-toe-${toe}`;
   }
  }else{
   const upper=KIT.rod(hip,ankle,shape.thigh,m,g);upper.name=label;
   // Unit-length geometry lets the same attachment routine follow torso lean.
   upper.geometry.dispose();upper.geometry=new THREE.CylinderGeometry(shape.thigh,shape.thigh,1,12);
   limbs.push({hip,ankle,upper});
   KIT.roundedPanel(...shape.foot,m,g,footX,shape.foot[1]/2,z,.035).name=label+'-foot';
  }
  const shadow=KIT.mesh(new THREE.CircleGeometry(.20,16).rotateX(-Math.PI/2),kidShadowMat,g,footX,.002,z);shadow.scale.set(1,.55,1);shadow.castShadow=false;shadow.name=label+'-contact-shadow';
 }
 if(shape.crest)for(const z of [-.07,.07])KIT.mesh(new THREE.ConeGeometry(.11,.22,4),MAT.bone,torso,neckTop.x,neckTop.y+.25,z).name='crest';
 if(shape.plates)for(let j=0;j<shape.plates;j++){const x=-.43+j*.16;const p=KIT.mesh(new THREE.ConeGeometry(.13,.32,4),MAT.bone,torso,x,bodyY+height*.45+.12,0);p.rotation.y=Math.PI/4;p.name='back-plate';}
 if(shape.horns){ell(-.45,bodyY+.16,0,.10,.35,.34,'frill');for(const z of [-.12,.12]){const horn=KIT.mesh(new THREE.ConeGeometry(.05,.34,6),MAT.bone,torso,neckTop.x-.24,neckTop.y+.19,z);horn.rotation.z=.85;horn.name='brow-horn';}KIT.rod(V3(neckTop.x-.32,neckTop.y+.09,0),V3(neckTop.x-.49,neckTop.y+.17,0),.03,MAT.bone,torso).name='nose-horn';}
 if(shape.arm)for(const side of [-1,1]){
  const z=side*.22,a=V3(-.25,bodyY+.05,z),b=V3(-.34,bodyY-shape.arm[0]*.65,z),c=V3(-.43,bodyY-shape.arm[0],z);
  dinoSegment(a,b,shape.arm[1],shape.arm[1]*.8,m,torso,'tiny-arm-upper');
  dinoSegment(b,c,shape.arm[1]*.8,shape.arm[1]*.6,m,torso,'tiny-arm-fore');
 }
 for(const child of torso.children)child.position.y-=bodyY;torso.position.y=bodyY;
 // Keep runtime attachments off userData so comparison clones contain only serializable data.
 g.pose=lean=>{
  torso.rotation.z=lean;
  for(const limb of limbs){
   const hip=limb.hip.clone().sub(V3(0,bodyY,0)).applyAxisAngle(V3(0,0,1),lean).add(V3(0,bodyY,0));
   if(limb.lower){
    const knee=limb.knee.clone().add(hip.clone().sub(limb.hip).multiplyScalar(.5));
    fitDinoSegment(limb.upper,hip,knee);fitDinoSegment(limb.lower,knee,limb.ankle);
   }else fitDinoSegment(limb.upper,hip,limb.ankle);
  }
 };
 g.pose(0);return g;
});
// Two endpoint specimens sit above the ratio graph; they share the existing anatomy geometry.
for(const [j,i] of [0,5].entries()){
 const g=DINO_MODELS[i].clone(true);g.position.set(-.25+j*.95,PHYS.SCENE.top+.01,1.07);g.scale.multiplyScalar(PHYS.SCENE.comparisonScale);CONSOLE.add(g);
 KIT.roundedPanel(.54,.025,.25,MAT.brass,CONSOLE,-.20+j*.95,PHYS.SCENE.top,1.06);
}
KIT.expansion(CONSOLE,1.10,1.18,1.12);
// Kid-height comparison post; conversion is PHYS.C.kidHeight times the display scale.
const stakeHeight=PHYS.DRAMA.kidHeight;
KIT.rod(V3(2.77,PHYS.SCENE.top+.14,-.40),V3(2.77,PHYS.SCENE.top+.14+stakeHeight,-.40),.025,MAT.bone,HERO);
for(let j=0;j<=4;j++)KIT.rod(V3(2.71,PHYS.SCENE.top+.14+stakeHeight*j/4,-.40),V3(2.83,PHYS.SCENE.top+.14+stakeHeight*j/4,-.40),.008,MAT.brass,HERO);
const SIZE_MARK=KIT.expansion(HERO,PHYS.DRAMA.dinoX,3.4,.2);SIZE_MARK.scale.setScalar(.18);
// Horizontal harness: paired uncalibrated knots show tautness, never measured tension.
const ROPE=new THREE.Group();ROPE.position.set(0,PHYS.DRAMA.ropeY,.08);HERO.add(ROPE);
KIT.rod(V3(-4.5,0,0),V3(PHYS.DRAMA.dinoX,0,0),.05,MAT.bone,ROPE);
const TEAM_ROPES=[0,1,2].map(row=>KIT.rod(V3(PHYS.DRAMA.kidStart,0,-.86+row*PHYS.DRAMA.rowGap),V3(-.25,0,-.86+row*PHYS.DRAMA.rowGap),.025,MAT.bone,ROPE));
const TEAM_JOINS=[0,1,2].map(row=>KIT.rod(V3(-.25,0,-.86+row*PHYS.DRAMA.rowGap),V3(.12,0,0),.025,MAT.bone,ROPE));
const harness=KIT.mesh(new THREE.TorusGeometry(.17,.028,6,16),MAT.brass,HERO,PHYS.DRAMA.dinoX,PHYS.DRAMA.ropeY,PHYS.DRAMA.dinoZ);harness.rotation.y=Math.PI/2;
const FLAG=new THREE.Group();FLAG.scale.setScalar(1.7);ROPE.add(FLAG);
KIT.rod(V3(0,-.13,0),V3(0,.27,0),.018,MAT.brass,FLAG);
KIT.roundedPanel(.24,.22,.032,MAT.glow,FLAG,.12,.24,0,.008);
const FORCE_KNOTS=Array.from({length:8},(_,i)=>{const x=(i<4?-1:1)*(.32+(i%4)*.20),k=KIT.ball(PHYS.DRAMA.beadRadius,MAT.brass,ROPE,x,0,0,1);k.userData.x=x;return k;});
for(let i=-4;i<=4;i++)KIT.rod(V3(i*PHYS.DRAMA.flagStep,PHYS.DRAMA.ground,-.15),V3(i*PHYS.DRAMA.flagStep,PHYS.DRAMA.ground,.35),.018,i?MAT.bone:MAT.glow,HERO);
const SLIP_DUST=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.035,0),new THREE.MeshStandardMaterial({color:THEME.sand,transparent:true,opacity:.8}),PHYS.VIS.dustCount);SLIP_DUST.frustumCulled=false;HERO.add(SLIP_DUST);
// R1 basic capacity fills; richer thresholds, beads and contact lens arrive in R2.
const CAPACITIES=new THREE.Group();HERO.add(CAPACITIES);
const BARS=[THEME.kids,THEME.dino].map((color,i)=>{
 const g=new THREE.Group();g.position.set(i? .24:-2.77,.94,1.20);CAPACITIES.add(g);
 KIT.roundedPanel(PHYS.SCENE.barWidth,.13,.06,MAT.graphite,g,PHYS.SCENE.barWidth/2,0,0,.025);
 const material=new THREE.ShaderMaterial({uniforms:{uColor:{value:new THREE.Color(color)},uTime:{value:0},uUnit:{value:1},uStyle:{value:0},uForce:{value:0},uOpacity:{value:1}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
 fragmentShader:`uniform vec3 uColor;uniform float uTime,uUnit,uStyle,uForce,uOpacity;varying vec2 vUv;
 void main(){float edge=1.-smoothstep(.15,.5,abs(vUv.y-.5));
 float cell=step(.12,fract(vUv.x/max(.001,uUnit)));
 float dash=uStyle<.5?1.:step(.35,fract(vUv.x*(uStyle<1.5?40.:19.)));
 float flow=pow(max(0.,sin(vUv.x*75.-uTime*(1.+uForce)*4.)),18.);
 gl_FragColor=vec4(uColor*(1.3+edge+flow*.65),(.55+.25*cell)*dash*uOpacity);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 // Shader chunks must start on their own lines.
 material.fragmentShader=material.fragmentShader.replace(';#include',';\n#include');
 const fill=KIT.mesh(new THREE.PlaneGeometry(1,.072).translate(.5,0,0),material,g,0,0,.035);fill.castShadow=false;
 const sign=KIT.expansion(g,PHYS.SCENE.barWidth+.055,0,.04);
 const cut=KIT.line([V3(-.025,-.06,.041),V3(.005,-.02,.041),V3(-.025,.02,.041),V3(.005,.06,.041)],color,g);cut.position.x=PHYS.SCENE.barWidth-.10;
 return {fill,sign,cut};
});
function updateHero(){
 const n=PHYS.kidsFromRailX(S.u.value),i=Math.round(S.species.value),gi=Math.round(S.ground.value);
 const d=PHYS.dramaState(n,SPECIES_KEYS[i],GROUND_VALUES[gi],S.t.value);
 for(const mesh of kidParts)mesh.count=n;
 for(let k=0;k<n;k++){
  const p=PHYS.dramaChild(n,k);kidDummy.position.set(p.x+d.kidSkid,p.y,p.z);kidDummy.updateMatrix();
  for(const mesh of kidParts)mesh.setMatrixAt(k,kidDummy.matrix);
  kidParts[2].setColorAt(k,new THREE.Color(p.band?THEME.navy:THEME.brass));
 }
 for(const mesh of kidParts)mesh.instanceMatrix.needsUpdate=true;kidParts[2].instanceColor.needsUpdate=true;
 const rows=PHYS.dramaChild(n,0).rows;TEAM_ROPES.forEach((r,j)=>r.visible=j<rows);TEAM_JOINS.forEach((r,j)=>r.visible=j<rows);
 DINO_MODELS.forEach((g,j)=>{g.visible=j===i;if(j===i){g.pose(d.lean);g.position.x=PHYS.DRAMA.dinoX+d.dinoSkid;}});
 SIZE_MARK.position.y=PHYS.DRAMA.ground+d.height+.10;
 CASSETTES.forEach((g,j)=>{g.visible=j===gi;g.position.x=S.cassette.value*.16;g.userData.surface.uniforms.uTime.value=S.t.value;if(g.userData.grains)g.userData.grains.count=S.quality==='low'?PHYS.VIS.grains/2:PHYS.VIS.grains;});
 RAIL_HANDLE.position.x=PHYS.railWorldX(PHYS.railX(n));
 SLIDER.handle.position.x=SLIDER.x+(PHYS.railX(n)-.5)*SLIDER.width;DIAL.knob.rotation.z=-PHYS.railX(n)*Math.PI*1.7;
 FLAG.position.x=d.flagX;
 FORCE_KNOTS.forEach((k,j)=>{k.position.x=k.userData.x+d.flagX*.2;k.position.y=Math.sin((DIRECTOR.eventLeft>0?DIRECTOR.clock*18:S.t.value*30)+j*Math.PI)*d.beadAmplitude;k.scale.setScalar(1+d.effort*.25);});
 const burst=DIRECTOR.eventLeft>0&&d.slip,age=1.4-DIRECTOR.eventLeft;
 SLIP_DUST.visible=burst;SLIP_DUST.material.opacity=Math.max(0,1-age/1.4)*.85;
 for(let k=0;burst&&k<PHYS.VIS.dustCount;k++){
  const a=k*2.399963,r=(.06+age*.46)*(1+k%7/7),footZ=d.winner==='kids'?PHYS.DRAMA.dinoZ+(k%2?-.28:.28):PHYS.dramaChild(n,k%n).z;
  kidDummy.position.set(d.slipX+Math.cos(a)*r,PHYS.DRAMA.ground+.03+Math.sin(Math.min(1,age/1.4)*Math.PI)*(.12+k%5*.045),footZ+Math.sin(a)*r);kidDummy.updateMatrix();SLIP_DUST.setMatrixAt(k,kidDummy.matrix);
 }SLIP_DUST.instanceMatrix.needsUpdate=true;
 const capacity=PHYS.displayState(n,SPECIES_KEYS[i],GROUND_VALUES[gi],S.t.value);
 for(const [j,length]of [capacity.kidsLength,capacity.dinoLength].entries()){
  BARS[j].fill.scale.x=Math.max(.001,length);BARS[j].fill.material.uniforms.uTime.value=S.t.value;BARS[j].fill.material.uniforms.uUnit.value=PHYS.forceGlyph(PHYS.C.kidMuscle).length/Math.max(.001,length);BARS[j].fill.material.uniforms.uForce.value=length/PHYS.VIS.width;const compressed=j?capacity.dinoCompressed:capacity.kidsCompressed;
  BARS[j].sign.visible=compressed;BARS[j].cut.visible=compressed;BARS[j].cut.position.x=Math.max(.03,length-.08);
 }
 SWITCH.rotation.z=S.playing.value*.4-.2;
}
