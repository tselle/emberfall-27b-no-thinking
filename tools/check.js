/* Content validation: registry counts, grid integrity, fixtures, reachability,
 * quest/item/monster resolution. Run: node tools/check.js */
'use strict';
const { loadLayer } = require('./testenv.js');

let pass = 0, fail = 0;
const fails = [];
function ok(cond, msg) {
  if (cond) { pass++; }
  else { fail++; fails.push(msg); console.log('FAIL: ' + msg); }
}
function section(name) { console.log('\n== ' + name + ' =='); }

loadLayer();
const D = global.D, R = global.R;

/* ---------- grids ---------- */
section('maps');
const W = { thornwick: 19, thorn_cellar: 21, town: 25, crypt1: 25, crypt2: 25, tower: 19, wild: 48, thorn_wild: 48, cold_wild: 48, rav_wild: 48, cold_town: 23, cold_mine: 25, cold_barrow: 25, rav_fort: 21, rav_moor: 25, rav_keep: 25, rav_pit: 25 };
const H = { thornwick: 15, thorn_cellar: 15, town: 21, crypt1: 21, crypt2: 21, tower: 15, wild: 32, thorn_wild: 32, cold_wild: 32, rav_wild: 32, cold_town: 17, cold_mine: 21, cold_barrow: 21, rav_fort: 12, rav_moor: 21, rav_keep: 19, rav_pit: 18 };
const GEN_REGION = { small: [28, 20], medium: [32, 22], large: [36, 24], huge: [40, 26] };
function expectedSize(id) {
  if (W[id]) return [W[id], H[id]];
  const mods = global.M && global.M.MODULES;
  if (!mods) return null;
  if (id.indexOf('home_adv_') === 0) { const mo = mods[id.slice(5)]; return mo && mo.size === 'small' && mo.tier === 1 ? [19, 15] : [23, 17]; }
  if (id.indexOf('dg_adv_') === 0) return [25, 19];
  if (id.indexOf('wild_adv_') === 0) { const mo = mods[id.slice(5)]; return mo ? GEN_REGION[mo.size] : null; }
  return null;
}
let mapCount = 0;
for (const id of Object.keys(D.MAPS)) {
  mapCount++;
  const m = D.MAPS[id];
  const es = expectedSize(id);
  if (!es) { ok(false, id + ' has no expected size'); continue; }
  ok(m.grid.length === es[1], id + ' rows ' + es[1] + ' (got ' + m.grid.length + ')');
  const bad = m.grid.map((r, i) => [i, r.length]).filter(x => x[1] !== es[0]);
  ok(bad.length === 0, id + ' row widths ' + es[0] + (bad.length ? ' bad: ' + JSON.stringify(bad.slice(0, 8)) : ''));
}
console.log('  maps registered: ' + mapCount);

/* fixtures */
const tw = D.MAPS.thornwick;
if (tw.grid[5] && tw.grid[5][14] !== undefined) {
  ok(tw.grid[5][14] === '4', 'thornwick (14,5) service 4 got ' + JSON.stringify(tw.grid[5] && tw.grid[5][14]));
  ok(tw.grid[13][9] === '.', 'thornwick start (9,13) floor got ' + JSON.stringify(tw.grid[13] && tw.grid[13][9]));
  ok(tw.grid[14][9] === 'G', 'thornwick gate (9,14) got ' + JSON.stringify(tw.grid[14] && tw.grid[14][9]));
  ok(tw.grid[3][5] === '>' , 'thornwick brewery stair (5,3) got ' + JSON.stringify(tw.grid[3] && tw.grid[3][5]));
}
const tc = D.MAPS.thorn_cellar;
ok(tc.grid[1][10] === '<', 'cellar return stair (10,1)');
ok(tc.grid[10][10] === 'L', 'cellar locked door (10,10)');

