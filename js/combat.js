/* Emberfall — combat.js
 * Tactical board: 9x7 isometric grid, initiative 1-10, melee/missile/
 * spell/item/wait/flee, THAC0 resolution, monster specials, XP and gold.
 * Combat.start(spec) takes over the screen; result via onWin/onLose/onFlee. */
'use strict';
(function () {
const Combat = window.Combat = {};
const R = window.R;

const COLS = 9, ROWS = 7;
const TW = 52, TH = 26; /* tile diamond */
let cv = null, ctx = null;
let S = null; /* active combat state */

Combat.cv = null;
Combat.state = function () { return S; };
Combat.init = function (canvas) {
  cv = canvas;
  cv.width = 560; cv.height = 380;
  ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  cv.addEventListener('click', Combat.onClick);
  if (!document.getElementById('combat-actions')) {
    const bar = document.createElement('div');
    bar.id = 'combat-actions';
    bar.className = 'combat-actions';
    const low = document.getElementById('lower');
    if (low) low.insertBefore(bar, low.firstChild);
  }
  if (!document.getElementById('combat-status')) {
    const st = document.createElement('div');
    st.id = 'combat-status';
    st.className = 'combat-status';
    const low = document.getElementById('lower');
    if (low) low.insertBefore(st, low.firstChild);
  }
};
Combat.show = function () {
  const v = document.getElementById('view3d'); if (v) v.classList.add('hidden');
  const o = document.getElementById('overCanvas'); if (o) o.classList.add('hidden');
  if (cv) cv.classList.remove('hidden');
};
Combat.hide = function () {
  if (cv) cv.classList.add('hidden');
  const v = document.getElementById('view3d'); if (v) v.classList.remove('hidden');
  const a = document.getElementById('combat-actions'); if (a) a.innerHTML = '';
  const st = document.getElementById('combat-status'); if (st) st.textContent = '';
};

/* tile <-> screen */
function tileXY(x, y) {
  return { sx: 80 + (x - y) * TW / 2, sy: 60 + (x + y) * TH / 2 };
}
function screenTile(sx, sy) {
  const ax = (sx - 80) / (TW / 2), ay = (sy - 60) / (TH / 2);
  const x = Math.round((ay + ax) / 2), y = Math.round((ay - ax) / 2);
  return { x: x, y: y };
}

function inBoard(x, y) { return x >= 0 && y >= 0 && x < COLS && y < ROWS; }
function occupant(x, y) { return S.units.find((u) => !u.dead && u.x === x && u.y === y); }
function cheb(a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); }

/* ---------- unit setup ---------- */
function pcUnit(c, x, y) {
  const der = R.derived(c);
  return {
    kind: 'pc', c: c, name: c.name,
    x: x, y: y, hp: c.hp, maxhp: c.maxhp,
    ac: der.ac, thac0: der.thac0, mv: Math.min(3, Math.max(2, Math.floor(der.mv / 4))),
    dexMod: R.abilityMod(c.ab.DEX),
    asleep: 0, invis: false, haste: 0, prot: 0,
    dead: false, acted: false
  };
}
function monUnit(mon, count, x, y, hidden) {
  const hp = R.d(mon.hp);
  return {
    kind: 'mon', mon: mon, name: mon.name,
    x: x, y: y, hp: hp, maxhp: hp,
    ac: mon.ac, thac0: mon.thac0,
    mv: Math.min(3, Math.max(1, Math.floor((mon.mv || 12) / 4))),
    dexMod: 0,
    count: count || 1,
    hidden: !!hidden,
    asleep: 0, dead: false, acted: false,
    poison: 0
  };
}

/* ---------- start ---------- */
Combat.start = function (spec) {
  G.mode = 'combat';
  const units = [];
  const party = G.party.filter((c) => !c.dead && c.hp > 0);
  let py = 0;
  for (let i = 0; i < party.length; i++) {
    units.push(pcUnit(party[i], 1, Math.min(ROWS - 1, 1 + i * Math.floor((ROWS - 2) / Math.max(1, party.length - 1)) || 0)));
  }
  /* monsters on the right, clustered by count */
  let slots = [];
  for (let y = 0; y < ROWS; y++) for (let x = COLS - 2; x >= 5; x--) slots.push([x, y]);
  slots = slots.sort(() => R.rand() - 0.5).slice(0, 14);
  for (const m of spec.mons) {
    const n = Math.max(1, m.count);
    for (let k = 0; k < Math.min(n, 7); k++) {
      const s = slots.pop() || [COLS - 1, 0];
      units.push(monUnit(m.mon, k === 0 ? n : 1, s[0], s[1], m.hidden));
    }
  }
  S = {
    spec: spec,
    units: units,
    round: 0,
    order: [],
    active: null,
    phase: 'setup', /* setup | player | ai | over */
    pending: null, /* {action: 'move'|'atk'|'mis'|'spell'|'item', spell?} */
    surprise: !!(spec.mons && spec.mons.some((m) => m.hidden)),
    log: [],
    result: null,
    sel: null
  };
  Combat.show();
  UI.clearLog();
  UI.log(spec.text || 'The watch sounds. Draw steel.', 'warn');
  if (S.surprise) UI.log('You are surprised — the first blow is not yours.', 'err');
  for (const u of units) if (u.kind === 'mon') Bestiary.sight(u.mon.id);
  for (const u of units) if (u.kind === 'mon') Bestiary.fight(u.mon.id);
  Combat.render();
  Combat.nextRound();
};

function log(msg, cls) {
  S.log.push(msg);
  UI.log(msg, cls);
}

/* ---------- rounds ---------- */
Combat.nextRound = function () {
  if (S.result) return;
  S.round++;
  const alive = S.units.filter((u) => !u.dead && u.hp > 0);
  if (!alive.some((u) => u.kind === 'pc')) { Combat.end('lose'); return; }
  if (!alive.some((u) => u.kind === 'mon')) { Combat.end('win'); return; }
  /* clear transient state */
  for (const u of alive) {
    u.acted = false;
    if (u.asleep > 0) u.asleep--;
    if (u.haste > 0) u.haste--;
    if (u.prot > 0) u.prot--;
    if (u.kind === 'mon' && u.mon.regen && u.hp < u.maxhp) u.hp = Math.min(u.maxhp, u.hp + u.mon.regen);
    if (u.poison > 0) {
      u.poison--;
      const d = R.d('1d6');
      u.hp -= d;
      log(u.name + ' takes ' + d + ' poison damage.');
      if (u.hp <= 0) { u.hp = 0; Combat.killUnit(u); }
    }
  }
  /* initiative: d10 + dex, party breaks ties */
  const order = alive.map((u) => ({
    u: u,
    v: R.d('d10', R.rand) + u.dexMod + (u.haste > 0 ? 2 : 0) + (S.surprise && u.kind === 'pc' && S.round === 1 ? -3 : 0)
  }));
  order.sort((a, b) => b.v - a.v || (a.u.kind === 'pc' ? 1 : 0) - (b.u.kind === 'pc' ? 1 : 0) || a.u.dexMod - b.u.dexMod);
  S.order = order.filter((o) => !o.u.dead && o.u.hp > 0).map((o) => o.u);
  S.idx = 0;
  log('— Round ' + S.round + ' —', 'dim');
  Combat.actNext();
};

Combat.actNext = function () {
  if (S.result) return;
  while (S.idx < S.order.length) {
    const u = S.order[S.idx];
    if (!u.dead && u.hp > 0) break;
    S.idx++;
  }
  if (S.idx >= S.order.length) { Combat.nextRound(); return; }
  const u = S.order[S.idx];
  S.active = u;
  if (u.asleep > 0) {
    log(u.name + ' sleeps.', 'dim');
    S.idx++;
    Combat.render();
    setTimeout(Combat.actNext, 350);
    return;
  }
  if (u.kind === 'pc') {
    S.phase = 'player';
    S.pending = null;
    Combat.render();
    Combat.promptActions();
  } else {
    S.phase = 'ai';
    Combat.render();
    setTimeout(() => Combat.aiTurn(u), 420);
  }
};

/* ---------- actions ---------- */
function moveOptions(u) {
  const out = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const d = Math.max(Math.abs(x - u.x), Math.abs(y - u.y));
    if (d < 1 || d > u.mv) continue;
    if (occupant(x, y)) continue;
    out.push({ x: x, y: y });
  }
  return out;
}
function targetsMelee(u) {
  return S.units.filter((t) => !t.dead && t.hp > 0 && t.kind !== u.kind && cheb(t, u) <= 1);
}
function targetsMissile(u) {
  return S.units.filter((t) => !t.dead && t.hp > 0 && t.kind !== u.kind && cheb(t, u) >= 2 && cheb(t, u) <= 4);
}

