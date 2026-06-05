# Hermes Agent: Provider, Kontext und WachSam-Setup

Stand: 2026-06-04, lokal geprueft mit Hermes Agent v0.15.1.

## Lokal aktiv

Hermes MCPs sind enabled:

- `filesystem`
- `context7`
- `chrome-devtools`
- `playwright`
- `notebooklm`

Hermes-Kontext-/Routing-Defaults sind gesetzt:

- `compression.enabled: true`
- `compression.threshold: 0.50`
- `compression.target_ratio: 0.20`
- `compression.protect_last_n: 20`
- `auxiliary.compression.provider: auto`
- `provider_routing.sort: price`
- `provider_routing.data_collection: "deny"`
- `openrouter.response_cache: true`
- `memory.memory_enabled: false`
- `memory.user_profile_enabled: false`

v02 Browser-Smoke ist eingerichtet:

- `cd v02 && pnpm run smoke:ui:install`
- `cd v02 && pnpm run smoke:ui`

## Kontextkompression

Hermes hat zwei Ebenen:

- `compression:` steuert Trigger und Zielgroesse (`enabled`, `threshold`, `target_ratio`, `protect_last_n`).
- `auxiliary.compression:` steuert Modell und Provider fuer die Zusammenfassung.

Wichtige Optionen:

- Manuell: `/compress`
- Default: `provider: auto`, `model: ""` nutzt das Hauptmodell.
- Fuer Kosten/Speed: Compression explizit auf ein schnelles Flash-/Mini-Modell routen.
- Wenn kein Provider verfuegbar ist, droppt Hermes mittlere Turns statt die Session zu stoppen.
- `model.context_length` nur manuell setzen, wenn ein lokaler/custom Provider falsche Limits meldet.

## Provider-Moeglichkeiten

Hauptmodell:

- Aggregator: `openrouter`
- Native APIs: `anthropic`, `gemini`, `deepseek`, `nvidia`, `xai`, `zai`, `kimi-coding`, `minimax`, `alibaba`, `bedrock`, `huggingface`, `arcee`, `azure-foundry`
- OAuth/Account-Flows: `nous`, `openai-codex`, `qwen-oauth`, `google-gemini-cli`, `xai-oauth`, `minimax-oauth`
- Developer Accounts: `copilot`, `copilot-acp`
- Lokal/custom: `custom_providers`, `ollama`, `vllm`, `llamacpp`, `lmstudio`, OpenAI-compatible `base_url`

Auxiliary Tasks:

- Slots sind separat konfigurierbar, z.B. Vision, Web Extract, Compression, Session Title, Approval Scoring, Skill Search.
- Provider koennen `auto`, `main` oder ein konkreter Provider sein.
- Per Task ist eine eigene `fallback_chain` moeglich.
- Delegation/Subagents koennen ein eigenes `delegation.provider` + `delegation.model` bekommen.

OpenRouter-Routing:

- `provider_routing.sort`: `price`, `throughput`, `latency`
- `provider_routing.only` / `ignore` / `order`
- `provider_routing.data_collection: "deny"` fuer DSGVO-sensiblere Arbeit
- `openrouter.response_cache: true` fuer identische Requests

## Empfehlung fuer WachSam

Kurzfristig:

- Main: OpenRouter als Broker nutzen, sobald `OPENROUTER_API_KEY` gesetzt ist, damit Claude/GPT/Gemini/DeepSeek/Kimi ohne Config-Umbau testbar bleiben.
- Compression: aktuell sicher auf `auto`; nach Provider-Key ein schnelles Modell explizit setzen, damit nicht das teure Hauptmodell komprimiert.
- Delegation: nach Provider-Key guenstiges schnelles Modell fuer read-only Audits und Doku-Recherche setzen.
- Browser: Playwright-Smoke als lokales Gate behalten; `chrome-devtools` fuer Debug-Sessions nutzen.
- Sicherheit: `data_collection: "deny"` ist vorbereitet; keine PII in Prompts, keine Secrets in Repo.

Mittelfristig:

- Fallback-Chain definieren: Primary coding model, guenstiger Fallback, lokaler/custom Fallback.
- `memory` nur aktivieren, wenn klar ist, welche Daten persistiert werden duerfen.
- `session_search` fuer Projektwissen nutzen, aber keine personenbezogenen Inhalte persistieren.
- Fuer kritische WachSam-Fakten weiterhin live gegen Quellen pruefen; keine Modellantwort als Quelle behandeln.

## Quellen

- Hermes Context Compression and Caching: https://hermes-agent.nousresearch.com/docs/developer-guide/context-compression-and-caching/
- Hermes Configuration: https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/configuration.md
- Hermes Fallback Providers: https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/fallback-providers.md
- Hermes Configuring Models: https://hermes-agent.nousresearch.com/docs/user-guide/configuring-models
- Hermes Environment Variables: https://github.com/nousresearch/hermes-agent/blob/main/website/docs/reference/environment-variables.md
