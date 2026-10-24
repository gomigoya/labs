# 원리에서 표현으로 — 공룡과 줄다리기

실행 키는 아래 표의 문자열 그대로입니다. 기본 장면 키 `hero`, `console`, `track`, `capacities`와 문법 키는 `window.__lab.layer(name,on)`에서 공통으로 받습니다. `room`은 배경이며 교사 쌓기에서 제외합니다. `capacities`는 문법 도입 전 기본 능력 막대를 따로 비교할 때 사용합니다.

| 실제 층 키 | 원리 → 표현 | 이유 |
|---|---|---|
| `마디` | PHYS의 당김 한계를 같은 기준의 마디 화살표로 변환 | 숫자 없이 길이·분할 수를 비교합니다. 압축 구간은 끊김·⤢로 구별합니다. |
| `쌓아 채우기·계단` | 독립 아이 한계의 합 → 같은 조각을 잇는 계단 | 인원 증가가 한계 증가로 이어지는 근거를 보입니다. |
| `문턱·한계 윤곽` | 근육과 마찰 중 작은 값 → 두 점선 중 안쪽까지 차는 실선 | 두 한계를 더하거나 큰 쪽을 선택하는 오해를 막습니다. |
| `비교·겹치기` | `GRAMMAR.pin()`의 조건·계산값 → 흰 점선 A 고정, 현재 B 실선 | 카메라를 돌려도 같은 세계 좌표에서 비교합니다. |
| `숨은 구조·돋보기` | 대표 μ → 발·표면·접촉점 단면 | 자료를 갖춘 뒤에만 패널을 보이고 사건 중에는 닫아 해설 하나를 유지합니다. 거칠기는 추정 도해입니다. |
| `같은 시간 간격 흔적` | 깃발의 상징 이동 → 회색 점 | 방향을 읽는 연출이며 속도·가속도 측정값이 아닙니다. |
| `비교` | `Fm/(mg)` → 같은 체중 기준의 내부 막대 | 절대 힘과 체중 대비 힘을 분리합니다. 이 비율에는 힘 로그 압축을 적용하지 않습니다. |
| `기록` | 완료된 실행의 `{n,species,mu}` → 조건 견본과 두 한계 막대 | 관찰 없는 상태는 빈칸이며 가짜 0 N을 넣지 않습니다. |

아이 주황 `#f4a04d`, 공룡 초록 `#7ac59d`, 근육 보라 `#b296e0`, 마찰 분홍 `#f29db5`, 기준 흰색 `#e1e9e6`입니다. 현재는 실선·채움, 가설·이전 상태는 점선입니다. 근육은 짧고 촘촘한 점선, 마찰은 더 긴 점선으로 색 이외의 단서도 줍니다. 마찰 제한 패배 때만 발 아래 입자를 표시합니다. 흐름 스트릭은 능력 비교의 강조이며 힘이나 물질이 밧줄을 타고 흐른다는 뜻이 아닙니다.

예상 카드는 같은 300×140 좌표 안에 팀, 종 실루엣, 줄, 크게 이동한 깃발을 배치합니다. 첫 프레임부터 승리 방향·팀 개수·증가/고정/감소의 차이가 드러나게 합니다. Q6은 동일 외곽선 안의 큰 비율 채움, Q7은 작은 두 발·머리 볏·등판의 실루엣 차이를 씁니다. 퀘스트 아이콘은 `q1`~`q7`, 층 도구는 `layer0`~`layer11`로 분리했습니다.

교사 시연 순서는 [이론 카드 m절](theory-card.md)과 [안내서](../guide.html)를 따릅니다. Q4는 동일 팀·종의 바닥 교체, Q5는 같은 유리 위 팀 증가를 A/B로 고정합니다. 사건에는 발 단면 또는 원리 도해 하나만 쓰고 빈 패널과 학생 예상 패널은 그리지 않습니다.

쓰지 않은 표현: 실제 가속도 궤적(동역학을 풀지 않음), 실제 키 축척(생체 치수 자료 없음), 마찰과 근육의 합(작은 한계가 지배), 모든 패배의 먼지(근육 제한과 혼동), 임의 무지개·정답 글자·이모지·외부 삽화(정체성과 관찰 근거를 흐림). 5초 구별 여부와 실제 점유율은 브라우저에서 검수해야 합니다.


## R9: 밀림 지면과 독립 돌 토템

`ROOM.position.y = PHYS.SCENE.top`(1.10)으로 숲 전체 지면을 올립니다. 공룡·아이·줄·깃발·레일 및 모든 카메라 좌표는 유지합니다. `HABITAT.clearing`의 다져진 진흙은 중앙 +0.123에서 바깥 지면까지 완만하게 이어집니다. 둥근 공터의 안쪽 반경은 4.9×1.3, 바깥은 5.8×2.1입니다. 표면 견본은 +0.126의 면과 입자만 남기고, +0.127의 ShadowMaterial 면이 접지 그림자를 받습니다. 이끼·풀·발자국은 트랙 가장자리와 숲을 연결합니다. 지형은 추정 표현이며 물리 μ를 바꾸지 않습니다.

