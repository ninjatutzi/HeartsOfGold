// Daten für den Europa-1936-Modus des Generators (Grenzen aus historical-basemaps "world_1930", Stand vor Anschluss/Sudetenkrise)
const D20 = require('./europe-data.js');
const F = (pattern, c1, c2, c3, emblem) => ({ pattern, c1, c2, c3, emblem: emblem || 'none' });
const flag = (t) => D20.COUNTRIES.find((c) => c[0] === t)[8];
const col = (t) => D20.COUNTRIES.find((c) => c[0] === t)[3];

// Name im Datensatz -> Tag (nicht aufgeführte Namen = außerhalb der Karte)
exports.NAME_TO_TAG = {
  Greece: 'GRC', Danzig: 'POL', 'East Prussia': 'GER', Poland: 'POL', Denmark: 'DEN', 'United Kingdom of Great Britain and Ireland': 'GBR', Italy: 'ITA', 'Dodecanese Islands': 'ITA',
  Germany: 'GER', Czechoslovakia: 'CZE', Romania: 'ROM', Hungary: 'HUN', Bulgaria: 'BGR', Yugoslavia: 'YUG', Sweden: 'SWE', Finland: 'FIN', Norway: 'NOR', Austria: 'AUT',
  Netherlands: 'NLD', Portugal: 'PRT', Albania: 'ALB', Spain: 'ESP', Belgium: 'BEL', Lithuania: 'LTU', Latvia: 'LVA', Estonia: 'EST', France: 'FRA', Switzerland: 'SUI',
  Luxembourg: 'LUX', Turkey: 'TUR', 'Republic of Turkey': 'TUR', 'White Russia': 'SOV',
};

