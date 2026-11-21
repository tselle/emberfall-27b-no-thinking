/* Emberfall — data.js
 * Base registries: SPELLS (74), ITEMS (base catalogue), SHOPS, MONSTERS
 * (40 saga entries), MAPS (Thornwick + the Emberfall Vaults + the Emberwild
 * overland), QUESTS (13 authored), rumors, item lookup, six pre-generated
 * heroes.
 */
'use strict';
(function () {
const D = window.D = {};

/* ================= SPELLS (74: 40 wizard, 34 priest) =================
 * tgt: enemy | ally | self | party | area | cone | line | explore
 * range in 10-ft squares (0 = touch). r = radius. len = minutes (0 = instant
 * or until dispelled/condition ends). */
const SP = [
/* ---- wizard level 1 ---- */
['magic_missile', 'Magic Missile', 'M', 1, 'enemy', 3, { auto: true, desc: 'Missiles of force that always hit: 1d4+1 each. Shield negates.' }],
['sleep', 'Sleep', 'M', 1, 'area', 6, { r: 3, noUndead: true, desc: 'Sends the weakest creatures (2d4 HD pool) into a deep sleep. Allies can be affected; damage wakes them.' }],
['burning_hands', 'Burning Hands', 'M', 1, 'cone', 3, { desc: 'A cone of flame: 1d6 per caster level (max 5d6).' }],
['armor', 'Armor', 'M', 1, 'ally', 0, { camp: true, desc: 'Raises armor class to AC 6, held until the recipient takes 8+caster level points of damage.' }],
['shield', 'Shield', 'M', 1, 'self', 0, { camp: true, desc: 'A flickering barrier that negates Magic Missile and similar force bolts.' }],
['color_spray', 'Color Spray', 'M', 1, 'cone', 3, { hd: '4d4', desc: 'A searing spray blinds and stuns creatures worth 4d4 HD (save for half effect).' }],
['spook', 'Spook', 'M', 1, 'enemy', 6, { hd: '1d4+1', desc: 'Terrifying apparitions; 1d4+1 HD of creatures may save or flee in terror.' }],
/* ---- wizard level 2 ---- */
['stinking_cloud', 'Stinking Cloud', 'M', 2, 'area', 12, { r: 4, dur: 10, saveEach: true, desc: 'A 10-minute cloud of filth. Repeat saves; victims stagger away as it persists on squares.' }],
['mirror_image', 'Mirror Image', 'M', 2, 'self', 0, { camp: true, desc: 'Illusory copies (1d6+1) that intercept attacks aimed at you.' }],
['strength', 'Strength', 'M', 2, 'self', 0, { camp: true, len: 60, desc: 'Brawny vigor: 1 hour per level. STR-related bonuses improve.' }],
['knock', 'Knock', 'M', 2, 'explore', 0, { explore: true, desc: 'Locked doors and secret doors open as if unlocked. A locked-door option, not a combat attack.' }],
['web', 'Web', 'M', 2, 'area', 12, { r: 4, hd: '12', desc: 'Sticky webs entangle up to 12 HD of creatures (save). Entangled foes cannot move until freed.' }],
['acid_arrow', 'Acid Arrow', 'M', 2, 'enemy', 12, { desc: 'A bolt of green acid: 1d6 acid damage.' }],
['invisibility', 'Invisibility', 'M', 2, 'ally', 0, { len: 30, desc: 'The target becomes unseen and silent for 30 minutes. Attacking reveals it.' }],
['blindness', 'Blindness', 'M', 2, 'enemy', 6, { len: '2d4', desc: 'Searing light: the target saves or is blinded for 2d4 minutes.' }],
['scare', 'Scare', 'M', 2, 'enemy', 6, { hd: '5', save: true, desc: 'Whispered terrors: a creature worth 5 HD saves or is scared (cannot attack) for 1d4+1 minutes.' }],
/* ---- wizard level 3 ---- */
['fireball', 'Fireball', 'M', 3, 'area', 12, { r: 2.3, dmg: '10d6', save: true, half: true, friendly: true, desc: 'A roaring sphere of fire: up to 10d6, save for half. Includes allies.' }],
['lightning_bolt', 'Lightning Bolt', 'M', 3, 'line', 12, { dmg: '8d6', save: true, desc: 'A bolt of lightning follows a line until obstructed: 8d6, save for half.' }],
['haste', 'Haste', 'M', 3, 'party', 0, { hd: '5', dur: 10, desc: 'Up to 5 HD of allies move and attack at double speed for 10 minutes. Slow can undo it.' }],
['hold_person_m', 'Hold Person', 'M', 3, 'enemy', 9, { human: true, save: true, len: '1d4+1', desc: 'A humanoid saves or is held in place for 1d4+1 minutes.' }],
['slow', 'Slow', 'M', 3, 'area', 9, { r: 4, hd: '12', save: true, dur: 10, desc: 'Time warps around up to 12 HD of enemies: save or move/attack at half speed. Undoes Haste.' }],
['dispel_m', 'Dispel Magic', 'M', 3, 'enemy', 9, { dispel: true, desc: 'Dispels magic of level 3 or lower affecting the target.' }],
['vampiric_touch', 'Vampiric Touch', 'M', 3, 'enemy', 0, { touch: true, dmg: '2d6', heal: true, desc: 'Touch: 2d6 damage; the caster recovers half the damage dealt.' }],
/* ---- wizard level 4 ---- */
['ice_storm', 'Ice Storm', 'M', 4, 'area', 12, { r: 4, dmg: '3d8', save: true, half: true, friendly: true, desc: 'Hailstones fall: 3d8, save for half, includes allies.' }],
['stoneskin', 'Stoneskin', 'M', 4, 'ally', 0, { camp: true, desc: 'Skin hardens to stone; the next 5 melee blows deal no damage.' }],
['fear', 'Fear', 'M', 4, 'enemy', 9, { save: true, len: '2d4', desc: 'The target saves or is too terrified to fight for 2d4 minutes.' }],
/* ---- wizard level 5 ---- */
['cone_of_cold', 'Cone of Cold', 'M', 5, 'cone', 6, { dmg: '8d6', save: true, half: true, desc: 'A cone of freezing wind: 8d6, save for half.' }],
['hold_monster', 'Hold Monster', 'M', 5, 'enemy', 9, { save: true, len: '2d4', desc: 'The target saves or is held in place for 2d4 minutes.' }],
['cloudkill', 'Cloudkill', 'M', 5, 'area', 9, { r: 4, dur: 10, save: true, dmg: '4d6', desc: 'A toxic green cloud: 4d6 poison damage, save for half; persists on squares for 10 minutes.' }],
/* ---- wizard level 6 ---- */
['chain_lightning', 'Chain Lightning', 'M', 6, 'line', 12, { dmg: '7d6', save: true, half: true, chain: 6, desc: 'Lightning leaps to the nearest other foe within 6 squares: 7d6, save for half.' }],
['disintegrate', 'Disintegrate', 'M', 6, 'enemy', 12, { dmg: '5d6', save: true, destroy: true, desc: 'The target saves or is unmade entirely; otherwise 5d6 damage.' }],
['flesh_to_stone', 'Flesh to Stone', 'M', 6, 'enemy', 9, { save: true, desc: 'The target saves or turns to stone until dispelled.' }],
['death_spell', 'Death Spell', 'M', 6, 'enemy', 9, { hd: 5, desc: 'Destroys up to 5 HD of creatures (10 at caster level 10+) who cannot save.' }],
/* ---- wizard level 7 ---- */
['dbf', 'Delayed Blast Fireball', 'M', 7, 'area', 12, { r: 3, dmg: '15d6', save: true, half: true, friendly: true, delay: true, desc: 'A detonating sphere: 15d6, save for half, includes allies.' }],
['finger_of_death', 'Finger of Death', 'M', 7, 'enemy', 9, { dmg: '5d6+10', desc: 'A ray of enervation: 5d6+10 damage, no save.' }],
['power_word_stun', 'Power Word: Stun', 'M', 7, 'enemy', 9, { hpMax: 15, len: '1d4', desc: 'A target with 15 or fewer hit points is stunned for 1d4 minutes.' }],
/* ---- wizard level 8 ---- */
['incendiary_cloud', 'Incendiary Cloud', 'M', 8, 'area', 12, { r: 4, dur: 10, dmg: '8d6', save: true, half: true, friendly: true, desc: 'A burning cloud drifts for 10 minutes: 8d6 fire, save for half.' }],
['power_word_blind', 'Power Word: Blind', 'M', 8, 'enemy', 9, { hpMax: 30, len: '1d4', desc: 'A target with 30 or fewer hit points is blinded for 1d4+1 hours.' }],
/* ---- wizard level 9 ---- */
['meteor_swarm', 'Meteor Swarm', 'M', 9, 'area', 12, { r: 3, dmg: '15d6', save: true, half: true, friendly: true, desc: 'Falling stars: 15d6, save for half, includes allies.' }],
['power_word_kill', 'Power Word: Kill', 'M', 9, 'enemy', 9, { hpMax: 50, desc: 'A target with 50 or fewer hit points dies instantly.' }],
/* ---- priest level 1 ---- */
['clw', 'Cure Light Wounds', 'C', 1, 'ally', 0, { camp: true, heal: '1d8', corpse: true, desc: 'Restores 1d8 hit points. Usable on the field, at camp, and on sheets.' }],
['bless', 'Bless', 'C', 1, 'party', 0, { dur: 10, desc: 'The party gains +1 to hit for 10 minutes.' }],
['pfe', 'Protection From Evil', 'C', 1, 'self', 0, { camp: true, len: 60, tag: 'und', desc: 'Wards the wearer against undead and evil for 1 hour; +1 vs their attacks. A protection scroll wards the whole party.' }],
['command', 'Command', 'C', 1, 'enemy', 6, { hd: '1d4', human: true, save: true, desc: 'A humanoid of 1d4 HD saves or obeys a one-word command (drop, flee, or stay).' }],
['cause_lw', 'Cause Light Wounds', 'C', 1, 'enemy', 9, { heal: '1d8', desc: 'Inflicts 1d8 hit points of harm.' }],
['magical_stone', 'Magical Stone', 'C', 1, 'enemy', 6, { save: true, len: '1d4', desc: 'The target saves or is slowed toward stone for 1d4 minutes (cannot move).' }],
/* ---- priest level 2 ---- */
['hold_person_c', 'Hold Person', 'C', 2, 'enemy', 9, { human: true, save: true, len: '1d4+1', desc: 'A humanoid saves or is held in place for 1d4+1 minutes.' }],
['aid', 'Aid', 'C', 2, 'ally', 0, { dur: 10, desc: 'The target gains +1 to hit and +1 AC for 10 minutes.' }],
['slow_poison', 'Slow Poison', 'C', 2, 'ally', 0, { camp: true, desc: 'Prevents new poison from taking effect for 1 hour.' }],
['silence', 'Silence, 15′ Radius', 'C', 2, 'area', 6, { r: 1.5, len: '1d4', desc: 'No spell may be cast or heard within radius 1.5 for 1d4+1 minutes.' }],
['resist_fc', 'Resist Fire/Cold', 'C', 2, 'ally', 0, { camp: true, len: 60, desc: 'Fire and cold damage is halved for 1 hour.' }],
/* ---- priest level 3 ---- */
['prayer', 'Prayer', 'C', 3, 'party', 0, { dur: 10, desc: 'The party gains +1 to hit, AC and saves for 10 minutes.' }],
['dispel_p', 'Dispel Magic', 'C', 3, 'enemy', 9, { dispel: true, desc: 'Dispels magic of level 3 or lower affecting the target.' }],
['remove_paralysis', 'Remove Paralysis', 'C', 3, 'ally', 0, { camp: true, desc: 'Frees an ally from paralysis and restores its ability to act.' }],
['magical_vestment', 'Magical Vestment', 'C', 3, 'ally', 0, { dur: 10, desc: 'Robes shimmer: the target gains +2 AC for 10 minutes.' }],
['cause_blindness', 'Cause Blindness', 'C', 4, 'enemy', 9, { save: true, len: '2d4', desc: 'The target saves or is blinded for 2d4 minutes.' }],
['cure_blindness', 'Cure Blindness', 'C', 4, 'ally', 0, { camp: true, desc: 'Restores sight to a blinded ally.' }],
/* ---- priest level 4 ---- */
['cure_sw', 'Cure Serious Wounds', 'C', 4, 'ally', 0, { camp: true, heal: '2d8+1', corpse: true, desc: 'Restores 2d8+1 hit points.' }],
['neutralize', 'Neutralize Poison', 'C', 4, 'ally', 0, { camp: true, desc: 'Cures poison in an ally. Usable out of battle on sheets.' }],
['cause_sw', 'Cause Serious Wounds', 'C', 4, 'enemy', 9, { heal: '2d8+1', desc: 'Inflicts 2d8+1 hit points of harm.' }],
['free_action', 'Free Action', 'C', 4, 'ally', 0, { camp: true, desc: 'Frees an ally from web, hold or paralysis; grants +1 to saves against such effects.' }],
['pfe10', 'Protection From Evil, 10′ Radius', 'C', 4, 'party', 0, { camp: true, len: 60, tag: 'und', desc: 'Wards all adjacent allies against undead and evil for 1 hour.' }],
/* ---- priest level 5 ---- */
['cure_cw', 'Cure Critical Wounds', 'C', 5, 'ally', 0, { camp: true, heal: '3d8+3', corpse: true, desc: 'Restores 3d8+3 hit points.' }],
['flame_strike', 'Flame Strike', 'C', 5, 'area', 9, { r: 2, dmg: '4d6', save: true, half: true, friendly: true, desc: 'A column of flame: 4d6 fire, save for half, includes allies.' }],
['cause_cw', 'Cause Critical Wounds', 'C', 5, 'enemy', 9, { heal: '3d8+3', desc: 'Inflicts 3d8+3 hit points of harm.' }],
['slay_living', 'Slay Living', 'C', 5, 'enemy', 9, { hd: '3d4', desc: 'Destroys up to 3d4 HD of living creatures who cannot save.' }],
['dispel_evil', 'Dispel Evil', 'C', 5, 'enemy', 9, { save: true, desc: 'Evil creatures save or are banished from the battle.' }],
['raise_dead', 'Raise Dead', 'C', 5, 'ally', 0, { camp: true, corpse: true, sheet: true, desc: 'Raises a dead companion at 1 HP with -1 CON; the spirit must survive a CON check. Failure leaves it beyond ordinary recall.' }],
/* ---- priest level 6 ---- */
['heal', 'Heal', 'C', 6, 'ally', 0, { camp: true, heal: 'all', desc: 'Restores all but 1d4 missing hit points and cures afflictions (poison, sleep, hold).' }],
['blade_barrier', 'Blade Barrier', 'C', 6, 'area', 9, { r: 3, dmg: '4d6', save: true, half: true, friendly: true, dur: 10, desc: 'Spinning blades fill the area: 4d6, save for half; persists for 10 minutes.' }],
['harm', 'Harm', 'C', 6, 'enemy', 9, { heal: '1d8+10', desc: 'A touch of death: 1d8+10 hit points of harm.' }],
/* ---- priest level 7 ---- */
['holy_word', 'Holy Word', 'C', 7, 'party', 0, { hd: 5, desc: 'A spoken word destroys creatures of 5 HD or fewer (10 at caster level 15+); larger foes may save.' }],
['destruction', 'Destruction', 'C', 7, 'area', 9, { r: 3, dmg: '5d6', save: true, half: true, friendly: true, desc: 'The ground collapses: 5d6, save for half, includes allies.' }],
['resurrection', 'Resurrection', 'C', 7, 'ally', 0, { camp: true, corpse: true, sheet: true, desc: 'Restores even a lost companion at full hit points. Usable out of battle on sheets.' }],
];
D.SPELLS = {};
D.SPELL_ORDER = [];
for (const [id, n, c, l, tgt, range, x] of SP) {
  D.SPELLS[id] = Object.assign({ id: id, n: n, c: c, l: l, tgt: tgt, range: range }, x);
  D.SPELL_ORDER.push(id);
}
D.priestList = function (lvl, maxLvl) {
  const out = [];
  for (const id of D.SPELL_ORDER) { const s = D.SPELLS[id]; if (s.c === 'C' && s.l === lvl && s.l <= maxLvl) out.push(id); }
  return out;
};
D.wizardList = function (lvl) { return D.SPELL_ORDER.filter(id => D.SPELLS[id].c === 'M' && D.SPELLS[id].l === lvl); };

/* ================= ITEMS ================= */
const ITEMS = {};
D.ITEMS = ITEMS;
function def(id, f) { ITEMS[id] = Object.assign({ id: id, name: f.n || id, type: f.t || 'v', price: f.price != null ? f.price : 10 }, f); return id; }
D.def = def;

/* ---- mundane melee weapons (type w). dmg vs S/M; dmgL vs L/H/G; speed (init) ---- */
def('longsword', { n: 'Long Sword', t: 'w', fam: 'longsword', hands: 1, dmg: '1d8', dmgL: '1d8', dmgS: '1d6', speed: 3, price: 15 });
def('shortsword', { n: 'Short Sword', t: 'w', fam: 'shortsword', hands: 1, dmg: '1d6', dmgL: '1d6', dmgS: '1d4', speed: 3, price: 10 });
def('broadsword', { n: 'Broadsword', t: 'w', fam: 'broadsword', hands: 1, dmg: '1d10', dmgL: '1d10', dmgS: '1d6', speed: 5, price: 25 });
def('dagger', { n: 'Dagger', t: 'w', fam: 'dagger', hands: 1, dmg: '1d3', dmgL: '1d3', dmgS: '1d3-1', speed: 3, price: 5, thrown: '1d3' });
def('mace', { n: 'Mace', t: 'w', fam: 'mace', hands: 1, dmg: '1d6', dmgL: '1d6', dmgS: '1d4', speed: 3, price: 10, blunt: true });
def('warhammer', { n: 'War Hammer', t: 'w', fam: 'warhammer', hands: 1, dmg: '1d8', dmgL: '1d8', dmgS: '1d6', speed: 5, price: 20, blunt: true });
def('battleaxe', { n: 'Battle Axe', t: 'w', fam: 'battleaxe', hands: 1, dmg: '1d7', dmgL: '1d8', dmgS: '1d4', speed: 5, price: 20 });
def('handaxe', { n: 'Hand Axe', t: 'w', fam: 'battleaxe', hands: 1, dmg: '1d6', dmgL: '1d6', dmgS: '1d4', speed: 3, price: 5, thrown: '1d6' });
def('mattock', { n: 'Mattock', t: 'w', fam: 'warhammer', hands: 1, dmg: '1d6', dmgL: '1d6', dmgS: '1d4', speed: 5, price: 5 });
def('flail', { n: 'Flail', t: 'w', fam: 'flail', hands: 1, dmg: '1d6', dmgL: '1d6', dmgS: '1d4', speed: 4, price: 10 });
def('trident', { n: 'Trident', t: 'w', fam: 'trident', hands: 1, dmg: '1d6', dmgL: '1d8', dmgS: '1d4', speed: 4, price: 10 });
def('spear', { n: 'Spear', t: 'w', fam: 'spear', hands: 1, dmg: '1d6', dmgL: '1d8', dmgS: '1d4', speed: 4, price: 5 });
def('glaive', { n: 'Glaive', t: 'w', fam: 'spear', hands: 2, dmg: '1d8', dmgL: '1d10', dmgS: '1d6', speed: 6, price: 15 });
def('partisan', { n: 'Partisan', t: 'w', fam: 'spear', hands: 2, dmg: '1d8', dmgL: '1d10', dmgS: '1d6', speed: 6, price: 15 });
def('war_pick', { n: 'War Pick', t: 'w', fam: 'battleaxe', hands: 2, dmg: '1d8', dmgL: '1d10', dmgS: '1d6', speed: 6, price: 15 });
def('halberd', { n: 'Halberd', t: 'w', fam: 'halberd', hands: 2, dmg: '1d10', dmgL: '1d10', dmgS: '1d6', speed: 7, price: 20 });
def('bardiche', { n: 'Bardiche', t: 'w', fam: 'halberd', hands: 2, dmg: '1d10', dmgL: '1d10', dmgS: '1d6', speed: 7, price: 20 });
def('twoh_sword', { n: 'Two-handed Sword', t: 'w', fam: 'twoh_sword', hands: 2, dmg: '1d10', dmgL: '1d10', dmgS: '1d8', speed: 7, price: 30 });
def('twoh_axe', { n: 'Two-handed Axe', t: 'w', fam: 'twoh_axe', hands: 2, dmg: '1d10', dmgL: '1d10', dmgS: '1d8', speed: 7, price: 30 });
def('twoh_hammer', { n: 'Two-handed Hammer', t: 'w', fam: 'twoh_hammer', hands: 2, dmg: '2d6', dmgL: '2d6', dmgS: '1d6', speed: 7, price: 30, blunt: true });
def('twoh_mace', { n: 'Two-handed Mace', t: 'w', fam: 'twoh_mace', hands: 2, dmg: '2d6', dmgL: '2d6', dmgS: '1d6', speed: 7, price: 30, blunt: true });
def('staff', { n: 'Staff', t: 'w', fam: 'staff', hands: 1, dmg: '1d6', dmgL: '1d6', dmgS: '1d4', speed: 3, price: 5, blunt: true });
def('sickle', { n: 'Sickle', t: 'w', fam: 'shortsword', hands: 1, dmg: '1d6', dmgS: '1d3', speed: 3, price: 5, thrown: '1d4' });
def('scimitar', { n: 'Scimitar', t: 'w', fam: 'shortsword', hands: 1, dmg: '1d6', dmgL: '1d6', dmgS: '1d4', speed: 3, price: 10 });
def('falchion', { n: 'Falchion', t: 'w', fam: 'broadsword', hands: 1, dmg: '1d9', dmgL: '1d10', dmgS: '1d6', speed: 4, price: 15 });
def('flanged_mace', { n: 'Flanged Mace', t: 'w', fam: 'mace', hands: 1, dmg: '1d6', dmgL: '1d6', dmgS: '1d4', speed: 4, price: 15, blunt: true });
def('morningstar', { n: 'Morning Star', t: 'w', fam: 'mace', hands: 1, dmg: '1d6', dmgL: '1d6', dmgS: '1d4', speed: 4, price: 15, blunt: true });

/* ---- silver weapons (vs monsters immune to ordinary steel) ---- */
def('silver_long', { n: 'Silver Longsword', t: 'w', fam: 'longsword', hands: 1, dmg: '1d8', dmgS: '1d6', speed: 3, price: 100, silver: true });
def('silver_short', { n: 'Silver Shortsword', t: 'w', fam: 'shortsword', hands: 1, dmg: '1d6', dmgS: '1d4', speed: 3, price: 80, silver: true });
def('silver_broad', { n: 'Silver Broadsword', t: 'w', fam: 'broadsword', hands: 1, dmg: '1d10', dmgS: '1d6', speed: 5, price: 150, silver: true });
def('silver_dagger', { n: 'Silver Dagger', t: 'w', fam: 'dagger', hands: 1, dmg: '1d3', dmgS: '1d3-1', speed: 3, price: 40, silver: true, thrown: '1d3' });
def('silver_mace', { n: 'Silver Mace', t: 'w', fam: 'mace', hands: 1, dmg: '1d6', dmgS: '1d4', speed: 3, price: 80, silver: true, blunt: true });
def('silver_axe', { n: 'Silver Battle Axe', t: 'w', fam: 'battleaxe', hands: 1, dmg: '1d7', dmgL: '1d8', dmgS: '1d4', speed: 5, price: 120, silver: true });
def('silver_warhammer', { n: 'Silver War Hammer', t: 'w', fam: 'warhammer', hands: 1, dmg: '1d8', dmgS: '1d6', speed: 5, price: 130, silver: true, blunt: true });
def('silver_2h', { n: 'Silver Two-handed Sword', t: 'w', fam: 'twoh_sword', hands: 2, dmg: '1d10', dmgS: '1d8', speed: 7, price: 250, silver: true });
def('silver_halberd', { n: 'Silver Halberd', t: 'w', fam: 'halberd', hands: 2, dmg: '1d10', dmgS: '1d6', speed: 7, price: 200, silver: true });
def('silver_crossbow', { n: 'Silver Crossbow', t: 'r', fam: 'crossbow', hands: 1, dmg: '1d8', dmgS: '1d6', speed: 5, band: 2, price: 150, silver: true, ammo: 'silver bolts' });

/* ---- missile weapons (type r); band = range in 30-ft units ---- */
def('sling', { n: 'Sling', t: 'r', fam: 'sling', hands: 1, dmg: '1d4', dmgS: '1d4', speed: 3, band: 1, price: 2, ammo: 'slingshot stones' });
def('longbow', { n: 'Long Bow', t: 'r', fam: 'longbow', hands: 1, dmg: '1d6', dmgS: '1d4', speed: 4, band: 2, price: 15, ammo: 'arrows' });
def('shortbow', { n: 'Short Bow', t: 'r', fam: 'shortbow', hands: 1, dmg: '1d6', dmgS: '1d4', speed: 3, band: 1, price: 10, ammo: 'arrows' });
def('crossbow', { n: 'Heavy Crossbow', t: 'r', fam: 'crossbow', hands: 1, dmg: '1d8', dmgS: '1d6', speed: 5, band: 2, price: 25, ammo: 'bolts' });
def('lightcrossbow', { n: 'Light Crossbow', t: 'r', fam: 'lightcrossbow', hands: 1, dmg: '1d6', dmgS: '1d4', speed: 4, band: 2, price: 15, ammo: 'bolts' });
def('hevicrossbow', { n: 'Heavy Crossbow (2hd)', t: 'r', fam: 'hevicrossbow', hands: 1, dmg: '1d10', dmgS: '1d6', speed: 5, band: 3, price: 40, ammo: 'bolts' });
def('darts', { n: 'Darts', t: 'r', fam: 'darts', hands: 0, dmg: '1d2', dmgS: '1d2', speed: 3, band: 1, price: 5, ammo: 'darts' });
def('javelin', { n: 'Javelin', t: 'r', fam: 'javelin', hands: 0, dmg: '1d6', dmgS: '1d4', speed: 4, band: 1, price: 5, ammo: 'javelins' });
def('net', { n: 'Net', t: 'r', fam: 'net', hands: 1, dmg: '0', dmgS: '0', speed: 6, band: 1, price: 20, ammo: 'none', snares: true });

/* ---- armor (descending AC value replaces 10) ---- */
def('padded', { n: 'Padded Armor', t: 'a', fam: 'padded', armorAC: 8, price: 10, light: true });
def('leather', { n: 'Leather Armor', t: 'a', fam: 'leather', armorAC: 7, price: 20, light: true });
def('studded', { n: 'Studded Leather', t: 'a', fam: 'studded', armorAC: 6, price: 30, light: true });
def('chain', { n: 'Chain Mail', t: 'a', fam: 'chain', armorAC: 6, price: 75 });
def('scale', { n: 'Scale Mail', t: 'a', fam: 'scale', armorAC: 5, price: 100 });
def('splint', { n: 'Splint Mail', t: 'a', fam: 'splint', armorAC: 4, price: 200 });
def('plate', { n: 'Plate Mail', t: 'a', fam: 'plate', armorAC: 3, price: 400 });

/* ---- shields ---- */
def('buckler', { n: 'Buckler', t: 's', armorAC: 1, price: 5 });
def('kiteshield', { n: 'Kite Shield', t: 's', armorAC: 1, price: 10 });
def('shield', { n: 'Shield', t: 's', armorAC: 1, price: 7, fam: 'kite' });
def('towershield', { n: 'Tower Shield', t: 's', armorAC: 1, price: 25 });

/* ---- potions ---- */
def('potion_clw', { n: 'Potion of Cure Light Wounds', t: 'p', price: 15, heal: '1d8', desc: 'Restores 1d8 hit points.' });
def('potion_cure_serious', { n: 'Potion of Cure Serious Wounds', t: 'p', price: 60, heal: '2d8+1', desc: 'Restores 2d8+1 hit points.' });
def('potion_cure_critical', { n: 'Potion of Cure Critical Wounds', t: 'p', price: 150, heal: '3d8+3', desc: 'Restores 3d8+3 hit points.' });
def('potion_heal', { n: 'Potion of Heal', t: 'p', price: 500, heal: 'all', desc: 'Restores all but 1d4 missing hit points; cures afflictions.' });
def('potion_antivenom', { n: 'Potion of Antivenom', t: 'p', price: 25, cures: 'poison', desc: 'Cures poison.' });
def('potion_antidote', { n: 'Potion of Antidote', t: 'p', price: 25, cures: 'poison', desc: 'Cures poison and delayed venom.' });
def('potion_invis', { n: 'Potion of Invisibility', t: 'p', price: 100, spell: 'invisibility', desc: 'Drinks as Invisibility for 30 minutes.' });
def('potion_haste', { n: 'Potion of Haste', t: 'p', price: 150, spell: 'haste', selfOnly: true, desc: 'Drinks as Haste for 10 minutes.' });
def('potion_strength', { n: 'Potion of Strength', t: 'p', price: 120, spell: 'strength', selfOnly: true, desc: 'Drinks as Strength.' });
def('potion_restoration', { n: 'Potion of Full Restoration', t: 'p', price: 400, cures: 'all', desc: 'Cures all afflictions and restores 1d8 hit points.' });
def('potion_aid', { n: 'Potion of Bless', t: 'p', price: 40, spell: 'bless', desc: 'Drinks as Bless for 10 minutes.' });
def('potion_protection', { n: 'Potion of Protection From Evil', t: 'p', price: 60, spell: 'pfe', desc: 'Drinks as Protection From Evil for 1 hour.' });
def('potion_stoneskin', { n: 'Potion of Stoneskin', t: 'p', price: 200, spell: 'stoneskin', selfOnly: true, desc: 'Drinks as Stoneskin.' });
def('potion_fire_res', { n: 'Potion of Fire Resistance', t: 'p', price: 80, spell: 'resist_fc', desc: 'Drinks as Resist Fire/Cold for 1 hour.' });
def('potion_cold_res', { n: 'Potion of Cold Resistance', t: 'p', price: 80, spell: 'resist_fc', desc: 'Drinks as Resist Fire/Cold for 1 hour.' });
def('potion_blind_cure', { n: 'Potion of Cure Blindness', t: 'p', price: 120, cures: 'blind', desc: 'Restores sight.' });
def('potion_cure_paralysis', { n: 'Potion of Cure Paralysis', t: 'p', price: 120, cures: 'paralysis', desc: 'Frees from paralysis.' });
def('potion_cure_stone', { n: 'Potion of Cure Petrification', t: 'p', price: 200, cures: 'stone', desc: 'Reverses petrification.' });

/* ---- valuables ---- */
def('gem_diamond', { n: 'Diamond', t: 'v', price: 400, gem: true });
def('gem_emerald', { n: 'Emerald', t: 'v', price: 250, gem: true });
def('gem_ruby', { n: 'Ruby', t: 'v', price: 250, gem: true });
def('gem_sapphire', { n: 'Sapphire', t: 'v', price: 250, gem: true });
def('gem_pearl', { n: 'Pearl', t: 'v', price: 100, gem: true });
def('gem_opal', { n: 'Fire Opal', t: 'v', price: 150, gem: true });
def('gem_topaz', { n: 'Golden Topaz', t: 'v', price: 150, gem: true });
def('gem_amethyst', { n: 'Amethyst', t: 'v', price: 100, gem: true });
def('gem_garnet', { n: 'Garnet', t: 'v', price: 80, gem: true });
def('gem_jade', { n: 'Jade Carving', t: 'v', price: 120, gem: true });
def('gold_ingot', { n: 'Gold Ingot', t: 'v', price: 500, gem: true });
def('silver_ingot', { n: 'Silver Ingot', t: 'v', price: 50, gem: true });
def('gold_chalice', { n: 'Gold Chalice', t: 'v', price: 300, gem: true });
def('old_coin', { n: 'Ancient Gold Coin', t: 'v', price: 50, gem: true });
def('tapestry', { n: 'Woven Tapestry', t: 'v', price: 200, gem: true });
def('statue', { n: 'Ivory Figurine', t: 'v', price: 150, gem: true });
def('silver_cup', { n: 'Engraved Silver Cup', t: 'v', price: 100, gem: true });
def('ivory_figurine', { n: 'Tortured Ivory Idol', t: 'v', price: 180, gem: true });
def('silver_frame', { n: 'Silver Picture Frame', t: 'v', price: 90, gem: true });
def('ancient_tome', { n: 'Ancient Tome (blank)', t: 'v', price: 130, gem: true });
def('gold_chain', { n: 'Heavy Gold Chain', t: 'v', price: 350, gem: true });
def('jeweled_dagger', { n: 'Jeweled Dagger (ornament)', t: 'v', price: 220, gem: true });
def('crown_jewels', { n: 'Loose Crown Jewels', t: 'v', price: 1200, gem: true });
def('family_heirloom', { n: 'Family Heirloom', t: 'v', price: 300, gem: true });

/* ---- mundane gear ---- */
def('torch', { n: 'Torch', t: 'v', price: 1, desc: 'An hour of light.' });
def('rations', { n: 'Rations (day)', t: 'v', price: 1, desc: 'A day of food.' });
def('rope', { n: 'Hemp Rope (50 ft)', t: 'v', price: 2, desc: 'Sturdy rope.' });
def('pitons', { n: 'Pitons', t: 'v', price: 4, desc: 'For climbing.' });
def('lantern', { n: 'Lantern', t: 'v', price: 8, desc: 'Portable light.' });
def('oil', { n: 'Flask of Oil', t: 'v', price: 1, desc: 'Lantern fuel.' });
def('water_skin', { n: 'Water Skin', t: 'v', price: 2, desc: 'A full waterskin.' });
def('compass', { n: 'Brass Compass', t: 'v', price: 10, desc: 'Points north.' });
def('lockpick_set', { n: 'Lockpicks', t: 'v', price: 6, desc: 'A thief would find these useful.' });
def('grappling_hook', { n: 'Grappling Hook', t: 'v', price: 6, desc: 'Hooked and hauled.' });

/* ---- authored quest/unique items ---- */
def('cellarKey', { n: 'Brass Cellar Key', t: 'q', price: 0, q: true, desc: 'A heavy brass key. It fits the cellar door at Thornwick.' });
def('ironKey', { n: "Ogre's Iron Key", t: 'q', price: 0, q: true, desc: 'A thick iron key, reek of ogre on it. Opens the sealed descent in the undercroft.' });
def('dawnReliquary', { n: 'Dawn Reliquary', t: 'q', price: 0, q: true, desc: 'A reliquary of pale gold, still warm. The Abbey of the Dawn was built to house it.' });
def('kingsSeal', { n: "The Iron King's Seal", t: 'q', price: 0, q: true, desc: 'A black iron seal of a crowned skull. It pulses once, cold.' });
def('kingsBlade', { n: "The King's Enchanted Blade", t: 'w', fam: 'longsword', hands: 1, dmg: '1d8', dmgS: '1d6', speed: 3, price: 0, q: true, ench: 2, desc: 'A barrow-blade that still bites as it was forged: +2, and it glows near the dead.' });
def('tallyBook', { n: "Foreman's Tally Book", t: 'q', price: 0, q: true, desc: 'A ledger of marks and blood. Dunmore wants it back.' });
def('patrolBadge', { n: 'Patrol Badge', t: 'q', price: 0, q: true, countable: true, desc: 'A steel badge of Fort Ravel. Twelve were lost with the patrol.' });
def('widowRing', { n: "Widow Marrow's Ring", t: 'q', price: 0, q: true, desc: 'A plain band with a blue stone. Widow Marrow will know what it means.' });
def('witchSigil', { n: 'Witch Sigil', t: 'q', price: 0, q: true, desc: 'A raven-headed sigil of green glass. It is warm, and it listens.' });
def('abbeyKey', { n: 'Abbey Warden Key', t: 'q', price: 0, q: true, desc: 'A bone-handled key from the warden\'s study.' });
def('cultSigil', { n: 'Ashen Sigil', t: 'q', price: 0, q: true, desc: 'A disc of grey ash that will not wash clean. The cult marked it.' });
def('trollHide', { n: 'Troll Pelt', t: 'q', price: 0, q: true, desc: 'A patch of green-grey hide, still weeping where it was cut.' });
def('houndFang', { n: 'Hellhound Fang', t: 'q', price: 0, q: true, desc: 'A fang that is warm on cold nights and smells of brimstone.' });
def('dawnstone', { n: 'Dawnstone Shard', t: 'q', price: 0, q: true, desc: 'A splinter of the Dawnstones that holds a little morning in it.' });
def('ironCrown', { n: 'Iron Crown', t: 'q', price: 0, q: true, desc: 'A crown of barrow-iron. It is heavier than it looks.' });
def('gargoyle_heart', { n: 'Gargoyle Heart', t: 'q', price: 0, q: true, desc: 'A stone heart that still beats, slowly.' });
def('witch_cauldron', { n: "Vharra's Cauldron", t: 'q', price: 0, q: true, desc: 'An iron cauldron with raven feathers worked into the rim.' });
def('old_king_crown', { n: 'Crown of the Old Kings', t: 'q', price: 0, q: true, desc: 'A mossy crown from the Cairn of the Old Kings.' });

/* ================= SHOP BASE LISTS ================= */
/* kind: 'armory' | 'apothecary' | 'general'; band 1..5 sets which tiers are
 * in stock (band t sells mundane + silver + tiers up to t-1; recent two tiers
 * for arms; rare <4 weight, books and Rod of Resurrection excluded). */
D.SHOPS = {
  armory: {
    kind: 'armory',
    mundane: ['longsword', 'shortsword', 'broadsword', 'dagger', 'mace', 'warhammer', 'battleaxe', 'flail', 'trident', 'spear', 'halberd', 'twoh_sword', 'twoh_mace', 'staff', 'sickle', 'scimitar',
      'sling', 'longbow', 'shortbow', 'crossbow', 'lightcrossbow', 'darts', 'javelin',
      'leather', 'studded', 'chain', 'scale', 'splint', 'plate', 'buckler', 'kiteshield', 'towershield'],
    silver: ['silver_long', 'silver_mace', 'silver_axe', 'silver_crossbow', 'silver_short', 'silver_dagger']
  },
  apothecary: {
    kind: 'apothecary',
    potions: ['potion_clw', 'potion_cure_serious', 'potion_cure_critical', 'potion_heal', 'potion_antivenom', 'potion_antidote', 'potion_invis', 'potion_haste', 'potion_strength', 'potion_restoration', 'potion_aid', 'potion_protection', 'potion_stoneskin', 'potion_fire_res', 'potion_cold_res', 'potion_blind_cure', 'potion_cure_paralysis', 'potion_cure_stone'],
    scrollsTop: [1, 3, 5, 7, 9], /* top spell level per band */
    devices: []
  },
  general: {
    kind: 'general',
    stock: ['longsword', 'shortsword', 'dagger', 'mace', 'battleaxe', 'staff', 'sling', 'shortbow', 'darts',
      'leather', 'studded', 'chain', 'buckler', 'kiteshield',
      'potion_clw', 'potion_antivenom', 'torch', 'rations', 'rope', 'lantern', 'oil']
  }
};

/* ================= MONSTERS (40 saga entries) =================
 * hd like "4.3" = 4d8+3; "0.5" = 1d4; "0.9" = 1d8-1. */
const MONS = {};
D.MONSTERS = MONS;
function mon(id, f) { MONS[id] = Object.assign({ id: id, name: f.name, hp: f.hp || '1d8', ac: f.ac != null ? f.ac : 12, mv: f.mv != null ? f.mv : 12,
  thac0: f.thac0 != null ? f.thac0 : 20, atk: f.atk || ['1d6'], size: f.size || 'M', ml: f.ml != null ? f.ml : 12, xp: f.xp != null ? f.xp : 10,
  gold: f.gold != null ? f.gold : '0', tags: f.tags || [], fig: f.fig || 'humanoid' }, f); return id; }
D.mon = mon;

/* --- E0: Thornwick cellar & vale --- */
mon('giant_rat', { name: 'Giant Rat', hd: '0.5', hp: '1d4', ac: 12, mv: 12, atk: ['1d2'], size: 'S', xp: 3, tags: ['beast', 'vermin'], fig: 'rat', lore: 'A rat the size of a dog, whiskers stiff with cellar grain.' });
mon('giant_centipede', { name: 'Giant Centipede', hd: '1', hp: '1d6', ac: 14, mv: 15, atk: ['1d4'], size: 'S', xp: 10, tags: ['beast', 'vermin', 'poison'], fig: 'centipede', venom: { dmg: '1d4', delay: [16, 30], save: true } });
mon('kobold', { name: 'Kobold', hd: '1.2', hp: '1d6+2', ac: 13, mv: 12, atk: ['1d4'], size: 'S', xp: 15, gold: '1d6', tags: ['humanoid', 'gob', 'small'], fig: 'humanoid', lore: 'A fire-eyed pit spawn with a taste for brass and grudges.' });
mon('giant_beetle', { name: 'Giant Malt Beetle', hd: '0.7', hp: '2d4', ac: 13, mv: 9, atk: ['1d3'], size: 'M', xp: 7, tags: ['beast', 'vermin'], fig: 'insect', lore: 'It gnawed through the sack-stitching and kept the grain that was left.' });
mon('greywolf', { name: 'Grey Wolf', hd: '2', hp: '2d6', ac: 13, mv: 15, atk: ['1d6+1'], size: 'M', xp: 20, tags: ['beast', 'wolf'], fig: 'wolf', lore: 'Vale wolves hunt in patient pairs and remember kindness as well as cruelty.' });
mon('skarrik', { name: 'Skarrik, the Kettle-crowned', hd: '4', hp: '4d6', ac: 14, mv: 12, atk: ['1d8', '1d4'], size: 'M', ml: 15, xp: 90, gold: '2d6x10', tags: ['humanoid', 'gob', 'leader'], leader: true, fig: 'humanoid', lore: 'The kobolds of the Thornwick cellar chose him king the day he drowned a cellar cat in the mash and wore its crown of nails. He drinks from a kettle and thinks the village is his.' });

/* --- E1: the Hollow Vaults & Emberwild --- */
mon('brigand', { name: 'Brigand', hd: '2', hp: '2d6', ac: 13, mv: 12, atk: ['1d8'], size: 'M', xp: 25, gold: '2d6x5', tags: ['humanoid', 'ev'], fig: 'humanoid', lore: 'Road rustlers in borrowed mail. The Emberwild makes more of them every season.' });
mon('cultist', { name: 'Dawn Cultist', hd: '2', hp: '2d6', ac: 13, mv: 12, atk: ['1d6'], size: 'M', xp: 30, tags: ['humanoid', 'ev', 'cult'], fig: 'humanoid', lore: 'They buried the Dawn\'s abbey and keep its reliquary in the dark, waiting for Malvek\'s circle to be whole.' });
mon('skeleton', { name: 'Skeleton', hd: '1', hp: '1d6', ac: 14, mv: 12, atk: ['1d4'], size: 'M', xp: 15, tags: ['undead', 'und', 'blunt'], fig: 'skeleton', immune: ['poison', 'sleep', 'hold'], halfBlunt: true, lore: 'The dead of the abbey do their errands still, in the dark of the undercroft.' });
mon('ghoul', { name: 'Ghoul', hd: '3', hp: '3d6', ac: 14, mv: 9, atk: ['1d6'], size: 'M', xp: 45, tags: ['undead', 'und', 'paralysis'], fig: 'ghoul', paralyze: true, lore: 'Grave-cold hands that keep what they take.' });
mon('wraith', { name: 'Wraith', hd: '5', hp: '5d6', ac: 15, mv: 15, atk: ['1d8'], size: 'M', xp: 120, tags: ['undead', 'und', 'drain'], fig: 'wraith', drain: 1, lore: 'A shape of grief that burns without fire. Its touch steals levels as it steals heat.' });
mon('zombie', { name: 'Zombie', hd: '1', hp: '1d6', ac: 15, mv: 6, atk: ['1d6'], size: 'M', xp: 15, tags: ['undead', 'und'], fig: 'zombie', lore: 'It walks because the ground told it to.' });
mon('ogre', { name: 'Ogre', hd: '5.5', hp: '5d8+5', ac: 14, mv: 9, atk: ['2d6'], size: 'L', xp: 100, gold: '1d6x10', tags: ['humanoid', 'gi', 'big', 'ev'], fig: 'ogre', lore: 'A mountain of a cook who lost the kitchen and kept the appetite.' });
mon('giant_spider', { name: 'Giant Spider', hd: '4', hp: '4d6', ac: 14, mv: 12, atk: ['1d6'], size: 'M', xp: 60, tags: ['beast', 'vermin', 'poison'], fig: 'spider', venom: { dmg: '1d6', delay: [16, 30], save: true }, lore: 'The Hollow\'s tenant. Its web strung the chapel beams like a curtain.' });
mon('gnoll', { name: 'Gnoll', hd: '2', hp: '2d6', ac: 13, mv: 12, atk: ['1d6'], size: 'M', xp: 25, gold: '1d4', tags: ['humanoid', 'wolf', 'ev'], fig: 'gnoll', lore: 'Wolf-kin of the watchtower, pack-bonded to the Bloodmane line.' });
mon('packlord', { name: 'Bloodmane Packlord', hd: '5', hp: '5d6+5', ac: 14, mv: 12, atk: ['1d8', '1d4'], size: 'L', ml: 16, xp: 150, gold: '2d6x10', tags: ['humanoid', 'wolf', 'ev', 'leader'], leader: true, fig: 'gnoll', lore: 'He named the tower after the mane he wore before he grew his own. Tamsin Hask is still up there, and he feeds on her fear.' });
mon('redfang', { name: 'Redfang, Chieftain of the Ash', hd: '6.2', hp: '6d8+2', ac: 15, mv: 12, atk: ['1d8+1', '1d4'], size: 'M', ml: 16, xp: 200, gold: '3d6x10', tags: ['undead', 'und', 'drain', 'ev', 'leader'], leader: true, drain: 1, fig: 'vampire', lore: 'Once a captain of the Dawn, now the chieftain the cult keeps alive. He drinks what the vaults owe him.' });
mon('malvek', { name: 'Malvek the Ashen', hd: '7.2', hp: '7d8+2', ac: 15, mv: 12, atk: ['1d8+1', '1d4'], size: 'M', ml: 17, xp: 350, gold: '0', tags: ['undead', 'und', 'drain', 'ev', 'caster', 'leader'], leader: true, drain: 1, cast: { lvl: 9, list: ['hold_person_c', 'cure_sw', 'holy_word'] }, fig: 'lich', lore: 'The circle\'s grey heart. He has outlived three abbys and one village, and he intends to outlive the Dawn itself.' });
mon('swamp_adder', { name: 'Swamp Adder', hd: '3', hp: '3d6', ac: 13, mv: 12, atk: ['1d6'], size: 'M', xp: 40, tags: ['beast', 'serpent', 'poison'], fig: 'serpent', venom: { dmg: '1d6', delay: [16, 30], save: true }, lore: 'It lies along the Greywater pass and charges the road in blood.' });
mon('crypt_shade', { name: 'Crypt Shade', hd: '3', hp: '3d6', ac: 14, mv: 15, atk: ['1d6'], size: 'M', xp: 50, tags: ['undead', 'und'], fig: 'shade', immune: ['poison', 'sleep'], lore: 'The vaults\' own darkness, worn like a cloak.' });

/* --- E2: Coldharrow mine & barrow --- */
mon('bugbear', { name: 'Bugbear', hd: '3.1', hp: '3d8+1', ac: 14, mv: 12, atk: ['1d10'], size: 'L', xp: 50, gold: '1d6x5', tags: ['humanoid', 'gi', 'big', 'ev'], fig: 'bugbear', lore: 'It keeps the stockade the way it keeps everything: with its hands.' });
mon('revenant', { name: 'Revenant', hd: '4', hp: '4d6', ac: 14, mv: 12, atk: ['1d8'], size: 'M', xp: 75, tags: ['undead', 'und'], fig: 'revenant', lore: 'The mine\'s dead keep their ledgers. The ledger is a list of names, and it is long.' });
mon('frost_wraith', { name: 'Frost Wraith', hd: '5', hp: '5d6', ac: 15, mv: 15, atk: ['1d8'], size: 'M', xp: 120, tags: ['undead', 'und', 'cold', 'drain'], fig: 'wraith', drain: 1, resist: 'cold', lore: 'It comes out of the Harrow wind with the cold riding on it.' });
mon('wight', { name: 'Wight', hd: '4', hp: '4d6', ac: 14, mv: 12, atk: ['1d6'], size: 'M', xp: 75, tags: ['undead', 'und', 'drain'], fig: 'shade', drain: 1, lore: 'Barrow-deep, patient, and older than the king it was bound to serve.' });
mon('dwarf_knight', { name: 'Dwarf Knight of the Deep', hd: '5', hp: '5d8', ac: 15, mv: 9, atk: ['1d8'], size: 'M', xp: 100, tags: ['undead', 'und', 'magic'], fig: 'dwarf_knight', lore: 'The Deepcut guard still stands watch. Its chainmail is full of water that will not freeze.' });
mon('ice_troll', { name: 'Ice Troll', hd: '7.3', hp: '7d8+3', ac: 14, mv: 9, atk: ['1d10', '1d6', '1d6'], size: 'L', xp: 200, tags: ['humanoid', 'tro', 'big', 'regen'], fig: 'troll', regen: true, resist: 'cold', immune: ['cold'], lore: 'It sleeps under the cairns and the ice sleeps with it.' });
mon('goblin', { name: 'Mine Goblin', hd: '1', hp: '1d6', ac: 13, mv: 12, atk: ['1d4'], size: 'S', xp: 15, gold: '1d4', tags: ['humanoid', 'gob', 'small'], fig: 'humanoid', lore: 'Small, quick, and very sure of the tunnels. It has been digging since before the mine had a name.' });
mon('gorrak', { name: 'Gorrak Skullsplitter', hd: '6', hp: '6d6', ac: 14, mv: 12, atk: ['1d10', '1d4'], size: 'L', ml: 16, xp: 180, gold: '2d6x10', tags: ['humanoid', 'gob', 'big', 'ev', 'leader'], leader: true, fig: 'goblin', lore: 'He split the first skull with a pick and never put it down again. The goblins of the Deepcut mine dig to his measure, and the measure is his own.' });
mon('iron_king', { name: 'The Iron King', hd: '8', hp: '8d8', ac: 15, mv: 9, atk: ['2d8', '1d6'], size: 'L', ml: 17, xp: 400, gold: '0', tags: ['undead', 'und', 'drain', 'magic', 'ev', 'leader'], leader: true, drain: 1, immune: ['magic'], lore: 'He wore the crown into the barrow and the barrow kept the crown with him. The seal on his chest is the only door that still matters.' });

/* --- E3: Ravenmoor, keep and pit --- */
mon('troll', { name: 'Troll', hd: '6.3', hp: '6d8+3', ac: 14, mv: 9, atk: ['1d8', '1d6', '1d6'], size: 'L', xp: 150, tags: ['humanoid', 'tro', 'big', 'regen'], fig: 'troll', regen: true, immune: ['poison', 'sleep', 'hold'], lore: 'It mends as fast as you cut. Fire and acid are the old arguments that end.' });
mon('worg', { name: 'Worg', hd: '3.1', hp: '3d8+1', ac: 13, mv: 15, atk: ['1d8'], size: 'L', xp: 45, tags: ['beast', 'wolf', 'big'], fig: 'wolf', lore: 'Bigger than a wolf should be. The moor\'s herds thin out around its walks.' });
mon('hellhound', { name: 'Hell Hound', hd: '4', hp: '4d6', ac: 14, mv: 15, atk: ['1d6'], size: 'L', xp: 75, tags: ['beast', 'wolf', 'fire', 'ev'], fig: 'hellhound', immune: ['fire'], lore: 'Its eyes are coals and its breath is the space between them.' });
mon('gargoyle', { name: 'Gargoyle', hd: '4', hp: '4d6', ac: 15, mv: 12, atk: ['1d6'], size: 'M', xp: 60, tags: ['undead', 'und', 'magic'], fig: 'gargoyle', immune: ['magic'], fly: true, lore: 'It was carved to watch the keep, and the keep carved it back. Only magic cuts it now.' });
mon('raven_witch', { name: 'Raven Witch', hd: '4', hp: '4d6', ac: 14, mv: 12, atk: ['1d4'], size: 'M', xp: 75, tags: ['humanoid', 'ev', 'caster'], fig: 'raven_witch', cast: { lvl: 5, list: ['scare', 'blindness', 'dispel_m'] }, lore: 'One of Vharra\'s flock. She trades in riddles and keeps her answers in her beak.' });
mon('hill_giant', { name: 'Hill Giant', hd: '8.4', hp: '8d8+4', ac: 15, mv: 9, atk: ['2d6', '1d6'], size: 'H', xp: 250, gold: '2d6x10', tags: ['humanoid', 'gi', 'big', 'ev'], fig: 'giant', lore: 'It threw the keep\'s towers because they blocked the view. It is still deciding which view is better.' });
mon('gnashrot', { name: 'Gnashrot the Bridge-keeper', hd: '7', hp: '7d8', ac: 14, mv: 9, atk: ['1d10', '1d6', '1d6'], size: 'L', ml: 16, xp: 300, gold: '1d6x20', tags: ['humanoid', 'tro', 'big', 'regen', 'leader'], leader: true, regen: true, immune: ['poison', 'sleep', 'hold'], fig: 'troll', lore: 'It raised the causeway out of the moor because it liked the sound of boots on stone. The patrol that came to cut it down never sent a report.' });
mon('grull', { name: 'Grull of the Boulder Fields', hd: '9.4', hp: '9d8+4', ac: 15, mv: 9, atk: ['2d6', '2d6'], size: 'H', ml: 16, xp: 400, gold: '3d6x20', tags: ['humanoid', 'gi', 'big', 'ev', 'leader'], leader: true, fig: 'giant', throw: '2d6', lore: 'He keeps the boulder fields the way other giants keep pets. The keep is his favorite.' });
mon('vharra', { name: 'Vharra, the Witch-Queen', hd: '9.4', hp: '9d8+4', ac: 15, mv: 12, atk: ['1d8', '1d4'], size: 'M', ml: 17, xp: 600, gold: '0', tags: ['humanoid', 'ev', 'caster', 'leader'], leader: true, cast: { lvl: 11, list: ['fear', 'hold_person_m', 'dispel_m', 'cure_cw'] }, fig: 'vharra', lore: 'The moor\'s old crown. She wears the pit like a gown and the ravens like a guard. The north has been hers since the last king forgot to be kind.' });
mon('bog_wraith', { name: 'Bog Wraith', hd: '5', hp: '5d6', ac: 15, mv: 15, atk: ['1d8'], size: 'M', xp: 120, tags: ['undead', 'und', 'drain'], fig: 'wraith', drain: 1, immune: ['poison', 'sleep'], lore: 'The moor gave it the water, and the water gave it back.' });
mon('old_king', { name: 'The Old King', hd: '6', hp: '6d8', ac: 14, mv: 12, atk: ['1d8'], size: 'M', xp: 150, tags: ['undead', 'und', 'magic', 'drain'], fig: 'old_king', drain: 1, lore: 'The cairn was raised by people who knew his name and said it too often.' });

/* ================= MAPS ================= */
D.SAGA_MONS = Object.keys(D.MONSTERS); /* the 40 authored saga IDs */
/* grid: rows of characters. x right, y down, zero-based.
 * # wall; H/B building; 1-9 service doors (via locs); G gate; . floor; , grass;
 * T tree; F fountain (solid billboards); D door; L locked door; S secret door;
 * < up / > down stairs; a-z walkable event sites (live bands occupy their tile).
 * Authored grids are built programmatically so dimensions are exact. */
const MAPS = {};
D.MAPS = MAPS;
function map(id, f) {
  const m = Object.assign({ id: id, name: f.name || id, wall: '#HBF', floor: '.,', outdoor: false, start: { x: 2, y: 2, dir: 0 } }, f);
  if (m.grid && m.grid.length) { m.h = m.grid.length; m.w = m.grid[0].length; }
  if (m.seed == null) m.seed = (R && R.hash ? R.hash('map_' + id) : (id.length * 2654435761) >>> 0);
  MAPS[id] = m;
  return id;
}
D.map = map;

/* tiny grid canvas */
function Cnv(w, h, ch) {
  const g = Array.from({ length: h }, () => new Array(w).fill(ch));
  const c = {
    w, h, g,
    get(x, y) { return (x >= 0 && x < w && y >= 0 && y < h) ? g[y][x] : undefined; },
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
  c.rect(2, 5, 15, 1, '.');        /* street in front of the Longhouse */
  c.rect(2, 6, 15, 1, '.');        /* main road */
  c.set(7, 6, 'p');
  c.rect(2, 10, 15, 1, '.');       /* south road */
  c.rect(2, 11, 15, 1, ',');       /* grass */
  c.rect(0, 12, 19, 1, ',');
  c.rect(0, 13, 19, 1, '.');       /* street by the gate */
  c.set(16, 11, 'q');
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
  /* passageways between buildings */
  for (const x of [6, 11]) { c.set(x, 7, '.').set(x, 8, '.').set(x, 9, '.'); }
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
  c.set(11, 7, '.').set(12, 7, '.'); /* door from corridor */
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
  c.rect(2, 10, 21, 1, '.');        /* back street behind the centre block */
  /* passageways between buildings (north row and centre row) */
  for (const x of [6, 11, 16]) { c.set(x, 6, '.').set(x, 7, '.').set(x, 8, '.'); c.set(x, 11, '.').set(x, 12, '.').set(x, 13, '.'); }
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
  c.set(16, 4, '.');                /* choir connector */
  c.set(19, 4, 'c').set(21, 3, 'i');
  c.rect(9, 6, 7, 4, '.');          /* centre */
  c.set(12, 8, 'm');
  c.rect(3, 9, 6, 1, '.');          /* west connector */
  c.set(16, 9, '.').set(17, 9, '.'); /* east connector */
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
  c.set(16, 4, '.');                /* corridor connector */
  c.set(5, 7, '.').set(12, 7, '.').set(19, 7, '.'); /* to middle */
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
      i: { chest: { text: 'The packlord\'s trophies: bones, teeth, and one very confused ring.', gold: '1d6x10', items: ['gem_topaz', 'potion_antivenom'] } },
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

/* ---------- item lookup: resolves full instance IDs ---------- */
D.item = function (id) {
  if (!id) return null;
  if (id.indexOf('scroll:') === 0) {
    const sid = id.slice(7);
    const s = D.SPELLS[sid];
    return { id: id, name: 'Scroll of ' + (s ? s.n : sid), type: 'x', spell: sid, price: s ? 10 * s.l : 10, desc: s ? s.desc : 'A scroll.' };
  }
  if (id.indexOf('#') > 0) {
    const [base, ch] = id.split('#');
    const it = Object.assign({}, D.ITEMS[base] || { name: base, type: 'd' });
    it.id = id; it.charges = +ch || 1;
    return it;
  }
  return D.ITEMS[id] || null;
};
D.itemName = function (id) { const it = D.item(id); return it ? it.name + (it.charges ? ' (' + it.charges + ')' : '') : id; };

/* ================= QUESTS (13 authored) ================= */
D.QUESTS = {};
D.QUEST_ORDER = [];
function quest(id, f) { D.QUESTS[id] = Object.assign({ id: id, name: f.name, lead: f.lead, goal: f.goal, offer: f.offer, done: f.done, gold: 0, xp: 0 }, f); D.QUEST_ORDER.push(id); return id; }
D.quest = quest;

/* E0 */
quest('thorn_kobolds', { name: 'The Cellar King', lead: 'Elder Maddoc', goal: 'Kill Skarrik and free the cellar.', offer: 'The cellar has taken our grain and our lock. Skarrik calls himself king. Take the crown off him.', done: 'Skarrik is dead, and the cellar is ours again.', gold: 150, xp: 800 });
quest('thorn_ring', { name: 'The Widow\'s Ring', lead: 'Widow Marrow', goal: 'Recover Widow Marrow\'s Ring and bring it to her.', offer: 'My husband\'s ring was in the cellar, in a chest of needles. If you can get it past the needles, bring it to me.', done: 'The ring is home, and the widow is whole.', gold: 50, xp: 200, side: true, needItem: 'widowRing' });
/* E1 */
quest('redfang', { name: 'The Chieftain\'s Debt', lead: 'Reeve Halda', goal: 'Kill Redfang, chieftain of the ash.', offer: 'The cult keeps a chieftain alive in the vaults. Redfang drinks what the Dawn owes. Collect the debt.', done: 'Redfang is ash, and the debt is paid.', gold: 250, xp: 750 });
quest('reliquary', { name: 'The Dawn Reliquary', lead: 'Reeve Halda', goal: 'Return the Dawn Reliquary to the temple.', offer: 'The abbey\'s reliquary is in the lower dark. Bring it home to the Dawn.', done: 'The Dawn has its reliquary, and the light is a little brighter for it.', gold: 150, xp: 300, needItem: 'dawnReliquary' });
quest('malvek', { name: 'The Ashen Circle', lead: 'Reeve Halda', goal: 'Kill Malvek the Ashen and his circle.', offer: 'Malvek is the circle\'s heart. Take the heart, and the circle is only ash.', done: 'Malvek is gone, and the circle is only ash.', gold: 500, xp: 1500 });
quest('gnolls', { name: 'The Bloodmane Pack', lead: 'Tamsin\'s Sister', goal: 'Defeat the Bloodmane Packlord and rescue Tamsin Hask.', offer: 'My sister was taken to the watchtower. The packlord feeds on her fear. Put the fear out.', done: 'Tamsin is home, and the packlord is a story.', gold: 100, xp: 400, side: true });
/* E2 */
quest('cold_mine', { name: 'The Skullsplitter', lead: 'Thane Bergen', goal: 'Kill Gorrak Skullsplitter and clear the mine.', offer: 'The goblins have the Deepcut mine, and the mine has our iron. Gorrak is the measure. Take the measure.', done: 'Gorrak is a story, and the mine is ours.', gold: 200, xp: 600 });
quest('cold_king', { name: 'The Iron King', lead: 'Thane Bergen', goal: 'Lay the Iron King to rest.', offer: 'The barrow keeps a king, and the king keeps a seal. Find the seal, break the ward, and lay him to rest.', done: 'The Iron King is at rest, and the barrow is only stone.', gold: 400, xp: 1200, needItem: 'kingsSeal' });
quest('cold_tally', { name: 'The Foreman\'s Tally', lead: 'Dunmore', goal: 'Return the foreman\'s tally book.', offer: 'The tally book is in the mine, in a goblin hand. I want it back.', done: 'The tally is home, and the debt is a story.', gold: 100, xp: 250, side: true, needItem: 'tallyBook' });
/* E3 */
quest('rav_moor', { name: 'The Bridge-keeper', lead: 'Commander Ysolde', goal: 'Kill Gnashrot and clear the causeway.', offer: 'The troll raised the causeway and keeps it with teeth. Cut the teeth, and the causeway is a road again.', done: 'Gnashrot is a story, and the causeway is a road.', gold: 300, xp: 1000 });
quest('rav_keep', { name: 'The Boulder Field', lead: 'Commander Ysolde', goal: 'Kill Grull and clear the keep.', offer: 'The hill giant keeps the keep with boulders. Take the boulders, and the keep is a fort again.', done: 'Grull is a story, and the keep is a fort.', gold: 350, xp: 1250 });
quest('rav_witch', { name: 'The Witch-Queen', lead: 'Commander Ysolde', goal: 'Kill Vharra and free the moor.', offer: 'Vharra is the moor\'s crown. Take the crown, and the north is north again.', done: 'Vharra is gone, and the moor is only moor.', gold: 600, xp: 2500 });
quest('rav_patrol', { name: 'The Patrol Badges', lead: 'Commander Ysolde', goal: 'Recover the twelve patrol badges.', offer: 'Twelve badges, lost with the patrol. Find them all, and the patrol is a story with an ending.', done: 'The twelve badges are home, and the patrol is a story with an ending.', gold: 200, xp: 800, side: true, needItem: 'patrolBadge', needCount: 12 });

/* ================= RUMORS ================= */
D.RUMORS = {
  thornwick: [
    'The cellar has taken the brewery lock, and the lock has taken the key.',
    'Skarrik drinks from a kettle and calls himself king. The cellar is his, and the cellar is the village\'s.',
    'Widow Marrow\'s ring was in a chest of needles. The needles are still in the chest.',
    'The vale road is clear, if you call a road clear when the wolves are on it.'
  ],
  hollow: [
    'The Abbey of the Dawn is open again, and the undercroft is breathing cold.',
    'The cult keeps a chieftain alive in the vaults. The chieftain drinks what the Dawn owes.',
    'The bloodmane flag is on the watchtower, and the tower is on the ridge.',
    'The Drowned Chapel is open, and the water is the color of the dead.'
  ],
  coldharrow: [
    'The goblins have the Deepcut mine, and the mine has our iron.',
    'Gorrak splits skulls with a pick and keeps the pick.',
    'The barrow keeps a king, and the king keeps a seal.',
    'The Harrow wind comes out of the cairns, and the cairns are old.'
  ],
  ravenmoor: [
    'The causeway is a road, if you call a road a road when the troll keeps it with teeth.',
    'The hill giant keeps the keep with boulders, and the boulders are the size of houses.',
    'Vharra is the moor\'s crown, and the crown is old.',
    'The patrol that went to the moor sent no report. The badges are gone with the patrol.'
  ]
};

/* ================= PREGENS ================= */
D.PREGENS = [
  { id: 'aldric', name: 'Aldric Thorne', race: 'H', cls: 'F', align: 'LN', color: '#c8502c',
    scores: { STR: 17, DEX: 13, CON: 16, INT: 10, WIS: 12, CHA: 12 }, spec: 'longsword',
    gear: ['longsword', 'chain', 'shield'] },
  { id: 'seraphine', name: 'Seraphine Vale', race: 'H', cls: 'P', align: 'LG', color: '#e3b54a',
    scores: { STR: 16, DEX: 12, CON: 14, INT: 12, WIS: 14, CHA: 17 },
    gear: ['broadsword', 'chain', 'shield'] },
  { id: 'borin', name: 'Borin Stonehand', race: 'D', cls: 'C', align: 'LG', color: '#8a6a4a',
    scores: { STR: 14, DEX: 11, CON: 15, INT: 10, WIS: 14, CHA: 11 },
    gear: ['mace', 'sling', 'chain', 'shield'] },
  { id: 'lyra', name: 'Lyra Windwhisper', race: 'HE', cls: 'R', align: 'CG', color: '#5fae6a',
    scores: { STR: 14, DEX: 15, CON: 15, INT: 11, WIS: 15, CHA: 12 }, foe: 'gob',
    gear: ['longsword', 'studded', 'longbow'] },
  { id: 'pip', name: 'Pip Quickfinger', race: 'HA', cls: 'T', align: 'CN', color: '#b48ae0',
    scores: { STR: 10, DEX: 16, CON: 12, INT: 11, WIS: 11, CHA: 13 },
    gear: ['shortsword', 'leather', 'sling'] },
  { id: 'elowen', name: 'Elowen Starfall', race: 'E', cls: 'M', align: 'TN', color: '#6a8ae0',
    scores: { STR: 9, DEX: 12, CON: 12, INT: 17, WIS: 13, CHA: 12 },
    gear: ['staff', 'darts'] }
];
/* kit upgrades for a fresh roster advanced to module start level (pregens) */
D.PREGEN_KIT = {
  3: { F: ['sword_plus1', 'chain'], P: ['sword_plus1', 'chain', 'shield'], R: ['sword_plus1', 'studded', 'longbow'],
       M: ['potion_haste', 'potion_clw'], C: ['potion_clw', 'chain'], T: ['leather', 'shield'] },
  5: { F: ['silver_long', 'chain1', 'shield1'], P: ['silver_long', 'chain1', 'shield1'], R: ['silver_long', 'studded1', 'longbow1'],
       M: ['potion_haste', 'potion_invis', 'potion_strength'], C: ['potion_cure_serious', 'chain1'], T: ['studded1', 'shield1'] },
  9: { F: ['longsword1', 'chain1', 'shield1', 'ring_protection1'], P: ['longsword1', 'chain1', 'shield1', 'ring_protection1'],
       R: ['longsword1', 'studded1', 'longbow1', 'ring_protection1'],
       M: ['potion_haste', 'potion_invis', 'potion_stoneskin', 'ring_protection1'], C: ['potion_cure_serious', 'chain1', 'ring_protection1'],
       T: ['studded1', 'shield1', 'ring_protection1'] },
  13: { F: ['longsword2', 'chain2', 'shield2', 'ring_protection2', 'cloak_protection1'], P: ['longsword2', 'chain2', 'shield2', 'ring_protection2', 'cloak_protection1'],
        R: ['longsword2', 'plate1', 'longbow1', 'ring_protection2', 'cloak_protection1'],
        M: ['potion_haste', 'potion_invis', 'potion_stoneskin', 'ring_wizardry', 'cloak_protection1'], C: ['potion_heal', 'chain2', 'ring_protection2', 'cloak_protection1'],
        T: ['plate1', 'shield2', 'ring_protection2', 'cloak_protection1'] },
  17: { F: ['longsword2', 'chain2', 'shield2', 'ring_wizardry', 'cloak_protection2', 'boots_swift'], P: ['longsword2', 'chain2', 'shield2', 'ring_wizardry', 'cloak_protection2'],
        R: ['longsword2', 'plate1', 'longbow1', 'ring_wizardry', 'cloak_protection2'],
        M: ['potion_heal', 'potion_invis', 'potion_stoneskin', 'ring_wizardry', 'cloak_protection2'], C: ['potion_heal', 'chain2', 'ring_wizardry', 'cloak_protection2'],
        T: ['plate1', 'shield2', 'ring_wizardry', 'cloak_protection2', 'boots_swift'] }
};
})();
