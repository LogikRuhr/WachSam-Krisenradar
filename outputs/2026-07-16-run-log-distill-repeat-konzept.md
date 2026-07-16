# Konzept: Run-Log-Distill-Repeat-System

**Datum:** 2026-07-16 · **Status:** ✅ UMGESETZT (alle 3 Wellen am 2026-07-16 nach Jeans Weg-Wahl E1–E4, 10 Hook-Tests grün; Messung K1–K7 nach ~4 Wochen offen) · **Scope:** Global (`~/.claude`) + WachSam-Projekt, wirkt auch für `wachsam-produkt-v1`

---

## 1. Ziel

**Jede Session macht die nächste messbar besser:** Lessons überleben das Session-Ende, destillierte Regeln kompoundieren über Projekte hinweg, und Verifikation (Maker ≠ Verifier) ist erzwungene Pflicht statt Konvention.

**Erfolgsbild:** In 3 Monaten enthält `LESSONS.md` auch dokumentierte Fehlschläge mit Ursache, jede neue Spec startet mit den relevanten Lessons im Kopfteil, und kein „fertig"-Claim erreicht Jean ohne nachweisbares Review-PASS.

---

## 2. Quelle & Kernideen (Carousel-Destillat)

Quelle: Instagram-Carousel „How to Actually Use Fable 5" (AI Career Suite). Ohne Marketing-Sprech bleiben fünf übertragbare Mechaniken:

1. **Core-Loop: Run → Log → Distill → Repeat.** Jeder Arbeitslauf produziert nicht nur Output, sondern auch ein Protokoll; aus dem Protokoll wird eine Regel destilliert; die Regel fließt in den nächsten Run ein. Ohne Distill-Schritt ist Logging nur Datenmüll.
2. **4-Schichten-Architektur:**
   - *Layer 1 — Primitives:* wiederverwendbare Bausteine (Prompts, Agents, Skills, Hooks)
   - *Layer 2 — Orchestration:* wer ruft wen auf, mit welchen Gates
   - *Layer 3 — Memory:* was zwischen Runs persistiert
   - *Layer 4 — Self-Improvement:* der Mechanismus, der Layer 1–3 aus Erfahrung verbessert
