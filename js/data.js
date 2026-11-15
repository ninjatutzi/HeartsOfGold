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
    port: { name: 'Hafen', icon: '⚓', cost: 180, work: 450, gdp: 10, prov: true }, // pro Provinz, braucht angrenzendes Wasser
  };
  D.POWER_OUTPUT = 5; // Energie pro Kraftwerk
  D.POWER_USE = 1.1;
  D.MOVE_SCALE = 0.5; // Bewegungstempo aller Einheiten
  D.PP_SCALE = 0.35; // Rüstungsausstoß pro Fabrik
  D.RESEARCH_SCALE = 0.4; // Forschungstempo
  D.TRAIN_SCALE = 1.5; // Ausbildungsdauer
  D.TRADE_PRICE = 3; // Geld pro importierter Ressourceneinheit und Tag

  // Ausrüstung: pp = Produktionspunkte pro Stück, res = Ressourcenverbrauch pro Fabrik und Tag
  D.EQUIPMENT = {
    rifles: { name: 'Gewehre', icon: '🔫', pp: 5, res: { steel: 1 }, unit: 'infantry' },
    guns: { name: 'Geschütze', icon: '💣', pp: 15, res: { steel: 2 }, unit: 'artillery' },
    tanks: { name: 'Panzer', icon: '🛡️', pp: 30, res: { steel: 3, chromium: 1, oil: 1 }, unit: 'tank' },
    planes: { name: 'Flugzeuge', icon: '✈️', pp: 25, res: { aluminum: 2, oil: 1, tungsten: 0.5 }, unit: 'fighter' },
    destroyers: { name: 'Zerstörer-Rümpfe', icon: '🚢', pp: 60, res: { steel: 2, oil: 1 }, unit: 'destroyer' },
    cruisers: { name: 'Kreuzer-Rümpfe', icon: '🚢', pp: 120, res: { steel: 3, chromium: 1, oil: 1.5 }, unit: 'cruiser' },
    battleships: { name: 'Schlachtschiff-Rümpfe', icon: '🚢', pp: 240, res: { steel: 4, chromium: 2, oil: 2 }, unit: 'battleship' },
  };

  // Feste Truppen (kein Designer). eq/n = benötigte Ausrüstung, manpower in K, train = Ausbildungstage
  D.UNITS = {
    infantry: { name: 'Infanterie', icon: '🪖', atk: 4, def: 6, hp: 100, speed: 22, eq: 'rifles', n: 10, manpower: 10, train: 10, upkeep: 0.05, tech: null },
    artillery: { name: 'Artillerie', icon: '💥', atk: 9, def: 2, hp: 70, speed: 18, eq: 'guns', n: 6, manpower: 5, train: 14, upkeep: 0.08, tech: null },
    tank: { name: 'Panzer', icon: '🛡️', atk: 11, def: 8, hp: 140, speed: 40, eq: 'tanks', n: 6, manpower: 4, train: 18, upkeep: 0.15, tech: 'armor0' },
    fighter: { name: 'Jagdgeschwader', icon: '✈️', atk: 7, def: 3, hp: 60, speed: 95, eq: 'planes', n: 6, manpower: 3, train: 20, upkeep: 0.14, air: true, tech: 'air0' },
    destroyer: { name: 'Zerstörer', icon: '🚢', atk: 6, def: 4, hp: 80, speed: 70, eq: 'destroyers', n: 1, manpower: 2, train: 15, upkeep: 0.1, naval: true, tech: null },
    cruiser: { name: 'Kreuzer', icon: '🚢', atk: 10, def: 7, hp: 150, speed: 60, eq: 'cruisers', n: 1, manpower: 3, train: 20, upkeep: 0.2, naval: true, tech: 'nav1' },
    battleship: { name: 'Schlachtschiff', icon: '🚢', atk: 18, def: 12, hp: 300, speed: 45, eq: 'battleships', n: 1, manpower: 5, train: 30, upkeep: 0.4, naval: true, tech: 'nav2' },
  };
  D.TRANSPORT_SPEED = 35; // Landeinheiten auf See (verwandeln sich in Transportschiffe ohne Geschütze)

  // Terrain: def = Verteidigerbonus, atk = Angreifer-Multiplikator, move = Bewegungsmultiplikator
  D.TERRAINS = {
    plains: { name: 'Ebene', def: 1.0, atk: 1.0, move: 1.0 },
    forest: { name: 'Wald', def: 1.15, atk: 0.9, move: 0.8 },
    hill: { name: 'Hügel', def: 1.25, atk: 0.85, move: 0.75 },
    mountain: { name: 'Gebirge', def: 1.5, atk: 0.7, move: 0.5 },
    swamp: { name: 'Sumpf', def: 1.1, atk: 0.75, move: 0.55 },
    desert: { name: 'Wüste', def: 1.0, atk: 0.95, move: 0.75 },
    water: { name: 'Wasser (unpassierbar für Landtruppen)', def: 1, atk: 1, move: 1 },
  };
  D.CITY_SIZES = { 1: 'Stadt', 2: 'Großstadt', 3: 'Metropole' };

  // Mannstärke-Regeln: pct = Anteil der Bevölkerung, der rekrutierbar ist; gdp = Wirtschaftsfaktor
  D.MANPOWER_LAWS = {
    volunteer: { name: 'Freiwilligenarmee', pct: 0.015, gdp: 1.0, desc: '1,5 % der Bevölkerung, keine Wirtschaftskosten.' },
    limited: { name: 'Eingeschränkte Wehrpflicht', pct: 0.03, gdp: 0.98, desc: '3 %, −2 % BIP.' },
    extended: { name: 'Erweiterte Wehrpflicht', pct: 0.05, gdp: 0.94, desc: '5 %, −6 % BIP.' },
    service: { name: 'Dienstpflicht', pct: 0.08, gdp: 0.88, desc: '8 %, −12 % BIP.' },
    total: { name: 'Totale Mobilmachung', pct: 0.12, gdp: 0.78, desc: '12 %, −22 % BIP.' },
  };
  D.MINORITY_MANPOWER = 0.25; // nicht integrierte Minderheiten zählen nur zu diesem Anteil

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
    // Marine
    { id: 'nav1', branch: 'Marine', name: 'Kreuzerbau', cost: 160, req: [], effects: { unlock: 'cruiser' } },
    { id: 'nav2', branch: 'Marine', name: 'Schlachtschiffbau', cost: 280, req: ['nav1'], effects: { unlock: 'battleship' } },
    { id: 'nav3', branch: 'Marine', name: 'Radar & Feuerleitung', cost: 300, req: ['nav2'], effects: { atk: { destroyer: 0.15, cruiser: 0.15, battleship: 0.15 } } },
    { id: 'nav4', branch: 'Marine', name: 'Panzerung & Turbinen', cost: 380, req: ['nav3'], effects: { def: { destroyer: 0.15, cruiser: 0.15, battleship: 0.15 }, speed: { destroyer: 0.1, cruiser: 0.1, battleship: 0.1 } } },
    { id: 'pop2', branch: 'Wirtschaft', name: 'Allgemeine Wehrpflicht', cost: 280, req: ['pop1'], effects: { manpower: 0.2 } },
    // ----- erweiterte Infanterie -----
    { id: 'inf5', branch: 'Infanterie', name: 'Schutzwesten', cost: 450, req: ['inf4'], effects: { def: { infantry: 0.2 }, hp: { infantry: 0.1 } } },
    { id: 'inf6', branch: 'Infanterie', name: 'Nachtsichtgeräte', cost: 560, req: ['inf5'], effects: { atk: { infantry: 0.2 }, speed: { infantry: 0.05 } } },
    { id: 'inf7', branch: 'Infanterie', name: 'Vernetzte Soldaten', cost: 700, req: ['inf6'], effects: { atk: { infantry: 0.25 }, def: { infantry: 0.2 }, speed: { infantry: 0.1 } } },
    // ----- erweiterte Artillerie -----
    { id: 'art4', branch: 'Artillerie', name: 'Selbstfahrlafetten', cost: 450, req: ['art3'], effects: { atk: { artillery: 0.25 }, speed: { artillery: 0.25 } } },
    { id: 'art5', branch: 'Artillerie', name: 'Präzisionsmunition', cost: 620, req: ['art4'], effects: { atk: { artillery: 0.3 }, hp: { artillery: 0.15 } } },
    { id: 'art6', branch: 'Artillerie', name: 'Drohnengestützte Feuerleitung', cost: 780, req: ['art5'], effects: { atk: { artillery: 0.35 }, def: { artillery: 0.3 } } },
    // ----- erweiterte Panzer -----
    { id: 'armor4', branch: 'Panzer', name: 'Verbundpanzerung', cost: 540, req: ['armor3'], effects: { def: { tank: 0.3 }, hp: { tank: 0.2 } } },
    { id: 'armor5', branch: 'Panzer', name: 'Aktive Schutzsysteme', cost: 700, req: ['armor4'], effects: { def: { tank: 0.3 }, atk: { tank: 0.2 } } },
    { id: 'armor6', branch: 'Panzer', name: 'Unbemannte Türme', cost: 860, req: ['armor5'], effects: { atk: { tank: 0.35 }, speed: { tank: 0.2 } } },
    // ----- erweiterte Luftwaffe -----
    { id: 'air4', branch: 'Luftwaffe', name: 'Tarnkappentechnik', cost: 600, req: ['air3'], effects: { def: { fighter: 0.35 } } },
    { id: 'air5', branch: 'Luftwaffe', name: 'Lenkwaffen', cost: 760, req: ['air4'], effects: { atk: { fighter: 0.35 }, hp: { fighter: 0.15 } } },
    { id: 'air6', branch: 'Luftwaffe', name: 'Hyperschallflug', cost: 920, req: ['air5'], effects: { speed: { fighter: 0.3 }, atk: { fighter: 0.3 } } },
    // ----- erweiterte Marine -----
    { id: 'nav3b', branch: 'Marine', name: 'Sonar & Wasserbomben', cost: 340, req: ['nav1'], effects: { def: { destroyer: 0.25 }, atk: { destroyer: 0.2 } } },
    { id: 'nav5', branch: 'Marine', name: 'Schiffsraketen', cost: 520, req: ['nav4'], effects: { atk: { destroyer: 0.25, cruiser: 0.25, battleship: 0.25 } } },
    { id: 'nav6', branch: 'Marine', name: 'Nuklearantrieb', cost: 700, req: ['nav5'], effects: { speed: { destroyer: 0.2, cruiser: 0.2, battleship: 0.2 }, hp: { destroyer: 0.2, cruiser: 0.2, battleship: 0.2 } } },
    { id: 'nav7', branch: 'Marine', name: 'Transportflotten', cost: 380, req: ['nav1'], effects: { speed: { all: 0.05 } } },
    // ----- erweiterte Industrie -----
    { id: 'ind4', branch: 'Industrie', name: 'Robotik', cost: 480, req: ['ind3'], effects: { mil: 0.25 } },
    { id: 'ind5', branch: 'Industrie', name: '3D-Fertigung', cost: 680, req: ['ind4'], effects: { mil: 0.3 } },
    { id: 'con3', branch: 'Industrie', name: 'Modulbauweise', cost: 330, req: ['con2'], effects: { civ: 0.25 } },
    { id: 'con4', branch: 'Industrie', name: 'Automatisierte Baustellen', cost: 520, req: ['con3'], effects: { civ: 0.3 } },
    { id: 'en3', branch: 'Industrie', name: 'Kernenergie', cost: 420, req: ['en2'], effects: { energy: 0.3 } },
    { id: 'en4', branch: 'Industrie', name: 'Erneuerbare Energien', cost: 560, req: ['en3'], effects: { energy: 0.25 } },
    // ----- erweiterte Wirtschaft -----
    { id: 'eco4', branch: 'Wirtschaft', name: 'Globalisierung', cost: 460, req: ['eco3'], effects: { gdp: 0.12 } },
    { id: 'eco5', branch: 'Wirtschaft', name: 'Digitale Wirtschaft', cost: 640, req: ['eco4'], effects: { gdp: 0.15 } },
    { id: 'res3', branch: 'Wirtschaft', name: 'Recycling', cost: 380, req: ['res2'], effects: { resource: 0.2 } },
    { id: 'res4', branch: 'Wirtschaft', name: 'Seltene Erden', cost: 560, req: ['res3'], effects: { resource: 0.25 } },
    { id: 'edu3', branch: 'Wirtschaft', name: 'Rechenzentren', cost: 420, req: ['edu2'], effects: { research: 0.25 } },
    { id: 'edu4', branch: 'Wirtschaft', name: 'Künstliche Intelligenz', cost: 700, req: ['edu3'], effects: { research: 0.35 } },
    { id: 'pop3', branch: 'Wirtschaft', name: 'Berufsarmee', cost: 420, req: ['pop2'], effects: { manpower: 0.2 } },
    { id: 'pop4', branch: 'Wirtschaft', name: 'Zivilschutz & Reserve', cost: 560, req: ['pop3'], effects: { manpower: 0.2 } },
    // ----- Logistik (Tempo aller Einheiten) -----
    { id: 'log1', branch: 'Logistik', name: 'Motorisierter Nachschub', cost: 180, req: [], effects: { speed: { all: 0.08 } } },
    { id: 'log2', branch: 'Logistik', name: 'Eisenbahnnetz', cost: 300, req: ['log1'], effects: { speed: { all: 0.1 } } },
    { id: 'log3', branch: 'Logistik', name: 'Lufttransport', cost: 460, req: ['log2'], effects: { speed: { all: 0.12 } } },
    { id: 'log4', branch: 'Logistik', name: 'Autonome Konvois', cost: 640, req: ['log3'], effects: { speed: { all: 0.15 }, hp: { all: 0.05 } } },
    { id: 'log5', branch: 'Logistik', name: 'Feldlazarette', cost: 260, req: ['log1'], effects: { hp: { all: 0.08 } } },
    { id: 'log6', branch: 'Logistik', name: 'Moderne Sanitätsdienste', cost: 480, req: ['log5'], effects: { hp: { all: 0.12 } } },
    // ----- Gesellschaft (Stabilität, Integration) -----
    { id: 'soc1', branch: 'Gesellschaft', name: 'Polizeiapparat', cost: 160, req: [], effects: { stab: 4 } },
    { id: 'soc2', branch: 'Gesellschaft', name: 'Sozialprogramme', cost: 280, req: ['soc1'], effects: { stab: 6, gdp: 0.02 } },
    { id: 'soc3', branch: 'Gesellschaft', name: 'Integrationspolitik', cost: 360, req: ['soc2'], effects: { stab: 5, assim: 1.0 } },
    { id: 'soc4', branch: 'Gesellschaft', name: 'Propagandaapparat', cost: 340, req: ['soc1'], effects: { stab: 8, research: -0.03 } },
    { id: 'soc5', branch: 'Gesellschaft', name: 'Bildungsreform', cost: 460, req: ['soc3'], effects: { assim: 1.5, research: 0.05 } },
    { id: 'soc6', branch: 'Gesellschaft', name: 'Gerechte Teilhabe', cost: 620, req: ['soc5'], effects: { stab: 8, gdp: 0.04 } },
  ];

  D.SPEEDS = [0, 900, 450, 180, 60]; // ms pro Tag, 0 = Pause
  D.START_DATE = '1936-01-01';

  D.PATTERNS = {
    solid: 'Einfarbig', h2: '2 Streifen (waagerecht)', h3: '3 Streifen (waagerecht)', h4: '4 Streifen', h5: '5 Streifen (waagerecht)', h9: '9 Streifen', v2: '2 Streifen (senkrecht)', v3: '3 Streifen (senkrecht)', v5: '5 Streifen (senkrecht)',
    cross: 'Kreuz', nordic: 'Nordisches Kreuz', nordic2: 'Doppeltes Kreuz', saltire: 'Andreaskreuz', diag: 'Diagonale', diag2: 'Diagonalstreifen', bend: 'Schrägband', bendsin: 'Schrägband (links)',
    canton: 'Obereck', quarters: 'Vierteilung', triangle: 'Dreieck links', chevron: 'Winkel', border: 'Rahmen', pall: 'Gabelkreuz (Y)', fesse: 'Breiter Mittelbalken', pale: 'Breiter Mittelstreifen',
    rhombus: 'Raute', halves: 'Diagonal geteilt', stripes_canton: 'Streifen + Obereck', checker: 'Karomuster', sunburst: 'Strahlen', hoist: 'Streifen links',
  };
  D.EMBLEMS = {
    none: 'Kein Emblem', star: 'Stern', circle: 'Kreis', diamond: 'Raute', cross: 'Kreuz', crescent: 'Halbmond', moonstar: 'Halbmond + Stern', sun: 'Sonne', ring: 'Ring', ringstar: 'Stern im Ring',
    stars3: 'Drei Sterne', stars5: 'Fünf Sterne', crown: 'Krone', sword: 'Schwert', swords: 'Gekreuzte Schwerter', tree: 'Baum', anchor: 'Anker', bird: 'Adler', wheat: 'Ähre', triangle: 'Dreieck',
    bar: 'Balken', shield: 'Wappenschild', lion: 'Löwe', tower: 'Turm', gear: 'Zahnrad', hex: 'Sechseck', heart: 'Herz', fleur: 'Lilie', eye: 'Auge',
  };
})(window.HOG);