/* service door adjacency to street */
function svcCheck(mapId, d, streetXY) {
  const m = D.MAPS[mapId];
  const [sx, sy] = streetXY;
  ok(m.grid[sy] && m.grid[sy][sx] === d, mapId + ' service ' + d + ' at (' + sx + ',' + sy + ') got ' + JSON.stringify(m.grid[sy] && m.grid[sy][sx]));
}
if (D.MAPS.town.grid[8] && D.MAPS.town.grid[8].length === 25) {
  ok(D.MAPS.town.grid[8][4] === '1', 'town service 1 at (4,8)');
  ok(D.MAPS.town.grid[8][9] === '2', 'town service 2 at (9,8)');
  ok(D.MAPS.town.grid[8][14] === '3', 'town service 3 at (14,8)');
  ok(D.MAPS.town.grid[8][19] === '7', 'town service 7 at (19,8)');
  ok(D.MAPS.town.grid[20][12] === 'G', 'town gate (12,20)');
}

/* ---------- spells ---------- */
section('spells');
let mw = 0, mc = 0;
for (const id of Object.keys(D.SPELLS)) { const s = D.SPELLS[id]; if (s.c === 'M') mw++; else mc++; }
ok(Object.keys(D.SPELLS).length === 74, '74 spells (got ' + Object.keys(D.SPELLS).length + ')');
ok(mw === 40, '40 wizard (got ' + mw + ')');
ok(mc === 34, '34 priest (got ' + mc + ')');

/* ---------- items ---------- */
section('items');
const itemCount = Object.keys(D.ITEMS).length;
console.log('  base item definitions: ' + itemCount + ' (target 261 before generation, 316 after)');

/* ---------- monsters ---------- */
section('monsters');
const sagaCount = (D.SAGA_MONS || []).length;
const namedCount = Object.keys(D.MONSTERS).filter(k => k.indexOf('boss_adv_') === 0 || k.indexOf('lieutenant_adv_') === 0).length;
const monCount = Object.keys(D.MONSTERS).length;
ok(sagaCount === 40, '40 saga monsters (got ' + sagaCount + ')');
ok(namedCount === 100, '100 named generated leaders (got ' + namedCount + ')');
ok(monCount >= sagaCount + 191 + 100, 'saga + >=191 wider + 100 named (total ' + monCount + ')');
let monBad = 0;
for (const id of Object.keys(D.MONSTERS)) {
  const m = D.MONSTERS[id];
  if (!m.hp || !m.ac || !m.mv || !Array.isArray(m.atk) || !m.name) { monBad++; if (monBad < 4) console.log('  bad monster ' + id); }
}
ok(monBad === 0, 'all ' + monCount + ' stat blocks well-formed');

/* ---------- quests ---------- */
section('quests');
ok(D.QUEST_ORDER.length === 13, '13 authored quests (got ' + D.QUEST_ORDER.length + ')');
const genQuests = Object.keys(D.QUESTS).filter(k => k.indexOf('deed_adv_') === 0 || k.indexOf('fetch_adv_') === 0 || k.indexOf('fetch2_adv_') === 0);
ok(genQuests.length === 105, '105 generated quests (got ' + genQuests.length + ')');
ok(Object.keys(D.QUESTS).length === 118, '118 total quests (got ' + Object.keys(D.QUESTS).length + ')');
const q = D.QUESTS.thorn_kobolds;
ok(q && 5 * Math.round(q.xp * 0.25 / 5) === 200, 'skarrik pays 200 each (xp ' + (q && q.xp) + ')');
const qr = D.QUESTS.thorn_ring;
ok(qr && 5 * Math.round(qr.xp * 0.25 / 5) === 50, 'ring pays 50 each');
const qrf = D.QUESTS.redfang;
ok(qrf && 5 * Math.round(qrf.xp * 0.25 / 5) === 190, 'redfang pays 190 each (listed ' + (qrf && qrf.xp) + ')');

