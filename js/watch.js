/* Emberfall — watch.js
 * Placed-band watch: line of sight, detection ranges, hidden ambush,
 * hearing through walls, and guarded treasure.
 * Sight 9.5, detection 6.5, hidden ambush 1.5, hearing 11.5. */
'use strict';
(function () {
const Watch = window.Watch = {};

const SIGHT = 9.5, DETECT = 6.5, AMBUSH = 1.5, HEAR = 11.5;

function opaqueAt(map, x, y) {
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return true;
  const ch = map.grid[y][x];
  return ch === '#' || ch === 'H' || ch === 'B' || ch === 'M' || ch === 'F' || ch === 'S' || ch === 'X';
}

/* straight-line LOS on the grid (Bresenham), walls block, doors/G pass */
Watch.los = function (map, x0, y0, x1, y1) {
  if (x0 === x1 && y0 === y1) return true;
  let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, x = x0, y = y0;
  while (!(x === x1 && y === y1)) {
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
    if (x === x1 && y === y1) break;
    if (opaqueAt(map, x, y)) return false;
  }
  return true;
};

/* scan placed monsters (bands) against the player position.
 * state: { map, px, py (int cells), monsters: [{x, y, mon, band, hidden}] }
 * returns array of { mon, mode } for those that should act. */
Watch.scan = function (state) {
  const m = state.map, px = state.px, py = state.py;
  const out = [];
  for (const mo of state.monsters || []) {
    const dx = mo.x - px, dy = mo.y - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (mo.hidden) {
      if (dist <= AMBUSH) out.push({ mon: mo, mode: 'ambush' });
      else if (dist <= SIGHT && Watch.los(m, mo.x, mo.y, px, py)) out.push({ mon: mo, mode: 'ambush' });
      continue;
    }
    if (dist <= DETECT) { out.push({ mon: mo, mode: 'detect' }); continue; }
    if (dist <= SIGHT && Watch.los(m, mo.x, mo.y, px, py)) out.push({ mon: mo, mode: 'sight' });
    else if (dist <= HEAR && Math.random() < 0.001) out.push({ mon: mo, mode: 'heard' });
  }
  return out;
};

/* guarded treasure: a monster assigned to guard a cell reacts if the
 * player is within sight and can see the cell (or the guard). */
Watch.guarded = function (state, guardCell, guardMon) {
  const m = state.map, px = state.px, py = state.py;
  const dx = guardCell.x - px, dy = guardCell.y - py;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > SIGHT) return false;
  if (Watch.los(m, px, py, guardCell.x, guardCell.y)) return true;
  if (guardMon) {
    const gx = guardMon.x - px, gy = guardMon.y - py;
    if (Math.sqrt(gx * gx + gy * gy) <= SIGHT && Watch.los(m, px, py, guardMon.x, guardMon.y)) return true;
  }
  return false;
};
})();
