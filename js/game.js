/* Emberfall — game.js
 * Orchestration: global state G, screen flow (title → campaign → assembly →
 * play), first-person movement, events (enc/chest/text/service/stair/exit),
 * time and day/night, module completion, keyboard, and the render loop. */
'use strict';
(function () {
const R = window.R;

/* ================= global state ================= */
window.G = {
  version: 2,
  started: false,
  partyName: 'The Company',
  party: [],
  gold: 25,
  day: 1, hour: 8, minute: 0,
  module: null,
  mapId: null,
  pos: { x: 0, y: 0 },
  dir: 0,
  px: 0, py: 0,
  mode: 'title',
  camp: { tab: 'saga', module: null },
  journal: { notes: {}, comms: {}, prior: [] },
  bestiary: {},
  quests: {},
  state: {},
  seen: {},
  trainUsedToday: false,
  lastMove: null
};

const Game = window.Game = {};

const DIRS = [
  { x: 0, y: -1, n: 'north', a: 0 },
  { x: 1, y: 0, n: 'east', a: 1 },
  { x: 0, y: 1, n: 'south', a: 2 },
  { x: -1, y: 0, n: 'west', a: 3 }
];

/* ================= helpers ================= */
Game.stateFor = function (mapId) {
  G.state[mapId] = G.state[mapId] || {};
  return G.state[mapId];
};
Game.moduleOfMap = function (mapId) {
  for (const id in M.MODULES) {
    if (M.MODULES[id].maps && M.MODULES[id].maps.includes(mapId)) return id;
  }
  return null;
};
Game.goldDice = function (expr) {
  if (expr == null) return 0;
  if (typeof expr === 'number') return expr;
  return R.d(String(expr), R.rand) || 0;
};
Game.giveGold = function (expr) {
  const g = Game.goldDice(expr);
  if (g > 0) { G.gold += g; UI.log('+' + g + ' gp.', 'good'); }
  Game.refreshHud();
};
Game.giveItems = function (items) {
  if (!items || !items.length) return;
  const alive = Campaign.alive();
  for (const id of items) {
    const it = D.item(id);
    if (!it) { UI.log('Found a strange object. (unknown: ' + id + ')', 'dim'); continue; }
    /* hand to the first member with pack room */
    let placed = false;
    for (const c of (alive.length ? alive : G.party)) {
      if (c.inv.length < 12 + Math.floor((c.cls === 'M' ? c.ab.INT : c.ab.DEX) / 5)) {
        c.inv.push(id);
        UI.log('Picked up: ' + it.name + '.', 'good');
        placed = true;
        break;
      }
    }
    if (!placed) UI.log('No one has room to carry ' + it.name + '.', 'err');
  }
};

/* ================= map entry ================= */
Game.enterMap = function (mapId, pos, dir, isLoad) {
  const m = D.MAPS[mapId];
  if (!m) { UI.log('No such place: ' + mapId, 'err'); return; }
  G.mapId = mapId;
  G.pos = { x: pos.x, y: pos.y };
  G.dir = dir != null ? dir : (m.start ? m.start.dir : 0);
  G.px = G.pos.x + 0.5;
  G.py = G.pos.y + 0.5;
  const overland = !!m.overland;
  G.mode = overland ? 'overland' : 'play';
  V3.prepare(mapId);
  V3.px = G.px; V3.py = G.py; V3.dir = G.dir;
  if (!G.seen[mapId]) G.seen[mapId] = V3.fov(G.pos.x, G.pos.y, overland ? 10 : 8);
  V3.seen = G.seen[mapId];
  V3.party = G.party;
  Game.reveal();
  Game.refreshHud();
  Game.render();
  if (!isLoad) {
    const locName = overland ? m.name : m.name;
    UI.log('You are in ' + m.name + '.', 'dim');
    if (overland && m.wildEnc) UI.log('The road ahead has a history.', 'dim');
  }
};

Game.reveal = function () {
  const m = D.MAPS[G.mapId];
  const rad = m.overland ? 10 : 8;
  const f = V3.fov(G.pos.x, G.pos.y, rad);
  G.seen[G.mapId] = G.seen[G.mapId] || f;
  V3.or(G.seen[G.mapId], f);
  V3.seen = G.seen[G.mapId];
};

/* ================= HUD ================= */
Game.refreshHud = function () {
  const hud = document.getElementById('hud');
  if (!hud) return;
  const m = D.MAPS[G.mapId];
  const loc = document.getElementById('hudLoc');
  if (loc) loc.textContent = m ? m.name : '';
  const time = document.getElementById('hudTime');
  if (time) {
    time.textContent = 'Day ' + G.day + ' · ' + Campaign.timeStr() + (Campaign.isNight() ? ' ☾' : ' ☀');
  }
  const gold = document.getElementById('hudGold');
  if (gold) gold.textContent = G.gold + ' gp';
  const pips = document.getElementById('hudPips');
  if (pips) {
    pips.innerHTML = '';
    for (const c of G.party) {
      const s = document.createElement('span');
      s.className = 'pip' + (c.dead || c.hp <= 0 ? ' dead' : c.hp < c.maxhp / 2 ? ' hurt' : '');
      s.title = c.name + ' ' + c.hp + '/' + c.maxhp;
      s.textContent = '◆';
      pips.appendChild(s);
    }
  }
  const face = document.getElementById('hudFace');
  if (face) face.textContent = 'facing ' + DIRS[G.dir].n;
  UI.renderParty();
};

/* ================= render loop ================= */
let rafId = null;
Game.render = function () {
  if (G.mode === 'title' || G.mode === 'campaign' || G.mode === 'assembly') return;
  const m = D.MAPS[G.mapId];
  if (!m) return;
  V3.px = G.px; V3.py = G.py; V3.dir = G.dir;
  V3.dayFrac = (G.hour + G.minute / 60) / 24;
  V3.party = G.party;
  V3.monsters = [];
  V3.render();
  const services = Game.servicesForMap(m);
  MapUI.renderMinimap(services);
};
Game.servicesForMap = function (m) {
  const out = {};
  if (m.locs) {
    for (const k in m.locs) {
      /* find the digit cell on the grid */
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        if (m.grid[y][x] === k) {
          out[x + ',' + y] = { name: m.locs[k].name, kind: m.locs[k].kind, color: Campaign.serviceDef(m.locs[k].kind).color };
          break;
        }
      }
    }
  }
  return out;
};

/* ================= movement ================= */
Game.walkable = function (m, ch) {
  return !(m.wall || '#').includes(ch);
};

Game.move = function (didx) {
  if (G.mode === 'combat') return;
  if (UI.stack.length) return;
  const m = D.MAPS[G.mapId];
  const d = DIRS[didx];
  G.dir = d.a;
  const nx = G.pos.x + d.x, ny = G.pos.y + d.y;
  if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) { UI.log('The road does not go there.', 'dim'); return; }
  const ch = m.grid[ny][nx];
  const key = nx + ',' + ny;
  if (!Game.walkable(m, ch)) { UI.log('Blocked.', 'dim'); Game.refreshHud(); return; }

  /* exit (gate) */
  if (m.exit && m.exit[key]) { Game.takeExit(m.exit[key]); return; }
  /* stairs */
  if (m.stairs && m.stairs[key]) { Game.takeStairs(m.stairs[key]); return; }
  /* service door (digit) */
  if (m.locs && ch >= '1' && ch <= '9' && m.locs[ch]) { Game.openService(m.locs[ch]); return; }

  /* move the body */
  G.pos.x = nx; G.pos.y = ny;
  G.px = nx + 0.5; G.py = ny + 0.5;
  G.lastMove = didx;
  const overland = !!m.overland;
  Campaign.addTime(overland ? Overland.stepCost(ch) : Campaign.stepCost(false));
  Game.reveal();

  /* overland scheduled encounter */
  if (overland) {
    const enc = Overland.advance();
    if (enc) {
      const mons = enc.mons.map(([id, n]) => ({ mon: D.MONSTERS[id], count: typeof n === 'string' ? R.d(n) : n }));
      UI.log(enc.text, 'warn');
      Combat.start({ mapId: G.mapId, overland: true, mons: mons, text: enc.text });
      Game.render();
      return;
    }
  }
  /* event on the cell */
  const ev = m.ev && m.ev[ch];
  if (ev) { Game.resolveEvent(ch, ev); Game.render(); return; }
  /* dungeon wander + traps */
  if (!overland && !m.safe) {
    if (m.traps && m.traps[key] && !Game.stateFor(G.mapId).triggered) Game.stateFor(G.mapId).triggered = Game.stateFor(G.mapId).triggered || [];
    if (m.traps && m.traps[key] && !Game.stateFor(G.mapId).triggered.includes(key)) {
      Game.stateFor(G.mapId).triggered.push(key);
      Game.triggerTrap(m.traps[key]);
      Game.render();
      return;
    }
    if (m.wander && R.chance(m.wander[0].chance * 100)) {
      const wd = m.wander[0];
      const mons = wd.mons.map(([id, n]) => ({ mon: D.MONSTERS[id], count: typeof n === 'string' ? R.d(n) : n }));
      UI.log(wd.text, 'warn');
      Combat.start({ mapId: G.mapId, mons: mons, text: wd.text });
      Game.render();
      return;
    }
  }
  Game.refreshHud();
  Game.render();
};

