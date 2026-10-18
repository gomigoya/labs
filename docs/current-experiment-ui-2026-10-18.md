# 현재 학년·실험·기구 표시

## 변경 범위

- 설명 패널 맨 위에 현재 과정, 실험 번호, 실험 이름, 사용 기구를 묶었다. 제목은 27px, 기구 이름은 18px이다.
- 선택한 학년에는 체크와 밑줄을 함께 표시한다. 고등 과정은 물리학/역학과 에너지 과목명도 표시한다.
- 실험 선택 메뉴는 ‘다른 실험 선택’으로 접는다. 다른 실험을 선택하면 메뉴를 닫고 새 실험의 요약을 보여 준다.
- 데스크톱 장면 가장자리에도 학년·실험·기구를 표시한다. 모바일 장면에는 학년·실험 이름 한 줄만 두고, 기구 이름은 바로 아래 패널에 표시해 수레를 가리지 않는다.
- 기구 이름은 현재 계산 결과의 `rig`와 입력 조건으로 정한다. 같은 실험에서도 수레/스패너, 직접 들기/지레/빗면, 잠수부/풍선/잠수함으로 바뀌면 표시가 갱신된다.
- 기존 준비물·주의사항은 ‘실험 준비와 주의’에 보존했다.

배경, 수레 모델, 재질, 조명, 카메라, 물리 계산, 실험 순서, 드래그 코드 및 저장 형식은 변경하지 않았다.

## 검수

- 브라우저에서 37개 활동을 직접 선택했다. 선택한 제목, 과정, 기구 표시가 갱신되고 메뉴가 닫히는 것을 확인했다. `verification/results/context-v9/desktop-course-audit.json`
- 117개 안내 조건과 개별 자유 조작 조건에서 한국어·영어 기구 이름 712건을 확인했다. `apparatus-coverage.json`
- 수평대의 왼쪽과 오른쪽 추를 실제 포인터로 끌어 각각 300g을 올렸다. 처음 관찰 및 두 번의 드래그가 기록되고 ‘수평’ 결과가 나오는 것을 확인했다.
- 고등 ‘힘의 합과 돌리는 힘’에서 수레 → 스패너로 조건을 바꿨을 때 기구 이름도 바뀌었다.
- 학년 지정이 없는 주소로 다시 열었을 때 저장된 중등 ‘두 힘의 평형’과 기구가 함께 복원됐다. Enter 키로 실험 선택 메뉴를 열 수 있었다.
- 390×844 모바일에서 한국어·영어 제목과 기구 이름 줄바꿈을 확인했다. 가로 넘침이 없고 기구 이름은 18px을 유지한다. 모바일 장면의 글자가 수레 위에 겹치던 것은 한 줄 표시로 수정했다.
- 기존 물리·과정·수업·기구·직접 조작 검증 6개 묶음의 84개 검사가 통과했다. 이번 작업에서 전체 활동의 드래그를 다시 수행한 것은 아니며, UI 전환 전체와 수평대 양쪽 드래그를 검수했다.

## 증거

- `verification/evidence/context-v9/elementary-balance.jpg`
- `verification/evidence/context-v9/middle-equilibrium.jpg`
- `verification/evidence/context-v9/high-wrench.jpg`
- `verification/evidence/context-v9/mobile-balance.jpg`
- `verification/evidence/context-v9/mobile-middle.jpg`
- `verification/evidence/context-v9/english-mobile.jpg`

기존 Sites 프로젝트 ID는 유지했다. Sites 연결의 프로젝트 조회와 쓰기 자격 증명 발급은 모두 `project_not_found`를 반환했다.

이후 Git CLI 연결을 따로 확인했다. GitHub 앱은 `sungkue`, Git Credential Manager는 `gomigoya` 계정이었다. CLI 계정의 기존 `gomigoya/labs` 저장소에 독립 실행 실험실 전체를 `force-equilibrium-lab` 브랜치로 푸시했고, 새 폴더에서 같은 브랜치를 다시 clone하여 UI 커밋 `9c50589` 포함을 확인했다. GitHub의 기존 `main`은 유지했다. 노트북 실행 방법은 루트 README에 있다. 기존 ChatGPT Sites 주소로의 배포는 프로젝트 조회 오류로 아직 수행하지 못했다.
