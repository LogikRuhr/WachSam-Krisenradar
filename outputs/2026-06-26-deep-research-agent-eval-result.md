# Deep-Research-Agent Eval Result

Stand: 2026-06-26
Gepruefter Report: `outputs/2026-06-25-deutschland-stress-deep-research.md`
Eval-Pack: `docs/intelligence/deep-research-eval-pack.md`
Basis-Anweisung: `docs/intelligence/deep-research-agent-instructions.md`

## Gesamturteil

Verdict: `PARTIAL`

Der Report ist als WachSam-Research-Input brauchbar und nach den User-Korrekturen fachlich deutlich staerker als der erste Draft. Er erreicht aber gegen die neue Agent-Spec keinen Voll-PASS, weil wichtige formale Reproduzierbarkeitsfelder fehlen: explizite Faktklassen pro Evidence Row, Quellenbalance, separates Social-/Wahrnehmungssignal-Panel, kanonische Confidence-Werte und reine WachSam-Systembereiche.

Entscheidung:

- `ready_for_agent_runtime`: nein
- `ready_for_local_adk_or_n8n_pilot`: nein
- `ready_for_manual_editorial_review`: ja
- `needs_report_patch`: ja
- `blocked`: nein

## Global Gate Summary

| Gate | Verdict | Befund |
|---|---|---|
| G1 Quellenbalance | `PARTIAL` | Quellenzahl und Vielfalt sind stark, aber Quellenbalance wird nicht explizit ausgewiesen. OERR ist nur Cross-Check. |
| G2 Faktklassen | `PARTIAL` | Fakt/Empfehlung/Projektion/Wahrnehmung sind im Text meist korrekt getrennt, aber nicht maschinenlesbar als Faktklasse markiert. |
| G3 WachSam-Kanon | `PARTIAL` | Severity `erhoeht` passt; Confidence `mittel-hoch` ist nicht kanonisch. `staat` ist kein 10er-Systembereich. |
| G4 Sensitive-Themen-Gate | `PASS` | Public Auto-Publish wird verhindert; Editorial-Gate ist klar required. |
| G5 Social-/OSINT-Gate | `PARTIAL` | Flaggen-Social-Frame ist korrekt begrenzt, aber separates Social-Signal-Panel und Original-/Archivbeleg-Nachweis fehlen. |

## Quellenbalance

Gezahlte Quellen im Report:

- Primaer-/amtliche Quellen: Bundestag Hausordnung, BMAS, Bundesregierung/ASK-Bericht, Destatis, BAFA, BMWE, BMF/Bundesregierung Spritpreise.
- Institutionelle Quellen: Koerber, FNF/dimap, Allensbach, ifo, NIM, BDEW, IW, GDV, Deutsche Rentenversicherung, ADAC.
- Nicht-OERR-Sekundaerquellen: YouGov, RTL/ntv/Forsa, DAWUM/INSA, WELT, Correctiv, NIUS, Junge Freiheit.
- OERR: Infratest/ARD nur Cross-Check.
- Social-/OSINT: Instagram-Reel, Social-Frame ueber Medienberichte; keine eigene Reichweitenmetrik.

Bewertung: Quellenbasis ist ausreichend, aber fuer einen Agenten-Output muss diese Balance explizit als Abschnitt im Report erscheinen.

## Testfall-Tabelle

| Testfall | Verdict | Hauptgrund |
|---|---|---|
| T1 `rentenkommission_2026` | `PASS` | Beitragspfad, Kapitalrente, Umsetzungsoffenheit und Haushaltswirkung sind korrekt nachgezogen. |
| T2 `bundestag_flagge_2026` | `PARTIAL` | Hausordnung/kein generelles Verbot sauber, aber Original-/Archivbeleg und Social-Signal-Panel fehlen. |
| T3 `sprit_2026_07_01` | `PASS` | Ende 30.06., 17 ct/l, Kostenrechnung und Durchreichungs-Caveat vorhanden. |
| T4 `energieeffizienzgesetz` | `PASS` | Pauschaler Haushalts-Sparbefehl wird explizit vermieden; Schwellen und Pflichten sind genannt. |
| T5 `deutschland_umfragen` | `PASS` | Nicht-OERR-Umfragen fuehren; OERR nur Cross-Check; Sonntagsfrage-Caveat vorhanden. |
| T6 `meinungsfreiheit` | `PARTIAL` | Juristisch vs. sozial wird getrennt; rechtlicher Primaerkontext und Faktklassen fehlen. |

## Detailbefunde

### T1 Rentenkommission 2026

Verdict: `PASS`

Erfuellt:

- Alterssicherungskommission 2026 und 33 Empfehlungen genannt.
- GRV-Beitragspfad 18,6 -> 20,2 Prozent bis 2031, 21,1 bis 2040, 21,4 bis 2050 genannt.
- 2-Prozent-Kapitalrente als zusaetzliche Pflichtvorsorge/Empfehlung genannt.
- Umsetzungsoffenheit und kein sofortiger 2026-Schock werden klar markiert.
- Haushaltswirkung: Netto-vom-Brutto, Arbeitgeberkosten, Steuer-/Bundeszuschuss, Generationenkonflikt.

Restluecke:

- Fact classes fehlen in Evidence Row: `projection` fuer Beitragspfad, `recommendation` fuer Kapitalrente, `interpretation` fuer WachSam-Kaskade.

### T2 Bundestagsflagge 2026

Verdict: `PARTIAL`

Erfuellt:

- Vorfall vom 2026-06-08 genannt.
- Deutschlandfahne wird nicht als generell verboten dargestellt.
- Bundestagspolizei/Hausordnung wird vom Social-Media-Frame getrennt.
- WELT, Correctiv, NIUS, Junge Freiheit und Instagram werden als Wahrnehmungssignal genutzt.
- Reichweiten-Caveat: keine API-Zahlen.

