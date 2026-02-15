# EasyClaw E2E Testing

End-to-end integration tests for the EasyClaw Electron desktop app, powered by [Playwright](https://playwright.dev/docs/api/class-electron).

## Architecture

```
e2e/
├── playwright.config.ts   # Playwright config (timeouts, workers, reporter)
├── electron-fixture.ts    # Custom test fixture — launches Electron in dev or prod mode
├── global-setup.ts        # Kills stale EasyClaw processes before each run
├── smoke.spec.ts          # Smoke tests (add more *.spec.ts files as needed)
├── package.json           # { "type": "commonjs" } override for Playwright compatibility
└── README.md              # This file
```

The same test suite runs against **two modes**:

| Mode | What it launches | When to use |
|------|-----------------|-------------|
| **Dev** | `node_modules/.../Electron` + `dist/main.cjs` | Before packaging — validates compiled code |
| **Prod** | Packaged `EasyClaw.app` or `EasyClaw.exe` | After packaging — validates the installer build |

## Prerequisites

1. **Build all packages** (from repo root):
   ```bash
   pnpm run build
   ```
   This compiles all workspace packages and the panel UI. The Electron app serves the built panel from disk, so it must be built first.

2. **Dependencies** are already declared in `apps/desktop/package.json`:
   - `@playwright/test` — test runner
   - `playwright` — core library with `_electron` API

   No browser download is needed. Playwright talks to Electron directly via CDP.

## Running Tests

All commands run from `apps/desktop/`.

### Dev mode (before packaging)

```bash
pnpm run test:e2e:dev
```

This launches the Electron binary from `node_modules` with `dist/main.cjs` as the entry point. It tests the same code path as `pnpm run dev`, minus the Vite dev server.

### Prod mode (after packaging)

```bash
# Step 1: Package the app
pnpm run pack

# Step 2: Run tests against the packaged binary
# macOS (arm64):
E2E_EXECUTABLE_PATH=release/mac-arm64/EasyClaw.app/Contents/MacOS/EasyClaw \
  pnpm run test:e2e:prod

# macOS (universal/x64):
E2E_EXECUTABLE_PATH=release/mac/EasyClaw.app/Contents/MacOS/EasyClaw \
  pnpm run test:e2e:prod

# Windows:
E2E_EXECUTABLE_PATH=release/win-unpacked/EasyClaw.exe \
  pnpm run test:e2e:prod
```

### Full release pipeline

The `scripts/release-local.sh` script automates the entire flow:

```bash
# From repo root:
./scripts/release-local.sh 1.2.9

# Pipeline:
#   1. pnpm run build          — compile all packages
#   2. pnpm run test           — unit tests (vitest)
#   3. test:e2e:dev            — e2e against dev build
#   4. pnpm run pack           — electron-builder --dir
#   5. test:e2e:prod           — e2e against packaged app (auto-detects path)
#   6. dist:mac / dist:win     — create distributable installers
#   7. gh release upload       — upload to GitHub Release (draft)

# Flags:
./scripts/release-local.sh 1.2.9 --skip-tests    # skip unit + e2e, build only
./scripts/release-local.sh 1.2.9 --skip-upload   # skip GitHub upload
```

## How the Fixture Works

`electron-fixture.ts` exports a custom Playwright `test` object with two fixtures:

### `electronApp`

Launches the Electron application. Mode is controlled by environment variables:

- **Dev mode** (default): Uses `require("electron")` to resolve the binary path, then launches with `dist/main.cjs` as the argument.
- **Prod mode** (`E2E_PROD=1`): Uses `E2E_EXECUTABLE_PATH` as the binary.

Both modes:
- Pass `--lang=en` to force English locale (so text assertions work on any system).
- Strip `ELECTRON_RUN_AS_NODE` from the environment (this variable is set by VS Code / Claude Code terminals and would cause Electron to run as plain Node.js instead of a browser).
- Call `app.close()` in teardown to release the single-instance lock.

### `window`

Waits for the app to be fully ready:

1. `electronApp.firstWindow()` — waits for the BrowserWindow to be created.
2. `waitForLoadState("domcontentloaded")` — waits for the page to load.
3. `waitForSelector(".sidebar-brand")` — waits up to 45 seconds for the React panel to render. This selector only appears after the gateway process starts and the panel URL is loaded, so it serves as the "app is ready" signal.

## Writing New Tests

### Basic structure

```typescript
import { test, expect } from "./electron-fixture.js";

test("description of what you're testing", async ({ window }) => {
  // `window` is a Playwright Page — use locators and assertions
  const element = window.locator(".some-css-class");
  await expect(element).toBeVisible();
});
```

### Available fixtures

| Fixture | Type | Use for |
|---------|------|---------|
| `window` | `Page` | UI interactions — click, type, assert elements |
| `electronApp` | `ElectronApplication` | Main process — evaluate BrowserWindow, app APIs |

### Examples

```typescript
// Navigate to a page and verify content
test("rules page shows section card", async ({ window }) => {
  // Dismiss any blocking modal first
  const backdrop = window.locator(".modal-backdrop");
  if (await backdrop.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await backdrop.click({ position: { x: 5, y: 5 } });
    await backdrop.waitFor({ state: "hidden", timeout: 3_000 });
  }

  await window.locator(".nav-btn", { hasText: "Rules" }).click();
  await expect(window.locator(".section-card")).toBeVisible();
});

// Check a main-process property
test("app version matches package.json", async ({ electronApp }) => {
  const version = await electronApp.evaluate(({ app }) => app.getVersion());
  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
});
```

### Organizing tests

Add new `*.spec.ts` files in this directory. Playwright auto-discovers them:

```
e2e/
├── smoke.spec.ts       # Launch, sidebar, navigation
├── providers.spec.ts   # Provider setup flows
├── rules.spec.ts       # Rule CRUD operations
└── settings.spec.ts    # Settings page interactions
```

All spec files should import from `./electron-fixture.js`.

### Tips

- **Workers = 1**: The app enforces a single-instance lock, so tests run serially. Don't try to parallelize.
- **Timeout = 60s per test**: The gateway takes a few seconds to start. If you add tests that trigger slow operations, increase the timeout with `test.setTimeout(90_000)`.
- **Modals**: The app may show modals (What's New, telemetry consent) that block clicks. Dismiss them before interacting with the UI behind them.
- **CSS selectors**: Use class names from `apps/panel/src/styles.css` and `apps/panel/src/layout/Layout.tsx`. Key selectors:
  - `.sidebar-brand`, `.sidebar-brand-text` — brand/logo area
  - `.nav-list .nav-btn` — navigation buttons
  - `.nav-active` — currently active nav button
  - `.nav-label` — text label inside nav button
  - `.section-card` — content cards on pages
  - `.modal-backdrop` — modal overlay (click to dismiss)

## Troubleshooting

### "Process failed to launch!"

Check if `ELECTRON_RUN_AS_NODE` is set in your terminal:
```bash
echo $ELECTRON_RUN_AS_NODE
```
If it's `1`, unset it before running tests:
```bash
ELECTRON_RUN_AS_NODE= pnpm run test:e2e:dev
```
The fixture already strips this variable, but the Playwright runner itself may be affected if it's set in the parent shell.

### Tests hang or time out at "waiting for .sidebar-brand"

The gateway process failed to start, so the panel never loads. Check:
- Is another EasyClaw instance already running? (`pkill -x EasyClaw`)
- Are vendor dependencies present? (`ls vendor/openclaw/openclaw.mjs`)
- Run `pnpm run dev` manually to see if the app starts at all.

### "No EasyClaw.app found" in prod mode

Run `pnpm run pack` first. The packaged app is written to `release/`. The directory name depends on your architecture (e.g., `mac-arm64`, `mac`, `win-unpacked`).