Combat.promptActions = function () {
  const u = S.active;
  const c = u.c;
  const w = R.worn(c);
  const bar = document.getElementById('combat-actions');
  if (!bar) return;
  bar.innerHTML = '';
  const mk = (label, key, enabled, fn, title) => {
    const b = document.createElement('button');
    b.className = 'abtn' + (enabled ? '' : ' off');
    b.textContent = key + ' ' + label;
    b.title = title || '';
    if (enabled) b.onclick = fn;
    bar.appendChild(b);
  };
  mk('Move', '1', true, function () { Combat.begin('move'); }, 'Move up to ' + u.mv + ' tiles');
  mk('Attack', '2', targetsMelee(u).length > 0, function () { Combat.begin('atk'); });
  const mis = w.m || (w.w && w.w.thrown ? w.w : null);
  const misOk = !!mis && targetsMissile(u).length > 0;
  mk('Throw ' + (mis ? D.itemName(mis.id ? mis.id : '') : '—'), '3', misOk, function () { Combat.begin('mis'); });
  const memCount = R.memCount(c);
  mk('Spell', '4', memCount > 0, function () { Combat.begin('spell'); });
  const potions = c.inv.filter((id) => { const it = D.item(id); return it && it.type === 'd' && /potion/i.test(it.name); });
  mk('Potion', '5', potions.length > 0, function () { Combat.begin('item', potions); });
  mk('Wait', '6', true, function () { Combat.doWait(u); });
  mk('Flee', '7', u.kind === 'pc', function () { Combat.doFlee(u); }, 'Run the line: DEX check');
};

