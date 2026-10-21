// ==== 12 INTERACTION ====
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const DRAG = { kind: null };
let pickables = [];
function tagPickables() {
  const tag = (o, k) => { o.userData.pick = k; pickables.push(o); };
  pickables.push(...BAL.picks);
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
    if (o && /^balance:(pan|tray):?/.test(o.userData.pick)) continue;
    if (o && o.userData.pick.startsWith('balance:pile:') && !S.balance[o.userData.pick.split(':')[2]].clips) continue;
    let shown = true; for (let parent = h.object; parent; parent = parent.parent) if (!parent.visible) shown = false;
    if (o && shown && (S.station !== 'balance' || o.userData.pick.startsWith('balance:'))) return { kind: o.userData.pick, point: h.point, obj: o };
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
  if (balanceDown(e, hit)) return;
  if (S.mode === 'kid' && kidPointer(k)) return;
  if (HANG_KINDS.includes(k) && S.station !== 'hang') setStation('hang', false);
  if (TRACK_KINDS.includes(k) && S.station !== 'track') setStation('track', false);
  if (k === 'button') { togglePlay(); CONSOLE.button.press = 1; sfx('click'); return; }
  if (k === 'obj') { if (S.obj === 'weights') { setParam('n', (S.n.tgt + 1) % (PC.nMax + 1));  S.hv.v -= 0.05; } else setObj(cycle(OBJS, S.obj)); sfx('click'); return; }
  if (k === 'block') { setParam('load', (S.load.tgt + 1) % (PC.loadMax + 1));  sfx('click'); return; }
  if (k === 'surface') { setSurface(cycle(SURFS, S.surface)); sfx('click'); return; }
  if (k === 'hscale') {  return; }
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
  if (DRAG.kind === 'balance') { balanceMove(e); return; }
  if (DRAG.kind) {
    const k = DRAG.kind, dy = -(e.clientY - DRAG.y0) * DRAG.wpp;
    if (k === 'jack') setParam('jack', DRAG.j0 + dy);
    else if (k === 'F1' || k === 'F2') { const p = rayOnPlaneY(e, AXIS_Y); if (p) { const f = DRAG.F0 + DRAG.dir * (p.x - DRAG.px0) * 20; setParam(k, S.mode === 'kid' ? Math.round(f * 2) / 2 : f); } }
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
  canvas.style.cursor = h && (S.mode !== 'kid' || KID.free || KID.missions[KID.i]?.allow?.includes(h.kind)) ? (['button', 'obj', 'block', 'surface', 'hscale'].includes(h.kind) ? 'pointer' : 'grab') : '';
}
function onPointerUp(e) {
  if (DRAG.kind === 'balance') balanceUp(e, e.type === 'pointercancel');
  if (!DRAG.kind) return;
  DRAG.kind = null; controls.enabled = true; canvas.style.cursor = '';
  try { canvas.releasePointerCapture(e.pointerId); } catch {}
}

const KEYMAP = {};
function onKey(e) {
  if (S.mode === 'kid' && !KID.free && KID.missions[KID.i]?.shot === 'balance') return;
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) { if (e.key !== 'Escape') return; }
  const k = e.key;
  if (k === 'Escape') return;
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
    case 'h': case 'H': setStation(cycle(['hang', 'track', 'balance'], S.station)); break;
    case 'f': case 'F': setOverlay('F', !S.overlays.F); break;
    case 'l': case 'L': setOverlay('L', !S.overlays.L); break;
    case 'k': case 'K': setOverlay('K', !S.overlays.K); break;
    case 'v': case 'V': setView(S.view === 'lab' ? 'studio' : 'lab'); break;
    case 't': case 'T': if (S.mode === 'kid') setMode('full'); LESSON.i >= 0 ? lessonEnd() : lessonGo(0); break;
    case 'g': case 'G': window.open('guide.html#teacher-guide', '_blank', 'noopener'); break;
    case 'y': case 'Y': window.open('guide.html#assessment', '_blank', 'noopener'); break;
    case 'c': case 'C': setCinematic(!CAM.cine); break;
    case ' ': e.preventDefault(); togglePlay(); break;
    case 'r': case 'R': resetTrack(); flyTo(heroShot(), 1.8); break;
    case '/': e.preventDefault(); document.body.classList.toggle('hide-ui'); if (window.__site) window.__site.setVisible(!document.body.classList.contains('hide-ui')); break;
    case '추': window.open('guide.html#controls', '_blank', 'noopener'); break;
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
  } else if (kind === 'swell' || kind === 'whoosh' || kind === 'splash') {
    const s = C.createBufferSource(); s.buffer = AUD.noise; const f = C.createBiquadFilter();
    if (kind === 'swell') {
      f.type = 'lowpass'; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(220, t + 0.9);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0); s.connect(f).connect(g); s.start(t, rr(0, 1), 1.05);
      const o = C.createOscillator(), og = C.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(92, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.8);
      og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.22, t + 0.05); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); o.connect(og).connect(AUD.master); o.start(t); o.stop(t + 0.95);
    } else if (kind === 'whoosh') {
      f.type = 'bandpass'; f.Q.value = 0.9; f.frequency.setValueAtTime(260, t); f.frequency.exponentialRampToValueAtTime(1500, t + 0.6);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8); s.connect(f).connect(g); s.start(t, rr(0, 1), 0.85);
    } else {
      f.type = 'bandpass'; f.Q.value = 0.7; f.frequency.setValueAtTime(2300, t); f.frequency.exponentialRampToValueAtTime(650, t + 0.4);
      g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); s.connect(f).connect(g); s.start(t, rr(0, 1), 0.55);
    }
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
const fx = (v, d = 1) => (Number.isFinite(v) ? (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d) : '—');
// U7b-2: force names used only by drawScreenA.
const sceneForceNames = {
  fW: { ko: '중력', en: 'Gravity' }, fT: { ko: '탄성력', en: 'Spring' }, fB: { ko: '부력', en: 'Buoyancy' }, 
  fF1: { ko: '당김 F1', en: 'Pull F1' }, fF2: { ko: '당김 F2', en: 'Pull F2' }, ff: { ko: '마찰력', en: 'Friction' }, fBump: { ko: '범퍼', en: 'Bumper' }, fNet: { ko: '알짜힘', en: 'Net force' },
};
const T = k => sceneForceNames[k][LANG] ?? sceneForceNames[k].ko;

