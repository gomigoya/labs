// ==== 1 PHYSICS ====
// 평형조석·원궤도 근사. 단위는 m, s, kg, rad이며 로슈 구간은 추정이다.
const PHYS = (() => {
  const C = Object.freeze({
    GM: 4.9028e12, massRatio: 0.012294,
    R: 6.371e6, d0: 3.844e8, moonRadius: 1.737e6,
    T0: 27.3217 * 86400, siderealDay: 86164.1,
    rhoEarth: 5514, rhoMoon: 3344, g: 9.81, earthDiameter: 1.2742e7,
    rocheFluid: 2.456, rocheRigid: 1.26,
    get dMin() { return 8e6; },
    get closerMax() { return this.d0 - this.dMin; },
  });
  const RANGE = Object.freeze({ closer: Object.freeze([0.1, C.closerMax]) });
  const RAIL_SPLIT = 0.5, RAIL_BOUNDARY = 1e8;
  const railDB = C.d0 - RAIL_BOUNDARY;

  // 슬라이더 밖 로슈 사건도 계산하므로 closer를 UI 범위로 자르지 않는다.
  const dist = closer => C.d0 - closer;
  const frac = closer => dist(closer) / C.d0;
  const tideExcess = closer => Math.expm1(-3 * Math.log1p(-closer / C.d0));
  const ratio = closer => (C.d0 / dist(closer)) ** 3;
  const tideH0 = () => C.massRatio * C.R ** 4 / C.d0 ** 3;
  const tideHeight = closer => tideH0() * ratio(closer);
  const tideLevel = (theta, closer) => tideHeight(closer) * (3 * Math.cos(theta) ** 2 - 1) / 2;
  const tidalAccel = closer => 2 * C.GM * C.R / dist(closer) ** 3;
  const personTidalForce = (massKg, closer) => massKg * tidalAccel(closer);
  const orbitPeriod = closer => C.T0 * frac(closer) ** 1.5;
  const angularSizeDeg = closer => 2 * C.moonRadius / dist(closer) * 180 / Math.PI;
  const roche = () => ({
    fluid: C.rocheFluid * C.R * Math.cbrt(C.rhoEarth / C.rhoMoon),
    rigid: C.rocheRigid * C.R * Math.cbrt(C.rhoEarth / C.rhoMoon),
  });
  function fractureState(closer) {
    const d = dist(closer), { fluid, rigid } = roche();
    if (d > fluid) return { state: 'whole', progress: 0 };
    if (d > rigid) return { state: 'cracking', progress: (fluid - d) / (fluid - rigid) };
    return { state: 'ring', progress: 1 };
  }
  const beads = closer => dist(closer) / C.earthDiameter;
  // 앞 구간은 가까워진 양, 뒤 구간은 남은 중심 거리를 로그로 배분한다.
  const railX = closer => closer <= RANGE.closer[0] ? 0 : closer >= C.closerMax ? 1
    : closer <= RAIL_BOUNDARY
      ? RAIL_SPLIT * Math.log10(closer / RANGE.closer[0]) / Math.log10(RAIL_BOUNDARY / RANGE.closer[0])
      : RAIL_SPLIT + (1 - RAIL_SPLIT) * Math.log(railDB / dist(closer)) / Math.log(railDB / C.dMin);
  const closerFromRailX = x => x <= RAIL_SPLIT
    ? RANGE.closer[0] * (RAIL_BOUNDARY / RANGE.closer[0]) ** (x / RAIL_SPLIT)
    : C.d0 - railDB * Math.exp(-Math.log(railDB / C.dMin) * (x - RAIL_SPLIT) / (1 - RAIL_SPLIT));
  const rocheX = () => {
    const { fluid, rigid } = roche();
    return { fluid: railX(C.d0 - fluid), rigid: railX(C.d0 - rigid) };
  };
  const RAIL_NOTCHES = Object.freeze([RANGE.closer[0], 1e3, 1e4, 1e5, 1e6, 1e7, RAIL_BOUNDARY]
    .map(closer => Object.freeze({ closer, x: railX(closer) })));
  const DETENTS = Object.freeze([1 / 2, 1 / 3, 1 / 10, 1 / 20]
    .map(frac => {
      const closer = C.d0 * (1 - frac);
      return Object.freeze({ frac, closer, x: railX(closer) });
    }));

  const relRate = closer => 2 * Math.PI / C.siderealDay - 2 * Math.PI / orbitPeriod(closer);
  const tidePeriod = closer => Math.PI / Math.abs(relRate(closer));
  const harborLevel = (t, lon0, closer) => tideLevel(lon0 + relRate(closer) * t, closer);
  const peaksCrossed = (thetaPrev, thetaNow) => Math.floor(thetaNow / Math.PI) - Math.floor(thetaPrev / Math.PI);

  const judgeQ1 = ({ closer, lensOpen }) => closer >= 0.1 && lensOpen === true;
  const judgeQ2 = ({ visited, closer }) => new Set([...visited]
    .filter(i => Number.isInteger(i) && i >= 0 && i < RAIL_NOTCHES.length)).size >= 6 && ratio(closer) >= 1.25;
  // 포함 경계의 산술 반올림만 허용한다.
  const judgeQ3 = ({ closer }) => Math.abs(frac(closer) - 0.5) <= 0.02 + Number.EPSILON;
  const judgeQ4 = ({ peaks }) => peaks >= 2;
  const judgeQ5 = ({ closer, personSeen, oceanSeen }) => frac(closer) <= 0.1 && personSeen === true && oceanSeen === true;
  const judgeQ6 = ({ closer, skyOpen }) => frac(closer) <= 0.1 && skyOpen === true;
  const judgeQ7 = ({ closer }) => fractureState(closer).state === 'ring';
  function judgeQ8({ wall, closer }) {
    const r = ratio(closer), rounding = 8 * Number.EPSILON * wall;
    return [2, 8, 27].includes(wall) && r >= 0.94 * wall - rounding && r <= wall + rounding;
  }

  const moonVisDist = closer => 4.5 - 3.2 * railX(closer);
  const oceanBulge = closer => {
    const r = ratio(closer);
    return r <= 3 ? { bulge: 0.04 * r, saturated: false }
      : { bulge: 0.12 + 0.30 * (1 - Math.exp(-(r - 3) / 60)), saturated: true };
  };

  // Absolute force units share the present center force; differences are exaggerated fivefold.
  function tidalArrows(closer) {
    const d = dist(closer), unit = C.GM / C.d0 ** 2;
    const near = 6 * C.GM / (d - C.R) ** 2 / unit;
    const center = 6 * C.GM / d ** 2 / unit;
    const far = 6 * C.GM / (d + C.R) ** 2 / unit;
    return { near, center, far, diffNear: 5 * (near - center), diffFar: 5 * (center - far) };
  }
  const apparentRateDegPerHour = closer => Math.abs(relRate(closer)) * 3600 * 180 / Math.PI;
  const personWeightRatio = closer => (1 - tidalAccel(closer) / C.g) / (1 - tidalAccel(0) / C.g);

  // Presentation only: a cube-root axis keeps 8/27/64 visible on one card.
  const cardExcessHeight = closer => 12 + 32 * Math.log2(ratio(closer));
  const cardTideHeight = closer => 104 * Math.cbrt(ratio(closer)) / 4;
  const cardWeightLift = weightRatio => 90 * Math.max(0, Math.min(1, 1 - weightRatio));

  return { cardExcessHeight, cardTideHeight, cardWeightLift, tidalArrows, apparentRateDegPerHour, personWeightRatio, moonVisDist, oceanBulge, C, RANGE, dist, frac, tideExcess, ratio, tideH0, tideHeight, tideLevel,
    tidalAccel, personTidalForce, orbitPeriod, angularSizeDeg, roche, fractureState,
    beads, railX, closerFromRailX, rocheX, RAIL_NOTCHES, DETENTS, relRate, tidePeriod,
    harborLevel, peaksCrossed, judgeQ1, judgeQ2, judgeQ3, judgeQ4, judgeQ5, judgeQ6, judgeQ7, judgeQ8 };
})();
// ==== END PHYSICS ====
