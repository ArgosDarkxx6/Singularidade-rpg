# Project Nexus Phase 1 Visual Legacy Audit

Audit date: 2026-04-29

This report resumes the interrupted Phase 1 audit. It does not implement the V2 UI. The repository worktree already contains partial V2 implementation artifacts, so this audit treats committed `HEAD` (`03544a5`) as the source of truth for the legacy visual baseline and reports the dirty worktree separately.

Reference direction inspected:

- https://yourgamerprofile.com/feed
- https://www.cobbledex.info/
- https://www.cobbledex.info/team-builds
- https://www.cobbledex.info/evolution-guide
- https://www.cobbledex.info/servers
- Attached approved Project Nexus concept images and current screenshots.

## 1. Repository State

Resume state:

- Branch: `main`
- Commit: `03544a5` (`Stabilize join code e2e polling`)
- Staged files: none
- Worktree: dirty
- Existing audit file: `docs/visual-legacy-audit.md` was missing before this report was created.
- Existing docs: `docs/project-nexus-concept-system.md`
- `rg --files`: blocked in this Windows environment with `Acesso negado`; audit evidence used `git grep`, `git show HEAD:path`, `git diff`, `git ls-tree`, and PowerShell reads.

Dirty interrupted implementation files found on resume:

- Modified:
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
- Untracked:
  - `src/components/nexus-v2/`
  - `src/layouts/nexus-platform-layout.tsx`
  - `src/layouts/nexus-table-layout.tsx`

These dirty files are implementation artifacts from the interrupted V2 pass, not Phase 1 audit artifacts. They were not discarded or modified by this audit.

The current dirty diff shows 13 modified tracked files with roughly 751 insertions and 48 deletions. The diff changes `src/app/router.tsx` from `ProtectedAppShell` and `MesaLayout` to untracked V2 layouts and adds many `.n2-*` classes in `src/styles/global.css`. This confirms the interruption point: implementation had already begun before the audit report was persisted.

Recent UI-relevant commits:

- `5e01ef4 Finalize concept-first Project Nexus remake`
- `aa0f0f9 Remake Project Nexus concept UI`
- `7fa1903 feat: rebuild mesa surfaces and flows`
- `ec562d0 feat: launch platform hub and lock down mesa character access`
- `a1e4006 fix: finalize shell sheets and mobile polish`

Generated or local artifacts observed:

- `dist/`
- `.wrangler/state`
- `.wrangler/tmp`

## 2. Current Route Map

The committed baseline router imports `ProtectedAppShell` at `src/app/router.tsx` and lazy-loads `MesaLayout` for `/mesa/:slug`.

| Surface | Current route file at `HEAD` | Layout/shell path | Page primitives and panels | Workspace hook boundary | Legacy visual architecture? | Rewrite need |
|---|---|---|---|---|---|---|
| Hub | `src/routes/hub-page.tsx` | `src/layouts/protected-app-shell.tsx` | `NexusPageHeader`, `NexusPanel`, `NexusSectionHeader`, `UtilityPanel`, `.page-right-rail`, `.nexus-row` | `usePlatformHub` | Yes. It plugs a feed into the old shell/page rail contract. | Full V2 route rewrite. |
| Mesas | `src/routes/mesas-page.tsx` | `src/layouts/protected-app-shell.tsx` | `NexusPageHeader`, `NexusPanel`, `NexusSectionHeader`, `UtilityPanel`, `.page-right-rail`, `.nexus-row` | `usePlatformTables` | Yes. Large campaign list plus right-rail cards. | Full V2 route rewrite. |
| Personagens | `src/routes/my-characters-page.tsx` | `src/layouts/protected-app-shell.tsx` | `NexusPageHeader`, `NexusPanel`, `UtilityPanel`, old import/export panel flow | `useAccountCharacters` | Yes. Single large panel/list pattern; exposes `Nucleo` chip. | Full V2 route rewrite. |
| Convites | `src/routes/invites-page.tsx` | `src/layouts/protected-app-shell.tsx` | `NexusPageHeader`, `NexusPanel`, `NexusSectionHeader`, `UtilityPanel`, `.page-right-rail` | `usePlatformInvites` | Yes. Form/panel driven instead of concept inbox/status surface. | Full V2 route rewrite. |
| Conta | `src/routes/profile-page.tsx` | `src/layouts/protected-app-shell.tsx` | `NexusPanel`, `NexusSectionHeader`, `UtilityPanel`, `.page-right-rail` | `useAuth`, `usePlatformTables`, `useAccountCharacters` | Yes. Generic dashboard card grid. | Full V2 route rewrite. |
| Geral | `src/routes/mesa-overview-page.tsx` | `src/layouts/mesa-layout.tsx` | `MesaPageLead`, `MesaSectionPanel`, `MesaKeyValueRow`, `MesaLeadMeta`, `UtilityPanel`, `.page-shell` | `useMesaOverview` | Yes. Lead card plus stacked sections. | Full V2 route rewrite. |
| Fichas | `src/routes/mesa-sheets-page.tsx` | `src/layouts/mesa-layout.tsx` | `MesaPageLead`, `MesaSectionPanel`, `UtilityPanel`, legacy sheet components, `.page-shell` | `useMesaCharacters` | Yes, and highest risk because UI components also carry permissions/ownership flows. | Full V2 rewrite with careful security validation. |
| Rolagens | `src/routes/mesa-rolls-page.tsx` | `src/layouts/mesa-layout.tsx` | `MesaPageLead`, `MesaSectionPanel`, `MesaActionCard`, `MesaKeyValueRow`, `UtilityPanel`, `.page-shell` | `useMesaRolls` | Yes. Form/result/history panels rather than dense roll console. | Full V2 route rewrite. |
| Ordem | `src/routes/mesa-order-page.tsx` | `src/layouts/mesa-layout.tsx` | `MesaPageLead`, `MesaSectionPanel`, `MesaActionCard`, `MesaKeyValueRow`, `UtilityPanel`, `.page-shell` | `useMesaOrder` | Yes. Add-form/list stack rather than tactical board. | Full V2 route rewrite. |
| Livro / Compendio | `src/routes/mesa-compendium-page.tsx` | `src/layouts/mesa-layout.tsx` | `MesaPageLead`, `MesaSectionPanel`, `MesaRailCard`, `UtilityPanel`, `.page-shell`, `.page-right-rail` | `useMesaCompendium`, reference service | Yes. Editorial panel/rail composition. | Full V2 route rewrite. |
| Configuracoes | `src/routes/mesa-settings-page.tsx` | `src/layouts/mesa-layout.tsx` | `MesaPageLead`, `MesaSectionPanel`, `MesaKeyValueRow`, `UtilityPanel`, `.page-shell` | `useMesaSettings` | Yes. Admin form card stack. | Full V2 route rewrite. |

