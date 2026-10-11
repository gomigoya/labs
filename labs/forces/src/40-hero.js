// ==== 6 HERO: 매달기대 + 끌기대 ====
// 모든 위치·길이는 물리 모듈(PHYS.hang, PHYS.trackForces)의 결과를 그대로 쓴다. 용수철 늘어남은 1:1 실제 크기.
const HERO = {};
const PC = PHYS.C;
const HS = { x: -1.0, z: -0.2, rodX: -1.36, armY: 0.87 };          // 매달기대: 용수철저울 축, 스탠드 막대
const TRK = { ox: 0.05, z: 0.12, x0: -0.75, x1: 1.65, w: 0.18 };     // 끌기대: 도막 중심 세계 x = ox + 물리 x
const TRK_Y = TOP + PC.track.y;                                        // 바닥 판 윗면
const AXIS_Y = TRK_Y + PC.block.h / 2;                                 // 끌기 저울 축 높이 = 도막 중심
const FCOL = { W: 0xffb36b, T: 0x86efac, B: 0x7dd3fc, N: 0xf1efe9, F: 0xc4b5fd, f: 0xfca5a5, net: 0xfde68a, bump: 0xd6d3d1 };
const FLUID_COL = { water: [0x2f8fb4, 0x0b3a4a, 0.55], brine: [0x5fb3ad, 0x0e3b38, 0.6], oil: [0xd09a2c, 0x3a2606, 0.72] };
const blockX = (x) => TRK.ox + x;
MAT.alu = new THREE.MeshStandardMaterial({ color: 0xc9ced3, roughness: 0.3, metalness: 1 });
MAT.casing = new THREE.MeshStandardMaterial({ color: 0xe6eef2, roughness: 0.12, metalness: 0, transparent: true, opacity: 0.2, depthWrite: false });
MAT.capG = new THREE.MeshStandardMaterial({ color: 0x3f7a55, roughness: 0.45, metalness: 0.1 });
MAT.capV = new THREE.MeshStandardMaterial({ color: 0x5f53a0, roughness: 0.45, metalness: 0.1 });
MAT.pointer = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff5a3c).multiplyScalar(1.6), toneMapped: false });
MAT.string = new THREE.MeshStandardMaterial({ color: 0xece4d6, roughness: 0.9 });

function woodTexture(seed, base = [168, 122, 80]) {
  const R = mulberry32(seed);
  return canvasTex(512, 256, (c, W, H) => {
    c.fillStyle = `rgb(${base})`; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      const y = R() * H, a = 0.05 + R() * 0.12; c.strokeStyle = R() > 0.5 ? `rgba(70,40,18,${a})` : `rgba(255,220,170,${a * 0.6})`; c.lineWidth = 1 + R() * 3;
      c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= W; x += 32) c.lineTo(x, y + Math.sin(x * 0.02 + i) * 3 + (R() - 0.5) * 2); c.stroke();
    }
  });
}
function sandTexture() {
  return canvasTex(512, 512, (c, W, H) => {
    c.fillStyle = '#8f7350'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 26000; i++) { const t = rand(); c.fillStyle = t > 0.6 ? `rgba(230,200,150,${0.2 + rand() * 0.4})` : `rgba(40,26,12,${0.15 + rand() * 0.35})`; c.fillRect(rand() * W, rand() * H, 1 + rand() * 2.2, 1 + rand() * 2.2); }
  }, { repeat: [8, 1] });
}
const SURF_MAT = {
  glass: new THREE.MeshStandardMaterial({ color: 0x6f95a3, roughness: 0.22, metalness: 0.05, envMapIntensity: 0.8 }),
  wood: new THREE.MeshStandardMaterial({ map: null, roughness: 0.55, metalness: 0 }),
  sand: new THREE.MeshStandardMaterial({ map: null, roughness: 1, metalness: 0 }),
};

// 나선 용수철: 위(0)에서 아래(−len)로 감긴 관. 길이가 바뀌면 다시 만든다 (철사 굵기 유지)
function helixGeo(r, turns, len, wire) {
  const n = Math.max(24, Math.round(turns * 14)), pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push(new THREE.Vector3(Math.cos(t * Math.PI * 2 * turns) * r, -t * len, Math.sin(t * Math.PI * 2 * turns) * r)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, wire, 5);
}
function springMesh(r, turns, wire, mat = MAT.chrome) {
  const m = new THREE.Mesh(helixGeo(r, turns, 0.05, wire), mat); m.castShadow = true;
  const sp = { mesh: m, L: 0.05, set(L) { L = Math.max(L, turns * wire * 2.3); if (Math.abs(L - sp.L) < 0.0006) return; sp.L = L; m.geometry.dispose(); m.geometry = helixGeo(r, turns, L, wire); } };
  return sp;
}
const cyl = (r, h, mat, seg = 16) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.castShadow = true; return m; };
// x축 방향 막대 (시작점 0, 길이 len)
const rodX = (r, len, mat) => { const m = cyl(r, len, mat, 10); m.geometry.rotateZ(Math.PI / 2); return m; };