Game.turn = function (delta) {
  G.dir = (G.dir + (delta > 0 ? 1 : 3)) % 4;
  Game.refreshHud();
  Game.render();
};

Game.wait = function () {
  Campaign.addTime(G.mode === 'overland' ? 15 : 10);
  UI.log('You wait a moment. The hour moves.');
  Game.refreshHud();
  Game.render();
};

Game.rest = function () {
  if (G.mode === 'overland') { Overland.camp(); return; }
  const m = D.MAPS[G.mapId];
  if (m.safe) {
    Campaign.sleep();
    for (const c of G.party) if (!c.dead) c.hp = Math.min(c.maxhp, c.hp + Math.ceil(c.maxhp / 2));
    UI.log('You rest until dawn. The base is quiet.', 'good');
    Journal.add(G.day, 'Rested at ' + m.name + '.');
    Campaign.save(0, true);
    Game.refreshHud();
    Game.render();
    return;
  }
  /* unsafe: short rest with risk */
  UI.log('You make a short rest in the dark.');
  for (const c of G.party) if (!c.dead) c.hp = Math.min(c.maxhp, c.hp + R.d('1d2'));
  Campaign.addTime(60);
  const m2 = D.MAPS[G.mapId];
  if (m2.wander && R.chance(m2.wander[0].chance * 200)) {
    const wd = m2.wander[0];
    const mons = wd.mons.map(([id, n]) => ({ mon: D.MONSTERS[id], count: typeof n === 'string' ? R.d(n) : n }));
    UI.log('The rest is broken: ' + wd.text, 'warn');
    Combat.start({ mapId: G.mapId, mons: mons, text: wd.text });
  }
  Game.refreshHud();
  Game.render();
};

