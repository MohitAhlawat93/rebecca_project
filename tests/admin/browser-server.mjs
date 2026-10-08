import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = process.cwd();
const files = new Set([
  '/admin.html', '/admin.css', '/admin-search.css',
  '/admin.js', '/admin-guide.js', '/admin-publishing.js',
  '/admin-media-upload.js', '/admin-search.js', '/favicon.svg'
]);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml' };
const port = Number(process.env.RC_BROWSER_TEST_PORT || 4179);

http.createServer(async (req, res) => {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  const name = pathname === '/admin' ? '/admin.html' : pathname;
  if (!['GET','HEAD'].includes(req.method || 'GET') || !files.has(name)) {
    res.writeHead(404, {'Content-Type':'text/plain'}).end('Test server: missing fixture');
    return;
  }
  const file = resolve(root, '.' + name);
  if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control':'no-store',
      'X-Robots-Tag':'noindex, nofollow'
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404).end('File unavailable');
  }
}).listen(port, '127.0.0.1', () => {
  process.stdout.write('RC-QA-05 browser fixtures ready on http://127.0.0.1:' + port + '\n');
});
