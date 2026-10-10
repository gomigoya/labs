// ==== 12 INTERACTION ====
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const DRAG = { kind: null };
let pickables = [];
function tagPickables() {
  const tag = (o, k) => { o.userData.pick = k; pickables.push(o); };
  tag(HERO.supply, 'H'); tag(HERO.wheel, 'H');
  tag(HERO.dtank, 'h');
  tag(HERO.weights, 'm');
  tag(HERO.disk, 'valve'); tag(HERO.ram, 'valve');
  tag(CONSOLE.dialH.group, 'dialH'); tag(CONSOLE.dialh.group, 'dialh');
  tag(CONSOLE.slider.group, 'slider'); tag(CONSOLE.button.group, 'button');
}
function pickAt(cx, cy) {
  ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(pickables, true);
  for (const h of hits) {
    let o = h.object;
    while (o && !o.userData.pick) o = o.parent;
    if (o && o.visible !== false) {
      // 분해 보기에서 반투명 앞판은 건너뛴다
      if (h.object.material && h.object.material.transparent && h.object.material.opacity < 0.5) continue;
      return { kind: o.userData.pick, point: h.point, obj: o };
    }
  }
  return null;
}
function screenOf(obj) {
  const p = new THREE.Vector3(); obj.getWorldPosition(p); p.project(camera);
  return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight };
}
const worldPerPixel = (point) => 2 * camera.position.distanceTo(point) * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / innerHeight;
const wrapAng = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function onPointerDown(e) {
  if (e.button !== 0) return;
  const hit = pickAt(e.clientX, e.clientY);
  if (!hit) return;
  ensureAudio();
  const k = hit.kind;
  if (k === 'button') { togglePlay(); CONSOLE.button.press = 1; sfx('click'); return; }
  if (k === 'valve') { onValvePress(); return; }
  controls.enabled = false; CAM.cine = false; CAM.fly = null;
  canvas.setPointerCapture(e.pointerId);
  DRAG.kind = k; DRAG.x0 = e.clientX; DRAG.y0 = e.clientY; DRAG.wpp = worldPerPixel(hit.point);
  DRAG.H0 = S.H.tgt; DRAG.h0 = S.h.tgt; DRAG.m0 = S.m.tgt;
  if (k === 'dialH' || k === 'dialh') {
    const c = screenOf(k === 'dialH' ? CONSOLE.dialH.group : CONSOLE.dialh.group);
    DRAG.c = c; DRAG.a0 = Math.atan2(e.clientY - c.y, e.clientX - c.x); DRAG.acc = 0;
    DRAG.f0 = k === 'dialH' ? (S.H.tgt - 1) / 3 : (S.h.tgt - 5) / 35;
  }
  if (k === 'slider') sliderFromPointer(e);
  canvas.style.cursor = 'grabbing';
  UI.dragHint(k);
}
function sliderFromPointer(e) {
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const g = CONSOLE.slider.group;
  const n = new THREE.Vector3(0, 0, 1).applyQuaternion(g.getWorldQuaternion(new THREE.Quaternion()));
  const p0 = g.getWorldPosition(new THREE.Vector3());
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, p0);
  const hit = ray.ray.intersectPlane(plane, new THREE.Vector3());
  if (!hit) return;
  const local = g.worldToLocal(hit.clone());
  const f = clamp(local.x / CONSOLE.slider.len + 0.5, 0, 1);
  setParam('m', 0.1 + f * 0.8);
}
function onPointerMove(e) {
  if (DRAG.kind) {
    const dy = -(e.clientY - DRAG.y0) * DRAG.wpp;
    if (DRAG.kind === 'H') setParam('H', PHYS.headFromVis(PHYS.visHeight(DRAG.H0) + dy));
    else if (DRAG.kind === 'h') setParam('h', PHYS.headFromVis(PHYS.visHeight(DRAG.h0) + dy));
    else if (DRAG.kind === 'm') setParam('m', DRAG.m0 + dy * 2.2);
    else if (DRAG.kind === 'slider') sliderFromPointer(e);
    else if (DRAG.kind === 'dialH' || DRAG.kind === 'dialh') {
      const a = Math.atan2(e.clientY - DRAG.c.y, e.clientX - DRAG.c.x);
      DRAG.acc += wrapAng(a - DRAG.a0); DRAG.a0 = a;
      const f = clamp(DRAG.f0 + DRAG.acc / ARC_SWEEP, 0, 1);
      if (DRAG.kind === 'dialH') setParam('H', 1 + f * 3); else setParam('h', 5 + f * 35);
    }
    return;
  }
  if (e.pointerType === 'mouse') {
    hoverQueue = { x: e.clientX, y: e.clientY };
  }
}
let hoverQueue = null, hoverT = 0;
function hoverUpdate(dt) {
  hoverT += dt; if (!hoverQueue || hoverT < 0.06 || DRAG.kind) return;
  hoverT = 0; const h = pickAt(hoverQueue.x, hoverQueue.y); hoverQueue = null;
  canvas.style.cursor = h ? (h.kind === 'button' || h.kind === 'valve' ? 'pointer' : 'grab') : '';
}
function onPointerUp(e) {
  if (!DRAG.kind) return;
  DRAG.kind = null; controls.enabled = true; canvas.style.cursor = '';
  try { canvas.releasePointerCapture(e.pointerId); } catch {}
  UI.dragHint(null);
}
function onValvePress() {
  sfx('clack');
  if (!S.started || SIM.limit.stalled || S.needsRestart) { restart(false); UI.event(T('evStart')); }
  else UI.event(T('evRunning'));
}

