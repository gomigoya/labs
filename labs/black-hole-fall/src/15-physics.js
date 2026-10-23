// ==== 1 PHYSICS ====
// 뉴턴 선형 조석 근사. 지평선 근처·안쪽의 연장 값은 추정이다.
const PHYS = (() => {
  const C = Object.freeze({
    G: 6.674e-11, c: 2.998e8, solarMass: 1.989e30, g: 9.81, L: 1.7,
    // SI: G는 m³/(kg·s²), c는 m/s, 질량 kg, g는 m/s², L은 m.
    limit: 100, // m/s², 추정: 학습용 견딜 한계.
    massSolar: Object.freeze([10, 4e6, 1e9]),
    distanceRange: Object.freeze([0.0005, 1000]), // r_s 배수, 무차원.
    detentR: Object.freeze([1000, 200, 40, 20, 1, 0.01, 0.0005]),
    railR: Object.freeze([1000, 200, 40.8, 40, 39.2, 20.4, 20, 19.6, 1.02, 1, 0.98, 0.0005]),
    railX: Object.freeze([0, 0.1, 0.18, 0.2, 0.22, 0.28, 0.3, 0.32, 0.48, 0.5, 0.52, 1]),
    linearSegments: Object.freeze([2, 3, 5, 6, 8, 9]),
    snapTolerance: 0.02, ratioTarget: 8, compareTolerance: 1e-12,
    q1End: 20, q2Far: 40, q2Near: 20,
    stretchMax: 4, stretchAtLimit: 1.7,
    visualFar: 4.5, visualNear: 0.6,
    graphRange: Object.freeze([1e-12, 1e20]), // m/s², 표시용 로그 범위.
  });
  const MASSES = C.massSolar;
  const RANGE = Object.freeze({ r: C.distanceRange, massIndex: Object.freeze([0, MASSES.length - 1]) });
  const rs = i => 2 * C.G * MASSES[i] * C.solarMass / C.c ** 2;
  const tidalAtMass = (massKg, rMeters, orientation = 'radial') =>
    (orientation === 'transverse' ? 1 : 2) * C.G * massKg * C.L / rMeters ** 3;
  const dAMeters = (i, rMeters, orientation = 'radial') => tidalAtMass(MASSES[i] * C.solarMass, rMeters, orientation);
  const dA = (i, r, orientation = 'radial') => dAMeters(i, r * rs(i), orientation);
  const spaghettiR = i => Math.cbrt(dA(i, 1) / C.limit);
  // 추정: 물질 변형식이 아닌 단조 포화 시각 매핑이다.
  const stretchFromDA = a => 1 + (C.stretchMax - 1) * Math.tanh(
    Math.atanh((C.stretchAtLimit - 1) / (C.stretchMax - 1)) * a / C.limit);
  function state(i, r, orientation = 'radial') {
    const a = dA(i, r, orientation);
    return { intact: r >= Math.cbrt(dA(i, 1, orientation) / C.limit), stretch: stretchFromDA(a), crossedHorizon: r < 1 };
  }
  function railX(r) {
    if (r >= RANGE.r[1]) return 0;
    if (r <= RANGE.r[0]) return 1;
    const j = C.railR.findIndex((v, k) => k < C.railR.length - 1 && r <= v && r >= C.railR[k + 1]);
    const hi = C.railR[j], lo = C.railR[j + 1];
    const t = C.linearSegments.includes(j) ? (hi - r) / (hi - lo) : Math.log(hi / r) / Math.log(hi / lo);
    return C.railX[j] + t * (C.railX[j + 1] - C.railX[j]);
  }
  function rFromRailX(x) {
    if (x <= 0) return RANGE.r[1];
    if (x >= 1) return RANGE.r[0];
    const j = C.railX.findIndex((v, k) => k < C.railX.length - 1 && x >= v && x <= C.railX[k + 1]);
    const t = (x - C.railX[j]) / (C.railX[j + 1] - C.railX[j]);
    const hi = C.railR[j], lo = C.railR[j + 1];
    return C.linearSegments.includes(j) ? hi + t * (lo - hi) : hi * (lo / hi) ** t;
  }
  const DETENTS = Object.freeze(C.detentR.map(r => Object.freeze({ r, x: railX(r) })));
  const snapR = r => C.detentR.find(v => Math.abs(r / v - 1) <= C.snapTolerance + Number.EPSILON) ?? r;
  // 추정: 장면 거리는 실거리 비례가 아니다.
  const visualRadius = r => C.visualFar + (C.visualNear - C.visualFar) * railX(r);
  // 추정: 부피를 보존하는 시각 변형이며 조직의 역학은 아니다.
  const visualShape = (i, r, orientation = 'radial') => {
    const s = state(i, r, orientation).stretch;
    return orientation === 'transverse' ? { along: 1 / s, across: Math.sqrt(s) }
      : { along: s, across: 1 / Math.sqrt(s) };
  };
  // 추정: 격자·원반·입자의 세기를 묶는 설명용 포화 입력.
  const visualField = (i, r) => (state(i, r).stretch - 1) / (C.stretchMax - 1);
  const graphY = a => Math.max(0, Math.min(1, Math.log(a / C.graphRange[0]) / Math.log(C.graphRange[1] / C.graphRange[0])));
  function tidalArrows(i, r, orientation = 'radial') {
    const center = C.G * MASSES[i] * C.solarMass / (r * rs(i)) ** 2;
    const a = dA(i, r, orientation), radial = orientation === 'radial';
    return { center, near: radial ? center + a / 2 : center, far: radial ? center - a / 2 : center,
      diffNear: radial ? a / 2 : -a / 2, diffFar: radial ? -a / 2 : a / 2, axis: orientation };
  }

  // 입력·측정 경계에서만 검증한다. 모델 함수는 유효한 순수 값을 받는다.
  function measure(i, r, runId, orientation = 'radial') {
    if (!Number.isInteger(i) || i < 0 || i >= MASSES.length || !Number.isFinite(r) || r < 0
      || !Number.isSafeInteger(runId) || runId < 0 || !['radial', 'transverse'].includes(orientation)) return null;
    const base = { i, r, runId, orientation };
    if (r === 0) return { ...base, event: 'singularity', value: null };
    const value = dA(i, r, orientation);
    return Number.isFinite(value) ? { ...base, event: null, value } : { ...base, event: 'singularity', value: null };
  }
  function measurements(samples, runId) {
    return (samples ?? []).filter(s => s?.runId === runId)
      .map(s => measure(s.i, s.r, s.runId, s.orientation)).filter(s => s !== null);
  }
  function eventsBetween(previous, current) {
    if (!previous || !current || previous.runId !== current.runId || previous.i !== current.i
      || previous.orientation !== current.orientation) return [];
    const [p, n] = [previous, current].map(s => measure(s.i, s.r, s.runId, s.orientation));
    if (!p || !n || p.event) return [];
    if (n.event) return ['singularity'];
    const events = [];
    if (!state(p.i, p.r, p.orientation).crossedHorizon && state(n.i, n.r, n.orientation).crossedHorizon) events.push('horizon');
    if (state(p.i, p.r, p.orientation).intact && !state(n.i, n.r, n.orientation).intact) events.push('disruption');
    return events;
  }
  const inRail = r => Number.isFinite(r) && r >= RANGE.r[0] && r <= RANGE.r[1];
  const radialSamples = (samples, runId) => measurements(samples, runId)
    .filter(s => !s.event && s.orientation === 'radial' && inRail(s.r));
  function judgeQ1({ samples, runId }) {
    const s = radialSamples(samples, runId).filter(v => v.i === 0);
    return s.some((v, j) => v.r > C.q1End && s.slice(j + 1).some(n => n.r <= C.q1End && n.value > v.value));
  }
  function judgeQ2({ samples, runId, ratioSeen }) {
    const s = radialSamples(samples, runId);
    return ratioSeen === true && s.some(a => s.some(b => a.i === b.i
      && Math.abs(a.r / C.q2Far - 1) <= C.snapTolerance + Number.EPSILON
      && Math.abs(b.r / C.q2Near - 1) <= C.snapTolerance + Number.EPSILON
      && Math.abs(b.value / a.value - C.ratioTarget) <= C.compareTolerance * C.ratioTarget));
  }
  function judgeQ3({ previous, current }) {
    return current?.i === 0 && current.orientation === 'radial'
      && inRail(current.r) && eventsBetween(previous, current).includes('disruption');
  }
  function judgeQ4({ samples, runId, comparisonOpen }) {
    const s = radialSamples(samples, runId);
    return comparisonOpen === true && [0, 1].every(i => s.some(v => v.i === i && v.r === 1 && v.value === dA(i, 1)));
  }
  const judgeQ5 = ({ i, r, stopped, orientation = 'radial' }) => i === 1 && orientation === 'radial'
    && stopped === true && inRail(r) && state(i, r).crossedHorizon && state(i, r).intact;
  const judgeQ6 = ({ i, r, orientation = 'radial' }) => Number.isInteger(i) && i >= 0 && i < MASSES.length
    && orientation === 'radial' && inRail(r) && spaghettiR(i) < 1 && state(i, r).crossedHorizon && state(i, r).intact;
  // R1: explanatory scene units, not physical spacetime or free-fall dynamics.
  const SCENE = Object.freeze({ scale: 0.28, center: Object.freeze([-0.45,1.43,-0.1]),
    top: 1.12, radiusMax: 1.55, horizon: visualRadius(1)*0.28, rodLength: 0.14, rodWidth: 0.045, rodHeight: 0.038,
    bounds: Object.freeze([-1.85,1.03,-1.2,1.85,1.85,1.36]), scanSeconds: 28 });
  function sceneState(i,r,orientation='radial') {
    const status=state(i,r,orientation), shape=visualShape(i,r,orientation), field=visualField(i,r);
    return { ...status, field, radius: visualRadius(r)*SCENE.scale,
      length: SCENE.rodLength*shape.along, width: SCENE.rodWidth*shape.across, height: SCENE.rodHeight*shape.across,
      gap: status.intact ? 0 : 0.045*field, depth: 0.07+0.14*field,
      glow: 1.6+1.2*field, light: 0.25+0.4*field, flow: 0.10+0.35*field };
  }
  // R2 display mappings: explanatory scan, never relativistic fall or clock rate.
  const GRAMMAR = Object.freeze({cells:30, cell:0.013, tableWidth:4.24, bounds:Object.freeze([-2.12,1.03,-1.25,2.12,2.15,1.36]), bodyScale:1.45, marker:0.052, trailCount:18, particles:160});
  function grammarState(i,r,orientation='radial') {
    const base=sceneState(i,r,orientation), force=tidalArrows(i,r,orientation);
    const unit=dA(0,C.q2Far), ratio=dA(i,r,orientation)/unit;
    const arrow=value=>({length:Math.min(GRAMMAR.cells,Math.abs(value)/unit)*GRAMMAR.cell,
      overflow:Math.abs(value)/unit>GRAMMAR.cells, sign:Math.sign(value)});
    const x=railX(r);
    return { ...base, unit, streakLength:0.018+base.field*0.025, body:{length:base.length*GRAMMAR.bodyScale,width:base.width*GRAMMAR.bodyScale,height:base.height*GRAMMAR.bodyScale},
      marker:GRAMMAR.marker, marks:Math.min(GRAMMAR.cells,ratio),overflow:ratio>GRAMMAR.cells,
      pull:[arrow(force.far),arrow(force.near)],difference:[arrow(force.diffFar),arrow(force.diffNear)],
      threshold:visualRadius(Math.cbrt(dA(i,1,orientation)/C.limit))*SCENE.scale,
      // Equal scan-time samples; nonuniform display rail deliberately distorts spacing.
      trail:Array.from({length:GRAMMAR.trailCount},(_,j)=>visualRadius(rFromRailX(Math.max(0,x-j/(GRAMMAR.trailCount-1)*0.32)))*SCENE.scale),
      massRows:MASSES.map((_,j)=>({i:j,shape:visualShape(j,1),length:SCENE.rodLength*visualShape(j,1).along,height:0.025*visualShape(j,1).across,marks:Math.min(GRAMMAR.cells,dA(j,1)/dA(0,40)),overflow:dA(j,1)/dA(0,40)>GRAMMAR.cells})) };
  }
  // R4 display-only magnification, independent of model and all quest evidence.
  function presentationState(i,r,orientation='radial') {
    const v=grammarState(i,r,orientation),scale=2.35/GRAMMAR.bodyScale;
    return {...v,body:{length:v.body.length*scale,width:v.body.width*scale,height:v.body.height*scale},marker:v.marker*1.3};
  }
  // R5 pure card geometry. Log compression is marked by a drawn expansion sign.
  // These hypothetical samples never enter measurements, state or quest judging.
  function cardMagnitude(value, reference) {
    return Math.min(1, Math.log1p(Math.max(0,value)/reference)/Math.log(9));
  }
  function cardPrediction(id,c) {
    const base=dA(0,40);
    if(id===1){
      const r=c.key==='large'?20:c.key==='little'?40:1000;
      const value=dA(0,r),shown=cardMagnitude(value,base);
      return {r,value,shown,length:60+108*shown,height:54/Math.sqrt(1+3*shown),arrow:58*shown,intact:state(0,r).intact};
    }
    if(id===2){
      let lo=20,hi=40;
      for(let n=0;n<48;n++){const mid=(lo+hi)/2;if(dA(0,mid)/base>c.ratio)lo=mid;else hi=mid;}
      const r=(lo+hi)/2;return {r,value:dA(0,r),marks:dA(0,r)/base};
    }
    if(id===3){
      const r=c.key==='inside'?.5:c.key==='on'?1:spaghettiR(0);
      return {r,radius:visualRadius(r)*84/visualRadius(spaghettiR(0)),horizon:visualRadius(1)*84/visualRadius(spaghettiR(0))};
    }
    if(id===4){
      const a=dA(0,1),b=c.key==='smaller'?dA(1,1):c.key==='same'?a:dAMeters(1,rs(0));
      // One shared log scale: tiny / same / larger never share a clipped maximum.
      const width=v=>104*Math.log1p(v/a)/(Math.log1p(v/a)+Math.log(2));
      return {a,b,reference:width(a),arrow:width(b)};
    }
    if(id===5){
      const failure=c.key==='horizon'?1:c.key==='threshold'?spaghettiR(1):0;
      return {failure,samples:[1.25,.5,spaghettiR(1)*.5].map(r=>({r,intact:r>=failure,shape:visualShape(1,r)}))};
    }
    const i=c.i;
    return {i,r:.5,size:16+46*Math.log(MASSES[i]/MASSES[0])/Math.log(MASSES[2]/MASSES[0]),...state(i,.5)};
  }
  return { cardMagnitude, cardPrediction, presentationState, GRAMMAR, grammarState, SCENE, sceneState, C, MASSES, RANGE, DETENTS, rs, tidalAtMass, dAMeters, dA, spaghettiR, state,
    stretchFromDA, railX, rFromRailX, snapR, visualRadius, visualShape, visualField, graphY, tidalArrows, measure, measurements, eventsBetween,
    judgeQ1, judgeQ2, judgeQ3, judgeQ4, judgeQ5, judgeQ6 };
})();
// ==== END PHYSICS ====
