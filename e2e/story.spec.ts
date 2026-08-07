import { expect, test } from '@playwright/test';

test('intro cutscene plays, skips, and the quest advances at the café', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();

  // Intro cutscene is visible for a new game.
  await expect(page.locator('#cine')).toBeVisible();
  await page.locator('#cine-skip').click();
  await expect(page.locator('#cine')).toBeHidden();

  // Teleport to the café door, enter, talk to the barista, advance the quest.
  await page.evaluate(() => {
    (window as unknown as { __FCO_DEBUG__: { teleport: (x: number, y: number) => void } }).__FCO_DEBUG__.teleport(4, 10.9);
  });
  await page.keyboard.press('e');
  await page.waitForTimeout(200);

  await page.evaluate(() => {
    (window as unknown as { __FCO_DEBUG__: { setRoomPos: (x: number, y: number) => void } }).__FCO_DEBUG__.setRoomPos(3, 1.5);
  });
  await page.keyboard.press('e');
  await page.waitForTimeout(200);

  await expect(page.locator('#dlg')).toBeVisible();
  await page.locator('#dlg-choices button').first().click();
  await page.waitForTimeout(200);

  const quest = await page.evaluate(() =>
    (window as unknown as { __FCO_DEBUG__: { quest: () => string } }).__FCO_DEBUG__.quest(),
  );
  expect(quest).toBe('glasses');
  expect(errors).toEqual([]);
});
