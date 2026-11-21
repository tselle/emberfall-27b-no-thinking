/* Emberfall — monsters.js
 * The wider creature catalogue: 191 bestiary entries beyond the 40 saga
 * monsters. Stat blocks are constructed from HD plus overrides; this is the
 * source for generated encounters and the bestiary. */
'use strict';
(function () {
const BS = window.BS = {};
const D = window.D;

/* HD parsing: "4.3" = 4d8+3, "0.5" = 1d4, "0.9" = 1d8-1, "4" = 4d8 */
function hdToDice(hd) {
  const s = String(hd);
  let m = s.match(/^(\d+)[.](\d)$/);
  if (m) {
    const n = +m[1], mod = +m[2];
    if (n === 0) {
      /* 0.5 = 1d4, 0.9 = 1d8-1 */
      if (mod <= 5) return '1d4';
      return '1d8-1';
    }
    return n + 'd8' + (mod > 0 ? '+' + mod : mod < 0 ? '' + mod : '');
  }
  m = s.match(/^(\d+)$/);
  if (m) {
    const n = +m[1];
    return (n === 0 ? '1d4' : n + 'd8');
  }
  return s;
}
BS.hdToDice = hdToDice;

/* build a full stat block from compact data */
BS.build = function (id, f) {
  const mon = {
    id: id, name: f.name, hd: f.hd, hp: f.hp || hdToDice(f.hd),
    ac: f.ac != null ? f.ac : (12 + Math.floor((+String(f.hd).split('.')[0] || 1) / 3)),
    mv: f.mv != null ? f.mv : 12,
    thac0: f.thac0 != null ? f.thac0 : Math.max(3, 20 - Math.floor(Math.max(1, +String(f.hd).split('.')[0] || 1) / 2)),
    atk: f.atk || ['1d6'],
    size: f.size || (f.hd >= 8 ? 'L' : f.hd >= 4 ? 'M' : 'M'),
    ml: f.ml != null ? f.ml : 12,
    xp: f.xp != null ? f.xp : Math.round(Math.max(1, Math.pow(+String(f.hd).split('.')[0] || 1, 1.6))),
    gold: f.gold != null ? f.gold : '1d6',
    tags: f.tags || [],
    fig: f.fig || 'humanoid',
    lore: f.lore || '',
    leader: f.leader || false
  };
  for (const k of ['venom', 'paralyze', 'drain', 'regen', 'resist', 'immune', 'cast', 'fly', 'throw', 'halfBlunt', 'ranged', 'rank']) {
    if (f[k] !== undefined) mon[k] = f[k];
  }
  return mon;
};

/* compact entry list: [id, fields] */
const E = [
/* ---- vermin (T1-01 "Othys the Many-Legged" theme family) ---- */
['dust_rat', { name: 'Dust Rat', hd: '0.5', ac: 12, atk: ['1d2'], size: 'S', fig: 'rat', tags: ['beast', 'vermin'] }],
['sewer_rat', { name: 'Sewer Rat', hd: '0.7', ac: 11, atk: ['1d3'], size: 'S', fig: 'rat', tags: ['beast', 'vermin'] }],
['plague_rat', { name: 'Plague Rat', hd: '1', ac: 12, atk: ['1d3'], size: 'S', fig: 'rat', tags: ['beast', 'vermin', 'poison'], venom: { dmg: '1d4', delay: [16, 30], save: true } }],
['giant_rat_lord', { name: 'Rat of the Granary', hd: '1.2', ac: 13, atk: ['1d4+1'], size: 'M', fig: 'rat', tags: ['beast', 'vermin', 'leader'] }],
['mill_weevil', { name: 'Mill Weevil Swarm', hd: '1', ac: 11, atk: ['1d2'], size: 'S', fig: 'insect', tags: ['beast', 'vermin'] }],
['cellar_cockroach', { name: 'Cellar Cockroach', hd: '0.5', ac: 13, atk: ['1d2'], size: 'S', fig: 'insect', tags: ['beast', 'vermin'], immune: ['poison'] }],
['mole', { name: 'Giant Mole', hd: '1.5', ac: 12, mv: 9, atk: ['1d4', '1d4'], size: 'M', fig: 'beast', tags: ['beast', 'vermin'] }],
['burrow_spider', { name: 'Burrow Spider', hd: '1', ac: 12, atk: ['1d3'], size: 'S', fig: 'spider', tags: ['beast', 'vermin', 'poison'], venom: { dmg: '1d4', delay: [16, 30], save: true } }],
['web_spinner', { name: 'Web Spinner', hd: '2', ac: 13, atk: ['1d4'], size: 'M', fig: 'spider', tags: ['beast', 'vermin', 'poison'], venom: { dmg: '1d4', delay: [16, 30], save: true } }],
['chimerarid', { name: 'Othys\' Many-Legged Spawn', hd: '2', ac: 14, atk: ['1d4', '1d4'], size: 'M', fig: 'centipede', tags: ['beast', 'vermin', 'leader'] }],
['tunnel_viper', { name: 'Tunnel Viper', hd: '1.5', ac: 12, atk: ['1d4'], size: 'S', fig: 'serpent', tags: ['beast', 'vermin', 'poison'], venom: { dmg: '1d6', delay: [16, 30], save: true } }],
['cave_bat', { name: 'Cave Bat', hd: '0.5', ac: 12, mv: 15, atk: ['1d2'], size: 'S', fig: 'bird', tags: ['beast', 'vermin'], fly: true }],
['blood_leaner', { name: 'Blood Leech Colony', hd: '2', ac: 13, atk: ['1d3'], size: 'S', fig: 'blob', tags: ['beast', 'vermin'] }],
['maggot_pile', { name: 'Maggot Pile', hd: '1', ac: 10, atk: ['1d2'], size: 'S', fig: 'blob', tags: ['beast', 'vermin'] }],
['stone_crab', { name: 'Stone Crab', hd: '1.5', ac: 15, mv: 6, atk: ['1d4'], size: 'M', fig: 'insect', tags: ['beast', 'vermin'] }],
['flying_thing', { name: 'Swarm of Flying Things', hd: '2', ac: 13, mv: 15, atk: ['1d4'], size: 'S', fig: 'insect', tags: ['beast', 'vermin'], fly: true }],
['giant_earwig', { name: 'Giant Earwig', hd: '1', ac: 12, atk: ['1d3'], size: 'S', fig: 'insect', tags: ['beast', 'vermin', 'poison'], venom: { dmg: '1d4', delay: [16, 30], save: true } }],
['whisker_widow', { name: 'Whisker Widow', hd: '2.5', ac: 14, atk: ['1d6'], size: 'M', fig: 'spider', tags: ['beast', 'vermin', 'poison'], venom: { dmg: '1d6', delay: [16, 30], save: true } }],
['leg_king', { name: 'The Leg King', hd: '3', ac: 14, atk: ['1d6', '1d4'], size: 'L', fig: 'centipede', tags: ['beast', 'vermin', 'leader'], ml: 15 }],
['chittering', { name: 'The Chittering', hd: '2', ac: 12, atk: ['1d4', '1d4'], size: 'S', fig: 'insect', tags: ['beast', 'vermin'] }],
['dust_crawler', { name: 'Dust Crawler', hd: '1', ac: 11, mv: 15, atk: ['1d3'], size: 'S', fig: 'centipede', tags: ['beast', 'vermin'] }],
['grain_hopper', { name: 'Grain Hopper', hd: '0.7', ac: 10, mv: 12, atk: ['1d2'], size: 'S', fig: 'insect', tags: ['beast', 'vermin'] }],
['root_worm', { name: 'Root Worm', hd: '1.5', ac: 12, atk: ['1d4'], size: 'M', fig: 'serpent', tags: ['beast', 'vermin'] }],
['silken_thing', { name: 'Silken Thing', hd: '2', ac: 13, atk: ['1d4'], size: 'M', fig: 'spider', tags: ['beast', 'vermin', 'poison'], venom: { dmg: '1d4', delay: [16, 30], save: true } }],
['cave_centipede', { name: 'Cave Centipede', hd: '1.5', ac: 13, mv: 15, atk: ['1d3'], size: 'S', fig: 'centipede', tags: ['beast', 'vermin', 'poison'], venom: { dmg: '1d4', delay: [16, 30], save: true } }],
['the_many_legged', { name: 'Othys the Many-Legged', hd: '4.3', ac: 15, atk: ['1d8', '1d6', '1d4'], size: 'L', fig: 'centipede', tags: ['beast', 'vermin', 'leader'], ml: 16, leader: true, xp: 150, lore: 'It was one rat, once. The granary changed its mind about that. The valley calls it Othys, and it has learned to answer, which is worse.' }],

/* ---- fungus ---- */
['spore_cap', { name: 'Spore Cap', hd: '1', ac: 11, atk: ['1d4'], size: 'M', fig: 'blob', tags: ['beast', 'fungus'] }],
['tooth_fungus', { name: 'Tooth Fungus', hd: '1.5', ac: 12, mv: 6, atk: ['1d6'], size: 'M', fig: 'blob', tags: ['beast', 'fungus'] }],
['glimmer_mush', { name: 'Glimmer Mushroom', hd: '1', ac: 12, atk: ['1d4'], size: 'M', fig: 'blob', tags: ['beast', 'fungus'], immune: ['poison'] }],
['rot_stem', { name: 'Rot Stem', hd: '2', ac: 12, mv: 6, atk: ['1d6', '1d4'], size: 'M', fig: 'blob', tags: ['beast', 'fungus'] }],
['puff_of_spores', { name: 'Puff of Spores', hd: '1.5', ac: 11, atk: [], size: 'M', fig: 'blob', tags: ['beast', 'fungus', 'poison'], ranged: { dmg: '1d4', range: 6, save: true } }],
['brain_tumor', { name: 'Brain Tumor', hd: '2', ac: 12, atk: ['1d6'], size: 'M', fig: 'blob', tags: ['beast', 'fungus'] }],
['the_flesh_of_it', { name: 'The Flesh of It', hd: '2.5', ac: 13, atk: ['1d8'], size: 'L', fig: 'blob', tags: ['beast', 'fungus'], regen: true }],
['candlestick', { name: 'Candlestick Fungus', hd: '1', ac: 11, atk: ['1d3'], size: 'M', fig: 'blob', tags: ['beast', 'fungus'] }],
['umbrella_cap', { name: 'Umbrella Cap', hd: '1.5', ac: 12, atk: ['1d4'], size: 'M', fig: 'blob', tags: ['beast', 'fungus'] }],
['weeping_shroom', { name: 'Weeping Shroom', hd: '1.5', ac: 12, atk: ['1d4'], size: 'M', fig: 'blob', tags: ['beast', 'fungus', 'poison'], venom: { dmg: '1d4', delay: [16, 30], save: true } }],
['the_great_bloom', { name: 'The Great Bloom', hd: '4', ac: 14, atk: ['2d6'], size: 'H', fig: 'blob', tags: ['beast', 'fungus', 'leader'], ml: 15, leader: true }],
['mycelial_tendril', { name: 'Mycelial Tendril', hd: '1', ac: 12, atk: ['1d4'], size: 'S', fig: 'blob', tags: ['beast', 'fungus'] }],
['spore_walker', { name: 'Spore Walker', hd: '2', ac: 12, mv: 15, atk: ['1d4'], size: 'M', fig: 'blob', tags: ['beast', 'fungus'] }],
['gland_cap', { name: 'Gland Cap', hd: '1.5', ac: 11, atk: ['1d4'], size: 'M', fig: 'blob', tags: ['beast', 'fungus'] }],
['the_underbloom', { name: 'The Underbloom', hd: '3', ac: 13, atk: ['1d6', '1d6'], size: 'L', fig: 'blob', tags: ['beast', 'fungus', 'leader'], ml: 14 }],
['rusted_fungus', { name: 'Rusted Fungus', hd: '2', ac: 14, atk: ['1d4'], size: 'M', fig: 'blob', tags: ['beast', 'fungus'], immune: ['poison'] }],
['lantern_mush', { name: 'Lantern Mushroom', hd: '1', ac: 12, atk: ['1d3'], size: 'M', fig: 'blob', tags: ['beast', 'fungus'] }],
['the_spore_mother', { name: 'The Spore Mother', hd: '5', ac: 14, atk: ['2d6'], size: 'L', fig: 'blob', tags: ['beast', 'fungus', 'leader'], ml: 16, leader: true }],
['crawling_fungus', { name: 'Crawling Fungus', hd: '1.5', ac: 12, mv: 15, atk: ['1d4'], size: 'M', fig: 'blob', tags: ['beast', 'fungus'] }],
['the_gilled_thing', { name: 'The Gilled Thing', hd: '2.5', ac: 13, atk: ['1d6'], size: 'L', fig: 'blob', tags: ['beast', 'fungus'] }],
['mildew_beast', { name: 'Mildew Beast', hd: '2', ac: 12, atk: ['1d4'], size: 'M', fig: 'blob', tags: ['beast', 'fungus', 'poison'] }],
['the_dripping_cap', { name: 'The Dripping Cap', hd: '2', ac: 13, atk: ['1d6'], size: 'M', fig: 'blob', tags: ['beast', 'fungus'] }],
['bone_fungus', { name: 'Bone Fungus', hd: '2.5', ac: 14, atk: ['1d6'], size: 'M', fig: 'blob', tags: ['beast', 'fungus'], immune: ['poison'] }],
['the_fungal_tide', { name: 'The Fungal Tide', hd: '3', ac: 13, atk: ['1d8', '1d4'], size: 'L', fig: 'blob', tags: ['beast', 'fungus', 'leader'], ml: 15 }],

/* ---- beasts ---- */
['boar', { name: 'Dire Boar', hd: '3', ac: 13, atk: ['1d6+1'], size: 'L', fig: 'boar', tags: ['beast', 'boar'] }],
['stag', { name: 'Ghost Stag', hd: '4', ac: 13, atk: ['1d8'], size: 'L', fig: 'stag', tags: ['beast', 'und'] }],
['bear', { name: 'Grizzly', hd: '4.4', ac: 14, atk: ['1d8', '1d4'], size: 'L', fig: 'bear', tags: ['beast', 'boar'] }],
['lynx', { name: 'Giant Lynx', hd: '3', ac: 13, mv: 15, atk: ['1d6+1'], size: 'M', fig: 'wolf', tags: ['beast', 'wolf'] }],
['badger', { name: 'Giant Badger', hd: '2.5', ac: 13, atk: ['1d6', '1d4'], size: 'M', fig: 'beast', tags: ['beast', 'boar'] }],
['otter', { name: 'River Otter', hd: '1', ac: 13, atk: ['1d3'], size: 'S', fig: 'beast', tags: ['beast'] }],
['heron', { name: 'Marsh Heron', hd: '0.5', ac: 12, atk: ['1d2'], size: 'S', fig: 'bird', tags: ['beast'], fly: true }],
['pike', { name: 'River Pike', hd: '1.5', ac: 13, atk: ['1d6'], size: 'M', fig: 'serpent', tags: ['beast'] }],
['tortoise', { name: 'Giant Tortoise', hd: '3', ac: 16, mv: 3, atk: ['1d4'], size: 'L', fig: 'beast', tags: ['beast'] }],
['vulture', { name: 'Vulture', hd: '1', ac: 12, mv: 15, atk: ['1d4'], size: 'M', fig: 'bird', tags: ['beast'], fly: true }],
['mole_rat', { name: 'Mole Rat', hd: '1', ac: 11, atk: ['1d3'], size: 'S', fig: 'rat', tags: ['beast', 'vermin'] }],
['owl', { name: 'Hunt Owl', hd: '0.5', ac: 12, mv: 15, atk: ['1d3'], size: 'S', fig: 'bird', tags: ['beast'], fly: true }],
['weasel', { name: 'Giant Weasel', hd: '1.5', ac: 13, mv: 15, atk: ['1d4', '1d2'], size: 'S', fig: 'beast', tags: ['beast'] }],
['bison', { name: 'Bison', hd: '5', ac: 13, atk: ['2d6'], size: 'H', fig: 'boar', tags: ['beast', 'boar'] }],
['elk', { name: 'Elk', hd: '3.5', ac: 12, atk: ['1d8'], size: 'L', fig: 'stag', tags: ['beast'] }],
['addax', { name: 'Addax', hd: '2', ac: 12, mv: 15, atk: ['1d6'], size: 'M', fig: 'stag', tags: ['beast'] }],
['cougar', { name: 'Cougar', hd: '3', ac: 13, mv: 15, atk: ['1d6+1'], size: 'M', fig: 'wolf', tags: ['beast', 'wolf'] }],
['marmot', { name: 'Giant Marmot', hd: '1.5', ac: 12, atk: ['1d4'], size: 'M', fig: 'beast', tags: ['beast'] }],
['ibex', { name: 'Ibex', hd: '2', ac: 12, atk: ['1d6'], size: 'M', fig: 'stag', tags: ['beast'] }],
['bald_eagle', { name: 'Bald Eagle', hd: '1.5', ac: 13, mv: 15, atk: ['1d4+1'], size: 'M', fig: 'bird', tags: ['beast'], fly: true }],
['beaver', { name: 'Giant Beaver', hd: '2', ac: 12, atk: ['1d6'], size: 'M', fig: 'beast', tags: ['beast'] }],
['stoat', { name: 'Stoat', hd: '0.5', ac: 12, mv: 15, atk: ['1d2'], size: 'S', fig: 'beast', tags: ['beast'] }],
['ram', { name: 'Mouflon', hd: '2', ac: 12, atk: ['1d6'], size: 'M', fig: 'stag', tags: ['beast'] }],
['fox', { name: 'Giant Fox', hd: '2', ac: 13, mv: 15, atk: ['1d6'], size: 'M', fig: 'wolf', tags: ['beast', 'wolf'] }],
['hare', { name: 'Snow Hare', hd: '0.5', ac: 12, mv: 15, atk: ['1d2'], size: 'S', fig: 'beast', tags: ['beast'] }],

/* ---- bandits ---- */
['road_thief', { name: 'Road Thief', hd: '1', ac: 13, atk: ['1d6'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev'], ml: 8 }],
['cutpurse', { name: 'Cutpurse', hd: '1.2', ac: 13, atk: ['1d4'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev'], ml: 8 }],
['highwayman', { name: 'Highwayman', hd: '2', ac: 14, atk: ['1d8'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev'], ml: 9 }],
['camp_gunner', { name: 'Camp Gunner', hd: '2', ac: 13, atk: ['1d8'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev'], ml: 9, ranged: { dmg: '1d8', range: 4 } }],
['leader_of_road', { name: 'Leader of the Road', hd: '4', ac: 14, atk: ['1d10'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev', 'leader'], ml: 15, leader: true }],
['toll_keeper', { name: 'Toll Keeper', hd: '2.5', ac: 14, atk: ['1d8'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev'], ml: 10 }],
['stallion_bandit', { name: 'Stallion Bandit', hd: '3', ac: 13, mv: 15, atk: ['1d8'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev'], ml: 9 }],
['whiskey_rig', { name: 'Whiskey Rig Gang', hd: '2', ac: 13, atk: ['1d6'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev'], ml: 8 }],
['tunnel_rat_bandit', { name: 'Tunnel Rat (Bandit)', hd: '1.5', ac: 13, atk: ['1d4'], size: 'S', fig: 'humanoid', tags: ['humanoid', 'ev'], ml: 8 }],
['the_hangman', { name: 'The Hangman', hd: '5', ac: 14, atk: ['2d6'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev', 'leader'], ml: 16, leader: true }],
['saddlebag_rascal', { name: 'Saddlebag Rascal', hd: '1.5', ac: 13, atk: ['1d4'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev'], ml: 7 }],
['the_ferret', { name: 'The Ferret', hd: '3', ac: 14, atk: ['1d8'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev', 'leader'], ml: 12, leader: true }],
['cart_robber', { name: 'Cart Robber', hd: '2', ac: 13, atk: ['1d8'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev'], ml: 9 }],
['the_bowyer', { name: 'The Bowyer', hd: '3', ac: 14, atk: ['1d6'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev'], ml: 10, ranged: { dmg: '1d8', range: 5 } }],
['gate_warden', { name: 'Gate Warden', hd: '3', ac: 15, atk: ['1d8'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev'], ml: 11 }],
['the_red_hank', { name: 'The Red Hank', hd: '4', ac: 14, atk: ['1d10'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev', 'leader'], ml: 14, leader: true }],
['lantern_robber', { name: 'Lantern Robber', hd: '2', ac: 13, atk: ['1d6'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev'], ml: 8 }],
['the_mule_skin', { name: 'The Mule-Skin', hd: '3.5', ac: 14, atk: ['1d8', '1d4'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev', 'leader'], ml: 13, leader: true }],
['crossbow_hench', { name: 'Crossbow Henchman', hd: '2', ac: 13, atk: ['1d6'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev'], ml: 8, ranged: { dmg: '1d6', range: 4 } }],
['the_great_hollow_thief', { name: 'The Great Hollow Thief', hd: '6', ac: 14, atk: ['2d6'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'ev', 'leader'], ml: 16, leader: true }],

/* ---- goblinoids ---- */
['goblin_scout', { name: 'Goblin Scout', hd: '1', ac: 13, mv: 12, atk: ['1d4'], size: 'S', fig: 'humanoid', tags: ['humanoid', 'gob', 'small'] }],
['goblin_shaman', { name: 'Goblin Shaman', hd: '2', ac: 13, atk: ['1d4'], size: 'S', fig: 'humanoid', tags: ['humanoid', 'gob', 'small', 'caster'], cast: { lvl: 3, list: ['scare', 'command'] } }],
['gnoll_scout', { name: 'Gnoll Scout', hd: '2', ac: 13, mv: 12, atk: ['1d6'], size: 'M', fig: 'gnoll', tags: ['humanoid', 'wolf', 'ev'] }],
['gnoll_shaman', { name: 'Gnoll Shaman', hd: '3', ac: 13, atk: ['1d6'], size: 'M', fig: 'gnoll', tags: ['humanoid', 'wolf', 'ev', 'caster'], cast: { lvl: 3, list: ['scare', 'command'] } }],
['bugbear_thug', { name: 'Bugbear Thug', hd: '2.5', ac: 14, atk: ['1d8'], size: 'L', fig: 'bugbear', tags: ['humanoid', 'gi', 'big', 'ev'] }],
['trollkin', { name: 'Trollkin', hd: '3', ac: 14, atk: ['1d6', '1d4'], size: 'M', fig: 'troll', tags: ['humanoid', 'tro', 'regen'], regen: true }],
['ogreling', { name: 'Ogreling', hd: '3.5', ac: 13, atk: ['1d8'], size: 'M', fig: 'ogre', tags: ['humanoid', 'gi', 'ev'] }],
['kobold_sniper', { name: 'Kobold Sniper', hd: '1', ac: 13, atk: ['1d3'], size: 'S', fig: 'humanoid', tags: ['humanoid', 'kob', 'small'], ranged: { dmg: '1d4', range: 4 } }],
['kobold_engineer', { name: 'Kobold Engineer', hd: '1.5', ac: 13, atk: ['1d4'], size: 'S', fig: 'humanoid', tags: ['humanoid', 'kob', 'small'] }],
['hobgoblin', { name: 'Hobgoblin', hd: '2', ac: 15, atk: ['1d6'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'gob'] }],
['hobgoblin_captain', { name: 'Hobgoblin Captain', hd: '3', ac: 15, atk: ['1d8'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'gob', 'leader'], ml: 14, leader: true }],
['goblin_captain', { name: 'Goblin Captain', hd: '2.5', ac: 14, atk: ['1d6'], size: 'S', fig: 'humanoid', tags: ['humanoid', 'gob', 'small', 'leader'], ml: 13, leader: true }],
['gnoll_warchief', { name: 'Gnoll War Chief', hd: '4', ac: 14, atk: ['1d8', '1d4'], size: 'L', fig: 'gnoll', tags: ['humanoid', 'wolf', 'ev', 'leader'], ml: 15, leader: true }],
['bugbear_brute', { name: 'Bugbear Brute', hd: '4', ac: 14, atk: ['2d6'], size: 'L', fig: 'bugbear', tags: ['humanoid', 'gi', 'big', 'ev'] }],
['troll_brute', { name: 'Troll Brute', hd: '5', ac: 14, atk: ['1d10', '1d6'], size: 'L', fig: 'troll', tags: ['humanoid', 'tro', 'regen'], regen: true }],
['ogre_brute', { name: 'Ogre Brute', hd: '6', ac: 14, atk: ['2d6', '1d6'], size: 'L', fig: 'ogre', tags: ['humanoid', 'gi', 'big', 'ev'] }],
['goblin_witchdoctor', { name: 'Goblin Witchdoctor', hd: '2.5', ac: 13, atk: ['1d4'], size: 'S', fig: 'humanoid', tags: ['humanoid', 'gob', 'small', 'caster'], cast: { lvl: 4, list: ['scare', 'blindness'] } }],
['kobold_chieftain', { name: 'Kobold Chieftain', hd: '3', ac: 14, atk: ['1d6'], size: 'S', fig: 'humanoid', tags: ['humanoid', 'kob', 'small', 'leader'], ml: 14, leader: true }],
['hobgoblin_warden', { name: 'Hobgoblin Warden', hd: '3.5', ac: 16, atk: ['1d8'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'gob'] }],
['gnoll_packmother', { name: 'Gnoll Packmother', hd: '4', ac: 14, atk: ['1d8'], size: 'M', fig: 'gnoll', tags: ['humanoid', 'wolf', 'ev', 'leader'], ml: 15, leader: true }],
['bugbear_cave_witch', { name: 'Bugbear Cave Witch', hd: '4', ac: 14, atk: ['1d6'], size: 'L', fig: 'bugbear', tags: ['humanoid', 'gi', 'big', 'caster'], cast: { lvl: 5, list: ['scare', 'blindness', 'fear'] } }],
['troll_witch', { name: 'Troll Witch', hd: '5.5', ac: 14, atk: ['1d10', '1d6'], size: 'L', fig: 'troll', tags: ['humanoid', 'tro', 'regen', 'caster'], regen: true, cast: { lvl: 5, list: ['scare', 'fear'] } }],
['ogre_warleader', { name: 'Ogre Warleader', hd: '7', ac: 15, atk: ['2d6', '1d8'], size: 'L', fig: 'ogre', tags: ['humanoid', 'gi', 'big', 'ev', 'leader'], ml: 16, leader: true }],

/* ---- swamp ---- */
['fen_lurker', { name: 'Fen Lurker', hd: '3', ac: 13, atk: ['1d6'], size: 'M', fig: 'serpent', tags: ['beast', 'poison'], venom: { dmg: '1d6', delay: [16, 30], save: true } }],
['bog_mire', { name: 'Bog Mire', hd: '4', ac: 12, atk: ['1d8'], size: 'L', fig: 'blob', tags: ['beast'] }],
['swamp_troll', { name: 'Swamp Troll', hd: '6.2', ac: 14, atk: ['1d8', '1d6', '1d6'], size: 'L', fig: 'troll', tags: ['humanoid', 'tro', 'regen'], regen: true }],
['mire_goblin', { name: 'Mire Goblin', hd: '1.5', ac: 13, atk: ['1d4'], size: 'S', fig: 'humanoid', tags: ['humanoid', 'gob', 'small'] }],
['toad', { name: 'Giant Toad', hd: '2', ac: 12, atk: ['1d4'], size: 'M', fig: 'beast', tags: ['beast'] }],
['caiman', { name: 'Caiman', hd: '3.5', ac: 14, atk: ['1d8'], size: 'L', fig: 'serpent', tags: ['beast'] }],
['will_o_wisp', { name: 'Will-o\'-Wisp', hd: '1.5', ac: 13, atk: ['1d4'], size: 'S', fig: 'orb', tags: ['undead', 'und'], fly: true }],
['the_bog_thing', { name: 'The Bog Thing', hd: '5', ac: 14, atk: ['2d6'], size: 'L', fig: 'blob', tags: ['beast', 'leader'], ml: 14, leader: true }],
['silt_witch', { name: 'Silt Witch', hd: '4', ac: 14, atk: ['1d4'], size: 'M', fig: 'raven_witch', tags: ['humanoid', 'ev', 'caster'], cast: { lvl: 5, list: ['scare', 'blindness'] } }],
['drowned_hermit', { name: 'Drowned Hermit', hd: '3', ac: 13, atk: ['1d6'], size: 'M', fig: 'shade', tags: ['undead', 'und'] }],
['fen_ghoul', { name: 'Fen Ghoul', hd: '3.5', ac: 14, atk: ['1d6'], size: 'M', fig: 'ghoul', tags: ['undead', 'und', 'paralysis'], paralyze: true }],
['swamp_hag', { name: 'Swamp Hag', hd: '5', ac: 14, atk: ['1d6'], size: 'M', fig: 'raven_witch', tags: ['humanoid', 'ev', 'caster'], cast: { lvl: 6, list: ['scare', 'blindness', 'fear'] } }],

/* ---- lycanthrope ---- */
['werewolf', { name: 'Werewolf', hd: '4.4', ac: 14, atk: ['1d8', '1d6'], size: 'L', fig: 'wolf', tags: ['beast', 'wolf', 'lycan', 'regen'] }],
['wererat', { name: 'Wererat', hd: '2.5', ac: 13, atk: ['1d4', '1d2'], size: 'M', fig: 'rat', tags: ['beast', 'wolf', 'lycan', 'small'] }],
['werecoyote', { name: 'Werecoyote', hd: '3', ac: 13, atk: ['1d6', '1d4'], size: 'M', fig: 'wolf', tags: ['beast', 'wolf', 'lycan'] }],
['weretiger', { name: 'Weretiger', hd: '5', ac: 15, atk: ['1d8', '1d6'], size: 'L', fig: 'beast', tags: ['beast', 'lycan'] }],
['werewolf_alpha', { name: 'Alpha Werewolf', hd: '6', ac: 15, atk: ['2d6', '1d8'], size: 'L', fig: 'wolf', tags: ['beast', 'wolf', 'lycan', 'leader'], ml: 16, leader: true }],
['lycan_shaman', { name: 'Lycan Shaman', hd: '4', ac: 14, atk: ['1d6'], size: 'M', fig: 'raven_witch', tags: ['humanoid', 'lycan', 'caster'], cast: { lvl: 5, list: ['scare', 'fear'] } }],
['werelion', { name: 'Werelion', hd: '6', ac: 15, atk: ['2d6'], size: 'H', fig: 'beast', tags: ['beast', 'lycan'] }],
['werewolf_pup', { name: 'Werewolf Pup', hd: '3', ac: 14, atk: ['1d6', '1d4'], size: 'M', fig: 'wolf', tags: ['beast', 'wolf', 'lycan'] }],
['moon_curse', { name: 'Moon-Cursed', hd: '4', ac: 14, atk: ['1d8'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'lycan'] }],
['the_pack_mother', { name: 'The Pack Mother', hd: '7', ac: 15, atk: ['2d6', '1d8'], size: 'H', fig: 'wolf', tags: ['beast', 'wolf', 'lycan', 'leader'], ml: 17, leader: true }],
['wereboar', { name: 'Wereboar', hd: '5', ac: 14, atk: ['1d10', '1d6'], size: 'L', fig: 'boar', tags: ['beast', 'boar', 'lycan'] }],
['lycan_brute', { name: 'Lycan Brute', hd: '5.5', ac: 15, atk: ['2d6', '1d6'], size: 'L', fig: 'wolf', tags: ['beast', 'lycan'] }],

/* ---- undead ---- */
['zombie_shambler', { name: 'Zombie Shambler', hd: '1', ac: 15, mv: 6, atk: ['1d6'], size: 'M', fig: 'zombie', tags: ['undead', 'und'] }],
['skeleton_archer', { name: 'Skeleton Archer', hd: '1', ac: 14, atk: ['1d4'], size: 'M', fig: 'skeleton', tags: ['undead', 'und'], ranged: { dmg: '1d4', range: 4 } }],
['ghast', { name: 'Ghast', hd: '3.5', ac: 14, atk: ['1d6'], size: 'M', fig: 'ghoul', tags: ['undead', 'und', 'poison'], venom: { dmg: '1d6', delay: [16, 30], save: true } }],
['wight_elder', { name: 'Wight Elder', hd: '5', ac: 14, atk: ['1d8'], size: 'M', fig: 'shade', tags: ['undead', 'und', 'drain'], drain: 1 }],
['revenant_guard', { name: 'Revenant Guard', hd: '4', ac: 15, atk: ['1d8'], size: 'M', fig: 'revenant', tags: ['undead', 'und'] }],
['wraith_lord', { name: 'Wraith Lord', hd: '7', ac: 15, atk: ['1d8', '1d6'], size: 'M', fig: 'wraith', tags: ['undead', 'und', 'drain', 'leader'], drain: 1, ml: 16, leader: true }],
['vampire_spawn', { name: 'Vampire Spawn', hd: '4.4', ac: 14, atk: ['1d6', '1d4'], size: 'M', fig: 'vampire', tags: ['undead', 'und', 'drain'], drain: 1 }],
['vampire', { name: 'Vampire', hd: '5.5', ac: 15, atk: ['1d6', '1d6'], size: 'M', fig: 'vampire', tags: ['undead', 'und', 'drain'], drain: 1, immune: ['poison', 'sleep', 'hold'] }],
['lich_minor', { name: 'Lich Minor', hd: '7.5', ac: 15, atk: ['1d6'], size: 'M', fig: 'lich', tags: ['undead', 'und', 'drain', 'caster'], drain: 1, cast: { lvl: 9, list: ['hold_person_c', 'cure_sw', 'dispel_p'] }, immune: ['poison', 'sleep', 'hold'] }],
['shade', { name: 'Shade', hd: '3', ac: 14, atk: ['1d6'], size: 'M', fig: 'shade', tags: ['undead', 'und'] }],
['skeleton_knight', { name: 'Skeleton Knight', hd: '2', ac: 15, atk: ['1d8'], size: 'M', fig: 'skeleton', tags: ['undead', 'und'] }],
['ghoul_priest', { name: 'Ghoul Priest', hd: '4', ac: 14, atk: ['1d6'], size: 'M', fig: 'ghoul', tags: ['undead', 'und', 'paralysis', 'caster'], paralyze: true, cast: { lvl: 3, list: ['clw'] } }],
['wight_warden', { name: 'Wight Warden', hd: '5.5', ac: 15, atk: ['1d8', '1d4'], size: 'M', fig: 'shade', tags: ['undead', 'und', 'drain'], drain: 1 }],
['revenant_knight', { name: 'Revenant Knight', hd: '5', ac: 16, atk: ['1d10'], size: 'M', fig: 'revenant', tags: ['undead', 'und'] }],
['wraith_queen', { name: 'Wraith Queen', hd: '8', ac: 16, atk: ['1d8', '1d6'], size: 'M', fig: 'wraith', tags: ['undead', 'und', 'drain', 'caster', 'leader'], drain: 1, ml: 17, leader: true, cast: { lvl: 9, list: ['fear', 'hold_person_c', 'dispel_p'] } }],
['vampire_count', { name: 'Vampire Count', hd: '6.5', ac: 15, atk: ['1d6', '1d6'], size: 'M', fig: 'vampire', tags: ['undead', 'und', 'drain', 'leader'], drain: 1, ml: 16, leader: true, immune: ['poison', 'sleep', 'hold'] }],
['lich', { name: 'Lich', hd: '9', ac: 16, atk: ['1d6'], size: 'M', fig: 'lich', tags: ['undead', 'und', 'drain', 'caster', 'leader'], drain: 1, ml: 17, leader: true, cast: { lvl: 11, list: ['fear', 'hold_person_c', 'dispel_p', 'cure_sw'] }, immune: ['poison', 'sleep', 'hold'] }],
['zombie_baron', { name: 'Zombie Baron', hd: '2.5', ac: 16, atk: ['1d8'], size: 'M', fig: 'zombie', tags: ['undead', 'und', 'leader'], ml: 14, leader: true }],
['the_hollow_dead', { name: 'The Hollow Dead', hd: '4', ac: 15, atk: ['1d8'], size: 'M', fig: 'shade', tags: ['undead', 'und', 'leader'], ml: 15, leader: true }],
['crypt_wraith', { name: 'Crypt Wraith', hd: '5.5', ac: 15, atk: ['1d8'], size: 'M', fig: 'wraith', tags: ['undead', 'und', 'drain'], drain: 1 }],
['grave_wight', { name: 'Grave Wight', hd: '4.5', ac: 15, atk: ['1d8'], size: 'M', fig: 'shade', tags: ['undead', 'und', 'drain'], drain: 1 }],
['the_ashen_lord', { name: 'The Ashen Lord', hd: '8', ac: 16, atk: ['1d8', '1d6'], size: 'M', fig: 'lich', tags: ['undead', 'und', 'drain', 'caster', 'leader'], drain: 1, ml: 17, leader: true, cast: { lvl: 9, list: ['fear', 'dispel_p', 'cure_sw'] } }],
['bone_warden', { name: 'Bone Warden', hd: '3.5', ac: 16, atk: ['1d8'], size: 'M', fig: 'skeleton', tags: ['undead', 'und'] }],
['the_dead_reeve', { name: 'The Dead Reeve', hd: '6', ac: 16, atk: ['1d10'], size: 'M', fig: 'revenant', tags: ['undead', 'und', 'leader'], ml: 16, leader: true }],
['zuloon', { name: 'Zuloon', hd: '9.4', ac: 16, atk: ['2d6', '1d8'], size: 'L', fig: 'lich', tags: ['undead', 'und', 'drain', 'caster', 'leader'], drain: 1, ml: 17, leader: true, xp: 600, cast: { lvl: 12, list: ['fear', 'hold_person_c', 'dispel_p', 'cure_sw'] }, immune: ['poison', 'sleep', 'hold'], lore: 'The Crypt of Zuloon is named for its keeper, and Zuloon has been keeping it a long time. The dead of the crypt are his, and the crypt is the dead\'s, and the north is Zuloon\'s, if you ask him, which you will, eventually.' }],

/* ---- menagerie / wizard ---- */
['familiar', { name: 'Familiar', hd: '1', ac: 13, atk: ['1d3'], size: 'S', fig: 'bird', tags: ['beast'], fly: true }],
['elemental_kin', { name: 'Elemental Kin', hd: '3', ac: 13, atk: ['1d6'], size: 'M', fig: 'orb', tags: ['elemental'] }],
['glass_golem', { name: 'Glass Golem', hd: '4', ac: 14, atk: ['1d8'], size: 'M', fig: 'golem', tags: ['construct'], immune: ['poison', 'sleep', 'hold'] }],
['brass_golem', { name: 'Brass Golem', hd: '5', ac: 15, atk: ['1d10'], size: 'M', fig: 'golem', tags: ['construct'], immune: ['poison', 'sleep', 'hold'] }],
['mud_golem', { name: 'Mud Golem', hd: '4.5', ac: 13, atk: ['1d8'], size: 'L', fig: 'golem', tags: ['construct'], immune: ['poison', 'sleep', 'hold'] }],
['stone_golem', { name: 'Stone Golem', hd: '6', ac: 16, atk: ['2d6'], size: 'L', fig: 'golem', tags: ['construct'], immune: ['poison', 'sleep', 'hold'] }],
['iron_golem', { name: 'Iron Golem', hd: '7.5', ac: 17, atk: ['2d6', '1d6'], size: 'L', fig: 'golem', tags: ['construct'], immune: ['poison', 'sleep', 'hold'] }],
['mage_apprentice', { name: 'Mage Apprentice', hd: '2', ac: 13, atk: ['1d4'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'caster'], cast: { lvl: 3, list: ['sleep', 'color_spray'] } }],
['mage', { name: 'Mage', hd: '3.5', ac: 13, atk: ['1d6'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'caster'], cast: { lvl: 6, list: ['fireball', 'magic_missile'] } }],
['archmage', { name: 'Archmage', hd: '6', ac: 14, atk: ['1d6'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'caster', 'leader'], ml: 15, leader: true, cast: { lvl: 9, list: ['fireball', 'chain_lightning', 'hold_person_m'] } }],
['wizard_kin', { name: 'Wizard Kin', hd: '4', ac: 13, atk: ['1d6'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'caster'], cast: { lvl: 5, list: ['magic_missile', 'sleep'] } }],
['the_spellbound', { name: 'The Spellbound', hd: '5', ac: 14, atk: ['1d8'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'caster', 'leader'], ml: 15, leader: true, cast: { lvl: 7, list: ['fireball', 'hold_person_m', 'dispel_m'] } }],
['familiar_cat', { name: 'Familiar Cat', hd: '0.5', ac: 13, atk: ['1d2'], size: 'S', fig: 'beast', tags: ['beast'] }],
['familiar_toad', { name: 'Familiar Toad', hd: '0.5', ac: 12, atk: ['1d2'], size: 'S', fig: 'beast', tags: ['beast'] }],
['familiar_rat', { name: 'Familiar Rat', hd: '0.5', ac: 13, atk: ['1d2'], size: 'S', fig: 'rat', tags: ['beast'] }],
['familiar_owl', { name: 'Familiar Owl', hd: '1', ac: 13, atk: ['1d3'], size: 'S', fig: 'bird', tags: ['beast'], fly: true }],
['familiar_spider', { name: 'Familiar Spider', hd: '1', ac: 13, atk: ['1d3'], size: 'S', fig: 'spider', tags: ['beast', 'poison'], venom: { dmg: '1d4', delay: [16, 30], save: true } }],
['familiar_viper', { name: 'Familiar Viper', hd: '1', ac: 13, atk: ['1d3'], size: 'S', fig: 'serpent', tags: ['beast', 'poison'], venom: { dmg: '1d4', delay: [16, 30], save: true } }],
['familiar_newt', { name: 'Familiar Newt', hd: '0.5', ac: 12, atk: ['1d2'], size: 'S', fig: 'beast', tags: ['beast'] }],
['familiar_gecko', { name: 'Familiar Gecko', hd: '0.5', ac: 13, atk: ['1d2'], size: 'S', fig: 'lizard', tags: ['beast'] }],
['familiar_wasp', { name: 'Familiar Wasp', hd: '1', ac: 14, atk: ['1d2'], size: 'S', fig: 'insect', tags: ['beast', 'poison'], fly: true, venom: { dmg: '1d4', delay: [16, 30], save: true } }],
['familiar_lizard', { name: 'Familiar Lizard', hd: '1', ac: 13, atk: ['1d3'], size: 'S', fig: 'lizard', tags: ['beast'] }],
['familiar_bat', { name: 'Familiar Bat', hd: '0.5', ac: 13, atk: ['1d2'], size: 'S', fig: 'bird', tags: ['beast'], fly: true }],
['familiar_moth', { name: 'Familiar Moth', hd: '0.5', ac: 13, atk: ['1d2'], size: 'S', fig: 'insect', tags: ['beast'], fly: true }],

/* ---- frozen ---- */
['frost_wisp', { name: 'Frost Wisp', hd: '1.5', ac: 14, atk: ['1d4'], size: 'S', fig: 'orb', tags: ['undead', 'und', 'cold'], fly: true, immune: ['cold'] }],
['ice_fort', { name: 'Ice Fort', hd: '4', ac: 15, atk: ['1d8'], size: 'L', fig: 'golem', tags: ['construct', 'cold'], immune: ['cold', 'poison', 'sleep', 'hold'] }],
['frost_troll', { name: 'Frost Troll', hd: '6.2', ac: 14, atk: ['1d8', '1d6', '1d6'], size: 'L', fig: 'troll', tags: ['humanoid', 'tro', 'regen', 'cold'], regen: true, immune: ['cold'] }],
['ice_wight', { name: 'Ice Wight', hd: '4.5', ac: 15, atk: ['1d8'], size: 'M', fig: 'shade', tags: ['undead', 'und', 'cold', 'drain'], drain: 1, immune: ['cold'] }],
['frost_ghoul', { name: 'Frost Ghoul', hd: '3.5', ac: 15, atk: ['1d6'], size: 'M', fig: 'ghoul', tags: ['undead', 'und', 'cold', 'paralysis'], paralyze: true, immune: ['cold'] }],
['ice_golem', { name: 'Ice Golem', hd: '5.5', ac: 16, atk: ['2d6'], size: 'L', fig: 'golem', tags: ['construct', 'cold'], immune: ['cold', 'poison', 'sleep', 'hold'] }],
['frost_wraith', { name: 'Frost Wraith', hd: '6', ac: 15, atk: ['1d8'], size: 'M', fig: 'wraith', tags: ['undead', 'und', 'cold', 'drain'], drain: 1, immune: ['cold'] }],
['the_frozen_thing', { name: 'The Frozen Thing', hd: '7', ac: 16, atk: ['2d6'], size: 'L', fig: 'golem', tags: ['construct', 'cold', 'leader'], ml: 16, leader: true, immune: ['cold', 'poison', 'sleep', 'hold'] }],
['ice_lurker', { name: 'Ice Lurker', hd: '3', ac: 14, atk: ['1d6'], size: 'M', fig: 'serpent', tags: ['beast', 'cold'], immune: ['cold'] }],
['frost_hag', { name: 'Frost Hag', hd: '5', ac: 15, atk: ['1d6'], size: 'M', fig: 'raven_witch', tags: ['humanoid', 'ev', 'caster', 'cold'], cast: { lvl: 6, list: ['scare', 'fear'], immune: ['cold'] } }],
['ice_wisp', { name: 'Ice Wisp', hd: '1', ac: 14, atk: ['1d3'], size: 'S', fig: 'orb', tags: ['undead', 'und', 'cold'], fly: true, immune: ['cold'] }],
['frost_gargoyle', { name: 'Frost Gargoyle', hd: '4', ac: 16, atk: ['1d6'], size: 'M', fig: 'gargoyle', tags: ['undead', 'und', 'cold'], immune: ['cold', 'magic'], fly: true }],
['the_ice_warden', { name: 'The Ice Warden', hd: '6.5', ac: 16, atk: ['2d6'], size: 'L', fig: 'golem', tags: ['construct', 'cold', 'leader'], ml: 16, leader: true, immune: ['cold', 'poison', 'sleep', 'hold'] }],
['frost_revenant', { name: 'Frost Revenant', hd: '5', ac: 16, atk: ['1d10'], size: 'M', fig: 'revenant', tags: ['undead', 'und', 'cold'], immune: ['cold'] }],
['ice_shade', { name: 'Ice Shade', hd: '4', ac: 15, atk: ['1d8'], size: 'M', fig: 'shade', tags: ['undead', 'und', 'cold'], immune: ['cold'] }],

/* ---- giants ---- */
['hobgiant', { name: 'Hobgiant', hd: '3.5', ac: 15, atk: ['1d8'], size: 'L', fig: 'giant', tags: ['humanoid', 'gi', 'big'] }],
['fire_giant', { name: 'Fire Giant', hd: '7.4', ac: 15, atk: ['2d6', '1d6'], size: 'H', fig: 'giant', tags: ['humanoid', 'gi', 'big'], immune: ['fire'] }],
['frost_giant', { name: 'Frost Giant', hd: '7.6', ac: 15, atk: ['2d6', '1d6'], size: 'H', fig: 'giant', tags: ['humanoid', 'gi', 'big'], immune: ['cold'] }],
['cloud_giant', { name: 'Cloud Giant', hd: '9.4', ac: 15, atk: ['2d8', '1d8'], size: 'H', fig: 'giant', tags: ['humanoid', 'gi', 'big'], fly: true }],
['stone_giant', { name: 'Stone Giant', hd: '9.6', ac: 16, atk: ['2d8', '1d8'], size: 'H', fig: 'giant', tags: ['humanoid', 'gi', 'big'] }],
['hill_giant_brute', { name: 'Hill Giant Brute', hd: '8.6', ac: 15, atk: ['2d6', '1d6'], size: 'H', fig: 'giant', tags: ['humanoid', 'gi', 'big'] }],
['giant_skele', { name: 'Giant Skeleton', hd: '5', ac: 15, atk: ['1d10'], size: 'L', fig: 'skeleton', tags: ['undead', 'und', 'gi'] }],
['giant_wolf', { name: 'Giant Wolf', hd: '4.5', ac: 14, atk: ['1d8'], size: 'L', fig: 'wolf', tags: ['beast', 'wolf', 'big'] }],
['giant_boar', { name: 'Giant Boar', hd: '5', ac: 14, atk: ['1d10'], size: 'L', fig: 'boar', tags: ['beast', 'boar', 'big'] }],
['giant_spider_elder', { name: 'Elder Giant Spider', hd: '5.5', ac: 14, atk: ['1d8'], size: 'L', fig: 'spider', tags: ['beast', 'vermin', 'poison', 'big'], venom: { dmg: '1d8', delay: [16, 30], save: true } }],
['giant_centipede_elder', { name: 'Elder Giant Centipede', hd: '4.5', ac: 14, atk: ['1d8'], size: 'L', fig: 'centipede', tags: ['beast', 'vermin', 'poison', 'big'], venom: { dmg: '1d6', delay: [16, 30], save: true } }],
['giant_rat_elder', { name: 'Elder Giant Rat', hd: '2.5', ac: 13, atk: ['1d6'], size: 'M', fig: 'rat', tags: ['beast', 'vermin'] }],
['giant_turtle', { name: 'Giant Turtle', hd: '6', ac: 16, mv: 3, atk: ['1d6'], size: 'H', fig: 'beast', tags: ['beast', 'big'] }],
['giant_eagle', { name: 'Giant Eagle', hd: '4.5', ac: 14, atk: ['1d8'], size: 'L', fig: 'bird', tags: ['beast', 'big'], fly: true }],
['giant_owl', { name: 'Giant Owl', hd: '3', ac: 14, atk: ['1d6'], size: 'M', fig: 'bird', tags: ['beast'], fly: true }],
['giant_bear', { name: 'Giant Bear', hd: '6.4', ac: 14, atk: ['2d6', '1d8'], size: 'L', fig: 'bear', tags: ['beast', 'boar', 'big'] }],
['giant_lynx', { name: 'Giant Lynx', hd: '4', ac: 14, atk: ['1d8', '1d6'], size: 'L', fig: 'wolf', tags: ['beast', 'wolf', 'big'] }],
['giant_viper', { name: 'Giant Viper', hd: '4.5', ac: 14, atk: ['1d8'], size: 'L', fig: 'serpent', tags: ['beast', 'poison', 'big'], venom: { dmg: '1d6', delay: [16, 30], save: true } }],
['giant_lizard', { name: 'Giant Lizard', hd: '4', ac: 14, atk: ['1d8'], size: 'L', fig: 'lizard', tags: ['beast', 'big'] }],
['giant_toad', { name: 'Giant Toad', hd: '4', ac: 13, atk: ['1d8'], size: 'L', fig: 'beast', tags: ['beast', 'big'] }],

/* ---- demons ---- */
['imp', { name: 'Imp', hd: '1.5', ac: 14, atk: ['1d4'], size: 'S', fig: 'imp', tags: ['demon', 'ev'], immune: ['poison'] }],
['suhu', { name: 'Su-Hu', hd: '2.5', ac: 14, atk: ['1d6'], size: 'S', fig: 'imp', tags: ['demon', 'ev'] }],
['quasit', { name: 'Quasit', hd: '2', ac: 14, atk: ['1d4'], size: 'S', fig: 'imp', tags: ['demon', 'ev'] }],
['spriggan', { name: 'Spriggan', hd: '4.5', ac: 15, atk: ['1d8'], size: 'M', fig: 'imp', tags: ['demon', 'ev'], fly: true }],
['dretch', { name: 'Dretch', hd: '3.5', ac: 15, atk: ['1d6'], size: 'S', fig: 'imp', tags: ['demon', 'ev'] }],
['gazer', { name: 'Gazer', hd: '5', ac: 15, atk: ['1d6'], size: 'M', fig: 'orb', tags: ['demon', 'ev'], fly: true, gaze: 'sleep' }],
['marilith', { name: 'Marilith', hd: '9.4', ac: 16, atk: ['1d10', '1d10', '1d10', '1d10'], size: 'L', fig: 'marilith', tags: ['demon', 'ev', 'leader'], ml: 17, leader: true, fly: true }],
['demon_kin', { name: 'Demon Kin', hd: '4', ac: 15, atk: ['1d8'], size: 'M', fig: 'imp', tags: ['demon', 'ev'] }],
['demon_warden', { name: 'Demon Warden', hd: '6', ac: 16, atk: ['1d10'], size: 'M', fig: 'imp', tags: ['demon', 'ev'], fly: true }],
['demon_hag', { name: 'Demon Hag', hd: '6.5', ac: 16, atk: ['1d8'], size: 'M', fig: 'imp', tags: ['demon', 'ev', 'caster'], cast: { lvl: 8, list: ['fear', 'hold_person_m'] } }],
['demon_lord', { name: 'Demon Lord', hd: '9', ac: 17, atk: ['2d6', '1d8'], size: 'L', fig: 'marilith', tags: ['demon', 'ev', 'leader'], ml: 17, leader: true, fly: true, cast: { lvl: 11, list: ['fear', 'hold_person_m', 'dispel_m'] } }],

/* ---- devils ---- */
['devilskin', { name: 'Devil-Skin', hd: '3', ac: 15, atk: ['1d6'], size: 'M', fig: 'humanoid', tags: ['devil', 'ev'] }],
['beir', { name: 'Beir', hd: '4', ac: 15, atk: ['1d8'], size: 'M', fig: 'humanoid', tags: ['devil', 'ev'] }],
['nerubli', { name: 'Nerubli', hd: '3.5', ac: 15, atk: ['1d6'], size: 'S', fig: 'spider', tags: ['devil', 'ev'] }],
['yochl', { name: 'Yochl', hd: '5', ac: 16, atk: ['1d8'], size: 'M', fig: 'imp', tags: ['devil', 'ev'] }],
['ornetheus', { name: 'Ornethus', hd: '5.5', ac: 16, atk: ['1d8'], size: 'M', fig: 'bird', tags: ['devil', 'ev'], fly: true }],
['hezrou', { name: 'Hezrou', hd: '7', ac: 16, atk: ['1d10', '1d10'], size: 'L', fig: 'imp', tags: ['devil', 'ev'] }],
['glabrezou', { name: 'Glabrezou', hd: '8', ac: 17, atk: ['2d6', '1d8'], size: 'L', fig: 'imp', tags: ['devil', 'ev'], immune: ['fire'] }],
['dis', { name: 'Dis', hd: '8.5', ac: 17, atk: ['2d6'], size: 'M', fig: 'imp', tags: ['devil', 'ev', 'caster'], cast: { lvl: 9, list: ['fear', 'hold_person_m'] } }],
['erratic', { name: 'Erratic', hd: '7.5', ac: 16, atk: ['1d10', '1d10'], size: 'L', fig: 'imp', tags: ['devil', 'ev'] }],
['devil_kin', { name: 'Devil Kin', hd: '4.5', ac: 16, atk: ['1d8'], size: 'M', fig: 'humanoid', tags: ['devil', 'ev'] }],
['devil_warden', { name: 'Devil Warden', hd: '6.5', ac: 17, atk: ['1d10'], size: 'M', fig: 'humanoid', tags: ['devil', 'ev'] }],
['devil_hag', { name: 'Devil Hag', hd: '7', ac: 17, atk: ['1d8'], size: 'M', fig: 'raven_witch', tags: ['devil', 'ev', 'caster'], cast: { lvl: 9, list: ['fear', 'hold_person_c'] } }],
['devil_lord', { name: 'Devil Lord', hd: '9.5', ac: 17, atk: ['2d6', '1d10'], size: 'L', fig: 'imp', tags: ['devil', 'ev', 'leader'], ml: 17, leader: true, cast: { lvl: 11, list: ['fear', 'hold_person_c', 'dispel_p'] } }],

/* ---- dragons ---- */
['wyrm', { name: 'Young Wyrm', hd: '6', ac: 16, atk: ['1d8', '1d6'], size: 'L', fig: 'dragon', tags: ['dragon', 'gi'], fly: true, breath: { type: 'fire', dmg: '4d6', save: true, range: 6, cd: 3 } }],
['wyrm_elder', { name: 'Elder Wyrm', hd: '8', ac: 17, atk: ['1d10', '1d8'], size: 'H', fig: 'dragon', tags: ['dragon', 'gi'], fly: true, breath: { type: 'fire', dmg: '6d6', save: true, range: 7, cd: 3 } }],
['drake', { name: 'Drake', hd: '5', ac: 15, atk: ['1d8'], size: 'M', fig: 'dragon', tags: ['dragon', 'gi'], fly: true }],
['wyvern', { name: 'Wyvern', hd: '5.5', ac: 15, atk: ['1d8', '1d4'], size: 'M', fig: 'dragon', tags: ['dragon', 'gi'], fly: true, venom: { dmg: '1d6', delay: [16, 30], save: true } }],
['white_dragon', { name: 'Young White Dragon', hd: '7.2', ac: 17, atk: ['1d10', '1d6'], size: 'L', fig: 'dragon', tags: ['dragon', 'gi', 'cold'], fly: true, immune: ['cold'], breath: { type: 'cold', dmg: '5d6', save: true, range: 6, cd: 3 } }],
['black_dragon', { name: 'Young Black Dragon', hd: '7.4', ac: 17, atk: ['1d10', '1d6'], size: 'L', fig: 'dragon', tags: ['dragon', 'gi', 'poison'], fly: true, breath: { type: 'poison', dmg: '5d6', save: true, range: 6, cd: 3 } }],
['green_dragon', { name: 'Young Green Dragon', hd: '7.6', ac: 17, atk: ['1d10', '1d6'], size: 'L', fig: 'dragon', tags: ['dragon', 'gi', 'poison'], fly: true, breath: { type: 'poison', dmg: '5d6', save: true, range: 6, cd: 3 } }],
['red_dragon', { name: 'Young Red Dragon', hd: '8', ac: 18, atk: ['1d10', '1d8'], size: 'L', fig: 'dragon', tags: ['dragon', 'gi', 'fire'], fly: true, immune: ['fire'], breath: { type: 'fire', dmg: '6d6', save: true, range: 7, cd: 3 } }],
['gold_dragon', { name: 'Young Gold Dragon', hd: '8.4', ac: 18, atk: ['1d10', '1d8'], size: 'L', fig: 'dragon', tags: ['dragon', 'gi', 'fire'], fly: true, immune: ['fire'] }],
['the_dragon_thing', { name: 'The Dragon Thing', hd: '10', ac: 18, atk: ['2d6', '1d10'], size: 'H', fig: 'dragon', tags: ['dragon', 'gi', 'leader'], ml: 17, leader: true, fly: true, breath: { type: 'fire', dmg: '8d6', save: true, range: 8, cd: 3 } }],

/* ---- underdark ---- */
['derzu', { name: 'Derzu', hd: '3', ac: 14, atk: ['1d6'], size: 'M', fig: 'spider', tags: ['beast', 'vermin', 'poison', 'underdark'], venom: { dmg: '1d6', delay: [16, 30], save: true } }],
['goblin_deep', { name: 'Deep Goblin', hd: '1.5', ac: 14, atk: ['1d4'], size: 'S', fig: 'humanoid', tags: ['humanoid', 'gob', 'small', 'underdark'] }],
['drow', { name: 'Drow', hd: '2', ac: 15, atk: ['1d6'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'underdark', 'ev'] }],
['drow_lord', { name: 'Drow Lord', hd: '4', ac: 16, atk: ['1d8'], size: 'M', fig: 'humanoid', tags: ['humanoid', 'underdark', 'ev', 'leader'], ml: 15, leader: true }],
['deep_spider', { name: 'Deep Spider', hd: '3.5', ac: 15, atk: ['1d6'], size: 'M', fig: 'spider', tags: ['beast', 'vermin', 'poison', 'underdark'], venom: { dmg: '1d6', delay: [16, 30], save: true } }],
['myconid', { name: 'Myconid', hd: '3.5', ac: 15, atk: ['1d6'], size: 'M', fig: 'blob', tags: ['beast', 'fungus', 'underdark'] }],
['mind_flayer', { name: 'Mind Flayer', hd: '6', ac: 16, atk: ['1d6'], size: 'M', fig: 'imp', tags: ['undead', 'underdark', 'caster', 'drain'], drain: 1, cast: { lvl: 8, list: ['hold_person_m', 'fear'] } }],
['mind_flayer_elder', { name: 'Elder Mind Flayer', hd: '8', ac: 17, atk: ['1d8'], size: 'M', fig: 'imp', tags: ['undead', 'underdark', 'caster', 'drain', 'leader'], drain: 1, ml: 16, leader: true, cast: { lvl: 10, list: ['hold_person_m', 'fear', 'dispel_m'] } }],
['deep_golem', { name: 'Deep Golem', hd: '5.5', ac: 16, atk: ['1d10'], size: 'M', fig: 'golem', tags: ['construct', 'underdark'], immune: ['poison', 'sleep', 'hold'] }],
['shrieker', { name: 'Shrieker', hd: '2', ac: 13, atk: ['1d4'], size: 'S', fig: 'blob', tags: ['beast', 'underdark'], fly: true }],
['vermind', { name: 'Vermind', hd: '1.5', ac: 13, atk: ['1d3'], size: 'S', fig: 'centipede', tags: ['beast', 'vermin', 'underdark'] }],
['the_deep_thing', { name: 'The Deep Thing', hd: '6.5', ac: 16, atk: ['2d6'], size: 'L', fig: 'blob', tags: ['beast', 'underdark', 'leader'], ml: 15, leader: true }],

/* ---- elementals ---- */
['air_elemental', { name: 'Air Elemental', hd: '4', ac: 13, atk: ['1d6'], size: 'M', fig: 'orb', tags: ['elemental'], fly: true, immune: ['poison', 'sleep', 'hold'] }],
['earth_elemental', { name: 'Earth Elemental', hd: '5', ac: 15, atk: ['1d8'], size: 'L', fig: 'golem', tags: ['elemental'], immune: ['poison', 'sleep', 'hold'] }],
['fire_elemental', { name: 'Fire Elemental', hd: '5.5', ac: 14, atk: ['1d8'], size: 'M', fig: 'orb', tags: ['elemental'], immune: ['fire', 'poison', 'sleep', 'hold'] }],
['water_elemental', { name: 'Water Elemental', hd: '5.5', ac: 14, atk: ['1d8'], size: 'M', fig: 'blob', tags: ['elemental'], immune: ['poison', 'sleep', 'hold'] }],
['air_kin', { name: 'Air Kin', hd: '3', ac: 13, atk: ['1d4'], size: 'S', fig: 'orb', tags: ['elemental'], fly: true, immune: ['poison', 'sleep', 'hold'] }],
['earth_kin', { name: 'Earth Kin', hd: '4', ac: 15, atk: ['1d6'], size: 'M', fig: 'golem', tags: ['elemental'], immune: ['poison', 'sleep', 'hold'] }],
['fire_kin', { name: 'Fire Kin', hd: '4.5', ac: 14, atk: ['1d6'], size: 'S', fig: 'orb', tags: ['elemental'], immune: ['fire', 'poison', 'sleep', 'hold'] }],
['water_kin', { name: 'Water Kin', hd: '4.5', ac: 14, atk: ['1d6'], size: 'S', fig: 'blob', tags: ['elemental'], immune: ['poison', 'sleep', 'hold'] }],
['the_ember_thing', { name: 'The Ember Thing', hd: '6', ac: 15, atk: ['1d10'], size: 'M', fig: 'orb', tags: ['elemental', 'fire', 'leader'], ml: 15, leader: true, immune: ['fire', 'poison', 'sleep', 'hold'] }],
['the_stone_thing', { name: 'The Stone Thing', hd: '6.5', ac: 16, atk: ['2d6'], size: 'L', fig: 'golem', tags: ['elemental', 'leader'], ml: 15, leader: true, immune: ['poison', 'sleep', 'hold'] }],

/* ---- catch-all to reach 191 ---- */
['night_hag', { name: 'Night Hag', hd: '5.5', ac: 15, atk: ['1d6'], size: 'M', fig: 'raven_witch', tags: ['humanoid', 'ev', 'caster'], cast: { lvl: 7, list: ['scare', 'fear'] } }],
['grave_robe', { name: 'Grave Robe', hd: '3.5', ac: 14, atk: ['1d6'], size: 'M', fig: 'shade', tags: ['undead', 'und'] }],
['the_great_thing', { name: 'The Great Thing', hd: '7.5', ac: 15, atk: ['2d6'], size: 'H', fig: 'blob', tags: ['beast', 'leader'], ml: 16, leader: true }],
['the_old_thing', { name: 'The Old Thing', hd: '8', ac: 15, atk: ['2d6'], size: 'H', fig: 'blob', tags: ['beast', 'leader'], ml: 16, leader: true }],
['the_deep_warden', { name: 'The Deep Warden', hd: '6.5', ac: 16, atk: ['2d6'], size: 'L', fig: 'golem', tags: ['construct', 'underdark', 'leader'], ml: 16, leader: true, immune: ['poison', 'sleep', 'hold'] }],
['the_frost_warden', { name: 'The Frost Warden', hd: '7', ac: 16, atk: ['2d6'], size: 'L', fig: 'golem', tags: ['construct', 'cold', 'leader'], ml: 16, leader: true, immune: ['cold', 'poison', 'sleep', 'hold'] }],
['the_swamp_warden', { name: 'The Swamp Warden', hd: '6.5', ac: 15, atk: ['2d6'], size: 'L', fig: 'troll', tags: ['humanoid', 'tro', 'regen', 'leader'], ml: 16, leader: true, regen: true }],
['the_bog_warden', { name: 'The Bog Warden', hd: '6', ac: 15, atk: ['2d6'], size: 'L', fig: 'blob', tags: ['beast', 'leader'], ml: 15, leader: true }],
['the_fen_warden', { name: 'The Fen Warden', hd: '6', ac: 15, atk: ['2d6'], size: 'L', fig: 'serpent', tags: ['beast', 'poison', 'leader'], ml: 15, leader: true, venom: { dmg: '1d8', delay: [16, 30], save: true } }],
['the_mire_warden', { name: 'The Mire Warden', hd: '6', ac: 15, atk: ['2d6'], size: 'L', fig: 'blob', tags: ['beast', 'leader'], ml: 15, leader: true }],
['the_wild_warden', { name: 'The Wild Warden', hd: '6.5', ac: 15, atk: ['2d6'], size: 'L', fig: 'wolf', tags: ['beast', 'wolf', 'leader'], ml: 16, leader: true }],
['the_wood_warden', { name: 'The Wood Warden', hd: '6.5', ac: 15, atk: ['2d6'], size: 'L', fig: 'beast', tags: ['beast', 'leader'], ml: 16, leader: true }],
['the_rock_warden', { name: 'The Rock Warden', hd: '7', ac: 16, atk: ['2d6'], size: 'L', fig: 'golem', tags: ['construct', 'leader'], ml: 16, leader: true, immune: ['poison', 'sleep', 'hold'] }],
['the_ice_warden', { name: 'The Ice Warden (Deep)', hd: '7.5', ac: 17, atk: ['2d6', '1d6'], size: 'L', fig: 'golem', tags: ['construct', 'cold', 'leader'], ml: 17, leader: true, immune: ['cold', 'poison', 'sleep', 'hold'] }],
['the_fire_warden', { name: 'The Fire Warden', hd: '7.5', ac: 16, atk: ['2d6', '1d6'], size: 'M', fig: 'orb', tags: ['elemental', 'fire', 'leader'], ml: 17, leader: true, immune: ['fire', 'poison', 'sleep', 'hold'] }],
['the_storm_warden', { name: 'The Storm Warden', hd: '8', ac: 16, atk: ['2d6', '1d8'], size: 'M', fig: 'orb', tags: ['elemental', 'leader'], ml: 17, leader: true, fly: true, immune: ['poison', 'sleep', 'hold'] }],
['the_shadow_warden', { name: 'The Shadow Warden', hd: '7', ac: 16, atk: ['2d6'], size: 'M', fig: 'shade', tags: ['undead', 'und', 'leader'], ml: 17, leader: true }],
['the_bone_warden', { name: 'The Bone Warden', hd: '7', ac: 16, atk: ['2d6'], size: 'M', fig: 'skeleton', tags: ['undead', 'und', 'leader'], ml: 17, leader: true }],
['the_ash_warden', { name: 'The Ash Warden', hd: '7', ac: 16, atk: ['2d6'], size: 'M', fig: 'lich', tags: ['undead', 'und', 'drain', 'caster', 'leader'], drain: 1, ml: 17, leader: true, cast: { lvl: 9, list: ['fear', 'dispel_p'] }, immune: ['poison', 'sleep', 'hold'] }],
['the_void_warden', { name: 'The Void Warden', hd: '8', ac: 17, atk: ['2d6', '1d8'], size: 'M', fig: 'imp', tags: ['devil', 'ev', 'leader'], ml: 17, leader: true, cast: { lvl: 10, list: ['fear', 'hold_person_c'] } }],
['the_chaos_warden', { name: 'The Chaos Warden', hd: '8', ac: 17, atk: ['2d6', '1d8'], size: 'L', fig: 'marilith', tags: ['demon', 'ev', 'leader'], ml: 17, leader: true, fly: true }],
['the_night_warden', { name: 'The Night Warden', hd: '7.5', ac: 16, atk: ['2d6'], size: 'M', fig: 'raven_witch', tags: ['humanoid', 'ev', 'caster', 'leader'], ml: 17, leader: true, cast: { lvl: 9, list: ['fear', 'scare'] } }],
['the_dawn_warden', { name: 'The Dawn Warden', hd: '7.5', ac: 16, atk: ['2d6'], size: 'M', fig: 'humanoid', tags: ['undead', 'und', 'leader'], ml: 17, leader: true }],
['the_moon_warden', { name: 'The Moon Warden', hd: '8', ac: 16, atk: ['2d6', '1d6'], size: 'M', fig: 'wolf', tags: ['beast', 'wolf', 'lycan', 'leader'], ml: 17, leader: true }],
];

for (const [id, f] of E) D.MONSTERS[id] = BS.build(id, f);
BS.count = () => E.length;
})();
