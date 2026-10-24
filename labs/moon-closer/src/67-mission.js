// Copy lives here; the display derives everything from the existing quest state.
const MISSION = [
  { ask: '달이 조금 다가오면 바다는 얼마나 달라질까요?', act: '달을 왼쪽 깃발로 끌고 돋보기를 눌러 봐요', done: { right: '거의 그대로예요. 다음 화살표를 눌러요', wrong: '예상과 달리 거의 그대로예요. 다음으로 가요' } },
  { ask: '달이 얼마나 다가와야 바다가 달라질까요?', act: '달을 끌어 눈금 여섯 곳과 끝 깃발을 지나 봐요', done: { right: '멀리 끌수록 달라져요. 다음 화살표를 눌러요', wrong: '예상보다 멀리 끌어야 해요. 다음으로 가요' } },
  { ask: '달까지 거리가 반이면 바다는 얼마나 높아질까요?', act: '달을 왼쪽 깃발까지 끌어 거리를 반으로 해요', done: { right: '바다가 여덟 배 높아져요. 다음으로 가요', wrong: '예상과 달리 여덟 배예요. 다음으로 가요' } },
  { ask: '달이 다가오면 바다는 어느 쪽이 부풀까요?', act: '돋보기를 누르고 시계를 돌려 두 봉우리를 봐요', done: { right: '양쪽 바다가 부풀어요. 다음 화살표를 눌러요', wrong: '예상과 달리 양쪽이 부풀어요. 다음으로 가요' } },
  { ask: '달이 다가오면 사람도 둥둥 뜰까요?', act: '달을 깃발로 끌고 사람과 물결 버튼을 눌러요', done: { right: '사람은 거의 그대로예요. 다음으로 가요', wrong: '예상과 달리 사람은 안 떠요. 다음으로 가요' } },
  { ask: '가까운 달은 크기와 움직임이 어떻게 바뀔까요?', act: '별 모양 버튼을 누르고 달을 깃발로 끌어요', done: { right: '달이 커지고 빨라져요. 다음으로 가요', wrong: '크기와 빠르기 모두 바뀌어요. 다음으로 가요' } },
  { ask: '달이 아주 가까워지면 어떤 모습이 될까요?', act: '달을 왼쪽 끝까지 끌어 모양을 바꿔 봐요', done: { right: '달이 부서져 고리가 돼요. 다음으로 가요', wrong: '예상과 달리 고리가 돼요. 다음으로 가요' } },
  { ask: '바닷물이 벽을 넘기 직전은 어디일까요?', act: '달을 끌어 물 높이를 벽에 맞추고 멈춰요', done: { right: '벽 높이에 맞췄어요. 네모 버튼으로 더 해 봐요', wrong: '예상과 달라도 맞췄어요. 네모 버튼을 눌러요' } }
].map(row => ({ ...row, pick: '그림 중 하나를 눌러 예상해 보세요', watch: '목표를 이뤘어요. 바뀐 모습을 지켜봐요', free: '마음대로 만져 보세요' }));

function missionText(questIndex, phase, ctx = {}) {
  if (!Number.isInteger(questIndex) || !MISSION[questIndex] || !['intro', 'predict', 'act', 'observe', 'confirm', 'card'].includes(phase)) throw new RangeError('mission quest/phase');
  const row = MISSION[questIndex];
  if (ctx.free) return row.free;
  if (phase === 'intro') return row.ask;
  if (phase === 'predict') return row.pick || row.ask;
  if (phase === 'act') return row.act;
  if (phase === 'observe') return row.watch;
  return row.done[ctx.pick === null || ctx.pick === ctx.answerKey ? 'right' : 'wrong'];
}

window.addEventListener('resize', syncUI);
