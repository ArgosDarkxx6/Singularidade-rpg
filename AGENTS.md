# Project Nexus Working Rules

## Validation Commands
- Run `npm run check` before finishing meaningful frontend or application changes.
- Run `npm run test:e2e` before release or when navigation, auth, mesa, ficha, convite, rolagem, ordem, or mobile behavior changes.
- Run `npm run build` as the final local release gate.

## Product Copy
- Product UI must speak as finished software, not as implementation notes.
- Do not ship copy that explains architecture, migration, reorganization, design decisions, or "where things now live".
- Avoid terms such as `remake`, `workspace`, `dashboard`, `TXT removido`, `novo fluxo`, `fica aqui`, `sem competir`, `composer`, `roster`, `proxy`, and `presets` in user-visible UI.
- Use short labels, states, actions, errors, and confirmations that help the user act now.

## Visual Direction
- The old visual system is legacy. Do not preserve hero sections, inflated metric cards, explanatory cards, or dashboard mosaics.
- Follow the approved concept: dark premium UI, compact rail, short topbar, dense lists, functional right panels, cobalt accent, and mobile bottom navigation.
- Cards are allowed only when the card itself is the interaction unit. Prefer compact rows, panels, toolbars, drawers, and lists.

## Functional Compatibility
- Preserve auth, Supabase, Cloudflare Worker flows, ownership by UID, mesa roles, invites, sessions, snapshots, characters, rolls, order, compendium, and public URLs.
- Do not make destructive schema changes in this rewrite. Use additive migrations only if a real security or compatibility issue requires it.
- Players must never receive or see sheets from other players. Viewers must not receive sheet payloads.
- GM can operate mesa mechanics, but owner-only character core data remains protected.

## Done Definition
- Desktop and mobile must feel like the same new product, not a reskin of the previous UI.
- Main platform pages and mesa pages must be rebuilt in the new language.
- Legacy visual primitives and dead pages must be removed or isolated behind redirects.
- Copy regression checks, build, unit/component checks, and E2E must be green.
- Ask the user only for a real external blocker, missing credentials, or a product decision that cannot be inferred safely.