const KEYMAP = {};
function onKey(e) {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) { if (e.key !== 'Escape') return; }
  const k = e.key;
  if (k === 'Escape') { UI.help(false); if (TOUR.i >= 0) tourEnd(); return; }
  if (UI.helpOpen && k !== '?') return;
  ensureAudio();
  const step = (name, d) => { setParam(name, S[name].tgt + d); sfx('tick'); };
  switch (k) {
    case '1': case '2': case '3': case '4': applyPreset(+k - 1); break;
    case '[': step('H', -0.25); break; case ']': step('H', 0.25); break;
    case '-': case '_': step('h', -1); break; case '=': case '+': step('h', 1); break;
    case ',': case '<': step('m', -0.05); break; case '.': case '>': step('m', 0.05); break;
    case 'p': case 'P': setOverlay('P', !S.overlays.P); break;
    case 'f': case 'F': setOverlay('F', !S.overlays.F); break;
    case 'g': case 'G': setOverlay('G', !S.overlays.G); break;
    case 'v': case 'V': setView(['lab', 'explode', 'studio'][(['lab', 'explode', 'studio'].indexOf(S.view) + 1) % 3]); break;
    case 't': case 'T': TOUR.i >= 0 ? tourEnd() : tourGo(0); break;
    case 'c': case 'C': setCinematic(!CAM.cine); break;
    case ' ': e.preventDefault(); togglePlay(); break;
    case 'r': case 'R': restart(false); flyTo(heroShot(), 1.8); break;
    case '/': e.preventDefault(); document.body.classList.toggle('hide-ui'); if (window.__site) window.__site.setVisible(!document.body.classList.contains('hide-ui')); break;
    case '?': UI.help(!UI.helpOpen); break;
    case 'm': case 'M': S.slowmo = !S.slowmo; UI.syncButtons(); break;
    case 'n': case 'N': setSound(!S.sound); break;
    default: KEYMAP[k.toLowerCase()] = true;
  }
}
function onKeyUp(e) { KEYMAP[e.key.toLowerCase()] = false; }
function keyMove(dt) {
  const f = (KEYMAP.w ? 1 : 0) - (KEYMAP.s ? 1 : 0), r = (KEYMAP.d ? 1 : 0) - (KEYMAP.a ? 1 : 0), u = (KEYMAP.e ? 1 : 0) - (KEYMAP.q ? 1 : 0);
  if (!f && !r && !u) return;
  CAM.cine = false; CAM.fly = null;
  const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
  const right = new THREE.Vector3().crossVectors(fwd, V3(0, 1, 0));
  const d = new THREE.Vector3().addScaledVector(fwd, f).addScaledVector(right, r).addScaledVector(V3(0, 1, 0), u).multiplyScalar(dt * 1.4);
  camera.position.add(d); controls.target.add(d);
}

// 소리 (기본 꺼짐): 다이얼 틱, 버튼, 밸브 '탁', 흐름 험
const AUD = { ctx: null };
function ensureAudio() {
  if (!S.sound || AUD.ctx) return;
  const C = new (window.AudioContext || window.webkitAudioContext)();
  AUD.ctx = C; AUD.master = C.createGain(); AUD.master.gain.value = 0.5; AUD.master.connect(C.destination);
  const len = C.sampleRate * 2, buf = C.createBuffer(1, len, C.sampleRate), d = buf.getChannelData(0), Rn = mulberry32(9);
  for (let i = 0; i < len; i++) d[i] = Rn() * 2 - 1;
  AUD.noise = buf;
  const src = C.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
  const hum = C.createGain(); hum.gain.value = 0;
  src.connect(lp).connect(hum).connect(AUD.master); src.start();
  const osc = C.createOscillator(); osc.type = 'sine'; osc.frequency.value = 52;
  const og = C.createGain(); og.gain.value = 0; osc.connect(og).connect(AUD.master); osc.start();
  AUD.hum = hum; AUD.lp = lp; AUD.osc = og;
}
function sfx(kind) {
  if (!S.sound || !AUD.ctx) return;
  const C = AUD.ctx, t = C.currentTime;
  const g = C.createGain(); g.connect(AUD.master);
  if (kind === 'tick' || kind === 'click') {
    const o = C.createOscillator(); o.type = 'square'; o.frequency.value = kind === 'tick' ? 2400 : 900;
    g.gain.setValueAtTime(kind === 'tick' ? 0.05 : 0.09, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    o.connect(g); o.start(t); o.stop(t + 0.04);
  } else if (kind === 'clack') {
    const s = C.createBufferSource(); s.buffer = AUD.noise;
    const bp = C.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 2;
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    s.connect(bp).connect(g); s.start(t, rr(0, 1), 0.13);
    const o = C.createOscillator(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.18);
    const g2 = C.createGain(); g2.gain.setValueAtTime(0.4, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g2).connect(AUD.master); o.start(t); o.stop(t + 0.25);
  } else if (kind === 'ding') {
    const o = C.createOscillator(); o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(g); o.start(t); o.stop(t + 0.62);
  }
}
function setSound(on) {
  S.sound = on;
  if (on) ensureAudio();
  if (AUD.ctx) { if (on) AUD.ctx.resume(); else AUD.ctx.suspend(); }
  UI.syncButtons();
}
function audioUpdate(s) {
  if (!AUD.ctx || !S.sound) return;
  const v = Math.abs(s.V[PHYS.C.N]);
  AUD.hum.gain.setTargetAtTime(Math.min(0.25, v * 0.09) * (S.playing ? 1 : 0), AUD.ctx.currentTime, 0.05);
  AUD.lp.frequency.setTargetAtTime(220 + v * 260, AUD.ctx.currentTime, 0.05);
  AUD.osc.gain.setTargetAtTime(s.deliv ? 0.06 : 0, AUD.ctx.currentTime, 0.03);
}

// ==== 13 HUD ====
// 조사 자동 선택: 마지막 글자 받침 판별 (숫자·단위 포함)
function hasBatchim(word) {
  const s = String(word).trim(); if (!s) return false;
  const ch = s[s.length - 1];
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  if (/[0-9]/.test(ch)) return '013678'.includes(ch);
  const unitRead = { m: false, L: false, '%': false, s: false, g: false };   // 미터·리터·퍼센트·초·그램 → 받침 없음
  if (ch in unitRead) return unitRead[ch];
  return false;
}
function josa(word, pair) {
  const [a, b] = pair.split('/');
  if (pair === '으로/로') { const s = String(word); const c = s.charCodeAt(s.length - 1); const rieul = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 === 8; return word + (hasBatchim(word) && !rieul ? a : b); }
  return word + (hasBatchim(word) ? a : b);
}
const fx = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '—');
const fL = (v) => (v >= 1 ? v.toFixed(2) : v.toFixed(3));