`CONSOLE`은 아래로 좁아지는 이끼 낀 돌 토템입니다. 위치·크기는 `30-room-console.js`의 `CONTROL_LAYOUT` 한 표에 모았습니다. 단위는 추정 전시 좌표입니다.

| 항목 | 위치·크기 |
|---|---|
| 가로 토템 원점 | (-0.6, top+0.34, 2.15), 앞면 경사 -0.65 rad |
| 세로 토템 원점 | (4.8, top+0.34, 1.4), 경사 동일, Y 회전 1.15 rad |
| 돌기둥 | 폭 2.10 / 높이 1.16 / 깊이 0.48, 하단 폭 78%, 밑부분 매립 |
| 다이얼 | 로컬 (-0.78, 0.50, 0.04) |
| 그래프 2개 | 로컬 (0.24, 0.63 / 0.27, 0.04), 각각 1.36×0.27 |
| 슬라이더 | 로컬 (0.24, -0.06, 0.04), 폭 1.28 |
| 재생 / 스위치 | 로컬 (-0.78, 0.05, 0.09) / (-0.78, -0.24, 0.08) |
| 종 견본 / 확장 표식 / 능력 막대 | 같은 표의 specimens / expansion / bars, 막대 축척 0.72 |

세로 화면은 토템만 카메라 가까운 트랙 끝의 앞쪽으로 옮겨 돌립니다. `ENVIRONMENT.update()`가 자세를 적용하고 `updateHero()`가 별도 capacities 층의 막대도 같은 자세로 옮깁니다. room·console·hero·capacities·track 층 키를 유지합니다.

레이캐스트 대상은 옮긴 메시 자체입니다. `60-interaction-hud.js`는 선택한 메시의 세계 위치와 토템 회전으로 드래그 평면을 만들고 `CONSOLE.worldToLocal()`로 포인터를 환산합니다. 다이얼 중심과 그래프 폭은 생성과 드래그가 모두 `CONTROL_LAYOUT`을 참조합니다. 슬라이더는 그 표로 생성된 `SLIDER.width`를 사용합니다. 트랙 레일 손잡이는 기존 좌표이므로 `68-director.js`의 레일 목표도 그대로입니다. 재생·비율 그래프의 빛과 유령 손은 이미 `focus.getWorldPosition()`을 사용하므로 이동을 따라갑니다.

삭제 목록: 폭 6.35 몸체·6.4 상판·6.1 앞판, 고무발 네 개, 황동 띠, 나사 네 개와 전용 screw 도우미, 미사용 navy 재질, 트랙 받침 판, 통나무 받침 일곱 개, 종 견본 받침 판 두 개, 표면 견본의 두꺼운 판·교체 손잡이·금속 끝 테두리. 호환 몸체는 남기지 않았습니다.

밝은 연두 노랑 하늘·안개·진흙, 노출 1.02와 더 밝은 반구·키·채움·림 조명을 사용합니다. 햇살은 HABITAT에서 폭 2.4, 기본 불투명도 0.30으로 조정한 가산 혼합 발광 면 네 개입니다(저사양 세 개). 발광 재질이 기존 선택적 bloom 경로를 통과합니다. 큰 전경 양치류·바위·덩굴은 양옆 InstancedMesh 군집이며 저사양에서 6→4로 줄어듭니다. 지형·장식 설정은 HABITAT, 색은 BIOME에서 관리합니다. 외부 모델·이미지·화면 단어는 추가하지 않았습니다.

검증: assemble, 모든 소스와 합친 모듈 syntax, hand-check 267/267, quest-check 7개 실제 PHYS 자동 실행, teacher-check 통과. 토템 계기 외곽도 기존 해석적 안전 영역 14종×공룡 6종=84개 조합에서 통과했습니다(교사 손잡이 확대 포함). 처음 수치 검사에서 드러난 세로 화면 왼쪽 잘림을 토템 위치 조정으로 해결했습니다. 이는 CSS 가정에 따른 수치 투영이며 장치와의 픽셀 가림 검사가 아닙니다.

브라우저/CDN은 실행하지 않았습니다. 실제 평균 명도·대비·모바일 가림·터치·heroCoverage/textAudit 런타임 결과·썸네일은 팀장 캡처에서 확인해야 합니다. 카메라/PHYS 유지와 해석 검사 통과는 렌더링 검증을 대신하지 않습니다.

## R10: ??? ??? ???

??? ??? ??? `src/20-scene-kit.js`? `KIT.toon`, `KIT.inked`, `KIT.merge`, `KIT.smoothNormals`?. ??? ??? ??? ????. ?? ??? ?? ?? ???? ??? ???? ???? ??? ????. ?? ??, ?? ??, ??? ???, ?? ??? ??? ??.

