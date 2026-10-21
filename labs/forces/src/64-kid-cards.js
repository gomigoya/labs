const cardSVG = (content, viewBox = '0 0 240 100') => `<svg class="balance-card" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
const cardDots = (n, x=10, y=15) => Array.from({length:n},(_,i)=>`<circle cx="${x+i%10*8}" cy="${y+Math.floor(i/10)*10}" r="2" fill="currentColor" stroke="none"/>`).join('');
const cardBeam = d => `<path d="M120 42v40m-16 0h32M60 ${42-d} 180 ${42+d}M60 ${42-d}v22m120 ${2*d-22}v22"/><path d="M45 ${68-d}h30m90 ${2*d}h30"/>`;
function balancePicture(pic) {
  if (typeof pic === 'number') return cardSVG(Array.from({length:pic},(_,i)=>`<circle cx="${15+i%10*10}" cy="${15+Math.floor(i/10)*12}" r="3.6" fill="currentColor" stroke="none"/>`).join(''), '0 0 120 90');
  const tilts = { tiltL: -16, flat: 0, tiltR: 16 };
  if (pic in tilts) return cardSVG(cardBeam(tilts[pic]));
  const x = {inner:118,stay:157,outer:196}[pic];
  return cardSVG(`<path d="M16 35h196M118 30v10M157 30v10M196 30v10"/><path d="m86 37-14 25h28z" fill="currentColor"/><path d="M34 35v18"/><rect x="22" y="53" width="24" height="26" rx="2" fill="currentColor"/><circle cx="157" cy="35" r="7" stroke-dasharray="3 3"/><circle cx="${x}" cy="35" r="5" fill="currentColor"/><path d="M${x} 40v13"/><rect x="${x-12}" y="53" width="24" height="26" rx="2" fill="currentColor"/>`, '0 0 228 90');
}
// All force lengths share a scale within each picture. No SVG text or raster assets.
function cardArrow(x, y, dx, dy, col) {
  const a = Math.atan2(dy, dx), h = Math.min(6, Math.hypot(dx,dy)/2), ex=x+dx, ey=y+dy;
  return `<path stroke="${hex(col)}" d="M${x} ${y}L${ex} ${ey}M${ex-h*Math.cos(a-.6)} ${ey-h*Math.sin(a-.6)}L${ex} ${ey}L${ex-h*Math.cos(a+.6)} ${ey-h*Math.sin(a+.6)}"/>`;
}
function kidForceGlyph(k) {
  const col = FCOL[k], up = ['T','B','N'].includes(k);
  const arrows = k === 'net' ? cardArrow(12,28,30,0,col)+cardArrow(42,28,30,0,col)+cardArrow(12,70,60,0,col)
    : k === 'W' ? cardArrow(72,15,0,58,col)
    : up ? cardArrow(72,76,0,-56,col) : cardArrow(42,56,k === 'f' ? -30 : 46,0,col);
  const scene = k === 'T' ? '<path d="M30 8v9l-7 5 14 7-14 7 7 5v9"/>'
    : k === 'B' ? '<path d="M12 60q10-8 20 0t20 0 20 0 20 0M12 85h76"/>'
    : k === 'N' || k === 'f' ? '<path d="M10 80h80m-70 0-7 8m25-8-7 8m25-8-7 8m25-8-7 8"/>' : '';
  return cardSVG(`<g stroke="${hex(col)}">${scene}${k === 'net' ? '<path d="M30 45h24m-24 7h24"/>' : '<rect x="18" y="50" width="24" height="28" rx="3"/>'}${arrows}</g>`, '0 0 100 100');
}
function kidAlbum(acquired) {
  return `<div class="kalbum">${CARDS.map(c => `<div class="kforce ${acquired.has(c.k) ? 'on' : 'off'}" style="--c:${hex(c.col)}">${kidForceGlyph(c.k)}${acquired.has(c.k) ? '' : ico('lock')}</div>`).join('')}</div>`;
}
function kidPrincipleCard(m) {
  const eq = (x,y) => `<path d="M${x} ${y-4}h14m-14 8h14"/>`;
  const box = (x,y,w=24,h=20) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`;
  const weight = (x,y) => `<circle cx="${x+10}" cy="${y-4}" r="3"/>${box(x,y,20,23)}`;
  const F=FCOL.F, W=FCOL.W, T=FCOL.T, B=FCOL.B, f=FCOL.f, net=FCOL.net;
  const arrow=cardArrow;
  let body;
  switch(m.diagram) {
    case 'pull': {
      const shift = Math.min(125, Math.max(35, S.dist*500));
      body = box(18,50) + arrow(44,60,Math.min(55,S.F2.tgt*12),0,F) + `<g stroke-dasharray="4 4" opacity=".65">${box(18+shift,50)}</g>` + arrow(30,85,shift,0,net); break;
    }
    case 'tug': {
      const len=S.F1.tgt*8;
      body=box(65,40)+arrow(65,50,-len,0,F)+arrow(89,50,len,0,F)+eq(152,50)+`<circle cx="199" cy="50" r="17" stroke="${hex(net)}" stroke-dasharray="4 4"/>`; break;
    }
    case 'team': {
      const scale=65/(S.F1.tgt+S.F2.tgt),a=S.F1.tgt*scale,b=S.F2.tgt*scale;
      body=arrow(10,30,a,0,F)+`<path d="M85 24v12m-6-6h12"/>`+arrow(105,30,b,0,F)+eq(195,30)+arrow(80,72,a,0,net)+arrow(80+a,72,b,0,net)+`<path d="M${80+a} 64v16"/>`; break;
    }
    case 'moon': {
      const mass=PHYS.hangObject('weights',S.n.tgt).m, scale=42/(mass*9.8);
      body='<path d="M8 8h95v84H8zM137 8h95v84h-95z"/><circle cx="23" cy="23" r="8"/><path d="M158 16a8 8 0 1 0 7 10 7 7 0 0 1-7-10"/>'+weight(43,25)+eq(113,42)+weight(174,25)+arrow(80,40,0,mass*9.8*scale,W)+arrow(211,40,0,mass*S.g.tgt*scale,W); break;
    }
    case 'weights': {
      const unit=PC.weightMass*S.g.tgt, stretch=unit/PC.kHang, scale=60/(stretch*5);
      body=Array.from({length:5},(_,i)=>{const n=i+1,h=n*stretch*scale;return box(12+i*45,87-h,15,h)+arrow(36+i*45,87,0,-n*unit*(60/(unit*5)),T);}).join(''); break;
    }
    case 'floor': {
      const p={load:S.load.tgt,g:S.g.tgt,F1:0,F2:0,same:false}, st={x:PC.track.x0,v:0};
      const a=PHYS.trackForces(st,{...p,surface:'glass'}).fsMax,b=PHYS.trackForces(st,{...p,surface:'sand'}).fsMax;
      body='<rect x="12" y="20" width="38" height="50" rx="4"/><path d="m16 50 28-22m-24 33 24-22"/><rect x="134" y="20" width="38" height="50" rx="4"/><path d="m138 35 5-8 5 8 5-8 5 8 5-8m-25 25 5-8 5 8 5-8 5 8 5-8"/>'+arrow(58,50,a*40/b,0,f)+arrow(180,50,40,0,f); break;
    }
    case 'water': {
      const r=S.hang, scale=60/r.W;
      body=weight(18,20)+arrow(51,20,0,r.W*scale,T)+arrow(78,48,25,0,net)+'<path d="M116 12v75h108V12M116 36h108"/>'+weight(130,48)+arrow(164,20,0,r.T*scale,T)+arrow(204,80,0,-r.B*scale,B)+`<path stroke="${hex(T)}" d="M46 35h10m-10 15h10m-10 15h10M159 35h10m-10 15h10"/>`; break;
    }
    case 'float': {
      const r=S.hang, scale=35/r.W, surface=30+(1-r.frac)*36;
      body=box(91,30,56,36)+`<path stroke="${hex(B)}" d="M62 ${surface}h114M62 ${surface}v43h114V${surface}"/>`+arrow(42,27,0,r.W*scale,W)+eq(52,78)+arrow(202,62,0,-r.B*scale,B); break;
    }
    case 'motion': {
      body=['acc','dec'].map((key,i)=>{
        const r=KID.ctx.motion?.[key]; if(!r)return '';
        const y=26+i*48, sign=Math.sign(r.v)||1, len=Math.min(55,Math.abs(r.net)*10);
        // Equal time intervals: increasing gaps accelerate; decreasing gaps decelerate.
        const xs=key==='acc' ? [143,150,161,177,198,224] : [143,169,190,206,217,224];
        const trail=xs.map(x=>`<circle cx="${x}" cy="${y}" r="3" fill="${hex(net)}" stroke="none"/>`).join('');
        return arrow(12,y,24,0,F)+arrow(r.net*sign>0?48:48+len,y,r.net*sign>0?len:-len,0,net)+eq(118,y)+trail;
      }).join(''); break;
    }
    case 'boss': {
      const r=S.F, scale=65/Math.max(r.N,r.fsMax,S.F2.tgt);
      body='<path d="M12 85h216m-200 0-7 9m25-9-7 9m25-9-7 9m25-9-7 9m25-9-7 9m25-9-7 9m25-9-7 9m25-9-7 9m25-9-7 9"/>'+box(93,61,42,24)+Array.from({length:S.load.tgt},(_,i)=>box(99,53-i*8,30,8)).join('')+arrow(114,78,0,-r.N*scale,FCOL.N)+arrow(91,70,-r.fsMax*scale,0,f)+arrow(141,70,S.F2.tgt*scale,0,F)+Array.from({length:4},(_,i)=>`<path stroke="${hex(F)}" d="M${141+S.F2.tgt*scale*i/4} 66v8"/>`).join(''); break;
    }
  }
  if(body != null) return cardSVG(body);
  const r = PHYS.balance(balanceParams());
  const cards = {
    compare: cardBeam(r.thetaTarget*60),
    clips: `<path d="M35 25h35v45H35zM95 42h20m-20 12h20"/>${cardDots(S.balance.right.clips,135,35)}`,

  };
  // The moment card uses the same mass/distance scale on both axes.
  if (m.diagram === 'moments') {
    const M=PHYS.BALANCE.masses, L=S.balance.left, R=S.balance.right;
    return cardSVG(`<path d="M15 85h210M120 85v10"/><rect x="${120-L.pos*18}" y="${85-M[L.obj]}" width="${L.pos*18}" height="${M[L.obj]}" fill="#7dd3fc" fill-opacity=".4"/><rect x="120" y="${85-M[R.obj]}" width="${R.pos*18}" height="${M[R.obj]}" fill="#c4b5fd" fill-opacity=".4"/><path d="M160 92h-32m6-4-6 4 6 4M25 92h70m-6-4 6 4-6 4"/>`);
  }
  return cardSVG(cards[m.diagram]);
}
