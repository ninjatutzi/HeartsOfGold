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
      this.bindHooks();
    }

    start(sim, opts) {
      this.sim = sim;
      this.player = sim.g.player;
      this.speed = 0; this.sel = { prov: null, ids: new Set() };
      this.lastLog = sim.g.log[0] || null;
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
        if (this.mode !== 'political') return;
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
        this.selectProv(p ? p.id : null, !e.shiftKey);
      };
      v.hooks.rclick = (e, x, y) => {
        const p = v.hit(x, y); if (!p || !this.sel.ids.size) return;
        const n = this.sim.orderMove([...this.sel.ids], p.id);
        if (!n) this.toast('Dorthin gibt es keinen Weg (Grenzen geschlossen).');
        v.redraw();
      };
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
        const p = w.provinces[this.sel.prov], st = w.states[p.state];
        ctx.lineWidth = 1.6 / z; ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        st.provinces.forEach((pid) => ctx.stroke(v.cache(w.provinces[pid]).path));
        ctx.lineWidth = 2.6 / z; ctx.strokeStyle = '#ffd24a'; ctx.stroke(v.cache(p).path);
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
          const bw = 26, bh = 16, off = (i - (owners.length - 1) / 2) * (bw + 3);
          const sel = list.some((u) => this.sel.ids.has(u.id));
          ctx.save(); ctx.translate(c[0], c[1]); ctx.scale(1 / z, 1 / z); ctx.translate(off - bw / 2, -bh / 2);
          const art = H.flag.sprite(country.flag, 26, 16);
          ctx.drawImage(art, 0, 0, bw, bh);
          ctx.lineWidth = sel ? 2.5 : 1.2; ctx.strokeStyle = sel ? '#ffd24a' : '#000'; ctx.strokeRect(0, 0, bw, bh);
          const fighting = list.some((u) => sim.g.day - (u.fighting || -9) <= 1);
          ctx.font = '700 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.fillStyle = '#fff';
          ctx.strokeText(list.length, bw / 2, bh / 2 + 0.5); ctx.fillText(list.length, bw / 2, bh / 2 + 0.5);
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
          if (l.war && l.attacker !== this.player && l.tags.includes(this.player)) this.setSpeed(0);
        });
        if (this.tab === 'log') this.renderSide();
      }
      const now = Date.now();
      if (now - this.lastRender > 600) { this.lastRender = now; this.renderSide(); }
      if (g.over) this.gameOver();
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
      else if (e.key === 'Escape') this.selectProv(null);
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
        chip('👥', Math.round(cs.manpower) + ' K', 'Manpower (+' + st.manRegen.toFixed(1) + '/Tag)'),
        RES.map((r) => chip(r.icon, Math.floor(cs.stock[r.id]) + ' (+' + st.res[r.id].toFixed(1) + ')', r.name + ': Lager (Produktion/Tag)')),
        chip('⚡', Math.round(st.supply) + '/' + st.demand, 'Energie: Angebot/Bedarf', st.energyEff < 1 ? 'bad' : ''),
        chip('🏭', st.pp.toFixed(1), 'Rüstungsausstoß (PP/Tag)'),
        chip('🔬', st.rp.toFixed(1), 'Forschungspunkte/Tag')));
      const sp = h('div', { class: 'tb-speed' },
        h('span', { class: 'date' }, '📅 ' + sim.dateStr()),
        h('button', { class: this.speed === 0 ? 'on' : '', onclick: () => this.setSpeed(0) }, '⏸'),
        [1, 2, 3, 4].map((s) => h('button', { class: this.speed === s ? 'on' : '', onclick: () => { this.lastSpeed = s; this.setSpeed(s); } }, '▶'.repeat(1) + s)),
        h('button', { onclick: () => H.app.gameMenu() }, '☰ Menü'));
      top.appendChild(sp);
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
      const p = w.provinces[this.sel.prov], s = w.states[p.state], ctrl = sim.stateCtrl(s);
      const mine = ctrl === this.player;
      body.appendChild(h('h3', null, s.name), h('div', { class: 'sub' }, 'Provinz: ' + p.name));
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
      body.appendChild(h('div', { class: 'row' }, Object.keys(D.BUILDINGS).map((k) => h('span', { class: 'chip' }, D.BUILDINGS[k].icon + ' ' + s.buildings[k] + ' ' + D.BUILDINGS[k].name))));
      if (mine) {
        body.appendChild(h('div', { class: 'row btns' }, Object.keys(D.BUILDINGS).map((k) => h('button', {
          title: 'Kosten ' + D.BUILDINGS[k].cost + ' BIP-Geld', onclick: () => this.act(sim.queueBuild(this.player, s.id, k)),
        }, '+ ' + D.BUILDINGS[k].name + ' (' + D.BUILDINGS[k].cost + ')'))));
      }
      // Truppen
      const units = sim.unitsAt(p.id);
      body.appendChild(h('h4', null, 'Truppen in dieser Provinz (' + units.length + ')'));
      if (units.length) {
        const own = units.filter((u) => u.owner === this.player);
        if (own.length) body.appendChild(h('div', { class: 'row btns' },
          h('button', { onclick: () => { this.sel.ids = new Set(own.map((u) => u.id)); this.again(); } }, 'Alle wählen'),
          h('button', { onclick: () => { this.sel.ids = new Set(); this.again(); } }, 'Keine'),
          h('span', { class: 'sub' }, this.sel.ids.size + ' gewählt · Rechtsklick auf Ziel')));
        units.forEach((u) => {
          const isMine = u.owner === this.player, def = D.UNITS[u.type], mx = sim.maxHp(u);
          body.appendChild(h('label', { class: 'unit' + (isMine ? '' : ' foe') },
            isMine ? h('input', { type: 'checkbox', checked: this.sel.ids.has(u.id), onchange: (e) => { e.target.checked ? this.sel.ids.add(u.id) : this.sel.ids.delete(u.id); this.view.redraw(); } }) : this.cflag(u.owner, 18, 12),
            def.icon + ' ' + def.name, h('span', { class: 'sub' }, ' ' + Math.round(u.hp) + '/' + Math.round(mx) + (u.path.length ? ' → ' + sim.world.provinces[u.path[u.path.length - 1]].name : '')),
            this.bar(u.hp / mx, 'hp')));
        });
      }
    }

    tab_country(body) {
      const sim = this.sim, tag = this.player, c = sim.country(tag), st = sim.stats(tag), cs = sim.g.c[tag];
      body.appendChild(h('div', { class: 'bigflag' }, H.flag.img(c.flag, 96, 64), h('div', null, h('h3', null, c.name), h('div', { class: 'sub' }, 'Ideologie: ' + D.IDEOLOGIES[c.ideology].name))));
      body.appendChild(h('div', { class: 'row' }, 'Staatsvolk: ', h('b', null, this.ethName(c.main)), ' · Integriert: ', (c.integrated || []).map((e) => this.ethName(e)).join(', ') || '–'));
      body.appendChild(h('div', { class: 'grid2' },
        h('div', null, 'Staaten'), h('b', null, st.states), h('div', null, 'Bevölkerung'), h('b', null, U.fmtPop(st.popTotal)),
        h('div', null, 'BIP gesamt'), h('b', null, Math.round(st.gdp)), h('div', null, 'Einnahmen/Tag'), h('b', null, st.income.toFixed(1)),
        h('div', null, 'Unterhalt/Tag'), h('b', null, st.upkeep.toFixed(1)), h('div', null, 'Zivilfabriken'), h('b', null, st.civ),
        h('div', null, 'Rüstungsfabriken'), h('b', null, st.mil), h('div', null, 'Kraftwerke'), h('b', null, st.power),
        h('div', null, 'Energie'), h('b', { class: st.energyEff < 1 ? 'bad' : 'good' }, Math.round(st.supply) + ' / ' + st.demand + ' (' + Math.round(st.energyEff * 100) + '% Effizienz)'),
        h('div', null, 'Einheiten'), h('b', null, st.units)));
      body.appendChild(h('h4', null, 'Landesregeln'));
      Object.keys(D.POLICIES).forEach((id) => {
        const P = D.POLICIES[id];
        body.appendChild(h('label', { class: 'policy' }, h('input', { type: 'checkbox', checked: !!c.policies[id], onchange: () => { sim.togglePolicy(tag, id); this.again(); } }),
          h('div', null, h('b', null, P.name), h('div', { class: 'sub' }, P.desc))));
      });
      body.appendChild(h('h4', null, 'Handel (Zukauf für ' + D.TRADE_PRICE + ' Geld pro Einheit)'));
      RES.forEach((r) => body.appendChild(h('div', { class: 'row' }, h('span', { class: 'chip' }, r.icon + ' ' + r.name + ': ' + Math.floor(cs.stock[r.id])),
        h('button', { onclick: () => this.act(sim.buyResource(tag, r.id, 20)) }, '+20 (' + 20 * D.TRADE_PRICE + ')'),
        h('button', { onclick: () => this.act(sim.buyResource(tag, r.id, 100)) }, '+100 (' + 100 * D.TRADE_PRICE + ')'))));
      body.appendChild(h('h4', null, 'Alle Staaten'));
      sim.ownedStates(tag).forEach((s) => body.appendChild(h('div', { class: 'row link', onclick: () => { this.selectProv(s.provinces[0], false); this.tab = 'state'; this.renderSide(); const pc = sim.pc[s.provinces[0]]; this.view.focus(pc[0], pc[1]); } },
        s.name + (sim.stateCtrl(s) !== tag ? ' (besetzt von ' + this.cname(sim.stateCtrl(s)) + ')' : ''))));
    }

    tab_prod(body) {
      const sim = this.sim, tag = this.player, c = sim.g.c[tag], st = sim.stats(tag);
      body.appendChild(h('div', { class: 'row' }, h('b', null, 'Rüstungsausstoß: ' + st.pp.toFixed(1) + ' PP/Tag'), '   Manpower: ' + Math.round(c.manpower) + ' K'));
      body.appendChild(h('h4', null, 'Truppen produzieren (feste Typen)'));
      Object.keys(D.UNITS).forEach((k) => {
        const u = D.UNITS[k], ok = sim.mods[tag].unlocked[k];
        const cost = Object.keys(u.res).map((r) => u.res[r] + ' ' + RES.find((x) => x.id === r).icon).join(' ');
        body.appendChild(h('div', { class: 'unitrow' + (ok ? '' : ' locked') },
          h('div', null, h('b', null, u.icon + ' ' + u.name), h('div', { class: 'sub' }, `Angriff ${u.atk} · Verteidigung ${u.def} · HP ${u.hp} · Tempo ${u.speed}`), h('div', { class: 'sub' }, `${u.pp} PP · ${u.manpower} K Manpower · ${cost}` + (ok ? '' : ' · 🔒 Forschung: ' + sim.techById[u.tech].name))),
          h('button', { disabled: !ok, onclick: () => this.act(sim.addProduction(tag, k)) }, '+ Linie')));
      });
      body.appendChild(h('h4', null, 'Produktionslinien'));
      if (!c.prod.length) body.appendChild(h('p', { class: 'hint' }, 'Keine Linien. Ohne Linien liegen Rüstungsfabriken brach.'));
      c.prod.forEach((l) => {
        const u = D.UNITS[l.type];
        body.appendChild(h('div', { class: 'item' }, h('div', { class: 'itemhead' }, h('b', null, u.icon + ' ' + u.name), h('span', { class: 'sub' }, ' gebaut: ' + l.made), h('button', { class: 'x', onclick: () => { sim.removeProduction(tag, l.id); this.again(); } }, '✕')),
          this.bar(l.progress / u.pp), l.stalled ? h('div', { class: 'bad sub' }, '⚠ ' + l.stalled) : ''));
      });
      body.appendChild(h('h4', null, 'Bauprojekte (Zivilfabriken: ' + st.civ + ', Bauleistung ' + st.civWork.toFixed(1) + '/Tag)'));
      if (!c.build.length) body.appendChild(h('p', { class: 'hint' }, 'Wähle einen Staat auf der Karte und baue dort Fabriken oder Kraftwerke.'));
      c.build.forEach((b) => {
        const B = D.BUILDINGS[b.type], s = sim.world.states[b.state];
        body.appendChild(h('div', { class: 'item' }, h('div', { class: 'itemhead' }, h('b', null, B.icon + ' ' + B.name), h('span', { class: 'sub' }, ' in ' + s.name), h('button', { class: 'x', onclick: () => { sim.cancelBuild(tag, b.id); this.again(); } }, '✕')), this.bar(b.work / B.work)));
      });
      const counts = {}; sim.g.units.forEach((u) => { if (u.owner === tag) counts[u.type] = (counts[u.type] || 0) + 1; });
      body.appendChild(h('h4', null, 'Armee'));
      body.appendChild(h('div', { class: 'row' }, Object.keys(D.UNITS).map((k) => h('span', { class: 'chip' }, D.UNITS[k].icon + ' ' + (counts[k] || 0)))));
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
      ['atk', 'def', 'hp', 'speed'].forEach((k) => { if (e[k]) for (const u in e[k]) out.push('+' + Math.round(e[k][u] * 100) + '% ' + { atk: 'Angriff', def: 'Verteidigung', hp: 'HP', speed: 'Tempo' }[k] + ' ' + D.UNITS[u].name); });
      const names = { gdp: 'BIP', civ: 'Bautempo', mil: 'Rüstungsausstoß', research: 'Forschung', energy: 'Energie', resource: 'Ressourcen', manpower: 'Manpower' };
      for (const k in names) if (e[k]) out.push('+' + Math.round(e[k] * 100) + '% ' + names[k]);
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
            ally ? h('span', { class: 'good' }, 'Verbündet') : '', war ? h('span', { class: 'bad' }, 'Im Krieg seit ' + sim.dateStr(sim.warStart(tag, t))) : '')));
      });
    }

    peaceDialog(t) {
      const sim = this.sim, tag = this.player, occ = sim.occupiedBy(t, tag);
      const checks = occ.map((s) => ({ s, cb: h('input', { type: 'checkbox', checked: true }) }));
      const body = h('div', null,
        h('p', null, 'Friedensverhandlungen mit ', h('b', null, this.cname(t)), '. Besetzte Staaten, die du nicht annektierst, gehen zurück an ihren Besitzer.'),
        occ.length ? h('div', null, h('b', null, 'Von dir besetzte Staaten annektieren:'), checks.map((c) => h('label', { class: 'row' }, c.cb, ' ' + c.s.name + ' (BIP ' + Math.round(c.s.gdp) + ')'))) : h('p', { class: 'sub' }, 'Du hast keinen Staat dieses Landes besetzt – nur Waffenstillstand möglich.'));
      U.modal('🕊️ Frieden', body, [{ label: 'Abbrechen' }, {
        label: 'Vorschlagen', cls: 'primary', onclick: () => {
          const annex = checks.filter((c) => c.cb.checked).map((c) => c.s.id);
          const r = sim.evalPeace(tag, t, annex);
          if (r.ok) { sim.makePeace(tag, t, annex); this.toast(this.cname(t) + ': ' + r.msg); this.view.invalidate(); this.again(); }
          else { this.toast(this.cname(t) + ': ' + r.msg); return false; }
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
