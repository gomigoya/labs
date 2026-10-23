// Earth-science room. All diagrams are geometry or canvas paths; no lettering.
const floorTex = KIT.canvasTex(1024,1024,(c,w,h)=>{
  c.fillStyle=CSS.floor;c.fillRect(0,0,w,h);
  for(let row=0;row<12;row++){
    const y=row*h/12;c.fillStyle=row%2?CSS.floorA:CSS.floorB;c.fillRect(0,y,w,h/12-2);
    for(let i=0;i<48;i++){c.fillStyle=CSS.grain;c.fillRect(rand()*w,y+rand()*h/12,rand()*240,1);}
    for(let x=row%3*120;x<w;x+=360){c.fillStyle=CSS.background;c.fillRect(x,y,2,h/12);}
  }
});
floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(3,3);
KIT.mesh(new THREE.PlaneGeometry(24,24).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:floorTex,roughness:.84}),ROOM,0,0,1);
KIT.roundedPanel(18,6,.12,MAT.wall,ROOM,2,3,-3.1);
KIT.roundedPanel(.12,6,20,MAT.navy,ROOM,-4.2,3,3);
for(let i=0;i<24;i++)KIT.roundedPanel(.55,.72,.025,MAT.wood,ROOM,-4+i*.58,.48,-3.02);
for(let i=0;i<10;i++)KIT.roundedPanel(.035,4.6,.04,MAT.wood,ROOM,-4+i*1.3,3.1,-3.01);
KIT.roundedPanel(17,.045,.06,MAT.brass,ROOM,2,.88,-2.98);
KIT.roundedPanel(.06,.045,18,MAT.brass,ROOM,-4.1,.88,3);
const skyTexture=KIT.canvasTex(768,768,(c,w,h)=>{
 const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,CSS.skyTop);g.addColorStop(.6,CSS.skyMid);g.addColorStop(1,CSS.skyHorizon);c.fillStyle=g;c.fillRect(0,0,w,h);
 for(let i=0;i<160;i++){c.fillStyle=CSS.reference;c.beginPath();c.arc(rand()*w,rand()*h*.8,.5+rand()*1.5,0,Math.PI*2);c.fill();}
 for(let ridge=0;ridge<3;ridge++){c.fillStyle=['#384a60','#273b4c','#192e3e'][ridge];c.beginPath();c.moveTo(0,h);
 for(let x=0;x<=w;x+=16)c.lineTo(x,h*(.79+ridge*.055)-Math.sin(x*.014+ridge)*24-Math.sin(x*.039)*9);
 c.lineTo(w,h);c.closePath();c.fill();}

});
const arch=new THREE.Shape();arch.moveTo(-1.05,-.85);arch.lineTo(1.05,-.85);arch.lineTo(1.05,.15);arch.absarc(0,.15,1.05,0,Math.PI,false);arch.lineTo(-1.05,-.85);
const archGeo=new THREE.ShapeGeometry(arch,48),uv=archGeo.attributes.uv,ap=archGeo.attributes.position;
for(let i=0;i<uv.count;i++)uv.setXY(i,(ap.getX(i)+1.05)/2.1,(ap.getY(i)+.85)/2.1);
const dome=KIT.mesh(archGeo,new THREE.MeshBasicMaterial({map:skyTexture}),ROOM,.6,2.65,-2.99);dome.castShadow=false;
const border=arch.getPoints(64).map(p=>V3(p.x+.6,p.y+2.65,-2.95));
for(let i=1;i<border.length;i++)KIT.rod(border[i-1],border[i],.03,MAT.brass,ROOM);
KIT.rod(V3(.6,1.8,-2.93),V3(.6,3.85,-2.93),.02,MAT.graphite,ROOM);
KIT.rod(V3(-.45,2.8,-2.93),V3(1.65,2.8,-2.93),.02,MAT.graphite,ROOM);
KIT.roundedPanel(2.3,.08,.3,MAT.wood,ROOM,.6,1.77,-2.88);
const skyLight=new THREE.RectAreaLight(THEME.cool,2,1.8,1.8);skyLight.position.set(.6,2.7,-2.8);skyLight.rotation.y=Math.PI;ROOM.add(skyLight);
// Cross section and relative rotation panels, each an unlettered instrument drawing.
for(const [x,y,index] of [[-1.65,3,0],[2.5,2.9,1]]){
 KIT.roundedPanel(1.05,.8,.05,MAT.brass,ROOM,x,y,-2.96);
 const tex=KIT.canvasTex(512,384,(c,w,h)=>{
  c.fillStyle=CSS.screen;c.fillRect(0,0,w,h);c.strokeStyle=CSS.grid;c.lineWidth=1;
  for(let a=24;a<w;a+=40){c.beginPath();c.moveTo(a,0);c.lineTo(a,h);c.stroke();}
  for(let b=24;b<h;b+=40){c.beginPath();c.moveTo(0,b);c.lineTo(w,b);c.stroke();}
  c.lineWidth=4;
  for(let k=0;k<3;k++){c.strokeStyle=k%2?CSS.warm:CSS.cool;c.beginPath();c.ellipse(256,190,55+k*42,index?35+k*17:55+k*42,index?.4:0,0,Math.PI*2);c.stroke();}
  c.fillStyle=CSS.warm;c.beginPath();c.arc(index?390:256,index?120:190,14,0,Math.PI*2);c.fill();
  c.strokeStyle=CSS.reference;c.beginPath();c.moveTo(125,300);c.lineTo(390,80);c.stroke();
 });
 KIT.mesh(new THREE.PlaneGeometry(.98,.73),new THREE.MeshStandardMaterial({map:tex,emissiveMap:tex,emissive:THEME.cool,emissiveIntensity:.25}),ROOM,x,y,-2.93);
}
for(const y of [1.13,1.9])KIT.shelf(ROOM,-1.8,y,-2.7,2.3);
// Prop 1: star-map disc with countable radial marks.
const atlas=new THREE.Group();atlas.position.set(2.5,1.65,-2.85);ROOM.add(atlas);
KIT.mesh(new THREE.CylinderGeometry(.35,.35,.05,48).rotateX(Math.PI/2),MAT.brass,atlas);
KIT.mesh(new THREE.CircleGeometry(.32,48),MAT.navy,atlas,0,0,.03);
for(let i=0;i<28;i++){const a=i/28*Math.PI*2;KIT.ball(.007,MAT.glow,atlas,Math.sin(a)*(.12+rand()*.18),Math.cos(a)*(.12+rand()*.18),.04,0);}
for(const r of [.12,.24])KIT.line(Array.from({length:65},(_,i)=>V3(Math.sin(i/64*Math.PI*2)*r,Math.cos(i/64*Math.PI*2)*r,.04)),THEME.chrome,atlas);
// Prop 2: axis-mounted small globe.
KIT.roundedPanel(.3,.04,.25,MAT.graphite,ROOM,-2.55,1.95,-2.65);
KIT.rod(V3(-2.55,1.96,-2.65),V3(-2.55,2.42,-2.65),.009,MAT.brass,ROOM);
KIT.ball(.16,MAT.earth,ROOM,-2.55,2.2,-2.65);
for(let j=-1;j<=1;j++)KIT.line(Array.from({length:49},(_,i)=>{const a=i/48*Math.PI*2;return V3(-2.55+Math.sin(a)*.163*Math.cos(j*.6),2.2+Math.sin(j*.6)*.163,-2.65+Math.cos(a)*.163*Math.cos(j*.6));}),THEME.brass,ROOM);
// Prop 3: bead tray; prop 4: hourglass.
KIT.roundedPanel(.72,.045,.28,MAT.brass,ROOM,-1.55,1.95,-2.65);
for(let i=0;i<5;i++)KIT.ball(.045,MAT.chrome,ROOM,-1.82+i*.13,2.02,-2.65,1);
for(const y of [1.19,1.52])KIT.mesh(new THREE.CylinderGeometry(.10,.10,.025,16),MAT.brass,ROOM,-2.55,y,-2.65);
const glassMat=new THREE.MeshPhysicalMaterial({color:THEME.cool,transparent:true,opacity:.28,roughness:.2,transmission:.3,thickness:.025});
for(const sign of [-1,1]){
 KIT.rod(V3(-2.55+sign*.08,1.2,-2.65),V3(-2.55+sign*.08,1.51,-2.65),.008,MAT.brass,ROOM);
 const cone=KIT.mesh(new THREE.ConeGeometry(.075,.15,12),glassMat,ROOM,-2.55,1.35+sign*.075,-2.65);cone.rotation.z=sign>0?Math.PI:0;
}
KIT.mesh(new THREE.ConeGeometry(.065,.08,12),MAT.wood,ROOM,-2.55,1.24,-2.65);
// Prop 5: orbital teaching model, 6: sample jars, 7: pendulum stand.
const orbitProp=new THREE.Group();orbitProp.position.set(-1.65,1.45,-2.65);ROOM.add(orbitProp);
KIT.mesh(new THREE.CylinderGeometry(.24,.27,.035,32),MAT.graphite,orbitProp,0,-.25,0);
KIT.rod(V3(0,-.23,0),V3(0,0,0),.015,MAT.brass,orbitProp);
KIT.mesh(new THREE.TorusGeometry(.22,.008,6,48).rotateX(Math.PI/2),MAT.brass,orbitProp);
KIT.ball(.065,MAT.brass,orbitProp);KIT.ball(.035,MAT.earth,orbitProp,.22,0,0);
for(let i=0;i<3;i++){
 const x=-.98+i*.12;KIT.mesh(new THREE.CylinderGeometry(.04,.04,.18,12),glassMat,ROOM,x,1.25,-2.66);
 KIT.mesh(new THREE.CylinderGeometry(.043,.043,.025,12),MAT.brass,ROOM,x,1.35,-2.66);
}
KIT.roundedPanel(.35,.04,.25,MAT.graphite,ROOM,2.5,1.15,-2.65);
for(const dx of [-.14,.14])KIT.rod(V3(2.5+dx,1.17,-2.65),V3(2.5+dx,1.75,-2.65),.012,MAT.brass,ROOM);
KIT.rod(V3(2.36,1.75,-2.65),V3(2.64,1.75,-2.65),.012,MAT.brass,ROOM);
KIT.rod(V3(2.5,1.75,-2.65),V3(2.58,1.3,-2.65),.004,MAT.chrome,ROOM);KIT.ball(.06,MAT.brass,ROOM,2.58,1.3,-2.65);
// Prop 8: practical desk lamp. Two foreground furnishings intentionally crop.
KIT.lampWithBulb(ROOM,-2.2,.96,-.5);
KIT.roundedPanel(1.3,.12,.72,MAT.wood,ROOM,-1.7,.65,1.3,.06);
for(const dx of [-.36,.36])for(const dz of [-.25,.25])KIT.rod(V3(-1.7+dx,0,1.3+dz),V3(-1.7+dx,.60,1.3+dz),.035,MAT.graphite,ROOM);
KIT.roundedPanel(1.1,.06,.6,MAT.brass,ROOM,2.1,1.45,1.2,.04);
KIT.rod(V3(2.1,.1,1.2),V3(2.1,1.42,1.2),.035,MAT.graphite,ROOM);
for(let i=0;i<3;i++)KIT.ball(.11,MAT.earth,ROOM,1.85+i*.25,1.59,1.2);
// Console instrument deck.
KIT.roundedPanel(3.35,.69,1.2,MAT.graphite,CONSOLE,0,.52,.1,.07);
KIT.roundedPanel(3.5,.10,1.32,MAT.wood,CONSOLE,0,MODEL.top-.05,.1,.035);
KIT.roundedPanel(3.34,.018,1.18,MAT.graphite,CONSOLE,0,MODEL.top+.006,.1);
KIT.roundedPanel(3.22,.48,.035,MAT.navy,CONSOLE,0,.59,.72);
KIT.brassTrim(CONSOLE,3.22,.48,0,.59,.745);
for(const x of [-1.54,1.54])for(const y of [.4,.78])KIT.screw(CONSOLE,x,y,.754);
KIT.ventSlits(CONSOLE,-1.38,.25,.72,48);
for(const x of [-1.4,1.4])for(const z of [-.32,.5])KIT.roundedPanel(.2,.15,.18,MAT.rubber,CONSOLE,x,.1,z);
const DIAL=KIT.knobWithArc(CONSOLE,-1.32,.6,.785);
const GRAPHS=[KIT.graphScreen(CONSOLE,-.66,.64,.78,.67,.25),KIT.graphScreen(CONSOLE,.12,.64,.78,.67,.25)];
const SLIDER=KIT.ledSlider(CONSOLE,-.28,.39,.79,1.38);
const PLAY_BUTTON=KIT.bigButton(CONSOLE,.76,.6,.79);
const MODE_SWITCH=KIT.roundedPanel(.24,.15,.035,MAT.brass,CONSOLE,1.24,.64,.79);
const SWITCH_LEVER=KIT.roundedPanel(.065,.085,.06,MAT.chrome,CONSOLE,1.18,.64,.83);
KIT.line([V3(1.15,.78,.815),V3(1.15,.72,.815),V3(1.25,.72,.815)],THEME.chrome,CONSOLE);
KIT.line(Array.from({length:25},(_,i)=>V3(1.22+i/24*.12,.45+Math.sin(i/24*Math.PI/2)*.10,.815)),THEME.chrome,CONSOLE);
KIT.roundedPanel(.32,.06,.018,MAT.brass,CONSOLE,1.24,.36,.79);
for(let i=0;i<3;i++)KIT.line(Array.from({length:33},(_,j)=>V3(1.16+Math.cos(j/32*Math.PI*2)*(.018+i*.022),.36+Math.sin(j/32*Math.PI*2)*.019,.805)),THEME.graphite,CONSOLE);
KIT.expansion(CONSOLE,-1.53,.84,.82);KIT.expansion(CONSOLE,-.95,.39,.83);KIT.expansion(CONSOLE,.41,.81,.82);
function drawGraphs(){
 const phi=currentPhi(),P=currentPeriod();
 const keys=[String(phi),String(P)];
 GRAPHS.forEach((g,index)=>{
  if(S.graphKeys[index]===keys[index])return;S.graphKeys[index]=keys[index];
  const c=g.ctx,w=768,h=256,L=48,R=714,T=24,B=214;
  c.fillStyle=CSS.screen;c.fillRect(0,0,w,h);c.strokeStyle=CSS.grid;c.lineWidth=1;
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
   c.strokeStyle=CSS.reference;c.beginPath();c.moveTo(19,101);c.lineTo(32,90);c.lineTo(19,79);c.moveTo(19,119);c.lineTo(32,108);c.lineTo(19,97);c.stroke();
  }else{
   c.setLineDash([9,7]);c.strokeStyle=CSS.reference;c.lineWidth=2;c.beginPath();c.moveTo(L,T);c.lineTo(R,T);c.stroke();c.setLineDash([]);
   for(const d of PHYS.DETENTS.phi){const [x]=xy(d.x,0);c.beginPath();c.moveTo(x,B);c.lineTo(x,B+10);c.stroke();}
  }
  const u=index?PHYS.periodRailX(P):PHYS.phiRailX(phi),value=index?PHYS.dayGraphY(P):PHYS.v(phi,PHYS.C.T0)/PHYS.v(0,PHYS.C.T0);
  const [x,y]=xy(u,value??0);c.strokeStyle=CSS.warm;c.lineWidth=2;c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();
  if(value!==null){c.fillStyle=CSS.warm;c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.fill();}
  c.strokeStyle=CSS.reference;c.lineWidth=3;c.beginPath();c.arc(740,233,10,.3,Math.PI*1.85);c.stroke();
  if(index){c.beginPath();c.arc(22,25,10,0,Math.PI*2);c.stroke();}
  else{c.beginPath();c.moveTo(20,38);c.lineTo(20,12);c.lineTo(13,21);c.moveTo(20,12);c.lineTo(27,21);c.stroke();}
  g.tex.needsUpdate=true;
 });
}
