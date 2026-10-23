// R2: layer names are exactly the principle column of theory-card ?g.
const GRAMMAR = (() => {
  const defaults = Object.freeze({ '무게 크기':true, '천체 변경':true, '질량 불변':true,
    '추 개수와 무게 비례':false, '계측 한계':true, '점프 비교':false,
    '중력 방향':false, '시험 기록':false, '양의 관계':true });
  const LAYERS = Object.freeze(Object.keys(defaults)), enabled = {...defaults}, groups = {}, transitions = {}, mounts = [];
  // Metadata is consumed by later teacher tools; no description is rendered.
  const descriptions = Object.freeze({
    '무게 크기':'마디가 아래로 펼쳐지는 현재 힘 화살표',
    '천체 변경':'지구 또는 핀의 점선 힘과 과장된 반지름 윤곽',
    '질량 불변':'양팔 수평선·서로 마주 보는 화살표·같은 추 점',
    '추 개수와 무게 비례':'추 하나씩의 결과를 같은 좌표에 계단 흔적으로',
    '계측 한계':'붉은 점선 문턱·상한 끊김·과장 표식',
    '점프 비교':'같은 시간 간격 회색 점과 현재 정점·기준 정점',
    '중력 방향':'안쪽 스트릭과 원형 돋보기의 단면 선화',
    '시험 기록':'시행 점·조건 천체·추 점·정점 막대',
    '양의 관계':'콘솔의 마디 그래프·현재 커서·점선 기준' });
  for (const name of LAYERS) {
    groups[name] = new THREE.Group(); HERO.add(groups[name]);
    transitions[name] = {value:defaults[name]?1:0,from:defaults[name]?1:0,to:defaults[name]?1:0,time:0.3};
    S.layers[name] = defaults[name];
  }
  function anchor(name, rig) {
    const g = new THREE.Group(); groups[name].add(g); mounts.push({g,rig}); return g;
  }
  const marks = anchor('무게 크기',SPRING_RIG), compare = anchor('천체 변경',SPRING_RIG);
  const now = KIT.quantityArrow(marks), reference = KIT.quantityArrow(compare,true);
  for (const a of [now,reference]) a.group.position.set(-0.115,PHYS.VIEW.springTop-PHYS.VIEW.springRest,0.20);
  reference.shaft.scale.x=1.35;reference.group.position.z+=0.003;
  const compareShelf = anchor('천체 변경',SHELF_RIG);
  const radiusNow = KIT.line(Array.from({length:65},(_,k)=>V3(Math.cos(k/64*Math.PI*2),Math.sin(k/64*Math.PI*2),0)),THEME.mint,compareShelf);
  const radiusBase = KIT.line(Array.from({length:65},(_,k)=>V3(Math.cos(k/64*Math.PI*2),Math.sin(k/64*Math.PI*2),0)),THEME.reference,compareShelf,true);
  radiusNow.position.set(0,specimenView.center[1],specimenView.front);radiusBase.position.copy(radiusNow.position);
  const radiusBreak=KIT.breakMark(compareShelf,THEME.mint);radiusBreak.position.set(0.28,specimenView.center[1]+0.19,specimenView.front+0.02);
  const RADIUS_SIGN=KIT.expansion(compareShelf,-specimenView.radius-0.03,specimenView.center[1]+specimenView.radius*0.8,specimenView.front);RADIUS_SIGN.scale.setScalar(0.14);
  const mass = anchor('질량 불변',BALANCE_RIG);
  KIT.rod(V3(-0.43,2.09,0.12),V3(0.43,2.09,0.12),0.008,new THREE.MeshBasicMaterial({color:THEME.mint}),mass);
  for(const side of [-1,1]) KIT.line([V3(side*0.14,2.16,0.13),V3(0,2.16,0.13),V3(side*0.045,2.20,0.13),V3(0,2.16,0.13),V3(side*0.045,2.12,0.13)],THEME.mint,mass);
  const massDots=[-1,1].map(side=>Array.from({length:PHYS.C.maxWeights},()=>KIT.ball(PHYS.GRAMMAR_VIEW.dotRadius,new THREE.MeshBasicMaterial({color:THEME.mint}),mass,side*0.39,1.25,0.19,1)));
  const stair = anchor('추 개수와 무게 비례',SPRING_RIG);
  const steps = Array.from({length:PHYS.C.maxWeights},()=>KIT.line([V3(0,0,0),V3(0.035,0,0)],THEME.force,stair));
  const stepBreaks=steps.map(()=>{const sign=KIT.breakMark(stair,THEME.force);sign.scale.setScalar(0.28);return sign;});
  const limit = anchor('계측 한계',SPRING_RIG), limitY=PHYS.VIEW.springTop-PHYS.VIEW.springRest-PHYS.C.springLimit*PHYS.VIEW.markUnit;
  KIT.line([V3(-0.29,limitY,0.23),V3(0.29,limitY,0.23),V3(0.29,limitY+0.07,0.23),V3(-0.29,limitY+0.07,0.23),V3(-0.29,limitY,0.23)],THEME.red,limit,true);
  const overflow=KIT.breakMark(limit,THEME.force);overflow.position.set(-0.115,limitY+0.02,0.25);
  const jump=anchor('점프 비교',JUMP_RIG), jumpRef=anchor('점프 비교',JUMP_RIG);
  const trails=Array.from({length:PHYS.GRAMMAR_VIEW.trailIntervals+1},()=>KIT.ball(0.017,new THREE.MeshBasicMaterial({color:0x9aa8b0}),jump,0,0,0.12,1));
  const jumpBaseline=KIT.line([V3(-0.16,0,0.15),V3(0.16,0,0.15)],THEME.reference,jumpRef,true);
  const jumpCurrent=KIT.line([V3(-0.16,0,0.16),V3(0.16,0,0.16)],THEME.mint,jump);
  const jumpOverflow=KIT.breakMark(jump,THEME.mint);jumpOverflow.position.set(0.1,2.74,0.15);
  const field=anchor('중력 방향',SHELF_RIG), lens=new THREE.Group();lens.position.set(0,specimenView.center[1],specimenView.front);field.add(lens);
  KIT.mesh(new THREE.CircleGeometry(0.29,48),new THREE.MeshBasicMaterial({color:THEME.navy,transparent:true,opacity:0.86,depthWrite:false}),lens);
  KIT.line(Array.from({length:65},(_,k)=>V3(Math.cos(k/64*Math.PI*2)*0.29,Math.sin(k/64*Math.PI*2)*0.29,0.002)),THEME.reference,lens,true);
  for(let k=-3;k<=3;k++)for(const axis of [0,1]){
    const offset=k*0.065,reach=Math.sqrt(0.28**2-offset**2);
    KIT.line(axis?[V3(offset,-reach,0.003),V3(offset,reach,0.003)]:[V3(-reach,offset,0.003),V3(reach,offset,0.003)],THEME.cool,lens,false,0.2);
  }
  for(let k=0;k<8;k++){
    const a=k/8*Math.PI*2,dir=V3(Math.cos(a),Math.sin(a),0);
    KIT.line([dir.clone().multiplyScalar(0.25),dir.clone().multiplyScalar(0.11),V3(Math.cos(a+0.22)*0.15,Math.sin(a+0.22)*0.15,0)],THEME.force,lens);
  }
  KIT.expansion(lens,0.21,0.22,0.01);
  const fieldMaterial=new THREE.MeshBasicMaterial({color:THEME.force,transparent:true,opacity:0.15,depthWrite:false});
  const streaks=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0025,0.001,0.026,4),fieldMaterial,PHYS.GRAMMAR_VIEW.fieldCount);field.add(streaks);streaks.frustumCulled=false;
  const seed=mulberry32(457310),particles=Array.from({length:PHYS.GRAMMAR_VIEW.fieldCount},()=>({a:seed()*Math.PI*2,z:seed()*2-1,phase:seed()})),dummy=new THREE.Object3D();
  const note=anchor('시험 기록',BALANCE_RIG), records=[],seen=new Set();
  const recordOverflow=KIT.breakMark(note,THEME.mint);recordOverflow.position.set(0.49,1.25,0.31);recordOverflow.scale.setScalar(0.4);
  const rows=Array.from({length:PHYS.GRAMMAR_VIEW.recordLimit},(_,k)=>{
    const g=new THREE.Group();note.add(g);g.position.set(-0.37+k*0.24,1.25,0.31);
    const body=KIT.ball(0.023,new THREE.MeshBasicMaterial(),g,0,0,0,1);
    const dots=Array.from({length:PHYS.C.maxWeights},(_,j)=>KIT.ball(0.007,new THREE.MeshBasicMaterial({color:THEME.mint}),g,-0.035+j*0.017,-0.05,0,0));
    const bar=KIT.mesh(new THREE.BoxGeometry(0.021,1,0.01).translate(0,0.5,0),new THREE.MeshBasicMaterial({color:THEME.mint}),g,0,-0.09,0);
    const event=KIT.line([V3(-0.03,0.1,0),V3(0,0.14,0),V3(0.03,0.1,0)],THEME.mint,g);
    return {g,body,dots,bar,event};
  });
  anchor('양의 관계',CONSOLE);
  // Existing graph surfaces participate in this layer; their raster remains wordless.
  GRAPHS.forEach(g=>{g.mesh.material=g.mesh.material.clone();g.mesh.material.transparent=true;});
  let baseline=null,clock=0,lastCondition='',settle=2;
  // Reparent the existing signs into the same fading layer as their explanation.
  limit.add(SPRING_SIGN,THROUGH);jump.add(JUMP_SIGN,APEX,OPEN_ARROW);
  const ownMaterial=new Set();
  for(const root of Object.values(groups))root.traverse(o=>{if(o.material&&!ownMaterial.has(o.material)){
    // Every layer owns its fading material; never fade shared mechanical materials.
    o.material=o.material.clone();ownMaterial.add(o.material);o.material.transparent=true;o.material.userData.baseOpacity=o.material.opacity;
  }});
  // quantityArrow references must point at the owned clones.
  now.material=now.shaft.material;reference.material=reference.shaft.material;
  const snapshot=()=>PHYS.grammarState(Math.round(S.body.value),Math.round(S.nWeights.value));
  function set(values){
    for(const name of Object.keys(values))if(!LAYERS.includes(name))throw new RangeError(name);
    for(const [name,on] of Object.entries(values)){
      enabled[name]=!!on;S.layers[name]=!!on;
      document.querySelectorAll('[data-layer]').forEach(button=>{if(button.dataset.layer===name)button.setAttribute('aria-pressed',String(!!on));});
      const t=transitions[name];t.from=t.value;t.to=on?1:0;t.time=0;
    }
  }
  function pin(){baseline=JSON.parse(JSON.stringify(snapshot()));return JSON.parse(JSON.stringify(baseline));}
  function unpin(){baseline=null;}
  function resetRecords(){records.length=0;seen.clear();}
  function update(dt){
    clock+=dt;for(const {g,rig} of mounts){g.position.copy(rig.position);g.quaternion.copy(rig.quaternion);g.scale.copy(rig.scale);}
    const d=snapshot(),i=d.i,n=d.nWeights,b=baseline||PHYS.grammarState(0,n),condition=`${i}:${n}`;
    if(condition!==lastCondition){settle=0;lastCondition=condition;}else settle+=dt;
    BALANCE_ARM.rotation.z=d.scene.unloaded?0:Math.sin(settle*12)*Math.exp(-settle*5)*0.025;
    for(const name of LAYERS){const t=transitions[name];t.time=Math.min(PHYS.GRAMMAR_VIEW.transition,t.time+dt);
      const u=t.time/PHYS.GRAMMAR_VIEW.transition;t.value=t.from+(t.to-t.from)*u*u*(3-2*u);
      groups[name].visible=t.value>0;
      groups[name].traverse(o=>{if(o.material){const m=o.material,a=t.value*(name==='질량 불변'?1-0.7*transitions['시험 기록'].value:1);
        m.opacity=(m.userData.baseOpacity??1)*a;if(m.uniforms?.uOpacity)m.uniforms.uOpacity.value=a;}});
    }
    for(const [arrow,data] of [[now,d],[reference,b]]){
      arrow.shaft.scale.y=Math.max(0.00001,data.arrowLength);arrow.head.position.y=-data.arrowLength;
      arrow.group.visible=data.arrowLength>0&&(arrow!==now||S.layers.force!==false);
      const u=arrow.material.uniforms;u.uLength.value=data.arrowLength;u.uLevel.value=data.scene.forceLevel;u.uTime.value=clock;
    }
    FORCE.visible=false;THROUGH.visible=S.layers.force!==false&&i===PHYS.C.ids.neutron&&transitions['계측 한계'].value>0;
    THROUGH.material.uniforms.uLevel.value=d.scene.forceLevel;THROUGH.material.uniforms.uTime.value=clock;
    BREAK_SIGN.visible=false;overflow.visible=d.spring.broken;overflow.scale.setScalar(d.spring.broken?1.7:1);
    SPRING_SIGN.visible=d.spring.exaggerated&&transitions['계측 한계'].value>0;
    const rv=PHYS.radiusVisual(i),rb=PHYS.radiusVisual(b.i);
    radiusNow.scale.setScalar(rv.radius);radiusBase.scale.setScalar(rb.radius);radiusBase.visible=rb.radius>0;
    radiusBase.material.dashSize=0.018/(rb.radius||1);radiusBase.material.gapSize=0.012/(rb.radius||1);radiusBreak.visible=rv.clipped;
    massDots.forEach((side,k)=>side.forEach((m,j)=>{m.visible=j<n;m.position.set((k?1:-1)*0.39+d.dots[j],1.35,0.19);}));
    // Unloaded space is explicitly separated from evidence of balance.
    mass.visible=transitions['질량 불변'].value>0&&!d.scene.unloaded;
    steps.forEach((line,k)=>{line.position.set(0.05+k*0.052,PHYS.VIEW.springTop-PHYS.VIEW.springRest-d.steps[k],0.23);
      stepBreaks[k].position.copy(line.position).add(V3(0.017,0.008,0.005));stepBreaks[k].visible=PHYS.springState(i,k+1).broken;});
    const hasTrial=S.trial?.i===i&&S.trial?.nWeights===n;
    const samples=PHYS.timeDots(i);trails.forEach((m,k)=>{m.position.set(samples[k].returning?0.055:-0.055,samples[k].y,0.12);m.visible=!!hasTrial&&samples[k].time<=S.t.value;});
    jumpCurrent.position.y=d.scene.jumpApex??PHYS.VIEW.jumpBase;jumpCurrent.visible=!!hasTrial&&d.scene.jumpApex!==null;
    jumpBaseline.position.y=b.scene.jumpApex??PHYS.VIEW.jumpBase;jumpBaseline.visible=b.scene.jumpApex!==null&&transitions['점프 비교'].value>0;
    jumpOverflow.visible=!!hasTrial&&d.jump.exaggerated;JUMP_SIGN.visible=d.jump.exaggerated&&transitions['점프 비교'].value>0;
    const f=PHYS.fieldVisual(i,n,S.quality==='low');streaks.count=f.count;
    streaks.material.opacity=f.brightness*0.22*transitions['중력 방향'].value;
    for(let k=0;k<streaks.count;k++){const p=particles[k],phase=(p.phase+clock*0.2)%1,r=specimenView.radius*(1.38-phase*0.35),q=Math.sqrt(1-p.z*p.z),dir=V3(Math.cos(p.a)*q,p.z,Math.sin(p.a)*q);
      dummy.position.copy(dir).multiplyScalar(r).add(V3(...specimenView.center));dummy.quaternion.setFromUnitVectors(V3(0,1,0),dir.clone().negate());dummy.updateMatrix();streaks.setMatrixAt(k,dummy.matrix);}
    streaks.instanceMatrix.needsUpdate=true;lens.visible=i!==PHYS.C.ids.space;
    const trial=S.trial;
    if(trial&&!seen.has(trial.runId)){seen.add(trial.runId);records.push({...trial,display:PHYS.grammarState(trial.i,trial.nWeights)});if(records.length>PHYS.GRAMMAR_VIEW.recordLimit)records.shift();}
    recordOverflow.visible=seen.size>PHYS.GRAMMAR_VIEW.recordLimit;
    rows.forEach((r,k)=>{const entry=records[k];r.g.visible=!!entry;if(!entry)return;r.body.material.color.set(THEME.bodies[entry.i]);r.dots.forEach((m,j)=>m.visible=j<entry.nWeights);
      r.bar.visible=entry.height!==null;r.bar.scale.y=(entry.display.scene.jumpApex??PHYS.VIEW.jumpBase)-PHYS.VIEW.jumpBase;r.bar.scale.y*=0.12;
      r.event.visible=entry.height===null;});
    // Screens always retain the model curves; the layer only changes emphasis.
    const graphAlpha=0.65+0.35*transitions['양의 관계'].value;
    GRAPHS.forEach(g=>{g.mesh.visible=graphAlpha>0;g.mesh.material.opacity=graphAlpha;});
    for(const s of [...SELECTED,...SPECIMENS]){
      s.material.uniforms.uTime.value=clock;
      if(s.effects.userData.corona){const c=s.effects.userData.corona;c.material.uniforms.uTime.value=clock;c.material.uniforms.uOpacity.value=1-0.8*transitions['중력 방향'].value;c.geometry.setDrawRange(0,PHYS.fieldVisual(PHYS.C.ids.sun,n,S.quality==='low').count);}
    }
  }
  function bounds(){return new THREE.Box3(V3(S.vertical?-0.88:-1.70,0.84,-0.62),V3(S.vertical?1:1.62,S.vertical?3.81:2.96,0.61));}
  return {LAYERS,defaults,descriptions,enabled,groups,set,pin,unpin,resetRecords,update,bounds,get baseline(){return baseline?JSON.parse(JSON.stringify(baseline)):null;}};
})();
// Extend the hoisted R1 hook without modifying its implementation.
layer=new Proxy(layer,{apply(target,thisArg,args){if(GRAMMAR.LAYERS.includes(args[0]))return GRAMMAR.set({[args[0]]:args[1]});return Reflect.apply(target,thisArg,args);}});
window.GRAMMAR=GRAMMAR;

