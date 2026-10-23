// ==== 1 PHYSICS ====
// 구형·비자전의 표면 중력. 일정 점프 초속도와 표시 압축은 추정이다.
const PHYS = (() => {
  const C = Object.freeze({
    G: 6.674e-11, // m³/(kg·s²)
    standardG: 9.81, // m/s², 비율 계산에는 쓰지 않는다.
    massPerWeight: 8, // kg
    jumpSpeed: 2.8, // m/s, 추정
    minWeights: 1, maxWeights: 5, defaultWeights: 5,
    springLimit: 30, // 지구 추 하나의 무게를 한 마디로 센다.
    jumpViewMin: 0.02, jumpViewMax: 3, // m, 추정: 표시 높이만 제한한다.
    similarMin: 0.85, similarMax: 1.15,
    ids: Object.freeze({ earth: 0, moon: 1, pluto: 2, mars: 3, venus: 4,
      saturn: 5, jupiter: 6, sun: 7, neutron: 8, space: 9 }),
    bodies: Object.freeze([
      { id: 'earth', name: '지구', kind: 'planet', mass: 5.972e24, radius: 6.371e6 },
      { id: 'moon', name: '달', kind: 'satellite', mass: 7.342e22, radius: 1.737e6 },
      { id: 'pluto', name: '명왕성', kind: 'dwarf', mass: 1.303e22, radius: 1.1883e6 },
      { id: 'mars', name: '화성', kind: 'planet', mass: 6.417e23, radius: 3.3895e6 },
      { id: 'venus', name: '금성', kind: 'planet', mass: 4.867e24, radius: 6.0518e6 },
      { id: 'saturn', name: '토성', kind: 'planet', mass: 5.683e26, radius: 5.8232e7 },
      { id: 'jupiter', name: '목성', kind: 'planet', mass: 1.898e27, radius: 6.9911e7 },
      { id: 'sun', name: '태양', kind: 'star', mass: 1.989e30, radius: 6.957e8 },
      { id: 'neutron', name: '중성자별', kind: 'compact', mass: 2.7846e30, radius: 1.2e4 },
      { id: 'space', name: '우주 공간', kind: 'space', mass: null, radius: null },
    ].map(Object.freeze)), // mass: kg, radius: m
  });
  const BODIES = C.bodies;
  const RANGE = Object.freeze({ body: Object.freeze([0, BODIES.length - 1]),
    nWeights: Object.freeze([C.minWeights, C.maxWeights]) });
  const validBody = i => Number.isInteger(i) && i >= RANGE.body[0] && i <= RANGE.body[1];
  const mass = n => Number.isInteger(n) && n >= C.minWeights && n <= C.maxWeights
    ? n * C.massPerWeight : null;
  function g(i) {
    if (!validBody(i)) return null;
    if (i === C.ids.space) return 0;
    return C.G * BODIES[i].mass / BODIES[i].radius ** 2;
  }
  const gRatio = i => validBody(i) ? g(i) / g(C.ids.earth) : null;
  function weight(i, nWeights) {
    const m = mass(nWeights), gravity = g(i);
    return m === null || gravity === null ? null : m * gravity;
  }
  function jumpHeight(i) {
    const gravity = g(i);
    return gravity === null || gravity === 0 ? null : C.jumpSpeed ** 2 / (2 * gravity);
  }
  function balanceState(i, nWeights, nReference) {
    const left = weight(i, nWeights), right = weight(i, nReference);
    if (left === null || right === null) return null;
    if (g(i) === 0) return 'unloaded';
    return left === right ? 'balanced' : 'tilted';
  }
  function springState(i, nWeights) {
    const force = weight(i, nWeights);
    if (force === null) return null;
    const marks = force / weight(C.ids.earth, C.minWeights);
    const broken = marks > C.springLimit;
    return { marks, shownMarks: Math.min(marks, C.springLimit), broken,
      exaggerated: broken || i === C.ids.sun || i === C.ids.neutron };
  }
  function jumpVisual(i) {
    if (!validBody(i)) return null;
    const height = jumpHeight(i);
    if (height === null) return { height: null, shownHeight: null, event: 'no-apex', exaggerated: false };
    const shownHeight = Math.max(C.jumpViewMin, Math.min(C.jumpViewMax, height));
    return { height, shownHeight, event: 'apex',
      exaggerated: height !== shownHeight || i === C.ids.sun || i === C.ids.neutron };
  }
  function jumpTrial(i, nWeights, runId) {
    if (!validBody(i) || mass(nWeights) === null || !Number.isSafeInteger(runId) || runId < 1) return null;
    const height = jumpHeight(i);
    return { runId, i, nWeights, height, event: height === null ? 'no-apex' : 'apex' };
  }

  const railX = n => Number.isFinite(n) && n >= C.minWeights && n <= C.maxWeights
    ? (n - C.minWeights) / (C.maxWeights - C.minWeights) : null;
  const weightsFromRailX = x => Number.isFinite(x)
    ? Math.round(C.minWeights + Math.max(0, Math.min(1, x)) * (C.maxWeights - C.minWeights)) : null;
  const bodyRailX = i => validBody(i) ? i / RANGE.body[1] : null;
  const bodyFromRailX = x => Number.isFinite(x)
    ? Math.round(Math.max(0, Math.min(1, x)) * RANGE.body[1]) : null;
  const DETENTS = Object.freeze({
    body: Object.freeze(BODIES.map((_, i) => Object.freeze({ i, x: bodyRailX(i) }))),
    nWeights: Object.freeze(Array.from({ length: C.maxWeights - C.minWeights + 1 }, (_, i) => {
      const nWeights = C.minWeights + i;
      return Object.freeze({ nWeights, x: railX(nWeights) });
    })),
  });

  const judgeQ1 = ({ i, nWeights } = {}) => i === C.ids.moon && weight(i, nWeights) > 0;
  const judgeQ2 = ({ visited = [], nWeights } = {}) => Array.isArray(visited)
    && [C.ids.earth, C.ids.moon].every(i => visited.includes(i)
      && balanceState(i, nWeights, nWeights) === 'balanced');
  const judgeQ3 = ({ i } = {}) => validBody(i) && BODIES[i].kind === 'planet'
    && BODIES.every((body, j) => body.kind !== 'planet' || g(i) >= g(j));
  const judgeQ4 = ({ i, nWeights, breakSeen } = {}) => i === C.ids.sun
    && springState(i, nWeights)?.broken === true && breakSeen === true;
  function judgeQ5({ runs = [] } = {}) {
    if (!Array.isArray(runs)) return false;
    // 같은 실행 번호에 서로 다른 조건이 붙으면 그 번호 전체를 제외한다.
    const trials = runs.filter(r => r && typeof r === 'object')
      .map(r => jumpTrial(r.i, r.nWeights, r.runId)).filter(r => r !== null);
    const unique = trials.filter(r => !trials.some(other => other.runId === r.runId
      && (other.i !== r.i || other.nWeights !== r.nWeights)));
    return unique.some(earth => earth.i === C.ids.earth && unique.some(moon => moon.i === C.ids.moon
      && earth.runId !== moon.runId && moon.height > earth.height));
  }
  const judgeQ6 = ({ i } = {}) => i === C.ids.neutron && springState(i, C.minWeights).broken;
  const judgeQ7 = ({ i } = {}) => {
    const ratio = gRatio(i);
    return ratio !== null && i !== C.ids.earth && ratio >= C.similarMin && ratio <= C.similarMax;
  };

  // Display coordinates only. Equal specimen sizes and compressed travel are schematic.
  const VIEW = Object.freeze({ top: 0.84, springTop: 2.72, springRest: 0.16, markUnit: 0.03,
    jumpBase: 1.08, jumpScale: 0.55, specimenRadius: 0.21, carouselRadius: 0.48,
    springX: -0.22, balanceX: -1.12, jumpX: 1.12,
    bounds: Object.freeze({ min: Object.freeze([-1.68, 0.84, -0.62]), max: Object.freeze([1.62, 2.96, 0.59]) }),
    verticalBounds: Object.freeze({ min: Object.freeze([-0.88, 0.84, -0.62]), max: Object.freeze([1.0, 3.81, 0.59]) }) });
  const bodySceneAngle = i => -i / BODIES.length * Math.PI * 2;
  function sceneState(i, nWeights) {
    const spring = springState(i, nWeights), jump = jumpVisual(i);
    const springLength = VIEW.springRest + spring.shownMarks * VIEW.markUnit;
    return { springLength, springEnd: VIEW.springTop - springLength,
      forceLevel: spring.shownMarks / C.springLimit,
      jumpApex: jump.shownHeight === null ? null : VIEW.jumpBase + VIEW.jumpScale * jump.shownHeight,
      carouselAngle: bodySceneAngle(i),
      unloaded: balanceState(i, nWeights, nWeights) === 'unloaded' };
  }
  function jumpSceneY(i, seconds) {
    const height = jumpVisual(i).shownHeight;
    if (height === null) return VIEW.jumpBase + Math.min(C.jumpViewMax, Math.max(0, seconds) * C.jumpSpeed) * VIEW.jumpScale;
    const duration = 2 * C.jumpSpeed / g(i);
    const phase = Math.min(1, Math.max(0, seconds / duration));
    return VIEW.jumpBase + VIEW.jumpScale * height * 4 * phase * (1 - phase);
  }

  // R2 display-only mappings. Caps live here, never in the scene.
  const GRAMMAR_VIEW = Object.freeze({ specimenRadius: 0.275, arrowWidth: 0.13,
    dotRadius: 0.018, jumpBallRadius: 0.087, apexRadius: 0.135,
    trailIntervals: 16, fieldCount: 96, recordLimit: 4, transition: 0.3,
    radiusMin: 0.045, radiusMax: 0.24, radiusUnit: 0.075 });
  function grammarState(i, nWeights) {
    if (!validBody(i) || mass(nWeights) === null) return null;
    const spring = springState(i, nWeights), scene = sceneState(i, nWeights);
    return { i, nWeights, mass: mass(nWeights), weight: weight(i, nWeights), g: g(i),
      spring: { ...spring }, jump: { ...jumpVisual(i) }, scene: { ...scene },
      arrowLength: spring.shownMarks * VIEW.markUnit,
      cells: Array.from({ length: Math.ceil(spring.shownMarks) }, (_, k) =>
        Math.min(1, spring.shownMarks - k)),
      steps: Array.from({ length: C.maxWeights }, (_, k) => springState(i, k + 1).shownMarks * VIEW.markUnit),
      dots: Array.from({ length: nWeights }, (_, k) => (k - (nWeights - 1) / 2) * 0.075) };
  }
  function radiusVisual(i) {
    if (!validBody(i)) return null;
    if (BODIES[i].radius === null) return { ratio: null, radius: 0, clipped: false, exaggerated: true };
    const ratio = BODIES[i].radius / BODIES[0].radius;
    const raw = GRAMMAR_VIEW.radiusUnit * Math.sqrt(ratio);
    const radius = Math.max(GRAMMAR_VIEW.radiusMin, Math.min(GRAMMAR_VIEW.radiusMax, raw));
    return { ratio, radius, clipped: raw !== radius, exaggerated: true };
  }
  function timeDots(i) {
    if (!validBody(i)) return null;
    const duration = g(i) === 0 ? C.jumpViewMax / C.jumpSpeed : 2 * C.jumpSpeed / g(i);
    return Array.from({ length: GRAMMAR_VIEW.trailIntervals + 1 }, (_, k) => {
      const time = duration * k / GRAMMAR_VIEW.trailIntervals;
      return { time, y: jumpSceneY(i, time), returning: k > GRAMMAR_VIEW.trailIntervals / 2 && g(i) !== 0 };
    });
  }
  function fieldVisual(i, nWeights, lite = false) {
    const d = grammarState(i, nWeights);
    if (!d) return null;
    return { count: g(i) === 0 ? 0 : GRAMMAR_VIEW.fieldCount / (lite ? 2 : 1),
      brightness: 0.12 + 0.28 * d.scene.forceLevel, level: d.scene.forceLevel };
  }

  // R4 display-only, fresh coordinates: never used by the science or judges.
  function specimenVisual() {
    const scale = 1.35, radius = GRAMMAR_VIEW.specimenRadius * scale;
    return { scale, radius, center: [0, 1.30, 0.08], front: 0.08 + radius + 0.05 };
  }

  return Object.freeze({ specimenVisual, GRAMMAR_VIEW, grammarState, radiusVisual, timeDots, fieldVisual, VIEW, sceneState, bodySceneAngle, jumpSceneY, C, BODIES, RANGE, DETENTS, g, gRatio, mass, weight, jumpHeight,
    balanceState, springState, jumpVisual, jumpTrial, railX, weightsFromRailX, bodyRailX, bodyFromRailX,
    judgeQ1, judgeQ2, judgeQ3, judgeQ4, judgeQ5, judgeQ6, judgeQ7 });
})();
// ==== END PHYSICS ====
