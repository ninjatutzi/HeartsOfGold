/* Hearts of Gold – erzeugt die mitgelieferte Beispielwelt (Mitteleuropa, Voronoi-Provinzen) und leere Welten */
window.HOG = window.HOG || {};
(function (H) {
  const U = H.util;
  const G = (H.worldgen = {});

  G.ETHNICITIES = [
    ['en', 'Briten', '#c4606a'], ['cy', 'Waliser', '#d9534f'], ['sc', 'Schotten', '#5b7fb5'], ['fr', 'Franzosen', '#4a78b5'],
    ['de', 'Deutsche', '#707070'], ['at', 'Österreicher', '#e6dca0'], ['hu', 'Ungarn', '#4f9a5b'], ['cz', 'Tschechen', '#3aa6a6'],
    ['sk', 'Slowaken', '#6fc0b0'], ['pl', 'Polen', '#d88aa8'], ['it', 'Italiener', '#9cc45a'], ['sr', 'Serben', '#8d6fb5'],
    ['hr', 'Kroaten', '#b59bd6'], ['sl', 'Slowenen', '#76b0a0'], ['ro', 'Rumänen', '#d1a23b'], ['ru', 'Russen', '#9c2b2b'],
    ['ua', 'Ukrainer', '#e5c93c'], ['by', 'Weißrussen', '#c98a6a'], ['es', 'Spanier', '#e0952f'], ['ca', 'Katalanen', '#d6b56a'],
    ['ch', 'Schweizer', '#f0f0f0'], ['dk', 'Dänen', '#b05050'], ['yk', 'Jakuten', '#7ab8d6'], ['kk', 'Kasachen', '#59b0b0'],
  ].map((e) => ({ id: e[0], name: e[1], color: e[2] }));

  // Länder: [tag, Name, Farbe, Ideologie, Hauptethnie, integrierte Ethnien, Hauptstadt-Staat, Reichtumsfaktor, Flagge]
  const COUNTRIES = [
    ['GBR', 'Großbritannien', '#c4606a', 'democratic', 'en', ['cy', 'sc'], 'Südengland', 1.4, { pattern: 'cross', c1: '#1c3f94', c2: '#ffffff', c3: '#c8102e', emblem: 'none' }],
    ['FRA', 'Frankreich', '#4a78b5', 'democratic', 'fr', [], 'Île-de-France', 1.1, { pattern: 'v3', c1: '#1c3f94', c2: '#ffffff', c3: '#d52b1e', emblem: 'none' }],
    ['GER', 'Deutschland', '#707070', 'fascist', 'de', ['dk'], 'Berlin-Brandenburg', 1.3, { pattern: 'h3', c1: '#111111', c2: '#c8102e', c3: '#f1c40f', emblem: 'none' }],
    ['AUT', 'Österreich', '#e6dca0', 'monarchist', 'at', ['de'], 'Wien', 0.9, { pattern: 'h3', c1: '#c8102e', c2: '#ffffff', c3: '#c8102e', emblem: 'none' }],
    ['HUN', 'Ungarn', '#4f9a5b', 'monarchist', 'hu', [], 'Budapest', 0.7, { pattern: 'h3', c1: '#c8102e', c2: '#ffffff', c3: '#2e7d32', emblem: 'none' }],
    ['CZE', 'Tschechoslowakei', '#3aa6a6', 'democratic', 'cz', ['sk'], 'Böhmen', 1.1, { pattern: 'triangle', c1: '#ffffff', c2: '#2b4a9a', c3: '#c8102e', emblem: 'none' }],
    ['POL', 'Polen', '#d88aa8', 'democratic', 'pl', [], 'Masowien', 0.6, { pattern: 'h2', c1: '#ffffff', c2: '#c8102e', c3: '#ffffff', emblem: 'none' }],
    ['ITA', 'Italien', '#9cc45a', 'fascist', 'it', [], 'Latium', 0.8, { pattern: 'v3', c1: '#2e8b3a', c2: '#ffffff', c3: '#c8102e', emblem: 'none' }],
    ['YUG', 'Jugoslawien', '#8d6fb5', 'monarchist', 'sr', ['hr'], 'Serbien', 0.5, { pattern: 'h3', c1: '#2b4a9a', c2: '#ffffff', c3: '#c8102e', emblem: 'star' }],
    ['ROM', 'Rumänien', '#d1a23b', 'monarchist', 'ro', [], 'Walachei', 0.5, { pattern: 'v3', c1: '#2b4a9a', c2: '#f1c40f', c3: '#c8102e', emblem: 'none' }],
    ['SOV', 'Sowjetunion', '#9c2b2b', 'communist', 'ru', ['by', 'yk', 'kk'], 'Moskau', 0.6, { pattern: 'canton', c1: '#c8102e', c2: '#c8102e', c3: '#f1c40f', emblem: 'star' }],
    ['ESP', 'Spanien', '#e0952f', 'democratic', 'es', ['ca'], 'Kastilien', 0.6, { pattern: 'h3', c1: '#c8102e', c2: '#f1c40f', c3: '#c8102e', emblem: 'none' }],
    ['SUI', 'Schweiz', '#e8e8e8', 'democratic', 'ch', ['de', 'fr', 'it'], 'Schweiz', 1.6, { pattern: 'cross', c1: '#c8102e', c2: '#ffffff', c3: '#c8102e', emblem: 'none' }],
    ['DEN', 'Dänemark', '#b05050', 'democratic', 'dk', ['de'], 'Dänemark', 1.5, { pattern: 'nordic', c1: '#c8102e', c2: '#ffffff', c3: '#c8102e', emblem: 'none' }],
  ];

  // Staaten: [Name, Land, Länge, Breite, Bevölkerung (K), Ethnien {id:%}, Ressourcen/Tag, Gewicht]
  const STATES = [
    ['Schottland', 'GBR', -4.2, 56.3, 3500, { sc: 92, en: 8 }, { oil: 4 }],
    ['Nordengland', 'GBR', -1.7, 54.3, 5000, null, { steel: 5 }],
    ['Midlands', 'GBR', -1.4, 52.7, 7000, null, { steel: 3, aluminum: 1 }],
    ['Südengland', 'GBR', -0.6, 51.3, 8000, null, {}],
    ['Wales', 'GBR', -3.7, 52.2, 2800, { cy: 82, en: 18 }, { steel: 3, tungsten: 1 }],
    ['Bretagne', 'FRA', -3, 48.3, 3000, null, {}],
    ['Normandie', 'FRA', 0.2, 49.1, 3200, null, { oil: 1 }],
    ['Île-de-France', 'FRA', 2.4, 48.8, 6500, null, {}],
    ['Lothringen', 'FRA', 6.2, 48.9, 2800, { fr: 75, de: 25 }, { steel: 6 }],
    ['Elsass', 'FRA', 7.6, 48.2, 1800, { fr: 58, de: 42 }, { aluminum: 1 }],
    ['Burgund', 'FRA', 4.8, 47, 3000, null, { aluminum: 1 }],
    ['Aquitanien', 'FRA', -0.5, 44.6, 4000, null, { oil: 1 }],
    ['Okzitanien', 'FRA', 2.6, 43.8, 3500, null, {}],
    ['Provence', 'FRA', 5.6, 43.9, 3500, null, { aluminum: 5 }],
    ['Schleswig-Holstein', 'GER', 9.8, 54.2, 2500, { de: 86, dk: 14 }, { oil: 1 }],
    ['Mecklenburg-Vorpommern', 'GER', 12.6, 53.8, 1700, null, {}],
    ['Niedersachsen', 'GER', 9.4, 52.7, 7000, null, { oil: 2 }],
    ['NRW', 'GER', 7.4, 51.5, 13000, null, { steel: 8, aluminum: 1 }],
    ['Hessen', 'GER', 9.1, 50.6, 4000, null, {}],
    ['Rheinland-Pfalz', 'GER', 7.2, 49.9, 3000, null, { steel: 1 }],
    ['Baden-Württemberg', 'GER', 9.1, 48.6, 8000, null, { tungsten: 1 }],
    ['Bayern', 'GER', 11.5, 48.9, 9000, null, { aluminum: 1 }],
    ['Thüringen', 'GER', 11.1, 50.9, 2300, null, {}],
    ['Sachsen', 'GER', 13.3, 51, 4500, null, { steel: 2, tungsten: 2 }],
    ['Berlin-Brandenburg', 'GER', 13.4, 52.5, 5000, null, {}],
    ['Ostpreußen', 'GER', 20.4, 54.3, 2500, { de: 90, pl: 10 }, {}],
    ['Wien', 'AUT', 16.4, 48.2, 1900, null, {}],
    ['Niederösterreich', 'AUT', 15.2, 48.3, 1500, null, { oil: 1 }],
    ['Oberösterreich', 'AUT', 14, 48.1, 1100, null, { steel: 1 }],
    ['Salzburg', 'AUT', 13.1, 47.5, 530, null, {}],
    ['Tirol', 'AUT', 11.4, 47.2, 650, { at: 88, de: 8, it: 4 }, {}],
    ['Vorarlberg', 'AUT', 9.9, 47.2, 330, null, {}],
    ['Steiermark', 'AUT', 15.2, 47.2, 1200, { at: 92, sl: 8 }, { steel: 4 }],
    ['Kärnten', 'AUT', 14, 46.6, 450, { at: 85, sl: 15 }, { chromium: 1 }],
    ['Transdanubien', 'HUN', 17.6, 47.1, 2500, null, { aluminum: 5 }],
    ['Budapest', 'HUN', 19.1, 47.5, 2500, null, {}],
    ['Große Tiefebene', 'HUN', 20.6, 46.8, 2500, { hu: 94, ro: 3, sr: 3 }, { oil: 1 }],
    ['Nordungarn', 'HUN', 20.6, 48.1, 1500, { hu: 88, sk: 12 }, { steel: 2 }],
    ['Böhmen', 'CZE', 14.6, 50, 5000, { cz: 68, de: 30, sk: 2 }, { steel: 2 }],
    ['Mähren', 'CZE', 16.9, 49.4, 3200, { cz: 85, de: 12, sk: 3 }, { steel: 1 }],
    ['Slowakei', 'CZE', 19.4, 48.8, 2500, { sk: 80, hu: 15, cz: 5 }, { chromium: 1 }],
    ['Großpolen', 'POL', 17.1, 52.4, 3500, { pl: 92, de: 8 }, {}],
    ['Pommerellen', 'POL', 18.2, 54, 1200, { pl: 70, de: 30 }, {}],
    ['Masowien', 'POL', 21, 52.2, 4000, null, {}],
    ['Schlesien', 'POL', 17.6, 50.9, 3500, { pl: 70, de: 30 }, { steel: 5 }],
    ['Kleinpolen', 'POL', 20.2, 50, 3500, null, { oil: 1 }],
    ['Ostpolen', 'POL', 23.6, 52.4, 3500, { pl: 55, ua: 25, by: 20 }, {}],
    ['Piemont', 'ITA', 7.9, 45.1, 3500, null, { aluminum: 1 }],
    ['Lombardei', 'ITA', 9.8, 45.5, 5000, null, { steel: 2 }],
    ['Venetien', 'ITA', 12, 45.4, 4000, null, {}],
    ['Toskana', 'ITA', 11, 43.6, 3500, null, { tungsten: 1 }],
    ['Latium', 'ITA', 12.5, 42, 4000, null, {}],
    ['Kampanien', 'ITA', 14.7, 40.9, 4500, null, {}],
    ['Apulien', 'ITA', 16.5, 41, 3000, null, { aluminum: 1 }],
    ['Sizilien', 'ITA', 14, 37.6, 4000, null, { oil: 1 }],
    ['Slowenien', 'YUG', 14.8, 46, 1100, { sl: 90, de: 5, hr: 5 }, {}],
    ['Kroatien', 'YUG', 16, 45.4, 3000, { hr: 85, sr: 15 }, { aluminum: 1 }],
    ['Bosnien', 'YUG', 17.9, 44, 2500, { sr: 50, hr: 50 }, { aluminum: 3, steel: 1 }],
    ['Serbien', 'YUG', 20.5, 44.4, 4500, { sr: 85, hu: 8, hr: 7 }, { chromium: 3 }],
    ['Mazedonien', 'YUG', 21.6, 41.8, 2000, null, { chromium: 4 }],
    ['Siebenbürgen', 'ROM', 24, 46.1, 5000, { ro: 60, hu: 30, de: 10 }, { chromium: 1 }],
    ['Walachei', 'ROM', 25.5, 44.6, 6000, null, { oil: 8 }],
    ['Moldau', 'ROM', 27, 47.1, 3500, { ro: 85, ua: 15 }, {}],
    ['Weißrussland', 'SOV', 28, 53.6, 3000, { by: 75, ru: 15, pl: 10 }, {}],
    ['Westukraine', 'SOV', 29.5, 50.1, 8000, { ua: 90, pl: 10 }, { steel: 2 }],
    ['Ostukraine', 'SOV', 34.5, 49.4, 7000, { ua: 85, ru: 15 }, { aluminum: 2 }],
    ['Donbass', 'SOV', 37.8, 47.9, 3000, { ru: 50, ua: 50 }, { steel: 7, oil: 2 }],
    ['Krim', 'SOV', 34, 45.2, 1500, { ru: 60, ua: 40 }, {}],
    ['Smolensk', 'SOV', 32.3, 54.8, 4000, null, {}],
    ['Moskau', 'SOV', 37.2, 55.8, 6000, null, { aluminum: 1 }],
    ['Woronesch', 'SOV', 38.6, 51.7, 5000, null, { oil: 2, tungsten: 1 }],
    ['Galicien', 'ESP', -8, 42.7, 2200, null, { tungsten: 3 }],
    ['Kastilien', 'ESP', -4, 40.5, 7000, null, {}],
    ['Andalusien', 'ESP', -4.6, 37.6, 5000, null, { tungsten: 1, chromium: 1 }],
    ['Katalonien', 'ESP', 1.8, 41.7, 3500, { ca: 80, es: 20 }, {}],
    ['Schweiz', 'SUI', 8.2, 46.8, 4000, { ch: 65, de: 20, fr: 10, it: 5 }, { aluminum: 1 }],
    ['Dänemark', 'DEN', 9.5, 56, 3500, { dk: 92, de: 8 }, {}],
  ];

  // Terrain-Verteilung pro Staat (Rest = Ebene)
  const TERRAIN = {
    Schottland: { mountain: 0.4, hill: 0.4 }, Wales: { hill: 0.6, mountain: 0.2 }, Nordengland: { hill: 0.35 }, Bretagne: { forest: 0.3, hill: 0.2 },
    Lothringen: { forest: 0.3, hill: 0.3 }, Elsass: { forest: 0.4, mountain: 0.2 }, Burgund: { hill: 0.4 }, Provence: { hill: 0.3, mountain: 0.3 }, Okzitanien: { hill: 0.4 }, Aquitanien: { forest: 0.4 },
    'Mecklenburg-Vorpommern': { swamp: 0.3, forest: 0.3 }, Niedersachsen: { swamp: 0.2, forest: 0.2 }, Hessen: { forest: 0.5, hill: 0.3 }, 'Rheinland-Pfalz': { hill: 0.5, forest: 0.3 },
    'Baden-Württemberg': { forest: 0.5, hill: 0.3 }, Bayern: { forest: 0.35, mountain: 0.25, hill: 0.2 }, Thüringen: { forest: 0.5, hill: 0.3 }, Sachsen: { hill: 0.4, forest: 0.3 }, 'Berlin-Brandenburg': { forest: 0.3, swamp: 0.2 }, Ostpreußen: { forest: 0.4, swamp: 0.3 },
    Wien: { plains: 1 }, Niederösterreich: { hill: 0.4, forest: 0.2 }, Oberösterreich: { hill: 0.5, forest: 0.2 }, Salzburg: { mountain: 0.8 }, Tirol: { mountain: 0.9 }, Vorarlberg: { mountain: 0.8 }, Steiermark: { mountain: 0.5, hill: 0.3 }, Kärnten: { mountain: 0.6, hill: 0.2 },
    Transdanubien: { hill: 0.3, forest: 0.2 }, Nordungarn: { hill: 0.5, mountain: 0.2 }, Böhmen: { forest: 0.4, hill: 0.3 }, Mähren: { hill: 0.4, forest: 0.2 }, Slowakei: { mountain: 0.6, hill: 0.3 },
    Pommerellen: { forest: 0.4, swamp: 0.2 }, Masowien: { forest: 0.3, swamp: 0.15 }, Schlesien: { hill: 0.3, forest: 0.2 }, Kleinpolen: { hill: 0.4, mountain: 0.2 }, Ostpolen: { forest: 0.4, swamp: 0.4 },
    Piemont: { mountain: 0.6, hill: 0.2 }, Lombardei: { mountain: 0.3, plains: 0.5 }, Venetien: { mountain: 0.3, swamp: 0.2 }, Toskana: { hill: 0.7 }, Latium: { hill: 0.5 }, Kampanien: { hill: 0.4, mountain: 0.3 }, Apulien: { hill: 0.3 }, Sizilien: { hill: 0.4, mountain: 0.3 },
    Slowenien: { mountain: 0.6, forest: 0.3 }, Kroatien: { forest: 0.4, hill: 0.3 }, Bosnien: { mountain: 0.7, forest: 0.2 }, Serbien: { hill: 0.4, mountain: 0.3 }, Mazedonien: { mountain: 0.7, hill: 0.2 },
    Siebenbürgen: { mountain: 0.5, forest: 0.3 }, Walachei: { plains: 0.6, hill: 0.2 }, Moldau: { hill: 0.4, forest: 0.2 },
    Weißrussland: { swamp: 0.5, forest: 0.4 }, Westukraine: { forest: 0.3, hill: 0.3 }, Donbass: { hill: 0.3 }, Krim: { mountain: 0.3, desert: 0.2 }, Smolensk: { forest: 0.6, swamp: 0.2 }, Moskau: { forest: 0.5 }, Woronesch: { forest: 0.2, hill: 0.2 },
    Galicien: { mountain: 0.5, forest: 0.3 }, Kastilien: { hill: 0.4, desert: 0.3 }, Andalusien: { desert: 0.5, mountain: 0.3 }, Katalonien: { mountain: 0.4, hill: 0.3 }, Schweiz: { mountain: 0.85 }, Dänemark: { plains: 1 }, 'Schleswig-Holstein': { swamp: 0.25 },
  };
  const LAWS = { fascist: 'extended', communist: 'extended', democratic: 'limited', monarchist: 'limited' };
  function pickTerrain(name, rnd) {
    const t = TERRAIN[name] || {}; let r = rnd();
    for (const k in t) { if (r < t[k]) return k; r -= t[k]; }
    return 'plains';
  }

  const ALLIANCES = [
    ['Achsenmächte', ['GER', 'ITA', 'HUN']],
    ['Westmächte', ['GBR', 'FRA', 'POL']],
    ['Kleine Entente', ['CZE', 'YUG', 'ROM']],
  ];

  // ---------- Voronoi ----------
  function clip(poly, mx, my, nx, ny) {
    // behalte Punkte mit (p-m)·n <= 0
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const da = (a[0] - mx) * nx + (a[1] - my) * ny, db = (b[0] - mx) * nx + (b[1] - my) * ny;
      if (da <= 0) out.push(a);
      if (da <= 0 !== db <= 0) {
        const t = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  }
  G.voronoi = function (seeds, W, H_) {
    return seeds.map((s, i) => {
      let poly = [[0, 0], [W, 0], [W, H_], [0, H_]];
      const order = seeds.map((o, j) => [Math.hypot(o.x - s.x, o.y - s.y), j]).filter((a) => a[1] !== i).sort((a, b) => a[0] - b[0]);
      for (const [d, j] of order) {
        let maxR = 0;
        for (const p of poly) maxR = Math.max(maxR, Math.hypot(p[0] - s.x, p[1] - s.y));
        if (d / 2 > maxR) break;
        const o = seeds[j];
        poly = clip(poly, (s.x + o.x) / 2, (s.y + o.y) / 2, o.x - s.x, o.y - s.y);
        if (poly.length < 3) break;
      }
      // runden & Duplikate entfernen
      const r = [];
      for (const p of poly) {
        const q = [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
        const l = r[r.length - 1];
        if (!l || l[0] !== q[0] || l[1] !== q[1]) r.push(q);
      }
      if (r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1]) r.pop();
      return r;
    });
  };

  // Prüft eine (im Editor gebaute) Welt und macht sie spielbar
  G.validate = function (world) {
    const w = U.clone(world), warn = [];
    for (const pid in w.provinces) {
      const p = w.provinces[pid];
      p.terrain = p.terrain || 'plains';
      if (p.terrain === 'water') { p.state = null; p.port = false; p.city = null; continue; }
      if (!p.state || !w.states[p.state] || p.points.length < 3) { delete w.provinces[pid]; warn.push('Provinz ohne Staat entfernt: ' + p.name); }
    }
    for (const sid in w.states) {
      const s = w.states[sid];
      s.provinces = s.provinces.filter((id) => w.provinces[id] && w.provinces[id].state === sid);
      if (!s.provinces.length || !w.countries[s.owner]) { delete w.states[sid]; warn.push('Staat ohne Provinzen/Besitzer entfernt: ' + s.name); continue; }
      s.occupier = s.owner; s.unrest = 0;
      s.buildings = Object.assign({ civ: 0, mil: 0, power: 0 }, s.buildings);
      s.resources = Object.assign({ oil: 0, aluminum: 0, steel: 0, tungsten: 0, chromium: 0 }, s.resources);
      if (!Object.keys(s.pop || {}).length) s.pop = { [w.countries[s.owner].main]: 500 };
    }
    for (const pid in w.provinces) w.provinces[pid].occupier = null;
    for (const t in w.countries) {
      const c = w.countries[t], owned = Object.values(w.states).filter((s) => s.owner === t);
      if (!owned.length) { delete w.countries[t]; warn.push('Land ohne Staaten entfernt: ' + c.name); continue; }
      if (!c.capital || !w.states[c.capital] || w.states[c.capital].owner !== t) c.capital = owned[0].id;
      c.policies = Object.assign({ ethnicSuppression: false, warEconomy: false, education: false }, c.policies);
      c.law = c.law || 'limited';
    }
    w.alliances.forEach((a) => (a.members = a.members.filter((m) => w.countries[m])));
    return { world: w, warnings: warn };
  };

  G.emptyWorld = function (name) {
    return {
      version: 1, name: name || 'Neue Welt', width: 1400, height: 980,
      ethnicities: G.ETHNICITIES.map((e) => ({ ...e })),
      countries: {}, states: {}, provinces: {}, alliances: [], links: [],
    };
  };

  G.defaultWorld = function () {
    const W = 1400, Hh = 980;
    const rnd = U.rng(1936);
    const px = (lon) => (lon + 10) * 28, py = (lat) => (60 - lat) * 40;
    const world = G.emptyWorld('Mitteleuropa 1936');
    world.width = W; world.height = Hh; world.startDate = '1936-01-01';

    const wealth = {};
    COUNTRIES.forEach((c) => { wealth[c[0]] = c[7]; });

    // Seeds: Staatszentren + verrauschtes Gitter
    const seeds = [];
    STATES.forEach((s, i) => seeds.push({ x: px(s[2]), y: py(s[3]), state: i, center: true }));
    const sp = 50;
    for (let y = sp / 2; y < Hh; y += sp) for (let x = sp / 2; x < W; x += sp) {
      const sx = x + (rnd() - 0.5) * sp * 0.6, sy = y + (rnd() - 0.5) * sp * 0.6;
      if (seeds.some((s) => s.center && Math.hypot(s.x - sx, s.y - sy) < 30)) continue;
      let best = -1, bd = Infinity;
      STATES.forEach((s, i) => { const d = Math.hypot(px(s[2]) - sx, py(s[3]) - sy); if (d < bd) { bd = d; best = i; } });
      seeds.push({ x: sx, y: sy, state: bd < 76 ? best : -1, near: bd });
    }
    const cells = G.voronoi(seeds, W, Hh);

    // Staaten & Länder
    COUNTRIES.forEach((c) => {
      world.countries[c[0]] = {
        tag: c[0], name: c[1], color: c[2], ideology: c[3], main: c[4], integrated: c[5].slice(), capital: null,
        policies: { ethnicSuppression: false, warEconomy: false, education: false }, law: LAWS[c[3]], flag: c[8],
      };
    });
    const stateIds = [];
    STATES.forEach((s, i) => {
      const id = 's' + (i + 1);
      stateIds.push(id);
      const c = world.countries[s[1]];
      const main = c.main;
      const eth = s[5] || { [main]: 100 };
      const pop = {};
      Object.keys(eth).forEach((k) => { pop[k] = Math.round((s[4] * eth[k]) / 100); });
      const gdp = Math.round(s[4] * 0.07 * wealth[s[1]]);
      const civ = Math.max(1, Math.round(gdp / 120)), mil = Math.max(0, Math.round(gdp / 260));
      const power = Math.max(1, Math.max(1, Math.round(((civ + mil) * H.data.POWER_USE) / H.data.POWER_OUTPUT * 1.05)));
      world.states[id] = {
        id, name: s[0], owner: s[1], occupier: s[1], provinces: [], resources: { oil: 0, aluminum: 0, steel: 0, tungsten: 0, chromium: 0, ...s[6] },
        pop, gdp, buildings: { civ, mil, power }, slots: civ + mil + power + Math.max(2, Math.round(gdp / 250)), unrest: 0,
      };
      if (s[0] === c.capital || (COUNTRIES.find((k) => k[0] === s[1])[6] === s[0])) c.capital = id;
    });

    // Provinzen (nur Land)
    let pn = 0;
    const count = {};
    cells.forEach((poly, i) => {
      const sd = seeds[i];
      if (poly.length < 3) return;
      if (sd.state < 0) {
        if (sd.near > 150) return; // ferne See: nicht modelliert
        pn++;
        const wid = 'p' + pn;
        world.provinces[wid] = { id: wid, name: 'Meer ' + wid.slice(1), points: poly, state: null, terrain: 'water', occupier: null };
        return;
      }
      pn++;
      const pid = 'p' + pn, st = world.states[stateIds[sd.state]];
      count[st.id] = (count[st.id] || 0) + 1;
      world.provinces[pid] = { id: pid, name: st.name + ' ' + count[st.id], points: poly, state: st.id, terrain: pickTerrain(st.name, rnd), occupier: null };
      st.provinces.push(pid);
    });
    // Städte (Hauptprovinz jedes Staates) und Häfen an der Küste
    const adj = U.adjacency(world.provinces, 2);
    for (const sid in world.states) {
      const st = world.states[sid], p = world.provinces[st.provinces[0]];
      const pop = Object.values(st.pop).reduce((a, b) => a + b, 0);
      p.city = { name: st.name, size: pop > 5000 ? 3 : pop > 2500 ? 2 : 1 };
      if (p.terrain === 'mountain' || p.terrain === 'swamp') p.terrain = 'plains';
    }
    for (const pid in world.provinces) {
      const p = world.provinces[pid];
      if (p.terrain === 'water') continue;
      let coast = false; adj[pid].forEach((n) => { if (world.provinces[n].terrain === 'water') coast = true; });
      if (coast && (p.city || rnd() < 0.3)) p.port = true;
    }

    ALLIANCES.forEach((a, i) => world.alliances.push({ id: 'a' + (i + 1), name: a[0], members: a[1].slice() }));
    return world;
  };
})(window.HOG);
