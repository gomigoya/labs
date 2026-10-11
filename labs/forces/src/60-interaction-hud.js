// ==== 12 INTERACTION ====
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const DRAG = { kind: null };
let pickables = [];
function tagPickables() {
  const tag = (o, k) => { o.userData.pick = k; pickables.push(o); };
  tag(HERO.obj, 'obj'); tag(HERO.jack, 'jack'); tag(HERO.beaker, 'jack'); tag(HERO.hScale, 'hscale');
  tag(HERO.block, 'block'); tag(HERO.surface, 'surface');
  tag(HERO.ts[0].root, 'F1'); tag(HERO.ts[1].root, 'F2');
  tag(CONSOLE.dialG.group, 'dialG'); tag(CONSOLE.dialJ.group, 'dialJ');
  tag(CONSOLE.sF1.group, 'sF1'); tag(CONSOLE.sF2.group, 'sF2'); tag(CONSOLE.button.group, 'button');
}
function pickAt(cx, cy) {
  ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(pickables, true);
  for (const h of hits) {
    let o = h.object;
    while (o && !o.userData.pick) o = o.parent;
    if (o && o.visible !== false && h.object.visible) return { kind: o.userData.pick, point: h.point, obj: o };
  }
  return null;
}
function screenOf(obj) { const p = new THREE.Vector3(); obj.getWorldPosition(p); p.project(camera); return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight }; }
const worldPerPixel = (point) => 2 * camera.position.distanceTo(point) * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / innerHeight;
const wrapAng = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const HANG_KINDS = ['obj', 'jack', 'hscale'], TRACK_KINDS = ['block', 'surface', 'F1', 'F2'];
const OBJS = ['weights', 'al', 'wood'], FLUIDS = ['water', 'brine', 'oil'], SURFS = ['glass', 'wood', 'sand'];
const cycle = (arr, v) => arr[(arr.indexOf(v) + 1) % arr.length];
function rayOnPlaneY(e, y) {
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -y), new THREE.Vector3());
}

function onPointerDown(e) {
  if (e.button !== 0) return;
  const hit = pickAt(e.clientX, e.clientY);
  if (!hit) return;
  ensureAudio();
  const k = hit.kind;
  if (HANG_KINDS.includes(k) && S.station !== 'hang') setStation('hang', false);
  if (TRACK_KINDS.includes(k) && S.station !== 'track') setStation('track', false);
  if (k === 'button') { togglePlay(); CONSOLE.button.press = 1; sfx('click'); return; }
  if (k === 'obj') { if (S.obj === 'weights') { setParam('n', (S.n.tgt + 1) % (PC.nMax + 1)); UI.event(T('evWeights')(S.n.tgt)); S.hv.v -= 0.05; } else setObj(cycle(OBJS, S.obj)); sfx('click'); return; }
  if (k === 'block') { setParam('load', (S.load.tgt + 1) % (PC.loadMax + 1)); UI.event(T('evLoad')(S.load.tgt)); sfx('click'); return; }
  if (k === 'surface') { setSurface(cycle(SURFS, S.surface)); sfx('click'); return; }
  if (k === 'hscale') { UI.event(T('evScale')); return; }
  controls.enabled = false; CAM.cine = false; CAM.fly = null;
  canvas.setPointerCapture(e.pointerId);
  DRAG.kind = k; DRAG.x0 = e.clientX; DRAG.y0 = e.clientY; DRAG.wpp = worldPerPixel(hit.point);
  DRAG.j0 = S.jack.tgt; DRAG.F0 = k === 'F1' ? S.F1.tgt : S.F2.tgt;
  if (k === 'F1' || k === 'F2') { const p = rayOnPlaneY(e, AXIS_Y); DRAG.px0 = p ? p.x : 0; DRAG.dir = k === 'F2' || S.same ? 1 : -1; }
  if (k === 'dialG' || k === 'dialJ') {
    const c = screenOf((k === 'dialG' ? CONSOLE.dialG : CONSOLE.dialJ).group);
    DRAG.c = c; DRAG.a0 = Math.atan2(e.clientY - c.y, e.clientX - c.x); DRAG.acc = 0;
    DRAG.f0 = k === 'dialG' ? (S.g.tgt - PC.gMin) / (PC.gMax - PC.gMin) : (S.jack.tgt - PC.jack.min) / (PC.jack.max - PC.jack.min);
  }
  if (k === 'sF1' || k === 'sF2') sliderFromPointer(e, k);
  canvas.style.cursor = 'grabbing';
  UI.dragHint(k);
}
function sliderFromPointer(e, k) {
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const sl = k === 'sF1' ? CONSOLE.sF1 : CONSOLE.sF2, g = sl.group;
  const n = new THREE.Vector3(0, 0, 1).applyQuaternion(g.getWorldQuaternion(new THREE.Quaternion()));
  const hit = ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(n, g.getWorldPosition(new THREE.Vector3())), new THREE.Vector3());
  if (!hit) return;
  const f = clamp(g.worldToLocal(hit.clone()).x / sl.len + 0.5, 0, 1);
  if (S.station !== 'track') setStation('track', false);
  setParam(k === 'sF1' ? 'F1' : 'F2', f * PC.trackMax);
}
function onPointerMove(e) {
  if (DRAG.kind) {
    const k = DRAG.kind, dy = -(e.clientY - DRAG.y0) * DRAG.wpp;
    if (k === 'jack') setParam('jack', DRAG.j0 + dy);
    else if (k === 'F1' || k === 'F2') { const p = rayOnPlaneY(e, AXIS_Y); if (p) setParam(k, DRAG.F0 + DRAG.dir * (p.x - DRAG.px0) * 20); }
    else if (k === 'sF1' || k === 'sF2') sliderFromPointer(e, k);
    else if (k === 'dialG' || k === 'dialJ') {
      const a = Math.atan2(e.clientY - DRAG.c.y, e.clientX - DRAG.c.x);
      DRAG.acc += wrapAng(a - DRAG.a0); DRAG.a0 = a;
      const f = clamp(DRAG.f0 + DRAG.acc / ARC_SWEEP, 0, 1);
      if (k === 'dialG') { let g = PC.gMin + f * (PC.gMax - PC.gMin); const near = PHYS.PLANETS.find((p) => Math.abs(p.g - g) < 0.18); if (near) g = near.g; setParam('g', g); }
      else setParam('jack', PC.jack.min + f * (PC.jack.max - PC.jack.min));
    }
    return;
  }
  if (e.pointerType === 'mouse') hoverQueue = { x: e.clientX, y: e.clientY };
}
let hoverQueue = null, hoverT = 0;
function hoverUpdate(dt) {
  hoverT += dt; if (!hoverQueue || hoverT < 0.06 || DRAG.kind) return;
  hoverT = 0; const h = pickAt(hoverQueue.x, hoverQueue.y); hoverQueue = null;
  canvas.style.cursor = h ? (['button', 'obj', 'block', 'surface', 'hscale'].includes(h.kind) ? 'pointer' : 'grab') : '';
}
function onPointerUp(e) {
  if (!DRAG.kind) return;
  DRAG.kind = null; controls.enabled = true; canvas.style.cursor = '';
  try { canvas.releasePointerCapture(e.pointerId); } catch {}
}

const KEYMAP = {};
function onKey(e) {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) { if (e.key !== 'Escape') return; }
  const k = e.key;
  if (k === 'Escape') { UI.modal(null); return; }
  if (UI.openModal && !['?', 'g', 'G', 'y', 'Y'].includes(k)) return;
  ensureAudio();
  const step = (name, d) => { setParam(name, S[name].tgt + d); sfx('tick'); };
  const tr = () => S.station !== 'track' && setStation('track', false), hg = () => S.station !== 'hang' && setStation('hang', false);
  switch (k) {
    case '1': case '2': case '3': case '4': applyPreset(+k - 1); break;
    case 'z': case 'Z': step('g', -0.2); break; case 'x': case 'X': step('g', 0.2); break;
    case '[': hg(); step('jack', -0.01); break; case ']': hg(); step('jack', 0.01); break;
    case '-': case '_': hg(); step('n', -1); break; case '=': case '+': hg(); if (S.obj !== 'weights') setObj('weights'); step('n', 1); break;
    case ',': case '<': tr(); step('F1', -0.1); break; case '.': case '>': tr(); step('F1', 0.1); break;
    case ';': case ':': tr(); step('F2', -0.1); break; case "'": case '"': tr(); step('F2', 0.1); break;
    case 'p': case 'P': tr(); setSame(!S.same); break;
    case 'o': case 'O': hg(); setObj(cycle(OBJS, S.obj)); break;
    case 'u': case 'U': hg(); setFluid(cycle(FLUIDS, S.fluid)); break;
    case 'b': case 'B': tr(); setSurface(cycle(SURFS, S.surface)); break;
    case 'j': case 'J': tr(); step('load', S.load.tgt >= PC.loadMax ? -PC.loadMax : 1); break;
    case 'h': case 'H': setStation(S.station === 'hang' ? 'track' : 'hang'); break;
    case 'f': case 'F': setOverlay('F', !S.overlays.F); break;
    case 'l': case 'L': setOverlay('L', !S.overlays.L); break;
    case 'k': case 'K': setOverlay('K', !S.overlays.K); break;
    case 'v': case 'V': setView(S.view === 'lab' ? 'studio' : 'lab'); break;
    case 't': case 'T': if (S.mode === 'kid') setMode('full'); LESSON.i >= 0 ? lessonEnd() : lessonGo(0); break;
    case 'g': case 'G': UI.modal(UI.openModal === 'guide' ? null : 'guide'); break;
    case 'y': case 'Y': UI.modal(UI.openModal === 'eval' ? null : 'eval'); break;
    case 'c': case 'C': setCinematic(!CAM.cine); break;
    case ' ': e.preventDefault(); togglePlay(); break;
    case 'r': case 'R': resetTrack(); flyTo(heroShot(), 1.8); break;
    case '/': e.preventDefault(); document.body.classList.toggle('hide-ui'); if (window.__site) window.__site.setVisible(!document.body.classList.contains('hide-ui')); break;
    case '?': UI.modal(UI.openModal === 'help' ? null : 'help'); break;
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
  const d = new THREE.Vector3().addScaledVector(fwd, f).addScaledVector(right, r).addScaledVector(V3(0, 1, 0), u).multiplyScalar(dt * 1.2);
  camera.position.add(d); controls.target.add(d);
}

// 소리 (기본 꺼짐): 틱, 버튼, 미끄러지는 소리, 범퍼, 단계 완료
const AUD = { ctx: null };
function ensureAudio() {
  if (!S.sound || AUD.ctx) return;
  const C = new (window.AudioContext || window.webkitAudioContext)();
  AUD.ctx = C; AUD.master = C.createGain(); AUD.master.gain.value = 0.5; AUD.master.connect(C.destination);
  const len = C.sampleRate * 2, buf = C.createBuffer(1, len, C.sampleRate), d = buf.getChannelData(0), Rn = mulberry32(9);
  for (let i = 0; i < len; i++) d[i] = Rn() * 2 - 1;
  AUD.noise = buf;
  const src = C.createBufferSource(); src.buffer = buf; src.loop = true;
  const bp = C.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.8;
  const g = C.createGain(); g.gain.value = 0;
  src.connect(bp).connect(g).connect(AUD.master); src.start();
  AUD.slide = g; AUD.bp = bp;
}
function sfx(kind) {
  if (!S.sound || !AUD.ctx) return;
  const C = AUD.ctx, t = C.currentTime, g = C.createGain(); g.connect(AUD.master);
  if (kind === 'tick' || kind === 'click') {
    const o = C.createOscillator(); o.type = 'square'; o.frequency.value = kind === 'tick' ? 2400 : 900;
    g.gain.setValueAtTime(kind === 'tick' ? 0.04 : 0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); o.connect(g); o.start(t); o.stop(t + 0.04);
  } else if (kind === 'clack' || kind === 'scrape') {
    const s = C.createBufferSource(); s.buffer = AUD.noise;
    const f = C.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = kind === 'clack' ? 500 : 1400; f.Q.value = 1.5;
    g.gain.setValueAtTime(kind === 'clack' ? 0.5 : 0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'clack' ? 0.14 : 0.2));
    s.connect(f).connect(g); s.start(t, rr(0, 1), 0.22);
  } else if (kind === 'win' || kind === 'pick' || kind === 'pop') {
    const notes = kind === 'win' ? [523, 659, 784, 1047] : kind === 'pick' ? [660, 990] : [784, 1175, 1568];
    notes.forEach((f, i) => { const o = C.createOscillator(), gg = C.createGain(), t0 = t + i * (kind === 'win' ? 0.09 : 0.06); o.type = 'triangle'; o.frequency.value = f; gg.gain.setValueAtTime(0.0001, t0); gg.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01); gg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32); o.connect(gg).connect(AUD.master); o.start(t0); o.stop(t0 + 0.34); });
  } else if (kind === 'ding') {
    const o = C.createOscillator(); o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(g); o.start(t); o.stop(t + 0.62);
  }
}
function setSound(on) { S.sound = on; if (on) ensureAudio(); if (AUD.ctx) { if (on) AUD.ctx.resume(); else AUD.ctx.suspend(); } UI.syncButtons(); }
function audioUpdate() {
  if (!AUD.ctx || !S.sound) return;
  const v = Math.abs(S.trk.v), mu = PHYS.SURFACES[S.surface].muk;
  AUD.slide.gain.setTargetAtTime(Math.min(0.2, v * 0.3 * mu * 2) * (S.playing ? 1 : 0), AUD.ctx.currentTime, 0.04);
  AUD.bp.frequency.setTargetAtTime(500 + v * 900 + (S.surface === 'sand' ? 1200 : 0), AUD.ctx.currentTime, 0.05);
}