Game.interact = function () {
  const m = D.MAPS[G.mapId];
  const d = DIRS[G.dir];
  const nx = G.pos.x + d.x, ny = G.pos.y + d.y;
  if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) return;
  const key = nx + ',' + ny;
  const ch = m.grid[ny][nx];
  if (m.exit && m.exit[key]) { Game.takeExit(m.exit[key]); return; }
  if (m.stairs && m.stairs[key]) { Game.takeStairs(m.stairs[key]); return; }
  if (m.locs && ch >= '1' && ch <= '9' && m.locs[ch]) { Game.openService(m.locs[ch]); return; }
  const ev = m.ev && m.ev[ch];
  if (ev) { Game.resolveEvent(ch, ev); return; }
  UI.log('Nothing here to use.', 'dim');
};

/* ================= transitions ================= */
Game.takeExit = function (ex) {
  UI.log('The gate opens.', 'dim');
  Game.enterMap(ex.to, ex.at, ex.dir);
  Campaign.save(0, true);
};
Game.takeStairs = function (st) {
  const label = 'The stair goes ' + (st.dir === 0 ? 'up' : 'down') + ' to the next level. Go?';
  UI.confirm(label, function () {
    Game.enterMap(st.to, st.at, st.dir);
    Campaign.save(0, true);
  });
};

/* ================= events ================= */
Game.resolveEvent = function (cellChar, ev) {
  const m = D.MAPS[G.mapId];
  const st = Game.stateFor(G.mapId);
  if (ev.safe) {
    if (!st.sites) st.sites = [];
    if (st.sites.includes(cellChar)) { UI.log(ev.text, 'dim'); return; }
    st.sites.push(cellChar);
    UI.log(ev.text, 'good');
    for (const c of G.party) if (!c.dead) c.hp = Math.min(c.maxhp, c.hp + Math.ceil(c.maxhp / 3));
    return;
  }
  if (ev.service === 'heal') {
    UI.log(ev.text, 'good');
    for (const c of G.party) if (!c.dead) c.hp = c.maxhp;
    Journal.add(G.day, 'Healed at a site in ' + m.name + '.');
    return;
  }
  if (ev.chest) {
    if (!st.opened) st.opened = [];
    if (st.opened.includes(cellChar)) { UI.log(ev.text + ' It is empty now.', 'dim'); return; }
    st.opened.push(cellChar);
    UI.log(ev.text);
    Game.giveGold(ev.chest.gold);
    Game.giveItems(ev.chest.items);
    return;
  }
  if (ev.enc) {
    if (!st.encs) st.encs = [];
    if (st.encs.includes(cellChar)) { UI.log(ev.text + ' The dark here is settled.', 'dim'); return; }
    UI.log(ev.enc.text, 'warn');
    const mons = ev.enc.mons.map(([id, n]) => ({ mon: D.MONSTERS[id], count: typeof n === 'string' ? R.d(n) : n }));
    for (const mo of mons) Bestiary.sight(mo.mon.id);
    Combat.start({
      mapId: G.mapId, evKey: cellChar,
      mons: mons,
      text: ev.enc.text,
      gold: ev.enc.gold,
      quest: ev.enc.quest,
      onWin: function () {
        st.encs.push(cellChar);
        if (ev.enc.quest) Game.completeQuest(ev.enc.quest, m);
      }
    });
    return;
  }
  if (ev.text) {
    if (!st.texts) st.texts = [];
    if (!st.texts.includes(cellChar)) {
      st.texts.push(cellChar);
      UI.log(ev.text);
      Journal.add(G.day, ev.text.length > 90 ? ev.text.slice(0, 90) + '…' : ev.text);
    } else {
      UI.log(ev.text, 'dim');
    }
    return;
  }
};

