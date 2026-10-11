// ==== 쉬운 모드: 장면 속 손잡이 ====
// 기구 바로 옆에 크고 눈에 보이는 손잡이를 붙인다 (3D 물체를 정확히 맞혀 잡지 않아도 된다)
//  · 끌개(F1·F2): 줄 끝 손잡이를 레일 따라 끌면 그만큼 센 힘 (눈금 0~6 N, 목표 깃발)
//  · 비커(jack): 위아래 레일
//  · 바닥(surface): 재질 버튼 3개 / 짐(block)·추(obj): ➖ ➕
const KH = { el: null, items: [], drag: null };
const KH_GOAL = { team: { F1: 1, F2: 1 }, floor: { F2: 2 }, boss: { F2: 4 } };
const KH_FLEN = 0.22;
// 실험대마다 만질 수 있는 기구 (퀘스트가 고른 기구는 강조, 나머지는 은은하게)
const KH_STATION = { track: ['F2', 'F1', 'block', 'surface'], hang: ['objt', 'obj', 'jack', 'fluid', 'grav'] };
const PLANET_NAME = { earth: ['지구', 'Earth'], mars: ['화성', 'Mars'], moon: ['달', 'Moon'] };
// 고르기 버튼: 목록·지금 값·그림·이름·바꾸기·붙일 곳·화면 오프셋
const KH_PICK = {
  surface: { list: () => SURFS, cur: () => S.surface, pic: (v) => swatch(v), name: (v) => T('surfName')[v], set: (v) => { const L = S.load.tgt; kidTrack(v); setParam('load', L, true); KID.ctx.fail = false; KID.ctx.hold = 0; }, at: () => KID_AT.surface(), off: () => (isPortrait() ? [0, 84] : [-10, -84]) },
  objt: { list: () => OBJS, cur: () => S.obj, pic: (v) => (v === 'weights' ? ico('weight') : swatch(v === 'al' ? 'al' : 'wood')), name: (v) => T('objName')[v], set: (v) => { setObj(v); if (v === 'weights' && !S.n.tgt) setParam('n', 2); }, at: () => LOOK.obj().clone(), off: [-170, 0] },
  fluid: { list: () => FLUIDS, cur: () => S.fluid, pic: (v) => `<span class="kfl ${v}"></span>`, name: (v) => T('fluidName')[v], set: (v) => setFluid(v), at: () => HERO.beaker.getWorldPosition(new THREE.Vector3()), off: [210, 10] },
  grav: { list: () => ['earth', 'mars', 'moon'], cur: () => (PHYS.nearPlanet(S.g.tgt) || {}).id, pic: (v) => (v === 'moon' ? ico('moon') : v === 'mars' ? '<span class="kpl"></span>' : ico('globe')), name: (v) => PLANET_NAME[v][isEn() ? 1 : 0], set: (v) => { setParam('g', PHYS.PLANETS.find((q) => q.id === v).g); S.hv.v += 0.004; }, at: () => LOOK.scale().clone(), off: [-150, 30] },
};   // 힘 레일 길이 (m, 장면 속)
const khRailPx = () => clamp(innerWidth * 0.2, 120, 270);
function khScreenEnds(k) {
  const R = KH_RAIL[k]; let [a, b] = R.ends().map(khProj); if (k === 'jack') return [a, b];
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, L = khRailPx(), P = 40;   // 끌개에서 화면상 40px 떨어져 시작 (두 손잡이가 겹치지 않게)
  a = { x: a.x + dx / l * P, y: a.y + dy / l * P };
  const b2 = { x: a.x + dx / l * L, y: a.y + dy / l * L }, M = 44;   // 화면 밖으로 나가지 않게 밀어 넣기
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
    ends: () => { const p = HERO.beaker.getWorldPosition(new THREE.Vector3()).add(V3(PC.beaker.R + 0.09, PC.beaker.height + 0.02, 0.05)); return [p.clone().setY(p.y - (S.jack.cur - PC.jack.min)), p.clone().setY(p.y + (PC.jack.max - S.jack.cur))]; },
  },
};
function khForceEnds(k) {
  const c = HERO.ts[k === 'F1' ? 0 : 1].cart.getWorldPosition(new THREE.Vector3()), d = khDirF(k);
  const a = c.clone().add(V3(0, 0.05, 0.03));
  return [a, a.clone().add(V3(d * KH_FLEN, 0, 0))];
}

