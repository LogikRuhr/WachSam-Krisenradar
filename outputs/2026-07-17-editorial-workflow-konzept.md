# Konzept: Editorial-Workflow neu gedacht — vom Draft-Abarbeiten zum Freshness-Cockpit

**Datum:** 2026-07-17 · **Status:** ENTSCHIEDEN (2026-07-18): B als Zielbild in Wellen — Welle 1 (A-Bausteine) in Umsetzung (Branch `feat/editorial-welle1`) · **Auslöser:** Jean, nach Live-Nutzung: „der gesamte Workflow ist total unpraktisch, aufwendig und unübersichtlich."

**Jeans Entscheidungen (2026-07-18):**
- **E1:** Doc-Empfehlung angenommen — B als Zielbild, in Wellen; C später als Firehose-Entlastung.
- **E2/E3:** noch offen — wird vor Welle 3 (Vertrauensstufen) entschieden.
- **E4:** Ja — Welle 1 (Pinning + Deckel-Ausnahme, ein Queue-Einstieg, Freigeben+Publizieren als ein Schritt) sofort umgesetzt.
- **E5:** Erst inhaltlich aktualisieren — neuer Draft `ns-2026-07` (Entwurf: `outputs/2026-07-18-ns-2026-07-entwurf.md`), `ns-2026-06` danach rejecten.

---

## 1. Ziel

**Die redaktionelle Arbeit soll sich nach „was auf der öffentlichen Seite gerade veraltet oder falsch ist" richten — nicht nach „was der Generator zuletzt ausgeworfen hat".** Freigeben muss schnell, priorisiert und mobil in Minuten erledigt sein, nicht in dutzenden Einzelklicks.

**Erfolgsbild:** Jean öffnet EINE Seite, sieht oben „öffentliche Startseite steht auf Datenstand X — hier der frische Gesamtstand, 1 Tap zum Aktualisieren", darunter den Rest nach Wirkung sortiert und in Stapeln abarbeitbar. Kein Item, das den öffentlichen Eindruck prägt, verschwindet je unter Nebenmeldungen.

---

## 2. Ist-Zustand (im Code verifiziert)

**Generator:** `v02/intelligence/src/main.py` — APScheduler, Cron **06:00 + 18:00 UTC** (`INGESTION_MODE=scheduled`). Zweimal täglich entsteht ein Schwung neuer Entwürfe über **9 Typen**: `lagebildItems`, `costImpacts`, `supplyRisks`, `cascades`, `governance`, `indicators`, `citizenActions`, `facts`, `nationalState`.

**Status-Maschine:** `editorial_status` = `draft → approved → published` (+ `rejected`, + unpublish `published → draft`). Neue Generator-Items werden explizit auf `draft` gesetzt.

**Freigabe = zwei getrennte Schritte:** `approveReviewItem` (draft → approved, leitet auf die Detailseite) **und danach** `publishReviewItem` (approved → published, leitet auf `/review`). Erst Publizieren macht ein Item öffentlich (`revalidatePublic()`).

**Zwei überlappende Oberflächen:**
- `/review` — „Mobile Queue" (`getMobileEditorialReviewQueue`), mischt **alle 9 Typen**, sortiert nach Status+Aktualität, **Deckel bei 30**.
- `/admin` — „Editorial CMS", zeigt dieselben Drafts mit denselben FREIGEBEN-Buttons, plus eine Typen-Übersicht mit Einzellisten (`/admin/nationalState`, `/admin/lagebildItems`, …).

Beide Actions `revalidatePath` sowohl `/review` als auch `/admin` — bestätigt: **dasselbe Werkzeug, doppelt vorhanden.**

### Konkret erlebte Bruchstellen (Live-Session 2026-07-17)

| # | Bruchstelle | Beleg |
|---|---|---|
| B1 | **Priorität invertiert.** Der Gesamtstand (`ns-2026-06`, ENTWURF, prägt die öffentliche `/lage` + Startseiten-Datenstand) war in `/review` **unsichtbar** — die 30er-Queue war voll mit tagesschau-Meldungen, der Gesamtstand rutschte darunter. Nur über `/admin/nationalState` auffindbar. | Queue-Deckel `slice(0, 30)`; 30/30 = lagebild |
| B2 | **Zwei Orte fürs Gleiche.** `/review` und `/admin` zeigen identische Drafts + Buttons. Kein „der eine Ort für meine Entscheidungen". | `revalidateReview` fasst beide an |
| B3 | **Aufwand skaliert nicht.** Jedes Item einzeln FREIGEBEN, dann separat PUBLIZIEREN. Bei 2 Generatorläufen/Tag über 9 Typen sind das täglich dutzende Klicks, nur um nicht zurückzufallen. | zwei Actions, kein Bulk |
| B4 | **Das echte Problem wird nicht angezeigt.** „Startseite steht auf 21. Mai" schreit nirgends. Stattdessen schreien 30 Nebenmeldungen. Die Ansicht zeigt „KI-Output", nicht „öffentlich veraltet". | keine Freshness-Sicht |
| B5 | **Keine Triage/Verfall.** Drafts von 15.07. 18:01 stehen gleichberechtigt neben 17.07. 06:02. Nichts bündelt, verfällt oder filtert nach Relevanz. | Queue wächst monoton |
| B6 | **Mensch als Gate für JEDEN KI-Draft.** Das Modell verlangt eine menschliche Freigabe pro generiertem Item — bei einem 2×/Tag-Generator strukturell nicht durchhaltbar. | `draft`-Default für Generator-Items |

