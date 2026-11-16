/* Hearts of Gold – Spieloberfläche */
window.HOG = window.HOG || {};
(function (H) {
  const D = H.data, U = H.util, h = U.h, $ = U.$;
  const RES = D.RESOURCES;

  class GameUI {
    constructor() {
      this.view = new H.MapView($('#game-canvas'));
      this.mode = 'political';
      this.tab = 'state';
      this.speed = 0;
      this.sel = { prov: null, ids: new Set() };
      this.timer = null; this.lastRender = 0; this.lastLog = null;
      this.keyHandler = (e) => this.onKey(e);
      this.armySel = null; this.armyMode = null; this.attackSel = new Set(); this.drawPts = null; this.drawProvs = null;
      this.bindHooks();
    }

    start(sim, opts) {
      this.sim = sim;
      this.player = sim.g.player;
      this.speed = 0; this.sel = { prov: null, ids: new Set() };
      this.armySel = null; this.armyMode = null; this.attackSel = new Set(); this.drawPts = null; this.drawProvs = null;
      this.lastLog = sim.g.log[0] || null;
      this.running = true;
      this.view.setWorld(sim.world);
      const cap = sim.capitalProv(this.player);
      if (cap) { const c = sim.pc[cap]; this.view.focus(c[0], c[1], 1.6); }
      document.addEventListener('keydown', this.keyHandler);
      this.buildModes();
      this.renderTop(); this.renderSide();
      this.view.redraw();
      this.running = true;
    }
    stop() {
      this.running = false; clearTimeout(this.timer);
      document.removeEventListener('keydown', this.keyHandler);
    }

    // ---------- Karte ----------
    colorFor(p) {
      const sim = this.sim, w = sim.world, st = w.states[p.state];
      const ctrl = sim.controller(p.id);
      switch (this.mode) {
        case 'ideology': { const c = w.countries[ctrl]; return c ? D.IDEOLOGIES[c.ideology].color : '#444'; }
        case 'ethnic': {
          let best = null, bn = -1;
          for (const e in st.pop) if (st.pop[e] > bn) { bn = st.pop[e]; best = e; }
          const eth = w.ethnicities.find((x) => x.id === best); return eth ? eth.color : '#444';
        }
        case 'unrest': { const u = Math.min(100, st.unrest || 0) / 100; return `hsl(${120 - 120 * u},60%,${42 - 8 * u}%)`; }
        case 'gdp': { const per = st.gdp / Math.max(1, st.provinces.length); const v = Math.min(1, per / 300); return `hsl(45,${40 + 30 * v}%,${18 + 45 * v}%)`; }
        default: { const c = w.countries[ctrl]; return c ? c.color : '#444'; }
      }
    }
    bindHooks() {
      const v = this.view;
      v.hooks.fill = (p) => this.colorFor(p);
      v.hooks.afterFill = (ctx, p, c) => {
        if (this.mode !== 'political' || U.isWater(p)) return;
        const sim = this.sim, st = sim.world.states[p.state], ctrl = sim.controller(p.id);
        if (ctrl === st.owner) return;
        const oc = sim.world.countries[st.owner]; if (!oc) return;
        const z = v.cam.z, bb = c.bb;
        ctx.save(); ctx.clip(c.path); ctx.strokeStyle = oc.color; ctx.lineWidth = 2.2 / z; ctx.beginPath();
        const step = 7 / z, hgt = bb[3] - bb[1];
        for (let x = bb[0] - hgt; x < bb[2]; x += step) { ctx.moveTo(x, bb[3]); ctx.lineTo(x + hgt, bb[1]); }
        ctx.stroke(); ctx.restore();
      };
      v.hooks.overlay = (ctx) => this.drawOverlay(ctx);
      v.hooks.click = (e, x, y) => {
        const p = v.hit(x, y);
        if (this.armyMode === 'attack' && this.armySel) {
          if (!p) return;
          const c = this.sim.controller(p.id);
          if (!c || !this.sim.atWar(this.player, c)) { this.toast('Wähle Provinzen eines Landes, mit dem du im Krieg bist.'); return; }
          if (this.attackSel.has(p.id)) this.attackSel.delete(p.id); else this.attackSel.add(p.id);
          this.view.redraw(); this.renderArmyBar(); return;
        }
        this.selectProv(p ? p.id : null, !e.shiftKey);
      };
      // Grenze zeichnen: Front-Modus aktiv, rechte Maustaste gedrückt halten und über die Grenze ziehen
      v.hooks.down = (e, x, y) => {
        if (this.armyMode === 'front' && this.armySel && e.button === 2) {
          this.drawPts = [[x, y]]; this.drawProvs = new Set(); this.touch(x, y); this.view.redraw(); return true;
        }
        return false;
      };
      v.hooks.move = (e, x, y) => {
        if (!this.drawPts) return;
        const l = this.drawPts[this.drawPts.length - 1], d = Math.hypot(x - l[0], y - l[1]), n = Math.max(1, Math.ceil(d / 5));
        for (let i = 1; i <= n; i++) this.touch(l[0] + ((x - l[0]) * i) / n, l[1] + ((y - l[1]) * i) / n);
        this.drawPts.push([x, y]); this.view.redraw();
      };
      v.hooks.up = () => {
        if (!this.drawPts) return;
        const provs = [...this.drawProvs]; this.drawPts = null; this.drawProvs = null;
        const err = this.sim.setFront(this.player, this.armySel, provs);
        if (err) this.toast(err); else { this.toast('Grenze gezeichnet – die Armee verteilt sich gleichmäßig und folgt der Grenze.'); this.armyMode = null; }
        this.view.redraw(); this.renderArmyBar();
      };
      v.hooks.rclick = (e, x, y) => {
        const p = v.hit(x, y); if (!p || !this.sel.ids.size) return;
        this.sim.releaseFromArmies(this.player, [...this.sel.ids]);
        const n = this.sim.orderMove([...this.sel.ids], p.id);
        if (!n) this.toast('Dorthin gibt es keinen Weg (Grenzen geschlossen).');
        v.redraw();
      };
    }
    touch(x, y) {
      const p = this.view.hit(x, y); if (p && !U.isWater(p)) this.drawProvs.add(p.id);
    }
    selectProv(pid, autoUnits) {
      const sim = this.sim;
      this.sel.prov = pid;
      if (autoUnits !== false) {
        this.sel.ids = new Set(pid ? sim.unitsAt(pid).filter((u) => u.owner === this.player).map((u) => u.id) : []);
      }
      this.view.redraw();
      this.renderSide();
    }
    drawOverlay(ctx) {
      const sim = this.sim, v = this.view, z = v.cam.z, w = sim.world;
      // Auswahl
      if (this.sel.prov) {
        const p = w.provinces[this.sel.prov], st = w.states[p.state] || { provinces: [] };
        ctx.lineWidth = 1.6 / z; ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        st.provinces.forEach((pid) => ctx.stroke(v.cache(w.provinces[pid]).path));
        ctx.lineWidth = 2.6 / z; ctx.strokeStyle = '#ffd24a'; ctx.stroke(v.cache(p).path);
      }
      // Armeen (Farben sieht nur der Spieler)
      const armies = sim.g.c[this.player].armies;
      armies.forEach((a) => {
        const selA = a.id === this.armySel;
        const tiles = a.order && a.order.kind === 'attack' ? [] : a.front ? a.front.tiles : [];
        if (tiles.length) {
          ctx.save(); ctx.globalAlpha = selA ? 0.32 : 0.2; ctx.fillStyle = a.color;
          tiles.forEach((pid) => ctx.fill(v.cache(w.provinces[pid]).path));
          ctx.globalAlpha = 1; ctx.strokeStyle = a.color; ctx.lineWidth = (selA ? 3.4 : 2.4) / z;
          tiles.forEach((pid) => ctx.stroke(v.cache(w.provinces[pid]).path)); ctx.restore();
        }
        if (a.order && a.order.kind === 'attack') {
          const us = sim.armyUnits(this.player, a.id); if (!us.length) return;
          let cx = 0, cy = 0; us.forEach((u) => { cx += sim.pc[u.prov][0]; cy += sim.pc[u.prov][1]; }); cx /= us.length; cy /= us.length;
          ctx.save(); ctx.strokeStyle = a.color; ctx.fillStyle = a.color; ctx.lineWidth = 3 / z;
          a.order.targets.forEach((pid) => {
            ctx.globalAlpha = 0.28; ctx.fill(v.cache(w.provinces[pid]).path); ctx.globalAlpha = 1; ctx.stroke(v.cache(w.provinces[pid]).path);
            const t = sim.pc[pid], ang = Math.atan2(t[1] - cy, t[0] - cx), hs = 9 / z;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(t[0], t[1]); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(t[0], t[1]); ctx.lineTo(t[0] - Math.cos(ang - 0.4) * hs, t[1] - Math.sin(ang - 0.4) * hs); ctx.lineTo(t[0] - Math.cos(ang + 0.4) * hs, t[1] - Math.sin(ang + 0.4) * hs); ctx.closePath(); ctx.fill();
          });
          ctx.restore();
        }
      });
      if (this.armyMode === 'attack') {
        ctx.save(); ctx.strokeStyle = '#ff3b30'; ctx.fillStyle = '#ff3b30'; ctx.lineWidth = 3 / z;
        this.attackSel.forEach((pid) => { const c = v.cache(w.provinces[pid]).path; ctx.globalAlpha = 0.35; ctx.fill(c); ctx.globalAlpha = 1; ctx.stroke(c); });
        ctx.restore();
      }
      if (this.drawPts && this.drawPts.length) {
        const a = armies.find((x) => x.id === this.armySel);
        ctx.save(); ctx.strokeStyle = a ? a.color : '#fff'; ctx.lineWidth = 5 / z; ctx.lineCap = 'round'; ctx.beginPath();
        this.drawPts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke(); ctx.restore();
      }
      // Wege
      ctx.setLineDash([5 / z, 4 / z]); ctx.lineWidth = 1.6 / z; ctx.strokeStyle = '#fff';
      sim.g.units.forEach((u) => {
        if (!this.sel.ids.has(u.id) || !u.path.length) return;
        ctx.beginPath(); let c = sim.pc[u.prov]; ctx.moveTo(c[0], c[1]);
        u.path.forEach((pid) => { c = sim.pc[pid]; ctx.lineTo(c[0], c[1]); });
        ctx.stroke();
      });
      ctx.setLineDash([]);
      // Einheiten
      const by = {};
      sim.g.units.forEach((u) => ((by[u.prov] || (by[u.prov] = {}))[u.owner] = (by[u.prov][u.owner] || []).concat(u)));
      for (const pid in by) {
        const c = sim.pc[pid], owners = Object.keys(by[pid]);
        owners.forEach((o, i) => {
          const list = by[pid][o], country = w.countries[o];
          const bw = 42, bh = 16, off = (i - (owners.length - 1) / 2) * (bw + 3);
          const sel = list.some((u) => this.sel.ids.has(u.id));
          let dom = list[0];
          list.forEach((u) => { const a = D.UNITS[u.type], d = D.UNITS[dom.type]; if (a.atk + a.def > d.atk + d.def) dom = u; });
          const embarked = list.every((u) => sim.isEmbarked(u));
          ctx.save(); ctx.translate(c[0], c[1]); ctx.scale(1 / z, 1 / z); ctx.translate(off - bw / 2, -bh / 2 - 3);
          ctx.fillStyle = '#1b2430'; ctx.fillRect(0, 0, bw, bh);
          if (o === this.player) { const au = list.find((u) => u.army), ar = au && armies.find((x) => x.id === au.army); if (ar) { ctx.fillStyle = ar.color; ctx.fillRect(0, -5, bw, 4); } }
          ctx.drawImage(H.flag.sprite(country.flag, 24, 16), 0, 0, 24, bh);
          H.flag.unitIcon(ctx, dom.type, 33, 8, 14, embarked);
          ctx.lineWidth = sel ? 2.5 : 1.2; ctx.strokeStyle = sel ? '#ffd24a' : '#000'; ctx.strokeRect(0, 0, bw, bh);
          const fighting = list.some((u) => sim.g.day - (u.fighting || -9) <= 1);
          ctx.font = '700 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.fillStyle = '#fff';
          ctx.strokeText(list.length, 12, bh / 2 + 0.5); ctx.fillText(list.length, 12, bh / 2 + 0.5);
          if (fighting) { ctx.font = '12px sans-serif'; ctx.fillText('⚔️', bw / 2, -8); }
          ctx.restore();
        });
      }
    }
    flagCache() { }

    buildModes() {
      const box = $('#mapmodes'); box.innerHTML = '';
      const modes = [['political', 'Politisch'], ['ideology', 'Ideologie'], ['ethnic', 'Ethnien'], ['unrest', 'Unruhe'], ['gdp', 'BIP']];
      modes.forEach(([id, name]) => box.appendChild(h('button', { class: this.mode === id ? 'on' : '', onclick: () => { this.mode = id; this.buildModes(); this.view.redraw(); } }, name)));
      box.appendChild(h('button', { onclick: () => { this.view.showLabels = !this.view.showLabels; this.view.redraw(); } }, 'Namen'));
      box.appendChild(h('button', { onclick: () => this.view.fit() }, '⤢'));
    }

    // ---------- Zeit ----------
    setSpeed(s) {
      if (this.sim.g.over) s = 0;
      this.speed = s; clearTimeout(this.timer); this.renderTop();
      if (s > 0) this.loop();
    }
    loop() {
      if (!this.running || !this.speed) return;
      this.timer = setTimeout(() => {
        if (!this.running) return;
        this.sim.tick();
        this.afterTick();
        if (this.speed) this.loop();
      }, D.SPEEDS[this.speed]);
    }
    afterTick() {
      const sim = this.sim, g = sim.g;
      if (sim.bordersChanged) { sim.bordersChanged = false; this.view.borders = null; this.view.labels = null; }
      this.view.redraw();
      this.renderTop();
      // neue Ereignisse
      const fresh = [];
      for (const l of g.log) { if (l === this.lastLog) break; fresh.push(l); }
      if (fresh.length) {
        this.lastLog = g.log[0];
        fresh.reverse().forEach((l) => {
          const mine = l.tags.includes(this.player);
          if (mine || /KRIEG/.test(l.text)) this.toast(l.text);
          if (l.war && l.attacker !== this.player && l.tags.includes(this.player)) { this.setSpeed(0); this.warPopup(l); }
        });
        if (this.tab === 'log') this.renderSide();
      }
      const now = Date.now();
      if (now - this.lastRender > 600) { this.lastRender = now; this.renderSide(); }
      if (g.over) this.gameOver();
    }
    warPopup(l) {
      const sim = this.sim, w = sim.g.wars.slice().reverse().find((x) => x.attackers.includes(l.attacker));
      if (!w) return;
      const mine = w.attackers.includes(this.player) ? w.attackers : w.defenders, other = mine === w.attackers ? w.defenders : w.attackers;
      const list = (arr) => h('div', { class: 'warlist' }, arr.map((t) => h('span', { class: 'chip' }, this.cflag(t, 20, 14), ' ' + this.cname(t))));
      U.modal('⚔️ Krieg!', h('div', null,
        h('p', null, h('b', null, this.cname(l.attacker)), ' hat ', h('b', null, this.cname(w.defenders.includes(this.player) ? this.player : w.defenders[0])), ' den Krieg erklärt!'),
        h('h4', null, 'Deine Seite'), list(mine), h('h4', null, 'Gegner'), list(other)), [{ label: 'Verstanden', cls: 'danger' }]);
    }
    gameOver() {
      this.setSpeed(0);
      const lost = this.sim.g.over === 'lost';
      U.modal(lost ? '☠️ Niederlage' : '🏆 Sieg', lost ? 'Dein Land wurde vollständig besetzt. Du kannst das Spiel über das Menü verlassen oder einen Spielstand laden.' : 'Alle anderen Länder sind verschwunden – du herrschst über die Karte!', [{ label: 'OK' }]);
    }
    onKey(e) {
      if (!this.running || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || !$('#modal').hidden) return;
      if (e.code === 'Space') { e.preventDefault(); this.setSpeed(this.speed ? 0 : (this.lastSpeed || 2)); }
      else if (/^[1-4]$/.test(e.key)) { this.lastSpeed = +e.key; this.setSpeed(+e.key); }
      else if (e.key === 'Escape') { this.armyMode = null; this.attackSel = new Set(); this.drawPts = null; this.selectProv(null); this.renderArmyBar(); }
    }
    toast(text) {
      const box = $('#eventlog'), t = h('div', { class: 'toast' }, text);
      box.appendChild(t);
      while (box.children.length > 5) box.firstChild.remove();
      setTimeout(() => t.remove(), 7000);
    }

    // ---------- Kopfzeile ----------
    renderTop() {
      const sim = this.sim, g = sim.g, tag = this.player, c = sim.country(tag), cs = g.c[tag], st = sim.st[tag] || sim.stats(tag);
      const top = $('#topbar'); top.innerHTML = '';
      const chip = (icon, val, tip, cls) => h('span', { class: 'chip ' + (cls || ''), title: tip }, icon + ' ' + val);
      const net = st.net;
      top.appendChild(h('div', { class: 'tb-country' }, H.flag.img(c.flag, 36, 24), h('b', null, c.name)));
      top.appendChild(h('div', { class: 'tb-chips' },
        chip('💰', Math.round(cs.money), 'BIP-Geld (Einnahmen/Tag: ' + net.toFixed(1) + ')', cs.money < 0 ? 'bad' : ''),
        chip('', (net >= 0 ? '+' : '') + net.toFixed(1), 'Netto pro Tag', net < 0 ? 'bad' : 'good'),
        chip('👥', Math.round(cs.manpower) + ' K', 'Manpower (max. ' + Math.round(st.manCap) + ' K, +' + st.manRegen.toFixed(1) + '/Tag) – ' + st.law.name),
        RES.map((r) => chip(r.icon, st.used[r.id].toFixed(1) + '/' + st.avail[r.id].toFixed(1), r.name + ': verbraucht / verfügbar pro Tag (Produktion ' + st.res[r.id].toFixed(1) + ' + Import ' + st.imports[r.id] + ')', st.demandRes[r.id] > st.avail[r.id] + 0.01 ? 'bad' : '')),
        chip('⚡', Math.round(st.supply) + '/' + Math.round(st.demand), 'Energie: Angebot/Bedarf', st.energyEff < 1 ? 'bad' : ''),
        chip('🏭', st.pp.toFixed(1), 'Rüstungsausstoß (PP/Tag)'),
        chip('🔬', st.rp.toFixed(1), 'Forschungspunkte/Tag'),
        st.upheaval ? chip('🔥', 'Umbruch ' + st.upheaval + ' T', 'Ideologiewechsel: Unruhe, weniger BIP/Rüstung/Forschung', 'bad') : ''));
      const sp = h('div', { class: 'tb-speed' },
        h('span', { class: 'date' }, '📅 ' + sim.dateStr()),
        h('button', { class: this.speed === 0 ? 'on' : '', onclick: () => this.setSpeed(0) }, '⏸'),
        [1, 2, 3, 4].map((s) => h('button', { class: this.speed === s ? 'on' : '', onclick: () => { this.lastSpeed = s; this.setSpeed(s); } }, '▶'.repeat(1) + s)),
        h('button', { onclick: () => H.app.gameMenu() }, '☰ Menü'));
      top.appendChild(sp);
      this.renderWarbar();
      this.renderArmyBar();
    }
    // ---------- Armeeleiste ----------
    selectArmy(id) {
      this.armySel = id; this.armyMode = null; this.attackSel = new Set();
      this.sel.ids = new Set(this.sim.armyUnits(this.player, id).map((u) => u.id));
      this.view.redraw(); this.renderArmyBar(); this.renderSide();
    }
    armyRight(id) {
      const mine = new Set(this.sim.armyUnits(this.player, id).map((u) => u.id));
      const add = [...this.sel.ids].filter((x) => !mine.has(x));
      if (add.length) {
        this.sim.addToArmy(this.player, id, add);
        this.toast(add.length + ' Einheit(en) zur Armee hinzugefügt.');
        this.sim.manageArmy(this.player, this.sim.g.c[this.player].armies.find((a) => a.id === id));
        this.sel.ids = new Set(this.sim.armyUnits(this.player, id).map((u) => u.id));
        this.armySel = id; this.view.redraw(); this.renderArmyBar(); this.renderSide();
      } else this.selectArmy(id);
    }
    renderArmyBar() {
      if (!this.running) return;
      const sim = this.sim, tag = this.player, box = $('#armybar'), c = sim.g.c[tag];
      const sig = c.armies.map((a) => a.id + ':' + sim.armyUnits(tag, a.id).length + ':' + (a.order ? 'o' + a.order.targets.length : a.front ? 'f' + a.front.tiles.length : '-')).join('|') + '#' + this.armySel + this.armyMode + this.attackSel.size;
      if (sig === this._armySig && box.childNodes.length) return;
      this._armySig = sig;
      box.innerHTML = '';
      c.armies.forEach((a, i) => {
        const units = sim.armyUnits(tag, a.id), sel = this.armySel === a.id;
        const comp = {}; units.forEach((u) => (comp[u.type] = (comp[u.type] || 0) + 1));
        const tip = a.name + ' – ' + (units.length ? Object.keys(comp).map((k) => comp[k] + '× ' + D.UNITS[k].name).join(', ') : 'leer') +
          (a.order ? '\nBefehl: Angriff auf ' + a.order.targets.length + ' Provinz(en)' : a.front ? '\nBefehl: Grenze halten (' + a.front.tiles.length + ' Provinzen)' : '') +
          '\nLinksklick: wählen · Rechtsklick: ausgewählte Truppen hinzufügen';
        const btn = h('button', { class: 'army' + (sel ? ' on' : ''), style: { borderColor: a.color }, title: tip, onclick: () => this.selectArmy(a.id), oncontextmenu: (e) => { e.preventDefault(); this.armyRight(a.id); } },
          h('span', { class: 'asw', style: { background: a.color } }, String(i + 1)), h('span', { class: 'acount' }, units.length));
        const wrap = h('div', { class: 'armywrap' + (sel ? ' sel' : '') }, btn);
        if (sel) {
          const tools = h('div', { class: 'armytools' },
            h('button', { class: this.armyMode === 'front' ? 'on' : '', title: 'Grenze zeichnen: Rechte Maustaste gedrückt halten und entlang der Grenze zu einem Land ziehen', onclick: () => { this.armyMode = this.armyMode === 'front' ? null : 'front'; this.attackSel = new Set(); if (this.armyMode) this.toast('Grenze zeichnen: Rechte Maustaste gedrückt halten und über die Grenze ziehen.'); this.view.redraw(); this.renderArmyBar(); } }, '🧭'),
            h('button', { class: this.armyMode === 'attack' ? 'on' : '', title: 'Angriff: Provinzen des Feindes anklicken, dann ✔ drücken', onclick: () => { this.armyMode = this.armyMode === 'attack' ? null : 'attack'; this.attackSel = new Set(); if (this.armyMode) this.toast('Angriff: Feindliche Provinzen anklicken (mehrere möglich), dann ✔ drücken.'); this.view.redraw(); this.renderArmyBar(); } }, '➡️'));
          if (this.armyMode === 'attack') tools.appendChild(h('button', { title: 'Angriff starten', disabled: !this.attackSel.size, onclick: () => { const err = sim.setAttack(tag, a.id, [...this.attackSel]); if (err) this.toast(err); else { this.toast('Angriff befohlen: ' + a.name + ' rückt vor.'); this.armyMode = null; this.attackSel = new Set(); } this.view.redraw(); this.renderArmyBar(); } }, '✔'));
          if (a.front || a.order) tools.appendChild(h('button', { title: 'Befehle der Armee löschen', onclick: () => { sim.clearArmyOrders(tag, a.id); this.view.redraw(); this.renderArmyBar(); } }, '🚫'));
          tools.appendChild(h('button', { title: 'Armee auflösen', onclick: () => { sim.deleteArmy(tag, a.id); this.armySel = null; this.armyMode = null; this.view.redraw(); this.renderArmyBar(); } }, '🗑'));
          wrap.appendChild(tools);
        }
        box.appendChild(wrap);
      });
      box.appendChild(h('button', { class: 'army plus', title: 'Neue Armee erstellen (ausgewählte Truppen werden hinzugefügt)', onclick: () => {
        const a = sim.createArmy(tag); if (!a) { this.toast('Maximal 12 Armeen.'); return; }
        if (this.sel.ids.size) sim.addToArmy(tag, a.id, [...this.sel.ids]);
        this.selectArmy(a.id);
      } }, '＋'));
    }
    renderWarbar() {
      const sim = this.sim, tag = this.player, box = $('#warbar');
      const enemies = sim.enemies(tag);
      box.innerHTML = '';
      if (!enemies.length) { box.hidden = true; return; }
      box.hidden = false;
      const mine = new Set();
      sim.g.wars.forEach((w) => {
        const side = w.attackers.includes(tag) ? w.attackers : w.defenders.includes(tag) ? w.defenders : null;
        if (side) side.forEach((t) => { if (t !== tag && sim.isAlive(t) && sim.allied(tag, t) || (side.includes(t) && t !== tag && sim.isAlive(t))) mine.add(t); });
      });
      const enemySet = new Set(enemies);
      const compact = mine.size + enemySet.size > 8;
      const chip = (t, enemy) => {
        const share = Math.round((enemy ? sim.lostShare(tag, t) : 0) * 100);
        return h('span', { class: 'wchip ' + (enemy ? 'e' : 'a') + (compact ? ' compact' : ''), title: this.cname(t) + (enemy ? ' (Feind) – hält ' + share + ' % deines BIP besetzt' : ' (Verbündeter im Krieg)') + ' – Stärke ' + Math.round(sim.strength(t)), onclick: enemy ? () => this.peaceDialog(t) : null },
          this.cflag(t, 26, 17), h('span', null, this.cname(t)));
      };
      box.appendChild(h('div', { class: 'wside' }, h('b', null, 'Mit dir'), h('span', { class: 'wchip me' + (compact ? ' compact' : '') }, this.cflag(tag, 26, 17), h('span', null, this.cname(tag))), [...mine].map((t) => chip(t, false))));
      box.appendChild(h('div', { class: 'wsep' }, '⚔️'));
      box.appendChild(h('div', { class: 'wside' }, h('b', null, 'Gegen dich'), [...enemySet].map((t) => chip(t, true))));
    }

    // ---------- Seitenleiste ----------
    renderSide() {
      if (!this.running) return;
      const side = $('#side'), tabs = [['state', 'Staat'], ['country', 'Land'], ['prod', 'Produktion'], ['tech', 'Forschung'], ['diplo', 'Diplomatie'], ['log', 'Journal']];
      const keepScroll = side.querySelector('.tabbody') ? side.querySelector('.tabbody').scrollTop : 0;
      side.innerHTML = '';
      side.appendChild(h('div', { class: 'tabs' }, tabs.map(([id, n]) => h('button', { class: this.tab === id ? 'on' : '', onclick: () => { this.tab = id; this.renderSide(); } }, n))));
      const body = h('div', { class: 'tabbody' });
      side.appendChild(body);
      try { this['tab_' + this.tab](body); } catch (e) { body.textContent = 'Fehler: ' + e.message; console.error(e); }
      body.scrollTop = keepScroll;
    }
    again() { this.renderSide(); this.renderTop(); this.view.redraw(); }
    act(err) { if (err) this.toast(err); this.again(); }

    bar(frac, cls) { return h('div', { class: 'bar ' + (cls || '') }, h('i', { style: { width: Math.max(0, Math.min(100, frac * 100)) + '%' } })); }
    cname(t) { return this.sim.world.countries[t] ? this.sim.world.countries[t].name : t; }
    cflag(t, w, hh) { return H.flag.img(this.sim.world.countries[t].flag, w || 24, hh || 16); }
    ethName(id) { const e = this.sim.world.ethnicities.find((x) => x.id === id); return e ? e.name : id; }
    ethColor(id) { const e = this.sim.world.ethnicities.find((x) => x.id === id); return e ? e.color : '#888'; }

    tab_state(body) {
      const sim = this.sim, w = sim.world;
      if (!this.sel.prov) { body.appendChild(h('p', { class: 'hint' }, 'Klicke auf eine Provinz, um ihren Staat zu sehen.\nRechtsklick = ausgewählte Truppen bewegen.\nLeertaste = Pause, 1–4 = Geschwindigkeit.')); return; }
      const p = w.provinces[this.sel.prov];
      if (U.isWater(p)) {
        body.appendChild(h('h3', null, '🌊 ' + p.name), h('div', { class: 'sub' }, 'Wasser – unpassierbar für Landtruppen. Landeinheiten werden in Häfen eingeschifft und fahren als Transportschiffe (ohne Geschütze). Schiffe kämpfen nur hier.'));
        this.unitList(body, p);
        return;
      }
      const s = w.states[p.state], ctrl = sim.stateCtrl(s);
      const mine = ctrl === this.player;
      body.appendChild(h('h3', null, s.name), h('div', { class: 'sub' }, 'Provinz: ' + p.name));
      const T = D.TERRAINS[p.terrain] || D.TERRAINS.plains;
      body.appendChild(h('div', { class: 'row' }, h('span', { class: 'chip' }, '🌍 ' + T.name), h('span', { class: 'sub' }, 'Verteidiger ×' + T.def + ' · Angreifer ×' + T.atk + ' · Tempo ×' + T.move),
        p.city ? h('span', { class: 'chip' }, '🏙 ' + p.city.name + ' (' + (D.CITY_SIZES[p.city.size] || 'Stadt') + ', +' + 10 * (p.city.size || 1) + '% Verteidigung)') : '',
        p.port ? h('span', { class: 'chip' }, '⚓ Hafen') : ''));
      body.appendChild(h('div', { class: 'row' }, 'Besitzer: ', this.cflag(s.owner), ' ', h('b', null, this.cname(s.owner))));
      body.appendChild(h('div', { class: 'row' }, 'Okkupant: ', this.cflag(ctrl), ' ', h('b', null, this.cname(ctrl)), ctrl !== s.owner ? h('span', { class: 'bad' }, '  (besetzt)') : ''));
      const provCtrl = sim.controller(p.id);
      if (provCtrl !== ctrl) body.appendChild(h('div', { class: 'row sub' }, 'Diese Provinz wird gerade von ' + this.cname(provCtrl) + ' gehalten.'));
      body.appendChild(h('div', { class: 'row' }, 'BIP: ', h('b', null, Math.round(s.gdp)), '   Unruhe: ', h('b', { class: s.unrest > 30 ? 'bad' : '' }, Math.round(s.unrest) + '%')));
      body.appendChild(this.bar((s.unrest || 0) / 100, 'unrest'));
      // Bevölkerung
      const tot = sim.popTotal(s);
      body.appendChild(h('h4', null, 'Bevölkerung: ' + U.fmtPop(tot)));
      const ctrlC = w.countries[ctrl];
      Object.keys(s.pop).sort((a, b) => s.pop[b] - s.pop[a]).forEach((e) => {
        const integ = sim.integrated(ctrl, e);
        body.appendChild(h('div', { class: 'pop' },
          h('span', { class: 'swatch', style: { background: this.ethColor(e) } }), h('span', { class: 'pn' }, this.ethName(e)),
          h('span', { class: 'pv' }, U.fmtPop(s.pop[e]) + ' (' + Math.round((s.pop[e] / tot) * 100) + '%)'),
          h('span', { class: integ ? 'good tag' : 'bad tag' }, e === ctrlC.main ? 'Staatsvolk' : integ ? 'integriert' : 'Minderheit')));
      });
      body.appendChild(h('h4', null, 'Ressourcen (pro Tag)'));
      body.appendChild(h('div', { class: 'reslist' }, RES.map((r) => h('span', { class: 'chip' }, r.icon + ' ' + (s.resources[r.id] || 0)))));
      body.appendChild(h('h4', null, 'Gebäude (' + (s.buildings.civ + s.buildings.mil + s.buildings.power) + '/' + s.slots + ' Plätze)'));
      body.appendChild(h('div', { class: 'row' }, Object.keys(D.BUILDINGS).filter((k) => !D.BUILDINGS[k].prov).map((k) => h('span', { class: 'chip' }, D.BUILDINGS[k].icon + ' ' + s.buildings[k] + ' ' + D.BUILDINGS[k].name))));
      if (mine) {
        body.appendChild(h('div', { class: 'row btns' }, Object.keys(D.BUILDINGS).filter((k) => !D.BUILDINGS[k].prov).map((k) => h('button', {
          title: 'Kosten ' + D.BUILDINGS[k].cost + ' BIP-Geld', onclick: () => this.act(sim.queueBuild(this.player, s.id, k)),
        }, '+ ' + D.BUILDINGS[k].name + ' (' + D.BUILDINGS[k].cost + ')'))));
        if (!p.port && sim.coastal(p.id)) body.appendChild(h('div', { class: 'row btns' }, h('button', { onclick: () => this.act(sim.queueBuild(this.player, s.id, 'port', p.id)) }, '⚓ Hafen in dieser Provinz bauen (' + D.BUILDINGS.port.cost + ')')));
      }
      this.unitList(body, p);
    }

    unitList(body, p) {
      const sim = this.sim;
      const units = sim.unitsAt(p.id);
      body.appendChild(h('h4', null, 'Truppen in dieser Provinz (' + units.length + ')'));
      if (units.length) {
        const own = units.filter((u) => u.owner === this.player);
        if (own.length) body.appendChild(h('div', { class: 'row btns' },
          h('button', { onclick: () => { this.sel.ids = new Set(own.map((u) => u.id)); this.again(); } }, 'Alle wählen'),
          h('button', { onclick: () => { this.sel.ids = new Set(); this.again(); } }, 'Keine'),
          h('span', { class: 'sub' }, this.sel.ids.size + ' gewählt · Rechtsklick auf Ziel')));
        units.forEach((u) => {
          const isMine = u.owner === this.player, def = D.UNITS[u.type], mx = sim.maxHp(u), emb = sim.isEmbarked(u);
          body.appendChild(h('label', { class: 'unit' + (isMine ? '' : ' foe') },
            isMine ? h('input', { type: 'checkbox', checked: this.sel.ids.has(u.id), onchange: (e) => { e.target.checked ? this.sel.ids.add(u.id) : this.sel.ids.delete(u.id); this.view.redraw(); } }) : this.cflag(u.owner, 18, 12),
            (emb ? '⛴️ Transport (' + def.name + ')' : def.icon + ' ' + def.name), h('span', { class: 'sub' }, ' ' + Math.round(u.hp) + '/' + Math.round(mx) + (u.path.length ? ' → ' + sim.world.provinces[u.path[u.path.length - 1]].name : '')),
            this.bar(u.hp / mx, 'hp')));
        });
      }
    }

    tab_country(body) {
      const sim = this.sim, tag = this.player, c = sim.country(tag), st = sim.stats(tag), cs = sim.g.c[tag];
      body.appendChild(h('div', { class: 'bigflag' }, H.flag.img(c.flag, 96, 64), h('div', null, h('h3', null, c.name), h('div', { class: 'sub' }, 'Ideologie: ' + D.IDEOLOGIES[c.ideology].name))));
      const sel = h('select', null, Object.keys(D.IDEOLOGIES).map((k) => h('option', { value: k, selected: k === c.ideology }, D.IDEOLOGIES[k].name)));
      body.appendChild(h('div', { class: 'row' }, 'Ideologie ändern: ', sel, h('button', { onclick: () => {
        if (sel.value === c.ideology) return;
        const I = D.IDEOLOGIES[sel.value];
        U.modal('Ideologie wechseln', h('div', null, h('p', null, 'Wechsel zu ', h('b', null, I.name), '?'), h('p', { class: 'sub' }, 'Folgen: 60 Tage Umbruch – Unruhe +25 in allen Staaten, BIP −20 %, Rüstungsausstoß −25 %, Forschung −20 %, Truppen −10 % Lebenspunkte. Neuer Wechsel erst nach 180 Tagen.'),
          h('p', { class: 'sub' }, 'Boni: BIP ×' + I.gdp + ' · Rüstung ×' + I.prod + ' · Forschung ×' + I.research + ' · Manpower ×' + I.manpower)), [{ label: 'Abbrechen' }, { label: 'Umsturz!', cls: 'danger', onclick: () => { this.act(sim.changeIdeology(tag, sel.value)); } }]);
      } }, 'Wechseln')));
      if (st.upheaval) body.appendChild(h('div', { class: 'bad' }, '🔥 Umbruch: noch ' + st.upheaval + ' Tage (Unruhe, weniger BIP/Rüstung/Forschung)'));
      body.appendChild(h('div', { class: 'row' }, 'Staatsvolk: ', h('b', null, this.ethName(c.main)), ' · Integriert: ', (c.integrated || []).map((e) => this.ethName(e)).join(', ') || '–'));
      body.appendChild(h('div', { class: 'grid2' },
        h('div', null, 'Staaten'), h('b', null, st.states), h('div', null, 'Bevölkerung'), h('b', null, U.fmtPop(st.popTotal)),
        h('div', null, 'BIP gesamt'), h('b', null, Math.round(st.gdp)), h('div', null, 'Einnahmen/Tag'), h('b', null, st.income.toFixed(1)),
        h('div', null, 'Unterhalt/Tag'), h('b', null, st.upkeep.toFixed(1)), h('div', null, 'Zivilfabriken'), h('b', null, st.civ),
        h('div', null, 'Rüstungsfabriken'), h('b', null, st.mil), h('div', null, 'Kraftwerke'), h('b', null, st.power),
        h('div', null, 'Energie'), h('b', { class: st.energyEff < 1 ? 'bad' : 'good' }, Math.round(st.supply) + ' / ' + Math.round(st.demand) + ' (' + Math.round(st.energyEff * 100) + '% Effizienz)'),
        h('div', null, 'Einheiten'), h('b', null, st.units)));
      body.appendChild(h('h4', null, 'Landesregeln'));
      Object.keys(D.POLICIES).forEach((id) => {
        const P = D.POLICIES[id];
        body.appendChild(h('label', { class: 'policy' }, h('input', { type: 'checkbox', checked: !!c.policies[id], onchange: () => { sim.togglePolicy(tag, id); this.again(); } }),
          h('div', null, h('b', null, P.name), h('div', { class: 'sub' }, P.desc))));
      });
      body.appendChild(h('h4', null, 'Mannstärke-Regeln'));
      body.appendChild(h('div', { class: 'sub' }, 'Rekrutierbar: ' + Math.round(st.manCap) + ' K (Pool max.) · Nachschub ' + st.manRegen.toFixed(1) + ' K/Tag · Nicht integrierte Minderheiten zählen nur zu ' + Math.round(D.MINORITY_MANPOWER * 100) + ' %.'));
      Object.keys(D.MANPOWER_LAWS).forEach((id) => {
        const L = D.MANPOWER_LAWS[id];
        body.appendChild(h('label', { class: 'policy' }, h('input', { type: 'radio', name: 'law', checked: c.law === id, onchange: () => this.act(sim.setLaw(tag, id)) }),
          h('div', null, h('b', null, L.name), h('div', { class: 'sub' }, L.desc))));
      });
      body.appendChild(h('h4', null, 'Alle Staaten'));
      sim.ownedStates(tag).forEach((s) => body.appendChild(h('div', { class: 'row link', onclick: () => { this.selectProv(s.provinces[0], false); this.tab = 'state'; this.renderSide(); const pc = sim.pc[s.provinces[0]]; this.view.focus(pc[0], pc[1]); } },
        s.name + (sim.stateCtrl(s) !== tag ? ' (besetzt von ' + this.cname(sim.stateCtrl(s)) + ')' : ''))));
    }

    tab_prod(body) {
      const sim = this.sim, tag = this.player, c = sim.g.c[tag], st = sim.stats(tag);
      const free = st.mil - c.lines.reduce((a, l) => a + l.fac, 0);
      body.appendChild(h('div', { class: 'row' }, h('b', null, '⚒️ Rüstungsfabriken: ' + st.mil), h('span', { class: free > 0 ? 'good' : 'sub' }, '  frei: ' + Math.max(0, free)), h('span', { class: 'sub' }, '  ·  Leistung/Fabrik: ' + st.ppPerFac.toFixed(2) + ' PP/Tag')));
      // Ressourcen (Summe aller Ressourcen wird verbraucht)
      body.appendChild(h('h4', null, 'Ressourcen pro Tag (Produktion + Import)'));
      RES.forEach((r) => {
        const dem = st.demandRes[r.id], av = st.avail[r.id], short = dem > av + 0.01;
        body.appendChild(h('div', { class: 'resrow' }, h('span', { class: 'rn' }, r.icon + ' ' + r.name),
          h('span', { class: short ? 'bad' : '' }, 'Bedarf ' + dem.toFixed(1) + ' / ' + av.toFixed(1) + ' (' + st.res[r.id].toFixed(1) + ' eigen)'),
          h('span', { class: 'imp' }, h('button', { onclick: () => { sim.setImport(tag, r.id, (c.imports[r.id] || 0) - 1); this.again(); } }, '−'), ' Import ' + (c.imports[r.id] || 0) + ' ', h('button', { onclick: () => { sim.setImport(tag, r.id, (c.imports[r.id] || 0) + 1); this.again(); } }, '+'))));
      });
      body.appendChild(h('div', { class: 'sub' }, 'Import kostet ' + D.TRADE_PRICE + ' Geld pro Einheit und Tag (' + st.importCost.toFixed(1) + '/Tag). Fehlt eine Ressource, sinkt der Ausstoß der betroffenen Linien.'));

      body.appendChild(h('h4', null, 'Equipment-Hersteller'));
      Object.keys(D.EQUIPMENT).forEach((k) => {
        const E = D.EQUIPMENT[k], ok = sim.equipUnlocked(tag, k), exists = c.lines.some((l) => l.eq === k);
        if (exists) return;
        const cost = Object.keys(E.res).map((r) => E.res[r] + ' ' + RES.find((x) => x.id === r).icon).join(' ');
        body.appendChild(h('div', { class: 'unitrow' + (ok ? '' : ' locked') }, h('div', null, h('b', null, E.icon + ' ' + E.name), h('div', { class: 'sub' }, E.pp + ' PP/Stück · je Fabrik/Tag: ' + cost + (ok ? '' : ' · 🔒 ' + sim.techById[D.UNITS[E.unit].tech].name))),
          h('button', { disabled: !ok, onclick: () => this.act(sim.addLine(tag, k, Math.max(1, Math.min(5, free)))) }, '+ Linie')));
      });
      c.lines.forEach((l) => {
        const E = D.EQUIPMENT[l.eq], info = st.lines[l.id] || { rate: 0, ratio: 1 };
        body.appendChild(h('div', { class: 'item' }, h('div', { class: 'itemhead' }, h('b', null, E.icon + ' ' + E.name), h('span', { class: 'sub' }, ' Lager: ' + Math.floor(c.equip[l.eq] || 0) + ' · gebaut: ' + l.made), h('button', { class: 'x', onclick: () => { sim.removeLine(tag, l.id); this.again(); } }, '✕')),
          h('div', { class: 'row' }, h('button', { onclick: () => { sim.setFactories(tag, l.id, l.fac - 5); this.again(); } }, '−5'), h('button', { onclick: () => { sim.setFactories(tag, l.id, l.fac - 1); this.again(); } }, '−'),
            h('b', null, ' ' + l.fac + ' Fabriken '), h('button', { onclick: () => { sim.setFactories(tag, l.id, l.fac + 1); this.again(); } }, '+'), h('button', { onclick: () => { sim.setFactories(tag, l.id, l.fac + 5); this.again(); } }, '+5'),
            h('button', { title: 'Alle freien Fabriken', onclick: () => { sim.setFactories(tag, l.id, l.fac + Math.max(0, sim.freeFactories(tag))); this.again(); } }, 'max')),
          this.bar(l.progress / E.pp), h('div', { class: 'sub' }, (info.rate / E.pp).toFixed(2) + ' Stück/Tag' + (info.ratio < 0.999 ? '' : ''), info.ratio < 0.999 ? h('span', { class: 'bad' }, ' ⚠ Ressourcenmangel (' + Math.round(info.ratio * 100) + ' %)') : '')));
      });

      body.appendChild(h('h4', null, 'Truppen ausbilden (feste Typen) – Manpower: ' + Math.round(c.manpower) + ' K'));
      Object.keys(D.UNITS).forEach((k) => {
        const u = D.UNITS[k], ok = sim.unitUnlocked(tag, k), E = D.EQUIPMENT[u.eq], have = Math.floor(c.equip[u.eq] || 0);
        body.appendChild(h('div', { class: 'unitrow' + (ok ? '' : ' locked') },
          h('div', null, h('b', null, u.icon + ' ' + u.name), h('div', { class: 'sub' }, `Angriff ${u.atk} · Verteidigung ${u.def} · HP ${u.hp} · Tempo ${u.speed}${u.naval ? ' · Schiff' : u.air ? ' · Luft' : ''}`),
            h('div', { class: 'sub' }, `Braucht ${u.n}× ${E.name} (Lager ${have}) · ${u.manpower} K Manpower · ${u.train} Tage` + (ok ? '' : ' · 🔒 ' + sim.techById[u.tech].name))),
          h('button', { disabled: !ok, onclick: () => this.act(sim.recruit(tag, k)) }, 'Ausbilden')));
      });
      if (c.train.length) {
        body.appendChild(h('h4', null, 'In Ausbildung'));
        const cnt = {}; c.train.forEach((t) => { (cnt[t.type] = cnt[t.type] || []).push(t.left); });
        Object.keys(cnt).forEach((k) => body.appendChild(h('div', { class: 'row' }, D.UNITS[k].icon + ' ' + D.UNITS[k].name + ' × ' + cnt[k].length, h('span', { class: 'sub' }, ' (nächste in ' + Math.min(...cnt[k]) + ' Tagen)'))));
      }
      body.appendChild(h('h4', null, 'Bauprojekte (Zivilfabriken: ' + st.civ + ', Bauleistung ' + st.civWork.toFixed(1) + '/Tag)'));
      if (!c.build.length) body.appendChild(h('p', { class: 'hint' }, 'Wähle einen Staat auf der Karte und baue dort Fabriken, Kraftwerke oder Häfen.'));
      c.build.forEach((b) => {
        const B = D.BUILDINGS[b.type], s = sim.world.states[b.state];
        body.appendChild(h('div', { class: 'item' }, h('div', { class: 'itemhead' }, h('b', null, B.icon + ' ' + B.name), h('span', { class: 'sub' }, ' in ' + (b.prov ? sim.world.provinces[b.prov].name : s.name)), h('button', { class: 'x', onclick: () => { sim.cancelBuild(tag, b.id); this.again(); } }, '✕')), this.bar(b.work / B.work)));
      });
      const counts = {}; sim.g.units.forEach((u) => { if (u.owner === tag) counts[u.type] = (counts[u.type] || 0) + 1; });
      body.appendChild(h('h4', null, 'Armee'));
      body.appendChild(h('div', { class: 'row' }, Object.keys(D.UNITS).map((k) => h('span', { class: 'chip' }, D.UNITS[k].icon + ' ' + (counts[k] || 0)))));
      body.appendChild(h('h4', null, 'Ausrüstungslager'));
      body.appendChild(h('div', { class: 'row' }, Object.keys(D.EQUIPMENT).filter((k) => sim.equipUnlocked(tag, k)).map((k) => h('span', { class: 'chip' }, D.EQUIPMENT[k].icon + ' ' + D.EQUIPMENT[k].name + ': ' + Math.floor(c.equip[k] || 0)))));
    }

    tab_tech(body) {
      const sim = this.sim, tag = this.player, r = sim.g.c[tag].research, st = sim.stats(tag);
      body.appendChild(h('div', { class: 'row' }, h('b', null, '🔬 ' + st.rp.toFixed(1) + ' Punkte/Tag'), '   Plätze: ' + r.cur.length + '/2'));
      const branches = [...new Set(D.TECHS.map((t) => t.branch))];
      branches.forEach((br) => {
        body.appendChild(h('h4', null, br));
        D.TECHS.filter((t) => t.branch === br).forEach((t) => {
          const done = r.done.includes(t.id), cur = r.cur.includes(t.id), av = sim.techAvailable(tag, t);
          const eff = this.techText(t);
          body.appendChild(h('div', { class: 'tech ' + (done ? 'done' : cur ? 'cur' : av ? 'av' : 'locked'), onclick: () => { if (done || !av) return; this.act(cur ? sim.stopResearch(tag, t.id) : sim.startResearch(tag, t.id)); } },
            h('div', { class: 'itemhead' }, h('b', null, (done ? '✔ ' : '') + t.name), h('span', { class: 'sub' }, done ? '' : t.cost + ' Pkt.')),
            h('div', { class: 'sub' }, eff + (t.req.length && !done ? ' · benötigt: ' + t.req.map((q) => sim.techById[q].name).join(', ') : '')),
            cur ? this.bar((r.prog[t.id] || 0) / t.cost) : ''));
        });
      });
    }
    techText(t) {
      const e = t.effects, out = [];
      if (e.unlock) out.push('Schaltet ' + D.UNITS[e.unlock].name + ' frei');
      ['atk', 'def', 'hp', 'speed'].forEach((k) => { if (e[k]) { const names = Object.keys(e[k]); const same = names.length > 1 && names.every((n) => e[k][n] === e[k][names[0]]); if (same) out.push('+' + Math.round(e[k][names[0]] * 100) + '% ' + { atk: 'Angriff', def: 'Verteidigung', hp: 'HP', speed: 'Tempo' }[k] + ' ' + (names[0] === 'destroyer' ? 'Schiffe' : 'mehrerer Einheiten')); else names.forEach((u) => out.push('+' + Math.round(e[k][u] * 100) + '% ' + { atk: 'Angriff', def: 'Verteidigung', hp: 'HP', speed: 'Tempo' }[k] + ' ' + (u === 'all' ? 'alle Einheiten' : D.UNITS[u].name))); } });
      const names = { gdp: 'BIP', civ: 'Bautempo', mil: 'Rüstungsausstoß', research: 'Forschung', energy: 'Energie', resource: 'Ressourcen', manpower: 'Manpower' };
      for (const k in names) if (e[k]) out.push((e[k] > 0 ? '+' : '') + Math.round(e[k] * 100) + '% ' + names[k]);
      if (e.stab) out.push('−' + e.stab + ' Unruhe in allen Staaten');
      if (e.assim) out.push('+' + Math.round(e.assim * 100) + '% Assimilation von Minderheiten');
      return out.join(', ');
    }

    tab_diplo(body) {
      const sim = this.sim, tag = this.player, w = sim.world;
      const my = sim.strength(tag);
      Object.keys(w.countries).filter((t) => t !== tag).forEach((t) => {
        if (!sim.isAlive(t)) return;
        const c = w.countries[t], war = sim.atWar(tag, t), ally = sim.allied(tag, t);
        const al = w.alliances.find((a) => a.members.includes(t));
        body.appendChild(h('div', { class: 'item ' + (war ? 'war' : ally ? 'ally' : '') },
          h('div', { class: 'itemhead' }, this.cflag(t, 30, 20), h('b', null, ' ' + c.name), h('span', { class: 'sub' }, ' ' + D.IDEOLOGIES[c.ideology].name)),
          h('div', { class: 'sub' }, (al ? 'Bündnis: ' + al.name + ' · ' : '') + 'Stärke: ' + Math.round(sim.strength(t)) + ' (du: ' + Math.round(my) + ') · Staaten: ' + sim.ctrlStates(t).length),
          h('div', { class: 'row btns' },
            war ? h('button', { class: 'primary', onclick: () => this.peaceDialog(t) }, '🕊️ Frieden verhandeln') : '',
            war ? h('button', { onclick: () => this.surrender(t) }, 'Kapitulieren') : '',
            !war && !ally ? h('button', { class: 'danger', onclick: () => U.modal('Krieg erklären', 'Willst du ' + c.name + ' (und dessen Bündnispartner) wirklich den Krieg erklären?', [{ label: 'Abbrechen' }, { label: '⚔️ Krieg!', cls: 'danger', onclick: () => { this.act(sim.declareWar(tag, t)); } }]) }, '⚔️ Krieg erklären') : '',
            !war && !ally ? h('button', { onclick: () => { const r = sim.requestAlliance(tag, t); this.toast(r.msg); this.again(); } }, '🤝 Bündnis anfragen') : '',
            ally && sim.alliance(tag) ? h('button', { title: 'Bündnis verlassen', onclick: () => { sim.leaveAlliance(tag); this.again(); } }, 'Bündnis verlassen') : '',
            ally ? h('span', { class: 'good' }, 'Verbündet') : '', war ? h('span', { class: 'bad' }, 'Im Krieg seit ' + sim.dateStr(sim.warStart(tag, t))) : '')));
      });
    }

    peaceDialog(t) {
      const sim = this.sim, tag = this.player, info = sim.conferenceInfo(t);
      if (!info.participants.includes(tag)) { this.toast('Du führst keinen Krieg gegen ' + this.cname(t) + '.'); return; }
      const sels = {};
      const relevant = [...new Set([tag, ...info.states.map((x) => x.occupier)])];
      const rows = info.states.map((s) => {
        const sel = h('select', null,
          h('option', { value: '' }, '↩ Zurück an ' + this.cname(t) + ' (Besitzer)'),
          relevant.map((x) => h('option', { value: x, selected: x === s.occupier }, '→ ' + this.cname(x) + (x === tag ? ' (du)' : ''))));
        sels[s.id] = sel;
        return h('div', { class: 'row' }, h('span', { style: { flex: 1 } }, s.name + ' (BIP ' + Math.round(s.gdp) + ', besetzt von ' + this.cname(s.occupier) + ')'), sel);
      });
      const body = h('div', null,
        h('p', null, 'Friedenskonferenz mit ', h('b', null, this.cname(t)), '. Beteiligt: ', info.participants.length > 8 ? info.participants.length + ' Länder' : info.participants.map((x) => this.cname(x)).join(', '), '. Alle Beteiligten schließen gleichzeitig Frieden; nicht zugeteilte besetzte Staaten gehen an den Besitzer zurück.'),
        rows.length ? h('div', null, h('b', null, 'Wer bekommt welchen besetzten Staat?'), rows) : h('p', { class: 'sub' }, 'Niemand hält Staaten von ' + this.cname(t) + ' besetzt – nur Waffenstillstand möglich.'));
      U.modal('🕊️ Friedenskonferenz', body, [{ label: 'Abbrechen' }, {
        label: 'Vorschlagen', cls: 'primary', onclick: () => {
          const assign = {}; for (const id in sels) assign[id] = sels[id].value || null;
          const r = sim.evalConference(t, assign, tag);
          this.toast(r.msg);
          if (!r.ok) return false;
          sim.applyConference(t, assign); this.view.invalidate(); this.again();
        },
      }]);
    }
    surrender(t) {
      const sim = this.sim, tag = this.player;
      U.modal('Kapitulieren', 'Frieden zu den Bedingungen von ' + this.cname(t) + ': Besetzte Staaten werden annektiert. Fortfahren?', [{ label: 'Abbrechen' }, {
        label: 'Kapitulieren', cls: 'danger', onclick: () => { sim.makePeace(t, tag, sim.occupiedBy(tag, t).map((s) => s.id)); this.view.invalidate(); this.again(); },
      }]);
    }

    tab_log(body) {
      this.sim.g.log.slice(0, 80).forEach((l) => body.appendChild(h('div', { class: 'logrow' + (l.tags.includes(this.player) ? ' mine' : '') }, h('span', { class: 'sub' }, this.sim.dateStr(l.day) + '  '), l.text)));
    }
  }
  H.GameUI = GameUI;
})(window.HOG);
