import { test, expect } from "./electron-fixture.js";

test.describe("EasyClaw Smoke Tests", () => {
  test("app launches and window is visible", async ({ electronApp, window }) => {
    const windows = electronApp.windows();
    expect(windows.length).toBe(1);

    const title = await window.title();
    expect(title).toBe("EasyClaw");
  });

  test("panel renders with sidebar navigation", async ({ window }) => {
    const brand = window.locator(".sidebar-brand-text");
    await expect(brand).toBeVisible();

    const navItems = window.locator(".nav-list .nav-btn");
    const count = await navItems.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test("chat page is the default view", async ({ window }) => {
    const firstNav = window.locator(".nav-list .nav-btn").first();
    await expect(firstNav).toHaveClass(/nav-active/);
  });

  test("can navigate to Providers page", async ({ window }) => {
    // Dismiss any modal (e.g. "What's New", telemetry consent) blocking the UI
    const backdrop = window.locator(".modal-backdrop");
    if (await backdrop.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await backdrop.click({ position: { x: 5, y: 5 } });
      await backdrop.waitFor({ state: "hidden", timeout: 3_000 });
    }

    const providersBtn = window.locator(".nav-btn", { hasText: "LLM Providers" });
    await providersBtn.click();
    await expect(providersBtn).toHaveClass(/nav-active/);
  });

  test("window has correct web preferences", async ({ electronApp }) => {
    const prefs = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      const wp = win?.webContents.getLastWebPreferences();
      return {
        nodeIntegration: wp?.nodeIntegration,
        contextIsolation: wp?.contextIsolation,
      };
    });
    expect(prefs.nodeIntegration).toBe(false);
    expect(prefs.contextIsolation).toBe(true);
  });
});