// 매달기 저울 눈금: 0 N이 TOP+0.80, 1 N마다 5 cm 아래 (k = 20 N/m)
function hangScaleTexture() {
  const y0 = PC.hang.casingTop, span = PC.hang.casing;
  return canvasTex(160, 1600, (c, W, H) => {
    c.fillStyle = '#efe8dc'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#2a2420'; c.fillStyle = '#2a2420'; c.textBaseline = 'middle';
    for (let i = 0; i <= 50; i++) {
      const F = i / 10, y = 0.80 - F / PC.kHang, py = (y0 - y) / span * H, major = i % 10 === 0, half = i % 5 === 0;
      c.lineWidth = major ? 5 : 2.5; c.beginPath(); c.moveTo(0, py); c.lineTo(major ? 70 : half ? 52 : 34, py); c.stroke();
      if (major) { c.font = font('mono', 54); c.fillText(String(F), 84, py); }
    }
    c.font = font('mono', 40); c.fillText('N', 92, H - 40);
  });
}
// 끌기 저울 눈금 (k = 40 N/m, 0~6 N): dir = 당기는 방향. 눈금은 늘 바로 읽히게 그린다
function trackScaleTexture(dir) {
  return canvasTex(1800, 150, (c, W, H) => {
    c.fillStyle = '#efe8dc'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#2a2420'; c.fillStyle = '#2a2420'; c.textAlign = 'center';
    for (let i = 0; i <= 60; i++) {
      const F = i / 10, u = 0.025 + F / PC.kTrack, x = dir * (0.09 - u), px = (x + 0.09) / 0.18 * W, major = i % 10 === 0, half = i % 5 === 0;
      c.lineWidth = major ? 5 : 2.5; c.beginPath(); c.moveTo(px, H); c.lineTo(px, H - (major ? 70 : half ? 50 : 32)); c.stroke();
      if (major) { c.font = font('mono', 58); c.fillText(String(F), px, 52); }
    }
  });
}

function buildHero() {
  buildHangStation();
  buildTrackStation();
}