Game.finishCamp = function () {
  Campaign.sleep();
  for (const c of G.party) if (!c.dead) c.hp = Math.min(c.maxhp, c.hp + Math.ceil(c.maxhp / 2));
  UI.log('The camp breaks at dawn. Wounds are quieter.', 'good');
  Journal.add(G.day, 'Camped in the ' + (D.MAPS[G.mapId] ? D.MAPS[G.mapId].name : 'wild') + '.');
  Campaign.save(0, true);
  Game.refreshHud();
  Game.render();
};

Game.triggerTrap = function (trap) {
  const dmg = R.d('1d6');
  const victim = Campaign.alive()[0];
  if (!victim) return;
  const sv = R.rollSave(victim, 1, 0, R.rand);
  UI.log('A trap! ' + trap.type + '.', 'err');
  if (sv.ok) { UI.log(victim.name + ' saves: ' + Math.ceil(dmg / 2) + ' damage.', 'warn'); victim.hp = Math.max(1, victim.hp - Math.ceil(dmg / 2)); }
  else { UI.log(victim.name + ' takes ' + dmg + ' damage.', 'err'); victim.hp = Math.max(0, victim.hp - dmg); if (victim.hp <= 0) { victim.dead = true; UI.log(victim.name + ' is down.', 'err'); } }
  Game.refreshHud();
};

/* ================= services ================= */
Game.openService = function (loc) {
  const kind = loc.kind;
  if (!Campaign.openNow(kind)) {
    UI.log(loc.name + ' is closed at this hour.', 'dim');
    return;
  }
  const m = D.MAPS[G.mapId];
  const modId = G.module || Game.moduleOfMap(G.mapId);
  const tier = (M.MODULES[modId] && M.MODULES[modId].lvl) || 1;
  if (kind === 'shop') {
    UI.shop(loc.name, Campaign.shopStock(G.mapId, tier), null);
  } else if (kind === 'inn') {
    const goods = G.party.filter((c) => !c.dead).map((c) => Campaign.innService(c));
    UI.shop(loc.name + ' (inn)', goods, null);
    const sleepBtn = document.createElement('button');
    sleepBtn.className = 'mbtn';
    sleepBtn.textContent = 'Take a room to dawn';
    sleepBtn.onclick = function () {
      const cost = G.party.filter((c) => !c.dead).length * 5;
      if (G.gold < cost) { UI.log('Not enough gold for rooms.', 'err'); return; }
      G.gold -= cost;
      Campaign.sleep();
      for (const c of G.party) if (!c.dead) c.hp = c.maxhp;
      UI.log('You sleep until dawn, whole and warm.', 'good');
      Journal.add(G.day, 'Stayed the night at ' + loc.name + '.');
      Campaign.save(0, true);
      Game.refreshHud();
      Game.render();
    };
    const modal = UI.stack[UI.stack.length - 1];
    if (modal) modal.querySelector('.mbody').appendChild(sleepBtn);
  } else if (kind === 'temple' || kind === 'training') {
    const goods = Campaign.templeGoods();
    UI.shop(loc.name + (kind === 'training' ? '' : ' (temple)'), goods, null);
  } else if (kind === 'hall') {
    Game.openHall(modId);
  } else if (kind === 'tavern') {
    Game.openTavern(modId, loc.name);
  } else {
    UI.log(loc.name + '.', 'dim');
  }
  Campaign.addTime(30);
  Game.refreshHud();
  Game.render();
};

Game.openHall = function (modId) {
  const mo = M.MODULES[modId];
  if (!mo) return;
  const body = document.createElement('div');
  body.className = 'hall';
  const rumors = Campaign.hallRumors(modId);
  const rhead = document.createElement('div');
  rhead.className = 'etitle';
  rhead.textContent = 'Rumors in ' + (M.SERVICES[modId] && M.SERVICES[modId].hall || 'the hall');
  body.appendChild(rhead);
  for (const r of rumors) {
    const p = document.createElement('p');
    p.className = 'dim';
    p.textContent = '· ' + r;
    body.appendChild(p);
  }
  /* commissions */
  const chead = document.createElement('div');
  chead.className = 'etitle';
  chead.textContent = 'Commissions';
  body.appendChild(chead);
  const allQuests = (mo.quests || []).concat(mo.side || []);
  for (const qid of allQuests) {
    const q = D.QUESTS[qid];
    if (!q) continue;
    const done = G.quests[qid] === 'done';
    const row = document.createElement('div');
    row.className = 'hquest' + (done ? ' done' : '');
    let detail = q.offer;
    let action = null;
    if (done) { detail = q.done; }
    else if (q.side && q.needItem) {
      const has = G.party.some((c) => c.inv.includes(q.needItem));
      if (has) {
        detail = 'The ' + (D.item(q.needItem) ? D.item(q.needItem).name : q.needItem) + ' is in the pack. Turn it in?';
        action = 'turnin';
      }
    }
    row.innerHTML = '<b>' + (q.side ? 'Side: ' : '') + q.name + '</b>' + (done ? ' <span class="dim">— done</span>' : '') +
      '<div class="dim">' + detail + '</div>' +
      (q.gold ? '<div class="dim">Reward: ' + q.gold + ' gp' + (q.xp ? ' · ' + q.xp + ' XP' : '') + '</div>' : '');
    if (action === 'turnin') {
      const b = document.createElement('button');
      b.className = 'mbtn';
      b.textContent = 'Turn in the ' + (D.item(q.needItem) ? D.item(q.needItem).name : 'item');
      b.onclick = function () {
        for (const c of G.party) { const i = c.inv.indexOf(q.needItem); if (i >= 0) { c.inv.splice(i, 1); break; } }
        Game.completeQuest(qid, D.MAPS[G.mapId]);
        UI.closeTop();
        Game.openHall(modId);
      };
      row.appendChild(b);
    }
    body.appendChild(row);
  }
  UI.modal('The Hall — ' + mo.name, body, { wide: true });
};