`KIT.toon`? ?? 82/166/255? 3? RGBA DataTexture? ???? NearestFilter? ??. `KIT.inked`? ?? ?? ???? ??? BackSide ?? ???? ???? ???? ???. ???? ??? ?? instanceMatrix ??? ????. ?? ??? ??? ?? ?? ?? ?? ?? ??, ?????? ?? ?? ??, ???? ??? ???. ?? ???? ?? ??? ??? ????. ??? ?? ?? 0.0045, ?? 0.009/?? ???(?? 0.6) ?? ???. ?? 2~3px ??? **??**?? ???? ????.

??? ?????? ?? ???? ?? ? SphereGeometry?. ?????????? ?? ??? ?? CatmullRomCurve3? ?? ??? TubeGeometry?. UV ???? ??? ??? ??? ???? ????. ???????? ?? ???? ???? ?? ?? ???? ???? ?? ???. ?? ?? ?? ???. ?? ??? ??? ????. ?? ??? ?? THEME.bone? ?? ????. ??????? ??? DINO_SHAPES ? ?? ??. ???? ??? ??? ??? **??**??.

| ? | ?? ?????? | ?? ?? ??? | ?????? |
|---|---|---|---|
| ?????? | ?? ? ??, ?? ?, ? ??? | #6bbcaf | ? ?? ?? 9?, ??? ?? |
| ??????? | ? ?? ?? ?, ? ? | #91c878 | ??? ?? ? |
| ??????? | ?? 7?? 2?, ?? ?? 4? | #83bfa4 | THEME.warm ?? |
| ?????? | ? 3?, ?? ?? | #69bba8 | THEME.bone ?? ???? ? |
| ??????? | ? ??, ?? ? | #7ac59d | ?? ? ??? |
| ????????? | ?? ??, ? ?? ? | #90c9ad | ?? ? ?? |

??? ?? ?????? ?? ??? ? ?, ? ???? ???????? ???. ?? ?? 3??? ?? ??, ?? ??? ?? ?? 3?, ?? ?? ??? ?? ???? ???. `g.pose(lean)`? ?? ????? ????. ? ?? ? ?? `animateDino(t, load)`? ?? ?? ?1.5%, ?? ???, ?? ???? ??? ?? ?? ????? ??? ????. ??? `DIRECTOR.time()`? ?? ??? `S.t.value`, ??? ??? `clamp(-d.lean/.24,0,1)`?? ????. ?? ?? ??? ??.

??? ?? ??? KID_STYLE ? ?? mulberry32(731104)? ??. ???????????????????????????? ??? 9? ???? ??? ?? ?? ??? 1?? ????. ?? 12? ???? 10?? ???. ?? ??? ?? ??? ??? ????. ? ???? ?? instanceColor?, ???? ?? PHYS.dramaChild().band? ???. ?? ??? ???? ???, ??? ?? ?? ???? ???? ? ? ??? ?? ?????? ???? ?? ????. ? ??? ???? ?? kidSkid ??? ????. dinoSkid? ??? ??? ??? ??.

| ?? ?? | ?????? |
|---|---|
| ?? ? | PHYS.DRAMA.kidHeight ? (1 ?8%), ?? ?? |
| ?? 6? | #f4a04d, #ffb36b, #7dd3fc, #b296e0, #f29db5, #e2d7ba |
| ????? | #303e50, #303943, #644936 |
| ???? | #262a2c, #644936, #b79859 |
| ???? | #e2d7ba, #d6a577, #a96f4e |
| ?? | #262a2c, #303e50 |
| 10? ?? ? | ?? brass/navy ?? ?? |
| ?? | ?? 0~2?, ?? ??? ?0.6% |

???? ?? 18?12 ? 8?5, ?? 16?10 ? 6?5? ????. ????? ???, ?????? ?? ????? ???. ?? ???? ?????????? ????. ?? ????? ??? LOD ??? ???.

??? ???? ??? ?? ??? ?? ?? ???? ??? ??? ???. ?? ?? ?? ??, ???? ?? ??? ??, ??? ?? 1?? ????. ????? ???, ??, ?? ??? ??, bloom???? ??? ????. renderer.info? ?? ??? ???? ???.

| ?? | ??? ??? | ??? ?? | ??? ??? | ??? ?? |
|---|---:|---:|---:|---:|
| ?????? | 14,440 | 4 | 1,224 | 2 |
| ??????? | 15,168 | 4 | 1,280 | 2 |
| ??????? | 26,304 | 4 | 2,232 | 2 |
| ?????? | 16,776 | 4 | 1,456 | 2 |
| ??????? | 13,584 | 4 | 1,152 | 2 |
| ????????? | 15,120 | 4 | 1,304 | 2 |
| ?? 1? | 150 | 10 | 78 | 8 |
| ?? 100? | 15,000 | 10 | 7,800 | 8 |

?? 1? ??: ?? 8, ???? 4, ?? 8, ?? 8, ? 24, ?? 12, ?? 8, ? 6, ??? 4, ??? 68. ????? ???? ??? ??? ???? 4??? ???. ???? ??? ????? ?? ?? ???? ????, ???? ?? ??? ????.

