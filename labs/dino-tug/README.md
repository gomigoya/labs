# 공룡과 줄다리기

근육 한계와 바닥 마찰 중 작은 쪽이 당기는 능력을 정하는 과정을 비교합니다. 초등 3~6학년의 예상·조작·관찰 수업용 추정 모형입니다. 기본 학습자 화면에는 단어가 없고 교사 수치 층만 숫자·단위를 허용합니다.

## 실행

PowerShell에서 D: 작업·임시·기존 캐시 설정을 유지합니다.

```powershell
$env:TEMP='D:\CodexWork\Temp'
$env:TMP='D:\CodexWork\Temp'
Set-Location D:/labs/labs/dino-tug
node tools/assemble.mjs
Get-ChildItem src/*.js,tools/*.mjs | ForEach-Object { node --check $_.FullName }
node tools/hand-check.mjs
node tools/quest-check.mjs
node tools/teacher-check.mjs
node tools/capture.mjs --out shots/r4
Set-Location D:/labs
node D:/labs/tools/serve.mjs --root labs/dino-tug
```

서버 주소는 실제 서버 출력을 확인합니다. capture는 자체 정적·POST 서버를 열고 JPEG와 report.json을 저장합니다. 외부 정적 서버의 `--url`은 thumb 저장 endpoint를 제공해야 합니다. 이 작업에서는 브라우저를 실행하지 않았으며 `thumb.jpg`는 팀장 캡처 때 생성됩니다. 원본 달 컨트롤러의 일치 검사는 이웃 moon-closer 저장소가 필요합니다.

## 조작과 URL

인원 손잡이·슬라이더·다이얼은 같은 1~100명 레일입니다. 종 견본은 서로 다른 실루엣, 바닥 견본은 표면 무늬로 구별합니다. 아래 도구대는 기본 도구와 선택 팔레트의 두 줄이며 다음 화살표로 팔레트를 넘깁니다. 자유 모드에서 문법 층·A/B·기록을 조작합니다. 퀘스트는 예상 → 조작 → 관찰 사건 → 예상 비교 → 원리 카드 순서입니다.

상단에서 학생·자유·교사를 선택합니다. 교사 띠는 재생·한 프레임·슬로, 층 쌓기, A/B, 스포트라이트·레이저·수치, 퀘스트 바로가기, 학급 예상·초기화입니다. Space 재생, `.` 한 프레임, Esc 초기화, `/` 전체 UI·사이트 셸 표시 전환입니다. 아이콘·손잡이는 1.4배, 교사 버튼 목표는 72px입니다. 가로 띠는 4열로 압축하고 모바일은 한 열 세로 스크롤을 사용합니다.

- `?teacher=1`: 교사 모드 진입.
- `?idle=N`: 양수 N초 무입력 대기. 기본 90초, 교사와 진행 카드 제외. 입력하면 손 맥동 후 첫 학생 퀘스트로 초기화합니다.
- `?lang=en`: 접근성 이름·guide 본문 영어. 옵션은 `&`로 함께 사용합니다.
- `?lite=1`: 저사양. AO·보케 끄기, 낮은 해상도·입자 수. 실제 프레임률은 브라우저 검수 대상입니다.

[교사 안내서](guide.html), [영어 안내서](guide.html?lang=en), [검수 요약](docs/reviewer-brief.md), [시각 문법](docs/visual-grammar.md), [이식 계약](docs/teacher-interface.md), [이론 카드](docs/theory-card.md), [퀘스트 지도](docs/quest-map.md).

## 과장·근사·한계

힘은 b=F/137.34를 10마디까지 선형, 이후 `10+5 ln(1+(b−10)/5)`로 압축합니다. 20마디의 길이는 15.4930614433입니다. 압축 구간에는 끊김·⤢가 있고 정량 눈금은 같은 변환을 따릅니다. 무차원 체중 대비 근육 힘은 선형입니다.

공룡 전시 크기·발 접촉·깃발·먼지는 **추정 표현**입니다. 실제 키·미시 구조·속도·가속도 복원이 아닙니다. 근육과 아이 계수도 추정입니다. 힘은 수평으로 정확히 합산하며 발톱·자세·기울기·동마찰·줄 질량과 탄성·지형 변형을 무시합니다. 바닥 μ는 대표값입니다. 아르젠티노사우루스의 비율 0.05와 유리 μ=0.05가 우연히 같아 두 한계가 34335 N입니다.

`net`은 능력 차이고 실제 알짜힘이 아닙니다. ±1 N 비김과 최소 승리 인원의 엄격한 초과 정의는 다릅니다. 명세 Q1의 123.0 N은 근육 한계이며 자갈의 실제 작은 공룡 한계는 80.9325 N입니다. 물리 원본과 문서의 보정값을 우선했습니다.

## 결정 기록

