// Portable kiosk controller: only TEACHER_CFG knows the apparatus.
const A = { active: false, t: 0, stage: 0 };
const ATTRACT_LABELS = {
  recover: { ko: '처음부터 다시 시작', en: 'Restart from the beginning' },
  start: { ko: '만져서 시작', en: 'Touch to start' }
};
const recovery = document.createElement('button'); recovery.id = 'kiosk-recover'; recovery.hidden = true;
recovery.setAttribute('aria-label', ATTRACT_LABELS.recover[TEACHER_CFG.language]); recovery.innerHTML = TEACHER_CFG.icon('reset'); document.body.append(recovery);
const touchPulse = document.createElement('div'); touchPulse.id = 'touch-pulse'; touchPulse.hidden = true;
touchPulse.setAttribute('aria-hidden', 'true'); touchPulse.innerHTML = TEACHER_CFG.icon('hand'); document.body.append(touchPulse);
const attractStart = document.createElement('button'); attractStart.id = 'attract-start'; attractStart.hidden = true;
attractStart.setAttribute('aria-label', ATTRACT_LABELS.start[TEACHER_CFG.language]); attractStart.innerHTML = TEACHER_CFG.icon('hand'); document.body.append(attractStart);
let lastInput = performance.now(), stalledFrames = 0, pulseUntil = 0;
const idleOption = Number(new URLSearchParams(location.search).get('idle'));
const idleSeconds = Number.isFinite(idleOption) && idleOption > 0 ? idleOption : TEACHER_CFG.idleSeconds;
const ATTRACT = {
  state: A,
  start(stage = 0) {
    if (!Number.isInteger(stage) || !TEACHER_CFG.attract[stage]) throw new RangeError('stage');
    if (T.mode === 'teacher') return;
    A.active = true; A.t = 0; A.stage = stage;
    document.body.classList.add('attract'); attractStart.hidden = false;
    TEACHER_CFG.questMode(true); TEACHER_CFG.play(true); TEACHER_CFG.ui(false); this.stage();
  },
  stage() {
    const row = TEACHER_CFG.attract[A.stage];
    TEACHER.layers(row.layers); TEACHER_CFG.fly(TEACHER_CFG.shotForStage(row), Math.min(3, row.seconds / 2));
  },
  wake(pulse = true) {
    A.active = false; A.t = 0; A.stage = 0;
    document.body.classList.remove('attract'); attractStart.hidden = true; recovery.hidden = true;
    stalledFrames = 0; lastInput = performance.now();
    TEACHER.reset(); TEACHER.mode('student'); TEACHER_CFG.startStudent();
    if (pulse) { pulseUntil = performance.now() + 800; touchPulse.hidden = false; touchPulse.style.animation = 'none'; void touchPulse.offsetWidth; touchPulse.style.animation = ''; }
  },
  fail() {
    A.active = false; recovery.hidden = false; attractStart.hidden = true;
    document.body.classList.remove('attract'); TEACHER_CFG.play(false);
  },
  health(ms) { stalledFrames = ms > 1000 ? stalledFrames + 1 : 0; if (stalledFrames >= 5) this.fail(); },
  update(dt) {
    if (!touchPulse.hidden && performance.now() >= pulseUntil) touchPulse.hidden = true;
    if (!recovery.hidden) return;
    if (!A.active) {
      if (T.mode !== 'teacher' && !TEACHER_CFG.cardBusy() && performance.now() - lastInput >= idleSeconds * 1000) this.start();
      return;
    }
    const row = TEACHER_CFG.attract[A.stage], before = A.t; A.t = Math.min(row.seconds, A.t + dt);
    const ease = t => { const x = t / row.seconds; return x * x * (3 - 2 * x); };
    const mix = (ease(A.t) - ease(before)) / Math.max(1e-9, 1 - ease(before));
    TEACHER_CFG.setCloser(TEACHER_CFG.getCloser() + (row.closer - TEACHER_CFG.getCloser()) * mix, true);
    if (A.t >= row.seconds) {
      TEACHER_CFG.setCloser(row.closer, true); A.stage = (A.stage + 1) % TEACHER_CFG.attract.length; A.t = 0; this.stage();
    }
  }
};
recovery.onclick = () => ATTRACT.wake(); attractStart.onclick = () => ATTRACT.wake();
for (const name of ['pointerdown', 'pointermove', 'touchstart', 'keydown', 'wheel']) window.addEventListener(name, event => {
  lastInput = performance.now();
  if (!A.active || name === 'pointermove') return;
  event.preventDefault(); event.stopImmediatePropagation(); ATTRACT.wake();
}, { capture: true, passive: false });
window.onerror = () => { ATTRACT.fail(); return false; };
window.addEventListener('unhandledrejection', () => ATTRACT.fail());
window.addEventListener('click', event => {
  if (event.isTrusted && performance.now() < pulseUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
}, { capture: true });
document.addEventListener('visibilitychange', () => { lastInput = performance.now(); stalledFrames = 0; TEACHER_CFG.visibilityReset(); });
Object.assign(window.__lab, { attract: ATTRACT });
boot();
