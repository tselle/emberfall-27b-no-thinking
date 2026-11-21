/* Emberfall — view3d.js
 * Software raycaster for the first-person view: textured walls, doors,
 * distance fog, torch/daylight, outdoor scenes, billboards (party,
 * monsters, treasure), and the minimap. */
'use strict';
(function () {
const V3 = window.V3 = {};
const R = window.R;

const VW = 480, VH = 300; /* internal resolution; scaled up by CSS */

/* ---------- procedural textures (64x64) ---------- */
const texCache = {};
function noise(rng, w, h, base, amp) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const c = parseInt(base.slice(1), 16);
  let r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rng() - 0.5) * amp;
    img.data[i] = Math.max(0, Math.min(255, r + n));
    img.data[i + 1] = Math.max(0, Math.min(255, g + n));
    img.data[i + 2] = Math.max(0, Math.min(255, b + n));
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}
function brickTex(base, mortar, seed, rows, cols) {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
  const ctx = cv.getContext('2d');
  const rng = R.mulberry32(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = mortar; ctx.lineWidth = 1;
  const bh = 64 / rows, bw = 64 / cols;
  for (let ry = 0; ry < rows; ry++) {
    const off = (ry % 2) * bw / 2;
    for (let cx = -1; cx < cols + 1; cx++) {
      const x = cx * bw + off, y = ry * bh;
      ctx.fillStyle = shade(base, 0.82 + rng() * 0.3);
      ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2);
    }
  }
  const n = noise(rng, 64, 64, '#000000', 26);
  ctx.globalAlpha = 0.16; ctx.drawImage(n, 0, 0); ctx.globalAlpha = 1;
  ctx.strokeStyle = mortar;
  for (let ry = 0; ry <= rows; ry++) { ctx.beginPath(); ctx.moveTo(0, ry * bh); ctx.lineTo(64, ry * bh); ctx.stroke(); }
  return cv;
}
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f)));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * f)));
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}
function stoneTex(seed) {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
  const ctx = cv.getContext('2d');
  const rng = R.mulberry32(seed);
  ctx.fillStyle = '#585450'; ctx.fillRect(0, 0, 64, 64);
  /* irregular stone blocks */
  for (let i = 0; i < 70; i++) {
    const x = rng() * 64, y = rng() * 64, w = 6 + rng() * 14, h = 4 + rng() * 9;
    ctx.fillStyle = shade('#5e5a54', 0.7 + rng() * 0.5);
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.strokeRect(x, y, w, h);
  }
  const n = noise(rng, 64, 64, '#000', 30);
  ctx.globalAlpha = 0.2; ctx.drawImage(n, 0, 0); ctx.globalAlpha = 1;
  return cv;
}
function doorTex(tone, seed) {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
  const ctx = cv.getContext('2d');
  const rng = R.mulberry32(seed);
  const base = tone || '#4a3420';
  ctx.fillStyle = base; ctx.fillRect(0, 0, 64, 64);
  for (let x = 0; x < 64; x += 8) {
    ctx.fillStyle = shade(base, 0.75 + rng() * 0.4);
    ctx.fillRect(x + 1, 0, 6, 64);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 64); ctx.stroke();
  }
  ctx.strokeStyle = '#8a8a92'; ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 56, 56);
  ctx.beginPath(); ctx.moveTo(4, 26); ctx.lineTo(60, 26); ctx.moveTo(4, 44); ctx.lineTo(60, 44); ctx.stroke();
  const n = noise(rng, 64, 64, '#000', 20);
  ctx.globalAlpha = 0.15; ctx.drawImage(n, 0, 0); ctx.globalAlpha = 1;
  return cv;
}
function archTex(seed, dark) {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.drawImage(stoneTex(seed), 0, 0);
  ctx.fillStyle = dark ? '#080604' : '#1a140c';
  ctx.fillRect(16, 8, 32, 56);
  ctx.strokeStyle = '#3a3228'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(32, 14, 16, Math.PI, 0); ctx.stroke();
  return cv;
}
function stairTex(down, seed) {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
  const ctx = cv.getContext('2d');
  const rng = R.mulberry32(seed);
  ctx.fillStyle = '#4a4640'; ctx.fillRect(0, 0, 64, 64);
  const cols = down ? 7 : 7;
  for (let i = 0; i < 7; i++) {
    const y = down ? 8 + i * 8 : 48 - i * 8;
    const w = 14 + i * 5;
    ctx.fillStyle = shade('#5a554c', 0.6 + i * 0.08);
    ctx.fillRect(32 - w / 2, y - (down ? 0 : 6), w, 6);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.strokeRect(32 - w / 2, y - (down ? 0 : 6), w, 6);
  }
  const n = noise(rng, 64, 64, '#000', 24);
  ctx.globalAlpha = 0.25; ctx.drawImage(n, 0, 0); ctx.globalAlpha = 1;
  return cv;
}
function gateTex(seed) {
  const cv = archTex(seed + 9, true);
  const ctx = cv.getContext('2d');
  ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 2;
  for (let x = 18; x < 46; x += 5) { ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, 64); ctx.stroke(); }
  return cv;
}
function wallFor(style, side, doorCh, seed) {
  const key = style + '|' + side + '|' + (doorCh || '');
  if (texCache[key]) return texCache[key];
  let cv;
  switch (style) {
    case 'town': cv = doorCh ? doorTex(doorTone(doorCh), seed + 3) : brickTex('#7a6a52', '#4a4034', seed + 11, 8, 4); break;
    case 'brick': cv = doorCh ? doorTex('#5a3a28', seed + 3) : brickTex('#6a4a3a', '#3a2a20', seed + 17, 6, 3); break;
    case 'stone': cv = doorCh ? doorTex('#3a3428', seed + 5) : stoneTex(seed + 23); break;
    case 'crypt': cv = doorCh ? doorTex('#2e2a30', seed + 7) : brickTex('#55505c', '#2c2832', seed + 29, 4, 2); break;
    case 'mine': cv = doorCh ? doorTex('#3a2e22', seed + 9) : stoneTex(seed + 37); break;
    case 'barrow': cv = doorCh ? archTex(seed + 13, true) : stoneTex(seed + 41); break;
    case 'keep': cv = doorCh ? doorTex('#423a30', seed + 11) : brickTex('#6e685c', '#3c382e', seed + 43, 5, 2); break;
    case 'cave': cv = stoneTex(seed + 47); break;
    case 'wild': cv = doorCh ? doorTex('#4a3a28', seed + 51) : brickTex('#7a6a52', '#4a4034', seed + 53, 6, 3); break;
    default: cv = stoneTex(seed + 1);
  }
  if (side === 'y') {
    /* darken vertical walls slightly for depth */
    const d = document.createElement('canvas'); d.width = 64; d.height = 64;
    const c = d.getContext('2d');
    c.drawImage(cv, 0, 0);
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(0, 0, 64, 64);
    cv = d;
  }
  texCache[key] = cv;
  return cv;
}
function doorTone(ch) {
  if (ch === 'M') return '#3a3440';
  if (ch === 'F') return '#4a3030';
  if (ch === 'E') return '#5a4a2a';
  return '#4a3420';
}

