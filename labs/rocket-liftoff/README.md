# 로켓은 언제 땅에서 떠오를까

추력·무게·받침 힘의 관계와 연료 감소에 따른 가속도 변화를 비교하는 글 없는 Three.js 실험실입니다. 초등 3~6학년, 물리, 갤러리 순서 8. 상태는 draft, reviewed=false입니다. [교사 안내서](guide.html), [검수 요약](docs/reviewer-brief.md), [이론 카드](docs/theory-card.md), [퀘스트 지도](docs/quest-map.md), [시각 문법](docs/visual-grammar.md), [교사 인터페이스](docs/teacher-interface.md)를 함께 보십시오.

## 실행과 검증

작업 폴더는 D:/labs/labs/rocket-liftoff입니다. PowerShell에서 TEMP·TMP를 D:로 먼저 설정하고 기존 D: 캐시 설정을 유지합니다.

```powershell
$env:TEMP='D:\CodexWork\Temp'
$env:TMP='D:\CodexWork\Temp'
node tools/assemble.mjs
node tools/hand-check.mjs
node tools/quest-check.mjs
node tools/teacher-check.mjs
node D:/labs/tools/serve.mjs --root labs/rocket-liftoff
```

상위 D:/labs 서버 작업 디렉터리 기준의 root 옵션입니다. 서버가 표시하는 주소로 접속합니다. 조각 파일 수정 후 반드시 assemble을 다시 실행합니다. 런타임 빌드 도구는 없으며 Three.js 모듈은 기존 importmap CDN을 사용합니다.

브라우저가 있는 팀장 호스트에서 실행합니다.

```powershell
node tools/capture.mjs --out shots/r4
node tools/capture.mjs --out shots/r4 --only teacher-strip,teacher-numbers,teacher-class-predict,teacher-class-result,attract-1,attract-2,attract-3,touch-pulse,thumb
node tools/capture.mjs --out shots/r4-lite --lite
```

캡처 도구는 기본 로컬 서버와 POST 저장 엔드포인트를 엽니다. Playwright는 D: 설치를 사용합니다. 필요하면 PLAYWRIGHT_MODULE을 D: 모듈 경로로 지정하십시오. `--url`로 외부 서버를 쓰면 썸네일 저장용 POST가 없어 thumb는 실패하므로 기본 로컬 서버로 실행합니다. thumb는 1200×750 UI 없는 히어로 JPEG이며 루트 thumb.jpg에도 복사됩니다. 아직 브라우저 실행·썸네일 생성은 하지 않았습니다.

## 조작

상단은 학생·자유·교사 모드와 여섯 퀘스트입니다. 학생은 예상 그림 → 조작 → 관찰 → 예상/결과 비교 → 원리 카드로 진행합니다. 화면에 단어·수식·문자 눈금은 없고, 접근성 이름은 한국어/영어 사전에서 제공합니다. 틀린 예상도 실제 물리 증거를 관찰하면 진행할 수 있습니다.

노즐 손잡이·더하기/빼기로 엔진 1~5개, 블록으로 추가 짐 0·200000·500000 kg, 구로 지구/달을 선택합니다. 재생 버튼은 점화와 재생/정지, 사건 건너뛰기는 다음 유한 사건으로 이동합니다. 그래프를 드래그하면 관찰 시각을 옮깁니다. 조건을 바꾸면 새 시행으로 준비하고 과거 궤적을 소급 변경하지 않습니다.

자유 모드에서 여덟 문법 층과 고정 핀을 사용할 수 있습니다. 교사 모드는 1.4배 손잡이·선·아이콘, 72px 버튼, 층 쌓기, A/B 고정/해제, 학급 예상, 스포트라이트, 레이저, 선택 수치 층, 초기화를 제공합니다. Space는 재생/정지, 마침표는 한 프레임, Esc는 초기화입니다. 모든 모드에서 /는 UI와 사이트 셸을 함께 숨깁니다. 모드·학급 예상은 퀘스트의 성공 기록을 조작하지 않습니다.

기본 90초 무입력 후 카드 진행 중·교사 모드를 제외하고 대기 시연을 시작합니다. 한 번 만지면 첫 학생 퀘스트로 복구하며 손 맥동을 보입니다. 오류·미처리 Promise 거부 또는 1000 ms 초과 프레임 5회 연속이면 원형 되돌림 복구 화면을 표시합니다.

## URL 옵션

