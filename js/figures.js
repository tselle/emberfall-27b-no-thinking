/* Emberfall — figures.js
 * Shared procedural figure drawing: drawFig / figForChar / portrait.
 * Used on sheets, in encounters, in the raycast view, on the overland map
 * and in combat. Same likeness everywhere. */
'use strict';
(function () {
const F = window.Fig = {};
const R = window.R;

/* palette helpers */
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r * f)));
  g = Math.max(0, Math.min(255, Math.round(g * f)));
  b = Math.max(0, Math.min(255, Math.round(b * f)));
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}
F.shade = shade;

const RACE_COLORS = {
  H: { skin: '#c8987a', hair: '#5a3a22' },
  E: { skin: '#a8c08a', hair: '#22283a' },
  D: { skin: '#8a6a52', hair: '#2a2a34' },
  G: { skin: '#b8a088', hair: '#3a5a3a' },
  HE: { skin: '#c0a080', hair: '#7a5a3a' },
  HA: { skin: '#d0a888', hair: '#a87a4a' }
};
const CLS_COLORS = {
  F: '#8a8f98', P: '#c0a040', R: '#4a7a4a', M: '#4a5a9a', C: '#b8b8c0', T: '#6a5a7a'
};

/* descriptor: { kind, size, skin, hair, cls, armor, shield, weapon, cloak, wings, claws, horn } */
F.figForChar = function (c) {
  const rc = RACE_COLORS[c.race] || RACE_COLORS.H;
  const w = R.worn(c);
  const a = w.a, s = w.s, wm = w.w;
  return {
    kind: 'humanoid', race: c.race, size: 'M',
    skin: rc.skin, hair: rc.hair, cls: c.cls,
    armor: a ? (a.fam || 'chain') : null,
    shield: s ? (s.fam || 'kite') : null,
    weapon: wm ? (wm.fam || 'longsword') : (c.cls === 'M' ? 'staff' : null),
    weaponMagic: !!(wm && wm.ench),
    cloak: c.cls === 'M' || c.cls === 'C'
  };
};
F.figForMonster = function (m) {
  if (!m) return { kind: 'humanoid' };
  const kind = m.fig || 'humanoid';
  return {
    kind: kind, size: m.size || 'M', race: null,
    skin: kindSkin(kind, m), hair: null,
    cls: null, armor: null, shield: null,
    weapon: kind === 'humanoid' || kind === 'gnoll' || kind === 'bugbear' ? 'longsword' : null,
    undead: (m.tags || []).includes('undead') || (m.tags || []).includes('und'),
    leader: m.leader
  };
};
function kindSkin(kind, m) {
  switch (kind) {
    case 'humanoid': return '#9a8a7a';
    case 'rat': return '#7a6a5a';
    case 'spider': return '#3a3a44';
    case 'centipede': return '#5a6a3a';
    case 'wolf': return '#6a6258';
    case 'boar': return '#5a4a3a';
    case 'stag': return '#8a7a5a';
    case 'bear': return '#5a4430';
    case 'beast': return '#7a6a4a';
    case 'serpent': return '#4a6a4a';
    case 'lizard': return '#5a7a4a';
    case 'bird': return '#4a5a6a';
    case 'insect': return '#5a5a3a';
    case 'blob': return '#5a7a6a';
    case 'orb': return '#8ac0d0';
    case 'skeleton': return '#d0ccc0';
    case 'zombie': return '#7a8a6a';
    case 'ghoul': return '#8a9a8a';
    case 'shade': return '#6a7a9a';
    case 'wraith': return '#7a8ab0';
    case 'revenant': return '#8a8a9a';
    case 'lich': return '#c0c0b0';
    case 'vampire': return '#c8a8a0';
    case 'gnoll': return '#8a7a6a';
    case 'bugbear': return '#8a7a5a';
    case 'ogre': return '#9a8a6a';
    case 'troll': return '#7a9a7a';
    case 'giant': return '#9a8a7a';
    case 'gargoyle': return '#8a8a92';
    case 'golem': return m && m.lore ? '#8a8a92' : '#888890';
    case 'imp': return '#8a5a4a';
    case 'marilith': return '#8a5a5a';
    case 'dragon': return m && m.immune && m.immune.includes('cold') ? '#a8b8c8' : '#8a4a3a';
    case 'raven_witch': return '#4a4a5a';
    case 'old_king': return '#9a9ab0';
    case 'vharra': return '#5a4a6a';
    default: return '#8a7a6a';
  }
}