// ==== 13 HUD ====
function hasBatchim(word) {
  const s = String(word).trim(); if (!s) return false;
  const ch = s[s.length - 1], code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  if (/[0-9]/.test(ch)) return '013678'.includes(ch);
  return { N: false, m: false, g: false, s: false, '%': false }[ch] ?? false;   // 뉴턴·미터·그램·초·퍼센트
}
function josa(word, pair) {
  const [a, b] = pair.split('/');
  if (pair === '으로/로') { const s = String(word), c = s.charCodeAt(s.length - 1), rieul = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 === 8; return word + (hasBatchim(word) && !rieul ? a : b); }
  return word + (hasBatchim(word) ? a : b);
}
const fx = (v, d = 1) => (Number.isFinite(v) ? (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d) : '—');
const en = () => LANG === 'en';

const TXT = {
  kicker: { ko: '힘의 작용<b> · FORCES</b>', en: 'How forces act<b> · FORCES</b>' },
  hook: { ko: '힘이 보인다', en: 'See the forces' },
  lead: {
    ko: '가만히 있는 물체도 힘을 받고 있습니다. 다만 그 힘들이 <em>서로 비겨</em> 있을 뿐이죠. 빛나는 화살표가 모든 힘을 보여 줍니다. <b>추를 클릭해 하나씩 걸고, 오른쪽 끌개를 끌어 도막을 당겨 보세요.</b>',
    en: 'Things sitting still are still being pushed and pulled; the forces just <em>cancel out</em>. Glowing arrows show every force. <b>Click the weights to add one, and drag the right puller to tug the block.</b>',
  },
  chipScale: { ko: '저울 눈금', en: 'Scale reads' }, chipBuoy: { ko: '부력', en: 'Buoyancy' }, chipNet: { ko: '도막 알짜힘', en: 'Net force on block' },
  close: { ko: '닫기', en: 'Close' }, prev: { ko: '이전', en: 'Back' }, next: { ko: '다음', en: 'Next' }, finish: { ko: '마치기', en: 'Finish' },
  scenario: { ko: '시나리오', en: 'Scenario' }, gravity: { ko: '중력 가속도 g', en: 'Gravity g' }, object: { ko: '매단 물체', en: 'Hanging object' },
  weights: { ko: '추 개수', en: 'Weights' }, jack: { ko: '수조 높이', en: 'Tank height' }, fluid: { ko: '액체', en: 'Liquid' },
  f1: { ko: '왼쪽 저울 F1', en: 'Left pull F1' }, f2: { ko: '오른쪽 저울 F2', en: 'Right pull F2' }, dir: { ko: '두 힘의 방향', en: 'Directions' },
  surface: { ko: '바닥 면', en: 'Surface' }, load: { ko: '짐 추 (200 g)', en: 'Extra load (200 g)' }, graph: { ko: '기록 그래프 (화면 B)', en: 'Record graph (screen B)' },
  lesson: { ko: '수업', en: 'Lesson' }, guide: { ko: '지도서', en: 'Guide' }, evalBtn: { ko: '평가', en: 'Assess' },
  hint: { ko: '추·도막·바닥 클릭 · 끌개·수조·다이얼 드래그 · 1–4 시나리오 · T 수업 · G 지도서 · Y 평가 · ? 도움말', en: 'Click weights, block, surface · drag pullers, tank, dials · 1–4 scenarios · T lesson · G guide · Y assess · ? help' },
  otherT: { ko: '다른 실험', en: 'Next lab' }, otherN: { ko: '모든 실험실 보기', en: 'See all labs' },
  presets: { ko: ['줄다리기 평형', '마찰이 버틴다', '달에서 잰 무게', '물속에서 가벼워짐'], en: ['Tug-of-war tie', 'Friction holds', 'Weighed on the Moon', 'Lighter underwater'] },
  stations: { ko: { hang: '매달기대 · 중력·탄성력·부력', track: '끌기대 · 마찰력·알짜힘' }, en: { hang: 'Hanging · gravity, spring, buoyancy', track: 'Track · friction, net force' } },
  objName: { ko: { weights: '황동 추', al: '알루미늄', wood: '나무' }, en: { weights: 'Brass weights', al: 'Aluminium', wood: 'Wood' } },
  fluidName: { ko: { water: '물', brine: '소금물', oil: '식용유' }, en: { water: 'Water', brine: 'Salt water', oil: 'Cooking oil' } },
  surfName: { ko: { glass: '유리', wood: '나무', sand: '사포' }, en: { glass: 'Glass', wood: 'Wood', sand: 'Sandpaper' } },
  dirName: { ko: ['반대 방향', '같은 방향'], en: ['Opposite', 'Same way'] },
  graphName: { ko: { hooke: '탄성력 F–x', buoy: '부력 눈금–깊이', vt: '속도–시간' }, en: { hooke: 'Spring F–x', buoy: 'Reading–depth', vt: 'Velocity–time' } },
  ovl: { ko: { F: '힘 화살표', L: '힘 이름표', K: '눈금자' }, en: { F: 'Force arrows', L: 'Force labels', K: 'Rulers' } },
  views: { ko: ['실험실', '스튜디오'], en: ['Lab', 'Studio'] },
  fW: { ko: '중력', en: 'Gravity' }, fT: { ko: '탄성력', en: 'Spring' }, fB: { ko: '부력', en: 'Buoyancy' }, fN: { ko: '수직항력', en: 'Normal' },
  fF1: { ko: '당김 F1', en: 'Pull F1' }, fF2: { ko: '당김 F2', en: 'Pull F2' }, ff: { ko: '마찰력', en: 'Friction' }, fBump: { ko: '범퍼', en: 'Bumper' }, fNet: { ko: '알짜힘', en: 'Net force' },
  lblScale: { ko: '용수철저울', en: 'Spring scale' }, lblBeaker: { ko: '수조', en: 'Tank' }, lblBlock: { ko: '나무 도막', en: 'Wood block' }, lblSurf: { ko: '바닥', en: 'Surface' },
  evStart: { ko: (e) => `움직이기 시작! 당긴 힘 ${fx(e.Fa, 2)} N (최대 정지 마찰력 ${fx(e.fsMax, 2)} N)`, en: (e) => `It slips! Pull ${fx(e.Fa, 2)} N (max static friction ${fx(e.fsMax, 2)} N)` },
  evBump: { ko: '범퍼에 닿았습니다 — R로 도막 되돌리기', en: 'Hit the bumper — press R to reset the block' },
  evWeights: { ko: (n) => `추 ${n}개 (${n * 50} g)`, en: (n) => `${n} weight${n === 1 ? '' : 's'} (${n * 50} g)` },
  evLoad: { ko: (n) => `짐 추 ${n}개 · 도막 전체 ${fx(PHYS.trackMass(n) * 1000, 0)} g`, en: (n) => `${n} load${n === 1 ? '' : 's'} · block total ${fx(PHYS.trackMass(n) * 1000, 0)} g` },
  evScale: { ko: '용수철저울: 1 N마다 5 cm 늘어납니다 (k = 20 N/m)', en: 'Spring scale: stretches 5 cm per newton (k = 20 N/m)' },
  dragF: { ko: '끌개를 끌어 당기는 힘 조절', en: 'Drag the puller to set the pull' }, dragJ: { ko: '수조 높이 조절', en: 'Raising/lowering the tank' }, dragG: { ko: '행성 다이얼: 중력 가속도', en: 'Planet dial: gravity' },
  floating: { ko: '떠 있음', en: 'floating' }, submerged: { ko: '잠김', en: 'submerged' },
  mode: {
    ko: { rest: '힘 없음 · 정지', balance: '두 힘 평형', held: '마찰이 버팀', slide: '미끄러지는 중', bump: '범퍼가 막음' },
    en: { rest: 'no pull · at rest', balance: 'balanced pulls', held: 'friction holds', slide: 'sliding', bump: 'stopped by bumper' },
  },
};
const T = (k) => (TXT[k] ? TXT[k][LANG] ?? TXT[k].ko : k);
const planetName = (g) => { const p = PHYS.nearPlanet(g); return p ? (en() ? { moon: 'Moon', mars: 'Mars', earth: 'Earth' } : { moon: '달', mars: '화성', earth: '지구' })[p.id] : null; };

