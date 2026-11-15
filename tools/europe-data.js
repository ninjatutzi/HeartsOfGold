// Daten für den Europa-2020-Generator (tools/gen-europe.js)
// Länder: [ISO3, Name, Hauptethnie, Farbe, Ideologie, Reichtum, Bevölkerung (K), Hauptstadt-Staat, Flagge, integrierte Ethnien, Mannstärke-Regel]
const F = (pattern, c1, c2, c3, emblem) => ({ pattern, c1, c2, c3, emblem: emblem || 'none' });
exports.COUNTRIES = [
  ['GBR', 'Vereinigtes Königreich', 'en', '#c4606a', 'democratic', 1.3, 67000, 'London', F('cross', '#1c3f94', '#ffffff', '#c8102e'), ['sc', 'cy'], 'volunteer'],
  ['IRL', 'Irland', 'ie', '#3f9e5a', 'democratic', 1.5, 4900, 'Dublin', F('v3', '#169b62', '#ffffff', '#ff883e'), [], 'volunteer'],
  ['FRA', 'Frankreich', 'fr', '#4a78b5', 'democratic', 1.2, 67000, 'Île-de-France', F('v3', '#1c3f94', '#ffffff', '#d52b1e'), [], 'limited'],
  ['ESP', 'Spanien', 'es', '#e0952f', 'democratic', 0.9, 47000, 'Madrid', F('h3', '#c8102e', '#f1c40f', '#c8102e'), ['ca', 'ba'], 'volunteer'],
  ['PRT', 'Portugal', 'pt', '#2f8f6a', 'democratic', 0.7, 10300, 'Lissabon', F('v3', '#0b6b3a', '#c8102e', '#c8102e'), [], 'volunteer'],
  ['DEU', 'Deutschland', 'de', '#707070', 'democratic', 1.4, 83000, 'Berlin', F('h3', '#111111', '#c8102e', '#f1c40f'), [], 'volunteer'],
  ['NLD', 'Niederlande', 'nl', '#e08a3a', 'democratic', 1.4, 17400, 'Amsterdam', F('h3', '#ae1c28', '#ffffff', '#21468b'), [], 'volunteer'],
  ['BEL', 'Belgien', 'fl', '#d6c24a', 'democratic', 1.3, 11500, 'Brüssel', F('v3', '#111111', '#f1c40f', '#c8102e'), ['wa'], 'volunteer'],
  ['LUX', 'Luxemburg', 'lu', '#6ab0d9', 'democratic', 2.2, 630, 'Luxemburg', F('h3', '#c8102e', '#ffffff', '#4db2ec'), [], 'volunteer'],
  ['CHE', 'Schweiz', 'ch', '#e8e8e8', 'democratic', 1.8, 8600, 'Bern', F('cross', '#c8102e', '#ffffff', '#c8102e'), [], 'extended'],
  ['AUT', 'Österreich', 'at', '#e6dca0', 'democratic', 1.3, 8900, 'Wien', F('h3', '#c8102e', '#ffffff', '#c8102e'), ['de'], 'limited'],
  ['ITA', 'Italien', 'it', '#9cc45a', 'democratic', 1.0, 60000, 'Latium', F('v3', '#2e8b3a', '#ffffff', '#c8102e'), [], 'volunteer'],
  ['DNK', 'Dänemark', 'dk', '#b05050', 'democratic', 1.5, 5800, 'Kopenhagen', F('nordic', '#c8102e', '#ffffff', '#c8102e'), [], 'limited'],
  ['NOR', 'Norwegen', 'no', '#c04a5a', 'democratic', 1.8, 5400, 'Oslo', F('nordic', '#ba0c2f', '#00205b', '#ffffff'), [], 'limited'],
  ['SWE', 'Schweden', 'se', '#d9c23a', 'democratic', 1.4, 10300, 'Stockholm', F('nordic', '#006aa7', '#fecc00', '#fecc00'), [], 'volunteer'],
  ['FIN', 'Finnland', 'fi', '#9fd0e6', 'democratic', 1.3, 5500, 'Helsinki', F('nordic', '#ffffff', '#003580', '#003580'), [], 'extended'],
  ['POL', 'Polen', 'pl', '#d88aa8', 'democratic', 0.6, 38000, 'Masowien', F('h2', '#ffffff', '#dc143c', '#ffffff'), [], 'volunteer'],
  ['CZE', 'Tschechien', 'cz', '#3aa6a6', 'democratic', 0.8, 10700, 'Prag', F('triangle', '#ffffff', '#11457e', '#d7141a'), ['sk'], 'volunteer'],
  ['SVK', 'Slowakei', 'sk', '#6fc0b0', 'democratic', 0.5, 5450, 'Bratislava', F('v3', '#ffffff', '#0b4ea2', '#ee1c25'), ['cz'], 'volunteer'],
  ['HUN', 'Ungarn', 'hu', '#4f9a5b', 'democratic', 0.5, 9700, 'Budapest', F('h3', '#c8102e', '#ffffff', '#2e7d32'), [], 'volunteer'],
  ['SVN', 'Slowenien', 'sl', '#76b0a0', 'democratic', 0.8, 2100, 'Ljubljana', F('h3', '#ffffff', '#0056a0', '#ed1c24'), [], 'volunteer'],
  ['HRV', 'Kroatien', 'hr', '#b59bd6', 'democratic', 0.5, 4100, 'Zagreb', F('h3', '#ff0000', '#ffffff', '#171796'), [], 'volunteer'],
  ['BIH', 'Bosnien und Herzegowina', 'bs', '#8aa0d6', 'democratic', 0.25, 3300, 'Sarajevo', F('diag', '#002395', '#fecb00', '#ffffff'), ['sr', 'hr'], 'volunteer'],
  ['MNE', 'Montenegro', 'me', '#a85a5a', 'democratic', 0.3, 620, 'Podgorica', F('solid', '#c8102e', '#d4af37', '#d4af37', 'star'), [], 'volunteer'],
  ['MKD', 'Nordmazedonien', 'mk', '#d6a64a', 'democratic', 0.25, 2070, 'Skopje', F('solid', '#d20000', '#ffe600', '#ffe600', 'star'), ['al'], 'volunteer'],
  ['ALB', 'Albanien', 'al', '#b03a3a', 'democratic', 0.2, 2800, 'Tirana', F('solid', '#e41e20', '#000000', '#000000', 'diamond'), [], 'volunteer'],
  ['KOS', 'Kosovo', 'ko', '#4a6fb5', 'democratic', 0.2, 1800, 'Pristina', F('solid', '#244aa5', '#d0a650', '#ffffff', 'star'), ['al'], 'volunteer'],
  ['SRB', 'Serbien', 'sr', '#8d6fb5', 'democratic', 0.3, 7000, 'Belgrad', F('h3', '#c6363c', '#0c4076', '#ffffff'), [], 'limited'],
  ['ROU', 'Rumänien', 'ro', '#d1a23b', 'democratic', 0.4, 19200, 'Bukarest', F('v3', '#002b7f', '#fcd116', '#ce1126'), [], 'volunteer'],
  ['BGR', 'Bulgarien', 'bg', '#5aa06a', 'democratic', 0.35, 7000, 'Sofia', F('h3', '#ffffff', '#00966e', '#d62612'), [], 'volunteer'],
  ['GRC', 'Griechenland', 'gr', '#5a8fd0', 'democratic', 0.6, 10700, 'Athen', F('h2', '#0d5eaf', '#ffffff', '#ffffff'), [], 'limited'],
  ['MDA', 'Moldau', 'md', '#c9a24a', 'democratic', 0.15, 2600, 'Chișinău', F('v3', '#0046ae', '#ffd200', '#cc092f'), ['ro'], 'volunteer'],
  ['UKR', 'Ukraine', 'ua', '#e5c93c', 'democratic', 0.2, 41000, 'Kiew', F('h2', '#0057b7', '#ffd700', '#ffd700'), [], 'extended'],
  ['BLR', 'Belarus', 'by', '#c98a6a', 'communist', 0.3, 9400, 'Minsk', F('h2', '#c8313e', '#4aa657', '#4aa657'), ['ru'], 'limited'],
  ['LTU', 'Litauen', 'lt', '#c0b04a', 'democratic', 0.5, 2800, 'Vilnius', F('h3', '#fdb913', '#006a44', '#c1272d'), [], 'volunteer'],
  ['LVA', 'Lettland', 'lv', '#9e3b4e', 'democratic', 0.5, 1900, 'Riga', F('h3', '#9e3039', '#ffffff', '#9e3039'), [], 'volunteer'],
  ['EST', 'Estland', 'ee', '#5aa0d0', 'democratic', 0.6, 1330, 'Tallinn', F('h3', '#0072ce', '#000000', '#ffffff'), [], 'volunteer'],
  ['RUS', 'Russland', 'ru', '#9c2b2b', 'communist', 0.45, 95000, 'Moskau', F('h3', '#ffffff', '#0039a6', '#d52b1e'), ['yk', 'kk', 'tt', 'by'], 'extended'],
  ['TUR', 'Türkei', 'tr', '#c8553a', 'monarchist', 0.5, 84000, 'Ankara', F('solid', '#e30a17', '#ffffff', '#ffffff', 'circle'), [], 'extended'],
];

