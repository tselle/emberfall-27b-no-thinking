/* Emberfall — ui.js
 * DOM layer: command bar, modal stack, party drawer, character sheets,
 * shop, help, slots, menu, character creation.
 * Character model (rules.js): c.ab {STR..CHA}, c.eq {slot:itemId},
 * c.inv [itemId...], c.maxhp/c.hp, c.prep/c.mem for spells, R.derived(c). */
'use strict';
(function () {
const UI = window.UI = {};
const R = window.R;

/* ---------- command bar ---------- */
UI.log = function (msg, cls) {
  const el = document.getElementById('log');
  if (!el) return;
  const line = document.createElement('div');
  line.className = 'cl' + (cls ? ' ' + cls : '');
  line.textContent = msg;
  el.appendChild(line);
  while (el.children.length > 14) el.removeChild(el.firstChild);
  el.scrollTop = el.scrollHeight;
  const cb = document.getElementById('cmdbar');
  if (cb) cb.textContent = msg;
};
UI.clearLog = function () {
  const el = document.getElementById('log');
  if (el) el.innerHTML = '';
};

/* ---------- modal stack ---------- */
UI.stack = [];
UI.modal = function (title, bodyEl, opts) {
  opts = opts || {};
  const root = document.getElementById('modalRoot');
  const box = document.createElement('div');
  box.className = 'modal' + (opts.wide ? ' wide' : '');
  const bar = document.createElement('div');
  bar.className = 'mbar';
  const t = document.createElement('span');
  t.textContent = title;
  bar.appendChild(t);
  if (!opts.noclose) {
    const x = document.createElement('button');
    x.className = 'mx';
    x.textContent = '×';
    x.onclick = function () { UI.closeTop(); };
    bar.appendChild(x);
  }
  box.appendChild(bar);
  const body = document.createElement('div');
  body.className = 'mbody';
  if (typeof bodyEl === 'string') body.innerHTML = bodyEl;
  else body.appendChild(bodyEl);
  box.appendChild(body);
  root.appendChild(box);
  UI.stack.push(box);
  box._onclose = opts.onclose;
  return body;
};
UI.closeTop = function () {
  const box = UI.stack.pop();
  if (!box) return;
  box.remove();
  if (box._onclose) box._onclose();
};
UI.closeAll = function () { while (UI.stack.length) UI.closeTop(); };

function barEl(pct, txt) {
  const d = document.createElement('div');
  d.innerHTML = '<div class="barw"><div class="bar" style="width:' + Math.max(0, Math.min(100, pct)) + '%"></div><span>' + txt + '</span></div>';
  return d;
}
function itemLabel(id) {
  const it = D.item(id);
  if (!it) return id;
  return it.name + (it.ench ? ' +' + it.ench : '') + (it.charges != null ? ' (' + it.charges + ')' : '');
}
function invCount(c) { return c.inv.length; }
function invCap(c) { return 12 + (c.cls === 'F' || c.cls === 'P' || c.cls === 'R' ? Math.floor(c.ab.STR / 5) : Math.floor(c.ab.DEX / 5)); }

/* ---------- party drawer ---------- */
UI.renderParty = function () {
  const el = document.getElementById('party');
  if (!el || !window.G || !G.started) return;
  el.classList.remove('hidden');
  el.innerHTML = '';
  for (const c of G.party) {
    const row = document.createElement('div');
    row.className = 'prow' + (c.dead || c.hp <= 0 ? ' dead' : '');
    const fig = window.Fig.portrait(window.Fig.figForChar(c), 40, '#14100c');
    row.appendChild(fig);
    const info = document.createElement('div');
    info.className = 'pinfo';
    const nm = document.createElement('div');
    nm.className = 'pnm';
    nm.textContent = c.name + ' ' + R.RACES[c.race].name + ' ' + R.CLASSES[c.cls].name + ' ' + c.lvl;
    info.appendChild(nm);
    info.appendChild(barEl(c.hp / c.maxhp * 100, c.hp + '/' + c.maxhp + ' HP'));
    if (c.cls === 'M' || c.cls === 'C' || c.cls === 'P') {
      const slots = R.slotsFor(c) || [];
      const mem = c.mem || {};
      let have = 0, cap = 0;
      for (let l = 1; l <= 9; l++) {
        cap += slots[l - 1] || 0;
        have += R.prepCount(c)[l] || 0;
      }
      info.appendChild(barEl(cap ? have / cap * 100 : 0, have + '/' + cap + ' spell slots'));
    }
    row.appendChild(info);
    row.onclick = function () { UI.sheet(c); };
    el.appendChild(row);
  }
  const gold = document.createElement('div');
  gold.className = 'pgold';
  gold.textContent = G.gold + ' gp';
  el.appendChild(gold);
};

/* ---------- character sheet ---------- */
UI.sheet = function (c) {
  const body = document.createElement('div');
  const der = R.derived(c);
  const w = R.worn(c);

  const top = document.createElement('div');
  top.className = 'sheettop';
  const fig = window.Fig.portrait(window.Fig.figForChar(c), 72, '#181210');
  top.appendChild(fig);
  const hd = document.createElement('div');
  hd.innerHTML =
    '<div class="sname">' + c.name + ' <span class="sdot">·</span> ' + R.RACES[c.race].name + ' ' + R.CLASSES[c.cls].name + '</div>' +
    '<div class="slvl">Level ' + c.lvl + ' — ' + c.xp + ' XP' + (R.nextXp(c) != null ? ' (next ' + R.nextXp(c) + ')' : '') + '</div>' +
    '<div class="sgear">THAC0 ' + der.thac0 + ' · AC ' + der.ac + ' · Move ' + der.mv + ' · ' + der.rate.join('/') + ' attacks</div>';
  top.appendChild(hd);
  body.appendChild(top);

  const hpRow = document.createElement('div');
  hpRow.className = 'brows';
  hpRow.appendChild(barEl(c.hp / c.maxhp * 100, c.hp + ' / ' + c.maxhp + ' HP'));
  body.appendChild(hpRow);

  const stats = document.createElement('div');
  stats.className = 'stats';
  for (const k of R.AB) {
    const v = c.ab[k];
    const m = R.abilityMod(v);
    const d = document.createElement('div');
    d.className = 'st' + (m < 0 ? ' neg' : m > 0 ? ' pos' : '');
    d.innerHTML = '<span>' + k + '</span><b>' + (k === 'STR' && c.strx != null ? v + '/' + c.strx : v) + '</b><i>(' + (m >= 0 ? '+' : '') + m + ')</i>';
    stats.appendChild(d);
  }
  body.appendChild(stats);

  const sav = document.createElement('div');
  sav.className = 'derived';
  sav.innerHTML =
    '<span>vs Par/Pos/Death <b>' + der.saves[0] + '</b></span>' +
    '<span>vs Rod/Staff <b>' + der.saves[1] + '</b></span>' +
    '<span>vs Petrify <b>' + der.saves[2] + '</b></span>' +
    '<span>vs Breath <b>' + der.saves[3] + '</b></span>' +
    '<span>vs Spell <b>' + der.saves[4] + '</b></span>';
  body.appendChild(sav);

  /* equipment slots */
  const eq = document.createElement('div');
  eq.className = 'equip';
  eq.innerHTML = '<div class="etitle">Worn</div>';
  for (const s of R.SLOTS) {
    const it = w[s];
    const d = document.createElement('div');
    d.className = 'wslot';
    d.innerHTML = '<span class="wlab">' + R.SLOT_NAMES[s] + '</span><span class="wval">' + (it ? it.name + (it.ench ? ' +' + it.ench : '') : '—') + '</span>';
    eq.appendChild(d);
  }
  body.appendChild(eq);

  /* spells */
  const known = R.knownSpells(c);
  const slots = R.slotsFor(c);
  if (known.length || slots) {
    const sp = document.createElement('div');
    sp.className = 'spells';
    sp.innerHTML = '<div class="etitle">' + (c.cls === 'M' ? 'Spells' : 'Prayers') + (c.cls === 'P' ? ' (level ' + R.castLevel(c) + ')' : '') + '</div>';
    const list = document.createElement('div');
    list.className = 'spelllist';
    const byLvl = new Map();
    for (const id of known) {
      const def = D.SPELLS[id];
      if (!def) continue;
      byLvl.set(def.l, byLvl.get(def.l) || []);
      byLvl.get(def.l).push(def.n);
    }
    const mem = c.mem || {};
    let any = false;
    for (let l = 1; l <= 9; l++) {
      if (!byLvl.has(l) && !(slots && slots[l - 1])) continue;
      any = true;
      const row = document.createElement('div');
      row.className = 'sprow';
      const slotTxt = slots ? (R.prepCount(c)[l] || 0) + '/' + (slots[l - 1] || 0) : '';
      const names = byLvl.has(l) ? byLvl.get(l).join(', ') : '<i>none known</i>';
      row.innerHTML = '<span class="splv">' + l + (slots ? ' <b class="spslots">' + slotTxt + '</b>' : '') + '</span><span class="spnames">' + names + '</span>';
      list.appendChild(row);
    }
    if (!any) list.innerHTML = '<i>Nothing learned yet.</i>';
    if (c.cls === 'M' && c._needSpell > 0) {
      const warn = document.createElement('div');
      warn.className = 'dim';
      warn.textContent = 'New spells learned — visit a sage or temple to copy them into your book.';
      list.appendChild(warn);
    }
    sp.appendChild(list);
    body.appendChild(sp);
  }

  /* inventory */
  const inv = document.createElement('div');
  inv.className = 'inventory';
  inv.innerHTML = '<div class="etitle">Inventory (' + invCount(c) + '/' + invCap(c) + ')</div>';
  const list = document.createElement('div');
  list.className = 'invlist';
  const counts = new Map();
  for (const id of c.inv) counts.set(id, (counts.get(id) || 0) + 1);
  for (const [id, n] of counts) {
    const def = D.item(id);
    const row = document.createElement('div');
    row.className = 'invrow';
    row.innerHTML = '<span>' + itemLabel(id) + ' <i>×' + n + '</i></span><span class="gp">' + (def ? def.price || 0 : 0) + ' gp</span>';
    list.appendChild(row);
  }
  if (!c.inv.length) list.innerHTML = '<i>Empty pack.</i>';
  inv.appendChild(list);
  body.appendChild(inv);

  const btns = document.createElement('div');
  btns.className = 'mrow';
  const sellBtn = document.createElement('button');
  sellBtn.className = 'mbtn';
  sellBtn.textContent = 'Sell';
  sellBtn.onclick = function () { UI.closeTop(); UI.shop('Sell — ' + c.name, null, c); };
  btns.appendChild(sellBtn);
  const closeBtn = document.createElement('button');
  closeBtn.className = 'mbtn';
  closeBtn.textContent = 'Close';
  closeBtn.onclick = function () { UI.closeTop(); };
  btns.appendChild(closeBtn);
  body.appendChild(btns);

  UI.modal('Character — ' + c.name, body, { wide: true, onclose: UI.renderParty });
};

/* ---------- shop ---------- */
UI.shop = function (title, goods, charForSell) {
  const body = document.createElement('div');
  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  let tab = 'buy';
  const tabBuy = document.createElement('button');
  tabBuy.className = 'tab on';
  tabBuy.textContent = 'Buy';
  const tabSell = document.createElement('button');
  tabSell.className = 'tab';
  tabSell.textContent = 'Sell';
  tabBuy.onclick = function () { tab = 'buy'; refresh(); tabBuy.className = 'tab on'; tabSell.className = 'tab'; };
  tabSell.onclick = function () { tab = 'sell'; refresh(); tabBuy.className = 'tab'; tabSell.className = 'tab on'; };
  tabs.appendChild(tabBuy);
  tabs.appendChild(tabSell);
  body.appendChild(tabs);

  const goldRow = document.createElement('div');
  goldRow.className = 'shopgold';
  body.appendChild(goldRow);
  const list = document.createElement('div');
  list.className = 'shoplist';
  body.appendChild(list);
  const hint = document.createElement('div');
  hint.className = 'shophint';
  body.appendChild(hint);
  UI.modal(title, body, { wide: true });

  function refresh() {
    list.innerHTML = '';
    goldRow.innerHTML = '';
    const g = document.createElement('span');
    g.className = 'gp';
    g.textContent = (window.G ? G.gold : 0) + ' gp';
    goldRow.appendChild(g);
    if (tab === 'buy') {
      hint.textContent = 'Click an item to buy it.';
      if (!goods || !goods.length) {
        list.innerHTML = '<i>Nothing for sale.</i>';
        return;
      }
      for (const row of goods) {
        const el = document.createElement('div');
        el.className = 'srow';
        el.innerHTML = '<span class="sname">' + row.name + '</span><span class="sdetail">' + (row.detail || '') + '</span><span class="gp">' + row.price + ' gp</span>';
        el.onclick = function () {
          if (!window.G) return;
          if (G.gold < row.price) { UI.log('Not enough gold.', 'err'); return; }
          G.gold -= row.price;
          const char = charForSell || G.party.find((c) => !c.dead) || G.party[0];
          if (row.give) row.give(char);
          UI.log('Bought ' + row.name + ' for ' + row.price + ' gp.');
          refresh();
          UI.renderParty();
        };
        list.appendChild(el);
      }
    } else {
      hint.textContent = charForSell ? 'Selling from ' + charForSell.name + '’s pack.' : 'Nothing to sell — select a character first.';
      if (!charForSell) return;
      const counts = new Map();
      for (const id of charForSell.inv) counts.set(id, (counts.get(id) || 0) + 1);
      for (const [id, n] of counts) {
        const def = D.item(id);
        if (!def) continue;
        const half = Math.max(1, Math.floor((def.price || 0) / 2));
        const el = document.createElement('div');
        el.className = 'srow';
        el.innerHTML = '<span class="sname">' + itemLabel(id) + ' <i>×' + n + '</i></span><span class="sdetail">' + (def.n || '') + '</span><span class="gp">' + half + ' gp</span>';
        el.onclick = function () {
          const idx = charForSell.inv.indexOf(id);
          if (idx < 0) return;
          charForSell.inv.splice(idx, 1);
          window.G.gold += half;
          UI.log('Sold ' + def.name + ' for ' + half + ' gp.');
          refresh();
          UI.renderParty();
        };
        list.appendChild(el);
      }
    }
  }
  refresh();
};

/* ---------- help ---------- */
UI.help = function () {
  const pages = [
    ['Movement & time',
      'Arrow keys / WASD: move one step. Z / X: turn left / right. F: wait a moment. R: rest. Space: repeat the last move. Enter / E: interact. M: survey the map. J: journal. B: bestiary. H or ?: help. Esc: menu.',
      'Time is the game. Each step takes a few minutes; resting, trading, working the day, and wandering all burn hours. Day and night come on the hour: night is 9 PM to 5 AM. Some places are closed at night, and the wild is worse after dark.'],
    ['The view',
      'You see the world first-person: walls up close, torches or daylight farther. The minimap remembers what you have seen. The survey map (M) is the full picture, with services colored: shop, inn, temple, hall, fountain, stairs — and red for trouble.',
      'Monsters you have seen are marked as diamonds on the map. Chests glow gold. Triggered traps turn red.'],
    ['Combat',
      'When the watch sounds, the party and the monsters face off on a tactical board. Each round runs in initiative order, 1 through 10. Move, attack, cast, drink a potion, wait, or try to flee. Melee hits use THAC0: you must roll your THAC0 minus the target’s AC. Missiles have range. Spells cost their level in slots and may require a save.',
      'Victory: gold, XP, and a quiet map. Defeat: you wake in the inn with a bill. Fleeing works best when you are ahead.'],
    ['Overland',
      'The overland map is the region: roads, tracks, ruins, water, and the gate home. Movement costs minutes or a march. Camps let you rest. Sites: shrines, ruins, huts, and lairs. Wandering too long invites the wild to find you — on the long road it always does.',
      'Travel between modules takes a day and a half of road.'],
    ['Services',
      'Every base has services: shop (gold for goods), inn (heal and sleep), temple (cure, prayer, and training), hall (commission and rumors), fountain (rest), stairs (the work). Minimap colors: gold for commerce, green for rest, blue for the temple, white for the hall, red for trouble.',
      'The temple can train a character who has earned the next level: pay the gold, rest, and the character gains the level.'],
    ['Characters',
      'Six abilities from 3d6 (highest three), or the fixed array 15/13/12/10/9/8. Races: human, dwarf, elf, gnome, half-elf, halfling. Classes: fighter, paladin, ranger, mage, cleric, thief. THAC0 is the number you must roll under. AC starts at 10, drops with armor, shield, and dexterity, and never falls below 10. Saving throws scale with level; thieves add skill: open locks, find traps, remove traps, move silently, hide in shadows, hear noise.',
      'XP is split across the whole party. Leveling raises HP, spells, and what you may wear. Prime requisite (16+ in the class’s abilities) earns a 10% XP bonus.']
  ];
  const body = document.createElement('div');
  body.className = 'helpbody';
  for (const [t, a, b] of pages) {
    const sec = document.createElement('div');
    sec.className = 'hsec';
    sec.innerHTML = '<h3>' + t + '</h3><p>' + a + '</p><p class="dim">' + b + '</p>';
    body.appendChild(sec);
  }
  UI.modal('Help', body, { wide: true });
};

/* ---------- menu ---------- */
UI.menu = function () {
  const body = document.createElement('div');
  body.className = 'menu';
  const mk = function (label, fn, cls) {
    const b = document.createElement('button');
    b.className = 'mbtn ' + (cls || '');
    b.textContent = label;
    b.onclick = function () { UI.closeTop(); fn(); };
    body.appendChild(b);
    return b;
  };
  mk('Continue', function () { if (window.Game) Game.resume(); });
  mk('Party', function () { UI.renderParty(); });
  mk('Journal', function () { if (window.Journal) Journal.open(); });
  mk('Bestiary', function () { if (window.Bestiary) Bestiary.open(); });
  mk('Help', UI.help);
  mk('Save / Load', function () { if (window.Game) Game.slots('save'); });
  if (window.G && G.started) mk('Abandon to Title', function () { if (window.Game) Game.toTitle(); }, 'danger');
  UI.modal('Menu', body);
};

/* ---------- slots ---------- */
UI.slots = function (mode) {
  const body = document.createElement('div');
  body.className = 'slots';
  const info = document.createElement('div');
  info.className = 'dim';
  info.textContent = mode === 'load' ? 'Choose a save to load.' : 'Choose a slot to save in.';
  body.appendChild(info);
  for (let i = 1; i <= 3; i++) {
    const data = window.G ? G.loadSlot(i) : null;
    const row = document.createElement('div');
    row.className = 'slotrow';
    if (data) {
      row.innerHTML = '<b>Slot ' + i + '</b> — ' + (data.name || 'Party') + ' · Day ' + data.day + ' · ' + (data.timeStr || '') + (data.auto ? ' (auto)' : '') +
        '<span class="dim"> — ' + (data.moduleName || '') + '</span>';
      const btn = document.createElement('button');
      btn.className = 'mbtn';
      btn.textContent = mode === 'load' ? 'Load' : 'Overwrite';
      btn.onclick = function () {
        if (mode === 'load') { UI.closeTop(); Game.load(i); }
        else { Game.save(i, false); UI.closeTop(); UI.log('Saved to slot ' + i + '.'); }
      };
      row.appendChild(btn);
    } else {
      row.innerHTML = '<b>Slot ' + i + '</b> <span class="dim">— empty</span>';
      const btn = document.createElement('button');
      btn.className = 'mbtn';
      btn.textContent = 'Save';
      btn.onclick = function () { Game.save(i, false); UI.closeTop(); UI.log('Saved to slot ' + i + '.'); };
      row.appendChild(btn);
    }
    body.appendChild(row);
  }
  const autoRow = document.createElement('div');
  autoRow.className = 'slotrow';
  autoRow.innerHTML = '<b>Auto</b> <span class="dim">— saved on rest and on module change</span>';
  body.appendChild(autoRow);
  UI.modal(mode === 'load' ? 'Load' : 'Save', body);
};

/* ---------- confirm / message ---------- */
UI.confirm = function (msg, onYes) {
  const body = document.createElement('div');
  body.className = 'confirm';
  body.innerHTML = '<p>' + msg + '</p>';
  const row = document.createElement('div');
  row.className = 'mrow';
  const yes = document.createElement('button');
  yes.className = 'mbtn';
  yes.textContent = 'Yes';
  yes.onclick = function () { UI.closeTop(); onYes(); };
  const no = document.createElement('button');
  no.className = 'mbtn';
  no.textContent = 'No';
  no.onclick = function () { UI.closeTop(); };
  row.appendChild(yes); row.appendChild(no);
  body.appendChild(row);
  UI.modal('Are you sure?', body);
};
UI.messageBox = function (title, bodyHtml) {
  const body = document.createElement('div');
  body.className = 'msgbox';
  body.innerHTML = bodyHtml;
  const row = document.createElement('div');
  row.className = 'mrow';
  const ok = document.createElement('button');
  ok.className = 'mbtn';
  ok.textContent = 'OK';
  ok.onclick = function () { UI.closeTop(); };
  row.appendChild(ok);
  body.appendChild(row);
  UI.modal(title, body);
};

/* ---------- character creation ---------- */
UI.charCreate = function (onDone) {
  const body = document.createElement('div');
  body.className = 'charcreate';
  const step = { n: 1 };
  const cc = { race: 'H', cls: 'F', name: '', scores: null, method: 'roll', spec: null, foe: null };

  const title = document.createElement('div');
  title.className = 'cc-title';
  body.appendChild(title);
  const content = document.createElement('div');
  content.className = 'cc-content';
  body.appendChild(content);
  const nav = document.createElement('div');
  nav.className = 'mrow';
  body.appendChild(nav);

  function back() { if (step.n > 1) { step.n--; render(); } }
  function next() { step.n++; render(); }

  function render() {
    content.innerHTML = '';
    nav.innerHTML = '';
    const bBack = document.createElement('button');
    bBack.className = 'mbtn';
    bBack.textContent = 'Back';
    bBack.onclick = back;
    const bNext = document.createElement('button');
    bNext.className = 'mbtn primary';
    nav.appendChild(bBack);
    nav.appendChild(bNext);

    if (step.n === 1) {
      title.textContent = 'Who goes first?';
      const pre = document.createElement('div');
      pre.className = 'cc-pre';
      const tip = document.createElement('p');
      tip.className = 'dim';
      tip.textContent = 'Take one of the pregenerated heroes, or make your own.';
      pre.appendChild(tip);
      for (const p of D.PREGENS) {
        const row = document.createElement('div');
        row.className = 'cc-row';
        row.innerHTML = '<b>' + p.name + '</b> — ' + R.RACES[p.race].name + ' ' + R.CLASSES[p.cls].name + (p.spec ? ' (' + p.spec + ')' : '') + (p.foe ? ' (foe: ' + p.foe + ')' : '');
        row.onclick = function () {
          const c = R.newChar({ race: p.race, cls: p.cls, name: p.name, scores: p.scores, spec: p.spec, foe: p.foe, align: p.align, color: p.color, level: 1, kit: false }, R.rand);
          c.color = p.color;
          for (const id of (p.gear || [])) c.inv.push(id);
          /* auto-equip */
          for (const id of c.inv.slice()) {
            const it = D.item(id);
            if (!it) continue;
            for (const s of R.SLOTS) {
              if (R.SLOTS.indexOf(s) === R.SLOTS.indexOf('w') && it.type === 'w' && !c.eq.w) { c.eq.w = id; break; }
            }
            if (c.eq.w === id) continue;
            if (it.type === 'a' && !c.eq.a) c.eq.a = id;
            else if (it.type === 's' && !c.eq.s) c.eq.s = id;
            else if (it.type === 'm' && !c.eq.m) c.eq.m = id;
            else if ((it.type === 'r' || it.type === 'x') && !c.eq.r1) c.eq.r1 = id;
          }
          UI.closeTop();
          onDone(c);
        };
        pre.appendChild(row);
      }
      const custom = document.createElement('button');
      custom.className = 'mbtn';
      custom.textContent = 'Make your own';
      custom.onclick = next;
      pre.appendChild(custom);
      content.appendChild(pre);
      bNext.style.display = 'none';
    } else if (step.n === 2) {
      title.textContent = 'Race';
      for (const k of R.RACE_ORDER) {
        const r = R.RACES[k];
        const row = document.createElement('div');
        row.className = 'cc-row' + (cc.race === k ? ' on' : '');
        row.innerHTML = '<b>' + r.name + '</b>' + (r.trait ? ' — ' + r.trait : '');
        row.onclick = function () { cc.race = k; render(); };
        content.appendChild(row);
      }
      bNext.textContent = 'Next: class';
      bNext.onclick = next;
    } else if (step.n === 3) {
      title.textContent = 'Class';
      for (const k of R.CLASS_ORDER) {
        const c = R.CLASSES[k];
        const row = document.createElement('div');
        row.className = 'cc-row' + (cc.cls === k ? ' on' : '');
        row.innerHTML = '<b>' + c.name + '</b>' + (c.trait ? ' — ' + c.trait : '');
        row.onclick = function () {
          cc.cls = k;
          cc.spec = null; cc.foe = null;
          render();
        };
        content.appendChild(row);
      }
      bNext.textContent = 'Next: abilities';
      bNext.onclick = next;
    } else if (step.n === 4) {
      title.textContent = 'Abilities';
      const method = document.createElement('div');
      method.className = 'cc-row' + (cc.method === 'roll' ? ' on' : '');
      method.innerHTML = '<b>Roll 3d6 each</b> — best three of four';
      method.onclick = function () { cc.method = 'roll'; render(); };
      content.appendChild(method);
      const fixed = document.createElement('div');
      fixed.className = 'cc-row' + (cc.method === 'fixed' ? ' on' : '');
      fixed.innerHTML = '<b>Fixed array</b> — STR 15 · DEX 13 · CON 12 · INT 10 · WIS 9 · CHA 8';
      fixed.onclick = function () { cc.method = 'fixed'; cc.scores = { STR: 15, DEX: 13, CON: 12, INT: 10, WIS: 9, CHA: 8 }; render(); };
      content.appendChild(fixed);
      if (cc.method === 'roll') {
        const rollBtn = document.createElement('button');
        rollBtn.className = 'mbtn';
        rollBtn.textContent = 'Roll again';
        rollBtn.onclick = function () {
          cc.scores = R.rollScores(cc.race, cc.cls, R.rand);
          render();
        };
        content.appendChild(rollBtn);
        if (cc.scores) {
          const rolls = document.createElement('div');
          rolls.className = 'cc-rolls';
          rolls.innerHTML = R.AB.map((a) => a + ' ' + cc.scores[a]).join(' · ');
          content.appendChild(rolls);
        }
      }
      bNext.textContent = 'Next: name';
      bNext.onclick = next;
    } else if (step.n === 5) {
      title.textContent = 'Name';
      const inp = document.createElement('input');
      inp.className = 'cc-input';
      inp.type = 'text';
      inp.maxLength = 24;
      inp.placeholder = 'A name the tavern will remember';
      inp.value = cc.name;
      inp.onchange = function () { cc.name = inp.value; };
      content.appendChild(inp);
      const names = ['Bran', 'Wren', 'Tamsin', 'Cael', 'Rona', 'Aldous', 'Mira', 'Havel', 'Sela', 'Godwin', 'Petra', 'Osric'];
      const last = ['Thorn', 'Wick', 'Hallow', 'Moor', 'Ash', 'Grieve', 'Bram', 'Fell', 'Oak', 'Quill', 'Vane', 'Rook'];
      const rand = document.createElement('button');
      rand.className = 'mbtn';
      rand.textContent = 'Random name';
      rand.onclick = function () {
        cc.name = names[Math.floor(Math.random() * names.length)] + ' ' + last[Math.floor(Math.random() * last.length)];
        inp.value = cc.name;
      };
      content.appendChild(rand);
      bNext.textContent = 'Next: specialty';
      bNext.onclick = next;
    } else if (step.n === 6) {
      title.textContent = 'Specialty (flavor + a small edge)';
      let options = [];
      if (cc.cls === 'F') options = ['longsword', 'broadsword', 'twoh_sword', 'axe', 'mace', 'warhammer', 'dagger', 'polearm'];
      else if (cc.cls === 'R') options = ['gob', 'orc', 'undead', 'elv', 'dr', 'beast'];
      else if (cc.cls === 'P') options = [];
      if (!options.length) {
        content.innerHTML = '<p class="dim">No specialty for this class. Onward.</p>';
        bNext.textContent = 'Swear in';
        bNext.onclick = finish;
        return;
      }
      const pickSpec = (k, label) => {
        const row = document.createElement('div');
        row.className = 'cc-row' + ((cc.cls === 'F' ? cc.spec : cc.foe) === k ? ' on' : '');
        row.innerHTML = '<b>' + label + '</b>';
        row.onclick = function () {
          if (cc.cls === 'F') cc.spec = k; else cc.foe = k;
          render();
        };
        content.appendChild(row);
      };
      for (const o of options) pickSpec(o, o.replace('_', ' '));
      const none = document.createElement('div');
      none.className = 'cc-row' + ((cc.spec || cc.foe) === null ? ' on' : '');
      none.innerHTML = '<b>None</b>';
      none.onclick = function () { cc.spec = null; cc.foe = null; render(); };
      content.appendChild(none);
      bNext.textContent = 'Swear in';
      bNext.onclick = finish;
    }
  }

  function finish() {
    const scores = cc.scores || { STR: 15, DEX: 13, CON: 12, INT: 10, WIS: 9, CHA: 8 };
    const c = R.newChar({
      race: cc.race, cls: cc.cls, name: cc.name || 'Wanderer',
      scores: scores, spec: cc.spec, foe: cc.foe, level: 1, kit: false
    }, R.rand);
    UI.closeTop();
    onDone(c);
  }

  render();
  UI.modal('New hero', body, { wide: true });
};
})();