??: assemble, ?? ? ?? ?? node --check, hand-check 267/267, quest-check, teacher-check. ????/CDN? ?? ??? ??? ???? ???. ?? ???? ?? ?? ??, toon ??, ???? ???, ??? ?, ??, 100? ??? ??? ???/??? ??? ???? ??.

<details><summary>?? ?? ?? ?? ???</summary>

?? ??? ???? ???? ?? `.mjs`? ????. ?? ?????? ?? ???? ???? ??? ?? ????, ??? ?? ?? ???? ??? ????. ?? ??? ???? ???.

```js
import fs from 'node:fs';
const src=fs.readFileSync('src/40-hero.js','utf8');
const PHYS=new Function(fs.readFileSync('src/15-physics.js','utf8')+';return PHYS')();
const THEME=new Function(fs.readFileSync('src/10-imports.js','utf8').split('const THEME =')[1].replace(/^/,'return ') )();
class Vector {
 constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}
 clone(){return new Vector(this.x,this.y,this.z);}add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}
 sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
 length(){return Math.hypot(this.x,this.y,this.z);}normalize(){return this.multiplyScalar(1/(this.length()||1));}toArray(){return [this.x,this.y,this.z];}
 set(){return this;}
}
// Constructor index counts, including SphereGeometry's minimum heightSegments=2.
// No WebGL or substitute visual geometry is involved in this source-level audit.
class Geometry {
 constructor(triangles){this.triangles=triangles;}translate(){return this;}rotateX(){return this;}scale(){return this;}applyQuaternion(){return this;}setIndex(i){this.triangles=i.length/3;return this;}
}
const THREE={
 SphereGeometry:class extends Geometry{constructor(r,w=32,h=16,p=0,pl=Math.PI*2,t=0,tl=Math.PI){w=Math.max(3,Math.floor(w));h=Math.max(2,Math.floor(h));super(2*w*h-(t===0?w:0)-(t+tl>=Math.PI?w:0));}},
 CylinderGeometry:class extends Geometry{constructor(a,b,h,n=32,s=1,open=false){super((a===0||b===0?n:2*n)*s+(open?0:(a>0?n:0)+(b>0?n:0)));}},
 TetrahedronGeometry:class extends Geometry{constructor(){super(4);}},
 CircleGeometry:class extends Geometry{constructor(r,n=32){super(n);}},
 MeshBasicMaterial:class{},Quaternion:class{setFromUnitVectors(){return this;}},
 Group:class{constructor(){this.position=this.scale=new Vector();}add(){}},
 Color:class{clone(){return this;}lerp(){return this;}multiplyScalar(){return this;}}
};
const V3=(...a)=>new Vector(...a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const species=Object.keys(PHYS.SPECIES),grounds=Object.values(PHYS.GROUNDS);
const table=src.slice(src.indexOf('const DINO_SHAPES='),src.indexOf('const DINO_MODELS='));
let model=src.slice(src.indexOf('const DINO_MODELS='),src.indexOf('  const mesh=KIT.mesh(KIT.merge(parts)'));
const start=model.indexOf('  function add('),end=model.indexOf('  ell(0,bodyY');
model=model.slice(0,start)+`
 function ell(x,y,z,a,b,c,color,region){
  const pad=region==='fixed',pelvis=region==='pelvis';
  const w=pad?(low?6:10):pelvis?(low?6:12):(low?8:18),h=pad?(low?3:6):pelvis?(low?3:8):(low?5:12);
  parts.push(new Geometry(2*w*(h-1)));
 }
 function tube(points,radii,region,color,detail=false){(detail?details:parts).push(new Geometry(2*steps*radial));}
 function cone(a,b,r,color,region,detail=false){(detail?details:parts).push(new Geometry(2*(low?4:6)));}
`+model.slice(end);
model+=`const main=parts.reduce((s,g)=>s+g.triangles,0),detail=details.reduce((s,g)=>s+g.triangles,0),contact=shadows.reduce((s,g)=>s+g.triangles,0);
 return {quality:low?'low':'high',main,detail,ink:low?0:main,contact,triangles:main+detail+(low?0:main)+contact,draws:Number(parts.length>0)+Number(details.length>0)+Number(!low)+Number(shadows.length>0)};
 });return {species:shape.name,lods:variants};});return DINO_MODELS;`;
const dino=new Function('THREE','PHYS','THEME','V3','clamp','SPECIES_KEYS','GROUND_VALUES','HERO','Geometry',table+model)(THREE,PHYS,THEME,V3,clamp,species,grounds,{add(){}},Geometry);
let kid=src.slice(src.indexOf('const kidShadowMat='),src.indexOf('const kidParts=[]'));
kid+='return Object.fromEntries(Object.entries(kidGeo).map(([k,v])=>[k,v.reduce((s,g)=>s+g.triangles,0)]));';
const kidParts=new Function('THREE','PHYS','V3',kid)(THREE,PHYS,V3);
const batchCount=Object.keys(kidParts).length;
const ink=['head','shirt','pants','arms','legs','shoes'].reduce((s,k)=>s+kidParts[k],0),base=Object.values(kidParts).reduce((s,n)=>s+n,0);
console.log(JSON.stringify({dino,kid:{parts:kidParts,ink,high:base+ink,low:base-kidParts.hair,drawsHigh:batchCount+1,drawsLow:batchCount-1},hundred:{high:(base+ink)*100,low:(base-kidParts.hair)*100,drawsHigh:batchCount+1,drawsLow:batchCount-1}},null,2));

if(base+ink>150||batchCount+1>12+8)throw new Error('kid budget');
if(dino.some(d=>d.lods[0].ink!==d.lods[0].main||d.lods[1].ink||d.lods[1].detail))throw new Error('LOD/ink budget');
const r10=[[14440,1224],[15168,1280],[26304,2232],[16776,1456],[13584,1152],[15120,1304]];
if(dino.some((d,i)=>d.lods.some((lod,j)=>lod.triangles>r10[i][j]*1.15)))throw new Error('R11 triangle budget');
```
</details>

