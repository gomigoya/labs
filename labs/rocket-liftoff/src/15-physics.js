// ==== 1 PHYSICS ====
// 수직 운동·일정 중력·공기저항 무시. 모든 물리량은 SI(kg, m, s, N)다.
const PHYS = (() => {
  const C = Object.freeze({
    mDry: 9.7e5, mProp: 2.0e6, engineThrust: 6.9e6, ve: 2580, // kg, kg, N, m/s
    earthG: 9.81, moonG: 1.62, dt: 0.01, // m/s², m/s², s
    engineMin: 1, engineMax: 5,
    loads: Object.freeze([0, 2.0e5, 5.0e5]),
    // 추정: 모형 높이 1단위를 1000 m에 대응하는 로그 압축으로 정한다.
    heightScale: 1000,
  });
  const RANGE = Object.freeze({
    engines: Object.freeze([C.engineMin, C.engineMax]),
    load: Object.freeze([C.loads[0], C.loads.at(-1)]),
    g: Object.freeze([C.moonG, C.earthG]),
  });
  const m0 = load => C.mDry + load + C.mProp;
  const thrust = n => n * C.engineThrust;
  const T0W = (n, load, g) => thrust(n) / (m0(load) * g);
  const burnTime = n => C.mProp * C.ve / thrust(n);
  function liftoffTime(n, load, g) {
    // 소진 순간에야 같아지는 경우에는 추력이 곧 꺼지므로 뜨지 못한다.
    if (thrust(n) / (C.mDry + load) <= g) return Infinity;
    return Math.max(0, (m0(load) - thrust(n) / g) * C.ve / thrust(n));
  }
  const enginesNeeded = (load, g) => Math.floor(m0(load) * g / C.engineThrust) + 1;

  function stateAt(n, load, g, t) {
    const Tn = thrust(n), q = Tn / C.ve, tb = burnTime(n);
    const L = liftoffTime(n, load, g), endMass = C.mDry + load;
    const m = t >= tb ? endMass : m0(load) - q * t;
    const T = t < tb ? Tn : 0, W = m * g;
    let h = 0, v = 0, landingT = Infinity;
    let onPad = !Number.isFinite(L) || t < L || (t === L && T <= W);
    if (Number.isFinite(L)) {
      const ml = m0(load) - q * L, duration = tb - L;
      const burnLog = Math.log(ml / endMass);
      const vb = C.ve * burnLog - g * duration;
      const hb = C.ve * (duration - endMass / q * burnLog) - g * duration ** 2 / 2;
      landingT = tb + (vb + Math.sqrt(vb ** 2 + 2 * g * Math.max(0, hb))) / g;
      // 추정: 착지는 반발 없이 멈추고 발사대와 같은 지지가 생긴다.
      if (t >= landingT) onPad = true;
      else if (!onPad) {
        const u = Math.max(0, Math.min(t, tb) - L);
        const mu = t >= tb ? endMass : ml - q * u;
        const log = -Math.log1p(-q * u / ml);
        v = C.ve * log - g * u;
        h = C.ve * (u - mu / q * log) - g * u ** 2 / 2;
        if (t > tb) {
          const coast = t - tb;
          h = hb + vb * coast - g * coast ** 2 / 2;
          v = vb - g * coast;
        }
        h = Math.max(0, h);
      }
    }
    const normal = onPad ? Math.max(0, W - T) : 0;
    return { t, h, v, a: onPad ? 0 : T / m - g, m, T, W, normal, onPad, landingT };
  }

  function simulate(n, load, g, tEnd, dt = C.dt) {
    const result = { t: [], h: [], v: [], a: [], m: [], liftoffT: null, events: [] };
    // 검증은 입력 경계에서만 한다. 빈 자료와 잘못된 실행은 곡선을 만들지 않는다.
    if (!Number.isInteger(n) || n < C.engineMin || n > C.engineMax
      || !Number.isFinite(load) || load < 0 || !Number.isFinite(g) || g <= 0
      || !Number.isFinite(tEnd) || tEnd < 0 || !Number.isFinite(dt) || dt <= 0) return result;
    const L = liftoffTime(n, load, g), tb = burnTime(n);
    result.liftoffT = L;
    const landing = stateAt(n, load, g, 0).landingT;
    // 사건 시각은 표본 격자로 반올림하지 않는다. Infinity는 점으로 찍지 않는다.
    for (const [type, t] of [['liftoff', L], ['burnout', tb], ['landing', landing]]) {
      if (Number.isFinite(t) && t <= tEnd) result.events.push({ type, t });
    }
    // 고정 격자에서 가속도의 해석적 적분값을 표본화해 사건을 가로지르는 오차를 없앤다.
    const steps = Math.floor(tEnd / dt);
    for (let i = 0; i <= steps; i++) {
      const s = stateAt(n, load, g, i * dt);
      for (const key of ['t', 'h', 'v', 'a', 'm']) result[key].push(s[key]);
    }
    if (result.t.at(-1) < tEnd) {
      const s = stateAt(n, load, g, tEnd);
      for (const key of ['t', 'h', 'v', 'a', 'm']) result[key].push(s[key]);
    }
    return result;
  }

  const engineRailX = n => Math.max(0, Math.min(1, (n - C.engineMin) / (C.engineMax - C.engineMin)));
  const enginesFromRailX = x => Math.round(C.engineMin + Math.max(0, Math.min(1, x)) * (C.engineMax - C.engineMin));
  const loadRailX = load => C.loads.indexOf(load) / (C.loads.length - 1);
  const loadFromRailX = x => C.loads[Math.round(Math.max(0, Math.min(1, x)) * (C.loads.length - 1))];
  const gRailX = g => (C.earthG - g) / (C.earthG - C.moonG);
  const gFromRailX = x => x < 0.5 ? C.earthG : C.moonG;
  const DETENTS = Object.freeze({
    engines: Object.freeze(Array.from({ length: C.engineMax - C.engineMin + 1 }, (_, i) => {
      const value = C.engineMin + i;
      return Object.freeze({ value, x: engineRailX(value) });
    })),
    load: Object.freeze(C.loads.map(value => Object.freeze({ value, x: loadRailX(value) }))),
    g: Object.freeze([C.earthG, C.moonG].map(value => Object.freeze({ value, x: gRailX(value) }))),
  });
  const heightVis = h => Math.log1p(Math.max(0, h) / C.heightScale) / Math.LN2;
  const flameVis = T => Math.max(0, T) / C.engineThrust;

  // 실행 번호와 시각은 UI가 보관하는 순수 값이다. 가속도·비율은 다시 계산한다.
  const validRecord = r => r != null && Number.isInteger(r.runId) && r.runId > 0
    && Number.isInteger(r.n) && r.n >= C.engineMin && r.n <= C.engineMax
    && C.loads.includes(r.load) && [C.earthG, C.moonG].includes(r.g)
    && Number.isFinite(r.t) && r.t >= 0;
  const judgeQ1 = (r = {}) => validRecord(r) && r.ignited === true
    && r.n === C.engineMin && r.load === C.loads[0] && r.g === C.earthG
    && liftoffTime(r.n, r.load, r.g) === Infinity && r.t >= burnTime(r.n);
  const judgeQ2 = (r = {}) => validRecord(r) && r.ignited === true
    && r.load === C.loads[0] && r.g === C.earthG
    && r.n === enginesNeeded(r.load, r.g) && T0W(r.n, r.load, r.g) > 1;
  const judgeQ3 = (r = {}) => validRecord(r) && r.ignited === true && r.accelerationSeen === true
    && r.n === C.engineMax && r.load === C.loads[0] && r.g === C.earthG
    && r.t < burnTime(r.n) && stateAt(r.n, r.load, r.g, r.t).a > stateAt(r.n, r.load, r.g, 0).a;
  function judgeQ4(records = {}) {
    const { before, after, comparisonSeen } = records || {};
    return validRecord(before) && validRecord(after) && comparisonSeen === true
      && after.runId > before.runId && before.n === C.engineMax && after.n === before.n
      && before.g === C.earthG && after.g === before.g
      && before.load === C.loads[1] && after.load === C.loads[2]
      && T0W(after.n, after.load, after.g) < T0W(before.n, before.load, before.g);
  }
  const judgeQ5 = (r = {}) => validRecord(r) && r.ignited === true
    && r.g === C.moonG && r.n === C.engineMin && r.load === C.loads[0]
    && T0W(r.n, r.load, r.g) > 1;
  const judgeQ6 = (r = {}) => validRecord(r) && r.ignited === true
    && r.load === C.loads[2] && r.g === C.earthG
    && r.n === enginesNeeded(r.load, r.g) && T0W(r.n, r.load, r.g) > 1;

  // R1 display-only estimates. Model dimensions are not SI rocket dimensions.
  const SCENE = Object.freeze({
    top: .84, padY: .94, rocketX: -.28, rocketBase: 1.18,
    bodyHeight: .62, radius: .17, noseHeight: .26, liftMax: .9,
    platformWidth: 4.2, platformDepth: .9, towerX: .66, towerTop: 3.08,
    railWidth: 1.1, railX: -.40, railY: .355, railZ: .69,
    boundsMin: Object.freeze([-2.14,.84,-.48]), boundsMax: Object.freeze([2.14,3.12,.51]),
    timeRate: 12, graphSamples: 160,
    graph: Object.freeze({width:768,height:256,left:50,right:718,top:20,bottom:218}),
    instrumentMin: Object.freeze([-1.76,.25,.63]), instrumentMax: Object.freeze([1.76,.84,.80]),
  });
  // Second monotone compression bounds even lunar apex without clipping physical h.
  const sceneLift = h => SCENE.liftMax * heightVis(h) / (1 + heightVis(h));
  const graphTimeRailX = faceX => Math.max(0,Math.min(1,(faceX*SCENE.graph.width-SCENE.graph.left)/(SCENE.graph.right-SCENE.graph.left)));
  const graphFaceX = timeX => (SCENE.graph.left+timeX*(SCENE.graph.right-SCENE.graph.left))/SCENE.graph.width;
  const dialRailAfterTurn = (u,delta) => Math.max(0,Math.min(1,u+delta/(1.5*Math.PI)));
  const sceneSelection = (engineX, loadX, gravityX) => ({
    n: enginesFromRailX(engineX), load: loadFromRailX(loadX), g: gFromRailX(gravityX),
  });
  function sceneValues(n, load, g, t, ignited) {
    const s = stateAt(n, load, g, ignited ? t : 0);
    const T = ignited ? s.T : 0;
    return { ...s, T, a: ignited ? s.a : 0, onPad: !ignited || s.onPad, normal: ignited ? s.normal : s.W,
      fuel: (s.m - C.mDry - load) / C.mProp,
      lift: sceneLift(s.h), flame: flameVis(T) / n,
      loadSize: Math.cbrt(load / C.loads.at(-1)),
    };
  }

  // R2 display estimates: one force cell = one engine; caps live only here.
  const DISPLAY = Object.freeze({forceCap:6, forceUnit:.16, dotCount:9, dotDt:5,
    linearScale:.00012, linearCap:.76, rocketScale:1.45, liftCap:.50,
    smokeCount:96, plumeLength:.30, graphCount:64});
  function forceGlyph(force) {
    const units=Math.max(0,force)/C.engineThrust, shown=Math.min(DISPLAY.forceCap,units);
    return {units,shown,length:shown*DISPLAY.forceUnit,cells:Math.ceil(shown),overflow:units>DISPLAY.forceCap};
  }
  function grammarValues(n,load,g,t,ignited) {
    const s=sceneValues(n,load,g,t,ignited);
    return {...s, thrustGlyph:forceGlyph(s.T),weightGlyph:forceGlyph(s.W),supportGlyph:forceGlyph(s.normal),
      cancelled:forceGlyph(Math.min(s.T,s.W)), surplus:forceGlyph(Math.max(0,s.T-s.W)),
      initialWeight:forceGlyph(m0(load)*g), earthWeight:forceGlyph(s.m*C.earthG),moonWeight:forceGlyph(s.m*C.moonG),
      displayLift:DISPLAY.liftCap*heightVis(s.h)/(1+heightVis(s.h)),
      plumeLength:DISPLAY.plumeLength*flameVis(s.T)/n,brightness:flameVis(s.T)/C.engineMax,
      flow: s.T/thrust(C.engineMax), ratio:s.T/s.W};
  }
  function motionDots(n,load,g,t,ignited) {
    if(!ignited)return [];
    const last=Math.floor(t/DISPLAY.dotDt),first=Math.max(0,last-DISPLAY.dotCount+1);
    const origin=stateAt(n,load,g,first*DISPLAY.dotDt).h;
    return Array.from({length:last-first+1},(_,i)=>{
      const time=(first+i)*DISPLAY.dotDt,s=stateAt(n,load,g,time),linear=(s.h-origin)*DISPLAY.linearScale;
      return {t:time,h:s.h,altitude:DISPLAY.liftCap*heightVis(s.h)/(1+heightVis(s.h)),
        linear:Math.max(-DISPLAY.linearCap,Math.min(DISPLAY.linearCap,linear)),overflow:Math.abs(linear)>DISPLAY.linearCap};
    });
  }
  function grammarHorizon(n,load,g) {
    const landing=stateAt(n,load,g,0).landingT;
    return Number.isFinite(landing)?landing:burnTime(n);
  }
  function grammarTangent(p) {
    const slope=Math.max(-1.8,Math.min(1.8,p.a)),left=Math.max(0,p.x-.055),right=Math.min(.76,p.x+.055);
    return [[left,.26+p.v+(left-p.x)*slope],[right,.26+p.v+(right-p.x)*slope]];
  }
  function grammarCurve(n,load,g,t,ignited,horizon=grammarHorizon(n,load,g)) {
    if(!ignited)return [];
    const times=Array.from({length:DISPLAY.graphCount},(_,i)=>Math.min(t,horizon)*i/(DISPLAY.graphCount-1));
    const tb=burnTime(n);if(tb<=t)times.push(tb-1e-7,tb);
    times.sort((a,b)=>a-b);
    return times.map(time=>{const s=stateAt(n,load,g,time);return {t:time,x:time/horizon*.76,
      T:forceGlyph(s.T).length,W:forceGlyph(s.W).length,normal:forceGlyph(s.normal).length,
      v:Math.max(-.19,Math.min(.19,s.v*.00012)),a:s.a*.00012*horizon,
      break:time===tb};});
  }

  // R5 picture-only compression. Force cells retain their linear engine unit.
  const cardLift = h => 86 * Math.sqrt(Math.max(0,h)/(Math.max(0,h)+24));
  const cardMargin = force => 42 * Math.sqrt(Math.max(0,force)/(Math.max(0,force)+C.engineThrust));
  function cardPrediction(id,c,progress=1) {
    const n=c.n??1,load=c.load??0,g=c.g??C.earthG,p=Math.max(.75,Math.min(1,progress));
    const t=id===1&&c.key==='pad'?burnTime(n):12*p;
    const s=stateAt(n,load,g,t),force=stateAt(n,load,g,id===1?t:0);
    // Misconceptions are dashed hypotheses, not alternative measured records.
    // Their displacement uses the candidate's own thrust/mass, omitting gravity.
    let h=s.h,hypothesis=false;
    if(id===1&&['fast','slow'].includes(c.trace)){
      h=s.T/s.m*(12*p)**2/2*(c.trace==='slow'?.075:1);hypothesis=true;
    }
    if([2,6].includes(id)&&c.trace==='instant'){
      h=force.T/force.m*(12*p)**2/2;hypothesis=true;
    }
    if(c.trace==='pad'||id===1&&c.key==='pad'){h=0;hypothesis=c.trace==='pad';}
    const nozzles=n+(c.extra?1:0),T=c.extra?thrust(nozzles):force.T;
    if(c.extra){h=stateAt(nozzles,load,g,t).h;hypothesis=true;}
    return {s,force,T,W:force.W,h,lift:cardLift(h),nozzles,hypothesis,
      fuel:(s.m-C.mDry-load)/C.mProp,margin:cardMargin(T-force.W),
      baselineMargin:cardMargin(thrust(n)-m0(C.loads[1])*g)};
  }
  function cardMotion(trace) {
    const heights=Array.from({length:6},(_,i)=>stateAt(5,0,C.earthG,i*8).h),end=heights.at(-1);
    // Only the growing series is a measured trajectory; others are hypotheses.
    return heights.map((h,i)=>trace==='equal'?i/5:trace==='shrinking'?1-heights[5-i]/end:h/end);
  }

  return { cardLift, cardMargin, cardPrediction, cardMotion, grammarHorizon, grammarTangent, DISPLAY, forceGlyph, grammarValues, motionDots, grammarCurve, graphTimeRailX, graphFaceX, dialRailAfterTurn, SCENE, sceneLift, sceneSelection, sceneValues, C, RANGE, DETENTS, m0, thrust, T0W, liftoffTime, enginesNeeded,
    burnTime, stateAt, simulate, engineRailX, enginesFromRailX, loadRailX,
    loadFromRailX, gRailX, gFromRailX, heightVis, flameVis,
    judgeQ1, judgeQ2, judgeQ3, judgeQ4, judgeQ5, judgeQ6 };
})();
// ==== END PHYSICS ====
