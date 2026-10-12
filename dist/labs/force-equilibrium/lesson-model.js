// Curriculum evidence and learning records are independent of the Three.js view.
export const VERSION = 2;
export const STAGES = ['context', 'represent', 'predict', 'experiment', 'explain', 'transfer'];
export const SOURCES = [
  {id:'moe2022', title:'교육부 고시 제2022-33호, 별책 9 과학과 교육과정', url:'https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=141&boardSeq=93458&lev=0', locator:'초등 힘과 우리 생활 / 중학교 힘의 작용 / 선택 물리학 힘과 에너지', kind:'official-curriculum'},
  {id:'iscream3', title:'아이스크림미디어 과학 3-1 공개 지도서 수업 자료', url:'https://qrd.i-scream.co.kr/22USB/22SC301/ebook/Documents/index.html', locator:'1단원 1~12차시, 교과서 14~33쪽에 연결된 수업 목차', kind:'publisher-lesson-outline'},
  {id:'goe2026', title:'경기도교육청 하이러닝 활용 중학교 수업설계, 과학 17', url:'https://www.goe.go.kr/resource/goe/na/bbs_2675/2026/02/1be20e5d-8192-482d-ba22-68ada1632996.pdf#page=143', locator:'143~151쪽, 다양한 상황의 평형 / 헬륨 비행선 / 알짜힘과 운동', kind:'public-teaching-example'}
];
export const CURRICULUM = {
  id:'middle-parallel-forces-2022', standard:'9과05-01', related:['9과05-03'],
  scope:'2022 개정 중학교 과학: 힘의 표현과 나란한 힘의 평형을 위한 재구성 수업. 단원 전체 또는 특정 출판사 지도서의 원차시를 대체하지 않음.',
  durationMinutes:45, minutes:[5,7,4,13,8,8], sources:['moe2022','goe2026'],
  alignment:'adapted', publisherEdition:null,
  exclusions:['중력·탄성력·마찰력·부력 단원 전체','대각선 벡터합','돌림힘의 동역학']
};
const clone = value => JSON.parse(JSON.stringify(value));
export const direction = x => Math.abs(x)<1e-8 ? 0 : Math.sign(x);
export function newLesson(id='local') {
  return {schemaVersion:VERSION,id,createdAt:new Date().toISOString(),curriculum:clone(CURRICULUM),
    stage:0,unlockedStage:0,phase:'ready',targetAttempts:[],representations:[null,null],representationAttempts:[],
    magnitude:1,prediction:null,trials:[],evidenceId:null,reason:null,explanationAttempts:[],
    transfer:{magnitude:2,direction:-1,prediction:null},transferAttempts:[],completed:false};
}
export function representationResult(reps) {
  return reps.map((r,i)=>!!r && r.onBody===true && r.direction===(i===0?1:-1) && r.magnitude===(i===0?1:2));
}
export function trialCoverage(trials) {
  return [-1,0,1].map(sign=>trials.some(t=>direction(t.resultant)===sign));
}
export function addTrial(s, observation) {
  const resultant=s.magnitude-2;
  const trial={id:s.trials.length+1,magnitude:s.magnitude,fixedMagnitude:2,mass:1,
    angles:[0,180],applicationPoints:[0,0],initialVelocity:0,prediction:s.prediction,
    resultant,observedDirection:direction(observation.x),x:observation.x,vx:observation.vx,
    elapsed:observation.time,controlled:true};
  s.trials.push(trial);s.phase='result';return trial;
}
export function explanationResult(s) {
  const t=s.trials.find(t=>t.id===s.evidenceId);
  return {evidence:!!t&&direction(t.resultant)===0,reason:s.reason==='equal-opposite'};
}
export function transferResult(t) {
  const resultant=3+t.direction*t.magnitude;
  return {resultant,balanced:direction(resultant)===0,predictionCorrect:t.prediction===direction(resultant),
    goalUnderstood:t.prediction===0};
}
export function assessment(s) {
  const arrows=representationResult(s.representationAttempts.at(-1)?.representations||[null,null]).filter(Boolean).length;
  const coverage=trialCoverage(s.trials).filter(Boolean).length;
  const lastExplanation=s.explanationAttempts.at(-1),lastTransfer=s.transferAttempts.at(-1);
  const explanation=lastExplanation?explanationResult({...s,...lastExplanation}):{evidence:false,reason:false};
  const transfer=lastTransfer?transferResult(lastTransfer):{balanced:false,predictionCorrect:false};
  // A proposed formative rubric, not an official grade. Prediction errors are not scored.
  return {body:s.targetAttempts.at(-1)==='cart'?(s.targetAttempts[0]==='cart'?2:1):0,
    representation:arrows,investigation:coverage===3?2:coverage>0?1:0,
    explanation:Number(explanation.evidence)+Number(explanation.reason),
    transfer:Number(transfer.balanced)+Number(transfer.balanced&&transfer.predictionCorrect)};
}
export function report(s) {
  return {schema:'force-lab-learning-record',schemaVersion:VERSION,session:clone(s),
    assessment:{kind:'proposed-formative-rubric',scale:[0,1,2],predictionPenalized:false,
      scores:assessment(s),teacherExplanation:'학생의 마지막 응답과 실험 증거를 바탕으로 한 보조 점검. 구두 설명·실제 실험·교사의 관찰로 보완하며 공식 성취수준 판정이 아님.'},
    sources:clone(SOURCES)};
}
export function validateReport(data) {
  if(data?.schema!=='force-lab-learning-record'||data.schemaVersion!==VERSION)throw Error('record-schema');
  const s=data.session;
  if(!s||!Number.isInteger(s.stage)||s.stage<0||s.stage>5||!Array.isArray(s.trials)||s.trials.length>12)throw Error('record-shape');
  if(!Number.isInteger(s.unlockedStage)||s.unlockedStage<s.stage||s.unlockedStage>5||typeof s.completed!=='boolean'||typeof s.id!=='string'||!['ready','release','watch','result'].includes(s.phase))throw Error('record-shape');
  if(!Array.isArray(s.representations)||s.representations.length!==2||!Array.isArray(s.targetAttempts)||!Array.isArray(s.representationAttempts)||!Array.isArray(s.explanationAttempts)||!Array.isArray(s.transferAttempts))throw Error('record-shape');
  if([s.targetAttempts,s.representationAttempts,s.explanationAttempts,s.transferAttempts].some(a=>a.length>1000)||s.targetAttempts.some(v=>!['cart','arrow'].includes(v)))throw Error('record-attempts');
  const validRep=r=>r&&[1,2,3,4].includes(r.magnitude)&&[-1,1].includes(r.direction)&&typeof r.onBody==='boolean';
  const validTransfer=t=>t&&[1,2,3,4].includes(t.magnitude)&&[-1,1].includes(t.direction)&&[null,-1,0,1].includes(t.prediction);
  if(![1,2,3,4].includes(s.magnitude)||![null,-1,0,1].includes(s.prediction))throw Error('record-input');
  for(const t of s.trials){
    if(!Number.isInteger(t.magnitude)||t.magnitude<1||t.magnitude>4||t.fixedMagnitude!==2||t.mass!==1||t.initialVelocity!==0||t.resultant!==t.magnitude-2||![-1,0,1].includes(t.prediction)||![t.x,t.vx,t.elapsed].every(Number.isFinite))throw Error('record-trial');
    if(t.id!==s.trials.indexOf(t)+1||t.observedDirection!==direction(t.x)||t.controlled!==true||JSON.stringify(t.angles)!=='[0,180]'||JSON.stringify(t.applicationPoints)!=='[0,0]')throw Error('record-trial');
  }
  if(!validTransfer(s.transfer)||s.transferAttempts.some(t=>!validTransfer(t)||t.prediction===null))throw Error('record-transfer');
  for(const r of s.representations)if(r&&!validRep(r))throw Error('record-representation');
  if(s.representationAttempts.some(t=>!Array.isArray(t.representations)||t.representations.length!==2||!t.representations.every(validRep)))throw Error('record-representation');
  if(s.explanationAttempts.some(t=>!['equal-opposite','unequal-opposite','no-forces'].includes(t.reason)||!s.trials.some(r=>r.id===t.evidenceId)))throw Error('record-explanation');
  s.curriculum=clone(CURRICULUM);
  return report(s); // Recompute scores; imported scores are never trusted.
}