---

## 3. Kernproblem (eine Zeile)

Das System ist eine **Draft-Freigabe-Warteschlange** („arbeite ab, was die KI produziert hat"). Was Jean braucht, ist ein **Freshness-Cockpit** („zeig mir, was öffentlich veraltet ist, und lass es mich mit einem Tap richten"). Alle sechs Bruchstellen folgen aus dieser einen Modell-Verwechslung.

---

## 4. Anforderungen (prüfbar)

- **A1 — Ein Ort.** Genau eine redaktionelle Oberfläche als Einstieg; die Typen-Detaillisten bleiben als Tiefe, aber nicht als zweiter „Queue"-Einstieg.
- **A2 — Priorität nach öffentlicher Wirkung.** Items, die den öffentlichen Gesamteindruck prägen (Gesamtstand, Datenstand-treibende Typen), stehen immer oben — unabhängig vom Nachrichtenvolumen. Kein Deckel, der High-Impact-Items verschluckt.
- **A3 — Freshness sichtbar.** Der Einstieg zeigt zuerst „was ist auf der öffentlichen Seite wie alt", nicht nur „was ist neu im Draft-Stapel".
- **A4 — Weniger Klicks.** Freigeben+Publizieren als ein Schritt (oder Bulk über eine Auswahl); mobil in Sekunden pro Entscheidung.
- **A5 — Firehose triagieren.** Die 2×/Tag-Nebenmeldungen dürfen nicht alle einzeln den Menschen blockieren — entweder gebündelt, gefiltert oder mit anderem Vertrauens-/Auto-Modus (siehe Wege).
- **A6 — Mobil-tauglich.** Alles ohne Desktop/SSH bedienbar (Jeans Feedback: mobil arbeiten, keine neuen manuellen Ops-Schritte).
- **A7 — Kein Rückschritt bei Sorgfalt.** High-Impact-Inhalte (Gesamtstand) behalten ein menschliches Vor-Publish-Gate; Qualität/Quellenpflicht/DSGVO bleiben gewahrt.

---

## 5. Kriterien (DoD, messbar)

- [ ] **K1:** Der Gesamtstand-Entwurf ist vom Einstieg aus in **≤ 1 Interaktion** erreichbar (nie mehr unter einem Deckel verschwunden).
- [ ] **K2:** Ein kompletter Generatorlauf (ein 06:00- oder 18:00-Schwung) ist in **≤ 5 Minuten mobil** entschieden (freigeben/ablehnen/publizieren), gemessen an einem realen Tages-Batch.
- [ ] **K3:** Der Einstieg nennt für jeden öffentlich-relevanten Bereich den **aktuellen öffentlichen Datenstand** und ob ein frischerer Entwurf bereitliegt.
- [ ] **K4:** „Freigeben und publizieren" ist **ein** bestätigter Schritt (oder Bulk); die alte 2-Klick-Kette ist nicht mehr der Standardpfad.
- [ ] **K5:** Es existiert **nur noch ein** primärer Queue-Einstieg (`/review` und `/admin`-Queue nicht mehr doppelt).
- [ ] **K6:** Nach 1 Woche Betrieb ist die öffentliche Startseite nicht älter als der jüngste freigegebene Gesamtstand (kein „21. Mai trotz Juni-Draft" mehr).

---

## 6. Wege (Iterations-Kern — hier entscheidest du)

### Weg A — Minimal-Repair (schnell, Modell bleibt)
Das bestehende „gate-jeden-Draft"-Modell bleibt, es wird nur entschärft.
- Gesamtstand + Datenstand-treibende Typen im Queue-Sort **immer nach oben pinnen**, Deckel für diese Klasse aufheben (behebt B1/A2).
- `/review` und `/admin`-Queue **auf eine** reduzieren, die andere auf reine Tiefe umstellen (B2/A2).
- FREIGEBEN+PUBLIZIEREN zu **einem** Button zusammenlegen; Mehrfachauswahl mit Bulk-Freigabe (B3/A4).
- **Trade-off:** Kleinster Eingriff, schnell umsetzbar. **Löst B6 nicht grundsätzlich** — der Mensch bleibt Gate für jeden Draft (B6/A5 bleiben offen). Gut als Sofort-Linderung, nicht als Zielbild.

### Weg B — Freshness-Cockpit (Zielbild, mittlerer Umbau)
Der Einstieg wird invertiert: nicht „Draft-Stapel", sondern „öffentlicher Zustand".
- Landing = **Liste der öffentlichen Bereiche** mit Datenstand, Alter und „frischer Entwurf verfügbar? → 1 Tap aktualisieren".
- Der Nebenmeldungs-Firehose wird zu einem **sekundären, gebündelten** Bereich (nach Relevanz/Region gefiltert), nicht der Haupt-Screen.
- Baut auf Weg A auf (Pinning, ein Ort, ein Klick sind Bausteine).
- **Trade-off:** Deutlich näher an „praktisch". Mehr UI-Arbeit (neue Read-Sicht „öffentlicher Stand vs. bester Draft" pro Typ). Ändert nicht, dass Menschen die Nebenmeldungen noch sichten — das löst erst Weg C.

