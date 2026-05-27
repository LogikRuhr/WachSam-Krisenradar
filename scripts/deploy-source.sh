#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "deploy-source: FAIL - $1" >&2
  exit 1
}

REPO_URL="${REPO_URL:-https://github.com/LogikRuhr/WachSam-Krisenradar.git}"
TARGET_DIR="${TARGET_DIR:-/opt/wachsam/source}"
EXPECTED_SHA="${EXPECTED_SHA:-}"

test -n "$EXPECTED_SHA" || fail "EXPECTED_SHA is required"
command -v git >/dev/null 2>&1 || fail "git is required"
command -v bash >/dev/null 2>&1 || fail "bash is required"

mkdir -p "$(dirname "$TARGET_DIR")"

if [ -d "$TARGET_DIR/.git" ]; then
  git -C "$TARGET_DIR" remote set-url origin "$REPO_URL"
  git -C "$TARGET_DIR" fetch --prune origin main
else
  if [ -e "$TARGET_DIR" ] && [ "$(find "$TARGET_DIR" -mindepth 1 -print -quit 2>/dev/null)" ]; then
    fail "$TARGET_DIR exists and is not an empty git repository"
  fi
  git clone "$REPO_URL" "$TARGET_DIR"
  git -C "$TARGET_DIR" fetch --prune origin main
fi

git -C "$TARGET_DIR" checkout --detach "$EXPECTED_SHA"

actual_sha="$(git -C "$TARGET_DIR" rev-parse HEAD)"
if [ "$actual_sha" != "$EXPECTED_SHA" ]; then
  fail "checked out $actual_sha, expected $EXPECTED_SHA"
fi

bash "$TARGET_DIR/scripts/verify.sh"

cat > "$TARGET_DIR/.deploy-state" <<EOF
sha=$actual_sha
target=$TARGET_DIR
deployed_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

echo "deploy-source: PASS $actual_sha -> $TARGET_DIR"