## R11: 캐릭터 색과 다리·몸통 비례

캐릭터 형태는 전시용 **추정**이다. `PHYS.SCENE.forms`, `PHYS.DRAMA`, `leg`, 배율과 카메라는 유지한다. 외부 모델·이미지, 화면 단어, 비결정적 난수는 추가하지 않는다. `g.pose(lean)`과 스타일 헬퍼 시그니처, 3단 툰 램프 및 외곽선 두께도 유지한다.

색은 변형 전 파츠 로컬 좌표에서 계산한다. 구형 파츠는 자기 중심의 y와 높이로 정규화하고, 목·꼬리 튜브는 각 단면 중심 기준 위아래로 정규화한다. 몸통 윗면은 짙은 등색, 아랫면은 밝은 배색이다. 세계 높이 또는 포즈 후 높이로 색을 다시 계산하지 않는다. 골반·허벅지·정강이·팔은 종별 본색의 선형 RGB ×0.86, 발바닥·발가락은 ×0.70이다. 팔다리에는 배색 그라디언트를 적용하지 않는다. 발톱은 기존 뼈색이며, 기존 이빨·뿔 등 뼈색 장식도 유지한다.

두 발 공룡의 제어점은 다음과 같다. 앞 방향은 −X, `L=leg`, `A=foot[1]×0.90`, `X=0.15+side×stance`이다.

| 제어점·구간 | R10 → R11 |
|---|---|
| 고관절 | `(X, bodyY−0.08, z)` → `(X, A+0.78L, z)` |
| 무릎 | `(hip.x−0.13, 0.53L, z)` → 고관절·비절 사이 두 뼈 역기구학의 앞쪽 해 |
| 비절 | 별도 없음 → `(X+0.12L, A+0.16L, z)` |
| 발목 | `(X+0.06, foot[1], z)` → `(X+0.12L, A, z)` |
| 구간 길이 | 단일 곡선 → 허벅지 `0.46L` + 정강이 `0.38L` + 발목 구간 `0.16L` = `L` |
| 허벅지 시작 지름 | 종별 고정 반지름 → 몸통 높이(`height×body[1]`)의 50% |
| 반지름 제어값 | `[thigh, 0.72thigh, shin]` → `[새 thigh, 0.42×새 thigh, shin, 0.78shin]` |
| 골반 연결 | 없음 → 몸통 안쪽과 허벅지 시작점을 겹치는 좌우 골반 덩어리 |
| 발 | 타원 발 한 덩어리 → 발바닥과 앞쪽으로 갈라지는 발가락 세 개 |

포즈에서는 고관절이 몸통의 기울기·호흡 변형을 따르고, 무릎을 두 뼈 길이로 다시 푼다. 비절·발목·발바닥·발톱은 고정한다. 다리 정점과 법선은 해당 뼈의 회전으로 이동하며 외곽선도 동일한 경로를 따른다. 발 고정 영역에는 기존 팔 압박 보정이 침범하지 않도록 제한한다. 네발 공룡은 기둥형을 유지하며 다리 반지름을 `[1.22thigh, thigh, 0.82shin]`으로 가늘게 만든다. 발바닥은 넓고 낮게 조정한다.

몸통 표의 `body`는 길이·높이·폭 배수이고, `chest`와 `pelvis`는 앞가슴·골반 부분의 부피 보정값이다. 이전 공통 보정은 각각 `0.13`, `−0.10`이었다. 두 발 공룡은 이 값으로 폭과 아랫가슴 깊이를 함께 늘린다.

| 종 | body 전 → 후 | chest 전 → 후 | pelvis 전 → 후 |
|---|---|---|---|
| 벨로키랍토르 | `[1,.82,.72]` → `[1,1.02,.82]` | `.13` → `.23` | `−.10` → `.12` |
| 딜로포사우루스 | `[1,.88,.82]` → `[1,1.08,.94]` | `.13` → `.24` | `−.10` → `.14` |
| 티라노사우루스 | `[1,.64,1]` → `[1,1.02,1.14]` | `.13` → `.28` | `−.10` → `.18` |

