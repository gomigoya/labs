// labs/*/ → dist/ 정적 사이트 빌드.
// - 각 실험실 index.html에 사이트 설정·품질 판정(head)과 공통 셸(body 끝)을 주입
// - 공유 미리보기용 OG 태그, canonical 추가(이미 있으면 건드리지 않음)
// - 홈 갤러리(dist/index.html), sitemap.xml, robots.txt, _headers 생성
// 사용: node tools/build.mjs [--all]   (--all: status "hidden"과 _로 시작하는 폴더까지 포함)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LABS = path.join(ROOT, 'labs');
const DIST = path.join(ROOT, 'dist');
const ALL = process.argv.includes('--all');
const SKIP = new Set(['shots', 'docs', 'node_modules', 'meta.json', 'src', 'tools']); // src·tools: 조각 소스와 검증 스크립트(배포 불필요)
const SKIP_EXT = new Set(['.ps1', '.md']);

const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
// basePath: 사이트가 도메인 하위 경로에 붙을 때('/education'). 산출물도 dist/<basePath>/에 만들어
// 로컬 서버·Pages·도메인 어디서나 같은 주소 구조를 쓴다.
const BASE = (cfg.basePath || '').replace(/\/+$/, '').replace(/^(?!\/|$)/, '/');
const OUT = path.join(DIST, BASE);
const origin = cfg.domain ? `https://${cfg.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}${BASE}` : '';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP.has(ent.name) || SKIP_EXT.has(path.extname(ent.name)) || ent.name.startsWith('serve.')) continue;
    const s = path.join(src, ent.name), d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// 사이트 전역 설정. 실험실 코드는 window.__SITE__.quality ('high' | 'low')를 읽어 AO·보케·블룸을 끈다.
const publicCfg = {
  brand: cfg.brand,
  base: BASE,
  requestFormUrl: cfg.requestFormUrl || '',
  waitlistFormUrl: cfg.waitlistFormUrl || '',
};
const headSnippet = `<script>window.__SITE__=${JSON.stringify(publicCfg)};(function(){try{var q=new URLSearchParams(location.search),m=navigator.deviceMemory;var lite=q.has('lite')?q.get('lite')!=='0':(m!==undefined&&m<=4);window.__SITE__.quality=lite?'low':'high';}catch(e){window.__SITE__.quality='high';}})();</script>`;
const analytics = cfg.cloudflareAnalyticsToken
  ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${esc(cfg.cloudflareAnalyticsToken)}"}'></script>`
  : '';

function ogTags(meta, url, image) {
  const title = `${meta.titleKo} — ${cfg.brand.nameKo}`;
  const desc = `${meta.hookKo} · ${meta.hookEn}`;
  return [
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(cfg.brand.name)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    url && `<meta property="og:url" content="${esc(url)}">`,
    url && `<link rel="canonical" href="${esc(url)}">`,
    image && `<meta property="og:image" content="${esc(image)}">`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    `<meta name="description" content="${esc(desc)}">`,
  ].filter(Boolean).join('\n');
}

