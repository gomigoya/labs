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


## weight-worlds R4 바인딩 표

원본 컨트롤러의 `closer`는 역사적인 범용 전송 슬롯 이름입니다. 이 실험실에서는 거리나 달 접근량이 아니라 천체 선택 좌표를 전달합니다. 컨트롤러 본문과 `85-attract.js`는 원본과 동일합니다.

| CFG 항목 | 이 실험실의 실제 바인딩 |
|---|---|
| `layerOrder` | console → hero → spring → shelf → balance → jump → force → 무게 크기 → 천체 변경 → 질량 불변 → 추 개수와 무게 비례 → 계측 한계 → 점프 비교 → 중력 방향 → 시험 기록 → 양의 관계. 방을 제외한 전체 키입니다. |
| `layerIcons`, `layerLabels` | layer0~layer15 전용 선화 아이콘과 한국어·영어 이름입니다. 퀘스트 moon/balance/band/star/jump/compact/target과 별도 도형입니다. |
| `numbers` | PHYS.mass(n) kg, PHYS.g(i) m/s², PHYS.gRatio(i) ×, PHYS.weight(i,n) N, PHYS.springState(i,n).marks ×. kg/N/m/s²를 audit와 검사에 함께 추가했습니다. |
| `attract`, `idleSeconds` | 지구 → 달 → 태양 → 중성자별, PHYS.C.ids에서 계산·참조한 선택값, 기본 90초입니다. 숫자 물리 목표를 별도로 복제하지 않습니다. |
| `getCloser`, `setCloser` | S.body.value의 선택 좌표와 set('body',value). 대기 전이는 선택 좌표를 보간하고 PHYS 계산에는 반올림된 유효 천체 인덱스만 넣습니다. 보간 중 천체 사이 중력을 만들지 않습니다. 대기 중 이산 천체가 바뀌면 해당 조건의 점프 시험을 새로 만들고 재생 상태를 유지합니다. |
| `shots`, `verticalShots`, `heroShot`, `shotForStage`, `fly` | SHOTS 여섯 개, SHOTS_VERTICAL 세 개, SHOTS[1] 히어로와 flyTo입니다. 세로 대기는 전체 장치를 사용합니다. |
| `quests`, `getQuest`, `selectQuest`, `questMode` | 기존 QUESTS 일곱 개·Q.i·QUEST.go/mode. 교사 선택은 점수 없이 조건과 층만 설정합니다. |
| `bindMode` | Q.free를 T.mode의 접근자로 연결합니다. 교사 모드에서 학생 진행이 완료를 만들지 않습니다. |
| `predict`, `cardBusy` | 기존 Q.phase/Q.pick·CARDS와 PHYS 결과를 사용합니다. 예상 선택과 실제 조건은 분리하며 교사 시연은 완료 기록을 만들지 않습니다. |
| `getPlaying`, `play`, `oneFrame` | 점프 trial이 없으면 실행을 만들고 재생합니다. 한 프레임은 같은 update 경로를 한 번 진행합니다. 슬로는 DIRECTOR.time 안에서만 곱합니다. |
| `setLayer`, `layerOn` | 공통 layer 훅과 GRAMMAR.enabled/S.layers입니다. |
| `ghost` | A/B 고정은 GRAMMAR.pin(), 해제는 GRAMMAR.unpin(). 천체·추 조건을 점선 참조로 보존하고 카메라 좌표에서 다시 그립니다. |
| `scale`, `frameViewport` | 손잡이·히트 영역 1.4배, 선 굵기, 교사 띠와 상단을 제외한 카메라 프레임입니다. 4열·11행의 높이 계산으로 데스크톱 띠를 맞춥니다. 세로는 2열·19행으로 축소합니다. |
| `reset`, `startStudent`, `refresh` | 드래그·진행·점수·시험·핀·소리·카메라를 복구합니다. 원본 reset의 모든 층 끄기 뒤 refresh가 기본 장치 일곱 키를 복구합니다. 학생 시작은 Q1 층을 켭니다. |
| `ui`, `getUI`, `visibilityReset` | S.ui와 hide-ui, 사이트 셸 표시, S.lastTime 초기화입니다. |
| `language`, `icon` | LANG(ko/en)과 공통 SVG icon()입니다. |

수치 허용 단위는 이식 원본 목록에 kg, N, m/s²를 더한 목록입니다. 이 단위는 교사 수치 층에서만 보입니다. 작은 뷰포트의 띠 축소는 잘림 방지를 위한 결정이며 해당 화면에서 72px 터치를 보장한다는 뜻은 아닙니다. 기본 72px와 1.4배 아이콘을 우선하고 높이가 부족하면 줄입니다. 실제 크기·가림·5초 판독은 캡처 호스트에서 확인합니다.
