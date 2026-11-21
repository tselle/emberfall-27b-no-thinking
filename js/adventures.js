/* Emberfall — adventures.js
 * The repeatable content pipeline. Builds high-level kits, band-specific
 * shop lists and all fifty generated adventures once at load, in stable
 * tier/index order. IDs adv<t>_<i>, codes T<t>-<ii>. Seed per adventure:
 * 7919*t + 104729*i + 31*themeKey.length; separate streams for wilderness
 * (+15485863) and dungeon secrets/traps (+32452843). Emits ordinary
 * registry entries (D.MAPS, D.QUESTS, D.MONSTERS, D.ITEMS, M.MODULES) and
 * assembles A.CAMPAIGNS (saga + five bands of ten). */
'use strict';
(function () {
const A = window.A = window.Adventures = {};
const D = window.D;
const R = window.R;
const T = window.Treasure;

/* ================= tiers, themes, sizes ================= */
A.BANDS = [
  { t: 1, lvl: 1, themes: ['vermin', 'fungus', 'beasts', 'bandits', 'goblinoid', 'swamp', 'lycanthrope', 'undead', 'goblinoid', 'undead'] },
  { t: 2, lvl: 5, themes: ['vermin', 'beasts', 'menagerie', 'wizard', 'lycanthrope', 'swamp', 'frozen', 'giants', 'demons', 'dragon'] },
  { t: 3, lvl: 9, themes: ['beasts', 'swamp', 'elemental', 'menagerie', 'underdark', 'devils', 'giants', 'undead', 'dragon', 'demons'] },
  { t: 4, lvl: 13, themes: ['beasts', 'elemental', 'menagerie', 'frozen', 'wizard', 'underdark', 'demons', 'giants', 'devils', 'dragon'] },
  { t: 5, lvl: 17, themes: ['giants', 'underdark', 'dragon', 'wizard', 'demons', 'devils', 'undead', 'giants', 'dragon', 'undead'] }
];
const SIZE_BY_I = i => i <= 4 ? 'small' : i <= 7 ? 'medium' : i <= 9 ? 'large' : 'huge';
const FLOORS = { small: 1, medium: 2, large: 3, huge: 5 };
const REGION = { small: [28, 20], medium: [32, 22], large: [36, 24], huge: [40, 26] };
const LENGTH = { small: 'about an hour', medium: 'two to three hours', large: 'three hours or more', huge: 'four to five hours' };

/* theme -> monster pools (all IDs exist in D.MONSTERS after monsters.js) */
const THEMES = {
  vermin: { mons: ['dust_rat', 'plague_rat', 'burrow_spider', 'web_spinner', 'tunnel_viper', 'mole', 'cave_centipede', 'whisker_widow', 'silken_thing', 'giant_earwig', 'chimerarid', 'root_worm'],
    bosses: ['the_many_legged', 'leg_king', 'whisker_widow'], biome: 'T', room: 'the burrow',
    blurb: 'The granaries have a taste for it, and the rats have a taste for the granary.',
    bossNames: ['Skitter', 'The Many-Footed', 'Chitter', 'Legs', 'The Granary King'] },
  fungus: { mons: ['spore_cap', 'tooth_fungus', 'rot_stem', 'gland_cap', 'crawling_fungus', 'spore_walker', 'mildew_beast', 'bone_fungus', 'weeping_shroom', 'umbrella_cap'],
    bosses: ['the_spore_mother', 'the_great_bloom', 'the_underbloom'], biome: 'o', room: 'the bloom',
    blurb: 'The hill is breathing, and the breathing has a smell, and the smell is growing.',
    bossNames: ['The Spore Mother', 'The Great Bloom', 'The Quiet Tuft', 'The Underbloom', 'Old Cap'] },
  beasts: { mons: ['boar', 'bear', 'cougar', 'lynx', 'giant_boar', 'giant_wolf', 'bison', 'elk', 'badger', 'giant_wolf'],
    bosses: ['giant_bear', 'bison', 'giant_wolf'], biome: 'T', room: 'the den',
    blurb: 'The herds have stopped coming down the valley, and the valley has stopped being quiet.',
    bossNames: ['The Warden', 'Red Tusk', 'The Old Hunt', 'Maw', 'The Thicket'] },
  bandits: { mons: ['road_thief', 'cutpurse', 'highwayman', 'camp_gunner', 'toll_keeper', 'cart_robber', 'crossbow_hench', 'saddlebag_rascal', 'lantern_robber', 'stallion_bandit'],
    bosses: ['the_hangman', 'the_red_hank', 'leader_of_road', 'the_mule_skin', 'the_ferret'], biome: 'T', room: 'the camp',
    blurb: 'The road toll doubled, then the carts stopped, and then the questions started.',
    bossNames: ['The Hangman', 'The Red Hank', 'Mule-Skin', 'The Ferret', 'Toll-Keeper'] },
  goblinoid: { mons: ['goblin', 'goblin_scout', 'hobgoblin', 'kobold_sniper', 'kobold_engineer', 'gnoll', 'gnoll_scout', 'bugbear_thug', 'trollkin', 'ogreling'],
    bosses: ['gnoll_warchief', 'hobgoblin_captain', 'bugbear_brute', 'goblin_captain', 'gnoll_packmother'], biome: 'T', room: 'the warren',
    blurb: 'The pits are full of voices, and the voices are making plans, and the plans have teeth.',
    bossNames: ['The War Chief', 'Sleeper', 'The Pit-Keeper', 'The Red Tooth', 'The Deep Fang'] },
  swamp: { mons: ['fen_lurker', 'bog_mire', 'mire_goblin', 'caiman', 'fen_ghoul', 'drowned_hermit', 'bog_wraith', 'ghast', 'swamp_troll', 'will_o_wisp'],
    bosses: ['swamp_hag', 'the_bog_thing', 'swamp_troll'], biome: '~', room: 'the mire',
    blurb: 'The water went dark, and the dark went hungry, and the hungry started walking.',
    bossNames: ['The Hag of the Mire', 'The Bog Thing', 'Silt', 'The Drowned Bell', 'Mire'] },
  lycanthrope: { mons: ['werewolf', 'werecoyote', 'wererat', 'werewolf_pup', 'moon_curse', 'lycan_shaman', 'werelion', 'lycan_brute'],
    bosses: ['werewolf_alpha', 'the_pack_mother', 'weretiger'], biome: 'T', room: 'the pack',
    blurb: 'The full moon came up, and the village dogs started barking at the wrong things.',
    bossNames: ['The Alpha', 'The Pack Mother', 'Fang', 'The Moon-Cursed', 'Howl'] },
  undead: { mons: ['zombie', 'skeleton', 'wight', 'revenant', 'shade', 'ghoul', 'zombie_shambler', 'skeleton_archer', 'ghast', 'wight_elder'],
    bosses: ['zuloon', 'wraith_queen', 'the_ashen_lord', 'vampire_count', 'lich_minor'], biome: 'o', room: 'the crypt',
    blurb: 'The dead of the old cemetery have started walking in a file, and the file has a head.',
    bossNames: ['The Ashen Lord', 'The Hollow Dead', 'Zuloon', 'The Grave Warden', 'The Last Bell'] },
  menagerie: { mons: ['familiar', 'familiar_wasp', 'familiar_spider', 'elemental_kin', 'glass_golem', 'mud_golem', 'mage_apprentice', 'wizard_kin', 'familiar_viper', 'familiar_owl'],
    bosses: ['the_spellbound', 'archmage', 'wizard_kin', 'mage'], biome: 'T', room: 'the menagerie',
    blurb: 'The tower has a taste for collection, and the collection has a taste for the valley.',
    bossNames: ['The Collector', 'The Spellbound', 'The Keeper', 'The Apprentice', 'The Tower Mind'] },
  wizard: { mons: ['mage_apprentice', 'mage', 'wizard_kin', 'archmage', 'the_spellbound', 'glass_golem', 'brass_golem', 'mud_golem', 'stone_golem', 'elemental_kin'],
    bosses: ['archmage', 'the_spellbound', 'iron_golem', 'stone_golem'], biome: 'T', room: 'the tower',
    blurb: 'The tower has been buying land, and the land has been getting smaller, and the tower has been getting taller.',
    bossNames: ['The Archmage', 'The Spellbound', 'The Tower Mind', 'The Last Student', 'The Iron Mind'] },
  frozen: { mons: ['frost_wisp', 'ice_wisp', 'frost_ghoul', 'ice_wight', 'frost_wraith', 'ice_lurker', 'frost_gargoyle', 'ice_shade', 'frost_revenant', 'skeleton'],
    bosses: ['ice_troll', 'the_frozen_thing', 'frost_hag', 'wraith_lord'], biome: '^', room: 'the ice',
    blurb: 'The cold came down the pass and stayed, and the staying has a shape, and the shape is waiting.',
    bossNames: ['The Frozen Thing', 'Frost', 'The Ice Warden', 'The Cold Heart', 'The Last Snow'] },
  giants: { mons: ['hill_giant', 'hobgiant', 'fire_giant', 'frost_giant', 'cloud_giant', 'giant_skele', 'giant_bear', 'giant_wolf', 'giant_boar', 'giant_spider_elder'],
    bosses: ['hill_giant', 'stone_giant', 'fire_giant', 'frost_giant', 'grull'], biome: '^', room: 'the quarry',
    blurb: 'The boulders started moving on their own, and the moving has a taste for the villages.',
    bossNames: ['The Boulder', 'The Hill-Heart', 'The Great Eye', 'The Rock-Singer', 'The Field'] },
  demons: { mons: ['imp', 'quasit', 'suhu', 'dretch', 'spriggan', 'gazer', 'demon_kin', 'demon_warden', 'demon_hag', 'demon_lord'],
    bosses: ['marilith', 'demon_lord', 'demon_hag', 'demon_warden'], biome: 'o', room: 'the rift',
    blurb: 'The well went hot, and the hot went wrong, and the wrong is coming up the shaft.',
    bossNames: ['The Rift', 'The Many-Faced', 'The Ash Gate', 'The Hungry One', 'The Red Door'] },
  devils: { mons: ['devilskin', 'beir', 'nerubli', 'yochl', 'ornetheus', 'devil_kin', 'devil_warden', 'devil_hag', 'hezrou', 'erratic'],
    bosses: ['dis', 'devil_lord', 'glabrezou', 'devil_hag'], biome: 'o', room: 'the bargain',
    blurb: 'A contract came to the village, and the contract was already signed, and the signature was the village.',
    bossNames: ['The Ledger', 'The Devil of the Debt', 'The Smooth One', 'The Nine', 'The Clause'] },
  dragon: { mons: ['wyrm', 'wyvern', 'drake', 'wyrm_elder', 'white_dragon', 'black_dragon', 'giant_eagle', 'giant_turtle', 'giant_lizard', 'giant_viper'],
    bosses: ['red_dragon', 'the_dragon_thing', 'gold_dragon', 'white_dragon', 'black_dragon'], biome: '^', room: 'the lair',
    blurb: 'The ridge is smoking, and the smoking has a hoard, and the hoard is waking up.',
    bossNames: ['The Wyrmspeak', 'The Ridge-Heart', 'The Hoard', 'The Old Flame', 'The Sky-Eater'] },
  elemental: { mons: ['air_elemental', 'earth_elemental', 'fire_elemental', 'water_elemental', 'air_kin', 'earth_kin', 'fire_kin', 'water_kin', 'glass_golem', 'stone_golem'],
    bosses: ['the_ember_thing', 'the_stone_thing', 'fire_elemental', 'earth_elemental'], biome: '^', room: 'the source',
    blurb: 'The spring went out, and the going out was not a dry season, and the valley is running to the wrong places.',
    bossNames: ['The Ember Thing', 'The Stone Thing', 'The Source', 'The Deep Water', 'The Storm Heart'] },
  underdark: { mons: ['goblin_deep', 'deep_spider', 'myconid', 'shrieker', 'vermind', 'drow', 'deep_golem', 'derzu', 'skeleton', 'zombie'],
    bosses: ['mind_flayer_elder', 'drow_lord', 'the_deep_thing', 'mind_flayer', 'the_deep_warden'], biome: '#', room: 'the deep',
    blurb: 'The mine went deeper than the mine, and the deep has a taste for the surface, and the taste is coming up.',
    bossNames: ['The Deep Thing', 'The Mind at the Bottom', 'The Drow Queen', 'The Hollow Eye', 'The Deep'] }
};

/* ================= name pools ================= */
const NP = {
  place1: ['Alder', 'Bryn', 'Carrow', 'Dun', 'Elsen', 'Fell', 'Garnet', 'Hollow', 'Ivory', 'Keld', 'Lark', 'Marn', 'Neth', 'Oaken', 'Pyre', 'Quill', 'Raven', 'Sorrel', 'Thorn', 'Umber', 'Vale', 'Wren', 'Yarrow', 'Zell'],
  place2: ['wick', 'ford', 'holt', 'moor', 'dale', 'brook', 'fell', 'gate', 'hollow', 'cross', 'ridge', 'stead', 'water', 'wood', 'bury', 'field', 'stone', 'vale', 'watch', 'rest'],
  first: ['Aldous', 'Bran', 'Cael', 'Dren', 'Elin', 'Fen', 'Garrick', 'Hale', 'Ivo', 'Jorun', 'Kest', 'Lira', 'Maren', 'Ned', 'Osha', 'Pell', 'Quenna', 'Rurik', 'Sela', 'Torben', 'Uma', 'Vessa', 'Wulfric', 'Yrsa'],
  last: ['Ashdown', 'Briar', 'Cole', 'Dunmore', 'Ember', 'Fallow', 'Grieve', 'Harrow', 'Ironsides', 'Jarl', 'Kettle', 'Larkspur', 'Marrow', 'Neth', 'Oakhart', 'Pyre', 'Quill', 'Rook', 'Sallow', 'Thorne', 'Umber', 'Vane', 'Wick', 'Yarrow'],
  trainer: ['Sergeant', 'Master', 'Old', 'Captain', 'Grum', 'Pike', 'Stone', 'Ward'],
  giverT: ['Elder', 'Reeve', 'Thane', 'Warden', 'Keeper', 'Steward', 'Commander', 'Abbot'],
  dungeon: ['Vaults', 'Deep', 'Hollow', 'Crypt', 'Warren', 'Pits', 'Halls', 'Sanctum', 'Grotto', 'Works', 'Cellars', 'Barrows', 'Tunnels', 'Vault', 'Cavern'],
  region: ['Valley', 'Waste', 'Mars', 'Marches', 'Fell', 'Downs', 'Reach', 'Strand', 'Wolds', 'Hollow', 'Waste', 'Fields']
};

/* ================= helpers ================= */
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function ri(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }
function round10(n) { return Math.round(n / 10) * 10; }
function round5(n) { return Math.round(n / 5) * 5; }
function maxHp(dice) {
  const m = String(dice).match(/^(\d+)d(\d+)(?:[+-](\d+))?$/);
  if (!m) return Math.max(1, parseInt(dice, 10) || 1);
  return +m[1] * +m[2] + (m[3] ? +m[3] : 0);
}
function battleBudget(L) { return L <= 8 ? 2.4 * L : 19.2 + 1.7 * (L - 8); }

/* name a monster id -> display name */
function monName(id) { const m = D.MONSTERS[id]; return m ? m.name : id; }

/* named leader clone: unique id, maximized HP, min morale 16, leader flag,
 * doubled XP, custom lore. Parent stat block untouched. */
function namedClone(id, baseId, name, lore) {
  const b = D.MONSTERS[baseId];
  const m = Object.assign({}, b);
  m.id = id; m.name = name; m.hp = String(maxHp(b.hp)); m.ml = Math.max(16, b.ml || 14);
  m.leader = true; m.xp = (b.xp || 50) * 2; m.lore = lore;
  D.MONSTERS[id] = m;
  return m;
}

/* ================= dungeon floor generator (25x19) ================= */
const DW = 25, DH = 19;
function genFloor(adv, fi, frng, srng, isLast) {
  const tryFloor = (att) => {
    const r2 = R.mulberry32((adv.seed + fi * 7919 + att * 104729) >>> 0);
    const rs = [];
    for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 4; sx++) {
      if (r2() > 0.72 && !(sx === 0 && sy === 1)) continue;
      const w = ri(r2, 3, 5), h = ri(r2, 3, 5);
      const x = sx * 6 + 1 + ri(r2, 0, 5 - w), y = sy * 6 + 1 + ri(r2, 0, 5 - h);
      if (x < 1 || y < 1 || x + w > DW - 1 || y + h > DH - 1) continue;
      rs.push({ x: x, y: y, w: w, h: h, cx: x + (w >> 1), cy: y + (h >> 1), slot: [sx, sy], seen: false });
    }
    if (rs.length < 7) return null;
    /* carve room cells */
    const gg = Array.from({ length: DH }, () => new Array(DW).fill('#'));
    for (const r of rs) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) gg[y][x] = '.';
    /* randomized DFS spanning tree over rooms (slot adjacency) */
    const adj = (a, b) => Math.abs(a.slot[0] - b.slot[0]) + Math.abs(a.slot[1] - b.slot[1]) === 1;
    const entry = rs.reduce((best, r) => (r.slot[0] + r.slot[1] < best.slot[0] + best.slot[1] ? r : best), rs[0]);
    const stack = [entry], visited = new Set([rs.indexOf(entry)]), parent = {};
    const idx = new Map(rs.map((r, i) => [r, i]));
    while (stack.length) {
      const cur = stack[stack.length - 1];
      const nbrs = rs.map((r, i) => [r, i]).filter(([r, i]) => adj(cur, r) && !visited.has(i));
      if (!nbrs.length) { stack.pop(); continue; }
      const [nr, ni] = nbrs[Math.floor(r2() * nbrs.length)];
      visited.add(ni); parent[ni] = idx.get(cur);
      carveCor(gg, cur, nr, r2);
      stack.push(nr);
    }
    /* occasional loops */
    const loops = ri(r2, 1, 2);
    for (let l = 0; l < loops; l++) {
      const a = rs[Math.floor(r2() * rs.length)], b = rs[Math.floor(r2() * rs.length)];
      if (a !== b && adj(a, b) && Math.random !== undefined) if (r2() < 0.6) carveCor(gg, a, b, r2);
    }
    /* flood from entry; prune unreachable cells */
    const reach = flood(gg, entry.cx, entry.cy);
    let roomsOk = 0;
    for (const r of rs) {
      let any = false;
      for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (reach[y][x]) any = true;
      if (any) roomsOk++;
    }
    if (roomsOk < 7) return null;
    for (let y = 0; y < DH; y++) for (let x = 0; x < DW; x++) if (!reach[y][x]) gg[y][x] = '#';
    /* doors at room mouths */
    for (const r of rs) for (let y = r.y - 1; y <= r.y + r.h; y++) for (let x = r.x - 1; x <= r.x + r.w; x++) {
      if (x < 0 || y < 0 || x >= DW || y >= DH) continue;
      if (gg[y][x] !== '.') continue;
      let inRoom = false, onEdge = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const rx = x + dx, ry = y + dy;
        if (rx >= r.x && rx < r.x + r.w && ry >= r.y && ry < r.y + r.h) inRoom = true;
        if (rx === r.x - 1 || rx === r.x + r.w || ry === r.y - 1 || ry === r.y + r.h) onEdge = true;
      }
      if (inRoom && onEdge) gg[y][x] = 'D';
    }
    return { grid: gg, rooms: rs, entry: entry, reach: reach };
  };
  let f = null;
  for (let att = 0; att < 6 && !f; att++) f = tryFloor(att);
  if (!f) f = tryFloor(0);
  const grid = f.grid, rooms = f.rooms;
  /* sort rooms by distance from entry */
  rooms.sort((a, b) => Math.abs(a.cx - f.entry.cx) + Math.abs(a.cy - f.entry.cy) - (Math.abs(b.cx - f.entry.cx) + Math.abs(b.cy - f.entry.cy)));
  /* stairs: entry '<', far '>' (unless last floor) */
  const far = rooms[rooms.length - 1];
  const ev = {};
  grid[f.entry.cy][f.entry.cx] = '<';
  if (!isLast) grid[far.cy][far.cx] = '>';
  return { grid: grid, rooms: rooms, ev: ev, entry: f.entry, far: far, srng: srng, frng: frng };
}
function carveCor(gg, a, b, r2) {
  const x0 = a.cx, y0 = a.cy, x1 = b.cx, y1 = b.cy;
  if (r2() < 0.5) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) gg[y0][x] = '.';
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) gg[y][x1] = '.';
  } else {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) gg[y][x0] = '.';
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) gg[y1][x] = '.';
  }
}
function flood(gg, sx, sy) {
  const seen = Array.from({ length: DH }, () => new Array(DW).fill(false));
  if (gg[sy][sx] === '#') return seen;
  const q = [[sx, sy]]; seen[sy][sx] = true;
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= DW || ny >= DH) continue;
      if (seen[ny][nx] || gg[ny][nx] === '#') continue;
      seen[ny][nx] = true; q.push([nx, ny]);
    }
  }
  return seen;
}

