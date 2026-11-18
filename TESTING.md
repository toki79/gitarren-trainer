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
node caged-practice.test.cjs
node caged-forms.test.cjs
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

Über dem Griffbrett stehen drei Checkboxen: CAGED, Pentatonik und Triaden.
Das bisherige Anzeige-Dropdown entfällt; die aktive CAGED-Lage liegt jetzt
unter „Weitere Optionen“. Jede Kombination ist möglich, einschließlich einer
leeren Anzeige. Beim Einstieg über eine Checkbox wird nur diese Ebene aktiviert.
Die Schaltfläche „Akkord & Übung“ öffnet die zuletzt gespeicherte Kombination.

Die Pentatonik verwendet Tonart und Dur/Moll aus der Hauptsteuerung und bleibt
bei Progressionswechseln gleich. Blaue Ringe zeigen zusätzliche Pentatonik-Töne
über den gesamten Hals. Bereits als Akkord- oder Triadenton dargestellte
Griffpunkte erhalten keinen zweiten Marker.
`layers.test.cjs` prüft alle acht Kombinationen, Tonzugehörigkeit, unveränderte
Pentatonik bei Akkordwechsel, Tonartmoduswechsel, Speicherung, Tastatur und
Verdecken. Manuell zusätzlich Checkboxen bei laufender Progression umschalten.

## CAGED-Leiste: Form und Licks

Unter dem Griffbrett erscheint bei aktivem CAGED die Leiste mit E-/A-/C-/D-/G-Form.
„Form wandert mit dem Akkord“ sucht die Form für jeden Progressionsakkord neu;
„Fest am Key-Akkord“ lässt den Halsbereich bei der Form des Key-Akkords und zeigt
darin die Töne des aktiven Akkords. Rechts stehen Licks, deren Töne (±1 Bund) zu
mindestens 70 % im Bereich der Form liegen; 50–70 % erscheinen als „Ausbruch“.
`caged-practice.test.cjs` prüft Formwahl, beide Modi, Lick-Auswahl und Persistenz.

## CAGED-Formen statt Boxen

Die App spricht überall von CAGED-Formen. Die fünf Pentatonik-Lagen (intern Position 1–5, aufsteigend
am Hals) sind die CAGED-Formen: Moll E‑D‑C‑A‑G, Dur G‑E‑D‑C‑A (Dur nutzt die Geometrie des relativen
Molls). Licks speichern `form` („C“, „A“, „G“, „E“, „D“); alte Daten mit `box` 1–5 werden beim Laden
und beim Import umgerechnet. `caged-forms.test.cjs` prüft die Zuordnung gegen die CAGED-Bereiche des
Akkord-Labors in allen Tonarten, die Migration, Filter/Editor und dass kein „Box“ mehr sichtbar ist
(Eigenname „BB-Box“ bleibt).

## Griffkästchen, Anker und Skalenwahl

Die CAGED-Leiste zeigt unter der Formwahl den Akkordgriff der Form als Kästchen (Fingersatz, Barré,
Startbund; Grundton gold). Als Anker gelten der tiefste und der höchste gegriffene Bund des Griffs
(H-Dur: A-Form 2/4, G-Form 4/7, E-Form 7/9); sie erscheinen als gelbe Marken unter dem Griffbrett.

Stufen: Akkordtöne · + Skala · + Chromatik. Die Skala wählst du im Auswahlfeld: Moll- und Dur-Pentatonik,
Moll- und Dur-Blues, Natürlich Moll, Harmonisch Moll, Mixolydisch, Dorisch, Dur (Ionisch). Der Grundton
kommt „von der Tonart“ (eine Skala über die ganze Progression) oder „vom aktiven Akkord“ (wandert mit).
Skalentöne sind große blaue Kreise (Beschriftung Intervalle oder Tonnamen), Charakterstöne (Mixolydisch ♭7,
Dorisch 6, Harmonisch Moll 7, Natürlich Moll ♭6, Moll-Blues ♭5, Dur-Blues ♭3) orange, der Skalengrundton
trägt einen weißen Ring. Unter dem Auswahlfeld stehen Name, Einsatz und alle Töne als Kärtchen.

Skalenfenster: Ab „+ Skala“ zeigt die Leiste die Skalentöne in 5 Bünden ab einem Bund unter dem
tiefsten Anker (H-Dur: A-Form 1–5, G-Form 3–7, E-Form 6–10, wie im Lehrvideo); der Rahmen umfasst Fenster
und Akkordbereich. Die Akkordtöne und die Arpeggio-Übung behalten ihren Bereich. Alte Einstellungen werden
umgerechnet (Level 2 → Skala, Level 3 → Chromatik, „Akkord-Mixolydisch“ → Mixolydisch vom Akkord).
`caged-scales.test.cjs` prüft alle Skalen in beiden Grundton-Modi, Kärtchen, Charakterstöne, Beschriftung,
Lesbarkeit, Fenster, Anker, Griffkästchen, Quiz, Migration und Persistenz.
