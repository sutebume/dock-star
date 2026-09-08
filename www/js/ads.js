/* Dock Star — AdMob interstitial wrapper.
   Real AdMob in Capacitor native; fake countdown overlay in browser. */
window.DS = window.DS || {};

DS.ads = (function () {
  var AD_UNIT_ID = 'ca-app-pub-9105653107748286/6116623221';
  var adReady = false;

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
    p.prepareInterstitial({ adId: AD_UNIT_ID })
      .then(function () { adReady = true; })
      .catch(function () { adReady = false; });
  }

  function init() {
    var p = getPlugin();
    if (!p) return;
    p.initialize({ initializeForTesting: false })
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
