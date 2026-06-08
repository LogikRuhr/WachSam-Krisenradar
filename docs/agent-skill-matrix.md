# WachSam Agent-/Skill-Matrix

Zweck: klare Orchestrierung für WachSam-Arbeit. Hermes bleibt Haupt-Orchestrator; Claude-/Codex-Agents und Skills sind spezialisierte Werkzeuge. Entscheidungen über Produkt, Architektur, DB und Deploy bleiben in der Hauptsession mit User-Freigabe.

## Leitprinzip

- **Hermes**: Kontext, Planung, Tool-Orchestrierung, Freigabegrenzen, Verify-before-Claim.
- **Claude Agents**: tiefes Revierwissen für Analyse, UX, Daten, Schema, Deploy und Review.
- **Codex Agents/Briefs**: fokussierte Coding-/Audit-Aufträge mit engem Scope.
- **Skills**: dauerhafte WachSam-Prozesse, Trigger, Gates und Wiederholbarkeit.

## Kernproblem aktuell

WachSam ist fachlich stark, wirkt live aber noch eher wie eine informative Website als wie eine nutzbare App. Zusätzlich ist der Dateninput noch zu eng: wenige Quellklassen, begrenzte Indikatorbreite, noch keine robuste Source-Expansion-Pipeline.

## Matrix

### Webapp wirkt nicht wie App

- Hermes Skill: `.agents/skills/wachsam-app-experience/SKILL.md`
- Claude Agents: `wachsam-app-product-architect`, `wachsam-app-ux-designer`
- Codex Briefs: `.codex/agents/wachsam-app-product-architect.md`, `.codex/agents/wachsam-app-ux-designer.md`
- Nützliche Skills: `sketch`, `claude-design`, `popular-web-designs`, `dogfood`
- Verify: Browser-Smoke, console clean, desktop/mobile, konkrete App-State-Marker

### Dateninput ist zu eng

- Hermes Skill: `.agents/skills/wachsam-source-expansion/SKILL.md`
- Claude Agents: `wachsam-source-expansion-researcher`, bestehend `wachsam-ingestion-engineer`
- Codex Brief: `.codex/agents/wachsam-source-expansion-researcher.md`
- Nützliche Skills: `blogwatcher`, `youtube-content`, `google-workspace`, `ocr-and-documents`, `arxiv`, `llm-wiki`
- Verify: echte Quellen-URLs, Stand, Source-Health, Adapter-Test, keine Mockdaten

### Live-Webapp prüfen

- Hermes Skill: `.agents/skills/wachsam-live-smoke/SKILL.md`
- Claude Agent: `wachsam-browser-smoke-tester`
- Codex Brief: `.codex/agents/wachsam-browser-smoke-tester.md`
- Nützliche Skills: `dogfood`
- Verify: HTTP 200, Content-Marker, Console, Desktop/Mobile, Screenshot/Report

### Editorial-/Quellenqualität

- Claude Agent: `wachsam-editorial-reviewer`
- Codex Brief: `.codex/agents/wachsam-editorial-reviewer.md`
- Bestehende Doku: `docs/editorial-gate.md`, `docs/methodology.md`, `docs/product.md`
- Verify: Quellenpflicht, Stand, Deutschland-Relevanz, Haushaltswirkung, Tonalität, keine PII

### Bestehende Spezialgebiete

- Schema/Migration: `wachsam-drizzle-migrator`
- Deploy/Runtime: `wachsam-deploy-operator`
- Kausalität/Invisible Chain: `wachsam-data-analyst`
- Ingestion/Adapter: `wachsam-ingestion-engineer`

## Entscheidungsregel

- Kleine Datei-/Repo-Lookups: Hermes direkt.
- Große read-only Audits: Hermes `delegate_task` oder Claude Agent.
- App-/UX-Strategie: Product Architect + UX Designer, Ergebnis als Plan in `outputs/`.
- Datenquellenstrategie: Source Researcher, danach Ingestion Engineer für Adapter.
- Code-Umsetzung: Codex oder Claude Code nur nach Plan und Freigabe.
- Produkt-/Architekturentscheidungen: nie durch Subagent allein.

## Session-Handoff-Regel

Der bisherige WachSam-Flow bleibt verbindlich:

- Claude/Codex CLI-Sessions lesen zu Beginn `AGENTS.md` und `.remember/next-session-brief.md`.
- Codex pflegt am Session-Ende `.remember/codex-session.md`, wenn Codex CLI aktiv genutzt wurde.
- Claude Code pflegt seine eigene Session-/Handoff-Datei, falls vorhanden; sonst wird der gemeinsame `next-session-brief.md` aktualisiert.
- Der gemeinsame `.remember/next-session-brief.md` wird nach abgeschlossenen Wellen, Richtungswechseln oder relevanten Agent-/Workflow-Änderungen aktualisiert.
- Hermes prüft am Ende: Was wurde geändert, was ist verifiziert, was ist der nächste konkrete Schritt?
- Keine Secrets, keine PII, keine Chat-Logs in Handoff-Dateien.

## Empfohlene nächste Welle

1. Read-only Audit: Live-App gegen App-Kriterien prüfen.
2. Source-Gap-Audit: Quellenklassen und Datenlücken auflisten.
3. App-Experience-Plan: 3-5 konkrete App-Features priorisieren.
4. Source-Expansion-Plan: 5-8 neue Quellenklassen mit Aufwand/Risiko/Impact.
5. Erst danach Code-Umsetzung in kleinen Wellen.
