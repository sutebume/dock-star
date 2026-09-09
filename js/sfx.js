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

  /* ---------- ambient sea breeze ----------
     Synthesised, no assets: looping white noise through a lowpass filter,
     with two slow LFOs breathing the cutoff and the gain so it swells like
     wind over water instead of sitting as flat hiss. */
  var amb = null;                       /* live nodes while playing */
  var ambOn = true;                     /* user preference, persisted */
  try { ambOn = localStorage.getItem('dockstar-ambience') !== '0'; } catch (e) {}

  function noiseBuffer(a) {
    var len = a.sampleRate * 2;
    var buf = a.createBuffer(1, len, a.sampleRate);
    var d = buf.getChannelData(0);
    /* Brownish noise: smoother and less hissy than pure white. */
    var last = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }

  function ambStart() {
    if (amb || muted || !ambOn) return;
    var a = ac(); if (!a) return;

    var src = a.createBufferSource();
    src.buffer = noiseBuffer(a);
    src.loop = true;

    var lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 620;
    lp.Q.value = 0.6;

    var hp = a.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 120;          /* trim rumble */

    var gain = a.createGain();
    gain.gain.setValueAtTime(0.0001, a.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, a.currentTime + 1.6); /* fade in */

    /* swell: slow gain LFO */
    var swell = a.createOscillator();
    swell.type = 'sine';
    swell.frequency.value = 0.09;      /* ~11s per breath */
    var swellAmt = a.createGain();
    swellAmt.gain.value = 0.055;
    swell.connect(swellAmt); swellAmt.connect(gain.gain);

    /* gust: slow cutoff LFO, offset so the two never line up */
    var gust = a.createOscillator();
    gust.type = 'sine';
    gust.frequency.value = 0.053;
    var gustAmt = a.createGain();
    gustAmt.gain.value = 260;
    gust.connect(gustAmt); gustAmt.connect(lp.frequency);

    src.connect(hp); hp.connect(lp); lp.connect(gain); gain.connect(a.destination);
    src.start(); swell.start(); gust.start();

    amb = { src: src, gain: gain, swell: swell, gust: gust };
  }

  function ambStop() {
    if (!amb) return;
    var a = ctx, n = amb;
    amb = null;
    try {
      n.gain.gain.cancelScheduledValues(a.currentTime);
      n.gain.gain.setValueAtTime(Math.max(0.0001, n.gain.gain.value), a.currentTime);
      n.gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.5); /* fade out */
      setTimeout(function () {
        try { n.src.stop(); n.swell.stop(); n.gust.stop(); } catch (e) {}
      }, 600);
    } catch (e) {
      try { n.src.stop(); n.swell.stop(); n.gust.stop(); } catch (e2) {}
    }
  }

  return {
    isMuted: function () { return muted; },
    toggleMute: function () {
      muted = !muted;
      try { localStorage.setItem('dockstar-muted', muted ? '1' : '0'); } catch (e) {}
      if (muted) ambStop();
      return muted;
    },

    /* ambient breeze — independent of the global mute, but the global
       mute always wins so one control can silence everything. */
    ambienceOn: function () { return ambOn; },
    toggleAmbience: function () {
      ambOn = !ambOn;
      try { localStorage.setItem('dockstar-ambience', ambOn ? '1' : '0'); } catch (e) {}
      if (ambOn) ambStart(); else ambStop();
      return ambOn;
    },
    startAmbience: ambStart,
    stopAmbience: ambStop,
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
