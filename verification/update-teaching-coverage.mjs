import fs from 'node:fs';
import {COURSES} from '../dist/labs/force-equilibrium/curriculum-model.js';
import {UNIT_SOURCES,lessonFor} from '../dist/labs/force-equilibrium/lesson-content.js';
import {COVERAGE} from '../dist/labs/force-equilibrium/teacher-coverage.js';
const root=new URL('../',import.meta.url),file=p=>new URL(p,root);
let out='# L01 지도서 학생 목표 대조표 — v5.0.0\n\n2026-10-17. 학생 목표의 기구·조작·관찰·설명 근거를 대조했다. 조사·발표·협력·설명의 질은 교사가 확인한다. 출판사 원문과 삽화는 포함하지 않는다. [검수·수정 내역](teaching-audit-2026-10-17.md).\n\n';
for(const source of UNIT_SOURCES)out+=`- [${source.title}](${source.url}) · ${source.pages} · ${source.scope[0]}\n`;
for(const [cid,goals]of Object.entries(COVERAGE)){
 out+=`\n## ${COURSES[cid].label[0]} — ${goals.length}개 항목\n\n| ID | 지도서 쪽 | 학생 목표 | 연결 활동 | 확인 |\n|---|---|---|---|---|\n`;
 for(const goal of goals)out+=`| ${goal.id} | ${goal.pages} | ${goal.title[0]} | ${goal.activities.map(id=>COURSES[cid].activities.find(a=>a.id===id).title[0]).join(' / ')} | ${goal.manual?'기록 + 교사 검토':'실험·응답 기록 검토'} |\n`;
}
out+='\n## 실제 조작 순서\n\n';
for(const [cid,c]of Object.entries(COURSES)){
 out+=`### ${c.label[0]}\n\n`;
 for(const [i,a]of c.activities.entries()){const l=lessonFor(cid,a.id);out+=`${i+1}. **${a.title[0]}** · ${l.source} ${l.pages}쪽 · ${a.codes.join(', ')}\n\n   ${l.frames.map(f=>f.title[0]).join(' → ')}\n\n`;}
}
fs.writeFileSync(file('docs/teacher-guide-coverage.md'),out.trimEnd()+'\n');
for(const name of ['teacher-guide-coverage.md','curriculum-integration.md','reviewer-brief.md','teaching-audit-2026-10-17.md'])fs.copyFileSync(file('docs/'+name),file('dist/labs/force-equilibrium/docs/'+name));
console.log('Updated guide coverage and packaged documentation.');
