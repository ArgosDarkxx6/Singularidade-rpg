import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
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
  'src/features/mesa/components/mesa-page-primitives.tsx',
  'src/features/mesa/components/mesa-section-primitives.tsx',
  'src/features/sheets/components/character-roster-panel.tsx',
  'src/features/sheets/components/profile-editor.tsx',
  'src/features/sheets/components/collections-panel.tsx',
  'src/features/sheets/components/conditions-editor.tsx',
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
  'composer',
  'danger zone',
  'último sync',
  'ultimo sync',
  'snapshot salvo',
  'snapshot restaurado',
  'salvar snapshot',
  'metadados',
  'core narrativo protegido',
  'roster do gm'
];

const sourceExtensions = new Set(['.ts', '.tsx']);

function collectSourceFiles(relativePath: string): string[] {
  const absolutePath = join(process.cwd(), relativePath);

  if (!existsSync(absolutePath)) return [];

  const stats = statSync(absolutePath);

  if (stats.isFile()) {
    return sourceExtensions.has(extname(relativePath)) ? [relativePath] : [];
  }

  return readdirSync(absolutePath, { withFileTypes: true }).flatMap((entry) => collectSourceFiles(`${relativePath}/${entry.name}`));
}

function stringLiterals(text: string) {
  return Array.from(text.matchAll(/(['"`])((?:\\.|(?!\1).)*?)\1/gs), (match) => match[2]);
}

function importSpecifiers(text: string) {
  return [
    ...text.matchAll(/\bimport\s+(?:type\s+)?(?:[^'"`]*?\s+from\s+)?['"`]([^'"`]+)['"`]/gs),
    ...text.matchAll(/\bexport\s+(?:type\s+)?[^'"`]*?\s+from\s+['"`]([^'"`]+)['"`]/gs),
    ...text.matchAll(/\bimport\(\s*['"`]([^'"`]+)['"`]\s*\)/gs)
  ].map((match) => match[1]);
}

const v2SourceFiles = [
  ...collectSourceFiles('src/components/nexus-v2'),
  ...collectSourceFiles('src/layouts').filter((file) => /src\/layouts\/nexus-.*\.tsx?$/.test(file)),
  ...collectSourceFiles('src/routes/hub-page.tsx'),
  ...collectSourceFiles('src/routes/mesas-page.tsx')
];

const v2BannedImports = [
  '@components/ui/nexus',
  '@components/ui/panel',
  '@components/ui/card',
  '@components/shared/section-title',
  '@features/mesa/components/mesa-page-primitives',
  '@features/mesa/components/mesa-section-primitives'
];

const v2BannedImportSuffixes = [
  'components/ui/nexus',
  'components/ui/panel',
  'components/ui/card',
  'components/shared/section-title',
  'features/mesa/components/mesa-page-primitives',
  'features/mesa/components/mesa-section-primitives'
];

const v2BannedCopyPhrases = [
  'txt removido',
  'novo fluxo',
  'fica aqui',
  'sem competir',
  'cada bloco',
  'este módulo',
  'esta área',
  'arquitetura',
  'workspace',
  'dashboard',
  'composer',
  'proxy',
  'presets',
  'snapshot'
];

const v2BannedLegacyShellStrings = [
  'app-shell-root',
  'app-shell-grid',
  'app-topbar',
  'app-content-shell',
  'rail-shell',
  'rail-shell-content',
  'page-grid',
  'page-shell',
  'page-right-rail',
  'nexus-panel',
  'nexus-row',
  'data-shell-layer',
  'data-scroll-region'
];

function matchesBannedImport(specifier: string) {
  const normalized = specifier.replace(/\\/g, '/').replace(/^@\//, '').replace(/^@/, '');

  return (
    v2BannedImports.includes(specifier) ||
    v2BannedImportSuffixes.some((suffix) => normalized === suffix || normalized.endsWith(`/${suffix}`))
  );
}

function userVisibleLiterals(text: string) {
  const modules = new Set(importSpecifiers(text));
  return stringLiterals(text).filter((literal) => !modules.has(literal));
}

describe('user-facing copy', () => {
  it('keeps product screens free from internal architecture language', () => {
    const violations = userFacingRoutes.flatMap((file) => {
      const text = readFileSync(join(process.cwd(), file), 'utf8').toLowerCase();
      return bannedPhrases.filter((phrase) => text.includes(phrase)).map((phrase) => `${file}: ${phrase}`);
    });

    expect(violations).toEqual([]);
  });
});

describe('nexus v2 guardrails', () => {
  it('keeps V2 files from importing legacy visual primitives', () => {
    const violations = v2SourceFiles.flatMap((file) => {
      const imports = importSpecifiers(readFileSync(join(process.cwd(), file), 'utf8'));
      return imports.filter(matchesBannedImport).map((bannedImport) => `${file}: ${bannedImport}`);
    });

    expect(violations).toEqual([]);
  });

  it('keeps V2 visible copy free from backstage language', () => {
    const violations = v2SourceFiles.flatMap((file) => {
      const literals = userVisibleLiterals(readFileSync(join(process.cwd(), file), 'utf8')).map((literal) => literal.toLowerCase());
      return v2BannedCopyPhrases
        .filter((phrase) => literals.some((literal) => literal.includes(phrase)))
        .map((phrase) => `${file}: ${phrase}`);
    });

    expect(violations).toEqual([]);
  });

  it('keeps V2 files from reusing legacy shell and page class contracts', () => {
    const violations = v2SourceFiles.flatMap((file) => {
      const literals = userVisibleLiterals(readFileSync(join(process.cwd(), file), 'utf8')).map((literal) => literal.toLowerCase());
      return v2BannedLegacyShellStrings
        .filter((legacyString) => literals.some((literal) => literal.includes(legacyString)))
        .map((legacyString) => `${file}: ${legacyString}`);
    });

    expect(violations).toEqual([]);
  });
});
