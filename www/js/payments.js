/* Dock Star — payments.
   Native (Capacitor): RevenueCat @revenuecat/purchases-capacitor v13+
   Browser/dev: mock purchase sheet for local testing */
window.DS = window.DS || {};

DS.payments = (function () {
  /* RevenueCat PUBLIC SDK keys — platform specific. Configuring with the
     wrong platform's key makes configure() fail, so getOfferings() returns
     nothing and no purchase can complete. These are public keys, safe to
     ship in the app bundle; the private .p8 lives only in RevenueCat. */
  var RC_API_KEYS = {
    ios: 'appl_LrytraTOjdTSvMfRbtcMjkJQsDO',
    android: 'goog_EibuKkyywsysRVwbPsVGzoTXFHH'
  };

  function rcApiKey() {
    var plat = 'android';
    try {
      if (typeof Capacitor !== 'undefined' && Capacitor.getPlatform) plat = Capacitor.getPlatform();
    } catch (e) {}
    return RC_API_KEYS[plat] || RC_API_KEYS.android;
  }

  /* Fallback catalog — prices updated from store at runtime via getOfferings */
  var CATALOG = [
    { id: 'no_ads',    type: 'nonconsumable', title: 'Remove Ads',   price: '$1.99', gems: 0 },
    { id: 'gems_100',  type: 'consumable',    title: '100 Gems',     price: '$0.99', gems: 100 },
    { id: 'gems_550',  type: 'consumable',    title: '550 Gems',     price: '$1.39', gems: 550 },
    { id: 'gems_1200', type: 'consumable',    title: '1,200 Gems',   price: '$1.99', gems: 1200, badge: 'BEST VALUE' }
  ];

  function product(id) {
    for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) return CATALOG[i];
    return null;
  }

  /* ── RevenueCat native bridge ──────────────────────────────────────── */

  function getPlugin() {
    try {
      if (typeof Capacitor !== 'undefined' &&
          Capacitor.isNativePlatform &&
          Capacitor.isNativePlatform() &&
          Capacitor.Plugins &&
          Capacitor.Plugins.Purchases) {
        return Capacitor.Plugins.Purchases;
      }
    } catch (e) {}
    return null;
  }

  function applyCustomerInfo(info) {
    try {
      var active = info && info.entitlements && info.entitlements.active;
      if (active && active['no_ads']) {
        DS.state.data.ent.noAds = true;
        DS.state.save();
      }
    } catch (e) {}
  }

  function applyPurchase(cat) {
    if (cat.gems) DS.state.data.gems += cat.gems;
    if (cat.id === 'no_ads') DS.state.data.ent.noAds = true;
    DS.state.save();
  }

  /* Last known store state, for diagnosing a shop that will not sell.
     Read it with DS.payments.status() from Safari Web Inspector. */
  var diag = { configured: false, offerings: null, packages: [], error: null };

  /* configure() must happen before any other Purchases call. DOMContentLoaded
     can fire before Capacitor has registered its native plugins, so doing it
     once at boot is unreliable: getPlugin() returns null, we bail, and every
     later purchase fails with CONFIGURATION_ERROR. Configure lazily instead,
     memoised, and have every entry point await it. */
  var configuring = null;
  var CONFIGURE_TIMEOUT_MS = 2500;
  var OFFERINGS_TIMEOUT_MS = 12000;

  /* A bridge call that never settles must not hang the shop forever. */
  function withTimeout(promise, ms, label) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var t = setTimeout(function () {
        if (done) return;
        done = true;
        diag.error = label + ': timed out';
        reject(label + '_timeout');
      }, ms);
      promise.then(function (v) {
        if (done) return;
        done = true; clearTimeout(t); resolve(v);
      }, function (e) {
        if (done) return;
        done = true; clearTimeout(t); reject(e);
      });
    });
  }

  /* configure() applies natively as soon as the bridge receives it, but over
     the raw Capacitor bridge its promise does not reliably settle. Awaiting
     it outright leaves purchases hanging forever, so race it against a
     timeout and carry on: a later getOfferings() is the real proof that
     configuration took. */
  function ensureConfigured() {
    if (configuring) return configuring;
    var p = getPlugin();
    if (!p) {
      diag.error = 'plugin not available';
      return Promise.reject('no_plugin');
    }

    configuring = new Promise(function (resolve) {
      var done = false;
      function finish(how) {
        if (done) return;
        done = true;
        diag.configured = how;                    /* 'ok' | 'assumed' */
        resolve();
      }

      setTimeout(function () { finish('assumed'); }, CONFIGURE_TIMEOUT_MS);

      try {
        var r = p.configure({ apiKey: rcApiKey() });
        if (r && typeof r.then === 'function') {
          r.then(function () { finish('ok'); },
                 function (e) {
                   diag.error = 'configure: ' + ((e && e.message) || e);
                   finish('assumed');
                 });
        } else {
          finish('ok');                           /* synchronous plugin */
        }
      } catch (e) {
        diag.error = 'configure threw: ' + ((e && e.message) || e);
        finish('assumed');
      }
    });

    return configuring;
  }

  function refreshOfferings() {
    var p = getPlugin();
    return withTimeout(p.getOfferings(), OFFERINGS_TIMEOUT_MS, 'getOfferings').then(function (r) {
      diag.offerings = r && r.current ? (r.current.identifier || 'current') : 'none';
      diag.error = null;                 /* offerings resolved: clear stale errors */
      var pkgs = (r.current && r.current.availablePackages) || [];
      diag.packages = pkgs.map(function (pkg) {
        return (pkg.product && pkg.product.identifier) || '?';
      });
      pkgs.forEach(function (pkg) {
        var pid = pkg.product && pkg.product.identifier;
        var cat = product(pid);
        if (cat && pkg.product.priceString) cat.price = pkg.product.priceString;
      });
      return r;
    });
  }

  function rcInit() {
    if (!getPlugin()) {
      /* Bridge not up yet — retry briefly rather than giving up silently. */
      diag.error = 'plugin not ready at init, retrying';
      var tries = 0;
      var t = setInterval(function () {
        tries++;
        if (getPlugin()) { clearInterval(t); rcInit(); }
        else if (tries >= 20) { clearInterval(t); diag.error = 'plugin never appeared'; }
      }, 250);
      return;
    }

    ensureConfigured().then(function () {
      var p = getPlugin();
      /* Restore entitlements silently on launch */
      p.getCustomerInfo()
        .then(function (r) { applyCustomerInfo(r.customerInfo); })
        .catch(function (e) { diag.error = 'getCustomerInfo: ' + ((e && e.message) || e); });
      /* Pre-fetch offerings to get real localized prices */
      return refreshOfferings();
    }).then(function () {
      if (DS.ui && DS.ui.refreshShop) DS.ui.refreshShop();
    }).catch(function (e) {
      if (!diag.error) diag.error = 'init: ' + ((e && e.message) || e);
    });
  }

  function rcPurchase(id) {
    var p = getPlugin();
    if (!p) return Promise.reject('no_plugin');
    return ensureConfigured().then(function () {
      return withTimeout(p.getOfferings(), OFFERINGS_TIMEOUT_MS, 'getOfferings');
    }).then(function (r) {
      var pkgs = (r.current && r.current.availablePackages) || [];
      var pkg = null;
      for (var i = 0; i < pkgs.length; i++) {
        if (pkgs[i].product && pkgs[i].product.identifier === id) {
          pkg = pkgs[i]; break;
        }
      }
      if (!pkg) return Promise.reject('product_not_found: ' + id);
      return p.purchasePackage({ aPackage: pkg });
    }).then(function (result) {
      applyCustomerInfo(result.customerInfo);
      var cat = product(id);
      if (cat) applyPurchase(cat);
      DS.sfx.win();
      return { ok: true, productId: id };
    });
  }

  function rcRestore() {
    var p = getPlugin();
    if (!p) return Promise.reject('no_plugin');
    return ensureConfigured().then(function () {
      return p.restorePurchases();
    }).then(function (r) {
      applyCustomerInfo(r.customerInfo);
      return { ok: true, restored: r.customerInfo ? 1 : 0 };
    });
  }

  /* ── Mock / browser path ───────────────────────────────────────────── */

  var sheetResolve = null;
  function showSheet(cat) {
    return new Promise(function (resolve) {
      sheetResolve = resolve;
      document.getElementById('sheet-title').textContent = cat.title;
      document.getElementById('sheet-price').textContent = cat.price;
      document.getElementById('overlay-store').hidden = false;
    });
  }
  function closeSheet(ok) {
    document.getElementById('overlay-store').hidden = true;
    if (sheetResolve) { sheetResolve(ok); sheetResolve = null; }
  }

  function mockPurchase(id) {
    var cat = product(id);
    if (!cat) return Promise.resolve({ ok: false, error: 'unknown_product' });
    return showSheet(cat).then(function (ok) {
      if (!ok) return { ok: false, error: 'cancelled' };
      applyPurchase(cat);
      DS.sfx.win();
      return { ok: true, productId: id };
    });
  }

  /* ── Public API ────────────────────────────────────────────────────── */

  return {
    catalog: function () { return CATALOG.slice(); },
    product: product,

    purchase: function (id) {
      if (getPlugin()) {
        return rcPurchase(id).catch(function (err) {
          /* Dismissing the sheet reports userCancelled on some platforms and
             only PurchasesErrorCode 1 (PURCHASE_CANCELLED) on others. */
          var code = err && (err.code !== undefined ? err.code : err);
          var cancelled = !!(err && err.userCancelled) ||
                          String(code) === '1' ||
                          String(code) === 'PURCHASE_CANCELLED';
          return { ok: false, error: cancelled ? 'cancelled' : String(err && err.code || err || 'purchase_failed') };
        });
      }
      return mockPurchase(id);
    },

    restore: function () {
      if (getPlugin()) {
        return rcRestore().catch(function () {
          return { ok: false, error: 'restore_failed' };
        });
      }
      return Promise.resolve({ ok: true, restored: 0 });
    },

    adFree: function () {
      return !!DS.state.data.ent.noAds;
    },

    /* True in the browser, where purchases are faked and the prices shown
       are the hardcoded fallbacks rather than real store prices. */
    isMock: function () {
      return !getPlugin();
    },

    /* Store diagnostics: whether RevenueCat configured, which offering came
       back, which product ids it carries, and the last error. */
    status: function () {
      return {
        native: !!getPlugin(),
        platform: (function () {
          try { return Capacitor.getPlatform(); } catch (e) { return 'web'; }
        })(),
        keyPrefix: rcApiKey().split('_')[0],
        configured: diag.configured,
        offering: diag.offerings,
        packages: diag.packages,
        error: diag.error
      };
    },

    init: function () {
      document.getElementById('sheet-buy').addEventListener('click', function () { closeSheet(true); });
      document.getElementById('sheet-cancel').addEventListener('click', function () { closeSheet(false); });
      rcInit();
    }
  };
})();
