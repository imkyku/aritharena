import { test, expect } from '@playwright/test';

test('splash screen renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Arithmetic Arena/i)).toBeVisible();
});
