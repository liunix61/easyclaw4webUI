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

  test("chat page is default and gateway connects", async ({ window }) => {
    // Chat should be the active nav item by default
    const firstNav = window.locator(".nav-list .nav-btn").first();
    await expect(firstNav).toHaveClass(/nav-active/);

    // Wait for gateway to reach "Connected" state
    const connectedDot = window.locator(".chat-status-dot-connected");
    await expect(connectedDot).toBeVisible({ timeout: 30_000 });

    // Verify connection stays stable for 3 seconds
    await window.waitForTimeout(3_000);
    await expect(connectedDot).toBeVisible();
  });

  test("LLM Providers page: dropdowns and pricing", async ({ window }) => {
    // Dismiss any modal(s) blocking the UI (e.g. "What's New", telemetry consent).
    // Prod builds may show modals that dev builds skip. Try up to 3 times.
    for (let i = 0; i < 3; i++) {
      const backdrop = window.locator(".modal-backdrop");
      if (!await backdrop.isVisible({ timeout: 3_000 }).catch(() => false)) break;
      // Click the top-left corner of the backdrop (outside modal-content) to trigger onClose
      await backdrop.click({ position: { x: 5, y: 5 }, force: true });
      await backdrop.waitFor({ state: "hidden", timeout: 3_000 }).catch(() => {});
    }

    // Navigate to LLM Providers page
    const providersBtn = window.locator(".nav-btn", { hasText: "LLM Providers" });
    await providersBtn.click();
    await expect(providersBtn).toHaveClass(/nav-active/);

    // -- Subscription tab (default) --
    const subTab = window.locator(".tab-btn", { hasText: /Subscription/i });
    await expect(subTab).toHaveClass(/tab-btn-active/);

    // Subscription dropdown: 3 in models.ts, but ProviderSelect filters by
    // model catalog from gateway — at least 2 are always present.
    await window.locator(".provider-select-trigger").click();
    const subOptions = window.locator(".provider-select-option");
    const subCount = await subOptions.count();
    expect(subCount).toBeGreaterThanOrEqual(2);
    expect(subCount).toBeLessThanOrEqual(3);
    // Close dropdown
    await window.locator(".provider-select-trigger").click();

    // Subscription pricing table should be visible and have content
    const subPricing = window.locator(".pricing-card");
    await expect(subPricing).toBeVisible();
    const subPricingContent = subPricing.locator(".pricing-plan-block, .pricing-inner-table");
    await expect(subPricingContent.first()).toBeVisible({ timeout: 10_000 });

    // -- Switch to API Key tab --
    const apiTab = window.locator(".tab-btn", { hasText: /API/i });
    await apiTab.click();
    await expect(apiTab).toHaveClass(/tab-btn-active/);

    // API Key dropdown: 18 in models.ts (!oauth), filtered by catalog.
    // At least 10 should always be present.
    await window.locator(".provider-select-trigger").click();
    const apiOptions = window.locator(".provider-select-option");
    const apiCount = await apiOptions.count();
    expect(apiCount).toBeGreaterThanOrEqual(10);
    expect(apiCount).toBeLessThanOrEqual(18);
    // Close dropdown
    await window.locator(".provider-select-trigger").click();

    // API pricing table should be visible and have content
    const apiPricing = window.locator(".pricing-card");
    await expect(apiPricing).toBeVisible();
    const apiTable = apiPricing.locator(".pricing-inner-table");
    await expect(apiTable).toBeVisible({ timeout: 10_000 });
  });

  test("add second key and switch active provider", async ({ window }) => {
    const zhipuKey = process.env.E2E_ZHIPU_API_KEY;
    const volcengineKey = process.env.E2E_VOLCENGINE_API_KEY;
    test.skip(!zhipuKey || !volcengineKey, "E2E_ZHIPU_API_KEY and E2E_VOLCENGINE_API_KEY required");

    // Dismiss modals
    for (let i = 0; i < 3; i++) {
      const backdrop = window.locator(".modal-backdrop");
      if (!await backdrop.isVisible({ timeout: 3_000 }).catch(() => false)) break;
      await backdrop.click({ position: { x: 5, y: 5 }, force: true });
      await backdrop.waitFor({ state: "hidden", timeout: 3_000 }).catch(() => {});
    }

    // Navigate to LLM Providers page
    const providersBtn = window.locator(".nav-btn", { hasText: "LLM Providers" });
    await providersBtn.click();
    await expect(providersBtn).toHaveClass(/nav-active/);

    // Verify pre-seeded volcengine key is active
    const keyCards = window.locator(".key-card");
    await expect(keyCards).toHaveCount(1);
    await expect(keyCards.first()).toHaveClass(/key-card-active/);

    // -- Add GLM key via the "Add Key" form --
    const form = window.locator(".page-two-col");

    // Switch to API tab
    await form.locator(".tab-btn", { hasText: /API/i }).click();

    // Select Zhipu (GLM)
    await form.locator(".provider-select-trigger").click();
    await form.locator(".provider-select-option", { hasText: /Zhipu \(GLM\) - China/i }).click();

    // Select GLM-4.7-Flash model
    await form.locator(".custom-select-trigger").click();
    await window.locator(".custom-select-option", { hasText: /GLM-4\.7-Flash/i }).click();

    // Enter API key and save
    await form.locator("input[type='password']").fill(zhipuKey!);
    await form.locator(".form-actions .btn.btn-primary").click();

    // Wait for validation + save, then verify both keys appear
    await expect(keyCards).toHaveCount(2, { timeout: 30_000 });

    const volcengineCard = window.locator(".key-card", { hasText: /Volcengine/i });
    const zhipuCard = window.locator(".key-card", { hasText: /Zhipu/i });
    await expect(volcengineCard).toHaveClass(/key-card-active/);
    await expect(zhipuCard).toHaveClass(/key-card-inactive/);

    // -- Activate the GLM key --
    await zhipuCard.locator(".btn", { hasText: /Activate/i }).click();

    // Verify GLM is now active and volcengine is inactive
    await expect(zhipuCard).toHaveClass(/key-card-active/, { timeout: 10_000 });
    await expect(volcengineCard).toHaveClass(/key-card-inactive/);
    await expect(zhipuCard.locator(".badge-active")).toBeVisible();
  });

  test("window has correct web preferences", async ({ electronApp, window }) => {
    // Ensure window is created before evaluating
    await expect(window).toBeTruthy();

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
