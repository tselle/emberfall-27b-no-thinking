/* Emberfall — tools/sim.js
 * Headless playthrough: new game in thornwick, walk the town, take the
 * stairs, fight encounters (auto-play), open chests, go back up, exit to
 * the wild, hit a site, and save/load. Prints PASS/FAIL steps. */
'use strict';
const { loadLayer, loadRuntime } = require('./testenv.js');
loadLayer();
loadRuntime();
R.pinPlay(987654321); /* deterministic playthrough */

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  ok  ' + msg); }
  else { fail++; console.log('  FAIL ' + msg); }
}
/* auto-confirm dialogs, synchronous timers */
UI.confirm = (msg, fn) => { fn(); };
global.setTimeout = (fn) => { try { fn(); } catch (e) { console.log('  (timer err)', e.message); } return 0; };

/* helpers */
function walkTo(x, y) {
  /* BFS over walkable cells; returns true, 'combat', 'stair', 'exit', or false */
  const m = D.MAPS[G.mapId];
  const startMap = G.mapId;
  const key = (a, b) => a + ',' + b;
  const prev = {};
  const q = [[G.pos.x, G.pos.y]];
  prev[key(G.pos.x, G.pos.y)] = null;
  while (q.length) {
    const [cx, cy] = q.shift();
    if (cx === x && cy === y) {
      /* replay path */
      const path = [];
      let k = key(x, y);
      while (prev[k]) { path.unshift(k); k = prev[k]; }
      for (const kk of path) {
        const [nx, ny] = kk.split(',').map(Number);
        const before = G.mapId;
        const didx = nx - G.pos.x === 1 ? 1 : nx - G.pos.x === -1 ? 3 : ny - G.pos.y === 1 ? 2 : 0;
        Game.move(didx);
        if (G.mode === 'combat') return 'combat';
        if (G.mapId !== before) return G.mapId === startMap ? 'moved' : 'stair';
        if (G.pos.x === x && G.pos.y === y) return true;
      }
      return true;
    }
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
      const k = key(nx, ny);
      if (prev[k] !== undefined) continue;
      if (!Game.walkable(m, m.grid[ny][nx])) continue;
      prev[k] = key(cx, cy);
      q.push([nx, ny]);
    }
  }
  return false;
}
function clickLastModalButton() {
  const m = UI.stack[UI.stack.length - 1];
  if (!m) return false;
  const btns = m.querySelectorAll('button');
  const b = btns[btns.length - 1];
  if (b && b.onclick) { b.onclick(); return true; }
  return false;
}
function simCombat() {
  let guard = 0;
  while (guard++ < 400) {
    const S = Combat.state();
    if (!S || S.result) break;
    if (S.phase === 'player') {
      const u = S.active;
      const foes = S.units.filter((t) => t.kind === 'mon' && !t.dead && t.hp > 0);
      if (!foes.length) { Combat.end('win'); continue; }
      foes.sort((a, b) => Math.max(Math.abs(a.x - u.x), Math.abs(a.y - u.y)) - Math.max(Math.abs(b.x - u.x), Math.abs(b.y - u.y)));
      const t = foes[0];
      const d = Math.max(Math.abs(t.x - u.x), Math.abs(t.y - u.y));
      if (d <= 1) Combat.meleeAttack(u, t);
      else {
        const opts = [];
        for (let y = 0; y < 7; y++) for (let x = 0; x < 9; x++) {
          const dd = Math.max(Math.abs(x - u.x), Math.abs(y - u.y));
          if (dd < 1 || dd > u.mv) continue;
          if (S.units.some((o) => !o.dead && o.x === x && o.y === y)) continue;
          opts.push({ x: x, y: y, d: Math.max(Math.abs(x - t.x), Math.abs(y - t.y)) });
        }
        if (opts.length) {
          opts.sort((a, b) => a.d - b.d);
          u.x = opts[0].x; u.y = opts[0].y;
        }
      }
      Combat.endTurn(u);
    } else if (S.phase === 'ai') {
      Combat.aiTurn(S.active);
    } else {
      Combat.actNext();
    }
  }
  /* close the end modal(s): click the reward button so rewards/onWin/close run */
  function modalButtons(m) {
    const out = [];
    (function walk(n) { for (const c of (n.children || [])) { if (String(c.tagName).toUpperCase() === 'BUTTON') out.push(c); walk(c); } })(m);
    return out;
  }
  let g2 = 0;
  while (UI.stack.length && g2++ < 6) {
    const m = UI.stack[UI.stack.length - 1];
    const bar = m.querySelector('.mbar');
    const title = bar ? bar.textContent : '';
    if (/Victory|Withdrawn|Defeat/.test(title || '')) {
      const btns = modalButtons(m).filter((b) => b.onclick && b.textContent !== '×');
      const btn = btns[btns.length - 1];
      if (btn) { btn.onclick(); break; }
      UI.closeTop();
    } else UI.closeTop();
  }
}

console.log('— new game: thornwick —');
G.camp = { tab: 'saga', module: 'thornwick', done: {} };
const preg = D.PREGENS.slice(0, 3);
for (const p of preg) {
  const c = R.newChar({ race: p.race, cls: p.cls, name: p.name, scores: p.scores, spec: p.spec, foe: p.foe, align: p.align, color: p.color, level: 1, kit: false }, R.mulberry32(7));
  c.id = 'sim_' + p.id;
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
  G.party.push(c);
}
Game.beginAdventure();
ok(G.mapId === 'thornwick', 'started in thornwick');
ok(G.mode === 'play', 'mode is play');
ok(G.party.length === 3, 'party has 3 heroes');
ok(G.day === 1 && G.hour === 8, 'day 1, 8 AM');

