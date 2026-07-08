# Outputs

`outputs/` enthält Markdown-Reports, Audits und Plan-Artefakte.

## Gültigkeit

- Aktive Richtung steht in `docs/product-current.md` und `.remember/next-session-brief.md`.
- Dateien in `outputs/` sind Momentaufnahmen aus früheren Wellen.
- Alte Audits können Befunde enthalten, sind aber keine aktuelle Produktweisung.

## Neue Artefakte

Neue Dateien in `outputs/` sollen kurz, datiert und entscheidungsorientiert sein:

```text
YYYY-MM-DD-kurzer-titel.md
```

HTML-Mockups, Screenshots und Tool-Rohdaten bleiben lokal oder gitignored, außer sie werden ausdrücklich als dauerhaftes Projektartefakt freigegeben.

Routine-Daily-Reports bleiben untracked:

```text
daily-*.md
security-secret-sweep-*.md
```

Wenn ein Daily-Run echte Findings enthält, wird er bewusst als trackbares Artefakt benannt:

```text
daily-findings-YYYY-MM-DD.md
YYYY-MM-DD-findings-kurzer-titel.md
```