Luecken:

- Kein eigener Abschnitt `Social-/Wahrnehmungssignale`.
- Originalpost/Archivbeleg ist nicht ausreichend robust dokumentiert; Instagram-Link steht in Quellen, aber nicht als Original-/Archivbeleg klassifiziert.
- Kein expliziter Account-/Urheber-Kontext.

Notwendiger Patch:

- Social-Panel ergaenzen mit Original-/Archivbeleg, Frame, Faktenkern, Nicht-Belegt, Reichweiten-Caveat.

### T3 Sprit 2026-07-01

Verdict: `PASS`

Erfuellt:

- Ende der befristeten Entlastung am 2026-06-30.
- Brutto ca. 17 ct/l.
- Haushaltsrechnung 40-80 l/Monat -> +6,80 bis +13,60 Euro.
- Durchreichungsunsicherheit klar genannt.
- Monitoring bis 2026-07-15 empfohlen.

Restluecke:

- Fuer Automationsreife sollte der Kostenblock als `fact + calculation` markiert werden.

### T4 Energieeffizienzgesetz

Verdict: `PASS`

Erfuellt:

- BAFA-Pflichten >7,5 GWh und >2,5 GWh genannt.
- Kein pauschaler Buerger-Sparbefehl.
- Standort-/Compliance-Druck statt direkter Haushaltszwang.
- BMWE-Novelle als Entwurf/Vereinfachung markiert.

Restluecke:

- Entwurfsstand sollte als `recommendation`/`legislative_status` oder eigenes Faktfeld markiert werden, falls spaeter JSON-Drafts erzeugt werden.

### T5 Deutschland-Umfragen

Verdict: `PASS`

Erfuellt:

- YouGov, RTL/ntv/Forsa, INSA/DAWUM fuehren.
- Infratest/ARD nur Cross-Check.
- Sonntagsfrage als Umfrage, nicht Wahl oder Regierungsmandat.
- Waehler werden nicht moralisch bewertet.
- Reprasentationskonflikt wird als Wahrnehmungs-/Legitimitaetssignal beschrieben.

Restluecke:

- Quellenbalance fehlt als eigener Abschnitt.
- `staat` als affected system sollte in `gesellschaft`/`finanzen`/`arbeit` plus Zusatzdimension `governance` verschoben werden.

### T6 Meinungsfreiheit

Verdict: `PARTIAL`

Erfuellt:

- Juristische Meinungsfreiheit und soziales Meinungsklima werden getrennt.
- FNF/dimap und Allensbach liefern Umfragebasis.
- Keine pauschale Zensurbehauptung.
- Haushalts-/Alltagswirkung wird ueber Diskursklima, Familie, Arbeit, Vereine/Kommunen angedeutet.

Luecken:

- Kein rechtlicher Primaerkontext, falls "juristisch geschuetzt" als harter Rechtsbefund gelten soll.
- Umfragewerte sind nicht explizit als `perception_signal` klassifiziert.
- Begrenzende Gegenquelle fehlt: z.B. Quelle, die zeigt, dass 72 Prozent sich grundsaetzlich frei aeussern, steht im Text, aber nicht als Gegen-/Begrenzungsquelle markiert.

Notwendiger Patch:

- Faktklasse `perception_signal` setzen und rechtlichen Grundrechtsbezug nur mit Primaer-/Rechtsquelle oder vorsichtiger formulieren.

## Critical Gaps

1. `Quellenbalance` fehlt.
2. Evidence Table hat keine Spalten `Quelletyp` und `Faktklasse`.
3. Confidence nutzt `mittel-hoch`, obwohl der Agent-Vertrag nur `niedrig`, `mittel`, `hoch` erlaubt.
4. `affected systems` enthaelt `staat`, nicht Teil des WachSam-10er-Kanons.
5. Social-/Wahrnehmungssignale sind inhaltlich vorhanden, aber nicht im geforderten Abschnittsformat.
6. Meinungsfreiheit braucht entweder Primaer-/Rechtsquelle oder vorsichtigere Formulierung fuer juristische Lage.

## PASS/FAIL Entscheidung

### PASS als manueller WachSam-Research-Input

Ja. Der Report ist ausreichend belegt, haushaltsbezogen und verhindert Auto-Publish. Er ist fuer manuelle redaktionelle Weiterarbeit brauchbar.

### FAIL als reproduzierbarer Agent-Output

Noch ja. Der Output wuerde bei einem automatisierten Validator wegen fehlender Faktklassen, fehlender Quellenbalance, nicht-kanonischer Confidence und fehlendem Social-Panel durchfallen.

### FAIL als Auto-Publish

Ja, bewusst. Das ist korrekt und muss so bleiben.

## Naechster konkreter Schritt

Patch den Deutschland-Stress-Report auf das neue Output-Format:

1. `Quellenbalance` ergaenzen.
2. Evidence Table um `Quelletyp` und `Faktklasse` erweitern.
3. `confidence: mittel-hoch` auf `confidence: mittel` oder `hoch` mit Begruendung normalisieren.
4. `staat` aus `affected systems` entfernen und als Zusatzdimension `governance` fuehren.
5. Separaten Abschnitt `Social-/Wahrnehmungssignale` ergaenzen.
6. Meinungsfreiheit rechtlich vorsichtiger oder mit Primaerquelle formulieren.

Danach sollte derselbe Report gegen dieses Eval-Pack voraussichtlich `PASS` als reproduzierbarer Agent-Output erreichen. Erst danach lohnt ein lokaler ADK-/n8n-Pilot.
