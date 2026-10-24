// Exact dictionary expressions from theory-card g. No quest state lives here.
const GRAMMAR = (() => {
  const defaults = Object.freeze({ '마디':true, '쌓아 채우기·계단':true, '문턱·한계 윤곽':true,
    '비교·겹치기':false, '숨은 구조·돋보기':false, '같은 시간 간격 흔적':false, '비교':false, '기록':false, '장력계':false, '렌즈':false, '서서히 당기기':false });
  const LAYERS=Object.freeze(Object.keys(defaults)), groups={}, transitions={};
  for(const name of LAYERS){groups[name]=new THREE.Group();HERO.add(groups[name]);
    transitions[name]={value:+defaults[name],from:+defaults[name],target:+defaults[name],elapsed:.3};}
  const state=()=>PHYS.grammarState(PHYS.kidsFromRailX(S.u.value),SPECIES_KEYS[Math.round(S.species.value)],GROUND_VALUES[Math.round(S.ground.value)],S.t.value,S.rivalN);
  let baseline=null,key='',clock=0, eventKey='',burstStart=-10;
  const records=[];
  function set(values){
    for(const [name,on]of Object.entries(values)){if(!LAYERS.includes(name)||typeof on!=='boolean')throw new RangeError(name);}
    for(const [name,on]of Object.entries(values)){const t=transitions[name];if(t.target===+on)continue;
      t.from=t.value;t.target=+on;t.elapsed=0;S.layers[name]=on;}
  }
  function clear(group){for(const child of [...group.children]){group.remove(child);child.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();}}});}}
  function ink(color,opacity=1){return new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false});}
  function outline(group,x,y,width,height,color,dashed=true,style=0){
    const line=KIT.line([V3(x,y,0),V3(x+width,y,0),V3(x+width,y+height,0),V3(x,y+height,0),V3(x,y,0)],color,group,dashed);
    if(dashed){line.material.dashSize=style?.048:.020;line.material.gapSize=style?.025:.016;}
    return line;
  }
  function cut(group,x,y,color){
    KIT.line([V3(x-.045,y-.07,.02),V3(x+.015,y-.02,.02),V3(x-.045,y+.02,.02),V3(x+.015,y+.07,.02)],color,group);
    KIT.expansion(group,x+.075,y,.02);
  }
  function arrow(group,glyph,x,y,color,dashed=false,style=0){
    // Child teams pull in opposite directions, including the stationary tie scene.
    if(S.rivalN>0&&group===groups[LAYERS[0]]&&color===INK_CFG.diagram.kids){
      const mirrored=new THREE.Group();mirrored.position.set(x+glyph.length,y,0);mirrored.scale.x=-1;
      group.add(mirrored);group=mirrored;x=0;y=0;
    }
    outline(group,x,y-.045,glyph.length,.09,color,dashed,style);
    if(!dashed){KIT.mesh(new THREE.PlaneGeometry(Math.max(.001,glyph.length),.065).translate(glyph.length/2,0,0),(()=>{const material=BARS[0].fill.material.clone();material.uniforms.uColor.value.set(color);material.uniforms.uUnit.value=glyph.unit/Math.max(.001,glyph.length);material.uniforms.uForce.value=glyph.length/PHYS.VIS.width;return material;})(),group,x,y,.007);
      KIT.line([V3(x+glyph.length-.07,y+.08,.01),V3(x+glyph.length,y,.01),V3(x+glyph.length-.07,y-.08,.01)],color,group);
      for(const tick of glyph.ticks)KIT.line([V3(x+tick,y-.05,.012),V3(x+tick,y+.05,.012)],THEME.graphite,group);
    }
    if(dashed&&color!==INK_CFG.diagram.reference){
      const mat=BARS[0].fill.material.clone();mat.uniforms.uColor.value.set(color);mat.uniforms.uStyle.value=style+1;
      mat.uniforms.uUnit.value=glyph.unit/Math.max(.001,glyph.length);mat.uniforms.uForce.value=glyph.length/PHYS.VIS.width;
      KIT.mesh(new THREE.PlaneGeometry(Math.max(.001,glyph.length),.018),mat,group,x+glyph.length/2,y,.006);
    }
    if(glyph.compressed)cut(group,x+glyph.length-.07,y,color);
  }
  // One shared coordinate system for now, thresholds, and pinned outlines.
  const origins=[[-2.77,1.92],[.24,1.92]];
  for(const name of LAYERS)groups[name].position.z=.72;
  function rebuild(d){
    for(const group of Object.values(groups))clear(group);
    if(S.pullMode)drawStaticPull(d);
    else{
    origins.forEach(([x,y],i)=>{
      const color=i?(S.rivalN>0?INK_CFG.diagram.rival:INK_CFG.diagram.dino):INK_CFG.diagram.kids;
      arrow(groups[LAYERS[0]],d.forces[i],x,y,color);
      for(const [offset,forceIndex,c,style]of [[.23,i?4:2,INK_CFG.diagram.muscle,0],[.43,i?5:3,INK_CFG.diagram.friction,1]]){
        arrow(groups[LAYERS[2]],d.forces[forceIndex],x,y+offset,c,true,style);
        const limit=d.forces[forceIndex].length;
        const band=outline(groups[LAYERS[2]],x+limit-.018,y-.08,.036,.17,0xe77678,true,1);
        band.material.opacity=.7;
      }
      if(baseline)arrow(groups[LAYERS[3]],baseline.forces[i],x,y,INK_CFG.diagram.reference,true,1);
    });
    if(baseline)outline(groups[LAYERS[3]],baseline.flagX,PHYS.SCENE.top+.41,.22,.18,INK_CFG.diagram.reference,true,1);
    // Additive team staircase. Positions of unit boundaries use the same force mapping.
    const g=groups[LAYERS[1]];
    for(let i=0;i<d.n;i++){
      const p=PHYS.dramaChild(d.n,i);
      if(i%10===0){const band=KIT.mesh(new THREE.BoxGeometry(.018,.015,.19),ink(THEME.bone),g,p.x,PHYS.DRAMA.ground,p.z-.72);band.rotation.y=.15;}
    }
    const count=d.forces[0].count;
    for(let i=0;i<count;i++){
      const a=PHYS.forceGlyph(i*PHYS.kidCap(1,d.mu)).length,b=PHYS.forceGlyph((i+1)*PHYS.kidCap(1,d.mu)).length;
      KIT.mesh(new THREE.PlaneGeometry(Math.max(.001,b-a-.006),.035),ink(INK_CFG.diagram.kids),g,-2.77+(a+b)/2,1.76+i/count*.075,.01);
    }
    if(d.n>count)cut(g,-2.77+d.forces[0].length-.07,1.77,INK_CFG.diagram.kids);
    // Magnified contact section. Grid + pale sole + rough surface + emissive contacts.
    const lens=groups[LAYERS[4]],lx=-3.05,ly=2.70,w=PHYS.VIS.lensWidth,h=PHYS.VIS.lensHeight;
    KIT.mesh(new THREE.PlaneGeometry(w,h),ink(INK_CFG.diagram.screen),lens,lx+w/2,ly+h/2,-.01);
    outline(lens,lx,ly,w,h,INK_CFG.diagram.ink,false);
    for(let i=1;i<8;i++)KIT.line([V3(lx+w*i/8,ly,0),V3(lx+w*i/8,ly+h,0)],INK_CFG.diagram.grid,lens);
    for(let i=1;i<4;i++)KIT.line([V3(lx,ly+h*i/4,0),V3(lx+w,ly+h*i/4,0)],INK_CFG.diagram.grid,lens);
    KIT.mesh(new THREE.PlaneGeometry(w*.75,.12),ink(INK_CFG.diagram.screen),lens,lx+w/2,ly+.40,.01);
    const points=Array.from({length:65},(_,i)=>V3(lx+i*w/64,ly+.22+Math.sin(i*2.3)*d.roughness,.02));
    KIT.line(points,INK_CFG.diagram.reference,lens);
    for(let i=1;i<8;i++){const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
      uniforms:{uTime:{value:0},uMu:{value:d.mu},uOpacity:{value:1},uColor:{value:new THREE.Color(INK_CFG.diagram.friction)}},
      vertexShader:'varying float vShade;void main(){vShade=.55+.45*normal.z;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`uniform float uTime,uMu,uOpacity;uniform vec3 uColor;varying float vShade;
      void main(){float pulse=1.+.12*sin(uTime*3.+uMu*9.);gl_FragColor=vec4(uColor*(.85+.15*step(.5,vShade))*pulse,uOpacity*.8);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`});
      KIT.ball(.015,mat,lens,lx+i*w/8,ly+.27,.025,0);}
    KIT.line([V3(lx+w,ly,0),V3(d.slipX,PHYS.SCENE.top+.16,-.72)],INK_CFG.diagram.reference,lens,true);
    KIT.expansion(lens,lx+w-.1,ly+h-.1,.025);
    // Same-weight ratio comparison uses a linear dimensionless scale.
    const compare=groups[LAYERS[6]];
    for(const [j,species]of [SPECIES_KEYS[0],d.species].entries()){
      const x=-2.6+j*.65,y=2.73;
      outline(compare,x,y,.27,PHYS.VIS.ratioHeight,INK_CFG.diagram.reference,true);
      const ratio=PHYS.grammarState(1,species,d.mu,0,S.rivalN).ratioLength;
      KIT.mesh(new THREE.PlaneGeometry(.20,ratio),ink(INK_CFG.diagram.muscle),compare,x+.135,y+ratio/2,.01);
      for(let k=1;k<10;k++)KIT.line([V3(x,y+PHYS.VIS.ratioHeight*k/10,.02),V3(x+.27,y+PHYS.VIS.ratioHeight*k/10,.02)],THEME.graphite,compare);
    }
    const log=groups[LAYERS[7]];
    for(const [j,r]of records.entries()){
      const x=-2.7+j*.66,y=2.67;
      outline(log,x,y,.59,.72,INK_CFG.diagram.reference,true);
      KIT.ball(.035,ink(INK_CFG.diagram.kids),log,x+.1,y+.57,.01,0);
      KIT.mesh(new THREE.PlaneGeometry(.18,.045),ink(groundColors[GROUND_VALUES.indexOf(r.mu)]),log,x+.13,y+.40,.01);
      if(r.rivalN>0){
        for(let k=0;k<Math.min(r.rivalN,PHYS.C.rivalMax);k++)KIT.ball(.016,ink(INK_CFG.diagram.rival),log,x+.27+k%5*.045,y+.35+Math.floor(k/5)*.045,.01,0);
      }else{
        const specimen=DINO_MODELS[r.speciesIndex].clone(true);
        specimen.traverse(o=>{if(o.geometry)o.geometry=o.geometry.clone();if(o.material)o.material=o.material.clone();});
        specimen.position.set(x+.37,y+.36,0);specimen.scale.setScalar(.13);log.add(specimen);
      }
      for(const i of [0,1])KIT.mesh(new THREE.PlaneGeometry(r.forces[i].length*.20,.035),ink(i?(r.rivalN>0?INK_CFG.diagram.rival:INK_CFG.diagram.dino):INK_CFG.diagram.kids),log,x+.04+r.forces[i].length*.10,y+.12+i*.10,.02);
      // Changed conditions have a solid border around their specimen slot.
      if(baseline&&(r.n!==baseline.n||r.rivalN!==baseline.rivalN||r.species!==baseline.species||r.mu!==baseline.mu))outline(log,x+.02,y+.32,.55,.36,INK_CFG.diagram.kids,false);
    }
    drawTensionMeters(groups['장력계'],PHYS.tensionOf(d.n,d.species,S.rivalN,d.mu));
    if(S.rivalN>0&&S.lens)drawLens(d);
    }
    // Capture intrinsic opacity once, including deliberately translucent panels.
    for(const group of Object.values(groups))group.traverse(o=>{if(o.material){o.material.transparent=true;o.material.userData.alpha=o.material.opacity;}});
  }
  function drawLens(d){
    const group=groups['렌즈'],f=PHYS.lensForces(d.n,d.species,S.rivalN,d.mu,S.lens);
    const teamX=n=>{const a=PHYS.dramaChild(n,0),b=PHYS.dramaChild(n,n-1);return (a.x+b.x)/2;};
    const x=S.lens==='rope'?0:S.lens==='A'?teamX(d.n):-teamX(S.rivalN);
    const y=S.lens==='rope'?PHYS.DRAMA.ropeY+.30:PHYS.DRAMA.ground+PHYS.DRAMA.kidHeight+.55;
    const LENS_SCALE=PHYS.VIS.forceDetailScale; // 렌즈 화살표는 아이 팀 크기에서도 읽히도록 키운다(물체끼리 비율은 그대로)
    function directed(dir,value,y,color,dashed=false,origin=x){
      const g=new THREE.Group();group.add(g);g.position.set(origin,y,.3);g.scale.set(dir*LENS_SCALE,LENS_SCALE,1);
      const glyph=PHYS.forceGlyph(value);arrow(g,glyph,0,0,color,dashed,1);
      if(dashed)KIT.line([V3(glyph.length-.07,.08,.01),V3(glyph.length,0,.01),V3(glyph.length-.07,-.08,.01)],color,g,true);
    }
    for(const a of f.arrows)directed(a.dir,a.value,y+(a.kind==='friction'?.22:0),a.kind==='pull'?INK_CFG.diagram.pull:INK_CFG.diagram.friction,false,S.lens==='rope'?a.dir*.12:x);
    if(f.balanced)KIT.mesh(new THREE.TorusGeometry(.14,.026,6,24),ink(INK_CFG.diagram.ink),group,x,y+(S.lens==='rope'?0:.28),.3);
    else directed(Math.sign(f.sum),Math.abs(f.sum),y+.43,INK_CFG.diagram.ink,true);
  }
  function drawStaticPull(d){
    // 유리 위 5명의 힘은 전체 눈금에서 아주 작으므로, 한계 눈금이 화면에서 읽히는 길이(LIMIT_LENGTH)가 되도록 길이만 늘린다. 두께와 머리는 그대로.
    const group=groups['서서히 당기기'],f=PHYS.staticPull(d.n,d.mu,S.pullP),LIMIT_LENGTH=1.6;
    const k=LIMIT_LENGTH/PHYS.forceGlyph(f.limit).length,x=-1.8,y=PHYS.DRAMA.ground+PHYS.DRAMA.kidHeight+.6;
    const stretch=value=>{const glyph=PHYS.forceGlyph(value);return {...glyph,length:glyph.length*k,ticks:[]};};
    for(const [dir,value,color,dy] of [[1,f.applied,INK_CFG.diagram.dino,0],[-1,f.friction,INK_CFG.diagram.friction,.3]]){
      const g=new THREE.Group();group.add(g);g.position.set(x,y+dy,.3);g.scale.set(dir,2,1);
      if(value>0)arrow(g,stretch(value),0,0,color);
    }
    const limitX=x-LIMIT_LENGTH;
    KIT.line([V3(limitX,y+.3-.2,.32),V3(limitX,y+.3+.2,.32)],INK_CFG.diagram.friction,group,true);
  }
  // Seeded, additive force streaks; density is schematic display force, never rope flow.
  const stream= new THREE.Group();HERO.add(stream);
  const seed=mulberry32(450073),particles=Array.from({length:PHYS.VIS.streamCount},()=>({phase:seed(),height:seed()}));
  const streakMat=new THREE.MeshBasicMaterial({color:INK_CFG.diagram.kids,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false});
  const streaks=new THREE.InstancedMesh(new THREE.PlaneGeometry(.035,.008),streakMat,particles.length);stream.add(streaks);streaks.frustumCulled=false;
  const dustMat=new THREE.MeshStandardMaterial({color:THEME.sand,transparent:true,opacity:0,emissive:INK_CFG.diagram.friction,emissiveIntensity:.15});
  const dust=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.018,0),dustMat,PHYS.VIS.dustCount);HERO.add(dust);dust.frustumCulled=false;
  const dummy=new THREE.Object3D();
  
  // Trail gets rebuilt only on state change, then updated without allocating geometry.
  function update(dt){
    clock+=dt;const d=state(),next=[S.pullMode,S.pullP,S.lens,d.n,S.rivalN,d.speciesIndex,d.mu,baseline?.n,baseline?.species,baseline?.mu,records.length].join(':');
    if(next!==key){rebuild(d);key=next;
      // Reattach after group disposal; no retained GPU objects from earlier rebuilds.
      for(let i=0;i<PHYS.VIS.trailCount;i++)KIT.ball(.018,ink(THEME.gravel,.7),groups[LAYERS[5]],0,PHYS.SCENE.top+.35,-.64,0);
    }
    const event=[d.n,d.speciesIndex,d.mu].join(':');
    if(event!==eventKey){eventKey=event;}
    const lensActive=S.rivalN>0&&S.lens&&transitions['렌즈'].target>0;
    const pulling=S.playing.target>0||DIRECTOR.eventLeft>0;
    if(d.slip&&pulling&&S.t.value<.15)burstStart=clock;
    if(d.slip&&DIRECTOR.eventLeft>0&&clock-burstStart>1.1)burstStart=clock;
    for(const [name,t]of Object.entries(transitions)){
      t.elapsed=Math.min(.3,t.elapsed+dt);const u=t.elapsed/.3;t.value=t.from+(t.target-t.from)*u*u*(3-2*u);
      const priority=name===LAYERS[6]?(1-transitions[LAYERS[4]].value)*(1-transitions[LAYERS[7]].value):name===LAYERS[7]?1-transitions[LAYERS[4]].value:1;
      const alpha=t.value*priority*(DIRECTOR.eventLeft>0?.18:1),group=groups[name];group.visible=!((lensActive||S.pullMode)&&[LAYERS[0],LAYERS[2],LAYERS[3]].includes(name))&&!(S.pullMode&&name===LAYERS[1])&&!(name==='서서히 당기기'&&!S.pullMode)&&alpha>0&&group.children.length>0&&!(DIRECTOR.eventLeft>0&&name===LAYERS[4]);
      group.position.y=(1-t.value)*.035;
      group.traverse(o=>{if(o.material){o.material.opacity=(o.material.userData.alpha??1)*alpha;if(o.material.uniforms?.uTime)o.material.uniforms.uTime.value=clock;if(o.material.uniforms?.uOpacity)o.material.uniforms.uOpacity.value=alpha;}});
    }
    groups[LAYERS[5]].children.forEach((o,i)=>{o.position.x=d.traces[i]??0;});
    const opacity=transitions[LAYERS[0]].value*(1-.80*transitions[LAYERS[4]].value);
    stream.visible=!lensActive&&!S.pullMode;streakMat.opacity=.4*opacity;streaks.count=S.quality==='low'?particles.length/2:particles.length;
    for(let i=0;i<streaks.count;i++){
      const p=particles[i],side=i%2,glyph=d.forces[side],origin=origins[side];
      dummy.position.set(origin[0]+((p.phase+clock*(.1+d.streamDensity*.2))%1)*glyph.length,origin[1]+(p.height-.5)*.06,.765);
      dummy.scale.setScalar(p.height<.2+d.streamDensity?1:0);dummy.updateMatrix();streaks.setMatrixAt(i,dummy.matrix);streaks.setColorAt(i,new THREE.Color(side?(S.rivalN>0?INK_CFG.diagram.rival:INK_CFG.diagram.dino):INK_CFG.diagram.kids));
    }
    streaks.instanceMatrix.needsUpdate=true;streaks.instanceColor.needsUpdate=true;
    const age=clock-burstStart,burst=!S.pullMode&&d.slip&&age<1.1;
    dust.visible=burst;dust.count=S.quality==='low'?PHYS.VIS.dustCount/2:PHYS.VIS.dustCount;dustMat.opacity=burst?(1-age/1.1)*(.7-.45*transitions[LAYERS[4]].value):0;
    for(let i=0;burst&&i<dust.count;i++){
      const a=particles[i].phase*Math.PI*2,r=age*(.28+particles[i].height*.35);
      dummy.position.set(d.slipX+Math.cos(a)*r,PHYS.SCENE.top+.15+Math.sin(age/1.1*Math.PI)*particles[i].height*.22,Math.sin(a)*r);
      dummy.scale.setScalar(d.mu===GROUND_VALUES[2]?2.8:1.8);dummy.updateMatrix();dust.setMatrixAt(i,dummy.matrix);
    }
    dust.instanceMatrix.needsUpdate=true;
    // Replace R1 fills with this layer's same-position calibrated arrows.
    CAPACITIES.visible=S.layers.capacities===true&&!lensActive&&!S.pullMode;
  }
  function pin(){baseline=structuredClone(state());set({[LAYERS[3]]:true});key='';return structuredClone(baseline);}
  function unpin(){baseline=null;set({[LAYERS[3]]:false});key='';}
  function record(){records.push(structuredClone(state()));if(records.length>PHYS.VIS.recordCap)records.shift();key='';return records.length;}
  return { LAYERS, defaults, set, update, pin, unpin, record,
    clearRecords(){records.length=0;key='';},
    get baseline(){return baseline?structuredClone(baseline):null;},
    get enabled(){return Object.fromEntries(LAYERS.map(n=>[n,!!transitions[n].target]));} };
})();
