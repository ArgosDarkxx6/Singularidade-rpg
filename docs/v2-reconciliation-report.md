# Project Nexus Phase 1.5 V2 Reconciliation Report

Report date: 2026-04-29

Phase 1.5 reconciled the interrupted partial V2 implementation before the real Phase 2 rewrite. This phase did not migrate production pages to V2 and did not deploy.

## 1. Initial Repo State

- Starting branch: `main`
- Starting commit: `03544a5` (`Stabilize join code e2e polling`)
- Starting relationship: `main...origin/main`
- Staged files: none
- Worktree: dirty
- Phase 1 audit: `docs/visual-legacy-audit.md` existed only as an untracked file on `main`.
- `rg --files`: still blocked by Windows `Acesso negado`; inspection used `git`, PowerShell, and targeted reads.

Dirty tracked files found:

- `src/app/router.tsx`
- `src/routes/hub-page.tsx`
- `src/routes/invites-page.tsx`
- `src/routes/mesa-compendium-page.tsx`
- `src/routes/mesa-order-page.tsx`
- `src/routes/mesa-overview-page.tsx`
- `src/routes/mesa-rolls-page.tsx`
- `src/routes/mesa-settings-page.tsx`
- `src/routes/mesa-sheets-page.tsx`
- `src/routes/mesas-page.tsx`
- `src/routes/my-characters-page.tsx`
- `src/routes/profile-page.tsx`
- `src/styles/global.css`

Untracked files found:

- `docs/visual-legacy-audit.md`
- `src/components/nexus-v2/compat.tsx`
- `src/components/nexus-v2/index.ts`
- `src/components/nexus-v2/mesa-compat.tsx`
- `src/components/nexus-v2/nexus-character-card.tsx`
- `src/components/nexus-v2/nexus-feed.tsx`
- `src/components/nexus-v2/nexus-invite-list.tsx`
- `src/components/nexus-v2/nexus-list.tsx`
- `src/components/nexus-v2/nexus-mobile-nav.tsx`
- `src/components/nexus-v2/nexus-order-board.tsx`
- `src/components/nexus-v2/nexus-panel.tsx`
- `src/components/nexus-v2/nexus-rail.tsx`
- `src/components/nexus-v2/nexus-roll-console.tsx`
- `src/components/nexus-v2/nexus-settings-list.tsx`
- `src/components/nexus-v2/nexus-sheet.tsx`
- `src/components/nexus-v2/nexus-shell.tsx`
- `src/components/nexus-v2/nexus-toolbar.tsx`
- `src/components/nexus-v2/nexus-topbar.tsx`
- `src/layouts/nexus-platform-layout.tsx`
- `src/layouts/nexus-table-layout.tsx`

Ignored local artifacts observed:

- `.env`
- `.dev.vars`
- `.wrangler/`
- `cloudflare/worker.d.ts`
- `cloudflare/worker.js`
- `dist/`
- `node_modules/`
- generated config JS/DTS files
- `test-results/`
- TypeScript build info files

## 2. Backup and Quarantine

Strategy chosen: **Strategy A - Quarantine All Partial V2 Implementation**.

Backup branch:

- Branch: `backup/partial-v2-before-reconcile-20260429-0715`
- Commit: `9301039`
- Commit message: `backup: preserve interrupted partial v2 work`
- Push status: not pushed by design.

Before backup, source/doc files and the dirty diff were scanned for obvious credentials and token patterns. No real secrets were found in the staged backup scope. Ignored local files such as `.env`, `.dev.vars`, `.wrangler/`, `dist/`, `node_modules/`, generated config files, and test artifacts were not staged.

The backup commit preserved:

- The untracked Phase 1 audit report.
- All interrupted route import rewiring.
- The broad `.n2-*` CSS additions.
- The untracked `src/components/nexus-v2/` directory.
- The untracked `src/layouts/nexus-platform-layout.tsx` and `src/layouts/nexus-table-layout.tsx` files.

After backup, `main` was restored to the committed baseline and only `docs/visual-legacy-audit.md` was intentionally restored from the backup branch.

## 3. File Classification

| File or group | Decision | Reason |
|---|---|---|
| `src/app/router.tsx` | Quarantine / discard from `main` | Prematurely swaps production route shells to untracked V2 layouts. This is Phase 2 work and was not validated. |
| Platform route diffs | Quarantine / discard from `main` | They mostly swap imports to `@components/nexus-v2` while preserving old route composition and component names. |
| Mesa route diffs | Quarantine / discard from `main` | They replace imports with `@components/nexus-v2` compatibility exports while keeping `MesaPageLead`, `MesaSectionPanel`, `MesaActionCard`, and `.page-shell` structure. |
| `src/styles/global.css` dirty diff | Quarantine / discard from `main` | Adds broad `.n2-*` CSS without an adopted V2 component contract and before route migration tests. |
| `src/components/nexus-v2/compat.tsx` | Quarantine | Re-exports `NexusPanel` and `UtilityPanel` under old names. This enables old architecture to survive under V2 packaging. |
| `src/components/nexus-v2/mesa-compat.tsx` | Quarantine | Recreates `MesaPageLead`, `MesaSectionPanel`, `MesaActionCard`, and `MesaRailCard`, which Phase 1 explicitly banned from V2 render paths. |
| `src/components/nexus-v2/index.ts` | Quarantine | Barrel exports unsafe compatibility modules along with tentative primitives. |
| Individual V2 primitives | Defer via backup only | Some pieces may be useful later, but they depend on unvalidated `.n2-*` CSS and are packaged with unsafe compatibility exports. They were not adopted on `main`. |
| `src/layouts/nexus-platform-layout.tsx` | Quarantine | Premature production shell replacement using unvalidated V2 primitives. |
| `src/layouts/nexus-table-layout.tsx` | Quarantine | Premature table shell replacement and access-flow port. Too risky before Phase 2 test migration. |
| Copy edits inside route diffs | Defer | Useful labels such as `Pessoal` and `Importar arquivo` were mixed with unsafe route migration. They should be re-applied intentionally in Phase 2. |
| `docs/visual-legacy-audit.md` | Adopt | This is the Phase 1 contract and must remain on `main`. |

