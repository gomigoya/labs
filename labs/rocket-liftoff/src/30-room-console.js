// Space-center control model room. All art is procedural geometry or instrument linework.
const css=color=>`#${new THREE.Color(color).getHexString()}`;
const floorTex=KIT.canvasTex(512,512,(c,w,h)=>{
  c.fillStyle=css(THEME.wood);c.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=64){c.strokeStyle=css(THEME.graphite);c.strokeRect(0,y,w,64);
    for(let i=0;i<32;i++){c.fillStyle=css(THEME.brass);c.globalAlpha=.07;c.fillRect(rand()*w,y+rand()*64,rand()*140,1);}}
  c.globalAlpha=1;
});
floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(4,4);
KIT.mesh(new THREE.PlaneGeometry(18,18).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:floorTex,roughness:.84}),ROOM,0,0,1);
KIT.roundedPanel(14,5,.14,MAT.wall,ROOM,2,2.5,-2.8);
KIT.roundedPanel(.14,5,14,MAT.navy,ROOM,-3.4,2.5,3);
for(let i=0;i<18;i++)KIT.roundedPanel(.025,4.2,.035,MAT.chrome,ROOM,-3.2+i*.65,2.4,-2.71);
KIT.roundedPanel(14,.05,.08,MAT.brass,ROOM,2,.86,-2.67);
const sky=KIT.canvasTex(512,512,(c,w,h)=>{
 const grad=c.createLinearGradient(0,0,0,h);grad.addColorStop(0,"#102b50");grad.addColorStop(.55,"#477e9c");grad.addColorStop(1,"#d6a77d");c.fillStyle=grad;c.fillRect(0,0,w,h);
 for(let i=0;i<90;i++){c.globalAlpha=.2+rand()*.6;c.fillStyle="#e3eeff";c.fillRect(rand()*w,rand()*h*.65,1+rand(),1+rand());}
 for(let j=0;j<6;j++){c.globalAlpha=.08;c.fillStyle="#dce7ee";c.beginPath();c.ellipse(rand()*w,h*(.25+j*.10),w*.7,7+j*3,-.08,0,Math.PI*2);c.fill();}
 c.globalAlpha=1;c.fillStyle="#243d50";c.beginPath();c.moveTo(0,h);for(let i=0;i<=24;i++)c.lineTo(i*w/24,h*(.80+rand()*.10));c.lineTo(w,h);c.fill();
 c.fillStyle="#172d40";for(let i=0;i<12;i++){const x=i*w/11;c.fillRect(x,h*.84,8,h*.16);c.fillRect(x-5,h*.88,20,4);}

});
KIT.roundedPanel(2.1,2,.08,MAT.brass,ROOM,.1,2.65,-2.65);
KIT.mesh(new THREE.PlaneGeometry(1.98,1.88),new THREE.MeshBasicMaterial({map:sky}),ROOM,.1,2.65,-2.60);
for(const x of [-.9,.1,1.1])KIT.rod(V3(x,1.7,-2.55),V3(x,3.6,-2.55),.025,MAT.graphite,ROOM);
KIT.rod(V3(-.9,2.6,-2.55),V3(1.1,2.6,-2.55),.025,MAT.graphite,ROOM);
KIT.roundedPanel(2.25,.08,.30,MAT.wood,ROOM,.1,1.67,-2.5);
const daylight=new THREE.RectAreaLight(THEME.cool,2,1.9,1.9);daylight.position.set(.1,2.6,-2.4);daylight.rotation.y=Math.PI;ROOM.add(daylight);
// Launch trajectory and orbit panels; background props, never simulation output.
for(const [x,y,orbit] of [[-1.8,2.9,false],[2.25,2.7,true]]){
 KIT.roundedPanel(1.2,.85,.06,MAT.brass,ROOM,x,y,-2.62);
 const tex=KIT.canvasTex(512,384,(c,w,h)=>{
  c.fillStyle=css(THEME.screen);c.fillRect(0,0,w,h);c.strokeStyle=css(THEME.grid);c.lineWidth=1;
  for(let i=24;i<w;i+=40){c.beginPath();c.moveTo(i,0);c.lineTo(i,h);c.stroke();}
  for(let i=24;i<h;i+=40){c.beginPath();c.moveTo(0,i);c.lineTo(w,i);c.stroke();}
  c.strokeStyle=css(THEME.cool);c.lineWidth=3;c.beginPath();
  if(orbit){c.ellipse(256,192,180,90,-.4,0,Math.PI*2);c.stroke();c.beginPath();c.arc(256,192,30,0,Math.PI*2);}
  else{c.moveTo(60,330);c.bezierCurveTo(150,320,180,100,420,45);}c.stroke();
  for(let i=0;i<7;i++){c.fillStyle=css(THEME.warm);c.beginPath();c.arc(65+i*58,orbit?190+Math.sin(i)*70:325-i*43,4,0,Math.PI*2);c.fill();}
 });
 KIT.mesh(new THREE.PlaneGeometry(1.1,.75),new THREE.MeshStandardMaterial({map:tex,emissiveMap:tex,emissive:THEME.cool,emissiveIntensity:.3}),ROOM,x,y,-2.58);
}
for(const y of [1.15,1.85]){
 KIT.roundedPanel(2.1,.06,.42,MAT.wood,ROOM,-1.9,y,-2.35);
 for(const x of [-2.6,-1.2])KIT.rod(V3(x,y-.24,-2.65),V3(x,y,-2.15),.016,MAT.brass,ROOM);
}
// Tank, detached bell, constellation disc, flashlight, block plinth, hourglass, valves, canisters.
KIT.mesh(new THREE.CylinderGeometry(.12,.12,.36,12),MAT.ceramic,ROOM,-2.6,2.06,-2.3);
for(const y of [1.91,2.21])KIT.mesh(new THREE.TorusGeometry(.12,.012,6,16).rotateX(Math.PI/2),MAT.brass,ROOM,-2.6,y,-2.3);
KIT.mesh(new THREE.CylinderGeometry(.055,.14,.19,12,1,true),MAT.chrome,ROOM,-2.14,1.98,-2.3);
const disc=KIT.mesh(new THREE.CircleGeometry(.22,16),MAT.navy,ROOM,-1.55,2.08,-2.3);
const stars=Array.from({length:7},()=>V3((rand()-.5)*.32,(rand()-.5)*.32,.01));KIT.line(stars,THEME.cool,disc);
for(const p of stars)KIT.ball(.012,MAT.glow,disc,...p.toArray(),0);
KIT.rod(V3(-2.6,1.22,-2.3),V3(-2.37,1.30,-2.3),.045,MAT.graphite,ROOM);
KIT.mesh(new THREE.CylinderGeometry(.06,.06,.04,12).rotateZ(Math.PI/2),MAT.brass,ROOM,-2.35,1.31,-2.3);
KIT.roundedPanel(.25,.13,.20,MAT.navy,ROOM,-1.98,1.25,-2.3);
KIT.ball(.10,MAT.chrome,ROOM,-1.98,1.40,-2.3,0);
for(const y of [1.21,1.52])KIT.mesh(new THREE.CylinderGeometry(.10,.10,.025,16),MAT.brass,ROOM,-1.52,y,-2.3);
for(const s of [-1,1]){const cone=KIT.mesh(new THREE.ConeGeometry(.075,.14,12),MAT.ceramic,ROOM,-1.52,1.365+s*.07,-2.3);cone.rotation.z=s>0?Math.PI:0;}
for(const dx of [-.085,.085])KIT.rod(V3(-1.52+dx,1.22,-2.3),V3(-1.52+dx,1.51,-2.3),.008,MAT.chrome,ROOM);
for(let i=0;i<3;i++){KIT.mesh(new THREE.CylinderGeometry(.06,.06,.22,12),MAT.chrome,ROOM,1.7+i*.22,1.5,-2.4);KIT.ball(.045,MAT.brass,ROOM,1.7+i*.22,1.64,-2.4);}
KIT.roundedPanel(.85,.06,.35,MAT.wood,ROOM,1.95,1.35,-2.4);
KIT.lampWithBulb(ROOM,-2.0,.84,-.8);
KIT.lampWithBulb(ROOM,2.45,.84,-1.0);
// Two foreground objects extend through the image edges in the default hero frame.
for(const [x,y] of [[-2.3,.55],[-3.1,.55],[3.5,1.2]]){
 KIT.roundedPanel(.85,.12,.7,MAT.wood,ROOM,x,y,1.7,.05);
 for(const dx of [-.3,.3])KIT.rod(V3(x+dx,.04,1.7),V3(x+dx,y-.05,1.7),.035,MAT.graphite,ROOM);
}
// Front-facing instruments stay readable from the elevated camera.
KIT.roundedPanel(PHYS.SCENE.platformWidth+.12,.62,1.02,MAT.graphite,CONSOLE,0,.48,.10,.07);
KIT.roundedPanel(PHYS.SCENE.platformWidth+.24,.10,1.16,MAT.wood,CONSOLE,0,PHYS.SCENE.top-.05,.1,.035);
KIT.roundedPanel(PHYS.SCENE.platformWidth+.04,.018,1.02,MAT.graphite,CONSOLE,0,PHYS.SCENE.top+.008,.1);
KIT.roundedPanel(3.36,.43,.035,MAT.navy,CONSOLE,0,.54,.63);
for(const x of [-1.61,1.61])for(const y of [.37,.71])KIT.screw(CONSOLE,x,y,.654);
for(let i=0;i<27;i++)KIT.roundedPanel(.028,.06,.012,MAT.rubber,CONSOLE,-1.42+i*.11,.22,.618,.004);
const DIAL=KIT.knobWithArc(CONSOLE,-1.38,.54,.681);
const GRAPHS=[KIT.graphScreen(CONSOLE,-.70,.57,.68,.67,.24),KIT.graphScreen(CONSOLE,.08,.57,.68,.67,.24)];
const SLIDER=KIT.ledSlider(CONSOLE,PHYS.SCENE.railX,PHYS.SCENE.railY,PHYS.SCENE.railZ,PHYS.SCENE.railWidth);
// Replace generic fine ticks with categorical PHYS detents.
for(const d of PHYS.DETENTS.engines)KIT.ball(.012,MAT.brass,CONSOLE,SLIDER.x+(d.x-.5)*SLIDER.width,.275,.71,0);
KIT.mesh(new THREE.CylinderGeometry(.12,.12,.045,32).rotateX(Math.PI/2),MAT.brass,CONSOLE,.72,.54,.69);
const PLAY_BUTTON=KIT.mesh(new THREE.CylinderGeometry(.095,.095,.06,24).rotateX(Math.PI/2),MAT.graphite,CONSOLE,.72,.54,.72);
const playShape=new THREE.Shape();playShape.moveTo(-.025,-.035);playShape.lineTo(.04,0);playShape.lineTo(-.025,.035);playShape.closePath();
const PLAY_TRIANGLE=KIT.mesh(new THREE.ShapeGeometry(playShape),MAT.glow,PLAY_BUTTON,0,0,.033);
const PLAY_GLYPH=new THREE.Group();PLAY_BUTTON.add(PLAY_GLYPH);
for(const x of [-.023,.023])KIT.roundedPanel(.012,.065,.005,MAT.glow,PLAY_GLYPH,x,0,.033,.002);
KIT.roundedPanel(.32,.22,.025,MAT.brass,CONSOLE,1.17,.54,.69);
const GRAVITY_SWITCH=KIT.rod(V3(1.17,.50,.72),V3(1.17,.60,.79),.025,MAT.chrome,CONSOLE);
KIT.roundedPanel(.5,.045,.01,MAT.brass,CONSOLE,1.15,.37,.67);
for(let i=0;i<5;i++)KIT.ball(.009,MAT.graphite,CONSOLE,.98+i*.075,.37,.68,0);

