# WachSam Deep-Research-Agent Requirements

Stand: 2026-06-26
Status: Research-/Planungsartefakt, nicht auto-publish
Ziel: Anforderungen fuer einen reproduzierbaren WachSam-Deep-Research-Agenten ableiten.

## Kurzbefund

Der Deutschland-Stress-Test-Run war als manueller Research-Durchlauf brauchbar, aber nicht reproduzierbar genug. Er musste durch User-Feedback korrigiert werden: OERR war zu stark gewichtet, Rentenkommission wurde erst nachgezogen, Social Media wurde nicht systematisch verifiziert. Fuer Agent Platform, n8n oder ADK braucht WachSam deshalb eine ausfuehrliche Agent-Anweisung mit Quellenhierarchie, Reject-Regeln, Output-Vertrag und Evaluation.

## Lokaler WachSam-Kontext

- WachSam bewertet nicht News an sich, sondern Deutschland-Relevanz, Kaskaden und Haushaltsauswirkungen.
- LLM-Output ist ein Analysten-Vorschlag, kein Fakt und kein Entscheider.
- Editorial-Gate bleibt verbindlich. Kein Agent-Ergebnis darf direkt in Public UI oder Datenbank-Publish.
- Pflichtlogik: Quelle, Stand, Germany-Relevance, betroffene Systeme, Haushaltswirkung, Confidence, Unsicherheit.
- Severity: `stabil`, `beobachten`, `erhoeht`, `kritisch`, `eskalierend`.
- Confidence: `niedrig`, `mittel`, `hoch`.

## Externe Grundlagen

| Bereich | Quelle | Relevanz fuer Spec |
|---|---|---|
| Google Agent Platform | https://cloud.google.com/products/gemini-enterprise-agent-platform | Orchestrierter Agent-Layer, nicht identisch mit einem einzelnen LLM-Call. |
| Google ADK | https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/adk | Code-first Agents, Tools, Evaluation, Runtime-Anbindung. |
| ADK Agent Runtime | https://adk.dev/deploy/agent-runtime/ | Spaeterer Deploy-Pfad; fuer WachSam nur nach separater Freigabe. |
| ADK Structured Output | https://adk.dev/agents/llm-agents/ | Output-Schema nuetzlich, aber bei Tool-Agenten besser mit separatem Validation/Formatter-Gate. |
| ADK Safety | https://adk.dev/safety/ | Guardrails fuer Tools, Prompt Injection, Callbacks/Plugins und Tracing. |
| ADK Evaluate | https://adk.dev/evaluate/ | Evaluation gegen Tool-Trajectory, Response, Rubric Quality, Hallucination/Groundedness, Safety. |
| OWASP LLM Top 10 | https://owasp.org/www-project-top-10-for-large-language-model-applications/ | Prompt Injection, Insecure Output Handling, Sensitive Information Disclosure, Excessive Agency, Overreliance. |
| NIST AI RMF / GenAI Profile | https://www.nist.gov/itl/ai-risk-management-framework und https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf | Governance, Provenance, Pre-Deployment Testing, Incident Disclosure. |
| Social-Media-Verifikation | https://www.bellingcat.com/resources/2021/11/01/a-beginners-guide-to-social-media-verification/ und https://verificationhandbook.com/ | Originalquelle, Kontext, Zeit, Archiv/Screenshot, Triangulation. |
| IFCN Principles | https://ifcncodeofprinciples.poynter.org/the-commitments | Transparente Quellen, Methodik, Korrekturen, Unabhaengigkeit. |

## Anforderungen

### 1. Quellenhierarchie

Der Agent muss mit Primaerquellen fuehren. Medienquellen dienen zur Einordnung, Konfliktpruefung und Perspektivenbreite. OERR darf nicht Leitquelle sein, sondern nur Kontext oder Cross-Check.

Prioritaet:

1. Primaerquellen: Gesetze, Bundestag, Bundesregierung, Ministerien, amtliche Statistiken, Gerichtsdokumente, Originalberichte, Originaldaten.
2. Institutionelle Quellen: Bundesbank, DRV, BA, BNetzA, BDEW, ifo, IW, NIM, wissenschaftliche Institute, Verbaende mit offengelegtem Interesse.
3. Nicht-OERR-Medien aus mehreren Lagern: Handelsblatt, FAZ, WELT, Spiegel/Zeit, Focus, T-Online, NZZ, NIUS/Junge Freiheit als Wahrnehmungs-/Gegenperspektive mit Bias-Markierung.
4. OERR: nur Cross-Check, nicht fuehrende Quelle fuer politisch sensible Bewertungen.
5. Social Media: nur Wahrnehmungs-/Verbreitungssignal, nie alleiniger Faktbeleg.

### 2. Mindestquellen je Deep-Research-Run

- 10 bis 15 belastbare Quellen.
- Mindestens 3 Primaerquellen.
- Mindestens 3 nicht-OERR-Sekundaerquellen.
- Mindestens 2 Quellen, die die dominante These begrenzen oder widersprechen.
- Bei Social-Media-Claims: mindestens 1 Originalpost oder archivierter Beleg plus 1 unabhaengige Kontextquelle.

### 3. Fakt-Trennung

Jede Aussage muss als eine der folgenden Klassen markierbar sein:

- `fact`: direkt aus Quelle belegt.
- `recommendation`: Empfehlung/Kommissionsvorschlag, noch keine Umsetzung.
- `projection`: Modellrechnung oder Prognose.
- `interpretation`: WachSam-Schlussfolgerung aus mehreren Belegen.
- `perception_signal`: belegte Wahrnehmung, Umfrage oder Social-Media-Frame.
- `unverified_claim`: nicht ausreichend belegt; darf nicht als Finding erscheinen.

### 4. Social-Media-Regeln

Social Media darf nicht als Stimmungsersatz fuer Deutschland insgesamt ausgegeben werden. Erlaubt ist Social Media nur zur Analyse von Verbreitung, Framing und Wahrnehmung.

Pflicht bei Social-Signal:

- Originalpost/Video/Thread oder belastbarer Archiv-/Screenshot-Beleg.
- Datum/Uhrzeit soweit verfuegbar.
- Urheber/Account-Typ als Kontext, ohne private PII zu extrahieren.
- Frame: was wird behauptet?
- Separater Faktencheck: was ist belegbar, was ist Interpretation?
- Keine Reichweitenzahl ohne API, Plattformmetrik oder zitierbaren Bericht.

### 5. Sensitive Themen brauchen Editorial-Gate

Auto-Publish ist verboten bei:

- Parteien, Brandmauer, Wahlumfragen, Extremismus, Regierungsmisstrauen.
- Meinungsfreiheit, Zensurvorwurf, soziale Sanktionen.
- Deutschlandflagge, Patriotismus, Symbolkonflikte.
- Rente, Sozialbeitraege, Steuern, Pflichtvorsorge.
- Energiegesetzgebung, Kostenpflichten, Enteignungs-/Verbotsclaims.
- Migration, Sicherheit, innere Ordnung.

### 6. Severity und Confidence

Severity bewertet Haushalts-/Systemstress, nicht Lautstaerke der Debatte:

- `stabil`: normale Lage, keine erkennbare Zusatzbelastung.
- `beobachten`: fruehes Signal, noch begrenzte Haushaltswirkung.
- `erhoeht`: spuerbare oder konkret absehbare Belastung.
- `kritisch`: starke Belastung, breite Haushalts-/Standortwirkung oder unmittelbare Systemrelevanz.
- `eskalierend`: aktive Beschleunigung einer Strukturkrise; sparsam verwenden.

Confidence bewertet Evidenz:

- `hoch`: mehrere harte Quellen, Primaerbelege, konsistente Daten.
- `mittel`: mehrere Hinweise, aber Prognose-/Interpretationsanteil.
- `niedrig`: fruehes Signal, unvollstaendige Daten, hohe Unsicherheit.

### 7. Reject-Regeln

Ein Agent-Output faellt durch, wenn:

- Quelle oder Stand fehlt.
- Zahlen ohne Quelle genannt werden.
- Social-Media-Frames als Fakt uebernommen werden.
- OERR oder ein einzelnes Medium als alleinige Leitquelle dient.
- Parteipolitische Wertung statt Haushalts-/Systemwirkung geliefert wird.
- Juristische Lage und soziales Wahrnehmungssignal vermischt werden.
- Modellbehauptungen ohne Evidence Table erscheinen.
- PII, Secrets oder Credential-Pfade im Output stehen.

### 8. Evaluation

Mindest-Evalset fuer den Deep-Research-Agenten:

1. Rentenkommission: erkennt Empfehlung vs. Umsetzung, Beitragspfad, Kapitalrente und Haushaltswirkung.
2. Bundestagsflagge: trennt Hausordnung, generelles Flaggenverbot, Social-Media-Frame und Symbolkonflikt.
3. Sprit 01.07.: erkennt Ende Tankrabatt, Kostenwirkung und Durchreichungsunsicherheit.
4. Energieeffizienzgesetz: trennt Unternehmen/oeffentliche Pflichten von pauschalem Haushaltsclaim.
5. Deutschland-Stimmung/Umfragen: nutzt nicht-OERR plural, markiert Sonntagsfrage als Umfrage, nicht Wahlmandat.
6. Meinungsfreiheit: trennt Grundrecht, soziale Vorsicht und Selbstzensur.

Eval-Kriterien:

- Quellenbindung.
- Quellenvielfalt.
- Korrekte Faktklasse.
- WachSam-Kaskadenlogik.
- Haushaltswirkung.
- Red Flags.
- Kein Auto-Publish.
- Keine PII/Secrets.

## Architekturfolgerung

Empfohlen ist ein 3-stufiger Agent-Ablauf:

1. `Research Planner`: zerlegt Thema, legt Quellenklassen und Suchstrategie fest.
2. `Evidence Collector`: sammelt nur erlaubte, datierbare Quellen und klassifiziert sie.
3. `Analyst + Validator`: erzeugt Report-Draft, prueft Schema, Red Flags, Quellenbindung, Severity/Confidence und PASS/FAIL.

Fuer ADK/Agent Platform sollte der Tool-Agent nicht gleichzeitig final formatieren. Besser: Tool-Agent sammelt Evidence; separater Formatter/Validator erzeugt das Markdown/JSON. Das reduziert Risiko durch Tool-Ausgaben, Prompt Injection und Overreliance.

## Entscheidung

Eine kompakte Prompt-Anweisung reicht nicht. WachSam braucht eine dauerhafte Agent-Anweisung unter `docs/intelligence/deep-research-agent-instructions.md` und eine Spec unter `docs/specs/2026-06-26-wachsam-deep-research-agent-spec.md`. Die bestehende Agent-Platform-Spec wird nur verlinkt, nicht ersetzt.
