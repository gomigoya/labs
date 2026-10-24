# 원리와 표현 — 블랙홀에 빠지면

실행 키는 아래 표 그대로입니다. 문법 층 여섯 개의 이름은 `GRAMMAR.LAYERS`가 소유하고, 교사 연결은 `TEACHER_CFG`가 참조합니다. 방·콘솔·장치 부모는 구조이며 학생이 읽는 표현 층과 구별합니다.

| 실제 층 키 | 원리 → 표현 | 선택 이유 |
|---|---|---|
| `당김 차이` | 은색 공통 당김을 빼고 청록의 벌어짐 차이 화살표를 남기는 렌즈 | 절대 중력과 몸 양 끝 차이를 구별합니다. 화살촉·마디·명도를 함께 씁니다. |
| `거리 세제곱 역관계` | 같은 단위 선형 마디, 거리 칸, 같은 스캔 시간 점·굵은 점선 궤적 | 반 거리의 실제 8배는 선형 마디로 셉니다. 로그 레일·로그 그래프와 분리합니다. |
| `파괴 한계` | 파괴 문턱 점선 고리, 안쪽 전이의 균열 표식 | 추정 문턱과 사건을 구별합니다. 정확한 경계는 온전합니다. |
| `사건의 지평선` | 붉은 실선 링과 눈금 | 파괴 점선과 모양으로도 구별하며 지평선 자체가 파괴면이라는 오해를 막습니다. |
| `질량 비교` | 같은 r=1의 질량 견본 줄, 실제 기록과 고정 점선 잔상 | 질량 제곱 역관계는 같은 지평선 배수 조건에서만 성립합니다. |
| `가로 압축` | 안으로 모이는 청록 화살표·입자 | 세로 늘어남과 가로 압축을 방향으로 구별합니다. 크기는 PHYS에서 세로의 절반입니다. |
| `grid`, `front` | 함몰하는 격자와 분해 가능한 앞 반판 | 공간을 설명하는 추정 모형이며 물리적 표면이나 상대론 시공간 해가 아닙니다. |
| `disk` | 포화 입력 visualField에 따른 원반 발광 | 실제 강착 광도 계산이 아닌 추정 현상 강조입니다. |
| `horizon` | 장치의 실제 붉은 토러스 | 문법 고리와 장치의 깊이를 이어 줍니다. |
| `probe` | 양 끝 마커를 가진 확대 탐사 막대 | 캐릭터 없이 변형과 문턱 통과를 읽습니다. 확대는 presentationState의 표현용 순수 함수입니다. |

전체 API에는 구조 키 `room`, `console`, `hero`도 있습니다. 교사 도구의 층 순서는 grid → front → disk → horizon → probe → 위 여섯 문법 층입니다. 구조 부모를 숨기면 자식 전부가 사라지므로 교사 층에서 제외합니다. `horizon` 장치와 `사건의 지평선` 문법 층은 별도 키입니다. 대기·초기화에서 장치 기본 가시성을 복원합니다.

## 색과 선 규칙

당김은 은색, 차이는 청록, 경계는 붉은 계열입니다. 현재량은 실선, A/B 기준과 과거 조건은 흰 점선입니다. 파괴선은 점선, 지평선은 실선이므로 색만으로 해석하지 않습니다. 추정 내부는 속 빈 마름모, 비례하지 않는 스케일은 ⤢로 알립니다. 같은 시간 간격 점은 설명용 스캔의 시각이며 실제 낙하 시간·상대론적 시계를 뜻하지 않습니다.

예상 카드는 큰 공통 비교 격자, 굵은 막대·마디·경계로 면적을 사용합니다. Q3의 링 위치와 Q5의 사건 위치는 범주 비교 도해이며 거리 비례가 아닙니다. Q2만 선형 마디의 개수로 실제 비를 셉니다. Q4의 작은 결과는 물리적으로 작은 값이며 큰 막대로 바꾸지 않습니다. 후보별 그림은 같은 눈금에서 비교합니다. 실제 5초 식별성·면적·모바일 가림은 캡처 호스트에서 검수해야 합니다.

사건 순간에는 예상 카드와 비교 틀을 숨기고 막대 따라가기와 해설 기호 하나만 남깁니다. 두 기록이 없으면 비교 SVG와 바깥 카드 모두 그리지 않습니다. 질량 비교는 기존 문법 층의 세 견본 줄과 실제 측정 그래프로 읽습니다.

