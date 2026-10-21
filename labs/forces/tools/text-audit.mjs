// Borrow the same Playwright installation and GPU settings as labs/tools/capture.mjs.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import vm from 'node:vm';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

process.env.TEMP = process.env.TMP = 'D:/CodexWork/Temp';
process.env.PLAYWRIGHT_BROWSERS_PATH ||= 'D:/devcache/ms-playwright';
const require = createRequire('D:/marin/package.json');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, fallback) => {
  const i = process.argv.indexOf(`--${k}`);
  if (i < 0) return fallback;
  if (!process.argv[i + 1] || process.argv[i + 1].startsWith('--')) throw Error(`--${k} requires a path`);
  return process.argv[i + 1];
};
const cell = (s) => String(s).replaceAll('|', '\\|').replace(/\r?\n/g, ' ').replaceAll('<', '&lt;');

// Source grep with line numbers. Dictionary literals are evaluated in an isolated
// context (FCOL is only a color lookup); no application code is executed here.
function staticAudit() {
  const files = fs.readdirSync(path.join(root, 'src')).filter((f) => f.endsWith('.js') || f === '00-head.html');
  const lines = files.flatMap((f) => fs.readFileSync(path.join(root, 'src', f), 'utf8').split(/\r?\n/).map((text, i) => ({ file: `src/${f}`, line: i + 1, text })));
  const groups = [
    ['3D·canvas 글자', /fillText\s*\(|strokeText\s*\(|\b(?:engravedPlate|gaugeFaceTexture|hangScaleTexture|trackScaleTexture|knobWithArc|drawScreenA|drawScreenB)\s*\(|(?:function\s+|const\s+)(?:label|sprite|textSprite|canvasTexture)|\b(?:label|textSprite)\s*\(/i],
    ['음성', /speechSynthesis|SpeechSynthesisUtterance|\bspeak\s*\(/],
    ['캐릭터·마스코트', /\bquokka\s*\(/],
  ];
  const out = ['## 2. 정적 점검', '', 'Node 정규식 grep으로 원본 소스를 검색했다. 아래 항목은 DOM 단어 합계에 포함되지 않는다. 코드·주석·비활성 경로도 검색하며, 각 행은 출처이지 화면 표시 횟수가 아니다.', '', '| 분류 | 파일:줄 | 한 줄 요약(소스) |', '|---|---|---|'];
  for (const [name, regex] of groups) for (const row of lines.filter((r) => regex.test(r.text))) out.push(`| ${name} | ${row.file}:${row.line} | ${cell(row.text.trim().slice(0, 240))} |`);
  const emojis = lines.filter((r) => /\p{Extended_Pictographic}/u.test(r.text));
  out.push('', `이모지 리터럴 포함 줄: **${emojis.length}줄** (src/*.js 및 src/00-head.html, 한 줄에 여러 개여도 1줄). 대표 5줄:`, '', '| 파일:줄 | 소스 |', '|---|---|');
  for (const r of emojis.slice(0, 5)) out.push(`| ${r.file}:${r.line} | ${cell(r.text.trim().slice(0, 300))} |`);
  const kid = fs.readFileSync(path.join(root, 'src/65-kid.js'), 'utf8');
  out.push('', '| 언어 사전·퀘스트 | 항목 수 | 기준 |', '|---|---:|---|');
  for (const name of ['CARDS']) {
    const match = kid.match(new RegExp(`const ${name} = ([\\s\\S]*?);\\r?\\n`));
    if (!match) throw Error(`Dictionary not found: ${name}`);
    const value = vm.runInNewContext(`(${match[1]})`, { FCOL: new Proxy({}, { get: () => 0 }) }, { timeout: 1000 });
    const location = `src/65-kid.js:${kid.slice(0, match.index).split('\n').length}`;
    const count = Array.isArray(value) ? value.length : Object.keys(value).length;
    const detail = '최상위 키 또는 배열 항목, 번역은 별도 항목으로 중복 계산하지 않음';
    out.push(`| ${name} (${location}) | ${count} | ${detail} |`);
  }
  const missions = kid.slice(kid.indexOf('  missions: ['), kid.indexOf('\n  go(i)'));
  for (const key of ['pred', 'diagram']) {
    const regex = new RegExp(`\\b${key}:`, 'g');
    const hits = [...missions.matchAll(regex)];
    out.push(`| 퀘스트 ${key}: | ${hits.length} | ${hits.map((m) => `src/65-kid.js:${kid.slice(0, kid.indexOf('  missions: [') + m.index).split('\n').length}`).join(', ')} |`);
  }
  return out.join('\n');
}

// Pattern gate across both modes. No file hashes or mode/visibility exemptions.
// Tokenize comments and quoted/template literals before matching sinks, so a
// comment or a semicolon inside a template cannot hide a later text write.
function sourceTokens(source) {
  const tokens = [];
  const walk = (start, templateExpression = false) => {
    let i = start, depth = 0;
    while (i < source.length) {
      if (templateExpression && source[i] === '}' && depth === 0) return i + 1;
      if (/\s/.test(source[i])) { i++; continue; }
      if (source.startsWith('//', i)) { const end = source.indexOf('\n', i); i = end < 0 ? source.length : end; continue; }
      if (source.startsWith('/*', i)) { const end = source.indexOf('*/', i + 2); i = end < 0 ? source.length : end + 2; continue; }
      const begin = i, quote = source[i];
      if (quote === "'" || quote === '"' || quote === '`') {
        i++; let value = '';
        while (i < source.length) {
          if (source[i] === '\\') { value += source.slice(i, i + 2); i += 2; continue; }
          if (source[i] === quote) { i++; break; }
          if (quote === '`' && source.startsWith('${', i)) {
            const before = tokens.length;
            const end = walk(i + 2, true);
            for (let k = before; k < tokens.length; k++) { tokens[k].templateParent ??= begin; tokens[k].attribute ||= /(?:aria-[\w-]+|class|data-[\w-]+)="[^"<>]*$/.test(value); }
            value += '${}'; i = end; continue;
          }
          value += source[i++];
        }
        // Decode escaped words too (e.g. \u0068\u0069).
        value = value.replace(/\\u\{([\da-f]+)\}|\\u([\da-f]{4})|\\x([\da-f]{2})/gi,
          (_, a, b, c) => String.fromCodePoint(parseInt(a || b || c, 16)));
        tokens.push({ kind: 'literal', value, start: begin, end: i }); continue;
      }
      if (source[i] === '{') depth++;
      if (source[i] === '}') depth--;
      const id = source.slice(i).match(/^[\w$]+/);
      if (id) { tokens.push({ kind: 'code', value: id[0], start: i, end: i + id[0].length }); i += id[0].length; }
      else { tokens.push({ kind: 'code', value: source[i], start: i, end: i + 1 }); i++; }
    }
    return i;
  };
  walk(0);
  return tokens.sort((a, b) => a.start - b.start);
}
const STATIC_ALLOW = [
  ['comments', 'Comments are not rendered; the lexer skips them.'],
  ['markup', 'HTML/SVG tags and attributes (including aria-label), and document <title>, are metadata/geometry; body text nodes are checked.'],
  ['css', 'Only style.textContent and HTML style blocks: CSS rules are not text nodes.'],
  ['identifiers', 'Call names, property keys, selectors and drawing/format helper arguments are code; sink values are checked.'],
];
const forbiddenWords = /[\uac00-\ud7a3]|[a-z]{2,}|m\/s(?:\u00b2)?|\u03a3F/i;
function visibleLiteral(value) {
  return value.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, '')
    .replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (all, dec, hex, name) =>
      dec || hex ? String.fromCodePoint(parseInt(dec || hex, hex ? 16 : 10)) : ({nbsp:' ',times:'\u00d7',minus:'\u2212',amp:'&',lt:'<',gt:'>'}[name] || all));
}
function u5Audit() {
  const failures = [], rows = [];
  const files = fs.readdirSync(path.join(root, 'src')).filter(f => f.endsWith('.js') || f === '00-head.html').sort();
  for (const f of files) {
    const source = fs.readFileSync(path.join(root, 'src', f), 'utf8');
    if (f.endsWith('.html')) {
      const text = visibleLiteral(source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''));
      // HTML text is checked separately; script bodies are also tokenized below.
      for (const line of text.split(/\r?\n/)) if (forbiddenWords.test(line)) failures.push(`src/${f}: HTML text: ${line.trim()}`);
    }
    const tokens = sourceTokens(source), ranges = [], codeRanges = [], helpers = new Set();
    // Local wrappers that write their first argument (e.g. reading -> fillText).
    for (const m of source.matchAll(/const\s+(\w+)\s*=\s*\((\w+)[^)]*\)\s*=>\s*\{[^{}]*?\.(?:fillText|strokeText)\(\s*\2\b/g)) helpers.add(m[1]);
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.kind !== 'code') continue;
      if (t.value === 'ico' && tokens[i + 1]?.value === '(') {
        let depth = 1;
        for (let j = i + 2; j < tokens.length; j++) {
          if (tokens[j].kind !== 'code' || tokens[j].templateParent !== t.templateParent) continue;
          if (tokens[j].value === '(') depth++;
          if (tokens[j].value === ')' && --depth === 0) { codeRanges.push({ start: t.start, end: tokens[j].end }); break; }
        }
      }
      const call = /^(?:fillText|strokeText|engravedPlate)$/.test(t.value) || helpers.has(t.value);
      const assign = /^(?:textContent|innerHTML)$/.test(t.value) && tokens[i + 1]?.value === '=';
      if (!call && !assign) continue;
      if (call && tokens[i + 1]?.value !== '(') continue;
      let nesting = 0, end = source.length;
      for (let j = i + 2; j < tokens.length; j++) {
        const v = tokens[j].value;
        if (tokens[j].kind === 'literal' || tokens[j].templateParent !== undefined) continue;
        if (nesting === 0 && (assign ? [';', ')', '}', ']'].includes(v) : v === ',' || v === ')')) { end = tokens[j].start; break; }
        if (['(', '[', '{'].includes(v)) nesting++;
        if ([')', ']', '}'].includes(v)) nesting--;
      }
      const css = assign && tokens[i - 2]?.value === 'style';
      ranges.push({ start: tokens[i + 2]?.start ?? t.end, end, css });
    }
    // Follow simple named literal values into sinks as well as direct literals.
    for (let i = 0; i < tokens.length - 2; i++) {
      const [name, eq, value] = tokens.slice(i, i + 3);
      if (name.kind !== 'code' || !/^[a-z_$][\w$]*$/i.test(name.value) || !['const', 'let', 'var'].includes(tokens[i - 1]?.value) || eq.value !== '=' || value.kind !== 'literal') continue;
      if (ranges.some(r => new RegExp(`\\b${name.value}\\b`).test(source.slice(r.start, r.end))))
        ranges.push({ start: value.start, end: value.end, css: false });
    }
    for (const t of tokens.filter(t => t.kind === 'literal')) {
      const sinks = ranges.filter(r => t.start >= r.start && t.start < r.end);
      // Also inspect upstream markup literals in helpers/dictionaries, even if
      // the sink receives them through a variable rather than a direct literal.
      const markup = /^\s*<[a-z][^>]*>/i.test(t.value) || /<(?:div|span|button|svg|path|i|b|small|em|label|section|article|p|input|select|option|h[1-6]|style|title|canvas)\b[^>]*>/i.test(t.value);
      if (!sinks.length && !markup) continue;
      if (t.attribute || codeRanges.some(r => t.start > r.start && t.end < r.end)) continue;
      const before = source.slice(0, t.start), after = source.slice(t.end);
      if (/(?:===?|!==?)\s*$/.test(before) || /^\s*(?:===?|!==?)/.test(after)) continue;
      if (/\[[^\[\]]*$/.test(before) && /^[^\[\]]*\]\.map\(/.test(after)) continue;
      if (sinks.some(r => r.css) && /\{[\s\S]*:[\s\S]*\}/.test(t.value)) continue;
      const text = markup ? visibleLiteral(t.value) : t.value;
      if (!forbiddenWords.test(text)) continue;
      // Nested helper calls use identifiers, not displayed words. Attribute-only
      // template expressions likewise belong to markup metadata.
      const prefix = source.slice(0, t.start);
      if (!markup && /\b(?:ico|font|fx|hex|n1|querySelector)\(\s*$/.test(prefix)) continue;
      if (!markup && /(?:aria-[\w-]+|class|data-[\w-]+)="[^"<>]*$/.test(prefix.slice(prefix.lastIndexOf('`') + 1))) continue;
      const location = `src/${f}:${source.slice(0, t.start).split('\n').length}`;
      failures.push(`${location}: ${JSON.stringify(text)}`);
      rows.push(`| ${location} | ${cell(text)} | FAIL |`);
    }
  }
  const gate = `U5/U7 static gate: ${failures.length ? 'FAIL' : 'PASS'}`;
  return { ok: !failures.length, gate, markdown: ['## U5/U7 static source gate', '',
    'All src/*.js and src/00-head.html; literal patterns, multiline templates, local canvas wrappers and upstream markup. Dynamic runtime values still require the DOM/browser audit.', '',
    ...STATIC_ALLOW.map(([key, reason]) => `ALLOW ${key}: ${reason}`), '',
    '| File:line | Display string | Result |', '|---|---|---|', ...rows,
    ...failures.map(f => `- ${f}`), '', `Violations: ${failures.length}`, gate].join('\n') };
}
const u5 = u5Audit();
console.log(u5.markdown);
if (process.argv.includes('--static-only')) {
  console.log(staticAudit());
  process.exit(u5.ok ? 0 : 1);
}

let server, browser, reportPath, questCount = 0;
const errors = [];
if (!u5.ok) errors.push({ state: 'U5', type: 'static gate', text: u5.gate });
try {
  const out = path.resolve(root, arg('out', 'docs/wordless-baseline.md'));
  reportPath = out;
  const shots = path.resolve(root, arg('shots', 'shots/audit-baseline'));
  console.log('text-audit: starting local server');
  const port = await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.on('error', reject);
    probe.listen(0, '127.0.0.1', () => { const { port } = probe.address(); probe.close(() => resolve(port)); });
  });
  server = spawn(process.execPath, ['D:/labs/tools/serve.mjs', '--root', 'D:/labs/labs/forces', '--port', String(port)], { cwd: root, env: process.env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let serverLog = '';
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error(`Server startup timeout: ${serverLog}`)), 15000);
    server.on('error', (e) => { clearTimeout(timer); reject(e); });
    server.on('exit', (code) => { clearTimeout(timer); reject(Error(`Server exited (${code}): ${serverLog}`)); });
    server.stderr.on('data', (chunk) => { serverLog += chunk; });
    server.stdout.on('data', (chunk) => { serverLog += chunk; if (serverLog.includes(`http://localhost:${port}`)) { clearTimeout(timer); resolve(); } });
  });
  const url = `http://127.0.0.1:${port}/`;
  console.log(`text-audit: server ready at ${url}; launching Chromium`);
  const { chromium } = require('playwright');
  browser = await chromium.launch({ headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  console.log('text-audit: loading page');
  const rows = [];
  let current = 'load';
  page.on('console', (m) => { if (m.type() === 'error') { errors.push({ state: current, type: 'console error', text: m.text() }); console.error(`[${current}] ${m.text()}`); } });
  page.on('pageerror', (e) => { errors.push({ state: current, type: 'pageerror', text: String(e) }); console.error(`[${current}] ${e}`); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__lab?.textAudit && document.querySelector('.kstart'), null, { timeout: 60000 });
  await page.waitForTimeout(2600);
  const info = await page.evaluate(() => __lab.textAuditInfo);
  questCount = await page.evaluate(() => __lab.kid.count);
  if (!Number.isInteger(questCount) || questCount < 1) throw Error('Invalid quest count hook');
  if (info.missions.length !== questCount) throw Error('Quest metadata/count mismatch');
  fs.mkdirSync(shots, { recursive: true });
  const measure = async (mode, stage, phase, slug) => {
    current = slug;
    const audit = await page.evaluate(() => window.__lab.textAudit());
    if (!Array.isArray(audit.words) || audit.count !== audit.words.length || !Array.isArray(audit.emoji) || !Array.isArray(audit.tooltips)) throw Error(`Invalid textAudit result: ${slug}`);
    const screenshot = path.join(shots, `${slug}.jpg`);
    await page.screenshot({ path: screenshot, type: 'jpeg', quality: 88 });
    const u4 = mode === '쉬운';
    const u7 = mode === '자세히';
    const expectation = 'words 0 / emoji 0 / tooltips 0';
    const ok = (audit.count === 0 && audit.tooltips.length === 0 && audit.emoji.length === 0);
    rows.push({ mode, stage, phase, slug, u4, u7, audit, screenshot, expectation, ok });
    if (!ok) errors.push({ state: slug, type: 'wordless expectation', text: expectation });
    console.log(`${slug}: ${expectation}; ${ok ? 'PASS' : 'FAIL'}`);
    console.log(`${mode} · ${stage} · ${phase}: ${audit.count} | ${audit.words.slice(0, 6).map((w) => w.text).join(' ')}`);
  };
  // Existing simulation hooks only: no forced passed/check/context values.
  const advance = async (n = 60) => page.evaluate((n) => __lab.step(n), n);
  const set = async (values) => page.evaluate((values) => { for (const [k, v] of Object.entries(values)) __lab.set(k, v); }, values);
  await measure('쉬운', '처음', '인트로', 'kid-intro');
  const hadSlow = await page.evaluate(() => {
    const had = document.body.classList.contains('kslow'); document.body.classList.add('kslow'); return had;
  });
  try {
    await page.waitForTimeout(350);
    await measure('\uC26C\uC6B4', 'conditional', 'slow badge forced', 'kid-conditional-slow');
  } finally {
    await page.evaluate((had) => document.body.classList.toggle('kslow', had), hadSlow);
  }
  await page.locator('.kstart').click();
  await page.evaluate(() => __lab.step(1));
  for (let i = 0; i < questCount; i++) {
    current = `kid-q${i}`;
    await page.evaluate((i) => __lab.kid.go(i), i);
    await advance(150);
    if (info.missions[i].answer !== null) {
      if (await page.evaluate(() => __lab.textAuditInfo.phase) !== 'predict') throw Error(`Quest ${i} not in prediction phase`);
      await measure('쉬운', `퀘스트 ${i}`, '예상하기', `kid-q${i}-predict`);
      await page.locator(`.kopt[data-p="${info.missions[i].answer}"]`).click();
    }
    await advance(1);
    await measure('쉬운', `퀘스트 ${i}`, '조작', `kid-q${i}-play`);
    const id = info.missions[i].id;
    const legacy = i < 4 ? i : i >= 7 ? i - 3 : -1;
    if (id === 'cmp') await page.evaluate(() => { __lab.balance.place('left','a'); __lab.balance.place('right','e'); });
    if (id === 'clip') await page.evaluate(() => __lab.balance.clips('right',30));
    if (id === 'lever') await page.evaluate(() => { __lab.balance.place('right','e'); __lab.balance.pos('right',2); });
    if (legacy === -1) await page.evaluate(() => __lab.balance.step(600));
    if (legacy === 0) { await set({ F2: 2 }); await advance(35); }
    if (legacy === 1) { await set({ F1: 2, F2: 2 }); await advance(140); }
    if (legacy === 2) { await set({ same: true, F1: 1, F2: 1 }); await advance(10); }
    if (legacy === 3) { await set({ g: 1.6 }); await page.evaluate(() => __lab.settle()); await advance(10); }
    if (legacy === 4) for (let n = 1; n <= 4; n++) { await set({ n }); await page.evaluate(() => __lab.settle()); await advance(10); }
    if (legacy === 5) { await set({ F2: 2 }); await advance(35); await set({ surface: 'sand' }); await page.evaluate(() => __lab.resetTrack()); await advance(100); }
    if (legacy === 6 || legacy === 7) { await set({ jack: 0.6 }); await page.evaluate(() => __lab.settle()); await advance(60); }
    if (legacy === 8) { await set({ F2: 2 }); await advance(20); await set({ F1: 4 }); await advance(20); }
    if (legacy === 9) { await set({ surface: 'sand', load: 2, F2: 4 }); await advance(110); }
    await advance(100);
    const passed = await page.evaluate((i) => __lab.kid.i === i && __lab.kid.passed && document.querySelector('.kwin.on') !== null, i);
    if (!passed) errors.push({ state: current, type: 'missing success', text: 'wordless success state required' });
    if (passed) await measure('쉬운', `퀘스트 ${i}`, '성공', `kid-q${i}-success`);
    else {
      const reason = '기존 set/settle/step 조작 후 실제 passed 및 성공 팝업 조건이 충족되지 않음. 강제 성공 처리하지 않음.';
      rows.push({ mode: '쉬운', stage: `퀘스트 ${i}`, phase: '성공', reason });
      console.log(`쉬운 · 퀘스트 ${i} · 성공: 미측정 | ${reason}`);
    }
  }
  await page.evaluate((n) => __lab.kid.go(n), questCount);
  await advance(150);
  await measure('쉬운', '끝', '결과', 'kid-end');
  await page.locator('[data-k=free]').click();
  for (const st of ['track','hang','balance']) {
    await page.locator(`[data-st="${st}"]`).click();
    await advance(150);
    await measure('쉬운', '자유 실험', st, `kid-free-${st}`);
  }
  await page.evaluate(() => __lab.mode('full'));
  await advance(150);
  await page.evaluate(() => __lab.lesson.end());
  for (const st of ['hang','track','balance']) {
    await page.evaluate(st => __lab.set('station', st), st);
    await advance(150);
    await measure('자세히', '기본', st, `full-default-${st}`);
  }
  for (let i = 0; i < 10; i++) {
    await page.evaluate(i => __lab.lesson.go(i), i);
    await advance(150);
    await measure('자세히', `수업 ${i+1}단계`, '조작', `full-lesson-${i+1}`);
  }
  const measured = rows.filter((r) => r.audit);
  const total = (key) => measured.reduce((n, r) => n + (key === 'count' ? r.audit.count : r.audit[key].length), 0);
  const md = ['# 쉬운 모드 U4 글자 감사', '', '## 1. 화면 측정', '', `측정 시각: ${new Date().toISOString()}. 뷰포트 1440×900, 기본 한국어, 기본 URL(모드 쿼리 없음).`, '', '단어는 화면 안 텍스트 노드의 공백 토큰 중 한글 음절·라틴 문자 연속 2자 이상 및 명시된 복합 단위 m/s, N·g이다. 중복 출현도 각각 센다. SVG text, 입력값(비었으면 placeholder), 선택된 select 문구를 포함한다. aria-label은 제외한다. 이모지는 텍스트 노드의 Extended_Pictographic 코드포인트 수이다. title은 보이는 소유 요소마다 별도로 센다.', '', '시뮬레이션은 기존 step 훅으로 고정 시간 진행했다. 예상은 실제 .kopt 정답 버튼을 클릭했다. 성공은 물리 조작 후 실제 passed와 .kwin.on을 확인했다. 가림막 뒤 요소의 겹침·픽셀 가림, CSS 생성 콘텐츠, canvas/3D 텍스트는 DOM 검사 범위 밖이다. 화면 밖·잘린 토큰, 숨김·투명 요소는 제외한다.', '', '| 모드 | 단계 | 국면 | 단어 수 | 처음 6개 단어 | 이모지 | 툴팁 | 스크린샷 / 미측정 이유 |', '|---|---|---|---:|---|---:|---:|---|---|'];
  for (const r of rows) md.push(r.audit ? `| ${r.mode} | ${r.stage} | ${r.phase} | ${r.audit.count} | ${cell(r.audit.words.slice(0, 6).map((w) => w.text).join(' '))} | ${r.audit.emoji.length} | ${r.audit.tooltips.length} | [JPEG](${path.relative(path.dirname(out), r.screenshot).replaceAll('\\', '/')}) | ${r.expectation} / ${r.ok ? 'PASS' : 'FAIL'} |` : `| ${r.mode} | ${r.stage} | ${r.phase} | 미측정 | — | — | — | ${r.reason} |`);
  const u4Rows = rows.filter(r => r.u4);
  const u4Bad = u4Rows.filter(r => r.audit.count || r.audit.emoji.length || r.audit.tooltips.length);
  const expectedU4 = 6 + info.missions.reduce((n,m) => n + 2 + (m.answer !== null ? 1 : 0), 0);
  const gateOK = u4Bad.length === 0 && u4Rows.length === expectedU4;
  const u4Gate = `U4 gate: ${gateOK ? 'PASS' : 'FAIL'} · nonzero states: ${u4Bad.map(r => `${r.slug} (words=${r.audit.count}, emoji=${r.audit.emoji.length}, tooltips=${r.audit.tooltips.length})`).join(', ') || 'none'} · measured ${u4Rows.length}/${expectedU4}`;
  if (!gateOK && !u4Bad.length) errors.push({ state:'U4', type:'missing states', text:u4Gate });
  const u7Rows = rows.filter(r => r.u7);
  const u7Bad = u7Rows.filter(r => r.audit.count || r.audit.emoji.length || r.audit.tooltips.length);
  const u7OK = u7Rows.length === 13 && u7Bad.length === 0;
  const u7Gate = `U7 DOM gate: ${u7OK ? 'PASS' : 'FAIL'} · nonzero states: ${u7Bad.map(r => `${r.slug} (words=${r.audit.count}, emoji=${r.audit.emoji.length}, tooltips=${r.audit.tooltips.length})`).join(', ') || 'none'} · measured ${u7Rows.length}/13`;
  if (!u7OK) errors.push({state:'U7', type:'DOM gate', text:u7Gate});
  md.push('', `요약: 측정 상태 **${measured.length}개**, 미측정 **${rows.length - measured.length}개**, 단어 0개 상태 **${measured.filter((r) => !r.audit.count).length}개**, 전체 단어 합 **${total('count')}개**, 이모지 총수 **${total('emoji')}개**, 툴팁 총수 **${total('tooltips')}개**. 합계는 상태 간 중복을 포함한다.`, '', u4Gate, '', u7Gate, '', staticAudit(), '', u5.markdown, '', '## 3. 페이지 오류', '', `console error / pageerror: ${errors.length}건.`, '', ...errors.map((e) => `- ${cell(e.state)} · ${e.type}: ${cell(e.text)}`), '');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, md.join('\n'));
  if (errors.length) process.exitCode = 1;
  console.log(`Report: ${out}\nStates: ${measured.length}, words: ${total('count')}, emoji: ${total('emoji')}, tooltips: ${total('tooltips')}, errors: ${errors.length}`);
  console.log(u4Gate);
  console.log(u7Gate);
} catch (error) {
  console.error(`text-audit failed: ${error.stack || error}`);
  if (reportPath) {
    const pending = [['쉬운', '처음', '인트로']];
    for (let i = 0; i < questCount; i++) {
      if (i > 0 && i < questCount - 1) pending.push(['쉬운', `퀘스트 ${i}`, '예상하기']);
      pending.push(['쉬운', `퀘스트 ${i}`, '조작'], ['쉬운', `퀘스트 ${i}`, '성공']);
    }
    pending.push(['쉬운', '끝', '결과'], ...['track','hang','balance'].map(st => ['쉬운', '자유 실험', st]), ...['hang','track','balance'].map(st => ['자세히','기본',st]), ...Array.from({length:10}, (_,i) => ['자세히',`수업 ${i+1}단계`,'조작']));
    console.error('U4 gate: FAIL · audit incomplete; states unmeasured');
    console.error('U7 DOM gate: FAIL · audit incomplete; states unmeasured');
    const md = ['# 글자 없는 화면 전환 전 기준선', '', '## 1. 화면 측정', '', `측정 실패 시각: ${new Date().toISOString()}. 뷰포트 1440×900. 실행이 완료되지 않아 기준선 수치를 확정하지 않았다.`, '', `실패: ${cell(error.message)}`, '', '| 모드 | 단계 | 국면 | 단어 수 | 미측정 이유 |', '|---|---|---|---|---|', ...pending.map(([mode, stage, phase]) => `| ${mode} | ${stage} | ${phase} | 미측정 | 측정 실행 실패. 아래 오류 참조. |`), '', `요약: 완료된 측정 실행 없음. 요청 상태 ${pending.length}개. 단어 0개 상태 수·전체 단어 합·이모지 총수·툴팁 총수는 미측정이며 0으로 간주하지 않는다. 스크린샷은 완료된 실행의 결과로 확정하지 않았다.`, '', 'U4 gate: FAIL · audit incomplete; states unmeasured', '', 'U7 DOM gate: FAIL · audit incomplete; states unmeasured', '', staticAudit(), '', u5.markdown, '', '## 3. 페이지 오류', '', `console error / pageerror: ${errors.length}건.`, '', ...errors.map((e) => `- ${cell(e.state)} · ${e.type}: ${cell(e.text)}`), ''];
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, md.join('\n'));
  }
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null && server.signalCode === null) {
    await new Promise((resolve) => { server.once('exit', resolve); server.kill(); });
  }
}
