// 로컬 개발·검증 서버.
// - 정적 파일 제공 (--root, 기본 dist)
// - POST /__save/<name>  본문의 data URL(이미지)을 --shots 폴더(기본 ./shots)에 저장 → 실험실의 __lab.capture()가 사용
// 사용: node tools/serve.mjs [--root dist] [--port 5180] [--shots shots]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const arg = (name, def) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : def; };
const ROOT = path.resolve(arg('root', 'dist'));
const SHOTS = path.resolve(arg('shots', 'shots'));
let port = Number(arg('port', process.env.PORT || 5180));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4',
};

function save(req, res, name) {
  const safe = path.basename(decodeURIComponent(name)).replace(/[^\w.\-]/g, '_');
  if (!safe || safe.startsWith('.')) { res.writeHead(400).end('bad name'); return; }
  const chunks = [];
  let size = 0;
  req.on('data', (c) => { size += c.length; if (size > 64 * 1024 * 1024) req.destroy(); else chunks.push(c); });
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');
    const m = body.match(/^data:[^;]+;base64,(.+)$/s);
    if (!m) { res.writeHead(400).end('expected data URL'); return; }
    fs.mkdirSync(SHOTS, { recursive: true });
    const file = path.join(SHOTS, safe);
    fs.writeFileSync(file, Buffer.from(m[1], 'base64'));
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ saved: file }));
    console.log(`saved ${file}`);
  });
}

function serveFile(req, res) {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!rel.endsWith('/')) { res.writeHead(301, { location: rel + '/' }).end(); return; }
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404'); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  const m = req.url.match(/^\/__save\/(.+)$/);
  if (req.method === 'POST' && m) return save(req, res, m[1]);
  if (req.method === 'GET' || req.method === 'HEAD') return serveFile(req, res);
  res.writeHead(405).end();
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE' || e.code === 'EACCES') { console.warn(`port ${port} 사용 불가 → ${port + 1}`); port += 1; server.listen(port); }
  else throw e;
});
server.listen(port, () => console.log(`serving ${ROOT} → http://localhost:${port}  (shots → ${SHOTS})`));
