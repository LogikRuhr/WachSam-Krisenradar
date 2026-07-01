# Spec: WachSam Relevance Gate

## Ziel
RSS/LLM-Items duerfen nur dann als Lagebild-Draft gespeichert werden, wenn sie eine nachvollziehbare WachSam-Relevanz haben: Deutschland-Bezug, Systembereich und konkrete Haushalts-, Kosten-, Versorgungs- oder Stabilitaetswirkung.

## Nicht-Ziele
- Kein Auto-Publish.
- Kein neues DB-Schema.
- Keine allgemeine News-Kuration.
- Keine UI-Aenderung.

## Acceptance
- LLM-extrahierte `lagebild_items` laufen vor `insert_draft` durch ein hartes Relevance Gate.
- Das Gate rejected allgemeine Kultur-, Kirchen-, Sport-, Promi-, Einzelereignis- und Auslandsmeldungen ohne Deutschland-/Haushaltskaskade.
- Das Gate erlaubt Signale zu Energie, Preisen, Sprit, Renten/Beitraegen, Industrie/Arbeitsplaetzen, Versorgung, Infrastruktur, Gesundheit, Logistik, Rohstoffen und geopolitischen Kaskaden mit Markt-/Deutschlandwirkung.
- Rejections werden als strukturierte Log-Zeile ausgegeben und nicht in die DB geschrieben.
- Tests decken allow/reject-Beispiele ab.

## Data/API/UI Impact
- DB-Schema unveraendert.
- Public UI unveraendert.
- Weniger Drafts in der Editorial Queue; hoehere fachliche Trefferquote.

## Security/DSGVO
- Keine PII.
- Keine Secrets.
- Keine Userdaten.

## Verify
- `bash scripts/verify.sh`
- `cd v02 && corepack pnpm run verify`
- `cd v02/intelligence && python -m pytest tests/ -q`
- Production Queue nach Deploy read-only pruefen.

## Rollback
Commit revert. Bereits abgelehnte Drafts koennen bei Bedarf manuell neu erzeugt werden; es wird nichts geloescht.
