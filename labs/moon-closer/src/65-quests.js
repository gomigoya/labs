// One flow state, eight data rows. Indices in the debug API are zero based.
const Q = { i: 0, phase: 'intro', pick: null, stars: Array(8).fill(0), completed: new Set(), free: false, flags: {} };
// Solve display targets through the authoritative model instead of copying its law.
function closerForRatio(target) {
  let low = 0, high = PHYS.C.closerMax;
  for (let i = 0; i < 52; i++) { const mid = (low + high) / 2; if (PHYS.ratio(mid) < target) low = mid; else high = mid; }
  return (low + high) / 2;
}
const QUESTS = [
  { id: 1, icon: 'moon', startState: { closer: 0 }, candidates: [{ key: 'flood', closer: PHYS.DETENTS[0].closer }, { key: 'little', closer: closerForRatio(2) }, { key: 'same', closer: 0.1 }], answerKey: 'same', layers: ['marks'], goalMarks: [0.1], fields: ['closer', 'lensOpen'], judge: s => PHYS.judgeQ1(s), events: s => s.lensOpen },
  { id: 2, icon: 'rail', startState: { closer: 0 }, candidates: [{ key: 'km', closer: 1e3 }, { key: 'thousand', closer: 1e6 }, { key: 'hundred-thousand', closer: 1e8 }], answerKey: 'hundred-thousand', layers: ['marks'], goalMarks: PHYS.RAIL_NOTCHES.map(n => n.closer), fields: ['visited', 'closer'], judge: s => PHYS.judgeQ2(s), events: s => s.visited.size >= 6 && PHYS.ratio(s.closer) >= 1.25 },
  { id: 3, icon: 'half', startState: { closer: 0 }, candidates: [2, 4, 8].map(n => ({ key: String(n), closer: closerForRatio(n) })), answerKey: '8', layers: ['marks'], goalMarks: [PHYS.DETENTS[0].closer], fields: ['closer'], judge: s => PHYS.judgeQ3(s), events: s => PHYS.judgeQ3(s) },
  { id: 4, icon: 'wave', startState: { closer: PHYS.DETENTS[0].closer }, candidates: ['near', 'far', 'both'].map(key => ({ key, closer: PHYS.DETENTS[0].closer })), answerKey: 'both', layers: ['field'], goalMarks: [], fields: ['peaks'], judge: s => PHYS.judgeQ4(s), events: s => s.peaks >= 2 },
  { id: 5, icon: 'pin', startState: { closer: 0 }, candidates: ['float', 'lighter', 'same'].map((key, i) => ({ key, closer: PHYS.DETENTS[3].closer, weightRatio: [0, 0.5, PHYS.personWeightRatio(PHYS.DETENTS[3].closer)][i] })), answerKey: 'same', layers: ['marks'], goalMarks: [PHYS.DETENTS[3].closer], fields: ['closer', 'personSeen', 'oceanSeen'], judge: s => PHYS.judgeQ5(s), events: s => PHYS.judgeQ5(s) },
  { id: 6, icon: 'sky', startState: { closer: 0 }, candidates: ['size', 'speed', 'both'].map(key => ({ key, closer: PHYS.DETENTS[3].closer })), answerKey: 'both', layers: [], goalMarks: [PHYS.DETENTS[3].closer], fields: ['closer', 'skyOpen'], judge: s => PHYS.judgeQ6(s), events: s => PHYS.judgeQ6(s) },
  { id: 7, icon: 'ring', startState: { closer: PHYS.DETENTS[3].closer }, candidates: [{ key: 'whole', closer: 0 }, { key: 'crack', closer: PHYS.C.d0 - (PHYS.roche().fluid + PHYS.roche().rigid) / 2 }, { key: 'ring', closer: PHYS.C.closerMax }], answerKey: 'ring', layers: ['limit'], goalMarks: [PHYS.C.d0 - PHYS.roche().rigid], fields: ['closer'], judge: s => PHYS.judgeQ7(s), events: s => PHYS.fractureState(s.closer).state === 'ring' },
  { id: 8, icon: 'wall', startState: { closer: 0 }, candidates: [1 / 2, 1 / 3, 1 / 4].map(frac => ({ key: String(frac), closer: PHYS.C.d0 * (1 - frac) })), answerKey: '0.5', layers: ['marks'], goalMarks: [], fields: ['wall', 'closer'], judge: s => PHYS.judgeQ8(s), events: s => PHYS.judgeQ8(s) }
].map(d => ({ ...d, card: s => CARDS.principle(d.id, s) }));
const QUEST = {
  get i() { return Q.i; }, get passed() { return Q.completed.has(Q.i); },
  state() { return { ...Q, stars: [...Q.stars], completed: [...Q.completed], flags: { ...Q.flags, visited: [...Q.flags.visited || []] } }; },
  sample() { return { closer: closerAt(S.u.value), lensOpen: !!Q.flags.lensOpen, visited: Q.flags.visited, peaks: Q.flags.peaks,
    personSeen: !!Q.flags.personSeen, oceanSeen: !!Q.flags.oceanSeen, skyOpen: GRAMMAR.enabled.sky, wall: Q.flags.wall, lon0: S.lon0.value, t: S.t.value }; },
  phase(phase) { if (!['intro', 'predict', 'act', 'observe', 'confirm', 'card'].includes(phase)) throw new RangeError('phase'); Q.phase = phase; Q.flags.elapsed = 0; questUI(); },
  go(i) {
    if (!Number.isInteger(i) || i < 0 || i >= QUESTS.length) throw new RangeError('quest');
    // Restoration happens only at a quest boundary, never on success.
    Q.i = i; Q.free = false; Q.pick = null;
    Q.flags = { elapsed: 0, idle: 0, demos: 0, visited: new Set(), peaks: 0, prevT: 0, theta: 0, hold: 0, wall: 8 };
    set('closer', QUESTS[i].startState.closer); S.u.value = S.u.target;
    S.t.value = S.t.target = 0; S.playing.value = S.playing.target = 0;
    for (const name of Object.keys(GRAMMAR.enabled)) GRAMMAR.set({ [name]: QUESTS[i].layers.includes(name) });
    document.body.classList.remove('q-event'); DIRECTOR.clear(); this.phase('intro'); DIRECTOR.intro(); syncUI();
  },
  pick(k) { if (Q.phase !== 'predict' || Q.free) return; const c = QUESTS[Q.i].candidates[k]; if (!c) throw new RangeError('pick'); Q.pick = c.key; this.phase('act'); Q.flags.idle = 0; Q.flags.demos = 1; Q.flags.demoLeft = 2.2; },
  mode(free) { Q.free = !!free; DIRECTOR.clear(); if (free) { for (const name of ['marks', 'field', 'limit']) GRAMMAR.set({ [name]: true }); } questUI(); },
  touch() { Q.flags.idle = 0; },
  allows() { if (Q.free) return true; if (['intro', 'predict', 'observe'].includes(Q.phase)) { document.getElementById('q-pictures').animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 220 }); return false; } return true; },
  open(name) {
    if (!this.allows()) return;
    if (name === 'micro') Q.flags.lensOpen = true;
    else if (name === 'person' || name === 'sky' || name === 'lens') { GRAMMAR.set({ [name]: !GRAMMAR.enabled[name] }); if (name === 'sky' && GRAMMAR.enabled.sky) flyTo(S.vertical ? SHOTS_VERTICAL[2] : SHOTS[5], 1.8); }
    else if (name === 'personSeen' || name === 'oceanSeen') { GRAMMAR.set({ person: true }); Q.flags[name] = true; }
    this.touch(); questUI();
  },
  skip(phase) { this.phase(phase === 'event' ? 'observe' : phase); if (Q.phase === 'observe') DIRECTOR.event(this.sample()); },
  update(dt) {
    const f = Q.flags; f.elapsed += dt; f.idle += dt;
    if (Q.free) return;
    if (Q.phase === 'intro') { if (f.elapsed >= 0.9 && !f.pushed) { f.pushed = true; DIRECTOR.push(); } if (f.elapsed >= 2.7) this.phase('predict'); return; }
    if (Q.phase === 'act') {
      f.demoLeft = Math.max(0, f.demoLeft - dt);
      if (S.drag) { this.touch(); f.demoLeft = 0; }
      if (f.idle >= 7 && f.demos < 2) { f.demos++; f.idle = 0; f.demoLeft = 2.2; }
      const s = this.sample();
      if (Q.i === 0 && Math.abs(S.u.value) < 1e-8 && S.u.target === 0) f.lensOpen = true;
      if (Q.i === 1) PHYS.RAIL_NOTCHES.forEach((n, i) => { if (Math.abs(S.u.value - n.x) < 0.006) f.visited.add(i); });
      if (Q.i === 2 && !f.bonus && Math.abs(PHYS.frac(s.closer) - 1 / 3) < 0.008) { f.bonus = { ...s }; questUI(); }
      if (Q.i === 3) {
        const delta = ((S.t.value - f.prevT + 129600) % 86400) - 43200; f.prevT = S.t.value;
        if (S.drag?.type === 'pin' || !GRAMMAR.enabled.lens) { f.peaks = 0; f.theta = S.lon0.value; }
        else if (delta > 0) { const next = f.theta + PHYS.relRate(s.closer) * delta; f.peaks += Math.max(0, PHYS.peaksCrossed(f.theta, next)); f.theta = next; }
      }
      const actual = this.sample(), valid = QUESTS[Q.i].judge(actual);
      if (Q.i !== 6 && PHYS.fractureState(actual.closer).state === 'ring') { f.hold = 0; return; }
      if (Q.i === 7) {
        const stationary = !S.drag && Math.abs(S.u.target - S.u.value) < 1e-7;
        f.hold = valid && stationary ? f.hold + dt : 0;
      }
      if (valid && (Q.i !== 7 || f.hold >= 1.5)) {
        f.success = Object.freeze({ ...actual, visited: [...actual.visited] });
        if (QUESTS[Q.i].events(actual)) DIRECTOR.event(actual);
        this.phase('observe');
      }
    } else if (Q.phase === 'observe' && f.elapsed >= 0.8) {
      Q.completed.add(Q.i); Q.stars[Q.i] = Q.pick === QUESTS[Q.i].answerKey || Q.pick === null ? 3 : 2;
      this.phase('confirm'); if (Q.stars[Q.i] === 3) DIRECTOR.chord();
    } else if (Q.phase === 'confirm' && f.elapsed >= 0.6) this.phase('card');
    else if (Q.phase === 'card' && f.elapsed >= 6.1 && Q.i < 7) this.go(Q.i + 1);
  },
  auto(i) {
    this.go(i); step(90, 1 / 30); this.pick(QUESTS[i].candidates.findIndex(c => c.key === QUESTS[i].answerKey));
    const move = closer => { set('closer', closer); step(100, 1 / 30); };
    if (i === 0) move(0.1);
    if (i === 1) for (const n of PHYS.RAIL_NOTCHES) move(n.closer);
    if (i === 2) move(PHYS.DETENTS[0].closer);
    if (i === 3) { this.open('lens'); for (let h = 1; h <= 28 && Q.phase === 'act'; h++) { set('t', h * 3600); step(60, 1 / 30); } }
    if (i === 4) { move(PHYS.DETENTS[3].closer); this.open('personSeen'); this.open('oceanSeen'); }
    if (i === 5) { this.open('sky'); move(PHYS.DETENTS[3].closer); }
    if (i === 6) move(PHYS.C.closerMax);
    if (i === 7) { Q.flags.wall = 8; move(PHYS.DETENTS[0].closer); }
    for (let n = 0; n < 3 && Q.phase !== 'card'; n++) step(100, 1 / 30);
    return { i, passed: this.passed, phase: Q.phase, judge: QUESTS[i].judge(this.sample()), stars: Q.stars[i] };
  }
};