const UI = {
  init() {
    const $ = (id) => document.getElementById(id); this.$ = $;
    const seg = (id, items, onClick) => { const el = $(id); items.forEach(([v, label, name]) => { const b = document.createElement('button'); b.innerHTML = label; b.setAttribute('aria-label', name || String(v)); b.dataset.v = v; b.onclick = () => { ensureAudio(); onClick(v); }; el.appendChild(b); }); };
    document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = ico(el.dataset.icon));
    seg('presets', ['hold','grip','moon','sink'].map((icon,i) => [i, `${i+1}${ico(icon)}`, `시나리오 ${i+1}`]), i => applyPreset(+i));
    seg('stations', [['hang',ico('spring'),'매달기대'],['track',ico('box'),'끌기대'],['balance',ico('balance'),'양팔저울']], setStation);
    seg('objects', [['weights',ico('weight'),'추'],['al',swatch('al'),'알루미늄'],['wood',swatch('wood'),'나무']], setObj);
    seg('fluids', ['water','brine','oil'].map((v,i) => [v, `<span class="fluid-swatch fluid-${v}">${ico('drop')}${'<i></i>'.repeat(i+1)}</span>`, ['물','소금물','기름'][i]]), setFluid);
    seg('dirs', [[0,ico('arrowL')+ico('arrowR'),'반대 방향'],[1,ico('arrowR')+ico('arrowR'),'같은 방향']], v => setSame(+v === 1));
    seg('surfaces', SURFS.map(v => [v,swatch(v),v]), setSurface);
    seg('graphs', [['hooke',ico('spring'),'탄성 기록'],['buoy',ico('drop'),'부력 기록'],['vt',ico('graph'),'속도 기록']], setGraph);
    seg('views', [['lab',ico('home'),'실험실'],['studio',ico('circle'),'스튜디오']], setView);
    seg('speeds', [0.25,0.5,1,2].map(v => [v, `${v}×`]), v => { S.speed = +v; this.syncButtons(); });
    $('gTicks').innerHTML = PHYS.PLANETS.map(p => `<span>${p.g}</span>`).join('');
    const bind = (id, name, st) => { const el = $(id); el.addEventListener('input', () => { if (st && S.station !== st) setStation(st, false); setParam(name, +el.value); }); };
    bind('sg', 'g'); bind('sn', 'n', 'hang'); bind('sj', 'jack', 'hang'); bind('sF1', 'F1', 'track'); bind('sF2', 'F2', 'track'); bind('sL', 'load', 'track');
    $('sn').addEventListener('input', () => { if (S.obj !== 'weights') setObj('weights'); });
    const ov = $('overlays'), cols = { F: '#fde68a', L: '#efe6db', K: '#bae6fd' };
    ['F', 'L', 'K'].forEach((k) => { const b = document.createElement('button'); b.className = 'tg'; b.style.setProperty('--dot', cols[k]); b.innerHTML = `<i></i>${ico({F:'arrowR',L:'eye',K:'ruler'}[k])}`; b.setAttribute('aria-label', {F:'힘 화살표',L:'측정값',K:'눈금'}[k]); b.dataset.k = k; b.onclick = () => setOverlay(k, !S.overlays[k]); ov.appendChild(b); });
    $('bPlay').onclick = () => togglePlay();
    $('bSound').onclick = () => setSound(!S.sound);
    $('bLesson').onclick = () => (LESSON.i >= 0 ? lessonEnd() : lessonGo(0));
    $('bCine').onclick = () => setCinematic(!CAM.cine);
    $('bReset').onclick = () => { resetTrack(); flyTo(heroShot(), 1.8); };
    if (window.__SITE__ && window.__SITE__.brand) $('bShare').style.display = 'none';
    $('bShare').onclick = () => { if (window.__site) window.__site.share(); else if (navigator.share) navigator.share({ title: document.title, url: location.href }).catch(() => {}); };
    LESSON.steps.forEach((_,i) => { const b = document.createElement('button'); b.className = 'tbtn'; b.setAttribute('aria-label', `수업 ${i+1}단계`); b.onclick = () => lessonGo(i); $('lsDots').appendChild(b); });
    $('lsClose').onclick = () => lessonEnd();
    $('lsPrev').onclick = () => lessonGo(LESSON.i - 1);
    $('lsNext').onclick = () => (LESSON.i >= LESSON.steps.length - 1 ? lessonEnd() : lessonGo(LESSON.i + 1));
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
    $('vg').textContent = fx(S.g.tgt, 1);
    $('vn').textContent = S.n.tgt; $('vj').textContent = fx((S.jack.tgt - PC.jack.min) * 100, 1);
    $('vF1').textContent = fx(S.F1.tgt, 2); $('vF2').textContent = fx(S.F2.tgt, 2); $('vL').textContent = S.load.tgt;
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
    $('bCine').setAttribute('aria-pressed', String(CAM.cine));
    $('playIcon').setAttribute('d', S.playing ? 'M7 5h4v14H7zM13 5h4v14h-4z' : 'M8 5v14l11-7z');
  },
  renderLesson() {
    const $ = this.$, box = $('lesson');
    this.syncButtons();
    document.body.classList.toggle('lesson-on', LESSON.i >= 0);
    box.classList.toggle('on', LESSON.i >= 0);
    if (LESSON.i < 0) return;
    $('lsGuide').href = `guide.html#step-${LESSON.i + 1}`;
    [...$('lsDots').children].forEach((b,i) => {
      b.classList.toggle('cur', i === LESSON.i);
      b.classList.toggle('done', !!LESSON.done[i]);
      b.setAttribute('aria-current', i === LESSON.i ? 'step' : 'false');
      b.innerHTML = `${i+1}${LESSON.done[i] ? ico('check') : ''}`;
    });
    $('lsPrev').disabled = LESSON.i === 0;
    $('lsNext').classList.toggle('primary', !!LESSON.passed);
  },
  buildLabels() {
    const root = document.getElementById('labels');
    const mk = (color, cls = '') => { const el = document.createElement('div'); el.className = 'lbl ' + cls; el.innerHTML = `<i style="background:${color};box-shadow:0 0 6px ${color}"></i><span></span>`; root.appendChild(el); return { el, val: el.querySelector('span') }; };
    const L = { scale: mk('#86efac'), beaker: mk('#7dd3fc'), block: mk('#ffcf9a'), surf: mk('#d6d3d1') };
    for (const [g, set] of [['h', OVL.h], ['t', OVL.t]]) for (const k in set) L[g + k] = mk(hex(set[k].mat.uniforms.uColor.value.getHex()), 'force');
    return L;
  },
  updateLabels() {
    if (S.station === 'balance') { for (const it of Object.values(this.labels)) it.el.classList.add('hidden'); return; }
    const L = this.labels, W = innerWidth, H = innerHeight, items = [], r = S.hang, F = S.F;
    if (!r || !F) return;
    const anchor = (k, p, txt, show = true) => {
      const it = L[k]; it.val.textContent = txt;
      const v = p.clone().project(camera), x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
      it.ok = show && v.z < 1 && x > 10 && x < W - 10 && y > 10 && y < H - 10; it.ax = x; it.ay = y; items.push(it);
    };
    const hang = S.station === 'hang';
    const kid = S.mode === 'kid';
    anchor('scale', V3(HS.x + 0.03, TOP + 0.70, HS.z), `${fx(S.Tlive, kid ? 1 : 2)} N`, hang);
    anchor('beaker', V3(HS.x + 0.07, TOP + r.beakerY + 0.05, HS.z + 0.07), fx(r.frac * 100, 0) + '%', hang && r.inFluid && !kid);
    anchor('block', V3(blockX(S.trk.x), TRK_Y + 0.1 + S.load.tgt * PC.load.h, TRK.z), fx(Math.abs(S.trk.v), 2), !hang && !kid);
    anchor('surf', V3(blockX(S.trk.x) - 0.25, TRK_Y, TRK.z + 0.08), `${fx(F.mus, 2)} / ${fx(F.muk, 2)}`, !hang && !kid);
    const fl = S.overlays.L && S.overlays.F;
    for (const [g, set, on] of [['h', OVL.h, hang], ['t', OVL.t, !hang]]) for (const k in set) { const a = set[k]; anchor(g + k, a.tip, `${fx(a.N, kid ? 1 : 2)} N`, fl && on && a.on && !(kid && (k === 'bump' || (g === 't' && (k === 'W' || k === 'N'))))); }
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
    const $ = this.$, r = S.hang, F = S.F; if (!r || !F) return;
    $('c1').innerHTML = `${fx(S.Tlive, 2)}<small>N</small>`;
    $('c2').innerHTML = `${fx(r.B, 2)}<small>N</small>`;
    const net = Math.abs(F.net) < 0.005 ? 0 : F.net;
    $('c3').innerHTML = `${net === 0 ? '' : net > 0 ? '→' : '←'}${fx(Math.abs(net), 2)}<small>N</small>`;
  },
};
