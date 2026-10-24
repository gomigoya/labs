// All visible student language. Extra act entries describe the next available control.
const MISSION = [
 {ask:'엔진 하나로 로켓이 땅에서 뜰까요?',pick:'그림을 눌러 로켓의 모습을 예상해 보세요',
  act:'▶를 눌러 엔진 하나에 불을 붙여 보세요',running:'연료가 다 탈 때까지 지켜보세요',
  watch:'로켓이 땅에 있는지 살펴보세요',
  done:{right:'예상과 같아요. 결과 그림을 살펴보세요',wrong:'예상과 달라요. 결과 그림을 살펴보세요'},
  next:'뜨지 않았어요. →로 다음 실험을 해요',free:'마음대로 만져 보세요'},
 {ask:'엔진 몇 개면 로켓이 바로 뜰까요?',pick:'그림을 눌러 필요한 엔진 수를 골라 보세요',
  act:'아래 +를 눌러 엔진 수를 늘려 보세요',ready:'▶를 눌러 바로 뜨는지 살펴보세요',running:'로켓이 바로 뜨는지 지켜보세요',
  watch:'로켓이 땅을 떠나는 순간을 살펴보세요',
  done:{right:'예상과 같아요. 결과 그림을 살펴보세요',wrong:'예상과 달라요. 결과 그림을 살펴보세요'},
  next:'다섯 개면 떠요. →로 다음 실험을 해요',free:'마음대로 만져 보세요'},
 {ask:'날아가는 로켓의 점 간격은 어떨까요?',pick:'그림을 눌러 점 간격을 예상해 보세요',
  act:'▶를 눌러 로켓을 날려 보세요',running:'점이 생기면 아래 돋보기를 눌러 보세요',
  watch:'점 사이가 점점 벌어지는지 살펴보세요',
  done:{right:'예상과 같아요. 결과 그림을 살펴보세요',wrong:'예상과 달라요. 결과 그림을 살펴보세요'},
  next:'점 간격이 벌어져요. →로 다음 실험을 해요',free:'마음대로 만져 보세요'},
 {ask:'짐이 커져도 같은 엔진으로 뜰까요?',pick:'그림을 눌러 큰 짐의 로켓을 예상해 보세요',
  act:'아래 압정을 눌러 작은 짐을 기록해요',pinned:'아래 큰 상자 버튼을 눌러 짐을 늘려요',
  ready:'▶를 눌러 큰 짐을 싣고 날려 보세요',running:'아래 돋보기를 눌러 두 짐을 비교해요',
  watch:'짐을 늘린 뒤 남는 힘을 살펴보세요',
  done:{right:'예상과 같아요. 결과 그림을 살펴보세요',wrong:'예상과 달라요. 결과 그림을 살펴보세요'},
  next:'같은 엔진으로 떠요. →로 다음 실험을 해요',free:'마음대로 만져 보세요'},
 {ask:'달에서는 엔진 하나로 뜰까요?',pick:'그림을 눌러 달의 로켓을 예상해 보세요',
  act:'▶를 눌러 달에서 로켓을 날려 보세요',running:'달에서 로켓이 뜨는지 지켜보세요',
  watch:'엔진 하나로 떠오르는 모습을 살펴보세요',
  done:{right:'예상과 같아요. 결과 그림을 살펴보세요',wrong:'예상과 달라요. 결과 그림을 살펴보세요'},
  next:'달에서는 하나로 떠요. →로 다음 실험을 해요',free:'마음대로 만져 보세요'},
 {ask:'큰 짐을 싣고 바로 뜨려면 몇 개일까요?',pick:'그림을 눌러 필요한 엔진 수를 골라 보세요',
  act:'아래 +를 눌러 엔진 수를 늘려 보세요',ready:'▶를 눌러 큰 짐을 싣고 날려 보세요',running:'큰 짐을 싣고 바로 뜨는지 지켜보세요',
  watch:'큰 짐을 싣고 땅을 떠나는지 살펴보세요',
  done:{right:'예상과 같아요. 결과 그림을 살펴보세요',wrong:'예상과 달라요. 결과 그림을 살펴보세요'},
  next:'다섯 개면 떠요. 물결 버튼으로 더 해 봐요',free:'마음대로 만져 보세요'}
];
function missionText(questIndex,phase,ctx={}){
 // Validate the public boundary once; all branches below use this row.
 if(!Number.isInteger(questIndex)||!MISSION[questIndex]||!['intro','predict','act','observe','confirm','card','free'].includes(phase))throw new RangeError('mission');
 const m=MISSION[questIndex];
 if(ctx.free||phase==='free')return m.free;
 if(phase==='intro')return m.ask;
 if(phase==='predict')return m.pick||m.ask;
 if(phase==='observe')return m.watch;
 if(phase==='confirm')return m.done[ctx.correct?'right':'wrong'];
 if(phase==='card')return m.next;
 if(questIndex===3){
  if(!ctx.before)return m.act;
  if(ctx.load!==500000)return m.pinned;
  return ctx.ignited?m.running:m.ready;
 }
 if((questIndex===1||questIndex===5)&&ctx.n!==5)return m.act;
 if(ctx.ignited)return m.running;
 return m.ready||m.act;
}
// Follow the actual quest strip height, including responsive wrapping and safe areas.
if(typeof ResizeObserver==='function')new ResizeObserver(()=>{
 document.getElementById('mission').style.top=(document.getElementById('quests').getBoundingClientRect().bottom+10)+'px';
}).observe(document.getElementById('quests'));
