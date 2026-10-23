# 교사·대기 모드 이식 인터페이스 — rocket-liftoff

원본은 `../moon-closer/docs/teacher-interface.md`입니다. `src/80-teacher.js`의 `TEACHER_CFG`만 로켓을 압니다. `const T =` 아래 컨트롤러와 `src/85-attract.js`는 원본과 동일합니다(줄바꿈 형식만 무시해 teacher-check에서 비교). 새 실험실도 이 경계를 지켜야 합니다.

| CFG 항목 | 로켓 연결과 계약 |
|---|---|
| `layerOrder` | `console, hero, rocket, fuel`, 이어 `마디, 상쇄·쌓아 채우기, 문턱, 계단, 겹치기·숨은 구조, 시간·운동, 기록, 그래프`. 배경 room 제외 전체 키. |
| `layerIcons`, `layerLabels` | 층 전용 `layer0…layer7` 선화와 `{ko,en}` 이름. 퀘스트 아이콘과 다른 경로. |
| `numbers` | PHYS의 엔진 개수 ×, 현재 질량 kg, 추력 N, 무게 N, 가속도 m/s², 시각 s. 점화 전에는 sceneValues의 비점화 상태를 사용. 표시 소수 둘째 자리. |
| `quests`, `getQuest`, `bindMode` | 실제 QUESTS 6개와 Q.i. Q.free는 T.mode 접근자이며 중복 저장하지 않음. |
| `questMode`, `selectQuest`, `startStudent`, `predict`, `cardBusy` | 퀘스트 시작 조건·학급 예상 연결. 교사 예상은 완료 기록을 만들지 않음. 학생 intro/predict/observe/confirm/card는 대기 제외. |
| `shots`, `verticalShots`, `heroShot`, `fly` | 가로 6개, 세로 3개, 히어로 SHOTS[1], 기존 flyTo. |
| `attract`, `shotForStage` | 1개 연료 끝 → 4개 지연 이륙 뒤 → 5개 연소 중간. 시간은 burnTime/liftoffTime에서 계산. 단계 진입 시 입력과 비행 시각을 초기화. |
| `getCloser`, `setCloser` | 범용 필드명 closer는 이 실험실에서 관찰 시각 t(s). 다른 물리 변수나 달의 거리를 뜻하지 않음. ATTRACT가 이 시각을 보간. |
| `getPlaying`, `play`, `oneFrame` | 점화·재생 상태, step(1). 슬로는 DIRECTOR.time 한 곳의 0.25 배율. |
| `setLayer`, `layerOn`, `ghost` | 기존 layer와 GRAMMAR.enabled, `GRAMMAR.pin()/unpin()`. T.ab는 시간 표식, 실제 고정 기하는 GRAMMAR가 소유. |
| `reset`, `refresh`, `ui`, `getUI`, `visibilityReset` | 드래그·비행·카드·진행·고정·소리 복구. refresh에서 기본 장치 층을 복구. UI 숨김은 사이트 셸에도 전달. 복귀 시 lastTime 초기화. |
| `scale`, `frameViewport` | 손잡이·히트 영역·화살표 굵기 1.4배. 오른쪽 교사 띠와 위쪽 모드 띠를 비우는 전체 화면 투영 오프셋. |
| `idleSeconds`, `language`, `icon` | 기본 90 s, 양수 유한 ?idle=N만 허용, ko/en 접근성 이름, 공통 SVG. |

T는 mode/slow/spotlight/laser/numbers/ab/layerStep, A는 active/t/stage만 소유합니다. /는 공통 HUD, Space·마침표·Esc는 교사 컨트롤러가 소유합니다. URL ?teacher=1은 교사 진입입니다. 대기에서 만지면 첫 학생 상태로 돌아오며 손 맥동이 나타납니다. 오류·미처리 rejection 또는 1000 ms 초과 프레임 5회 연속은 복구 버튼을 표시합니다.

1440×900·1920×1080·1280×720에서는 29개 도구를 4열 8행, 72px 타깃으로 배치합니다. 높이 모델은 620px입니다. 작은 세로 화면은 2열 스크롤을 허용합니다. 이식 원본 CSS를 유지하되 로켓 전용 배치 오버라이드로 하단 잘림을 고칩니다.

`data-numeric`은 켜진 교사 수치 층만 허용합니다. 허용 단위 `kg,N,m/s²,km,m,s,h,°,×`는 textAudit와 teacher-check가 함께 검사합니다. 이름·설명은 접근성 속성에만 씁니다.

조립 순서: 기존 장치·문법 → HUD → 퀘스트 → 카드 → 연출 → 루프 함수 → 교사 → 대기 → boot(). `update`는 대기 갱신 뒤 물리를 계산하고 교사 오버레이를 갱신합니다. 최종 렌더 직전 frameViewport를 적용합니다. 한 프레임은 물리 시간 12배 재생률 및 슬로·사건 배율을 그대로 따릅니다.

`__lab.capture('thumb')`는 UI 없는 SHOTS[1]을 1200×750 JPEG로 저장하고 렌더러·카메라·UI를 복원합니다. tools/capture.mjs는 결과를 루트 thumb.jpg로 복사합니다. 브라우저 검증은 팀장 호스트에서 수행하며 현재 썸네일 파일은 생성하지 않았습니다.
