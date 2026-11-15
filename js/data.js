/* Hearts of Gold – Spieldaten (modular: neue Einheiten, Techs, Ideologien hier eintragen) */
window.HOG = window.HOG || {};
(function (H) {
  const D = (H.data = {});

  D.RESOURCES = [
    { id: 'oil', name: 'Öl', icon: '🛢️' },
    { id: 'aluminum', name: 'Aluminium', icon: '🔩' },
    { id: 'steel', name: 'Stahl', icon: '⚙️' },
    { id: 'tungsten', name: 'Wolfram', icon: '⚫' },
    { id: 'chromium', name: 'Chrom', icon: '🪙' },
  ];

  // Modifikatoren: gdp = BIP-Faktor, prod = Rüstungsausstoß, research, manpower, unrest = Grundunruhe
  D.IDEOLOGIES = {
    democratic: { name: 'Demokratisch', color: '#3b82c4', gdp: 1.12, prod: 0.9, research: 1.1, manpower: 0.9, unrest: 0 },
    fascist: { name: 'Faschistisch', color: '#6b4a2b', gdp: 0.95, prod: 1.2, research: 0.95, manpower: 1.15, unrest: 6 },
    communist: { name: 'Kommunistisch', color: '#c0392b', gdp: 0.95, prod: 1.1, research: 1.0, manpower: 1.2, unrest: 4 },
    monarchist: { name: 'Monarchistisch', color: '#8e44ad', gdp: 1.0, prod: 1.0, research: 0.95, manpower: 1.0, unrest: 2 },
  };

  // Landesregeln (an/aus). effects werden in sim.js generisch ausgewertet.
  D.POLICIES = {
    ethnicSuppression: {
      name: 'Ethnische Unterdrückung',
      desc: 'Nicht-integrierte Minderheiten schrumpfen schnell, die eigene Ethnie wächst – aber mehr Chaos (Unruhe) in den Staaten.',
      effects: { minorityDecay: 0.0016, unrestFlat: 22 },
    },
    warEconomy: {
      name: 'Kriegswirtschaft',
      desc: '+25% Rüstungsausstoß, dafür −10% BIP-Einnahmen.',
      effects: { prod: 1.25, gdp: 0.9 },
    },
    education: {
      name: 'Bildungsoffensive',
      desc: '+20% Forschung, dafür −5% BIP-Einnahmen.',
      effects: { research: 1.2, gdp: 0.95 },
    },
  };

  D.BUILDINGS = {
    civ: { name: 'Zivilfabrik', icon: '🏭', cost: 150, work: 500, gdp: 30 },
    mil: { name: 'Rüstungsfabrik', icon: '⚒️', cost: 200, work: 650, gdp: 12 },
    power: { name: 'Kraftwerk', icon: '⚡', cost: 120, work: 380, gdp: 15 },
  };
  D.POWER_OUTPUT = 5; // Energie pro Kraftwerk
  D.POWER_USE = 1;
  D.TRADE_PRICE = 4; // Geld pro Ressourceneinheit beim Zukauf // Verbrauch pro Fabrik

  // Feste Truppen (kein Designer). atk/def/hp, speed in Pixel/Tag, cost in Produktionspunkten
  D.UNITS = {
    infantry: { name: 'Infanterie', icon: '🪖', atk: 4, def: 6, hp: 100, speed: 22, pp: 50, manpower: 10, res: { steel: 2 }, upkeep: 0.05, tech: null },
    artillery: { name: 'Artillerie', icon: '💣', atk: 9, def: 2, hp: 70, speed: 18, pp: 90, manpower: 5, res: { steel: 5 }, upkeep: 0.08, tech: null },
    tank: { name: 'Panzer', icon: '🛡️', atk: 11, def: 8, hp: 140, speed: 40, pp: 180, manpower: 4, res: { steel: 8, chromium: 4, oil: 4 }, upkeep: 0.15, tech: 'armor0' },
    fighter: { name: 'Jagdgeschwader', icon: '✈️', atk: 7, def: 3, hp: 60, speed: 95, pp: 150, manpower: 3, res: { aluminum: 8, oil: 4, tungsten: 3 }, upkeep: 0.14, air: true, tech: 'air0' },
  };

  // Forschungsbaum. effects: unlock, atk{unit:+%}, def{}, hp{}, speed{}, gdp, civ, mil, research, energy, resource, manpower
  D.TECHS = [
    // Infanterie
    { id: 'inf1', branch: 'Infanterie', name: 'Repetiergewehre', cost: 90, req: [], effects: { atk: { infantry: 0.1 } } },
    { id: 'inf2', branch: 'Infanterie', name: 'Stahlhelme & Schanzen', cost: 150, req: ['inf1'], effects: { def: { infantry: 0.12 } } },
    { id: 'inf3', branch: 'Infanterie', name: 'Sturmtruppen', cost: 230, req: ['inf2'], effects: { atk: { infantry: 0.15 }, speed: { infantry: 0.1 } } },
    { id: 'inf4', branch: 'Infanterie', name: 'Sturmgewehre', cost: 360, req: ['inf3'], effects: { atk: { infantry: 0.2 }, hp: { infantry: 0.1 } } },
    // Artillerie
    { id: 'art1', branch: 'Artillerie', name: 'Feldhaubitzen', cost: 110, req: [], effects: { atk: { artillery: 0.12 } } },
    { id: 'art2', branch: 'Artillerie', name: 'Schwere Geschütze', cost: 200, req: ['art1'], effects: { atk: { artillery: 0.18 }, hp: { artillery: 0.1 } } },
    { id: 'art3', branch: 'Artillerie', name: 'Raketenwerfer', cost: 320, req: ['art2'], effects: { atk: { artillery: 0.25 } } },
    // Panzer
    { id: 'armor0', branch: 'Panzer', name: 'Motorisierung (Panzer)', cost: 140, req: [], effects: { unlock: 'tank' } },
    { id: 'armor1', branch: 'Panzer', name: 'Verstärkte Panzerung', cost: 220, req: ['armor0'], effects: { def: { tank: 0.15 }, hp: { tank: 0.1 } } },
    { id: 'armor2', branch: 'Panzer', name: 'Hochgeschwindigkeitsmotoren', cost: 300, req: ['armor1'], effects: { atk: { tank: 0.15 }, speed: { tank: 0.15 } } },
    { id: 'armor3', branch: 'Panzer', name: 'Kampfpanzer', cost: 420, req: ['armor2'], effects: { atk: { tank: 0.25 }, def: { tank: 0.2 } } },
    // Luftwaffe
    { id: 'air0', branch: 'Luftwaffe', name: 'Jagdflugzeuge', cost: 140, req: [], effects: { unlock: 'fighter' } },
    { id: 'air1', branch: 'Luftwaffe', name: 'Bessere Triebwerke', cost: 220, req: ['air0'], effects: { atk: { fighter: 0.15 }, speed: { fighter: 0.1 } } },
    { id: 'air2', branch: 'Luftwaffe', name: 'Bordkanonen', cost: 320, req: ['air1'], effects: { atk: { fighter: 0.2 }, hp: { fighter: 0.15 } } },
    { id: 'air3', branch: 'Luftwaffe', name: 'Strahlantrieb', cost: 460, req: ['air2'], effects: { atk: { fighter: 0.3 }, def: { fighter: 0.2 } } },
    // Industrie
    { id: 'ind1', branch: 'Industrie', name: 'Fließbandfertigung', cost: 100, req: [], effects: { mil: 0.1 } },
    { id: 'ind2', branch: 'Industrie', name: 'Massenproduktion', cost: 200, req: ['ind1'], effects: { mil: 0.15 } },
    { id: 'ind3', branch: 'Industrie', name: 'Automatisierung', cost: 340, req: ['ind2'], effects: { mil: 0.2 } },
    { id: 'con1', branch: 'Industrie', name: 'Baukräne', cost: 100, req: [], effects: { civ: 0.15 } },
    { id: 'con2', branch: 'Industrie', name: 'Vorgefertigte Bauteile', cost: 210, req: ['con1'], effects: { civ: 0.2 } },
    { id: 'en1', branch: 'Industrie', name: 'Turbinen', cost: 120, req: [], effects: { energy: 0.15 } },
    { id: 'en2', branch: 'Industrie', name: 'Hochspannungsnetz', cost: 240, req: ['en1'], effects: { energy: 0.2 } },
    // Wirtschaft & Gesellschaft
    { id: 'eco1', branch: 'Wirtschaft', name: 'Verwaltungsreform', cost: 110, req: [], effects: { gdp: 0.06 } },
    { id: 'eco2', branch: 'Wirtschaft', name: 'Freihandel', cost: 220, req: ['eco1'], effects: { gdp: 0.08 } },
    { id: 'eco3', branch: 'Wirtschaft', name: 'Planwirtschaft / Markt', cost: 340, req: ['eco2'], effects: { gdp: 0.1 } },
    { id: 'res1', branch: 'Wirtschaft', name: 'Moderner Bergbau', cost: 130, req: [], effects: { resource: 0.12 } },
    { id: 'res2', branch: 'Wirtschaft', name: 'Tiefbohrungen', cost: 250, req: ['res1'], effects: { resource: 0.18 } },
    { id: 'edu1', branch: 'Wirtschaft', name: 'Universitäten', cost: 120, req: [], effects: { research: 0.12 } },
    { id: 'edu2', branch: 'Wirtschaft', name: 'Forschungsinstitute', cost: 240, req: ['edu1'], effects: { research: 0.18 } },
    { id: 'pop1', branch: 'Wirtschaft', name: 'Mobilmachung', cost: 160, req: [], effects: { manpower: 0.15 } },
    { id: 'pop2', branch: 'Wirtschaft', name: 'Allgemeine Wehrpflicht', cost: 280, req: ['pop1'], effects: { manpower: 0.2 } },
  ];

  D.SPEEDS = [0, 900, 450, 180, 60]; // ms pro Tag, 0 = Pause
  D.START_DATE = '1936-01-01';

  D.PATTERNS = {
    solid: 'Einfarbig', h2: '2 Streifen (waagerecht)', h3: '3 Streifen (waagerecht)', v3: '3 Streifen (senkrecht)',
    cross: 'Kreuz', nordic: 'Nordisches Kreuz', saltire: 'Andreaskreuz', diag: 'Diagonale', canton: 'Obereck', triangle: 'Dreieck links',
  };
  D.EMBLEMS = { none: 'Kein Emblem', star: 'Stern', circle: 'Kreis', diamond: 'Raute', cross: 'Kreuz' };
})(window.HOG);