### Weg C — Vertrauensgestufte Auto-Publikation (größter Hebel gegen B6)
Trennt Item-Klassen nach Risiko:
- **High-Impact** (Gesamtstand, ggf. Kaskaden/Governance): menschliches **Vor**-Publish-Gate bleibt (A7).
- **Low-Risk-Firehose** (einzelne Lagebild-Meldungen mit valider Quelle + Editorial-Gate bestanden): **Auto-Publish mit Post-hoc-Review** — erscheint sofort, Jean kann jederzeit zurückziehen (unpublish existiert bereits).
- **Trade-off:** Beseitigt den täglichen Klick-Berg (B3/B6/A5) fast vollständig. Höheres Vertrauen in die automatische Editorial-/Quellenprüfung nötig; braucht klare Kriterien „was ist low-risk" und ein gutes Rückzieh-/Audit-Verhalten. Redaktionell die größte Entscheidung.

**Empfehlung:** **B als Zielbild, in Wellen — beginnend mit den A-Bausteinen, dann C als Firehose-Entlastung.** A allein lindert nur; C allein ohne B lässt den Gesamtstand weiter schlecht auffindbar.

---

## 7. Umsetzungswellen (erst nach Weg-Wahl)

| Welle | Inhalt | grob |
|---|---|---|
| **1 — Sofort-Linderung (A-Bausteine)** | Gesamtstand pinnen + Deckel-Ausnahme; ein Queue-Einstieg; Freigeben+Publizieren als ein Schritt | klein, geringes Risiko |
| **2 — Freshness-Cockpit (B)** | Landing invertieren: öffentlicher Datenstand pro Bereich + „aktualisieren", Firehose sekundär/gebündelt | mittel |
| **3 — Vertrauensstufen (C)** | Low-Risk-Auto-Publish + Post-hoc-Review + Rückzieh-/Audit-Feinschliff; High-Impact behält Gate | mittel, redaktionell heikel |

Jede Welle einzeln verifizierbar (dein Gate-Modus): live prüfen, grün → nächste.

---

## 8. Offene Entscheidungen für Jean

- **E1 — Zielweg:** A / B / C — oder „B in Wellen, mit C später" (Empfehlung)?
- **E2 — Firehose-Vertrauen (Kern von C):** Sollen einzelne Lagebild-Meldungen bei bestandenem Editorial-/Quellen-Gate **automatisch** öffentlich gehen (mit Rückzieh-Option), oder bleibt jede Meldung menschlich vor-freizugeben?
- **E3 — Welche Typen sind „High-Impact" (immer menschliches Vor-Gate)?** Sicher: `nationalState`. Offen: Kaskaden, Governance, Indikatoren?
- **E4 — Sofort-Linderung jetzt?** Welle 1 (Pinning + ein Klick) unabhängig von der großen Weg-Wahl vorziehen, damit der akute Schmerz weg ist?
- **E5 — Der konkrete `ns-2026-06`-Entwurf:** unabhängig vom Umbau — so freigeben, erst inhaltlich aktualisieren, oder liegen lassen? (Er ist ~1 Monat alt, Stichtag „Mitte 2026".)

---

## 9. Anhang: verifizierte Referenzen

- `v02/intelligence/src/main.py:361-371` — Scheduler 06:00/18:00 UTC, `INGESTION_MODE=scheduled`
- `v02/db/schema/index.ts:20` — `editorial_status` = draft/approved/rejected/published; `:48` Default `published`
- `v02/web/app/review/actions.ts` — `approveReviewItem` / `publishReviewItem` (zwei Schritte) / `rejectReviewItem`
- `v02/web/lib/admin/editorial-read.ts:107` — `reviewStatuses = {draft, approved}`; `:566/:590` — Queue-Deckel `slice(0, limit)`, alle Typen gemischt
- `v02/web/lib/admin/editorial.ts:185,199,203` — publish/unpublish + `revalidatePublic()`
- `/review` (Mobile-Queue) und `/admin` (CMS) — überlappende Oberflächen; `/admin/nationalState` → `ns-2026-06`, ENTWURF, nie publiziert
- Verwandt: [[project-national-state-lagebild]] (Feature abgeschlossen, Freigabe war schon damals der Restpunkt), [[project-living-app-wave1-pr44]], [[project-cms-admin-access]] (Login-Fix 2026-07-17, Voraussetzung dafür, dass /review überhaupt bedienbar ist)
