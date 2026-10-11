// ==== 13b 쉬운 모드 (초등학생용): 지도서 10단계 순서 그대로, 퀘스트 게임으로 ====
// 퀘스트마다 예상하기 → 버튼 조작 → 결과 확인(지도서의 발문 → 탐구 → 설명 흐름).
// 게임 요소: 진행 지도, 점수, 예상 적중 보너스, 힘 카드 모으기, 보스 미션(설계), 정리 퀴즈, 칭호.
// 자세히 모드(수업 10단계·지도서·평가)는 그대로 두고, 이 모드는 화면 위에 퀘스트 카드 하나만 띄운다.
const KTX = {
  sub: { ko: '눈에 안 보이는 <b>힘</b>을 빛나는 <b>화살표</b>로 보는 실험실이에요.', en: 'A lab where invisible <b>forces</b> show up as glowing <b>arrows</b>.' },
  next: { ko: '다음 퀘스트 →', en: 'Next quest →' }, again: { ko: '처음부터 다시', en: 'Start over' },
  full: { ko: '자세히 모드 (선생님·중학생)', en: 'Detailed mode (teachers)' }, easy: { ko: '쉬운 모드', en: 'Easy mode' },
  now: { ko: '지금 보이는 것', en: 'What you see' }, skip: { ko: '건너뛰기', en: 'Skip' },
  cardsT: { ko: '힘 카드', en: 'Force cards' }, look: { ko: '여기를 봐요!', en: 'Look here!' },
  predT: { ko: '🤔 먼저 예상해 보세요!', en: '🤔 Make a guess first!' }, mine: { ko: '내 예상', en: 'My guess' },
  hit: { ko: '🎯 예상 적중! 보너스', en: '🎯 Good guess! Bonus' },
  miss: { ko: '😮 예상과 달랐어요! 결과를 보고 생각을 고치는 게 바로 과학이에요.', en: '😮 Not what you guessed! Changing your mind from evidence is real science.' },
  newCard: { ko: '새 힘 카드!', en: 'New force card!' }, pts: { ko: '점', en: 'pts' },
  soundOn: { ko: '🔇 소리 켜기', en: '🔇 Sound on' }, soundOff: { ko: '🔊 소리 끄기', en: '🔊 Sound off' },
  qNext: { ko: '다음 문제 →', en: 'Next question →' }, yes: { ko: '⭕ 맞아요', en: '⭕ True' }, no: { ko: '❌ 아니에요', en: '❌ False' },
  right: { ko: '⭕ 정답!', en: '⭕ Correct!' }, wrong: { ko: '🤔 아쉬워요!', en: '🤔 Not quite!' },
  intro: {
    ko: ['힘이 보인다!', ['👀', '<b>힘</b>은 밀고 당기는 거예요. 원래는 <b>눈에 안 보여요.</b> 여기서는 <b>빛나는 화살표</b>로 보여 줘요.'], ['📏', '화살표가 <b>길수록 센 힘</b>이에요.'], ['🖐️', '퀘스트마다 <b>먼저 예상</b>하고, 실험 기구를 <b>직접 끌고 눌러서</b> 확인해요. 맞히면 보너스!'], ['🃏', '퀘스트를 깨면 <b>점수</b>와 <b>힘 카드</b>를 얻어요. 9단계엔 <b>보스 미션</b>이 기다려요!'], '퀘스트 시작하기'],
    en: ['See the forces!', ['👀', 'A <b>force</b> is a push or a pull. You <b>can’t see it</b> — here it shows up as a <b>glowing arrow</b>.'], ['📏', 'A <b>longer arrow</b> means a <b>stronger force</b>.'], ['🖐️', 'In each quest, <b>guess first</b>, then <b>drag and tap the real equipment</b> to check. Right guesses earn a bonus!'], ['🃏', 'Clear quests to win <b>points</b> and <b>force cards</b>. A <b>boss mission</b> waits at step 9!'], 'Start the quests'],
  },
};
const KT = (k) => (KTX[k] ? KTX[k][LANG] ?? KTX[k].ko : k);
// 지도서 수업 10단계의 쉬운 이름 (docs/quest-map.md 순서)
const STAGE = {
  ko: ['', '힘이 하는 일', '힘의 평형', '힘 합치기', '무게와 질량', '탄성력', '마찰력', '부력', '힘과 운동', '설계 도전', '정리 퀴즈'],
  en: ['', 'What forces do', 'Balanced forces', 'Adding forces', 'Weight and mass', 'Spring force', 'Friction', 'Buoyancy', 'Force and motion', 'Design challenge', 'Wrap-up quiz'],
};
// 화살표 이름 (쉬운 말)
const KID_NAME = {
  ko: { W: '지구가 당기는 힘', T: '용수철 힘', B: '물이 밀어 올리는 힘', N: '바닥이 받치는 힘', F1: '왼쪽 당기기', F2: '오른쪽 당기기', f: '바닥이 붙잡는 힘', bump: '벽이 막는 힘', net: '모두 합친 힘' },
  en: { W: 'Earth pulls down', T: 'Spring pulls up', B: 'Water pushes up', N: 'Floor holds up', F1: 'Left pull', F2: 'Right pull', f: 'Floor grips', bump: 'Wall stops', net: 'All together' },
};
const kidName = (k) => (KID_NAME[LANG] || KID_NAME.ko)[k];
// 힘 카드 (모으는 순서 = 처음 배우는 순서)
const CARDS = [
  { k: 'F', col: FCOL.F, ko: ['당기는 힘', '내가 밀고 당기는 힘. 물체를 움직이게 해요.'], en: ['Pull', 'A push or pull from you. It gets things moving.'] },
  { k: 'net', col: FCOL.net, ko: ['모두 합친 힘', '여러 힘을 더한 힘(알짜힘). 0이면 움직임이 그대로예요.'], en: ['All together', 'All forces added up (net force). Zero means no change in motion.'] },
  { k: 'W', col: FCOL.W, ko: ['지구가 당기는 힘', '중력, 곧 무게예요. 달에서는 약해져요.'], en: ['Earth pulls down', 'Gravity — weight. Weaker on the Moon.'] },
  { k: 'T', col: FCOL.T, ko: ['용수철 힘', '탄성력. 늘어난 만큼 되돌아가려는 힘이에요.'], en: ['Spring force', 'Elastic force: the spring pulls back as it stretches.'] },
  { k: 'f', col: FCOL.f, ko: ['바닥이 붙잡는 힘', '마찰력. 거친 바닥일수록 세게 붙잡아요.'], en: ['Floor grips', 'Friction. Rough floors grip harder.'] },
  { k: 'B', col: FCOL.B, ko: ['물이 밀어 올리는 힘', '부력. 물속에서 가벼워지는 이유예요.'], en: ['Water pushes up', 'Buoyancy — why things feel lighter in water.'] },
  { k: 'N', col: FCOL.N, ko: ['바닥이 받치는 힘', '수직항력. 무거울수록 바닥이 세게 받쳐요.'], en: ['Floor holds up', 'Normal force. Heavier things get pushed up harder.'] },
];
const cardT = (c) => c[LANG] || c.ko;

const n1 = (v) => fx(v, 1);
const big = (v, u = 'N') => `<b class="kn">${v}</b> ${u}`;
const isEn = () => LANG === 'en';
const L2 = (ko, en) => (isEn() ? en : ko);
const XMIN = () => PC.track.xmin + 0.02;
// 끌기대 공통 준비
function kidTrack(surface = 'glass', x) { setStation('track', false); setSame(false); setSurface(surface); setParam('load', 0, true); setParam('F1', 0, true); setParam('F2', 0, true); setParam('g', 9.8, true); resetTrack(x); S.playing = true; S.speed = 1; }
function kidHang(obj, n = 0) { setStation('hang', false); S.obj = obj; S.settle = 0; setFluid('water'); setParam('g', 9.8, true); setParam('n', n, true); S.jack.tgt = PC.jack.min; S.hv.v += 0.02; }
const pull = (side, d) => { const k = side === 'L' ? 'F1' : 'F2'; setParam(k, clamp(S[k].tgt + d, 0, 5)); sfx('click'); };
const jackStep = (d) => { setParam('jack', S.jack.tgt + d); sfx('tick'); };
const jackTop = () => { setParam('jack', PC.jack.max); sfx('click'); };
// 눈길 고리를 띄울 곳 (세계 좌표)
const _lk = new THREE.Vector3();
const LOOK = {
  block: () => _lk.set(blockX(S.trk.x), AXIS_Y + 0.01, TRK.z),
  scale: () => _lk.set(HS.x, TOP + 0.6, HS.z),
  obj: () => { HERO.obj.getWorldPosition(_lk); return _lk.setY(_lk.y + (S.hang ? S.hang.h / 2 : 0.03)); },
};
const PRED = (ko, en, ans) => ({ ko, en, ans });
const tug = () => `<div class="kmeter"><span style="color:#c4b5fd">← ${L2('왼쪽', 'Left')} ${big(n1(S.F1.tgt))}</span><span class="keq">${S.F1.tgt === S.F2.tgt ? '=' : S.F1.tgt > S.F2.tgt ? '>' : '<'}</span><span style="color:#c4b5fd">${big(n1(S.F2.tgt))} ${L2('오른쪽', 'Right')} →</span></div>`;
const surfBtn = (s, ic) => [`${ic} ${T('surfName')[s]}`, () => { kidDesign(s); sfx('click'); }, 'c2' + (S.surface === s ? ' sel' : '')];
function kidDesign(s) { const L = S.load.tgt; kidTrack(s); setParam('load', L, true); KID.ctx.fail = false; KID.ctx.hold = 0; }

