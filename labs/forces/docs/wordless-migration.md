# forces 실험실 '글 없는 기준' 이전 설계 (P0-1)

기준 문서: `prompts/master-lab-prompt.md`(글자 0, 시각 문법, 두 모드), `prompts/plan-wordless-lab.md`, 메모리 no-illustrations-in-lab.
근거 계획: `docs/plan-vs-iscream.md` P0-1. 사용자 결정(2026-10-21): forces는 새 기준으로 이전한다.

## 1. 지금과 새 기준의 차이 (코드 확인 사실)

`src/65-kid.js`(쉬운 모드, 614줄)와 그 CSS·HUD에 아래가 있다. 전부 새 기준이 금지하거나 바꾸라는 것이다.

| 항목 | 현재 | 새 기준 |
|---|---|---|
| 화면 글 | 퀘스트 이름·설명(`t`), 예상 질문·보기 글(`pred`), 결과 문장(`win`), 미터 라벨(`meter`), 인트로·끝 화면, 화살표 이름(`KID_NAME`), 힘 카드 이름·설명(`CARDS`), ⭕❌ 문장 퀴즈(`KID_QUIZ`) | 기본 화면 단어 0 |
| 마스코트 | `quokka()` 길잡이 캐릭터 | 금지 |
| 이모지 | 퀘스트 `icon: '👉'` 등, 문자열 안 🤔🎯😮🔇🔊⭕❌ | 금지. 코드 도해 아이콘(`ICON`)만 |
| 음성 | `speak()`가 모든 안내를 말로 읽음(speechSynthesis) | 말소리 해설 금지. 효과음·소리화만 |
| 점수 | 숫자 점수(퀘스트 100점 등) | 별 개수로만 |
| 툴팁 | `title="..."` | 금지 |

## 2. 설계 결정 (사용자가 번복할 수 있음)

D1. **쉬운 모드(기본)가 학생 '탐험' 모드가 된다.** 글·이모지·마스코트·음성을 모두 뺀다. 이름 `kid` 는 코드에서 유지한다(호출부가 많다).
D2. **글이 하던 일은 시각 문법이 맡는다** (master 3장).
- 목표 안내: 이미 있는 유령 손(`hint`), 눈길 고리, 목표 깃발·한계 윤곽.
- 예상: 보기 그림 2~3개. 지금 `PRED_PIC`이 이미 아이콘·견본·숫자를 갖고 있다. 글 라벨(`.kol`)과 질문 문장을 없애고 숫자는 마디 개수로 바꾼다.
- 결과 확인: 고른 보기와 실제 결과를 겹쳐 보이고, 맞으면 도장, 다르면 두 그림을 나란히 둔다(점수 깎지 않음, 기존 방침).
- 결과 설명 문장(`win`) → **원리 카드**(그림 등식 한 장). 퀘스트마다 하나, 코드로 그린다.
D3. **화살표 이름은 3D 라벨 알약에서 뺀다.** 색 + 모양(굵기·끝 모양)으로 구분한다. 이름은 교사 안내서(guide)에만 둔다.
D4. **정리 퀴즈(⭕❌ 문장) 삭제.** 글 없이 문장 퀴즈를 만들면 퀴즈가 아니다. 10단계는 '힘 카드 앨범'(원리 카드 7장을 모아 둔 화면)으로 대체한다. 평가는 9단계 설계 도전(조건을 골라 목표를 이루는 과제)이 맡는다.
D5. **점수는 별.** 숫자 점수와 `pts` 사전을 지운다. 예상 적중도 별 하나로 보인다.
D6. **음성(`speak`)과 `VOICE` 상태 삭제.** 소리 토글은 효과음용으로 남기고 아이콘만 쓴다.
D7. **언어 사전 정리.** 화면에 글이 없으면 `KTX`, `STAGE`, `KID_NAME`, `CARDS` 의 ko/en 문장은 필요 없다. 화면에 보이지 않는 `aria-label`(ko/en)만 남긴다. 사용처를 옮긴 뒤 사전을 같은 작업에서 지운다(pstack: 호출부 이전 후 구 API 삭제).
D8. **자세히 모드는 교사 '시연' 모드로 개편한다 (후속 P0-1b).** 지금은 HUD·지도서(G)·평가(Y)가 글 중심이다. 기본 화면은 아이콘 + 수치 층(숫자는 여기서만)으로, 지도서·평가 글은 별도 `guide.html`로 옮긴다. 쉬운 모드(P0-1a)를 먼저 끝낸다.
D9. **쿼카 캐릭터는 실험실 화면에서만 뺀다.** 사이트 브랜드(quokkalabs 도메인)에는 영향이 없다.

