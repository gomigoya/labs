# 교사·대기 이식 계약 — 공룡과 줄다리기

`src/80-teacher.js`의 `TEACHER_CFG`가 실험실별 연결의 유일한 경계입니다. `const T =` 아래 컨트롤러와 `src/85-attract.js`는 달 실험실 원본을 그대로 복사했습니다. `teacher-check`가 원본과 바이트 일치를 검사합니다. `getCloser`의 이름은 범용 계약 호환용이며 이 실험실에서는 **연속 인원 레일 좌표**를 뜻합니다. 달 거리나 별도 저장 상태가 아닙니다.

| CFG 항목 | 이 실험실의 값·책임 |
|---|---|
| `layerOrder` | `hero`, `console`, `track`, `capacities`, `마디`, `쌓아 채우기·계단`, `문턱·한계 윤곽`, `비교·겹치기`, `숨은 구조·돋보기`, `같은 시간 간격 흔적`, `비교`, `기록`. 배경 `room`만 제외합니다. |
| `layerIcons`, `layerLabels` | 위 순서에 `layer0`~`layer11`, 한국어·영어 접근성 이름을 대응합니다. 퀘스트의 `q1`~`q7`과 구별합니다. |
| `numbers` | PHYS의 인원 ×, 선택 공룡 질량 kg, 아이 팀 한계 N, 공룡 한계 N, 체중 대비 근육 힘 ×. `textAudit`와 검사에 kg·N을 함께 허용했습니다. |
| `attract`, `idleSeconds` | 90초. 작은 종·한 명 → 자갈에서 티라노 최소 승리 인원 → 같은 인원의 유리 → 최대 팀·가장 큰 종. 목표 레일 좌표는 PHYS 상수·최소 인원·railX에서 계산합니다. |
| `shots`, `verticalShots`, `heroShot` | 실제 가로 6개, 세로 3개, 히어로는 `SHOTS[1]`. |
| `shotForStage`, `fly` | 단계 진입 때 종·바닥만 적용하고 세로 대응 샷을 선택합니다. 나머지 레일 보간은 원본 대기 컨트롤러가 소유합니다. |
| `getCloser`, `setCloser` | S.u의 연속 현재값·목표값입니다. 정수 인원 해석은 `PHYS.kidsFromRailX` 한 곳을 사용합니다. |
| `getPlaying`, `play`, `oneFrame` | 기존 재생 쌍과 `step(1)`을 사용합니다. 한 프레임 후 이전 재생 상태를 돌려놓습니다. |
| `setLayer`, `layerOn` | 문법 키는 GRAMMAR, 기본 키는 기존 layer 함수에 직접 연결합니다. 기본 능력 막대는 명시적으로 켰을 때만 표시합니다. |
| `ghost` | `GRAMMAR.pin()`·`unpin()`을 사용합니다. 실제 고정 데이터는 GRAMMAR가 소유하며 T.ab의 closer는 고정 유무와 계약용 scalar입니다. 카메라 이미지를 저장하지 않습니다. |
| `quests`, `getQuest`, `bindMode`, `questMode` | 실제 7개 퀘스트. Q.free는 T.mode 접근자로 연결해 중복 모드 저장을 없앴습니다. |
| `selectQuest` | 실제 시작 조건·층을 사용합니다. 강제 완료·별·학생 관찰 기록을 만들지 않습니다. |
| `predict`, `cardBusy` | 기존 후보·정답과 선언적 solve를 사용합니다. 선택한 오답대로 물리를 조작하지 않습니다. 수업 비교용 샘플은 학생 run 기록과 구별하고 진행·별을 지급하지 않습니다. 카드 진행 중 대기는 차단합니다. |
| `reset`, `startStudent`, `refresh` | 드래그·비행·음향·시간·기록·완료·별·렌즈·고정을 지웁니다. reset 뒤 장치·콘솔·트랙을 복구합니다. 학생 재시작은 첫 퀘스트입니다. |
| `ui`, `getUI`, `visibilityReset` | 기존 UI 쌍·hide-ui·사이트 셸에 연결하며 탭 복귀 때 프레임 시계를 초기화합니다. |
| `scale`, `frameViewport` | 손잡이·아이콘 1.4배, 교사 72px 터치 목표. 교사 띠·상단을 제외한 카메라 영역을 적용합니다. |
| `language`, `icon` | 기존 LANG과 단일 SVG 사전입니다. 단어는 접근성 이름에만 둡니다. |

상태는 원본과 같은 `T={mode,slow,spotlight,laser,numbers,ab,layerStep}`, `A={active,t,stage}`입니다. 슬로는 `DIRECTOR.time()` 한 곳에서만 0.25를 곱합니다. update는 대기 → 물리·문법 → 교사 오버레이 → 카메라 영역 → 렌더 순서입니다. boot는 두 컨트롤러 정의 이후 한 번만 실행합니다.

가로 교사 띠는 4열의 연속 격자입니다. 총 30버튼은 8행에 들어가고 72px 목표와 간격·테두리를 합쳐 720px 높이 안에 들어갑니다. 1440×900, 1920×1080, 1280×720의 실제 높이·scrollHeight는 캡처 보고서가 검사합니다. 좁은 모바일은 72px 한 열을 세로 스크롤해 장치 영역을 남깁니다. 모바일에서는 전체 도구의 동시 노출을 보장하지 않습니다.

`?teacher=1`, 양수 `?idle=N`, Space·점·Esc·/를 지원합니다. 오류 또는 1초 초과 프레임이 다섯 번 연속되면 회전 화살표 복구 오버레이를 표시합니다. 만져서 깨울 때는 학생 첫 퀘스트로 초기화하고 손 맥동을 보여 줍니다.

`node tools/teacher-check.mjs`는 실제 CFG·PHYS·퀘스트 어댑터와 원본 상태 전이를 검사합니다. GPU·DOM 경계는 스텁이므로 화면·포커스·터치·대비·장치 가림을 입증하지 않습니다. `node tools/capture.mjs --out shots/r4`에서 teacher-*·attract-1..3·touch-pulse·세로 3샷·thumb와 가로 세 해상도를 확인하십시오. thumb는 1200×750 렌더 후 실험실 루트 thumb.jpg로 복사합니다.
