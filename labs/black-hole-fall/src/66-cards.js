// All prediction loops, comparison lenses and frozen picture equations live here.
const CARDS=(()=>{
 const palette=typeof INK_CFG==='undefined'?{ink:0x221d18,tide:0x377f79,warm:0xa66b29,red:0xb55d67,grid:0xb2b3ad}:INK_CFG.diagram;
 const cardColor=k=>'#'+palette[k].toString(16).padStart(6,'0');
 const svg=body=>`<svg viewBox="0 0 300 140" aria-hidden="true">${body}</svg>`;
 const path=(d,color=cardColor('tide'),dash=false)=>`<path d="${d}" stroke="${color}" ${dash?'stroke-dasharray="4 4"':''}/>`;
 const circle=(x,y,r,color=cardColor('ink'),dash=false)=>`<circle cx="${x}" cy="${y}" r="${r}" stroke="${color}" ${dash?'stroke-dasharray="4 4"':''}/>`;
 const rect=(x,y,w,h,dash=false)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" ${dash?'stroke-dasharray="4 4"':''}/>`;
 const arrow=(x,y,dx)=>path(`M${x} ${y}h${dx}m${-Math.sign(dx||1)*5} -4l${Math.sign(dx||1)*5} 4 ${-Math.sign(dx||1)*5} 4`);
 const equal=path('M143 64h14m-14 10h14',cardColor('ink'));
 const cells=(x,y,n,unit=9)=>Array.from({length:Math.min(24,Math.ceil(n))},(_,j)=>rect(x+j*unit,y,Math.max(.1,Math.min(1,n-j)*unit*.8),26)).join('');
 const specimen=(i,x,y)=>path(i===0?`M${x} ${y-9}l10 18h-20z`:i===1?`M${x-9} ${y-9}h18v18h-18z`:`M${x} ${y-12}l12 12-12 12-12-12z`,cardColor('warm'));
 function rod(i,r,x,y){
  const s=PHYS.state(i,r),v=PHYS.visualShape(i,r),length=Math.min(112,38*v.along),height=23*v.across,gap=s.intact?0:14;
  return rect(x-length/2-gap/2,y-height/2,length/2,height)+rect(x+gap/2,y-height/2,length/2,height)+circle(x-length/2-gap/2,y,2)+circle(x+length/2+gap/2,y,2);
 }
 function force(i,r,x,y,unit){
  const a=PHYS.tidalArrows(i,r),n=Math.min(24,Math.abs(a.diffNear)*2/unit);
  return circle(x,y,2,cardColor('tide'))+(n<.001?'':arrow(x-5,y,-Math.min(55,n*8))+arrow(x+5,y,Math.min(55,n*8)));
 }
 function rings(i,r,x=150,y=70,threshold=PHYS.spaghettiR(i),bodyR=r){
  const scale=67/PHYS.visualRadius(PHYS.RANGE.r[1]),radius=v=>PHYS.visualRadius(v)*scale;
  return circle(x,y,radius(1),cardColor('red'))+circle(x,y,radius(threshold),cardColor('ink'),true)+rod(i,bodyR,x-radius(r),y);
 }
 function halfPair(ratio){return path('M20 30h100m-100-7v14m50-14v14m50-14v14',cardColor('ink'))+path('M180 30h50m-50-7v14m50-14v14',cardColor('ink'))+equal+cells(18,76,1,12)+cells(174,76,ratio,12)+path('M18 112h108m48 0h108',cardColor('ink'),true);}
 function massPair(a,b){return specimen(0,55,25)+specimen(1,235,25)+circle(55,70,24,cardColor('red'))+circle(235,70,24,cardColor('red'))+cells(16,102,4,11)+cells(190,102,Math.min(8,b/a*4),11)+equal;}
 function comparison(id,s){
  const samples=PHYS.measurements(s.samples,s.runId).filter(m=>!m.event&&m.orientation==='radial');
  const a=id===2?samples.find(m=>m.r===40):samples.find(m=>m.i===0&&m.r===1);
  const b=id===2?samples.find(m=>m.r===20&&m.i===a?.i):samples.find(m=>m.i===1&&m.r===1);
  if(!a||!b)return '';
  return svg(id===2?halfPair(b.value/a.value):massPair(a.value,b.value));
 }
 // Prediction plates use 300 x 200, including on narrow screens; no looping collapse.
 const faint=body=>`<g opacity=".22" stroke-width="2">${body}</g>`;
 const bold=body=>`<g stroke-width="5">${body}</g>`;
 const expansion=(x=278,y=18)=>path(`M${x-7} ${y+7}l14-14m-14 6v8h8m-2-14h8v8`,cardColor('ink'));
 function bar(x,y,length,height,intact=true){
  const gap=intact?0:14,half=(length-gap)/2;
  return `<g fill="${cardColor('tide')}" fill-opacity=".18">${rect(x-length/2,y-height/2,half,height)+rect(x+gap/2,y-height/2,half,height)}</g>`
   +circle(x-length/2,y,4)+circle(x+length/2,y,4)
   +(intact?'':path(`M${x-4} ${y-height/2-7}l-7 12 8 10-8 12m22-34-7 12 8 10-8 12`));
 }
 function segmentedArrow(x,y,length){
  if(length<1)return circle(x,y,4);
  const sign=Math.sign(length),n=Math.floor(Math.abs(length)/12);
  return arrow(x,y,length)+Array.from({length:n},(_,k)=>path(`M${x+sign*(k+1)*12} ${y-7}v14`)).join('');
 }
 function picture(id,c,time=0){
  const v=PHYS.cardPrediction(id,c);
  let body='';
  const field=faint(path('M12 12h276v176H12zM12 100h276M150 12v176',cardColor('grid'),true));
  if(id===1){
   body=faint(bar(150,94,60,54)+path('M16 162h268M16 152v20m134-20v20m134-20v20',cardColor('ink')));
   body+=bold(bar(150,94,v.length,v.height,v.intact)
    +segmentedArrow(150-v.length/2-5,94,-v.arrow)+segmentedArrow(150+v.length/2+5,94,v.arrow));
   // A second full-width meter makes 0 / 1 / 8 units readable even at thumbnail size.
   body+=bold(cells(20,148,Math.min(8,v.value/PHYS.dA(0,40)),32))+expansion();
  }
  if(id===2){
   body=faint(path('M22 24h256m-256-9v18m128-18v18m128-18v18M22 59h128m-128-9v18m128-18v18',cardColor('ink'))
    +Array.from({length:8},(_,k)=>rect(22+k*32,122,27,58)).join(''));
   body+=bold(rect(22,80,27,26)+Array.from({length:Math.round(v.marks)},(_,k)=>`<rect x="${22+k*32}" y="122" width="27" height="58" fill="${cardColor('tide')}" fill-opacity=".25"/>`).join(''));
  }
  if(id===3){
   body=faint(circle(150,100,v.horizon,cardColor('red'))+path('M20 100h260',cardColor('ink'),true));
   const x=150-v.radius;
   body+=bold(circle(150,100,v.radius,cardColor('ink'),true)+bar(x,100,50,48,false));
   body+=expansion();
  }
  if(id===4){
   // Two rows share the same endpoints and scale. The reference row stays faint.
   const ref=v.reference,now=v.arrow;
   body=faint(specimen(0,28,43)+bar(150,52,52,30)+segmentedArrow(119,52,-ref)+segmentedArrow(181,52,ref)
    +path('M16 100h268',cardColor('ink'),true));
   body+=specimen(1,28,151)+bold(bar(150,146,52,30)
    +segmentedArrow(119,146,-now)+segmentedArrow(181,146,now));
   // A shared, unsaturated compressed meter keeps equality and extreme ratios distinct.
   body+=faint(rect(30,83,Math.max(2,v.reference*2.3),10));
   body+=bold(rect(30,178,Math.max(2,v.arrow*2.3),10))+expansion();
  }
  if(id===5){
   // Fixed landmarks and sample positions across all three hypotheses.
   body=faint(path('M16 100h268M100 20v160M210 20v160',cardColor('ink'),true));
   body+=path('M100 20v160',cardColor('red'))+path('M210 20v160',cardColor('ink'),true);
   for(const [j,s]of v.samples.entries())body+=bold(bar(50+j*100,100,68,60,s.intact));
   body+=faint(arrow(20,177,260));
  }
  if(id===6){
   body=faint(PHYS.MASSES.map((_,i)=>PHYS.cardPrediction(6,{i}).size).map(r=>circle(80,100,r,cardColor('ink'),true)).join('')
    +path('M16 174h268M170 24v150',cardColor('ink')));
   body+=bold(`<circle cx="80" cy="100" r="${v.size}" fill="${cardColor('warm')}" fill-opacity=".25" stroke="${cardColor('warm')}"/>`
    +bar(230,100,v.intact?70:104,v.intact?54:24,v.intact));
   body+=faint(circle(230,100,55,cardColor('red')))+specimen(v.i,80,24)+expansion();
  }
  return `<svg viewBox="0 0 300 200" aria-hidden="true">${field+body}</svg>`;
 }
 function actual(id,s){
  if(id===2||id===4)return comparison(id,s);
  if(id===1)return svg(rod(s.i,s.r,75,60)+force(s.i,s.r,210,60,PHYS.dA(0,40))+path('M35 110h230',cardColor('ink'),true)+circle(35+PHYS.railX(s.r)*230,110,5));
  if(id===6)return svg(specimen(s.i,55,70)+rings(s.i,s.r,205,70));
  return svg(specimen(s.i,28,25)+rings(s.i,s.r));
 }
 function principle(id,s){
  if(id===1){const far=s.samples?.find(m=>m.i===0&&m.r>20)||PHYS.measure(0,1000,s.runId);return svg(rod(0,far.r,65,42)+force(0,far.r,65,90,PHYS.dA(0,40))+arrow(135,65,30)+rod(s.i,s.r,230,42)+force(s.i,s.r,230,90,PHYS.dA(0,40)));}
  if(id===2)return svg(halfPair(PHYS.dA(s.i,20)/PHYS.dA(s.i,40)));
  if(id===3)return svg(rings(s.i,s.r));
  if(id===4)return comparison(id,s);
  if(id===5)return svg(rings(s.i,s.r,70,70)+equal+rings(s.i,PHYS.spaghettiR(s.i)*.9,230,70));
  return svg([1,2,0].map((i,j)=>{const x=50+j*100,r=s.r;return specimen(i,x,20)+rings(i,r,x,82)+circle(x,122,9,cardColor('warm'))+(PHYS.state(i,r).intact?path(`M${x-5} 122l4 4 7-9`):'');}).join(''));
 }
 return {svg,picture,actual,principle,comparison};
})();
