// g-table layer names are API identifiers, never rendered words.
const GRAMMAR=(()=>{
 const LAYERS=Object.freeze(['마디','상쇄·쌓아 채우기','문턱','계단','겹치기·숨은 구조','시간·운동','기록','그래프']);
 const defaults=Object.freeze(Object.fromEntries(LAYERS.map((name,i)=>[name,[true,true,true,false,false,true,false,true][i]])));
 const enabled={...defaults},groups={},mix={},arrows=[];
 const metadata=Object.freeze([
  {name:LAYERS[0],default:defaults[LAYERS[0]],glyph:'cells',entrance:'fade'},
  {name:LAYERS[1],default:defaults[LAYERS[1]],glyph:'cancel-support',entrance:'fade'},
  {name:LAYERS[2],default:defaults[LAYERS[2]],glyph:'dashed-threshold',entrance:'fade'},
  {name:LAYERS[3],default:defaults[LAYERS[3]],glyph:'engine-steps',entrance:'fade'},
  {name:LAYERS[4],default:defaults[LAYERS[4]],glyph:'lens-baseline',entrance:'fade'},
  {name:LAYERS[5],default:defaults[LAYERS[5]],glyph:'equal-time-dots',entrance:'fade'},
  {name:LAYERS[6],default:defaults[LAYERS[6]],glyph:'condition-record',entrance:'fade'},
  {name:LAYERS[7],default:defaults[LAYERS[7]],glyph:'curves-tangent',entrance:'fade'}
 ]);
 for(const name of LAYERS){groups[name]=new THREE.Group();HERO.add(groups[name]);mix[name]=enabled[name]?1:0;}
 const [marks,cancel,limit,steps,lens,motion,record,graph]=LAYERS.map(n=>groups[n]);
 let baseline=null,clock=0,curveKey='';
 const nowArrows={},baseArrows={};
 function arrow(parent,key,color,x,y,pattern=0,ghost=false){
  const a=KIT.quantityArrow(parent,color,pattern,ghost);a.position.set(x,y,.34);
  arrows.push({a,key,ghost});return a;
 }
 for(const [key,color,x,y,pattern]of [['thrustGlyph',PAINT.thrust,-1.55,1.48,0],['weightGlyph',PAINT.weight,-1.35,1.48,1],['supportGlyph',PAINT.support,-1.15,1.48,2]]){
  nowArrows[key]=arrow(marks,key,color,x,y,pattern);
  baseArrows[key]=arrow(marks,key,color,x,y,pattern,true);baseArrows[key].position.z=.345;baseArrows[key].userData.shaft.scale.x=1.35;
  const refHead=baseArrows[key].userData.head;refHead.visible=false;
  const chevron=KIT.line([V3(-.055,0,0),V3(0,.065,0),V3(.055,0,0)],color,baseArrows[key],true);baseArrows[key].userData.referenceHead=chevron;
 }
 // The downward head makes the filled weight column distinct from upward thrust.
 nowArrows.weightGlyph.userData.head.rotation.z=Math.PI;
 baseArrows.weightGlyph.userData.head.rotation.z=Math.PI;
 const supportArrow=arrow(cancel,'supportGlyph',PAINT.support,M.rocketX+.42,M.padY+.04,2);
 const cancelBars=[];
 for(let i=0;i<PHYS.DISPLAY.forceCap;i++){
  const g=new THREE.Group();cancel.add(g);g.position.set(-1.68,1.48+i*PHYS.DISPLAY.forceUnit,.36);
  KIT.line([V3(0,0,0),V3(.43,.10,0)],PAINT.graphite,g,false,.5);cancelBars.push(g);
 }
 const surplus=arrow(cancel,'surplus',PAINT.thrust,-1.55,1.48);
 surplus.visible=false;
 const threshold=KIT.line([V3(-1.72,0,.36),V3(-1.04,0,.36)],0xb25850,limit,true);
 const thresholdBand=KIT.mesh(new THREE.PlaneGeometry(.68,.048),new THREE.MeshBasicMaterial({color:0xc44959,transparent:true,opacity:.14,depthWrite:false}),limit,-1.38,0,.32);
 const facingTips=[];
 for(const x of [-1.76,-1.0]){const g=new THREE.Group();limit.add(g);g.position.set(x,0,.36);KIT.line([V3(-.035,-.035,0),V3(0,0,0),V3(-.035,.035,0)],0xb25850,g);if(x<-1.5)g.rotation.z=Math.PI;facingTips.push(g);}
 const stairArrows=[];
 for(let i=0;i<PHYS.C.engineMax;i++){
  const a=arrow(steps,'engine',PAINT.thrust,1.0+i*.19,1.75);stairArrows.push(a);
  KIT.mesh(new THREE.CylinderGeometry(.025,.045,.07,8,1,true),MAT.chrome.clone(),steps,1.0+i*.19,1.66,.32);
 }
 const stairLimit=KIT.line([V3(.92,0,.36),V3(1.88,0,.36)],0xb25850,steps,true);
 // Lens opens a physical tank section; rim, grid and fuel level are all geometry.
 const lensRim=KIT.line(Array.from({length:65},(_,i)=>V3(Math.cos(i/64*Math.PI*2)*.30,Math.sin(i/64*Math.PI*2)*.30,0)),PAINT.graphite,lens,true);
 lensRim.position.set(.17,2.0,.42);
 for(let i=-2;i<=2;i++)KIT.line([V3(-.08+i*.10,1.80,.40),V3(-.08+i*.10,2.20,.40)],PAINT.grid,lens);
 const lensFuel=KIT.roundedPanel(.28,1,.025,new THREE.MeshBasicMaterial({color:PAINT.speed,transparent:true,opacity:.45}),lens,.12,2,.40);
 const fuelGhost=KIT.line([V3(-.02,1.78,.44),V3(.26,1.78,.44),V3(.26,2.22,.44),V3(-.02,2.22,.44),V3(-.02,1.78,.44)],PAINT.graphite,lens,true);
 const rocketGhost=KIT.line([V3(-.24,0,0),V3(-.24,.90,0),V3(0,1.30,0),V3(.24,.90,0),V3(.24,0,0),V3(-.24,0,0)],PAINT.graphite,marks,true);
 const weightGhost=arrow(lens,'initialWeight',PAINT.weight,-1.35,1.48,1,true);
 const gravityArrows=[arrow(lens,'earthWeight',PAINT.weight,1.12,1.58,1),arrow(lens,'moonWeight',PAINT.weight,1.51,1.58,1)];
 const motionDots=Array.from({length:PHYS.DISPLAY.dotCount},()=>KIT.ball(.020,new THREE.MeshBasicMaterial({color:PAINT.speed,transparent:true}),motion,0,0,.25,1));
 const altitudeDots=Array.from({length:PHYS.DISPLAY.dotCount},()=>KIT.ball(.017,new THREE.MeshBasicMaterial({color:PAINT.graphite,transparent:true}),motion,0,0,.1,0));
 KIT.line([V3(-.45,1.035,.34),V3(.42,1.035,.34)],PAINT.grid,motion);
 const motionBreak=KIT.breakMark(motion,PAINT.speed);motionBreak.position.set(.40,1.08,.36);
 const motionSign=KIT.expansion(motion,M.towerX+.22,2.9,.10);motionSign.scale.setScalar(.12);
 // Record geometry encodes engine count, cargo size, gravity and result together.
 record.position.set(1.05,2.68,.24);
 const recordNow=new THREE.Group(),recordBase=new THREE.Group();record.add(recordNow,recordBase);recordBase.position.y=-.24;
 const records=[recordNow,recordBase].map(g=>{
  const nozzles=Array.from({length:PHYS.C.engineMax},(_,i)=>KIT.mesh(new THREE.ConeGeometry(.025,.06,8),MAT.chrome.clone(),g,i*.075,0,0));
  const cargo=KIT.roundedPanel(.07,.07,.06,MAT.brass.clone(),g,.46,0,0);
  const globe=KIT.ball(.05,MAT.ceramic.clone(),g,.62,0,0,1);
  const bar=KIT.roundedPanel(1,.04,.02,new THREE.MeshBasicMaterial({color:PAINT.thrust,transparent:true}),g,0,-.09,0);
  const outline=KIT.line([V3(-.04,-.15,.04),V3(.73,-.15,.04),V3(.73,.10,.04),V3(-.04,.10,.04),V3(-.04,-.15,.04)],PAINT.graphite,g,true);
  const resultOutline=KIT.line([V3(0,-.11,.03),V3(1,-.11,.03),V3(1,-.07,.03),V3(0,-.07,.03),V3(0,-.11,.03)],PAINT.thrust,g,true);
  const changed=[0,.46,.62].map((x,i)=>{const line=KIT.line([V3(x-.045,-.05,.04),V3(x+.045,-.05,.04),V3(x+.045,.06,.04),V3(x-.045,.06,.04),V3(x-.045,-.05,.04)],PAINT.graphite,g);line.scale.x=i?1:4.5;return line;});
  return {nozzles,cargo,globe,bar,outline,resultOutline,changed};
 });
 // Miniature graph occupies the upper right lane; console graphs use the same layer switch.
 graph.position.set(1.0,2.05,.38);
 for(let i=0;i<=4;i++){
  KIT.line([V3(0,i*.13,0),V3(.76,i*.13,0)],PAINT.grid,graph);
  KIT.line([V3(i*.19,0,0),V3(i*.19,.52,0)],PAINT.grid,graph);
 }
 KIT.line(Array.from({length:25},(_,i)=>V3(.82+Math.cos(i/24*Math.PI*2)*.035,Math.sin(i/24*Math.PI*2)*.035,0)),PAINT.graphite,graph);
 KIT.line([V3(.82,.026,0),V3(.82,0,0),V3(.845,-.012,0)],PAINT.graphite,graph);
 KIT.line([V3(-.045,.40,0),V3(-.045,.53,0),V3(-.065,.505,0),V3(-.045,.53,0),V3(-.025,.505,0)],PAINT.thrust,graph);
 const curves=new THREE.Group();graph.add(curves);
 const tangent=KIT.line([V3(0,0,.01),V3(.1,0,.01)],PAINT.speed,graph);
 const tangentBase=KIT.line([V3(0,0,.01),V3(.1,0,.01)],PAINT.graphite,graph,true);
 const currentPoint=KIT.ball(.018,new THREE.MeshBasicMaterial({color:PAINT.speed,transparent:true}),graph,0,0,.02,0);
 // Seeded exhaust and pad smoke; only density is reduced in lite mode.
 const seed=mulberry32(459721),particleData=Array.from({length:PHYS.DISPLAY.smokeCount},()=>({phase:seed(),a:seed()*Math.PI*2,r:seed(),size:.018+seed()*.025}));
 const smokeMaterial=new THREE.ShaderMaterial({uniforms:{uOpacity:{value:0},uBrightness:{value:0}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform float uOpacity,uBrightness;varying vec2 vUv;void main(){float r=length(vUv-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(mix(vec3(.65,.67,.66),vec3(.91,.86,.74),step(.5,uBrightness)),(r<.72?1.:.65)*uOpacity);}`,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 const smoke=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),smokeMaterial,particleData.length);smoke.frustumCulled=false;HERO.add(smoke);
 const streams=new THREE.InstancedMesh(new THREE.SphereGeometry(1,4,3),new THREE.MeshBasicMaterial({color:PAINT.thrust,transparent:true,opacity:.5}),particleData.length);streams.frustumCulled=false;HERO.add(streams);
 const dummy=new THREE.Object3D();
 function set(values){
  for(const name of Object.keys(values))if(!LAYERS.includes(name))throw new RangeError(name);
  for(const [name,on]of Object.entries(values)){enabled[name]=!!on;S.layers[name]=!!on;const button=document.querySelector(`[data-layer-index="${LAYERS.indexOf(name)}"]`);if(button)button.setAttribute('aria-pressed',String(!!on));}
  return {...enabled};
 }
 function pin(record){const input=record||{...selection(),t:S.t.value,ignited:!!S.ignited.target};baseline=structuredClone({...input,values:PHYS.grammarValues(input.n,input.load,input.g,input.t,input.ignited)});curveKey='';return structuredClone(baseline);}
 function unpin(){baseline=null;curveKey='';}
 function applyArrow(a,glyph){
  const {shaft,head,overflow,material}=a.userData;
  a.visible=glyph.length>1e-8;shaft.scale.y=glyph.length;material.uniforms.uLength.value=glyph.length;
  if(a.userData.referenceHead){a.userData.referenceHead.position.y=glyph.length;a.userData.referenceHead.rotation.z=a===baseArrows.weightGlyph?Math.PI:0;}
  head.position.y=a===nowArrows.weightGlyph||a===baseArrows.weightGlyph?0:glyph.length;
  overflow.position.y=glyph.length+.045;overflow.visible=glyph.overflow;
 }
 function update(dt){
  clock+=dt;phenomenonTime=clock;
  const input=selection(),{n,load,g}=input,t=S.t.value,ignited=!!S.ignited.target,v=PHYS.grammarValues(n,load,g,t,ignited);
  for(const name of LAYERS){mix[name]=clamp(mix[name]+(enabled[name]?1:-1)*dt/.3,0,1);groups[name].visible=mix[name]>0;}
  for(const {a,key,ghost}of arrows){
   if(key==='engine')continue;
   applyArrow(a,ghost&&a!==weightGhost?(baseline?.values[key]||PHYS.forceGlyph(0)):v[key]);
  }
  rocketGhost.visible=!!baseline;rocketGhost.position.set(M.rocketX,M.rocketBase+(baseline?.values.displayLift||0),.28);
  baseArrows.weightGlyph.visible=!!baseline&&baseline.values.weightGlyph.length>0;
  supportArrow.position.y=M.padY+.04;supportArrow.visible=v.normal>0;
  cancelBars.forEach((bar,i)=>{bar.visible=i<v.cancelled.cells;bar.scale.y=clamp(v.cancelled.shown-i,0,1);});
  surplus.visible=false; // Main pair already contains the uncancelled thrust; no duplicate column.
  if(typeof Q!=='undefined'&&!Q.free&&Q.i===1){
   steps.visible=false;
   for(const [key,x]of [['thrustGlyph',-.95],['weightGlyph',-.72],['supportGlyph',-1.18]]){nowArrows[key].position.x=x;baseArrows[key].position.x=x;}
   cancelBars.forEach(o=>o.visible=false);
  }else{for(const [key,x]of [['thrustGlyph',-1.55],['weightGlyph',-1.35],['supportGlyph',-1.15]]){nowArrows[key].position.x=x;baseArrows[key].position.x=x;}}
  surplus.position.y=1.48+v.cancelled.length;
  for(const o of [threshold,thresholdBand,...facingTips])o.position.y=1.48+v.weightGlyph.length;
  stairArrows.forEach((a,i)=>{applyArrow(a,PHYS.forceGlyph(PHYS.thrust(i+1)));a.userData.material.uniforms.uColor.value.set(i+1===n?PAINT.thrust:PAINT.graphite);});
  stairLimit.position.y=1.75+v.weightGlyph.length;
  lensFuel.scale.y=.44*v.fuel;lensFuel.position.y=1.78+.22*v.fuel;
  const fuel=baseline?.values.fuel??1;fuelGhost.scale.y=fuel;fuelGhost.position.y=1.78*(1-fuel);
  const dots=PHYS.motionDots(n,load,g,t,ignited);
  motionDots.forEach((dot,i)=>{const d=dots[i];dot.visible=!!d;if(d){dot.position.set(-.40+d.linear,1.075,.34);dot.material.color.set(i===dots.length-1?PAINT.speed:PAINT.graphite);}});
  altitudeDots.forEach((dot,i)=>{const d=dots[i];dot.visible=!!d;if(d)dot.position.set(M.towerX+.15,M.rocketBase+d.altitude,.12);});
  motionBreak.visible=dots.some(d=>d.overflow);
  [{...input,values:v},baseline].forEach((r,i)=>{
   const group=i?recordBase:recordNow;group.visible=!!r;if(!r)return;
   const data=records[i];data.nozzles.forEach((o,j)=>o.visible=j<r.n);
   data.cargo.visible=r.load>0;data.cargo.scale.setScalar(r.values.loadSize);
   data.globe.material.color.set(r.g===PHYS.C.earthG?PAINT.cool:PAINT.ceramic);
   data.bar.visible=i===0;data.resultOutline.visible=i===1;data.resultOutline.scale.x=r.values.thrustGlyph.length*.65;
   data.changed.forEach((o,j)=>{o.visible=i===0&&!!baseline&&[baseline.n!==n,baseline.load!==load,baseline.g!==g][j];});
   data.bar.scale.x=r.values.thrustGlyph.length*.65;data.bar.position.x=data.bar.scale.x/2;
   data.outline.visible=i===1||!!baseline&&(baseline.n!==n||baseline.load!==load||baseline.g!==g);
  });
  const nextKey=[enabled[LAYERS[7]],n,load,g,t.toFixed(3),ignited,baseline?.n,baseline?.load,baseline?.g,baseline?.t].join(':');
  if(nextKey!==curveKey&&mix[LAYERS[7]]>0){
   curveKey=nextKey;for(const child of [...curves.children]){curves.remove(child);child.geometry.dispose();child.material.dispose();}
   tangentBase.visible=!!baseline;
   const series=[{...input,t,ignited},baseline].filter(Boolean);
   const horizon=Math.max(...series.map(r=>PHYS.grammarHorizon(r.n,r.load,r.g)));
   series.forEach((r,index)=>{
    const points=PHYS.grammarCurve(r.n,r.load,r.g,r.t,r.ignited,horizon);
    for(const [field,color]of [['T',PAINT.thrust],['W',PAINT.weight],['normal',PAINT.support],['v',PAINT.speed]]){
     let segment=[];
     const flush=()=>{if(segment.length>1)KIT.line(segment,color,curves,!!index);segment=[];};
     for(const p of points){if(p.break&&field!=='v'&&field!=='W')flush();segment.push(V3(p.x,field==='v'?.26+p.v:p[field]*.44,.015));}flush();
    }
    if(index===1){const p=points.at(-1);tangentBase.visible=!!p;if(p){tangentBase.geometry.dispose();tangentBase.geometry=new THREE.BufferGeometry().setFromPoints(PHYS.grammarTangent(p).map(([x,y])=>V3(x,y,.022)));tangentBase.computeLineDistances();}}
    if(index===0){const p=points.at(-1);currentPoint.visible=!!p;tangent.visible=!!p;if(p){currentPoint.position.set(p.x,.26+p.v,.025);
     const tangentPoints=PHYS.grammarTangent(p);
     tangent.geometry.dispose();tangent.geometry=new THREE.BufferGeometry().setFromPoints(tangentPoints.map(([x,y])=>V3(x,y,.02)));}}
   });
  }
  const lensMix=mix[LAYERS[4]],stepMix=mix[LAYERS[3]],recordMix=mix[LAYERS[6]];
  for(const name of LAYERS){
   let opacity=mix[name];if(name===LAYERS[7])opacity*=1-.90*Math.max(stepMix,recordMix,lensMix);
   if(name===LAYERS[0])opacity*=(1-.55*mix[LAYERS[1]])*(1-.30*lensMix);
   if(name===LAYERS[3])opacity*=1-.85*lensMix;if(name===LAYERS[6])opacity*=1-.85*stepMix;
   groups[name].traverse(o=>{if(!o.material)return;const m=o.material;m.transparent=true;
    if(m.uniforms?.uOpacity)m.uniforms.uOpacity.value=opacity;
    else{m.userData.baseOpacity??=m.opacity;m.opacity=m.userData.baseOpacity*opacity;}
   });
  }
  FUEL.visible=v.fuel>1e-7&&S.layers.fuel!==false;
  tankGlass.opacity=.15*(1-.8*lensMix);
  for(const screen of GRAPHS){screen.mesh.material.opacity=1;screen.mesh.visible=true;}
  smoke.count=S.quality==='low'?particleData.length/2:particleData.length;
  smokeMaterial.uniforms.uOpacity.value=(v.onPad?.65:.27)*v.brightness*(1-.80*lensMix);
  smokeMaterial.uniforms.uBrightness.value=v.brightness;
  for(let i=0;i<smoke.count;i++){
   const d=particleData[i],u=(d.phase+clock*.45)%1,r=.12+u*.45*d.r;
   dummy.position.set(M.rocketX+Math.cos(d.a)*r,M.padY+.015+u*.13,Math.sin(d.a)*r);
   dummy.quaternion.copy(camera.quaternion);dummy.scale.setScalar(d.size*(1+u*4));dummy.updateMatrix();smoke.setMatrixAt(i,dummy.matrix);
  }
  smoke.instanceMatrix.needsUpdate=true;
  streams.count=smoke.count;streams.material.opacity=v.brightness*.7*(1-.8*lensMix);
  for(let i=0;i<streams.count;i++){
   const d=particleData[i],u=(d.phase+clock*v.flow*.8)%1;
   dummy.position.set(M.rocketX+Math.cos(d.a)*.12*d.r,M.rocketBase+v.displayLift+(1-u)*M.bodyHeight*PHYS.DISPLAY.rocketScale,Math.sin(d.a)*.12*d.r);
   dummy.quaternion.identity();dummy.scale.set(.006,.025,.006);dummy.updateMatrix();streams.setMatrixAt(i,dummy.matrix);
  }
  streams.instanceMatrix.needsUpdate=true;
 }
 return {LAYERS,defaults,metadata,enabled,groups,set,pin,unpin,update,get baseline(){return baseline?structuredClone(baseline):null;}};
})();
// Function declarations are initialized before module evaluation, including the loop hook.
const originalLayer=layer;
layer=function(name,on){if(GRAMMAR.LAYERS.includes(name))return GRAMMAR.set({[name]:on});return originalLayer(name,on);};
window.GRAMMAR=GRAMMAR;
