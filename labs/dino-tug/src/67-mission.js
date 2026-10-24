// All student-visible mission words live here. Existing quest state owns progress.
const MISSION = [
 {ask:{ko:'공룡 한 마리와 아이 한 명, 누가 이길까요?',en:"A dinosaur or a child: who wins?"},
  act:{play:{ko:'삼각형 버튼을 눌러 줄을 당겨 보세요',en:"Press play to pull the rope."}},
  right:{ko:'아이가 이겼어요. 다음 실험을 기다려요',en:"The child won. Wait for next."},wrong:{ko:'예상과 달리 아이가 이겼어요. 다음을 기다려요',en:"The child won instead. Wait for next."}},
 {ask:{ko:'뿔 세 개 공룡을 이기려면 몇 명이 필요할까요?',en:"How big a team can beat Triceratops?"},
  act:{rail:{ko:'아래 손잡이를 오른쪽으로 끌어 아이를 늘려요',en:"Drag below right to add children."},play:{ko:'삼각형 버튼을 눌러 공룡을 이겨 보세요',en:"Press play to beat the dinosaur."}},
  right:{ko:'아이들이 이겼어요. 다음 실험을 기다려요',en:"The children won. Wait for next."},wrong:{ko:'예상과 달라도 괜찮아요. 다음 실험을 기다려요',en:"A wrong guess is OK. Wait for next."}},
 {ask:{ko:'티라노를 이기려면 아이 몇 명이 필요할까요?',en:"How big a team can beat T. rex?"},
  act:{rail:{ko:'아래 손잡이를 오른쪽으로 끌어 아이를 늘려요',en:"Drag below right to add children."},play:{ko:'삼각형 버튼을 눌러 티라노를 이겨 보세요',en:"Press play to beat T. rex."}},
  right:{ko:'티라노를 이겼어요. 다음 실험을 기다려요',en:"You beat T. rex. Wait for next."},wrong:{ko:'예상과 달라도 괜찮아요. 다음 실험을 기다려요',en:"A wrong guess is OK. Wait for next."}},
 {ask:{ko:'바닥을 유리로 바꾸면 누가 이길까요?',en:"Who wins on glass?"},
  act:{play:{ko:'삼각형 버튼으로 자갈 위에서 당겨 보세요',en:"Press play to pull on gravel."},ground:{ko:'빗금 바닥 그림을 눌러 유리로 바꿔요',en:"Tap striped ground for glass."},ready:{ko:'삼각형 버튼으로 유리 위에서 당겨 보세요',en:"Press play to pull on glass."}},
  right:{ko:'유리에서는 공룡이 이겨요. 다음을 기다려요',en:"The dinosaur wins on glass. Wait."},wrong:{ko:'예상과 달리 공룡이 이겨요. 다음을 기다려요',en:"The dinosaur wins instead. Wait."}},
 {ask:{ko:'유리 위에서 아이를 늘리면 힘도 커질까요?',en:"Do more children add force on glass?"},
  act:{play:{ko:'삼각형 버튼으로 먼저 줄을 당겨 보세요',en:"Press play to pull first."},rail:{ko:'아래 손잡이를 끌어 아이를 열 명 더 늘려요',en:"Drag to add ten more children."},ready:{ko:'삼각형 버튼을 눌러 다시 당겨 보세요',en:"Press play to pull again."}},
  right:{ko:'아이를 늘리니 힘도 커져요. 다음을 기다려요',en:"More children add force. Wait."},wrong:{ko:'예상과 달리 힘도 커져요. 다음을 기다려요',en:"Force grew instead. Wait for next."}},
 {ask:{ko:'큰 공룡은 몸무게에 비해 힘도 셀까요?',en:"Big dinosaurs: strong for weight?"},
  act:{species:{ko:'맨 앞 공룡과 긴 목 공룡 그림을 찾아 눌러요',en:"Tap the first and long-neck dinosaurs."},page:{ko:'오른쪽 화살표로 긴 목 공룡 그림을 찾아요',en:"Right arrow: find the long neck."},long:{ko:'긴 목 공룡 그림을 눌러 보세요',en:"Tap the long-neck dinosaur."},compare:{ko:'막대 두 개 그림을 눌러 힘을 비교해요',en:"Tap two bars to compare forces."}},
  right:{ko:'큰 공룡은 몸무게에 비해 힘이 작아요. 다음을 기다려요',en:"Big ones: less force for their weight. Wait."},wrong:{ko:'예상과 달리 힘의 비율이 작아요. 다음을 기다려요',en:"Less force for their weight. Wait for next."}},
 {ask:{ko:'아이 서른 명이 이길 가장 큰 공룡은 뭘까요?',en:"Biggest dinosaur thirty children beat?"},
  act:{species:{ko:'공룡 그림을 눌러 이길 가장 큰 공룡을 골라요',en:"Tap the biggest dinosaur you can beat."},play:{ko:'삼각형 버튼을 눌러 승부를 확인해요',en:"Tap play to see who wins."}},
  right:{ko:'딜로포사우루스까지 이겨요. 더하기를 눌러요',en:"You beat Dilophosaurus. Tap plus."},wrong:{ko:'딜로포사우루스까지 이겨요. 더하기를 눌러요',en:"You beat Dilophosaurus. Tap plus."}},
 {ask:{ko:'두 팀이 똑같이 당기면 어떻게 될까요?',en:"What if both teams pull equally?"},
  act:{play:{ko:'삼각형 버튼을 눌러 줄을 당겨 보세요',en:"Press play to pull the rope."}},
  right:{ko:'깃발이 가운데 멈췄어요. 두 힘이 같아요',en:"Flag centered. Equal forces."},wrong:{ko:'깃발이 가운데 멈췄어요. 두 힘이 같았어요',en:"Flag centered. Forces were equal."}},
 {ask:{ko:'한 팀에 한 명만 더 오면 어떻게 될까요?',en:"What if a child joins a team?"},
  act:{rail:{ko:'손잡이로 한 팀을 한 명 늘려 보세요',en:"Use the handle to add a child."},play:{ko:'이제 당기기를 눌러 보세요',en:"Now tap play to pull."}},
  right:{ko:'많은 쪽으로 깃발이 움직였어요',en:"Flag went to more kids."},wrong:{ko:'한 명만 더 많아도 그쪽으로 움직여요',en:"An extra child moved the flag."}},
 {ask:{ko:'줄 가운데 저울은 몇을 가리킬까요?',en:"Middle gauge: what reading?"},
  act:{play:{ko:'당기기를 눌러 저울을 보세요',en:"Tap play. Watch gauge."},rail:{ko:'한 팀을 한 명 늘려 다시 당겨 보세요',en:"Add a child and pull again."}},
  right:{ko:'저울이 한 팀 힘만큼 가리켜요',en:"It reads a team's force."},wrong:{ko:'저울이 한 팀 힘만큼 가리켰어요',en:"It read a team's force."}}
,
 {ask:{ko:'힘의 합이 0이 아닌 물체는 무엇일까요?',en:"Which object has a net force?"},
  act:{play:{ko:'당기기를 눌러 승부를 보세요',en:"Tap play. See who wins."},lens:{ko:'줄, 왼쪽 팀, 오른쪽 팀을 차례로 눌러 보세요',en:"Tap rope, left team, then right team."}},
  right:{ko:'진 팀만 힘의 합이 0이 아니에요',en:"Only losers have net force."},wrong:{ko:'진 팀만 힘의 합이 0이 아니었어요',en:"Only losers had a net force."}}
,
 {ask:{ko:'마찰은 처음부터 가장 크게 버틸까요?',en:"Is friction greatest at first?"},
  act:{pull:{ko:'손잡이를 천천히 올려 보세요',en:"Raise the handle slowly."},slip:{ko:'계속 올려서 미끄러지는 순간을 보세요',en:"Raise more. Watch for slipping."}},
  right:{ko:'마찰은 당기는 힘과 같다가 한계에서 미끄러졌어요',en:"Friction matched pull; slip past limit."},wrong:{ko:'마찰은 당기는 힘과 같다가 한계에서 미끄러졌어요',en:"Friction matched pull; slip past limit."}}
].map(row=>({pick:{ko:'그림 중 하나를 눌러 예상해 보세요',en:"Tap a picture to predict."},running:{ko:'승부를 보고 결과 그림을 기다려요',en:"Watch. Wait for the result."},watch:{ko:'목표를 이뤘어요. 결과 그림을 기다려요',en:"Goal met. Wait for the result."},free:{ko:'마음대로 만져 보세요',en:"Explore freely."},...row}));

function missionText(questIndex, phase, ctx={}) {
 if(!Number.isInteger(questIndex)||!MISSION[questIndex]||!PHASES.includes(phase))throw new RangeError('mission');
 const row=MISSION[questIndex],say=text;
 if(ctx.free)return say(row.free);
 if(phase==='intro')return say(row.ask);
 if(phase==='predict')return say(row.pick||row.ask);
 if(phase==='observe')return say(row.watch);
 if(ctx.pending)return say(row.running);
 if(phase==='confirm'||phase==='card')return say(row[ctx.right===false?'wrong':'right']);
 let focus=ctx.focus;
 if(questIndex===3&&ctx.observations?.length&&ctx.mu===PHYS.GROUNDS['유리'])focus='ready';
 if(questIndex===4&&ctx.before&&ctx.n-ctx.before.n>=PHYS.C.increaseQ5)focus='ready';
 if(questIndex===5&&focus==='species'&&ctx.visited?.includes(SPECIES_KEYS[0])&&!ctx.visited.includes(SPECIES_KEYS[5]))focus=ctx.toolGroup==='species'&&ctx.toolPage===0?'page':'long';
 return say(row.act[focus]||Object.values(row.act)[0]);
}