/* outdoor building billboard textures */
function buildingTex(kind, seed) {
  const key = 'bld|' + kind + '|' + seed % 7;
  if (texCache[key]) return texCache[key];
  const cv = document.createElement('canvas');
  cv.width = 96; cv.height = 96;
  const ctx = cv.getContext('2d');
  const rng = R.mulberry32(seed + 71);
  const tints = {
    house: ['#7a6a52', '#4a3420'], shop: ['#6a5a7a', '#4a3a28'], temple: ['#8a8578', '#5a554a'],
    hall: ['#7a5a4a', '#4a2e20'], tavern: ['#6a6a4a', '#4a4030'], stairs: ['#5e5a54', '#3a362e'],
    inn: ['#7a6a5a', '#4a3a2a']
  };
  const [wall, roof] = tints[kind] || tints.house;
  /* roof */
  ctx.fillStyle = shade(roof, 1.1);
  ctx.beginPath(); ctx.moveTo(0, 34); ctx.lineTo(48, 6); ctx.lineTo(96, 34); ctx.lineTo(84, 34); ctx.lineTo(48, 14); ctx.lineTo(12, 34); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade(roof, 0.8);
  ctx.fillRect(10, 30, 76, 10);
  /* walls */
  ctx.fillStyle = wall;
  ctx.fillRect(12, 40, 72, 56);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  for (let x = 12; x < 84; x += 10) { ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, 96); ctx.stroke(); }
  /* door */
  ctx.fillStyle = roof;
  ctx.fillRect(40, 62, 16, 34);
  ctx.strokeStyle = '#2a241c'; ctx.strokeRect(40, 62, 16, 34);
  /* windows, lit at night (drawn on by caller via alpha trick: warm yellow) */
  ctx.fillStyle = '#e8b840';
  ctx.fillRect(22, 52, 10, 12);
  ctx.fillRect(64, 52, 10, 12);
  ctx.strokeStyle = '#2a241c';
  ctx.strokeRect(22, 52, 10, 12);
  ctx.strokeRect(64, 52, 10, 12);
  if (kind === 'temple') {
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(44, 44, 8, 12);
  }
  const n = noise(rng, 96, 96, '#000', 18);
  ctx.globalAlpha = 0.18; ctx.drawImage(n, 0, 0); ctx.globalAlpha = 1;
  texCache[key] = cv;
  return cv;
}
function treeTex(seed) {
  const key = 'tree|' + seed % 5;
  if (texCache[key]) return texCache[key];
  const cv = document.createElement('canvas');
  cv.width = 48; cv.height = 64;
  const ctx = cv.getContext('2d');
  const rng = R.mulberry32(seed + 97);
  ctx.fillStyle = '#4a3624';
  ctx.fillRect(21, 40, 6, 24);
  const greens = ['#2e4a26', '#35542c', '#26401f'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = greens[i];
    ctx.beginPath();
    ctx.moveTo(24, 2);
    ctx.lineTo(40 + i * 3, 34 + i * 6);
    ctx.lineTo(8 - i * 3, 34 + i * 6);
    ctx.closePath();
    ctx.fill();
  }
  const n = noise(rng, 48, 64, '#000', 22);
  ctx.globalAlpha = 0.2; ctx.drawImage(n, 0, 0); ctx.globalAlpha = 1;
  texCache[key] = cv;
  return cv;
}
function shrineTex(seed) {
  const cv = document.createElement('canvas'); cv.width = 40; cv.height = 56;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#6a655c';
  ctx.fillRect(10, 14, 20, 42);
  ctx.fillRect(6, 8, 28, 8);
  ctx.beginPath(); ctx.moveTo(6, 8); ctx.lineTo(20, 0); ctx.lineTo(34, 8); ctx.closePath();
  ctx.fillStyle = '#7a756c'; ctx.fill();
  ctx.fillStyle = 'rgba(255,220,120,0.8)';
  ctx.fillRect(17, 26, 6, 10);
  return cv;
}
function fountainTex(seed) {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 56;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#6a655c';
  ctx.beginPath(); ctx.ellipse(32, 46, 28, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4a7a9a';
  ctx.beginPath(); ctx.ellipse(32, 45, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a756c';
  ctx.fillRect(28, 18, 8, 28);
  ctx.fillRect(22, 14, 20, 6);
  ctx.fillStyle = 'rgba(160,210,230,0.8)';
  ctx.beginPath(); ctx.arc(32, 12, 3, 0, Math.PI * 2); ctx.fill();
  return cv;
}
function ruinTex(seed) {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 56;
  const ctx = cv.getContext('2d');
  const rng = R.mulberry32(seed + 131);
  ctx.fillStyle = '#5e5a54';
  for (let i = 0; i < 4; i++) {
    const h = 14 + rng() * 30;
    ctx.fillRect(8 + i * 14, 56 - h, 9, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.strokeRect(8 + i * 14, 56 - h, 9, h);
  }
  return cv;
}

/* ---------- core ---------- */
V3.canvas = null; V3.ctx = null;
V3.W = VW; V3.H = VH;

V3.init = function (canvas) {
  V3.canvas = canvas;
  canvas.width = VW; canvas.height = VH;
  V3.ctx = canvas.getContext('2d');
  V3.ctx.imageSmoothingEnabled = false;
  V3.zbuf = new Float32Array(VW);
};

V3.map = null; V3.seen = null; V3.dayFrac = 0.5;
V3.px = 0; V3.py = 0; V3.dir = 0; /* 0 N, 1 E, 2 S, 3 W (float allowed) */
V3.party = []; V3.monsters = []; V3.treasure = null;

V3.prepare = function (mapId) {
  V3.map = D.MAPS[mapId];
  const m = V3.map;
  V3.mapW = m.w; V3.mapH = m.h;
  V3.overland = !!m.overland;
  if (V3.px === 0 && V3.py === 0 && m.start) { V3.px = m.start.x + 0.5; V3.py = m.start.y + 0.5; }
  if (m.start && m.start.dir != null) V3.dir = m.start.dir;
  V3.style = m.style || 'stone';
};

function cell(x, y) {
  const m = V3.map;
  if (!m || x < 0 || y < 0 || x >= m.w || y >= m.h) return '#';
  return m.grid[y][x];
}
function opaque(ch) { return ch === '#' || ch === 'H' || ch === 'B' || ch === 'M' || ch === 'F' || ch === 'S' || ch === 'G' || ch === 'X'; }
function isDoor(ch) { return ch === 'D' || ch === 'E' || ch === 'F' || ch === 'M' || ch === 'H'; }

function dayLight() {
  const t = V3.dayFrac;
  if (t < 0.22 || t > 0.82) return 0;          /* night */
  if (t < 0.35) return (t - 0.22) / 0.13;       /* dawn */
  if (t < 0.7) return 1;                        /* day */
  return (0.82 - t) / 0.12;                     /* dusk */
}

V3.render = function () {
  const ctx = V3.ctx, W = V3.W, H = V3.H;
  const dl = dayLight();
  const indoor = !V3.overland;
  const light = indoor ? 0.85 : (0.25 + 0.75 * dl);
  const m = V3.map;
  const Wm = V3.mapW, Hm = V3.mapH;
  const ang = V3.dir * Math.PI / 2 - Math.PI / 2; /* dir 0 = north = -y */
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const pxB = -dy, pyB = dx;

  /* sky */
  if (V3.overland) {
    const g = ctx.createLinearGradient(0, 0, 0, H / 2);
    if (dl > 0.5) { g.addColorStop(0, '#3a5a8a'); g.addColorStop(1, '#7a9ab8'); }
    else if (dl > 0.05) { g.addColorStop(0, '#2a2040'); g.addColorStop(1, '#7a4a3a'); }
    else { g.addColorStop(0, '#080a14'); g.addColorStop(1, '#1a1a28'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H / 2);
    /* stars at night */
    if (dl < 0.05) {
      const rng = R.mulberry32(1234);
      ctx.fillStyle = 'rgba(220,230,255,0.8)';
      for (let i = 0; i < 60; i++) ctx.fillRect(rng() * W, rng() * H * 0.4, 1, 1);
    }
    /* distant hills */
    ctx.fillStyle = dl > 0.3 ? '#3a4a42' : '#141820';
    ctx.beginPath(); ctx.moveTo(0, H / 2);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, H / 2 - 8 - 6 * Math.sin(x * 0.05 + 1.7));
    ctx.lineTo(W, H / 2); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = '#0a0808';
    ctx.fillRect(0, 0, W, H / 2);
  }
  /* floor */
  const fg = ctx.createLinearGradient(0, H / 2, 0, H);
  const floorC = V3.overland ? (dl > 0.3 ? '#4a5a3a' : '#2a3028') : '#3a352e';
  fg.addColorStop(0, shade(floorC, 0.35));
  fg.addColorStop(1, shade(floorC, light * 1.1));
  ctx.fillStyle = fg; ctx.fillRect(0, H / 2, W, H / 2);

  /* cast rays (2px columns) */
  const COLW = 2;
  const cols = W / COLW;
  const seenDist = 12; /* torch/wild sight */
  for (let c = 0; c < cols; c++) {
    const camX = 2 * c / cols - 1;
    const rdx = dx + pxB * camX, rdy = dy + pyB * camX;
    let mapX = Math.floor(V3.px), mapY = Math.floor(V3.py);
    const ddx = Math.abs(1 / (rdx || 1e-9)), ddy = Math.abs(1 / (rdy || 1e-9));
    let stepX, stepY, sdx, sdy;
    if (rdx < 0) { stepX = -1; sdx = (V3.px - mapX) * ddx; } else { stepX = 1; sdx = (mapX + 1 - V3.px) * ddx; }
    if (rdy < 0) { stepY = -1; sdy = (V3.py - mapY) * ddy; } else { stepY = 1; sdy = (mapY + 1 - V3.py) * ddy; }
    let side = 0, hitCh = null, hitX = mapX, hitY = mapY, dist = 0;
    for (let i = 0; i < 48; i++) {
      if (sdx < sdy) { sdx += ddx; mapX += stepX; side = 0; } else { sdy += ddy; mapY += stepY; side = 1; }
      const ch = cell(mapX, mapY);
      if (opaque(ch) && !(ch === 'G')) { hitCh = ch; hitX = mapX; hitY = mapY; break; }
      if (mapX < 0 || mapY < 0 || mapX >= Wm || mapY >= Hm) { hitCh = '#'; break; }
    }
    if (!hitCh && !V3.overland) hitCh = '#';
    let lineH;
    if (hitCh) {
      dist = side === 0 ? sdx - ddx : sdy - ddy;
      lineH = Math.min(H * 3, H / Math.max(0.02, dist));
    } else {
      dist = 24; lineH = H / dist;
    }
    const x0 = c * COLW;
    let y0 = H / 2 - lineH / 2;
    const fog = Math.max(0, Math.min(1, (seenDist - dist) / seenDist));
    V3.zbuf[x0] = dist; V3.zbuf[x0 + 1] = dist;
    if (!V3.seen || (hitCh && V3.seen[hitY] && V3.seen[hitY][hitX])) {
      if (hitCh && V3.overland) {
        /* outdoor structures: draw a billboard-ish block */
        V3.drawOutdoorBlock(ctx, x0, y0, COLW, lineH, hitCh, hitX, hitY, side, dist, light, dl);
      } else if (hitCh) {
        /* texture coords */
        let wallX = side === 0 ? V3.py + dist * rdy : V3.px + dist * rdx;
        wallX -= Math.floor(wallX);
        let texX = Math.floor(wallX * 64);
        if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) texX = 64 - texX - 1;
        const tex = wallFor(V3.style, side === 0 ? 'x' : 'y', isDoor(hitCh) ? hitCh : null, (hitX * 7 + hitY * 13 + V3.map.seed) | 0);
        ctx.drawImage(tex, texX, 0, 1, 64, x0, y0, COLW, lineH);
        if (fog < 0.95) {
          ctx.fillStyle = 'rgba(0,0,0,' + (1 - fog).toFixed(3) + ')';
          ctx.fillRect(x0, y0, COLW, lineH);
        }
      }
    } else if (hitCh && !V3.overland) {
      /* unseen wall: dark mass with faint edge */
      ctx.fillStyle = '#060505';
      ctx.fillRect(x0, y0, COLW, lineH);
    }
  }

  /* billboards */
  V3.drawBillboards(ctx, W, H, light, dl);
};

V3.drawOutdoorBlock = function (ctx, x0, y0, cw, lineH, ch, mx, my, side, dist, light, dl) {
  /* approximate outdoor features as shaded blocks in the wall pass */
  let color = '#3a3a3a';
  if (ch === 'H') color = '#6a5a44';
  if (ch === 'B') color = '#6a5a6a';
  if (ch === 'M') color = '#5a4a3a';
  if (ch === 'F') color = '#5a6a7a';
  if (ch === 'S') color = '#7a756c';
  if (ch === 'G') color = '#6a655c';
  if (ch === 'X') color = '#5e5a54';
  const f = 0.3 + 0.7 * Math.max(0, Math.min(1, (12 - dist) / 12)) * light;
  ctx.fillStyle = shade(color, f);
  ctx.fillRect(x0, y0, cw, lineH);
};

V3.drawBillboards = function (ctx, W, H, light, dl) {
  const m = V3.map;
  const ang = V3.dir * Math.PI / 2 - Math.PI / 2;
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const items = [];
  const seen = V3.seen;
  const push = function (wx, wy, draw, hgt, alpha) {
    const rx = wx - V3.px, ry = wy - V3.py;
    const depth = rx * dx + ry * dy;
    if (depth < 0.25) return;
    const sx = (rx * -dy + ry * dx) * (V3.W / 2); /* screen offset (approx fov) */
    if (sx < -100 || sx > W + 100) return;
    items.push({ depth: depth, sx: sx, draw: draw, hgt: hgt || 1, alpha: alpha != null ? alpha : 1 });
  };
  /* treasure */
  if (V3.treasure) {
    const t = V3.treasure;
    if (!seen || (seen[Math.floor(t.y)] && seen[Math.floor(t.y)][Math.floor(t.x)])) {
      push(t.x, t.y, function (x, y, h) { drawTreasure(ctx, x, y, h); }, 0.4);
    }
  }
  /* party members */
  for (const p of V3.party) {
    if (!seen || (seen[Math.floor(p.y)] && seen[Math.floor(p.y)][Math.floor(p.x)])) {
      const fig = window.Fig.figForChar(p);
      push(p.x, p.y, function (x, y, h) { window.Fig.drawFig(ctx, fig, x, y, h); }, 0.9);
    }
  }
  /* monsters */
  for (const mo of V3.monsters) {
    if (!seen || (seen[Math.floor(mo.y)] && seen[Math.floor(mo.y)][Math.floor(mo.x)])) {
      const fig = window.Fig.figForMonster(mo.mon);
      push(mo.x, mo.y, function (x, y, h) { window.Fig.drawFig(ctx, fig, x, y, h); }, mo.mon.size === 'H' ? 1.25 : 0.95);
    }
  }
  /* outdoor features */
  if (V3.overland) {
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const ch = m.grid[y][x];
      if (seen && !seen[y][x]) continue;
      if (ch === 'T') {
        const tex = treeTex(x * 31 + y * 7);
        push(x + 0.5, y + 0.5, function (sx, y0, h) {
          const w = h * 0.75;
          ctx.drawImage(tex, sx - w / 2, y0 - h * 0.8, w, h);
        }, 0.55);
      } else if (ch === 'H' || ch === 'B') {
        const kind = ch === 'H' ? 'house' : 'shop';
        const ev = m.ev && (m.ev['' + x + ',' + y] || m.ev[ch]);
        const tex = buildingTex(kind, x * 13 + y * 5);
        push(x + 0.5, y + 0.5, function (sx, y0, h) {
          const w = h * 1.0;
          ctx.drawImage(tex, sx - w / 2, y0 - h, w, h);
        }, 0.7);
      } else if (ch === 'S') {
        push(x + 0.5, y + 0.5, function (sx, y0, h) {
          ctx.drawImage(shrineTex(1), sx - h * 0.35, y0 - h * 0.5, h * 0.7, h);
        }, 0.35);
      } else if (ch === 'F') {
        push(x + 0.5, y + 0.5, function (sx, y0, h) {
          ctx.drawImage(fountainTex(1), sx - h * 0.5, y0 - h * 0.45, h, h * 0.87);
        }, 0.4);
      } else if (ch === 'X') {
        push(x + 0.5, y + 0.5, function (sx, y0, h) {
          ctx.drawImage(ruinTex(x + y), sx - h * 0.5, y0 - h * 0.45, h, h * 0.87);
        }, 0.45);
      }
    }
  }
  items.sort((a, b) => b.depth - a.depth);
  for (const it of items) {
    const screenX = W / 2 + it.sx;
    const lineH = Math.min(H * 2.4, H / Math.max(0.15, it.depth)) * it.hgt;
    const x0 = Math.floor(screenX - lineH / 2), x1 = Math.floor(screenX + lineH / 2);
    if (x1 < 0 || x0 >= W) continue;
    /* z-buffer clip */
    let blocked = true;
    for (let x = x0; x < x1; x += 4) {
      if (V3.zbuf[Math.max(0, Math.min(W - 1, x))] > it.depth) { blocked = false; break; }
    }
    if (blocked) continue;
    ctx.save();
    ctx.globalAlpha = it.alpha;
    ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, H); ctx.clip();
    it.draw(screenX, H / 2 + (H / Math.max(0.15, it.depth)) / 2 * 0.9, lineH);
    ctx.restore();
  }
};