// 캡션: 항상 실제 숫자 2~4개가 들어간 완결 문장
function captionFor() {
  const n = (v) => `<span class="n">${v}</span>`, w = (v) => `<span class="w">${v}</span>`, E = en();
  if (!S.hang || !S.F) return '';
  if (S.station === 'hang') {
    const r = S.hang, on = T('objName')[r.obj], pl = planetName(r.g);
    const gs = `${fx(r.g, 1)} m/s²${pl ? (E ? ` (${pl})` : `(${pl})`) : ''}`;
    if (r.empty) return E ? `<span class="tag">empty</span>Only the empty hanger is on the scale, so it reads ${n('0 N')}. Each 50 g weight you add will stretch the spring by ${w(fx(0.05 * r.g / PC.kHang * 100, 2) + ' cm')} at g = ${gs}.`
      : `<span class="tag">빈 걸이</span>빈 걸이만 걸려 있어 눈금은 ${n('0 N')}입니다. 50 g 추를 하나 걸 때마다 용수철이 ${w(fx(0.05 * r.g / PC.kHang * 100, 2) + ' cm')}씩 늘어납니다(g = ${gs}).`;
    if (S.settle < 0.15 && Math.abs(S.hv.v) > 0.01) return E ? `<span class="tag">settling</span>The spring is bouncing: right now it pulls ${n(fx(S.Tlive, 2) + ' N')}, and it settles where it balances gravity at ${w(fx(r.T, 2) + ' N')}.`
      : `<span class="tag">출렁임</span>용수철이 출렁이는 중: 지금 탄성력은 ${n(fx(S.Tlive, 2) + ' N')}이고, 중력과 비기는 ${w(fx(r.T, 2) + ' N')}에서 멈춥니다.`;
    if (r.floating) return E ? `<span class="tag">floating</span>The wood floats with ${n(fx(r.frac * 100, 0) + '%')} of it under the ${T('fluidName')[r.fluid].toLowerCase()}. Buoyancy ${w(fx(r.B, 2) + ' N')} equals its weight, so the string goes slack and the scale reads ${n('0 N')}.`
      : `<span class="tag">뜸</span>나무가 ${n(fx(r.frac * 100, 0) + '%')}만 잠긴 채 떠 있습니다. 부력 ${w(fx(r.B, 2) + ' N')}이 무게와 같아 줄이 느슨해지고 눈금은 ${n('0 N')}입니다.`;
    if (r.frac >= 0.999) return E ? `<span class="tag">fully under</span>Fully submerged: buoyancy ${w(fx(r.B, 2) + ' N')} = ρ·g·V = ${fx(r.rho, 0)} × ${fx(r.g, 1)} × 100 cm³. The scale drops from ${n(fx(r.W, 2) + ' N')} to ${n(fx(r.T, 2) + ' N')}, and going deeper changes nothing.`
      : `<span class="tag">완전히 잠김</span>완전히 잠겼습니다. 부력 ${w(fx(r.B, 2) + ' N')} = 액체 밀도 ${fx(r.rho, 0)} × g ${fx(r.g, 1)} × 부피 100 cm³. 눈금이 ${n(fx(r.W, 2) + ' N')}에서 ${n(fx(r.T, 2) + ' N')}로 줄었고, 더 깊이 넣어도 그대로입니다.`;
    if (r.inFluid) return E ? `<span class="tag">partly under</span>${n(fx(r.frac * 100, 0) + '%')} of the ${on.toLowerCase()} is under: the liquid pushes up ${w(fx(r.B, 2) + ' N')}, so the scale reads ${n(fx(r.T, 2) + ' N')} instead of ${fx(r.W, 2)} N. More depth, more buoyancy.`
      : `<span class="tag">일부 잠김</span>${josa(on, '이/가')} ${n(fx(r.frac * 100, 0) + '%')} 잠겨 액체가 위로 ${w(fx(r.B, 2) + ' N')}을 밀어 올립니다. 눈금이 ${fx(r.W, 2)} N에서 ${n(fx(r.T, 2) + ' N')}로 줄었습니다. 더 잠길수록 부력이 커집니다.`;
    return E ? `<span class="tag">balanced</span>Earth pulls the ${fx(r.m * 1000, 0)} g ${on.toLowerCase()} down with ${w(fx(r.W, 2) + ' N')} (g = ${gs}). The spring stretched ${n(fx(r.x * 100, 1) + ' cm')} and pulls up with the same ${n(fx(r.T, 2) + ' N')} — net force zero.`
      : `<span class="tag">평형</span>지구가 ${fx(r.m * 1000, 0)} g ${josa(on, '을/를')} ${w(fx(r.W, 2) + ' N')}의 중력으로 당깁니다(g = ${gs}). 용수철이 ${n(fx(r.x * 100, 1) + ' cm')} 늘어나 같은 크기 ${n(fx(r.T, 2) + ' N')}의 탄성력으로 떠받쳐 알짜힘은 0입니다.`;
  }
  const F = S.F, P = trackParams(), v = S.trk.v, sn = T('surfName')[S.surface];
  if (F.mode === 'bump') return E ? `<span class="tag">bumper</span>The bumper pushes back with ${w(fx(Math.abs(F.bump), 2) + ' N')}, so the net force is zero and the block stays put. Press R to put it back at the start (pull now ${n(fx(Math.abs(F.Fa), 2) + ' N')}).`
    : `<span class="tag">범퍼</span>범퍼가 ${w(fx(Math.abs(F.bump), 2) + ' N')}으로 되밀어 알짜힘이 0이라 도막이 멈춰 있습니다. R로 출발점에 되돌리세요(지금 당기는 힘 ${n(fx(Math.abs(F.Fa), 2) + ' N')}).`;
  if (v === 0) {
    if (F.mode === 'rest') return E ? `<span class="tag">at rest</span>Not moving, yet forces act: gravity ${w(fx(F.W, 2) + ' N')} down and the surface's normal force ${n(fx(F.N, 2) + ' N')} up cancel. Drag a puller to tug the block.`
      : `<span class="tag">정지</span>움직이지 않아도 힘은 작용합니다. 중력 ${w(fx(F.W, 2) + ' N')}(아래)와 바닥이 떠받치는 수직항력 ${n(fx(F.N, 2) + ' N')}(위)이 비깁니다. 끌개를 끌어 도막을 당겨 보세요.`;
    if (F.mode === 'balance') return E ? `<span class="tag">balanced</span>${n(fx(P.F1, 2) + ' N')} left and ${n(fx(P.F2, 2) + ' N')} right: equal size, opposite directions, on one line — net force ${w('0 N')}. The block stays at rest.`
      : `<span class="tag">평형</span>왼쪽 ${n(fx(P.F1, 2) + ' N')}, 오른쪽 ${n(fx(P.F2, 2) + ' N')}: 크기가 같고 방향이 반대이며 한 줄 위에 있어 알짜힘 ${w('0 N')}. 도막은 그대로 정지해 있습니다.`;
    return E ? `<span class="tag">friction holds</span>The pulls add to ${n(fx(Math.abs(F.Fa), 2) + ' N')}, but friction on ${sn.toLowerCase()} pushes back just as hard. It can reach at most ${w(fx(F.fsMax, 2) + ' N')} (μs ${fx(F.mus, 2)} × N ${fx(F.N, 2)} N).`
      : `<span class="tag">마찰이 버팀</span>당기는 힘의 합 ${n(fx(Math.abs(F.Fa), 2) + ' N')}을 ${sn} 바닥의 마찰력이 같은 크기로 막고 있습니다. 최대 정지 마찰력은 ${w(fx(F.fsMax, 2) + ' N')}(μs ${fx(F.mus, 2)} × 수직항력 ${fx(F.N, 2)} N)까지입니다.`;
  }
  const along = F.a * Math.sign(v), dirS = v > 0 ? (E ? 'right' : '오른쪽') : (E ? 'left' : '왼쪽');
  if (Math.abs(along) < 0.02) return E ? `<span class="tag">steady</span>The pull ${n(fx(Math.abs(F.Fa), 2) + ' N')} equals sliding friction ${n(fx(F.fk, 2) + ' N')}: net force zero, so the block keeps moving ${dirS} at a steady ${w(fx(Math.abs(v), 2) + ' m/s')}.`
    : `<span class="tag">등속</span>당기는 힘 ${n(fx(Math.abs(F.Fa), 2) + ' N')}과 운동 마찰력 ${n(fx(F.fk, 2) + ' N')}이 같아 알짜힘 0. 도막은 ${dirS}으로 ${w(fx(Math.abs(v), 2) + ' m/s')}를 그대로 유지합니다.`;
  if (along > 0) return E ? `<span class="tag">speeding up</span>Net force ${w(fx(Math.abs(F.net), 2) + ' N')} points the way it moves, so it speeds up by ${n(fx(Math.abs(F.a), 2) + ' m/s²')} (a = F/m, m = ${fx(F.M, 1)} kg). Now ${n(fx(Math.abs(v), 2) + ' m/s')} ${dirS}.`
    : `<span class="tag">빨라짐</span>알짜힘 ${w(fx(Math.abs(F.net), 2) + ' N')}이 운동 방향과 같아 1초에 ${n(fx(Math.abs(F.a), 2) + ' m/s')}씩 빨라집니다(질량 ${fx(F.M, 1)} kg). 지금 ${dirS}으로 ${n(fx(Math.abs(v), 2) + ' m/s')}.`;
  return E ? `<span class="tag">slowing down</span>Net force ${w(fx(Math.abs(F.net), 2) + ' N')} points against the motion, so the block loses ${n(fx(Math.abs(F.a), 2) + ' m/s')} every second. Now ${n(fx(Math.abs(v), 2) + ' m/s')} ${dirS}; keep it up and it will stop or turn back.`
    : `<span class="tag">느려짐</span>알짜힘 ${w(fx(Math.abs(F.net), 2) + ' N')}이 운동과 반대 방향이라 1초에 ${n(fx(Math.abs(F.a), 2) + ' m/s')}씩 느려집니다. 지금 ${dirS}으로 ${n(fx(Math.abs(v), 2) + ' m/s')}. 계속되면 멈추거나 방향이 바뀝니다.`;
}

