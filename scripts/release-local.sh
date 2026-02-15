#!/usr/bin/env bash
# =============================================================================
# release-local.sh — Build, test (e2e), and upload release to GitHub
#
# Usage:
#   ./scripts/release-local.sh [version] [--skip-tests] [--skip-upload]
#
# Examples:
#   ./scripts/release-local.sh 1.2.8          # full pipeline
#   ./scripts/release-local.sh --skip-tests   # build + upload only
#   ./scripts/release-local.sh --skip-upload  # build + test, no upload
#
# Pipeline:
#   1. pnpm run build            — build all workspace packages
#   2. pnpm run test             — unit tests (vitest via turbo)
#   3. pnpm run pack             — electron-builder --dir (unpacked app)
#   4. test:e2e:prod             — Playwright e2e against packed app
#   5. dist:mac / dist:win       — create distributable installers
#   6. gh release upload         — upload artifacts to GitHub Release
#   7. restore native modules    — rebuild better-sqlite3 for Node.js
#
# Native module strategy:
#   better-sqlite3 is always kept compiled for Node.js (the newer ABI).
#   electron-builder handles Electron-compatible compilation internally
#   during pack/dist (into the output directory). E2E tests run against
#   the packed app which has its own copy. After the pipeline finishes,
#   we restore better-sqlite3 for Node.js so unit tests and git hooks
#   continue to work.
# =============================================================================
set -euo pipefail

# Electron must NOT run as Node — unset this in case the parent shell sets it
# (e.g. VS Code integrated terminal, Claude Code).
unset ELECTRON_RUN_AS_NODE

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESKTOP_DIR="$REPO_ROOT/apps/desktop"
RELEASE_DIR="$DESKTOP_DIR/release"

# ---- Helpers ----
info()  { echo "$(date +%H:%M:%S) [INFO]  $*"; }
warn()  { echo "$(date +%H:%M:%S) [WARN]  $*" >&2; }
error() { echo "$(date +%H:%M:%S) [ERROR] $*" >&2; exit 1; }
step()  { echo ""; echo "========================================"; echo "  STEP: $*"; echo "========================================"; }

# ---- Parse arguments ----
SKIP_TESTS=false
SKIP_UPLOAD=false
VERSION=""

for arg in "$@"; do
  case "$arg" in
    --skip-tests)  SKIP_TESTS=true ;;
    --skip-upload) SKIP_UPLOAD=true ;;
    *)             VERSION="$arg" ;;
  esac
done

if [ -z "$VERSION" ]; then
  VERSION=$(node -e "console.log(require('$DESKTOP_DIR/package.json').version)")
fi
[ "$VERSION" = "0.0.0" ] && error "Version is 0.0.0. Pass a version: ./scripts/release-local.sh 1.2.8"

info "Release pipeline for EasyClaw v$VERSION"
info "Platform: $(uname -s) ($(uname -m))"

# ---- Determine platform ----
case "$(uname -s)" in
  Darwin)       PLATFORM="mac" ;;
  MINGW*|MSYS*) PLATFORM="win" ;;
  *)            PLATFORM="linux" ;;
esac

# ---- Step 1: Build all packages ----
step "Build all workspace packages"
(cd "$REPO_ROOT" && pnpm run build)
info "Build complete."

# ---- Step 2: Unit tests ----
if [ "$SKIP_TESTS" = false ]; then
  step "Run unit tests"
  (cd "$REPO_ROOT" && pnpm run test)
  info "Unit tests passed."
fi

# ---- Step 3: Pack (unpacked app for prod e2e) ----
# electron-builder internally runs electron-rebuild for the packed output.
step "Pack application (electron-builder --dir)"
(cd "$DESKTOP_DIR" && pnpm run pack)
info "Pack complete."