| 결정 | 이유 |
|---|---|
| 범용 컨트롤러·대기는 원본 유지 | 실험실별 차이는 TEACHER_CFG에 모으고 바이트 일치를 검사합니다. |
| 연속 scalar를 인원 레일 좌표로 해석 | 이식 계약의 closer 이름은 유지하고 실제 인원 정수화는 PHYS 한 곳에서 수행합니다. |
| 기본 층도 전체 사전에 포함 | room만 제외한 실제 키 전체를 제공하고 reset 후 기본 장치를 복구합니다. |
| kg·N 단위 추가 | 숫자 감사와 teacher-check를 함께 확장했습니다. 개수·무차원에는 기존 ×를 사용합니다. |
| 학급 예상은 기존 solve를 활용 | 정답 물리 장면을 재사용하되 학생 실행 번호·완료·별을 지급하지 않습니다. |
| 4열 8행의 교사 띠 | 세 가로 해상도에서 72px 버튼을 유지합니다. 모바일은 스크롤로 접근합니다. |
| 표현 함수만 물리에 추가 | 기존 상수·판정·힘 함수는 수정하지 않고 전시 크기·프레이밍 경계만 추가했습니다. |
| 예상은 첫 프레임부터 크게 구별 | 깃발 방향, 팀 개수, 실루엣, 분홍 증가·고정·감소를 같은 좌표에서 보여 줍니다. |
| 사건 단일 해설·준비된 렌즈만 표시 | 빈 패널을 없애고 마찰 제한 때만 먼지를 강조합니다. |
| 큰 종과 좁은 화면에서 가림 방지 우선 | 현재 종 경계로 낮은 3/4 시점을 탐색합니다. 예약된 UI 공간에 목표 폭이 들어가지 않으면 폭을 줄이는 대안을 허용하므로, 모든 장면의 가로 65~75%·세로 55% 충족은 아직 보장하지 않습니다. |
| 브라우저 증거는 미확인 | capture 상태와 오류 조건을 준비했지만 실행하지 않았습니다. 가독성·점유율을 통과했다고 주장하지 않습니다. |

## window.__lab 실제 훅

`70-loop.js`: `state`, `PHYS`, `quest`, `mode`, `SHOTS`, `SHOTS_VERTICAL`, `set`, `preset`, `shot`, `flyTo`, `layer`, `step`, `quality`, `textAudit`, `heroCoverage`, `perf`, `capture`.

HUD가 `GRAMMAR`와 문법 키를 받는 `layer`를 연결합니다. 뒤 모듈이 `teacher`, `attract`를 추가합니다. `set`은 `quest`, `species`(키·인덱스), `ground`(인덱스), `mu`, `kids`/`n`, `u`, `t`, `playing`을 받습니다. `mode`는 student/free/teacher이고 explore는 free 별칭입니다. `preset(0..6)`은 작은 종, 트리케라 문턱, 티라노 자갈, 유리, 모래, 30명 설계, 최대 팀·최대 종입니다.

`step(n,dt)`는 0~120프레임, 프레임 간격 0~1초를 받습니다. `capture('thumb')`는 UI 없는 1200×750 JPEG를 요청한 뒤 렌더 크기·카메라·UI를 복구합니다. 일반 capture는 캔버스, 도구의 page.screenshot은 HUD 포함 증거입니다. teacher-check의 DOM/GPU 스텁은 실제 브라우저 포커스·터치·장치 가림·5초 구별 검사와 다릅니다.


## R9: 책상 없는 밀림

책상 몸체·상판·고무발·띠·나사와 트랙 받침을 삭제했습니다. 지면은 `PHYS.SCENE.top`(1.10), 진흙 공터는 트랙 표면까지 완만하게 이어집니다. 장치·카메라·물리·퀘스트·교사·대기 로직은 유지했습니다. `console` 층은 독립 돌 토템이며 그래프 두 개·다이얼·슬라이더·재생·스위치를 담습니다. 세로 화면에서는 토템만 앞쪽 트랙 끝으로 옮겨 관객 쪽으로 회전합니다. 자세·치수는 `CONTROL_LAYOUT`, 지형·장식은 `HABITAT`, 색은 `BIOME`에서 관리합니다.

밝은 연두 노랑 안개/하늘, 더 밝은 진흙과 채움광, 굵어진 가산 혼합 햇살 네 개, 양옆 전경 양치류·바위·덩굴을 추가/조정했습니다. 로우폴리·고정 시드·저사양 감축을 유지합니다. [좌표와 삭제 목록](docs/visual-grammar.md)에 상세 결정을 기록했습니다.

R9 검증: assemble, 모듈 syntax, hand-check **267/267**, quest-check, teacher-check 통과. 토템 조작부 외곽의 해석적 안전 영역 검사도 84/84 통과했습니다. 브라우저/CDN 캡처는 실행하지 않았습니다. 평균 명도·실제 터치·375×812 UI 가림·실시간 heroCoverage/textAudit 결과는 팀장 캡처에서 확인해야 합니다. 커밋·푸시는 하지 않았습니다.

R10: ?? ?? ?? 6???? ??? 3? ???? ?? ??????? LOD? ?????, ???? ?? ??? [visual-grammar](docs/visual-grammar.md)? ??????.

R12: 밀림 3D를 공통 `src/47-ink-style.js`의 3단 채색·잉크선·종이 렌더로 전환했습니다. [룩·설정·검증](docs/visual-grammar.md#r12--colorfigures-ink-rendering).

R13: 설정을 `src/46-ink-config.js`로 분리하고 `47`을 공통 엔진으로 정리했습니다. 거리별 2.6→1.0px 잉크, 원경 감쇠·배경 경계 제외, 크림 패널과 1.5px 테두리, 공룡 면별 3톤 양자화를 적용했습니다. [값·API·검증 한계](docs/visual-grammar.md#r13--distance-ink-and-portable-engine). assemble·syntax·hand-check 267/267·quest-check·teacher-check 통과. 브라우저 및 새 캡처는 미확인입니다.
