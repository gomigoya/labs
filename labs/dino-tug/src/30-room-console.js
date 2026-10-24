// All environment construction belongs here. Dimensions are schematic, not fossil evidence.
// Shared density/size table: each row is [high count, low count, radius, height, depth].
const HABITAT = Object.freeze({
  terrain: [1,1,120,0,0], rear: [30,16,.32,11,-29], middle: [24,14,.44,12,-17],
  near: [12,8,.65,14,-8], ferns: [48,20,.9,1.4,0], rocks: [18,9,.65,.45,0],
  litter: [180,60,.10,.02,0], vines: [24,10,.035,5,0], logs: [3,3,.30,3,0],
  shafts: [4,3,2.4,12,-12], motes: [64,24,.025,5,-5], smoke: [7,4,.6,3,-43],
  footprints: [8,8,.26,.12,0], foreground: [0,0,1.5,1.3,5],
  clearing: {inner:[PHYS.DRAMA.width/2+.3,PHYS.DRAMA.depth/2+.18],outer:[5.8,2.1],rise:.123,segments:48,power:.25},
  sun: {opacity:.18,pulse:0,color:BIOME.sun},
  trail: BIOME.trail,
  foregroundLayout:{x:7.5,xStep:2,zStep:1.2,rockY:.24,vineY:1.8,frondY:.65,spread:.7}
});
// Pure segment/sphere test. Centers and radii are world-space, independent of THREE.
function environmentOcclusions(camera,targets,props){
 return props.filter(prop=>targets.some(target=>{
  const d=target.map((v,i)=>v-camera[i]),q=prop.center.map((v,i)=>v-camera[i]);
  const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0),len=dot(d,d);
  const t=len?Math.max(0,Math.min(1,dot(q,d)/len)):0;
  return q.reduce((sum,v,i)=>sum+(v-t*d[i])**2,0)<=prop.radius**2;
 }));
}
function stageSightTargets(species,rivalN=0,flagX=0,n=59){
 const team=(count,mirror=1)=>{
  const kids=Array.from({length:count},(_,i)=>PHYS.dramaChild(count,i));
  return [mirror*kids.reduce((sum,k)=>sum+k.x,0)/count,PHYS.DRAMA.ground+PHYS.DRAMA.kidHeight/2,kids.reduce((sum,k)=>sum+k.z,0)/count];
 };
 const rival=rivalN>0?team(Math.min(rivalN,PHYS.C.rivalMax),-1):[PHYS.DRAMA.dinoX,PHYS.DRAMA.ground+PHYS.dramaState(n,species,.55).height/2,PHYS.DRAMA.dinoZ];
 return [team(n),rival,[flagX,PHYS.DRAMA.ropeY+.6,.08],[0,PHYS.DRAMA.ropeY,.08]];
}
const STAGE_SIGHT_TARGETS=Object.freeze(stageSightTargets(Object.keys(PHYS.SPECIES)[4]));
// A conservative swept corridor covers every azimuth/elevation available to dramaFrame,
// including event focus and future HUD inset changes. Distant forest remains behind it.
function environmentPropAllowed(prop){
 return prop.center[2]+prop.radius < -1.3;
}
const ENVIRONMENT_PROPS=[];
function buildEnvironment() {
  ROOM.position.y=PHYS.SCENE.top;
  const seed=mulberry32(761037), dummy=new THREE.Object3D(), batches=[], crowns=[], beams=[];
  let clock=0, quality='';
  const material=color=>new THREE.MeshStandardMaterial({color,flatShading:true});
  const bark=MAT.bark, foliage=material(BIOME.foliage), moss=material(BIOME.moss), mud=material(BIOME.mud);
  const batch=(geometry,mat,row,poses,parent=ROOM,occluding=true)=>{
    geometry.computeBoundingSphere();
    const sphere=geometry.boundingSphere;
    poses=poses.filter(p=>{
      // Rotation cannot expand this enclosing origin-centered sphere. Include crown sway.
      const scale=Math.max(...(p.s||[1,1,1]).map(Math.abs));
      const radius=(sphere.radius+sphere.center.length())*scale+.25;
      const prop={center:[p.p[0],p.p[1]+PHYS.SCENE.top,p.p[2]],radius};
      if(occluding&&!mat.transparent&&!environmentPropAllowed(prop))return false;
      if(occluding&&!mat.transparent)ENVIRONMENT_PROPS.push(prop);
      return true;
    });
    const mesh=new THREE.InstancedMesh(geometry,mat,poses.length);mesh.frustumCulled=false;mesh.receiveShadow=true;parent.add(mesh);
    poses.forEach((p,i)=>{dummy.position.set(...p.p);dummy.rotation.set(...(p.r||[0,0,0]));dummy.scale.set(...(p.s||[1,1,1]));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
    batches.push({mesh,low:Math.min(row[1],poses.length)});return mesh;
  };
  // Wet earth, moss islands, leaf flecks, and actual depressed three-toed impressions.
  const impressions=Array.from({length:HABITAT.footprints[0]},(_,i)=>({x:-6+i*1.65,z:2.7+(i%2)*.65}));
  // Cut matching holes in the earth, then instance the sloping cavity and its dark base.
  const outline=[[-.14,.19],[-.25,.02],[-.32,-.25],[-.23,-.32],[-.12,-.15],[-.07,-.42],[.04,-.46],[.11,-.17],[.25,-.33],[.34,-.25],[.24,.03],[.14,.19]];
  const earthShape=new THREE.Shape();const extent=HABITAT.terrain[2];earthShape.moveTo(-extent,-extent);earthShape.lineTo(extent,-extent);earthShape.lineTo(extent,extent);earthShape.lineTo(-extent,extent);earthShape.closePath();
  const cavityVertices=[],cavityIndices=[];
  for(const [x,z] of outline)cavityVertices.push(x,0,z,x*.72,-HABITAT.footprints[3],z*.72);
  const center=cavityVertices.length/3;cavityVertices.push(0,-HABITAT.footprints[3],0);
  for(let i=0;i<outline.length;i++){const n=(i+1)%outline.length;cavityIndices.push(i*2,n*2,i*2+1,n*2,n*2+1,i*2+1,center,i*2+1,n*2+1);}
  for(const f of impressions){const hole=new THREE.Path();outline.forEach(([x,z],i)=>i?hole.lineTo(f.x+x,-f.z-z):hole.moveTo(f.x+x,-f.z-z));hole.closePath();earthShape.holes.push(hole);}
  const earth=new THREE.ShapeGeometry(earthShape).rotateX(-Math.PI/2);
  KIT.mesh(earth,mud,ROOM,0,0,0).castShadow=false;
  const cavity=new THREE.BufferGeometry();cavity.setAttribute('position',new THREE.Float32BufferAttribute(cavityVertices,3));cavity.setIndex(cavityIndices);cavity.computeVertexNormals();
  const cavityMat=material(BIOME.cavity);cavityMat.side=THREE.DoubleSide;
  batch(cavity,cavityMat,HABITAT.footprints,impressions.map(f=>({p:[f.x,0,f.z]})),ROOM,false);
  const trailTexture=KIT.canvasTex(512,128,(c,w,h)=>{
    c.fillStyle=HABITAT.trail[0];c.fillRect(0,0,w,h);
    for(let i=0;i<1800;i++){c.fillStyle=HABITAT.trail[i%3?1:2];c.globalAlpha=.25+seed()*.25;c.fillRect(seed()*w,seed()*h,1+seed()*7,1+seed()*2);}
  });
  MAT.stone.map=trailTexture;mud.map=trailTexture;
  // Compacted mud feathers into continuous earth; no vertical rim or support structure.
  const {inner,outer,rise,segments,power}=HABITAT.clearing,vertices=[0,rise,0],indices=[];
  for(const [radii,y] of [[inner,rise],[outer,0]])for(let i=0;i<segments;i++){
    const a=i/segments*Math.PI*2;vertices.push(Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**power*radii[0],y,Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**power*radii[1]);
  }
  for(let i=0;i<segments;i++){const a=1+i,b=1+(i+1)%segments,c=a+segments,d=b+segments;indices.push(0,b,a,a,b,c,b,d,c);}
  const clearing=new THREE.BufferGeometry();clearing.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));clearing.setIndex(indices);clearing.computeVertexNormals();
  KIT.mesh(clearing,mud,ROOM).castShadow=false;
  const margins=Array.from({length:HABITAT.litter[0]},(_,i)=>{
    const a=i*2.399963,r=1.02+seed()*.22;return {p:[Math.cos(a)*inner[0]*r,.03+rise*(1-(r-1)/.26),Math.sin(a)*inner[1]*r],s:[.6+seed(),.3,.6+seed()],r:[0,seed()*6.28,0]};
  });
  batch(new THREE.IcosahedronGeometry(.14,0),moss,HABITAT.litter,margins);
  for(const key of ['rear','middle','near']){
    const row=HABITAT[key],trunks=[],tops=[],roots=[],fans=[];
    for(let i=0;i<row[0];i++){
      const side=i%2?1:-1,x=side*(6+seed()*21),z=row[4]-seed()*5,h=row[3]*(.8+seed()*.4),r=row[2]*(.8+seed()*.5);
      trunks.push({p:[x,h/2,z],s:[r,h,r],r:[0,seed()*6.28,(seed()-.5)*.06]});
      // Conifers, spreading cycads, and tree ferns alternate in one low-poly crown batch.
      tops.push({p:[x,h-1,z],s:[i%3?3:1.7,i%3?1.3:4,2.8],r:[0,seed()*6.28,0]});
      for(let j=0;j<8;j++){const a=j*Math.PI/4;fans.push({p:[x+Math.sin(a)*1.2,h-.7,z+Math.cos(a)*1.2],r:[Math.cos(a)*1.25,a,Math.sin(a)*1.25],s:[.32,i%3?3.1:.01,.14]});}
      roots.push({p:[x,.12,z],s:[r*3,.22,r*3],r:[0,seed()*6.28,0]});
    }
    const mat=material(BIOME[key]);
    batch(new THREE.CylinderGeometry(.65,1,1,7),bark,row,trunks);
    const crown=batch(new THREE.ConeGeometry(1,1,7),mat,row,tops);crowns.push(crown);
    batch(new THREE.IcosahedronGeometry(1,0),moss,row,roots);
    crowns.push(batch(new THREE.ConeGeometry(1,1,5),mat,[row[0]*8,row[1]*8],fans));
  }
  const fronds=[],frondRow=[HABITAT.ferns[0]*8,HABITAT.ferns[1]*8];
  for(let i=0;i<HABITAT.ferns[0];i++){
    const x=(i%2?1:-1)*(5.7+seed()*12),z=-2-seed()*20,size=HABITAT.ferns[2]*(.72+seed()*.67);
    for(let j=0;j<8;j++){const a=j*Math.PI/4;fronds.push({p:[x+Math.sin(a)*size*.5,.4+size*.23,z+Math.cos(a)*size*.5],r:[Math.sin(a)*.65,a,Math.cos(a)*.65],s:[.26*size,HABITAT.ferns[3]*size,.08]});}
  }
  crowns.push(batch(new THREE.ConeGeometry(1,1,5),foliage,frondRow,fronds));
  const rocks=Array.from({length:HABITAT.rocks[0]},()=>({p:[(seed()-.5)*30,.14,-3-seed()*24],s:[.4+seed(),.25+seed()*.4,.4+seed()],r:[0,seed()*6.28,0]}));
  batch(new THREE.IcosahedronGeometry(HABITAT.rocks[2],0),MAT.stone,HABITAT.rocks,rocks);
  batch(new THREE.IcosahedronGeometry(HABITAT.rocks[2],0),moss,HABITAT.rocks,rocks.map(p=>({...p,p:[p.p[0],p.p[1]+.14,p.p[2]],s:[p.s[0]*1.02,p.s[1]*.65,p.s[2]*1.02]})));
  const leaves=Array.from({length:HABITAT.litter[0]},()=>({p:[(seed()-.5)*36,.005,(seed()-.65)*38],s:[1+seed(),1,.4+seed()],r:[-Math.PI/2,0,seed()*6.28]}));
  batch(new THREE.CircleGeometry(HABITAT.litter[2],3),material(BIOME.litter),HABITAT.litter,leaves);
  const tendrils=[];
  for(let i=0;i<HABITAT.vines[0];i++){
    const x=(i%2?1:-1)*(7+seed()*17),z=-7-seed()*18;
    tendrils.push({p:[x,7+seed()*3,z],r:[0,seed()*6.28,.15+seed()*.18],s:[1,.6+seed(),1]});
  }
  const vineCurve=new THREE.CatmullRomCurve3([V3(0,2.5,0),V3(.3,.8,.1),V3(-.3,-.8,.2),V3(.2,-2.5,0)]);
  batch(new THREE.TubeGeometry(vineCurve,8,HABITAT.vines[2],3,false),moss,HABITAT.vines,tendrils);
  batch(new THREE.CylinderGeometry(HABITAT.logs[2],HABITAT.logs[2]*1.2,HABITAT.logs[3],7),bark,HABITAT.logs,[{p:[-7,.32,-3],r:[0,.4,1.5]},{p:[8,.3,-5],r:[.2,-.7,1.5]},{p:[-9,.3,3],r:[0,-.5,1.5]}]);
  // Distant truncated volcanic cone and smoke use the same fog as the forest.
  ENVIRONMENT_PROPS.push({center:[0,PHYS.SCENE.top+3.3,-43],radius:8});
  const volcano=KIT.mesh(new THREE.CylinderGeometry(1.1,7,7,9),material(BIOME.volcano),ROOM,0,3.3,-43);volcano.castShadow=false;
  ENVIRONMENT_PROPS.push({center:[0,PHYS.SCENE.top+6.83,-43],radius:.91});
  KIT.mesh(new THREE.CylinderGeometry(.9,.7,.06,9),material(BIOME.crater),ROOM,0,6.83,-43).castShadow=false;
  const smokePos=Array.from({length:HABITAT.smoke[0]},(_,i)=>({p:[i*.25,7+i*.52,-43],s:[.7+i*.13,.5+i*.12,.7+i*.13]}));
  const smoke=batch(new THREE.IcosahedronGeometry(1,1),new THREE.MeshBasicMaterial({color:0xa5ae92,transparent:true,opacity:.13,depthWrite:false}),HABITAT.smoke,smokePos);
  // Large edge silhouettes share batches and reduce counts in low quality.
  const edgeRocks=[],edgeFronds=[],edgeVines=[],edge=HABITAT.foreground;
  for(let i=0;i<edge[0];i++){
    const side=i%2?1:-1,x=side*(HABITAT.foregroundLayout.x+Math.floor(i/2)*HABITAT.foregroundLayout.xStep),z=edge[4]+Math.floor(i/2)*HABITAT.foregroundLayout.zStep;
    edgeRocks.push({p:[x,HABITAT.foregroundLayout.rockY,z],s:[edge[2],.7,1.1],r:[0,seed()*6.28,0]});
    edgeVines.push({p:[x,HABITAT.foregroundLayout.vineY,z],s:[1,.6,1],r:[0,side*.5,side*.6]});
    for(let j=0;j<8;j++){const a=j*Math.PI/4;edgeFronds.push({p:[x+Math.sin(a)*HABITAT.foregroundLayout.spread,HABITAT.foregroundLayout.frondY,z+Math.cos(a)*HABITAT.foregroundLayout.spread],s:[.5,edge[3]*1.5,.12],r:[Math.sin(a)*.8,a,Math.cos(a)*.8]});}
  }
  batch(new THREE.IcosahedronGeometry(1,0),MAT.stone,edge,edgeRocks);
  batch(new THREE.ConeGeometry(1,1,5),foliage,[edge[0]*8,edge[1]*8],edgeFronds);
  batch(new THREE.TubeGeometry(vineCurve,8,HABITAT.vines[2]*2,3,false),moss,edge,edgeVines);
  for(let i=0;i<HABITAT.shafts[0];i++){
    const mat=new THREE.MeshBasicMaterial({color:HABITAT.sun.color,transparent:true,opacity:HABITAT.sun.opacity,side:THREE.DoubleSide,depthWrite:false});
    const mesh=KIT.mesh(new THREE.PlaneGeometry(HABITAT.shafts[2],HABITAT.shafts[3]),mat,ROOM,-4+i*2.7,6,HABITAT.shafts[4]-i*.7);mesh.rotation.z=-.25;mesh.castShadow=mesh.receiveShadow=false;beams.push(mesh);
  }
  const motePos=Array.from({length:HABITAT.motes[0]},()=>({x:-5+seed()*11,y:seed()*7,z:-5-seed()*4,phase:seed()*6.28}));
  const motes=batch(new THREE.IcosahedronGeometry(HABITAT.motes[2],0),new THREE.MeshBasicMaterial({color:0xd3cd8c,transparent:true,opacity:.45,depthWrite:false}),HABITAT.motes,motePos.map(p=>({p:[p.x,p.y,p.z]})));
  ROOM.traverse(o=>{if(o.isMesh&&!o.material.transparent&&o.geometry.type!=='ShapeGeometry')o.castShadow=true;});
  return {update(dt){
    clock+=dt;
    const pose=S.vertical?CONTROL_LAYOUT.portrait:CONTROL_LAYOUT;
    CONSOLE.position.set(...pose.origin);CONSOLE.rotation.set(CONTROL_LAYOUT.tilt,pose.yaw||0,0,'YXZ');
    if(quality!==S.quality){quality=S.quality;const low=quality==='low';for(const b of batches)b.mesh.count=low?b.low:b.mesh.instanceMatrix.count;beams.forEach((b,i)=>b.visible=!low||i<HABITAT.shafts[1]);}
    crowns.forEach((c,i)=>c.rotation.z=Math.sin(clock*.18+i)*.004);
    beams.forEach((b,i)=>{b.material.opacity=HABITAT.sun.opacity+HABITAT.sun.pulse*Math.sin(clock*.3+i);b.rotation.z=-.25+Math.sin(clock*.12+i)*.012;});
    for(let i=0;i<motes.count;i++){const p=motePos[i];dummy.position.set(p.x+Math.sin(clock*.18+p.phase)*.20,(p.y+clock*.07)%7,p.z+Math.cos(clock*.13+p.phase)*.15);dummy.rotation.set(0,0,0);dummy.scale.setScalar(.6+.4*Math.sin(clock*.8+p.phase)**2);dummy.updateMatrix();motes.setMatrixAt(i,dummy.matrix);}motes.instanceMatrix.needsUpdate=true;
    smoke.position.x=Math.sin(clock*.08)*.35;smoke.position.y=Math.sin(clock*.1)*.12;
  }};
}
const ENVIRONMENT=buildEnvironment();
// Single layout table: local face coordinates also drive drag, graphs and attached readouts.
const CONTROL_LAYOUT=Object.freeze({
  origin:[-2.1,PHYS.SCENE.top+.34,3.1],tilt:-.65,
  portrait:{origin:[4.8,PHYS.SCENE.top+.34,1.4],yaw:1.15},
  pillar:{width:2.10,height:1.16,depth:.48,centerY:.26,taper:.78,frontGap:.025,mossRadius:.16,mossY:-.22,mossZ:-.10},
  dial:[-.78,.50,.04],graphs:[[.24,.63,.04],[.24,.27,.04]],graphSize:[1.36,.27],
  slider:[.24,-.06,.04],sliderWidth:1.28,play:[-.78,.05,.09],switch:[-.78,-.24,.08],
  specimens:[[-.15,.91,-.03],[.53,.91,-.03]],expansion:[.94,.91,.05],
  bars:[[-.92,-.31,.045],[-.92,-.42,.045]],barScale:.72
});
CONSOLE.position.set(...CONTROL_LAYOUT.origin);CONSOLE.rotation.x=CONTROL_LAYOUT.tilt;
// A tapered, faceted mossy stone planted below grade; its sloping face carries the instruments.
const pillar=CONTROL_LAYOUT.pillar;
const stoneGeometry=new THREE.BoxGeometry(pillar.width,pillar.height,pillar.depth);
const stoneVertices=stoneGeometry.attributes.position;
for(let i=0;i<stoneVertices.count;i++)if(stoneVertices.getY(i)<0)stoneVertices.setX(i,stoneVertices.getX(i)*pillar.taper);
stoneGeometry.computeVertexNormals();
KIT.mesh(stoneGeometry,MAT.stone,CONSOLE,0,pillar.centerY,-pillar.depth/2-pillar.frontGap);
const totemMoss=new THREE.MeshStandardMaterial({color:BIOME.moss,flatShading:true});
for(const x of [-pillar.width*.43,pillar.width*.43])KIT.ball(pillar.mossRadius,totemMoss,CONSOLE,x,pillar.mossY,pillar.mossZ,0).scale.set(1,.5,.8);
const DIAL=KIT.knobWithArc(CONSOLE,...CONTROL_LAYOUT.dial);
const GRAPHS=CONTROL_LAYOUT.graphs.map(p=>KIT.graphScreen(CONSOLE,...p,...CONTROL_LAYOUT.graphSize));
const SLIDER=KIT.ledSlider(CONSOLE,...CONTROL_LAYOUT.slider,CONTROL_LAYOUT.sliderWidth);
const PLAY_BUTTON=KIT.mesh(new THREE.CylinderGeometry(.105,.105,.07,24).rotateX(Math.PI/2),MAT.brass,CONSOLE,...CONTROL_LAYOUT.play);
const SWITCH=KIT.roundedPanel(.14,.15,.06,MAT.chrome,CONSOLE,...CONTROL_LAYOUT.switch);
KIT.roundedPanel(.03,.08,.03,MAT.glow,SWITCH,0,.02,.045);
function css(color){return '#'+new THREE.Color(color).getHexString();}
function drawGraphs(){
 const n=PHYS.kidsFromRailX(S.u.value),si=Math.round(S.species.value),gi=Math.round(S.ground.value),species=Object.keys(PHYS.SPECIES)[si],mu=Object.values(PHYS.GROUNDS)[gi];
 const keys=[n+':'+si+':'+gi+':'+S.previousGround,String(si)];
 GRAPHS.forEach((g,index)=>{if(S.graphKeys[index]===keys[index])return;S.graphKeys[index]=keys[index];
 const c=g.ctx,w=768,h=256,L=52,R=716,T=22,B=218; c.fillStyle=css(INK_CFG.diagram.screen);c.fillRect(0,0,w,h);
 c.strokeStyle=css(INK_CFG.diagram.grid);c.lineWidth=1;c.setLineDash([]);
 for(let i=0;i<=10;i++){c.beginPath();c.moveTo(L+i*(R-L)/10,T);c.lineTo(L+i*(R-L)/10,B);c.stroke();}
 for(let i=0;i<=4;i++){c.beginPath();c.moveTo(L,T+i*(B-T)/4);c.lineTo(R,T+i*(B-T)/4);c.stroke();}
 const max=PHYS.forceVisual(PHYS.muscle(70000)).length,fy=f=>B-PHYS.forceVisual(f).length/max*(B-T);
 if(!index){
  for(const prior of [true,false]){c.setLineDash(prior?[8,7]:[]);c.lineWidth=prior?2:4;c.strokeStyle=css(prior?INK_CFG.diagram.reference:INK_CFG.diagram.kids);c.beginPath();
   const ground=Object.values(PHYS.GROUNDS)[prior?S.previousGround:gi];
   for(let j=1;j<=PHYS.RANGE.kids[1];j++){const x=L+(j-1)/100*(R-L),y=fy(PHYS.kidCap(j,ground));if(j===1)c.moveTo(x,y);else c.lineTo(x,y);c.lineTo(L+j/100*(R-L),y);}c.stroke();}
  c.setLineDash([12,8]);c.strokeStyle=css(INK_CFG.diagram.dino);c.beginPath();c.moveTo(L,fy(PHYS.dinoCap(species,mu)));c.lineTo(R,fy(PHYS.dinoCap(species,mu)));c.stroke();c.setLineDash([]);
  const x=L+PHYS.railX(n)*(R-L);c.strokeStyle=css(INK_CFG.diagram.kids);c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();c.fillStyle=css(INK_CFG.diagram.kids);c.beginPath();c.arc(x,fy(PHYS.kidCap(n,mu)),6,0,Math.PI*2);c.fill();
 }else{
  c.strokeStyle=css(INK_CFG.diagram.dino);c.lineWidth=3;c.beginPath();
  Object.keys(PHYS.SPECIES).forEach((s,i)=>{const x=L+PHYS.massGraphX(s)*(R-L),y=B-PHYS.weightRatio(s)*(B-T);i?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();
  Object.keys(PHYS.SPECIES).forEach((s,i)=>{const x=L+PHYS.massGraphX(s)*(R-L),y=B-PHYS.weightRatio(s)*(B-T);c.fillStyle=css(i===si?INK_CFG.diagram.kids:INK_CFG.diagram.dino);c.beginPath();c.arc(x,y,i===si?8:5,0,Math.PI*2);c.fill();if(i===si){c.strokeStyle=css(INK_CFG.diagram.kids);c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();}});
  // Same weight outlines, with dimensionless ratio fill at the two ends.
  for(const [i,s] of [Object.keys(PHYS.SPECIES)[0],Object.keys(PHYS.SPECIES).at(-1)].entries()){c.strokeStyle=css(INK_CFG.diagram.reference);c.strokeRect(78+i*34,30,20,90);c.fillStyle=css(INK_CFG.diagram.muscle);c.fillRect(79+i*34,120-90*PHYS.weightRatio(s),18,90*PHYS.weightRatio(s));}
 }
 // Axis-end peg stacks and quantity arrow / unequal specimen outlines.
 c.setLineDash([]);c.strokeStyle=css(INK_CFG.diagram.reference);c.lineWidth=3;c.beginPath();c.moveTo(22,48);c.lineTo(22,20);c.lineTo(16,28);c.moveTo(22,20);c.lineTo(28,28);c.stroke();
 for(let j=0;j<3;j++){c.beginPath();c.roundRect(731+j*9,231-(index?j*5:0),6,index?8+j*5:13,3);c.stroke();}
 g.tex.needsUpdate=true;
 });
}