Functional route wrappers and redirects:

- `src/routes/protected-layout.tsx`: domain/routing readiness wrapper, preserve.
- `src/routes/guest-layout.tsx`: auth presentation wrapper, preserve unless V2 auth chrome is intentionally redesigned.
- `src/routes/root-redirect.tsx`: routing function, preserve.
- `src/routes/legacy-route-redirect.tsx`: compatibility redirect, preserve.
- `src/routes/mesa-legacy-section-redirect.tsx`: table section redirect, preserve.
- `src/app/router.tsx`: must be updated in V2 phase to point to new shells after they are ready.

## 3. Current Shell/Layout Map

| File | Classification | Evidence | Future action |
|---|---|---|---|
| `src/layouts/protected-app-shell.tsx` | Legacy visual architecture | Owns `.platform-shell`, `.app-shell-root`, `.app-shell-grid`, `.rail-shell`, `data-shell-layer="rail"`, `.app-topbar`, `.app-content-shell`, `.page-grid`. | Replace with `src/layouts/nexus-platform-layout.tsx`. Keep only routing/auth responsibilities outside the visual shell. |
| `src/layouts/mesa-layout.tsx` | Legacy visual architecture mixed with domain access logic | Owns mesa rail, topbar, content scroll region, `.page-grid`, invite preview/access state, active table switching, roster injection, mobile nav. | Replace visual shell with `src/layouts/nexus-table-layout.tsx`; preserve logic through `useMesaShell` and explicit access components. |
| `src/routes/protected-layout.tsx` | Domain/functional only | Uses `useWorkspace()` for workspace readiness and protected routing. | Preserve. |
| `src/routes/guest-layout.tsx` | Candidate to preserve | Auth-only page wrapper. | Preserve unless auth pages get a V2 pass later. |
| `src/routes/root-redirect.tsx` | Domain/functional only | Redirect behavior. | Preserve. |
| `src/routes/legacy-route-redirect.tsx` | Domain/functional only | Uses tables and online state for compatibility redirects. | Preserve. |
| `src/routes/mesa-legacy-section-redirect.tsx` | Domain/functional only | Redirects old mesa sections. | Preserve. |
| `src/styles/global.css` | Legacy global visual contract plus tokens | Defines `.app-shell-root`, `.app-shell-grid`, `.page-grid`, `.page-shell`, `.page-right-rail`, `.app-topbar`, `.app-content-shell`, `.rail-shell`, `.nexus-panel`, `.nexus-row`. | Keep tokens if useful, but V2 routes must avoid legacy classes. Delete/isolate legacy classes only after no consumers remain. |

Specific answers:

