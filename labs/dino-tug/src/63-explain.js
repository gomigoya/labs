// 설명 문구와 검증은 이 경계 한 곳에서 관리한다.
const text = x=>x[LANG]??x.ko;
const EXPLAIN = {
 1:{q:{ko:'아이 한 명이 작은 공룡을 이긴 건 왜일까요?',en:"Why did a child beat the small dinosaur?"},options:[
  {key:'a',ko:'공룡이니까 무조건 힘이 세요',en:"Dinosaurs are always strong.",hint:{ko:'방금 장면을 다시 봐요. 작은 공룡은 땅을 붙잡는 힘이 작았어요.',en:"Look again. The small dinosaur had little grip on the ground."}},
  {key:'b',ko:'작은 공룡은 가벼워서 땅을 붙잡는 힘(마찰)이 작아요',en:"The small dinosaur is light, so its friction is small.",correct:true},
  {key:'c',ko:'아이가 더 어려서 봐줘요',en:"It lets the younger child win.",hint:{ko:'공룡은 봐주지 않아요. 힘의 크기만 비교해요.',en:"It does not let anyone win. Compare the forces."}}
 ],recap:{ko:'가벼운 공룡은 땅을 붙잡는 힘이 작아서 아이 한 명에게도 질 수 있어요.',en:"A light dinosaur has little grip, so even a child can beat it."}},
 2:{q:{ko:'공룡을 이기려면 왜 여러 명이 필요했을까요?',en:"Why did it take several children to win?"},options:[
  {key:'a',ko:'아이들 힘을 모은 합이 공룡의 힘을 넘을 때 이겨요',en:"The children win when their total force exceeds the dinosaur's.",correct:true},
  {key:'b',ko:'아이가 몇 명이든 공룡이 이겨요',en:"The dinosaur wins against any team.",hint:{ko:'아이를 늘리면 힘이 더해져서 공룡을 넘었어요.',en:"More children added enough force to beat the dinosaur."}},
  {key:'c',ko:'아이가 많으면 서로 방해해서 힘이 줄어요',en:"More children get in each other's way and reduce force.",hint:{ko:'이 실험에서는 아이들 힘이 그대로 더해져요.',en:"In this model, the children's forces add together."}}
 ],recap:{ko:'힘은 더해져요. 합이 상대보다 크면 그쪽으로 움직여요.',en:"Forces add together. The larger total moves the flag its way."}},
 3:{q:{ko:'티라노를 이기려면 왜 그렇게 많은 아이가 필요했을까요?',en:"Why did it take so many children to beat T. rex?"},options:[
  {key:'a',ko:'아이들 힘의 합이 티라노의 한계를 넘는 인원(약 59명)이 필요해요',en:"About fifty-nine children must combine forces to exceed its limit.",correct:true},
  {key:'b',ko:'티라노는 아무리 많아도 못 이겨요',en:"No team can beat T. rex.",hint:{ko:'약 59명이 모이면 합이 티라노의 한계를 넘었어요.',en:"About fifty-nine children together exceeded its limit."}},
  {key:'c',ko:'아이 10명이면 충분해요',en:"Ten children are enough.",hint:{ko:'10명의 힘은 티라노의 한계보다 작아요.',en:"Ten children have less force than its limit."}}
 ],recap:{ko:'힘의 합을 비교하면 이길 수 있는 사람 수를 알 수 있어요.',en:"Compare total forces to find a team size that can win."}},
 4:{q:{ko:'바닥을 유리로 바꾸니 왜 결과가 바뀌었을까요?',en:"Why did changing to glass change the result?"},options:[
  {key:'a',ko:'미끄러운 바닥은 아이 팀 힘만 줄여요',en:"Slippery ground only weakens the children.",hint:{ko:'바닥은 양쪽에 똑같아요. 줄어든 두 마찰을 다시 비교해 봐요.',en:"Both sides use the same ground. Compare both friction forces."}},
  {key:'b',ko:'바닥이 미끄러우면 발이 땅을 붙잡는 힘(마찰)이 줄어서, 가벼운 쪽이 먼저 미끄러져요',en:"Slippery ground reduces friction, so the lighter side slips first.",correct:true},
  {key:'c',ko:'공룡은 발이 커서 안 미끄러워요',en:"The dinosaur has big feet, so it cannot slip.",hint:{ko:'공룡도 같은 바닥이에요. 무거워서 마찰이 더 컸을 뿐이에요.',en:"It uses the same ground. Its greater weight gives it more friction."}}
 ],recap:{ko:'마찰은 땅이 발을 붙잡는 힘이에요. 바닥이 미끄러우면 마찰이 줄어요.',en:"Friction is the ground gripping the feet. Slippery ground gives less friction."}},
 5:{q:{ko:'유리 위에서 인원을 늘리니 왜 이길 수 있었을까요?',en:"Why could adding children help on glass?"},options:[
  {key:'a',ko:'인원이 늘면 마찰의 한계도 같이 커져요',en:"More children also raise the friction limit.",correct:true},
  {key:'b',ko:'바닥이 같으면 한계는 인원과 상관없어요',en:"On the same ground, team size cannot change the limit.",hint:{ko:'인원이 늘자 마찰 화살표의 한계도 길어졌어요.',en:"The friction limit arrow grew when children were added."}},
  {key:'c',ko:'유리에서는 인원이 늘수록 더 미끄러워요',en:"More children slip more on glass.",hint:{ko:'인원이 늘면 땅을 누르는 힘이 커져서 오히려 덜 미끄러워요.',en:"More children press harder on the ground, so they slip less."}}
 ],recap:{ko:'마찰의 한계는 발이 땅을 누르는 힘에 따라 커져요.',en:"The friction limit grows as feet press harder on the ground."}},
 6:{q:{ko:'큰 공룡일수록 몸무게에 비해 근육 힘은 어떨까요?',en:"How does muscle force compare with weight in bigger dinosaurs?"},options:[
  {key:'a',ko:'클수록 몸무게에 비해서도 힘이 더 세요',en:"Bigger animals are stronger for their weight too.",hint:{ko:'비교 막대를 다시 봐요. 큰 종의 막대가 더 짧아요.',en:"Look at the bars again. The bigger species has a shorter bar."}},
  {key:'b',ko:'몸이 클수록 몸무게에 비해 근육 힘은 작아져요',en:"Bigger bodies have less muscle force for their weight.",correct:true},
  {key:'c',ko:'크기와 상관없이 똑같아요',en:"Size makes no difference.",hint:{ko:'두 막대의 길이가 서로 달랐어요.',en:"The bars had different lengths."}}
 ],recap:{ko:'큰 동물일수록 몸무게에 비해 근육 힘은 작아요. (이 실험의 값은 추정이에요.)',en:"Bigger animals have less muscle force for their weight. (These values are estimates.)"}},
 7:{q:{ko:'아이 30명이 이길 수 있는 종은 왜 거기까지일까요?',en:"Why can thirty children beat only some species?"},options:[
  {key:'a',ko:'가장 무거운 종도 아이 30명이면 이겨요',en:"Thirty children can beat even the heaviest species.",hint:{ko:'가장 무거운 종은 30명의 힘의 합보다 한계가 커요.',en:"The heaviest species has a higher limit than thirty children's total force."}},
  {key:'b',ko:'30명의 힘의 합 안에 드는 종까지만 이길 수 있어요',en:"Thirty children can beat only species within their total force.",correct:true},
  {key:'c',ko:'이기고 지는 건 종 이름에 달렸어요',en:"Winning depends on the species name.",hint:{ko:'이름이 아니라 힘의 크기를 비교해서 정해져요.',en:"We compare forces to decide who wins."}}
 ],recap:{ko:'이기는 쪽은 한계의 합이 큰 쪽이에요.',en:"The side with the greater total capacity wins."}},
 8:{q:{ko:'두 팀이 똑같이 당겼는데 왜 깃발이 가운데 멈췄을까요?',en:"Why did equal pulls leave the flag in the middle?"},options:[
  {key:'a',ko:'힘이 없어서 안 움직여요',en:"It stays still because there is no force.",hint:{ko:'화살표를 다시 봐요. 양쪽 모두 힘이 있어요.',en:"Look at the arrows again. Both sides exert force."}},
  {key:'b',ko:'두 힘이 같고 방향이 반대라서 서로 상쇄돼요',en:"Equal forces in opposite directions cancel out.",correct:true},
  {key:'c',ko:'줄이 너무 팽팽해서 못 움직여요',en:"The rope is too tight to move.",hint:{ko:'줄이 팽팽한 건 두 팀이 같은 힘으로 당기고 있다는 뜻이에요.',en:"A tight rope here means both teams pull with equal force."}}
 ],recap:{ko:'크기가 같고 방향이 반대인 두 힘은 평형을 이뤄서 물체가 움직이지 않아요.',en:"Equal forces in opposite directions are balanced, so the object stays still."}},
 9:{q:{ko:'한 명이 더 오니 왜 깃발이 움직였을까요?',en:"Why did the flag move when a child joined?"},options:[
  {key:'a',ko:'힘이 한쪽만 더 커져서 평형이 깨져요',en:"Only that side's force grew, so the forces are unbalanced.",correct:true},
  {key:'b',ko:'한 명 정도로는 아무 변화가 없어요',en:"Adding a child makes no change.",hint:{ko:'한 명만 늘어도 그쪽 힘이 더 커져서 깃발이 움직였어요.',en:"Adding a child made that team's force larger and moved the flag."}},
  {key:'c',ko:'무거운 쪽이 항상 이겨요',en:"The heavier side always wins.",hint:{ko:'이 실험에서는 몸무게가 아니라 당기는 힘의 합으로 정해져요.',en:"Here, total pulling force decides the result, rather than weight alone."}}
 ],recap:{ko:'힘이 같지 않으면(불균형) 더 큰 쪽으로 움직임이 바뀌어요.',en:"Unbalanced forces change motion toward the larger force."}},
 10:{q:{ko:'줄 가운데 저울은 왜 그 값을 가리켰을까요?',en:"Why did the middle gauge show that reading?"},options:[
  {key:'a',ko:'저울은 양쪽 힘을 더해서 보여 줘요',en:"The gauge adds the forces from both sides.",hint:{ko:'저울 눈금은 한 팀의 화살표와 같았어요. 두 팀 힘의 합이 아니에요.',en:"Its reading matched a team's arrow, rather than both teams' total."}},
  {key:'b',ko:'줄은 하나라서 양쪽 끝에 걸리는 힘(장력)이 같아요',en:"It is a single rope, so tension is equal at both ends.",correct:true},
  {key:'c',ko:'이기는 팀 쪽 줄이 더 팽팽해요',en:"The rope is tighter on the winning side.",hint:{ko:'6 대 5에서도 양쪽 끝 저울이 같은 값을 가리켰어요.',en:"Even with six against five, both end gauges gave the same reading."}}
 ],recap:{ko:'팽팽한 줄의 장력은 어디서나 같아요. 이기는 쪽과 지는 쪽의 줄 힘도 같아요.',en:"Tension is the same along a tight rope, on the winning and losing sides."},bridge:{ko:'그런데 왜 한 팀만 끌려갈까요?',en:"Then why does only the losing team get dragged?"}},
 11:{q:{ko:'줄의 힘은 같은데 왜 한 팀만 끌려갈까요?',en:"Why does only the losing team move if rope forces are equal?"},options:[
  {key:'a',ko:'줄의 힘이 한쪽이 더 커서요',en:"The rope force is greater on that side.",hint:{ko:'줄을 골라 봐요. 줄 양 끝의 힘은 같았어요.',en:"Choose the rope. The forces at its ends were equal."}},
  {key:'b',ko:'끌려가는 팀은 줄이 당기는 힘이 땅이 붙잡는 힘(마찰)보다 커서 힘의 합이 0이 아니에요',en:"For the dragged team, the rope pulls harder than friction, leaving a net force.",correct:true},
  {key:'c',ko:'이기는 쪽 줄이 더 힘을 줘요',en:"The rope pulls harder on the winning side.",hint:{ko:'이기는 쪽과 지는 쪽 줄이 당기는 힘은 같았어요.',en:"The rope pulls equally on the winning and losing sides."}}
 ],recap:{ko:'한 물체의 힘의 합이 0이면 평형이에요. 무엇을 보느냐에 따라 힘의 합이 달라져요.',en:"Forces are balanced when the net force is zero. The net force depends on which object you choose."}},
 12:{q:{ko:'마찰 화살표는 왜 처음엔 짧다가 길어졌을까요?',en:"Why did the friction arrow start short and grow?"},options:[
  {key:'a',ko:'마찰은 처음부터 항상 최대예요',en:"Friction is always at its maximum from the start.",hint:{ko:'손잡이를 처음 올릴 때 마찰 화살표는 짧았어요.',en:"The friction arrow was short when you first raised the handle."}},
  {key:'b',ko:'마찰은 당기는 힘에 맞춰 커지다가 한계에서 미끄러져요',en:"Friction grows with the pull until its limit, then slipping starts.",correct:true},
  {key:'c',ko:'마찰은 움직일 때만 생겨요',en:"Friction acts only while moving.",hint:{ko:'아직 안 움직일 때도 마찰 화살표가 있었어요.',en:"The friction arrow was there before anything moved."}}
 ],recap:{ko:'마찰은 필요한 만큼만 생겨요. 한계를 넘으면 미끄러져요.',en:"Friction acts only as much as needed. Beyond its limit, slipping starts."}}
};
// QUESTS 정의 직후 모듈을 읽는 동안 한 번 호출한다.
function validateExplain(quests){
 for(const {id} of quests){
  const d=EXPLAIN[id];
  const bilingual=x=>['ko','en'].every(lang=>typeof x?.[lang]==='string'&&x[lang].trim());
  if(d?.bridge!==undefined&&!bilingual(d.bridge))throw new Error('explain: 퀘스트 '+id+' bridge 오류');
  if(!bilingual(d?.q)||!bilingual(d?.recap)||d.options?.length!==3||d.options.filter(o=>o.correct).length!==1||d.options.some((o,i)=>o.key!=='abc'[i]||!bilingual(o)||!o.correct&&!bilingual(o.hint)))throw new Error('explain: 퀘스트 '+id+' 설명 데이터 오류');
 }
}
