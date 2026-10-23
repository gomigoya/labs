// Observatory stage: two walls, plank floor, arched night window, instrument shelves.
const floorTex = KIT.canvasTex(1024, 1024, (c, w, h) => {
  c.fillStyle = THEME.surface4; c.fillRect(0, 0, w, h);
  for (let row = 0; row < 12; row++) {
    const y = row * h / 12;
    c.fillStyle = row % 2 ? THEME.surface5 : THEME.surface6; c.fillRect(0, y, w, h / 12 - 2);
    for (let i = 0; i < 48; i++) { c.fillStyle = THEME.surface7; c.fillRect(rand() * w, y + rand() * h / 12, rand() * 240, 1); }
    for (let x = (row % 3) * 120; x < w; x += 360) { c.fillStyle = THEME.surface8; c.fillRect(x, y, 2, h / 12); }
  }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(3, 3);
KIT.mesh(new THREE.PlaneGeometry(14, 14).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.84 }), ROOM, 0, 0, 1);
KIT.roundedPanel(10, 10, 0.12, MAT.wall, ROOM, 1, 5, -2.8);
KIT.roundedPanel(0.12, 10, 10, MAT.navy, ROOM, -3.4, 5, 1.2);
for (let i = 0; i < 17; i++) {
  KIT.roundedPanel(0.47, 0.65, 0.025, MAT.wood, ROOM, -3 + i * 0.51, 0.48, -2.71);
}
KIT.roundedPanel(10, 0.045, 0.06, MAT.brass, ROOM, 1, 0.88, -2.67);
KIT.roundedPanel(0.05, 0.045, 8, MAT.brass, ROOM, -3.3, 0.88, 0.8);
for (let i = 0; i < 6; i++) KIT.roundedPanel(0.035, 3.4, 0.06, MAT.wood, ROOM, -3.2 + i * 1.4, 2.5, -2.68);

const skyTexture = KIT.canvasTex(1024, 1024, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, THEME.surface9); g.addColorStop(0.65, THEME.surface10); g.addColorStop(1, THEME.surface11);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 280; i++) { c.fillStyle = `rgba(223,238,255,${0.3 + rand() * 0.6})`; c.beginPath(); c.arc(rand() * w, rand() * h * 0.9, 0.6 + rand() * 1.7, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = THEME.surface12; c.beginPath(); c.moveTo(0, h); for (let x = 0; x <= w; x += 32) c.lineTo(x, 880 - rand() * 65); c.lineTo(w, h); c.fill();
});
const arch = new THREE.Shape(); arch.moveTo(-0.92, -0.78); arch.lineTo(0.92, -0.78); arch.lineTo(0.92, 0.14);
arch.absarc(0, 0.14, 0.92, 0, Math.PI, false); arch.lineTo(-0.92, -0.78);
const archGeo = new THREE.ShapeGeometry(arch, 48);
// ShapeGeometry's default UV uses world coordinates; normalize to the canvas bounds.
const uv = archGeo.attributes.uv, ap = archGeo.attributes.position;
for (let i = 0; i < uv.count; i++) uv.setXY(i, (ap.getX(i) + 0.92) / 1.84, (ap.getY(i) + 0.78) / 1.84);
const windowMesh = KIT.mesh(archGeo, new THREE.MeshBasicMaterial({ map: skyTexture }), ROOM, 0.7, 2.35, -2.69);
windowMesh.castShadow = false;
const windowBorder = arch.getPoints(64).map(p => V3(p.x + 0.7, p.y + 2.35, -2.64));
for (let i = 1; i < windowBorder.length; i++) KIT.rod(windowBorder[i - 1], windowBorder[i], 0.032, MAT.brass, ROOM);
KIT.rod(V3(0.7, 1.58, -2.61), V3(0.7, 3.38, -2.61), 0.018, MAT.graphite, ROOM);
KIT.rod(V3(-0.22, 2.49, -2.61), V3(1.62, 2.49, -2.61), 0.018, MAT.graphite, ROOM);
KIT.roundedPanel(2.04, 0.075, 0.28, MAT.wood, ROOM, 0.7, 1.54, -2.60);
const windowLight = new THREE.RectAreaLight(THEME.cool, 2.2, 1.6, 1.7);
windowLight.position.set(0.7, 2.5, -2.45); windowLight.rotation.y = Math.PI; ROOM.add(windowLight);

