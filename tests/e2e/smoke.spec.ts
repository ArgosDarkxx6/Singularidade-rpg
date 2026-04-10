import { expect, type Page, test } from '@playwright/test';

function uniqueLabel(prefix: string) {
  const seed = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return seed;
}

async function registerUser(page: Page, prefix: string) {
  const displayName = uniqueLabel(prefix);
  const safeId = displayName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '');
  const email = `${safeId}@example.com`;

  await page.goto('/cadastro');
  await page.getByLabel('Nome público').fill(displayName);
  await page.getByLabel('Username').fill(safeId);
  await page.getByLabel('Email').fill(email);
  await page.getByPlaceholder('Crie uma senha').fill('senha123');
  await page.getByPlaceholder('Repita a senha').fill('senha123');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page).toHaveURL(/\/mesas$/);
  await expect(page.getByRole('heading', { name: 'Escolha uma mesa ou abra a sua.' })).toBeVisible();

  return { displayName, safeId };
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

async function openSheetDialogAndAssert(page: Page, buttonName: string, dialogTitle: string) {
  const dialog = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: dialogTitle })
  });
  await page.getByRole('button', { name: buttonName }).click();
  await expect(dialog.getByRole('heading', { name: dialogTitle })).toBeVisible();
  await dialog.getByRole('button', { name: 'Fechar' }).click();
  await expect(dialog).toHaveCount(0);
}