Game.openTavern = function (modId, name) {
  const mo = M.MODULES[modId];
  if (!mo) return;
  const rumors = (mo.rumors || []).slice(0, 3);
  const body = document.createElement('div');
  body.innerHTML = '<p class="dim">The ' + name + '. The ale is honest and the talk is half true.</p>' +
    rumors.map((r) => '<p class="dim">· ' + r + '</p>').join('');
  const b = document.createElement('button');
  b.className = 'mbtn';
  b.textContent = 'Sit a while (30 min, +1 HP each)';
  b.onclick = function () {
    Campaign.addTime(30);
    for (const c of G.party) if (!c.dead) c.hp = Math.min(c.maxhp, c.hp + 1);
    UI.log('The hour passes. Something mends.', 'good');
    UI.closeTop();
    Game.refreshHud();
    Game.render();
  };
  body.appendChild(b);
  UI.modal(name, body);
};

/* ================= quests / modules ================= */
Game.completeQuest = function (qid, map) {
  const q = D.QUESTS[qid];
  if (!q || G.quests[qid] === 'done') return;
  G.quests[qid] = 'done';
  G.gold += q.gold || 0;
  Campaign.xpSplit(q.xp || 0);
  UI.log('Quest complete: ' + q.name + '. (' + (q.gold || 0) + ' gp, ' + (q.xp || 0) + ' XP)', 'good');
  Journal.add(G.day, 'Done: ' + q.name + '. ' + (q.done || ''));
  /* main deed -> module done */
  const modId = G.module || Game.moduleOfMap(map ? map.id : G.mapId);
  const mo = M.MODULES[modId];
  if (mo && (mo.quests || []).includes(qid)) Game.completeModule(modId);
};

Game.completeModule = function (modId) {
  const mo = M.MODULES[modId];
  if (G.camp.done && G.camp.done[modId]) return;
  G.camp.done = G.camp.done || {};
  G.camp.done[modId] = true;
  G.gold += mo.gold || 0;
  Campaign.xpSplit(Math.round((mo.gold || 0) * 6));
  Journal.finishModule(modId, G.day);
  UI.log('◆ ' + mo.name + ' is done. The ' + (mo.names ? mo.names.place : '') + ' pays ' + (mo.gold || 0) + ' gp.', 'good');
  Campaign.save(0, true);
  /* victory panel */
  const body = document.createElement('div');
  body.className = 'msgbox';
  body.innerHTML = '<h2>' + mo.name + ' — done</h2><p>' + (mo.victory || 'The work is finished.') + '</p>';
  if (mo.next) {
    const nx = M.MODULES[mo.next];
    const b = document.createElement('button');
    b.className = 'mbtn primary';
    b.textContent = 'Journey on to ' + nx.name;
    b.onclick = function () {
      UI.closeAll();
      Campaign.journey(modId, mo.next);
      G.module = mo.next;
      Game.enterMap(nx.hub, D.MAPS[nx.hub].start, D.MAPS[nx.hub].start.dir);
      Campaign.save(0, true);
    };
    body.appendChild(b);
  }
  const b2 = document.createElement('button');
  b2.className = 'mbtn';
  b2.textContent = 'Stay here';
  b2.onclick = function () { UI.closeTop(); };
  body.appendChild(b2);
  UI.modal('The Adventure Is Done', body);
};

/* ================= title / campaign / assembly ================= */
Game.showScreen = function (id) {
  for (const s of ['title', 'campaign', 'assembly', 'game']) {
    const el = document.getElementById(s);
    if (el) el.classList.toggle('hidden', s !== id);
  }
};

Game.toTitle = function () {
  G.mode = 'title';
  Game.showScreen('title');
  const cont = document.getElementById('bContinue');
  if (cont) cont.style.display = Campaign.readSlot(0) ? '' : 'none';
  Game.ember();
};