const TXT = {
  kicker: { ko: '수격펌프<b> · HYDRAULIC RAM</b>', en: 'Water hammer<b> · HYDRAULIC RAM</b>' },
  hook: { ko: '물이 솟는다', en: 'Water climbs' },
  lead: {
    ko: '개울물은 아래로만 흐릅니다. 그런데 이 장치는 전기 없이 물을 <em>공급 탱크보다 몇 배 높은 곳</em>까지 올립니다. 비밀은 밸브가 "탁" 닫히는 순간에 있습니다. <b>송출 탱크를 끌어 올려 보세요.</b>',
    en: 'Streams only run downhill. Yet this device lifts water <em>several times higher than its source</em> with no power at all. The secret is the instant the valve slams shut. <b>Drag the upper tank higher.</b>',
  },
  chipQ: { ko: '양수량', en: 'Lifted' }, chipEta: { ko: '효율', en: 'Efficiency' }, chipP: { ko: '최고 압력', en: 'Peak pressure' },
  eIn: { ko: '떨어진 물', en: 'Fall power' }, eOut: { ko: '올라간 물', en: 'Lift power' },
  scenario: { ko: '시나리오', en: 'Scenario' }, supplyH: { ko: '공급 낙차 H', en: 'Supply head H' }, deliveryh: { ko: '양수 높이 h', en: 'Lift height h' }, weight: { ko: '밸브 추 m', en: 'Valve weight m' },
  slowmo: { ko: '수격 슬로모션', en: 'Hammer slow-mo' },
  hint: { ko: '탱크·추·다이얼을 끌어 조작 · 드래그 회전 · 우클릭 이동 · 1–4 시나리오 · T 투어 · ? 도움말', en: 'Drag tanks, weight, dials · drag to orbit · right-drag to pan · 1–4 scenarios · T tour · ? help' },
  otherT: { ko: '다른 실험', en: 'Next lab' }, otherN: { ko: '모든 실험실 보기', en: 'See all labs' },
  close: { ko: '닫기', en: 'Close' }, prev: { ko: '이전', en: 'Back' }, next: { ko: '다음', en: 'Next' }, finish: { ko: '마치기', en: 'Finish' },
  presets: { ko: ['낮게 많이', '높게 조금', '가벼운 밸브', '무거운 밸브'], en: ['Low & lots', 'High & little', 'Light valve', 'Heavy valve'] },
  views: { ko: ['실험실', '분해', '스튜디오'], en: ['Lab', 'Explode', 'Studio'] },
  ovl: { ko: { P: '압력장', F: '흐름', G: '수두선' }, en: { P: 'Pressure', F: 'Flow', G: 'Head line' } },
  lblTank: { ko: '공급 탱크', en: 'Supply tank' }, lblPipe: { ko: '구동관', en: 'Drive pipe' }, lblValve: { ko: '폐수 밸브', en: 'Waste valve' },
  lblAir: { ko: '공기실', en: 'Air chamber' }, lblD: { ko: '송출 탱크', en: 'Delivery tank' }, lblFront: { ko: '압력 파면', en: 'Pressure front' },
  open: { ko: '열림', en: 'open' }, shut: { ko: '닫힘', en: 'shut' }, closing: { ko: '닫히는 중', en: 'closing' },
  perMin: { ko: 'L/분', en: 'L/min' }, waste: { ko: '버려지는 물', en: 'wasted' }, beats: { ko: '박자/분', en: 'beats/min' }, perBeat: { ko: '한 박자', en: 'per beat' },
  head: { ko: 'm 수두', en: 'm head' }, ofSupply: { ko: '공급의', en: 'of supply' }, stopped: { ko: '펌프 정지', en: 'pump stopped' }, notYet: { ko: '아직 측정 전', en: 'not measured yet' },
  evStart: { ko: '폐수 밸브를 눌러 시동했습니다', en: 'Valve pressed — pump started' }, evRunning: { ko: '이미 뛰고 있어요 — R로 처음부터', en: 'Already running — press R to restart' },
  evStallNo: { ko: '밸브가 닫히지 않습니다 — 펌프 정지', en: 'Valve never closes — pump stopped' }, evStallRe: { ko: '밸브가 다시 열리지 않습니다 — 펌프 정지', en: 'Valve never reopens — pump stopped' },
  evNeedRestart: { ko: '폐수 밸브를 눌러 다시 시동하세요', en: 'Press the waste valve to restart' },
  slowTag: { ko: 'SLOW-MO ×1/25 · 수격 순간', en: 'SLOW-MO ×1/25 · HAMMER' },
  dragH: { ko: '공급 탱크 높이 조절 중', en: 'Adjusting supply head' }, dragh: { ko: '송출 탱크 높이 조절 중', en: 'Adjusting lift height' }, dragm: { ko: '밸브 추 무게 조절 중', en: 'Adjusting valve weight' },
};
const T = (k) => (TXT[k] ? TXT[k][LANG] ?? TXT[k].ko : k);