function injectLab(html, meta, slug, hasThumb) {
  const url = origin ? `${origin}/${slug}/` : '';
  const image = hasThumb ? (origin ? `${origin}/${slug}/thumb.jpg` : `${BASE}/${slug}/thumb.jpg`) : '';
  const hasOg = /property=["']og:title["']/i.test(html);
  const head = headSnippet + (hasOg ? '' : '\n' + ogTags(meta, url, image));
  if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => `${m}\n${head}`);
  else html = head + html;
  const tail = `<script src="${BASE}/_shared/shell.js" defer></script>${analytics}`;
  if (/<\/body>/i.test(html)) html = html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${tail}\n</body>`);
  else html += tail;
  return html;
}

function readLabs() {
  if (!fs.existsSync(LABS)) return [];
  const out = [];
  for (const ent of fs.readdirSync(LABS, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    if (ent.name.startsWith('_') && !ALL) continue;
    const dir = path.join(LABS, ent.name);
    const metaPath = path.join(dir, 'meta.json');
    if (!fs.existsSync(metaPath)) { console.warn(`! ${ent.name}: meta.json 없음 — 건너뜀`); continue; }
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    meta.slug = meta.slug || ent.name;
    if (meta.status === 'hidden' && !ALL) continue;
    if (!fs.existsSync(path.join(dir, 'index.html'))) { console.warn(`! ${meta.slug}: index.html 없음 — 건너뜀`); continue; }
    out.push({ meta, dir, hasThumb: fs.existsSync(path.join(dir, 'thumb.jpg')) });
  }
  return out.sort((a, b) => (a.meta.order ?? 999) - (b.meta.order ?? 999));
}

const SUBJECT = { physics: ['물리', 'Physics'], chemistry: ['화학', 'Chemistry'], biology: ['생명', 'Biology'], earth: ['지구', 'Earth'] };

function galleryHtml(labs) {
  const b = cfg.brand;
  const cards = labs.map(({ meta, hasThumb }) => {
    const [sk, se] = SUBJECT[meta.subject] || [meta.subject, meta.subject];
    const thumb = hasThumb
      ? `<img src="${BASE}/${esc(meta.slug)}/thumb.jpg" alt="" loading="lazy">`
      : `<div class="ph" aria-hidden="true"></div>`;
    return `<a class="card" href="${BASE}/${esc(meta.slug)}/">
  <div class="thumb">${thumb}${meta.reviewed ? `<span class="badge" data-ko="검수 완료" data-en="Expert-reviewed">검수 완료</span>` : ''}</div>
  <div class="body">
    <div class="kicker"><span data-ko="${esc(sk)}" data-en="${esc(se)}">${esc(sk)}</span> · <span data-ko="${esc(meta.curriculumKo)}" data-en="${esc(meta.curriculumEn)}">${esc(meta.curriculumKo)}</span></div>
    <h2 data-ko="${esc(meta.titleKo)}" data-en="${esc(meta.titleEn)}">${esc(meta.titleKo)}</h2>
    <p data-ko="${esc(meta.hookKo)}" data-en="${esc(meta.hookEn)}">${esc(meta.hookKo)}</p>
  </div>
</a>`;
  }).join('\n');

  const cta = [
    cfg.waitlistFormUrl && `<a class="btn primary" href="${esc(cfg.waitlistFormUrl)}" target="_blank" rel="noopener" data-ko="새 실험실 알림 받기" data-en="Get new labs by email">새 실험실 알림 받기</a>`,
    cfg.requestFormUrl && `<a class="btn" href="${esc(cfg.requestFormUrl)}" target="_blank" rel="noopener" data-ko="기관용 맞춤 실험실 의뢰" data-en="Custom labs for institutions">기관용 맞춤 실험실 의뢰</a>`,
  ].filter(Boolean).join('\n');

  const url = origin ? `${origin}/` : '';
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(b.name)} — ${esc(b.taglineKo)}</title>
<meta name="description" content="${esc(b.taglineKo)} · ${esc(b.taglineEn)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(b.name)}">
<meta property="og:description" content="${esc(b.taglineKo)} · ${esc(b.taglineEn)}">
${url ? `<meta property="og:url" content="${esc(url)}">\n<link rel="canonical" href="${esc(url)}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;800&family=DM+Mono:wght@500&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#171411;--panel:#221d18;--line:rgba(255,255,255,.09);--ink:#f2ebe1;--quiet:#a99d8f;--warm:#ffb36b;--cool:#7dd3fc}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(1200px 600px at 20% -10%,#3a2a1c 0%,transparent 60%),radial-gradient(900px 500px at 100% 0%,#0f2a36 0%,transparent 55%),var(--bg);
  color:var(--ink);font:400 16px/1.6 "Noto Sans KR",system-ui,sans-serif;min-height:100vh}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
