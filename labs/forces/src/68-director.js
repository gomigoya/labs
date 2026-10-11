// ==== 13c 연출 (쉬운 모드): 물리 사건에 맞춰 카메라·시간·화면 그래픽이 반응한다 ====
// 영화·중계·모션그래픽 문법을 실험실에 옮겼다.
//  · 퀘스트 시작: 타이틀 카드(글자 닦아내기) + 레터박스 + 넓은 설정 숏 → 피사체로 밀어 들어가는 2단 카메라
//  · 평소: 손에 든 카메라 같은 숨결, 도막이 움직이면 시선이 따라가는 패닝
//  · 조작: 손잡이를 잡으면 피사체 쪽으로 살짝 밀어 들어가고(주목), 힘에 따라 높아지는 긴장음
//  · 결정적 순간(미끄러지기 시작·물에 닿음·성공): 슬로 모션 + 비네트 + 레터박스 + 해설선(텔레스트레이션)
//  · 충돌: 카메라 흔들림과 충격 고리 / 거친 바닥: 먼지 / 물: 물보라와 물결
//  · 계기판: 힘을 시간에 따라 그리는 원격 측정 그래프 (정지 마찰 → 운동 마찰 꺾임이 눈에 보인다)
const DIR = {
  ts: 1, slow: null, t: 0, shake: 0, push: 0, punch: 0, follow: 0, grabK: null, tone: null,
  offP: new THREE.Vector3(), offT: new THREE.Vector3(),
  callouts: [], parts: [], cool: {}, prevIn: null, prevFloat: null, dustAcc: 0, side: 1,
  tele: [], teleAcc: 0, teleSt: null, marks: [],
};
const dirOn = () => S.mode === 'kid';
const _dd = new THREE.Vector3();

// ---- 시간: 슬로 모션 (물리에만 적용, 카메라·화면은 실제 시간) ----
function dirSlow(scale, hold, ramp = 0.6) {
  if (DIR.slow) { DIR.slow.hold = Math.max(DIR.slow.hold, DIR.slow.t + hold); DIR.slow.scale = Math.min(DIR.slow.scale, scale); return; }
  DIR.slow = { t: 0, scale, hold, ramp }; document.body.classList.add('kslow', 'kbars');
}
function dirTime(dt) {
  const s = DIR.slow;
  if (!dirOn()) { DIR.ts = 1; return dt; }
  if (s) {
    s.t += dt;
    const a = s.t < 0.15 ? s.t / 0.15 : s.t < 0.15 + s.hold ? 1 : 1 - (s.t - 0.15 - s.hold) / s.ramp;
    if (a <= 0) { DIR.slow = null; DIR.ts = 1; document.body.classList.remove('kslow'); if (!document.body.classList.contains('kcut')) document.body.classList.remove('kbars'); }
    else DIR.ts = lerp(1, s.scale, smooth(clamp(a, 0, 1)));
  } else DIR.ts = 1;
  return dt * DIR.ts;
}

// ---- 카메라: 앞 프레임의 연출 오프셋을 빼고, 새로 계산해서 더한다 (기본 숏은 그대로) ----
function dirCamPre() { camera.position.sub(DIR.offP); controls.target.sub(DIR.offT); }
function dirCamPost(dt) {
  const P = DIR.offP.set(0, 0, 0), T = DIR.offT.set(0, 0, 0);
  if (!dirOn()) return;
  DIR.t += dt;
  const t = DIR.t, still = CAM.fly ? 0 : 1;
  // 숨결: 서로 다른 느린 사인파를 겹쳐 사람 손 같은 흔들림
  P.x += (Math.sin(t * 0.37) * 0.6 + Math.sin(t * 0.91 + 1.3) * 0.4) * 0.006 * still;
  P.y += (Math.sin(t * 0.53 + 0.7) * 0.6 + Math.sin(t * 1.13) * 0.4) * 0.004 * still;
  // 따라가기: 도막이 움직이면 시선이 늦게 따라간다
  const want = S.station === 'track' && still ? clamp(blockX(S.trk.x) - controls.target.x, -0.24, 0.24) * 0.6 : 0;
  DIR.follow += (want - DIR.follow) * (1 - Math.exp(-dt * 1.4));
  P.x += DIR.follow; T.x += DIR.follow;
  // 밀어 들어가기: 잡고 있는 동안 + 결정적 순간
  DIR.punch = Math.max(0, DIR.punch - dt * 0.05);
  const pw = (DIR.grabK ? 0.06 : 0) + DIR.punch;
  DIR.push += (pw - DIR.push) * (1 - Math.exp(-dt * 2.6));
  _dd.copy(controls.target).sub(camera.position); const dist = _dd.length(); _dd.normalize();
  P.addScaledVector(_dd, dist * DIR.push * still);
  // 흔들림
  if (DIR.shake > 0.0004) { P.x += (Math.random() - 0.5) * DIR.shake; P.y += (Math.random() - 0.5) * DIR.shake; DIR.shake *= Math.exp(-dt * 10); } else DIR.shake = 0;
  camera.position.add(P); controls.target.add(T); camera.lookAt(controls.target);
}
// 2단 카메라: 넓은 설정 숏 → 피사체로 밀어 들어가기
function dirReveal(Sh) {
  const d = Sh.pos.clone().sub(Sh.tgt);
  flyTo({ pos: Sh.tgt.clone().add(d.multiplyScalar(1.55)).add(V3(0, 0.25, 0)), tgt: Sh.tgt.clone(), fov: (Sh.fov || 34) + 5 }, 0.9);
  CAM.next = { s: Sh, dur: 1.8, ease: 'out', arc: 0 };
}

