// Candidate hypotheses are dashed; measured diagrams use PHYS and solid ink.
const CARDS = (()=>{
 const palette=typeof INK_CFG==='undefined'?{kids:0xc57d24,dino:0x37795d,friction:0xb55d77,muscle:0x7863a6,ink:0x221d18}:INK_CFG.diagram;
 const hex=value=>'#'+value.toString(16).padStart(6,'0');
 const orange=hex(palette.kids),green=hex(palette.dino),pink=hex(palette.friction),purple=hex(palette.muscle),white=hex(palette.ink);
 const svg=body=>`<svg viewBox="0 0 300 140" aria-hidden="true">${body}</svg>`;
 const path=(d,color=white,dash=false)=>`<path d="${d}" stroke="${color}"${dash?' stroke-dasharray="4 4"':''}/>`;
 const rect=(x,y,w,h,color=white,dash=false)=>`<rect x="${x}" y="${y}" width="${Math.max(0,w)}" height="${h}" rx="2" stroke="${color}"${dash?' stroke-dasharray="4 4"':''}/>`;
 const dot=(x,y,r=3)=>`<circle cx="${x}" cy="${y}" r="${r}"/>`;
 const arrow=(x,y,dx,color=white)=>path(`M${x} ${y}h${dx}m${-Math.sign(dx)*7} -5l${Math.sign(dx)*7} 5 ${-Math.sign(dx)*7} 5`,color);
 const equal=path('M142 58h16m-16 10h16');
 const pegs=(n,x=18,y=20)=>Array.from({length:n},(_,i)=>rect(x+(i%20)*5,y+Math.floor(i/20)*9,3,7,orange)).join('');
 function specimen(species,x=225,y=44,scale=1){
  const i=Object.keys(PHYS.SPECIES).indexOf(species),size=PHYS.exhibitionScale(species)*scale;
  const silhouettes=[
   'M-3 0L-1-2 1-3 2-6 5-6 5-4 3-4 2 0 4 3M0 0L-2 3M-1-2L-6 0',
   'M-4 0L-2-3 1-3 2-7 6-7 5-4 3-4 2 0 4 3M0 0L-2 3M2-7L3-9 4-7M-3-1L-7 1',
   'M-5 0L-4-3-2-5 0-3 2-6 3-3 5-4 6 0 9 1M-5 0H6M-3 0V3M4 0V3',
   'M-5 0L-4-4 1-4 3-7 5-4 8-6 7-2 9 0H-5M-3 0V3M5 0V3',
   'M-4 0L-2-3 0-4 1-9 7-9 7-5 3-5 2 0 5 3M0 0L-2 3M-3-1L-8 1',
   'M-5 0L-4-4 2-4 3-15 6-15 6-13 5-13 5 0H-5M-3 0V3M3 0V3M-4-2L-9 1'
  ];
  return `<g transform="translate(${x} ${y}) scale(${size*4.4})" stroke-width=".65" fill="${green}33">${path(silhouettes[i],green)}</g>`;
 }
 function force(force,x,y,color,dash=false,width=115){
  const glyph=PHYS.forceGlyph(force),len=glyph.length/PHYS.VIS.width*width;
  let body=path(`M${x} ${y}h${len}`,color,dash);
  for(const tick of glyph.ticks)body+=path(`M${x+tick/PHYS.VIS.width*width} ${y-4}v8`,color);
  if(glyph.compressed)body+=path(`M${x+len-8} ${y-7}l-3 7 5 0-3 7m5-18 7-7m-7 0h7v7`,white);
  return body;
 }
 function flag(winner,phase=1,x=150,y=108,dash=false){
  const shift=winner==='same'||winner==='tie'?0:(winner==='kids'?-1:1)*70*phase;
  return path(`M${x-125} ${y}h250M${x} ${y-10}v20`,white,true)+path(`M${x+shift} ${y+9}v-42h28l-7 10 7 10h-28`,winner==='kids'?orange:green,dash);
 }
 function setup(id,s){return {n:s?.n??(id===7?30:59),species:s?.species||Object.keys(PHYS.SPECIES)[id===1?0:id===2?3:4],mu:s?.mu??PHYS.GROUNDS['자갈']};}
 function scene(s,time=0,hypothesis=null){
  const phase=.82+.18*(1-Math.cos(time*2))/2,d=PHYS.displayState(s.n,s.species,s.mu,Math.PI);
  const team=s.n===1?`<g transform="translate(40 60) scale(2)">${rect(-4,-12,8,18,orange)}${dot(0,-18,5)}</g>`:
   Array.from({length:s.n},(_,i)=>`<rect x="${12+i%10*10}" y="${12+Math.floor(i/10)*6}" width="7" height="4" fill="${orange}" stroke="${orange}"/>`).join('');
  const slip=d.slip?path('M14 88l16-7m-9 14 20-9m202 0 16-7m-9 14 20-9',pink):'';
  return team+specimen(s.species,230,74,s.n===30?2.2:1.65)+slip+
   force(d.kids,12,82,orange,false,124)+force(d.dino,164,82,green,false,124)+flag(hypothesis||d.winner,phase,150,118,!!hypothesis);
 }
 function ratios(kind='short'){
  const keys=Object.keys(PHYS.SPECIES),small=PHYS.weightRatio(keys[0]),large=PHYS.weightRatio(keys[5]);
  const right=kind==='long'?small+(small-large)*.15:kind==='equal'?small:large;
  const relation=kind==='equal'?path('M136 80h28m-28 12h28',purple):kind==='long'?path('M134 105l30-45m-16 3 16-3 2 17',purple):path('M134 60l30 45m-16-3 16 3 2-17',purple);
  return specimen(keys[0],65,40,.6)+specimen(keys[5],220,43,.4)+rect(35,50,90,78,white,true)+rect(175,50,90,78,white,true)+rect(45,120-small*72,65,small*72,purple).replace('stroke=',`fill="${purple}" stroke=`)+rect(185,120-right*72,65,right*72,purple,kind!=='short').replace('stroke=',`fill="${purple}" stroke=`)+relation;
 }
 function picture(id,c,time=0,source){
  const s=setup(id,source),loop=.8+.2*(time%3)/3;
  if(id===6)return svg(ratios(c.ratio));
  if(id===5){
   const n=Math.min(100,s.n+Math.floor(loop*PHYS.C.increaseQ5)),before=PHYS.friction(s.n*PHYS.C.kidMass,PHYS.GROUNDS['유리']),after=PHYS.friction(n*PHYS.C.kidMass,PHYS.GROUNDS['유리']);
   const hypothetical=c.limit==='fixed'?before:c.limit==='shrink'?Math.max(0,2*before-after):after;
   return svg(path(`M25 50h${c.limit==='fixed'?125:c.limit==='grow'?240:45}m-16-12 16 12-16 12`,pink)+pegs(n,18,8)+path('M18 125h263M25 119l9-9m25 9 9-9',white)+force(before,18,84,pink,true,250)+force(hypothetical,18,98,pink,true,250)+force(PHYS.kidCap(n,PHYS.GROUNDS['유리']),18,112,orange,false,250));
  }
  if(id===4){s.mu=PHYS.GROUNDS['유리'];return svg(scene(s,time,c.flag)+flag(PHYS.outcome(s.n,s.species,PHYS.GROUNDS['자갈']).winner,1,150,111,true));}
  if(c.n!==undefined)s.n=c.n;if(c.species)s.species=c.species;
  return svg(scene(s,time,c.flag||null));
 }
 function actual(id,s){
  const a=setup(id,s);
  if(id===6)return svg(ratios());
  if(id===5)return principle(id,s);
  return svg(scene(a));
 }
 function principle(id,s){
  const a=setup(id,s),result=PHYS.outcome(a.n,a.species,a.mu),mass=PHYS.SPECIES[a.species];
  if(id===1){const width=100*PHYS.VIS.width/PHYS.forceGlyph(result.kids).length;return svg(force(result.kids,16,30,orange,false,width)+force(PHYS.muscle(mass),16,55,purple,true,width)+force(PHYS.friction(mass,a.mu),16,70,pink,true,width)+force(result.dino,16,85,green,false,width)+arrow(136,72,25)+flag(result.winner,1,224,100));}
  if(id===2)return svg(pegs(a.n,10,15)+force(result.kids,10,91,orange,false,270)+force(result.dino,10,110,green,true,270)+arrow(136,68,25));
  if(id===3)return svg(specimen(a.species,44,45)+rect(12,66,70,50,white,true)+force(PHYS.muscle(mass),12,91,purple,true,70)+equal+pegs(a.n,174,12)+force(result.kids,174,88,orange,false,110)+force(result.dino,174,108,green,true,110));
  if(id===4){return svg((s.observations||[]).filter((o,i,arr)=>arr.findIndex(p=>p.mu===o.mu)===i).slice(0,2).map((o,i)=>`<g transform="translate(${i*150} 0) scale(.5 1)">${pegs(o.n)}${specimen(o.species)}${path('M18 70h260',o.mu===PHYS.GROUNDS['유리']?white:'#999c94')}${flag(PHYS.outcome(o.n,o.species,o.mu).winner)}</g>`).join('')+equal);}
  if(id===5){return svg([s.before,s.after].filter(Boolean).map((o,i)=>`<g transform="translate(${i*160} 0)">${pegs(o.n,6,15).replaceAll('width="3"','width="2"')}${force(PHYS.friction(o.n*PHYS.C.kidMass,o.mu),6,82,pink,true,125)}${force(PHYS.kidCap(o.n,o.mu),6,104,orange,false,125)}${path('M6 123h125m-100-6 9-9',white)}</g>`).join('')+arrow(142,65,14));}
  if(id===6)return svg(ratios());
  return svg(pegs(a.n,15,9)+[Object.keys(PHYS.SPECIES)[1],Object.keys(PHYS.SPECIES)[2]].map((species,i)=>`<g transform="translate(${i*150} 0)">${specimen(species,88,65,.8)}${force(result.kids,12,92,orange,true,125)}${force(PHYS.dinoCap(species,a.mu),12,111,green,false,125)}${i===0?rect(6,44,133,85,orange):''}</g>`).join(''));
 }
 function micro(s){const a=setup(1,s),rough=a.mu*.08;return svg(rect(30,18,240,104)+path('M40 65h220',white)+path(Array.from({length:49},(_,i)=>`${i?'L':'M'}${40+i*4.5} ${85+Math.sin(i*2.3)*rough*200}`).join(''),pink)+force(PHYS.friction(a.n*PHYS.C.kidMass,a.mu),40,110,pink,true,200));}
 return {svg,path,picture,actual,principle,micro};
})();
