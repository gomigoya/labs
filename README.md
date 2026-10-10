# Lumebench (가칭) — 인터랙티브 과학 실험실 사이트

이론 하나를 3D 실험실로 만드는 제작 공정과, 그 실험실들을 모아 배포하는 정적 사이트.
기획서: 「인터랙티브 과학 실험실 수익화 기획서」(Claude Docs).

## 구조

```
site.config.json        브랜드·도메인·폼 링크·분석 토큰 (사이트 전체 설정은 여기만 고친다)
labs/<slug>/            실험실 1개 = 폴더 1개
  index.html            실험실 본체 (단일 파일, three.js importmap)
  meta.json             제목·훅·교과·공개 상태 (갤러리 카드와 공유 미리보기에 쓰임)
  thumb.jpg             1200×750 히어로 샷 (선택, 없으면 그라데이션 카드)
  docs/, shots/         제작 기록·검증 캡처 (배포에서 제외)
labs/_demo/             파이프라인 시험용 (기본 빌드에서 제외)
shared/shell.js         모든 실험실에 주입되는 공통 메뉴 (모든 실험실 / 공유 / 저사양 / 기관용 의뢰)
prompts/                실험실 제작 프롬프트 (master + 사이트 추가 규칙)
tools/build.mjs         labs → dist 빌드 (주입·갤러리·sitemap)
tools/serve.mjs         로컬 서버 + POST /__save/<name> 캡처 저장
```

## 명령

```bash
node tools/build.mjs
```

```bash
node tools/serve.mjs --root dist
```

`--all`을 붙이면 숨김 실험실과 `_demo`까지 빌드한다. 서버 기본 주소는 http://localhost:5180 이다.

## 배포 (Cloudflare Pages)

처음 한 번만 사용자가 로그인한다.

```bash
npx wrangler login
```

이후 배포는 아래 명령 하나로 끝난다.

```bash
npm run deploy
```

배포 후 Cloudflare 대시보드에서 Pages 프로젝트 `lumebench`에 구매한 도메인을 연결하고, `site.config.json`의 `domain`을 채운 뒤 한 번 더 배포한다.
그래야 sitemap.xml과 canonical, 공유 미리보기 주소가 생긴다.

## 새 실험실 추가

1. `prompts/master-lab-prompt.md` + `prompts/site-addendum.md`의 `<theory>`에 이론을 넣어 제작한다.
2. 결과를 `labs/<slug>/index.html`에 두고 `meta.json`을 만든다(`labs/hydraulic-ram/meta.json` 참고).
3. 검수 전에는 `"status": "hidden"`으로 두고 `--all` 빌드로 확인한다. 공개할 때 `"live"`로 바꾼다.
4. 물리 검수를 마치면 `"reviewed": true` → 갤러리에 "검수 완료" 배지가 붙는다.

## 품질 단계

빌드가 각 실험실 `<head>` 맨 앞에 `window.__SITE__.quality`를 넣는다.
`?lite=1`이거나 기기 메모리가 4GB 이하이면 `'low'`이고, 실험실은 AO·보케·블룸을 줄인다(규칙: prompts/site-addendum.md).

## 결정 기록

- 2026-10-11: 실험실 게임 프로젝트(D:\marin)와 분리해 D:\labs에 둔다.
- 2026-10-11: 빌드 도구 없이 Node 내장 모듈만 쓴다. 실험실이 단일 HTML이라 번들러가 필요 없다.
- 2026-10-11: 호스팅은 Cloudflare Pages(무료, 상업 이용 가능, 같은 계정에서 도메인·쿠키 없는 분석까지 해결).
- 2026-10-11: 공통 메뉴는 데스크톱 왼쪽 아래, 모바일 오른쪽 위. 실험실 HUD 규칙에서 비어 있는 자리다.
- 2026-10-11: 저사양 자동 판정은 deviceMemory ≤ 4GB만 쓴다. CPU 코어 수 기준은 일반 노트북까지 걸려서 뺐다.
- 2026-10-11: 브랜드 가칭 Lumebench. 후보와 근거는 docs/brand-names.md.