console.log('— walk the town —');
const r1 = walkTo(6, 3);
ok(G.minute > 0 || G.hour > 8, 'time advanced: ' + Campaign.timeStr());

console.log('— descend to cellar —');
ok(G.mapId === 'thorn_cellar', 'stepping on the stair descended to thorn_cellar (walkTo=' + r1 + ')');

console.log('— find and fight an encounter —');
const cellar = D.MAPS.thorn_cellar;
const encKey = Object.keys(cellar.ev).find((k) => cellar.ev[k].enc);
ok(!!encKey, 'cellar has an encounter event (' + encKey + ')');
if (encKey) {
  const [ex, ey] = (() => {
    for (let y = 0; y < cellar.h; y++) for (let x = 0; x < cellar.w; x++) if (cellar.grid[y][x] === encKey) return [x, y];
    return null;
  })();
  ok(ex != null, 'encounter cell found at ' + ex + ',' + ey);
  if (ex != null) {
    let attempts = 0;
    while (attempts++ < 4 && !(G.pos.x === ex && G.pos.y === ey)) {
      const r2 = walkTo(ex, ey);
      if (r2 === 'combat') { simCombat(); }
      if (r2 === 'stair' || r2 === 'exit') break;
    }
    ok(G.mode !== 'combat', 'combat resolved (attempts ' + attempts + ')');
    const st = Game.stateFor('thorn_cellar');
    ok(st.encs && st.encs.includes(encKey), 'encounter marked cleared');
  }
}

console.log('— chest —');
const chestKey = Object.keys(cellar.ev).find((k) => cellar.ev[k].chest);
if (chestKey) {
  const goldBefore = G.gold;
  const [cx, cy] = (() => {
    for (let y = 0; y < cellar.h; y++) for (let x = 0; x < cellar.w; x++) if (cellar.grid[y][x] === chestKey) return [x, y];
    return null;
  })();
  if (cx != null) {
    let cAttempts = 0;
    while (cAttempts++ < 4 && !(G.pos.x === cx && G.pos.y === cy)) {
      const rc = walkTo(cx, cy);
      if (rc === 'combat') { simCombat(); }
      if (rc === 'stair' || rc === 'exit') break;
    }
    const cst = Game.stateFor('thorn_cellar');
    ok((cst.opened && cst.opened.includes(chestKey)) || goldBefore !== G.gold, 'chest opened / gold gained');
  }
}

console.log('— back up, exit to the wild —');
/* walk back to the stair cell on the cellar (the up-stair) */
const upKey = Object.keys(cellar.stairs || {})[0];
if (upKey) {
  const [ux, uy] = upKey.split(',').map(Number);
  let r3 = false, tries = 0;
  while (tries++ < 5 && G.mapId !== 'thornwick') {
    r3 = walkTo(ux, uy);
    if (r3 === 'combat') simCombat();
  }
  ok(G.mapId === 'thornwick', 'back in thornwick via up-stair (walkTo=' + r3 + ', tries ' + tries + ')');
  /* exit gate */
  const exitKey = Object.keys(D.MAPS.thornwick.exit)[0];
  const [gx, gy] = exitKey.split(',').map(Number);
  let r4 = false, tries2 = 0;
  while (tries2++ < 5 && G.mapId !== 'thorn_wild') {
    r4 = walkTo(gx, gy);
    if (r4 === 'combat') simCombat();
  }
  ok(G.mapId === 'thorn_wild', 'gate exit to thorn_wild (walkTo=' + r4 + ', tries ' + tries2 + ')');
  if (G.mapId === 'thorn_wild') {
    ok(G.mode === 'overland', 'overland mode');
    /* step a few times; maybe a wild encounter */
    let fights = 0;
    for (let i = 0; i < 14 && G.mapId === 'thorn_wild'; i++) {
      Game.move(2); /* south */
      if (G.mode === 'combat') { fights++; simCombat(); }
    }
    ok(true, 'wandered the wild (' + fights + ' fights)');
    ok(G.day >= 1, 'time: Day ' + G.day + ' ' + Campaign.timeStr());
  }
}

console.log('— save / load roundtrip —');
Game.save(1, false);
const meta = Campaign.slotMeta(1);
ok(meta && meta.day >= 1, 'slot 1 meta readable (Day ' + (meta && meta.day) + ')');
const goldBefore = G.gold;
G.gold = 0;
Game.load(1);
ok(G.gold === goldBefore, 'gold restored on load');
ok(G.started, 'G.started after load');

console.log('— generated adventure spot-check —');
G.camp = { tab: 'band1', module: 'adv_1_3', done: {} };
G.party = G.party.slice(0, 2);
G.quests = {};
Game.beginAdventure();
ok(G.mapId === 'home_adv_1_3', 'generated home entered');
const home = D.MAPS.home_adv_1_3;
const genStair = Object.keys(home.stairs)[0];
const [gsx, gsy] = genStair.split(',').map(Number);
const r5 = walkTo(gsx, gsy);
ok(G.mapId === 'dg_adv_1_3_f1', 'generated floor 1 entered via stair (walkTo=' + r5 + ', got ' + G.mapId + ')');

console.log('');
console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