/* draw a figure centered at (x, y=feet) with height h (px) */
F.drawFig = function (ctx, fig, x, y, h, opts) {
  opts = opts || {};
  const u = h / 32; /* design height 32 */
  const kind = fig.kind || 'humanoid';
  const skin = fig.skin || '#c8987a';
  const hair = fig.hair || '#5a3a22';
  const armorC = fig.armor ? armorColor(fig.armor) : null;
  const cloakC = fig.cloak ? CLS_COLORS[fig.cls] || '#4a5a9a' : null;
  const alpha = opts.alpha != null ? opts.alpha : (fig.undead ? 0.85 : 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  switch (kind) {
    case 'humanoid': case 'gnoll': case 'bugbear': case 'ogre': case 'giant': case 'troll': case 'raven_witch': case 'old_king': case 'vharra': F.drawHumanoid(ctx, u, fig, skin, hair, armorC, cloakC, opts); break;
    case 'rat': F.drawRat(ctx, u, skin, opts); break;
    case 'spider': F.drawSpider(ctx, u, skin, opts); break;
    case 'centipede': F.drawCentipede(ctx, u, skin, opts); break;
    case 'wolf': F.drawWolf(ctx, u, skin, opts); break;
    case 'boar': case 'bear': case 'beast': case 'stag': F.drawBeast(ctx, u, skin, opts, kind); break;
    case 'serpent': case 'lizard': F.drawSerpent(ctx, u, skin, opts); break;
    case 'bird': F.drawBird(ctx, u, skin, opts); break;
    case 'insect': F.drawInsect(ctx, u, skin, opts); break;
    case 'blob': F.drawBlob(ctx, u, skin, opts); break;
    case 'orb': F.drawOrb(ctx, u, skin, opts); break;
    case 'skeleton': F.drawSkeleton(ctx, u, opts); break;
    case 'zombie': F.drawHumanoid(ctx, u, { cls: null, armor: 'padded', weapon: null }, skin, '#3a4a3a', null, null, opts); break;
    case 'ghoul': case 'shade': case 'wraith': case 'revenant': F.drawWraith(ctx, u, skin, opts, kind); break;
    case 'lich': case 'vampire': F.drawHumanoid(ctx, u, fig, skin, hair, null, cloakC || '#5a4a6a', opts); break;
    case 'gargoyle': case 'golem': F.drawGolem(ctx, u, skin, opts); break;
    case 'imp': case 'marilith': F.drawImp(ctx, u, skin, opts); break;
    case 'dragon': F.drawDragon(ctx, u, skin, opts); break;
    default: F.drawHumanoid(ctx, u, fig, skin, hair, armorC, cloakC, opts);
  }
  if (fig.leader && !opts.noLeader) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#e8c840';
    ctx.beginPath(); ctx.moveTo(0, -34 * u); ctx.lineTo(3 * u, -29 * u); ctx.lineTo(0, -31 * u); ctx.lineTo(-3 * u, -29 * u); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
};
function armorColor(fam) {
  if (fam === 'plate' || fam === 'splint' || fam === 'scale' || fam === 'chain') return '#9aa0aa';
  if (fam === 'studded' || fam === 'leather') return '#7a5a3a';
  if (fam === 'padded') return '#8a7a5a';
  return '#8a8a92';
}

F.drawHumanoid = function (ctx, u, fig, skin, hair, armorC, cloakC, opts) {
  const big = fig.kind === 'giant' || fig.kind === 'ogre' || fig.kind === 'troll' || fig.size === 'H' || fig.size === 'L';
  const w = big ? 1.25 : 1;
  ctx.lineWidth = Math.max(1, 1.2 * u);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  /* cloak */
  if (cloakC) {
    ctx.fillStyle = cloakC;
    ctx.beginPath(); ctx.moveTo(-7 * u * w, -10 * u); ctx.lineTo(7 * u * w, -10 * u); ctx.lineTo(9 * u * w, -1 * u); ctx.lineTo(-9 * u * w, -1 * u); ctx.closePath(); ctx.fill();
  }
  /* legs */
  ctx.fillStyle = armorC || '#5a5a66';
  ctx.fillRect(-4 * u * w, -12 * u, 3 * u, 12 * u);
  ctx.fillRect(1 * u * w, -12 * u, 3 * u, 12 * u);
  /* torso */
  ctx.fillStyle = armorC || '#7a6a5a';
  ctx.beginPath();
  ctx.moveTo(-6 * u * w, -12 * u); ctx.lineTo(6 * u * w, -12 * u);
  ctx.lineTo(7 * u * w, -22 * u); ctx.lineTo(-7 * u * w, -22 * u); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (armorC) {
    ctx.strokeStyle = shade(armorC, 0.7);
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-5 * u * w, (-14 - i * 3) * u); ctx.lineTo(5 * u * w, (-14 - i * 3) * u); ctx.stroke(); }
  }
  /* arms */
  ctx.fillStyle = skin;
  ctx.fillRect(-8 * u * w, -21 * u, 2.4 * u, 9 * u);
  ctx.fillRect(5.6 * u * w, -21 * u, 2.4 * u, 9 * u);
  /* shield */
  if (fig.shield) {
    ctx.fillStyle = fig.shield === 'tower' || fig.shield === 'towershield' ? '#8a7a5a' : '#9a9aa4';
    const sh = fig.shield === 'buckler' ? 4 : 7;
    ctx.beginPath(); ctx.ellipse(-9 * u * w, -15 * u, sh * u, (sh + 2) * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.stroke();
  }
  /* weapon */
  if (fig.weapon) {
    ctx.save();
    ctx.translate(9 * u * w, -14 * u);
    ctx.rotate(-0.5);
    const twoH = ['twoh_sword', 'twoh_axe', 'twoh_hammer', 'twoh_mace', 'halberd', 'glaive', 'partisan', 'bardiche'].includes(fig.weapon);
    const len = (twoH ? 22 : fig.weapon === 'staff' ? 26 : 16) * u;
    ctx.fillStyle = fig.weaponMagic ? '#d0e0ff' : '#c8c8d0';
    if (fig.weapon === 'staff') {
      ctx.fillStyle = '#7a5a3a';
      ctx.fillRect(-u, -len / 2, 2 * u, len);
      ctx.fillStyle = '#e8d060';
      ctx.beginPath(); ctx.arc(0, -len / 2, 2.4 * u, 0, Math.PI * 2); ctx.fill();
    } else if (['dagger', 'sickle'].includes(fig.weapon)) {
      ctx.fillRect(-u, -8 * u, 2 * u, 8 * u);
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-1.6 * u, -2 * u, 3.2 * u, 2 * u);
    } else {
      ctx.fillRect(-u, -len, 2 * u, len * 0.7);
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-2 * u, -len * 0.3, 4 * u, 2 * u);
    }
    ctx.restore();
  }
  /* head */
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, -25.5 * u, 4.4 * u, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  /* hair / helm */
  if (fig.armor === 'plate' || fig.armor === 'splint') {
    ctx.fillStyle = armorC;
    ctx.beginPath(); ctx.arc(0, -26 * u, 4.8 * u, Math.PI, 0); ctx.fill();
  } else if (hair) {
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.arc(0, -26.5 * u, 4.4 * u, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  }
  if (fig.kind === 'gnoll') {
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.moveTo(-4 * u, -28 * u); ctx.lineTo(-7 * u, -31 * u); ctx.lineTo(-3 * u, -29.5 * u); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4 * u, -28 * u); ctx.lineTo(7 * u, -31 * u); ctx.lineTo(3 * u, -29.5 * u); ctx.closePath(); ctx.fill();
  }
  if (fig.kind === 'giant' || fig.kind === 'troll') {
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.moveTo(-5 * u, -29 * u); ctx.lineTo(-7 * u, -33 * u); ctx.lineTo(-3 * u, -30 * u); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(5 * u, -29 * u); ctx.lineTo(7 * u, -33 * u); ctx.lineTo(3 * u, -30 * u); ctx.closePath(); ctx.fill();
  }
  /* eyes */
  ctx.fillStyle = 'rgba(10,10,15,0.9)';
  ctx.fillRect(-2 * u, -26 * u, 1.4 * u, 1 * u);
  ctx.fillRect(0.8 * u, -26 * u, 1.4 * u, 1 * u);
};

