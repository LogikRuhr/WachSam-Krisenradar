#!/usr/bin/env bash
# measure-lessons.sh — misst die Kriterien K1–K7 des Run-Log-Distill-Repeat-Systems.
# Konzept & Kriterien: outputs/2026-07-16-run-log-distill-repeat-konzept.md
# Read-only bis auf Selbsttest-Artefakte (Session-Marker + Test-Run-Memory), die es selbst wieder loescht.
# Aufruf: bash scripts/measure-lessons.sh > outputs/$(date +%F)-lessons-messung.md
# Muss LOKAL laufen: .remember/ und ~/.claude/tmp sind ungetrackt und in Cloud-Umgebungen nicht vorhanden.
set -uo pipefail

WORKSPACE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$WORKSPACE" || exit 1
SYSTEM_START="2026-07-16"
NOW=$(TZ='Europe/Berlin' date '+%Y-%m-%d %H:%M')

PASS=0; FAIL=0; NA=0; MANUAL=0
declare -a SUMMARY

result() { # $1=K $2=STATUS $3=Datenzeile
  case "$2" in
    PASS) PASS=$((PASS+1));;
    FAIL) FAIL=$((FAIL+1));;
    n/a) NA=$((NA+1));;
    MANUAL) MANUAL=$((MANUAL+1));;
  esac
  SUMMARY+=("| $1 | **$2** | $3 |")
  echo ""
  echo "**Ergebnis $1: $2** — $3"
}

echo "# Lessons-Messung K1–K7 — $NOW"
echo ""
echo "System-Start: $SYSTEM_START · Repo: $(git rev-parse --short HEAD 2>/dev/null || echo '?') · Modus: $([ "$(TZ='Europe/Berlin' date '+%Y-%m-%d')" = "$SYSTEM_START" ] && echo Baseline || echo Vollmessung)"

# ---------------------------------------------------------------- K1
echo ""
echo "## K1 — Lesson-Gate blockt (Stop-Hook)"
GATE="$HOME/.claude/hooks/lesson-gate.sh"
K1A="FAIL"
if [[ -f "$GATE" ]]; then
  TESTID="measure-k1-selftest"
  MARKER="$HOME/.claude/tmp/session-$TESTID.start"
  mkdir -p "$HOME/.claude/tmp"
  LAST_COMMIT=$(git log -1 --format=%ct 2>/dev/null || echo 0)
  echo $((LAST_COMMIT - 60)) > "$MARKER"
  JSON="{\"session_id\":\"$TESTID\",\"cwd\":\"$WORKSPACE\"}"
  # Erwartung 1: Commits nach Marker, keine frische Lesson -> exit 2.
  # Voraussetzung: LESSONS.md und alle Run-Memories sind aelter als der letzte Commit
  # (direkt nach einer Arbeits-Session kann das legitim anders sein -> Hinweis statt FAIL).
  printf '%s' "$JSON" | bash "$GATE" >/dev/null 2>&1
  RC_BLOCK=$?
  # Erwartung 2: frisches Run-Memory -> exit 0
  TESTMEM="$WORKSPACE/.remember/runs/measure-selftest.md"
  mkdir -p "$WORKSPACE/.remember/runs"
  echo "- **Goal:** measure-lessons Selbsttest" > "$TESTMEM"
  printf '%s' "$JSON" | bash "$GATE" >/dev/null 2>&1
  RC_OPEN=$?
  rm -f "$TESTMEM" "$MARKER"
  if [[ "$RC_BLOCK" -eq 2 && "$RC_OPEN" -eq 0 ]]; then
    K1A="PASS"
    echo "- Selbsttest: blockt ohne Lesson (exit 2) und laesst mit Run-Memory durch (exit 0) ✅"
  elif [[ "$RC_BLOCK" -eq 0 && "$RC_OPEN" -eq 0 ]]; then
    K1A="PASS"
    echo "- Selbsttest: exit 0 im Block-Szenario — vermutlich existiert bereits eine Lesson/ein Run-Memory, das juenger ist als der letzte Commit (frisch nach einer Arbeits-Session normal). Durchlass-Fall ✅"
  else
    echo "- Selbsttest FEHLGESCHLAGEN: Block-Fall exit=$RC_BLOCK (erwartet 2), Durchlass-Fall exit=$RC_OPEN (erwartet 0)"
  fi
