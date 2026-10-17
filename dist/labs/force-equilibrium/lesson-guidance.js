import {text,WORDS} from './curriculum-model.js';
const H={
 curling:['수레가 목표선 앞에 오는지, 지나가는지 보세요.','Watch whether the cart reaches or passes the target.'],
 push:['같은 세기로 밀었을 때 움직인 거리와 짐의 모양을 비교하세요.','Compare travel and load shape with the same push.'],
 balance:['양쪽 끝의 높이와 물체가 놓인 칸을 함께 보세요.','Compare end heights and positions together.'],
 scale:['전자저울의 숫자를 읽고 네 물체의 순서를 비교하세요.','Read the display and order the four objects.'],
 'spring-scale':['표시자가 멈춘 눈금을 눈높이에서 읽으세요.','Read the settled pointer at eye level.'],
 tools:['같은 추의 올라간 높이와 필요한 힘 눈금을 비교하세요.','Compare the same weight’s rise and effort indicator.'],
 'ramp-tools':['같은 추가 같은 높이만큼 올라가는지 보세요.','Check that the same weight rises by the same amount.'],
 'daily-tools':['받침점, 물체, 사람이 힘을 주는 곳을 찾으세요.','Find the pivot, load and effort location.'],
 mobile:['기울어진 쪽과 수정 뒤 양쪽 높이를 비교하세요.','Compare the lower side before and after your change.'],
 wearable:['팔과 보조 장치가 같은 짐을 함께 드는 모습을 보세요.','Watch the arm and brace lift the same load.'],
 review:['두 수평대에서 내려간 쪽과 중심까지의 거리를 연결하세요.','Combine the lower side and distances in both balances.'],
 'diver-intro':['공기 주머니와 잠수부의 위·아래 움직임을 보세요.','Watch the air bag and the diver’s vertical motion.'],
 represent:['시작점은 수레 안, 끝은 힘 방향, 길이는 힘 크기입니다.','Put the origin on the cart, point in the force direction and match the length.'],
 parallel:['두 힘의 방향·길이와 수레의 움직임을 함께 보세요.','Compare both arrows with the cart’s motion.'],
 'gravity-direction':['물체의 위치가 달라도 화살표가 향하는 곳을 보세요.','Watch where gravity points from each location.'],
 gravity:['같은 물체의 kg 값과 N 값을 따로 비교하세요.','Compare kg and N readings separately for the same object.'],
 'elastic-shape':['눌렀거나 늘린 같은 물체가 어느 쪽으로 돌아오는지 보세요.','Watch the same deformed object restore its shape.'],
 elastic:['처음 표시부터 끝점까지의 길이와 힘 센서 값을 읽으세요.','Read extension from the initial mark and the force sensor.'],
 friction:['나무도막이 막 움직일 때의 당기는 힘을 비교하세요.','Compare the pull at the instant the block starts moving.'],
 buoyancy:['잠긴 추 개수와 물 밖보다 줄어든 저울 값을 보세요.','Compare submerged weights with the decrease from the air reading.'],
 overflow:['추의 잠긴 부분과 받은 물의 양·무게를 함께 보세요.','Compare submerged portion with collected water and its weight.'],
 motion:['같은 시간 점의 간격과 공의 이동 방향을 보세요.','Watch equal-time spacing and the ball’s direction.'],
 'motion-classify':['점 사이 간격은 빠르기, 점이 이어지는 방향은 이동 방향입니다.','Spacing indicates speed; the path indicates direction.'],
 contact:['가방은 멈춰 있어도 아래 힘과 위 힘이 작용합니다.','The stationary bag has downward and upward forces.'],
 applications:['장치의 어떤 부분에 어떤 힘이 작용하는지 찾으세요.','Identify the part receiving each force.'],
 design:['출발점에서 목표선까지와 수정 뒤 이동 거리를 비교하세요.','Compare travel with the target before and after revision.'],
 floating:['공기 속 풍선과 물속 장치에서 바뀌는 양을 구별하세요.','Distinguish the changed variable in air and water.'],
 'review-middle':['위로 미는 힘과 아래로 당기는 힘의 크기를 비교하세요.','Compare upward and downward force magnitudes.'],
 turning:['힘 화살표의 길이·주는 곳·각도와 회전을 비교하세요.','Compare force length, location, angle and turning effect.'],
 'lever-counts':['추를 직접 조절해 수평을 찾고 개수와 칸을 기록하세요.','Adjust weights to find balance; record counts and positions.'],
 torque:['반력까지 합한 힘과 돌림힘을 따로 확인하세요.','Check force including support separately from torque.'],
 couple:['수레처럼 이동하는지와 제자리에서 회전하는지를 구별하세요.','Distinguish translation from rotation in place.'],
 stability:['놓기 전 중심의 수직선이 받침 안인지 밖인지 보세요.','Before release, locate the centre projection relative to the base.'],
 shelf:['짐 위치를 바꿀 때 두 받치는 힘이 어떻게 나뉘는지 보세요.','Watch how the two supports share the load as its location changes.'],
 'review-high':['짐과 균형추의 거리, 수평 여부를 함께 확인하세요.','Compare load distances and beam balance.'],
 vectors:['두 힘의 합성 방향과 수레의 이동 방향을 비교하세요.','Compare resultant direction with cart motion.'],
 incline:['빗면 아래쪽 힘을 줄과 마찰이 얼마나 나누어 버티는지 보세요.','Compare tension and friction resisting the downslope force.']
};
export function observeHint(id,lang){return text(H[id],lang);}
export function manipulationKeys(id,frame,inputs){
 const first={curling:['force'],push:['mass','force'],balance:['left','right'],scale:['object'],'spring-scale':['object','eye'],tools:['tool'],'ramp-tools':['tool'],'daily-tools':['example'],mobile:['left','leftPos'],wearable:['method'],review:['example'],'diver-intro':['volume'],represent:['magnitude','direction'],parallel:['arrangement','left'],'gravity-direction':['position'],gravity:['planet'],'elastic-shape':['body','shape'],elastic:['extension'],friction:['surface'],buoyancy:['volume'],overflow:['volume'],motion:['initial','mode'],'motion-classify':['mode'],contact:['contact'],applications:['example'],design:['device','surface'],floating:['case','clips'],'review-middle':['volume'],turning:['reach','effort'],'lever-counts':['rightCount'],torque:inputs.mode==='beam'?['effort','arm']:['left','right'],couple:['line'],stability:['tilt'],shelf:['position'],'review-high':['rightPos'],vectors:['f1','f2'],incline:['angle','mu']};
 return frame.variable.length?frame.variable:first[id]||[];
}
export function guidedStart(lesson,index,defaults){
 const f=lesson.frames[index];if(f.startInputs)return {...defaults,...f.startInputs};
 const previous=index?{...defaults,...lesson.frames[index-1].inputs}:defaults,start={...defaults,...f.inputs};
 for(const key of f.variable)if(Object.hasOwn(previous,key))start[key]=previous[key];
 if(start.objectType&&start.objectType!=='cart')start.mass=start.objectType==='box'?1:4;
 return start;
}
export function controlText(c,value,lang){return c.options?text(WORDS[c.options.find(([v])=>v===value)?.[1]]||String(value),lang):String(value)+(c.unit?' '+c.unit:'');}
