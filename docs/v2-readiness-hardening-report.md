# Project Nexus Phase 1.6 Readiness Hardening Report

Date: 2026-04-29

## 1. Initial Repo State

- Branch: `main`
- `HEAD`: `a5fe9fb` (`chore: reconcile partial v2 groundwork`)
- `origin/main`: `a5fe9fb`
- Alignment: `main...origin/main` was clean and aligned at the start of Phase 1.6.
- Staged files at start: none.
- Unstaged files at start: none.
- Untracked files at start: none.
- `rg --files`: still blocked by the bundled Windows executable with `Acesso negado`; Phase 1.6 used `git grep`, `git ls-files`, and targeted PowerShell reads.
- Worktrees: only the current worktree was registered.
- `git worktree prune --dry-run`: no stale metadata was reported.
- Local backup branches present:
  - `backup/partial-v2-before-reconcile-20260429-0715`
  - `backup/project-nexus-restructure-2026-04-22`

## 2. Phase 1 Verification Result

`docs/visual-legacy-audit.md` exists and contains all required Phase 1 sections:

1. Repository state
2. Current route map
3. Current shell/layout map
4. Legacy visual primitives
5. Main route import dependency matrix
6. Test lock-in findings
7. User-facing copy findings
8. Functional engine boundary
9. Page-by-page visual delta
10. Proposed `nexus-v2` architecture tree
11. Route migration plan
12. Import ban list
13. Test/update plan
14. Risks and blockers
15. Recommended next prompt/action

Fresh scans confirmed the audit's central findings are still accurate: the committed UI remains shaped by `ProtectedAppShell`, `MesaLayout`, legacy global classes, `NexusPanel`, `UtilityPanel`, `MesaPageLead`, `MesaSectionPanel`, `MesaActionCard`, `MesaRailCard`, and legacy sheet components. No missing high-risk production visual primitive was found beyond the ones already captured.

## 3. Phase 1.5 Verification Result

`docs/v2-reconciliation-report.md` exists and accurately describes the Phase 1.5 outcome.

Confirmed on `main`:

- `docs/visual-legacy-audit.md` exists.
- `docs/v2-reconciliation-report.md` exists.
- `src/components/nexus-v2/` does not exist.
- `src/layouts/nexus-platform-layout.tsx` does not exist.
- `src/layouts/nexus-table-layout.tsx` does not exist.
- No `.n2-*` global CSS exists on `main`.
- No dirty route rewiring to V2 layouts remains on `main`.
- `.wrangler/tmp` was not present.
- `test-results/.last-run.json` was not present.

## 4. Backup / Quarantine Verification

The local backup branch `backup/partial-v2-before-reconcile-20260429-0715` exists at commit `9301039` (`backup: preserve interrupted partial v2 work`).

The backup commit contains the quarantined interrupted implementation:

- `src/components/nexus-v2/compat.tsx`
- `src/components/nexus-v2/mesa-compat.tsx`
- `src/components/nexus-v2/index.ts`
- V2 primitive files under `src/components/nexus-v2/`
- `src/layouts/nexus-platform-layout.tsx`
- `src/layouts/nexus-table-layout.tsx`
- modified route files
- modified `src/app/router.tsx`
- modified `src/styles/global.css`

The backup branch still proves why Strategy A was correct:

- `compat.tsx` exports old names such as `NexusPanel`, `UtilityPanel`, `NexusPageHeader`, and `NexusSectionHeader`.
- `mesa-compat.tsx` recreates `MesaPageLead`, `MesaSectionPanel`, `MesaActionCard`, and `MesaRailCard`.
- `src/app/router.tsx` on the backup branch wires production routes to `nexus-platform-layout` and `nexus-table-layout`.
- `src/styles/global.css` on the backup branch contains broad `.n2-*` CSS.

No quarantined V2 files are imported by `main`.

## 5. Guardrail Verification

`src/features/workspace/copy-regression.test.ts` already contained V2-only guardrails from Phase 1.5. Phase 1.6 hardened them without affecting current production routes.

Guardrail changes made in Phase 1.6:

- V2 import checks now inspect import/export/dynamic import specifiers instead of searching arbitrary file text.
- V2 import checks now catch both alias imports and relative-path imports that end in banned legacy paths.
- V2 string-literal checks now ban legacy shell/page class contracts:
  - `app-shell-root`
  - `app-shell-grid`
  - `app-topbar`
  - `app-content-shell`
  - `rail-shell`
  - `rail-shell-content`
  - `page-grid`
  - `page-shell`
  - `page-right-rail`
  - `nexus-panel`
  - `nexus-row`
  - `data-shell-layer`
  - `data-scroll-region`
- `.JSON` remains allowed as product feature copy.
- The guardrails still pass when V2 files do not exist.

## 6. Additional Missed Legacy Traps Found

No unexpected V2 contamination was found on `main`.

Expected legacy production code that Phase 2 must replace:

- `src/app/router.tsx` still imports `ProtectedAppShell` and lazy-loads `MesaLayout`.
- `src/layouts/protected-app-shell.tsx` owns `data-shell-layer`, `data-scroll-region`, `rail-shell`, `app-topbar`, `app-content-shell`, and the platform page skeleton.
- `src/layouts/mesa-layout.tsx` owns the same legacy shell contract for mesa routes.
- `src/styles/global.css` still defines `.app-shell-root`, `.app-shell-grid`, `.page-grid`, `.page-shell`, `.page-right-rail`, `.rail-shell`, `.nexus-panel`, and `.nexus-row`.
- Platform routes still import `@components/ui/nexus` and `@components/ui/panel`.
- Mesa routes still import mesa page primitives and render `.page-shell`.
- Sheet components still mix direct `useWorkspace()` access with old `Card`, `Panel`, `UtilityPanel`, and `SectionTitle` composition.