## 3. 작업 단위 (각 단위는 검증 가능한 상태로 끝난다)

| 단위 | 내용 | 검증 |
|---|---|---|
| U1 | `__lab.textAudit()` + `tools/text-audit.mjs` + 기준선 문서 | 도구가 돌고 현재 단어 수가 기록된다 |
| U2 완료 | 금지 요소 제거: 쿼카, 이모지, 음성, 툴팁 | audit: emoji 0, tooltips 0, 코드에 speechSynthesis·quokka 없음 |
| U3 | 구현 완료: 공통 그림 렌더·미터·예상 데이터 통합 | 조립·구문·hand-check 83 통과, DOM U3 gate·모바일 시각 검증은 팀장 실행 대기 |
| U4 구현 완료 | 공통 SVG 원리 카드 13장(기존 3+추가 10), 확인 겹침, 별, 인트로·끝·자유 실험 3장치·힘 카드 앨범, 문장 퀴즈 삭제 | 조립·module 구문·감사 도구 구문·hand-check 83·소스 렌더 검사 통과. 브라우저 U4 게이트·375×812 시각 검증은 팀장 실행 대기 |
| U5 구현 완료 | 캔버스·3D·조건부 글 제거, 콘솔 각인 숨김, 전환·끝 화면 해설 정리 | 조립·구문·hand-check 83·U5 정적 게이트 통과. 브라우저 시각 검증 대기 |
| U6 | 5초 테스트(글 가리고 전·후 캡처만 보고 원리를 말하는지) | 퀘스트별 판정표 |
| U7 | (P0-1b) 자세히 모드 → 시연 모드, guide.html | 별도 계획 |

U2: 쿼카·음성·듣기 UI·이모지·쉬운 모드 툴팁 제거, 효과음 전용 SVG 토글과 공통 선화 손 적용; 조립·구문·83개 손계산·정적 검사 통과(브라우저 검증은 팀장 확인 대기).

U2~U5는 같은 파일(`65-kid.js`, `00-head.html`)을 건드리므로 순서대로 한다. 한 단위가 끝나면 Claude가 직접 audit와 캡처를 돌려 확인하고 다음 단위를 시작한다.

## 4. 지키는 것

- 물리 모듈(`15-physics.js`)과 `tools/hand-check.mjs`(21개 손계산) 결과는 그대로.
- 퀘스트 13개의 완료 조건과 순서는 그대로이며, 마지막은 boss다. 문장 퀴즈는 U4에서 삭제했다.
- 삽화·생성 이미지·사진 금지(기존 결정). 새 그림은 모두 코드로 그린 선화.
- 장면 속 손잡이 조작, 예상 전 잠금, 7초 무조작 시 유령 손 재시범은 유지.

## 5. 위험

- 글 없이 목표를 알리는 방법이 약하면 아이가 막힌다. U3 뒤에 반드시 사람이 한 번 해 본다(5초 테스트 + 막힘 지점 기록).
- 원리 카드의 그림 등식이 원리를 오해하게 만들 수 있다. 카드마다 `guide`에 한 줄 근거를 쓴다.
- 3D 라벨은 DOM으로 안 잡힌다. U5는 audit만으로 완료 판정을 하지 않는다.

U4 검증 대기: node tools/text-audit.mjs는 브라우저 제한 때문에 여기서 실행하지 않았다. 도구는 훅에서 퀘스트 수를 읽으며, 인트로·13퀘스트의 예상/조작/성공·끝·자유 실험 3장치를 모두 측정하고 요약 끝에 nonzero 상태 목록과 U4 gate: PASS/FAIL을 쓴다. 퀘스트별 원리 의미·예상/정답 배치·모바일 잘림·잠금 실루엣은 팀장이 브라우저에서 확인한다.

## U5 — 캔버스·3D·조건부 글 (2026-10-21)