// ---- 퀘스트 시작 컷: 타이틀 카드 + 레터박스 + 카메라 ----
function dirLayer(id) { let el = document.getElementById(id); if (!el) { el = document.createElement('div'); el.id = id; document.body.appendChild(el); } return el; }
function dirCut(m) {
  const Sh = stationShot(m.shot);
  if (!dirOn()) { flyTo(Sh, 1.8); return; }
  dirReveal(Sh); sfx('whoosh');
  const t = m.t[LANG] || m.t.ko, eye = m.boss ? L2('도전 과제', 'Challenge') : `Step ${m.stage} · ${(STAGE[LANG] || STAGE.ko)[m.stage]}`;
  const el = dirLayer('ktc');
  el.innerHTML = `<div class="in"><div class="e">${eye}</div><div class="t">${t[0]}</div><i class="l"></i></div>`;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  document.body.classList.add('kcut', 'kbars');
  const id = (DIR.cutId = (DIR.cutId || 0) + 1);
  KID.after(1.8, () => { if (DIR.cutId === id) document.body.classList.remove('kcut'); });
  KID.after(2.2, () => { if (DIR.cutId === id && !DIR.slow) document.body.classList.remove('kbars'); });
}

// ---- 사건 → 연출 ----
const CARD_AT = { F: ['block', () => Math.max(S.F2.tgt, S.F1.tgt)], net: ['block', () => Math.abs(S.F ? S.F.net : 0)], W: ['obj', () => (S.hang ? S.hang.W : 0)], T: ['obj', () => S.Tlive], f: ['block', () => Math.abs(S.F ? S.F.f : 0)], B: ['obj', () => (S.hang ? S.hang.B : 0)], N: ['block', () => (S.F ? S.F.N : 0)] };
const dirAt = (k) => (k === 'obj' ? () => LOOK.obj().clone() : () => KID_AT.block());
function dirEvent(type, e) {
  if (!dirOn()) return;
  const cd = (k, s) => { if ((DIR.cool[k] ?? -99) + s > DIR.t) return false; DIR.cool[k] = DIR.t; return true; };
  if (type === 'slip' && cd('slip', 5)) {
    dirSlow(0.22, 0.9); DIR.punch = 0.08; sfx('swell'); DIR.marks.push(DIR.tele.length);
    dirCallout(dirAt('block'), L2('미끄러지기 시작!', 'It starts to slide!'), () => `${L2('붙잡는 힘 최대', 'Max grip')} ${fx(e && e.fsMax || 0, 1)} N`, hex(FCOL.f), 2.8);
  }
  if (type === 'bump') { DIR.shake = 0.035; dirRing(KID_AT.block()); }
  if (type === 'splash' && cd('splash', 4)) {
    dirSlow(0.3, 0.8); DIR.punch = 0.06; sfx('splash'); dirSplash();
    dirCallout(dirAt('obj'), L2('물이 밀어 올려요', 'Water pushes up'), () => `${L2('부력', 'Buoyancy')} ${fx(S.hang ? S.hang.B : 0, 2)} N`, hex(FCOL.B), 3);
  }
  if (type === 'float' && cd('float', 4)) dirCallout(dirAt('obj'), L2('둥둥 떠요!', 'It floats!'), () => L2('부력 = 무게', 'Buoyancy = weight'), hex(FCOL.B), 2.6);
  if (type === 'win') {
    dirSlow(0.35, 0.7); DIR.punch = Math.max(DIR.punch, 0.09);
    const c = e && e.card && CARD_AT[e.card], card = c && CARDS.find((q) => q.k === e.card);
    if (c) dirCallout(dirAt(c[0]), cardT(card)[0], () => `${fx(c[1](), 2)} N`, hex(card.col), 3.2);
  }
}
function dirGrab(k) {
  DIR.grabK = k;
  if (!S.sound || !AUD.ctx) return;
  const C = AUD.ctx;
  if (k && !DIR.tone) {
    const o = C.createOscillator(), lp = C.createBiquadFilter(), g = C.createGain();
    o.type = 'sawtooth'; lp.type = 'lowpass'; lp.frequency.value = 520; g.gain.value = 0;
    o.connect(lp).connect(g).connect(AUD.master); o.start(); g.gain.setTargetAtTime(0.03, C.currentTime, 0.06);
    DIR.tone = { o, g };
  } else if (!k && DIR.tone) { const T = DIR.tone; DIR.tone = null; T.g.gain.setTargetAtTime(0, C.currentTime, 0.07); T.o.stop(C.currentTime + 0.5); }
}

