import {cartStoppingMotion} from './instrument-measurements.js';
// Display geometry and deterministic, fixed-step teaching motion.
export const LIFT_DISPLAY=.45; // 0.5 m at 0.9 scene units/m.
export function teachingCameraHeight(rig,dynamic,width){return dynamic?2.5:['mobile','beam-counts','balance','beam','lever','crane','lever-lift'].includes(rig)?4.8:width<=980&&['spring','spring-scale','shelf','tank','overflow','globe'].includes(rig)?4.6:rig==='shelf'?4.5:3.6;}
export function overflowPose(volume,progress){
 const target=Math.max(0,Math.min(1,volume/400)),t=Math.max(0,Math.min(1,progress)),bottom=2.3-(.2+.4*target)*t,fraction=Math.max(0,Math.min(1,(2.1-bottom)/.4));
 // A brim-full overflow vessel drains at the spout, so its settled level stays 2.1.
 return {surface:2.1,bottom,bodyHeight:.4,fraction,cupHeight:.8*fraction};
}
// 1 scene unit = 10 cm here; raise the V/A change 3x for a readable meniscus.
export function displacedWaterRise(volume){return Math.max(0,Math.min(400,volume))*.001/(2.9*1.35)*3;}
export function immersionPose(volume,rise=0){
 const v=Math.max(0,Math.min(400,volume)),lowering=v===0?0:v<=200?.2+.4*v/200:.8+.4*(v-200)/200;
 return {surface:1.7+rise,bodyHeight:.4,bottoms:[1.9-lowering+rise,2.5-lowering+rise]};
}
export function liftPose(method,length,progress){
 const theta=(-30+60*progress)*Math.PI/180,arm=.45;
 if(method==='lever')return {theta,loadX:arm*Math.cos(theta),loadY:1.6+arm*Math.sin(theta)-.5,effortX:-length*.9*Math.cos(theta),effortY:1.6-length*.9*Math.sin(theta)};
 if(method==='ramp'){const angle=Math.asin(.5/length),span=.9*length*Math.cos(angle)/2,x=-span+2*span*progress;return {angle,length:length*.9,x,y:.88+x*Math.tan(angle)};}
 return {x:0,y:.3+LIFT_DISPLAY*progress};
}
export function wrenchPose(reach,angle,effort,progress){
 // A torsion bolt: 12 N·m deflects 60 degrees. All coordinates are relative to its pivot.
 const theta=angle*Math.PI/180,momentArm=reach*Math.sin(theta),torque=effort*momentArm,rotation=-progress*torque*Math.PI/36,direction=rotation-theta,x=reach*Math.cos(rotation),y=reach*Math.sin(rotation),dx=Math.cos(direction),dy=Math.sin(direction),along=x*dx+y*dy,length=effort*.1;
 return {rotation,x,y,dx,dy,length,momentArm,torque,footX:x-along*dx,footY:y-along*dy,tipX:x+length*dx,tipY:y+length*dy};
}
export function createFluidMotion(p){
 const balloon=p.case==='balloon',sub=p.case==='submarine',height=balloon?2.6:1.1,start=balloon?1.6:1.2;
 return {y:start,start,velocity:0,remainder:0,height,floor:.2,surface:balloon?Infinity:2.25,density:balloon?1.2:1000,volume:balloon?.005:sub?.004:(900+(p.volume||0))/1e6,mass:balloon?.003+(p.clips||0)*.001:sub?3+(p.fill||0)*.5:1};
}
export function fluidForces(s){
 // Constant-area sealed body: its submerged volume and centroid follow the waterline.
 const bottom=s.y-s.height/2,depth=Math.max(0,Math.min(s.height,s.surface-bottom)),fraction=depth/s.height,weight=s.mass*9.8,buoyancy=s.density*9.8*s.volume*fraction;
 const drag=-(s.density===1.2?.012:4)*s.velocity*Math.abs(s.velocity)*fraction-(s.density===1.2?.002:2)*s.velocity*fraction,normal=bottom<=s.floor+1e-9?Math.max(0,weight-buoyancy-drag):0;
 return {fraction,weight,buoyancy,drag,normal,net:buoyancy-weight+drag+normal,centre:bottom+depth/2};
}
export function stepFluidMotion(s,dt){
 const h=1/240;s.remainder+=Math.max(0,dt);
 while(s.remainder>=h-1e-12){const f=fluidForces(s);s.velocity+=f.net/s.mass*h;s.y+=s.velocity*h;if(s.y<s.floor+s.height/2){s.y=s.floor+s.height/2;s.velocity=Math.max(0,s.velocity);}s.remainder-=h;}
 return s;
}
export function elasticPose(amount,seconds=0){
 // Underdamped release, initially at rest; determinant 1 preserves visible volume.
 const t=Math.max(0,seconds),q=amount*Math.exp(-7*t)*(Math.cos(15*t)+7/15*Math.sin(15*t)),yScale=1-.32*q,xScale=1/Math.sqrt(yScale);
 return {xScale,yScale,zScale:xScale,y:.225+.65*yScale,amount:q};
}
export function gravityPose(angle,seconds){
 const a=angle*Math.PI/180,radius=Math.max(1.15,1.8-.5*3*Math.max(0,seconds)**2),dx=-Math.cos(a),dy=-Math.sin(a);
 return {radius,x:-dx*radius,y:1.6-dy*radius,dx,dy};
}
export function designPose(distance,progress){return {x:-1.6+Math.min(3.2,distance*1.9)*progress,targetX:.3,contactX:-.68};}
export function cartDisplayScale(result){
 if(!result.dynamic)return .35;
 const force=result.forces.reduce((a,f)=>({x:a.x+f.mag*Math.cos(f.angle*Math.PI/180),y:a.y+f.mag*Math.sin(f.angle*Math.PI/180)}),{x:0,y:0}),t=1.2;
 const distance=Math.hypot(result.initialVelocity*t+.5*force.x/result.mass*t*t,.5*force.y/result.mass*t*t);
 return Math.min(.35,1.45/Math.max(.01,distance));
}

// Static friction grows with the pull; only the excess travel after onset moves the block.
export function frictionPose(maximum,progress){const t=Math.max(0,Math.min(1,progress)),onset=.65,slip=Math.max(0,(t-onset)/(1-onset)),slide=.9*slip*slip;return {reading:maximum*Math.min(1,t/onset),onsetForce:maximum,slipping:t>=onset,blockX:-1.1+slide,scaleX:.65+.4*Math.min(1,t/onset)+slide};}
export function liftingReading(result,progress){const value=key=>result.metrics.find(m=>m.key===key)?.value||0,effort=value('withTool');return {force:effort*9.8*Math.min(1,Math.max(0,progress)*5),units:effort*100*Math.min(1,Math.max(0,progress)*5),directForce:value('direct')*9.8};}
// The solver's rope force is vertical: a wall-mounted overhead bracket carries the tie.
export function shelfPose(length,position,load){const tension=load*position/length;return {loadX:-1.6+position/length*3.2,tension,reaction:load-tension,hinge:[-1.6,1.06],tie:[1.6,1.1],anchor:[1.6,3.1],arrowScale:.008};}
// The house sits where a medium (2 N) push on the 1 kg cart comes to rest, whatever push is selected.
export function curlingTarget(){return cartStoppingMotion('curling',2,1).displacement*.35;}
