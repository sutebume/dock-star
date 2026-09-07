/* Dock Star — screens, HUD, console input, persistence. */
window.DS = window.DS || {};

DS.API_BASE = (typeof cordova !== 'undefined' || window.location.protocol === 'file:')
  ? 'https://dockstar.openagentarena.net'
  : '';

/* ---------- persistence ---------- */
DS.state = (function () {
  var data = { name: '', stars: {}, scores: {}, coins: 0, gems: 0, skin: 'tug', owned: { tug: true }, ent: { noAds: false } };
  try {
    var raw = localStorage.getItem('dockstar-save');
    if (raw) {
      var p = JSON.parse(raw);
      if (p && typeof p === 'object') {
        data.name = p.name || '';
        data.stars = p.stars || {};
        data.scores = p.scores || {};
        data.coins = p.coins || 0;
        data.gems = p.gems || 0;
        data.skin = p.skin || 'tug';
        data.owned = p.owned || { tug: true };
        var e = p.ent || {};
        data.ent = { noAds: !!(e.noAds || e.midPack || e.hardPack) }; // migrate old packs → noAds
      }
    }
  } catch (e) {}
  function save() {
    try { localStorage.setItem('dockstar-save', JSON.stringify(data)); } catch (e) {}
  }
  return {
    data: data,
    save: save,
    starsFor: function (i) { return data.stars[i] || 0; },
    setStars: function (i, s) { if (s > (data.stars[i] || 0)) { data.stars[i] = s; save(); } },
    setScore: function (i, total) { if (total > (data.scores[i] || 0)) { data.scores[i] = total; save(); } },
    bestScore: function (i) { return data.scores[i] || 0; },
    unlockedCount: function () {
      var n = 1;
      for (var i = 0; i < DS.LEVELS.length; i++) if (data.stars[i]) n = Math.max(n, i + 2);
      return Math.min(n, DS.LEVELS.length);
    },
    tierLocked: function () { return null; },
    addCoins: function (c) { data.coins += c; save(); },
    addGems: function (g) { data.gems += g; save(); },
    currentSkin: function () {
      for (var i = 0; i < DS.SKINS.length; i++) if (DS.SKINS[i].id === data.skin) return DS.SKINS[i];
      return DS.SKINS[0];
    }
  };
})();

