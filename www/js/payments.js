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

  function rcInit() {
    var p = getPlugin();
    if (!p) return;
    p.configure({ apiKey: rcApiKey() }).catch(function () {});
    /* Restore entitlements silently on launch */
    p.getCustomerInfo()
      .then(function (r) { applyCustomerInfo(r.customerInfo); })
      .catch(function () {});
    /* Pre-fetch offerings to get real localized prices */
    p.getOfferings()
      .then(function (r) {
        var pkgs = (r.current && r.current.availablePackages) || [];
        pkgs.forEach(function (pkg) {
          var pid = pkg.product && pkg.product.identifier;
          var cat = product(pid);
          if (cat && pkg.product.priceString) cat.price = pkg.product.priceString;
        });
      })
      .catch(function () {});
  }

  function rcPurchase(id) {
    var p = getPlugin();
    if (!p) return Promise.reject('no_plugin');
    return p.getOfferings().then(function (r) {
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
    return p.restorePurchases().then(function (r) {
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
          /* err.userCancelled is true when the user dismisses the Play sheet */
          var cancelled = err && err.userCancelled;
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

    init: function () {
      document.getElementById('sheet-buy').addEventListener('click', function () { closeSheet(true); });
      document.getElementById('sheet-cancel').addEventListener('click', function () { closeSheet(false); });
      rcInit();
    }
  };
})();