/* ================= home village (templated on authored maps) =================
 * Small first-band villages template on Thornwick, other bases on Coldharrow. */
function genHome(adv, floor1Entry) {
  const small = adv.tier === 1 && adv.size === 'small';
  const src = small ? D.MAPS.thornwick : D.MAPS.cold_town;
  const rows = src.grid.map(r => r.split(''));
  const w = rows[0].length, h = rows.length;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x];
    if (ch >= 'a' && ch <= 'z' && ch !== 'm') rows[y][x] = (ch === 'q') ? ',' : '.';
  }
  const id = 'home_' + adv.id;
  const gateKey = small ? '9,14' : '11,16';
  const stairKey = small ? '5,3' : '19,3';
  const svc = small ? { '1': 'inn', '2': 'shop', '3': 'temple', '4': 'hall', '5': 'training' }
    : { '1': 'inn', '2': 'shop', '3': 'temple', '4': 'hall', '5': 'tavern', '6': 'training' };
  const names = window.M.SERVICES[adv.id] || {};
  const locs = {};
  for (const k in svc) locs[k] = { name: names[svc[k]] || svc[k], kind: svc[k] };
  D.map(id, {
    name: adv.names.place, safe: true, outdoor: true,
    start: { x: small ? 9 : 11, y: 13, dir: 0 },
    grid: rows.map(r => r.join('')),
    locs: locs,
    ev: small ? {} : { m: { text: 'The old stair house. The lift is broken; the stair goes down into the ' + adv.names.dungeon + '.' } },
    stairs: { [stairKey]: { to: 'dg_' + adv.id + '_f1', at: { x: floor1Entry.x, y: floor1Entry.y }, dir: 2 } },
    exit: { [gateKey]: { to: 'wild_' + adv.id, at: { x: 2, y: 3 }, dir: 2 } },
    facades: small ? { '1': 'inn', '2': 'shop', '3': 'temple', '4': 'hall', '5': 'training' } : { '1': 'inn', '2': 'shop', '3': 'temple', '4': 'hall', '5': 'tavern', '6': 'training' }
  });
}

