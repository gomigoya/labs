// Shared scenery dimensions, densities and display timing.
const SCENERY = Object.freeze({seed:731027, fadeSeconds:0.85, radius:18, groundSize:64, groundY:PHYS.VIEW.top, shadowLift:0.001,
  hills:14, hillsLow:7, rocks:42, rocksLow:14, stars:160, starsLow:60, dust:72, dustLow:24,
  horizonZ:-9, rockInner:2.6, rockOuter:10, dustHeight:1.6, dustExtent:7,
  drift:0.035, fallScale:0.38, fallCap:8,
  orbPosition:[-5.5,4.3,-10], orbRadius:1.05, antenna:[-1.64,0.84,-0.39], antennaTip:[-1.64,1.43,-0.39],
  hillSide:3.8, hillSpread:7, hillDepth:5, hillSize:2, hillHeight:1.5,
  cloudHeight:0.25, iceHeight:1.7, rockSize:[0.04,0.23],
  volcano:[0.35,2.9,1.5], volcanoPosition:[-4.8,0.58,-10],
  rings:[8,9], ringsPosition:[0,5,-12], arc:[2,0.07], arcPosition:[-5,0.05,-9],
  beam:[0.28,6], beamPosition:[-6,2.7,-11], anchorRadius:0.09,
  antennaRadius:0.012, dish:[0.09,0.045], stakeRadius:0.026,
  contacts:{spring:{xs:[-0.30,0.30],z:-0.22,y:0.94,width:0.66},
    shelf:{xs:[0],z:0,y:0.91,width:0.38},balance:{xs:[0],z:0,y:0.94,width:0.38},
    jump:{xs:[-0.19,0.19],z:-0.12,y:1.0,width:0.44}},
  railThickness:0.04, railDepth:0.06, stoneScale:[1,0.45,1], stoneLift:0.3,
  spindleHeight:0.08});
// Panel-local coordinates: drawing, picking and drag math share this one layout.
const CONTROL_LAYOUT=Object.freeze({position:[0,1.04,0.96],tilt:-1.0,
  panel:[1.28,0.64,0.025],legRadius:0.018,feet:[[-0.30,0,0.20],[0.30,0,0.20],[0,0,-0.22]],
  dial:{at:[-0.43,0.07,0.025],hit:[0.38,0.38,0.16]},
  graphs:[{at:[0.20,0.19,0.025],size:[0.68,0.16]},{at:[0.20,-0.02,0.025],size:[0.68,0.16]}],
  slider:{at:[0.15,-0.22,0.025],width:0.62,hit:[0.76,0.19,0.15]},
  run:{at:[-0.43,-0.22,0.025],hit:[0.28,0.29,0.17]},
  sound:{at:[0.55,-0.22,0.025],hit:[0.13,0.17,0.14]}});
