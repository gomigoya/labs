// ==== 1 PHYSICS ====
const PHYS = (() => {
  const C = Object.freeze({
    g: 9.81, // m/s²
    adultMass: 70, kidMass: 35, // kg
    adultPullRatio: 0.5, kidPullRatio: 0.4, // 추정: 체중 대비 근육 힘
    tieN: 1, // N
    kidsMin: 1, kidsMax: 100, increaseQ5: 10, designKids: 30,
    muscleExponent: 2 / 3,
    railRoundoffUlps: 8,
    kidHeight: 1.3, // m, 비교용 눈금이며 공룡 키를 추론하지 않는다.
    forceLinearBeads: 10, forceTailBeads: 5, // 추정: 표시 공간 배분
    detentKids: Object.freeze([1, 10, 20, 30, 49, 59, 68, 100]),
    get k() { return this.adultPullRatio * this.adultMass * this.g / this.adultMass ** this.muscleExponent; }, // N/kg^(2/3), 추정
    get kidMuscle() { return this.kidPullRatio * this.kidMass * this.g; }, // N, 추정
  });
  const SPECIES = Object.freeze({
    '벨로키랍토르': 15, '딜로포사우루스': 400, '스테고사우루스': 3000,
    '트리케라톱스': 6000, '티라노사우루스': 8000, '아르젠티노사우루스': 70000,
  }); // kg, 명세의 대표 질량
  const GROUNDS = Object.freeze({ '유리': 0.05, '모래': 0.35, '자갈': 0.55, '아스팔트': 0.8 });
  const RANGE = Object.freeze({ kids: Object.freeze([C.kidsMin, C.kidsMax]) });
  const muscle = mass => C.k * mass ** C.muscleExponent;
  const friction = (mass, mu) => mu * mass * C.g;
  const kidCap = (n, mu) => n * Math.min(C.kidMuscle, friction(C.kidMass, mu));
  const dinoCap = (species, mu) => Math.min(muscle(SPECIES[species]), friction(SPECIES[species], mu));
  const weightRatio = species => muscle(SPECIES[species]) / (SPECIES[species] * C.g);
  function outcome(n, species, mu) {
    const kids = kidCap(n, mu), dino = dinoCap(species, mu), net = kids - dino;
    const winner = Math.abs(net) <= C.tieN ? 'tie' : net > 0 ? 'kids' : 'dino';
    // 비김에는 패자가 없다. 작은 한계 쪽, 정확히 같으면 아이 쪽을 진단한다.
    const kidsLimited = kids <= dino;
    const fm = kidsLimited ? C.kidMuscle : muscle(SPECIES[species]);
    const ff = friction(kidsLimited ? C.kidMass : SPECIES[species], mu);
    return { kids, dino, net, winner, limiter: ff <= fm ? 'friction' : 'muscle' };
  }
  function minKidsToWin(species, mu) {
    // 명세의 엄격한 > 정의다. 1 N 비김 띠와는 별개다.
    const n = Math.floor(dinoCap(species, mu) / kidCap(C.kidsMin, mu)) + 1;
    return n <= C.kidsMax ? n : Infinity;
  }
  // 각 정수 칸은 레일의 같은 폭을 차지한다. railX는 칸의 중심이다.
  const railX = n => (n - C.kidsMin + 0.5) / (C.kidsMax - C.kidsMin + 1);
  function kidsFromRailX(x) {
    const scaled = x * (C.kidsMax - C.kidsMin + 1);
    // 정확한 칸 경계가 곱셈 반올림 때문에 왼쪽 칸으로 떨어지지 않게 한다.
    const rounded = scaled + C.railRoundoffUlps * Number.EPSILON * Math.max(1, Math.abs(scaled));
    return Math.max(C.kidsMin, Math.min(C.kidsMax, C.kidsMin + Math.floor(rounded)));
  }
  const DETENTS = Object.freeze(C.detentKids.map(n => Object.freeze({ n, x: railX(n) })));
  // 추정: 열 마디까지 선형, 이후 로그 압축. 끊김과 ⤢를 함께 붙인다.
  function forceVisual(force) {
    const beads = force / C.kidMuscle;
    return { beads, length: beads <= C.forceLinearBeads ? beads
      : C.forceLinearBeads + C.forceTailBeads * Math.log1p((beads - C.forceLinearBeads) / C.forceTailBeads),
    compressed: beads > C.forceLinearBeads };
  }
  // 접촉 한계를 넘는 순간만 사건으로 돌려주며, 속도나 가속도는 만들지 않는다.
  function slipOnset(previousForce, force, mass, mu) {
    if (previousForce === null) return null;
    const threshold = friction(mass, mu);
    return previousForce <= threshold && force > threshold;
  }
  // 검증은 기록·퀘스트 경계에서만 한다. 핵심 계산의 입력은 유효 SI 값이다.
  const validSetup = ({ n, species, mu }) => Number.isInteger(n) && n >= C.kidsMin && n <= C.kidsMax
    && Object.hasOwn(SPECIES, species) && Object.values(GROUNDS).includes(mu);
  const validObservation = o => o != null && Number.isInteger(o.run) && o.run > 0 && validSetup(o);
  const judgeQ1 = s => validSetup(s) && s.n === C.kidsMin && s.species === '벨로키랍토르'
    && s.mu === GROUNDS['자갈'] && outcome(s.n, s.species, s.mu).winner === 'kids';
  const judgeQ2 = s => validSetup(s) && s.species === '트리케라톱스' && s.mu === GROUNDS['자갈']
    && s.n >= minKidsToWin(s.species, s.mu) && outcome(s.n, s.species, s.mu).winner === 'kids';
  const judgeQ3 = s => validSetup(s) && s.species === '티라노사우루스' && s.mu === GROUNDS['자갈']
    && s.n >= minKidsToWin(s.species, s.mu);
  function judgeQ4({ observations = [] }) {
    const valid = observations.filter(validObservation);
    return valid.some(a => a.mu === GROUNDS['자갈'] && outcome(a.n, a.species, a.mu).winner === 'kids'
      && valid.some(b => b.run !== a.run && b.n === a.n && b.species === a.species
        && b.mu === GROUNDS['유리'] && outcome(b.n, b.species, b.mu).winner === 'dino'));
  }
  function judgeQ5({ before = null, after = null }) {
    return validObservation(before) && validObservation(after) && after.run > before.run
      && before.species === after.species && before.mu === GROUNDS['유리'] && after.mu === before.mu
      && after.n - before.n >= C.increaseQ5
      && [before, after].every(s => outcome(s.n, s.species, s.mu).limiter === 'friction');
  }
  const judgeQ6 = ({ visited = [], compareOpen = false }) => compareOpen === true
    && ['벨로키랍토르', '아르젠티노사우루스'].every(s => visited.includes(s))
    && weightRatio('벨로키랍토르') > weightRatio('아르젠티노사우루스');
  function judgeQ7(s) {
    if (!validSetup(s) || s.n !== C.designKids || s.mu !== GROUNDS['자갈']) return false;
    const winners = Object.keys(SPECIES).filter(t => outcome(s.n, t, s.mu).winner === 'kids');
    return winners.includes(s.species) && !winners.some(t => SPECIES[t] > SPECIES[s.species]);
  }
  // R1 display mappings only. Dimensions are schematic exhibition units, not recovered anatomy.
  const SCENE = Object.freeze({ top: 1.10, trackWidth: 6.0, trackDepth: 1.24, railStart: -2.70,
    railWidth: 2.2, railY: 1.36, railZ: 0.76, consoleZ: 1.04, barWidth: 2.35,
    min: Object.freeze([-3.2, 0.035, -0.80]), max: Object.freeze([3.2, 3.25, 1.30]),
    modelScales: Object.freeze([0.46, 0.66, 0.77, 0.82, 0.98, 0.96]),
    // body length, body height, leg height, neck rise, head length, tail length; estimated models.
    forms: Object.freeze([[0.78,0.34,0.37,0.17,0.30,0.65],[0.85,0.43,0.48,0.25,0.36,0.70],
      [1.02,0.54,0.27,0.10,0.26,0.75],[1.02,0.58,0.28,0.10,0.48,0.56],
      [1.00,0.60,0.58,0.23,0.48,0.75],[1.08,0.56,0.42,1.15,0.30,0.85]].map(Object.freeze)),
    comparisonScale: 0.18, flagTravel: 0.40, kidSceneHeight: 0.16, stakeScale: 0.30 });
  const railWorldX = x => SCENE.railStart + x * SCENE.railWidth;
  const massGraphX = species => Math.log(SPECIES[species] / 15) / Math.log(70000 / 15);
  const forceSceneLength = force => SCENE.barWidth * forceVisual(force).length / forceVisual(muscle(70000)).length;
  const pegPosition = i => ({ x: -2.68 + (i % 10) * 0.205, y: SCENE.top + 0.13, z: -0.43 + Math.floor(i / 10) * 0.085 });
  function displayState(n, species, mu, phase = 0) {
    const result = outcome(n, species, mu), i = Object.keys(SPECIES).indexOf(species);
    return { n, speciesIndex: i, scale: SCENE.modelScales[i], form: SCENE.forms[i],
      kidsLength: forceSceneLength(result.kids), dinoLength: forceSceneLength(result.dino),
      kidsCompressed: forceVisual(result.kids).compressed, dinoCompressed: forceVisual(result.dino).compressed,
      flagX: (result.winner === 'tie' ? 0 : result.winner === 'kids' ? -1 : 1) * SCENE.flagTravel * (0.5 - 0.5 * Math.cos(phase)),
      slip: result.winner !== 'tie' && result.limiter === 'friction', ...result };
  }
  // R2 schematic mappings. Bounds/caps belong here, never in scene callers.
  const VIS = Object.freeze({ cells: 30, width: 2.35, kidHeight: .22, grains: 180, streamCount: 96, dustCount: 48, recordCap: 3,
    min: Object.freeze([-3.25,.035,-.8]), max: Object.freeze([3.25,3.65,1.30]),
    lensWidth: 1.60, lensHeight: .66, ratioHeight: .58, trailCount: 9 });
  const modelScale = species => .38 + .64 * Math.cbrt(SPECIES[species] / 70000);
  function teamLayout(n, i) {
    const rows = n <= 30 ? 1 : n <= 66 ? 2 : 3, columns = Math.ceil(n / rows);
    return { rows, columns, x: -2.70 + (i % columns) * 2.25 / Math.max(1, columns - 1),
      y: SCENE.top + .14, z: -.48 + Math.floor(i / columns) * .24, band: Math.floor(i / 10) % 2 };
  }
  function forceGlyph(force) {
    const v = forceVisual(force), max = forceVisual(muscle(70000)).length;
    return { length: VIS.width * Math.min(v.length, max) / max,
      count: Math.min(VIS.cells, Math.floor(v.beads)), compressed: v.compressed || v.beads > VIS.cells,
      cuts: v.compressed, unit: forceSceneLength(C.kidMuscle),
      ticks: Array.from({length: Math.min(VIS.cells, Math.floor(v.beads))}, (_,i) => forceSceneLength((i+1)*C.kidMuscle)) };
  }
  function grammarState(n, species, mu, phase=0) {
    const result = displayState(n,species,mu,phase), mass = SPECIES[species];
    return { ...result, species, mu, scale: modelScale(species),
      forces: [result.kids,result.dino,n*C.kidMuscle,friction(n*C.kidMass,mu),muscle(mass),friction(mass,mu)].map(forceGlyph),
      ratio: weightRatio(species), ratioLength: VIS.ratioHeight*weightRatio(species),
      team: Array.from({length:n},(_,i)=>teamLayout(n,i)),
      traces: Array.from({length:VIS.trailCount},(_,i)=>displayState(n,species,mu,phase-i*.16).flagX),
      roughness: mu*.08, streamDensity: Math.min(1,Math.max(result.kids,result.dino)/muscle(70000)),
      slipX: result.winner === 'kids' ? 1.36 : -1.55 };
  }
  // R4 presentation only: estimated exhibition size, never a reconstructed body height.
  const exhibitionScale = species => modelScale(species) * (species === Object.keys(SPECIES).at(-1) ? 1.45 : 1.12);
  const exhibitionBounds = species => { const f=SCENE.forms[Object.keys(SPECIES).indexOf(species)];return {min:[-3.4,.035,-.8],max:[3.5,Math.max(2.65,1.235+exhibitionScale(species)*(f[2]+f[1]/2+f[3]+.32)),1.3]}; };
  // R5 pure stage mappings. All dimensions/poses are estimated exhibition units.
  // The original scientific and R1-R4 mappings remain intact for their consumers.
  const DRAMA = Object.freeze({ width:9.2, depth:2.24, ground:SCENE.top+.135,
    kidHeight:.49, kidStart:-4.38, kidSpan:3.98, rowGap:.56, dinoX:2.05,
    dinoZ:-.10, dinoStretch:.60, enlargement:3.6, maxHeight:4.6, ropeY:SCENE.top+.425,
    flagTravel:.56, flagStep:.14, beadRadius:.055,
    heroAzimuths:Object.freeze([8,14,20,26,32,40,48]), portraitAzimuths:Object.freeze([60,66,72,78]), portraitElevations:Object.freeze([24,28,32,36]),
    elevations:Object.freeze([8,10,12]), heroWidth:.80, minWidth:.70,
    heroHeight:.55, maxWidth:.90, fov:34, portraitFov:38,
    representative:Object.freeze({n:59,speciesIndex:4,groundIndex:2,phase:Math.PI*.82}) });
  function dramaChild(n,i) {
    const rows=n<=30?1:n<=66?2:3,columns=Math.ceil(n/rows),row=Math.floor(i/columns);
    return {rows,columns,x:DRAMA.kidStart+(columns===1?DRAMA.kidSpan:i%columns*DRAMA.kidSpan/(columns-1)),
      y:DRAMA.ground,z:-.78+row*DRAMA.rowGap,band:Math.floor(i/10)%2};
  }
  function dramaState(n,species,mu,phase=0) {
    const result=outcome(n,species,mu),f=SCENE.forms[Object.keys(SPECIES).indexOf(species)];
    const scale=Math.min(DRAMA.maxHeight/(f[2]+f[1]/2+f[3]+.32),exhibitionScale(species)*DRAMA.enlargement),ratio=result.kids/Math.max(1,result.dino);
    const effort=Math.min(1,(1-Math.cos(Math.min(Math.PI,phase)))*.5);
    const lean=-(.04+.20*ratio/(1+ratio))*effort;
    const index=Object.keys(SPECIES).indexOf(species);
    const modelHeight=Math.max(f[2]+f[1]/2+f[3]+.32,index===2?f[2]+f[1]*.95+.40:0,index===3?f[2]+f[1]/2+.55:0);
    const direction=result.winner==='tie'?0:result.winner==='kids'?-1:1;
    const travel=DRAMA.flagTravel*(.5-.5*Math.cos(phase)),step=travel/DRAMA.flagStep;
    const u=step-Math.floor(step),smooth=u*u*(3-2*u),flagX=direction*DRAMA.flagStep*(Math.floor(step)+smooth);
    const slip=result.winner!=='tie'&&result.limiter==='friction',skid=slip?flagX*.18:0;
    return {...result,scale,lean,height:scale*modelHeight,
      flagX,slip,kidSkid:result.winner==='dino'?skid:0,dinoSkid:result.winner==='kids'?skid:0,
      slipX:(result.winner==='kids'?DRAMA.dinoX:dramaChild(n,Math.min(n-1,3)).x)+skid,
      beadAmplitude:.026*effort,effort};
  }
  function dramaBounds(species) {
    const d=dramaState(59,species,.55,Math.PI);
    return {min:[-4.65,SCENE.top-.24,-1.16],max:[4.95,Math.max(3.65,DRAMA.ground+d.height+.35),1.3]};
  }
  // Pinhole fit shared by hero, teacher, attract and event shots; no renderer/DOM.
  function dramaFrame(width,height,species,rect,eventX=null) {
    const bounds=dramaBounds(species),center=bounds.min.map((v,i)=>(v+bounds.max[i])/2);
    if(eventX!==null){center[0]=center[0]*.8+eventX*.2;center[1]=center[1]*.85+DRAMA.ropeY*.15;}
    const portrait=width/height<.9,fov=portrait?DRAMA.portraitFov:DRAMA.fov,tan=Math.tan(fov*Math.PI/360);
    const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),corners=[];
    for(const x of [bounds.min[0],bounds.max[0]])for(const y of [bounds.min[1],bounds.max[1]])for(const z of [bounds.min[2],bounds.max[2]])corners.push([x,y,z].map((v,i)=>v-center[i]));
    let best=null;
    for(const azimuth of portrait?DRAMA.portraitAzimuths:DRAMA.heroAzimuths)for(const elevation of portrait?DRAMA.portraitElevations:DRAMA.elevations){
      const az=azimuth*Math.PI/180,el=elevation*Math.PI/180;
      const direction=[Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)],right=[Math.cos(az),0,-Math.sin(az)],up=[-Math.sin(az)*Math.sin(el),Math.cos(el),-Math.cos(az)*Math.sin(el)];
      for(let distance=6;distance<=55;distance+=.10){
        const points=corners.map(q=>{const depth=distance-dot(q,direction);return[(1+dot(q,right)/depth/tan/(width/height))*width/2,(1-dot(q,up)/depth/tan)*height/2,depth];});
        if(points.some(p=>p[2]<=0))continue;
        const left=Math.min(...points.map(p=>p[0])),r=Math.max(...points.map(p=>p[0])),top=Math.min(...points.map(p=>p[1])),b=Math.max(...points.map(p=>p[1]));
        const w=r-left,h=b-top,availableW=rect.right-rect.left,availableH=rect.bottom-rect.top;
        if(w>Math.min(width*DRAMA.maxWidth,availableW)||h>availableH)continue;
        const coverageW=w/width,coverageH=h/height;
        const score=Math.abs(coverageW-(eventX===null?DRAMA.heroWidth:.88))+Math.max(0,DRAMA.heroHeight-coverageH)*2+Math.max(0,DRAMA.minWidth-coverageW)*3+(eventX===null?0:distance*.0001);
        if(!best||score<best.score){
          // Event aim follows the flag, but its shift is clamped to the existing safe margins.
          const follow=eventX===null?0:Math.max(-12,Math.min(12,eventX*12));
          const shiftX=Math.max(rect.left-left,Math.min(rect.right-r,(rect.left+rect.right-left-r)/2+follow));
          const shiftY=(rect.top+rect.bottom-top-b)/2;
          best={score,pos:center.map((v,i)=>v+direction[i]*distance),target:center.slice(),fov,offsetX:shiftX,offset:shiftY,azimuth,elevation,distance,
            width:coverageW,height:coverageH,bounds:[left+shiftX,top+shiftY,r+shiftX,b+shiftY]};
        }
      }
    }
    return best;
  }
  return { dramaFrame, DRAMA, dramaChild, dramaState, dramaBounds, exhibitionScale, exhibitionBounds, VIS, modelScale, teamLayout, forceGlyph, grammarState, SCENE, railWorldX, massGraphX, forceSceneLength, pegPosition, displayState, C, SPECIES, GROUNDS, RANGE, muscle, friction, kidCap, dinoCap, outcome, minKidsToWin,
    weightRatio, railX, kidsFromRailX, DETENTS, forceVisual, slipOnset,
    judgeQ1, judgeQ2, judgeQ3, judgeQ4, judgeQ5, judgeQ6, judgeQ7 };
})();
// ==== END PHYSICS ====