// ---- 수업 단계 문장: [제목, 단계, 성취기준, 목표, 발문, 할 일], after = 조작 후 설명 ----
const LESSON_TXT = {
  intro: {
    ko: ['힘은 무엇을 바꿀까?', '도입', '9과05-01', '물체에 힘이 작용하면 모양이나 운동 상태가 변합니다. 오늘은 보이지 않는 힘을 화살표로 꺼내 봅니다.', '가만히 있는 도막도 힘을 받고 있을까요?', '오른쪽 <b>보라색 끌개</b>를 오른쪽으로 끌거나 콘솔의 F2 슬라이더를 올려 도막을 <b>5 cm 이상</b> 움직여 보세요.'],
    en: ['What do forces change?', 'Engage', '9Sci05-01', 'A force changes an object’s shape or motion. Today we pull the invisible forces out as arrows.', 'Is a block sitting still being pushed at all?', 'Drag the <b>violet puller</b> right (or raise F2) to move the block <b>at least 5 cm</b>.'],
    after: () => (en() ? `The block moved ${fx(S.dist * 100, 0)} cm. Before you pulled, the arrows were already there: gravity ${fx(S.F.W, 2)} N down, normal force ${fx(S.F.N, 2)} N up — they cancel, so nothing changed.` : `도막이 ${fx(S.dist * 100, 0)} cm 움직였습니다. 당기기 전에도 화살표는 있었습니다: 중력 ${fx(S.F.W, 2)} N(아래)과 수직항력 ${fx(S.F.N, 2)} N(위)이 비겨서 변화가 없었을 뿐입니다.`),
  },
  balance: {
    ko: ['힘의 표현과 평형', '전개', '9과05-01', '힘은 크기·방향·작용점으로 나타냅니다. 화살표 길이는 크기(1 N = 4.5 cm), 방향은 화살촉, 시작점은 작용점입니다.', '두 사람이 줄다리기를 하는데 줄이 움직이지 않는다면, 두 힘은 어떤 관계일까요?', '<b>유리 바닥</b>에서 F1과 F2를 <b>각각 1 N 이상, 같은 크기</b>로 맞춰 도막이 정지하게 하세요.'],
    en: ['Drawing forces & balance', 'Explore', '9Sci05-01', 'A force has size, direction and a point of action. Arrow length = size (1 N = 4.5 cm), the head = direction, the tail = where it acts.', 'In a tug-of-war that doesn’t move, how do the two pulls compare?', 'On <b>glass</b>, set F1 and F2 to the <b>same size, each ≥ 1 N</b>, with the block at rest.'],
    after: () => (en() ? `F1 ${fx(S.F1.tgt, 2)} N and F2 ${fx(S.F2.tgt, 2)} N: same size, opposite directions, same line → net force ${fx(Math.abs(S.F.net), 2)} N. That is the condition for balance (equilibrium).` : `F1 ${fx(S.F1.tgt, 2)} N과 F2 ${fx(S.F2.tgt, 2)} N: 크기가 같고, 방향이 반대이며, 같은 직선 위에 있어 알짜힘 ${fx(Math.abs(S.F.net), 2)} N. 이것이 두 힘의 평형 조건입니다.`),
  },
  same: {
    ko: ['나란한 두 힘의 합력', '전개', '9과05-01', '한 물체에 여러 힘이 작용하면, 모두 합한 힘(알짜힘)이 운동을 결정합니다. 나란한 힘만 다룹니다.', '두 사람이 같은 쪽으로 당기면 알짜힘은 얼마일까요?', '방향을 <b>같은 방향</b>(P)으로 바꾸고 두 힘을 <b>각각 0.5 N 이상</b>으로 하세요. 보라 화살표 두 개를 이은 길이와 노란 알짜힘 화살표를 비교하세요.'],
    en: ['Adding parallel forces', 'Explore', '9Sci05-01', 'When several forces act, their total (the net force) decides the motion. We only add forces along one line.', 'If two people pull the same way, what is the net force?', 'Switch to <b>same direction</b> (P) and make both pulls <b>≥ 0.5 N</b>. Compare the two violet arrows laid end to end with the yellow net arrow.'],
    after: () => (en() ? `Same way: ${fx(S.F1.tgt, 2)} + ${fx(S.F2.tgt, 2)} = ${fx(S.F1.tgt + S.F2.tgt, 2)} N. Opposite ways it would be ${fx(Math.abs(S.F2.tgt - S.F1.tgt), 2)} N, toward the bigger pull.` : `같은 방향: ${fx(S.F1.tgt, 2)} + ${fx(S.F2.tgt, 2)} = ${fx(S.F1.tgt + S.F2.tgt, 2)} N. 반대 방향이었다면 큰 힘 쪽으로 ${fx(Math.abs(S.F2.tgt - S.F1.tgt), 2)} N이 됩니다.`),
  },
  weight: {
    ko: ['질량과 무게', '전개', '9과05-02', '중력은 지구가 물체를 당기는 힘으로 늘 지구 중심(아래) 방향입니다. 무게 = 질량 × 중력 가속도(W = mg).', '달에 가면 추의 무엇이 달라지고, 무엇이 그대로일까요?', '추를 건 채 콘솔의 <b>행성 다이얼</b>(Z/X)을 <b>달</b>(g ≤ 4)로 돌려 보세요.'],
    en: ['Mass vs weight', 'Explore', '9Sci05-02', 'Gravity is Earth pulling an object toward its centre (down). Weight = mass × g (W = mg).', 'On the Moon, what about the weights changes and what stays the same?', 'With weights on, turn the <b>planet dial</b> (Z/X) to the <b>Moon</b> (g ≤ 4).'],
    after: () => { const r = S.hang; return en() ? `Mass stays ${fx(r.m * 1000, 0)} g, but the weight is now ${fx(r.W, 2)} N (on Earth ${fx(r.m * 9.8, 2)} N). A balance compares masses; a spring scale measures weight.` : `질량은 그대로 ${fx(r.m * 1000, 0)} g인데, 무게는 ${fx(r.W, 2)} N이 되었습니다(지구에서는 ${fx(r.m * 9.8, 2)} N). 윗접시저울은 질량을, 용수철저울은 무게를 잽니다.`; },
  },
  hooke: {
    ko: ['탐구: 용수철의 탄성력 측정하기', '탐구', '9과05-02', '탄성력은 변형된 물체가 원래 모양으로 돌아가려는 힘으로, 변형된 방향과 반대입니다. 추의 무게만큼 탄성력이 생깁니다.', '추를 2배로 걸면 늘어난 길이는 어떻게 될까요? 예상을 먼저 적어 보세요.', '지구(g = 9.8)에서 추를 <b>하나씩</b> 더 걸어(= 키 또는 추 클릭) <b>서로 다른 개수 4가지 이상</b>을 기록하세요. 화면 B에 점이 찍힙니다.'],
    en: ['Inquiry: measuring spring force', 'Inquiry', '9Sci05-02', 'A stretched spring pulls back toward its original shape — opposite to the stretch. It pulls as hard as the hanging weight.', 'If you double the weights, what happens to the stretch? Predict first.', 'On Earth (g = 9.8), add weights <b>one at a time</b> (= key or click) and record <b>at least 4 different counts</b>. Points appear on screen B.'],
    after: () => { const pts = S.rec.hooke.filter((q) => Math.abs(q.g - S.g.tgt) < 0.05); const k = PHYS.fitK(pts); return en() ? `${pts.length} points lie on one straight line through zero: F = k·x with k = ${fx(k, 1)} N/m. Twice the force, twice the stretch — that is why spring scales work.` : `${pts.length}개의 점이 원점을 지나는 한 직선 위에 있습니다: F = k·x, k = ${fx(k, 1)} N/m. 힘이 2배면 늘어난 길이도 2배 — 용수철저울이 무게를 재는 원리입니다.`; },
  },
  friction: {
    ko: ['마찰력', '전개', '9과05-02', '마찰력은 접촉면에서 운동을 방해하는 힘으로, 움직이려는(움직이는) 방향과 반대입니다.', '같은 도막이라도 무엇을 바꾸면 움직이기 더 어려울까요?', 'F2를 <b>천천히</b> 올려 도막이 막 움직이는 힘을 재세요(자동 기록). R로 되돌린 뒤 <b>바닥 면</b>(B)이나 <b>짐 추</b>(J)를 바꿔 <b>두 조건</b> 이상 측정하세요.'],
    en: ['Friction', 'Explore', '9Sci05-02', 'Friction acts along the contact surface, opposite to the way the object moves or tries to move.', 'For the same block, what makes it harder to start sliding?', 'Raise F2 <b>slowly</b> until the block just starts (auto-recorded). Press R, then change the <b>surface</b> (B) or the <b>load</b> (J) and measure <b>two or more conditions</b>.'],
    after: () => { const L = S.rec.fric.slice(-2); return en() ? `Measured: ${L.map((q) => `${T('surfName')[q.surface]}, load ${q.load} → ${fx(q.F, 2)} N`).join(' / ')}. Rougher surfaces and heavier blocks (more normal force) give more friction.` : `측정: ${L.map((q) => `${T('surfName')[q.surface]}·짐 ${q.load}개 → ${fx(q.F, 2)} N`).join(' / ')}. 접촉면이 거칠수록, 누르는 힘(무게)이 클수록 마찰력이 큽니다.`; },
  },
  buoy: {
    ko: ['탐구: 물속에서 부력 측정하기', '탐구', '9과05-02', '부력은 액체나 기체가 그 속의 물체를 위로 밀어 올리는 힘입니다. 부력 = 공기 중 무게 − 액체 속 저울 눈금.', '물체가 물에 잠길수록 저울 눈금은 어떻게 변할까요? 완전히 잠긴 뒤에는?', '<b>알루미늄</b>을 걸고 수조를 천천히 올려(드래그 또는 ]) <b>완전히 잠기게</b> 하세요. 화면 B에 눈금–잠긴 깊이가 그려집니다.'],
    en: ['Inquiry: buoyancy in water', 'Inquiry', '9Sci05-02', 'Buoyancy is the upward push of a liquid or gas on an object in it. Buoyancy = weight in air − reading in liquid.', 'As the object goes deeper, how does the reading change? And once it is fully under?', 'Hang the <b>aluminium</b> and raise the tank slowly (drag or ]) until it is <b>fully submerged</b>. Screen B plots reading vs depth.'],
    after: () => { const r = S.hang; return en() ? `In air ${fx(r.W, 2)} N, fully under ${fx(r.T, 2)} N → buoyancy ${fx(r.B, 2)} N. It grew with depth only until fully submerged. Try salt water (U) or the wood: same volume, same buoyancy when fully under.` : `공기 중 ${fx(r.W, 2)} N, 완전히 잠기면 ${fx(r.T, 2)} N → 부력 ${fx(r.B, 2)} N. 잠긴 부피가 커지는 동안만 커지고 완전히 잠긴 뒤에는 일정합니다. 소금물(U)이나 같은 부피의 나무와도 비교해 보세요.`; },
  },
  motion: {
    ko: ['알짜힘과 운동 상태의 변화', '전개', '9과05-03', '알짜힘이 0이 아니면 운동 상태(속력 또는 방향)가 변합니다. 알짜힘이 운동 방향이면 빨라지고, 반대면 느려집니다.', '움직이는 도막의 당기는 힘을 없애면 어떻게 될까요?', '도막이 왼쪽 끝에서 0.5× 느린 재생으로 기다립니다. F2를 <b>1 N 정도</b>로 올려 출발시킨 뒤, 가운데를 지나기 전에 F2를 0으로 내리거나 F1을 키우세요. 화면 B의 속도–시간 그래프에서 <b>빨라짐과 느려짐</b>을 모두 관찰하세요.'],
    en: ['Net force changes motion', 'Explore', '9Sci05-03', 'A non-zero net force changes the motion — speed or direction. Along the motion it speeds up; against it, it slows down.', 'What happens if you stop pulling a moving block?', 'The block waits at the left end, playing at 0.5×. Raise F2 to <b>about 1 N</b> to start it, then before mid-track drop F2 to 0 or raise F1. On screen B, observe <b>both speeding up and slowing down</b>.'],
    after: () => (en() ? `Speeding up ✓ · slowing down ✓${S.seen.rev ? ' · turned around ✓' : ''}. With no pull, sliding friction ${fx(S.F.fk, 2)} N alone slows it by ${fx(S.F.fk / S.F.M, 2)} m/s each second.` : `빨라짐 ✓ · 느려짐 ✓${S.seen.rev ? ' · 방향 바뀜 ✓' : ''}. 당기지 않으면 운동 마찰력 ${fx(S.F.fk, 2)} N만 남아 1초에 ${fx(S.F.fk / S.F.M, 2)} m/s씩 느려집니다.`),
  },
  design: {
    ko: ['설계: 버티는 도막', '적용', '9과05-04', '일상의 기구는 힘의 특징을 이용합니다(미끄럼 방지 신발, 저울, 구명조끼). 마찰력의 특징으로 장치를 설계해 봅니다.', '바닥과 무게 중 무엇을 바꾸면 미끄럼을 막을 수 있을까요?', '왼쪽 힘 0, <b>오른쪽 4 N 이상</b>으로 당겨도 도막이 <b>멈춰 있도록</b> 바닥 면과 짐 추를 설계하세요.'],
    en: ['Design: a block that holds', 'Apply', '9Sci05-04', 'Everyday devices use the features of forces (non-slip soles, scales, life jackets). Design with friction.', 'To stop slipping, would you change the surface or the weight?', 'With F1 = 0, make the block <b>stay put</b> under a <b>right pull of 4 N or more</b> by choosing the surface and loads.'],
    after: () => (en() ? `Holds at ${fx(S.F2.tgt, 2)} N: ${T('surfName')[S.surface]} with ${S.load.tgt} load(s) gives up to ${fx(S.F.fsMax, 2)} N of static friction (μs ${fx(S.F.mus, 2)} × ${fx(S.F.N, 2)} N).` : `${fx(S.F2.tgt, 2)} N에도 버팁니다: ${T('surfName')[S.surface]} 바닥 + 짐 ${S.load.tgt}개 → 최대 정지 마찰력 ${fx(S.F.fsMax, 2)} N(μs ${fx(S.F.mus, 2)} × ${fx(S.F.N, 2)} N).`),
  },
  wrap: {
    ko: ['정리와 평가', '정리', '9과05-01~04', '오늘 본 힘: 중력(아래), 탄성력(변형 반대), 마찰력(운동 반대), 부력(위). 알짜힘이 0이면 운동 상태가 그대로, 0이 아니면 변합니다.', '가만히 있는 책상 위 책에 작용하는 힘을 화살표로 그릴 수 있나요?', '<b>평가</b>(Y)를 열어 형성평가·수행 기록·분류·설계·자기평가를 마치세요.'],
    en: ['Wrap-up & assessment', 'Review', '9Sci05-01–04', 'Today: gravity (down), spring force (against the stretch), friction (against motion), buoyancy (up). Zero net force → motion unchanged; otherwise it changes.', 'Can you draw the forces on a book resting on a desk?', 'Open <b>Assess</b> (Y) and finish the quiz, records, sorting, design and self-check.'],
    after: () => (en() ? 'Assessment opened. Your measurements from this session are already filled in.' : '평가 창을 열었습니다. 이번 수업의 측정 기록이 자동으로 채워져 있습니다.'),
  },
};