Combat.begin = function (action, extra) {
  if (!S || S.phase !== 'player') return;
  S.pending = { action: action, extra: extra };
  S.sel = null;
  Combat.render();
  log('Choose a ' + (action === 'move' ? 'tile to move to' : action === 'atk' ? 'target to strike' : action === 'mis' ? 'target to throw at' : action === 'spell' ? 'target' : 'target') + ' (arrows, then Enter; Esc cancels).', 'dim');
};

Combat.cancelPending = function () {
  if (!S || !S.pending) return;
  S.pending = null;
  Combat.render();
  Combat.promptActions();
};

Combat.choose = function (x, y) {
  if (!S || !S.pending || S.phase !== 'player') return;
  const u = S.active;
  const p = S.pending;
  if (p.action === 'move') {
    const opts = moveOptions(u);
    if (!opts.some((o) => o.x === x && o.y === y)) return;
    u.x = x; u.y = y;
    log(u.name + ' moves.');
    Combat.endTurn(u);
  } else if (p.action === 'atk') {
    const t = occupant(x, y);
    if (!t || t.kind === u.kind || t.dead || t.hp <= 0) return;
    if (cheb(t, u) > 1) return;
    Combat.meleeAttack(u, t);
    Combat.endTurn(u);
  } else if (p.action === 'mis') {
    const t = occupant(x, y);
    if (!t || t.kind === u.kind || t.dead) return;
    if (cheb(t, u) < 2 || cheb(t, u) > 4) return;
    Combat.missileAttack(u, t);
    Combat.endTurn(u);
  } else if (p.action === 'spell') {
    if (p.spell) {
      const t = occupant(x, y);
      Combat.castSpell(u, p.spell, t);
      Combat.endTurn(u);
    } else {
      /* open spell list */
      const list = Combat.spellList(u);
      const body = document.createElement('div');
      body.className = 'spellpick';
      for (const [id, n] of list) {
        const def = D.SPELLS[id];
        const row = document.createElement('div');
        row.className = 'cc-row';
        row.innerHTML = '<b>' + def.n + '</b> <span class="dim">— ' + def.l + 'th level, range ' + def.range + ' — ' + def.desc + '</span>';
        row.onclick = function () {
          UI.closeTop();
          if (def.tgt === 'area' || def.tgt === 'party') {
            S.pending.spell = id;
            Combat.castSpell(S.active, id, null);
            Combat.endTurn(S.active);
          } else {
            S.pending.spell = id;
            Combat.render();
            log('Choose a target for ' + def.n + '.', 'dim');
          }
        };
        body.appendChild(row);
      }
      UI.modal(u.name + ' — cast', body);
    }
  } else if (p.action === 'item') {
    const t = occupant(x, y);
    const it = p.extra[0];
    Combat.drinkPotion(u, t || u, it);
    Combat.endTurn(u);
  }
};

Combat.spellList = function (u) {
  const c = u.c;
  const out = [];
  for (const id in (c.mem || {})) {
    if ((c.mem[id] || 0) > 0 && D.SPELLS[id]) out.push([id, c.mem[id]]);
  }
  return out;
};

Combat.doWait = function (u) {
  log(u.name + ' waits.');
  Combat.endTurn(u);
};
Combat.doFlee = function (u) {
  const roll = R.d20(R.rand) + u.dexMod;
  const need = 12;
  if (roll >= need) {
    log(u.name + ' breaks for the line (' + roll + ' vs ' + need + ').', 'good');
    Combat.end('flee');
  } else {
    log(u.name + ' tries to run and the dark is not interested (' + roll + ' vs ' + need + ').', 'err');
    Combat.endTurn(u);
  }
};

Combat.endTurn = function (u) {
  u.acted = true;
  S.pending = null;
  S.idx++;
  Combat.render();
  setTimeout(Combat.actNext, 200);
};

