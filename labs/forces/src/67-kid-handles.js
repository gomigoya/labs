// ==== 쉬운 모드: 장면 속 손잡이 ====
// 기구 바로 옆에 크고 눈에 보이는 손잡이를 붙인다 (3D 물체를 정확히 맞혀 잡지 않아도 된다)
//  · 끌개(F1·F2): 줄 끝 손잡이를 레일 따라 끌면 그만큼 센 힘 (눈금 0~6 N, 목표 깃발)
//  · 비커(jack): 위아래 레일
//  · 바닥·물체·액체·중력 고르기, 짐·추 ➖ ➕ 는 장면 아래 고정된 '도구대'에 (누르는 동안 움직이지 않게)
//  · 줄다리기: 양쪽을 다 맞추고 손을 떼면 '고정 핀'이 잠시 뒤 풀린다 (마우스는 한 번에 손잡이 하나만 잡을 수 있으므로)
const KH = { el: null, items: [], drag: null };
const KH_GOAL = { team: { F1: 1, F2: 1 }, floor: { F2: 2 }, boss: { F2: 4 } };
const KH_FLEN = 0.22;
// 바닥·짐을 바꾸면 당기던 힘은 그대로 두고, 퀘스트에서는 이미 미끄러진 도막만 출발점으로 (바로 다시 비교해 볼 수 있게)
function khFresh() { KID.ctx.fail = false; KID.ctx.hold = 0; if (!KID.free && Math.abs(S.trk.x - PC.track.x0) > 1e-3) resetTrack(); }
// 실험대마다 만질 수 있는 기구 (퀘스트가 고른 기구는 강조, 나머지는 은은하게)
const KH_STATION = { track: ['F2', 'F1', 'block', 'surface', 'zoom'], hang: ['objt', 'obj', 'jack', 'fluid', 'grav', 'zoom'] };
const KH_DOCK = ['surface', 'block', 'objt', 'obj', 'fluid', 'grav', 'zoom'];   // 도구대 순서
const KH_LABEL = { surface: ['바닥', 'Surface'], block: ['짐', 'Loads'], objt: ['물체', 'Object'], obj: ['추', 'Weights'], fluid: ['액체', 'Liquid'], grav: ['중력', 'Gravity'], zoom: ['돋보기', 'Zoom'] };
const PLANET_NAME = { earth: ['지구', 'Earth'], mars: ['화성', 'Mars'], moon: ['달', 'Moon'] };
// 고르기 버튼: 목록·지금 값·그림·이름·바꾸기·붙일 곳·화면 오프셋
const KH_PICK = {
  surface: { list: () => SURFS, cur: () => S.surface, pic: (v) => swatch(v), name: (v) => T('surfName')[v], set: (v) => { if (S.surface === v) return; setSurface(v); khFresh(); dirSurface(v); } },
  objt: { list: () => OBJS, cur: () => S.obj, pic: (v) => (v === 'weights' ? ico('weight') : swatch(v === 'al' ? 'al' : 'wood')), name: (v) => T('objName')[v], set: (v) => { setObj(v); if (v === 'weights' && !S.n.tgt) setParam('n', 2); } },
  fluid: { list: () => FLUIDS, cur: () => S.fluid, pic: (v) => `<span class="kfl ${v}"></span>`, name: (v) => T('fluidName')[v], set: (v) => setFluid(v) },
  grav: { list: () => ['earth', 'mars', 'moon'], cur: () => (PHYS.nearPlanet(S.g.tgt) || {}).id, pic: (v) => (v === 'moon' ? ico('moon') : v === 'mars' ? '<span class="kpl"></span>' : ico('globe')), name: (v) => PLANET_NAME[v][isEn() ? 1 : 0], set: (v) => { setParam('g', PHYS.PLANETS.find((q) => q.id === v).g); S.hv.v += 0.004; } },
};   // 힘 레일 길이 (m, 장면 속)
const khRailPx = () => clamp(innerWidth * 0.2, 120, 270);
function khScreenEnds(k) {
  const R = KH_RAIL[k]; let [a, b] = R.ends().map(khProj); if (k === 'jack') return [a, b];
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, P = isPortrait() ? 58 : 40, M = 44;   // 끌개에서 화면상 P px 떨어져 시작 (두 손잡이가 겹치지 않게)
  a = { x: a.x + dx / l * P, y: a.y + dy / l * P };
  // 레일 길이: 화면 가장자리까지 남은 자리에 맞춘다 (좁은 화면에서 밀려 들어와 손잡이끼리 겹치지 않게)
  const room = dx > 0 ? innerWidth - M - a.x : a.x - M, L = clamp(Math.min(khRailPx(), room * l / Math.abs(dx || 1)), 84, 270);
  const b2 = { x: a.x + dx / l * L, y: a.y + dy / l * L };   // 그래도 모자라면 화면 안으로 밀어 넣기
  const lo = Math.min(a.x, b2.x), hi = Math.max(a.x, b2.x), sh = lo < M ? M - lo : hi > innerWidth - M ? innerWidth - M - hi : 0;
  return [{ x: a.x + sh, y: a.y }, { x: b2.x + sh, y: b2.y }];
}
const khProj = (v) => { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight, ok: p.z < 1 }; };
const khDirF = (k) => (k === 'F2' || S.same ? 1 : -1);

