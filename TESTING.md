# Tests

Die App bleibt eine eigenständige HTML-Datei ohne Laufzeit-Abhängigkeiten.
Für die DOM-Tests wird Node.js mit jsdom benötigt:

```sh
npm install --no-save --package-lock=false jsdom@29.1.1
node ui-smoke.cjs
node chord-lab.test.cjs
node arpeggios.test.cjs
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
werden dadurch geprüft. Die zentrale SVG-Griffbrettanzeige wird zusätzlich separat gerendert. Eine vollständige Browserprüfung der Seite
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

## CAGED-Arpeggios

`arpeggios.test.cjs` prüft 720 Kombinationen aus zwölf Tonarten, zwölf
Akkordtypen und fünf CAGED-Lagen. Tonzugehörigkeit, vollständige Intervallabdeckung,
Bundgrenzen, Fingersatzhinweise und nach Tonhöhe sortierte Läufe werden geprüft.
Die DOM-Tests decken Aufwärts-/Abwärts-/Hin-und-zurück-Läufe, Einzelschritte,
Tastaturbedienung, gemeinsame Griffpunkte, Wiedergabeabbruch bei Stop und
Kontextwechsel sowie gespeicherte Einstellungen ab. Audio und Timer werden simuliert.

Manuell: In „Akkordgriffe & CAGED“ A7 wählen, „Arpeggios · CAGED-Lagen“ öffnen
und E-, A-, D- und C-Form vergleichen. Kleine Septime und Griffanker kontrollieren.
Beim Wechsel nach Moll muss die große durch die kleine Terz ersetzt werden.
Die graue Kontur ist die Dur-Grundform als Lagenreferenz, kein zusätzlicher
Akkordton. Türkise Außenringe markieren gleiche Saiten-/Bundpositionen der
vorherigen Lage. „4+“ ist ein Fingersatzvorschlag mit kleiner Lagenverschiebung.
Bei Stop darf kein weiterer Ton des Laufs starten; der bereits angeschlagene
Ton darf kurz ausklingen.

## Gemeinsames Griffbrett

Akkordgriffe, CAGED-Karte und Arpeggios verwenden ausschließlich das zentrale `#fb`.
Die Tests prüfen Griffpositionen auf den korrekten Saiten/Bünden, offene und
stumme Saiten, das Verdecken, Entfernen alter Markierungen beim Schließen und
den Wechsel zur Intervallübung. Ein Neuzeichnen erhält den aktiven Arpeggio-Ton.

Manuell: Zwischen Griffen, CAGED und Arpeggios wechseln; die Anzeige muss immer
oben auf demselben Griffbrett erscheinen. Danach schließen oder ein Lick wählen:
Die normale Übungsansicht samt Progression soll wieder sichtbar sein. Auf mobilen
Geräten Griffbrett horizontal scrollen und Fingersätze auf Lesbarkeit prüfen.
