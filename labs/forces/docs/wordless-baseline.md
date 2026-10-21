# 글자 없는 화면 전환 전 기준선

## 1. 화면 측정

측정 시각: 2026-10-21T12:51:53.030Z. 뷰포트 1440×900, 기본 한국어, 기본 URL(모드 쿼리 없음).

단어는 화면 안 텍스트 노드의 공백 토큰 중 한글 음절·라틴 문자 연속 2자 이상 및 명시된 복합 단위 m/s, N·g이다. 중복 출현도 각각 센다. SVG text, 입력값(비었으면 placeholder), 선택된 select 문구를 포함한다. aria-label은 제외한다. 이모지는 텍스트 노드의 Extended_Pictographic 코드포인트 수이다. title은 보이는 소유 요소마다 별도로 센다.

시뮬레이션은 기존 step 훅으로 고정 시간 진행했다. 예상은 실제 .kopt 정답 버튼을 클릭했다. 성공은 물리 조작 후 실제 passed와 .kwin.on을 확인했다. 가림막 뒤 요소의 겹침·픽셀 가림, CSS 생성 콘텐츠, canvas/3D 텍스트는 DOM 검사 범위 밖이다. 화면 밖·잘린 토큰, 숨김·투명 요소는 제외한다.

| 모드 | 단계 | 국면 | 단어 수 | 처음 6개 단어 | 이모지 | 툴팁 | 스크린샷 / 미측정 이유 |
|---|---|---|---:|---|---:|---:|---|
| 쉬운 | 처음 | 인트로 | 35 | 저울 지구가 당기는 용수철 카드 자세히 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-intro.jpg) |
| 쉬운 | 퀘스트 0 | 조작 | 23 | 카드 자세히 모드 (선생님·중학생) 퀘스트 자유 | 0 | 13 | [JPEG](../shots/audit-baseline/kid-q0-play.jpg) |
| 쉬운 | 퀘스트 0 | 성공 | 21 | 오른쪽 당기기 바닥이 붙잡는 카드 당기는 | 0 | 13 | [JPEG](../shots/audit-baseline/kid-q0-success.jpg) |
| 쉬운 | 퀘스트 1 | 예상하기 | 8 | 카드 당기는 자세히 모드 (선생님·중학생) 퀘스트 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q1-predict.jpg) |
| 쉬운 | 퀘스트 1 | 조작 | 17 | 카드 당기는 자세히 모드 (선생님·중학생) 퀘스트 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q1-play.jpg) |
| 쉬운 | 퀘스트 1 | 성공 | 22 | 왼쪽 당기기 오른쪽 당기기 카드 당기는 | 0 | 13 | [JPEG](../shots/audit-baseline/kid-q1-success.jpg) |
| 쉬운 | 퀘스트 2 | 예상하기 | 10 | 카드 당기는 모두 합친 자세히 모드 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q2-predict.jpg) |
| 쉬운 | 퀘스트 2 | 조작 | 17 | 카드 당기는 모두 합친 자세히 모드 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q2-play.jpg) |
| 쉬운 | 퀘스트 2 | 성공 | 31 | 왼쪽 당기기 오른쪽 당기기 바닥이 붙잡는 | 0 | 13 | [JPEG](../shots/audit-baseline/kid-q2-success.jpg) |
| 쉬운 | 퀘스트 3 | 예상하기 | 19 | 저울 지구가 당기는 용수철 카드 당기는 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q3-predict.jpg) |
| 쉬운 | 퀘스트 3 | 조작 | 22 | 저울 지구가 당기는 용수철 카드 당기는 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q3-play.jpg) |
| 쉬운 | 퀘스트 3 | 성공 | 31 | 저울 지구가 당기는 용수철 카드 당기는 | 0 | 13 | [JPEG](../shots/audit-baseline/kid-q3-success.jpg) |
| 쉬운 | 퀘스트 4 | 예상하기 | 18 | 저울 카드 당기는 모두 합친 지구가 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q4-predict.jpg) |
| 쉬운 | 퀘스트 4 | 조작 | 21 | 저울 카드 당기는 모두 합친 지구가 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q4-play.jpg) |
| 쉬운 | 퀘스트 4 | 성공 | 41 | 저울 지구가 당기는 용수철 카드 당기는 | 0 | 13 | [JPEG](../shots/audit-baseline/kid-q4-success.jpg) |
| 쉬운 | 퀘스트 5 | 예상하기 | 18 | 카드 당기는 모두 합친 지구가 당기는 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q5-predict.jpg) |
| 쉬운 | 퀘스트 5 | 조작 | 28 | 카드 당기는 모두 합친 지구가 당기는 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q5-play.jpg) |
| 쉬운 | 퀘스트 5 | 성공 | 41 | 오른쪽 당기기 바닥이 붙잡는 카드 당기는 | 0 | 13 | [JPEG](../shots/audit-baseline/kid-q5-success.jpg) |
| 쉬운 | 퀘스트 6 | 예상하기 | 23 | 저울 지구가 당기는 용수철 카드 당기는 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q6-predict.jpg) |
| 쉬운 | 퀘스트 6 | 조작 | 28 | 저울 지구가 당기는 용수철 카드 당기는 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q6-play.jpg) |
| 쉬운 | 퀘스트 6 | 성공 | 60 | 저울 지구가 당기는 용수철 물이 밀어 | 0 | 13 | [JPEG](../shots/audit-baseline/kid-q6-success.jpg) |
| 쉬운 | 퀘스트 7 | 예상하기 | 26 | 저울 지구가 당기는 용수철 카드 당기는 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q7-predict.jpg) |
| 쉬운 | 퀘스트 7 | 조작 | 28 | 저울 지구가 당기는 용수철 카드 당기는 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q7-play.jpg) |
| 쉬운 | 퀘스트 7 | 성공 | 54 | 저울 지구가 당기는 물이 밀어 올리는 | 0 | 13 | [JPEG](../shots/audit-baseline/kid-q7-success.jpg) |
| 쉬운 | 퀘스트 8 | 예상하기 | 23 | 카드 당기는 모두 합친 지구가 당기는 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q8-predict.jpg) |
| 쉬운 | 퀘스트 8 | 조작 | 30 | 카드 당기는 모두 합친 지구가 당기는 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q8-play.jpg) |
| 쉬운 | 퀘스트 8 | 성공 | 41 | 왼쪽 당기기 오른쪽 당기기 바닥이 붙잡는 | 0 | 13 | [JPEG](../shots/audit-baseline/kid-q8-success.jpg) |
| 쉬운 | 퀘스트 9 | 조작 | 24 | 카드 당기는 모두 합친 지구가 당기는 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q9-play.jpg) |
| 쉬운 | 퀘스트 9 | 성공 | 51 | 오른쪽 당기기 바닥이 붙잡는 카드 당기는 | 0 | 13 | [JPEG](../shots/audit-baseline/kid-q9-success.jpg) |
| 쉬운 | 퀘스트 10 | 조작 | 20 | 카드 당기는 모두 합친 지구가 당기는 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-q10-play.jpg) |
| 쉬운 | 퀘스트 10 | 성공 | 48 | 카드 당기는 모두 합친 지구가 당기는 | 0 | 14 | [JPEG](../shots/audit-baseline/kid-q10-success.jpg) |
| 쉬운 | 끝 | 결과 | 20 | 카드 당기는 모두 합친 지구가 당기는 | 0 | 12 | [JPEG](../shots/audit-baseline/kid-end.jpg) |
| 쉬운 | 자유 실험 | 기본 | 25 | 카드 당기는 모두 합친 지구가 당기는 | 0 | 1 | [JPEG](../shots/audit-baseline/kid-free.jpg) |
| 자세히 | 기본 | 기본 | 129 | 나무 도막 kg m/s 유리 중력 | 0 | 0 | [JPEG](../shots/audit-baseline/full-default.jpg) |
| 자세히 | 수업 1단계 | 조작 | 126 | 나무 도막 kg m/s 유리 중력 | 0 | 0 | [JPEG](../shots/audit-baseline/full-lesson-1.jpg) |

