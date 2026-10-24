# 원리에서 표현으로 — 지구 자전이 멈추면

층 키는 아래 한국어 문자열 그대로 `__lab.layer(key,true)`에 전달합니다. 수치의 유일한 원천은 PHYS이며, 표시 층은 정답이나 측정값을 만들지 않습니다.

| 실제 층 키 | 원리 → 표현·이유 |
|---|---|
| `접선 속도의 크기` | v/343을 같은 선형 눈금의 청록 마디로 그립니다. 부분 마디와 끝 마디로 크기를 구별합니다. |
| `벤치마크 비교` | 걷기·자전거·자동차·열차·여객기·소리의 점선 윤곽을 같은 원점에 둡니다. 기호의 면적 대신 길이를 비교합니다. |
| `위도에 따른 감소` | 위도 걸림의 속도 계단, 적도 점선, 현재 단면 반지름을 겹칩니다. 원둘레 감소를 드러냅니다. |
| `관성` | 멈춘 지표 윤곽과 동쪽 접선의 등시간 점을 남깁니다. 초기 운동의 지속을 보여 주며 새 힘을 만들지 않습니다. |
| `낮밤 경계` | 밝은 반원·어두운 반원의 렌즈와 태양 방향 선으로 숨은 명암 구조를 읽습니다. |
| `상대 각속도` | 자전·공전·남는 원호, 고정 물리 간격의 태양일 점으로 전체 반복 주기를 구별합니다. 긴 주기는 접힘 기호를 유지합니다. |
| `설계 속도 한계` | 고정된 한계 점선과 현재 화살표를 겹칩니다. 교육용 수치 조건이며 실제 안전선이 아닙니다. |
| `반복 관측` | 실제 급정지 실행마다 조건 핀과 결과 막대를 남깁니다. 빈 행은 그리지 않고 기록 용량 초과는 접힘으로 나타냅니다. |

장치 층 키는 `hero, console, globe, pin, body, speed, sun, benchmark`이며 `room`은 궤도 배경입니다. `console`은 독립 공중 조작부입니다. 교사 격자는 배경을 제외한 전체 16개 키를 제공합니다. `hero`는 지구본과 표현 층의 부모이므로 끄면 자식도 가려집니다. `benchmark`는 기본 장치 그룹이며 실제 비교 표현은 `벤치마크 비교`가 담당합니다.

현재 속도·관성은 청록 실선과 화살촉, 기준은 은백 점선 윤곽, 지난 시간은 회색 점, 태양은 호박색, 한계는 붉은 점선입니다. 색만으로 구별하지 않고 채움/빈 점·실선/점선·화살촉·마디를 함께 씁니다. A/B는 `GRAMMAR.pin()`이 저장한 세계 좌표의 점선이며 카메라를 돌려도 같은 시점에서 비교합니다. 렌즈 세 종류는 동시에 켜지지 않습니다.

시연 순서는 [퀘스트 지도 m절](quest-map.md)을 따릅니다. Q1 마디→벤치마크, Q2 적도 고정→위도 비교, Q3 관성→실행→시간 점, Q4 낮밤 경계→상대 각속도, Q5 정지→공전 원호→전체 주기, Q6 설계 속도 한계→핀 이동입니다. 사건 중 예상 덱은 숨기고 원리 도해 하나만 남깁니다. 급정지 샷은 지구와 이탈 구슬을 함께 보며 따라갑니다.

예상 카드는 같은 축·같은 기하 장치에서 비교하고 굵은 선·큰 마디를 사용합니다. 가로 화면은 왼쪽 세로 덱, 모바일은 위쪽 가로 덱으로 장치와 분리합니다. 무문자 5초 구별과 실제 점유율은 캡처 검수 대상입니다.

쓰지 않은 표현: 원심력처럼 바깥으로 밀어내는 힘 화살표(관성 오해), 장시간 탄도·재난·인체 삽화(계산 범위 밖), 확률 입자와 무작위 흔들림(결정적 모델), 무지개색(양의 정체성 훼손), 빈 말풍선(정보 없는 가림), 수식·문장 판넬(학습자 화면 무문자 원칙)입니다. 낮밤 경계 발광과 과장 기호는 설명용이며 대기의 실제 발광 예측이 아닙니다.

## R9 공중 장치와 조작부

이 주제에는 지면이 없습니다. `PHYS.SCENE.top=0.96`은 장치 기준 높이로 유지하며, 지면·그림자 받는 평면·관측 갑판은 추가하지 않습니다. R7의 지구 지평선·위성·태양과 `ENV_CFG`, 모든 카메라 및 `heroCoverage()` 경계는 그대로입니다. 지구본 발치의 황동 원판은 중심 높이를 유지하면서 두께를 0.04로 줄였습니다. 겹친 흑연 받침은 삭제하고 기존 축의 아래 끝만 원판 윗면까지 연결했습니다. 지구본·태양 막대·비교 장치의 좌표는 유지합니다.

