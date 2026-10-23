// ==== 1 PHYSICS ====
const PHYS = (() => {
  const C = Object.freeze({
    R: 6.371e6, T0: 86164.1, day: 86400, Y: 365.25 * 86400, sound: 343,
    // 길이 m, 시간 s, 속도 m/s. 위도 API만 도를 쓴다.
    Pmax: 365 * 86400, P_stop: Infinity, phiMax: 90, deg: Math.PI / 180,
    equatorTolerance: 1, highLatitude: 60, questPeriod: 30 * 86400,
    designSpeed: 27.78, roundoff: 8 * Number.EPSILON,
    periodRailEnd: 0.9, stopRailThreshold: 0.95,
    // 극 부근에 레일 폭을 더 배정해 안전 위도를 손으로 맞춘다.
    phiKnots: Object.freeze([0, 60, 85, 90]),
    phiOffsets: Object.freeze([0, 0.3, 0.4, 0.5]),
    phiDetents: Object.freeze([-90, -60, -30, 0, 30, 60, 90]),
    BENCH: Object.freeze([
      Object.freeze({ id: 'walk', speed: 1.4 }), Object.freeze({ id: 'bicycle', speed: 5 }),
      Object.freeze({ id: 'car', speed: 30 }), Object.freeze({ id: 'train', speed: 85 }),
      Object.freeze({ id: 'airplane', speed: 250 }), Object.freeze({ id: 'sound', get speed() { return C.sound; } }),
    ]),
  });
  const RANGE = Object.freeze({ phi: Object.freeze([-C.phiMax, C.phiMax]), P: Object.freeze([C.T0, C.Pmax]) });
  const BENCH = C.BENCH;
  const v = (phi, P) => Math.abs(phi) === C.phiMax ? 0 : 2 * Math.PI * C.R / P * Math.cos(phi * C.deg);
  const mach = speed => speed / C.sound;
  const phiSafe = vMax => Math.acos(Math.min(1, Math.max(0, vMax / v(0, C.T0)))) / C.deg;

  // 동주기에서는 주기가 없고, 완전 정지는 별도 상태다. 유한 주기를 포화시키지 않는다.
  function solarState(P) {
    if (P === C.P_stop) return 'stopped';
    if (!Number.isFinite(P) || P <= 0) return 'empty';
    return P === C.Y ? 'synchronous' : 'cycling';
  }
  function solarDay(P) {
    const state = solarState(P);
    if (state === 'stopped') return C.Y;
    if (state !== 'cycling') return null;
    return 1 / Math.abs(1 / P - 1 / C.Y);
  }

  function phiRailX(phi) {
    const a = Math.min(C.phiMax, Math.abs(phi));
    const i = a <= C.phiKnots[1] ? 0 : a <= C.phiKnots[2] ? 1 : 2;
    const offset = C.phiOffsets[i] + (a - C.phiKnots[i]) / (C.phiKnots[i + 1] - C.phiKnots[i])
      * (C.phiOffsets[i + 1] - C.phiOffsets[i]);
    return 0.5 + Math.sign(phi) * offset;
  }
  function phiFromRailX(x) {
    const centered = Math.min(1, Math.max(0, x)) - 0.5, a = Math.abs(centered);
    const i = a <= C.phiOffsets[1] ? 0 : a <= C.phiOffsets[2] ? 1 : 2;
    return Math.sign(centered) * (C.phiKnots[i] + (a - C.phiOffsets[i])
      / (C.phiOffsets[i + 1] - C.phiOffsets[i]) * (C.phiKnots[i + 1] - C.phiKnots[i]));
  }
  const periodRailX = P => P === C.P_stop ? 1 : C.periodRailEnd
    * Math.log(Math.min(C.Pmax, Math.max(C.T0, P)) / C.T0) / Math.log(C.Pmax / C.T0);
  const periodFromRailX = x => x >= C.stopRailThreshold ? C.P_stop
    : C.T0 * (C.Pmax / C.T0) ** (Math.min(C.periodRailEnd, Math.max(0, x)) / C.periodRailEnd);
  const DETENTS = Object.freeze({
    phi: Object.freeze(C.phiDetents.map(phi => Object.freeze({ phi, x: phiRailX(phi) }))),
    P: Object.freeze([C.T0, C.Pmax, C.P_stop].map(P => Object.freeze({ P, x: periodRailX(P) }))),
  });

  const validPhi = phi => Number.isFinite(phi) && Math.abs(phi) <= C.phiMax;
  // 측정 경계에서만 검사한다. 실행 번호는 호출자가 증가시키며 빈 관측은 null이다.
  function stopMeasurement({ runId, phi, mode, executed }) {
    if (!Number.isSafeInteger(runId) || runId < 1 || !validPhi(phi) || mode !== 'sudden' || executed !== true) return null;
    return { runId, phi, relativeSpeed: v(phi, C.T0) };
  }
  const judgeQ1 = ({ phi, speedSeen, benchSeen }) => validPhi(phi)
    && Math.abs(phi) <= C.equatorTolerance && speedSeen === true && benchSeen === true;
  const judgeQ2 = ({ fromPhi, phi, decreaseSeen }) => validPhi(fromPhi) && validPhi(phi)
    && Math.abs(fromPhi) <= C.equatorTolerance && Math.abs(phi) >= C.highLatitude
    && v(phi, C.T0) < v(fromPhi, C.T0) && decreaseSeen === true;
  const judgeQ3 = ({ runId, phi, mode, measurement, relativeSeen }) => {
    const expected = stopMeasurement({ runId, phi, mode, executed: true });
    return expected !== null && measurement != null && measurement.runId === expected.runId
      && measurement.phi === expected.phi && measurement.relativeSpeed === expected.relativeSpeed && relativeSeen === true;
  };
  const judgeQ4 = ({ P, mode, daySeen }) => mode === 'gradual' && daySeen === true
    && Number.isFinite(P) && P >= C.questPeriod && P <= C.Pmax && solarDay(P) >= solarDay(C.questPeriod);
  const judgeQ5 = ({ P, mode }) => mode === 'gradual' && P === C.P_stop && solarDay(P) === C.Y;
  // 포함 경계의 계산 반올림만 허용한다.
  const judgeQ6 = ({ phi }) => validPhi(phi) && v(phi, C.T0) <= C.designSpeed * (1 + C.roundoff);

  return { C, RANGE, BENCH, DETENTS, v, mach, solarDay, solarState, phiSafe,
    phiRailX, phiFromRailX, periodRailX, periodFromRailX, stopMeasurement,
    judgeQ1, judgeQ2, judgeQ3, judgeQ4, judgeQ5, judgeQ6 };
})();
// R1 pure presentation mapping. SI physics above is unchanged.
// Deliberate tabletop exaggeration: 0.65 scene units per Earth radius,
// sound speed = 0.8 scene units, local tangent shown for one normalized beat.
// Playback compresses the present sidereal cycle to 12 display seconds;
// at complete stop it compresses the orbital year instead. No deceleration force.
Object.assign(PHYS, (() => {
  const SCENE = Object.freeze({
    radius: 0.65, center: Object.freeze([0, 1.95, 0]), top: 0.96,
    ball: 0.055, pinReach: 0.74, soundLength: 0.8, cycleSeconds: 12,
    sunRadius: 1.25, sunBall: 0.13, sunGuard: 0.18, arrowHead: 0.075, tangentSeconds: 1,
    bounds: Object.freeze([Object.freeze([-1.5, 0.96, -1.5]), Object.freeze([1.5, 2.86, 1.5])]),
  });
  const scenePoint = (phi, angle, radius = SCENE.radius) => {
    const a = phi * PHYS.C.deg, r = Math.abs(phi) === 90 ? 0 : radius * Math.cos(a);
    return [r * Math.sin(angle), SCENE.center[1] + radius * Math.sin(a), r * Math.cos(angle)];
  };
  const speedLength = speed => speed / PHYS.C.sound * SCENE.soundLength;
  const spinAngle = (seconds, P) => P === Infinity ? 0 : seconds / SCENE.cycleSeconds * Math.PI * 2 * PHYS.C.T0 / P;
  const physicalSeconds = (seconds, P) => seconds * (P === Infinity ? PHYS.C.Y : PHYS.C.T0) / SCENE.cycleSeconds;
  const sunAngle = (seconds, P) => physicalSeconds(seconds, P) / PHYS.C.Y * Math.PI * 2;
  const tangentPoint = (phi, angle, speed, progress) => {
    const p = scenePoint(phi, angle, SCENE.pinReach);
    const d = speedLength(speed) * Math.min(1, Math.max(0, progress));
    return [p[0] + Math.cos(angle) * d, p[1], p[2] - Math.sin(angle) * d];
  };
  const dayGraphY = P => {
    const d = PHYS.solarDay(P);
    return d === null ? null : Math.log1p(d / PHYS.C.day) / Math.log1p(PHYS.solarDay(PHYS.C.Pmax) / PHYS.C.day);
  };
  // Conservative, round envelope of every reachable tabletop state. Unlike an
  // enclosing cuboid it does not pretend there are objects in empty corners.
  const sceneEnvelope = () => {
    const points = [];
    for (let i = 0; i <= 12; i++) {
      const phi = -90 + i * 15, a = phi * PHYS.C.deg;
      const radius = Math.hypot(SCENE.pinReach, speedLength(PHYS.v(0, PHYS.C.T0))) * Math.cos(a)
        + SCENE.arrowHead + SCENE.ball;
      for (let j = 0; j < 24; j++) {
        const angle = j / 24 * Math.PI * 2;
        points.push([radius * Math.sin(angle), SCENE.center[1] + SCENE.pinReach * Math.sin(a), radius * Math.cos(angle)]);
      }
    }
    for (const y of [SCENE.center[1] - 0.54, SCENE.center[1] + 0.18 + SCENE.sunGuard])
      for (let j = 0; j < 48; j++) {
        const angle = j / 48 * Math.PI * 2, r = SCENE.sunRadius + SCENE.sunGuard + 0.02;
        points.push([Math.sin(angle) * r, y, Math.cos(angle) * r]);
      }
    points.push([0, SCENE.top, 0], [-0.26, 2.83, 0.09], [0.26, 2.83, 0.09]);
    return points;
  };
  return { SCENE, sceneEnvelope, scenePoint, speedLength, spinAngle, physicalSeconds, sunAngle, tangentPoint, dayGraphY };
})());
// R2 display choices, not additional physical predictions. Fixed temporal sampling,
// sound-speed units and common linear scale; overflow is explicit, never resampled.
Object.assign(PHYS, (() => {
  const GRAMMAR = Object.freeze({ fade: .3, cap: 30, unit: PHYS.SCENE.soundLength, maxLength: 1.12,
    dotStep: 10800, traceStep: .05, traceCap: 20, ballScale: 1.5,
    lensRadius: .57, lineWidth: .046, dotRadius: .012, recordCap: 6 });
  const quantity = speed => {
    const units = PHYS.mach(Math.max(0,speed)), raw = PHYS.speedLength(Math.max(0,speed));
    return { units, length: Math.min(GRAMMAR.maxLength,raw), full: Math.min(GRAMMAR.cap,Math.floor(units),Math.floor(GRAMMAR.maxLength/GRAMMAR.unit)),
      fraction: units-Math.floor(units), clipped: raw>GRAMMAR.maxLength || units>GRAMMAR.cap };
  };
  const latitudeSection = phi => ({radius: PHYS.SCENE.radius*Math.cos(phi*PHYS.C.deg),
    height: PHYS.SCENE.radius*Math.sin(phi*PHYS.C.deg), speed: PHYS.v(phi,PHYS.C.T0)});
  const daySamples = P => {
    const period=PHYS.solarDay(P); if(period===null)return {points:[],clipped:false,total:0};
    const total=Math.ceil(period/GRAMMAR.dotStep), count=Math.min(GRAMMAR.cap,total);
    return {total,clipped:total>count,points:Array.from({length:count},(_,i)=>{
      const seconds=i*GRAMMAR.dotStep, angle=2*Math.PI*seconds/period;
      return {seconds,angle,bright:Math.cos(angle)>=0,slot:[(i%10-4.5)*.06,-.36-Math.floor(i/10)*.06]};
    })};
  };
  const relativeArcs = P => {
    const time=GRAMMAR.dotStep, spin=P===Infinity?0:2*Math.PI*time/P, orbit=2*Math.PI*time/PHYS.C.Y;
    return {spin,orbit,relative:spin-orbit};
  };
  const traceSamples = (phi,angle,speed,elapsed,lite=false) => Array.from({length:GRAMMAR.traceCap/(lite?2:1)+1},(_,i)=>{
    const seconds=i*GRAMMAR.traceStep*(lite?2:1);
    return {seconds,visible:seconds<=elapsed,point:PHYS.tangentPoint(phi,angle,speed,seconds/PHYS.SCENE.tangentSeconds)};
  });
  const presentationEnvelope = () => {
    const points=PHYS.sceneEnvelope();
    // Console, enlarged bead, grammar cards and fixed comparison rack included.
    for(const x of [-1.77,1.77])for(const y of [.08,2.86])for(const z of [-.65,.9])points.push([x,y,z]);
    return points;
  };
  return {GRAMMAR,quantity,latitudeSection,daySamples,relativeArcs,traceSamples,presentationEnvelope};
})());
// ==== END PHYSICS ====