/* ---------- combat resolution ---------- */
function hitRoll(attacker, defender) {
  const d20 = R.d20(R.rand);
  let thac0, hitMod, ac;
  if (attacker.kind === 'pc') {
    thac0 = R.thac0For(attacker.c);
    const w = R.worn(attacker.c).w;
    hitMod = R.meleeHitMod(attacker.c, w, defender.kind === 'mon' ? defender.mon : null);
    ac = defender.ac - (defender.prot ? defender.prot : 0);
  } else {
    thac0 = attacker.thac0;
    hitMod = 0;
    ac = defender.ac;
    if (defender.invis) hitMod -= 2;
  }
  const helpless = defender.asleep > 0;
  const res = R.attack(d20, hitMod, thac0, ac, helpless, R.rand);
  return Object.assign(res, { d20: d20, thac0: thac0, ac: ac });
}

function applyDamage(u, dmg, src) {
  if (u.kind === 'mon' && u.mon.immune && u.mon.immune.includes(src)) {
    log(u.name + ' shrugs off the ' + src + '.', 'dim');
    return 0;
  }
  let d = dmg;
  if (u.kind === 'mon' && u.mon.vuln && u.mon.vuln.includes(src)) d = Math.round(d * 1.5);
  if (u.size && u.size === 'S') d = Math.max(1, Math.floor(d / 2));
  u.hp -= d;
  if (u.hp <= 0) {
    u.hp = 0;
    Combat.killUnit(u);
  }
  return d;
}

Combat.meleeAttack = function (u, t) {
  const res = hitRoll(u, t);
  const label = u.name + ' strikes ' + t.name;
  if (res.hit) {
    let dmg;
    if (u.kind === 'pc') {
      const w = R.worn(u.c).w;
      const size = t.kind === 'mon' ? t.mon.size : 'M';
      const roll = R.dmgRoll(w || { dmg: '1d4' }, size, R.rand);
      dmg = roll.t + (w ? Math.max(0, R.strMod(u.c)) : 0) + (w && w.ench ? w.ench : 0);
    } else {
      dmg = R.d((t.kind === 'pc' ? (t.mon && t.mon.size) || 'M' : 'M') === 'S' && u.mon.dmgS ? u.mon.dmgS : u.mon.atk[0] || '1d6', R.rand);
      if (u.mon.ench) dmg += u.mon.ench;
    }
    const dealt = applyDamage(t, dmg, 'blunt');
    log(label + ': hit, ' + dealt + ' damage (' + res.d20 + ' vs need ' + (res.thac0 - res.ac) + ').');
    if (u.kind === 'pc') {
      const mon = t.mon;
      if (mon.venom) Combat.venom(t, mon.venom);
      if (mon.drain) { const dd = R.d(mon.drain); t.hp -= dd; log(t.name + ' is drained of ' + dd + ' by the touch.'); if (t.hp <= 0) { t.hp = 0; Combat.killUnit(t); } }
      if (mon.paralyze) {
        const sv = R.rollSave(t.c, 0, 0, R.rand);
        if (!sv.ok) { t.asleep = 2; log(t.name + ' is paralyzed!', 'err'); }
        else log(t.name + ' resists the paralyzing touch.');
      }
    }
    if (t.invis) { t.invis = false; log(t.name + '’s concealment breaks.'); }
  } else {
    log(label + ': miss (' + res.d20 + ' vs need ' + (res.thac0 - res.ac) + ').');
    if (t.invis) { t.invis = false; log(t.name + ' flinches into the open.'); }
  }
};

Combat.missileAttack = function (u, t) {
  const w = u.kind === 'pc' ? (R.worn(u.c).m || (R.worn(u.c).w && R.worn(u.c).w.thrown ? R.worn(u.c).w : null)) : null;
  const res = hitRoll(u, t);
  /* range penalty */
  const dist = cheb(u, t);
  const adj = dist >= 4 ? 1 : 0;
  const res2 = { hit: res.hit || (R.d20(R.rand) >= (res.thac0 - res.ac + adj)), d20: res.d20, thac0: res.thac0, ac: res.ac };
  if (res2.hit) {
    const dmg = w ? R.d(w.thrown || w.dmg, R.rand).t : 1;
    const dealt = applyDamage(t, dmg + (w && w.ench ? w.ench : 0), 'missile');
    log(u.name + ' looses a shot at ' + t.name + ': hit, ' + dealt + ' damage.');
  } else {
    log(u.name + '’s shot finds the dark instead of ' + t.name + '.');
  }
};

Combat.venom = function (t, venom) {
  if (t.kind !== 'pc') return;
  const sv = R.rollSave(t.c, 0, 0, R.rand);
  if (sv.ok) { log(t.c.name + ' saves against the venom.'); return; }
  const d = R.d(venom || '1d6', R.rand);
  t.hp -= d;
  t.poison = 3;
  log(t.c.name + ' is poisoned: ' + d + ' damage, and it will keep biting.', 'err');
  if (t.hp <= 0) { t.hp = 0; Combat.killUnit(t); }
};

