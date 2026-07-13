import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_EMAIL ?? '';
const PASSWORD = process.env.TEST_PASSWORD ?? '';

test('note persists after page reload', async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, 'Set TEST_EMAIL and TEST_PASSWORD to run this test');

  // Sign in
  await page.goto('/auth/sign-in');
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/docs');

  // Open the home page
  await page.goto('/');

  // Navigate to workspace
  await page.getByRole('link', { name: 'Go to workspace →' }).click();
  await page.waitForURL('**/docs');

  // Create a new note
  await page.getByRole('button', { name: '+ New document' }).click();
  await page.waitForURL('**/docs/**');

  // Type a unique title
  const title = `E2E note ${Date.now()}`;
  await page.getByPlaceholder('Untitled').fill(title);

  // Wait for the 500 ms autosave debounce to flush to Supabase
  await page.waitForTimeout(1500);

  // Reload the page
  await page.reload();

  // The note title must be visible in the sidebar
  await expect(page.locator('aside').getByText(title)).toBeVisible();
});
