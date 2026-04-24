begin;

create or replace function public.can_read_table_character(
  p_table_id uuid,
  p_character_id uuid,
  p_owner_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and (
      p_owner_id = auth.uid()
      or (p_table_id is not null and public.can_manage_table(p_table_id))
      or exists (
        select 1
        from public.table_memberships membership
        where membership.table_id = p_table_id
          and membership.user_id = auth.uid()
          and membership.active = true
          and membership.character_id = p_character_id
      )
    );
$$;

grant execute on function public.can_read_table_character(uuid, uuid, uuid) to authenticated;

drop policy if exists "Characters are visible to table members" on public.characters;
drop policy if exists "Characters are visible to owners and table managers" on public.characters;
create policy "Characters are visible to owners and table managers"
on public.characters
for select
to authenticated
using (public.can_read_table_character(table_id, id, owner_id));

drop policy if exists "Character resources are visible to table members" on public.character_resources;
drop policy if exists "Character resources are visible to owners and table managers" on public.character_resources;
create policy "Character resources are visible to owners and table managers"
on public.character_resources
for select
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_resources.character_id
      and public.can_read_table_character(c.table_id, c.id, c.owner_id)
  )
);

drop policy if exists "Character attributes are visible to table members" on public.character_attributes;
drop policy if exists "Character attributes are visible to owners and table managers" on public.character_attributes;
create policy "Character attributes are visible to owners and table managers"
on public.character_attributes
for select
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_attributes.character_id
      and public.can_read_table_character(c.table_id, c.id, c.owner_id)
  )
);

drop policy if exists "Character weapons are visible to table members" on public.character_weapons;
drop policy if exists "Character weapons are visible to owners and table managers" on public.character_weapons;
create policy "Character weapons are visible to owners and table managers"
on public.character_weapons
for select
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_weapons.character_id
      and public.can_read_table_character(c.table_id, c.id, c.owner_id)
  )
);

drop policy if exists "Character techniques are visible to table members" on public.character_techniques;
drop policy if exists "Character techniques are visible to owners and table managers" on public.character_techniques;
create policy "Character techniques are visible to owners and table managers"
on public.character_techniques
for select
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_techniques.character_id
      and public.can_read_table_character(c.table_id, c.id, c.owner_id)
  )
);

drop policy if exists "Character passives are visible to table members" on public.character_passives;
drop policy if exists "Character passives are visible to owners and table managers" on public.character_passives;
create policy "Character passives are visible to owners and table managers"
on public.character_passives
for select
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_passives.character_id
      and public.can_read_table_character(c.table_id, c.id, c.owner_id)
  )
);

drop policy if exists "Character vows are visible to table members" on public.character_vows;
drop policy if exists "Character vows are visible to owners and table managers" on public.character_vows;
create policy "Character vows are visible to owners and table managers"
on public.character_vows
for select
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_vows.character_id
      and public.can_read_table_character(c.table_id, c.id, c.owner_id)
  )
);

drop policy if exists "Character inventory items are visible to table members" on public.character_inventory_items;
drop policy if exists "Character inventory items are visible to owners and table managers" on public.character_inventory_items;
create policy "Character inventory items are visible to owners and table managers"
on public.character_inventory_items
for select
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_inventory_items.character_id
      and public.can_read_table_character(c.table_id, c.id, c.owner_id)
  )
);

drop policy if exists "Character conditions are visible to table members" on public.character_conditions;
drop policy if exists "Character conditions are visible to owners and table managers" on public.character_conditions;
create policy "Character conditions are visible to owners and table managers"
on public.character_conditions
for select
to authenticated
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_conditions.character_id
      and public.can_read_table_character(c.table_id, c.id, c.owner_id)
  )
);

drop policy if exists "Table characters are visible to table members" on public.table_characters;
drop policy if exists "Table characters are visible to owners and table managers" on public.table_characters;
create policy "Table characters are visible to owners and table managers"
on public.table_characters
for select
to authenticated
using (public.can_read_table_character(table_id, character_id, owner_id));

drop policy if exists "Character cores are visible to owner and linked table members" on public.character_cores;
drop policy if exists "Character cores are visible to owners and linked table managers" on public.character_cores;
create policy "Character cores are visible to owners and linked table managers"
on public.character_cores
for select
to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1
    from public.table_characters table_character
    where table_character.core_id = character_cores.id
      and public.can_manage_table(table_character.table_id)
  )
);

drop policy if exists "Snapshots are visible to table members" on public.table_snapshots;
drop policy if exists "Snapshots are visible to table managers" on public.table_snapshots;
create policy "Snapshots are visible to table managers"
on public.table_snapshots
for select
to authenticated
using (public.can_manage_table(table_id));

drop policy if exists "Snapshots can be created by table players and managers" on public.table_snapshots;
drop policy if exists "Snapshots can be created by table managers" on public.table_snapshots;
create policy "Snapshots can be created by table managers"
on public.table_snapshots
for insert
to authenticated
with check (public.can_manage_table(table_id));

update public.tables
set state = jsonb_set(
  jsonb_set(
    jsonb_set(coalesce(state, '{}'::jsonb), '{characters}', '[]'::jsonb, true),
    '{activeCharacterId}',
    to_jsonb(''::text),
    true
  ),
  '{log}',
  '[]'::jsonb,
  true
)
where state is not null
  and (
    (
      jsonb_typeof(coalesce(state -> 'characters', '[]'::jsonb)) = 'array'
      and jsonb_array_length(coalesce(state -> 'characters', '[]'::jsonb)) > 0
    )
    or (
      jsonb_typeof(coalesce(state -> 'log', '[]'::jsonb)) = 'array'
      and jsonb_array_length(coalesce(state -> 'log', '[]'::jsonb)) > 0
    )
    or coalesce(state ->> 'activeCharacterId', '') <> ''
  );

commit;
