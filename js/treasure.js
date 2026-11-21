/* Emberfall — treasure.js
 * Enchanted item catalogue (+134 definitions -> 260 total before
 * adventure generation), wearable-effect helpers, weighted treasure
 * tables and the seeded roll: Treasure.roll(rng, characterLevel, kind)
 * -> {gold, items}. Spell scrolls and charge counts resolve dynamically
 * (scroll:<id>, <id>#n) and are not separate definitions.
 *
 * Tier = clamp(ceil(level/4), 1, 5). Category weights:
 * potions 20, scrolls 15, rings 5, devices 5, misc 15, armor/shields 15,
 * swords 11, other weapons 14. Deeper favors newer tiers. Coin scale
 * ~25 x level^1.45 x rand(0.6-1.4), x1 chest / x2 cache / x6 hoard,
 * rounded to 5 gp. Caches carry magic; hoards carry multiple magic
 * rolls (up to one tier higher) plus potions and valuables.
 */
'use strict';
(function () {
const T = window.T = window.Treasure = {};
const D = window.D;
const R = window.R;

/* ---------------- catalogue builder ---------------- */
function ti(id, f) {
  const it = Object.assign({ id: id, name: f.name, price: f.price || 50, wt: f.wt || 1 }, f);
  it.n = it.name; it.t = it.type;
  D.ITEMS[id] = it;
  return id;
}
/* weapon: copies family stats from the base weapon */
function tw(id, fam, ench, f) {
  const b = D.ITEMS[fam];
  return ti(id, Object.assign({
    name: f.name || (b.name + ' +' + ench), type: 'w',
    price: f.price || b.price * (10 * ench),
    fam: fam, hands: b.hands, dmg: b.dmg,
    dmgL: b.dmgL || b.dmg, dmgS: b.dmgS || b.dmg, speed: b.speed,
    ench: ench, silver: !!(b.silver || f.silver)
  }, f, { name: f.name || (b.name + ' +' + ench) }));
}
function ta(id, fam, ench, f) {
  const b = D.ITEMS[fam];
  return ti(id, Object.assign({
    name: f.name || b.name, type: 'a',
    price: f.price || b.price * (10 * ench),
    fam: fam, armorAC: (b.armorAC != null ? b.armorAC : 10) - ench,
    light: b.light, ench: ench
  }, f, { name: f.name || b.name }));
}
function ts(id, fam, ench, f) {
  const b = D.ITEMS[fam];
  return ti(id, Object.assign({
    name: f.name || b.name, type: 's',
    price: f.price || b.price * (10 * ench),
    fam: fam, armorAC: 1, ench: ench
  }, f, { name: f.name || b.name }));
}
function tr(id, f) { return ti(id, Object.assign({ name: f.name || id, type: 'r' }, f)); }
function td(id, f) { return ti(id, Object.assign({ name: f.name || id, type: 'd', uses: 6 }, f)); }
function tm(id, f) { return ti(id, Object.assign({ name: f.name || id, type: 'v' }, f)); }
function tp(id, f) { return ti(id, Object.assign({ name: f.name || id, type: 'p' }, f)); }

/* ================= SWORDS (18) ================= */
tw('sword_plus1', 'longsword', 1, { tier: 1, cat: 'sword' });
tw('dagger_plus1', 'dagger', 1, { tier: 1, cat: 'sword', thrown: '1d3' });
tw('shortsword_plus1', 'shortsword', 1, { tier: 1, cat: 'sword' });
tw('broadsword_plus1', 'broadsword', 1, { tier: 2, cat: 'sword' });
tw('dagger_plus2', 'dagger', 2, { tier: 2, cat: 'sword', thrown: '1d3' });
tw('scimitar_plus1', 'scimitar', 1, { tier: 2, cat: 'sword' });
tw('longsword_plus2', 'longsword', 2, { tier: 3, cat: 'sword' });
tw('shortsword_plus2', 'shortsword', 2, { tier: 3, cat: 'sword' });
tw('falchion_plus1', 'falchion', 1, { tier: 3, cat: 'sword' });
tw('broadsword_plus2', 'broadsword', 2, { tier: 5, cat: 'sword' });
tw('silver_dagger1', 'silver_dagger', 1, { name: 'Silver Dagger +1', tier: 3, cat: 'sword', thrown: '1d3', silver: true });
tw('silver_longsword1', 'silver_long', 1, { name: 'Silver Longsword +1', tier: 3, cat: 'sword', silver: true });
ti('rune_blade', { name: 'Rune Blade of the Deepcut', type: 'w', price: 900, fam: 'longsword', hands: 1, dmg: '1d8', dmgL: '1d8', dmgS: '1d6', speed: 3, ench: 1, silver: true, slay: ['gob', 'gi'], tier: 4, cat: 'sword', desc: 'Runed silver steel. It bites goblin-kind and the big-folk a full step harder.' });
ti('frost_blade', { name: 'Frost Blade', type: 'w', price: 1200, fam: 'longsword', hands: 1, dmg: '1d8', dmgL: '1d8', dmgS: '1d6', speed: 3, ench: 1, slay: ['und'], elem: 'cold', tier: 4, cat: 'sword', desc: 'Cold runs out of the edge. The dead flinch from it.' });
ti('ember_blade', { name: 'Ember Blade', type: 'w', price: 1200, fam: 'broadsword', hands: 1, dmg: '1d10', dmgL: '1d10', dmgS: '1d6', speed: 5, ench: 1, elem: 'fire', tier: 4, cat: 'sword', desc: 'The edge holds a coal that never goes out.' });
tw('twoh_sword_plus1', 'twoh_sword', 1, { tier: 4, cat: 'sword' });
tw('twoh_sword_plus2', 'twoh_sword', 2, { tier: 5, cat: 'sword' });
ti('dawn_sword', { name: 'Sword of the Dawn', type: 'w', price: 3000, fam: 'longsword', hands: 1, dmg: '1d8', dmgL: '1d8', dmgS: '1d6', speed: 3, ench: 2, silver: true, slay: ['und'], holy: true, tier: 5, cat: 'sword', desc: 'Forged for the vigil. The dead unmake in its light.' });

/* ================= OTHER WEAPONS (23) ================= */
tw('mace_plus1', 'mace', 1, { tier: 1, cat: 'weapon' });
tw('warhammer_plus1', 'warhammer', 1, { tier: 2, cat: 'weapon' });
tw('battleaxe_plus1', 'battleaxe', 1, { tier: 2, cat: 'weapon' });
tw('trident_plus1', 'trident', 1, { tier: 3, cat: 'weapon' });
tw('flail_plus1', 'flail', 1, { tier: 3, cat: 'weapon' });
tw('spear_plus1', 'spear', 1, { tier: 2, cat: 'weapon' });
tw('halberd_plus1', 'halberd', 1, { tier: 3, cat: 'weapon' });
tw('warhammer_plus2', 'warhammer', 2, { tier: 4, cat: 'weapon' });
tw('mattock_plus1', 'mattock', 1, { tier: 2, cat: 'weapon' });
tw('handaxe_plus1', 'handaxe', 1, { tier: 2, cat: 'weapon', thrown: '1d6' });
tw('glaive_plus1', 'glaive', 1, { tier: 3, cat: 'weapon' });
tw('morningstar_plus1', 'morningstar', 1, { tier: 3, cat: 'weapon' });
tw('flanged_mace1', 'flanged_mace', 1, { name: 'Flanged Mace +1', tier: 3, cat: 'weapon' });
tw('sickle_plus1', 'sickle', 1, { tier: 2, cat: 'weapon', thrown: '1d4' });
tw('partisan_plus1', 'partisan', 1, { tier: 4, cat: 'weapon' });
tw('twoh_axe_plus1', 'twoh_axe', 1, { tier: 4, cat: 'weapon' });
tw('silver_mace1', 'silver_mace', 1, { name: 'Silver Mace +1', tier: 3, cat: 'weapon', silver: true });
tw('silver_halberd1', 'silver_halberd', 1, { name: 'Silver Halberd +1', tier: 4, cat: 'weapon', silver: true });
tw('silver_spear1', 'spear', 1, { name: 'Silver Spear', tier: 3, cat: 'weapon', silver: true, ench: 0 });
tw('silver_warhammer1', 'silver_warhammer', 1, { name: 'Silver Warhammer +1', tier: 4, cat: 'weapon', silver: true });
ti('trollslayer', { name: 'Trollslayer', type: 'w', price: 2500, fam: 'twoh_hammer', hands: 2, dmg: '2d6', dmgL: '2d6', dmgS: '1d6', speed: 7, ench: 1, slay: ['tro'], tier: 4, cat: 'weapon', desc: 'A heavy head on a short haft. Trolls do not regenerate from it.' });
ti('bone_harpoon', { name: 'Bone Harpoon of the Marsh', type: 'w', price: 800, fam: 'spear', hands: 2, dmg: '1d6', dmgL: '1d8', dmgS: '1d4', speed: 4, ench: 1, slay: ['gi'], thrown: '1d6', tier: 3, cat: 'weapon', desc: 'Cut from the spine of something that swam here before the village. It holds giants.' });
ti('sun_hammer', { name: 'Sun Hammer', type: 'w', price: 4000, fam: 'warhammer', hands: 1, dmg: '1d8', dmgL: '1d8', dmgS: '1d6', speed: 5, ench: 2, silver: true, slay: ['und'], holy: true, tier: 5, cat: 'weapon', desc: 'It rings like a bell in the dark, and the dark steps back.' });

/* ================= ARMOR (17) ================= */
ta('studded1', 'studded', 1, { tier: 1, cat: 'armor' });
ta('chainmail1', 'chain', 1, { tier: 1, cat: 'armor' });
ta('scale1', 'scale', 1, { tier: 2, cat: 'armor' });
ta('chainmail2', 'chain', 2, { tier: 3, cat: 'armor' });
ta('splint1', 'splint', 1, { tier: 3, cat: 'armor' });
ta('plate1', 'plate', 1, { tier: 4, cat: 'armor' });
ta('leather1', 'leather', 1, { tier: 2, cat: 'armor' });
ta('studded2', 'studded', 2, { tier: 4, cat: 'armor' });
ta('elven_leather', 'leather', 1, { name: 'Elven Leather', tier: 3, cat: 'armor', light: true, dexKeep: true, desc: 'It never taxes the hand.' });
ta('dragon_scale', 'splint', 2, { name: 'Dragonscale Hauberk', tier: 5, cat: 'armor', light: true, desc: 'Scales the size of coins, laid in rows. It does not care about fire or frost.' });
ta('padded1', 'padded', 1, { tier: 1, cat: 'armor', light: true });
ta('dwarven_chain', 'chain', 1, { name: 'Dwarven Chain Mail', tier: 2, cat: 'armor', desc: 'Folded once, then folded again. Giants knock harder against it.' });
ta('elven_chain', 'chain', 1, { name: 'Elven Chain', tier: 3, cat: 'armor', light: true, dexKeep: true, desc: 'Chain that weighs like thread.' });
ta('splint2', 'splint', 2, { tier: 5, cat: 'armor' });
ta('scale2', 'scale', 2, { tier: 5, cat: 'armor' });
ta('leather2', 'leather', 2, { tier: 4, cat: 'armor', light: true });
ta('plate2', 'plate', 2, { tier: 5, cat: 'armor' });

/* ================= SHIELDS (7) ================= */
ts('shield1', 'kiteshield', 1, { tier: 1, cat: 'shield' });
ts('buckler1', 'buckler', 1, { tier: 2, cat: 'shield' });
ts('towershield1', 'towershield', 1, { tier: 4, cat: 'shield' });
ts('kiteshield2', 'kiteshield', 2, { tier: 4, cat: 'shield' });
ts('buckler2', 'buckler', 2, { tier: 5, cat: 'shield' });
ts('dwarven_shield', 'kiteshield', 1, { name: 'Dwarven Kite Shield', tier: 3, cat: 'shield', desc: 'A foot of folded steel. It has stopped things bigger than it.' });
ts('towershield2', 'towershield', 2, { tier: 5, cat: 'shield' });

/* ================= RINGS (7) ================= */
tr('ring_protection1', { name: 'Ring of Protection +1', price: 2000, br: 1, tier: 2, cat: 'ring', desc: 'The wearer is harder to hit by one.' });
tr('ring_protection2', { name: 'Ring of Protection +2', price: 5000, br: 2, tier: 4, cat: 'ring', desc: 'The wearer is harder to hit by two.' });
tr('ring_ac3', { name: 'Ring of Warding', price: 12000, br: 3, tier: 5, cat: 'ring', desc: 'Three steps of luck against the blade.' });
tr('ring_saves1', { name: 'Ring of Fortitude', price: 4000, saveAll: 1, tier: 3, cat: 'ring', desc: 'All saves one better.' });
tr('ring_free_act', { name: 'Ring of Freedom', price: 6000, freeAct: true, tier: 4, cat: 'ring', desc: 'Paralysis and binding slacken against the wearer.' });
tr('ring_holy', { name: 'Ring of the Vigil', price: 9000, saveSpell: 2, holy: true, tier: 5, cat: 'ring', desc: 'The Dawn keeps the wearer through the dark. Spell saves two better.' });
tr('ring_wisdom', { name: 'Ring of Clarity', price: 8000, saveSpell: 1, tier: 5, cat: 'ring', desc: 'The mind holds. Spell saves one better.' });

/* ================= DEVICES (8) ================= */
td('wand_light', { name: 'Wand of Everlight', price: 600, uses: 12, light: true, tier: 1, cat: 'device', desc: 'A steady white light from the head. It never smokes.' });
td('wand_fire', { name: 'Wand of Fire', price: 1200, uses: 8, cast: 'burning_hands', tier: 2, cat: 'device', desc: 'A tongue of flame from the tip.' });
td('wand_sleep', { name: 'Wand of Sleep', price: 1500, uses: 8, cast: 'sleep', tier: 3, cat: 'device', desc: 'What it touches sleeps.' });
td('wand_hold', { name: 'Wand of Holding', price: 2200, uses: 6, cast: 'hold_person_c', tier: 4, cat: 'device', desc: 'What it touches stops.' });
td('wand_dawn', { name: 'Wand of the Dawn', price: 3000, uses: 6, cast: 'slow', holy: true, tier: 5, cat: 'device', desc: 'The dawn, kept in a stick. It slows what the dark sends.' });
td('staff_healing', { name: 'Staff of Healing', price: 2000, uses: 10, cast: 'clw', tier: 3, cat: 'device', desc: 'A staff that knits what the blade opened.' });
td('staff_wizardry', { name: 'Staff of Wizardry', price: 25000, uses: 0, wiz: true, tier: 5, cat: 'device', desc: 'It holds a second spell-book. A wizard\'s slots double while it is in the hand.' });
td('rod_resurrection', { name: 'Rod of Resurrection', price: 40000, uses: 3, cast: 'resurrection', tier: 5, cat: 'device', desc: 'It brings the last breath back. It does not argue about it.' });

/* ================= MISC (28) ================= */
tm('lamp_good', { name: 'Good Brass Lamp', price: 100, tier: 1, cat: 'misc', desc: 'Brass, bright, with a chimney that throws the light far.' });
tm('rope_climb', { name: 'Rope of Climbing (Silk)', price: 400, tier: 2, cat: 'misc', desc: 'Silk line, two hundred feet, that will not part on a fingerhold.' });
tm('lantern_silver', { name: 'Silver Lantern', price: 300, tier: 2, cat: 'misc', desc: 'A silver lantern with a glass door. The light inside does not gutter.' });
tm('key_silver', { name: 'Silver Key', price: 500, tier: 2, cat: 'misc', desc: 'A key of silver. It fits a door you have not found yet.' });
tm('map_old', { name: 'Old Map of the Valley', price: 700, tier: 3, cat: 'misc', desc: 'Ink on calfskin, creased at the roads. The deep places are marked in red.' });
tm('gem_onyx', { name: 'Onyx', price: 350, tier: 3, cat: 'misc', gem: true });
tm('idol_gold', { name: 'Gold Idol', price: 1500, tier: 4, cat: 'misc', desc: 'A small god in gold. The eyes follow you, politely.' });
tm('censer', { name: 'Silver Censer', price: 800, tier: 3, cat: 'misc', desc: 'A censer that keeps its heat. The smoke goes where the keeper wishes.' });
tm('crown_prince', { name: 'Crown of a Prince', price: 8000, tier: 5, cat: 'misc', desc: 'Gold and old stones. Whoever wore it is a story now.' });
tm('tapestry_royal', { name: 'Royal Tapestry', price: 1200, tier: 4, cat: 'misc', desc: 'A king\'s hunt in wool and thread. The king in it is still winning.' });
tm('astrolabe', { name: 'Astrolabe', price: 900, tier: 3, cat: 'misc', desc: 'Brass and silver. It finds the north, and the night, and the deep.' });
tm('spyglass', { name: 'Spyglass', price: 800, tier: 3, cat: 'misc', desc: 'It brings the far thing close, and the close thing far.' });
tm('musical_box', { name: 'Musical Box', price: 600, tier: 3, cat: 'misc', desc: 'A small tune on a loop. The tune is better than it has a right to be.' });
tm('chess_set', { name: 'Carved Chess Set', price: 400, tier: 2, cat: 'misc', desc: 'Ebony and ivory. The ivory pieces are a half-size taller than they should be.' });
tm('signet_ring_gold', { name: 'Gold Signet Ring', price: 1000, tier: 4, cat: 'misc', desc: 'A house mark in gold. The house has not stood for a hundred years.' });
tm('goblet_ruby', { name: 'Ruby Goblet', price: 1100, tier: 4, cat: 'misc', desc: 'A ruby the size of a thumb, cut to the rim.' });
tm('goblet_sapphire', { name: 'Sapphire Goblet', price: 1000, tier: 4, cat: 'misc', desc: 'Blue to the bottom. The bottom is deeper than it looks.' });
tm('goblet_emerald', { name: 'Emerald Goblet', price: 900, tier: 4, cat: 'misc', desc: 'Green as the valley in rain.' });
tm('plate_silver', { name: 'Silver Plate', price: 350, tier: 2, cat: 'misc', desc: 'A plate of silver, hall-stamped.' });
tm('ewer_gold', { name: 'Gold Ewer', price: 700, tier: 3, cat: 'misc', desc: 'An ewer of gold with a lion\'s head. The lion holds its mouth shut.' });
tm('mirror_ornate', { name: 'Ornate Mirror', price: 900, tier: 3, cat: 'misc', desc: 'A mirror in a gilded frame. The reflection is a half-step late.' });
tm('portrait_framed', { name: 'Framed Portrait', price: 500, tier: 2, cat: 'misc', desc: 'A stern face in a heavy frame. The face is stern in a way that asks to be left alone.' });
tm('clock_silver', { name: 'Silver Clock', price: 800, tier: 3, cat: 'misc', desc: 'It keeps time a half-minute fast, on purpose.' });
tm('chest_lock', { name: 'Chest Lock of Iron', price: 200, tier: 2, cat: 'misc', desc: 'A lock the size of a fist. The key was never found.' });
tm('banner_war', { name: 'War Banner', price: 600, tier: 3, cat: 'misc', desc: 'A house banner, darned at the corners. It has been in more fights than it can count.' });
tm('helmet_ornate', { name: 'Ornate Helmet', price: 1500, tier: 4, cat: 'misc', desc: 'A helm with a crest. The crest is a bird, and the bird is watching you.' });
tm('gauntlets_silver', { name: 'Silver Gauntlets', price: 900, tier: 3, cat: 'misc', desc: 'Gauntlets of silver and leather. The hand is steady in them.' });
tm('cape_fine', { name: 'Fine Cloak', price: 700, tier: 3, cat: 'misc', desc: 'A cloak of deep green, lined in silk. It does not catch on the dark.' });

/* ================= POTIONS (26) ================= */
tp('potion_night_vision', { name: 'Potion of Night Vision', price: 300, tier: 1, cat: 'potion', fx: { kind: 'light' }, desc: 'The dark goes thin for an hour.' });
tp('potion_brave', { name: 'Potion of Bravery', price: 400, tier: 2, cat: 'potion', fx: { kind: 'brave', min: 60 }, desc: 'The fear goes out of the arm for a short while.' });
tp('potion_strengthen', { name: 'Potion of Strength', price: 500, tier: 2, cat: 'potion', fx: { kind: 'stat', ab: 'STR', mod: 2, min: 120 }, desc: 'The shoulders open for two hours.' });
tp('potion_calm', { name: 'Potion of Calm', price: 300, tier: 2, cat: 'potion', fx: { kind: 'calm', min: 30 }, desc: 'The heart slows, and the hand stops shaking.' });
tp('potion_speed', { name: 'Potion of Speed', price: 1500, tier: 3, cat: 'potion', fx: { kind: 'haste', min: 30 }, desc: 'The feet forget the ground for a short while.' });
tp('potion_giant_strength', { name: 'Potion of Giant Strength', price: 3000, tier: 4, cat: 'potion', fx: { kind: 'stat', ab: 'STR', mod: 4, min: 60 }, desc: 'The strength of the big-folk, for a short while.' });
tp('potion_healing_greater', { name: 'Potion of Greater Healing', price: 1500, tier: 4, cat: 'potion', heal: '3d8', desc: 'Knits 3d8 wounds.' });
tp('potion_cure_poison_major', { name: 'Potion of Cure Poison (Major)', price: 800, tier: 3, cat: 'potion', fx: { kind: 'cure', afflict: 'poison' }, desc: 'The poison goes out of the blood.' });
tp('potion_invis_group', { name: 'Potion of Invisibility (Group)', price: 4000, tier: 4, cat: 'potion', fx: { kind: 'invis', min: 30, group: true }, desc: 'The company goes quiet, and out of sight, for a short while.' });
tp('potion_stoneskin2', { name: 'Potion of Stoneskin (Greater)', price: 3000, tier: 5, cat: 'potion', fx: { kind: 'stoneskin' }, desc: 'The skin goes to stone against the edge.' });
tp('potion_aid_2', { name: 'Potion of Aid (Greater)', price: 2000, tier: 4, cat: 'potion', fx: { kind: 'aid', mod: 2, min: 120 }, desc: 'The blow lands a step truer for two hours.' });
tp('potion_protection_evil', { name: 'Potion of Protection from Evil', price: 2500, tier: 3, cat: 'potion', fx: { kind: 'protectEvil', min: 120 }, desc: 'The evil things step back from the wearer.' });
tp('potion_ember', { name: 'Ember Tonic', price: 900, tier: 3, cat: 'potion', heal: '1d6', fx: { kind: 'warm', min: 60 }, desc: 'A little healing, and the cold goes out of the bones.' });
tp('potion_cold', { name: 'Potion of Winter', price: 900, tier: 3, cat: 'potion', fx: { kind: 'coldBlast', dmg: '2d6' }, desc: 'It breaks from the hand as a blast of deep cold.' });
tp('potion_regeneration', { name: 'Potion of Regeneration', price: 8000, tier: 5, cat: 'potion', fx: { kind: 'regen', hp: 1, min: 120 }, desc: 'The flesh knits while it is held in the blood.' });
tp('potion_heroism', { name: 'Potion of Heroism', price: 2500, tier: 4, cat: 'potion', fx: { kind: 'heroism', min: 120 }, desc: 'The fear goes out, and the arm stays true.' });
tp('potion_true_sight', { name: 'Potion of True Sight', price: 6000, tier: 5, cat: 'potion', fx: { kind: 'trueSight', min: 60 }, desc: 'The world shows itself as it is.' });
tp('potion_restoration_2', { name: 'Potion of Greater Restoration', price: 4000, tier: 5, cat: 'potion', fx: { kind: 'restoration' }, desc: 'It gives back what was taken: sense, strength, year.' });
tp('potion_ember_dawn', { name: 'Ember of the Dawn', price: 10000, tier: 5, cat: 'potion', heal: '2d8', fx: { kind: 'emberDawn', min: 120, holy: true }, desc: 'The first light of the vigil, in a vial. It heals, and the dark steps back.' });
tp('potion_wild', { name: 'Potion of the Wild', price: 2000, tier: 4, cat: 'potion', fx: { kind: 'wild', min: 60 }, desc: 'The valley goes into the drinker: steadier feet, keener ears, patient eyes.' });
tp('potion_ember_lesser', { name: 'Lesser Ember Tonic', price: 400, tier: 2, cat: 'potion', heal: '1d4', fx: { kind: 'warm', min: 30 }, desc: 'A small warmth, and a little mending.' });
tp('potion_clarity', { name: 'Potion of Clarity', price: 1800, tier: 3, cat: 'potion', fx: { kind: 'clarity', min: 120 }, desc: 'The mind holds its edge. Mental saves one better.' });
tp('potion_ward', { name: 'Potion of Warding', price: 2200, tier: 4, cat: 'potion', fx: { kind: 'ward', min: 120 }, desc: 'A step of luck against the mind\'s snares.' });
tp('potion_embers', { name: 'Vial of Embers', price: 1200, tier: 3, cat: 'potion', fx: { kind: 'emberBlast', dmg: '1d6' }, desc: 'It breaks from the hand as a small fire that does not burn the thrower.' });
tp('potion_dawn_light', { name: 'Potion of Dawnlight', price: 3500, tier: 5, cat: 'potion', fx: { kind: 'dawnLight', min: 60, holy: true }, desc: 'A light like first morning. The dead do not like it, and the dark does either.' });
tp('potion_treasure_find', { name: 'Potion of Finding', price: 1500, tier: 3, cat: 'potion', fx: { kind: 'detect', sense: 'treasure', min: 120 }, desc: 'The heart pulls toward what is kept in the deep.' });

/* ================= tables ================= */
function buildTables() {
  const t = { potion: [], scroll: [], ring: [], device: [], misc: [], armor: [], sword: [], weapon: [] };
  for (const id of Object.keys(D.ITEMS)) {
    const it = D.ITEMS[id];
    if (!it.tier || !it.cat) continue;
    if (t[it.cat]) t[it.cat].push({ id: id, tier: it.tier, w: it.tier * it.tier }); /* deeper favors newer tiers */
  }
  t.armor = t.armor.concat(t.shield || []);
  return t;
}
T.tables = buildTables();
T.CAT_W = { potion: 20, scroll: 15, ring: 5, device: 5, misc: 15, armor: 15, sword: 11, weapon: 14 };

function weightedPick(list, rng) {
  let tot = 0;
  for (const e of list) tot += e.w != null ? e.w : 1;
  let r = rng() * tot;
  for (const e of list) { r -= (e.w != null ? e.w : 1); if (r < 0) return e; }
  return list[list.length - 1];
}
function rollCategory(rng) {
  let tot = 0;
  for (const c of Object.keys(T.CAT_W)) tot += T.CAT_W[c];
  let r = rng() * tot;
  for (const c of Object.keys(T.CAT_W)) { r -= T.CAT_W[c]; if (r < 0) return c; }
  return 'misc';
}
/* one item id at or below tier (deeper tiers weighted more) */
function rollItem(rng, tier, cat) {
  if (cat === 'scroll') {
    const lvl = 1 + Math.floor(rng() * Math.min(5, tier + 1));
    const sps = Object.keys(D.SPELLS).filter(sid => D.SPELLS[sid].l === lvl);
    if (!sps.length) return 'scroll:clw';
    return 'scroll:' + sps[Math.floor(rng() * sps.length)];
  }
  const list = (T.tables[cat] || []).filter(e => e.tier <= tier);
  const pool = list.length ? list : T.tables.misc;
  return weightedPick(pool, rng).id;
}

T.tierFor = lvl => Math.max(1, Math.min(5, Math.ceil(lvl / 4)));
T.round5 = n => Math.round(n / 5) * 5;
T.gold = function (lvl, kind, rng) {
  const mult = kind === 'hoard' ? 6 : kind === 'cache' ? 2 : 1;
  return T.round5(25 * Math.pow(Math.max(1, lvl), 1.45) * (0.6 + rng() * 0.8) * mult);
};
/* seeded roll: same seed + level + kind -> same contents */
T.roll = function (rng, characterLevel, kind) {
  kind = kind || 'chest';
  const tier = T.tierFor(characterLevel);
  const gold = T.gold(characterLevel, kind, rng);
  const items = [];
  if (kind === 'chest') {
    const n = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) items.push(rollItem(rng, tier, rollCategory(rng)));
  } else if (kind === 'cache') {
    /* guarded/hidden: has magic */
    const magic = rollItem(rng, tier, weightedPick(Object.keys(T.CAT_W).map(c => ({ id: c, w: c === 'potion' ? 4 : T.CAT_W[c] })), rng));
    items.push(magic);
    const n = 1 + Math.floor(rng() * 2);
    for (let i = 0; i < n; i++) items.push(rollItem(rng, tier, rollCategory(rng)));
  } else if (kind === 'hoard') {
    /* boss hoard: multiple magic rolls, one tier higher, potions and valuables */
    const hTier = Math.min(5, tier + 1);
    const magicN = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < magicN; i++) items.push(rollItem(rng, hTier, rollCategory(rng)));
    items.push(rollItem(rng, tier, 'potion'));
    if (rng() < 0.7) items.push(rollItem(rng, tier, 'potion'));
    const valN = 1 + Math.floor(rng() * 2);
    for (let i = 0; i < valN; i++) items.push(rollItem(rng, hTier, 'misc'));
  }
  return { gold: gold, items: items };
};