// R4 graph rendering replaces the R1 renderer after room construction.
// Model predictions remain visible before any recorded trial; categories are never joined.
drawGraphs = function(){
  const i=Math.round(S.body.value),n=Math.round(S.nWeights.value),b=GRAMMAR.baseline?.i??0;
  GRAPHS.forEach((g,index)=>{
    const key=`${index}:${i}:${n}:${b}:${S.trial?.runId??0}`;
    if(S.graphKeys[index]===key)return;S.graphKeys[index]=key;
    const c=g.ctx,L=52,R=724,T=22,B=214;
    c.fillStyle=THEME.screen;c.fillRect(0,0,768,256);c.strokeStyle=THEME.grid;c.lineWidth=1;
    for(let k=0;k<=10;k++){const x=L+(R-L)*k/10;c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();}
    for(let k=0;k<=6;k++){const y=T+(B-T)*k/6;c.beginPath();c.moveTo(L,y);c.lineTo(R,y);c.stroke();}
    const dot=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
    const orange='#ff9b53',mint='#64ead0';c.lineWidth=4;
    if(index===0){
      for(const ref of [true,false]){
        c.strokeStyle=ref?'#e5e7ec':orange;c.setLineDash(ref?[9,7]:[]);c.beginPath();let started=false;
        for(let k=1;k<=PHYS.C.maxWeights;k++){
          const d=PHYS.springState(ref?b:i,k),x=L+PHYS.railX(k)*(R-L),y=B-d.shownMarks/PHYS.C.springLimit*(B-T);
          if(d.broken){
            const at=L+clamp((PHYS.C.springLimit/PHYS.gRatio(ref?b:i)-1)/(PHYS.C.maxWeights-1),0,1)*(R-L);
            if(started)c.lineTo(at,T);c.stroke();c.setLineDash([]);c.beginPath();c.moveTo(at-7,T+9);c.lineTo(at+7,T-3);c.moveTo(at+4,T+9);c.lineTo(at+18,T-3);c.stroke();break;
          }
          if(started)c.lineTo(x,y);else c.moveTo(x,y);started=true;
        }c.stroke();c.setLineDash([]);
      }
      const x=L+PHYS.railX(n)*(R-L),y=B-PHYS.springState(i,n).shownMarks/PHYS.C.springLimit*(B-T);
      c.strokeStyle=orange;c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();dot(x,y,7,orange);
      for(let k=1;k<=5;k++)for(let j=0;j<k;j++)dot(L+PHYS.railX(k)*(R-L)+(j-(k-1)/2)*9,237,3,mint);
    }else{
      PHYS.BODIES.forEach((body,k)=>{
        const x=L+PHYS.bodyRailX(k)*(R-L),d=PHYS.jumpVisual(k);
        dot(x,237,6,'#'+new THREE.Color(THEME.bodies[k]).getHexString());c.strokeStyle=mint;
        if(d.shownHeight===null){c.beginPath();c.moveTo(x,B);c.lineTo(x,T);c.moveTo(x-7,T+8);c.lineTo(x,T);c.lineTo(x+7,T+8);c.stroke();return;}
        const y=B-d.shownHeight/PHYS.C.jumpViewMax*(B-T);
        // Separate vertical stems are a categorical model diagram, not trial records.
        c.beginPath();c.moveTo(x,B);c.lineTo(x,y);c.stroke();dot(x,y,6,mint);
        if(d.exaggerated){c.beginPath();c.moveTo(x+7,y+7);c.lineTo(x+17,y-3);c.stroke();}
      });
      const x=L+PHYS.bodyRailX(i)*(R-L);c.strokeStyle='#e5e7ec';c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();
    }
    g.tex.needsUpdate=true;
  });
};