Combat.drinkPotion = function (u, t, id) {
  const def = D.item(id);
  const idx = u.c.inv.indexOf(id);
  if (idx < 0) return;
  u.c.inv.splice(idx, 1);
  const nm = t.kind === 'pc' ? t.c.name : t.name;
  if (/heal|cure|restor/i.test(def.name)) {
    const d = R.d(def.dmg || '2d6+1', R.rand);
    t.hp = Math.min(t.maxhp, t.hp + d);
    t.poison = 0;
    log(nm + ' drinks ' + def.name + ': ' + d + ' HP restored.');
  } else if (/strength|hero/i.test(def.name)) {
    t.fxstr = 2;
    log(nm + ' drinks ' + def.name + ': muscles remember.');
  } else if (/invulner|protection/i.test(def.name)) {
    t.prot = 4;
    log(nm + ' drinks ' + def.name + ': a shimmer of warding.');
  } else if (/haste/i.test(def.name)) {
    t.haste = 4;
    log(nm + ' drinks ' + def.name + ': the world slows.');
  } else if (/antidote/i.test(def.name)) {
    t.poison = 0;
    log(nm + ' drinks ' + def.name + ': the taste of copper passes.');
  } else {
    log(nm + ' drinks ' + def.name + '.');
  }
};

/* ---------- spells ---------- */
Combat.castSpell = function (u, id, target) {
  const c = u.c;
  const def = D.SPELLS[id];
  if ((c.mem || {})[id] <= 0) return;
  const lvl = def.l;
  if (def.tgt !== 'area' && def.tgt !== 'party' && target) {
    const dist = cheb(u, target);
    if (dist > Math.max(def.range, 1)) { log('Too far for ' + def.n + '.'); return; }
  }
  c.mem[id]--;
  log(c.name + ' casts ' + def.n + '.', 'magic');
  const affected = (function () {
    if (def.tgt === 'area' || def.tgt === 'party') return S.units.filter((x) => !x.dead && x.hp > 0 && cheb(x, u) <= Math.max(1, def.r || 1) && (def.friendly || x.kind !== u.kind));
    if (target) return [target];
    return S.units.filter((x) => !x.dead && x.hp > 0 && x.kind !== u.kind);
  })();
  for (const t of affected) {
    Combat.spellEffect(u, def, t);
  }
};

Combat.spellEffect = function (u, def, t) {
  const nm = t.kind === 'pc' ? t.c.name : t.name;
  if (def.dmg) {
    let d = R.d(def.dmg, R.rand);
    if (def.save) {
      const sv = t.kind === 'pc' ? R.rollSave(t.c, 4, 0, R.rand) : { ok: R.chance(20 + t.dexMod * 5) };
      if (sv.ok) {
        d = def.half ? Math.ceil(d / 2) : 0;
        log(nm + ' saves ' + (def.half ? '(half: ' + d + ')' : '(none)') + ' against ' + def.n + '.');
      }
    }
    const dealt = applyDamage(t, d, def.tag || 'magic');
    if (dealt > 0) log(def.n + ' hits ' + nm + ' for ' + dealt + '.');
  } else if (def.heal) {
    const d = def.heal === 'all' ? (t.maxhp - t.hp - Math.max(1, R.d('1d4', R.rand))) : R.d(def.heal, R.rand);
    t.hp = Math.min(t.maxhp, t.hp + Math.max(0, d));
    t.poison = 0;
    log(def.n + ' restores ' + Math.max(0, d) + ' HP to ' + nm + '.');
  } else if (def.sleep || /sleep/i.test(def.n)) {
    const sv = t.kind === 'pc' ? R.rollSave(t.c, 4, 0, R.rand) : { ok: R.chance(10) };
    if (!sv.ok) { t.asleep = 2; log(nm + ' sleeps while the battle turns.', 'magic'); }
    else log(nm + ' resists the sleep.');
  } else if (/shield|armor|protection|ward/i.test(def.n)) {
    t.prot = 4;
    log(nm + ' is warded: AC improved for a few rounds.');
  } else if (/haste/i.test(def.n)) {
    t.haste = 4;
    log(nm + ' moves faster than thought.');
  } else if (/invis/i.test(def.n)) {
    t.invis = true;
    log(nm + ' folds into the dark.');
  } else if (/turn undead|turning/i.test(def.n)) {
    const isUnd = t.kind === 'mon' && (t.mon.tags || []).some((x) => x === 'undead' || x === 'und');
    if (isUnd) {
      const sv = { ok: R.chance(25) };
      if (!sv.ok) { log(nm + ' is turned and flees the battle.', 'magic'); t.hp = 0; t.dead = true; }
      else log(nm + ' resists the turning.');
    } else log(nm + ' is not undead, and is not moved.');
  } else if (/holy word|word/i.test(def.n)) {
    const hd = t.kind === 'mon' ? Math.max(1, +String(t.mon.hd).split('.')[0]) : 1;
    if (hd <= (def.hd || 3)) { log(nm + ' is unmade by the word.', 'magic'); t.hp = 0; Combat.killUnit(t, true); }
    else log(nm + ' endures the word.');
  } else if (/missile|bolt/i.test(def.n)) {
    const dealt = applyDamage(t, R.d('1d4+1', R.rand), 'force');
    log(def.n + ' strikes ' + nm + ' for ' + dealt + '.');
  } else {
    const dealt = applyDamage(t, R.d('1d6', R.rand), 'magic');
    log(def.n + ' washes over ' + nm + (dealt ? ' for ' + dealt + '.' : '.'));
  }
};

