// Observatory stage: two walls, plank floor, arched night window, instrument shelves.
const floorTex = KIT.canvasTex(1024, 1024, (c, w, h) => {
  c.fillStyle = THEME.floor; c.fillRect(0, 0, w, h);
  for (let row = 0; row < 12; row++) {
    const y = row * h / 12;
    c.fillStyle = row % 2 ? THEME.plankA : THEME.plankB; c.fillRect(0, y, w, h / 12 - 2);
    for (let i = 0; i < 48; i++) { c.fillStyle = THEME.grain; c.fillRect(rand() * w, y + rand() * h / 12, rand() * 240, 1); }
    for (let x = (row % 3) * 120; x < w; x += 360) { c.fillStyle = THEME.joint; c.fillRect(x, y, 2, h / 12); }
  }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(3, 3);
KIT.mesh(new THREE.PlaneGeometry(14, 14).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.84 }), ROOM, 0, 0, 1);
KIT.roundedPanel(10, 4.5, 0.12, MAT.wall, ROOM, 1, 2.25, -2.8);
KIT.roundedPanel(0.12, 4.5, 10, MAT.navy, ROOM, -3.4, 2.25, 1.2);
for (let i = 0; i < 17; i++) {
  KIT.roundedPanel(0.47, 0.65, 0.025, MAT.wood, ROOM, -3 + i * 0.51, 0.48, -2.71);
}
KIT.roundedPanel(10, 0.045, 0.06, MAT.brass, ROOM, 1, 0.88, -2.67);
KIT.roundedPanel(0.05, 0.045, 8, MAT.brass, ROOM, -3.3, 0.88, 0.8);
for (let i = 0; i < 6; i++) KIT.roundedPanel(0.035, 3.4, 0.06, MAT.wood, ROOM, -3.2 + i * 1.4, 2.5, -2.68);

