# 블랙홀에 빠지면

양 끝 당김의 차이를 탐사 막대·두 경계 링·선형 마디로 비교하는 글 없는 천체 모형입니다. 초등 3~6학년 심화 탐구이며 4과13-02·4과13-03과 연결합니다. 교사 수치 층만 숫자·허용 단위를 보입니다.

## 실행과 검사

```powershell
$env:TEMP='D:\CodexWork\Temp'
$env:TMP=$env:TEMP
Set-Location D:/labs/labs/black-hole-fall
node tools/assemble.mjs
node tools/hand-check.mjs
node tools/quest-check.mjs
node tools/teacher-check.mjs
node tools/capture.mjs --out shots/r4
Set-Location D:/labs
node D:/labs/tools/serve.mjs --root labs/black-hole-fall
```

기존 D: 캐시 설정을 유지합니다. 조립 결과 index.html은 직접 편집하지 않습니다. capture는 Playwright·WebGL이 있는 호스트에서 실행하며 자체 로컬 서버를 사용합니다. `--url`, `--only teacher-base,teacher-numbers,thumb`, `--lite`, `--out`을 지원합니다. thumb 상태는 1200×750 UI 없는 히어로 캔버스를 저장하고 루트 thumb.jpg로 복사합니다. 이 작업 환경에서는 브라우저 캡처를 실행하지 않았으므로 thumb.jpg는 호스트 실행 후 생성됩니다.

## 조작

레일 손잡이·콘솔 슬라이더·거리 그래프는 같은 거리를 조절합니다. 오른쪽이 가까우며 걸림은 r=1000,200,40,20,1,0.01,0.0005입니다. 질량 버튼 세 개는 태양 질량 10·400만·10억 배, 막대 손잡이·다이얼은 세로/가로 방향입니다. 앞판 분해 버튼으로 격자 앞쪽을 엽니다. 소리는 기본 꺼짐입니다. 비교 버튼은 현재 실행의 측정 두 개가 준비되었을 때만 퀘스트 증거로 인정됩니다.

상단 학생·자유·교사 세 모드와 퀘스트 여섯 개를 고릅니다. 학생은 예상→조작→사건→확인→카드 순서입니다. 틀린 예상도 실제 증거를 만들면 완료하며 정답 두 가지인 Q6은 모두 인정합니다. 교사는 오른쪽 띠에서 재생·한 프레임·슬로·층·A/B·스포트라이트·레이저·수치·학급 예상·초기화를 조작합니다. 층 아이콘은 퀘스트와 분리한 선화입니다. Space는 재생, `.`는 한 프레임, Esc는 초기화, `/`는 UI와 사이트 셸 표시 전환입니다.

교사·학습 카드 중을 제외한 무입력 90초 후 대기합니다. 입력하면 손 맥동과 함께 첫 학생 퀘스트로 초기화합니다. 오류·거듭된 프레임 정체는 ↺ 오버레이로 복구합니다. 교사 도구는 데스크톱 4열·7행, 72px이며 모바일은 2열 스크롤입니다.

## URL과 문서

`?teacher=1` 교사 시작, `?idle=N` 양의 유한 초 대기 간격, `?lang=en` 영어 접근성 이름, `?lite=1` 저사양 시작입니다. 옵션은 `&`로 결합합니다. [교사 안내서](guide.html), [English guide](guide.html?lang=en), [검수 요약](docs/reviewer-brief.md), [시각 문법](docs/visual-grammar.md), [이식 계약](docs/teacher-interface.md), [이론 카드](docs/theory-card.md), [퀘스트 지도](docs/quest-map.md)를 참고하세요.

## 과장·근사·한계

거리 레일은 구간 로그 압축과 걸림 주변 선형이며 장면 거리는 `4.5−3.9·railX`입니다. Δa=100 m/s²에서 늘어남 1.7, 최대 4배 포화는 추정 표현입니다. 부피 보존 모양·격자·원반·입자는 추정이며 ⤢로 알립니다. 선형 마디만 실제 Δa 비를 보여 주고 로그 그래프는 1e-12~1e20 m/s² 범위입니다. 같은 시간 점은 설명용 스캔이며 실제 자유낙하 시간이 아닙니다.

