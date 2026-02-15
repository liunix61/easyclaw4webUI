# CI/CD & Release

## Build & Release Strategy

Releases are built **locally** using `scripts/release-local.sh`, not via CI. GitHub Actions is used only for PR validation and as a fallback build environment.

### Local Release Pipeline (`scripts/release-local.sh`)

The primary release workflow. Runs on the developer's machine:

```
1. Prebuild native modules (rebuild-native.sh)
2. Build all workspace packages (pnpm run build)
3. Unit tests (pnpm run test)
4. E2E dev tests (Playwright against dev build)
5. Pack application (electron-builder --dir)
6. E2E prod tests (Playwright against packed app)
7. Build distributable installers (DMG/ZIP or NSIS)
8. Upload to GitHub Release (gh release upload)
9. Restore native prebuilds
```

Usage:
```bash
./scripts/release-local.sh 1.2.8          # full pipeline
./scripts/release-local.sh --skip-tests   # build + upload only
./scripts/release-local.sh --skip-upload  # build + test, no upload
```

## GitHub Actions Workflows

| File | Trigger | Purpose |
|------|---------|---------|
| `test-build.yml` | Push to `main` or PR | Verify builds compile on Windows + macOS (unsigned, no tests) |
| `build.yml` | Manual (`workflow_dispatch`) | Fallback: build + upload artifacts on CI (no auto-release) |

## File Structure

| File | Description |
|------|-------------|
| `RELEASE_BODY.md` | Template body appended to GitHub Releases |
| `SIGNPATH_SETUP.md` | Guide for free Windows code signing via SignPath Foundation |
| `CI_CD.md` | This file |

## Code Signing Status

| Platform | Signing | Status |
|----------|---------|--------|
| **macOS** | Apple Developer | Local signing configured |
| **Windows** | SignPath Foundation | Pending setup (see `SIGNPATH_SETUP.md`) |

## Vendor Pruning

`dist:mac` / `dist:win` scripts automatically prune `vendor/openclaw/node_modules` before packaging to reduce installer size.

After building locally, restore full deps for development:
```bash
cd vendor/openclaw && CI=true pnpm install --no-frozen-lockfile && cd ../..
```

## Troubleshooting

- **Native module errors**: Run `./scripts/rebuild-native.sh --force`
- **Build failures on CI**: Verify Node.js version matches (currently 25)
- **E2E test timeouts**: Ensure no stale EasyClaw processes are running
