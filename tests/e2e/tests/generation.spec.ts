import { test, expect } from '@playwright/test';

test.describe('Music Generation', () => {
  test('should create a track from prompt', async ({ page }) => {
    await page.goto('/');
    
    // Fill in prompt
    await page.fill('textarea[placeholder*="Describe the music"]', 'Upbeat electronic dance music');
    
    // Set duration
    await page.click('text=Duration');
    // Adjust slider if needed
    
    // Click generate
    await page.click('button:has-text("Generate Music")');
    
    // Wait for success message
    await expect(page.locator('text=Track generation started')).toBeVisible();
  });

  test('should show error for empty prompt', async ({ page }) => {
    await page.goto('/');
    
    // Try to generate without prompt
    await page.click('button:has-text("Generate Music")');
    
    // Should show error
    await expect(page.locator('text=Please enter a prompt')).toBeVisible();
  });
});

