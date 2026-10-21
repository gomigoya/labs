// ==== BALANCE: wordless, procedural apparatus on the shared console ====
const BAL = { root: null, pans: {}, objects: {}, samples: {}, picks: [], drag: null };
const BAL_ORIGIN = { x: 0.25, z: -0.12, pivot: 0.52 };
const balanceParams = () => ({ ...S.balance, g: S.g.tgt });
function balanceSet(patch) {
  const next = { ...S.balance };
  for (const side of ['left', 'right']) if (patch[side]) next[side] = PHYS.balanceSide({ ...next[side], ...patch[side] });
  // A physical specimen exists once; the most recently placed side wins.
  for (const side of ['left', 'right']) if (patch[side]?.obj && next[side].obj === next[side === 'left' ? 'right' : 'left'].obj)
    next[side === 'left' ? 'right' : 'left'] = { ...next[side === 'left' ? 'right' : 'left'], obj: null };
  S.balance = next;
  updateBalance(0);
}
function balancePlace(side, obj) { if (side === 'left' || side === 'right') balanceSet({ [side]: { obj } }); }
function balanceClips(side, clips) { if (side === 'left' || side === 'right') balanceSet({ [side]: { clips } }); }
function balancePos(side, pos) { if (side === 'left' || side === 'right') balanceSet({ [side]: { pos } }); }
function buildBalance() {
  const style = document.createElement('style');
  style.textContent = `
    body.balance-station #kidhud, body.balance-station #legend, body.balance-station #kpop,
    body.balance-station #caption, body.balance-station #chips, body.balance-station #hook,
    body.balance-station #kicker, body.balance-station #kidSub, body.balance-station #lead,
    body.balance-station #hint, body.balance-station #event, body.balance-station #modeBtn,
    body.balance-station #kcall, body.balance-station #knote, body.balance-station #kslow,
    body.balance-station #lesson, body.balance-station #kidIntro { display:none!important; }
    body.balance-station #panel .prow:not(:has(#stations)),
    body.balance-station #panel .prow:has(#stations)>:not(#stations) { display:none!important; }
    body.balance-station #ktc { display:none!important; }
    .balance-card { width:min(420px,65vw); height:160px; display:block; margin:auto; }
    body.balance-station #kid .kpic { height:90px; }
    body.balance-station #kid .kpic svg { width:100%; max-width:112px; height:90px; }
    body.balance-station #kid .kpred { width:min(540px,calc(100vw - 24px)); }
    body.balance-station #kid .kstations button, body.balance-station #kid .kreset { min-width:48px; min-height:48px; }
    body.balance-station #kid .kstations svg { width:24px; height:24px; }
  `;
  document.head.appendChild(style);
  const root = new THREE.Group(); root.position.set(BAL_ORIGIN.x, TOP, BAL_ORIGIN.z); RIG.add(root); BAL.root = root;
  const add = (o, parent, x, y, z) => { o.position.set(x, y, z); parent.add(o); return o; };
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const target = (parent, kind, w, h, d, x=0, y=0, z=0) => {
    const m = add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),hitMat),parent,x,y,z);
    m.userData.pick = kind; BAL.picks.push(m); return m;
  };
  add(roundedPanel(0.30,0.025,0.20,0.01,MAT.graphite),root,0,0.013,-0.02);
  add(cyl(0.012,BAL_ORIGIN.pivot,MAT.chrome),root,0,BAL_ORIGIN.pivot/2, -0.025);
  add(roundedPanel(0.045,0.045,0.045,0.01,MAT.brass),root,0,BAL_ORIGIN.pivot,-0.02);
  const beam = new THREE.Group(); add(beam,root,0,BAL_ORIGIN.pivot,0); BAL.beam = beam;
  add(roundedPanel(0.63,0.024,0.028,0.006,MAT.brass),beam,0,0,0);
  // Recess-like dark numerals and tick strokes on the front face; only 1..5.
  for (const sign of [-1,1]) for(let p=1;p<=5;p++) {
    const tex=canvasTex(64,96,(c,W,H)=>{c.clearRect(0,0,W,H);c.fillStyle='#30271d';c.font='700 62px sans-serif';c.textAlign='center';c.fillText(String(p),W/2,70);});
    add(new THREE.Mesh(new THREE.PlaneGeometry(0.015,0.021),new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:0.85})),beam,sign*p*PHYS.BALANCE.spacing,-0.002,0.0145);
    add(roundedPanel(0.0015,0.005,0.002,0.0004,MAT.graphiteD),beam,sign*p*PHYS.BALANCE.spacing,0.009,0.015);
  }
  // Fixed arc, two physical end stops, and a moving pointer.
  const arc=add(new THREE.Mesh(new THREE.TorusGeometry(0.075,0.002,8,32,Math.PI*0.8),MAT.chrome),root,0,BAL_ORIGIN.pivot,0.036);
  arc.rotation.z=Math.PI*0.1;
  for(const sign of [-1,1]) {
    add(cyl(0.007,0.025,MAT.rubber),root,sign*0.095,BAL_ORIGIN.pivot-0.095*Math.tan(PHYS.BALANCE.thetaMax)-0.018,0);
  }
  add(roundedPanel(0.003,0.065,0.003,0.001,MAT.pointer),beam,0,0.039,0.038);
  const ledMat=new THREE.MeshStandardMaterial({color:0x385044,emissive:0x66dd99,emissiveIntensity:0});
  BAL.led=add(new THREE.Mesh(new THREE.TorusGeometry(0.020,0.003,10,32),ledMat),root,0,0.37,0.025);
  const tray=add(roundedPanel(0.85,0.018,0.17,0.008,MAT.graphiteL),root,0,0.012,0.32);
  target(tray,'balance:tray',0.89,0.12,0.20,0,0.04,0);
  const specs=[['a',0.043,0xa65a3a,'box'],['b',0.020,0x6f95a3,'ball'],['c',0.030,0x6d9a52,'cylinder'],['d',0.034,0xc9a15b,'cone'],['e',0.026,0x8c7caf,'octa']];
  specs.forEach(([id,r,color,shape],i)=>{
    const group=new THREE.Group();root.add(group);
    const mat=new THREE.MeshStandardMaterial({color,roughness:0.56,metalness:0.12});
    const geo=shape==='ball'?new THREE.SphereGeometry(r,24,16):shape==='cylinder'?new THREE.CylinderGeometry(r,r,r*1.5,24):shape==='cone'?new THREE.ConeGeometry(r,r*2,24):shape==='octa'?new THREE.OctahedronGeometry(r):null;
    const m=geo?new THREE.Mesh(geo,mat):roundedPanel(r*2,r*1.5,r*1.7,0.008,mat);
    m.position.y=r;group.add(m);shadowify(group);
    target(group,'balance:obj:'+id,Math.max(0.065,r*2),0.09,Math.max(0.065,r*2),0,0.035,0);
    BAL.objects[id]={group,home:new THREE.Vector3(-0.33+i*0.125,0.024,0.32)};
  });
  // Open paperclip outline, instanced with deterministic placement.
  const path=new THREE.CurvePath();
  const points=[[-.006,-.012],[-.006,.009],[-.003,.013],[.004,.013],[.007,.009],[.007,-.009],[.004,-.012],[0,-.012],[-.002,-.009],[-.002,.007],[.002,.009],[.003,.006],[.003,-.006]];
  for(let i=1;i<points.length;i++) path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1],0),new THREE.Vector3(...points[i],0)));
  const clipGeo=new THREE.TubeGeometry(path,44,0.0009,5,false);
  const matrix=new THREE.Object3D(), rng=mulberry32(71021);
  for(const [side,sign]of [['left',-1],['right',1]]) {
    const pan=new THREE.Group();root.add(pan);
    const ring=add(new THREE.Mesh(new THREE.TorusGeometry(0.013,0.0025,8,24),MAT.chrome),root,0,0,0);
    target(ring,'balance:ring:'+side,0.047,0.065,0.065);
    for(const x of [-0.045,0.045]) {
      const wire=add(cyl(0.001,Math.hypot(0.20,x),MAT.chrome,8),pan,x/2,0.10,0);wire.rotation.z=Math.atan2(x,0.20);
    }
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.057,0.045,0.012,36),MAT.brassD),pan,0,0,0);
    add(new THREE.Mesh(new THREE.TorusGeometry(0.054,0.0025,8,32),MAT.brass),pan,0,0.006,0).rotation.x=Math.PI/2;
    target(pan,'balance:pan:'+side,0.12,0.075,0.13,0,0.018,0);
    const clips=new THREE.InstancedMesh(clipGeo,MAT.chrome,PHYS.BALANCE.MAX_CLIPS);clips.castShadow=true;pan.add(clips);
    for(let i=0;i<PHYS.BALANCE.MAX_CLIPS;i++) {
      matrix.position.set(0.024+(rng()-.5)*0.025,0.012+Math.floor(i/10)*0.003,(rng()-.5)*0.055);
      matrix.rotation.set(Math.PI/2,0,rng()*Math.PI);matrix.updateMatrix();clips.setMatrixAt(i,matrix.matrix);
    }
    clips.computeBoundingSphere();
    target(pan,'balance:pile:'+side,0.042,0.045,0.065,0.032,0.024,0);
    const board=add(roundedPanel(0.115,0.073,0.006,0.003,MAT.graphite),pan,sign*0.12,0.025,0.03);
    const dots=new THREE.InstancedMesh(new THREE.SphereGeometry(0.0028,8,6),MAT.white,PHYS.BALANCE.MAX_CLIPS);board.add(dots);
    for(let i=0;i<PHYS.BALANCE.MAX_CLIPS;i++){matrix.position.set(-0.045+(i%10)*0.010,0.026-Math.floor(i/10)*0.010,0.005);matrix.rotation.set(0,0,0);matrix.updateMatrix();dots.setMatrixAt(i,matrix.matrix);}
    dots.computeBoundingSphere();
    BAL.pans[side]={pan,ring,clips,dots,sign};
  }
  for(const [n,x]of [[1,0.315],[10,0.395]]) {
    const sample=new THREE.InstancedMesh(clipGeo,MAT.chrome,n);root.add(sample);
    for(let i=0;i<n;i++){matrix.position.set(x+(i%2)*0.014,0.03+Math.floor(i/2)*0.002,0.32);matrix.rotation.set(Math.PI/2,0,0);matrix.updateMatrix();sample.setMatrixAt(i,matrix.matrix);}
    target(root,'balance:clip:'+n,0.065,0.08,0.12,x,0.045,0.32);
    BAL.samples[n]={mesh:sample,home:new THREE.Vector3(x,0.03,0.32)};
  }
  root.visible=false;updateBalance(0);
}
function updateBalance(dt) {
  if(!BAL.root)return;
  const result=PHYS.balance(balanceParams());
  S.beam=PHYS.beamStep(S.beam,result.thetaTarget,dt);
  BAL.beam.rotation.z=-S.beam.theta;
  BAL.led.material.color.setHex(result.level?0x88efb0:0x385044);
  BAL.led.material.emissiveIntensity=result.level?0.5:0;
  for(const side of ['left','right']) {
    const p=S.balance[side], v=BAL.pans[side], d=v.sign*p.pos*PHYS.BALANCE.spacing;
    v.ring.position.set(d*Math.cos(S.beam.theta),BAL_ORIGIN.pivot-d*Math.sin(S.beam.theta),0);
    v.pan.position.copy(v.ring.position);v.pan.position.y-=0.20;
    v.clips.count=p.clips;v.dots.count=p.clips;
  }
  for(const [id,o]of Object.entries(BAL.objects)) {
    const side=['left','right'].find(s=>S.balance[s].obj===id);
    o.group.position.copy(side?BAL.pans[side].pan.position:o.home);
    if(side){o.group.position.x-=0.015;o.group.position.y+=0.012;}
  }
  if(BAL.drag?.obj && BAL.drag.point)BAL.objects[BAL.drag.obj].group.position.copy(BAL.drag.point);
  if(BAL.drag?.preview && BAL.drag.point)BAL.drag.preview.position.copy(BAL.drag.point).sub(BAL.samples[BAL.drag.id].home);
}
function balanceDown(e,hit) {
  if(!hit.kind.startsWith('balance:'))return false;
  if(S.mode==='kid'&&!KID.free) { if(!KID.allows(hit.kind))return true; KID.acted(); }
  const [,kind,id]=hit.kind.split(':');
  if(kind==='pile'){balanceClips(id,S.balance[id].clips-1);sfx('tick');return true;}
  if(!['obj','ring','clip'].includes(kind))return true;
  BAL.drag={kind,id,obj:kind==='obj'?id:null};DRAG.kind='balance';
  if(kind==='clip'){BAL.drag.preview=BAL.samples[id].mesh.clone();BAL.root.add(BAL.drag.preview);}
  controls.enabled=false;CAM.fly=null;CAM.cine=false;canvas.setPointerCapture(e.pointerId);sfx('pick');
  return true;
}
function balanceMove(e) {
  const d=BAL.drag;if(!d)return;
  if(d.kind==='ring') {
    // Project each exact tick; choose nearest screen location, including tilt.
    let best=Infinity,pos=S.balance[d.id].pos;
    for(let p=1;p<=5;p++){
      const x=BAL.pans[d.id].sign*p*PHYS.BALANCE.spacing;
      const q=new THREE.Vector3(BAL_ORIGIN.x+x*Math.cos(S.beam.theta),TOP+BAL_ORIGIN.pivot-x*Math.sin(S.beam.theta),BAL_ORIGIN.z).project(camera);
      const dist=Math.hypot((q.x+1)*innerWidth/2-e.clientX,(1-q.y)*innerHeight/2-e.clientY);
      if(dist<best){best=dist;pos=p;}
    }
    if(pos!==S.balance[d.id].pos){balancePos(d.id,pos);sfx('tick');}
  } else {
    const p=rayOnPlaneY(e,TOP+0.14);if(p){d.point=BAL.root.worldToLocal(p);updateBalance(0);}
  }
}
function balanceUp(e,cancel=false) {
  const d=BAL.drag;if(!d)return;
  if(!cancel && d.kind!=='ring') {
    // Drop uses generous screen targets, independent of the raised drag preview.
    const at=(v)=>{const q=v.clone().project(camera);return {x:(q.x+1)*innerWidth/2,y:(1-q.y)*innerHeight/2};};
    const candidates=['left','right'].map(side=>{const p=at(BAL.pans[side].pan.getWorldPosition(new THREE.Vector3()));return {side,dist:Math.hypot(p.x-e.clientX,p.y-e.clientY)};}).sort((a,b)=>a.dist-b.dist);
    const nearest=candidates[0], radius=Math.max(38,0.075/worldPerPixel(BAL.pans[nearest.side].pan.getWorldPosition(new THREE.Vector3())));
    const m = S.mode === 'kid' && !KID.free ? KID.missions[KID.i] : null;
    const permitted = !m || (d.kind === 'obj' ? m.pair?.[nearest.side] === d.obj : m.goal.clipsOnly === nearest.side);
    if(nearest.dist<radius && permitted) {
      if(d.kind==='obj')balancePlace(nearest.side,d.obj);
      else balanceClips(nearest.side,S.balance[nearest.side].clips+Number(d.id));
      sfx('clack');
    } else if(d.kind==='obj') {
      const p=at(BAL.root.localToWorld(new THREE.Vector3(0,0.03,0.32)));
      const scale=worldPerPixel(BAL.root.localToWorld(new THREE.Vector3(0,0.03,0.32)));
      if(Math.abs(e.clientX-p.x)<0.46/scale && Math.abs(e.clientY-p.y)<Math.max(42,0.12/scale))
        for(const side of ['left','right'])if(S.balance[side].obj===d.obj)balancePlace(side,null);
    }
  }
  if(d.preview)BAL.root.remove(d.preview);
  BAL.drag=null;updateBalance(0);
}

