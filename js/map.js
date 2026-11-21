/* Emberfall — map.js
 * Minimap rendering and the full survey map (M). Marks: services in
 * their colors, stairs, gates, sites, treasure, traps, monsters. */
'use strict';
(function () {
const MapUI = window.MapUI = {};

MapUI.minimapEl = null; MapUI.fullEl = null; MapUI.infoEl = null;

MapUI.init = function () {
  MapUI.minimapEl = document.getElementById('minimap');
  MapUI.fullEl = document.getElementById('mapfull');
  MapUI.infoEl = document.getElementById('mapinfo');
  if (MapUI.minimapEl) {
    MapUI.minimapEl.width = 500; MapUI.minimapEl.height = 420;
  }
  if (MapUI.fullEl) {
    MapUI.fullEl.width = 640; MapUI.fullEl.height = 480;
    MapUI.fullEl.addEventListener('mousemove', MapUI.onHover);
    MapUI.fullEl.addEventListener('mouseleave', function () { MapUI.infoEl.textContent = ''; });
  }
};

MapUI.renderMinimap = function (services) {
  if (!MapUI.minimapEl) return;
  const ctx = MapUI.minimapEl.getContext('2d');
  V3.services = services;
  V3.minimap(ctx, 500, 420, false);
  ctx.strokeStyle = '#2a2018';
  ctx.strokeRect(0.5, 0.5, 499, 419);
};

MapUI.state = null; /* { map, seen, px, py, dir, services, marks } */
MapUI.fullOpen = false;

MapUI.openFull = function (state) {
  MapUI.state = state;
  if (!MapUI.fullEl) return;
  MapUI.fullOpen = true;
  MapUI.fullEl.style.display = 'block';
  MapUI.renderFull();
};
MapUI.closeFull = function () {
  MapUI.fullOpen = false;
  if (MapUI.fullEl) MapUI.fullEl.style.display = 'none';
  if (MapUI.infoEl) MapUI.infoEl.textContent = '';
};
MapUI.toggle = function (state) {
  if (MapUI.fullOpen) MapUI.closeFull();
  else MapUI.openFull(state);
};

const MARK_COLORS = {
  'D': '#c0a040', 'E': '#c0a040', 'F': '#c05050', 'H': '#c0a040', 'M': '#9a7ab0',
  '<': '#b8b8c0', '>': '#b8b8c0', 'G': '#9a9aa4',
  C: '#e8c840', P: '#9a7ac0', Q: '#5aa05a', X: '#c05050', S: '#c0c0c8'
};

MapUI.renderFull = function () {
  const st = MapUI.state;
  if (!st) return;
  const ctx = MapUI.fullEl.getContext('2d');
  const m = st.map;
  const s = Math.floor(Math.min(640 / m.w, 480 / m.h));
  const ox = Math.floor((640 - m.w * s) / 2), oy = Math.floor((480 - m.h * s) / 2);
  ctx.fillStyle = '#0c0a08';
  ctx.fillRect(0, 0, 640, 480);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const ch = m.grid[y][x];
    if (st.seen && !st.seen[y][x]) continue;
    let c = null;
    if (ch === '#') c = '#4a443c';
    else if (ch === 'H' || ch === 'B' || ch === 'M' || ch === 'F' || ch === 'S' || ch === 'G' || ch === 'X') c = MARK_COLORS[ch] || '#7a6a5a';
    else if (ch >= 'A' && ch <= 'Z') c = '#d0c060';
    else if (ch >= 'a' && ch <= 'z') c = '#d0a040';
    else if (MARK_COLORS[ch]) c = MARK_COLORS[ch];
    else if (ch !== '.' && ch !== ',') c = '#2e2a24';
    if (c) { ctx.fillStyle = c; ctx.fillRect(ox + x * s, oy + y * s, s, s); }
    else { ctx.fillStyle = m.overland ? '#444e36' : '#262220'; ctx.fillRect(ox + x * s, oy + y * s, s, s); }
  }
  /* services glow */
  if (st.services) {
    for (const key in st.services) {
      const [sx, sy] = key.split(',').map(Number);
      if (st.seen && (!st.seen[sy] || !st.seen[sy][sx])) continue;
      const sv = st.services[key];
      ctx.fillStyle = sv.color;
      ctx.fillRect(ox + sx * s - 1, oy + sy * s - 1, s + 2, s + 2);
      if (sv.color === '#e04040') {
        ctx.strokeStyle = '#e04040';
        ctx.strokeRect(ox + sx * s - 2.5, oy + sy * s - 2.5, s + 5, s + 5);
      }
    }
  }
  /* player */
  const pxx = ox + (st.px - 0.5) * s, pyy = oy + (st.py - 0.5) * s;
  ctx.fillStyle = '#f0e0a0';
  const a = st.dir * Math.PI / 2 - Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(pxx + Math.cos(a) * s * 1.1, pyy + Math.sin(a) * s * 1.1);
  ctx.lineTo(pxx + Math.cos(a + 2.5) * s * 0.8, pyy + Math.sin(a + 2.5) * s * 0.8);
  ctx.lineTo(pxx + Math.cos(a - 2.5) * s * 0.8, pyy + Math.sin(a - 2.5) * s * 0.8);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#2a2018';
  ctx.strokeRect(ox - 4, oy - 4, m.w * s + 8, m.h * s + 8);
  MapUI.geo = { ox: ox, oy: oy, s: s, m: m };
};

MapUI.onHover = function (e) {
  const st = MapUI.state;
  if (!st || !MapUI.geo) return;
  const r = MapUI.fullEl.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left - MapUI.geo.ox) / MapUI.geo.s);
  const y = Math.floor((e.clientY - r.top - MapUI.geo.oy) / MapUI.geo.s);
  const m = st.map;
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) { MapUI.infoEl.textContent = ''; return; }
  const ch = m.grid[y][x];
  let name = 'Unknown';
  if (ch === '#') name = 'Stone wall';
  else if (ch >= 'A' && ch <= 'Z' && m.ev && m.ev[ch]) name = m.ev[ch].name || ch;
  else if (ch >= 'a' && ch <= 'z' && m.ev && m.ev[ch]) name = m.ev[ch].name || ch;
  else if (st.services && st.services[x + ',' + y]) name = st.services[x + ',' + y].name;
  else if (ch === '<') name = 'Stair down';
  else if (ch === '>') name = 'Stair up';
  else if (ch === 'G') name = 'Gate';
  else if (ch === 'C') name = 'Chest';
  else if (ch === 'P') name = 'Potion shelf';
  else if (ch === 'Q') name = 'Quiver rack';
  else if (ch === 'X') name = 'Triggered trap';
  else if (ch === 'S') name = 'Shrine';
  else if (ch === 'T') name = 'Tree';
  else if (ch === '~') name = 'Water';
  else if (ch === '^') name = 'Hill';
  else if (ch === 'H') name = 'Building';
  else if (ch === 'B') name = 'Booth';
  else if (ch === 'F') name = 'Fountain';
  else if (ch === 'X') name = 'Ruin';
  else if (ch === '.' || ch === ',' || ch === ' ') name = st.map.overland ? 'Ground' : 'Floor';
  MapUI.infoEl.textContent = name;
};
})();