// 캡션 상태기계: 항상 실제 숫자 2~4개가 들어간 완결 문장
function captionFor(s) {
  const L = SIM.limit, P = SIM.par, en = LANG === 'en';
  const n = (v) => `<span class="n">${v}</span>`, w = (v) => `<span class="w">${v}</span>`;
  const vN = s.V[PHYS.C.N];
  if (!S.started) return en ? `<span class="tag">ready</span>Press the <b>waste valve</b> (the brass disk with weights) to start the first beat. Supply head is ${w(fx(P.H) + ' m')}, lift height ${n(fx(P.h, 0) + ' m')}.`
    : `<span class="tag">대기</span><b>폐수 밸브</b>(추가 얹힌 황동 원판)를 눌러 첫 박자를 시작해 보세요. 지금 공급 낙차는 ${w(fx(P.H) + ' m')}, 양수 높이는 ${n(fx(P.h, 0) + ' m')}입니다.`;
  if (S.needsRestart) return en ? `<span class="tag">stopped</span>The pump is stopped. After changing the setup, <b>press the waste valve</b> to restart it — real rams are started by hand too. New setup: H ${w(fx(S.H.tgt) + ' m')}, h ${n(fx(S.h.tgt, 0) + ' m')}.`
    : `<span class="tag">정지</span>펌프가 멈춰 있습니다. 조건을 바꾼 뒤에는 <b>폐수 밸브를 눌러</b> 다시 시동합니다. 실제 수격펌프도 손으로 눌러 시동합니다. 새 조건: H ${w(fx(S.H.tgt) + ' m')}, h ${n(fx(S.h.tgt, 0) + ' m')}.`;
  if (s.phase === 'stall' || (L.stalled && L.reason === 'noclose')) {
    if (L.reason === 'noreopen') return en ? `<span class="tag">stalled</span>The recoil is too weak: valve-side pressure stays above ${n(fx(SIM.Hre, 2) + ' m')} so the waste valve never reopens. The pump has stopped — lower the supply head or raise the lift height.`
      : `<span class="tag">정지</span>되튐이 약해 밸브 쪽 압력이 ${n(fx(SIM.Hre, 2) + ' m')} 아래로 내려가지 않습니다. 폐수 밸브가 다시 열리지 않아 펌프가 멈췄습니다. 공급 낙차를 낮추거나 양수 높이를 올려 보세요.`;
    return en ? `<span class="tag">stalled</span>The flow tops out at ${n(fx(PHYS.vInf(P.H), 2) + ' m/s')}, but lifting the ${w(Math.round(P.m * 1000) + ' g')} weight needs ${n(fx(SIM.vc, 2) + ' m/s')}. The valve never shuts, so <b>every drop is wasted</b> (${n(fx(L.Q, 0) + ' L/min')}).`
      : `<span class="tag">정지</span>물이 최고 ${n(fx(PHYS.vInf(P.H), 2) + ' m/s')}에 그치는데, ${w(Math.round(P.m * 1000) + ' g')} 추를 들려면 ${n(fx(SIM.vc, 2) + ' m/s')}가 필요합니다. 밸브가 닫히지 않아 <b>물이 전부 버려집니다</b>(${n(fx(L.Q, 0) + ' L/분')}).`;
  }
  const c = PHYS.cycleAt(SIM, s.tSim);
  if (s.phase === 'accel') return en ? `<span class="tag">accelerating</span>Water speeds up down the drive pipe: ${n(fx(Math.max(vN, 0), 2) + ' m/s')} now, the valve slams at ${n(fx(SIM.vc, 2) + ' m/s')}. Meanwhile it spills out — ${w(fL(L.VwBeat * 1000) + ' L')} per beat.`
    : `<span class="tag">가속</span>물이 구동관을 내려가며 빨라지는 중: 지금 ${n(fx(Math.max(vN, 0), 2) + ' m/s')}, 밸브는 ${n(fx(SIM.vc, 2) + ' m/s')}에서 닫힙니다. 그동안 한 박자에 ${w(fL(L.VwBeat * 1000) + ' L')}가 버려집니다.`;
  if (s.phase === 'hammer') {
    const before = c ? PHYS.sampleAt(SIM, Math.max(c.tClose - 0.002, 0), {}).H[PHYS.C.N] : 0;
    const jk = PHYS.joukowsky(SIM.vc);
    return en ? `<span class="tag">water hammer</span>The valve shut: valve-side pressure jumped from ${n(fx(before, 1) + ' m')} to ${w(fx(L.peakH, 1) + ' m')} of head. Without the delivery valve it would hit ${n(fx(jk, 0) + ' m')} (a·Δv/g).`
      : `<span class="tag">수격</span>밸브가 닫히자 밸브 쪽 압력이 ${n(fx(before, 1) + ' m')}에서 ${w(fx(L.peakH, 1) + ' m')} 수두로 뛰었습니다. 송출 밸브가 없었다면 ${n(fx(jk, 0) + ' m')}까지 올랐을 압력입니다(a·Δv/g).`;
  }
  if (s.phase === 'deliver') return en ? `<span class="tag">delivering</span>The slowing water column pushes ${n(fL(L.VdBeat * 1000) + ' L')} per beat up ${w(fx(P.h, 0) + ' m')} — ${fx(P.h / P.H, 1)}× higher than it fell.`
    : `<span class="tag">송출</span>멈춰 가는 물기둥이 한 박자에 ${n(josa(fL(L.VdBeat * 1000) + ' L', '을/를'))} ${w(fx(P.h, 0) + ' m')} 위로 밀어 올리는 중. 떨어진 높이의 ${n(fx(P.h / P.H, 1) + '배')}입니다.`;
  return en ? `<span class="tag">recoil</span>Recoil: pressure at the valve drops to ${n(fx(L.minH, 1) + ' m')}, below the ${w(fx(SIM.Hre, 2) + ' m')} the weight needs, so the waste valve falls open again.`
    : `<span class="tag">되튐</span>되튐으로 밸브 쪽 압력이 ${n(fx(L.minH, 1) + ' m')}까지 떨어집니다. 추가 버티는 ${w(fx(SIM.Hre, 2) + ' m')}보다 낮아 폐수 밸브가 다시 열립니다.`;
}

