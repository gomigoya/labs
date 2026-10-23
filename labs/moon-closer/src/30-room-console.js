// Observatory stage: two walls, plank floor, arched night window, instrument shelves.
const floorTex = KIT.canvasTex(1024, 1024, (c, w, h) => {
  c.fillStyle = '#674b38'; c.fillRect(0, 0, w, h);
  for (let row = 0; row < 12; row++) {
    const y = row * h / 12;
    c.fillStyle = row % 2 ? '#70503a' : '#795a43'; c.fillRect(0, y, w, h / 12 - 2);
    for (let i = 0; i < 48; i++) { c.fillStyle = '#30201a13'; c.fillRect(rand() * w, y + rand() * h / 12, rand() * 240, 1); }
    for (let x = (row % 3) * 120; x < w; x += 360) { c.fillStyle = '#30251f'; c.fillRect(x, y, 2, h / 12); }
  }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(3, 3);
KIT.mesh(new THREE.PlaneGeometry(14, 14).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.84 }), ROOM, 0, 0, 1);
KIT.roundedPanel(10, 4.5, 0.12, MAT.wall, ROOM, 1, 2.25, -2.8);
KIT.roundedPanel(0.12, 4.5, 10, MAT.navy, ROOM, -3.4, 2.25, 1.2);
for (let i = 0; i < 17; i++) {
  KIT.roundedPanel(0.47, 0.65, 0.025, MAT.wood, ROOM, -3 + i * 0.51, 0.48, -2.71);
}
KIT.roundedPanel(10, 0.045, 0.06, MAT.brass, ROOM, 1, 0.88, -2.67);
KIT.roundedPanel(0.05, 0.045, 8, MAT.brass, ROOM, -3.3, 0.88, 0.8);
for (let i = 0; i < 6; i++) KIT.roundedPanel(0.035, 3.4, 0.06, MAT.wood, ROOM, -3.2 + i * 1.4, 2.5, -2.68);

const skyTexture = KIT.canvasTex(1024, 1024, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#18233f'); g.addColorStop(0.65, '#354d67'); g.addColorStop(1, '#b17c62');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 280; i++) { c.fillStyle = `rgba(223,238,255,${0.3 + rand() * 0.6})`; c.beginPath(); c.arc(rand() * w, rand() * h * 0.9, 0.6 + rand() * 1.7, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = '#273c4b'; c.beginPath(); c.moveTo(0, h); for (let x = 0; x <= w; x += 32) c.lineTo(x, 880 - rand() * 65); c.lineTo(w, h); c.fill();
});
const arch = new THREE.Shape(); arch.moveTo(-0.92, -0.78); arch.lineTo(0.92, -0.78); arch.lineTo(0.92, 0.14);
arch.absarc(0, 0.14, 0.92, 0, Math.PI, false); arch.lineTo(-0.92, -0.78);
const archGeo = new THREE.ShapeGeometry(arch, 48);
// ShapeGeometry's default UV uses world coordinates; normalize to the canvas bounds.
const uv = archGeo.attributes.uv, ap = archGeo.attributes.position;
for (let i = 0; i < uv.count; i++) uv.setXY(i, (ap.getX(i) + 0.92) / 1.84, (ap.getY(i) + 0.78) / 1.84);
const windowMesh = KIT.mesh(archGeo, new THREE.MeshBasicMaterial({ map: skyTexture }), ROOM, 0.7, 2.35, -2.69);
windowMesh.castShadow = false;
const windowBorder = arch.getPoints(64).map(p => V3(p.x + 0.7, p.y + 2.35, -2.64));
for (let i = 1; i < windowBorder.length; i++) KIT.rod(windowBorder[i - 1], windowBorder[i], 0.032, MAT.brass, ROOM);
KIT.rod(V3(0.7, 1.58, -2.61), V3(0.7, 3.38, -2.61), 0.018, MAT.graphite, ROOM);
KIT.rod(V3(-0.22, 2.49, -2.61), V3(1.62, 2.49, -2.61), 0.018, MAT.graphite, ROOM);
KIT.roundedPanel(2.04, 0.075, 0.28, MAT.wood, ROOM, 0.7, 1.54, -2.60);
const moonlight = new THREE.RectAreaLight(THEME.cool, 2.2, 1.6, 1.7);
moonlight.position.set(0.7, 2.5, -2.45); moonlight.rotation.y = Math.PI; ROOM.add(moonlight);

