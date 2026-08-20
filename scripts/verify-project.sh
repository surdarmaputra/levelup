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

# The vendored prd-to-rfc skill was patched to remove the org it was written in.
# `install-remote.sh --update` overwrites the whole skill and brings those lines
# back; this catches that. See .claude/skills/README.md.
info "Checking for org-specific content in skills..."
# Scope is the vendored skill content only. README.md is excluded because it
# documents the patch and has to name the terms it removed.
ORG_TERMS='lending engineering|cash-loans|MGR Pinjam|Monetisation Devs|gotocompany'
if grep -rilE "$ORG_TERMS" .claude/skills --exclude=README.md 2>/dev/null | grep .; then
  fail "org-specific content found in the skills listed above — re-apply the patch in .claude/skills/README.md"
fi
ok "no org-specific content in skills"

echo ""
echo -e "${BOLD}Green.${RESET} Safe to push."
echo ""
