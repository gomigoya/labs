// 퀘스트 번호는 유지하고, 표시 순서·단계·개념은 이 표에서 정한다.
const CONCEPTS = [
 {id:1,ko:'힘에는 크기와 방향이 있어요',en:"Force has size and direction."},
 {id:2,ko:'크기가 같고 방향이 반대인 힘은 서로 상쇄돼요(평형)',en:"Equal forces in opposite directions cancel out (balanced forces)."},
 {id:3,ko:'힘이 같지 않으면 더 큰 쪽으로 움직임이 바뀌어요',en:"Unequal forces change motion toward the larger force."},
 {id:4,ko:'줄 하나의 장력은 어디서나 같아요',en:"Tension is the same all along a single rope."},
 {id:5,ko:'마찰은 필요한 만큼만 생기고, 한계가 있어요',en:"Friction acts only as much as needed, up to a limit."},
 {id:6,ko:'당기는 능력은 근육과 마찰 중 작은 쪽이에요',en:"Pulling capacity is the smaller of muscle and friction limits."}
];
const LEVELS = [
 {id:1,quests:[8, 9, 1, 2, 4],standards:{ko:['4과01-01'],us:['3-PS2-1']}},
 {id:2,quests:[10, 11, 12, 5, 3],standards:{ko:['9과05-01'],us:['MS-PS2-2']}},
 // 고시 원문 확인 필요
 {id:3,quests:[6, 7],standards:{ko:[],us:['MS-PS2-1']}}
];
const CONCEPTS_OF = {1:[6],2:[3],4:[5],5:[5],3:[3],6:[6],7:[6],8:[2,1],9:[3],10:[4],11:[3,4],12:[5]};
const SEQUENCE = LEVELS.flatMap(level=>level.quests.map(id=>id-1));
const firstOfLevel = id=>LEVELS.find(level=>level.id===id).quests[0]-1;
const levelOf = i=>LEVELS.find(level=>level.quests.includes(i+1)).id;
// QUESTS 정의 직후 한 번만 검증한다. 이후 호출부는 표를 믿는다.
function validateCurriculum(quests){
 if(SEQUENCE.length!==quests.length||new Set(SEQUENCE).size!==quests.length||SEQUENCE.some(i=>!Number.isInteger(i)||quests[i]?.id!==i+1))throw new Error('curriculum: 퀘스트 번호 누락·중복·범위 오류');
}
