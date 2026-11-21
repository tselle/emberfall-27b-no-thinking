/* Emberfall — wilds.js
 * The 48x32 wilderness regions for thorn, cold and raven (hollow's
 * wilderness is authored in data.js as 'wild'). Wilderness encounter pools
 * and site content derive deterministically from the seed. Region maps are
 * built at load; connectivity is guaranteed by carving sight-lines from the
 * gate to every site. */
'use strict';
(function () {
const W = window.W = {};
const D = window.D;
const R = window.R;
const Cnv = D.Cnv;

/* terrain legend: ',' grass, '.' track, 'T' tree, '#' rock, '~' water, '^' hill, 'o' ruins, uppercase = site */

/* carve an L-shaped track from (x0,y0) to (x1,y1), overwriting terrain (not sites/gate) */
function carve(c, x0, y0, x1, y1) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
    const k = c.get(x, y0);
    if (!/[A-ZG]/.test(k)) c.set(x, y0, '.');
  }
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
    const k = c.get(x1, y);
    if (!/[A-ZG]/.test(k)) c.set(x1, y, '.');
  }
}

/* scatter terrain with a seeded rng, avoiding sites, the gate and carved tracks */
function scatter(c, ch, n, rng, avoid) {
  let placed = 0, guard = 0;
  while (placed < n && guard++ < 4000) {
    const x = 1 + Math.floor(rng() * (c.w - 2));
    const y = 1 + Math.floor(rng() * (c.h - 2));
    const k = c.get(x, y);
    if (k === ',' && !avoid(x, y)) { c.set(x, y, ch); placed++; }
  }
}

function pond(c, cx, cy, w, h) {
  for (let y = cy; y < cy + h; y++) for (let x = cx; x < cx + w; x++) c.set(x, y, '~');
}

/* build a wilderness region from a descriptor */
function region(id, def) {
  const c = Cnv(48, 32, ',');
  const rng = R.mulberry32(R.hash('wild_' + id));
  /* gate and sites */
  c.set(def.gate[0], def.gate[1], 'G');
  for (const s of def.sites) c.set(s.pos[0], s.pos[1], s.id);
  /* features first, tracks carved over them (guarantees reachability) */
  const avoid = (x, y) => {
    if (x < 2 || y < 2 || x > 45 || y > 29) return true;
    const k = c.get(x, y);
    return /[A-ZG~^o#T]/.test(k);
  };
  for (const p of def.ponds || []) pond(c, p[0], p[1], p[2], p[3]);
  scatter(c, 'T', def.trees || 90, rng, avoid);
  scatter(c, '^', def.hills || 0, rng, avoid);
  scatter(c, 'o', def.ruins || 6, rng, avoid);
  scatter(c, '#', def.rocks || 4, rng, avoid);
  for (const s of def.sites) carve(c, def.gate[0], def.gate[1], s.pos[0], s.pos[1]);
  /* open ground around sites */
  for (const s of def.sites) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const x = s.pos[0] + dx, y = s.pos[1] + dy;
    if (c.get(x, y) === ',') c.set(x, y, '.');
  }
  /* scheduled wild encounters: deterministic from seed */
  const steps = [14, 30, 52, 78, 108, 142, 180, 224, 274, 330];
  const encs = [];
  for (let i = 0; i < steps.length; i++) {
    const at = steps[i] + Math.floor(rng() * 12);
    const pick = def.pool[Math.floor(rng() * def.pool.length)];
    const n = 1 + Math.floor(rng() * Math.min(4, pick.max));
    const mons = [];
    for (let k = 0; k < n; k++) mons.push([pick.id, 1]);
    encs.push({ at: at, mons: mons, text: pick.text });
  }
  /* site content */
  const ev = {};
  for (const s of def.sites) ev[s.id] = s.ev;
  D.map(id, {
    name: def.name, outdoor: true, overland: true, noCombatEnd: false,
    start: { x: def.gate[0], y: def.gate[1] + 1, dir: 2 },
    grid: c.rows(),
    ev: ev,
    wildEnc: encs,
    pool: def.pool.map(p => p.id),
    exit: { def: null }
  });
  /* wire the gate exit */
  D.MAPS[id].exit = {};
  D.MAPS[id].exit[def.gate[0] + ',' + def.gate[1]] = { to: def.toHub, at: def.hubAt, dir: def.hubDir };
  /* site stairs (into authored maps) */
  if (def.stairs) {
    D.MAPS[id].stairs = D.MAPS[id].stairs || {};
    for (const s of def.sites) {
      if (s.stair) D.MAPS[id].stairs[s.pos[0] + ',' + s.pos[1]] = s.stair;
    }
  }
  return D.MAPS[id];
}