뉴턴 선형 조석(L≪d)을 지평선 근처·안쪽으로 형식적으로 연장한 추정입니다. 상대론적 궤도·시간 지연·복사·조직 손상은 계산하지 않습니다. 100 m/s²는 인체 안전 기준이 아닌 추정 학습 한계입니다. 지평선 안의 intact는 탈출·생존 보장이 아닙니다. 상태 모양은 현재 입력에 가역적이며 사건 기록은 별도입니다. r=0·오버플로는 singularity/value:null, 잘못된 측정은 null, 빈 데이터는 빈 목록입니다. 실행 간 기록을 섞지 않습니다.

수치 층은 r 배수, rs km, 실제 중심 거리 km, Δa m/s², 파괴 반지름 배수, 늘어남 배수 순서입니다. 공통 컨트롤러의 소수 둘째 자리 표시 때문에 작은 값은 0.00일 수 있습니다. 정밀 비교는 PHYS 값·측정 마디·검수표를 사용합니다.

## 결정 기록

- 원본 교사 컨트롤러·대기 코드는 바이트 동일성을 검사합니다. 모든 실험실 연결은 TEACHER_CFG에 둡니다. closer라는 공통 슬롯은 이 실험실에서 레일 위치입니다.
- 구조 부모 room·console·hero는 교사 층에서 제외하며 자식 11개 표현 층을 다룹니다. 부모를 숨겨 장치 전체가 사라지는 실수를 피합니다.
- 도구 띠의 섹션을 CSS로 평탄화하여 28버튼을 4열에 놓았습니다. 세 데스크톱 해상도 높이는 산술 검증했고 실제 가림·명암은 호스트 검수 대상입니다.
- 몸은 presentationState라는 표현용 순수 함수로 확대했습니다. 기존 물리 상수·판정·R1/R2 함수는 보존했습니다. 궤적은 WebGL linewidth 의존 대신 겹친 점선과 큰 점을 씁니다.
- 사건은 빈 말풍선 대신 막대 따라가기와 기호 하나로 표현합니다. 비교 기록이 없으면 바깥 카드도 그리지 않습니다.
- 상단은 3모드+6퀘스트, 총 9아이콘입니다. 브리프의 8개보다 실제 필요한 모드가 하나 늘어 9개를 사용합니다.
- Q3는 기존 상태 정의를 따라 경계에서 온전, 안쪽에서 파괴입니다. Q6의 중간·큰 질량 모두 성공합니다.
- Q3·Q5 예상 후보는 범주 도해입니다. 위치 비례를 주장하지 않으며 공통 눈금·굵은 윤곽으로 차이를 보입니다. 5초 식별성은 미검증입니다.

## 실제 window.__lab 훅

70-loop.js: `state`, `PHYS`, `quest`, `SHOTS`, `SHOTS_VERTICAL`, `PRESETS`, `set`, `preset`, `shot`, `flyTo`, `layer`, `step`, `quality`, `textAudit`, `heroCoverage`, `perf`, `capture`.

80/85에서 `teacher`, `attract`를 추가합니다. `set`은 r·u·massIndex·orientation·playing·sound·cutaway·t, `quality`는 high/low를 받습니다. `layer`는 room·console·hero·grid·front·disk·horizon·probe와 여섯 GRAMMAR.LAYERS 키를 받습니다. `window.GRAMMAR`는 set·pin·unpin·baseline을 제공합니다.

캡처 상태에는 모든 qN 단계, teacher-base/play/frame/slow/reset/layers/numbers/ab/predict/spotlight/laser/recover, attract-1..3, touch-pulse, thumb와 1920×1080·1440×900·1280×720·375×812 뷰포트가 있습니다. Node 검사는 GPU·실제 터치·포커스·그림 면적·5초 규칙·사이트 셸 가림·픽셀 대비를 보장하지 않습니다.