`src/*.js`·`src/00-head.html`의 `fillText`, `strokeText`, `engravedPlate`, `textContent`, `innerHTML`을 전수 검색하고 호출자·부모 그룹·모드 CSS를 확인했다. 아래는 쉬운 모드 도달 경로와 자세히 모드 제외 목록이다. 숫자·한 글자 기호·코드 선화는 유지한다. 화면에 보이지 않는 CSS·HTML 속성·SVG 경로 문자열은 표시 글자로 세지 않는다.

| 파일:줄 | 글 리터럴 / 경로 | 처리 |
|---|---|---|
| `src/00-head.html:961` | 조건부 `SLOW ×0.25` | 선화 감속 화살표 + `×0.25`; 점멸 점 CSS 삭제 |
| `src/65-kid.js:415` | 유령 손의 끌기·누르기 문구 | 두 `strokeText`/`fillText` 라벨 삭제, 손 선화 유지 |
| `src/65-kid.js:432` | `잠김 N%` / 힘 읽기 | 숫자 + `%`, 숫자 + `N`만 유지 |
| `src/68-director.js:249` | 당기는 힘·붙잡는 힘·저울·부력 범례 | 이름 배열·문자 출력 삭제; 보라/빨강/초록/하늘 점과 방향 화살표 |
| `src/66-themes.js:4` | 칠판의 힘 설명·`1 N`, class 테마 | 퀴즈 사용처 없음. 초기·끝 화면 기본값을 field로 옮기고 칠판·전용 바닥·색 삭제 |
| `src/30-room-console.js:225` | LUMEBENCH 명판, 재생, 왼쪽/오른쪽 당김, 힘 장부, 기록 그래프 | 각인 6개를 `CONSOLE.plates`로 관리, `src/66-themes.js:136`에서 kid 진입 시 숨김·full 복귀 시 복원. **U7 에서 처리** |
| `src/30-room-console.js:250` | 중력 가속도·행성 이름·수조 높이·`28 cm` | 기존 다이얼 그룹 숨김 확인. **U7 에서 처리** |
| `src/40-hero.js:65` | 용수철 저울·트랙·비커 눈금 숫자, `N` | 허용, 숫자 눈금 유지. 비커 눈금은 원래 숫자만 사용 |
| `src/40-hero.js:354` | 길이 자의 `cm` | 별도 단위 메시로 분리, `:399`에서 kid 숨김; 숫자는 공용 유지. **U7 에서 처리** |
| `src/60-interaction-hud.js:669` | 자유 실험 저울 이름·화살표 이름 | kid 이름은 빈 문자열. 이름 사전 `KID_NAME` 삭제; `kidName()` 사용처 없음. full의 `T(names[k])` 유지 |
| `src/60-interaction-hud.js:670` | 밀도·도막·바닥 이름, `kg/m³`, `m/s`, 마찰계수 | kid에서 해당 라벨 비표시 조건 확인; 이름 층도 `body.kid #labels b`로 숨김. **U7 에서 처리** |
| `src/45-balance.js:51`, `src/67-kid-handles.js:146` | 양팔저울 숫자, 도구대 수치·개수·`N` | 허용; 스타일 `textContent`는 CSS |
| `src/64-kid-cards.js:1`, `src/65-kid.js:265` | 퀘스트·예상·원리 카드·앨범·인트로·끝·자유 실험 DOM | SVG 도형·수치 경로 확인. 단어 없음; aria-label은 비표시 메타데이터 |
| `src/68-director.js:189`, `src/69-depict.js:71` | 콜아웃·렌즈 값, 실험 노트 | 숫자·선화·재질 견본만 유지. `dirTeleReset()`에서 연결선 포함 즉시 제거; 노트 기록은 보존 |
| `src/30-room-console.js:156` | 방 포스터의 영문 제목·힘 공식, 계기판 `N` | kid에서 부모 ROOM 숨김. **U7 에서 처리** |
| `src/20-scene-kit.js:144`, `src/60-interaction-hud.js:525`, `src/70-loop.js:130` | 각인/다이얼 공통 함수, full DOM·수업·모달, drawScreenA/B | 호출자·부모 그룹·kid CSS 및 event 모드 가드 확인; 콘솔 화면 그룹 숨김. **U7 에서 처리** |
| `src/70-loop.js:464` | 추가 발견: 초기화 오류 시 화면 `pre` | kid는 콘솔에만 기록, full 오류 화면 유지 |

