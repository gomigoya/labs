# Graph Report - labs  (2026-10-22)

## Corpus Check
- 65 files · ~185,162 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .csv 1, .toml 1)

## Summary
- 843 nodes · 1195 edges · 55 communities (48 shown, 7 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b6c5e923`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- forces/src/60-interaction-hud.js
- forces/src/70-loop.js
- forces/src/20-scene-kit.js
- hydraulic-ram/src/20-scene-kit.js
- hydraulic-ram/src/70-loop.js
- 65-kid.js
- forces/src/40-hero.js
- 68-director.js
- forces/src/50-lights-pipeline-camera.js
- hydraulic-ram/src/60-interaction-hud.js
- hydraulic-ram/src/50-lights-pipeline-camera.js
- hydraulic-ram/src/40-hero.js
- 이론 카드 — 힘의 작용 (중학교 과학 9과05)
- 이론 카드 — 수격펌프 (Hydraulic Ram Pump)
- 67-kid-handles.js
- 69-depict.js
- build.mjs
- 퀘스트 지도 — 힘의 작용 (수업 흐름)
- forces/tools/assemble.mjs
- 비평 로그 — 수격펌프
- forces/src/30-room-console.js
- hydraulic-ram/src/30-room-console.js
- capture.mjs
- 66-themes.js
- scripts
- serve.mjs
- forces/tools/hand-check.mjs
- test-physics.mjs
- 사이트 공통 추가 규칙 (master-lab-prompt.md 뒤에 붙인다)
- Lumebench (가칭) — 인터랙티브 과학 실험실 사이트
- 검수자용 요약 — 수격펌프 (Hydraulic Ram)
- 수격펌프 관측대 (Hydraulic Ram)
- ref_node_fs
- hydraulic-ram/tools/hand-check.mjs
- 기획: 글 없이 읽히는 과학 실험실 (마스터 프롬프트 개정)
- 검수자용 요약 — 힘의 작용 (9과05)
- 71-cues.js
- 폼 문항 초안 (Tally 기준)
- share
- 브랜드 이름 후보
- 퀘스트 지도 — 수격펌프
- 검수 기록 — 힘의 작용
- CLAUDE.md
- forces/src/15-physics.js
- hydraulic-ram/src/15-physics.js
- fetch
- 45-balance.js
- 3. 개선 항목
- text-audit.mjs
- i-scream 「물체의 무게」 가상실험 두 개 분석과 반영
- 글자 없는 화면 전환 전 기준선
- forces 실험실 '글 없는 기준' 이전 설계 (P0-1)
- 64-kid-cards.js

## God Nodes (most connected - your core abstractions)
1. `이론 카드 — 힘의 작용 (중학교 과학 9과05)` - 19 edges
2. `이론 카드 — 수격펌프 (Hydraulic Ram Pump)` - 19 edges
3. `init()` - 11 edges
4. `onPointerDown()` - 10 edges
5. `dirFrame()` - 10 edges
6. `update()` - 10 edges
7. `init()` - 10 edges
8. `update()` - 10 edges
9. `비평 로그 — 수격펌프` - 10 edges
10. `dirOn()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `직접 써 보고 고친 것 (조작 원칙)` --references--> `applyViewOffset()`  [INFERRED]
  labs/forces/docs/quest-map.md → labs/forces/src/50-lights-pipeline-camera.js
- `직접 써 보고 고친 것 (조작 원칙)` --references--> `khFresh()`  [INFERRED]
  labs/forces/docs/quest-map.md → labs/forces/src/67-kid-handles.js
- `연출 기법 → 구현` --references--> `dirGrab()`  [INFERRED]
  labs/forces/docs/quest-map.md → labs/forces/src/68-director.js
- `U5 — 캔버스·3D·조건부 글 (2026-10-21)` --references--> `dirTeleReset()`  [INFERRED]
  labs/forces/docs/wordless-migration.md → labs/forces/src/68-director.js
- `U5 — 캔버스·3D·조건부 글 (2026-10-21)` --references--> `engravedPlate()`  [INFERRED]
  labs/forces/docs/wordless-migration.md → labs/hydraulic-ram/src/20-scene-kit.js

## Import Cycles
- None detected.

## Communities (55 total, 7 thin omitted)

### Community 0 - "forces/src/60-interaction-hud.js"
Cohesion: 0.09
Nodes (27): AUD, cycle(), DRAG, ensureAudio(), FLUIDS, HANG_KINDS, hoverUpdate(), KEYMAP (+19 more)

### Community 1 - "forces/src/70-loop.js"
Cohesion: 0.06
Nodes (43): onKeyUp(), onPointerUp(), applyPreset(), axes(), buildStudio(), capture(), clampJack(), DEC (+35 more)

### Community 2 - "forces/src/20-scene-kit.js"
Cohesion: 0.07
Nodes (37): bevelFrame(), bigButton(), camera, canvas, canvasTex(), FONT, glassJar(), graphScreen() (+29 more)

### Community 3 - "hydraulic-ram/src/20-scene-kit.js"
Cohesion: 0.07
Nodes (38): bevelFrame(), bigButton(), camera, canvas, canvasTex(), engravedPlate(), FONT, glassJar() (+30 more)

### Community 4 - "hydraulic-ram/src/70-loop.js"
Cohesion: 0.07
Nodes (40): onKeyUp(), onPointerUp(), applyPreset(), buildStudio(), buildWeights(), capture(), drawScreenA(), drawScreenB() (+32 more)

### Community 5 - "65-kid.js"
Cohesion: 0.14
Nodes (23): CARDS, ico(), ICON, initKid(), isEn(), kcb(), KID, KID_AT (+15 more)

### Community 6 - "forces/src/40-hero.js"
Cohesion: 0.07
Nodes (37): _am, ARROW_GEO, _ax, _ay, _az, blockX(), buildHangStation(), buildHero() (+29 more)

### Community 7 - "68-director.js"
Cohesion: 0.12
Nodes (29): 연출 기법 → 구현, 자유 실험실 + 연출 층 (`src/68-director.js`), 직접 써 보고 고친 것 (조작 원칙), CARD_AT, _dd, DIR, dirAt(), dirCallout() (+21 more)

### Community 8 - "forces/src/50-lights-pipeline-camera.js"
Cohesion: 0.08
Nodes (29): U4: 글 없는 결과와 힘 카드 앨범, 개발, 양팔저울 · 수평 잡기 (B1), 힘의 작용 — 힘이 보인다, applyViewOffset(), BALANCE_SHOTS, buildCamera(), CAM (+21 more)

### Community 9 - "hydraulic-ram/src/60-interaction-hud.js"
Cohesion: 0.10
Nodes (28): AUD, captionFor(), DRAG, ensureAudio(), fL(), fx(), hasBatchim(), hoverUpdate() (+20 more)

### Community 10 - "hydraulic-ram/src/50-lights-pipeline-camera.js"
Cohesion: 0.11
Nodes (22): buildCamera(), CAM, evalShot(), FinishShader, flyTo(), heroShot(), heroTargets(), hudRects() (+14 more)

### Community 11 - "hydraulic-ram/src/40-hero.js"
Cohesion: 0.09
Nodes (21): buildHero(), CHAMBER, deliveryPath(), drivePath(), DTANK, HERO, _m4, nozzleY() (+13 more)

### Community 12 - "이론 카드 — 힘의 작용 (중학교 과학 9과05)"
Cohesion: 0.10
Nodes (19): a. 한 줄 통찰, b. 3단계 학습 경로, c. 보이지 않는 주인공, d. 영웅 장치와 방, e. 지배 방정식, f. 조작 변수, g. 시나리오 프리셋, h. 오버레이 (+11 more)

### Community 13 - "이론 카드 — 수격펌프 (Hydraulic Ram Pump)"
Cohesion: 0.10
Nodes (19): a. 한 줄 통찰, b. 3단계 학습 경로, c. 보이지 않는 주인공과 시각 형태, d. 영웅 장치와 방, e. 지배 방정식, f. 조작 변수, g. 이야기형 프리셋, h. 오버레이 (+11 more)

### Community 14 - "67-kid-handles.js"
Cohesion: 0.18
Nodes (16): KH, KH_DOCK, KH_GOAL, KH_PICK, KH_RAIL, KH_STATION, khBuild(), khDirF() (+8 more)

### Community 15 - "69-depict.js"
Cohesion: 0.16
Nodes (15): dirLens(), LENS, lensNow(), microSVG(), NOTE, NOTE_KEYS, NOTE_Q, noteAdd() (+7 more)

### Community 16 - "build.mjs"
Cohesion: 0.13
Nodes (16): ALL, BASE, cfg, copyDir(), DIST, esc(), galleryHtml(), injectLab() (+8 more)

### Community 17 - "퀘스트 지도 — 힘의 작용 (수업 흐름)"
Cohesion: 0.13
Nodes (13): 1. 과정 묘사, 2. 보이지 않는 것을 보이게, 3. 결과 묘사, 4. 그림 규칙: 실험실에는 삽화를 넣지 않는다, 5. 글 없이 읽히는 장면 문법 (쉬운 모드·자세히 모드 공통, `src/71-cues.js`), 실험 과정과 결과를 한눈에 — 과학 실험실 묘사 원칙, U3 쉬운 모드 퀘스트 그림 문법, 과정·결과 묘사 (`src/69-depict.js`) (+5 more)

### Community 18 - "forces/tools/assemble.mjs"
Cohesion: 0.15
Nodes (10): dir, files, head, js, src, dir, files, head (+2 more)

### Community 19 - "비평 로그 — 수격펌프"
Cohesion: 0.17
Nodes (11): 남은 문제 (다음 라운드 후보), 라운드 0 — 히어로 구도 (shots/r0-hero*.jpg), 라운드 1 — HUD 포함 첫 캡처 (shots/r1), 라운드 2 — 전체 세트 (shots/r2, 28장, 에러 0, 가로 스크롤 0), 라운드 3 — (shots/r3, 28장, 에러 0, 가로 스크롤 0), 라운드 4 — 최종 세트 (shots/r4, 28장, 에러 0, 가로 스크롤 0) + 성능, 라운드 5 — 사이트 빌드 통합 (dist, shots/dist), 비평 로그 — 수격펌프 (+3 more)

### Community 20 - "forces/src/30-room-console.js"
Cohesion: 0.31
Nodes (10): buildConsole(), buildRoom(), CONSOLE, drawDiagramBuoy(), drawDiagramFBD(), drawDiagramHooke(), floorTexture(), gaugeFaceTexture() (+2 more)

### Community 21 - "hydraulic-ram/src/30-room-console.js"
Cohesion: 0.31
Nodes (10): buildConsole(), buildRoom(), CONSOLE, drawDiagramEfficiency(), drawDiagramHammer(), drawDiagramSection(), floorTexture(), gaugeFaceTexture() (+2 more)

### Community 22 - "capture.mjs"
Cohesion: 0.18
Nodes (7): { chromium }, OUT, report, require, STATES, URL, VIEWPORTS

### Community 23 - "66-themes.js"
Cohesion: 0.29
Nodes (8): buildThemes(), FLOOR_CACHE, floorTex(), THEME, THEME_FLOOR, themeCanvas(), themeTarget(), updateTheme()

### Community 24 - "scripts"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, build:all, deploy, deploy:proxy, serve (+1 more)

### Community 25 - "serve.mjs"
Cohesion: 0.24
Nodes (7): port, ROOT, save(), serveFile(), server, SHOTS, TYPES

### Community 26 - "forces/tools/hand-check.mjs"
Cohesion: 0.29
Nodes (7): check(), near(), PHYS, pts, rows, src, w

### Community 27 - "test-physics.mjs"
Cohesion: 0.25
Nodes (6): cases, m, PHYS, src, sw, t0

### Community 28 - "사이트 공통 추가 규칙 (master-lab-prompt.md 뒤에 붙인다)"
Cohesion: 0.25
Nodes (7): 1. 품질 단계 (학교 크롬북 대응), 2. 사이트 셸과 겹치지 않기, 3. 다국어, 4. 메타와 썸네일, 5. 검수자용 요약본, 6. 영상 소스, 사이트 공통 추가 규칙 (master-lab-prompt.md 뒤에 붙인다)

### Community 29 - "Lumebench (가칭) — 인터랙티브 과학 실험실 사이트"
Cohesion: 0.25
Nodes (7): Lumebench (가칭) — 인터랙티브 과학 실험실 사이트, 결정 기록, 구조, 명령, 배포 (Cloudflare Pages + Worker), 새 실험실 추가, 품질 단계

### Community 30 - "검수자용 요약 — 수격펌프 (Hydraulic Ram)"
Cohesion: 0.29
Nodes (6): 1. 모델, 2. 지배 방정식, 3. 손계산 대조 (`node tools/hand-check.mjs src/15-physics.js`), 4. 화면 과장과 근사, 5. 검수 순서 제안 (30분), 검수자용 요약 — 수격펌프 (Hydraulic Ram)

### Community 31 - "수격펌프 관측대 (Hydraulic Ram)"
Cohesion: 0.29
Nodes (6): 결정 기록, 과장 스케일, 근사와 한계, 수격펌프 관측대 (Hydraulic Ram), 실행, 조작

### Community 32 - "ref_node_fs"
Cohesion: 0.29
Nodes (5): m, p, PHYS, s, src

### Community 33 - "hydraulic-ram/tools/hand-check.mjs"
Cohesion: 0.29
Nodes (3): PHYS, rows, src

### Community 34 - "기획: 글 없이 읽히는 과학 실험실 (마스터 프롬프트 개정)"
Cohesion: 0.29
Nodes (6): 1. 진단: 지금 프롬프트가 글을 만들어 내는 지점, 2. 방향, 3. 바뀌는 문서, 4. 근거 (forces 실험실을 실제로 써 보며 얻은 것), 기획: 글 없이 읽히는 과학 실험실 (마스터 프롬프트 개정), 목표

### Community 35 - "검수자용 요약 — 힘의 작용 (9과05)"
Cohesion: 0.33
Nodes (5): 검수자용 요약 — 힘의 작용 (9과05), 교육과정 대응, 근사와 과장, 대표 상태 3개 (입력 → 화면 표시 → 손계산), 지배 방정식

### Community 36 - "71-cues.js"
Cohesion: 0.40
Nodes (3): CUE, cueTrackState(), updateCues()

### Community 37 - "폼 문항 초안 (Tally 기준)"
Cohesion: 0.40
Nodes (4): 영어판 (6주차 전에 만든다), 폼 A. 새 실험실 알림 받기 (대기자 명단), 폼 B. 기관용 맞춤 실험실 의뢰, 폼 문항 초안 (Tally 기준)

### Community 38 - "share"
Cohesion: 0.70
Nodes (4): mount(), setLite(), share(), toast()

### Community 39 - "브랜드 이름 후보"
Cohesion: 0.50
Nodes (3): 구매 전 확인 (사용자), 브랜드 이름 후보, 피한 이름

### Community 40 - "퀘스트 지도 — 수격펌프"
Cohesion: 0.50
Nodes (3): 단계별 설명 문장 규칙, 비유·과장 구분, 퀘스트 지도 — 수격펌프

### Community 48 - "45-balance.js"
Cohesion: 0.24
Nodes (16): BAL, BAL_ORIGIN, balanceClips(), balanceDown(), balanceMove(), balanceParams(), balancePlace(), balancePos() (+8 more)

### Community 49 - "3. 개선 항목"
Cohesion: 0.13
Nodes (14): 1. 조사 요약, 2. 이미 앞서 있는 것 (유지), 3. 개선 항목, 4. 하지 않을 것, 5. 이 조사의 한계, P0-1. forces 쉬운 모드를 새 기준으로 맞춘다, P1-1. 교과 성취기준으로 탐색하게 한다, P1-2. 교사 시연에 "화면 가리기"와 타이머를 넣는다 (+6 more)

### Community 50 - "text-audit.mjs"
Cohesion: 0.17
Nodes (10): cell(), errors, require, root, sourceTokens(), STATIC_ALLOW, staticAudit(), u5 (+2 more)

### Community 51 - "i-scream 「물체의 무게」 가상실험 두 개 분석과 반영"
Cohesion: 0.25
Nodes (7): 1. 대상, 2. 실험 A: 수평 잡기 (page082), 3. 실험 B: 용수철 길이 측정 (page084) [코드·실행], 4. 아쉬운 점 (우리가 고칠 것), 5. 우리 랩에 반영, 6. 조사의 한계, i-scream 「물체의 무게」 가상실험 두 개 분석과 반영

### Community 52 - "글자 없는 화면 전환 전 기준선"
Cohesion: 0.40
Nodes (4): 1. 화면 측정, 2. 정적 점검, 3. 페이지 오류, 글자 없는 화면 전환 전 기준선

### Community 53 - "forces 실험실 '글 없는 기준' 이전 설계 (P0-1)"
Cohesion: 0.18
Nodes (10): 1. 지금과 새 기준의 차이 (코드 확인 사실), 2. 설계 결정 (사용자가 번복할 수 있음), 3. 작업 단위 (각 단위는 검증 가능한 상태로 끝난다), 4. 지키는 것, 5. 위험, forces 실험실 '글 없는 기준' 이전 설계 (P0-1), U5 — 캔버스·3D·조건부 글 (2026-10-21), U6 — 5초 테스트 가독성 수정 (2026-10-22, 브라우저 확인 대기) (+2 more)

### Community 54 - "64-kid-cards.js"
Cohesion: 0.44
Nodes (8): balancePicture(), cardArrow(), cardBeam(), cardDots(), cardSVG(), kidAlbum(), kidForceGlyph(), kidPrincipleCard()

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `직접 써 보고 고친 것 (조작 원칙)` connect `68-director.js` to `forces/src/50-lights-pipeline-camera.js`, `67-kid-handles.js`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `init()` (e.g. with `onKey()` and `onKeyUp()`) actually correct?**
  _`init()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Should `forces/src/60-interaction-hud.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0928030303030303 - nodes in this community are weakly interconnected._
- **Why does `applyViewOffset()` connect `forces/src/50-lights-pipeline-camera.js` to `68-director.js`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `forces/src/70-loop.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06291591046581972 - nodes in this community are weakly interconnected._
- **Should `forces/src/20-scene-kit.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0666049953746531 - nodes in this community are weakly interconnected._
- **Should `hydraulic-ram/src/20-scene-kit.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0673758865248227 - nodes in this community are weakly interconnected._