## 쓰지 않은 표현과 이유

- 사람 삽화·사진·이모지: 탐사 막대의 두 끝과 차이에 집중합니다.
- 자유낙하 궤도·시간 지연 영상: 그 물리를 계산하지 않으므로 스캔으로 구별합니다.
- 변형 길이를 조석의 비로 쓰기: 4배 포화가 있으므로 선형 마디로 읽습니다.
- 모든 힘을 무지개색으로 표시하기: 양의 정체성을 흐리고 색각에 의존합니다.
- 생존 도장·탈출 화살표: intact는 추정 조석 문턱의 판정일 뿐입니다.
- 빈 말풍선·추정 측정 기록: 관찰 근거가 없는 결과를 만들지 않습니다.

## R7 환경 — 블랙홀 곁 우주

`30-room-console.js`의 `ENV_SPEC`가 환경 크기·밀도·위치를 소유하고, `buildEnvironment()` 하나가 모든 환경 지오메트리를 `ROOM`에 붙입니다. 구조 키 `room`은 기존 층 API를 유지하며 이제 우주 환경을 가리킵니다. 방 지오메트리·바닥/창 텍스처·장식 소품·전용 재질과 팔레트는 삭제했습니다. `10-imports.js`는 수정 허용 목록 밖이므로 미사용 `RoomEnvironment` import 한 줄은 남아 있습니다. 실내 반사 장면의 생성과 사용은 삭제했습니다.

| 구성 요소 | 고사양 / 저사양 개수 | 재질·표현 | 위치·크기 (장면 좌표) |
|---|---|---|---|
| 별 하늘 | 구 1, 별 760 / 240 | 검정에 가까운 캔버스 텍스처, 셰이더 반짝임 | 원점 중심 반지름 36, 아래쪽도 우주 |
| 렌징 호 | 48 / 16 | 고정 시드 곡선과 블랙홀 방향 텍스처 굴절·늘어남 | 별 하늘의 블랙홀 방향 주변 |
| 가스 성운 | 1 | 보라·청록 저명도 반투명 셰이더 | (-10, 4, -19), 폭 15·높이 8 |
| 먼 블랙홀 | 검은 원판 1 + 광자 고리 1 | 검정 불투명 중심·옅은 주황 발광색 고리 | (0.2, 1.1, -13), 반지름 1.35 |
| 강착 원반 | 1 | 주황~밝은 크림색 반투명 셰이더, 방위별 도플러 명암 | 같은 중심, 바깥 반지름 2.85·기울기 1.02 rad |

먼 천체는 기본 히어로 구도에서 장치 뒤 상단 오른쪽을 목표로 배치했습니다. 실제 픽셀 위치·가림은 미검증입니다. 크기·렌징·반짝임·도플러 명암은 **추정** 경관이며 물리 질량 선택·낙하 상태·측정 근거를 나타내지 않습니다. 원반 무늬만 천천히 회전하고 도플러의 밝은 쪽은 유지합니다. R9에서 원반 밝기는 1.45배, 최대 알파는 0.72로 정하고 폭과 투영 두께를 늘렸습니다. 공간 셰이더는 안개로 별이 사라지지 않게 합니다.

`70-loop.js`의 한 줄이 이미 `DIRECTOR.time(dt)`를 거친 `physicalDt`로 환경을 갱신합니다. 별 반짝임·성운 흐름·원반 회전 모두 이 누적 시간 하나를 사용하며 별도 슬로 배수는 없습니다. 교사·대기·학생 모드는 같은 환경 인스턴스를 공유합니다. `quality('low')`, `?lite=1` 또는 자동 성능 하향 첫 단계부터 별·렌징 호를 감축하며 블랙홀 실루엣과 조작부는 유지합니다. 새 광원은 없고 기존 주황 키/림·차가운 파랑 필 광원의 색·세기만 조절했습니다. UI CSS·장치·SHOTS·퀘스트/교사 카메라는 유지합니다.

호스트 캡처에는 `environment-high`, `environment-low`, `attract-4` 상태를 추가했습니다. 브라우저·CDN·GPU를 실행하지 않은 검증이므로 heroCoverage 가로 70%·세로 55%, 잘림, UI 픽셀 대비, 모바일 가림과 실제 프레임 비용은 호스트에서 확인해야 합니다.

