/* Dock Star — tiny WebAudio sound effects (no assets). */
window.DS = window.DS || {};

DS.sfx = (function () {
  var ctx = null;
  var muted = false;
  try { muted = localStorage.getItem('dockstar-muted') === '1'; } catch (e) {}

  function ac() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slide) {
    var a = ac(); if (!a || muted) return;
    var o = a.createOscillator();
    var g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, a.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), a.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.15, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + dur);
  }

  return {
    isMuted: function () { return muted; },
    toggleMute: function () {
      muted = !muted;
      try { localStorage.setItem('dockstar-muted', muted ? '1' : '0'); } catch (e) {}
      return muted;
    },
    click: function () { tone(660, 0.06, 'square', 0.06); },
    notch: function () { tone(440, 0.08, 'square', 0.09); },
    clunk: function () { tone(180, 0.16, 'triangle', 0.22, -80); },
    snap: function () { tone(950, 0.12, 'sawtooth', 0.15, -500); },
    bonk: function () { tone(120, 0.4, 'triangle', 0.3, -60); tone(90, 0.5, 'sine', 0.25, -40); },
    win: function () {
      tone(523, 0.14, 'triangle', 0.16);
      setTimeout(function () { tone(659, 0.14, 'triangle', 0.16); }, 130);
      setTimeout(function () { tone(784, 0.3, 'triangle', 0.18); }, 260);
    },
    horn: function () { tone(110, 0.9, 'sawtooth', 0.12, 6); tone(165, 0.9, 'sawtooth', 0.07, 6); }
  };
})();
