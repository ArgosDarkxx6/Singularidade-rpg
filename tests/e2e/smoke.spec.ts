import { expect, test } from '@playwright/test';

test('registers and reaches the sheets workspace', async ({ page }) => {
  await page.goto('/cadastro');

  await page.getByLabel('Nome publico').fill('Mysto');
  await page.getByLabel('Username').fill('mysto');
  await page.getByLabel('Email').fill('mysto@example.com');
  await page.getByPlaceholder('Crie uma senha').fill('senha123');
  await page.getByPlaceholder('Repita a senha').fill('senha123');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page).toHaveURL(/\/fichas$/);
  await expect(page.getByText('Roster e ficha ativa')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Mysto,/ })).toBeVisible();
});

test('creates an online table from the mesa hub', async ({ page }) => {
  await page.goto('/cadastro');

  await page.getByLabel('Nome publico').fill('GM');
  await page.getByLabel('Username').fill('gm1');
  await page.getByLabel('Email').fill('gm@example.com');
  await page.getByPlaceholder('Crie uma senha').fill('senha123');
  await page.getByPlaceholder('Repita a senha').fill('senha123');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL(/\/fichas$/);

  await page.goto('/mesa');
  await page.getByLabel('Nome da mesa').fill('Mesa de Teste');
  const createTableButton = page.getByRole('button', { name: 'Criar mesa com o estado atual' });
  await createTableButton.scrollIntoViewIfNeeded();
  await createTableButton.click();

  await expect(page).toHaveURL(/\/mesa\/mesa-de-teste/);
  await expect(page.getByRole('heading', { name: 'Mesa de Teste' }).first()).toBeVisible();
});
