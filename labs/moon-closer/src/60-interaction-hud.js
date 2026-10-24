const LABELS = {
  canvas: { ko: '달과 지구 모형 실험실', en: 'Moon and Earth model laboratory' },
  play: { ko: '재생 또는 일시정지', en: 'Play or pause' }, minus: { ko: '느리게', en: 'Slower' }, plus: { ko: '빠르게', en: 'Faster' },
  reset: { ko: '처음 상태', en: 'Reset' }, lens: { ko: '돋보기 상태', en: 'Magnifier state' }, sound: { ko: '소리 켜기 또는 끄기', en: 'Toggle sound' }
};
const ICONS = {
  play: 'M8 5l11 7-11 7z', pause: 'M8 5v14M16 5v14', minus: 'M6 12h12', plus: 'M6 12h12M12 6v12',
  reset: 'M4 10a8 8 0 1 1 1 8M4 4v6h6', lens: 'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  sound: 'M3 9h4l5-4v14l-5-4H3zM16 8q6 4 0 8M19 5q9 7 0 14',
  muted: 'M3 9h4l5-4v14l-5-4H3zM16 9l6 6M22 9l-6 6',
  moon: 'M19 16A9 9 0 0 1 8 3 9 9 0 1 0 19 16z',
  rail: 'M3 17h18M6 13V7M12 13V4M18 13V9',
  half: 'M12 3v18M12 3a9 9 0 0 1 0 18 9 9 0 0 1 0-18',
  wave: 'M2 9q3-6 6 0t6 0 6 0M2 17q3-6 6 0t6 0 6 0',
  pin: 'M12 21V11M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  sky: 'M12 2l2 7 7 3-7 2-2 8-2-8-8-2 8-3z',
  ring: 'M21 8c2 3-2 7-7 9S3 19 2 16s2-7 8-9 10-2 11 1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  wall: 'M3 20V9h6v11M9 20V4h6v16M15 20V12h6v8'
};
function icon(name) { return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name] || ICONS.moon}"/></svg>`; }
canvas.setAttribute('aria-label', LABELS.canvas[LANG]);
const toolbar = document.getElementById('tools');
for (const name of ['play', 'minus', 'plus', 'reset', 'lens', 'sound']) {
  const button = document.createElement('button'); button.id = `tool-${name}`; button.setAttribute('aria-label', LABELS[name][LANG]);
  button.innerHTML = icon(name); button.addEventListener('click', () => action(name)); toolbar.append(button);
  if (name === 'minus') { const dots = document.createElement('span'); dots.id = 'speed'; dots.setAttribute('aria-hidden', 'true'); toolbar.append(dots); }
}
let audioContext;
function tick() {
  if (!S.sound.target) return;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') void audioContext.resume();
  const o = audioContext.createOscillator(), g = audioContext.createGain(), now = audioContext.currentTime;
  o.frequency.setValueAtTime(1300, now); o.frequency.exponentialRampToValueAtTime(750, now + 0.035);
  g.gain.setValueAtTime(0.035, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
  o.connect(g).connect(audioContext.destination); o.start(); o.stop(now + 0.05);
}
function action(name) {
  if (!['sound', 'reset'].includes(name) && !QUEST.allows()) return;
  QUEST.touch();
  if (name === 'play') S.playing.target = S.playing.target ? 0 : 1;
  if (name === 'minus') S.speed.target = clamp(S.speed.target - 0.25, 0.25, 2);
  if (name === 'plus') S.speed.target = clamp(S.speed.target + 0.25, 0.25, 2);
  if (name === 'lens') GRAMMAR.set({ lens: !S.lens.target });
  if (name === 'sound') { S.sound.target = 1 - S.sound.target; tick(); }
  if (name === 'reset') TEACHER.reset();
  syncUI();
}
function syncUI() {
  document.getElementById('tool-play').innerHTML = icon(S.playing.target ? 'pause' : 'play');
  document.getElementById('tool-play').setAttribute('aria-pressed', String(!!S.playing.target));
  document.getElementById('tool-lens').setAttribute('aria-pressed', String(!!S.lens.target));
  document.getElementById('tool-sound').setAttribute('aria-pressed', String(!!S.sound.target));
  document.getElementById('tool-sound').innerHTML = icon(S.sound.target ? 'sound' : 'muted');
  document.getElementById('speed').innerHTML = '<i></i>'.repeat(Math.round(S.speed.target / 0.25));
}
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
const dragObjects = [MOON_HIT, SLIDER.handle, PIN_HIT, DIAL.knob, PLAY_BUTTON, ...GRAPHS.map(g => g.mesh)];
function rayFromEvent(event) {
  const r = canvas.getBoundingClientRect(); pointer.set((event.clientX - r.left) / r.width * 2 - 1, -(event.clientY - r.top) / r.height * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
}
function planePoint(plane) { return raycaster.ray.intersectPlane(plane, V3()); }
const SNAPS = [-0.05, ...PHYS.RAIL_NOTCHES.map(n => n.x), ...PHYS.DETENTS.map(n => n.x)];
function setRailFromPointer(u) {
  u = clamp(u, -0.05, 1);
  const near = SNAPS.reduce((best, value) => Math.abs(value - u) < Math.abs(best - u) ? value : best, Infinity);
  const snapped = Math.abs(near - u) <= 0.012;
  if (snapped && S.snap !== near) tick();
  S.snap = snapped ? near : null; S.u.target = snapped ? near : u;
}
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  if (!QUEST.allows()) { event.stopImmediatePropagation(); return; }
  QUEST.touch();
  rayFromEvent(event); scene.updateMatrixWorld(true);
  const hit = raycaster.intersectObjects(dragObjects, true)[0];
  if (!hit) return;
  let object = hit.object; while (object.parent && !dragObjects.includes(object)) object = object.parent;
  let type = object === MOON_HIT ? 'moon' : object === SLIDER.handle ? 'slider' : object === PIN_HIT ? 'pin' : object === DIAL.knob ? 'dial' : object === PLAY_BUTTON ? 'play' : 'graph';
  if (type === 'play') { action('play'); event.stopImmediatePropagation(); return; }
  const plane = type === 'pin' ? new THREE.Plane(V3(0, 1, 0), -E.y) : new THREE.Plane(V3(0, 0, 1), type === 'moon' ? 0 : -hit.point.z);
  const p = planePoint(plane); if (!p) return;
  S.drag = { type, id: event.pointerId, plane, start: p, u: S.u.target, t: S.t.target,
    angle: Math.atan2(p.x - CONTROL_LAYOUT.dial.at[0], p.y - CONTROL_LAYOUT.dial.at[1]), graph: object === GRAPHS[0].mesh ? 0 : 1,
    lon: Math.atan2(-(p.z - E.z), p.x - E.x) };
  if (type === 'dial') { S.drag.wasPlaying = S.playing.target; S.playing.target = 0; }
  controls.enabled = false; S.fly = null; canvas.setPointerCapture(event.pointerId); event.stopImmediatePropagation();
}, { capture: true });
canvas.addEventListener('pointermove', event => {
  if (!S.drag || event.pointerId !== S.drag.id) return;
  rayFromEvent(event); const d = S.drag, p = planePoint(d.plane); if (!p) return;
  if (d.type === 'moon') setRailFromPointer(d.u - (p.x - d.start.x) / (railEnd - railStart));
  if (d.type === 'slider') setRailFromPointer(d.u + (p.x - d.start.x) / SLIDER.width * 1.05);
  if (d.type === 'pin') {
    const lon = Math.atan2(-(p.z - E.z), p.x - E.x);
    const delta = Math.atan2(Math.sin(lon - d.lon), Math.cos(lon - d.lon));
    S.lon0.target += delta; d.lon = lon;
  }
  if (d.type === 'dial') {
    const angle = Math.atan2(p.x - CONTROL_LAYOUT.dial.at[0], p.y - CONTROL_LAYOUT.dial.at[1]), delta = Math.atan2(Math.sin(angle - d.angle), Math.cos(angle - d.angle));
    S.t.target = ((S.t.target + delta / (2 * Math.PI) * 86400) % 86400 + 86400) % 86400; d.angle = angle;
  }
  if (d.type === 'graph') {
    const { at, size } = CONTROL_LAYOUT.graphs[d.graph], u = clamp((p.x - at[0] + size[0] / 2) / size[0], 0, 1);
    if (d.graph) setRailFromPointer(u); else { S.playing.target = 0; S.t.target = u * 86400; }
  }
  event.stopImmediatePropagation();
}, { capture: true });
function endDrag(event) {
  if (!S.drag || event.pointerId !== S.drag.id) return;
  if (S.drag.type === 'dial') S.playing.target = S.drag.wasPlaying;
  S.drag = null; S.snap = null; controls.enabled = true;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  syncUI();
}
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('lostpointercapture', endDrag);
window.addEventListener('keydown', event => {
  if (event.key !== '/' || event.repeat) return;
  S.ui.target = 1 - S.ui.target; document.body.classList.toggle('hide-ui', !S.ui.target);
  window.__site?.setVisible(!!S.ui.target); event.preventDefault();
});
function set(name, value) {
  if (name === 'quest') { QUEST.go(Number(value)); return; }
  if (name === 'playing') { S.playing.target = value ? 1 : 0; syncUI(); return; }
  value = Number(value); if (!Number.isFinite(value)) throw new TypeError(name);
  if (name === 'closer') { value = clamp(value, 0, PHYS.C.closerMax); S.u.target = value < PHYS.RANGE.closer[0] ? -0.05 : PHYS.railX(value); }
  else if (name === 'u') S.u.target = clamp(value, -0.05, 1);
  else if (name === 'lon0') S.lon0.target = value % (Math.PI * 2);
  else if (name === 't') S.t.target = ((value % 86400) + 86400) % 86400;
  else throw new RangeError(name);
}
function preset(index) {
  const values = [0, 0.1, PHYS.C.d0 / 2, PHYS.C.d0 * 0.9, PHYS.C.d0 * 0.95, PHYS.C.closerMax];
  if (!Number.isInteger(index) || index < 0 || index >= values.length) throw new RangeError('preset');
  set('closer', values[index]);
}
function textAudit() {
  const found = [], walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode, parent = node.parentElement;
    if (!parent || parent.closest('script,style,template,[hidden]')) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    const r = range.getBoundingClientRect(), style = getComputedStyle(parent);
    if (!r.width || !r.height || style.visibility === 'hidden' || style.display === 'none' || +style.opacity === 0 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    const numeric = parent.closest('[data-numeric]');
    const content = node.textContent.trim();
    const words = numeric
      ? (T.mode === 'teacher' && T.numbers && /^[-+−\d.,\s]+(?:km|m|s|h|°|×)?$/u.test(content) ? null : [content])
      : content.match(/[\p{L}\p{N}]+/gu);
    if (words) found.push({ words, x: r.x, y: r.y, width: r.width, height: r.height });
  }
  return found;
}
