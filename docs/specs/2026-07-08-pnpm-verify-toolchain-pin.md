# Spec: pnpm Verify Toolchain Pin

## Ziel
`cd v02 && pnpm run verify` laeuft in Automation reproduzierbar mit der vom Repo erwarteten pnpm-Version.

## Clarifications
- F: Soll auf pnpm 11 migriert werden? -> A: Nein, zuerst das bestehende `packageManager: pnpm@9.15.0` stabil durchsetzen; Migration nur mit eigener Freigabe.

## Umfang / Nicht-Umfang
- In Scope: Corepack-/pnpm-Version in lokalen Runbooks, CI/Automation-Hinweisen und Verify-Doku.
- In Scope: Lockfile-Konfigurationsfehler `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` reproduzieren und beheben.
- Out of Scope: Dependency-Upgrades, pnpm-11-Migration, ungepruefte Lockfile-Regeneration.

## Kriterien
- `corepack pnpm --version` im `v02`-Kontext ergibt `9.15.0` oder der Verify-Befehl erzwingt diese Version.
- `cd v02 && corepack pnpm run verify` laeuft ohne pnpm-Purge-Prompt und ohne Lockfile-Config-Mismatch.
- Doku nennt den kanonischen Befehl fuer lokale und Automation-Gates.
- Keine Dependency-Versionen werden ohne eigenen Grund veraendert.

## Tests
- `corepack enable`
- `cd v02 && corepack pnpm --version`
- `cd v02 && corepack pnpm install --frozen-lockfile`
- `cd v02 && corepack pnpm run verify`
- `bash scripts/verify.sh`

## Qualitaet
- Keine interaktiven Prompts in CI/Automation.
- Keine Lockfile-Churn ohne Dependency-Aenderung.
- Windows- und Linux-Befehle bleiben dokumentiert.

## Optimierung
- Ein kurzer Preflight-Hinweis in Verify-Doku reduziert wiederkehrende Toolchain-Diagnosen.
- Spaetere pnpm-Migration als separate, kleine Infrastruktur-Welle planen.

## Schritte
1. Aktuelle pnpm-Aufloesung lokal und in Automation erfassen.
2. Corepack-Pin oder Runbook-Befehl korrigieren.
3. Frozen install und Verify ausfuehren.
4. Doku aktualisieren.