## R9: 격자 자체가 장치, 조작부는 공중 패널

책상 상자·상판·앞판·앞판 나사·고무 슬롯·황동 띠·띠의 장식 고리를 삭제했습니다. R7의 관측 갑판 테두리·격자·보강재·받침·표시등·난간과 관련 인스턴싱/품질 분기도 삭제했습니다. HERO의 넓은 황동 받침 판과 그 위에 붙어 있던 견본 선반·각인 눈금·장식 계기 판·배선·고정 나사도 삭제했습니다. 사용하지 않는 deck/rail/navy/rubber 재질과 전용 팔레트, KIT.screw를 삭제했습니다. 호환 몸체는 없습니다.

이 주제에는 지면이 없습니다. PHYS.SCENE.top=1.12와 격자 y=1.43, 레일·낙하체·문법 층 좌표는 그대로입니다. 지면·접지 그림자 평면·대체 받침 원반을 만들지 않습니다. 격자 셰이더의 발광 선과 기존 가는 레일이 장치를 정의합니다. 카메라·SHOTS·heroBox·heroCoverage·textAudit·퀘스트·교사·대기 로직은 유지합니다.

위치와 배치 크기의 단일 소유자는 ENV_SPEC.controls입니다. CONTROL_LAYOUT은 이 객체를 참조하며 별도 값을 저장하지 않습니다. 앞쪽 하단의 각 조작부는 개별 반투명 청색 링/패널이고 공통 앞판·기둥·넓은 바닥이 없습니다. 그래프 후광과 슬라이더 바탕 두께는 0.012입니다. 손잡이는 기존 입체 형태를 유지합니다.

| 요소 | 중심 x,y,z | 크기 |
|---|---|---|
| 다이얼 | -1.51, 0.92, 1.25 | 기존 반지름 0.18 링 |
| 그래프 1 | -0.70, 0.94, 1.25 | 화면 0.92 × 0.30 |
| 그래프 2 | 0.38, 0.94, 1.25 | 화면 0.92 × 0.30 |
| 슬라이더 | -0.15, 0.67, 1.25 | 이동 폭 1.90 |
| 재생 | 1.19, 0.93, 1.25 | 바깥 링 반지름 0.14 |
| 스위치 | 1.62, 0.92, 1.25 | 패널 0.20 × 0.24 × 0.012 |
| 확대 표식 | -1.18, 1.18, 1.25 | 기존 스프라이트 |

레이캐스트 배열은 DIAL.knob·SLIDER.handle·PLAY_BUTTON·SWITCH·GRAPHS.mesh를 직접 사용합니다. 평면은 선택한 객체의 getWorldPosition().z에서 만들며 과거의 -1.20 상수는 없습니다. 그래프 드래그 폭도 CONTROL_LAYOUT.graphSize를 참조합니다. DIRECTOR의 그래프 하이라이트는 GRAPHS[1].mesh.getWorldPosition(), 유령 손과 목표는 기존 RAIL_HANDLE/railStart/railEnd/railY/railZ 또는 DOM 버튼 경계에서 얻으므로 이동할 중복 조작부 좌표가 없습니다.

배치와 배경 원반 강조는 **추정** 시각 설계입니다. 브라우저/CDN 제한으로 실제 GPU·375×812 가림·클릭/드래그·교사/대기/예상 카드와의 픽셀 겹침·heroCoverage 수치·textAudit 런타임 결과는 검증하지 않았습니다. 기존 capture의 console, hero, environment-high/low, 모든 퀘스트·교사·attract 상태를 호스트에서 확인해야 합니다.

R9 Node 검증: assemble, 모든 src JS의 node --check, hand-check 284/284, quest-check, teacher-check가 통과했습니다. 추가 모의 실행으로 환경/조작부 생성, 고·저사양 및 자동 하향 갱신, 표와 손잡이/그래프/슬라이더 좌표 일치, 두 그래프의 중앙 드래그 계산을 확인했습니다. 이 모의 실행은 GPU나 실제 포인터 이벤트 검증이 아닙니다.

잔재 검색: 책상 몸체 생성·KIT.screw·갑판/전용 재질·desk/tabletop·Math.random·옛 -1.20 드래그 좌표는 0건입니다. tableWidth는 수정 금지인 src/15-physics.js의 PHYS.GRAMMAR 선언에 1건 남아 있으며 더는 지오메트리를 생성하는 데 쓰이지 않습니다.


