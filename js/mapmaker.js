/* Hearts of Gold – Map-Maker (Welten bauen und bearbeiten) */
window.HOG = window.HOG || {};
(function (H) {
  const D = H.data, U = H.util, h = U.h, $ = U.$;
  const RES = D.RESOURCES;
  const TOOLS = [
    ['select', '🖱️ Wählen / Punkte ziehen', 'Provinz anklicken, dann Punkte ziehen. Verbundene Grenzpunkte der Nachbarn bewegen sich mit.'],
    ['move', '✋ Provinz verschieben', 'Gewählte Provinz als Ganzes ziehen.'],
    ['create', '➕ Neue Provinz', 'Klicke Punkte; Doppelklick / Enter / "Fertig" schließt die Provinz. Snap an vorhandene Punkte.'],
    ['addpoint', '⊹ Punkt einfügen', 'Klicke auf eine Kante, um einen Punkt einzufügen.'],
    ['delpoint', '✖ Punkt löschen', 'Klicke auf einen Punkt, um ihn zu entfernen.'],
    ['assign', '🗺️ Staat zuweisen', 'Staat im Reiter "Staaten" wählen, dann Provinzen anklicken (Rechtsklick = entfernen).'],
    ['link', '🔗 Verbindung', 'Zwei Provinzen nacheinander anklicken, um eine Verbindung (z. B. über Meer) zu setzen/lösen.'],
  ];

  class MapMaker {
    constructor() {
      this.view = new H.MapView($('#ed-canvas'));
      this.view.seaColor = '#1b2a3a';
      this.tool = 'select';
      this.tab = 'prov';
      this.selProv = null; this.selState = null; this.selCountry = null;
      this.draft = []; this.undoStack = []; this.linkFrom = null; this.snap = true;
      this.keyHandler = (e) => this.onKey(e);
      this.bind();
    }

    open(world) {
      this.world = world;
      this.world.links = this.world.links || [];
      this.selProv = null; this.selState = this.selState && world.states[this.selState] ? this.selState : Object.keys(world.states)[0] || null;
      this.selCountry = Object.keys(world.countries)[0] || null;
      this.undoStack = []; this.draft = [];
      this.view.setWorld(world);
      document.addEventListener('keydown', this.keyHandler);
      this.running = true;
      this.buildToolbar(); this.render();
    }
    close() { this.running = false; document.removeEventListener('keydown', this.keyHandler); }

    // ---------- Hilfen ----------
    snapshot() { this.undoStack.push(U.toJSON(this.world)); if (this.undoStack.length > 30) this.undoStack.shift(); }
    undo() {
      const s = this.undoStack.pop(); if (!s) return;
      this.world = JSON.parse(s); this.world.links = this.world.links || [];
      this.view.setWorld(this.world, false);
      if (!this.world.provinces[this.selProv]) this.selProv = null;
      if (!this.world.states[this.selState]) this.selState = null;
      this.render();
    }
    newId(prefix, obj) { let n = 1; while (obj[prefix + n]) n++; return prefix + n; }
    changed(p) { if (p) this.view.invalidateProv(p); else this.view.invalidate(); }
    sizeOnScreen(px) { return px / this.view.cam.z; }

    ownerColor(p) {
      const s = this.world.states[p.state];
      if (!s) return '#6a6a6a';
      const c = this.world.countries[s.owner];
      return c ? c.color : '#888';
    }

    // ---------- Interaktion ----------
    bind() {
      const v = this.view;
      v.hooks.fill = (p) => this.ownerColor(p);
      v.hooks.overlay = (ctx) => this.overlay(ctx);
      v.hooks.down = (e, x, y) => this.down(e, x, y);
      v.hooks.move = (e, x, y) => this.move(e, x, y);
      v.hooks.up = () => { this.drag = null; };
      v.hooks.click = (e, x, y) => this.click(e, x, y);
      v.hooks.rclick = (e, x, y) => this.rclick(e, x, y);
    }
    nearestVertex(x, y, provs, maxPx) {
      const r = this.sizeOnScreen(maxPx); let best = null;
      for (const p of provs) p.points.forEach((q, i) => { const d = Math.hypot(q[0] - x, q[1] - y); if (d < r && (!best || d < best.d)) best = { p, i, d, q }; });
      return best;
    }
    allProvs() { return Object.values(this.world.provinces); }
    snapPoint(x, y) {
      if (!this.snap) return [x, y];
      const n = this.nearestVertex(x, y, this.allProvs(), 9);
      return n ? [n.q[0], n.q[1]] : [x, y];
    }
    down(e, x, y) {
      if (this.tool !== 'select' && this.tool !== 'move') return false;
      const sp = this.selProv && this.world.provinces[this.selProv];
      if (!sp) return false;
      if (this.tool === 'select') {
        const n = this.nearestVertex(x, y, [sp], 9);
        if (n) {
          this.snapshot();
          const linked = [];
          if (this.linkedMove !== false) {
            this.allProvs().forEach((p) => { if (p === sp) return; p.points.forEach((q, i) => { if (Math.hypot(q[0] - n.q[0], q[1] - n.q[1]) < 0.6) linked.push([p, i]); }); });
          }
          this.drag = { kind: 'vertex', p: sp, i: n.i, linked };
          return true;
        }
      } else if (U.pointInPoly(x, y, sp.points)) {
        this.snapshot();
        this.drag = { kind: 'prov', p: sp, x, y };
        return true;
      }
      return false;
    }
    move(e, x, y) {
      const d = this.drag; if (!d) return;
      if (d.kind === 'vertex') {
        const sn = e.shiftKey ? [x, y] : this.snapPointExcluding(x, y, d);
        d.p.points[d.i] = [sn[0], sn[1]];
        d.linked.forEach(([p, i]) => { p.points[i] = [sn[0], sn[1]]; this.view.invalidateProv(p); });
        this.view.invalidateProv(d.p);
      } else {
        const dx = x - d.x, dy = y - d.y; d.x = x; d.y = y;
        d.p.points = d.p.points.map((q) => [q[0] + dx, q[1] + dy]);
        this.view.invalidateProv(d.p);
      }
    }
    snapPointExcluding(x, y, d) {
      if (!this.snap) return [x, y];
      const dragged = new Set([d.p.points[d.i]]);
      const r = this.sizeOnScreen(7); let best = null;
      this.allProvs().forEach((p) => p.points.forEach((q, i) => {
        if (p === d.p && i === d.i) return;
        if (d.linked.some(([lp, li]) => lp === p && li === i)) return;
        const dist = Math.hypot(q[0] - x, q[1] - y); if (dist < r && (!best || dist < best.d)) best = { d: dist, q };
      }));
      return best ? best.q : [x, y];
    }
    click(e, x, y) {
      const v = this.view, w = this.world;
      if (this.tool === 'create') {
        const pt = this.snapPoint(x, y);
        if (this.draft.length >= 3 && Math.hypot(pt[0] - this.draft[0][0], pt[1] - this.draft[0][1]) < this.sizeOnScreen(10)) { this.finishDraft(); return; }
        const l = this.draft[this.draft.length - 1];
        if (l && l[0] === pt[0] && l[1] === pt[1]) { if (e.detail >= 2) this.finishDraft(); return; }
        this.draft.push(pt); v.redraw(); return;
      }
      if (this.tool === 'addpoint') { this.addPointAt(x, y); return; }
      if (this.tool === 'delpoint') {
        const n = this.nearestVertex(x, y, this.allProvs(), 10);
        if (n) {
          const key = n.q;
          const hold = this.allProvs().filter((p) => p.points.some((q) => Math.hypot(q[0] - key[0], q[1] - key[1]) < 0.6));
          if (hold.some((p) => p.points.length <= 3)) { this.toast('Eine Provinz braucht mindestens 3 Punkte.'); return; }
          this.snapshot();
          hold.forEach((p) => { p.points = p.points.filter((q) => Math.hypot(q[0] - key[0], q[1] - key[1]) >= 0.6); v.invalidateProv(p); });
        }
        return;
      }
      const p = v.hit(x, y);
      if (this.tool === 'assign') {
        if (p && this.selState) { this.snapshot(); this.assign(p.id, this.selState); }
        else if (!this.selState) this.toast('Erst im Reiter "Staaten" einen Staat wählen/erstellen.');
        return;
      }
      if (this.tool === 'link') {
        if (!p) { this.linkFrom = null; v.redraw(); return; }
        if (!this.linkFrom) { this.linkFrom = p.id; v.redraw(); return; }
        if (this.linkFrom !== p.id) {
          this.snapshot();
          const i = w.links.findIndex((l) => (l[0] === this.linkFrom && l[1] === p.id) || (l[1] === this.linkFrom && l[0] === p.id));
          if (i >= 0) w.links.splice(i, 1); else w.links.push([this.linkFrom, p.id]);
        }
        this.linkFrom = null; v.redraw(); return;
      }
      this.selProv = p ? p.id : null;
      if (p && p.state && this.tab === 'state') this.selState = p.state;
      v.redraw(); this.render();
    }
    rclick(e, x, y) {
      if (this.tool === 'create' && this.draft.length) { this.draft.pop(); this.view.redraw(); return; }
      if (this.tool === 'assign') {
        const p = this.view.hit(x, y);
        if (p) { this.snapshot(); this.assign(p.id, null); }
      }
    }
    onKey(e) {
      if (!this.running || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || !$('#modal').hidden) return;
      if (e.key === 'Enter' && this.tool === 'create') this.finishDraft();
      else if (e.key === 'Escape') { this.draft = []; this.linkFrom = null; this.selProv = null; this.view.redraw(); this.render(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); this.undo(); }
      else if (e.key === 'Delete' && this.selProv) this.deleteProv(this.selProv);
    }
    finishDraft() {
      const pts = this.draft.filter((q, i) => i === 0 || q[0] !== this.draft[i - 1][0] || q[1] !== this.draft[i - 1][1]);
      this.draft = [];
      if (pts.length < 3) { this.view.redraw(); return; }
      this.snapshot();
      const id = this.newId('p', this.world.provinces);
      const p = { id, name: 'Provinz ' + id.slice(1), points: pts, state: this.selState && this.world.states[this.selState] ? this.selState : null, occupier: null };
      this.world.provinces[id] = p;
      if (p.state) this.world.states[p.state].provinces.push(id);
      this.selProv = id; this.changed(); this.render();
    }
    assign(pid, sid) {
      const w = this.world, p = w.provinces[pid];
      if (p.state && w.states[p.state]) w.states[p.state].provinces = w.states[p.state].provinces.filter((x) => x !== pid);
      p.state = sid;
      if (sid) w.states[sid].provinces.push(pid);
      this.changed(); this.render();
    }
    deleteProv(pid) {
      this.snapshot();
      const w = this.world, p = w.provinces[pid]; if (!p) return;
      if (p.state && w.states[p.state]) w.states[p.state].provinces = w.states[p.state].provinces.filter((x) => x !== pid);
      delete w.provinces[pid];
      w.links = w.links.filter((l) => l[0] !== pid && l[1] !== pid);
      this.selProv = null; this.changed(); this.render();
    }
    addPointAt(x, y) {
      const r = this.sizeOnScreen(10); let best = null;
      this.allProvs().forEach((p) => p.points.forEach((a, i) => {
        const b = p.points[(i + 1) % p.points.length], n = U.nearOnSeg(x, y, a[0], a[1], b[0], b[1]);
        if (n.d < r && (!best || n.d < best.d)) best = { p, i, x: n.x, y: n.y, d: n.d, a, b };
      }));
      if (!best) return;
      this.snapshot();
      this.insertOnEdge(best.a, best.b, [best.x, best.y]);
      this.selProv = best.p.id; this.render();
    }
    // fügt einen Punkt in alle Provinzen ein, die die Kante a-b teilen
    insertOnEdge(a, b, pt) {
      this.allProvs().forEach((p) => {
        const pts = p.points;
        for (let i = 0; i < pts.length; i++) {
          const c = pts[i], d = pts[(i + 1) % pts.length];
          const same = (Math.hypot(c[0] - a[0], c[1] - a[1]) < 0.6 && Math.hypot(d[0] - b[0], d[1] - b[1]) < 0.6) || (Math.hypot(c[0] - b[0], c[1] - b[1]) < 0.6 && Math.hypot(d[0] - a[0], d[1] - a[1]) < 0.6);
          if (same) { pts.splice(i + 1, 0, [pt[0], pt[1]]); this.view.invalidateProv(p); break; }
        }
      });
    }
    refine(pid) {
      const p = this.world.provinces[pid]; if (!p || p.points.length > 400) return;
      this.snapshot();
      const edges = p.points.map((a, i) => [a, p.points[(i + 1) % p.points.length]]);
      edges.forEach(([a, b]) => this.insertOnEdge(a, b, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]));
      this.view.redraw(); this.render();
    }
    reduce(pid) {
      const p = this.world.provinces[pid]; if (!p || p.points.length <= 6) return;
      this.snapshot();
      const kill = p.points.filter((q, i) => i % 2 === 1);
      kill.forEach((key) => {
        this.allProvs().forEach((pp) => { if (pp.points.length > 3) { pp.points = pp.points.filter((q) => Math.hypot(q[0] - key[0], q[1] - key[1]) >= 0.6 || pp.points.length <= 3); this.view.invalidateProv(pp); } });
      });
      this.render();
    }

    overlay(ctx) {
      const v = this.view, z = v.cam.z, w = this.world;
      // Staat-Hervorhebung
      const ss = this.selState && w.states[this.selState];
      if (ss && (this.tab === 'state' || this.tool === 'assign')) {
        ctx.lineWidth = 2 / z; ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ss.provinces.forEach((pid) => { const p = w.provinces[pid]; if (p) ctx.stroke(v.cache(p).path); });
      }
      // Verbindungen
      ctx.setLineDash([4 / z, 3 / z]); ctx.strokeStyle = '#6ff'; ctx.lineWidth = 1.6 / z;
      w.links.forEach(([a, b]) => { const pa = w.provinces[a], pb = w.provinces[b]; if (!pa || !pb) return; const ca = v.center(pa), cb = v.center(pb); ctx.beginPath(); ctx.moveTo(ca[0], ca[1]); ctx.lineTo(cb[0], cb[1]); ctx.stroke(); });
      ctx.setLineDash([]);
      if (this.linkFrom && w.provinces[this.linkFrom]) { ctx.lineWidth = 3 / z; ctx.strokeStyle = '#6ff'; ctx.stroke(v.cache(w.provinces[this.linkFrom]).path); }
      // gewählte Provinz
      const sp = this.selProv && w.provinces[this.selProv];
      if (sp) {
        ctx.lineWidth = 2.5 / z; ctx.strokeStyle = '#ffd24a'; ctx.stroke(v.cache(sp).path);
        const s = 6 / z;
        sp.points.forEach((q) => { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1 / z; ctx.fillRect(q[0] - s / 2, q[1] - s / 2, s, s); ctx.strokeRect(q[0] - s / 2, q[1] - s / 2, s, s); });
      }
      // neue Provinz
      if (this.draft.length) {
        ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2 / z; ctx.beginPath();
        this.draft.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
        this.draft.forEach((q, i) => { ctx.fillStyle = i === 0 ? '#4f4' : '#ffd24a'; ctx.beginPath(); ctx.arc(q[0], q[1], (i === 0 ? 5 : 3.5) / z, 0, 7); ctx.fill(); });
      }
    }

    toast(t) { const b = $('#ed-msg'); b.textContent = t; b.hidden = false; clearTimeout(this._t); this._t = setTimeout(() => (b.hidden = true), 3500); }

    buildToolbar() {
      const bar = $('#ed-toolbar'); bar.innerHTML = '';
      TOOLS.forEach(([id, name, tip]) => bar.appendChild(h('button', { class: this.tool === id ? 'on' : '', title: tip, onclick: () => { this.tool = id; this.draft = []; this.linkFrom = null; this.buildToolbar(); this.view.redraw(); this.toast(tip); } }, name)));
      bar.appendChild(h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: this.snap, onchange: (e) => (this.snap = e.target.checked) }), ' Magnet'));
      bar.appendChild(h('label', { class: 'chk', title: 'Beim Ziehen eines Punktes bewegen sich deckungsgleiche Punkte der Nachbarprovinzen mit' }, h('input', { type: 'checkbox', checked: this.linkedMove !== false, onchange: (e) => (this.linkedMove = e.target.checked) }), ' Grenzen verbunden'));
      bar.appendChild(h('button', { onclick: () => this.undo() }, '↶ Rückgängig'));
      bar.appendChild(h('button', { onclick: () => this.view.fit() }, '⤢'));
      if (this.tool === 'create') bar.appendChild(h('button', { class: 'primary', onclick: () => this.finishDraft() }, '✔ Fertig'));
    }

    // ---------- Seitenleiste ----------
    render() {
      if (!this.running) return;
      const side = $('#ed-side'); const tabs = [['prov', 'Provinz'], ['state', 'Staaten'], ['country', 'Länder'], ['alliance', 'Allianzen'], ['eth', 'Ethnien'], ['world', 'Welt']];
      const keep = side.querySelector('.tabbody') ? side.querySelector('.tabbody').scrollTop : 0;
      side.innerHTML = '';
      side.appendChild(h('div', { class: 'tabs' }, tabs.map(([id, n]) => h('button', { class: this.tab === id ? 'on' : '', onclick: () => { this.tab = id; if (id === 'state' && this.selProv) { const p = this.world.provinces[this.selProv]; if (p && p.state) this.selState = p.state; } this.render(); this.view.redraw(); } }, n))));
      const body = h('div', { class: 'tabbody' }); side.appendChild(body);
      try { this['t_' + this.tab](body); } catch (err) { body.textContent = 'Fehler: ' + err.message; console.error(err); }
      body.scrollTop = keep;
    }
    field(label, input) { return h('label', { class: 'field' }, h('span', null, label), input); }
    num(obj, key, min, cb) {
      return h('input', { type: 'number', value: Math.round((obj[key] || 0) * 100) / 100, min: min ?? 0, onchange: (e) => { this.snapshot(); obj[key] = Math.max(min ?? 0, parseFloat(e.target.value) || 0); cb && cb(); } });
    }
    sel(options, value, onchange) {
      return h('select', { onchange: (e) => onchange(e.target.value) }, options.map(([v, n]) => h('option', { value: v, selected: v === value }, n)));
    }
    countryOptions() { return Object.values(this.world.countries).map((c) => [c.tag, c.name]); }
    ethOptions() { return this.world.ethnicities.map((e) => [e.id, e.name]); }

    t_prov(body) {
      const w = this.world, p = this.selProv && w.provinces[this.selProv];
      body.appendChild(h('p', { class: 'hint' }, 'Werkzeug: ' + TOOLS.find((t) => t[0] === this.tool)[2]));
      body.appendChild(h('div', { class: 'row' }, h('b', null, Object.keys(w.provinces).length + ' Provinzen'), ' · ' + Object.keys(w.states).length + ' Staaten · ' + Object.keys(w.countries).length + ' Länder'));
      if (!p) { body.appendChild(h('p', { class: 'hint' }, 'Keine Provinz gewählt. Klicke auf die Karte oder erstelle mit "➕ Neue Provinz" eine neue.')); return; }
      body.appendChild(h('h3', null, 'Provinz ' + p.id));
      body.appendChild(this.field('Name', h('input', { type: 'text', value: p.name, onchange: (e) => { this.snapshot(); p.name = e.target.value; } })));
      body.appendChild(this.field('Staat', this.sel([['', '– keiner –'], ...Object.values(w.states).map((s) => [s.id, s.name + ' (' + s.owner + ')'])], p.state || '', (v) => { this.snapshot(); this.assign(p.id, v || null); })));
      body.appendChild(h('div', { class: 'row' }, 'Punkte: ', h('b', null, p.points.length)));
      body.appendChild(h('div', { class: 'row btns' },
        h('button', { onclick: () => this.refine(p.id) }, '➕ Punkte erhöhen (genauer)'),
        h('button', { onclick: () => this.reduce(p.id) }, '➖ Punkte verringern'),
        h('button', { class: 'danger', onclick: () => this.deleteProv(p.id) }, '🗑 Löschen')));
      body.appendChild(h('p', { class: 'hint' }, '"Punkte erhöhen" teilt jede Kante in der Mitte – danach kannst du die Grenze mit den neuen Punkten genauer formen.'));
    }

    t_state(body) {
      const w = this.world;
      body.appendChild(h('div', { class: 'row btns' },
        h('button', { class: 'primary', onclick: () => this.newState() }, '＋ Neuer Staat'),
        h('button', { onclick: () => { this.tool = 'assign'; this.buildToolbar(); this.view.redraw(); this.toast(TOOLS[5][2]); } }, '🗺️ Provinzen zuweisen')));
      body.appendChild(this.field('Staat wählen', this.sel([['', '–'], ...Object.values(w.states).map((s) => [s.id, s.name + ' [' + s.owner + ']'])], this.selState || '', (v) => { this.selState = v || null; this.render(); this.view.redraw(); })));
      const s = this.selState && w.states[this.selState];
      if (!s) return;
      const ch = () => { this.view.invalidate(); this.render(); };
      body.appendChild(h('h3', null, s.name));
      body.appendChild(this.field('Name', h('input', { type: 'text', value: s.name, onchange: (e) => { this.snapshot(); s.name = e.target.value; this.view.labels = null; this.view.redraw(); this.render(); } })));
      body.appendChild(this.field('Besitzer (Land)', this.sel(this.countryOptions(), s.owner, (v) => { this.snapshot(); s.owner = v; s.occupier = v; ch(); })));
      body.appendChild(h('div', { class: 'row' }, 'Provinzen: ' + s.provinces.length));
      body.appendChild(this.field('BIP', this.num(s, 'gdp', 0)));
      body.appendChild(h('h4', null, 'Gebäude & Energie'));
      body.appendChild(h('div', { class: 'grid3' }, Object.keys(D.BUILDINGS).map((k) => this.field(D.BUILDINGS[k].icon + ' ' + D.BUILDINGS[k].name, this.num(s.buildings, k, 0)))));
      body.appendChild(this.field('Bauplätze (Slots)', this.num(s, 'slots', 0)));
      body.appendChild(h('h4', null, 'Ressourcen (pro Tag)'));
      body.appendChild(h('div', { class: 'grid3' }, RES.map((r) => this.field(r.icon + ' ' + r.name, this.num(s.resources, r.id, 0)))));
      body.appendChild(h('h4', null, 'Bevölkerung (in Tausend)'));
      Object.keys(s.pop).forEach((e) => {
        body.appendChild(h('div', { class: 'row' }, h('span', { style: { flex: 1 } }, (w.ethnicities.find((x) => x.id === e) || { name: e }).name),
          h('input', { type: 'number', value: Math.round(s.pop[e]), min: 0, onchange: (ev) => { this.snapshot(); s.pop[e] = Math.max(0, parseFloat(ev.target.value) || 0); if (!s.pop[e]) delete s.pop[e]; this.render(); } })));
      });
      const free = this.ethOptions().filter(([id]) => !(id in s.pop));
      if (free.length) { const sl = this.sel(free, free[0][0], () => { }); body.appendChild(h('div', { class: 'row' }, sl, h('button', { onclick: () => { this.snapshot(); s.pop[sl.value] = 100; this.render(); } }, '+ Ethnie'))); }
      body.appendChild(h('div', { class: 'row btns' }, h('button', { class: 'danger', onclick: () => this.deleteState(s.id) }, '🗑 Staat löschen')));
    }
    newState() {
      U.prompt('Name des neuen Staates', 'Neuer Staat', (name) => {
        if (!name) return;
        this.snapshot();
        const w = this.world, owner = this.selCountry && w.countries[this.selCountry] ? this.selCountry : Object.keys(w.countries)[0];
        if (!owner) { this.toast('Erstelle zuerst im Reiter "Länder" ein Land.'); return; }
        const id = this.newId('s', w.states), main = w.countries[owner].main;
        w.states[id] = { id, name, owner, occupier: owner, provinces: [], resources: { oil: 0, aluminum: 0, steel: 0, tungsten: 0, chromium: 0 }, pop: { [main]: 1000 }, gdp: 100, buildings: { civ: 1, mil: 0, power: 1 }, slots: 6, unrest: 0 };
        this.selState = id; this.tool = 'assign'; this.buildToolbar(); this.view.invalidate(); this.render(); this.toast('Staat erstellt. Klicke jetzt Provinzen an, um sie zuzuweisen.');
      });
    }
    deleteState(id) {
      U.modal('Staat löschen', 'Staat wirklich löschen? Seine Provinzen werden unzugewiesen.', [{ label: 'Abbrechen' }, { label: 'Löschen', cls: 'danger', onclick: () => {
        this.snapshot();
        const w = this.world; w.states[id].provinces.forEach((pid) => { if (w.provinces[pid]) w.provinces[pid].state = null; });
        delete w.states[id]; this.selState = null; this.view.invalidate(); this.render();
      } }]);
    }

    t_country(body) {
      const w = this.world;
      body.appendChild(h('div', { class: 'row btns' }, h('button', { class: 'primary', onclick: () => this.newCountry() }, '＋ Neues Land')));
      body.appendChild(this.field('Land wählen', this.sel([['', '–'], ...this.countryOptions()], this.selCountry || '', (v) => { this.selCountry = v || null; this.render(); })));
      const c = this.selCountry && w.countries[this.selCountry];
      if (!c) return;
      const ch = () => { this.view.invalidate(); this.render(); };
      body.appendChild(h('div', { class: 'bigflag' }, H.flag.img(c.flag, 96, 64), h('div', null, h('h3', null, c.name), h('div', { class: 'sub' }, 'Kürzel: ' + c.tag + ' · Staaten: ' + Object.values(w.states).filter((s) => s.owner === c.tag).length))));
      body.appendChild(this.field('Name', h('input', { type: 'text', value: c.name, onchange: (e) => { this.snapshot(); c.name = e.target.value; this.view.labels = null; this.render(); } })));
      body.appendChild(this.field('Farbe', h('input', { type: 'color', value: c.color, onchange: (e) => { this.snapshot(); c.color = e.target.value; this.view.redraw(); } })));
      body.appendChild(this.field('Ideologie', this.sel(Object.keys(D.IDEOLOGIES).map((k) => [k, D.IDEOLOGIES[k].name]), c.ideology, (v) => { this.snapshot(); c.ideology = v; })));
      body.appendChild(this.field('Staatsvolk (Hauptethnie)', this.sel(this.ethOptions(), c.main, (v) => { this.snapshot(); c.main = v; })));
      const ownedStates = Object.values(w.states).filter((s) => s.owner === c.tag);
      body.appendChild(this.field('Hauptstadt (Staat)', this.sel(ownedStates.map((s) => [s.id, s.name]), c.capital, (v) => { this.snapshot(); c.capital = v; })));
      body.appendChild(h('h4', null, 'Integrierte Ethnien (machen keinen Ärger)'));
      body.appendChild(h('div', { class: 'checks' }, w.ethnicities.filter((e) => e.id !== c.main).map((e) => h('label', null, h('input', { type: 'checkbox', checked: (c.integrated || []).includes(e.id), onchange: (ev) => { this.snapshot(); c.integrated = c.integrated || []; if (ev.target.checked) c.integrated.push(e.id); else c.integrated = c.integrated.filter((x) => x !== e.id); } }), ' ' + e.name))));
      body.appendChild(h('h4', null, 'Regeln des Landes'));
      Object.keys(D.POLICIES).forEach((id) => body.appendChild(h('label', { class: 'policy' }, h('input', { type: 'checkbox', checked: !!(c.policies && c.policies[id]), onchange: (ev) => { this.snapshot(); c.policies = c.policies || {}; c.policies[id] = ev.target.checked; } }), h('div', null, h('b', null, D.POLICIES[id].name), h('div', { class: 'sub' }, D.POLICIES[id].desc)))));
      body.appendChild(h('h4', null, 'Flagge'));
      const f = c.flag = c.flag || { pattern: 'h3', c1: '#cc0000', c2: '#ffffff', c3: '#000000', emblem: 'none' };
      const prev = h('div', { class: 'flagprev' });
      const upd = () => { prev.innerHTML = ''; prev.appendChild(H.flag.img(f, 120, 80)); };
      upd();
      const fch = () => { upd(); this.view.redraw(); };
      body.appendChild(prev);
      body.appendChild(this.field('Muster', this.sel(Object.entries(D.PATTERNS), f.pattern, (v) => { this.snapshot(); f.pattern = v; fch(); })));
      body.appendChild(this.field('Emblem', this.sel(Object.entries(D.EMBLEMS), f.emblem || 'none', (v) => { this.snapshot(); f.emblem = v; fch(); })));
      body.appendChild(h('div', { class: 'row' }, ['c1', 'c2', 'c3'].map((k) => h('input', { type: 'color', value: this.hex(f[k]), onchange: (e) => { this.snapshot(); f[k] = e.target.value; fch(); } })),
        h('button', { onclick: () => { this.snapshot(); Object.assign(f, H.flag.random()); f.c1 = this.hex(f.c1); f.c2 = this.hex(f.c2); f.c3 = this.hex(f.c3); this.render(); } }, '🎲 Zufall')));
      body.appendChild(h('div', { class: 'row btns' }, h('button', { class: 'danger', onclick: () => this.deleteCountry(c.tag) }, '🗑 Land löschen')));
    }
    hex(col) {
      if (/^#[0-9a-f]{6}$/i.test(col)) return col;
      const cv = document.createElement('canvas').getContext('2d'); cv.fillStyle = col; const v = cv.fillStyle; return /^#/.test(v) ? v : '#888888';
    }
    newCountry() {
      const body = h('div', null, this.field('Name', h('input', { type: 'text', id: 'nc-name', value: 'Neues Land' })), this.field('Kürzel (3 Buchstaben)', h('input', { type: 'text', id: 'nc-tag', maxlength: 3, value: 'NEU' })));
      U.modal('Neues Land', body, [{ label: 'Abbrechen' }, { label: 'Erstellen', cls: 'primary', onclick: () => {
        const name = $('#nc-name').value.trim(), tag = $('#nc-tag').value.trim().toUpperCase();
        const w = this.world;
        if (!name || tag.length < 2) { alert('Name und Kürzel nötig.'); return false; }
        if (w.countries[tag]) { alert('Kürzel existiert schon.'); return false; }
        this.snapshot();
        w.countries[tag] = { tag, name, color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'), ideology: 'democratic', main: w.ethnicities[0].id, integrated: [], capital: null, policies: { ethnicSuppression: false, warEconomy: false, education: false }, flag: H.flag.random() };
        this.selCountry = tag; this.render(); this.view.redraw();
      } }]);
    }
    deleteCountry(tag) {
      const w = this.world, owned = Object.values(w.states).filter((s) => s.owner === tag);
      if (owned.length) { alert('Erst die Staaten dieses Landes einem anderen Land zuweisen (' + owned.length + ' Staaten).'); return; }
      this.snapshot(); delete w.countries[tag];
      w.alliances.forEach((a) => (a.members = a.members.filter((m) => m !== tag)));
      this.selCountry = Object.keys(w.countries)[0] || null; this.render(); this.view.redraw();
    }

    t_alliance(body) {
      const w = this.world;
      body.appendChild(h('div', { class: 'row btns' }, h('button', { class: 'primary', onclick: () => { this.snapshot(); const id = this.newId('a', Object.fromEntries(w.alliances.map((a) => [a.id, 1]))); w.alliances.push({ id, name: 'Neue Allianz', members: [] }); this.render(); } }, '＋ Neue Allianz')));
      if (!w.alliances.length) body.appendChild(h('p', { class: 'hint' }, 'Noch keine Allianzen. Verbündete treten Kriegen automatisch bei.'));
      w.alliances.forEach((a) => {
        body.appendChild(h('div', { class: 'item' },
          h('div', { class: 'itemhead' }, h('input', { type: 'text', value: a.name, onchange: (e) => { this.snapshot(); a.name = e.target.value; } }), h('button', { class: 'x', onclick: () => { this.snapshot(); w.alliances = w.alliances.filter((x) => x !== a); this.render(); } }, '✕')),
          h('div', { class: 'checks' }, Object.values(w.countries).map((c) => h('label', null, h('input', { type: 'checkbox', checked: a.members.includes(c.tag), onchange: (ev) => { this.snapshot(); if (ev.target.checked) a.members.push(c.tag); else a.members = a.members.filter((m) => m !== c.tag); } }), ' ', H.flag.img(c.flag, 18, 12), ' ' + c.name)))));
      });
    }

    t_eth(body) {
      const w = this.world;
      body.appendChild(h('div', { class: 'row btns' }, h('button', { class: 'primary', onclick: () => U.prompt('Name der Ethnie', 'Neue Ethnie', (n) => { if (!n) return; this.snapshot(); w.ethnicities.push({ id: 'e' + Date.now().toString(36), name: n, color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0') }); this.render(); }) }, '＋ Neue Ethnie')));
      w.ethnicities.forEach((e) => {
        const used = Object.values(w.states).some((s) => e.id in s.pop) || Object.values(w.countries).some((c) => c.main === e.id);
        body.appendChild(h('div', { class: 'row' }, h('input', { type: 'color', value: this.hex(e.color), onchange: (ev) => { this.snapshot(); e.color = ev.target.value; } }),
          h('input', { type: 'text', value: e.name, style: { flex: 1 }, onchange: (ev) => { this.snapshot(); e.name = ev.target.value; } }),
          h('button', { class: 'x', title: used ? 'Wird noch verwendet' : 'Löschen', disabled: used, onclick: () => { this.snapshot(); w.ethnicities = w.ethnicities.filter((x) => x !== e); w.countries && Object.values(w.countries).forEach((c) => (c.integrated = (c.integrated || []).filter((i) => i !== e.id))); this.render(); } }, '✕')));
      });
    }

    t_world(body) {
      const w = this.world;
      body.appendChild(this.field('Name der Welt', h('input', { type: 'text', value: w.name, onchange: (e) => { w.name = e.target.value; } })));
      body.appendChild(h('div', { class: 'grid2' }, this.field('Breite', this.num(w, 'width', 200, () => this.view.fit())), this.field('Höhe', this.num(w, 'height', 200, () => this.view.fit()))));
      body.appendChild(h('h4', null, 'Speichern & Laden'));
      body.appendChild(h('div', { class: 'row btns' },
        h('button', { class: 'primary', onclick: () => H.app.saveWorld(w) }, '💾 Im Browser speichern'),
        h('button', { onclick: () => H.app.loadWorldDialog((nw) => this.open(nw)) }, '📂 Gespeicherte Welt laden'),
        h('button', { onclick: () => U.download((w.name || 'welt').replace(/[^\w\-]+/g, '_') + '.hog-world.json', U.toJSON(w)) }, '⬇ Als Datei exportieren'),
        h('button', { onclick: async () => { const d = await U.pickFile(); if (d && d.provinces) this.open(d); else if (d) alert('Das ist keine Welt-Datei.'); } }, '⬆ Datei importieren')));
      body.appendChild(h('h4', null, 'Neue Welt'));
      body.appendChild(h('div', { class: 'row btns' },
        h('button', { onclick: () => U.modal('Neue leere Welt', 'Aktuelle Welt verwerfen (nicht gespeicherte Änderungen gehen verloren)?', [{ label: 'Abbrechen' }, { label: 'Leere Welt', cls: 'danger', onclick: () => this.open(H.worldgen.emptyWorld()) }]) }, '📄 Leere Welt'),
        h('button', { onclick: () => U.modal('Beispielwelt', 'Mitteleuropa-Beispielwelt laden (aktuelle Welt wird verworfen)?', [{ label: 'Abbrechen' }, { label: 'Laden', cls: 'danger', onclick: () => this.open(H.worldgen.defaultWorld()) }]) }, '🌍 Beispielwelt (Mitteleuropa)')));
      body.appendChild(h('h4', null, 'Testen'));
      body.appendChild(h('div', { class: 'row btns' }, h('button', { class: 'primary', onclick: () => H.app.playWorld(this.world) }, '▶ Diese Welt spielen')));
      body.appendChild(h('p', { class: 'hint' }, 'Beim Spielen werden Provinzen ohne Staat und Länder ohne Staaten ignoriert.'));
    }
  }
  H.MapMaker = MapMaker;
})(window.HOG);