// [Tag, Name, Hauptethnie, Farbe, Ideologie, Reichtum, (unbenutzt), Hauptstadt, Flagge, integrierte Ethnien, Mannstärke-Regel]
exports.COUNTRIES = [
  ['GBR', 'Vereinigtes Königreich', 'en', '#c4606a', 'democratic', 1.4, 0, 'London', F('cross', '#1c3f94', '#ffffff', '#c8102e'), ['sc', 'cy'], 'limited'],
  ['IRL', 'Irland', 'ie', '#3f9e5a', 'democratic', 0.7, 0, 'Dublin', flag('IRL'), [], 'volunteer'],
  ['FRA', 'Frankreich', 'fr', '#4a78b5', 'democratic', 1.1, 0, 'Île-de-France', flag('FRA'), [], 'extended'],
  ['ESP', 'Spanien', 'es', '#e0952f', 'democratic', 0.6, 0, 'Madrid', F('h3', '#c8102e', '#f1c40f', '#6a2c91'), ['ca', 'ba'], 'limited'],
  ['PRT', 'Portugal', 'pt', '#2f8f6a', 'fascist', 0.5, 0, 'Lissabon', flag('PRT'), [], 'limited'],
  ['GER', 'Deutschland', 'de', '#707070', 'fascist', 1.3, 0, 'Berlin', F('solid', '#c8102e', '#ffffff', '#ffffff', 'circle'), ['dk'], 'extended'],
  ['NLD', 'Niederlande', 'nl', '#e08a3a', 'democratic', 1.3, 0, 'Amsterdam', flag('NLD'), [], 'volunteer'],
  ['BEL', 'Belgien', 'fl', '#d6c24a', 'democratic', 1.2, 0, 'Brüssel', flag('BEL'), ['wa'], 'limited'],
  ['LUX', 'Luxemburg', 'lu', '#6ab0d9', 'democratic', 1.5, 0, 'Luxemburg', flag('LUX'), [], 'volunteer'],
  ['SUI', 'Schweiz', 'ch', '#e8e8e8', 'democratic', 1.6, 0, 'Bern', flag('CHE'), [], 'extended'],
  ['AUT', 'Österreich', 'at', '#e6dca0', 'monarchist', 0.8, 0, 'Wien', flag('AUT'), ['de'], 'limited'],
  ['ITA', 'Italien', 'it', '#9cc45a', 'fascist', 0.8, 0, 'Latium', flag('ITA'), [], 'extended'],
  ['DEN', 'Dänemark', 'dk', '#b05050', 'democratic', 1.5, 0, 'Kopenhagen', flag('DNK'), [], 'volunteer'],
  ['NOR', 'Norwegen', 'no', '#c04a5a', 'democratic', 1.2, 0, 'Oslo', flag('NOR'), [], 'volunteer'],
  ['SWE', 'Schweden', 'se', '#d9c23a', 'democratic', 1.4, 0, 'Stockholm', flag('SWE'), [], 'limited'],
  ['FIN', 'Finnland', 'fi', '#9fd0e6', 'democratic', 0.8, 0, 'Helsinki', flag('FIN'), [], 'extended'],
  ['POL', 'Polen', 'pl', '#d88aa8', 'democratic', 0.5, 0, 'Masowien', flag('POL'), [], 'extended'],
  ['CZE', 'Tschechoslowakei', 'cz', '#3aa6a6', 'democratic', 1.0, 0, 'Prag', flag('CZE'), ['sk'], 'extended'],
  ['HUN', 'Ungarn', 'hu', '#4f9a5b', 'monarchist', 0.6, 0, 'Budapest', flag('HUN'), [], 'limited'],
  ['YUG', 'Jugoslawien', 'sr', '#8d6fb5', 'monarchist', 0.45, 0, 'Belgrad', F('h3', '#2b4a9a', '#ffffff', '#c8102e', 'star'), ['hr', 'sl', 'bs', 'me', 'mk'], 'extended'],
  ['ROM', 'Rumänien', 'ro', '#d1a23b', 'monarchist', 0.45, 0, 'Bukarest', flag('ROU'), ['md'], 'limited'],
  ['BGR', 'Bulgarien', 'bg', '#5aa06a', 'monarchist', 0.4, 0, 'Sofia', flag('BGR'), [], 'limited'],
  ['GRC', 'Griechenland', 'gr', '#5a8fd0', 'monarchist', 0.45, 0, 'Athen', flag('GRC'), [], 'limited'],
  ['ALB', 'Albanien', 'al', '#b03a3a', 'monarchist', 0.2, 0, 'Tirana', flag('ALB'), [], 'volunteer'],
  ['TUR', 'Türkei', 'tr', '#c8553a', 'democratic', 0.35, 0, 'Ankara', flag('TUR'), [], 'extended'],
  ['SOV', 'Sowjetunion', 'ru', '#9c2b2b', 'communist', 0.6, 0, 'Moskau', F('canton', '#c8102e', '#c8102e', '#f1c40f', 'star'), ['by', 'yk', 'kk', 'tt'], 'service'],
  ['EST', 'Estland', 'ee', '#5aa0d0', 'democratic', 0.6, 0, 'Tallinn', flag('EST'), [], 'volunteer'],
  ['LVA', 'Lettland', 'lv', '#9e3b4e', 'democratic', 0.55, 0, 'Riga', flag('LVA'), [], 'volunteer'],
  ['LTU', 'Litauen', 'lt', '#c0b04a', 'democratic', 0.45, 0, 'Kaunas', flag('LTU'), [], 'volunteer'],
];

// Bevölkerungsfaktor 1936 gegenüber 2020 (nach ursprünglichem Land der Region)
exports.FACTOR = { GBR: 0.7, IRL: 0.6, FRA: 0.62, ESP: 0.53, PRT: 0.65, DEU: 0.8, NLD: 0.5, BEL: 0.7, LUX: 0.5, CHE: 0.5, AUT: 0.75, ITA: 0.75, DNK: 0.6, NOR: 0.5, SWE: 0.6, FIN: 0.65, POL: 0.85, CZE: 1.3, SVK: 0.6, HUN: 0.9, ROU: 0.85, BGR: 0.85, GRC: 0.65, UKR: 0.75, BLR: 0.65, RUS: 0.8, TUR: 0.2, SVN: 0.7, HRV: 0.8, BIH: 0.8, SRB: 0.9, MNE: 0.8, MKD: 0.8, KOS: 0.8, ALB: 0.35, MDA: 0.8, LTU: 0.9, LVA: 0.9, EST: 0.9 };

