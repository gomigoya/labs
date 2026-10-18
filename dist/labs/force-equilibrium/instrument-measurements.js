export const MODEL='rapier-0.21.0/instruments-1';
export const STEP=1/120;
// A brief hand push on a resisting surface, versus a sustained force on an air table.
// Longest stored observation: a strong curling push glides about 7.7 s before resting.
export const MAX_OBSERVATION=9;
const AIR_CART=Object.freeze({friction:0,pushDuration:Infinity,maxDuration:1.2,stopAtRest:false,planar:false});
export const CART_ACTIVITIES=Object.freeze({curling:Object.freeze({...AIR_CART,friction:.02,pushDuration:.5,maxDuration:MAX_OBSERVATION,stopAtRest:true}),push:Object.freeze({...AIR_CART,friction:.02,pushDuration:.5,maxDuration:MAX_OBSERVATION,stopAtRest:true}),vectors:Object.freeze({...AIR_CART,planar:true})});
export const cartSettings=id=>CART_ACTIVITIES[id]||AIR_CART;
// From rest: accelerate against surface friction during the push, then coast to rest.
export function cartStoppingMotion(id,force,mass){
 const {friction,pushDuration,maxDuration}=CART_ACTIVITIES[id],deceleration=friction*9.8,acceleration=force/mass-deceleration;
 if(acceleration<=0)return {displacement:0,duration:0};
 const speed=acceleration*pushDuration;
 return {displacement:.5*acceleration*pushDuration**2+speed**2/(2*deceleration),duration:Math.min(maxDuration,pushDuration+speed/deceleration)};
}
const clone=v=>structuredClone(v);
const samplesKeys=['time','x','z','vx','vz','ax','az','angle','omega','extension','force','reading','leftMoment','rightMoment','fallen'];
export function validateObservation(o,expected=null){
 if(expected&&(o?.activity!==expected.id||o?.kind!==expected.kind))throw Error('simulation-apparatus');
 if(!o||o.model!==MODEL||!['cart','beam','spring'].includes(o.kind)||typeof o.activity!=='string'||o.activity.length>40||o.step!==STEP||typeof o.settled!=='boolean'||typeof o.complete!=='boolean'||!o.complete||!Array.isArray(o.samples)||o.samples.length<2||o.samples.length>MAX_OBSERVATION*30+2)throw Error('simulation-observation');
 const valid=s=>s&&Object.keys(s).length===samplesKeys.length&&samplesKeys.every(k=>Number.isFinite(s[k])&&Math.abs(s[k])<100000)&&s.time>=0&&s.time<=MAX_OBSERVATION+.01;
 if(!valid(o.final)||o.samples.some((s,i)=>!valid(s)||(i&&s.time<=o.samples[i-1].time)))throw Error('simulation-sample');
 if(samplesKeys.some(k=>o.final[k]!==o.samples.at(-1)[k]))throw Error('simulation-final');
 return clone(o);
}

export function measuredResult(theory,o){
 const s=o.final,result=clone(theory),put=(key,value,unit)=>{const m=result.metrics.find(m=>m.key===key);if(m)m.value=value;else result.metrics.push({key,value,unit});};
 if(o.kind==='cart'){
  put('displacement',Math.hypot(s.x,s.z),'m');put('speed',Math.hypot(s.vx,s.vz),'m/s');put('accel',Math.hypot(s.ax,s.az),'m/s²');
  if(cartSettings(o.activity).stopAtRest){result.stoppingDistance=Math.hypot(s.x,s.z);result.stoppingTime=s.time;result.stopped=o.settled;}
  if(cartSettings(o.activity).planar){const magnitude=Math.hypot(s.ax,s.az)*theory.mass,direction=magnitude>1e-8?(Math.atan2(-s.az,s.ax)*180/Math.PI+360)%360:0;put('net',magnitude,'N');put('rx',s.ax*theory.mass,'N');put('ry',-s.az*theory.mass,'N');put('direction',direction,'°');result.resultantMagnitude=magnitude;result.resultantDirection=direction;}
 }else if(o.kind==='spring'){
  if(o.activity==='spring-scale')put('reading',Math.round(s.reading/5)*5,'g');
  else {put('extension',s.extension*100,'cm');put(o.activity==='elastic'&&result.metrics.some(m=>m.key==='springForce')?'springForce':'weight',s.force,'N');if(o.activity==='elastic'&&result.metrics.some(m=>m.key==='springForce'))result.outcome='springPull';}
 }else{
  if(result.metrics.some(m=>m.key==='torque'))put('torque',s.leftMoment-s.rightMoment,'N·m');put('beamAngle',s.angle*180/Math.PI,'°');
  result.outcome=s.fallen?'loadFell':Math.abs(s.angle)<.005?(o.activity==='balance'?'balanced':'level'):s.angle>0?(o.activity==='balance'?'leftHeavy':'counter'):(o.activity==='balance'?'rightHeavy':'clockwise');
 }
 return {...result,source:'rapier',simulationTime:s.time,settled:o.settled};
}

export function instrumentKind(id,p,r){
 if(r.rig==='cart'&&r.dynamic)return 'cart';
 if(r.rig==='balance'||r.rig==='beam-counts'||(id==='torque'&&r.rig==='beam'))return 'beam';
 if(r.rig==='spring'||r.rig==='spring-scale')return 'spring';
 return null;
}