끝 화면 진입(`src/65-kid.js:242`)에서 정리를 먼저 실행한다. `dirTeleReset()`은 콜아웃 DOM·퇴장 중인 렌즈까지 제거하고 노트를 즉시 숨긴다. 끝 화면에서는 새 사건 해설 생성을 막는다. 퀘스트 전환·자유 실험 전환의 기존 정리 호출도 같은 경로를 쓴다.

U7b-2 supersedes the old U5 whole-file SHA-256 policy: the gate now checks literal patterns in all source files, with no mode or file-hash exemption. Run `node tools/text-audit.mjs --static-only`; it reports every violation and the four semantic exclusion reasons. Browser/DOM verification remains separate.

브라우저 감사에는 인트로 측정 직후 `body.kslow`를 강제로 추가한 별도 측정 1회를 넣고 `finally`에서 원래 상태를 복구한다. U4 예상 상태 수도 1개 늘렸다. 이 조건부 측정과 실제 브라우저 시각 검증은 미실행이다. 정적 옵션 편집 실패 후 이전 감사 도구가 브라우저 시작을 시도한 실수가 있었으며 실행을 중단했다. 유효한 브라우저 측정 결과는 없다.

검증 완료: `node tools/assemble.mjs`, 조립된 module을 stdin으로 전달한 `node --input-type=module --check`, `node --check tools/text-audit.mjs`, `node tools/hand-check.mjs`(83개 모두 일치), 정적 전용 U5 gate PASS. 별도 Node VM 점검으로 전환 즉시 제거·끝 화면 render 전 정리·노트 기록 보존을 확인했다. `끌어요`·`눌러요`·`SLOW`·`KID_NAME`·`kidName`은 src 0건; LUMEBENCH는 full 전용 각인 원본 1건만 남는다. 물리 모듈과 hand-check는 이번 작업에서 수정하지 않았다.

브라우저 확인 대기: 감속 배지 강제 표시 측정, 모든 퀘스트·예상·성공·자유 실험·앨범 동작, 마지막 퀘스트 직후 끝 화면의 알약/연결선/렌즈/노트 잔상, full↔kid 전환 시 각인·단위 복원, 숫자 눈금·범례 식별·모바일 잘림. 시각 결과는 미확인이며 소스 근거로만 판단했다.

### U6 — 5초 테스트 가독성 수정 (2026-10-22, 브라우저 확인 대기)

- 카드 획득 팝업은 매 프레임 측정한 지시 패널·진행 표시의 아래로 옮긴다. 모바일 세로에서는 팝업을 축소하고 성공 카드를 원리 그림·비교 그림·별·44px 다음 버튼의 가로 배치로 압축했다(최대 높이 150px).
- 쉬운 모드 세로 끌기대 카메라만 거리·화각을 조정했다. 매달기대·저울 및 full 카메라 설정은 유지한다. 장면 확대 후 라벨 가독성은 브라우저 확인 필요.
- 감속 칩은 좌하단에서 계기판·도구대·성공 카드·앨범 위로 피한다. 기존 slower 선 아이콘과 ×0.25 숫자를 사용한다.
- motion 성공 그림은 각 힘 화살표와 같은 행에 6개 점을 놓는다. 가속은 간격 증가, 감속은 간격 감소이며 점 열 줄바꿈을 없앴다.
- lever 예상 그림은 삼각 받침점·고정 왼쪽 추·세 위치의 오른쪽 추를 크게 표시한다. clip 예상 그림은 큰 점 10개씩 1/3/6행이다. 해당 두 퀘스트의 보기만 확대하고 카드 내부 여백을 둔다.
- 같은 방향 F1/F2의 화면 손잡이와 값 라벨은 위아래 92px 간격으로 분리했다. 물리 좌표·값·판정은 유지한다. 힘 콜아웃·렌즈·계기·노트의 수치에는 N을 붙였다.
- 삭제: motion의 두 격자 점 줄 및 해당 계산 변수, 작은 지레의 기존 도식, 감속 칩의 기존 상단 위치·역방향 화살표 도형. cardDots는 다른 카드에서 사용하므로 유지한다.
- 검증: assemble PASS; 조립된 module 구문 PASS; text-audit 구문 PASS; hand-check 83/83; static gate PASS(0 violations). 임시 Node VM 검사에서 clip 점 수·행 수, lever 받침점·고정 추, motion 행별 간격 변화도 PASS. 물리 파일·hand-check 파일은 작업 시작 시점 SHA-256과 같음을 확인한다.
- 팀장 브라우저 확인: 375×812 퀘스트 1/13 성공 팝업과 ②③ 단계 비겹침, 퀘스트 1/2/3/12 끌기대 확대·라벨·양 끝 이동, 퀘스트 8/13 성공 카드 높이와 장면 노출, 달/물 퀘스트의 감속 칩과 열린 노트·계기 비겹침, 데스크톱 motion 두 줄의 가속/감속 식별, lever/clip 예상 보기의 크기·우측 여백, team 두 손잡이·0.0 N 라벨 분리, boss 수직항력 N, 전체 DOM 글자 게이트와 full 전환 회귀. 새 캡처·브라우저/DOM PASS는 주장하지 않는다.
- 지정 항목 외 추가로 확인한 가시적 결함은 없다. 실제 개선 정도는 브라우저 확인 전 추정이다.