function buildHangStation() {
  const st = new THREE.Group(); RIG.add(st); HERO.hang = st;
  // 스탠드
  const base = roundedPanel(0.3, 0.02, 0.22, 0.006, MAT.graphite, 3); base.position.set(-1.26, TOP + 0.01, HS.z); st.add(base);
  for (const [x, z] of [[-1.39, HS.z - 0.09], [-1.39, HS.z + 0.09], [-1.13, HS.z - 0.09], [-1.13, HS.z + 0.09]]) { const f = rubberFoot(0.008); f.position.set(x, TOP + 0.002, z); st.add(f); }
  const rod = cyl(0.008, 0.93, MAT.chrome, 20); rod.position.set(HS.rodX, TOP + 0.02 + 0.465, HS.z); st.add(rod);
  const boss = roundedPanel(0.03, 0.035, 0.03, 0.005, MAT.graphiteL, 3); boss.position.set(HS.rodX, TOP + HS.armY, HS.z); st.add(boss);
  const knob = cyl(0.008, 0.02, MAT.brass); knob.rotation.x = Math.PI / 2; knob.position.set(HS.rodX, TOP + HS.armY, HS.z + 0.025); st.add(knob);
  const arm = rodX(0.006, 0.42, MAT.chrome); arm.position.set(HS.rodX + 0.21, TOP + HS.armY, HS.z); st.add(arm);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0016, 8, 20), MAT.chrome); hook.position.set(HS.x, TOP + HS.armY - 0.009, HS.z); st.add(hook);
  // 용수철저울 (고정 몸통)
  const sc = new THREE.Group(); sc.position.set(HS.x, TOP, HS.z); st.add(sc); HERO.hScale = sc;
  const yT = PC.hang.casingTop, yB = yT - PC.hang.casing, yc = (yT + yB) / 2;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, PC.hang.casing, 32, 1, true), MAT.casing); tube.position.y = yc; sc.add(tube);
  const capT = cyl(0.019, 0.016, MAT.capG, 32); capT.position.y = yT + 0.004; sc.add(capT);
  const capB = cyl(0.019, 0.012, MAT.capG, 32); capB.position.y = yB - 0.002; sc.add(capB);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.007, 0.0018, 8, 20), MAT.chrome); ring.position.y = yT + 0.02; sc.add(ring);
  const grad = new THREE.Mesh(new THREE.PlaneGeometry(0.02, PC.hang.casing), new THREE.MeshStandardMaterial({ map: hangScaleTexture(), roughness: 0.7 }));
  grad.position.set(0, yc, -0.008); sc.add(grad);
  HERO.hSpring = springMesh(0.009, 16, 0.0011); HERO.hSpring.mesh.position.set(0, yT - 0.004, 0); sc.add(HERO.hSpring.mesh);
  const ptr = new THREE.Group(); sc.add(ptr); HERO.hPtr = ptr;
  const pbar = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.0022, 0.003), MAT.pointer); pbar.position.z = 0.002; ptr.add(pbar);
  const pdisk = cyl(0.009, 0.004, MAT.chrome, 20); ptr.add(pdisk);
  const prod = cyl(0.0022, 0.29, MAT.chrome, 10); prod.position.y = -0.145; ptr.add(prod);
  const phook = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0016, 8, 18, Math.PI * 1.6), MAT.chrome); phook.position.y = -0.29 - 0.004; phook.rotation.z = -Math.PI * 0.3; ptr.add(phook);
  // 줄 (팽팽할 때 곧게, 뜰 때 늘어짐)
  // (Line2는 AO·그림자 패스에서 화면 크기 사각형으로 그려져서 얇은 관을 쓴다)
  HERO.str = new THREE.Mesh(new THREE.BufferGeometry(), MAT.string); HERO.str.userData.key = ''; st.add(HERO.str);
  // 매단 물체 3종
  const obj = new THREE.Group(); obj.position.set(HS.x, TOP, HS.z); st.add(obj); HERO.obj = obj;
  const h1 = PC.weightMass / PC.brass / (Math.PI * PC.weightR ** 2); HERO.h1 = h1;
  const wts = new THREE.Group(); obj.add(wts); HERO.wts = wts; HERO.disks = [];
  for (let i = 0; i < PC.nMax; i++) {
    const d = cyl(PC.weightR, h1 * 0.94, i % 2 ? MAT.brassD : MAT.brass, 36); d.position.y = (i + 0.5) * h1; wts.add(d); HERO.disks.push(d);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.02, h1 * 0.96, 0.004), MAT.slot); slot.position.set(0.012, (i + 0.5) * h1, 0); wts.add(slot); d.userData.slot = slot;
  }
  const hanger = new THREE.Group(); wts.add(hanger); HERO.hanger = hanger;
  const hr = cyl(0.0018, 0.012, MAT.chrome, 8); hr.position.y = 0.006; hanger.add(hr);
  const hp = cyl(0.012, 0.002, MAT.chrome, 24); hp.position.y = 0.001; hanger.add(hp);
  const he = new THREE.Mesh(new THREE.TorusGeometry(0.004, 0.0013, 6, 14), MAT.chrome); he.position.y = 0.016; hanger.add(he);
  const objH = PC.objV / (Math.PI * PC.objR ** 2);
  const mkCyl = (mat) => {
    const g = new THREE.Group();
    const m = cyl(PC.objR, objH, mat, 48); m.position.y = objH / 2; g.add(m);
    const e = new THREE.Mesh(new THREE.TorusGeometry(0.005, 0.0015, 8, 16), MAT.chrome); e.position.y = objH + 0.005; g.add(e);
    obj.add(g); return g;
  };
  HERO.al = mkCyl(MAT.alu);
  HERO.wood = mkCyl(new THREE.MeshStandardMaterial({ map: woodTexture(7, [190, 150, 98]), roughness: 0.65 }));
  // 승강대(랩잭) + 수조
  const jk = new THREE.Group(); jk.position.set(HS.x, TOP, HS.z); st.add(jk); HERO.jack = jk;
  const jb = roundedPanel(0.16, 0.012, 0.16, 0.004, MAT.graphiteL, 2); jb.position.y = 0.006; jk.add(jb);
  const jt = roundedPanel(0.16, 0.01, 0.16, 0.004, MAT.graphiteL, 2); jk.add(jt); HERO.jTop = jt;
  HERO.jArms = [];
  for (const z of [-0.072, 0.072]) for (const s of [1, -1]) { const a = roundedPanel(1, 0.008, 0.005, 0.002, MAT.chrome, 1); a.position.z = z; jk.add(a); HERO.jArms.push({ m: a, s }); }
  const jscrew = rodX(0.003, 0.2, MAT.chrome); jk.add(jscrew); HERO.jScrew = jscrew;
  const jknob = cyl(0.012, 0.016, MAT.graphiteD, 20); jknob.rotation.z = Math.PI / 2; jk.add(jknob); HERO.jKnob = jknob;
  const bk = new THREE.Group(); bk.position.set(HS.x, TOP, HS.z); st.add(bk); HERO.beaker = bk;
  const B = PC.beaker;
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(B.R, B.R, B.height, 48, 1, true), MAT.glass); glass.position.y = B.height / 2; bk.add(glass);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(B.R, 0.0025, 8, 48).rotateX(Math.PI / 2), MAT.glassThin); lip.position.y = B.height; bk.add(lip);
  const bottom = cyl(B.R, B.glass, MAT.glass, 48); bottom.position.y = B.glass / 2; bk.add(bottom);
  for (let i = 1; i <= 4; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.0012, 0.001), new THREE.MeshBasicMaterial({ color: 0xe8e8e8, transparent: true, opacity: 0.55 })); t.position.set(-0.035, B.glass + i * 0.04, B.R + 0.0005); bk.add(t); }
  const wm = new THREE.MeshStandardMaterial({ color: FLUID_COL.water[0], roughness: 0.1, transparent: true, opacity: 0.55, emissive: FLUID_COL.water[1], emissiveIntensity: 0.55, depthWrite: false });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(B.R - 0.0035, B.R - 0.0035, 1, 48), wm); water.renderOrder = 2; bk.add(water); HERO.water = water; HERO.waterMat = wm;
  shadowify(st, true, true);
  water.castShadow = false; glass.castShadow = false; tube.castShadow = false;
  occluder(st);
}