/* ---------- AI ---------- */
Combat.aiTurn = function (u) {
  if (S.result || u.dead || u.hp <= 0) { Combat.actNext(); return; }
  /* cast if the monster can and it is worth it */
  if (u.mon.cast && R.chance(35)) {
    const def = D.SPELLS[u.mon.cast];
    if (def) {
      const pcs = S.units.filter((x) => x.kind === 'pc' && !x.dead && x.hp > 0);
      if (pcs.length) {
        const t = pcs[Math.floor(R.rand() * pcs.length)];
        Combat.spellEffect(u, def, t);
        Combat.endTurn(u);
        return;
      }
    }
  }
  /* ranged */
  if (u.mon.ranged) {
    const range = u.mon.ranged.range || 4;
    const shots = S.units.filter((x) => x.kind === 'pc' && !x.dead && x.hp > 0 && cheb(x, u) >= 2 && cheb(x, u) <= range);
    if (shots.length) {
      const t = shots[Math.floor(R.rand() * shots.length)];
      const res = hitRoll(u, t);
      if (res.hit) {
        const dmg = R.d(u.mon.ranged.dmg || '1d6', R.rand);
        applyDamage(t, dmg, 'missile');
        log(u.name + '’s shot finds ' + (t.c ? t.c.name : t.name) + ' for ' + dmg + '.');
      } else log(u.name + '’s shot goes wide.');
      Combat.endTurn(u);
      return;
    }
  }
  /* pick target: nearest visible PC */
  const pcs = S.units.filter((x) => x.kind === 'pc' && !x.dead && x.hp > 0);
  if (!pcs.length) { Combat.end('win'); return; }
  pcs.sort((a, b) => cheb(a, u) - cheb(b, u));
  const t = pcs[0];
  const d = cheb(t, u);
  if (d > 1) {
    /* step toward target (8-way, avoid occupants) */
    const steps = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (occupant(x, y)) continue;
      const nd = cheb(t, { x: x, y: y });
      if (nd < d) steps.push([x, y]);
    }
    const inReach = steps.filter(([x, y]) => cheb({ x: x, y: y }, u) <= u.mv);
    if (inReach.length) {
      const [x, y] = inReach[Math.floor(R.rand() * inReach.length)];
      u.x = x; u.y = y;
      log(u.name + ' closes the distance.');
      Combat.render();
      if (cheb(t, u) <= 1) Combat.meleeAttack(u, t);
      Combat.endTurn(u);
    } else {
      Combat.endTurn(u);
    }
  } else {
    Combat.meleeAttack(u, t);
    Combat.endTurn(u);
  }
};

/* ---------- death ---------- */
Combat.killUnit = function (u, silent) {
  if (u.dead) return;
  u.dead = true;
  if (u.kind === 'mon') {
    const n = u.count || 1;
    Bestiary.kill(u.mon.id);
    if (!silent) log((n > 1 ? n + ' ' + u.mon.name : u.mon.name) + (n > 1 ? ' are' : ' is') + ' destroyed.', 'good');
    if (u.mon.leader) log('The leader falls. The band loses its shape.', 'good');
  } else {
    const c = u.c;
    c.hp = 0;
    log(c.name + ' is down.', 'err');
    if (c.hp <= 0) {
      c.hp = 0;
      if (!R.chance(50)) c.dead = true;
    }
  }
  /* check end */
  const monAlive = S.units.some((x) => x.kind === 'mon' && !x.dead && x.hp > 0);
  const pcAlive = S.units.some((x) => x.kind === 'pc' && !x.dead && x.hp > 0);
  if (!monAlive) { Combat.end('win'); return; }
  if (!pcAlive) { Combat.end('lose'); return; }
};

