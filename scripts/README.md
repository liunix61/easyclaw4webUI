# Scripts

## rebuild-native.sh

Builds `better-sqlite3` for both Node.js and Electron, enabling both runtimes to coexist.

### The problem

`better-sqlite3` is a C++ native addon compiled against a specific ABI (Application Binary Interface). Node.js and Electron have different ABIs (e.g. Node.js v24 = ABI 141, Electron v40 = ABI 143). A binary compiled for one runtime crashes when loaded by the other.

By default, the compiled binary lives in `build/Release/better_sqlite3.node`. The `bindings` package always checks `build/Release/` first. When `electron-rebuild` runs (e.g. via `electron-builder pack`), it overwrites this file with an Electron-ABI binary, breaking Node.js consumers like `vitest`.

### The solution

`rebuild-native.sh` compiles `better-sqlite3` twice and places each binary in an ABI-specific directory:

```
node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3/
  lib/binding/
    node-v141-darwin-arm64/better_sqlite3.node   # Node.js
    node-v143-darwin-arm64/better_sqlite3.node   # Electron
```

It then **deletes `build/`** so `bindings` falls through to `lib/binding/`, where it auto-selects the correct binary based on the runtime's ABI version.

### When it runs

- **Automatically** after `pnpm install` via the root `postinstall` hook.
- **Manually** if you suspect the binaries are stale: `./scripts/rebuild-native.sh`
- **With `--force`** to skip the "already exists" check: `./scripts/rebuild-native.sh --force`

The script has a fast-path: if both prebuilds exist and `build/` is absent, it exits immediately.

### What creates `build/` and breaks things?

Only two operations re-create `build/Release/` with an Electron-ABI binary:

| Operation | Where | Handled? |
|-----------|-------|----------|
| `electron-builder --dir` (pack) | `release-local.sh` Step 6 | Yes — `rebuild-native.sh` runs after |
| `electron-builder --mac/--win` (dist) | `release-local.sh` Step 8 | Yes — `rebuild-native.sh` runs at end |

The `dev` script does **not** run `electron-rebuild`. It relies on the prebuilds from `postinstall`.

### Rules

- **Do NOT run `electron-rebuild` manually** in the source tree — it creates `build/` and breaks Node.js.
- **Do NOT delete `lib/binding/`** — it contains the dual prebuilds that make coexistence work.
- If unit tests fail with `Cannot read properties of undefined (reading 'close')` or ABI mismatch errors, run `./scripts/rebuild-native.sh`.