These are intentional legacy baseline findings, not Phase 1.6 regressions.

## 7. Additional Test Lock-In Findings

The Phase 1 test lock-in map remains accurate.

Tests that still preserve old shell/layout assumptions:

- `src/layouts/protected-app-shell.test.tsx`
- `src/layouts/mesa-layout.test.tsx`
- `tests/e2e/smoke.spec.ts`

Specific old assumptions still present:

- `[data-shell-layer="rail"]`
- `[data-shell-layer="header"]`
- `[data-shell-layer="content"]`
- `[data-scroll-region="content"]`
- `.rail-shell-content`
- old shell hover/position behavior
- old JSON button copy expectations such as `Importar JSON` and `Exportar mesa JSON`

These tests should be rewritten in Phase 2 as V2 accessibility, navigation, overflow, permission, and behavior tests. Phase 1.6 did not rewrite production behavior tests.

## 8. Additional Copy Risk Findings

No new high-risk user-facing backstage copy was found beyond Phase 1 findings.

Known Phase 2 copy work:

- Keep visible `Snapshot` banned; product-facing state save language should remain `Ponto`.
- Preserve internal `snapshot` names where they are schema/backend/database contracts.
- Polish JSON labels later without banning the feature. Preferred product labels are `Importar .JSON`, `Exportar .JSON`, `Exportar ficha`, and `Exportar mesa .JSON`.
- Review `Nucleo` in character UI during Phase 2 because it exposes implementation language.

Search results containing words such as `arquitetura`, `missao`, `concentra`, `sem depender`, `workspace`, `dashboard`, `proxy`, `presets`, and `snapshot` were docs, backend/internal contracts, test mocks, or rulebook/content data rather than newly introduced V2-visible copy.

## 9. Worktree, Branch, And Artifact Hygiene Result

- Worktrees inspected: only the current worktree exists.
- Stale worktree metadata: none reported.
- Backup branches retained:
  - `backup/partial-v2-before-reconcile-20260429-0715`
  - `backup/project-nexus-restructure-2026-04-22`
- Temporary artifacts checked:
  - `.wrangler/tmp`: not present.
  - `test-results/.last-run.json`: not present.
  - `.codex-dev-server.*`: not present.
- No cleanup was required.

## 10. Repo / Cloudflare Rename Feasibility Notes

No renaming was performed.

Current naming facts:

- Git remote: `https://github.com/ArgosDarkxx6/Singularidade-rpg.git`
- `package.json` name: `project-nexus`
- Cloudflare Worker name in `wrangler.jsonc`: `singularidade-online`
- GitHub workflow: `.github/workflows/deploy-cloudflare.yml`
- Deploy script: `npm run build && wrangler deploy`

Future rename considerations:

- A GitHub repository rename would require repository settings access and local/CI remote updates.
- A Cloudflare Worker rename would require Cloudflare access, Worker/service route review, credential rebinding, workflow validation, and possible custom-domain or redirect planning.
- `wrangler.jsonc` still contains historical comments about the legacy Worker/Durable Object migration. Do not edit these during V2 unless the deployment/runtime migration context is deliberately updated.

## 11. Changes Made In Phase 1.6

- Added this readiness report: `docs/v2-readiness-hardening-report.md`.
- Hardened V2-only guardrails in `src/features/workspace/copy-regression.test.ts`.
- No production route, shell, style, auth, workspace, Supabase, Cloudflare Worker, schema, permission, or UI behavior files were changed.

## 12. Validation Results

Passed:

- `npm run test:unit -- src/features/workspace/copy-regression.test.ts`: passed, 1 file, 4 tests.
- `npm run check`: passed. This ran lint, typecheck, unit tests, component tests, and build.
- `npm run build`: passed as a standalone final build command.

`npm run test:e2e` was not run because Phase 1.6 changed only documentation and V2-scoped guardrail tests. No production route, shell, style, auth, mesa, ficha, convite, rolagem, ordem, or mobile behavior changed.

## 13. Remaining Risks Before Phase 2

- Phase 2 still needs to replace the old visual architecture rather than restyle it.
- Main route render paths still import legacy primitives until Phase 2 migration begins.
- Existing shell and E2E tests still assert old DOM markers and must be rewritten during Phase 2.
- Sheet UI remains the highest-risk migration area because visual components still carry direct `useWorkspace()` behavior and permission-sensitive sheet actions.
- The quarantined backup branch is useful evidence only; it should not be copied back into `main`.

## 14. Exact Recommended Phase 2 Execution Prompt Summary

> Execute Phase 2 V2 migration from clean `main` using `docs/visual-legacy-audit.md`, `docs/v2-reconciliation-report.md`, and `docs/v2-readiness-hardening-report.md` as contracts. Do not reuse the quarantined `compat.tsx` or `mesa-compat.tsx`. Create fresh V2 primitives under `src/components/nexus-v2/` without legacy imports or legacy shell class strings, then replace `ProtectedAppShell` with `nexus-platform-layout`, migrate Hub and Mesas first, continue through Personagens, Convites, Conta, then replace the mesa shell and migrate Geral, Fichas, Rolagens, Ordem, Livro, and Configuracoes. Preserve auth, workspace, permissions, invites, sessions, points, sheets, rolls, order, compendium, redirects, PT-BR product copy, and JSON import/export capability.
