# Tests

Die App bleibt eine eigenständige HTML-Datei ohne Laufzeit-Abhängigkeiten.
Die Tests benötigen Node.js und jsdom:

```sh
npm install --no-save --package-lock=false jsdom@29.1.1
node ui-smoke.cjs
node chord-lab.test.cjs
node arpeggios.test.cjs
```

- `ui-smoke.cjs`: bestehende Oberfläche, Transport, Progression, Countdown,
  Zieltöne, Lick-Ausblendung, Triaden-Voicings und gespeicherte Einstellungen.
- `chord-lab.test.cjs`: 620 Griffe aus 30 Vorlagen über zwölf Tonarten und zwölf
  Akkordtypen; notwendige Akkordtöne, Fingersätze, Barrés, CAGED-Grundformen,
  zentrale Griffbrettpositionen und die vereinfachte Bedienung. Alle fünf Lagen
  behalten den gewählten Akkordtyp. Griff/Arpeggio/beides, fehlende Griffe,
  Verdecken, freie Griffauswahl, Ansichtswechsel und Speicherung werden geprüft.
- `arpeggios.test.cjs`: 720 Kombinationen aus Tonart, Akkordtyp und CAGED-Lage;
  Tonzugehörigkeit, Intervallabdeckung, Bundgrenzen und Läufe. Der gemeinsame
  Start/Stop-Knopf wird für alle Anzeigen und Laufrichtungen geprüft, inklusive
  Akkordanschlag, Ende, Stop und Abbruch beim Wechsel des Griffs. Tastatur,
  Einzelschritte, gemeinsame Griffpunkte und Wiederherstellung sind abgedeckt.

Audio und Timer werden simuliert. Klangqualität und Mikrofonhardware sind damit
nicht geprüft. Die zentrale SVG-Anzeige wird separat gerendert und kontrolliert.
Eine vollständige Browserprüfung war durch die Browserrichtlinie blockiert.

## Manuell prüfen

- „Akkordgriffe & CAGED“ öffnen: Grundton, Akkordtyp, Lage und Anzeige wählen.
  „Weitere Optionen“ ist anfangs geschlossen. Keine separate Dur-Ansicht.
- Am7, A7, A9 und A13 in C-, A-, G-, E- und D-Lage vergleichen. Der Akkordtyp
  bleibt erhalten; alle farbigen Punkte sind Töne dieses Akkords.
- Griff, Arpeggio und beides vergleichen. Bei fehlendem hinterlegten Griff
  erscheint ein Hinweis; es darf kein fremder Griff aus einer anderen Lage erscheinen.
- Start/Stop, Laufrichtung und Tempo testen. Stop verhindert weitere Anschläge;
  ein bereits angeschlagener Ton darf ausklingen.
- Anzeige verdecken und aufdecken; unter „Freie Griffauswahl“ alle bekannten
  Griffvarianten durchschalten. Stumme Saiten dürfen nicht erklingen.
- Schließen oder Lick/Intervallübung wählen: normale Ansicht und Progression
  erscheinen wieder. Nach Neuladen bleiben Akkordtyp, Lage und Anzeige erhalten.
- Tastaturbedienung und mobile Lesbarkeit prüfen; der Hals ist horizontal scrollbar.