const KID_QUIZ = [
  { a: true, ko: ['양쪽에서 똑같은 힘으로 당기면 도막은 움직이지 않아요.', '두 힘이 비기면(힘의 평형) 모두 합친 힘이 0이라서 그대로예요.'], en: ['If both sides pull equally, the block doesn’t move.', 'Balanced forces add up to zero, so nothing changes.'] },
  { a: false, ko: ['달에 가면 추의 양(질량)이 줄어들어요.', '추의 양은 그대로! 끌어당기는 힘(무게)만 약해져요.'], en: ['On the Moon, the amount of stuff (mass) in the weights shrinks.', 'Mass stays the same — only the pull (weight) gets weaker.'] },
  { a: false, ko: ['까끌까끌한 바닥일수록 물체가 더 잘 미끄러져요.', '거친 바닥은 더 세게 붙잡아요. 마찰력이 커요.'], en: ['Rougher floors make things slide more easily.', 'Rough floors grip harder — more friction.'] },
  { a: true, ko: ['물속에 넣은 물체는 물이 위로 밀어 올려요.', '이 힘이 부력이에요. 그래서 저울 눈금이 줄어요.'], en: ['Water pushes up on things put into it.', 'That push is buoyancy, so the scale reads less.'] },
];

// 길잡이 쿼카 (mood: '' 보통, 'win' 신남, 'think' 궁금)
function quokka(mood = '') {
  const ink = '#4a3426';
  const eyes = mood === 'win' ? `<path d="M31 53q6-8 12 0M57 53q6-8 12 0" stroke="${ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`
    : mood === 'think' ? `<circle cx="38" cy="49" r="6" fill="${ink}"/><circle cx="64" cy="49" r="6" fill="${ink}"/><circle cx="40" cy="46.5" r="2.2" fill="#fff"/><circle cx="66" cy="46.5" r="2.2" fill="#fff"/>`
    : `<circle cx="37" cy="53" r="6.2" fill="${ink}"/><circle cx="63" cy="53" r="6.2" fill="${ink}"/><circle cx="39.2" cy="50.6" r="2.3" fill="#fff"/><circle cx="65.2" cy="50.6" r="2.3" fill="#fff"/>`;
  const mouth = mood === 'win' ? `<path d="M40 69q10 13 20 0z" fill="#ff5d73" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>`
    : mood === 'think' ? `<ellipse cx="54" cy="72" rx="3.6" ry="4.2" fill="${ink}"/>`
    : `<path d="M41 69q4.5 6 9 0q4.5 6 9 0" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><g stroke="${ink}" stroke-width="3"><circle cx="23" cy="27" r="14" fill="#a8693c"/><circle cx="77" cy="27" r="14" fill="#a8693c"/></g><circle cx="23" cy="28" r="7" fill="#f0a98a"/><circle cx="77" cy="28" r="7" fill="#f0a98a"/><ellipse cx="50" cy="57" rx="38" ry="34" fill="#c98a55" stroke="${ink}" stroke-width="3"/><ellipse cx="50" cy="67" rx="24" ry="18" fill="#f6dcb4"/><circle cx="27" cy="65" r="6" fill="#ff8fa3" opacity=".75"/><circle cx="73" cy="65" r="6" fill="#ff8fa3" opacity=".75"/>${eyes}<ellipse cx="50" cy="62" rx="5.5" ry="3.8" fill="${ink}"/>${mouth}</svg>`;
}
// 선 아이콘 (24×24, 2px 선). 이모지는 기기마다 모양이 달라 교과서 화면에 쓰지 않는다
const ICON = {
  speaker: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  mute: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/>',
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
const swatch = (s) => `<span class="ksw ${s}"></span>`;
// 예상 보기 그림: i:아이콘 / s:바닥 견본 / t:글자(숫자)
const PRED_PIC = {
  tug: ['i:arrowL', 'i:hold', 'i:arrowR'], team: ['t:0 N', 't:1 N', 't:2 N'], moon: ['i:arrowU', 'i:equal', 'i:arrowD'], weights: ['i:equal', 't:×2', 'i:plus'],
  floor: ['s:glass', 's:sand', 'i:equal'], water: ['i:arrowU', 'i:equal', 'i:arrowD'], float: ['i:sink', 'i:float'], motion: ['i:faster', 'i:slower', 'i:stop'],
};
function predPic(id, k) { const v = (PRED_PIC[id] || [])[k]; if (!v) return ''; const t = v[0], x = v.slice(2); return t === 'i' ? ico(x) : t === 's' ? swatch(x) : `<span class="kpt">${x}</span>`; }
// 할 일 그림: [기구] + [끄는 방향 / 누르기]
const STEP_OBJ = { F1: 'puller', F2: 'puller', surface: 'swatch', block: 'box', obj: 'weight', jack: 'beaker' };
function kidSteps(m) {
  if (m.quiz) return `<span class="kstep"><span class="kso">${ico('circle')}</span><span class="kso">${ico('x')}</span></span>`;
  if (m.widget === 'rocket') return `<span class="kstep"><span class="kso">${ico('globe')}</span><span class="ksa R">${ico('arrowR')}</span><span class="kso">${ico('moon')}</span></span>`;
  const hs = m.hint || [];
  return hs.map(([k, g, dx, dy], i) => {
    const o = STEP_OBJ[k] || 'tap', a = g === 'drag' ? (dx > 0 ? 'R' : dx < 0 ? 'L' : dy < 0 ? 'U' : 'D') : 'tap';
    const word = { R: L2('오른쪽으로', 'right'), L: L2('왼쪽으로', 'left'), U: L2('위로', 'up'), D: L2('아래로', 'down'), tap: L2('누르기', 'tap') }[a];
    return `<span class="kstep">${hs.length > 1 ? `<em>${i + 1}</em>` : ''}<span class="kso${o === 'puller' ? ' knob' : ''}">${o === 'puller' ? ico('grip') : o === 'swatch' ? swatch('sand') : ico(o)}</span><span class="ksa ${a}">${ico(a === 'tap' ? 'tap' : 'arrow' + a)}</span><span class="ksw2">${word}</span></span>`;
  }).join('');
}
// 읽어 주기 (글을 못 읽는 아이도 OK)
const VOICE = { on: true, key: '' };
function speak(html, force) {
  try {
    const sy = window.speechSynthesis; if (!sy || (!VOICE.on && !force) || S.mode !== 'kid') return;
    const tx = String(html).replace(/<[^>]+>/g, ' ').replace(/[←→⏩⏪▶■·…]/g, ' ').replace(/\p{Extended_Pictographic}|\uFE0F/gu, ' ').replace(/\s+/g, ' ').trim(); if (!tx) return;
    sy.cancel(); const u = new SpeechSynthesisUtterance(tx); u.lang = isEn() ? 'en-US' : 'ko-KR'; u.rate = 0.95; u.pitch = 1.15;
    const v = sy.getVoices().find((q) => q.lang && q.lang.replace('_', '-').startsWith(u.lang)); if (v) u.voice = v;
    sy.speak(u);
  } catch (e) {}
}
function speakOnce(key, html) { if (VOICE.key === key) return; VOICE.key = key; speak(html); }
const AUTO_NEXT = 7.5, WIN_DELAY = 1.4;   // 성공 뒤 결과를 1.4초 지켜본 다음 팝업   // 성공 팝업이 떠 있는 시간(초). 지나면 저절로 다음 퀘스트
const KID = {
  i: -1, done: [], hit: [], pick: [], cards: new Set(), score: 0, shown: 0, ctx: {}, passed: false, free: false,
  missions: [
    {
      id: 'pull', stage: 1, icon: '👉', shot: 'track', look: 'block', theme: 'field', allow: ['F2'],
      hint: [['F2', 'drag', 1, 0]],
      t: { ko: ['도막을 당겨 봐요', '오른쪽 <b>보라색 끌개</b>를 마우스(손가락)로 잡고 <b>오른쪽으로 끌어</b> 보세요. 많이 끌수록 세게 당겨요.'], en: ['Pull the block', 'Grab the right <b>violet puller</b> and <b>drag it right</b>. The farther you drag, the harder it pulls.'] },
      enter() { kidTrack('glass'); },
      reset() { setParam('F2', 0); resetTrack(); },
      meter: () => `<div class="kmeter"><span style="color:#c4b5fd">${L2('당기는 힘', 'Pull')} ${big(n1(S.F2.tgt))}</span></div>`,
      check: () => S.dist >= 0.05, card: 'F',
      win: () => L2('움직였어요! <b style="color:#c4b5fd">보라색 화살표</b>가 내가 당기는 힘이에요. 힘을 주면 물체가 움직이기 시작해요.', 'It moved! The <b style="color:#c4b5fd">violet arrow</b> is your pull. Push or pull something and it starts to move.'),
    },
    {
      id: 'tug', stage: 2, icon: '🤝', shot: 'track', look: 'block', theme: 'field', allow: ['F1', 'F2'],
      hint: [['F1', 'drag', -1, 0], ['F2', 'drag', 1, 0]],
      t: { ko: ['줄다리기 무승부', '왼쪽 끌개는 <b>왼쪽으로</b>, 오른쪽 끌개는 <b>오른쪽으로</b> 끌어서 두 힘을 <b>똑같이</b> 맞춰 보세요. 도막이 안 움직이면 성공!'], en: ['Tug-of-war tie', 'Drag the left puller <b>left</b> and the right one <b>right</b> until both pulls are <b>equal</b>. If the block stays put, you win!'] },
      pred: PRED(['양쪽에서 똑같은 힘으로 당기면 도막은?', ['← 왼쪽으로 가요', '그대로 있어요', '오른쪽으로 가요 →']], ['If both sides pull equally, the block…', ['← goes left', 'stays put', 'goes right →']], 1),
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
      meter: tug,
      check: () => S.F1.tgt >= 1 && S.F1.tgt === S.F2.tgt && S.trk.v === 0 && !S.same && !S.pin && KID.ctx.freeT != null && DIR.t - KID.ctx.freeT > 1.1, card: 'net',
      win: () => L2(`양쪽이 똑같이 ${n1(S.F1.tgt)} N씩 당겨서 힘이 <b>비겼어요</b>(힘의 평형). <b style="color:#fde68a">노란 ‘모두 합친 힘’</b> 화살표가 사라지고 도막은 그대로예요.`, `Both sides pull ${n1(S.F1.tgt)} N, so the forces <b>cancel out</b>. The <b style="color:#fde68a">yellow “all together”</b> arrow disappears and the block stays put.`),
    },
    {
      id: 'team', stage: 3, icon: '💪', shot: 'track', look: 'block', theme: 'field', allow: ['F1', 'F2'],
      hint: [['F1', 'drag', 1, 0], ['F2', 'drag', 1, 0]],
      t: { ko: ['힘 합체!', '두 끌개가 <b>모두 오른쪽</b>에 붙었어요. 두 끌개를 <b>하나씩 오른쪽으로</b> 끌어 각각 1 N 이상 당겨 보세요.'], en: ['Team up!', 'Both pullers are now on the <b>right</b>. Drag <b>each one right</b> to pull at least 1 N.'] },
      pred: PRED(['두 친구가 같은 쪽으로 1 N씩 당기면, 모두 합친 당기는 힘은?', ['0 N', '1 N', '2 N']], ['Two friends each pull 1 N the same way. Total pull?', ['0 N', '1 N', '2 N']], 2),
      enter() { kidTrack('glass', XMIN()); setSame(true); S.speed = 0.5; },
      reset() { setParam('F1', 0); setParam('F2', 0); resetTrack(XMIN()); },
      meter: () => `<div class="kmeter"><span style="color:#c4b5fd">${L2('끌개 1', 'Puller 1')} ${big(n1(S.F1.tgt))}</span><span class="keq">+</span><span style="color:#c4b5fd">${L2('끌개 2', 'Puller 2')} ${big(n1(S.F2.tgt))}</span><span class="keq">=</span><span style="color:#fde68a">${big(n1(S.F1.tgt + S.F2.tgt))}</span></div>`,
      check: () => S.same && S.F1.tgt >= 1 && S.F2.tgt >= 1,
      win: () => L2(`같은 쪽으로 당기면 힘이 <b>더해져요</b>: ${n1(S.F1.tgt)} N + ${n1(S.F2.tgt)} N = ${n1(S.F1.tgt + S.F2.tgt)} N. 혼자 당길 때보다 도막이 더 빨리 출발해요!`, `Pulling the same way <b>adds</b> forces: ${n1(S.F1.tgt)} N + ${n1(S.F2.tgt)} N = ${n1(S.F1.tgt + S.F2.tgt)} N. The block speeds off faster than with one puller!`),
    },
    {
      id: 'moon', stage: 4, icon: '🌙', shot: 'hang', look: 'scale', theme: 'moon', allow: [], widget: 'rocket',
      t: { ko: ['달나라 여행', '추 3개가 걸려 있어요. 아래 <b>로켓 손잡이를 달까지 끌어</b> 보세요. 저울 눈금이 어떻게 될까요?'], en: ['Trip to the Moon', 'Three weights are hanging. <b>Drag the 🚀 rocket</b> below all the way to the Moon. Watch the scale!'] },
      pred: PRED(['달에 가면 저울 눈금은?', ['커져요', '그대로예요', '작아져요']], ['On the Moon, the scale reading…', ['goes up', 'stays the same', 'goes down']], 2),
      enter() { kidHang('weights', 3); },
      meter: () => `<div class="kmeter"><span>${ico(PHYS.nearPlanet(S.g.tgt)?.id === 'moon' ? 'moon' : 'globe')} ${L2('저울', 'scale')} ${big(fx(S.Tlive, 2))}</span><span class="keq">·</span><span>${L2('추의 양', 'mass')} ${big(S.n.tgt * 50, 'g')}</span></div>`,
      check: () => S.g.tgt <= 2 && S.n.tgt >= 1 && S.settle > 0.3, card: 'W',
      win: () => L2(`달에서는 끌어당기는 힘이 약해서 저울이 ${fx(S.Tlive, 2)} N만 가리켜요(지구에서는 ${fx(S.n.tgt * 0.05 * 9.8, 2)} N). 추의 양은 그대로 ${S.n.tgt * 50} g! <b style="color:#ffb36b">주황 화살표</b>(무게)만 짧아졌어요.`, `On the Moon gravity pulls only ${fx(S.Tlive, 2)} N (on Earth ${fx(S.n.tgt * 0.05 * 9.8, 2)} N). The weights are still ${S.n.tgt * 50} g — only the <b style="color:#ffb36b">orange arrow</b> (weight) got shorter!`),
    },
    {
      id: 'weights', stage: 5, icon: '⚖️', shot: 'hang', look: 'obj', theme: 'spring', allow: ['obj'],
      hint: [['obj', 'tap']],
      t: { ko: ['용수철 계단 모으기', '매달린 <b>추 걸이를 눌러</b> 추를 1개씩 더 걸어요. 계단 <b>4칸</b>을 모아 보세요! (5개 다음엔 다시 0개)'], en: ['Collect the spring steps', '<b>Tap the hanger</b> to add one weight at a time. Collect <b>4 steps</b>! (After 5 it goes back to 0.)'] },
      pred: PRED(['추를 2개 걸면 1개 걸 때보다 용수철이…', ['똑같이 늘어나요', '2배 늘어나요', '조금만 더 늘어나요']], ['With 2 weights instead of 1, the spring stretches…', ['the same', 'twice as far', 'only a bit more']], 1),
      enter() { kidHang('weights', 0); KID.ctx.got = new Set(); S.overlays.K = true; UI.syncButtons(); },
      meter: () => {
        const got = KID.ctx.got || new Set(), st = PC.weightMass * 9.8 / PC.kHang * 100;
        const bars = [1, 2, 3, 4, 5].map((n) => `<span class="kst${got.has(n) ? ' on' : ''}${S.n.tgt === n ? ' cur' : ''}"><i style="height:${n * 8}px"></i><em>${got.has(n) ? fx(n * st, 1) : '?'}</em></span>`).join('');
        return `<div class="kmeter kstairs"><div class="kstl">${L2('추', 'Weights')} ${big(S.n.tgt, L2('개', ''))}<br><span style="color:#86efac">${L2('늘어남', 'stretch')} ${big(fx(S.hv.x * 100, 1), 'cm')}</span></div><div class="kstb">${bars}</div></div>`;
      },
      tick() { const g = KID.ctx.got, r = S.hang; if (g && r && !r.empty && S.obj === 'weights' && S.n.tgt >= 1 && Math.round(r.m / PC.weightMass) === S.n.tgt && Math.abs(S.hv.x - r.x) < 0.004 && Math.abs(S.hv.v) < 0.04 && Math.abs(S.g.tgt - 9.8) < 0.05 && !g.has(S.n.tgt)) { g.add(S.n.tgt); sfx('pick'); KID.burst(10); } },
      check: () => KID.ctx.got && KID.ctx.got.size >= 4, card: 'T',
      win: () => L2(`추 1개마다 용수철이 똑같이 ${fx(PC.weightMass * 9.8 / PC.kHang * 100, 1)} cm씩 늘어나요. 계단 높이가 똑같죠? 추가 2배면 늘어난 길이도 2배! <b style="color:#86efac">초록 화살표</b>가 용수철 힘(탄성력)이에요.`, `Each weight stretches the spring by the same ${fx(PC.weightMass * 9.8 / PC.kHang * 100, 1)} cm — equal steps! Twice the weight, twice the stretch. The <b style="color:#86efac">green arrow</b> is the spring force.`),
    },
    {
      id: 'floor', stage: 6, icon: '🧊', shot: 'track', look: 'block', theme: 'surface', allow: ['F2', 'surface'],
      hint: [['F2', 'drag', 1, 0], ['surface', 'tap']],
      t: { ko: ['미끌미끌 vs 까끌까끌', '<b>유리(얼음판)</b>에서 오른쪽 끌개를 <b>2 N쯤</b> 끌어 보세요. 그다음 <b>바닥을 눌러</b> 사포(사막)로 바꾸고 다시 2 N으로 당겨 보세요.'], en: ['Slippery vs rough', 'On <b>glass (ice)</b>, drag the right puller to about <b>2 N</b>. Then <b>tap the floor</b> to switch to sandpaper (desert) and pull 2 N again.'] },
      pred: PRED(['똑같이 2 N으로 당기면 어느 바닥에서 미끄러질까요?', ['유리', '사포', '둘 다 똑같아요']], ['Pulling with 2 N — which floor lets it slide?', ['Glass', 'Sandpaper', 'Both the same']], 0),
      enter() { kidTrack('glass'); },
      reset() { setParam('F2', 0); resetTrack(); },
      tick() {
        const c = KID.ctx;
        if (S.surface === 'glass' && S.F2.tgt > 0 && S.F2.tgt <= 2.5 && S.dist > 0.05) c.glass = true;
        if (S.surface === 'sand' && S.F2.tgt >= 1.5 && S.F && S.F.mode === 'held') { c.sandT = (c.sandT || 0) + 0.08; if (c.sandT > 0.8) c.sand = true; }
      },
      check: () => KID.ctx.glass && KID.ctx.sand, card: 'f',
      meter: () => `<div class="kmeter"><span>${T('surfName')[S.surface]} ${L2('바닥', 'floor')}</span><span class="keq">·</span><span style="color:#c4b5fd">${L2('당기는 힘', 'pull')} ${big(n1(S.F2.tgt))}</span></div><div class="kchk">${kcb(KID.ctx.glass)} ${L2('유리에서 미끄러짐', 'Glass slides')} &nbsp; ${kcb(KID.ctx.sand)} ${L2('사포에서 버팀 (1.5 N 이상)', 'Sandpaper holds (≥ 1.5 N)')}</div>`,
      win: () => L2(`까끌까끌한 사포는 꽉 붙잡아요. <b style="color:#fca5a5">빨간 ‘바닥이 붙잡는 힘’</b>(마찰력)이 ${n1(0.8 * 0.3 * 9.8)} N까지 커질 수 있어서 2 N으로는 못 움직여요. 미끌미끌한 유리는 ${n1(0.25 * 0.3 * 9.8)} N까지만 붙잡아요.`, `Rough sandpaper grips hard: the <b style="color:#fca5a5">red “floor grips”</b> arrow (friction) can grow to ${n1(0.8 * 0.3 * 9.8)} N, so 2 N can’t move it. Slippery glass only grips up to ${n1(0.25 * 0.3 * 9.8)} N.`),
    },
    {
      id: 'water', stage: 7, icon: '💧', shot: 'hang', look: 'obj', theme: 'water', allow: ['jack'],
      hint: [['jack', 'drag', 0, -1]],
      t: { ko: ['물에 담가요', '<b>물이 든 비커를 잡고 위로 끌어 올려</b> 알루미늄을 물에 <b>끝까지</b> 담가 보세요.'], en: ['Into the water', '<b>Grab the beaker and drag it up</b> until the aluminium is <b>completely under water</b>.'] },
      pred: PRED(['알루미늄을 물에 담그면 저울 눈금은?', ['커져요', '그대로예요', '작아져요']], ['Put the aluminium in water. The scale reading…', ['goes up', 'stays the same', 'goes down']], 2),
      enter() { kidHang('al'); },
      reset() { S.jack.tgt = PC.jack.min; },
      meter: () => `<div class="kmeter"><span>${L2('저울', 'scale')} ${big(fx(S.Tlive, 2))}</span><span class="keq">·</span><span>${L2('물에 잠김', 'under water')} ${big(fx((S.hang ? S.hang.frac : 0) * 100, 0), '%')}</span></div>`,
      check: () => S.obj === 'al' && S.hang && S.hang.frac >= 0.999 && S.settle > 0.3, card: 'B',
      win: () => { const r = S.hang; return L2(`물에 넣으니 가벼워졌어요: ${fx(r.W, 2)} N → ${fx(r.T, 2)} N. 물이 ${fx(r.B, 2)} N만큼 위로 밀어 올리기 때문이에요. 이게 <b style="color:#7dd3fc">하늘색 화살표</b>, 부력이에요.`, `Lighter in water: ${fx(r.W, 2)} N → ${fx(r.T, 2)} N. The water pushes up with ${fx(r.B, 2)} N — the <b style="color:#7dd3fc">sky-blue arrow</b> (buoyancy).`); },
    },
    {
      id: 'float', stage: 7, icon: '🛶', shot: 'hang', look: 'obj', theme: 'water', allow: ['jack'],
      hint: [['jack', 'drag', 0, -1]],
      t: { ko: ['나무는 뜰까?', '이번엔 <b>나무</b>예요. 비커를 잡고 <b>끝까지 끌어 올려</b> 나무를 물에 넣어 보세요.'], en: ['Will wood float?', 'Now it’s <b>wood</b>. Drag the beaker <b>all the way up</b>.'] },
      pred: PRED(['나무 도막을 물에 넣으면?', ['가라앉아요', '둥둥 떠요']], ['Put the wood in water. It will…', ['sink', 'float']], 1),
      enter() { kidHang('wood'); },
      reset() { S.jack.tgt = PC.jack.min; },
      check: () => S.obj === 'wood' && S.hang && S.hang.floating && S.hang.inFluid && Math.abs(S.jack.cur - S.jack.tgt) < 0.003 && !DRAG.kind,
      win: () => L2(`둥둥 떴어요! 물이 밀어 올리는 힘이 나무 무게(${fx(S.hang.W, 2)} N)와 똑같아서 줄이 느슨해지고 저울은 0 N이에요. 나무는 ${fx(S.hang.frac * 100, 0)}%만 물에 잠겨 있어요.`, `It floats! The water pushes up exactly as hard as the wood weighs (${fx(S.hang.W, 2)} N), so the string goes slack and the scale reads 0 N. Only ${fx(S.hang.frac * 100, 0)}% is under water.`),
    },
    {
      id: 'motion', stage: 8, icon: '🎢', shot: 'track', look: 'block', theme: 'race', allow: ['F1', 'F2'],
      hint: [['F2', 'drag', 1, 0], ['F1', 'drag', -1, 0]],
      t: { ko: ['빨라졌다 느려졌다', '오른쪽 끌개를 끌어 도막을 <b>출발</b>시키고, 달리는 동안 <b>왼쪽 끌개를 왼쪽으로 세게</b> 끌어 보세요.'], en: ['Speed up, slow down', 'Drag the right puller to <b>launch</b> the block, then while it moves drag the <b>left puller hard to the left</b>.'] },
      pred: PRED(['달리는 도막을 반대쪽에서 더 세게 당기면?', ['더 빨라져요', '점점 느려져요', '그 자리에 딱 멈춰요']], ['Pull a moving block harder the other way. It will…', ['speed up', 'slow down bit by bit', 'stop instantly']], 1),
      enter() { kidTrack('glass', XMIN()); S.speed = 0.45; S.seen = { acc: false, dec: false, rev: false }; },
      reset() { setParam('F1', 0); setParam('F2', 0); resetTrack(XMIN()); S.seen = { acc: false, dec: false, rev: false }; },
      meter: () => { const v = Math.abs(S.trk.v), a = S.F && v > 0.01 ? S.F.a * Math.sign(S.trk.v) : 0; const st = v < 0.01 ? L2('멈춤', 'stopped') : a > 0.02 ? L2('빨라지는 중', 'speeding up') : a < -0.02 ? L2('느려지는 중', 'slowing down') : L2('같은 빠르기', 'steady'); return `<div class="kmeter"><span>${L2('빠르기', 'speed')} ${big(fx(v, 2), 'm/s')}</span><span class="keq">·</span><span style="color:#fde68a">${st}</span></div><div class="kchk">${kcb(S.seen.acc)} ${L2('빨라짐', 'sped up')} &nbsp; ${kcb(S.seen.dec)} ${L2('느려짐', 'slowed down')}</div>`; },
      check: () => S.seen.acc && S.seen.dec,
      win: () => L2('<b style="color:#fde68a">노란 ‘모두 합친 힘’</b>이 움직이는 쪽을 향하면 <b>빨라지고</b>, 반대쪽을 향하면 <b>느려져요</b>. 힘이 움직임(빠르기와 방향)을 바꾼 거예요!', 'When the <b style="color:#fde68a">yellow “all together”</b> arrow points the way it moves, it <b>speeds up</b>; when it points back, it <b>slows down</b>. Forces change motion!'),
    },
    {
      id: 'boss', stage: 9, icon: '👑', boss: true, shot: 'track', look: 'block', theme: 'arena', allow: ['F2', 'surface', 'block'],
      hint: [['surface', 'tap'], ['block', 'tap'], ['F2', 'drag', 1, 0]],
      t: { ko: ['보스 미션: 끄떡없는 도막', '<b>바닥을 눌러</b> 재질을 바꾸고, <b>도막을 눌러</b> 짐을 올린 뒤, 오른쪽 끌개를 <b>4 N</b>까지 끌어 보세요. 안 미끄러지면 승리!'], en: ['Boss mission: the unbudgeable block', '<b>Tap the floor</b> to change it, <b>tap the block</b> to add loads, then drag the right puller to <b>4 N</b>. If it holds, you win!'] },
      enter() { kidTrack('glass'); KID.ctx.hold = 0; KID.ctx.fail = false; },
      reset() { kidDesign(S.surface); },
      meter: () => {
        const fs = S.F ? S.F.fsMax : 0, mx = 7, ok = fs >= 4;
        const msg = KID.ctx.fail ? L2('앗, 미끄러졌어요! 바닥이나 짐을 바꿔 다시 도전!', 'Oops, it slid! Change the floor or loads and try again!') : L2(`바닥이 최대 ${big(fx(fs, 1))}까지 붙잡아요 · 당기는 힘 ${big(n1(S.F2.tgt))}`, `Floor grips up to ${big(fx(fs, 1))} · pull ${big(n1(S.F2.tgt))}`);
        return `<div class="kmeter kgaugebox"><div class="kgl">${msg}</div><div class="kgauge"><i class="${ok ? 'ok' : ''}" style="width:${clamp(fs / mx, 0, 1) * 100}%"></i><b style="left:${4 / mx * 100}%"><em>4 N</em></b></div><div class="kgl2">${T('surfName')[S.surface]} · ${L2('짐', 'loads')} ${S.load.tgt}${L2('개', '')}</div></div>`;
      },
      tick() { const c = KID.ctx; if (S.F2.tgt > 0 && S.F) { if (S.F.mode === 'slide' || S.F.mode === 'bump') { if (!c.fail) sfx('clack'); c.fail = true; } else if (S.F2.tgt >= 4 && S.F.mode === 'held' && S.trk.v === 0) c.hold += 0.08; } },
      check: () => S.F1.tgt === 0 && S.F2.tgt >= 4 && !KID.ctx.fail && KID.ctx.hold > 0.8 && !DRAG.kind, card: 'N',
      win: () => L2(`끄떡없어요! ${T('surfName')[S.surface]} 바닥 + 짐 ${S.load.tgt}개 → 무거워진 도막을 바닥이 세게 받치고(흰 화살표), 그만큼 최대 ${fx(S.F.fsMax, 1)} N까지 붙잡아요. 미끄럼 방지 신발 바닥이 까끌까끌한 이유예요!`, `Unbudgeable! ${T('surfName')[S.surface]} + ${S.load.tgt} load(s): the heavier block is pushed up harder by the floor (white arrow), so it can grip up to ${fx(S.F.fsMax, 1)} N. That’s why non-slip soles are rough!`),
    },
    { id: 'quiz', stage: 10, icon: '📝', quiz: true, shot: 'hero', theme: 'class', t: { ko: ['정리 퀴즈', '오늘 배운 힘! ⭕ 또는 ❌를 골라 보세요.'], en: ['Wrap-up quiz', 'What did we learn? Choose ⭕ or ❌.'] }, enter() { KID.ctx.q = 0; KID.ctx.ans = []; setSame(false); setSurface('glass'); setParam('load', 0, true); setParam('F1', 0, true); setParam('F2', 0, true); resetTrack(); S.obj = 'weights'; setParam('n', 2, true); setParam('g', 9.8, true); S.jack.tgt = PC.jack.min; }, check: () => KID.ctx.ans && KID.ctx.ans.length >= KID_QUIZ.length && KID.ctx.ans.every((a) => a != null) },
  ],
  max() { return this.missions.length * 100 + this.missions.filter((m) => m.pred).length * 50 + KID_QUIZ.length * 50; },
  go(i) {
    if (i >= this.missions.length) { this.i = this.missions.length; this.render(); this.burst(90); sfx('win'); return; }
    this.free = false; this.i = Math.max(0, i); this.ctx = {}; this.passed = false; this.showWin = false; S.pin = false; dirTeleReset();
    const m = this.missions[this.i];
    S.overlays.K = false; UI.syncButtons();
    m.enter && m.enter();
    S.overlays.F = true; S.overlays.L = true;
    CAM.cine = false; dirCut(m);
    if (m.look) this.ring(3.2, true);
    UI.syncControls(); this.render();
  },
  // 직접 조작: 지금 퀘스트에서 만질 수 있는 기구인지 (예상을 고르기 전에는 잠금)
  allows(k) { if (this.free) return true; const m = this.missions[this.i]; if (!m || m.quiz || !((m.allow || []).includes(k) || (KH_STATION[S.station] || []).includes(k))) return false; if (this.phase() === 'predict') { const pr = document.querySelector('#kid .kpred'); if (pr) { pr.classList.remove('shake'); void pr.offsetWidth; pr.classList.add('shake'); } return false; } return true; },
  acted() { this.ctx.acted = true; this.idle = 0; },
  rocket(el) {
    const set = (e) => { const r = el.getBoundingClientRect(); const f = clamp((e.clientX - r.left) / r.width, 0, 1); let g = 9.8 - f * 8.2; for (const q of [1.6, 3.7, 9.8]) if (Math.abs(g - q) < 0.35) g = q; if (g !== S.g.tgt) { setParam('g', g); S.hv.v += 0.004; } this.acted(); this.update(); };
    el.onpointerdown = (e) => { if (this.phase() === 'predict') return this.allows('rocket'); ensureAudio(); el.setPointerCapture(e.pointerId); el.classList.add('drag'); set(e); el.onpointermove = set; };
    el.onpointerup = el.onpointercancel = () => { el.onpointermove = null; el.classList.remove('drag'); };
  },
  phase() { if (this.free) return 'play'; const m = this.missions[this.i]; return m && m.pred && this.pick[this.i] == null ? 'predict' : 'play'; },
  hud() {
    const M = this.missions, el = document.getElementById('kidhud'); if (!el) return;
    el.innerHTML = `<div class="kmode"><button data-m="q" class="${this.free ? '' : 'on'}">${L2('퀘스트', 'Quests')}</button><button data-m="f" class="${this.free ? 'on' : ''}">${L2('자유 실험', 'Free lab')}</button></div><div class="kprog${this.free ? ' off' : ''}"><span class="kpn"><b>${Math.min(this.i + 1, M.length)}</b> / ${M.length}</span><div class="kseg">${M.map((m, k) => `<i class="${this.done[k] ? 'done' : ''}${k === this.i ? ' cur' : ''}${m.boss ? ' boss' : ''}" title="${(STAGE[LANG] || STAGE.ko)[m.stage]}"></i>`).join('')}</div></div>
      <div class="kscore">${ico('star')}<b id="kpts">${Math.round(this.shown)}</b></div>
      <button class="ksnd" title="${VOICE.on ? L2('소리 끄기', 'Sound off') : L2('소리 켜기', 'Sound on')}">${ico(VOICE.on ? 'speaker' : 'mute')}</button>`;
    el.querySelectorAll('.kmode button').forEach((b) => (b.onclick = () => { ensureAudio(); this.setFree(b.dataset.m === 'f'); }));
    el.querySelector('.ksnd').onclick = () => { VOICE.on = !VOICE.on; setSound(VOICE.on); ensureAudio(); if (!VOICE.on) try { speechSynthesis.cancel(); } catch (e) {} this.hud(); };
  },
  legend() {
    const el = document.getElementById('legend'); if (!el) return;
    el.innerHTML = `<b>${ico('cards')}${KT('cardsT')} <em>${this.cards.size}/${CARDS.length}</em></b>` + CARDS.map((c) => (this.cards.has(c.k) ? `<span class="on"><i style="background:${hex(c.col)}"></i>${cardT(c)[0]}</span>` : '<span class="off"></span>')).join('');
  },
  render() {
    const box = document.getElementById('kid'), M = this.missions, N = M.length;
    this.hud(); this.legend();
    if (this.free) return this.renderFree();
    if (this.i >= N) { khBuild(); box.innerHTML = `<div class="kmodal"><div class="kbox">${this.finalHTML()}</div></div>`; box.querySelector('[data-k=again]').onclick = () => this.reset(); box.querySelector('[data-k=full]').onclick = () => setMode('full'); box.querySelector('[data-k=free]').onclick = () => this.setFree(true); return; }
    const m = M[this.i], t = m.t[LANG] || m.t.ko, ph = this.phase(), tag = '';
    let body = '';
    const lis = `<button class="ksay2" title="${L2('다시 듣기', 'Listen again')}">${ico('speaker')}</button>`;
    if (m.quiz) body = `<div class="kmodal kquizm"><div class="kbox">${this.quizHTML()}</div></div>`;
    else if (ph === 'predict') { const p = m.pred[LANG] || m.pred.ko; body = `<div class="kmodal"><div class="kbox kpred"><div class="kmh"><div class="kav sm">${quokka('think')}</div><div><div class="keye">${L2('예상하기', 'Predict')}</div><div class="kq">${p[0]}</div></div>${lis}</div><div class="kopts n${p[1].length}">${p[1].map((o, k) => `<button class="kopt" data-p="${k}"><span class="kpic">${predPic(m.id, k)}</span><span class="kol">${o}</span></button>`).join('')}</div></div></div>`;
      speakOnce(`${this.i}:pred`, `${p[0]} ${p[1].join(', ')}`); }
    else {
      const mine = m.pred ? `<div class="kmine">${KT('mine')}${predPic(m.id, this.pick[this.i])}</div>` : '';
      const rocket = m.widget === 'rocket' ? `<div class="krocket">${ico('globe')}<div class="krk"><b style="left:100%"></b><b class="mars" style="left:${(9.8 - 3.7) / 8.2 * 100}%"></b><i class="kr">${ico('grip')}</i></div>${ico('moon')}</div>` : '';
      body = `<div class="kfoot"><div class="know"><div class="knowtxt"></div></div><div class="krow">${mine}<div class="kmeterbox"></div>${m.shot !== 'hero' ? '<canvas class="ktele"></canvas>' : ''}${m.reset ? `<button class="kreset">${ico('reset')}<span>${L2('처음으로', 'Reset')}</span></button>` : ''}</div>${rocket}</div>`;
    }
    box.innerHTML = `<div class="kban${m.boss ? ' boss' : ''}"><div class="kav">${quokka()}</div><div class="kbtxt"><div class="keye">${m.boss ? L2('도전 과제', 'Challenge') : 'Step ' + m.stage}<i></i>${(STAGE[LANG] || STAGE.ko)[m.stage]}</div><div class="ktitle">${t[0]}${lis}</div><div class="ksteps">${kidSteps(m)}</div></div><button class="kskip">${KT('skip')}${ico('chevR')}</button></div>${body}
      <div class="kwin"><div class="kbox"><div class="kwintxt"></div><div class="kwrow"><div class="kwok">${ico('check')}</div><div class="kwmain"><div class="kwt">${L2('미션 성공', 'Mission clear')}<span class="kstars"><i>${ico('star')}</i><i>${ico('star')}</i><i>${ico('star')}</i></span></div><div class="kgain"></div></div><button class="kwhybtn">${ico('speaker')}<span>${L2('왜 그럴까?', 'Why?')}</span></button><button class="kbtn main kgo"></button></div><div class="kauto"><div><i></i></div></div></div></div>`;
    box.querySelectorAll('[data-p]').forEach((el) => (el.onclick = () => { ensureAudio(); this.pick[this.i] = +el.dataset.p; sfx('pick'); this.render(); if (m.look) this.ring(2.2, false); }));
    box.querySelectorAll('[data-b]').forEach((el) => (el.onclick = () => { ensureAudio(); if (m.quiz) this.answer(+el.dataset.b === 0); }));
    const qn = box.querySelector('.kqnext'); if (qn) qn.onclick = () => { this.ctx.q++; this.render(); };
    const rs = box.querySelector('.kreset'); if (rs) rs.onclick = () => { m.reset(); this.ctx.acted = false; this.update(true); };
    const rk = box.querySelector('.krk'); if (rk) this.rocket(rk);
    box.querySelector('.kgo').onclick = () => this.go(this.i + 1);
    box.querySelector('.kskip').onclick = () => this.go(this.i + 1);
    box.querySelectorAll('.kban .ksay2').forEach((b) => (b.onclick = () => speak(`${t[0]}. ${t[1]}`, true)));
    const pb = box.querySelector('.kpred .ksay2'); if (pb) pb.onclick = () => { const p = m.pred[LANG] || m.pred.ko; speak(`${p[0]} ${p[1].join(', ')}`, true); };
    const qb = box.querySelector('.kquiz .ksay2'); if (qb) qb.onclick = () => speak(this.quizSpeech(), true);
    box.querySelector('.kwhybtn').onclick = () => { box.querySelector('.kwin').classList.toggle('open'); speak(m.quiz ? '' : m.win(), true); };
    if (m.quiz) speakOnce(`${this.i}:q${this.ctx.q}:${this.ctx.ans[this.ctx.q] == null ? 'ask' : 'fb'}`, this.quizSpeech());
    else if (ph !== 'predict') speakOnce(`${this.i}:play`, `${t[0]}. ${t[1]}`);
    khBuild(); this.update(true);
  },
  // ---- 자유 실험실: 퀘스트 없이 실험대의 모든 기구를 마음대로 ----
  setFree(on) {
    if (on === this.free) return;
    if (!on) { this.go(Math.min(Math.max(this.i, 0), this.missions.length - 1)); return; }
    this.free = true; this.passed = false; this.showWin = false; this.ctx = {}; S.pin = false; dirTeleReset();
    if (S.station !== 'track' && S.station !== 'hang') setStation('track', false);
    if (S.station === 'track') { const L = S.load.tgt; kidTrack(S.surface); setParam('load', L, true); }
    S.playing = true; S.speed = 1; S.overlays.F = true; S.overlays.L = true;
    CAM.cine = false; dirReveal(stationShot(S.station)); sfx('whoosh');
    this.render();
  },
  freeStation(st) {
    if (st === 'track') { if (S.station !== 'track') kidTrack(S.surface); } else if (S.station !== 'hang') kidHang(S.obj, S.obj === 'weights' ? Math.max(1, S.n.tgt) : 0);
    dirTeleReset(); dirReveal(stationShot(st)); sfx('whoosh'); this.render();
  },
  freeMeter() {
    const sep = '<span class="keq">·</span>';
    if (S.station === 'track') { const F = S.F || {}; return `<div class="kmeter"><span>${ico('arrowL')} ${big(n1(S.F1.tgt))}</span>${sep}<span>${big(n1(S.F2.tgt))} ${ico('arrowR')}</span>${sep}<span>${L2('붙잡는 힘 최대', 'Max grip')} ${big(fx(F.fsMax || 0, 1))}</span>${sep}<span>${L2('빠르기', 'Speed')} ${big(fx(Math.abs(S.trk.v), 2), 'm/s')}</span></div>`; }
    const r = S.hang || {};
    return `<div class="kmeter"><span>${L2('저울', 'Scale')} ${big(fx(S.Tlive, 2))}</span>${sep}<span>${L2('무게', 'Weight')} ${big(fx(r.W || 0, 2))}</span>${sep}<span>${L2('부력', 'Buoyancy')} ${big(fx(r.B || 0, 2))}</span>${sep}<span>${L2('잠김', 'Under')} ${big(fx((r.frac || 0) * 100, 0), '%')}</span></div>`;
  },
  renderFree() {
    const box = document.getElementById('kid'), st = S.station;
    const btn = (k, ic, t, sub) => `<button data-st="${k}" class="${st === k ? 'on' : ''}"><span class="kso">${ico(ic)}</span><span><b>${t}</b><small>${sub}</small></span></button>`;
    box.innerHTML = `<div class="kban kfree"><div class="kbtxt"><div class="keye">${L2('자유 실험실', 'Free lab')}<i></i>${L2('무엇이든 바꿔 보세요', 'Change anything')}</div>
      <div class="kstations">${btn('track', 'box', L2('끌기대', 'Pulling track'), L2('힘의 평형 · 마찰력 · 운동', 'Balance · friction · motion'))}${btn('hang', 'weight', L2('용수철과 물', 'Spring & water'), L2('무게 · 탄성력 · 부력', 'Weight · spring · buoyancy'))}</div></div></div>
      <div class="kfoot"><div class="krow"><div class="kmeterbox"></div><canvas class="ktele"></canvas><button class="kreset">${ico('reset')}<span>${L2('처음으로', 'Reset')}</span></button></div></div>`;
    box.querySelectorAll('[data-st]').forEach((b) => (b.onclick = () => this.freeStation(b.dataset.st)));
    box.querySelector('.kreset').onclick = () => { if (S.station === 'track') { const L = S.load.tgt; kidTrack(S.surface); setParam('load', L, true); } else { setParam('jack', PC.jack.min); S.hv.v += 0.01; } this.update(true); };
    speakOnce(`free:${st}`, L2('자유 실험실이에요. 기구를 마음대로 바꿔 보세요.', 'Free lab. Change anything you like.'));
    khBuild(); this.update(true);
  },
  quizHTML() {
    const c = this.ctx, n = KID_QUIZ.length, q = KID_QUIZ[Math.min(c.q, n - 1)], t = q[LANG] || q.ko, a = c.ans[c.q];
    const dots = KID_QUIZ.map((_, k) => `<i class="${c.ans[k] == null ? (k === c.q ? 'cur' : '') : c.ans[k] ? 'ok' : 'no'}"></i>`).join('');
    const fb = a == null ? '' : `<div class="kqfb ${a ? 'ok' : 'no'}"><span class="kqfi">${ico(a ? 'check' : 'info')}</span><div><b>${a ? L2('정답이에요', 'Correct') : L2('아쉬워요', 'Not quite')}</b><span>${L2('정답', 'Answer')} ${ico(q.a ? 'circle' : 'x')} · ${t[1]}</span></div></div>${c.q < n - 1 ? `<button class="kbtn main wide kqnext">${L2('다음 문제', 'Next question')}${ico('chevR')}</button>` : ''}`;
    return `<div class="kquiz"><div class="kmh"><div><div class="keye">${L2('OX 퀴즈', 'O/X quiz')}<i></i>${Math.min(c.q + 1, n)} / ${n}</div><div class="kqd">${dots}</div></div><button class="ksay2" title="${L2('다시 듣기', 'Listen again')}">${ico('speaker')}</button></div><div class="kqq">${t[0]}</div>
      ${a == null ? `<div class="kbtns kox"><button class="kbtn ko" data-b="0" aria-label="${KT('yes')}">${ico('circle')}<span>${L2('맞아요', 'True')}</span></button><button class="kbtn kx" data-b="1" aria-label="${KT('no')}">${ico('x')}<span>${L2('아니에요', 'False')}</span></button></div>` : fb}</div>`;
  },
  quizSpeech() {
    const c = this.ctx, q = KID_QUIZ[Math.min(c.q, KID_QUIZ.length - 1)], t = q[LANG] || q.ko, a = c.ans[c.q];
    return a == null ? `${t[0]} ${L2('맞으면 동그라미, 아니면 엑스!', 'Circle for true, cross for false!')}` : `${a ? KT('right') : KT('wrong')} ${t[1]}`;
  },
  answer(yes) {
    const c = this.ctx, q = KID_QUIZ[c.q]; if (!q || c.ans[c.q] != null) return;
    const ok = yes === q.a; c.ans[c.q] = ok;
    if (ok) { this.add(50); sfx('ding'); this.burst(16); } else sfx('tick');
    const q0 = c.q, i0 = this.i; if (c.q < KID_QUIZ.length - 1) this.after(2.6, () => { if (this.i === i0 && c.q === q0) { c.q++; this.render(); } });
    this.render();
  },
  finalHTML() {
    const mx = this.max(), p = this.score / mx, nDone = this.done.filter(Boolean).length, nHit = this.hit.filter(Boolean).length;
    const rank = p >= 0.85 ? L2('힘 박사', 'Force Professor') : p >= 0.6 ? L2('힘 탐험가', 'Force Explorer') : L2('힘 새싹', 'Force Sprout');
    return `<div class="kfinal"><div class="ktro">${ico('trophy')}</div><div class="keye">${L2('최종 결과', 'Results')}</div><div class="ktitle">${L2('힘 탐험 완료!', 'Force quest complete!')}</div>
      <div class="krank">${rank}</div>
      <div class="kfs"><div><b>${this.score}</b><span>${L2('점수', 'Score')} / ${mx}</span></div><div><b>${nDone}/${this.missions.length}</b><span>${L2('완료한 퀘스트', 'Quests done')}</span></div><div><b>${nHit}/${this.missions.filter((m) => m.pred).length}</b><span>${L2('예상 적중', 'Good guesses')}</span></div></div>
      <div class="kcards">${CARDS.map((c) => { const on = this.cards.has(c.k), t = cardT(c); return `<div class="kcard ${on ? 'on' : 'off'}" style="--c:${hex(c.col)}"><i></i><b>${on ? t[0] : L2('잠김', 'Locked')}</b></div>`; }).join('')}</div>
      <p class="ksay">${L2('힘이 비기면 그대로, 한쪽이 이기면 움직임이 바뀌어요!', 'Balanced forces change nothing; an unbalanced force changes the motion!')}</p>
      <div class="kbtns g3"><button class="kbtn main" data-k="free">${L2('자유 실험실', 'Free lab')}</button><button class="kbtn" data-k="again">${KT('again')}</button><button class="kbtn" data-k="full">${KT('full')}</button></div></div>`;
  },
  reset() { this.done = []; this.hit = []; this.pick = []; this.cards = new Set(); this.score = 0; this.shown = 0; this.fx.later.length = 0; this.go(0); },
  add(n) { this.score += n; this.float(`+${n}`); },
  update(force) {
    if (this.free) { if (S.mode === 'kid') { const mb = document.querySelector('#kid .kmeterbox'); if (mb) { const h = this.freeMeter(); if (h !== mb._h) { mb.innerHTML = h; mb._h = h; } } } return; }
    if (S.mode !== 'kid' || this.i < 0 || this.i >= this.missions.length) return;
    const m = this.missions[this.i], box = document.getElementById('kid');
    if (this.phase() === 'play' && !m.quiz && m.tick) m.tick();
    if (!this.passed && this.phase() === 'play' && m.check()) this.win(m);
    const mb = box.querySelector('.kmeterbox'); if (mb && m.meter) { const h = m.meter(); if (h !== mb._h) { mb.innerHTML = h; mb._h = h; } }
    const kr = box.querySelector('.krk .kr'); if (kr) kr.style.left = `${clamp((9.8 - S.g.tgt) / 8.2, 0, 1) * 100}%`;
    const nt = box.querySelector('.knowtxt'); if (nt) { const h = kidCaption(); if (h !== nt._h) { nt.innerHTML = h; nt._h = h; } }
    const w = box.querySelector('.kwin');
    if (w) { w.classList.toggle('on', this.passed && this.showWin); if (this.passed && this.showWin && (force || !w.dataset.f)) { w.dataset.f = '1'; this.winText(m, w); } }
  },
  win(m) {
    this.passed = true; const first = !this.done[this.i]; this.done[this.i] = true;
    if (first) {
      this.add(100);
      if (m.pred && this.pick[this.i] === m.pred.ans) { this.hit[this.i] = true; this.after(0.45, () => this.add(50)); }
      if (m.card && !this.cards.has(m.card)) { this.cards.add(m.card); this.after(0.7, () => this.cardPop(m.card)); }
    }
    sfx('win'); this.burst(m.boss ? 120 : 60); this.hud(); this.legend(); dirEvent('win', m);
    const i0 = this.i; this.showWin = !!m.quiz; this.after(m.quiz ? 0 : WIN_DELAY, () => { if (this.i === i0) { this.showWin = true; this.update(true); } });
    this.after(AUTO_NEXT, () => { if (this.i === i0 && this.passed && S.mode === 'kid') this.go(this.i + 1); });
  },
  winText(m, w) {
    const quiz = m.quiz, nOk = quiz ? this.ctx.ans.filter(Boolean).length : 0, card = m.card && CARDS.find((c) => c.k === m.card);
    w.classList.remove('open'); speak(quiz ? w.querySelector('.kwintxt').textContent : `${L2('미션 성공!', 'Mission clear!')} ${m.win()}`);
    w.querySelector('.kwintxt').innerHTML = quiz ? L2(`퀴즈 ${nOk}/${KID_QUIZ.length} 정답! 마지막 문제: ${(KID_QUIZ.at(-1)[LANG] || KID_QUIZ.at(-1).ko)[1]}`, `Quiz: ${nOk}/${KID_QUIZ.length} correct! Last one: ${(KID_QUIZ.at(-1)[LANG] || KID_QUIZ.at(-1).ko)[1]}`) : m.win();
    const nStar = quiz ? (nOk >= KID_QUIZ.length - 1 ? 3 : nOk >= KID_QUIZ.length / 2 ? 2 : 1) : m.pred && this.pick[this.i] !== m.pred.ans ? 2 : 3;
    w.querySelectorAll('.kstars i').forEach((el, k) => { el.className = k < nStar ? 'on' : ''; el.style.animationDelay = `${0.2 + k * 0.15}s`; });
    const why = quiz || !m.pred ? '' : this.pick[this.i] === m.pred.ans ? `<span class="kchip ok">${ico('check')}${L2('예상 적중', 'Good guess')} +50</span>` : `<span class="kchip">${L2('예상과 달랐어요', 'Not what you guessed')}</span>`;
    w.querySelector('.kgain').innerHTML = `${why}<span class="kchip">${ico('star')}+100</span>${card ? `<span class="kchip" style="--c:${hex(card.col)}"><i class="dot"></i>${L2('힘 카드', 'Card')} · ${cardT(card)[0]}</span>` : ''}`;
    w.querySelector('.kgo').innerHTML = this.i === this.missions.length - 1 ? `${L2('결과 보기', 'See results')}${ico('chevR')}` : `${L2('다음', 'Next')}${ico('chevR')}`;
    const bar = w.querySelector('.kauto div i'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = `kauto ${AUTO_NEXT - (m.quiz ? 0 : WIN_DELAY)}s linear forwards`;
  },
  cardPop(k) {
    const c = CARDS.find((q) => q.k === k), el = document.getElementById('kpop'); if (!el || !c || S.mode !== 'kid') return;
    const t = cardT(c);
    el.innerHTML = `<div class="kpcard" style="--c:${hex(c.col)}"><small>${L2('새 힘 카드', 'New force card')}</small><i></i><b>${t[0]}</b><span>${t[1]}</span></div>`;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); sfx('pop');
    const id = (this._pid = (this._pid || 0) + 1); this.after(2.6, () => { if (this._pid === id) el.classList.remove('on'); });
  },
  // ---- 화면 효과 캔버스: 눈길 고리, 색종이, 점수 떠오르기 (update()에서 매 프레임) ----
  fx: { parts: [], floats: [], ring: null, later: [] },
  after(sec, fn) { this.fx.later.push({ t: sec, fn }); },   // 시뮬레이션 시간 기준 지연 실행
  ring(dur, label) { this.fx.ring = { t: 0, dur, label }; },
  burst(n) {
    const W = innerWidth, H = innerHeight;   // 양옆 아래에서 쏘아 올려 가운데 실험 장면은 가리지 않는다
    const cols = ['#6366f1', '#a5b4fc', '#38bdf8', '#34d399', '#fbbf24', '#ffffff'];
    for (let i = 0; i < n; i++) { const L = i % 2 === 0, a = L ? rr(-Math.PI * 0.42, -Math.PI * 0.22) : rr(-Math.PI * 0.78, -Math.PI * 0.58), sp = rr(9, 16); this.fx.parts.push({ x: L ? rr(0, 30) : W - rr(0, 30), y: H * rr(0.72, 0.85), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rr(0, 6.28), vr: rr(-0.3, 0.3), w: rr(6, 10), h: rr(3, 6), c: cols[i % cols.length], life: rr(1.4, 2.4) }); }
  },
  float(txt) { const L = document.querySelector('#kidhud .kscore')?.getBoundingClientRect(); this.fx.floats.push({ txt, x: L && L.width ? L.left + L.width / 2 : innerWidth / 2, y: L && L.width ? L.bottom + 26 : 120, t: 0 }); },
  frame(dt) {
    const cv = document.getElementById('kfx'); if (!cv) return;
    const W = innerWidth, H = innerHeight, F = this.fx, kid = S.mode === 'kid';
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const c = cv.getContext('2d'); c.clearRect(0, 0, W, H);
    if (!kid) { F.parts.length = 0; F.floats.length = 0; F.later.length = 0; return; }
    const due = F.later.filter((q) => (q.t -= dt) <= 0); F.later = F.later.filter((q) => q.t > 0); due.forEach((q) => q.fn());
    this.shown += (this.score - this.shown) * (1 - Math.exp(-dt * 6)); if (Math.abs(this.score - this.shown) < 0.5) this.shown = this.score;
    const pe = document.getElementById('kpts'); if (pe && pe.textContent !== String(Math.round(this.shown))) pe.textContent = Math.round(this.shown);
    // 눈길 고리 (카메라가 다 날아간 뒤부터)
    const m = this.missions[this.i], R = F.ring;
    if (R && m && m.look && this.phase() !== 'predict' && !CAM.fly && !document.getElementById('kidIntro').classList.contains('on')) {
      R.t += dt;
      if (R.t > R.dur) F.ring = null;
      else {
        const v = LOOK[m.look]().clone().project(camera), x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
        const al = Math.min(1, R.t * 4, (R.dur - R.t) * 2.5);
        for (let j = 0; j < 2; j++) { const p = (R.t * 0.9 + j * 0.5) % 1; c.strokeStyle = `rgba(255,255,255,${al * (1 - p) * 0.9})`; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 30 + p * 34, 0, 7); c.stroke(); }
        c.strokeStyle = `rgba(255,255,255,${al * 0.85})`; c.lineWidth = 2.5; c.setLineDash([7, 6]); c.lineDashOffset = -R.t * 30; c.beginPath(); c.arc(x, y, 34, 0, 7); c.stroke(); c.setLineDash([]);
        if (R.label) {   // 말풍선은 고리 왼쪽 (힘 이름표는 위쪽에 붙으므로 겹치지 않게)
          const txt = L2('여기를 보세요', 'Look here'); c.font = '600 14px "Noto Sans KR", system-ui, sans-serif';
          const tw = c.measureText(txt).width + 28, bx = x - 52 - tw - Math.abs(Math.sin(R.t * 5)) * 8;
          c.fillStyle = `rgba(255,255,255,${al})`; c.beginPath(); c.roundRect(bx, y - 15, tw, 30, 10); c.fill();
          c.beginPath(); c.moveTo(bx + tw - 1, y - 8); c.lineTo(bx + tw - 1, y + 8); c.lineTo(bx + tw + 9, y); c.fill();
          c.fillStyle = `rgba(17,24,39,${al})`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, bx + tw / 2, y);
        }
      }
    }
    // 손 힌트: 아직 조작하지 않았거나 한동안 가만히 있으면, 끌 곳·누를 곳을 손 모양으로 보여 준다
    this.idle = (this.idle || 0) + dt;
    if (m && m.hint && !KH.items.length && !this.passed && this.phase() === 'play' && !CAM.fly && !DRAG.kind && (!this.ctx.acted || this.idle > 7)) {
      const P = (this.hintT = (this.hintT || 0) + dt), hs = m.hint, h = hs[Math.floor(P / 2.2) % hs.length], ph = (P % 2.2) / 2.2;
      const v = KID_AT[h[0]]().project(camera), x0 = (v.x + 1) / 2 * W, y0 = (1 - v.y) / 2 * H;
      const al = Math.min(1, ph * 6, (1 - ph) * 5);
      c.save(); c.globalAlpha = al;
      if (h[1] === 'drag') {
        const L = 80, e = smooth(clamp((ph - 0.15) / 0.6, 0, 1)), x1 = x0 + h[2] * L, y1 = y0 + h[3] * L;
        c.strokeStyle = 'rgba(253,230,138,.9)'; c.lineWidth = 4; c.setLineDash([8, 7]); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.setLineDash([]);
        const a = Math.atan2(y1 - y0, x1 - x0); c.fillStyle = 'rgba(253,230,138,.9)'; c.beginPath(); c.moveTo(x1 + 12 * Math.cos(a), y1 + 12 * Math.sin(a)); c.lineTo(x1 + 12 * Math.cos(a + 2.4), y1 + 12 * Math.sin(a + 2.4)); c.lineTo(x1 + 12 * Math.cos(a - 2.4), y1 + 12 * Math.sin(a - 2.4)); c.fill();
        handAt(c, x0 + (x1 - x0) * e, y0 + (y1 - y0) * e, e > 0 && e < 1 ? 0.9 : 1);
        c.font = '700 14px "Noto Sans KR", system-ui, sans-serif'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(20,16,12,.8)'; const tx = L2('끌어요', 'drag'); c.strokeText(tx, x0, y0 - 30); c.fillStyle = '#fde68a'; c.fillText(tx, x0, y0 - 30);
      } else {
        const tap = Math.abs(Math.sin(ph * Math.PI * 2)); c.strokeStyle = `rgba(253,230,138,${0.9 * (1 - tap)})`; c.lineWidth = 3; c.beginPath(); c.arc(x0, y0, 14 + tap * 22, 0, 7); c.stroke();
        handAt(c, x0, y0 + 6 - tap * 8, 1 - tap * 0.1);
        c.font = '700 14px "Noto Sans KR", system-ui, sans-serif'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(20,16,12,.8)'; const tx = L2('눌러요', 'tap'); c.strokeText(tx, x0, y0 - 30); c.fillStyle = '#fde68a'; c.fillText(tx, x0, y0 - 30);
      }
      c.restore();
    } else this.hintT = 0;
    // 끄는 동안 힘 크기를 크게 보여 준다
    if (DRAG.kind === 'F1' || DRAG.kind === 'F2' || DRAG.kind === 'jack') {
      const v = KID_AT[DRAG.kind]().project(camera), x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H - 46;
      const txt = DRAG.kind === 'jack' ? `${L2('잠김', 'under')} ${fx((S.hang ? S.hang.frac : 0) * 100, 0)}%` : `${fx(S[DRAG.kind].tgt, 1)} N`;
      c.font = '800 26px "Noto Sans KR", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; const tw = c.measureText(txt).width + 26;
      c.fillStyle = 'rgba(20,16,12,.82)'; c.beginPath(); c.roundRect(x - tw / 2, y - 20, tw, 40, 20); c.fill();
      c.fillStyle = DRAG.kind === 'jack' ? '#7dd3fc' : '#c4b5fd'; c.fillText(txt, x, y);
    }
    dirDraw(c, dt);
    // 색종이
    for (const p of F.parts) { p.vy += dt * 30; p.vx *= 0.99; p.x += p.vx * dt * 30; p.y += p.vy * dt * 30; p.r += p.vr; p.life -= dt; c.save(); c.globalAlpha = Math.max(0, Math.min(1, p.life * 2)); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore(); }
    F.parts = F.parts.filter((p) => p.life > 0 && p.y < H + 20);
    // 점수 떠오르기
    for (const f of F.floats) { f.t += dt; const a = Math.max(0, 1 - f.t / 1.3), y = f.y - f.t * 50; c.globalAlpha = a; c.font = '700 22px Outfit, "Noto Sans KR", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = 'rgba(17,24,39,.55)'; c.strokeText(f.txt, f.x, y); c.fillStyle = '#ffffff'; c.fillText(f.txt, f.x, y); c.globalAlpha = 1; }
    F.floats = F.floats.filter((f) => f.t < 1.3);
  },
};

