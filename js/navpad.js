/* Emberfall — navpad.js
 * On-screen touch controls: D-pad movement, facing, and action buttons.
 * All input funnels into Game.press(action) so touch and keyboard are
 * one code path. */
'use strict';
(function () {
const Nav = window.Nav = {};

Nav.init = function () {
  const el = document.getElementById('navpad');
  if (!el) return;
  const defs = [
    { id: 'n', label: '▲', title: 'Move north' },
    { id: 'w', label: '⟲', title: 'Turn left' },
    { id: 's', label: '▼', title: 'Move south' },
    { id: 'e', label: '⟳', title: 'Turn right' },
    { id: 'interact', label: '·', title: 'Interact' },
    { id: 'wait', label: '…', title: 'Wait / rest' },
    { id: 'menu', label: '☰', title: 'Menu' }
  ];
  for (const d of defs) {
    const b = document.createElement('button');
    b.className = 'np';
    b.textContent = d.label;
    b.title = d.title;
    b.dataset.act = d.id;
    const start = (e) => { e.preventDefault(); Nav.press(d.id); };
    b.addEventListener('touchstart', start, { passive: false });
    b.addEventListener('mousedown', start);
    el.appendChild(b);
  }
};

Nav.press = function (act) {
  if (window.Game) Game.press(act);
};
})();