function drawGraphs(){
 const {n,load,g}=selection(),ignited=!!S.ignited.target,t=S.t.value;
 const key=[n,load,g,ignited,t.toFixed(4)].join(':');if(S.graphKeys[0]===key)return;S.graphKeys[0]=key;
 const burn=PHYS.burnTime(n),landing=PHYS.stateAt(n,load,g,0).landingT;
 const horizon=Number.isFinite(landing)?landing:burn,observed=Math.min(t,horizon);
 const maxForce=PHYS.m0(load)*g>PHYS.thrust(n)?PHYS.m0(load)*g:PHYS.thrust(n);
 const sample=PHYS.simulate(n,load,g,observed,Math.max(horizon/PHYS.SCENE.graphSamples,.01));
 const all=PHYS.simulate(n,load,g,horizon,horizon/PHYS.SCENE.graphSamples);
 const vScale=Math.max(1,...all.v.map(Math.abs));
 GRAPHS.forEach((screen,index)=>{
  const c=screen.ctx,{width:w,height:h,left:L,right:R,top:U,bottom:B}=PHYS.SCENE.graph;
  c.fillStyle=css(THEME.screen);c.fillRect(0,0,w,h);c.lineWidth=1;c.strokeStyle=css(THEME.grid);
  for(let i=0;i<=10;i++){const x=L+(R-L)*i/10;c.beginPath();c.moveTo(x,U);c.lineTo(x,B);c.stroke();}
  for(let i=0;i<=4;i++){const y=U+(B-U)*i/4;c.beginPath();c.moveTo(L,y);c.lineTo(R,y);c.stroke();}
  const X=time=>L+(R-L)*time/horizon,Y=value=>index?(U+B)/2-value/vScale*(B-U)*.45:B-value/maxForce*(B-U)*.9;
  if(ignited){
   for(const [field,color] of index?[['v',THEME.speed]]:[['T',THEME.thrust],['W',THEME.weight],['normal',THEME.support]]){
    c.strokeStyle=css(color);c.lineWidth=3;c.beginPath();let prior=null;
    const times=[...sample.t];if(burn<=observed)times.push(burn-1e-7,burn);times.sort((a,b)=>a-b);
    for(const time of times){const value=PHYS.stateAt(n,load,g,time)[field],x=X(time),y=Y(value);
     if(prior===null||((field==='T'||field==='normal')&&prior<burn&&time>=burn))c.moveTo(x,y);else c.lineTo(x,y);prior=time;}c.stroke();
    if(!index&&['T','normal'].includes(field)&&burn<=observed){
     for(const [time,filled] of [[burn-1e-7,false],[burn,true]]){c.beginPath();c.arc(X(burn),Y(PHYS.stateAt(n,load,g,time)[field]),4,0,Math.PI*2);c.stroke();if(filled){c.fillStyle=css(color);c.fill();}}
    }
    const y=Y(PHYS.stateAt(n,load,g,observed)[field]);c.fillStyle=css(color);c.beginPath();c.arc(X(observed),y,5,0,Math.PI*2);c.fill();
   }
   c.strokeStyle=css(THEME.ceramic);c.lineWidth=2;c.beginPath();c.moveTo(X(observed),U);c.lineTo(X(observed),B);c.stroke();
   for(const event of sample.events){c.fillStyle=css(THEME.brass);c.beginPath();c.moveTo(X(event.t)-5,B+9);c.lineTo(X(event.t),B);c.lineTo(X(event.t)+5,B+9);c.fill();}
  }
  // Axis-end clock and quantity symbols: paths only, no font rasterization.
  c.strokeStyle=css(THEME.chrome);c.lineWidth=3;c.beginPath();c.arc(742,235,10,0,Math.PI*2);c.moveTo(742,228);c.lineTo(742,235);c.lineTo(748,238);c.stroke();
  if(index){for(let i=0;i<3;i++){c.fillStyle=css(THEME.speed);c.beginPath();c.arc(18,22+i*i*7,3,0,Math.PI*2);c.fill();}}
  else{c.beginPath();c.moveTo(22,56);c.lineTo(22,20);c.moveTo(14,28);c.lineTo(22,20);c.lineTo(30,28);for(let y=34;y<57;y+=10){c.moveTo(16,y);c.lineTo(28,y);}c.stroke();}
  screen.tex.needsUpdate=true;
 });
}

// Launch gantry and paired storage vessels: geometry, no external artwork.
for(const x of [-.05,.18])KIT.rod(V3(x,.97,-.34),V3(x,2.88,-.34),.022,MAT.chrome,HERO);
for(let i=0;i<7;i++){
 const y=1.03+i*.27;KIT.rod(V3(-.05,y,-.34),V3(.18,y+.27,-.34),.012,MAT.brass,HERO);
 KIT.rod(V3(.18,y,-.34),V3(-.05,y+.27,-.34),.012,MAT.brass,HERO);
}
for(const y of [1.40,2.1,2.75])KIT.rod(V3(-.05,y,-.34),V3(-.40,y,-.34),.018,MAT.graphite,HERO);
for(const x of [1.80,2.00]){
 KIT.mesh(new THREE.CylinderGeometry(.075,.075,.44,16),MAT.chrome,HERO,x,1.23,-.25);
 KIT.ball(.075,MAT.chrome,HERO,x,1.45,-.25);KIT.ball(.075,MAT.chrome,HERO,x,1.01,-.25);
 KIT.rod(V3(x,1.12,-.25),V3(.20,1.00,-.29),.009,MAT.brass,HERO);
}