Game.ember = function () {
  const cv = document.getElementById('emberCv');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  cv.width = cv.clientWidth || 800; cv.height = cv.clientHeight || 300;
  let t = 0;
  const embers = [];
  for (let i = 0; i < 40; i++) embers.push({ x: Math.random() * cv.width, y: Math.random() * cv.height, s: 1 + Math.random() * 2, v: 0.3 + Math.random() * 0.8 });
  (function loop() {
    if (G.mode !== 'title') return;
    t += 0.016;
    ctx.fillStyle = 'rgba(10,6,4,0.25)';
    ctx.fillRect(0, 0, cv.width, cv.height);
    for (const e of embers) {
      e.y -= e.v; e.x += Math.sin(t + e.y * 0.02) * 0.3;
      if (e.y < 0) { e.y = cv.height; e.x = Math.random() * cv.width; }
      ctx.fillStyle = 'rgba(230,140,50,' + (0.4 + 0.4 * Math.sin(t * 3 + e.x)) + ')';
      ctx.fillRect(e.x, e.y, e.s, e.s);
    }
    requestAnimationFrame(loop);
  })();
};

Game.newGame = function () {
  G.mode = 'campaign';
  Game.showScreen('campaign');
  Game.buildCampaign();
};

Game.buildCampaign = function () {
  const tabs = document.getElementById('campTabs');
  const cards = document.getElementById('campCards');
  const detail = document.getElementById('campCard');
  if (!tabs) return;
  tabs.innerHTML = '';
  cards.innerHTML = '';
  detail.innerHTML = '';
  for (const camp of A.CAMPAIGNS) {
    const b = document.createElement('button');
    b.className = 'tab' + (G.camp.tab === camp.id ? ' on' : '');
    b.textContent = camp.name;
    b.onclick = function () { G.camp.tab = camp.id; Game.buildCampaign(); };
    tabs.appendChild(b);
  }
  const camp = A.CAMPAIGNS.find((c) => c.id === G.camp.tab) || A.CAMPAIGNS[0];
  for (const modId of camp.order) {
    const mo = M.MODULES[modId];
    const done = G.camp.done && G.camp.done[modId];
    const card = document.createElement('div');
    card.className = 'card mod' + (done ? ' done' : '');
    card.innerHTML = '<b>' + mo.code + '</b> — ' + mo.name +
      '<div class="dim">Level ' + mo.lvl + ' · ' + mo.size + ' · ' + mo.length + '</div>' +
      '<div class="dim">' + (done ? 'Done.' : (mo.blurb || '')) + '</div>';
    card.onclick = function () {
      document.getElementById('campModName').textContent = mo.code + ' — ' + mo.name;
      detail.innerHTML =
        '<h3>' + mo.name + '</h3>' +
        '<p class="dim">' + mo.intro + '</p>' +
        '<p><b>Length:</b> ' + mo.length + ' · <b>Difficulty:</b> ' + '◆'.repeat(mo.diff) + '<span class="dim">' + '◇'.repeat(4 - mo.diff) + '</span></p>' +
        '<p class="dim"><b>Hint:</b> ' + mo.hint + '</p>';
      G.camp.module = modId;
      Game.renderPartyNote();
    };
    cards.appendChild(card);
  }
  const as = document.getElementById('bCampAssemble');
  if (as) as.disabled = !G.camp.module;
  Game.renderPartyNote();
};

Game.renderPartyNote = function () {
  const el = document.getElementById('campPartyNote');
  if (el) el.textContent = G.party.length ? (G.party.length + ' in the company: ' + G.party.map((c) => c.name).join(', ')) : 'No company yet.';
};

Game.startAssembly = function () {
  const modId = G.camp.module;
  if (!modId) { UI.log('Choose an adventure first.', 'err'); return; }
  const mo = M.MODULES[modId];
  G.mode = 'assembly';
  Game.showScreen('assembly');
  document.getElementById('asModName').textContent = mo.code + ' — ' + mo.name;
  const intro = document.getElementById('asIntro');
  if (intro) intro.innerHTML = '<b>' + mo.name + '</b><p class="dim">' + mo.intro + '</p>';
  Game.buildAssembly();
};

