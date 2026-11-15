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
        version: 1, seed: Math.floor(Math.random() * 1e9), day: 0, player, wars: [], c: {}, units: [], nextId: 1, log: [],
        opts: Object.assign({ aggression: 1 }, opts || {}), over: null, dead: {}, ai: {},
      };
      const sim = new Sim(world, g);
      for (const tag in world.countries) {
        const c = world.countries[tag];
        g.c[tag] = { money: 300, manpower: 0, stock: {}, research: { done: [], cur: [], prog: {} }, prod: [], build: [] };
        RES.forEach((r) => (g.c[tag].stock[r] = 40));
        const st = sim.stats(tag);
        g.c[tag].manpower = Math.round(st.popTotal * 0.012);
        // Starttruppen
        const states = sim.ctrlStates(tag);
        const provs = [];
        states.forEach((s) => s.provinces.forEach((p) => provs.push(p)));
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
    toSave() { return JSON.parse(U.toJSON({ version: 1, world: this.world, g: this.g })); }

    buildIndex() {
      const w = this.world, P = w.provinces;
      const ids = Object.keys(P);
      this.adj = {};
      ids.forEach((id) => (this.adj[id] = new Set()));
      const bbs = {}, cs = {};
      ids.forEach((id) => { bbs[id] = U.bbox(P[id].points); cs[id] = U.centroid(P[id].points); });
      this.pc = cs;
      const T = 2.5;
      const touches = (A, B) => {
        for (const a of A) for (let i = 0; i < B.length; i++) {
          const b = B[i], c = B[(i + 1) % B.length];
          if (U.nearOnSeg(a[0], a[1], b[0], b[1], c[0], c[1]).d < T) return true;
        }
        return false;
      };
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const a = bbs[ids[i]], b = bbs[ids[j]];
        if (a[2] + T < b[0] || b[2] + T < a[0] || a[3] + T < b[1] || b[3] + T < a[1]) continue;
        if (touches(P[ids[i]].points, P[ids[j]].points) || touches(P[ids[j]].points, P[ids[i]].points)) {
          this.adj[ids[i]].add(ids[j]); this.adj[ids[j]].add(ids[i]);
        }
      }
      (w.links || []).forEach(([a, b]) => { if (this.adj[a] && this.adj[b]) { this.adj[a].add(b); this.adj[b].add(a); } });
    }

    // ---------- Abfragen ----------
    country(tag) { return this.world.countries[tag]; }
    isAlive(tag) { return !this.g.dead[tag]; }
    controller(pid) {
      const p = this.world.provinces[pid];
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
      if (a === b) return false;
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
      return c === tag || this.allied(tag, c) || this.atWar(tag, c);
    }
    capitalProv(tag) {
      const c = this.country(tag), s = c.capital && this.world.states[c.capital];
      if (s && this.stateCtrl(s) === tag && s.provinces.length) return s.provinces[0];
      const l = this.ctrlStates(tag);
      return l.length ? l[0].provinces[0] : null;
    }
    unitsAt(pid) { return this.g.units.filter((u) => u.prov === pid); }
    unitDef(u) { return D.UNITS[u.type]; }
    stat(u, key) {
      const m = this.mods[u.owner];
      return D.UNITS[u.type][key] * (1 + ((m && m[key] && m[key][u.type]) || 0));
    }
    maxHp(u) { return this.stat(u, 'hp'); }
    integrated(tag, eth) { const c = this.country(tag); return c.main === eth || (c.integrated || []).includes(eth); }
    popTotal(s) { let t = 0; for (const k in s.pop) t += s.pop[k]; return t; }

    // ---------- Technik-Modifikatoren ----------
    recalcAllMods() { for (const tag in this.world.countries) this.recalcMods(tag); }
    recalcMods(tag) {
      const m = { atk: {}, def: {}, hp: {}, speed: {}, gdp: 0, civ: 0, mil: 0, research: 0, energy: 0, resource: 0, manpower: 0, unlocked: {} };
      for (const k in D.UNITS) if (!D.UNITS[k].tech) m.unlocked[k] = true;
      const rs = this.g.c[tag] && this.g.c[tag].research;
      if (rs) rs.done.forEach((id) => {
        const t = this.techById[id]; if (!t) return;
        const e = t.effects;
        if (e.unlock) m.unlocked[e.unlock] = true;
        ['atk', 'def', 'hp', 'speed'].forEach((k) => { if (e[k]) for (const u in e[k]) m[k][u] = (m[k][u] || 0) + e[k][u]; });
        ['gdp', 'civ', 'mil', 'research', 'energy', 'resource', 'manpower'].forEach((k) => { if (e[k]) m[k] += e[k]; });
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
      const c = this.country(tag), ideo = D.IDEOLOGIES[c.ideology] || D.IDEOLOGIES.democratic, m = this.mods[tag] || this.recalcMods(tag) || this.mods[tag];
      const states = this.ctrlStates(tag);
      const s = { states: states.length, gdp: 0, civ: 0, mil: 0, power: 0, supply: 0, demand: 0, popTotal: 0, res: {}, units: 0, upkeep: 0 };
      RES.forEach((r) => (s.res[r] = 0));
      let gdpEff = 0, civW = 0, milW = 0, resW = {};
      RES.forEach((r) => (resW[r] = 0));
      states.forEach((st) => {
        s.gdp += st.gdp; s.civ += st.buildings.civ; s.mil += st.buildings.mil; s.power += st.buildings.power;
        s.popTotal += this.popTotal(st);
      });
      s.supply = s.power * D.POWER_OUTPUT * (1 + m.energy);
      s.demand = (s.civ + s.mil) * D.POWER_USE;
      s.energyEff = s.demand ? Math.max(0.3, Math.min(1, s.supply / s.demand)) : 1;
      states.forEach((st) => {
        const occ = st.owner === tag ? 1 : 0.5, e = this.stateEff(st) * s.energyEff * occ;
        gdpEff += st.gdp * 0.004 * e; civW += st.buildings.civ * e; milW += st.buildings.mil * e;
        RES.forEach((r) => (resW[r] += (st.resources[r] || 0) * this.stateEff(st) * occ));
      });
      s.units = this.g.units.filter((u) => u.owner === tag).length;
      s.upkeep = this.g.units.reduce((a, u) => a + (u.owner === tag ? D.UNITS[u.type].upkeep : 0), 0);
      s.income = gdpEff * ideo.gdp * this.policyMod(tag, 'gdp', 1) * (1 + m.gdp);
      s.net = s.income - s.upkeep;
      s.civWork = civW * (1 + m.civ);
      s.pp = milW * 0.8 * ideo.prod * this.policyMod(tag, 'prod', 1) * (1 + m.mil);
      RES.forEach((r) => (s.res[r] = resW[r] * 0.4 * (1 + m.resource)));
      s.rp = (1 + s.gdp / 600) * ideo.research * this.policyMod(tag, 'research', 1) * (1 + m.research);
      s.manRegen = (s.popTotal * 0.0003 * ideo.manpower * (1 + m.manpower));
      s.manCap = s.popTotal * 0.08;
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
    findPath(tag, from, to) {
      if (from === to) return [];
      const dist = { [from]: 0 }, prev = {}, open = new Set([from]), done = new Set();
      while (open.size) {
        let cur = null, cd = Infinity;
        open.forEach((k) => { if (dist[k] < cd) { cd = dist[k]; cur = k; } });
        if (cur === to) break;
        open.delete(cur); done.add(cur);
        for (const n of this.adj[cur]) {
          if (done.has(n) || !this.canEnter(tag, n)) continue;
          const a = this.pc[cur], b = this.pc[n], nd = cd + Math.hypot(a[0] - b[0], a[1] - b[1]);
          if (dist[n] === undefined || nd < dist[n]) { dist[n] = nd; prev[n] = cur; open.add(n); }
        }
      }
      if (dist[to] === undefined) return null;
      const path = []; let c = to;
      while (c !== from) { path.unshift(c); c = prev[c]; }
      return path;
    }
    orderMove(unitIds, pid) {
      const cache = {}; let ok = 0;
      unitIds.forEach((id) => {
        const u = this.g.units.find((x) => x.id === id); if (!u) return;
        const k = u.owner + u.prov;
        const path = cache[k] !== undefined ? cache[k] : (cache[k] = this.findPath(u.owner, u.prov, pid));
        if (path) { u.path = path.slice(); u.prog = 0; ok++; }
      });
      return ok;
    }

    // ---------- Bauen / Produktion / Forschung (API für UI + KI) ----------
    queueBuild(tag, stateId, type) {
      const s = this.world.states[stateId], B = D.BUILDINGS[type], c = this.g.c[tag];
      if (!s || !B) return 'Ungültig';
      if (this.stateCtrl(s) !== tag) return 'Dieser Staat wird nicht von dir kontrolliert.';
      const used = s.buildings.civ + s.buildings.mil + s.buildings.power + c.build.filter((b) => b.state === stateId).length;
      if (used >= s.slots) return 'Keine freien Bauplätze in ' + s.name + '.';
      if (c.money < B.cost) return 'Nicht genug BIP-Geld (' + B.cost + ' nötig).';
      if (c.build.length >= 12) return 'Bauwarteschlange voll.';
      c.money -= B.cost;
      c.build.push({ id: this.g.nextId++, state: stateId, type, work: 0 });
      return null;
    }
    cancelBuild(tag, id) {
      const c = this.g.c[tag], i = c.build.findIndex((b) => b.id === id);
      if (i >= 0) { c.money += D.BUILDINGS[c.build[i].type].cost * 0.5; c.build.splice(i, 1); }
    }
    addProduction(tag, type) {
      const c = this.g.c[tag];
      if (!this.mods[tag].unlocked[type]) return 'Einheit noch nicht erforscht.';
      if (c.prod.length >= 8) return 'Maximal 8 Produktionslinien.';
      c.prod.push({ id: this.g.nextId++, type, progress: 0, made: 0, stalled: '' });
      return null;
    }
    // Handel: Ressourcen mit BIP-Geld zukaufen
    buyResource(tag, res, amount) {
      const c = this.g.c[tag], price = D.TRADE_PRICE * amount;
      if (c.money < price) return 'Nicht genug Geld.';
      c.money -= price; c.stock[res] += amount; return null;
    }
    removeProduction(tag, id) { const c = this.g.c[tag]; c.prod = c.prod.filter((p) => p.id !== id); }
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
      att.forEach((d) => def.delete(d)); // Doppelte entfernen (Angreifer gewinnt Zuordnung)
      att.add(a); def.add(b); def.delete(a); att.delete(b);
      const A = [...att].filter((t) => this.isAlive(t)), Dd = [...def].filter((t) => this.isAlive(t));
      this.g.wars.push({ id: this.g.nextId++, attackers: A, defenders: Dd, truces: [], start: this.g.day });
      const n = (l) => l.map((t) => this.country(t).name).join(', ');
      this.logMsg('⚔️ KRIEG: ' + this.country(a).name + ' erklärt ' + this.country(b).name + ' den Krieg! (' + n(A) + ' gegen ' + n(Dd) + ')', [...A, ...Dd], { war: true, attacker: a });
      return null;
    }
    // Anteil des Gesamt-BIP von "victim" der von "occupier" besetzt ist
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
        const c = this.controller(u.prov);
        if (!(c === u.owner || this.allied(u.owner, c) || this.atWar(u.owner, c))) {
          const home = this.capitalProv(u.owner);
          if (home) { u.prov = home; u.path = []; u.prog = 0; }
        }
        if (u.path.length && !this.canEnter(u.owner, u.path[0])) u.path = [];
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

    // ---------- Tick ----------
    tick() {
      const g = this.g, w = this.world;
      if (g.over) return;
      g.day++;
      this.rnd = U.rng(g.seed + g.day * 7919);
      this.refresh();
      const tags = Object.keys(w.countries).filter((t) => this.isAlive(t));
      tags.forEach((t) => this.stats(t));
      tags.forEach((t) => this.economy(t));
      this.population();
      this.movement();
      this.combat();
      if (H.AI) H.AI.tick(this);
      this.checkDead();
      if (this.bordersChanged) { this.bordersChanged = false; }
    }

    economy(tag) {
      const c = this.g.c[tag], s = this.st[tag];
      c.money += s.net;
      RES.forEach((r) => (c.stock[r] += s.res[r]));
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
            if (this.stateCtrl(st) === tag) { st.buildings[b.type]++; st.gdp += B.gdp; if (tag === this.g.player) this.logMsg(B.icon + ' ' + B.name + ' in ' + st.name + ' fertiggestellt.', [tag]); }
            else c.money += B.cost;
            c.build.splice(i, 1);
          }
        }
      }
      // Produktion
      if (c.prod.length) {
        const per = s.pp / c.prod.length;
        const cap = this.capitalProv(tag);
        c.prod.forEach((l) => {
          const U_ = D.UNITS[l.type];
          if (l.progress < U_.pp) l.progress = Math.min(U_.pp, l.progress + per);
          if (l.progress >= U_.pp) {
            let why = '';
            if (!cap) why = 'Keine Hauptstadt';
            else if (c.manpower < U_.manpower) why = 'Zu wenig Manpower';
            else for (const r in U_.res) if (c.stock[r] < U_.res[r]) { why = 'Zu wenig ' + D.RESOURCES.find((x) => x.id === r).name; l.need = r; break; }
            l.stalled = why;
            if (!why) {
              c.manpower -= U_.manpower;
              for (const r in U_.res) c.stock[r] -= U_.res[r];
              this.spawn(tag, l.type, cap); l.progress -= U_.pp; l.made++;
            }
          } else l.stalled = '';
        });
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
            const mv = pop[e] * (this.integrated(s.owner, e) ? 0.00008 : 0.00003);
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
        // Unruhe
        const tot = this.popTotal(s) || 1; let minor = 0;
        for (const e in pop) if (!this.integrated(ctrlTag, e)) minor += pop[e];
        const share = minor / tot, ideo = D.IDEOLOGIES[ctrl.ideology] || { unrest: 0 };
        let target = ideo.unrest + share * 80 + (ctrlTag !== s.owner ? 20 : 0);
        if (sup && share > 0.01) target += D.POLICIES.ethnicSuppression.effects.unrestFlat;
        target = Math.max(0, Math.min(100, target));
        s.unrest = (s.unrest || 0) + Math.max(-0.8, Math.min(0.8, target - (s.unrest || 0)));
        // BIP wächst leicht
        s.gdp *= 1 + 0.00005 * this.stateEff(s);
      }
    }

    movement() {
      this.g.units.forEach((u) => {
        if (!u.path.length) return;
        u.prog += this.stat(u, 'speed');
        while (u.path.length) {
          const next = u.path[0];
          if (!this.canEnter(u.owner, next)) { u.path = []; u.prog = 0; break; }
          const a = this.pc[u.prov], b = this.pc[next], d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
          if (u.prog < d) break;
          u.prog -= d; u.prov = u.path.shift();
          if (this.unitsAt(u.prov).some((o) => this.atWar(u.owner, o.owner))) { u.path = []; u.prog = 0; break; }
        }
        if (!u.path.length) u.prog = 0;
      });
    }

    combat() {
      const byProv = {};
      this.g.units.forEach((u) => (byProv[u.prov] || (byProv[u.prov] = [])).push(u));
      const dead = new Set();
      for (const pid in byProv) {
        const list = byProv[pid];
        if (list.length < 2) continue;
        const owners = [...new Set(list.map((u) => u.owner))];
        if (owners.length < 2 || !owners.some((a) => owners.some((b) => this.atWar(a, b)))) continue;
        const ctrl = this.controller(pid), dmg = new Map();
        list.forEach((u) => {
          const foes = list.filter((o) => this.atWar(u.owner, o.owner));
          if (!foes.length) return;
          const t = foes[Math.floor(this.rnd() * foes.length)];
          const fight = (0.55 + 0.45 * (u.hp / this.maxHp(u)));
          let atk = this.stat(u, 'atk'), df = this.stat(t, 'def');
          if (t.owner === ctrl || this.allied(t.owner, ctrl)) df *= 1.2;
          let d = Math.max(1, atk * (0.6 + this.rnd() * 0.8) - df * 0.35) * 5 * fight;
          if (D.UNITS[t.type].air && !D.UNITS[u.type].air) d *= 0.35;
          dmg.set(t, (dmg.get(t) || 0) + d);
        });
        dmg.forEach((d, t) => { t.hp -= d; t.fighting = this.g.day; });
        list.forEach((u) => {
          if (u.hp <= 0) { dead.add(u.id); return; }
          if (u.hp < this.maxHp(u) * 0.25 && !D.UNITS[u.type].air) {
            for (const n of this.adj[pid]) {
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
        const list = bp[pid], p = this.world.provinces[pid], ctrl = this.controller(pid);
        const hostile = list.some((a) => list.some((b) => this.atWar(a.owner, b.owner)));
        if (!hostile) {
          const occ = list.find((u) => !D.UNITS[u.type].air && ctrl !== u.owner && !this.allied(u.owner, ctrl) && this.atWar(u.owner, ctrl));
          if (occ) {
            const st = this.world.states[p.state];
            p.occupier = occ.owner === st.owner ? null : occ.owner;
            this.updateStateOcc(st);
            this.bordersChanged = true;
          }
          list.forEach((u) => {
            const mx = this.maxHp(u);
            if (u.hp < mx && this.g.day - (u.fighting || -9) > 1) u.hp = Math.min(mx, u.hp + 1.5);
          });
        }
      }
    }

    checkDead() {
      let changed = false;
      for (const tag in this.world.countries) {
        if (this.g.dead[tag]) continue;
        if (this.ctrlStates(tag).length === 0) {
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

    dateStr(day) {
      const d = new Date(Date.UTC(1936, 0, 1) + (day === undefined ? this.g.day : day) * 86400000);
      return d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.' + d.getUTCFullYear();
    }
  }
  H.Sim = Sim;
})(window.HOG);