- The old "left rail + top block + stacked page cards" structure is produced by `src/layouts/protected-app-shell.tsx`, `src/layouts/mesa-layout.tsx`, and the global shell classes in `src/styles/global.css`.
- The current page skeleton is forced by `.page-grid`, `.page-shell`, `.page-right-rail`, `.app-content-shell`, and the `NexusPanel` / `MesaSectionPanel` primitives.
- `src/layouts/protected-app-shell.tsx` should be replaced by `nexus-platform-layout`.
- `src/layouts/mesa-layout.tsx` should be replaced by `nexus-table-layout`.
- The legacy shell files can be deleted later only after router, tests, and all route consumers have moved to V2.
- Auth and redirect wrappers should remain temporarily and are not visual blockers.

## 4. Legacy Visual Primitives

| Primitive path | Main exports/usages | Classification | Why it preserves the old look | V2 rule |
|---|---|---|---|---|
| `src/components/ui/nexus.tsx` | `NexusPanel`, `NexusPageHeader`, `NexusSectionHeader`, `NexusStat`, row/toolbar style primitives | Dangerous legacy dependency | It standardizes the page-header-plus-large-panel rhythm and lets old route composition survive under newer styling. | Ban from V2 route render paths. Replace with `components/nexus-v2/*`. |
| `src/components/ui/panel.tsx` | `Panel`, `UtilityPanel` | Must replace in route surfaces; can adapt only as low-level atom if isolated | It creates framed stacked panels and utility rails. | Ban direct route imports except if intentionally narrowed to a non-layout atom. |
| `src/components/ui/card.tsx` | `Card` | Must replace in V2 surfaces | Feeds old nested card hierarchy, especially sheet modules. | Ban in V2 main route render paths. |
| `src/components/shared/section-title.tsx` | `SectionTitle` | Must replace | Encourages explanatory card sections and old form/editor hierarchy. | Ban in V2 main route render paths. |
| `src/features/mesa/components/mesa-page-primitives.tsx` | `MesaPageLead`, `MesaSectionPanel`, `MesaActionCard`, `MesaKeyValueRow`, `MesaLeadMeta` | Dangerous legacy dependency | Hard-codes mesa lead block and section panels. | Ban from V2 mesa routes. |
| `src/features/mesa/components/mesa-section-primitives.tsx` | `MesaRailCard` | Must replace | Preserves right-rail card pattern. | Ban from V2 mesa routes. |
| `src/features/sheets/components/character-roster-panel.tsx` | Roster panel with direct `useWorkspace()` | Must replace carefully | Mixes old `Panel`/`UtilityPanel` composition with roster actions. | V2 sheet/roster must receive narrow props from `useMesaCharacters`. |
| `src/features/sheets/components/profile-editor.tsx` | Profile editor with `Card`, `SectionTitle`, `UtilityPanel` | Must replace carefully | Large sheet form cards; direct workspace mutation. | V2 sheet editor should be prop-driven or segmented. |
| `src/features/sheets/components/collections-panel.tsx` | Inventory/resources editor | Must replace carefully | Nested cards and direct workspace persistence. | Preserve behavior; replace visual shell. |
| `src/features/sheets/components/conditions-editor.tsx` | Conditions editor | Must replace carefully | `Card` + direct workspace mutation. | Preserve actions through a narrow contract. |
| `src/features/sheets/components/character-gallery-panel.tsx` | Gallery panel | Must replace carefully | Old card/gallery panel structure. | Replace with compact V2 media/list surface. |

Likely preservable UI atoms if kept layout-neutral:

- `src/components/ui/avatar.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/empty-state.tsx` only if restyled and not used as a large page filler
- `src/components/ui/field.tsx`
- icon usage through `lucide-react`

## 5. Main Route Import Dependency Matrix

