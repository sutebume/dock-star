/* Dock Star dev server — static files + scores API. No dependencies. */
var http = require('http');
var fs = require('fs');
var path = require('path');

var ROOT = __dirname;
var PORT = process.env.PORT || 8347;
var SCORES_FILE = path.join(ROOT, 'scores.json');
var profanity = require('./js/profanity.js');

var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

/* ---- scores helpers ---- */
function loadScores() {
  try { return JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8')) || []; } catch (e) { return []; }
}
function saveScores(arr) {
  try { fs.writeFileSync(SCORES_FILE, JSON.stringify(arr)); } catch (e) {}
}
/* Every player, best score per level summed, ranked 1..N. */
function rankAll(entries) {
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
  rows.forEach(function (r, i) { r.rank = i + 1; });
  return rows;
}

var TOP_N = 20;
var BOTTOM_N = 3;

/* Legacy shape for app builds that only know GET /api/scores: a bare array. */
function buildLeaderboard(entries) {
  return rankAll(entries).slice(0, TOP_N).map(function (r) {
    return { name: r.name, levels: r.levels, score: r.score, perfect: r.perfect };
  });
}

/* Richer board: top 20, the asking player's own row, the last 3, and the
   total number of ranked players. */
function buildBoard(entries, name) {
  var all = rankAll(entries);
  var key = String(name || '').trim().toLowerCase();
  var me = null;
  if (key) {
    for (var i = 0; i < all.length; i++) {
      if (all[i].name.toLowerCase() === key) { me = all[i]; break; }
    }
  }
  var bottom = all.length > TOP_N
    ? all.slice(Math.max(TOP_N, all.length - BOTTOM_N))
    : [];
  return { total: all.length, top: all.slice(0, TOP_N), me: me, bottom: bottom };
}

/* ---- server ---- */
http.createServer(function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  /* GET /api/leaderboard?name=X — top 20, caller's rank, bottom 3, total */
  if (req.url.split('?')[0] === '/api/leaderboard' && req.method === 'GET') {
    var q = new URL(req.url, 'http://localhost').searchParams;
    var board = buildBoard(loadScores(), q.get('name'));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(board));
    return;
  }

  /* GET /api/scores — top 20 leaderboard (kept for older app builds) */
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
        /* Leaderboard names are user-generated content shown to every
           player; reject anything the filter flags. */
        if (name && !profanity.isClean(name)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end('{"ok":false,"error":"name_rejected"}');
          return;
        }
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

  /* GET /privacy — privacy policy page */
  if (req.url === '/privacy' && req.method === 'GET') {
    var ppFile = path.join(ROOT, 'privacy-policy.html');
    fs.readFile(ppFile, function (err, data) {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  /* Static files */
  var urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  var file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  /* Never serve dotfiles/dot-dirs: the VPS runs from a git clone, so
     without this /.git/config and the whole repo history were public. */
  if (urlPath.split('/').some(function (seg) { return seg.charAt(0) === '.'; })) {
    res.writeHead(404); res.end('not found'); return;
  }
  fs.readFile(file, function (err, data) {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, function () {
  console.log('Dock Star on http://localhost:' + PORT);
});