3. **Memory-File pro Run** mit 7 Feldern: `Goal / Prompt / Output / What worked / What failed / Distilled rule / Next action`. Der Wert liegt in den letzten drei Feldern — sie zwingen zur Destillation.
4. **Goldene Regel: Maker ≠ Verifier.** Der erzeugende Agent bewertet nie sein eigenes Ergebnis. Der Verifier prüft gegen eine **Rubric** (explizite, prüfbare Kriterien), nicht gegen ein Gefühl („looks good").
5. **Session-Template Before/During/After** mit der Quick Rule: **„Never end a session without logging at least one lesson."**

---

## 3. Ist-Zustand (Mapping-Tabelle)

Basis: Explore-Inventur dieser Session — alle Pfade real verifiziert. Jeans Setup deckt ~70 % ab; die Lücken liegen fast vollständig in Layer 4 (Distill/Repeat).

| Carousel-Konzept | Vorhandenes Artefakt | Wirkungsgrad |
|---|---|---|
| **Run** (Primitives + Orchestration) | 12 Projekt-Agents in `.claude/agents/` (u.a. `wachsam-web-engineer`, `wachsam-ingestion-engineer`); Subagent-Gates-Modus (Feedback-Memory: jede Welle einzeln verifizieren); `AGENTS.md` als verbindliche Regeln | ✅ automatisch/etabliert |
| **Log** (Roh-Ebene) | remember-Plugin + `.remember/`-Daemon: `now.md` (Buffer), `today-*.md` (Tageslog), `recent.md` (7 Tage), `archive.md`, `next-session-brief.md` (Handoff) | ✅ automatisch |
| **Memory** (kuratiert) | Natives Memory `~/.claude/projects/…WachSam…/memory/` mit `MEMORY.md`-Index (user/feedback/project/reference-Typen) | ✅ etabliert, manuell kuratiert |
| **Distill** (Regeln) | `LESSONS.md` (Format: Datum · Erkenntnis · Handlung · Confidence), repo-getrackt, von Claude Code **und** Codex gelesen | ⚠️ manuell, unregelmäßig — „Was fehlgeschlagen ist" ist seit 2026-06-10 **leer** |
| **Repeat** (Rückkopplung) | `LESSONS.md`-Kopfzeile sagt „Read first" — aber nichts erzwingt oder injiziert das beim Session-Start; `docs/specs/TEMPLATE-spec.md` referenziert keine Lessons | ❌ fehlt strukturell |
| **Maker ≠ Verifier** | `.claude/agents/reviewer.md` (PASS/FAIL gegen DoD, führt Tests aus, „keine Schmeichelei"); `wachsam-task-reviewer.md` (Spec-Compliance + Code-Qualität, zwei Urteile); `/code-review` ergänzend | ⚠️ existiert, aber Triggering ist Konvention — nichts blockiert einen „fertig"-Claim ohne Review |
| **Rubric statt Vibe** | DoD in `docs/specs/TEMPLATE-spec.md` (Tests grün via `pnpm run verify` / `pytest`, Lint, PASS durch zweiten Reviewer) | ✅ vorhanden, wenn Spec genutzt wird |
| **Session-Template Before/During/After** | Before: Spec-Template + `next-session-brief.md`. After: SessionEnd-Hook `.claude/hooks/session-stop.sh` prüft Git-sauber, Brief-Freshness (>90 min ⇒ Warnung), Secret-Scan; `exit 2` bei offenen Punkten | ⚠️ teilweise — prüft Hygiene, aber **keine Lesson-Pflicht** |
| **„Never end without a lesson"** | — | ❌ fehlt komplett |
| Globale Hook-Ebene | `~/.claude/settings.json` registriert nur einen `PostToolUse`-Hook (`~/.claude/hooks/secret-detector.sh`); kein globaler `SessionEnd`/`SessionStart` | ❌ Lücke für globalen Scope |

---

## 4. Anforderungen (prüfbar)

- **A1 — Lesson-Pflicht am Session-Ende:** Eine Session mit substanzieller Arbeit (Commits, Diffs, Deploys) endet nicht, ohne dass mindestens eine Lesson geloggt oder explizit „keine Lesson" begründet wurde.
- **A2 — Strukturiertes Run-Memory:** Für jeden substanziellen Run existiert ein Distillat im 7-Felder-Format (Goal / Prompt / Output / What worked / What failed / Distilled rule / Next action). „Output" als Verweis (PR, Commit, Datei), nicht als Kopie.
- **A3 — Rückkopplung:** Der Distill-Output der letzten Sessions ist beim nächsten Session-Start bzw. in der nächsten Spec sichtbar — ohne dass Jean daran denken muss (kein manueller Erinnerungsschritt).
- **A4 — Verifier-Gate härten:** Vor jedem „fertig"-Claim liegt ein PASS von `reviewer.md`/`wachsam-task-reviewer.md` vor; die Existenz des Reviews ist nachweisbar (nicht nur behauptet). Ergänzt Jeans bestehendes Feedback-Memory „Kein ‚erledigt' vor Deploy" — Review-PASS ist notwendige, nicht hinreichende Bedingung.
- **A5 — Global + projektlokal:** Die Mechanik (Hooks, Templates, Gate-Logik) lebt in `~/.claude` und wirkt in jedem Projekt (insb. `wachsam-produkt-v1`); die Inhalte (LESSONS.md, Run-Memories) leben im jeweiligen Projekt.
- **A6 — Mobil-tauglich, keine neuen manuellen Ops-Schritte:** Alles läuft über Hooks/Templates, die Claude selbst bedient. Kein Schritt setzt Rechner-/SSH-/Dashboard-Zugriff voraus (Feedback-Memory „Manuelle Ops-Schritte minimieren").
- **A7 — Kein PII/Secret-Inhalt in Memory-Dateien:** Run-Memories und Lessons enthalten keine Credentials, Tokens oder personenbezogene Daten; der bestehende Secret-Scan (Projekt: `secret-scan.sh` + `session-stop.sh`, global: `secret-detector.sh`) deckt getrackte Memory-Pfade mit ab.

---

## 5. Kriterien (DoD des Systems, messbar)

- [ ] **K1:** SessionEnd ohne neue Lesson (bei substanzieller Arbeit) ⇒ Hook meldet es und blockiert bzw. warnt (je nach Weg-Wahl hart `exit 2` oder Nudge).
- [ ] **K2:** Nach 5 Arbeits-Sessions ist `LESSONS.md` → „Was fehlgeschlagen ist (und warum)" nicht mehr leer, sofern in dem Zeitraum etwas fehlschlug (Test-Fail, Prod-Bug, Review-FAIL).
- [ ] **K3:** Jede neue Spec nach `TEMPLATE-spec.md` enthält den Abschnitt „Relevante Lessons" — gefüllt oder mit explizitem „keine einschlägig".
- [ ] **K4:** Für jeden PR/„fertig"-Claim ist ein Review-PASS nachweisbar (Review-Output im Verlauf, in der Spec oder als Datei referenziert).
- [ ] **K5:** Beim Session-Start sind die letzten Lessons/Next-Actions ohne Zutun im Kontext (Hook-injiziert oder via `next-session-brief.md`-Erweiterung).
- [ ] **K6:** Das System funktioniert identisch in `wachsam-produkt-v1`, ohne dass dort etwas dupliziert werden muss (nur `LESSONS.md` anlegen).
- [ ] **K7:** Stichprobe nach 4 Wochen: mindestens eine Lesson hat nachweislich einen Fehler beim zweiten Auftreten verhindert oder eine Spec-Entscheidung geprägt (der eigentliche ROI-Beweis).

**Messung:** `bash scripts/measure-lessons.sh > outputs/$(date +%F)-lessons-messung.md` — misst K1–K6 automatisch aus den System-Artefakten (Hook-Selbsttests mit simuliertem stdin, Git-Commit-Tage vs. Run-Memory-/LESSONS-Distillate, Spec-Feld-Quote, Review-Marker `.remember/reviews/`, Session-Marker) und bereitet K7 als manuelle Bewertung auf. Muss lokal laufen (`.remember/` und `~/.claude/tmp` sind für Cloud-Agents unsichtbar). Baseline: `outputs/2026-07-16-lessons-baseline.md` (3 PASS · 1 FAIL [K4: docs-only-Commit `07195bd` ohne Review] · 2 n/a · 1 manuell); Vollmessung ~13.08.2026.

---

## 6. Gap-Analyse → Maßnahmen

### G1 — Lesson-Gate am Session-Ende (Layer 4, größte Lücke)

**Befund:** `session-stop.sh` prüft Git-Hygiene, Brief-Freshness und Secrets — aber nicht, ob eine Lesson geloggt wurde. Global existiert gar kein SessionEnd-Hook.

**Maßnahme:** SessionEnd-Hook um einen Lesson-Check erweitern: Wurde `LESSONS.md` (oder das Run-Memory, siehe G2) seit Session-Start modifiziert? Trivial-Sessions (kein Diff, keine Commits) sind ausgenommen — sonst produziert das Gate Pseudo-Lessons.

**Umsetzungsort:** Global generischer Hook in `~/.claude/settings.json` (`SessionEnd`), der projektlokal `LESSONS.md` sucht; das bewährte Muster aus `.claude/hooks/session-stop.sh` (Freshness via `stat`, `exit 2` bei Issues) als Vorlage. Projekt-Hook bleibt für WachSam-Spezifika bestehen.

**Optionen & Trade-offs:**

| Option | Verhalten | Trade-off |
|---|---|---|
| **Hart** (`exit 2`) | Session endet nicht ohne Lesson oder begründete Ausnahme | Maximale Compliance; Risiko: Alibi-Lessons („heute nichts gelernt"), Reibung bei schnellen Mobile-Sessions |
| **Nudge** (Warnung + Vorschlag) | Hook zeigt „⚠️ keine Lesson geloggt" und schlägt eine aus dem Session-Verlauf vor | Geringe Reibung; Risiko: wird ignoriert, Lücke bleibt (der Status quo ist genau das) |
| **Hybrid** (empfohlen) | Nudge bei kleinen Sessions, hart wenn Commits/PRs entstanden | Beste Balance; etwas mehr Hook-Logik (Diff-/Commit-Zählung, wie in `session-stop.sh` schon vorhanden) |

### G2 — Run-Memory-Format (7 Felder)

**Befund:** Es gibt Roh-Logs (`.remember/now.md`) und kuratierte Regeln (`LESSONS.md`), aber kein strukturiertes Zwischenformat pro Run — genau dort passiert im Carousel-Modell die Destillation.

**Maßnahme:** Markdown-Template mit den 7 Feldern; Claude füllt es am Ende eines substanziellen Runs (nicht Jean — A6).

**Ablage-Optionen:**

| Ort | Pro | Contra |
|---|---|---|
| `.remember/runs/` (empfohlen) | Passt zur bestehenden Log-Ebene, ungetrackt (kein Repo-Rauschen, kein Review-Overhead), Daemon-kompatibel | Reist nicht mit dem Repo; Distillat muss aktiv nach `LESSONS.md` wandern (das ist aber gewollt — Kuratierung bleibt bewusst) |
| `outputs/` | Getrackt, Konvention existiert | Vermischt Deliverables mit Prozess-Artefakten; jedes Run-Memory landet im Git-Verlauf |
| Natives Memory-Verzeichnis | Persistiert über Sessions, Index vorhanden | Ist für kuratierte **Fakten** gedacht, nicht für Run-Protokolle; würde `MEMORY.md` zumüllen |

**Wichtige Abgrenzung:** `next-session-brief.md` bleibt der einzige Handoff („was als Nächstes"). Das Run-Memory ist rückblickend (was war, was gelernt), der Brief vorausschauend. Das Feld „Next action" des Run-Memorys speist den Brief — **kein zweites Handoff-Dokument aufbauen.**

### G3 — Repeat-Rückkopplung (Lessons → nächste Session/Spec)

**Befund:** `LESSONS.md` sagt „Read first", aber nichts stellt sicher, dass das passiert. Das ist der klassische Tod solcher Dateien.

**Maßnahmen (kombinierbar):**
1. **SessionStart-Hook** injiziert die Top-N-Lessons (bzw. die jüngsten + alle mit Confidence high, die zum Arbeitsbereich passen) als `additionalContext` — analog zum bestehenden REMEMBER-Block des Daemons.
2. **`TEMPLATE-spec.md`** bekommt ein Pflichtfeld **„Relevante Lessons"** zwischen „Clarifications" und „Umfang" — der spec-schreibende Agent muss `LESSONS.md` konsultieren und einschlägige Einträge zitieren oder „keine einschlägig" begründen.

**Optionen & Trade-offs:** Hook-injiziert = automatisch, aber Kontext-Kosten bei wachsender Datei (Mitigation: nur Titelzeilen injizieren, Volltext auf Abruf). Manuell/Template-getrieben = kontextsparsam, aber nur so zuverlässig wie die Spec-Disziplin. Empfehlung: beides — Hook für Sessions ohne Spec, Template-Feld für Spec-Arbeit.

### G4 — Verifier-Härtung

**Befund:** `reviewer.md` und `wachsam-task-reviewer.md` sind gute Verifier, aber ihr Aufruf ist konventionsgetrieben (DoD-Punkt in der Spec, AGENTS.md-Regel). Nichts hindert einen „fertig"-Claim ohne Review.

**Optionen & Trade-offs (ehrlich):**

| Option | Mechanik | Grenze |
|---|---|---|
| **Stop-Hook auf Review-Evidenz** | Stop-Hook prüft: Wenn Diff/Commits existieren, muss Review-Evidenz vorliegen (z.B. Marker-Datei/Abschnitt, den der Reviewer-Agent schreibt) | Hooks können nur **Existenz** prüfen, nicht **Qualität** — ein Pro-forma-Review passiert das Gate. Zudem: Was zählt als Evidenz, muss fälschungsarm definiert sein |
| **Konvention in AGENTS.md schärfen** | Explizite Regel: „Kein fertig/PASS-Claim an Jean ohne zitiertes Reviewer-Urteil" | Bleibt Konvention; Claude-Modelle folgen ihr meist, aber nicht garantiert — genau die heutige Schwäche |
| **`superpowers:verification-before-completion` konsequent triggern** | Skill existiert bereits und verlangt Evidenz vor Erfolgs-Claims | Gleiches Problem: Skill-Invocation ist selbst Konvention |

**Empfehlung:** Stop-Hook (Existenz-Gate) **plus** geschärfte AGENTS.md-Regel (Qualitäts-Erwartung). Die ehrliche Aussage bleibt: Review-**Qualität** ist technisch nicht erzwingbar, nur Review-**Stattfinden**. Qualität sichert weiterhin Jeans Stichproben-Verifikation (Subagent-Gates-Modus).

### G5 — Konsolidierung der drei Memory-Systeme (dokumentieren, nicht neu bauen)

**Befund:** Drei Systeme koexistieren funktionsfähig, aber ihre Rollen sind nirgends gemeinsam beschrieben — Verwechslungsgefahr (z.B. Lessons im `.remember/`-Buffer, die nie destilliert werden).

**Maßnahme:** Rollen-Vertrag als kurzer Abschnitt (in `AGENTS.md` oder als `docs/memory-contract.md`):

| System | Rolle | Schreibrhythmus | Getrackt |
|---|---|---|---|
| `.remember/` | Roh-Buffer (Run-Logs, Tageslog, Handoff-Brief, künftig `runs/`) | automatisch, jede Session | nein |
| `~/.claude/projects/…/memory/` | Kuratierte **Fakten** über Jean, Projekt, Referenzen | bei neuem dauerhaftem Fakt | nein (Claude-lokal) |
| `LESSONS.md` | Kuratierte, destillierte **Regeln**, reisen mit dem Repo, lesen Claude **und** Codex | Distill-Schritt am Session-/Run-Ende | ja |

Datenfluss: `.remember/runs/` (Log) → `LESSONS.md` (Distill) → SessionStart/Spec (Repeat). Natives Memory bleibt orthogonal (Fakten, keine Prozess-Regeln).

---

## 7. Umsetzungswellen (erst nach Weg-Wahl)

| Welle | Inhalt | Dateien | Aufwand | Risiko |
|---|---|---|---|---|
| **1 — Lesson-Gate + Run-Memory** (kleinster Hebel) | G1-Hook (Variante nach Entscheidung E1) global registrieren; G2-Template `run-memory` anlegen; `session-stop.sh` um Lesson-Check ergänzen | `~/.claude/settings.json`, neuer `~/.claude/hooks/lesson-gate.sh`, `.claude/hooks/session-stop.sh`, Template in `.remember/runs/` | ~1 h | niedrig — Hooks sind additiv; schlimmster Fall: nervige Warnung, Hook wieder raus |
| **2 — Rückkopplung** | SessionStart-Injection der Top-Lessons; `TEMPLATE-spec.md` + Feld „Relevante Lessons"; Memory-Contract-Abschnitt (G5) | `~/.claude/settings.json` (SessionStart), `docs/specs/TEMPLATE-spec.md`, `AGENTS.md` oder `docs/memory-contract.md` | ~1–2 h | niedrig — Kontext-Kosten beobachten (nur Titelzeilen injizieren) |
| **3 — Verifier-Härtung + Messung** | Stop-Hook mit Review-Evidenz-Check (G4); AGENTS.md-Regel schärfen; nach 4 Wochen Kriterien K1–K7 messen und System nachjustieren | `~/.claude/settings.json` (Stop), `AGENTS.md`, Mess-Notiz in `outputs/` | ~2–3 h | mittel — False Positives des Evidenz-Checks können blockieren; deshalb zuletzt und mit Nudge-Fallback |

Jede Welle einzeln verifizierbar (Jeans Gate-Modus): Hook manuell triggern, Verhalten prüfen, erst dann nächste Welle.

---

## 8. Entscheidungen (von Jean getroffen, 2026-07-16)

- **E1 — Gate-Härte (G1):** ✅ **Hybrid** — Nudge bei kleinen Sessions, hart (`exit 2`) wenn Commits/PRs entstanden.
- **E2 — Ablageort Run-Memory (G2):** ✅ **`.remember/runs/`** — ungetrackt, Log-Ebene; Distillat wandert kuratiert nach `LESSONS.md`.
- **E3 — Codex-Vertrag:** ✅ **Ja, Codex auch** — derselbe Lessons-Vertrag gilt für Codex: `LESSONS.md` lesen **und** schreiben, Run-Memory-Format nutzen. Verankerung über `AGENTS.md` (liest Codex); das technische Gate (Hooks) bleibt Claude-seitig, da Codex keinen äquivalenten Hook-Mechanismus hat — für Codex gilt der Vertrag konventionsgetrieben.
- **E4 — Rückkopplungs-Mechanik (G3):** ✅ **Beides** — SessionStart-Hook-Injection + Pflichtfeld „Relevante Lessons" in `TEMPLATE-spec.md`.

---

## 9. Nebenbefund Sicherheit (außerhalb des System-Scopes)

In `~/.claude/settings.local.json` steht ein **n8n-JWT im Klartext** in der Permissions-Allowlist. Die Datei ist nicht repo-getrackt, aber ein Klartext-Token in einer Config ist gegen die eigene Regel „Bei Secret-Leak: sofort rotieren" zumindest grenzwertig — insbesondere weil settings-Dateien gern kopiert/gesynct werden.

**Empfehlung:** Token in n8n rotieren, Allowlist-Eintrag auf ein Muster ohne eingebettetes Token umstellen (z.B. Header aus Env-Variable beziehen). Unabhängig von jeder Weg-Wahl zeitnah erledigen.

**Status:** ✅ ERLEDIGT — Jean hat den Key am 2026-07-16 rotiert.

---

## Anhang: Verifizierte Artefakt-Referenzen

- `.claude/hooks/session-stop.sh` — SessionEnd-Hook: Git-sauber, `next-session-brief.md`-Freshness (>90 min), Secret-Grep, `exit 2` bei Issues
- `.claude/hooks/secret-scan.sh` — Projekt-Secret-Scan
- `~/.claude/hooks/secret-detector.sh` — globaler PostToolUse-Hook (einziger globaler Hook)
- `docs/specs/TEMPLATE-spec.md` — Spec-Template mit DoD (Tests, Lint, Reviewer-PASS)
- `LESSONS.md` — Format Datum · Erkenntnis · Handlung · Confidence; „Was fehlgeschlagen ist" leer
- `.claude/agents/reviewer.md` — DoD-Reviewer, PASS/FAIL, führt `pnpm run verify` / `pytest` aus
- `.claude/agents/wachsam-task-reviewer.md` — Task-Diff vs. Brief, zwei getrennte Urteile
- `.remember/` — `now.md`, `today-*.md`, `recent.md`, `archive.md`, `next-session-brief.md`, `logs/`
- `~/.claude/projects/…WachSam…/memory/MEMORY.md` — Index des nativen Memorys
