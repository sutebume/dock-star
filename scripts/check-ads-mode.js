/* Release guard: stops a test-ads build from shipping by accident.

   Fails when:
     1. TEST_ADS (js/ads.js) and initializeForTesting (capacitor.config.json)
        disagree — they must always match, or the SDK and the ad unit ids
        end up in different modes.
     2. Test ads are on and ALLOW_TEST_ADS is not exactly "true".

   To build WITH test ads, start the Codemagic build with the environment
   variable ALLOW_TEST_ADS=true. That is a deliberate per-build action, so a
   normal build can never carry test ads to the App Store. */
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var FAIL = [];

function read(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
  catch (e) { FAIL.push('cannot read ' + rel + ': ' + e.message); return null; }
}

/* --- TEST_ADS in js/ads.js --- */
var ads = read('js/ads.js');
var testAds = null;
if (ads) {
  var m = ads.match(/^\s*var\s+TEST_ADS\s*=\s*(true|false)\s*;/m);
  if (!m) FAIL.push('could not find "var TEST_ADS = true|false;" in js/ads.js');
  else testAds = m[1] === 'true';
}

/* --- initializeForTesting in capacitor.config.json --- */
var cfgRaw = read('capacitor.config.json');
var initForTesting = null;
if (cfgRaw) {
  try {
    var cfg = JSON.parse(cfgRaw);
    var admob = (cfg.plugins || {}).AdMob || {};
    if (!('initializeForTesting' in admob)) FAIL.push('plugins.AdMob.initializeForTesting missing from capacitor.config.json');
    else initForTesting = admob.initializeForTesting === true;
  } catch (e) {
    FAIL.push('capacitor.config.json is not valid JSON: ' + e.message);
  }
}

/* --- 1. the two flags must agree --- */
if (testAds !== null && initForTesting !== null && testAds !== initForTesting) {
  FAIL.push(
    'ad mode mismatch: js/ads.js TEST_ADS=' + testAds +
    ' but capacitor.config.json initializeForTesting=' + initForTesting +
    ' — set both to the same value'
  );
}

/* --- 2. test ads need an explicit opt-in --- */
var allow = String(process.env.ALLOW_TEST_ADS || '').trim().toLowerCase() === 'true';
if (testAds === true && !allow) {
  FAIL.push(
    'TEST ADS ARE ENABLED and ALLOW_TEST_ADS is not "true".\n' +
    '    This build would ship Google placeholder ads and earn no revenue.\n' +
    '    For a RELEASE build: set TEST_ADS=false in js/ads.js and\n' +
    '      "initializeForTesting": false in capacitor.config.json.\n' +
    '    For a TEST build:    start the Codemagic build with ALLOW_TEST_ADS=true.'
  );
}

if (FAIL.length) {
  console.error('\n\u2716 Ad mode check FAILED\n');
  FAIL.forEach(function (f) { console.error('  - ' + f); });
  console.error('');
  process.exit(1);
}

if (testAds) {
  console.log('\u26a0  Ad mode: TEST ADS (placeholder ads, no revenue) — allowed via ALLOW_TEST_ADS=true');
} else {
  console.log('\u2713 Ad mode: LIVE ads (TEST_ADS=false, initializeForTesting=false)');
}