| Route | Legacy visual dependencies at `HEAD` | Functional/domain dependencies to preserve | Imports to remove in V2 |
|---|---|---|---|
| `src/routes/hub-page.tsx` | `@components/ui/nexus`, `@components/ui/panel`, `.page-right-rail`, `.nexus-row` | `usePlatformHub`, system registry, domain types | `NexusPageHeader`, `NexusPanel`, `NexusSectionHeader`, `UtilityPanel`, legacy classes |
| `src/routes/mesas-page.tsx` | `@components/ui/nexus`, `@components/ui/panel`, `.page-right-rail`, `.nexus-row` | `usePlatformTables`, dialogs for create/join flows | legacy panels and right rail classes |
| `src/routes/my-characters-page.tsx` | `@components/ui/nexus`, `@components/ui/panel`, import/export panel flow | `useAccountCharacters`, character import/export logic | legacy panels; technical copy |
| `src/routes/invites-page.tsx` | `@components/ui/nexus`, `@components/ui/panel`, `.page-right-rail` | `usePlatformInvites`, invite preview/connect flows | legacy panels/right rail |
| `src/routes/profile-page.tsx` | `@components/ui/nexus`, `@components/ui/panel`, `.page-right-rail` | `useAuth`, `usePlatformTables`, `useAccountCharacters` | legacy account dashboard panels |
| `src/routes/mesa-overview-page.tsx` | `@components/ui/panel`, mesa page primitives, `.page-shell` | `useMesaOverview`, point/session/invite actions | `MesaPageLead`, `MesaSectionPanel`, `UtilityPanel` |
| `src/routes/mesa-sheets-page.tsx` | `@components/ui/panel`, mesa primitives, legacy sheet components, `.page-shell` | `useMesaCharacters`, sheet permission contracts | mesa primitives, direct old sheet UI imports after V2 replacement |
| `src/routes/mesa-rolls-page.tsx` | `@components/ui/panel`, mesa primitives, `.page-shell` | `useMesaRolls`, dice roll engine/log | `MesaActionCard`, `MesaSectionPanel`, `UtilityPanel` |
| `src/routes/mesa-order-page.tsx` | `@components/ui/panel`, mesa primitives, `.page-shell` | `useMesaOrder`, initiative/order actions | `MesaActionCard`, `MesaSectionPanel`, `UtilityPanel` |
| `src/routes/mesa-compendium-page.tsx` | `@components/ui/panel`, mesa primitives, mesa section primitives, `.page-shell`, `.page-right-rail` | `useMesaCompendium`, reference card search | `MesaPageLead`, `MesaSectionPanel`, `MesaRailCard`, `UtilityPanel` |
| `src/routes/mesa-settings-page.tsx` | `@components/ui/panel`, mesa primitives, `.page-shell` | `useMesaSettings`, ownership, backup, point restore, destructive action guards | `MesaPageLead`, `MesaSectionPanel`, `UtilityPanel` |

The future V2 rule should be enforceable by tests: main route render paths must not import legacy shells, legacy page primitives, or classes that recreate the previous panel/card skeleton.

## 6. Test Lock-In Findings

| Test file | Classification | Old UI assumptions | V2 action |
|---|---|---|---|
| `tests/e2e/smoke.spec.ts` | Layout expectation must be rewritten; behavioral coverage should be preserved | Asserts `[data-shell-layer="rail"]`, `[data-shell-layer="header"]`, `[data-scroll-region="content"]`, `.rail-shell-content`, rail hover expansion, fixed shell positions, old headings, `Exportar mesa JSON`, `Importar JSON`. | Replace with V2 navigation, accessibility, overflow, mobile nav, and behavior checks. Do not keep old DOM just to satisfy this spec. |
| `src/layouts/protected-app-shell.test.tsx` | Obsolete after V2 shell | Asserts current shell layer markers and persistent shell structure. | Replace with `nexus-platform-layout` tests. |
| `src/layouts/mesa-layout.test.tsx` | Layout expectation must be rewritten; some access behavior preserved | Asserts `MesaLayout`, shell layer markers, viewer hides Fichas, current mesa nav. | Replace with `nexus-table-layout` tests and keep role/access assertions. |
| `src/routes/mesa-overview-page.test.tsx` | Behavioral and copy/layout mixed | Preserves create point/session behavior but uses old page copy/hierarchy. | Keep behavior; update copy/hierarchy for V2. |
| `src/routes/mesa-rolls-page.test.tsx` | Behavioral and layout mixed | Roll behavior is useful; panel/copy assumptions may be old. | Preserve roll assertions; update layout selectors. |
| `src/routes/mesa-sheets-page.test.tsx` | Security/behavioral coverage critical; copy expectations must update | Asserts `Importar JSON`, `Exportar mesa JSON`, player/GM visibility and payload behavior. | Keep permission tests; rename copy and update layout selectors. |
| `src/routes/my-characters-page.test.tsx` | Behavioral and copy mixed | Asserts `Importar JSON`. | Preserve import behavior; update visible label. |
| `src/features/workspace/copy-regression.test.ts` | Preserve and expand | Already bans several backstage strings including visible snapshot language. | Add V2 scan targets and import/copy ban rules. |

Future rule: V2 must not preserve old UI just to make tests pass. Tests should validate product behavior, accessibility, permissions, and responsive navigation.

## 7. User-Facing Copy Findings

Copy that must change or be carefully handled in V2:

- `Nucleo` / visible `Núcleo` in `src/routes/my-characters-page.tsx`: exposes CharacterCore implementation. Replace with `Pessoal`, `Biblioteca`, or remove the chip.
- `Importar JSON` in `src/routes/my-characters-page.tsx` and `src/routes/mesa-sheets-page.tsx`: technically correct but backstage-facing. Prefer `Importar arquivo`.
- `Exportar JSON` / `Exportar mesa JSON` in sheet routes/tests: prefer `Exportar arquivo`, `Exportar ficha`, or `Exportar mesa` depending on action.
- Visible `Snapshot`: must remain banned. User-facing state save language should be `Ponto`. Existing route usage already maps new points as `Ponto ...`, but internal names still use `snapshot`.
- Internal `snapshot` in schemas, Supabase backend, types, hooks, and database contracts is acceptable unless a safe migration is intentionally planned.
- `workspace`, `dashboard`, `composer`, `proxy`, `presets`, `roster`, `novo fluxo`, `fica aqui`, `sem competir`, `TXT removido`: keep banned from user-visible V2 UI. Some occurrences in content/data/test files may be internal or rulebook/content copy and should be reviewed case by case, not blindly renamed.

## 8. Functional Engine Boundary

Preserve conceptually:

- Auth/provider/service/schema: `src/features/auth`, `src/services/auth`, `src/schemas/auth.ts`.
- Supabase integration and contracts: `src/features/workspace/supabase-backend.ts`, generated Supabase types, migrations.
- Cloudflare Worker and runtime backend: worker files and `src/features/workspace/runtime-backend.ts`.
- Workspace engine/provider: `src/features/workspace/backend.ts`, `src/features/workspace/use-workspace.tsx`.
- Segmented hooks: `src/features/workspace/hooks/use-workspace-segments.ts`.
- Existing public hook boundaries:
  - `usePlatformHub`
  - `usePlatformTables`
  - `usePlatformInvites`
  - `useAccountCharacters`
  - `useMesaShell`
  - `useMesaOverview`
  - `useMesaCharacters`
  - `useMesaRolls`
  - `useMesaOrder`
  - `useMesaCompendium`
  - `useMesaSettings`
  - `useMesaInvites` if retained by existing flows
- Permissions, UID ownership, GM/player/viewer roles, invite/join code flows, sessions, snapshots/points, sheets, CharacterCore, table character instances, JSON import/export, rolls, roll log, initiative/order, compendium/book data, legacy redirects, and security tests.

Areas mixing function and legacy visual composition:

- `src/layouts/mesa-layout.tsx`: visual shell plus active table access, invite preview, mobile nav, table switching, and route recovery. V2 should move the visual shell out while preserving `useMesaShell` behavior.
- `src/features/sheets/components/*`: direct `useWorkspace()` plus old `Card`/`Panel`/`SectionTitle` composition. These are high-risk because they combine sheet payload/security behavior with visual structure.
- Main route files: most already use segmented hooks, but render directly into legacy page primitives and CSS classes.

Risk level by feature:

- Auth and redirects: low risk if untouched.
- Platform hub/tables/invites/account: medium risk; segmented hooks exist.
- Mesa overview/rolls/order/compendium/settings: medium risk; segmented hooks exist but UI shape is old.
- Mesa sheets: high risk; direct workspace usage and player/GM/viewer payload restrictions must be preserved.

## 9. Page-by-Page Visual Delta

| Page | Current old-layout residue | Missing from approved concept/YGP/Cobbledex direction | First replacement target | V2 components needed |
|---|---|---|---|---|
| Hub | Old protected shell, page header, central panel plus right rail cards. | Stronger Project Nexus brand/topbar, living platform feed rhythm, compact avatar activity, less empty panel space. | Platform shell and feed surface. | `nexus-platform-layout`, `nexus-feed`, `nexus-panel`, `nexus-list`, `nexus-mobile-nav`. |
| Mesas | Campaign list plus two right cards; old panel hierarchy. | Active sessions, discovery, pending invites, compact operational density. | Campaign/session grid and right utility stack. | `nexus-table-card`, `nexus-invite-list`, `nexus-toolbar`, `nexus-panel`. |
| Personagens | Single large list panel; implementation copy; limited filtering/preview. | Filters, selected-sheet preview, compact card/grid/list switching, Cobbledex-like tool density. | Character browser and sheet preview. | `nexus-character-card`, `nexus-sheet-preview`, `nexus-toolbar`, `nexus-list`. |
| Convites | Form/code panels and thin right rail. | Inbox/status list, summary metrics, campaign grouping, quick actions. | Invite inbox. | `nexus-invite-list`, `nexus-panel`, `nexus-toolbar`. |
| Conta | Generic dashboard/account cards. | Compact profile/account/settings/security/activity rhythm like a real platform account area. | Settings/account panel layout. | `nexus-settings-list`, `nexus-panel`, `nexus-list`. |
| Geral | `MesaPageLead` and stacked section panels. | Table cockpit with session, members, objectives, resources, events, notes, quick actions visible together. | Table shell and overview cockpit. | `nexus-table-layout`, `nexus-table-panel`, `nexus-feed`, `nexus-list`, `nexus-toolbar`. |
| Fichas | Large sheet cascade; old roster rail; direct sheet component workspace usage. | Compact character header/tabs/stats, roster, conditions, actions, notes in operational side panels. | Sheet surface and roster contract. | `nexus-sheet`, `nexus-character-card`, `nexus-table-panel`, `nexus-list`. |
| Rolagens | Form/result/history cards. | Integrated roll console, result log, distribution and player roll density. | Roll console and log. | `nexus-roll-console`, `nexus-list`, `nexus-toolbar`, `nexus-panel`. |
| Ordem | Add-form/list-first structure. | Tactical initiative board, active turn, action controls, roll log. | Initiative board. | `nexus-order-board`, `nexus-roll-console`, `nexus-table-panel`. |
| Livro | Editorial cards and rail. | Compact searchable reference explorer with filters/data density. | Reference explorer layout. | `nexus-toolbar`, `nexus-list`, `nexus-panel`, dense data cards. |
| Configuracoes | Admin form card stack. | Settings-list navigation with focused details and compact security/integration panels. | Settings shell within table layout. | `nexus-settings-list`, `nexus-panel`, `nexus-toolbar`. |