// Ethnische Zusammensetzung 1936 (überschreibt die Zahlen von 2020 pro Staat)
exports.ETH = {
  Niederschlesien: { de: 95, pl: 5 }, Westpommern: { de: 95, pl: 5 }, 'Ermland-Masuren': { de: 90, pl: 10 }, Kaliningrad: { de: 95, pl: 5 }, Brandenburg: { de: 100 },
  Pommern: { pl: 55, de: 45 }, Oberschlesien: { pl: 75, de: 25 }, Großpolen: { pl: 90, de: 10 }, Kleinpolen: { pl: 80, ua: 15, de: 5 }, Karpatenvorland: { pl: 60, ua: 35, de: 5 },
  Lublin: { pl: 85, ua: 10, de: 5 }, Masowien: { pl: 90, by: 5, de: 5 }, Lodz: { pl: 90, de: 10 }, Kujawien: { pl: 85, de: 15 }, Podlachien: { pl: 60, by: 35, ua: 5 },
  Lwiw: { ua: 55, pl: 40, de: 5 }, Wolhynien: { ua: 70, pl: 25, de: 5 }, Brest: { by: 55, pl: 35, ua: 10 }, Grodno: { by: 45, pl: 45, lt: 10 }, Vilnius: { pl: 60, lt: 15, by: 25 },
  Transkarpatien: { ua: 60, hu: 15, sk: 15, cz: 10 }, Prag: { cz: 90, de: 10 }, Nordböhmen: { cz: 35, de: 65 }, Westböhmen: { cz: 50, de: 50 }, Südböhmen: { cz: 70, de: 30 }, Ostböhmen: { cz: 80, de: 20 },
  Mähren: { cz: 70, de: 25, sk: 5 }, Nordmähren: { cz: 70, de: 20, pl: 10 }, Bratislava: { sk: 60, hu: 20, de: 20 }, Nordwestslowakei: { sk: 90, cz: 5, hu: 5 }, Mittelslowakei: { sk: 85, hu: 10, de: 5 }, Ostslowakei: { sk: 60, ua: 20, hu: 15, de: 5 },
  Südtirol: { de: 70, it: 30 }, Friaul: { it: 75, sl: 25 }, Istrien: { it: 45, hr: 45, sl: 10 }, Küstenland: { sl: 50, it: 50 }, Dalmatien: { hr: 90, it: 10 },
  Kosovo: { al: 75, sr: 25 }, Vojvodina: { sr: 45, hu: 25, de: 20, ro: 5, hr: 5 }, Slowenien: { sl: 92, de: 5, hr: 3 }, Ljubljana: { sl: 92, de: 5, hr: 3 }, Maribor: { sl: 85, de: 15 },
  Skopje: { sr: 70, al: 30 }, Bitola: { sr: 85, al: 15 }, Sarajevo: { bs: 50, sr: 30, hr: 20 }, 'Banja Luka': { sr: 60, bs: 30, hr: 10 }, Herzegowina: { hr: 55, bs: 35, sr: 10 }, Tuzla: { bs: 70, hr: 15, sr: 15 },
  Chișinău: { ro: 55, ua: 15, ru: 15, md: 15 }, Nordmoldau: { ro: 45, ua: 30, ru: 15, md: 10 }, Nordsiebenbürgen: { ro: 60, hu: 28, de: 12 }, Südsiebenbürgen: { ro: 65, hu: 20, de: 15 }, Banat: { ro: 55, hu: 15, de: 20, sr: 10 }, Kreischgebiet: { ro: 60, hu: 36, de: 4 },
  Dobrudscha: { ro: 65, bg: 20, tr: 15 }, 'Ida-Viru': { ee: 60, ru: 40 }, Riga: { lv: 75, ru: 10, de: 15 }, Latgale: { lv: 55, ru: 40, pl: 5 },
  Donezk: { ua: 50, ru: 50 }, Luhansk: { ua: 55, ru: 45 }, Krim: { ru: 60, ua: 25, tt: 15 }, Smolensk: { ru: 100 },
};

exports.ALLIANCES = [
  ['Achsenmächte', ['GER', 'ITA', 'HUN']],
  ['Westmächte', ['GBR', 'FRA', 'POL']],
  ['Kleine Entente', ['CZE', 'YUG', 'ROM']],
];
