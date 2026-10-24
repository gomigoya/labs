# 원리에서 표현으로 — 다른 별에서 내 몸무게는

실제 실행 키는 `GRAMMAR.LAYERS`의 아래 아홉 한국어 문자열입니다. `__lab.layer(key,on)`과 교사 띠가 같은 키를 사용합니다. 설명 문장은 학습자 화면에 렌더하지 않습니다.

| 실제 층 키 | 원리 → 표현과 이유 |
|---|---|
| `무게 크기` | W=mg를 아래 방향 주황 마디 화살표로 표시합니다. 한 마디는 지구 추 하나의 무게입니다. 길이·마디·화살촉으로 색 외의 단서를 제공합니다. |
| `천체 변경` | 지구 또는 A/B 핀의 점선 힘을 현재 실선에 겹칩니다. 반지름은 제곱근 압축 윤곽과 확대 기호로 실제 비율과 구별합니다. |
| `질량 불변` | 추 점 개수와 같은 장소 양팔 수평선·마주 보는 화살표를 함께 씁니다. 공간에서는 무하중이므로 이 증거를 숨깁니다. |
| `추 개수와 무게 비례` | 같은 천체에서 추를 하나씩 늘린 결과를 계단 흔적으로 놓습니다. 상한을 넘는 계단은 끊김으로 구별합니다. |
| `계측 한계` | 붉은 점선 문턱과 굵은 끊김 사선, 확대 기호로 표시 포화를 드러냅니다. 원값을 잘라서 물리 힘을 바꾸지 않습니다. |
| `점프 비교` | 같은 시간 간격 회색 점, 현재 청록 정점, 지구 또는 핀 정점의 흰 점선을 겹칩니다. 공간은 열린 상승 화살표이며 정점 0이 아닙니다. |
| `중력 방향` | 구 표면 안쪽 스트릭·선화 단면을 사용합니다. 흐름 입자는 방향 도해 안에만 두어 힘을 분출 물질로 읽지 않게 합니다. |
| `시험 기록` | 실행별 천체 견본·추 점·정점 막대를 쌓습니다. 공간 기록은 정점 막대 대신 열린 사건입니다. 실제 실행과 모델 예측 그래프를 구별합니다. |
| `양의 관계` | 콘솔의 추 개수–무게 곡선·점선 기준과 천체–정점의 분리된 줄기·점을 강조합니다. 끄더라도 화면은 모델 곡선·현재 커서를 유지해 빈 황동판처럼 보이지 않게 합니다. |

기본 장면 키는 `room, console, hero, force, spring, shelf, balance, jump`입니다. 방 `room`을 제외한 일곱 키도 교사 CFG에 포함합니다. `hero`는 다른 장치의 부모이므로 꺼져 있으면 자식 층도 보이지 않습니다. 초기화는 기본 장치들을 복구하고 설명 층을 비웁니다. 학생 진입은 해당 퀘스트 층을 다시 켭니다.

현재 힘은 주황 실선·마디, 질량·정점은 청록 점·선, 기준은 흰 점선, 과거 시간은 회색 점입니다. 한계는 붉은 점선 띠로 위치와 사선이 함께 역할을 구별합니다. 과장 표식은 선화 확대 기호입니다. 태양·중성자별의 실제 마디는 보존하고 화면은 30마디에서 끊습니다. 동일한 상한 길이를 같은 실제 힘으로 해석하지 않습니다.

예상 카드는 같은 좌표·공통 눈금에서 폭넓은 마디 막대, 팔 기울기와 점 개수, 정점 높이로 후보 차이를 드러냅니다. 정적인 첫 프레임에서도 비교할 수 있게 하며 글이나 정답 색에 의존하지 않습니다. 사건 중에는 하단 도구대와 결과 카드를 완전히 숨기고 장치에 연결된 해설 하나만 표시합니다. 빈 카드·빈 오버레이는 그리지 않습니다. 실제 5초 판독은 브라우저 캡처 검수 대상입니다.

## 쓰지 않은 표현

