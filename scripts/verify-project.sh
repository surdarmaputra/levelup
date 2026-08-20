#!/usr/bin/env bash
# verify-project.sh — the one command that says whether the repo is shippable.
#
# Runs: type/content check -> production build -> internal link check.
# Exit 0 means the site builds and every internal link resolves.
#
#   bash scripts/verify-project.sh
#
# Deploy target is configurable; defaults match astro.config.mjs (GitHub Pages).

set -euo pipefail

cd "$(dirname "$0")/.."

BASE_PATH="${BASE_PATH:-/levelup}"
export BASE_PATH

BOLD='\033[1m'; GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; RESET='\033[0m'
ok()   { echo -e "  ${GREEN}✓${RESET}  $*"; }
info() { echo -e "  ${YELLOW}→${RESET}  $*"; }
fail() { echo -e "  ${RED}✗${RESET}  $*"; exit 1; }

echo ""
echo -e "${BOLD}## Verify: levelup${RESET}"
echo ""

if [ ! -d node_modules ]; then
  info "Installing dependencies..."
  npm ci
fi

info "Checking types and content collections..."
npm run check --silent || fail "astro check failed"
ok "astro check clean"

info "Building the site (BASE_PATH=$BASE_PATH)..."
npm run build --silent > /dev/null || fail "build failed"
ok "build succeeded"

info "Checking internal links..."
node scripts/check-links.mjs || fail "broken internal links"

echo ""
echo -e "${BOLD}Green.${RESET} Safe to push."
echo ""