const skyTexture = KIT.canvasTex(1024, 1024, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, THEME.night); g.addColorStop(0.65, THEME.dusk); g.addColorStop(1, THEME.skyGlow);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 280; i++) { c.fillStyle = `rgba(223,238,255,${0.3 + rand() * 0.6})`; c.beginPath(); c.arc(rand() * w, rand() * h * 0.9, 0.6 + rand() * 1.7, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = THEME.horizon; c.beginPath(); c.moveTo(0, h); for (let x = 0; x <= w; x += 32) c.lineTo(x, 880 - rand() * 65); c.lineTo(w, h); c.fill();
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
    c.fillStyle = THEME.panel; c.fillRect(0, 0, w, h); c.strokeStyle = THEME.panelGrid; c.lineWidth = 1;
    for (let x = 32; x < w; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (let y = 24; y < h; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.strokeStyle = THEME.diagram; c.lineWidth = 3;
    if (!seed) {
      for (let k = 1; k <= 4; k++) { c.beginPath(); c.ellipse(w/2,h/2,k*49,k*30,-0.3,0,Math.PI*2); c.stroke(); }
      for (let k = 0; k < 5; k++) { c.fillStyle = THEME.diagramPoint; c.beginPath(); c.arc(w/2+Math.cos(k*1.7)*k*43,h/2+Math.sin(k*1.7)*k*24,6,0,Math.PI*2); c.fill(); }
    } else {
      c.beginPath(); c.arc(w/2,h/2,90,0,Math.PI*2); c.stroke();
      for (let k=0;k<12;k++) { const a=k/12*Math.PI*2; c.beginPath(); c.moveTo(w/2+Math.cos(a)*150,h/2+Math.sin(a)*150); c.lineTo(w/2+Math.cos(a)*100,h/2+Math.sin(a)*100); c.stroke(); }
      c.fillStyle=THEME.diagramPoint; c.beginPath(); c.arc(w/2,h/2,9,0,Math.PI*2); c.fill();
    }
  });
  KIT.mesh(new THREE.PlaneGeometry(0.85, 0.62), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: THEME.cool, emissiveIntensity: 0.35 }), ROOM, dx, dy, -2.598);
}
for (const y of [1.13, 1.80]) {
  KIT.roundedPanel(1.85, 0.06, 0.38, MAT.wood, ROOM, -1.65, y, -2.39);
  for (const x of [-2.32, -0.98]) KIT.rod(V3(x, y - 0.25, -2.62), V3(x, y - 0.035, -2.25), 0.014, MAT.brass, ROOM);
}
// Eight thematic prop families: specimen rack, two panels, dome window, lamps,
// standard-weight chest, ring models, glass jars, telescope and foreground trays.
for (let i=0;i<6;i++) {
  const x=-2.35+i*0.26;
  KIT.rod(V3(x,1.84,-2.36),V3(x,1.99,-2.36),0.009,MAT.brass,ROOM);
  KIT.ball(0.075,new THREE.MeshStandardMaterial({color:THEME.bodies[i],flatShading:true}),ROOM,x,2.05,-2.36,1);
}
KIT.roundedPanel(0.48,0.18,0.26,MAT.navy,ROOM,-2.15,1.24,-2.35);
for(let i=0;i<5;i++) KIT.mesh(new THREE.CylinderGeometry(0.032,0.04,0.08,12),MAT.chrome,ROOM,-2.32+i*0.08,1.37,-2.35);
for(let i=0;i<3;i++) {
  KIT.mesh(new THREE.TorusGeometry(0.10,0.008,6,24),MAT.brass,ROOM,-1.6+i*0.22,1.32,-2.35).rotation.x=i*0.45;
  KIT.ball(0.045,MAT.chrome,ROOM,-1.6+i*0.22,1.32,-2.35,1);
}
const glassMat=new THREE.MeshPhysicalMaterial({color:THEME.cool,transparent:true,opacity:0.3,roughness:0.15,depthWrite:false});
KIT.roundedPanel(0.85,0.05,0.30,MAT.wood,ROOM,2.1,1.45,-2.48);
for(let i=0;i<3;i++) {
  KIT.mesh(new THREE.CylinderGeometry(0.06,0.06,0.21,12),glassMat,ROOM,1.85+i*0.23,1.59,-2.43);
  KIT.mesh(new THREE.CylinderGeometry(0.065,0.065,0.025,12),MAT.brass,ROOM,1.85+i*0.23,1.71,-2.43);
  KIT.ball(0.035,MAT.chrome,ROOM,1.85+i*0.23,1.54,-2.43,0);
}
const telescope=new THREE.Group();telescope.position.set(2.2,0,-1.3);ROOM.add(telescope);
for(let i=0;i<3;i++){const a=i/3*Math.PI*2;KIT.rod(V3(Math.cos(a)*0.4,0.04,Math.sin(a)*0.4),V3(0,1.18,0),0.023,MAT.brass,telescope);}
KIT.rod(V3(-0.35,1.24,0),V3(0.4,1.62,-0.28),0.105,MAT.navy,telescope);
KIT.rod(V3(0.36,1.60,-0.27),V3(0.44,1.64,-0.30),0.12,MAT.brass,telescope);
KIT.lampWithBulb(ROOM,-1.90,0.86,-0.65);
KIT.lampWithBulb(ROOM,2.0,0.86,-0.65);
// Oversized foreground props cross the edges while the apparatus stays inside.
KIT.roundedPanel(1.1,0.13,0.65,MAT.wood,ROOM,-2.35,0.55,2.1,0.05);
for(const dx of [-0.4,0.4])for(const dz of [-0.23,0.23]) KIT.rod(V3(-2.35+dx,0.04,2.1+dz),V3(-2.35+dx,0.50,2.1+dz),0.035,MAT.graphite,ROOM);
KIT.roundedPanel(1.0,0.06,0.65,MAT.brass,ROOM,2.4,0.63,2.0);
KIT.ball(0.17,MAT.chrome,ROOM,2.4,0.83,2.0);

