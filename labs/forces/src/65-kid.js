// Easy mode: outline diagrams, predictions, stars and force album.
// 힘 카드 (모으는 순서 = 처음 배우는 순서)
const CARDS = ['F','net','W','T','f','B','N'].map(k => ({ k, col: FCOL[k] }));

const n1 = (v) => fx(v, 1);
const isEn = () => LANG === 'en';
const L2 = (ko, en) => (isEn() ? en : ko);
const XMIN = () => PC.track.xmin + 0.02;
// 끌기대 공통 준비
function kidTrack(surface = 'glass', x) { setStation('track', false); setSame(false); setSurface(surface); setParam('load', 0, true); setParam('F1', 0, true); setParam('F2', 0, true); setParam('g', 9.8, true); resetTrack(x); S.playing = true; S.speed = 1; }
function kidHang(obj, n = 0) { setStation('hang', false); S.obj = obj; S.settle = 0; setFluid('water'); setParam('g', 9.8, true); setParam('n', n, true); S.jack.tgt = PC.jack.min; S.hv.v += 0.02; }
// 눈길 고리를 띄울 곳 (세계 좌표)
const _lk = new THREE.Vector3();
const LOOK = {
  block: () => _lk.set(blockX(S.trk.x), AXIS_Y + 0.01, TRK.z),
  scale: () => _lk.set(HS.x, TOP + 0.6, HS.z),
  obj: () => { HERO.obj.getWorldPosition(_lk); return _lk.setY(_lk.y + (S.hang ? S.hang.h / 2 : 0.03)); },
};
function kidDesign(s) { const L = S.load.tgt; kidTrack(s); setParam('load', L, true); KID.ctx.fail = false; KID.ctx.hold = 0; }


