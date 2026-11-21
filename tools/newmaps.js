/* ================= MAPS ================= */
/* grid: rows of characters. x right, y down, zero-based.
 * # wall; H/B building; 1-9 service doors (via locs); G gate; . floor; , grass;
 * T tree; F fountain (solid billboards); D door; L locked door; S secret door;
 * < up / > down stairs; a-z walkable event sites (live bands occupy their tile).
 * Authored grids are built programmatically so dimensions are exact. */
const MAPS = {};
D.MAPS = MAPS;
function map(id, f) { MAPS[id] = Object.assign({ id: id, name: f.name || id, wall: '#HBF', floor: '.,', outdoor: false, start: { x: 2, y: 2, dir: 0 } }, f); return id; }
D.map = map;

/* tiny grid canvas */
function Cnv(w, h, ch) {
  const g = Array.from({ length: h }, () => new Array(w).fill(ch));
  const c = {
    w, h, g,
    set(x, y, ch2) { if (x >= 0 && x < w && y >= 0 && y < h) g[y][x] = ch2; return c; },
    rect(x, y, w2, h2, ch2) { for (let j = y; j < y + h2; j++) for (let i = x; i < x + w2; i++) if (i >= 0 && i < w && j >= 0 && j < h) g[j][i] = ch2; return c; },
    rows() { return g.map(r => r.join('')); }
  };
  return c;
}
D.Cnv = Cnv;

/* ---------- E0: Thornwick (safe village, 19x15) ---------- */
(function () {
  const c = Cnv(19, 15, '#');
  c.rect(2, 1, 15, 3, '.');        /* north street/grass */
  c.rect(2, 4, 16, 1, '.');        /* north road */
  c.rect(2, 6, 15, 1, '.');        /* main road */
  c.rect(2, 10, 15, 1, '.');       /* south road */
  c.rect(2, 11, 15, 1, ',');       /* grass */
  c.rect(0, 12, 19, 1, ',');
  c.rect(0, 13, 19, 1, '.');       /* street by the gate */
  c.set(7, 1, 'T').set(11, 12, 'T').set(3, 12, 'T');
  /* brewery (north-west): door D, stair down > */
  c.set(4, 2, 'B').set(5, 2, 'B').set(6, 2, 'B');
  c.set(4, 3, 'B').set(5, 3, '>').set(6, 3, 'D');
  /* Elder's Longhouse (service 4) */
  c.set(13, 3, 'B').set(14, 3, 'B').set(15, 3, 'B');
  c.set(13, 4, 'B').set(14, 4, '.').set(15, 4, 'B');
  c.set(13, 5, 'B').set(14, 5, '4').set(15, 5, 'B');
  /* Sergeant Brask's Yard (service 5) */
  c.set(16, 1, 'B').set(17, 1, 'B').set(18, 1, 'B');
  c.set(16, 2, 'B').set(17, 2, '.').set(18, 2, 'B');
  c.set(16, 3, 'B').set(17, 3, '5').set(18, 3, 'B');
  /* south row: inn 1, shop 2, temple 3, house */
  c.set(3, 7, 'B').set(4, 7, 'B').set(5, 7, 'B');
  c.set(3, 8, 'B').set(4, 8, '.').set(5, 8, 'B');
  c.set(3, 9, 'B').set(4, 9, '1').set(5, 9, 'B');
  c.set(8, 7, 'B').set(9, 7, 'B').set(10, 7, 'B');
  c.set(8, 8, 'B').set(9, 8, '.').set(10, 8, 'B');
  c.set(8, 9, 'B').set(9, 9, '2').set(10, 9, 'B');
  c.set(12, 7, 'B').set(13, 7, 'B').set(14, 7, 'B');
  c.set(12, 8, 'B').set(13, 8, '.').set(14, 8, 'B');
  c.set(12, 9, 'B').set(13, 9, '3').set(14, 9, 'B');
  c.rect(16, 7, 3, 3, 'H');
  c.set(9, 14, 'G');
  map('thornwick', {
    name: 'Thornwick', safe: true, outdoor: true,
    start: { x: 9, y: 13, dir: 0 },
    grid: c.rows(),
    locs: {
      '1': { name: 'The Sleepy Hen', kind: 'inn' },
      '2': { name: 'Hesk\'s General Goods', kind: 'shop' },
      '3': { name: 'Shrine of the Dawn', kind: 'temple' },
      '4': { name: 'Elder Maddoc\'s Longhouse', kind: 'hall' },
      '5': { name: 'Sergeant Brask\'s Yard', kind: 'training' }
    },
    ev: {
      p: { text: 'A market cart sits abandoned by the well. A note is nailed to it: "Grain held at the brewery. The cellar has taken the lock."' },
      q: { text: 'Widow Marrow waves from her doorway. "That ring was my husband\'s. If the cellar gives it back, bring it to me."' }
    },
    stairs: { '6,3': { to: 'thorn_cellar', at: { x: 10, y: 2 }, dir: 2 } },
    exit: { '9,14': { to: 'thorn_wild', at: { x: 14, y: 16 } } },
    facades: { '1': 'inn', '2': 'shop', '3': 'temple', '4': 'hall', '5': 'yard' }
  });
})();

