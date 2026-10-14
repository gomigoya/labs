// Additional instruments share the existing room, lighting and materials.
export function createCurriculumRigs({THREE,hero,HERO_Y,mats,roundedPanel,cyl,cart}){
 const root=new THREE.Group();hero.add(root);root.position.set(0,HERO_Y,-.6);root.visible=false;
 const rigs={};
 const group=id=>{const g=new THREE.Group();root.add(g);rigs[id]=g;return g};
 const material=(color,extras={})=>new THREE.MeshStandardMaterial({color,roughness:.52,metalness:.2,...extras});
 const teal=material(0x357c83),yellow=material(0xf3bf55),water=material(0x75bdb4,{transparent:true,opacity:.28,depthWrite:false,metalness:0});
 const load=(g,x,y,z=0)=>{const w=new THREE.Group();g.add(w);w.position.set(x,y,z);cyl(.28,.45,mats.brass,w,0,.22,0,24);cyl(.11,.1,mats.chrome,w,0,.5,0,16);return w};
 const stand=g=>{roundedPanel(1.4,.16,1.2,teal,g,0,.12,0,.08);roundedPanel(.13,2,.13,mats.brass,g,0,1.15,0,.04)};
 const balance=group('balance');stand(balance);const beam=new THREE.Group();balance.add(beam);beam.position.y=2.05;roundedPanel(4.8,.13,.22,mats.brass,beam,0,0,0,.04);
 const pans=[];for(const x of [-2,2]){const pan=new THREE.Group();beam.add(pan);pan.position.x=x;pans.push(pan);roundedPanel(.025,.65,.025,mats.chrome,pan,0,-.35,0,.008);cyl(.68,.07,mats.ivory,pan,0,-.7,0,32)}
 const left=load(pans[0],0,-.66),right=load(pans[1],0,-.66);
 const scale=group('scale');roundedPanel(2,.3,1.5,teal,scale,0,.2,0,.08);roundedPanel(2.2,.1,1.65,mats.ivory,scale,0,.42,0,.05);const scaleLoad=load(scale,0,.47);
 const spring=group('spring');roundedPanel(2,.15,1.4,teal,spring,0,.12,0,.07);roundedPanel(.12,3.3,.12,mats.brass,spring,-1,1.72,0,.03);roundedPanel(1.2,.12,.12,mats.brass,spring,-.4,3.3,0,.03);
 const pts=[];for(let i=0;i<=192;i++){const t=i/192;pts.push(new THREE.Vector3(Math.cos(t*Math.PI*24)*.15,-t,Math.sin(t*Math.PI*24)*.15))}
 const coil=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),192,.028,6,false),mats.chrome);spring.add(coil);coil.position.set(.2,3.22,0);const springLoad=load(spring,.2,1.5);
 const tank=group('tank');roundedPanel(3.2,.13,1.7,mats.brass,tank,0,.1,0,.06);const glass=material(0xc0e0d7,{transparent:true,opacity:.15,depthWrite:false});roundedPanel(3,2.2,1.5,glass,tank,0,1.25,0,.04);const fluid=roundedPanel(2.85,1.5,1.35,water,tank,0,.91,0,.03);const submerged=load(tank,0,1.55);roundedPanel(.025,1.2,.025,mats.chrome,tank,0,2.7,0,.008);roundedPanel(3.6,.12,.12,teal,tank,0,3.3,0,.03);
 const lever=group('lever');stand(lever);lever.children[1].scale.y=.6;lever.children[1].position.y=.8;const leverBeam=new THREE.Group();lever.add(leverBeam);leverBeam.position.y=1.5;roundedPanel(4.6,.16,.5,mats.brass,leverBeam,0,0,0,.05);const leverLoad=load(leverBeam,1,0),effortPad=roundedPanel(.5,.12,.7,teal,leverBeam,-1,.13,0,.05);
 rigs.beam=lever;
 const beamForces=[new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),new THREE.Vector3(),1,0x39b7ac,.2,.12),new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),new THREE.Vector3(),1,0xda863c,.2,.12),new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),1,0xd9e1b7,.2,.12)];beamForces.forEach(arrow=>lever.add(arrow));
 const ramp=group('ramp');const slope=roundedPanel(5,.12,1.8,mats.wood,ramp,0,.8,0,.04);roundedPanel(.12,1.5,1.6,mats.brass,ramp,2,.7,0,.03);
 rigs.incline=ramp;
 const stability=group('stability');const base=roundedPanel(2,.3,1.3,teal,stability,0,.2,0,.05);const block=new THREE.Group();stability.add(block);block.position.y=.38;roundedPanel(1.1,1.8,1.1,yellow,block,0,.9,0,.08);const dot=cyl(.08,.03,mats.brass,block,0,1.84,0,16);
 const cargo=load(cart,0,.85);cargo.visible=false;
 function update(activity,p,result,progress,measured){
  root.visible=true;for(const g of new Set(Object.values(rigs)))g.visible=false;
  const rig=rigs[result.rig];if(rig)rig.visible=true;
  cart.visible=result.cart;cart.position.set(0,0,0);cart.rotation.z=0;cart.scale.setScalar(1);cargo.visible=activity==='push';cargo.scale.setScalar(.65+Math.cbrt(p.mass||1)*.25);
  if(result.rig==='balance'){const tilt=measured?Math.sign(p.left-p.right)*.16:0;beam.rotation.z=tilt;pans.forEach(pan=>pan.rotation.z=-tilt);left.scale.setScalar(Math.cbrt(p.left/400));right.scale.setScalar(Math.cbrt(p.right/400));}
  if(result.rig==='scale')scaleLoad.visible=p.placed;
  if(result.rig==='spring'){const extension=result.metrics.find(m=>m.key==='extension')?.value||0;coil.scale.y=measured?1+extension/40:1;springLoad.position.y=3.22-coil.scale.y-.55;springLoad.scale.setScalar(.7+Math.cbrt(p.mass||1)*.2);}
  if(result.rig==='tank'){submerged.position.y=1.9-(measured?p.volume/400*1.1:0);fluid.material.color.set(p.density===1200?0x96bda2:0x75bdb4);}
  if(['lever','beam'].includes(result.rig)){const t=activity==='torque'?(p.effort*p.arm-10*p.loadArm):0;leverBeam.rotation.z=measured?Math.sign(t)*.15:0;leverLoad.position.x=activity==='torque'?p.loadArm:.5;effortPad.position.x=-(activity==='torque'?p.arm:p.length);beamForces.forEach(arrow=>arrow.visible=activity==='torque');if(activity==='torque'){const tilt=leverBeam.rotation.z;[-p.arm,p.loadArm].forEach((x,i)=>{const len=.45+(i===0?p.effort:10)*.035;beamForces[i].setLength(len,.2,.12);beamForces[i].position.set(x*Math.cos(tilt),1.5+x*Math.sin(tilt)+len+.2,0)});beamForces[2].setLength(.45+(p.effort+10)*.035,.2,.12);beamForces[2].position.set(0,.2,.35);}}
  if(['ramp','incline'].includes(result.rig)){const angle=activity==='incline'?p.angle*Math.PI/180:Math.asin(.5/p.length),length=activity==='incline'?5:p.length*2;slope.scale.x=length/5;slope.rotation.z=angle;const span=Math.max(.12,length*Math.cos(angle)/2-.75),x=activity==='incline'?0:-span+progress*span*2;const support=ramp.children[1];support.position.x=length*Math.cos(angle)/2;support.scale.y=(.8+length*Math.sin(angle)/2)/1.5;support.position.y=(.8+length*Math.sin(angle)/2)/2;cart.position.set(x,.88+x*Math.tan(angle),0);cart.rotation.z=angle;cart.scale.setScalar(.65);}
  if(result.rig==='stability'){base.scale.x=p.width/2;block.position.x=p.offset;block.rotation.z=measured&&Math.abs(p.offset)>p.width/2?-Math.sign(p.offset)*.3:0;dot.visible=true;}
 }
 return {update,hide(){root.visible=false;cart.position.set(0,0,0);cart.rotation.z=0;cart.scale.setScalar(1);cargo.visible=false}};
}