/* ================= overland region ================= */
function genRegion(adv) {
  const [W, H] = REGION[adv.size];
  const c = D.Cnv(W, H, ',');
  const rng = R.mulberry32(adv.seed + 15485863);
  const gate = [2, 2];
  c.set(gate[0], gate[1], 'G');
  const biome = (THEMES[adv.theme] || THEMES.vermin).biome;
  /* mountain border */
  for (let x = 0; x < W; x++) { c.set(x, H - 1, '^'); if (rng() < 0.4) c.set(x, H - 2, '^'); }
  for (let y = 0; y < H; y++) { c.set(W - 1, y, '^'); if (rng() < 0.3) c.set(W - 2, y, '^'); }
  /* winding river */
  let rx = ri(rng, 6, W - 8), ry = 1;
  while (ry < H - 3) {
    c.set(rx, ry, '~'); c.set(rx + 1, ry, '~');
    ry += 1 + (rng() < 0.3 ? 1 : 0);
    rx += ri(rng, -2, 2);
    if (rx < 2) rx = 2; if (rx > W - 6) rx = W - 6;
  }
  /* biome patches */
  const patches = 5 + ri(rng, 0, 4);
  for (let p = 0; p < patches; p++) {
    const px = ri(rng, 2, W - 5), py = ri(rng, 2, H - 6), pw = ri(rng, 2, 4), ph = ri(rng, 2, 4);
    for (let y = py; y < py + ph; y++) for (let x = px; x < px + pw; x++) {
      if (c.get(x, y) === ',') c.set(x, y, biome === 'T' ? 'T' : biome);
    }
  }
  scatterWild(c, 'T', 40 + ri(rng, 0, 30), rng);
  /* keep the gate and start cell clear */
  c.set(gate[0], gate[1], 'G');
  if (c.get(gate[0], gate[1] + 1) === '~' || c.get(gate[0], gate[1] + 1) === '^') c.set(gate[0], gate[1] + 1, '.');
  /* sites */
  const sites = [];
  const spot = (id, minDist) => {
    for (let a = 0; a < 60; a++) {
      const x = ri(rng, 3, W - 5), y = ri(rng, 3, H - 5);
      const k = c.get(x, y);
      if (k === ',' || k === 'T') {
        let ok = true;
        for (const s of sites) if (Math.abs(s.pos[0] - x) + Math.abs(s.pos[1] - y) < minDist) { ok = false; break; }
        if (ok) return [x, y];
      }
    }
    return [ri(rng, 3, W - 5), ri(rng, 3, H - 5)];
  };
  const nLairs = adv.size === 'small' ? 2 : adv.size === 'medium' ? 3 : 4;
  const siteDefs = [];
  for (let i = 0; i < nLairs; i++) siteDefs.push({ kind: 'lair', name: adv.names.lairs[i] || pick(rng, NP.place1) + ' ' + pick(rng, NP.place2) });
  siteDefs.push({ kind: 'refuge', name: 'Chapel of the ' + pick(rng, ['Dawn', 'Vigil', 'North Star']) });
  siteDefs.push({ kind: 'healer', name: 'The Healer\'s ' + pick(rng, ['Hut', 'Cottage', 'House']) });
  if (adv.size !== 'small') siteDefs.push({ kind: 'hamlet', name: pick(rng, NP.place1) + ' ' + pick(rng, NP.place2) });
  const letters = 'ABCDEFGH';
  for (let i = 0; i < siteDefs.length; i++) {
    const pos = spot('s', 6);
    sites.push({ id: letters[i], pos: pos, kind: siteDefs[i].kind, name: siteDefs[i].name });
    c.set(pos[0], pos[1], letters[i]);
  }
  /* roads home -> each site (8-way carve, guarantees reachability) */
  for (const s of sites) {
    let x = gate[0], y = gate[1];
    let guard = 0;
    while ((x !== s.pos[0] || y !== s.pos[1]) && guard++ < 400) {
      const dx = s.pos[0] - x, dy = s.pos[1] - y;
      const k = c.get(x, y);
      if (!(k === 'G' || (k >= 'A' && k <= 'Z'))) {
        if (Math.abs(dx) >= Math.abs(dy)) x += Math.sign(dx); else y += Math.sign(dy);
        const nk = c.get(x, y);
        if (nk === '~' || nk === '^') { /* bridge / bypass */
          if (nk === '~') c.set(x, y, '='); else { y += 1; const bk = c.get(x, y); if (bk !== '~' && bk !== '^') c.set(x, y, '.'); }
          continue;
        }
        c.set(x, y, '.');
      } else { x += 0; }
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) break;
    }
    /* widen the road a little around the home */
  }
  /* scheduled wild encounters (wilderness stream) */
  const steps = [12, 26, 44, 66, 92, 122, 156, 196, 242, 294];
  const pool = (THEMES[adv.theme] || THEMES.vermin).mons;
  const encs = [];
  for (let i = 0; i < steps.length; i++) {
    const at = steps[i] + Math.floor(rng() * 10);
    const mid = pool[Math.floor(rng() * pool.length)];
    const n = 1 + Math.floor(rng() * 3);
    const mons = [];
    for (let k = 0; k < n; k++) mons.push([mid, 1]);
    encs.push({ at: at, mons: mons, text: pick(rng, THEMES[adv.theme].blurb.split('; ')) + ' ' + monName(mid) + (n > 1 ? ' and their kin' : '') + ' cross the track.' });
  }
  /* site events */
  const ev = {};
  const trng = R.mulberry32(adv.seed + 15485863 + 7);
  for (const s of sites) {
    if (s.kind === 'lair') {
      ev[s.id] = { enc: { mons: [[pick(trng, pool), '2'], [pick(trng, pool), '1']], text: 'The ' + s.name + '. It is kept, and the keeping is bad.' }, hidden: true };
    } else if (s.kind === 'refuge') {
      ev[s.id] = { text: 'The ' + s.name + '. The light is lit, the door is unlocked, and the keeper has a room with a lock on the inside.', safe: true };
    } else if (s.kind === 'healer') {
      ev[s.id] = { text: 'The ' + s.name + '. Rest here and the wounds close; the ' + adv.names.place + ' pays the keeper in stories, and the stories are true.', service: 'heal' };
    } else if (s.kind === 'hamlet') {
      ev[s.id] = { chest: { text: 'A cache under the ' + s.name + ', where the folk kept what the roads took.', gold: '1d6x5', items: ['rations', 'potion_clw'] } };
    }
  }
  const id = 'wild_' + adv.id;
  D.map(id, {
    name: adv.names.region, outdoor: true, overland: true,
    start: { x: gate[0], y: gate[1] + 1, dir: 2 },
    grid: c.rows(),
    ev: ev,
    wildEnc: encs,
    pool: pool
  });
  D.MAPS[id].exit = {};
  D.MAPS[id].exit[gate[0] + ',' + gate[1]] = { to: 'home_' + adv.id, at: adv.tier === 1 && adv.size === 'small' ? { x: 9, y: 12 } : { x: 11, y: 15 }, dir: 0 };
  /* southern road out (a feature, closed by the mountains) */
  for (let y = H - 4; y < H - 1; y++) { const x = gate[0] + 2; if (c.get(x, y) === ',' || c.get(x, y) === '^') c.set(x, y, '.'); }
}
function scatterWild(c, ch, n, rng) {
  let placed = 0, guard = 0;
  while (placed < n && guard++ < 3000) {
    const x = 1 + Math.floor(rng() * (c.w - 2)), y = 1 + Math.floor(rng() * (c.h - 2));
    if (c.get(x, y) === ',') { c.set(x, y, ch); placed++; }
  }
}