function khBuild() {
  if (!KH.el) { KH.el = document.createElement('div'); KH.el.id = 'khandles'; document.body.appendChild(KH.el); }
  KH.el.innerHTML = ''; KH.items = []; KH.drag = null;
  const m = KID.missions[KID.i];
  if (S.mode !== 'kid') return;
  const free = KID.free;
  if (!free && (!m || m.quiz || m.shot === 'hero')) return;
  const goal = free ? {} : KH_GOAL[m.id] || {}, focus = free ? [] : m.allow || [];
  for (const k of [...new Set([...focus, ...(KH_STATION[S.station] || [])])]) {
    let el;
    if (KH_RAIL[k]) {
      const R = KH_RAIL[k], force = k !== 'jack';
      el = document.createElement('div'); el.className = `kh khrail ${force ? 'force' : 'water'}`;
      const ticks = force ? Array.from({ length: R.max() + 1 }, (_, i) => `<span class="khtick" style="left:${(i / R.max()) * 100}%"><em>${i}</em></span>`).join('') : '';
      const g = goal[k] != null ? `<span class="khgoal" style="left:${(goal[k] / R.max()) * 100}%">${ico('flag')}</span>` : '';
      el.innerHTML = `<div class="khbar"><i class="khfill"></i>${ticks}${g}</div><i class="khghost"></i><button class="khknob" aria-label="${k}">${ico('grip')}</button><div class="khval"></div>`;
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
      el.innerHTML = P.list().map((v) => `<button data-s="${v}">${P.pic(v)}<span>${P.name(v)}</span></button>`).join('');
      el.querySelectorAll('button').forEach((b) => (b.onclick = () => {
        if (!KID.allows(k)) return; KID.acted(); ensureAudio(); P.set(b.dataset.s); sfx('click'); KID.update(true);
      }));
    } else if (k === 'block' || k === 'obj') {
      el = document.createElement('div'); el.className = `kh khstep ${k}`;
      el.innerHTML = `<button data-d="-1" aria-label="-">${ico('minus')}</button><span class="khcount"></span><button data-d="1" aria-label="+">${ico('plus')}</button>`;
      el.querySelectorAll('button').forEach((b) => (b.onclick = () => {
        if (!KID.allows(k)) return; KID.acted(); ensureAudio(); const d = +b.dataset.d;
        if (k === 'block') { const L = clamp(S.load.tgt + d, 0, PC.loadMax); kidDesign(S.surface); setParam('load', L, true); }
        else { setParam('n', clamp(S.n.tgt + d, 0, PC.nMax)); S.hv.v -= 0.05 * d; }
        sfx('click'); KID.update(true);
      }));
    } else continue;
    if (!free && !focus.includes(k)) el.classList.add('sub');
    el.dataset.k = k; KH.el.appendChild(el); KH.items.push({ k, el });
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
  for (const { k, el } of KH.items) {
    if (KH_RAIL[k]) {
      const R = KH_RAIL[k], D = KH.drag && KH.drag.k === k ? KH.drag : null;
      const [A, B] = D ? D.ends : khScreenEnds(k), t = clamp(R.get(), 0, 1);
      const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
      const bar = el.querySelector('.khbar');
      bar.style.cssText = `left:${A.x}px;top:${A.y}px;width:${len}px;transform:translateY(-50%) rotate(${ang}rad)`;
      bar.classList.toggle('flip', Math.abs(ang) > Math.PI / 2);
      el.querySelector('.khfill').style.width = `${t * 100}%`;
      const kx = A.x + dx * t, ky = A.y + dy * t;
      el.querySelector('.khknob').style.cssText = `left:${kx}px;top:${ky}px`;
      const gl = Math.min(len * (1 - t), len * 0.6);
      el.querySelector('.khghost').style.cssText = `left:${kx}px;top:${ky}px;--gx:${(dx / (len || 1)) * gl}px;--gy:${(dy / (len || 1)) * gl}px`;
      const val = el.querySelector('.khval');
      if (k === 'jack') val.textContent = '';
      else { const f = k === 'F1' ? S.F1.tgt : S.F2.tgt; val.textContent = `${n1(f)} N`; }
      val.style.cssText = `left:${kx}px;top:${ky}px`;
    } else {
      const P = KH_PICK[k], p = khProj(P ? P.at() : k === 'block' ? KID_AT.block() : LOOK.obj().clone());
      const off = P ? (typeof P.off === 'function' ? P.off() : P.off) : k === 'block' ? [0, -86] : [118, 0];
      el.style.cssText = `left:${p.x + off[0]}px;top:${p.y + off[1]}px${k === 'obj' && S.obj !== 'weights' ? ';display:none' : ''}`;
      if (P) { const cur = P.cur(); el.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.s === cur)); }
      else {
        const n = k === 'block' ? S.load.tgt : S.n.tgt, mx = k === 'block' ? PC.loadMax : PC.nMax, ic = ico(k === 'block' ? 'box' : 'weight');
        const h = `${ic}<b>${n}</b>`; const c = el.querySelector('.khcount'); if (c._h !== h) { c.innerHTML = h; c._h = h; }
        el.querySelector('[data-d="-1"]').disabled = n <= 0; el.querySelector('[data-d="1"]').disabled = n >= mx;
      }
    }
  }
}
