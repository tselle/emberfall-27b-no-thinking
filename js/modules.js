/* Emberfall — modules.js
 * Extends the registries for Thornwick (E0), the Hollow Vaults (E1),
 * Coldharrow (E2) and Ravenmoor (E3). Defines MODULES, the saga
 * CAMPAIGN.order, service names and story links. The E2/E3 authored maps
 * are built here; E0/E1 live in data.js.
 */
'use strict';
(function () {
const M = window.M = {};
const D = window.D;
const Cnv = D.Cnv;

/* ================= E2: Coldharrow ================= */

/* cold_town (23x17) */
(function () {
  const c = Cnv(23, 17, '#');
  c.rect(2, 1, 19, 4, ',');         /* north grass */
  c.set(5, 2, 'T').set(11, 3, 'T').set(14, 1, 'T');
  /* mine shaft (north-east) */
  c.set(17, 2, 'B').set(20, 2, 'B');
  c.set(17, 3, 'B').set(18, 3, '.').set(19, 3, '>').set(20, 3, 'B');
  c.set(17, 4, 'B').set(18, 4, 'D').set(19, 4, '.').set(20, 4, 'B');
  c.set(12, 4, 'm');                /* text marker */
  /* north service row */
  c.set(3, 5, 'B').set(4, 5, 'B').set(5, 5, 'B');
  c.set(3, 6, 'B').set(4, 6, '.').set(5, 6, 'B');
  c.set(3, 7, 'B').set(4, 7, '1').set(5, 7, 'B');
  c.set(8, 5, 'B').set(9, 5, 'B').set(10, 5, 'B');
  c.set(8, 6, 'B').set(9, 6, '.').set(10, 6, 'B');
  c.set(8, 7, 'B').set(9, 7, '2').set(10, 7, 'B');
  c.set(14, 5, 'B').set(15, 5, 'B').set(16, 5, 'B');
  c.set(14, 6, 'B').set(15, 6, '.').set(16, 6, 'B');
  c.set(14, 7, 'B').set(15, 7, '3').set(16, 7, 'B');
  c.rect(2, 8, 19, 1, '.');         /* main road */
  c.set(12, 8, 'a');
  /* centre row */
  c.set(3, 9, 'B').set(4, 9, 'B').set(5, 9, 'B');
  c.set(3, 10, 'B').set(4, 10, '.').set(5, 10, 'B');
  c.set(3, 11, 'B').set(4, 11, '4').set(5, 11, 'B');
  c.set(8, 9, 'B').set(9, 9, 'B').set(10, 9, 'B');
  c.set(8, 10, 'B').set(9, 10, '.').set(10, 10, 'B');
  c.set(8, 11, 'B').set(9, 11, '5').set(10, 11, 'B');
  c.set(14, 9, 'B').set(15, 9, 'B').set(16, 9, 'B');
  c.set(14, 10, 'B').set(15, 10, '.').set(16, 10, 'B');
  c.set(14, 11, 'B').set(15, 11, '6').set(16, 11, 'B');
  c.rect(2, 12, 19, 1, '.');
  c.rect(2, 13, 19, 3, ',');
  c.set(6, 14, 'T').set(16, 13, 'T');
  /* passageways between buildings */
  for (const x of [6, 12, 18]) { c.set(x, 5, '.').set(x, 6, '.').set(x, 7, '.'); c.set(x, 9, '.').set(x, 10, '.').set(x, 11, '.'); }
  c.set(11, 16, 'G');
  D.map('cold_town', {
    name: 'Coldharrow', safe: true, outdoor: true,
    start: { x: 11, y: 13, dir: 0 },
    grid: c.rows(),
    locs: {
      '1': { name: 'The Frostmere Inn', kind: 'inn' },
      '2': { name: 'Dunmore\'s Forge', kind: 'shop' },
      '3': { name: 'Chapel of St. Brannoc', kind: 'temple' },
      '4': { name: 'Thane Bergen\'s Hall', kind: 'hall' },
      '5': { name: 'The Rattler\'s Rest', kind: 'tavern' },
      '6': { name: 'Bergen\'s Drills', kind: 'training' }
    },
    ev: {
      a: { enc: { mons: [['goblin', '3']], text: 'Goblin scouts have taken the road into Coldharrow. They are fast, and they are not alone.', hidden: true } },
      m: { text: 'The Deepcut shaft, lashed and braced. The lift is broken; the stair goes down into the dark.' }
    },
    stairs: { '19,3': { to: 'cold_mine', at: { x: 12, y: 2 }, dir: 2 } },
    exit: { '11,16': { to: 'cold_wild', at: { x: 17, y: 18 } } },
    facades: { '1': 'inn', '2': 'shop', '3': 'temple', '4': 'hall', '5': 'tavern', '6': 'training' }
  });
})();

/* cold_mine (25x21) */
(function () {
  const c = Cnv(25, 21, '#');
  c.set(12, 1, '<');
  c.rect(9, 2, 7, 4, '.');          /* shaft hall */
  c.set(12, 4, 'a');
  c.rect(3, 4, 6, 4, '.');          /* west tunnel */
  c.set(4, 6, 'b').set(7, 5, 'g');
  c.rect(17, 4, 6, 4, '.');         /* east tunnel */
  c.set(19, 6, 'c').set(20, 5, 'h').set(16, 5, '.');
  c.rect(11, 6, 3, 4, '.');         /* central shaft */
  c.set(12, 8, '.');
  c.rect(3, 10, 8, 5, '.');         /* deep level */
  c.set(5, 12, 'd').set(7, 11, 'i').set(11, 10, '.');
  c.rect(15, 10, 8, 5, '.');        /* Gorrak's lair */
  c.set(18, 12, 'e').set(21, 13, 'j').set(13, 10, '.').set(14, 10, '.');
  D.map('cold_mine', {
    name: 'Deepcut Mine',
    start: { x: 12, y: 2, dir: 2 },
    grid: c.rows(),
    ev: {
      a: { enc: { mons: [['goblin', '3']], text: 'Mine goblins scatter from the shaft, pick-first, cursing in a tongue older than the mine.' } },
      b: { enc: { mons: [['goblin', '2']], text: 'The west tunnel is staked out with goblin warning-flags. The flags are a suggestion.' } },
      c: { enc: { mons: [['goblin', '2']], text: 'Goblins work the east drift. They stop working when they see you.' } },
      d: { enc: { mons: [['goblin', '1d4+1']], text: 'The deep level. Goblin miners with the mine\'s own picks, and the mine\'s own grudges.', items: ['tallyBook'] } },
      e: { enc: { mons: [['gorrak', 1], ['goblin', 2]], text: 'Gorrak Skullsplitter waits in the lair with his pick and his audience. "The mine is the measure," he says, "and the measure is me."', gold: '2d6x10', quest: 'cold_mine' } },
      g: { chest: { text: 'A miner\'s cache, hidden behind the drift.', gold: '1d6x5', items: ['potion_clw'] } },
      h: { chest: { text: 'The goblins\' east hoard: nail clippings, buttons, and one good mace.', gold: '1d6x10', items: ['mace'] } },
      i: { chest: { text: 'The foreman\'s chest, still on its hook.', gold: '1d6x5', items: ['tallyBook'] } },
      j: { chest: { text: 'Gorrak\'s lair-chest: the mine\'s taken silver, and a black iron seal he does not know what to do with.', gold: '2d6x10', items: ['kingsSeal', 'potion_cure_serious'] } }
    },
    traps: { '12,7': { type: 'dart' }, '6,10': { type: 'pit' }, '18,14': { type: 'spear' } },
    stairs: { '12,1': { to: 'cold_town', at: { x: 19, y: 3 }, dir: 2 } },
    wander: [
      { chance: 0.05, mons: [['goblin', '1d4']], text: 'Goblin footfall in the dark.' }
    ],
    locs: {}
  });
})();

/* cold_barrow (25x21) */
(function () {
  const c = Cnv(25, 21, '#');
  c.set(12, 1, '<');
  c.rect(9, 2, 7, 4, '.');          /* entrance hall */
  c.set(12, 4, 'a');
  c.rect(3, 3, 6, 4, '.');          /* west tomb */
  c.set(5, 5, 'b').set(4, 4, 'g');
  c.rect(17, 3, 6, 4, '.');         /* east tomb */
  c.set(19, 4, 'c').set(20, 5, 'h').set(16, 4, '.');
  c.rect(11, 6, 3, 4, '.');         /* central passage */
  c.set(11, 8, 'e').set(13, 7, 'f');
  c.rect(9, 10, 7, 1, '.');         /* apron */
  c.set(14, 10, 'j');
  c.set(12, 11, 'L');               /* the king's tomb */
  c.rect(9, 11, 7, 4, '.');
  c.set(12, 13, 'd').set(14, 14, 'k');
  D.map('cold_barrow', {
    name: 'Barrow of the Iron King',
    start: { x: 12, y: 2, dir: 2 },
    grid: c.rows(),
    keyItem: 'kingsSeal', lockText: 'A lock of barrow-iron with a seal-shaped keyhole. Something crowned turns the key.',
    ev: {
      a: { enc: { mons: [['revenant', '3']], text: 'The barrow\'s dead keep their ledgers. They rise from the hall in a file, as if to work.' } },
      b: { enc: { mons: [['wight', '2']], text: 'Two wights stand the west tomb. They have been standing a long time.' } },
      c: { enc: { mons: [['frost_wraith', 1]], text: 'A frost wraith drifts the east tomb, and the cold comes with it.' } },
      e: { enc: { mons: [['dwarf_knight', '2']], text: 'The Deepcut guard still stands watch, chainmail full of water that will not freeze.' } },
      f: { enc: { mons: [['revenant', '2']], text: 'More of the barrow\'s dead, keeping the passage to the tomb.' } },
      d: { enc: { mons: [['iron_king', 1], ['wight', 2]], text: 'The Iron King sits on a throne of barrow-iron, crown still on his head. The seal on his chest opens at your touch, and he stands.', gold: 0, quest: 'cold_king' } },
      g: { chest: { text: 'The west tomb\'s chest: what the dead were paid to keep.', gold: '1d6x10', items: ['potion_antivenom'] } },
      h: { chest: { text: 'The east tomb\'s chest, cold to the bone.', gold: '1d6x10', items: ['gem_sapphire'] } },
      j: { chest: { text: 'A chest on the apron, latched but not locked. A wight\'s tribute, probably.', gold: '1d6x10', items: ['potion_cure_critical'] } },
      k: { chest: { text: 'The king\'s chest. Inside, still keen: his enchanted blade.', gold: '3d6x10', items: ['kingsBlade'] } }
    },
    traps: { '12,6': { type: 'dart' }, '12,9': { type: 'spear' }, '10,10': { type: 'blade' } },
    stairs: { '12,1': { to: 'cold_wild', at: { x: 12, y: 5 } } }
  });
})();

/* ================= E3: Ravenmoor ================= */

/* rav_fort (21x12) */
(function () {
  const c = Cnv(21, 12, '#');
  c.rect(2, 1, 17, 9, '.');
  c.set(3, 2, 'B').set(4, 2, 'B').set(5, 2, 'B');
  c.set(3, 3, 'B').set(4, 3, '1').set(5, 3, 'B');
  c.set(8, 2, 'B').set(9, 2, 'B').set(10, 2, 'B');
  c.set(8, 3, 'B').set(9, 3, '2').set(10, 3, 'B');
  c.set(13, 2, 'B').set(14, 2, 'B').set(15, 2, 'B');
  c.set(13, 3, 'B').set(14, 3, '3').set(15, 3, 'B');
  c.set(16, 2, 'B').set(17, 2, 'B').set(18, 2, 'B');
  c.set(16, 3, 'B').set(17, 3, '4').set(18, 3, 'B');
  c.set(4, 6, 'a').set(16, 6, 'b');
  c.set(10, 10, '.');               /* gate passage */
  c.set(10, 11, 'G');
  D.map('rav_fort', {
    name: 'Fort Ravel', safe: true, outdoor: true,
    start: { x: 10, y: 9, dir: 0 },
    grid: c.rows(),
    locs: {
      '1': { name: 'The Ravel Barracks', kind: 'inn' },
      '2': { name: 'The Fort Armory', kind: 'shop' },
      '3': { name: 'Chapel of the North', kind: 'temple' },
      '4': { name: 'Commander Ysolde\'s Hall', kind: 'hall' }
    },
    ev: {
      a: { enc: { mons: [['raven_witch', 1]], text: 'A raven witch watches the west wall from her perch. She has been waiting for the company that goes north.', hidden: true } },
      b: { enc: { mons: [['worg', 2]], text: 'Worgs run the east courtyard. The fort\'s dogs are gone, and these are not replacements.' } }
    },
    exit: { '10,11': { to: 'rav_wild', at: { x: 16, y: 18 } } }
  });
})();

/* rav_moor (25x21) */
(function () {
  const c = Cnv(25, 21, '#');
  c.set(12, 0, 'G');
  c.rect(2, 1, 21, 2, '.');
  c.rect(2, 3, 21, 3, '.');         /* open ground, houses set over it */
  /* burned houses */
  c.rect(3, 3, 3, 3, 'H'); c.rect(8, 3, 3, 3, 'H'); c.rect(14, 3, 3, 3, 'H'); c.rect(19, 3, 3, 3, 'H');
  c.rect(2, 6, 21, 3, '.');
  c.set(12, 7, 'a').set(8, 6, 'b');
  c.rect(2, 9, 21, 4, ',');
  c.set(16, 9, 'p');
  c.set(4, 12, 'c').set(20, 12, 'g');
  c.rect(2, 13, 21, 1, '.');        /* causeway to the keep */
  /* gnashrot's lair (the burned keep, south) */
  c.rect(7, 14, 11, 5, '.');
  c.set(12, 16, 'd').set(12, 18, 'h');
  D.map('rav_moor', {
    name: 'The Burned Village',
    start: { x: 12, y: 2, dir: 2 },
    grid: c.rows(),
    ev: {
      a: { enc: { mons: [['worg', '2']], text: 'The village road is full of worgs, and the worgs are full of the village.' } },
      b: { enc: { mons: [['hellhound', 1]], text: 'A hellhound curls in the burned house, coals for eyes. It dropped something: a patrol badge, still warm.', items: ['patrolBadge'] } },
      c: { enc: { mons: [['raven_witch', '2']], text: 'Raven witches keep the field. They trade in riddles and keep their answers in their beaks.' } },
      d: { enc: { mons: [['gnashrot', 1], ['troll', 1]], text: 'Gnashrot the Bridge-keeper waits in the burned keep, and the keep is full of him.', gold: '1d6x20', quest: 'rav_moor' } },
      p: { text: 'A patrol pack lies scattered across the field. The kit is gone; three badges are pinned to the ground, as if left on purpose.', items: ['patrolBadge', 'patrolBadge', 'patrolBadge'] },
      g: { chest: { text: 'A patrol chest under the field, half-buried.', gold: '1d6x10', items: ['patrolBadge', 'patrolBadge', 'patrolBadge', 'patrolBadge', 'rations'] } },
      h: { chest: { text: 'Gnashrot\'s keep-chest: what the patrol did not get to carry.', gold: '2d6x10', items: ['patrolBadge', 'patrolBadge', 'patrolBadge', 'patrolBadge'] } }
    },
    traps: { '12,11': { type: 'spear' }, '8,12': { type: 'dart' } },
    exit: { '12,0': { to: 'rav_wild', at: { x: 16, y: 9 } } }
  });
})();

/* rav_keep (25x19) */
(function () {
  const c = Cnv(25, 19, '#');
  c.set(12, 0, 'G');
  c.rect(2, 1, 21, 1, '.');
  c.rect(8, 2, 9, 5, '.');          /* courtyard */
  c.set(10, 4, 'a').set(15, 3, 'g');
  c.rect(3, 3, 3, 4, '.');          /* west tower */
  c.set(4, 5, 'b');
  c.rect(19, 3, 3, 4, '.');         /* east tower */
  c.set(20, 5, 'c');
  c.set(6, 4, '.').set(7, 4, '.');  /* west passage */
  c.set(17, 4, '.').set(18, 4, '.');/* east passage */
  c.rect(11, 7, 3, 3, '.');         /* passage */
  c.rect(6, 10, 13, 5, '.');        /* great hall */
  c.set(12, 12, 'd').set(8, 11, 'e').set(16, 11, 'f').set(7, 14, 'h').set(17, 14, 'i');
  c.rect(3, 15, 8, 3, '.');         /* southwest passage */
  c.set(4, 17, '>');
  D.map('rav_keep', {
    name: 'The Troll Keep',
    start: { x: 12, y: 2, dir: 2 },
    grid: c.rows(),
    ev: {
      a: { enc: { mons: [['gargoyle', '2']], text: 'Gargoyles watch the courtyard. They were carved to watch the keep, and the keep carved them back.' } },
      b: { enc: { mons: [['raven_witch', '2']], text: 'Raven witches on the west tower, perched on the carved faces.' } },
      c: { enc: { mons: [['hellhound', '2']], text: 'Hellhounds hold the east tower. The keep\'s own dogs are gone.' } },
      d: { enc: { mons: [['grull', 1]], text: 'Grull of the Boulder Fields fills the great hall, and the great hall is full of him. He is still deciding which view is better.', gold: '3d6x20', quest: 'rav_keep' } },
      e: { enc: { mons: [['gargoyle', '2']], text: 'More gargoyles, in the hall\'s west alcove. Only magic cuts them now.' } },
      f: { enc: { mons: [['raven_witch', '2']], text: 'The last of Vharra\'s flock, guarding the boulder fields.' } },
      g: { chest: { text: 'A courtyard chest, behind the boulders.', gold: '1d6x10', items: ['potion_cure_serious'] } },
      h: { chest: { text: 'The giant\'s hoard, under the hall.', gold: '3d6x10', items: ['gem_diamond', 'old_king_crown'] } },
      i: { chest: { text: 'A chest from the boulder fields: what the patrol carried north.', gold: '2d6x10', items: ['potion_haste'] } }
    },
    traps: { '12,7': { type: 'dart' }, '12,9': { type: 'pit' }, '14,14': { type: 'spear' } },
    stairs: { '4,17': { to: 'rav_pit', at: { x: 12, y: 2 }, dir: 2 } },
    exit: { '12,0': { to: 'rav_wild', at: { x: 24, y: 6 } } }
  });
})();

/* rav_pit (25x18) */
(function () {
  const c = Cnv(25, 18, '#');
  c.set(12, 0, '<');
  c.rect(9, 1, 7, 5, '.');          /* upper hall */
  c.set(12, 4, 'a').set(10, 3, 'g');
  c.rect(3, 2, 6, 4, '.');          /* west roost */
  c.set(5, 5, 'b').set(4, 4, 'h');
  c.rect(17, 2, 6, 4, '.');         /* east roost */
  c.set(19, 5, 'c').set(20, 4, 'i').set(16, 4, '.');
  c.rect(11, 6, 3, 4, '.');         /* passage */
  c.set(12, 8, 'd');
  c.set(10, 9, '.').set(9, 9, '.');
  c.rect(4, 10, 6, 4, '.');         /* hound den */
  c.set(6, 12, 'e').set(5, 10, '.');
  c.rect(14, 10, 7, 4, '.');        /* sanctum */
  c.set(17, 13, 'f').set(19, 13, 'k').set(14, 9, '.').set(15, 10, 'j');
  c.rect(4, 14, 17, 4, '.');
  D.map('rav_pit', {
    name: 'The Witch-Pit',
    start: { x: 12, y: 2, dir: 2 },
    grid: c.rows(),
    ev: {
      a: { enc: { mons: [['raven_witch', '3']], text: 'The pit\'s flock, in the upper hall. They have been expecting the company that goes down.' } },
      b: { enc: { mons: [['hellhound', '2']], text: 'The west roost is full of hounds, and the hounds are full of the west.' } },
      c: { enc: { mons: [['gargoyle', '2']], text: 'Gargoyles in the east roost, carved from the pit\'s own stone.' } },
      d: { enc: { mons: [['bog_wraith', '2']], text: 'Bog wraiths coil the passage, and the passage is full of them.' } },
      e: { enc: { mons: [['hellhound', '3']], text: 'The hound den. Three of them, and the den is full of the three.' } },
      f: { enc: { mons: [['vharra', 1], ['raven_witch', 2]], text: 'Vharra, the Witch-Queen, waits in the sanctum with her flock. "The north," she says, "has been mine since the last king forgot to be kind."', gold: 0, quest: 'rav_witch' } },
      g: { chest: { text: 'A roost chest, under the feathers.', gold: '1d6x10', items: ['potion_invis'] } },
      h: { chest: { text: 'The hound den\'s cache: what the hounds did not finish.', gold: '1d6x10', items: ['houndFang', 'potion_cure_serious'] } },
      i: { chest: { text: 'The east roost\'s chest, cold and dry.', gold: '1d6x10', items: ['gem_ruby'] } },
      j: { chest: { text: 'A chest on the sanctum step, latched with a raven-feather key.', gold: '2d6x10', items: ['witch_cauldron'] } },
      k: { chest: { text: 'Vharra\'s hoard: the moor\'s old crown, and what the north paid for it.', gold: '4d6x10', items: ['witchSigil', 'crown_jewels'] } }
    },
    traps: { '12,6': { type: 'blade' }, '12,9': { type: 'pit' }, '5,10': { type: 'spear' } },
    stairs: { '12,0': { to: 'rav_keep', at: { x: 5, y: 17 }, dir: 0 } }
  });
})();

/* ================= MODULES ================= */
const MODULES = {};
M.MODULES = MODULES;

MODULES.thornwick = {
  code: 'E0', id: 'thornwick', name: 'The Cellars of Thornwick', lvl: 1, levels: [1, 2],
  diff: 1, size: 'short', length: 'about an hour',
  hub: 'thornwick', maps: ['thornwick', 'thorn_cellar', 'thorn_wild'],
  gold: 40, next: 'hollow',
  quests: ['thorn_kobolds'], side: ['thorn_ring'], final: false,
  names: { place: 'Thornwick', giver: 'Elder Maddoc', trainer: 'Sergeant Brask' },
  blurb: 'A village with a cellar problem. The rats have a king, the king has a kettle, and the kettle has your lock.',
  intro: 'Thornwick is a village of nine houses and one brewery, and the brewery has a cellar, and the cellar has taken the lock.',
  hint: 'The brewery stair goes down. The brass key goes to the locked room. The ring goes to the widow.',
  victory: 'Skarrik\'s crown is nails, and the nails are off. The cellar is the village\'s again.',
  lose: 'The cellar keeps what it takes. Load a save, or return to the title, and try the village again.'
};
MODULES.hollow = {
  code: 'E1', id: 'hollow', name: 'The Hollow Vaults', lvl: 1, levels: [1, 3],
  diff: 2, size: 'large', length: 'several hours',
  hub: 'town', maps: ['town', 'crypt1', 'crypt2', 'tower', 'wild'],
  gold: 60, next: 'coldharrow',
  quests: ['redfang', 'reliquary', 'malvek'], side: ['gnolls'], final: false,
  names: { place: 'Emberfall', giver: 'Reeve Halda', trainer: 'Master Corvin' },
  blurb: 'The abbey is open, the cult is whole, and the Dawn\'s reliquary is in the dark. The tower on the ridge has a new flag.',
  intro: 'Emberfall rebuilt after the flood, and the flood rebuilt the abbey into a vault. The Dawn kept its vigil here. Now the vigil is kept by ash.',
  hint: 'The abbey stair goes down. The ogre has the iron key. The reliquary is warm. The packlord is up-stairs, and he has Tamsin.',
  victory: 'Malvek is gone, and the circle is only ash. The Dawn has its reliquary, and the light is a little brighter for it.',
  lose: 'The vaults keep their dead. Load a save, or return to the title, and try the Dawn again.'
};
MODULES.coldharrow = {
  code: 'E2', id: 'coldharrow', name: 'Barrow of the Iron King', lvl: 3, levels: [3, 5],
  diff: 3, size: 'medium', length: 'two to three hours',
  hub: 'cold_town', maps: ['cold_town', 'cold_mine', 'cold_barrow', 'cold_wild'],
  gold: 150, next: 'ravenmoor',
  quests: ['cold_mine', 'cold_king'], side: ['cold_tally'], final: false,
  names: { place: 'Coldharrow', giver: 'Thane Bergen', trainer: 'Sergeant Vold' },
  blurb: 'The goblins have the mine, the mine has the iron, and the barrow on the hill has a king who is still sitting on it.',
  intro: 'Coldharrow is a mining town with a barrow problem. The barrow is old, the king is older, and the mine is full of goblins who split skulls for sport.',
  hint: 'The forge sells silver. The mine has the seal. The barrow has the king, and the king has a blade that still bites.',
  victory: 'The Iron King is at rest, and the barrow is only stone. The mine is the town\'s again.',
  lose: 'The barrow keeps what it keeps. Load a save, or return to the title, and try the hill again.'
};
MODULES.ravenmoor = {
  code: 'E3', id: 'ravenmoor', name: 'The Witch-Queen of Ravenmoor', lvl: 5, levels: [5, 7],
  diff: 4, size: 'large', length: 'three hours or more',
  hub: 'rav_fort', maps: ['rav_fort', 'rav_moor', 'rav_keep', 'rav_pit', 'rav_wild'],
  gold: 500, next: null,
  quests: ['rav_moor', 'rav_keep', 'rav_witch'], side: ['rav_patrol'], final: true,
  names: { place: 'Fort Ravel', giver: 'Commander Ysolde', trainer: 'Commander Ysolde' },
  blurb: 'The causeway is a road when the troll lets it be. The keep is a fort when the giant lets it be. The moor is the Witch-Queen\'s, and she has been queen a long time.',
  intro: 'Fort Ravel is the north\'s last wall, and the wall is full of the moor. The causeway goes north. The keep is on the north side of the causeway. The pit is under the keep.',
  hint: 'The causeway is a road when the troll lets it be. The keep is a fort when the giant lets it be. The pit is the Witch-Queen\'s, and the Witch-Queen is the pit.',
  victory: 'Vharra is gone, and the moor is only moor. The north is north again, and the wall is a wall again.',
  lose: 'The moor keeps what it takes. Load a save, or return to the title, and try the north again.'
};

M.CAMPAIGN = {
  id: 'saga',
  name: 'The Emberwild Saga',
  order: ['thornwick', 'hollow', 'coldharrow', 'ravenmoor']
};

/* service names per module (defaults by service ID applied in campaign.js) */
M.SERVICES = {
  thornwick: {
    inn: 'The Sleepy Hen', shop: 'Hesk\'s General Goods', temple: 'Shrine of the Dawn',
    hall: 'Elder Maddoc\'s Longhouse', training: 'Sergeant Brask\'s Yard'
  },
  hollow: {
    inn: 'The Drowsy Lantern', shop: 'Ironhand Outfitters', temple: 'Temple of the Dawn',
    hall: 'Town Hall', training: 'Training Hall', tavern: 'The Gilded Tankard', apothecary: 'The Gilded Mortar'
  },
  coldharrow: {
    inn: 'The Frostmere Inn', shop: 'Dunmore\'s Forge', temple: 'Chapel of St. Brannoc',
    hall: 'Thane Bergen\'s Hall', tavern: 'The Rattler\'s Rest', training: 'Bergen\'s Drills'
  },
  ravenmoor: {
    inn: 'The Ravel Barracks', shop: 'The Fort Armory', temple: 'Chapel of the North',
    hall: 'Commander Ysolde\'s Hall'
  }
};
})();