/* ---------- module counts (E0/E1) ---------- */
section('module counts');
function counts(mapId) {
  const m = D.MAPS[mapId];
  let enc = 0, chest = 0;
  for (const k in (m.ev || {})) { if (m.ev[k].enc) enc++; if (m.ev[k].chest) chest++; }
  return { enc, chest };
}
const c0 = counts('thorn_cellar');
ok(c0.enc === 6 && c0.chest === 5, 'E0 cellar 6 enc / 5 chest (got ' + c0.enc + '/' + c0.chest + ')');
const c1a = counts('town'), c1b = counts('crypt1'), c1c = counts('crypt2'), c1d = counts('tower');
ok(c1a.enc + c1b.enc + c1c.enc + c1d.enc === 16, 'E1 enc total 16 (got ' + (c1a.enc + c1b.enc + c1c.enc + c1d.enc) + ')');
ok(c1a.chest + c1b.chest + c1c.chest + c1d.chest === 15, 'E1 chest total 15 (got ' + (c1a.chest + c1b.chest + c1c.chest + c1d.chest) + ')');
ok(Object.keys(D.MAPS.wild.sites).length === 10, 'E1 wild 10 sites');

/* ---------- wilds ---------- */
section('wilds');
for (const id of window.W ? window.W.regions : ['thorn_wild', 'wild', 'cold_wild', 'rav_wild']) {
  const m = D.MAPS[id];
  ok(m, id + ' region exists');
  if (!m) continue;
  ok((m.wildEnc || []).length >= 8, id + ' has scheduled wild encounters (' + ((m.wildEnc || []).length) + ')');
  const r = reach(id);
  ok(r.okStart, id + ' start walkable');
  let badSites = 0, seenG = false;
  for (let y = 0; y < m.grid.length; y++) for (let x = 0; x < m.grid[0].length; x++) {
    const ch = m.grid[y][x];
    if (ch >= 'A' && ch <= 'Z' && !r.seen[y][x]) { badSites++; if (badSites < 4) console.log('  unreachable site ' + id + ' ' + ch); }
    if (ch === 'G') seenG = r.seen[y][x];
    if (walkable(m, ch) && !r.seen[y][x]) { /* terrain is all reachable via tracks; report count only */ }
  }
  ok(badSites === 0, id + ' all sites reachable (bad ' + badSites + ')');
  ok(seenG, id + ' gate reachable');
}

/* ---------- content references ---------- */
section('references');
let refBad = 0;
for (const id of Object.keys(D.MAPS)) {
  const m = D.MAPS[id];
  for (const k in (m.ev || {})) {
    const e = m.ev[k];
    if (e.enc) for (const [mid] of e.enc.mons) if (!D.MONSTERS[mid]) { refBad++; console.log('  unknown monster ' + id + ' ev ' + k + ': ' + mid); }
    if (e.chest && e.chest.items) for (const it of e.chest.items) if (!D.item(it)) { refBad++; console.log('  unknown item ' + id + ' ev ' + k + ': ' + it); }
    if (e.enc && e.enc.items) for (const it of e.enc.items) if (!D.item(it)) { refBad++; console.log('  unknown enc item ' + id + ' ev ' + k + ': ' + it); }
    if (e.quest && !D.QUESTS[e.quest]) { refBad++; console.log('  unknown quest ' + id + ' ev ' + k + ': ' + e.quest); }
  }
  if (m.wildEnc) for (const e of m.wildEnc) for (const [mid] of e.mons) if (!D.MONSTERS[mid]) { refBad++; console.log('  unknown wild monster ' + id + ': ' + mid); }
}
for (const qid of Object.keys(D.QUESTS)) {
  const q = D.QUESTS[qid];
  if (q.needItem && !D.item(q.needItem)) { refBad++; console.log('  quest ' + qid + ' needItem missing: ' + q.needItem); }
  if (q.items) for (const it of q.items) if (!D.item(it)) { refBad++; console.log('  quest ' + qid + ' item missing: ' + it); }
}
/* module quests/side resolve */
for (const mid of Object.keys(window.M.MODULES)) {
  const mo = window.M.MODULES[mid];
  for (const qid of [...(mo.quests || []), ...(mo.side || [])]) if (!D.QUESTS[qid]) { refBad++; console.log('  module ' + mid + ' quest missing: ' + qid); }
}
ok(refBad === 0, 'all monster/item/quest references resolve (bad ' + refBad + ')');