// ---- 교사용 지도서 ----
const STD = [
  ['9과05-01', '물체에 작용하는 힘을 화살표를 이용하여 나타내고, 힘의 평형을 이루는 조건을 설명할 수 있다.', '힘의 정의를 알고 힘을 크기와 방향으로 나타낼 수 있도록 하며, 나란한 힘의 합력만을 다루도록 한다.'],
  ['9과05-02', '중력, 탄성력, 마찰력, 부력을 이해하고, 각 힘의 특징을 크기와 방향으로 설명할 수 있다.', '중력을 지도할 때, 질량과 무게를 구별하도록 한다.'],
  ['9과05-03', '알짜힘이 0이 아닐 때 물체의 운동 상태가 변함을 알고, 그 예를 조사하여 분류할 수 있다.', '물체가 힘을 받았을 때 물체의 운동을 속력이 변하거나 운동 방향이 바뀌거나 두 가지가 모두 변하는 사례로 분류하도록 한다.'],
  ['9과05-04', '다양한 사례에서 작용하는 힘과 힘의 평형 관계를 설명하고, 일상생활에서 힘의 특징을 이용한 기구나 장치를 설계할 수 있다.', '바닥에 놓인 물체에 작용하는 힘을 설명할 때, 중력과 함께 바닥이 물체를 떠받치는 힘을 도입한다.'],
];
function guideHTML() {
  const stdRows = STD.map((s) => `<tr><td><span class="std">${s[0]}</span></td><td>${s[1]}<div class="note">해설: ${s[2]}</div></td></tr>`).join('');
  return `
  <button class="tbtn x" data-close>닫기</button><button class="tbtn x" data-print style="margin-right:6px">인쇄</button>
  <h2>교사용 지도서 · 힘의 작용</h2>
  <p class="note">2022 개정 과학과 교육과정(교육부 고시 제2022-33호 [별책 9]) 중학교 1~3학년 '(5) 힘의 작용'의 성취기준, 탐구 활동, 성취기준 해설, 적용 시 고려 사항을 근거로 구성했습니다. 특정 출판사 교과서·지도서의 쪽 번호와 순서는 반영하지 않았으므로, 학교 교과서 차례에 맞춰 차시를 조정하세요.</p>
  <div class="mtabs" role="tablist">${['단원 개관', '차시 계획', '탐구 활동', '발문·오개념', '평가 계획'].map((t, i) => `<button role="tab" data-tab="g${i}" aria-selected="${i === 0}">${t}</button>`).join('')}</div>
  <div class="mpane" id="g0">
    <h3>성취기준과 해설</h3><table>${stdRows}</table>
    <h3>탐구 활동 (교육과정 제시)</h3><ul><li>용수철의 탄성력 측정하기 → 수업 5단계</li><li>물속에서 부력 측정하기 → 수업 7단계</li><li>장난감이나 놀이 기구에서 힘의 작용 탐구하기 → 평가의 분류·설계 과제</li></ul>
    <h3>내용 체계 (운동과 에너지 영역)</h3>
    <table><tr><th>핵심 아이디어</th><td>자연과 일상생활 속의 여러 가지 힘은 물체의 속력과 운동 방향을 변화시키고, 물체의 운동은 힘과 에너지를 통해 예측할 수 있으며, 이는 안전한 일상생활의 토대가 된다.</td></tr>
    <tr><th>지식·이해</th><td>힘과 에너지: 힘 · 중력 · 마찰력 · 탄성력 · 부력</td></tr>
    <tr><th>과정·기능</th><td>문제를 찾아 정의하고 가설 설정하기 · 적절한 변인을 포함하여 탐구 설계하기 · 자료를 수집하고 그래프로 변환하여 해석하기 · 규칙성 추리하기 · 모형으로 설명·예측하기 · 과학적 증거에 기반하여 주장하기</td></tr>
    <tr><th>가치·태도</th><td>과학 유용성 · 과학 창의성 · 과학 문제 해결에 대한 개방성 · 안전·지속가능 사회에 기여</td></tr></table>
    <h3>연계</h3><p>초등학교 3~4학년군 '힘과 우리 생활' → 이 단원 → 고등학교 '통합과학1' 시스템과 상호작용, '물리학' 힘과 에너지.</p>
    <h3>적용 시 고려 사항 반영</h3><ul><li>힘을 글·그림 등 다양한 형태로 표현 → 모든 힘을 색 화살표와 이름표로 시각화하고, 평가에서 직접 설명을 쓰게 합니다.</li><li>사례 조사·분류 후 포스터·보고서 산출물 → 평가의 '분류'와 '설계' 결과를 인쇄해 포스터·보고서 초안으로 씁니다.</li></ul>
  </div>
  <div class="mpane" id="g1" hidden>
    <h3>4차시 운영안 (45분 기준)</h3>
    <table><tr><th>차시</th><th>성취기준</th><th>흐름 (실험실 단계)</th><th>수업 방법</th></tr>
    <tr><td>1</td><td>05-01</td><td><b>도입</b>(5분) 1단계: 도막 당기기, "가만히 있어도 힘이 있을까?"<br><b>전개</b>(30분) 2단계 평형 조건 → 3단계 같은 방향 합력. 화살표 길이를 눈금자(K)로 재어 크기 비교<br><b>정리</b>(10분) 줄다리기·책상 위 책의 힘 화살표 그리기</td><td>예상–관찰–설명(POE), 짝 토의</td></tr>
    <tr><td>2</td><td>05-02</td><td><b>도입</b> 시나리오 3 '달에서 잰 무게'로 질량·무게 구별(4단계)<br><b>전개</b> 탐구: 용수철의 탄성력 측정(5단계). 모둠별 예상 → 측정 → 그래프 → k 구하기<br><b>정리</b> 중력·탄성력의 방향 정리</td><td>모둠 탐구, 그래프 해석</td></tr>
    <tr><td>3</td><td>05-02</td><td><b>도입</b> 무거운 상자를 미는 경험 발문<br><b>전개</b> 6단계 마찰력(바닥·무게 변인 통제) → 탐구: 물속에서 부력 측정(7단계), 소금물·나무 비교<br><b>정리</b> 네 가지 힘을 크기·방향으로 표 정리</td><td>변인 통제 실험, 모둠 데이터 공유</td></tr>
    <tr><td>4</td><td>05-03, 04</td><td><b>도입</b> 놀이 기구 영상·사진<br><b>전개</b> 8단계 알짜힘과 운동(속도–시간 그래프) → 9단계 설계 과제<br><b>정리</b> 10단계 평가(형성평가·분류·설계·자기평가)</td><td>사례 분류, 설계 기반 학습</td></tr></table>
    <p class="note">실험실은 프로젝터 한 대로 교사가 시연(T 키 수업 모드)하거나, 1인 1기기로 학생이 직접 단계를 진행할 수 있습니다. 각 단계는 조건을 만족하면 자동으로 완료 표시가 됩니다.</p>
  </div>
  <div class="mpane" id="g2" hidden>
    <h3>탐구 1. 용수철의 탄성력 측정하기</h3>
    <p><b>목표</b> 용수철에 작용하는 힘과 늘어난 길이의 관계를 찾는다.<br><b>변인</b> 조작: 추의 개수(무게) · 종속: 늘어난 길이 · 통제: 용수철, 장소(g)</p>
    <ol><li>매달기대에서 빈 걸이의 눈금이 0인지 확인한다(영점).</li><li>50 g 추를 1개씩 걸며 정지한 뒤의 눈금(N)과 늘어난 길이(cm, 눈금자 K)를 기록한다. 실험실은 정지하면 자동 기록한다.</li><li>화면 B의 F–x 그래프에서 원점을 지나는 직선과 기울기 k를 확인한다.</li></ol>
    <p><b>예상 결과</b> 추 1개 0.49 N, 2.45 cm · k = 20 N/m. <b>실제 실험 유의점</b> 탄성 한계를 넘지 않게 하고, 추가 떨어지지 않도록 받침을 둔다.</p>
    <h3>탐구 2. 물속에서 부력 측정하기</h3>
    <p><b>목표</b> 부력의 크기를 측정하고 잠긴 부피와의 관계를 안다.<br><b>변인</b> 조작: 잠긴 깊이, 액체 종류 · 종속: 저울 눈금 · 통제: 물체 부피(100 cm³)</p>
    <ol><li>알루미늄 원기둥을 공기 중에서 단 눈금(무게)을 읽는다(2.65 N).</li><li>수조를 조금씩 올리며 잠긴 깊이에 따른 눈금을 기록한다(화면 B 자동 그래프).</li><li>부력 = 공기 중 무게 − 물속 눈금을 계산한다(완전히 잠김: 0.98 N).</li><li>소금물·식용유, 같은 부피의 나무로 바꿔 비교한다.</li></ol>
    <p><b>실제 실험 유의점</b> 물체가 비커 바닥·벽에 닿지 않게 하고, 물이 넘치지 않게 비커 크기를 고른다. 젖은 손으로 전기 기구를 만지지 않는다.</p>
    <h3>탐구 3. 장난감·놀이 기구에서 힘의 작용 탐구하기</h3>
    <p>평가 창 '분류' 탭의 사례로 시작해, 모둠별로 놀이 기구 하나를 골라 작용하는 힘(중력·수직항력·마찰력·탄성력·부력)을 화살표로 그리고 운동 변화(속력/방향/둘 다)를 분류한 뒤 포스터로 발표한다.</p>
  </div>
  <div class="mpane" id="g3" hidden>
    <h3>핵심 발문</h3><ul><li>가만히 있는 도막에 작용하는 힘이 있나요? 있다면 왜 움직이지 않나요?</li><li>달에 가면 추의 질량과 무게 중 무엇이 변하나요?</li><li>추를 2배로 걸면 늘어난 길이는? 그래프로 어떻게 확인할까요?</li><li>무거운 물체일수록 부력을 더 받을까요?</li><li>움직이는 도막에서 손을 떼면 왜 멈추나요?</li></ul>
    <h3>흔한 오개념과 실험실 처방</h3>
    <table><tr><th>오개념</th><th>실험실에서 보여 줄 것</th></tr>
    <tr><td>움직이지 않으면 힘이 없다.</td><td>정지한 도막에도 중력·수직항력(·마찰력) 화살표가 있고 합이 0임을 화면 A 힘 장부로 확인(1·2·9단계).</td></tr>
    <tr><td>질량과 무게는 같은 것이다.</td><td>행성 다이얼로 g만 바꾸면 질량(g 단위)은 그대로, 눈금(N)만 변함(4단계).</td></tr>
    <tr><td>무거운 물체가 부력을 더 받는다.</td><td>같은 부피의 알루미늄(270 g)과 나무(60 g): 완전히 잠기면 부력은 둘 다 0.98 N. 나무는 그 전에 떠서 덜 잠김(7단계).</td></tr>
    <tr><td>움직이려면 계속 힘이 필요하다(힘 = 속력).</td><td>당기는 힘과 운동 마찰력이 같으면 알짜힘 0으로 등속 운동, 힘을 빼면 마찰 때문에 느려짐(8단계, 속도–시간 그래프).</td></tr>
    <tr><td>마찰력은 늘 같은 크기다.</td><td>당기는 힘을 올리면 정지 마찰력도 같이 커지다가 최대 정지 마찰력에서 미끄러짐(6단계 캡션).</td></tr></table>
  </div>
  <div class="mpane" id="g4" hidden>
    <h3>성취수준 (A·B·C 3수준 예시)</h3>
    <table><tr><th>성취기준</th><th>A</th><th>B</th><th>C</th></tr>
    <tr><td>05-01</td><td>힘을 크기·방향·작용점으로 정확히 나타내고, 평형 조건 세 가지를 설명한다.</td><td>힘을 화살표로 나타내고, 평형일 때 두 힘의 크기가 같고 방향이 반대임을 안다.</td><td>도움을 받아 힘을 화살표로 나타낸다.</td></tr>
    <tr><td>05-02</td><td>네 힘의 크기·방향 특징을 측정 자료로 설명하고 질량과 무게를 구별한다.</td><td>네 힘의 방향을 설명하고 질량과 무게의 차이를 안다.</td><td>네 힘의 이름과 예를 안다.</td></tr>
    <tr><td>05-03</td><td>알짜힘과 운동 변화의 관계를 설명하고 사례를 세 유형으로 정확히 분류한다.</td><td>알짜힘이 0이 아니면 운동이 변함을 알고 대부분의 사례를 분류한다.</td><td>운동이 변하는 사례를 찾는다.</td></tr>
    <tr><td>05-04</td><td>힘의 평형으로 사례를 설명하고 힘의 특징을 근거로 장치를 설계한다.</td><td>바닥의 물체에 작용하는 힘을 설명하고 장치를 제안한다.</td><td>일상의 힘 이용 사례를 든다.</td></tr></table>
    <h3>평가 방법</h3><ul><li><b>형성평가</b>: 평가 창의 8문항(자동 채점, 문항별 성취기준 표시).</li><li><b>수행평가(탐구 보고서)</b>: 탄성력·부력 측정 기록과 결론. 기준 — 측정 4점 이상(2점), 그래프 해석(2점), 결론의 과학적 근거(2점).</li><li><b>분류·포스터</b>: 6개 사례 분류 + 놀이 기구 조사(05-03).</li><li><b>설계 과제</b>: 실험실 설계 성공 여부 + 장치 설계 설명(05-04).</li><li><b>자기평가</b>: 성취기준별 4문항 자기 점검.</li></ul>
    <p class="note">평가 결과는 학생 기기 브라우저에만 저장되며 서버로 보내지 않습니다. 결과 탭의 복사·인쇄로 제출받으세요.</p>
  </div>`;
}