/* ---------- E0: Thornwick Cellar (21x15) ---------- */
(function () {
  const c = Cnv(21, 15, '#');
  c.set(10, 1, '<');
  c.rect(8, 2, 5, 3, '.');          /* entry hall */
  c.set(10, 3, 'a');
  c.rect(2, 4, 17, 1, '.');         /* cross street */
  c.set(4, 4, 'b');
  /* malt store (open front on the street) */
  c.rect(14, 2, 5, 1, 'H');
  c.set(14, 3, 'H').set(15, 3, 'i').set(16, 3, '.').set(17, 3, 'e').set(18, 3, 'H');
  /* south corridor */
  c.rect(9, 5, 3, 5, '.');
  /* kobold warren */
  c.rect(13, 6, 7, 4, '.');
  c.rect(13, 10, 7, 1, '.');
  c.set(11, 7, '.');                /* door from corridor */
  c.set(13, 6, 'h').set(15, 7, 'c').set(16, 8, 'd').set(18, 9, 'g');
  /* Skarrik's locked room */
  c.set(10, 10, 'L');
  c.rect(8, 11, 5, 3, '.');
  c.set(10, 12, 'f').set(11, 12, 'k');
  /* secret alcove */
  c.rect(1, 13, 3, 1, '.');
  c.set(2, 13, 'j');
  c.set(4, 13, 'S');
  c.rect(5, 13, 3, 1, '.');
  map('thorn_cellar', {
    name: 'The Thornwick Cellar',
    start: { x: 10, y: 2, dir: 2 },
    grid: c.rows(),
    keyItem: 'cellarKey', lockText: 'A brass lock, cold and honest. The kobolds carry the key.',
    ev: {
      a: { enc: { mons: [['giant_rat', '1d4']], text: 'The rats pour out of the grain sacks, yellow-eyed and hungry.' } },
      b: { enc: { mons: [['giant_centipede', 2]], text: 'The dark of the west passage is not empty. Centipedes move like quicksilver across the stone.' } },
      c: { enc: { mons: [['kobold', '1d4']], text: 'A kobold patrol rounds the corner with torches and bad attitudes.' } },
      d: { enc: { mons: [['kobold', '1d4+1']], text: 'Kobolds guard a pile of stolen brass. One of them has a key ring, and it knows what it is worth.', items: ['cellarKey'] } },
      e: { enc: { mons: [['giant_beetle', 3]], text: 'The malt store has gone soft with beetles the size of your fist.' } },
      f: { enc: { mons: [['skarrik', 1], ['kobold', 2]], text: 'Skarrik waits in the kettle-light, crown of nails catching the flame. "Village," he says, "pays."', gold: '2d6x10', quest: 'thorn_kobolds' } },
      g: { chest: { text: 'The kobold stash: a rope, some grain, and a handful of silver.', gold: '1d6x5', items: ['rations'] } },
      h: { chest: { text: 'A ring chest, and the lid is bristling with needles.', gold: 10, items: ['widowRing'], trap: 'needle' } },
      i: { chest: { text: 'The malt store chest, half eaten by beetles.', gold: '1d6x5', items: ['potion_clw'] } },
      j: { chest: { text: 'A secret cache, dry and old: a dagger that still holds an edge.', gold: 20, items: ['sword_plus1'] } },
      k: { chest: { text: 'Skarrik\'s kettle-chest, full of the cellar\'s taken things.', gold: '2d6x10', items: ['gem_pearl', 'torch'] } }
    },
    traps: { '9,5': { type: 'dart' }, '10,7': { type: 'pit' }, '5,13': { type: 'spear' } },
    stairs: { '10,1': { to: 'thornwick', at: { x: 6, y: 3 }, dir: 0 } },
    wander: [
      { chance: 0.05, mons: [['giant_rat', '1d4+1']], text: 'Rats skitter out of the dark.' },
      { chance: 0.04, mons: [['kobold', '1d3+1']], text: 'Kobold footfall on the far stair.' }
    ],
    locs: {}
  });
})();

