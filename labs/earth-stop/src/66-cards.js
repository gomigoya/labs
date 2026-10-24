// All prediction loops, actual pictures, principle equations and micro lenses.
// Coordinates below are diagram layout; every magnitude comes from PHYS.
const CARDS=(()=>{
 const svg=body=>`<svg viewBox="15 14 280 112" aria-hidden="true">${body}</svg>`;
 const path=(d,color='#37795d',dash=false)=>`<path d="${d}" stroke="${color}" ${dash?'stroke-dasharray="4 4"':''}/>`;
 const circle=(x,y,r,fill='none',dash=false)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${dash?'stroke-dasharray="4 4"':''}/>`;
 const arrow=(x,y,length,color='#37795d',dash=false)=>Math.abs(length)<.1?circle(x,y,3,color):path(`M${x} ${y}h${length}m${-Math.sign(length)*6} -5l${Math.sign(length)*6} 5 ${-Math.sign(length)*6} 5`,color,dash);
 const length=speed=>PHYS.speedLength(Math.abs(speed))*86;
 const equation=path('M139 65h22m-22 10h22','#393e42');
 function globe(phi,x=58,y=65,r=32){
  const sec=PHYS.latitudeSection(phi),latitude=sec.height/PHYS.SCENE.radius*r,radius=sec.radius/PHYS.SCENE.radius*r;
  return circle(x,y,r)+path(`M${x-r} ${y}h${2*r}M${x} ${y-r-5}v${2*r+10}`,'#393e42',true)+path(`M${x-radius} ${y-latitude}h${2*radius}`)+circle(x+radius,y-latitude,3,'#37795d');
 }
 function speed(speed,y=70,reference=PHYS.BENCH[4].speed){
  const n=PHYS.mach(speed),l=length(speed);
  return path('M135 45v54M135 99h150','#77796e',true)+arrow(135,y,l)+arrow(135,y+17,length(reference),'#393e42',true)+Array.from({length:Math.min(8,Math.floor(n))},(_,i)=>path(`M${135+length((i+1)*PHYS.C.sound)} ${y-6}v12`)).join('');
 }
 function timeRing(P,x=220,y=65,time=0,half=false){
  const state=PHYS.solarState(P),day=PHYS.solarDay(P);
  if(state==='empty')return path(`M${x-28} ${y-28}h56v56h-56zM${x} ${y-28}v56M${x-28} ${y}h56`,'#393e42',true);
  if(state==='synchronous')return path(`M${x-28} ${y}a28 28 0 1 1 28 28m-6-8 12 12m-12 0 12-12`,'#936114');
  const ratio=day/PHYS.solarDay(PHYS.C.T0),r=20+Math.min(3,ratio)*8;
  let b=circle(x,y,r,'none',true);
  const samples=PHYS.daySamples(P);
  b+=samples.points.map(p=>circle(x+Math.cos(p.angle)*r,y+Math.sin(p.angle)*r,2.2,p.bright?'#936114':'none')).join('');
  if(samples.clipped)b+=path(`M${x+r-6} ${y-8}l10 8-10 8m-6-16 10 8-10 8`,'#936114');
  const seconds=(time%3)/3*PHYS.SCENE.cycleSeconds,angle=PHYS.sunAngle(seconds,P)-PHYS.spinAngle(seconds,P);
  b+=circle(x+Math.cos(angle)*r,y+Math.sin(angle)*r,4,'#37795d');
  if(P===Infinity){
   b+=path(`M${x} ${y-r+6}a${r-6} ${r-6} 0 0 1 0 ${2*(r-6)}`,'#936114');
   b+=path(`M${x} ${y+r-6}a${r-6} ${r-6} 0 0 1 0 ${-2*(r-6)}`,'#77796e');
   b+=half?path(`M${x} ${y-r-5}a${r+5} ${r+5} 0 0 1 0 ${2*(r+5)}Z`,'#221d18'):circle(x,y,r+6);
  }
  return b;
 }
 // Square prediction composition uses the full mobile card, without letterboxing.
 function mobilePicture(id,c,time){
  const phi=c.phi??0,v=c.speed??PHYS.v(phi,PHYS.C.T0),beat=(time%3)/3;
  let b=globe(phi,55,32,26);
  if([1,2,6].includes(id)){
   const scale=56,now=PHYS.speedLength(v)*scale,reference=PHYS.speedLength(id===2?PHYS.v(0,PHYS.C.T0):id===6?PHYS.C.designSpeed:PHYS.BENCH[4].speed)*scale;
   b+=path('M8 66v38M8 104h94','#77796e',true)+arrow(8,78,now)+arrow(8,94,reference,'#393e42',true);
   b+=circle(8+now*beat,78,4,'#37795d');
   b+=path(`M${8+PHYS.SCENE.soundLength*scale} 70v16`);
   if(id===6)b+=path(`M8 65h${reference}v35h${-reference}z`,'#936114',true);
  }else if(id===3){
   const distance=PHYS.speedLength(PHYS.v(phi,PHYS.C.T0))*36*(c.direction??1);
   b+=path('M8 100h94M55 62v40','#393e42',true)+circle(55,80,5,'none',true)+arrow(55,80,distance);
   b+=Array.from({length:9},(_,i)=>circle(55+distance*i/8,80,2.5,i/8<=beat?'#37795d':'none')).join('');
  }else{
   const P=c.P??PHYS.C.P_stop,day=PHYS.solarDay(P),r=23;
   b+=circle(55,81,r,'none',true);
   if(id===5&&c.half)b+=path('M55 58a23 23 0 0 1 0 46Z','#936114');
   else{
    const samples=PHYS.daySamples(P);
    b+=samples.points.map(p=>circle(55+Math.cos(p.angle)*r,81+Math.sin(p.angle)*r,2.5,p.bright?'#936114':'none')).join('');
    if(id===5)b+=circle(55,81,r+4);
   }
   const days=day/PHYS.C.day,width=id===5?(c.half?43:P===Infinity?86:4):Math.min(86,days*2.6);
   b+=path('M12 51h86M12 47v8m43-8v8m43-8v8','#77796e',true)+path(`M12 51h${width}`,'#936114');
  }
  return `<svg viewBox="0 0 110 110" aria-hidden="true">${b}</svg>`;
 }
 function picture(id,c,time=0,compact=typeof innerWidth!=='undefined'&&innerWidth<=980){
  if(compact)return mobilePicture(id,c,time);
  const beat=(time%3)/3,phi=c.phi??0,s=c.speed??PHYS.v(phi,PHYS.C.T0);
  let b='';
  if(id===1)b=globe(0)+speed(s)+circle(135+length(s)*beat,70,3,'#37795d')+path('M155 119h35m-12 0-10-10m10 10-10 10m-10-10-4-5','#393e42',true);
  if(id===2)b=globe(phi)+speed(s,65,PHYS.v(0,PHYS.C.T0))+path('M130 108h150','#393e42',true)+circle(135+length(s)*beat,65,3,'#37795d');
  if(id===3){
   const measurement=PHYS.stopMeasurement({runId:1,phi:c.phi??0,mode:'sudden',executed:true});
   const distance=length(measurement.relativeSpeed)*(c.direction??1);
   b=globe(c.phi??0,55,70)+circle(112,70,5,'none',true)+arrow(112,70,distance);
   b+=PHYS.traceSamples(c.phi??0,0,measurement.relativeSpeed,beat*PHYS.SCENE.tangentSeconds).filter(p=>p.visible).map(p=>circle(112+(p.point[0]-PHYS.scenePoint(c.phi??0,0,PHYS.SCENE.pinReach)[0])*86*(c.direction??1),70,2,'#37795d')).join('');
  }
  if(id===4)b=path('M125 123h160','#77796e',true)+Array.from({length:Math.min(12,Math.ceil(PHYS.solarDay(c.P??PHYS.C.T0)/PHYS.C.day))},(_,i)=>circle(130+i*13,123,4,'#936114')).join('')+globe(0)+path('M30 108q28 18 56 0','#936114')+timeRing(c.P??PHYS.C.T0,215,65,time);
  if(id===5)b=(c.half?path('M148 19h140M148 19v13m70-13v13m70-13v13','#77796e',true)+path('M148 25h70','#936114'):path('M148 19h140M148 19v13m70-13v13m70-13v13','#77796e',true)+path(`M148 25h${(c.P??Infinity)===Infinity?140:8}`,'#37795d'))+globe(0)+path('M58 21v88M22 112q36 18 72 0','#936114')+timeRing(c.P??Infinity,215,65,time,!!c.half);
  if(id===6){const cap=length(PHYS.C.designSpeed);b=globe(phi)+speed(s,65,PHYS.C.designSpeed)+circle(135+length(s)*beat,65,3,'#37795d')+path(`M135 48h${cap}v45h${-cap}z`,'#936114',true);}
  return svg(b);
 }
 function actual(id,s,time=0,compact){
  if(id===3&&!s.measurement)return svg(globe(s.phi)+path('M130 44h130v50H130z','#393e42',true));
  return picture(id,{phi:s.phi,P:s.P,direction:1,speed:id===3?s.measurement.relativeSpeed:PHYS.v(s.phi,PHYS.C.T0)},time,compact);
 }
 function principle(id,s){
  if(id===3&&!s.measurement)return actual(id,s);
  if(id===1)return svg(globe(s.phi,48,65,30)+equation+`<g transform="translate(25 0)">${speed(PHYS.v(s.phi,PHYS.C.T0))}</g>`);
  if(id===2){const base=PHYS.v(s.fromPhi??0,PHYS.C.T0),now=PHYS.v(s.phi,PHYS.C.T0);return svg(globe(s.fromPhi??0,35,43,24)+globe(s.phi,95,90,24)+equation+arrow(175,54,length(base)*.72,'#393e42',true)+arrow(175,83,length(now)*.72));}
  if(id===3){const v=s.measurement.relativeSpeed;return svg(arrow(20,55,length(v)*.65,'#393e42',true)+arrow(20,82,length(v)*.65)+equation+circle(181,55,3,'#393e42')+arrow(181,82,length(v)*.65));}
  if(id===4)return svg(path('M12 42q15-20 30 0M12 95q40-45 80 0')+timeRing(PHYS.C.T0,103,40)+equation+timeRing(s.P,223,75));
  if(id===5)return svg(globe(s.phi,50,65,29)+path('M50 24v82M20 112q30 14 60 0','#936114')+equation+timeRing(s.P,224,65));
  return svg(globe(s.phi,50,65,30)+equation+`<g transform="translate(42 0)">${speed(PHYS.v(s.phi,PHYS.C.T0),65,PHYS.C.designSpeed)}</g>`+path(`M176 48h${length(PHYS.C.designSpeed)}v45h${-length(PHYS.C.designSpeed)}z`,'#936114',true));
 }
 function micro(id,s){return id===3?actual(id,s,0,false):id===4||id===5?svg(timeRing(s.P,150,70,0)):actual(id,s,0,false);}
 return {svg,path,circle,picture,actual,principle,micro};
})();