F.drawRat = function (ctx, u, skin, opts) {
  ctx.fillStyle = skin; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = u;
  ctx.beginPath(); ctx.ellipse(0, -6 * u, 9 * u, 5 * u, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(8 * u, -9 * u, 4 * u, 3 * u, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10 * u, -12 * u); ctx.lineTo(13 * u, -15 * u); ctx.lineTo(12 * u, -11 * u); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = shade(skin, 0.6); ctx.lineWidth = 1.4 * u;
  ctx.beginPath(); ctx.moveTo(-9 * u, -6 * u); ctx.quadraticCurveTo(-15 * u, -8 * u, -14 * u, -12 * u); ctx.stroke();
  ctx.fillStyle = '#ff5050'; ctx.fillRect(10.6 * u, -9.4 * u, 1.2 * u, 1 * u);
};

F.drawSpider = function (ctx, u, skin, opts) {
  ctx.fillStyle = skin; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = u;
  ctx.beginPath(); ctx.ellipse(0, -10 * u, 8 * u, 6 * u, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(8 * u, -13 * u, 3.4 * u, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = skin; ctx.lineWidth = 1.4 * u;
  for (let i = 0; i < 4; i++) {
    const a = -0.9 + i * 0.5;
    ctx.beginPath(); ctx.moveTo(0, -10 * u);
    ctx.quadraticCurveTo(10 * u, (-16 - i * 3) * u, (14 + i * 2) * u, (-2 + i * 1.5) * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -10 * u);
    ctx.quadraticCurveTo(-8 * u, (-16 - i * 3) * u, (-14 - i * 2) * u, (-2 + i * 1.5) * u); ctx.stroke();
  }
  ctx.fillStyle = '#ff5050'; ctx.fillRect(9.4 * u, -13.6 * u, 1 * u, 0.9 * u); ctx.fillRect(7.6 * u, -13.6 * u, 1 * u, 0.9 * u);
};

F.drawCentipede = function (ctx, u, skin, opts) {
  ctx.fillStyle = skin; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = u;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath(); ctx.ellipse((-10 + i * 4) * u, -6 * u, 2.6 * u, 2 * u, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.strokeStyle = shade(skin, 0.7); ctx.lineWidth = 0.8 * u;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath(); ctx.moveTo((-10 + i * 4) * u, -4.4 * u); ctx.lineTo((-11 + i * 4) * u, -1 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo((-10 + i * 4) * u, -4.4 * u); ctx.lineTo((-9 + i * 4) * u, -1 * u); ctx.stroke();
  }
  ctx.fillStyle = '#ff5050'; ctx.fillRect(8 * u, -6.8 * u, 1.2 * u, 1 * u);
};

F.drawWolf = function (ctx, u, skin, opts) {
  ctx.fillStyle = skin; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = u;
  ctx.beginPath(); ctx.ellipse(0, -8 * u, 10 * u, 4.4 * u, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(10 * u, -11 * u, 4.4 * u, 3.2 * u, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(11 * u, -14 * u); ctx.lineTo(13.4 * u, -17 * u); ctx.lineTo(14.4 * u, -13 * u); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8 * u, -14 * u); ctx.lineTo(9.4 * u, -17.4 * u); ctx.lineTo(10.8 * u, -13.6 * u); ctx.closePath(); ctx.fill();
  for (const lx of [-6, -2, 2, 6]) { ctx.fillRect(lx * u, -5 * u, 1.6 * u, 5 * u); }
  ctx.strokeStyle = shade(skin, 0.55); ctx.lineWidth = 1.6 * u;
  ctx.beginPath(); ctx.moveTo(-10 * u, -9 * u); ctx.quadraticCurveTo(-15 * u, -12 * u, -14 * u, -6 * u); ctx.stroke();
  ctx.fillStyle = '#ff5050'; ctx.fillRect(12 * u, -12 * u, 1.2 * u, 1 * u);
};

F.drawBeast = function (ctx, u, skin, opts, kind) {
  ctx.fillStyle = skin; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = u;
  const h = kind === 'bear' ? 7 : 6;
  ctx.beginPath(); ctx.ellipse(0, -7 * u, 10 * u, h * u, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(10 * u, -10 * u, 4.6 * u, 3.6 * u, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (kind === 'boar') {
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath(); ctx.moveTo(13 * u, -10 * u); ctx.lineTo(16.4 * u, -8.6 * u); ctx.lineTo(13.4 * u, -7.4 * u); ctx.closePath(); ctx.fill();
  }
  if (kind === 'stag') {
    ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 1 * u;
    ctx.beginPath(); ctx.moveTo(9.6 * u, -13.4 * u); ctx.lineTo(8.6 * u, -19 * u); ctx.lineTo(7 * u, -21 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(11.4 * u, -13.4 * u); ctx.lineTo(12.4 * u, -19 * u); ctx.lineTo(14 * u, -21 * u); ctx.stroke();
  }
  if (kind === 'bear') {
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(7.4 * u, -13.4 * u, 1.6 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12.6 * u, -13.4 * u, 1.6 * u, 0, Math.PI * 2); ctx.fill();
  }
  for (const lx of [-7, -2.4, 2.4, 7]) { ctx.fillRect(lx * u, -4 * u, 1.8 * u, 4 * u); }
  ctx.fillStyle = '#ff5050'; ctx.fillRect(13.6 * u, -10.6 * u, 1.2 * u, 1 * u);
};

F.drawSerpent = function (ctx, u, skin, opts) {
  ctx.strokeStyle = skin; ctx.lineWidth = 4 * u; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-12 * u, -4 * u);
  ctx.bezierCurveTo(-4 * u, -1 * u, 0 * u, -12 * u, 8 * u, -9 * u);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = skin; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = u;
  ctx.beginPath(); ctx.ellipse(9 * u, -9 * u, 3.4 * u, 2.4 * u, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff5050'; ctx.fillRect(10.4 * u, -9.8 * u, 1 * u, 0.9 * u);
  ctx.strokeStyle = shade(skin, 0.7); ctx.lineWidth = 0.8 * u;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc((-10 + i * 4) * u, -4.4 * u, 2.2 * u, 0.3, Math.PI - 0.3); ctx.stroke(); }
};

F.drawBird = function (ctx, u, skin, opts) {
  ctx.fillStyle = skin; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = u;
  ctx.beginPath(); ctx.ellipse(0, -8 * u, 5 * u, 7 * u, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(2 * u, -16 * u, 3 * u, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8a830';
  ctx.beginPath(); ctx.moveTo(4.6 * u, -16 * u); ctx.lineTo(8 * u, -15.4 * u); ctx.lineTo(4.6 * u, -14.6 * u); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade(skin, 0.7);
  ctx.beginPath(); ctx.ellipse(-4 * u, -9 * u, 4 * u, 6 * u, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff3030'; ctx.fillRect(2.6 * u, -17 * u, 1.2 * u, 1 * u);
  ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 1 * u;
  ctx.beginPath(); ctx.moveTo(-1 * u, -2 * u); ctx.lineTo(-1 * u, 0); ctx.moveTo(1.4 * u, -2 * u); ctx.lineTo(1.4 * u, 0); ctx.stroke();
};

F.drawInsect = function (ctx, u, skin, opts) {
  ctx.fillStyle = skin; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = u;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.ellipse((-4 + i * 4) * u, -6 * u, 2.4 * u, (2.8 - i * 0.3) * u, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(6 * u, -6 * u, 2 * u, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = shade(skin, 0.6); ctx.lineWidth = 0.8 * u;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo((-4 + i * 4) * u, -4.4 * u); ctx.lineTo((-6 + i * 4) * u, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo((-4 + i * 4) * u, -4.4 * u); ctx.lineTo((-2 + i * 4) * u, 0); ctx.stroke();
  }
};

F.drawBlob = function (ctx, u, skin, opts) {
  ctx.fillStyle = skin; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = u;
  ctx.beginPath();
  ctx.moveTo(-11 * u, 0);
  ctx.quadraticCurveTo(-13 * u, -14 * u, 0, -16 * u);
  ctx.quadraticCurveTo(13 * u, -14 * u, 11 * u, 0);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = shade(skin, 1.25);
  ctx.beginPath(); ctx.ellipse(-3 * u, -8 * u, 4 * u, 3 * u, 0, 0, Math.PI * 2); ctx.fill();
  if (opts.eyes !== false) {
    ctx.fillStyle = '#ff5050';
    ctx.beginPath(); ctx.arc(-3 * u, -9 * u, 1.2 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3 * u, -9 * u, 1.2 * u, 0, Math.PI * 2); ctx.fill();
  }
};

F.drawOrb = function (ctx, u, skin, opts) {
  const g = ctx.createRadialGradient(0, -10 * u, 1 * u, 0, -10 * u, 8 * u);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.4, skin);
  g.addColorStop(1, 'rgba(120,140,200,0.1)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, -10 * u, 8 * u, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(-2.4 * u, -11 * u, 1.4 * u, 1.2 * u);
  ctx.fillRect(1 * u, -11 * u, 1.4 * u, 1.2 * u);
};

F.drawSkeleton = function (ctx, u, opts) {
  ctx.strokeStyle = '#d0ccc0'; ctx.fillStyle = '#d0ccc0';
  ctx.lineWidth = 1.6 * u;
  ctx.beginPath(); ctx.moveTo(0, -20 * u); ctx.lineTo(0, -8 * u); ctx.stroke();
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-3 * u, (-17 - i * 2.6) * u); ctx.lineTo(3 * u, (-17 - i * 2.6) * u); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-5 * u, -18 * u); ctx.lineTo(5 * u, -16 * u); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -24 * u, 4 * u, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#101018';
  ctx.fillRect(-2 * u, -25 * u, 1.6 * u, 1.6 * u);
  ctx.fillRect(0.6 * u, -25 * u, 1.6 * u, 1.6 * u);
  ctx.strokeStyle = '#d0ccc0'; ctx.lineWidth = 1.4 * u;
  ctx.beginPath(); ctx.moveTo(0, -8 * u); ctx.lineTo(-3 * u, 0); ctx.moveTo(0, -8 * u); ctx.lineTo(3 * u, 0); ctx.stroke();
};

F.drawWraith = function (ctx, u, skin, opts, kind) {
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(-8 * u, 0);
  ctx.quadraticCurveTo(-10 * u, -16 * u, 0, -19 * u);
  ctx.quadraticCurveTo(10 * u, -16 * u, 8 * u, 0);
  ctx.lineTo(5 * u, -3 * u); ctx.lineTo(3 * u, 0); ctx.lineTo(0, -3 * u); ctx.lineTo(-3 * u, 0); ctx.lineTo(-5 * u, -3 * u);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = kind === 'revenant' ? '#ff8030' : 'rgba(200,220,255,0.9)';
  ctx.fillRect(-2.6 * u, -15 * u, 1.8 * u, 1.4 * u);
  ctx.fillRect(1 * u, -15 * u, 1.8 * u, 1.4 * u);
  if (kind === 'revenant') {
    ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 1.4 * u;
    ctx.beginPath(); ctx.moveTo(8 * u, -16 * u); ctx.lineTo(13 * u, -6 * u); ctx.stroke();
  }
};

F.drawGolem = function (ctx, u, skin, opts) {
  ctx.fillStyle = skin; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = u;
  ctx.fillRect(-7 * u, -12 * u, 14 * u, 12 * u); ctx.strokeRect(-7 * u, -12 * u, 14 * u, 12 * u);
  ctx.fillRect(-9 * u, -24 * u, 18 * u, 10 * u); ctx.strokeRect(-9 * u, -24 * u, 18 * u, 10 * u);
  ctx.fillRect(-11 * u, -23 * u, 3 * u, 10 * u);
  ctx.fillRect(8 * u, -23 * u, 3 * u, 10 * u);
  ctx.fillRect(-4 * u, -30 * u, 8 * u, 5 * u); ctx.strokeRect(-4 * u, -30 * u, 8 * u, 5 * u);
  ctx.strokeStyle = shade(skin, 0.6); ctx.lineWidth = 0.8 * u;
  ctx.beginPath(); ctx.moveTo(-6 * u, -20 * u); ctx.lineTo(-2 * u, -18 * u); ctx.lineTo(-6 * u, -14 * u); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6 * u, -22 * u); ctx.lineTo(3 * u, -19 * u); ctx.stroke();
  ctx.fillStyle = '#ff8030';
  ctx.fillRect(-2.6 * u, -28 * u, 1.8 * u, 1.6 * u);
  ctx.fillRect(1 * u, -28 * u, 1.8 * u, 1.6 * u);
};

F.drawImp = function (ctx, u, skin, opts) {
  ctx.fillStyle = skin; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = u;
  ctx.beginPath(); ctx.ellipse(0, -9 * u, 6 * u, 8 * u, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -19 * u, 4 * u, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-3.4 * u, -21.6 * u); ctx.lineTo(-6 * u, -26 * u); ctx.lineTo(-1.6 * u, -22.6 * u); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(3.4 * u, -21.6 * u); ctx.lineTo(6 * u, -26 * u); ctx.lineTo(1.6 * u, -22.6 * u); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = skin; ctx.lineWidth = 1.2 * u;
  ctx.beginPath(); ctx.moveTo(-6 * u, -8 * u); ctx.quadraticCurveTo(-10 * u, -4 * u, -7 * u, -2 * u); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6 * u, -8 * u); ctx.quadraticCurveTo(10 * u, -4 * u, 7 * u, -2 * u); ctx.stroke();
  ctx.fillStyle = '#ff5050';
  ctx.fillRect(-2 * u, -19.6 * u, 1.4 * u, 1.2 * u);
  ctx.fillRect(0.8 * u, -19.6 * u, 1.4 * u, 1.2 * u);
};

F.drawDragon = function (ctx, u, skin, opts) {
  const big = (opts.size || 'L') === 'H';
  const k = big ? 1.3 : 1;
  ctx.fillStyle = skin; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = u;
  ctx.beginPath(); ctx.ellipse(0, -10 * u, 11 * u * k, 6 * u, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(10 * u * k, -15 * u, 5 * u * k, 3.6 * u, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = shade(skin, 0.8);
  ctx.beginPath();
  ctx.moveTo(-6 * u * k, -12 * u); ctx.lineTo(-16 * u * k, -24 * u); ctx.lineTo(-2 * u * k, -14 * u);
  ctx.lineTo(-12 * u * k, -30 * u); ctx.lineTo(-1 * u * k, -13 * u);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = shade(skin, 0.6); ctx.lineWidth = 1.6 * u;
  ctx.beginPath(); ctx.moveTo(-11 * u * k, -10 * u); ctx.quadraticCurveTo(-18 * u * k, -12 * u, -16 * u * k, -4 * u); ctx.stroke();
  for (const lx of [-6, -1, 4, 8]) { ctx.fillStyle = skin; ctx.fillRect(lx * u * k, -5 * u, 2 * u, 5 * u); }
  ctx.fillStyle = '#ff5050';
  ctx.fillRect(12 * u * k, -16.4 * u, 1.6 * u, 1.3 * u);
  ctx.fillStyle = '#e8c040';
  ctx.beginPath(); ctx.moveTo(13.6 * u * k, -13.4 * u); ctx.lineTo(15.4 * u * k, -12.6 * u); ctx.lineTo(13.4 * u * k, -12.2 * u); ctx.closePath(); ctx.fill();
};

/* portrait: draws a figure on a square canvas (sheet, cards) */
F.portrait = function (fig, px, bg) {
  const cv = document.createElement('canvas');
  cv.width = px; cv.height = px;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = bg || '#181410';
  ctx.fillRect(0, 0, px, px);
  const g = ctx.createRadialGradient(px / 2, px * 0.42, 2, px / 2, px * 0.5, px * 0.7);
  g.addColorStop(0, 'rgba(255,220,140,0.14)');
  g.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, px, px);
  F.drawFig(ctx, fig, px / 2, px * 0.94, px * 0.78, { noLeader: false });
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.strokeRect(0.5, 0.5, px - 1, px - 1);
  return cv;
};

/* pre-render a billboard texture for the raycaster */
F.figTex = function (fig, h) {
  h = h || 64;
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(h * 0.9); cv.height = h;
  const ctx = cv.getContext('2d');
  F.drawFig(ctx, fig, cv.width / 2, cv.height - 1, h * 0.96);
  return cv;
};
})();