/* ---------- E1: Emberfall (safe town, 25x21) ---------- */
(function () {
  const c = Cnv(25, 21, '#');
  c.rect(2, 1, 21, 5, ',');         /* north grass */
  c.set(4, 2, 'T').set(9, 4, 'T').set(13, 2, 'T').set(6, 5, 'T');
  c.rect(2, 9, 21, 1, '.');         /* main road */
  c.set(16, 9, 'a').set(17, 9, 'b');
  /* shop row (bottom wall y8 holds the service doors) */
  c.set(3, 6, 'B').set(4, 6, 'B').set(5, 6, 'B');
  c.set(3, 7, 'B').set(4, 7, '.').set(5, 7, 'B');
  c.set(3, 8, 'B').set(4, 8, '1').set(5, 8, 'B');
  c.set(8, 6, 'B').set(9, 6, 'B').set(10, 6, 'B');
  c.set(8, 7, 'B').set(9, 7, '.').set(10, 7, 'B');
  c.set(8, 8, 'B').set(9, 8, '2').set(10, 8, 'B');
  c.set(13, 6, 'B').set(14, 6, 'B').set(15, 6, 'B');
  c.set(13, 7, 'B').set(14, 7, '.').set(15, 7, 'B');
  c.set(13, 8, 'B').set(14, 8, '3').set(15, 8, 'B');
  c.set(18, 6, 'B').set(19, 6, 'B').set(20, 6, 'B');
  c.set(18, 7, 'B').set(19, 7, '.').set(20, 7, 'B');
  c.set(18, 8, 'B').set(19, 8, '7').set(20, 8, 'B');
  /* centre row */
  c.set(3, 11, 'B').set(4, 11, 'B').set(5, 11, 'B');
  c.set(3, 12, 'B').set(4, 12, '.').set(5, 12, 'B');
  c.set(3, 13, 'B').set(4, 13, '4').set(5, 13, 'B');
  c.set(8, 11, 'B').set(9, 11, 'B').set(10, 11, 'B');
  c.set(8, 12, 'B').set(9, 12, '.').set(10, 12, 'B');
  c.set(8, 13, 'B').set(9, 13, '5').set(10, 13, 'B');
  c.set(13, 11, 'B').set(14, 11, 'B').set(15, 11, 'B');
  c.set(13, 12, 'B').set(14, 12, '.').set(15, 12, 'B');
  c.set(13, 13, 'B').set(14, 13, '6').set(15, 13, 'B');
  c.rect(18, 11, 3, 3, 'H');
  c.rect(2, 14, 21, 1, '.');
  c.rect(2, 15, 21, 1, '.');        /* gate road */
  c.rect(2, 16, 21, 4, ',');
  c.set(5, 17, 'T').set(9, 16, 'T').set(15, 18, 'T').set(19, 17, 'T');
  /* ruined Abbey of the Dawn (north-east) */
  c.set(17, 2, 'B').set(22, 2, 'B');
  c.set(17, 3, 'B').set(18, 3, '.').set(19, 3, '>').set(20, 3, 'c').set(21, 3, '.').set(22, 3, 'B');
  c.set(17, 4, 'B').set(18, 4, 'D').set(19, 4, '.').set(20, 4, '.').set(21, 4, '.').set(22, 4, 'B');
  c.set(12, 20, 'G');
  map('town', {
    name: 'Emberfall', safe: true, outdoor: true,
    start: { x: 12, y: 15, dir: 0 },
    grid: c.rows(),
    locs: {
      '1': { name: 'The Drowsy Lantern', kind: 'inn' },
      '2': { name: 'Ironhand Outfitters', kind: 'shop' },
      '3': { name: 'Temple of the Dawn', kind: 'temple' },
      '4': { name: 'Town Hall', kind: 'hall' },
      '5': { name: 'Training Hall', kind: 'training' },
      '6': { name: 'The Gilded Tankard', kind: 'tavern' },
      '7': { name: 'The Gilded Mortar', kind: 'apothecary' }
    },
    ev: {
      a: { enc: { mons: [['brigand', 3]], text: 'The alley between the tankard and the wall is no alley. Brigands step out of the dark with a cutpurse\'s smile.', hidden: true } },
      b: { chest: { text: 'A hidden cache behind the barrel stack in the alley.', gold: '1d6x5', items: ['potion_clw'] } },
      c: { text: 'The Abbey of the Dawn stands in ruins. The undercroft stair is open, and it is breathing cold.' }
    },
    stairs: { '19,3': { to: 'crypt1', at: { x: 12, y: 2 }, dir: 2 } },
    exit: { '12,20': { to: 'wild', at: { x: 23, y: 26 } } },
    facades: { '1': 'inn', '2': 'shop', '3': 'temple', '4': 'hall', '5': 'training', '6': 'tavern', '7': 'apothecary' }
  });
})();

