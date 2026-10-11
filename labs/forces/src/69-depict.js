// ==== 13d 묘사 (쉬운 모드): 실험 과정·결과를 한눈에 ====
// docs/experiment-depiction.md 의 원칙을 구현한다.
//  · 돋보기 렌즈: 접촉면·물속을 교과서식 단면 도해(코드로 그린 SVG)로 열어 '보이지 않는 이유'를 보여 준다
//  · 실험 노트: 시행마다 조건(그림)과 잰 값(막대)을 한 줄씩 자동 기록 → 결과를 '비교'로 본다
//    이번에 바꾼 조건만 테두리로 강조하고, 두 개 이상 바꾸면 공정한 실험 안내
const SURF_IMG = { glass: 'micro-glass', wood: 'micro-wood', sand: 'micro-sand' };

// ---- 단면 도해: 모눈 위 선화 + 평면 채색 (실험실 계기판과 같은 시각 언어) ----
function microSVG(k) {
  const W = 200, pts = (f, x0 = -5, x1 = 205, st = 2) => { const a = []; for (let x = x0; st > 0 ? x <= x1 : x >= x1; x += st) a.push(`${x},${f(x).toFixed(1)}`); return a.join(' '); };
  const bg = `<defs><pattern id="mg" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="#e2e6ec" stroke-width=".7"/></pattern></defs><rect width="${W}" height="${W}" fill="#f8fafc"/><rect width="${W}" height="${W}" fill="url(#mg)"/>`;
  const grain = (y0, y1, c) => Array.from({ length: 5 }, (_, i) => { const y = y0 + (i + 0.5) * (y1 - y0) / 5; return `<path d="M-5 ${y} C 50 ${y - 3} 120 ${y + 3} 205 ${y - 1}" stroke="${c}" stroke-width="1.2" fill="none"/>`; }).join('');
  if (k === 'micro-water') {
    const arrows = (d, l) => `<path d="${d}" stroke="#0284c7" stroke-width="${l}" stroke-linecap="round" fill="none" marker-end="url(#wa)"/>`;
    return `<svg viewBox="0 0 ${W} ${W}" aria-hidden="true">${bg}<defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dbeffa"/><stop offset="1" stop-color="#7cc4ea"/></linearGradient>
      <marker id="wa" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0L6 3L0 6z" fill="#0284c7"/></marker></defs>
      <rect x="20" y="58" width="160" height="150" fill="url(#wg)"/><path d="M20 58H180" stroke="#38a3d6" stroke-width="2"/>
      <path d="M100 0V74" stroke="#64748b" stroke-width="1.6"/>
      <rect x="80" y="74" width="40" height="56" rx="3" fill="#d6dae0" stroke="#64748b" stroke-width="2"/><path d="M86 80V124" stroke="#eef1f4" stroke-width="3"/>
      ${arrows('M92 50V68', 2.4)}${arrows('M108 50V68', 2.4)}
      ${arrows('M92 176V140', 3.6)}${arrows('M108 176V140', 3.6)}
      ${arrows('M52 96H72', 2.6)}${arrows('M52 112H72', 2.6)}${arrows('M148 96H128', 2.6)}${arrows('M148 112H128', 2.6)}</svg>`;
  }
  // 위: 도막(나무), 아래: 바닥. 맞닿는 선의 모양이 마찰의 크기를 말해 준다
  const blockTop = 24, line = { 'micro-glass': () => 104, 'micro-wood': (x) => 104 + 2.6 * Math.sin(x / 6.5) + 1.6 * Math.sin(x / 2.7 + 1) }[k];
  const block = (f) => `<polygon points="-5,${blockTop} 205,${blockTop} ${pts(f, 205, -5, -2)}" fill="#ecd3ad" stroke="#9a6b3d" stroke-width="2"/>${grain(blockTop + 6, 96, '#d7b689')}`;
  if (k === 'micro-sand') {
    let grit = '';
    for (let i = 0, x = 4; x < 205; i++, x += 19) {
      const h = 24 + (i * 7) % 9, w = 17 + (i * 5) % 6, c = ['#8a7a6d', '#6f6259', '#a08b7b'][i % 3];
      grit += `<polygon points="${x - w / 2},128 ${x + (i % 2 ? 2 : -2)},${128 - h} ${x + w / 2},128" fill="${c}" stroke="#463b33" stroke-width="1.6" stroke-linejoin="round"/>`;
    }
    // 알갱이 끝이 도막 밑면에 박힌다 (맞물림): 도막 밑면을 알갱이 끝보다 아래에 두고 알갱이를 위에 그린다
    const f = () => 112;
    return `<svg viewBox="0 0 ${W} ${W}" aria-hidden="true">${bg}<rect x="-5" y="128" width="210" height="22" fill="#c69a6b" stroke="#8a5f38" stroke-width="2"/><rect x="-5" y="150" width="210" height="60" fill="#e5e7eb"/>${block(f)}${grit}</svg>`;
  }
  const base = k === 'micro-glass'
    ? `<rect x="-5" y="104" width="210" height="66" fill="#d5edf3" stroke="#6aa6b8" stroke-width="2"/><path d="M14 118H70M24 126H52" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>`
    : `<polygon points="${pts(line)} 205,170 -5,170" fill="#c48b55" stroke="#7a4f27" stroke-width="2"/>${grain(112, 166, '#a7713f')}`;
  return `<svg viewBox="0 0 ${W} ${W}" aria-hidden="true">${bg}${base}<rect x="-5" y="170" width="210" height="40" fill="#e5e7eb"/>${block(line)}</svg>`;
}