- 범주 천체 사이 연속 점프 곡선: 존재하지 않는 중간 천체의 물리값처럼 보입니다.
- 힘에 비례해 무한 증가하는 입자 수·길이: 초고중력에서 장치가 사라지고 성능도 무너집니다.
- 반지름을 실제 축척으로 놓은 선택 구: 극단적 크기 차이로 비교 장면이 읽히지 않습니다.
- 공간의 0높이 정점·양팔 평형 증거: 무하중과 정점 부재를 잘못 설명합니다.
- 말풍선 문장·사진·캐릭터·색만으로 정답 표시: 글 없는 원인–결과 비교와 언어 중립성을 깨뜨립니다.

## R7 — 선택 천체의 현장 환경

`30-room-console.js`의 `buildEnvironment()` 하나가 `ROOM`에 환경을 붙입니다. `SCENERY`는 시드·크기·밀도·표시 시간 표이고, `WORLD_SCENERY`는 `PHYS.BODIES`의 열 가지 ID별 하늘·지면·지형·공중 천체 표입니다. 기존 `room` 키는 이 환경 그룹을 가리키며, `shelf`는 보존한 회전 견본 장치입니다.

| 천체 | 하늘·표면 | 지평선·공중 요소 |
|---|---|---|
| 지구 | 푸른 하늘·녹색 풀밭 | 먼 산과 풀 군락 |
| 달 | 검은 하늘·회색 크레이터 평원 | 낮은 언덕·큰 푸른 지구 |
| 명왕성 | 검은 하늘·옅은 얼음 평원 | 얼음 봉우리·카론 |
| 화성 | 분홍 주황 하늘·붉은 모래 | 바위·먼 사화산·작은 포보스 |
| 금성 | 황토색 구름 하늘·암석 평원 | 안개 속 능선 |
| 토성 | 황갈색 하늘·띠 구름바다 | 낮은 구름 둔덕·고리·타이탄 |
| 목성 | 노랑 주황 폭풍 하늘·띠 구름바다 | 낮은 구름 둔덕·큰 이오 |
| 태양 | 어두운 적색 하늘·입상 광구 | 먼 홍염 아치 |
| 중성자별 | 검푸른 하늘·금속성 지각 | 먼 극축 원뿔 |
| 우주 공간 | 검은 별 하늘·지면 없음 | 푸른 지구·부유 탐사 플랫폼 |

가스 행성·태양·중성자별의 받침은 현장 비교를 위한 **가상 관측 플랫폼(추정)**입니다. 그곳에 서 있을 수 있다는 뜻이 아닙니다. 지형·위성·고리의 크기와 위치, 지구 대륙 무늬·광구·극축은 식별을 위한 도식이며 **추정**입니다.

| 공통 구성 | 고품질 / 저품질 개수 | 재질·위치 |
|---|---|---|
| 하늘·지면 | 각 1 / 1 | 절차 셰이더, 반경 18 하늘·64×64 지면 |
| 지평선 지형 | 14 / 7 | 거친 로우폴리 인스턴스, 뒤쪽 z=-9~-14·중앙 바깥 |
| 암석 또는 풀 | 42 / 14 | 로우폴리 인스턴스, 받침에서 반경 2.6~10 |
| 별 | 160 / 60 | 점 셰이더, 배경 천구; 대기가 없는 천체에서 표시 |
| 먼지 | 72 / 24 | 옅은 점 셰이더, 주변 폭 7·높이 1.6 |
| 공중 천체 | 해당 환경당 0~1 | 절차 셰이더, (-5.5,4.3,-10) |
| 사화산·고리·홍염·극축 | 해당 환경당 각 1 | 배경 로우폴리 지형, z=-9~-12 |
| 탐사 플랫폼 | 1 | 기존 콘솔 크기·조작 위치, 금속 상판 |
| 안테나 | 1 | 금속, 상판 뒤 왼쪽 (-1.64,0.84,-0.39) |
| 고정 말뚝·접지 바위 | 각 4 | 금속·선택 지면색, x=-1.45/1.4·z=-0.3/0.5 |

