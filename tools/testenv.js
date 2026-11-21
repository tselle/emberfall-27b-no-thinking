/* Test environment: loads Emberfall's data/rules layer in Node with a
 * minimal D.item stub so rules.js can be exercised before data.js exists.
 * Also provides a small fake DOM so the runtime layer can be simulated.
 * Usage: node tools/check.js [name...] */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

global.window = global;
global.localStorage = (function () {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    key: i => [...m.keys()][i] || null,
    get length() { return m.size; }
  };
})();

/* ---------- tiny fake DOM ---------- */
function FakeEl(tag) {
  this.tagName = (tag || 'div').toUpperCase();
  this.children = [];
  this.style = {};
  this.dataset = {};
  this.classList = {
    _s: new Set(),
    add: (c) => this.classList._s.add(c),
    remove: (c) => this.classList._s.delete(c),
    toggle: (c, f) => { const on = f != null ? f : !this.classList._s.has(c); on ? this.classList._s.add(c) : this.classList._s.delete(c); return on; },
    contains: (c) => this.classList._s.has(c)
  };
  this._text = '';
  this._html = '';
  this.listeners = {};
}
FakeEl.prototype.appendChild = function (c) { this.children.push(c); c.parent = this; return c; };
FakeEl.prototype.insertBefore = function (c, ref) {
  c.parent = this;
  const i = ref ? this.children.indexOf(ref) : -1;
  if (i < 0) this.children.push(c); else this.children.splice(i, 0, c);
  return c;
};
FakeEl.prototype.removeChild = function (c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; };
Object.defineProperty(FakeEl.prototype, 'firstChild', { get: function () { return this.children[0] || null; } });
Object.defineProperty(FakeEl.prototype, 'lastChild', { get: function () { return this.children[this.children.length - 1] || null; } });
Object.defineProperty(FakeEl.prototype, 'parentNode', { get: function () { return this.parent || null; } });
FakeEl.prototype.remove = function () { if (this.parent) this.parent.removeChild(this); };
FakeEl.prototype.addEventListener = function (ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); };
FakeEl.prototype.removeEventListener = function () {};
FakeEl.prototype.setAttribute = function () {};
FakeEl.prototype.getAttribute = function () { return null; };
FakeEl.prototype.querySelectorAll = function (sel) {
  const out = [];
  const wantClass = sel && sel[0] === '.' ? sel.slice(1) : null;
  const wantTag = sel && sel[0] !== '.' && !sel.includes(' ') ? String(sel).toUpperCase() : null;
  (function walk(n) {
    for (const c of (n.children || [])) {
      let hit = false;
      if (wantClass) hit = String(c.className || '').split(/\s+/).indexOf(wantClass) >= 0;
      else if (wantTag) hit = String(c.tagName || '').toUpperCase() === wantTag;
      if (hit) out.push(c);
      walk(c);
    }
  })(this);
  return out;
};
FakeEl.prototype.querySelector = function (sel) { return this.querySelectorAll(sel)[0] || null; };
FakeEl.prototype.getContext = function () {
  /* 2d context no-op stub */
  return new Proxy({}, {
    get: (t, p) => {
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop: () => {} });
      if (p === 'createImageData') return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) });
      if (p === 'measureText') return () => ({ width: 0 });
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'canvas') return this;
      return () => {};
    },
    set: () => true
  });
};
Object.defineProperty(FakeEl.prototype, 'textContent', {
  get: function () {
    if (this.children.length) return this.children.map((c) => (c.textContent != null ? c.textContent : '')).join('');
    return this._text;
  },
  set: function (v) { this._text = String(v); this.children = []; }
});
Object.defineProperty(FakeEl.prototype, 'innerHTML', {
  get: function () { return this._html; },
  set: function (v) { this._html = String(v); this.children = []; }
});
Object.defineProperty(FakeEl.prototype, 'value', {
  get: function () { return this._value || ''; },
  set: function (v) { this._value = String(v); }
});
FakeEl.prototype.getBoundingClientRect = function () { return { left: 0, top: 0, width: 800, height: 400 }; };
FakeEl.prototype.clientWidth = 800;
FakeEl.prototype.clientHeight = 400;

const byId = {};
function elById(id) {
  if (!byId[id]) byId[id] = new FakeEl('div');
  byId[id].id = id;
  return byId[id];
}
global.document = {
  readyState: 'complete',
  body: new FakeEl('body'),
  documentElement: new FakeEl('html'),
  addEventListener: () => {},
  getElementById: elById,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (t) => new FakeEl(t)
};
global.requestAnimationFrame = fn => 0;
global.cancelAnimationFrame = () => {};
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.innerWidth = 1280; global.innerHeight = 800;

function load(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) throw new Error('missing ' + rel);
  // eslint-disable-next-line no-eval
  (new Function('window', fs.readFileSync(p, 'utf8')))(global);
}

function loadLayer() {
  load('js/rules.js');
  if (fs.existsSync(path.join(ROOT, 'js/data.js'))) load('js/data.js');
  if (fs.existsSync(path.join(ROOT, 'js/modules.js'))) load('js/modules.js');
  if (fs.existsSync(path.join(ROOT, 'js/monsters.js'))) load('js/monsters.js');
  if (fs.existsSync(path.join(ROOT, 'js/wilds.js'))) load('js/wilds.js');
  if (fs.existsSync(path.join(ROOT, 'js/treasure.js'))) load('js/treasure.js');
  if (fs.existsSync(path.join(ROOT, 'js/adventures.js'))) load('js/adventures.js');
}

function loadRuntime() {
  const order = ['js/figures.js', 'js/view3d.js', 'js/ui.js', 'js/combat.js', 'js/overland.js', 'js/campaign.js', 'js/journal.js', 'js/map.js', 'js/bestiary.js', 'js/navpad.js', 'js/watch.js', 'js/game.js'];
  for (const f of order) load(f);
}

module.exports = { loadLayer, loadRuntime, load, ROOT };

if (require.main === module) {
  loadLayer();
  console.log('data layer loaded OK');
}
