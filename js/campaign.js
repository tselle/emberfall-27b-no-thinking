/* Emberfall — campaign.js
 * Party and campaign state: time, gold, services (shops/inn/temple/hall),
 * training, journeys between modules, and save/load (v2). */
'use strict';
(function () {
const Campaign = window.Campaign = {};
const R = window.R;

/* ---------- time ---------- */
/* G.hour 0..23, G.minute 0..59. Night = 21:00–05:00. */
Campaign.isNight = function () {
  return G.hour >= 21 || G.hour < 5;
};
Campaign.isDay = function () { return !Campaign.isNight(); };
Campaign.timeStr = function (hour, minute) {
  const h = hour != null ? hour : G.hour;
  const m = minute != null ? minute : G.minute;
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return hh + (m ? ':' + String(m).padStart(2, '0') : '') + ' ' + ap;
};
Campaign.addTime = function (mins) {
  G.minute += mins;
  while (G.minute >= 60) { G.minute -= 60; G.hour++; }
  while (G.hour >= 24) { G.hour -= 24; G.day++; Campaign.dayStart(); }
};
Campaign.dayStart = function () {
  /* fresh day: remember spells, clear daily flags */
  for (const c of G.party) {
    if (!c.dead) R.remember(c);
  }
  G.trainUsedToday = false;
};
/* sleep until 5:00 (dawn) */
Campaign.sleep = function () {
  const minsTo5 = (G.hour < 5) ? (G.hour * 60 + G.minute) : ((24 - G.hour) * 60 - G.minute + 300);
  G.minute = 0; G.hour = 5;
  if (minsTo5 > 90) {
    for (const c of G.party) if (!c.dead) c.hp = Math.min(c.maxhp, c.hp + Math.max(1, Math.floor(c.maxhp / 4)));
  }
  Campaign.dayStart();
};

/* step cost in the town/dungeon: a few minutes per step */
Campaign.stepCost = function (overland) {
  if (overland) return R.i(R.rand, 2, 6); /* minutes per overland step */
  return R.i(R.rand, 1, 3);
};

/* ---------- party helpers ---------- */
Campaign.alive = function () { return G.party.filter((c) => !c.dead && c.hp > 0); };
Campaign.dead = function () { return G.party.filter((c) => c.dead || c.hp <= 0); };

Campaign.xpSplit = function (total) {
  const alive = Campaign.alive();
  if (!alive.length) return;
  const each = Math.floor(total / alive.length);
  let bonus = total - each * alive.length;
  for (const c of alive) {
    let amt = each + (bonus-- > 0 ? 1 : 0);
    R.awardXp(c, amt);
    const nl = R.levelForXp(c.cls, c.xp);
    if (nl > c.lvl) {
      /* ready at most one level above; training takes the rest */
      if (nl === c.lvl + 1) {
        c.lvl = nl;
        const h = R.trainUp ? 0 : 0;
        R.advanceTo(c, nl, { kit: true, silent: true, onGold: (g) => { G.gold += g; } });
        window.UI && UI.log(c.name + ' reaches level ' + nl + '.');
        window.Journal && Journal.add(G.day, c.name + ' is now level ' + nl + '.');
      }
    }
  }
};

/* ---------- services ---------- */
const SERVICE_DEFS = {
  shop: { name: 'Shop', color: '#e0b040', hours: 'day' },
  inn: { name: 'Inn', color: '#40c060', hours: 'night' },
  temple: { name: 'Temple', color: '#5090e0', hours: 'day' },
  hall: { name: 'Hall', color: '#d0d0d8', hours: 'day' },
  fountain: { name: 'Fountain', color: '#50c0d0', hours: 'any' },
  stairs: { name: 'Stairs', color: '#c0c0c8', hours: 'any' },
  trouble: { name: 'Trouble', color: '#e04040', hours: 'any' }
};
Campaign.serviceDef = function (kind) { return SERVICE_DEFS[kind] || { name: kind, color: '#888' }; };
Campaign.openNow = function (kind) {
  const def = SERVICE_DEFS[kind];
  if (!def) return true;
  if (def.hours === 'any') return true;
  if (def.hours === 'day') return Campaign.isDay();
  if (def.hours === 'night') return Campaign.isNight() || true; /* inns take weary travelers at dusk too */
  return true;
};

/* deterministic shop stock per base + tier */
Campaign.shopStock = function (mapId, tier) {
  const map = D.MAPS[mapId];
  const rng = R.mulberry32((map ? map.seed : 7) + 1000 * (tier || 1));
  const pool = [];
  const add = (id, mult) => {
    const it = D.item(id);
    if (!it || !it.price) return;
    pool.push({ id: id, price: Math.max(1, Math.round(it.price * (mult || 1))) });
  };
  /* basics */
  const basics = ['potion_clw', 'ration', 'torches#20', 'rope', 'lockpick', 'oil', 'potion_antidote', 'potion_cure'];
  for (const b of basics) if (D.item(b)) add(b, 1.4);
  /* gear by tier */
  const gear = [
    ['leather', 'dagger', 'shortbow'],
    ['studded', 'longsword', 'kiteshield', 'potion_stre'],
    ['chain', 'twoh_sword', 'towershield', 'potion_invul', 'potion_regen'],
    ['scale', 'flame_sword', 'chainmail1', 'potion_regen', 'scroll_fly'],
    ['splint', 'ice_sword', 'shield1', 'potion_heroism', 'scroll_townportal'],
    ['plate', 'giant_slayer', 'chainmail2', 'potion_regen', 'scroll_teleport']
  ];
  const t = Math.min(5, Math.max(0, tier - 1));
  for (const g of gear[t]) if (D.item(g)) add(g, 1.5 + 0.1 * t);
  /* magic wares, pricier, fewer */
  const magic = ['cloak_protection1', 'ring_protection1', 'sword_plus1', 'armor_plus1', 'boots_feather'];
  const nMagic = R.i(rng, 1, 3);
  for (let i = 0; i < nMagic; i++) {
    const g = magic[R.i(rng, 0, magic.length - 1)];
    if (D.item(g)) add(g, 3 + t);
  }
  /* sort by price */
  pool.sort((a, b) => a.price - b.price);
  return pool.slice(0, 18).map((p) => {
    const it = D.item(p.id);
    return {
      name: it.name + (it.charges ? ' (' + it.charges + ')' : ''),
      detail: it.n || '',
      price: p.price,
      give: (c) => { c.inv.push(p.id); }
    };
  });
};

/* inn: heal + sleep */
Campaign.innService = function (c) {
  const cost = Math.max(5, Math.ceil(c.maxhp / 2));
  return {
    name: c.name + ' — rest & heal',
    detail: 'Sleep until dawn; full heal for the night’s wear.',
    price: cost,
    give: (cc) => { cc.hp = cc.maxhp; }
  };
};
/* temple: cure (targeted) / prayer / train */
Campaign.templeGoods = function () {
  const out = [];
  const heal = (c) => {
    const cost = Math.max(10, Math.ceil((c.maxhp - c.hp) / 2) + 10);
    out.push({
      name: c.name + ' — healing',
      detail: 'Cure ' + (c.maxhp - c.hp) + ' HP',
      price: cost,
      give: (cc) => { cc.hp = Math.min(cc.maxhp, cc.hp + Math.max(5, Math.ceil(cc.maxhp / 2))); }
    });
  };
  for (const c of G.party) if (c.hp < c.maxhp && !c.dead) heal(c);
  /* training */
  for (const c of G.party) {
    if (c.dead || !R.canTrain(c)) continue;
    const cost = R.trainCost(c);
    out.push({
      name: c.name + ' — training (level ' + (c.lvl + 1) + ')',
      detail: 'Earned it. Pay ' + cost + ' gp and rest. No refund if it fails.',
      price: cost,
      give: (cc) => {
        const chance = Math.max(30, Math.min(90, 70 - (cc.lvl - 5) * 4));
        if (R.chance(chance)) {
          const h = R.trainUp(cc);
          window.UI && UI.log(cc.name + ' trains up to level ' + cc.lvl + ' (+' + h + ' HP).');
          window.Journal && Journal.add(G.day, cc.name + ' trains up to level ' + cc.lvl + '.');
        } else {
          window.UI && UI.log(cc.name + '’s training fails. The gold is gone.');
          window.Journal && Journal.add(G.day, cc.name + '’s training fails.');
        }
      }
    });
  }
  return out;
};
/* hall: rumors + commission status */
Campaign.hallRumors = function (moduleId) {
  const mo = M.MODULES[moduleId];
  if (!mo) return [];
  return mo.rumors || [];
};

/* ---------- journeys between modules ---------- */
Campaign.journey = function (fromId, toId) {
  const from = M.MODULES[fromId], to = M.MODULES[toId];
  G.day += 1;
  G.hour = 9; G.minute = 0;
  const msgs = [];
  for (const c of G.party) {
    if (c.dead) continue;
    c.hp = Math.min(c.maxhp, c.hp + R.d('1d6'));
    /* "all train": characters close to the next level gain ground */
    const next = R.nextXp(c);
    if (next != null) {
      if (c.xp >= next) {
        if (R.chance(60)) {
          R.trainUp(c);
          msgs.push(c.name + ' trains the road to level ' + c.lvl + '.');
        } else {
          c.xp += Math.floor(next * 0.05);
        }
      } else {
        c.xp += Math.floor((next - c.xp) * 0.1);
      }
    }
  }
  Campaign.dayStart();
  UI.log('The road takes a day. You arrive at ' + to.name + '.');
  for (const m of msgs) UI.log(m);
  Journal.add(G.day, 'Traveled to ' + to.name + '.');
  if (window.Journal) Journal.setComm(toId, 'progress');
};

/* ---------- save / load ---------- */
const KEY = (i) => 'emberfall_v2_slot' + i;
Campaign.save = function (slot, auto) {
  if (!G.started) return false;
  const data = {
    version: 2,
    name: G.partyName || 'The Company',
    day: G.day, hour: G.hour, minute: G.minute,
    gold: G.gold,
    party: G.party,
    module: G.module,
    mapId: G.mapId,
    pos: G.pos,
    dir: G.dir,
    camp: G.camp || {},
    journal: G.journal || {},
    bestiary: G.bestiary || {},
    state: G.state || {},
    auto: !!auto
  };
  try {
    localStorage.setItem(KEY(slot || 0), JSON.stringify(data));
    return true;
  } catch (e) {
    UI.log('Save failed: ' + e.message, 'err');
    return false;
  }
};
Campaign.readSlot = function (slot) {
  try {
    const raw = localStorage.getItem(KEY(slot));
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
};
Campaign.load = function (slot) {
  const data = Campaign.readSlot(slot);
  if (!data) return false;
  G.day = data.day; G.hour = data.hour; G.minute = data.minute;
  G.gold = data.gold;
  G.party = data.party;
  G.module = data.module;
  G.mapId = data.mapId;
  G.pos = data.pos;
  G.dir = data.dir;
  G.camp = data.camp || {};
  G.journal = data.journal || {};
  G.bestiary = data.bestiary || {};
  G.state = data.state || {};
  G.partyName = data.name;
  G.started = true;
  if (window.Game) Game.enterMap(data.mapId, data.pos, data.dir, true);
  return true;
};
Campaign.slotMeta = function (slot) {
  const data = Campaign.readSlot(slot);
  if (!data) return null;
  const mo = M.MODULES[data.module];
  return {
    name: data.name, day: data.day,
    timeStr: Campaign.timeStr(data.hour, data.minute),
    moduleName: mo ? mo.name : data.module,
    auto: data.auto
  };
};
})();
