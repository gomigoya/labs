// All scenery is built here and attached to ROOM. Dimensions are model units,
// art direction estimates rather than a scale model of a real launch facility.
const ENV=Object.freeze({
 ground:{y:PHYS.SCENE.top,width:60,depth:44,z:12},vent:{x:-.28,z:-1.9,width:1.05,depth:2.2},
 terminal:{position:[-1.40,1.045,.36],tilt:-.45,panel:[1.34,.36,.035],stem:[.18,.24],
  dial:{position:[-.46,.015,.035],scale:.52,hit:.105},
  graphs:{xs:[-.10,.39],y:.065,z:.025,width:.40,height:.13},
  slider:{position:[-.04,-.105,.025],width:.56,scale:[1,.5,.6],hitHeight:.085,hitDepth:.10},
  play:{position:[.49,-.105,.055],radius:.047,hit:.065},
  gravity:{position:[-.60,-.125,.05],hit:.045}},
 ocean:{width:80,depth:42,z:-30},shore:{count:18,low:10,z:-9},
 shrubs:{count:44,low:18,z:-8},palms:{count:7,low:4,z:-10},

 tanks:{xs:[-3.8,3.5],z:-3.1,radius:.55},
 towers:{xs:[-4.7,4.7],z:-4.5,height:3.7},
 service:{x:-2.65,z:-2,height:2.7,width:.48,levels:6},
 buildings:{count:4,low:3,z:-7},flags:{count:2,z:-6},
 stripes:{count:32,low:24},tray:{count:18,low:10,z:-1.2},
 wake:{distance:1.1,speed:.08,windX:.32,windZ:-.12}
});
function buildEnvironment(){
 const scenery=new THREE.Group();scenery.position.y=ENV.ground.y;ROOM.add(scenery);
 const rng=mulberry32(701307),dummy=new THREE.Object3D(),batches=[],flags=[];
 const material=(color)=>new THREE.MeshToonMaterial({color,flatShading:true});
 const steel=MAT.steel,sand=material(COAST.sand),green=material(COAST.foliage),yellow=material(COAST.safety);
 // Shared unit geometries and instances keep repeated equipment to one call each.
 const batch=(geometry,mat,poses,low=poses.length)=>{
  const mesh=new THREE.InstancedMesh(geometry,mat,poses.length);mesh.receiveShadow=true;scenery.add(mesh);
  poses.forEach((p,i)=>{dummy.position.set(...p.p);dummy.rotation.set(...(p.r||[0,0,0]));dummy.scale.set(...p.s);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
  mesh.computeBoundingSphere();batches.push({mesh,high:poses.length,low});return mesh;
 };
 const box=new THREE.BoxGeometry(1,1,1),orb=new THREE.IcosahedronGeometry(1,1),bars=[];
 const beam=(a,b,width=.035)=>{
  const start=V3(...a),end=V3(...b),d=end.clone().sub(start);
  dummy.quaternion.setFromUnitVectors(V3(0,1,0),d.clone().normalize());
  bars.push({p:start.add(end).multiplyScalar(.5).toArray(),s:[width,d.length(),width],r:[...new THREE.Euler().setFromQuaternion(dummy.quaternion).toArray().slice(0,3)]});
 };
 // Continuous concrete receives contact shadows; the vent is a flush ground marking.
 const v=ENV.vent,ground=new THREE.Shape();
 const e=ENV.ground,x=e.width/2,near=-e.z-e.depth/2,far=-e.z+e.depth/2;
 ground.moveTo(-x,near);ground.lineTo(x,near);ground.lineTo(x,far);ground.lineTo(-x,far);ground.closePath();
 const groundMesh=KIT.mesh(new THREE.ShapeGeometry(ground).rotateX(-Math.PI/2),MAT.concrete,scenery);
 groundMesh.castShadow=false;groundMesh.receiveShadow=true;
 const ventMark=KIT.mesh(new THREE.PlaneGeometry(v.width,v.depth).rotateX(-Math.PI/2),material(0x25343b),scenery,v.x,.003,v.z);ventMark.castShadow=false;
 batch(box,steel,Array.from({length:ENV.tray.count},(_,i)=>({p:[v.x,.005,v.z-v.depth/2+(i+.5)*v.depth/ENV.tray.count],s:[v.width,.004,.025]})),ENV.tray.low);
 const sea=KIT.mesh(new THREE.PlaneGeometry(ENV.ocean.width,ENV.ocean.depth).rotateX(-Math.PI/2),material(COAST.ocean),scenery,0,-.08,ENV.ocean.z);sea.castShadow=false;
 for(let i=0;i<5;i++)KIT.line([V3(-13+i*.8,-.075,-12-i*2.2),V3(-3+i*.8,-.075,-12-i*2.2)],COAST.wave,scenery,false,.65);
 batch(orb,sand,Array.from({length:ENV.shore.count},(_,i)=>({p:[(i%2?-1:1)*(1+Math.floor(i/2)*2),-.08,ENV.shore.z-rng()*1.8],s:[2.2,.13+rng()*.13,1.1]})),ENV.shore.low);
 batch(orb,green,Array.from({length:ENV.shrubs.count},()=>({p:[(rng()-.5)*30,.13,ENV.shrubs.z-rng()*1.7],s:[.2+rng()*.4,.12+rng()*.2,.28]})),ENV.shrubs.low);
 const trunks=[],fronds=[];
 for(let i=0;i<ENV.palms.count;i++){
  const x=-12+i*3.8,z=ENV.palms.z-rng()*1.4,h=.8+rng()*.65;
  trunks.push({p:[x,h/2,z],s:[.035,h,.035],r:[0,0,-.09]});
  for(let j=0;j<5;j++){const a=j*Math.PI*2/5;fronds.push({p:[x+Math.cos(a)*.23,h,z+Math.sin(a)*.23],s:[.75,.035,.14],r:[0,-a,.15]});}
 }
 batch(box,green,trunks,ENV.palms.low);batch(new THREE.ConeGeometry(1,1,3).rotateZ(-Math.PI/2),green,fronds,ENV.palms.low*5);
 const stripes=[];
 for(let i=0;i<ENV.stripes.count;i++){
  const side=i%2?-1:1,x=-2.6+Math.floor(i/2)*.35;
  stripes.push({p:[x,.008,side<0?-3.6:1.15],s:[.19,.012,.12],r:[0,-.55,0]});
 }
 batch(box,yellow,stripes,ENV.stripes.low);
 batch(box,steel,Array.from({length:ENV.tray.count},(_,i)=>({p:[1.9+i*.22,.005,ENV.tray.z],s:[.035,.004,.32]})),ENV.tray.low);
 for(const z of [ENV.tray.z-.17,ENV.tray.z+.17])batch(box,steel,[{p:[3.85,.005,z],s:[4.1,.004,.018]}]);
 for(const x of ENV.tanks.xs){
  KIT.mesh(new THREE.IcosahedronGeometry(ENV.tanks.radius,2),MAT.concrete,scenery,x,.84,ENV.tanks.z);
  for(const dx of [-.25,.25])beam([x+dx,0,ENV.tanks.z],[x+dx,.5,ENV.tanks.z],.06);
  beam([x,1.38,ENV.tanks.z],[x,1.53,ENV.tanks.z],.04);
 }
 for(const x of ENV.towers.xs){
  const h=ENV.towers.height,z=ENV.towers.z;
  for(const dx of [-.12,.12])beam([x+dx,0,z],[x,h-.5,z],.035);
  beam([x,h-.5,z],[x,h,z],.02);
  for(let j=0;j<6;j++)beam([x-.12,j*.5,z],[x+.12,(j+1)*.5,z],.018);
 }
 const t=ENV.service;
 for(const dx of [-t.width/2,t.width/2])for(const dz of [-.2,.2])beam([t.x+dx,0,t.z+dz],[t.x+dx,t.height,t.z+dz]);
 for(let i=0;i<t.levels;i++){
  const y=i*t.height/t.levels,next=(i+1)*t.height/t.levels;
  for(const dz of [-.2,.2]){beam([t.x-t.width/2,y,t.z+dz],[t.x+t.width/2,next,t.z+dz],.022);beam([t.x+t.width/2,y,t.z+dz],[t.x-t.width/2,next,t.z+dz],.022);}
  beam([t.x-.3,next,t.z],[t.x+.3,next,t.z]);
 }
 beam([t.x,t.height-.25,t.z],[t.x+.8,t.height-.25,t.z],.06);
 batch(box,steel,bars).userData.inkInner=false;
 const buildings=Array.from({length:ENV.buildings.count},(_,i)=>({p:[3.4+i*1.4,.25,ENV.buildings.z-i*.3],s:[1.1,.5+(i%2)*.16,.8]}));
 batch(box,material(COAST.building),buildings,ENV.buildings.low);
 batch(box,steel,[{p:[5,.012,-5.5],s:[15,.018,.7]}]);
 for(let i=0;i<ENV.flags.count;i++){
  const x=2.8+i*3.2,z=ENV.flags.z;
  KIT.mesh(new THREE.CylinderGeometry(.015,.015,1.5,6),steel,scenery,x,.75,z);
  const f=KIT.mesh(new THREE.PlaneGeometry(.45,.22,4,1).translate(.225,0,0),new THREE.MeshToonMaterial({color:COAST.safety,side:THREE.DoubleSide}),scenery,x,1.36,z);
  f.castShadow=false;flags.push(f);
 }
 let clock=0,quality='',exhaust=null;
 const exhaustMatrix=new THREE.Matrix4();
 return {update(dt){
  clock+=dt;const low=S.quality==='low';
  if(quality!==S.quality){quality=S.quality;for(const b of batches)b.mesh.count=low?b.low:b.high;}
  const {n,load,g}=selection(),lift=PHYS.liftoffTime(n,load,g),airborne=!!S.ignited.target&&S.t.value>lift&&!PHYS.stateAt(n,load,g,S.t.value).onPad;
  // Reuse the seeded pad smoke produced by GRAMMAR, after its matrices update.
  // Keep its density/opacity/quest visibility; only tint and advect the scenery contact.
  if(!exhaust){
   exhaust=HERO.children.find(o=>o.isInstancedMesh&&o.material.uniforms?.uBrightness);
  }
  if(exhaust&&airborne){
   for(let i=0;i<exhaust.count;i++){exhaust.getMatrixAt(i,exhaustMatrix);const spread=Math.max(0,exhaustMatrix.elements[13]-PHYS.SCENE.padY)*8;exhaustMatrix.elements[12]+=spread*ENV.wake.windX;exhaustMatrix.elements[14]+=spread*ENV.wake.windZ;exhaust.setMatrixAt(i,exhaustMatrix);}
   exhaust.instanceMatrix.needsUpdate=true;
  }
  flags.forEach((f,i)=>{const p=f.geometry.attributes.position;for(let j=0;j<p.count;j++){const x=p.getX(j);p.setZ(j,Math.sin(clock*.8+x*10+i)*x*.10);}p.needsUpdate=true;f.geometry.computeVertexNormals();});
 }};
}
const ENVIRONMENT=buildEnvironment();
// One ground-anchored terminal; panel geometry and all picking use this local frame.
const C=ENV.terminal,CONTROL_FACE=new THREE.Group();
CONTROL_FACE.position.set(...C.position);CONTROL_FACE.rotation.x=C.tilt;CONSOLE.add(CONTROL_FACE);
KIT.mesh(new THREE.BoxGeometry(C.stem[0],C.position[1]-ENV.ground.y,C.stem[1]),MAT.steel,CONSOLE,C.position[0],(C.position[1]+ENV.ground.y)/2,C.position[2]);
KIT.roundedPanel(...C.panel,MAT.ceramic,CONTROL_FACE);
const dialMount=new THREE.Group();dialMount.position.set(...C.dial.position);dialMount.scale.setScalar(C.dial.scale);CONTROL_FACE.add(dialMount);
const DIAL=KIT.knobWithArc(dialMount,0,0,0);
const GRAPHS=C.graphs.xs.map(x=>KIT.graphScreen(CONTROL_FACE,x,C.graphs.y,C.graphs.z,C.graphs.width,C.graphs.height));
const sliderMount=new THREE.Group();sliderMount.position.set(...C.slider.position);CONTROL_FACE.add(sliderMount);
// Preserve the full categorical rail while keeping its handle on the compact panel.
sliderMount.scale.set(...C.slider.scale);
const SLIDER=KIT.ledSlider(sliderMount,0,0,0,C.slider.width);
for(const d of PHYS.DETENTS.engines)KIT.ball(.012,MAT.brass,sliderMount,SLIDER.x+(d.x-.5)*SLIDER.width,-.08,.02,0);
const PLAY_BUTTON=KIT.mesh(new THREE.CylinderGeometry(C.play.radius,C.play.radius,.025,24).rotateX(Math.PI/2),MAT.graphite,CONTROL_FACE,...C.play.position);
const playShape=new THREE.Shape();playShape.moveTo(-.012,-.018);playShape.lineTo(.02,0);playShape.lineTo(-.012,.018);playShape.closePath();
const PLAY_TRIANGLE=KIT.mesh(new THREE.ShapeGeometry(playShape),MAT.glow,PLAY_BUTTON,0,0,.014);
const PLAY_GLYPH=new THREE.Group();PLAY_BUTTON.add(PLAY_GLYPH);
for(const x of [-.012,.012])KIT.roundedPanel(.006,.034,.004,MAT.glow,PLAY_GLYPH,x,0,.014,.001);
const gravityMount=new THREE.Group();gravityMount.position.set(...C.gravity.position);CONTROL_FACE.add(gravityMount);
KIT.roundedPanel(.08,.065,.015,MAT.graphite,gravityMount);
const GRAVITY_SWITCH=KIT.rod(V3(0,-.015,.015),V3(0,.02,.045),.012,MAT.chrome,gravityMount);

function drawGraphs(){
 const {n,load,g}=selection(),ignited=!!S.ignited.target,t=S.t.value;
 const key=[n,load,g,ignited,t.toFixed(4)].join(':');if(S.graphKeys[0]===key)return;S.graphKeys[0]=key;
 const burn=PHYS.burnTime(n),landing=PHYS.stateAt(n,load,g,0).landingT;
 const horizon=Number.isFinite(landing)?landing:burn,observed=Math.min(t,horizon);
 const maxForce=PHYS.m0(load)*g>PHYS.thrust(n)?PHYS.m0(load)*g:PHYS.thrust(n);
 const sample=PHYS.simulate(n,load,g,observed,Math.max(horizon/PHYS.SCENE.graphSamples,.01));
 const all=PHYS.simulate(n,load,g,horizon,horizon/PHYS.SCENE.graphSamples);
 const vScale=Math.max(1,...all.v.map(Math.abs));
 GRAPHS.forEach((screen,index)=>{
  const c=screen.ctx,{width:w,height:h,left:L,right:R,top:U,bottom:B}=PHYS.SCENE.graph;
  c.fillStyle=css(PAINT.screen);c.fillRect(0,0,w,h);c.lineWidth=1;c.strokeStyle=css(PAINT.grid);
  for(let i=0;i<=10;i++){const x=L+(R-L)*i/10;c.beginPath();c.moveTo(x,U);c.lineTo(x,B);c.stroke();}
  for(let i=0;i<=4;i++){const y=U+(B-U)*i/4;c.beginPath();c.moveTo(L,y);c.lineTo(R,y);c.stroke();}
  const X=time=>L+(R-L)*time/horizon,Y=value=>index?(U+B)/2-value/vScale*(B-U)*.45:B-value/maxForce*(B-U)*.9;
  if(ignited){
   for(const [field,color] of index?[['v',PAINT.speed]]:[['T',PAINT.thrust],['W',PAINT.weight],['normal',PAINT.support]]){
    c.strokeStyle=css(color);c.lineWidth=3;c.beginPath();let prior=null;
    const times=[...sample.t];if(burn<=observed)times.push(burn-1e-7,burn);times.sort((a,b)=>a-b);
    for(const time of times){const value=PHYS.stateAt(n,load,g,time)[field],x=X(time),y=Y(value);
     if(prior===null||((field==='T'||field==='normal')&&prior<burn&&time>=burn))c.moveTo(x,y);else c.lineTo(x,y);prior=time;}c.stroke();
    if(!index&&['T','normal'].includes(field)&&burn<=observed){
     for(const [time,filled] of [[burn-1e-7,false],[burn,true]]){c.beginPath();c.arc(X(burn),Y(PHYS.stateAt(n,load,g,time)[field]),4,0,Math.PI*2);c.stroke();if(filled){c.fillStyle=css(color);c.fill();}}
    }
    const y=Y(PHYS.stateAt(n,load,g,observed)[field]);c.fillStyle=css(color);c.beginPath();c.arc(X(observed),y,5,0,Math.PI*2);c.fill();
   }
   c.strokeStyle=css(INK_CFG.diagram.ink);c.lineWidth=2;c.beginPath();c.moveTo(X(observed),U);c.lineTo(X(observed),B);c.stroke();
   for(const event of sample.events){c.fillStyle=css(PAINT.brass);c.beginPath();c.moveTo(X(event.t)-5,B+9);c.lineTo(X(event.t),B);c.lineTo(X(event.t)+5,B+9);c.fill();}
  }
  // Axis-end clock and quantity symbols: paths only, no font rasterization.
  c.strokeStyle=css(INK_CFG.diagram.ink);c.lineWidth=3;c.beginPath();c.arc(742,235,10,0,Math.PI*2);c.moveTo(742,228);c.lineTo(742,235);c.lineTo(748,238);c.stroke();
  if(index){for(let i=0;i<3;i++){c.fillStyle=css(PAINT.speed);c.beginPath();c.arc(18,22+i*i*7,3,0,Math.PI*2);c.fill();}}
  else{c.beginPath();c.moveTo(22,56);c.lineTo(22,20);c.moveTo(14,28);c.lineTo(22,20);c.lineTo(30,28);for(let y=34;y<57;y+=10){c.moveTo(16,y);c.lineTo(28,y);}c.stroke();}
  screen.tex.needsUpdate=true;
 });
}

// Launch gantry and paired storage vessels: geometry, no external artwork.
for(const x of [-.05,.18])KIT.rod(V3(x,.97,-.34),V3(x,2.88,-.34),.022,MAT.chrome,HERO);
for(let i=0;i<7;i++){
 const y=1.03+i*.27;KIT.rod(V3(-.05,y,-.34),V3(.18,y+.27,-.34),.012,MAT.brass,HERO);
 KIT.rod(V3(.18,y,-.34),V3(-.05,y+.27,-.34),.012,MAT.brass,HERO);
}
for(const y of [1.40,2.1,2.75])KIT.rod(V3(-.05,y,-.34),V3(-.40,y,-.34),.018,MAT.graphite,HERO);
for(const x of [1.80,2.00]){
 KIT.mesh(new THREE.CylinderGeometry(.075,.075,.44,16),MAT.chrome,HERO,x,1.23,-.25);
 KIT.ball(.075,MAT.chrome,HERO,x,1.45,-.25);KIT.ball(.075,MAT.chrome,HERO,x,1.01,-.25);
 KIT.rod(V3(x,1.12,-.25),V3(.20,1.00,-.29),.009,MAT.brass,HERO);
}
