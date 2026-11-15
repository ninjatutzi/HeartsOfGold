# Hearts of Gold

Eine 2D-Version eines Grand-Strategy-Spiels (inspiriert von HOI4), komplett im Browser – ohne Build-Schritt.

**Starten:** `index.html` im Browser öffnen (Doppelklick genügt) – oder `python3 -m http.server` und `http://localhost:8000` öffnen.

## Spielprinzip

- **Welt → Länder → Staaten → Provinzen** (z. B. Österreich → Salzburg → mehrere Provinzen).
- **Staaten** haben einen **Besitzer** (Ursprungsland) und einen **Okkupanten** (wer sie gerade kontrolliert). Im Frieden sind beide gleich, im Krieg ändert sich der Okkupant. Beim Friedensschluss können besetzte Staaten annektiert werden; alles andere geht an den Besitzer zurück.
- **Bevölkerung** nach Ethnien (z. B. 900 K Ungarn + 100 K Deutsche). Die Ethnie des Besitzers wächst schneller. **Nicht integrierte Minderheiten** erzeugen Unruhe und senken BIP/Produktion. Jedes Land definiert selbst, welche Ethnien integriert sind (Russland: Jakuten, Kasachen …).
- **Landesregeln**, z. B. *Ethnische Unterdrückung*: Minderheiten verschwinden schneller, dafür mehr Chaos.
- **Wirtschaft:** BIP-Geld → Zivilfabriken, Rüstungsfabriken, Kraftwerke bauen. Mehr Zivilfabriken = schneller bauen. Energie (Kraftwerke) begrenzt die Effizienz der Fabriken. Ressourcen: Öl, Aluminium, Stahl, Wolfram, Chrom (zukaufbar).
- **Feste Truppen** (kein Designer): Infanterie, Artillerie, Panzer, Jagdgeschwader – produziert in Rüstungsfabriken.
- **Forschungsbaum** mit ~30 Technologien (Waffen, Industrie, Wirtschaft, Manpower …).
- **Ideologien:** Demokratisch, Faschistisch, Kommunistisch, Monarchistisch (mit unterschiedlichen Boni). Jedes Land hat eine Flagge (im Editor gestaltbar).
- **Allianzen:** Bündnispartner treten Kriegen automatisch bei. KI-Länder bauen, forschen, rüsten, erklären Kriege und schließen Frieden.

### Steuerung
Klick = Provinz wählen (eigene Truppen werden mitgewählt) · Rechtsklick = Truppen bewegen · Mausrad = Zoom · Ziehen = Karte verschieben · Leertaste = Pause · 1–4 = Geschwindigkeit.

## Map-Maker
Unter **Map-Maker** im Hauptmenü:
- **Neue Provinz** per Punkt-Klick, Punkte ziehen, Punkte einfügen/löschen, **„Punkte erhöhen“** für genauere Grenzen, Provinz verschieben, Magnet an Nachbargrenzen.
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