/* ================= one adventure ================= */
function makeAdventure(t, i) {
  const band = A.BANDS[t - 1];
  const theme = band.themes[i - 1];
  const themeKey = theme;
  const size = SIZE_BY_I(i);
  const seed = (7919 * t + 104729 * i + 31 * themeKey.length) >>> 0;
  const rng = R.mulberry32(seed);
  const id = 'adv_' + t + '_' + i;
  const code = 'T' + t + '-' + String(i).padStart(2, '0');
  const L = band.lvl;
  const TH = THEMES[theme];
  const adv = { id: id, code: code, theme: theme, size: size, tier: t, seed: seed, L: L, generated: true };

  /* names */
  const place = pick(rng, NP.place1) + pick(rng, NP.place2);
  const dungeon = 'The ' + pick(rng, NP.place1) + ' ' + pick(rng, NP.dungeon);
  let region = 'The ' + pick(rng, NP.place1) + ' ' + pick(rng, NP.place2);
  if (/\b(\w+) \1\b/i.test(region)) region = 'The ' + pick(rng, NP.place1) + ' ' + pick(rng, NP.place2);
  const roomN = TH.room.replace(/^the /i, '');
  const themePoss = theme.endsWith('s') ? theme + '\'' : theme + '\'s';
  const regionN = region.replace(/^The /, '');
  const dungeonN = dungeon.replace(/^The /, '');
  const giver = pick(rng, NP.giverT) + ' ' + pick(rng, NP.first) + ' ' + pick(rng, NP.last);
  const trainer = pick(rng, NP.trainer) + ' ' + pick(rng, NP.first) + ' ' + pick(rng, NP.last);
  const lairs = [];
  for (let k = 0; k < 4; k++) lairs.push(pick(rng, NP.place1) + ' ' + (k === 0 ? pick(rng, NP.dungeon) : pick(rng, NP.place2)));
  adv.names = { place: place, giver: giver, trainer: trainer, dungeon: dungeon, region: region, lairs: lairs };

  /* named leaders: one leader + one lieutenant = 100 total across 50 */
  const bossBase = pick(rng, TH.bosses);
  const bossName = pick(rng, TH.bossNames) + ' ' + pick(rng, NP.last);
  const bossPoss = (function () { const b = bossName.replace(/^The /, ''); return b.endsWith('s') ? b + '\'' : b + '\'s'; })();
  const bossId = 'boss_' + id;
  namedClone(bossId, bossBase, bossName, 'The ' + place + ' folk call it ' + bossName + '. It has been keeping the ' + roomN + ' longer than the ' + place + ' have had a name, and the ' + roomN + ' is full of it, and it is full of the ' + regionN + '.');
  const lieutBase = TH.mons[TH.mons.length - 1] || TH.bosses[0];
  const lieutName = pick(rng, NP.first) + ' ' + pick(rng, NP.last);
  const lieutId = 'lieutenant_' + id;
  namedClone(lieutId, lieutBase, lieutName, lieutName + ' keeps the shallower ' + roomN + ' for ' + bossName + ', and the keeping is worse, because it is close to the ' + place + ', and the ' + place + ' can hear it.');
  adv.bossId = bossId; adv.lieutId = lieutId; adv.bossName = bossName; adv.lieutName = lieutName;

  /* dungeon floors */
  const floors = FLOORS[size];
  const mapList = ['home_' + id, 'wild_' + id];
  for (let fi = 0; fi < floors; fi++) mapList.push('dg_' + id + '_f' + (fi + 1));
  adv.maps = mapList;
  const floorObjs = [];
  for (let fi = 0; fi < floors; fi++) {
    const frng = R.mulberry32((seed + fi * 7919) >>> 0);
    const srng = R.mulberry32((seed + 32452843 + fi * 7919) >>> 0);
    floorObjs.push(genFloor(adv, fi, frng, srng, fi === floors - 1));
  }
  /* wire stairs between floors */
  for (let fi = 0; fi < floors; fi++) {
    const fo = floorObjs[fi];
    const frng = fo.frng, srng = fo.srng;
    const mapId = 'dg_' + id + '_f' + (fi + 1);
    const stairs = {};
    if (fi > 0) {
      const prev = floorObjs[fi - 1];
      stairs[fo.entry.cx + ',' + fo.entry.cy] = { to: 'dg_' + id + '_f' + fi, at: { x: prev.far.cx, y: prev.far.cy }, dir: 0 };
    }
    if (fi < floors - 1) {
      const next = floorObjs[fi + 1];
      stairs[fo.far.cx + ',' + fo.far.cy] = { to: 'dg_' + id + '_f' + (fi + 2), at: { x: next.entry.cx, y: next.entry.cy }, dir: 2 };
    }
    /* events: single-letter cells, no two events share a cell */
    const ev = fo.ev;
    const budget = battleBudget(L);
    const perFloor = Math.max(2, budget / floors);
    const rooms = fo.rooms;
    const used = new Set();
    let keyIdx = 0;
    const findCell = (px, py) => {
      const rings = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [2, 1], [-2, -1]];
      for (const [dx, dy] of rings) {
        const x = px + dx, y = py + dy;
        if (x > 0 && y > 0 && x < DW - 1 && y < DH - 1 && fo.grid[y][x] === '.' && !used.has(x + ',' + y)) return [x, y];
      }
      return null;
    };
    const putEvent = (px, py, data, force) => {
      const key = String.fromCharCode(97 + keyIdx++);
      let cell = null;
      if (force && fo.grid[force[1]][force[0]] !== '#') cell = force;
      if (!cell) cell = findCell(px, py);
      if (!cell) return null;
      fo.grid[cell[1]][cell[0]] = key;
      used.add(cell[0] + ',' + cell[1]);
      ev[key] = data;
      return key;
    };
    /* main deed (last floor) and lieutenant (shallow floor) first */
    const reservedRooms = new Set();
    if (fi === floors - 1) {
      const guards = [];
      const gn = ri(frng, 2, 4);
      for (let g = 0; g < gn; g++) guards.push([TH.mons[Math.floor(frng() * TH.mons.length)], 1]);
      putEvent(fo.far.cx, fo.far.cy, {
        enc: { mons: [[bossId, 1]].concat(guards), text: bossName + ' keeps the deep ' + roomN + ', and the deep ' + roomN + ' is full of ' + bossName + '.', gold: T.gold(L, 'hoard', frng), quest: 'deed_' + id }
      }, [fo.far.cx, fo.far.cy]);
      reservedRooms.add(fo.far);
    }
    if (fi === 0) {
      const room = rooms.length > 2 ? rooms[1] : rooms[0];
      putEvent(room.cx, room.cy, {
        enc: { mons: [[lieutId, 1], [TH.mons[0], '2']], text: lieutName + ' stands the shallow ' + roomN + ' for ' + bossName + '.', gold: T.gold(L, 'cache', frng), quest: floors === 1 ? 'deed_' + id : undefined }
      }, [room.cx, room.cy]);
      reservedRooms.add(room);
    }
    /* set encounters: 1-2 types, bounded counts, themed */
    const encTarget = fi === floors - 1 ? 1 : 2 + (fi % 2);
    const freeRooms = rooms.filter(r => !reservedRooms.has(r));
    for (let e = 0; e < encTarget && freeRooms.length; e++) {
      const room = freeRooms.splice(Math.floor(frng() * freeRooms.length), 1)[0];
      const t1 = TH.mons[Math.floor(frng() * TH.mons.length)];
      const n1 = ri(frng, 1, Math.max(1, Math.round(perFloor / 3)));
      const mons = [];
      for (let k = 0; k < n1; k++) mons.push([t1, 1]);
      if (frng() < 0.5) { const t2 = TH.mons[Math.floor(frng() * TH.mons.length)]; mons.push([t2, ri(frng, 1, 2)]); }
      putEvent(room.cx, room.cy, {
        enc: { mons: mons, text: 'A band in the ' + roomN + '. ' + pick(frng, ['They have been waiting.', 'They are faster than they look.', 'They keep the dark the way the dark keeps them.']) }
      }, [room.cx, room.cy]);
    }
    /* chests (pre-generated stash contents: static data, never rerolled) */
    const chestN = ri(frng, 1, 2);
    for (let e = 0; e < chestN; e++) {
      const room = rooms[Math.floor(frng() * rooms.length)];
      const roll = T.roll(R.mulberry32((seed + fi * 131 + e * 977) >>> 0), L, 'chest');
      putEvent(room.cx, room.cy, { chest: { text: 'A chest in the ' + roomN + '.', gold: roll.gold, items: roll.items } });
    }
    /* traps: 2-3 spaced, corridor cells away from stairs (secrets/traps stream) */
    const trapN = ri(srng, 2, 3);
    const traps = {};
    for (let e = 0; e < trapN; e++) {
      for (let a = 0; a < 40; a++) {
        const x = ri(srng, 2, DW - 3), y = ri(srng, 2, DH - 3);
        if (fo.grid[y][x] !== '.') continue;
        let nearStair = false;
        for (const [sx, sy] of [[fo.entry.cx, fo.entry.cy], [fo.far.cx, fo.far.cy]]) if (Math.abs(x - sx) + Math.abs(y - sy) < 4) nearStair = true;
        if (nearStair) continue;
        traps[x + ',' + y] = { type: pick(srng, ['dart', 'spear', 'blade', 'pit']) };
        break;
      }
    }
    /* secret doors: 1-3 (secrets stream); first alcove hides a cache */
    const secretN = ri(srng, 1, 3);
    for (let e = 0; e < secretN; e++) {
      for (let a = 0; a < 60; a++) {
        const x = ri(srng, 1, DW - 4), y = ri(srng, 1, DH - 4);
        if (fo.grid[y][x] !== '#' || fo.grid[y + 1][x] !== '#') continue;
        let open = true;
        for (let dy = 0; dy <= 2; dy++) for (let dx = 0; dx <= 2; dx++) if (fo.grid[y + dy][x + dx] !== '#') open = false;
        if (!open) continue;
        /* the secret door must touch a walkable cell (no island alcoves) */
        const nb = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
        const touches = nb.some(([bx, by]) => bx >= 0 && by >= 0 && bx < DW && by < DH && fo.grid[by][bx] !== '#');
        if (!touches) continue;
        for (let dy = 0; dy <= 2; dy++) for (let dx = 0; dx <= 2; dx++) fo.grid[y + dy][x + dx] = '.';
        fo.grid[y][x] = 'S';
        if (e === 0) {
          const roll = T.roll(R.mulberry32((seed + 555 + e) >>> 0), L, 'cache');
          putEvent(x + 1, y + 1, { chest: { text: 'A hidden alcove, and a chest in it, kept from the dark.', gold: roll.gold, items: roll.items } }, [x + 1, y + 1]);
        }
        break;
      }
    }
    /* themed room text */
    const textRooms = ri(frng, 3, 5);
    for (let e = 0; e < textRooms; e++) {
      const room = rooms[Math.floor(frng() * rooms.length)];
      putEvent(room.cx, room.cy, { text: pick(frng, ['The ' + roomN + ' here is old, and the old is kept.', 'The stone remembers the ' + theme + ', and the ' + theme + ' remembers the stone.', 'There is a floor here that is not a floor, and a wall here that is not a wall.']) });
    }
    /* build the map */
    D.map(mapId, {
      name: dungeon + ' — floor ' + (fi + 1),
      start: { x: fo.entry.cx, y: fo.entry.cy + (fo.entry.cy < DH - 1 ? 1 : 0), dir: fo.entry.cy < DH - 1 ? 2 : 0 },
      grid: fo.grid.map(r => r.join('')),
      ev: ev,
      stairs: stairs,
      traps: traps,
      wander: [{ chance: 0.04, mons: [[TH.mons[Math.floor(rng() * TH.mons.length)], '1d2']], text: 'Something in the ' + roomN + ' moves, and the moving has a taste for the ' + place + '.' }]
    });
  }
  /* service names (deterministic stream, before home construction) */
  const srng2 = R.mulberry32(seed + 999);
  window.M.SERVICES[id] = {
    inn: 'The ' + pick(srng2, ['Drowsy', 'Sleepy', 'Quiet', 'Long']) + ' ' + pick(srng2, ['Lantern', 'Hen', 'Mug', 'Bell']),
    shop: pick(srng2, NP.first) + '\'s ' + pick(srng2, ['Goods', 'Outfitters', 'Store', 'Counter']),
    temple: 'Shrine of the ' + pick(srng2, ['Dawn', 'Vigil', 'North Star']),
    hall: adv.names.giver.split(' ')[0] + '\'s ' + pick(srng2, ['Hall', 'Longhouse', 'Seat']),
    tavern: 'The ' + pick(srng2, ['Gilded', 'Rusted', 'Drowned', 'High']) + ' ' + pick(srng2, ['Tankard', 'Anchor', 'Coil', 'Horn']),
    training: adv.names.trainer.split(' ')[0] + '\'s ' + pick(srng2, ['Yard', 'Drills', 'School'])
  };
  /* home + region (home needs the floor-1 entry cell) */
  genHome(adv, { x: floorObjs[0].entry.cx, y: floorObjs[0].entry.cy });
  genRegion(adv);

  /* unique retrieval items: one per adventure, two on huge (55 total) */
  const qitemN = size === 'huge' ? 2 : 1;
  const qitems = [];
  for (let q = 0; q < qitemN; q++) {
    const qid = 'qitem_' + id + (q ? '_2' : '');
    const kind = pick(rng, ['signet', 'seal', 'toll', 'blade fragment', 'censer', 'token', 'key', 'medallion']);
    const qname = (q ? 'The Lesser ' : 'The ') + kind[0].toUpperCase() + kind.slice(1) + ' of ' + pick(rng, NP.place1) + ' ' + pick(rng, NP.last);
    D.ITEMS[qid] = { id: qid, name: qname, type: 'v', price: 100 * L, tier: t, cat: 'quest', n: qname, t: 'v', desc: 'The ' + adv.names.place + ' folk kept the ' + kind + ', and the keeping is the ' + roomN + '\'s, and the ' + roomN + ' will not give it back without a company.' };
    qitems.push(qid);
  }
  adv.qitems = qitems;

  /* quests */
  const deedGold = round5(60 * L);
  const deedXp = 300 * L;
  D.QUESTS['deed_' + id] = {
    id: 'deed_' + id, name: 'The ' + roomN + ' of ' + place, lead: adv.names.giver,
    goal: 'Kill ' + bossName + ' in ' + dungeon + '.',
    offer: 'The ' + roomN + ' has a head, and the head is ' + bossName + '. Take the head.',
    done: bossName + ' is a story, and the ' + roomN + ' is the ' + place + '\'s again.',
    gold: deedGold, xp: deedXp
  };
  const fetchGold = round5(30 * L);
  const fetchXp = 150 * L;
  const fetch = {
    id: 'fetch_' + id, name: D.ITEMS[qitems[0]].name, lead: adv.names.giver,
    goal: 'Recover ' + D.ITEMS[qitems[0]].name + ' from ' + dungeon + ' and bring it to the hall.',
    offer: 'The ' + kind0(qitems[0]) + ' is in the ' + roomN + ', in a chest or a hand. I want it home.',
    done: D.ITEMS[qitems[0]].name + ' is home, and the ' + place + ' is a little less owed.',
    gold: fetchGold, xp: fetchXp, side: true, needItem: qitems[0]
  };
  D.QUESTS[fetch.id] = fetch;
  let sideIds = ['fetch_' + id];
  if (qitems[1]) {
    D.QUESTS['fetch2_' + id] = {
      id: 'fetch2_' + id, name: D.ITEMS[qitems[1]].name, lead: adv.names.giver,
      goal: 'Recover ' + D.ITEMS[qitems[1]].name + ' from ' + dungeon + ' and bring it to the hall.',
      offer: 'The lesser ' + kind0(qitems[1]) + ' is owed too. Bring it home while you are down there.',
      done: D.ITEMS[qitems[1]].name + ' is home, and the ledger is a little shorter.',
      gold: fetchGold, xp: fetchXp, side: true, needItem: qitems[1]
    };
    sideIds.push('fetch2_' + id);
  }
  adv.quests = ['deed_' + id];
  adv.side = sideIds;

  /* rumors informed by the actual foes */
  adv.rumors = [
    bossName + ' keeps the ' + roomN + ', and the ' + roomN + ' is the ' + regionN + '\'s oldest debt.',
    lieutName + ' stands the shallower ' + roomN + ', and the standing is worse than the keeping.',
    'The ' + place + ' folk do not go to the ' + pick(rng, adv.names.lairs) + ' after dark, and the dark is ' + bossPoss + '.',
    'They say the ' + roomN + ' pays in silver, if the silver is carried by a company that does not ask.',
    'The ' + adv.names.trainer + ' drills the ' + place + ' watch on ' + monName(bossBase) + ' tactics, and the watch is the ' + place + '\'s last hope.'
  ];

  /* module entry */
  const lvlSpan = { small: 1, medium: 2, large: 3, huge: 4 }[size];
  const mo = {
    code: code, id: id, name: place + ' and ' + dungeon, lvl: L, levels: [L, L + lvlSpan],
    diff: Math.min(4, { small: 1, medium: 2, large: 3, huge: 4 }[size] + (t >= 4 ? 1 : 0)),
    size: size, length: LENGTH[size],
    hub: 'home_' + id, maps: mapList,
    gold: round10(40 * Math.pow(L, 1.5)),
    next: null,
    quests: adv.quests, side: sideIds, final: false,
    names: { place: place, giver: adv.names.giver, trainer: adv.names.trainer },
    blurb: TH.blurb,
    intro: place + ' is a ' + (t === 1 && size === 'small' ? 'small village' : 'base on the ' + regionN) + ', and the ' + regionN + ' is the ' + themePoss + '. ' + dungeon + ' goes under the stair house, and the ' + roomN + ' goes under the ' + dungeonN + '.',
    hint: 'The stair house goes down. ' + lieutName + ' is on the shallow floor. ' + bossName + ' is on the deep floor. The ' + kind0(qitems[0]) + ' is in a chest, and the chest is in the ' + roomN + '.',
    victory: bossName + ' is gone, and the ' + roomN + ' is only stone. The ' + place + ' is the ' + place + '\'s again.',
    lose: 'The ' + roomN + ' keeps what it keeps. Load a save, or return to the title, and try the ' + regionN + ' again.',
    generated: true, tier: t,
    rumors: adv.rumors
  };
  window.M.MODULES[id] = mo;
  return mo;
}
function kind0(qid) {
  const it = D.ITEMS[qid];
  return it ? it.name.split(' of ')[0].toLowerCase().replace(/^the /, '') : 'thing';
}

