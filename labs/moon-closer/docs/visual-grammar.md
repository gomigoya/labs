# 원리에서 표현으로 — 달이 가까워지면

[이론 카드 g절](theory-card.md)을 수업용 표현 층으로 확장했습니다. 아래 이름은 설계상 의미 이름입니다. 현재 `window.__lab.layer()`는 `room, console, hero, ocean, reference, beads, ring`을 받으므로 아래 이름을 실행 키로 사용하지 마십시오. 교사 도구의 완성 여부는 별도 검수합니다.

## 공통 규칙

달의 당김은 은백, 조석의 차이는 청록, 해수면은 파랑입니다. 현재 상태는 실선·발광, 바꾸기 전 기준은 흰 점선, 과거 시간은 회색 잔상으로 나타냅니다. 색뿐 아니라 화살촉·마디·윤곽·명도를 함께 사용합니다. 한 원리에 필요한 층부터 켜고 비교가 끝나면 덜어 냅니다.

| 층 | 의미와 원리 → 표현 | 색·선 규칙 | 채택 이유 |
|---|---|---|---|
| `marks` | H/H₀를 H₀ 한 마디씩 쌓음. 거리 칸마다 계단 기록, 현재와 바꾼 뒤의 마디 비교 | 조석 마디 청록 실선, 해수면 파랑 실선, 원래 바다 흰 점선. 지구 지름 마디는 거리 기준으로 분리 | 숫자를 읽기 전에도 1/2 거리의 8마디, 1/3의 27마디를 비교합니다. 로그 레일의 화면 간격을 실제 거리로 오독하지 않게 합니다. |
| `field` | 지구 단면의 차등 작용을 방향 입자로 나타냄. 방향=늘어나는 쪽, 밀도·밝기=세기 | 현재 작용 청록 스트릭, 기준 흰 점선. 입자는 물의 실제 수송과 구별 | 조석은 단일한 당김이 아니라 공간에 따른 차이입니다. 입자 밀도를 유량으로 읽지 않습니다. |
| `lens` | 가까운 물·중심·먼 물의 당김에서 중심 값을 빼 차이 화살표를 남김. 10cm 미세 변화도 비교 | 당김 은백 실선, 차이 청록 실선, 이전 윤곽 흰 점선. 단면은 모눈과 선화 | 반대편 늘어남을 차감 과정으로 설명합니다. 약 0.28nm는 크기 비교용이며 분자 이동 영상이 아닙니다. |
| `person` | 같은 마디 기준에서 사람과 바다 비교. 작은 몸의 차이와 지구 규모 차이 구별 | 차이 화살표 청록 실선, 공통 비교 기준 흰 점선. 거의 0도 점으로 남김 | 사람이 뜬다는 오해를 바다의 변형과 분리합니다. PHYS 사람 힘 함수는 지구 반지름을 사용하므로 몸의 정밀 변형 계산으로 해석하지 않습니다. |
| `sky` | 달 원을 현재 원에 겹침. 같은 시간 간격 점으로 공전 속도 비교 | 달 은백 실선, 현재 크기 흰 점선 원, 지난 위치 회색 점·잔상 | 겉보기 크기와 케플러 주기를 서로 다른 단서로 읽습니다. 같은 시간의 점 간격이 넓으면 더 빠릅니다. |
| `limit` | 로슈 문턱과 방파제 목표. 띠 진입 → 슬로·균열·고리. 방파제는 마디 한계와 수위 비교 | 로슈·방파제 한계 점선, 현재 달·수위 실선. 추정 해안선도 점선이나 위치·형태로 역할 구별 | 정확한 하나의 붕괴선이라는 오독을 막습니다. 로슈는 폭 있는 띠, 방파제는 고정 높이로 구별합니다. |

## 장면의 읽는 순서