// 레일 정의: ends() → [시작, 끝] 세계 좌표, get()/set(t) 0~1
const KH_RAIL = {
  F1: { max: () => PC.trackMax, get: () => S.F1.tgt / PC.trackMax, set: (t) => setParam('F1', Math.round(t * PC.trackMax * 2) / 2), ends: () => khForceEnds('F1') },
  F2: { max: () => PC.trackMax, get: () => S.F2.tgt / PC.trackMax, set: (t) => setParam('F2', Math.round(t * PC.trackMax * 2) / 2), ends: () => khForceEnds('F2') },
  jack: {
    get: () => (S.jack.tgt - PC.jack.min) / (PC.jack.max - PC.jack.min), set: (t) => setParam('jack', PC.jack.min + t * (PC.jack.max - PC.jack.min)),
    ends: () => { const p = HERO.beaker.getWorldPosition(new THREE.Vector3()).add(V3(PC.beaker.R + (isPortrait() ? 0.15 : 0.09), PC.beaker.height + 0.02, 0.05)); return [p.clone().setY(p.y - (S.jack.cur - PC.jack.min)), p.clone().setY(p.y + (PC.jack.max - S.jack.cur))]; },
  },
};
function khForceEnds(k) {
  const c = HERO.ts[k === 'F1' ? 0 : 1].cart.getWorldPosition(new THREE.Vector3()), d = khDirF(k);
  const a = c.clone().add(V3(0, 0.05, 0.03));
  return [a, a.clone().add(V3(d * KH_FLEN, 0, 0))];
}