/* ---------- helpers ---------- */
DS.ui = (function () {
  function $(id) { return document.getElementById(id); }
  function fmtTime(t) {
    t = Math.max(0, Math.ceil(t));
    var m = Math.floor(t / 60), s = t % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  var game = null;
  var currentLevel = 0;

  function show(id) {
    var screens = ['screen-home', 'screen-map', 'screen-shop', 'screen-game', 'screen-name', 'screen-leaderboard'];
    screens.forEach(function (s) { $(s).hidden = (s !== id); });
    if (id !== 'screen-game' && game) { game.stop(); }
    if (id === 'screen-home') renderHome();
    if (id === 'screen-map') renderMap();
    if (id === 'screen-shop') renderShop();
    if (id === 'screen-leaderboard') renderLeaderboard();
  }

  /* ---------- home ---------- */
  function renderHome() {
    $('home-coins').textContent = DS.state.data.coins.toLocaleString();
    $('home-gems').textContent = DS.state.data.gems.toLocaleString();
    var next = DS.state.unlockedCount();
    var lvl = DS.LEVELS[next - 1];
    $('home-progress-label').textContent = lvl.zone;
    $('home-progress-level').textContent = 'Level ' + next + ' / ' + DS.LEVELS.length;
    var done = 0;
    for (var i = 0; i < DS.LEVELS.length; i++) if (DS.state.starsFor(i)) done++;
    $('home-progress-fill').style.width = Math.round(100 * done / DS.LEVELS.length) + '%';
  }

  /* ---------- map ---------- */
  function renderMap() {
    var wrap = $('map-list');
    wrap.innerHTML = '';
    var unlocked = DS.state.unlockedCount();
    var lastZone = '';
    for (var i = 0; i < DS.LEVELS.length; i++) {
      var L = DS.LEVELS[i];
      if (L.zone !== lastZone) {
        lastZone = L.zone;
        var z = null;
        for (var zi = 0; zi < DS.ZONES.length; zi++) if (DS.ZONES[zi].name === L.zone) z = DS.ZONES[zi];
        var banner = document.createElement('div');
        banner.className = 'zone-banner';
        banner.style.background = z ? z.color : '#FFC93C';
        if (z && z.dark) banner.style.color = '#FFFFFF';
        banner.textContent = L.zone + ' · ' + (z ? z.blurb : '');
        wrap.appendChild(banner);
      }
      var node = document.createElement('button');
      node.className = 'map-node';
      var tierLock = DS.state.tierLocked(i);
      var stars = DS.state.starsFor(i);
      if (tierLock) {
        node.classList.add('tier-locked');
        var packId = tierLock === 'mid' ? 'mid_pack' : 'hard_pack';
        node.innerHTML =
          '<span class="map-num">' + gemLockSvg() + '</span>' +
          '<span class="map-name">' + L.name + '<em>' + (L.mode === 'dock' ? 'Docking' : 'Undocking') + '</em></span>' +
          '<span class="tier-tag">UNLOCK</span>';
        (function (pid) {
          node.addEventListener('click', function () { DS.sfx.click(); buy(pid).then(function () { show('screen-map'); }); });
        })(packId);
      } else if (i >= unlocked) {
        node.classList.add('locked');
        node.innerHTML = '<span class="map-num">' + lockSvg() + '</span><span class="map-name">' + L.name + '</span>';
        node.disabled = true;
      } else {
        var starHtml = '';
        for (var s = 0; s < 3; s++) starHtml += starSvg(s < stars);
        node.innerHTML = '<span class="map-num">' + (i + 1) + '</span>' +
          '<span class="map-name">' + L.name + '<em>' + (L.mode === 'dock' ? 'Docking' : 'Undocking') + '</em></span>' +
          '<span class="map-stars">' + starHtml + '</span>';
        if (i === unlocked - 1 && !stars) node.classList.add('current');
        (function (idx) {
          node.addEventListener('click', function () { DS.sfx.click(); startLevel(idx); });
        })(i);
      }
      wrap.appendChild(node);
    }
  }

  function starSvg(fill) {
    return '<svg width="16" height="16" viewBox="0 0 54 54"><path d="M27 5 L33.5 19.5 L49 21 L37.5 31.5 L41 46.5 L27 38.5 L13 46.5 L16.5 31.5 L5 21 L20.5 19.5 Z" fill="' + (fill ? '#FFC93C' : '#C9D6DE') + '" stroke="#16324A" stroke-width="4" stroke-linejoin="round"/></svg>';
  }
  function lockSvg() {
    return '<svg width="16" height="18" viewBox="0 0 18 20"><rect x="2" y="8" width="14" height="10" rx="3" fill="#7C8B98"/><path d="M5 8 L5 6 C5 3.5 6.8 2 9 2 C11.2 2 13 3.5 13 6 L13 8" stroke="#7C8B98" stroke-width="2.5" fill="none"/></svg>';
  }
  function gemLockSvg() {
    return '<svg width="18" height="18" viewBox="0 0 22 22"><path d="M6 3 L16 3 L20 8 L11 19 L2 8 Z" fill="#FFC93C" stroke="#E0A820" stroke-width="2" stroke-linejoin="round"/></svg>';
  }

  /* ---------- interstitial ad ---------- */
  function maybeShowAd() {
    if (DS.payments.adFree()) return Promise.resolve();
    return new Promise(function (resolve) {
      var overlay = $('overlay-ad');
      var skipBtn = $('ad-skip');
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

  /* ---------- leaderboard ---------- */
  function renderLeaderboard() {
    var body = $('lb-body');
    body.innerHTML = '<div class="lb-loading">Loading scores…</div>';
    fetch(DS.API_BASE + '/api/scores').then(function (r) { return r.json(); }).then(function (rows) {
      if (!rows || rows.length === 0) {
        body.innerHTML = '<div class="lb-loading">No scores yet. Be the first!</div>';
        return;
      }
      var html = '<table class="lb-table"><thead><tr>' +
        '<th>#</th><th>CAPTAIN</th><th>LEVELS</th><th>SCORE</th><th>★★★</th>' +
        '</tr></thead><tbody>';
      var myName = DS.state.data.name;
      rows.forEach(function (row, idx) {
        var medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (idx + 1);
        var mine = myName && row.name.toLowerCase() === myName.toLowerCase();
        html += '<tr class="' + (mine ? 'lb-mine' : '') + '">' +
          '<td class="lb-rank">' + medal + '</td>' +
          '<td class="lb-name">' + escHtml(row.name) + '</td>' +
          '<td class="lb-lvl">' + row.levels + '</td>' +
          '<td class="lb-score">' + row.score.toLocaleString() + '</td>' +
          '<td class="lb-perfect">' + row.perfect + '</td>' +
          '</tr>';
      });
      html += '</tbody></table>';
      body.innerHTML = html;
    }).catch(function () {
      body.innerHTML = '<div class="lb-loading">Could not load scores. Try again later.</div>';
    });
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function submitScore(res) {
    var name = DS.state.data.name;
    if (!name) return;
    var L = DS.LEVELS[res.level];
    fetch(DS.API_BASE + '/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, levelIdx: res.level, levelName: L.name, total: res.total, stars: res.stars })
    }).catch(function () {});
  }

  function syncScores() {
    var name = DS.state.data.name;
    if (!name) return;
    for (var i = 0; i < DS.LEVELS.length; i++) {
      var stars = DS.state.starsFor(i);
      if (!stars) continue;
      var total = DS.state.bestScore(i) || (stars === 3 ? 800 : stars === 2 ? 550 : 300);
      var L = DS.LEVELS[i];
      (function (idx, lvName, tot, st) {
        fetch(DS.API_BASE + '/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, levelIdx: idx, levelName: lvName, total: tot, stars: st })
        }).catch(function () {});
      })(i, L.name, total, stars);
    }
  }

  /* ---------- shop ---------- */
  function buy(productId) {
    return DS.payments.purchase(productId).then(function (res) {
      if (res.ok) renderShop();
      return res;
    });
  }

  function renderShop() {
    $('shop-coins').textContent = DS.state.data.coins.toLocaleString();
    $('shop-gems').textContent = DS.state.data.gems.toLocaleString();

    // No Ads
    var packs = $('shop-packs');
    packs.innerHTML = '';
    var noAdsOwned = !!DS.state.data.ent.noAds;
    var noAdsPr = DS.payments.product('no_ads');
    var noAdsCard = document.createElement('div');
    noAdsCard.className = 'pack-card';
    noAdsCard.innerHTML =
      '<div class="pack-info">' +
      '<div class="pack-name">Remove Ads</div>' +
      '<div class="pack-levels">All 18 levels · ad-free forever</div>' +
      '</div>' +
      (noAdsOwned
        ? '<span class="noads-owned">ACTIVE</span>'
        : '<button id="btn-no-ads" class="pack-btn">' + noAdsPr.price + '</button>');
    packs.appendChild(noAdsCard);
    if (!noAdsOwned) {
      $('btn-no-ads').addEventListener('click', function () { buy('no_ads'); });
    }

    // Gem chests
    var gg = $('shop-gems-grid');
    gg.innerHTML = '';
    ['gems_100', 'gems_550', 'gems_1200'].forEach(function (id) {
      var p = DS.payments.product(id);
      var tile = document.createElement('button');
      tile.className = 'gem-tile' + (p.badge ? ' best' : '');
      tile.innerHTML =
        (p.badge ? '<span class="gem-badge">' + p.badge + '</span>' : '') +
        gemSvg(22) +
        '<span class="gem-amt">' + p.gems.toLocaleString() + '</span>' +
        '<span class="gem-price">' + p.price + '</span>';
      tile.addEventListener('click', function () { buy(id); });
      gg.appendChild(tile);
    });

    // Ship skins
    var wrap = $('shop-grid');
    wrap.innerHTML = '';
    DS.SKINS.forEach(function (sk) {
      var owned = !!DS.state.data.owned[sk.id];
      var equipped = DS.state.data.skin === sk.id;
      var card = document.createElement('div');
      card.className = 'shop-card';
      var cv = document.createElement('canvas');
      cv.width = 200; cv.height = 90;
      cv.style.width = '100px'; cv.style.height = '45px';
      var c2 = cv.getContext('2d');
      c2.setTransform(1.5, 0, 0, 1.5, 100, 45);
      DS.Render.drawShip(c2, { x: 0, y: 0, h: Math.PI / 2 }, sk, 0);
      card.appendChild(cv);
      var nm = document.createElement('div');
      nm.className = 'shop-name';
      nm.textContent = sk.name;
      card.appendChild(nm);
      var btn = document.createElement('button');
      btn.className = 'shop-btn';
      if (equipped) { btn.textContent = 'SAILING'; btn.classList.add('equipped'); btn.disabled = true; }
      else if (owned) {
        btn.textContent = 'SET SAIL';
        btn.addEventListener('click', function () {
          DS.sfx.click(); DS.state.data.skin = sk.id; DS.state.save(); renderShop();
        });
      } else {
        var cur = sk.currency || 'coins';
        btn.innerHTML = (cur === 'gems' ? gemSvg(14) : coinSvg()) + ' ' + sk.price;
        if (DS.state.data[cur] < sk.price) btn.classList.add('poor');
        btn.addEventListener('click', function () {
          if (DS.state.data[cur] < sk.price) { DS.sfx.snap(); return; }
          DS.sfx.win();
          DS.state.data[cur] -= sk.price;
          DS.state.data.owned[sk.id] = true;
          DS.state.data.skin = sk.id;
          DS.state.save();
          renderShop();
        });
      }
      card.appendChild(btn);
      wrap.appendChild(card);
    });
  }
  function coinSvg() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" style="vertical-align:-2px"><circle cx="12" cy="12" r="10" fill="#FFC93C" stroke="#F0A800" stroke-width="2"/></svg>';
  }
  function gemSvg(size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 22 22" style="vertical-align:-2px"><path d="M6 3 L16 3 L20 8 L11 19 L2 8 Z" fill="#7ED4E6" stroke="#2FA4C9" stroke-width="2" stroke-linejoin="round"/></svg>';
  }

  /* ---------- game screen ---------- */
  function startLevel(idx) {
    currentLevel = idx;
    show('screen-game');
    hideOverlays();
    var L = DS.LEVELS[idx];
    $('hud-level').textContent = 'LEVEL ' + (idx + 1) + ' · ' + (L.mode === 'dock' ? 'DOCK!' : 'CAST OFF!');
    $('chip-wind').hidden = L.wind.kn <= 0;
    $('chip-current').hidden = L.current.kn <= 0;
    $('chip-tide').hidden = !L.tide;
    toast(L.tip);
    if (!game) {
      game = new DS.Game({
        canvas: $('sea'),
        onFinish: onFinish,
        onFail: onFail,
        onHud: updateHud
      });
      window.addEventListener('resize', function () { if (game) game.resize(); });
    }
    game.start(idx);
    syncConsole();
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('on'); }, 4200);
  }

  function hideOverlays() {
    $('overlay-results').hidden = true;
    $('overlay-fail').hidden = true;
    $('overlay-pause').hidden = true;
  }

  function updateHud(g) {
    $('hud-timer').textContent = fmtTime(g.timeLeft);
    $('hud-timer-chip').classList.toggle('low', g.timeLeft < 20);
    var spd = Math.sqrt(g.ship.vx * g.ship.vx + g.ship.vy * g.ship.vy) / g.KN;
    $('hud-speed').textContent = spd.toFixed(1) + ' kn';
    var L = g.level;
    if (L.wind.kn > 0) {
      $('wind-val').textContent = 'WIND ' + g.windNow.kn.toFixed(0) + ' kn';
      var wa = Math.atan2(g.windNow.vy, g.windNow.vx) * 180 / Math.PI;
      $('wind-arrow').style.transform = 'rotate(' + wa + 'deg)';
    }
    if (L.current.kn > 0) {
      $('current-val').textContent = 'CURRENT ' + (g.currentNow.spd / 9).toFixed(1) + ' kn';
    }
    if (L.tide) {
      $('tide-val').textContent = g.tideRising ? 'TIDE RISING' : 'TIDE EBBING';
    }
    // rudder chip
    var deg = Math.round(Math.abs(g.rudder) * 35);
    $('rudder-chip').textContent = deg < 2 ? 'RUDDER MIDSHIPS' : 'RUDDER ' + deg + '° ' + (g.rudder > 0 ? 'STBD' : 'PORT');
    $('wheel-svg').style.transform = 'rotate(' + (g.rudder * 120) + 'deg)';
    // mooring buttons
    for (var i = 0; i < 3; i++) {
      var st = g.lineUi(i);
      var btn = $('line-' + i);
      btn.className = 'line-btn ' + st;
      btn.querySelector('.line-state').textContent =
        st === 'fast' ? 'FAST' : st === 'ready' ? (g.level.mode === 'dock' ? 'SEND' : 'SEND') : 'TOO FAR';
      if (st === 'fast' && g.lines[i].strain > 0.7) btn.classList.add('strain');
    }
  }

  /* ---------- results / fail ---------- */
  function onFinish(res) {
    DS.state.setStars(res.level, res.stars);
    DS.state.setScore(res.level, res.total);
    DS.state.addCoins(res.coins);
    submitScore(res);
    if (res.stars === 3) DS.state.addGems(2); // slow gem drip for perfect runs
    var o = $('overlay-results');
    $('res-title').textContent = res.mode === 'dock'
      ? (res.stars === 3 ? 'PERFECT DOCKING!' : 'MADE FAST!')
      : (res.stars === 3 ? 'CLEAN GETAWAY!' : 'UNDERWAY!');
    var starEls = o.querySelectorAll('.res-star');
    for (var i = 0; i < 3; i++) starEls[i].classList.toggle('on', i < res.stars);
    $('res-contact-label').textContent = res.mode === 'dock' ? 'Clean docking — no contact!' : 'No contact on the way out!';
    $('res-contact').textContent = '+' + res.contactScore;
    $('res-time-label').textContent = 'Ahead of schedule · ' + fmtTime(res.timeLeft) + ' left';
    $('res-time').textContent = '+' + res.timeScore;
    $('res-lines-label').textContent = res.snaps === 0 ? 'Clean line work' : res.snaps + ' line(s) snapped!';
    $('res-lines').textContent = '+' + res.lineScore;
    $('res-total').textContent = res.total;
    $('res-coins').textContent = '+' + res.coins;
    var isLast = res.level >= DS.LEVELS.length - 1;
    $('btn-next').textContent = isLast ? 'VOYAGE MAP' : 'NEXT LEVEL';
    o.hidden = false;
    lastResult = res;
  }
  var lastResult = null;

  function onFail(reason) {
    var o = $('overlay-fail');
    if (reason === 'crash') {
      $('fail-title').textContent = 'BONK!';
      $('fail-msg').textContent = 'Any contact ends the run, Captain. Come in with a feather touch — approach slower and use the thrusters!';
    } else {
      $('fail-title').textContent = "TIME'S UP!";
      $('fail-msg').textContent = 'The harbor master taps their watch. One more go — you nearly had it!';
    }
    o.hidden = false;
  }

  /* ---------- console input ---------- */
  function syncConsole() {
    var slots = document.querySelectorAll('.tele-slot');
    slots.forEach(function (el) {
      el.classList.toggle('active', +el.dataset.idx === game.teleIdx);
    });
  }

  function bindConsole() {
    // telegraph
    document.querySelectorAll('.tele-slot').forEach(function (el) {
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (!game) return;
        game.setTelegraph(+el.dataset.idx);
        syncConsole();
      });
    });
    // wheel
    var wheel = $('wheel-hit');
    var wheelPointer = null, lastAng = 0;
    function angOf(e) {
      var r = wheel.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    }
    wheel.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      wheel.setPointerCapture(e.pointerId);
      wheelPointer = e.pointerId;
      lastAng = angOf(e);
      if (game) game.rudderHeld = true;
    });
    wheel.addEventListener('pointermove', function (e) {
      if (e.pointerId !== wheelPointer || !game) return;
      var a = angOf(e);
      var d = a - lastAng;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      lastAng = a;
      game.rudder = Math.max(-1, Math.min(1, game.rudder + d * 0.55));
    });
    function wheelUp(e) {
      if (e.pointerId === wheelPointer) {
        wheelPointer = null;
        if (game) game.rudderHeld = false;
      }
    }
    wheel.addEventListener('pointerup', wheelUp);
    wheel.addEventListener('pointercancel', wheelUp);
    // the wheel holds its angle; tap the rudder readout to snap back to midships
    $('rudder-chip').addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (game) { game.rudder = 0; DS.sfx.click(); }
    });

    // thrusters (hold)
    [['thr-bow-l', 'bow', -1], ['thr-bow-r', 'bow', 1], ['thr-stern-l', 'stern', -1], ['thr-stern-r', 'stern', 1]]
      .forEach(function (def) {
        var el = $(def[0]);
        function down(e) {
          e.preventDefault();
          el.setPointerCapture(e.pointerId);
          el.classList.add('held');
          if (game) game.ship[def[1]] = def[2];
        }
        function up() {
          el.classList.remove('held');
          if (game && game.ship[def[1]] === def[2]) game.ship[def[1]] = 0;
        }
        el.addEventListener('pointerdown', down);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
      });

    // mooring lines
    for (var i = 0; i < 3; i++) {
      (function (idx) {
        $('line-' + idx).addEventListener('pointerdown', function (e) {
          e.preventDefault();
          if (game) game.toggleLine(idx);
        });
      })(i);
    }

    // keyboard (desktop testing)
    window.addEventListener('keydown', function (e) {
      if (!game || $('screen-game').hidden) return;
      if (e.key === 'ArrowLeft') { game.rudder = Math.max(-1, game.rudder - 0.15); game.rudderHeld = true; }
      if (e.key === 'ArrowRight') { game.rudder = Math.min(1, game.rudder + 0.15); game.rudderHeld = true; }
      if (e.key === 'ArrowUp') { game.setTelegraph(game.teleIdx - 1); syncConsole(); }
      if (e.key === 'ArrowDown') { game.setTelegraph(game.teleIdx + 1); syncConsole(); }
      if (e.key === 'q') game.ship.bow = -1;
      if (e.key === 'e') game.ship.bow = 1;
      if (e.key === 'a') game.ship.stern = -1;
      if (e.key === 'd') game.ship.stern = 1;
      if (e.key === '1') game.toggleLine(0);
      if (e.key === '2') game.toggleLine(1);
      if (e.key === '3') game.toggleLine(2);
      if (e.key === 'r') startLevel(currentLevel);
    });
    window.addEventListener('keyup', function (e) {
      if (!game) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') game.rudderHeld = false;
      if (e.key === 'q' && game.ship.bow === -1) game.ship.bow = 0;
      if (e.key === 'e' && game.ship.bow === 1) game.ship.bow = 0;
      if (e.key === 'a' && game.ship.stern === -1) game.ship.stern = 0;
      if (e.key === 'd' && game.ship.stern === 1) game.ship.stern = 0;
    });
  }

  /* ---------- top-level buttons ---------- */
  function bindNav() {
    $('btn-play').addEventListener('click', function () { DS.sfx.click(); show('screen-map'); });
    $('btn-home-shop').addEventListener('click', function () { DS.sfx.click(); show('screen-shop'); });
    $('btn-home-leaderboard').addEventListener('click', function () { DS.sfx.click(); show('screen-leaderboard'); });
    $('btn-map-back').addEventListener('click', function () { DS.sfx.click(); show('screen-home'); });
    $('btn-shop-back').addEventListener('click', function () { DS.sfx.click(); show('screen-home'); });
    $('btn-lb-back').addEventListener('click', function () { DS.sfx.click(); show('screen-home'); });
    $('btn-name-go').addEventListener('click', function () {
      var val = $('name-input').value.trim().replace(/[<>"]/g, '').slice(0, 20);
      if (!val) { $('name-input').focus(); return; }
      DS.sfx.click();
      DS.state.data.name = val;
      DS.state.save();
      syncScores();
      show('screen-home');
    });
    $('name-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') $('btn-name-go').click();
    });
    $('btn-restore').addEventListener('click', function () {
      DS.sfx.click();
      DS.payments.restore().then(function () { renderShop(); });
    });
    $('btn-pause').addEventListener('click', function () {
      DS.sfx.click();
      game.pause(true);
      $('mute-label').textContent = DS.sfx.isMuted() ? 'SOUND: OFF' : 'SOUND: ON';
      $('overlay-pause').hidden = false;
    });
    $('btn-resume').addEventListener('click', function () {
      DS.sfx.click(); $('overlay-pause').hidden = true; game.pause(false);
    });
    $('btn-pause-retry').addEventListener('click', function () { DS.sfx.click(); startLevel(currentLevel); });
    $('btn-pause-map').addEventListener('click', function () { DS.sfx.click(); show('screen-map'); });
    $('btn-mute').addEventListener('click', function () {
      var m = DS.sfx.toggleMute();
      $('mute-label').textContent = m ? 'SOUND: OFF' : 'SOUND: ON';
    });
    $('btn-retry').addEventListener('click', function () {
      DS.sfx.click();
      maybeShowAd().then(function () { startLevel(currentLevel); });
    });
    $('btn-fail-map').addEventListener('click', function () {
      DS.sfx.click();
      maybeShowAd().then(function () { show('screen-map'); });
    });
    $('btn-res-retry').addEventListener('click', function () {
      DS.sfx.click();
      maybeShowAd().then(function () { startLevel(currentLevel); });
    });
    $('btn-next').addEventListener('click', function () {
      DS.sfx.click();
      maybeShowAd().then(function () {
        if (currentLevel >= DS.LEVELS.length - 1) show('screen-map');
        else startLevel(currentLevel + 1);
      });
    });
    $('btn-share').addEventListener('click', function () {
      if (!lastResult) return;
      var L = DS.LEVELS[lastResult.level];
      var txt = 'I scored ' + lastResult.total + ' (' + lastResult.stars + '★) ' +
        (lastResult.mode === 'dock' ? 'docking' : 'casting off') + ' at "' + L.name + '" in Dock Star ⚓ Beat that!';
      if (navigator.share) {
        navigator.share({ text: txt }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(txt).then(function () { toast('Challenge copied — paste it to a friend!'); });
      }
    });
  }

  function init() {
    bindNav();
    bindConsole();
    if (!DS.state.data.name) {
      show('screen-name');
    } else {
      syncScores();
      show('screen-home');
    }
  }

  return { init: init, show: show, startLevel: startLevel, _game: function () { return game; } };
})();