function buildTrackStation() {
  const st = new THREE.Group(); RIG.add(st); HERO.track = st;
  const len = TRK.x1 - TRK.x0, cx = (TRK.x0 + TRK.x1) / 2;
  const rail = roundedPanel(len, 0.015, TRK.w, 0.004, MAT.graphiteL, 3); rail.position.set(cx, TOP + 0.0075, TRK.z); st.add(rail);
  SURF_MAT.wood.map = woodTexture(3); SURF_MAT.wood.map.wrapS = THREE.RepeatWrapping; SURF_MAT.wood.map.repeat.set(5, 1);
  SURF_MAT.sand.map = sandTexture();
  const surf = roundedPanel(len - 0.06, 0.01, TRK.w - 0.02, 0.003, SURF_MAT.glass, 2); surf.position.set(cx, TRK_Y - 0.005, TRK.z); st.add(surf); HERO.surface = surf;
  // 바닥 판 앞면 눈금자 (cm)
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(len - 0.04, 0.013), new THREE.MeshStandardMaterial({ roughness: 0.6, map: canvasTex(4096, 48, (c, W, H) => {
    c.fillStyle = '#d9cfbf'; c.fillRect(0, 0, W, H); c.fillStyle = '#2a2420'; c.font = font('mono', 22);
    const x0w = TRK.x0 + 0.02, wl = len - 0.04;
    for (let cm = -60; cm <= 170; cm++) { const xw = -0.10 + cm / 100; if (xw < x0w || xw > x0w + wl) continue; const px = (xw - x0w) / wl * W; const mj = cm % 10 === 0; c.fillRect(px, 0, mj ? 3 : 1.5, mj ? 22 : cm % 5 === 0 ? 15 : 9); if (mj && cm >= 0 && cm <= 120) c.fillText(String(cm), px + 4, 42); }
  }) }));
  ruler.position.set(cx, TOP + 0.0078, TRK.z + TRK.w / 2 + 0.0006); st.add(ruler);
  // 멈춤 막대 (범퍼): 도막 바닥만 막는 낮은 고무 턱
  for (const xb of [blockX(PC.track.xmin) - PC.block.w / 2, blockX(PC.track.xmax) + PC.block.w / 2]) {
    const s = xb < 0.5 ? -1 : 1;
    const b = roundedPanel(0.014, 0.012, TRK.w - 0.03, 0.004, MAT.rubber, 2); b.position.set(xb + s * 0.007, TRK_Y + 0.006, TRK.z); st.add(b);
  }
  // 도막 + 짐 추
  const blk = new THREE.Group(); st.add(blk); HERO.block = blk;
  const bw = PC.block;
  const box = roundedPanel(bw.w, bw.h, bw.d, 0.004, new THREE.MeshStandardMaterial({ map: woodTexture(11, [176, 128, 82]), roughness: 0.6 }), 3); box.position.y = bw.h / 2; blk.add(box);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0016, 8, 16), MAT.chrome); e.rotation.y = Math.PI / 2; e.position.set(s * (bw.w / 2 + 0.005), bw.h / 2, 0); blk.add(e); }
  HERO.loads = [];
  for (let i = 0; i < PC.loadMax; i++) { const d = cyl(PC.load.r, PC.load.h * 0.95, i % 2 ? MAT.brassD : MAT.brass, 32); d.position.y = bw.h + (i + 0.5) * PC.load.h; blk.add(d); HERO.loads.push(d); }
  // 끌개 + 용수철저울 2개
  HERO.ts = [makeTrackScale(), makeTrackScale()];
  HERO.ts.forEach((t) => st.add(t.root));
  shadowify(st, true, true);
  HERO.ts.forEach((t) => (t.tube.castShadow = false));
  occluder(st);
}