for (const [dx, dy, seed] of [[-1.45, 2.65, 0], [2.45, 2.35, 1]]) {
  KIT.roundedPanel(0.92, 0.69, 0.055, MAT.brass, ROOM, dx, dy, -2.63);
  const tex = KIT.canvasTex(512, 384, (c, w, h) => {
    c.fillStyle = THEME.surface13; c.fillRect(0, 0, w, h); c.strokeStyle = THEME.surface14; c.lineWidth = 1;
    for (let x = 32; x < w; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (let y = 24; y < h; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    const points = Array.from({ length: 9 }, (_, i) => [60 + (i % 4) * 112 + rand() * 24, 55 + Math.floor(i / 4) * 110 + rand() * 45]);
    c.strokeStyle = THEME.surface15; c.lineWidth = 3; c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    for (const [x, y] of points) { c.fillStyle = seed ? THEME.surface16 : THEME.surface17; c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill(); }
  });
  KIT.mesh(new THREE.PlaneGeometry(0.85, 0.62), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: THEME.cool, emissiveIntensity: 0.35 }), ROOM, dx, dy, -2.598);
}
for (const y of [1.13, 1.80]) {
  KIT.roundedPanel(1.85, 0.06, 0.38, MAT.wood, ROOM, -1.65, y, -2.39);
  for (const x of [-2.32, -0.98]) KIT.rod(V3(x, y - 0.25, -2.62), V3(x, y - 0.035, -2.25), 0.014, MAT.brass, ROOM);
}

