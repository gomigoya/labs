// ==== 6 HERO APPARATUS ====
const HERO = {};
const PIPE_R = 0.045, CORE_R = 0.035;     // 유리 구동관 / 물기둥 (화면용, 실제 지름 50 mm의 과장)
const TANK = { x: -1.2, z: -0.22, w: 0.36, d: 0.36, hgt: 0.42, depth: 0.29 };
const RAM = { x: 0.40, z: 0.04, w: 0.26, h: 0.14, d: 0.15 };
const VALVE = { x: 0.505, r: 0.046 };
const CHAMBER = { x: 0.33, z: 0.0, r: 0.066, h: 0.3 };
const TOWER = { x: 0.05, z: -0.6 };
const DTANK = { x: 0.05, z: -0.44, w: 0.27, h: 0.2, d: 0.22 };
const supplySurfaceY = (H) => DATUM + PHYS.visHeight(H);
const nozzleY = (h) => DATUM + PHYS.visHeight(h);

function drivePath(tankBottom) {
  const a = new THREE.Vector3(TANK.x + TANK.w / 2 + 0.035, tankBottom + 0.05, TANK.z);
  const b = new THREE.Vector3(TANK.x + TANK.w / 2 + 0.16, tankBottom + 0.035, TANK.z + 0.02);
  const c = new THREE.Vector3(RAM.x - RAM.w / 2 - 0.16, DATUM + 0.004, RAM.z - 0.01);
  const d = new THREE.Vector3(RAM.x - RAM.w / 2 - 0.02, DATUM, RAM.z);
  return new THREE.CatmullRomCurve3([a, b, c, d], false, 'centripetal');
}
function deliveryPath(yn) {
  const P = new THREE.CurvePath();
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const y0 = DATUM + 0.04, xr = 0.25, zr = DTANK.z;
  P.add(new THREE.LineCurve3(v(CHAMBER.x, y0, CHAMBER.z - 0.07), v(CHAMBER.x, y0, -0.24)));
  P.add(new THREE.QuadraticBezierCurve3(v(CHAMBER.x, y0, -0.24), v(CHAMBER.x, y0, zr), v(xr + 0.03, y0, zr)));
  P.add(new THREE.QuadraticBezierCurve3(v(xr + 0.03, y0, zr), v(xr, y0, zr), v(xr, y0 + 0.05, zr)));
  P.add(new THREE.LineCurve3(v(xr, y0 + 0.05, zr), v(xr, yn + 0.04, zr)));
  P.add(new THREE.QuadraticBezierCurve3(v(xr, yn + 0.04, zr), v(xr, yn + 0.09, zr), v(xr - 0.05, yn + 0.09, zr)));
  P.add(new THREE.LineCurve3(v(xr - 0.05, yn + 0.09, zr), v(DTANK.x + 0.06, yn + 0.09, zr)));
  P.add(new THREE.QuadraticBezierCurve3(v(DTANK.x + 0.06, yn + 0.09, zr), v(DTANK.x + 0.02, yn + 0.09, zr), v(DTANK.x + 0.02, yn + 0.04, zr)));
  return P;
}

