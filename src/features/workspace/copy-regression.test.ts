import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const userFacingRoutes = [
  'src/routes/login-page.tsx',
  'src/routes/register-page.tsx',
  'src/routes/mesas-page.tsx',
  'src/routes/mesa-overview-page.tsx',
  'src/routes/mesa-members-page.tsx',
  'src/routes/mesa-sheets-page.tsx',
  'src/routes/mesa-session-page.tsx',
  'src/routes/mesa-settings-page.tsx',
  'src/routes/mesa-rolls-page.tsx'
];

const bannedPhrases = [
  'dashboard contextual',
  'plataforma primeiro',
  'sistema depois',
  'right rail',
  'utility rail',
  'contexto operacional',
  'fluxo principal',
  'miolo continuo',
  'miolo contínuo',
  'workspace global'
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
