export const MODEL='rapier-0.21.0/instruments-1';
export const STEP=1/120;
const clone=v=>structuredClone(v);
const samplesKeys=['time','x','z','vx','vz','ax','az','angle','omega','extension','force','reading','leftMoment','rightMoment','fallen'];
export function validateObservation(o,expected=null){
 if(expected&&(o?.activity!==expected.id||o?.kind!==expected.kind))throw Error('simulation-apparatus');
 if(!o||o.model!==MODEL||!['cart','beam','spring'].includes(o.kind)||typeof o.activity!=='string'||o.activity.length>40||o.step!==STEP||typeof o.settled!=='boolean'||typeof o.complete!=='boolean'||!o.complete||!Array.isArray(o.samples)||o.samples.length<2||o.samples.length>182)throw Error('simulation-observation');
 const valid=s=>s&&Object.keys(s).length===samplesKeys.length&&samplesKeys.every(k=>Number.isFinite(s[k])&&Math.abs(s[k])<100000)&&s.time>=0&&s.time<=6.01;
 if(!valid(o.final)||o.samples.some((s,i)=>!valid(s)||(i&&s.time<=o.samples[i-1].time)))throw Error('simulation-sample');
 if(samplesKeys.some(k=>o.final[k]!==o.samples.at(-1)[k]))throw Error('simulation-final');
 return clone(o);
}

export function measuredResult(theory,o){
 const s=o.final,result=clone(theory),put=(key,value,unit)=>{const m=result.metrics.find(m=>m.key===key);if(m)m.value=value;else result.metrics.push({key,value,unit});};
 if(o.kind==='cart'){
  put('displacement',Math.hypot(s.x,s.z),'m');put('speed',Math.hypot(s.vx,s.vz),'m/s');put('accel',Math.hypot(s.ax,s.az),'m/s²');
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
