// R2: one owner for layer names, defaults, priorities and comparison semantics.
const GRAMMAR = (()=>{
 const LAYERS=Object.freeze(['\ub2f9\uae40 \ucc28\uc774','\uac70\ub9ac \uc138\uc81c\uacf1 \uc5ed\uad00\uacc4','\ud30c\uad34 \ud55c\uacc4','\uc0ac\uac74\uc758 \uc9c0\ud3c9\uc120','\uc9c8\ub7c9 \ube44\uad50','\uac00\ub85c \uc555\ucd95']);
 const defaults=Object.freeze(Object.fromEntries(LAYERS.map((n,i)=>[n,[false,true,true,true,false,false][i]])));
 const enabled={...defaults}, groups={}, fades={};let baseline=null,pinMix=0,previous=null,eventAge=1;
 LAYERS.forEach(n=>{groups[n]=new THREE.Group();HERO.add(groups[n]);fades[n]=+enabled[n];S.layers[n]=enabled[n];});
 const [lens,steps,limit,horizon,compare,flow]=LAYERS.map(n=>groups[n]);
 // The lens sits beyond the central disk, leaving the rail and probe unobstructed.
 lens.position.set(0.68,1.77,-0.22);
 const lensOutline=KIT.line(Array.from({length:65},(_,j)=>V3(Math.cos(j/64*Math.PI*2)*0.47,Math.sin(j/64*Math.PI*2)*0.24,0)),THEME.reference,lens,true);
 const lensArrows=Array.from({length:4},(_,j)=>({line:KIT.stroke(lens,j<2?THEME.reference:THEME.tide,false,12),cut:KIT.breakMark(lens,j<2?THEME.reference:THEME.tide)}));
 KIT.expansion(lens,0.42,0.22,0);
 const cellRows=[false,true].map(dashed=>({line:KIT.stroke(steps,dashed?THEME.reference:THEME.tide,dashed,256),cut:KIT.breakMark(steps,dashed?THEME.reference:THEME.tide)}));
 steps.position.set(-1.55,1.76,0.40);KIT.expansion(steps,0.47,0.12,0);
 const stairs=KIT.stroke(steps,THEME.tide,false,128);
 const threshold=KIT.stroke(limit,THEME.red,true,130),thresholdInner=KIT.stroke(limit,THEME.red,true,130);
 const event=new THREE.Group();limit.add(event);const crack=KIT.breakMark(event,THEME.reference);event.position.set(E.x,1.80,E.z);
 horizon.add(HORIZON);
 const horizonLine=KIT.stroke(horizon,THEME.red,false,130);
 const horizonTicks=KIT.stroke(horizon,THEME.reference,false,128);
 // Pin ghosts share world coordinates with the current rod, rings and cell unit.
 const ghost=new THREE.Group();HERO.add(ghost);
 const ghostRod=KIT.stroke(ghost,THEME.reference,true,8),ghostRing=KIT.stroke(ghost,THEME.reference,true,130);
 const restRod=KIT.stroke(steps,THEME.reference,true,8);
 const compareRows=Array.from({length:3},(_,i)=>{
  const group=new THREE.Group();group.position.set(0.35,1.73+i*0.105,0.66);compare.add(group);
  const ring=KIT.line(Array.from({length:33},(_,k)=>V3(Math.cos(k/32*Math.PI*2)*0.037,Math.sin(k/32*Math.PI*2)*0.037,0)),THEME.reference,group);
  for(let j=0;j<=i;j++)KIT.ball(0.008,MAT.chrome,group,-0.08,j*0.022-0.022,0);
  return {group,body:KIT.stroke(group,THEME.tide,false,8),cells:KIT.stroke(group,THEME.tide,false,256),cut:KIT.breakMark(group,THEME.tide)};
 });
 const massGhosts=Array.from({length:3},()=>KIT.stroke(compare,THEME.reference,true,8));
 const streakMaterial=new THREE.ShaderMaterial({uniforms:{uT:{value:0},uField:{value:0},uOpacity:{value:0}},
  vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform float uT;uniform float uField;uniform float uOpacity;varying vec3 vP;
   void main(){float core=pow(max(0.0,1.0-abs(vP.x)),2.0);gl_FragColor=vec4(vec3(0.20,0.78,0.67)*(0.45+0.45*uField),core*uOpacity*(0.65+0.15*sin(uT+vP.y*4.0)));}`,
  transparent:true,depthWrite:false});
 const particles=new THREE.InstancedMesh(new THREE.PlaneGeometry(2,2),streakMaterial,PHYS.GRAMMAR.particles);flow.add(particles);particles.frustumCulled=false;
 const seed=mulberry32(450731),seeds=Array.from({length:PHYS.GRAMMAR.particles},()=>[seed(),seed(),seed()]);
 const dummy=new THREE.Object3D();
 const trail=KIT.stroke(steps,THEME.reference,true,128);
 const trailBand=[-.008,.008].map(()=>KIT.stroke(steps,THEME.reference,true,128));
 const dots=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.023,1),new THREE.MeshBasicMaterial({color:THEME.reference,transparent:true}),PHYS.GRAMMAR.trailCount);steps.add(dots);dots.frustumCulled=false;
 const flowArrows=[KIT.stroke(flow,THEME.tide,false,12),KIT.stroke(flow,THEME.tide,false,12)];
 function ring(line,r,y){KIT.plot(line,Array.from({length:129},(_,j)=>{const a=j/128*Math.PI*2;return [E.x+Math.cos(a)*r,y,E.z+Math.sin(a)*r];}));}
 function rectangle(line,x,y,z,w,h){KIT.plot(line,[[x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z],[x-w/2,y-h/2,z]]);}
 function cells(row,value,y,x=0){
  const pts=[];for(let j=0;j<Math.ceil(value);j++){
   const l=x+j*PHYS.GRAMMAR.cell,w=PHYS.GRAMMAR.cell*Math.min(1,value-j)*0.82;
   pts.push([l,y,0],[l+w,y,0],[l+w,y+0.027,0],[l,y+0.027,0],[l,y,0]);
  }KIT.plot(row.line||row.cells,pts);row.cut.position.set(x+PHYS.GRAMMAR.cells*PHYS.GRAMMAR.cell+0.025,y+0.014,0);
 }
 function arrow(line,x,y,z,length,sign){
  const end=x+sign*length;KIT.plot(line,[[x,y,z],[end,y,z],[end-sign*0.025,y+0.018,z],[end,y,z],[end-sign*0.025,y-0.018,z]]);
 }
 function set(values){for(const n of Object.keys(values))if(!LAYERS.includes(n))throw new RangeError(n);
  for(const [n,on]of Object.entries(values)){enabled[n]=!!on;S.layers[n]=!!on;}}
 function pin(){const i=massIndex(),r=currentR(),o=orientation();baseline=Object.freeze({i,r,orientation:o,value:PHYS.dA(i,r,o),state:Object.freeze(PHYS.presentationState(i,r,o))});return structuredClone(baseline);}
 function unpin(){baseline=null;}
 function update(dt){
  const i=massIndex(),r=currentR(),o=orientation(),v=PHYS.presentationState(i,r,o),x=E.x-v.radius;
  for(const n of LAYERS){fades[n]=clamp(fades[n]+(enabled[n]?1:-1)*dt/0.3,0,1);const a=fades[n],g=groups[n];g.visible=a>0;
   g.traverse(m=>{if(m.material&&m.material!==streakMaterial){m.material.transparent=true;m.material.opacity=a*0.88;}});}
  pinMix=clamp(pinMix+(baseline?1:-1)*dt/0.3,0,1);ghost.visible=pinMix>0;
  if(baseline){const b=baseline.state;rectangle(ghostRod,E.x-b.radius,1.63,E.z,b.body.length,b.body.height);
   // Rotate around the probe center, not the world origin.
   if(baseline.orientation==='transverse'){const cx=E.x-b.radius,h=b.body.height/2,l=b.body.length/2;KIT.plot(ghostRod,[[cx,1.63-h,E.z-l],[cx,1.63-h,E.z+l],[cx,1.63+h,E.z+l],[cx,1.63+h,E.z-l],[cx,1.63-h,E.z-l]]);}
   ring(ghostRing,b.threshold,1.468);cells(cellRows[1],b.marks,-0.08);cellRows[1].cut.visible=b.overflow;
  }else {cellRows[1].line.visible=pinMix>0;cellRows[1].cut.visible=false;}
  ghost.traverse(m=>{if(m.material)m.material.opacity=pinMix*0.8;});cellRows[1].line.material.opacity*=pinMix;cellRows[1].line.visible=pinMix>0;
  cells(cellRows[0],v.marks,0);cellRows[0].cut.visible=v.overflow;
  // A changing continuous rod is paired with an undeformed dashed reference.
  rectangle(restRod,0.19,0.17,0,PHYS.SCENE.rodLength*PHYS.GRAMMAR.bodyScale,0.032);
  const stairPoints=[];for(let j=0;j<=16;j++){const rr=PHYS.rFromRailX(j/16),h=PHYS.graphY(PHYS.dA(i,rr,o))*0.12;stairPoints.push([j*0.026,0.25-h,0],[(j+1)*0.026,0.25-h,0]);}KIT.plot(stairs,stairPoints);
  ring(threshold,v.threshold,1.462);ring(thresholdInner,v.threshold-0.012,1.462);
  ring(horizonLine,MODEL.horizon,1.475);
  const ticks=[];for(let j=0;j<12;j++){const a=j/12*Math.PI*2;for(const rad of [MODEL.horizon-0.012,MODEL.horizon+0.018])ticks.push([E.x+Math.cos(a)*rad,1.477,E.z+Math.sin(a)*rad]);}KIT.plot(horizonTicks,ticks);
  if(previous&&previous.i===i&&previous.o===o&&previous.intact&&!v.intact)eventAge=0;
  eventAge+=dt;event.visible=eventAge<0.7;crack.scale.setScalar(1+Math.sin(Math.min(1,eventAge/0.7)*Math.PI));previous={i,o,intact:v.intact};
  lens.quaternion.copy(camera.quaternion);
  lensArrows.forEach((a,j)=>{const force=j<2?v.pull[j]:v.difference[j-2],y=(j%2?-.10:.10);arrow(a.line,-0.20,y+(j<2?0:0.04),0,force.length,force.sign);a.cut.position.set(-0.20+force.sign*force.length,y,0);a.cut.visible=force.overflow;
   // Common silver pull fades away to expose the thicker separated difference.
   a.line.material.opacity*=j<2?1-fades[LAYERS[0]]:1;});
  compareRows.forEach((row,j)=>{const b=v.massRows[j];rectangle(massGhosts[j],E.x-MODEL.horizon,1.63+j*0.004,E.z,b.length,b.height);rectangle(row.body,0.25,0,0,b.length,b.height);cells(row,b.marks,-0.02,0.62);row.cut.visible=b.overflow;});
  // Equal scan-time points on the same nonlinear rail; no gravitational clock claim.
  const pts=v.trail.map(rad=>[E.x-rad,1.63,E.z+0.13]);trail.position.set(1.55,-1.76,-0.40);KIT.plot(trail,pts);
  trailBand.forEach((line,j)=>{line.position.copy(trail.position);line.position.y+=(j?1:-1)*.008;KIT.plot(line,pts);});
  dots.position.copy(trail.position);v.trail.forEach((rad,j)=>{dummy.position.set(E.x-rad,1.63,E.z+0.13);dummy.scale.setScalar(1);dummy.rotation.set(0,0,0);dummy.updateMatrix();dots.setMatrixAt(j,dummy.matrix);});dots.instanceMatrix.needsUpdate=true;
  particles.count=S.quality==='low'?PHYS.GRAMMAR.particles/2:PHYS.GRAMMAR.particles;
  const direction=Math.sign(PHYS.tidalArrows(i,r,o).diffNear);
  for(let j=0;j<particles.count;j++){const [phase,lane,side]=seeds[j],sign=side<0.5?-1:1,progress=(phase+S.t.value*v.flow)%1;
   const offset=sign*(0.08+0.21*(direction>0?progress:1-progress));dummy.position.set(x+(o==='radial'?offset:0),1.67+(lane-.5)*0.07,E.z+(o==='transverse'?offset:0));
   dummy.rotation.set(-Math.PI/2,0,o==='radial'?Math.PI/2:0);dummy.scale.set(0.0025,v.streakLength,1);dummy.updateMatrix();particles.setMatrixAt(j,dummy.matrix);
  }particles.instanceMatrix.needsUpdate=true;
  streakMaterial.uniforms.uT.value=S.t.value;streakMaterial.uniforms.uField.value=v.field;streakMaterial.uniforms.uOpacity.value=fades[LAYERS[5]]*(1-0.82*fades[LAYERS[0]]);
  flowArrows.forEach((line,j)=>{const sign=j?1:-1;arrow(line,sign*0.10,0,0,v.difference[j].length,sign*(o==='transverse'?-1:1));line.position.set(x,1.70,E.z);line.rotation.y=o==='transverse'?Math.PI/2:0;});
 }
 function bounds(){return new THREE.Box3(V3(-2.5,...PHYS.GRAMMAR.bounds.slice(1,3)),V3(...PHYS.GRAMMAR.bounds.slice(3)));}
 return {LAYERS,defaults,enabled,groups,set,pin,unpin,update,bounds,get baseline(){return baseline;}};
})();
// Extends the pre-existing hook without changing the R1 loop contract.
layer=new Proxy(layer,{apply(target,self,args){if(GRAMMAR.LAYERS.includes(args[0]))return GRAMMAR.set({[args[0]]:args[1]});return Reflect.apply(target,self,args);}});
window.GRAMMAR=GRAMMAR;