/* ---------------- wearable effect helpers ---------------- */
T.worn = c => { const w = {}; for (const s of R.SLOTS) if (c.eq && c.eq[s]) w[s] = D.item(c.eq[s]); return w; };
T.acBonus = c => { let b = 0; const w = T.worn(c); for (const s of ['r1', 'r2', 'cloak', 'boots', 'belt', 'neck', 'charm', 'gloves']) if (w[s] && w[s].br) b += w[s].br; return b; };
T.saveBonus = function (c, idx) {
  let b = 0; const w = T.worn(c);
  for (const s of ['r1', 'r2', 'neck', 'charm', 'belt', 'cloak']) {
    const it = w[s]; if (!it) continue;
    if (it.saveAll) b += it.saveAll;
    if (idx === 4 && it.saveSpell) b += it.saveSpell;
  }
  return b;
};
T.freeAct = c => { const w = T.worn(c); return !!(w.r1 && w.r1.freeAct); };
T.wizardry = c => { const w = T.worn(c); return !!(w.r1 && w.r1.wiz); };
T.holy = c => { const w = T.worn(c); for (const s in w) if (w[s] && w[s].holy) return true; return false; };
T.slayBonus = function (c, target) {
  const w = T.worn(c); const wm = w.w;
  if (!wm || !wm.slay || !target || !target.tags) return 0;
  if (wm.slay.some(t => target.tags.includes(t))) return 3;
  return 0;
};

T.count = () => Object.keys(D.ITEMS).length;
})();