// ---- 학생 평가 ----
const QUIZ = [
  { std: '05-01', q: '책상 위에 정지한 책에 대한 설명으로 옳은 것은?', o: ['힘을 하나도 받지 않는다', '중력과 책상이 떠받치는 힘이 평형을 이룬다', '중력만 받는다', '책상이 떠받치는 힘이 중력보다 크다'], a: 1, fb: '정지해 있어도 중력(아래)과 수직항력(위)을 받고, 두 힘이 평형입니다.' },
  { std: '05-01', q: '한 물체에 오른쪽으로 5 N, 왼쪽으로 3 N이 작용할 때 알짜힘은?', o: ['오른쪽 8 N', '오른쪽 2 N', '왼쪽 2 N', '0 N'], a: 1, fb: '반대 방향 힘은 빼고 큰 힘의 방향: 5 − 3 = 2 N, 오른쪽.' },
  { std: '05-01', q: '두 힘이 평형을 이루는 조건이 아닌 것은?', o: ['크기가 같다', '방향이 반대이다', '같은 직선 위에서 작용한다', '두 힘의 방향이 같다'], a: 3, fb: '평형: 크기 같음, 방향 반대, 같은 작용선.' },
  { std: '05-02', q: '질량 300 g인 물체를 달(g = 1.6 m/s²)에서 잰 무게는?', o: ['0.3 N', '0.48 N', '2.94 N', '300 g'], a: 1, fb: 'W = mg = 0.3 kg × 1.6 = 0.48 N. 질량은 300 g 그대로.' },
  { std: '05-02', q: 'k = 20 N/m인 용수철에 2 N을 걸면 늘어난 길이는?', o: ['2 cm', '10 cm', '20 cm', '40 cm'], a: 1, fb: 'x = F/k = 2/20 = 0.1 m = 10 cm.' },
  { std: '05-02', q: '같은 부피의 알루미늄과 나무를 물에 완전히 잠기게 했을 때 부력은?', o: ['알루미늄이 크다', '나무가 크다', '같다', '둘 다 0이다'], a: 2, fb: '부력은 잠긴 부피와 액체 밀도로 정해집니다. 물체의 무게와 무관.' },
  { std: '05-02', q: '마찰력에 대한 설명으로 옳은 것은?', o: ['항상 운동 방향으로 작용한다', '접촉면이 거칠수록 커진다', '물체가 무거울수록 작아진다', '정지한 물체에는 작용하지 않는다'], a: 1, fb: '마찰력은 운동(하려는) 방향과 반대이며 거칠수록, 누르는 힘이 클수록 큽니다.' },
  { std: '05-03', q: '오른쪽으로 움직이는 도막에 왼쪽으로 알짜힘이 작용하면?', o: ['속력이 점점 빨라진다', '속력이 일정하다', '속력이 점점 느려진다', '바로 멈춘다'], a: 2, fb: '알짜힘이 운동과 반대 방향이면 속력이 줄고, 계속되면 방향이 바뀝니다.' },
];
const SORT = [
  { t: '브레이크를 잡아 멈추는 자전거', a: 0 }, { t: '일정한 빠르기로 도는 회전목마의 말', a: 1 }, { t: '비스듬히 던져 올린 공', a: 2 },
  { t: '직선 미끄럼틀을 내려오는 아이', a: 0 }, { t: '앞뒤로 흔들리는 바이킹', a: 2 }, { t: '원 궤도를 일정한 빠르기로 도는 인공위성', a: 1 },
];
const SORT_OPT = ['속력만 변함', '운동 방향만 변함', '속력과 방향 모두 변함'];
const SELF = [['05-01', '힘을 화살표로 나타내고 평형 조건을 설명할 수 있다.'], ['05-02', '중력·탄성력·마찰력·부력의 크기와 방향을 설명할 수 있다.'], ['05-03', '알짜힘에 따라 운동이 어떻게 변하는지 사례로 설명할 수 있다.'], ['05-04', '힘의 특징을 이용한 장치를 설계할 수 있다.']];
const EV = (() => { try { return JSON.parse(localStorage.getItem('forces-eval') || '{}'); } catch { return {}; } })();
const saveEV = () => { try { localStorage.setItem('forces-eval', JSON.stringify(EV)); } catch {} };
function recTables() {
  const hk = S.rec.hooke.slice().sort((a, b) => a.g - b.g || a.n - b.n);
  const k = PHYS.fitK(hk.filter((q) => Math.abs(q.g - 9.8) < 0.05));
  const hT = hk.length ? `<table class="rec"><tr><th>추</th><th>질량 g</th><th>g m/s²</th><th>탄성력 N</th><th>늘어남 cm</th><th>F/x N/m</th></tr>${hk.map((q) => `<tr><td>${q.n}개</td><td>${fx(q.m * 1000, 0)}</td><td>${fx(q.g, 1)}</td><td>${fx(q.F, 2)}</td><td>${fx(q.x * 100, 2)}</td><td>${fx(q.F / q.x, 1)}</td></tr>`).join('')}</table><p class="note">지구 기록으로 구한 k = ${fx(k, 1)} N/m</p>` : '<p class="note">아직 기록이 없습니다 — 수업 5단계에서 추를 걸어 보세요.</p>';
  const by = S.rec.buoy.slice().sort((a, b) => (a.obj + a.fluid).localeCompare(b.obj + b.fluid) || a.s - b.s);
  const bT = by.length ? `<table class="rec"><tr><th>물체·액체</th><th>잠긴 깊이 cm</th><th>무게 N</th><th>눈금 N</th><th>부력 N</th></tr>${by.map((q) => `<tr><td>${T('objName')[q.obj]}·${T('fluidName')[q.fluid]}</td><td>${fx(q.s * 100, 2)}</td><td>${fx(q.W, 2)}</td><td>${fx(q.T, 2)}</td><td>${fx(q.B, 2)}</td></tr>`).join('')}</table>` : '<p class="note">아직 기록이 없습니다 — 수업 7단계에서 수조를 올려 보세요.</p>';
  const fT = S.rec.fric.length ? `<table class="rec"><tr><th>바닥</th><th>짐</th><th>수직항력 N</th><th>움직인 힘 N</th><th>최대 정지 마찰 N</th></tr>${S.rec.fric.map((q) => `<tr><td>${T('surfName')[q.surface]}</td><td>${q.load}개</td><td>${fx(q.N, 2)}</td><td>${fx(q.F, 2)}</td><td>${fx(q.fsMax, 2)}</td></tr>`).join('')}</table>` : '<p class="note">아직 기록이 없습니다 — 수업 6단계에서 F2를 천천히 올려 보세요.</p>';
  return { hT, bT, fT, hk, by, k };
}
function evalHTML() {
  const R = recTables(), ta = (id, ph) => `<textarea data-ev="${id}" rows="3" style="width:100%;background:rgba(0,0,0,.25);color:#f4ede4;border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:8px;font:13.5px/1.5 var(--sans)" placeholder="${ph}">${EV[id] || ''}</textarea>`;
  const quiz = QUIZ.map((q, i) => `<div class="qi" data-q="${i}"><div class="qh"><span>${q.q} <span class="std">${q.std}</span></span></div>${q.o.map((o, j) => `<label><input type="radio" name="q${i}" value="${j}" ${EV['q' + i] == j ? 'checked' : ''}> ${o}</label>`).join('')}<div class="fb"></div></div>`).join('');
  const sort = SORT.map((s, i) => `<tr><td>${s.t}</td><td><select data-ev="s${i}" style="background:#2a241f;color:#f4ede4;border:1px solid rgba(255,255,255,.2);border-radius:6px;padding:4px"><option value="">선택</option>${SORT_OPT.map((o, j) => `<option value="${j}" ${EV['s' + i] == j ? 'selected' : ''}>${o}</option>`).join('')}</select></td><td class="sfb"></td></tr>`).join('');
  const self = SELF.map((s, i) => `<div class="qi"><div class="qh" style="display:block"><span class="std">${s[0]}</span>${s[1]}</div><div class="likert">${[1, 2, 3, 4, 5].map((v) => `<label><input type="radio" name="self${i}" value="${v}" ${EV['self' + i] == v ? 'checked' : ''}> ${v}</label>`).join('')}</div></div>`).join('');
  return `
  <button class="tbtn x" data-close>닫기</button>
  <h2>평가 · 힘의 작용</h2>
  <p><label>이름 <input data-ev="name" value="${EV.name || ''}" style="background:rgba(0,0,0,.25);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:6px;padding:4px 8px;font:inherit"></label></p>
  <div class="mtabs" role="tablist">${['형성평가', '수행 기록', '분류', '설계', '자기평가', '결과'].map((t, i) => `<button role="tab" data-tab="e${i}" aria-selected="${i === 0}">${t}</button>`).join('')}</div>
  <div class="mpane quiz" id="e0">${quiz}<button class="tbtn primary" data-grade>채점하기</button></div>
  <div class="mpane" id="e1" hidden>
    <h3>탐구 1. 용수철의 탄성력 <span class="std">05-02</span></h3>${R.hT}${ta('c1', '결론: 탄성력과 늘어난 길이의 관계는? (그래프 근거)')}
    <h3>탐구 2. 물속에서 부력 <span class="std">05-02</span></h3>${R.bT}${ta('c2', '결론: 잠긴 깊이(부피)에 따라 부력은 어떻게 변했나? 완전히 잠긴 뒤에는?')}
    <h3>마찰력 측정 <span class="std">05-02</span></h3>${R.fT}${ta('c3', '결론: 마찰력을 크게 만든 조건은? 변인 통제를 어떻게 했나?')}
  </div>
  <div class="mpane" id="e2" hidden><p>물체가 힘을 받았을 때 운동이 어떻게 변하는지 분류하세요. <span class="std">05-03</span></p><table>${sort}</table><button class="tbtn primary" data-sort style="margin-top:8px">확인</button>
    <h4>조사 과제</h4>${ta('c4', '내가 고른 놀이 기구·장난감: 작용하는 힘과 운동 변화(속력/방향/둘 다)')}</div>
  <div class="mpane" id="e3" hidden><p><span class="std">05-04</span> 실험실 설계 과제(수업 9단계): <b id="designState"></b></p>
    ${ta('c5', '힘의 특징(마찰력·탄성력·부력 중 하나 이상)을 이용한 생활 속 장치를 설계하세요. 무엇을, 어떤 힘의 어떤 특징으로, 어떻게 만들지 쓰세요. 예: 미끄럼 방지 슬리퍼, 간이 용수철저울, 페트병 구명 튜브')}
    ${ta('c6', '설계한 장치에서 힘의 평형이 어떻게 이루어지는지 설명하세요.')}</div>
  <div class="mpane" id="e4" hidden><p>1(전혀 못 함) ~ 5(아주 잘 함)</p>${self}${ta('c7', '오늘 가장 새롭게 안 것, 아직 헷갈리는 것')}</div>
  <div class="mpane" id="e5" hidden><div id="evResult"></div><div style="display:flex;gap:6px;margin-top:10px"><button class="tbtn primary" data-copy>결과 복사</button><button class="tbtn" data-print>인쇄 / PDF</button></div></div>`;
}
function evalScore() {
  const per = { '05-01': [0, 0], '05-02': [0, 0], '05-03': [0, 0], '05-04': [0, 0] };
  QUIZ.forEach((q, i) => { per[q.std][1]++; if (EV['q' + i] != null && +EV['q' + i] === q.a) per[q.std][0]++; });
  const R = recTables();
  const hk = new Set(R.hk.filter((q) => Math.abs(q.g - 9.8) < 0.05).map((q) => q.n)).size >= 4, bf = S.rec.buoy.some((q) => q.obj === 'al' && q.frac >= 0.999), fr = new Set(S.rec.fric.map((q) => q.surface + q.load)).size >= 2;
  per['05-02'][1] += 3; per['05-02'][0] += (hk ? 1 : 0) + (bf ? 1 : 0) + (fr ? 1 : 0);
  SORT.forEach((s, i) => { per['05-03'][1]++; if (EV['s' + i] !== '' && EV['s' + i] != null && +EV['s' + i] === s.a) per['05-03'][0]++; });
  per['05-03'][1]++; if (S.seen.acc && S.seen.dec) per['05-03'][0]++;
  const designOK = LESSON.done[8]; per['05-04'][1] += 2; per['05-04'][0] += (designOK ? 1 : 0) + ((EV.c5 || '').trim().length >= 30 ? 1 : 0);
  per['05-01'][1]++; if (LESSON.done[1]) per['05-01'][0]++;
  return { per, hk, bf, fr, designOK };
}
function evalResultHTML() {
  const { per, hk, bf, fr, designOK } = evalScore();
  let got = 0, tot = 0;
  const rows = Object.entries(per).map(([k, [a, b]]) => { got += a; tot += b; const p = b ? a / b : 0, lv = p >= 0.8 ? 'A' : p >= 0.5 ? 'B' : 'C'; return `<tr><td><span class="std">9과${k}</span></td><td>${a} / ${b}</td><td><span class="lv ${lv}">${lv}</span></td><td>${EV['self' + ['05-01', '05-02', '05-03', '05-04'].indexOf(k)] || '—'}</td></tr>`; }).join('');
  return `<p>${EV.name ? `<b>${EV.name}</b> · ` : ''}총점 <span class="score">${got} / ${tot}</span></p>
  <table><tr><th>성취기준</th><th>점수</th><th>성취수준</th><th>자기평가</th></tr>${rows}</table>
  <h4>수행 체크</h4><ul><li>탄성력 4점 이상 측정 ${hk ? '✓' : '—'}</li><li>알루미늄 완전 잠김 부력 측정 ${bf ? '✓' : '—'}</li><li>마찰력 두 조건 측정 ${fr ? '✓' : '—'}</li><li>빨라짐·느려짐 관찰 ${S.seen.acc && S.seen.dec ? '✓' : '—'}</li><li>설계 과제(4 N에도 정지) ${designOK ? '✓' : '—'}</li></ul>
  <p class="note">성취수준은 문항 정답률 기준 예시입니다(A ≥ 80%, B ≥ 50%). 서술 답안은 교사가 지도서의 수행평가 기준으로 따로 채점하세요.</p>`;
}
function evalText() {
  const { per } = evalScore(), R = recTables();
  const L = [`[힘의 작용 평가] ${EV.name || ''}`, ...Object.entries(per).map(([k, [a, b]]) => `9과${k}: ${a}/${b}`), '',
    '탄성력 기록: ' + R.hk.map((q) => `${q.n}개 ${fx(q.F, 2)}N ${fx(q.x * 100, 2)}cm`).join(', '), `k = ${fx(R.k, 1)} N/m`,
    '부력 기록: ' + R.by.map((q) => `${T('objName')[q.obj]}/${T('fluidName')[q.fluid]} ${fx(q.s * 100, 1)}cm ${fx(q.B, 2)}N`).join(', '),
    '마찰 기록: ' + S.rec.fric.map((q) => `${T('surfName')[q.surface]} 짐${q.load} ${fx(q.F, 2)}N`).join(', '), '',
    ...['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'].map((k, i) => `${['탄성력 결론', '부력 결론', '마찰력 결론', '놀이 기구 조사', '장치 설계', '평형 설명', '성찰'][i]}: ${EV[k] || ''}`)];
  return L.join('\n');
}

