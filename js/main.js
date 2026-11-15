/* Hearts of Gold – Hauptmenü, Welten, Spielstände */
window.HOG = window.HOG || {};
(function (H) {
  const U = H.util, h = U.h, $ = U.$, D = H.data;
  const app = (H.app = {});
  const WK = 'hog.worlds', SK = 'hog.saves';

  app.show = function (name) {
    ['menu', 'game', 'editor'].forEach((s) => ($('#screen-' + s).hidden = s !== name));
    if (name !== 'game' && app.gameUI) app.gameUI.stop();
    if (name !== 'editor' && app.editor) app.editor.close();
  };
  app.menu = function () { app.show('menu'); app.renderMenu(); };

  app.renderMenu = function () {
    const box = $('#menu-buttons'); box.innerHTML = '';
    box.appendChild(h('button', { class: 'big primary', onclick: () => app.playDialog() }, '▶  Spielen'));
    box.appendChild(h('button', { class: 'big', onclick: () => app.loadGameDialog() }, '📂  Spielstand laden'));
    box.appendChild(h('button', { class: 'big', onclick: () => app.editorDialog() }, '🗺️  Map-Maker'));
    box.appendChild(h('button', { class: 'big', onclick: () => app.helpDialog() }, '❓  Hilfe'));
  };

  // ---------- Welten ----------
  app.worldList = function () {
    const saved = U.storage.get(WK, {});
    return [{ key: '__default', name: '🌍 Mitteleuropa 1936 (Beispielwelt)', make: () => H.worldgen.defaultWorld() }]
      .concat(Object.keys(saved).map((k) => ({ key: k, name: '💾 ' + k, make: () => saved[k] })));
  };
  app.saveWorld = function (world) {
    U.prompt('Welt speichern unter', world.name, (n) => {
      if (!n) return;
      const all = U.storage.get(WK, {}); world.name = n; all[n] = world;
      if (U.storage.set(WK, all)) alert('Welt "' + n + '" im Browser gespeichert.');
    });
  };
  app.loadWorldDialog = function (cb) {
    const saved = U.storage.get(WK, {}), keys = Object.keys(saved);
    const body = h('div', null, keys.length ? keys.map((k) => h('div', { class: 'row' }, h('span', { style: { flex: 1 } }, k + ' (' + Object.keys(saved[k].provinces).length + ' Provinzen)'),
      h('button', { onclick: () => { U.closeModal(); cb(U.clone(saved[k])); } }, 'Laden'),
      h('button', { class: 'x', onclick: () => { delete saved[k]; U.storage.set(WK, saved); U.closeModal(); app.loadWorldDialog(cb); } }, '✕'))) : h('p', { class: 'hint' }, 'Noch keine Welt im Browser gespeichert. Im Map-Maker unter "Welt" kannst du speichern.'));
    U.modal('Gespeicherte Welten', body, [{ label: 'Schließen' }]);
  };

  // ---------- Spielen ----------
  app.playDialog = function () {
    const list = app.worldList();
    let chosen = list[0];
    const sel = h('select', { size: Math.min(8, list.length + 1), onchange: (e) => (chosen = list[e.target.selectedIndex]) }, list.map((w, i) => h('option', { selected: i === 0 }, w.name)));
    U.modal('Welt wählen', h('div', null, sel, h('div', { class: 'row btns' }, h('button', { onclick: async () => { const d = await U.pickFile(); if (d && d.provinces) { U.closeModal(); app.playWorld(d); } else if (d) alert('Keine Welt-Datei.'); } }, '⬆ Welt aus Datei laden'))),
      [{ label: 'Abbrechen' }, { label: 'Weiter ▶', cls: 'primary', onclick: () => { const w = chosen.make(); setTimeout(() => app.playWorld(U.clone(w)), 0); } }]);
  };
  app.playWorld = function (world) {
    const v = H.worldgen.validate(world);
    if (v.warnings.length) console.warn(v.warnings);
    world = v.world;
    const tags = Object.keys(world.countries);
    if (!tags.length) { alert('Diese Welt hat keine Länder mit Staaten.'); return; }
    let pick = tags[0];
    const info = h('div', { class: 'cinfo' });
    const showInfo = () => {
      const c = world.countries[pick], st = Object.values(world.states).filter((s) => s.owner === pick);
      const gdp = st.reduce((a, s) => a + s.gdp, 0), pop = st.reduce((a, s) => a + Object.values(s.pop).reduce((x, y) => x + y, 0), 0);
      info.innerHTML = '';
      info.appendChild(h('div', { class: 'bigflag' }, H.flag.img(c.flag, 96, 64), h('div', null, h('h3', null, c.name), h('div', { class: 'sub' }, D.IDEOLOGIES[c.ideology].name))));
      info.appendChild(h('div', { class: 'sub' }, st.length + ' Staaten · Bevölkerung ' + U.fmtPop(pop) + ' · BIP ' + Math.round(gdp)));
    };
    const grid = h('div', { class: 'cgrid' }, tags.sort((a, b) => world.countries[a].name.localeCompare(world.countries[b].name)).map((t) => {
      const b = h('button', { class: 'cbtn' + (t === pick ? ' on' : ''), onclick: () => { pick = t; grid.querySelectorAll('.cbtn').forEach((x) => x.classList.remove('on')); b.classList.add('on'); showInfo(); } }, H.flag.img(world.countries[t].flag, 30, 20), ' ' + world.countries[t].name);
      return b;
    }));
    const aggr = h('select', null, [['0', 'KI greift nie an (Sandkasten)'], ['1', 'KI-Aggression: normal'], ['2', 'KI-Aggression: hoch']].map(([v_, n], i) => h('option', { value: v_, selected: i === 1 }, n)));
    showInfo();
    U.modal('Wähle dein Land – ' + world.name, h('div', null, grid, info, aggr), [{ label: 'Abbrechen' }, { label: '🚀 Spiel starten', cls: 'primary', onclick: () => { setTimeout(() => app.startGame(world, pick, { aggression: +aggr.value }), 0); } }]);
  };
  app.startGame = function (world, tag, opts) {
    app.show('game');
    app.gameUI = app.gameUI || new H.GameUI();
    const sim = H.Sim.newGame(world, tag, opts);
    app.gameUI.start(sim);
  };

  // ---------- Spielstände ----------
  app.gameMenu = function () {
    const ui = app.gameUI, wasSpeed = ui.speed; ui.setSpeed(0);
    const body = h('div', { class: 'col' },
      h('button', { onclick: () => U.closeModal() }, '▶ Weiter'),
      h('button', { onclick: () => { U.closeModal(); app.saveGameDialog(); } }, '💾 Spielstand speichern'),
      h('button', { onclick: () => { U.closeModal(); app.loadGameDialog(); } }, '📂 Spielstand laden'),
      h('button', { onclick: () => { U.download('hog-' + ui.sim.dateStr().replace(/\./g, '-') + '.hog-save.json', U.toJSON(ui.sim.toSave())); } }, '⬇ Spielstand als Datei'),
      h('button', { class: 'danger', onclick: () => { U.closeModal(); app.menu(); } }, '🏠 Hauptmenü'));
    U.modal('Menü', body, [{ label: 'Schließen', onclick: () => { if (wasSpeed) ui.setSpeed(wasSpeed); } }]);
  };
  app.saveGameDialog = function () {
    const ui = app.gameUI;
    U.prompt('Spielstand speichern als', ui.sim.country(ui.player).name + ' ' + ui.sim.dateStr(), (n) => {
      if (!n) return;
      const all = U.storage.get(SK, {});
      all[n] = { meta: { country: ui.player, date: ui.sim.dateStr(), ts: Date.now(), world: ui.sim.world.name }, data: ui.sim.toSave() };
      if (U.storage.set(SK, all)) ui.toast('Spielstand "' + n + '" gespeichert.');
    });
  };
  app.loadGameDialog = function () {
    const all = U.storage.get(SK, {}), keys = Object.keys(all).sort((a, b) => all[b].meta.ts - all[a].meta.ts);
    const body = h('div', null,
      keys.length ? keys.map((k) => h('div', { class: 'row' }, h('span', { style: { flex: 1 } }, k, h('div', { class: 'sub' }, all[k].meta.world + ' · ' + all[k].meta.date)),
        h('button', { onclick: () => { U.closeModal(); app.loadGame(all[k].data); } }, 'Laden'),
        h('button', { class: 'x', onclick: () => { delete all[k]; U.storage.set(SK, all); U.closeModal(); app.loadGameDialog(); } }, '✕'))) : h('p', { class: 'hint' }, 'Keine Spielstände im Browser.'),
      h('div', { class: 'row btns' }, h('button', { onclick: async () => { const d = await U.pickFile(); if (d && d.g && d.world) { U.closeModal(); app.loadGame(d); } else if (d) alert('Keine Spielstand-Datei.'); } }, '⬆ Aus Datei laden')));
    U.modal('Spielstand laden', body, [{ label: 'Schließen' }]);
  };
  app.loadGame = function (save) {
    if (!save.g || save.g.version !== 2) { alert('Dieser Spielstand stammt von einer älteren Version und ist nicht kompatibel.'); return; }
    app.show('game');
    app.gameUI = app.gameUI || new H.GameUI();
    app.gameUI.start(H.Sim.fromSave(U.clone(save)));
  };

  // ---------- Editor ----------
  app.editorDialog = function () {
    const body = h('div', { class: 'col' },
      h('button', { onclick: () => { U.closeModal(); app.openEditor(H.worldgen.emptyWorld()); } }, '📄 Neue leere Welt'),
      h('button', { onclick: () => { U.closeModal(); app.openEditor(H.worldgen.defaultWorld()); } }, '🌍 Beispielwelt bearbeiten'),
      h('button', { onclick: () => { U.closeModal(); app.loadWorldDialog((w) => app.openEditor(w)); } }, '💾 Gespeicherte Welt laden'),
      h('button', { onclick: async () => { const d = await U.pickFile(); if (d && d.provinces) { U.closeModal(); app.openEditor(d); } else if (d) alert('Keine Welt-Datei.'); } }, '⬆ Welt aus Datei'));
    U.modal('Map-Maker', body, [{ label: 'Abbrechen' }]);
  };
  app.openEditor = function (world) {
    app.show('editor');
    app.editor = app.editor || new H.MapMaker();
    app.editor.open(world);
    app.editor.view.fit();
  };
  app.helpDialog = function () {
    U.modal('Hilfe', h('div', { class: 'help' },
      h('h4', null, 'Spiel'),
      h('ul', null, h('li', null, 'Klick auf Provinz: Staat ansehen, eigene Truppen werden gewählt. Rechtsklick auf Ziel: Truppen bewegen.'),
        h('li', null, 'Leertaste = Pause, 1–4 = Geschwindigkeit. Mausrad = Zoom, Ziehen = Karte verschieben.'),
        h('li', null, 'BIP-Geld → Zivil-/Rüstungsfabriken, Kraftwerke und Häfen bauen. Mehr Zivilfabriken = schneller bauen.'),
        h('li', null, 'Produktion: Rüstungsfabriken werden auf Ausrüstungslinien verteilt (Gewehre, Geschütze, Panzer, Flugzeuge, Schiffsrümpfe). Jede Fabrik verbraucht Ressourcen pro Tag aus der Gesamtsumme deines Landes – fehlt etwas, sinkt der Ausstoß. Fehlendes kannst du importieren.'),
        h('li', null, 'Truppen werden aus Ausrüstung + Manpower ausgebildet. Die Mannstärke-Regel (Reiter "Land") legt fest, wie viel Bevölkerung rekrutierbar ist – und was das die Wirtschaft kostet.'),
        h('li', null, 'Terrain (Wald, Hügel, Gebirge, Sumpf, Wüste) ändert Verteidigung, Angriff und Tempo. Landtruppen schiffen sich in Häfen ein, fahren dann als Transportschiffe über Wasser; Zerstörer, Kreuzer, Schlachtschiffe werden in Häfen gebaut.'),
        h('li', null, 'Staaten haben Besitzer und Okkupant. Im Frieden sind beide gleich; besetzte Staaten kannst du im Friedensschluss annektieren.'),
        h('li', null, 'Minderheiten, die nicht "integriert" sind, erzeugen Unruhe und senken BIP/Produktion. Die Regel "Ethnische Unterdrückung" beseitigt sie schneller, erhöht aber das Chaos.')),
      h('h4', null, 'Map-Maker'),
      h('ul', null, h('li', null, 'Neue Land- oder Wasserprovinz: Punkte klicken, Doppelklick/Enter schließt sie. Die Eckpunkte der anderen Provinzen werden angezeigt (Land grün, Wasser blau) – so setzt du exakte Grenzen. Mit "Punkte erhöhen" teilst du Kanten für feinere Formen.'),
        h('li', null, 'Pro Provinz: Terrain, Stadt und Hafen (nur an Wasser) einstellen.'),
        h('li', null, 'Provinz gewählt → Punkte ziehen. Benachbarte Grenzpunkte bewegen sich mit ("Grenzen verbunden"). Shift beim Ziehen = kein Magnet.'),
        h('li', null, 'Reiter Staaten/Länder/Allianzen/Ethnien bearbeiten Fabriken, Ressourcen, Bevölkerung, Flagge, Ideologie, Bündnisse usw. Strg+Z = Rückgängig.'),
        h('li', null, 'Unter "Welt" speichern, laden, exportieren – und mit "Diese Welt spielen" direkt testen.'))), [{ label: 'OK' }]);
  };

  window.addEventListener('DOMContentLoaded', () => {
    $('#ed-back').onclick = () => U.modal('Zurück ins Menü', 'Nicht gespeicherte Änderungen der Welt gehen verloren. Trotzdem verlassen?', [{ label: 'Bleiben' }, { label: 'Menü', cls: 'danger', onclick: () => app.menu() }]);
    app.menu();
  });
})(window.HOG);
