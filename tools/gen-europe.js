/* Erzeugt js/world-europe2020.js aus Natural-Earth-Ländergrenzen.
 * Aufruf:  node tools/gen-europe.js <ne_50m_admin_0_countries.geojson> [Ausgabedatei]
 * Benötigt:  npm install polygon-clipping  (nur für den Generator, nicht für das Spiel)
 * Das Ergebnis ist bereits eingecheckt – der Generator wird nur zum Neuerzeugen gebraucht. */
const fs = require('fs'), path = require('path');
const pc = require('polygon-clipping');
global.window = global; global.document = {};
for (const f of ['util', 'data', 'flag', 'worldgen']) require(path.join(__dirname, '..', 'js', f + '.js'));
const H = window.HOG, U = H.util, D = H.data;
const DATA = require('./europe-data.js');

const geo = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] || path.join(__dirname, '..', 'js', 'world-europe2020.js');

// ---- Projektion ----
const LON0 = -11, LON1 = 51.5, LAT0 = 34.5, LAT1 = 71.5, KY = 34, KX = KY * Math.cos((52 * Math.PI) / 180);
const W = Math.round((LON1 - LON0) * KX), HH = Math.round((LAT1 - LAT0) * KY);
const proj = (lon, lat) => [(lon - LON0) * KX, (LAT1 - lat) * KY];
const BOX = [[[0, 0], [W, 0], [W, HH], [0, HH], [0, 0]]];