`CONSOLE`에는 공통 상자나 넓은 뒷판이 없습니다. 청록 발광 눈금과 반투명 청색 링·개별 계기창이 공중에 떠 있습니다. 모든 조작부의 배치는 `30-room-console.js`의 `CONTROL_LAYOUT` 한 표가 소유합니다. 아래는 코드 값을 옮긴 검수용 표이며, 변경은 코드 표에서 합니다.

| 조작부 | 기준 좌표 x, y, z | 크기·구성 |
|---|---|---|
| 다이얼 | -0.96, 1.53, 0.20 | 기존 반지름 0.18 링과 회전 손잡이 |
| 위도 그래프 | -0.96, 1.23, 0.20 | 표시 면 0.55 × 0.20 |
| 주기 그래프 | 0.82, 1.23, 0.20 | 표시 면 0.55 × 0.20 |
| 위도 슬라이더 | -0.03, 1.20, 0.20 | 레일 폭 0.95 |
| 실행·재생 버튼 | 0.80, 1.53, 0.20 | 손잡이 반지름 0.085, 링 반지름 0.115 |
| 방식 스위치 | 1.14, 1.53, 0.20 | 0.24 × 0.15, 레버 이동 0.12 |

다이얼·계기창은 지구본 하부 양옆, 슬라이더는 지구본 아래에 둡니다. 레이캐스트는 실제 생성된 메시를 사용하고, 드래그 평면의 z도 선택한 메시의 세계 좌표를 읽습니다. 다이얼 각도는 같은 표의 중심, 그래프 입력은 같은 표의 표시 폭, 슬라이더 이동은 표로 생성한 `SLIDER.width`를 사용합니다. 퀘스트 강조와 유령 손의 초점은 실제 메시의 `getWorldPosition()`을 따르며 목표 눈금도 같은 다이얼 표와 슬라이더 좌표를 사용합니다. 기존 56px 화면 좌표 획득과 교사 확대는 유지합니다.

삭제한 책상 구조는 몸체 상자·상판 2겹·앞판·황동 테두리·나사·통풍구 48개·하부 원뿔·받침 레일 2개입니다. `screw`, `brassTrim`, `ventSlits`와 고무·나사 홈 색/재질을 삭제했습니다. 호출자가 하나였던 `bigButton`은 생성 위치에 인라인했습니다. `MAT.deck`은 위성 가로 막대에서 사용하므로 남습니다. `console`, `hero`, `room` 공개 층 이름도 유지합니다.

검증: hand-check 111/111, quest-check, teacher-check, 소스 및 조립 모듈 구문 검사를 통과했습니다. 실제 포인터 처리기를 DOM·레이 경계만 대체하여 다이얼 회전·그래프 2개의 내부 축 매핑·슬라이더 이동·선택 메시의 드래그 평면을 확인했습니다. 책상 패턴(`brassTrim|ventSlits|screw\(|MAT.rubber|THEME.rubber|THEME.slot|top\s*-\s*\.0?[56]|roundedPanel\([^\r\n]*MAT\.(graphite|deck|navy),CONSOLE|CylinderGeometry\(\.68|\bdesk\b|\btable\b`) 검색은 src JS에서 0건입니다. 물리 모듈의 `tabletop` 주석과 과거 경계 함수는 수정 금지 범위라 유지합니다.

브라우저·CDN 검증은 실행하지 않았습니다. 실제 `heroCoverage()`·`textAudit()`·375×812 가림·교사 띠·대기 샷의 판독성은 팀장 캡처가 필요합니다. 기존 캡처 상태 전체를 유지하고 `r9-panels-sudden`, `r9-panels-stopped`, `r9-orbital-wide` 상태를 추가했습니다.


## R7 ?? ??

?? ??? ??? ??? 13? ??? ??? (0,-12,-10)? ???. ?? ?? ???, ??? ?? ?? ??????? ?, ?? ?? ??? ?????? ?? ????? ????. ??? ?? ?? ??? ?? ??? ???? ?? ??? ????. ?? ?? ?? ??? ? ???? ???? ?????.

?? ??? 30-room-console.js? buildEnvironment ??? ROOM? ??? ?????? ENV_CFG ?? ????. mulberry32(730219)? ? 320?? ?? ? ??? ?????. ?? ?? ??? ???? 12?? InstancedMesh???. low ?? ?? ? ?? ?? ???? ? 96???? 4??? ??? ?? ?? ?? ????. ?? ??? ?? ????? ????. ? ??? ?? ?? ??? ??? ?????.

