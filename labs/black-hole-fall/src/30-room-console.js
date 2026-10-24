// All environment dimensions and decoration budgets live in this table.
const ENV_SPEC=Object.freeze({
 seed:730219, skyRadius:36, stars:760, starsLow:240, lensArcs:12, lensArcsLow:6,
 hole:[0.2,1.1,-13], holeRadius:1.35, diskRadius:2.85, diskTilt:1.02,
 nebula:[-10,4,-19], nebulaSize:[15,8],
 controls:Object.freeze({
  dial:Object.freeze([-1.51,0.92,1.25]),
  graphs:Object.freeze([Object.freeze([-0.70,0.94,1.25]),Object.freeze([0.38,0.94,1.25])]),
  graphSize:Object.freeze([0.92,0.30]),
  slider:Object.freeze([-0.15,0.67,1.25]), sliderWidth:1.9,
  play:Object.freeze([1.19,0.93,1.25]), playRadius:0.14,
  switch:Object.freeze([1.62,0.92,1.25]), switchSize:Object.freeze([0.20,0.24,0.012]),
  expansion:Object.freeze([-1.18,1.18,1.25])
 })
});
function buildEnvironment(){
 const cfg=ENV_SPEC, seed=mulberry32(cfg.seed);
 const stars=Array.from({length:cfg.stars},()=>[seed(),seed(),0.45+seed()*0.9,0.2+seed()*0.45]);
 const arcs=Array.from({length:cfg.lensArcs},()=>[seed(),seed(),seed()]);
 const pole=V3(...cfg.hole).normalize();
 const starMaps=[cfg.stars,cfg.starsLow].map((count,level)=>KIT.canvasTex(2048,1024,(c,w,h)=>{
  c.fillStyle=INK_CFG.paper;c.fillRect(0,0,w,h);
  stars.slice(0,count).forEach(([u,v,r,a])=>{
   c.globalAlpha=a;c.fillStyle=INK_CFG.space.star;c.beginPath();c.arc(u*w,v*h,r,0,Math.PI*2);c.fill();c.globalAlpha=1;
  });
  const cx=(Math.atan2(pole.z,pole.x)/(Math.PI*2)+0.5)*w,cy=(0.5-Math.asin(pole.y)/Math.PI)*h;
  c.strokeStyle=INK_CFG.space.star;c.lineWidth=0.8;
  arcs.slice(0,level?cfg.lensArcsLow:cfg.lensArcs).forEach(([r,a,length])=>{
   const radius=42+r*146,angle=a*Math.PI*2;
   c.beginPath();c.ellipse(cx,cy,radius,radius*0.96,0,angle,angle+0.018+length*0.11);c.stroke();
  });
 }));
 starMaps.forEach(t=>{t.wrapS=THREE.RepeatWrapping;});
 const skyMaterial=new THREE.ShaderMaterial({
  uniforms:{uT:{value:0},uStars:{value:starMaps[0]},uPole:{value:pole}},
  vertexShader:`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform sampler2D uStars;uniform vec3 uPole;uniform float uT;varying vec3 vDirection;
   vec3 sampleSky(vec3 d){return texture2D(uStars,vec2(atan(d.z,d.x)/6.2831853+0.5,asin(clamp(d.y,-1.0,1.0))/3.1415927+0.5)).rgb;}
   void main(){vec3 d=normalize(vDirection);float alignment=dot(d,uPole);
    float bend=0.018*exp(-18.0*(1.0-alignment));vec3 tangent=normalize(cross(uPole,d)+vec3(0.00001));
    vec3 warped=normalize(d+uPole*bend/max(0.07,1.0-alignment));
    vec3 col=sampleSky(warped);
    gl_FragColor=vec4(col,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`,side:THREE.BackSide,depthWrite:false
 });
 const sky=new THREE.Mesh(new THREE.SphereGeometry(cfg.skyRadius,32,16),skyMaterial);ROOM.add(sky);
 INK_CFG.space.nebula.forEach((color,i)=>{
  const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide});
  const nebula=new THREE.Mesh(new THREE.CircleGeometry(1,7+i),m);
  nebula.scale.set(cfg.nebulaSize[0]*(.44-i*.07),cfg.nebulaSize[1]*(.44-i*.06),1);
  nebula.position.set(cfg.nebula[0]+i*1.2,cfg.nebula[1]-i*.5,cfg.nebula[2]+i*.03);nebula.lookAt(E);ROOM.add(nebula);
 });
 const hole=new THREE.Group();hole.position.set(...cfg.hole);hole.lookAt(E);ROOM.add(hole);
 const silhouette=new THREE.Mesh(new THREE.CircleGeometry(cfg.holeRadius,64),new THREE.MeshBasicMaterial({color:INK_CFG.space.hole}));hole.add(silhouette);
 const photon=new THREE.Mesh(new THREE.RingGeometry(cfg.holeRadius*1.01,cfg.holeRadius*1.085,96),
  new THREE.MeshBasicMaterial({color:INK_CFG.space.star,transparent:true,opacity:0.9,side:THREE.DoubleSide}));hole.add(photon);
 const accretion=new THREE.Group();accretion.rotation.set(cfg.diskTilt,0,-.20);hole.add(accretion);
 INK_CFG.space.disk.forEach((color,i)=>{
  const inner=cfg.holeRadius*1.10+(cfg.diskRadius-cfg.holeRadius*1.10)*i/3;
  const outer=cfg.holeRadius*1.10+(cfg.diskRadius-cfg.holeRadius*1.10)*(i+1)/3;
  accretion.add(new THREE.Mesh(new THREE.RingGeometry(inner,outer,96),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide})));
  const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:96},(_,j)=>V3(Math.cos(j/96*Math.PI*2)*outer,Math.sin(j/96*Math.PI*2)*outer,.002))),new THREE.LineBasicMaterial({color:INK_CFG.ink}));accretion.add(line);
 });
 let time=0,previousLow=null;
 return {update(dt){
  time+=dt;skyMaterial.uniforms.uT.value=time;
  const low=S.quality==='low';
  if(low!==previousLow){
   skyMaterial.uniforms.uStars.value=starMaps[low?1:0];previousLow=low;
  }
 }};
}
const ENVIRONMENT=buildEnvironment();

