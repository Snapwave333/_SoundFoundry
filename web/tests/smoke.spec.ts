import { test, expect } from "@playwright/test";

test.describe("SoundFoundry Smoke Tests", () => {
  test("create flow renders and form works", async ({ page }) => {
    await page.goto("http://localhost:3000/create");

    // Check page loads
    await expect(page.getByRole("heading", { name: /create music/i })).toBeVisible();

    // Fill in prompt
    const promptInput = page.getByLabel("Music generation prompt", { exact: false });
    await promptInput.fill("downtempo bass with airy pads");

    // Check duration slider exists
    const durationLabel = page.getByText(/duration:/i);
    await expect(durationLabel).toBeVisible();

    // Check style strength slider exists
    const styleLabel = page.getByText(/style influence:/i);
    await expect(styleLabel).toBeVisible();

    // Check generate button exists
    const generateButton = page.getByRole("button", { name: /generate music/i });
    await expect(generateButton).toBeVisible();
  });

  test("landing page renders", async ({ page }) => {
    await page.goto("http://localhost:3000/landing");

    // Check heading
    await expect(page.getByRole("heading", { name: /craft your sound/i })).toBeVisible();

    // Check CTAs
    await expect(page.getByRole("link", { name: /start creating/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /browse library/i })).toBeVisible();
  });

  test("library page renders", async ({ page }) => {
    await page.goto("http://localhost:3000/library");

    // Check heading
    await expect(page.getByRole("heading", { name: /library/i })).toBeVisible();

    // Check search input
    const searchInput = page.getByPlaceholder("Search tracks...");
    await expect(searchInput).toBeVisible();
  });

  test("settings page renders", async ({ page }) => {
    await page.goto("http://localhost:3000/settings");

    // Check heading
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();

    // Check credits section
    await expect(page.getByText(/credits/i)).toBeVisible();
  });
});