// 선 아이콘 (24×24, 2px 선). 이모지는 기기마다 모양이 달라 교과서 화면에 쓰지 않는다
const ICON = {
  explore: '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5z"/>',
  book: '<path d="M12 5v16M3 3l9 2 9-2v16l-9 2-9-2z"/>',
  home: '<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3z"/>',
  graph: '<path d="M3 3v18h18M6 16l5-7 4 3 6-8"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>',

  drop: '<path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M8 15a4 4 0 0 0 4 4"/>',
  planet: '<circle cx="12" cy="12" r="8"/><circle cx="9" cy="8" r="1.5"/><path d="M14 13h3M7 16h3"/>',
  clips: '<path d="M16 7v10a4 4 0 0 1-8 0V6a3 3 0 0 1 6 0v10a2 2 0 0 1-4 0V8"/>',
  tools: '<path d="M3 4h7l2 3 2-3h7v15h-7l-2 2-2-2H3zM12 7v14M6 8v7m-2-4h4M16 9l3 5m0-5-3 5"/>',
  teach: '<path d="M3 3h18v13H3zM12 16v5m-5 0 5-5 5 5M6 7h9M6 11h6"/>',
  spring: '<path d="M12 2v3l-5 2 10 3-10 3 10 3-5 3v3"/>',
  double: '<path d="m3 8 6 8m0-8-6 8M14 9a3 3 0 1 1 5 2l-5 6h7"/>',
  reverse: '<path d="M20 17v-6a6 6 0 0 0-6-6H4m4-4L4 5l4 4M15 17h5l-4 4"/>',
  balance: '<path d="M12 3v17M7 21h10M3 7h18M5 7l-3 8h6L5 7Zm14 0-3 8h6l-3-8Z"/>',
  speaker: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  get mute() { return this.speaker + '<path d="M3 3l18 18"/>'; },
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.6-1.8"/>',
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>', arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  arrowU: '<path d="M12 19V5M6 11l6-6 6 6"/>', arrowD: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  hold: '<path d="M2.5 12h4M21.5 12h-4M5 9l3 3-3 3M19 9l-3 3 3 3"/><rect x="9.5" y="8" width="5" height="8" rx="1"/>',
  equal: '<path d="M5 9h14M5 15h14"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  sink: '<path d="M3 16c2 0 2-1.5 4.5-1.5S10 16 12 16s2.5-1.5 4.5-1.5S19 16 21 16"/><path d="M12 3v8M9 8l3 3 3-3"/>',
  float: '<path d="M3 16c2 0 2-1.5 4.5-1.5S10 16 12 16s2.5-1.5 4.5-1.5S19 16 21 16"/><rect x="8" y="8.5" width="8" height="4.5" rx="1"/>',
  faster: '<path d="M5 6l6 6-6 6M13 6l6 6-6 6"/>', slower: '<path d="M3 12h3M9 12h2.5M14.5 12h1.5"/><path d="M17.5 8l3 4-3 4"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2.5"/>',
  grip: '<g class="f"><circle cx="9" cy="7" r="1.4"/><circle cx="15" cy="7" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="17" r="1.4"/><circle cx="15" cy="17" r="1.4"/></g>',
  tap: '<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="7.5" opacity=".45"/>',
  puller: '<circle cx="12" cy="12" r="6.5" fill="currentColor" stroke="none"/>',
  box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
  weight: '<circle cx="12" cy="4.6" r="1.8"/><path d="M12 6.4V8.5"/><rect x="6.5" y="8.5" width="11" height="12.5" rx="2.5"/>',
  beaker: '<path d="M5 3h14M7 3v14.5A3.5 3.5 0 0 0 10.5 21h3a3.5 3.5 0 0 0 3.5-3.5V3"/><path d="M7 12h10"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
  circle: '<circle cx="12" cy="12" r="8"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
  star: '<path class="f" d="M12 2.8l2.8 5.7 6.3.9-4.55 4.45 1.07 6.25L12 17.15 6.38 20.1l1.07-6.25L2.9 9.4l6.3-.9z"/>',
  chevR: '<path d="M9 6l6 6-6 6"/>', reset: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5"/><path d="M3.5 3.5v5h5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  ruler: '<rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M6.5 8v3M10.5 8v4M14.5 8v3M18.5 8v4"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.6 13.9 7 22l5-3 5 3-1.6-8.1"/>',
  trophy: '<path d="M8 21h8M12 16.5V21M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5.5h3V7a3 3 0 0 1-3 3M7 5.5H4V7a3 3 0 0 0 3 3"/>',
  flag: '<path d="M5 21V4"/><path class="f" d="M5 4h12l-2.5 4L17 12H5z"/>',
  cards: '<rect x="3.5" y="3" width="12" height="16" rx="2"/><path d="M8 21h10.5a2 2 0 0 0 2-2V7.5"/>',
};
const ico = (n, c = '') => `<svg class="ki ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(ICON[n] || '').replace(/class="f"/g, 'fill="currentColor" stroke="none"')}</svg>`;
const kcb = (on) => `<i class="kcb${on ? ' on' : ''}">${on ? ico('check') : ''}</i>`;
function swatch(s) {
  const surface = { glass: '<path d="M3 10h18M5 14h6m3 3h5"/>', sand: '<path d="m3 14 3-5 3 5 3-5 3 5 3-5 3 5M4 18h16"/>', wood: '<path d="M3 8c5-3 10 3 18 0M3 13c7 3 10-3 18 0M3 18c5-3 10 3 18 0"/>', al: '<path d="m4 16 12-12M9 20 20 9M4 10l6-6"/>' };
  return `<svg class="ksw ${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="3"/>${surface[s] || surface.wood}</svg>`;
}
// 예상 그림: i:선 아이콘 / s:재질 견본 / a:화살표 길이 / 그 외:저울 그림
function predPic(id, k) {
  const pic = KID.missions.find(m => m.id === id)?.pred?.pics[k];
  if (pic == null) return '';
  if (typeof pic !== 'string' || !pic.includes(':')) return balancePicture(pic).replace('viewBox="0 0 240 100"', 'viewBox="40 0 170 100"');
  const [type, value] = pic.split(':');
  return type === 'i' ? ico(value) : type === 's' ? swatch(value) : kidArrow(+value);
}
// Same three ticks, with a zero-, one-, or two-interval arrow.
function kidArrow(n) {
  const end = 3 + clamp(n, 0, 2) * 8;
  return `<svg class="ki" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g fill="currentColor" stroke="none"><circle cx="3" cy="19" r="1"/><circle cx="11" cy="19" r="1"/><circle cx="19" cy="19" r="1"/></g>${n > 0 ? `<path d="M3 11h${end-3}m-4-4 4 4-4 4"/>` : '<circle cx="3" cy="11" r="2"/>'}</svg>`;
}
function kidMeter(m) {
  const part = (pic, value, color) => `<span style="color:${hex(color)}">${pic}<b class="kn">${value}</b></span>`;
  const force = (key, dir = 'arrowR') => part(ico(dir), `${n1(S[key].tgt)} N`, FCOL.F);
  const scale = () => part(ico('balance'), `${fx(S.Tlive, 2)} N`, FCOL.T);
  const checks = entries => `<div class="kchk">${entries.map(([on, pic]) => `<span>${kcb(on)}${pic}</span>`).join('')}</div>`;
  let body = '', extra = '';
  switch (m.id) {
    case 'pull': body = force('F2'); break;
    case 'tug': body = `${force('F1', 'arrowL')}<span class="keq${S.F1.tgt === S.F2.tgt ? ' checked' : ''}">${ico('equal')}</span>${force('F2')}`; break;
    case 'team': body = `${force('F1')}${ico('plus')}${force('F2')}${ico('equal')}${part(kidArrow(S.F1.tgt + S.F2.tgt), `${n1(S.F1.tgt + S.F2.tgt)} N`, FCOL.net)}`; break;
    case 'moon': body = `${scale()}${part(ico('weight'), S.n.tgt * 50, FCOL.W)}`; break;
    case 'weights': {
      const got = KID.ctx.got || new Set(), st = PC.weightMass * 9.8 / PC.kHang * 100;
      body = `${part(ico('weight'), S.n.tgt, FCOL.W)}${part(ico('spring'), fx(S.hv.x * 100, 1), FCOL.T)}<div class="kstb">${[1,2,3,4,5].map(n => `<span class="kst${got.has(n) ? ' on' : ''}${S.n.tgt === n ? ' cur' : ''}"><i style="height:${n*8}px"></i><em>${got.has(n) ? fx(n*st,1) : '?'}</em></span>`).join('')}</div>`;
      break;
    }
    case 'floor': body = `${swatch(S.surface)}${force('F2')}`; extra = checks([[KID.ctx.glass, swatch('glass') + ico('arrowR')], [KID.ctx.sand, swatch('sand') + ico('hold')]]); break;
    case 'water': {
      const frac = S.hang?.frac || 0;
      body = `${scale()}<span style="color:${hex(FCOL.B)}"><svg class="ki" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 3h14M7 3v17h10V3"/><path d="M10 18V${18-frac*12}" stroke-width="4"/></svg><b class="kn">${fx(frac*100,0)}%</b></span>`;
      break;
    }
    case 'motion': {
      const v = Math.abs(S.trk.v), a = S.F && v > .01 ? S.F.a * Math.sign(S.trk.v) : 0;
      body = part(ico(v < .01 ? 'stop' : a > .02 ? 'faster' : a < -.02 ? 'slower' : 'equal'), fx(v,2), FCOL.net);
      extra = checks([[S.seen.acc, ico('faster')], [S.seen.dec, ico('slower')], [S.seen.rev, ico('reverse')]]); break;
    }
    case 'boss': body = `${swatch(S.surface)}${part(ico('box'), S.load.tgt, FCOL.N)}${force('F2')}${ico(KID.ctx.fail ? 'arrowR' : 'hold')}`; break;
  }
  return (body ? `<div class="kmeter">${body}</div>` : '') + extra;
}
const STEP_OBJ = { F1: 'puller', F2: 'puller', surface: 'swatch', block: 'box', obj: 'weight', jack: 'beaker' };
function kidSteps(m) {
  if (m.demo) return m.demo.map(([from, to]) => `<span class="kstep"><span class="kso">${ico(from.startsWith('ring:') ? 'ruler' : from.startsWith('clip:') ? 'clips' : 'weight')}</span><span class="ksa">${ico(to.startsWith('tick:') ? 'arrowL' : 'arrowD')}</span><span class="kso">${ico('balance')}</span></span>`).join('');
  if (m.widget === 'rocket') return `<span class="kstep"><span class="kso">${ico('globe')}</span><span class="ksa R">${ico('arrowR')}</span><span class="kso">${ico('moon')}</span></span>`;
  const hs = m.hint || [];
  return hs.map(([k, g, dx, dy], i) => {
    const o = STEP_OBJ[k] || 'tap', a = g === 'drag' ? (dx > 0 ? 'R' : dx < 0 ? 'L' : dy < 0 ? 'U' : 'D') : 'tap';
    return `<span class="kstep">${hs.length > 1 ? `<em>${i + 1}</em>` : ''}<span class="kso${o === 'puller' ? ' knob' : ''}">${o === 'puller' ? ico('grip') : o === 'swatch' ? swatch('sand') : ico(o)}</span><span class="ksa ${a}">${ico(a === 'tap' ? 'tap' : 'arrow' + a)}</span></span>`;
  }).join('');
}
const AUTO_NEXT = 7.5, WIN_DELAY = 1.4;   // 성공 뒤 결과를 1.4초 지켜본 다음 팝업   // 성공 팝업이 떠 있는 시간(초). 지나면 저절로 다음 퀘스트
const KID = {
  i: -1, pick: [], cards: new Set(), stars: [], ctx: {}, passed: false, free: false,
  missions: [
    {
      id: 'pull', diagram: 'pull', stage: 1, shot: 'track', look: 'block', theme: 'field', allow: ['F2'],
      hint: [['F2', 'drag', 1, 0]],
      enter() { kidTrack('glass'); },
      reset() { setParam('F2', 0); resetTrack(); },
      check: () => S.dist >= 0.05, card: 'F',
    },
    {
      id: 'tug', diagram: 'tug', stage: 2, shot: 'track', look: 'block', theme: 'field', allow: ['F1', 'F2'],
      hint: [['F1', 'drag', -1, 0], ['F2', 'drag', 1, 0]],
      pred: { ans: 1, pics: ['i:arrowL', 'i:hold', 'i:arrowR'] },
      enter() { kidTrack('glass'); S.pin = true; },
      reset() { setParam('F1', 0); setParam('F2', 0); resetTrack(); S.pin = true; KID.ctx.armT = KID.ctx.freeT = null; },
      // 마우스로는 손잡이를 하나씩만 잡을 수 있다 → 양쪽을 다 맞출 때까지 도막을 핀으로 잡아 두고, 손을 떼면 잠시 뒤 풀어 준다
      tick() {
        const c = KID.ctx, now = DIR.t;
        if (DRAG.kind || S.F1.tgt < 1 || S.F2.tgt < 1) {
          if (!S.pin) { S.pin = true; resetTrack(); sfx('click'); }
          if (DRAG.kind && Math.abs(S.trk.x - PC.track.x0) > 1e-4) resetTrack();
          c.armT = c.freeT = null; return;
        }
        if (S.pin) { if (c.armT == null) c.armT = now; if (now - c.armT >= KH_PIN_T) { S.pin = false; c.freeT = now; sfx('pop'); DIR.punch = Math.max(DIR.punch, 0.05); } }
      },
      check: () => S.F1.tgt >= 1 && S.F1.tgt === S.F2.tgt && S.trk.v === 0 && !S.same && !S.pin && KID.ctx.freeT != null && DIR.t - KID.ctx.freeT > 1.1, card: 'net',
    },
    {
      id: 'team', diagram: 'team', stage: 3, shot: 'track', look: 'block', theme: 'field', allow: ['F1', 'F2'],
      hint: [['F1', 'drag', 1, 0], ['F2', 'drag', 1, 0]],
      pred: { ans: 2, pics: ['a:0', 'a:1', 'a:2'] },
      enter() { kidTrack('glass', XMIN()); setSame(true); S.speed = 0.5; },
      reset() { setParam('F1', 0); setParam('F2', 0); resetTrack(XMIN()); },
      check: () => S.same && S.F1.tgt >= 1 && S.F2.tgt >= 1,
    },
    {
      id: 'moon', diagram: 'moon', stage: 4, shot: 'hang', look: 'scale', theme: 'moon', allow: [], widget: 'rocket',
      pred: { ans: 2, pics: ['i:arrowU', 'i:equal', 'i:arrowD'] },
      enter() { kidHang('weights', 3); },
      check: () => S.g.tgt <= 2 && S.n.tgt >= 1 && S.settle > 0.3, card: 'W',
    },
    {
      id: 'cmp', stage: 4, shot: 'balance', allow: ['balance:obj:a', 'balance:obj:e'],
      pair: { left: 'a', right: 'e' }, setup: {}, pred: { ans: 2, pics: ['tiltL', 'flat', 'tiltR'] },
      goal: { verdict: 'heavier', value: 'R' }, diagram: 'compare',
      demo: [['obj:a', 'pan:left'], ['obj:e', 'pan:right']],
      enter: kidBalanceEnter, check: kidBalanceCheck,
    },
    {
      id: 'clip', stage: 4, shot: 'balance', allow: ['balance:clip:1', 'balance:clip:10', 'balance:pile:right'],
      setup: { left: { obj: 'c' } }, pred: { ans: 1, pics: [10, 30, 60] },
      goal: { verdict: 'level', value: true, clipsOnly: 'right' }, diagram: 'clips',
      demo: [['clip:10', 'pan:right'], ['clip:10', 'pan:right'], ['clip:10', 'pan:right']],
      enter: kidBalanceEnter, check: kidBalanceCheck,
    },
    {
      id: 'lever', stage: 4, shot: 'balance', allow: ['balance:obj:e', 'balance:ring:right'],
      pair: { right: 'e' }, setup: { left: { obj: 'b' } }, pred: { ans: 0, pics: ['inner', 'stay', 'outer'] },
      goal: { verdict: 'level', value: true, moved: 'right' }, diagram: 'moments',
      demo: [['obj:e', 'pan:right'], ['ring:right', 'tick:2']],
      enter: kidBalanceEnter, check: kidBalanceCheck,
    },
    {
      id: 'weights', diagram: 'weights', stage: 5, shot: 'hang', look: 'obj', theme: 'spring', allow: ['obj'],
      hint: [['obj', 'tap']],
      pred: { ans: 1, pics: ['i:equal', 'i:double', 'i:plus'] },
      enter() { kidHang('weights', 0); KID.ctx.got = new Set(); S.overlays.K = true; UI.syncButtons(); },
      tick() { const g = KID.ctx.got, r = S.hang; if (g && r && !r.empty && S.obj === 'weights' && S.n.tgt >= 1 && Math.round(r.m / PC.weightMass) === S.n.tgt && Math.abs(S.hv.x - r.x) < 0.004 && Math.abs(S.hv.v) < 0.04 && Math.abs(S.g.tgt - 9.8) < 0.05 && !g.has(S.n.tgt)) { g.add(S.n.tgt); sfx('pick'); KID.burst(10); } },
      check: () => KID.ctx.got && KID.ctx.got.size >= 4, card: 'T',
    },
    {
      id: 'floor', diagram: 'floor', stage: 6, shot: 'track', look: 'block', theme: 'surface', allow: ['F2', 'surface'],
      hint: [['F2', 'drag', 1, 0], ['surface', 'tap']],
      pred: { ans: 0, pics: ['s:glass', 's:sand', 'i:equal'] },
      enter() { kidTrack('glass'); },
      reset() { setParam('F2', 0); resetTrack(); },
      tick() {
        const c = KID.ctx;
        if (S.surface === 'glass' && S.F2.tgt > 0 && S.F2.tgt <= 2.5 && S.dist > 0.05) c.glass = true;
        if (S.surface === 'sand' && S.F2.tgt >= 1.5 && S.F && S.F.mode === 'held') { c.sandT = (c.sandT || 0) + 0.08; if (c.sandT > 0.8) c.sand = true; }
      },
      check: () => KID.ctx.glass && KID.ctx.sand, card: 'f',
    },
    {
      id: 'water', diagram: 'water', stage: 7, shot: 'hang', look: 'obj', theme: 'water', allow: ['jack'],
      hint: [['jack', 'drag', 0, -1]],
      pred: { ans: 2, pics: ['i:arrowU', 'i:equal', 'i:arrowD'] },
      enter() { kidHang('al'); },
      reset() { S.jack.tgt = PC.jack.min; },
      check: () => S.obj === 'al' && S.hang && S.hang.frac >= 0.999 && S.settle > 0.3, card: 'B',
    },
    {
      id: 'float', diagram: 'float', stage: 7, shot: 'hang', look: 'obj', theme: 'water', allow: ['jack'],
      hint: [['jack', 'drag', 0, -1]],
      pred: { ans: 1, pics: ['i:sink', 'i:float'] },
      enter() { kidHang('wood'); },
      reset() { S.jack.tgt = PC.jack.min; },
      check: () => S.obj === 'wood' && S.hang && S.hang.floating && S.hang.inFluid && Math.abs(S.jack.cur - S.jack.tgt) < 0.003 && !DRAG.kind,
    },
    {
      id: 'motion', diagram: 'motion', stage: 8, shot: 'track', look: 'block', theme: 'race', allow: ['F1', 'F2'],
      hint: [['F2', 'drag', 1, 0], ['F1', 'drag', -1, 0]],
      pred: { ans: 1, pics: ['i:faster', 'i:slower', 'i:stop'] },
      enter() { kidTrack('glass', XMIN()); S.speed = 0.45; S.seen = { acc: false, dec: false, rev: false }; },
      reset() { setParam('F1', 0); setParam('F2', 0); resetTrack(XMIN()); S.seen = { acc: false, dec: false, rev: false }; },
      check: () => S.seen.acc && S.seen.dec,
    },
    {
      id: 'boss', diagram: 'boss', stage: 9, boss: true, shot: 'track', look: 'block', theme: 'arena', allow: ['F2', 'surface', 'block'],
      hint: [['surface', 'tap'], ['block', 'tap'], ['F2', 'drag', 1, 0]],
      enter() { kidTrack('glass'); KID.ctx.hold = 0; KID.ctx.fail = false; },
      reset() { kidDesign(S.surface); },
      tick() { const c = KID.ctx; if (S.F2.tgt > 0 && S.F) { if (S.F.mode === 'slide' || S.F.mode === 'bump') { if (!c.fail) sfx('clack'); c.fail = true; } else if (S.F2.tgt >= 4 && S.F.mode === 'held' && S.trk.v === 0) c.hold += 0.08; } },
      check: () => S.F1.tgt === 0 && S.F2.tgt >= 4 && !KID.ctx.fail && KID.ctx.hold > 0.8 && !DRAG.kind, card: 'N',
    },
  ],
  go(i) {
    if (i >= this.missions.length) { dirTeleReset(); this.free = false; S.pin = false; this.i = this.missions.length; this.render(); this.burst(90); sfx('win'); return; }
    document.getElementById('kpop')?.classList.remove('on'); this._pid = (this._pid || 0) + 1;
    this.free = false; this.i = Math.max(0, i); this.ctx = {}; this.passed = false; this.showWin = false; S.pin = false; dirTeleReset();
    const m = this.missions[this.i];
    S.overlays.K = false; UI.syncButtons();
    m.enter && m.enter();
    S.overlays.F = true; S.overlays.L = true;
    CAM.cine = false; dirCut(m);
    if (m.look) this.ring(3.2);
    UI.syncControls(); this.render();
  },
  // 직접 조작: 지금 퀘스트에서 만질 수 있는 기구인지 (예상을 고르기 전에는 잠금)
  allows(k) { if (this.free) return true; const m = this.missions[this.i]; if (!m || !((m.allow || []).includes(k) || (KH_STATION[S.station] || []).includes(k))) return false; if (this.phase() === 'predict') { const pr = document.querySelector('#kid .kpred'); if (pr) { pr.classList.remove('shake'); void pr.offsetWidth; pr.classList.add('shake'); } return false; } return true; },
  predict(k) { const m = this.missions[this.i]; const n = m?.pred?.pics.length ?? 0; if (this.phase() !== 'predict' || !Number.isInteger(k) || k < 0 || k >= n) return; this.pick[this.i] = k; this.render(); },
  acted() { this.ctx.acted = true; this.idle = 0; },
  rocket(el) {
    const set = (e) => { const r = el.getBoundingClientRect(); const f = clamp((e.clientX - r.left) / r.width, 0, 1); let g = 9.8 - f * 8.2; for (const q of [1.6, 3.7, 9.8]) if (Math.abs(g - q) < 0.35) g = q; if (g !== S.g.tgt) { setParam('g', g); S.hv.v += 0.004; } this.acted(); this.update(); };
    el.onpointerdown = (e) => { if (this.phase() === 'predict') return this.allows('rocket'); ensureAudio(); el.setPointerCapture(e.pointerId); el.classList.add('drag'); set(e); el.onpointermove = set; };
    el.onpointerup = el.onpointercancel = () => { el.onpointermove = null; el.classList.remove('drag'); };
  },
  phase() { if (this.free) return 'play'; const m = this.missions[this.i]; return m && m.pred && this.pick[this.i] == null ? 'predict' : 'play'; },
  hud() {
    const M = this.missions, el = document.getElementById('kidhud'); if (!el) return;
    el.innerHTML = `<div class="kmode"><button data-m="q" aria-label="quest" class="${this.free ? '' : 'on'}">${ico('flag')}</button><button data-m="f" aria-label="free" class="${this.free ? 'on' : ''}">${ico('tools')}</button></div><div class="kprog${this.free ? ' off' : ''}"><span class="kpn"><b>${Math.min(this.i + 1, M.length)}</b> / ${M.length}</span><div class="kseg">${M.map((m, k) => `<i class="${this.stars[k] ? 'earned s' + this.stars[k] : ''}${k === this.i ? ' cur' : ''}${m.boss ? ' boss' : ''}" aria-label="${m.id}"></i>`).join('')}</div></div>
      <button class="ksnd" aria-pressed="${S.sound}" aria-label="${S.sound ? L2('효과음 끄기', 'Sound effects off') : L2('효과음 켜기', 'Sound effects on')}">${ico(S.sound ? 'speaker' : 'mute')}</button>`;
    el.querySelectorAll('.kmode button').forEach((b) => (b.onclick = () => { ensureAudio(); this.setFree(b.dataset.m === 'f'); }));
    el.querySelector('.ksnd').onclick = () => { setSound(!S.sound); ensureAudio(); this.hud(); };
  },
  legend() {
    const el = document.getElementById('legend'); if (!el) return;
    el.innerHTML = kidAlbum(this.cards);
  },
  render() {
    const box = document.getElementById('kid'), M = this.missions, N = M.length;
    this.hud(); this.legend();
    if (this.free) return this.renderFree();
    if (this.i >= N) { khBuild(); box.innerHTML = `<div class="kmodal"><div class="kbox">${this.finalHTML()}</div></div>`; box.querySelector('[data-k=again]').onclick = () => this.reset(); box.querySelector('[data-k=full]').onclick = () => setMode('full'); box.querySelector('[data-k=free]').onclick = () => this.setFree(true); return; }
    const m = M[this.i];
    const ph = this.phase();
    let body = '';
    if (ph === 'predict') body = `<div class="kmodal"><div class="kbox kpred${['lever','clip'].includes(m.id) ? ' klarge' : ''}"><div class="kopts n${m.pred.pics.length}">${m.pred.pics.map((_, k) => `<button class="kopt" data-p="${k}" aria-label="pick-${k}"><span class="kpic">${predPic(m.id, k)}</span></button>`).join('')}</div></div></div>`;
    else {
      const mine = m.pred ? `<div class="kmine">${predPic(m.id, this.pick[this.i])}</div>` : '';
      const rocket = m.widget === 'rocket' ? `<div class="krocket">${ico('globe')}<div class="krk"><b style="left:100%"></b><b class="mars" style="left:${(9.8 - 3.7) / 8.2 * 100}%"></b><i class="kr">${ico('grip')}</i></div>${ico('moon')}</div>` : '';
      body = `<div class="kfoot"><div class="krow">${mine}<div class="kmeterbox"></div><button class="kreset" aria-label="reset">${ico('reset')}</button></div>${rocket}</div>`;
    }
    if (m.id === 'pull') body += '<svg class="ktarget" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5 4" aria-hidden="true"><path/></svg>';
    box.innerHTML = `<div class="kban${m.boss ? ' boss' : ''}"><div class="kbtxt"><div class="kprog"><span class="kpn">${this.i + 1} / ${N}</span><div class="kseg">${M.map((q,k) => `<i class="${this.stars[k] ? 'earned s' + this.stars[k] : ''}${k === this.i ? ' cur' : ''}"></i>`).join('')}</div></div><div class="ksteps">${kidSteps(m)}</div></div><button class="kskip" aria-label="skip">${ico('chevR')}</button></div>${body}
      <div class="kwin"><div class="kbox"><div class="kprinciple"></div><div class="kstars"></div><button class="kbtn main kgo" aria-label="next">${ico(this.i === N - 1 ? 'trophy' : 'chevR')}</button><div class="kauto"><div><i></i></div></div></div></div>`;
    box.querySelectorAll('[data-p]').forEach((el) => (el.onclick = () => { ensureAudio(); this.predict(+el.dataset.p); sfx('pick'); if (m.look) this.ring(2.2); }));
    const rs = box.querySelector('.kreset'); if (rs) rs.onclick = () => { if (m.reset) m.reset(); else { this.ctx = {}; this.passed = false; this.showWin = false; m.enter(); } this.ctx.acted = false; this.update(true); };
    const rk = box.querySelector('.krk'); if (rk) this.rocket(rk);
    box.querySelector('.kgo').onclick = () => this.go(this.i + 1);
    box.querySelector('.kskip').onclick = () => this.go(this.i + 1);
    khBuild(); this.update(true);
  },
  // ---- 자유 실험실: 퀘스트 없이 실험대의 모든 기구를 마음대로 ----
  setFree(on) {
    if (on === this.free) return;
    if (!on) { this.go(Math.min(Math.max(this.i, 0), this.missions.length - 1)); return; }
    this.free = true; this.passed = false; this.showWin = false; this.ctx = {}; S.pin = false; dirTeleReset();
    if (!['track', 'hang', 'balance'].includes(S.station)) setStation('track', false);
    if (S.station === 'track') { const L = S.load.tgt; kidTrack(S.surface); setParam('load', L, true); }
    S.playing = true; S.speed = 1; S.overlays.F = true; S.overlays.L = true;
    CAM.cine = false; dirReveal(stationShot(S.station)); sfx('whoosh');
    this.render();
  },
  freeStation(st) {
    if (st === 'balance') setStation('balance', false);
    else if (st === 'track') { if (S.station !== 'track') kidTrack(S.surface); } else if (S.station !== 'hang') kidHang(S.obj, S.obj === 'weights' ? Math.max(1, S.n.tgt) : 0);
    dirTeleReset(); dirReveal(stationShot(st)); sfx('whoosh'); this.render();
  },
  freeMeter() {
    const part = (icon, value, col) => `<span style="color:${hex(col)}">${ico(icon)}<b class="kn">${value}</b></span>`;
    let body;
    if (S.station === 'balance') { const r = PHYS.balance(balanceParams()); body = part('weight', r.momentL, FCOL.F) + ico(r.level ? 'equal' : 'balance') + part('weight', r.momentR, FCOL.net); }
    else if (S.station === 'track') body = part('arrowL', `${n1(S.F1.tgt)} N`, FCOL.F) + part('arrowR', `${n1(S.F2.tgt)} N`, FCOL.F) + part('hold', `${fx(S.F?.fsMax || 0,1)} N`, FCOL.f) + part('faster', fx(Math.abs(S.trk.v),2), FCOL.net);
    else { const r = S.hang || {}; body = part('spring', `${fx(S.Tlive,2)} N`, FCOL.T) + part('arrowD', `${fx(r.W || 0,2)} N`, FCOL.W) + part('arrowU', `${fx(r.B || 0,2)} N`, FCOL.B) + part('beaker', fx((r.frac || 0)*100,0), FCOL.B); }
    return `<div class="kmeter">${body}</div>`;
  },
  renderFree() {
    const box = document.getElementById('kid'), st = S.station;
    box.innerHTML = `<div class="kban kfree"><div class="kstations">${['track','hang','balance'].map(k => `<button data-st="${k}" class="${st === k ? 'on' : ''}" aria-label="${k}">${ico({track:'box',hang:'weight',balance:'balance'}[k])}</button>`).join('')}</div></div><div class="kfoot"><div class="krow"><div class="kmeterbox"></div>${st === 'balance' ? '' : '<canvas class="ktele"></canvas>'}<button class="kreset" aria-label="reset">${ico('reset')}</button></div></div>`;
    box.querySelectorAll('[data-st]').forEach((b) => (b.onclick = () => this.freeStation(b.dataset.st)));
    box.querySelector('.kreset').onclick = () => { if (S.station === 'track') { const L = S.load.tgt; kidTrack(S.surface); setParam('load', L, true); } else if (S.station === 'balance') { balanceSet({left:PHYS.balanceSide(),right:PHYS.balanceSide()}); S.beam={theta:0,omega:0}; updateBalance(0); } else { setParam('jack', PC.jack.min); S.hv.v += 0.01; } this.update(true); };
    khBuild(); this.update(true);
  },
  finalHTML() {
    const total = this.stars.reduce((n, v) => n + (v || 0), 0);
    return `<div class="kfinal"><div class="ktro">${ico('trophy')}</div><div class="ktotal">${Array.from({length:this.missions.length*3},(_,k) => `<i class="${k < total ? 'on' : ''}">${ico('star')}</i>`).join('')}</div>${kidAlbum(this.cards)}<div class="kbtns g3"><button class="kbtn main" data-k="free" aria-label="free">${ico('tools')}</button><button class="kbtn" data-k="again" aria-label="reset">${ico('reset')}</button><button class="kbtn" data-k="full" aria-label="teacher">${ico('teach')}</button></div></div>`;
  },
  reset() { this.pick = []; this.cards = new Set(); this.stars = []; this.fx.later.length = 0; this.go(0); },
  update(force) {
    if (this.free) { if (S.mode === 'kid') { const mb = document.querySelector('#kid .kmeterbox'); if (mb) { const h = this.freeMeter(); if (h !== mb._h) { mb.innerHTML = h; mb._h = h; } } } return; }
    if (S.mode !== 'kid' || this.i < 0 || this.i >= this.missions.length) return;
    const m = this.missions[this.i], box = document.getElementById('kid');
    if (!this.passed && m.id === 'motion' && Math.abs(S.trk.v) > .01 && S.F) {
      const key = S.F.a * Math.sign(S.trk.v) > .02 ? 'acc' : S.F.a * Math.sign(S.trk.v) < -.02 ? 'dec' : null;
      if (key) { this.ctx.motion ||= {}; this.ctx.motion[key] = { v:S.trk.v, a:S.F.a, net:S.F.net }; }
    }
    if (this.phase() === 'play' && m.tick) m.tick();
    if (!this.passed && this.phase() === 'play' && m.check()) this.win(m);
    const mb = box.querySelector('.kmeterbox'); if (mb) { const h = kidMeter(m); if (h !== mb._h) { mb.innerHTML = h; mb._h = h; } }
    const kr = box.querySelector('.krk .kr'); if (kr) kr.style.left = `${clamp((9.8 - S.g.tgt) / 8.2, 0, 1) * 100}%`;
    const w = box.querySelector('.kwin');
    if (w) {
      w.classList.toggle('on', this.passed && this.showWin);
      if (this.passed && this.showWin && (force || !w.dataset.f)) {
        w.dataset.f = '1';
        w.querySelector('.kprinciple').innerHTML = this.ctx.principle + (m.pred ? `<div class="kcompare"><span>${predPic(m.id, this.pick[this.i])}</span>${this.pick[this.i] === m.pred.ans ? ico('check', 'match') : ''}<span>${predPic(m.id, m.pred.ans)}</span></div>` : '');
        w.querySelector('.kstars').innerHTML = Array.from({length:3},(_,k) => `<i class="${k < this.stars[this.i] ? 'on' : ''}">${ico('star')}</i>`).join('');
        const bar = w.querySelector('.kauto div i');
        bar.style.animation = 'none'; void bar.offsetWidth;
        bar.style.animation = `kauto ${AUTO_NEXT - WIN_DELAY}s linear forwards`;
      }
    }
  },
  win(m) {
    this.ctx.principle = kidPrincipleCard(m);
    this.stars[this.i] = m.pred && this.pick[this.i] !== m.pred.ans ? 2 : 3;
    this.passed = true;
    if (m.card && !this.cards.has(m.card)) { this.cards.add(m.card); const i = this.i; this.after(WIN_DELAY + .01, () => { if (this.i === i && this.showWin) this.cardPop(m.card); }); }
    sfx('win'); this.burst(m.boss ? 120 : 60); this.render(); dirEvent('win', m);
    const i0 = this.i; this.showWin = false; this.after(WIN_DELAY, () => { if (this.i === i0) { this.showWin = true; this.update(true); } });
    this.after(AUTO_NEXT, () => { if (this.i === i0 && this.passed && S.mode === 'kid') this.go(this.i + 1); });
  },
  cardPop(k) {
    const c = CARDS.find((q) => q.k === k), el = document.getElementById('kpop'); if (!el || !c || S.mode !== 'kid') return;
    el.innerHTML = `<div class="kpcard" style="--c:${hex(c.col)}">${kidForceGlyph(c.k)}${ico('unlock')}</div>`;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); sfx('pop');
    const id = (this._pid = (this._pid || 0) + 1); this.after(2.6, () => { if (this._pid === id) el.classList.remove('on'); });
  },
  // ---- 화면 효과 캔버스: 눈길 고리, 색종이, 별 획득 (update()에서 매 프레임) ----
  fx: { parts: [], ring: null, later: [] },
  after(sec, fn) { this.fx.later.push({ t: sec, fn }); },   // 시뮬레이션 시간 기준 지연 실행
  ring(dur) { this.fx.ring = { t: 0, dur }; },
  burst(n) {
    const W = innerWidth, H = innerHeight;   // 양옆 아래에서 쏘아 올려 가운데 실험 장면은 가리지 않는다
    const cols = ['#6366f1', '#a5b4fc', '#38bdf8', '#34d399', '#fbbf24', '#ffffff'];
    for (let i = 0; i < n; i++) { const L = i % 2 === 0, a = L ? rr(-Math.PI * 0.42, -Math.PI * 0.22) : rr(-Math.PI * 0.78, -Math.PI * 0.58), sp = rr(9, 16); this.fx.parts.push({ x: L ? rr(0, 30) : W - rr(0, 30), y: H * rr(0.72, 0.85), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rr(0, 6.28), vr: rr(-0.3, 0.3), w: rr(6, 10), h: rr(3, 6), c: cols[i % cols.length], life: rr(1.4, 2.4) }); }
  },
  frame(dt) {
    const cv = document.getElementById('kfx'); if (!cv) return;
    const W = innerWidth, H = innerHeight, F = this.fx, kid = S.mode === 'kid';
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const c = cv.getContext('2d'); c.clearRect(0, 0, W, H);
    if (!kid) { F.parts.length = 0; F.later.length = 0; return; }
    const due = F.later.filter((q) => (q.t -= dt) <= 0); F.later = F.later.filter((q) => q.t > 0); due.forEach((q) => q.fn());
    // 눈길 고리 (카메라가 다 날아간 뒤부터)
    const m = this.missions[this.i], R = F.ring;
    const ghost = document.querySelector('#kid .ktarget');
    if (ghost) {
      ghost.style.visibility = CAM.fly || this.passed ? 'hidden' : 'visible';
      const x = blockX(PC.track.x0 + .05), { w, h, d } = PC.block;
      const pts = [-1,1].flatMap(dx => [0,1].flatMap(dy => [-1,1].map(dz => khProj(V3(x+dx*w/2, TRK_Y+dy*h, TRK.z+dz*d/2)))));
      const edges = [[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];
      ghost.querySelector('path').setAttribute('d', edges.map(([a,b]) => `M${pts[a].x} ${pts[a].y}L${pts[b].x} ${pts[b].y}`).join(''));
    }
    if (S.station !== 'balance' && R && m && m.look && this.phase() !== 'predict' && !CAM.fly && !document.getElementById('kidIntro').classList.contains('on')) {
      R.t += dt;
      if (R.t > R.dur) F.ring = null;
      else {
        const v = LOOK[m.look]().clone().project(camera), x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
        const al = Math.min(1, R.t * 4, (R.dur - R.t) * 2.5);
        for (let j = 0; j < 2; j++) { const p = (R.t * 0.9 + j * 0.5) % 1; c.strokeStyle = `rgba(255,255,255,${al * (1 - p) * 0.9})`; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 30 + p * 34, 0, 7); c.stroke(); }
        c.strokeStyle = `rgba(255,255,255,${al * 0.85})`; c.lineWidth = 2.5; c.setLineDash([7, 6]); c.lineDashOffset = -R.t * 30; c.beginPath(); c.arc(x, y, 34, 0, 7); c.stroke(); c.setLineDash([]);

      }
    }
    // 손 힌트: 아직 조작하지 않았거나 한동안 가만히 있으면, 끌 곳·누를 곳을 손 모양으로 보여 준다
    this.idle = (this.idle || 0) + dt;
    if (S.station !== 'balance' && m && m.hint && !KH.items.length && !this.passed && this.phase() === 'play' && !CAM.fly && !DRAG.kind && (!this.ctx.acted || this.idle > 7)) {
      const P = (this.hintT = (this.hintT || 0) + dt), hs = m.hint, h = hs[Math.floor(P / 2.2) % hs.length], ph = (P % 2.2) / 2.2;
      const v = KID_AT[h[0]]().project(camera), x0 = (v.x + 1) / 2 * W, y0 = (1 - v.y) / 2 * H;
      const al = Math.min(1, ph * 6, (1 - ph) * 5);
      c.save(); c.globalAlpha = al;
      if (h[1] === 'drag') {
        const L = 80, e = smooth(clamp((ph - 0.15) / 0.6, 0, 1)), x1 = x0 + h[2] * L, y1 = y0 + h[3] * L;
        c.strokeStyle = 'rgba(253,230,138,.9)'; c.lineWidth = 4; c.setLineDash([8, 7]); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.setLineDash([]);
        const a = Math.atan2(y1 - y0, x1 - x0); c.fillStyle = 'rgba(253,230,138,.9)'; c.beginPath(); c.moveTo(x1 + 12 * Math.cos(a), y1 + 12 * Math.sin(a)); c.lineTo(x1 + 12 * Math.cos(a + 2.4), y1 + 12 * Math.sin(a + 2.4)); c.lineTo(x1 + 12 * Math.cos(a - 2.4), y1 + 12 * Math.sin(a - 2.4)); c.fill();
        handAt(c, x0 + (x1 - x0) * e, y0 + (y1 - y0) * e, e > 0 && e < 1 ? 0.9 : 1);
      } else {
        const tap = Math.abs(Math.sin(ph * Math.PI * 2)); c.strokeStyle = `rgba(253,230,138,${0.9 * (1 - tap)})`; c.lineWidth = 3; c.beginPath(); c.arc(x0, y0, 14 + tap * 22, 0, 7); c.stroke();
        handAt(c, x0, y0 + 6 - tap * 8, 1 - tap * 0.1);
      }
      c.restore();
    } else this.hintT = 0;
    // 끄는 동안 힘 크기를 크게 보여 준다
    if (DRAG.kind === 'F1' || DRAG.kind === 'F2' || DRAG.kind === 'jack') {
      const v = KID_AT[DRAG.kind]().project(camera), x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H - 46;
      const txt = DRAG.kind === 'jack' ? `${fx((S.hang ? S.hang.frac : 0) * 100, 0)}%` : `${fx(S[DRAG.kind].tgt, 1)} N`;
      c.font = '800 26px "Noto Sans KR", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; const tw = c.measureText(txt).width + 26;
      c.fillStyle = 'rgba(20,16,12,.82)'; c.beginPath(); c.roundRect(x - tw / 2, y - 20, tw, 40, 20); c.fill();
      c.fillStyle = DRAG.kind === 'jack' ? '#7dd3fc' : '#c4b5fd'; c.fillText(txt, x, y);
    }
    if (S.station === 'balance' && !this.free && m?.shot === 'balance') kidBalanceDraw(c, dt, m);
    dirDraw(c, dt);
    // 색종이
    for (const p of F.parts) { p.vy += dt * 30; p.vx *= 0.99; p.x += p.vx * dt * 30; p.y += p.vy * dt * 30; p.r += p.vr; p.life -= dt; c.save(); c.globalAlpha = Math.max(0, Math.min(1, p.life * 2)); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore(); }
    F.parts = F.parts.filter((p) => p.life > 0 && p.y < H + 20);
    // 점수 떠오르기
  },
};

