/* Dock Star — core simulation, input and game loop. */
window.DS = window.DS || {};

DS.Game = function (opts) {
  // opts: canvas, onFinish(result), onFail(reason), onHud(gameRef)
  var self = this;
  this.canvas = opts.canvas;
  this.ctx = this.canvas.getContext('2d');
  this.onFinish = opts.onFinish;
  this.onFail = opts.onFail;
  this.onHud = opts.onHud;

  this.levelIdx = 0;
  this.level = null;
  this.running = false;
  this.paused = false;
  this.finished = false;

  // physics constants
  var THRUST_NOTCHES = [1, 0.55, 0.28, 0, -0.3, -0.6]; // index 0 = full ahead
  var THRUST_MAX = 34;      // px/s^2
  var C1 = 0.5;             // surge drag /s
  var C2 = 2.2;             // sway drag /s
  var CA = 1.6;             // yaw damping /s
  var KR = 0.011;           // rudder gain
  var WASH = 22;            // prop wash adds to rudder flow (px/s)
  var THR_LAT = 7;          // thruster lateral accel px/s^2
  var THR_ARM = 44;         // thruster lever arm px
  var I_EFF = 1500;         // yaw inertia divisor for point forces
  var WINDK = 0.6;          // wind accel per kn
  var CURK = 9;             // current px/s per kn
  var KLINE = 3;            // line spring accel per px stretch
  var LINE_DAMP = 3;
  var SNAP_AT = 12;         // px stretch -> line parts
  var ATTACH_R = 80;        // px, send-line range
  var CRASH_KN = 0.8;       // quay/wall contact threshold
  var CRASH_TRAFFIC_KN = 0.1; // traffic ship contact threshold (any graze fails)
  var HULL_OFFS = [-42, -21, 0, 21, 42];
  var HULL_R = 16;
  this.KN = 10;             // px/s per knot (display)

  this.ship = { x: 0, y: 0, h: 0, vx: 0, vy: 0, om: 0, thrust: 0, bow: 0, stern: 0 };
  this.teleIdx = 3; // STOP
  this.rudder = 0;  // -1 port .. 1 starboard
  this.rudderHeld = false;
  this.lines = [];
  this.windNow = { vx: 0, vy: 0, kn: 0 };
  this.currentNow = { vx: 0, vy: 0, spd: 0 };
  this.tideFactor = 1;
  this.tideRising = false;
  this.t = 0;
  this.timeLeft = 0;
  this.maxContact = 0;
  this.snaps = 0;
  this.worldH = 560;
  this.scale = 1;

  // fixed logical world, letterboxed into the stage so every harbor
  // is fully visible whatever the viewport shape
  var WORLD_W = 390, WORLD_H = 560;
  this.worldH = WORLD_H;

  this.resize = function () {
    var rect = self.canvas.parentElement.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    self.canvas.width = Math.round(rect.width * dpr);
    self.canvas.height = Math.round(rect.height * dpr);
    self.canvas.style.width = rect.width + 'px';
    self.canvas.style.height = rect.height + 'px';
    self.scale = Math.min(rect.width / WORLD_W, rect.height / WORLD_H);
    self.offX = (rect.width - WORLD_W * self.scale) / 2;
    self.offY = (rect.height - WORLD_H * self.scale) / 2;
    self.dpr = dpr;
  };

  this.start = function (idx) {
    self.levelIdx = idx;
    self.level = DS.LEVELS[idx];
    var L = self.level;
    self.resize();
    self.ship.x = L.spawn.x; self.ship.y = L.spawn.y; self.ship.h = L.spawn.h;
    self.ship.vx = 0; self.ship.vy = 0; self.ship.om = 0;
    self.ship.thrust = 0; self.ship.bow = 0; self.ship.stern = 0;
    self.teleIdx = 3;
    self.rudder = 0;
    self.t = 0;
    self.timeLeft = L.par;
    self.maxContact = 0;
    self.snaps = 0;
    self.finished = false;
    self.paused = false;
    self.lines = [
      { off: 44, state: 'free', bollard: null, rest: 0, strain: 0 },   // fore
      { off: 0, state: 'free', bollard: null, rest: 0, strain: 0 },    // mid
      { off: -44, state: 'free', bollard: null, rest: 0, strain: 0 }   // aft
    ];
    if (L.moored) {
      for (var i = 0; i < 3; i++) {
        var p = self.linePoint(i);
        var best = self.nearestBollard(p, null);
        if (best) {
          self.lines[i].state = 'fast';
          self.lines[i].bollard = best;
          self.lines[i].rest = Math.max(24, Math.min(64, dist(p, best)));
        }
      }
    }
    self.running = true;
    self.runId = (self.runId || 0) + 1;
    self.lastFrame = performance.now();
    self.acc = 0;
    var myRun = self.runId;
    requestAnimationFrame(function tick(now) { frame(now, myRun); });
  };

  this.stop = function () { self.running = false; };
  this.pause = function (p) { self.paused = p; self.lastFrame = performance.now(); };

  function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }

  this.fwd = function () { return { x: Math.sin(self.ship.h), y: -Math.cos(self.ship.h) }; };
  this.rightv = function () { return { x: Math.cos(self.ship.h), y: Math.sin(self.ship.h) }; };

  this.linePoint = function (i) {
    var f = self.fwd();
    var off = self.lines[i].off;
    return { x: self.ship.x + f.x * off, y: self.ship.y + f.y * off };
  };

  this.nearestBollard = function (p, exceptLineIdx) {
    var used = {};
    for (var i = 0; i < self.lines.length; i++) {
      if (i !== exceptLineIdx && self.lines[i].state === 'fast' && self.lines[i].bollard) {
        used[self.lines[i].bollard.x + ',' + self.lines[i].bollard.y] = true;
      }
    }
    var best = null, bd = ATTACH_R;
    for (var b = 0; b < self.level.bollards.length; b++) {
      var bl = self.level.bollards[b];
      if (used[bl.x + ',' + bl.y]) continue;
      var d = dist(p, bl);
      if (d < bd) { bd = d; best = bl; }
    }
    return best;
  };

  // line button state for the UI: 'fast' | 'ready' | 'far'
  this.lineUi = function (i) {
    var ln = self.lines[i];
    if (ln.state === 'fast') return 'fast';
    var p = self.linePoint(i);
    return self.nearestBollard(p, i) ? 'ready' : 'far';
  };

  this.toggleLine = function (i) {
    if (self.finished || self.paused) return;
    var ln = self.lines[i];
    if (ln.state === 'fast') {
      ln.state = 'free'; ln.bollard = null; ln.strain = 0;
      DS.sfx.clunk();
    } else {
      var p = self.linePoint(i);
      var b = self.nearestBollard(p, i);
      if (b) {
        ln.state = 'fast'; ln.bollard = b;
        ln.rest = Math.max(24, Math.min(64, dist(p, b)));
        DS.sfx.clunk();
      }
    }
  };

  this.setTelegraph = function (idx) {
    idx = Math.max(0, Math.min(5, idx));
    if (idx !== self.teleIdx) { self.teleIdx = idx; DS.sfx.notch(); }
  };

  function step(dt) {
    var s = self.ship;
    var L = self.level;
    self.t += dt;
    self.timeLeft -= dt;

    // environment
    var gust = L.wind.gust * (0.5 * Math.sin(self.t * 0.5) + 0.5 * Math.sin(self.t * 0.23 + 1.7));
    var knw = Math.max(0, L.wind.kn + gust);
    var wa = L.wind.deg * Math.PI / 180;
    self.windNow = { vx: Math.cos(wa) * knw, vy: Math.sin(wa) * knw, kn: knw };

    if (L.tide) {
      self.tideFactor = 1 + 0.5 * Math.sin(self.t * 0.08 + 1);
      self.tideRising = Math.cos(self.t * 0.08 + 1) > 0;
    } else { self.tideFactor = 1; }
    var ca = L.current.deg * Math.PI / 180;
    var cs = L.current.kn * CURK * self.tideFactor;
    self.currentNow = { vx: Math.cos(ca) * cs, vy: Math.sin(ca) * cs, spd: cs };

    var f = self.fwd(), r = self.rightv();
    var relx = s.vx - self.currentNow.vx, rely = s.vy - self.currentNow.vy;
    var u = relx * f.x + rely * f.y;     // surge (rel. to water)
    var sw = relx * r.x + rely * r.y;    // sway

    var thrustN = THRUST_NOTCHES[self.teleIdx];
    s.thrust = thrustN;
    var thrustA = thrustN * THRUST_MAX * (thrustN < 0 ? 0.9 : 1);

    // linear accelerations
    var ax = f.x * (thrustA - C1 * u) + r.x * (-C2 * sw);
    var ay = f.y * (thrustA - C1 * u) + r.y * (-C2 * sw);

    // wind (stronger on the beam)
    if (knw > 0.05) {
      var wux = self.windNow.vx / knw, wuy = self.windNow.vy / knw;
      var beam = Math.abs(wux * r.x + wuy * r.y);
      var wk = WINDK * knw * (0.35 + 0.65 * beam);
      ax += wux * wk; ay += wuy * wk;
    }

    // thrusters (bow/stern in -1..1, + pushes bow/stern to starboard)
    var aom = 0;
    if (s.bow !== 0) {
      ax += r.x * s.bow * THR_LAT; ay += r.y * s.bow * THR_LAT;
      aom += s.bow * THR_LAT * THR_ARM / I_EFF * 2;
    }
    if (s.stern !== 0) {
      ax += r.x * s.stern * THR_LAT; ay += r.y * s.stern * THR_LAT;
      aom -= s.stern * THR_LAT * THR_ARM / I_EFF * 2;
    }

    // rudder
    var flow = u + (thrustN > 0 ? thrustN * WASH : 0);
    aom += KR * self.rudder * flow;
    aom -= CA * s.om;

    // mooring lines (spring + damping, may snap)
    for (var i = 0; i < self.lines.length; i++) {
      var ln = self.lines[i];
      if (ln.state !== 'fast' || !ln.bollard) { ln.strain = 0; continue; }
      var p = self.linePoint(i);
      var dx = ln.bollard.x - p.x, dy = ln.bollard.y - p.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 0.001;
      var stretch = d - ln.rest;
      ln.strain = Math.max(0, Math.min(1, stretch / SNAP_AT));
      if (stretch > 0) {
        var nx = dx / d, ny = dy / d;
        // velocity of the attach point (v + om x rArm) along the line
        var rx = p.x - s.x, ry = p.y - s.y;
        var pvx = s.vx - s.om * ry, pvy = s.vy + s.om * rx;
        var vAlong = pvx * nx + pvy * ny;
        var mag = KLINE * stretch + LINE_DAMP * Math.max(0, -vAlong);
        mag = Math.min(mag, 120);
        var Fx = nx * mag, Fy = ny * mag;
        ax += Fx; ay += Fy;
        aom += (rx * Fy - ry * Fx) / I_EFF;
        // sustained heavy strain parts the line (after a visible warning);
        // a violent jerk parts it instantly
        if (ln.strain > 0.85) ln.hot = (ln.hot || 0) + dt;
        else if (ln.strain < 0.7) ln.hot = 0;
        if (stretch > SNAP_AT * 1.5 || ln.hot > 1.2) {
          ln.state = 'free'; ln.bollard = null; ln.strain = 0; ln.hot = 0;
          self.snaps++;
          DS.sfx.snap();
        }
      }
    }

    // integrate
    s.vx += ax * dt; s.vy += ay * dt;
    s.om += aom * dt;
    s.om = Math.max(-1.2, Math.min(1.2, s.om));
    s.x += s.vx * dt; s.y += s.vy * dt;
    s.h += s.om * dt;

    // collisions: hull circles vs solid rects + world bounds
    var solids = L.quays.slice();
    if (L.traffic) {
      for (var ti = 0; ti < L.traffic.length; ti++) {
        var tr = L.traffic[ti];
        solids.push({ x: tr.x - 16, y: tr.y - 58, w: 32, h: 116, isTraffic: true });
      }
    }
    solids.push({ x: -80, y: -80, w: 80, h: self.worldH + 160 });          // left wall
    solids.push({ x: 390, y: -80, w: 120, h: self.worldH + 160 });         // right wall (behind quay)
    solids.push({ x: -80, y: self.worldH, w: 550, h: 120 });               // bottom wall
    if (!(L.mode === 'undock')) solids.push({ x: -80, y: -80, w: 550, h: 80 }); // top wall (docking levels)

    var crashed = false;        // quay/wall contact above threshold
    var crashedTraffic = false; // traffic ship contact above threshold
    for (var c = 0; c < HULL_OFFS.length; c++) {
      var off = HULL_OFFS[c];
      var cxp = s.x + f.x * off, cyp = s.y + f.y * off;
      for (var q = 0; q < solids.length; q++) {
        var rect = solids[q];
        var nx2 = Math.max(rect.x, Math.min(cxp, rect.x + rect.w));
        var ny2 = Math.max(rect.y, Math.min(cyp, rect.y + rect.h));
        var ddx = cxp - nx2, ddy = cyp - ny2;
        var dd = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dd < HULL_R) {
          var pen = HULL_R - dd;
          var nnx, nny;
          if (dd > 0.001) { nnx = ddx / dd; nny = ddy / dd; }
          else { nnx = -f.x; nny = -f.y; }
          // point velocity at contact
          var rrx = cxp - s.x, rry = cyp - s.y;
          var pvx2 = s.vx - s.om * rry, pvy2 = s.vy + s.om * rrx;
          var vn = pvx2 * nnx + pvy2 * nny;
          if (vn < 0) {
            var speedIn = -vn;
            if (speedIn > self.maxContact) self.maxContact = speedIn;
            if (rect.isTraffic && speedIn > CRASH_TRAFFIC_KN * self.KN) {
              crashedTraffic = true;
            } else if (!rect.isTraffic && speedIn > CRASH_KN * self.KN) {
              crashed = true;
            }
            // kill inbound velocity, damp rotation
            s.vx -= nnx * vn; s.vy -= nny * vn;
            s.om *= 0.6;
            if (speedIn > 3) DS.sfx.clunk();
          }
          s.x += nnx * pen; s.y += nny * pen;
          cxp = s.x + f.x * off; cyp = s.y + f.y * off;
        }
      }
    }

    // traffic ship contact fails in both modes; quay/wall contact only fails while docking
    var failCrash = crashedTraffic || (crashed && L.mode === 'dock');
    if (failCrash && !self.finished) {
      self.finished = true;
      DS.sfx.bonk();
      self.onFail('crash');
      return;
    }

    if (self.timeLeft <= 0 && !self.finished) {
      self.finished = true;
      self.onFail('time');
      return;
    }

    checkWin();
  }

  function checkWin() {
    if (self.finished) return;
    var L = self.level, s = self.ship;
    var f = self.fwd();
    var speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
    if (L.mode === 'dock') {
      var b = L.berth;
      var inside = true;
      for (var i = 0; i < HULL_OFFS.length; i++) {
        var px = s.x + f.x * HULL_OFFS[i], py = s.y + f.y * HULL_OFFS[i];
        if (px < b.x || px > b.x + b.w || py < b.y || py > b.y + b.h) { inside = false; break; }
      }
      var hh = ((s.h % Math.PI) + Math.PI) % Math.PI; // fold to 0..PI
      var alignOk = hh < 0.35 || hh > Math.PI - 0.35;
      var linesFast = self.lines.every(function (l) { return l.state === 'fast'; });
      if (inside && alignOk && speed < 4 && Math.abs(s.om) < 0.1 && linesFast) {
        finish();
      }
    } else {
      var ex = L.exit;
      var linesFree = self.lines.every(function (l) { return l.state !== 'fast'; });
      if (linesFree && s.x > ex.x && s.x < ex.x + ex.w && s.y < ex.y + ex.h) {
        finish();
      }
    }
  }

  function finish() {
    self.finished = true;
    DS.sfx.win();
    setTimeout(function () { DS.sfx.horn(); }, 350);
    var L = self.level;
    var contactKn = self.maxContact / self.KN;
    var contactScore = 300; // always 300 — reaching win means no real contact
    var timeScore = Math.max(0, Math.round(450 * self.timeLeft / L.par));
    var lineScore = Math.max(0, 150 - self.snaps * 50);
    var total = contactScore + timeScore + lineScore;
    var stars = total >= 750 ? 3 : total >= 450 ? 2 : 1;
    self.onFinish({
      level: self.levelIdx, mode: L.mode,
      contactKn: contactKn, contactScore: contactScore,
      timeLeft: Math.max(0, self.timeLeft), timeScore: timeScore,
      snaps: self.snaps, lineScore: lineScore,
      total: total, stars: stars, coins: Math.round(total / 20)
    });
  }

  function frame(now, runId) {
    if (!self.running || runId !== self.runId) return; // a newer start() owns the loop
    var dt = Math.min(0.1, (now - self.lastFrame) / 1000);
    self.lastFrame = now;
    if (!self.paused && !self.finished) {
      self.acc += dt;
      var h = 1 / 120;
      var guard = 0;
      while (self.acc >= h && guard < 30) { step(h); self.acc -= h; guard++; }
    }
    draw();
    if (self.onHud) self.onHud(self);
    requestAnimationFrame(function (n) { frame(n, runId); });
  }

  function draw() {
    var ctx = self.ctx;
    // paint the letterbox margins as open water
    ctx.setTransform(self.dpr, 0, 0, self.dpr, 0, 0);
    ctx.fillStyle = '#2FA4C9';
    ctx.fillRect(0, 0, self.canvas.width, self.canvas.height);
    ctx.setTransform(self.dpr * self.scale, 0, 0, self.dpr * self.scale, self.dpr * self.offX, self.dpr * self.offY);
    var skin = DS.state.currentSkin();
    DS.Render.scene(ctx, WORLD_W, WORLD_H, self.level, self, skin, self.t);
  }
};