아래는 위 재현 코드로 집계한 종별 삼각형 수이다. 본체·세부·외곽선·접지 그림자를 포함한 한 개체의 단일 표시 패스 기준이며, 조명 그림자·후처리의 반복 패스 및 비교용 복제 개체는 제외한다. 실제 `renderer.info` 측정값은 아니다. 발과 골반은 작은 전용 구 분할을 사용해 예산을 확보한다. 고품질 draw는 4개, 저품질은 2개로 유지한다.

| 종 | 고품질 R10 → R11 | 변화 | 저품질 R10 → R11 | 변화 |
|---|---:|---:|---:|---:|
| 벨로키랍토르 | 14,440 → 15,128 | +4.76% | 1,224 → 1,336 | +9.15% |
| 딜로포사우루스 | 15,168 → 15,856 | +4.54% | 1,280 → 1,392 | +8.75% |
| 스테고사우루스 | 26,304 → 23,936 | −9.00% | 2,232 → 2,072 | −7.17% |
| 트리케라톱스 | 16,776 → 14,408 | −14.12% | 1,456 → 1,296 | −10.99% |
| 티라노사우루스 | 13,584 → 14,272 | +5.06% | 1,152 → 1,264 | +9.72% |
| 아르젠티노사우루스 | 15,120 → 12,752 | −15.66% | 1,304 → 1,144 | −12.27% |

검증: assemble, 소스·조립 모듈의 `node --check`, hand-check 267/267, quest-check, teacher-check 통과. 실제 `animateDino`에 관절·발바닥 표본을 넣어 시간 21개 × 하중 21개 × 두 발 공룡 3종 = 1,323개 포즈에서 유한 좌표·법선, 뼈 길이 합과 구간 길이, 비절·발목·발바닥 접지 고정을 수치 검증했다. 이 검증은 WebGL을 사용하지 않는다. 브라우저 렌더링·실루엣·관절 표면 연결·색 대비·외곽선 픽셀·가림·실제 GPU 삼각형 수는 확인하지 못했으며 팀장 캡처 검토가 필요하다.


## R12 — Colorfigures ink rendering

The jungle, apparatus positions, camera shots, animation, physics and grammar semantics are retained. The portable renderer and its entire style table are in `src/47-ink-style.js`. `inkConfig()` is a hoisted accessor: construction in 20/30/40 can consume the table before the 47 fragment executes. Copy 47 with its KIT/composer integration when applying this pilot elsewhere.

`INK.convertMaterials(root)` caches conversions by material identity. Standard/Physical/Phong become Toon with the same maps, vertex/instance colors, alpha/depth settings and emissive inputs. Existing Toon materials are adopted in place. Brass/chrome use neutral metal gray. All share one nearest-filtered 3-texel ramp; view-space normal/light orientation selects a warm light, neutral middle or cool dark multiplier. Shadows use a binary threshold of the native shadow mask and a blue multiplicative tint. Basic, Shader, Line and Sprite materials keep their rendering programs. Diagram colors are changed without changing layer structure. New scene materials go through the same conversion before RenderPass. Detached cassettes are converted during setup.

Pipeline: `RenderPass ? INK outline/paper pass ? OutputPass`. The INK pass internally renders opaque normal/depth attachments, extracts edges, then composites paper and ink. Transparent, additive, Shader, Shadow, non-depth-writing, line and sprite objects are excluded from the auxiliary render; their color rendering remains intact. Opaque instancing and CPU-deformed geometry use the same current geometry/matrices as the beauty render. The auxiliary render restores visibility, clear color, override material, fog, background, target and shadow update flags in finally. Render-target uniforms are rebound after ShaderPass cloning so they reference the live attachments.

The shell geometry and its deformation work, AO/bokeh/bloom composers, masks, emissive callbacks, area/fill/rim lights and soft sunbeam textures are removed. A presentation PointLight created later in the restricted director file is detached by the common conversion path; its controller handle remains valid. The old unused imports live in `src/10-imports.js`, which this task explicitly forbids editing; those imports are the one remaining cleanup item. No old pass is instantiated or rendered. `perf()` retains ao/bokeh keys as false for capture compatibility.

### Shader input/output contract

Both full-screen programs declare `precision highp float`, use the matching vertex/fragment `varying vec2 vUv`, and have no time input. Geometry normals use the built-in MeshNormalMaterial. The Toon shader injection adds uniforms after common and shadowmask functions after shadowmap declarations. Gradient sampling has nearest filtering; edge decisions use step, without smooth edge thresholds.

