// Paleontology specimen room. Procedural objects and line-only stratigraphy.
KIT.mesh(new THREE.PlaneGeometry(32, 32).rotateX(-Math.PI/2), MAT.wood, ROOM, 0, 0, 1);
KIT.roundedPanel(25, 7, 0.16, MAT.wall, ROOM, 0, 3.5, -4);
KIT.roundedPanel(0.16, 7, 25, MAT.navy, ROOM, -6, 3.5, 4);
for(let i=0;i<25;i++) KIT.line([V3(-12,0.006,-11+i),V3(12,0.006,-11+i)],THEME.graphite,ROOM);
// Window is a luminous pane, without a bitmap landscape.
KIT.roundedPanel(3,2.5,0.08,MAT.brass,ROOM,1.0,3.5,-3.86);
const paneMat=new THREE.MeshStandardMaterial({color:THEME.cool,emissive:THEME.cool,emissiveIntensity:.28,roughness:.4});
KIT.roundedPanel(2.85,2.35,0.06,paneMat,ROOM,1,3.5,-3.79);
for(const x of [-0.42,1,2.42]) KIT.rod(V3(x,2.32,-3.71),V3(x,4.68,-3.71),0.035,MAT.wood,ROOM);
KIT.rod(V3(-0.42,3.5,-3.71),V3(2.42,3.5,-3.71),0.035,MAT.wood,ROOM);
const windowLight=new THREE.RectAreaLight(THEME.cool,3,2.7,2.2); windowLight.position.set(1,3.5,-3.6); windowLight.rotation.y=Math.PI; ROOM.add(windowLight);
for(const [x,y] of [[-3.4,3.55],[4.1,3.3]]){
 KIT.roundedPanel(1.8,1.25,0.08,MAT.brass,ROOM,x,y,-3.82);
 const tex=KIT.canvasTex(512,320,(c,w,h)=>{c.fillStyle=css(THEME.screen);c.fillRect(0,0,w,h);
  for(let j=0;j<7;j++){c.strokeStyle=css(j%2?THEME.sand:THEME.bone);c.lineWidth=3;c.beginPath();
   for(let i=0;i<=40;i++){const xx=15+i*12,yy=32+j*42+Math.sin(i*.28+j)*12;i?c.lineTo(xx,yy):c.moveTo(xx,yy);} c.stroke();}
  for(let i=0;i<30;i++){c.fillStyle=css(THEME.gravel);c.beginPath();c.arc(20+rand()*470,25+rand()*270,2+rand()*3,0,Math.PI*2);c.fill();}});
 KIT.mesh(new THREE.PlaneGeometry(1.66,1.12),new THREE.MeshStandardMaterial({map:tex,roughness:.8}),ROOM,x,y,-3.765);
}
// Shelves, fossil sections, footprint plaster, ammonite, bottles and a plant.
for(const y of [1.35,2.05]) KIT.roundedPanel(3.0,.08,.55,MAT.wood,ROOM,-3.1,y,-3.6);
for(let i=0;i<4;i++){
 const x=-4.2+i*.67;
 KIT.roundedPanel(.45,.42,.09,MAT.bone,ROOM,x,1.62,-3.55,.035);
 for(let j=0;j<3;j++) KIT.ball(.047,MAT.graphite,ROOM,x+(j-1)*.09,1.66+(j===1?.07:0),-3.49,0);
 KIT.roundedPanel(.43,.30,.19,MAT.navy,ROOM,x,2.25,-3.55);
 KIT.line(Array.from({length:35},(_,j)=>{const a=j*.38,r=.006+j*.004;return V3(x+Math.cos(a)*r,2.26+Math.sin(a)*r,-3.44);}),THEME.bone,ROOM);
}
for(let i=0;i<3;i++){
 const glass=new THREE.MeshPhysicalMaterial({color:THEME.glass,transparent:true,opacity:.35,roughness:.18});
 KIT.mesh(new THREE.CylinderGeometry(.12,.12,.4,12),glass,ROOM,3.5+i*.4,1.67,-3.5);
 KIT.ball(.07,MAT.bone,ROOM,3.5+i*.4,1.63,-3.5,0);
 KIT.mesh(new THREE.CylinderGeometry(.13,.13,.035,12),MAT.brass,ROOM,3.5+i*.4,1.89,-3.5);
}
KIT.roundedPanel(1.6,.08,.55,MAT.wood,ROOM,3.9,1.42,-3.55);
KIT.mesh(new THREE.CylinderGeometry(.25,.18,.45,12),MAT.bone,ROOM,5,.24,-2.7);
for(let i=0;i<8;i++) {const a=i*Math.PI/4;KIT.rod(V3(5,.4,-2.7),V3(5+Math.sin(a)*.4,1.0+rand()*.4,-2.7+Math.cos(a)*.4),.045,new THREE.MeshStandardMaterial({color:THEME.leaf,flatShading:true}),ROOM);}
for(const p of [[-3.9,1.4,-1.8],[3.8,1.2,-1.8],[-4.9,0,1.9]]) KIT.lampWithBulb(ROOM,...p);
// A ribbed specimen mat replaces the uninterrupted foreground floor.
KIT.roundedPanel(11,.045,5,MAT.navy,ROOM,0,.025,1.7,.02);
for(let j=0;j<18;j++)KIT.rod(V3(-5.3,.052,-.6+j*.25),V3(5.3,.052,-.6+j*.25),.014,MAT.rubber,ROOM);
for(const x of [-4.1,4.1]){
 KIT.roundedPanel(1.1,.6,.85,MAT.wood,ROOM,x,.36,2.2,.04);
 KIT.roundedPanel(1.15,.07,.9,MAT.brass,ROOM,x,.69,2.2);
 for(const dx of [-.3,.3])KIT.roundedPanel(.045,.6,.88,MAT.graphite,ROOM,x+dx,.36,2.2);
}
// Wide trestles support the raised arena, leaving the original working controls intact.
for(const x of [-4.1,4.1])KIT.roundedPanel(.20,.9,1.65,MAT.graphite,CONSOLE,x,.58,0,.035);
// Long instrument console, front instruments and an unmarked metal strip.
KIT.roundedPanel(6.35,.72,1.8,MAT.graphite,CONSOLE,0,.55,.15,.07);
KIT.roundedPanel(6.4,.12,1.86,MAT.wood,CONSOLE,0,PHYS.SCENE.top-.06,.15,.04);
KIT.roundedPanel(6.1,.49,.045,MAT.navy,CONSOLE,0,.67,1.07);
for(const x of [-2.85,2.85]) for(const z of [-.48,.75]) KIT.roundedPanel(.22,.25,.23,MAT.rubber,CONSOLE,x,.16,z);
KIT.roundedPanel(4.3,.035,.015,MAT.brass,CONSOLE,0,.91,1.10);
for(const x of [-3,3])for(const y of [.45,.88])KIT.screw(CONSOLE,x,y,1.10);
const DIAL=KIT.knobWithArc(CONSOLE,-2.75,.67,1.13);
const GRAPHS=[KIT.graphScreen(CONSOLE,-1.52,.68,1.13,1.58,.31),KIT.graphScreen(CONSOLE,.34,.68,1.13,1.58,.31)];
const SLIDER=KIT.ledSlider(CONSOLE,-1.45,.40,1.15,1.8);
KIT.mesh(new THREE.CylinderGeometry(.14,.14,.04,32).rotateX(Math.PI/2),MAT.brass,CONSOLE,1.72,.66,1.14);
const PLAY_BUTTON=KIT.mesh(new THREE.CylinderGeometry(.105,.105,.07,24).rotateX(Math.PI/2),MAT.brass,CONSOLE,1.72,.66,1.18);
const SWITCH=KIT.roundedPanel(.14,.15,.06,MAT.chrome,CONSOLE,2.29,.65,1.17);
KIT.roundedPanel(.03,.08,.03,MAT.glow,SWITCH,0,.02,.045);
function css(color){return '#'+new THREE.Color(color).getHexString();}
function drawGraphs(){
 const n=PHYS.kidsFromRailX(S.u.value),si=Math.round(S.species.value),gi=Math.round(S.ground.value),species=Object.keys(PHYS.SPECIES)[si],mu=Object.values(PHYS.GROUNDS)[gi];
 const keys=[n+':'+si+':'+gi+':'+S.previousGround,String(si)];
 GRAPHS.forEach((g,index)=>{if(S.graphKeys[index]===keys[index])return;S.graphKeys[index]=keys[index];
 const c=g.ctx,w=768,h=256,L=52,R=716,T=22,B=218; c.fillStyle=css(THEME.screen);c.fillRect(0,0,w,h);
 c.strokeStyle=css(THEME.grid);c.lineWidth=1;c.setLineDash([]);
 for(let i=0;i<=10;i++){c.beginPath();c.moveTo(L+i*(R-L)/10,T);c.lineTo(L+i*(R-L)/10,B);c.stroke();}
 for(let i=0;i<=4;i++){c.beginPath();c.moveTo(L,T+i*(B-T)/4);c.lineTo(R,T+i*(B-T)/4);c.stroke();}
 const max=PHYS.forceVisual(PHYS.muscle(70000)).length,fy=f=>B-PHYS.forceVisual(f).length/max*(B-T);
 if(!index){
  for(const prior of [true,false]){c.setLineDash(prior?[8,7]:[]);c.lineWidth=prior?2:4;c.strokeStyle=css(prior?THEME.reference:THEME.kids);c.beginPath();
   const ground=Object.values(PHYS.GROUNDS)[prior?S.previousGround:gi];
   for(let j=1;j<=PHYS.RANGE.kids[1];j++){const x=L+(j-1)/100*(R-L),y=fy(PHYS.kidCap(j,ground));if(j===1)c.moveTo(x,y);else c.lineTo(x,y);c.lineTo(L+j/100*(R-L),y);}c.stroke();}
  c.setLineDash([12,8]);c.strokeStyle=css(THEME.dino);c.beginPath();c.moveTo(L,fy(PHYS.dinoCap(species,mu)));c.lineTo(R,fy(PHYS.dinoCap(species,mu)));c.stroke();c.setLineDash([]);
  const x=L+PHYS.railX(n)*(R-L);c.strokeStyle=css(THEME.kids);c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();c.fillStyle=css(THEME.kids);c.beginPath();c.arc(x,fy(PHYS.kidCap(n,mu)),6,0,Math.PI*2);c.fill();
 }else{
  c.strokeStyle=css(THEME.dino);c.lineWidth=3;c.beginPath();
  Object.keys(PHYS.SPECIES).forEach((s,i)=>{const x=L+PHYS.massGraphX(s)*(R-L),y=B-PHYS.weightRatio(s)*(B-T);i?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();
  Object.keys(PHYS.SPECIES).forEach((s,i)=>{const x=L+PHYS.massGraphX(s)*(R-L),y=B-PHYS.weightRatio(s)*(B-T);c.fillStyle=css(i===si?THEME.kids:THEME.dino);c.beginPath();c.arc(x,y,i===si?8:5,0,Math.PI*2);c.fill();if(i===si){c.strokeStyle=css(THEME.kids);c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();}});
  // Same weight outlines, with dimensionless ratio fill at the two ends.
  for(const [i,s] of [Object.keys(PHYS.SPECIES)[0],Object.keys(PHYS.SPECIES).at(-1)].entries()){c.strokeStyle=css(THEME.reference);c.strokeRect(78+i*34,30,20,90);c.fillStyle=css(THEME.muscle);c.fillRect(79+i*34,120-90*PHYS.weightRatio(s),18,90*PHYS.weightRatio(s));}
 }
 // Axis-end peg stacks and quantity arrow / unequal specimen outlines.
 c.setLineDash([]);c.strokeStyle=css(THEME.reference);c.lineWidth=3;c.beginPath();c.moveTo(22,48);c.lineTo(22,20);c.lineTo(16,28);c.moveTo(22,20);c.lineTo(28,28);c.stroke();
 for(let j=0;j<3;j++){c.beginPath();c.roundRect(731+j*9,231-(index?j*5:0),6,index?8+j*5:13,3);c.stroke();}
 g.tex.needsUpdate=true;
 });
}
