# WachSam Intelligence Service

Python-basiertes Ingestion- und Analyse-System für strukturierte und unstrukturierte Quellen.

Autorisiert durch ADR-039. Specs in `intelligence/` (Repo-Root).

## Verzeichnisstruktur

```
v02/intelligence/
├── README.md
├── requirements.txt
├── pyproject.toml
├── src/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── models.py
│   ├── adapters/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── fao.py
│   │   └── warning_indicators.py
│   ├── extractors/
│   │   ├── __init__.py
│   │   └── llm_extractor.py
│   ├── queue/
│   │   ├── __init__.py
│   │   └── editorial_queue.py
│   ├── crawler/
│   │   └── rss_crawler.py
│   ├── utils/
│   │   └── helpers.py
│   └── tests/
```

## Schnellstart

```bash
cd v02/intelligence
pip install -r requirements.txt
python -m src.main
```

## Hinweise

- Alle Ausgaben gehen in die Editorial Queue — kein Auto-Publish
- Validierung mit Pydantic v2
- LLM (Vertex AI) nur für unstrukturierte Quellen
- `.env` ist gitignored — Secrets nie im Repo