| Program | Inputs | Output |
|---|---|---|
| Edge | `tDepth` perspective depth, `tNormal` encoded view normals; `resolution`, `nearFar`, `widths`, `thresholds`, `wobble`, `seed`, `vUv` | RGBA: R silhouette mask, G inner-edge mask, B 0, A 1 |
| Paper composite | `tDiffuse` linear scene color, `tEdges` RG masks; linear `ink`, `paper`, `resolution`, `grain`, `stain`, `seed`, `innerOpacity`, `vUv` | Opaque linear RGB with ink, upward brightness and fixed paper noise; OutputPass encodes display color |

Relative depth discontinuity is `abs(d1-d2)/min(d1,d2) >= .018`. Normal discontinuity is `1-dot(n1,n2) >= .28` (approximately 44 degrees; estimate for normalized inputs). Eight radial taps use half of each configured stroke width, giving a two-sided silhouette approximately 2.6 CSS px and inner stroke approximately 1.1 CSS px. Width scales with pixel ratio. Low quality retains both strokes and paper grain, disables only wobble, and reduces the shadow map. `?wobble=0..1` clamps finite inputs; default .5, invalid input .5, seed fixed. `?wobble=0` removes the static drift. Capture names and tools/capture.mjs are unchanged; thumbnail sizing propagates through composer.setSize to all attachments.

### INK_CFG reference

| Key | Meaning | dino-tug value |
|---|---|---|
| ink | Silhouette color | #221d18 |
| paper | Background, fog, composite paper | #e9e8d3 |
| shadow / shadowOpacity | Cast and contact shadows | #3f55a8 / .50 |
| silhouettePx / innerPx / innerOpacity | CSS stroke widths / inner strength | 2.6 / 1.1 / .72 |
| depthThreshold / normalThreshold | Relative depth / normal-dot cutoffs | .018 / .28 |
| wobblePx | Maximum coordinate drift at wobble=1 | .8 px per axis |
| ramp | Nearest three-texel values | [0,128,255] |
| dark / mid / light | Linear diffuse RGB multipliers | [.43,.49,.69] / [.83,.84,.81] / [1.10,1.06,.97] |
| grain / stain / seed | Fixed brightness grain / broad stain / seed | .025 / .006 / 73.0219 |
| fog | Linear fog near / far | [19,54] |
| metal | Neutral metal diffuse base | #b9c0c5 |
| ambient / ambientIntensity | Cool ambient light | #a6b8dc / .65 |
| key / keyIntensity / keyPosition | Hard shadow key | #fff0d0 / 110 / [-4,7,5] |
| shadowMap | High / low map sizes | [2048,1024] |
| shadowBias / shadowNormalBias | Acne suppression | -.0003 / .018 |
| biome | Jungle palette | mud #a49b78, moss #87916c, bark #686750, stone #959887, foliage/near #718260, rear #9ba78b, middle #859573, cavity #626954, litter #929574, volcano #929b85, crater #67715b, trail [#b1a783,#99916f,#c1b795], sun #ffe7a0 |
| diagram | Color roles used in 20/30/40/45 | screen #f4efe3, grid #b2b3a2, reference #393e42, kids #c57d24, dino #37795d, muscle #7863a6, friction #b55d77 |

HUD surfaces use cream #f4efe3, 1.5px ink borders, no blurred shadow, yellow #e8b23a active fills and gray locks. CARDS takes semantic role colors from INK_CFG.diagram, with standalone harness defaults. All control placement, accessibility labels and minimum target dimensions remain unchanged.

Verification: assemble; every JS fragment and assembled ES module syntax; hand-check 267/267; quest-check; teacher-check. No browser/CDN render, GPU shader compile, screenshot, pixel contrast, shadow-acne or mobile-overlap claim is made. Edge thickness and color appearance remain estimates until the lead's capture review. No commit or push.


## R13 — distance ink and portable engine

The current contract is the required/optional table at the top of `src/47-ink-style.js`. Configuration and the hoisted inkConfig accessor now live in `src/46-ink-config.js`. Load all fragments in filename order with tools/assemble.mjs. The engine requires only THREE, ShaderPass and INK_CFG; the laboratory installs KIT.toon, converts MAT/scene/cassettes and supplies wobble/quality in 50. Frame-time scene conversion and diagram styling stay in 70. Copy 47 unchanged for another laboratory and supply its own 46 and host scene integration.

| Decision | Current value/behavior |
|---|---|
| Width | CSS px = clamp(2.6 * 6 / camera-to-surface world distance, 1.0, 2.6); inner width = 1.1 * (px / 2.6). Inverse projection reconstructs ray length from linear view depth; DPR scales both widths. |
| Far fade | Both edge channels multiply 1 - smoothstep(32,54,linearDepth). The camera far plane is 80, so the far * .6 region (48+) is already fading. Relative depth threshold stays .018. |
| Sky | Center or neighbor at >= .999 * camera.far never makes a depth/normal edge. Ground extent is 120 (formerly 45), fog is paper-colored [19,54], fully opaque well before the ground rim. |
| Crowd | One construction-site inkInner=false flag on every kid part. Normal-target alpha masks only normal edges; depth/silhouette and occlusion remain. This conservative choice is based on the reported blobs; color visibility is unverified. |
| Paint | R14 supersedes face-centroid paint: interpolated rest-space scalar, fragment thresholds and derivative AA. See the character paint section below. |
| Panels | diagram.screen #f4efe3, diagram.ink #221d18, diagram.borderPx 1.5. CSS tokens are set once in 60; CARDS uses diagram semantic colors. Floating cream planes use unlit paint, no fog, and an antialiased derivative-based 1.5 CSS px border in host 50. Contact marks use darker paint. |

