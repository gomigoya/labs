// R7: all orbital scenery is owned here; ROOM remains the public layer key.
const ENV_CFG = Object.freeze({
  seed: 730219, center: [0,-12,-10], radius: 13, atmosphere: 1.006,
  segments: [64,40], texture: [1024,512], starCount: [320,96], starRadius: 24,
  starSize: 1.7, starOpacity: .8, drift: .065, satelliteSpeed: .025,
  satelliteCenter: [0,2,-6], satelliteOrbit: [6,.42,1.2], satelliteScale: .32,
  cityThreshold: .985, cells: [12,4], sun: [-8,6,-12], sunSize: 2.6
});
function buildEnvironment() {
  const cfg=ENV_CFG, random=mulberry32(cfg.seed);
  const sunDirection=V3(-.8,.3,.5).normalize();
  // Opaque terrain and a separate city mask avoid canvas alpha premultiplication.
  const cityPixels=[];
  // Terrain bands are evaluated per pixel in the shader (anti-aliased at any zoom); the CPU loop only places city lights.
  const terrainAt=(px,py,pz)=>Math.sin(px*7+pz*3)*.42+Math.sin(pz*9-py*5)*.32+Math.cos(py*13+px*4)*.19;
  const cloudAt=(px,py,pz)=>Math.sin(py*48+Math.sin(px*13+pz*9));
  {
    const [w,h]=cfg.texture;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const lon=x/w*Math.PI*2,lat=(.5-y/h)*Math.PI;
      const px=Math.cos(lat)*Math.cos(lon),py=Math.sin(lat),pz=Math.cos(lat)*Math.sin(lon);
      if(terrainAt(px,py,pz)>.13&&cloudAt(px,py,pz)<=.88&&random()>cfg.cityThreshold)cityPixels.push([x,y]);
    }
  }
  const palette=inkConfig().environment,toV=v=>new THREE.Color(v);
  const cities=KIT.canvasTex(...cfg.texture,(c,w,h)=>{
    c.fillStyle='#000';c.fillRect(0,0,w,h);c.fillStyle=inkConfig().environment.star;
    for(const [x,y] of cityPixels)c.fillRect(x,y,1,1);
  });
  cities.wrapS=THREE.RepeatWrapping;
  const surfaceMaterial=new THREE.ShaderMaterial({
    uniforms:{uSea:{value:palette.sea.map(toV)},uLand:{value:palette.land.map(toV)},uCloud:{value:toV(palette.cloud)},uCities:{value:cities},uSpin:{value:0},uSun:{value:sunDirection},uDark:{value:new THREE.Vector3(...inkConfig().dark)},uMid:{value:new THREE.Vector3(...inkConfig().mid)},uLight:{value:new THREE.Vector3(...inkConfig().light)}},
    vertexShader:`varying vec2 vUv;varying vec3 vNormal,vWorld;
      void main(){vUv=uv;vNormal=normalize(mat3(modelMatrix)*normal);
      vWorld=(modelMatrix*vec4(position,1.0)).xyz;
      gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.0);}`,
    fragmentShader:`uniform sampler2D uCities;uniform vec3 uSea[3],uLand[3],uCloud;uniform float uSpin;uniform vec3 uSun,uDark,uMid,uLight;
      varying vec2 vUv;varying vec3 vNormal,vWorld;
      float edge(float v,float t){return smoothstep(-.7,.7,(v-t)/max(fwidth(v),1e-5));}
      void main(){float lon=(vUv.x+uSpin)*6.2831853,lat=(vUv.y-.5)*3.1415927;
      vec3 p=vec3(cos(lat)*cos(lon),sin(lat),cos(lat)*sin(lon));
      float h=sin(p.x*7.+p.z*3.)*.42+sin(p.z*9.-p.y*5.)*.32+cos(p.y*13.+p.x*4.)*.19;
      float cl=sin(p.y*48.+sin(p.x*13.+p.z*9.));
      vec3 sea=mix(mix(uSea[0],uSea[1],edge(h,-.15)),uSea[2],edge(h,.4));
      vec3 land=mix(mix(uLand[0],uLand[1],edge(h,-.15)),uLand[2],edge(h,.4));
      vec3 tex=mix(mix(sea,land,edge(h,.13)),uCloud,edge(cl,.88));
      vec3 n=normalize(vNormal);float d=dot(n,uSun),day=step(0.0,d);
      vec3 band=d<0.0?uDark:(d<.55?uMid:uLight);
      vec3 col=tex*band+texture2D(uCities,vec2(fract(vUv.x+uSpin),vUv.y)).rgb*(1.0-day);
      gl_FragColor=vec4(col,1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`
  });
  const globe=new THREE.Mesh(new THREE.SphereGeometry(cfg.radius,...cfg.segments),surfaceMaterial);
  globe.position.set(...cfg.center);ROOM.add(globe);
  const atmosphereMaterial=new THREE.ShaderMaterial({
    uniforms:{uColor:{value:new THREE.Color(inkConfig().environment.atmosphere)}},
    vertexShader:`varying vec3 vNormal,vWorld;void main(){vNormal=normalize(mat3(modelMatrix)*normal);
      vWorld=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.0);}`,
    fragmentShader:`uniform vec3 uColor;varying vec3 vNormal,vWorld;
      void main(){float facing=dot(normalize(vNormal),normalize(cameraPosition-vWorld));
      if(facing<0.0||facing>.12)discard;gl_FragColor=vec4(uColor,.55);
      #include <colorspace_fragment>
      }`,transparent:true,depthWrite:false,side:THREE.DoubleSide
  });
  const atmosphere=new THREE.Mesh(globe.geometry,atmosphereMaterial);
  atmosphere.position.copy(globe.position);atmosphere.scale.setScalar(cfg.atmosphere);ROOM.add(atmosphere);
  const positions=[],phases=[];
  for(let i=0;i<cfg.starCount[0];i++){
    const az=random()*Math.PI*2, height=random()*2-1, r=Math.sqrt(1-height*height)*cfg.starRadius;
    positions.push(Math.cos(az)*r,2+height*cfg.starRadius,Math.sin(az)*r);phases.push(random()*Math.PI*2);
  }
  const starsGeo=new THREE.BufferGeometry();
  starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  starsGeo.setAttribute('aPhase',new THREE.Float32BufferAttribute(phases,1));
  const starsMat=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uSize:{value:cfg.starSize},uOpacity:{value:cfg.starOpacity},uColor:{value:new THREE.Color(inkConfig().environment.star)}},
    vertexShader:`attribute float aPhase;uniform float uTime,uSize;varying float vGlow;
      void main(){vGlow=.72+.28*sin(aPhase+uTime*.3);gl_PointSize=uSize;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform float uOpacity;uniform vec3 uColor;varying float vGlow;
      void main(){float r=length(gl_PointCoord-.5)*2.0;if(r>1.0)discard;
      gl_FragColor=vec4(uColor,uOpacity*step(.6,vGlow));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,transparent:true,depthWrite:false});
  ROOM.add(new THREE.Points(starsGeo,starsMat));
  // One small satellite: two instanced solar wings, a faceted bus and antenna.
  const satellite=new THREE.Group();satellite.scale.setScalar(cfg.satelliteScale);ROOM.add(satellite);
  KIT.mesh(new THREE.IcosahedronGeometry(.28,0),MAT.chrome,satellite).castShadow=false;
  KIT.rod(V3(-1.1,0,0),V3(1.1,0,0),.025,MAT.deck,satellite).castShadow=false;
  KIT.rod(V3(0,.15,0),V3(0,.65,.1),.015,MAT.chrome,satellite).castShadow=false;
  const cells=new THREE.InstancedMesh(new THREE.BoxGeometry(.27,.018,.42),MAT.navy,cfg.cells[0]);
  const transform=new THREE.Object3D();
  for(let i=0;i<cfg.cells[0];i++){
    const wing=i%2?1:-1,slot=Math.floor(i/2);
    transform.position.set(wing*(.48+(slot%3)*.29),0,(Math.floor(slot/3)-.5)*.45);
    transform.updateMatrix();cells.setMatrixAt(i,transform.matrix);
  }
  satellite.add(cells);
  const sunTexture=KIT.canvasTex(128,128,(c,w,h)=>{
    c.fillStyle=inkConfig().environment.halo;c.globalAlpha=.24;c.beginPath();c.arc(w/2,h/2,w*.48,0,Math.PI*2);c.fill();
    c.globalAlpha=1;c.fillStyle=inkConfig().environment.sun;c.beginPath();c.arc(w/2,h/2,w*.15,0,Math.PI*2);c.fill();
  });
  const sun=new THREE.Sprite(new THREE.SpriteMaterial({map:sunTexture,transparent:true,depthWrite:false,fog:false}));
  sun.position.set(...cfg.sun);sun.scale.setScalar(cfg.sunSize);ROOM.add(sun);
  let time=0,quality='';
  return {update(dt){
    time+=dt;
    // Reuse the apparatus angle: sudden-stop freezes at the captured angle;
    // finite periods and pause use the very same PHYS presentation state.
    surfaceMaterial.uniforms.uSpin.value=(S.run?S.run.angle:S.spin.value)*cfg.drift/(Math.PI*2);
    starsMat.uniforms.uTime.value=time;
    const a=time*cfg.satelliteSpeed;
    satellite.position.set(cfg.satelliteCenter[0]+Math.cos(a)*cfg.satelliteOrbit[0],
      cfg.satelliteCenter[1]+Math.sin(a)*cfg.satelliteOrbit[1],cfg.satelliteCenter[2]+Math.sin(a)*cfg.satelliteOrbit[2]);
    satellite.rotation.set(.2,a,.25);
    const next=S.quality==='low'||S.autoLevel>0?'low':'high';
    if(next!==quality){quality=next;const low=next==='low';
      starsGeo.setDrawRange(0,cfg.starCount[low?1:0]);cells.count=cfg.cells[low?1:0];
      atmosphere.visible=!low;
    }
  }};
}
const ENVIRONMENT=buildEnvironment();

// R9: one world-space layout for floating controls, picking, animation and cues.
// No shared backing surface: each instrument is an independent hologram.
const CONTROL_LAYOUT = Object.freeze({
  dial: Object.freeze({x:-.96,y:1.53,z:.20, cueRadius:.16, cueDepth:.05}),
  graphs: Object.freeze([Object.freeze({x:-.96,y:1.23,z:.20,w:.55,h:.20}),
    Object.freeze({x:.82,y:1.23,z:.20,w:.55,h:.20})]),
  slider: Object.freeze({x:-.03,y:1.20,z:.20,width:.95, cueDepth:.08}),
  play: Object.freeze({x:.80,y:1.53,z:.20, radius:.085,depth:.055,ring:.115,glyph:.05,travel:.012}),
  mode: Object.freeze({x:1.14,y:1.53,z:.20,w:.24,h:.15,thickness:.018,leverSize:[.065,.085,.025],leverOffset:-.06,travel:.12,depth:.04})
});
const DIAL=KIT.knobWithArc(CONSOLE,CONTROL_LAYOUT.dial.x,CONTROL_LAYOUT.dial.y,CONTROL_LAYOUT.dial.z);
const GRAPHS=CONTROL_LAYOUT.graphs.map(g=>KIT.graphScreen(CONSOLE,g.x,g.y,g.z,g.w,g.h));
const SLIDER=KIT.ledSlider(CONSOLE,CONTROL_LAYOUT.slider.x,CONTROL_LAYOUT.slider.y,CONTROL_LAYOUT.slider.z,CONTROL_LAYOUT.slider.width);
const PLAY_BUTTON=KIT.mesh(new THREE.CylinderGeometry(CONTROL_LAYOUT.play.radius,CONTROL_LAYOUT.play.radius,CONTROL_LAYOUT.play.depth,32).rotateX(Math.PI/2),MAT.hologram,CONSOLE,
  CONTROL_LAYOUT.play.x,CONTROL_LAYOUT.play.y,CONTROL_LAYOUT.play.z);
KIT.mesh(new THREE.TorusGeometry(CONTROL_LAYOUT.play.ring,.008,6,40),MAT.glow,CONSOLE,CONTROL_LAYOUT.play.x,CONTROL_LAYOUT.play.y,CONTROL_LAYOUT.play.z);
KIT.roundedPanel(CONTROL_LAYOUT.play.glyph,CONTROL_LAYOUT.play.glyph,.006,MAT.glow,PLAY_BUTTON,0,0,.031,.005);
const MODE_SWITCH=KIT.roundedPanel(CONTROL_LAYOUT.mode.w,CONTROL_LAYOUT.mode.h,CONTROL_LAYOUT.mode.thickness,MAT.hologram,CONSOLE,
  CONTROL_LAYOUT.mode.x,CONTROL_LAYOUT.mode.y,CONTROL_LAYOUT.mode.z);
const SWITCH_LEVER=KIT.roundedPanel(...CONTROL_LAYOUT.mode.leverSize,MAT.glow,CONSOLE,
  CONTROL_LAYOUT.mode.x+CONTROL_LAYOUT.mode.leverOffset,CONTROL_LAYOUT.mode.y,CONTROL_LAYOUT.mode.z+CONTROL_LAYOUT.mode.depth);
for(const direction of [-1,1])KIT.line([V3(CONTROL_LAYOUT.mode.x+direction*.08,CONTROL_LAYOUT.mode.y+.10,CONTROL_LAYOUT.mode.z),
  V3(CONTROL_LAYOUT.mode.x+direction*.03,CONTROL_LAYOUT.mode.y+.10,CONTROL_LAYOUT.mode.z)],THEME.cool,CONSOLE);
CONSOLE.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});
function drawGraphs(){
 const phi=currentPhi(),P=currentPeriod();
 const keys=[String(phi),String(P)];
 GRAPHS.forEach((g,index)=>{
  if(S.graphKeys[index]===keys[index])return;S.graphKeys[index]=keys[index];
  const c=g.ctx,w=768,h=256,L=48,R=714,T=24,B=214;
  c.fillStyle=CSS.screen;c.fillRect(0,0,w,h);c.strokeStyle="#221d18";c.lineWidth=6;c.strokeRect(3,3,w-6,h-6);c.strokeStyle=CSS.grid;c.lineWidth=1;
  for(let i=0;i<=12;i++){const x=L+(R-L)*i/12;c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();}
  for(let i=0;i<=4;i++){const y=T+(B-T)*i/4;c.beginPath();c.moveTo(L,y);c.lineTo(R,y);c.stroke();}
  const xy=(u,v)=>[L+u*(R-L),B-v*(B-T)];
  c.strokeStyle=index?CSS.warm:CSS.velocity;c.lineWidth=4;c.beginPath();
  for(let i=0;i<=300;i++){
   const u=i/300*(index?PHYS.C.periodRailEnd:1);
   const value=index?PHYS.dayGraphY(PHYS.periodFromRailX(u)):PHYS.v(PHYS.phiFromRailX(u),PHYS.C.T0)/PHYS.v(0,PHYS.C.T0);
   const [x,y]=xy(u,value);i?c.lineTo(x,y):c.moveTo(x,y);
  }c.stroke();
  // Stop is an isolated point, never connected across the rail discontinuity.
  if(index){const [x,y]=xy(1,PHYS.dayGraphY(Infinity));c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.stroke();
   c.strokeStyle="#393e42";c.beginPath();c.moveTo(19,101);c.lineTo(32,90);c.lineTo(19,79);c.moveTo(19,119);c.lineTo(32,108);c.lineTo(19,97);c.stroke();
  }else{
   c.setLineDash([9,7]);c.strokeStyle="#393e42";c.lineWidth=2;c.beginPath();c.moveTo(L,T);c.lineTo(R,T);c.stroke();c.setLineDash([]);
   for(const d of PHYS.DETENTS.phi){const [x]=xy(d.x,0);c.beginPath();c.moveTo(x,B);c.lineTo(x,B+10);c.stroke();}
  }
  const u=index?PHYS.periodRailX(P):PHYS.phiRailX(phi),value=index?PHYS.dayGraphY(P):PHYS.v(phi,PHYS.C.T0)/PHYS.v(0,PHYS.C.T0);
  const [x,y]=xy(u,value??0);c.strokeStyle=CSS.warm;c.lineWidth=2;c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();
  if(value!==null){c.fillStyle=CSS.warm;c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.fill();}
  c.strokeStyle="#393e42";c.lineWidth=3;c.beginPath();c.arc(740,233,10,.3,Math.PI*1.85);c.stroke();
  if(index){c.beginPath();c.arc(22,25,10,0,Math.PI*2);c.stroke();}
  else{c.beginPath();c.moveTo(20,38);c.lineTo(20,12);c.lineTo(13,21);c.moveTo(20,12);c.lineTo(27,21);c.stroke();}
  g.tex.needsUpdate=true;
 });
}