function buildHero() {
  const G = new THREE.Group(); RIG.add(G); HERO.root = G;

  // --- 공급 탱크 + 승강대 ---
  const lift = new THREE.Group(); G.add(lift);
  const lbase = roundedPanel(0.46, 0.03, 0.42, 0.01, MAT.graphiteL, 3); lbase.position.set(TANK.x, TOP + 0.015, TANK.z); lift.add(lbase);
  for (const sx of [-1, 1]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.5, 12), MAT.chrome); rod.position.set(TANK.x + sx * 0.2, TOP + 0.27, TANK.z - 0.17); lift.add(rod);
    for (let k = 0; k < 18; k++) { const th = new THREE.Mesh(new THREE.TorusGeometry(0.0095, 0.0016, 4, 10), MAT.chrome); th.rotation.x = Math.PI / 2; th.position.set(TANK.x + sx * 0.2, TOP + 0.05 + k * 0.025, TANK.z - 0.17); lift.add(th); }
    const capR = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 8), MAT.brass); capR.position.set(TANK.x + sx * 0.2, TOP + 0.52, TANK.z - 0.17); lift.add(capR);
  }
  const wheel = new THREE.Group();
  const wr = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 10, 36), MAT.brass); wheel.add(wr);
  for (let k = 0; k < 4; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.006, 0.006), MAT.brass); sp.rotation.z = k * Math.PI / 4; wheel.add(sp); }
  const knobW = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 10).rotateX(Math.PI / 2), MAT.woodD); knobW.position.set(0.05, 0, 0.015); wheel.add(knobW);
  wheel.position.set(TANK.x - 0.12, TOP + 0.07, TANK.z + 0.215); lift.add(wheel); HERO.wheel = wheel;
  const supply = new THREE.Group(); G.add(supply); HERO.supply = supply;
  const plat = roundedPanel(0.46, 0.025, 0.42, 0.008, MAT.graphite, 3); plat.position.y = -0.0125; supply.add(plat);
  for (const sx of [-1, 1]) { const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.04, 14), MAT.brass); sleeve.position.set(sx * 0.2, -0.01, -0.17); supply.add(sleeve); }
  const tankGlass = roundedPanel(TANK.w, TANK.hgt, TANK.d, 0.018, MAT.glass, 4); tankGlass.position.y = TANK.hgt / 2; tankGlass.castShadow = false; supply.add(tankGlass);
  const tankWater = roundedPanel(TANK.w - 0.02, TANK.depth, TANK.d - 0.02, 0.012, MAT.water, 3); tankWater.position.y = TANK.depth / 2 + 0.008; tankWater.castShadow = false; supply.add(tankWater);
  HERO.tankWater = tankWater;
  for (const [x, z, ry] of [[0, TANK.d / 2, 0], [0, -TANK.d / 2, 0], [TANK.w / 2, 0, Math.PI / 2], [-TANK.w / 2, 0, Math.PI / 2]]) {
    const t = brassTrim(ry ? TANK.d : TANK.w, 0.006); t.rotation.y = ry; t.position.set(x, TANK.hgt, z); supply.add(t);
  }
  const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.035, 24).rotateZ(Math.PI / 2), MAT.brass); outlet.position.set(TANK.w / 2 + 0.017, 0.05, 0); supply.add(outlet);
  for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.04, 6).rotateZ(Math.PI / 2), MAT.chrome); const a = k / 6 * Math.PI * 2; b.position.set(TANK.w / 2 + 0.017, 0.05 + Math.sin(a) * 0.04, Math.cos(a) * 0.04); supply.add(b); }
  // 급수 수도꼭지 + 물줄기
  const tap = new THREE.Group(); G.add(tap);
  const tv = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.05, 14), MAT.copper); tv.position.set(TANK.x - 0.05, 1.025, -0.7); tap.add(tv);
  const ta = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.42, 14).rotateX(Math.PI / 2), MAT.copper); ta.position.set(TANK.x - 0.05, 2.04, -0.49); tap.add(ta);
  const te = new THREE.Mesh(new THREE.SphereGeometry(0.022, 14, 10), MAT.brass); te.position.set(TANK.x - 0.05, 2.04, -0.7); tap.add(te);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.014, 0.08, 14), MAT.brass); spout.position.set(TANK.x - 0.05, 2.0, -0.28); tap.add(spout);
  const valveT = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20), new THREE.MeshStandardMaterial({ color: 0x8a2a1e, roughness: 0.5 })); valveT.rotation.x = Math.PI / 2; valveT.position.set(TANK.x - 0.05, 2.09, -0.4); tap.add(valveT);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 1, 10, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9ddcf5).multiplyScalar(1.1), transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }));
  stream.position.set(TANK.x - 0.05, 1.7, -0.28); G.add(stream); HERO.stream = stream;
  shadowify(tap);

  // --- 구동관: 유리관 + 물기둥(현상 셰이더) + 받침 ---
  HERO.pipeGlass = new THREE.Mesh(new THREE.BufferGeometry(), MAT.glassThin); HERO.pipeGlass.renderOrder = 3; G.add(HERO.pipeGlass);
  HERO.pipeCore = new THREE.Mesh(new THREE.BufferGeometry(), PHEN.coreMat); HERO.pipeCore.renderOrder = 2; G.add(HERO.pipeCore);
  HERO.pipeRings = new THREE.Group(); G.add(HERO.pipeRings);
  HERO.supports = new THREE.Group(); G.add(HERO.supports);

  // --- 펌프 본체 (앞/뒤 반쪽: 분해 보기) ---
  const ram = new THREE.Group(); ram.position.set(RAM.x, DATUM, RAM.z); G.add(ram); HERO.ram = ram;
  const bodyBack = roundedPanel(RAM.w, RAM.h, RAM.d / 2, 0.022, MAT.iron, 4); bodyBack.position.z = -RAM.d / 4; ram.add(bodyBack);
  const frontX = new THREE.Group(); ram.add(frontX); HERO.frontX = frontX;   // 분해 연출 오프셋 전용 부모
  const frontMat = MAT.iron.clone(); frontMat.transparent = true; HERO.frontMat = frontMat;
  const bodyFront = roundedPanel(RAM.w, RAM.h, RAM.d / 2, 0.022, frontMat, 4); bodyFront.position.z = RAM.d / 4; frontX.add(bodyFront);
  for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 6), MAT.chrome); b.position.set(-RAM.w / 2 + 0.03 + k * (RAM.w - 0.06) / 4, RAM.h / 2 + 0.004, 0); ram.add(b); }
  const inletFl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 28).rotateZ(Math.PI / 2), MAT.brass); inletFl.position.set(-RAM.w / 2 - 0.012, 0, 0); ram.add(inletFl);
  for (const sz of [-1, 1]) { const foot = roundedPanel(0.07, 0.04, 0.17, 0.008, MAT.graphiteD, 2); foot.position.set(sz * 0.08, -RAM.h / 2 - 0.004, 0); ram.add(foot); }
  // 내부 물길 (분해 시 보임)
  const chan = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, RAM.w * 0.92, 20).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1d6a86, emissive: 0x0c3a4e, emissiveIntensity: 1.2, roughness: 0.2 }));
  ram.add(chan); HERO.channel = chan;
  // 압력계 (밸브 쪽 수두, 0~45 m)
  const gauge = new THREE.Group(); gauge.position.set(0.0, -0.005, RAM.d / 2 + 0.012); frontX.add(gauge);
  const gRing = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.022, 36).rotateX(Math.PI / 2), MAT.chrome); gauge.add(gRing);
  const gFace = new THREE.Mesh(new THREE.CircleGeometry(0.041, 48), new THREE.MeshStandardMaterial({ map: gaugeFaceTexture(LANG === 'en' ? 'm head' : 'm 수두', 0, 45, 9), roughness: 0.45 })); gFace.position.z = 0.0115; gauge.add(gFace);
  const needle = new THREE.Group(); needle.position.z = 0.013; gauge.add(needle);
  const nm = new THREE.Mesh(new THREE.BoxGeometry(0.0026, 0.034, 0.0015), new THREE.MeshStandardMaterial({ color: 0xc0281a, roughness: 0.4 })); nm.position.y = 0.014; needle.add(nm);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.004, 12).rotateX(Math.PI / 2), MAT.brass); needle.add(hub);
  const gGlass = new THREE.Mesh(new THREE.CircleGeometry(0.042, 36), new THREE.MeshPhysicalMaterial({ transparent: true, opacity: 0.12, roughness: 0.02, clearcoat: 1, depthWrite: false })); gGlass.position.z = 0.0118 + 0.004; gauge.add(gGlass);
  HERO.needle = needle;

  // 폐수 밸브: 하우징 + (분해 오프셋 부모) + 원판·줄기·추 (물리로 움직이는 자식)
  const vh = new THREE.Group(); vh.position.set(VALVE.x - RAM.x, RAM.h / 2, 0); ram.add(vh);
  const housingProf = [[0.026, 0], [VALVE.r, 0], [VALVE.r, 0.035], [VALVE.r + 0.008, 0.04], [VALVE.r + 0.008, 0.05], [VALVE.r - 0.004, 0.05], [VALVE.r - 0.004, 0.012], [0.026, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
  const housing = new THREE.Mesh(new THREE.LatheGeometry(housingProf, 40), MAT.iron); vh.add(housing);
  const seat = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.004, 8, 32).rotateX(Math.PI / 2), MAT.brass); seat.position.y = 0.05; vh.add(seat);
  const valveX = new THREE.Group(); vh.add(valveX); HERO.valveX = valveX;
  const valveMove = new THREE.Group(); valveX.add(valveMove); HERO.valveMove = valveMove;
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.033, 0.008, 32), MAT.brass); disk.position.y = 0.046; valveMove.add(disk); HERO.disk = disk;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 10), MAT.chrome); stem.position.y = 0.13; valveMove.add(stem);
  const weights = new THREE.Group(); weights.position.y = 0.075; valveMove.add(weights); HERO.weights = weights;
  const guide = new THREE.Group(); vh.add(guide);
  const gpost = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.24, 8), MAT.chrome); gpost.position.set(0.05, 0.16, 0); guide.add(gpost);
  const garm = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.006, 0.01), MAT.chrome); garm.position.set(0.026, 0.275, 0); guide.add(garm);
  const gtip = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0015, 6, 12).rotateX(Math.PI / 2), MAT.chrome); gtip.position.set(0, 0.275, 0); guide.add(gtip);
  // 송출 체크 밸브 (공기실 아래, 분해 시 보임)
  const checkX = new THREE.Group(); checkX.position.set(CHAMBER.x - RAM.x, RAM.h / 2 - 0.01, CHAMBER.z - RAM.z); ram.add(checkX); HERO.checkX = checkX;
  const hinge = new THREE.Group(); hinge.position.set(-0.03, 0, 0); checkX.add(hinge); HERO.flapHinge = hinge;
  const flap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.005, 28), MAT.brassD); flap.position.x = 0.03; hinge.add(flap);
  const cseat = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.003, 6, 28).rotateX(Math.PI / 2), MAT.brass); cseat.position.y = 0.004; checkX.add(cseat);
  occluder(shadowify(ram));

  // 배수 받침 (폐수가 떨어지는 곳)
  const tray = new THREE.Group(); tray.position.set(0.56, TOP + 0.002, 0.07); G.add(tray);
  const tb = roundedPanel(0.42, 0.012, 0.34, 0.006, MAT.graphiteD, 2); tb.position.y = 0.006; tray.add(tb);
  const tf = bevelFrame(0.42, 0.34, 0.018, 0.04, MAT.brassD, 0.01); tf.rotation.x = -Math.PI / 2; tf.position.y = 0.02; tray.add(tf);
  const tw = new THREE.Mesh(new THREE.PlaneGeometry(0.39, 0.31).rotateX(-Math.PI / 2), MAT.water); tw.position.y = 0.022; tray.add(tw); HERO.trayWater = tw;
  shadowify(tray);

  // 공기실 (유리) + 물기둥 + 압축 공기
  const ch = new THREE.Group(); ch.position.set(CHAMBER.x, DATUM + RAM.h / 2, CHAMBER.z); G.add(ch); HERO.chamber = ch;
  const chBase = new THREE.Mesh(new THREE.CylinderGeometry(CHAMBER.r + 0.016, CHAMBER.r + 0.02, 0.024, 36), MAT.brass); chBase.position.y = 0.012; ch.add(chBase);
  const capX = new THREE.Group(); ch.add(capX); HERO.capX = capX;
  const chGlassGeo = new THREE.LatheGeometry([[CHAMBER.r, 0], [CHAMBER.r, CHAMBER.h], [CHAMBER.r * 0.92, CHAMBER.h + CHAMBER.r * 0.4], [CHAMBER.r * 0.7, CHAMBER.h + CHAMBER.r * 0.72], [CHAMBER.r * 0.38, CHAMBER.h + CHAMBER.r * 0.92], [0.012, CHAMBER.h + CHAMBER.r]].map(([x, y]) => new THREE.Vector2(x, y)), 48);
  const chGlass = new THREE.Mesh(chGlassGeo, MAT.glass); chGlass.position.y = 0.024; chGlass.renderOrder = 3; capX.add(chGlass);
  const chWater = new THREE.Mesh(new THREE.CylinderGeometry(CHAMBER.r - 0.006, CHAMBER.r - 0.006, 1, 32), MAT.water); chWater.position.y = 0.024; ch.add(chWater); HERO.chWater = chWater;
  const airMat = new THREE.ShaderMaterial({
    uniforms: { uP: { value: 0 }, uTime: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - w.xyz); vY = position.y; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: 'uniform float uP; uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vY; void main(){ float rim = pow(1.0 - abs(dot(vN, vV)), 2.0); vec3 c = mix(vec3(0.25,0.55,0.8), vec3(0.75,0.92,1.0), uP); float a = (0.05 + 0.25*rim) * (0.4 + 0.8*uP); gl_FragColor = vec4(c * a * 2.0, 1.0); }',
  });
  const air = new THREE.Mesh(new THREE.CylinderGeometry(CHAMBER.r - 0.007, CHAMBER.r - 0.007, 1, 32, 1, true), airMat); air.position.y = 0.024; ch.add(air); HERO.air = air; HERO.airMat = airMat;
  const chTop = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.02, 16), MAT.brass); chTop.position.y = 0.024 + CHAMBER.h + CHAMBER.r + 0.006; capX.add(chTop);
  const chRing = new THREE.Mesh(new THREE.TorusGeometry(CHAMBER.r + 0.003, 0.005, 8, 40).rotateX(Math.PI / 2), MAT.brass); chRing.position.y = 0.024 + CHAMBER.h * 0.5; capX.add(chRing);
  shadowify(ch, true, true);

  // 송출관 + 송출 탱크 + 눈금 기둥
  HERO.dPipe = new THREE.Mesh(new THREE.BufferGeometry(), MAT.copper); HERO.dPipe.castShadow = true; G.add(HERO.dPipe);
  const tower = new THREE.Group(); G.add(tower);
  const colH = 2.58 - TOP;
  const col = roundedPanel(0.07, colH, 0.07, 0.012, MAT.graphite, 3); col.position.set(TOWER.x, TOP + colH / 2, TOWER.z); tower.add(col);
  const foot = roundedPanel(0.3, 0.03, 0.24, 0.01, MAT.graphiteL, 3); foot.position.set(TOWER.x, TOP + 0.015, TOWER.z + 0.02); tower.add(foot);
  for (const sx of [-1, 1]) { const s = screw(MAT.chrome); s.rotation.x = -Math.PI / 2; s.position.set(TOWER.x + sx * 0.11, TOP + 0.031, TOWER.z + 0.08); tower.add(s); }
  const scale = new THREE.Mesh(new THREE.PlaneGeometry(0.06, colH - 0.04), new THREE.MeshBasicMaterial({ map: scaleStripTexture(colH - 0.04), toneMapped: true, color: new THREE.Color(1.2, 1.2, 1.2) }));
  scale.position.set(TOWER.x, TOP + colH / 2, TOWER.z + 0.0355); tower.add(scale);
  const capT = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 10), MAT.brass); capT.position.set(TOWER.x, TOP + colH + 0.01, TOWER.z); tower.add(capT);
  // 높이 표식: H(따뜻한), h(차가운)
  const mk = (col) => { const m = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 3).rotateZ(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(2.5), toneMapped: false })); return m; };
  HERO.markH = mk(0xffb36b); HERO.markH.position.set(TOWER.x - 0.05, 0, TOWER.z + 0.036); tower.add(HERO.markH);
  HERO.markh = mk(0x7dd3fc); HERO.markh.position.set(TOWER.x - 0.05, 0, TOWER.z + 0.036); tower.add(HERO.markh);
  shadowify(tower); occluder(tower);
  const dt = new THREE.Group(); G.add(dt); HERO.dtank = dt;
  const sleeve = roundedPanel(0.1, 0.07, 0.1, 0.012, MAT.brass, 3); sleeve.position.set(TOWER.x - DTANK.x, -DTANK.h / 2 + 0.02, TOWER.z - DTANK.z); dt.add(sleeve);
  const knobS = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.04, 12).rotateZ(Math.PI / 2), MAT.woodD); knobS.position.set(TOWER.x - DTANK.x + 0.07, -DTANK.h / 2 + 0.02, TOWER.z - DTANK.z); dt.add(knobS);
  const arm = roundedPanel(0.05, 0.03, 0.14, 0.008, MAT.brassD, 2); arm.position.set(0, -DTANK.h / 2 + 0.005, -0.1); dt.add(arm);
  const dGlass = roundedPanel(DTANK.w, DTANK.h, DTANK.d, 0.016, MAT.glass, 4); dGlass.castShadow = false; dt.add(dGlass);
  const dWater = roundedPanel(DTANK.w - 0.02, 1, DTANK.d - 0.02, 0.008, MAT.water, 2); dWater.castShadow = false; dt.add(dWater); HERO.dWater = dWater;
  const dBase = roundedPanel(DTANK.w + 0.02, 0.016, DTANK.d + 0.02, 0.006, MAT.graphite, 2); dBase.position.y = -DTANK.h / 2 - 0.008; dt.add(dBase);
  for (const [x, z, ry] of [[0, DTANK.d / 2, 0], [0, -DTANK.d / 2, 0], [DTANK.w / 2, 0, Math.PI / 2], [-DTANK.w / 2, 0, Math.PI / 2]]) { const t = brassTrim(ry ? DTANK.d : DTANK.w, 0.005); t.rotation.y = ry; t.position.set(x, DTANK.h / 2, z); dt.add(t); }
  const over = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.06, 10).rotateX(Math.PI / 2), MAT.copper); over.position.set(-0.08, DTANK.h / 2 - 0.04, -DTANK.d / 2 - 0.03); dt.add(over);
  shadowify(dt);
  HERO.nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.012, 0.04, 14), MAT.brass); G.add(HERO.nozzle);

  occluder(supply); occluder(lift);
  HERO.cache = { tankBottom: NaN, yn: NaN };
}

