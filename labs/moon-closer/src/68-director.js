// Camera, sound, explanations and HUD consume Q; they never decide success.
Object.assign(ICONS, {
  hand: 'M8 12V4a2 2 0 0 1 4 0v7-4a2 2 0 0 1 4 0v4-2a2 2 0 0 1 4 0v6q0 7-7 7-4 0-7-5l-3-4q-1-3 2-2l3 2',
  check: 'M4 12l5 5L21 5', next: 'M5 12h14m-6-6 6 6-6 6',
  star: 'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  free: 'M3 5h18v14H3zM8 8v8m8-8v8M5 12h6m2 0h6',
  person: 'M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6M12 9v8m-7-5h14m-7 5-5 6m5-6 5 6'
});
Object.assign(LABELS, {
  quest: { ko: '퀘스트', en: 'Quests' }, free: { ko: '자유 실험', en: 'Free exploration' },
  pick: { ko: '예상 그림', en: 'Prediction' }, next: { ko: '다음', en: 'Next' }, replay: { ko: '다시 비교', en: 'Replay comparison' },
  micro: { ko: '물 분자 크기 돋보기', en: 'Molecular scale magnifier' }, person: { ko: '사람 비교 열기', en: 'Open person comparison' },
  sky: { ko: '하늘 창 열기', en: 'Open sky window' }, personSeen: { ko: '사람 줄 보기', en: 'Inspect person row' },
  oceanSeen: { ko: '바다 줄 보기', en: 'Inspect ocean row' }, wall: { ko: '방파제 높이', en: 'Breakwater height' }
});
const qPictures = document.createElement('div'); qPictures.id = 'q-pictures'; document.body.append(qPictures);
const qOverlay = document.createElement('div'); qOverlay.id = 'q-overlay'; qOverlay.setAttribute('aria-hidden', 'true'); document.body.append(qOverlay);
const qExtra = document.createElement('div'); qExtra.id = 'q-extra'; qExtra.className = 'hud'; document.body.append(qExtra);
const questLight = new THREE.PointLight(THEME.cool, 0, 0.7, 2); scene.add(questLight);
function qButton(label, symbol, fn, parent, suffix = '') {
  const b = document.createElement('button'); b.setAttribute('aria-label', LABELS[label][LANG] + suffix); b.innerHTML = icon(symbol); b.onclick = fn; parent.append(b); return b;
}
function questUI() {
  // 80-teacher is shared infrastructure outside this pass's editable files.
  // Both consecutive sky stages use the window shot: baseline -> half -> tenth.
  Object.assign(TEACHER_CFG.attract[1], { shot: 5, layers: ['sky', 'reference', 'ocean'] });
  Object.assign(TEACHER_CFG.attract[2], { shot: 5, layers: ['sky', 'reference', 'ocean'] });
  const d = QUESTS[Q.i], f = Q.flags, top = document.getElementById('quests');
  top.removeAttribute('aria-hidden'); top.replaceChildren();
  qButton('quest', 'moon', () => TEACHER.mode('student'), top).setAttribute('aria-pressed', String(T.mode === 'student'));
  qButton('free', 'free', () => TEACHER.mode('free'), top).setAttribute('aria-pressed', String(T.mode === 'free'));
  qButton('teacher', 'teacher', () => TEACHER.mode('teacher'), top).setAttribute('aria-pressed', String(T.mode === 'teacher'));
  if (T.mode !== 'teacher')
  QUESTS.forEach((row, i) => {
    const b = qButton('quest', row.icon, () => { if (i === 0 || Q.completed.has(i - 1) || Q.completed.has(i)) QUEST.go(i); }, top, ` ${i + 1}`);
    b.className = `quest ${i === Q.i ? 'current' : ''} ${Q.completed.has(i) ? 'complete' : ''}`;
    b.setAttribute('aria-disabled', String(i > 0 && !Q.completed.has(i - 1) && !Q.completed.has(i)));
    b.innerHTML += `<span class="q-dots">${'<i></i>'.repeat(Q.stars[i] || (i === Q.i ? ['intro', 'predict', 'act', 'observe', 'confirm', 'card'].indexOf(Q.phase) + 1 : 1))}</span>`;
  });
  qPictures.replaceChildren(); qExtra.replaceChildren();
  qPictures.className = Q.phase; qPictures.hidden = Q.free;
  if (!Q.free && Q.phase === 'predict') d.candidates.forEach((c, k) => { const b = qButton('pick', 'moon', () => QUEST.pick(k), qPictures, ` ${k + 1}`); b.dataset.candidate = k; });
  if (!Q.free && ['act', 'observe'].includes(Q.phase)) qPictures.innerHTML = `<div class="q-picked">${CARDS.picture(d.id, d.candidates.find(c => c.key === Q.pick) || d.candidates[0])}</div>`;
  if (!Q.free && Q.phase === 'confirm') {
    const chosen = d.candidates.find(c => c.key === Q.pick) || d.candidates[0];
    qPictures.innerHTML = `<div class="q-compare ${Q.stars[Q.i] === 3 ? 'matched' : ''}">${CARDS.picture(d.id, chosen)}${CARDS.actual(d.id, f.success || QUEST.sample())}${Q.stars[Q.i] === 3 ? icon('check') : ''}</div>`;
    if (Q.stars[Q.i] === 2) qButton('replay', 'reset', () => QUEST.skip('observe'), qPictures);
  }
  if (!Q.free && Q.phase === 'card') {
    qPictures.innerHTML = `<div class="q-principle">${d.card(f.success || QUEST.sample())}<span class="q-stars">${icon('star').repeat(Q.stars[Q.i])}</span></div>`;
    if (Q.i < 7) qButton('next', 'next', () => QUEST.go(Q.i + 1), qPictures);
    else qButton('free', 'free', () => QUEST.mode(true), qPictures);
  }
  if (f.bonus && !Q.free && ['act', 'card'].includes(Q.phase)) qButton('pick', 'half', () => { qPictures.innerHTML = `<div class="q-principle">${d.card(f.bonus)}</div>`; }, qExtra);
  for (const [name, symbol] of [['micro', 'lens'], ['lens', 'lens'], ['person', 'person'], ['sky', 'sky']]) {
    const active = Q.free || (name === 'micro' ? Q.i === 0 : name === 'lens' ? Q.i === 3 : name === 'person' ? Q.i === 4 : Q.i === 5);
    const b = qButton(name, symbol, () => QUEST.open(name), qExtra); b.classList.toggle('sub', !active);
  }
  for (const [name, symbol] of [['personSeen', 'person'], ['oceanSeen', 'wave']]) if (Q.free || Q.i === 4) qButton(name, symbol, () => QUEST.open(name), qExtra).setAttribute('aria-pressed', String(!!f[name]));
  if (Q.free || Q.i === 7) for (const wall of [2, 8, 27]) {
    const b = qButton('wall', 'wall', () => { if (!QUEST.allows()) return; f.wall = wall; f.hold = 0; questUI(); }, qExtra, ` ${wall}`);
    b.innerHTML = CARDS.svg(CARDS.bar(135, wall, 3)); b.setAttribute('aria-pressed', String(f.wall === wall));
  }
  qButton('reset', 'reset', () => { set('closer', 0); S.u.value = S.u.target; f.hold = 0; }, qExtra).className = 'q-restore';
  document.body.dataset.qphase = Q.free ? 'free' : Q.phase;
  document.getElementById('person-card').style.pointerEvents = 'auto';
}
document.getElementById('person-card').addEventListener('pointerdown', e => {
  if (Q.i !== 4 || Q.phase !== 'act') return;
  const r = e.currentTarget.getBoundingClientRect(); QUEST.open(e.clientY < r.top + r.height / 2 ? 'personSeen' : 'oceanSeen');
});
const DIRECTOR = {
  clock: 0, eventLeft: 0, snapshot: null, tone: null, previewAt: -1,
  clear() { this.eventLeft = 0; this.snapshot = null; document.body.classList.remove('q-event', 'q-bars'); },
  intro() { document.body.classList.add('q-bars'); shot(S.vertical ? SHOTS_VERTICAL[0] : SHOTS[0], S.vertical); },
  push() {
    document.body.classList.remove('q-bars');
    const from = camera.position.clone(), fromTarget = controls.target.clone(), fromFov = camera.fov;
    shot(S.vertical ? 0 : 1, S.vertical); camera.clearViewOffset();
    const top = S.vertical ? 160 : 110, bottom = innerHeight - (S.vertical ? 315 : 335), available = Math.max(170, bottom - top);
    const box = heroBox(true), target = box.getCenter(V3()); controls.target.copy(target); camera.lookAt(target); camera.updateMatrixWorld();
    for (let i = 0; i < 12; i++) { const b = projectedBox(box); if (b.bottom - b.top < available && b.right - b.left < innerWidth * .87) break; camera.position.sub(target).multiplyScalar(1.08).add(target); camera.lookAt(target); camera.updateMatrixWorld(); }
    const to = { pos: camera.position.clone(), target: target.clone(), fov: camera.fov };
    camera.position.copy(from); controls.target.copy(fromTarget); camera.fov = fromFov; flyTo(to, 1.8);
  },
  event(s) { this.eventLeft = 1.4; this.snapshot = { ...s }; document.body.classList.add('q-event'); this.sound([220, 330], 0.45); },
  time(dt) { return dt * (this.eventLeft > 0 ? 0.18 : 1) * (T.slow ? 0.25 : 1); },
  sound(notes, duration = 0.35) {
    if (!S.sound.target) return;
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    void audioContext.resume(); const now = audioContext.currentTime;
    notes.forEach(freq => { const o = audioContext.createOscillator(), g = audioContext.createGain(); o.frequency.value = freq; g.gain.setValueAtTime(0.025 / notes.length, now); g.gain.exponentialRampToValueAtTime(0.0001, now + duration); o.connect(g).connect(audioContext.destination); o.start(); o.stop(now + duration); });
  },
  chord() { this.sound([523.25, 659.25, 783.99], 0.7); },
  update(dt) {
    this.clock += dt; this.eventLeft = Math.max(0, this.eventLeft - dt); document.body.classList.toggle('q-event', this.eventLeft > 0);
    if (S.drag && S.sound.target) {
      if (!this.tone) { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); const o = audioContext.createOscillator(), g = audioContext.createGain(); g.gain.value = 0.012; o.connect(g).connect(audioContext.destination); o.start(); this.tone = { o, g }; }
      this.tone.o.frequency.setTargetAtTime(140 + Math.log2(PHYS.ratio(closerAt(S.u.value))) * 35, audioContext.currentTime, 0.05);
    } else if (this.tone) { this.tone.o.stop(); this.tone = null; }
    if (Math.floor(this.clock * 12) !== this.previewAt) {
      this.previewAt = Math.floor(this.clock * 12);
      qPictures.querySelectorAll('[data-candidate]').forEach(b => { const d = QUESTS[Q.i]; b.innerHTML = CARDS.picture(d.id, d.candidates[+b.dataset.candidate], this.clock); });
    }
    const project = p => { const v = p.clone().project(camera); return [(v.x + 1) * innerWidth / 2, (1 - v.y) * innerHeight / 2]; };
    const line = (d, color = '#ffce8b', dash = false) => `<path stroke="${color}" ${dash ? 'stroke-dasharray="6 6"' : ''} d="${d}"/>`;
    let body = '';
    const d = QUESTS[Q.i], f = Q.flags, actual = QUEST.sample();
    const focus = Q.i === 3 ? DIAL.knob.getWorldPosition(V3()) : MOON_CARRIAGE.position.clone().setY(E.y);
    questLight.position.copy(focus).add(V3(0, .10, .12)); questLight.intensity = Q.free ? 0 : 0.32;
    if (!Q.free && f.pushed && !S.drag && !GRAMMAR.enabled.sky && Q.phase !== 'intro') {
      camera.clearViewOffset(); camera.updateMatrixWorld(); const b = projectedBox(heroBox(true));
      const offset = ((S.vertical ? 160 : 110) + innerHeight - (S.vertical ? 315 : 335) - b.top - b.bottom) / 2;
      camera.setViewOffset(innerWidth, innerHeight, 0, -offset, innerWidth, innerHeight);
    }
    if (!Q.free && Q.phase === 'intro' && f.elapsed < 0.9) body = `<g transform="translate(${innerWidth / 2 - 42} ${innerHeight / 2 - 42}) scale(3.5)"><defs><clipPath id="q-wipe"><rect width="${Math.min(24, f.elapsed / .65 * 24)}" height="24"/></clipPath></defs><g clip-path="url(#q-wipe)">${icon(d.icon).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`;
    if ((Q.free || ['act', 'observe', 'confirm', 'card'].includes(Q.phase))) {
      if (f.lensOpen && (Q.free || Q.i === 0)) body += `<svg x="${innerWidth / 2 - 150}" y="${S.vertical ? 170 : 135}" width="300" height="140">${CARDS.micro().replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>`;
      const goals = Q.i === 7 ? [closerForRatio(f.wall)] : d.goalMarks;
      if (!Q.free && Q.phase === 'act') for (const closer of goals) {
        const [x, y] = project(V3(railAt(PHYS.railX(closer)), railY, 0.07));
        body += line(`M${x} ${y + 9}v-47h17l-5 7 5 7h-17`, '#ffce8b', true) + `<circle cx="${x}" cy="${y - 42}" r="9" stroke-dasharray="3 3"/>`;
      }
      if (Q.i === 1) for (const i of f.visited) { const [x, y] = project(V3(railAt(PHYS.RAIL_NOTCHES[i].x), railY, 0.08)); body += line(`M${x} ${y}v-${PHYS.ratio(PHYS.RAIL_NOTCHES[i].closer) * 14}`, '#64ead0'); }
      if (Q.i === 7 || Q.free) {
        const wallCloser = closerForRatio(f.wall);
        const [x, y] = project(E.clone().add(V3(RV * (1 + PHYS.oceanBulge(wallCloser).bulge), 0, 0.08))), [mx, my] = project(GRAMMAR.groups.marks.position);
        const red = PHYS.ratio(actual.closer) > f.wall, col = red ? '#ff695e' : '#fff';
        body += line(`M${x} ${y - 24}v48M${mx - 18} ${my - f.wall * 5}h38`, col, true);
        if (red) { const [tx, ty] = project(E.clone().add(V3(RV * (1 + PHYS.oceanBulge(actual.closer).bulge), 0, .08))); body += `<circle cx="${tx}" cy="${ty}" r="10" fill="#ff695e" opacity="${.3 + .5 * Math.abs(Math.sin(this.clock * 9))}"/>`; }
        if (f.hold > 0) body += `<circle cx="${x}" cy="${y - 60}" r="12" stroke="#64ead0" stroke-dasharray="${Math.min(1, f.hold / 1.5) * 75} 75"/>`;
      }
      if (!Q.free && Q.phase === 'act' && f.demoLeft > 0 && !S.drag) {
        const target = Q.i === 3 ? DIAL.knob.getWorldPosition(V3()) : MOON_CARRIAGE.position.clone().setY(E.y), [x, y] = project(target), shift = Math.min(1, (2.2 - f.demoLeft) / 1.7) * -70;
        body += line(`M${x} ${y}h-70m8-6-8 6 8 6`, '#ffce8b', true) + `<g transform="translate(${x + shift - 12} ${y + 6})">${icon('hand').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`;
      }
      if (Q.i === 3 && f.peaks > 0) { const [x, y] = project(GRAPHS[0].mesh.position); body += Array.from({ length: Math.min(4, f.peaks) }, (_, i) => `<circle cx="${x - 20 + i * 14}" cy="${y - 20}" r="4" fill="#64ead0"/>`).join(''); }
      if (PHYS.fractureState(actual.closer).state === 'ring') { qExtra.dataset.ring = 'true'; } else delete qExtra.dataset.ring;
    }
    if (this.eventLeft > 0) {
      const [x, y] = project(E), age = 1.4 - this.eventLeft, width = Math.min(1, age / 0.45) * 90;
      body = `<circle cx="${x}" cy="${y}" r="5" fill="#64ead0"/>` + line(`M${x} ${y}l${width} -65`, '#64ead0') + (age > 0.45 ? `<svg x="${Math.min(innerWidth - 200, x + 80)}" y="${Math.max(140, y - 140)}" width="190" height="100">${d.card(this.snapshot).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>` : '');
    }
    qOverlay.innerHTML = `<svg viewBox="0 0 ${innerWidth} ${innerHeight}">${body}</svg>`;
  }
};