/* ================= thorn_wild ================= */
region('thorn_wild', {
  name: 'The Thornwild',
  gate: [6, 2], toHub: 'thornwick', hubAt: { x: 9, y: 13 }, hubDir: 2,
  pool: [
    { id: 'dust_rat', max: 4, text: 'A swarm of dust rats rises out of the stubble. They are fast, and they are not alone.' },
    { id: 'giant_rat_lord', max: 2, text: 'Rats come out of the granary ruins, and they have a leader, and the leader has a plan.' },
    { id: 'burrow_spider', max: 3, text: 'A burrow spider drops out of the grass. It has been waiting, and it is hungry.' },
    { id: 'boar', max: 1, text: 'A boar charges out of the copse. It has been charging all morning, and it is not slowing down.' },
    { id: 'vulture', max: 3, text: 'Vultures wheel over the track. They are watching, and they are waiting, and they are patient.' },
    { id: 'tunnel_viper', max: 2, text: 'A tunnel viper strikes from the track. It has been in the track all day, and it is ready.' },
    { id: 'highwayman', max: 2, text: 'Road-thieves step out from the hedge. They want your coin, and they are willing to take it.' },
    { id: 'cutpurse', max: 3, text: 'Cutpurses circle the track. They want your purse, and they are faster than they look.' },
    { id: 'will_o_wisp', max: 2, text: 'Wisps drift off the marsh. They lead travelers into the water, and they are good at it.' }
  ],
  ponds: [[30, 4, 4, 3], [12, 24, 3, 3]],
  trees: 100, hills: 0, ruins: 8, rocks: 4,
  sites: [
    { id: 'A', pos: [10, 10], ev: { enc: { mons: [['goblin', '3']], text: 'A kobold-and-goblin camp at the old quarry. They have been here all season, and they are not going anywhere.' } } },
    { id: 'B', pos: [30, 8], ev: { chest: { text: 'A chest in the old watch-house, behind the rubble.', gold: '1d6x5', items: ['potion_clw', 'rations'] } } },
    { id: 'C', pos: [40, 20], ev: { enc: { mons: [['bog_wraith', '2']], text: 'The marsh goes cold. Bog wraiths rise out of the water, and the water is full of them.' } } },
    { id: 'D', pos: [20, 24], ev: { text: 'The old shrine to the Dawn, its face turned to the village. The grass grows over it, but the light still hits the stone at dawn.' } },
    { id: 'E', pos: [42, 12], ev: { enc: { mons: [['highwayman', '2']], text: 'The bandit look-out, on the hill. They have been watching the track, and now they are watching you.' } } },
    { id: 'F', pos: [8, 26], ev: { chest: { text: 'A chest under the mill-pond, where the miller kept his coin.', gold: '1d6x5', items: ['potion_cure_serious'] } } },
    { id: 'G', pos: [34, 26], ev: { text: 'The lost sheep are here, after all. They are fat, and they are unbothered, and they are not lost anymore.' } },
    { id: 'H', pos: [42, 4], ev: { enc: { mons: [['giant_rat_lord', '1'], ['dust_rat', '3']], text: 'The cave is full of rats, and the rats have a king, and the king has been waiting for you.', hidden: true } } }
  ]
});