const UI = {
  openModal: null,
  init() {
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = T(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = T(el.dataset.i18nHtml); });
    const $ = (id) => document.getElementById(id); this.$ = $;
    const seg = (id, items, onClick, kbd) => { const el = $(id); items.forEach(([v, label], i) => { const b = document.createElement('button'); b.innerHTML = `${label}${kbd && kbd[i] ? `<kbd>${kbd[i]}</kbd>` : ''}`; b.dataset.v = v; b.onclick = () => { ensureAudio(); onClick(v); }; el.appendChild(b); }); };
    seg('presets', T('presets').map((n, i) => [i, n]), (i) => applyPreset(+i), ['1', '2', '3', '4']);
    seg('stations', Object.entries(T('stations')), (v) => setStation(v));
    seg('objects', Object.entries(T('objName')), (v) => setObj(v));
    seg('fluids', Object.entries(T('fluidName')), (v) => setFluid(v));
    seg('dirs', T('dirName').map((n, i) => [i, n]), (v) => setSame(+v === 1));
    seg('surfaces', Object.entries(T('surfName')), (v) => setSurface(v));
    seg('graphs', Object.entries(T('graphName')), (v) => setGraph(v));
    seg('views', [['lab', T('views')[0] + '<kbd>V</kbd>'], ['studio', T('views')[1]]], (v) => setView(v));
    seg('speeds', [0.25, 0.5, 1, 2].map((v) => [v, `${v}×`]), (v) => { S.speed = +v; this.syncButtons(); });
    $('gTicks').innerHTML = PHYS.PLANETS.map((p) => `<span>${(en() ? { moon: 'Moon', mars: 'Mars', earth: 'Earth' } : { moon: '달', mars: '화성', earth: '지구' })[p.id]} ${p.g}</span>`).join('');
    const bind = (id, name, st) => { const el = $(id); el.addEventListener('input', () => { if (st && S.station !== st) setStation(st, false); setParam(name, +el.value); }); };
    bind('sg', 'g'); bind('sn', 'n', 'hang'); bind('sj', 'jack', 'hang'); bind('sF1', 'F1', 'track'); bind('sF2', 'F2', 'track'); bind('sL', 'load', 'track');
    $('sn').addEventListener('input', () => { if (S.obj !== 'weights') setObj('weights'); });
    const ov = $('overlays'), cols = { F: '#fde68a', L: '#efe6db', K: '#bae6fd' };
    ['F', 'L', 'K'].forEach((k) => { const b = document.createElement('button'); b.className = 'tg'; b.style.setProperty('--dot', cols[k]); b.innerHTML = `<i></i>${T('ovl')[k]}<kbd>${k}</kbd>`; b.dataset.k = k; b.onclick = () => setOverlay(k, !S.overlays[k]); ov.appendChild(b); });
    $('bPlay').onclick = () => togglePlay();
    $('bSound').onclick = () => setSound(!S.sound);
    $('bLesson').onclick = () => (LESSON.i >= 0 ? lessonEnd() : lessonGo(0));
    $('bGuide').onclick = () => this.modal('guide');
    $('bEval').onclick = () => this.modal('eval');
    $('bCine').onclick = () => setCinematic(!CAM.cine);
    $('bReset').onclick = () => { resetTrack(); flyTo(heroShot(), 1.8); };
    $('bHelp').onclick = () => this.modal('help');
    if (window.__SITE__ && window.__SITE__.brand) $('bShare').style.display = 'none';
    $('bShare').onclick = () => { if (window.__site) window.__site.share(); else if (navigator.share) navigator.share({ title: document.title, url: location.href }).catch(() => {}); };
    $('lsClose').onclick = () => lessonEnd();
    $('lsPrev').onclick = () => lessonGo(LESSON.i - 1);
    $('lsNext').onclick = () => (LESSON.i >= LESSON.steps.length - 1 ? lessonEnd() : lessonGo(LESSON.i + 1));
    for (const id of ['help', 'guide', 'eval']) $(id).addEventListener('click', (e) => { if (e.target.id === id || e.target.closest('[data-close]')) this.modal(null); });
    $('panelToggle').onclick = () => { $('panel').classList.toggle('open'); this.sheet(); };
    this.labels = this.buildLabels();
    this.syncControls(); this.syncButtons();
  },
  sheet() { const h = document.getElementById('panel').getBoundingClientRect().height; document.documentElement.style.setProperty('--sheet', `${Math.round(h)}px`); },
  syncControls() {
    const $ = this.$; if (!$) return;
    const set = (id, v, lo, hi, col) => { const el = $(id); el.value = v; el.style.setProperty('--p', `${((v - lo) / (hi - lo)) * 100}%`); if (col) el.style.setProperty('--fill', col); };
    set('sg', S.g.tgt, PC.gMin, PC.gMax, '#ffb36b'); set('sn', S.n.tgt, 0, PC.nMax, '#e8c48a'); set('sj', S.jack.tgt, PC.jack.min, PC.jack.max, '#7dd3fc');
    set('sF1', S.F1.tgt, 0, PC.trackMax, '#c4b5fd'); set('sF2', S.F2.tgt, 0, PC.trackMax, '#c4b5fd'); set('sL', S.load.tgt, 0, PC.loadMax, '#e8c48a');
    const pl = planetName(S.g.tgt);
    $('vg').textContent = `${fx(S.g.tgt, 1)} m/s²${pl ? ` · ${pl}` : ''}`;
    $('vn').textContent = `${S.n.tgt} · ${S.n.tgt * 50} g`; $('vj').textContent = `${fx((S.jack.tgt - PC.jack.min) * 100, 1)} cm`;
    $('vF1').textContent = `${fx(S.F1.tgt, 2)} N`; $('vF2').textContent = `${fx(S.F2.tgt, 2)} N`; $('vL').textContent = `${S.load.tgt} · ${fx(PHYS.trackMass(S.load.tgt) * 1000, 0)} g`;
    const press = (id, f) => [...$(id).children].forEach((b) => b.setAttribute('aria-pressed', String(f(b.dataset.v))));
    press('presets', (v) => S.preset === +v); press('stations', (v) => S.station === v); press('objects', (v) => S.obj === v); press('fluids', (v) => S.fluid === v);
    press('dirs', (v) => (+v === 1) === S.same); press('surfaces', (v) => S.surface === v);
    $('grpHang').hidden = S.station !== 'hang'; $('grpTrack').hidden = S.station !== 'track';
    this.sheet();
  },
  syncButtons() {
    const $ = this.$; if (!$) return;
    [...$('overlays').children].forEach((b) => b.setAttribute('aria-pressed', String(!!S.overlays[b.dataset.k])));
    [...$('graphs').children].forEach((b) => b.setAttribute('aria-pressed', String(S.graph === b.dataset.v)));
    [...$('views').children].forEach((b) => b.setAttribute('aria-pressed', String(S.view === b.dataset.v)));
    [...$('speeds').children].forEach((b) => b.setAttribute('aria-pressed', String(S.speed === +b.dataset.v)));
    $('bSound').setAttribute('aria-pressed', String(S.sound)); $('bLesson').setAttribute('aria-pressed', String(LESSON.i >= 0));
    $('bGuide').setAttribute('aria-pressed', String(this.openModal === 'guide')); $('bEval').setAttribute('aria-pressed', String(this.openModal === 'eval'));
    $('bCine').setAttribute('aria-pressed', String(CAM.cine));
    $('playIcon').setAttribute('d', S.playing ? 'M7 5h4v14H7zM13 5h4v14h-4z' : 'M8 5v14l11-7z');
  },
  dragHint(k) { const m = { F1: 'dragF', F2: 'dragF', sF1: 'dragF', sF2: 'dragF', jack: 'dragJ', dialJ: 'dragJ', dialG: 'dragG' }; if (m[k]) this.event(T(m[k]), 900); },
  event(msg, ms = 1800) { const el = this.$('event'); el.textContent = msg; el.classList.add('on'); clearTimeout(this._ev); this._ev = setTimeout(() => el.classList.remove('on'), ms); },
  modal(name) {
    if (name && S.mode === 'kid' && name !== 'help') setMode('full');
    for (const id of ['help', 'guide', 'eval']) this.$(id).classList.toggle('on', id === name);
    this.openModal = name;
    if (name === 'help') this.$('helpBox').innerHTML = helpHTML();
    if (name === 'guide') { this.$('guideBox').innerHTML = guideHTML(); this.wireBox('guideBox'); }
    if (name === 'eval') { S.evalOpened = true; this.$('evalBox').innerHTML = evalHTML(); this.wireBox('evalBox'); this.wireEval(); }
    this.syncButtons();
  },
  wireBox(id) {
    const box = this.$(id);
    box.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => {
      box.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      box.querySelectorAll('.mpane').forEach((p) => (p.hidden = p.id !== b.dataset.tab));
      if (b.dataset.tab === 'e5') this.$('evResult').innerHTML = evalResultHTML();
    }));
    box.querySelectorAll('[data-print]').forEach((b) => (b.onclick = () => { box.querySelectorAll('.mpane').forEach((p) => (p.hidden = false)); const m = box.parentElement; m.classList.add('printing'); window.print(); m.classList.remove('printing'); }));
  },
  wireEval() {
    const box = this.$('evalBox');
    box.querySelectorAll('[data-ev]').forEach((el) => el.addEventListener('input', () => { EV[el.dataset.ev] = el.value; saveEV(); }));
    box.querySelectorAll('input[type=radio]').forEach((el) => el.addEventListener('change', () => { EV[el.name] = el.value; saveEV(); }));
    box.querySelector('[data-grade]').onclick = () => QUIZ.forEach((q, i) => {
      const d = box.querySelector(`[data-q="${i}"]`), v = EV['q' + i], ok = v != null && +v === q.a;
      d.classList.add('graded'); d.classList.toggle('right', ok); d.classList.toggle('wrong', !ok);
      d.querySelector('.fb').textContent = (ok ? '정답. ' : v == null ? '답을 고르세요. ' : `오답 (정답: ${q.o[q.a]}). `) + q.fb;
    });
    box.querySelector('[data-sort]').onclick = () => box.querySelectorAll('.sfb').forEach((td, i) => { const v = EV['s' + i]; td.textContent = v == null || v === '' ? '—' : +v === SORT[i].a ? '✓' : `✗ ${SORT_OPT[SORT[i].a]}`; td.style.color = v != null && +v === SORT[i].a ? 'var(--green)' : 'var(--red)'; });
    box.querySelector('#designState').textContent = LESSON.done[8] ? '완료 ✓' : '아직 — 수업 9단계에서 시도하세요';
    box.querySelector('[data-copy]').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(evalText()).then(() => this.event('결과를 복사했습니다'), () => {}); };
  },
  renderLesson() {
    const $ = this.$, box = $('lesson');
    this.syncButtons();
    document.body.classList.toggle('lesson-on', LESSON.i >= 0);
    if (LESSON.i < 0) { box.classList.remove('on'); return; }
    box.classList.add('on');
    const st = LESSON.steps[LESSON.i], tx = LESSON_TXT[st.id], L = tx[LANG] || tx.ko;
    $('lsStep').textContent = `${en() ? 'STEP' : '단계'} ${LESSON.i + 1} / ${LESSON.steps.length}`;
    $('lsPhase').textContent = L[1]; $('lsCode').textContent = L[2];
    $('lsTitle').textContent = L[0]; $('lsGoal').innerHTML = L[3];
    $('lsQ').dataset.l = en() ? "Teacher's question" : '생각해 보기'; $('lsQ').innerHTML = L[4];
    $('lsTask').innerHTML = `<b>${en() ? 'Do' : '할 일'} ›</b> ${L[5]}`;
    $('lsRec').innerHTML = this.lessonRec(st.id);
    const after = $('lsAfter');
    if (LESSON.passed) { after.innerHTML = '✓ ' + tx.after(); after.classList.add('on'); } else after.classList.remove('on');
    $('lsDots').innerHTML = LESSON.steps.map((_, i) => `<i class="${i === LESSON.i ? 'cur' : LESSON.done[i] ? 'done' : ''}"></i>`).join('');
    $('lsPrev').disabled = LESSON.i === 0;
    $('lsNext').textContent = LESSON.i === LESSON.steps.length - 1 ? T('finish') : T('next');
    $('lsNext').classList.toggle('primary', !!LESSON.passed);
  },
  lessonRec(id) {
    const E = en();
    if (id === 'hooke') { const pts = S.rec.hooke.filter((q) => Math.abs(q.g - S.g.tgt) < 0.05).sort((a, b) => a.n - b.n); if (!pts.length) return ''; return `<table class="rec"><tr><th>${E ? 'weights' : '추'}</th><th>F N</th><th>x cm</th><th>F/x</th></tr>${pts.map((q) => `<tr class="${q.key === S.newRec ? 'new' : ''}"><td>${q.n}</td><td>${fx(q.F, 2)}</td><td>${fx(q.x * 100, 2)}</td><td>${fx(q.F / q.x, 1)}</td></tr>`).join('')}</table>`; }
    if (id === 'friction') { const L = S.rec.fric.slice(-4); if (!L.length) return ''; return `<table class="rec"><tr><th>${E ? 'surface' : '바닥'}</th><th>${E ? 'load' : '짐'}</th><th>N</th><th>${E ? 'start F' : '움직인 힘'}</th></tr>${L.map((q) => `<tr><td>${T('surfName')[q.surface]}</td><td>${q.load}</td><td>${fx(q.N, 2)}</td><td>${fx(q.F, 2)} N</td></tr>`).join('')}</table>`; }
    if (id === 'buoy' && S.hang && S.obj !== 'weights') { const r = S.hang; return `<table class="rec"><tr><th>${E ? 'submerged' : '잠김'}</th><th>${E ? 'weight' : '무게'}</th><th>${E ? 'reading' : '눈금'}</th><th>${E ? 'buoyancy' : '부력'}</th></tr><tr class="new"><td>${fx(r.frac * 100, 0)}%</td><td>${fx(r.W, 2)} N</td><td>${fx(S.Tlive, 2)} N</td><td>${fx(r.B, 2)} N</td></tr></table>`; }
    if (id === 'motion') return `<p style="font-size:13px">${S.seen.acc ? '✓' : '○'} ${E ? 'speeding up' : '빨라짐'} &nbsp; ${S.seen.dec ? '✓' : '○'} ${E ? 'slowing down' : '느려짐'} &nbsp; ${S.seen.rev ? '✓' : '○'} ${E ? 'turned around (bonus)' : '방향 바뀜(도전)'}</p>`;
    if (id === 'design' && S.F) return `<p style="font-size:13px">${E ? 'max static friction' : '최대 정지 마찰력'} ${fx(S.F.fsMax, 2)} N · ${E ? 'pull' : '당기는 힘'} ${fx(S.F2.tgt, 2)} N</p>`;
    return '';
  },
  buildLabels() {
    const root = document.getElementById('labels');
    const mk = (color, cls = '') => { const el = document.createElement('div'); el.className = 'lbl ' + cls; el.innerHTML = `<i style="background:${color};box-shadow:0 0 6px ${color}"></i><b></b><span></span>`; root.appendChild(el); return { el, name: el.querySelector('b'), val: el.querySelector('span') }; };
    const L = { scale: mk('#86efac'), beaker: mk('#7dd3fc'), block: mk('#ffcf9a'), surf: mk('#d6d3d1') };
    for (const [g, set] of [['h', OVL.h], ['t', OVL.t]]) for (const k in set) L[g + k] = mk(hex(set[k].mat.uniforms.uColor.value.getHex()), 'force');
    return L;
  },
  updateLabels() {
    const L = this.labels, W = innerWidth, H = innerHeight, items = [], r = S.hang, F = S.F;
    if (!r || !F) return;
    const anchor = (k, p, name, txt, show = true) => {
      const it = L[k]; it.name.textContent = name; it.val.textContent = txt;
      const v = p.clone().project(camera), x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
      it.ok = show && v.z < 1 && x > 10 && x < W - 10 && y > 10 && y < H - 10; it.ax = x; it.ay = y; items.push(it);
    };
    const hang = S.station === 'hang';
    const kid = S.mode === 'kid';
    anchor('scale', V3(HS.x + 0.03, TOP + 0.70, HS.z), kid ? (isEn() ? 'Scale' : '저울') : T('lblScale'), kid ? `${fx(S.Tlive, 1)} N` : `${fx(S.Tlive, 2)} N · ${fx(S.hv.x * 100, 1)} cm`, hang);
    anchor('beaker', V3(HS.x + 0.07, TOP + r.beakerY + 0.05, HS.z + 0.07), T('fluidName')[r.fluid], `${fx(r.rho, 0)} kg/m³`, hang && r.inFluid && !kid);
    anchor('block', V3(blockX(S.trk.x), TRK_Y + 0.1 + S.load.tgt * PC.load.h, TRK.z), kid ? (isEn() ? 'Block' : '도막') : T('lblBlock'), kid ? (S.trk.v ? `${fx(Math.abs(S.trk.v), 1)} m/s` : '') : `${fx(F.M, 1)} kg · ${fx(Math.abs(S.trk.v), 2)} m/s`, !hang && !kid);
    anchor('surf', V3(blockX(S.trk.x) - 0.25, TRK_Y, TRK.z + 0.08), T('surfName')[S.surface] + (kid ? (isEn() ? ' floor' : ' 바닥') : ''), kid ? '' : `μs ${fx(F.mus, 2)} · μk ${fx(F.muk, 2)}`, !hang && !kid);
    const fl = S.overlays.L && S.overlays.F, names = { W: 'fW', T: 'fT', B: 'fB', N: 'fN', F1: 'fF1', F2: 'fF2', f: 'ff', bump: 'fBump', net: 'fNet' };
    for (const [g, set, on] of [['h', OVL.h, hang], ['t', OVL.t, !hang]]) for (const k in set) { const a = set[k]; anchor(g + k, a.tip, kid ? kidName(k) : T(names[k]), `${fx(a.N, kid ? 1 : 2)} N`, fl && on && a.on && !(kid && (k === 'bump' || (g === 't' && (k === 'W' || k === 'N'))))); }
    const vis = items.filter((i) => i.ok).sort((a, b) => a.ay - b.ay), placed = [], hud = hudRects(W, H);
    for (const it of vis) {
      const w = it.el.offsetWidth || 110, h = 22, lx = Math.min(Math.max(it.ax, w / 2 + 6), W - w / 2 - 6);
      let y = it.ay - 24;
      for (let t = 0; t < 6; t++) { const c = placed.find((p) => Math.abs(p.x - lx) < (p.w + w) / 2 + 6 && Math.abs(p.y - y) < h); if (!c) break; y = c.y - h - 2; }
      if (hud.some((q) => lx + w / 2 > q.x0 && lx - w / 2 < q.x1 && y + h / 2 > q.y0 && y - h / 2 < q.y1)) { it.ok = false; continue; }
      placed.push({ x: lx, y, w });
      it.el.style.transform = `translate(${lx}px, ${y}px) translate(-50%,-50%)`;
      it.el.style.setProperty('--stem', `${Math.max(0, it.ay - y - 11)}px`);
    }
    for (const k in L) L[k].el.classList.toggle('hidden', !L[k].ok);
  },
  updateChips() {
    const $ = this.$, r = S.hang, F = S.F, E = en(); if (!r || !F) return;
    $('c1').innerHTML = `${fx(S.Tlive, 2)}<small>N</small>`;
    $('c1s').textContent = r.empty ? (E ? 'empty hanger' : '빈 걸이') : `${T('objName')[r.obj]} ${fx(r.m * 1000, 0)} g · g ${fx(r.g, 1)}`;
    $('c2').innerHTML = `${fx(r.B, 2)}<small>N</small>`;
    $('c2s').textContent = r.inFluid ? `${r.floating ? T('floating') : T('submerged')} ${fx(r.frac * 100, 0)}% · ${T('fluidName')[r.fluid]}` : (E ? 'in air' : '공기 중');
    const net = Math.abs(F.net) < 0.005 ? 0 : F.net;
    $('c3').innerHTML = `${net === 0 ? '' : net > 0 ? '→ ' : '← '}${fx(Math.abs(net), 2)}<small>N</small>`;
    const along = S.trk.v !== 0 ? F.a * Math.sign(S.trk.v) : 0;
    $('c3s').textContent = S.trk.v === 0 ? T('mode')[F.mode] : (E ? (Math.abs(along) < 0.02 ? 'steady' : along > 0 ? 'speeding up' : 'slowing down') : (Math.abs(along) < 0.02 ? '등속' : along > 0 ? '빨라짐' : '느려짐')) + ` · ${fx(Math.abs(S.trk.v), 2)} m/s`;
  },
};

