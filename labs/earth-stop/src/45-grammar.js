// R2: one owner for semantic layers, transitions, comparison and visual priority.
const GRAMMAR = (() => {
  const LAYERS=Object.freeze(['접선 속도의 크기','벤치마크 비교','위도에 따른 감소','관성','낮밤 경계','상대 각속도','설계 속도 한계','반복 관측']);
  const defaults=Object.freeze(Object.fromEntries(LAYERS.map((name,i)=>[name,i===0||i===1])));
  const enabled={...defaults},mix=Object.fromEntries(LAYERS.map(n=>[n,enabled[n]?1:0]));
  const groups={},ghosts={},records=[];let baseline=null,lastRun=0,recordCount=0;
  const cfg=PHYS.GRAMMAR;
  const line=(parent,color,dashed=false)=>{
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(3*257),3));
    const m=dashed?new THREE.LineDashedMaterial({color,dashSize:.022,gapSize:.016,transparent:true,depthWrite:false}):new THREE.LineBasicMaterial({color,transparent:true,depthWrite:false});
    const object=new THREE.Line(g,m);object.frustumCulled=false;parent.add(object);return object;
  };
  const points=(object,values)=>{
    const a=object.geometry.attributes.position;values.forEach((p,i)=>a.setXYZ(i,...p));a.needsUpdate=true;
    object.geometry.setDrawRange(0,values.length);if(object.material.isLineDashedMaterial)object.computeLineDistances();
  };
  const ring=(radius,cx,cy,z,start=0,end=Math.PI*2)=>Array.from({length:97},(_,i)=>[cx+Math.cos(start+(end-start)*i/96)*radius,cy+Math.sin(start+(end-start)*i/96)*radius,z]);
  const dots=(parent,count)=>{
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3));
    geometry.setAttribute('aFill',new THREE.BufferAttribute(new Float32Array(count),1));
    const material=new THREE.ShaderMaterial({uniforms:{uOpacity:{value:1},uSize:{value:8},uColor:{value:new THREE.Color(THEME.velocity)}},
      vertexShader:`attribute float aFill;varying float vFill;uniform float uSize;void main(){vFill=aFill;gl_PointSize=uSize;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`varying float vFill;uniform float uOpacity;uniform vec3 uColor;void main(){float r=length(gl_PointCoord-.5)*2.0;if(r>1.0)discard;if(vFill<.5&&r<.64)discard;gl_FragColor=vec4(uColor,uOpacity*(1.0-smoothstep(.85,1.0,r)));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,transparent:true,depthWrite:false,blending:THREE.NormalBlending});
    const object=new THREE.Points(geometry,material);object.frustumCulled=false;parent.add(object);return object;
  };
  const putDots=(object,values)=>{
    const p=object.geometry.attributes.position,f=object.geometry.attributes.aFill;
    values.forEach((d,i)=>{p.setXYZ(i,...d.point);f.setX(i,d.fill===false?0:1);});p.needsUpdate=f.needsUpdate=true;
    object.geometry.setDrawRange(0,values.length);
  };
  for(const name of LAYERS){groups[name]=new THREE.Group();HERO.add(groups[name]);ghosts[name]=new THREE.Group();HERO.add(ghosts[name]);}
  // Quantity ticks follow the real tangent. One sound-speed unit, fractional end cap.
  const endTick=line(groups[LAYERS[0]],THEME.velocity);
  const ghostShaft=KIT.mesh(new THREE.PlaneGeometry(1,cfg.lineWidth).translate(.5,0,0),speedMaterial.clone(),ghosts[LAYERS[0]]);
  ghostShaft.material.uniforms.uStyle.value=1;ghostShaft.castShadow=false;
  const ticks=Array.from({length:cfg.cap+1},()=>line(groups[LAYERS[0]],THEME.velocity));
  const breakSign=line(groups[LAYERS[0]],THEME.reference);
  const benchmark=groups[LAYERS[1]];BENCHMARK.visible=false;
  const rackOrigin=[-.54,1.4,.75],rowGap=.065;
  const symbolTextures=[];
  const benchLines=PHYS.BENCH.map((b,i)=>{
    const y=rackOrigin[1]+i*rowGap,bar=line(benchmark,THEME.reference,true),length=PHYS.quantity(b.speed).length;
    points(bar,[[rackOrigin[0],y,rackOrigin[2]],[rackOrigin[0]+length,y,rackOrigin[2]]]);
    // Code-only transport line symbols; no letters, emoji or imported pictures.
    const texture=KIT.canvasTex(96,64,c=>{
      c.strokeStyle=CSS.reference;c.lineWidth=4;c.lineCap='round';c.lineJoin='round';c.beginPath();
      if(i===0){c.arc(48,10,6,0,Math.PI*2);c.moveTo(48,18);c.lineTo(45,38);c.lineTo(31,55);c.moveTo(45,38);c.lineTo(62,55);c.moveTo(31,28);c.lineTo(48,23);c.lineTo(63,34);}
      if(i===1){for(const x of [24,70]){c.moveTo(x+16,44);c.arc(x,44,16,0,Math.PI*2);}c.moveTo(24,44);c.lineTo(43,19);c.lineTo(62,44);c.lineTo(24,44);c.moveTo(43,19);c.lineTo(65,19);c.lineTo(70,44);}
      if(i===2||i===3){c.rect(15,21,i===3?66:62,26);c.moveTo(28,21);c.lineTo(37,10);c.lineTo(60,10);c.lineTo(70,21);for(const x of [28,66]){c.moveTo(x+6,50);c.arc(x,50,6,0,Math.PI*2);}if(i===3){c.moveTo(10,59);c.lineTo(86,59);}}
      if(i===4){c.moveTo(8,32);c.lineTo(85,32);c.moveTo(56,32);c.lineTo(32,9);c.moveTo(56,32);c.lineTo(32,55);c.moveTo(17,32);c.lineTo(9,18);}
      if(i===5){for(let j=0;j<3;j++){c.moveTo(28+j*15,9);c.quadraticCurveTo(55+j*15,32,28+j*15,55);}}
      c.stroke();
    });
    symbolTextures.push(texture);
    const symbol=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
    symbol.position.set(rackOrigin[0]-.09,y,rackOrigin[2]);symbol.scale.set(.1,.067,1);benchmark.add(symbol);
    return bar;
  });
  const comparison=document.createElement('canvas');comparison.id='comparison-card';comparison.width=640;comparison.height=224;
  comparison.setAttribute('aria-hidden','true');document.body.append(comparison);const compareContext=comparison.getContext('2d');
  const compared=line(benchmark,THEME.velocity),benchTicks=Array.from({length:Math.floor(cfg.maxLength/cfg.unit)+1},()=>line(benchmark,THEME.reference,true));
  benchTicks.forEach((l,i)=>points(l,[[rackOrigin[0]+PHYS.quantity(i*PHYS.C.sound).length,1.36,.75],[rackOrigin[0]+PHYS.quantity(i*PHYS.C.sound).length,1.76,.75]]));
  const steps=PHYS.DETENTS.phi.map(()=>line(groups[LAYERS[2]],THEME.velocity));
  const equator=line(groups[LAYERS[2]],THEME.reference,true),section=line(groups[LAYERS[2]],THEME.velocity),sectionRadius=line(groups[LAYERS[2]],THEME.velocity);
  const trace=dots(groups[LAYERS[3]],cfg.traceCap+1),traceGuide=line(groups[LAYERS[3]],THEME.reference,true),stopped=line(groups[LAYERS[3]],THEME.reference,true);
  const timeSign=KIT.expansion(groups[LAYERS[5]],.36,1.49,.91);
  const lens=groups[LAYERS[4]],lensCircle=line(lens,THEME.reference),lensRay=line(lens,THEME.warm),lensEdge=line(lens,THEME.cool);
  const lensMaterial=new THREE.ShaderMaterial({uniforms:{uAngle:{value:0},uOpacity:{value:1},uNight:{value:new THREE.Color(inkConfig().diagram.lensNight)},uDay:{value:new THREE.Color(inkConfig().diagram.lensDay)}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform float uAngle,uOpacity;uniform vec3 uNight,uDay;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.0;if(length(p)>1.0)discard;float d=dot(p,vec2(cos(uAngle),sin(uAngle)));float day=step(0.0,d);vec3 c=mix(uNight,uDay,day);gl_FragColor=vec4(c,uOpacity*.9);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  KIT.mesh(new THREE.PlaneGeometry(cfg.lensRadius*2,cfg.lensRadius*2),lensMaterial,lens,0,E.y,.83).castShadow=false;
  points(lensCircle,ring(cfg.lensRadius,0,E.y,.84));
  const relative=groups[LAYERS[5]],dayDots=dots(relative,cfg.cap),spinArc=line(relative,THEME.velocity),orbitArc=line(relative,THEME.warm),netArc=line(relative,THEME.reference),dayBreak=line(relative,THEME.reference);
  const limit=groups[LAYERS[6]],limitLines=[line(limit,THEME.red,true),line(limit,THEME.red,true)],limitNow=line(limit,THEME.velocity);
  const limitLength=PHYS.quantity(PHYS.C.designSpeed).length;
  limitLines.forEach((l,i)=>points(l,[[rackOrigin[0]+limitLength+(i?1:-1)*cfg.lineWidth/4,1.37,.77],[rackOrigin[0]+limitLength+(i?1:-1)*cfg.lineWidth/4,1.82,.77]]));
  const recordBreak=line(groups[LAYERS[7]],THEME.reference);
  const recordLines=Array.from({length:cfg.recordCap},()=>line(groups[LAYERS[7]],THEME.velocity));
  const recordPins=Array.from({length:cfg.recordCap},()=>line(groups[LAYERS[7]],THEME.reference));
  const ghostLines=Object.fromEntries(LAYERS.map(n=>[n,Array.from({length:8},()=>line(ghosts[n],THEME.reference,true))]));
  const snapshot=()=>({t:S.t.value,phi:currentPhi(),P:currentPeriod(),angle:S.run?S.run.angle:S.spin.value,sun:S.sun.value,
    speed:S.run?S.run.measurement.relativeSpeed:PHYS.v(currentPhi(),currentPeriod()),
    run:S.run?{phi:S.run.phi,angle:S.run.angle,elapsed:S.run.elapsed.value,measurement:{...S.run.measurement}}:null,
    records:records.map(r=>({...r}))});
  function set(values){
    for(const [name,on] of Object.entries(values)){if(!LAYERS.includes(name))throw new RangeError(name);if(typeof on!=='boolean')throw new TypeError(name);enabled[name]=on;}
    const lenses=[LAYERS[2],LAYERS[4],LAYERS[5]].filter(n=>values[n]===true);
    if(lenses.length)for(const n of [LAYERS[2],LAYERS[4],LAYERS[5]])enabled[n]=n===lenses[lenses.length-1];
    return {...enabled};
  }
  function pin(){baseline=snapshot();return structuredClone(baseline);}
  function unpin(){baseline=null;}
  function update(dt){
    const d=snapshot(),q=PHYS.quantity(d.speed),pin=PHYS.scenePoint(d.phi,d.angle,MODEL.pinReach);
    const tangent=x=>[pin[0]+Math.cos(d.angle)*x,pin[1],pin[2]-Math.sin(d.angle)*x];
    const focus= Math.max(mix[LAYERS[4]],mix[LAYERS[2]]);
    // Finite 0.3 s linear fades continue while physics is paused.
    for(const n of LAYERS){mix[n]=clamp(mix[n]+(enabled[n]?1:-1)*dt/cfg.fade,0,1);
      groups[n].visible=mix[n]>0;ghosts[n].visible=!!baseline&&mix[n]>0;
      const priority=n===LAYERS[1]||n===LAYERS[7]?1-focus*.82:1;
      groups[n].traverse(o=>{if(o.material){if(o.material.uniforms?.uOpacity)o.material.uniforms.uOpacity.value=mix[n]*priority;
        else{o.material.transparent=true;o.material.opacity=mix[n]*priority;}}});
      ghosts[n].traverse(o=>{if(o.material)o.material.opacity=mix[n]*.58;});
    }
    speedMaterial.uniforms.uOpacity.value=mix[LAYERS[0]]*(1-focus*.65);SPEED.visible=q.length>1e-6&&mix[LAYERS[0]]>0;
    SPEED_TIP.material=tipMaterial;tipMaterial.opacity=mix[LAYERS[0]]*(1-focus*.65);
    ticks.forEach((l,i)=>{const x=PHYS.quantity(i*PHYS.C.sound).length;l.visible=i<=q.full&&x<=q.length;
      const p=tangent(x);points(l,[[p[0],p[1]-.034,p[2]],[p[0],p[1]+.034,p[2]]]);});
    breakSign.visible=q.clipped;const e=tangent(q.length);points(breakSign,[[e[0]-.035,e[1]-.04,e[2]],[e[0]+.015,e[1],e[2]],[e[0]-.035,e[1]+.04,e[2]]]);
    const ep=tangent(q.length);points(endTick,[[ep[0],ep[1]-.034,ep[2]],[ep[0],ep[1]+.034,ep[2]]]);
    comparison.style.visibility=mix[LAYERS[1]]>0?'visible':'hidden';comparison.style.opacity=String(mix[LAYERS[1]]*(1-focus*.82));
    if(innerWidth<=980&&mix[LAYERS[1]]>0){
      const c=compareContext,origin=76,scale=520/cfg.maxLength;c.clearRect(0,0,640,224);
      c.strokeStyle=CSS.velocity;c.lineWidth=5;c.setLineDash([]);c.beginPath();c.moveTo(origin,17);c.lineTo(origin+q.length*scale,17);c.stroke();
      c.strokeStyle="#393e42";c.lineWidth=2;c.setLineDash([5,5]);
      for(let i=0;i<=Math.floor(cfg.maxLength/cfg.unit);i++){const x=origin+PHYS.quantity(i*PHYS.C.sound).length*scale;c.beginPath();c.moveTo(x,6);c.lineTo(x,216);c.stroke();}
      PHYS.BENCH.forEach((b,i)=>{const y=47+i*32;c.filter="brightness(0.25)";c.drawImage(symbolTextures[i].image,8,y-14,54,28);c.filter="none";
        c.beginPath();c.moveTo(origin,y);c.lineTo(origin+PHYS.quantity(b.speed).length*scale,y);c.stroke();});
      if(baseline){c.lineWidth=3;c.beginPath();c.moveTo(origin,17);c.lineTo(origin+PHYS.quantity(baseline.speed).length*scale,17);c.stroke();}
      c.setLineDash([]);
    }
    points(compared,[[...rackOrigin],[rackOrigin[0]+q.length,rackOrigin[1],rackOrigin[2]]]);
    points(limitNow,[[rackOrigin[0],1.8,.77],[rackOrigin[0]+q.length,1.8,.77]]);
    steps.forEach((l,i)=>{const phi=PHYS.DETENTS.phi[i].phi,y=E.y+PHYS.latitudeSection(phi).height;
      points(l,[[-.5,y,.85],[-.5+PHYS.quantity(PHYS.v(phi,PHYS.C.T0)).length,y,.85]]);});
    points(equator,[[-.5,E.y,.855],[-.5+PHYS.quantity(PHYS.v(0,PHYS.C.T0)).length,E.y,.855]]);
    const sec=PHYS.latitudeSection(d.phi);points(section,ring(Math.abs(sec.radius),0,E.y,.87));
    points(sectionRadius,[[0,E.y,.87],[sec.radius,E.y,.87]]);
    const run=d.run;
    const samples=run?PHYS.traceSamples(run.phi,run.angle,run.measurement.relativeSpeed,run.elapsed,S.quality==='low'):[];
    putDots(trace,samples.filter(p=>p.visible));trace.material.uniforms.uOpacity.value=mix[LAYERS[3]]*(1-focus*.75);
    trace.material.uniforms.uSize.value=(S.quality==='low'?10:13)*(S.lineScale||1);
    points(traceGuide,run?[PHYS.tangentPoint(run.phi,run.angle,run.measurement.relativeSpeed,0),PHYS.tangentPoint(run.phi,run.angle,run.measurement.relativeSpeed,1)]:[]);
    points(stopped,run?ring(MODEL.ball*cfg.ballScale,...(()=>{const p=PHYS.tangentPoint(run.phi,run.angle,0,0);return [p[0],p[1],p[2]];})()):[]);
    const sun=-d.sun;lensMaterial.uniforms.uAngle.value=sun;
    points(lensEdge,[[Math.sin(sun)*cfg.lensRadius,E.y-Math.cos(sun)*cfg.lensRadius,.85],[-Math.sin(sun)*cfg.lensRadius,E.y+Math.cos(sun)*cfg.lensRadius,.85]]);
    points(lensRay,[[0,E.y,.86],[Math.cos(sun)*cfg.lensRadius,E.y+Math.sin(sun)*cfg.lensRadius,.86]]);
    const day=PHYS.daySamples(d.P),arcs=PHYS.relativeArcs(d.P),r=cfg.lensRadius;
    putDots(dayDots,day.points.map(p=>({point:[p.slot[0],E.y+p.slot[1],.88],fill:p.bright})));
    points(spinArc,ring(r*.72,0,E.y,.88,0,arcs.spin));points(orbitArc,ring(r*.82,0,E.y,.88,0,arcs.orbit));
    points(netArc,ring(r*.92,0,E.y,.88,0,arcs.relative));
    dayBreak.visible=day.clipped;points(dayBreak,[[r-.04,E.y-.04,.9],[r+.01,E.y,.9],[r-.04,E.y+.04,.9]]);
    if(run&&run.measurement.runId!==lastRun){lastRun=run.measurement.runId;recordCount++;records.push({...run.measurement});if(records.length>cfg.recordCap)records.shift();}
    recordBreak.visible=recordCount>cfg.recordCap;points(recordBreak,[[.5,1.87,.91],[.55,1.9,.91],[.5,1.93,.91]]);
    recordLines.forEach((l,i)=>{l.visible=!!records[i];if(!records[i])return;const y=1.45+i*.07;
      points(l,[[-.54,y,.89],[-.54+PHYS.quantity(records[i].relativeSpeed).length,y,.89]]);
      const phi=records[i].phi*PHYS.C.deg;points(recordPins[i],[[-.65,y-.02,.89],[-.65+Math.cos(phi)*.05,y+Math.sin(phi)*.05,.89]]);});
    recordPins.forEach((l,i)=>l.visible=!!records[i]);
    if(baseline){
      const b=baseline,bq=PHYS.quantity(b.speed),bp=PHYS.scenePoint(b.phi,b.angle,MODEL.pinReach);
      ghostShaft.position.copy(V3(...bp));ghostShaft.rotation.y=b.angle;ghostShaft.scale.x=bq.length;
      ghostShaft.material.uniforms.uUnit.value=bq.units;ghostShaft.material.uniforms.uOpacity.value=mix[LAYERS[0]]*.65;
      const bt=x=>[bp[0]+Math.cos(b.angle)*x,bp[1],bp[2]-Math.sin(b.angle)*x];
      for(const n of LAYERS)ghostLines[n].forEach(l=>l.visible=false);
      for(const n of [LAYERS[0],LAYERS[1],LAYERS[6]]){const l=ghostLines[n][0];l.visible=true;
        points(l,n===LAYERS[0]?[bt(0),bt(bq.length)]:[[rackOrigin[0],n===LAYERS[6]?1.8:1.4,.9],[rackOrigin[0]+bq.length,n===LAYERS[6]?1.8:1.4,.9]]);}
      for(const n of [LAYERS[2],LAYERS[4],LAYERS[5]]){const l=ghostLines[n][0];l.visible=true;
        points(l,ring(n===LAYERS[2]?Math.abs(PHYS.latitudeSection(b.phi).radius):r,0,E.y,.91));}
      const ba=PHYS.relativeArcs(b.P);const bl=ghostLines[LAYERS[5]][1];bl.visible=true;points(bl,ring(r*.92,0,E.y,.92,0,ba.relative));
      const edge=ghostLines[LAYERS[4]][1];edge.visible=true;points(edge,[[Math.sin(-b.sun)*r,E.y-Math.cos(-b.sun)*r,.92],[-Math.sin(-b.sun)*r,E.y+Math.cos(-b.sun)*r,.92]]);
      const br=ghostLines[LAYERS[2]][1];br.visible=true;points(br,[[0,E.y,.92],[PHYS.latitudeSection(b.phi).radius,E.y,.92]]);
      if(b.run){const l=ghostLines[LAYERS[3]][0];l.visible=true;points(l,[PHYS.tangentPoint(b.run.phi,b.run.angle,b.speed,0),PHYS.tangentPoint(b.run.phi,b.run.angle,b.speed,b.run.elapsed)]);}
      b.records.forEach((rec,i)=>{const l=ghostLines[LAYERS[7]][i];l.visible=true;points(l,[[-.54,1.45+i*.07,.91],[-.54+PHYS.quantity(rec.relativeSpeed).length,1.45+i*.07,.91]]);});
    }
  }
  const tipMaterial=new THREE.MeshBasicMaterial({color:THEME.velocity});tipMaterial.transparent=true;
  return {LAYERS,defaults,enabled,groups,set,pin,unpin,update,clear(){baseline=null;records.length=0;lastRun=0;recordCount=0;},get baseline(){return baseline?structuredClone(baseline):null;}};
})();
window.GRAMMAR=GRAMMAR;