function makeTrackScale() {
  const root = new THREE.Group(), mov = new THREE.Group(); root.add(mov);
  const T = { root, mov, dir: 0 };
  T.string = rodX(0.0012, 0.03, MAT.string); root.add(T.string);
  T.hook = new THREE.Mesh(new THREE.TorusGeometry(0.005, 0.0014, 8, 16), MAT.chrome); root.add(T.hook);
  T.rod = rodX(0.002, 0.2, MAT.chrome); root.add(T.rod);
  T.ptr = new THREE.Group(); root.add(T.ptr);
  const pb = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.003, 0.02), MAT.pointer); pb.position.y = 0.002; T.ptr.add(pb);
  const pd = cyl(0.0085, 0.004, MAT.chrome, 18); pd.rotation.z = Math.PI / 2; T.ptr.add(pd);
  T.spring = springMesh(0.0075, 12, 0.001); root.add(T.spring.mesh);
  T.tube = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.18, 28, 1, true).rotateZ(Math.PI / 2), MAT.casing); mov.add(T.tube);
  T.capN = cyl(0.015, 0.01, MAT.capV, 28); T.capN.rotation.z = Math.PI / 2; mov.add(T.capN);
  T.capF = cyl(0.015, 0.014, MAT.capV, 28); T.capF.rotation.z = Math.PI / 2; mov.add(T.capF);
  T.texs = { 1: trackScaleTexture(1), '-1': trackScaleTexture(-1) };
  T.grad = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.015), new THREE.MeshStandardMaterial({ map: T.texs[1], roughness: 0.7 })); T.grad.position.z = -0.006; mov.add(T.grad);
  T.ring = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.002, 8, 18), MAT.chrome); T.ring.rotation.y = Math.PI / 2; mov.add(T.ring);
  // 끌개 대차: 일정한 힘으로 당기는 손의 대역
  T.cart = new THREE.Group(); mov.add(T.cart);
  const cb = roundedPanel(0.07, 0.026, 0.046, 0.006, MAT.graphiteL, 3); cb.position.y = -0.012; T.cart.add(cb);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.006, 0.047), new THREE.MeshBasicMaterial({ color: new THREE.Color(FCOL.F).multiplyScalar(1.4), toneMapped: false })); stripe.position.y = -0.006; T.cart.add(stripe);
  const post = roundedPanel(0.006, 0.02, 0.012, 0.002, MAT.chrome, 1); post.position.y = 0.0; T.cart.add(post); T.post = post;
  T.wheels = [];
  for (const x of [-0.024, 0.024]) for (const z of [-0.026, 0.026]) { const w = cyl(0.008, 0.006, MAT.rubber, 16); w.rotation.x = Math.PI / 2; w.position.set(x, -0.022, z); T.cart.add(w); T.wheels.push(w); }
  T.set = (dir, anchorX, z, s) => {
    if (T.dir !== dir) { T.dir = dir; T.grad.material.map = T.texs[dir]; T.grad.material.needsUpdate = true; T.spring.mesh.rotation.z = dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
    root.position.set(anchorX, AXIS_Y, z);
    T.string.position.x = dir * 0.015; T.hook.position.x = dir * 0.032;
    T.rod.position.x = dir * 0.13; T.ptr.position.x = dir * 0.23;
    T.spring.mesh.position.x = dir * 0.23; T.spring.set(0.025 + s);
    mov.position.x = dir * s;
    T.tube.position.x = dir * 0.165; T.grad.position.x = dir * 0.165;
    T.capN.position.x = dir * 0.075; T.capF.position.x = dir * 0.257;
    T.ring.position.x = dir * 0.272; T.post.position.x = dir * 0.0;
    T.cart.position.x = dir * 0.318;
    const wx = anchorX + dir * (0.318 + s);
    for (const w of T.wheels) w.rotation.y = -wx / 0.008;
  };
  return T;
}

