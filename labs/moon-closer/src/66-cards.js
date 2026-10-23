// All miniature simulation pictures and frozen principle equations live here.
const CARDS = (() => {
  const svg = body => `<svg viewBox="0 0 300 140" aria-hidden="true">${body}</svg>`;
  const path = (d, color = '#64ead0', dash = false) => `<path stroke="${color}" ${dash ? 'stroke-dasharray="4 4"' : ''} d="${d}"/>`;
  const circle = (x, y, r, dash = false) => `<circle cx="${x}" cy="${y}" r="${r}" ${dash ? 'stroke-dasharray="4 4"' : ''}/>`;
  const arrow = (x, y, dx, dy = 0) => path(`M${x} ${y}l${dx} ${dy}m${-Math.sign(dx || 1) * 6} -5l${Math.sign(dx || 1) * 6} 5 ${-Math.sign(dx || 1) * 6} 5`);
  const equal = path('M140 63h20m-20 12h20', '#fff');
  const bar = (x, n, unit = 3, y = 118) => Array.from({ length: Math.min(30, Math.ceil(n)) }, (_, i) => `<rect x="${x}" y="${y - (i + 1) * unit}" width="20" height="${Math.max(0.2, Math.min(1, n - i) * unit - 0.5)}"/>`).join('');
  function ocean(closer, side = 'both', time = 0) {
    const b = PHYS.oceanBulge(closer).bulge, points = [];
    for (let i = 0; i <= 100; i++) { const a = i / 100 * Math.PI * 2, allowed = side === 'both' || (side === 'near' ? Math.cos(a) > 0 : Math.cos(a) < 0), r = 35 * (1 + (allowed ? b : 0) * (3 * Math.cos(a) ** 2 - 1) / 2); points.push(`${i ? 'L' : 'M'}${80 + Math.cos(a) * r} ${65 + Math.sin(a) * r}`); }
    const theta = PHYS.relRate(closer) * time;
    return circle(80, 65, 35, true) + path(points.join('') + 'Z') + circle(80 + Math.cos(theta) * 35, 65 + Math.sin(theta) * 35, 3) + circle(137, 65, 6);
  }
  function wave(closer, lon, duration = 86400, side = 'both') {
    return path(Array.from({ length: 121 }, (_, i) => { const t = i / 120 * duration, theta = lon + PHYS.relRate(closer) * t, visible = side === 'both' || (side === 'near' ? Math.cos(theta) > 0 : Math.cos(theta) < 0), level = PHYS.harborLevel(t, lon, closer) / PHYS.tideHeight(closer); return `${i ? 'L' : 'M'}${163 + i} ${78 - (visible ? level : Math.min(0, level)) * 28}`; }).join(''));
  }
  const faint = body => `<g opacity=".22">${body}</g>`;
  const bold = body => `<g stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
  const expansion = () => path('M277 126l14-14m-14 6v8h8m-2-14h8v8', '#fff');
  const slab = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${Math.max(.2, h)}" fill="#64ead0" fill-opacity=".28"/>`;
  function picture(id, c, time = 0) {
    // Predictions remain distinct at every loop time, including the first frame.
    const closer = c.closer, r = PHYS.ratio(closer);
    let common = '', body = '';
    if (id === 1 || id === 3 || id === 8) {
      const h = id === 1 ? PHYS.cardExcessHeight(closer) : id === 3 ? r * 13 : PHYS.cardTideHeight(closer);
      const unit = id === 1 ? 12 : 13;
      common = path('M28 124h244M40 12v112', '#fff');
      for (let i = 0; i <= 8; i++) common += path(`M28 ${124 - i * 13}h244`, '#fff', true);
      common += path(`M42 ${124 - (id === 8 ? PHYS.cardTideHeight(PHYS.C.d0 / 2) : unit)}h218`, '#fff', true);
      body = slab(48, 124 - h, 204, h) + path(`M48 124v-${h}h204v${h}`);
      if (id === 3) for (let i = 1; i < r - 1e-6; i++) body += path(`M48 ${124 - i * unit}h204`);
      if (id !== 3) body += expansion();
    }
    if (id === 2) {
      const selected = PHYS.RAIL_NOTCHES.reduce((best, n, i, all) =>
        Math.abs(n.x - PHYS.railX(closer)) < Math.abs(all[best].x - PHYS.railX(closer)) ? i : best, 0);
      common = path('M25 118h250', '#fff') + PHYS.RAIL_NOTCHES.map((n, i) =>
        path(`M${30 + i * 40} 118V${118 - PHYS.ratio(n.closer) * 22}`, '#fff') + circle(30 + i * 40, 118, 5)).join('');
      const x = 30 + selected * 40;
      body = path(`M30 36H${x}M${x} 22v96m-10-84 10-12 10 12`) + circle(x, 118, 10) + slab(x - 10, 118 - PHYS.ratio(closer) * 22, 20, PHYS.ratio(closer) * 22);
    }
    if (id === 4) {
      common = circle(145, 70, 48, true) + path('M24 70h252', '#fff', true) + circle(281, 70, 9);
      const points = [];
      for (let i = 0; i <= 120; i++) {
        const a = i / 120 * Math.PI * 2, cosine = Math.cos(a);
        const active = c.key === 'both' || (c.key === 'near' ? cosine >= 0 : cosine <= 0);
        const radius = 48 + (active ? PHYS.cardTideHeight(closer) * cosine ** 2 : 0);
        points.push(`${i ? 'L' : 'M'}${145 + cosine * radius} ${70 + Math.sin(a) * radius}`);
      }
      body = path(points.join('') + 'Z') + expansion();
    }
    if (id === 5) {
      // These are explicit prediction hypotheses; the measured answer uses personWeightRatio.
      const weight = c.weightRatio ?? PHYS.personWeightRatio(closer), lift = PHYS.cardWeightLift(weight);
      common = path('M28 124h244M28 34h244M28 79h244', '#fff', true) + slab(55, 110, 190, 14);
      body = slab(55, 110 - lift, 190, 14) + path(`M55 ${110 - lift}h190v14H55z`);
      if (lift > 1) body += path(`M150 108v-${lift - 8}m-8 8 8-8 8 8`);
      else body += path('M65 108v18m25-18v18m120-18v18m25-18v18');
    }
    if (id === 6) {
      const radius = (c.key === 'speed' ? PHYS.angularSizeDeg(0) : PHYS.angularSizeDeg(closer)) * 4.7;
      const gap = (c.key === 'size' ? PHYS.apparentRateDegPerHour(0) : PHYS.apparentRateDegPerHour(closer)) * 1.75;
      common = path('M12 12h276v116H12zM125 12v116M140 70h146', '#fff', true) + circle(65, 70, PHYS.angularSizeDeg(0) * 4.7, true);
      for (let i = 0; i < 3; i++) common += circle(145 + i * PHYS.apparentRateDegPerHour(0) * 1.75, 70, 5, true);
      body = circle(65, 70, Math.max(2.5, radius)) + path(`M145 99h${2 * gap}m-8-6 8 6-8 6`);
      for (let i = 0; i < 3; i++) body += circle(145 + i * gap, 70, 7);
    }
    if (id === 7) {
      const f = PHYS.fractureState(closer);
      common = circle(150, 70, 54, true) + path('M20 70h260', '#fff', true);
      body = f.state === 'ring' ? Array.from({ length: 24 }, (_, i) => {
        const a = i / 24 * Math.PI * 2;
        return path(`M${150 + Math.cos(a) * 122} ${70 + Math.sin(a) * 46}l${Math.cos(a) * 9} ${Math.sin(a) * 9}`);
      }).join('') : circle(150, 70, 54) + (f.state === 'cracking' ? path('M137 18l20 23-25 22 32 20-27 21 18 19', '#fff') : '');
    }
    return svg(faint(common) + bold(body));
  }
  function principle(id, s) {
    const closer = s.closer, r = PHYS.ratio(closer);
    if (id === 1) return svg(circle(42, 55, 15, true) + circle(46, 55, 15) + arrow(65, 55, 35) + equal + bar(200, PHYS.ratio(0), 28) + bar(242, r, 28) + path('M195 90h75', '#fff', true));
    if (id === 2) return picture(id, { closer });
    if (id === 3) return svg(path('M15 45h100m-100-8v16m50-16v16m50-16v16', '#fff', true) + path(`M15 45h${100 * PHYS.frac(closer)}`, '#fff') + circle(15 + 100 * PHYS.frac(closer), 45, 10) + equal + bar(195, 1, 10) + arrow(220, 70, 25) + bar(265, r, 10));
    if (id === 4) return svg(ocean(closer) + arrow(42, 65, -22) + arrow(118, 65, 22) + circle(219, 33, 14) + path('M219 21v12h10', '#fff') + wave(closer, s.lon0, 2 * PHYS.tidePeriod(closer)));
    if (id === 5) return svg(circle(35, 36, 5) + path('M35 41v18m-9-10h18m-9 10-7 9m7-9 7 9', '#fff') + circle(62, 65, Math.max(1.5, (1 - PHYS.personWeightRatio(closer)) * 50)) + path('M160 30q5-8 10 0t10 0 10 0') + bar(210, r, 3) + path('M201 19l8-4 8 4m-16 7 8-4 8 4') + path('M55 100h190m-180-5v10m18-10v10m18-10v10', '#fff', true));
    if (id === 6) return picture(id, { key: 'both', closer });
    if (id === 7) return svg(circle(40, 70, 25) + arrow(75, 70, 35) + circle(150, 70, 25) + path('M145 46l8 14-12 11 14 10-8 13', '#fff') + arrow(180, 70, 28) + Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return circle(250 + Math.cos(a) * 34, 70 + Math.sin(a) * 17, 2); }).join(''));
    return svg(bar(45, s.wall, 3) + equal + bar(210, r, 3) + path(`M35 ${118 - s.wall * 3}h200`, '#fff', true) + circle(100 + PHYS.frac(closer) * 100, 112, 9));
  }
  function micro() {
    const gap = PHYS.tideH0() * PHYS.tideExcess(0.1), diameter = 0.28e-9, scale = 42 / diameter;
    return svg(circle(90, 70, 61) + path('M37 85h106', '#fff', true) + path(`M37 ${85 - gap * scale}h106`) + circle(223, 67, diameter * scale * 0.29) + circle(209, 81, diameter * scale * 0.16) + circle(237, 81, diameter * scale * 0.16) + path('M216 73l-4 4m18-4 4 4', '#fff') + path('M194 90h58m-58-5v10m58-10v10', '#fff'));
  }
  function actual(id, s) {
    return picture(id, { closer: s.closer, key: ['same', 'hundred-thousand', '8', 'both', 'same', 'both', PHYS.fractureState(s.closer).state, String(PHYS.frac(s.closer))][id - 1] });
  }
  return { picture, actual, principle, micro, bar, svg };
})();