// Separate floating control islands; no shared body, floor or backing slab.
const CONTROL_LAYOUT=ENV_SPEC.controls;
const DIAL=KIT.knobWithArc(CONSOLE,...CONTROL_LAYOUT.dial);
const GRAPHS=CONTROL_LAYOUT.graphs.map(p=>KIT.graphScreen(CONSOLE,...p,...CONTROL_LAYOUT.graphSize));
const SLIDER=KIT.ledSlider(CONSOLE,...CONTROL_LAYOUT.slider,CONTROL_LAYOUT.sliderWidth);
const [playX,playY,playZ]=CONTROL_LAYOUT.play;
KIT.mesh(new THREE.RingGeometry(CONTROL_LAYOUT.playRadius*0.80,CONTROL_LAYOUT.playRadius,32),MAT.hologram,CONSOLE,playX,playY,playZ);
const PLAY_BUTTON=KIT.mesh(new THREE.CylinderGeometry(0.105,0.105,0.05,24).rotateX(Math.PI/2),MAT.graphite,CONSOLE,playX,playY,playZ+0.04);
const PLAY_GLYPH=new THREE.Group(); PLAY_BUTTON.add(PLAY_GLYPH);
for(const x of [-0.024,0.024]) KIT.roundedPanel(0.015,0.07,0.008,MAT.glow,PLAY_GLYPH,x,0,0.03);
const triangle=new THREE.Shape();triangle.moveTo(-0.025,-0.04);triangle.lineTo(0.04,0);triangle.lineTo(-0.025,0.04);triangle.closePath();
const PLAY_TRIANGLE=KIT.mesh(new THREE.ShapeGeometry(triangle),MAT.glow,PLAY_BUTTON,0,0,0.031);
const [switchX,switchY,switchZ]=CONTROL_LAYOUT.switch;
KIT.roundedPanel(...CONTROL_LAYOUT.switchSize,MAT.hologram,CONSOLE,switchX,switchY,switchZ);
const SWITCH=KIT.rod(V3(switchX,switchY-0.06,switchZ+0.03),V3(switchX,switchY+0.07,switchZ+0.07),0.018,MAT.graphite,CONSOLE);
// Cream control islands retain the floor-free, shadow-free layout.
CONSOLE.traverse(m=>{if(m.isMesh)m.castShadow=m.receiveShadow=false;});
function drawGraphs(){
 const i=massIndex(), r=currentR(), o=orientation();
 const keys=[`${i}:${o}:${S.u.value.toFixed(6)}`,`${S.records.map(s=>s.i).join(',')}:${i}`];
 GRAPHS.forEach((g,index)=>{
  if(S.graphKeys[index]===keys[index])return; S.graphKeys[index]=keys[index];
  const c=g.ctx,w=768,h=256,L=55,R=715,T=22,B=218;
  const css=k=>'#'+new THREE.Color(INK_CFG.diagram[k]??THEME[k]).getHexString();
  c.fillStyle=css('screen');c.fillRect(0,0,w,h);c.strokeStyle='#'+INK_CFG.diagram.ink.toString(16);c.lineWidth=3;c.strokeRect(1.5,1.5,w-3,h-3);c.strokeStyle=css('grid');c.lineWidth=1;
  for(let j=0;j<=12;j++){const x=L+(R-L)*j/12;c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();}
  for(let j=0;j<=4;j++){const y=T+(B-T)*j/4;c.beginPath();c.moveTo(L,y);c.lineTo(R,y);c.stroke();}
  const yy=a=>B-PHYS.graphY(a)*(B-T);
  if(!index){
   c.setLineDash([8,7]);c.strokeStyle=css('reference');c.beginPath();c.moveTo(L,yy(PHYS.C.limit));c.lineTo(R,yy(PHYS.C.limit));c.stroke();c.setLineDash([]);
   c.strokeStyle=css('red');const hx=L+PHYS.railX(1)*(R-L);c.beginPath();c.moveTo(hx,T);c.lineTo(hx,B);c.stroke();
   c.strokeStyle=css('tide');c.lineWidth=4;c.beginPath();
   for(let j=0;j<=320;j++){const x=L+(R-L)*j/320,y=yy(PHYS.dA(i,PHYS.rFromRailX(j/320),o));j?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
   const x=L+S.u.value*(R-L);c.strokeStyle=css('warm');c.lineWidth=2;c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();c.fillStyle=css('warm');c.beginPath();c.arc(x,yy(PHYS.dA(i,r,o)),6,0,Math.PI*2);c.fill();
  }else{
   S.records.forEach((s,j)=>{
    const x=L+(s.i+0.5)/3*(R-L),y=yy(PHYS.dA(s.i,1));c.strokeStyle=css(j===S.records.length-1?'tide':'reference');c.lineWidth=8;c.setLineDash(j===S.records.length-1?[]:[7,5]);c.beginPath();c.moveTo(x,B);c.lineTo(x,y);c.stroke();c.setLineDash([]);
    c.fillStyle=css('warm');c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.fill();
   });
   const x=L+(i+0.5)/3*(R-L);c.strokeStyle=css('warm');c.lineWidth=2;c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();
  }
  // Quantity arrow and concentric-ring axis icons; never draw text.
  c.strokeStyle=css('reference');c.lineWidth=3;c.beginPath();c.moveTo(24,43);c.lineTo(24,12);c.moveTo(18,19);c.lineTo(24,12);c.lineTo(30,19);c.stroke();
  for(const radius of [5,10]){c.beginPath();c.ellipse(742,237,radius,radius*0.6,0,0,Math.PI*2);c.stroke();}
  g.tex.needsUpdate=true;
 });
}