/* ---------- end ---------- */
Combat.end = function (result) {
  if (S.result) return;
  S.result = result;
  S.phase = 'over';
  const spec = S.spec;
  const killed = S.units.filter((u) => u.kind === 'mon' && u.dead);
  let xp = 0, gold = 0;
  for (const u of killed) {
    xp += (u.mon.xp || 0) * (u.count || 1);
    gold += R.d(u.mon.gold || '0', R.rand) * (u.count || 1);
  }
  const box = document.createElement('div');
  box.className = 'msgbox combat-end';
  if (result === 'win') {
    let totalGold = gold;
    if (spec.gold) totalGold += R.d(spec.gold, R.rand);
    box.innerHTML =
      '<h2>The battle is won.</h2>' +
      (spec.quest ? '<p class="dim">The deed is done.</p>' : '') +
      '<p>Gold: <b>' + totalGold + ' gp</b> · XP: <b>' + xp + '</b> (split)</p>';
    S._rewards = { gold: totalGold, xp: xp, killed: killed };
    const btn = document.createElement('button');
    btn.className = 'mbtn';
    btn.textContent = 'Continue';
    btn.onclick = function () {
      UI.closeTop();
      G.gold += totalGold;
      Campaign.xpSplit(xp);
      if (spec.onWin) spec.onWin(S._rewards);
      Combat.close();
    };
    box.appendChild(btn);
  } else if (result === 'flee') {
    box.innerHTML = '<h2>You break away.</h2><p>The dark keeps what it was keeping. Nothing is taken; nothing is won.</p>';
    const btn = document.createElement('button');
    btn.className = 'mbtn';
    btn.textContent = 'Go';
    btn.onclick = function () {
      UI.closeTop();
      if (spec.onFlee) spec.onFlee();
      Combat.close();
    };
    box.appendChild(btn);
  } else {
    box.innerHTML = '<h2>The dark wins this one.</h2><p>You will wake in the inn, lighter by a tenth of your gold, with the story to carry.</p>';
    const btn = document.createElement('button');
    btn.className = 'mbtn';
    btn.textContent = 'Wake';
    btn.onclick = function () {
      UI.closeTop();
      const fine = Math.max(5, Math.floor(G.gold / 10));
      G.gold -= fine;
      for (const c of G.party) c.hp = Math.max(1, Math.ceil(c.maxhp / 2));
      Journal.add(G.day, 'Defeated. The bill at the inn is ' + fine + ' gp.');
      if (spec.onLose) spec.onLose();
      Combat.close();
    };
    box.appendChild(btn);
  }
  UI.modal(result === 'win' ? 'Victory' : result === 'flee' ? 'Withdrawn' : 'Defeat', box);
  Combat.render();
};

Combat.close = function () {
  S = null;
  Combat.hide();
  G.mode = 'play';
  if (window.Game) { Game.refreshHud(); Game.render(); }
};

/* ---------- input ---------- */
Combat.onClick = function (e) {
  if (!S || !S.pending || S.phase !== 'player') return;
  const r = cv.getBoundingClientRect();
  const sx = (e.clientX - r.left) * (cv.width / r.width);
  const sy = (e.clientY - r.top) * (cv.height / r.height);
  const t = screenTile(sx, sy);
  if (inBoard(t.x, t.y)) Combat.choose(t.x, t.y);
};

Combat.onKey = function (key) {
  if (!S) return;
  if (S.phase === 'player' && !S.result) {
    if (key === 'escape') { Combat.cancelPending(); return; }
    if (!S.pending) {
      if (key === '1') Combat.begin('move');
      else if (key === '2' && targetsMelee(S.active).length) Combat.begin('atk');
      else if (key === '3') Combat.begin('mis');
      else if (key === '4') Combat.begin('spell');
      else if (key === '5') {
        const pots = S.active.c.inv.filter((id) => { const it = D.item(id); return it && it.type === 'd' && /potion/i.test(it.name); });
        if (pots.length) Combat.begin('item', pots);
      }
      else if (key === '6') Combat.doWait(S.active);
      else if (key === '7') Combat.doFlee(S.active);
      return;
    }
    /* tile selection with arrows */
    const u = S.active;
    if (S.pending.action === 'move' || S.pending.action === 'atk' || S.pending.action === 'mis' || S.pending.action === 'item') {
      let dx = 0, dy = 0;
      if (key === 'arrowup' || key === 'w') dy = -1;
      else if (key === 'arrowdown' || key === 's') dy = 1;
      else if (key === 'arrowleft' || key === 'a') dx = -1;
      else if (key === 'arrowright' || key === 'd') dx = 1;
      else if (key === 'enter' || key === ' ') {
        /* pick the highlighted or nearest valid target */
        const set = S.pending.action === 'move' ? moveOptions(u) :
          S.pending.action === 'atk' ? targetsMelee(u) :
          S.pending.action === 'mis' ? targetsMissile(u) :
          S.units.filter((t) => !t.dead && t.hp > 0 && t.kind !== u.kind);
        if (S.sel) {
          Combat.choose(S.sel.x, S.sel.y);
        } else if (set.length) {
          set.sort((a, b) => cheb(a, u) - cheb(b, u));
          S.sel = set[0];
          Combat.render();
          log('Enter again to commit to the highlighted square.', 'dim');
        }
        return;
      } else return;
      const nx = u.x + dx, ny = u.y + dy;
      const set = S.pending.action === 'move' ? moveOptions(u) :
        S.pending.action === 'atk' ? targetsMelee(u) :
        S.pending.action === 'mis' ? targetsMissile(u) :
        S.units.filter((t) => !t.dead && t.hp > 0 && t.kind !== u.kind);
      S.sel = set.find((o) => o.x === nx && o.y === ny) || null;
      if (!S.sel) {
        /* keep last valid */
      }
      Combat.render();
    }
  }
};

