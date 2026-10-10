// ==== 1 PHYSICS ====
// 수격펌프 물리 모듈. 화면의 모든 숫자·색·문장은 여기서 나온다(순수 함수 + 계산 결과 기록).
// 모델: 구동관 1차원 탄성 수격 — 특성곡선법(MOC). 상류 = 공급 탱크(일정 수두),
//       하류 = 폐수 밸브(열림: 오리피스 / 닫힘) + 송출 체크 밸브(공기실 = 일정 수두 h).
// 기준면: 펌프 밸브 높이. 수두는 모두 m(물기둥), 속도 m/s, 시간 s.
const PHYS = (() => {
  const C = {
    g: 9.81, rho: 1000,
    L: 12, D: 0.05, f: 0.02,     // 구동관: 길이 12 m, 지름 50 mm, 마찰계수
    Kin: 0.5, Kw: 2.0, Kd: 1.5,  // 입구 손실, 폐수 밸브(열림) 손실, 송출 밸브 손실
    a: 1200,                      // 압력파 속도 (강관), m/s
    N: 20,                        // 구간 수 → 노드 21개
    CdAv: 0.003066,               // 폐수 밸브 항력 면적 (400 g 추 → 1.6 m/s에서 닫힘)
    Aseat: 0.002,                 // 폐수 밸브 시트 면적 (재개방 판정)
    tClosing: 0.015,              // 폐수 밸브가 열림 → 닫힘까지 걸리는 시간 (s)
    vBack: 0.06,                  // 송출 체크 밸브가 앉기 전 허용되는 역류 속도 (m/s)
    Hvap: -9.5,                   // 공동 한계 수두 (게이지)
  };
  C.A = Math.PI * C.D * C.D / 4;
  C.dx = C.L / C.N;
  C.dt = C.dx / C.a;
  C.B = C.a / C.g;
  C.R = C.f * C.dx / (2 * C.g * C.D);

  const RANGE = { H: [1, 4], h: [5, 40], m: [0.1, 0.9] };

  // 폐수 밸브가 열린 채 흐를 때의 정상 유속(강체 근사, 해석식)
  const vInf = (H) => Math.sqrt(2 * C.g * H / (1 + C.Kin + C.f * C.L / C.D + C.Kw));
  // 추 무게 m(kg)일 때 밸브를 밀어 올려 닫는 유속: ½ρ·CdAv·v² = m·g
  const closeSpeed = (m) => Math.sqrt(2 * m * C.g / (C.rho * C.CdAv));
  // 닫힌 밸브가 다시 열리는 수두: 시트에 걸리는 압력 힘 < 추 무게
  const reopenHead = (m) => m / (C.rho * C.Aseat);
  // 주코프스키 수격 압력 상승
  const joukowsky = (dv) => C.a * dv / C.g;
  // 강체 근사 한 박자 송출량 (m³)
  const rigidDelivery = (vc, H, h) => C.A * vc * vc * C.L / (2 * C.g * Math.max(h - H, 1e-6));
  // 강체 근사 가속 단계: 시간과 버려지는 부피 (0 → vc)
  function rigidAccel(H, vc) {
    const vi = vInf(H);
    if (vc >= vi) return { t: Infinity, V: Infinity };
    const tau = C.L * vi / (C.g * H);
    const x = Math.atanh(vc / vi);
    return { t: tau * x, V: C.A * vi * tau * Math.log(Math.cosh(x)) };
  }
  // k·V|V| + B·V = c 를 V에 대해 푼다 (k ≥ 0)
  function solveQuad(k, B, c) {
    if (k < 1e-12) return c / B;
    if (c >= 0) return (-B + Math.sqrt(B * B + 4 * k * c)) / (2 * k);
    return (B - Math.sqrt(B * B - 4 * k * c)) / (2 * k);
  }

  // 시뮬레이션: 정지 상태에서 폐수 밸브를 여는 순간(t = 0)부터 한계 주기에 수렴할 때까지.
  // record=true이면 1 ms마다 노드별 수두·속도와 밸브 상태를 기록한다(화면 재생용).
  function simulate(par, opt = {}) {
    const { H, h, m } = par;
    const record = opt.record !== false;
    const maxCycles = opt.maxCycles ?? 14;
    const tMax = opt.tMax ?? 30;
    const every = 2;
    const N = C.N, n1 = N + 1, B = C.B, R = C.R, dt = C.dt;
    const vc = closeSpeed(m), Hre = reopenHead(m);
    const k0 = (1 + C.Kin) / (2 * C.g), kw = C.Kw / (2 * C.g), kd = C.Kd / (2 * C.g);

    let Hn = new Float64Array(n1).fill(H), Vn = new Float64Array(n1);
    let Hp = new Float64Array(n1), Vp = new Float64Array(n1);
    let waste = 1, deliv = 0;
    let psi = 1, closingFrom = -1;   // 폐수 밸브 열림 비율(1 열림 → 0 닫힘), 닫힘 시작 시각
    let lastVw = 0, lastVd = 0;
    // 하류 경계: 수두 hN에서 폐수·송출 유속 (m/s, 구동관 단면 기준)
    const vw = (hN) => psi <= 0 ? 0 : Math.sign(hN) * psi * Math.sqrt(Math.abs(hN) / kw);
    const vd = (hN) => deliv ? Math.sign(hN - h) * Math.sqrt(Math.abs(hN - h) / kd) : 0;
    // C+ 특성선(cp)과 밸브식을 동시에 만족하는 hN (단조 감소 함수 → 이분법)
    function solveEnd(cp) {
      let lo = C.Hvap - 60, hi = Math.max(cp, h) + 60;
      for (let it = 0; it < 48; it++) {
        const mid = 0.5 * (lo + hi);
        if (cp - B * (vw(mid) + vd(mid)) - mid > 0) lo = mid; else hi = mid;
      }
      return 0.5 * (lo + hi);
    }
    let volD = 0, volW = 0;                         // 누적 송출·폐수 부피 (m³)
    const cycles = [];
    let cur = { t0: 0, tClose: NaN, Vd: 0, Vw: 0, peakH: -Infinity, minH: Infinity, vClose: 0 };

    const cap = record ? Math.ceil(tMax / (dt * every)) + 2 : 0;
    const rec = record ? {
      n: 0, dt: dt * every, nodes: n1,
      H: new Float32Array(cap * n1), V: new Float32Array(cap * n1),
      waste: new Uint8Array(cap), deliv: new Uint8Array(cap),
      volD: new Float32Array(cap), volW: new Float32Array(cap),
    } : null;
    const push = () => {
      const i = rec.n++;
      for (let j = 0; j < n1; j++) { rec.H[i * n1 + j] = Hn[j]; rec.V[i * n1 + j] = Vn[j]; }
      rec.waste[i] = waste; rec.deliv[i] = deliv; rec.volD[i] = volD; rec.volW[i] = volW;
    };
    if (record) push();

    let step = 0, t = 0, converged = false, stalled = false, stallReason = '', period = 1;
    const steps = Math.floor(tMax / dt);
    while (step < steps) {
      // 내부 노드
      for (let j = 1; j < N; j++) {
        const cp = Hn[j - 1] + B * Vn[j - 1] - R * Vn[j - 1] * Math.abs(Vn[j - 1]);
        const cm = Hn[j + 1] - B * Vn[j + 1] + R * Vn[j + 1] * Math.abs(Vn[j + 1]);
        let hp = 0.5 * (cp + cm);
        if (hp < C.Hvap) hp = C.Hvap;
        Hp[j] = hp; Vp[j] = (cp - hp) / B;
      }
      // 상류: 공급 탱크 (입구 손실 + 속도 수두)
      {
        const cm = Hn[1] - B * Vn[1] + R * Vn[1] * Math.abs(Vn[1]);
        const v = solveQuad(k0, B, H - cm);
        Vp[0] = v; Hp[0] = cm + B * v;
      }
      // 하류: 펌프 밸브들 (폐수 밸브 부분 열림 + 송출 체크 밸브를 함께 푼다)
      {
        const cp = Hn[N - 1] + B * Vn[N - 1] - R * Vn[N - 1] * Math.abs(Vn[N - 1]);
        if (closingFrom >= 0) psi = Math.max(0, 1 - (t + dt - closingFrom) / C.tClosing);
        // 닫히는 중(부분 열림)일 때만 이분법, 나머지는 닫힌 꼴 해
        const end = (c) => {
          if (psi > 0 && psi < 1) return solveEnd(c);
          if (psi === 1 && !deliv) return c - B * solveQuad(kw, B, c);
          if (psi === 0 && deliv) return c - B * solveQuad(kd, B, c - h);
          if (psi === 0) return c;
          return solveEnd(c);
        };
        let hp = end(cp);
        if (!deliv && hp > h) { deliv = 1; hp = end(cp); }
        if (deliv && vd(hp) < -C.vBack) { deliv = 0; hp = end(cp); }
        if (hp < C.Hvap) hp = C.Hvap;
        lastVw = vw(hp); lastVd = vd(hp);
        Hp[N] = hp; Vp[N] = (cp - hp) / B;
      }
      [Hn, Hp] = [Hp, Hn]; [Vn, Vp] = [Vp, Vn];
      step++; t = step * dt;
      waste = psi > 0 ? 1 : 0;

      const vN = Vn[N], hN = Hn[N];
      if (lastVw > 0) { volW += C.A * lastVw * dt; cur.Vw += C.A * lastVw * dt; }
      if (lastVd !== 0) { volD += C.A * lastVd * dt; cur.Vd += C.A * lastVd * dt; }
      if (hN > cur.peakH) cur.peakH = hN;
      if (hN < cur.minH) cur.minH = hN;

      // 밸브 상태 전이
      if (psi === 1 && closingFrom < 0 && vN >= vc) { closingFrom = t; cur.tClose = t; cur.vClose = vN; }
      else if (psi === 0 && !deliv && hN < Hre) {
        psi = 1; closingFrom = -1; waste = 1;
        cur.tEnd = t; cur.T = t - cur.t0;
        cycles.push(cur);
        cur = { t0: t, tClose: NaN, Vd: 0, Vw: 0, peakH: -Infinity, minH: Infinity, vClose: 0 };
        const k = cycles.length;
        const same = (x, y) => Math.abs(x.T - y.T) < 0.004 * x.T && Math.abs(x.Vd - y.Vd) < 0.004 * Math.max(x.Vd, 1e-9);
        if (k >= 3 && same(cycles[k - 1], cycles[k - 2])) { converged = true; period = 1; }
        else if (k >= 5 && same(cycles[k - 1], cycles[k - 3]) && same(cycles[k - 2], cycles[k - 4])) { converged = true; period = 2; }
      }
      if (record && step % every === 0) push();
      if (converged || cycles.length >= maxCycles) break;
      // 정지 판정: 밸브가 열린 채 닫히지 않음 / 닫힌 채 다시 열리지 않음
      if (closingFrom < 0 && t - cur.t0 > 8) { stalled = true; stallReason = 'noclose'; break; }
      if (psi === 0 && !deliv && t - cur.tClose > 3) { stalled = true; stallReason = 'noreopen'; break; }
    }
    if (record && step % every !== 0) push();
    if (!converged && cycles.length >= 2) period = 2;   // 수렴 못 하면 두 박자 묶음으로 반복(이음매가 덜 튄다)

    const last = cycles[cycles.length - 1];
    let limit;
    if (stalled || !last) {
      const vi = vInf(H);
      limit = {
        stalled: true, reason: stallReason || 'noclose', T: Infinity, bpm: 0, period: 1,
        q: 0, Q: stallReason === 'noreopen' ? 0 : C.A * vi * 60000, eta: 0,
        Vd: 0, Vw: 0, VdBeat: 0, VwBeat: 0, peakH: stallReason === 'noreopen' ? (last ? last.peakH : h) : Hn[N], minH: Hn[N],
        vClose: 0, vMax: Math.max(...Array.from(Vn)), t0: t, tEnd: t,
      };
    } else {
      // 한계 주기 = 마지막 period개 박자 묶음 (주기 2 진동이면 긴 박자·짧은 박자 한 쌍)
      const grp = cycles.slice(-period);
      const T = last.tEnd - grp[0].t0;
      const Vd = grp.reduce((s, c) => s + c.Vd, 0), Vw = grp.reduce((s, c) => s + c.Vw, 0);
      const q = Vd / T * 60000, Q = Vw / T * 60000;   // L/분
      limit = {
        stalled: false, period, T, beatT: T / period, bpm: 60 * period / T, q, Q,
        eta: (q * h) / ((Q + q) * H), Vd, Vw, VdBeat: Vd / period, VwBeat: Vw / period,
        peakH: Math.max(...grp.map((c) => c.peakH)), minH: Math.min(...grp.map((c) => c.minH)),
        vClose: grp.reduce((s, c) => s + c.vClose, 0) / period,
        t0: grp[0].t0, tEnd: last.tEnd, tClose: last.tClose,
      };
    }
    return { par: { H, h, m }, vc, Hre, cycles, limit, converged, stalled, rec, tEnd: t };
  }

  // 녹화된 시뮬레이션의 시각 t 상태 (t > 기록 끝이면 마지막 한계 주기를 반복 재생)
  function loopTime(sim, t) {
    const L = sim.limit;
    if (t <= sim.tEnd || L.stalled) return Math.min(t, sim.tEnd);
    const T = L.T;
    return L.t0 + ((t - L.t0) % T);
  }
  function sampleAt(sim, t, out) {
    const rec = sim.rec, n1 = rec.nodes;
    const tt = loopTime(sim, t);
    const f = tt / rec.dt;
    const i = Math.min(Math.floor(f), rec.n - 2), w = Math.min(Math.max(f - i, 0), 1);
    out.H = out.H || new Float32Array(n1); out.V = out.V || new Float32Array(n1);
    for (let j = 0; j < n1; j++) {
      out.H[j] = rec.H[i * n1 + j] * (1 - w) + rec.H[(i + 1) * n1 + j] * w;
      out.V[j] = rec.V[i * n1 + j] * (1 - w) + rec.V[(i + 1) * n1 + j] * w;
    }
    const k = w < 0.5 ? i : i + 1;
    out.waste = rec.waste[k]; out.deliv = rec.deliv[k];
    // 누적 부피: 반복 구간이면 이전 주기 수만큼 더한다
    const L = sim.limit;
    const laps = !L.stalled && t > sim.tEnd ? Math.floor((t - L.t0) / L.T) : 0;
    out.volD = rec.volD[i] * (1 - w) + rec.volD[i + 1] * w + laps * L.Vd;
    out.volW = rec.volW[i] * (1 - w) + rec.volW[i + 1] * w + laps * L.Vw;
    out.tSim = tt;
    // 주기 안 위치와 단계
    out.phase = phaseOf(sim, tt, out);
    return out;
  }
  // 단계: 'accel' | 'hammer' | 'deliver' | 'recoil' | 'stall'
  function phaseOf(sim, tt, s) {
    if (sim.limit.stalled && tt >= sim.tEnd - 1e-6) return 'stall';
    const c = cycleAt(sim, tt);
    const sinceClose = c && Number.isFinite(c.tClose) ? tt - c.tClose : -1;
    if (sinceClose >= 0 && sinceClose < C.tClosing + 0.03) return 'hammer';
    if (s.waste) return 'accel';
    return s.deliv ? 'deliver' : 'recoil';
  }
  function cycleAt(sim, tt) {
    const cs = sim.cycles;
    for (let i = cs.length - 1; i >= 0; i--) if (tt >= cs[i].t0) return cs[i];
    return null;
  }

  // 양수 높이 h에 따른 양수량·효율 곡선 (화면 B). 한 점씩 계산해 프레임을 나눈다.
  function sweepPoint(H, h, m) {
    const s = simulate({ H, h, m }, { record: false, maxCycles: 10, tMax: 25 });
    return { h, q: s.limit.q, eta: s.limit.eta, stalled: s.limit.stalled };
  }

  // 화면 표시용 높이 축척: 제곱근 압축 (부호 유지). 1 m → 0.23, 40 m → 1.45 (단위: 장면 m)
  const HEIGHT_K = 0.23;
  const visHeight = (head) => Math.sign(head) * HEIGHT_K * Math.sqrt(Math.abs(head));
  const headFromVis = (y) => Math.sign(y) * (y / HEIGHT_K) ** 2;

  // 단위 변환
  const headToBar = (hd) => hd * C.rho * C.g / 1e5;

  return { C, RANGE, vInf, closeSpeed, reopenHead, joukowsky, rigidDelivery, rigidAccel,
    simulate, sampleAt, loopTime, cycleAt, sweepPoint, visHeight, headFromVis, headToBar };
})();
// ==== END PHYSICS ====