// 쉬운 말 상황 설명 (숫자 1~2개)
function kidCaption() {
  const r = S.hang, F = S.F, E = isEn(); if (!r || !F) return '';
  if (S.station === 'hang') {
    if (r.empty) return E ? 'Nothing is hanging yet, so the scale shows 0 N.' : '아직 아무것도 안 걸려서 저울이 0 N이에요.';
    if (S.settle < 0.15 && Math.abs(S.hv.v) > 0.01) return E ? 'Boing! The spring bounces, then settles.' : '출렁출렁~ 용수철이 흔들리다가 곧 멈춰요.';
    if (r.floating) return E ? `Floating! The water holds it up, so the scale shows 0 N.` : `둥둥 떠 있어요! 물이 받쳐 줘서 저울은 0 N이에요.`;
    if (r.frac >= 0.999) return E ? `All under water: the scale went from ${fx(r.W, 2)} N down to ${fx(r.T, 2)} N.` : `물에 다 잠겼어요. 저울이 ${fx(r.W, 2)} N에서 ${fx(r.T, 2)} N으로 줄었어요.`;
    if (r.inFluid) return E ? `Partly under water: the water pushes up ${fx(r.B, 2)} N.` : `물에 조금 잠겼어요. 물이 ${fx(r.B, 2)} N만큼 위로 밀어 올려요.`;
    return E ? `Earth pulls with ${fx(r.W, 2)} N and the spring pulls back with ${fx(r.T, 2)} N. They balance, so it hangs still.` : `지구가 ${fx(r.W, 2)} N으로 당기고, 용수철이 ${fx(r.T, 2)} N으로 붙잡아요. 힘이 비겨서 가만히 매달려 있어요.`;
  }
  const v = Math.abs(S.trk.v);
  if (F.mode === 'bump') { const boss = KID.missions[KID.i]?.boss; return E ? (boss ? 'It slid to the end! Change the floor or loads.' : 'It reached the end! Press the ↺ button.') : (boss ? '끝까지 미끄러졌어요! 바닥이나 짐을 바꿔 봐요.' : '끝까지 갔어요! ↺ 버튼을 눌러요.'); }
  if (v === 0) {
    if (F.mode === 'rest') return E ? 'Nobody is pulling, so the block stays still.' : '아무도 안 당겨서 도막이 가만히 있어요.';
    if (F.mode === 'balance') return E ? `A tie: both sides pull ${fx(S.F1.tgt, 1)} N, so it doesn’t move.` : `무승부! 양쪽이 ${fx(S.F1.tgt, 1)} N씩 당겨서 안 움직여요.`;
    return E ? `It’s pulled with ${fx(Math.abs(F.Fa), 1)} N, but the floor grips back just as hard, so it stays.` : `${fx(Math.abs(F.Fa), 1)} N으로 당기는데 바닥이 똑같이 붙잡아서 안 움직여요.`;
  }
  const along = F.a * Math.sign(S.trk.v);
  if (along > 0.02) return E ? `The pull wins, so the block goes faster and faster! (${fx(v, 2)} m/s)` : `당기는 힘이 이겨서 도막이 점점 빨라져요! (${fx(v, 2)} m/s)`;
  if (along < -0.02) return E ? `The forces push back against the motion, so it slows down. (${fx(v, 2)} m/s)` : `움직이는 반대쪽으로 힘이 작용해서 점점 느려져요. (${fx(v, 2)} m/s)`;
  return E ? `Pull and grip are equal, so it slides at a steady ${fx(v, 2)} m/s.` : `당기는 힘과 붙잡는 힘이 같아서 같은 빠르기로 미끄러져요.`;
}

