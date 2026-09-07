/* Dock Star — level definitions.
   World units are pixels in a 390-wide logical viewport, y grows downward.
   wind/current deg: direction the force pushes TOWARD, 0 = east (+x), 90 = south (+y).
   Tiers: free = indices 0-5, mid = 6-11, hard = 12-17. */
window.DS = window.DS || {};

DS.LEVELS = [
  /* ── FREE TIER ─────────────────────────────────────────────────── */
  {
    name: 'FIRST BERTH', zone: 'SUNNY COVE', mode: 'dock', par: 180,
    wind: { deg: 0, kn: 0, gust: 0 }, current: { deg: 0, kn: 0 }, tide: false,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 180 }, { x: 336, y: 262 }, { x: 336, y: 344 }],
    berth: { x: 244, y: 148, w: 78, h: 228 },
    spawn: { x: 90, y: 430, h: 0.55 },
    tip: 'Ease alongside the berth, stop the ship, then send all three lines!'
  },
  {
    name: 'CAST OFF', zone: 'SUNNY COVE', mode: 'undock', par: 120,
    wind: { deg: 0, kn: 0, gust: 0 }, current: { deg: 0, kn: 0 }, tide: false,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 180 }, { x: 336, y: 262 }, { x: 336, y: 344 }],
    berth: { x: 244, y: 148, w: 78, h: 228 },
    spawn: { x: 303, y: 262, h: 0 }, moored: true,
    exit: { x: 0, y: 0, w: 390, h: 85 },
    tip: 'Let go all lines, thrust the ship off the quay and head for open sea!'
  },
  {
    name: 'FRESH BREEZE', zone: 'WINDY POINT', mode: 'dock', par: 150,
    wind: { deg: 0, kn: 5, gust: 3 }, current: { deg: 0, kn: 0 }, tide: false,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 160 }, { x: 336, y: 240 }, { x: 336, y: 320 }],
    berth: { x: 244, y: 130, w: 78, h: 206 },
    spawn: { x: 80, y: 440, h: 0.5 },
    tip: 'An onshore wind shoves you at the quay. Come in shallow and slow!'
  },
  {
    name: 'PINNED TO THE PIER', zone: 'WINDY POINT', mode: 'undock', par: 120,
    wind: { deg: 0, kn: 8, gust: 3 }, current: { deg: 0, kn: 0 }, tide: false,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 160 }, { x: 336, y: 240 }, { x: 336, y: 320 }],
    berth: { x: 244, y: 130, w: 78, h: 206 },
    spawn: { x: 303, y: 240, h: 0 }, moored: true,
    exit: { x: 0, y: 0, w: 390, h: 85 },
    tip: 'The wind pins you to the pier. Push both thrusters off before you cast off aft!'
  },
  {
    name: 'CHANNEL CURRENT', zone: 'TIDE TOWN', mode: 'dock', par: 150,
    wind: { deg: 45, kn: 6, gust: 2 }, current: { deg: 90, kn: 0.8 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }, { x: 56, y: 200, w: 104, h: 70 }],
    island: { x: 56, y: 200, w: 104, h: 70 },
    bollards: [{ x: 336, y: 158 }, { x: 336, y: 232 }, { x: 336, y: 306 }],
    berth: { x: 248, y: 132, w: 74, h: 190 },
    traffic: [
      { x: 300, y: 62, hull: '#66C28A', hullDark: '#3BA25F' },
      { x: 300, y: 396, hull: '#4FA8E0', hullDark: '#2E7DB0' }
    ],
    spawn: { x: 70, y: 470, h: 0.35 },
    tip: 'Ships moored ahead and astern of your berth — slide in between them with the current!'
  },
  {
    name: 'EBB TIDE ESCAPE', zone: 'STORM STRAIT', mode: 'undock', par: 100,
    wind: { deg: 90, kn: 8, gust: 4 }, current: { deg: 270, kn: 1.0 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }, { x: 56, y: 200, w: 104, h: 70 }],
    island: { x: 56, y: 200, w: 104, h: 70 },
    bollards: [{ x: 336, y: 158 }, { x: 336, y: 232 }, { x: 336, y: 306 }],
    berth: { x: 248, y: 132, w: 74, h: 190 },
    traffic: [
      { x: 300, y: 62, hull: '#66C28A', hullDark: '#3BA25F' },
      { x: 300, y: 396, hull: '#4FA8E0', hullDark: '#2E7DB0' }
    ],
    spawn: { x: 303, y: 232, h: 0 }, moored: true,
    exit: { x: 0, y: 0, w: 390, h: 85 },
    tip: 'Boxed in fore and aft, wind down the quay, ebb tide, tight clock. Show them how it is done!'
  },

  /* ── MID TIER — BUSY PORT ───────────────────────────────────────── */
  {
    name: 'THROUGH TRAFFIC', zone: 'BUSY PORT', mode: 'dock', par: 130,
    wind: { deg: 0, kn: 8, gust: 4 }, current: { deg: 90, kn: 0.8 }, tide: false,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 172 }, { x: 336, y: 250 }, { x: 336, y: 328 }],
    berth: { x: 244, y: 142, w: 78, h: 202 },
    traffic: [
      { x: 300, y: 52, hull: '#E8956D', hullDark: '#C06B3F' },
      { x: 300, y: 412, hull: '#66C28A', hullDark: '#3BA25F' }
    ],
    spawn: { x: 80, y: 460, h: 0.45 },
    tip: 'Wind, current, ships ahead and astern — thread the needle!'
  },
  {
    name: 'TIGHT SQUEEZE', zone: 'BUSY PORT', mode: 'undock', par: 100,
    wind: { deg: 0, kn: 10, gust: 5 }, current: { deg: 90, kn: 0.6 }, tide: false,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 172 }, { x: 336, y: 250 }, { x: 336, y: 328 }],
    berth: { x: 244, y: 142, w: 78, h: 202 },
    traffic: [
      { x: 300, y: 52, hull: '#E8956D', hullDark: '#C06B3F' },
      { x: 300, y: 412, hull: '#66C28A', hullDark: '#3BA25F' }
    ],
    spawn: { x: 303, y: 250, h: 0 }, moored: true,
    exit: { x: 0, y: 0, w: 390, h: 85 },
    tip: 'Strong onshore wind, current setting down. Use thrusters to break free!'
  },
  {
    name: "THREE'S A CROWD", zone: 'BUSY PORT', mode: 'dock', par: 120,
    wind: { deg: 0, kn: 10, gust: 5 }, current: { deg: 270, kn: 0.8 }, tide: false,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 190 }, { x: 336, y: 268 }, { x: 336, y: 346 }],
    berth: { x: 244, y: 160, w: 78, h: 202 },
    traffic: [
      { x: 300, y: 60, hull: '#4FA8E0', hullDark: '#2E7DB0' },
      { x: 300, y: 440, hull: '#E8956D', hullDark: '#C06B3F' },
      { x: 165, y: 270, hull: '#A67DB8', hullDark: '#7A5090' }
    ],
    spawn: { x: 65, y: 500, h: 0.4 },
    tip: 'Three ships around your berth — one sitting in the channel. Pick your moment!'
  },

  /* ── MID TIER — MONSOON BAY ─────────────────────────────────────── */
  {
    name: 'MONSOON APPROACH', zone: 'MONSOON BAY', mode: 'dock', par: 130,
    wind: { deg: 0, kn: 14, gust: 7 }, current: { deg: 270, kn: 0.8 }, tide: false,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 160 }, { x: 336, y: 240 }, { x: 336, y: 320 }],
    berth: { x: 244, y: 130, w: 78, h: 206 },
    spawn: { x: 75, y: 470, h: 0.45 },
    tip: 'Monsoon-force wind on the beam! Ride the thrusters all the way in.'
  },
  {
    name: 'SPRING FLOOD', zone: 'MONSOON BAY', mode: 'dock', par: 120,
    wind: { deg: 45, kn: 10, gust: 5 }, current: { deg: 90, kn: 1.5 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 172 }, { x: 336, y: 252 }, { x: 336, y: 332 }],
    berth: { x: 244, y: 142, w: 78, h: 206 },
    traffic: [
      { x: 300, y: 52, hull: '#4FA8E0', hullDark: '#2E7DB0' },
      { x: 300, y: 418, hull: '#66C28A', hullDark: '#3BA25F' }
    ],
    spawn: { x: 80, y: 470, h: 0.35 },
    tip: 'Spring tide flood pushes hard down the channel. Allow plenty of drift upstream.'
  },
  {
    name: 'MONSOON ESCAPE', zone: 'MONSOON BAY', mode: 'undock', par: 90,
    wind: { deg: 0, kn: 14, gust: 7 }, current: { deg: 90, kn: 1.2 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 172 }, { x: 336, y: 252 }, { x: 336, y: 332 }],
    berth: { x: 244, y: 142, w: 78, h: 206 },
    traffic: [
      { x: 300, y: 52, hull: '#E8956D', hullDark: '#C06B3F' },
      { x: 300, y: 418, hull: '#A67DB8', hullDark: '#7A5090' }
    ],
    spawn: { x: 303, y: 252, h: 0 }, moored: true,
    exit: { x: 0, y: 0, w: 390, h: 85 },
    tip: 'Monsoon wind pins you against the quay. Fight it with every thruster you have!'
  },

  /* ── HARD TIER — TYPHOON REACH ──────────────────────────────────── */
  {
    name: 'TYPHOON APPROACH', zone: 'TYPHOON REACH', mode: 'dock', par: 110,
    wind: { deg: 0, kn: 18, gust: 9 }, current: { deg: 90, kn: 1.2 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 165 }, { x: 336, y: 245 }, { x: 336, y: 325 }],
    berth: { x: 248, y: 136, w: 74, h: 200 },
    traffic: [
      { x: 300, y: 52, hull: '#E84A5F', hullDark: '#B52F45' },
      { x: 300, y: 406, hull: '#4FA8E0', hullDark: '#2E7DB0' }
    ],
    spawn: { x: 70, y: 490, h: 0.4 },
    tip: 'Typhoon conditions — wind and current are relentless. No margin for error!'
  },
  {
    name: 'EYE OF THE STORM', zone: 'TYPHOON REACH', mode: 'undock', par: 85,
    wind: { deg: 90, kn: 18, gust: 10 }, current: { deg: 270, kn: 1.5 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 165 }, { x: 336, y: 245 }, { x: 336, y: 325 }],
    berth: { x: 248, y: 136, w: 74, h: 200 },
    traffic: [
      { x: 300, y: 52, hull: '#E84A5F', hullDark: '#B52F45' },
      { x: 300, y: 406, hull: '#66C28A', hullDark: '#3BA25F' },
      { x: 175, y: 258, hull: '#FFC93C', hullDark: '#E0A820' }
    ],
    spawn: { x: 303, y: 245, h: 0 }, moored: true,
    exit: { x: 0, y: 0, w: 390, h: 85 },
    tip: 'Three ships, typhoon cross-wind, ebb tide. Your finest hour!'
  },
  {
    name: 'CONTAINER ALLEY', zone: 'TYPHOON REACH', mode: 'dock', par: 100,
    wind: { deg: 0, kn: 16, gust: 8 }, current: { deg: 90, kn: 1.0 }, tide: false,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }, { x: 8, y: 190, w: 110, h: 46 }],
    island: { x: 8, y: 190, w: 110, h: 46 },
    bollards: [{ x: 336, y: 172 }, { x: 336, y: 250 }, { x: 336, y: 328 }],
    berth: { x: 244, y: 142, w: 78, h: 196 },
    traffic: [
      { x: 300, y: 55, hull: '#E84A5F', hullDark: '#B52F45' },
      { x: 300, y: 400, hull: '#4FA8E0', hullDark: '#2E7DB0' },
      { x: 175, y: 335, hull: '#FFC93C', hullDark: '#E0A820' }
    ],
    spawn: { x: 65, y: 505, h: 0.4 },
    tip: 'A jetty narrows the channel. Three ships parked. Big wind. Tiny gap.'
  },

  /* ── HARD TIER — MASTER'S TEST ──────────────────────────────────── */
  {
    name: 'THE GAUNTLET', zone: "MASTER'S TEST", mode: 'dock', par: 80,
    wind: { deg: 0, kn: 16, gust: 8 }, current: { deg: 90, kn: 1.2 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 165 }, { x: 336, y: 245 }, { x: 336, y: 325 }],
    berth: { x: 248, y: 136, w: 74, h: 200 },
    traffic: [
      { x: 300, y: 45, hull: '#E84A5F', hullDark: '#B52F45' },
      { x: 300, y: 420, hull: '#66C28A', hullDark: '#3BA25F' }
    ],
    spawn: { x: 70, y: 490, h: 0.35 },
    tip: 'Maximum control needed — wind and tide test every skill. Welcome to the Gauntlet.'
  },
  {
    name: 'DEAD SLOW', zone: "MASTER'S TEST", mode: 'undock', par: 75,
    wind: { deg: 0, kn: 16, gust: 8 }, current: { deg: 270, kn: 1.2 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 165 }, { x: 336, y: 245 }, { x: 336, y: 325 }],
    berth: { x: 248, y: 136, w: 74, h: 200 },
    traffic: [
      { x: 300, y: 45, hull: '#E84A5F', hullDark: '#B52F45' },
      { x: 300, y: 420, hull: '#4FA8E0', hullDark: '#2E7DB0' },
      { x: 155, y: 258, hull: '#FFC93C', hullDark: '#E0A820' }
    ],
    spawn: { x: 303, y: 245, h: 0 }, moored: true,
    exit: { x: 0, y: 0, w: 390, h: 85 },
    tip: 'Three ships hemming you in. Let go all lines, use bow and stern thrusters to walk sideways.'
  },
  {
    name: 'MASTER MARINER', zone: "MASTER'S TEST", mode: 'dock', par: 70,
    wind: { deg: 0, kn: 18, gust: 10 }, current: { deg: 90, kn: 1.5 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }, { x: 8, y: 200, w: 110, h: 46 }],
    island: { x: 8, y: 200, w: 110, h: 46 },
    bollards: [{ x: 336, y: 165 }, { x: 336, y: 245 }, { x: 336, y: 325 }],
    berth: { x: 248, y: 136, w: 74, h: 200 },
    traffic: [
      { x: 300, y: 45, hull: '#E84A5F', hullDark: '#B52F45' },
      { x: 300, y: 420, hull: '#4FA8E0', hullDark: '#2E7DB0' },
      { x: 155, y: 330, hull: '#FFC93C', hullDark: '#E0A820' }
    ],
    spawn: { x: 65, y: 510, h: 0.35 },
    tip: 'The ultimate challenge. Island narrows the channel — thread the needle and make fast!'
  },

  /* ── ELITE TIER — FURY GATES ─────────────────────────────────────── */
  {
    name: 'CROWDED APPROACH', zone: 'FURY GATES', mode: 'dock', par: 65,
    wind: { deg: 0, kn: 18, gust: 9 }, current: { deg: 90, kn: 1.5 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 165 }, { x: 336, y: 245 }, { x: 336, y: 325 }],
    berth: { x: 248, y: 136, w: 74, h: 200 },
    traffic: [
      { x: 300, y: 40,  hull: '#E84A5F', hullDark: '#B52F45' },
      { x: 300, y: 432, hull: '#4FA8E0', hullDark: '#2E7DB0' },
      { x: 155, y: 172, hull: '#FFC93C', hullDark: '#E0A820' },
      { x: 155, y: 388, hull: '#66C28A', hullDark: '#3BA25F' }
    ],
    spawn: { x: 60, y: 510, h: 0.35 },
    tip: 'Four ships jam every lane. Find the gap and slot in!'
  },
  {
    name: 'LOCKED IN', zone: 'FURY GATES', mode: 'undock', par: 58,
    wind: { deg: 0, kn: 18, gust: 9 }, current: { deg: 90, kn: 1.5 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 165 }, { x: 336, y: 245 }, { x: 336, y: 325 }],
    berth: { x: 248, y: 136, w: 74, h: 200 },
    traffic: [
      { x: 300, y: 40,  hull: '#E84A5F', hullDark: '#B52F45' },
      { x: 300, y: 432, hull: '#4FA8E0', hullDark: '#2E7DB0' },
      { x: 155, y: 172, hull: '#FFC93C', hullDark: '#E0A820' },
      { x: 155, y: 388, hull: '#66C28A', hullDark: '#3BA25F' }
    ],
    spawn: { x: 303, y: 245, h: 0 }, moored: true,
    exit: { x: 0, y: 0, w: 390, h: 85 },
    tip: 'Four ships box you in. Thread the gap slowly — speed kills here!'
  },
  {
    name: 'FURY GATES', zone: 'FURY GATES', mode: 'dock', par: 60,
    wind: { deg: 0, kn: 20, gust: 11 }, current: { deg: 270, kn: 1.5 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }, { x: 8, y: 195, w: 110, h: 46 }],
    island: { x: 8, y: 195, w: 110, h: 46 },
    bollards: [{ x: 336, y: 165 }, { x: 336, y: 245 }, { x: 336, y: 325 }],
    berth: { x: 248, y: 136, w: 74, h: 200 },
    traffic: [
      { x: 300, y: 40,  hull: '#E84A5F', hullDark: '#B52F45' },
      { x: 300, y: 432, hull: '#4FA8E0', hullDark: '#2E7DB0' },
      { x: 175, y: 338, hull: '#FFC93C', hullDark: '#E0A820' }
    ],
    spawn: { x: 60, y: 515, h: 0.35 },
    tip: 'Island gate, max wind against current — commit to the approach early!'
  },

  /* ── ELITE TIER — GHOST HARBOUR ──────────────────────────────────── */
  {
    name: 'ROGUE CURRENT', zone: 'GHOST HARBOUR', mode: 'dock', par: 58,
    wind: { deg: 0, kn: 16, gust: 8 }, current: { deg: 90, kn: 2.0 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 165 }, { x: 336, y: 245 }, { x: 336, y: 325 }],
    berth: { x: 248, y: 136, w: 74, h: 200 },
    traffic: [
      { x: 300, y: 40,  hull: '#A67DB8', hullDark: '#7A5090' },
      { x: 300, y: 432, hull: '#5A6B78', hullDark: '#3A4B58' }
    ],
    spawn: { x: 65, y: 510, h: 0.35 },
    tip: 'A two-knot rogue current rips down the channel. Aim far upstream!'
  },
  {
    name: 'PHANTOM SLIP', zone: 'GHOST HARBOUR', mode: 'undock', par: 52,
    wind: { deg: 0, kn: 18, gust: 10 }, current: { deg: 270, kn: 2.0 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 165 }, { x: 336, y: 245 }, { x: 336, y: 325 }],
    berth: { x: 248, y: 136, w: 74, h: 200 },
    traffic: [
      { x: 300, y: 40,  hull: '#A67DB8', hullDark: '#7A5090' },
      { x: 300, y: 432, hull: '#5A6B78', hullDark: '#3A4B58' },
      { x: 155, y: 258, hull: '#E84A5F', hullDark: '#B52F45' }
    ],
    spawn: { x: 303, y: 245, h: 0 }, moored: true,
    exit: { x: 0, y: 0, w: 390, h: 85 },
    tip: 'Ebb tide rips north, ship in the channel — release lines and slide west!'
  },
  {
    name: 'DARK CHANNEL', zone: 'GHOST HARBOUR', mode: 'dock', par: 52,
    wind: { deg: 0, kn: 18, gust: 10 }, current: { deg: 90, kn: 2.0 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }, { x: 8, y: 195, w: 110, h: 46 }],
    island: { x: 8, y: 195, w: 110, h: 46 },
    bollards: [{ x: 336, y: 165 }, { x: 336, y: 245 }, { x: 336, y: 325 }],
    berth: { x: 248, y: 136, w: 72, h: 200 },
    traffic: [
      { x: 300, y: 40,  hull: '#A67DB8', hullDark: '#7A5090' },
      { x: 300, y: 432, hull: '#5A6B78', hullDark: '#3A4B58' },
      { x: 175, y: 172, hull: '#E84A5F', hullDark: '#B52F45' },
      { x: 175, y: 338, hull: '#FFC93C', hullDark: '#E0A820' }
    ],
    spawn: { x: 60, y: 515, h: 0.35 },
    tip: 'Max current, island narrows, four ships — feel the dark!'
  },

  /* ── ELITE TIER — LEGEND'S DOCK ──────────────────────────────────── */
  {
    name: "LEGEND'S APPROACH", zone: "LEGEND'S DOCK", mode: 'dock', par: 50,
    wind: { deg: 0, kn: 20, gust: 11 }, current: { deg: 90, kn: 2.0 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }, { x: 8, y: 195, w: 110, h: 46 }],
    island: { x: 8, y: 195, w: 110, h: 46 },
    bollards: [{ x: 336, y: 165 }, { x: 336, y: 245 }, { x: 336, y: 325 }],
    berth: { x: 248, y: 136, w: 72, h: 200 },
    traffic: [
      { x: 300, y: 40,  hull: '#E84A5F', hullDark: '#B52F45' },
      { x: 300, y: 432, hull: '#4FA8E0', hullDark: '#2E7DB0' },
      { x: 155, y: 172, hull: '#FFC93C', hullDark: '#E0A820' },
      { x: 155, y: 388, hull: '#66C28A', hullDark: '#3BA25F' }
    ],
    spawn: { x: 60, y: 515, h: 0.35 },
    tip: 'Only legends attempt this. Max wind, max current, four ships, island gate. Go.'
  },
  {
    name: 'NO QUARTER', zone: "LEGEND'S DOCK", mode: 'undock', par: 45,
    wind: { deg: 0, kn: 20, gust: 11 }, current: { deg: 270, kn: 2.0 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }],
    bollards: [{ x: 336, y: 165 }, { x: 336, y: 245 }, { x: 336, y: 325 }],
    berth: { x: 248, y: 136, w: 72, h: 200 },
    traffic: [
      { x: 300, y: 40,  hull: '#E84A5F', hullDark: '#B52F45' },
      { x: 300, y: 432, hull: '#4FA8E0', hullDark: '#2E7DB0' },
      { x: 155, y: 172, hull: '#FFC93C', hullDark: '#E0A820' },
      { x: 155, y: 388, hull: '#66C28A', hullDark: '#3BA25F' }
    ],
    spawn: { x: 303, y: 245, h: 0 }, moored: true,
    exit: { x: 0, y: 0, w: 390, h: 85 },
    tip: 'Max wind, max current, four ships. Thread the gap — no quarter given!'
  },
  {
    name: 'GRANDMASTER', zone: "LEGEND'S DOCK", mode: 'dock', par: 40,
    wind: { deg: 0, kn: 20, gust: 12 }, current: { deg: 90, kn: 2.0 }, tide: true,
    quays: [{ x: 322, y: -80, w: 140, h: 700 }, { x: 8, y: 180, w: 120, h: 52 }],
    island: { x: 8, y: 180, w: 120, h: 52 },
    bollards: [{ x: 336, y: 165 }, { x: 336, y: 245 }, { x: 336, y: 325 }],
    berth: { x: 248, y: 136, w: 70, h: 200 },
    traffic: [
      { x: 300, y: 40,  hull: '#E84A5F', hullDark: '#B52F45' },
      { x: 300, y: 432, hull: '#4FA8E0', hullDark: '#2E7DB0' },
      { x: 155, y: 172, hull: '#FFC93C', hullDark: '#E0A820' },
      { x: 155, y: 388, hull: '#66C28A', hullDark: '#3BA25F' }
    ],
    spawn: { x: 55, y: 515, h: 0.35 },
    tip: 'The hardest berth in the game. Biggest island, tightest slot, full storm. This is Grandmaster.'
  }
];

