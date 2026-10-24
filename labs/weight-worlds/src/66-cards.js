// All preview loops, comparisons, equations and lenses share these instrument drawings.
const CARDS = (()=>{
  const palette=typeof INK_CFG==='undefined'?{ink:0x221d18,force:0xb06e29,mint:0x37795d,grid:0xb2b3a2}:INK_CFG.diagram;
  const hex=v=>'#'+v.toString(16).padStart(6,'0');
  const svg=body=>`<svg viewBox="0 0 300 140" preserveAspectRatio="none" aria-hidden="true">${body}</svg>`;
  const line=(d,dash=false,color=hex(palette.force))=>`<path d="${d}" stroke="${color}"${dash?' stroke-dasharray="4 4"':''}/>`;
  const circle=(x,y,r,dash=false)=>`<circle cx="${x}" cy="${y}" r="${r}"${dash?' stroke-dasharray="4 4"':''}/>`;
  const dots=(x,y,n)=>Array.from({length:n},(_,k)=>circle(x+(k-(n-1)/2)*10,y,3.5)).join('');
  const expansion=(x,y)=>line(`M${x-6} ${y+6}l12-12m-12 5v7h7m-2-12h7v7`,false,hex(palette.ink));
  const equal=line('M141 64h18m-18 10h18',false,hex(palette.ink));
  function body(i,x,y){
    let out=circle(x,y,i===8?7:12);
    if(i===5)out+=`<ellipse cx="${x}" cy="${y}" rx="20" ry="5" transform="rotate(-25 ${x} ${y})"/>`;
    if(i===0)out+=line(`M${x-7} ${y-8}l7 3-3 6 9 4`,false,hex(palette.mint));
    if(i===1)out+=circle(x-4,y-3,2)+circle(x+4,y+4,3);
    if([4,6].includes(i))out+=line(`M${x-10} ${y-4}h20m-20 7h20`);
    if(i===7)for(let k=0;k<8;k++){const a=k*Math.PI/4;out+=line(`M${x+Math.cos(a)*15} ${y+Math.sin(a)*15}l${Math.cos(a)*4} ${Math.sin(a)*4}`);}
    if(i===8)out+=line(`M${x-14} ${y-13}l28 26m-28-3 28-20`,false,hex(palette.mint));
    return out;
  }
  function force(i,n,x,progress=1,reference=true){
    const d=PHYS.grammarState(i,n),unit=2.65,start=38,width=46;
    let out=body(i,x,18)+dots(x,132,n);
    // A wide segmented instrument fills the card; identical ticks preserve comparisons.
    out+=line(`M${x-44} ${start}h88m-88 80h88`,false,hex(palette.ink));
    if(reference){const ref=PHYS.springState(0,n);out+=line(`M${x-32} ${start}h64v${ref.shownMarks*unit}h-64z`,true,hex(palette.ink));}
    const length=d.spring.shownMarks*unit;
    out+=`<rect x="${x-width/2}" y="${start}" width="${width}" height="${Math.max(1,length)}" fill="${hex(palette.force)}" fill-opacity=".32"/>`;
    out+=line(`M${x-width/2} ${start}h${width}v${length}h-${width}z`);
    for(const [k,cell]of d.cells.entries())out+=line(`M${x-width/2} ${start+(k+cell)*unit}h${width}`);
    if(d.spring.broken)out+=line(`M${x-32} 118l25-13m-1 13 25-13`)+expansion(x+40,108);
    return out;
  }
  function balance(i,n,ref,x){
    const state=PHYS.balanceState(i,n,ref),tilt=state==='balanced'?0:(PHYS.weight(i,n)>PHYS.weight(i,ref)?-12:12);
    return body(i,x,20)+line(`M${x} 65v50m-18 0h36`,false,hex(palette.ink))+
      line(`M${x-36} ${65+tilt}L${x+36} ${65-tilt}`,false,hex(palette.mint))+
      line(`M${x-36} ${65+tilt}v25m-16 0h32M${x+36} ${65-tilt}v25m-16 0h32`,false,hex(palette.ink))+
      dots(x-36,85+tilt,n)+dots(x+36,85-tilt,ref);
  }
  function jump(i,time=0,animate=false){
    const earth=PHYS.jumpVisual(0),other=PHYS.jumpVisual(i),base=119,scale=32;
    let out=body(0,55,20)+body(1,235,20)+line('M28 119h244',true,hex(palette.ink));
    out+=line(`M28 ${base-earth.shownHeight*scale}h244`,true,hex(palette.ink));
    for(const [b,x]of [[0,65],[i,235]]){
      const d=PHYS.jumpVisual(b),samples=PHYS.timeDots(b),duration=samples.at(-1).time;
      const t=(time%3)/3*duration;
      const y=base-(animate?(PHYS.jumpSceneY(b,t)-PHYS.VIEW.jumpBase)/PHYS.VIEW.jumpScale:d.shownHeight??0)*scale;
      out+=circle(x,y,5)+dots(x,134,5);
      for(const p of samples)if(!animate||p.time<=t)out+=circle(x-10,base-(p.y-PHYS.VIEW.jumpBase)/PHYS.VIEW.jumpScale*scale,1);
      if(d.exaggerated)out+=expansion(x+14,100);
      if(d.height===null)out+=line(`M${x} 110V45m-5 6 5-6 5 6`);
    }
    if(other.height!==null)out+=line(`M219 ${base-other.shownHeight*scale}h32`);
    return out;
  }
  function picture(id,c,time=0){
    const n=c.n??5,bodyIndex=c.body,progress=1;
    if([1,4,6,7].includes(id)&&!c.detached){
      const scale=92/(id===4?PHYS.C.springLimit:PHYS.springState(6,5).shownMarks),top=26,x=45,w=210;
      const base=PHYS.springState(0,n).shownMarks*scale,current=PHYS.springState(bodyIndex,n),len=Math.min(92,current.shownMarks*scale);
      let drawing=body(bodyIndex,22,18)+dots(150,132,n);
      for(let k=0;k<=10;k++)drawing+=line(`M${x-18} ${top+k*9.2}h${w+36}`,true,hex(palette.grid));
      drawing+=`<rect x="${x-9}" y="${top}" width="${w+18}" height="${base}" stroke="${hex(palette.ink)}" stroke-dasharray="6 5"/>`;
      drawing+=`<rect x="${x}" y="${top}" width="${w}" height="${Math.max(1,len)}" fill="${hex(palette.force)}" fill-opacity=".5"/>`;
      drawing+=line(`M${x} ${top}h${w}v${len}h-${w}z`);
      for(let k=1;k<=Math.floor(current.shownMarks)&&k*scale<=92;k++)drawing+=line(`M${x} ${top+k*scale}h${w}`);
      if(current.broken)drawing+=line('M65 118l70-14m15 14 70-14')+expansion(275,105);
      if(id===6&&bodyIndex===8)drawing+=line('M40 120h220M150 110v26m-8-8 8 8 8-8',false,hex(palette.mint));
      if(id===7)drawing+=`<rect x="${x-16}" y="${top+base*PHYS.C.similarMin}" width="${w+32}" height="${base*(PHYS.C.similarMax-PHYS.C.similarMin)}" stroke="${hex(palette.mint)}" stroke-dasharray="4 3"/>`;
      return svg(drawing);
    }
    let out='';
    if(id===2){const ref=c.reference??5,earth=time!==0&&time%3<.7;out=balance(0,ref,ref,65)+balance(earth?0:1,earth?ref:n,ref,235)+equal;}
    else if(id===3){
      // Each prediction places the PHYS maximum under its chosen specimen.
      const indices=[5,6,4];out=indices.map((i,k)=>`<g>${body(i,55+k*95,20)}${force(i===bodyIndex?6:(i===6?bodyIndex:i),5,55+k*95,progress,false).replace(body(i===bodyIndex?6:(i===6?bodyIndex:i),55+k*95,20),'')}</g>`).join('');
    }else if(id===5)out=jump(bodyIndex,time,false);
    else if(c.detached){out=body(7,150,22)+line('M70 104h160',true,hex(palette.ink))+dots(110,65-progress*20,n)+circle(200,80-progress*25,6);}
    else{
      out=force(bodyIndex,n,150,progress);
      if(id===6&&bodyIndex===8)out+=line('M105 119h90m-45-10v24m-6-6 6 6 6-6',false,hex(palette.mint));
      if(id===4&&c.key==='B')out+=repeats(bodyIndex,n,28,45)+expansion(112,114);
      if(id===7)out+=target(n,150);
    }
    return svg(out);
  }
  function target(n,x){
    const baseline=PHYS.springState(0,n).shownMarks;
    const y=42+baseline*PHYS.C.similarMin*2.5,h=baseline*(PHYS.C.similarMax-PHYS.C.similarMin)*2.5;
    return `<rect x="${x-26}" y="${y}" width="52" height="${h}" stroke-dasharray="3 3" stroke="${hex(palette.mint)}"/>`;
  }
  function repeats(i,n,x,y){
    const ratio=PHYS.gRatio(i),length=PHYS.springState(0,n).shownMarks*2.5;
    return Array.from({length:Math.ceil(ratio)},(_,k)=>line(`M${x+k%7*13} ${y+Math.floor(k/7)*17}v${Math.min(1,ratio-k)*length}`,true,hex(palette.ink))).join('');
  }
  function actual(id,s){
    if(id===2)return svg(balance(0,s.nWeights,s.nWeights,65)+balance(1,s.nWeights,s.nWeights,235)+equal);
    if(id===3)return svg([5,6,4].map((i,k)=>force(i,s.nWeights,55+k*95)).join(''));
    if(id===5)return svg(jump(s.runs.find(r=>r.i===1)?.i??s.i));
    return picture(id,{body:s.i,n:s.nWeights,key:id===4?'B':undefined});
  }
  function principle(id,s){
    const n=s.nWeights;
    if(id===1)return svg(dots(40,65,n)+line('M66 65h34m-6-5 6 5-6 5',false,hex(palette.mint))+force(s.i,n,220)+equal);
    if(id===2||id===3||id===5)return actual(id,s);
    if(id===4)return svg(body(0,62,22)+repeats(s.i,n,24,45)+equal+force(s.i,n,220)+expansion(270,102));
    if(id===6)return svg(body(s.i,44,64)+line('M68 65h28m-6-5 6 5-6 5')+force(s.i,n,210)+line('M175 120h70m-35-10v24m-6-6 6 6 6-6',false,hex(palette.mint)));
    return svg(force(0,n,65)+target(n,65)+equal+force(s.i,n,235)+target(n,235));
  }
  function micro(s){
    const d=PHYS.grammarState(s.i,s.nWeights);
    return svg(circle(150,70,57)+force(s.i,s.nWeights,150)+expansion(215,110)+(d.spring.broken?line('M108 100l25-10m-3 10 25-10'):'')+(s.i===8?line('M117 119h66m-33-10v24m-6-6 6 6 6-6',false,hex(palette.mint)):''));
  }
  return {picture,actual,principle,micro};
})();