exports.ETHNICITIES = [
  ['en', 'Briten', '#c4606a'], ['sc', 'Schotten', '#5b7fb5'], ['cy', 'Waliser', '#d9534f'], ['ie', 'Iren', '#3f9e5a'], ['fr', 'Franzosen', '#4a78b5'],
  ['es', 'Spanier', '#e0952f'], ['ca', 'Katalanen', '#d6b56a'], ['ba', 'Basken', '#8fbf6a'], ['pt', 'Portugiesen', '#2f8f6a'], ['de', 'Deutsche', '#707070'],
  ['nl', 'Niederländer', '#e08a3a'], ['fl', 'Flamen', '#d6c24a'], ['wa', 'Wallonen', '#c46a6a'], ['lu', 'Luxemburger', '#6ab0d9'], ['ch', 'Schweizer', '#e8e8e8'],
  ['at', 'Österreicher', '#e6dca0'], ['it', 'Italiener', '#9cc45a'], ['dk', 'Dänen', '#b05050'], ['no', 'Norweger', '#c04a5a'], ['se', 'Schweden', '#d9c23a'],
  ['fi', 'Finnen', '#9fd0e6'], ['pl', 'Polen', '#d88aa8'], ['cz', 'Tschechen', '#3aa6a6'], ['sk', 'Slowaken', '#6fc0b0'], ['hu', 'Ungarn', '#4f9a5b'],
  ['sl', 'Slowenen', '#76b0a0'], ['hr', 'Kroaten', '#b59bd6'], ['bs', 'Bosniaken', '#8aa0d6'], ['me', 'Montenegriner', '#a85a5a'], ['mk', 'Mazedonier', '#d6a64a'],
  ['al', 'Albaner', '#b03a3a'], ['ko', 'Kosovaren', '#4a6fb5'], ['sr', 'Serben', '#8d6fb5'], ['ro', 'Rumänen', '#d1a23b'], ['bg', 'Bulgaren', '#5aa06a'],
  ['gr', 'Griechen', '#5a8fd0'], ['md', 'Moldauer', '#c9a24a'], ['ua', 'Ukrainer', '#e5c93c'], ['by', 'Weißrussen', '#c98a6a'], ['lt', 'Litauer', '#c0b04a'],
  ['lv', 'Letten', '#9e3b4e'], ['ee', 'Esten', '#5aa0d0'], ['ru', 'Russen', '#9c2b2b'], ['tr', 'Türken', '#c8553a'], ['ku', 'Kurden', '#6a9f4a'],
  ['yk', 'Jakuten', '#7ab8d6'], ['kk', 'Kasachen', '#59b0b0'], ['tt', 'Tataren', '#a07ab8'], ['ce', 'Tschetschenen', '#6a7a3a'],
];