먼저 `marks`의 현재 기준을 고정하고 거리 하나만 바꿉니다. Q4는 `lens`의 세 당김 → 중심 차감 → `field`의 양쪽 늘어남 → 항구의 같은 시간 간격 수위 점 순서입니다. 항구 그래프는 파랑 현재 곡선과 흰 점선 현재 거리 기준 곡선, 조석–거리 그래프는 청록 곡선과 현재 커서입니다. 두 봉우리는 상대 회전 한 바퀴의 결과이며 모든 거리에서 24시간 두 번을 보장하지 않습니다.

Q5는 `person`, Q6은 `sky`, Q7·Q8은 `limit`을 중심으로 둡니다. A/B는 동일 시각·항구에서 거리만 바꾸는 제안입니다. 시간 비교는 거리·항구를 고정합니다. 전용 A/B 도구가 없으면 두 상태를 차례로 정지해 보여 줍니다.

## 화면 길이의 해석

거리 레일은 로그 압축입니다. 바다 높이는 설계상 고정 K 과장이나 현재 `PHYS.oceanBulge()`는 큰 배율을 포화 압축합니다. H/H₀는 마디·계산 그래프의 근거로 읽고 포화한 껍질의 화면 길이로 배율을 재지 않습니다. 로슈 구간·1/10 아래 해안선은 추정입니다. 원문과 구현 차이는 [교사 안내서](../guide.html)와 [검수 요약](reviewer-brief.md)에 있습니다.

## 쓰지 않은 표현과 이유

- 달 쪽으로만 흐르는 물 입자: 반대편 부풂과 중심 가속도의 차이를 숨깁니다.
- 모든 당김을 같은 길이로 그리기: 중심 값을 차감할 근거가 사라집니다.
- 확률 분포·반복 낙하: 핵심은 결정적인 거리 관계이며 확률 변수가 없습니다.
- 합·보존을 뜻하는 채움 통: 해수 유동·유입량을 적분하지 않습니다. 높이 마디를 물의 생성이나 수량으로 보이게 하지 않습니다.
- 임의 무지개색·색만으로 정답 구별: 양의 정체성을 흐리고 색각 차이에 의존합니다.
- 모든 거리에서 같은 속도의 하늘 점: 공전 주기 변화를 가립니다.
- 숫자 설명판·말소리·장식 삽화: 문장과 식은 화면 밖 안내서에 두고 학습자 화면에서는 원인을 만지고 결과를 비교합니다.
- 로슈 한계를 정확한 한 줄로 확정: 유체와 강체 가정 사이 추정 구간을 표현해야 합니다.

## R9 환경 — 갑판 없는 지구·달 궤도

환경 매개값은 `src/30-room-console.js`의 `buildEnvironment()` 첫 `cfg`에서만 관리합니다. `ROOM`은 우주 배경, `CONSOLE`은 독립 공중 조작부, `HERO`는 장치입니다. 기존 layer 이름과 카메라·heroCoverage·textAudit 구현을 유지합니다.

지면이 없는 주제이므로 `MODEL.top = 0.84`는 장치의 기준 높이로만 남깁니다. 지면·그림자 받는 바닥·갑판은 만들지 않습니다. 지구본은 두께 0.025인 독립 원반 하나, 달은 지름 0.022인 두 레일과 지름 0.008인 교차 트러스로 받칩니다. 지구본·달·레일의 기존 좌표는 유지합니다.

조작부 위치·크기는 `CONTROL_LAYOUT` 한 표가 소유합니다. 손잡이와 재생은 청색 발광 링, 그래프는 얇은 발광 테두리를 사용합니다. 책상 몸체·상판·앞면·나사·통풍 장식·황동 장식판, R7 갑판·하부 격자·표시등·태양전지 날개와 연결봉, 레일의 바닥 기둥·받침을 삭제했습니다. 전용 deck/navy 재질과 screw 생성기도 삭제했습니다. 고무 재질은 슬라이더 홈에 사용합니다.

| 조작부 | 중심 (x,y,z) | 크기 |
|---|---|---|
| 시간 손잡이 | (-0.86,0.83,0.48) | 링 반경 0.18 |
| 조석 그래프 | (-0.39,0.90,0.48) | 0.43 × 0.16 |
| 거리 그래프 | (0.13,0.90,0.48) | 0.43 × 0.16 |
| 거리 슬라이더 | (-0.12,0.68,0.48) | 가동 폭 0.95 |
| 재생 | (0.55,0.82,0.48) | 링 반경 0.115 |