// 매 프레임 장치 갱신 (r = PHYS.hang 결과, xv = 진동 포함 화면 늘어남)
function updateHang(r, xv) {
  const yT = PC.hang.casingTop;
  HERO.hSpring.set(yT - 0.004 - (0.80 - xv));
  HERO.hPtr.position.y = 0.80 - xv;
  const hookY = PC.hang.hookY0 - xv;
  // 물체 바닥 높이: 매달려 있으면 고리 따라, 뜨면 물리 결과 그대로
  const yb = r.floating ? r.yb : hookY - PC.hang.string - r.h;
  const ytop = yb + r.h;
  HERO.obj.position.y = TOP + yb;
  HERO.wts.visible = r.obj === 'weights'; HERO.al.visible = r.obj === 'al'; HERO.wood.visible = r.obj === 'wood';
  if (r.obj === 'weights') {
    const n = Math.round(r.m / PC.weightMass);
    HERO.disks.forEach((d, i) => { d.visible = i < n; d.userData.slot.visible = i < n; });
    HERO.hanger.position.y = n * HERO.h1;
    HERO.hanger.children[1].visible = n === 0;
  }
  // 줄: 고리 → 물체 고리
  const top = ytop + (r.obj === 'weights' ? 0.02 : 0.01);
  const a = V3(HS.x, TOP + hookY - 0.009, HS.z), b = V3(HS.x, TOP + top, HS.z);
  const slack = Math.max(0, PC.hang.string - 0.004 - (a.y - b.y)), key = `${a.y.toFixed(4)}|${b.y.toFixed(4)}`;
  if (key !== HERO.str.userData.key) {
    HERO.str.userData.key = key;
    const pts = []; for (let i = 0; i < 10; i++) { const t = i / 9; pts.push(new THREE.Vector3(HS.x + Math.sin(t * Math.PI) * slack * 0.6, a.y + (b.y - a.y) * t, HS.z)); }
    if (Math.abs(a.y - b.y) < 0.002 && slack < 0.002) pts.forEach((q, i) => (q.y = a.y - i * 0.0004));
    HERO.str.geometry.dispose(); HERO.str.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.0009, 5);
  }
  // 승강대·수조·물
  const j = r.beakerY;
  HERO.jTop.position.y = j - 0.005;
  const dh = Math.max(j - 0.022, 0.004), L = Math.hypot(0.12, dh), ang = Math.atan2(dh, 0.12);
  for (const A of HERO.jArms) { A.m.scale.x = L; A.m.position.set(0, 0.012 + dh / 2, A.m.position.z); A.m.rotation.z = A.s * ang; }
  HERO.jScrew.position.set(0, 0.012 + dh / 2, 0); HERO.jKnob.position.set(0.105, 0.012 + dh / 2, 0);
  HERO.beaker.position.y = TOP + j;
  const wb = PC.beaker.glass, wh = Math.max(r.yw - j - wb, 0.001);
  HERO.water.scale.y = wh; HERO.water.position.y = wb + wh / 2;
}
function setFluidLook(f) {
  const [c, e, o] = FLUID_COL[f];
  HERO.waterMat.color.setHex(c); HERO.waterMat.emissive.setHex(e); HERO.waterMat.opacity = o;
}
function setSurfaceLook(s) { HERO.surface.material = SURF_MAT[s]; }
function updateTrack(st, P) {
  const bx = blockX(st.x);
  HERO.block.position.set(bx, TRK_Y, TRK.z);
  HERO.loads.forEach((d, i) => (d.visible = i < P.load));
  const s1 = Math.min(P.F1, PC.trackMax) / PC.kTrack, s2 = Math.min(P.F2, PC.trackMax) / PC.kTrack;
  const hw = PC.block.w / 2 + 0.006;
  if (P.same) { HERO.ts[0].set(1, bx + hw, TRK.z - 0.03, s1); HERO.ts[1].set(1, bx + hw, TRK.z + 0.03, s2); }
  else { HERO.ts[0].set(-1, bx - hw, TRK.z, s1); HERO.ts[1].set(1, bx + hw, TRK.z, s2); }
}

// ==== 7 OVERLAYS: 힘 화살표 (가산 발광, 흐르는 셰브론 = 방향 표시) ====
const OVL = {};
const ARROW_GEO = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
const ARROW_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
const ARROW_FS = `uniform float uLen, uW, uTime, uGain; uniform vec3 uColor; varying vec2 vUv;
  void main(){
    float s = vUv.y * uLen, t = abs(vUv.x - 0.5) * uW;
    float hl = min(uW * 1.5, uLen * 0.5), sh = uW * 0.15;
    float body;
    if (s < uLen - hl) body = 1.0 - smoothstep(sh * 0.55, sh, t);
    else { float hw = (uLen - s) / hl * uW * 0.5; body = 1.0 - smoothstep(hw * 0.8, hw + 0.0006, t); }
    float shaft = step(s, uLen - hl);
    float glow = exp(-t / (uW * 0.16)) * 0.32 * shaft * smoothstep(0.0, uW * 0.4, s);
    float ch = fract((s + t * 1.3) / (uW * 1.7) - uTime * 1.1);
    float stripe = smoothstep(0.0, 0.12, ch) * (1.0 - smoothstep(0.38, 0.5, ch));
    float core = body * (0.62 + 0.55 * stripe * shaft);
    float a = clamp(core + glow, 0.0, 1.0);
    gl_FragColor = vec4(uColor * uGain * (core + glow), a);
  }`;