// 쉬운 말 상황 설명 (숫자 1~2개)
const KID_AT = {
  F1: () => HERO.ts[0].cart.getWorldPosition(new THREE.Vector3()),
  F2: () => HERO.ts[1].cart.getWorldPosition(new THREE.Vector3()),
  jack: () => HERO.beaker.getWorldPosition(new THREE.Vector3()).add(V3(0.0, PC.beaker.height * 0.5, 0.08)),
  obj: () => LOOK.obj().clone(),
  surface: () => V3(blockX(S.trk.x) - 0.32, TRK_Y + 0.004, TRK.z + 0.04),
  block: () => V3(blockX(S.trk.x), TRK_Y + PC.block.h * 0.6, TRK.z),
};
// 쉬운 모드에서 3D 기구를 눌렀을 때 (60의 onPointerDown이 부른다). true면 거기서 끝
function kidPointer(k) {
  if (!KID.allows(k)) return true;
  KID.acted(); ensureAudio();
  if (k === 'surface') { const L = S.load.tgt; kidTrack(cycle(SURFS, S.surface)); setParam('load', L, true); KID.ctx.fail = false; KID.ctx.hold = 0; sfx('click'); KID.update(true); return true; }
  if (k === 'block') { const L = (S.load.tgt + 1) % (PC.loadMax + 1); kidDesign(S.surface); setParam('load', L, true); sfx('click'); KID.update(true); return true; }
  if (k === 'F1' || k === 'F2') KID.ctx.fail = false;
  return false;
}
function setMode(m) {
  S.mode = m; try { localStorage.setItem('forces-mode', m); } catch {}
  document.body.classList.toggle('kid', m === 'kid');
  applyViewOffset(); themeMode(m === 'kid'); controls.enableRotate = controls.enablePan = m !== 'kid';
  document.getElementById('modeBtn').innerHTML = m === 'kid' ? ico('teach') : ico('explore');
  if (m === 'kid') { lessonEnd(); if (KID.i < 0) KID.go(0); else { KID.render(); const q = KID.missions[KID.i]; if (q) flyTo(stationShot(q.shot), 1.6); } }
  else { KID_INTRO(false); S.speed = 1; flyTo(heroShot(), 1.6); }
  UI.sheet && UI.sheet();
}
function KID_INTRO(on) {
  const el = document.getElementById('kidIntro'); if (!el) return;
  el.classList.toggle('on', on); document.body.classList.toggle('kbars', on);
  if (on) {
    setCinematic(true);
    el.querySelector('.box').innerHTML = `<div class="kilogo">${cardSVG(cardArrow(45,75,65,0,FCOL.F)+cardArrow(120,80,0,-60,FCOL.W)+cardArrow(185,75,-40,-40,FCOL.B))}</div><div class="kitiles">${['eye','ruler','tap','award'].map(ic => `<div class="kitile">${ico(ic)}</div>`).join('')}</div><div class="kistart"><button class="kbtn main kstart" aria-label="start">${ico('flag')}</button><button class="kbtn kfreego" aria-label="free">${ico('tools')}</button><button class="kbtn kfull" aria-label="teacher">${ico('teach')}</button></div>`;
    el.querySelector('.kstart').onclick = () => { ensureAudio(); KID_INTRO(false); KID.go(0); };
    el.querySelector('.kfull').onclick = () => { KID_INTRO(false); setMode('full'); };
    el.querySelector('.kfreego').onclick = () => { ensureAudio(); KID_INTRO(false); if (KID.i < 0) KID.i = 0; KID.setFree(true); };
  }
}
function initKid() {
  document.body.appendChild(document.getElementById('kid'));
  document.getElementById('modeBtn').onclick = () => setMode(S.mode === 'kid' ? 'full' : 'kid');
  let m = QS.get('mode');
  if (!m) { try { m = localStorage.getItem('forces-mode'); } catch {} }
  if (QS.has('lesson')) m = 'full';
  S.mode = m === 'full' ? 'full' : 'kid';
  document.body.classList.toggle('kid', S.mode === 'kid');
  document.getElementById('modeBtn').innerHTML = S.mode === 'kid' ? ico('teach') : ico('explore');
  themeMode(S.mode === 'kid'); controls.enableRotate = controls.enablePan = S.mode !== 'kid';
  KID.hud(); KID.legend();
  if (S.mode === 'kid') { KID_INTRO(!QS.has('nointro')); if (QS.has('nointro')) KID.go(0); }
}