/* ---------- E1: Abbey Undercroft, Upper (25x21) ---------- */
(function () {
  const c = Cnv(25, 21, '#');
  c.set(12, 1, '<');
  c.rect(9, 2, 7, 4, '.');          /* great hall */
  c.set(12, 3, 'a').set(9, 4, 'g').set(15, 4, 'h');
  c.rect(3, 4, 6, 5, '.');          /* west wing */
  c.set(5, 6, 'b');
  c.rect(17, 3, 6, 3, '.');         /* east choir */
  c.set(19, 4, 'c').set(21, 3, 'i');
  c.rect(9, 6, 7, 4, '.');          /* centre */
  c.set(12, 8, 'm');
  c.rect(3, 9, 6, 1, '.');          /* west connector */
  c.set(16, 9, '.');                /* east connector */
  c.rect(3, 10, 6, 5, '.');         /* west cellar */
  c.set(5, 12, 'd').set(7, 11, 'k');
  c.rect(17, 10, 6, 5, '.');        /* east cellar */
  c.set(19, 12, 'j');
  c.rect(3, 15, 19, 5, '.');        /* south */
  c.set(18, 16, 'e').set(12, 17, 'f').set(10, 19, 'n').set(16, 15, 'p');
  c.set(21, 18, 'S').set(22, 18, 'l').set(23, 18, '.');
  c.set(4, 19, '>');
  map('crypt1', {
    name: 'Abbey Undercroft, Upper',
    start: { x: 12, y: 2, dir: 2 },
    grid: c.rows(),
    keyItem: 'ironKey', lockText: 'An iron lock the size of a bread loaf. Something big turns the key.',
    ev: {
      a: { enc: { mons: [['skeleton', 3]], text: 'The abbey dead keep their rounds. Skeletons rise from the pews as one.' } },
      b: { enc: { mons: [['cultist', 2]], text: 'Cultists wait in the west wing, hands over the Dawn\'s old symbols.' } },
      c: { enc: { mons: [['skeleton', 2], ['cultist', 1]], text: 'The guard at the stair: bone and ash, working together.' } },
      d: { enc: { mons: [['ogre', 1]], text: 'The ogre has made a den of the west cellar. It has also made a key of your shape.', items: ['ironKey'] } },
      e: { enc: { mons: [['zombie', 3]], text: 'The drowned choir. They walk the water line and the water line walks them.' } },
      f: { enc: { mons: [['wraith', 1]], text: 'A wraith coils out of the crypt\'s lowest dark. The cold arrives before it does.' } },
      g: { chest: { text: 'The offering chest, open and old.', gold: '2d6x5', items: ['gem_pearl'] } },
      h: { chest: { text: 'The ghoul shrine: a chest the ghouls keep clean.', gold: '1d6x5', items: ['potion_antivenom'], trap: 'needle' } },
      i: { chest: { text: 'The cultist coffer, hidden behind the altar.', gold: '2d6x5', items: ['cultSigil'] } },
      j: { chest: { text: 'The ogre\'s hoard: what it has eaten that could be kept.', gold: '2d6x10', items: ['potion_cure_serious'] } },
      k: { chest: { text: 'A warden\'s chest, still latched.', gold: '1d6x10', items: ['abbeyKey'] } },
      l: { chest: { text: 'A secret alcove behind the south wall: the abbey\'s last light.', gold: 30, items: ['dagger_plus1', 'lamp_good'] } },
      m: { text: 'The water line. Beyond it, the stone is black and the air is wrong.' },
      n: { text: 'A broken stair goes down. The dark below is not empty.' },
      p: { text: 'Graffiti on the black stone: "THE DAWN KEEPS WHAT IT OWES."' }
    },
    traps: { '12,6': { type: 'dart' }, '4,14': { type: 'pit' }, '20,16': { type: 'spear' } },
    stairs: {
      '12,1': { to: 'town', at: { x: 12, y: 2 }, dir: 0 },
      '4,19': { to: 'crypt2', at: { x: 4, y: 2 }, dir: 0 }
    }
  });
})();

