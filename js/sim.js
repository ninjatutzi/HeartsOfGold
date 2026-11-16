/* Hearts of Gold – Spielsimulation (ein Tick = ein Tag) */
window.HOG = window.HOG || {};
(function (H) {
  const D = H.data, U = H.util;
  const RES = D.RESOURCES.map((r) => r.id);

  class Sim {
    constructor(world, g) {
      this.world = world;
      this.g = g;
      this.rnd = U.rng((g.seed || 1) + g.day * 7919);
      for (const id in world.provinces) { const p = world.provinces[id]; p.terrain = p.terrain || 'plains'; }
      for (const t in world.countries) { const c = world.countries[t]; c.law = c.law || 'limited'; c.policies = c.policies || {}; }
      for (const t in g.c) g.c[t].armies = g.c[t].armies || [];
      this.buildIndex();
      this.techById = {};
      D.TECHS.forEach((t) => (this.techById[t.id] = t));
      this.mods = {}; this.st = {};
      this.recalcAllMods();
      this.refresh();
    }

    // ---------- Aufbau ----------
    static newGame(world, player, opts) {
      world = U.clone(world);
      const g = {
        version: 2, seed: Math.floor(Math.random() * 1e9), day: 0, player, wars: [], c: {}, units: [], nextId: 1, log: [],
        opts: Object.assign({ aggression: 1 }, opts || {}), over: null, dead: {},
      };
      const sim = new Sim(world, g);
      for (const tag in world.countries) {
        g.c[tag] = { money: 300, manpower: 0, equip: { rifles: 30, guns: 8 }, imports: {}, research: { done: [], cur: [], prog: {} }, lines: [], train: [], build: [], armies: [], lawDay: -999 };
        if (world.startTechs) { g.c[tag].research.done = world.startTechs.slice(); sim.recalcMods(tag); }
        const st = sim.stats(tag);
        g.c[tag].manpower = Math.round(st.manCap * 0.6);
        const provs = [];
        sim.ctrlStates(tag).forEach((s) => s.provinces.forEach((p) => provs.push(p)));
        if (!provs.length) continue;
        const nInf = Math.max(2, Math.round(st.mil * 0.8)), nArt = Math.round(st.mil / 5);
        for (let i = 0; i < nInf; i++) sim.spawn(tag, 'infantry', provs[Math.floor(sim.rnd() * provs.length)]);
        for (let i = 0; i < nArt; i++) sim.spawn(tag, 'artillery', provs[Math.floor(sim.rnd() * provs.length)]);
      }
      sim.refresh();
      sim.logMsg('Das Spiel beginnt. Du führst ' + world.countries[player].name + '.', [player]);
      return sim;
    }
    static fromSave(save) { return new Sim(save.world, save.g); }
    toSave() { return JSON.parse(U.toJSON({ version: 2, world: this.world, g: this.g })); }

    buildIndex() {
      const w = this.world;
      this.adj = U.adjacency(w.provinces, 2.5);
      (w.links || []).forEach(([a, b]) => { if (this.adj[a] && this.adj[b]) { this.adj[a].add(b); this.adj[b].add(a); } });
      this.pc = {};
      for (const id in w.provinces) this.pc[id] = U.centroid(w.provinces[id].points);
    }

    // ---------- Abfragen ----------
    country(tag) { return this.world.countries[tag]; }
    isAlive(tag) { return !this.g.dead[tag]; }
    isWater(pid) { return U.isWater(this.world.provinces[pid]); }
    terrain(pid) { return D.TERRAINS[this.world.provinces[pid].terrain] || D.TERRAINS.plains; }
    controller(pid) {
      const p = this.world.provinces[pid];
      if (!p || U.isWater(p)) return null;
      return p.occupier || this.world.states[p.state].owner;
    }
    stateCtrl(s) { return s.occupier || s.owner; }
    ctrlStates(tag) { return this._cs[tag] || []; }
    ownedStates(tag) { return Object.values(this.world.states).filter((s) => s.owner === tag); }
    refresh() {
      this._cs = {};
      for (const id in this.world.states) {
        const s = this.world.states[id], t = this.stateCtrl(s);
        (this._cs[t] || (this._cs[t] = [])).push(s);
      }
    }
    allied(a, b) { return a === b || this.world.alliances.some((al) => al.members.includes(a) && al.members.includes(b)); }
    atWar(a, b) {
      if (a === b || !a || !b) return false;
      return this.g.wars.some((w) => ((w.attackers.includes(a) && w.defenders.includes(b)) || (w.attackers.includes(b) && w.defenders.includes(a))) &&
        !w.truces.some((t) => (t[0] === a && t[1] === b) || (t[0] === b && t[1] === a)));
    }
    enemies(tag) { return Object.keys(this.world.countries).filter((o) => this.isAlive(o) && this.atWar(tag, o)); }
    warStart(a, b) {
      let d = this.g.day;
      this.g.wars.forEach((w) => {
        if (((w.attackers.includes(a) && w.defenders.includes(b)) || (w.attackers.includes(b) && w.defenders.includes(a)))) d = Math.min(d, w.start);
      });
      return d;
    }
    canEnter(tag, pid) {
      const c = this.controller(pid);
      if (c === null) return true; // Wasser
      return c === tag || this.allied(tag, c) || this.atWar(tag, c);
    }
    kindOf(u) { const d = D.UNITS[u.type]; return d.naval ? 'naval' : d.air ? 'air' : 'land'; }
    // darf eine Einheit der Art `kind` von Provinz `from` nach `to`?
    canStep(tag, kind, from, to) {
      const P = this.world.provinces, wf = U.isWater(P[from]), wt = U.isWater(P[to]);
      if (kind === 'air') return wt || this.canEnter(tag, to);
      if (kind === 'naval') return wf && wt;
      if (wt) {
        if (wf) return true; // Transport auf See
        const c = this.controller(from);
        return !!P[from].port && (c === tag || this.allied(tag, c)); // Einschiffen nur im eigenen Hafen
      }
      return this.canEnter(tag, to); // Landbewegung oder Anlanden
    }
    isEmbarked(u) { const k = this.kindOf(u); return k === 'land' && this.isWater(u.prov); }
    capitalProv(tag) {
      const c = this.country(tag), s = c.capital && this.world.states[c.capital];
      if (s && this.stateCtrl(s) === tag && s.provinces.length) return s.provinces[0];
      const l = this.ctrlStates(tag);
      return l.length ? l[0].provinces[0] : null;
    }
    // Wasserprovinz neben einem Hafen des Landes (Schiffswerft)
    shipyardWater(tag) {
      for (const s of this.ctrlStates(tag)) for (const pid of s.provinces) {
        const p = this.world.provinces[pid];
        if (!p.port || this.controller(pid) !== tag) continue;
        for (const n of this.adj[pid]) if (this.isWater(n)) return n;
      }
      return null;
    }
    portAvailable(tag) { return !!this.shipyardWater(tag); }
    coastal(pid) { for (const n of this.adj[pid]) if (this.isWater(n)) return true; return false; }
    unitsAt(pid) { return this.g.units.filter((u) => u.prov === pid); }
    stat(u, key) {
      if (key === 'atk' && this.isEmbarked(u)) return 0;
      if (key === 'def' && this.isEmbarked(u)) return 1;
      if (key === 'speed' && this.isEmbarked(u)) return D.TRANSPORT_SPEED;
      if (key === 'hp' && this.isEmbarked(u)) return D.UNITS[u.type].hp;
      const m = this.mods[u.owner];
      return D.UNITS[u.type][key] * (1 + ((m && m[key] && ((m[key][u.type] || 0) + (m[key].all || 0))) || 0));
    }
    maxHp(u) { const h = this.mods[u.owner].hp; return D.UNITS[u.type].hp * (1 + (h[u.type] || 0) + (h.all || 0)); }
    integrated(tag, eth) { const c = this.country(tag); return c.main === eth || (c.integrated || []).includes(eth); }
    popTotal(s) { let t = 0; for (const k in s.pop) t += s.pop[k]; return t; }
    unitUnlocked(tag, type) { return !!this.mods[tag].unlocked[type]; }
    equipUnlocked(tag, eq) { return this.unitUnlocked(tag, D.EQUIPMENT[eq].unit); }

    // ---------- Technik-Modifikatoren ----------
    recalcAllMods() { for (const tag in this.world.countries) this.recalcMods(tag); }
    recalcMods(tag) {
      const m = { atk: {}, def: {}, hp: {}, speed: {}, gdp: 0, civ: 0, mil: 0, research: 0, energy: 0, resource: 0, manpower: 0, stab: 0, assim: 0, unlocked: {} };
      for (const k in D.UNITS) if (!D.UNITS[k].tech) m.unlocked[k] = true;
      const rs = this.g.c[tag] && this.g.c[tag].research;
      if (rs) rs.done.forEach((id) => {
        const t = this.techById[id]; if (!t) return;
        const e = t.effects;
        if (e.unlock) m.unlocked[e.unlock] = true;
        ['atk', 'def', 'hp', 'speed'].forEach((k) => { if (e[k]) for (const u in e[k]) m[k][u] = (m[k][u] || 0) + e[k][u]; });
        ['gdp', 'civ', 'mil', 'research', 'energy', 'resource', 'manpower', 'stab', 'assim'].forEach((k) => { if (e[k]) m[k] += e[k]; });
      });
      this.mods[tag] = m;
    }
    policyMod(tag, key, def) {
      const c = this.country(tag); let v = def;
      for (const id in c.policies || {}) if (c.policies[id] && D.POLICIES[id] && D.POLICIES[id].effects[key] !== undefined) v *= D.POLICIES[id].effects[key];
      return v;
    }
    stateEff(s) { return Math.max(0.25, 1 - (s.unrest || 0) / 140); }

    // ---------- Statistik / Wirtschaft ----------
    stats(tag) {
      const c = this.country(tag), ideo = D.IDEOLOGIES[c.ideology] || D.IDEOLOGIES.democratic;
      if (!this.mods[tag]) this.recalcMods(tag);
      const m = this.mods[tag], law = D.MANPOWER_LAWS[c.law] || D.MANPOWER_LAWS.limited, gc = this.g.c[tag];
      const states = this.ctrlStates(tag);
      const s = { states: states.length, gdp: 0, civ: 0, mil: 0, power: 0, supply: 0, demand: 0, popTotal: 0, popEff: 0, res: {}, units: 0, upkeep: 0, law };
      RES.forEach((r) => (s.res[r] = 0));
      const resW = {}; RES.forEach((r) => (resW[r] = 0));
      let gdpEff = 0, civW = 0, milW = 0;
      states.forEach((st) => {
        s.gdp += st.gdp; s.civ += st.buildings.civ; s.mil += st.buildings.mil; s.power += st.buildings.power;
        const tot = this.popTotal(st); s.popTotal += tot;
        for (const e in st.pop) s.popEff += st.pop[e] * (this.integrated(tag, e) ? 1 : D.MINORITY_MANPOWER);
      });
      s.supply = s.power * D.POWER_OUTPUT * (1 + m.energy);
      s.demand = (s.civ + s.mil) * D.POWER_USE;
      s.energyEff = s.demand ? Math.max(0.3, Math.min(1, s.supply / s.demand)) : 1;
      states.forEach((st) => {
        const occ = st.owner === tag ? 1 : 0.5, e = this.stateEff(st) * s.energyEff * occ;
        gdpEff += st.gdp * 0.004 * e; civW += st.buildings.civ * e; milW += st.buildings.mil * e;
        RES.forEach((r) => (resW[r] += (st.resources[r] || 0) * this.stateEff(st) * occ));
      });
      s.units = 0; s.upkeep = 0;
      this.g.units.forEach((u) => { if (u.owner === tag) { s.units++; s.upkeep += D.UNITS[u.type].upkeep; } });
      s.civWork = civW * (1 + m.civ);
      s.pp = milW * D.PP_SCALE * ideo.prod * this.policyMod(tag, 'prod', 1) * (1 + m.mil);
      s.ppPerFac = s.mil ? s.pp / s.mil : 0;
      RES.forEach((r) => (s.res[r] = resW[r] * (1 + m.resource)));
      s.rp = D.RESEARCH_SCALE * (1 + s.gdp / 600) * ideo.research * this.policyMod(tag, 'research', 1) * (1 + m.research);
      s.manCap = s.popEff * law.pct * (1 + m.manpower) * ideo.manpower;
      s.manRegen = s.manCap * 0.006;
      // Ressourcen wie in HOI4: Summe aller Ressourcen = Angebot pro Tag (+ Importe), Fabriken verbrauchen davon
      s.imports = {}; s.importCost = 0; s.avail = {}; s.used = {}; s.lines = {}; s.facAssigned = 0;
      RES.forEach((r) => { const imp = (gc && gc.imports[r]) || 0; s.imports[r] = imp; s.importCost += imp * D.TRADE_PRICE; s.avail[r] = s.res[r] + imp; s.used[r] = 0; });
      const lines = gc ? gc.lines : [];
      let total = 0; lines.forEach((l) => (total += l.fac));
      s.facAssigned = Math.min(total, s.mil);
      const scale = total > s.mil && total > 0 ? s.mil / total : 1;
      const demand = {}; RES.forEach((r) => (demand[r] = 0));
      lines.forEach((l) => { const E = D.EQUIPMENT[l.eq]; for (const r in E.res) demand[r] += l.fac * scale * E.res[r]; });
      const ratio = {}; RES.forEach((r) => (ratio[r] = demand[r] > s.avail[r] ? s.avail[r] / demand[r] : 1));
      s.demandRes = demand; s.ratio = ratio;
      lines.forEach((l) => {
        const E = D.EQUIPMENT[l.eq]; let lr = 1;
        for (const r in E.res) lr = Math.min(lr, ratio[r]);
        const fe = l.fac * scale;
        s.lines[l.id] = { rate: fe * s.ppPerFac * lr, ratio: lr, fac: fe };
        for (const r in E.res) s.used[r] += fe * E.res[r] * lr;
      });
      const up = gc && gc.upheaval && this.g.day < gc.upheaval.until ? gc.upheaval : null;
      s.upheaval = up ? up.until - this.g.day : 0;
      if (up) { s.pp *= 0.75; s.rp *= 0.8; }
      s.income = gdpEff * ideo.gdp * this.policyMod(tag, 'gdp', 1) * (1 + m.gdp) * law.gdp * (up ? 0.8 : 1);
      s.net = s.income - s.upkeep - s.importCost;
      this.st[tag] = s;
      return s;
    }

    // ---------- Einheiten ----------
    spawn(tag, type, pid) {
      const u = { id: this.g.nextId++, owner: tag, type, hp: 0, prov: pid, path: [], prog: 0 };
      u.hp = this.maxHp(u);
      this.g.units.push(u);
      return u;
    }
    findPath(tag, from, to, kind) {
      kind = kind || 'land';
      if (from === to) return [];
      const dist = { [from]: 0 }, prev = {}, done = new Set();
      const heap = [[0, from]];
      const push = (it) => { heap.push(it); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
      while (heap.length) {
        const [cd, cur] = pop();
        if (done.has(cur)) continue;
        done.add(cur);
        if (cur === to) break;
        for (const n of this.adj[cur]) {
          if (done.has(n) || !this.canStep(tag, kind, cur, n)) continue;
          const a = this.pc[cur], b = this.pc[n];
          const nd = cd + Math.hypot(a[0] - b[0], a[1] - b[1]) / (this.terrain(n).move || 1);
          if (dist[n] === undefined || nd < dist[n]) { dist[n] = nd; prev[n] = cur; push([nd, n]); }
        }
      }
      if (dist[to] === undefined || !done.has(to)) return null;
      const path = []; let c = to;
      while (c !== from) { path.unshift(c); c = prev[c]; }
      return path;
    }
    orderMove(unitIds, pid) {
      const cache = {}; let ok = 0;
      unitIds.forEach((id) => {
        const u = this.g.units.find((x) => x.id === id); if (!u) return;
        const kind = this.kindOf(u), k = u.owner + u.prov + kind;
        const path = cache[k] !== undefined ? cache[k] : (cache[k] = this.findPath(u.owner, u.prov, pid, kind));
        if (path) { u.path = path.slice(); u.prog = 0; ok++; }
      });
      return ok;
    }

    // ---------- Bauen / Produktion / Forschung (API für UI + KI) ----------
    queueBuild(tag, stateId, type, provId) {
      const s = this.world.states[stateId], B = D.BUILDINGS[type], c = this.g.c[tag];
      if (!s || !B) return 'Ungültig';
      if (this.stateCtrl(s) !== tag) return 'Dieser Staat wird nicht von dir kontrolliert.';
      if (B.prov) {
        const p = this.world.provinces[provId];
        if (!p || p.state !== stateId) return 'Keine Provinz gewählt.';
        if (this.controller(provId) !== tag) return 'Diese Provinz wird nicht von dir kontrolliert.';
        if (p.port) return 'Hier gibt es schon einen Hafen.';
        if (!this.coastal(provId)) return 'Ein Hafen braucht eine Provinz, die an Wasser grenzt.';
        if (c.build.some((b) => b.prov === provId && b.type === type)) return 'Wird schon gebaut.';
      } else {
        const used = s.buildings.civ + s.buildings.mil + s.buildings.power + c.build.filter((b) => b.state === stateId && !D.BUILDINGS[b.type].prov).length;
        if (used >= s.slots) return 'Keine freien Bauplätze in ' + s.name + '.';
      }
      if (c.money < B.cost) return 'Nicht genug BIP-Geld (' + B.cost + ' nötig).';
      if (c.build.length >= 12) return 'Bauwarteschlange voll.';
      c.money -= B.cost;
      c.build.push({ id: this.g.nextId++, state: stateId, prov: provId || null, type, work: 0 });
      return null;
    }
    cancelBuild(tag, id) {
      const c = this.g.c[tag], i = c.build.findIndex((b) => b.id === id);
      if (i >= 0) { c.money += D.BUILDINGS[c.build[i].type].cost * 0.5; c.build.splice(i, 1); }
    }
    // Produktionslinien (Equipment-Hersteller)
    addLine(tag, eq, fac) {
      const c = this.g.c[tag];
      if (!D.EQUIPMENT[eq] || !this.equipUnlocked(tag, eq)) return 'Noch nicht erforscht.';
      let l = c.lines.find((x) => x.eq === eq);
      if (l) return 'Es gibt schon eine Linie für ' + D.EQUIPMENT[eq].name + '.';
      if (c.lines.length >= 10) return 'Maximal 10 Linien.';
      c.lines.push({ id: this.g.nextId++, eq, fac: 0, progress: 0, made: 0 });
      return this.setFactories(tag, c.lines[c.lines.length - 1].id, fac === undefined ? 1 : fac) && null;
    }
    freeFactories(tag) { const c = this.g.c[tag]; return this.stats(tag).mil - c.lines.reduce((a, l) => a + l.fac, 0); }
    setFactories(tag, lineId, n) {
      const c = this.g.c[tag], l = c.lines.find((x) => x.id === lineId); if (!l) return 'Linie nicht gefunden.';
      const mil = this.stats(tag).mil, other = c.lines.reduce((a, x) => a + (x === l ? 0 : x.fac), 0);
      l.fac = Math.max(0, Math.min(n, mil - other));
      return null;
    }
    removeLine(tag, id) { const c = this.g.c[tag]; c.lines = c.lines.filter((p) => p.id !== id); }
    setImport(tag, res, amount) { const c = this.g.c[tag]; c.imports[res] = Math.max(0, Math.min(30, amount)); }
    // Einheit ausbilden: verbraucht Ausrüstung + Manpower, dauert train Tage
    recruit(tag, type) {
      const c = this.g.c[tag], d = D.UNITS[type];
      if (!d || !this.unitUnlocked(tag, type)) return 'Noch nicht erforscht.';
      if (c.equip[d.eq] === undefined) c.equip[d.eq] = 0;
      if (c.equip[d.eq] < d.n) return 'Zu wenig Ausrüstung (' + D.EQUIPMENT[d.eq].name + ': ' + Math.floor(c.equip[d.eq]) + '/' + d.n + ').';
      if (c.manpower < d.manpower) return 'Zu wenig Manpower.';
      if (d.naval && !this.portAvailable(tag)) return 'Schiffe brauchen einen Hafen.';
      if (c.train.length >= 30) return 'Ausbildungswarteschlange voll.';
      c.equip[d.eq] -= d.n; c.manpower -= d.manpower;
      c.train.push({ id: this.g.nextId++, type, left: Math.round(d.train * D.TRAIN_SCALE) });
      return null;
    }
    techAvailable(tag, t) {
      const r = this.g.c[tag].research;
      return !r.done.includes(t.id) && t.req.every((q) => r.done.includes(q));
    }
    startResearch(tag, id) {
      const r = this.g.c[tag].research, t = this.techById[id];
      if (!t || !this.techAvailable(tag, t)) return 'Nicht verfügbar.';
      if (r.cur.includes(id)) return null;
      if (r.cur.length >= 2) return 'Alle Forschungsplätze belegt.';
      r.cur.push(id); return null;
    }
    stopResearch(tag, id) { const r = this.g.c[tag].research; r.cur = r.cur.filter((x) => x !== id); }
    togglePolicy(tag, id) { const c = this.country(tag); c.policies[id] = !c.policies[id]; this.logMsg(c.name + ': ' + D.POLICIES[id].name + (c.policies[id] ? ' aktiviert.' : ' beendet.'), [tag]); }
    // Ideologiewechsel: 60 Tage Umbruch (Unruhe +25, BIP −20 %, Rüstung −25 %, Forschung −20 %), Truppen −10 % Lebenspunkte
    changeIdeology(tag, id) {
      const c = this.country(tag), gc = this.g.c[tag];
      if (!D.IDEOLOGIES[id] || c.ideology === id) return null;
      if (gc.ideoDay !== undefined && this.g.day - gc.ideoDay < 180) return 'Die Ideologie kann nur alle 180 Tage gewechselt werden (noch ' + (180 - (this.g.day - gc.ideoDay)) + ' Tage).';
      const old = c.ideology; c.ideology = id; gc.ideoDay = this.g.day; gc.upheaval = { start: this.g.day, until: this.g.day + 60 };
      this.g.units.forEach((u) => { if (u.owner === tag) u.hp *= 0.9; });
      this.logMsg('🔥 ' + c.name + ' wechselt die Ideologie: ' + D.IDEOLOGIES[old].name + ' → ' + D.IDEOLOGIES[id].name + '. Das Land ist im Umbruch!', [tag]);
      return null;
    }
    setLaw(tag, id) {
      const c = this.country(tag), gc = this.g.c[tag];
      if (!D.MANPOWER_LAWS[id] || c.law === id) return null;
      if (this.g.day - gc.lawDay < 30) return 'Mannstärke-Regeln können nur alle 30 Tage geändert werden.';
      c.law = id; gc.lawDay = this.g.day;
      this.logMsg(c.name + ': Mannstärke-Regel "' + D.MANPOWER_LAWS[id].name + '".', [tag]);
      return null;
    }

    logMsg(text, tags, extra) {
      this.g.log.unshift(Object.assign({ day: this.g.day, text, tags: tags || [] }, extra || {}));
      if (this.g.log.length > 300) this.g.log.length = 300;
    }

    // ---------- Diplomatie ----------
    declareWar(a, b) {
      if (a === b || this.atWar(a, b) || this.allied(a, b) || !this.isAlive(a) || !this.isAlive(b)) return 'Nicht möglich.';
      const alOf = (t) => { const r = new Set([t]); this.world.alliances.forEach((al) => { if (al.members.includes(t)) al.members.forEach((m) => r.add(m)); }); return r; };
      const att = alOf(a), def = alOf(b);
      def.forEach((d) => att.delete(d));
      att.forEach((d) => def.delete(d));
      att.add(a); def.add(b); def.delete(a); att.delete(b);
      const A = [...att].filter((t) => this.isAlive(t)), Dd = [...def].filter((t) => this.isAlive(t));
      this.g.wars.push({ id: this.g.nextId++, attackers: A, defenders: Dd, truces: [], start: this.g.day });
      const n = (l) => l.map((t) => this.country(t).name).join(', ');
      this.logMsg('⚔️ KRIEG: ' + this.country(a).name + ' erklärt ' + this.country(b).name + ' den Krieg! (' + n(A) + ' gegen ' + n(Dd) + ')', [...A, ...Dd], { war: true, attacker: a });
      return null;
    }
    lostShare(victim, occupier) {
      let tot = 0, lost = 0;
      this.ownedStates(victim).forEach((s) => { tot += s.gdp; if (s.occupier === occupier) lost += s.gdp; });
      return tot ? lost / tot : 0;
    }
    occupiedBy(victim, occupier) { return this.ownedStates(victim).filter((s) => s.occupier === occupier && s.occupier !== s.owner); }
    evalPeace(proposer, target, annex) {
      const lost = this.lostShare(target, proposer), back = this.lostShare(proposer, target);
      const days = this.g.day - this.warStart(proposer, target);
      if (annex.length) {
        if (lost >= 0.2) return { ok: true, msg: 'Wir sehen uns geschlagen.' };
        return { ok: false, msg: 'Wir sind nicht besiegt – niemals! (Es müssen mind. 20 % unseres BIP besetzt sein.)' };
      }
      if (lost >= 0.1 || (days >= 40 && lost + 0.05 >= back)) return { ok: true, msg: 'Wir akzeptieren den Waffenstillstand.' };
      return { ok: false, msg: 'Wir haben die Oberhand – kein Frieden.' };
    }
    makePeace(a, b, annexIds) {
      annexIds = annexIds || [];
      annexIds.forEach((id) => {
        const s = this.world.states[id];
        if (s && s.occupier === a && s.owner === b) {
          s.owner = a; s.occupier = a;
          s.provinces.forEach((pid) => (this.world.provinces[pid].occupier = null));
          this.logMsg(this.country(a).name + ' annektiert ' + s.name + ' von ' + this.country(b).name + '.', [a, b]);
        }
      });
      this.g.wars.forEach((w) => {
        const sides = (w.attackers.includes(a) && w.defenders.includes(b)) || (w.attackers.includes(b) && w.defenders.includes(a));
        if (sides) w.truces.push([a, b]);
      });
      this.cleanWars();
      this.logMsg('🕊️ Frieden zwischen ' + this.country(a).name + ' und ' + this.country(b).name + (annexIds.length ? ' (mit Annexion).' : '.'), [a, b]);
      this.afterPeace();
    }
    cleanWars() {
      this.g.wars = this.g.wars.filter((w) => {
        for (const x of w.attackers) for (const y of w.defenders) {
          if (!w.truces.some((t) => (t[0] === x && t[1] === y) || (t[0] === y && t[1] === x)) && this.isAlive(x) && this.isAlive(y)) return true;
        }
        return false;
      });
    }
    afterPeace() {
      for (const id in this.world.states) {
        const s = this.world.states[id];
        if (s.occupier !== s.owner && !this.atWar(s.occupier, s.owner)) s.occupier = s.owner;
        s.provinces.forEach((pid) => {
          const p = this.world.provinces[pid];
          if (p.occupier && !this.atWar(p.occupier, s.owner)) p.occupier = null;
          if (p.occupier === s.owner) p.occupier = null;
        });
        this.updateStateOcc(s, true);
      }
      this.refresh();
      this.g.units.forEach((u) => {
        const kind = this.kindOf(u);
        if (kind === 'land' && !this.isWater(u.prov) || kind === 'air' && !this.isWater(u.prov)) {
          const c = this.controller(u.prov);
          if (!(c === u.owner || this.allied(u.owner, c) || this.atWar(u.owner, c))) {
            const home = this.capitalProv(u.owner);
            if (home) { u.prov = home; u.path = []; u.prog = 0; }
          }
        }
        if (u.path.length && !this.canStep(u.owner, kind, u.prov, u.path[0])) u.path = [];
      });
      this.bordersChanged = true;
    }
    updateStateOcc(s, silent) {
      const cnt = {};
      s.provinces.forEach((pid) => { const c = this.controller(pid); cnt[c] = (cnt[c] || 0) + 1; });
      let best = s.owner, bn = cnt[s.owner] || 0;
      for (const t in cnt) if (cnt[t] > bn && cnt[t] * 2 > s.provinces.length) { best = t; bn = cnt[t]; }
      if (best !== s.occupier) {
        s.occupier = best;
        if (!silent) {
          this.logMsg(s.owner === best ? '🏳️ ' + this.country(best).name + ' befreit ' + s.name + '.' : '🚩 ' + this.country(best).name + ' besetzt ' + s.name + ' (' + this.country(s.owner).name + ').', [best, s.owner]);
        }
        this.refresh();
      }
    }
    strength(tag) {
      let v = 0;
      this.g.units.forEach((u) => { if (u.owner === tag) v += (D.UNITS[u.type].atk + D.UNITS[u.type].def) * (u.hp / this.maxHp(u)); });
      return v + (this.st[tag] ? this.st[tag].pp * 15 : 0);
    }

    // ---------- Armeen (Fronten & Angriffe) ----------
    createArmy(tag) {
      const c = this.g.c[tag]; if (c.armies.length >= 12) return null;
      c.armyCount = (c.armyCount || 0) + 1;
      const a = { id: this.g.nextId++, name: 'Armee ' + c.armyCount, color: D.ARMY_COLORS[(c.armyCount - 1) % D.ARMY_COLORS.length], front: null, order: null };
      c.armies.push(a); return a;
    }
    deleteArmy(tag, id) {
      const c = this.g.c[tag];
      this.g.units.forEach((u) => { if (u.owner === tag && u.army === id) u.army = null; });
      c.armies = c.armies.filter((a) => a.id !== id);
    }
    armyUnits(tag, id) { return this.g.units.filter((u) => u.owner === tag && u.army === id); }
    addToArmy(tag, id, unitIds) {
      const set = new Set(unitIds);
      this.g.units.forEach((u) => { if (u.owner === tag && set.has(u.id)) { u.army = id; u.dest = null; } });
    }
    // Spieler bewegt Einheiten von Hand: komplette Armee -> Befehle gelöscht, Teilmenge -> verlässt die Armee
    releaseFromArmies(tag, unitIds) {
      const set = new Set(unitIds);
      this.g.c[tag].armies.forEach((a) => {
        const mine = this.armyUnits(tag, a.id);
        const moved = mine.filter((u) => set.has(u.id));
        if (!moved.length) return;
        if (moved.length === mine.length) { a.front = null; a.order = null; mine.forEach((u) => (u.dest = null)); }
        else moved.forEach((u) => { u.army = null; u.dest = null; });
      });
    }
    setFront(tag, id, touched) {
      const a = this.g.c[tag].armies.find((x) => x.id === id); if (!a) return 'Armee nicht gefunden.';
      const own = [], foes = new Set();
      const foreign = (c) => c && c !== tag && !this.allied(tag, c);
      touched.forEach((pid) => { if (this.isWater(pid)) return; const c = this.controller(pid); if (c === tag) own.push(pid); else if (foreign(c)) foes.add(c); });
      own.forEach((pid) => this.adj[pid].forEach((n) => { if (this.isWater(n)) return; const c = this.controller(n); if (foreign(c)) foes.add(c); }));
      let base = own;
      if (!base.length) { const b = new Set(); touched.forEach((pid) => this.adj[pid] && this.adj[pid].forEach((n) => { if (!this.isWater(n) && this.controller(n) === tag) b.add(n); })); base = [...b]; }
      if (!foes.size || !base.length) return 'Keine Grenze gefunden – zeichne entlang der Grenze zu einem Nachbarland.';
      a.front = { base, foes: [...foes], tiles: [] }; a.order = null;
      this.manageArmy(tag, a);
      return null;
    }
    setAttack(tag, id, targets) {
      const a = this.g.c[tag].armies.find((x) => x.id === id); if (!a) return 'Armee nicht gefunden.';
      const t = targets.filter((pid) => { const c = this.controller(pid); return c && this.atWar(tag, c); });
      if (!t.length) return 'Wähle Provinzen eines Landes, mit dem du im Krieg bist.';
      a.order = { kind: 'attack', targets: t }; this.manageArmy(tag, a);
      return null;
    }
    clearArmyOrders(tag, id) {
      const a = this.g.c[tag].armies.find((x) => x.id === id); if (!a) return;
      a.front = null; a.order = null; this.armyUnits(tag, id).forEach((u) => { u.dest = null; });
    }
    // Eigene Grenzprovinzen entlang der gezeichneten Front – folgt der Grenze dynamisch
    frontTiles(tag, front) {
      const foes = new Set(front.foes);
      const mine = (pid) => !this.isWater(pid) && this.controller(pid) === tag;
      const borders = (pid) => { for (const n of this.adj[pid]) if (!this.isWater(n) && foes.has(this.controller(n))) return true; return false; };
      const search = (base, H) => {
        const dist = new Map(), q = [];
        base.forEach((b) => { if (mine(b)) { dist.set(b, 0); q.push(b); } });
        for (let i = 0; i < q.length; i++) { const cur = q[i], d = dist.get(cur); if (d >= H) continue; for (const n of this.adj[cur]) if (!dist.has(n) && mine(n)) { dist.set(n, d + 1); q.push(n); } }
        return [...dist.keys()].filter(borders);
      };
      let tiles = search(front.base, 3);
      for (let k = 0; k < 3 && !tiles.length && front.tiles.length; k++) { front.base = front.tiles.filter(mine).concat(front.base.filter(mine)); tiles = search(front.base, 3 + k); }
      if (tiles.length) { front.tiles = tiles; if (front.base.length > 40) front.base = tiles.slice(); }
      return front.tiles.filter(mine);
    }
    // Einheiten gleichmäßig auf Kacheln verteilen (z. B. 8 Truppen auf 4 Kacheln = 2 pro Kachel)
    distribute(units, tiles) {
      if (!tiles.length || !units.length) return;
      const cap = Math.ceil(units.length / tiles.length), load = new Map(tiles.map((t) => [t, 0])), left = [];
      units.forEach((u) => {
        const want = u.dest && load.has(u.dest) ? u.dest : !u.dest && load.has(u.prov) ? u.prov : null;
        if (want && load.get(want) < cap) { load.set(want, load.get(want) + 1); u.dest = want; } else left.push(u);
      });
      left.forEach((u) => {
        let best = null, bd = Infinity; const a = this.pc[u.prov];
        tiles.forEach((t) => { if (load.get(t) >= cap) return; const b = this.pc[t], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d < bd) { bd = d; best = t; } });
        if (!best) best = tiles[0];
        load.set(best, load.get(best) + 1); u.dest = best; u.path = []; u.prog = 0;
      });
      units.forEach((u) => { if (u.dest && u.prov !== u.dest && (!u.path.length || u.path[u.path.length - 1] !== u.dest)) this.orderMove([u.id], u.dest); });
    }
    manageArmy(tag, a) {
      const units = this.armyUnits(tag, a.id).filter((u) => this.kindOf(u) === 'land' && !this.isEmbarked(u));
      if (a.order && a.order.kind === 'attack') {
        const targets = a.order.targets.filter((pid) => { const c = this.controller(pid); return c && this.atWar(tag, c); });
        a.order.targets = targets;
        if (!targets.length) { a.order = null; units.forEach((u) => (u.dest = null)); if (tag === this.g.player) this.logMsg('✔ ' + a.name + ': Angriff abgeschlossen.', [tag]); }
        else { this.distribute(units, targets); return; }
      }
      if (a.front) this.distribute(units, this.frontTiles(tag, a.front));
    }
    manageArmies(tag) { const c = this.g.c[tag]; if (c && c.armies && c.armies.length) c.armies.forEach((a) => this.manageArmy(tag, a)); }

    // ---------- Tick ----------
    tick() {
      const g = this.g;
      if (g.over) return;
      g.day++;
      this.rnd = U.rng(g.seed + g.day * 7919);
      this.refresh();
      const tags = Object.keys(this.world.countries).filter((t) => this.isAlive(t));
      tags.forEach((t) => this.stats(t));
      tags.forEach((t) => this.economy(t));
      if (g.day % 2 === 0) tags.forEach((t) => this.manageArmies(t));
      this.population();
      this.movement();
      this.combat();
      if (H.AI) H.AI.tick(this);
      this.checkDead();
    }

    economy(tag) {
      const c = this.g.c[tag], s = this.st[tag];
      c.money += s.net;
      c.manpower = Math.min(Math.max(c.manpower, s.manCap), c.manpower + s.manRegen);
      if (c.money < -500) c.money = -500;

      // Bauen
      if (c.build.length) {
        const share = s.civWork / c.build.length;
        for (let i = c.build.length - 1; i >= 0; i--) {
          const b = c.build[i], B = D.BUILDINGS[b.type];
          b.work += share;
          if (b.work >= B.work) {
            const st = this.world.states[b.state];
            let ok = this.stateCtrl(st) === tag;
            if (ok && B.prov) { const p = this.world.provinces[b.prov]; if (this.controller(b.prov) === tag) p.port = true; else ok = false; }
            else if (ok) st.buildings[b.type]++;
            if (ok) { st.gdp += B.gdp; if (tag === this.g.player) this.logMsg(B.icon + ' ' + B.name + ' in ' + st.name + ' fertiggestellt.', [tag]); }
            else c.money += B.cost;
            c.build.splice(i, 1);
          }
        }
      }
      // Equipment-Produktion: Fabriken pro Linie, begrenzt durch Ressourcen
      c.lines.forEach((l) => {
        const E = D.EQUIPMENT[l.eq], info = s.lines[l.id];
        if (!info) return;
        l.progress += info.rate;
        while (l.progress >= E.pp) { l.progress -= E.pp; c.equip[l.eq] = (c.equip[l.eq] || 0) + 1; l.made++; }
      });
      // Ausbildung
      for (let i = c.train.length - 1; i >= 0; i--) {
        const t = c.train[i]; t.left--;
        if (t.left > 0) continue;
        const d = D.UNITS[t.type];
        const site = d.naval ? this.shipyardWater(tag) : this.capitalProv(tag);
        if (!site) { t.left = 0; continue; }
        this.spawn(tag, t.type, site); c.train.splice(i, 1);
        if (tag === this.g.player) this.logMsg('🎖️ ' + d.name + ' ist einsatzbereit.', [tag]);
      }
      // Forschung
      const r = c.research;
      if (r.cur.length) {
        const per = s.rp / r.cur.length;
        r.cur.slice().forEach((id) => {
          const t = this.techById[id];
          r.prog[id] = (r.prog[id] || 0) + per;
          if (r.prog[id] >= t.cost) {
            r.done.push(id); r.cur = r.cur.filter((x) => x !== id); delete r.prog[id];
            this.recalcMods(tag);
            if (tag === this.g.player) this.logMsg('🔬 Forschung abgeschlossen: ' + t.name, [tag]);
          }
        });
      }
    }

    population() {
      const w = this.world;
      for (const id in w.states) {
        const s = w.states[id], owner = w.countries[s.owner], ctrlTag = this.stateCtrl(s), ctrl = w.countries[ctrlTag];
        if (!owner || !ctrl) continue;
        const pop = s.pop;
        for (const e in pop) {
          let gr = 0.00004;
          if (e === owner.main) gr *= 1.8; else if (this.integrated(s.owner, e)) gr *= 1.0; else gr *= 0.6;
          pop[e] *= 1 + gr;
        }
        if (s.owner === ctrlTag) {
          for (const e in pop) {
            if (e === owner.main) continue;
            const mv = pop[e] * (this.integrated(s.owner, e) ? 0.00008 : 0.00003) * (1 + (this.mods[s.owner] ? this.mods[s.owner].assim : 0));
            pop[e] -= mv; pop[owner.main] = (pop[owner.main] || 0) + mv;
          }
        }
        const sup = ctrl.policies && ctrl.policies.ethnicSuppression;
        if (sup) {
          const k = D.POLICIES.ethnicSuppression.effects.minorityDecay;
          for (const e in pop) {
            if (this.integrated(ctrlTag, e)) continue;
            const dec = pop[e] * k; pop[e] -= dec; pop[ctrl.main] = (pop[ctrl.main] || 0) + dec * 0.3;
          }
        }
        for (const e in pop) if (pop[e] < 0.05) delete pop[e];
        const tot = this.popTotal(s) || 1; let minor = 0;
        for (const e in pop) if (!this.integrated(ctrlTag, e)) minor += pop[e];
        const share = minor / tot, ideo = D.IDEOLOGIES[ctrl.ideology] || { unrest: 0 };
        let target = ideo.unrest + share * 80 + (ctrlTag !== s.owner ? 20 : 0);
        if (sup && share > 0.01) target += D.POLICIES.ethnicSuppression.effects.unrestFlat;
        target -= this.mods[ctrlTag] ? this.mods[ctrlTag].stab : 0;
        const up = this.g.c[ctrlTag] && this.g.c[ctrlTag].upheaval;
        if (up && this.g.day < up.until) target += 25;
        target = Math.max(0, Math.min(100, target));
        s.unrest = (s.unrest || 0) + Math.max(-0.8, Math.min(0.8, target - (s.unrest || 0)));
        s.gdp *= 1 + 0.00005 * this.stateEff(s);
      }
    }

    movement() {
      this.g.units.forEach((u) => {
        if (!u.path.length) return;
        const kind = this.kindOf(u);
        u.prog += this.stat(u, 'speed') * D.MOVE_SCALE * (this.terrain(u.path[0]).move || 1);
        while (u.path.length) {
          const next = u.path[0];
          if (!this.canStep(u.owner, kind, u.prov, next)) { u.path = []; u.prog = 0; break; }
          const a = this.pc[u.prov], b = this.pc[next], d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
          if (u.prog < d) break;
          u.prog -= d; u.prov = u.path.shift();
          if (this.unitsAt(u.prov).some((o) => this.atWar(u.owner, o.owner))) { u.path = []; u.prog = 0; break; }
        }
        if (!u.path.length) u.prog = 0;
      });
    }

    combat() {
      const P = this.world.provinces;
      const byProv = {};
      this.g.units.forEach((u) => (byProv[u.prov] || (byProv[u.prov] = [])).push(u));
      const dead = new Set();
      for (const pid in byProv) {
        const list = byProv[pid];
        if (list.length < 2) continue;
        const owners = [...new Set(list.map((u) => u.owner))];
        if (owners.length < 2 || !owners.some((a) => owners.some((b) => this.atWar(a, b)))) continue;
        const water = U.isWater(P[pid]), ctrl = this.controller(pid), terr = this.terrain(pid), city = P[pid].city;
        const dmg = new Map();
        list.forEach((u) => {
          let atk = this.stat(u, 'atk');
          if (atk <= 0) return;
          const foes = list.filter((o) => this.atWar(u.owner, o.owner));
          if (!foes.length) return;
          const t = foes[Math.floor(this.rnd() * foes.length)];
          const fight = 0.55 + 0.45 * (u.hp / this.maxHp(u));
          let df = this.stat(t, 'def');
          if (!water) {
            if (t.owner === ctrl || this.allied(t.owner, ctrl)) df *= terr.def * (1 + 0.1 * (city ? city.size || 1 : 0));
            if (!(u.owner === ctrl || this.allied(u.owner, ctrl))) atk *= terr.atk;
          }
          let d = Math.max(1, atk * (0.6 + this.rnd() * 0.8) - df * 0.35) * 5 * fight;
          const td = D.UNITS[t.type], ud = D.UNITS[u.type];
          if (td.air && !ud.air) d *= ud.naval ? 0.4 : 0.35;
          dmg.set(t, (dmg.get(t) || 0) + d);
        });
        dmg.forEach((d, t) => { t.hp -= d; t.fighting = this.g.day; });
        list.forEach((u) => {
          if (u.hp <= 0) { dead.add(u.id); return; }
          const kind = this.kindOf(u);
          if (u.hp < this.maxHp(u) * 0.25 && kind === 'land' && !water) {
            for (const n of this.adj[pid]) {
              if (this.isWater(n)) continue;
              const c2 = this.controller(n);
              if ((c2 === u.owner || this.allied(u.owner, c2)) && !this.unitsAt(n).some((o) => this.atWar(u.owner, o.owner))) { u.prov = n; u.path = []; u.prog = 0; break; }
            }
          }
        });
      }
      if (dead.size) {
        const lost = {};
        this.g.units.forEach((u) => { if (dead.has(u.id)) lost[u.owner] = (lost[u.owner] || 0) + 1; });
        this.g.units = this.g.units.filter((u) => !dead.has(u.id));
        if (lost[this.g.player]) this.logMsg('💀 ' + lost[this.g.player] + ' deiner Einheiten wurden vernichtet.', [this.g.player]);
      }
      // Besetzen + Heilen
      const bp = {};
      this.g.units.forEach((u) => (bp[u.prov] || (bp[u.prov] = [])).push(u));
      for (const pid in bp) {
        const list = bp[pid], p = P[pid];
        const hostile = list.some((a) => list.some((b) => this.atWar(a.owner, b.owner)));
        if (hostile) continue;
        if (!U.isWater(p)) {
          const ctrl = this.controller(pid);
          const occ = list.find((u) => this.kindOf(u) === 'land' && ctrl !== u.owner && !this.allied(u.owner, ctrl) && this.atWar(u.owner, ctrl));
          if (occ) {
            if (p.capBy === occ.owner) p.capDays = (p.capDays || 0) + 1; else { p.capBy = occ.owner; p.capDays = 1; }
            if (p.capDays >= D.CAPTURE_DAYS + (p.city ? 1 : 0)) {
              const st = this.world.states[p.state];
              p.occupier = occ.owner === st.owner ? null : occ.owner;
              p.capBy = null; p.capDays = 0;
              this.updateStateOcc(st);
              this.bordersChanged = true;
            }
          } else if (p.capDays) { p.capBy = null; p.capDays = 0; }
        }
        list.forEach((u) => {
          const mx = this.maxHp(u);
          if (u.hp < mx && this.g.day - (u.fighting || -9) > 1) u.hp = Math.min(mx, u.hp + 1.5);
        });
      }
    }

    checkDead() {
      let changed = false;
      for (const tag in this.world.countries) {
        if (this.g.dead[tag]) continue;
        if (this.ctrlStates(tag).length === 0) {
          // Land kontrolliert nichts mehr: automatische Kapitulation – jeder Besatzer annektiert, was er hält
          const occ = {};
          this.ownedStates(tag).forEach((s) => { if (s.occupier !== tag) (occ[s.occupier] = occ[s.occupier] || []).push(s.id); });
          for (const o in occ) this.makePeace(o, tag, occ[o]);
        }
        if (this.ctrlStates(tag).length === 0 && this.ownedStates(tag).length === 0) {
          this.g.dead[tag] = true; changed = true;
          this.g.units = this.g.units.filter((u) => u.owner !== tag);
          this.logMsg('☠️ ' + this.world.countries[tag].name + ' wurde vollständig besetzt und existiert nicht mehr!', [tag]);
          if (tag === this.g.player) this.g.over = 'lost';
        }
      }
      if (changed) { this.cleanWars(); this.refresh(); }
      const alive = Object.keys(this.world.countries).filter((t) => this.isAlive(t));
      if (!this.g.over && alive.length === 1 && alive[0] === this.g.player) this.g.over = 'won';
    }

    // ---------- Bündnisse ----------
    alliance(tag) { return this.world.alliances.find((a) => a.members.includes(tag)); }
    requestAlliance(a, b) {
      if (a === b || this.allied(a, b)) return { ok: false, msg: 'Ihr seid bereits verbündet.' };
      if (this.atWar(a, b)) return { ok: false, msg: 'Ihr befindet euch im Krieg.' };
      const A = this.alliance(a), B = this.alliance(b);
      if (A && B) return { ok: false, msg: this.country(b).name + ' ist bereits in einem anderen Bündnis (' + B.name + ').' };
      const mem = (al) => (al ? al.members : []);
      if (mem(B).some((m) => this.atWar(a, m)) || mem(A).some((m) => this.atWar(b, m))) return { ok: false, msg: 'Ein Bündnispartner befindet sich im Krieg mit der anderen Seite.' };
      const ea = this.enemies(a), eb = this.enemies(b);
      const common = ea.some((x) => eb.includes(x));
      const ca = this.country(a), cb = this.country(b);
      let score = (ca.ideology === cb.ideology ? 2 : 0) + (common ? 3 : 0) + (this.strength(a) > this.strength(b) * 0.7 ? 1 : 0);
      if (ca.ideology !== cb.ideology && ((ca.ideology === 'communist') !== (cb.ideology === 'communist'))) score -= 2;
      if (score < 2) return { ok: false, msg: cb.name + ' lehnt ab. (Gemeinsame Feinde oder gleiche Ideologie helfen.)' };
      let al = A || B;
      if (!al) { al = { id: 'a' + this.g.nextId++, name: 'Bündnis ' + ca.name + '–' + cb.name, members: [a] }; this.world.alliances.push(al); }
      [a, b].forEach((t) => { if (!al.members.includes(t)) al.members.push(t); });
      // laufende Kriege des Partners: dieselbe Seite
      this.g.wars.forEach((w) => {
        [[a, b], [b, a]].forEach(([from, to]) => {
          const side = w.attackers.includes(from) ? w.attackers : w.defenders.includes(from) ? w.defenders : null;
          const other = side === w.attackers ? w.defenders : w.attackers;
          if (side && !side.includes(to) && !other.includes(to)) side.push(to);
        });
      });
      this.logMsg('🤝 ' + ca.name + ' und ' + cb.name + ' schließen ein Bündnis (' + al.name + ').', [a, b]);
      return { ok: true, msg: cb.name + ' nimmt das Bündnis an!' };
    }
    leaveAlliance(tag) {
      const al = this.alliance(tag); if (!al) return;
      al.members = al.members.filter((m) => m !== tag);
      this.logMsg(this.country(tag).name + ' verlässt das Bündnis ' + al.name + '.', [tag]);
    }

    // ---------- Friedenskonferenz (mehrere Parteien gegen einen Gegner) ----------
    conferenceInfo(target) {
      const participants = this.enemies(target);
      const states = this.ownedStates(target).filter((s) => s.occupier !== s.owner && participants.includes(s.occupier));
      return { participants, states };
    }
    evalConference(target, assign, proposer) {
      const info = this.conferenceInfo(target);
      let tot = 0, lost = 0; this.ownedStates(target).forEach((s) => { tot += s.gdp; });
      info.states.forEach((s) => { lost += s.gdp; });
      const annexed = info.states.filter((s) => assign[s.id]);
      if (annexed.length) {
        if (tot && lost / tot < 0.2) return { ok: false, msg: this.country(target).name + ': Wir sind nicht besiegt – niemals! (Mind. 20 % unseres BIP müssen besetzt sein.)' };
      } else {
        const days = this.g.day - this.warStart(proposer, target);
        const back = this.lostShare(proposer, target);
        if (!(lost / (tot || 1) >= 0.1 || (days >= 40 && lost / (tot || 1) + 0.05 >= back))) return { ok: false, msg: this.country(target).name + ': Wir haben die Oberhand – kein Frieden.' };
      }
      for (const x of info.participants) {
        if (x === proposer) continue;
        let occ = 0, recv = 0;
        info.states.forEach((s) => { if (s.occupier === x) occ += s.gdp; if (assign[s.id] === x) recv += s.gdp; });
        if (occ > 0 && recv < occ * 0.7) return { ok: false, msg: this.country(x).name + ' akzeptiert diese Aufteilung nicht (sie halten mehr besetzt, als sie bekommen).' };
      }
      return { ok: true, msg: this.country(target).name + ' stimmt dem Friedensvertrag zu.' };
    }
    applyConference(target, assign) {
      const info = this.conferenceInfo(target), per = {};
      info.states.forEach((s) => { const r = assign[s.id]; if (r) { s.occupier = r; (per[r] = per[r] || []).push(s.id); } });
      info.participants.forEach((x) => this.makePeace(x, target, per[x] || []));
    }

        dateStr(day) {
      const sd = (this.world.startDate || D.START_DATE).split('-').map(Number);
      const d = new Date(Date.UTC(sd[0], sd[1] - 1, sd[2]) + (day === undefined ? this.g.day : day) * 86400000);
      return d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.' + d.getUTCFullYear();
    }
  }
  H.Sim = Sim;
})(window.HOG);