// 투어 문장 (조작 전 목적 / 조작 후 바뀐 값과 이유)
const TOUR_TXT = {
  start: {
    ko: ['첫 박자', '펌프는 멈춘 상태입니다. <b>폐수 밸브를 눌러</b> 물길을 열어 보세요. 무엇이 물을 위로 올리는지 봅니다.'],
    en: ['First beat', 'The pump is at rest. <b>Press the waste valve</b> to open the outlet and watch what lifts the water.'],
    after: () => (LANG === 'en' ? `The valve shut by itself at ${fx(SIM.vc, 2)} m/s and the first ${fL(SIM.cycles[0].Vd * 1000)} L went up. Nothing but falling water did the work.` : `밸브가 ${fx(SIM.vc, 2)} m/s에서 스스로 닫혔고, 첫 ${fL(SIM.cycles[0].Vd * 1000)} L가 위로 올라갔습니다. 떨어지는 물 말고는 아무 힘도 쓰지 않았습니다.`),
  },
  pressure: {
    ko: ['숨은 압력', '압력장을 켜고 슬로모션으로 한 박자를 지켜보세요. 밸브가 닫히는 순간 <b>관 속에서 무엇이 달려가는지</b> 봅니다.'],
    en: ['Hidden pressure', 'Pressure view is on, in slow motion. Watch <b>what races up the pipe</b> the instant the valve shuts.'],
    after: () => (LANG === 'en' ? `A high-pressure front ran up the pipe at ${PHYS.C.a} m/s. At the valve the head peaked at ${fx(SIM.limit.peakH, 1)} m, held to the lift height by the open delivery valve.` : `고압 파면이 초속 ${PHYS.C.a} m로 관을 거슬러 달렸습니다. 밸브 쪽 수두는 ${fx(SIM.limit.peakH, 1)} m에서 멈췄는데, 열린 송출 밸브가 압력을 양수 높이에 묶기 때문입니다.`),
  },
  height: {
    ko: ['높이와 양', '송출 탱크를 <b>위나 아래로 10 m 이상</b> 끌어 보세요. 높이를 바꾸면 무엇이 달라지는지 봅니다.'],
    en: ['Height vs amount', 'Drag the delivery tank <b>10 m or more</b> up or down. See what changes with height.'],
    after: () => {
      const a = TOUR.ctx.h0, b = SIM.par.h, v0 = TOUR.ctx.v0 * 1000, v1 = SIM.limit.VdBeat * 1000;
      return LANG === 'en' ? `${fx(a, 0)} m → ${fx(b, 0)} m: each beat now lifts ${fL(v1)} L instead of ${fL(v0)} L. A higher head stops the water column sooner (V ∝ 1/(h−H)).`
        : `${fx(a, 0)} m → ${fx(b, 0)} m: 한 박자 송출량이 ${fL(v0)} L에서 ${fL(v1)} L로 바뀌었습니다. 높을수록 물기둥이 더 빨리 멈춰서 덜 밀어 올립니다(V ∝ 1/(h−H)).`;
    },
  },
  valve: {
    ko: ['밸브 조율', '밸브 위 <b>황동 추</b>(또는 콘솔 슬라이더)로 무게를 바꿔 <b>양수량이 가장 큰 무게</b>를 찾아보세요. 너무 무거우면 어떻게 될까요?'],
    en: ['Tune the valve', 'Change the <b>brass weight</b> (or the console slider) to find the <b>weight that lifts the most</b>. What if it is too heavy?'],
    after: () => (LANG === 'en' ? `${Math.round(SIM.par.m * 1000)} g gives ${fx(SIM.limit.q, 1)} L/min (best found by the model: ${fx(TOUR.ctx.qBest.q, 1)} L/min at ${Math.round(TOUR.ctx.qBest.m * 1000)} g). Heavier means faster flow before closing, more per beat but fewer beats; too heavy and it never closes.` : `${Math.round(SIM.par.m * 1000)} g에서 ${fx(SIM.limit.q, 1)} L/분입니다(모델로 찾은 최대: ${Math.round(TOUR.ctx.qBest.m * 1000)} g에서 ${fx(TOUR.ctx.qBest.q, 1)} L/분). 무거울수록 더 빨라진 뒤 닫혀 한 박자 양은 늘지만 박자가 줄고, 너무 무거우면 아예 닫히지 않습니다.`),
  },
  energy: {
    ko: ['에너지 장부', '공급 탱크 승강대를 <b>0.5 m 이상</b> 올리거나 내려 보세요. 왼쪽 에너지 막대를 비교합니다. 공짜 에너지일까요?'],
    en: ['The energy ledger', 'Raise or lower the supply tank by <b>0.5 m or more</b> and compare the energy bars. Is it free energy?'],
    after: () => {
      const L = SIM.limit, P = SIM.par, pin = 1000 * 9.81 * (L.Q + L.q) / 60000 * P.H, pout = 1000 * 9.81 * L.q / 60000 * P.h;
      return LANG === 'en' ? `Falling water delivers ${fx(pin, 0)} W; the lifted water gains ${fx(pout, 0)} W. Efficiency ${fx(L.eta * 100, 0)}% — always below 100%. The ram trades a lot of water falling a little for a little water rising a lot.`
        : `떨어지는 물이 내놓는 힘은 ${fx(pin, 0)} W, 올라간 물이 얻는 힘은 ${fx(pout, 0)} W. 효율 ${fx(L.eta * 100, 0)}%로 언제나 100%보다 작습니다. 많은 물을 조금 떨어뜨려 적은 물을 높이 올리는 교환입니다.`;
    },
  },
  final: {
    ko: ['내가 만든 펌프', '지금 맞춘 조건 그대로 시네마틱 보기를 돌립니다. 다른 시나리오(1–4)도 비교해 보세요.'],
    en: ['Your pump', 'Your settings stay as they are while the cinematic view runs. Try scenarios 1–4 to compare.'],
    after: () => (LANG === 'en' ? `Your pump: H ${fx(SIM.par.H)} m, h ${fx(SIM.par.h, 0)} m, ${Math.round(SIM.par.m * 1000)} g → ${fx(SIM.limit.q, 1)} L/min at ${fx(SIM.limit.eta * 100, 0)}%.` : `내 펌프: H ${fx(SIM.par.H)} m, h ${fx(SIM.par.h, 0)} m, 추 ${Math.round(SIM.par.m * 1000)} g → ${fx(SIM.limit.q, 1)} L/분, 효율 ${fx(SIM.limit.eta * 100, 0)}%.`),
  },
};

