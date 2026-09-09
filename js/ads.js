/* Dock Star — AdMob interstitial wrapper.
   Real AdMob in Capacitor native; fake countdown overlay in browser. */
window.DS = window.DS || {};

DS.ads = (function () {
  /* ---- TEST ADS SWITCH ----------------------------------------------
     true  = Google's official test ad units + test mode. Always fill, so
             interstitials are visible on TestFlight / internal builds even
             though the app is not published yet. Shows a "Test Ad" label.
     false = real ad units and real revenue. REQUIRED for App Store release.

     Must match "initializeForTesting" in capacitor.config.json.
     SET BOTH BACK TO false BEFORE SUBMITTING FOR REVIEW.
  -------------------------------------------------------------------- */
  var TEST_ADS = false;

  var LIVE_AD_UNIT_ID = 'ca-app-pub-9105653107748286/6116623221';
  /* Google's public test interstitial units — never serve real ads. */
  var TEST_AD_UNIT_IOS = 'ca-app-pub-3940256099942544/4411468910';
  var TEST_AD_UNIT_ANDROID = 'ca-app-pub-3940256099942544/1033173712';

  var adReady = false;

  function platform() {
    try {
      if (typeof Capacitor !== 'undefined' && Capacitor.getPlatform) return Capacitor.getPlatform();
    } catch (e) {}
    return 'web';
  }

  function adUnitId() {
    if (!TEST_ADS) return LIVE_AD_UNIT_ID;
    return platform() === 'android' ? TEST_AD_UNIT_ANDROID : TEST_AD_UNIT_IOS;
  }

  function getPlugin() {
    try {
      if (typeof Capacitor !== 'undefined' &&
          Capacitor.isNativePlatform &&
          Capacitor.isNativePlatform() &&
          Capacitor.Plugins &&
          Capacitor.Plugins.AdMob) {
        return Capacitor.Plugins.AdMob;
      }
    } catch (e) {}
    return null;
  }

  function preload() {
    var p = getPlugin();
    if (!p) return;
    adReady = false;
    p.prepareInterstitial({ adId: adUnitId() })
      .then(function () { adReady = true; })
      .catch(function () { adReady = false; });
  }

  function init() {
    var p = getPlugin();
    if (!p) return;
    p.initialize({ initializeForTesting: TEST_ADS })
      .then(function () { preload(); })
      .catch(function () {});
  }

  function showNative() {
    var p = getPlugin();
    if (!p || !adReady) return Promise.resolve();
    adReady = false;
    return p.showInterstitial()
      .then(function () { preload(); })
      .catch(function () { preload(); });
  }

  function showFake() {
    return new Promise(function (resolve) {
      var overlay = document.getElementById('overlay-ad');
      var skipBtn = document.getElementById('ad-skip');
      if (!overlay || !skipBtn) { resolve(); return; }
      var secs = 5;
      skipBtn.disabled = true;
      skipBtn.innerHTML = '<span id="ad-countdown">' + secs + '</span>';
      overlay.hidden = false;
      var timer = setInterval(function () {
        secs--;
        var c = document.getElementById('ad-countdown');
        if (secs <= 0) {
          clearInterval(timer);
          skipBtn.disabled = false;
          skipBtn.textContent = 'SKIP AD ×';
        } else if (c) {
          c.textContent = secs;
        }
      }, 1000);
      skipBtn.onclick = function () {
        if (skipBtn.disabled) return;
        clearInterval(timer);
        overlay.hidden = true;
        resolve();
      };
    });
  }

  function show() {
    if (getPlugin()) return showNative();
    return showFake();
  }

  return { init: init, show: show };
})();