header{display:flex;align-items:center;justify-content:space-between;padding:24px 0}
.logo{font:800 22px/1 Outfit,sans-serif;letter-spacing:.01em;color:var(--ink);text-decoration:none}
.logo span{color:var(--warm)}
.lang{display:flex;gap:4px}
.lang button{font:500 11px/1 "DM Mono",monospace;letter-spacing:.14em;background:none;border:1px solid var(--line);color:var(--quiet);border-radius:999px;padding:7px 10px;cursor:pointer}
.lang button[aria-pressed="true"]{color:var(--ink);border-color:var(--warm)}
.hero{padding:56px 0 40px}
.hero .k{font:500 12px/1 "DM Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--cool)}
.hero h1{font:800 clamp(36px,6vw,64px)/.98 Outfit,"Noto Sans KR",sans-serif;margin:16px 0 18px;max-width:14em;text-shadow:0 0 24px rgba(255,179,107,.18)}
.hero h1 em{font-style:normal;color:var(--warm)}
.hero p{color:var(--quiet);max-width:36em;margin:0 0 28px}
.btns{display:flex;gap:10px;flex-wrap:wrap}
.btn{display:inline-block;border:1px solid var(--line);color:var(--ink);text-decoration:none;border-radius:12px;padding:12px 16px;font-weight:500}
.btn.primary{background:var(--warm);color:#1a1209;border-color:var(--warm)}
.btn:hover{border-color:var(--warm)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;padding:24px 0 72px}
.card{display:block;background:var(--panel);border:1px solid var(--line);border-radius:16px;overflow:hidden;color:inherit;text-decoration:none;transition:transform .2s,border-color .2s}
.card:hover{transform:translateY(-3px);border-color:rgba(255,179,107,.45)}
.card:focus-visible{outline:2px solid var(--cool);outline-offset:3px}
.thumb{position:relative;aspect-ratio:16/10;background:#0e0c0a}
.thumb img{width:100%;height:100%;object-fit:cover;display:block}
.ph{width:100%;height:100%;background:radial-gradient(60% 70% at 70% 40%,rgba(125,211,252,.35),transparent 70%),radial-gradient(50% 60% at 25% 70%,rgba(255,179,107,.3),transparent 70%)}
.badge{position:absolute;left:12px;top:12px;font:500 10px/1 "DM Mono",monospace;letter-spacing:.14em;text-transform:uppercase;background:rgba(10,10,10,.6);border:1px solid rgba(125,211,252,.5);color:var(--cool);border-radius:999px;padding:6px 9px}
.body{padding:16px 18px 20px}
.kicker{font:500 11px/1.4 "DM Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--quiet)}
.card h2{font:700 22px/1.2 Outfit,"Noto Sans KR",sans-serif;margin:8px 0 6px}
.card p{margin:0;color:var(--quiet);font-size:15px}
footer{border-top:1px solid var(--line);padding:28px 0 40px;color:var(--quiet);font-size:13px}
footer a{color:var(--quiet)}
@media (max-width:640px){.wrap{padding:0 16px}.hero{padding:32px 0 24px}.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
<header>
  <a class="logo" href="${BASE}/">${esc(b.name.slice(0, 4))}<span>${esc(b.name.slice(4))}</span></a>
  <div class="lang" role="group" aria-label="Language">
    <button type="button" data-lang="ko" aria-pressed="true">KO</button>
    <button type="button" data-lang="en" aria-pressed="false">EN</button>
  </div>
</header>
<section class="hero">
  <div class="k" data-ko="인터랙티브 과학 실험실" data-en="Interactive science labs">인터랙티브 과학 실험실</div>
  <h1 data-ko="${esc(b.taglineKo)}" data-en="${esc(b.taglineEn)}">${esc(b.taglineKo)}</h1>
  <p data-ko="교과서 그림은 멈춰 있습니다. 여기서는 다이얼을 돌리면 압력·파동·전류가 눈앞에서 바뀝니다. 설치 없이 브라우저에서 바로 열립니다." data-en="Textbook diagrams stand still. Here, turn a dial and watch pressure, waves and current change in front of you. Runs in any browser, no install.">교과서 그림은 멈춰 있습니다. 여기서는 다이얼을 돌리면 압력·파동·전류가 눈앞에서 바뀝니다. 설치 없이 브라우저에서 바로 열립니다.</p>
  <div class="btns">${cta}</div>
</section>
<main class="grid">
${cards || '<p data-ko="곧 첫 실험실이 열립니다." data-en="The first lab opens soon.">곧 첫 실험실이 열립니다.</p>'}
</main>
<footer>
  <div>© ${new Date().getFullYear()} ${esc(b.name)}${cfg.contactEmail ? ` · <a href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>` : ''}</div>
  <div data-ko="3D 렌더링: three.js (MIT License). 모든 장면은 외부 이미지 없이 코드로 생성했습니다." data-en="3D rendering: three.js (MIT License). Every scene is generated in code, with no external images.">3D 렌더링: three.js (MIT License). 모든 장면은 외부 이미지 없이 코드로 생성했습니다.</div>
</footer>
</div>
<script>
(function(){
  var KEY='lb-lang';
  function apply(l){
    document.documentElement.lang=l;
    document.querySelectorAll('[data-ko]').forEach(function(el){el.textContent=el.getAttribute('data-'+l)||el.getAttribute('data-ko');});
    document.querySelectorAll('.lang button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.lang===l));});
    try{localStorage.setItem(KEY,l);}catch(e){}
  }
  var saved=null;try{saved=localStorage.getItem(KEY);}catch(e){}
  var l=saved||((navigator.language||'ko').toLowerCase().indexOf('ko')===0?'ko':'en');
  if(l!=='ko')apply(l);
  document.querySelectorAll('.lang button').forEach(function(b){b.addEventListener('click',function(){apply(b.dataset.lang);});});
})();
</script>
${analytics}
</body>
</html>
`;
}

// ---- 빌드 ----
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
copyDir(path.join(ROOT, 'shared'), path.join(OUT, '_shared'));

const labs = readLabs();
for (const { meta, dir, hasThumb } of labs) {
  const out = path.join(OUT, meta.slug);
  copyDir(dir, out);
  const file = path.join(out, 'index.html');
  fs.writeFileSync(file, injectLab(fs.readFileSync(file, 'utf8'), meta, meta.slug, hasThumb));
  console.log(`✓ ${BASE}/${meta.slug}/  ${meta.titleKo}${hasThumb ? '' : '  (thumb.jpg 없음)'}`);
}

fs.writeFileSync(path.join(OUT, 'index.html'), galleryHtml(labs));
// 하위 경로 배포일 때 dist 루트(*.pages.dev 첫 화면, 로컬 서버 /)는 갤러리로 넘긴다
if (BASE) fs.writeFileSync(path.join(DIST, 'index.html'), `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${BASE}/"><link rel="canonical" href="${origin || BASE}/"><a href="${BASE}/">${esc(cfg.brand.name)}</a>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ''}`);
if (origin) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ['', ...labs.map((l) => `${l.meta.slug}/`)].map((p) => `  <url><loc>${origin}/${p}</loc><lastmod>${today}</lastmod></url>`).join('\n');
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
} else {
  console.warn('! site.config.json의 domain이 비어 있어 sitemap.xml과 canonical을 만들지 않았습니다');
}
fs.writeFileSync(path.join(DIST, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n${BASE}/_shared/*\n  Cache-Control: public, max-age=3600\n`);
console.log(`완료: 실험실 ${labs.length}개 → dist${BASE}/`);