for (const [dx, dy, seed] of [[-1.45, 2.65, 0], [2.45, 2.35, 1]]) {
  KIT.roundedPanel(0.92, 0.69, 0.055, MAT.brass, ROOM, dx, dy, -2.63);
  const tex = KIT.canvasTex(512, 384, (c, w, h) => {
    c.fillStyle = '#1c3040'; c.fillRect(0, 0, w, h); c.strokeStyle = '#477083'; c.lineWidth = 1;
    for (let x = 32; x < w; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (let y = 24; y < h; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    const points = Array.from({ length: 9 }, (_, i) => [60 + (i % 4) * 112 + rand() * 24, 55 + Math.floor(i / 4) * 110 + rand() * 45]);
    c.strokeStyle = '#9dd5df'; c.lineWidth = 3; c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    for (const [x, y] of points) { c.fillStyle = seed ? '#ffcc8c' : '#d5ecf5'; c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill(); }
  });
  KIT.mesh(new THREE.PlaneGeometry(0.85, 0.62), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: THEME.cool, emissiveIntensity: 0.35 }), ROOM, dx, dy, -2.598);
}
for (const y of [1.13, 1.80]) {
  KIT.roundedPanel(1.85, 0.06, 0.38, MAT.wood, ROOM, -1.65, y, -2.39);
  for (const x of [-2.32, -0.98]) KIT.rod(V3(x, y - 0.25, -2.62), V3(x, y - 0.035, -2.25), 0.014, MAT.brass, ROOM);
}
// Phase models, shell fan, lighthouse, sand timer, tide clock, bottles, orrery disc.
for (let i = 0; i < 6; i++) {
  const x = -2.38 + i * 0.25;
  KIT.rod(V3(x, 1.84, -2.36), V3(x, 1.98, -2.36), 0.009, MAT.brass, ROOM);
  KIT.ball(0.075, MAT.moon, ROOM, x, 2.04, -2.36);
  KIT.mesh(new THREE.SphereGeometry(0.076, 16, 12, i / 6 * Math.PI * 2, Math.PI), MAT.navy, ROOM, x, 2.04, -2.36);
}
const shellMat = new THREE.MeshStandardMaterial({ color: 0xddbba2, roughness: 0.8, flatShading: true });
for (let i = 0; i < 9; i++) {
  const a = (i - 4) * 0.18;
  const p = KIT.mesh(new THREE.ConeGeometry(0.025, 0.20, 5), shellMat, ROOM, -2.13 + Math.sin(a) * 0.09, 1.22, -2.28);
  p.rotation.z = -a; p.rotation.x = 0.8;
}
KIT.mesh(new THREE.CylinderGeometry(0.055, 0.095, 0.31, 12), MAT.moon, ROOM, -1.73, 1.32, -2.36);
KIT.mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.09, 12), MAT.brass, ROOM, -1.73, 1.52, -2.36);
KIT.mesh(new THREE.ConeGeometry(0.11, 0.10, 12), MAT.graphite, ROOM, -1.73, 1.61, -2.36);
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xbcdfe5, transparent: true, opacity: 0.30, roughness: 0.12, transmission: 0.35, thickness: 0.04 });
for (const y of [1.19, 1.48]) KIT.mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.026, 16), MAT.brass, ROOM, -1.28, y, -2.35);
for (const dx of [-0.07, 0.07]) KIT.rod(V3(-1.28 + dx, 1.20, -2.35), V3(-1.28 + dx, 1.47, -2.35), 0.008, MAT.brass, ROOM);
for (const sign of [-1, 1]) {
  const cone = KIT.mesh(new THREE.ConeGeometry(0.067, 0.13, 12), glassMat, ROOM, -1.28, 1.335 + sign * 0.065, -2.35); cone.rotation.z = sign > 0 ? Math.PI : 0;
}
KIT.mesh(new THREE.ConeGeometry(0.052, 0.08, 12), shellMat, ROOM, -1.28, 1.245, -2.35);
const clock = new THREE.Group(); clock.position.set(2.42, 1.36, -2.45); ROOM.add(clock);
KIT.mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.07, 48).rotateX(Math.PI / 2), MAT.brass, clock);
KIT.mesh(new THREE.CircleGeometry(0.245, 48), MAT.navy, clock, 0, 0, 0.04);
for (let i = 0; i < 24; i++) {
  const a = i / 24 * Math.PI * 2, r = i % 6 ? 0.215 : 0.19;
  KIT.line([V3(Math.sin(a) * r, Math.cos(a) * r, 0.045), V3(Math.sin(a) * 0.232, Math.cos(a) * 0.232, 0.045)], THEME.moon, clock);
}
KIT.rod(V3(0, 0, 0.055), V3(0.12, 0.14, 0.055), 0.007, MAT.brass, clock);
for (let i = 0; i < 3; i++) {
  KIT.mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.18, 12), glassMat, ROOM, 1.90 + i * 0.19, 1.66, -2.54);
  KIT.mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.025, 12), MAT.brass, ROOM, 1.90 + i * 0.19, 1.76, -2.54);
}
KIT.roundedPanel(0.82, 0.06, 0.30, MAT.wood, ROOM, 2.10, 1.54, -2.49);
const telescope = new THREE.Group(); telescope.position.set(1.85, 0, -1.5); ROOM.add(telescope);
for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; KIT.rod(V3(Math.sin(a) * 0.40, 0.04, Math.cos(a) * 0.40), V3(0, 1.18, 0), 0.023, MAT.brass, telescope); }
KIT.rod(V3(-0.38, 1.24, 0), V3(0.38, 1.62, -0.28), 0.105, MAT.navy, telescope);
KIT.rod(V3(0.31, 1.58, -0.25), V3(0.41, 1.63, -0.29), 0.12, MAT.brass, telescope);
KIT.rod(V3(-0.44, 1.21, 0.025), V3(-0.31, 1.275, -0.015), 0.045, MAT.chrome, telescope);
KIT.lampWithBulb(ROOM, -1.80, 0.86, -0.63);
// Foreground stool and side tray deliberately extend beyond the hero frame.
KIT.roundedPanel(0.67, 0.13, 0.53, MAT.wood, ROOM, -1.95, 0.55, 1.36, 0.05);
for (const dx of [-0.24, 0.24]) for (const dz of [-0.18, 0.18]) KIT.rod(V3(-1.95 + dx, 0.05, 1.36 + dz), V3(-1.95 + dx * 0.9, 0.50, 1.36 + dz * 0.9), 0.03, MAT.graphite, ROOM);
KIT.roundedPanel(0.7, 0.045, 0.5, MAT.brass, ROOM, 1.55, 0.61, 1.25);
KIT.ball(0.12, MAT.moon, ROOM, 1.55, 0.74, 1.25);

