// All visible student copy lives here. Existing quest state is the only source.
const MISSION=[
 {ask:'지구와 함께 도는 우리는 얼마나 빠를까요?',pick:'그림 하나를 눌러 예상해 보세요',
  act:{speed:'아래 돋보기를 눌러 속도를 봐요',bench:'아래 가로줄 그림을 눌러 비교해요'},
  watch:'속도 그림을 보며 예상을 비교해요',
  done:{right:'소리보다 빨라요. 다음으로 가요',wrong:'소리보다 빨라요. 그림을 다시 봐요'},free:'마음대로 만져 보세요'},
 {ask:'지구의 위쪽으로 가면 더 느려질까요?',pick:'그림 하나를 눌러 예상해 보세요',
  act:{move:'아래 가로 막대를 양 끝 쪽으로 끌어요',inspect:'아래 돋보기를 눌러 두 속도를 봐요'},
  watch:'두 화살표의 길이를 비교해 보세요',
  done:{right:'끝으로 갈수록 느려요. 다음으로 가요',wrong:'끝으로 갈수록 느려요. 다시 봐요'},free:'마음대로 만져 보세요'},
 {ask:'지구가 갑자기 멈추면 구슬은 어디로 갈까요?',pick:'그림 하나를 눌러 예상해 보세요',
  act:{stop:'아래 네모 버튼을 눌러 지구를 멈춰요',inspect:'아래 꺾인 화살표를 눌러 구슬을 봐요'},
  watch:'구슬이 나아가는 쪽을 지켜보세요',
  done:{right:'구슬은 앞으로 가요. 다음으로 가요',wrong:'구슬은 앞으로 가요. 그림을 다시 봐요'},free:'마음대로 만져 보세요'},
 {ask:'지구가 천천히 돌면 하루는 길어질까요?',pick:'그림 하나를 눌러 예상해 보세요',
  act:{mode:'아래 굽은 선 버튼을 눌러 봐요',turn:'아래 둥근 손잡이를 시계 방향으로 돌려요',inspect:'아래 돋보기를 눌러 낮밤 고리를 봐요'},
  watch:'낮밤 고리가 길어지는지 지켜보세요',
  done:{right:'하루가 길어져요. 다음으로 가요',wrong:'하루가 길어져요. 그림을 다시 봐요'},free:'마음대로 만져 보세요'},
 {ask:'지구가 멈추면 낮밤도 멈출까요?',pick:'그림 하나를 눌러 예상해 보세요',
  act:{turn:'아래 둥근 손잡이를 시계 방향 끝까지 돌려요'},
  watch:'멈춘 지구의 낮밤 고리를 지켜보세요',
  done:{right:'낮밤 한 바퀴는 일 년이에요. 다음으로 가요',wrong:'낮밤 한 바퀴는 일 년이에요. 다시 봐요'},free:'마음대로 만져 보세요'},
 {ask:'구슬이 덜 빠르게 움직이는 곳은 어디일까요?',pick:'그림 하나를 눌러 예상해 보세요',
  act:{move:'아래 가로 막대를 맨 끝 가까이 끌어요'},
  watch:'화살표가 짧아진 모습을 살펴보세요',
  done:{right:'끝에선 느려져요. 자유롭게 만져 봐요',wrong:'끝에선 느려져요. 다시 보고 만져 봐요'},free:'마음대로 만져 보세요'}
];
function missionText(questIndex,phase,ctx){
 if(!Number.isInteger(questIndex)||!MISSION[questIndex]||!['intro','predict','act','observe','confirm','card'].includes(phase))throw new RangeError('mission');
 const row=MISSION[questIndex];
 if(ctx.free)return row.free;
 if(phase==='intro')return row.ask;
 if(phase==='predict')return row.pick||row.ask;
 if(phase==='observe')return row.watch;
 if(phase==='confirm'||phase==='card')return row.done[ctx.pick===null||ctx.pick===QUESTS[questIndex].answerKey?'right':'wrong'];
 switch(questIndex){
  case 0:return row.act[ctx.flags.speedSeen?'bench':'speed'];
  case 1:return row.act[Math.abs(ctx.phi)>=PHYS.C.highLatitude?'inspect':'move'];
  case 2:return row.act[ctx.measurement?'inspect':'stop'];
  case 3:return row.act[ctx.mode!=='gradual'?'mode':ctx.P>=PHYS.C.questPeriod?'inspect':'turn'];
  case 4:return row.act.turn;
  case 5:return row.act.move;
 }
}
const mission=document.createElement('div');mission.id='mission';mission.dataset.mission='';
mission.setAttribute('role','status');mission.setAttribute('aria-live','polite');document.body.append(mission);
function syncMission(){
 mission.hidden=T.mode==='teacher';
 const text=missionText(Q.i,Q.phase,{...Q,...QUEST.sample()});
 if(mission.textContent!==text){
  mission.textContent=text;
  for(const animation of mission.getAnimations())animation.cancel();
  if(!mission.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches)mission.animate([{opacity:.35},{opacity:1}],{duration:120});
 }
 const top=document.getElementById('quests').getBoundingClientRect().bottom+8;
 document.documentElement.style.setProperty('--mission-top',top+'px');
 const contentTop=mission.hidden?top+12:top+mission.getBoundingClientRect().height+8;
 if(document.documentElement.style.getPropertyValue('--quest-content-top')!==contentTop+'px'){
  document.documentElement.style.setProperty('--quest-content-top',contentTop+'px');
  DIRECTOR.layoutDirty=true;
 }
}
