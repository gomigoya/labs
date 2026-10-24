// Copy lives here; presentation derives everything from the existing quest state.
const MISSION = [
  {ask:'어느 별에서 몸무게가 더 가벼울까요?',pick:'아래 그림을 눌러 가벼운 별을 골라요',act:'둥근 손잡이를 돌려 달을 찾아보세요',watch:'달에서 줄어든 무게를 지켜보세요',done:'달에서는 가벼워져요. 다음 화살표를 눌러요',free:'마음대로 만져 보세요'},
  {ask:'달로 가면 양팔 저울이 기울까요?',pick:'아래 그림을 눌러 저울 모습을 골라요',act:'지구와 달에서 양팔 저울 버튼을 눌러요',actMove:'둥근 손잡이를 돌려 달에서도 확인해요',actEarth:'둥근 손잡이를 돌려 지구에서도 확인해요',watch:'두 별의 양팔 저울을 지켜보세요',done:'두 별 모두 수평이에요. 다음 화살표를 눌러요',free:'마음대로 만져 보세요'},
  {ask:'세 별 중 어디에서 가장 무거울까요?',pick:'아래 그림을 눌러 가장 무거운 별을 골라요',act:'둥근 손잡이를 돌려 가장 무거운 별을 찾아요',watch:'목성에서 늘어난 무게를 지켜보세요',done:'목성에서 가장 무거워요. 다음 화살표를 눌러요',free:'마음대로 만져 보세요'},
  {ask:'태양에서는 무게를 끝까지 잴 수 있을까요?',pick:'아래 그림을 눌러 태양의 무게를 예상해요',act:'둥근 손잡이를 태양으로 돌려 체크를 눌러요',actMass:'더하기 버튼으로 추를 늘려 체크를 눌러요',watch:'무게 눈금의 끝을 지켜보세요',done:'눈금의 끝을 넘었어요. 다음 화살표를 눌러요',free:'마음대로 만져 보세요'},
  {ask:'어느 별에서 더 높이 뛸 수 있을까요?',pick:'아래 그림을 눌러 높이 뛸 별을 골라요',act:'지구에서 위쪽 화살표 버튼을 눌러 뛰어요',actMove:'둥근 손잡이를 달로 돌려 화살표를 눌러요',actEarth:'둥근 손잡이를 지구로 돌려 화살표를 눌러요',watch:'두 별에서 뛴 높이를 비교해 보세요',done:'달에서 더 높이 뛰어요. 다음 화살표를 눌러요',free:'마음대로 만져 보세요'},
  {ask:'아주 작은 별에서도 무거워질까요?',pick:'아래 그림을 눌러 가장 무거운 별을 골라요',act:'둥근 손잡이를 돌려 작은 중성자별을 찾아요',watch:'작은 별에서 늘어난 무게를 지켜보세요',done:'작아도 무거워져요. 다음 화살표를 눌러요',free:'마음대로 만져 보세요'},
  {ask:'지구와 몸무게가 비슷한 별은 어디일까요?',pick:'아래 그림을 눌러 비슷한 무게를 골라요',act:'둥근 손잡이를 돌려 점선 안의 무게를 찾아요',watch:'점선 안에 들어온 무게를 지켜보세요',done:'비슷한 별을 찾았어요. 자유 실험 버튼을 눌러요',free:'마음대로 만져 보세요'}
];
function missionText(questIndex, phase, ctx={}){
  const key={intro:'ask',predict:'pick',act:'act',observe:'watch',confirm:'done',card:'done',free:'free'}[phase];
  if(!Number.isInteger(questIndex)||!MISSION[questIndex]||!key)throw new RangeError('mission');
  const row=MISSION[questIndex];
  if(phase==='act'){
    if(questIndex===1){
      if(ctx.flags.visited.includes(0))return row.actMove;
      if(ctx.flags.visited.includes(1))return row.actEarth;
    }
    if(questIndex===3&&ctx.body===7&&ctx.nWeights===1)return row.actMass;
    if(questIndex===4){
      if(ctx.flags.runs.some(r=>r.i===0))return row.actMove;
      if(ctx.flags.runs.some(r=>r.i===1))return row.actEarth;
    }
  }
  return row[key]||row.ask;
}