/* ---------- E2/E3 counts ---------- */
section('E2/E3 counts');
const c2t = counts('cold_town'), c2m = counts('cold_mine'), c2b = counts('cold_barrow');
ok(c2t.enc + c2m.enc + c2b.enc === 12, 'E2 enc total 12 (got ' + (c2t.enc + c2m.enc + c2b.enc) + ')');
ok(c2t.chest + c2m.chest + c2b.chest === 8, 'E2 chest total 8 (got ' + (c2t.chest + c2m.chest + c2b.chest) + ')');
ok(Object.keys(D.MAPS.cold_wild.ev).length === 8, 'E2 wild 8 sites (got ' + Object.keys(D.MAPS.cold_wild.ev).length + ')');
const c3f = counts('rav_fort'), c3m = counts('rav_moor'), c3k = counts('rav_keep'), c3p = counts('rav_pit');
ok(c3f.enc + c3m.enc + c3k.enc + c3p.enc === 18, 'E3 enc total 18 (got ' + (c3f.enc + c3m.enc + c3k.enc + c3p.enc) + ')');
ok(c3f.chest + c3m.chest + c3k.chest + c3p.chest === 10, 'E3 chest total 10 (got ' + (c3f.chest + c3m.chest + c3k.chest + c3p.chest) + ')');
ok(Object.keys(D.MAPS.rav_wild.ev).length === 8, 'E3 wild 8 sites (got ' + Object.keys(D.MAPS.rav_wild.ev).length + ')');

/* ---------- reachability (local maps) ---------- */
section('reachability');
function walkable(m, ch) {
  if (ch === undefined) return false;
  if (m.overland) return '.,=+Tn%'.includes(ch) || (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z');
  return m.floor.includes(ch) || 'DLS<>' .includes(ch) || (ch >= 'a' && ch <= 'z') || (ch >= '1' && ch <= '9') || ch === 'G';
}
function reach(mapId) {
  const m = D.MAPS[mapId];
  const W = m.grid[0].length, Hh = m.grid.length;
  const seen = Array.from({ length: Hh }, () => new Array(W).fill(false));
  const s = m.start;
  const q = [[s.x, s.y]];
  seen[s.y][s.x] = true;
  let okStart = walkable(m, m.grid[s.y][s.x]);
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= Hh) continue;
      if (seen[ny][nx]) continue;
      const ch = m.grid[ny][nx];
      if (!walkable(m, ch)) continue;
      seen[ny][nx] = true;
      q.push([nx, ny]);
    }
  }
  return { seen, okStart, W, Hh };
}
for (const id of Object.keys(D.MAPS)) {
  if (D.MAPS[id].overland) continue; /* overland checked below */
  const m = D.MAPS[id];
  const r = reach(id);
  if (!r.okStart) ok(false, id + ' start cell walkable (' + m.start.x + ',' + m.start.y + '="' + m.grid[m.start.y] && m.grid[m.start.y][m.start.x] + '")');
  let badCells = 0;
  for (let y = 0; y < r.Hh; y++) for (let x = 0; x < r.W; x++) {
    const ch = m.grid[y][x];
    if (walkable(m, ch) && !r.seen[y][x]) {
      badCells++;
      if (badCells <= 3) console.log('  unreachable ' + id + ' (' + x + ',' + y + ') "' + ch + '"');
    }
  }
  ok(badCells === 0, id + ' all walkable cells reachable (bad ' + badCells + ')');
  /* service doors reachable */
  for (const d in (m.locs || {})) {
    let found = false;
    for (let y = 0; y < r.Hh; y++) for (let x = 0; x < r.W; x++) if (m.grid[y][x] === d) found = r.seen[y][x];
    if (!found) ok(false, id + ' service ' + d + ' reachable');
  }
  /* event cells reachable (single-letter keys only) */
  for (const k in (m.ev || {})) {
    if (!/^[a-z]$/.test(k)) continue;
    let found = false;
    for (let y = 0; y < r.Hh; y++) for (let x = 0; x < r.W; x++) if (m.grid[y][x] === k) found = r.seen[y][x];
    if (!found) ok(false, id + ' event "' + k + '" not reachable');
  }
}
/* overland reachability: gates and sites */
const SITE_CHARS = 'ABCDEFGHIJ';
const AUTHORED_WILD = ['thorn_wild', 'wild', 'cold_wild', 'rav_wild'];
for (const id of Object.keys(D.MAPS)) {
  if (!D.MAPS[id].overland) continue;
  const m = D.MAPS[id];
  const r = reach(id);
  if (!r.okStart) ok(false, id + ' region start walkable');
  let badSites = 0, seenG = false, badTerrain = 0;
  for (let y = 0; y < r.Hh; y++) for (let x = 0; x < r.W; x++) {
    const ch = m.grid[y][x];
    if (SITE_CHARS.includes(ch)) { if (!r.seen[y][x]) { badSites++; if (badSites < 4) console.log('  unreachable site ' + id + ' ' + ch); } }
    if (ch === 'G') seenG = r.seen[y][x];
    if (AUTHORED_WILD.includes(id) && walkable(m, ch) && !r.seen[y][x]) { badTerrain++; if (badTerrain < 4) console.log('  unreachable terrain ' + id + ' (' + x + ',' + y + ') "' + ch + '"'); }
  }
  ok(badSites === 0, id + ' all sites reachable (bad ' + badSites + ')');
  ok(seenG, id + ' gate reachable');
  if (AUTHORED_WILD.includes(id)) ok(badTerrain === 0, id + ' all walkable terrain reachable (bad ' + badTerrain + ')');
}

