/* Hearts of Gold – einfache KI für alle Länder, die nicht der Spieler sind */
window.HOG = window.HOG || {};
(function (H) {
  const D = H.data;
  const AI = (H.AI = {});

  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

  AI.tick = function (sim) {
    const g = sim.g, day = g.day;
    for (const tag in sim.world.countries) {
      if (tag === g.player || !sim.isAlive(tag)) continue;
      const off = hash(tag);
      if ((day + off) % 5 === 0) AI.build(sim, tag);
      if ((day + off) % 7 === 0) { AI.production(sim, tag); AI.research(sim, tag); }
      if ((day + off) % 3 === 0) AI.military(sim, tag);
      if ((day + off) % 20 === 0 && day > 120) AI.maybeWar(sim, tag);
    }
    if (day % 10 === 0) AI.peace(sim);
  };

  AI.build = function (sim, tag) {
    const c = sim.g.c[tag], s = sim.st[tag];
    if (!s || c.build.length >= 3) return;
    let type = 'civ';
    if (s.energyEff < 0.97) type = 'power';
    else if (s.civ >= s.mil * 2.2 + 3) type = 'mil';
    const B = D.BUILDINGS[type];
    if (c.money < B.cost + 40) return;
    const cands = sim.ctrlStates(tag).filter((st) => st.buildings.civ + st.buildings.mil + st.buildings.power + c.build.filter((b) => b.state === st.id).length < st.slots);
    if (!cands.length) return;
    cands.sort((a, b) => (b.slots - b.buildings.civ - b.buildings.mil - b.buildings.power) - (a.slots - a.buildings.civ - a.buildings.mil - a.buildings.power));
    sim.queueBuild(tag, cands[0].id, type);
  };

  AI.production = function (sim, tag) {
    const c = sim.g.c[tag];
    let s = sim.stats(tag);
    const atWar = sim.enemies(tag).length > 0;
    // Fabriken auf Ausrüstungslinien verteilen
    const want = [['rifles', 3], ['guns', 1]];
    if (sim.equipUnlocked(tag, 'tanks')) want.push(['tanks', 2]);
    if (sim.equipUnlocked(tag, 'planes') && atWar) want.push(['planes', 1]);
    const act = want.filter(([eq]) => (c.equip[eq] || 0) < 60);
    const sum = act.reduce((a, x) => a + x[1], 0) || 1;
    c.lines = c.lines.filter((l) => act.some((x) => x[0] === l.eq));
    act.forEach(([eq, wgt]) => {
      let l = c.lines.find((x) => x.eq === eq);
      if (!l) { l = { id: sim.g.nextId++, eq, fac: 0, progress: 0, made: 0 }; c.lines.push(l); }
      l.fac = Math.floor((s.mil * wgt) / sum);
    });
    if (c.lines.length) c.lines[0].fac += s.mil - c.lines.reduce((a, l) => a + l.fac, 0);
    // fehlende Ressourcen importieren
    s = sim.stats(tag);
    D.RESOURCES.forEach((r) => {
      const dem = s.demandRes[r.id] || 0, have = s.res[r.id];
      c.imports[r.id] = dem > have && c.money > 150 && s.income > 5 ? Math.min(12, Math.ceil(dem - have)) : 0;
    });
    // rekrutieren
    const myUnits = sim.g.units.filter((u) => u.owner === tag).length + c.train.length;
    const cap = 6 + s.mil * 2.5 + (atWar ? s.mil : 0);
    if (myUnits > cap || s.net < -1) return;
    for (let i = 0; i < 3; i++) {
      const opts = Object.keys(D.UNITS).filter((k) => !D.UNITS[k].naval && sim.unitUnlocked(tag, k));
      sim.recruit(tag, opts[Math.floor(sim.rnd() * opts.length)]);
    }
  };

  AI.research = function (sim, tag) {
    const r = sim.g.c[tag].research;
    while (r.cur.length < 2) {
      const av = D.TECHS.filter((t) => sim.techAvailable(tag, t) && !r.cur.includes(t.id));
      if (!av.length) return;
      const pri = av.filter((t) => /^(eco|ind|con|en|res|edu)/.test(t.id));
      const pool = pri.length && sim.rnd() < 0.6 ? pri : av;
      pool.sort((a, b) => a.cost - b.cost);
      sim.startResearch(tag, pool[0].id);
    }
  };

  AI.military = function (sim, tag) {
    const enemies = sim.enemies(tag);
    if (!enemies.length) return;
    const units = sim.g.units.filter((u) => u.owner === tag);
    if (!units.length) return;
    const P = sim.world.provinces, cap = sim.capitalProv(tag);
    if (!cap) return;
    // Frontlinie: feindliche Provinzen neben meinen/verbündeten Provinzen
    const targets = [], frontOwn = [];
    for (const pid in P) {
      const c = sim.controller(pid);
      if (enemies.includes(c)) {
        for (const n of sim.adj[pid]) { const cn = sim.controller(n); if (cn === tag || sim.allied(tag, cn)) { targets.push(pid); break; } }
      } else if (c === tag) {
        for (const n of sim.adj[pid]) if (enemies.includes(sim.controller(n))) { frontOwn.push(pid); break; }
      }
    }
    if (!targets.length) return;
    const cc = sim.pc[cap];
    targets.sort((a, b) => Math.hypot(sim.pc[a][0] - cc[0], sim.pc[a][1] - cc[1]) - Math.hypot(sim.pc[b][0] - cc[0], sim.pc[b][1] - cc[1]));
    const target = targets[0];
    let defIdx = 0;
    units.forEach((u, i) => {
      if (u.path.length) return;
      const def = frontOwn.length && i % 3 === 0 && !D.UNITS[u.type].air;
      const dest = def ? frontOwn[defIdx++ % frontOwn.length] : target;
      if (u.prov !== dest) sim.orderMove([u.id], dest);
    });
  };

  AI.maybeWar = function (sim, tag) {
    const aggr = sim.g.opts.aggression;
    if (!aggr || sim.enemies(tag).length >= 1) return;
    if (sim.rnd() > 0.14 * aggr) return;
    const W = sim.world, me = W.countries[tag];
    const nb = new Set();
    sim.ctrlStates(tag).forEach((s) => s.provinces.forEach((pid) => sim.adj[pid].forEach((n) => { const c = sim.controller(n); if (c && c !== tag) nb.add(c); })));
    const cands = [...nb].filter((t) => sim.isAlive(t) && !sim.allied(tag, t) && !sim.atWar(tag, t));
    if (!cands.length) return;
    const allyStr = (t) => { let v = 0; const seen = new Set([t]); W.alliances.forEach((al) => { if (al.members.includes(t)) al.members.forEach((m) => seen.add(m)); }); seen.forEach((m) => (v += sim.isAlive(m) ? sim.strength(m) : 0)); return v; };
    const mine = allyStr(tag);
    const scored = cands.map((t) => {
      let claim = 0, tot = 0;
      sim.ownedStates(t).forEach((s) => { const n = sim.popTotal(s); tot += n; claim += s.pop[me.main] || 0; });
      let sc = (W.countries[t].ideology !== me.ideology ? 1 : 0) + (tot ? (claim / tot) * 6 : 0) + sim.rnd();
      return { t, sc, ratio: mine / Math.max(1, allyStr(t)) };
    }).filter((x) => x.ratio > 1.25).sort((a, b) => b.sc - a.sc);
    if (scored.length) sim.declareWar(tag, scored[0].t);
  };

  AI.peace = function (sim) {
    const player = sim.g.player;
    sim.g.wars.slice().forEach((w) => {
      w.attackers.forEach((x) => w.defenders.forEach((y) => {
        if (x === player || y === player || !sim.atWar(x, y)) return;
        const days = sim.g.day - w.start;
        const lx = sim.lostShare(y, x), ly = sim.lostShare(x, y);
        if (lx >= 0.25) sim.makePeace(x, y, sim.occupiedBy(y, x).map((s) => s.id));
        else if (ly >= 0.25) sim.makePeace(y, x, sim.occupiedBy(x, y).map((s) => s.id));
        else if (days > 200 && sim.rnd() < 0.1) sim.makePeace(x, y, []);
      }));
    });
  };
})(window.HOG);