// Long console, readable vertical front, metal diagram plate without engraving text.
KIT.roundedPanel(3.52,0.62,1.08,MAT.graphite,CONSOLE,-0.03,0.48,0.05,0.07);
KIT.roundedPanel(3.64,0.10,1.20,MAT.wood,CONSOLE,-0.03,PHYS.VIEW.top-0.05,0.05,0.035);
KIT.roundedPanel(3.48,0.018,1.08,MAT.navy,CONSOLE,-0.03,PHYS.VIEW.top+0.008,0.05);
KIT.roundedPanel(3.42,0.43,0.035,MAT.navy,CONSOLE,-0.03,0.54,0.62);
for(const x of [-1.66,1.60])for(const y of [0.37,0.71]) KIT.screw(CONSOLE,x,y,0.65);
for(let i=0;i<26;i++) KIT.roundedPanel(0.025,0.06,0.012,MAT.rubber,CONSOLE,-1.40+i*0.11,0.22,0.61,0.004);
for(const x of [-1.45,1.4])for(const z of [-0.3,0.5]) KIT.roundedPanel(0.21,0.15,0.18,MAT.rubber,CONSOLE,x,0.10,z);
const DIAL=KIT.knobWithArc(CONSOLE,-1.40,0.55,0.68);
const GRAPHS=[KIT.graphScreen(CONSOLE,-0.68,0.58,0.68,0.80,0.25),KIT.graphScreen(CONSOLE,0.23,0.58,0.68,0.80,0.25)];
const SLIDER=KIT.ledSlider(CONSOLE,-0.22,0.36,0.69,1.60);
KIT.mesh(new THREE.CylinderGeometry(0.13,0.13,0.05,32).rotateX(Math.PI/2),MAT.brass,CONSOLE,1.04,0.55,0.69);
const RUN_BUTTON=KIT.mesh(new THREE.CylinderGeometry(0.10,0.10,0.06,24).rotateX(Math.PI/2),MAT.graphite,CONSOLE,1.04,0.55,0.73);
KIT.line([V3(-0.04,-0.02,0.034),V3(0,0.035,0.034),V3(0.04,-0.02,0.034)],THEME.mint,RUN_BUTTON);
KIT.roundedPanel(0.30,0.28,0.025,MAT.brass,CONSOLE,1.43,0.55,0.68);
KIT.line([V3(1.33,0.59,0.7),V3(1.53,0.59,0.7),V3(1.43,0.59,0.7),V3(1.43,0.46,0.7)],THEME.graphite,CONSOLE);
for(const x of [1.35,1.51]) KIT.line([V3(x-0.04,0.52,0.7),V3(x,0.48,0.7),V3(x+0.04,0.52,0.7)],THEME.graphite,CONSOLE);
const SOUND_SWITCH=KIT.roundedPanel(0.06,0.09,0.035,MAT.chrome,CONSOLE,1.43,0.35,0.72);

function drawGraphs(){
  const i=PHYS.bodyFromRailX(PHYS.bodyRailX(Math.round(S.body.value))), n=Math.round(S.nWeights.value);
  const baselineBody=GRAMMAR.baseline?.i??0;
  const keys=[`${i}:${n}:${baselineBody}`,`${i}:${S.trial?.runId||0}`];
  GRAPHS.forEach((g,index)=>{
    if(S.graphKeys[index]===keys[index])return;S.graphKeys[index]=keys[index];
    const c=g.ctx,w=768,h=256,L=52,R=724,T=22,B=214;
    c.fillStyle=THEME.screen;c.fillRect(0,0,w,h);c.strokeStyle=THEME.grid;c.lineWidth=1;
    for(let k=0;k<=10;k++){const x=L+(R-L)*k/10;c.beginPath();c.moveTo(x,T);c.lineTo(x,B);c.stroke();}
    for(let k=0;k<=6;k++){const y=T+(B-T)*k/6;c.beginPath();c.moveTo(L,y);c.lineTo(R,y);c.stroke();}
    const dot=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
    const forceColor='#'+new THREE.Color(THEME.force).getHexString(),mint='#'+new THREE.Color(THEME.mint).getHexString();
    if(!index){
      for(const reference of [true,false]){
        c.strokeStyle=reference?'#'+new THREE.Color(THEME.reference).getHexString():forceColor;c.lineWidth=3;c.setLineDash(reference?[9,7]:[]);c.beginPath();
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
