import { test, expect } from "@playwright/test";

test.describe("Visual Regression", () => {
  test("create page - dark mode - empty", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/create");
    await expect(page).toHaveScreenshot("create-dark-empty.png", {
      fullPage: true,
    });
  });

  test("create page - light mode - empty", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/create");
    await page.evaluate(() => {
      document.documentElement.classList.add("light");
    });
    await expect(page).toHaveScreenshot("create-light-empty.png", {
      fullPage: true,
    });
  });

  test("create page - dark mode - enhanced", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/create");
    
    // Fill prompt and enhance
    await page.fill('textarea[placeholder*="Describe the music"]', "ambient electronic track");
    await page.click('button:has-text("Enhance")');
    await page.waitForTimeout(500); // Wait for enhancement
    
    await expect(page).toHaveScreenshot("create-dark-enhanced.png", {
      fullPage: true,
    });
  });

  test("share page - with cover", async ({ page }) => {
    // Assuming track ID 1 exists or mocking
    await page.goto("/share/1");
    await page.waitForSelector('img[alt*="cover"]', { timeout: 5000 }).catch(() => {});
    await expect(page).toHaveScreenshot("share-with-cover.png", {
      fullPage: true,
    });
  });

  test("macro panel - collapsed", async ({ page }) => {
    await page.goto("/create");
    // Wait for macro panel to render (if it exists)
    await page.waitForTimeout(1000);
    const macroPanel = page.locator('[data-testid="macro-panel"]').first();
    if (await macroPanel.count() > 0) {
      await expect(macroPanel).toHaveScreenshot("macro-panel-collapsed.png");
    }
  });

  test("macro panel - expanded", async ({ page }) => {
    await page.goto("/create");
    await page.waitForTimeout(1000);
    const macroPanel = page.locator('[data-testid="macro-panel"]').first();
    const expandButton = page.locator('[data-testid="macro-panel-toggle"]').first();
    
    if (await macroPanel.count() > 0 && await expandButton.count() > 0) {
      await expandButton.click();
      await page.waitForTimeout(300);
      await expect(macroPanel).toHaveScreenshot("macro-panel-expanded.png");
    }
  });
});