// Staaten: [Name, Land, Stadt, Länge, Breite, Gewicht(Bevölkerungsanteil), Ethnien{} | null, Ressourcen{} | null]
const S = [];
const add = (country, rows) => rows.forEach((r) => S.push([r[0], country, r[1], r[2], r[3], r[4], r[5] || null, r[6] || null]));
add('GBR', [
  ['Süd-Schottland', 'Edinburgh', -3.19, 55.95, 5, { sc: 90, en: 10 }, { oil: 3 }], ['Highlands', 'Inverness', -4.22, 57.48, 1, { sc: 95, en: 5 }, { oil: 3 }],
  ['Nordirland', 'Belfast', -5.93, 54.6, 3, { en: 60, ie: 40 }], ['Nordostengland', 'Newcastle', -1.61, 54.98, 5, null, { steel: 2 }],
  ['Yorkshire', 'Leeds', -1.55, 53.8, 8, null, { steel: 3 }], ['Nordwestengland', 'Manchester', -2.24, 53.48, 8], ['West Midlands', 'Birmingham', -1.9, 52.48, 9, null, { steel: 2 }],
  ['East Midlands', 'Nottingham', -1.15, 52.95, 7], ['Ostengland', 'Norwich', 1.3, 52.63, 6, null, { oil: 1 }], ['London', 'London', -0.12, 51.5, 14], ['Südostengland', 'Reading', -0.97, 51.45, 10],
  ['Südwestengland', 'Bristol', -2.6, 51.45, 9], ['Cornwall', 'Exeter', -3.53, 50.72, 4, null, { tungsten: 2 }], ['Wales', 'Cardiff', -3.18, 51.48, 5, { cy: 80, en: 20 }, { steel: 2 }],
  ['Nordwales', 'Wrexham', -3.0, 53.05, 1.5, { cy: 75, en: 25 }],
]);
add('IRL', [['Dublin', 'Dublin', -6.26, 53.35, 8], ['Munster', 'Cork', -8.47, 51.9, 5], ['Connacht', 'Galway', -9.05, 53.27, 3], ['Ulster-Irland', 'Cavan', -7.36, 53.99, 1.5], ['Leinster', 'Kilkenny', -7.25, 52.65, 2]]);
add('FRA', [
  ['Île-de-France', 'Paris', 2.35, 48.86, 12], ['Hauts-de-France', 'Lille', 3.06, 50.63, 6, null, { steel: 1 }], ['Normandie', 'Rouen', 1.1, 49.44, 3.3, null, { oil: 1 }], ['Bretagne', 'Rennes', -1.68, 48.11, 3.3],
  ['Pays de la Loire', 'Nantes', -1.55, 47.22, 3.8], ['Centre-Val de Loire', 'Orléans', 1.9, 47.9, 2.6], ['Elsass', 'Straßburg', 7.75, 48.58, 1.9], ['Lothringen', 'Metz', 6.18, 49.12, 2.3, null, { steel: 3 }],
  ['Champagne', 'Reims', 4.03, 49.26, 1.3], ['Burgund', 'Dijon', 5.04, 47.32, 2.8], ['Franche-Comté', 'Besançon', 6.02, 47.24, 1.2], ['Auvergne', 'Clermont-Ferrand', 3.08, 45.78, 2],
  ['Rhône-Alpen', 'Lyon', 4.83, 45.76, 7.7, null, { aluminum: 1 }], ['Aquitanien', 'Bordeaux', -0.58, 44.84, 5.9], ['Limousin', 'Limoges', 1.26, 45.83, 1], ['Poitou', 'Poitiers', 0.34, 46.58, 2.7],
  ['Midi-Pyrénées', 'Toulouse', 1.44, 43.6, 5.9, null, { aluminum: 1 }], ['Languedoc', 'Montpellier', 3.88, 43.61, 4], ['Provence', 'Marseille', 5.37, 43.3, 5, null, { aluminum: 3 }],
  ['Côte d\'Azur', 'Nizza', 7.26, 43.7, 1.5], ['Korsika', 'Ajaccio', 8.74, 41.92, 0.5],
]);
add('ESP', [
  ['Galicien', 'Santiago', -8.54, 42.88, 2.7, null, { tungsten: 2 }], ['Asturien', 'Oviedo', -5.85, 43.36, 1.1, null, { steel: 2 }], ['Baskenland', 'Bilbao', -2.93, 43.26, 3, { es: 70, ba: 30 }, { steel: 1 }],
  ['Navarra', 'Pamplona', -1.64, 42.82, 0.6], ['Aragonien', 'Saragossa', -0.88, 41.65, 1.3], ['Katalonien', 'Barcelona', 2.17, 41.39, 7.5, { ca: 70, es: 30 }], ['Valencia', 'Valencia', -0.38, 39.47, 5],
  ['Balearen', 'Palma', 2.65, 39.57, 1.2], ['Murcia', 'Murcia', -1.13, 37.99, 1.5], ['Ostandalusien', 'Granada', -3.6, 37.18, 3.3], ['Andalusien', 'Sevilla', -5.98, 37.39, 5.2, null, { chromium: 1 }],
  ['Extremadura', 'Mérida', -6.34, 38.92, 1.1], ['Madrid', 'Madrid', -3.7, 40.42, 6.7], ['Kastilien-León', 'Valladolid', -4.72, 41.65, 2.4], ['Kastilien-La Mancha', 'Toledo', -4.02, 39.86, 2],
]);
add('PRT', [['Lissabon', 'Lissabon', -9.14, 38.72, 3], ['Porto', 'Porto', -8.61, 41.15, 3], ['Zentralportugal', 'Coimbra', -8.42, 40.2, 1.5, null, { tungsten: 3 }], ['Alentejo', 'Évora', -7.91, 38.57, 0.8], ['Algarve', 'Faro', -7.93, 37.02, 0.5]]);
add('DEU', [
  ['Berlin', 'Berlin', 13.4, 52.52, 3.7], ['Brandenburg', 'Cottbus', 14.33, 51.76, 2.5], ['Mecklenburg-Vorpommern', 'Rostock', 12.14, 54.09, 1.6], ['Schleswig-Holstein', 'Kiel', 10.13, 54.32, 2.9],
  ['Hamburg', 'Hamburg', 10.0, 53.55, 1.8], ['Niedersachsen', 'Hannover', 9.73, 52.37, 8, null, { oil: 1 }], ['Ruhrgebiet', 'Essen', 7.01, 51.46, 5, null, { steel: 7 }], ['Rheinland', 'Köln', 6.96, 50.94, 4],
  ['Westfalen', 'Münster', 7.63, 51.96, 2.5], ['Hessen', 'Frankfurt', 8.68, 50.11, 6], ['Rheinland-Pfalz', 'Koblenz', 7.59, 50.36, 4], ['Saarland', 'Saarbrücken', 7.0, 49.23, 1.2, null, { steel: 2 }],
  ['Baden-Württemberg', 'Stuttgart', 9.18, 48.78, 11, null, { aluminum: 1 }], ['Oberbayern', 'München', 11.58, 48.14, 8], ['Franken', 'Nürnberg', 11.08, 49.45, 5], ['Sachsen', 'Dresden', 13.74, 51.05, 4.9, null, { tungsten: 1 }],
  ['Sachsen-Anhalt', 'Halle', 12.0, 51.48, 3.5], ['Thüringen', 'Erfurt', 11.03, 50.98, 2.6],
]);
add('NLD', [['Amsterdam', 'Amsterdam', 4.9, 52.37, 4], ['Rotterdam', 'Rotterdam', 4.48, 51.92, 3.5], ['Gelderland', 'Arnheim', 5.9, 51.98, 3.5], ['Groningen', 'Groningen', 6.57, 53.22, 1.7, null, { oil: 1 }], ['Brabant', 'Eindhoven', 5.47, 51.44, 3.5], ['Limburg', 'Maastricht', 5.69, 50.85, 1.1]]);
add('BEL', [['Brüssel', 'Brüssel', 4.35, 50.85, 2, { fl: 20, wa: 80 }], ['Ostflandern', 'Gent', 3.72, 51.05, 5.5, { fl: 100 }], ['Antwerpen', 'Antwerpen', 4.4, 51.22, 1.8, { fl: 100 }], ['Hennegau', 'Charleroi', 4.44, 50.41, 3.5, { wa: 100 }, { steel: 1 }], ['Lüttich', 'Lüttich', 5.57, 50.63, 1.1, { wa: 90, de: 10 }]]);
add('LUX', [['Luxemburg', 'Luxemburg', 6.13, 49.61, 1, { lu: 100 }]]);
add('CHE', [['Zürich', 'Zürich', 8.54, 47.38, 3], ['Bern', 'Bern', 7.45, 46.95, 2], ['Genf', 'Genf', 6.14, 46.2, 1.5], ['Tessin', 'Lugano', 8.95, 46.0, 0.6], ['Graubünden', 'Chur', 9.53, 46.85, 0.5], ['Basel', 'Basel', 7.59, 47.56, 1, null, { aluminum: 1 }], ['Ostschweiz', 'St. Gallen', 9.37, 47.42, 1]]);
add('AUT', [
  ['Wien', 'Wien', 16.37, 48.21, 1.9], ['Niederösterreich', 'St. Pölten', 15.3, 48.2, 1.7, null, { oil: 1 }], ['Oberösterreich', 'Linz', 14.29, 48.31, 1.5, null, { steel: 2 }], ['Salzburg', 'Salzburg', 13.05, 47.8, 0.55],
  ['Tirol', 'Innsbruck', 11.4, 47.27, 0.75], ['Vorarlberg', 'Bregenz', 9.75, 47.5, 0.4], ['Steiermark', 'Graz', 15.44, 47.07, 1.25, { at: 95, sl: 5 }, { steel: 3 }], ['Kärnten', 'Klagenfurt', 14.31, 46.62, 0.56, { at: 94, sl: 6 }],
]);
add('ITA', [
  ['Piemont', 'Turin', 7.69, 45.07, 4.4], ['Ligurien', 'Genua', 8.93, 44.41, 1.5], ['Lombardei', 'Mailand', 9.19, 45.46, 10, null, { steel: 1 }], ['Venetien', 'Venedig', 12.34, 45.44, 4.9], ['Südtirol', 'Bozen', 11.35, 46.5, 1, { it: 35, de: 65 }],
  ['Friaul', 'Triest', 13.77, 45.65, 1.2, { it: 90, sl: 10 }], ['Emilia-Romagna', 'Bologna', 11.34, 44.5, 4.4], ['Toskana', 'Florenz', 11.25, 43.77, 3.7], ['Marken', 'Ancona', 13.52, 43.62, 2.4],
  ['Latium', 'Rom', 12.5, 41.9, 5.9], ['Abruzzen', 'Pescara', 14.2, 42.46, 1.3], ['Kampanien', 'Neapel', 14.27, 40.85, 5.8], ['Apulien', 'Bari', 16.87, 41.12, 4, null, { steel: 2 }],
  ['Basilikata', 'Potenza', 15.8, 40.64, 0.6, null, { oil: 2 }], ['Kalabrien', 'Reggio', 15.65, 38.11, 1.9], ['Sizilien', 'Palermo', 13.36, 38.12, 5, null, { oil: 1 }], ['Sardinien', 'Cagliari', 9.12, 39.22, 1.6],
]);
add('DNK', [['Kopenhagen', 'Kopenhagen', 12.57, 55.68, 2, null, { oil: 1 }], ['Jütland', 'Aarhus', 10.2, 56.15, 2.2], ['Fünen', 'Odense', 10.4, 55.4, 0.6]]);
add('NOR', [['Oslo', 'Oslo', 10.75, 59.91, 1.5], ['Rogaland', 'Stavanger', 5.73, 58.97, 0.9, null, { oil: 6 }], ['Westnorwegen', 'Bergen', 5.32, 60.39, 0.8, null, { aluminum: 2 }], ['Trøndelag', 'Trondheim', 10.4, 63.43, 0.5], ['Nordland', 'Bodø', 14.4, 67.28, 0.25], ['Nordnorwegen', 'Tromsø', 18.96, 69.65, 0.3]]);
add('SWE', [
  ['Stockholm', 'Stockholm', 18.07, 59.33, 2.4], ['Westschweden', 'Göteborg', 11.97, 57.71, 2], ['Schonen', 'Malmö', 13.0, 55.6, 1.4], ['Mittelschweden', 'Örebro', 15.2, 59.27, 1.3], ['Småland', 'Jönköping', 14.16, 57.78, 0.8],
  ['Norrland-Süd', 'Sundsvall', 17.3, 62.4, 0.6], ['Norrland-Nord', 'Luleå', 22.15, 65.58, 0.4, null, { steel: 4 }], ['Kiruna', 'Kiruna', 20.2, 67.86, 0.15, null, { steel: 4, tungsten: 1 }],
]);
add('FIN', [['Uusimaa', 'Helsinki', 24.94, 60.17, 2], ['Südwestfinnland', 'Turku', 22.27, 60.45, 0.7], ['Tampere', 'Tampere', 23.76, 61.5, 0.9], ['Ostfinnland', 'Kuopio', 27.68, 62.89, 0.5], ['Oulu', 'Oulu', 25.47, 65.01, 0.6, null, { chromium: 3 }], ['Lappland', 'Rovaniemi', 25.72, 66.5, 0.2], ['Karelien-Finnland', 'Lappeenranta', 28.19, 61.06, 0.5]]);
add('POL', [
  ['Masowien', 'Warschau', 21.01, 52.23, 5.4], ['Großpolen', 'Posen', 16.93, 52.41, 3.4], ['Kleinpolen', 'Krakau', 19.94, 50.06, 3.4], ['Niederschlesien', 'Breslau', 17.04, 51.11, 2.9, null, { steel: 2 }],
  ['Oberschlesien', 'Kattowitz', 19.02, 50.26, 4.5, null, { steel: 6 }], ['Pommern', 'Danzig', 18.65, 54.35, 2.3], ['Westpommern', 'Stettin', 14.55, 53.43, 1.7], ['Kujawien', 'Bromberg', 18.0, 53.12, 2], ['Lodz', 'Lodz', 19.46, 51.76, 2.5],
  ['Lublin', 'Lublin', 22.57, 51.25, 2.1], ['Podlachien', 'Białystok', 23.16, 53.13, 1.2, { pl: 85, by: 15 }], ['Ermland-Masuren', 'Allenstein', 20.48, 53.78, 1.4], ['Karpatenvorland', 'Rzeszów', 22.0, 50.04, 2.1],
]);
add('CZE', [['Prag', 'Prag', 14.42, 50.08, 2.5], ['Nordböhmen', 'Aussig', 14.04, 50.66, 1.4], ['Südböhmen', 'Budweis', 14.47, 48.97, 0.9], ['Westböhmen', 'Pilsen', 13.38, 49.75, 1.2], ['Ostböhmen', 'Königgrätz', 15.83, 50.21, 1.2], ['Mähren', 'Brünn', 16.61, 49.2, 2.1], ['Nordmähren', 'Ostrau', 18.28, 49.83, 2.5, null, { steel: 4 }]]);
add('SVK', [['Bratislava', 'Bratislava', 17.1, 48.15, 0.7], ['Nordwestslowakei', 'Žilina', 18.74, 49.22, 1.2], ['Mittelslowakei', 'Banská Bystrica', 19.15, 48.74, 0.7, null, { chromium: 1 }], ['Ostslowakei', 'Košice', 21.26, 48.72, 1.1, { sk: 82, hu: 12, ro: 6 }, { steel: 2 }]]);
add('HUN', [['Budapest', 'Budapest', 19.04, 47.5, 3], ['Westungarn', 'Győr', 17.64, 47.69, 1.5], ['Transdanubien', 'Veszprém', 17.91, 47.09, 1.2, null, { aluminum: 5 }], ['Südungarn', 'Pécs', 18.23, 46.07, 1.2], ['Südliche Tiefebene', 'Szeged', 20.15, 46.25, 1.2], ['Debrecen', 'Debrecen', 21.63, 47.53, 1.3, null, { oil: 1 }], ['Nordungarn', 'Miskolc', 20.78, 48.1, 1, null, { steel: 2 }]]);
add('SVN', [['Ljubljana', 'Ljubljana', 14.51, 46.05, 1.2], ['Maribor', 'Maribor', 15.65, 46.55, 0.5], ['Küstenland', 'Koper', 13.73, 45.55, 0.4]]);
add('HRV', [['Zagreb', 'Zagreb', 15.98, 45.81, 1.8], ['Slawonien', 'Osijek', 18.69, 45.55, 0.9, { hr: 85, sr: 15 }], ['Dalmatien', 'Split', 16.44, 43.51, 1.1, null, { aluminum: 1 }], ['Istrien', 'Rijeka', 14.44, 45.33, 0.8]]);
add('BIH', [['Sarajevo', 'Sarajevo', 18.41, 43.86, 1.3, { bs: 80, sr: 10, hr: 10 }], ['Banja Luka', 'Banja Luka', 17.19, 44.77, 1, { sr: 85, bs: 10, hr: 5 }, { aluminum: 2 }], ['Herzegowina', 'Mostar', 17.81, 43.34, 0.6, { hr: 70, bs: 30 }, { aluminum: 3 }], ['Tuzla', 'Tuzla', 18.68, 44.54, 0.6, { bs: 90, hr: 10 }, { steel: 1 }]]);
add('MNE', [['Montenegro', 'Podgorica', 19.26, 42.44, 1, { me: 80, sr: 15, al: 5 }]]);
add('MKD', [['Skopje', 'Skopje', 21.43, 42.0, 1.2, { mk: 70, al: 30 }, { chromium: 2 }], ['Bitola', 'Bitola', 21.35, 41.03, 0.7, { mk: 90, al: 10 }]]);
add('ALB', [['Tirana', 'Tirana', 19.82, 41.33, 1.4], ['Skutari', 'Shkodra', 19.51, 42.07, 0.5, null, { chromium: 3 }], ['Vlora', 'Vlora', 19.49, 40.47, 0.5, null, { oil: 1 }]]);
add('KOS', [['Kosovo', 'Pristina', 21.17, 42.67, 1, { ko: 92, sr: 8 }, { chromium: 1 }]]);
add('SRB', [['Belgrad', 'Belgrad', 20.46, 44.79, 2.7], ['Vojvodina', 'Novi Sad', 19.84, 45.26, 1.8, { sr: 65, hu: 13, hr: 7, ro: 15 }, { oil: 1 }], ['Niš', 'Niš', 21.9, 43.32, 1.5], ['Šumadija', 'Kragujevac', 20.92, 44.01, 1.1, null, { chromium: 1 }]]);
add('ROU', [
  ['Bukarest', 'Bukarest', 26.1, 44.43, 3], ['Muntenien', 'Craiova', 23.8, 44.32, 1.8], ['Ploiești', 'Ploiești', 26.03, 45.1, 1.8, null, { oil: 6 }], ['Nordsiebenbürgen', 'Klausenburg', 23.59, 46.77, 3, { ro: 75, hu: 20, de: 5 }],
  ['Südsiebenbürgen', 'Kronstadt', 25.6, 45.65, 2.2, { ro: 85, hu: 12, de: 3 }, { chromium: 1 }], ['Banat', 'Temeswar', 21.23, 45.76, 1.6, { ro: 85, hu: 5, sr: 10 }], ['Moldau', 'Iași', 27.59, 47.16, 3.2],
  ['Dobrudscha', 'Konstanza', 28.65, 44.18, 1.2], ['Kreischgebiet', 'Oradea', 21.92, 47.05, 1.5, { ro: 70, hu: 28, de: 2 }],
]);
add('BGR', [['Sofia', 'Sofia', 23.32, 42.7, 2.2], ['Plowdiw', 'Plowdiw', 24.75, 42.15, 1.5], ['Warna', 'Warna', 27.91, 43.21, 1.3], ['Nordbulgarien', 'Plewen', 24.62, 43.42, 1.3], ['Burgas', 'Burgas', 27.46, 42.5, 0.9], ['Rhodopen', 'Kardschali', 25.37, 41.65, 0.5, { bg: 60, tr: 40 }, { chromium: 1, tungsten: 1 }]]);
add('GRC', [
  ['Athen', 'Athen', 23.73, 37.98, 4.5], ['Thessaloniki', 'Thessaloniki', 22.94, 40.64, 2.1], ['Peloponnes', 'Patras', 21.73, 38.25, 1.1], ['Thessalien', 'Larisa', 22.42, 39.64, 0.9],
  ['Epirus', 'Ioannina', 20.85, 39.67, 0.5], ['Kreta', 'Heraklion', 25.14, 35.34, 0.65], ['Ostmakedonien', 'Kavala', 24.4, 40.94, 0.6], ['Zentralgriechenland', 'Lamia', 22.43, 38.9, 0.6, null, { aluminum: 4 }],
]);
add('MDA', [['Chișinău', 'Chișinău', 28.86, 47.01, 2, { md: 75, ru: 10, ua: 10, ro: 5 }], ['Nordmoldau', 'Bălți', 27.93, 47.76, 0.6, { md: 70, ua: 20, ru: 10 }]]);
add('UKR', [
  ['Kiew', 'Kiew', 30.52, 50.45, 4.5], ['Charkiw', 'Charkiw', 36.23, 49.99, 4.5, { ua: 70, ru: 30 }], ['Dnipro', 'Dnipro', 35.04, 48.46, 4, { ua: 80, ru: 20 }, { steel: 3 }], ['Donezk', 'Donezk', 37.8, 48.0, 4.4, { ua: 50, ru: 50 }, { steel: 8, oil: 1 }],
  ['Odessa', 'Odessa', 30.72, 46.48, 2.4, { ua: 70, ru: 25, ro: 5 }], ['Lwiw', 'Lwiw', 24.03, 49.84, 2.5, { ua: 93, pl: 7 }], ['Transkarpatien', 'Uschhorod', 22.3, 48.62, 1.2, { ua: 80, hu: 12, ro: 8 }], ['Wolhynien', 'Luzk', 25.34, 50.75, 1.5],
  ['Podolien', 'Winnyzja', 28.47, 49.23, 1.6], ['Poltawa', 'Poltawa', 34.55, 49.59, 1.6, null, { oil: 1 }], ['Saporischschja', 'Saporischschja', 35.14, 47.84, 1.8, { ua: 75, ru: 25 }, { aluminum: 2 }],
  ['Krim', 'Simferopol', 34.1, 44.95, 2, { ru: 60, ua: 25, tt: 15 }], ['Luhansk', 'Luhansk', 39.3, 48.57, 2.2, { ua: 55, ru: 45 }, { steel: 3 }], ['Tschernihiw', 'Tschernihiw', 31.3, 51.5, 1], ['Sumy', 'Sumy', 34.8, 50.9, 1.1], ['Cherson', 'Cherson', 32.62, 46.64, 1],
]);
add('BLR', [['Minsk', 'Minsk', 27.56, 53.9, 2], ['Brest', 'Brest', 23.7, 52.1, 1.4, { by: 80, pl: 10, ru: 10 }], ['Grodno', 'Grodno', 23.83, 53.68, 1, { by: 70, pl: 20, ru: 10 }], ['Witebsk', 'Witebsk', 30.2, 55.19, 1.2], ['Gomel', 'Gomel', 30.98, 52.43, 1.5, null, { oil: 1 }], ['Mogilew', 'Mogilew', 30.33, 53.9, 1]]);
add('LTU', [['Vilnius', 'Vilnius', 25.28, 54.69, 1.2, { lt: 75, pl: 15, ru: 10 }], ['Kaunas', 'Kaunas', 23.9, 54.9, 0.8], ['Klaipėda', 'Klaipėda', 21.13, 55.7, 0.5]]);
add('LVA', [['Riga', 'Riga', 24.1, 56.95, 1.2, { lv: 60, ru: 40 }], ['Latgale', 'Daugavpils', 26.5, 55.87, 0.3, { lv: 40, ru: 60 }], ['Kurland', 'Liepāja', 21.0, 56.5, 0.3], ['Vidzeme', 'Valmiera', 25.6, 57.54, 0.2]]);
add('EST', [['Tallinn', 'Tallinn', 24.75, 59.44, 0.8, { ee: 70, ru: 30 }], ['Tartu', 'Tartu', 26.72, 58.38, 0.3], ['Ida-Viru', 'Narva', 28.2, 59.38, 0.2, { ee: 25, ru: 75 }, { oil: 1 }]]);
add('RUS', [
  ['Kaliningrad', 'Kaliningrad', 20.5, 54.7, 1, { ru: 80, by: 10, lt: 5, de: 5 }], ['Sankt Petersburg', 'Sankt Petersburg', 30.3, 59.93, 5.5, null, { aluminum: 2 }], ['Karelien', 'Petrosawodsk', 34.35, 61.78, 0.6, null, { tungsten: 1 }],
  ['Murmansk', 'Murmansk', 33.08, 68.97, 0.8, null, { steel: 2 }], ['Archangelsk', 'Archangelsk', 40.55, 64.54, 1, null, { oil: 3 }], ['Nowgorod', 'Weliki Nowgorod', 31.27, 58.52, 1.4], ['Smolensk', 'Smolensk', 32.04, 54.78, 1],
  ['Moskau', 'Moskau', 37.62, 55.75, 19, null, { aluminum: 1 }], ['Jaroslawl', 'Jaroslawl', 39.9, 57.63, 2.5], ['Iwanowo', 'Wladimir', 40.4, 56.13, 2], ['Brjansk', 'Brjansk', 34.36, 53.24, 1.2], ['Tula', 'Tula', 37.62, 54.19, 1.6, null, { steel: 3 }],
  ['Kursk', 'Kursk', 36.19, 51.73, 2, null, { steel: 3 }], ['Woronesch', 'Woronesch', 39.2, 51.67, 2.3], ['Belgorod', 'Belgorod', 36.59, 50.6, 1.5, null, { steel: 3 }], ['Rostow', 'Rostow am Don', 39.72, 47.23, 4.2, null, { steel: 1 }],
  ['Krasnodar', 'Krasnodar', 38.98, 45.04, 5.5, null, { oil: 2 }], ['Stawropol', 'Stawropol', 41.97, 45.04, 2.8, null, { oil: 1 }], ['Tschetschenien', 'Grosny', 45.69, 43.32, 3, { ru: 55, ce: 45 }, { oil: 2 }],
  ['Wolgograd', 'Wolgograd', 44.5, 48.72, 2.5, null, { oil: 2 }], ['Saratow', 'Saratow', 46.03, 51.53, 2.5, null, { oil: 1 }], ['Pensa', 'Pensa', 45.0, 53.2, 1.3], ['Nischni Nowgorod', 'Nischni Nowgorod', 44.0, 56.33, 3.2],
  ['Rjasan', 'Rjasan', 39.75, 54.63, 1.1], ['Tambow', 'Tambow', 41.45, 52.72, 1], ['Samara', 'Samara', 50.1, 53.2, 3.2, { ru: 85, tt: 15 }, { oil: 3 }], ['Kasan', 'Kasan', 49.1, 55.8, 3.8, { tt: 50, ru: 50 }, { oil: 1 }],
]);
add('TUR', [
  ['Istanbul', 'Istanbul', 28.98, 41.01, 15], ['Thrakien', 'Edirne', 26.55, 41.68, 1], ['Marmara', 'Bursa', 29.06, 40.18, 5], ['Ägäis', 'Izmir', 27.14, 38.42, 9, null, { chromium: 1 }], ['Antalya', 'Antalya', 30.71, 36.9, 6, null, { chromium: 2 }],
  ['Adana', 'Adana', 35.32, 37.0, 6, null, { chromium: 2 }], ['Ankara', 'Ankara', 32.86, 39.93, 8], ['Konya', 'Konya', 32.48, 37.87, 4], ['Schwarzmeerküste', 'Samsun', 36.33, 41.29, 3], ['Trabzon', 'Trabzon', 39.72, 41.0, 2.5],
  ['Sivas', 'Sivas', 37.02, 39.75, 2], ['Kayseri', 'Kayseri', 35.49, 38.72, 2], ['Malatya', 'Malatya', 38.31, 38.35, 2.5, { tr: 80, ku: 20 }], ['Gaziantep', 'Gaziantep', 37.38, 37.07, 4, { tr: 75, ku: 25 }],
  ['Diyarbakır', 'Diyarbakır', 40.23, 37.91, 5, { ku: 80, tr: 20 }, { oil: 1 }], ['Van', 'Van', 43.4, 38.5, 3, { ku: 75, tr: 25 }, { chromium: 1 }], ['Erzurum', 'Erzurum', 41.27, 39.9, 2.5, { tr: 80, ku: 20 }],
]);
exports.STATES = S;

