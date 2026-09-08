/* Dock Star — canvas renderer for the harbor scene. */
window.DS = window.DS || {};

DS.Render = (function () {

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawWater(ctx, w, h, t, current) {
    ctx.fillStyle = '#2FA4C9';
    ctx.fillRect(0, 0, w, h);
    // light patches
    ctx.fillStyle = 'rgba(69,182,216,0.5)';
    var patches = [[90, 140, 70, 30], [200, 470, 90, 38], [60, 330, 55, 24], [280, 560, 70, 28]];
    for (var i = 0; i < patches.length; i++) {
      var p = patches[i];
      ctx.beginPath();
      ctx.ellipse(p[0], p[1], p[2], p[3], 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // drifting wave squiggles
    ctx.strokeStyle = '#8FDCEF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    var rows = 7;
    for (var r = 0; r < rows; r++) {
      var yy = 60 + r * (h / rows);
      var xx = ((r * 97 + t * 8) % (w + 80)) - 60;
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.quadraticCurveTo(xx + 10, yy - 8, xx + 20, yy);
      ctx.quadraticCurveTo(xx + 30, yy + 8, xx + 40, yy);
      ctx.stroke();
    }
    // current chevrons
    if (current && current.spd > 0.5) {
      var a = Math.atan2(current.vy, current.vx);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2.5;
      for (var c = 0; c < 5; c++) {
        var phase = ((t * current.spd * 0.8 + c * 53) % 260);
        var cx = 40 + (c * 83) % (w - 80);
        var cy = 40 + phase * ((h - 80) / 260);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(-6, -5); ctx.lineTo(2, 0); ctx.lineTo(-6, 5);
        ctx.moveTo(2, -5); ctx.lineTo(10, 0); ctx.lineTo(2, 5);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
  }

  function drawQuay(ctx, q) {
    ctx.fillStyle = '#F2E3C0';
    ctx.fillRect(q.x, q.y, q.w, q.h);
    ctx.fillStyle = '#D9C08C';
    ctx.fillRect(q.x, q.y, 8, q.h);
  }

  function drawIsland(ctx, isl) {
    ctx.fillStyle = '#D9C08C';
    roundRect(ctx, isl.x - 6, isl.y - 6, isl.w + 12, isl.h + 12, 26);
    ctx.fill();
    ctx.fillStyle = '#F2E3C0';
    roundRect(ctx, isl.x, isl.y, isl.w, isl.h, 20);
    ctx.fill();
    // little lighthouse
    var lx = isl.x + isl.w / 2, ly = isl.y + isl.h / 2 + 12;
    ctx.strokeStyle = '#16324A'; ctx.lineWidth = 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(lx - 7, ly); ctx.lineTo(lx - 4, ly - 30); ctx.lineTo(lx + 4, ly - 30); ctx.lineTo(lx + 7, ly);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#E85D4A';
    ctx.fillRect(lx - 5.5, ly - 18, 11, 6);
    ctx.fillStyle = '#FFC93C';
    ctx.fillRect(lx - 4, ly - 36, 8, 6);
    ctx.strokeRect(lx - 4, ly - 36, 8, 6);
  }

  function drawBerth(ctx, b, t) {
    ctx.save();
    ctx.fillStyle = 'rgba(87,199,133,0.14)';
    roundRect(ctx, b.x, b.y, b.w, b.h, 16);
    ctx.fill();
    ctx.strokeStyle = '#57C785';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 10]);
    ctx.lineDashOffset = -t * 12;
    roundRect(ctx, b.x, b.y, b.w, b.h, 16);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#1F7A46';
    ctx.font = '700 12px Fredoka, "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BERTH', b.x + b.w / 2, b.y + 20);
    ctx.restore();
  }

  function drawExit(ctx, ex, t, w) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 4;
    ctx.setLineDash([2, 14]);
    ctx.lineDashOffset = -t * 20;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w * 0.4, ex.y + ex.h + 60);
    ctx.quadraticCurveTo(w * 0.35, ex.y + ex.h * 0.5, w * 0.35, ex.y + 14);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(w * 0.35 - 9, ex.y + 22);
    ctx.lineTo(w * 0.35, ex.y + 4);
    ctx.lineTo(w * 0.35 + 9, ex.y + 22);
    ctx.closePath();
    ctx.fill();
    ctx.font = '600 13px Fredoka, "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('OPEN SEA', w * 0.35 + 16, ex.y + 20);
    ctx.restore();
  }

  function drawBollard(ctx, b) {
    ctx.fillStyle = '#5A6B78';
    ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3C4A55';
    ctx.beginPath(); ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2); ctx.fill();
  }

  function drawFenders(ctx, q, from, to) {
    ctx.fillStyle = '#2B3A46';
    for (var y = from; y <= to; y += 56) {
      ctx.beginPath(); ctx.arc(q.x + 3, y, 7, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawLine(ctx, p1, p2, strain) {
    ctx.save();
    ctx.strokeStyle = strain > 0.7 ? '#E85D4A' : '#8A5A2B';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    var sag = Math.max(0, 14 - strain * 20);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.quadraticCurveTo(mx, my + sag, p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawShip(ctx, s, skin, t) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.h - Math.PI / 2); // hull drawn pointing +x
    // hull
    ctx.fillStyle = skin.hull;
    ctx.strokeStyle = skin.hullDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-58, 0);
    ctx.bezierCurveTo(-58, -11, -48, -15, -34, -15);
    ctx.lineTo(30, -15);
    ctx.bezierCurveTo(47, -15, 56, -8, 60, 0);
    ctx.bezierCurveTo(56, 8, 47, 15, 30, 15);
    ctx.lineTo(-34, 15);
    ctx.bezierCurveTo(-48, 15, -58, 11, -58, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // deck
    ctx.fillStyle = skin.deck;
    ctx.beginPath();
    ctx.moveTo(-51, 0);
    ctx.bezierCurveTo(-51, -8, -44, -11, -33, -11);
    ctx.lineTo(28, -11);
    ctx.bezierCurveTo(41, -11, 48, -5, 51, 0);
    ctx.bezierCurveTo(48, 5, 41, 11, 28, 11);
    ctx.lineTo(-33, 11);
    ctx.bezierCurveTo(-44, 11, -51, 8, -51, 0);
    ctx.closePath();
    ctx.fill();
    // cargo / accent
    if (skin.containers) {
      var cols = ['#FFB13C', '#4FA8E0', '#66C28A', '#F26D6D'];
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = '#16324A';
      for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 2; j++) {
          ctx.fillStyle = cols[(i + j) % 4];
          roundRect(ctx, -26 + i * 14, j === 0 ? -8.5 : 1.5, 12, 7, 1.5);
          ctx.fill(); ctx.stroke();
        }
      }
    } else {
      ctx.fillStyle = skin.accent;
      ctx.strokeStyle = '#16324A';
      ctx.lineWidth = 1.6;
      roundRect(ctx, -26, -7, 54, 14, 5);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7ED4E6';
      for (var k = 0; k < 4; k++) {
        ctx.beginPath(); ctx.arc(-16 + k * 12, 0, 2.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    // bridge at stern
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#16324A';
    ctx.lineWidth = 2;
    roundRect(ctx, -49, -8, 15, 16, 3);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7ED4E6';
    roundRect(ctx, -46, -4.5, 9, 3.4, 1.5); ctx.fill();
    roundRect(ctx, -46, 1.4, 9, 3.4, 1.5); ctx.fill();
    // bow chevron
    ctx.fillStyle = 'rgba(22,50,74,0.3)';
    ctx.beginPath();
    ctx.moveTo(46, -4.5); ctx.lineTo(55, 0); ctx.lineTo(46, 4.5);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawWash(ctx, s, t) {
    // thruster bubbles
    var fwd = { x: Math.sin(s.h), y: -Math.cos(s.h) };
    var right = { x: Math.cos(s.h), y: Math.sin(s.h) };
    function bubbles(px, py, dx, dy) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (var i = 0; i < 3; i++) {
        var d = 8 + i * 8 + (t * 30 % 8);
        ctx.beginPath();
        ctx.arc(px + dx * d, py + dy * d, 6 - i * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (s.bow !== 0) {
      var bp = { x: s.x + fwd.x * 44, y: s.y + fwd.y * 44 };
      bubbles(bp.x, bp.y, -right.x * s.bow, -right.y * s.bow);
    }
    if (s.stern !== 0) {
      var sp = { x: s.x - fwd.x * 44, y: s.y - fwd.y * 44 };
      bubbles(sp.x, sp.y, -right.x * s.stern, -right.y * s.stern);
    }
    if (s.thrust !== 0) {
      var wp = { x: s.x - fwd.x * 62, y: s.y - fwd.y * 62 };
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (var j = 0; j < 3; j++) {
        var dd = j * 10 + (t * 40 % 10);
        var dir = s.thrust > 0 ? -1 : 1;
        ctx.beginPath();
        ctx.arc(wp.x + fwd.x * dd * dir * -1, wp.y + fwd.y * dd * dir * -1, 5.5 - j * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawWindStreaks(ctx, w, h, t, wind) {
    if (!wind || wind.kn <= 0.5) return;
    var a = Math.atan2(wind.vy, wind.vx);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    var n = Math.min(6, 2 + Math.floor(wind.kn / 3));
    for (var i = 0; i < n; i++) {
      var span = 340;
      var p = ((t * (30 + wind.kn * 6) + i * 61) % span);
      var bx = 30 + ((i * 137) % (w - 60));
      var by = 30 + ((i * 89) % (h - 60));
      var x = bx + Math.cos(a) * (p - span / 2);
      var y = by + Math.sin(a) * (p - span / 2);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * 22, y + Math.sin(a) * 22);
      ctx.stroke();
    }
    ctx.restore();
  }

  function scene(ctx, w, h, level, game, skin, t) {
    drawWater(ctx, w, h, t, game.currentNow);
    drawWindStreaks(ctx, w, h, t, game.windNow);
    if (level.mode === 'undock' && level.exit) drawExit(ctx, level.exit, t, w);
    if (level.berth && level.mode === 'dock') drawBerth(ctx, level.berth, t);
    for (var i = 0; i < level.quays.length; i++) {
      if (level.island && level.quays[i] === level.island) continue;
      if (level.island && level.quays[i].x === level.island.x && level.quays[i].y === level.island.y) continue;
      drawQuay(ctx, level.quays[i]);
    }
    if (level.island) drawIsland(ctx, level.island);
    var mainQuay = level.quays[0];
    drawFenders(ctx, mainQuay, level.bollards[0].y - 30, level.bollards[2].y + 30);
    for (var b = 0; b < level.bollards.length; b++) drawBollard(ctx, level.bollards[b]);
    // moored harbor traffic
    if (level.traffic) {
      for (var tr = 0; tr < level.traffic.length; tr++) {
        var tv = level.traffic[tr];
        // short head/stern lines to the quay for flavor
        ctx.strokeStyle = '#8A5A2B';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tv.x + 8, tv.y - 40);
        ctx.quadraticCurveTo(tv.x + 18, tv.y - 38, mainQuay.x + 6, tv.y - 34);
        ctx.moveTo(tv.x + 8, tv.y + 40);
        ctx.quadraticCurveTo(tv.x + 18, tv.y + 38, mainQuay.x + 6, tv.y + 34);
        ctx.stroke();
        drawShip(ctx, { x: tv.x, y: tv.y, h: tv.h || 0 }, {
          hull: tv.hull, hullDark: tv.hullDark,
          deck: '#F7EFE2', accent: '#FFC93C', containers: false
        }, t);
      }
    }
    // mooring lines
    for (var l = 0; l < game.lines.length; l++) {
      var ln = game.lines[l];
      if (ln.state === 'fast' && ln.bollard) {
        drawLine(ctx, game.linePoint(l), ln.bollard, ln.strain || 0);
      }
    }
    drawWash(ctx, game.ship, t);
    drawShip(ctx, game.ship, skin, t);
  }

  return { scene: scene, drawShip: drawShip, roundRect: roundRect };
})();
