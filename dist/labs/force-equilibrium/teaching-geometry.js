// Display geometry shares the physical conditions; these are not time-series models.
export const LIFT_DISPLAY=.45; // 0.5 m at 0.9 scene units/m.
export function teachingCameraHeight(rig,dynamic,width){return dynamic?2.5:width<=980&&['spring','spring-scale','mobile','beam-counts','balance','beam','shelf','tank','overflow','globe','crane'].includes(rig)?4.6:3.6;}
export function overflowPose(volume,progress){
 const fraction=Math.max(0,Math.min(1,volume/400))*progress;
 return {surface:2.1,bottom:2.1-.4*fraction,bodyHeight:.4,fraction,cupHeight:.8*fraction};
}
export function immersionPose(volume){
 const v=Math.max(0,Math.min(400,volume)),lowering=v===0?0:v<=200?.2+.4*v/200:.8+.4*(v-200)/200;
 return {surface:1.7,bodyHeight:.4,bottoms:[1.9-lowering,2.5-lowering]};
}
export function liftPose(method,length,progress){
 const theta=(-30+60*progress)*Math.PI/180,arm=.45;
 if(method==='lever')return {theta,loadX:arm*Math.cos(theta),loadY:1.6+arm*Math.sin(theta)-.5,effortX:-length*.9*Math.cos(theta),effortY:1.6-length*.9*Math.sin(theta)};
 if(method==='ramp'){const angle=Math.asin(.5/length),span=.9*length*Math.cos(angle)/2,x=-span+2*span*progress;return {angle,length:length*.9,x,y:.88+x*Math.tan(angle)};}
 return {x:0,y:.3+LIFT_DISPLAY*progress};
}
export function wrenchPose(reach,angle,effort,progress){
 const magnitude=effort*reach*Math.sin(angle*Math.PI/180),rotation=-progress*Math.min(.6,magnitude/12),direction=rotation-angle*Math.PI/180;
 return {rotation,x:reach*Math.cos(rotation),y:1.2+reach*Math.sin(rotation),dx:Math.cos(direction),dy:Math.sin(direction),length:effort*.1};
}
export function floatingPose(outcome,net,progress){return {y:1.5+(outcome==='still'?0:Math.sign(net))*.6*progress};}
export function designPose(distance,progress){return {x:-1.6+Math.min(3.2,distance*1.9)*progress,targetX:.3,contactX:-.68};}
export function cartDisplayScale(result){
 if(!result.dynamic)return .35;
 const force=result.forces.reduce((a,f)=>({x:a.x+f.mag*Math.cos(f.angle*Math.PI/180),y:a.y+f.mag*Math.sin(f.angle*Math.PI/180)}),{x:0,y:0}),t=1.2;
 const distance=Math.hypot(result.initialVelocity*t+.5*force.x/result.mass*t*t,.5*force.y/result.mass*t*t);
 return Math.min(.35,1.45/Math.max(.01,distance));
}
