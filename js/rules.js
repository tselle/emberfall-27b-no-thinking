/* Emberfall — rules.js
 * Dice, races, classes, ability modifiers, THAC0, saves, spell slots, turning,
 * thief skills, PC creation, XP and derived stats.
 * Derived numbers are always recomputed from current equipment/effects;
 * the sheet never stores stale copies.
 *
 * Note on the strength table: this game uses its own 18-scale table where
 * 12-17 each give +1, 18 gives +2, and the percentile (18/xx) grants +3..+5.
 */
'use strict';
(function () {
const R = window.R = {};

/* ---------------- randomness ---------------- */
/* Content generator uses seeded Mulberry32; play rolls use Math.random.
 * Tests may pin play rolls with R.pinPlay(seed). */
R.mulberry32 = function (seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
let _pin = null;
/* string -> 32-bit seed (deterministic across sessions) */
R.hash = function (s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
R.pinPlay = function (seed) { _pin = seed == null ? null : R.mulberry32(seed); };
R.rand = function () { return _pin ? _pin() : Math.random(); };
R.i = function (rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }; /* inclusive */
R.pick = function (arr, rng) { return arr[Math.floor(rng() * arr.length)]; };
R.chance = function (pct, rng) { return (rng || R.rand)() * 100 < pct; };

/* ---------------- dice: "NdS+K" / "NdS-K" / fixed ---------------- */
R.dice = function (expr, rng) {
  rng = rng || R.rand;
  if (typeof expr === 'number') return { t: expr, s: String(expr) };
  const m = String(expr).trim().match(/^(\d*)[dD](\d+)(?:([+\-])(\d+))?$/) ||
            String(expr).trim().match(/^([+\-]?\d+)$/);
  if (!m) return { t: parseInt(expr, 10) || 0, s: String(expr) };
  if (!m[2]) return { t: parseInt(m[1], 10), s: m[1] };
  const n = m[1] ? +m[1] : 1, s = +m[2];
  let t = 0; const rolls = [];
  for (let k = 0; k < n; k++) { const r = 1 + Math.floor(rng() * s); rolls.push(r); t += r; }
  const mod = m[3] ? (m[3] === '-' ? -1 : 1) * +m[4] : 0;
  t += mod;
  return { t: t, s: (n > 1 ? n : '') + 'd' + s + (mod ? (mod > 0 ? '+' + mod : mod) : '') + ' = ' + t, rolls: rolls };
};
R.d = function (expr, rng) { return R.dice(expr, rng).t; };
R.d20 = function (rng) { return 1 + Math.floor((rng || R.rand)() * 20); };

/* ---------------- abilities ---------------- */
R.AB = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
R.abilityMod = function (v) {
  if (v >= 18) return 3; if (v >= 16) return 2; if (v >= 14) return 1;
  if (v >= 12) return 0; if (v >= 10) return -1; if (v >= 8) return -2;
  if (v >= 6) return -3; if (v >= 4) return -4; if (v >= 3) return -5; return -6;
};
/* Emberfall strength table: 9-11 0, 12-17 +1, 18 +2, percentile 18/xx */
R.strMod = function (char) {
  const s = char.ab.STR;
  if (s < 9) return -2;
  if (s < 12) return 0;
  if (s < 18) return 1;
  if (!char.strx) return 2;
  if (char.strx >= 76) return 5;
  if (char.strx >= 51) return 4;
  if (char.strx >= 1) return 3;
  return 2;
};
R.dexDef = function (v) { return v >= 18 ? 3 : v >= 16 ? 2 : v >= 13 ? 1 : 0; };

/* ---------------- alignments ---------------- */
R.ALIGNS = ['LG', 'NG', 'CG', 'LN', 'TN', 'CN', 'LE', 'NE', 'CE'];
R.ANAME = { LG: 'Lawful Good', NG: 'Neutral Good', CG: 'Chaotic Good', LN: 'Lawful Neutral',
  TN: 'True Neutral', CN: 'Chaotic Neutral', LE: 'Lawful Evil', NE: 'Neutral Evil', CE: 'Chaotic Evil' };
R.isGood = a => a === 'LG' || a === 'NG' || a === 'CG';

/* ---------------- races ----------------
 * adj = ability adjustments; limits = raw ability maxima; mv base. */
R.RACES = {
  H:  { name: 'Human',    mv: 12, adj: {},
        limits: { STR: 18, DEX: 18, CON: 18, INT: 18, WIS: 18, CHA: 18 },
        cls: ['F', 'P', 'R', 'M', 'C', 'T'] },
  D:  { name: 'Dwarf',    mv: 10, adj: { CON: 1, CHA: -1 },
        limits: { STR: 18, DEX: 14, CON: 18, INT: 14, WIS: 15, CHA: 12 },
        cls: ['F', 'C', 'T'] },
  E:  { name: 'Elf',      mv: 12, adj: { DEX: 1, CON: -1 },
        limits: { STR: 17, DEX: 18, CON: 15, INT: 17, WIS: 14, CHA: 12 },
        cls: ['F', 'R', 'M', 'C', 'T'] },
  G:  { name: 'Gnome',    mv: 10, adj: { INT: 1, WIS: -1 },
        limits: { STR: 14, DEX: 15, CON: 15, INT: 18, WIS: 14, CHA: 12 },
        cls: ['F', 'C', 'T'] },
  HE: { name: 'Half-elf', mv: 12, adj: {},
        limits: { STR: 17, DEX: 18, CON: 15, INT: 17, WIS: 15, CHA: 15 },
        cls: ['F', 'R', 'M', 'C', 'T'] },
  HA: { name: 'Halfling', mv: 10, adj: { DEX: 1, STR: -1 },
        limits: { STR: 15, DEX: 18, CON: 15, INT: 15, WIS: 14, CHA: 12 },
        cls: ['F', 'C', 'T'] },
};
R.RACE_ORDER = ['H', 'D', 'E', 'G', 'HE', 'HA'];
/* racial combat/exploration notes */
R.raceTrait = function (race, kind) {
  switch (kind) {
    case 'sleepRes': if (race === 'E') return 90; if (race === 'HE') return 30; return 0;
    case 'secretDoor': return race === 'E' || race === 'HE';      /* passive 1/6 passing discovery */
    case 'swordBonus': return race === 'E';                        /* sword/bow +1 */
    case 'bowBonus': return race === 'E';
    case 'ghoulPar': return race === 'E';
    case 'slings': return race === 'HA';
    case 'humanoidBon': return race === 'D' || race === 'G';       /* +1 vs goblins/hobgoblins/orcs */
    case 'bigBon': return race === 'D' || race === 'G';            /* +1 vs large foes */
    case 'magicSave': return race === 'D' || race === 'G' || race === 'HA'; /* save vs spell +1 */
    case 'poisonSave': return race === 'D' || race === 'HA';
    case 'lightArmor': return race === 'HA';                        /* halflings favor light armor: +1 AC in it */
    case 'surpriseHelp': return race === 'R';
    case 'fastStealth': return race === 'E' || race === 'HA';      /* light-armor stealth for surprise */
    case 'searchSecret': return race === 'E' || race === 'HE';     /* 2/6 on search, 1/6 passing */
    default: return false;
  }
};

/* ---------------- classes ---------------- */
/* XP tables index by level (1..20); entry = XP required to REACH that level. */
const XP = {
  F: [0, 2000, 4500, 9000, 14000, 20000, 27000, 35000, 45000, 55000, 70000, 85000, 100000, 130000, 160000, 190000, 230000, 280000, 330000, 400000],
  P: [0, 2250, 5000, 10000, 15750, 22500, 30375, 39375, 50625, 62250, 75000, 90000, 107500, 132500, 160000, 190000, 227500, 270000, 315000, 375000],
  R: [0, 2250, 5000, 10000, 15750, 22500, 30375, 39375, 50625, 62250, 75000, 90000, 107500, 132500, 160000, 190000, 227500, 270000, 315000, 375000],
  M: [0, 2500, 6000, 11000, 18000, 27000, 37500, 50000, 65000, 85000, 110000, 135000, 165000, 200000, 240000, 280000, 330000, 385000, 450000, 525000],
  C: [0, 1500, 4500, 9000, 14000, 20000, 27000, 35000, 45000, 55000, 70000, 85000, 100000, 130000, 160000, 190000, 230000, 280000, 330000, 400000],
  T: [0, 1250, 3750, 7500, 11250, 15000, 20000, 27500, 37500, 50000, 65000, 80000, 95000, 110000, 130000, 160000, 190000, 225000, 260000, 300000],
};
/* spell slots by level (index level; 9 entries = levels 1..9) */
const MAGE_SLOTS = [
  null, [1, 0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 0, 0, 0, 0, 0, 0],
  [2, 1, 1, 1, 0, 0, 0, 0, 0], [2, 2, 1, 1, 1, 0, 0, 0, 0], [2, 2, 2, 1, 1, 1, 0, 0, 0],
  [3, 2, 2, 2, 1, 1, 1, 0, 0], [3, 3, 2, 2, 2, 1, 1, 1, 0], [3, 3, 3, 2, 2, 2, 1, 1, 1],
  [4, 3, 3, 2, 2, 2, 2, 1, 1], [4, 4, 3, 3, 2, 2, 2, 2, 1], [4, 4, 4, 3, 3, 2, 2, 2, 2],
  [4, 4, 4, 4, 3, 3, 2, 2, 2], [5, 4, 4, 4, 3, 3, 3, 2, 2], [5, 5, 4, 4, 4, 3, 3, 3, 2],
  [5, 5, 5, 4, 4, 4, 3, 3, 3], [5, 5, 5, 5, 4, 4, 4, 3, 3], [5, 5, 5, 5, 5, 4, 4, 4, 3],
  [5, 5, 5, 5, 5, 5, 4, 4, 4]
];
const CLERIC_SLOTS = [
  null, [1, 0, 0, 0, 0, 0, 0, 0, 0], [2, 0, 0, 0, 0, 0, 0, 0, 0], [2, 1, 0, 0, 0, 0, 0, 0, 0],
  [2, 2, 0, 0, 0, 0, 0, 0, 0], [3, 2, 0, 0, 0, 0, 0, 0, 0], [3, 3, 0, 0, 0, 0, 0, 0, 0],
  [3, 3, 1, 0, 0, 0, 0, 0, 0], [4, 3, 1, 0, 0, 0, 0, 0, 0], [4, 4, 1, 0, 0, 0, 0, 0, 0],
  [4, 4, 2, 0, 0, 0, 0, 0, 0], [5, 4, 2, 0, 0, 0, 0, 0, 0], [5, 5, 2, 0, 0, 0, 0, 0, 0],
  [5, 5, 3, 0, 0, 0, 0, 0, 0], [5, 5, 3, 1, 0, 0, 0, 0, 0], [5, 5, 3, 2, 0, 0, 0, 0, 0],
  [5, 5, 4, 2, 0, 0, 0, 0, 0], [5, 5, 4, 3, 0, 0, 0, 0, 0], [5, 5, 5, 3, 0, 0, 0, 0, 0],
  [5, 5, 5, 3, 1, 0, 0, 0, 0]
];
/* paladin subset of priest spells, by paladin casting level 1..9 */
R.PALADIN_LIST = {
  1: ['clw', 'command', 'bless'],
  2: ['hold_person_c', 'pfe'],
  3: ['prayer', 'dispel_p'],
  4: ['cure_sw', 'free_action'],
  5: ['cure_cw', 'flame_strike'],
  6: ['heal', 'neutralize'],
  7: ['holy_word'],
  8: ['holy_word'],
  9: ['holy_word']
};

R.CLASSES = {
  F: { name: 'Fighter', hd: 10, pr: ['STR'], min: { STR: 9 }, gold: '5d4', xp: XP.F,
       aligns: R.ALIGNS, save: 'W', armor: 'any', spec: true },
  P: { name: 'Paladin', hd: 10, pr: ['STR', 'CHA'], min: { STR: 12, CON: 9, WIS: 13, CHA: 17 },
       gold: '5d4', xp: XP.P, aligns: ['LG'], human: true, save: 'W', armor: 'any', lay: true,
       turnAs: c => c.lvl >= 3 ? c.lvl - 2 : 0, castAs: c => Math.max(1, Math.min(9, c.lvl - 8)) },
  R: { name: 'Ranger', hd: 10, pr: ['STR', 'DEX', 'WIS'], min: { STR: 13, DEX: 13, CON: 14, WIS: 14 },
       gold: '5d4', xp: XP.R, aligns: ['LG', 'NG', 'CG'], save: 'W', armor: 'any', foe: true },
  M: { name: 'Mage', hd: 4, pr: ['INT'], min: { INT: 9 }, gold: '1d4+1', xp: XP.M,
       aligns: R.ALIGNS, save: 'M', slots: MAGE_SLOTS, noArmor: true, castAs: c => c.lvl },
  C: { name: 'Cleric', hd: 8, pr: ['WIS'], min: { WIS: 9 }, gold: '3d6', xp: XP.C,
       aligns: R.ALIGNS, save: 'P', slots: CLERIC_SLOTS, turn: true, castAs: c => c.lvl },
  T: { name: 'Thief', hd: 6, pr: ['DEX'], min: { DEX: 9 }, gold: '2d6', xp: XP.T,
       aligns: R.ALIGNS.filter(a => a !== 'LG'), save: 'T', armor: 'light' }
};
R.CLASS_ORDER = ['F', 'P', 'R', 'M', 'C', 'T'];
R.SAVE_NAMES = ['Paralysis/Poison/Death', 'Rod/Staff/Wand', 'Petrification/Polymorph', 'Breath', 'Spell'];

/* group save tables (level 1..20): [save1..save5] */
const SAVE_T = {
  W: [ /* warriors */
    [14, 16, 15, 17, 17], [13, 15, 15, 16, 16], [13, 15, 14, 16, 16], [12, 14, 14, 15, 15],
    [12, 14, 13, 15, 15], [11, 13, 13, 14, 14], [11, 13, 12, 14, 14], [10, 12, 12, 13, 13],
    [10, 12, 11, 13, 13], [9, 11, 11, 12, 12], [9, 11, 10, 12, 12], [8, 10, 10, 11, 11],
    [8, 10, 9, 11, 11], [7, 9, 9, 10, 10], [7, 9, 8, 10, 10], [6, 8, 8, 9, 9],
    [6, 8, 7, 9, 9], [5, 7, 7, 8, 8], [5, 7, 6, 8, 8], [4, 6, 6, 7, 7]
  ],
  P: [ /* priests */
    [15, 17, 16, 18, 18], [14, 16, 15, 17, 17], [14, 16, 15, 17, 17], [13, 15, 14, 16, 16],
    [13, 15, 14, 16, 16], [12, 14, 13, 15, 15], [12, 14, 13, 15, 15], [11, 13, 12, 14, 14],
    [11, 13, 12, 14, 14], [10, 12, 11, 13, 13], [10, 12, 11, 13, 13], [9, 11, 10, 12, 12],
    [9, 11, 10, 12, 12], [8, 10, 10, 11, 11], [8, 10, 10, 11, 11], [7, 9, 9, 10, 10],
    [7, 9, 9, 10, 10], [6, 8, 8, 9, 9], [6, 8, 8, 9, 9], [5, 7, 7, 8, 8]
  ],
  T: [ /* thieves */
    [15, 17, 16, 18, 18], [14, 16, 15, 17, 17], [14, 16, 15, 17, 17], [13, 15, 14, 16, 16],
    [13, 15, 14, 16, 16], [12, 14, 13, 15, 15], [12, 14, 13, 15, 15], [11, 13, 12, 14, 14],
    [11, 13, 12, 14, 14], [10, 12, 11, 13, 13], [10, 12, 11, 13, 13], [9, 11, 10, 12, 12],
    [9, 11, 10, 12, 12], [8, 10, 10, 11, 11], [8, 10, 10, 11, 11], [7, 9, 9, 10, 10],
    [7, 9, 9, 10, 10], [6, 8, 8, 9, 9], [6, 8, 8, 9, 9], [5, 7, 7, 8, 8]
  ],
  M: [ /* mages */
    [17, 19, 17, 19, 19], [16, 18, 16, 18, 18], [16, 18, 16, 18, 18], [15, 17, 15, 17, 17],
    [15, 17, 15, 17, 17], [14, 16, 14, 16, 16], [14, 16, 14, 16, 16], [13, 15, 13, 15, 15],
    [13, 15, 13, 15, 15], [12, 14, 12, 14, 14], [12, 14, 12, 14, 14], [11, 13, 11, 13, 13],
    [11, 13, 11, 13, 13], [10, 12, 10, 12, 12], [10, 12, 10, 12, 12], [9, 11, 9, 11, 11],
    [9, 11, 9, 11, 11], [8, 10, 8, 10, 10], [8, 10, 8, 10, 10], [7, 9, 7, 9, 9]
  ]
};

/* THAC0 by class group and level (n = level-1) */
R.thac0 = function (cls, lvl) {
  const n = Math.max(0, lvl - 1);
  if (cls === 'F' || cls === 'P' || cls === 'R') return 20 - n;
  if (cls === 'C') return 20 - 2 * Math.floor(n / 3);
  if (cls === 'T') return 20 - Math.floor(n / 2);
  return 20 - Math.floor(n / 3); /* mage */
};
R.thac0For = c => R.thac0(c.cls, c.lvl);

/* ---------------- thief skills ---------------- */
/* base by level 1..20 */
const TS = {
  OL: [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 90, 95, 95, 95, 95],
  FT: [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 85, 90, 90, 95, 95],
  RT: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 80, 85, 85, 90, 90],
  MS: [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 85, 90, 90, 95, 95],
  HS: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 80, 85, 85, 90, 90],
  HN: [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 85, 90, 90, 95, 95]
};
R.SKILL_NAMES = { OL: 'Open Locks', FT: 'Find Traps', RT: 'Remove Traps', MS: 'Move Silently', HS: 'Hide in Shadows', HN: 'Hear Noise' };
R.thiefSkill = function (c, key) {
  if (c.cls !== 'T' || c.dead) return 0;
  let v = TS[key][Math.min(19, c.lvl - 1)];
  v += R.abilityMod(c.ab.DEX);
  if (key === 'OL' && c.race === 'D') v += 10;
  if ((key === 'FT' || key === 'RT') && c.race === 'G') v += 10;
  if ((key === 'MS' || key === 'HN') && c.race === 'HA') v += 10;
  if (c.eq.gloves && D.item(c.eq.gloves).thief) v += 10;
  return Math.max(0, Math.min(95, v));
};

/* ---------------- turning ---------------- */
R.turning = function (clericLvl, rank, rng) {
  const d20 = R.d20(rng);
  const v = d20 + clericLvl - rank;
  let effect = 'none';
  if (v >= 19) effect = clericLvl >= 9 ? 'destroy' : 'turn';
  else if (v >= 11) effect = 'turn';
  else if (v >= 5) effect = 'flee';
  return { d20: d20, v: v, effect: effect };
};
R.undeadRank = function (mon) { return mon.rank != null ? mon.rank : Math.max(1, Math.ceil(mon.hd)); };

/* ---------------- equipment ---------------- */
R.SLOTS = ['w', 'm', 'a', 's', 'r1', 'r2', 'cloak', 'boots', 'gloves', 'belt', 'neck', 'charm'];
R.SLOT_NAMES = { w: 'Melee', m: 'Missile', a: 'Armor', s: 'Shield', r1: 'Ring 1', r2: 'Ring 2',
  cloak: 'Cloak', boots: 'Boots', gloves: 'Gloves', belt: 'Belt', neck: 'Neck', charm: 'Charm' };

R.canEquip = function (c, item) {
  if (!item) return false;
  if (item.type === 'w' || item.type === 'r' || item.type === 'a' || item.type === 's' ||
      item.type === 'g' || item.type === 'm') {
    if (c.cls === 'M') {
      /* mages: no ordinary armor/shield; dagger, staff, darts or sling only */
      if (item.type === 'a' || item.type === 's') return false;
      if (item.type === 'w' && !['dagger', 'staff'].includes(item.fam)) return false;
      if (item.type === 'r' && !['darts', 'sling'].includes(item.fam)) return false;
    }
    if (c.cls === 'T' && item.type === 'a' && item.armorAC < 7) return false; /* light only: leather(7)/studded(6) */
    if (c.cls === 'C' && item.type === 'w' && item.blunt === false) return false; /* blunt weapons */
  }
  if (item.q && c.cls !== 'T' && c.cls !== 'F') { /* quest items carry freely; keep simple */ }
  return true;
};

/* ---------------- derived stats ---------------- */
R.worn = function (c) {
  const w = {};
  for (const s of R.SLOTS) if (c.eq[s]) w[s] = D.item(c.eq[s]);
  return w;
};
R.armorItem = c => R.worn(c).a;
R.shieldItem = c => R.worn(c).s;

R.acFor = function (c) {
  let ac = 10;
  const a = R.worn(c).a;
  if (a) ac = a.armorAC != null ? a.armorAC : 10 - (a.ench || 0); /* armorAC already includes enchant for magic mail */
  else ac = 10 - (R.worn(c).r1 && R.worn(c).r1.br ? 0 : 0);
  const s = R.worn(c).s;
  if (s) ac -= 1 + (s.ench || 0);
  ac -= R.dexDef(c.ab.DEX);
  /* bracers / cloak of protection */
  for (const s2 of ['r1', 'r2', 'cloak', 'boots', 'belt', 'neck', 'charm', 'gloves']) {
    const it = R.worn(c)[s2];
    if (it && it.br) ac -= it.br;
  }
  if (a && c.race === 'HA' && (a.fam === 'leather' || a.fam === 'studded')) ac -= 1; /* halfling light-armor favor */
  /* mage armor spell: AC 6 field until damage */
  if (c.fx.armor && c.fx.armor.dmg < c.fx.armor.cap) ac = Math.min(ac, 6);
  return ac;
};

/* attack rate: "a/b" over two rounds; returns [even, odd] attacks */
R.rate = function (c, witem) {
  let full = 0, half = 0;
  if (c.cls === 'F' || c.cls === 'P' || c.cls === 'R') {
    if (c.lvl >= 13) full = 2; else if (c.lvl >= 7) { full = 1; half = 1; } else full = 1;
  } else full = 1;
  if (c.cls === 'F' && c.spec && witem && witem.fam === c.spec) half += 1;
  const even = full * 2 + half, odd = full * 2;
  return [even, odd]; /* attacks on even / odd rounds */
};
R.offhand = function (c) {
  if (c.cls !== 'R' || !c.foe) return false;
  const a = R.worn(c).a, s = R.worn(c).s, w = R.worn(c).w;
  if (s) return false;
  if (a && a.armorAC < 7) return false; /* light or none */
  if (!w || w.hands !== 1) return false;
  return true;
};

/* melee hit modifiers for a character with weapon item (or null = fist) */
R.meleeHitMod = function (c, witem, target) {
  let m = R.strMod(c);
  const fam = witem ? witem.fam : null;
  if (c.cls === 'F' && c.spec && fam && fam === c.spec) m += 1;
  if (c.cls === 'R' && c.foe && fam && witem) {
    if (witem.slay && target && target.tags && target.tags.some(t => witem.slay.includes(t))) m += 3;
    if (witem.slay && target && target.tags && target.tags.includes(c.foe)) m += 2;
  }
  if (c.cls === 'R' && c.foe && target && target.tags && target.tags.includes(c.foe)) m += 4;
  if (c.race === 'E' && fam && (fam === 'longsword' || fam === 'shortsword' || fam === 'broadsword' || fam === 'dagger')) m += 1;
  if (c.race === 'D' || c.race === 'G') {
    if (target && (target.tags || []).some(t => ['gob', 'orc', 'kob'].includes(t))) m += 1;
    if (target && (target.size === 'L' || target.size === 'H')) m += 1;
  }
  if (c.cls === 'P' && target && (target.tags || []).some(t => ['und', 'elv', 'ev'].includes(t)) && target.alignEvil) m -= 1;
  const w = R.worn(c);
  for (const s2 of ['r1', 'r2', 'belt', 'neck', 'charm']) {
    const it = w[s2];
    if (it && it.hit) m += it.hit;
  }
  if (w.ring_wiz) m += 0;
  return m;
};
R.missileHitMod = function (c, target) {
  let m = 0;
  if (c.race === 'E') m += 1;
  if (c.race === 'HA') m += 1;
  const w = R.worn(c);
  for (const s2 of ['r1', 'r2', 'belt', 'neck', 'charm']) { const it = w[s2]; if (it && it.hit) m += it.hit; }
  return m;
};

/* attack roll vs target AC (descending). Returns {hit, nat, total, need} */
R.attack = function (d20v, hitMod, thac0, targetAC, helpless, rng) {
  const nat = d20v;
  const need = thac0 - targetAC;
  const total = nat + hitMod;
  let hit;
  if (helpless) hit = true;
  else if (nat === 1) hit = false;
  else if (nat === 20) hit = true;
  else hit = total >= need;
  return { hit: hit, nat: nat, total: total, need: need };
};

/* damage for a weapon item vs target size; strBonus for melee */
R.dmgRoll = function (witem, size, rng) {
  let expr = (size === 'S' && witem.dmgS) ? witem.dmgS : ((size === 'L' || size === 'H' || size === 'G') && witem.dmgL ? witem.dmgL : witem.dmg);
  const r = R.dice(expr, rng);
  return { t: r.t, s: r.s };
};

/* full character-derived block */
R.derived = function (c) {
  const w = R.worn(c);
  const witem = w.w;
  const rate = R.rate(c, witem);
  const dmg = [];
  if (witem && witem.dmg) {
    const sm = Math.max(0, R.strMod(c));
    dmg.push((witem.fam && (witem.fam === 'dagger' || witem.fam === 'staff' ? 0 : sm)) > 0 ? sm : 0);
  }
  return {
    ac: R.acFor(c),
    thac0: R.thac0For(c),
    mv: R.RACES[c.race].mv - (w.a && w.a.slow ? 2 : 0),
    rate: rate,
    hit: R.meleeHitMod(c, witem, null),
    saves: R.savesFor(c)
  };
};
R.savesFor = function (c) {
  const grp = R.CLASSES[c.cls].save;
  const base = SAVE_T[grp][Math.min(19, c.lvl - 1)];
  const out = base.slice();
  if (c.cls === 'P') { out[0] -= 2; out[1] -= 2; out[2] -= 2; out[3] -= 2; out[4] -= 2; } /* paladin +2 saves */
  const race = c.race;
  if (R.raceTrait(race, 'magicSave')) out[4] -= 1;
  if (R.raceTrait(race, 'poisonSave')) out[0] -= 1;
  if (R.raceTrait(race, 'ghoulPar')) out[0] -= 1;
  /* WIS mental adjustment on spell saves */
  const wm = c.ab.WIS;
  if (wm >= 16) out[4] -= 1; else if (wm <= 11) out[4] += 1;
  /* gear */
  const w = R.worn(c);
  for (const s2 of ['r1', 'r2', 'neck', 'charm', 'belt', 'cloak']) {
    const it = w[s2];
    if (it && it.saveAll) out.forEach((v, i) => { out[i] -= it.saveAll; });
    if (it && it.saveSpell) out[4] -= it.saveSpell;
  }
  if (w.r1 && w.r1.freeAct) out[0] -= 1, out[2] -= 1;
  return out;
};

/* roll a save for a character; returns {ok, roll, target} */
R.rollSave = function (c, idx, extra, rng) {
  const target = R.savesFor(c)[idx] - (extra || 0);
  const roll = R.d20(rng);
  const ok = roll >= target;
  return { ok: ok, roll: roll, target: target };
};

/* ---------------- spell slots / preparation ---------------- */
R.slotsFor = function (c) {
  if (c.cls === 'M') {
    const t = MAGE_SLOTS[Math.min(20, c.lvl)].slice();
    const w = R.worn(c);
    const wiz = (w.r1 && w.r1.wiz) + (w.r2 && w.r2.wiz ? 1 : 0);
    if (wiz) { const f = wiz > 1 ? 2 : 1; for (let i = 0; i < 9; i++) t[i] *= f; }
    return t;
  }
  if (c.cls === 'C') {
    const t = CLERIC_SLOTS[Math.min(20, c.lvl)].slice();
    if (c.ab.WIS >= 17) { t[0] += 1; t[1] += 1; }
    else if (c.ab.WIS >= 15) t[0] += 1;
    return t;
  }
  if (c.cls === 'P') {
    const as = R.CLASSES.P.castAs(c);
    const t = CLERIC_SLOTS[Math.min(20, as)].slice();
    return t;
  }
  return null;
};
R.castLevel = c => (R.CLASSES[c.cls].castAs ? R.CLASSES[c.cls].castAs(c) : 0);
R.wisFail = c => (c.cls === 'C' && c.ab.WIS < 13) ? (13 - c.ab.WIS) * 5 : 0;

R.knownSpells = function (c) {
  const out = [];
  if (c.cls === 'M') {
    for (const id of (c.book || [])) out.push(id);
  } else if (c.cls === 'C' || c.cls === 'P') {
    const as = R.castLevel(c);
    if (as >= 1) {
      for (let l = 1; l <= 9; l++) {
        const list = c.cls === 'P' ? R.PALADIN_LIST[l] : D.priestList(l, Math.min(9, as));
        for (const id of list) if (l <= Math.min(9, as)) out.push(id);
      }
    }
  }
  return out;
};
/* default preparation: first eligible spell per level */
R.defaultPrep = function (c) {
  const prep = {};
  const slots = R.slotsFor(c);
  if (!slots) return prep;
  const known = R.knownSpells(c);
  for (let l = 1; l <= 9; l++) {
    if (!slots[l - 1]) continue;
    const cands = known.filter(id => D.SPELLS[id] && D.SPELLS[id].l === l && D.SPELLS[id].c === (c.cls === 'M' ? 'M' : 'C'));
    if (!cands.length) continue;
    for (let k = 0; k < slots[l - 1]; k++) prep[(l + '')] = prep[(l + '')] || [];
    /* fill with first spell (or rotate through known) */
    for (let k = 0; k < slots[l - 1]; k++) (prep[(l + '')] = prep[(l + '')] || []).push(cands[k % cands.length]);
  }
  return prep;
};
R.prepCount = function (c) {
  const out = {};
  const slots = R.slotsFor(c) || [];
  for (let l = 1; l <= 9; l++) out[l] = 0;
  for (const l in (c.prep || {})) { const n = +l; if (out[n] != null && c.prep[l]) out[n] = Math.min(slots[n - 1] || 0, c.prep[l].length); }
  return out;
};
/* rest: copies prep into mem */
R.remember = function (c) {
  const mem = {};
  const slots = R.slotsFor(c) || [];
  for (const l in (c.prep || {})) {
    const n = +l;
    const cap = slots[n - 1] || 0;
    const arr = (c.prep[l] || []).slice(0, cap);
    for (const id of arr) mem[id] = (mem[id] || 0) + 1;
  }
  c.mem = mem;
  c.layUsed = false;
};
R.memCount = c => { let n = 0; for (const k in (c.mem || {})) n += c.mem[k]; return n; };

/* ---------------- creation ---------------- */
R.rollScores = function (race, cls, rng) {
  const adj = R.RACES[race].adj;
  const lims = R.RACES[race].limits;
  const min = R.CLASSES[cls].min;
  for (let tryN = 0; tryN < 60; tryN++) {
    const raw = {};
    for (const a of R.AB) {
      const rolls = [R.d('d6', rng), R.d('d6', rng), R.d('d6', rng), R.d('d6', rng)].sort((x, y) => y - x);
      raw[a] = rolls[0] + rolls[1] + rolls[2];
    }
    let ok = true;
    for (const a of R.AB) {
      if (raw[a] > lims[a]) { ok = false; break; }
      const v = raw[a] + (adj[a] || 0);
      if (min[a] != null && v < min[a]) ok = false;
    }
    if (ok) return raw;
  }
  /* bounded fallback: fill to minima */
  const raw = {};
  for (const a of R.AB) {
    raw[a] = 10;
    const v = raw[a] + (adj[a] || 0);
    if (min[a] != null && v < min[a]) raw[a] = min[a] - (adj[a] || 0);
    raw[a] = Math.min(raw[a], lims[a]);
  }
  return raw;
};
R.strPercentile = function (cls, rng) {
  const r = R.i(rng, 1, 100);
  return r === 100 ? 0 : r; /* 18/00 shown as 0 */
};
R.newChar = function (o, rng) {
  rng = rng || R.rand;
  const race = o.race, cls = o.cls;
  const raw = o.scores || R.rollScores(race, cls, rng);
  const adj = R.RACES[race].adj;
  const ab = {};
  for (const a of R.AB) ab[a] = raw[a] + (adj[a] || 0);
  let strx = null;
  if (ab.STR === 18 && (cls === 'F' || cls === 'P' || cls === 'R')) strx = R.strPercentile(cls, rng);
  const c = {
    id: o.id || ('pc' + Math.floor(rng() * 1e9).toString(36)),
    name: o.name, race: race, cls: cls, align: o.align || 'TN', color: o.color || '#c8502c',
    ab: ab, strx: strx,
    lvl: 1, xp: 0, hp: 0, maxhp: 0,
    eq: {}, inv: [], spec: null, foe: null,
    book: [], prep: {}, mem: {}, fx: {}, poison: null, dead: false, layUsed: false, lost: false
  };
  if (cls === 'M') c.book = ['magic_missile', 'sleep', 'armor', 'burning_hands', 'shield'];
  if (cls === 'F' && o.spec) c.spec = o.spec;
  if (cls === 'R' && o.foe) c.foe = o.foe;
  c.maxhp = Math.max(1, R.CLASSES[cls].hd + R.abilityMod(ab.CON));
  c.hp = c.maxhp;
  c.prep = R.defaultPrep(c);
  R.remember(c);
  if (o.level && o.level > 1) R.advanceTo(c, o.level, { kit: o.kit !== false, silent: true }, rng);
  return c;
};

/* advance a hero to level (training/roster creation). kit=true applies kit tiers. */
const KIT_LVL = [3, 5, 9, 13, 17];
R.KIT_LVL = KIT_LVL;
R.advanceTo = function (c, lvl, o, rng) {
  o = o || {};
  rng = rng || R.rand;
  while (c.lvl < lvl && c.lvl < 20) {
    const roll = c.lvl <= 9 ? (c.cls === 'T' || c.cls === 'M' ? c.lvl <= 10 : true) : true;
    let h;
    if ((c.cls === 'F' || c.cls === 'P' || c.cls === 'R' || c.cls === 'C') && c.lvl < 10) h = R.d(R.CLASSES[c.cls].hd + 'd8', rng);
    else if ((c.cls === 'T' || c.cls === 'M') && c.lvl < 10) h = R.d(R.CLASSES[c.cls].hd + 'd6', rng);
    else h = (c.cls === 'F' || c.cls === 'P' || c.cls === 'R') ? 3 : (c.cls === 'C' ? 2 : (c.cls === 'T' ? 2 : 1));
    /* spec: warriors/priests roll HD + CON through level 9/10 then fixed */
    if ((c.cls === 'F' || c.cls === 'P' || c.cls === 'R' || c.cls === 'C') && c.lvl < 10) h = R.d(R.CLASSES[c.cls].hd + 'd8', rng) + Math.max(0, R.abilityMod(c.ab.CON));
    else if ((c.cls === 'T' || c.cls === 'M') && c.lvl < 10) h = R.d(R.CLASSES[c.cls].hd + 'd6', rng) + Math.max(0, R.abilityMod(c.ab.CON));
    else h = (c.cls === 'F' || c.cls === 'P' || c.cls === 'R') ? 3 : (c.cls === 'C' ? 2 : (c.cls === 'T' ? 2 : 1));
    c.maxhp += Math.max(1, h);
    c.lvl += 1;
    c.hp += Math.max(1, h);
    if (c.cls === 'M' && !o.silent) c._needSpell = (c._needSpell || 0) + 1;
    if (o.kit && KIT_LVL.includes(c.lvl)) R.applyKit(c, c.lvl, o, rng);
  }
  c.prep = R.defaultPrep(c);
  R.remember(c);
};
/* kit contents for a freshly-created hero reaching a threshold level */
R.kitGold = { 3: 150, 5: 500, 9: 2000, 13: 6000, 17: 12000 };
R.applyKit = function (c, lvl, o, rng) {
  const inv = c.inv;
  const gold = R.kitGold[lvl] || 0;
  if (o.onGold) o.onGold(gold); else if (o.pool) o.pool += gold;
  /* magic/silver gear by tier */
  const add = id => inv.push(id);
  if (lvl >= 17) { add('ring_wizardry'); add('cloak_protection2'); add('chainmail2'); }
  else if (lvl >= 13) { add('ring_wizardry'); add('cloak_protection1'); add('chainmail1'); }
  else if (lvl >= 9) { add('ring_protection1'); add('cloak_protection1'); add('studded1'); add('silver_long'); }
  else if (lvl >= 5) { add('ring_protection1'); add('chainmail1'); add('sword_plus1'); }
  else if (lvl >= 3) { add('studded1'); add('sword_plus1'); add('shield1'); }
  if (c.cls === 'M') {
    /* a new eligible spell per level gained is handled by caller via o.onSpell */
  }
};

/* ---------------- XP / progression ---------------- */
R.xpTable = c => R.CLASSES[c.cls].xp;
R.nextXp = c => {
  const t = R.xpTable(c);
  return c.lvl >= 20 ? null : t[c.lvl];
};
R.xpBonus = c => c.cls && c.primeOK(c) !== undefined ? c.primeOK(c) :
  R.CLASSES[c.cls].pr.every(a => c.ab[a] >= 16);
/* prime requisite bonus */
R.primeBonus = c => R.CLASSES[c.cls].pr.every(a => c.ab[a] >= 16) ? 1.1 : 1;
/* award XP with prime bonus and the two-level cap */
R.awardXp = function (c, base) {
  if (c.dead) return 0;
  let amt = Math.floor(base * R.primeBonus(c));
  c.xp += amt;
  /* cap: cannot skip two levels without training */
  const t = R.xpTable(c);
  const lv = R.levelForXp(c.cls, c.xp);
  const capAt = Math.min(20, c.lvl + 1); /* ready at most one level above */
  if (lv > capAt) {
    const capXp = t[capAt + 1] != null ? t[capAt + 1] - 1 : c.xp;
    /* "one below the threshold two levels ahead" */
    const twoAhead = Math.min(20, c.lvl + 2);
    const cap2 = t[twoAhead] != null ? t[twoAhead] - 1 : c.xp;
    const cap = Math.min(capXp, cap2);
    if (c.xp > cap) c.xp = cap;
  }
  return amt;
};
R.levelForXp = function (cls, xp) {
  const t = R.CLASSES[cls].xp;
  let lv = 1;
  for (let l = 2; l <= 20; l++) if (xp >= t[l]) lv = l; else break;
  return lv;
};
R.trainCost = c => 100 * c.lvl;
R.canTrain = c => c.lvl < 20 && R.nextXp(c) != null && c.xp >= R.nextXp(c);
/* perform a level-up (training hall). Returns HP gained. */
R.trainUp = function (c, rng) {
  if (!R.canTrain(c)) return 0;
  rng = rng || R.rand;
  const h = R.hdRoll(c, rng);
  c.lvl += 1;
  c.maxhp += h;
  c.hp += h;
  if (c.cls === 'M') c._needSpell = (c._needSpell || 0) + 1;
  c.prep = R.defaultPrep(c);
  R.remember(c);
  return h;
};
R.hdRoll = function (c, rng) {
  const cls = c.cls;
  if (cls === 'F' || cls === 'P' || cls === 'R' || cls === 'C') {
    if (c.lvl < 10) return Math.max(1, R.d(CLASSES_hD(cls) + 'd8', rng) + Math.max(0, R.abilityMod(c.ab.CON)));
    return cls === 'C' ? 2 : 3;
  }
  if (c.lvl < 10) return Math.max(1, R.d(CLASSES_hD(cls) + 'd6', rng) + Math.max(0, R.abilityMod(c.ab.CON)));
  return 1;
};
function CLASSES_hD(cls) { return R.CLASSES[cls].hd; }

/* level drain */
R.levelDrain = function (c, n, rng) {
  for (let i = 0; i < n; i++) {
    if (c.lvl <= 1) { c.dead = true; c.hp = 0; c.lost = false; return; }
    c.lvl -= 1;
    c.maxhp -= 2;
    c.hp = Math.min(c.hp, c.maxhp);
    if (c.hp < 1) { c.hp = 1; }
    /* invalidate invalid preparations */
    const slots = R.slotsFor(c);
    if (slots) for (const l in c.prep) c.prep[l] = (c.prep[l] || []).slice(0, slots[+l - 1] || 0);
    R.remember(c);
    if (c.cls === 'M') {
      /* lose highest known spell */
      if (c.book.length) c.book.sort((a, b) => D.SPELLS[b].l - D.SPELLS[a].l).pop();
    }
  }
  if (c.hp <= 0) { c.hp = Math.max(0, c.hp); }
};

/* ---------------- gold ---------------- */
R.goldStr = g => g + ' gp';
R.split = function (total, n) {
  const base = Math.floor(total / n);
  let rem = total - base * n;
  const out = [];
  for (let i = 0; i < n; i++) { out.push(base + (rem-- > 0 ? 1 : 0)); }
  return out;
};

/* ---------------- misc rules ---------------- */
R.isNight = t => (t % 1440) >= 24 * 60 || (t % 1440) < 5.5 * 60; /* 20:00-05:29 */
R.timeStr = t => {
  const m = ((t % 1440) + 1440) % 1440;
  const day = Math.floor(t / 1440) + 1;
  const h = Math.floor(m / 60), mi = Math.floor(m % 60);
  return 'Day ' + day + ', ' + String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0');
};
R.dirName = ['N', 'E', 'S', 'W'];
R.dirVec = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];

R.weaponSpeed = function (witem) { return witem && witem.speed != null ? witem.speed : 5; };
R.sizeMod = function (mon) {
  if (!mon.size) return 0;
  return { S: -2, M: 0, L: 2, H: 4, G: 6 }[mon.size] || 0;
};
})();
