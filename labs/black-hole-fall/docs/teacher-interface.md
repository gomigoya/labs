# 교사·대기 이식 인터페이스 — black-hole-fall

`TEACHER_CFG`가 실험실별 차이의 유일한 경계입니다. 그 아래 컨트롤러와 `85-attract.js`는 moon-closer 원본 바이트를 그대로 복사합니다. 아래 표는 이 실험실의 실제 연결입니다. 공통 계약·상태는 뒤에 원문을 보존합니다.

| CFG 항목 | 이 실험실 연결 |
|---|---|
| layerOrder | apparatusLayers의 grid, front, disk, horizon, probe → GRAMMAR.LAYERS의 여섯 한국어 실행 키. room·console·hero는 구조 부모여서 제외 |
| layerIcons / layerLabels | layer0~layer10의 서로 다른 선화; 퀘스트 아이콘과 분리. 한국어 실행 키와 영어 접근성 이름 |
| numbers | r 배수, rs/1000 km, r·rs/1000 km, dA m/s², spaghettiR 배수, state.stretch 배수. 소수 둘째 자리 표시; 0.00이 물리적 영을 뜻하지 않음 |
| attract / idleSeconds | PHYS에서 계산한 레일 위치: 먼 상태 → 거리 반 비교 후 → 작은 질량 파괴선 → 중간 질량 지평선. 4단계, 90초 기본 |
| getCloser / setCloser | 공통 closer 슬롯에 S.u의 무차원 레일 위치를 연결. 실제 거리는 PHYS.rFromRailX로 역변환 |
| shots / verticalShots / heroShot | 가로 6개, 세로 3개, SHOTS[1]. 대기 단계 샷 선택 어댑터에서 작은·중간 질량 전환 |
| quests / getQuest / bindMode | 여섯 QUESTS, Q.i; Q.free를 T.mode 접근자로 연결하여 상태를 중복 저장하지 않음 |
| questMode / selectQuest | 기존 QUEST 초기화와 층·카메라 연결만 수행. 강제 완료·별점·판정은 생성하지 않음 |
| predict / cardBusy | 기존 후보·CARDS와 실제 PHYS 기록을 연결. 학급 결과는 후보 선택과 무관하게 정해진 solution 조건을 측정. 학급 시연은 학생 완료 기록과 분리 |
| ghost | 고정 때 GRAMMAR.pin(), 해제 때 GRAMMAR.unpin(). 세계 좌표 기준이므로 카메라 이동 후에도 함께 투영 |
| getPlaying / play / oneFrame | playing 쌍과 step(1), DIRECTOR.time 한 곳에만 slow 0.25 적용 |
| setLayer / layerOn / scale | 기존 layer 프록시, GRAMMAR.enabled·S.layers, 손잡이 1.4배 및 lineScale |
| frameViewport | 상단 띠와 오른쪽 교사 띠를 제외한 카메라 영역 |
| reset / startStudent / refresh | 드래그·재생·입력·진행·카드·잔상·기록 복원, 첫 학생 퀘스트, questUI |
| ui / getUI / visibilityReset | UI·사이트 셸 가시성, 복귀 프레임 시간 초기화 |
| language / icon / fly | LANG, 공통 SVG icon, flyTo |

도구 띠는 섹션을 display:contents로 평탄화한 4열·7행, 버튼 72px·간격 4px입니다. 총 28개이며 1280×720·1440×900·1920×1080에서 높이 산술상 전부 들어갑니다. 모바일은 2열 스크롤로 전환하며 실제 가림은 브라우저 검수 대상입니다. 추가 단위 m/s²는 textAudit와 teacher-check에 함께 반영했습니다. 축약·지수 표기를 쓰지 않는 공통 소수 표시의 정밀도 한계는 안내서에 적었습니다.

## 보존한 원본 계약

# 교사·전시 모듈 이식 인터페이스 (M5)

`80-teacher.js`의 `TEACHER_CFG`가 실험실별 이름·물리·장면 연결의 유일한 경계다. 그 아래 교사 컨트롤러와 `85-attract.js`는 그대로 복사한다. `00-head.html`의 M5 스타일도 복사한다. 화면은 선화 기호만 쓰며, 언어는 접근성 이름에만 적용한다.

