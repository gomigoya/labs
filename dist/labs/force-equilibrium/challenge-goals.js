import {curlingTarget} from './teaching-geometry.js';

// Distances in the model are metres; the house is drawn at .35 scene units/metre.
export const CURLING_HOUSE_RADIUS=.45;
const value=(t,key)=>t.result?.metrics.find(m=>m.key===key)?.value;
const near=(a,b,tolerance=.02)=>Number.isFinite(a)&&Math.abs(a-b)<=tolerance;
const outcome=(t,key)=>t.result?.outcome===key;
const level=t=>['balanced','level'].includes(t.result?.outcome);
const goal=(id,ko,en,met)=>Object.freeze({id,ko,en,met});
export const GOALS=Object.freeze([
 goal('curling','컬링 스톤을 하우스 안에 멈추기','Stop the stone inside the house',t=>t.inputs.direction===1&&t.result?.stopped!==false&&near(value(t,'displacement')*.35,curlingTarget(),CURLING_HOUSE_RADIUS)),
 goal('push','왼쪽으로 밀어 1 m 이상 이동하기','Push left and travel at least 1 m',t=>t.inputs.direction===-1&&value(t,'displacement')>=1),
 goal('balance','양쪽 거리를 다르게 하여 수평 맞추기','Level the beam with unequal arm lengths',t=>t.inputs.left>0&&t.inputs.right>0&&t.inputs.leftPos!==t.inputs.rightPos&&level(t)),
 goal('scale','전자저울로 14 g 읽기','Read 14 g on the digital scale',t=>outcome(t,'reading')&&near(value(t,'reading'),14,.5)),
 goal('spring-scale','눈높이를 맞춰 175 g 읽기','Read 175 g at eye level',t=>t.inputs.eye===1&&outcome(t,'reading')&&near(value(t,'reading'),175,2.5)),
 goal('tools','지레로 필요한 힘을 ¼ 이하로 줄이기','Use a lever to reduce effort to ¼ or less',t=>t.inputs.tool==='lever'&&value(t,'withTool')<=value(t,'direct')/4),
 goal('ramp-tools','빗면으로 필요한 힘을 ¼ 이하로 줄이기','Use a ramp to reduce effort to ¼ or less',t=>t.inputs.tool==='ramp'&&value(t,'withTool')<=value(t,'direct')/4),
 goal('daily-tools','계단에서 빗면 도구 관찰하기','Observe stairs as a ramp',t=>t.inputs.example==='stairs'&&outcome(t,'sample')),
 goal('mobile','모빌을 수평으로 맞추기','Make the mobile level',t=>outcome(t,'balanced')),
 goal('wearable','보조 장치로 필요한 힘을 절반 이하로 줄이기','Use assistance to halve the effort',t=>t.inputs.method==='robot'&&value(t,'forceComparison')<=t.inputs.mass/2),
 goal('review','두 수평대를 함께 비교하기','Compare both balances together',t=>t.inputs.example==='forklift'&&value(t,'comparisons')===2),
 goal('diver-intro','잠수부를 물속에 띄우기 · 알짜힘 0','Make the diver hover · net force 0',t=>t.inputs.case==='diver'&&t.inputs.volume===100&&outcome(t,'still')&&near(value(t,'net'),0,1e-8)),
 goal('represent','왼쪽으로 작용하는 3 N 나타내기','Represent a 3 N force to the left',t=>t.inputs.direction===-1&&near(value(t,'force'),3)),
 goal('parallel','정지한 수레에 두 힘을 평형으로 맞추기','Balance two forces on a resting cart',t=>t.inputs.initial===0&&t.inputs.left>0&&t.inputs.right>0&&outcome(t,'still')&&near(value(t,'net'),0)),
 goal('gravity-direction','지구 오른쪽에서 중심으로 떨어뜨리기','Release toward the centre from the right of Earth',t=>t.inputs.position===0&&outcome(t,'toCenter')),
 goal('gravity','달에서 1 kg의 무게 1.62 N 측정하기','Measure a 1 kg mass weighing 1.62 N on the Moon',t=>t.inputs.planet==='moon'&&t.inputs.mass===1&&near(value(t,'weight'),1.62,.06)),
 goal('elastic-shape','변형한 용수철을 놓아 되돌아가게 하기','Release a deformed spring and let it return',t=>t.inputs.body==='spring'&&outcome(t,'returns')),
 goal('elastic','용수철을 25 cm 늘려 12.5 N 측정하기','Stretch a spring 25 cm and measure 12.5 N',t=>t.inputs.springMode==='stretch'&&near(value(t,'extension'),25,.3)&&near(value(t,'springForce'),12.5,.15)),
 goal('friction','거친 면의 1 kg 도막이 움직이는 힘 1.96 N 찾기','Find the 1.96 N onset for a 1 kg block on a rough surface',t=>t.inputs.mass===1&&t.inputs.surface===.2&&outcome(t,'starts')&&near(value(t,'startForce'),1.96)),
 goal('buoyancy','물속에서 부력 3.92 N 만들기','Produce 3.92 N buoyancy in water',t=>t.inputs.density===1000&&near(value(t,'buoyancy'),3.92)),
 goal('overflow','넘친 물 무게와 부력 3.92 N 맞추기','Match displaced water weight and buoyancy at 3.92 N',t=>near(value(t,'waterWeight'),3.92)&&near(value(t,'difference'),3.92)),
 goal('motion','반대 방향 힘으로 움직이던 공 멈추기','Stop a moving ball with an opposing force',t=>t.inputs.initial===1&&t.inputs.mode==='stop'&&near(value(t,'speed'),0)&&outcome(t,'still')),
 goal('motion-classify','빠르기는 같고 방향만 바뀌는 운동 만들기','Show motion changing direction at constant speed',t=>value(t,'speedChange')===0&&value(t,'directionChange')===1),
 goal('contact','바닥 위 가방의 알짜힘 0 만들기','Balance the forces on a bag on the floor',t=>t.inputs.contact==='floor'&&outcome(t,'heldStill')&&near(value(t,'net'),0)),
 goal('applications','풍선을 위로 미는 힘 관찰하기','Observe the upward force on a balloon',t=>t.inputs.example==='balloon'&&outcome(t,'sample')),
 goal('design','안전 장치로 1 m 목표선 앞에 멈추기','Use a safety device to stop before the 1 m line',t=>outcome(t,'stable')&&value(t,'displacement')<=1),
 goal('floating','가장 적은 클립으로 풍선 가라앉히기 · 4개','Sink the balloon with the fewest clips · 4',t=>t.inputs.case==='balloon'&&t.inputs.clips===4&&outcome(t,'down')),
 goal('review-middle','가장 적은 물로 잠수함 가라앉히기 · 3칸','Sink the submarine with the least ballast · 3 units',t=>t.inputs.case==='submarine'&&t.inputs.fill===3&&outcome(t,'down')),
 goal('turning','스패너에 돌림힘 6 N·m 만들기','Produce 6 N·m torque with the wrench',t=>t.inputs.mode==='wrench'&&near(value(t,'torque'),6)),
 goal('lever-counts','추의 개수를 다르게 하여 수평 맞추기','Level the lever with unequal weight counts',t=>t.inputs.leftCount!==t.inputs.rightCount&&level(t)&&near(value(t,'torque'),0,.005)),
 goal('torque','팔 길이를 다르게 하여 수평 맞추기','Level the beam with unequal arm lengths',t=>t.inputs.mode==='beam'&&t.inputs.arm!==t.inputs.loadArm&&level(t)&&near(value(t,'torque'),0,.05)),
 goal('couple','합력 0으로 물체 회전시키기','Rotate an object with zero resultant force',t=>outcome(t,'rotates')&&near(value(t,'net'),0)&&Math.abs(value(t,'torque'))>0),
 goal('stability','10° 기울여도 안정하게 만들기','Keep a structure stable at a 10° tilt',t=>t.inputs.tilt===10&&outcome(t,'stable')),
 goal('shelf','선반의 두 받치는 힘을 같게 만들기','Make the two shelf support forces equal',t=>outcome(t,'heldStill')&&near(value(t,'net'),0)&&near(value(t,'torque'),0)&&near(value(t,'wallReaction'),value(t,'ropeForce'))),
 goal('review-high','추 4개 이상의 하중으로 크레인 수평 맞추기','Level a crane carrying at least four load weights',t=>t.inputs.leftCount>=4&&level(t)&&near(value(t,'torque'),0)),
 goal('vectors','합력을 위쪽 90°로 향하게 하기','Point the resultant upward at 90°',t=>Math.abs(value(t,'rx'))<.03&&value(t,'ry')>.1),
 goal('incline','마찰로 필요한 줄힘을 4 N 아래로 줄이기','Use friction to reduce rope tension below 4 N',t=>value(t,'friction')>0&&value(t,'tension')<4&&outcome(t,'held')),
]);
const byId=new Map(GOALS.map(g=>[g.id,g]));
export const goalFor=id=>byId.get(id);
// Achievement comes only from recorded trials. Earlier saves never gain stars on load.
export const achieved=trials=>trials.some(t=>t.goalMet===true);
export const previousGhosts=(trials,current=false)=>trials.slice(0,current?-1:undefined).filter(t=>t.ghost).slice(-3).map(t=>({...t.ghost,inputs:t.inputs}));