Game.buildAssembly = function () {
  const wait = document.getElementById('asWait');
  const active = document.getElementById('asActive');
  const funds = document.getElementById('asFunds');
  if (!wait) return;
  wait.innerHTML = '';
  active.innerHTML = '';
  if (funds) funds.textContent = 'Party gold: ' + G.gold + ' gp';
  const rosterRow = (c, onRemove) => {
    const row = document.createElement('div');
    row.className = 'roster-row';
    const fig = window.Fig.portrait(window.Fig.figForChar(c), 40, '#14100c');
    row.appendChild(fig);
    const info = document.createElement('div');
    info.className = 'pinfo';
    info.innerHTML = '<b>' + c.name + '</b> <span class="dim">' + R.RACES[c.race].name + ' ' + R.CLASSES[c.cls].name + ' ' + c.lvl + '</span><br><span class="dim">HP ' + c.maxhp + ' · THAC0 ' + R.thac0For(c) + '</span>';
    row.appendChild(info);
    if (onRemove) {
      const b = document.createElement('button');
      b.className = 'mbtn';
      b.textContent = 'Remove';
      b.onclick = onRemove;
      row.appendChild(b);
    }
    return row;
  };
  /* waiting: pregens + any bench chars */
  for (const p of D.PREGENS) {
    if (G.party.some((c) => c.id === 'pre_' + p.id)) continue;
    const row = document.createElement('div');
    row.className = 'roster-row';
    const c = R.newChar({ race: p.race, cls: p.cls, name: p.name, scores: p.scores, spec: p.spec, foe: p.foe, align: p.align, color: p.color, level: 1, kit: false }, R.mulberry32(99));
    c.id = 'pre_' + p.id;
    c.color = p.color;
    for (const id of (p.gear || [])) c.inv.push(id);
    for (const id of c.inv.slice()) {
      const it = D.item(id);
      if (!it) continue;
      if (it.type === 'w' && !c.eq.w) c.eq.w = id;
      else if (it.type === 'a' && !c.eq.a) c.eq.a = id;
      else if (it.type === 's' && !c.eq.s) c.eq.s = id;
      else if (it.type === 'm' && !c.eq.m) c.eq.m = id;
    }
    row.appendChild(rosterRow(c, null));
    const b = document.createElement('button');
    b.className = 'mbtn';
    b.textContent = 'Enlist';
    b.onclick = function () {
      if (G.party.length >= 6) { UI.log('The company is full (six).', 'err'); return; }
      c.id = 'pc' + Math.floor(Math.random() * 1e9).toString(36);
      G.party.push(c);
      Game.buildAssembly();
      Game.renderPartyNote();
    };
    row.appendChild(b);
    wait.appendChild(row);
  }
  /* active */
  G.party.forEach((c, i) => {
    active.appendChild(rosterRow(c, function () { G.party.splice(i, 1); Game.buildAssembly(); Game.renderPartyNote(); }));
  });
  if (!G.party.length) {
    const e = document.createElement('p');
    e.className = 'dim';
    e.textContent = 'The field is empty. Enlist from the left or raise a new recruit.';
    active.appendChild(e);
  }
};

Game.beginAdventure = function () {
  const modId = G.camp.module;
  if (!modId) return;
  if (!G.party.length) { UI.log('Enlist at least one hero.', 'err'); return; }
  const mo = M.MODULES[modId];
  G.started = true;
  G.module = modId;
  G.day = 1; G.hour = 8; G.minute = 0;
  G.quests = {};
  Journal.setComm(modId, 'progress');
  G.mode = 'play';
  Game.showScreen('game');
  Game.enterMap(mo.hub, D.MAPS[mo.hub].start, D.MAPS[mo.hub].start.dir);
  UI.log(mo.intro, 'good');
  Journal.add(G.day, 'The company takes up ' + mo.name + '.');
  Campaign.save(0, true);
  Game.render();
  Game.ensureLoop();
};

Game.bringParty = function () {
  const body = document.createElement('div');
  body.className = 'slots';
  body.innerHTML = '<p class="dim">Bring a saved company into this adventure.</p>';
  for (let i = 0; i <= 3; i++) {
    const data = Campaign.readSlot(i);
    const row = document.createElement('div');
    row.className = 'slotrow';
    if (data) {
      row.innerHTML = '<b>' + (i === 0 ? 'Auto' : 'Slot ' + i) + '</b> — ' + (data.name || 'Party') + ' · Day ' + data.day + ' · ' + data.party.length + ' heroes';
      const b = document.createElement('button');
      b.className = 'mbtn';
      b.textContent = 'Bring';
      b.onclick = function () {
        G.party = data.party.slice();
        G.gold = data.gold;
        UI.closeTop();
        Game.buildAssembly();
        Game.renderPartyNote();
      };
      row.appendChild(b);
    } else {
      row.innerHTML = '<b>' + (i === 0 ? 'Auto' : 'Slot ' + i) + '</b> <span class="dim">— empty</span>';
    }
    body.appendChild(row);
  }
  UI.modal('Bring a Party', body);
};

/* ================= save / load ================= */
Game.save = function (slot, auto) {
  const ok = Campaign.save(slot, auto);
  if (ok) UI.log((auto ? 'Auto-saved.' : 'Saved.'), 'dim');
  return ok;
};
Game.load = function (slot) {
  if (Campaign.load(slot)) {
    Game.showScreen('game');
    UI.log('Loaded. The road continues.', 'good');
    Game.render();
    Game.ensureLoop();
  } else UI.log('Nothing to load there.', 'err');
};
Game.slots = function (mode) {
  UI.slots(mode || 'save');
};