요약: 측정 상태 **35개**, 미측정 **0개**, 단어 0개 상태 **0개**, 전체 단어 합 **1179개**, 이모지 총수 **0개**, 툴팁 총수 **398개**. 합계는 상태 간 중복을 포함한다.

## 2. 정적 점검

Node 정규식 grep으로 원본 소스를 검색했다. 아래 항목은 DOM 단어 합계에 포함되지 않는다. 코드·주석·비활성 경로도 검색하며, 각 행은 출처이지 화면 표시 횟수가 아니다.

| 분류 | 파일:줄 | 한 줄 요약(소스) |
|---|---|---|
| 3D·canvas 글자 | src/20-scene-kit.js:144 | function engravedPlate(text, w, h, opts = {}) { |
| 3D·canvas 글자 | src/20-scene-kit.js:158 | c.fillStyle = 'rgba(255,240,210,0.55)'; c.fillText(ln, W / 2 + 2, y + 2); |
| 3D·canvas 글자 | src/20-scene-kit.js:159 | c.fillStyle = 'rgba(40,24,8,0.92)'; c.fillText(ln, W / 2, y); |
| 3D·canvas 글자 | src/20-scene-kit.js:174 | function knobWithArc(opts) { |
| 3D·canvas 글자 | src/20-scene-kit.js:191 | for (const [f, txt] of ticks) { const a = ARC_START - f * ARC_SWEEP; c.fillText(txt, W / 2 + Math.cos(a) * W * 0.28, W / 2 - Math.sin(a) * W * 0.28); } |
| 3D·canvas 글자 | src/20-scene-kit.js:192 | c.font = font('mono', 26); c.fillStyle = 'rgba(255,179,107,0.9)'; c.fillText(opts.label \|\| '', W / 2, W * 0.86); |
| 3D·canvas 글자 | src/30-room-console.js:129 | const cf = new THREE.Mesh(new THREE.CircleGeometry(0.15, 48), new THREE.MeshStandardMaterial({ map: gaugeFaceTexture('N', 0, 10, 5), roughness: 0.5 })); cf.position.z = 0.026; clock.add(cf); |
| 3D·canvas 글자 | src/30-room-console.js:135 | function gaugeFaceTexture(unit, vmin, vmax, nMajor, sub = 5) { |
| 3D·canvas 글자 | src/30-room-console.js:146 | if (major) { c.font = font('mono', 36); c.fillText(String(Math.round(vmin + f * (vmax - vmin))), W / 2 + Math.cos(a) * W * 0.28, W / 2 - Math.sin(a) * W * 0.28); } |
| 3D·canvas 글자 | src/30-room-console.js:149 | c.font = font('mono', 30); c.fillStyle = '#5a5048'; c.fillText(unit, W / 2, W * 0.72); |
| 3D·canvas 글자 | src/30-room-console.js:156 | c.font = font('mono', 30); c.fillStyle = 'rgba(186,230,253,0.85)'; c.fillText('FREE-BODY DIAGRAM · ΣF = 0', 36, 56); |
| 3D·canvas 글자 | src/30-room-console.js:164 | c.font = font('mono', 26); c.fillText(lbl, x1 + (x1 > x0 ? 12 : x1 &lt; x0 ? -40 : 14), y1 + (y1 > y0 ? 4 : y1 &lt; y0 ? 20 : -12)); |
| 3D·canvas 글자 | src/30-room-console.js:175 | c.fillText('F = k·x', 60, H * 0.34); c.shadowBlur = 0; |
| 3D·canvas 글자 | src/30-room-console.js:180 | c.font = font('mono', 22); c.fillStyle = 'rgba(186,230,253,0.7)'; c.fillText('x →', x1 - 20, y0 - 12); c.fillText('F', x0 + 12, y1); |
| 3D·canvas 글자 | src/30-room-console.js:185 | c.font = font('mono', 26); c.fillStyle = 'rgba(186,230,253,0.85)'; c.fillText('BUOYANCY · B = ρ·g·V', 36, 52); |
| 3D·canvas 글자 | src/30-room-console.js:194 | c.font = font('mono', 24); c.fillStyle = 'rgba(125,211,252,0.95)'; c.fillText('B', bx + 42, by - bh * 0.76); c.fillStyle = 'rgba(255,179,107,0.95)'; c.fillText('W', bx - 70, by - bh * 0.1); |
| 3D·canvas 글자 | src/30-room-console.js:225 | const plate = engravedPlate('LUMEBENCH  ·  힘 관측대  ·  FORCE OBSERVATORY', 2.2, 0.052, { size: 0.46, letter: 0.08, rule: true, mat: new THREE.MeshStandardMaterial({ color: 0x9c7a46, roughness: 0.62, metalness: 0.75 }) }); |
| 3D·canvas 글자 | src/30-room-console.js:230 | const bLab = engravedPlate(en ? 'RUN' : '재생', 0.11, 0.026, { size: 0.6, screws: false }); bLab.position.set(-1.33, -0.15, Z + 0.002); panel.add(bLab); |
| 3D·canvas 글자 | src/30-room-console.js:242 | const lab = engravedPlate(txt, 0.34, 0.024, { size: 0.55, screws: false }); lab.position.set(-0.8, y - 0.052, Z + 0.002); panel.add(lab); |
| 3D·canvas 글자 | src/30-room-console.js:250 | const dG = knobWithArc({ radius: 0.052, color: 0xffb36b, label: en ? 'GRAVITY g' : '중력 가속도 g', ticks: P.map((p) => [gf(p.g), pn[p.id]]) }); |
| 3D·canvas 글자 | src/30-room-console.js:252 | const dJ = knobWithArc({ radius: 0.052, color: 0x7dd3fc, label: en ? 'TANK HEIGHT' : '수조 높이', ticks: [[0, '0'], [0.5, '14'], [1, '28 cm']] }); |
| 3D·canvas 글자 | src/30-room-console.js:257 | const aLab = engravedPlate(en ? 'FORCE LEDGER' : '힘 장부 · 받는 힘', 0.3, 0.022, { size: 0.55, screws: false }); aLab.position.set(0.74, -0.185, Z + 0.002); panel.add(aLab); |
| 3D·canvas 글자 | src/30-room-console.js:258 | const bLab2 = engravedPlate(en ? 'RECORD GRAPH' : '기록 그래프', 0.3, 0.022, { size: 0.55, screws: false }); bLab2.position.set(1.27, -0.185, Z + 0.002); panel.add(bLab2); |
| 3D·canvas 글자 | src/30-room-console.js:272 | for (let x = 80; x &lt; W; x += 160) c.fillText(`${x / 8}`, x + 3, 14); |
| 3D·canvas 글자 | src/40-hero.js:57 | function hangScaleTexture() { |
| 3D·canvas 글자 | src/40-hero.js:65 | if (major) { c.font = font('mono', 54); c.fillText(String(F), 84, py); } |
| 3D·canvas 글자 | src/40-hero.js:67 | c.font = font('mono', 40); c.fillText('N', 92, H - 40); |
| 3D·canvas 글자 | src/40-hero.js:71 | function trackScaleTexture(dir) { |
| 3D·canvas 글자 | src/40-hero.js:78 | if (major) { c.font = font('mono', 58); c.fillText(String(F), px, 52); } |
| 3D·canvas 글자 | src/40-hero.js:105 | const grad = new THREE.Mesh(new THREE.PlaneGeometry(0.02, PC.hang.casing), new THREE.MeshStandardMaterial({ map: hangScaleTexture(), roughness: 0.7 })); |
| 3D·canvas 글자 | src/40-hero.js:169 | for (let cm = -60; cm &lt;= 170; cm++) { const xw = -0.10 + cm / 100; if (xw &lt; x0w \|\| xw > x0w + wl) continue; const px = (xw - x0w) / wl * W; const mj = cm % 10 === 0; c.fillRect(px, 0, mj ? 3 : 1.5, mj ? 22 : cm % 5 === 0 ? 15 : 9); if (mj & |
| 3D·canvas 글자 | src/40-hero.js:205 | T.texs = { 1: trackScaleTexture(1), '-1': trackScaleTexture(-1) }; |
| 3D·canvas 글자 | src/40-hero.js:348 | for (let mm = 0; mm &lt;= 300; mm += 5) { const py = 40 + mm / 300 * (H - 80), mj = mm % 50 === 0; c.fillRect(0, py - 1, mj ? 80 : mm % 10 === 0 ? 50 : 28, mj ? 4 : 2); if (mj) { c.font = font('mono', 50); c.fillText(String(mm / 10), 92, py);  |
| 3D·canvas 글자 | src/40-hero.js:349 | c.font = font('mono', 34); c.fillText('cm', 92, H - 20); |
| 3D·canvas 글자 | src/40-hero.js:361 | for (let cm = 0; cm &lt;= n; cm++) { const px = cm / n * W, mj = cm % 10 === 0; c.fillRect(px - (mj ? 2 : 1), 0, mj ? 4 : 2, mj ? 40 : cm % 5 === 0 ? 26 : 14); if (mj) c.fillText(String(cm), Math.min(Math.max(px, 24), W - 24), 76); } |
| 3D·canvas 글자 | src/65-kid.js:491 | c.fillStyle = `rgba(17,24,39,${al})`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, bx + tw / 2, y); |
| 3D·canvas 글자 | src/65-kid.js:507 | c.font = '700 14px "Noto Sans KR", system-ui, sans-serif'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(20,16,12,.8)'; const tx = L2('끌어요', 'drag'); c.strokeText(tx, x0, y0 - 30); c.fillStyle = '#fde68a'; c.fillText(tx, x0 |
| 3D·canvas 글자 | src/65-kid.js:511 | c.font = '700 14px "Noto Sans KR", system-ui, sans-serif'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(20,16,12,.8)'; const tx = L2('눌러요', 'tap'); c.strokeText(tx, x0, y0 - 30); c.fillStyle = '#fde68a'; c.fillText(tx, x0, |
| 3D·canvas 글자 | src/65-kid.js:521 | c.fillStyle = DRAG.kind === 'jack' ? '#7dd3fc' : '#c4b5fd'; c.fillText(txt, x, y); |
| 3D·canvas 글자 | src/65-kid.js:528 | for (const f of F.floats) { f.t += dt; const a = Math.max(0, 1 - f.t / 1.3), y = f.y - f.t * 50; c.globalAlpha = a; c.font = '700 22px Outfit, "Noto Sans KR", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4;  |
| 3D·canvas 글자 | src/65-kid.js:566 | function handAt(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.font = '34px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'top'; c.shadowColor = 'rgba(0,0,0,.6) |
| 3D·canvas 글자 | src/66-themes.js:83 | x.fillStyle = '#fde68a'; x.font = '120px "Segoe UI Emoji", "Noto Color Emoji", sans-serif'; x.textAlign = 'center'; x.fillText('👑', TW / 2, 220); |
| 3D·canvas 글자 | src/66-themes.js:92 | x.font = '700 64px "Noto Sans KR", sans-serif'; x.fillStyle = 'rgba(255,255,255,.7)'; x.fillText('힘 = 밀기 · 당기기', TW * 0.18, 140); x.fillText('1 N', TW * 0.75, 420); x.fillText('⭕ ❌', TW * 0.3, 470); |
| 3D·canvas 글자 | src/68-director.js:250 | c.fillStyle = cols[0]; c.fillText(names[0], x0, 4); const w0 = c.measureText(names[0]).width; |
| 3D·canvas 글자 | src/68-director.js:251 | c.fillStyle = cols[1]; c.fillText(names[1], x0 + w0 + 10, 4); |
| 3D·canvas 글자 | src/70-loop.js:112 | function drawScreenA(c, W, H) { |
| 3D·canvas 글자 | src/70-loop.js:117 | c.fillText(hang ? (en ? 'HANGING OBJECT · up +' : '매단 물체가 받는 힘 · 위 +') : (en ? 'BLOCK · right +' : '도막이 받는 힘 · 오른쪽 +'), 16, 16); |
| 3D·canvas 글자 | src/70-loop.js:129 | c.font = font('mono', 16); c.fillStyle = bold ? '#fff' : 'rgba(230,240,248,0.85)'; c.textAlign = 'left'; c.fillText(name, 14, y); |
| 3D·canvas 글자 | src/70-loop.js:131 | c.fillText(`${v >= 0 ? '+' : '−'}${fx(Math.abs(v), 2)} N`, xm + w + (v >= 0 ? 6 : -6), y); |
| 3D·canvas 글자 | src/70-loop.js:138 | if (hang) c.fillText(en ? `m ${fx(r.m * 1000, 0)} g · g ${fx(r.g, 1)} m/s²` : `질량 ${fx(r.m * 1000, 0)} g · g ${fx(r.g, 1)} m/s²`, 14, H - 16); |
| 3D·canvas 글자 | src/70-loop.js:139 | else c.fillText(en ? `vertical: W ${fx(F.W, 2)} ↓ = N ${fx(F.N, 2)} ↑ · a ${fx(F.a, 2)} m/s²` : `위아래: 중력 ${fx(F.W, 2)}↓ = 수직항력 ${fx(F.N, 2)}↑ · a ${fx(F.a, 2)} m/s²`, 14, H - 16); |
| 3D·canvas 글자 | src/70-loop.js:148 | function drawScreenB(c, W, H) { |
| 3D·canvas 글자 | src/70-loop.js:153 | const lab = (t, x, y, al = 'left', col = 'rgba(186,230,253,0.75)') => { c.textAlign = al; c.fillStyle = col; c.fillText(t, x, y); }; |
| 음성 | src/65-kid.js:143 | function speak(html, force) { |
| 음성 | src/65-kid.js:145 | const sy = window.speechSynthesis; if (!sy \|\| (!VOICE.on && !force) \|\| S.mode !== 'kid') return; |
| 음성 | src/65-kid.js:147 | sy.cancel(); const u = new SpeechSynthesisUtterance(tx); u.lang = isEn() ? 'en-US' : 'ko-KR'; u.rate = 0.95; u.pitch = 1.15; |
| 음성 | src/65-kid.js:149 | sy.speak(u); |
| 음성 | src/65-kid.js:152 | function speakOnce(key, html) { if (VOICE.key === key) return; VOICE.key = key; speak(html); } |
| 음성 | src/65-kid.js:315 | el.querySelector('.ksnd').onclick = () => { VOICE.on = !VOICE.on; setSound(VOICE.on); ensureAudio(); if (!VOICE.on) try { speechSynthesis.cancel(); } catch (e) {} this.hud(); }; |
| 음성 | src/65-kid.js:346 | box.querySelectorAll('.kban .ksay2').forEach((b) => (b.onclick = () => speak(`${t[0]}. ${t[1]}`, true))); |
| 음성 | src/65-kid.js:347 | const pb = box.querySelector('.kpred .ksay2'); if (pb) pb.onclick = () => { const p = m.pred[LANG] \|\| m.pred.ko; speak(`${p[0]} ${p[1].join(', ')}`, true); }; |
| 음성 | src/65-kid.js:348 | const qb = box.querySelector('.kquiz .ksay2'); if (qb) qb.onclick = () => speak(this.quizSpeech(), true); |
| 음성 | src/65-kid.js:349 | box.querySelector('.kwhybtn').onclick = () => { box.querySelector('.kwin').classList.toggle('open'); speak(m.quiz ? '' : m.win(), true); }; |
| 음성 | src/65-kid.js:441 | w.classList.remove('open'); speak(quiz ? w.querySelector('.kwintxt').textContent : `${L2('미션 성공!', 'Mission clear!')} ${m.win()}`); |
| 음성 | src/65-kid.js:598 | el.querySelector('.kilisten').onclick = () => speak(t.slice(1, 5).map((q) => q[1]).join(' '), true); |
| 캐릭터·마스코트 | src/65-kid.js:78 | function quokka(mood = '') { |
| 캐릭터·마스코트 | src/65-kid.js:330 | else if (ph === 'predict') { const p = m.pred[LANG] \|\| m.pred.ko; body = `&lt;div class="kmodal">&lt;div class="kbox kpred">&lt;div class="kmh">&lt;div class="kav sm">${quokka('think')}&lt;/div>&lt;div>&lt;div class="keye">${L2('예상하기', 'Predict')}&lt;/div>&lt;div cla |
| 캐릭터·마스코트 | src/65-kid.js:337 | box.innerHTML = `&lt;div class="kban${m.boss ? ' boss' : ''}">&lt;div class="kav">${quokka()}&lt;/div>&lt;div class="kbtxt">&lt;div class="keye">${m.boss ? L2('도전 과제', 'Challenge') : 'Step ' + m.stage}&lt;i>&lt;/i>${(STAGE[LANG] \|\| STAGE.ko)[m.stage]}&lt;/div>&lt;div |
| 캐릭터·마스코트 | src/65-kid.js:592 | el.querySelector('.box').innerHTML = `&lt;div class="kav lg">${quokka('win')}&lt;/div>&lt;div class="keye">${L2('힘의 작용 · 과학 실험실', 'Forces · Science lab')}&lt;/div>&lt;h2>${t[0]}&lt;/h2>&lt;div class="kitiles">${tiles.map(([ic, tx]) => `&lt;div class="kitile">&lt;span |

이모지 리터럴 포함 줄: **25줄** (src/*.js 및 src/00-head.html, 한 줄에 여러 개여도 1줄). 대표 5줄:

| 파일:줄 | 소스 |
|---|---|
| src/65-kid.js:11 | predT: { ko: '🤔 먼저 예상해 보세요!', en: '🤔 Make a guess first!' }, mine: { ko: '내 예상', en: 'My guess' }, |
| src/65-kid.js:12 | hit: { ko: '🎯 예상 적중! 보너스', en: '🎯 Good guess! Bonus' }, |
| src/65-kid.js:13 | miss: { ko: '😮 예상과 달랐어요! 결과를 보고 생각을 고치는 게 바로 과학이에요.', en: '😮 Not what you guessed! Changing your mind from evidence is real science.' }, |
| src/65-kid.js:15 | soundOn: { ko: '🔇 소리 켜기', en: '🔇 Sound on' }, soundOff: { ko: '🔊 소리 끄기', en: '🔊 Sound off' }, |
| src/65-kid.js:16 | qNext: { ko: '다음 문제 →', en: 'Next question →' }, yes: { ko: '⭕ 맞아요', en: '⭕ True' }, no: { ko: '❌ 아니에요', en: '❌ False' }, |

| 언어 사전·퀘스트 | 항목 수 | 기준 |
|---|---:|---|
| KTX (src/65-kid.js:5) | 23 | 최상위 키 또는 배열 항목, 번역은 별도 항목으로 중복 계산하지 않음 |
| STAGE (src/65-kid.js:25) | 2 | 언어 2개, 각 11항목(빈 0번 포함), 유효 단계 10개 |
| KID_NAME (src/65-kid.js:30) | 2 | 언어 2개, 언어당 9개 |
| CARDS (src/65-kid.js:36) | 7 | 최상위 키 또는 배열 항목, 번역은 별도 항목으로 중복 계산하지 않음 |
| KID_QUIZ (src/65-kid.js:70) | 4 | 최상위 키 또는 배열 항목, 번역은 별도 항목으로 중복 계산하지 않음 |
| 퀘스트 t: | 11 | src/65-kid.js:160, src/65-kid.js:170, src/65-kid.js:191, src/65-kid.js:201, src/65-kid.js:211, src/65-kid.js:226, src/65-kid.js:242, src/65-kid.js:253, src/65-kid.js:263, src/65-kid.js:274, src/65-kid.js:286 |
| 퀘스트 pred: | 8 | src/65-kid.js:171, src/65-kid.js:192, src/65-kid.js:202, src/65-kid.js:212, src/65-kid.js:227, src/65-kid.js:243, src/65-kid.js:254, src/65-kid.js:264 |
| 퀘스트 win: | 10 | src/65-kid.js:165, src/65-kid.js:186, src/65-kid.js:197, src/65-kid.js:206, src/65-kid.js:221, src/65-kid.js:237, src/65-kid.js:248, src/65-kid.js:258, src/65-kid.js:269, src/65-kid.js:284 |

## 3. 페이지 오류

console error / pageerror: 0건.