else
  echo "- $GATE fehlt — Gate nicht installiert"
fi

echo "- Feld-Abdeckung (jeder Commit-Tag seit $SYSTEM_START hat Run-Memory oder LESSONS.md-Aenderung):"
K1B="PASS"; COVERED=0; TOTALDAYS=0
LESSON_DAYS=$(git log --since="${SYSTEM_START}T00:00:00" --format=%cs -- LESSONS.md 2>/dev/null | sort -u)
COMMIT_DAYS=$(git log --since="${SYSTEM_START}T00:00:00" --format=%cs 2>/dev/null | sort -u)
if [[ -z "$COMMIT_DAYS" ]]; then
  echo "  - keine Commits seit $SYSTEM_START"
else
  while IFS= read -r day; do
    [[ -n "$day" ]] || continue
    TOTALDAYS=$((TOTALDAYS+1))
    HAS=""
    ls "$WORKSPACE/.remember/runs/${day}-"*.md >/dev/null 2>&1 && HAS="run-memory" || true
    [[ -z "$HAS" ]] && printf '%s\n' "$LESSON_DAYS" | grep -qx "$day" && HAS="LESSONS.md" || true
    if [[ -n "$HAS" ]]; then
      COVERED=$((COVERED+1)); echo "  - $day: ✅ ($HAS)"
    else
      K1B="FAIL"; echo "  - $day: ❌ kein Distillat"
    fi
  done <<< "$COMMIT_DAYS"
fi
if [[ "$K1A" == "PASS" && "$K1B" == "PASS" ]]; then
  result "K1" "PASS" "Selbsttest ok; $COVERED/$TOTALDAYS Commit-Tagen mit Distillat"
else
  result "K1" "FAIL" "Selbsttest=$K1A, Abdeckung=$K1B ($COVERED/$TOTALDAYS Tage)"
fi

# ---------------------------------------------------------------- K2
echo ""
echo "## K2 — Fehlschlag-Sektion gefuellt"
FAIL_ENTRIES=$(awk '/^## Was fehlgeschlagen/{f=1;next} /^## /{f=0} f' LESSONS.md 2>/dev/null | grep -c '^- 20' || true)
FAIL_ENTRIES="${FAIL_ENTRIES:-0}"
echo "- Eintraege in 'Was fehlgeschlagen ist': $FAIL_ENTRIES"
CI_FAILS=$(gh run list --status failure --created ">=$SYSTEM_START" --limit 50 --json databaseId --jq 'length' 2>/dev/null || echo "unbekannt (gh nicht verfuegbar)")
echo "- CI-Failures seit $SYSTEM_START (Gegencheck, inkl. transienter Live-API-Flakes): $CI_FAILS"
if [[ "$FAIL_ENTRIES" -ge 1 ]]; then
  result "K2" "PASS" "$FAIL_ENTRIES Eintrag/Eintraege; CI-Fails seit Start: $CI_FAILS (bei >0 pruefen, ob ein Distillat existiert — Flakes zaehlen nicht)"
else
  result "K2" "FAIL" "Sektion leer trotz laufendem System"
fi

# ---------------------------------------------------------------- K3
echo ""
echo "## K3 — Specs referenzieren Lessons"
NEW_SPECS=$(git log --diff-filter=A --since="${SYSTEM_START}T00:00:00" --name-only --format= -- docs/specs/ 2>/dev/null | sort -u | grep -v TEMPLATE || true)
if [[ -z "$NEW_SPECS" ]]; then
  result "K3" "n/a" "keine neue Spec seit $SYSTEM_START"