/* ================= cold_wild ================= */
region('cold_wild', {
  name: 'The Coldharrow Waste',
  gate: [17, 17], toHub: 'cold_town', hubAt: { x: 11, y: 13 }, hubDir: 2,
  pool: [
    { id: 'wight', max: 2, text: 'Wights stand out of the frost. They have been standing a long time, and they are still standing.' },
    { id: 'revenant', max: 3, text: 'Revenants keep the waste. They keep it the way the barrow kept the king: by not letting go.' },
    { id: 'frost_wraith', max: 2, text: 'A frost wraith drifts out of the cold. The cold comes with it, and the cold is not a metaphor.' },
    { id: 'goblin', max: 4, text: 'Goblins run out of the drift. They have been running all winter, and they are not tired.' },
    { id: 'werewolf', max: 1, text: 'A werewolf comes out of the white. It has been out of the white all night, and it is still coming.' },
    { id: 'skeleton', max: 4, text: 'Skeletons march out of the barrow-line. They march in a file, and the file does not break.' },
    { id: 'frost_wisp', max: 2, text: 'Frost wisps coil off the ice. They lead travelers into the deep cold, and they are good at it.' },
    { id: 'bear', max: 1, text: 'A grizzly comes out of the drift. It has been hungry all winter, and you are the first thing to move.' }
  ],
  ponds: [[24, 20, 5, 4]],
  trees: 40, hills: 60, ruins: 8, rocks: 10,
  sites: [
    { id: 'A', pos: [12, 5], stair: { to: 'cold_barrow', at: { x: 12, y: 2 }, dir: 2 }, ev: { text: 'The barrow of the Iron King, on the hill. The barrow is old, the king is older, and the king is still sitting on it.' } },
    { id: 'B', pos: [28, 8], ev: { enc: { mons: [['ice_wight', '2']], text: 'The frost-cave is full of wights, and the wights are full of frost.', hidden: true } } },
    { id: 'C', pos: [38, 14], ev: { enc: { mons: [['goblin', '4']], text: 'The goblin war-camp, under the drift. They have been at war with the mine all winter, and the mine has been losing.' } } },
    { id: 'D', pos: [18, 22], ev: { text: 'The frozen lake, under the ice. The ice is thick, and the lake is deep, and something under the lake is thick and deep and waiting.' } },
    { id: 'E', pos: [40, 26], ev: { chest: { text: 'The old patrol camp, under the snow. The patrol did not come back, but the camp did.', gold: '1d6x5', items: ['rations', 'potion_cure_serious'] } } },
    { id: 'F', pos: [8, 20], ev: { enc: { mons: [['werewolf', '1'], ['lynx', '2']], text: 'The wolf-den, in the white. The wolves are out, and the wolves are hungry, and the wolves are not the only thing out.' } } },
    { id: 'G', pos: [30, 28], ev: { enc: { mons: [['skeleton', '3'], ['zombie', '2']], text: 'The ruin, under the hill. The dead of the ruin are out, and the dead are in a file, and the file does not break.' } } },
    { id: 'H', pos: [44, 24], ev: { chest: { text: 'The cairn-field, under the snow. A cairn-chest, where the cairn-keepers kept their seal.', gold: '2d6x5', items: ['potion_haste'] } } }
  ]
});

/* ================= rav_wild ================= */
region('rav_wild', {
  name: 'Ravenmoor',
  gate: [16, 17], toHub: 'rav_fort', hubAt: { x: 10, y: 9 }, hubDir: 2,
  pool: [
    { id: 'raven_witch', max: 2, text: 'Raven witches circle the track. They trade in riddles, and they keep their answers in their beaks.' },
    { id: 'worg', max: 2, text: 'Worgs run out of the heath. They run in a pack, and the pack does not break.' },
    { id: 'hellhound', max: 1, text: 'A hellhound comes out of the bracken. Its eyes are coals, and the coals are hot, and the coals are looking at you.' },
    { id: 'bog_wraith', max: 2, text: 'Bog wraiths coil off the moor. They coil the way the moor coils: slow, and deep, and without end.' },
    { id: 'wight', max: 2, text: 'Wights keep the moor. They keep it the way the witch keeps the north: by not letting go.' },
    { id: 'ghast', max: 2, text: 'Ghasts rise out of the peat. The peat is full of them, and the peat is full of cold.' },
    { id: 'gnoll', max: 3, text: 'Gnolls hunt the moor. They hunt in a pack, and the pack is full of the moor, and the moor is full of them.' },
    { id: 'frost_wraith', max: 1, text: 'A frost wraith drifts off the moor. The moor is cold, and the wraith is colder, and the cold is coming.' }
  ],
  ponds: [[28, 18, 4, 3]],
  trees: 60, hills: 30, ruins: 10, rocks: 6,
  sites: [
    { id: 'A', pos: [16, 9], stair: { to: 'rav_moor', at: { x: 12, y: 2 }, dir: 2 }, ev: { text: 'The burned village, on the causeway. The village is burned, and the causeway is the road, and the road goes north.' } },
    { id: 'B', pos: [24, 6], stair: { to: 'rav_keep', at: { x: 12, y: 2 }, dir: 2 }, ev: { text: 'The troll keep, on the hill. The keep is the giant\'s, and the giant is the keep, and the keep is the road.' } },
    { id: 'C', pos: [28, 4], ev: { enc: { mons: [['raven_witch', '2'], ['gargoyle', '1']], text: 'The raven cliffs, under the sky. The cliffs are full of witches, and the witches are full of riddles, and the riddles are full of the north.', hidden: true } } },
    { id: 'D', pos: [12, 12], ev: { enc: { mons: [['bog_wraith', '2'], ['ghast', '1']], text: 'The bog, under the moor. The bog is full of wraiths, and the wraiths are full of the bog, and the bog is full of cold.' } } },
    { id: 'E', pos: [34, 10], ev: { chest: { text: 'The old patrol camp, under the bracken. The patrol did not come back, but the camp did.', gold: '1d6x10', items: ['rations', 'potion_cure_serious'] } } },
    { id: 'F', pos: [10, 24], ev: { enc: { mons: [['frost_wraith', '1'], ['wight', '1']], text: 'The ice field, under the moor. The ice is thick, and the field is cold, and the cold is coming.' } } },
    { id: 'G', pos: [40, 20], ev: { enc: { mons: [['worg', '2'], ['gnoll', '2']], text: 'The gnarled wood, under the moor. The wood is full of worgs, and the worgs are full of the wood, and the wood is full of the north.' } } },
    { id: 'H', pos: [36, 28], ev: { text: 'The whispering stones, under the moor. The stones whisper, and the whispers are the witch\'s, and the witch is the moor.' } }
  ]
});

