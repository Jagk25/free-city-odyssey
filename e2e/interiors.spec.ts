import { expect, test } from '@playwright/test';

test('enter cafe, pick up item, open terminal, leave', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();

  // Skip the intro cutscene so the sim is not frozen by the overlay.
  await page.evaluate(() => {
    (window as unknown as { __FCO_DEBUG__: { skipCutscene?: () => void } }).__FCO_DEBUG__.skipCutscene?.();
  });

  // Teleport to the cafe door mat and press E to enter.
  await page.evaluate(() => {
    (window as unknown as { __FCO_DEBUG__: { teleport: (x: number, y: number) => void } }).__FCO_DEBUG__.teleport(4, 10.9);
  });
  await page.keyboard.press('e');
  await page.waitForTimeout(200);

  const mode = await page.evaluate(() =>
    (window as unknown as { __FCO_DEBUG__: { mode: () => string } }).__FCO_DEBUG__.mode(),
  );
  expect(mode).toBe('interior');

  // Walk to the hidden item and pick it up.
  await page.evaluate(() => {
    (window as unknown as { __FCO_DEBUG__: { setRoomPos: (x: number, y: number) => void } }).__FCO_DEBUG__.setRoomPos(1.5, 3.2);
  });
  await page.keyboard.press('e');
  await page.waitForTimeout(150);
  const inv = await page.evaluate(() =>
    (window as unknown as { __FCO_DEBUG__: { inventory: () => string[] } }).__FCO_DEBUG__.inventory(),
  );
  expect(inv).toContain('Coffee Coupon');

  // Open the terminal mini-game modal.
  await page.evaluate(() => {
    (window as unknown as { __FCO_DEBUG__: { setRoomPos: (x: number, y: number) => void } }).__FCO_DEBUG__.setRoomPos(6.5, 2.5);
  });
  await page.keyboard.press('e');
  await page.waitForTimeout(150);
  await expect(page.locator('#mg')).toBeVisible();

  // Close it and leave the building.
  await page.evaluate(() => {
    (window as unknown as { __FCO_DEBUG__: { closeMinigame: () => void } }).__FCO_DEBUG__.closeMinigame();
  });
  await page.locator('#leave').click();
  await page.waitForTimeout(150);
  const modeAfter = await page.evaluate(() =>
    (window as unknown as { __FCO_DEBUG__: { mode: () => string } }).__FCO_DEBUG__.mode(),
  );
  expect(modeAfter).toBe('city');
  expect(errors).toEqual([]);
});
