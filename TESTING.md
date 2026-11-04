# Tests

Die App bleibt eine eigenständige HTML-Datei ohne Laufzeit-Abhängigkeiten.
Für die DOM-Tests wird Node.js mit jsdom benötigt:

```sh
npm install --no-save --package-lock=false jsdom@29.1.1
node ui-smoke.cjs
node chord-lab.test.cjs
```

`ui-smoke.cjs` prüft die bestehende Oberfläche, Transportsteuerung, Progression,
Countdown, Zieltöne, Lick-Ausblendung, Triaden-Voicings und gespeicherte Einstellungen.

`chord-lab.test.cjs` prüft alle 620 derzeit erzeugten Akkordgriffe in zwölf Tonarten
und zwölf Akkordtypen. Es kontrolliert erlaubte und notwendige Akkordtöne,
Bundgrenzen, Fingersätze, Barrés und die fünf CAGED-Dur-Formen je Tonart.
Zusätzlich prüft es Auswahl, Griffwechsel, Notenschreibweise, Diagrammerzeugung,
Abrufübung, Wiedergabeparameter, unabhängige Einstellungen und Wiederherstellung.
Die Zahl 620 umfasst Transpositionen und Oktavlagen der 30 Griffvorlagen.

Audio wird in den Tests simuliert; weder Klangqualität noch Mikrofonhardware
werden dadurch geprüft. Die SVG-Griffdiagramme und die CAGED-Karte wurden separat
gerendert und visuell kontrolliert. Eine vollständige Browserprüfung der Seite
war in der Arbeitsumgebung durch die Browserrichtlinie blockiert.

## Manuell im Browser prüfen

- „Akkordgriffe & CAGED“ öffnen. A7, A9, A13 und A7♯9 wählen, Fingersatz und
  tatsächlich klingende Saiten vergleichen; ×-Saiten dürfen nicht erklingen.
- „Saite für Saite“ und „Akkord hören“ vergleichen. Lautstärke zuerst niedrig einstellen.
- „Griff verdecken“, nächsten Griff wählen, aus dem Gedächtnis greifen und aufdecken.
- C-Dur in „CAGED · Dur“ öffnen und C-, A-, G-, E- und D-Form durchschalten.
  Die Akkordbezeichnung bleibt C; Grundtöne sind goldfarben.
- Dur-Pentatonik und Dreiklangstöne ein-/ausblenden. Auf schmalen Bildschirmen
  muss die Halsübersicht innerhalb ihres Bereichs horizontal scrollbar sein.
- Auswahl ändern, Seite neu laden und den Bereich erneut öffnen. Die Auswahl
  soll wiederhergestellt werden; die bisherige Progression bleibt unverändert.
- Tastaturbedienung, mobile Darstellung, Spielmodus sowie parallele Bibliotheks-
  und Editoransicht prüfen.
