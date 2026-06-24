# Spec: Google ADC Support fuer Vertex AI

## Ziel (in einem Satz)
Die Intelligence-Pipeline nutzt Vertex AI lokal und produktiv mit sicherem Credential-Guard: explizite Keyfile-Credentials funktionieren weiter, Google ADC ohne Keyfile wird sauber akzeptiert.

## Clarifications (vom Agenten gestellte Rueckfragen + meine Antworten)
- F: Soll der Service-Account-Key per `gcloud` erzeugt werden? -> A: Ja.
- F: Darf die Key-Creation-Policy temporaer deaktiviert werden? -> A: Ja.

## Umfang / Nicht-Umfang
- In Scope: LLM-Credential-Guard fuer Keyfile und ADC, Tests, lokale `.env.example`-Hinweise, Deploy-Doku, gitignore-Hardening fuer lokale Secret-Ordner.
- Out of Scope: Deploy, DB-Migration, Auto-Publish, Loeschen alter Service-Account-Keys.

## Definition of Done
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` mit gueltiger Datei bleibt akzeptiert.
- [ ] Placeholder oder nicht lesbare `GOOGLE_APPLICATION_CREDENTIALS` stoppen LLM vor Vertex-Init.
- [ ] Leere `GOOGLE_APPLICATION_CREDENTIALS` nutzt ADC-Fallback, wenn `google.auth.default()` Credentials findet.
- [ ] Leere `GOOGLE_APPLICATION_CREDENTIALS` skippt sauber, wenn ADC fehlt.
- [ ] Tests gruen: `cd v02/intelligence && python -m pytest tests/test_llm_extractor.py -q`, `cd v02/intelligence && python -m pytest tests/ -q`, `cd v02 && pnpm run verify`, `bash scripts/verify.sh`.
- [ ] Keine Secrets in tracked Files; Key-Inhalt wird nicht gelesen, gedruckt oder committed.

## Schritte
1. Session-Handoff ohne Secret-Inhalt aktualisieren.
2. Tests fuer ADC-Fallback und fehlendes ADC schreiben und RED verifizieren.
3. Credential-Guard minimal implementieren.
4. `.env.example`, `docs/deploy.md` und `.gitignore` anpassen.
5. Verify-Gates ausfuehren.

## Rollback
- Code-/Doku-Aenderungen per Revert zuruecknehmen.
- Lokal gesetztes `GOOGLE_APPLICATION_CREDENTIALS` entfernen.
- Neuer Key kann separat geloescht werden:
  `gcloud iam service-accounts keys delete a665beec174269f8794c97eaa77b72fa68dd8fe4 --iam-account=wachsam-intelligence@wachsam-prod.iam.gserviceaccount.com --project=wachsam-prod`
