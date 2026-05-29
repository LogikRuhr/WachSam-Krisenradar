#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "verify: FAIL - $1" >&2
  exit 1
}

test -d .git || fail "not a git repository"

if ! find . -path ./.git -prune -o -name '*.md' -type f -print -quit | grep -q .; then
  fail "no Markdown documentation found"
fi

if find outputs -type f \( -name '*.html' -o -name '*.json' -o -name '*.csv' -o -name '*.sqlite' -o -name '*.db' \) -print -quit 2>/dev/null | grep -q .; then
  fail "blocked generated artifact found in outputs"
fi

secret_pattern='(api[_-]?key|secret|token|password|passwd|private[_-]?key)[[:space:]]*[:=][[:space:]]*["'\'']?[A-Za-z0-9_-]{16,}'
secret_pathspecs=(
  '*.md'
  '*.txt'
  '*.yml'
  '*.yaml'
  '*.json'
  '*.ps1'
  '*.sh'
  '.env*'
  ':(glob)**/.env*'
)

while IFS= read -r -d '' file; do
  if grep -Eiq "$secret_pattern" "$file"; then
    fail "possible secret pattern in $file"
  fi
done < <(git ls-files -z -co --exclude-standard -- "${secret_pathspecs[@]}")

git diff --check

echo "verify: PASS"
