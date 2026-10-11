// ==== 1 PHYSICS ====
// 힘의 작용: 매달기대(무게·탄성력·부력)와 끌기대(당기는 힘·마찰력·수직항력·알짜힘)의 순수 함수 모듈.
// 모든 길이는 콘솔 상판(TOP) 기준 m, 힘은 N, 질량은 kg. 화면의 숫자·위치·화살표 길이는 전부 여기서 나온다.
const PHYS = (() => {
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const C = {
    kHang: 20,          // 매달기 용수철저울 용수철 상수 N/m (눈금 0~5 N, 최대 25 cm 늘어남)
    hangMax: 5,
    kTrack: 40,         // 끌기 저울 N/m (눈금 0~6 N, 최대 15 cm)
    trackMax: 6,
    arrow: 0.045,       // 힘 화살표 길이 m/N (과장 스케일: 표현용)
    weightMass: 0.05,   // 황동 추 한 개 50 g
    brass: 8400,        // 황동 밀도 kg/m³
    weightR: 0.02,
    objR: 0.025, objV: 100e-6,          // 원기둥 100 cm³, 반지름 2.5 cm
    M0: 0.30,           // 나무 도막 질량 kg
    loadMass: 0.2,      // 짐 추 한 개 200 g
    nMax: 5, loadMax: 3,
    block: { w: 0.10, h: 0.06, d: 0.08 },
    load: { r: 0.022, h: 0.0157 },
    track: { xmin: -0.10, xmax: 1.00, x0: 0.45, y: 0.025 },
    beaker: { R: 0.07, glass: 0.006, water: 0.13, height: 0.22 },
    hang: { casingTop: 0.84, casing: 0.30, hookY0: 0.51, string: 0.04 },
    jack: { min: 0.03, max: 0.31 },
    gMin: 1.0, gMax: 10.0,
  };
  const OBJECTS = {
    weights: { density: 8400 },
    al: { mass: 0.27, density: 2700 },
    wood: { mass: 0.06, density: 600 },
  };
  const FLUIDS = { water: 1000, brine: 1200, oil: 920 };
  const SURFACES = { glass: { mus: 0.25, muk: 0.18 }, wood: { mus: 0.45, muk: 0.35 }, sand: { mus: 0.80, muk: 0.62 } };
  const PLANETS = [{ id: 'moon', g: 1.6 }, { id: 'mars', g: 3.7 }, { id: 'earth', g: 9.8 }];
  const RANGE = { g: [C.gMin, C.gMax], n: [0, C.nMax], jack: [C.jack.min, C.jack.max], F1: [0, C.trackMax], F2: [0, C.trackMax], load: [0, C.loadMax] };

  const planetOf = (g) => PLANETS.reduce((b, p) => (Math.abs(p.g - g) < Math.abs(b.g - g) ? p : b)).id;
  const nearPlanet = (g) => PLANETS.find((p) => Math.abs(p.g - g) < 0.05);

  // 매단 물체의 질량·부피·모양
  function hangObject(obj, n) {
    if (obj === 'weights') {
      const m = n * C.weightMass, V = m / C.brass, A = Math.PI * C.weightR ** 2;
      return { obj, m, V, A, r: C.weightR, h: V / A, density: C.brass, empty: n === 0 };
    }
    const o = OBJECTS[obj], A = Math.PI * C.objR ** 2;
    return { obj, m: o.mass, V: C.objV, A, r: C.objR, h: C.objV / A, density: o.mass / C.objV, empty: false };
  }

  // 매달기 평형: 줄 장력(= 탄성력 = 저울 눈금) T, 잠긴 깊이 s를 함께 푼다.
  //   T = W − ρgAs,  늘어남 x = T/k,  물체 바닥 y_b = y_b0 − x,  수면 y_w = y_w0 + A·s/A_b (물체가 밀어낸 만큼 수면 상승)
  //   s = clamp(y_w − y_b, 0, h)  →  s·(1 − A/A_b + ρgA/k) = y_w0 − y_b0 + W/k  (구간별 선형이라 닫힌 해)
  function hang(p) {
    const o = hangObject(p.obj, p.n), g = p.g, rho = FLUIDS[p.fluid], k = C.kHang;
    const Ab = Math.PI * C.beaker.R ** 2;
    const W = o.m * g;
    const yTop0 = C.hang.hookY0 - C.hang.string, yb0 = yTop0 - o.h;
    const beakerY = p.jack, yw0 = beakerY + C.beaker.glass + C.beaker.water;
    if (o.empty) return { ...o, g, rho, W: 0, B: 0, T: 0, x: 0, s: 0, frac: 0, Vsub: 0, yb: yb0, ytop: yTop0, yw: yw0, beakerY, floating: false, slack: true, over: false, inFluid: false };
    let s, T, x, yb, yw, floating = false;
    const D = yw0 - yb0 + W / k;
    s = clamp(D / (1 - o.A / Ab + rho * g * o.A / k), 0, o.h);
    T = W - rho * g * o.A * s;
    if (T < 0) {
      // 뜬다: 줄이 느슨해지고 부력 = 무게
      floating = true; T = 0;
      s = Math.min(W / (rho * g * o.A), o.h);
      yw = yw0 + o.A * s / Ab; yb = yw - s; x = 0;
    } else {
      x = T / k; yb = yb0 - x; yw = yw0 + o.A * s / Ab;
    }
    const B = rho * g * o.A * s;
    return { ...o, g, rho, W, B, T, x, s, frac: o.h > 0 ? s / o.h : 0, Vsub: o.A * s, yb, ytop: yb + o.h, yw, beakerY, floating, slack: floating, over: T > C.hangMax + 1e-9, inFluid: s > 1e-5 };
  }
  // 수조를 올릴 수 있는 한계: 물체가 수조 바닥에 닿기 1 cm 전, 뜬 물체가 저울 고리에 닿기 2 cm 전, 수조 테두리가 저울 몸통에 닿기 전
  function jackMax(p) {
    const ok = (j) => {
      const r = hang({ ...p, jack: j });
      if (r.empty) return j + C.beaker.height <= C.hang.casingTop - C.hang.casing - 0.01;
      if (r.yb - (j + C.beaker.glass) < 0.01) return false;
      if (r.floating && r.ytop > C.hang.hookY0 - C.hang.string + 0.02) return false;
      return j + C.beaker.height <= C.hang.casingTop - C.hang.casing - 0.01;
    };
    if (ok(C.jack.max)) return C.jack.max;
    let lo = C.jack.min, hi = C.jack.max;
    for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (ok(mid)) lo = mid; else hi = mid; }
    return lo;
  }
  // 완전히 잠기는 최소 수조 높이 (투어 안내·검증용)
  function jackForFull(p) {
    const jm = jackMax(p);
    let lo = C.jack.min, hi = jm;
    if (hang({ ...p, jack: hi }).frac < 0.999) return null;
    for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (hang({ ...p, jack: mid }).frac >= 0.999) hi = mid; else lo = mid; }
    return hi;
  }

  // ---- 끌기대 ----
  const trackMass = (load) => C.M0 + load * C.loadMass;
  // 도막이 받는 힘들 (오른쪽 +). st = {x, v}
  function trackForces(st, p) {
    const M = trackMass(p.load), N = M * p.g, sf = SURFACES[p.surface];
    const Fa = p.same ? p.F1 + p.F2 : p.F2 - p.F1;
    const fsMax = sf.mus * N, fk = sf.muk * N;
    let f = 0, bump = 0, mode;
    const atMin = st.x <= C.track.xmin + 1e-6, atMax = st.x >= C.track.xmax - 1e-6;
    if (Math.abs(st.v) < 1e-6) {
      if (Math.abs(Fa) <= fsMax + 1e-9) { f = -Fa; mode = Fa === 0 ? 'rest' : 'held'; }
      else { f = -Math.sign(Fa) * fk; mode = 'slide'; }
    } else { f = -Math.sign(st.v) * fk; mode = 'slide'; }
    let net = Fa + f;
    // 범퍼: 벽이 미는 힘이 알짜힘을 0으로 만든다
    if (Math.abs(st.v) < 1e-6 && ((atMin && net < 0) || (atMax && net > 0))) { bump = -net; net = 0; mode = 'bump'; }
    if (mode === 'held' || mode === 'rest') {
      // 평형인 이유를 구분: 두 힘이 서로 상쇄 vs 마찰이 버팀
      if (Fa === 0 && p.F1 > 0 && p.F2 > 0 && !p.same) mode = 'balance';
    }
    return { M, N, W: M * p.g, Fa, f, fsMax, fk, bump, net, a: net / M, mode, mus: sf.mus, muk: sf.muk };
  }
  // 시간 적분 (반암시적 오일러 + 속도 0 통과 시 정지 판정). 이벤트를 돌려준다.
  function trackStep(st, p, dt) {
    const ev = [];
    const sub = Math.max(1, Math.ceil(dt / 0.002)), h = dt / sub;
    for (let i = 0; i < sub; i++) {
      const wasStatic = Math.abs(st.v) < 1e-6;
      const F = trackForces(st, p);
      if (wasStatic && F.mode === 'slide') ev.push({ type: 'start', Fa: Math.abs(F.Fa), fsMax: F.fsMax, N: F.N, surface: p.surface, load: p.load, g: p.g, same: p.same });
      if (F.mode !== 'slide') { st.v = 0; continue; }
      const v0 = st.v;
      st.v += F.a * h;
      if (v0 !== 0 && Math.sign(st.v) !== Math.sign(v0)) {     // 마찰로 멈춤 → 정지 판정은 다음 단계에서
        st.v = 0; ev.push({ type: 'stop' }); continue;
      }
      st.x += st.v * h;
      if (st.x < C.track.xmin) { st.x = C.track.xmin; if (st.v < 0) { ev.push({ type: 'bump', v: st.v }); st.v = 0; } }
      if (st.x > C.track.xmax) { st.x = C.track.xmax; if (st.v > 0) { ev.push({ type: 'bump', v: st.v }); st.v = 0; } }
    }
    return ev;
  }

  // 훅 법칙 직선 맞춤 (원점 통과): k = Σ F·x / Σ x²
  function fitK(pts) {
    let sfx = 0, sxx = 0;
    for (const q of pts) { sfx += q.F * q.x; sxx += q.x * q.x; }
    return sxx > 0 ? sfx / sxx : NaN;
  }

  return { C, OBJECTS, FLUIDS, SURFACES, PLANETS, RANGE, planetOf, nearPlanet, hangObject, hang, jackMax, jackForFull, trackMass, trackForces, trackStep, fitK };
})();
// ==== END PHYSICS ====
