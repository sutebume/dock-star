/* Dock Star dev server — static files + scores API. No dependencies. */
var http = require('http');
var fs = require('fs');
var path = require('path');

var ROOT = __dirname;
var PORT = process.env.PORT || 8347;
var SCORES_FILE = path.join(ROOT, 'scores.json');

var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

/* ---- scores helpers ---- */
function loadScores() {
  try { return JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8')) || []; } catch (e) { return []; }
}
function saveScores(arr) {
  try { fs.writeFileSync(SCORES_FILE, JSON.stringify(arr)); } catch (e) {}
}
function buildLeaderboard(entries) {
  var best = {};
  entries.forEach(function (e) {
    if (!best[e.name]) best[e.name] = {};
    var cur = best[e.name][e.levelIdx];
    if (!cur || e.total > cur.total) best[e.name][e.levelIdx] = { total: e.total, stars: e.stars };
  });
  var rows = Object.keys(best).map(function (name) {
    var lvs = Object.keys(best[name]);
    var score = lvs.reduce(function (s, i) { return s + best[name][i].total; }, 0);
    var perfect = lvs.filter(function (i) { return best[name][i].stars === 3; }).length;
    return { name: name, levels: lvs.length, score: score, perfect: perfect };
  });
  rows.sort(function (a, b) { return b.score - a.score; });
  return rows.slice(0, 20);
}

/* ---- server ---- */
http.createServer(function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  /* GET /api/scores — top 20 leaderboard */
  if (req.url === '/api/scores' && req.method === 'GET') {
    var lb = buildLeaderboard(loadScores());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(lb));
    return;
  }

  /* POST /api/scores — submit a level result */
  if (req.url === '/api/scores' && req.method === 'POST') {
    var body = '';
    req.on('data', function (chunk) { body += chunk.toString(); });
    req.on('end', function () {
      try {
        var d = JSON.parse(body);
        var name = String(d.name || '').trim().replace(/[<>"]/g, '').slice(0, 20);
        var levelIdx = Math.max(0, parseInt(d.levelIdx) || 0);
        var total    = Math.max(0, parseInt(d.total)    || 0);
        var stars    = Math.min(3, Math.max(0, parseInt(d.stars) || 0));
        var lvName   = String(d.levelName || '').slice(0, 40);
        if (name && total > 0) {
          var entries = loadScores();
          entries.push({ name: name, levelIdx: levelIdx, levelName: lvName, total: total, stars: stars, ts: Date.now() });
          if (entries.length > 10000) entries = entries.slice(-10000);
          saveScores(entries);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch (e) { res.writeHead(400); res.end('{"ok":false}'); }
    });
    return;
  }

  /* Static files */
  var urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  var file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, function (err, data) {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, function () {
  console.log('Dock Star on http://localhost:' + PORT);
});
