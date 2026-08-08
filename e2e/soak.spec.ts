import { expect, test } from '@playwright/test';

test('random-input soak produces zero console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();

  // Skip the intro so the soak drives the world.
  await page.evaluate(() => {
    (window as unknown as { __FCO_DEBUG__: { skipCutscene?: () => void } }).__FCO_DEBUG__.skipCutscene?.();
  });

  const keys = ['w', 'a', 's', 'd', 'e', 'v', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'];
  for (let i = 0; i < 60; i += 1) {
    const k = keys[Math.floor(Math.random() * keys.length)]!;
    await page.keyboard.down(k);
    await page.waitForTimeout(120);
    await page.keyboard.up(k);
  }

  expect(errors).toEqual([]);
});