| 바꿀 CFG 항목 | 계약 |
|---|---|
| `layerOrder`, `layerIcons`, `layerLabels` | 실제 층 키 전체(방 제외), 쌓는 순서, 기존 `icon()` 키, `{ko,en}` 이름 |
| `numbers` | `{label, fn, unit}` 배열. label은 아이콘 키, fn은 순수 물리 계산값. 허용 단위는 `km,m,s,h,°,×` |
| `quests`, `getQuest`, `bindMode`, `selectQuest`, `questMode`, `predict`, `cardBusy` | 퀘스트 데이터·현재 인덱스·시작 상태/층/샷만 설정. `bindMode(T)`는 기존 자유 모드 플래그를 T.mode의 접근자로 바꿔 중복 저장을 없앤다. 강제 단계·완료 기록은 실행하지 않는다. 예상 선택/경과는 기존 Q가 소유한다. `predict()`는 `{phase,candidates,picture,compare}`를 반환한다. |
| `shots`, `verticalShots`, `heroShot`, `shotForStage`, `fly` | 가로/세로 샷과 부드러운 카메라 이동, 썸네일 샷. 수직 창 샷 등 대응은 여기서 결정 |
| `attract`, `idleSeconds` | `{shot,closer,layers,seconds}` 단계 배열, 기본 무입력 초. closer 목표는 물리 모델에서 계산. `?idle=N`은 양의 유한 초만 허용 |
| `getCloser`, `setCloser`, `getPlaying`, `play`, `oneFrame` | 연속 입력값 조회/설정(즉시 적용 옵션), 재생, 한 프레임 |
| `setLayer`, `layerOn`, `ghost`, `scale`, `frameViewport` | 층 제어, 점선 비교 윤곽, 손잡이/3D 선 배율, 교사 띠를 제외한 카메라 영역 |
| `reset`, `startStudent`, `refresh`, `ui`, `getUI`, `visibilityReset` | 상태·진행·카드·파편 복구, 첫 학생 퀘스트, HUD 갱신/숨김, 탭 복귀 시 프레임 시계 초기화 |
| `language`, `icon` | `ko/en` 선택과 공용 SVG 선화 렌더러 |

상태는 `T={mode,slow,spotlight,laser,numbers,ab,layerStep}`, `A={active,t,stage}`, 기존 `Q`로 분리한다. A/B는 `T.ab={closer}` 한 곳에 저장하며 `S.ab`는 접근자다. 고스트는 세계 좌표에 남으므로 카메라를 움직여도 현재 장면과 같은 시점에서 비교한다. 고정 시점의 별도 화면 이미지는 저장하지 않는다. 입력 시각·포인터 꼬리·오류 프레임 수는 학습/모드 상태가 아닌 입력·표시 작업 데이터다.

호스트 연결 순서: 기존 장면 → HUD → 퀘스트 → 카드 → 연출 → 루프 함수 → 교사 → 대기 → `boot()`. 초기 렌더는 모든 모듈 정의 후 실행한다. `update(dt)`에서 대기 갱신 후 물리를 계산하고 교사 오버레이를 갱신한다. 슬로는 **`DIRECTOR.time()` 한 곳**에서만 `T.slow ? .25 : 1`을 곱한다. 프레임 원래 경과 시간은 `ATTRACT.health(ms)`에 전달한다. 최종 렌더 전에 교사 `frameViewport()`를 적용한다.

상단 3모드는 `TEACHER.mode('student'|'free'|'teacher')`, URL 진입은 `?teacher=1`. 교사 단축키는 Space/`.`/Esc, `/`는 공통 HUD가 맡는다. `--ui-scale`은 1 또는 1.4, `S.lineScale`은 같은 배율이다. 수치 노드에만 `data-numeric`을 붙이고 `textAudit()`는 교사 수치 층이 켜져 있을 때 숫자·허용 단위만 통과시킨다. 새 단위 추가 시 audit 정규식과 검사도 함께 갱신한다.

검증: `node tools/assemble.mjs`, `node tools/hand-check.mjs`, `node tools/quest-check.mjs`, `node tools/teacher-check.mjs`. 브라우저 없는 teacher-check는 구조·실제 층 키·물리 수치·상태 전이·접근성 사전·문자 검사를 실행한다. GPU 고스트와 DOM은 경계 스텁으로 대체한다. 포커스/72px 타깃/투사 대비/세로 가림/썸네일 픽셀은 검증하지 못한다.

브라우저 호스트에서 `node tools/capture.mjs --out shots/m5`를 실행한다. `teacher-*`, `attract-1..3`, `touch-pulse`, `vertical-{student,free,teacher,attract}-{1,2,3}`, `thumb` 상태가 있다. 교사 띠는 1920×1080도 저장하고, 좁은 화면은 세로 스크롤한다. 보고서 `occlusion`/`touchTargets`와 실제 이미지를 함께 검토한다. `__lab.capture('thumb')`는 렌더러·카메라를 잠시 1200×750로 바꿔 JPEG를 저장한 뒤 복원한다. 캡처 도구는 결과를 실험실 루트 `thumb.jpg`에도 복사한다. 오류 오버레이는 재로드 없이 전체 상태를 초기화한다. 로슈 구간의 붕괴 표현은 기존 모델의 **추정**을 그대로 따른다.
