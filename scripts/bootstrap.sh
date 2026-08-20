#!/usr/bin/env bash
# bootstrap.sh — set up the dev environment for this repo.
# Idempotent: safe to run multiple times.
#
#   bash scripts/bootstrap.sh     (also runs automatically on Claude Code SessionStart)

set -euo pipefail

cd "$(dirname "$0")/.."

BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RESET='\033[0m'
ok()   { echo -e "  ${GREEN}✓${RESET}  $*"; }
info() { echo -e "  ${YELLOW}→${RESET}  $*"; }

echo ""
echo -e "${BOLD}## Bootstrap: levelup${RESET}"
echo ""

# ── 1. Node dependencies ─────────────────────────────────────────────────────

if [ -d node_modules ]; then
  ok "node_modules present"
else
  info "Installing dependencies..."
  npm ci --silent || npm install --silent
  ok "dependencies installed"
fi

# ── 2. Lefthook (pre-push verification) ──────────────────────────────────────

if command -v lefthook &>/dev/null; then
  ok "lefthook already installed"
else
  info "Installing lefthook..."
  if command -v brew &>/dev/null; then
    brew install lefthook -q && ok "lefthook installed via Homebrew"
  elif command -v npm &>/dev/null; then
    npm install -g @evilmartians/lefthook --silent && ok "lefthook installed via npm"
  else
    echo "  ⚠  Could not install lefthook. See https://github.com/evilmartians/lefthook#install"
  fi
fi

if command -v lefthook &>/dev/null; then
  lefthook install -f > /dev/null 2>&1 && ok "pre-push hook active (.git/hooks/pre-push)"
fi

echo ""
echo -e "${BOLD}Ready.${RESET}  npm run dev  ·  npm run verify"
echo ""
