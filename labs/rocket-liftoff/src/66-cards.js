// All candidate loops, actual results and principle equations share this picture vocabulary.
const CARDS=(()=>{
 const svg=body=>`<svg viewBox="0 0 280 140" aria-hidden="true">${body}</svg>`;
 const path=(d,color='#e4dfd5',dash=false)=>`<path d="${d}" stroke="${color}" ${dash?'stroke-dasharray="4 4"':''}/>`;
 const dot=(x,y,r=3)=>`<circle cx="${x}" cy="${y}" r="${r}"/>`;
 const equal=path('M143 60h15m-15 10h15');
 function bar(x,force,color,dash=false){
  const n=PHYS.forceGlyph(force).shown;
  return Array.from({length:Math.ceil(n)},(_,i)=>`<rect x="${x}" y="${114-(i+Math.min(1,n-i))*15}" width="15" height="${Math.max(.1,Math.min(1,n-i)*15-2)}" stroke="${color}" ${dash?'stroke-dasharray="3 3"':color==='#ffaa63'?`fill="${color}" fill-opacity=".3"`:''}/>`).join('');
 }
 function dots(r,trace){
  const duration=r.t??PHYS.burnTime(r.n),samples=PHYS.simulate(r.n,r.load||0,r.g||9.81,duration,Math.max(.01,duration/8)),span=Math.max(1,samples.h.at(-1));
  return samples.h.map((h,i)=>dot(18+(trace==='equal'?(i/8)**2:trace==='shrinking'?1-(1-i/8)**2:h/span)*240,124,5)).join('');
 }
 const expansion=(x,y)=>path(`M${x-5} ${y+5}l10-10m-10 4v6h6m-2-10h6v6`);
 const up=(x,y,length,color='#64ead0',dash=false)=>length>.1?path(`M${x} ${y}v${-length}m-6 7 6-7 6 7`,color,dash):path(`M${x-7} ${y}h14`,color);
 function candidateBar(x,force,color,weight=false){
  const cells=PHYS.forceGlyph(force).shown,length=cells*20;
  let b=`<rect x="${x}" y="${128-length}" width="26" height="${Math.max(.2,length)}" stroke="${color}" fill="${color}" fill-opacity="${weight?.4:.16}"/>`;
  for(let i=1;i<cells;i++)b+=path(`M${x} ${128-i*20}h26`,color);
  return b+(length<.1?path(`M${x} 128h26`,color):weight?path(`M${x+7} 118l6 7 6-7`,color):up(x+13,128-length+12,12,color));
 }
 function motionPicture(trace,positions=PHYS.cardMotion(trace)){
  const xs=positions.map(p=>18+p*204);
  let b='<g opacity=".25">'+path('M18 20v130h204M18 50h204M18 90h204');
  for(let i=0;i<6;i++)b+=path(`M${18+i*40.8} 16v138`,undefined,true);
  b+='</g>';
  b+=`<g stroke-width="4" ${trace==='growing'?'':'stroke-dasharray="5 3"'}>`+path('M18 50h204','#64ead0');
  b+=xs.map(x=>`<circle cx="${x}" cy="50" r="6" fill="#64ead0"/>`).join('');
  for(let i=1;i<xs.length;i++){
   const gap=xs[i]-xs[i-1],x=xs[i-1];
   b+=path(`M${x} 83h${gap}m-5-5 5 5-5 5`,'#64ead0');
   b+=`<rect x="${20+(i-1)*42}" y="${150-gap*.65}" width="28" height="${gap*.65}" fill="#64ead0" fill-opacity=".4" stroke="#64ead0"/>`;
  }
  return b+'</g>';
 }
 function picture(id,c,time=0){
  // A shallow pulse keeps the three readings distinct at every animation phase.
  const progress=time===0?1:.875+.125*Math.cos(time*Math.PI*2/3),v=PHYS.cardPrediction(id,c,progress);
  if(id===3)return `<svg viewBox="0 0 240 168" preserveAspectRatio="none" aria-hidden="true">${motionPicture(c.trace)}</svg>`;
  return candidatePicture(id,c,v);
 }
 function candidatePicture(id,c,v){
  const base=130-v.lift,rocket=y=>path(`M48 ${y}v-28l14-16 14 16v28z`);
  let b='<g opacity=".24">'+path('M18 14v130h92M130 128h84');
  for(let i=0;i<=6;i++)b+=path(`M14 ${144-i*20}h96M132 ${128-i*20}h80`,undefined,true);
  b+=`<g stroke-dasharray="5 4">${rocket(130)}</g>`+`<rect x="142" y="${128-PHYS.forceGlyph(PHYS.m0(c.load||0)*(c.g||PHYS.C.earthG)).shown*20}" width="62" height="${PHYS.forceGlyph(PHYS.m0(c.load||0)*(c.g||PHYS.C.earthG)).shown*20}" stroke-dasharray="5 4"/>`+'</g>';
  // Equal-height pad silhouettes and dashed trails remain fixed behind the live position.
  b+=`<g opacity=".45" stroke-dasharray="5 4">${rocket(130-v.lift*.5)}${path(`M62 130v${-v.lift}`,undefined,true)}</g>`;
  b+=`<g stroke-width="4" ${v.hypothesis?'stroke-dasharray="6 4"':''}>${rocket(base)}</g>`;
  b+=`<rect x="54" y="${base-26*v.fuel}" width="16" height="${26*v.fuel}" fill="#64ead0" stroke="none"/>`;
  if(c.load)b+=`<rect x="80" y="${base-29}" width="22" height="22" fill="#ffaa63" fill-opacity=".4"/>`;
  b+=`<g stroke-width="4">${up(29,139,v.lift,'#64ead0',v.hypothesis)}${candidateBar(138,v.T,'#b594ff')}<g opacity="${id===1?1:.45}">${candidateBar(178,v.W,'#ffaa63',true)}</g></g>`;
  // A separate compressed residual makes the nearly balanced heavy load legible.
  if(id===4)b+=`<g opacity=".35">${up(224,128,v.baselineMargin,'#e4dfd5',true)}</g>`;
  if(id!==1)b+=`<g stroke-width="5">${up(224,128,v.margin)}</g>`+expansion(224,18);
  b+=expansion(108,14);
  b+=`<g stroke-width="3.5">`+Array.from({length:v.nozzles},(_,i)=>path(`M${18+i*16} 151l-4 11h12l-4-11z`,c.extra&&i===v.nozzles-1?'#64ead0':'#e4dfd5')).join('')+'</g>';
  if(id===5)b+=`<circle cx="113" cy="153" r="10" stroke-dasharray="3 3"/>`+path('M109 150h1m6 6h1');
  return `<svg viewBox="0 0 240 168" preserveAspectRatio="none" aria-hidden="true">${b}</svg>`;
 }
 function actual(id,s){
  const r=s.after||s,v=PHYS.grammarValues(r.n,r.load,r.g,r.t,true);
  if(id===3){
   const heights=Array.from({length:6},(_,i)=>PHYS.stateAt(r.n,r.load,r.g,r.t*i/5).h),end=Math.max(1,heights.at(-1));
   return `<svg viewBox="0 0 240 168" preserveAspectRatio="none" aria-hidden="true">${motionPicture('growing',heights.map(h=>h/end))}</svg>`;
  }
  return candidatePicture(id,r,{...v,lift:PHYS.cardLift(v.h),nozzles:r.n,hypothesis:false,
   margin:PHYS.cardMargin(v.T-v.W),baselineMargin:PHYS.cardMargin(PHYS.thrust(r.n)-PHYS.m0(PHYS.C.loads[1])*r.g)});
 }
 function principle(id,s){
  const r=s.after||s,v=PHYS.stateAt(r.n,r.load,r.g,r.t),initial=PHYS.stateAt(r.n,r.load,r.g,0);
  if(id===1){const burning=PHYS.stateAt(r.n,r.load,r.g,Math.max(0,PHYS.burnTime(r.n)-.001));return svg(bar(24,burning.T,'#b594ff')+bar(50,burning.normal,'#f28db8')+bar(80,burning.W,'#ffaa63')+equal+path('M185 110h95',undefined,true)+dot(230,105)+dot(230,105,7)+dot(230,105,12));}
  if(id===2||id===6){const w=PHYS.m0(r.load)*r.g;return svg(Array.from({length:5},(_,i)=>bar(20+i*38,PHYS.thrust(i+1),'#b594ff')+path(`M${16+i*38} ${114-PHYS.forceGlyph(w).shown*15}h25`,'#ffaa63',true)).join('')+path('M244 118v-30m-7 7 7-7 7 7')+(id===6?path('M244 20h30v23h-30z'):''));}
  if(id===3)return svg(bar(20,initial.T,'#b594ff')+bar(46,initial.W,'#ffaa63',true)+bar(78,v.T,'#b594ff')+bar(104,v.W,'#ffaa63')+equal+`<g transform="translate(145 -45)">${dots(r,'growing')}</g>`+path(`M185 120l30 ${-initial.a*3}M235 120l30 ${-v.a*3}`,'#64ead0'));
  if(id===4){const a=s.before;if(!a)return '';return svg(path('M20 18h19v15H20zM70 10h27v23H70z')+bar(20,PHYS.thrust(a.n)-PHYS.m0(a.load)*a.g,'#b594ff')+bar(70,initial.T-initial.W,'#b594ff')+equal+bar(205,PHYS.thrust(a.n),'#b594ff')+bar(233,PHYS.thrust(r.n),'#b594ff'));}
  return svg(dot(42,23,13)+dot(232,23,13)+bar(30,PHYS.thrust(r.n),'#b594ff')+bar(57,PHYS.m0(r.load)*PHYS.C.earthG,'#ffaa63')+equal+bar(220,PHYS.thrust(r.n),'#b594ff')+bar(247,PHYS.m0(r.load)*r.g,'#ffaa63')+path('M279 118V86m-6 6 6-6 6 6'));
 }
 return {svg,path,picture,actual,principle};
})();