The attached current screenshots show the legacy issue clearly: even where colors and density improved, the current app still relies on old route/page skeletons. The approved concept needs a different spatial contract: compact rails, short topbars, dense information panels, mobile bottom nav parity, and operational side panels.

## 10. Proposed `nexus-v2` Architecture Tree

Do not implement this in Phase 1. This is the target architecture for the next phase.

```text
src/components/nexus-v2/
  index.ts
  nexus-shell.tsx
  nexus-rail.tsx
  nexus-topbar.tsx
  nexus-mobile-nav.tsx
  nexus-panel.tsx
  nexus-list.tsx
  nexus-feed.tsx
  nexus-toolbar.tsx
  nexus-table-panel.tsx
  nexus-character-card.tsx
  nexus-sheet.tsx
  nexus-roll-console.tsx
  nexus-order-board.tsx
  nexus-invite-list.tsx
  nexus-settings-list.tsx
src/layouts/
  nexus-platform-layout.tsx
  nexus-table-layout.tsx
```

Component purposes:

- `nexus-platform-layout.tsx`: platform-only shell orchestration. Replaces visual responsibilities of `protected-app-shell.tsx`; uses protected routing but owns V2 platform chrome.
- `nexus-table-layout.tsx`: table-only shell orchestration. Replaces visual responsibilities of `mesa-layout.tsx`; preserves table access and invite/session behavior through `useMesaShell`.
- `nexus-shell.tsx`: shared UI-only shell grid primitives for frame, content region, and density rules.
- `nexus-rail.tsx`: compact icon rail for platform/table modes; replaces `.rail-shell`.
- `nexus-topbar.tsx`: compact topbar with brand/context/actions; replaces `.app-topbar`.
- `nexus-mobile-nav.tsx`: mobile bottom navigation for platform and mesa modes; replaces shell-specific mobile nav logic.
- `nexus-panel.tsx`: dense, small-radius panel primitive; replaces `NexusPanel`, `Panel`, and `UtilityPanel` for V2 render paths.
- `nexus-list.tsx`: compact row/list primitive; replaces `.nexus-row`, old list cards, and repeated panel rows.
- `nexus-feed.tsx`: activity/feed surface inspired by Your Gamer Profile; used by Hub and mesa activity/event surfaces.
- `nexus-toolbar.tsx`: dense action/filter/search toolbar, inspired by Cobbledex tooling.
- `nexus-table-panel.tsx`: table-only utility panels for members, objectives, resources, notes, session state.
- `nexus-character-card.tsx`: compact character summary for platform and mesa rosters.
- `nexus-sheet.tsx`: compact character sheet surface replacing legacy sheet editors and cards.
- `nexus-roll-console.tsx`: roll input/result/log module for Rolagens and table side panels.
- `nexus-order-board.tsx`: initiative/order board for Ordem and active table side contexts.
- `nexus-invite-list.tsx`: invite inbox/list/summary primitive for platform and mesa invite views.
- `nexus-settings-list.tsx`: settings navigation/detail primitive for Conta and table Configuracoes.

## 11. Route Migration Plan

Recommended order:

1. Resolve/quarantine the current dirty partial V2 implementation so the next phase starts intentionally.
2. Add V2 primitives and import-ban/copy-ban tests without migrating routes.
3. Replace platform shell with `nexus-platform-layout`.
4. Migrate Hub first to prove platform feed, account rail, mobile nav, and topbar behavior.
5. Migrate Mesas next to validate active table entry, create/join flows, and platform table density.
6. Migrate Personagens, Convites, and Conta using existing segmented hooks.
7. Replace mesa shell with `nexus-table-layout`, preserving redirects and access/invite logic.
8. Migrate Geral to validate the table cockpit and point/session/invite actions.
9. Migrate Fichas carefully, preserving viewer/player/GM restrictions and owner-only core protection.
10. Migrate Rolagens and Ordem as dense tools.
11. Migrate Livro and Configuracoes.
12. Remove or isolate legacy primitives only after all consumers and tests have moved.

Route-by-route plan:

| Route | Target shell/primitives | Preserve | Tests to update | Risk | Order |
|---|---|---|---|---|---|
| Hub | `nexus-platform-layout`, `nexus-feed`, `nexus-panel`, `nexus-list` | `usePlatformHub` | E2E hub navigation/feed accessibility | Medium | 4 |
| Mesas | `nexus-platform-layout`, `nexus-toolbar`, table/session cards, invite list | `usePlatformTables` | Create/join/open mesa behavior | Medium | 5 |
| Personagens | `nexus-character-card`, sheet preview, filters | `useAccountCharacters`, import/export behavior | Import/export and list behavior | Medium | 6 |
| Convites | `nexus-invite-list`, summary panels | `usePlatformInvites` | Invite code/link acceptance | Medium | 6 |
| Conta | `nexus-settings-list`, account panels | `useAuth`, table/character summaries | Account settings behavior | Low/medium | 6 |
| Mesa shell | `nexus-table-layout`, `nexus-rail`, `nexus-topbar`, `nexus-mobile-nav` | `useMesaShell`, redirects, access states | Layout tests and E2E navigation | High | 7 |
| Geral | `nexus-table-panel`, feed/list panels | `useMesaOverview` | Point/session/invite actions | Medium | 8 |
| Fichas | `nexus-sheet`, `nexus-character-card`, roster/conditions panels | `useMesaCharacters`, permission contracts | GM/player/viewer payload and actions | High | 9 |
| Rolagens | `nexus-roll-console`, roll log/list | `useMesaRolls` | Dice expression/result/log tests | Medium | 10 |
| Ordem | `nexus-order-board`, active turn panel | `useMesaOrder` | Initiative/order action tests | Medium | 10 |
| Livro | Reference explorer primitives | `useMesaCompendium`, reference search | Search/filter behavior | Low/medium | 11 |
| Configuracoes | `nexus-settings-list`, focused forms | `useMesaSettings` | Ownership/backup/security guards | Medium/high | 11 |

## 12. Import Ban List

V2 main route render paths must not import from or render through:

| Path/class | Reason | Current consumers | Replacement strategy | Delete later? |
|---|---|---|---|---|
| `src/layouts/protected-app-shell.tsx` | Owns old platform shell grid/rail/topbar/content contract. | `src/app/router.tsx`, shell tests. | `src/layouts/nexus-platform-layout.tsx`. | Yes, after migration and test rewrite. |
| `src/layouts/mesa-layout.tsx` | Owns old table shell grid/rail/topbar/content contract and roster injection. | `src/app/router.tsx`, shell tests. | `src/layouts/nexus-table-layout.tsx` plus `useMesaShell`. | Yes, after migration. |
| `src/components/ui/nexus.tsx` | Transitional primitives preserve large page panels and headers. | Platform routes and mesa primitives. | `src/components/nexus-v2/*`. | Maybe, after no consumers remain. |
| `src/components/ui/panel.tsx` | Old `Panel`/`UtilityPanel` layout wrappers. | Shells, routes, sheet components. | `nexus-panel` and route-specific dense panels. | Maybe, or isolate as legacy only. |
| `src/components/ui/card.tsx` | Old card hierarchy. | Sheet components. | V2 sheet/list/panel primitives. | Maybe, if no other valid atoms need it. |
| `src/components/shared/section-title.tsx` | Explanatory card section rhythm. | Sheet components. | V2 compact section labels/toolbars. | Yes if unused. |
| `src/features/mesa/components/mesa-page-primitives.tsx` | Hard-coded mesa lead/section/action card skeleton. | All main mesa route files. | V2 table panels and tool modules. | Yes after mesa migration. |
| `src/features/mesa/components/mesa-section-primitives.tsx` | Right-rail card primitive. | Compendium and mesa surfaces. | V2 list/panel primitives. | Yes after migration. |
| `src/features/sheets/components/character-roster-panel.tsx` | Direct workspace usage plus legacy panel UI. | `mesa-layout`, `mesa-sheets-page`. | V2 roster component driven by `useMesaCharacters`. | Replace, then delete/isolate. |
| `src/features/sheets/components/profile-editor.tsx` | Direct workspace usage plus old cards. | `mesa-sheets-page`. | V2 sheet editor contract. | Replace, then delete/isolate. |
| `src/features/sheets/components/collections-panel.tsx` | Direct workspace usage plus old cards. | `mesa-sheets-page`. | V2 inventory/resources panel. | Replace, then delete/isolate. |
| `src/features/sheets/components/conditions-editor.tsx` | Direct workspace usage plus old cards. | `mesa-sheets-page`. | V2 conditions panel. | Replace, then delete/isolate. |
| `src/features/sheets/components/character-gallery-panel.tsx` | Direct workspace usage plus old gallery cards. | `mesa-sheets-page`. | V2 gallery/media panel. | Replace, then delete/isolate. |

