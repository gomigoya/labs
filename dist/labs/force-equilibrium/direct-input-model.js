// Gesture lengths are interface scales, not measurements of a pupil's physical force.
export const DIRECT_LABELS={
 ko:{predictionFirst:'먼저 예상 적기 ↓',observeReady:'놓고 관찰하기',tapObserve:'준비된 물체를 눌러 관찰하세요. 값을 바꾸려면 물체를 끌어 보세요.','force-vector':'둘째 힘 끝 옮기기',grab:'잡고 끌기',drop:'이곳에 놓기',release:'놓으면 관찰',cancel:'조작 취소',keyboard:'Space로 잡기 · 방향키로 옮기기 · Enter로 놓기 · Esc 취소',fallback:'숫자·버튼으로 조작',observed:'직접 조작한 조건으로 관찰합니다.',need:'준비 조건을 먼저 확인하세요.',object:'물체',zero:'빈 기구 0 맞추기',level:'수평 맞추기',power:'저울 전원',baseline:'처음 위치 표시',bag:'빈 봉투 걸기',eye:'눈높이 맞추기',load:'추를 끌어 놓기',remove:'물체 빼기',cart:'수레 밀기·당기기',draw:'수레에서 힘 화살표 그리기',lift:'잡고 들어 올리기',pull:'끝을 잡고 당기기',lower:'추를 물속으로 내리기',move:'물체 위치 바꾸기',press:'잡고 눌러 보기',tilt:'기울였다 놓기',observe:'기구를 움직여 관찰',left:'힘 화살표 끝',right:'힘 화살표 끝'},
 en:{predictionFirst:'Predict first ↓',observeReady:'Release and observe',tapObserve:'Select the object to observe the prepared conditions. Drag the object to explore other values.','force-vector':'Move second-force endpoint',grab:'Grab and drag',drop:'Drop here',release:'Release to observe',cancel:'Gesture cancelled',keyboard:'Space to grab · arrows to move · Enter to release · Esc to cancel',fallback:'Use values and buttons',observed:'Observing your manipulated conditions.',need:'Complete the preparation first.',object:'Object',zero:'Zero empty instrument',level:'Level instrument',power:'Scale power',baseline:'Mark initial position',bag:'Attach empty bag',eye:'Align eye level',load:'Drag a weight into place',remove:'Remove the load',cart:'Push or pull the cart',draw:'Draw a force from the cart',lift:'Grab and lift',pull:'Grab and pull the end',lower:'Lower the weight into water',move:'Move the object',press:'Grab and press',tilt:'Tilt and release',observe:'Manipulate the apparatus',left:'Force arrow tip',right:'Force arrow tip'}
};
const H={
 cart:['수레 몸통을 잡고 끌어 놓으세요. 더 멀리 끌면 미는 힘이 커집니다.','Grab the cart body, drag and release. A longer drag applies a stronger push.'],
 balance:['추를 끌어 수평대의 칸에 놓으세요. 놓인 추도 옮길 수 있습니다.','Drag weights onto numbered positions; move placed weights too.'],
 scale:['왼쪽 물체를 저울 접시로 끌어 놓으세요.','Drag a sample from the left onto the scale pan.'],
 'spring-scale':['물체를 고리에 끌어 놓고, 눈 표시를 눈금 높이에 맞추세요.','Drag a sample to the hook; align the eye with the pointer.'],
 spring:['용수철 끝을 잡아 아래로 당기세요.','Grab the spring end and pull down.'],
 tank:['매단 추를 잡아 물속으로 천천히 내리세요.','Grab the suspended weights and lower them into the water.'],
 overflow:['추를 물속으로 내리고 넘친 물의 양을 보세요.','Lower the weight and watch the displaced water.'],
 mobile:['장식을 추가하거나 매단 위치를 옮겨 균형을 맞추세요.','Add ornaments or move their suspension points to balance.'],
 'beam-counts':['추를 끌어 추가하고, 매단 추를 칸을 따라 옮기세요.','Drag in additional weights; slide suspended weights along the divisions.'],
 stability:['물체 윗부분을 잡고 기울인 뒤 놓으세요.','Grab the top of the object, tilt it, then release.'],
 turning:['스패너의 표시된 곳을 잡고 힘을 주는 방향으로 끄세요.','Drag the marked point on the wrench in the force direction.'],
 direct:['추를 잡아 위쪽 표시선까지 들어 올리세요.','Lift the weight to the upper marker.'],
 'lever-lift':['지레의 왼쪽 끝을 아래로 눌러 추를 올리세요.','Press the left lever end down to lift the weight.'],
 ramp:['수레를 잡고 빗면 위쪽으로 끌어 올리세요.','Grab the cart and pull it up the ramp.'],
 globe:['노란 물체를 지구 둘레로 옮겨 중력 화살표를 보세요.','Move the yellow object around Earth and watch the gravity arrow.'],
 deform:['물체의 표시를 화살표 쪽으로 움직인 뒤 놓으세요. 원래 모양으로 돌아오는지 보세요.','Move the marked part along the arrow, then release and watch the shape restore.'],
 ball:['공을 잡고 끌어 놓아 움직임을 관찰하세요.','Grab and drag the ball, then release to observe its motion.'],
 'motion-classify':['공의 표시를 끌고 놓아 같은 시간 점을 관찰하세요.','Drag and release the ball marker to observe equal-time dots.'],
 friction:['나무도막 옆 표시를 오른쪽으로 끌고 놓으세요. 움직이기 시작하는 힘을 보세요.','Pull the marker beside the block right and release. Observe the force needed to start motion.'],
 design:['썰매를 잡고 오른쪽으로 끌어 놓으세요. 목표선까지 가는지 보세요.','Drag the sled right and release; compare its travel with the target.'],
 assist:['손의 표시를 잡아 위로 올려 보세요.','Grab the hand marker and lift it upward.'],
 shelf:['선반 위 추를 좌우로 옮기고 두 받치는 힘을 비교하세요.','Slide the shelf load left or right and compare the two supporting forces.'],
 inference:['수평대 가운데 표시를 누르고 두 장면의 높이와 거리를 비교하세요.','Select the centre beam marker and compare heights and distances in both scenes.'],
 couple:['휴대전화 왼쪽 힘 표시를 위로 끌어 두 힘의 작용선을 어긋나게 하세요.','Drag the left force marker up to separate the lines of action.'],
 support:['가방 표시를 좌우로 끌어 손과 바닥이 받치는 모습을 비교하세요.','Drag the bag marker left or right to compare hand and floor support.'],
 examples:['표시된 도구를 화살표 방향으로 움직여 작동시켜 보세요.','Move the marked tool along the guide arrow to operate it.'],
 floating:['장치의 표시를 화살표 방향으로 끌어 크기나 물·추의 양을 바꾸세요.','Drag the device marker along the arrow to change volume, ballast or payload.']
};
export function directHint(id,rig,lang='ko',context={}){
 if(id==='vectors')return lang==='en'?'Drag the second-force marker to change both direction and length. Release to observe.':'둘째 힘 표시를 끌어 방향과 길이를 바꾸세요. 놓으면 수레의 움직임을 관찰합니다.';
 if(id==='gravity')return lang==='en'?'Pull and release the hanging weight. Compare readings on Earth and Moon.':'매단 추를 당겼다 놓고 지구와 달에서의 눈금을 비교하세요.';
 if(rig==='tank'&&context.frame?.inputs?.volume===0)return lang==='en'?'Lift the suspended weight slightly and read the value in air.':'매단 추를 조금 위로 끌고 놓아 물 밖의 값을 읽으세요.';
 if(rig==='balance'&&context.frame?.id==='empty')return lang==='en'?'Compare both ends of the empty beam, then select its centre marker.':'빈 판의 양쪽 높이를 보고 판을 눌러 관찰하세요.';
 if(rig==='spring-scale'&&context.frame?.empty)return lang==='en'?'Drag the hanging load away from the hook. Watch the pointer return.':'매단 물체를 고리 밖으로 끌어 빼고 표시자가 올라가는지 보세요.';
 if(rig==='spring-scale'&&context.frame?.requiresBag&&!context.bag)return lang==='en'?'Drag the empty bag to the hook, then zero the scale.':'빈 봉투를 고리로 끌어 건 뒤 0을 맞추세요.';
 if(id==='represent')return lang==='en'?'Drag from the cart in the force direction. Match the arrow length.':'수레에서 힘 방향으로 끌어 화살표를 그리세요. 길이를 맞추세요.';
 const h=H[rig];return h?h[lang==='en'?1:0]:lang==='en'?'Grab the marked part and drag it along the guide arrow. Release to observe.':'표시된 부분을 잡고 안내 화살표를 따라 움직이세요. 놓으면 관찰합니다.';
}
export function quantize(control,value,target){
 const values=control.options?.map(([v])=>v),step=control.step||Math.min(...(values||[]).filter(v=>typeof v==='number').slice(1).map((v,i)=>Math.abs(v-values[i])));
 if(Number.isFinite(target)&&Number.isFinite(step)&&Math.abs(value-target)<=step*.6&&(values?values.includes(target):target>=control.min&&target<=control.max&&Math.abs((target-control.min)/step-Math.round((target-control.min)/step))<1e-8))return target;
 if(control.options){if(control.options.some(([v])=>v===value))return value;const options=control.options.map(([v])=>v);if(options.every(v=>typeof v==='number'))return options.reduce((a,b)=>Math.abs(b-value)<Math.abs(a-value)?b:a);return options[0];}
 return Number(Math.max(control.min,Math.min(control.max,control.min+Math.round((value-control.min)/control.step)*control.step)).toFixed(8));
}
export function shiftedChoice(control,current,steps){const values=control.options.map(([v])=>v);return values[Math.max(0,Math.min(values.length-1,values.indexOf(current)+steps))];}
export function gestureValue(spec,control,inputs,start,end,target){
 const delta=(end[spec.axis||'x']-start[spec.axis||'x'])*(spec.sign??1);
 if(spec.kind==='choice')return shiftedChoice(control,inputs[spec.key],Math.round(delta/(spec.unit||.65)));
 if(spec.absolute){const value=(end[spec.axis||'x']-spec.origin)*(spec.sign??1)/(spec.unit||1);return quantize(control,value,target);}
 if(spec.fromZero)return quantize(control,delta/(spec.unit||1),target);
 return quantize(control,inputs[spec.key]+delta/(spec.unit||1),target);
}
export function forceGesture(id,controls,inputs,dx,dz=0,unit=.62,goal={}){
 const direction=dx<0?-1:1,key=id==='represent'?'magnitude':id==='curling'||id==='push'?'force':id==='vectors'?'f1':'right',control=controls.find(c=>c.key===key),amount=quantize(control,Math.abs(dx)/unit,goal[key]);
 const changes={[key]:amount};if(['curling','push','represent'].includes(id))changes.direction=direction;return changes;
}
export function withinDrop(point,target,radius=.8){return Math.hypot(point.x-target.x,point.y-target.y,point.z-target.z)<radius;}
export function validInteraction(value){return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===3&&['pointer','keyboard'].includes(value.method)&&typeof value.target==='string'&&value.target.length>0&&value.target.length<=80&&typeof value.action==='string'&&value.action.length>0&&value.action.length<=40;}
export function vectorGesture(magnitudeControl,angleControl,x,z,unit=.3,goal={}){return {magnitude:quantize(magnitudeControl,Math.hypot(x,z)/unit,goal.magnitude),angle:quantize(angleControl,(Math.atan2(-z,x)*180/Math.PI+360)%360,goal.angle)};}
// The scene supplies placements and angles; pointer distances use CSS pixels so
// camera perspective cannot turn a small hand movement into several divisions.
export function pointerChanges({id,rig,target,controls,inputs,goal={}},dx,dy,changes){
 if(target==='draw'||target==='cart')return forceGesture(id,controls,inputs,dx,0,32,goal);
 if(target==='force-vector'){
  const a=inputs.angle*Math.PI/180,v=vectorGesture(controls.find(c=>c.key==='f2'),controls.find(c=>c.key==='angle'),inputs.f2*32*Math.cos(a)+dx,-inputs.f2*32*Math.sin(a)+dy,32,{magnitude:goal.f2,angle:goal.angle});return {f2:v.magnitude,angle:v.angle};
 }
 const c=controls.find(c=>c.key===target);if(!c||!Object.hasOwn(changes,target)||rig==='globe')return changes;
 const vertical=rig==='spring'||rig==='tank'||rig==='overflow'||target==='eye'||['clips','fill','line','tilt','height'].includes(target)||rig==='incline'&&target==='angle'||['beam','turning'].includes(rig)&&['effort','angle'].includes(target)||rig==='deform'&&inputs.body==='rubber';
 const sign=target==='leftPos'||target==='arm'||target==='line'||target==='height'||rig==='incline'&&target==='angle'?-1:1,delta=(vertical?dy:dx)*sign;
 if(c.options)return {...changes,[target]:shiftedChoice(c,inputs[target],Math.round(delta/32))};
 return {...changes,[target]:gestureValue({key:target,axis:'x',unit:32/c.step},c,inputs,{x:0},{x:delta},goal[target])};
}
export function loadIsOutside(point,floor=-1.4){return Math.abs(point.x)>2.6||point.y<floor;}
// A guide names an input condition, never changes it. Only pointer/keyboard input does.
export function guidePoint(spec,control,inputs,goal,start,forceUnit=.62,{unknown=false}={}){
 const end={...start},axis=spec.axis||'x',sign=spec.sign??1,target=goal[spec.key]??inputs[spec.key];
 if(spec.kind==='progress'){end[axis]+=spec.travel;if(spec.guideRise)end.y+=spec.guideRise;return end;}
 if(spec.kind==='push'||spec.kind==='draw'){const key=spec.kind==='draw'?'magnitude':Object.hasOwn(inputs,'force')?'force':Object.hasOwn(inputs,'f1')?'f1':'right';end.x+=(goal[key]??inputs[key])*forceUnit*(goal.direction??inputs.direction??1);return end;}
 if(spec.kind==='vector'){const a=(goal[spec.angleKey]??inputs[spec.angleKey])*Math.PI/180;end.x=target*spec.unit*Math.cos(a);end.z=-target*spec.unit*Math.sin(a);}
 else if(spec.kind==='parallel-vector')end.x=target*spec.unit*((goal[spec.directionKey]??inputs[spec.directionKey])==='same'?1:-1);
 else if(spec.kind==='orbit'){const a=target*Math.PI/180,r=Math.hypot(start.x,start.y-1.6);end.x=r*Math.cos(a);end.y=1.6+r*Math.sin(a);}
 else if(control){let difference=control.options?control.options.findIndex(([v])=>v===target)-control.options.findIndex(([v])=>v===inputs[spec.key]):target-inputs[spec.key];if(unknown&&difference)difference=Math.sign(difference)*(control.options?1:control.step);if(spec.kind==='choice')end[axis]+=difference*(spec.unit||.65)/sign;else if(spec.absolute&&!unknown)end[axis]=spec.origin+target*(spec.unit||1)/sign;else end[axis]+=(spec.fromZero?target:difference)*(spec.unit||1)/sign;}
 else end[axis]+=(spec.sign??1)*.35;
 if(Math.hypot(end.x-start.x,end.y-start.y,end.z-start.z)<.025){const lower=control?.options?control.options[0][0]:control?.min;if(control&&target===lower&&!spec.absolute)end[axis]-=.35/sign;else{const unit=control?.step?(control.step*(spec.unit||1)):.4;end[axis]+=(spec.guideTravel?Math.sign(spec.guideTravel):sign)*Math.min(.1,unit*.3);}}
 return end;
}

// Decorative only: zero at entry/settling, never an input to the solver.
export function hoverMotion(elapsed,{reduced=false,dragging=false}={}){
 if(reduced||dragging||!Number.isFinite(elapsed)||elapsed<=0||elapsed>=.72)return {roll:0,lift:0};
 const t=elapsed/.72,envelope=Math.sin(Math.PI*t)**2;
 return {roll:Math.sin(t*Math.PI*4)*envelope*.022,lift:envelope*.015};
}

// Specific parts stay clickable above a larger apparatus. Primary breaks ties.
export function hitPriority(width,height,primary=false){return Math.max(1,Math.round(200000/Math.max(1,width*height)))*2+(primary?1:0);}