const GROUND_HARDWARE=[],SPACE_HARDWARE=[];
const contactMaterial=new THREE.MeshToonMaterial({color:inkConfig().worldScenery.earth.ground,flatShading:true});
// sky / haze / ground / relief / terrain / floating body / cloud cover / stars.
// Gas giants and stellar scenes are schematic observation sites, not habitable surfaces.
const WORLD_SCENERY = inkConfig().worldScenery;
function buildEnvironment() {
  const seeded=mulberry32(SCENERY.seed), dummy=new THREE.Object3D();
  const rows=PHYS.BODIES.map(body=>WORLD_SCENERY[body.id]);
  const weights=rows.map((_,i)=>i===S.body.target?1:0);
  let time=0, fallPhase=0;
  const uniforms={uSky:{value:new THREE.Color()},uHaze:{value:new THREE.Color()},uGround:{value:new THREE.Color()},
    uTime:{value:0},uCloud:{value:0},uCrater:{value:0},uIce:{value:0},uPlasma:{value:0},uVoid:{value:0}};
  const vertex=`varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
  const colorOutput=`\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n`;
  const skyMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms,
    vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*vec4(mat3(viewMatrix)*position,1.0);}`,
    fragmentShader:`uniform vec3 uSky,uHaze;uniform float uTime,uCloud;varying vec3 vP;
      void main(){vec3 p=normalize(vP);float h=step(0.18,p.y);
        float bands=sin(p.y*45.0+sin(p.x*8.0+uTime*0.025)*1.2);
        float storm=sin(length((p.xy-vec2(-0.3,0.13))*vec2(1.0,2.5))*60.0-uTime*0.08);
        vec3 c=mix(uHaze,uSky,h)*(1.0+uCloud*(step(0.3,bands)*0.04+step(0.5,storm)*0.02));
        gl_FragColor=vec4(c,1.0);${colorOutput}}`});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(SCENERY.radius,32,16),skyMaterial);sky.frustumCulled=false;ROOM.add(sky);
  const surfaceMaterial=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,
    fragmentShader:`uniform vec3 uGround,uHaze;uniform float uTime,uCloud,uCrater,uIce,uPlasma,uVoid;varying vec3 vP;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){vec2 p=vP.xz;
        vec2 tile=floor(p/2.4),q=fract(p/2.4)-0.5;
        vec2 center=vec2(hash(tile),hash(tile+4.0))*0.28-0.14;
        float d=length(q-center),r=0.13+hash(tile+9.0)*0.12;
        float crater=exp(-pow((d-r)*55.0,2.0))*0.17-exp(-pow(d/r,4.0))*0.2;
        float bands=sin(p.y*3.5+sin(p.x*0.65+uTime*0.025)*1.7);
        float cells=pow(abs(sin(p.x*2.0+sin(p.y*3.0))*sin(p.y*2.7)),8.0);
        float terrain=uCrater*crater+uCloud*bands*0.14+uIce*abs(sin(p.x*2.0+p.y))*0.08+uPlasma*cells*0.2;
        float band=step(-0.04,terrain)+step(0.08,terrain);
        vec3 c=uGround*mix(vec3(${inkConfig().dark.join(',')}),mix(vec3(${inkConfig().mid.join(',')}),vec3(${inkConfig().light.join(',')}),step(1.5,band)),step(0.5,band));
        c=mix(c,uHaze,step(16.0,length(p))*0.55);
        gl_FragColor=vec4(c,1.0-uVoid);${colorOutput}}`,transparent:true,depthWrite:true});
  const surface=new THREE.Mesh(new THREE.PlaneGeometry(SCENERY.groundSize,SCENERY.groundSize).rotateX(-Math.PI/2),surfaceMaterial);
  surface.position.y=SCENERY.groundY;surface.renderOrder=-1;surface.receiveShadow=true;ROOM.add(surface);
  // ShadowMaterial supplies the real light shadow over the procedural ground shader.
  const shadowMaterial=new THREE.ShadowMaterial({color:inkConfig().shadow,opacity:inkConfig().shadowOpacity,depthWrite:false});
  const shadowGround=new THREE.Mesh(surface.geometry,shadowMaterial);
  shadowGround.position.y=SCENERY.groundY+SCENERY.shadowLift;shadowGround.receiveShadow=true;ROOM.add(shadowGround);
  // Depth-only twin of the shader ground: the ink pass skips ShaderMaterial, so apparatus silhouettes need this to read against the ground.
  const groundDepth=new THREE.Mesh(surface.geometry,new THREE.MeshBasicMaterial({colorWrite:false,polygonOffset:true,polygonOffsetFactor:2,polygonOffsetUnits:4}));
  groundDepth.position.y=SCENERY.groundY;groundDepth.renderOrder=-2;ROOM.add(groundDepth);
  const hillGeometry=new THREE.IcosahedronGeometry(1,0),rockGeometry=new THREE.IcosahedronGeometry(1,0),grassGeometry=new THREE.ConeGeometry(0.4,2,3);
  const orbGeometry=new THREE.IcosahedronGeometry(SCENERY.orbRadius,2);
  const sets=rows.map((row,i)=>{
    const root=new THREE.Group();root.position.y=SCENERY.groundY;ROOM.add(root);
    const material=new THREE.MeshStandardMaterial({color:row.relief,flatShading:true,transparent:weights[i]<1,opacity:weights[i],depthWrite:weights[i]===1});
    const hills=new THREE.InstancedMesh(hillGeometry,material,SCENERY.hills);
    const rocks=new THREE.InstancedMesh(row.terrain==='mountains'?grassGeometry:rockGeometry,material,SCENERY.rocks);
    root.add(hills,rocks);hills.receiveShadow=rocks.receiveShadow=true;hills.userData.inkSkip=true;rocks.userData.inkInner=false;
    const local=mulberry32(SCENERY.seed+i);
    for(let k=0;k<SCENERY.hills;k++){
      const x=(k%2?-1:1)*(SCENERY.hillSide+local()*SCENERY.hillSpread),z=SCENERY.horizonZ-local()*SCENERY.hillDepth;
      const cloud=row.terrain==='clouds',height=cloud?SCENERY.cloudHeight:row.terrain==='ice'?SCENERY.iceHeight:0.5+local()*SCENERY.hillHeight;
      dummy.position.set(x,-0.1,z);dummy.scale.set(SCENERY.hillSize*(1+local()),height,SCENERY.hillHeight+local()*SCENERY.hillSize);dummy.rotation.set(0,local()*Math.PI,0);dummy.updateMatrix();hills.setMatrixAt(k,dummy.matrix);
    }
    for(let k=0;k<SCENERY.rocks;k++){
      const a=local()*Math.PI*2,r=SCENERY.rockInner+local()*(SCENERY.rockOuter-SCENERY.rockInner),size=SCENERY.rockSize[0]+local()*(SCENERY.rockSize[1]-SCENERY.rockSize[0]);
      dummy.position.set(Math.cos(a)*r,size*0.3,Math.sin(a)*r);dummy.scale.set(size,size*(row.terrain==='ice'?2.5:0.7),size);
      dummy.rotation.set(local(),local()*Math.PI,local());dummy.updateMatrix();rocks.setMatrixAt(k,dummy.matrix);
    }
    hills.instanceMatrix.needsUpdate=rocks.instanceMatrix.needsUpdate=true;
    hills.visible=!['void','plasma','crust'].includes(row.terrain);rocks.visible=!['void','clouds','plasma'].includes(row.terrain);
    if(row.terrain==='volcano'){
      const volcano=new THREE.Mesh(new THREE.CylinderGeometry(...SCENERY.volcano,10),material);volcano.position.set(...SCENERY.volcanoPosition);root.add(volcano);
    }
    let orbMaterial=null;
    if(row.orb){
      const earth=row.orb==='earth';
      orbMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
        uniforms:{uOpacity:{value:weights[i]},uEarth:{value:earth?1:0},uColor:{value:new THREE.Color(earth?0x42799c:row.orb==='io'?0xa39769:row.orb==='titan'?0xa48b61:0x7b8289)}},
        vertexShader:`varying vec3 vN,vP;void main(){vN=normal;vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader:`uniform float uOpacity,uEarth;uniform vec3 uColor;varying vec3 vN,vP;
          void main(){vec3 n=normalize(vP);float land=sin(n.x*15.0+sin(n.y*13.0))*cos(n.z*11.0+n.y*6.0);
            vec3 c=mix(uColor,vec3(0.25,0.39,0.32),uEarth*smoothstep(0.05,0.4,land));
            c=mix(c,vec3(0.65,0.71,0.74),uEarth*smoothstep(0.77,0.94,abs(n.y)));
            float facing=dot(normalize(vN),normalize(vec3(-0.5,0.6,1.0)));c*=facing<0.0?0.5:(facing<0.55?0.83:1.06);
            gl_FragColor=vec4(c,uOpacity);${colorOutput}}`});
      const orb=new THREE.Mesh(orbGeometry,orbMaterial);orb.position.set(...SCENERY.orbPosition);
      if(row.orb==='phobos')orb.scale.set(0.3,0.23,0.27);root.add(orb);
    }
    if(PHYS.BODIES[i].id==='saturn'){
      const rings=new THREE.Mesh(new THREE.RingGeometry(...SCENERY.rings,64),material);rings.position.set(...SCENERY.ringsPosition);rings.rotation.set(0.3,0,0.25);root.add(rings);
    }
    if(row.terrain==='plasma'){
      const arc=new THREE.Mesh(new THREE.TorusGeometry(...SCENERY.arc,4,32,Math.PI),material);arc.position.set(...SCENERY.arcPosition);root.add(arc);
    }
    if(row.terrain==='crust'){
      const beam=new THREE.Mesh(new THREE.ConeGeometry(...SCENERY.beam,8,1,true),material);beam.position.set(...SCENERY.beamPosition);beam.rotation.z=-0.22;root.add(beam);
    }
    return {root,material,hills,rocks,orbMaterial};
  });
  const starGeometry=new THREE.BufferGeometry(),starPositions=[];
  for(let k=0;k<SCENERY.stars;k++){
    const a=seeded()*Math.PI*2,h=0.12+seeded()*0.85,r=SCENERY.radius*0.9;
    starPositions.push(Math.cos(a)*Math.sqrt(1-h*h)*r,h*r,Math.sin(a)*Math.sqrt(1-h*h)*r);
  }
  starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
  const starMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    uniforms:{uOpacity:{value:0}},
    vertexShader:`void main(){gl_Position=projectionMatrix*vec4(mat3(viewMatrix)*position,1.0);gl_PointSize=1.4;}`,
    fragmentShader:`uniform float uOpacity;void main(){gl_FragColor=vec4(0.88,0.90,0.82,uOpacity);${colorOutput}}`});
  const stars=new THREE.Points(starGeometry,starMaterial);stars.frustumCulled=false;ROOM.add(stars);
  const dustGeometry=new THREE.BufferGeometry(),dustPositions=[];
  for(let k=0;k<SCENERY.dust;k++)dustPositions.push((seeded()-0.5)*SCENERY.dustExtent,seeded(),(seeded()-0.5)*SCENERY.dustExtent);
  dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dustPositions,3));
  const dustMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    uniforms:{uTime:{value:0},uFall:{value:0},uHeight:{value:SCENERY.dustHeight},uDrift:{value:SCENERY.drift},uColor:{value:new THREE.Color()}},
    vertexShader:`uniform float uTime,uFall,uHeight,uDrift;void main(){vec3 p=position;p.y=(1.0-fract(position.y+uFall))*uHeight;p.x+=sin(uTime*0.2+position.z)*uDrift;vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(12.0/-mv.z,1.0,2.2);}`,
    fragmentShader:`uniform vec3 uColor;void main(){float a=step(length(gl_PointCoord-0.5),0.45)*0.24;gl_FragColor=vec4(uColor,a);${colorOutput}}`});
  const dust=new THREE.Points(dustGeometry,dustMaterial);dust.position.y=SCENERY.groundY;ROOM.add(dust);
  // Contact hardware is environmental so it cannot expand the apparatus camera bounds.
  const metal=new THREE.MeshStandardMaterial({color:0x697b85});
  KIT.rod(V3(...SCENERY.antenna),V3(...SCENERY.antennaTip),SCENERY.antennaRadius,metal,ROOM);
  KIT.mesh(new THREE.ConeGeometry(...SCENERY.dish,8,1,true),metal,ROOM,...SCENERY.antennaTip).rotation.z=-0.6;
  const colorKeys=[['paper','uSky'],['haze','uHaze'],['ground','uGround']];
  const palettes=rows.map(row=>Object.fromEntries(colorKeys.map(([key])=>[key,new THREE.Color(row[key])])));
  const dustTint=new THREE.Color(inkConfig().diagram.reference);
  const fallSpeeds=rows.map((_,i)=>Math.min(SCENERY.fallCap,Math.sqrt(Math.log1p(PHYS.g(i)/PHYS.g(PHYS.C.ids.earth)))));
  return {update(dt){
    time+=dt;const target=S.body.target,k=1-Math.exp(-dt*6/SCENERY.fadeSeconds);
    weights.forEach((v,i)=>weights[i]=v+((i===target?1:0)-v)*k);
    if(weights[target]>0.9999)weights.fill(0),weights[target]=1;
    for(const [key,u]of colorKeys){uniforms[u].value.setRGB(0,0,0);
      rows.forEach((_,i)=>{const c=palettes[i][key],out=uniforms[u].value;out.r+=c.r*weights[i];out.g+=c.g*weights[i];out.b+=c.b*weights[i];});}
    const sum=fn=>rows.reduce((v,row,i)=>v+fn(row,i)*weights[i],0);
    uniforms.uTime.value=time;uniforms.uCloud.value=sum(row=>row.cloud);
    uniforms.uCrater.value=sum(row=>row.terrain==='craters'?1:0);
    uniforms.uIce.value=sum(row=>row.terrain==='ice'?1:0);
    uniforms.uPlasma.value=sum(row=>row.terrain==='plasma'?1:0);
    uniforms.uVoid.value=sum(row=>row.terrain==='void'?1:0);
    surface.visible=shadowGround.visible=uniforms.uVoid.value<0.9999;
    shadowMaterial.opacity=INK_CFG.shadowOpacity*(1-uniforms.uVoid.value);
    contactMaterial.color.copy(uniforms.uGround.value);
    GROUND_HARDWARE.forEach(mesh=>mesh.visible=uniforms.uVoid.value<0.5);
    SPACE_HARDWARE.forEach(mesh=>mesh.visible=uniforms.uVoid.value>=0.5);
    CONTROL_PANEL.material=uniforms.uVoid.value>=0.5?hologramMaterial:MAT.navy;
    scene.background.copy(uniforms.uSky.value);scene.fog.color.copy(uniforms.uSky.value);
    inkPass.uniforms.paper.value.copy(uniforms.uSky.value);
    const low=S.quality==='low'||S.autoLevel>0;
    sets.forEach((set,i)=>{
      set.root.visible=weights[i]>0.0001;
      // Converted materials keep animation ownership; settled relief joins the depth/normal pass.
      set.material=set.hills.material;set.material.opacity=weights[i];
      const fading=weights[i]<0.9999;
      if(set.material.transparent!==fading){set.material.transparent=fading;set.material.depthWrite=!fading;set.material.needsUpdate=true;}
      if(set.orbMaterial)set.orbMaterial.uniforms.uOpacity.value=weights[i];
      set.hills.count=low?SCENERY.hillsLow:SCENERY.hills;set.rocks.count=low?SCENERY.rocksLow:SCENERY.rocks;
      set.hills.position.x=rows[i].terrain==='clouds'?Math.sin(time*0.035)*0.15:0;
    });
    starGeometry.setDrawRange(0,low?SCENERY.starsLow:SCENERY.stars);
    starMaterial.uniforms.uOpacity.value=sum(row=>row.stars)*(0.48+Math.sin(time*0.6)*0.06);
    dustGeometry.setDrawRange(0,low?SCENERY.dustLow:SCENERY.dust);
    // Gravity comes only from PHYS. Log compression is display-only for stellar extremes.
    fallPhase+=dt*sum((row,i)=>fallSpeeds[i])*SCENERY.fallScale;
    dustMaterial.uniforms.uTime.value=time;dustMaterial.uniforms.uFall.value=fallPhase;
    dustMaterial.uniforms.uColor.value.copy(uniforms.uGround.value).lerp(dustTint,0.3);
  }};
}
const ENVIRONMENT=buildEnvironment();

// One compact expedition tripod; console remains the public layer name.
const CONTROL_FACE=new THREE.Group();CONSOLE.add(CONTROL_FACE);
CONTROL_FACE.position.set(...CONTROL_LAYOUT.position);CONTROL_FACE.rotation.x=CONTROL_LAYOUT.tilt;
const hologramMaterial=new THREE.MeshBasicMaterial({color:inkConfig().diagram.screen,side:THREE.DoubleSide});
const CONTROL_PANEL=KIT.roundedPanel(...CONTROL_LAYOUT.panel,MAT.navy,CONTROL_FACE);
for(const [x,,z] of CONTROL_LAYOUT.feet){
  GROUND_HARDWARE.push(KIT.rod(V3(x,SCENERY.groundY,z+CONTROL_LAYOUT.position[2]),V3(...CONTROL_LAYOUT.position),CONTROL_LAYOUT.legRadius,MAT.chrome,CONSOLE));
}
const DIAL=KIT.knobWithArc(CONTROL_FACE,...CONTROL_LAYOUT.dial.at);
const GRAPHS=CONTROL_LAYOUT.graphs.map(g=>KIT.graphScreen(CONTROL_FACE,...g.at,...g.size));
const SLIDER=KIT.ledSlider(CONTROL_FACE,...CONTROL_LAYOUT.slider.at,CONTROL_LAYOUT.slider.width);
const RUN_BUTTON=KIT.mesh(new THREE.CylinderGeometry(0.10,0.10,0.06,24).rotateX(Math.PI/2),MAT.graphite,CONTROL_FACE,...CONTROL_LAYOUT.run.at);
KIT.line([V3(-0.04,-0.02,0.034),V3(0,0.035,0.034),V3(0.04,-0.02,0.034)],inkConfig().diagram.mint,RUN_BUTTON);
const SOUND_SWITCH=KIT.roundedPanel(0.06,0.09,0.035,MAT.chrome,CONTROL_FACE,...CONTROL_LAYOUT.sound.at);

function drawGraphs(){
  const i=PHYS.bodyFromRailX(PHYS.bodyRailX(Math.round(S.body.value))), n=Math.round(S.nWeights.value);
  const baselineBody=GRAMMAR.baseline?.i??0;
  const keys=[`${i}:${n}:${baselineBody}`,`${i}:${S.trial?.runId||0}`];
  GRAPHS.forEach((g,index)=>{
    if(S.graphKeys[index]===keys[index])return;S.graphKeys[index]=keys[index];
    const c=g.ctx,w=768,h=256,L=52,R=724,T=22,B=214;
    c.fillStyle='#'+new THREE.Color(inkConfig().diagram.screen).getHexString();c.fillRect(0,0,w,h);c.strokeStyle='#'+new THREE.Color(inkConfig().diagram.grid).getHexString();c.lineWidth=1;
    for(let k=0;k<=10;k++){const x=L+(R-L)*k/10;c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();}
    for(let k=0;k<=6;k++){const y=T+(B-T)*k/6;c.beginPath();c.moveTo(L,y);c.lineTo(R,y);c.stroke();}
    const dot=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
    const forceColor='#'+new THREE.Color(inkConfig().diagram.force).getHexString(),mint='#'+new THREE.Color(inkConfig().diagram.mint).getHexString();
    if(!index){
      for(const reference of [true,false]){
        c.strokeStyle=reference?'#'+new THREE.Color(inkConfig().diagram.reference).getHexString():forceColor;c.lineWidth=3;c.setLineDash(reference?[9,7]:[]);c.beginPath();
        let last=null;
        for(let k=1;k<=PHYS.RANGE.nWeights[1];k++){
          const spring=PHYS.springState(reference?baselineBody:i,k),x=L+PHYS.railX(k)*(R-L),y=B-spring.shownMarks/PHYS.C.springLimit*(B-T);
          if(spring.broken){
            const limitWeights=PHYS.C.springLimit/PHYS.gRatio(reference?baselineBody:i);
            const limitX=L+clamp((limitWeights-PHYS.RANGE.nWeights[0])/(PHYS.RANGE.nWeights[1]-PHYS.RANGE.nWeights[0]),0,1)*(R-L);
            if(last){c.lineTo(limitX,T);c.stroke();}c.setLineDash([]);c.beginPath();c.moveTo(limitX-9,T+7);c.lineTo(limitX+5,T-3);c.moveTo(limitX+1,T+7);c.lineTo(limitX+15,T-3);c.stroke();break;
          }
          last?c.lineTo(x,y):c.moveTo(x,y);last=[x,y];
        }c.stroke();c.setLineDash([]);
      }
      const x=L+PHYS.railX(n)*(R-L),y=B-PHYS.springState(i,n).shownMarks/PHYS.C.springLimit*(B-T);
      c.strokeStyle=forceColor;c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();dot(x,y,6,forceColor);
      for(let k=1;k<=5;k++)for(let d=0;d<k;d++)dot(L+PHYS.railX(k)*(R-L)+(d-(k-1)/2)*9,237,3,mint);
      c.strokeStyle=forceColor;c.beginPath();c.moveTo(22,20);c.lineTo(22,54);c.lineTo(15,45);c.moveTo(22,54);c.lineTo(29,45);c.stroke();
    }else{
      // Categories are separate points. Trial results are deliberately empty until run.
      PHYS.BODIES.forEach((body,k)=>{
        const x=L+PHYS.bodyRailX(k)*(R-L),j=PHYS.jumpVisual(k);dot(x,237,6,'#'+new THREE.Color(THEME.bodies[k]).getHexString());
        if(!S.trial)return;
        c.strokeStyle=mint;
        if(j.shownHeight===null){c.beginPath();c.moveTo(x,B);c.lineTo(x,T);c.moveTo(x-7,T+8);c.lineTo(x,T);c.lineTo(x+7,T+8);c.stroke();return;}
        const y=B-j.shownHeight/PHYS.C.jumpViewMax*(B-T);dot(x,y,5,mint);
        if(j.exaggerated){c.beginPath();c.moveTo(x+7,y+7);c.lineTo(x+17,y-3);c.moveTo(x+11,y-3);c.lineTo(x+17,y-3);c.lineTo(x+17,y+3);c.stroke();}
      });
      const x=L+PHYS.bodyRailX(i)*(R-L);c.strokeStyle=mint;c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();
      c.beginPath();c.arc(22,25,7,0,Math.PI*2);c.moveTo(22,36);c.lineTo(22,58);c.stroke();
    }
    g.tex.needsUpdate=true;
  });
}