API: INK.toon(color,opts), INK.convert(material), INK.convertMaterials(root), INK.makeOutlinePass(scene,camera,{wobble,lowQuality}), INK.ramp. The pass owns/disposes normal, depth, edge and paper resources, restores scene/material/renderer state in finally, and updates projection/DPR on render. No laboratory scene globals or palette roles are referenced by 47.

R13 checks: assemble; node --check for every JS fragment and the assembled ES module; hand-check 267/267; quest-check; teacher-check. Forbidden-name search in 47: zero matches. Browser/GPU compilation, silhouettes, horizon, actual panel appearance, crowd shirt/hair visibility and preserved pattern legibility require the lead's screenshots. No screenshots or thumbnail were regenerated; no commit/push.

## R14: Character paint with curved three-band boundaries

`DINO_SHAPES.paint` is the single source for back / side / belly colors (sRGB hex inputs converted by THREE.Color). Limbs keep linear side RGB ?0.86; feet keep ?0.70. Crowd colors, eyes, teeth, claws, crests, plates, frills and feather ridges retain their separate paint and geometry.

| Species | Back | Side | Belly |
|---|---|---|---|
| velociraptor | #365f59 | #62ad9f | #d4d5b8 |
| dilophosaurus | #4a663e | #85b86e | #d8d7b4 |
| stegosaurus | #436254 | #78af96 | #d6d6b8 |
| triceratops | #366056 | #60ab9a | #d4d5b9 |
| tyrannosaurus | #3e6550 | #70b590 | #d6d7b7 |
| argentinosaurus | #4a6759 | #84b89f | #d8d8b9 |

The rest-space scalar is `clamp(0.5 + 0.75*h + 0.125*normal.y, 0, 1)`. For ellipsoids, `h=(vertex.y-center.y)/(2*verticalRadius)` after shaping; for neck/tail tubes, `h=0.5*unitCrossSectionOffset.y` before radius scaling. Normals are the smoothed local rest normals. The scalar is nondecreasing in height at fixed normal and in normal.y at fixed height; its unclamped partial derivatives are 0.75 and 0.125. Monotonicity is a property of these inputs, not a claim that an arbitrary path around a bent dinosaur increases in height. Paint follows pose because its attribute is retained while positions/normals animate.

Each vertex has `dinoPaint = [scalar, enabled, patternU, patternV]`. Shared positions at UV seams/poles keep continuous inputs; no face centroid or per-face color selection remains. Host-only `mergeDinoPaint` preserves this attribute in the same nonindexed draw topology as KIT.merge. Separate ornaments/limbs use enabled=0 and retain vertex colors; eyes and teeth use the same masked path.

The host composes its MeshToonMaterial.onBeforeCompile after the portable INK hook, including assignments made by later INK conversion, and appends a distinct program cache suffix. Belly?side and side?back boundaries are 1/3 and 2/3. Each smoothstep spans `threshold ? 0.5*max(fwidth(scalar), 0.00001)` (approximately one framebuffer pixel, estimate). Quantization happens after interpolation in the fragment shader, before the common INK light/shadow multipliers. High and low LOD use the same shader. This adds four floats per vertex and fragment ALU/varying work, with no triangles, textures, draw calls or rendering passes added; actual GPU cost is unmeasured.

Tyrannosaurus stripes are surface paint: four broad intervals on the torso and four on the tail, capped at eight along the two regions. Tail phase uses normalized tail length, avoiding tiny repeated teeth near the tip. Argentinosaurus spots also use interpolated rest coordinates and derivative AA. Patterns are gated to the upper half of the painted surface; the broad 3-band boundaries themselves remain independent of the patterns. Other species retain their separate crest/plate/frill/feather ornament geometry.

Verification is code-only: assemble, JS/assembled-module syntax, hand-check 267 and quest-check pass, as do scalar range/input-monotonicity and hook/merge checks. Teacher-check passed initially, but its final rerun fails the cross-laboratory byte-for-byte comparison: moon-closer/src/80-teacher.js changed its laser shadow from red/12 blur to #b65450/0 blur and uses CRLF. Neither teacher source is in the R14 editable scope; both are retained. Browser rendering, GPU GLSL compilation, visible curvature, pattern count/legibility in projection and low-device performance await the lead's captures. GLSL declarations, varying types, uniform types, derivative use and include ordering were reviewed by hand. 47 and its common API/edge/paper shaders are unchanged. No external assets, random calls, visible words, commit or push were added.
