import { expect, test } from '@playwright/test';

test('debug boot on cadastro', async ({ page }) => {
  const messages: string[] = [];
  page.on('console', (msg) => messages.push(`[console:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => messages.push(`[pageerror] ${err.message}`));

  await page.goto('/cadastro');
  await page.waitForTimeout(2000);

  console.log(messages.join('\n'));
  await expect(page.locator('#root')).not.toBeEmpty();
});
