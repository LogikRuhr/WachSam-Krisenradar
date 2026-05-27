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

while IFS= read -r file; do
  if grep -Eiq "$secret_pattern" "$file"; then
    fail "possible secret pattern in $file"
  fi
done < <(
  find . \
    -path ./.git -prune -o \
    -path ./node_modules -prune -o \
    -type f \( \
      -name '*.md' -o -name '*.txt' -o -name '*.yml' -o -name '*.yaml' -o \
      -name '*.json' -o -name '*.ps1' -o -name '*.sh' -o -name '.env*' \
    \) -print
)

git diff --check

echo "verify: PASS"