function scaleStripTexture(len) {
  const H = 2048, W = 96;
  return canvasTex(W, H, (c) => {
    c.fillStyle = '#d9d0c2'; c.fillRect(0, 0, W, H);
    const yOf = (head) => H - ((DATUM + PHYS.visHeight(head)) - (TOP + 0.02)) / len * H;
    c.fillStyle = '#2a2420'; c.textAlign = 'left'; c.textBaseline = 'middle';
    for (let v = 0; v <= 40; v++) {
      const major = v <= 5 || v % 5 === 0; if (!major && v > 5) continue;
      const y = yOf(v), big = v === 0 || v === 1 || v === 2 || v === 5 || v % 10 === 0;
      c.fillRect(0, y - (big ? 2 : 1), big ? 46 : 28, big ? 4 : 2);
      if (big) { c.font = font('mono', 30); c.fillText(v === 40 ? '40m' : String(v), 50, y); }
    }
    c.fillStyle = '#7a6a58'; c.font = font('mono', 22); c.save(); c.translate(W - 14, H * 0.08); c.rotate(Math.PI / 2); c.fillText('√ SCALE', 0, 0); c.restore();
  });
}

// 장치 형상 갱신: H, h가 바뀔 때만 관을 다시 만든다
function updateApparatusGeometry(Hv, hv) {
  const ys = supplySurfaceY(Hv), yb = ys - TANK.depth - 0.008;
  if (!(Math.abs(yb - HERO.cache.tankBottom) <= 1e-4)) {
    HERO.cache.tankBottom = yb;
    HERO.supply.position.set(TANK.x, yb, TANK.z);
    HERO.wheel.rotation.z = -yb * 18;
    const curve = drivePath(yb); HERO.curve = curve;
    HERO.pipeGlass.geometry.dispose(); HERO.pipeGlass.geometry = new THREE.TubeGeometry(curve, 120, PIPE_R, 24, false);
    HERO.pipeCore.geometry.dispose(); HERO.pipeCore.geometry = new THREE.TubeGeometry(curve, 160, CORE_R, 20, false);
    // 관 이음 고리와 받침 (관을 따라 다시 배치)
    HERO.pipeRings.clear(); HERO.supports.clear();
    for (const u of [0.0, 0.33, 0.66, 1.0]) {
      const p = curve.getPointAt(u), tg = curve.getTangentAt(u);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(PIPE_R + 0.004, 0.006, 8, 28), u === 0 || u === 1 ? MAT.brass : MAT.brassD);
      ring.position.copy(p); ring.lookAt(p.clone().add(tg)); ring.castShadow = true; HERO.pipeRings.add(ring);
    }
    for (const u of [0.3, 0.62]) {
      const p = curve.getPointAt(u);
      const hgt = p.y - PIPE_R - TOP;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, hgt, 12), MAT.graphiteL); post.position.set(p.x, TOP + hgt / 2, p.z); post.castShadow = true; HERO.supports.add(post);
      const saddle = new THREE.Mesh(new THREE.TorusGeometry(PIPE_R + 0.008, 0.007, 8, 24, Math.PI), MAT.brassD); saddle.position.set(p.x, p.y, p.z); saddle.rotation.set(0, Math.atan2(curve.getTangentAt(u).x, curve.getTangentAt(u).z), Math.PI); saddle.castShadow = true; HERO.supports.add(saddle);
      const foot = roundedPanel(0.08, 0.012, 0.08, 0.004, MAT.graphiteD, 2); foot.position.set(p.x, TOP + 0.006, p.z); HERO.supports.add(foot);
    }
    occluder(HERO.supports);
    HERO.stream.scale.y = 1.98 - ys; HERO.stream.position.y = (1.98 + ys) / 2;
    HERO.markH.position.y = ys;
  }
  const yn = nozzleY(hv);
  if (!(Math.abs(yn - HERO.cache.yn) <= 1e-4)) {
    HERO.cache.yn = yn;
    const dp = deliveryPath(yn); HERO.dCurve = dp;
    HERO.dPipe.geometry.dispose(); HERO.dPipe.geometry = new THREE.TubeGeometry(dp, 200, 0.013, 14, false);
    HERO.dtank.position.set(DTANK.x, yn - DTANK.h / 2 - 0.03, DTANK.z);
    HERO.nozzle.position.set(DTANK.x + 0.02, yn + 0.03, DTANK.z);
    HERO.markh.position.y = yn;
  }
}