function dp(pts, tol) { // Douglas-Peucker (offener Linienzug)
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let m = -1, md = 0;
    for (let i = a + 1; i < b; i++) { const d = U.nearOnSeg(pts[i][0], pts[i][1], pts[a][0], pts[a][1], pts[b][0], pts[b][1]).d; if (d > md) { md = d; m = i; } }
    if (md > tol && m > 0) { keep[m] = 1; stack.push([a, m], [m, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
function simplifyRing(ring, tol) { // ring geschlossen (erster = letzter)
  const r = dp(ring, tol);
  return r.length >= 4 ? r : ring;
}
const ringArea = (r) => { let a = 0; for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return Math.abs(a / 2); };

// Geometrie → MultiPolygon in Pixelkoordinaten, am Fenster beschnitten und vereinfacht
function toMulti(geom, tol) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  let multi = polys.map((p) => p.map((ring) => ring.map(([lo, la]) => proj(lo, la))));
  const clipped = [];
  for (const p of multi) {
    const bb = U.bbox(p[0]);
    if (bb[2] < 0 || bb[0] > W || bb[3] < 0 || bb[1] > HH) continue;
    let res; try { res = pc.intersection(p, BOX); } catch (e) { continue; }
    res.forEach((q) => clipped.push(q));
  }
  return clipped
    .filter((p) => ringArea(p[0]) > 60)
    .map((p) => p.map((ring, i) => (i === 0 ? simplifyRing(ring, tol) : simplifyRing(ring, tol))));
}
function inMulti(x, y, multi) {
  for (const p of multi) {
    if (!U.pointInPoly(x, y, p[0].slice(0, -1))) continue;
    let hole = false; for (let i = 1; i < p.length; i++) if (U.pointInPoly(x, y, p[i].slice(0, -1))) { hole = true; break; }
    if (!hole) return true;
  }
  return false;
}

// ---- Länder einlesen ----
// Die Krim (international anerkannt: Ukraine) liegt in den Rohdaten bei Russland – hier umhängen
(function fixCrimea() {
  const rus = geo.features.find((f) => f.properties.ADM0_A3 === 'RUS'), ukr = geo.features.find((f) => f.properties.ADM0_A3 === 'UKR');
  if (!rus || !ukr || rus.geometry.type !== 'MultiPolygon') return;
  const i = rus.geometry.coordinates.findIndex((p) => U.pointInPoly(34.1, 44.95, p[0]));
  if (i < 0) return;
  const [cr] = rus.geometry.coordinates.splice(i, 1);
  if (ukr.geometry.type === 'Polygon') ukr.geometry = { type: 'MultiPolygon', coordinates: [ukr.geometry.coordinates] };
  ukr.geometry.coordinates.push(cr);
})();
const byA3 = {}; geo.features.forEach((f) => { byA3[f.properties.ADM0_A3] = f; });
const alias = { KOS: 'KOS' };
const shapes = {}, allLand = [];
const includeTags = new Set(DATA.COUNTRIES.map((c) => c[0]));
const kos = geo.features.find((f) => /kosovo/i.test(f.properties.NAME));
geo.features.forEach((f) => {
  let tag = f.properties.ADM0_A3; if (kos === f) tag = 'KOS';
  const m = toMulti(f.geometry, 0.7);
  if (!m.length) return;
  if (includeTags.has(tag)) shapes[tag] = m;
  m.forEach((p) => allLand.push({ poly: p, bb: U.bbox(p[0]) }));
});
const missing = [...includeTags].filter((t) => !shapes[t]); if (missing.length) console.error('Fehlende Länder:', missing);

// ---- Seeds + Voronoi pro Land ----
const rnd = U.rng(2020);
const SP = 44;
const provinces = [], states = {}, countries = {};
let pn = 0, sn = 0;
const warnings = [];
const stateRowsByCountry = {};
DATA.STATES.forEach((r) => { (stateRowsByCountry[r[1]] = stateRowsByCountry[r[1]] || []).push(r); });

const ethList = DATA.ETHNICITIES.map((e) => ({ id: e[0], name: e[1], color: e[2] }));
const allCityProv = {};

function inside(shape, x, y) { return inMulti(x, y, shape); }
function nearInside(shape, x, y) {
  if (inside(shape, x, y)) return [x, y];
  for (let r = 3; r <= 26; r += 3) for (let a = 0; a < 16; a++) {
    const px = x + Math.cos((a * Math.PI) / 8) * r, py = y + Math.sin((a * Math.PI) / 8) * r;
    if (inside(shape, px, py)) return [px, py];
  }
  return null;
}
function rep(poly) { // Punkt im Polygon
  const c = U.centroid(poly[0].slice(0, -1));
  if (inMulti(c[0], c[1], [poly])) return c;
  const bb = U.bbox(poly[0]);
  for (let i = 0; i < 40; i++) { const x = bb[0] + rnd() * (bb[2] - bb[0]), y = bb[1] + rnd() * (bb[3] - bb[1]); if (inMulti(x, y, [poly])) return [x, y]; }
  return null;
}

for (const c of DATA.COUNTRIES) {
  const tag = c[0], shape = shapes[tag];
  if (!shape) continue;
  const rows = stateRowsByCountry[tag] || [];
  const seeds = [];
  // Staatszentren
  const sIdx = [];
  rows.forEach((r) => {
    const [x, y] = proj(r[3], r[4]);
    const pt = nearInside(shape, x, y);
    if (!pt) { warnings.push('Zentrum außerhalb: ' + r[0] + ' (' + r[2] + ')'); return; }
    seeds.push({ x: pt[0], y: pt[1], row: r, center: true }); sIdx.push(seeds.length - 1);
  });
  const centers = seeds.slice();
  // Gitter
  const bb = U.bbox([].concat(...shape.map((p) => p[0])));
  for (let y = bb[1]; y < bb[3]; y += SP) for (let x = bb[0]; x < bb[2]; x += SP) {
    const sx = x + (rnd() - 0.5) * SP * 0.55, sy = y + (rnd() - 0.5) * SP * 0.55;
    if (!inside(shape, sx, sy)) continue;
    if (centers.some((s) => Math.hypot(s.x - sx, s.y - sy) < SP * 0.62)) continue;
    seeds.push({ x: sx, y: sy });
  }
  // Inseln ohne Seed
  shape.forEach((poly) => {
    if (seeds.some((s) => inMulti(s.x, s.y, [poly]))) return;
    const p = rep(poly); if (p) seeds.push({ x: p[0], y: p[1] });
  });
  // Staat je Seed = nächstes Zentrum
  seeds.forEach((s) => {
    if (s.row) return;
    let best = null, bd = Infinity;
    centers.forEach((ct) => { const d = Math.hypot(ct.x - s.x, ct.y - s.y); if (d < bd) { bd = d; best = ct; } });
    s.row = best ? best.row : null; s.nearest = true;
  });
  if (!seeds.length) continue;
  const cells = seeds.length === 1 ? [[[0, 0], [W, 0], [W, HH], [0, HH]]] : H.worldgen.voronoi(seeds, W, HH);

  // Land registrieren
  const info = {
    tag, name: c[1], color: c[3], ideology: c[4], main: c[2], integrated: c[9], capital: null, law: c[10],
    policies: { ethnicSuppression: false, warEconomy: false, education: false }, flag: c[8],
  };
  countries[tag] = info;
  const wsum = rows.reduce((a, r) => a + r[5], 0);
  const stateIdByRow = new Map();
  rows.forEach((r) => {
    if (!seeds.some((s) => s.row === r)) return;
    const id = 's' + ++sn; stateIdByRow.set(r, id);
    const pop = (c[6] * r[5]) / wsum;
    const eth = r[6] || { [c[2]]: 100 };
    const popm = {}; for (const k in eth) popm[k] = Math.round((pop * eth[k]) / 100);
    const gdp = Math.round(pop * 0.07 * c[5]);
    const civ = Math.max(1, Math.round(gdp / 120)), mil = Math.max(0, Math.round(gdp / 260));
    states[id] = {
      id, name: r[0], owner: tag, occupier: tag, provinces: [], resources: { oil: 0, aluminum: 0, steel: 0, tungsten: 0, chromium: 0, ...(r[7] || {}) },
      pop: popm, gdp, buildings: { civ, mil, power: Math.max(0, Math.round(((civ + mil) * D.POWER_USE) / D.POWER_OUTPUT)) },
      slots: 0, unrest: 0,
    };
    const st = states[id]; st.slots = st.buildings.civ + st.buildings.mil + st.buildings.power + Math.max(2, Math.round(gdp / 250));
    if (r[0] === c[7] || r[2] === c[7]) info.capital = id;
  });
  if (!info.capital) info.capital = [...stateIdByRow.values()][0];

  seeds.forEach((s, i) => {
    let res;
    try { res = pc.intersection([cells[i].concat([cells[i][0]])], shape); } catch (e) { warnings.push('Clip-Fehler ' + tag); return; }
    res.forEach((poly, k) => {
      const ring = simplifyRing(poly[0], 0.5).slice(0, -1);
      if (ring.length < 3 || U.area(ring) < 25) return;
      const sid = s.row ? stateIdByRow.get(s.row) : null;
      if (!sid) return;
      const id = 'p' + ++pn;
      const cen = U.centroid(ring);
      const lon = cen[0] / KX + LON0, lat = LAT1 - cen[1] / KY;
      let terr = 'plains';
      for (const [a, b, c1, d, t, pr] of DATA.TERRAIN_RULES) if (lon >= a && lon <= b && lat >= c1 && lat <= d && rnd() < pr) { terr = t; break; }
      const p = { id, name: states[sid].name + ' ' + (states[sid].provinces.length + 1), points: ring.map((q) => [Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10]), state: sid, terrain: terr, occupier: null };
      provinces.push(p); states[sid].provinces.push(id);
      if (s.center && k === 0) allCityProv[sid] = { id, city: s.row[2] };
    });
  });
}

// Staaten ohne Provinzen entfernen
for (const sid in states) if (!states[sid].provinces.length) { warnings.push('Staat ohne Provinzen entfernt: ' + states[sid].name); delete states[sid]; }

// ---- Wasser ----
const oceanSeeds = [];
for (let y = SP / 2; y < HH; y += SP) for (let x = SP / 2; x < W; x += SP) {
  const sx = x + (rnd() - 0.5) * SP * 0.6, sy = y + (rnd() - 0.5) * SP * 0.6;
  if (allLand.some((l) => sx >= l.bb[0] && sx <= l.bb[2] && sy >= l.bb[1] && sy <= l.bb[3] && inMulti(sx, sy, [l.poly]))) continue;
  oceanSeeds.push({ x: sx, y: sy });
}
const landPts = provinces.map((p) => U.centroid(p.points));
const wcells = H.worldgen.voronoi(oceanSeeds, W, HH);
let waterCount = 0;
oceanSeeds.forEach((s, i) => {
  let near = Infinity; for (const c of landPts) { const d = Math.hypot(c[0] - s.x, c[1] - s.y); if (d < near) near = d; }
  if (near > 105) return;
  const cell = wcells[i]; if (cell.length < 3) return;
  const cb = U.bbox(cell);
  const lands = allLand.filter((l) => !(l.bb[2] < cb[0] || l.bb[0] > cb[2] || l.bb[3] < cb[1] || l.bb[1] > cb[3])).map((l) => l.poly);
  let res;
  try { res = lands.length ? pc.difference([cell.concat([cell[0]])], ...lands) : [[cell.concat([cell[0]])]]; } catch (e) { return; }
  res.forEach((poly) => {
    const ring = simplifyRing(poly[0], 0.5).slice(0, -1);
    if (ring.length < 3 || U.area(ring) < 60) return;
    const id = 'p' + ++pn; waterCount++;
    provinces.push({ id, name: 'Meer ' + waterCount, points: ring.map((q) => [Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10]), state: null, terrain: 'water', occupier: null });
  });
});

// ---- Welt zusammenbauen ----
const world = H.worldgen.emptyWorld('Europa 2020');
world.width = W; world.height = HH; world.startDate = '2020-01-01';
world.ethnicities = ethList;
world.startTechs = ['inf1', 'inf2', 'art1', 'art2', 'armor0', 'armor1', 'air0', 'air1', 'nav1', 'ind1', 'con1', 'en1', 'eco1', 'res1', 'edu1', 'pop1'];
world.countries = countries; world.states = states;
provinces.forEach((p) => { world.provinces[p.id] = p; });
// Städte & Häfen
const adj = U.adjacency(world.provinces, 2);
for (const sid in states) {
  const cp = allCityProv[sid]; if (!cp) continue;
  const p = world.provinces[cp.id]; const pop = Object.values(states[sid].pop).reduce((a, b) => a + b, 0);
  p.city = { name: cp.city, size: pop > 4000 ? 3 : pop > 1500 ? 2 : 1 };
  if (p.terrain === 'mountain' || p.terrain === 'swamp') p.terrain = 'plains';
}
let ports = 0;
for (const pid in world.provinces) {
  const p = world.provinces[pid]; if (p.terrain === 'water') continue;
  let coast = false; adj[pid].forEach((n) => { if (world.provinces[n].terrain === 'water') coast = true; });
  if (coast && (p.city || rnd() < 0.25)) { p.port = true; ports++; }
}
DATA.ALLIANCES.forEach((a, i) => world.alliances.push({ id: 'a' + (i + 1), name: a[0], members: a[1].filter((t) => countries[t]) }));

const v = H.worldgen.validate(world);
console.error('Länder', Object.keys(v.world.countries).length, 'Staaten', Object.keys(v.world.states).length, 'Provinzen', Object.keys(v.world.provinces).length, '(Wasser', waterCount + ')', 'Häfen', ports);
if (warnings.length) console.error('Warnungen:\n ' + warnings.join('\n '));
if (v.warnings.length) console.error('Validierung:\n ' + v.warnings.slice(0, 20).join('\n '));
const js = '/* automatisch erzeugt von tools/gen-europe.js – Europa 2020 (Natural-Earth-Grenzen) */\nwindow.HOG = window.HOG || {};\nHOG.worlds = HOG.worlds || {};\nHOG.worlds.europe2020 = ' + U.toJSON(v.world) + ';\n';
fs.writeFileSync(out, js);
console.error('geschrieben:', out, Math.round(js.length / 1024) + ' KB');