/* ================= input ================= */
Game.press = function (act) {
  if (G.mode === 'combat') return;
  if (UI.stack.length) {
    if (act === 'escape') UI.closeTop();
    return;
  }
  switch (act) {
    case 'n': Game.move(0); break;
    case 's': Game.move(2); break;
    case 'e': Game.move(1); break;
    case 'w': Game.move(3); break;
    case 'left': Game.turn(-1); break;
    case 'right': Game.turn(1); break;
    case 'interact': Game.interact(); break;
    case 'wait': Game.wait(); break;
    case 'rest': Game.rest(); break;
    case 'map': MapUI.toggle({ map: D.MAPS[G.mapId], seen: G.seen[G.mapId], px: G.px, py: G.py, dir: G.dir, services: Game.servicesForMap(D.MAPS[G.mapId]) }); break;
    case 'journal': Journal.open(); break;
    case 'bestiary': Bestiary.open(); break;
    case 'menu': UI.menu(); break;
    case 'party': UI.renderParty(); const p = document.getElementById('party'); if (p) p.classList.toggle('hidden'); break;
    case 'help': UI.help(); break;
  }
};

Game.resume = function () { /* menu continue */ };

Game.onKey = function (e) {
  const k = e.key;
  if (G.mode === 'combat') { Combat.onKey(k.toLowerCase()); e.preventDefault(); return; }
  if (G.mode === 'title' || G.mode === 'campaign' || G.mode === 'assembly') return;
  let act = null;
  if (k === 'ArrowUp' || k === 'w') act = 'n';
  else if (k === 'ArrowDown' || k === 's') act = 's';
  else if (k === 'ArrowRight' || k === 'd') act = 'e';
  else if (k === 'ArrowLeft' || k === 'a') act = 'w';
  else if (k === 'q' || k === 'z') act = 'left';
  else if (k === 'e' || k === 'x') act = 'right';
  else if (k === 'Enter' || k === ' ') act = G.lastMove != null ? null : 'interact';
  else if (k === 'f' || k === 'F') act = 'wait';
  else if (k === 'r' || k === 'R') act = 'rest';
  else if (k === 'm' || k === 'M') act = 'map';
  else if (k === 'j' || k === 'J') act = 'journal';
  else if (k === 'b' || k === 'B') act = 'bestiary';
  else if (k === 'h' || k === '?') act = 'help';
  else if (k === 'p' || k === 'P') act = 'party';
  else if (k === 'Escape') act = 'menu';
  else if (k === ' ') { act = G.lastMove != null ? 'repeat' : 'interact'; }
  if (act === 'repeat' && G.lastMove != null) { Game.move(G.lastMove); e.preventDefault(); return; }
  if (act) { Game.press(act); e.preventDefault(); }
};

/* ================= init ================= */
Game.ensureLoop = function () {
  if (rafId) return;
  (function loop() {
    if (G.mode === 'play' || G.mode === 'overland') Game.render();
    rafId = requestAnimationFrame(loop);
  })();
};

Game.init = function () {
  if (!document.getElementById || !document.getElementById('view3d')) return; /* no DOM (node) */
  V3.init(document.getElementById('view3d'));
  Combat.init(document.getElementById('combatCanvas'));
  MapUI.init();
  Nav.init();
  /* title buttons */
  const bNew = document.getElementById('bNew');
  if (bNew) bNew.onclick = function () { G.party = []; G.gold = 25; G.day = 1; G.quests = {}; G.camp = { tab: 'saga', module: null, done: {} }; Game.newGame(); };
  const bContinue = document.getElementById('bContinue');
  if (bContinue) bContinue.onclick = function () { Game.load(0); };
  const bLoad = document.getElementById('bLoad');
  if (bLoad) bLoad.onclick = function () { UI.slots('load'); };
  const bHow = document.getElementById('bHow');
  if (bHow) bHow.onclick = UI.help;
  /* campaign footer */
  const bCampBack = document.getElementById('bCampBack');
  if (bCampBack) bCampBack.onclick = Game.toTitle;
  const bCampImport = document.getElementById('bCampImport');
  if (bCampImport) bCampImport.onclick = Game.bringParty;
  const bCampAssemble = document.getElementById('bCampAssemble');
  if (bCampAssemble) bCampAssemble.onclick = Game.startAssembly;
  /* assembly footer */
  const bAsBack = document.getElementById('bAsBack');
  if (bAsBack) bAsBack.onclick = function () { Game.mode = 'campaign'; Game.showScreen('campaign'); };
  const bAsCreate = document.getElementById('bAsCreate');
  if (bAsCreate) bAsCreate.onclick = function () {
    UI.charCreate(function (c) {
      if (G.party.length >= 6) { UI.log('The company is full (six).', 'err'); return; }
      G.party.push(c);
      Game.buildAssembly();
      Game.renderPartyNote();
    });
  };
  const bAsBegin = document.getElementById('bAsBegin');
  if (bAsBegin) bAsBegin.onclick = Game.beginAdventure;
  /* hud buttons */
  const bParty = document.getElementById('bParty');
  if (bParty) bParty.onclick = function () { const p = document.getElementById('party'); if (p) p.classList.toggle('hidden'); };
  const bMenu = document.getElementById('bMenu');
  if (bMenu) bMenu.onclick = function () { if (G.mode !== 'title') UI.menu(); };
  /* keyboard */
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    Game.onKey(e);
  });
  window.addEventListener('resize', function () { if (G.mode === 'title') Game.ember(); });
  Game.toTitle();
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', Game.init);
else Game.init();
})();