// ==== 7 PHENOMENON SHADERS ====
// 구동관 물기둥: 노드 21개의 수두·속도를 담은 데이터 텍스처를 읽어 압력 → 색, 압력 기울기 → 파면 발광
const PHEN = {};
{
  const NN = PHYS.C.N + 1, TEXW = 32;
  PHEN.data = new Float32Array(TEXW * 4);
  PHEN.tex = new THREE.DataTexture(PHEN.data, TEXW, 1, THREE.RGBAFormat, THREE.FloatType);
  PHEN.tex.minFilter = PHEN.tex.magFilter = THREE.NearestFilter; PHEN.tex.needsUpdate = true;
  PHEN.coreMat = new THREE.ShaderMaterial({
    uniforms: {
      uData: { value: PHEN.tex }, uN: { value: NN }, uTexW: { value: TEXW },
      uH: { value: 2 }, uh: { value: 15 }, uShowP: { value: 1 }, uGain: { value: 1 }, uTime: { value: 0 }, uFlow: { value: 0 },
    },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.0); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform sampler2D uData; uniform float uN, uTexW, uH, uh, uShowP, uGain, uTime, uFlow;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      vec2 at(float s){ float f = clamp(s,0.0,1.0)*(uN-1.0); float i = floor(f); float w = f - i;
        vec4 a = texture2D(uData, vec2((i+0.5)/uTexW, 0.5)); vec4 b = texture2D(uData, vec2((min(i+1.0,uN-1.0)+0.5)/uTexW, 0.5));
        return mix(a.xy, b.xy, w); }
      vec3 ramp(float hd){
        vec3 vac = vec3(0.42,0.24,0.95), low = vec3(0.06,0.22,0.62), sup = vec3(0.16,0.72,0.95), mid = vec3(0.62,0.9,1.0), hi = vec3(1.0,1.0,1.0);
        if (hd < 0.0) return mix(low, vac, clamp(-hd/9.0, 0.0, 1.0));
        if (hd < uH) return mix(low, sup, hd/max(uH,1e-3));
        float x = (hd - uH) / max(uh - uH, 1e-3);
        if (x < 0.5) return mix(sup, mid, x/0.5);
        return mix(mid, hi, clamp((x-0.5)/0.5, 0.0, 1.0));
      }
      void main(){
        vec2 d = at(vUv.x); float hd = d.x;
        float ds = 1.0/(uN-1.0);
        float grad = abs(at(vUv.x + ds*0.5).x - at(vUv.x - ds*0.5).x) / max(uh, 1.0);
        float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.6);
        vec3 water = vec3(0.12, 0.5, 0.7);
        vec3 c = mix(water, ramp(hd), uShowP);
        float front = smoothstep(0.08, 0.5, grad) * uShowP;
        float ripple = 0.5 + 0.5*sin((vUv.x*46.0 - uFlow)*6.2831 + vUv.y*6.2831);
        float core = 0.32 + 0.1*ripple*(1.0-uShowP);
        vec3 col = c * (core + 0.85*rim) + vec3(0.75,0.9,1.0) * front * 1.1;
        gl_FragColor = vec4(col * uGain, 1.0);
      }`,
  });
  // 흐름 입자: 관 속을 지역 유속으로 이동하는 짧은 스트릭
  const nP = QUALITY.level === 'low' ? 70 : 150;
  PHEN.nP = nP;
  PHEN.pu = new Float32Array(nP); PHEN.pr = new Float32Array(nP); PHEN.pa = new Float32Array(nP);
  const R = mulberry32(77);
  for (let i = 0; i < nP; i++) { PHEN.pu[i] = R(); PHEN.pr[i] = Math.sqrt(R()) * (CORE_R - 0.008); PHEN.pa[i] = R() * Math.PI * 2; }
  PHEN.particles = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.0035, 0.02, 2, 6).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xd9f4ff).multiplyScalar(1.6), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), nP);
  PHEN.particles.frustumCulled = false; PHEN.particles.renderOrder = 4;
  // 분출 입자 (폐수 밸브 / 송출 노즐): 점 셰이더
  const mkPoints = (n, color, size) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('aLife', new THREE.BufferAttribute(new Float32Array(n), 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uSize: { value: size }, uScale: { value: innerHeight } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      vertexShader: 'attribute float aLife; uniform float uSize; uniform float uScale; varying float vL; void main(){ vL = aLife; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = aLife > 0.0 ? min(uSize * uScale / -mv.z, 0.004 * uScale) : 0.0; gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform vec3 uColor; varying float vL; void main(){ vec2 p = gl_PointCoord*2.0-1.0; float r = dot(p,p); if (r > 1.0 || vL <= 0.0) discard; float a = (1.0 - r) * clamp(vL*2.0, 0.0, 1.0); gl_FragColor = vec4(uColor * a * 1.6, 1.0); }',
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 5;
    return { pts, n, pos: geo.attributes.position, life: geo.attributes.aLife, vel: new Float32Array(n * 3), head: 0, rng: mulberry32(n * 13 + 5), acc: 0 };
  };
  PHEN.spray = mkPoints(QUALITY.level === 'low' ? 160 : 360, 0xbfe9ff, 0.006);
  PHEN.jet = mkPoints(140, 0xbfe9ff, 0.007);
}
function emitPoints(sys, count, at, velFn, life) {
  for (let k = 0; k < count; k++) {
    const i = sys.head; sys.head = (sys.head + 1) % sys.n;
    const v = velFn(sys.rng);
    sys.pos.setXYZ(i, at.x + v.ox, at.y + v.oy, at.z + v.oz);
    sys.vel[i * 3] = v.x; sys.vel[i * 3 + 1] = v.y; sys.vel[i * 3 + 2] = v.z;
    sys.life.setX(i, life);
  }
}
function stepPoints(sys, dt, floorY) {
  for (let i = 0; i < sys.n; i++) {
    let L = sys.life.getX(i); if (L <= 0) continue;
    L -= dt;
    sys.vel[i * 3 + 1] -= 9.81 * 0.35 * dt;   // 화면 축척에 맞춘 중력
    const x = sys.pos.getX(i) + sys.vel[i * 3] * dt, y = sys.pos.getY(i) + sys.vel[i * 3 + 1] * dt, z = sys.pos.getZ(i) + sys.vel[i * 3 + 2] * dt;
    if (y < floorY) L = 0;
    sys.pos.setXYZ(i, x, y, z); sys.life.setX(i, L);
  }
  sys.pos.needsUpdate = true; sys.life.needsUpdate = true;
}

// ==== 8 OVERLAYS ====
// 수두선(HGL): 각 노드의 압력 수두를 같은 제곱근 높이 눈금으로 관 위에 그린다. 탱크 두 개의 수면과 같은 눈금이다.
const OVL = {};
function buildOverlays() {
  const N1 = PHYS.C.N + 1;
  OVL.hglGeo = new LineGeometry(); OVL.hglGeo.setPositions(new Float32Array(N1 * 3));
  OVL.hglMat = new LineMaterial({ color: 0x9be3ff, linewidth: 3, transparent: true, opacity: 0.95, depthTest: true, toneMapped: false });
  OVL.hgl = new Line2(OVL.hglGeo, OVL.hglMat); OVL.hgl.frustumCulled = false; overlayScene.add(OVL.hgl);
  // 관과 수두선 사이 반투명 띠
  const rib = new THREE.BufferGeometry();
  rib.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N1 * 2 * 3), 3));
  rib.setAttribute('aT', new THREE.BufferAttribute(new Float32Array(N1 * 2).map((_, i) => i % 2), 1));
  const idx = []; for (let i = 0; i < N1 - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  rib.setIndex(idx);
  OVL.ribMat = new THREE.ShaderMaterial({
    uniforms: { uOp: { value: 1 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float aT; varying float vT; void main(){ vT = aT; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform float uOp; varying float vT; void main(){ gl_FragColor = vec4(vec3(0.35,0.75,1.0) * (0.05 + 0.22*vT) * uOp, 1.0); }',
  });
  OVL.rib = new THREE.Mesh(rib, OVL.ribMat); OVL.rib.frustumCulled = false; overlayScene.add(OVL.rib);
  // 수직 보조선 (5개 노드) + 끝점 구슬
  OVL.drops = [];
  for (let k = 0; k < 5; k++) {
    const g = new LineGeometry(); g.setPositions([0, 0, 0, 0, 1, 0]);
    const m = new Line2(g, new LineMaterial({ color: 0x7dd3fc, linewidth: 1.2, transparent: true, opacity: 0.55, dashed: true, dashSize: 0.02, gapSize: 0.015, toneMapped: false }));
    m.computeLineDistances(); m.frustumCulled = false; overlayScene.add(m); OVL.drops.push(m);
  }
  OVL.beads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.011, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbfeeff).multiplyScalar(1.5), toneMapped: false }), 2);
  OVL.beads.frustumCulled = false; overlayScene.add(OVL.beads);
  // 유속 화살표 6개 (길이는 관 구간 안으로 제한)
  OVL.arrows = [];
  const am = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffcf9a).multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: 0.95 });
  for (let k = 0; k < 6; k++) {
    const g = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1, 8).rotateZ(-Math.PI / 2).translate(0.5, 0, 0), am);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 10).rotateZ(-Math.PI / 2), am);
    g.add(shaft, head); g.userData = { shaft, head }; overlayScene.add(g); OVL.arrows.push(g);
  }
  overlayScene.add(PHEN.particles, PHEN.spray.pts, PHEN.jet.pts);
}
const _v3 = new THREE.Vector3(), _v3b = new THREE.Vector3(), _q = new THREE.Quaternion(), _m4 = new THREE.Matrix4(), _xAxis = new THREE.Vector3(1, 0, 0);
function updateOverlays(s, show, dtSim, Hv, hv) {
  const N1 = PHYS.C.N + 1, curve = HERO.curve;
  const hglOn = show.G, flowOn = show.F;
  OVL.hgl.visible = OVL.rib.visible = OVL.beads.visible = hglOn;
  OVL.drops.forEach((d) => (d.visible = hglOn));
  if (hglOn) {
    const pos = new Float32Array(N1 * 3), rib = OVL.rib.geometry.attributes.position;
    // 수격 순간에는 파면을 그대로, 그 밖에는 잔진동을 공간·시간 평활(τ = 40 ms, 시뮬 시간)해 선이 떨리지 않게 한다.
    if (!OVL.hS || OVL.hS.length !== N1) OVL.hS = Float32Array.from(s.H);
    const k = s.phase === 'hammer' || !(dtSim > 0) ? 1 : 1 - Math.exp(-dtSim / 0.04);
    for (let j = 0; j < N1; j++) {
      const u = j / (N1 - 1), p = curve.getPointAt(u);
      // 공간 [1,2,1] 필터: 격자 나이퀴스트 모드(노드마다 번갈아 뛰는 MOC 수치 잔진동)를 지운다
      const hj = s.phase === 'hammer' ? s.H[j] : (s.H[Math.max(j - 1, 0)] + 2 * s.H[j] + s.H[Math.min(j + 1, N1 - 1)]) / 4;
      OVL.hS[j] += (hj - OVL.hS[j]) * k;
      const y = DATUM + PHYS.visHeight(OVL.hS[j]);
      pos[j * 3] = p.x; pos[j * 3 + 1] = y; pos[j * 3 + 2] = p.z;
      rib.setXYZ(j * 2, p.x, p.y + PIPE_R, p.z); rib.setXYZ(j * 2 + 1, p.x, y, p.z);
    }
    OVL.hglGeo.setPositions(pos); rib.needsUpdate = true; OVL.rib.geometry.computeBoundingSphere();
    [0, 5, 10, 15, 20].forEach((j, k) => {
      const p = curve.getPointAt(j / (N1 - 1));
      OVL.drops[k].geometry.setPositions([p.x, p.y + PIPE_R, p.z, p.x, pos[j * 3 + 1], p.z]); OVL.drops[k].computeLineDistances();
    });
    _m4.makeTranslation(pos[0], pos[1], pos[2]); OVL.beads.setMatrixAt(0, _m4);
    _m4.makeTranslation(pos[(N1 - 1) * 3], pos[(N1 - 1) * 3 + 1], pos[(N1 - 1) * 3 + 2]); OVL.beads.setMatrixAt(1, _m4);
    OVL.beads.instanceMatrix.needsUpdate = true;
  }
  // 유속 화살표
  OVL.arrows.forEach((a, k) => {
    a.visible = flowOn;
    if (!flowOn) return;
    const u = 0.12 + k * 0.15, j = u * (N1 - 1), i0 = Math.floor(j), w = j - i0;
    const v = s.V[i0] * (1 - w) + s.V[Math.min(i0 + 1, N1 - 1)] * w;
    const p = curve.getPointAt(u), tg = curve.getTangentAt(u);
    const len = clamp(Math.abs(v) / 2.4, 0, 1) * 0.11;          // 최대 0.11 m: 이웃 화살표와 겹치지 않게
    a.position.copy(p).addScaledVector(_v3.set(0, 1, 0), PIPE_R + 0.03);
    _q.setFromUnitVectors(_xAxis, _v3b.copy(tg).multiplyScalar(Math.sign(v) || 1));
    a.quaternion.copy(_q);
    a.userData.shaft.scale.set(Math.max(len, 1e-3), 1, 1);
    a.userData.head.position.x = len + 0.012;
    a.visible = Math.abs(v) > 0.03;
  });
  // 흐름 입자
  PHEN.particles.visible = flowOn;
  if (flowOn) {
    const L = PHYS.C.L;
    for (let i = 0; i < PHEN.nP; i++) {
      let u = PHEN.pu[i];
      const j = u * (N1 - 1), i0 = Math.min(Math.floor(j), N1 - 2), w = j - i0;
      const v = s.V[i0] * (1 - w) + s.V[i0 + 1] * w;
      u += v * dtSim / L;
      if (u > 1) u -= 1; if (u < 0) u += 1;
      PHEN.pu[i] = u;
      const p = curve.getPointAt(u), tg = curve.getTangentAt(u);
      _v3.set(0, 1, 0).cross(tg).normalize();
      _v3b.copy(tg).cross(_v3).normalize();
      const r = PHEN.pr[i], a = PHEN.pa[i];
      p.addScaledVector(_v3, Math.cos(a) * r).addScaledVector(_v3b, Math.sin(a) * r);
      _q.setFromUnitVectors(_v3.set(0, 0, 1), tg);
      const st = clamp(Math.abs(v) / 1.2, 0.25, 2.6);
      _m4.compose(p, _q, _v3b.set(1, 1, st));
      PHEN.particles.setMatrixAt(i, _m4);
    }
    PHEN.particles.instanceMatrix.needsUpdate = true;
  }
}
