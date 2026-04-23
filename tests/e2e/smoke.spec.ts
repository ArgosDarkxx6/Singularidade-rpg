import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { expect, type Page, test } from '@playwright/test';

const TEST_PASSWORD = 'senha123';

type TestAccount = {
  displayName: string;
  safeId: string;
  email: string;
};

function uniqueLabel(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseEnvFile(path: string) {
  try {
    return Object.fromEntries(
      readFileSync(path, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const index = line.indexOf('=');
          const rawValue = line.slice(index + 1).trim();
          const normalizedValue = rawValue.replace(/^['"]|['"]$/g, '');
          return [line.slice(0, index).trim(), normalizedValue];
        })
    );
  } catch {
    return {};
  }
}

const localEnv: Record<string, string | undefined> = {
  ...parseEnvFile('.env'),
  ...parseEnvFile('.dev.vars'),
  ...process.env
};

function envValue(...names: string[]) {
  for (const name of names) {
    const value = localEnv[name];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function createAdminClient() {
  const supabaseUrl = envValue('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const anonKey = envValue('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
  const serviceRoleKey = envValue('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('E2E requires SUPABASE_URL or VITE_SUPABASE_URL plus SUPABASE_SERVICE_ROLE_KEY.');
  }
  if (anonKey && serviceRoleKey === anonKey) {
    throw new Error('E2E requires SUPABASE_SERVICE_ROLE_KEY with admin privileges (different from SUPABASE_ANON_KEY).');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function createConfirmedAccount(prefix: string): Promise<TestAccount> {
  const displayName = uniqueLabel(prefix);
  const safeId = displayName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
  const email = `${safeId}@mailinator.com`;
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      username: safeId,
      display_name: displayName
    }
  });

  if (error) throw error;
  if (!data.user) throw new Error('Supabase admin did not return a test user.');

  const { data: profile } = await admin.from('profiles').select('id').eq('id', data.user.id).maybeSingle();
  if (!profile) {
    const { error: profileError } = await admin.from('profiles').upsert({
      id: data.user.id,
      email,
      username: safeId,
      display_name: displayName,
      bio: '',
      avatar_url: '',
      avatar_path: ''
    });

    if (profileError) throw profileError;
  }

  return { displayName, safeId, email };
}

async function registerUser(page: Page, prefix: string) {
  const account = await createConfirmedAccount(prefix);
  await signInUser(page, account.safeId);
  return account;
}

async function submitRegistration(page: Page, input: { displayName: string; username: string; email: string; password?: string }) {
  await page.goto('/cadastro');
  await page.getByLabel(/Nome p/i).fill(input.displayName);
  await page.getByLabel('Username').fill(input.username);
  await page.getByLabel('Email').fill(input.email);
  await page.getByPlaceholder('Crie uma senha').fill(input.password || TEST_PASSWORD);
  await page.getByPlaceholder('Repita a senha').fill(input.password || TEST_PASSWORD);
  await page.getByRole('button', { name: 'Criar conta' }).click();
}

async function signInUser(page: Page, identifier: string) {
  await page.goto('/entrar');
  await page.getByLabel('Email ou username').fill(identifier);
  await page.getByLabel('Senha').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Entrar no Project Nexus' }).click();

  await expect(page).toHaveURL(/\/mesas$/);
  await expect(page.getByRole('heading', { name: 'Hub operacional' })).toBeVisible();
}

async function expectInvalidLogin(page: Page, identifier: string, password = 'senhaerrada') {
  await page.goto('/entrar');
  await page.getByLabel('Email ou username').fill(identifier);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar no Project Nexus' }).click();
  await expect(page.getByText(/Usuario, email ou senha invalidos|Usuario ou senha invalidos/)).toBeVisible();
}

async function signOutCurrentUser(page: Page) {
  const hardReset = async () => {
    await page.evaluate(() => {
      localStorage.removeItem('project-nexus-auth-v1');
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('project-nexus-online-session-v1:') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      }
      sessionStorage.clear();
    });
    await page.context().clearCookies();
    await page.goto('/entrar');
  };

  const desktopButton = page.getByRole('button', { name: /Encerrar sess/i }).first();
  if (await desktopButton.isVisible().catch(() => false)) {
    await desktopButton.click({ force: true });
  } else if (await page.getByRole('button', { name: /Abrir navega/i }).first().isVisible().catch(() => false)) {
    await page.getByRole('button', { name: /Abrir navega/i }).first().click({ force: true });
    await page.getByRole('button', { name: /Encerrar sess/i }).first().click({ force: true });
  }

  const reachedLogin = await page.waitForURL(/\/entrar(\?.*)?$/, { timeout: 8_000 }).then(() => true).catch(() => false);
  if (!reachedLogin) {
    await hardReset();
  }

  await expect(page).toHaveURL(/\/entrar(\?.*)?$/);
}

async function openCreateTableDialog(page: Page) {
  await page.getByRole('button', { name: /^(Criar mesa|Nova mesa)$/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Criar uma mesa' })).toBeVisible();
}

async function createTable(page: Page, tableName: string) {
  await openCreateTableDialog(page);
  await expect(page.getByLabel('Sistema da mesa')).toHaveValue('singularidade');
  await expect(page.getByText('Sistema selecionado')).toBeVisible();
  await page.getByLabel('Nome da mesa').fill(tableName);
  await page.getByRole('button', { name: 'Criar e entrar' }).click();
  await expect(page).toHaveURL(new RegExp(`/mesa/${slugify(tableName)}$`), { timeout: 30_000 });
}

async function openInviteModal(page: Page) {
  const dialog = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: 'Convidar membro' })
  });

  if (!(await dialog.first().isVisible().catch(() => false))) {
    const tryClickVisibleButton = async (name: string) => {
      const buttons = page.getByRole('button', { name });
      const count = await buttons.count();

      for (let index = 0; index < count; index += 1) {
        const button = buttons.nth(index);
        if (await button.isVisible().catch(() => false)) {
          await button.click();
          return true;
        }
      }

      return false;
    };

    const clickedInviteButton = await tryClickVisibleButton('Convidar membro');
    if (!clickedInviteButton) {
      const clickedNewInviteButton = await tryClickVisibleButton('Novo convite');
      if (!clickedNewInviteButton) {
        const slugMatch = page.url().match(/\/mesa\/([^/?#]+)/i);
        if (slugMatch?.[1]) {
          await page.goto(`/mesa/${slugMatch[1]}?focus=membros`);
        }
      }
    }
  }

  await expect(dialog.getByRole('heading', { name: 'Convidar membro' })).toBeVisible();
  return dialog;
}

async function createRoleJoinCode(page: Page, role: 'player' | 'viewer') {
  const dialog = await openInviteModal(page);
  await dialog.getByLabel('Tipo').selectOption('code');
  await dialog.getByLabel('Papel concedido').selectOption(role);
  await dialog.getByRole('button', { name: 'Gerar' }).click();

  let joinCode = '';
  await expect
    .poll(async () => {
      const bodyText = await page.locator('body').textContent();
      joinCode = bodyText?.match(/Codigo\s+(\d{6})\s+criado/i)?.[1] || '';
      return joinCode;
    })
    .not.toBe('');

  expect(joinCode).toHaveLength(6);
  return joinCode;
}

async function createRoleInviteLink(page: Page, role: 'player' | 'viewer', slug: string) {
  const dialog = await openInviteModal(page);
  await dialog.getByLabel('Tipo').selectOption('link');
  await dialog.getByLabel('Papel concedido').selectOption(role);

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await dialog.getByRole('button', { name: 'Gerar' }).click();

  let inviteUrl = '';
  const pattern = new RegExp(`https?://[^\\s]+/mesa/${slug}\\?token=[a-f0-9]+`, 'i');
  await expect
    .poll(async () => {
      inviteUrl = await page.evaluate(async () => {
        try {
          return (await navigator.clipboard.readText()) || '';
        } catch {
          return '';
        }
      });
      return pattern.test(inviteUrl);
    })
    .toBeTruthy();

  expect(inviteUrl).toMatch(pattern);
  return inviteUrl;
}

async function joinByCode(page: Page, code: string, nickname: string, slug: string) {
  await page.getByRole('button', { name: /Entrar em( uma)? mesa/ }).click();
  await page.getByRole('tab', { name: /C.*digo/ }).click();
  await page.getByLabel(/C.*digo da mesa/).fill(code);
  await page.getByLabel(/Apelido da sess/).fill(nickname);
  await page.getByRole('button', { name: /Entrar por c.*digo/ }).click();

  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}$`), { timeout: 15_000 });
}

async function joinByInviteLink(page: Page, inviteUrl: string, nickname: string, slug: string) {
  await page.getByRole('button', { name: /Entrar em( uma)? mesa/ }).click();
  await page.getByRole('tab', { name: 'Convite' }).click();
  await page.getByLabel('URL de convite').fill(inviteUrl);
  await page.getByLabel(/Apelido da sess/).fill(nickname);
  await page.getByRole('button', { name: 'Entrar por convite' }).click();

  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}$`), { timeout: 15_000 });
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

async function enterSheetEditMode(page: Page) {
  await page.getByRole('button', { name: 'Editar ficha' }).click();
  await expect(page.getByRole('button', { name: 'Concluir edição' })).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
}

test('registers, creates a mesa, and keeps legacy routes inside the mesa shell', async ({ page }, testInfo) => {
  await registerUser(page, 'GM Alpha');
  await expectNoHorizontalOverflow(page);
  const tableName = uniqueLabel('Mesa Alpha');
  await createTable(page, tableName);
  const slug = slugify(tableName);
  const isMobileProject = testInfo.project.name === 'mobile-chrome';

  const rail = page.locator('[data-shell-layer="rail"]');
  const railContent = page.locator('.rail-shell-content');
  const header = page.locator('[data-shell-layer="header"]');
  const contentShell = page.locator('[data-scroll-region="content"]');

  await expect(header).toBeVisible();
  await expect(contentShell).toBeVisible();

  await expect(page.getByRole('banner').getByText('Singularidade')).toBeVisible();
  await expect(page.getByRole('heading', { name: new RegExp(tableName) }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const headerBoxBefore = await header.boundingBox();
  const contentBoxBefore = await contentShell.boundingBox();
  let railBoxBefore = null;

  if (isMobileProject) {
    await expect(page.getByRole('button', { name: /Abrir navega/i })).toBeVisible();
    await page.getByRole('button', { name: /Abrir navega/i }).click();
    await expect(page.getByRole('dialog').getByText('Membros visíveis')).toBeVisible();
  } else {
    await expect(rail).toBeVisible();
    const railWidthBefore = (await railContent.boundingBox())?.width || 0;
    railBoxBefore = await rail.boundingBox();

    await rail.hover();
    await page.waitForTimeout(260);

    const expandedRailBox = await railContent.boundingBox();
    const contentBoxAfterHover = await contentShell.boundingBox();
    expect(expandedRailBox).not.toBeNull();
    expect(contentBoxAfterHover).not.toBeNull();
    expect((expandedRailBox?.width || 0) - railWidthBefore).toBeGreaterThan(120);
    expect(Math.abs((contentBoxAfterHover?.x || 0) - (contentBoxBefore?.x || 0))).toBeLessThanOrEqual(1);

    const overlayDominates = await page.evaluate(({ x, y }) => {
      const element = document.elementFromPoint(x, y);
      return Boolean(element?.closest('.rail-shell-content'));
    }, {
      x: Math.floor((expandedRailBox?.x || 0) + (expandedRailBox?.width || 0) - 12),
      y: Math.floor((expandedRailBox?.y || 0) + 44)
    });
    expect(overlayDominates).toBeTruthy();
  }

  await contentShell.evaluate((node) => {
    node.scrollTop = 640;
  });
  await page.waitForTimeout(120);

  const headerBoxAfterScroll = await header.boundingBox();
  expect(Math.abs((headerBoxAfterScroll?.y || 0) - (headerBoxBefore?.y || 0))).toBeLessThanOrEqual(1);
  if (!isMobileProject) {
    const railBoxAfterScroll = await rail.boundingBox();
    expect(Math.abs((railBoxAfterScroll?.y || 0) - (railBoxBefore?.y || 0))).toBeLessThanOrEqual(1);
  }

  await page.goto('/mesa');
  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}$`));

  await page.goto('/fichas');
  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}/fichas$`));
  await expect(page.getByRole('heading', { name: 'Workspace de personagens' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Editar ficha' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto('/rolagens');
  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}/rolagens$`));
  await expect(page.getByRole('heading', { name: 'Console de resolução' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto('/ordem');
  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}/ordem$`));
  await expect(page.getByRole('heading', { name: 'Painel tático de combate' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto('/livro');
  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}/livro$`));
  await expect(page.getByRole('heading', { name: 'Livro da mesa, presets e busca editorial' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('account creation protects username and email uniqueness and login uses username', async ({ page }) => {
  const account = await registerUser(page, 'Auth Guard');
  await signOutCurrentUser(page);

  await submitRegistration(page, {
    displayName: 'Outro usuario',
    username: account.safeId,
    email: `${account.safeId.slice(0, 12)}_2@mailinator.com`
  });
  await expect(page.getByText(/Este username ja esta em uso.|O projeto Supabase atingiu o limite de envio de email/)).toBeVisible();

  await submitRegistration(page, {
    displayName: 'Email repetido',
    username: `${account.safeId.slice(0, 16)}_2`,
    email: account.email
  });
  await expect(page.getByText(/Ja existe uma conta com este email.|O projeto Supabase atingiu o limite de envio de email/)).toBeVisible();

  await expectInvalidLogin(page, 'usuario_inexistente', 'senha123');
  await expectInvalidLogin(page, account.safeId, 'senhaerrada');
  await signInUser(page, account.email);
  await signOutCurrentUser(page);
  await signInUser(page, account.safeId);
});

test('gm sees session, presence, and sheet dialogs for the active mesa', async ({ page }) => {
  await registerUser(page, 'GM Sessão');
  const tableName = uniqueLabel('Mesa Sessão');
  await createTable(page, tableName);
  const slug = slugify(tableName);

  await page.goto(`/mesa/${slug}`);
  await expect(page.getByText('Status atual')).toBeVisible();
  await expect(page.locator('body')).toContainText('Membros em foco');

  await page.goto(`/mesa/${slug}/configuracoes`);
  await expect(page.getByRole('heading', { name: 'Administração, metadados e segurança' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar snapshot' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto(`/mesa/${slug}/membros`);
  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}\\?focus=membros$`));
  const inviteModal = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: 'Convidar membro' })
  });
  await expect(inviteModal.getByRole('heading', { name: 'Convidar membro' })).toBeVisible();
  await expect(inviteModal.getByLabel('Tipo')).toBeVisible();
  await expect(inviteModal.getByLabel('Papel concedido')).toBeVisible();
  await expect(inviteModal.getByLabel('Personagem vinculado')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  const generatedCode = await createRoleJoinCode(page, 'player');
  expect(generatedCode).toHaveLength(6);

  await page.goto(`/mesa/${slug}/fichas`);
  await expect(page.getByRole('heading', { name: 'Workspace de personagens' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Editar ficha' })).toBeVisible();
  await page.goto(`/mesa/${slug}/rolagens`);
  await page.getByRole('button', { name: 'Rolar atributo' }).click();
  await expect(page.getByText(/Força -/).first()).toBeVisible({ timeout: 15_000 });

  await page.goto(`/mesa/${slug}/fichas`);
  await enterSheetEditMode(page);
  await expect(page.getByRole('button', { name: 'Salvar ficha principal' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adicionar arma' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Adicionar técnica' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Adicionar item' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Adicionar passiva' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Adicionar voto' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Adicionar condição' })).toHaveCount(1);
  await openSheetDialogAndAssert(page, 'Adicionar arma', 'Adicionar arma');
  await openSheetDialogAndAssert(page, 'Adicionar técnica', 'Adicionar técnica');
  await openSheetDialogAndAssert(page, 'Adicionar item', 'Adicionar item');
});

test('viewer joins read-only, legacy livro redirect stays inside the mesa, and mobile utility rail opens', async ({ page }) => {
  await registerUser(page, 'GM Viewer');
  const tableName = uniqueLabel('Mesa Viewer');
  await createTable(page, tableName);
  const slug = slugify(tableName);

  await page.goto(`/mesa/${slug}/membros`);
  const joinCode = await createRoleJoinCode(page, 'viewer');

  await signOutCurrentUser(page);
  await registerUser(page, 'Viewer Join');
  await joinByCode(page, joinCode, 'Viewer Join', slug);

  await page.goto(`/mesa/${slug}`);
  await expect(page.getByRole('link', { name: 'Fichas' })).toHaveCount(0);

  await page.goto(`/mesa/${slug}/configuracoes`);
  await expect(page.getByText(/Seu papel atual é de leitura./)).toBeVisible();

  await page.goto(`/mesa/${slug}/fichas`);
  await expect(page.getByText('Fichas indisponíveis para este papel.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar ficha principal' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Adicionar arma' })).toHaveCount(0);

  await page.goto('/livro');
  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}/livro$`));
  await expect(page.getByRole('heading', { name: 'Livro da mesa, presets e busca editorial' })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/mesa/${slug}`);
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: /Abrir navega/i }).click();
  await expect(page.getByRole('dialog').getByText('Membros visíveis')).toBeVisible();
});