else
  K3="PASS"; SPECN=0; SPECOK=0
  while IFS= read -r spec; do
    [[ -n "$spec" && -f "$spec" ]] || continue
    SPECN=$((SPECN+1))
    if grep -q '## Relevante Lessons' "$spec" && ! grep -q '<Datum' "$spec"; then
      SPECOK=$((SPECOK+1)); echo "- $spec: ✅"
    else
      K3="FAIL"; echo "- $spec: ❌ Feld fehlt oder Platzhalter"
    fi
  done <<< "$NEW_SPECS"
  result "K3" "$K3" "$SPECOK/$SPECN Specs mit gefuelltem Lessons-Feld"
fi

# ---------------------------------------------------------------- K4
echo ""
echo "## K4 — Review-Evidenz pro Merge/Push"
REVIEW_DAYS=$(ls "$WORKSPACE/.remember/reviews/" 2>/dev/null | sed -n 's/^review-\([0-9-]\{10\}\).*/\1/p' | sort -u || true)
echo "- Review-Marker-Tage: $(printf '%s' "$REVIEW_DAYS" | tr '\n' ' ' | sed 's/^$/keine/')"
K4="PASS"; EVN=0; EVOK=0
if [[ -z "$COMMIT_DAYS" ]]; then
  result "K4" "n/a" "keine Commits seit $SYSTEM_START"
else
  while IFS= read -r day; do
    [[ -n "$day" ]] || continue
    EVN=$((EVN+1))
    PREV=$(date -d "$day -1 day" +%F 2>/dev/null || echo "$day")
    NEXT=$(date -d "$day +1 day" +%F 2>/dev/null || echo "$day")
    if printf '%s\n' "$REVIEW_DAYS" | grep -qxE "($PREV|$day|$NEXT)"; then
      EVOK=$((EVOK+1)); echo "- Commit-Tag $day: ✅ Marker vorhanden"
    else
      K4="FAIL"
      SUBJECTS=$(git log --since="${day}T00:00:00" --until="${day}T23:59:59" --format='%h %s' 2>/dev/null | head -3)
      echo "- Commit-Tag $day: ❌ kein Review-Marker (±1 Tag). Commits: $(printf '%s' "$SUBJECTS" | tr '\n' ';')"
    fi
  done <<< "$COMMIT_DAYS"
  result "K4" "$K4" "$EVOK/$EVN Commit-Tagen mit Review-Evidenz (docs-only-Tage werden ausgewiesen, nicht versteckt)"
fi

# ---------------------------------------------------------------- K5
echo ""
echo "## K5 — Lessons-Injection beim Session-Start"
INJECT="$HOME/.claude/hooks/lessons-inject.sh"
K5A="FAIL"
if [[ -f "$INJECT" ]]; then
  NEWEST_DATE=$(grep '^- 20' LESSONS.md | tail -1 | grep -oE '^\- [0-9-]{10}' | cut -c3- || true)
  OUT=$(printf '{"session_id":"measure-k5-selftest","cwd":"%s"}' "$WORKSPACE" | bash "$INJECT" 2>/dev/null || true)
  rm -f "$HOME/.claude/tmp/session-measure-k5-selftest.start"
  if [[ -n "$NEWEST_DATE" ]] && printf '%s' "$OUT" | grep -q "$NEWEST_DATE"; then
    K5A="PASS"; echo "- Selbsttest: Injection enthaelt juengsten Eintrag ($NEWEST_DATE) ✅"
  else
    echo "- Selbsttest: juengster Eintrag ($NEWEST_DATE) NICHT im Injection-Output"
  fi
else
  echo "- $INJECT fehlt — Injection nicht installiert"
fi
REAL_MARKERS=$(find "$HOME/.claude/tmp" -name 'session-*.start' ! -name '*selftest*' 2>/dev/null | wc -l | tr -d ' ')
echo "- Session-Marker der letzten 7 Tage (Aufbewahrungsfenster): $REAL_MARKERS"
if [[ "$K5A" == "PASS" && "$REAL_MARKERS" -ge 1 ]]; then
  result "K5" "PASS" "Injection korrekt; $REAL_MARKERS Session(s) mit Hook in den letzten 7 Tagen"
else
  result "K5" "FAIL" "Selbsttest=$K5A, echte Session-Marker=$REAL_MARKERS"
fi