function makeArrow(col) {
  const mat = new THREE.ShaderMaterial({ uniforms: { uLen: { value: 0.1 }, uW: { value: 0.03 }, uTime: { value: 0 }, uGain: { value: 1.5 }, uColor: { value: new THREE.Color(col) } },
    vertexShader: ARROW_VS, fragmentShader: ARROW_FS, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const m = new THREE.Mesh(ARROW_GEO, mat); m.matrixAutoUpdate = false; m.frustumCulled = false; m.renderOrder = 10; m.visible = false; overlayScene.add(m);
  return { mesh: m, mat, tip: new THREE.Vector3(), mid: new THREE.Vector3(), on: false, N: 0 };
}
const _ax = new THREE.Vector3(), _ay = new THREE.Vector3(), _az = new THREE.Vector3(), _am = new THREE.Matrix4();
// origin에서 dir(단위) 방향으로 크기 N(뉴턴)인 화살표
function setArrow(a, origin, dir, N, show) {
  const len = Math.abs(N) * PC.arrow;
  a.N = Math.abs(N); a.on = !!show && len > 0.004; a.mesh.visible = a.on;
  if (!a.on) return;
  const W = 0.03;
  _ay.copy(dir).normalize();
  _az.subVectors(camera.position, origin); _az.addScaledVector(_ay, -_az.dot(_ay));
  if (_az.lengthSq() < 1e-8) _az.set(0, 0, 1); _az.normalize();
  _ax.crossVectors(_ay, _az).normalize();
  _am.makeBasis(_ax.multiplyScalar(W), _ay.clone().multiplyScalar(len), _az); _am.setPosition(origin);
  a.mesh.matrix.copy(_am); a.mesh.matrixWorldNeedsUpdate = true;
  a.mat.uniforms.uLen.value = len; a.mat.uniforms.uW.value = W;
  a.tip.copy(origin).addScaledVector(dir, len); a.mid.copy(origin).addScaledVector(dir, len * 0.5);
}
const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0), RIGHT = new THREE.Vector3(1, 0, 0), LEFT = new THREE.Vector3(-1, 0, 0);
function buildOverlays() {
  const A = (k) => makeArrow(FCOL[k]);
  OVL.h = { W: A('W'), T: A('T'), B: A('B'), net: A('net') };
  OVL.t = { W: A('W'), N: A('N'), F1: A('F'), F2: A('F'), f: A('f'), bump: A('bump'), net: A('net') };
  // K: 늘어난 길이 자 (매달기) — 0 눈금이 영점 지시선
  const rul = new THREE.Group(); scene.add(rul); OVL.ruler = rul;
  const rt = canvasTex(200, 1600, (c, W, H) => {
    c.clearRect(0, 0, W, H); c.fillStyle = 'rgba(14,22,28,0.72)'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#bae6fd'; c.strokeStyle = '#bae6fd'; c.textBaseline = 'middle';
    for (let mm = 0; mm <= 300; mm += 5) { const py = 40 + mm / 300 * (H - 80), mj = mm % 50 === 0; c.fillRect(0, py - 1, mj ? 80 : mm % 10 === 0 ? 50 : 28, mj ? 4 : 2); if (mj) { c.font = font('mono', 50); c.fillText(String(mm / 10), 92, py); } }
    c.font = font('mono', 34); c.fillText('cm', 92, H - 20);
  });
  const rp = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.30 * (1600 / (1600 - 80))), new THREE.MeshBasicMaterial({ map: rt, transparent: true, toneMapped: false, depthWrite: false }));
  rp.position.set(HS.x + 0.05, TOP + 0.80 - 0.15, HS.z + 0.02); rul.add(rp);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.005, 1, 0.002), new THREE.MeshBasicMaterial({ color: new THREE.Color(FCOL.T).multiplyScalar(2.2), toneMapped: false }));
  bar.position.set(HS.x + 0.033, TOP + 0.8, HS.z + 0.021); rul.add(bar); OVL.rulerBar = bar;
  const zero = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.0015, 0.002), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); zero.position.set(HS.x + 0.035, TOP + 0.8, HS.z + 0.021); rul.add(zero);
  OVL.rulerPtr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.0015, 0.002), new THREE.MeshBasicMaterial({ color: new THREE.Color(FCOL.T).multiplyScalar(2.2), toneMapped: false })); rul.add(OVL.rulerPtr);
  // K: 끌기대 위치 눈금 (도막 이동 거리)
  const tr = new THREE.Mesh(new THREE.PlaneGeometry(PC.track.xmax - PC.track.xmin, 0.05), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, map: canvasTex(2400, 100, (c, W, H) => {
    c.fillStyle = 'rgba(14,22,28,0.55)'; c.fillRect(0, 0, W, H); c.fillStyle = '#bae6fd'; c.font = font('mono', 30); c.textAlign = 'center';
    const n = Math.round((PC.track.xmax - PC.track.xmin) * 100);
    for (let cm = 0; cm <= n; cm++) { const px = cm / n * W, mj = cm % 10 === 0; c.fillRect(px - (mj ? 2 : 1), 0, mj ? 4 : 2, mj ? 40 : cm % 5 === 0 ? 26 : 14); if (mj) c.fillText(String(cm), Math.min(Math.max(px, 24), W - 24), 76); }
  }) }));
  tr.rotation.x = -Math.PI / 2; tr.position.set(blockX((PC.track.xmin + PC.track.xmax) / 2), TRK_Y + 0.0015, TRK.z + TRK.w / 2 + 0.04); rul.add(tr);
  rul.visible = false;
}
const _o = new THREE.Vector3(), _o2 = new THREE.Vector3();
// 힘 화살표 배치: 매달기(r, xv) + 끌기(F)
function updateArrows(r, xv, Tlive, F, P, st, show, dt) {
  const tt = performance.now() / 1000;
  for (const set of [OVL.h, OVL.t]) for (const k in set) set[k].mat.uniforms.uTime.value = tt;
  // 매달기
  const hookY = PC.hang.hookY0 - xv, yb = r.floating ? r.yb : hookY - PC.hang.string - r.h, yc = TOP + yb + r.h / 2;
  const on = show && !r.empty;
  setArrow(OVL.h.W, _o.set(HS.x - 0.008, yc, HS.z), DOWN, r.W, on);
  setArrow(OVL.h.T, _o.set(HS.x, TOP + yb + r.h + 0.004, HS.z), UP, Tlive, on && Tlive > 0.005);
  setArrow(OVL.h.B, _o.set(HS.x + 0.038, TOP + yb + Math.max(r.s, 0) / 2, HS.z), UP, r.B, on && r.B > 0.003);
  const hn = Tlive + r.B - r.W;
  setArrow(OVL.h.net, _o.set(HS.x - 0.04, yc, HS.z), hn > 0 ? UP : DOWN, hn, on && Math.abs(hn) > 0.03);
  // 끌기
  const bx = blockX(st.x), hw = PC.block.w / 2, cy = TRK_Y + PC.block.h / 2;
  setArrow(OVL.t.W, _o.set(bx - 0.012, cy, TRK.z), DOWN, F.W, show);
  setArrow(OVL.t.N, _o.set(bx + 0.012, cy, TRK.z), UP, F.N, show);
  if (P.same) {
    setArrow(OVL.t.F2, _o.set(bx + hw + 0.006, cy + 0.012, TRK.z), RIGHT, P.F2, show);
    _o2.set(bx + hw + 0.006 + P.F2 * PC.arrow, cy + 0.026, TRK.z);
    setArrow(OVL.t.F1, _o2, RIGHT, P.F1, show);
  } else {
    setArrow(OVL.t.F1, _o.set(bx - hw - 0.006, cy + 0.02, TRK.z), LEFT, P.F1, show);
    setArrow(OVL.t.F2, _o.set(bx + hw + 0.006, cy + 0.02, TRK.z), RIGHT, P.F2, show);
  }
  setArrow(OVL.t.f, _o.set(bx, TRK_Y + 0.003, TRK.z + 0.03), F.f > 0 ? RIGHT : LEFT, F.f, show && Math.abs(F.f) > 0.003);
  setArrow(OVL.t.bump, _o.set(bx + (F.bump > 0 ? -hw : hw), cy + 0.015, TRK.z), F.bump > 0 ? RIGHT : LEFT, F.bump, show && Math.abs(F.bump) > 0.003);
  setArrow(OVL.t.net, _o.set(bx, TRK_Y + PC.block.h + P.load * PC.load.h + 0.05, TRK.z), F.net > 0 ? RIGHT : LEFT, F.net, show && Math.abs(F.net) > 0.003);
  // 자
  OVL.ruler.visible = S.overlays.K;
  if (OVL.ruler.visible) {
    const x = Math.max(xv, 0.0005);
    OVL.rulerBar.scale.y = x; OVL.rulerBar.position.y = TOP + 0.80 - x / 2;
    OVL.rulerPtr.position.set(HS.x + 0.035, TOP + 0.80 - xv, HS.z + 0.021);
  }
}