exports.ALLIANCES = [
  // Die NATO existiert in dieser Welt nicht.
  ['OVKS', ['RUS', 'BLR']],
];

// Terrain-Regeln [lonMin, lonMax, latMin, latMax, Terrain, Wahrscheinlichkeit] – erste passende Regel gewinnt
exports.TERRAIN_RULES = [
  [5.5, 16.5, 45.6, 47.6, 'mountain', 0.8], [-2, 3.2, 42.3, 43.2, 'mountain', 0.85], [5, 15, 59, 63, 'mountain', 0.55], [10, 20, 63, 69.8, 'mountain', 0.6], [-6, -3.2, 56.2, 58.6, 'mountain', 0.6],
  [17.5, 22.5, 48.5, 49.6, 'mountain', 0.7], [22, 27, 47, 49, 'mountain', 0.6], [22.5, 26.5, 45.2, 46.1, 'mountain', 0.7], [15, 20, 42, 45, 'mountain', 0.7], [22, 28, 42.3, 43.3, 'mountain', 0.5],
  [23, 26, 41.3, 42.2, 'mountain', 0.7], [20.5, 22, 39, 40.5, 'mountain', 0.7], [11, 15, 41, 44.5, 'mountain', 0.4], [15.5, 16.5, 38, 40, 'mountain', 0.5], [8.8, 9.6, 39.8, 40.5, 'mountain', 0.6],
  [8.6, 9.4, 41.5, 42.6, 'mountain', 0.7], [-4, -2.5, 36.7, 37.3, 'mountain', 0.7], [-7, -4, 42.8, 43.3, 'mountain', 0.6], [-5.5, -3.5, 40.2, 41.0, 'mountain', 0.5], [38, 45, 37, 41, 'mountain', 0.55],
  [30, 37, 36.5, 38, 'mountain', 0.5], [31, 40, 40.8, 41.4, 'mountain', 0.4], [40, 48, 42.5, 44.0, 'mountain', 0.8], [21, 24, 37.5, 40, 'mountain', 0.45], [24, 26, 35, 35.6, 'mountain', 0.6], [21.5, 23, 36.7, 38, 'mountain', 0.5],
  [-4.3, -3, 51.7, 53.2, 'hill', 0.6], [-2.5, -1.9, 53.3, 55, 'hill', 0.6], [-4, -2, 55, 56, 'hill', 0.5], [7.5, 8.5, 47.7, 48.8, 'forest', 0.7], [6.7, 7.4, 47.8, 48.6, 'hill', 0.7], [2, 4, 44, 46, 'hill', 0.7],
  [5.5, 6.6, 46, 47.3, 'hill', 0.6], [5, 6.5, 49.7, 50.4, 'forest', 0.6], [10, 11.5, 50.2, 51.8, 'forest', 0.55], [12.5, 14, 48.7, 49.8, 'forest', 0.7], [12.5, 13.7, 50.2, 50.7, 'hill', 0.6], [15.5, 17.5, 50.1, 50.8, 'hill', 0.6],
  [13.5, 16, 49.1, 50.2, 'hill', 0.35], [26, 30, 61.5, 64, 'swamp', 0.25], [22, 31, 61, 69.8, 'forest', 0.55], [12, 19, 58, 64, 'forest', 0.55], [14, 21, 64, 68, 'forest', 0.5], [21, 28, 56.5, 59.8, 'forest', 0.45],
  [24, 32, 51.5, 53.2, 'swamp', 0.55], [24, 32, 53.2, 55, 'forest', 0.4], [19.5, 23, 53, 54.5, 'forest', 0.4], [22, 24, 50.5, 53.5, 'forest', 0.4], [29, 35, 60, 66, 'swamp', 0.3], [30, 51, 56, 69, 'forest', 0.6],
  [33, 45, 53.5, 58, 'forest', 0.45], [5, 6, 52, 52.3, 'forest', 0.3], [-9.5, -6.5, 52, 54.5, 'swamp', 0.2], [-10, -8.5, 51.5, 53.5, 'hill', 0.5], [-3, -1.5, 36.7, 37.7, 'desert', 0.8], [-0.5, 0.5, 41.3, 41.8, 'desert', 0.5],
  [-6, -2, 38.5, 40.5, 'hill', 0.35], [31, 36, 38, 40, 'hill', 0.4], [10.5, 12, 43, 43.8, 'hill', 0.5], [11, 13.5, 42, 44, 'hill', 0.4], [5, 10, 58, 60, 'hill', 0.5], [36, 50, 44, 48, 'plains', 1],
  [30, 50, 45, 52, 'plains', 1], [8, 12, 53, 55, 'swamp', 0.15], [12, 14.5, 53, 54, 'swamp', 0.2],
];
