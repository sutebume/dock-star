/* Stages the web game into www/ for Capacitor (only what the app needs). */
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var OUT = path.join(ROOT, 'www');

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  fs.readdirSync(src).forEach(function (f) {
    var s = path.join(src, f), d = path.join(dst, f);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  });
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(OUT, 'index.html'));
copyDir(path.join(ROOT, 'css'), path.join(OUT, 'css'));
copyDir(path.join(ROOT, 'js'), path.join(OUT, 'js'));
console.log('www/ staged: index.html, css/, js/');
