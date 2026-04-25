import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const userFacingRoutes = [
  'src/app/router.tsx',
  'src/layouts/auth-layout.tsx',
  'src/layouts/protected-app-shell.tsx',
  'src/layouts/mesa-layout.tsx',
  'src/routes/login-page.tsx',
  'src/routes/register-page.tsx',
  'src/routes/hub-page.tsx',
  'src/routes/mesas-page.tsx',
  'src/routes/my-characters-page.tsx',
  'src/routes/invites-page.tsx',
  'src/routes/profile-page.tsx',
  'src/routes/not-found-page.tsx',
  'src/routes/mesa-overview-page.tsx',
  'src/routes/mesa-sheets-page.tsx',
  'src/routes/mesa-rolls-page.tsx',
  'src/routes/mesa-order-page.tsx',
  'src/routes/mesa-compendium-page.tsx',
  'src/routes/mesa-settings-page.tsx',
  'src/features/compendium/data/source/book-content.js'
];

const bannedPhrases = [
  'txt removido',
  'cada bloco',
  'fica aqui',
  'sem competir',
  'novo fluxo',
  'fluxo oficial',
  'remake',
  'dashboard contextual',
  'dashboard',
  'plataforma primeiro',
  'sistema depois',
  'right rail',
  'utility rail',
  'contexto operacional',
  'fluxo principal',
  'miolo continuo',
  'miolo contínuo',
  'workspace global',
  'buscar no nexus',
  'proxy de referências externas',
  'proxy de referencias externas',
  'presets encontrados',
  'composer'
];

describe('user-facing copy', () => {
  it('keeps product screens free from internal architecture language', () => {
    const violations = userFacingRoutes.flatMap((file) => {
      const text = readFileSync(join(process.cwd(), file), 'utf8').toLowerCase();
      return bannedPhrases.filter((phrase) => text.includes(phrase)).map((phrase) => `${file}: ${phrase}`);
    });

    expect(violations).toEqual([]);
  });
});