주요 환경은 낮은 대비·안개·가장자리 감광으로 장치를 받칩니다. 고정 시드 `mulberry32(731027)`을 사용하며 새 그림자 광원을 추가하지 않습니다. 열 환경을 미리 만들되 전환 가중치가 있는 그룹만 표시합니다. 하늘·지면 색과 지형 특징은 보간하고 지형·공중 물체는 투명도로 크로스페이드합니다. 빠르게 다시 선택해도 현재 혼합 상태에서 이어집니다. 하늘·별은 카메라 이동에 무관한 천구 투영이라 교사 원거리 샷에서도 유지됩니다.

환경 갱신은 `70-loop.js`의 `ENVIRONMENT.update(physicalDt)` 한 줄입니다. 구름 이동·별 밝기·먼지·전환은 모두 `DIRECTOR.time()`이 계산한 시간만 받습니다. 먼지 낙하 속도는 `sqrt(log1p(PHYS.g(i)/PHYS.g(earth)))`를 표시용으로 압축한 **추정**으로, 실제 낙하 시간이나 종단 속도를 뜻하지 않습니다. 우주 공간은 낙하 0이며 느린 횡방향 흔들림만 남습니다. `quality('low')` 또는 자동 성능 저하 첫 단계부터 장식 수를 줄입니다.

삭제: 두 벽·판자 바닥과 텍스처·아치 창과 하늘 캔버스·창 조명·궤도 액자·선반·진열 모형·상자·병·망원경·램프·앞쪽 탁자와 트레이, 방 전용 목재/벽 재질과 램프 생성 함수, 실내 반사 환경 사용처. 보존: 실험 장치·계기판 2개·조작 손잡이·물리·문법·카메라·교사·대기 모드.

범위 제한: 수정 금지인 `10-imports.js`의 동결 `THEME`에는 사용하지 않는 방 팔레트와 `RoomEnvironment` import가 남습니다. 허용 파일에서 이들의 생성·사용은 제거했습니다. 전체 코드의 `window`는 브라우저 API이고 `SHELF_RIG`/`shelf`는 보존 대상 장치입니다. 방 소품 구현의 잔존으로 세지 않습니다.

검증: 손검산 279/279, 퀘스트·교사 검사와 모듈 구문 검사. 렌더 API를 스텁한 CPU 하네스로 열 환경 구성, 시드 재현, 전환 혼합, dt=0 정지, 저품질/자동 감소, 공간 먼지 정지를 확인했습니다. WebGL 셰이더 컴파일·실제 대비·가림·heroCoverage·교사/대기 캡처는 브라우저 호스트 검수 대상이며 여기서는 미실행입니다. 캡처 도구에 `scenery-0`~`scenery-9` 상태를 추가했습니다.


## R9 ? ?? ??? ?? ??

`SCENERY.groundY = PHYS.VIEW.top = 0.84`? ?? ?? ?????. ?? ??? ??? ?? ?? ???, ???? ?? 0.84 ???? ?????. ?? ??? ? 0.001? ?? ??? `ShadowMaterial` ???? ?? ?? ??? ?? ?? ???? ????. ???? ??? ?? ???? ?????. ????SHOTS???/?? ????????????? ???? ?????.

??? ??? ??? `CONTROL_LAYOUT` ? ??? ????. ?? `(0,1.04,0.96)`, x? ?? `-1.0 rad`, ?? `1.28?0.64?0.025`???. ?? ??? ?? ??? ???? ?????. ???? ??? ?? ?? ?????. ?? ??? ?? ?? **??**???.

| ??? | ?? ?? (x,y,z) | ?? ?? ?? ?? |
|---|---|---|
| ?? ??? | (-0.43,0.07,0.025) | hit 0.38?0.38?0.16 |
| ???? ??? | (0.20,0.19,0.025) | 0.68?0.16 |
| ????? ??? | (0.20,-0.02,0.025) | 0.68?0.16 |
| ? ???? | (0.15,-0.22,0.025) | ?? ? 0.62, hit 0.76?0.19?0.15 |
| ?? ?? | (-0.43,-0.22,0.025) | hit 0.28?0.29?0.17 |
| ?? ??? | (0.55,-0.22,0.025) | hit 0.13?0.17?0.14 |

