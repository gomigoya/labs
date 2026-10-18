// Names describe the apparatus currently rendered, including condition changes.
const KITS={
 cart:['수레 · 레일','Cart · track'],
 balance:['수평대 · 네모 추','Numbered beam · block weights'],
 scale:['전자저울 · 비교할 물체','Digital scale · sample objects'],
 'spring-scale':['용수철저울 · 물체 · 봉투','Spring scale · objects · bag'],
 spring:['용수철 · 스탠드 · 추','Spring · stand · weights'],
 direct:['물체 · 들어 올리는 줄','Load · lifting cord'],
 'lever-lift':['지레 · 받침점 · 물체','Lever · pivot · load'],
 ramp:['빗면 · 물체 · 당기는 줄','Ramp · load · pulling cord'],
 mobile:['모빌 막대 · 줄 · 장식 추','Mobile rods · strings · ornaments'],
 assist:['보조 장치 · 물체','Assistive device · load'],
 inference:['수평대 · 비교할 물체','Balance beams · objects'],
 globe:['지구 모형 · 물체','Globe · object'],
 friction:['나무토막 · 표면판 · 추','Wooden block · surface · weights'],
 tank:['수조 · 추 · 힘 센서','Water tank · weights · force sensor'],
 overflow:['넘침 수조 · 추 · 컵 · 저울','Overflow tank · weight · cup · scale'],
 ball:['공 · 선풍기','Ball · fan'],
 'motion-classify':['공 · 이동 경로','Ball · motion path'],
 turning:['스패너 · 회전축','Spanner · pivot'],
 'beam-counts':['수평 막대 · 받침점 · 추','Beam · pivot · weights'],
 beam:['수평 막대 · 받침점 · 추','Beam · pivot · weights'],
 couple:['휴대전화 모형','Phone model'],
 stability:['받침대 · 블록','Support base · block'],
 shelf:['선반 · 지지 줄 · 짐','Shelf · support rope · load'],
 crane:['기중기 모형 · 짐','Crane model · load'],
 incline:['빗면 · 물체 · 지지 줄','Inclined plane · load · support rope']
};
export function apparatusFor(activity,inputs,result,lang='ko'){
 let names=KITS[result.rig];
 if(result.rig==='cart'&&activity.id==='push')names=inputs.objectType==='box'?['수레 · 큰 빈 상자','Cart · large empty box']:inputs.objectType==='metal'?['수레 · 작은 금속 덩어리','Cart · small metal block']:['수레 · 짐 · 레일','Cart · cargo · track'];
 if(result.rig==='spring'&&activity.id==='gravity')names=['용수철 · 스탠드 · 물체','Spring · stand · object'];
 if(result.rig==='spring'&&inputs.springMode==='stretch')names=['용수철 · 스탠드','Spring · stand'];
 if(result.rig==='deform')names=inputs.body==='spring'?['용수철','Spring']:['고무공','Rubber ball'];
 if(result.rig==='support')names=inputs.contact==='hand'?['가방 · 받치는 손','Bag · supporting hand']:['가방 · 받침판','Bag · support surface'];
 if(result.rig==='floating')names=inputs.case==='balloon'?['풍선 · 클립','Balloon · clips']:inputs.case==='submarine'?['잠수함 모형 · 수조','Submarine model · water tank']:['잠수부 모형 · 공기주머니 · 수조','Diver model · air pocket · water tank'];
 if(result.rig==='design')names=inputs.device==='bumper'?['수레 · 탄성 완충 장치','Cart · elastic bumper']:['수레 · 마찰 브레이크','Cart · friction brake'];
 if(result.rig==='examples')names=({bottle:['병따개 · 병','Bottle opener · bottle'],stairs:['빗면 · 상자','Ramp · box'],forklift:['경사로 · 짐','Loading ramp · cargo'],spring:['용수철 장난감','Spring toy'],balloon:['풍선','Balloon']})[inputs.example];
 return names?.[lang==='en'?1:0]||'';
}