function helpHTML() {
  const E = en(), C = PC;
  return E ? `<button class="tbtn x" data-close>Close</button><h2>Forces</h2>
  <p>Every number, arrow length and sentence comes from one physics module. Arrows are drawn to scale (1 N = ${C.arrow * 100} cm); their moving chevrons only show direction — nothing flows.</p>
  <div class="eq">W = m·g &nbsp; F = k·x (k = ${C.kHang} N/m hanging, ${C.kTrack} N/m track)<br>static friction ≤ μs·N, sliding = μk·N, N = M·g<br>B = ρ_liquid·g·V_submerged &nbsp; a = F_net / M</div>
  <h3>Approximations</h3><ul><li>Massless springs and strings; no air drag.</li><li>The beaker never overflows; water level rises by the displaced volume.</li><li>Friction coefficients are typical values for each surface (glass ${PHYS.SURFACES.glass.mus}/${PHYS.SURFACES.glass.muk}, wood ${PHYS.SURFACES.wood.mus}/${PHYS.SURFACES.wood.muk}, sandpaper ${PHYS.SURFACES.sand.mus}/${PHYS.SURFACES.sand.muk}).</li><li>The spring bounce on screen is a damped visual of settling; recorded values are the equilibrium ones.</li></ul>
  <h3>Keys</h3><div class="keys"><span><kbd>1–4</kbd>scenarios</span><span><kbd>Z X</kbd>gravity</span><span><kbd>- =</kbd>weights</span><span><kbd>[ ]</kbd>tank height</span><span><kbd>O U</kbd>object, liquid</span><span><kbd>, .</kbd>F1</span><span><kbd>; '</kbd>F2</span><span><kbd>P</kbd>same/opposite</span><span><kbd>B J</kbd>surface, load</span><span><kbd>H</kbd>switch station</span><span><kbd>F L K</kbd>arrows, labels, rulers</span><span><kbd>T G Y</kbd>lesson, guide, assess</span><span><kbd>Space</kbd>play/pause</span><span><kbd>R</kbd>reset block</span><span><kbd>C</kbd>cinematic</span><span><kbd>/</kbd>hide UI</span><span><kbd>WASD QE</kbd>move camera</span><span><kbd>N</kbd>sound</span></div>`
  : `<button class="tbtn x" data-close>닫기</button><h2>힘의 작용</h2>
  <p>모든 숫자·화살표 길이·문장은 물리 모듈 하나에서 나옵니다. 화살표는 크기에 비례해 그립니다(1 N = ${C.arrow * 100} cm). 화살표 위를 흐르는 무늬는 방향 표시일 뿐, 무엇이 흐르는 것이 아닙니다.</p>
  <div class="eq">무게 W = m·g &nbsp; 탄성력 F = k·x (매달기 k = ${C.kHang} N/m, 끌기 ${C.kTrack} N/m)<br>정지 마찰력 ≤ μs·N, 운동 마찰력 = μk·N, 수직항력 N = M·g<br>부력 B = ρ_액체·g·V_잠김 &nbsp; 가속도 a = 알짜힘 / M</div>
  <h3>화살표 색</h3><p><span style="color:#ffb36b">■ 중력</span> &nbsp;<span style="color:#86efac">■ 탄성력</span> &nbsp;<span style="color:#7dd3fc">■ 부력</span> &nbsp;<span style="color:#f1efe9">■ 수직항력</span> &nbsp;<span style="color:#c4b5fd">■ 당기는 힘</span> &nbsp;<span style="color:#fca5a5">■ 마찰력</span> &nbsp;<span style="color:#fde68a">■ 알짜힘</span></p>
  <h3>근사와 과장</h3><ul><li>용수철·줄의 질량, 공기 저항은 무시합니다.</li><li>수조 물은 넘치지 않고, 잠긴 부피만큼 수면이 올라갑니다.</li><li>마찰 계수는 재질별 대표값입니다(정지/운동: 유리 ${PHYS.SURFACES.glass.mus}/${PHYS.SURFACES.glass.muk}, 나무 ${PHYS.SURFACES.wood.mus}/${PHYS.SURFACES.wood.muk}, 사포 ${PHYS.SURFACES.sand.mus}/${PHYS.SURFACES.sand.muk}).</li><li>용수철 출렁임은 평형으로 가는 모습을 보여 주는 감쇠 진동이며, 기록은 평형값으로 남깁니다.</li><li>끌개 대차는 일정한 힘으로 당기는 손의 대역입니다.</li></ul>
  <h3>단축키</h3><div class="keys"><span><kbd>1–4</kbd>시나리오</span><span><kbd>Z X</kbd>중력 가속도</span><span><kbd>- =</kbd>추 개수</span><span><kbd>[ ]</kbd>수조 높이</span><span><kbd>O U</kbd>물체, 액체</span><span><kbd>, .</kbd>F1</span><span><kbd>; '</kbd>F2</span><span><kbd>P</kbd>같은/반대 방향</span><span><kbd>B J</kbd>바닥, 짐 추</span><span><kbd>H</kbd>실험대 전환</span><span><kbd>F L K</kbd>화살표, 이름표, 눈금자</span><span><kbd>T G Y</kbd>수업, 지도서, 평가</span><span><kbd>Space</kbd>재생/일시정지</span><span><kbd>R</kbd>도막 되돌리기</span><span><kbd>C</kbd>시네마틱</span><span><kbd>/</kbd>UI 숨김</span><span><kbd>WASD QE</kbd>카메라 이동</span><span><kbd>N</kbd>소리</span></div>`;
}
