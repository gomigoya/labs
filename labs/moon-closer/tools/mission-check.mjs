// Exercise the real display function; only browser geometry/animation boundaries are stubbed.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read = file => fs.readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
export function checkMissions() {
  const nodes = new Map();
  const element = () => ({ textContent: '', hidden: false, style: {}, innerHTML: '', setAttribute() {}, getAnimations: () => [], animate() {}, getBoundingClientRect: () => ({ bottom: 130, height: 40 }) });
  const context = vm.createContext({ window: { addEventListener() {} }, matchMedia: () => ({ matches: true }),
    document: { getElementById(id) { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); }, documentElement: { style: { setProperty() {} } } } });
  vm.runInContext(read('15-physics.js') + read('65-quests.js') + read('67-mission.js') + `
    const T={mode:'student'}, S={playing:{target:0},lens:{target:0},sound:{target:0},speed:{target:1}};
    function icon(){return ''} function questUI(){syncUI()}
  ` + read('60-interaction-hud.js').split('function syncUI()')[1].split('const raycaster')[0].replace(/^/, 'function syncUI()'), context);
  const run = code => vm.runInContext(code, context);
  const table = run('MISSION');
  assert.equal(table.length, 8);
  let checks = 1;
  for (const [i, row] of table.entries()) {
    for (const key of ['ask', 'pick', 'act', 'watch', 'done', 'free']) {
      for (const text of typeof row[key] === 'string' ? [row[key]] : [row[key]?.right, row[key]?.wrong]) {
        assert.equal(typeof text, 'string'); assert(text.trim()); assert([...text].length <= 32); checks++;
      }
    }
    let previous;
    for (const phase of ['intro', 'predict', 'act', 'observe', 'confirm', 'card']) {
      run(`Q.i=${i};Q.pick=QUESTS[Q.i].answerKey;QUEST.phase('${phase}')`);
      const text = nodes.get('mission').textContent;
      const key = { intro: 'ask', predict: 'pick', act: 'act', observe: 'watch', confirm: 'done', card: 'done' }[phase];
      assert.equal(text, key === 'done' ? row.done.right : row[key]);
      if (previous && phase !== 'card') assert.notEqual(text, previous);
      assert.equal(nodes.get('mission').hidden, false); previous = text; checks++;
    }
    run(`Q.pick='incorrect';QUEST.phase('confirm')`); assert.equal(nodes.get('mission').textContent, row.done.wrong); checks++;
    run(`Q.free=true;syncUI()`); assert.equal(nodes.get('mission').textContent, '마음대로 만져 보세요'); checks++;
    run(`T.mode='teacher';syncUI()`); assert.equal(nodes.get('mission').hidden, true); checks++;
    run(`T.mode='student';Q.free=false;syncUI()`); assert.equal(nodes.get('mission').hidden, false); checks++;
  }
  console.log(`PASS: mission ${checks} checks, 0 failures (copy length, visible phases, result, free, teacher)`);
}