### U7b-1 — DOM 교사 시연 모드 구현 완료 (브라우저 감사 대기)

- 제목·소개·설명·힌트·토스트·앱 내 지도서/평가/도움말 및 평가 저장 코드를 삭제했다. guide.html은 수정하지 않았다.
- 수업 1~10 번호 스테퍼, 완료 체크, 이전/다음/닫기, 단계별 책 링크를 구현했다. 1~9 판정은 유지하고 10단계는 도달 시 완료한다. 평가 모달 의존성을 없애기 위한 변경이다.
- 컨트롤·읽기 카드·DOM 라벨·호스트 버튼은 선 아이콘/재질 견본/힘 색/숫자로 구성한다. 쉬운 모드의 실험 동작은 유지한다.
- text-audit는 자세히 기본 장치 3개와 수업 10개 상태의 U7 DOM 게이트를 검사한다. 브라우저 실행과 PASS 확정은 팀장 검증 대기다.
- U7b-2 잔여: 콘솔 명판·화면 A/B·3D 단위·방 포스터. 화면 A의 기존 힘 이름 및 LANG 분기는 이 범위 때문에 남긴다.

### U7b-2 - 3D scene word removal implemented (2026-10-21)

- Removed all console nameplates and their helper/visibility list. Buttons/sliders retain their existing shapes and colors. Orange gravity and blue tank knobs keep numeric ticks; gravity ticks now show numeric acceleration instead of planet names.
- Posters retain code-drawn geometry, force-color arrows, axes and points; removed titles, formulas and arrow/axis names. Gauge needles and numeric ticks remain; gauge unit argument removed.
- Screen A uses force-color dots, signed bars and signed numeric N readings. Track vertical forces use orange/white dots with numeric N readings and direction symbols. Screen B retains numeric ticks, records, fit line and numeric readings, with colored graph markers; removed language branches, titles and word/unit axis labels.
- Removed the cm overlay mesh and its mode visibility branch. The spring-scale N and all shared numeric scales remain. Existing initialization errors already go only to console.error (no error-text DOM).
- Replaced source hashes/full-mode exceptions with the U5/U7 pattern gate. Explicit exclusions: comments (not rendered); tags/attributes/document title (metadata/geometry); CSS style rules (not text nodes); identifiers/selectors/icon helper arguments (code). No file- or mode-wide exemption.
- Verification: assemble PASS; assembled module syntax PASS; text-audit syntax PASS; hand-check 83/83; static gate PASS, 0 violations. In-memory gate probes reject canvas/stroke/plate/DOM/template/upstream/escaped/wrapper words, and accept numeric N and aria metadata (10 cases). Mock canvas exercised screen A/B across all stations/graph modes: 73 numeric/symbol readings, PASS.
- Browser verification pending with team lead: screen A/B readability, gauge readability, poster rendering and kid/full behavior. No browser or DOM PASS is claimed. Dynamic values still require browser auditing; the pattern gate is not a complete JavaScript dataflow proof.
