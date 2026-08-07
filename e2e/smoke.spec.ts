import { expect, test } from '@playwright/test';
import buildings from '../src/data/buildings.json';

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

test('doorway regression: no NPC is stuck inside any building after visiting all doors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();

  for (const b of buildings) {
    await page.evaluate(
      ([x, y]) => {
        (window as unknown as { __FCO_DEBUG__: { teleport: (a: number, bb: number) => void } }).__FCO_DEBUG__.teleport(x as number, y as number);
      },
      [b.door.x, b.door.y],
    );
    await page.waitForTimeout(120);
  }

  const npcs = await page.evaluate(() => {
    return (window as unknown as { __FCO_DEBUG__: { npcPositions: () => { id: string; x: number; y: number }[] } }).__FCO_DEBUG__.npcPositions();
  });

  for (const npc of npcs) {
    for (const b of buildings) {
      const inside =
        npc.x > b.x + 0.14 && npc.x < b.x + b.w - 0.14 && npc.y > b.y + 0.14 && npc.y < b.y + b.d - 0.14;
      expect(inside, `NPC ${npc.id} stuck inside ${b.id}`).toBe(false);
    }
  }
  expect(errors).toEqual([]);
});