# ---- Step 4: E2E tests (prod mode) ----
if [ "$SKIP_TESTS" = false ]; then
  step "Run E2E tests (prod mode)"

  EXEC_PATH=""
  if [ "$PLATFORM" = "mac" ]; then
    APP_DIR=$(find "$RELEASE_DIR" -maxdepth 2 -name "EasyClaw.app" -print -quit 2>/dev/null || true)
    [ -z "$APP_DIR" ] && error "No EasyClaw.app found in $RELEASE_DIR after pack"
    EXEC_PATH="$APP_DIR/Contents/MacOS/EasyClaw"
  elif [ "$PLATFORM" = "win" ]; then
    EXEC_PATH=$(find "$RELEASE_DIR" -maxdepth 2 -name "EasyClaw.exe" -not -path "*Setup*" -print -quit 2>/dev/null || true)
    [ -z "$EXEC_PATH" ] && error "No EasyClaw.exe found in $RELEASE_DIR after pack"
  else
    warn "Prod E2E not supported on $PLATFORM, skipping."
  fi

  if [ -n "$EXEC_PATH" ]; then
    info "Launching prod E2E with: $EXEC_PATH"
    (cd "$DESKTOP_DIR" && E2E_EXECUTABLE_PATH="$EXEC_PATH" pnpm run test:e2e:prod)
    info "E2E prod tests passed."
  fi
fi

# ---- Step 5: Build distributable installers ----
step "Build distributable installers"
if [ "$PLATFORM" = "mac" ]; then
  (cd "$DESKTOP_DIR" && pnpm run dist:mac)
  info "macOS DMG + ZIP built."
elif [ "$PLATFORM" = "win" ]; then
  (cd "$DESKTOP_DIR" && pnpm run dist:win)
  info "Windows NSIS installer built."
else
  warn "No dist target for platform $PLATFORM"
fi

# ---- Step 6: Upload to GitHub Release ----
if [ "$SKIP_UPLOAD" = true ]; then
  info "Skipping upload (--skip-upload flag)."
else
  step "Upload to GitHub Release v$VERSION"

  command -v gh &>/dev/null || error "gh CLI not found. Install: https://cli.github.com/"
  gh auth status || error "gh not authenticated. Run: gh auth login"

  TAG="v$VERSION"

  if ! gh release view "$TAG" &>/dev/null; then
    info "Creating draft release $TAG ..."
    gh release create "$TAG" --title "EasyClaw $TAG" --notes "Release $TAG" --draft
    info "Draft release $TAG created."
  fi

  ARTIFACTS=()
  while IFS= read -r -d '' file; do
    ARTIFACTS+=("$file")
  done < <(find "$RELEASE_DIR" -maxdepth 1 \( -name "*.dmg" -o -name "*.zip" -o -name "*Setup*.exe" \) -print0 2>/dev/null)

  if [ ${#ARTIFACTS[@]} -eq 0 ]; then
    warn "No artifacts found in $RELEASE_DIR to upload."
  else
    for artifact in "${ARTIFACTS[@]}"; do
      info "Uploading: $(basename "$artifact")"
      gh release upload "$TAG" "$artifact" --clobber
    done
    info "All artifacts uploaded to release $TAG."
  fi
fi

# ---- Step 7: Restore native modules for Node.js ----
# electron-builder's internal electron-rebuild modifies node_modules in-place.
# Restore better-sqlite3 for Node.js so unit tests and git hooks keep working.
step "Restore native modules for Node.js"
SQLITE_DIR="$REPO_ROOT/node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3"
# shellcheck disable=SC2086
rm -rf $SQLITE_DIR/build
(cd $SQLITE_DIR && npx node-gyp rebuild --release 2>&1 | tail -3)
info "Native modules restored for Node.js."

# ---- Done ----
echo ""
info "==============================================="
info "  Release pipeline v$VERSION complete!"
info ""
info "  Artifacts: $RELEASE_DIR/"
if [ "$SKIP_UPLOAD" = false ]; then
  info "  Review and publish the draft release on GitHub."
fi
info "==============================================="