DS.ZONES = [
  { name: 'SUNNY COVE',    blurb: 'learn the ropes',       color: '#FFC93C' },
  { name: 'WINDY POINT',   blurb: 'wind joins in',         color: '#7ED4E6' },
  { name: 'TIDE TOWN',     blurb: 'currents & tide',       color: '#66C28A' },
  { name: 'STORM STRAIT',  blurb: 'race the clock',        color: '#5A6B78', dark: true },
  { name: 'BUSY PORT',     blurb: 'harbor traffic',        color: '#E8956D' },
  { name: 'MONSOON BAY',   blurb: 'monsoon winds',         color: '#A67DB8', dark: true },
  { name: 'TYPHOON REACH', blurb: 'extreme weather',       color: '#E84A5F', dark: true },
  { name: "MASTER'S TEST", blurb: 'no margin for error',   color: '#2C3E50', dark: true },
  { name: 'FURY GATES',    blurb: 'four-ship gauntlet',    color: '#FF5733', dark: true },
  { name: 'GHOST HARBOUR', blurb: 'rogue tides & darkness', color: '#3D405B', dark: true },
  { name: "LEGEND'S DOCK", blurb: 'nothing held back',      color: '#B7950B', dark: true }
];

DS.SKINS = [
  { id: 'tug',     name: "Lil' Tug",    price: 0,   currency: 'coins', hull: '#E85D4A', hullDark: '#C74534', deck: '#F7EFE2', accent: '#FFC93C', containers: true },
  { id: 'ferry',   name: 'Sunny Ferry', price: 400, currency: 'coins', hull: '#FFFFFF', hullDark: '#9BB0BC', deck: '#66C28A', accent: '#FFF8EE', containers: false },
  { id: 'bigblue', name: 'Big Blue',    price: 250, currency: 'gems',  hull: '#4FA8E0', hullDark: '#2E7DB0', deck: '#F7EFE2', accent: '#FFB13C', containers: true },
  { id: 'queen',   name: 'Star Queen',  price: 400, currency: 'gems',  hull: '#FFF8EE', hullDark: '#C9B888', deck: '#FFFFFF', accent: '#FFC93C', containers: false }
];
