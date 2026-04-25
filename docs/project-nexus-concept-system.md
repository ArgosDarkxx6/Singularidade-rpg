# Project Nexus Concept System

## Source Of Truth
- The approved concept is the visual contract for the remake.
- Your Gamer Profile informs platform rhythm: feed-first layout, personal identity, right rail, social context, and quick actions.
- Cobbledex informs mesa rhythm: compact tool shell, specialized modules, dense tables/lists, fixed rail, and clear active state.

## Product Topology
- Platform: `Hub`, `Mesas`, `Personagens`, `Convites`, `Conta`.
- Mesa: `Geral`, `Fichas`, `Rolagens`, `Ordem`, `Livro`, `Configuracoes`.
- Legacy `sessao` and `membros` URLs redirect to `Geral`.

## Layout Rules
- Desktop uses a narrow left rail, a short topbar, a central work surface, and an optional right tool rail.
- The rail expands as an overlay and never pushes content.
- Main content scrolls independently from rail and topbar.
- Mobile uses bottom navigation: platform has five primary items; mesa has `Geral`, `Fichas`, `Rolagens`, `Ordem`, and `Mais`.

## Visual Tokens
- Background: near-black navy with subtle cobalt/cyan atmosphere.
- Surfaces: two quiet layers only, no heavy stacked card system.
- Accent: cobalt blue for active state, primary action, and live focus.
- Radius: compact, normally `8px` to `14px`; large rounded blobs are legacy.
- Typography: concise, smaller headers, strong labels, no hero-scale app copy.

## Page Concepts
- Hub: activity feed in the center, active tables/invites/characters in the side rail.
- Mesas: operational list of campaign spaces with role, system, status, and direct entry.
- Personagens: personal character library with create/import/export/transfer/use actions.
- Convites: inbox and manual code/link acceptance.
- Conta: identity, account access, and participation summary.
- Geral: operational cockpit with session, members, invites, snapshots, and module access.
- Fichas: active sheet as the main body; GM roster in side rail/drawer; player empty state when unbound.
- Rolagens: roll controls, last result, and shared log.
- Ordem: tactical initiative queue and current turn controls.
- Livro: compact searchable reference, no editorial hero.
- Configuracoes: table administration, snapshots, leave/danger actions.

## Copy Rules
- Do not explain the redesign inside the UI.
- Do not use architecture words when a product label exists.
- Empty states must be brief and actionable.
- Technical detail belongs inside the action flow only when needed.
