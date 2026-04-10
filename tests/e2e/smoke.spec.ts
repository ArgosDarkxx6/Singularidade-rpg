import { expect, type Page, test } from '@playwright/test';

async function registerUser(page: Page, prefix: string) {
  const seed = `${prefix}-${Date.now()}`;
  const safeId = seed.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9_]/g, '');
  const email = `${safeId}@example.com`;

  await page.goto('/cadastro');
  await page.getByLabel('Nome público').fill(prefix);
  await page.getByLabel('Username').fill(safeId);
  await page.getByLabel('Email').fill(email);
  await page.getByPlaceholder('Crie uma senha').fill('senha123');
  await page.getByPlaceholder('Repita a senha').fill('senha123');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page).toHaveURL(/\/mesas$/);
  await expect(page.getByRole('heading', { name: 'Escolha uma mesa ou abra a sua.' })).toBeVisible();
}

async function openCreateTableDialog(page: Page) {
  await page.getByRole('button', { name: 'Criar uma mesa' }).first().click();
  await expect(page.getByRole('heading', { name: /Criar uma mesa|Migrar rascunho para uma mesa/ })).toBeVisible();
}

async function createTable(page: Page, tableName: string) {
  await openCreateTableDialog(page);
  await page.getByLabel('Nome da mesa').fill(tableName);
  await page.getByRole('button', { name: 'Criar e entrar' }).click();
  await expect(page).toHaveURL(new RegExp(`/mesa/${slugify(tableName)}$`));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function signOutCurrentUser(page: Page) {
  const desktopButton = page.getByRole('button', { name: 'Encerrar sessão' });
  if (await desktopButton.isVisible()) {
    await desktopButton.click();
  } else {
    await page.getByRole('button', { name: 'Abrir navegação' }).click();
    await page.getByRole('button', { name: 'Encerrar sessão' }).click();
  }

  await expect(page).toHaveURL(/\/entrar(\?.*)?$/);
}

test('registers, lands on the mesas portal, and keeps global routes inside a mesa context', async ({ page }) => {
  await registerUser(page, 'GM Alpha');
  await createTable(page, 'Mesa Alpha');

  await expect(page.getByRole('heading', { name: /Mesa \/ Mesa Alpha/i })).toBeVisible();

  await page.goto('/fichas');
  await expect(page).toHaveURL(/\/mesa\/mesa-alpha\/fichas$/);
  await expect(page.getByRole('heading', { name: 'Fichas / Mesa Alpha' })).toBeVisible();
  await expect(page.getByText('Fichas da mesa')).toBeVisible();

  await page.goto('/mesas');
  await expect(page).toHaveURL(/\/mesas$/);
  await expect(page.locator('h3').filter({ hasText: 'Mesa Alpha' }).first()).toBeVisible();
});

test('creates a join code, a second user enters the mesa, and then leaves it safely', async ({ page }) => {
  await registerUser(page, 'GM Código');
  await createTable(page, 'Mesa Código');

  await page.goto('/mesa/mesa-codigo/membros');
  await expect(page.getByRole('heading', { name: 'Servidor fechado por convite' })).toBeVisible();

  const roleSelects = page.getByLabel('Papel concedido');
  await roleSelects.nth(1).selectOption('player');

  const characterSelects = page.getByLabel('Personagem vinculado');
  await characterSelects.nth(1).selectOption({ index: 1 });

  const labelInputs = page.getByLabel('Rótulo do código');
  await labelInputs.fill('Código do player');
  await page.getByRole('button', { name: 'Gerar código' }).click();

  const generatedCodeCard = page.locator('text=Código do player').locator('..');
  await expect(generatedCodeCard).toBeVisible();
  const generatedCodeText = await generatedCodeCard.textContent();
  const codeMatch = generatedCodeText?.match(/\d{3}\s\d{3}/);
  const joinCode = codeMatch?.[0]?.replace(/\s/g, '') || '';
  expect(joinCode).toHaveLength(6);

  await signOutCurrentUser(page);
  await registerUser(page, 'Player Código');

  await page.getByRole('button', { name: 'Entrar em uma mesa' }).click();
  await page.getByRole('tab', { name: 'Código' }).click();
  await page.getByLabel('Código da mesa').fill(joinCode);
  await page.getByLabel('Apelido da sessão').fill('Player Código');
  await page.getByRole('button', { name: 'Entrar por código' }).click();

  await expect(page).toHaveURL(/\/mesa\/mesa-codigo$/);
  await expect(page.getByText('Você está na mesa como Player.')).toBeVisible();

  await page.goto('/mesa/mesa-codigo/configuracoes');
  await page.getByRole('button', { name: 'Sair da mesa' }).last().click();

  await expect(page).toHaveURL(/\/mesas$/);
  await expect(page.getByRole('heading', { name: 'Escolha uma mesa ou abra a sua.' })).toBeVisible();
});

test('viewer joins read-only, legacy livro redirect stays inside the mesa, and mobile utility rail opens', async ({ page }) => {
  await registerUser(page, 'GM Viewer');
  await createTable(page, 'Mesa Viewer');

  await page.goto('/mesa/mesa-viewer/membros');
  await expect(page.getByRole('heading', { name: 'Servidor fechado por convite' })).toBeVisible();

  const roleSelects = page.getByLabel('Papel concedido');
  await roleSelects.nth(1).selectOption('viewer');

  const labelInputs = page.getByLabel('Rótulo do código');
  await labelInputs.fill('Código do viewer');
  await page.getByRole('button', { name: 'Gerar código' }).click();

  const generatedCodeCard = page.locator('text=Código do viewer').locator('..');
  await expect(generatedCodeCard).toBeVisible();
  const generatedCodeText = await generatedCodeCard.textContent();
  const codeMatch = generatedCodeText?.match(/\d{3}\s\d{3}/);
  const joinCode = codeMatch?.[0]?.replace(/\s/g, '') || '';
  expect(joinCode).toHaveLength(6);

  await signOutCurrentUser(page);
  await registerUser(page, 'Viewer Join');

  await page.getByRole('button', { name: 'Entrar em uma mesa' }).click();
  await page.getByRole('tab', { name: 'Código' }).click();
  await page.getByLabel('Código da mesa').fill(joinCode);
  await page.getByLabel('Apelido da sessão').fill('Viewer Join');
  await page.getByRole('button', { name: 'Entrar por código' }).click();

  await expect(page).toHaveURL(/\/mesa\/mesa-viewer$/);
  await expect(page.getByText('Você está na mesa como Viewer.')).toBeVisible();

  await page.goto('/mesa/mesa-viewer/configuracoes');
  await expect(page.getByRole('button', { name: 'Salvar snapshot' })).toHaveCount(0);

  await page.goto('/livro');
  await expect(page).toHaveURL(/\/mesa\/mesa-viewer\/livro$/);
  await expect(page.getByRole('heading', { name: 'Livro da mesa, presets e busca editorial' })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/mesa/mesa-viewer');
  await page.getByRole('button', { name: 'Abrir utilidades da mesa' }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Quem está aqui' })).toBeVisible();
});