// Eight observatory props: telescope, two diagrams, orrery, chart disc,
// lens rack, orbital gyroscope and a blank observation pegboard.
const telescope = new THREE.Group(); telescope.position.set(2.0,0,-1.6); ROOM.add(telescope);
for(let i=0;i<3;i++){const a=i*Math.PI*2/3; KIT.rod(V3(Math.sin(a)*0.4,0.04,Math.cos(a)*0.4),V3(0,1.2,0),0.025,MAT.brass,telescope);}
KIT.rod(V3(-0.4,1.25,0.1),V3(0.4,1.7,-0.3),0.11,MAT.navy,telescope);
KIT.rod(V3(0.32,1.65,-0.26),V3(0.45,1.73,-0.33),0.13,MAT.brass,telescope);
const orrery = new THREE.Group(); orrery.position.set(-2.05,1.25,-2.35); ROOM.add(orrery);
KIT.ball(0.07,MAT.brass,orrery);
for(let i=0;i<3;i++){
 const r=0.12+i*0.055;
 const ring=KIT.mesh(new THREE.TorusGeometry(r,0.005,5,40),MAT.chrome,orrery); ring.rotation.x=1.1;
 KIT.ball(0.025,MAT.paper,orrery,r,0,0);
}
const chart=KIT.mesh(new THREE.CylinderGeometry(0.21,0.21,0.025,32).rotateX(Math.PI/2),MAT.navy,ROOM,-1.4,1.43,-2.31);
for(let i=0;i<12;i++){const a=i/12*Math.PI*2; KIT.ball(0.009,MAT.brass,ROOM,-1.4+Math.cos(a)*0.17,1.43+Math.sin(a)*0.17,-2.285);}
KIT.roundedPanel(0.48,0.05,0.22,MAT.brass,ROOM,-1.85,1.85,-2.35);
for(let i=0;i<4;i++){
 const lens=KIT.mesh(new THREE.TorusGeometry(0.07,0.012,6,20),MAT.chrome,ROOM,-2.02+i*0.115,1.96,-2.35);lens.rotation.y=0.35;
}
const gyro=new THREE.Group();gyro.position.set(-1.02,2.02,-2.35);ROOM.add(gyro);
for(let i=0;i<3;i++){const ring=KIT.mesh(new THREE.TorusGeometry(0.15,0.009,6,32),MAT.brass,gyro);ring.rotation.set(i*0.8,i*0.7,0);}
KIT.ball(0.05,MAT.paper,gyro);
KIT.roundedPanel(0.65,0.40,0.045,MAT.navy,ROOM,2.5,1.35,-2.60);
for(let j=0;j<3;j++)for(let i=0;i<6;i++) KIT.ball(0.012,MAT.chrome,ROOM,2.25+i*0.1,1.23+j*0.11,-2.565);
KIT.lampWithBulb(ROOM,-2.6,0.7,-0.5);
// Two foreground objects intentionally continue beyond the hero view.
for(const x of [-2.7,3.3]){
 KIT.roundedPanel(x>0?2.4:1.2,0.12,1.0,MAT.wood,ROOM,x,0.78,2.0,0.05);
 for(const dx of [-0.4,0.4]) KIT.rod(V3(x+dx,0,2),V3(x+dx,0.72,2),0.04,MAT.graphite,ROOM);
 KIT.mesh(new THREE.CylinderGeometry(0.15,0.18,0.24,16),MAT.brass,ROOM,x,0.96,2);
}
// Wide instrument console and vertical front.
KIT.roundedPanel(3.8,0.83,2.25,MAT.graphite,CONSOLE,0,0.60,-0.05,0.07);
KIT.roundedPanel(3.94,0.10,2.38,MAT.wood,CONSOLE,0,MODEL.top-0.05,-0.05,0.035);
KIT.roundedPanel(3.72,0.57,0.04,MAT.navy,CONSOLE,0,0.66,1.10);
for(const x of [-1.78,1.78])for(const y of [0.43,0.91]) KIT.screw(CONSOLE,x,y,1.13);
for(let i=0;i<28;i++) KIT.roundedPanel(0.035,0.055,0.012,MAT.rubber,CONSOLE,-1.6+i*0.12,0.28,1.08,0.004);
const DIAL=KIT.knobWithArc(CONSOLE,-1.51,0.72,1.15);
const GRAPHS=[KIT.graphScreen(CONSOLE,-0.70,0.74,1.15,0.92,0.30),KIT.graphScreen(CONSOLE,0.38,0.74,1.15,0.92,0.30)];
const SLIDER=KIT.ledSlider(CONSOLE,-0.15,0.47,1.15,1.9);
KIT.mesh(new THREE.CylinderGeometry(0.14,0.14,0.05,32).rotateX(Math.PI/2),MAT.brass,CONSOLE,1.19,0.73,1.15);
const PLAY_BUTTON=KIT.mesh(new THREE.CylinderGeometry(0.105,0.105,0.05,24).rotateX(Math.PI/2),MAT.graphite,CONSOLE,1.19,0.73,1.19);
const PLAY_GLYPH=new THREE.Group(); PLAY_BUTTON.add(PLAY_GLYPH);
for(const x of [-0.024,0.024]) KIT.roundedPanel(0.015,0.07,0.008,MAT.glow,PLAY_GLYPH,x,0,0.03);
const triangle=new THREE.Shape();triangle.moveTo(-0.025,-0.04);triangle.lineTo(0.04,0);triangle.lineTo(-0.025,0.04);triangle.closePath();
const PLAY_TRIANGLE=KIT.mesh(new THREE.ShapeGeometry(triangle),MAT.glow,PLAY_BUTTON,0,0,0.031);
KIT.roundedPanel(0.28,0.29,0.025,MAT.brass,CONSOLE,1.62,0.72,1.15);
const SWITCH=KIT.rod(V3(1.62,0.66,1.18),V3(1.62,0.79,1.22),0.018,MAT.graphite,CONSOLE);
KIT.roundedPanel(2.3,0.055,0.015,MAT.brass,CONSOLE,0,0.98,1.13);
for(let i=0;i<3;i++) KIT.line(Array.from({length:33},(_,j)=>{const a=j/32*Math.PI*2;return V3(-0.1+i*0.1+Math.cos(a)*0.018,0.98+Math.sin(a)*0.018,1.142);}),THEME.graphite,CONSOLE);
function drawGraphs(){
 const i=massIndex(), r=currentR(), o=orientation();
 const keys=[`${i}:${o}:${S.u.value.toFixed(6)}`,`${S.records.map(s=>s.i).join(',')}:${i}`];
 GRAPHS.forEach((g,index)=>{
  if(S.graphKeys[index]===keys[index])return; S.graphKeys[index]=keys[index];
  const c=g.ctx,w=768,h=256,L=55,R=715,T=22,B=218;
  const css=k=>'#'+new THREE.Color(THEME[k]).getHexString();
  c.fillStyle=css('screen');c.fillRect(0,0,w,h);c.strokeStyle=css('grid');c.lineWidth=1;
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
