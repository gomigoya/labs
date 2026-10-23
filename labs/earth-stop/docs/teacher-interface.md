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


## earth-stop의 실제 TEACHER_CFG

| 항목 | 이 실험실 연결 |
|---|---|
| `layerOrder` | hero → console → globe → pin → body → speed → benchmark → 접선 속도의 크기 → 벤치마크 비교 → 위도에 따른 감소 → 관성 → 낮밤 경계 → sun → 상대 각속도 → 설계 속도 한계 → 반복 관측 |
| `layerIcons`, `layerLabels` | 층 전용 격자·마디·계단·원호 아이콘과 한영 사전. 퀘스트의 globe/pin/tangent/sun/ring/limit 모양과 구별합니다. |
| `numbers` | 현재 위도 °, 현재 속도 또는 급정지 측정 m/s, 속도/343 ×, solarDay/86400 ×, phiSafe(27.78) °. ×의 의미는 행 아이콘으로 구별하고 이 문서에 정의합니다. |
| `quests`, `bindMode` | QUESTS 여섯 개, Q.free를 T.mode의 접근자로 연결합니다. 교사 예상은 완료 기록을 지급하지 않습니다. |
| `selectQuest`, `predict` | 실제 시작 조건을 적용하고 선택과 무관하게 질문의 정답 조건을 실행합니다. Q3는 실제 executeStop 측정을 사용합니다. |
| `shots`, `verticalShots`, `heroShot` | 가로 여섯 샷, 세로 세 샷, SHOTS[1] 히어로. |
| `attract` | 현재 속도 → 30일 자전 → 완전 정지 → 현재. PHYS.periodRailX로 목표를 계산합니다. |
| `getCloser`, `setCloser` | 범용 슬롯 이름을 그대로 보존하며 값은 지구 자전 P 레일의 정규화 위치입니다. 거리나 감속 물리량이 아닙니다. 정지 걸림에서는 불연속 전환합니다. |
| `ghost` | 고정은 GRAMMAR.pin(), 해제는 GRAMMAR.unpin(). T.ab.closer에는 레일 위치만 있으며 실제 기하 스냅샷은 GRAMMAR 하나가 소유합니다. |
| `reset`, `refresh` | 실행·기록·완료·음향·연출을 지우고 장치 구조를 복원합니다. 의미 층은 초기화 후 다시 쌓습니다. 학생 복귀는 첫 퀘스트입니다. |
| `scale`, `frameViewport` | 손잡이·속도 띠·점·아이콘 확대. 도구 띠 제외한 카메라 영역. 데스크톱 4열 72px, 33개 버튼 9행으로 720px 높이 안에 배치합니다. 모바일은 뷰포트 식으로 셀 크기를 줄입니다. |

컨트롤러와 85-attract.js는 달 원본과 동일합니다. 달 전용 장치 참조가 경계 밖으로 나오지 않는지 teacher-check가 검사합니다. 구조 검사와 DOM 경계 스텁 검사는 실제 렌더 검증을 대신하지 않습니다. 허용 단위에 m/s를 추가하여 textAudit와 teacher-check를 함께 갱신했습니다. teacher 수치 층을 켠 경우에도 표식 없는 숫자·단어는 허용하지 않습니다.