// 손 힌트 위치 (세계 좌표 → 매 프레임 새로 계산)
const KID_AT = {
  F1: () => HERO.ts[0].cart.getWorldPosition(new THREE.Vector3()),
  F2: () => HERO.ts[1].cart.getWorldPosition(new THREE.Vector3()),
  jack: () => HERO.beaker.getWorldPosition(new THREE.Vector3()).add(V3(0.0, PC.beaker.height * 0.5, 0.08)),
  obj: () => LOOK.obj().clone(),
  surface: () => V3(blockX(S.trk.x) - 0.32, TRK_Y + 0.004, TRK.z + 0.04),
  block: () => V3(blockX(S.trk.x), TRK_Y + PC.block.h * 0.6, TRK.z),
};
function handAt(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.font = '34px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'top'; c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 8; c.fillText('👆', 4, -4); c.restore(); }
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
  document.getElementById('modeBtn').textContent = m === 'kid' ? KT('full') : KT('easy');
  if (m === 'kid') { lessonEnd(); UI.modal(null); if (KID.i < 0) KID.go(0); else { KID.render(); const q = KID.missions[KID.i]; if (q) flyTo(stationShot(q.shot), 1.6); } }
  else { KID_INTRO(false); S.speed = 1; flyTo(heroShot(), 1.6); }
  UI.sheet && UI.sheet();
}
function KID_INTRO(on) {
  const el = document.getElementById('kidIntro'); if (!el) return;
  el.classList.toggle('on', on); document.body.classList.toggle('kbars', on);
  if (on) {
    setCinematic(true);
    const t = KT('intro');
    const tiles = [['eye', L2('힘이 화살표로 보여요', 'Forces show as arrows')], ['ruler', L2('길수록 센 힘', 'Longer = stronger')], ['tap', L2('예상하고 직접 조작', 'Guess, then try')], ['award', L2('별과 힘 카드', 'Stars & cards')]];
    el.querySelector('.box').innerHTML = `<div class="kav lg">${quokka('win')}</div><div class="keye">${L2('힘의 작용 · 과학 실험실', 'Forces · Science lab')}</div><h2>${t[0]}</h2><div class="kitiles">${tiles.map(([ic, tx]) => `<div class="kitile"><span>${ico(ic)}</span><b>${tx}</b></div>`).join('')}</div><button class="kilisten">${ico('speaker')}<span>${L2('설명 듣기', 'Listen')}</span></button>
      <div class="kimap">${KID.missions.map((m) => `<i class="${m.boss ? 'boss' : ''}"></i>`).join('')}</div>
      <div class="kistart"><button class="kbtn main kstart">${t[5]}</button><button class="kbtn kfreego">${L2('자유 실험실', 'Free lab')}</button></div><button class="kfull">${KT('full')}</button>`;
    el.querySelector('.kstart').onclick = () => { ensureAudio(); if (VOICE.on) setSound(true); VOICE.key = ''; KID_INTRO(false); KID.go(0); };
    el.querySelector('.kfull').onclick = () => { KID_INTRO(false); setMode('full'); };
    el.querySelector('.kfreego').onclick = () => { ensureAudio(); if (VOICE.on) setSound(true); KID_INTRO(false); if (KID.i < 0) KID.i = 0; KID.setFree(true); };
    el.querySelector('.kilisten').onclick = () => speak(t.slice(1, 5).map((q) => q[1]).join(' '), true);
  }
}
function initKid() {
  document.body.appendChild(document.getElementById('kid'));
  document.getElementById('kidSub').innerHTML = KT('sub');
  document.getElementById('modeBtn').onclick = () => setMode(S.mode === 'kid' ? 'full' : 'kid');
  let m = QS.get('mode');
  if (!m) { try { m = localStorage.getItem('forces-mode'); } catch {} }
  if (QS.has('lesson')) m = 'full';
  S.mode = m === 'full' ? 'full' : 'kid';
  document.body.classList.toggle('kid', S.mode === 'kid');
  document.getElementById('modeBtn').textContent = S.mode === 'kid' ? KT('full') : KT('easy');
  themeMode(S.mode === 'kid'); controls.enableRotate = controls.enablePan = S.mode !== 'kid';
  KID.hud(); KID.legend();
  if (S.mode === 'kid') { KID_INTRO(!QS.has('nointro')); if (QS.has('nointro')) KID.go(0); }
}