| 옵션 | 효과 |
|---|---|
| `?teacher=1` | 교사 모드로 시작 |
| `?idle=N` | 양수 유한 N초 무입력 뒤 대기. 기본 90 |
| `?lang=en` | 화면 접근성 이름·guide.html 영어 본문 |
| `?lite=1` | AO·보케 끔, 픽셀 비율 1, 그림자 1024, 입자 절반 |

옵션은 &로 조합합니다. 숫자·단위는 교사 수치 층을 켰을 때만 보입니다. 허용 단위는 kg, N, m/s², km, m, s, h, °, ×입니다. 수치 층은 엔진 개수·현재 질량·추력·무게·가속도·시각의 여섯 값입니다.

## 과장과 한계

고도 기본 압축은 ln(1+max(0,h)/1000)/ln(2)이며 실제 장면 이동은 0.50·heightVis/(1+heightVis)로 다시 제한합니다. 1000 m 기준은 전시용 **추정**입니다. 위치 점은 5 s 간격·최대 9개이고 별도 선형 띠는 0.00012 모형 단위/m, ±0.76 이후 끊김 표시입니다. 힘 한 마디는 6900000 N, 최대 6마디 이후 끊김입니다. 불꽃은 추력의 선형 도해이며 실제 길이·온도 예측이 아닙니다. 형상 1.45배도 실제 비율이 아닙니다. 대각선 확장 도형은 과장 표시입니다.

콘솔 전체 점선은 현재 입력의 계산 예측, 실선은 관찰 구간, 밝은 점은 현재값입니다. 예측은 측정 기록으로 판정하지 않습니다. 단면·문법·콘솔 그래프는 저사양에서도 유지합니다.

물리는 수직 단일 단계·일정 추력·일정 배기 속도·일정 중력·공기저항 없음입니다. 고도에 따른 중력 감소, 진공 성능, 단 분리, 자세·곡선 궤도, 착지 충격을 계산하지 않습니다. 지구/달 선택은 중력만 바꿉니다. 새턴 V를 연상시키는 교육용 단순화이며 실제 기체 재현이 아닙니다. **추정**: 착지는 반발 없이 정지합니다. simulate는 해석적 적분을 0.01 s 기본 격자에 표본화하고 사건 시각은 별도로 정확히 보존합니다.

## 결정 기록

- 기본 추가 짐은 0, Q4의 중간→큰 짐은 200000→500000 kg로 기존 설계를 유지했습니다.
- 엔진 하나의 추력은 건조 무게보다 작으므로 ‘연료만 늘리면 결국 뜸’이라는 명세 문장은 채택하지 않았습니다.
- 기존 PHYS 식·상수·판정은 변경하지 않았습니다. 로켓·불꽃의 기존 배율도 유지하고 노즐 간격·카메라·화살표 중복·후보 도해를 조정했습니다.
- TEACHER_CFG의 범용 closer 필드는 로켓에서는 관찰 시각입니다. 컨트롤러와 attract는 원본과 같습니다. teacher-check가 이를 검사합니다.
- 실제 장면 층 네 개도 전체 층 순서에 포함하고 배경 room만 제외했습니다. 교사 쌓기는 장면 층 이후 문법 층입니다. reset 후에는 기본 장치를 복구합니다.
- 상단은 세 모드가 추가되어 학생/자유 상태에서 총 9개입니다. 세 모드와 여섯 퀘스트의 모양은 서로 다릅니다. 교사 상태에서는 퀘스트 바로가기를 오른쪽 띠로 옮겨 상단에는 세 모드만 둡니다. 층 아이콘은 별도 선화입니다.
- 교사 띠는 하나의 4열 격자로 29개 도구를 8행에 배치합니다. 72px 타깃 높이 모델 620px로 720p에 들어갑니다. 작은 세로 화면은 2열 스크롤입니다.
- 가로 예상 카드는 오른쪽, 세로는 아래에 배치하고 카메라가 콘솔까지 두 번 맞추며 후퇴하던 부분을 제거했습니다. 바닥 빈 면은 구도에서 줄이는 방식을 선택했습니다.
- 수정 금지인 30-room-console.js는 유지하고 허용된 40-hero.js에서 drawGraphs를 대체했습니다. 기존 빈 격자 대신 PHYS 예측을 점선으로 표시해 측정과 구별했습니다.
- 브라우저를 실행하지 않았으므로 폴리시의 픽셀 결과·5초 판독 통과를 주장하지 않습니다. meta는 draft와 reviewed=false입니다. 커밋·푸시는 하지 않습니다.