/* ---------- campaigns & modules ---------- */
section('campaigns');
const M = global.M, A = global.A;
ok(Object.keys(M.MODULES).length === 54, '54 playable modules (got ' + Object.keys(M.MODULES).length + ')');
ok(A.CAMPAIGNS.length === 6, '6 campaign tabs (got ' + A.CAMPAIGNS.length + ')');
ok(A.order.length === 50, '50 generated adventures (got ' + A.order.length + ')');
let campBad = 0;
for (let k = 0; k < A.order.length; k++) {
  const mo = M.MODULES[A.order[k]];
  if (!mo) { campBad++; continue; }
  if (mo.next !== (k + 1 < A.order.length ? A.order[k + 1] : null)) { campBad++; console.log('  bad next link ' + mo.code); }
  if (mo.final !== (k === A.order.length - 1)) { campBad++; console.log('  bad final flag ' + mo.code); }
  for (const mpid of mo.maps) if (!D.MAPS[mpid]) { campBad++; console.log('  missing map ' + mpid); }
  if (mo.quests && mo.quests[0] && D.QUESTS[mo.quests[0]] && D.QUESTS[mo.quests[0]].needItem) { /* deed quests have no needItem */ }
}
ok(campBad === 0, 'campaign order/links/maps resolve (bad ' + campBad + ')');
ok(Object.keys(D.ITEMS).length === 316, '316 item definitions after generation (got ' + Object.keys(D.ITEMS).length + ')');

/* ---------- transitions reciprocal ---------- */
section('transitions');
for (const id of Object.keys(D.MAPS)) {
  const m = D.MAPS[id];
  if (m.stairs) for (const key in m.stairs) {
    const t = m.stairs[key];
    const dm = D.MAPS[t.to];
    ok(dm, id + ' stair ' + key + ' -> ' + t.to + ' exists');
    if (dm && !dm.overland) {
      const { x, y } = t.at;
      ok(dm.grid[y] && dm.grid[y][x] !== undefined && walkable(dm, dm.grid[y][x]), id + ' stair ' + key + ' arrival walkable in ' + t.to);
    }
  }
  if (m.exit) for (const key in m.exit) {
    const t = m.exit[key];
    const dm = D.MAPS[t.to];
    ok(dm, id + ' exit ' + key + ' -> ' + t.to + ' exists');
  }
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