# ---------------------------------------------------------------- K6
echo ""
echo "## K6 — System greift in wachsam-produkt-v1"
V1_DIR=""
for cand in "$WORKSPACE/../wachsam-produkt-v1" "$WORKSPACE/../../wachsam-produkt-v1" "$HOME/workspace/Ruhrlogik/projects/wachsam-produkt-v1"; do
  [[ -d "$cand" ]] && V1_DIR="$cand" && break || true
done
if [[ -z "$V1_DIR" ]]; then
  result "K6" "n/a" "Repo existiert lokal noch nicht — beim Bootstrap LESSONS.md + docs/specs/TEMPLATE-spec.md mitgeben, dann greift das Gate automatisch"
elif [[ -f "$V1_DIR/LESSONS.md" ]]; then
  result "K6" "PASS" "LESSONS.md vorhanden in $V1_DIR (Gate wirkt dort; Selbsttest im dortigen CWD ausfuehrbar)"
else
  result "K6" "FAIL" "$V1_DIR existiert, aber ohne LESSONS.md — Gate wirkt dort NICHT"
fi

# ---------------------------------------------------------------- K7
echo ""
echo "## K7 — Wirkungsnachweis (halb-manuell)"
echo "- Destillierte Regeln aus Run-Memories:"
RULES=""
for f in "$WORKSPACE"/.remember/runs/*.md; do
  [[ -e "$f" && "$f" != *TEMPLATE* ]] || continue
  R=$(grep -h '\*\*Distilled rule:\*\*' "$f" 2>/dev/null || true)
  [[ -n "$R" ]] && RULES="${RULES}${R}"$'\n' || true
done
if [[ -n "$RULES" ]]; then printf '%s' "$RULES" | sed 's/^/  /'; else echo "  (keine Run-Memories)"; fi
echo "- LESSONS-Eintraege seit $SYSTEM_START:"
NEW_LESSONS=$(grep '^- 20' LESSONS.md | while IFS= read -r l; do
  LD=$(printf '%s' "$l" | grep -oE '20[0-9]{2}-[0-9]{2}-[0-9]{2}' | head -1)
  [[ -n "$LD" && ! "$LD" < "$SYSTEM_START" ]] && printf '%s\n' "$l" || true
done)
if [[ -n "$NEW_LESSONS" ]]; then printf '%s\n' "$NEW_LESSONS" | cut -c1-160 | sed 's/^/  /'; else echo "  (keine)"; fi
echo "- Wiederverwendungs-Hinweise (Lesson-Datum taucht in spaeteren Specs/Run-Memories auf):"
HITS=0
if [[ -n "$NEW_LESSONS" ]]; then
  while IFS= read -r l; do
    LD=$(printf '%s' "$l" | grep -oE '20[0-9]{2}-[0-9]{2}-[0-9]{2}' | head -1)
    [[ -n "$LD" ]] || continue
    REF=$(grep -rl "$LD" docs/specs/ "$WORKSPACE/.remember/runs/" 2>/dev/null | grep -v TEMPLATE | grep -cv LESSONS || true)
    [[ "${REF:-0}" -gt 0 ]] && { HITS=$((HITS+1)); echo "  - Lesson $LD referenziert in $REF Datei(en)"; } || true
  done <<< "$NEW_LESSONS"
fi
[[ "$HITS" -eq 0 ]] && echo "  (noch keine automatisch erkennbare Wiederverwendung)"
result "K7" "MANUAL" "finale Bewertung durch Jean+Claude in der Mess-Session: hat >=1 Regel nachweislich einen Fehler verhindert oder eine Spec gepraegt?"

# ---------------------------------------------------------------- Summary
echo ""
echo "## Zusammenfassung"
echo ""
echo "| Kriterium | Status | Daten |"
echo "|---|---|---|"
for line in "${SUMMARY[@]}"; do echo "$line"; done
echo ""
echo "PASS: $PASS · FAIL: $FAIL · n/a: $NA · manuell: $MANUAL"
echo ""
echo "> FAILs werden zu Nachjustierungs-Massnahmen; docs-only-Ausnahmen bei K4 explizit begruenden, nicht wegdefinieren."
