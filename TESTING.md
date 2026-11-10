# Tests

Die App bleibt eine eigenständige HTML-Datei ohne Laufzeit-Abhängigkeiten.
Die Tests benötigen Node.js und jsdom. Alternativ lässt sich mit `JSDOM_MODULE`
ein vorhandener Installationspfad angeben (auch mit jsdom 26.1.0 geprüft):

```sh
npm install --no-save --package-lock=false jsdom@29.1.1
node ui-smoke.cjs
node chord-lab.test.cjs
node arpeggios.test.cjs
node overview.test.cjs
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

## Progression folgen

Die CAGED-Ansicht folgt standardmäßig dem aktiven Progressionsakkord. Ein
manueller Wechsel von Grundton oder Akkordtyp deaktiviert das Mitlaufen; der
Schalter aktiviert es wieder. CAGED-Form und Anzeige bleiben beim Akkordwechsel
erhalten. Die Progression speichert derzeit Dreiklänge, daher werden Dur/Moll
übernommen und keine Septimen erfunden. Für verminderte/übermäßige Dreiklänge
erscheint ein Hinweis statt eines falschen CAGED-Musters.

Tests prüfen Am → Dm → E, manuelle Akkordwahl und den Renderpfad des
Metronoms, Abbruch alter Arpeggio-Timer, Erhalt der Lage, manuelles Abkoppeln,
Wiederankoppeln, fehlende Muster und eine geleerte Progression.
Manuell zusätzlich: Progression starten, Akkordleiste direkt unter dem Griffbrett
beobachten und Tonwechsel auf der Eins sowie nach dem Einzähler vergleichen.

## Halsübersicht + nächster Griff

Unter Anzeige die Halsübersicht wählen. Alle fünf CAGED-Lagen und ihre
Oktavwiederholungen werden dezent markiert; kleine Punkte sind ausschließlich
Töne des gewählten Akkords. Die aktive Lage zeigt Griff und Arpeggio.
Violett markiert die empfohlene Triade auf G–B–e, Orange die nächste, Türkis
gleiche Griffpunkte. Pfeile zeigen Bewegungen derselben Stimme. Die erste
Triade liegt möglichst nahe der gewählten CAGED-Lage; danach minimiert ein
gemeinsamer Pfad die Summe der Bundbewegungen inklusive Schleifenübergang.
Die empfohlene Triade kann dabei die aktive CAGED-Lage verlassen.

`overview.test.cjs` prüft alle 144 Tonart-/Akkordtyp-Kombinationen, korrekte
Töne über den Hals, Griffgrenzen, Vorschau-Kontinuität einschließlich Rücksprung,
Zieltöne bei Septakkorden sowie Verdecken, Ansichtswechsel und Speicherung.
Sus-Akkorde erhalten keinen irreführenden Dur-/Moll-Triadenvorschlag.
Manuell: Am–Dm–E abspielen, Vorschau und tatsächlichen nächsten Griff vergleichen,
einzelne Triadentöne anklicken, anschließend A7 ohne Progressionsbindung wählen
und Terz-/Septim-Markierungen prüfen. Mobile Ansicht horizontal scrollen.

## Sichtbare Griffe in sämtlichen CAGED-Lagen

Die Halsübersicht zeichnet jetzt die hinterlegten vollständigen Griffe in allen
Lagen, einschließlich vollständiger Oktavwiederholungen bis Bund 22. Weiß
umrandete große Punkte und Barrés zeigen die Griffe; weitere Akkordtöne sind
kleiner, aber mit Intervall beschriftet. Fingerzahlen stehen nur an der aktiven
Form, um überlagerte Fingersätze zu vermeiden. Für Lagen ohne hinterlegten
Griff steht „Töne“ statt „Griff“; es werden keine fremden Dur-Griffe ergänzt.

Regressionstest: F-Dur zeigt C-, A-, G- und D-Griffe zusätzlich zur aktiven
E-Form. Oktavvarianten verwenden die passenden Fingersätze/Barrés aus den
Griffvorlagen. Öffnen der CAGED-Ansicht beendet eine laufende Triadenübung.
