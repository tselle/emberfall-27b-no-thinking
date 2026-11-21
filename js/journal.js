/* Emberfall — journal.js
 * Commission ledger and day notes. Notes dedupe and keep the last entries;
 * commissions track each module: none / in progress / done. */
'use strict';
(function () {
const Journal = window.Journal = {};

Journal.add = function (day, text) {
  if (!window.G || !text) return;
  G.journal = G.journal || { notes: {}, comms: {}, prior: [] };
  const list = G.journal.notes[day] || (G.journal.notes[day] = []);
  if (list[list.length - 1] === text) return; /* consecutive dedupe */
  if (list.filter((x) => x === text).length >= 2) return; /* near-dedupe */
  list.push(text);
  if (list.length > 30) list.splice(0, list.length - 30);
};

Journal.commState = function (moduleId) {
  G.journal = G.journal || { notes: {}, comms: {}, prior: [] };
  return (G.journal.comms[moduleId] || 'none');
};
Journal.setComm = function (moduleId, state) {
  G.journal = G.journal || { notes: {}, comms: {}, prior: [] };
  G.journal.comms[moduleId] = state;
};
Journal.finishModule = function (moduleId, day) {
  const mo = window.M && M.MODULES[moduleId];
  G.journal = G.journal || { notes: {}, comms: {}, prior: [] };
  G.journal.comms[moduleId] = 'done';
  if (mo && !G.journal.prior.includes(mo.code)) G.journal.prior.push(mo.code);
  Journal.add(day, (mo ? mo.name : moduleId) + ' is done.');
};

Journal.open = function () {
  const body = document.createElement('div');
  body.className = 'journal';
  G.journal = G.journal || { notes: {}, comms: {}, prior: [] };
  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  let tab = 'comms';
  const mkTab = (id, label) => {
    const b = document.createElement('button');
    b.className = 'tab' + (tab === id ? ' on' : '');
    b.textContent = label;
    b.onclick = function () { tab = id; refresh(); };
    tabs.appendChild(b);
    return b;
  };
  const tComms = mkTab('comms', 'Commissions');
  const tNotes = mkTab('notes', 'Notes');
  const tPrior = mkTab('prior', 'Prior adventures');
  body.appendChild(tabs);
  const pane = document.createElement('div');
  pane.className = 'jpane';
  body.appendChild(pane);

  function refresh() {
    tabs.querySelectorAll('.tab').forEach((t, i) => t.className = 'tab' + (['comms', 'notes', 'prior'][i] === tab ? ' on' : ''));
    pane.innerHTML = '';
    if (tab === 'comms') {
      const mods = Object.keys((window.M && M.MODULES) || {});
      if (!mods.length) pane.innerHTML = '<i>No commissions yet.</i>';
      for (const id of mods) {
        const mo = M.MODULES[id];
        const st = G.journal.comms[id] || 'none';
        const row = document.createElement('div');
        row.className = 'jrow ' + st;
        row.innerHTML = '<b>' + mo.code + '</b> — ' + mo.name +
          (st === 'none' ? '<span class="dim"> — not started</span>' :
           st === 'progress' ? '<span class="dim"> — in progress</span>' :
           '<span class="dim"> — done</span>');
        if (st !== 'done') {
          const hint = document.createElement('div');
          hint.className = 'jhint dim';
          hint.textContent = mo.blurb || '';
          row.appendChild(hint);
        }
        pane.appendChild(row);
      }
    } else if (tab === 'notes') {
      const days = Object.keys(G.journal.notes).map(Number).sort((a, b) => a - b);
      if (!days.length) pane.innerHTML = '<i>No notes yet.</i>';
      for (const d of days) {
        const h = document.createElement('div');
        h.className = 'jday';
        h.textContent = 'Day ' + d;
        pane.appendChild(h);
        const list = document.createElement('div');
        list.className = 'jlist';
        for (const n of G.journal.notes[d].slice().reverse()) {
          const li = document.createElement('div');
          li.className = 'jnote';
          li.textContent = n;
          list.appendChild(li);
        }
        pane.appendChild(list);
      }
    } else {
      if (!G.journal.prior.length) pane.innerHTML = '<i>Nothing yet. The road is long.</i>';
      for (const code of G.journal.prior) {
        const row = document.createElement('div');
        row.className = 'jrow done';
        row.innerHTML = '<b>' + code + '</b> — done';
        pane.appendChild(row);
      }
    }
  }
  refresh();
  UI.modal('Journal', body, { wide: true });
};
})();
