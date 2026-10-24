// The only visible-language table. Rows follow QUESTS; no new quest state.
const MISSION=[
 {ask:'가까이 가면 막대가 얼마나 늘어날까요?',pick:'그림 중 하나를 눌러 예상해 보세요',act:'거리 손잡이를 오른쪽 끝까지 끌어 보세요',watch:'늘어난 막대와 양끝 화살표를 살펴보세요',done:{right:'맞아요, 크게 늘어나요. → 를 눌러요',wrong:'크게 늘어나요. → 를 눌러 넘어가요'},free:'마음대로 만져 보세요'},
 {ask:'거리가 반이 되면 당김 차이는 몇 배일까요?',pick:'그림 중 하나를 눌러 예상해 보세요',act:'거리 손잡이를 다음 점까지 끌어 보세요',compare:'아래 두 칸 버튼을 눌러 비교해 보세요',watch:'두 그림의 당김 차이를 비교해 보세요',done:{right:'맞아요, 여덟 배예요. → 를 눌러요',wrong:'여덟 배가 돼요. → 를 눌러 넘어가요'},free:'마음대로 만져 보세요'},
 {ask:'막대는 검은 원 안팎 중 어디서 끊어질까요?',pick:'그림 중 하나를 눌러 예상해 보세요',act:'거리 손잡이를 오른쪽 점까지 끌어 보세요',watch:'막대가 끊어진 곳과 검은 원을 비교해요',done:{right:'맞아요, 원 밖이에요. → 를 눌러요',wrong:'원 밖에서 끊어져요. → 를 눌러요'},free:'마음대로 만져 보세요'},
 {ask:'더 큰 블랙홀의 테두리에서는 덜 늘어날까요?',pick:'그림 중 하나를 눌러 예상해 보세요',act:'아래 더하기 든 사각형 버튼을 눌러요',compare:'아래 두 칸 버튼을 눌러 비교해 보세요',watch:'크기를 바꾸기 전후의 당김을 비교해요',done:{right:'맞아요, 덜 늘어나요. → 를 눌러요',wrong:'큰 쪽에서 덜 늘어나요. → 를 눌러요'},free:'마음대로 만져 보세요'},
 {ask:'검은 원을 넘으면 막대가 바로 끊어질까요?',pick:'그림 중 하나를 눌러 예상해 보세요',act:'거리 손잡이를 원 안쪽 점까지 끌고 놓아요',watch:'검은 원 안에서 멀쩡한 막대를 살펴봐요',done:{right:'맞아요, 바로 안 끊어져요. → 를 눌러요',wrong:'원 안에서도 멀쩡해요. → 를 눌러요'},free:'마음대로 만져 보세요'},
 {ask:'어느 블랙홀에서 막대가 원 안까지 버틸까요?',pick:'그림 중 하나를 눌러 예상해 보세요',act:'사각형을 누르고 손잡이를 안쪽 점까지 끌어요',watch:'큰 블랙홀 안에서 버틴 막대를 살펴봐요',done:{right:'맞아요, 큰 쪽은 버텨요. 십자 버튼을 눌러요',wrong:'큰 쪽은 버텨요. 십자 버튼으로 더 만져요'},free:'마음대로 만져 보세요'}
];
function missionText(questIndex,phase,ctx={}){
 const key={intro:'ask',predict:'pick',act:'act',observe:'watch',confirm:'done',card:'done',free:'free'}[ctx.free?'free':phase];
 const row=MISSION[questIndex];
 if(!row||!key)throw new RangeError('mission quest/phase');
 if(key==='done')return row.done[ctx.correct===false?'wrong':'right'];
 if(key==='act'&&row.compare&&ctx.compareReady)return row.compare;
 return row[key];
}
const mission=document.getElementById('mission');
function syncMission(){
 mission.hidden=T.mode==='teacher';
 if(mission.hidden)return;
 const sample=QUEST.sample();
 const text=missionText(Q.i,Q.phase,{free:Q.free,correct:QUEST.correct(),
  compareReady:Q.i===1?PHYS.judgeQ2({...sample,ratioSeen:true}):Q.i===3?PHYS.judgeQ4({...sample,comparisonOpen:true}):false});
 mission.style.top=(document.getElementById('quests').getBoundingClientRect().bottom+8)+'px';
 if(mission.textContent===text)return;
 mission.getAnimations().forEach(a=>a.cancel());
 mission.textContent=text;
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)mission.animate([{opacity:.35},{opacity:1}],{duration:120});
}