/* ================= build all fifty ================= */
A.order = [];
for (let t = 1; t <= 5; t++) {
  for (let i = 1; i <= 10; i++) {
    const mo = makeAdventure(t, i);
    A.order.push(mo.id);
  }
}
/* link next: next module in band; last of band -> first of next band; final -> null */
for (let k = 0; k < A.order.length; k++) {
  const mo = window.M.MODULES[A.order[k]];
  mo.next = k + 1 < A.order.length ? A.order[k + 1] : null;
  mo.final = k === A.order.length - 1;
}

/* ================= CAMPAIGNS ================= */
A.CAMPAIGNS = [
  { id: 'saga', name: 'The Emberwild Saga', type: 'saga', order: window.M.CAMPAIGN.order },
  { id: 'band1', name: 'Band I — Levels 1–4', type: 'band', tier: 1, order: A.order.slice(0, 10) },
  { id: 'band2', name: 'Band II — Levels 5–8', type: 'band', tier: 2, order: A.order.slice(10, 20) },
  { id: 'band3', name: 'Band III — Levels 9–12', type: 'band', tier: 3, order: A.order.slice(20, 30) },
  { id: 'band4', name: 'Band IV — Levels 13–16', type: 'band', tier: 4, order: A.order.slice(30, 40) },
  { id: 'band5', name: 'Band V — Levels 17–20', type: 'band', tier: 5, order: A.order.slice(40, 50) }
];

