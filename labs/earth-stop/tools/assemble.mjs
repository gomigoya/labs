// src/ 조각들을 이어 붙여 단일 index.html을 만든다 (런타임에는 빌드 도구가 없다: 결과물은 그대로 브라우저에서 열린다)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(dir, 'src');
const files = fs.readdirSync(src).sort();
const head = fs.readFileSync(path.join(src, files.find((f) => f.endsWith('.html'))), 'utf8');
const js = files.filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
const out = `${head}<script type="module">\n// 이 파일은 src/의 조각을 tools/assemble.mjs로 이어 붙여 만든다. 수정은 src/에서.\n${js}\n</script>\n</body>\n</html>\n`;
fs.writeFileSync(path.join(dir, 'index.html'), out);
console.log(`index.html: ${out.split('\n').length} lines, ${(out.length / 1024).toFixed(0)} KB`);