// Shared data-driven quest lifecycle; physical verdict and settled pose come from PHYS.
function kidBalanceEnter() {
  KID.fx.later.length = 0;
  setStation('balance', false); setParam('g', 9.8, true);
  S.beam = { theta: 0, omega: 0 };
  balanceSet({ left: PHYS.balanceSide(this.setup.left), right: PHYS.balanceSide(this.setup.right) });
}
function kidBalanceCheck() {
  const r = PHYS.balance(balanceParams()), g = this.goal;
  return !DRAG.kind && r[g.verdict] === g.value && S.beam.theta === r.thetaTarget && S.beam.omega === 0
    && Object.entries(this.pair || {}).every(([side, obj]) => S.balance[side].obj === obj)
    && (!g.clipsOnly || (!S.balance[g.clipsOnly].obj && S.balance[g.clipsOnly].clips > 0))
    && (!g.moved || S.balance[g.moved].pos !== 5);
}
// Shared outline hand for balance demonstrations and the other quest hints.
function handAt(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = '#fde68a'; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath();c.moveTo(-9,18);c.lineTo(-17,3);c.quadraticCurveTo(-18,-3,-12,0);c.lineTo(-5,7);c.lineTo(-5,-18);c.quadraticCurveTo(-2,-24,1,-18);c.lineTo(1,-5);c.quadraticCurveTo(8,-10,14,-3);c.lineTo(14,17);c.closePath();c.stroke();
  c.restore();
}
function kidBalanceDraw(c, dt, m) {
  if (CAM.fly || KID.phase() === 'predict') return;
  const project = key => {
    const [kind,id]=key.split(':');
    let v;
    if(kind==='tick') { const x=Number(id)*PHYS.BALANCE.spacing; v=BAL.root.localToWorld(new THREE.Vector3(x*Math.cos(S.beam.theta),BAL_ORIGIN.pivot-x*Math.sin(S.beam.theta),0)); }
    else { const o=kind==='obj'?BAL.objects[id].group:kind==='clip'?BAL.samples[id].mesh:BAL.pans[id][kind==='ring'?'ring':'pan']; v=o.getWorldPosition(new THREE.Vector3()); if(kind==='clip')v.add(BAL.samples[id].home); }
    return khProj(v);
  };
  if (!KID.passed && !DRAG.kind) {
    KID.ctx.demoT=(KID.ctx.demoT || 0)+dt;
    const t=KID.ctx.demoT, step=m.demo[Math.floor(t/2.2)%m.demo.length];
    const a=project(step[0]), b=project(step[1]), u=smooth(clamp((t%2.2)/1.8,0,1));
    c.save();c.strokeStyle='#fde68a';c.fillStyle='#fde68a';c.lineWidth=3;c.globalAlpha=.7;c.setLineDash([6,6]);
    c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.setLineDash([]);
    const x=lerp(a.x,b.x,u),y=lerp(a.y,b.y,u);
    handAt(c,x,y);c.restore();
  }
  if (!KID.passed) return;
  const r=PHYS.balance(balanceParams());
  c.save();c.strokeStyle='#a7f3d0';c.fillStyle='#a7f3d0';c.lineWidth=3;
  if(m.diagram==='compare') { const p=project('pan:'+(r.heavier==='L'?'left':'right'));c.beginPath();c.moveTo(p.x-10,p.y-35);c.lineTo(p.x,p.y-23);c.lineTo(p.x+10,p.y-35);c.fill(); }
  if(m.diagram==='clips') { const p=project('pan:right');for(let i=0;i<S.balance.right.clips;i++){c.beginPath();c.arc(p.x-45+i%10*10,p.y-70+Math.floor(i/10)*12,3,0,Math.PI*2);c.fill();} }
  if(m.diagram==='moments') {
    KID.ctx.confirmT=(KID.ctx.confirmT||0)+dt;
    const u=smooth(clamp(KID.ctx.confirmT/1.3,0,1)), center=project('ring:left');
    for(const [side,color] of [['left','#7dd3fc'],['right','#c4b5fd']]) {
      const p=project('ring:'+side), b=S.balance[side], moment=side==='left'?r.momentL:r.momentR;
      const width=lerp(b.pos*20,100,u),height=moment*20/width;
      c.strokeStyle=color;c.fillStyle=color;c.globalAlpha=.35;
      const x=lerp(p.x,center.x,u),y=lerp(p.y-20,center.y-20,u);
      c.fillRect(x,y-height,width,height);c.globalAlpha=.9;c.strokeRect(x,y-height,width,height);
    }
  }
  c.restore();
}