/* ================= high-level kits ================= */
A.kits = {
  1: {
    F: { gold: 30, items: ['longsword', 'chain', 'kiteshield', 'dagger', 'rations', 'rope'] },
    P: { gold: 30, items: ['broadsword', 'chain', 'buckler', 'dagger', 'rations'] },
    R: { gold: 30, items: ['longbow', 'spear', 'leather', 'dagger', 'rations', 'rope'] },
    M: { gold: 30, items: ['scimitar', 'dagger', 'leather', 'rope', 'rations'] },
    C: { gold: 30, items: ['mace', 'scale', 'buckler', 'dagger', 'rations'] },
    T: { gold: 30, items: ['shortsword', 'leather', 'dagger', 'lockpick_set', 'rope', 'rations'] }
  },
  5: {
    F: { gold: 200, items: ['sword_plus1', 'chainmail1', 'shield1', 'dagger', 'potion_clw', 'rations', 'rope'] },
    P: { gold: 200, items: ['broadsword_plus1', 'chainmail1', 'buckler1', 'dagger', 'potion_clw', 'rations'] },
    R: { gold: 200, items: ['longbow', 'spear_plus1', 'studded1', 'dagger', 'potion_clw', 'rations', 'rope'] },
    M: { gold: 200, items: ['scimitar_plus1', 'dagger_plus1', 'leather1', 'rope', 'rations', 'potion_clw'] },
    C: { gold: 200, items: ['mace_plus1', 'scale1', 'buckler1', 'dagger', 'potion_clw', 'rations'] },
    T: { gold: 200, items: ['shortsword_plus1', 'studded1', 'dagger_plus1', 'lockpick_set', 'rope', 'rations', 'potion_clw'] }
  },
  9: {
    F: { gold: 600, items: ['longsword_plus2', 'chainmail2', 'kiteshield2', 'dagger_plus1', 'potion_cure_serious', 'rations', 'rope', 'ring_protection1'] },
    P: { gold: 600, items: ['broadsword_plus1', 'splint1', 'buckler1', 'dagger_plus1', 'potion_cure_serious', 'rations', 'ring_protection1'] },
    R: { gold: 600, items: ['longbow', 'partisan_plus1', 'chainmail1', 'dagger_plus1', 'potion_cure_serious', 'rations', 'rope'] },
    M: { gold: 600, items: ['falchion_plus1', 'dagger_plus2', 'leather2', 'rope', 'rations', 'potion_cure_serious', 'wand_light#6'] },
    C: { gold: 600, items: ['warhammer_plus1', 'splint1', 'buckler1', 'dagger_plus1', 'potion_cure_serious', 'rations', 'staff_healing#6'] },
    T: { gold: 600, items: ['scimitar_plus1', 'elven_leather', 'dagger_plus2', 'lockpick_set', 'rope', 'rations', 'potion_cure_serious'] }
  },
  13: {
    F: { gold: 1500, items: ['twoh_sword_plus1', 'splint2', 'towershield1', 'dagger_plus2', 'potion_healing_greater', 'rations', 'rope', 'ring_protection2'] },
    P: { gold: 1500, items: ['broadsword_plus2', 'plate1', 'kiteshield2', 'dagger_plus2', 'potion_healing_greater', 'rations', 'ring_protection2'] },
    R: { gold: 1500, items: ['longbow', 'twoh_axe_plus1', 'scale2', 'dagger_plus2', 'potion_healing_greater', 'rations', 'rope', 'ring_protection1'] },
    M: { gold: 1500, items: ['rune_blade', 'dagger_plus2', 'elven_chain', 'rope', 'rations', 'potion_healing_greater', 'wand_fire#4'] },
    C: { gold: 1500, items: ['sun_hammer', 'plate1', 'dwarven_shield', 'dagger_plus2', 'potion_healing_greater', 'rations', 'staff_healing#4'] },
    T: { gold: 1500, items: ['ember_blade', 'elven_leather', 'dagger_plus2', 'lockpick_set', 'rope', 'rations', 'potion_healing_greater'] }
  },
  17: {
    F: { gold: 4000, items: ['dawn_sword', 'plate2', 'towershield2', 'dagger_plus2', 'potion_regeneration', 'rations', 'rope', 'ring_ac3'] },
    P: { gold: 4000, items: ['dawn_sword', 'dragon_scale', 'kiteshield2', 'dagger_plus2', 'potion_regeneration', 'rations', 'ring_holy'] },
    R: { gold: 4000, items: ['longbow', 'twoh_sword_plus2', 'dragon_scale', 'dagger_plus2', 'potion_regeneration', 'rations', 'rope', 'ring_protection2'] },
    M: { gold: 4000, items: ['frost_blade', 'dagger_plus2', 'elven_chain', 'rope', 'rations', 'potion_regeneration', 'staff_wizardry'] },
    C: { gold: 4000, items: ['sun_hammer', 'dragon_scale', 'dwarven_shield', 'dagger_plus2', 'potion_regeneration', 'rations', 'wand_dawn#3'] },
    T: { gold: 4000, items: ['dawn_sword', 'elven_leather', 'dagger_plus2', 'lockpick_set', 'rope', 'rations', 'potion_regeneration', 'ring_free_act'] }
  }
};
A.kitFor = function (cls, lvl) {
  const key = lvl >= 17 ? 17 : lvl >= 13 ? 13 : lvl >= 9 ? 9 : lvl >= 5 ? 5 : 1;
  return A.kits[key][cls] || A.kits[1][cls];
};

