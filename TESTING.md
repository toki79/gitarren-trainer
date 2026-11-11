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
node layers.test.cjs
node tab-player.test.cjs
node practice-loop.test.cjs
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

## Unabhängige Anzeige-Ebenen

Über dem Griffbrett stehen fünf Checkboxen für CAGED, Pentatonik, Tonleiter, Triaden und Arpeggios.
Grüne Ringe markieren die Arpeggiotöne des Akkords in der gewählten CAGED-Lage.
Das bisherige Anzeige-Dropdown entfällt; die aktive CAGED-Lage liegt jetzt
unter „Weitere Optionen“. Jede Kombination ist möglich, einschließlich einer
leeren Anzeige. Beim Einstieg über eine Checkbox wird nur diese Ebene aktiviert.
Die Schaltfläche „Akkord & Übung“ öffnet die zuletzt gespeicherte Kombination.

Die Pentatonik verwendet Tonart und Dur/Moll aus der Hauptsteuerung und bleibt
bei Progressionswechseln gleich. Blaue Ringe zeigen zusätzliche Pentatonik-Töne
über den gesamten Hals. Bereits als Akkord- oder Triadenton dargestellte
Griffpunkte erhalten keinen zweiten Marker.
`layers.test.cjs` prüft alle 32 Kombinationen aus CAGED, Pentatonik, Tonleiter, Triaden und Arpeggios, Tonzugehörigkeit, unveränderte
Pentatonik bei Akkordwechsel, Tonartmoduswechsel, Speicherung, Tastatur und
Verdecken. Manuell zusätzlich Checkboxen bei laufender Progression umschalten.

## Interaktiver TAB-Player

Feature-Branch: `feature/interactive-tab-player`. Ein ausgewählter Bibliotheks-
oder eigener Lick liefert automatisch Saite, Bund, Rhythmus und Spieltechniken
an den Player unter dem Griffbrett. Im Editor verwendet der Player den aktuellen
Notenpuffer und sitzt direkt über dessen Noten/TAB. Keine neue Dateneingabe nötig.

Klick/Enter/Leertaste auf eine Notenspalte wählt den Einstieg. Umschalt-Klick
markiert den Bereich zwischen Cursor und Ziel; alternativ A/B an den gewünschten
Ereignissen setzen. Grenzen sind inklusive, auch Pausen zählen als Ereignisse.
Loop wiederholt den Abschnitt. Tempo 25–150 % skaliert das eingestellte BPM,
ohne Tonhöhe zu verändern; der eigenständige Player stoppt das Backing.
Tempoänderungen starten das aktuelle Ereignis mit dem neuen Tempo erneut.
Stop verhindert neue Anschläge; bereits klingende Töne dürfen ausklingen.

Der Notencursor und die Griffbrettmarkierung folgen demselben Ereignisindex.
Haltebögen verlängern den ersten Ton ohne erneuten Anschlag; beim Einstieg auf
einer gebundenen Note wird sie angeschlagen. Pausen, Doppelgriffe, Triolen-
Dauern und Shuffle-Timing werden berücksichtigt; Bends/Slides/Vibrato/Staccato
verwenden die bestehende Audio-Synthese. Notenänderungen, Transposition und
Kontextwechsel stoppen den Player und setzen die Bereichsgrenzen zurück.

`tab-player.test.cjs` prüft Darstellung und Datenquelle, Tondauern, Pausen und
Haltebögen, Doppelgriffe, Artikulationsparameter, halbes Tempo, A–B-Loops,
Klick-/Tastatur-Einstieg, abgebrochene Timer und Editoränderungen.
Manuell: langen Lick wählen und horizontales Mitlaufen der TAB prüfen, im Editor
Töne/Dauern ändern, A/B setzen und bei halbem Tempo loopen. Klang und mobile
Editorhöhe benötigen weiterhin eine vollständige Browserprüfung.

## Aufklappbare Bereiche und Lick-Editor

Die Hauptbereiche öffnen sich über ihre Überschrift im Seitenfluss. Der Editor
behält beim Zuklappen den Entwurf. „Fenster füllen“ vergrößert ihn samt
anklickbarem Griffbrett. „Zur Seitenansicht“ kehrt zur Bearbeitung in der Seite
zurück. „A–B duplizieren“ fügt eine Kopie direkt hinter dem gewählten Abschnitt
ein und markiert die Kopie. Der UI-Test prüft die Bereichsüberschriften, der
Player-Test den Erhalt des Entwurfs, die Kopie und die Rückgabe des Griffbretts.

Der Test für den Akkordwechsel-Loop prüft geteilte Takte, den Einzähler, die Zielterz vor dem Wechsel und den Rücksprung am Abschnittsende. Er prüft außerdem, dass jede Hörhilfe nur einmal erklingt und die automatische Hilfe nach vier Runden endet.