?? ?? UV? PHYS? ??? ?? ?? ??? 0.065?? ?????(??? ?? ??). ???? run.angle, ???? S.spin.value? ?? ??????????? ?????. ?? ?? ??? ? ???? ??? ???? DIRECTOR.time(dt) ???? ????? ?? 0.25??? ?? ????? ????. ????????? ??? ??? ?????. ????GRAMMAR????????UI CSS? ?????. ?? ??? ??, ?? ??, UI ??? ???? ?? ???? ?? ??? ?????.


## R15 ? Colorfigures ink rendering

Three-dimensional orbital scenery, physics, camera presets/fit, control coordinates and quest/teacher/attract semantics remain intact. Style values live in `src/46-ink-config.js`; `47-ink-style.js` is copied byte-for-byte from the approved dino-tug source. RenderPass ? INK edge/paper pass ? OutputPass replaces AO, bokeh and bloom. There is one hard spot key and one cool ambient light, no environment reflections, fill, rim, area lights or additive glow.

| Value | Earth-stop decision |
|---|---|
| Paper / ink | #1e2442 / #141522 |
| Shadow | #3f55a8, opacity .50; there is no ground receiver in this orbital scene |
| Toon ramp | [0,128,255]; dark [.43,.49,.69], mid [.83,.84,.81], light [1.10,1.06,.97] |
| Silhouette / inner | 3.2px, minimum 1.3px, reference distance 5; inner 1.1px, opacity .72 |
| Edge thresholds / wobble | .018 relative depth, .28 normals, .8px ? URL wobble |
| Far fade / fog | [24,38] / [25,40], existing camera far=40 |
| Paper texture | grain .025, stain .006, seed 73.0219; same as reference |
| Lighting | ambient #a6b8dc .65; key #fff0d0 110, position [-2.2,4.2,3.3], target [0,1.95,0] |
| Quality | high DPR ?1.6 / 2048 shadow; low DPR ?1 / 1024 shadow / no line wobble; ink pass remains enabled |
| Diagrams/HUD | cream #f4efe3, ink #221d18, 1.5px border, active #e8b23a; existing targets and accessible names retained |

Reference distance 5 is an estimate from the existing desktop hero camera, not screenshot approval. Satellite panels retain their existing large cells. Background ocean uses #344961/#526d83/#7893a3; land #727861/#96997a/#b9b18b. The apparatus globe uses the more saturated ocean #346399/#508fb2/#83bac9 and land #6d8859/#a3b275/#c8b57c. Procedural micro-detail, reflection, smooth terminator and gradients were replaced by discrete paint, flat cream clouds, cream night-city points, a single thin blue atmosphere band, and flat yellow sun/halo discs. All transparent decorations remain excluded from the reference normal/depth pass.

Compatibility workarounds, without editing 47:

- Module 50 installs KIT.toon and converts the material registry and the complete scene once after construction. There are no dino-only globals in 47 or compatibility placeholders here. The fading arrow tip uses unlit flat color so its closure cannot reassign a stale Standard material after conversion.
- The engine excludes ShaderMaterial objects from depth and rejects empty-sky depth neighbors. The opaque apparatus globe has an inset colorless depth twin; a camera-attached inward colorless shell at .98 ? far supplies sky depth. They add no color pixels and change no device/camera coordinates. Their actual silhouettes need GPU review.
- The existing SUN_LIGHT handle is now a transform-only Object3D; its position still supplies the same solar direction without introducing an extra light.

Validation: assemble; every source JS and assembled module syntax; hand-check 111/111 (same baseline); quest-check six real-PHYS runs and wrong predictions; teacher-check portable byte parity, numeric-only text audit and all controller checks. Exact 47 diff: no output / exit 0, byte equality verified. Requested dark-color regex (`#11|#0[0-9a-f]{5}|rgba(1[0-9],|rgba(0,`) returned zero source/HUD matches. Removed-path scan returned zero AO/bokeh/bloom/fill/rim/area-light/additive/roughness/metalness/inked references outside the immutable 47 contract.

Line comparison with dino-tug: 47 uniforms at line 77, target texture identity at 137?138, both targets and resolution uniforms at 141, camera near/far and inverse projection at 153?154, and DPR-scaled widths at 157 are identical. Host 50 inkPass call and renderer/composer resize statements match after whitespace normalization. Capture in 70 sets both renderer/composer to 1200?750 DPR 1, restores both size/DPR pairs in finally, and renders through the same composer; obsolete bloom resize was removed.

Browser/CDN, GLSL compilation, actual outlines/contrast, heroCoverage/textAudit in a real DOM, touch/focus behavior, portrait occlusion and new captures were not run. Existing thumbnail/capture evidence was not regenerated. The lead must check those on the browser host. No commit or push.
