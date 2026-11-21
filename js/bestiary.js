/* Emberfall — bestiary.js
 * Monsters the party has seen. Stats unlock after the first fight;
 * kills are tallied. Known/total counter in the corner. */
'use strict';
(function () {
const Bestiary = window.Bestiary = {};

/* total = every monster that can appear (saga + wider bestiary, no named generated leaders) */
Bestiary.total = function () {
  let n = 0;
  for (const id in D.MONSTERS) {
    const m = D.MONSTERS[id];
    if (m.leader) continue;
    n++;
  }
  return n;
};

Bestiary.sight = function (monId) {
  if (!window.G) return;
  G.bestiary = G.bestiary || {};
  if (!G.bestiary[monId]) {
    G.bestiary[monId] = { seen: 0, fought: 0, killed: 0 };
    const mon = D.MONSTERS[monId];
    if (mon && mon.name) window.Journal && Journal.add(G.day, 'Spotted: ' + mon.name + '.');
  }
  G.bestiary[monId].seen++;
};
Bestiary.fight = function (monId) {
  if (!window.G) return;
  G.bestiary = G.bestiary || {};
  G.bestiary[monId] = G.bestiary[monId] || { seen: 0, fought: 0, killed: 0 };
  G.bestiary[monId].fought++;
};
Bestiary.kill = function (monId) {
  if (!window.G) return;
  G.bestiary = G.bestiary || {};
  G.bestiary[monId] = G.bestiary[monId] || { seen: 0, fought: 0, killed: 0 };
  G.bestiary[monId].killed++;
};

Bestiary.known = function () {
  return window.G ? Object.keys(G.bestiary || {}).length : 0;
};

function monStats(m) {
  const hd = m.hd;
  const atk = (m.atk || []).map((a) => a).join(', ');
  const parts = [];
  parts.push('HD ' + hd);
  parts.push('AC ' + m.ac);
  if (atk) parts.push('Atk ' + atk);
  if (m.ml != null) parts.push('ML ' + m.ml);
  parts.push('Move ' + (m.mv || 12));
  parts.push('Size ' + (m.size || 'M'));
  if (m.xp) parts.push(m.xp + ' XP');
  const tags = (m.tags || []).join(' · ');
  const imm = m.immune && m.immune.length ? 'Immune: ' + m.immune.join(', ') : '';
  const vuln = m.vuln && m.vuln.length ? 'Vulnerable: ' + m.vuln.join(', ') : '';
  const tr = m.trait || '';
  return {
    line: parts.join(' · '),
    extra: [tags, imm, vuln, tr].filter((x) => x).join(' · ')
  };
}

Bestiary.open = function () {
  const body = document.createElement('div');
  body.className = 'bestiary';
  G.bestiary = G.bestiary || {};
  const head = document.createElement('div');
  head.className = 'dim';
  head.textContent = 'Known ' + Bestiary.known() + ' of ' + Bestiary.total();
  body.appendChild(head);
  const list = document.createElement('div');
  list.className = 'blist';
  const ids = Object.keys(G.bestiary).sort((a, b) => {
    const ma = D.MONSTERS[a], mb = D.MONSTERS[b];
    return (ma && ma.name || a).localeCompare(mb && mb.name || b);
  });
  if (!ids.length) list.innerHTML = '<i>Nothing catalogued yet. The dark is full of company.</i>';
  for (const id of ids) {
    const m = D.MONSTERS[id];
    const rec = G.bestiary[id];
    const card = document.createElement('div');
    card.className = 'bcard' + (rec.fought ? ' fought' : '');
    const nm = document.createElement('div');
    nm.className = 'bname';
    nm.textContent = (m ? m.name : id) + (m && m.leader ? ' (leader)' : '');
    card.appendChild(nm);
    if (rec.fought && m) {
      const st = monStats(m);
      const line = document.createElement('div');
      line.className = 'bstats';
      line.textContent = st.line;
      card.appendChild(line);
      if (st.extra) {
        const ex = document.createElement('div');
        ex.className = 'bextra dim';
        ex.textContent = st.extra;
        card.appendChild(ex);
      }
      if (m.lore) {
        const lore = document.createElement('div');
        lore.className = 'blore dim';
        lore.textContent = m.lore;
        card.appendChild(lore);
      }
    } else {
      const unk = document.createElement('div');
      unk.className = 'bstats dim';
      unk.textContent = 'Not yet fought — details unknown.';
      card.appendChild(unk);
    }
    const counts = document.createElement('div');
    counts.className = 'bcounts dim';
    counts.textContent = 'Seen ' + rec.seen + ' · Fought ' + rec.fought + ' · Killed ' + rec.killed;
    card.appendChild(counts);
    list.appendChild(card);
  }
  body.appendChild(list);
  UI.modal('Bestiary', body, { wide: true });
};
})();
