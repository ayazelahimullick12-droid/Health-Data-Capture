// Tiny static file server for the Health Data Capture prototype. Usage: node serve.js [port]
// On Render (Node web service) the port comes from the PORT environment variable.
const http = require("http"), fs = require("fs"), path = require("path");
const root = __dirname, port = +(process.argv[2] || process.env.PORT || 8779);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".ttf": "font/ttf", ".ico": "image/x-icon" };
const ROUTES = { "/": "/index.html", "/web": "/web.html", "/dashboard": "/web.html" };
http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(req.url.split("?")[0]); } catch (e) { res.writeHead(400); return res.end("bad request"); }
  // "/web/" -> "/web" so the page's relative asset paths resolve from the site root
  if (p.length > 1 && p.endsWith("/")) { res.writeHead(301, { Location: p.replace(/\/+$/, "") }); return res.end(); }
  p = ROUTES[p] || p;
  const f = path.join(root, p);
  if (!f.startsWith(root + path.sep) || path.basename(f).startsWith(".") || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
  fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log("Health Data Capture prototype on http://localhost:" + port));