/* ---------- E1: Abbey Undercroft, Lower (25x21) ---------- */
(function () {
  const c = Cnv(25, 21, '#');
  c.set(4, 1, '<');
  c.rect(3, 2, 6, 5, '.');          /* west hall */
  c.set(5, 4, 'c');
  c.rect(9, 3, 7, 4, '.');          /* reliquary hall */
  c.set(12, 4, 'r').set(10, 5, 'a').set(14, 3, 'b');
  c.rect(17, 3, 6, 4, '.');         /* east corridor */
  c.set(20, 4, 'd').set(21, 3, 's');
  c.rect(3, 8, 19, 7, '.');         /* middle */
  c.set(12, 10, 'e');
  c.rect(9, 15, 7, 1, '.');
  c.rect(3, 16, 19, 4, '.');        /* south / sanctum */
  c.set(12, 18, 'f').set(12, 16, 'i').set(4, 10, 'g').set(20, 10, 'h');
  map('crypt2', {
    name: 'Abbey Undercroft, Lower',
    start: { x: 4, y: 2, dir: 0 },
    grid: c.rows(),
    ev: {
      a: { enc: { mons: [['cultist', 3]], text: 'The circle\'s outer guard. They have been expecting the Dawn\'s debt.' } },
      b: { enc: { mons: [['skeleton', 4]], text: 'The abbey\'s last defenders, re-raised in the lower dark.' } },
      c: { enc: { mons: [['ghoul', 2]], text: 'The ghouls of the reliquary hall. They keep it clean. They keep what it keeps.' } },
      d: { enc: { mons: [['wraith', 1], ['cultist', 1]], text: 'A wraith and its keeper. The wraith is the elder.' } },
      e: { enc: { mons: [['redfang', 1]], text: 'Redfang, chieftain of the ash, rises from the cult\'s keeping. The vaults owe him, and he is here to collect.', quest: 'redfang' } },
      f: { enc: { mons: [['malvek', 1], ['cultist', 2]], text: 'Malvek the Ashen waits in the sanctum with his circle. "The Dawn," he says, "was a loan. I am the debt."', quest: 'malvek' } },
      r: { chest: { text: 'The reliquary coffer. Inside, still warm: the Dawn Reliquary.', items: ['dawnReliquary'], gold: 50, trap: 'needle' } },
      s: { chest: { text: 'The cult\'s deep chest, behind the wraith\'s wall.', gold: '2d6x10', items: ['potion_cure_critical', 'gem_sapphire'] } },
      g: { chest: { text: 'A reliquary side-chest, old and dry.', gold: '1d6x10', items: ['potion_haste'] } },
      h: { chest: { text: 'Redfang\'s tribute chest: what the cult paid him.', gold: '2d6x10', items: ['gem_ruby', 'potion_strength'] } },
      i: { chest: { text: 'The sanctum\'s inner chest, open and empty of everything but gold.', gold: '3d6x10' } }
    },
    traps: { '8,8': { type: 'dart' }, '16,12': { type: 'pit' }, '4,14': { type: 'blade' } },
    stairs: { '4,1': { to: 'crypt1', at: { x: 5, y: 19 }, dir: 0 } }
  });
})();

