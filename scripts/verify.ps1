$ErrorActionPreference = "Stop"

function Fail($Message) {
  Write-Error $Message
  exit 1
}

if (-not (Test-Path ".git")) {
  Fail "Not a git repository."
}

$markdownFiles = Get-ChildItem -Recurse -File -Include "*.md" |
  Where-Object { $_.FullName -notmatch "\\.git\\" }

if ($markdownFiles.Count -eq 0) {
  Fail "No Markdown documentation found."
}

$blockedOutputFiles = Get-ChildItem -Path "outputs" -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -in ".html", ".json", ".csv", ".sqlite", ".db" }

if ($blockedOutputFiles.Count -gt 0) {
  $blockedOutputFiles | ForEach-Object { Write-Error "Blocked output artifact: $($_.FullName)" }
  exit 1
}

$secretPattern = "(?i)(api[_-]?key|secret|token|password|passwd|private[_-]?key)\s*[:=]\s*['""]?[A-Za-z0-9_\-]{16,}"
$textFiles = Get-ChildItem -Recurse -File |
  Where-Object {
    $_.FullName -notmatch "\\.git\\" -and
    $_.FullName -notmatch "\\node_modules\\" -and
    $_.Extension -in ".md", ".txt", ".yml", ".yaml", ".json", ".ps1", ".sh", ".env", ".example"
  }

foreach ($file in $textFiles) {
  $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction SilentlyContinue
  if ($content -match $secretPattern) {
    Fail "Possible secret pattern in $($file.FullName)"
  }
}

git diff --check
if ($LASTEXITCODE -ne 0) {
  Fail "git diff --check failed."
}

Write-Host "verify: PASS"