test('registers, creates a mesa, and keeps legacy routes inside the mesa shell', async ({ page }) => {
  await registerUser(page, 'GM Alpha');
  const tableName = uniqueLabel('Mesa Alpha');
  await createTable(page, tableName);
  const slug = slugify(tableName);

  await expect(page.getByRole('banner').getByText('Mesa atual')).toBeVisible();
  await expect(page.getByRole('heading', { name: new RegExp(tableName) }).first()).toBeVisible();

  await page.goto('/mesa');
  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}$`));

  await page.goto('/fichas');
  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}/fichas$`));
  await expect(page.getByRole('heading', { name: `Fichas / ${tableName}` })).toBeVisible();

  await page.goto('/rolagens');
  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}/rolagens$`));
  await expect(page.getByRole('heading', { name: `Rolagens / ${tableName}` })).toBeVisible();

  await page.goto('/ordem');
  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}/ordem$`));
  await expect(page.getByRole('heading', { name: `Ordem / ${tableName}` })).toBeVisible();

  await page.goto('/livro');
  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}/livro$`));
  await expect(page.getByRole('heading', { name: 'Livro da mesa, presets e busca editorial' })).toBeVisible();
});

test('gm sees session, presence, and sheet dialogs for the active mesa', async ({ page }) => {
  await registerUser(page, 'GM Sessão');
  const tableName = uniqueLabel('Mesa Sessão');
  await createTable(page, tableName);
  const slug = slugify(tableName);

  await page.goto(`/mesa/${slug}`);
  await expect(page.getByText('Sessão atual')).toBeVisible();
  await expect(page.getByText('Sua presença')).toBeVisible();
  await expect(page.getByText('Membros visíveis')).toBeVisible();

  await page.goto(`/mesa/${slug}/configuracoes`);
  await expect(page.getByRole('heading', { name: 'Administração, metadados e segurança' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar snapshot' })).toBeVisible();

  await page.goto(`/mesa/${slug}/membros`);
  await expect(page.getByRole('heading', { name: 'Servidor fechado por convite' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gerar convite' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gerar código' })).toBeVisible();
  await expect(page.getByLabel('Papel concedido').first()).toBeVisible();
  await expect(page.getByLabel('Personagem vinculado').first()).toBeVisible();

  const roleSelects = page.getByLabel('Papel concedido');
  await roleSelects.nth(1).selectOption('player');
  const characterSelects = page.getByLabel('Personagem vinculado');
  await characterSelects.nth(1).selectOption({ index: 1 });
  const labelInputs = page.getByLabel('Rótulo do código');
  await labelInputs.fill('Código do player');
  await page.getByRole('button', { name: 'Gerar código' }).click();

  const generatedCodeCard = page.locator('text=Código do player').first().locator('..');
  await expect(generatedCodeCard).toBeVisible();
  const generatedCodeText = await generatedCodeCard.textContent();
  const codeMatch = generatedCodeText?.match(/\d{3}\s\d{3}/);
  const joinCode = codeMatch?.[0]?.replace(/\s/g, '') || '';
  expect(joinCode).toHaveLength(6);

  await page.goto(`/mesa/${slug}/fichas`);
  await expect(page.getByRole('heading', { name: 'Personagens' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar ficha principal' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adicionar arma' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adicionar técnica' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adicionar item' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adicionar passiva' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adicionar voto' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adicionar condição' })).toBeVisible();
  await openSheetDialogAndAssert(page, 'Adicionar arma', 'Adicionar arma');
  await openSheetDialogAndAssert(page, 'Adicionar técnica', 'Adicionar técnica');
  await openSheetDialogAndAssert(page, 'Adicionar item', 'Adicionar item');

  await expect(page.getByRole('heading', { name: 'Estados ativos' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adicionar condição' })).toBeVisible();

  await signOutCurrentUser(page);
  await registerUser(page, 'Player Sessão');
  await page.getByRole('button', { name: 'Entrar em uma mesa' }).click();
  await page.getByRole('tab', { name: 'Código' }).click();
  await page.getByLabel('Código da mesa').fill(joinCode);
  await page.getByLabel('Apelido da sessão').fill('Player Sessão');
  await page.getByRole('button', { name: 'Entrar por código' }).click();

  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}$`));
  await expect(page.getByText('Você está na mesa como Player.')).toBeVisible();

  await page.goto(`/mesa/${slug}/configuracoes`);
  await expect(page.getByRole('button', { name: 'Salvar snapshot' })).toHaveCount(0);

  await page.goto(`/mesa/${slug}/fichas`);
  await expect(page.getByRole('button', { name: 'Salvar ficha principal' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adicionar arma' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adicionar condição' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Modo visualização' })).toHaveCount(0);
});

test('viewer joins read-only, legacy livro redirect stays inside the mesa, and mobile utility rail opens', async ({ page }) => {
  await registerUser(page, 'GM Viewer');
  const tableName = uniqueLabel('Mesa Viewer');
  await createTable(page, tableName);
  const slug = slugify(tableName);

  await page.goto(`/mesa/${slug}/membros`);
  await expect(page.getByRole('heading', { name: 'Servidor fechado por convite' })).toBeVisible();

  const roleSelects = page.getByLabel('Papel concedido');
  await roleSelects.nth(1).selectOption('viewer');
  const labelInputs = page.getByLabel('Rótulo do código');
  await labelInputs.fill('Código do viewer');
  await page.getByRole('button', { name: 'Gerar código' }).click();

  const generatedCodeCard = page.locator('text=Código do viewer').first().locator('..');
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

  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}$`));
  await expect(page.getByText('Você está na mesa como Viewer.')).toBeVisible();

  await page.goto(`/mesa/${slug}/configuracoes`);
  await expect(page.getByRole('button', { name: 'Salvar snapshot' })).toHaveCount(0);

  await page.goto(`/mesa/${slug}/fichas`);
  await expect(page.getByRole('heading', { name: 'Modo visualização' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar ficha principal' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Adicionar arma' })).toHaveCount(0);

  await page.goto('/livro');
  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}/livro$`));
  await expect(page.getByRole('heading', { name: 'Livro da mesa, presets e busca editorial' })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/mesa/${slug}`);
  await page.getByRole('button', { name: 'Abrir utilidades da mesa' }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Quem está aqui' })).toBeVisible();
});