## R15 ? Colorfigures ink / black-hole space

The existing floating apparatus, physics, SHOTS, quests, teacher and attract semantics are retained. No floor or contact-shadow receiver is added. Portable engine 47 is copied byte-for-byte from dino-tug; laboratory decisions live in 46.

| Setting | Value |
|---|---|
| Ink / paper | #111122 / #1c1d3a |
| Shadow / opacity | #3f55a8 / .50; no added receiver in empty space |
| Ramp | [0,128,255] |
| Dark / mid / light | [.43,.49,.69] / [.83,.84,.81] / [1.10,1.06,.97] |
| Silhouette / minimum / reference distance | 3.2 CSS px / 1.3 CSS px / 6 world units |
| Inner / opacity / wobble | 1.1 CSS px / .72 / .8 px times URL wobble (default .5) |
| Far fade / fog | [24,48] / [24,48] |
| Depth / normal thresholds | .018 / .28 |
| Paper grain / stain / seed | .025 / .006 / 73.0219 (same as approved reference) |
| Key | #fff0d0, 110, position [-4,7,5], target [0,1.5,0] |
| Ambient | #a6b8dc, .65 |
| High / low | DPR cap 1.6 / 1; shadow map 2048 / 1024; low disables wobble while keeping ink and paper |
| Diagram | cream #f4efe3, ink #221d18, 1.5px border; active #e8b23a |

Reference distance 6 is an estimate for this smaller apparatus and the existing 2?14 unit shots; it needs capture review. Cream stars and 12/6 thin lens arcs sit on dark paper. Nebulae are three flat violet/teal polygon layers. The background hole has a black disk, thicker cream photon ring, orange #b86d49/#d89b62/#f1c68a concentric bands and ink seams. The apparatus disk also uses those three colors with normal transparency; the probe uses the configured three lighting bands without noise. Grid lines are cream/sky blue, grammar lines remain bright. Control screens are unlit cream with dark graph roles; floating cream control plates have geometric ink borders at their original coordinates.

Removed: GTAO, bokeh, bloom and imports; fill/rim/hemisphere/area/control/phenomenon lights; reflection environment; metallic roughness tuning; additive disk blending; continuous nebula/disk noise; focus/bloom resize/capture hooks; AO-specific automatic quality stages; blurred HUD shadows and dark panel colors. Conversion has exactly one construction-time scene call in 50, with cached MAT aliases also converted. Basic/line/sprite/Shader materials retain their types. Transparent, depthWrite=false and Shader decoration is excluded from depth/normal edges by unchanged 47. The director's questLight handle is retained because 68 is limited to panel colors, but detached in boot; its presentation updates therefore illuminate nothing. The portable teacher controller uses the current canonical moon-closer laser colors and has no laser blur.

Static reference comparison: the makeOutlinePass call/options, DPR cap, composer setPixelRatio/setSize and quality shadow-map line match dino-tug literally. In unchanged 47, tDepth/tNormal/tEdges are rebound to the actual attachment textures after ShaderPass cloning; setSize resizes normal/depth and edge targets and both resolution uniforms; each render updates nearFar, inverseProjection, DPR widths and quality wobble. Capture resizes/restores both renderer and composer, then renders through the same pass chain. No custom caller uniform names or independently sized edge targets were introduced. New hero shader color uniforms are declared and provided locally.

Verification: assemble; node --check all 16 JS fragments and assembled ES module; hand-check 284/284 (same baseline); quest-check six paths; teacher-check including byte-identical portable controllers. diff --no-index ../dino-tug/src/47-ink-style.js src/47-ink-style.js: no output, exit 0; byte comparison also identical. Requested dark-color grep equivalent (PowerShell/Node; rg unavailable): one matching line, src/46-ink-config.js:4, the intentional #111122 object ink. Dark HUD panel matches: zero.

Not run: browser/CDN, GPU shader compilation, captures/thumbnail, visible textAudit, actual line thickness/contrast, portrait overlap and pointer interaction. Those remain for the lead's capture host. A static engine limitation is that its silhouette geometryPair suppresses background-neighbor samples, so isolated object/background outlines need visual review; 47 is unchanged, and control plates use explicit geometric borders as a local workaround. No commit or push.