V2 route JSX/classes must not use:

- `.app-shell-root`
- `.app-shell-grid`
- `.app-topbar`
- `.app-content-shell`
- `.rail-shell`
- `.rail-shell-content`
- `.page-grid`
- `.page-shell`
- `.page-right-rail`
- `.nexus-panel`
- `.nexus-row`

## 13. Test and Validation Plan

Baseline before future rewrite:

- Reconcile the dirty partial implementation first.
- Run `npm run check` against a known baseline when the worktree state is intentional.

Future rewrite test updates:

- Add import-ban tests for V2 route render paths.
- Expand `src/features/workspace/copy-regression.test.ts` to scan V2 files and ban visible `Snapshot`, `workspace`, `dashboard`, `composer`, `proxy`, `presets`, `roster`, and migration/backstage copy.
- Replace `src/layouts/protected-app-shell.test.tsx` with `nexus-platform-layout` tests.
- Replace `src/layouts/mesa-layout.test.tsx` with `nexus-table-layout` tests.
- Rewrite `tests/e2e/smoke.spec.ts` away from old shell DOM selectors and toward accessibility/navigation/overflow/product behavior.
- Add mobile-specific tests for platform bottom nav and mesa bottom nav.
- Preserve/add sheet security tests:
  - Viewers must not receive sheet payloads.
  - Players only receive/operate their bound sheet.
  - GM can operate mesa mechanics without owning protected character core data.
- Keep behavior tests for invites, join codes, sessions, points, rolls, initiative/order, compendium search, and settings destructive confirmations.

Available scripts:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:unit`
- `npm run test:component`
- `npm run test:e2e`
- `npm run build`
- `npm run check` (`lint`, `typecheck`, `test`, `build`)

Final release gate for V2 phase:

1. `npm run check`
2. `npm run test:e2e`
3. `npm run build`

No tests were run during this Phase 1 report creation because this is a docs-only audit and the worktree already contains unrelated interrupted implementation changes.

## 14. Risks and Blockers

Primary blockers to a true V2 rewrite:

- Central shell lock-in: `protected-app-shell.tsx`, `mesa-layout.tsx`, and `global.css` still define the spatial contract for nearly every page.
- Primitive lock-in: `NexusPanel`, `UtilityPanel`, `MesaPageLead`, `MesaSectionPanel`, `Card`, and `SectionTitle` let old card/page composition survive under new styling.
- Test lock-in: E2E and shell tests assert old DOM structure and copy.
- Sheet risk: sheet UI components mix direct `useWorkspace()` behavior with legacy visual composition. This is the highest-risk area for permissions and data exposure.
- Dirty worktree risk: the current partial V2 implementation may conflict with a clean, plan-driven migration. It must be reconciled before implementation continues.

Secondary risks:

- Product copy drift back into implementation terms.
- Global CSS class reuse recreating the old layout even after component files change.
- Mobile and desktop drifting into different products if shell replacement only focuses on desktop.
- Reusing compatibility wrappers from the interrupted V2 work without confirming that they do not re-export legacy primitives under new names.

## 15. Recommended Next Prompt / Action

Recommended next implementation prompt:

> Using `docs/visual-legacy-audit.md` as the source of truth, reconcile the current dirty partial V2 implementation first. Then execute the V2 migration in the documented order. Add V2 primitives and import/copy-ban tests, replace `ProtectedAppShell` with `nexus-platform-layout`, migrate Hub and Mesas, then proceed through the platform and mesa routes. Do not import banned legacy visual files in main route render paths, and preserve all auth, workspace, permissions, invite, session, point, sheet, roll, order, compendium, and redirect behavior.

Phase 1 completion criteria:

- The legacy files that preserve the old layout are identified.
- The routes depending on those files are mapped.
- The visual primitives to replace are listed.
- Tests preserving old UI assumptions are listed.
- User-facing copy risks are listed.
- Functional engine boundaries are separated from visual architecture.
- A V2 architecture and route migration order are proposed.
- Import bans and validation gates are explicit.

This report completes Phase 1 audit output. It does not implement the V2 rewrite.
