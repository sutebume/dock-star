/* Dock Star — payments abstraction.
   The game only ever talks to DS.payments. In the web/dev build a mock
   provider simulates the store purchase sheet; in the store build the
   mock is swapped for a real billing provider (e.g. RevenueCat via
   Capacitor) without touching the shop UI.
   Product ids here must match the products created in App Store
   Connect / Play Console. Prices shown are placeholders — real builds
   read localized prices from the store at runtime. */
window.DS = window.DS || {};

DS.payments = (function () {
  var CATALOG = [
    { id: 'no_ads',    type: 'nonconsumable', title: 'Remove Ads',  price: '$2.99' },
    { id: 'gems_100',  type: 'consumable', title: '100 gems',    price: '$1.99', gems: 100 },
    { id: 'gems_550',  type: 'consumable', title: '550 gems',    price: '$7.99', gems: 550, badge: 'BEST VALUE' },
    { id: 'gems_1200', type: 'consumable', title: '1,200 gems',  price: '$14.99', gems: 1200 }
  ];

  function product(id) {
    for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) return CATALOG[i];
    return null;
  }

  var record = { owned: [] };
  try {
    var raw = localStorage.getItem('dockstar-store-record');
    if (raw) {
      var r = JSON.parse(raw);
      if (r && typeof r === 'object') record.owned = r.owned || [];
    }
  } catch (e) {}
  function saveRecord() {
    try { localStorage.setItem('dockstar-store-record', JSON.stringify(record)); } catch (e) {}
  }

  var sheetResolve = null;
  function showSheet(p) {
    return new Promise(function (resolve) {
      sheetResolve = resolve;
      document.getElementById('sheet-title').textContent = p.title;
      document.getElementById('sheet-price').textContent = p.price;
      document.getElementById('overlay-store').hidden = false;
    });
  }
  function closeSheet(ok) {
    document.getElementById('overlay-store').hidden = true;
    if (sheetResolve) { sheetResolve(ok); sheetResolve = null; }
  }

  function applyPurchase(p) {
    var d = DS.state.data;
    if (p.gems) d.gems += p.gems;
    if (p.id === 'no_ads') d.ent.noAds = true;
    DS.state.save();
  }

  return {
    catalog: function () { return CATALOG.slice(); },
    product: product,

    purchase: function (id) {
      var p = product(id);
      if (!p) return Promise.resolve({ ok: false, error: 'unknown_product' });
      return showSheet(p).then(function (ok) {
        if (!ok) return { ok: false, error: 'cancelled' };
        if (p.type === 'nonconsumable' && record.owned.indexOf(p.id) < 0) record.owned.push(p.id);
        saveRecord();
        applyPurchase(p);
        DS.sfx.win();
        return { ok: true, productId: p.id };
      });
    },

    restore: function () {
      var d = DS.state.data;
      var n = 0;
      for (var i = 0; i < record.owned.length; i++) {
        if (record.owned[i] === 'no_ads' && !d.ent.noAds) { d.ent.noAds = true; n++; }
      }
      DS.state.save();
      return Promise.resolve({ ok: true, restored: n });
    },

    adFree: function () {
      return !!DS.state.data.ent.noAds;
    },

    init: function () {
      document.getElementById('sheet-buy').addEventListener('click', function () { closeSheet(true); });
      document.getElementById('sheet-cancel').addEventListener('click', function () { closeSheet(false); });
    }
  };
})();