/* ---------- E1: Bloodmane Watchtower (19x15) ---------- */
(function () {
  const c = Cnv(19, 15, '#');
  c.rect(3, 10, 13, 4, '.');        /* ground floor */
  c.set(8, 12, 'a');
  c.rect(9, 5, 1, 5, '.');          /* stair shaft */
  c.rect(6, 1, 7, 5, '.');          /* top room */
  c.set(10, 2, 'c').set(8, 2, 'i').set(8, 4, 'h');
  c.rect(4, 5, 4, 4, '.');          /* west gallery */
  c.set(5, 7, 'b');
  c.rect(11, 5, 4, 4, '.');         /* east gallery */
  c.set(13, 7, 'g');
  c.rect(8, 5, 1, 4, '.');
  c.rect(10, 5, 1, 4, '.');
  c.set(9, 14, 'G');
  map('tower', {
    name: 'Bloodmane Watchtower',
    start: { x: 9, y: 12, dir: 0 },
    grid: c.rows(),
    ev: {
      a: { enc: { mons: [['gnoll', 3]], text: 'The tower\'s ground floor is full of gnolls and the smell of the pack. Tamsin Hask is kept up-stairs.' } },
      b: { enc: { mons: [['gnoll', 2]], text: 'Gnoll archers on the west gallery, bows already drawn.' } },
      c: { enc: { mons: [['packlord', 1], ['gnoll', 2]], text: 'The Bloodmane Packlord waits at the top of the tower with his mane and his patience. Tamsin Hask is chained behind him, and she is still breathing.', gold: '2d6x10', quest: 'gnolls', rescue: 'Tamsin Hask' } },
      g: { chest: { text: 'The pack\'s tribute chest: what the valley pays the tower.', gold: '2d6x10', items: ['gem_opal'] } },
      h: { chest: { text: 'A chest the packlord keeps for himself.', gold: '1d6x10', items: ['potion_cure_serious', 'silver_long'] } }
    },
    traps: { '9,9': { type: 'spear' }, '13,6': { type: 'dart' } },
    exit: { '9,14': { to: 'wild', at: { x: 34, y: 9 } } }
  });
})();