레이캐스트는 실제 손잡이·화면 mesh를 대상으로 합니다. 드래그 평면은 명중점 z를 사용하며, 손잡이 각도와 그래프 거리 변환은 생성에 사용한 `CONTROL_LAYOUT`을 참조합니다. 퀘스트 조명·유령 손은 `DIAL.knob.getWorldPosition()`을, 그래프 봉우리 표시는 화면의 월드 좌표를 사용합니다.

| 배경 | 고사양 / 저사양 | 설정 |
|---|---|---|
| 별 3겹 | 980+360+96 / 320+120+32 | 크기 .024/.052/.095, 불투명도 .46/.68/.92 |
| 은하수 | 캔버스 1장 | (0,-3,-17), 29×6, 불투명도 .46, 번짐 180개 |
| 큰 지구 | 구체·대륙·구름·대기 | (-7.8,-2.3,-14), 반경 2.55, 림 강도 .48 |
| 구름 | 60 / 26 | 고정 시드, 시뮬레이션 시간으로 회전 |

배경 지구는 기존보다 아래·뒤로 옮기고 반경을 키웠습니다. 저채도와 선명한 대기 림을 유지하며 하늘 달은 기존 위치를 유지합니다. 화면 높이 30~45%와 왼쪽 위~가운데 배치는 투영 계산으로 검토하고 실제 픽셀은 캡처 호스트에서 확인해야 합니다. 실제 크기·거리 비율은 **추정**입니다.

브라우저/CDN은 이 작업에서 실행하지 않습니다. 팀장 캡처 항목: `environment-wide`, `environment-low`, `hero`, `console`, `sky`, `sky-twentieth`, `teacher-strip`, `attract-1`~`attract-3`, 모든 퀘스트 단계와 375×812. 실제 조작부 가림·터치·밝기·heroCoverage·textAudit은 캡처 검증 대상입니다.


## R15 - Colorfigures ink rendering

The approved dino-tug `47-ink-style.js` is copied byte for byte. Values live in `46-ink-config.js`; the portable engine remains unchanged. Physics, quests, teacher/attract semantics, camera shots, apparatus positions and touch/aria contracts are preserved.

| 46 setting | Value |
|---|---|
| ink / paper | `#161522` / `#232848` |
| shadow / opacity | `#3f55a8` / `.50` |
| silhouette / minimum / refDist | `3.2px` / `1.3px` / `3.6` |
| inner / opacity / wobble | `1.1px` / `.72` / `.8px` times requested wobble |
| farFade / fog | `[24,38]` / `[23,38]` |
| depth / normal threshold | `.018` / `.28` |
| ramp | `[0,128,255]` |
| dark / mid / light | `[.43,.49,.69]` / `[.83,.84,.81]` / `[1.10,1.06,.97]` |
| grain / stain / seed | `.025` / `.006` / `73.0219` (same as reference) |
| ambient / intensity | `#a6b8dc` / `.65` |
| key / intensity / position / target | `#fff0d0` / `26` / `[-2.2,4.2,3.3]` / `[-.55,1.30,0]` |
| shadowMap / bias / normalBias | `[2048,1024]` / `-.0003` / `.018` |
| metal | `#bbc2ce` |
| diagram screen / ink / border | `#f4efe3` / `#221d18` / `1.5px` |
| diagram grid / reference / tide / sea / accent / red | `#b6b5ab` / `#393e42` / `#377f88` / `#38658b` / `#b57924` / `#b65450` |

The 3.6 reference distance is an **estimate** from the existing hero camera's approximately 3-4 world-unit viewing distance. Actual ink width needs capture review. NoToneMapping and PCFShadowMap are used with one key spotlight and blue ambient light. Low quality keeps the ink/paper pass, sets DPR 1 and shadowMap 1024, disables wobble, and retains the existing star/cloud/shard low counts. Slow-frame fallback enters this same low path.