???? hit box? ?? `CONTROL_LAYOUT.*.at`? `CONTROL_FACE`? ???. ??? ??? ?? hit ??? ?? ???? ???, ??? ?? ?? ??? ?? ??? ??????? ???? ?????. ??? ?? ?? ?????. ?? ???? ??? `DIAL.knob` ?? `RUN_BUTTON`? ?? ??? ?? ?????. inspect ??? ?? ???????.

?? ???3.64 ?? ????? ????? ?? ??? ??? ???26? ?? ?????? 4???? ?? ?? ???? ?? ???? ??????. ??? ?? ?? ??? 4?? ??????. ?? ??? ??? ????? ?????? ?? ?? ?????. `console`? ???? ????, `room`? ???, `hero`? ??? ? ?? ??? ?????.

`SCENERY.contacts` ? ?? ? ??? ??? ????. ????? ?? ??? ??? ???? ?????. ?? ??? ?? 0.85 ??? ???? ?? ??? ???? ????. ????? ?????????? ??? ??? `?? 0.04??? 0.06`? ?? ?? 4?? ??? ?? ??? ????. ? ?????????? ??? ????. ?? ?? ????? ?? `WORLD_SCENERY`? ?????.

??: ???, ?? ??? ?? ?? `node --check`, ??? 279/279, ?????? ?? ??. `desk`, `table`, `top-.06`, `roundedPanel(...MAT...CONSOLE)`, `KIT.screw(CONSOLE)` ?? ?? 0?(??? ?? ??). ?? ???????Math.random ?? ??. ?? ?? `r9-ground-0/1/3/9`, `r9-stand`, `r9-hologram` ??. ?? WebGL???? 375?812? ???heroCoverage?textAudit??????/?? ??? ????? ??? ?? ??.


## R15 - Colorfigures ink transplant

The portable `src/47-ink-style.js` is byte-identical to the approved dino-tug source. All host style values live in `src/46-ink-config.js` and its hoisted `inkConfig()` accessor. WORLD_SCENERY in 30 aliases the single worldScenery table in 46. No camera shots, apparatus/control coordinates or physics values were changed.

| 46 setting | Value |
|---|---|
| ink / initial paper | #14131d / Earth #dfe6d8 |
| shadow / opacity | #3f55a8 / .50 |
| silhouette / minimum / refDist | 3.2 / 1.3 CSS px / 7 world units |
| inner / opacity | .8 CSS px / .65 |
| farFade / fog | [18,36] / [12,36]; existing camera far 40 |
| depthThreshold / normalThreshold / wobblePx | .018 / .28 / .8 |
| ramp | [0,128,255], nearest, shared by 47 |
| dark / mid / light | [.43,.49,.69] / [.83,.84,.81] / [1.10,1.06,.97] |
| grain / stain / seed | .025 / .006 / 73.0219; unchanged from reference |
| metal | #b9c0c5 |
| ambient / intensity | #a6b8dc / .65 |
| key / intensity | #fff0d0 / 80 |
| keyPosition / keyTarget | [-2.2,4.2,3.3] / [0,1.85,0] |
| shadowMap / bias / normalBias | high 2048, low 1024 / -.0003 / .018 |
| diagram | screen #f4efe3, ink #221d18, border 1.5 CSS px, grid #b2b3a2, reference #393e42, force #b06e29, mint #37795d, cool #4e6f9e, red #b55d65 |
| apparatus | graphite #7c858a, rubber #5a646d |

refDist 7 and inner width .8 are estimates for the existing roughly 6-9 unit hero shots and fine spring parts. Actual legibility requires the lead's capture review. Existing component thickness and placement remain unchanged; the spring and scale divisions now use dark pigment.