## 4. Why Strategy A Was Chosen

The partial V2 implementation was not safe as a foundation because it:

- Changed production routing before tests were rewritten.
- Preserved old component names through `compat.tsx` and `mesa-compat.tsx`.
- Kept legacy page composition while changing import paths.
- Added large global CSS surface area without a stable architecture contract.
- Mixed valuable copy edits with unsafe route wiring.
- Would make Phase 2 likely to repeat the old mistake: restyling legacy architecture instead of replacing it.

This does not mean the quarantined code has no value. It may provide reference snippets, but Phase 2 should not continue from it directly.

## 5. Worktree and Temporary Artifact Cleanup

Worktrees inspected:

- Current worktree: `C:/Project Nexus/Singularidade-rpg`
- Branch: `main`
- Commit: `03544a5`

`git worktree prune --dry-run` reported no stale metadata to prune. No extra worktrees were removed.

Local branches inspected:

- `main`
- `backup/project-nexus-restructure-2026-04-22`
- `backup/partial-v2-before-reconcile-20260429-0715`

No branches were deleted. The older backup branch ownership was unclear, so it was left intact.

Targeted temporary cleanup performed after path verification:

- Removed `.wrangler/tmp`
- Removed `test-results/.last-run.json`

Intentionally left untouched:

- `.env`
- `.dev.vars`
- `.wrangler/state`
- `node_modules/`
- `dist/`
- generated ignored config files

## 6. Guardrails Added

`src/features/workspace/copy-regression.test.ts` was expanded with V2-only guardrails that pass when V2 files do not exist.

New guardrails:

- If `src/components/nexus-v2/` or `src/layouts/nexus-*.tsx` exist later, V2 source files must not import:
  - `@components/ui/nexus`
  - `@components/ui/panel`
  - `@components/ui/card`
  - `@components/shared/section-title`
  - `@features/mesa/components/mesa-page-primitives`
  - `@features/mesa/components/mesa-section-primitives`
- V2 string literals must not contain backstage copy such as:
  - `TXT removido`
  - `novo fluxo`
  - `fica aqui`
  - `sem competir`
  - `cada bloco`
  - `este módulo`
  - `esta área`
  - `arquitetura`
  - `workspace`
  - `dashboard`
  - `composer`
  - `proxy`
  - `presets`
  - `snapshot`

The guardrail intentionally does not ban `.JSON`, because JSON import/export is a real product feature. Phase 2 should use polished labels such as `Importar .JSON`, `Exportar .JSON`, `Exportar ficha`, or `Exportar mesa .JSON`.

## 7. Main State After Reconciliation

Adopted on `main`:

- `docs/visual-legacy-audit.md`
- `docs/v2-reconciliation-report.md`
- V2 guardrail update in `src/features/workspace/copy-regression.test.ts`

Quarantined in backup branch only:

- All dirty route/router/style changes from the interrupted V2 pass.
- All untracked `src/components/nexus-v2/` files.
- `src/layouts/nexus-platform-layout.tsx`
- `src/layouts/nexus-table-layout.tsx`

Removed from `main`:

- Partial V2 production route wiring.
- Partial V2 global CSS.
- Untracked V2 component and layout files.

No production UI, routing, schema, permission, or business logic changes were adopted.

## 8. Validation

Validation commands for the final Phase 1.5 state:

- `npm run test:unit -- src/features/workspace/copy-regression.test.ts`
- `npm run check`
- `npm run build`

Validation result: passed.

- `npm run test:unit -- src/features/workspace/copy-regression.test.ts`: passed, 3 tests.
- `npm run check`: passed, including lint, typecheck, unit tests, component tests, and build.
- `npm run build`: passed.

`npm run test:e2e` was not planned by default because Strategy A restores production routes and UI to the committed baseline and only adopts docs plus guardrail tests.

## 9. Remaining Risks

- The quarantined partial V2 code may tempt future work to reuse compatibility wrappers. Phase 2 should treat it as reference only, not as a base.
- The V2 copy guardrail scans string literals; it does not fully prove rendered JSX text is free of backstage copy. Phase 2 should expand this once V2 route files exist.
- The old visual architecture still exists in the production codebase by design. Phase 1.5 only prepares the repo for a deliberate Phase 2 rewrite.
- Existing tests still lock in the old shell until Phase 2 test migration.

## 10. Recommended Phase 2 Next Step

Recommended next prompt:

> Execute Phase 2 V2 migration using `docs/visual-legacy-audit.md` and `docs/v2-reconciliation-report.md` as contracts. Start from clean `main`, ignore the quarantined compatibility wrappers, create fresh V2 primitives without legacy imports, add import/copy guardrails for V2 route render paths, then migrate `nexus-platform-layout`, Hub, and Mesas first. Preserve auth, workspace, permissions, invites, sessions, points, sheets, rolls, order, compendium, redirects, and PT-BR product copy.

Do not continue from the quarantined partial V2 implementation unless a specific snippet is reviewed and reintroduced without compatibility wrappers or legacy route composition.