/* ---------- render ---------- */
Combat.render = function () {
  if (!ctx || !S) return;
  const W = cv.width, H = cv.height;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#100c0a');
  g.addColorStop(1, '#1c1410');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  /* tiles */
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const { sx, sy } = tileXY(x, y);
    ctx.beginPath();
    ctx.moveTo(sx, sy - TH / 2);
    ctx.lineTo(sx + TW / 2, sy);
    ctx.lineTo(sx, sy + TH / 2);
    ctx.lineTo(sx - TW / 2, sy);
    ctx.closePath();
    let fill = (x + y) % 2 ? '#2a221c' : '#241d17';
    if (S.pending) {
      const set = S.pending.action === 'move' ? moveOptions(S.active) :
        S.pending.action === 'atk' ? targetsMelee(S.active) :
        S.pending.action === 'mis' ? targetsMissile(S.active) :
        (S.pending.spell || S.pending.action === 'item') ? S.units.filter((t) => !t.dead && t.hp > 0 && t.kind !== S.active.kind).map((t) => ({ x: t.x, y: t.y })) : [];
      if (set.some((o) => o.x === x && o.y === y)) fill = S.pending.action === 'move' ? '#3a4a30' : '#4a2c24';
    }
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,150,0.10)';
    ctx.stroke();
    if (S.sel && S.sel.x === x && S.sel.y === y) {
      ctx.fillStyle = 'rgba(240,220,140,0.35)';
      ctx.fill();
    }
  }
  /* units */
  const sorted = S.units.filter((u) => !u.dead).sort((a, b) => (a.x + a.y) - (b.x + b.y));
  for (const u of sorted) {
    const { sx, sy } = tileXY(u.x, u.y);
    const fig = u.kind === 'pc' ? window.Fig.figForChar(u.c) : window.Fig.figForMonster(u.mon);
    const h = u.kind === 'mon' && (u.mon.size === 'L' || u.mon.size === 'H') ? 44 : u.kind === 'mon' ? 34 : 34;
    window.Fig.drawFig(ctx, fig, sx, sy + 8, h, { alpha: u.asleep > 0 ? 0.5 : u.invis ? 0.4 : 1 });
    /* name + hp */
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = u.kind === 'pc' ? '#f0e0a0' : '#e09080';
    const nm = u.name + (u.count > 1 ? ' ×' + u.count : '');
    ctx.fillText(nm, sx, sy - h - 2);
    const bw = 34;
    ctx.fillStyle = '#201812';
    ctx.fillRect(sx - bw / 2, sy - h - 1, bw, 3);
    ctx.fillStyle = u.kind === 'pc' ? '#40a050' : '#a04030';
    ctx.fillRect(sx - bw / 2, sy - h - 1, bw * Math.max(0, u.hp / u.maxhp), 3);
    if (u.asleep > 0) { ctx.fillStyle = '#8ab0ff'; ctx.fillText('zzz', sx + bw / 2 + 8, sy - h - 2); }
    if (u === S.active) {
      ctx.strokeStyle = '#f0e0a0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy - TH / 2 - 3);
      ctx.lineTo(sx + TW / 2 + 3, sy);
      ctx.lineTo(sx, sy + TH / 2 + 3);
      ctx.lineTo(sx - TW / 2 - 3, sy);
      ctx.closePath();
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  }
  /* status line */
  const st = document.getElementById('combat-status');
  if (st) {
    st.textContent = S.result ? 'Battle over.' :
      'Round ' + S.round + ' — ' + (S.active ? (S.active.kind === 'pc' ? S.active.c.name : S.active.name) + (S.phase === 'player' ? (S.pending ? ' choosing…' : ' — your action') : ' is acting…') : '');
  }
};
})();
