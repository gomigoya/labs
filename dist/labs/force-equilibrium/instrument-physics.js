import RAPIER from './vendor/rapier/rapier.mjs';

import {MODEL,STEP,instrumentKind} from './instrument-measurements.js';
export {MODEL,STEP,instrumentKind,measuredResult,validateObservation} from './instrument-measurements.js';
export const CART_SCALE=.35,BEAM_SCALE=4.3,SPRING_SCALE=2.4;
const V=(x=0,y=0,z=0)=>({x,y,z}),Q={x:0,y:0,z:0,w:1};
const clone=v=>structuredClone(v);
const samplesKeys=['time','x','z','vx','vz','ax','az','angle','omega','extension','force','reading','leftMoment','rightMoment','fallen'];

/** One active SI world. Meshes never write positions into dynamic bodies. */
export async function createInstrumentPhysics(){
 await RAPIER.init();
 let world=null,body=null,joint=null,loads=[],cfg=null,running=false,accumulator=0,time=0,trace=[],stableFor=0,settled=false,done=false;
 let ax=0,az=0,lastVy=0,lastAy=0,quietPoses=[];
 function dispose(){world?.free();world=null;body=null;loads=[];cfg=null;running=false;}
 function prepare(id,p,r,flags={},initial=null){
  dispose();const kind=instrumentKind(id,p,r);if(!kind)return false;
  cfg={id,kind,p:clone(p),r:clone(r),flags:clone(flags),k:0,mass:r.mass||1,g:0,target:0};
  time=accumulator=stableFor=0;trace=[];quietPoses=[];settled=done=false;ax=az=lastVy=lastAy=0;
  world=new RAPIER.World(V(0,kind==='cart'?-9.8:kind==='beam'?-9.8:0));world.timestep=STEP;world.numSolverIterations=12;
  if(kind==='cart'){
   body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,.21,0).setAdditionalMass(cfg.mass).enabledRotations(false,false,false).setCanSleep(false).setLinvel(r.initialVelocity||0,0,0));
   world.createCollider(RAPIER.ColliderDesc.cuboid(.3,.2,.18).setDensity(0).setFriction(0).setRestitution(0),body);
   world.createCollider(RAPIER.ColliderDesc.cuboid(100,.05,100).setTranslation(0,-.05,0).setFriction(0).setRestitution(0));
   for(const f of r.forces){const a=f.angle*Math.PI/180;ax+=f.mag*Math.cos(a)/cfg.mass;az-=f.mag*Math.sin(a)/cfg.mass;}
  }else if(kind==='spring'){
   const scale=id==='spring-scale',stretch=id==='elastic'&&p.springMode==='stretch';
   cfg.k=scale?20:(p.k||50);cfg.g=scale?9.8:stretch?0:p.planet==='moon'?1.62:9.8;
   cfg.mass=scale?(flags.placed?({apple:.1,milk:.175,eraser:.05}[p.object]||.1):.02):stretch?.15:(p.mass||1);
   cfg.target=stretch?p.extension/100:0;cfg.empty=scale&&!flags.placed;cfg.c=2*.9*Math.sqrt(cfg.k*cfg.mass);
   body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,-(initial?.extension||0),0).setLinvel(0,initial?.vy||0,0).setAdditionalMass(cfg.mass).enabledTranslations(false,true,false).enabledRotations(false,false,false).setCanSleep(false));
   world.createCollider(RAPIER.ColliderDesc.ball(.025).setDensity(0),body);
  }else{
   const counts=id==='lever-counts',torque=id==='torque';
   const leftMass=torque?p.effort/9.8:counts?p.leftCount*.1:p.left/1000,rightMass=torque?10/9.8:counts?p.rightCount*.1:p.right/1000;
   const leftArm=torque?p.arm:counts?p.leftPos*.1:p.leftPos*.1,rightArm=torque?p.loadArm:counts?p.rightPos*.1:p.rightPos*.1;
   cfg.beamLength=Math.max(.6,leftArm+.06,rightArm+.06);cfg.leftMass=leftMass;cfg.rightMass=rightMass;
   const support=world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
   // A weighted beam has its empty centre of mass 3 cm below the knife edge.
   body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setAdditionalMassProperties(.15,V(0,-.03,0),V(.001,.001,.15*(2*cfg.beamLength)**2/12),Q).setAngularDamping(2).enabledTranslations(true,true,false).enabledRotations(false,false,true).setCanSleep(false));
   world.createCollider(RAPIER.ColliderDesc.cuboid(cfg.beamLength,.015,.07).setDensity(0).setFriction(2).setRestitution(0),body);
   if(!counts&&!torque)world.createCollider(RAPIER.ColliderDesc.cuboid(10,.025,2).setTranslation(0,-2.1/BEAM_SCALE-.025,0).setFriction(.8));
   joint=world.createImpulseJoint(RAPIER.JointData.revolute(V(),V(),V(0,0,1)),support,body,true);joint.setLimits(-.16,.16);
   // Elementary blocks make real frictional contact with the beam and each other.
   // Hanging weights use fixed suspension attachments, with their inertia included.
   for(const [side,mass,arm,sign]of [['left',leftMass,leftArm,-1],['right',rightMass,rightArm,1]]){
    const n=counts?Math.round(mass/.1):torque?1:Math.ceil(mass/.3);
    for(let i=0;i<n;i++){
     const m=counts?.1:torque?mass:Math.min(.3,mass-i*.3),h=counts?.045:torque?.05:.24/BEAM_SCALE*(m/.3);
     const y=counts?(-.65-i*.42)/BEAM_SCALE:.015+h/2+i*.24/BEAM_SCALE;
     const b=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(sign*arm,y,0).enabledTranslations(true,true,false).enabledRotations(false,false,true).setCanSleep(false));
     world.createCollider(RAPIER.ColliderDesc.cuboid(.3/BEAM_SCALE/2,h/2,.35/BEAM_SCALE/2).setMass(m).setFriction(2).setRestitution(0),b);
     // A fixed attachment models hanging weights, never an angle motor.
     if(counts||torque)world.createImpulseJoint(RAPIER.JointData.fixed(V(sign*arm,y,0),Q,V(),Q),body,b,true).setContactsEnabled(false);
     loads.push({side,index:i,body:b,mass:m});
    }
   }
  }
  trace.push(sample());return true;
 }
 function snapshot(){
  if(!cfg)return null;const pos=body.translation(),v=body.linvel(),q=body.rotation();
  const angle=2*Math.atan2(q.z,q.w),extension=cfg.kind==='spring'?-pos.y:0,force=cfg.kind==='spring'?cfg.k*extension:0;
  const supported=l=>{if(cfg.id!=='balance')return true;const p=l.body.translation(),x=(p.x-pos.x)*Math.cos(angle)+(p.y-pos.y)*Math.sin(angle),y=-(p.x-pos.x)*Math.sin(angle)+(p.y-pos.y)*Math.cos(angle);return Math.abs(x)<=cfg.beamLength+.015&&y>-.015;};
  const leftMoment=loads.filter(l=>l.side==='left'&&supported(l)).reduce((s,l)=>s+Math.abs(l.body.translation().x)*l.mass*9.8,0),rightMoment=loads.filter(l=>l.side==='right'&&supported(l)).reduce((s,l)=>s+Math.abs(l.body.translation().x)*l.mass*9.8,0),fallen=loads.filter(l=>!supported(l)).length;
  return {time,x:pos.x,z:pos.z,vx:v.x,vy:v.y,vz:v.z,ax,az,angle,omega:body.angvel().z,extension,force,reading:cfg.id==='spring-scale'?(cfg.flags.zeroed?force/9.8*1000:20+force/9.8*1000):0,leftMoment,rightMoment,fallen,loads:loads.map(l=>({side:l.side,index:l.index,x:l.body.translation().x,y:l.body.translation().y,angle:2*Math.atan2(l.body.rotation().z,l.body.rotation().w)}))};
 }
 function sample(){const s=snapshot();return Object.fromEntries(samplesKeys.map(k=>[k,s[k]]));}
 function start(){if(cfg){running=true;done=false;}}
 function stop(){running=false;}
 function step(){
  const kind=cfg.kind;
  if(kind==='cart'){body.resetForces(true);body.addForce(V(ax*cfg.mass,0,az*cfg.mass),true);}
  if(kind==='spring'){
   const ext=-body.translation().y,vy=body.linvel().y;
   const load=cfg.empty?0:cfg.mass*cfg.g+cfg.k*cfg.target;
   body.resetForces(true);body.addForce(V(0,cfg.k*ext-load-cfg.c*vy,0),true);
  }
  world.step();time=Math.round((time+STEP)/STEP)*STEP;
  if(kind==='spring'){const vy=body.linvel().y;lastAy=(vy-lastVy)/STEP;lastVy=vy;}
  let quiet=false;
  if(kind==='beam'){
   // Contact impulses have velocity noise even when the visible pose is steady.
   // Require a whole 0.35 s window of angle and load-position stability.
   const q=body.rotation(),pose=[2*Math.atan2(q.z,q.w),...loads.flatMap(l=>{const p=l.body.translation();return [p.x,p.y];})];quietPoses.push(pose);if(quietPoses.length>42)quietPoses.shift();
   quiet=quietPoses.length===42&&pose.every((_,i)=>Math.max(...quietPoses.map(p=>p[i]))-Math.min(...quietPoses.map(p=>p[i]))<(i===0?.001:.001));
  }else if(kind==='spring')quiet=Math.abs(lastVy)<.0005&&Math.abs(lastAy)<.005;
  stableFor=quiet?stableFor+STEP:0;settled=stableFor>=.35&&time>=.5;
  if(Math.round(time/STEP)%4===0)trace.push(sample());
  done=kind==='cart'?time>=cfg.r.duration-1e-8:settled||time>=6-1e-8;
  if(done)running=false;
 }
 function advance(dt){if(!running||!cfg)return;accumulator+=Math.min(.25,Math.max(0,dt));while(running&&accumulator>=STEP-1e-10){accumulator=Math.max(0,accumulator-STEP);step();}}
 function observation(){if(!cfg)return null;const final=sample(),samples=trace.map(clone);if(samples.at(-1)?.time!==time)samples.push(final);return {model:MODEL,activity:cfg.id,kind:cfg.kind,step:STEP,settled,complete:done,final,samples};}
 function capture(){return cfg?{bytes:world.takeSnapshot(),body:body.handle,loads:loads.map(l=>({...l,body:l.body.handle})),cfg:clone(cfg),running,accumulator,time,trace:clone(trace),quietPoses:clone(quietPoses),stableFor,settled,done,ax,az,lastVy,lastAy}:null;}
 function restore(s){if(!s){dispose();return;}dispose();world=RAPIER.World.restoreSnapshot(s.bytes);body=world.getRigidBody(s.body);loads=s.loads.map(l=>({...l,body:world.getRigidBody(l.body)}));cfg=clone(s.cfg);({running,accumulator,time,stableFor,settled,done,ax,az,lastVy,lastAy}=s);trace=clone(s.trace);quietPoses=clone(s.quietPoses);}
 function pull(extension){if(cfg?.kind==='spring'&&cfg.id==='elastic'&&cfg.p.springMode==='stretch'&&cfg.target!==extension/100){cfg.target=extension/100;time=0;trace=[sample()];running=true;done=settled=false;stableFor=0;}}
 return {prepare,start,stop,advance,snapshot,observation,capture,restore,pull,dispose,get active(){return !!cfg;},get done(){return done;},get running(){return running;}};
}