function khBuild() {
  if (!KH.el) { KH.el = document.createElement('div'); KH.el.id = 'khandles'; document.body.appendChild(KH.el); }
  KH.el.innerHTML = '<div id="khdock"></div><div class="khpin"><span class="khpr"></span><span class="khpi"></span><b></b></div>'; KH.items = []; KH.drag = null;
  KH.dock = KH.el.firstChild; KH.pin = KH.el.lastChild; KH.dockY = null;
  const m = KID.missions[KID.i];
  if (S.mode !== 'kid') return;
  const free = KID.free;
  if (!free && (!m || m.quiz || m.shot === 'hero')) return;
  const goal = free ? {} : KH_GOAL[m.id] || {}, focus = free ? [] : m.allow || [];
  const keys = [...new Set([...focus, ...(KH_STATION[S.station] || [])])];
  keys.sort((a, b) => KH_DOCK.indexOf(a) - KH_DOCK.indexOf(b));
  for (const k of keys) {
    let el;
    if (KH_RAIL[k]) {
      const R = KH_RAIL[k], force = k !== 'jack';
      el = document.createElement('div'); el.className = `kh khrail ${force ? 'force' : 'water'}`;
      const ticks = force ? Array.from({ length: R.max() + 1 }, (_, i) => `<span class="khtick" style="left:${(i / R.max()) * 100}%"><em>${i}</em></span>`).join('') : '';
      const g = goal[k] != null ? `<span class="khgoal" style="left:${(goal[k] / R.max()) * 100}%">${ico('flag')}</span>` : '';
      el.innerHTML = `<div class="khbar"><i class="khfill"></i>${ticks}${g}${force ? `<span class="khlast"><em>${L2('지난번', 'Last')}</em></span>` : ''}</div><i class="khghost"></i><button class="khknob" aria-label="${k}">${ico('grip')}</button><div class="khval"></div>`;
      const knob = el.querySelector('.khknob');
      knob.onpointerdown = (e) => {
        if (!KID.allows(k)) return; ensureAudio(); KID.acted(); if (k !== 'jack') KID.ctx.fail = false;
        try { knob.setPointerCapture(e.pointerId); } catch (er) {} el.classList.add('drag');
        KH.drag = { k, ends: khScreenEnds(k), last: R.get() }; DRAG.kind = 'kh-' + k; khMove(e); sfx('pick'); dirGrab(k);
      };
      knob.onpointermove = (e) => { if (KH.drag && KH.drag.k === k) khMove(e); };
      knob.onpointerup = knob.onpointercancel = () => { if (!KH.drag) return; KH.drag = null; DRAG.kind = null; dirGrab(null); el.classList.remove('drag'); KID.update(true); };
    } else if (KH_PICK[k]) {
      const P = KH_PICK[k];
      el = document.createElement('div'); el.className = 'kh khpick';
      el.innerHTML = `<span class="khl">${KH_LABEL[k][isEn() ? 1 : 0]}</span><div class="khb">${P.list().map((v) => `<button data-s="${v}">${P.pic(v)}<span>${P.name(v)}</span></button>`).join('')}</div>`;
      el.querySelectorAll('button').forEach((b) => (b.onclick = () => {
        if (!KID.allows(k)) return; KID.acted(); ensureAudio(); P.set(b.dataset.s); sfx('click'); KID.update(true);
      }));
    } else if (k === 'block' || k === 'obj') {
      el = document.createElement('div'); el.className = `kh khstep ${k}`;
      el.innerHTML = `<span class="khl">${KH_LABEL[k][isEn() ? 1 : 0]}</span><div class="khb"><button data-d="-1" aria-label="-">${ico('minus')}</button><span class="khcount"></span><button data-d="1" aria-label="+">${ico('plus')}</button></div>`;
      el.querySelectorAll('button').forEach((b) => (b.onclick = () => {
        if (!KID.allows(k)) return; KID.acted(); ensureAudio(); const d = +b.dataset.d;
        if (k === 'block') { const L = clamp(S.load.tgt + d, 0, PC.loadMax); if (L === S.load.tgt) return; setParam('load', L, true); khFresh(); dirLoad(d); }
        else { setParam('n', clamp(S.n.tgt + d, 0, PC.nMax)); S.hv.v -= 0.05 * d; }
        sfx('click'); KID.update(true);
      }));
    } else if (k === 'zoom') {
      el = document.createElement('div'); el.className = 'kh khzoom';
      el.innerHTML = `<span class="khl">${KH_LABEL[k][isEn() ? 1 : 0]}</span><div class="khb"><button aria-label="${KH_LABEL[k][isEn() ? 1 : 0]}">${ico('eye')}<span>${L2('가까이', 'Look')}</span></button></div>`;
      el.querySelector('button').onclick = () => { if (!KID.allows(k)) return; ensureAudio(); lensNow(); };
    } else continue;
    if (!free && !focus.includes(k)) el.classList.add('sub');
    el.dataset.k = k; (KH_RAIL[k] ? KH.el : KH.dock).appendChild(el); KH.items.push({ k, el });
  }
}
function khMove(e) {
  const D = KH.drag, [A, B] = D.ends, R = KH_RAIL[D.k];
  const vx = B.x - A.x, vy = B.y - A.y, L2v = vx * vx + vy * vy || 1;
  const t = clamp(((e.clientX - A.x) * vx + (e.clientY - A.y) * vy) / L2v, 0, 1);
  R.set(t); const v = R.get();
  if (D.k !== 'jack' && Math.abs(v - D.last) > 1e-6) sfx('tick');
  D.last = v; KID.update();
}
// 매 프레임: 손잡이를 기구 위치에 붙여 둔다
function khFrame() {
  if (!KH.el) return;
  const m = KID.missions[KID.i];
  const hide = S.mode !== 'kid' || !m || CAM.fly || KID.phase() === 'predict' || document.getElementById('kidIntro').classList.contains('on');
  KH.el.classList.toggle('off', !!hide); if (hide) return;
  KH.el.classList.toggle('fresh', !KID.ctx.acted);
  // 점진적 공개: 퀘스트에서는 첫 조작 뒤에 다른 기구가 나타나고, 결정적 순간에는 화면을 비운다
  KH.el.classList.toggle('calm', !KID.free && (!KID.ctx.acted || !!DIR.slow));
  KH.el.classList.toggle('hush', !!DIR.slow);
  // 도구대: 아래 계기판(또는 성공 띠) 바로 위에 고정
  const fo = [...document.querySelectorAll('#kid .kwin.on .kbox, #kid .kfoot')].map((e) => e.getBoundingClientRect()).find((r) => r.height > 0);
  const dy = Math.round((fo ? fo.top : innerHeight - 24) - 10);
  if (dy !== KH.dockY) { KH.dockY = dy; KH.dock.style.top = `${dy}px`; }
  KH.dock.classList.toggle('none', !KH.dock.children.length || (KH.el.classList.contains('calm') && !KH.dock.querySelector('.kh:not(.sub)')));
  khPin();
  for (const { k, el } of KH.items) {
    if (k === 'zoom') continue;
    if (KH_RAIL[k]) {
      const R = KH_RAIL[k], D = KH.drag && KH.drag.k === k ? KH.drag : null;
      const [A, B] = D ? D.ends : khScreenEnds(k), t = clamp(R.get(), 0, 1);
      const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
      const bar = el.querySelector('.khbar');
      bar.style.cssText = `left:${A.x}px;top:${A.y}px;width:${len}px;transform:translateY(-50%) rotate(${ang}rad)`;
      bar.classList.toggle('flip', Math.abs(ang) > Math.PI / 2);
      el.querySelector('.khfill').style.width = `${t * 100}%`;
      const lm = el.querySelector('.khlast');
      if (lm) { const lv = noteLast(), m = KID.missions[KID.i], on = lv != null && (KID.free || (m && NOTE_Q.has(m.id))) && k === 'F2'; lm.style.display = on ? '' : 'none'; if (on) lm.style.left = `${clamp(lv / R.max(), 0, 1) * 100}%`; }
      const kx = A.x + dx * t, ky = A.y + dy * t;
      el.querySelector('.khknob').style.cssText = `left:${kx}px;top:${ky}px`;
      const gl = Math.min(len * (1 - t), len * 0.6);
      el.querySelector('.khghost').style.cssText = `left:${kx}px;top:${ky}px;--gx:${(dx / (len || 1)) * gl}px;--gy:${(dy / (len || 1)) * gl}px`;
      const val = el.querySelector('.khval');
      if (k === 'jack') val.textContent = '';
      else { const f = k === 'F1' ? S.F1.tgt : S.F2.tgt; val.textContent = `${n1(f)} N`; }
      val.style.cssText = `left:${kx}px;top:${ky}px`;
    } else {
      const P = KH_PICK[k], hid = k === 'obj' && S.obj !== 'weights';
      if (el._hid !== hid) { el._hid = hid; el.style.display = hid ? 'none' : ''; }
      if (P) { const cur = P.cur(); el.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.s === cur)); }
      else {
        const n = k === 'block' ? S.load.tgt : S.n.tgt, mx = k === 'block' ? PC.loadMax : PC.nMax, ic = ico(k === 'block' ? 'box' : 'weight');
        const h = `${ic}<b>${n}</b>`; const c = el.querySelector('.khcount'); if (c._h !== h) { c.innerHTML = h; c._h = h; }
        el.querySelector('[data-d="-1"]').disabled = n <= 0; el.querySelector('[data-d="1"]').disabled = n >= mx;
      }
    }
  }
}

// 줄다리기 고정 핀: 도막 위 자물쇠 → 손을 떼면 고리가 차오르고 → 풀림
const KH_PIN_T = 1.3;   // 손을 뗀 뒤 핀이 풀리기까지 (초)
function khPin() {
  const el = KH.pin, c = KID.ctx, now = DIR.t;
  const show = S.station === 'track' && (S.pin || (c.freeT && now - c.freeT < 0.9));
  el.classList.toggle('on', !!show); if (!show) return;
  const p = khProj(KID_AT.block()), arm = S.pin && c.armT != null ? clamp((now - c.armT) / KH_PIN_T, 0, 1) : S.pin ? 0 : 1;
  el.style.cssText = `left:${p.x}px;top:${p.y - 74}px;--p:${arm}`;
  const st = S.pin ? (arm > 0 ? 'arm' : 'lock') : 'go';
  if (el._st !== st) {
    el._st = st; el.className = `khpin on ${st}`;
    el.querySelector('.khpi').innerHTML = ico(st === 'go' ? 'unlock' : 'lock');
    el.querySelector('b').textContent = st === 'go' ? L2('출발!', 'Go!') : st === 'arm' ? L2('손을 떼고 기다려요', 'Hands off…') : L2('고정', 'Locked');
  }
}