// ---- 해설선 (텔레스트레이션): 점이 튀어나오고, 선이 그어지고, 이름표가 미끄러져 들어온다 ----
function dirCallout(at, title, val, col, dur = 2.8) {
  const L = dirLayer('kcall');
  DIR.callouts.forEach((q) => (q.t = Math.max(q.t, q.dur)));   // 앞의 해설은 비켜 준다
  const el = document.createElement('div'); el.className = 'kco'; el.style.setProperty('--c', col);
  el.innerHTML = `<i class="ln"></i><i class="d"></i><div class="bx"><b>${title}</b><span></span></div>`;
  L.appendChild(el);
  DIR.side = -DIR.side;
  DIR.callouts.push({ el, at, val, t: 0, dur, side: DIR.side });
}
function dirCallouts(dt) {
  DIR.callouts = DIR.callouts.filter((q) => {
    q.t += dt;
    if (q.t > q.dur + 0.45 || !dirOn()) { q.el.remove(); return false; }
    if (q.t > q.dur) q.el.classList.add('out');
    const p = khProj(q.at()), side = p.x > innerWidth * 0.64 ? -1 : p.x < innerWidth * 0.36 ? 1 : q.side;
    const bx = p.x + side * 78, by = p.y - 82, len = Math.hypot(bx - p.x, by - p.y), ang = Math.atan2(by - p.y, bx - p.x);
    const [ln, d, box] = q.el.children;
    ln.style.cssText = `left:${p.x}px;top:${p.y}px;width:${len}px;--a:${ang}rad`;
    d.style.cssText = `left:${p.x}px;top:${p.y}px`;
    box.style.cssText = `left:${bx + side * 4}px;top:${by}px;--bx:${side > 0 ? '0%' : '-100%'}`;
    const v = q.val(), s = box.lastChild; if (s.textContent !== v) s.textContent = v;
    return true;
  });
}

// ---- 입자: 물보라·물결·먼지·충격 고리 (#kfx 캔버스에 KID.frame이 그린다) ----
function dirSplash() {
  const p = khProj(LOOK.obj().clone()), y = p.y + 26;
  for (let i = 0; i < 28; i++) DIR.parts.push({ k: 'drop', x: p.x + rr(-14, 14), y, vx: rr(-2.6, 2.6), vy: rr(-7.5, -2.5), r: rr(1.4, 3.2), life: rr(0.6, 1.0) });
  for (let i = 0; i < 3; i++) DIR.parts.push({ k: 'ripple', x: p.x, y: y + 6, r: 6 + i * 6, life: 1.1 + i * 0.25, t0: 1.1 + i * 0.25 });
}
function dirRing(v) { const p = khProj(v); DIR.parts.push({ k: 'ring', x: p.x, y: p.y, r: 8, life: 0.5, t0: 0.5 }); }
function dirDust() {
  const sg = Math.sign(S.trk.v), p = khProj(V3(blockX(S.trk.x) - sg * PC.block.w * 0.5, TRK_Y + 0.006, TRK.z + 0.03));
  DIR.parts.push({ k: 'dust', x: p.x + rr(-4, 4), y: p.y + rr(-2, 2), vx: -sg * rr(0.3, 1.4), vy: -rr(0.1, 0.6), r: rr(2.5, 5), life: rr(0.6, 1.1), t0: 1, c: S.surface === 'sand' ? '150,110,70' : '185,150,105' });
}
function dirDraw(c, dt) {
  const f = dt * 60;
  for (const q of DIR.parts) {
    q.life -= dt;
    if (q.k === 'drop') { q.vy += 0.32 * f; q.x += q.vx * f; q.y += q.vy * f; c.fillStyle = `rgba(205,236,255,${clamp(q.life * 2, 0, 0.9)})`; c.beginPath(); c.arc(q.x, q.y, q.r, 0, 7); c.fill(); }
    else if (q.k === 'ripple') { const k = 1 - q.life / q.t0; c.strokeStyle = `rgba(220,242,255,${clamp(q.life, 0, 0.7)})`; c.lineWidth = 1.5; c.beginPath(); c.ellipse(q.x, q.y, q.r + k * 60, (q.r + k * 60) * 0.28, 0, 0, 7); c.stroke(); }
    else if (q.k === 'ring') { const k = 1 - q.life / q.t0; c.strokeStyle = `rgba(255,255,255,${q.life * 1.6})`; c.lineWidth = 3 * (1 - k) + 0.5; c.beginPath(); c.arc(q.x, q.y, q.r + k * 46, 0, 7); c.stroke(); }
    else if (q.k === 'dust') { q.x += q.vx * f; q.y += q.vy * f; q.r += 0.12 * f; c.fillStyle = `rgba(${q.c},${clamp(q.life * 0.45, 0, 0.35)})`; c.beginPath(); c.arc(q.x, q.y, q.r, 0, 7); c.fill(); }
  }
  DIR.parts = DIR.parts.filter((q) => q.life > 0);
}