// ---- 돋보기 렌즈 ----
const LENS = { cur: null };
const LENS_WATER_SVG = '';   // 물속 단면은 microSVG('micro-water') 안에 압력 화살표까지 그린다
function dirLens(at, img, title, val, col, dur = 3.4, overlay = '') {
  if (!dirOn()) return;
  const L = dirLayer('kcall');
  if (LENS.cur) { const o = LENS.cur.el; o.classList.add('out'); setTimeout(() => o.remove(), 450); }   // 새 돋보기가 열리면 이전 것은 바로 닫는다
  const el = document.createElement('div'); el.className = 'klens'; el.style.setProperty('--c', col);
  el.innerHTML = `<i class="ln"></i><i class="d"></i><div class="lw"><div class="lc">${microSVG(img)}</div>${overlay}<span class="ltag">${ico('eye')}${L2('가까이 보면', 'Up close')}</span></div><div class="lcap"><b>${title}</b><span></span></div>`;
  L.appendChild(el);
  LENS.cur = { el, at, val, t: 0, dur, side: DIR.side = -DIR.side };
  sfx('whoosh');
}
function dirLensFrame(dt) {
  const q = LENS.cur; if (!q) return;
  q.t += dt;
  if (q.t > q.dur + 0.5 || !dirOn()) { q.el.remove(); LENS.cur = null; return; }
  if (q.t > q.dur) q.el.classList.add('out');
  const R = innerWidth < 640 ? 62 : 86, p = khProj(q.at());
  const side = p.x > innerWidth * 0.62 ? -1 : p.x < innerWidth * 0.38 ? 1 : q.side;
  const top = (document.querySelector('#kid .kban')?.getBoundingClientRect().bottom || 120) + R + 14;
  const cx = clamp(p.x + side * (R + 70), R + 12, innerWidth - R - 12), cy = clamp(p.y - R - 40, top, innerHeight - R - 120);
  const dx = cx - p.x, dy = cy - p.y, d = Math.hypot(dx, dy) || 1, len = Math.max(0, d - R), ang = Math.atan2(dy, dx);
  const [ln, dot, w, cap] = q.el.children;
  ln.style.cssText = `left:${p.x}px;top:${p.y}px;width:${len}px;--a:${ang}rad`;
  dot.style.cssText = `left:${p.x}px;top:${p.y}px`;
  w.style.cssText = `left:${cx}px;top:${cy}px;--r:${R}px`;
  cap.style.cssText = `left:${cx}px;top:${cy + R + 10}px`;
  const v = q.val ? q.val() : '', s = cap.lastChild; if (s.textContent !== v) s.textContent = v;
}
// 지금 기구에 맞는 돋보기 (도구대 '돋보기' 버튼)
function lensNow() {
  if (S.station === 'track') dirLens(() => V3(blockX(S.trk.x), TRK_Y + 0.004, TRK.z), SURF_IMG[S.surface], `${T('surfName')[S.surface]} · ${SURF_FEEL[S.surface][isEn() ? 1 : 0]}`, () => `${L2('붙잡는 힘 최대', 'Max grip')} ${fx(S.F ? S.F.fsMax : 0, 1)} N`, hex(FCOL.f), 4);
  else dirLens(() => LOOK.obj().clone(), 'micro-water', L2('물이 사방에서 눌러요', 'Water presses on all sides'), () => `${L2('아래가 더 세게 → 부력', 'Stronger from below → buoyancy')} ${fx(S.hang ? S.hang.B : 0, 2)} N`, hex(FCOL.B), 4, LENS_WATER_SVG);
}