// Console front is vertical so instruments remain legible at a shallow hero angle.
KIT.roundedPanel(3.22, 0.62, 1.02, MAT.graphite, CONSOLE, -0.10, 0.48, 0.10, 0.07);
KIT.roundedPanel(3.34, 0.10, 1.16, MAT.wood, CONSOLE, -0.10, MODEL.top - 0.05, 0.10, 0.035);
KIT.roundedPanel(3.16, 0.018, 1.02, MAT.graphite, CONSOLE, -0.10, MODEL.top + 0.008, 0.10);
KIT.roundedPanel(3.12, 0.43, 0.035, MAT.navy, CONSOLE, -0.10, 0.54, 0.63);
for (const x of [-1.61, 1.41]) for (const y of [0.37, 0.71]) KIT.screw(CONSOLE, x, y, 0.654);
for (let i = 0; i < 23; i++) KIT.roundedPanel(0.035, 0.06, 0.012, MAT.rubber, CONSOLE, -1.12 + i * 0.11, 0.22, 0.618, 0.004);
for (const x of [-1.43, 1.23]) for (const z of [-0.30, 0.50]) KIT.roundedPanel(0.21, 0.15, 0.18, MAT.rubber, CONSOLE, x, 0.10, z);
const DIAL = KIT.knobWithArc(CONSOLE, -1.30, 0.54, 0.681);
const GRAPHS = [KIT.graphScreen(CONSOLE, -0.66, 0.57, 0.68, 0.67, 0.24), KIT.graphScreen(CONSOLE, 0.12, 0.57, 0.68, 0.67, 0.24)];
const SLIDER = KIT.ledSlider(CONSOLE, -0.27, 0.355, 0.69, 1.32);
KIT.mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.045, 40).rotateX(Math.PI / 2), MAT.brass, CONSOLE, 0.73, 0.53, 0.69);
const PLAY_BUTTON = KIT.mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.055, 32).rotateX(Math.PI / 2), MAT.graphite, CONSOLE, 0.73, 0.53, 0.72);
const PLAY_GLYPH = new THREE.Group(); PLAY_BUTTON.add(PLAY_GLYPH);
for (const x of [-0.023, 0.023]) KIT.roundedPanel(0.012, 0.065, 0.005, MAT.glow, PLAY_GLYPH, x, 0, 0.031, 0.002);
const playShape = new THREE.Shape(); playShape.moveTo(-0.025, -0.035); playShape.lineTo(0.04, 0); playShape.lineTo(-0.025, 0.035); playShape.closePath();
const PLAY_TRIANGLE = KIT.mesh(new THREE.ShapeGeometry(playShape), MAT.glow, PLAY_BUTTON, 0, 0, 0.032);
KIT.roundedPanel(0.35, 0.29, 0.024, MAT.brass, CONSOLE, 1.17, 0.55, 0.68);
KIT.line(Array.from({ length: 33 }, (_, i) => V3(1.10 + Math.cos(i / 32 * Math.PI * 2) * 0.05, 0.60 + Math.sin(i / 32 * Math.PI * 2) * 0.05, 0.695)), THEME.graphite, CONSOLE);
for (let k = 0; k < 3; k++) KIT.line(Array.from({ length: 35 }, (_, i) => V3(1.035 + i / 34 * 0.27, 0.46 + k * 0.023 + Math.sin(i / 34 * Math.PI * 4) * 0.01, 0.695)), THEME.graphite, CONSOLE);

