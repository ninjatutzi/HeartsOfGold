/* Hearts of Gold – Hilfsfunktionen */
window.HOG = window.HOG || {};
(function (H) {
  const U = (H.util = {});

  U.clone = (o) => JSON.parse(U.toJSON(o));
  // Schlüssel die mit "_" beginnen sind Caches und werden nie gespeichert
  U.toJSON = (o) => JSON.stringify(o, (k, v) => (k[0] === '_' ? undefined : v));

  U.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  U.pointInPoly = function (x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };

  U.bbox = function (pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    }
    return [x0, y0, x1, y1];
  };

  U.centroid = function (pts) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      const f = p[0] * q[1] - q[0] * p[1];
      a += f; cx += (p[0] + q[0]) * f; cy += (p[1] + q[1]) * f;
    }
    if (Math.abs(a) < 1e-6) {
      let sx = 0, sy = 0;
      for (const p of pts) { sx += p[0]; sy += p[1]; }
      return [sx / pts.length, sy / pts.length];
    }
    return [cx / (3 * a), cy / (3 * a)];
  };
  U.area = function (pts) {
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      a += p[0] * q[1] - q[0] * p[1];
    }
    return Math.abs(a / 2);
  };

  U.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

  // nächster Punkt auf Strecke
  U.nearOnSeg = function (px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    const x = ax + t * dx, y = ay + t * dy;
    return { d: Math.hypot(px - x, py - y), t, x, y };
  };

  U.fmt = function (n, digits) {
    if (n === undefined || n === null || isNaN(n)) return '–';
    const a = Math.abs(n);
    if (a >= 1e6) return (n / 1e6).toFixed(digits ?? 1) + ' Mio';
    if (a >= 1e4) return Math.round(n / 1e3) + ' K';
    if (a >= 100) return String(Math.round(n));
    return n.toFixed(digits ?? 1);
  };
  // Bevölkerung wird in Tausend (K) gespeichert
  U.fmtPop = function (k) {
    if (k >= 1000) return (k / 1000).toFixed(2).replace('.', ',') + ' Mio';
    return Math.round(k) + ' K';
  };

  U.slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_');

  U.storage = {
    get(key, def) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; }
    },
    set(key, val) {
      try { localStorage.setItem(key, U.toJSON(val)); return true; } catch (e) { alert('Speichern fehlgeschlagen: ' + e.message); return false; }
    },
  };

  U.download = function (filename, text) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  U.pickFile = function () {
    return new Promise((res) => {
      const i = document.createElement('input');
      i.type = 'file'; i.accept = '.json,application/json';
      i.onchange = () => {
        const f = i.files[0]; if (!f) return res(null);
        const r = new FileReader();
        r.onload = () => { try { res(JSON.parse(r.result)); } catch (e) { alert('Ungültige Datei'); res(null); } };
        r.readAsText(f);
      };
      i.click();
    });
  };

  // kleine DOM-Hilfe: h('div', {class:'x', onclick:fn}, 'text', child…)
  U.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v === undefined || v === null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked' || k === 'disabled' || k === 'selected') el[k] = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    const add = (c) => {
      if (c === undefined || c === null || c === false) return;
      if (Array.isArray(c)) c.forEach(add);
      else el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
    };
    kids.forEach(add);
    return el;
  };
  U.$ = (s, r) => (r || document).querySelector(s);

  // einfacher Dialog
  U.modal = function (title, content, buttons) {
    const h = U.h;
    const root = U.$('#modal');
    const close = () => { root.hidden = true; root.innerHTML = ''; };
    root.innerHTML = ''; root.hidden = false;
    const box = h('div', { class: 'modal-box' },
      h('h2', null, title), h('div', { class: 'modal-body' }, content),
      h('div', { class: 'modal-btns' }, (buttons || [{ label: 'OK' }]).map((b) =>
        h('button', { class: b.cls || '', onclick: () => { if (!b.onclick || b.onclick() !== false) close(); } }, b.label))));
    root.appendChild(box);
    return close;
  };
  U.closeModal = () => { const r = U.$('#modal'); r.hidden = true; r.innerHTML = ''; };
  U.prompt = function (title, def, cb) {
    const h = U.h; const inp = h('input', { type: 'text', value: def || '' });
    U.modal(title, inp, [{ label: 'Abbrechen' }, { label: 'OK', cls: 'primary', onclick: () => { cb(inp.value.trim()); } }]);
    inp.focus(); inp.select();
  };
})(window.HOG);
