// All grammar decisions live here. Physical quantities always come from PHYS.
const GRAMMAR = (() => {
  const enabled = { marks: true, field: true, lens: false, person: false, sky: false, limit: true };
  const groups = {};
  for (const name of ['marks', 'field', 'lens', 'limit']) { groups[name] = new THREE.Group(); HERO.add(groups[name]); }
  const unit = 0.016, arrowCap = 14, markCap = 30;
  groups.marks.position.set(E.x - 0.49, MODEL.top + 0.045, 0.22);
  const cells = new THREE.InstancedMesh(new THREE.BoxGeometry(0.075, 0.014, 0.027),
    new THREE.MeshBasicMaterial({ color: THEME.tide, transparent: true, opacity: 0.85 }), markCap);
  groups.marks.add(cells);
  const marksBreak = KIT.breakMark(groups.marks, THEME.tide);
  const obj = new THREE.Object3D();
  let markValue = 1, clock = 0, ringMix = 0, crackProgress = 0;
  const seed = mulberry32(450073);
  const particles = Array.from({ length: 360 }, () => ({ phase: seed(), phi: seed() * Math.PI * 2,
    side: seed() < 0.5 ? -1 : 1, radius: 1.04 + seed() * 0.10 }));
  const streakMaterial = new THREE.MeshBasicMaterial({ color: THEME.tide, blending: THREE.NormalBlending,
    transparent: true, opacity: 0.16, depthWrite: false });
  const streaks = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), streakMaterial, particles.length);
  streaks.position.copy(E); streaks.frustumCulled = false; groups.field.add(streaks);
  groups.lens.position.copy(E);
  const disk = KIT.mesh(new THREE.CircleGeometry(RV * 1.8, 64), new THREE.MeshBasicMaterial({ color: INK_CFG.diagram.screen,
    transparent: true, opacity: 1, side: THREE.DoubleSide, depthWrite: false, depthTest: false }), groups.lens);
  disk.renderOrder = 9;
  KIT.line(Array.from({ length: 97 }, (_, i) => V3(Math.cos(i / 96 * Math.PI * 2) * RV * 1.8,
    Math.sin(i / 96 * Math.PI * 2) * RV * 1.8, 0)), INK_CFG.diagram.ink, groups.lens, true, 0.7);
  const lensRadius = RV * 1.8;
  for (let i = -4; i <= 4; i++) {
    const offset = i * lensRadius / 5, reach = Math.sqrt(lensRadius ** 2 - offset ** 2);
    for (const vertical of [false, true]) {
      const line = KIT.line(vertical ? [V3(offset, -reach, 0), V3(offset, reach, 0)]
        : [V3(-reach, offset, 0), V3(reach, offset, 0)], INK_CFG.diagram.grid, groups.lens, false, 0.5);
      line.material.depthTest = false; line.renderOrder = 10;
    }
  }
  const arrows = [
    ['near', 0.23, 0.10, 1, INK_CFG.diagram.ink], ['center', 0, 0, 1, INK_CFG.diagram.ink], ['far', -0.23, -0.10, 1, INK_CFG.diagram.ink],
    ['diffNear', 0.23, 0.22, 1, INK_CFG.diagram.tide], ['diffFar', -0.23, -0.22, -1, INK_CFG.diagram.tide]
  ].map(([key, x, y, direction, color]) => {
    const mesh = KIT.quantityArrow(groups.lens, color, unit, key.startsWith('diff') ? 0.010 : 0.006);
    mesh.position.set(x, y, 0); if (direction < 0) mesh.rotation.z = Math.PI;
    return { key, mesh };
  });
  KIT.expansion(groups.lens, 0, 0.25, 0.01, INK_CFG.diagram.ink);
  const { fluid, rigid } = PHYS.rocheX();
  const x1 = railAt(fluid), x2 = railAt(rigid), bandZ = 0.23, bandDepth = 0.22;
  const band = KIT.mesh(new THREE.PlaneGeometry(x1 - x2, bandDepth).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: THEME.red, transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false }),
    groups.limit, (x1 + x2) / 2, MODEL.top + 0.03, bandZ);
  KIT.line([V3(x2, MODEL.top + 0.032, bandZ - bandDepth / 2), V3(x1, MODEL.top + 0.032, bandZ - bandDepth / 2),
    V3(x1, MODEL.top + 0.032, bandZ + bandDepth / 2), V3(x2, MODEL.top + 0.032, bandZ + bandDepth / 2),
    V3(x2, MODEL.top + 0.032, bandZ - bandDepth / 2)], THEME.red, groups.limit, true);
  // Keep the threshold readable above the rail even when the moon has crossed it.
  for (const x of [x1, x2]) KIT.line([V3(x, railY + 0.025, 0.05), V3(x, railY + 0.025, 0.11)], THEME.red, groups.limit, true);

  const card = document.createElement('div'); card.id = 'person-card'; card.hidden = true; card.setAttribute('aria-hidden', 'true');
  card.innerHTML = `<svg viewBox="0 0 288 92"><g stroke="#221d18" transform="translate(2 7)"><circle cx="12" cy="5" r="3"/><path d="M12 9v7m-7-5h14m-7 5-5 7m5-7 5 7"/></g><g stroke="#377f88" transform="translate(2 57)"><path d="M2 8q3-6 6 0t6 0 6 0M2 16q3-6 6 0t6 0 6 0"/></g><g id="person-grid" stroke="#b6b5ab"></g><g fill="none" stroke="#393e42" stroke-dasharray="3 3"><rect x="38" y="12" width="18" height="16"/><rect x="38" y="62" width="18" height="16"/></g><path id="person-now" stroke="#221d18" stroke-width="5"/><path id="sea-now" stroke="#377f88" stroke-width="7"/><path id="sea-break" stroke="#377f88" d="M264 59q4-5 8 0t8 0m-16 8q4-5 8 0t8 0"/></svg>`;
  document.body.append(card);
  card.querySelector('#person-grid').innerHTML = Array.from({ length: 13 }, (_, i) => `<path d="M${38 + i * 18} 8v24m0 26v24"/>`).join('');
  const personNow = card.querySelector('#person-now'), seaNow = card.querySelector('#sea-now'), seaBreak = card.querySelector('#sea-break');
  const skyBase = document.createElement('canvas'); skyBase.width = skyBase.height = 1024;
  skyBase.getContext('2d').drawImage(skyTexture.image, 0, 0);
  let skyKey = '';
  function set(values) {
    for (const name of Object.keys(values)) if (!(name in enabled)) throw new RangeError(name);
    for (const [name, on] of Object.entries(values)) {
      enabled[name] = !!on; S.layers[name] = !!on;
      if (name === 'lens') S.lens.target = on ? 1 : 0;
    }
  }
  function update(dt) {
    clock += dt;
    const closer = closerAt(S.u.value), ratio = PHYS.ratio(closer), strength = Math.min(ratio, markCap);
    // S.lens is also used by the existing reset button.
    enabled.lens = !!S.lens.target; S.layers.lens = enabled.lens;
    for (const name of ['marks', 'field', 'limit']) groups[name].visible = enabled[name];
    const targetMarks = Math.min(markCap, Math.ceil(ratio));
    markValue += (targetMarks - markValue) * (1 - Math.exp(-10 * dt));
    for (let i = 0; i < markCap; i++) {
      const amount = clamp(markValue - i, 0, 1);
      obj.position.set(0, (i + 0.5) * unit, 0); obj.scale.set(1, Math.max(0.001, amount), 1); obj.rotation.set(0, 0, 0);
      obj.updateMatrix(); cells.setMatrixAt(i, obj.matrix);
    }
    cells.count = Math.ceil(markValue); cells.instanceMatrix.needsUpdate = true; cells.frustumCulled = false;
    marksBreak.position.y = markCap * unit + 0.018; marksBreak.visible = ratio > markCap;
    const lensAmount = S.lens.value;
    groups.lens.visible = lensAmount > 0.001; groups.lens.scale.setScalar(Math.max(0.001, lensAmount));
    streaks.count = Math.round(particles.length * (0.12 + 0.88 * strength / markCap));
    streakMaterial.opacity = (0.10 + 0.28 * strength / markCap) * (1 - 0.8 * lensAmount);
    if (enabled.field) {
      const bulge = PHYS.oceanBulge(closer).bulge;
      for (let i = 0; i < streaks.count; i++) {
        const p = particles[i], progress = (p.phase + clock * 0.16) % 1;
        const theta = (1 - progress) * Math.PI / 2, r = RV * p.radius * (1 + bulge * (3 * Math.cos(theta) ** 2 - 1) / 2);
        obj.position.set(p.side * Math.cos(theta) * r, Math.sin(theta) * Math.cos(p.phi) * r, Math.sin(theta) * Math.sin(p.phi) * r);
        const tangent = V3(p.side * Math.sin(theta), -Math.cos(theta) * Math.cos(p.phi), -Math.cos(theta) * Math.sin(p.phi)).normalize();
        obj.quaternion.setFromUnitVectors(V3(0, 1, 0), tangent); obj.scale.set(0.0018, 0.009 + strength * 0.0002, 0.0018);
        obj.updateMatrix(); streaks.setMatrixAt(i, obj.matrix);
      }
      streaks.instanceMatrix.needsUpdate = true;
    }
    const force = PHYS.tidalArrows(closer);
    for (const { key, mesh } of arrows) {
      const { shaft, head, overflow, material } = mesh.userData, units = Math.min(arrowCap, force[key]);
      shaft.scale.x = units * unit; head.position.x = units * unit;
      material.uniforms.uUnits.value = units; overflow.position.set(units * unit - 0.012, 0, 0.001);
      overflow.rotation.z = Math.PI / 2; overflow.visible = force[key] > arrowCap;
    }
    card.hidden = !enabled.person;
    if (enabled.person) {
      personNow.setAttribute('d', `M38 20h${18 * PHYS.personWeightRatio(closer)}`);
      seaNow.setAttribute('d', `M38 70h${18 * Math.min(12, ratio)}`); seaBreak.style.display = ratio > 12 ? '' : 'none';
    }
    const inBand = PHYS.fractureState(closer).state !== 'whole';
    band.material.opacity = inBand ? 0.30 + 0.12 * Math.sin(clock * 5) : 0.22;
    const nextSkyKey = `${enabled.sky}:${closer.toFixed(1)}:${innerWidth}:${camera.position.z.toFixed(2)}`;
    if (nextSkyKey !== skyKey) {
      skyKey = nextSkyKey; const c = skyTexture.image.getContext('2d'), w = 1024, h = 1024;
      c.clearRect(0, 0, w, h); c.drawImage(skyBase, 0, 0);
      if (enabled.sky) {
        const cx = w * 0.68, cy = h * 0.40;
        const left = V3(-0.22, 2.8, -2.69).project(camera), right = V3(1.62, 2.8, -2.69).project(camera);
        const texturePerPixel = w / Math.max(50, Math.abs(right.x - left.x) * innerWidth / 2);
        const baseR = Math.max(10 * texturePerPixel, PHYS.angularSizeDeg(0) / 60 * w / 2);
        // Apply the same visibility scale to today's reference and the enlarged disc.
        const rawR = baseR * PHYS.angularSizeDeg(closer) / PHYS.angularSizeDeg(0), r = Math.min(rawR, w * 0.18);
        c.strokeStyle = '#a7c6dc88'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, cy); c.lineTo(w, cy); c.stroke();
        const gap = PHYS.apparentRateDegPerHour(closer) / 60 * w;
        c.fillStyle = '#e5e7ec';
        for (let i = -12; i <= 12; i++) { const x = cx + i * gap; if (x < 5 || x > w - 5 || !i) continue;
          c.beginPath(); c.arc(x, cy, Math.max(4, 3 * texturePerPixel), 0, Math.PI * 2); c.fill(); }
        c.fillStyle = '#d9dce2'; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.setLineDash([3, 3]); c.beginPath(); c.arc(cx, cy, baseR, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
        if (rawR > w * 0.18) { c.beginPath(); for (let i = 0; i <= 32; i++) { const x = cx - 35 + i * 70 / 32, y = cy - r + Math.sin(i * Math.PI / 8) * 6; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
      }
      skyTexture.needsUpdate = true;
    }
    // Real-time interpolation remains independent of paused simulation time.
    const fracture = PHYS.fractureState(closer);
    crackProgress += (fracture.progress - crackProgress) * (1 - Math.exp(-dt * 8));
    moonCrackMaterial.uniforms.uProgress.value = crackProgress;
    MOON.scale.setScalar(1 + crackProgress * 0.06);
    CRACKS.visible = false;
    const ringTarget = fracture.state === 'ring' ? 1 : 0;
    ringMix = clamp(ringMix + (ringTarget ? 1 : -1) * dt / 0.8, 0, 1);
    MOON.visible = ringMix < 0.98; moonCrackMaterial.uniforms.uOpacity.value = 1 - ringMix;
    SHARDS.visible = ringMix > 0 && S.layers.ring !== false;
    if (SHARDS.visible) {
      const settle = ringMix * ringMix * (3 - 2 * ringMix), burst = Math.sin(ringMix * Math.PI) * RV * 0.6;
      for (let i = 0; i < SHARDS.count; i++) {
        const d = shardData[Math.floor(i * shardData.length / SHARDS.count)], a = d.a + S.t.value * 0.0001;
        const r = d.r * settle + burst;
        dummy.position.set((MOON_CARRIAGE.position.x - E.x) * (1 - settle) + Math.cos(a) * r,
          d.y * settle + Math.sin(d.phase) * burst * 0.4, Math.sin(a) * r);
        dummy.rotation.set(d.phase, a, d.phase); dummy.scale.setScalar(d.s * Math.min(1, ringMix * 5)); dummy.updateMatrix(); SHARDS.setMatrixAt(i, dummy.matrix);
      }
      SHARDS.instanceMatrix.needsUpdate = true; SHARDS.computeBoundingSphere();
    }
  }
  function bounds() {
    const b = new THREE.Box3();
    if (enabled.marks) b.expandByPoint(groups.marks.position.clone().add(V3(-0.04, 0, -0.02)))
      .expandByPoint(groups.marks.position.clone().add(V3(0.04, markCap * unit + 0.04, 0.02)));
    if (enabled.lens) b.union(new THREE.Box3(E.clone().addScalar(-lensRadius), E.clone().addScalar(lensRadius)));
    return b;
  }
  return { set, update, groups, enabled, bounds };
})();
// Extend the existing debug entry point without editing the loop's layer implementation.
layer = new Proxy(layer, { apply(target, thisArg, args) {
  const [name, on] = args;
  if (name in GRAMMAR.enabled) { GRAMMAR.set({ [name]: on }); return; }
  return Reflect.apply(target, thisArg, args);
} });
window.GRAMMAR = GRAMMAR;
