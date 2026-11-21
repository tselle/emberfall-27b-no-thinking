/* Emberfall — overland.js
 * Region logic: movement cost by terrain, scheduled wild encounters,
 * site visits (lair / refuge / healer / hamlet), camping with ambush
 * risk, and the gate back home. */
'use strict';
(function () {
const Overland = window.Overland = {};
const R = window.R;

Overland.enter = function (mapId, pos, dir) {
  const m = D.MAPS[mapId];
  V3.prepare(mapId);
  G.mapId = mapId;
  G.pos = { x: pos.x, y: pos.y };
  G.dir = dir != null ? dir : (m.start ? m.start.dir : 0);
  G.mode = 'overland';
  G.px = G.pos.x + 0.5;
  G.py = G.pos.y + 0.5;
  G.wildStep = 0;
  G.wildIdx = 0;
  G.still = 0;
  if (!G.seen) G.seen = {};
  if (!G.seen[mapId]) G.seen[mapId] = V3.fov(G.pos.x, G.pos.y, 9);
  UI.log('The gate opens onto ' + m.name + '. ' + (m.overland ? 'The road is long, and the road has plans.' : ''));
  Game.refreshHud();
};

/* terrain cost in minutes for one step onto ch */
Overland.stepCost = function (ch) {
  switch (ch) {
    case '.': case ',': return R.i(R.rand, 2, 4);
    case '=': return R.i(R.rand, 2, 4);      /* bridge */
    case '~': return R.i(R.rand, 5, 9);      /* fording water */
    case '^': return R.i(R.rand, 4, 7);      /* hillside */
    default: return 3;
  }
};
Overland.blocked = function (ch) {
  return ch === 'T' || ch === '#';
};

/* advance one step; returns a scheduled encounter {mons, text} or null */
Overland.advance = function () {
  const m = D.MAPS[G.mapId];
  G.wildStep++;
  if (!m.wildEnc) return null;
  while (G.wildIdx < m.wildEnc.length && G.wildStep >= m.wildEnc[G.wildIdx].at) {
    const enc = m.wildEnc[G.wildIdx];
    G.wildIdx++;
    return enc;
  }
  return null;
};

/* site event (letters A..H): {enc|chest|text|safe|service} */
Overland.visitSite = function (siteChar, ev) {
  const m = D.MAPS[G.mapId];
  const st = Game.stateFor(G.mapId);
  if (ev.safe) {
    st.sites = st.sites || [];
    if (!st.sites.includes(siteChar)) {
      st.sites.push(siteChar);
      UI.log(ev.text, 'good');
      for (const c of G.party) if (!c.dead) c.hp = Math.min(c.maxhp, c.hp + Math.ceil(c.maxhp / 3));
      Journal.add(G.day, ev.text.split('.')[0] + ' — rested.');
    } else {
      UI.log(ev.text, 'dim');
      for (const c of G.party) if (!c.dead) c.hp = Math.min(c.maxhp, c.hp + Math.ceil(c.maxhp / 6));
    }
    return;
  }
  if (ev.service === 'heal') {
    UI.log(ev.text, 'good');
    for (const c of G.party) if (!c.dead) c.hp = c.maxhp;
    Journal.add(G.day, 'The healer closed the wounds. All HP restored.');
    return;
  }
  if (ev.chest) {
    st.opened = st.opened || [];
    if (st.opened.includes(siteChar)) {
      UI.log(ev.text + ' It has been emptied.', 'dim');
      return;
    }
    st.opened.push(siteChar);
    Game.giveGold(ev.chest.gold);
    Game.giveItems(ev.chest.items || []);
    UI.log(ev.text, 'good');
    return;
  }
  if (ev.enc) {
    st.encs = st.encs || [];
    if (st.encs.includes(siteChar)) {
      UI.log(ev.text + ' The keeping is done; only dust remains.', 'dim');
      return;
    }
    UI.log(ev.text, 'warn');
    const mons = ev.enc.mons.map(([id, n]) => {
      const mon = D.MONSTERS[id];
      const c = typeof n === 'string' ? R.d(n) : n;
      return { mon: mon, count: c };
    });
    Combat.start({
      mapId: G.mapId, overland: true, evKey: siteChar,
      mons: mons,
      text: ev.enc.text,
      onWin: function () {
        st.encs.push(siteChar);
        if (ev.enc.gold) Game.giveGold(ev.enc.gold);
      }
    });
    return;
  }
  if (ev.text) UI.log(ev.text);
};

/* camp: rest until dawn; the wild may object */
Overland.camp = function () {
  const m = D.MAPS[G.mapId];
  if (!m || !m.overland) return;
  const risk = Campaign.isNight() ? 0.55 : 0.25;
  UI.log('The party makes camp. The fire is low and the watch is honest.');
  if (R.chance(risk * 100)) {
    const pool = m.pool || ['giant_wolf', 'boar'];
    const n = R.i(R.rand, 1, 2);
    const mons = [];
    for (let i = 0; i < n; i++) mons.push({ mon: D.MONSTERS[pool[R.i(R.rand, 0, pool.length - 1)]], count: 1 });
    UI.log('Something in the dark decides the fire was an invitation.', 'warn');
    Combat.start({
      mapId: G.mapId, overland: true,
      mons: mons,
      onWin: function () { Game.finishCamp(); }
    });
  } else {
    Game.finishCamp();
  }
};
/* gate home: return to the base */
Overland.gateHome = function () {
  const m = D.MAPS[G.mapId];
  const exit = m.exit;
  const key = Object.keys(exit)[0];
  const ex = exit[key];
  UI.log('The gate home. The road lets you go, this once.');
  Game.enterMap(ex.to, ex.at, ex.dir);
};
})();
