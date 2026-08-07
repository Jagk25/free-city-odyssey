import { expect, test } from '@playwright/test';

function collectErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

test('boots without console errors and shows a canvas', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  expect(errors).toEqual([]);
});

test('renders all four clock times without errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();

  for (const minute of [480, 780, 1140, 1380]) {
    await page.evaluate((m) => {
      (window as unknown as { __FCO_DEBUG__: { setMinute: (n: number) => void } }).__FCO_DEBUG__.setMinute(m);
    }, minute);
    await page.waitForTimeout(200);
  }
  expect(errors).toEqual([]);
});
