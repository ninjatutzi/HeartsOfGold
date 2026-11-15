# Hearts of Gold

Eine 2D-Version eines Grand-Strategy-Spiels (inspiriert von HOI4), komplett im Browser – ohne Build-Schritt.

**Welten:** *Europa 2020* (echte Länderumrisse aus Natural Earth, 39 Länder, ~300 Staaten, ~630 Land- und 280 Wasserprovinzen, Start 1.1.2020, NATO/OVKS-Bündnisse) und *Mitteleuropa 1936* (Beispielwelt).
Die 2020-Karte wird mit `node tools/gen-europe.js <ne_50m_admin_0_countries.geojson>` erzeugt (Daten in `tools/europe-data.js`).

**Starten:** `index.html` im Browser öffnen (Doppelklick genügt) – oder `python3 -m http.server` und `http://localhost:8000` öffnen.

## Spielprinzip

- **Welt → Länder → Staaten → Provinzen** (z. B. Österreich → Salzburg → mehrere Provinzen).
- **Staaten** haben einen **Besitzer** (Ursprungsland) und einen **Okkupanten** (wer sie gerade kontrolliert). Im Frieden sind beide gleich, im Krieg ändert sich der Okkupant. Beim Friedensschluss können besetzte Staaten annektiert werden; alles andere geht an den Besitzer zurück.
- **Bevölkerung** nach Ethnien (z. B. 900 K Ungarn + 100 K Deutsche). Die Ethnie des Besitzers wächst schneller. **Nicht integrierte Minderheiten** erzeugen Unruhe und senken BIP/Produktion. Jedes Land definiert selbst, welche Ethnien integriert sind (Russland: Jakuten, Kasachen …).
- **Landesregeln**, z. B. *Ethnische Unterdrückung*: Minderheiten verschwinden schneller, dafür mehr Chaos.
- **Wirtschaft:** BIP-Geld → Zivilfabriken, Rüstungsfabriken, Kraftwerke, Häfen bauen. Mehr Zivilfabriken = schneller bauen. Energie (Kraftwerke) begrenzt die Effizienz der Fabriken.
- **Ressourcen wie in HOI4:** Öl, Aluminium, Stahl, Wolfram, Chrom sind ein Angebot pro Tag (Summe aller Staaten), kein Lager. Jede Rüstungsfabrik verbraucht pro Tag Ressourcen; bei Mangel sinkt der Ausstoß. Fehlendes wird gegen Geld importiert.
- **Equipment-Hersteller:** Rüstungsfabriken werden auf Linien verteilt (Gewehre, Geschütze, Panzer, Flugzeuge, Schiffsrümpfe) und füllen ein Ausrüstungslager.
- **Feste Truppen** (kein Designer): Infanterie, Artillerie, Panzer, Jagdgeschwader, Zerstörer, Kreuzer, Schlachtschiff – ausgebildet aus Ausrüstung + Manpower.
- **Mannstärke-Regeln:** Freiwilligenarmee … Totale Mobilmachung bestimmen den rekrutierbaren Bevölkerungsanteil (und kosten BIP). Nicht integrierte Minderheiten zählen nur zu 25 %.
- **Terrain & Wasser:** Ebene, Wald, Hügel, Gebirge, Sumpf, Wüste (je andere Verteidigungs-/Angriffs-/Tempo-Faktoren, Texturen auf der Karte). Wasserprovinzen sind für Landtruppen unpassierbar. In Häfen schiffen sich Truppen ein und fahren als Transportschiffe (ohne Geschütze). Städte geben Verteidigungsbonus.
- **Forschungsbaum** mit ~30 Technologien (Waffen, Industrie, Wirtschaft, Manpower …).
- **Ideologien:** Demokratisch, Faschistisch, Kommunistisch, Monarchistisch (mit unterschiedlichen Boni). Jedes Land hat eine Flagge (im Editor gestaltbar).
- **Allianzen:** Bündnispartner treten Kriegen automatisch bei. KI-Länder bauen, forschen, rüsten, erklären Kriege und schließen Frieden.

### Steuerung
Klick = Provinz wählen (eigene Truppen werden mitgewählt) · Rechtsklick = Truppen bewegen · Mausrad = Zoom · Ziehen = Karte verschieben · Leertaste = Pause · 1–4 = Geschwindigkeit.

## Map-Maker
Unter **Map-Maker** im Hauptmenü:
- **Neue Land-/Wasserprovinz** per Punkt-Klick (Eckpunkte anderer Provinzen werden grün/blau angezeigt), Punkte ziehen, Punkte einfügen/löschen, **„Punkte erhöhen“** für genauere Grenzen, Provinz verschieben, Magnet an Nachbargrenzen.
- Pro Provinz: **Terrain, Stadt, Hafen**.
- **Staaten** erstellen, Provinzen per Klick zuweisen; Fabriken, Kraftwerke, Ressourcen, BIP, Bevölkerung (je Ethnie) bearbeiten.
- **Länder** erstellen: Name, Farbe, Flagge, Ideologie, Staatsvolk, integrierte Ethnien, Regeln, Hauptstadt.
- **Allianzen** und **Ethnien** verwalten, Verbindungen über Meer setzen.
- **Welten speichern/laden** (Browser oder Datei) und direkt per „Diese Welt spielen“ testen. Spielstände werden ebenfalls gespeichert.

## Struktur (modular)
| Datei | Inhalt |
|---|---|
| `js/data.js` | Ressourcen, Ideologien, Landesregeln, Einheiten, Gebäude, Forschungsbaum – hier einfach erweitern |
| `js/worldgen.js` | Beispielwelt (Mitteleuropa), Welt-Validierung |
| `js/sim.js` | Simulation: Wirtschaft, Bevölkerung, Kampf, Krieg/Frieden |
| `js/ai.js` | KI |
| `js/mapview.js` | Karten-Rendering/Kamera (Spiel & Editor) |
| `js/ui-game.js`, `js/mapmaker.js`, `js/main.js` | Oberflächen, Menüs, Speichern |