Environment: navy paper, cream round stars in three sizes, three translucent flat blue-gray (`#9caec7`) galaxy bands. Background Earth is three-band blue (`#6898bf`) ocean and green (`#abc68b`) land, with a few cream cloud patches and a thin flat atmosphere ring. Sun: yellow `#e8b23a` circle with one faint `#f0d995` halo. The sea bulge and moon crack shaders keep their animated geometry and now share the 46 tone/ink uniforms. Since 47 excludes ShaderMaterial from auxiliary depth, these shaders use flat dark contour bands. Transparent stars/clouds/galaxy/atmosphere/sun never contribute rectangular depth edges.

HUD: existing declarations are replaced with cream surfaces, 1.5px ink borders and ink glyphs, yellow `#e8b23a` active buttons and muted green completion. This includes teacher strip/numbers/choice screen, attract/recovery, event card and magnifier. Graph planes have cream physical backing at their existing positions and the reference CSS-pixel border shader. Controls retain positions, hit targets and aria-labels. Emissive control indicators remain at low intensity. No visible words were added; teacher numeric units remain the only exception.

Removed: GTAO/Bokeh/Bloom imports and passes, focus updates, bloom resize/capture corrections, AO fallback stage, hemisphere/fill/rim/area/point/quest lights, PMREM reflections, roughness/metalness/transmission/thickness tuning, atmospheric Fresnel glow, additive sun/lens glow, galaxy radial noise/gradients, dark HUD CSS, backdrop blur and UI shadows. Additive field particles now use NormalBlending. No ground shadow disk/plane existed in the orbital scene; none was introduced. Shadow color is the single INK_CFG.shadow value.

Portable-engine issue and host workaround: 47's `geometryPair` excludes empty background depth, so isolated object/empty-space silhouettes can disappear. 47 is untouched. A camera-centered paper sphere at `camera.far * .95` (38) supplies real far depth. Its inward triangle winding survives 47's front-sided normal material override; `inkInner=false` masks its normal edges. It is a background, not an expanded object outline shell. It belongs directly to scene, preserving the paper depth when ROOM is hidden. onBeforeRender centers it for both normal/color renders and capture. Visual effectiveness remains unverified without GPU/browser execution.

Validation: assemble; concatenated module and all 16 individual modules node --check; hand-check **166/166**, unchanged from baseline; quest-check including 8 real-PHYS auto runs; teacher-check all pass. `git diff --no-index -- D:/labs/labs/dino-tug/src/47-ink-style.js src/47-ink-style.js`: no differences, exit 0. Byte comparison: 12413 bytes, SHA256 `6061d42983e72abcc54e55e127d63e614ede9bd36fb34097f09d670ab368cedc`.

Line comparison: the four EffectComposer/RenderPass/makeOutlinePass/OutputPass call lines match the reference exactly. All 47 uniform names (`tDepth`, `tNormal`, `tEdges`, `resolution`, `nearFar`, `inverseProjection`), actual attachment texture rebindings, both render-target setSize calls, DPR-scaled widths and per-render inverse projection updates match line for line because the entire file is identical. Host resize follows renderer DPR -> composer DPR -> composer size. Thumbnail entry at 1200x750 and saved DPR/size restoration use composer setSize, updating auxiliary target dimensions/uniforms together. The key target uses this laboratory's E instead of the reference target.

Dark-color grep `#11|#0[0-9a-f]{5}|rgba\(1[0-9],|rgba\(0,` across src/*.js and src/00-head.html: **0 matches**. Intended dark colors are paper and ink; no dark HUD surface remains. This static pattern does not establish rendered contrast.

Not run: browser/CDN, per brief. GPU shader compilation, actual silhouettes and paper-depth workaround, translucent sorting/atmosphere ring, landscape/portrait HUD occlusion, live touch/textAudit and capture pixels require the team lead's browser host. No implementation blocker remains. No commit/push.
