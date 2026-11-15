/* Hearts of Gold – Kartenansicht (Kamera, Zeichnen, Hit-Test). Wird von Spiel und Editor genutzt. */
window.HOG = window.HOG || {};
(function (H) {
  const U = H.util;

  // Terrain-Texturen (kachelbar, in Weltkoordinaten). Ebene und Wasser haben keine.
  const TEX = {};
  function texture(ctx, type) {
    if (TEX[type] !== undefined) return TEX[type];
    if (type === 'plains' || type === 'water' || !type) return (TEX[type] = null);
    const S = 16, c = document.createElement('canvas'); c.width = c.height = S * 2; const g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,0.38)'; g.strokeStyle = 'rgba(0,0,0,0.38)'; g.lineWidth = 1.2; g.lineCap = 'round';
    const tree = (x, y) => { g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + 3.5, y + 2); g.lineTo(x - 3.5, y + 2); g.closePath(); g.fill(); g.fillRect(x - 0.5, y + 2, 1, 2); };
    if (type === 'forest') { tree(8, 10); tree(24, 8); tree(16, 25); tree(2, 27); tree(30, 28); }
    else if (type === 'hill') { [[8, 12], [24, 22], [10, 28]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 5, Math.PI, 0); g.stroke(); }); }
    else if (type === 'mountain') { [[8, 12], [24, 14], [16, 28]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x - 6, y + 4); g.lineTo(x, y - 5); g.lineTo(x + 6, y + 4); g.stroke(); g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + 1.5, y + 4); g.stroke(); }); }
    else if (type === 'swamp') { [[6, 8], [22, 14], [12, 26], [28, 28]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x + 5, y); g.stroke(); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 5); g.stroke(); g.beginPath(); g.moveTo(x + 2.5, y); g.lineTo(x + 3, y - 4); g.stroke(); }); }
    else if (type === 'desert') { [[6, 8], [20, 6], [12, 20], [28, 18], [4, 28], [22, 29]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 1.1, 0, 7); g.fill(); }); }
    return (TEX[type] = ctx.createPattern(c, 'repeat'));
  }
  H.terrainTexture = texture;

  class MapView {
    constructor(canvas) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d');
      this.cam = { x: 0, y: 0, z: 1 };
      this.world = null;
      this.hooks = {}; // fill(p), overlay(ctx,view), down/move/up(ev,wx,wy), click, rclick, hover
      this.seaColor = '#16222e';
      this.waterColor = '#1f5a8c';
      this.showTerrain = true;
      this.dirty = true;
      this.borders = null;
      this.labels = null;
      this.showLabels = true;
      this.dragging = null;
      this._bind();
      new ResizeObserver(() => { this.resize(); }).observe(canvas.parentElement);
      const loop = () => { if (this.dirty && this.world) { this.dirty = false; this._draw(); } requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }

    setWorld(w, fit) {
      this.world = w;
      this.invalidate();
      if (fit !== false) this.fit();
    }
    invalidate() { this.borders = null; this.labels = null; for (const id in (this.world ? this.world.provinces : {})) this.world.provinces[id]._c = null; this.dirty = true; }
    redraw() { this.dirty = true; }
    invalidateProv(p) { p._c = null; this.borders = null; this.labels = null; this.dirty = true; }

    resize() {
      const p = this.cv.parentElement;
      const dpr = window.devicePixelRatio || 1;
      this.cv.width = Math.max(10, p.clientWidth * dpr);
      this.cv.height = Math.max(10, p.clientHeight * dpr);
      this.cv.style.width = p.clientWidth + 'px';
      this.cv.style.height = p.clientHeight + 'px';
      this.dpr = dpr;
      this.dirty = true;
    }
    get w() { return this.cv.width / (this.dpr || 1); }
    get h() { return this.cv.height / (this.dpr || 1); }

    fit() {
      this.resize();
      if (!this.world) return;
      const z = Math.min(this.w / this.world.width, this.h / this.world.height) * 0.97;
      this.cam.z = Math.max(0.2, z);
      this.cam.x = (this.world.width - this.w / this.cam.z) / 2;
      this.cam.y = (this.world.height - this.h / this.cam.z) / 2;
      this.dirty = true;
    }
    focus(x, y, z) {
      if (z) this.cam.z = z;
      this.cam.x = x - this.w / this.cam.z / 2;
      this.cam.y = y - this.h / this.cam.z / 2;
      this.dirty = true;
    }
    toWorld(sx, sy) { return [sx / this.cam.z + this.cam.x, sy / this.cam.z + this.cam.y]; }

    // Cache pro Provinz: Path2D, bbox, Zentrum
    cache(p) {
      if (p._c) return p._c;
      const path = new Path2D();
      p.points.forEach((q, i) => (i ? path.lineTo(q[0], q[1]) : path.moveTo(q[0], q[1])));
      path.closePath();
      p._c = { path, bb: U.bbox(p.points), c: U.centroid(p.points) };
      return p._c;
    }
    center(p) { return this.cache(p).c; }

    hit(wx, wy) {
      const provs = this.world.provinces;
      let best = null;
      for (const id in provs) {
        const p = provs[id], c = this.cache(p);
        if (wx < c.bb[0] || wx > c.bb[2] || wy < c.bb[1] || wy > c.bb[3]) continue;
        if (U.pointInPoly(wx, wy, p.points)) best = p;
      }
      return best;
    }

    // Grenzen: Kanten die von Provinzen geteilt werden, nach Typ sortiert
    computeBorders() {
      const w = this.world, edges = new Map();
      const key = (a, b) => {
        const ka = a[0].toFixed(1) + ',' + a[1].toFixed(1), kb = b[0].toFixed(1) + ',' + b[1].toFixed(1);
        return ka < kb ? ka + '|' + kb : kb + '|' + ka;
      };
      for (const id in w.provinces) {
        const p = w.provinces[id], pts = p.points;
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length], k = key(a, b);
          const e = edges.get(k);
          if (e) e.p2 = p; else edges.set(k, { a, b, p1: p, p2: null });
        }
      }
      const prov = [], state = [], country = [], coast = [];
      edges.forEach((e) => {
        const seg = [e.a, e.b];
        if (!e.p2) { coast.push(seg); return; }
        const s1 = w.states[e.p1.state], s2 = w.states[e.p2.state];
        const w1 = U.isWater(e.p1), w2 = U.isWater(e.p2);
        if (w1 && w2) { prov.push(seg); return; }
        if (w1 || w2) { coast.push(seg); return; }
        if (!s1 || !s2) { prov.push(seg); return; }
        if (e.p1.state === e.p2.state) prov.push(seg);
        else if (s1.owner === s2.owner) state.push(seg);
        else country.push(seg);
      });
      this.borders = { prov, state, country, coast };
    }

    computeLabels() {
      const w = this.world, L = { countries: [], states: [] };
      const byC = {};
      for (const sid in w.states) {
        const s = w.states[sid];
        let sx = 0, sy = 0, n = 0, area = 0;
        s.provinces.forEach((pid) => {
          const p = w.provinces[pid]; if (!p) return;
          const c = this.cache(p).c, a = U.area(p.points);
          sx += c[0] * a; sy += c[1] * a; area += a; n++;
        });
        if (!n) continue;
        L.states.push({ text: s.name, x: sx / area, y: sy / area, area, id: sid });
        const o = byC[s.owner] || (byC[s.owner] = { sx: 0, sy: 0, a: 0 });
        o.sx += (sx / area) * area; o.sy += (sy / area) * area; o.a += area;
      }
      for (const t in byC) if (w.countries[t]) L.countries.push({ text: w.countries[t].name.toUpperCase(), x: byC[t].sx / byC[t].a, y: byC[t].sy / byC[t].a, area: byC[t].a });
      this.labels = L;
    }

    _draw() {
      const ctx = this.ctx, w = this.world, z = this.cam.z, dpr = this.dpr || 1;
      if (!this.borders) this.computeBorders();
      if (this.showLabels && !this.labels) this.computeLabels();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = this.seaColor; ctx.fillRect(0, 0, this.cv.width, this.cv.height);
      ctx.setTransform(z * dpr, 0, 0, z * dpr, -this.cam.x * z * dpr, -this.cam.y * z * dpr);
      const vx0 = this.cam.x, vy0 = this.cam.y, vx1 = vx0 + this.w / z, vy1 = vy0 + this.h / z;

      const fillFn = this.hooks.fill || (() => '#555');
      for (const id in w.provinces) {
        const p = w.provinces[id], c = this.cache(p);
        if (c.bb[2] < vx0 || c.bb[0] > vx1 || c.bb[3] < vy0 || c.bb[1] > vy1) continue;
        ctx.fillStyle = U.isWater(p) ? this.waterColor : fillFn(p);
        ctx.fill(c.path);
        if (this.showTerrain && z > 0.5 && p.terrain) { const tx = texture(ctx, p.terrain); if (tx) { ctx.fillStyle = tx; ctx.fill(c.path); } }
        if (this.hooks.afterFill) this.hooks.afterFill(ctx, p, c);
      }
      const line = (segs, color, width) => {
        ctx.strokeStyle = color; ctx.lineWidth = width / z; ctx.beginPath();
        for (const s of segs) { ctx.moveTo(s[0][0], s[0][1]); ctx.lineTo(s[1][0], s[1][1]); }
        ctx.stroke();
      };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const B = this.borders;
      line(B.prov, 'rgba(0,0,0,0.28)', 0.6);
      line(B.state, 'rgba(0,0,0,0.55)', 1.1);
      line(B.country, 'rgba(0,0,0,0.9)', 2.2);
      line(B.coast, 'rgba(0,0,0,0.9)', 1.6);

      this.drawFeatures(ctx, z, vx0, vy0, vx1, vy1);
      if (this.hooks.overlay) this.hooks.overlay(ctx, this);

      if (this.showLabels && this.labels) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        if (z < 1.3) {
          for (const l of this.labels.countries) {
            const size = Math.min(34, Math.max(12, (Math.sqrt(l.area) * z) / 9)) / z;
            ctx.font = `700 ${size}px sans-serif`;
            ctx.lineWidth = 3 / z; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.fillStyle = 'rgba(255,255,255,0.88)';
            ctx.strokeText(l.text, l.x, l.y); ctx.fillText(l.text, l.x, l.y);
          }
        } else {
          for (const l of this.labels.states) {
            if (l.x < vx0 || l.x > vx1 || l.y < vy0 || l.y > vy1) continue;
            ctx.font = `600 ${12 / z}px sans-serif`;
            ctx.lineWidth = 3 / z; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.fillStyle = '#fff';
            ctx.strokeText(l.text, l.x, l.y); ctx.fillText(l.text, l.x, l.y);
          }
        }
      }
      if (this.hooks.top) this.hooks.top(ctx, this);
    }

    // Städte (Punkt + Name) und Häfen (Anker)
    drawFeatures(ctx, z, vx0, vy0, vx1, vy1) {
      const w = this.world;
      for (const id in w.provinces) {
        const p = w.provinces[id];
        if (!p.city && !p.port) continue;
        const c = this.cache(p).c;
        if (c[0] < vx0 || c[0] > vx1 || c[1] < vy0 || c[1] > vy1) continue;
        ctx.save(); ctx.translate(c[0], c[1]); ctx.scale(1 / z, 1 / z);
        if (p.city) {
          const sz = 2.5 + (p.city.size || 1) * 1.5;
          ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.rect(-12 - sz, 12 - sz, sz * 2, sz * 2); ctx.fill(); ctx.stroke();
          if (z > 2.2) { ctx.font = '10px sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.strokeText(p.city.name, -12 - sz - 3, 15); ctx.fillText(p.city.name, -12 - sz - 3, 15); }
        }
        if (p.port) { ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.strokeText('⚓', 12, 12); ctx.fillText('⚓', 12, 12); }
        ctx.restore();
      }
    }

    _bind() {
      const cv = this.cv;
      let pan = null;
      const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      cv.addEventListener('contextmenu', (e) => e.preventDefault());
      cv.addEventListener('wheel', (e) => {
        e.preventDefault();
        const [sx, sy] = pos(e), [wx, wy] = this.toWorld(sx, sy);
        const f = Math.exp(-e.deltaY * 0.0015);
        this.cam.z = Math.max(0.25, Math.min(14, this.cam.z * f));
        this.cam.x = wx - sx / this.cam.z; this.cam.y = wy - sy / this.cam.z;
        this.dirty = true;
      }, { passive: false });
      cv.addEventListener('pointerdown', (e) => {
        const [sx, sy] = pos(e), [wx, wy] = this.toWorld(sx, sy);
        cv.setPointerCapture(e.pointerId);
        if (e.button === 0 && this.hooks.down && this.hooks.down(e, wx, wy) === true) { this.dragging = { custom: true }; return; }
        pan = { sx, sy, cx: this.cam.x, cy: this.cam.y, moved: false, button: e.button };
      });
      cv.addEventListener('pointermove', (e) => {
        const [sx, sy] = pos(e), [wx, wy] = this.toWorld(sx, sy);
        if (this.dragging && this.dragging.custom) { this.hooks.move && this.hooks.move(e, wx, wy); return; }
        if (pan) {
          const dx = sx - pan.sx, dy = sy - pan.sy;
          if (Math.abs(dx) + Math.abs(dy) > 4) pan.moved = true;
          if (pan.moved) { this.cam.x = pan.cx - dx / this.cam.z; this.cam.y = pan.cy - dy / this.cam.z; this.dirty = true; }
        } else if (this.hooks.hover) this.hooks.hover(e, wx, wy);
      });
      cv.addEventListener('pointerup', (e) => {
        const [sx, sy] = pos(e), [wx, wy] = this.toWorld(sx, sy);
        if (this.dragging && this.dragging.custom) { this.dragging = null; this.hooks.up && this.hooks.up(e, wx, wy); return; }
        if (pan) {
          if (!pan.moved) {
            if (pan.button === 0 && this.hooks.click) this.hooks.click(e, wx, wy);
            if (pan.button === 2 && this.hooks.rclick) this.hooks.rclick(e, wx, wy);
          }
          pan = null;
        }
      });
    }
  }
  H.MapView = MapView;
})(window.HOG);