function drawGraphs() {
  const closer = closerAt(S.u.value), ratio = PHYS.ratio(closer);
  const keys = [`${S.u.value.toFixed(6)}:${S.lon0.value.toFixed(5)}:${Math.floor(S.t.value / 120)}`, S.u.value.toFixed(6)];
  GRAPHS.forEach((g, index) => {
    if (S.graphKeys[index] === keys[index]) return;
    S.graphKeys[index] = keys[index];
    const c = g.ctx, w = 768, h = 256, left = 52, right = 724, top = 22, bottom = 216;
    c.fillStyle = '#11232e'; c.fillRect(0, 0, w, h); c.lineWidth = 1; c.strokeStyle = '#385363';
    for (let i = 0; i <= 12; i++) { const x = left + (right - left) * i / 12; c.beginPath(); c.moveTo(x, top); c.lineTo(x, bottom); c.stroke(); }
    for (let i = 0; i <= 4; i++) { const y = top + (bottom - top) * i / 4; c.beginPath(); c.moveTo(left, y); c.lineTo(right, y); c.stroke(); }
    const scale = index ? 1 : Math.max(PHYS.tideHeight(closer), PHYS.tideH0());
    const xy = (u, v) => [left + u * (right - left), index ? bottom - v * (bottom - top) : 94 - v / scale * 66];
    const curve = (reference) => {
      c.setLineDash(reference ? [10, 8] : []); c.strokeStyle = reference ? '#ffffff' : `#${new THREE.Color(index ? THEME.tide : THEME.sea).getHexString()}`; c.lineWidth = reference ? 2 : 4;
      c.beginPath();
      for (let i = 0; i <= 320; i++) {
        const u = i / 320;
        const v = index ? Math.log(PHYS.ratio(PHYS.closerFromRailX(u))) / Math.log(PHYS.ratio(PHYS.C.closerMax)) : PHYS.harborLevel(u * 86400, S.lon0.value, reference ? 0 : closer);
        const [x, y] = xy(u, v); i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke(); c.setLineDash([]);
    };
    if (!index) curve(true); curve(false);
    const u = index ? PHYS.railX(closer) : ((S.t.value % 86400) + 86400) % 86400 / 86400;
    const v = index ? Math.log(ratio) / Math.log(PHYS.ratio(PHYS.C.closerMax)) : PHYS.harborLevel(S.t.value, S.lon0.value, closer);
    const [x, y] = xy(u, v);
    c.strokeStyle = '#ffcf9a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, top); c.lineTo(x, bottom); c.stroke();
    c.fillStyle = '#ffcf9a'; c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill();
    // Axis end icons: wave at y, crescent at x; deliberately no text drawing API.
    c.strokeStyle = '#c6dee9'; c.lineWidth = 3; c.beginPath();
    for (let i = 0; i <= 28; i++) { const xx = 10 + i; const yy = 24 + Math.sin(i / 28 * Math.PI * 3) * 5; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke();
    c.beginPath(); c.arc(743, 234, 10, 0.6, Math.PI * 1.8); c.stroke(); c.beginPath(); c.arc(749, 231, 8, 1.5, 4.3); c.stroke();
    g.tex.needsUpdate = true;
  });
}
