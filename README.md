# Hearts of Gold

Eine 2D-Version eines Grand-Strategy-Spiels (inspiriert von HOI4), komplett im Browser – ohne Build-Schritt.

**Welten:**
- *Europa 1936* – historische Grenzen (Daten: historical-basemaps „world_1930“, ergänzt mit Natural Earth): Polen mit Ostgebieten, Tschechoslowakei, unabhängiges Österreich, Baltikum, Finnland mit Wyborg, Jugoslawien, Sowjetunion …
- *Europa 2020* – moderne Grenzen (Natural Earth), 39 Länder, Start 1.1.2020, ohne NATO (nur OVKS).
- *Mitteleuropa 1936* – kleine, einfache Beispielwelt.

Die beiden Europa-Karten erzeugt `tools/gen-europe.js` (Daten in `tools/europe-data.js` und `tools/europe-1936.js`):
`node tools/gen-europe.js 2020 <ne_50m_admin_0_countries.geojson>` bzw. `node tools/gen-europe.js 1936 <ne_50m…geojson> <world_1930.geojson>`.

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
- **Forschungsbaum** mit 77 Technologien in 9 Zweigen (Infanterie, Artillerie, Panzer, Luftwaffe, Marine, Industrie, Wirtschaft, Logistik, Gesellschaft).
- **Ideologien:** Demokratisch, Faschistisch, Kommunistisch, Monarchistisch (mit unterschiedlichen Boni). Im Spiel wechselbar (Reiter „Land“) – das löst 60 Tage Umbruch aus: Unruhe +25, BIP −20 %, Rüstung −25 %, Forschung −20 %, Truppen −10 % HP; danach 180 Tage Sperre. Jedes Land hat eine Flagge (im Editor gestaltbar).
- **Allianzen:** Bündnispartner treten Kriegen automatisch bei. KI-Länder bauen, forschen, rüsten, erklären Kriege und schließen Frieden.

### Armeen (wie in HOI4)
- Unten mittig: **＋** erstellt eine Armee (ausgewählte Truppen kommen hinein). Mehrere Armeen möglich, jede hat eine Farbe, die nur du siehst (Streifen am Truppen-Marker, Umrandung der Front).
- **Rechtsklick auf eine Armee** mit ausgewählten Truppen = Truppen hinzufügen; Linksklick = Armee wählen.
- **🧭 Grenze:** Modus anschalten, rechte Maustaste gedrückt halten und entlang der Grenze zu einem Land ziehen. Die Armee verteilt sich gleichmäßig auf die Grenzprovinzen (8 Truppen auf 4 Provinzen = je 2) und die Front passt sich dynamisch an, wenn sich die Grenze verschiebt.
- **➡️ Angriff:** Modus anschalten, eine oder mehrere feindliche Provinzen anklicken, **✔** drücken – die Armee verteilt sich auf diese Provinzen und greift an. 🚫 löscht Befehle, 🗑 löst die Armee auf.
- Provinzen werden erst nach ein paar Tagen ungestörter Anwesenheit besetzt. Die KI marschiert geschlossen auf (Aufstellung, dann Vorstoß auf ein Ziel) und zerstreut sich nicht.

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
