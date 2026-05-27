# Security

## Grundregeln

- Keine Secrets in tracked Files.
- Keine personenbezogenen Daten in Repo, Logs, Outputs, Issues oder Chat.
- Keine echten API-Keys in Beispielen.
- `.env.example` darf nur Platzhalter enthalten.
- Externe Services werden erst nach Spec und Security-Pruefung angebunden.

## Secret-Handling

Wenn ein Secret sichtbar wurde:

1. Secret sofort rotieren.
2. Leak aus dem Arbeitsbaum entfernen.
3. Git-Historie und Remote pruefen.
4. Betroffene Systeme dokumentieren.
5. Erst nach Rotation weiterarbeiten.

## Pre-Commit-Check

```bash
git diff --check
bash scripts/verify.sh
```

Der Verify-Check sucht nach typischen Secret-Patterns. Er ersetzt keine manuelle Review.

## Datenschutz

Outputs duerfen nur anonymisierte oder synthetische Inhalte enthalten. Rohdaten, Personenbezug,
Kontaktdaten, Tokens, Cookies und Sessiondaten bleiben ausserhalb des Repos.