const UI = {
  helpOpen: false,
  init() {
    document.querySelectorAll('[data-i18n]').forEach((el) => { const k = el.dataset.i18n; el.innerHTML = T(k); });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = T(el.dataset.i18nHtml); });
    const $ = (id) => document.getElementById(id);
    this.$ = $;
    // 프리셋
    const pr = $('presets');
    T('presets').forEach((name, i) => { const b = document.createElement('button'); b.innerHTML = `${name}<kbd>${i + 1}</kbd>`; b.onclick = () => { ensureAudio(); applyPreset(i); }; pr.appendChild(b); });
    // 슬라이더
    const bind = (id, name) => { const el = $(id); el.addEventListener('input', () => { setParam(name, +el.value); }); };
    bind('sH', 'H'); bind('sh', 'h'); bind('sm', 'm');
    // 오버레이
    const ov = $('overlays'); const cols = { P: '#bae6fd', F: '#ffcf9a', G: '#7dd3fc' };
    ['P', 'F', 'G'].forEach((k) => { const b = document.createElement('button'); b.className = 'tg'; b.style.setProperty('--dot', cols[k]); b.innerHTML = `<i></i>${T('ovl')[k]}<kbd>${k}</kbd>`; b.onclick = () => setOverlay(k, !S.overlays[k]); b.dataset.k = k; ov.appendChild(b); });
    // 보기 모드
    const vw = $('views');
    ['lab', 'explode', 'studio'].forEach((m, i) => { const b = document.createElement('button'); b.innerHTML = `${T('views')[i]}${i === 0 ? '<kbd>V</kbd>' : ''}`; b.dataset.v = m; b.onclick = () => setView(m); vw.appendChild(b); });
    // 속도
    const sp = $('speeds');
    [0.25, 0.5, 1, 2].forEach((v) => { const b = document.createElement('button'); b.textContent = `${v}×`; b.dataset.s = v; b.onclick = () => { S.speed = v; this.syncButtons(); }; sp.appendChild(b); });
    $('bPlay').onclick = () => togglePlay();
    $('bSlow').onclick = () => { S.slowmo = !S.slowmo; this.syncButtons(); };
    $('bSound').onclick = () => setSound(!S.sound);
    $('bTour').onclick = () => (TOUR.i >= 0 ? tourEnd() : tourGo(0));
    $('bCine').onclick = () => setCinematic(!CAM.cine);
    $('bReset').onclick = () => { restart(false); flyTo(heroShot(), 1.8); };
    $('bHelp').onclick = () => this.help(!this.helpOpen);
    if (window.__SITE__ && window.__SITE__.brand) $('bShare').style.display = 'none'; // 사이트 셸에 공유가 있다
    $('bShare').onclick = () => { if (window.__site) window.__site.share(); else if (navigator.share) navigator.share({ title: document.title, url: location.href }).catch(() => {}); };
    $('tourClose').onclick = () => tourEnd();
    $('tourPrev').onclick = () => tourGo(TOUR.i - 1);
    $('tourNext').onclick = () => (TOUR.i >= TOUR.steps.length - 1 ? tourEnd() : tourGo(TOUR.i + 1));
    $('help').addEventListener('click', (e) => { if (e.target.id === 'help') this.help(false); });
    $('panelToggle').onclick = () => { $('panel').classList.toggle('open'); this.sheet(); };
    this.buildHelp();
    this.labels = this.buildLabels();
    this.syncControls(); this.syncButtons();
  },
  sheet() { const h = document.getElementById('panel').getBoundingClientRect().height; document.documentElement.style.setProperty('--sheet', `${Math.round(h)}px`); },
  syncControls() {
    const $ = this.$;
    const set = (id, v, lo, hi) => { const el = $(id); el.value = v; el.style.setProperty('--p', `${((v - lo) / (hi - lo)) * 100}%`); };
    set('sH', S.H.tgt, 1, 4); set('sh', S.h.tgt, 5, 40); set('sm', S.m.tgt, 0.1, 0.9);
    $('sh').style.setProperty('--fill', '#7dd3fc'); $('sm').style.setProperty('--fill', '#e8c48a');
    $('vH').textContent = `${fx(S.H.tgt, 2)} m`; $('vh').textContent = `${fx(S.h.tgt, 1)} m`; $('vm').textContent = `${Math.round(S.m.tgt * 1000)} g`;
    [...$('presets').children].forEach((b, i) => b.setAttribute('aria-pressed', String(S.preset === i)));
  },
  syncButtons() {
    const $ = this.$; if (!$) return;
    [...$('overlays').children].forEach((b) => b.setAttribute('aria-pressed', String(!!S.overlays[b.dataset.k])));
    [...$('views').children].forEach((b) => b.setAttribute('aria-pressed', String(S.view === b.dataset.v)));
    [...$('speeds').children].forEach((b) => b.setAttribute('aria-pressed', String(S.speed === +b.dataset.s)));
    $('bSlow').setAttribute('aria-pressed', String(S.slowmo));
    $('bSound').setAttribute('aria-pressed', String(S.sound));
    $('bTour').setAttribute('aria-pressed', String(TOUR.i >= 0));
    $('bCine').setAttribute('aria-pressed', String(CAM.cine));
    document.getElementById('playIcon').setAttribute('d', S.playing ? 'M7 5h4v14H7zM13 5h4v14h-4z' : 'M8 5v14l11-7z');
  },
  dragHint(k) {
    const map = { H: 'dragH', h: 'dragh', m: 'dragm', slider: 'dragm', dialH: 'dragH', dialh: 'dragh' };
    if (k && map[k]) this.event(T(map[k]), 900);
  },
  event(msg, ms = 1800) {
    const el = this.$('event'); el.textContent = msg; el.classList.add('on');
    clearTimeout(this._ev); this._ev = setTimeout(() => el.classList.remove('on'), ms);
  },
  help(on) {
    this.helpOpen = on; this.$('help').classList.toggle('on', on);
    if (on) { S.wasPlaying = S.playing; }
  },
  buildHelp() {
    const en = LANG === 'en';
    const C = PHYS.C;
    this.$('helpBox').innerHTML = en ? `
      <button class="tbtn x" onclick="document.getElementById('help').classList.remove('on')">Close</button>
      <h2>Hydraulic ram</h2>
      <p>A ram pump uses the momentum of falling water to lift part of it far higher. Water speeds up through the drive pipe and spills out of the waste valve until the flow drags the valve shut. The sudden stop turns the column's momentum into a pressure spike (water hammer) that opens the delivery valve and pushes a gulp of water into the air chamber and up the delivery pipe. The recoil drops the pressure, the weighted valve falls open, and the beat repeats.</p>
      <h3>What the numbers come from</h3>
      <p>Every number, colour and caption comes from one physics module: a 1-D elastic water-hammer model solved by the method of characteristics (drive pipe in ${C.N} segments, Δt = ${(C.dt * 1000).toFixed(2)} ms).</p>
      <div class="eq">ΔH = a·Δv/g  (a = ${C.a} m/s)<br>V_beat ≈ A·v_c²·L / (2g(h−H))<br>η = q·h / ((Q+q)·H)<br>v_c² = 2mg / (ρ·C_d·A_v)</div>
      <h3>Exaggerated on screen</h3>
      <table><tr><th>What</th><th>Real</th><th>Shown</th></tr>
      <tr><td>Heights (tanks, head line)</td><td>1–40 m</td><td>square-root scale (40 m → ${PHYS.visHeight(40).toFixed(2)} m)</td></tr>
      <tr><td>Drive pipe length</td><td>${C.L} m</td><td>about 1.7 m</td></tr>
      <tr><td>Pipe diameter</td><td>${C.D * 1000} mm</td><td>about 90 mm</td></tr>
      <tr><td>The hammer instant</td><td>~0.05 s</td><td>slow-motion ×1/25 (toggle M)</td></tr>
      <tr><td>Air-chamber level swing</td><td>a few mm</td><td>about 10×</td></tr></table>
      <h3>Approximations and limits</h3>
      <ul><li>The air chamber is held at constant pressure (the lift height h).</li><li>Cavitation is crudely clipped at −9.5 m head.</li><li>No valve leakage or air loss: real rams run 10–20 points less efficient than shown.</li><li>The waste valve closes over ${C.tClosing * 1000} ms; the check valve seats after a small backflow (${C.vBack} m/s).</li></ul>
      <h3>Keys</h3><div class="keys">
      <span><kbd>1–4</kbd>scenarios</span><span><kbd>[ ]</kbd>supply head H</span><span><kbd>- =</kbd>lift height h</span><span><kbd>, .</kbd>valve weight</span>
      <span><kbd>P F G</kbd>overlays</span><span><kbd>V</kbd>view mode</span><span><kbd>Space</kbd>play/pause</span><span><kbd>M</kbd>slow-mo</span>
      <span><kbd>T</kbd>guided tour</span><span><kbd>C</kbd>cinematic</span><span><kbd>R</kbd>restart</span><span><kbd>/</kbd>hide UI</span>
      <span><kbd>WASD QE</kbd>move camera</span><span><kbd>N</kbd>sound</span></div>` : `
      <button class="tbtn x" onclick="document.getElementById('help').classList.remove('on')">닫기</button>
      <h2>수격펌프</h2>
      <p>수격펌프는 떨어지는 물의 운동량으로 그 물의 일부를 훨씬 높이 올립니다. 물이 구동관을 따라 빨라지며 폐수 밸브로 쏟아지다가, 흐름이 밸브를 끌어 올려 닫습니다. 갑자기 멈춘 물기둥의 운동량은 압력(수격)으로 바뀌어 송출 밸브를 열고 물 한 모금을 공기실과 송출관 위로 밀어 넣습니다. 되튐으로 압력이 떨어지면 추가 얹힌 밸브가 다시 열리고 박자가 반복됩니다.</p>
      <h3>숫자는 어디서 나오나</h3>
      <p>모든 숫자·색·문장은 물리 모듈 하나에서 나옵니다. 구동관을 ${C.N}구간으로 나눈 1차원 탄성 수격 모델을 특성곡선법으로 풉니다(Δt = ${(C.dt * 1000).toFixed(2)} ms).</p>
      <div class="eq">ΔH = a·Δv/g  (a = ${C.a} m/s)<br>한 박자 송출량 ≈ A·v_c²·L / (2g(h−H))<br>η = q·h / ((Q+q)·H)<br>v_c² = 2mg / (ρ·C_d·A_v)</div>
      <h3>화면에서 과장한 것</h3>
      <table><tr><th>무엇</th><th>실제</th><th>화면</th></tr>
      <tr><td>높이 (탱크·수두선)</td><td>1~40 m</td><td>제곱근 압축 눈금 (40 m → ${PHYS.visHeight(40).toFixed(2)} m)</td></tr>
      <tr><td>구동관 길이</td><td>${C.L} m</td><td>약 1.7 m</td></tr>
      <tr><td>관 지름</td><td>${C.D * 1000} mm</td><td>약 90 mm</td></tr>
      <tr><td>수격 순간</td><td>약 0.05초</td><td>슬로모션 ×1/25 (M으로 끔)</td></tr>
      <tr><td>공기실 수위 변화</td><td>수 mm</td><td>약 10배</td></tr></table>
      <h3>근사와 한계</h3>
      <ul><li>공기실은 일정 압력(양수 높이 h)으로 둡니다.</li><li>공동(진공 기포)은 수두 −9.5 m에서 단순히 자릅니다.</li><li>밸브 누수·공기 손실이 없어 실제 장치보다 효율이 10~20%p 높게 나옵니다.</li><li>폐수 밸브는 ${C.tClosing * 1000} ms에 걸쳐 닫히고, 송출 체크 밸브는 작은 역류(${C.vBack} m/s) 뒤에 앉습니다.</li></ul>
      <h3>단축키</h3><div class="keys">
      <span><kbd>1–4</kbd>시나리오</span><span><kbd>[ ]</kbd>공급 낙차 H</span><span><kbd>- =</kbd>양수 높이 h</span><span><kbd>, .</kbd>밸브 추 무게</span>
      <span><kbd>P F G</kbd>오버레이</span><span><kbd>V</kbd>보기 모드</span><span><kbd>Space</kbd>재생/일시정지</span><span><kbd>M</kbd>슬로모션</span>
      <span><kbd>T</kbd>가이드 투어</span><span><kbd>C</kbd>시네마틱</span><span><kbd>R</kbd>처음부터</span><span><kbd>/</kbd>UI 숨김</span>
      <span><kbd>WASD QE</kbd>카메라 이동</span><span><kbd>N</kbd>소리</span></div>`;
  },
  renderTour() {
    const $ = this.$, box = $('tour');
    this.syncButtons();
    if (TOUR.i < 0) { box.classList.remove('on'); $('caption').style.display = ''; return; }
    box.classList.add('on');
    const st = TOUR.steps[TOUR.i], tx = TOUR_TXT[st.id], L = tx[LANG] || tx.ko;
    $('tourStep').textContent = `${LANG === 'en' ? 'STEP' : '단계'} ${TOUR.i + 1} / ${TOUR.steps.length}`;
    $('tourTitle').textContent = L[0]; $('tourBody').innerHTML = L[1];
    const after = $('tourAfter');
    if (TOUR.passed) { after.innerHTML = tx.after(); after.classList.add('on'); } else after.classList.remove('on');
    $('tourDots').innerHTML = TOUR.steps.map((_, i) => `<i class="${i === TOUR.i ? 'cur' : TOUR.done[i] ? 'done' : ''}"></i>`).join('');
    $('tourPrev').disabled = TOUR.i === 0;
    $('tourNext').textContent = TOUR.i === TOUR.steps.length - 1 ? T('finish') : T('next');
    $('tourNext').classList.toggle('primary', !!TOUR.passed);
  },
  buildLabels() {
    const root = document.getElementById('labels');
    const mk = (key, color) => { const el = document.createElement('div'); el.className = 'lbl'; el.innerHTML = `<i style="background:${color};box-shadow:0 0 6px ${color}"></i><b>${T(key)}</b><span></span>`; root.appendChild(el); return { el, val: el.querySelector('span'), x: 0, y: 0 }; };
    return {
      tank: mk('lblTank', '#ffb36b'), pipe: mk('lblPipe', '#7dd3fc'), valve: mk('lblValve', '#86efac'),
      air: mk('lblAir', '#bae6fd'), dtank: mk('lblD', '#7dd3fc'), front: mk('lblFront', '#ffffff'),
    };
  },
  updateLabels(s) {
    const L = this.labels, W = innerWidth, H = innerHeight, en = LANG === 'en';
    const P = SIM.par, lim = SIM.limit;
    const items = [];
    const anchor = (k, p, txt, show = true) => {
      const it = L[k]; it.val.textContent = txt;
      const v = p.clone().project(camera);
      const vis = show && v.z < 1 && S.view !== 'studio' || (show && S.view === 'studio');
      const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
      it.ok = vis && v.z < 1 && x > 10 && x < W - 10 && y > 10 && y < H - 10;
      it.ax = x; it.ay = y; items.push(it);
    };
    const ys = supplySurfaceY(S.H.cur);
    anchor('tank', V3(TANK.x, ys + 0.2, TANK.z), `H ${fx(P.H, 2)} m`);
    const pm = HERO.curve.getPointAt(0.45);
    const jm = Math.round(0.45 * PHYS.C.N);
    anchor('pipe', pm.clone().add(V3(0, 0.1, 0)), `${fx(s.V[jm], 2)} m/s`);
    const vs = s.waste ? (s.phase === 'hammer' ? T('closing') : T('open')) : T('shut');
    anchor('valve', V3(VALVE.x + 0.04, DATUM + 0.42, RAM.z), `${vs} · ${Math.round(P.m * 1000)} g`);
    anchor('air', V3(CHAMBER.x - 0.05, DATUM + 0.5, CHAMBER.z), `${fx(PHYS.headToBar(P.h), 2)} bar`);
    anchor('dtank', V3(DTANK.x, nozzleY(S.h.cur) + 0.16, DTANK.z), `h ${fx(P.h, 0)} m · ${S.started && !lim.stalled ? fx(lim.q, 1) : '0.0'} ${T('perMin')}`);
    // 압력 파면: 수격 중 압력 기울기가 가장 큰 노드
    let fj = -1, fg = 0;
    if (s.phase === 'hammer') for (let j = 1; j < s.H.length; j++) { const g = Math.abs(s.H[j] - s.H[j - 1]); if (g > fg) { fg = g; fj = j; } }
    const showFront = fj > 0 && fg > 1.5 && S.overlays.P;
    if (showFront) anchor('front', HERO.curve.getPointAt((fj - 0.5) / PHYS.C.N).add(V3(0, 0.12, 0)), `${en ? '← ' : '← '}${PHYS.C.a} m/s`);
    else { L.front.ok = false; items.push(L.front); }
    // 겹침 조정: 위에서부터 차례로 아래로 민다
    const vis = items.filter((i) => i.ok).sort((a, b) => a.ay - b.ay);
    const placed = [], hud = hudRects(W, H);
    for (const it of vis) {
      const w = it.el.offsetWidth || 120, h = 22;
      const lx = Math.min(Math.max(it.ax, w / 2 + 6), W - w / 2 - 6); // 화면 밖으로 잘리지 않게
      let y = it.ay - 26;
      for (let tries = 0; tries < 6; tries++) {
        const clash = placed.find((p) => Math.abs(p.x - lx) < (p.w + w) / 2 + 6 && Math.abs(p.y - y) < h);
        if (!clash) break; y = clash.y - h - 2;
      }
      // HUD 블록 위로 올라가면 숨긴다(헤드라인·패널을 가리지 않게)
      if (hud.some((r) => lx + w / 2 > r.x0 && lx - w / 2 < r.x1 && y + h / 2 > r.y0 && y - h / 2 < r.y1)) { it.ok = false; continue; }
      placed.push({ x: lx, y, w });
      it.el.style.transform = `translate(${lx}px, ${y}px) translate(-50%,-50%)`;
      it.el.style.setProperty('--stem', `${Math.max(0, it.ay - y - 11)}px`);
    }
    for (const it of items) it.el.classList.toggle('hidden', !it.ok);
  },
  updateChips(s) {
    const $ = this.$, L = SIM.limit, P = SIM.par, en = LANG === 'en';
    const key = [S.started, S.needsRestart, L.stalled, P.H, P.h, P.m].join('|');
    if (key === this._chipKey) return; this._chipKey = key;
    if (!S.started) {
      $('cQ').innerHTML = '—'; $('cQs').textContent = T('notYet'); $('cE').innerHTML = '—'; $('cEs').textContent = T('notYet'); $('cP').innerHTML = '—'; $('cPs').textContent = T('notYet');
      $('eIn').textContent = '—'; $('eOut').textContent = '—'; $('eInB').style.width = '0%'; $('eOutB').style.width = '0%';
      return;
    }
    const q = L.stalled ? 0 : L.q;
    $('cQ').innerHTML = `${fx(q, 1)}<small>${T('perMin')}</small>`;
    $('cQs').textContent = `${T('waste')} ${fx(L.Q, 0)} ${T('perMin')}`;
    $('cE').innerHTML = `${fx(L.eta * 100, 0)}<small>%</small>`;
    $('cEs').textContent = L.stalled ? T('stopped') : `${fx(L.bpm, 0)} ${T('beats')} · ${T('perBeat')} ${fL(L.VdBeat * 1000)} L`;
    const pk = L.stalled && L.reason === 'noclose' ? Math.max(L.peakH, 0) : L.peakH;
    $('cP').innerHTML = `${fx(PHYS.headToBar(pk), 2)}<small>bar</small>`;
    $('cPs').textContent = `${fx(pk, 1)} ${T('head')} · ${T('ofSupply')} ×${fx(pk / P.H, 1)}`;
    const pin = 1000 * 9.81 * (L.Q + q) / 60000 * P.H, pout = 1000 * 9.81 * q / 60000 * P.h;
    $('eIn').textContent = `${fx(pin, 0)} W`; $('eOut').textContent = `${fx(pout, 0)} W`;
    $('eInB').style.width = pin > 0 ? '100%' : '0%'; $('eOutB').style.width = pin > 0 ? `${clamp(pout / pin, 0, 1) * 100}%` : '0%';
  },
};
