const M=PHYS.SCENE;
KIT.roundedPanel(M.platformWidth,.09,M.platformDepth,MAT.brass,HERO,0,M.top+.055,0,.03);
KIT.roundedPanel(M.platformWidth-.08,.025,M.platformDepth-.08,MAT.navy,HERO,0,M.padY-.015,0,.012);
for(const x of [-1.56,1.56])for(const z of [-.33,.33])KIT.screw(HERO,x,M.padY,z);
// Open launch support ring; the plumes remain visible through the central aperture.
const SUPPORT=new THREE.Group();SUPPORT.position.set(M.rocketX,M.padY+.06,0);HERO.add(SUPPORT);
const supportMaterial=new THREE.MeshStandardMaterial({color:THEME.support,emissive:THEME.support,emissiveIntensity:.15,metalness:.6,roughness:.5});
KIT.mesh(new THREE.TorusGeometry(.30,.025,8,32).rotateX(Math.PI/2),supportMaterial,SUPPORT);
for(const x of [-.23,.23])KIT.rod(V3(x,-.015,-.1),V3(x,.12,-.1),.025,MAT.chrome,SUPPORT);
const ROCKET=new THREE.Group();ROCKET.scale.setScalar(PHYS.DISPLAY.rocketScale);HERO.add(ROCKET);
// Rear half-shell leaves the front tank cross-section open toward the camera.
const shell=KIT.mesh(new THREE.CylinderGeometry(M.radius,M.radius,M.bodyHeight,20,1,true,Math.PI/2,Math.PI),MAT.ceramic,ROCKET,0,M.bodyHeight/2,0);
const tankGlass=new THREE.MeshPhysicalMaterial({color:THEME.cool,roughness:.16,transparent:true,opacity:.15,depthWrite:false,side:THREE.DoubleSide});
KIT.mesh(new THREE.CylinderGeometry(M.radius*.96,M.radius*.96,M.bodyHeight,20,1,true,-Math.PI/2,Math.PI),tankGlass,ROCKET,0,M.bodyHeight/2,0);
for(const y of [0,.20,.41,M.bodyHeight])KIT.mesh(new THREE.TorusGeometry(M.radius+.003,.012,6,24).rotateX(Math.PI/2),MAT.brass,ROCKET,0,y,0);
KIT.mesh(new THREE.ConeGeometry(M.radius,M.noseHeight,12),MAT.ceramic,ROCKET,0,M.bodyHeight+M.noseHeight/2,0);
KIT.rod(V3(0,M.bodyHeight+M.noseHeight,0),V3(0,M.bodyHeight+M.noseHeight+.055,0),.009,MAT.chrome,ROCKET);
for(let i=0;i<4;i++){
 const fin=KIT.roundedPanel(.12,.24,.028,MAT.navy,ROCKET,0,.06,0,.01),a=i*Math.PI/2;
 fin.position.x=Math.sin(a)*.19;fin.position.z=Math.cos(a)*.19;fin.rotation.y=a;fin.rotation.z=.14*Math.sin(a);
}
const fuelMaterial=new THREE.ShaderMaterial({uniforms:{uColor:{value:new THREE.Color(THEME.speed)},uFlow:{value:0}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform vec3 uColor;uniform float uFlow;varying vec2 vUv;void main(){float stripe=pow(.5+.5*sin(vUv.y*35.+uFlow*4.),12.);gl_FragColor=vec4(uColor*(.5+stripe*.4),.76);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,transparent:true,depthWrite:false});
const FUEL=KIT.mesh(new THREE.CylinderGeometry(M.radius*.82,M.radius*.82,1,16),fuelMaterial,ROCKET);
const CARGO=KIT.roundedPanel(.20,.22,.20,MAT.brass,ROCKET,.29,.47,.02,.025);
KIT.roundedPanel(.28,.025,.27,MAT.chrome,ROCKET,.29,.35,.02);
const flameMaterial=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uStrength:{value:0},uColor:{value:new THREE.Color(THEME.thrust)}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform float uTime;uniform float uStrength;uniform vec3 uColor;varying vec2 vUv;void main(){float core=pow(1.-abs(vUv.x*2.-1.),2.);float diamond=pow(max(0.,cos(vUv.y*48.-uTime*2.)-abs(vUv.x*2.-1.)),3.);float streak=.6+.4*sin(vUv.y*60.-uTime*18.+vUv.x*12.);float tip=smoothstep(0.,.2,vUv.y);gl_FragColor=vec4((uColor*(1.3+core)+vec3(.9,.75,1.)*diamond*2.)*uStrength,core*tip*(.55+.35*streak));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
const NOZZLES=[],PLUMES=[],RACK=[];
const nozzlePositions=[[0,.12],[-.16,.05],[.16,.05],[-.08,-.13],[.08,-.13]];
nozzlePositions.forEach(([x,z],i)=>{
 const bell=KIT.mesh(new THREE.CylinderGeometry(.035,.063,.12,12,1,true),MAT.chrome,ROCKET,x,-.06,z);NOZZLES.push(bell);
 const plume=new THREE.Group();plume.position.set(x,-.12,z);ROCKET.add(plume);
 for(const angle of [0,Math.PI/2]){const p=KIT.mesh(new THREE.PlaneGeometry(.11,.20).translate(0,-.10,0),flameMaterial.clone(),plume);p.material.uniforms.uTime.value=i*.71;p.rotation.y=angle;p.castShadow=false;}PLUMES.push(plume);
 const spare=KIT.mesh(new THREE.CylinderGeometry(.035,.063,.12,12,1,true),MAT.chrome,HERO,-1.5+i*.14,1.24,.03);RACK.push(spare);
});
KIT.roundedPanel(.83,.08,.33,MAT.graphite,HERO,-1.22,1.11,.03);
KIT.rod(V3(-1.60,1.35,.03),V3(-.85,1.35,.03),.012,MAT.brass,HERO);
const ENGINE_HANDLE=KIT.ball(.065,MAT.glow,HERO,-1.60,1.35,.03,1);
for(const d of PHYS.DETENTS.engines)KIT.ball(.012,MAT.brass,HERO,-1.60+d.x*.75,1.35,.03,0);
// Height pillar with countable marks, compressed altitude sign and live carriage.
KIT.roundedPanel(.22,M.towerTop-M.padY,.18,MAT.graphite,HERO,M.towerX,(M.towerTop+M.padY)/2,-.12);
for(let i=0;i<=16;i++)KIT.rod(V3(M.towerX-.06,M.padY+i*(M.towerTop-M.padY)/16,-.045),V3(M.towerX+(i%4?.015:.06),M.padY+i*(M.towerTop-M.padY)/16,-.045),.010,MAT.brass,HERO);
const HEIGHT_CURSOR=KIT.roundedPanel(.22,.04,.08,MAT.glow,HERO,M.towerX,1.18,-.03);
const HEIGHT_EXPANSION=KIT.expansion(HERO,M.towerX,3.04,.03);HEIGHT_EXPANSION.scale.setScalar(.14);KIT.expansion(HERO,-.67,1.10,.18);
// Cargo samples and two textured-by-geometry gravity specimens share the toolbar choices.
const LOAD_SAMPLES=[];
PHYS.DETENTS.load.forEach((d,i)=>{
 const base=KIT.roundedPanel(.20,.035,.24,MAT.chrome,HERO,1.05+i*.23,1.02,.13);
 if(i)KIT.roundedPanel(.12+i*.035,.10+i*.06,.12+i*.035,MAT.brass,base,0,.10+i*.03,0);
 LOAD_SAMPLES.push(base);
});
const GLOBES=[];
PHYS.DETENTS.g.forEach((d,i)=>{
 const group=new THREE.Group();group.position.set(1.12+i*.39,1.36,-.12);HERO.add(group);
 KIT.rod(V3(0,-.29,0),V3(0,-.08,0),.014,MAT.brass,group);
 KIT.ball(i?.095:.12,i?MAT.ceramic:MAT.navy,group,0,0,0,1);
 if(!i){for(let j=0;j<7;j++){const a=j*2.4;KIT.ball(.036,MAT.glow,group,Math.sin(a)*.09,Math.cos(a)*.08,.06,0);}}
 else{for(let j=0;j<4;j++)KIT.mesh(new THREE.TorusGeometry(.019,.004,4,8),MAT.graphite,group,(j%2-.5)*.08,(Math.floor(j/2)-.5)*.08,.084);}
 GLOBES.push(group);
});
const rocketLight=new THREE.PointLight(THEME.thrust,.2,1.5);ROCKET.add(rocketLight);rocketLight.position.set(0,-.1,.1);
let phenomenonTime=0;
function updateHero(){
 const {n,load,g}=selection(),v=PHYS.grammarValues(n,load,g,S.t.value,!!S.ignited.target);
 ROCKET.position.set(M.rocketX,M.rocketBase+v.displayLift,0);
 FUEL.visible=S.layers.fuel!==false&&v.fuel>1e-7;FUEL.scale.y=M.bodyHeight*v.fuel;FUEL.position.y=M.bodyHeight*v.fuel/2;
 fuelMaterial.uniforms.uFlow.value=phenomenonTime*v.flow;
 CARGO.visible=load>0;CARGO.scale.setScalar(v.loadSize);
 NOZZLES.forEach((o,i)=>{o.visible=i<n;PLUMES[i].visible=i<n&&v.flame>0;PLUMES[i].scale.y=v.plumeLength/.20;PLUMES[i].children.forEach((p,j)=>{p.material.uniforms.uTime.value=phenomenonTime+i*.71+j*.13;p.material.uniforms.uStrength.value=v.flame*(.65+v.brightness*.55);});RACK[i].visible=i<n;});
 flameMaterial.uniforms.uTime.value=S.t.value;flameMaterial.uniforms.uStrength.value=v.flame;
 rocketLight.intensity=.32*v.flame;HEIGHT_CURSOR.position.y=M.rocketBase+v.displayLift;
 supportMaterial.emissiveIntensity=.12+.50*v.normal/(PHYS.m0(load)*g);
 const u=PHYS.engineRailX(n);ENGINE_HANDLE.position.x=-1.60+u*.75;SLIDER.handle.position.x=SLIDER.x+(u-.5)*SLIDER.width;
 DIAL.knob.rotation.z=(.75-u*1.5)*Math.PI;DIAL.arc.material.uniforms.uFill.value=n/PHYS.C.engineMax;
 PLAY_GLYPH.visible=!!S.playing.target;PLAY_TRIANGLE.visible=!S.playing.target;
 GRAVITY_SWITCH.rotation.z=PHYS.gRailX(g)*-.5;
 GLOBES.forEach((o,i)=>o.scale.setScalar(i===PHYS.gRailX(g)?1.12:.9));
 syncUI();
}

// Console curves are independent of quest grammar switches.
drawGraphs=function(){
 const {n,load,g}=selection(),t=S.t.value,ignited=!!S.ignited.target;
 const key=[n,load,g,t.toFixed(3),ignited].join(':');if(S.graphKeys[1]===key)return;S.graphKeys[1]=key;
 const horizon=PHYS.grammarHorizon(n,load,g),tb=PHYS.burnTime(n),observed=ignited?Math.min(t,horizon):0;
 const times=Array.from({length:161},(_,i)=>horizon*i/160);times.push(tb-1e-7,tb,observed);times.sort((a,b)=>a-b);
 const data=times.filter(x=>x<=horizon).map(x=>PHYS.stateAt(n,load,g,x));
 const vmax=Math.max(1,...data.map(s=>Math.abs(s.v))),fmax=Math.max(PHYS.m0(load)*g,PHYS.thrust(n));
 for(const [index,screen]of GRAPHS.entries()){
  const c=screen.ctx,{width:w,height:h,left:L,right:R,top:U,bottom:B}=PHYS.SCENE.graph;
  c.fillStyle=css(THEME.screen);c.fillRect(0,0,w,h);c.strokeStyle=css(THEME.grid);c.lineWidth=2;
  for(let i=0;i<=8;i++){const x=L+(R-L)*i/8;c.beginPath();c.moveTo(x,U);c.lineTo(x,B);c.stroke();}
  for(let i=0;i<=4;i++){const y=U+(B-U)*i/4;c.beginPath();c.moveTo(L,y);c.lineTo(R,y);c.stroke();}
  const X=x=>L+x/horizon*(R-L),Y=y=>index?(U+B)/2-y/vmax*(B-U)*.45:B-y/fmax*(B-U)*.9;
  for(const [field,color]of index?[['v',THEME.speed]]:[['T',THEME.thrust],['W',THEME.weight],['normal',THEME.support]]){
   for(const predicted of [true,false]){
    c.setLineDash(predicted?[9,7]:[]);c.globalAlpha=predicted?.45:1;c.lineWidth=predicted?3:5;c.strokeStyle=css(color);c.beginPath();let prior=null;
    for(const s of data){if(!predicted&&(!ignited||s.t>observed))break;
     if(prior===null||(['T','normal'].includes(field)&&prior<tb&&s.t>=tb))c.moveTo(X(s.t),Y(s[field]));else c.lineTo(X(s.t),Y(s[field]));prior=s.t;
    }c.stroke();
   }
   c.setLineDash([]);c.globalAlpha=1;const current=PHYS.stateAt(n,load,g,observed);
   const value=!ignited&&field==='T'?0:!ignited&&field==='normal'?current.W:current[field];
   c.fillStyle=css(color);c.beginPath();c.arc(X(observed),Y(value),6,0,Math.PI*2);c.fill();
  }
  c.setLineDash([]);c.globalAlpha=.75;c.strokeStyle=css(THEME.ceramic);c.lineWidth=2;
  c.beginPath();c.moveTo(X(observed),U);c.lineTo(X(observed),B);c.stroke();c.globalAlpha=1;
  c.strokeStyle=css(THEME.chrome);c.lineWidth=3;c.beginPath();c.arc(742,235,10,0,Math.PI*2);c.moveTo(742,228);c.lineTo(742,235);c.lineTo(748,238);c.stroke();
  screen.tex.needsUpdate=true;
 }
};