/* ================= hollow wild (sites content for the authored map) ================= */
(function () {
  const m = D.MAPS.wild;
  m.ev = {
    A: { enc: { mons: [['gnoll', '4'], ['gnoll_shaman', '1']], text: 'The gnoll pack on the ridge, at the old quarry. They have been here all season, and they are not going anywhere.', quest: 'gnolls' } },
    B: { chest: { text: 'The old mill, under the grass. A miller\'s chest, where the miller kept his coin.', gold: '1d6x5', items: ['potion_clw', 'rations'] } },
    C: { text: 'The heron nest, over the pond. The herons are gone, but the nest is still there, and the pond is still there, and the light is still on the water.' },
    D: { text: 'The old cairn, under the hill. The cairn is old, and the hill is older, and the light hits the stone at dawn, and the dawn is the Dawn\'s.' },
    E: { enc: { mons: [['crypt_shade', '2'], ['wraith', '1']], text: 'The ruined chapel, under the grass. The dead of the chapel are out, and the dead are in a file, and the file does not break.', hidden: true } },
    F: { enc: { mons: [['highwayman', '2'], ['cutpurse', '2']], text: 'The bandit camp, on the track. They have been here all season, and they are not going anywhere, and they want your coin.' } },
    G: { text: 'The well, under the grass. The well is old, and the water is cold, and the light does not reach the bottom, and the bottom is deep.' },
    H: { text: 'The hollow tree, on the track. The tree is hollow, and the hollow is deep, and something in the hollow is watching, and the watching is patient.' },
    I: { enc: { mons: [['highwayman', '2']], text: 'The old bridge, over the stream. The bridge is old, and the stream is cold, and the bandits are on the bridge, and the bandits are fast.' } },
    J: { chest: { text: 'The old shrine, under the grass. A shrine-chest, where the Dawn-keepers kept their light.', gold: '2d6x5', items: ['potion_cure_critical'] } }
  };
  const rng = R.mulberry32(R.hash('wild_wild'));
  const steps = [16, 34, 56, 82, 112, 146, 186, 230, 280, 340];
  const pool = [
    { id: 'gnoll', max: 3, text: 'Gnolls run out of the grass. They run in a pack, and the pack does not break.' },
    { id: 'skeleton', max: 4, text: 'Skeletons march out of the abbey-shadow. They march in a file, and the file does not break.' },
    { id: 'crypt_shade', max: 2, text: 'Shades drift off the grass. They drift the way the grass drifts: slow, and low, and without end.' },
    { id: 'will_o_wisp', max: 2, text: 'Wisps drift off the hollow. They lead travelers into the deep, and they are good at it.' },
    { id: 'boar', max: 1, text: 'A boar charges out of the copse. It has been charging all morning, and it is not slowing down.' },
    { id: 'troll', max: 1, text: 'A troll steps out of the trees. It has been stepping all day, and it is not tired, and it is not slowing down.' },
    { id: 'highwayman', max: 2, text: 'Road-thieves step out from the hedge. They want your coin, and they are willing to take it.' }
  ];
  const encs = [];
  for (let i = 0; i < steps.length; i++) {
    const at = steps[i] + Math.floor(rng() * 10);
    const pick = pool[Math.floor(rng() * pool.length)];
    const n = 1 + Math.floor(rng() * Math.min(4, pick.max));
    const mons = [];
    for (let k = 0; k < n; k++) mons.push([pick.id, 1]);
    encs.push({ at: at, mons: mons, text: pick.text });
  }
  m.wildEnc = encs;
  m.pool = pool.map(p => p.id);
})();

W.regions = ['thorn_wild', 'wild', 'cold_wild', 'rav_wild'];
})();
