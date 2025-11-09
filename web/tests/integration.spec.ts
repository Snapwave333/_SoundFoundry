import { test, expect } from "@playwright/test";

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://promptbloom.app";

test.describe("Marketing Pages", () => {
  test("homepage renders successfully", async ({ page }) => {
    await page.goto(baseUrl);
    await expect(page).toHaveTitle(/PromptBloom/);
    await expect(page.locator("h1")).toContainText("Craft Your Sound");
  });

  test("pricing page renders", async ({ page }) => {
    await page.goto(`${baseUrl}/pricing`);
    await expect(page).toHaveTitle(/Pricing/);
    await expect(page.locator("h1")).toContainText("Fair, Transparent Pricing");
  });

  test("about page renders", async ({ page }) => {
    await page.goto(`${baseUrl}/about`);
    await expect(page).toHaveTitle(/About/);
  });

  test("contact page renders", async ({ page }) => {
    await page.goto(`${baseUrl}/contact`);
    await expect(page).toHaveTitle(/Contact/);
  });
});

test.describe("Dashboard Authentication", () => {
  test("unauthenticated user redirected to login from /app", async ({ page }) => {
    await page.goto(`${baseUrl}/app`);
    // Should redirect to login page
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });

  test("unauthenticated user redirected to login from /app/create", async ({ page }) => {
    await page.goto(`${baseUrl}/app/create`);
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });

  test("unauthenticated user redirected to login from /app/library", async ({ page }) => {
    await page.goto(`${baseUrl}/app/library`);
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });
});

test.describe("SEO", () => {
  test("homepage has correct meta tags", async ({ page }) => {
    await page.goto(baseUrl);
    
    // Check title
    await expect(page).toHaveTitle(/PromptBloom/);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute("content", /.+/);
    
    // Check Open Graph image
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute("content", /social-card_1200x630\.png/);
  });

  test("robots.txt exists", async ({ page }) => {
    const response = await page.goto(`${baseUrl}/robots.txt`);
    expect(response?.status()).toBe(200);
    const content = await response?.text();
    expect(content).toContain("User-agent");
    expect(content).toContain("Sitemap");
  });

  test("sitemap.xml exists", async ({ page }) => {
    const response = await page.goto(`${baseUrl}/sitemap.xml`);
    expect(response?.status()).toBe(200);
    const content = await response?.text();
    expect(content).toContain("<?xml");
    expect(content).toContain(siteUrl);
  });
});

test.describe("Security Headers", () => {
  test("security headers are present", async ({ page }) => {
    const response = await page.goto(baseUrl);
    const headers = response?.headers();
    
    expect(headers?.["x-content-type-options"]).toBe("nosniff");
    expect(headers?.["x-frame-options"]).toBe("DENY");
    expect(headers?.["referrer-policy"]).toBe("no-referrer-when-downgrade");
  });
});