| World | paper (= sky/haze) | ground | relief |
|---|---|---|---|
| earth | #dfe6d8 | #a0ad87 | #85977b |
| moon | #171d35 | #b7b9bd | #9198a8 |
| pluto | #20283f | #bdc4c7 | #939eae |
| mars | #ecd0b6 | #c59276 | #a77f72 |
| venus | #e6dbb3 | #b8ab81 | #9c987e |
| saturn | #ece0c4 | #c5b79a | #aaa594 |
| jupiter | #f0dfba | #c8af91 | #ad9789 |
| sun | #e8bd94 | #d6a16e | #ba8c73 |
| neutron | #1b2940 | #a8bac5 | #839cba |
| space | #151e34 | #9cabbc | #8597b2 |

The original fadeSeconds and weights crossfade are preserved. There is no setPaper API in 47, so ENVIRONMENT.update copies the interpolated paper into inkPass.uniforms.paper.value, scene.background and fog.color. Shader sky bands are discrete; ground micro-grit and contact/radial dark gradients were removed. Crater/cloud/ice/plasma patterns remain as three pigment bands. Specimens retain broad markings with three-step illumination; their fine noise and rim glow were removed. These existing ShaderMaterials remain shaders and read tone vectors from 46. Stars use bright cream, dust uses flat dots, and solar particles use normal alpha blending.

50 calls INK.convertMaterials(scene) once after initial scene construction. MAT handles are adopted through INK.convert. Fading terrain material handles are rebound to the converted materials so subsequent opacity changes affect the rendered objects. Settled terrain becomes opaque with depthWrite, allowing ink edges on hills/rocks/cloud mounds. Transparent transitions, decoration shaders, sprites, lines and shadow planes are excluded from the auxiliary depth/normal draw by the unchanged engine. Basic/Shader/line/sprite materials are not automatically converted. Emissive contributions survive the conversion; graph screens use unlit cream raster paint.

The tripod and floating space console are cream 3D plates at the original coordinates. The lens is a cream circle with a derivative-based continuous ink rim and its existing reference dash. HUD/card/teacher/recovery surfaces use cream #f4efe3, 1.5px ink borders, yellow #e8b23a selection, and dark ink diagrams. Target dimensions, aria-labels and the wordless rule are retained. The teacher spotlight remains a functional translucent ink mask. The portable teacher body is byte-identical to the existing shared controller because teacher-check enforces that contract; panel styling is supplied by CSS.

Removed: GTAOPass/BokehPass/UnrealBloomPass, their imports/focus/resize/capture restore/automatic degradation branches; fill/rim/device PointLight/RectAreaLight and RectArea initialization; PMREM reflections; Standard/Physical roughness/metalness tuning; additive solar glow; dark HUD panel CSS, backdrop blur and soft HUD shadows. The unused RoomEnvironment import was also removed. Low quality follows the reference: DPR capped at 1, shadow map 1024, wobble zero, ink pass retained. Existing low-density environment branches remain.

Static line comparison: 47 is byte-identical. makeOutlinePass invocation matches the reference exactly. Uniform declarations at 47:76/117, attachment rebindings tDepth/tNormal/tEdges at 137/138, target/edgeTarget/resolution resizing at 141, nearFar/inverseProjection updates at 153/154, and DPR-scaled widths at 157 all match. The host composer DPR/size calls also match. Capture uses 1200x750 at DPR 1 and restores composer size/DPR, which resizes both auxiliary targets through setSize. Host paper updates use the actual public uniform name. GPU shader compilation was not run.

Validation: assemble PASS; node --check for all 16 JS fragments and the assembled ES module PASS; hand-check 279/279 (baseline 279 preserved); quest-check PASS; teacher-check PASS. Browser/CDN execution and new captures were not run, as directed. Actual light/dark-world pixel contrast, line clumping, shadows, mobile overlap, touch geometry, sound/focus and screenshots require the lead's browser host. thumb.jpg was not regenerated. No commit or push.

Requested dark grep equivalent: #11|#0[0-9a-f]{5}|rgba\(1[0-9],|rgba\(0,. HUD CSS: 0 matches. All source: 1 match, src/10-imports.js:14, unused legacy THEME.screen '#11232e'. Only import cleanup was authorized in 10, so its palette is preserved; all active screen consumers now read 46. No implementation blocker remains. Browser visual verification is pending externally.