function drawTreasure(ctx, x, y, h) {
  ctx.fillStyle = '#e8c040';
  ctx.beginPath(); ctx.ellipse(x, y - h * 0.12, h * 0.34, h * 0.14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f8e070';
  ctx.beginPath(); ctx.ellipse(x - h * 0.08, y - h * 0.2, h * 0.14, h * 0.07, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8ac0d0';
  ctx.beginPath(); ctx.arc(x + h * 0.12, y - h * 0.26, h * 0.05, 0, Math.PI * 2); ctx.fill();
}

/* ---------- minimap ---------- */
V3.minimap = function (ctx, w, h, showMarks) {
  const m = V3.map;
  if (!m) return;
  const s = Math.floor(Math.min(w / m.w, h / m.h));
  const ox = Math.floor((w - m.w * s) / 2), oy = Math.floor((h - m.h * s) / 2);
  ctx.fillStyle = '#0c0a08';
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const ch = m.grid[y][x];
    if (V3.seen && !V3.seen[y][x]) continue;
    let c = null;
    if (ch === '#') c = '#4a443c';
    else if (isDoor(ch)) c = '#8a6a40';
    else if (ch === '<' || ch === '>') c = '#9a9aa4';
    else if (ch === 'G') c = '#8a8a92';
    else if (V3.overland) {
      if (ch === 'T') c = '#3a5434';
      else if (ch === '~') c = '#3a5a7a';
      else if (ch === '^') c = '#8a7a5a';
      else if (ch === 'H') c = '#8a6a4a';
      else if (ch === 'B') c = '#7a5a7a';
      else if (ch === 'S') c = '#b8b0a0';
      else if (ch === 'F') c = '#5a8aaa';
      else if (ch === 'X') c = '#6a645c';
      else if (ch === '.' || ch === ',') c = '#4a5438';
      else if (ch >= 'A' && ch <= 'Z') c = '#d0c060';
    } else {
      if (ch >= 'a' && ch <= 'z') c = '#d0a040';
      else if (ch === 'C') c = '#d0a040';
      else if (ch === 'P') c = '#6a5a8a';
      else if (ch === 'Q') c = '#5a7a5a';
      else if (ch === 'X') c = '#7a4a4a';
      else c = '#2e2a24';
    }
    if (c) { ctx.fillStyle = c; ctx.fillRect(ox + x * s, oy + y * s, s, s); }
  }
  if (showMarks) {
    /* service colors */
    if (V3.services) {
      for (const key in V3.services) {
        const [sx, sy] = key.split(',').map(Number);
        if (V3.seen && (!V3.seen[sy] || !V3.seen[sy][sx])) continue;
        ctx.fillStyle = V3.services[key].color;
        ctx.fillRect(ox + sx * s - 1, oy + sy * s - 1, s + 2, s + 2);
      }
    }
  }
  /* player */
  const pxx = ox + (V3.px - 0.5) * s, pyy = oy + (V3.py - 0.5) * s;
  ctx.fillStyle = '#f0e0a0';
  ctx.beginPath();
  const a = V3.dir * Math.PI / 2 - Math.PI / 2;
  ctx.moveTo(pxx + Math.cos(a) * s, pyy + Math.sin(a) * s);
  ctx.lineTo(pxx + Math.cos(a + 2.5) * s * 0.7, pyy + Math.sin(a + 2.5) * s * 0.7);
  ctx.lineTo(pxx + Math.cos(a - 2.5) * s * 0.7, pyy + Math.sin(a - 2.5) * s * 0.7);
  ctx.closePath(); ctx.fill();
};

/* ---------- field of view (fog reveal + watch line-of-sight) ---------- */
V3.fov = function (cx, cy, radius) {
  const m = V3.map;
  const Wm = m.w, Hm = m.h;
  const out = [];
  for (let y = 0; y < Hm; y++) out.push(new Uint8Array(Wm));
  const rad = radius * radius;
  const cxp = cx + 0.5, cyp = cy + 0.5;
  for (let y = Math.max(0, cy - radius); y <= Math.min(Hm - 1, cy + radius); y++) {
    for (let x = Math.max(0, cx - radius); x <= Math.min(Wm - 1, cx + radius); x++) {
      const ddx = x - cx, ddy = y - cy;
      if (ddx * ddx + ddy * ddy > rad) continue;
      /* bresenham LOS */
      let bx = cx, by = cy, clear = true;
      const n = Math.max(Math.abs(x - cx), Math.abs(y - cy));
      if (n > 0) {
        for (let i = 1; i <= n; i++) {
          const tx = Math.round(cx + (x - cx) * i / n);
          const ty = Math.round(cy + (y - cy) * i / n);
          if (tx !== x || ty !== y) {
            const ch = m.grid[ty] ? m.grid[ty][tx] : '#';
            if (opaque(ch) && !(ch === 'G')) { clear = false; break; }
          }
          bx = tx; by = ty;
        }
      }
      if (clear) out[y][x] = 1;
    }
  }
  return out;
};

V3.or = function (a, b) {
  for (let y = 0; y < a.length; y++) for (let x = 0; x < a[y].length; x++) if (b[y][x]) a[y][x] = 1;
};
})();