## window.__lab 훅

실제 70-loop.js: `state`, `PHYS`, `quest`, `SHOTS`, `SHOTS_VERTICAL`, `set(name,value)`, `preset(index)`, `shot(index,vertical)`, `flyTo(spec,duration)`, `layer(name,on)`, `step(n,dt)`, `quality(level)`, `textAudit()`, `heroCoverage()`, `perf()`, `capture(name)`.

80·85 모듈이 추가하는 훅: `teacher`와 `attract`. `teacher.mode('student'|'free'|'teacher')`, `teacher.select(i)`, `teacher.command(name)`, `teacher.stack()`, `teacher.reset()`, `teacher.state`, `teacher.config`; `attract.start(stage)`, `attract.wake(pulse)`, `attract.fail()`, `attract.health(ms)`, `attract.state`. `window.GRAMMAR`도 기존 문법 제어·pin/unpin을 제공합니다.

`quest`는 go/pick/mode/open/skip/auto/state/sample과 i/passed를 제공합니다. 디버그 go/auto는 잠금과 별개이며 생산 UI는 순서대로 해제합니다. step은 한 번에 최대 120프레임입니다. 모든 캡처는 step/shot 후 생성해 정지된 rAF에 의존하지 않습니다.

## 검증 범위

assemble, 모든 JS 구문, hand-check 전체, quest-check의 실제 PHYS 자동 경로·오답·중단·기록 수명, teacher-check의 구성·원본 일치·컨트롤러 상태·숫자 감사, guide 태그 균형 및 원문 인용, reviewer 표 재계산은 브라우저 없이 검사합니다. 캡처 도구에는 teacher-*, attract-1..3, touch-pulse, thumb, 세로 세 샷, 1920×1080·1280×720 교사 띠를 추가했습니다.

확인하지 못한 것: WebGL 장면·콘솔 오류·실제 textAudit·터치 타깃 경계·카드 가림·장치 60~75% 달성·색 대비·5 m 판독·5초 후보 판독·저사양 fps·썸네일 픽셀. 팀장 호스트에서 tools/capture.mjs와 실제 교실 관찰로 검수하십시오.


## R9 책상 제거

콘솔 몸체·상판·앞판·장식과 발사대 플랫폼 두 장을 삭제했습니다. 콘크리트 지면은 `PHYS.SCENE.top`(0.84)에서 이어지고 장치는 기존 좌표에 개별 지지대로 섭니다. 배출구·안전 줄·케이블 트레이는 지면 마킹입니다. 조작부는 앞쪽 왼편의 좁은 기둥과 경사 패널로 옮겼습니다. `ENV.terminal`이 배치·크기의 단일 표이며, 형상·입력 판정·드래그·퀘스트 강조와 유령 손이 같은 패널 변환을 따릅니다. 상세 좌표와 결정은 [시각 문법](docs/visual-grammar.md)에 기록했습니다.

R9에서는 `30-room-console.js` 수정이 허용되어 해당 파일을 변경했습니다. 위의 이전 회차 수정 제한 기록을 대체합니다. 카메라, 물리, 퀘스트 정의, 교사·대기 로직, UI 및 구름 캔버스는 유지했습니다. `MAT.deck`은 `MAT.steel`로 바꾸고 사용하지 않는 나사 도우미는 삭제했습니다.

검증: `node tools/assemble.mjs`, 전체 JS `node --check`, `node tools/hand-check.mjs` 193/193, `node tools/quest-check.mjs`, `node tools/teacher-check.mjs` 통과. 별도 수치 검사 24개로 패널 변환 후 그래프·손잡이·슬라이더와 패널의 기존 히어로 경계 포함을 확인했습니다. 실제 WebGL·모바일 가림·`heroCoverage()`·`textAudit()`은 미검증이며 기존 캡처 도구의 hero/console/coastal-site/퀘스트/교사/대기/모바일 상태를 팀장 호스트에서 확인해야 합니다. **추정**: 단말 크기와 경사는 전시용 모형 치수입니다. 커밋·푸시는 하지 않았습니다.
R15: 해안 발사장을 컬러피겨 3단 채색·거리별 잉크선·복숭아 크림 종이와 크림 HUD로 전환했습니다. 공통 `47`은 dino-tug와 동일하며, 값·검증·미확인 항목은 [시각 문법](docs/visual-grammar.md#r15-coastal-ink)에 기록했습니다.