/* ================= band shops ================= */
A.bandShops = function (tier) {
  const armory = [], apothecary = [], general = [];
  for (const id of Object.keys(D.ITEMS)) {
    const it = D.ITEMS[id];
    if (it.cat === 'quest') continue;
    if (it.type === 'w' || it.type === 'a' || it.type === 's') {
      if (it.tier) {
        /* band t sells through tier t-1; recent two tiers for arms */
        const armsOk = it.tier <= Math.max(1, tier - 1);
        const noRare = it.tier >= 4; /* exclude rare weight <4 */
        if (armsOk && !noRare && id !== 'rod_resurrection') armory.push(id);
      } else if (it.price <= 300) armory.push(id); /* mundane + silver stock */
      continue;
    }
    if (it.type === 'p') {
      if (it.tier) { if (it.tier <= tier) apothecary.push(id); }
      else if (['potion_clw', 'potion_cure_serious', 'potion_antivenom', 'potion_antidote'].includes(id)) apothecary.push(id);
      continue;
    }
    if (it.type === 'd') {
      if (id === 'rod_resurrection') continue;
      if (it.tier && it.tier <= tier) apothecary.push(id);
      continue;
    }
    if (it.type === 'v' && (it.gem || it.price <= 200)) general.push(id);
  }
  /* spell scrolls: top levels 1/3/5/7/9 across bands (latest four levels for the band) */
  const top = [1, 3, 5, 7, 9][tier - 1];
  for (let l = Math.max(1, top - 2); l <= top; l++) {
    for (const sid of Object.keys(D.SPELLS)) {
      const s = D.SPELLS[sid];
      if (s.l !== l) continue;
      if (['knock', 'detect_ancestor', 'find_path'].includes(sid) && sid !== 'knock') continue; /* exploration-only except Knock */
      if (s.c === 'M' && ['map_treasure', 'teleport'].includes(sid)) continue;
      if (!['M', 'C'].includes(s.c)) continue;
      apothecary.push('scroll:' + sid);
    }
  }
  for (const id of ['torch', 'rations', 'rope', 'lantern', 'oil', 'water_skin', 'compass', 'lockpick_set', 'grappling_hook', 'pitons']) if (D.ITEMS[id]) general.push(id);
  return { armory: armory, apothecary: apothecary, general: general };
};
A.bandStock = { 1: A.bandShops(1), 2: A.bandShops(2), 3: A.bandShops(3), 4: A.bandShops(4), 5: A.bandShops(5) };

A.count = () => A.order.length;
})();