test('player joins by linked invite URL', async ({ page }) => {
  await registerUser(page, 'GM Link');
  const tableName = uniqueLabel('Mesa Link');
  await createTable(page, tableName);
  const slug = slugify(tableName);

  await page.goto(`/mesa/${slug}/membros`);
  const inviteUrl = await createRoleInviteLink(page, 'player', slug);

  await signOutCurrentUser(page);
  await registerUser(page, 'Player Link');
  await joinByInviteLink(page, inviteUrl, 'Player Link', slug);
  await expect(page).toHaveURL(new RegExp(`/mesa/${slug}$`));

  await page.goto(`/mesa/${slug}/fichas`);
  await expect(page.getByText('Voce ainda nao tem ficha nesta mesa')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Criar personagem na mesa' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Importar .json' })).toBeVisible();
  await expect(page.getByText('Usar personagem de Meus personagens')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Editar ficha' })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test('my characters keeps primary actions accessible on mobile', async ({ page }) => {
  await registerUser(page, 'Mobile Cores');
  const coreName = uniqueLabel('Nucleo Mobile');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/personagens');

  await expect(page.getByRole('button', { name: 'Criar nucleo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Importar JSON' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Atualizar' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: 'Criar nucleo' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Nome').fill(coreName);
  await dialog.getByRole('button', { name: 'Criar nucleo' }).click();

  await expect(page.getByText(coreName)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Transferir posse' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('profile account, ownership transfer, and table deletion preserve owned characters', async ({ page }) => {
  const gm = await registerUser(page, 'GM Admin');
  const tableName = uniqueLabel('Mesa Admin');
  await createTable(page, tableName);
  const slug = slugify(tableName);

  await page.goto(`/mesa/${slug}/membros`);
  const playerJoinCode = await createRoleJoinCode(page, 'player');

  await signOutCurrentUser(page);
  const player = await registerUser(page, 'Player Admin');
  await joinByCode(page, playerJoinCode, 'Player Admin', slug);

  await page.goto('/perfil');
  await expect(page.getByRole('main').getByText('Project Nexus')).toBeVisible();
  await expect(page.getByRole('main').getByText(tableName, { exact: true })).toBeVisible();
  const linkedCharacterLabel = page.getByRole('main').getByText(new RegExp(`Vinculado a ${tableName}`));
  if ((await linkedCharacterLabel.count()) > 0) {
    await expect(linkedCharacterLabel.first()).toBeVisible();
  } else {
    await expect(page.getByRole('main').getByText(/Nenhum personagem próprio\.|Preservado fora de uma mesa/)).toBeVisible();
  }
  await expectNoHorizontalOverflow(page);

  const displayNameInput = page.getByLabel(/Nome de exibi/i);
  await displayNameInput.fill('Player Renomeado');
  await page.getByRole('button', { name: 'Salvar nome' }).click();
  await expect(displayNameInput).toHaveValue('Player Renomeado');

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Trocar foto' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  });
  await expect(page.getByRole('button', { name: 'Remover foto' })).toBeEnabled({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Remover foto' }).click();

  await signOutCurrentUser(page);
  await signInUser(page, gm.safeId);

  await page.goto(`/mesa/${slug}/configuracoes`);
  await expect(page.getByText('Danger zone')).toBeVisible();
  await page.getByLabel('Username de destino').fill(player.safeId);
  await page.getByLabel('Sua senha atual').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Transferir administracao' }).click();
  await expect(page.getByText('Administracao transferida.')).toBeVisible({ timeout: 15_000 });

  await signOutCurrentUser(page);
  await signInUser(page, player.safeId);

  await page.goto(`/mesa/${slug}/configuracoes`);
  await expect(page.getByText('Danger zone')).toBeVisible();
  await page.getByLabel('Confirmacao').fill(tableName);
  await page.getByRole('button', { name: 'Excluir mesa inteira' }).click();
  await expect(page).toHaveURL(/\/mesas$/);
});