// ---- 실험 노트: 시행 기록과 비교 막대 ----
const NOTE = { rec: { track: [], hang: [] }, el: null, open: !matchMedia('(max-width:980px)').matches, sig: '', flash: -1 };
const NOTE_Q = new Set(['floor', 'boss', 'weights', 'moon', 'water', 'float']);   // 노트를 보여 줄 퀘스트
const NOTE_KEYS = { track: ['s', 'l'], hang: ['o', 'n', 'f', 'w', 'g'] };
function noteAdd(st, r) {
  const A = NOTE.rec[st], last = A[A.length - 1], key = (q) => NOTE_KEYS[st].map((k) => q[k]).join('|');
  if (last && key(last) === key(r)) { last.v = r.v; NOTE.flash = A.length - 1; }
  else { A.push(r); if (A.length > 6) A.shift(); NOTE.flash = A.length - 1; sfx('pick'); }
  NOTE.sig = '';
}
function noteTrack(e) { if (dirOn()) noteAdd('track', { s: S.surface, l: S.load.tgt, v: e && e.fsMax || 0 }); }
function noteHang() {
  const r = S.hang; if (!r || r.empty || S.settle < 0.5 || KH.drag) return;
  const w = r.floating ? 'float' : r.frac > 0.98 ? 'in' : r.frac < 0.02 ? 'out' : null; if (!w) return;
  noteAdd('hang', { o: S.obj, n: S.obj === 'weights' ? S.n.tgt : 0, f: w === 'out' ? '' : S.fluid, w, g: (PHYS.nearPlanet(S.g.tgt) || {}).id || 'x', v: S.Tlive });
}
function noteShown() {
  const m = KID.missions[KID.i];
  if (S.mode !== 'kid' || document.getElementById('kidIntro').classList.contains('on') || KID.phase() === 'predict' || CAM.fly) return false;
  if (S.station !== 'track' && S.station !== 'hang') return false;
  return KID.free || !!(m && NOTE_Q.has(m.id) && KID.i < KID.missions.length);
}
function noteConds(st, q, p) {
  const ch = (k) => (p && p[k] !== q[k] ? ' chg' : '');
  if (st === 'track') return `<span class="knc${ch('s')}">${swatch(q.s)}</span><span class="knc${ch('l')}">${ico('box')}<em>${q.l}</em></span>`;
  const obj = q.o === 'weights' ? `${ico('weight')}<em>${q.n}</em>` : swatch(q.o === 'al' ? 'al' : 'wood');
  const med = q.w === 'out' ? `<em>${L2('공기', 'Air')}</em>` : `<span class="kfl ${q.f}"></span>`;
  const g = q.g === 'moon' ? ico('moon') : q.g === 'mars' ? '<span class="kpl"></span>' : ico('globe');
  return `<span class="knc${ch('o')}${ch('n')}">${obj}</span><span class="knc${ch('w')}${ch('f')}">${med}</span><span class="knc${ch('g')}">${g}</span>`;
}
function noteRender() {
  const st = S.station, A = NOTE.rec[st] || [], el = NOTE.el;
  const sig = `${st}|${NOTE.open}|${LANG}|${A.map((q) => Object.values(q).join(',') + fx(q.v, 2)).join(';')}|${NOTE.flash}`;
  if (sig === NOTE.sig) return; NOTE.sig = sig;
  const mx = Math.max(st === 'track' ? 2 : 1, ...A.map((q) => q.v)) * 1.08;
  const what = st === 'track' ? L2('미끄러지기 시작한 힘', 'Force when it starts to slide') : L2('저울 눈금', 'Scale reading');
  const prev = (i) => A[i - 1];
  const nChg = A.length > 1 ? NOTE_KEYS[st].filter((k) => A.at(-1)[k] !== A.at(-2)[k] && !(st === 'hang' && k === 'f' && A.at(-1).w !== A.at(-2).w)).length : 0;
  const empty = st === 'track' ? L2('줄을 당겨 도막을 미끄러뜨리면 여기에 기록돼요', 'Pull until the block slides — it gets recorded here') : L2('추가 멈추면 저울 눈금이 기록돼요. 물에 넣어 보세요', 'When it settles, the reading is recorded. Try dipping it in water');
  el.innerHTML = `<button class="knh"><span class="kni">${ico('ruler')}</span><b>${L2('실험 노트', 'Lab notes')}</b><em>${A.length}</em>${ico('chevR')}</button>
    <div class="knb"><div class="kny">${L2('잰 것', 'Measured')} · <b>${what}</b></div>
    ${A.length ? `<div class="knrows">${A.map((q, i) => `<div class="knr${i === NOTE.flash ? ' new' : ''}">${noteConds(st, q, prev(i))}<span class="knbar"><i style="--w:${(q.v / mx) * 100}%;--c:${hex(st === 'track' ? FCOL.f : FCOL.T)}"></i></span><b>${fx(q.v, st === 'track' ? 1 : 2)}<small> N</small></b></div>`).join('')}</div>` : `<p class="kne">${empty}</p>`}
    ${nChg >= 2 ? `<p class="knw">${ico('info')}${L2('한꺼번에 두 가지를 바꿨어요. 하나만 바꿔야 무엇 때문인지 알 수 있어요', 'You changed two things at once. Change one at a time to know which one matters')}</p>` : A.length > 1 ? `<p class="knt">${L2('테두리 = 이번에 바꾼 조건', 'Outlined = what you changed')}</p>` : ''}</div>`;
  el.querySelector('.knh').onclick = () => { NOTE.open = !NOTE.open; NOTE.sig = ''; noteRender(); };
  el.classList.toggle('open', NOTE.open);
}
function noteFrame() {
  if (!NOTE.el) { NOTE.el = document.createElement('div'); NOTE.el.id = 'knote'; document.body.appendChild(NOTE.el); }
  const show = noteShown(); NOTE.el.classList.toggle('on', show); if (!show) return;
  if (S.station === 'hang') noteHang();
  noteRender();
  // 자리: 왼쪽 위 (퀘스트 카드와 겹치면 그 아래)
  const mb = document.getElementById('modeBtn'), b = mb && mb.offsetParent ? mb.getBoundingClientRect() : null, ban = document.querySelector('#kid .kban')?.getBoundingClientRect(), hud = document.getElementById('kidhud')?.getBoundingClientRect();
  let top = Math.max(b ? b.bottom + 10 : 0, hud ? hud.bottom + 8 : 0); const w = NOTE.el.offsetWidth || 260;
  if (ban && ban.height && ban.left < 16 + w + 8) top = Math.max(top, ban.bottom + 10);
  const t = `${Math.round(top)}px`; if (NOTE.el.style.top !== t) NOTE.el.style.top = t;
}
// 레일에 '지난번' 눈금
function noteLast() { const A = NOTE.rec.track; return A.length ? A[A.length - 1].v : null; }