/* ---------- E1: The Emberwild (overland, 48x32) ---------- */
(function () {
  const c = Cnv(48, 32, '.');
  c.rect(0, 0, 48, 1, '^'); c.rect(0, 31, 48, 1, '^');
  c.rect(0, 0, 1, 32, '^'); c.rect(47, 0, 1, 32, '^');
  for (let y = 1; y < 31; y++) c.set(10, y, '~');
  c.set(10, 14, '+');
  for (let y = 6; y <= 26; y++) c.set(23, y, '=');
  for (let x = 24; x <= 41; x++) c.set(x, 23, '=');
  for (let x = 24; x <= 33; x++) c.set(x, 8, '=');
  for (let x = 11; x <= 22; x++) c.set(x, 10, '=');
  for (let x = 12; x <= 22; x++) c.set(x, 14, '='); /* road through fen east of bridge */
  for (let x = 2; x < 9; x++) for (let y = 12; y < 24; y++) if (c.g[y][x] === '.') c.set(x, y, 'T');
  for (let x = 36; x < 46; x++) for (let y = 2; y < 8; y++) if (c.g[y][x] === '.') c.set(x, y, 'T');
  for (let x = 40; x < 46; x++) for (let y = 24; y < 30; y++) if (c.g[y][x] === '.') c.set(x, y, 'n');
  for (let x = 34; x < 40; x++) for (let y = 24; y < 30; y++) if (c.g[y][x] === '.') c.set(x, y, '%');
  c.set(23, 27, 'A').set(12, 10, 'B').set(34, 8, 'C').set(40, 16, 'D');
  c.set(8, 20, 'E').set(24, 6, 'F').set(10, 28, 'G').set(30, 22, 'H');
  c.set(38, 28, 'I').set(42, 6, 'J');
  map('wild', {
    name: 'The Emberwild', overland: true,
    start: { x: 23, y: 26 },
    grid: c.rows(),
    sites: {
      A: { name: 'Emberfall', icon: 'village', home: 'town' },
      B: { name: 'Millbrook', icon: 'hamlet', hamlet: true, text: 'A mill and two houses at the river bend. The miller trades in flour and bad news.' },
      C: { name: 'Bloodmane Watchtower', icon: 'tower', enter: 'tower', at: { x: 9, y: 12 }, text: 'A watchtower on the ridge, its flag the color of a bad decision.' },
      D: { name: 'Brigand Camp', icon: 'camp', fight: { mons: [['brigand', 5]], text: 'The brigands of the Emberwild, in their camp of stolen things.', gold: '2d6x10', items: ['potion_clw', 'gem_pearl'] } },
      E: { name: 'Hermit\'s Cottage', icon: 'cottage', heal: true, text: 'A small cottage at the edge of the wood. The hermit heals once in seven days, and asks no questions after the first.' },
      F: { name: 'Dawnstones', icon: 'holy', holy: true, text: 'Seven stones of pale gold, standing in a line. The Dawn kept its vigil here before it had an abbey. A safe place to rest.' },
      G: { name: 'Spider Hollow', icon: 'den', fight: { mons: [['giant_spider', 2]], text: 'A hollow of web and bone. The spider that lives here has been here a long time.', gold: '1d6x10', items: ['potion_antivenom'] } },
      H: { name: 'Hask Farmstead', icon: 'farm', hamlet: true, text: 'The Hask farm. The fields are half-planted and the well is full. Tamsin Hask was taken from here. The bloodmane flag was seen on the ridge the morning of it.' },
      I: { name: 'Drowned Chapel', icon: 'chapel', fight: { mons: [['wraith', 1], ['zombie', 2]], text: 'A chapel under the water line. The dead of the flood keep their services still.', gold: '1d6x5', items: ['potion_clw'] } },
      J: { name: 'Greywater Pass', icon: 'pass', text: 'The pass over the Greywater ridge. A landmark, not a road: the way through is the way around.' }
    },
    enc: {
      plains: [['brigand', '1d4+1'], ['greywolf', '1d4']],
      forest: [['giant_spider', '1d3'], ['greywolf', '1d3+1'], ['gnoll', '1d4']],
      road: [['brigand', '1d4']],
      hills: [['greywolf', '1d4'], ['gnoll', '1d3+1']],
      swamp: [['swamp_adder', '1d3+1'], ['zombie', '1d3']]
    },
    encRate: 1.0,
    travellers: [
      { name: 'Millbrook Miller', text: 'The wolf-pack is up on the ridge. Three of them, and they know the tower road.' },
      { name: 'Dawn Pilgrim', text: 'The Dawnstones hold at night. You can rest there without the dark coming for you.' },
      { name: 'Road Cart Driver', text: 'The pass is clear, if you call a mudslide clear. The way through is the way around.' },
      { name: 'Hask Sister', text: 'Tamsin was taken on the ridge road. The bloodmane flag was on the tower the morning after.' }
    ],
    rumors: [
      'The tower has a new flag, and the flag is the color of the bloodmane line.',
      'The Drowned Chapel is open again, and the water is the color of the dead.',
      'The hermit at the wood\'s edge has a light in the window. The light is the color of the Dawn.',
      'The brigands have moved camp to the river bend, and the river bend is on the way to Emberfall.'
    ]
  });
})();