// ---- 원격 측정 그래프: 최근 6초의 힘 ----
function dirTele(dt) {
  const cv = document.querySelector('#kid .ktele'); if (!cv) return;
  const st = S.station;
  if (DIR.teleSt !== st) { DIR.teleSt = st; DIR.tele.length = 0; DIR.marks.length = 0; }
  DIR.teleAcc += dt * DIR.ts;
  if (DIR.teleAcc >= 0.05) {
    DIR.teleAcc = 0;
    DIR.tele.push(st === 'track' ? [Math.abs(S.F ? S.F.Fa : 0), Math.abs(S.F ? S.F.f : 0)] : [S.Tlive, S.hang ? S.hang.B : 0]);
    if (DIR.tele.length > 120) { DIR.tele.shift(); DIR.marks = DIR.marks.map((i) => i - 1).filter((i) => i >= 0); }
  }
  const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight; if (!W) return;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  const cols = st === 'track' ? [hex(FCOL.F), hex(FCOL.f)] : [hex(FCOL.T), hex(FCOL.B)];
  const names = st === 'track' ? [L2('당기는 힘', 'Pull'), L2('붙잡는 힘', 'Grip')] : [L2('저울', 'Scale'), L2('부력', 'Buoyancy')];
  const mx = Math.max(st === 'track' ? 3 : 1, ...DIR.tele.map((q) => Math.max(q[0], q[1]))) * 1.15, x0 = 8, x1 = W - 8, y0 = 18, y1 = H - 6;
  c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y1); c.lineTo(x1, y1); c.stroke();
  const X = (i) => x0 + (i / 119) * (x1 - x0), Y = (v) => y1 - (v / mx) * (y1 - y0);
  for (const i of DIR.marks) { c.strokeStyle = 'rgba(252,165,165,.55)'; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(X(i), y0 - 4); c.lineTo(X(i), y1); c.stroke(); c.setLineDash([]); }
  for (let s = 1; s >= 0; s--) {
    c.strokeStyle = cols[s]; c.lineWidth = s ? 1.6 : 2; c.beginPath();
    DIR.tele.forEach((q, i) => (i ? c.lineTo(X(i), Y(q[s])) : c.moveTo(X(i), Y(q[s])))); c.stroke();
  }
  c.font = '600 10px "Noto Sans KR", sans-serif'; c.textBaseline = 'top';
  c.fillStyle = cols[0]; c.fillText(names[0], x0, 4); const w0 = c.measureText(names[0]).width;
  c.fillStyle = cols[1]; c.fillText(names[1], x0 + w0 + 10, 4);
}

// ---- 매 프레임 (실제 시간) ----
function dirFrame(dt) {
  const kid = dirOn(), r = S.hang;
  if (!kid) { document.body.classList.remove('kcut', 'kbars', 'kslow'); DIR.parts.length = 0; if (DIR.callouts.length) dirCallouts(dt); return; }
  if (r && S.station === 'hang') {
    if (DIR.prevIn === false && r.inFluid && !r.empty) dirEvent('splash');
    if (DIR.prevFloat === false && r.floating) dirEvent('float');
  }
  DIR.prevIn = r ? r.inFluid : null; DIR.prevFloat = r ? r.floating : null;
  if (S.station === 'track' && Math.abs(S.trk.v) > 0.03 && S.surface !== 'glass' && !CAM.fly) {
    DIR.dustAcc += dt * Math.min(40, Math.abs(S.trk.v) * 70);
    while (DIR.dustAcc > 1) { DIR.dustAcc--; dirDust(); }
  }
  dirCallouts(dt); dirTele(dt);
  if (DIR.tone && AUD.ctx) { const k = DIR.grabK, f = k === 'jack' ? 150 + (S.jack.tgt - PC.jack.min) * 900 : 80 + ((S[k] && S[k].tgt) || 0) * 30; DIR.tone.o.frequency.setTargetAtTime(f, AUD.ctx.currentTime, 0.05); }
  if (PIPE.finish) PIPE.finish.uniforms.uVig.value = 0.5 + (1 - DIR.ts) * 0.6;
}
